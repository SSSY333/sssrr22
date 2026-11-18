"""타이핑된 친생부모 정보 자동 인식 → 비식별 '제안' 생성 (오프라인).

- 문자 인식은 PC에 설치된(또는 프로그램 폴더에 동봉된) Tesseract OCR을 사용합니다.
  인터넷 연결을 사용하지 않습니다.
- 여기서 만드는 것은 '제안'뿐입니다. 사람이 확인하고 [적용]해야 실제 블라인드 박스가 됩니다.
- 손글씨는 인식되지 않으므로 제안이 나오지 않습니다(직접 박스를 그려야 함).

비식별 기준(친생부모):
  이름  → 성(family name)은 공개, 이름(given name)만 가림
  출생일 → 출생 연도 공개, 월·일만 가림
  주소  → 시·군·구까지 공개, 그 아래 세부 주소만 가림
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass

from PIL import Image, ImageChops, ImageFilter, ImageOps

# ---------------------------------------------------------------- Tesseract

_TESS: str | None = None
_LANGS: str | None = None


def _app_dirs():
    dirs = []
    if getattr(sys, "frozen", False):
        dirs.append(os.path.dirname(sys.executable))
        dirs.append(getattr(sys, "_MEIPASS", ""))
    dirs.append(os.path.dirname(os.path.abspath(__file__)))
    return [d for d in dirs if d]


def find_tesseract() -> str | None:
    global _TESS
    if _TESS:
        return _TESS
    exe = "tesseract.exe" if sys.platform.startswith("win") else "tesseract"
    cands = [os.path.join(d, "tesseract", exe) for d in _app_dirs()]
    cands += [r"C:\Program Files\Tesseract-OCR\tesseract.exe",
              r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"]
    w = shutil.which("tesseract")
    if w:
        cands.append(w)
    for c in cands:
        if c and os.path.isfile(c):
            _TESS = c
            return c
    return None


def _run(args, **kw):
    flags = 0x08000000 if sys.platform.startswith("win") else 0  # CREATE_NO_WINDOW
    return subprocess.run(args, capture_output=True, creationflags=flags, **kw)


def ocr_langs() -> str:
    global _LANGS
    if _LANGS is not None:
        return _LANGS
    exe = find_tesseract()
    if not exe:
        _LANGS = ""
        return _LANGS
    out = _run([exe, "--list-langs"]).stdout.decode("utf-8", "ignore")
    have = {ln.strip() for ln in out.splitlines()}
    _LANGS = "+".join(l for l in ("eng", "kor", "chi_tra") if l in have) or "eng"
    return _LANGS


def available() -> bool:
    return find_tesseract() is not None


@dataclass
class Word:
    text: str
    conf: float
    x0: float
    y0: float
    x1: float
    y1: float


def _prepare(img: Image.Image):
    """조명 얼룩 제거 + 대비 보정 + (저해상도면) 확대."""
    g = img.convert("L")
    bg = g.filter(ImageFilter.GaussianBlur(max(8, g.width // 60)))
    norm = ImageOps.autocontrast(ImageOps.invert(ImageChops.subtract(bg, g)), cutoff=1)
    scale = min(4.0, max(1.0, 3000.0 / max(g.height, 1)))
    if scale > 1.01:
        norm = norm.resize((int(g.width * scale), int(g.height * scale)), Image.LANCZOS)
    return norm, scale


def ocr_lines(img: Image.Image, langs: str | None = None) -> list[list[Word]]:
    """페이지를 OCR해 줄 단위 단어 목록(원본 이미지 좌표)을 돌려준다."""
    exe = find_tesseract()
    if not exe:
        return []
    prep, scale = _prepare(img)
    fd, path = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    try:
        prep.save(path)
        env = dict(os.environ)
        tessdata = os.path.join(os.path.dirname(exe), "tessdata")
        if os.path.isdir(tessdata):
            env["TESSDATA_PREFIX"] = tessdata
        r = _run([exe, path, "stdout", "-l", langs or ocr_langs(), "--psm", "6", "tsv"], env=env)
        tsv = r.stdout.decode("utf-8", "ignore")
    finally:
        try:
            os.remove(path)
        except OSError:
            pass
    lines: dict[tuple, list[Word]] = {}
    for ln in tsv.splitlines()[1:]:
        p = ln.split("\t")
        if len(p) < 12 or p[0] != "5" or not p[11].strip():
            continue
        l, t, w, h = (int(p[i]) for i in (6, 7, 8, 9))
        key = (int(p[2]), int(p[3]), int(p[4]))
        lines.setdefault(key, []).append(Word(
            p[11].strip(), float(p[10]), l / scale, t / scale, (l + w) / scale, (t + h) / scale))
    out = [sorted(ws, key=lambda w: w.x0) for _k, ws in sorted(lines.items())]
    out.sort(key=lambda ws: min(w.y0 for w in ws))
    return out


# ---------------------------------------------------------------- 규칙

PARENT_KW = re.compile(r"biolog|birth\s*parent|father|mother|친생|생부|생모|친부|친모|父|母|부\s*성명|모\s*성명", re.I)
CHILD_KW = re.compile(r"child|adoptee|baby|아동|입양인|본인|IDENTIFICATION", re.I)
RESET_KW = re.compile(r"status|sibling|legal|adoptive|foster|guardian|형제|양부|양모|위탁|후견", re.I)

NAME_LABEL = re.compile(r"^(name|성명|이름|姓名|氏名)\W*$", re.I)
NAME_EXCLUDE = re.compile(r"meaning|child|아동", re.I)
BIRTH_LABEL = re.compile(r"^(birth\W*date|date\W*of\W*birth|d\.?o\.?b\.?|birth|born|생년월일|출생일|生年月日)\W*$", re.I)
BIRTH_EXCLUDE = re.compile(r"place|출생지|장소", re.I)
ADDR_LABEL = re.compile(r"^(address|addr\.?|domicile|residence|주소|住所|본적|本籍|거주지)\W*$", re.I)

MONTHS = re.compile(r"^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?,?$", re.I)
YEAR = re.compile(r"^\D*(18|19|20)\d\d\D*$")
KO_REGION = re.compile(r"(특별시|광역시|자치시|시|도|군|구)$")
EN_REGION = re.compile(r"(-?si|-?gun|-?gu|-?do|city|province|county|seoul|busan|pusan|daegu|taegu|incheon|"
                       r"inchon|gwangju|kwangju|daejeon|taejon|ulsan|sejong|gyeonggi|kyunggi|kyungki|"
                       r"gangwon|kangwon|chungcheong|chungchong|jeolla|cholla|gyeongsang|kyungsang|kyung|"
                       r"sang|buk|nam|jeju|cheju|korea)\W*$", re.I)
DETAIL = re.compile(r"\d|(동|리|로|길|읍|면|번지|호|가|아파트|빌라)$|(-?dong|-?ri|-?ro|-?gil|-?eup|-?myeon|"
                    r"apt\.?|#)\W*$", re.I)
TWO_CHAR_SURNAMES = ("남궁", "황보", "제갈", "선우", "독고", "사공", "서문", "동방", "어금", "망절")
HANGUL = re.compile(r"[가-힣]")


@dataclass
class Suggestion:
    cat: str
    x0: int
    y0: int
    x1: int
    y1: int
    reason: str

    def rect(self):
        return (self.x0, self.y0, self.x1, self.y1)


def _clean(t: str) -> str:
    return re.sub(r"[^\w가-힣]", "", t)


def _useful(w: Word, min_conf=30) -> bool:
    return w.conf >= min_conf and bool(_clean(w.text))


def _box(words, pad=3, frac=None):
    x0 = min(w.x0 for w in words)
    x1 = max(w.x1 for w in words)
    if frac is not None:  # 첫 단어의 일부(앞쪽 frac 비율)를 제외
        x0 = words[0].x0 + (words[0].x1 - words[0].x0) * frac
    y0 = min(w.y0 for w in words)
    y1 = max(w.y1 for w in words)
    return int(x0 - pad), int(y0 - pad), int(x1 + pad), int(y1 + pad)


def _groups(words: list[Word]) -> list[list[Word]]:
    """값 단어들을 큰 간격 기준으로 묶는다(부/모 칸 분리)."""
    if not words:
        return []
    h = sorted(w.y1 - w.y0 for w in words)[len(words) // 2] or 10
    out, cur = [], [words[0]]
    for a, b in zip(words, words[1:]):
        if b.x0 - a.x1 > 2.2 * h:
            out.append(cur)
            cur = []
        cur.append(b)
    out.append(cur)
    return out


def _after_label(line: list[Word], idx: int, min_conf=30) -> list[Word]:
    rest = line[idx + 1:]
    return [w for w in rest if _useful(w, min_conf)]


def _name_suggestions(group, cat) -> tuple[list[Suggestion], str]:
    toks = [w for w in group if re.search(r"[A-Za-z가-힣]", w.text)]
    if not toks:
        return [], ""
    first = toks[0]
    txt = _clean(first.text)
    if HANGUL.search(txt) and len(toks) == 1:
        # 한글 이름 한 덩어리: 김영희 / 남궁민수
        n = 2 if txt[:2] in TWO_CHAR_SURNAMES else 1
        if len(txt) <= n:
            return [], ""
        x0, y0, x1, y1 = _box([first], frac=n / len(txt))
        return [Suggestion(cat, x0, y0, x1, y1, f"이름 '{txt[n:]}' (성 '{txt[:n]}' 공개)")], txt[n:]
    if len(toks) < 2:
        return [], ""
    if "," in first.text and not first.text.rstrip().endswith(","):
        # "Koh,MeeYoung" 처럼 붙은 경우
        pos = first.text.index(",") + 1
        frac = pos / max(1, len(first.text))
        x0, y0, x1, y1 = _box(toks, frac=frac)
    else:
        if len(_clean(first.text)) < 2 and not HANGUL.search(first.text):
            return [], ""
        x0, y0, x1, y1 = _box(toks[1:])
    given = " ".join(_clean(w.text) for w in toks[1:])
    return [Suggestion(cat, x0, y0, x1, y1,
                       f"이름 '{given}' (성 '{_clean(first.text)}' 공개)")], given


def _birth_suggestions(group, cat) -> list[Suggestion]:
    hide = []
    for w in group:
        t = w.text
        c = _clean(t)
        if YEAR.match(t) or re.fullmatch(r"(18|19|20)\d\d년?", c):
            m = re.match(r"^\D*((18|19|20)\d\d)[.\-/년]?(.*)$", t)
            if m and m.group(3).strip(" .-/"):
                # 1955.3.2 처럼 한 단어 → 연도 뒤쪽만 가림
                frac = (len(t) - len(m.group(3))) / len(t)
                hide.append(("part", w, frac))
            continue
        if MONTHS.match(t) or re.fullmatch(r"\d{1,2}(월|일)?", c) or re.fullmatch(r"\d{1,2}[./-]\d{1,2}", c):
            hide.append(("all", w, 0))
        elif re.search(r"(AM|PM|오전|오후|\d:\d)", t, re.I):
            hide.append(("all", w, 0))  # 출생 시각도 월·일과 함께 가림
    out = []
    for kind, w, frac in hide:
        x0, y0, x1, y1 = _box([w], frac=frac if kind == "part" else None)
        out.append(Suggestion(cat, x0, y0, x1, y1, f"출생 월·일 '{w.text}' (연도 공개)"))
    return out


def _addr_suggestions(group, cat) -> list[Suggestion]:
    start = None
    for i, w in enumerate(group):
        c = _clean(w.text)
        if not c:
            continue
        if HANGUL.search(c):
            if DETAIL.search(c) and not KO_REGION.search(c):
                start = i
                break
        elif DETAIL.search(w.text) and not EN_REGION.search(w.text):
            start = i
            break
    if start is None:
        return []
    detail = group[start:]
    # 영문 주소는 '번지, 동, 구, 시' 순서라 지역명이 뒤에 오는 경우: 지역명 앞까지만
    end = len(detail)
    for j, w in enumerate(detail):
        if j > 0 and EN_REGION.search(w.text) and not HANGUL.search(w.text):
            end = j
            break
    detail = detail[:end]
    x0, y0, x1, y1 = _box(detail)
    txt = " ".join(w.text for w in detail)
    return [Suggestion(cat, x0, y0, x1, y1, f"세부 주소 '{txt}' (시·군·구 공개)")]


def analyze(lines: list[list[Word]], cats: dict, known_given: set[str] | None = None):
    """줄 목록 → (제안 목록, 이번 페이지에서 찾은 이름 목록).

    cats: {"name": 범주명, "birth": 범주명, "addr": 범주명}
    known_given: 다른 페이지에서 찾은 친생부모 이름(본문 재등장 검색용)
    """
    sugg: list[Suggestion] = []
    found: set[str] = set()
    zone = None
    for line in lines:
        text = " ".join(w.text for w in line)
        line_parent = False
        if CHILD_KW.search(text) and not PARENT_KW.search(text):
            zone = "child"
        elif PARENT_KW.search(text):
            zone = "parent"
            line_parent = True
        elif RESET_KW.search(text):
            zone = None
        if zone != "parent" and not line_parent:
            continue
        for i, w in enumerate(line[:4]):  # 라벨은 줄 앞쪽에 있다
            lab = w.text.strip()
            nxt = (lab + " " + line[i + 1].text) if i + 1 < len(line) else lab
            if NAME_LABEL.match(lab) and not NAME_EXCLUDE.search(text):
                for g in _groups(_after_label(line, i, 0)):
                    s, given = _name_suggestions(g, cats["name"])
                    sugg += s
                    if given:
                        found.add(given)
                break
            if (BIRTH_LABEL.match(lab) or BIRTH_LABEL.match(nxt)) and not BIRTH_EXCLUDE.search(text):
                skip = 1 if BIRTH_LABEL.match(lab) else 2
                for g in _groups(_after_label(line, i + skip - 1, 50)):
                    sugg += _birth_suggestions(g, cats["birth"])
                break
            if ADDR_LABEL.match(lab):
                for g in _groups(_after_label(line, i, 50)):
                    sugg += _addr_suggestions(g, cats["addr"])
                break

    # 본문 등 다른 곳에 다시 나오는 친생부모 이름
    names = set(found) | set(known_given or ())
    for given in names:
        parts = [p.lower() for p in given.split() if p]
        if not parts or (len(parts) == 1 and len(parts[0]) < 3 and not HANGUL.search(parts[0])):
            continue
        n = len(parts)
        for line in lines:
            toks = [_clean(w.text).lower() for w in line]
            if n == 1 and HANGUL.search(parts[0]):
                # 한글 이름은 조사와 붙거나 글자 단위로 쪼개져 인식되므로 글자를 이어 붙여 찾는다
                chars = []  # (글자, x0, x1, 단어)
                for w in line:
                    t = _clean(w.text)
                    cw = (w.x1 - w.x0) / max(1, len(t))
                    chars += [(ch, w.x0 + cw * k, w.x0 + cw * (k + 1), w) for k, ch in enumerate(t)]
                joined = "".join(c[0] for c in chars)
                start = joined.find(parts[0])
                while start >= 0:
                    seg = chars[start:start + len(parts[0])]
                    sugg.append(Suggestion(cats["name"], int(seg[0][1]) - 3,
                                           int(min(c[3].y0 for c in seg)) - 3,
                                           int(seg[-1][2]) + 3, int(max(c[3].y1 for c in seg)) + 3,
                                           f"친생부모 이름 '{given}' 재등장"))
                    start = joined.find(parts[0], start + 1)
                continue
            for i in range(len(toks) - n + 1):
                if toks[i:i + n] == parts:
                    x0, y0, x1, y1 = _box(line[i:i + n])
                    sugg.append(Suggestion(cats["name"], x0, y0, x1, y1,
                                           f"친생부모 이름 '{given}' 재등장"))
    return _dedupe(sugg), found


def _overlap(a, b) -> float:
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    area = max(1, (a[2] - a[0]) * (a[3] - a[1]))
    return ix * iy / area


def _dedupe(sugg):
    out = []
    for s in sugg:
        if any(_overlap(s.rect(), o.rect()) > 0.6 for o in out):
            continue
        out.append(s)
    return out


def covered(s: Suggestion, boxes) -> bool:
    """이미 그려진 박스가 제안 영역을 대부분 덮고 있으면 True."""
    return any(_overlap(s.rect(), b.rect()) > 0.8 for b in boxes)



def ocr_passes(img: Image.Image) -> list[list[list[Word]]]:
    """영문 전용 인식 + 다국어(영·한·한자) 인식 결과를 모두 돌려준다.

    영문 서식은 영문 전용이, 한글 서식은 다국어 인식이 더 정확하기 때문이다.
    """
    passes = [ocr_lines(img, "eng")]
    multi = ocr_langs()
    if multi and multi != "eng":
        passes.append(ocr_lines(img, multi))
    return passes


def analyze_passes(passes, cats: dict, known_given: set[str] | None = None):
    allsugg, found = [], set()
    for lines in passes:
        s, f = analyze(lines, cats, (known_given or set()) | found)
        allsugg += s
        found |= f
    return _dedupe(allsugg), found


def suggest(img: Image.Image, cats: dict, known_given: set[str] | None = None):
    return analyze_passes(ocr_passes(img), cats, known_given)
