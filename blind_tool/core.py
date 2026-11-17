"""기록물 비식별(블라인드) 처리 도구 - 핵심 로직.

GUI(app.py)와 분리되어 있어 단독으로 테스트할 수 있습니다.

원칙
- 원본 파일은 절대 수정하지 않는다.
- 블라인드 박스는 위치를 옮기거나 크기를 바꾸는 기능이 없다(생성/삭제만).
- 확정된 페이지의 박스는 변경할 수 없다(확정 해제 시 이력에 기록).
- 결과 PDF는 박스를 이미지 픽셀에 직접 덮어쓴 뒤 이미지로만 구성한다.
  텍스트 층, 주석, 레이어가 없으므로 박스를 들어내도 원문이 나오지 않는다.
- 내보낸 뒤 결과 PDF를 다시 열어 모든 박스 위치가 검게 덮였는지 검증하고,
  SHA-256 값을 안내표에 남겨 이후 변조 여부를 확인할 수 있게 한다.
"""

from __future__ import annotations

import datetime as _dt
import hashlib
import io
import json
import os
import re
import secrets
import shutil
import sys
from collections import OrderedDict
from dataclasses import dataclass, field, asdict

from PIL import Image, ImageDraw, ImageFont

import pymupdf

PROJECT_FILENAME = "_비식별작업.json"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"}
PDF_EXTS = {".pdf"}


# --------------------------------------------------------------------------
# 설정
# --------------------------------------------------------------------------

def app_dir() -> str:
    """실행 파일(또는 스크립트)이 있는 폴더."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def bundled_dir() -> str:
    return getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))


DEFAULT_CONFIG = {
    "categories": ["친생부모 성명(성 제외)", "기타 개인정보"],
    "delete_reasons": ["비공개 대상 문서", "기타"],
    "status_labels": {"public": "공개", "partial": "부분공개", "deleted": "비공개(삭제)"},
    "pdf_dpi": 300,
    "box_padding_px": 2,
    "jpeg_quality": 90,
    "require_all_confirmed": True,
    "lock_pdf_permissions": True,
    "attach_table_to_pdf": "none",
}


def load_config() -> dict:
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))
    for d in (app_dir(), bundled_dir()):
        p = os.path.join(d, "config.json")
        if os.path.isfile(p):
            with open(p, encoding="utf-8") as f:
                user = json.load(f)
            cfg.update({k: v for k, v in user.items() if not k.startswith("_")})
            break
    return cfg


def now_str() -> str:
    return _dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def natural_key(s: str):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


# --------------------------------------------------------------------------
# 데이터 모델
# --------------------------------------------------------------------------

@dataclass
class Box:
    id: int
    x0: int
    y0: int
    x1: int
    y1: int
    cat: str
    created: str = ""
    by: str = ""

    def rect(self):
        return (self.x0, self.y0, self.x1, self.y1)


@dataclass
class PageState:
    key: str            # "상대경로#쪽번호(0부터)"
    file: str           # 원본 파일 상대경로
    index: int          # 파일 내 쪽 번호(0부터)
    boxes: list = field(default_factory=list)
    deleted: bool = False
    delete_reason: str = ""
    locked: bool = False
    note: str = ""
    locked_by: str = ""
    locked_at: str = ""

    @property
    def label(self) -> str:
        return f"{self.file} p{self.index + 1}"


class ProjectError(Exception):
    pass


class LockedError(ProjectError):
    pass


class Project:
    """한 폴더(기록물 묶음)에 대한 작업 상태."""

    def __init__(self, folder: str, config: dict | None = None):
        self.folder = os.path.abspath(folder)
        self.config = config or load_config()
        self.pages: list[PageState] = []
        self.events: list[dict] = []
        self.user = ""
        self.next_box_id = 1
        self._cache: OrderedDict[str, Image.Image] = OrderedDict()
        self.missing_pages: list[str] = []
        self._scan()
        self._load_saved()

    # ---------------- 원본 스캔 ----------------
    def _scan(self):
        files = []
        for root, _dirs, names in os.walk(self.folder):
            # 결과 폴더는 원본으로 읽지 않는다
            if os.path.basename(root).startswith("_비식별결과"):
                _dirs[:] = []
                continue
            _dirs[:] = [d for d in _dirs if not d.startswith("_비식별결과")]
            for n in names:
                ext = os.path.splitext(n)[1].lower()
                if ext in IMAGE_EXTS or ext in PDF_EXTS:
                    files.append(os.path.relpath(os.path.join(root, n), self.folder))
        files.sort(key=natural_key)
        for rel in files:
            for i in range(self._page_count(rel)):
                self.pages.append(PageState(key=f"{rel}#{i}", file=rel, index=i))
        if not self.pages:
            raise ProjectError("폴더에 이미지(JPG/PNG/TIF/BMP)나 PDF 파일이 없습니다.")

    def _page_count(self, rel: str) -> int:
        path = os.path.join(self.folder, rel)
        ext = os.path.splitext(rel)[1].lower()
        if ext in PDF_EXTS:
            with pymupdf.open(path) as doc:
                return doc.page_count
        with Image.open(path) as im:
            return getattr(im, "n_frames", 1)

    # ---------------- 저장/불러오기 ----------------
    @property
    def project_path(self) -> str:
        return os.path.join(self.folder, PROJECT_FILENAME)

    def _load_saved(self):
        if not os.path.isfile(self.project_path):
            return
        with open(self.project_path, encoding="utf-8") as f:
            data = json.load(f)
        saved = {p["key"]: p for p in data.get("pages", [])}
        for pg in self.pages:
            s = saved.pop(pg.key, None)
            if not s:
                continue
            pg.boxes = [Box(**b) for b in s.get("boxes", [])]
            pg.deleted = s.get("deleted", False)
            pg.delete_reason = s.get("delete_reason", "")
            pg.locked = s.get("locked", False)
            pg.note = s.get("note", "")
            pg.locked_by = s.get("locked_by", "")
            pg.locked_at = s.get("locked_at", "")
        self.events = data.get("events", [])
        self.next_box_id = data.get("next_box_id", 1)
        if saved:
            # 작업 기록은 있는데 원본이 사라진 경우: 경고용으로 보관
            self.missing_pages = list(saved.keys())
        else:
            self.missing_pages = []

    def save(self):
        data = {
            "version": 1,
            "saved_at": now_str(),
            "next_box_id": self.next_box_id,
            "pages": [
                {**{k: v for k, v in asdict(p).items() if k != "boxes"},
                 "boxes": [asdict(b) for b in p.boxes]}
                for p in self.pages
            ],
            "events": self.events,
        }
        tmp = self.project_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.flush()
            os.fsync(f.fileno())
        if os.path.isfile(self.project_path):
            shutil.copy2(self.project_path, self.project_path + ".bak")
        os.replace(tmp, self.project_path)

    def log(self, action: str, page: PageState | None = None, detail: str = ""):
        self.events.append({
            "time": now_str(), "user": self.user, "action": action,
            "page": page.label if page else "", "detail": detail,
        })

    # ---------------- 이미지 ----------------
    def page_image(self, pg: PageState) -> Image.Image:
        """원본 페이지 이미지(RGB). 원본 파일은 읽기만 한다."""
        if pg.key in self._cache:
            self._cache.move_to_end(pg.key)
            return self._cache[pg.key]
        path = os.path.join(self.folder, pg.file)
        ext = os.path.splitext(pg.file)[1].lower()
        if ext in PDF_EXTS:
            with pymupdf.open(path) as doc:
                pix = doc[pg.index].get_pixmap(dpi=int(self.config["pdf_dpi"]), alpha=False)
                im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        else:
            with Image.open(path) as src:
                if getattr(src, "n_frames", 1) > 1:
                    src.seek(pg.index)
                im = src.convert("RGB")
        self._cache[pg.key] = im
        while len(self._cache) > 6:
            self._cache.popitem(last=False)
        return im

    def page_dpi(self, pg: PageState) -> float:
        ext = os.path.splitext(pg.file)[1].lower()
        if ext in PDF_EXTS:
            return float(self.config["pdf_dpi"])
        with Image.open(os.path.join(self.folder, pg.file)) as src:
            dpi = src.info.get("dpi")
        try:
            d = float(dpi[0]) if dpi else 0
        except (TypeError, ValueError):
            d = 0
        return d if d >= 50 else 300.0

    # ---------------- 편집 동작 ----------------
    def _check_editable(self, pg: PageState):
        if pg.locked:
            raise LockedError("확정된 페이지는 수정할 수 없습니다. 먼저 '확정 해제'를 하세요.")

    def add_box(self, pg: PageState, x0, y0, x1, y1, cat: str) -> Box:
        self._check_editable(pg)
        if pg.deleted:
            raise ProjectError("삭제 처리된 페이지에는 박스를 넣을 수 없습니다.")
        im = self.page_image(pg)
        x0, x1 = sorted((int(round(x0)), int(round(x1))))
        y0, y1 = sorted((int(round(y0)), int(round(y1))))
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(im.width, x1), min(im.height, y1)
        if x1 - x0 < 3 or y1 - y0 < 3:
            raise ProjectError("박스가 너무 작습니다.")
        b = Box(self.next_box_id, x0, y0, x1, y1, cat, now_str(), self.user)
        self.next_box_id += 1
        pg.boxes.append(b)
        self.log("박스 추가", pg, f"#{b.id} {cat} ({x0},{y0})-({x1},{y1})")
        self.save()
        return b

    def remove_box(self, pg: PageState, box_id: int):
        self._check_editable(pg)
        for b in pg.boxes:
            if b.id == box_id:
                pg.boxes.remove(b)
                self.log("박스 삭제", pg, f"#{b.id} {b.cat}")
                self.save()
                return
        raise ProjectError("박스를 찾을 수 없습니다.")

    def set_deleted(self, pg: PageState, deleted: bool, reason: str = ""):
        self._check_editable(pg)
        if deleted and not reason:
            raise ProjectError("삭제 사유를 선택하세요.")
        pg.deleted = deleted
        pg.delete_reason = reason if deleted else ""
        self.log("페이지 삭제" if deleted else "페이지 삭제 취소", pg, reason)
        self.save()

    def set_note(self, pg: PageState, note: str):
        self._check_editable(pg)
        if note != pg.note:
            pg.note = note
            self.log("비고 수정", pg, note)
            self.save()

    def lock(self, pg: PageState):
        if pg.locked:
            return
        pg.locked = True
        pg.locked_by = self.user
        pg.locked_at = now_str()
        state = "삭제" if pg.deleted else f"박스 {len(pg.boxes)}개"
        self.log("페이지 확정", pg, state)
        self.save()

    def unlock(self, pg: PageState, reason: str = ""):
        if not pg.locked:
            return
        pg.locked = False
        pg.locked_by = pg.locked_at = ""
        self.log("확정 해제", pg, reason)
        self.save()

    # ---------------- 집계 ----------------
    def status(self, pg: PageState) -> str:
        lab = self.config["status_labels"]
        if pg.deleted:
            return lab["deleted"]
        return lab["partial"] if pg.boxes else lab["public"]

    def progress(self):
        done = sum(1 for p in self.pages if p.locked)
        return done, len(self.pages)


# --------------------------------------------------------------------------
# 내보내기
# --------------------------------------------------------------------------

def burn_in(img: Image.Image, boxes, pad: int) -> Image.Image:
    """박스를 이미지 픽셀에 직접 덮어쓴 새 이미지(원본 이미지는 그대로)."""
    out = img.convert("RGB").copy()
    d = ImageDraw.Draw(out)
    for b in boxes:
        x0, y0, x1, y1 = b.rect()
        d.rectangle([max(0, x0 - pad), max(0, y0 - pad),
                     min(out.width, x1 + pad) - 1, min(out.height, y1 + pad) - 1],
                    fill=(0, 0, 0))
    return out


def find_korean_font() -> str | None:
    cands = [
        os.path.join(app_dir(), "fonts", "font.ttf"),
        os.path.join(bundled_dir(), "fonts", "font.ttf"),
        r"C:\Windows\Fonts\malgun.ttf",
        r"C:\Windows\Fonts\gulim.ttc",
        r"C:\Windows\Fonts\batang.ttc",
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/Library/Fonts/AppleGothic.ttf",
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    ]
    for c in cands:
        if os.path.isfile(c):
            return c
    return None


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def summarize_cats(boxes) -> str:
    cnt: OrderedDict[str, int] = OrderedDict()
    for b in boxes:
        cnt[b.cat] = cnt.get(b.cat, 0) + 1
    return ", ".join(f"{k} {v}" for k, v in cnt.items())


TABLE_COLUMNS = ["연번", "원본 파일", "원본 쪽", "출력 쪽", "처리 구분",
                 "비식별 항목(개수)", "가린 영역 수", "삭제 사유", "비고", "확정자", "확정 일시"]


def build_rows(project: Project):
    rows, out_no = [], 0
    for i, pg in enumerate(project.pages, 1):
        if pg.deleted:
            out_page = "-"
        else:
            out_no += 1
            out_page = out_no
        rows.append([
            i, pg.file, pg.index + 1, out_page, project.status(pg),
            "" if pg.deleted else summarize_cats(pg.boxes),
            0 if pg.deleted else len(pg.boxes),
            pg.delete_reason, pg.note, pg.locked_by, pg.locked_at,
        ])
    return rows


def build_summary(project: Project, pdf_name: str, digest: str, verify_msg: str):
    total = len(project.pages)
    deleted = sum(1 for p in project.pages if p.deleted)
    partial = sum(1 for p in project.pages if not p.deleted and p.boxes)
    boxes = [b for p in project.pages if not p.deleted for b in p.boxes]
    return [
        ("대상 기록물", os.path.basename(project.folder)),
        ("원본 쪽수", total),
        ("출력 쪽수", total - deleted),
        ("공개 쪽수", total - deleted - partial),
        ("부분공개 쪽수", partial),
        ("비공개(삭제) 쪽수", deleted),
        ("가린 영역 총수", len(boxes)),
        ("항목별 합계", summarize_cats(boxes) or "-"),
        ("처리자", project.user or "-"),
        ("내보낸 일시", now_str()),
        ("결과 PDF", pdf_name),
        ("결과 PDF SHA-256", digest),
        ("검증 결과", verify_msg),
    ]


def write_xlsx(path, summary, rows, events):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

    wb = Workbook()
    ws = wb.active
    ws.title = "비식별 안내표"
    thin = Side(style="thin", color="999999")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    head_fill = PatternFill("solid", fgColor="DDE3EA")

    ws.append(["기록물 비식별 처리 안내표"])
    ws["A1"].font = Font(size=14, bold=True)
    ws.append([])
    for k, v in summary:
        ws.append([k, v])
        ws.cell(ws.max_row, 1).font = Font(bold=True)
    ws.append([])
    ws.append(TABLE_COLUMNS)
    hr = ws.max_row
    for c in range(1, len(TABLE_COLUMNS) + 1):
        cell = ws.cell(hr, c)
        cell.font = Font(bold=True)
        cell.fill = head_fill
        cell.border = border
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    for r in rows:
        ws.append(r)
        for c in range(1, len(r) + 1):
            cell = ws.cell(ws.max_row, c)
            cell.border = border
            cell.alignment = Alignment(vertical="top", wrap_text=True)
    widths = [6, 28, 8, 8, 12, 40, 10, 24, 24, 10, 19]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[ws.cell(1, i).column_letter].width = w
    ws.freeze_panes = ws.cell(hr + 1, 1)

    ws2 = wb.create_sheet("처리 이력")
    ws2.append(["일시", "작업자", "동작", "페이지", "내용"])
    for c in range(1, 6):
        ws2.cell(1, c).font = Font(bold=True)
        ws2.cell(1, c).fill = head_fill
    for e in events:
        ws2.append([e["time"], e["user"], e["action"], e["page"], e["detail"]])
    for col, w in zip("ABCDE", [19, 10, 14, 30, 50]):
        ws2.column_dimensions[col].width = w
    wb.save(path)


def render_table_pages(summary, rows) -> list[Image.Image]:
    """안내표를 A4 가로 이미지 페이지(150dpi)로 그린다."""
    W, H, M = 1754, 1240, 60
    font_path = find_korean_font()

    def F(size):
        if font_path:
            return ImageFont.truetype(font_path, size)
        return ImageFont.load_default()

    f_title, f_txt, f_small = F(34), F(20), F(18)
    cols = [("연번", 60), ("원본 파일", 300), ("원본 쪽", 80), ("출력 쪽", 80),
            ("처리 구분", 130), ("비식별 항목(개수)", 520), ("영역 수", 80), ("삭제 사유 / 비고", 384)]

    def wrap(text, font, width):
        text = str(text)
        lines, cur = [], ""
        for ch in text:
            if font.getlength(cur + ch) > width - 12:
                lines.append(cur)
                cur = ch
            else:
                cur += ch
        lines.append(cur)
        return lines

    pages, page, d, y = [], None, None, 0

    def new_page(first: bool):
        nonlocal page, d, y
        page = Image.new("RGB", (W, H), "white")
        d = ImageDraw.Draw(page)
        y = M
        if first:
            d.text((M, y), "기록물 비식별 처리 안내표", font=f_title, fill="black")
            y += 60
            for k, v in summary:
                d.text((M, y), f"{k}", font=f_txt, fill="black")
                for j, ln in enumerate(wrap(v, f_txt, W - 2 * M - 260)):
                    d.text((M + 260, y + j * 26), ln, font=f_txt, fill="black")
                y += 26 * max(1, len(wrap(v, f_txt, W - 2 * M - 260)))
            y += 20
        x = M
        d.rectangle([M, y, W - M, y + 34], fill=(221, 227, 234), outline="gray")
        for name, w in cols:
            d.text((x + 6, y + 6), name, font=f_small, fill="black")
            d.line([x, y, x, y + 34], fill="gray")
            x += w
        y += 34
        pages.append(page)

    new_page(True)
    for r in rows:
        cells = [r[0], r[1], r[2], r[3], r[4], r[5], r[6],
                 " / ".join(s for s in (r[7], r[8]) if s)]
        wrapped = [wrap(c, f_small, w) for c, (_n, w) in zip(cells, cols)]
        h = 10 + 24 * max(len(wl) for wl in wrapped)
        if y + h > H - M:
            new_page(False)
        x = M
        for wl, (_n, w) in zip(wrapped, cols):
            for j, ln in enumerate(wl):
                d.text((x + 6, y + 5 + j * 24), ln, font=f_small, fill="black")
            d.rectangle([x, y, x + w, y + h], outline="gray")
            x += w
        y += h
    for i, p in enumerate(pages, 1):
        ImageDraw.Draw(p).text((W - M - 120, H - 40), f"{i} / {len(pages)}", font=f_small, fill="gray")
    return pages


def _image_page(doc, img: Image.Image, dpi: float, quality: int):
    w_pt, h_pt = img.width * 72.0 / dpi, img.height * 72.0 / dpi
    page = doc.new_page(width=w_pt, height=h_pt)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, subsampling=0, optimize=True)
    page.insert_image(page.rect, stream=buf.getvalue())


def verify_pdf(pdf_path: str, expected):
    """결과 PDF를 다시 열어 (쪽수, 텍스트 없음, 주석 없음, 박스 영역이 검은지) 검사.

    expected: [(이미지 폭, 이미지 높이, [박스...]), ...] 출력 순서대로
    """
    problems = []
    with pymupdf.open(pdf_path) as doc:
        if doc.page_count != len(expected):
            problems.append(f"쪽수 불일치: {doc.page_count} != {len(expected)}")
            return problems
        for n, (page, (iw, ih, boxes)) in enumerate(zip(doc, expected), 1):
            if page.get_text().strip():
                problems.append(f"{n}쪽: 텍스트 층이 있음")
            if list(page.annots()) or list(page.widgets()):
                problems.append(f"{n}쪽: 주석/양식 필드가 있음")
            if not boxes:
                continue
            zx, zy = iw / page.rect.width, ih / page.rect.height
            pix = page.get_pixmap(matrix=pymupdf.Matrix(zx, zy), alpha=False,
                                  colorspace=pymupdf.csGRAY)
            img = Image.frombytes("L", (pix.width, pix.height), pix.samples)
            for b in boxes:
                # 압축 경계 영향을 피해 안쪽 2px만 검사
                x0, y0, x1, y1 = b.x0 + 2, b.y0 + 2, b.x1 - 2, b.y1 - 2
                if x1 <= x0 or y1 <= y0:
                    continue
                region = img.crop((x0, y0, min(x1, img.width), min(y1, img.height)))
                lo, hi = region.getextrema()
                if hi > 60:
                    problems.append(f"{n}쪽 박스 #{b.id}: 덮이지 않은 픽셀(밝기 {hi})")
    return problems


def export(project: Project, out_root: str | None = None, attach_table: str | None = None,
           progress=None):
    """결과 PDF + 안내표(xlsx, pdf)를 만든다. 결과 파일 경로들을 반환."""
    cfg = project.config
    if cfg.get("require_all_confirmed", True):
        pending = [p.label for p in project.pages if not p.locked]
        if pending:
            raise ProjectError(f"확정하지 않은 페이지가 {len(pending)}개 있습니다.\n"
                               f"예: {', '.join(pending[:5])}")
    attach_table = attach_table or cfg.get("attach_table_to_pdf", "none")

    stamp = _dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    name = os.path.basename(project.folder.rstrip("\\/")) or "기록물"
    out_dir = os.path.join(out_root or project.folder, f"_비식별결과_{stamp}")
    os.makedirs(out_dir, exist_ok=False)
    pdf_path = os.path.join(out_dir, f"{name}_비식별.pdf")
    xlsx_path = os.path.join(out_dir, f"{name}_비식별안내표.xlsx")
    table_pdf_path = os.path.join(out_dir, f"{name}_비식별안내표.pdf")

    pad = int(cfg.get("box_padding_px", 2))
    quality = int(cfg.get("jpeg_quality", 90))
    keep = [p for p in project.pages if not p.deleted]
    expected = []

    doc = pymupdf.open()
    for i, pg in enumerate(keep, 1):
        if progress:
            progress(i, len(keep), pg.label)
        img = project.page_image(pg)
        burned = burn_in(img, pg.boxes, pad)
        _image_page(doc, burned, project.page_dpi(pg), quality)
        expected.append((img.width, img.height, pg.boxes))
        del burned
    doc.set_metadata({"title": f"{name} (비식별 처리본)", "producer": "기록물 비식별 처리 도구",
                      "creator": "기록물 비식별 처리 도구", "author": "", "subject": "",
                      "keywords": ""})
    doc.del_xml_metadata()

    rows = build_rows(project)
    if attach_table in ("front", "back"):
        pre = build_summary(project, os.path.basename(pdf_path), "(안내표 포함본이라 별도 산출)", "아래 참조")
        tpages = render_table_pages(pre, rows)
        tdoc = pymupdf.open()
        for tp in tpages:
            _image_page(tdoc, tp, 150, 92)
        if attach_table == "front":
            doc.insert_pdf(tdoc, start_at=0)
            expected = [(0, 0, [])] * len(tpages) + expected
        else:
            doc.insert_pdf(tdoc)
            expected = expected + [(0, 0, [])] * len(tpages)
        tdoc.close()

    save_kw = dict(garbage=4, deflate=True)
    if cfg.get("lock_pdf_permissions", True):
        save_kw.update(
            encryption=pymupdf.PDF_ENCRYPT_AES_256,
            owner_pw=secrets.token_urlsafe(24),   # 저장하지 않음 → 권한 해제 불가
            user_pw="",
            permissions=pymupdf.PDF_PERM_PRINT | pymupdf.PDF_PERM_PRINT_HQ
            | pymupdf.PDF_PERM_ACCESSIBILITY,
        )
    doc.save(pdf_path, **save_kw)
    doc.close()

    problems = verify_pdf(pdf_path, expected)
    verify_msg = "통과(모든 박스 영역 덮임 확인, 텍스트 층·주석 없음)" if not problems \
        else "실패: " + "; ".join(problems[:10])
    digest = sha256_file(pdf_path)
    summary = build_summary(project, os.path.basename(pdf_path), digest, verify_msg)

    project.log("내보내기", None, f"{os.path.basename(out_dir)} / {verify_msg} / SHA-256 {digest}")
    project.save()

    write_xlsx(xlsx_path, summary, rows, project.events)
    tdoc = pymupdf.open()
    for tp in render_table_pages(summary, rows):
        _image_page(tdoc, tp, 150, 92)
    tdoc.save(table_pdf_path, garbage=4, deflate=True)
    tdoc.close()

    with open(os.path.join(out_dir, "SHA256.txt"), "w", encoding="utf-8") as f:
        f.write(f"{digest}  {os.path.basename(pdf_path)}\n")

    return {"dir": out_dir, "pdf": pdf_path, "xlsx": xlsx_path, "table_pdf": table_pdf_path,
            "sha256": digest, "problems": problems}
