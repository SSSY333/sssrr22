/* =====================================================================
   섬 꾸미기 — 바깥(섬)에 놓는 장식 32가지
   · 가구점 카탈로그 「🌳 섬 꾸미기」 탭 또는 꾸미기 막대 🛒에서 사서
   · 메뉴 → 집 → 「섬 꾸미기」(섬 밖에 있을 때): 땅을 누르면 놓고, 놓은 걸 누르면 고르기 → 돌리기 · 넣기
   · 길 · 문 앞 · 벤치 자리 · 선착장은 막지 않게 검사, 문이나 길을 막으면 놓을 수 없음
   ===================================================================== */
const YB = (u0, v0, u1, v1, z0, z1, top, l, r) => _blk(u0, v0, u1, v1, z0, z1, top, l, r);
const YARD = {
  /* 🌷 꽃 · 나무 */
  bedRed: { name: '빨간 꽃 화단', price: 3000, cat: 'flower', blocks: () => [YB(0.1, 0.25, 0.9, 0.75, 0, 5, '#a87a4a'), YB(0.14, 0.3, 0.86, 0.7, 5, 7, '#5aa850'), ...[0.2, 0.4, 0.6, 0.8].map(u => YB(u - 0.06, 0.4, u + 0.06, 0.55, 7, 10, '#e3484a'))] },
  bedYellow: { name: '유채꽃 화단', price: 3000, cat: 'flower', blocks: () => [YB(0.1, 0.25, 0.9, 0.75, 0, 5, '#a87a4a'), YB(0.14, 0.3, 0.86, 0.7, 5, 7, '#5aa850'), ...[0.2, 0.4, 0.6, 0.8].map(u => YB(u - 0.06, 0.38, u + 0.06, 0.58, 7, 11, '#ffe04a'))] },
  bedPurple: { name: '수국 화단', price: 4000, cat: 'flower', blocks: () => [YB(0.1, 0.25, 0.9, 0.75, 0, 5, '#9aa3b0'), YB(0.16, 0.3, 0.46, 0.7, 5, 12, '#a98ae0'), YB(0.5, 0.3, 0.84, 0.7, 5, 12, '#8fb0f0')] },
  potFlower: { name: '꽃 화분', price: 2000, cat: 'flower', blocks: () => [YB(0.36, 0.36, 0.64, 0.64, 0, 8, '#c4704e'), YB(0.32, 0.32, 0.68, 0.68, 8, 14, '#5aa850'), YB(0.4, 0.4, 0.5, 0.5, 14, 17, '#ff9ec4'), YB(0.52, 0.5, 0.62, 0.6, 13, 16, '#ffe27a')] },
  sunflowers: { name: '해바라기', price: 3500, cat: 'flower', blocks: () => [...[0.3, 0.55, 0.75].map((u, i) => [YB(u - 0.03, 0.48, u + 0.03, 0.54, 0, 22 + i * 3, '#4f9e4a'), YB(u - 0.1, 0.44, u + 0.1, 0.58, 22 + i * 3, 28 + i * 3, '#ffd23a'), YB(u - 0.04, 0.5, u + 0.04, 0.58, 24 + i * 3, 27 + i * 3, '#7a5236')]).flat()] },
  roseArch: { name: '장미 아치', price: 12000, cat: 'flower', fw: 2, blocks: () => [YB(0.15, 0.4, 0.3, 0.6, 0, 30, '#ffffff'), YB(1.7, 0.4, 1.85, 0.6, 0, 30, '#ffffff'), YB(0.15, 0.4, 1.85, 0.6, 30, 34, '#ffffff'), YB(0.1, 0.36, 0.38, 0.64, 18, 28, '#4f9e4a'), YB(1.62, 0.36, 1.9, 0.64, 14, 26, '#4f9e4a'), YB(0.6, 0.36, 1.4, 0.64, 32, 37, '#4f9e4a'), YB(0.2, 0.62, 0.3, 0.66, 22, 25, '#e3484a'), YB(1.0, 0.62, 1.1, 0.66, 34, 36, '#ff9ec4'), YB(1.7, 0.62, 1.8, 0.66, 18, 21, '#e3484a')] },
  palmMini: { name: '어린 야자수', price: 8000, cat: 'flower', blocks: () => [YB(0.44, 0.44, 0.56, 0.56, 0, 26, '#a87a4a'), YB(0.2, 0.44, 0.8, 0.56, 26, 29, '#4f9e4a'), YB(0.44, 0.2, 0.56, 0.8, 27, 30, '#5aa850')] },
  orangeTree: { name: '귤나무', price: 15000, cat: 'flower', blocks: () => [YB(0.44, 0.44, 0.56, 0.56, 0, 14, '#7a5236'), YB(0.2, 0.2, 0.8, 0.8, 14, 32, '#4f9e4a', '#3f8a3a', '#357a30'), YB(0.24, 0.76, 0.34, 0.82, 18, 23, '#f39a2b'), YB(0.66, 0.6, 0.76, 0.7, 24, 29, '#f39a2b'), YB(0.5, 0.26, 0.6, 0.34, 30, 34, '#f39a2b')] },
  /* 🪑 쉼터 */
  benchWood: { name: '나무 벤치', price: 6000, cat: 'rest', fw: 2, blocks: () => [YB(0.15, 0.3, 0.25, 0.7, 0, 7, '#7a5236'), YB(1.75, 0.3, 1.85, 0.7, 0, 7, '#7a5236'), YB(0.1, 0.3, 1.9, 0.7, 7, 9, '#c99a64'), YB(0.1, 0.24, 1.9, 0.32, 9, 18, '#a87a4a')] },
  hammock: { name: '해먹', price: 10000, cat: 'rest', fw: 2, blocks: () => [YB(0.1, 0.42, 0.22, 0.58, 0, 22, '#8a5a3a'), YB(1.78, 0.42, 1.9, 0.58, 0, 22, '#8a5a3a'), YB(0.3, 0.36, 1.7, 0.64, 9, 12, '#f2d06a'), YB(0.3, 0.36, 1.7, 0.64, 10, 11, '#e3484a')] },
  picnicTable: { name: '피크닉 테이블', price: 9000, cat: 'rest', fw: 2, blocks: () => [YB(0.2, 0.1, 1.8, 0.24, 0, 6, '#a87a4a'), YB(0.2, 0.76, 1.8, 0.9, 0, 6, '#a87a4a'), YB(0.4, 0.4, 0.5, 0.6, 0, 10, '#7a5236'), YB(1.5, 0.4, 1.6, 0.6, 0, 10, '#7a5236'), YB(0.15, 0.3, 1.85, 0.7, 10, 12, '#c99a64'), YB(0.8, 0.4, 1.2, 0.6, 12, 13, '#ff9ec4')] },
  parasolTable: { name: '파라솔 테이블', price: 8000, cat: 'rest', blocks: () => [YB(0.3, 0.3, 0.7, 0.7, 8, 10, '#ffffff'), YB(0.47, 0.47, 0.53, 0.53, 0, 30, '#ffffff'), YB(0.1, 0.1, 0.9, 0.9, 30, 33, '#3f8fd0'), YB(0.2, 0.2, 0.8, 0.8, 33, 35, '#ffffff')] },
  campChairY: { name: '캠핑 의자', price: 4000, cat: 'rest', blocks: () => [YB(0.3, 0.3, 0.7, 0.7, 4, 6, '#3f8a5a'), YB(0.3, 0.24, 0.7, 0.32, 6, 15, '#3f8a5a'), YB(0.3, 0.3, 0.34, 0.34, 0, 6, '#5b5f69'), YB(0.66, 0.66, 0.7, 0.7, 0, 6, '#5b5f69')] },
  swingChair: { name: '흔들 그네 의자', price: 16000, cat: 'rest', fw: 2, blocks: () => [YB(0.1, 0.4, 0.2, 0.6, 0, 30, '#ffffff'), YB(1.8, 0.4, 1.9, 0.6, 0, 30, '#ffffff'), YB(0.1, 0.4, 1.9, 0.6, 30, 32, '#ffffff'), YB(0.4, 0.3, 1.6, 0.7, 8, 10, '#ff9ec4'), YB(0.4, 0.28, 1.6, 0.34, 10, 18, '#ffd1e3')] },
  /* 💡 불빛 */
  stoneLantern: { name: '석등', price: 9000, cat: 'light', light: true, blocks: () => [YB(0.3, 0.3, 0.7, 0.7, 0, 4, '#9aa3b0'), YB(0.42, 0.42, 0.58, 0.58, 4, 14, '#8a929e'), YB(0.32, 0.32, 0.68, 0.68, 14, 22, '#fff3b8', '#e6dca0', '#d2c88c'), YB(0.26, 0.26, 0.74, 0.74, 22, 26, '#7a808c')] },
  oldLamp: { name: '옛날 가로등', price: 11000, cat: 'light', light: true, blocks: () => [YB(0.4, 0.4, 0.6, 0.6, 0, 3, '#3a3a48'), YB(0.47, 0.47, 0.53, 0.53, 3, 32, '#3a3a48'), YB(0.36, 0.36, 0.64, 0.64, 32, 40, '#fff1c2'), YB(0.34, 0.34, 0.66, 0.66, 40, 42, '#3a3a48')] },
  gardenLights: { name: '정원 전구', price: 7000, cat: 'light', light: true, fw: 2, blocks: () => [YB(0.1, 0.46, 0.16, 0.54, 0, 22, '#7a5236'), YB(1.84, 0.46, 1.9, 0.54, 0, 22, '#7a5236'), YB(0.1, 0.48, 1.9, 0.52, 21, 22, '#5b5f69'), ...[0.4, 0.75, 1.1, 1.45].map((u, i) => YB(u - 0.05, 0.46, u + 0.05, 0.54, 16 + (i % 2) * 2, 20, ['#ffe27a', '#ff9ec4', '#8fd0ff', '#b8f28a'][i]))] },
  torch: { name: '대나무 횃불', price: 5000, cat: 'light', light: true, blocks: () => [YB(0.45, 0.45, 0.55, 0.55, 0, 24, '#c9b46a'), YB(0.42, 0.42, 0.58, 0.58, 24, 27, '#8a6a3a'), YB(0.44, 0.44, 0.56, 0.56, 27, 32, '#ffb35a')] },
  /* 🏝 섬 소품 */
  hareubang: { name: '수호 석상', price: 14000, cat: 'island', blocks: () => [YB(0.3, 0.32, 0.7, 0.68, 0, 4, '#5b5f69'), YB(0.34, 0.36, 0.66, 0.64, 4, 26, '#7a808c', '#6a707c', '#5a606c'), YB(0.3, 0.32, 0.7, 0.68, 26, 32, '#5b5f69'), YB(0.4, 0.62, 0.46, 0.66, 20, 23, '#3a3e46'), YB(0.54, 0.62, 0.6, 0.66, 20, 23, '#3a3e46')] },
  stoneWall: { name: '돌담', price: 4000, cat: 'island', fw: 2, blocks: () => [YB(0.05, 0.38, 1.95, 0.62, 0, 10, '#5b5f69', '#4c4f58', '#41444c'), YB(0.3, 0.4, 0.7, 0.6, 10, 14, '#6a707c'), YB(1.1, 0.4, 1.6, 0.6, 10, 13, '#6a707c')] },
  steppingStones: { name: '징검다리 돌', price: 2000, cat: 'island', flat: true, solid: false, blocks: () => [YB(0.15, 0.2, 0.4, 0.42, 0, 2, '#9aa3b0'), YB(0.55, 0.5, 0.82, 0.75, 0, 2, '#8a929e')] },
  pond: { name: '작은 연못', price: 12000, cat: 'island', fw: 2, fd: 2, blocks: () => [YB(0.1, 0.1, 1.9, 1.9, 0, 2, '#9aa3b0'), YB(0.25, 0.25, 1.75, 1.75, 1, 2.2, '#5aa0d8'), YB(0.5, 0.6, 0.8, 0.85, 2.2, 3, '#5aa850'), YB(1.2, 1.1, 1.4, 1.3, 2.2, 3, '#f39a2b')] },
  fountain: { name: '분수', price: 20000, cat: 'island', fw: 2, fd: 2, light: true, blocks: () => [YB(0.15, 0.15, 1.85, 1.85, 0, 6, '#d9d6dd'), YB(0.3, 0.3, 1.7, 1.7, 5, 6.5, '#8fd0ff'), YB(0.85, 0.85, 1.15, 1.15, 6, 18, '#d9d6dd'), YB(0.75, 0.75, 1.25, 1.25, 18, 20, '#bfe8f7')] },
  mailbox: { name: '빨간 우체통', price: 5000, cat: 'island', blocks: () => [YB(0.45, 0.45, 0.55, 0.55, 0, 12, '#5b5f69'), YB(0.34, 0.38, 0.66, 0.62, 12, 22, '#e3484a'), YB(0.4, 0.6, 0.6, 0.63, 18, 19, '#3a2a26')] },
  birdhouse: { name: '새집', price: 4500, cat: 'island', blocks: () => [YB(0.46, 0.46, 0.54, 0.54, 0, 22, '#7a5236'), YB(0.34, 0.36, 0.66, 0.64, 22, 30, '#f2d06a'), YB(0.3, 0.32, 0.7, 0.68, 30, 33, '#c96a3a'), YB(0.46, 0.62, 0.54, 0.65, 25, 28, '#3a2a26')] },
  windmillMini: { name: '바람개비', price: 3000, cat: 'island', blocks: () => [YB(0.47, 0.47, 0.53, 0.53, 0, 20, '#ffffff'), YB(0.36, 0.48, 0.48, 0.52, 20, 26, '#e3484a'), YB(0.52, 0.48, 0.64, 0.52, 18, 24, '#3f8fd0'), YB(0.46, 0.48, 0.54, 0.52, 24, 30, '#ffd23a')] },
  scarecrow: { name: '허수아비', price: 6000, cat: 'island', blocks: () => [YB(0.47, 0.47, 0.53, 0.53, 0, 22, '#8a5a3a'), YB(0.2, 0.46, 0.8, 0.54, 18, 21, '#8a5a3a'), YB(0.38, 0.4, 0.62, 0.6, 12, 22, '#3f6fb5'), YB(0.4, 0.42, 0.6, 0.58, 22, 28, '#f2d8a0'), YB(0.3, 0.32, 0.7, 0.68, 28, 30, '#d9b44f')] },
  woodPile: { name: '장작 더미', price: 3000, cat: 'island', blocks: () => [YB(0.2, 0.3, 0.8, 0.7, 0, 5, '#8a5a3a'), YB(0.26, 0.34, 0.74, 0.66, 5, 9, '#a87a4a'), YB(0.34, 0.38, 0.66, 0.62, 9, 12, '#8a5a3a')] },
  bicycle: { name: '자전거', price: 12000, cat: 'island', blocks: () => [YB(0.15, 0.46, 0.4, 0.54, 0, 9, '#3a3a48'), YB(0.6, 0.46, 0.85, 0.54, 0, 9, '#3a3a48'), YB(0.28, 0.47, 0.72, 0.53, 7, 10, '#e3484a'), YB(0.66, 0.46, 0.72, 0.54, 10, 15, '#3a3a48'), YB(0.3, 0.46, 0.4, 0.54, 10, 11, '#5b5f69'), YB(0.7, 0.44, 0.84, 0.52, 9, 12, '#c99a64')] },
  doghouse: { name: '강아지 집', price: 10000, cat: 'island', blocks: () => [YB(0.2, 0.25, 0.8, 0.75, 0, 12, '#c99a64'), YB(0.16, 0.21, 0.84, 0.79, 12, 16, '#c96a3a'), YB(0.24, 0.25, 0.76, 0.75, 16, 19, '#c96a3a'), YB(0.4, 0.73, 0.6, 0.76, 1, 9, '#3a2a26')] },
  surfRack: { name: '서핑보드 거치대', price: 13000, cat: 'island', blocks: () => [YB(0.2, 0.4, 0.8, 0.6, 0, 4, '#8a5a3a'), YB(0.24, 0.42, 0.36, 0.58, 4, 32, '#8fd0ff'), YB(0.44, 0.42, 0.56, 0.58, 4, 30, '#ff9ec4'), YB(0.64, 0.42, 0.76, 0.58, 4, 28, '#ffd23a')] },
  /* 🎄 계절 */
  snowmanBig: { name: '큰 눈사람', price: 5000, cat: 'season', blocks: () => [YB(0.24, 0.26, 0.76, 0.74, 0, 14, '#ffffff', '#e6eef4', '#d2dee8'), YB(0.32, 0.34, 0.68, 0.66, 14, 25, '#ffffff', '#e6eef4', '#d2dee8'), YB(0.3, 0.32, 0.7, 0.68, 25, 28, '#3a2a26'), YB(0.48, 0.64, 0.56, 0.72, 19, 21, '#f39a2b')] },
  xmasOut: { name: '야외 트리', price: 18000, cat: 'season', light: true, blocks: () => [YB(0.42, 0.42, 0.58, 0.58, 0, 6, '#7a5236'), YB(0.14, 0.14, 0.86, 0.86, 6, 18, '#3f7a30'), YB(0.24, 0.24, 0.76, 0.76, 18, 30, '#4f8a3a'), YB(0.36, 0.36, 0.64, 0.64, 30, 40, '#5aa850'), YB(0.45, 0.45, 0.55, 0.55, 40, 45, '#ffd23a'), YB(0.2, 0.8, 0.28, 0.86, 12, 15, '#e3484a'), YB(0.72, 0.68, 0.8, 0.74, 22, 25, '#8fd0ff')] },
  pumpkins: { name: '호박 더미', price: 4500, cat: 'season', blocks: () => [YB(0.2, 0.3, 0.5, 0.6, 0, 9, '#f39a2b'), YB(0.5, 0.4, 0.78, 0.7, 0, 8, '#e88a2a'), YB(0.36, 0.36, 0.62, 0.6, 8, 15, '#f7a83a'), YB(0.47, 0.46, 0.51, 0.5, 15, 18, '#4f9e4a')] },
  carpBanner: { name: '여름 바람 깃발', price: 5000, cat: 'season', blocks: () => [YB(0.46, 0.46, 0.54, 0.54, 0, 34, '#ffffff'), YB(0.54, 0.47, 0.9, 0.53, 26, 32, '#3f8fd0'), YB(0.54, 0.47, 0.82, 0.53, 18, 24, '#ff9ec4')] },
};
const YARD_CATS = { flower: '🌷 꽃 · 나무', rest: '🪑 쉼터', light: '💡 불빛', island: '🏝 섬 소품', season: '🎄 계절' };
const YARD_MAX = 60;
const yardFoot = (k, rot) => { const F = YARD[k], w = F.fw || 1, d = F.fd || 1; return (rot & 1) ? [d, w] : [w, d]; };
const _ySpr = new Map();
function yardSprite(k, rot = 0) {
  const key = k + ':' + rot; if (_ySpr.has(key)) return _ySpr.get(key);
  const F = YARD[k], sp = blockSprite(F.blocks(), F.fw || 1, F.fd || 1, rot);
  _ySpr.set(key, sp); return sp;
}
function yardPreview(k, scale = 2) { const sp = yardSprite(k), c = mkCanvas(sp.c.width * scale, sp.c.height * scale), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(sp.c, 0, 0, c.width, c.height); return c.toDataURL(); }
function yardState() { if (!S.yard) S.yard = { inv: {}, placed: [], seq: 1 }; return S.yard; }

/* ---------------- 섬에 놓기 · 그리기 · 충돌 ---------------- */
function yardApply() {
  const m = MAPS.island; if (!m || !S) return;
  for (const o of m.objects) if (o.kind === 'yd' && o.solid) for (const [x, y] of yFoot(o)) m.block[y * m.W + x] = 0;
  m.objects = m.objects.filter(o => o.kind !== 'yd');
  for (const p of yardState().placed) {
    const F = YARD[p.k]; if (!F) continue; const [fw, fh] = yardFoot(p.k, p.rot || 0);
    const o = { kind: 'yd', k: p.k, x: p.x, y: p.y, rot: p.rot || 0, fw, fh, solid: F.solid !== false, flat: !!F.flat, light: !!F.light, yid: p.id };
    m.objects.push(o);
    if (o.solid) for (const [x, y] of yFoot(o)) m.block[y * m.W + x] = 1;
  }
}
const yFoot = (o) => { const r = []; for (let yy = o.y; yy < o.y + (o.fh || 1); yy++) for (let xx = o.x; xx < o.x + (o.fw || 1); xx++) r.push([xx, yy]); return r; };
const _objSpriteYard = objSprite;
objSprite = function (o) { if (o.kind === 'yd') return yardSprite(o.k, o.rot || 0); return _objSpriteYard(o); };
const _buildWorldYard = buildWorld;
buildWorld = function () { _buildWorldYard(); if (S) try { yardApply(); } catch (e) { } };
/* 놓을 수 있는지: 땅 · 길 아님 · 문 앞/벤치/선착장 아님 · 놓은 뒤에도 문과 길이 이어지는지 */
function yardCanPlace(k, x, y, rot, ignoreId) {
  const m = MAPS.island, [fw, fh] = yardFoot(k, rot), F = YARD[k], tiles = [];
  for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) tiles.push([xx, yy]);
  const ign = ignoreId ? m.objects.find(o => o.yid === ignoreId) : null, ignT = ign ? yFoot(ign) : [];
  for (const [a, b] of tiles) {
    if (!inMap(a, b, m)) return '섬 밖이에요';
    const t = tileAt(a, b, m);
    if (t === T.WATER || t === T.POND) return '물 위에는 놓을 수 없어요';
    if ([T.PATH, T.ALLEY, T.BOARD, T.WOOD].includes(t)) return '길 위에는 놓을 수 없어요';
    if (m.block[b * m.W + a] && !ignT.some(([p, q]) => p === a && q === b)) return '다른 물건이 있어요';
    if (m.buildings.some(B0 => B0.doorTile && Math.abs(B0.doorTile[0] - a) <= 1 && Math.abs(B0.doorTile[1] - b) <= 1)) return '문 앞은 비워 둬야 해요';
    if (Object.values(m.benches).some(bk => bk.stand.some(s => s[0] === a && s[1] === b) || bk.seats.some(s => s[0] === a && s[1] === b))) return '의자 자리예요';
    if (m.boatSpot && Math.hypot(m.boatSpot[0] - a - 0.5, m.boatSpot[1] - b - 0.5) < 2) return '보트 타는 곳이에요';
    if ((m.portals || []).some(p => Math.abs(p.x - a) <= 1 && Math.abs(p.y - b) <= 1)) return '숨은 길 입구예요';
    if (Math.floor(G.player.x) === a && Math.floor(G.player.y) === b) return '내가 서 있는 자리예요';
  }
  if (F.solid === false) return null;
  // 놓았다고 치고 문 · 주요 지점이 이어지는지 확인
  const saved = tiles.map(([a, b]) => m.block[b * m.W + a]); const freed = ignT.map(([a, b]) => m.block[b * m.W + a]);
  ignT.forEach(([a, b]) => m.block[b * m.W + a] = 0); tiles.forEach(([a, b]) => m.block[b * m.W + a] = 1);
  let ok = true;
  try {
    const st = P_('plaza'), seen = new Uint8Array(m.W * m.H), q = [[Math.floor(st[0]), Math.floor(st[1])]]; seen[q[0][1] * m.W + q[0][0]] = 1;
    while (q.length) { const [x0, y0] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x0 + dx, Y = y0 + dy; if (!inMap(X, Y, m) || seen[Y * m.W + X] || !walkable(X, Y, m)) continue; seen[Y * m.W + X] = 1; q.push([X, Y]); } }
    const near = (x0, y0) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inMap(x0 + dx, y0 + dy, m) && seen[(y0 + dy) * m.W + x0 + dx]);
    for (const B0 of m.buildings) if (B0.doorTile && !near(B0.doorTile[0], B0.doorTile[1])) { ok = false; break; }
    if (ok) for (const bk of Object.values(m.benches)) if (bk.stand.some(s => !near(s[0], s[1]))) { ok = false; break; }
    if (ok && !near(Math.floor(G.player.x), Math.floor(G.player.y))) ok = false;
  } finally { tiles.forEach(([a, b], i) => m.block[b * m.W + a] = saved[i]); ignT.forEach(([a, b], i) => m.block[b * m.W + a] = freed[i]); }
  return ok ? null : '여기 놓으면 길이 막혀요';
}

/* ---------------- 섬 꾸미기 모드 ---------------- */
G.yard = null;
function yardStart() {
  if (G.player.map !== 'island') { toast('섬 밖(야외)에서 꾸밀 수 있어요'); return; }
  if (G.busy || G.decor || G.dev) return;
  const P = G.player; if (P.seat) standUpPlayer(); P.stop();
  G.yard = { placing: null, sel: null };
  document.body.classList.add('yardOn');
  let bar = $('#yardBar'); if (!bar) { bar = document.createElement('div'); bar.id = 'yardBar'; $('#game').appendChild(bar); }
  bar.classList.remove('hidden'); yardBar();
  toast('🌳 섬 꾸미기 — 땅을 누르면 놓고, 놓은 걸 누르면 골라요. 왼쪽 아래를 끌면 이동해요');
}
function yardEnd() { G.yard = null; document.body.classList.remove('yardOn'); const bar = $('#yardBar'); if (bar) bar.classList.add('hidden'); save(); }
function yardBar() {
  const Y = G.yard, bar = $('#yardBar'); if (!Y || !bar) return;
  const st = yardState(), sel = Y.sel && st.placed.find(p => p.id === Y.sel);
  const info = Y.placing ? `「${YARD[Y.placing].name}」 놓을 곳을 누르세요 (남은 ${st.inv[Y.placing] || 0}개)` : sel ? `선택: ${YARD[sel.k].name}` : `놓은 장식 ${st.placed.length}/${YARD_MAX} · 보관함에서 골라 놓아요`;
  bar.innerHTML = `<div id="yardInfo">${info}</div><div class="dbtns"><button data-a="bag">📦 보관함</button><button data-a="rot" ${sel || Y.placing ? '' : 'disabled'}>↻ 돌리기</button><button data-a="put" ${sel ? '' : 'disabled'}>⬇ 넣기</button><button data-a="shop">🛒 가게</button><button data-a="done" class="ok">완료</button></div>`;
  bar.querySelectorAll('button').forEach(b => b.onclick = () => { Sound.sfx('tap'); yardBtn(b.dataset.a); });
}
function yardBtn(a) {
  const Y = G.yard, st = yardState();
  if (a === 'done') return yardEnd();
  if (a === 'shop') return yardShop();
  if (a === 'bag') {
    const items = Object.entries(st.inv).filter(([k, n]) => n > 0 && YARD[k]).map(([k, n]) => ({ icon: `<img class="si-img" src="${yardPreview(k, 1)}">`, label: YARD[k].name, note: `${n}개`, onClick: () => { Y.placing = k; Y.rot = 0; Y.sel = null; yardBar(); } }));
    openSheet({ title: '📦 섬 장식 보관함', items: items.length ? items : [{ icon: '🛒', label: '비어 있어요 — 가게에서 사요', wide: true, onClick: yardShop }], cols: 3 }); return;
  }
  if (a === 'rot') {
    if (Y.placing) { Y.rot = ((Y.rot || 0) + 1) & 3; toast('↻ 놓을 때 방향을 돌렸어요'); return; }
    const p = st.placed.find(q => q.id === Y.sel); if (!p) return; const r = ((p.rot || 0) + 1) & 3;
    const why = yardCanPlace(p.k, p.x, p.y, r, p.id); if (why) { toast(why); return; }
    p.rot = r; yardApply(); yardBar(); save(); return;
  }
  if (a === 'put') { const i = st.placed.findIndex(q => q.id === Y.sel); if (i < 0) return; const p = st.placed[i]; st.placed.splice(i, 1); st.inv[p.k] = (st.inv[p.k] || 0) + 1; Y.sel = null; yardApply(); yardBar(); save(); toast(`⬇ ${josa(YARD[p.k].name, '을', '를')} 보관함에 넣었어요`); }
}
function yardTap(x, y) {
  const Y = G.yard, st = yardState(), m = MAPS.island;
  const hit = m.objects.find(o => o.kind === 'yd' && yFoot(o).some(([a, b]) => a === x && b === y));
  if (hit && !Y.placing) { Y.sel = hit.yid; yardBar(); return; }
  if (!Y.placing) { Y.sel = null; yardBar(); return; }
  const k = Y.placing; if (!(st.inv[k] > 0)) { Y.placing = null; yardBar(); return; }
  if (st.placed.length >= YARD_MAX) { toast(`섬 장식은 ${YARD_MAX}개까지 놓을 수 있어요`); return; }
  const why = yardCanPlace(k, x, y, Y.rot || 0); if (why) { toast(why); return; }
  st.inv[k]--; st.placed.push({ id: 'y' + st.seq++, k, x, y, rot: Y.rot || 0 }); yardApply(); Sound.sfx('tap'); save();
  if (!(st.inv[k] > 0)) Y.placing = null;
  yardBar();
  if (!S.paid.yardFirst) { S.paid.yardFirst = S.day; memRecent('decor', '섬을 꾸몄다'); addRumor && addRumor('decor', {}, { key: 'yard1' }); }
}
const _onTapYard = onTap;
onTap = function (px, py) { if (G.yard && !paused()) { const w = screenToWorld(px, py); yardTap(Math.floor(w.tx), Math.floor(w.ty)); return; } return _onTapYard(px, py); };
const _computeActionYard = computeAction;
computeAction = function () { if (G.yard) return null; return _computeActionYard(); };
/* 선택한 칸 · 놓을 자리 표시 */
const _renderYard = render;
render = function (dt) {
  _renderYard(dt);
  const Y = G.yard; if (!Y || M.id !== 'island') return;
  const g = R.v, dia = (x, y, col) => { const [sx, sy] = iso(x, y); for (let r = 0; r < 8; r++) { prect(g, sx - 2 - r * 2, sy + r, 4 + r * 4, 1, col); prect(g, sx - 2 - r * 2, sy + 15 - r, 4 + r * 4, 1, col); } };
  const sel = Y.sel && MAPS.island.objects.find(o => o.yid === Y.sel); if (sel) for (const [x, y] of yFoot(sel)) dia(x, y, 'rgba(120,220,140,0.5)');
};

/* ---------------- 가게 ---------------- */
function yardShop(cat = 'flower') {
  const st = yardState();
  const tabs = `<div class="ptabs">${Object.entries(YARD_CATS).map(([k, v]) => `<button data-c="${k}" class="${k === cat ? 'on' : ''}">${v}</button>`).join('')}</div>`;
  const keys = Object.keys(YARD).filter(k => YARD[k].cat === cat);
  openPanel('🌳 섬 꾸미기 가게', tabs + `<p class="psub">보유 <b>${fmtMoney(S.money)}</b> · 산 장식은 메뉴 → 🎨 꾸미기에서 섬 곳곳(실내 장식은 내 일터 안)에 놓아요</p><div class="pgrid">${keys.map(k => `<button class="pcard" data-k="${k}"><img src="${yardPreview(k, 2)}"><b>${YARD[k].name}</b><small>${fmtMoney(YARD[k].price)}${st.inv[k] ? ` · 보관 ${st.inv[k]}` : ''}${YARD[k].light ? ' · 밤에 빛남' : ''}</small></button>`).join('')}</div>`, (body) => {
    body.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => yardShop(b.dataset.c));
    body.querySelectorAll('.pcard').forEach(b => b.onclick = () => { const k = b.dataset.k, F = YARD[k], [fw, fh] = yardFoot(k, 0); confirmBuy(F.name, F.price, yardPreview(k, 4), `${fw}×${fh}칸 · 섬(야외) 장식${F.light ? ' · 밤에 불이 켜져요' : ''}${F.solid === false ? ' · 밟고 지나갈 수 있어요' : ''}`, () => { st.inv[k] = (st.inv[k] || 0) + 1; }, () => yardShop(cat)); });
  });
}
/* 가구점 카탈로그에 「섬 꾸미기」 탭 버튼 */
const _furnShopMenuYard = furnShopMenu;
furnShopMenu = function (cat) {
  _furnShopMenuYard(cat);
  const tabs = $('#panelBody .ptabs'); if (!tabs) return;
  const b = document.createElement('button'); b.textContent = '🌳 섬 꾸미기'; b.onclick = () => yardShop(); tabs.appendChild(b);
};
/* 메뉴 → 집 에 「섬 꾸미기」 */
const _mainMenuYard = mainMenu;
mainMenu = function () {
  _mainMenuYard();
  const home = [...document.querySelectorAll('#sheetBody .sitem')].find(b => /^집/.test((b.querySelector('.si-label') || {}).textContent || ''));
  if (!home) return; const f = home.onclick;
  home.onclick = () => { f && f(); const body = $('#sheetBody'); if (!body) return; const nb = document.createElement('button'); nb.className = 'sitem'; nb.innerHTML = '<span class="si-icon">🌳</span><span class="si-label">섬 꾸미기</span><span class="si-note">야외 장식</span>'; nb.onclick = () => { Sound.sfx('tap'); closeSheet(); yardStart(); }; body.insertBefore(nb, body.children[2] || null); };
};
const _ensureV4Yard = ensureV4;
ensureV4 = function (s) { _ensureV4Yard(s); if (!s.yard) s.yard = { inv: {}, placed: [], seq: 1 }; return s; };
const _startGameYard = startGame;
startGame = function (state, isNew) { G.yard = null; document.body.classList.remove('yardOn'); _startGameYard(state, isNew); try { yardApply(); } catch (e) { } };
