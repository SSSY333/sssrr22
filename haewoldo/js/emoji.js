/* =====================================================================
   이모지 색 맞추기
   · 메뉴 · 버튼 · 알림 · 대화 · 캔버스 글자의 이모지를 컬러 이모지로 보이게 함
   · 흑백(글자 모양)으로 나오는 기호는 컬러 표시 선택자(FE0F)를 붙이고,
     그래도 흑백인 것은 비슷한 컬러 이모지로 바꿈
   ===================================================================== */
const EMOJI_SUB = { '✔': '✅', '❔': '❓', '☆': '⭐', '♪': '🎵', '➕': '🆕', '↻': '🔄', '↶': '↩️', '↷': '↪️', '⛄': '☃️', '✕': '✕' };
const EMOJI_KEEP = new Set(['♥', '♀', '♂', '©', '®', '™', '‼', '⁉', '▶', '◀', '☰', '○', '▼', '▲', '↑', '↓', '←', '→', '·']);
const _EMO_ANY = /[←-⯿㊗㊙‼⁉™ℹⓂ\u{1F000}-\u{1FAFF}]/u;
const _EMO_FIX = /(\p{Extended_Pictographic})(️)?/gu;
const _EMO_PRES = /\p{Emoji_Presentation}/u;
function fixEmoji(s) {
  if (typeof s !== 'string' || !_EMO_ANY.test(s)) return s;
  return s.replace(_EMO_FIX, (m, ch, vs) => {
    if (EMOJI_SUB[ch] && EMOJI_SUB[ch] !== ch) return EMOJI_SUB[ch];
    if (vs || EMOJI_KEEP.has(ch) || _EMO_PRES.test(ch)) return m;
    return ch + '️';
  });
}
/* 화면 글자 */
function emojiFixNode(root) {
  if (!root) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => { const p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT; return _EMO_ANY.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
  const list = []; while (tw.nextNode()) list.push(tw.currentNode);
  for (const n of list) { const v = fixEmoji(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
}
let _emoQ = new Set(), _emoRaf = 0;
function emojiFixSoon(el) { _emoQ.add(el); if (_emoRaf) return; _emoRaf = requestAnimationFrame(() => { _emoRaf = 0; const q = [..._emoQ]; _emoQ.clear(); for (const e of q) if (e.isConnected) emojiFixNode(e); }); }
window.addEventListener('DOMContentLoaded', () => {
  const root = $('#game') || document.body;
  emojiFixNode(root);
  new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') { if (m.target.parentNode) emojiFixSoon(m.target.parentNode); } else for (const n of m.addedNodes) { if (n.nodeType === 3) { if (n.parentNode) emojiFixSoon(n.parentNode); } else if (n.nodeType === 1) emojiFixSoon(n); } } }).observe(root, { childList: true, subtree: true, characterData: true });
});
/* 캔버스 글자 (말풍선 · 이름표 · 지도 표시) */
{
  const CP = CanvasRenderingContext2D.prototype, _f = CP.fillText, _s = CP.strokeText, _m = CP.measureText;
  CP.fillText = function (t, ...a) { return _f.call(this, fixEmoji(t), ...a); };
  CP.strokeText = function (t, ...a) { return _s.call(this, fixEmoji(t), ...a); };
  CP.measureText = function (t) { return _m.call(this, fixEmoji(t)); };
}
