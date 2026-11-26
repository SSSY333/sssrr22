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
    "box_categories": [{"name": "기타", "rule": "", "guide": ""}],
    "delete_reasons": [{"name": "기타", "rule": "", "guide": ""}],
    "rules": [],
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


def cat_list(cfg) -> list[dict]:
    """가릴 항목 목록(문자열만 적힌 옛 설정도 지원)."""
    out = []
    for c in cfg.get("box_categories") or cfg.get("categories", []):
        out.append(c if isinstance(c, dict) else {"name": c, "rule": "", "guide": ""})
    return out


def reason_list(cfg) -> list[dict]:
    return [r if isinstance(r, dict) else {"name": r, "rule": "", "guide": ""}
            for r in cfg.get("delete_reasons", [])]


def rule_of(cfg, name: str, kind: str) -> str:
    items = cat_list(cfg) if kind == "box" else reason_list(cfg)
    return next((c.get("rule", "") for c in items if c["name"] == name), "")


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


def load_page_image(folder: str, pg: PageState, pdf_dpi: int = 300) -> Image.Image:
    """원본 페이지를 읽어 RGB 이미지로 돌려준다(원본은 읽기만 함, 스레드에서 호출 가능)."""
    path = os.path.join(folder, pg.file)
    ext = os.path.splitext(pg.file)[1].lower()
    if ext in PDF_EXTS:
        with pymupdf.open(path) as doc:
            pix = doc[pg.index].get_pixmap(dpi=pdf_dpi, alpha=False)
            return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    with Image.open(path) as src:
        if getattr(src, "n_frames", 1) > 1:
            src.seek(pg.index)
        return src.convert("RGB")


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
        im = load_page_image(self.folder, pg, int(self.config["pdf_dpi"]))
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

    def add_box(self, pg: PageState, x0, y0, x1, y1, cat: str, source: str = "") -> Box:
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
        self.log("박스 추가", pg, f"#{b.id} {cat} ({x0},{y0})-({x1},{y1}){' ' + source if source else ''}")
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


TABLE_COLUMNS = ["연번", "원본 파일", "원본 쪽", "출력 쪽", "처리 구분", "적용 기준",
                 "비식별 항목(개수)", "가린 영역 수", "삭제 사유", "비고", "확정자", "확정 일시"]


def build_rows(project: Project):
    """페이지별 처리 내역(내부용)."""
    rows, out_no = [], 0
    cfg = project.config
    for i, pg in enumerate(project.pages, 1):
        if pg.deleted:
            out_page = "-"
            rules = rule_of(cfg, pg.delete_reason, "reason")
        else:
            out_no += 1
            out_page = out_no
            rules = ", ".join(sorted({rule_of(cfg, b.cat, "box") or "기타" for b in pg.boxes},
                                     key=natural_key))
        rows.append([
            i, pg.file, pg.index + 1, out_page, project.status(pg), rules or ("기타" if pg.deleted else ""),
            "" if pg.deleted else summarize_cats(pg.boxes),
            0 if pg.deleted else len(pg.boxes),
            pg.delete_reason, pg.note, pg.locked_by, pg.locked_at,
        ])
    return rows


def compress_pages(nums) -> str:
    nums = sorted(set(nums))
    out, i = [], 0
    while i < len(nums):
        j = i
        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1:
            j += 1
        out.append(str(nums[i]) if i == j else f"{nums[i]}-{nums[j]}")
        i = j + 1
    return ", ".join(out)


def build_rule_rows(project: Project, page_offset: int = 0):
    """비식별 기준표 각 행에 '비식별 처리 면'을 채운다.

    부분 삭제: 결과 PDF의 쪽 번호(안내표를 앞에 붙이면 그만큼 밀린 번호)
    일체 삭제: 결과물에서 빠졌으므로 원본 기록물 기준 쪽 번호와 면 수
    """
    cfg = project.config
    partial: dict[str, list[int]] = {}
    whole: dict[str, list[int]] = {}
    out_no = 0
    for orig_no, pg in enumerate(project.pages, 1):
        if pg.deleted:
            r = rule_of(cfg, pg.delete_reason, "reason")
            if r:
                whole.setdefault(r, []).append(orig_no)
            continue
        out_no += 1
        for b in pg.boxes:
            r = rule_of(cfg, b.cat, "box")
            if r:
                partial.setdefault(r, []).append(out_no + page_offset)
    rows = []
    for rule in cfg.get("rules", []):
        rid = rule["id"]
        if rule["method"] == "whole":
            pages = whole.get(rid, [])
            cell = f"{len(pages)}면 삭제\n(원본 p. {compress_pages(pages)})" if pages else "-"
        else:
            pages = partial.get(rid, [])
            cell = f"p. {compress_pages(pages)}" if pages else "-"
        rows.append({**rule, "pages": cell,
                     "method_label": cfg.get("method_labels", {}).get(rule["method"], rule["method"])})
    return rows


def unmapped_items(project: Project):
    """기준표에 연결되지 않은(기타) 처리 중 비고가 없는 페이지."""
    cfg = project.config
    out = []
    for pg in project.pages:
        if pg.deleted:
            if not rule_of(cfg, pg.delete_reason, "reason") and not pg.note:
                out.append(pg.label)
        elif any(not rule_of(cfg, b.cat, "box") for b in pg.boxes) and not pg.note:
            out.append(pg.label)
    return out


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


def write_xlsx(path, summary, rows, events, rule_rows):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

    wb = Workbook()
    thin = Side(style="thin", color="999999")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    head_fill = PatternFill("solid", fgColor="DDE3EA")
    wrap_top = Alignment(vertical="top", wrap_text=True)

    def header(ws, cols):
        ws.append(cols)
        r = ws.max_row
        for c in range(1, len(cols) + 1):
            cell = ws.cell(r, c)
            cell.font = Font(bold=True)
            cell.fill = head_fill
            cell.border = border
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        return r

    # 1. 비식별 기준표 (입양인 안내용과 같은 내용)
    ws = wb.active
    ws.title = "비식별 기준표"
    ws.append(["비식별 기준표 (Redaction Summary Table)"])
    ws["A1"].font = Font(size=14, bold=True)
    ws.append([])
    header(ws, ["기준", "구분 (Category)", "비식별 대상 문서 및 정보 유형 (Type of Document/Information)",
                "비식별화 방식 (Redaction Type)", "비식별 처리 면 (Redaction Page)"])
    for r in rule_rows:
        ws.append([r["id"], r["group"], r["items"], r["method_label"], r["pages"]])
        for c in range(1, 6):
            ws.cell(ws.max_row, c).border = border
            ws.cell(ws.max_row, c).alignment = wrap_top
    for col, w in zip("ABCDE", [6, 28, 60, 18, 24]):
        ws.column_dimensions[col].width = w

    # 2. 페이지별 처리 내역 (내부용)
    ws1 = wb.create_sheet("페이지별 처리내역(내부)")
    ws1.append(["기록물 비식별 처리 내역 (내부용)"])
    ws1["A1"].font = Font(size=14, bold=True)
    ws1.append([])
    for k, v in summary:
        ws1.append([k, v])
        ws1.cell(ws1.max_row, 1).font = Font(bold=True)
    ws1.append([])
    hr = header(ws1, TABLE_COLUMNS)
    for r in rows:
        ws1.append(r)
        for c in range(1, len(r) + 1):
            ws1.cell(ws1.max_row, c).border = border
            ws1.cell(ws1.max_row, c).alignment = wrap_top
    widths = [6, 28, 8, 8, 12, 12, 40, 10, 30, 24, 10, 19]
    for i, w in enumerate(widths, 1):
        ws1.column_dimensions[ws1.cell(1, i).column_letter].width = w
    ws1.freeze_panes = ws1.cell(hr + 1, 1)

    # 3. 처리 이력
    ws2 = wb.create_sheet("처리 이력")
    header(ws2, ["일시", "작업자", "동작", "페이지", "내용"])
    for e in events:
        ws2.append([e["time"], e["user"], e["action"], e["page"], e["detail"]])
    for col, w in zip("ABCDE", [19, 10, 14, 30, 60]):
        ws2.column_dimensions[col].width = w
    wb.save(path)


# ---------------------------------------------------------------- 그리기 도구

def _font_factory():
    font_path = find_korean_font()

    def F(size):
        if font_path:
            return ImageFont.truetype(font_path, size)
        return ImageFont.load_default()
    return F


def _wrap(text, font, width) -> list[str]:
    """글자 단위 줄바꿈(영문은 가능하면 단어 단위). 줄바꿈 문자 유지."""
    lines = []
    for para in str(text).split("\n"):
        cur = ""
        for word in re.split(r"(\s+)", para):
            if font.getlength(cur + word) <= width:
                cur += word
                continue
            if cur.strip():
                lines.append(cur.rstrip())
                cur = ""
            word = word.lstrip()
            while font.getlength(word) > width:  # 아주 긴 단어는 글자 단위로
                k = 1
                while k < len(word) and font.getlength(word[:k + 1]) <= width:
                    k += 1
                lines.append(word[:k])
                word = word[k:]
            cur = word
        lines.append(cur.rstrip())
    return lines


def render_notice_pages(cfg, rule_rows, include_notice=True) -> list[Image.Image]:
    """입양인 안내용: 안내문 + 비식별 기준표(처리 면 기재). A4 세로 150dpi."""
    W, H, M = 1240, 1754, 90
    F = _font_factory()
    f_title, f_body, f_cell, f_head, f_small = F(30), F(21), F(17), F(17), F(15)
    pages = []

    if include_notice and cfg.get("notice_text"):
        page = Image.new("RGB", (W, H), "white")
        d = ImageDraw.Draw(page)
        y = M + 20
        for ln in _wrap(cfg.get("notice_title", ""), f_title, W - 2 * M):
            d.text((M, y), ln, font=f_title, fill="black")
            y += 42
        y += 30
        for para in cfg["notice_text"]:
            for ln in _wrap(para, f_body, W - 2 * M):
                d.text((M, y), ln, font=f_body, fill="black")
                y += 31
            y += 16
        pages.append(page)

    cols = [("구분\n(Category)", 230),
            ("비식별 대상 문서 및 정보 유형\n(Type of Document/Information)", 450),
            ("비식별화 방식\n(Redaction Type)", 180),
            ("비식별 처리 면\n(Redaction Page)", 200)]
    tw = sum(w for _n, w in cols)
    X0 = (W - tw) // 2
    lh = 22

    # 같은 구분(및 같은 유형)이 이어지면 셀을 합친다 (원본 표와 같은 모양)
    def spans(key):
        res, i = [], 0
        while i < len(rule_rows):
            j = i
            while j + 1 < len(rule_rows) and key(rule_rows[j + 1]) == key(rule_rows[i]):
                j += 1
            res.append((i, j))
            i = j + 1
        return res

    g_spans = spans(lambda r: r["group"])
    i_spans = spans(lambda r: (r["group"], r["items"]))
    heights = []
    for r in rule_rows:
        hs = [len(_wrap(r["method_label"], f_cell, cols[2][1] - 16)),
              len(_wrap(r["pages"], f_cell, cols[3][1] - 16))]
        heights.append(max(hs) * lh + 16)
    # 합친 셀의 글이 들어가도록 행 높이 보정
    for (a, b), col, key in [(s, 0, "group") for s in g_spans] + [(s, 1, "items") for s in i_spans]:
        need = len(_wrap(rule_rows[a][key], f_cell, cols[col][1] - 16)) * lh + 16
        have = sum(heights[a:b + 1])
        if need > have:
            extra = need - have
            for k in range(a, b + 1):
                heights[k] += extra // (b - a + 1) + 1

    page = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(page)
    y = M
    d.text((M, y), "비식별 기준표 (Redaction Summary Table)", font=f_title, fill="black")
    y += 60
    hh = 2 * lh + 16
    x = X0
    for name, w in cols:
        d.rectangle([x, y, x + w, y + hh], fill=(221, 227, 234), outline="black")
        for k, ln in enumerate(name.split("\n")):
            tw_ = f_head.getlength(ln)
            d.text((x + (w - tw_) / 2, y + 8 + k * lh), ln, font=f_head, fill="black")
        x += w
    y += hh
    tops = []
    for h in heights:
        tops.append(y)
        y += h

    def cell(col, a, b, text, center=False):
        x = X0 + sum(w for _n, w in cols[:col])
        w = cols[col][1]
        top, bot = tops[a], tops[b] + heights[b]
        d.rectangle([x, top, x + w, bot], outline="black")
        lines = _wrap(text, f_cell, w - 16)
        ty = top + 8 if not center else top + (bot - top - len(lines) * lh) / 2
        for k, ln in enumerate(lines):
            tx = x + 8 if not center else x + (w - f_cell.getlength(ln)) / 2
            d.text((tx, ty + k * lh), ln, font=f_cell, fill="black")

    for a, b in g_spans:
        cell(0, a, b, rule_rows[a]["group"], center=True)
    for a, b in i_spans:
        cell(1, a, b, rule_rows[a]["items"])
    for k, r in enumerate(rule_rows):
        cell(2, k, k, r["method_label"], center=True)
        cell(3, k, k, r["pages"], center=True)
    y += 24
    for fn in cfg.get("footnotes", []):
        for ln in _wrap(fn, f_small, W - 2 * M):
            d.text((M, y), ln, font=f_small, fill="black")
            y += 21
        y += 6
    pages.append(page)
    return pages


def render_detail_pages(summary, rows) -> list[Image.Image]:
    """내부용 페이지별 처리 내역(A4 가로 150dpi)."""
    W, H, M = 1754, 1240, 60
    F = _font_factory()
    f_title, f_txt, f_small = F(34), F(20), F(18)
    cols = [("연번", 60), ("원본 파일", 280), ("원본 쪽", 75), ("출력 쪽", 75),
            ("처리 구분", 120), ("기준", 90), ("비식별 항목(개수)", 470), ("영역 수", 70),
            ("삭제 사유 / 비고", 394)]

    pages, page, d, y = [], None, None, 0

    def new_page(first: bool):
        nonlocal page, d, y
        page = Image.new("RGB", (W, H), "white")
        d = ImageDraw.Draw(page)
        y = M
        if first:
            d.text((M, y), "기록물 비식별 처리 내역 (내부용)", font=f_title, fill="black")
            y += 60
            for k, v in summary:
                d.text((M, y), f"{k}", font=f_txt, fill="black")
                wl = _wrap(v, f_txt, W - 2 * M - 260)
                for j, ln in enumerate(wl):
                    d.text((M + 260, y + j * 26), ln, font=f_txt, fill="black")
                y += 26 * max(1, len(wl))
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
        cells = [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7],
                 " / ".join(s for s in (r[8], r[9]) if s)]
        wrapped = [_wrap(c, f_small, w - 12) for c, (_n, w) in zip(cells, cols)]
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


def _images_to_pdf(path, images, dpi=150):
    doc = pymupdf.open()
    for im in images:
        _image_page(doc, im, dpi, 92)
    doc.save(path, garbage=4, deflate=True)
    doc.close()


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
                _lo, hi = region.getextrema()
                if hi > 60:
                    problems.append(f"{n}쪽 박스 #{b.id}: 덮이지 않은 픽셀(밝기 {hi})")
    return problems


def export(project: Project, out_root: str | None = None, attach_table: str | None = None,
           progress=None):
    """결과 PDF + 안내표(입양인용 PDF, 내부용 엑셀·PDF)를 만든다."""
    cfg = project.config
    if cfg.get("require_all_confirmed", True):
        pending = [p.label for p in project.pages if not p.locked]
        if pending:
            raise ProjectError(f"확정하지 않은 페이지가 {len(pending)}개 있습니다.\n"
                               f"예: {', '.join(pending[:5])}")
    attach_table = attach_table or cfg.get("attach_table_to_pdf", "none")
    include_notice = bool(cfg.get("include_notice", True))

    stamp = _dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    name = os.path.basename(project.folder.rstrip("\\/")) or "기록물"
    out_dir = os.path.join(out_root or project.folder, f"_비식별결과_{stamp}")
    os.makedirs(out_dir, exist_ok=False)
    pdf_path = os.path.join(out_dir, f"{name}_비식별.pdf")
    notice_path = os.path.join(out_dir, f"{name}_비식별안내표.pdf")
    xlsx_path = os.path.join(out_dir, f"{name}_내부용_처리내역.xlsx")
    detail_path = os.path.join(out_dir, f"{name}_내부용_처리내역.pdf")

    # 안내표를 앞에 붙이면 기록물 쪽 번호가 그만큼 밀린다
    offset = 0
    if attach_table == "front":
        for _ in range(3):
            n = len(render_notice_pages(cfg, build_rule_rows(project, offset), include_notice))
            if n == offset:
                break
            offset = n
    rule_rows = build_rule_rows(project, offset)
    notice_pages = render_notice_pages(cfg, rule_rows, include_notice)

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

    if attach_table in ("front", "back"):
        tdoc = pymupdf.open()
        for tp in notice_pages:
            _image_page(tdoc, tp, 150, 92)
        blank = [(0, 0, [])] * len(notice_pages)
        if attach_table == "front":
            doc.insert_pdf(tdoc, start_at=0)
            expected = blank + expected
        else:
            doc.insert_pdf(tdoc)
            expected = expected + blank
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

    rows = build_rows(project)
    _images_to_pdf(notice_path, notice_pages)
    write_xlsx(xlsx_path, summary, rows, project.events, rule_rows)
    _images_to_pdf(detail_path, render_detail_pages(summary, rows))

    with open(os.path.join(out_dir, "SHA256.txt"), "w", encoding="utf-8") as f:
        f.write(f"{digest}  {os.path.basename(pdf_path)}\n")

    return {"dir": out_dir, "pdf": pdf_path, "notice": notice_path, "xlsx": xlsx_path,
            "detail_pdf": detail_path, "sha256": digest, "problems": problems,
            "unmapped": unmapped_items(project)}
