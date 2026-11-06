/* =====================================================================
   이모지 → 도트 아이콘
   · 메뉴 · 버튼 · 알림 · 패널 · 캔버스 글자 속 이모지를 16×16 도트로 바꿔 그림
   · 자주 보이는 메뉴 아이콘은 직접 찍은 도트, 나머지는 같은 규칙(16칸 · 색 줄이기 · 외곽선)으로 자동 변환
   ===================================================================== */
const EMO_RE = /(?:\p{Regional_Indicator}{2}|[#*0-9]️?⃣|\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?|[\u{1F3FB}-\u{1F3FF}])*)/gu;
const EMO_TEXT = new Set(['♥', '♪', '☰', '▼', '☆', '★', '↔', '↕', '↩', '↪', '✔', '✖', '➕', '➖', '©', '®', '™', '‼', '⁉', '▶', '◀', '⬆', '⬇', '⬅', '➡', '↶', '↷', '↻', '○', '✕', '▦', '♻', '✏', '✉', '⚠', '☁', '☀', '❄', '✨', '❗', '❓', '❔', '⏩', 'ℹ', '♀', '♂']);
// 위 기호들 중에서도 그림으로 바꿀 것 (날씨 · 경고 등은 도트로)
for (const k of ['⚠', '☁', '☀', '❄', '✨', '❗', '❓', '❔', '⏩', '♻', '✏', '✉', 'ℹ']) EMO_TEXT.delete(k);
const isEmo = (t) => !EMO_TEXT.has(t.replace(/️/g, ''));

/* ---- 직접 찍은 도트 (메뉴에서 자주 보이는 것) ---- */
const C_ = { ink: '#3a2a26', w: '#ffffff', cr: '#fff6e6', pk: '#f19ab5', pk2: '#e3628a', rd: '#e3484a', or: '#f39a2b', yl: '#f2d06a', gn: '#5aa850', gn2: '#3f7a30', bl: '#5aa0d8', bl2: '#2f6fa8', sk: '#9fd6f2', br: '#a87a4a', br2: '#7a5236', gr: '#9aa3b0', gr2: '#5b5f69', pp: '#9a7ad8' };
const EMO_PX = {
  '⛴': (P) => { P(2, 10, 12, 3, C_.bl2); P(3, 13, 10, 1, '#244f80'); P(4, 7, 8, 3, C_.w); P(5, 8, 1, 1, C_.sk); P(7, 8, 1, 1, C_.sk); P(9, 8, 1, 1, C_.sk); P(7, 4, 3, 3, C_.rd); P(7, 4, 3, 1, C_.ink); P(1, 14, 14, 1, C_.sk); },
  '🧳': (P) => { P(6, 2, 4, 2, C_.br2); P(6, 3, 1, 2, C_.br2); P(9, 3, 1, 2, C_.br2); P(3, 5, 10, 9, C_.or); P(3, 8, 10, 1, '#c97a1a'); P(5, 5, 1, 9, '#c97a1a'); P(10, 5, 1, 9, '#c97a1a'); P(4, 14, 2, 1, C_.ink); P(10, 14, 2, 1, C_.ink); },
  '🗣': (P) => { P(2, 3, 9, 7, C_.w); P(3, 10, 2, 2, C_.w); P(4, 5, 5, 1, C_.gr); P(4, 7, 3, 1, C_.gr); P(11, 4, 1, 1, C_.pk2); P(13, 3, 1, 1, C_.pk2); P(12, 6, 2, 1, C_.pk2); P(11, 8, 1, 1, C_.pk2); P(13, 9, 1, 1, C_.pk2); },
  '🎪': (P) => { for (let i = 0; i < 6; i++) P(2 + i * 2, 7 - Math.min(i, 5 - i), 2, 7 + Math.min(i, 5 - i), i % 2 ? C_.w : C_.rd); P(7, 1, 2, 3, C_.ink); P(8, 1, 3, 2, C_.yl); P(6, 10, 4, 4, '#7a2a3a'); },
  '💗': (P) => { P(3, 4, 4, 2, C_.pk); P(9, 4, 4, 2, C_.pk); P(2, 5, 12, 4, C_.pk); P(3, 9, 10, 2, C_.pk); P(5, 11, 6, 2, C_.pk); P(7, 13, 2, 1, C_.pk); P(4, 5, 2, 2, C_.w); P(9, 7, 3, 3, C_.pk2); },
  '💞': (P) => { P(1, 3, 3, 2, C_.pk); P(5, 3, 3, 2, C_.pk); P(1, 4, 7, 3, C_.pk); P(2, 7, 5, 1, C_.pk); P(3, 8, 3, 1, C_.pk); P(8, 8, 3, 2, C_.pk2); P(12, 8, 3, 2, C_.pk2); P(8, 9, 7, 3, C_.pk2); P(9, 12, 5, 1, C_.pk2); P(10, 13, 3, 1, C_.pk2); },
  '🏘': (P) => { P(1, 8, 7, 6, C_.cr); P(1, 5, 7, 3, C_.rd); P(3, 10, 2, 4, C_.br); P(8, 6, 7, 8, '#e8eef5'); P(7, 3, 9, 3, C_.bl2); P(10, 9, 3, 2, C_.sk); P(11, 12, 2, 2, C_.br); },
  '📒': (P) => { P(3, 2, 10, 12, C_.yl); P(3, 2, 2, 12, '#c9a33a'); P(6, 5, 5, 1, C_.br2); P(6, 7, 5, 1, C_.br2); P(6, 9, 3, 1, C_.br2); P(11, 1, 2, 5, C_.rd); },
  '📔': (P) => { P(3, 2, 10, 12, C_.pk); P(3, 2, 2, 12, C_.pk2); P(6, 4, 6, 5, C_.w); P(7, 5, 4, 3, C_.sk); P(6, 10, 6, 1, C_.w); },
  '🏠': (P) => { P(3, 8, 10, 6, C_.cr); P(1, 7, 14, 1, '#c96a3a'); P(2, 6, 12, 1, '#c96a3a'); P(4, 4, 8, 2, '#c96a3a'); P(6, 3, 4, 1, '#c96a3a'); P(7, 10, 2, 4, C_.br); P(4, 9, 2, 2, C_.sk); P(10, 9, 2, 2, C_.sk); P(11, 3, 2, 3, C_.gr2); },
  '🏡': (P) => { EMO_PX['🏠'](P); P(0, 13, 3, 2, C_.gn); P(13, 13, 3, 2, C_.gn); },
  '🎒': (P) => { P(4, 4, 8, 10, C_.rd); P(6, 2, 4, 2, '#a83a3a'); P(5, 8, 6, 4, '#c43a3a'); P(5, 8, 6, 1, C_.yl); P(4, 4, 8, 1, '#ff7a7a'); },
  '📷': (P) => { P(2, 5, 12, 8, C_.gr2); P(4, 4, 3, 1, C_.gr2); P(2, 5, 12, 1, C_.gr); E2(P, 8, 9, 3, C_.ink); E2(P, 8, 9, 2, C_.bl); P(7, 8, 1, 1, C_.w); P(11, 6, 2, 1, C_.yl); },
  '📸': (P) => { EMO_PX['📷'](P); P(12, 2, 1, 2, C_.yl); P(14, 3, 1, 1, C_.yl); },
  '⚙': (P) => { for (const [x, y] of [[7, 1], [7, 13], [1, 7], [13, 7], [3, 3], [11, 3], [3, 11], [11, 11]]) P(x, y, 2, 2, C_.gr); E2(P, 8, 8, 5, C_.gr); E2(P, 8, 8, 2, C_.cr); },
  '❓': (P) => { P(5, 2, 6, 2, C_.bl); P(10, 3, 2, 4, C_.bl); P(7, 7, 4, 2, C_.bl); P(7, 9, 2, 2, C_.bl); P(7, 12, 2, 2, C_.bl); P(4, 3, 2, 2, C_.bl); },
  '💾': (P) => { P(2, 2, 12, 12, C_.bl2); P(4, 2, 7, 5, C_.gr); P(8, 3, 2, 3, C_.gr2); P(4, 9, 8, 5, C_.cr); P(5, 10, 6, 1, C_.gr); P(5, 12, 6, 1, C_.gr); },
  '🔄': (P) => { P(4, 3, 7, 2, C_.gn); P(11, 2, 1, 4, C_.gn); P(12, 3, 1, 2, C_.gn); P(3, 4, 2, 5, C_.gn); P(5, 11, 7, 2, C_.gn); P(4, 10, 1, 4, C_.gn); P(3, 11, 1, 2, C_.gn); P(11, 7, 2, 5, C_.gn); },
  '🗺': (P) => { P(1, 3, 4, 11, '#e9d9b0'); P(5, 2, 5, 11, '#f4e8c6'); P(10, 3, 5, 11, '#e9d9b0'); P(2, 6, 2, 2, C_.gn); P(6, 8, 3, 2, C_.gn); P(11, 5, 3, 3, C_.gn); P(7, 4, 1, 1, C_.rd); P(12, 10, 1, 1, C_.rd); },
  '📋': (P) => { P(3, 3, 10, 12, C_.br); P(4, 4, 8, 10, C_.cr); P(6, 2, 4, 3, C_.gr2); P(5, 7, 6, 1, C_.gr); P(5, 9, 6, 1, C_.gr); P(5, 11, 4, 1, C_.gr); },
  '💬': (P) => { P(2, 3, 12, 8, C_.w); P(4, 11, 3, 2, C_.w); P(4, 6, 2, 2, C_.gr); P(7, 6, 2, 2, C_.gr); P(10, 6, 2, 2, C_.gr); },
  '👣': (P) => { P(3, 8, 3, 5, C_.br); P(3, 6, 1, 1, C_.br); P(5, 6, 1, 1, C_.br); P(9, 3, 3, 5, C_.br); P(9, 1, 1, 1, C_.br); P(11, 1, 1, 1, C_.br); },
  '👋': (P) => { P(5, 5, 7, 8, '#f4c79a'); for (let i = 0; i < 4; i++) P(5 + i * 2, 2 + (i % 2), 1, 4, '#f4c79a'); P(12, 7, 2, 2, '#f4c79a'); P(2, 3, 1, 2, C_.yl); P(1, 6, 2, 1, C_.yl); },
  '🎁': (P) => { P(2, 6, 12, 8, C_.pk); P(1, 5, 14, 3, C_.pk2); P(7, 5, 2, 9, C_.yl); P(4, 2, 3, 3, C_.yl); P(9, 2, 3, 3, C_.yl); },
  '🌿': (P) => { P(7, 3, 1, 12, C_.gn2); for (let i = 0; i < 4; i++) { P(3 + (i % 2) * 5, 4 + i * 2, 4, 2, i % 2 ? C_.gn : '#7cc06a'); } },
  '📅': (P) => { P(2, 3, 12, 11, C_.w); P(2, 3, 12, 3, C_.rd); P(4, 1, 1, 3, C_.gr2); P(11, 1, 1, 3, C_.gr2); for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) P(3 + x * 3, 7 + y * 2, 2, 1, C_.gr); },
  '💌': (P) => { P(2, 4, 12, 9, C_.w); for (let i = 0; i < 6; i++) P(2 + i, 4 + i, 1, 1, C_.gr); for (let i = 0; i < 6; i++) P(13 - i, 4 + i, 1, 1, C_.gr); P(7, 8, 2, 2, C_.pk2); },
  '🌙': (P) => { E2(P, 8, 8, 6, C_.yl); E2(P, 11, 6, 5, 'clear'); },
  '⭐': (P) => { P(7, 1, 2, 4, C_.yl); P(1, 5, 14, 3, C_.yl); P(3, 8, 10, 2, C_.yl); P(3, 10, 4, 2, C_.yl); P(9, 10, 4, 2, C_.yl); P(2, 12, 3, 2, C_.yl); P(11, 12, 3, 2, C_.yl); P(7, 4, 1, 1, C_.w); },
  '🚌': (P) => { P(1, 4, 14, 8, C_.yl); P(2, 5, 3, 3, C_.sk); P(6, 5, 3, 3, C_.sk); P(10, 5, 4, 3, C_.sk); P(1, 9, 14, 1, C_.or); E2(P, 4, 12, 2, C_.ink); E2(P, 12, 12, 2, C_.ink); },
  '📍': (P) => { E2(P, 8, 6, 5, C_.rd); E2(P, 7, 5, 1, '#ff9a9a'); P(7, 10, 2, 3, C_.rd); P(7, 13, 2, 2, '#a82a2a'); },
  '🔍': (P) => { E2(P, 6, 6, 5, C_.gr2); E2(P, 6, 6, 3, C_.sk); P(5, 4, 1, 1, C_.w); for (let i = 0; i < 4; i++) P(10 + i, 10 + i, 2, 2, C_.br2); },
  '🔎': (P) => EMO_PX['🔍'](P),
  '🧭': (P) => { E2(P, 8, 8, 7, C_.yl); E2(P, 8, 8, 5, C_.cr); P(7, 4, 2, 4, C_.rd); P(7, 8, 2, 4, C_.gr2); },
  '🎞': (P) => { P(4, 1, 8, 14, C_.gr2); for (let i = 0; i < 4; i++) P(5, 2 + i * 3, 6, 2, C_.pk); },
  '💍': (P) => { E2(P, 8, 10, 5, C_.yl); E2(P, 8, 10, 3, 'clear'); P(6, 2, 4, 3, C_.sk); P(7, 3, 1, 1, C_.w); },
  '🛋': (P) => { P(1, 6, 14, 5, '#c96a6a'); P(1, 5, 3, 7, '#a84a4a'); P(12, 5, 3, 7, '#a84a4a'); P(4, 9, 8, 2, '#e38a8a'); P(2, 12, 1, 2, C_.br2); P(13, 12, 1, 2, C_.br2); },
  '👗': (P) => { P(6, 1, 1, 3, C_.pk2); P(9, 1, 1, 3, C_.pk2); P(5, 3, 6, 4, C_.pk); P(4, 7, 8, 3, C_.pk); P(3, 10, 10, 4, C_.pk); P(5, 7, 6, 1, C_.pk2); },
  '🏗': (P) => { P(2, 2, 2, 12, C_.yl); P(2, 2, 12, 2, C_.yl); P(12, 4, 1, 4, C_.gr2); P(11, 8, 3, 2, C_.or); P(5, 10, 6, 4, C_.br); P(1, 14, 14, 1, C_.gr2); },
  '🖼': (P) => { P(1, 2, 14, 12, C_.br); P(3, 4, 10, 8, C_.sk); P(3, 9, 10, 3, C_.gn); E2(P, 10, 6, 1, C_.yl); },
  '🐟': (P) => { E2(P, 7, 8, 5, C_.bl); P(11, 6, 3, 5, C_.bl2); P(4, 7, 1, 1, C_.ink); P(5, 10, 5, 1, C_.sk); },
  '🛒': (P) => { P(1, 2, 3, 1, C_.gr2); P(3, 3, 11, 6, C_.gr); P(4, 4, 9, 4, C_.cr); P(4, 9, 9, 1, C_.gr2); E2(P, 5, 12, 1, C_.ink); E2(P, 11, 12, 1, C_.ink); },
};
function E2(P, cx, cy, r, col) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) P(cx + x, cy + y, 1, 1, col); }

/* ---- 그 밖의 이모지: 32칸에 그린 뒤 16칸으로 줄이고 색을 줄여 도트로 ---- */
const _emoCache = new Map();
function emojiCanvas(t) {
  const key = t.replace(/️/g, '');
  if (_emoCache.has(key)) return _emoCache.get(key);
  let c = mkCanvas(16, 16); const g = c.getContext('2d');
  const hand = EMO_PX[key];
  if (hand) {
    const P = (x, y, w = 1, h = 1, col) => { if (col === 'clear') g.clearRect(x, y, w, h); else { g.fillStyle = col; g.fillRect(x, y, w, h); } };
    hand(P);
  } else {
    const big = mkCanvas(32, 32), bg = big.getContext('2d');
    bg.textAlign = 'center'; bg.textBaseline = 'middle'; bg.font = '27px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji","Twemoji Mozilla",sans-serif';
    (CanvasRenderingContext2D.prototype.__fillRaw || CanvasRenderingContext2D.prototype.fillText).call(bg, t, 16, 17.5);
    const src = bg.getImageData(0, 0, 32, 32).data, out = g.createImageData(16, 16), o = out.data;
    let ink = 0;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      // 2×2 칸 중 가장 진한 칸을 대표색으로 (가는 선이 사라지지 않게)
      let best = -1, bi = 0;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = ((y * 2 + dy) * 32 + x * 2 + dx) * 4; if (src[i + 3] > best) { best = src[i + 3]; bi = i; } }
      const j = (y * 16 + x) * 4;
      if (best < 120) continue;
      const q = (v) => Math.min(255, Math.round(v / 40) * 40 + 12);
      o[j] = q(src[bi]); o[j + 1] = q(src[bi + 1]); o[j + 2] = q(src[bi + 2]); o[j + 3] = 255; ink++;
    }
    g.putImageData(out, 0, 0);
    if (!ink) { g.fillStyle = C_.gr; g.fillRect(5, 5, 6, 6); }
  }
  autoOutline(c, C_.ink);
  _emoCache.set(key, c);
  return c;
}
const _emoURL = new Map();
function emojiURL(t) { const k = t.replace(/️/g, ''); if (!_emoURL.has(k)) _emoURL.set(k, toURL(emojiCanvas(t), 3)); return _emoURL.get(k); }

/* ---- 화면의 글자 속 이모지를 도트 그림으로 (메뉴 · 버튼 · 알림 · 패널 · 대화) ---- */
function pixelizeNode(root) {
  if (!root) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => { const p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/.test(p.nodeName) || (p.closest && p.closest('.no-px'))) return NodeFilter.FILTER_REJECT; EMO_RE.lastIndex = 0; return EMO_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
  const list = []; while (tw.nextNode()) list.push(tw.currentNode);
  for (const n of list) {
    const s = n.nodeValue, frag = document.createDocumentFragment(); let last = 0, changed = false;
    s.replace(EMO_RE, (m, off) => { if (!isEmo(m)) return m; if (off > last) frag.appendChild(document.createTextNode(s.slice(last, off))); const im = document.createElement('img'); im.className = 'px-emo'; im.alt = ''; im.src = emojiURL(m); frag.appendChild(im); last = off + m.length; changed = true; return m; });
    if (!changed) continue;
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    n.parentNode.replaceChild(frag, n);
  }
}
let _pxQueued = new Set(), _pxRaf = 0;
function pixelizeSoon(el) { _pxQueued.add(el); if (_pxRaf) return; _pxRaf = requestAnimationFrame(() => { _pxRaf = 0; const q = [..._pxQueued]; _pxQueued.clear(); for (const e of q) if (e.isConnected) pixelizeNode(e); }); }
window.addEventListener('DOMContentLoaded', () => {
  const root = $('#game') || document.body;
  pixelizeNode(root);
  new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') { if (m.target.parentNode) pixelizeSoon(m.target.parentNode); } else for (const n of m.addedNodes) { if (n.nodeType === 3) { if (n.parentNode) pixelizeSoon(n.parentNode); } else if (n.nodeType === 1 && n.className !== 'px-emo') pixelizeSoon(n); } } }).observe(root, { childList: true, subtree: true, characterData: true });
});

/* ---- 캔버스 글자(말풍선 · 이름표 · 지도 표시)의 이모지도 도트로 ---- */
{
  const CP = CanvasRenderingContext2D.prototype, _fill = CP.__fillRaw = CP.fillText, _stroke = CP.strokeText, _measure = CP.measureText;
  const runs = (t) => { const out = []; let last = 0; EMO_RE.lastIndex = 0; let m; while ((m = EMO_RE.exec(t))) { if (!isEmo(m[0])) continue; if (m.index > last) out.push([0, t.slice(last, m.index)]); out.push([1, m[0]]); last = m.index + m[0].length; } if (last < t.length) out.push([0, t.slice(last)]); return out; };
  const fsize = (g) => { const m = /(\d+(?:\.\d+)?)px/.exec(g.font); return m ? +m[1] : 12; };
  const draw = function (orig, isStroke) {
    return function (text, x, y, maxW) {
      if (typeof text !== 'string' || !EMO_RE.test(text)) { EMO_RE.lastIndex = 0; return maxW === undefined ? orig.call(this, text, x, y) : orig.call(this, text, x, y, maxW); }
      EMO_RE.lastIndex = 0;
      const rs = runs(text); if (!rs.some(r => r[0])) return orig.call(this, text, x, y);
      const fs = fsize(this), es = Math.round(fs * 1.05);
      const widths = rs.map(([e, s]) => e ? es + fs * 0.08 : _measure.call(this, s).width), total = widths.reduce((a, b) => a + b, 0);
      const al = this.textAlign, bl = this.textBaseline;
      let cx = al === 'center' ? x - total / 2 : al === 'right' || al === 'end' ? x - total : x;
      const cy = bl === 'middle' ? y - es / 2 : bl === 'top' ? y : bl === 'bottom' ? y - es : y - es * 0.82;
      this.save(); this.textAlign = 'left';
      rs.forEach(([e, s], i) => { if (e) { if (!isStroke) { const sm = this.imageSmoothingEnabled; this.imageSmoothingEnabled = false; this.drawImage(emojiCanvas(s), Math.round(cx), Math.round(cy), es, es); this.imageSmoothingEnabled = sm; } } else orig.call(this, s, cx, y); cx += widths[i]; });
      this.restore();
    };
  };
  CP.fillText = draw(_fill, false); CP.strokeText = draw(_stroke, true);
  CP.measureText = function (text) {
    if (typeof text !== 'string' || !EMO_RE.test(text)) { EMO_RE.lastIndex = 0; return _measure.call(this, text); }
    EMO_RE.lastIndex = 0; const fs = fsize(this), rs = runs(text);
    const w = rs.reduce((a, [e, s]) => a + (e ? Math.round(fs * 1.05) + fs * 0.08 : _measure.call(this, s).width), 0);
    const base = _measure.call(this, text.replace(EMO_RE, '')); return { width: w, actualBoundingBoxAscent: base.actualBoundingBoxAscent, actualBoundingBoxDescent: base.actualBoundingBoxDescent };
  };
}
