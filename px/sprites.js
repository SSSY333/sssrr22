/* =========================================================================
   보장원 도트 — 픽셀 그림 도구 (캐릭터 · 가구 · 건물)
   모든 그림은 코드로 한 칸 한 칸 찍어서 만들어요 (외부 그림 파일 없음)
   ========================================================================= */
export const T = 16; // 한 칸 = 16 픽셀

export function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}
export const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export function shade(c, k) { // k<0 어둡게, k>0 밝게
  const n = parseInt(c.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
// 투명한 곳 중 그림에 붙은 칸에 테두리를 찍어요 (도트 느낌)
export function outline(c, col = '#2a1f2d') {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const d = g.getImageData(0, 0, w, h), a = d.data;
  const n = parseInt(col.slice(1), 16), cr = n >> 16, cg = (n >> 8) & 255, cb = n & 255;
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40;
  const mark = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (op(x, y)) continue;
    if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) mark.push((y * w + x) * 4);
  }
  for (const i of mark) { a[i] = cr; a[i + 1] = cg; a[i + 2] = cb; a[i + 3] = 255; }
  g.putImageData(d, 0, 0);
  return c;
}
export function flipX(src) {
  const [c, g] = mk(src.width, src.height);
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
// 작은 해시 (모든 접속자에게 같은 '무작위')
export const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/* ---------- 캐릭터 ---------- */
export const DESIGNS = [
  { name: '비니', skin: '#f6d3b8', shirt: '#f08a4b', pants: '#4a3a5a', hair: '#5a3a28', shoe: '#f2efe8', acc: 'beanie', accColor: '#f2c14e' },
  { name: '안경', skin: '#efc3a2', shirt: '#7cc6b4', pants: '#2f3542', hair: '#17120f', shoe: '#2a2522', acc: 'glasses', long: true },
  { name: '카디건', skin: '#f8ddc8', shirt: '#c89b6d', pants: '#6b5a4a', hair: '#6b4630', shoe: '#8a4b34', acc: 'none' },
  { name: '정장', skin: '#e2ad8a', shirt: '#2c3446', pants: '#2c3446', hair: '#15110f', shoe: '#141210', acc: 'suit' },
  { name: '헤드폰', skin: '#f6dcc4', shirt: '#b49ad8', pants: '#2c3e66', hair: '#c08a5a', shoe: '#f2efe8', acc: 'phones', accColor: '#f4efe6', long: true },
];
export const CW = 18, CH = 25; // 캐릭터 그림 크기 (테두리 1칸 포함)
// dir: 0 아래(정면) 1 위(뒤) 2 왼쪽 3 오른쪽 · frame: 0 서기 1,2 걷기 · pose: stand | sit | sleep
function paintChar(d, dir, frame, pose) {
  const [c, g] = mk(CW, CH);
  const O = 1; // 테두리 여백
  const P = (x, y, w, h, col) => R(g, O + x, O + y, w, h, col);
  const sit = pose === 'sit', sleep = pose === 'sleep';
  const by = sit ? 2 : 0; // 앉으면 몸이 내려가요
  const skin = d.skin, sk2 = shade(d.skin, -0.12), hair = d.hair, hr2 = shade(d.hair, 0.18);
  const shirt = d.shirt, sh2 = shade(d.shirt, -0.18), pants = d.pants, pn2 = shade(d.pants, -0.2);
  const side = dir >= 2;
  const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  // 다리 · 신발
  if (!sit) {
    if (!side) {
      const l = frame === 1 ? 1 : 0, r = frame === 2 ? 1 : 0;
      P(4, 16, 3, 4 - l, pants); P(8, 16, 3, 4 - r, pants);
      P(4, 20 - l, 3, 1, d.shoe); P(8, 20 - r, 3, 1, d.shoe);
      P(6, 16, 1, 3, pn2);
    } else {
      const a = frame === 1 ? -1 : frame === 2 ? 1 : 0;
      P(6 + a, 16, 3, 4, pn2); P(6 - a, 16, 3, 4, pants);
      P(6 + a + (dir === 3 ? 1 : -1) * 0, 20, 3, 1, shade(d.shoe, -0.15)); P(6 - a, 20, 3, 1, d.shoe);
    }
  } else if (dir === 0) { // 앉아서 무릎이 앞으로
    P(4, 16 + by, 3, 2, pants); P(8, 16 + by, 3, 2, pants); P(4, 18 + by, 3, 1, d.shoe); P(8, 18 + by, 3, 1, d.shoe);
  } else if (side) {
    P(dir === 3 ? 6 : 3, 16 + by, 6, 2, pants); P(dir === 3 ? 11 : 2, 16 + by, 2, 2, d.shoe);
  }
  // 몸통
  P(3, 10 + by, 9, 6, shirt);
  P(3, 15 + by, 9, 1, sh2);
  if (d.acc === 'suit' && dir !== 1) { P(6, 10 + by, 3, 3, '#f4f1ea'); P(7, 11 + by, 1, 4, '#c0392b'); }
  if (d.acc === 'none' && dir !== 1) { P(7, 10 + by, 1, 6, sh2); P(5, 12 + by, 1, 1, shade(shirt, 0.3)); P(9, 12 + by, 1, 1, shade(shirt, 0.3)); }
  // 팔
  if (!side) {
    P(2, 10 + by + (swing > 0 ? 1 : 0), 1, 5, sh2); P(2, 15 + by + (swing > 0 ? 1 : 0), 1, 1, skin);
    P(12, 10 + by + (swing < 0 ? 1 : 0), 1, 5, sh2); P(12, 15 + by + (swing < 0 ? 1 : 0), 1, 1, skin);
  } else {
    const ax = 6 + swing;
    P(ax, 11 + by, 2, 4, sh2); P(ax, 15 + by, 2, 1, skin);
  }
  // 머리
  const hy = by;
  P(2, 1 + hy, 11, 9, skin);
  P(2, 9 + hy, 11, 1, sk2);
  if (dir === 1) { // 뒷모습: 머리카락
    P(2, 0 + hy, 11, 9, hair); P(3, 0 + hy, 9, 1, hr2);
    if (d.long) P(2, 9 + hy, 11, 3, hair);
  } else if (!side) {
    P(2, 0 + hy, 11, 3, hair); P(3, 0 + hy, 9, 1, hr2); P(2, 3 + hy, 1, 4, hair); P(12, 3 + hy, 1, 4, hair);
    P(4, 3 + hy, 2, 1, hair); P(9, 3 + hy, 1, 1, hair);
    if (d.long) { P(1, 3 + hy, 2, 9, hair); P(12, 3 + hy, 2, 9, hair); }
    if (sleep) { P(4, 6 + hy, 2, 1, '#3a2a2a'); P(9, 6 + hy, 2, 1, '#3a2a2a'); }
    else { P(4, 5 + hy, 2, 2, '#2a1f2d'); P(9, 5 + hy, 2, 2, '#2a1f2d'); P(4, 5 + hy, 1, 1, '#ffffff'); P(9, 5 + hy, 1, 1, '#ffffff'); }
    P(3, 7 + hy, 1, 1, '#f39a9a'); P(11, 7 + hy, 1, 1, '#f39a9a');
    P(6, 8 + hy, 3, 1, sleep ? sk2 : '#c4635a');
  } else { // 옆모습
    const f = dir === 3; // 오른쪽을 봐요
    P(2, 0 + hy, 11, 3, hair); P(3, 0 + hy, 9, 1, hr2);
    if (f) { P(2, 3 + hy, 5, 6, hair); P(10, 5 + hy, 2, 2, '#2a1f2d'); P(11, 5 + hy, 1, 1, '#ffffff'); P(12, 7 + hy, 1, 1, '#f39a9a'); P(10, 8 + hy, 2, 1, '#c4635a'); }
    else { P(8, 3 + hy, 5, 6, hair); P(3, 5 + hy, 2, 2, '#2a1f2d'); P(3, 5 + hy, 1, 1, '#ffffff'); P(2, 7 + hy, 1, 1, '#f39a9a'); P(3, 8 + hy, 2, 1, '#c4635a'); }
    if (d.long) P(f ? 1 : 9, 3 + hy, 5, 9, hair);
  }
  // 소품
  if (d.acc === 'beanie') {
    const b = d.accColor, b2 = shade(b, -0.2);
    P(2, -1 + hy, 11, 4, b); P(2, 2 + hy, 11, 1, b2); P(6, -2 + hy, 3, 1, shade(b, 0.4));
    for (let x = 3; x < 13; x += 2) P(x, 0 + hy, 1, 2, b2);
  } else if (d.acc === 'glasses' && dir !== 1) {
    if (!side) { P(3, 5 + hy, 4, 1, '#2a1f2d'); P(8, 5 + hy, 4, 1, '#2a1f2d'); P(7, 5 + hy, 1, 1, '#2a1f2d'); }
    else P(dir === 3 ? 9 : 2, 5 + hy, 4, 1, '#2a1f2d');
  } else if (d.acc === 'phones') {
    const b = d.accColor;
    P(3, -1 + hy, 9, 1, b);
    if (!side) { P(1, 4 + hy, 2, 4, '#5a5f8a'); P(12, 4 + hy, 2, 4, '#5a5f8a'); P(2, 0 + hy, 1, 4, b); P(12, 0 + hy, 1, 4, b); }
    else { P(6, 0 + hy, 1, 4, b); P(5, 4 + hy, 3, 4, '#5a5f8a'); }
  }
  return outline(c);
}
// 캐릭터 그림 묶음: sheet[dir][frame], sit[dir], sleep
const sheetCache = new Map();
export function charSheet(i) {
  if (sheetCache.has(i)) return sheetCache.get(i);
  const d = DESIGNS[i] || DESIGNS[0];
  const S = { walk: [], sit: [], sleep: paintChar(d, 0, 0, 'sleep') };
  for (let dir = 0; dir < 4; dir++) {
    S.walk.push([0, 1, 2].map((f) => paintChar(d, dir, f, 'stand')));
    S.sit.push(paintChar(d, dir, 0, 'sit'));
  }
  sheetCache.set(i, S);
  return S;
}
// 입장 화면용 큰 미리보기
export function charPreview(i, scale = 4) {
  const s = charSheet(i).walk[0][0];
  const [c, g] = mk(CW * scale, CH * scale);
  g.drawImage(s, 0, 0, CW * scale, CH * scale);
  return c;
}

/* ---------- 들고 있는 물건 아이콘 (8x8) ---------- */
export const ITEMS = {};
function item(name, draw) { const [c, g] = mk(9, 9); draw((x, y, w, h, col) => R(g, x, y, w, h, col)); ITEMS[name] = outline(c); }
item('coffee', (P) => { P(1, 2, 6, 6, '#f4efe6'); P(1, 2, 6, 2, '#7a4e3a'); P(7, 3, 1, 3, '#f4efe6'); P(2, 5, 4, 1, '#e0703c'); });
item('water', (P) => { P(2, 2, 5, 6, '#cfeaf5'); P(2, 4, 5, 4, '#6fb7d8'); });
item('snack', (P) => { P(1, 1, 7, 7, '#f2b33d'); P(2, 2, 5, 2, '#d6452f'); P(3, 5, 3, 2, '#fff3c4'); });
item('book', (P) => { P(1, 1, 7, 7, '#1f4fa0'); P(1, 1, 1, 7, '#163a78'); P(3, 3, 4, 1, '#f4efe6'); });
item('paper', (P) => { P(1, 0, 6, 8, '#ffffff'); P(2, 2, 4, 1, '#9aa3aa'); P(2, 4, 4, 1, '#9aa3aa'); });
item('bread', (P) => { P(1, 3, 7, 4, '#d9954a'); P(2, 2, 5, 1, '#e8b06a'); P(3, 4, 1, 1, '#a8642c'); P(5, 4, 1, 1, '#a8642c'); });
item('tteok', (P) => { P(0, 4, 8, 4, '#f4efe6'); P(1, 2, 6, 3, '#d6452f'); P(2, 2, 1, 1, '#f6a08a'); });
item('latte', (P) => { P(1, 2, 6, 6, '#e9c46a'); P(1, 2, 6, 2, '#f4efe6'); P(7, 3, 1, 3, '#e9c46a'); });
item('cake', (P) => { P(1, 3, 7, 5, '#f6d5d8'); P(1, 3, 7, 1, '#ffffff'); P(4, 1, 1, 2, '#d6452f'); });
item('pizza', (P) => { P(1, 1, 7, 2, '#c27a3a'); P(2, 3, 5, 2, '#f2c14e'); P(3, 5, 3, 2, '#f2c14e'); P(4, 7, 1, 1, '#f2c14e'); P(3, 3, 1, 1, '#c62828'); P(5, 4, 1, 1, '#c62828'); });
item('paddle', (P) => { P(1, 0, 6, 6, '#c62828'); P(3, 6, 2, 3, '#8a5a3a'); });

/* ---------- 가구 · 사물 그림 ---------- */
// 사물 그림은 (그림, 기준점 x, 기준점 y) — 기준점 = 바닥에 닿는 아래 가운데
export function sprite(w, h, draw, { ol = true, ax = w / 2 + 1, ay = h + 1 } = {}) {
  const [c, g] = mk(w + 2, h + 2);
  draw((x, y, ww, hh, col) => R(g, x + 1, y + 1, ww, hh, col), g);
  if (ol) outline(c);
  return { c, ax, ay };
}
export const PAL = {
  wood: '#c8925a', wood2: '#a8723e', wood3: '#e0b07a', dark: '#2a1f2d', metal: '#9aa3aa', metal2: '#6e767c',
  white: '#f4f1ea', screen: '#26324a', leaf: '#5aa04a', leaf2: '#3e7c3a', pot: '#d0784a',
};
export const SPR = {};
const S = (name, ...a) => (SPR[name] = sprite(...a));

// 책상 (2칸 폭) — 모니터는 위쪽(벽 쪽)에
S('desk', 30, 22, (P) => {
  P(0, 8, 30, 10, PAL.wood3); P(0, 16, 30, 2, PAL.wood2); P(1, 18, 2, 4, PAL.wood2); P(27, 18, 2, 4, PAL.wood2);
  P(9, 0, 12, 8, '#3a3d42'); P(10, 1, 10, 6, PAL.screen); P(11, 2, 4, 1, '#7cc6b4'); P(11, 4, 7, 1, '#5a6a8a'); P(14, 8, 2, 2, '#3a3d42');
  P(8, 11, 10, 3, '#e6e2da'); P(21, 11, 3, 4, '#f2efe8');
});
// 책상 (모니터가 아래쪽 — 마주 보는 자리)
S('deskB', 30, 22, (P) => {
  P(0, 4, 30, 10, PAL.wood3); P(0, 14, 30, 2, PAL.wood2); P(1, 16, 2, 6, PAL.wood2); P(27, 16, 2, 6, PAL.wood2);
  P(9, 10, 12, 8, '#4a4d52'); P(10, 11, 10, 2, '#5a5d62'); P(14, 18, 2, 2, '#3a3d42');
  P(8, 6, 10, 3, '#e6e2da');
});
const CHAIR_COLS = ['#e0703c', '#7cc6b4', '#f2c14e', '#b49ad8', '#6aa7a0', '#e889a0'];
CHAIR_COLS.forEach((col, i) => {
  S('chair' + i, 12, 14, (P) => { P(1, 0, 10, 7, col); P(1, 6, 10, 2, shade(col, -0.25)); P(2, 8, 8, 2, shade(col, -0.1)); P(5, 10, 2, 2, PAL.metal2); P(2, 12, 8, 2, '#3a3d42'); });
  S('chairB' + i, 12, 12, (P) => { P(1, 0, 10, 4, shade(col, -0.1)); P(1, 4, 10, 4, col); P(5, 8, 2, 2, PAL.metal2); P(2, 10, 8, 2, '#3a3d42'); });
});
S('plant', 14, 22, (P) => {
  P(3, 14, 8, 8, PAL.pot); P(3, 14, 8, 2, shade(PAL.pot, 0.2)); P(4, 20, 6, 2, shade(PAL.pot, -0.2));
  P(2, 6, 4, 8, PAL.leaf); P(8, 5, 4, 9, PAL.leaf); P(5, 0, 4, 14, PAL.leaf2); P(0, 9, 3, 4, PAL.leaf2); P(11, 8, 3, 4, PAL.leaf2); P(6, 2, 2, 3, '#7cc05a');
});
S('bigplant', 22, 34, (P) => {
  P(5, 24, 12, 10, '#e6e2da'); P(5, 24, 12, 2, '#ffffff'); P(6, 32, 10, 2, '#c8c2b8');
  P(2, 10, 8, 14, PAL.leaf); P(12, 8, 8, 16, PAL.leaf); P(7, 0, 8, 24, PAL.leaf2); P(0, 14, 4, 6, PAL.leaf2); P(18, 12, 4, 7, PAL.leaf2);
  P(9, 3, 3, 4, '#7cc05a'); P(14, 11, 3, 3, '#7cc05a'); P(4, 13, 3, 3, '#7cc05a');
});
S('ginkgo', 34, 54, (P) => { // 가을 은행나무
  P(15, 34, 5, 20, '#6a4a32'); P(16, 34, 2, 20, '#7d5a3e');
  const blob = [[4, 14, 26, 16], [0, 20, 34, 12], [7, 6, 20, 12], [11, 0, 12, 10], [3, 28, 28, 8]];
  for (const [x, y, w, h] of blob) P(x, y, w, h, '#f2b33d');
  for (const [x, y, w, h] of [[6, 16, 6, 4], [20, 10, 6, 4], [14, 24, 8, 4], [2, 24, 6, 3], [24, 22, 6, 4], [12, 4, 6, 3]]) P(x, y, w, h, '#f6d36a');
  for (const [x, y, w, h] of [[4, 30, 8, 4], [22, 30, 8, 4], [26, 18, 5, 4], [8, 10, 4, 4]]) P(x, y, w, h, '#d9952a');
});
S('lamp', 8, 52, (P) => { P(3, 6, 2, 44, '#3a3d42'); P(0, 0, 8, 6, '#2c2c33'); P(1, 5, 6, 2, '#ffe2a0'); P(1, 48, 6, 4, '#2c2c33'); });
S('bench', 40, 16, (P) => { P(0, 0, 40, 4, PAL.wood); P(0, 5, 40, 4, PAL.wood2); P(2, 9, 3, 7, '#3a3d42'); P(35, 9, 3, 7, '#3a3d42'); P(0, 4, 40, 1, PAL.wood2); });
S('busstop', 46, 40, (P) => {
  P(0, 0, 46, 4, '#2f6fd6'); P(2, 4, 2, 34, PAL.metal2); P(42, 4, 2, 34, PAL.metal2); P(4, 6, 38, 20, '#cfe3ec'); P(6, 8, 10, 14, '#f2c14e'); P(8, 11, 6, 2, '#2a1f2d');
  P(4, 28, 38, 4, PAL.wood); P(4, 32, 38, 2, PAL.wood2);
});
S('hydrant', 8, 12, (P) => { P(1, 2, 6, 10, '#d6452f'); P(0, 4, 8, 2, '#a8321e'); P(2, 0, 4, 2, '#d6452f'); });
S('trash', 10, 14, (P) => { P(0, 0, 10, 3, '#4a5a4a'); P(1, 3, 8, 11, '#6a7a6a'); P(3, 5, 4, 1, '#4a5a4a'); });
S('bins', 26, 16, (P) => {
  [['#2f6fd6', 0], ['#2e7d32', 9], ['#f2b33d', 18]].forEach(([c, x]) => { P(x, 0, 8, 3, shade(c, -0.25)); P(x, 3, 8, 13, c); P(x + 2, 6, 4, 2, '#ffffff'); });
});
S('sofaL', 64, 26, (P) => { // 라운지 큰 소파 (등받이가 위쪽)
  const c = '#e0703c', c2 = shade(c, -0.22), c3 = shade(c, 0.18);
  P(0, 0, 64, 10, c2); P(0, 8, 64, 14, c); P(0, 0, 6, 22, c2); P(58, 0, 6, 22, c2);
  for (const x of [7, 24, 41]) { P(x, 9, 16, 11, c3); P(x, 18, 16, 2, c); }
  P(10, 2, 8, 6, '#f2c14e'); P(46, 2, 8, 6, '#7cc6b4'); P(1, 22, 62, 4, c2);
});
S('sofaS', 30, 24, (P) => { // 1~2인 소파 (옆으로)
  const c = '#6aa7a0', c2 = shade(c, -0.25);
  P(0, 0, 30, 9, c2); P(0, 7, 30, 13, c); P(0, 0, 5, 20, c2); P(25, 0, 5, 20, c2); P(6, 9, 18, 9, shade(c, 0.15)); P(1, 20, 28, 4, c2);
});
S('beanbag', 20, 16, (P) => { P(1, 3, 18, 12, '#f2c14e'); P(3, 1, 14, 4, '#f6d36a'); P(4, 6, 12, 6, '#f6d36a'); P(1, 13, 18, 3, '#d9a52a'); });
S('beanbag2', 20, 16, (P) => { P(1, 3, 18, 12, '#b49ad8'); P(3, 1, 14, 4, '#c9b6e6'); P(4, 6, 12, 6, '#c9b6e6'); P(1, 13, 18, 3, '#8f78b8'); });
S('ctable', 36, 18, (P) => { P(0, 0, 36, 12, PAL.wood); P(0, 10, 36, 2, PAL.wood2); P(2, 12, 3, 6, PAL.wood2); P(31, 12, 3, 6, PAL.wood2); P(6, 3, 6, 4, '#f4efe6'); P(20, 2, 8, 5, '#d6452f'); P(21, 3, 6, 3, '#f2b33d'); });
S('pingpong', 60, 34, (P) => {
  P(0, 0, 60, 26, '#2e7d5a'); P(0, 0, 60, 1, '#ffffff'); P(0, 25, 60, 1, '#ffffff'); P(0, 0, 1, 26, '#ffffff'); P(59, 0, 1, 26, '#ffffff'); P(0, 12, 60, 1, '#ffffff');
  P(29, -2, 2, 30, '#e6e2da'); P(28, 26, 4, 2, '#3a3d42'); P(2, 26, 56, 2, '#1f5a40'); P(4, 28, 3, 6, '#3a3d42'); P(53, 28, 3, 6, '#3a3d42');
});
S('shelf', 48, 36, (P) => { // 벽에 붙은 책장
  P(0, 0, 48, 36, PAL.wood2); P(2, 2, 44, 32, '#7a4e2a');
  const cols = ['#d6452f', '#1f4fa0', '#f2b33d', '#2e7d32', '#e889a0', '#7cc6b4', '#f4efe6', '#8a5a3a'];
  for (const y of [2, 13, 24]) {
    let x = 3;
    for (let k = 0; x < 44; k++) { const w = 3 + (k * 7 % 3); const h = 8 + (k * 5 % 3); P(x, y + 10 - h, w, h, cols[(k + y) % cols.length]); x += w + (k % 4 === 3 ? 3 : 0); }
    P(2, y + 10, 44, 1, PAL.wood);
  }
});
S('meetTable', 112, 36, (P) => {
  P(0, 0, 112, 28, '#f2efe8'); P(0, 26, 112, 2, '#d8d2c6'); P(4, 28, 4, 8, PAL.metal2); P(104, 28, 4, 8, PAL.metal2); P(52, 28, 8, 8, PAL.metal2);
  for (const x of [12, 40, 68, 92]) P(x, 6, 10, 7, '#ffffff');
  P(50, 10, 12, 8, '#3a3d42'); P(51, 11, 10, 5, '#5a6a8a');
});
S('tv', 64, 30, (P) => { P(0, 0, 64, 30, '#2a2a30'); P(2, 2, 60, 24, '#26324a'); P(6, 5, 24, 3, '#f2b33d'); P(6, 11, 50, 2, '#7cc6b4'); P(6, 16, 36, 2, '#e889a0'); P(48, 14, 8, 8, '#f4efe6'); });
S('whiteb', 44, 26, (P) => { P(0, 0, 44, 26, '#b8bec4'); P(2, 2, 40, 20, '#ffffff'); P(5, 5, 20, 1, '#1e63d6'); P(5, 9, 28, 1, '#e53935'); P(5, 13, 14, 1, '#2e7d32'); P(2, 22, 40, 2, '#9aa3aa'); });
S('printer', 26, 24, (P) => {
  P(0, 4, 26, 16, '#e6e2da'); P(0, 4, 26, 2, '#ffffff'); P(3, 0, 20, 5, '#d0cbc2'); P(4, 1, 18, 2, '#ffffff'); P(2, 9, 22, 3, '#3a3d42'); P(4, 14, 18, 2, '#c8c2b8');
  P(19, 6, 4, 2, '#3a3d42'); P(20, 6, 1, 1, '#4caf50'); P(0, 20, 26, 4, '#b8b2a8');
});
S('shredder', 16, 22, (P) => { P(0, 0, 16, 6, '#3a3d42'); P(3, 2, 10, 1, '#111111'); P(0, 6, 16, 16, '#5a5f66'); P(2, 8, 12, 10, '#4a4f56'); P(12, 2, 2, 2, '#4caf50'); });
S('paperShelf', 30, 28, (P) => { P(0, 0, 30, 28, '#9aa3aa'); for (const y of [2, 10, 18]) { P(2, y, 26, 6, '#7a8288'); P(3, y + 1, 10, 5, '#ffffff'); P(15, y + 2, 11, 4, '#f4f1ea'); } });
S('counter', 112, 30, (P) => { // 탕비실 조리대 (벽에 붙음)
  P(0, 6, 112, 24, '#e6e2da'); P(0, 6, 112, 4, '#ffffff'); P(0, 28, 112, 2, '#c8c2b8');
  for (let x = 4; x < 108; x += 18) { P(x, 12, 16, 14, '#f2efe8'); P(x + 13, 17, 2, 4, '#9aa3aa'); }
  P(58, 8, 18, 4, '#9aa3aa'); P(66, 0, 2, 8, '#9aa3aa'); P(64, 0, 6, 2, '#9aa3aa'); // 싱크대
  P(86, 0, 18, 8, '#3a3d42'); P(88, 2, 12, 4, '#26324a'); // 전자레인지
});
S('coffeeM', 18, 22, (P) => { P(0, 0, 18, 22, '#3a3d42'); P(2, 2, 14, 5, '#5a5f66'); P(3, 3, 4, 2, '#e0703c'); P(5, 9, 8, 3, '#9aa3aa'); P(6, 12, 6, 6, '#26262a'); P(7, 15, 4, 3, '#f4efe6'); P(0, 20, 18, 2, '#26262a'); });
S('fridge', 26, 44, (P) => { P(0, 0, 26, 44, '#dfe6ea'); P(0, 0, 26, 2, '#ffffff'); P(0, 16, 26, 2, '#b8c2c8'); P(21, 6, 2, 8, '#9aa3aa'); P(21, 22, 2, 14, '#9aa3aa'); P(4, 4, 6, 4, '#f2b33d'); P(12, 6, 5, 5, '#e889a0'); });
S('snackShelf', 30, 36, (P) => {
  P(0, 0, 30, 36, PAL.wood2); P(2, 2, 26, 32, '#7a4e2a');
  const c = ['#f2b33d', '#d6452f', '#2f6fd6', '#2e7d32', '#e889a0', '#f4efe6'];
  for (const [y, k] of [[3, 0], [14, 2], [25, 4]]) { for (let i = 0; i < 4; i++) P(3 + i * 6, y, 5, 8, c[(i + k) % c.length]); P(2, y + 8, 26, 1, PAL.wood); }
});
S('water', 14, 32, (P) => { P(2, 0, 10, 12, '#9fd3e8'); P(3, 2, 8, 8, '#cfeaf5'); P(0, 12, 14, 20, '#f2efe8'); P(3, 15, 3, 3, '#1e63d6'); P(8, 15, 3, 3, '#e53935'); P(2, 20, 10, 2, '#c8c2b8'); });
S('hiTable', 30, 26, (P) => { P(0, 0, 30, 14, '#f4f1ea'); P(0, 12, 30, 2, '#c8c2b8'); P(13, 14, 4, 10, PAL.metal2); P(8, 24, 14, 2, PAL.metal2); P(5, 3, 5, 5, '#e889a0'); P(18, 4, 6, 4, '#f2b33d'); });
S('stool', 10, 14, (P) => { P(0, 0, 10, 4, '#e0703c'); P(4, 4, 2, 8, PAL.metal2); P(1, 12, 8, 2, PAL.metal2); });
S('bed', 34, 48, (P) => {
  P(0, 0, 34, 8, PAL.wood2); P(1, 1, 32, 6, PAL.wood);
  P(1, 8, 32, 38, '#f4f1ea'); P(4, 10, 26, 9, '#ffffff'); P(4, 17, 26, 2, '#e6e2da');
  P(1, 22, 32, 24, '#8fb8de'); P(1, 22, 32, 3, '#b8d4ee'); for (let y = 28; y < 46; y += 6) P(1, y, 32, 1, '#7aa4cc');
  P(0, 44, 34, 4, PAL.wood2);
});
S('moonlamp', 12, 18, (P) => { P(1, 0, 10, 10, '#fff1c4'); P(3, 2, 4, 4, '#ffe08a'); P(4, 10, 4, 6, PAL.wood2); P(2, 16, 8, 2, PAL.wood2); });
S('curtain', 6, 44, (P) => { P(0, 0, 6, 44, '#e8dcc8'); for (let y = 2; y < 44; y += 6) P(2, y, 1, 4, '#d6c8b0'); });
S('fireplace', 56, 44, (P) => {
  P(0, 4, 56, 40, '#b65a3a'); P(0, 0, 56, 6, '#8a4a30'); for (let y = 8; y < 44; y += 6) for (let x = (y % 12 ? 0 : 6); x < 56; x += 12) P(x, y, 11, 5, '#c66a4a');
  P(12, 16, 32, 26, '#2a1a14'); P(10, 14, 36, 3, '#8a4a30'); P(14, 36, 28, 4, '#4a3020');
});
S('teddy', 26, 30, (P) => {
  const b = '#c08a5a', b2 = '#a06a3a', b3 = '#e0b88a';
  P(1, 0, 7, 7, b); P(18, 0, 7, 7, b); P(3, 2, 3, 3, b3); P(20, 2, 3, 3, b3);
  P(3, 3, 20, 14, b); P(8, 10, 10, 6, b3); P(9, 7, 2, 2, '#2a1f2d'); P(15, 7, 2, 2, '#2a1f2d'); P(12, 11, 2, 2, '#2a1f2d');
  P(2, 16, 22, 12, b); P(7, 18, 12, 8, b3); P(0, 17, 4, 8, b2); P(22, 17, 4, 8, b2); P(3, 27, 8, 3, b2); P(15, 27, 8, 3, b2);
  P(10, 16, 6, 2, '#d6452f');
});
S('rugRound', 1, 1, () => {}, { ol: false });

/* ---------- 큰 건물 그림 ---------- */
// 광화문 (원경 느낌의 대문)
export function gateSprite() {
  const w = 380, h = 250;
  return sprite(w, h, (P) => {
    // 석축
    P(0, 120, w, 130, '#cbbfa8');
    for (let y = 124; y < 250; y += 12) for (let x = ((y / 12) % 2) * 16; x < w; x += 32) P(x, y, 30, 10, '#d8ccb6');
    P(0, 120, w, 4, '#b5a890');
    for (const [x, ww] of [[70, 50], [165, 50], [260, 50]]) { P(x, 150, ww, 100, '#2a1f1a'); P(x - 3, 146, ww + 6, 6, '#b5a890'); }
    P(170, 160, 40, 90, '#3a2a20');
    // 누각 1층
    P(40, 70, 300, 50, '#8a2a20'); for (let x = 48; x < 336; x += 24) P(x, 74, 4, 46, '#c0392b');
    P(40, 66, 300, 6, '#2f6b4f'); P(40, 112, 300, 4, '#2f6b4f');
    for (let x = 52; x < 330; x += 24) P(x, 78, 16, 10, '#2f8a6a');
    // 지붕
    P(10, 44, 360, 24, '#3a3a40'); P(0, 58, 380, 8, '#2a2a30'); for (let x = 6; x < 374; x += 8) P(x, 46, 4, 18, '#4a4a52');
    P(70, 20, 240, 26, '#3a3a40'); P(60, 36, 260, 8, '#2a2a30'); for (let x = 72; x < 308; x += 8) P(x, 22, 4, 16, '#4a4a52');
    P(110, 14, 160, 6, '#2a2a30'); P(0, 54, 8, 6, '#2a2a30'); P(372, 54, 8, 6, '#2a2a30');
    // 현판
    P(166, 50, 48, 18, '#1f1a14'); P(168, 52, 44, 14, '#2a2218'); P(172, 56, 36, 6, '#d6a84a');
  });
}
// 맛집 가게 (정면이 아래쪽)
export const SHOPS = [
  { name: '광화문 빵집', item: 'bread', wall: '#f0e2cf', awn: ['#c0503a', '#fbf3e6'], sign: '#8a3b2a', phr: 'food' },
  { name: '세종 떡볶이', item: 'tteok', wall: '#f2cf5b', awn: ['#d6452f', '#ffffff'], sign: '#d6452f', phr: 'food' },
  { name: '은행나무 커피', item: 'latte', wall: '#7a4e3a', awn: ['#3b2a22', '#e9c46a'], sign: '#3b2a22', phr: 'cafe' },
  { name: '달콤 디저트', item: 'cake', wall: '#f6d5d8', awn: ['#e889a0', '#fff6f8'], sign: '#c95c78', phr: 'cafe' },
  { name: '광장 피자', item: 'pizza', wall: '#e9d2b4', awn: ['#2e7d32', '#f5f1e8'], sign: '#2e7d32', phr: 'food' },
];
export function shopSprite(shop, w, font) {
  const h = 150;
  return sprite(w, h, (P, g) => {
    P(0, 0, w, 40, '#6a5a52'); P(0, 36, w, 4, '#4a3e38'); for (let x = 2; x < w; x += 10) P(x, 4, 6, 30, '#7a6a62'); // 지붕
    P(0, 40, w, 110, shop.wall); P(0, 40, w, 3, shade(shop.wall, 0.2));
    // 2층 창문
    for (let x = 12; x < w - 30; x += 40) { P(x, 50, 26, 20, '#3a4a5a'); P(x + 2, 52, 22, 16, '#9fc3d8'); P(x + 12, 52, 2, 16, '#3a4a5a'); }
    // 간판
    P(8, 76, w - 16, 18, shop.sign); P(10, 78, w - 20, 14, shade(shop.sign, 0.12));
    g.fillStyle = '#fffaf0'; g.font = `11px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(shop.name, w / 2 + 1, 86);
    // 차양
    for (let x = 0, k = 0; x < w; x += 10, k++) P(x, 96, 10, 10, shop.awn[k % 2]);
    for (let x = 0, k = 0; x < w; x += 10, k++) P(x + 2, 106, 6, 3, shop.awn[k % 2]);
    // 진열창 · 문
    P(8, 112, w - 50, 34, '#2a3440'); P(10, 114, w - 54, 30, '#f3e3c4');
    for (let x = 14; x < w - 50; x += 10) { P(x, 132, 7, 5, ['#d9954a', '#d6452f', '#f6d5d8', '#e9c46a'][(x / 10) % 4 | 0]); P(x, 122, 7, 4, '#c8925a'); }
    P(w - 36, 110, 26, 40, '#3a2a20'); P(w - 33, 113, 20, 34, '#b8d4e0'); P(w - 16, 128, 2, 4, '#f2b33d');
  });
}
// 큰 포스터 (가까이서 보기용 고해상도) — 오늘도 수고했어요 · 점심 · 체육대회 · 공지
export function drawPoster(kind, c, W, H, FONT) {
  const T = (txt, x, y, size, color, weight = 800, align = 'center') => { c.fillStyle = color; c.font = `${weight} ${size}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(txt, x, y); };
  if (kind === 'cheer') {
    c.fillStyle = '#c9e8dc'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(W * 0.5, H * 0.36, W * 0.3, 0, 7); c.fill();
    T('오늘도', W / 2, H * 0.3, W * 0.13, '#2f6b4f');
    T('수고했어요', W / 2, H * 0.44, W * 0.13, '#2f6b4f');
    T('☺', W / 2, H * 0.66, W * 0.22, '#e0703c', 400);
    T('물 한 잔 · 스트레칭 한 번', W / 2, H * 0.88, W * 0.06, '#3e7c74', 600);
  } else if (kind === 'lunch') {
    c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#f2b33d'; c.fillRect(0, 0, W, H * 0.16);
    T('🍚 오늘 점심 뭐 먹지?', W / 2, H * 0.08, W * 0.08, '#3b2a22');
    [['칼국수', 5], ['떡볶이', 7], ['국밥', 4], ['피자', 3], ['샐러드', 2]].forEach(([m, n], i) => {
      const y = H * (0.27 + i * 0.14);
      T(m, W * 0.1, y, W * 0.075, '#2b2230', 600, 'left');
      c.strokeStyle = '#d6452f'; c.lineWidth = W * 0.008;
      for (let k = 0; k < n; k++) { const x = W * 0.55 + (k % 5) * W * 0.05 + Math.floor(k / 5) * W * 0.3; c.beginPath(); if (k % 5 === 4) { c.moveTo(x - W * 0.22, y + W * 0.02); c.lineTo(x + W * 0.01, y - W * 0.03); } else { c.moveTo(x, y - W * 0.035); c.lineTo(x, y + W * 0.035); } c.stroke(); }
    });
  } else if (kind === 'sports') {
    c.fillStyle = '#2f6fd6'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) c.fillRect(0, H * (0.6 + i * 0.07), W, H * 0.02);
    c.fillStyle = '#f2b33d'; c.beginPath(); c.moveTo(W * 0.32, H * 0.18); c.lineTo(W * 0.68, H * 0.18); c.quadraticCurveTo(W * 0.68, H * 0.42, W * 0.5, H * 0.45); c.quadraticCurveTo(W * 0.32, H * 0.42, W * 0.32, H * 0.18); c.fill();
    c.fillRect(W * 0.46, H * 0.44, W * 0.08, H * 0.06); c.fillRect(W * 0.38, H * 0.5, W * 0.24, H * 0.04);
    T('보장원 체육대회', W / 2, H * 0.08, W * 0.095, '#fff');
    T('탁구 · 줄다리기 · 계주', W / 2, H * 0.56, W * 0.06, '#fff', 600);
  } else {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#1e8c5a'; c.fillRect(0, 0, W, H * 0.22);
    T('공지', W / 2, H * 0.11, W * 0.13, '#fff');
    T('퇴근 전 모니터 끄기', W / 2, H * 0.42, W * 0.08, '#2b2230', 600);
    T('탕비실 컵은 제자리에', W / 2, H * 0.58, W * 0.08, '#2b2230', 600);
    T('프린터가 화나면 살살 달래기', W / 2, H * 0.74, W * 0.07, '#2b2230', 600);
    T('— 총무팀', W * 0.9, H * 0.9, W * 0.06, '#6e5f62', 400, 'right');
  }
}
// 벽에 붙은 작은 도트 포스터
export function posterPixel(kind) {
  const w = 22, h = 28;
  return sprite(w, h, (P) => {
    if (kind === 'cheer') { P(0, 0, w, h, '#c9e8dc'); P(5, 4, 12, 12, '#fff6d8'); P(8, 8, 2, 2, '#2f6b4f'); P(12, 8, 2, 2, '#2f6b4f'); P(8, 12, 6, 1, '#e0703c'); P(3, 20, 16, 2, '#2f6b4f'); P(5, 24, 12, 1, '#3e7c74'); }
    else if (kind === 'lunch') { P(0, 0, w, h, '#fffaf0'); P(0, 0, w, 5, '#f2b33d'); for (let i = 0; i < 4; i++) { P(2, 8 + i * 5, 7, 2, '#2b2230'); P(12, 7 + i * 5, 1, 4, '#d6452f'); P(14, 7 + i * 5, 1, 4, '#d6452f'); if (i % 2) P(16, 7 + i * 5, 1, 4, '#d6452f'); } }
    else if (kind === 'sports') { P(0, 0, w, h, '#2f6fd6'); P(6, 5, 10, 7, '#f2b33d'); P(9, 12, 4, 3, '#f2b33d'); P(7, 15, 8, 2, '#f2b33d'); for (let y = 19; y < h; y += 3) P(0, y, w, 1, '#ffffff'); }
    else { P(0, 0, w, h, '#ffffff'); P(0, 0, w, 7, '#1e8c5a'); P(7, 2, 8, 3, '#ffffff'); for (let i = 0; i < 4; i++) P(3, 10 + i * 4, 16 - (i % 2) * 4, 2, '#5a5060'); }
  }, { ax: 0, ay: 0 });
}
