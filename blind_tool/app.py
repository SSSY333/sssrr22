"""기록물 비식별(블라인드) 처리 도구 - 화면(GUI).

실행: python app.py
완전 오프라인으로 동작하며 인터넷 연결을 사용하지 않습니다.
"""

from __future__ import annotations

import os
import subprocess
import sys
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk

from PIL import Image, ImageTk

import core

APP_TITLE = "기록물 비식별 처리 도구"
MARK = {"todo": "○", "done": "●", "deleted": "✕"}


class App:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.cfg = core.load_config()
        self.project: core.Project | None = None
        self.cur = 0
        self.scale = 1.0
        self.fit_mode = True
        self.tkimg = None
        self.drag_start = None
        self.rubber = None
        self.selected_box: int | None = None
        self.cat_var = tk.IntVar(value=0)
        self.user_var = tk.StringVar()
        self.reason_var = tk.StringVar()
        self.note_var = tk.StringVar()
        self.status_var = tk.StringVar(value="[폴더 열기]로 기록물 스캔 폴더를 선택하세요.")
        self.progress_var = tk.StringVar()

        root.title(APP_TITLE)
        root.geometry("1400x900")
        root.minsize(1000, 650)
        self._build_ui()
        self._bind_keys()
        root.protocol("WM_DELETE_WINDOW", self.on_close)

    # ------------------------------------------------------------------ UI
    def _build_ui(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure("Big.TButton", font=("", 12, "bold"), padding=8)

        top = ttk.Frame(self.root, padding=(6, 4))
        top.pack(side=tk.TOP, fill=tk.X)
        ttk.Button(top, text="폴더 열기", command=self.open_folder).pack(side=tk.LEFT)
        ttk.Label(top, text="  작업자:").pack(side=tk.LEFT)
        e = ttk.Entry(top, textvariable=self.user_var, width=12)
        e.pack(side=tk.LEFT)
        e.bind("<FocusOut>", lambda _e: self._apply_user())
        e.bind("<Return>", lambda _e: (self._apply_user(), self.canvas.focus_set()))
        ttk.Separator(top, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=8)
        ttk.Button(top, text="화면 맞춤", command=self.zoom_fit).pack(side=tk.LEFT)
        ttk.Button(top, text="확대 +", command=lambda: self.zoom(1.25)).pack(side=tk.LEFT)
        ttk.Button(top, text="축소 −", command=lambda: self.zoom(0.8)).pack(side=tk.LEFT)
        ttk.Separator(top, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=8)
        ttk.Button(top, text="내보내기 (PDF·안내표)", command=self.export).pack(side=tk.LEFT)
        ttk.Label(top, textvariable=self.progress_var, font=("", 11, "bold")).pack(side=tk.RIGHT)

        status = ttk.Label(self.root, textvariable=self.status_var, anchor="w",
                           relief=tk.SUNKEN, padding=(6, 2))
        status.pack(side=tk.BOTTOM, fill=tk.X)

        pw = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        pw.pack(fill=tk.BOTH, expand=True)

        # 왼쪽: 페이지 목록
        left = ttk.Frame(pw, padding=4)
        ttk.Label(left, text="페이지  (○ 미확정  ● 확정  ✕ 삭제)").pack(anchor="w")
        lf = ttk.Frame(left)
        lf.pack(fill=tk.BOTH, expand=True)
        self.page_list = tk.Listbox(lf, width=38, activestyle="none", exportselection=False,
                                    font=("", 10))
        sb = ttk.Scrollbar(lf, command=self.page_list.yview)
        self.page_list.config(yscrollcommand=sb.set)
        self.page_list.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        sb.pack(side=tk.RIGHT, fill=tk.Y)
        self.page_list.bind("<<ListboxSelect>>", self._on_page_select)
        pw.add(left, weight=0)

        # 가운데: 이미지
        mid = ttk.Frame(pw)
        self.canvas = tk.Canvas(mid, bg="#5a5a5a", highlightthickness=0, cursor="crosshair")
        hs = ttk.Scrollbar(mid, orient=tk.HORIZONTAL, command=self.canvas.xview)
        vs = ttk.Scrollbar(mid, orient=tk.VERTICAL, command=self.canvas.yview)
        self.canvas.config(xscrollcommand=hs.set, yscrollcommand=vs.set)
        self.canvas.grid(row=0, column=0, sticky="nsew")
        vs.grid(row=0, column=1, sticky="ns")
        hs.grid(row=1, column=0, sticky="ew")
        mid.rowconfigure(0, weight=1)
        mid.columnconfigure(0, weight=1)
        self.canvas.bind("<ButtonPress-1>", self._on_press)
        self.canvas.bind("<B1-Motion>", self._on_drag)
        self.canvas.bind("<ButtonRelease-1>", self._on_release)
        self.canvas.bind("<Configure>", lambda _e: self.fit_mode and self.render())
        self.canvas.bind("<MouseWheel>", self._on_wheel)
        self.canvas.bind("<Button-4>", lambda e: self._on_wheel(e, 120))
        self.canvas.bind("<Button-5>", lambda e: self._on_wheel(e, -120))
        pw.add(mid, weight=1)

        # 오른쪽: 작업 패널
        right = ttk.Frame(pw, padding=6, width=300)
        self.page_title = ttk.Label(right, text="-", font=("", 11, "bold"), wraplength=280)
        self.page_title.pack(anchor="w", pady=(0, 2))
        self.page_state = ttk.Label(right, text="", foreground="#555", wraplength=280)
        self.page_state.pack(anchor="w", pady=(0, 6))

        cf = ttk.LabelFrame(right, text="가릴 항목 (숫자키 1~9)", padding=4)
        cf.pack(fill=tk.X)
        for i, c in enumerate(self.cfg["categories"][:9]):
            ttk.Radiobutton(cf, text=f"{i + 1}. {c}", value=i, variable=self.cat_var).pack(anchor="w")

        bf = ttk.LabelFrame(right, text="이 페이지의 블라인드 박스", padding=4)
        bf.pack(fill=tk.BOTH, expand=True, pady=6)
        self.box_list = tk.Listbox(bf, height=8, exportselection=False, font=("", 10))
        self.box_list.pack(fill=tk.BOTH, expand=True)
        self.box_list.bind("<<ListboxSelect>>", self._on_box_select)
        r = ttk.Frame(bf)
        r.pack(fill=tk.X, pady=(4, 0))
        self.btn_del_box = ttk.Button(r, text="선택 박스 삭제 (Del)", command=self.delete_selected_box)
        self.btn_del_box.pack(side=tk.LEFT, expand=True, fill=tk.X)
        self.btn_undo = ttk.Button(r, text="마지막 취소 (Ctrl+Z)", command=self.undo_last)
        self.btn_undo.pack(side=tk.LEFT, expand=True, fill=tk.X)

        df = ttk.LabelFrame(right, text="페이지 삭제", padding=4)
        df.pack(fill=tk.X)
        self.reason_box = ttk.Combobox(df, textvariable=self.reason_var, state="readonly",
                                       values=self.cfg["delete_reasons"])
        self.reason_box.pack(fill=tk.X)
        self.btn_delete_page = ttk.Button(df, text="이 페이지 삭제", command=self.toggle_delete_page)
        self.btn_delete_page.pack(fill=tk.X, pady=(4, 0))

        nf = ttk.LabelFrame(right, text="비고 (안내표에 기록)", padding=4)
        nf.pack(fill=tk.X, pady=6)
        self.note_entry = ttk.Entry(nf, textvariable=self.note_var)
        self.note_entry.pack(fill=tk.X)
        self.note_entry.bind("<FocusOut>", lambda _e: self.save_note())
        self.note_entry.bind("<Return>", lambda _e: (self.save_note(), self.canvas.focus_set()))

        self.btn_lock = ttk.Button(right, text="페이지 확정 후 다음 (Enter)", style="Big.TButton",
                                   command=self.lock_and_next)
        self.btn_lock.pack(fill=tk.X, pady=(4, 2))
        self.btn_unlock = ttk.Button(right, text="확정 해제", command=self.unlock)
        self.btn_unlock.pack(fill=tk.X)

        ttk.Label(right, foreground="#666", justify=tk.LEFT, wraplength=280, font=("", 9), text=(
            "드래그=박스 추가 (이동·크기 변경 불가) · 확정 페이지는 수정 불가\n"
            "PgDn/PgUp 다음/이전 · Ctrl+휠 확대/축소")).pack(anchor="w", pady=(6, 0))
        pw.add(right, weight=0)

    def _bind_keys(self):
        r = self.root

        def guard(fn):
            def h(event):
                if isinstance(event.widget, (tk.Entry, ttk.Entry, ttk.Combobox)):
                    return None
                fn(event)
                return "break"
            return h

        for i in range(9):
            r.bind(str(i + 1), guard(lambda _e, i=i: i < len(self.cfg["categories"]) and self.cat_var.set(i)))
        r.bind("<Return>", guard(lambda _e: self.lock_and_next()))
        r.bind("<Next>", guard(lambda _e: self.goto(self.cur + 1)))
        r.bind("<Prior>", guard(lambda _e: self.goto(self.cur - 1)))
        r.bind("<Delete>", guard(lambda _e: self.delete_selected_box()))
        r.bind("<Control-z>", guard(lambda _e: self.undo_last()))
        r.bind("<Control-plus>", guard(lambda _e: self.zoom(1.25)))
        r.bind("<Control-equal>", guard(lambda _e: self.zoom(1.25)))
        r.bind("<Control-minus>", guard(lambda _e: self.zoom(0.8)))
        r.bind("<Control-0>", guard(lambda _e: self.zoom_fit()))

    # ------------------------------------------------------------ helpers
    @property
    def page(self) -> core.PageState | None:
        if not self.project:
            return None
        return self.project.pages[self.cur]

    def info(self, msg: str):
        self.status_var.set(msg)

    def _apply_user(self):
        if self.project:
            self.project.user = self.user_var.get().strip()

    def _need_user(self) -> bool:
        self._apply_user()
        if self.project and not self.project.user:
            name = simpledialog.askstring(APP_TITLE, "작업자 이름을 입력하세요 (안내표·이력에 기록됩니다).",
                                          parent=self.root)
            if not name or not name.strip():
                return False
            self.user_var.set(name.strip())
            self._apply_user()
        return True

    def _try(self, fn, *a):
        try:
            return fn(*a)
        except core.ProjectError as ex:
            messagebox.showwarning(APP_TITLE, str(ex), parent=self.root)
        return None

    # ------------------------------------------------------------ project
    def open_folder(self):
        folder = filedialog.askdirectory(title="기록물 스캔 폴더 선택", parent=self.root)
        if not folder:
            return
        self.load_folder(folder)

    def load_folder(self, folder: str):
        self.info("페이지를 읽는 중...")
        self.root.update_idletasks()
        try:
            proj = core.Project(folder, self.cfg)
        except Exception as ex:  # noqa: BLE001
            messagebox.showerror(APP_TITLE, f"폴더를 열 수 없습니다.\n{ex}", parent=self.root)
            self.info("")
            return
        self.project = proj
        proj.user = self.user_var.get().strip()
        if proj.missing_pages:
            messagebox.showwarning(APP_TITLE, "작업 기록에는 있으나 원본이 없는 페이지가 있습니다:\n"
                                   + "\n".join(proj.missing_pages[:10]), parent=self.root)
        self.root.title(f"{APP_TITLE} - {os.path.basename(proj.folder)}")
        self.page_list.delete(0, tk.END)
        for i in range(len(proj.pages)):
            self.page_list.insert(tk.END, self._list_text(i))
            self._color_item(i)
        first_todo = next((i for i, p in enumerate(proj.pages) if not p.locked), 0)
        self.goto(first_todo)
        self.info(f"{len(proj.pages)}쪽을 불러왔습니다. 작업 내용은 자동 저장됩니다 ({core.PROJECT_FILENAME}).")

    def _list_text(self, i: int) -> str:
        p = self.project.pages[i]
        mark = MARK["deleted"] if p.deleted else MARK["done"] if p.locked else MARK["todo"]
        if p.deleted and not p.locked:
            mark = "✕○"
        extra = "  삭제" if p.deleted else (f"  ■{len(p.boxes)}" if p.boxes else "")
        return f"{mark} {i + 1:>3}. {p.label}{extra}"

    def _color_item(self, i: int):
        p = self.project.pages[i]
        color = "#999999" if p.deleted else "#1a7f37" if p.locked else "#000000"
        self.page_list.itemconfig(i, foreground=color)

    def _refresh_list_item(self, i: int):
        sel = self.page_list.curselection()
        self.page_list.delete(i)
        self.page_list.insert(i, self._list_text(i))
        self._color_item(i)
        if sel:
            self.page_list.selection_set(sel[0])

    def _update_progress(self):
        done, total = self.project.progress()
        deleted = sum(1 for p in self.project.pages if p.deleted)
        self.progress_var.set(f"확정 {done} / {total}쪽   (삭제 {deleted})")

    def _on_page_select(self, _e=None):
        sel = self.page_list.curselection()
        if sel and sel[0] != self.cur:
            self.goto(sel[0])

    def goto(self, i: int):
        if not self.project:
            return
        self.save_note()
        i = max(0, min(i, len(self.project.pages) - 1))
        self.cur = i
        self.selected_box = None
        self.page_list.selection_clear(0, tk.END)
        self.page_list.selection_set(i)
        self.page_list.see(i)
        p = self.page
        self.note_var.set(p.note)
        self.reason_var.set(p.delete_reason)
        self.fit_mode = True
        self.render()
        self.refresh_panel()

    # ------------------------------------------------------------ drawing
    def zoom_fit(self):
        self.fit_mode = True
        self.render()

    def zoom(self, f: float):
        if not self.project:
            return
        self.fit_mode = False
        self.scale = max(0.05, min(4.0, self.scale * f))
        self.render()

    def render(self):
        if not self.project:
            return
        img = self.project.page_image(self.page)
        cw = max(50, self.canvas.winfo_width())
        ch = max(50, self.canvas.winfo_height())
        if self.fit_mode:
            self.scale = min(cw / img.width, ch / img.height) * 0.98
        w, h = max(1, int(img.width * self.scale)), max(1, int(img.height * self.scale))
        disp = img.resize((w, h), Image.LANCZOS if self.scale < 1 else Image.NEAREST)
        self.tkimg = ImageTk.PhotoImage(disp)
        c = self.canvas
        c.delete("all")
        ox, oy = max(0, (cw - w) // 2), max(0, (ch - h) // 2)
        self.offset = (ox, oy)
        c.create_image(ox, oy, image=self.tkimg, anchor="nw")
        c.config(scrollregion=(0, 0, max(cw, w + ox), max(ch, h + oy)))
        self._draw_boxes()

    def _draw_boxes(self):
        c, p, s = self.canvas, self.page, self.scale
        ox, oy = self.offset
        c.delete("box")
        for b in p.boxes:
            sel = b.id == self.selected_box
            outline = "#ff2a2a" if sel else ("#8a8a8a" if p.locked else "#ff9900")
            c.create_rectangle(ox + b.x0 * s, oy + b.y0 * s, ox + b.x1 * s, oy + b.y1 * s,
                               fill="black", outline=outline, width=3 if sel else 1, tags="box")
            c.create_text(ox + b.x0 * s + 2, oy + b.y0 * s - 2, anchor="sw", text=f"#{b.id}",
                          fill=outline, font=("", 9, "bold"), tags="box")
        if p.deleted:
            img = self.project.page_image(p)
            c.create_rectangle(ox, oy, ox + img.width * s, oy + img.height * s, fill="#888888",
                               stipple="gray50", outline="", tags="box")
            c.create_text(ox + img.width * s / 2, oy + img.height * s / 2,
                          text=f"삭제 처리된 페이지\n({p.delete_reason})", fill="#b00000",
                          font=("", 24, "bold"), justify=tk.CENTER, tags="box")

    def _to_img(self, ex, ey):
        ox, oy = self.offset
        return ((self.canvas.canvasx(ex) - ox) / self.scale,
                (self.canvas.canvasy(ey) - oy) / self.scale)

    def _on_press(self, e):
        self.canvas.focus_set()
        if not self.project:
            return
        self.drag_start = (self.canvas.canvasx(e.x), self.canvas.canvasy(e.y))
        self.rubber = None

    def _on_drag(self, e):
        if not self.drag_start or not self.project:
            return
        p = self.page
        if p.locked or p.deleted:
            return
        x0, y0 = self.drag_start
        x1, y1 = self.canvas.canvasx(e.x), self.canvas.canvasy(e.y)
        if self.rubber is None:
            self.rubber = self.canvas.create_rectangle(x0, y0, x1, y1, outline="#ff2a2a",
                                                       width=2, dash=(4, 2))
        else:
            self.canvas.coords(self.rubber, x0, y0, x1, y1)

    def _on_release(self, e):
        if not self.drag_start or not self.project:
            return
        x0, y0 = self.drag_start
        x1, y1 = self.canvas.canvasx(e.x), self.canvas.canvasy(e.y)
        self.drag_start = None
        if self.rubber is not None:
            self.canvas.delete(self.rubber)
            self.rubber = None
        p = self.page
        if abs(x1 - x0) < 4 and abs(y1 - y0) < 4:
            self._click_select(x1, y1)
            return
        if p.locked:
            self.info("확정된 페이지입니다. 수정하려면 [확정 해제]를 누르세요.")
            return
        if p.deleted:
            self.info("삭제 처리된 페이지입니다.")
            return
        if not self._need_user():
            return
        ox, oy = self.offset
        s = self.scale
        cat = self.cfg["categories"][self.cat_var.get()]
        b = self._try(self.project.add_box, p, (x0 - ox) / s, (y0 - oy) / s,
                      (x1 - ox) / s, (y1 - oy) / s, cat)
        if b:
            self.selected_box = b.id
            self.info(f"박스 #{b.id} 추가: {cat}")
            self._after_change()

    def _click_select(self, cx, cy):
        ox, oy = self.offset
        x, y = (cx - ox) / self.scale, (cy - oy) / self.scale
        hit = [b for b in self.page.boxes if b.x0 <= x <= b.x1 and b.y0 <= y <= b.y1]
        self.selected_box = hit[-1].id if hit else None
        self._draw_boxes()
        self.refresh_panel()

    def _on_wheel(self, e, delta=None):
        d = delta if delta is not None else e.delta
        if e.state & 0x0004:  # Ctrl
            self.zoom(1.15 if d > 0 else 1 / 1.15)
        elif e.state & 0x0001:  # Shift
            self.canvas.xview_scroll(-1 if d > 0 else 1, "units")
        else:
            self.canvas.yview_scroll(-3 if d > 0 else 3, "units")

    # ------------------------------------------------------------ panel
    def refresh_panel(self):
        p = self.page
        if not p:
            return
        self.page_title.config(text=f"{self.cur + 1} / {len(self.project.pages)}  ·  {p.label}")
        if p.locked:
            st = f"상태: 확정 ({p.locked_by or '-'}, {p.locked_at})"
        else:
            st = "상태: 미확정"
        st += f"  ·  처리 구분: {self.project.status(p)}"
        self.page_state.config(text=st)

        self.box_list.delete(0, tk.END)
        for b in p.boxes:
            self.box_list.insert(tk.END, f"#{b.id}  {b.cat}")
            if b.id == self.selected_box:
                self.box_list.selection_set(tk.END)

        editable = not p.locked
        for w in (self.btn_del_box, self.btn_undo, self.btn_delete_page, self.note_entry):
            w.state(["!disabled"] if editable else ["disabled"])
        self.reason_box.state(["!disabled", "readonly"] if editable else ["disabled"])
        self.btn_delete_page.config(text="페이지 삭제 취소" if p.deleted else "이 페이지 삭제")
        self.btn_lock.state(["disabled"] if p.locked else ["!disabled"])
        self.btn_unlock.state(["!disabled"] if p.locked else ["disabled"])
        self._update_progress()

    def _after_change(self):
        self._draw_boxes()
        self._refresh_list_item(self.cur)
        self.refresh_panel()

    def _on_box_select(self, _e=None):
        sel = self.box_list.curselection()
        if sel:
            self.selected_box = self.page.boxes[sel[0]].id
            self._draw_boxes()

    # ------------------------------------------------------------ actions
    def delete_selected_box(self):
        p = self.page
        if not p or self.selected_box is None:
            self.info("삭제할 박스를 먼저 선택하세요 (박스를 클릭하거나 목록에서 선택).")
            return
        if p.locked:
            self.info("확정된 페이지입니다. 수정하려면 [확정 해제]를 누르세요.")
            return
        if not messagebox.askyesno(APP_TITLE, f"박스 #{self.selected_box}을(를) 삭제할까요?\n"
                                   "삭제하면 해당 부분이 가려지지 않습니다.", parent=self.root):
            return
        self._try(self.project.remove_box, p, self.selected_box)
        self.info(f"박스 #{self.selected_box} 삭제")
        self.selected_box = None
        self._after_change()

    def undo_last(self):
        p = self.page
        if not p or not p.boxes:
            return
        if p.locked:
            self.info("확정된 페이지입니다. 수정하려면 [확정 해제]를 누르세요.")
            return
        b = p.boxes[-1]
        if not messagebox.askyesno(APP_TITLE, f"마지막 박스 #{b.id} ({b.cat})을(를) 취소할까요?",
                                   parent=self.root):
            return
        self._try(self.project.remove_box, p, b.id)
        self.selected_box = None
        self._after_change()

    def toggle_delete_page(self):
        p = self.page
        if not p or p.locked:
            return
        if not self._need_user():
            return
        if p.deleted:
            self._try(self.project.set_deleted, p, False, "")
        else:
            reason = self.reason_var.get()
            if not reason:
                messagebox.showinfo(APP_TITLE, "삭제 사유를 먼저 선택하세요.", parent=self.root)
                self.reason_box.focus_set()
                return
            if not messagebox.askyesno(APP_TITLE, f"이 페이지를 결과물에서 삭제할까요?\n사유: {reason}",
                                       parent=self.root):
                return
            self._try(self.project.set_deleted, p, True, reason)
        self.render()
        self._after_change()

    def save_note(self):
        p = self.page
        if p and not p.locked and self.note_var.get() != p.note:
            self._try(self.project.set_note, p, self.note_var.get().strip())

    def lock_and_next(self):
        p = self.page
        if not p:
            return
        if p.locked:
            self.goto(self.cur + 1)
            return
        if not self._need_user():
            return
        self.save_note()
        self.project.lock(p)
        self._refresh_list_item(self.cur)
        self.info(f"{self.cur + 1}쪽 확정 ({self.project.status(p)})")
        nxt = next((i for i in range(self.cur + 1, len(self.project.pages))
                    if not self.project.pages[i].locked), None)
        if nxt is None:
            self.refresh_panel()
            self._draw_boxes()
            done, total = self.project.progress()
            if done == total:
                messagebox.showinfo(APP_TITLE, "모든 페이지를 확정했습니다.\n[내보내기]로 PDF와 안내표를 만드세요.",
                                    parent=self.root)
            return
        self.goto(nxt)

    def unlock(self):
        p = self.page
        if not p or not p.locked:
            return
        reason = simpledialog.askstring(APP_TITLE, "확정을 해제하는 이유를 입력하세요 (처리 이력에 기록됩니다).",
                                        parent=self.root)
        if reason is None:
            return
        self.project.unlock(p, reason.strip())
        self._draw_boxes()
        self._refresh_list_item(self.cur)
        self.refresh_panel()

    # ------------------------------------------------------------ export
    def export(self):
        if not self.project:
            messagebox.showinfo(APP_TITLE, "먼저 폴더를 여세요.", parent=self.root)
            return
        if not self._need_user():
            return
        done, total = self.project.progress()
        if done < total and self.cfg.get("require_all_confirmed", True):
            todo = next(i for i, p in enumerate(self.project.pages) if not p.locked)
            messagebox.showwarning(APP_TITLE, f"확정하지 않은 페이지가 {total - done}개 있습니다.\n"
                                   f"모든 페이지를 확인·확정해야 내보낼 수 있습니다.", parent=self.root)
            self.goto(todo)
            return

        choice = self._ask_attach()
        if choice is None:
            return
        out_root = filedialog.askdirectory(title="결과를 저장할 폴더 선택 (취소 시 원본 폴더)",
                                           parent=self.root) or None

        win = tk.Toplevel(self.root)
        win.title("내보내는 중")
        win.transient(self.root)
        win.grab_set()
        lab = ttk.Label(win, text="준비 중...", padding=20, width=60)
        lab.pack()
        bar = ttk.Progressbar(win, length=400, maximum=len(self.project.pages))
        bar.pack(padx=20, pady=(0, 20))

        def prog(i, n, label):
            lab.config(text=f"{i} / {n}  {label}")
            bar.config(maximum=n, value=i)
            win.update()

        try:
            res = core.export(self.project, out_root, choice, prog)
        except Exception as ex:  # noqa: BLE001
            win.destroy()
            messagebox.showerror(APP_TITLE, f"내보내기 실패:\n{ex}", parent=self.root)
            return
        win.destroy()
        if res["problems"]:
            messagebox.showerror(APP_TITLE, "검증에서 문제가 발견되었습니다. 결과물을 사용하지 마세요.\n\n"
                                 + "\n".join(res["problems"][:10]), parent=self.root)
        else:
            messagebox.showinfo(APP_TITLE, "내보내기 완료 (검증 통과)\n\n"
                                f"결과 PDF: {os.path.basename(res['pdf'])}\n"
                                f"안내표: {os.path.basename(res['xlsx'])}, {os.path.basename(res['table_pdf'])}\n"
                                f"SHA-256: {res['sha256'][:16]}...", parent=self.root)
        self._open_path(res["dir"])

    def _ask_attach(self):
        win = tk.Toplevel(self.root)
        win.title("내보내기 설정")
        win.transient(self.root)
        win.grab_set()
        var = tk.StringVar(value=self.cfg.get("attach_table_to_pdf", "none"))
        ttk.Label(win, text="비식별 안내표를 어떻게 만들까요?", padding=(16, 12, 16, 4)).pack(anchor="w")
        for v, t in (("none", "별도 파일로만 (엑셀 + PDF)"),
                     ("front", "별도 파일 + 결과 PDF 맨 앞에도 첨부"),
                     ("back", "별도 파일 + 결과 PDF 맨 뒤에도 첨부")):
            ttk.Radiobutton(win, text=t, value=v, variable=var).pack(anchor="w", padx=24)
        result = {"v": None}
        bf = ttk.Frame(win, padding=12)
        bf.pack(fill=tk.X)

        def ok():
            result["v"] = var.get()
            win.destroy()

        ttk.Button(bf, text="내보내기", command=ok).pack(side=tk.RIGHT)
        ttk.Button(bf, text="취소", command=win.destroy).pack(side=tk.RIGHT, padx=6)
        self.root.wait_window(win)
        return result["v"]

    @staticmethod
    def _open_path(path):
        try:
            if sys.platform.startswith("win"):
                os.startfile(path)  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                subprocess.Popen(["open", path])
            else:
                subprocess.Popen(["xdg-open", path])
        except Exception:  # noqa: BLE001
            pass

    def on_close(self):
        self.save_note()
        self.root.destroy()


def main():
    root = tk.Tk()
    app = App(root)
    if len(sys.argv) > 1 and os.path.isdir(sys.argv[1]):
        root.after(100, lambda: app.load_folder(sys.argv[1]))
    root.mainloop()


if __name__ == "__main__":
    main()
