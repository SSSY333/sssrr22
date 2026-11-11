'use strict';
/* =========================================================
 *  해월도 지도 v3 — 큰 섬(128×128) · 무인도 · 건물 내부, 장소, 길찾기
 * ========================================================= */
const T = { WATER: 0, SAND: 1, GRASS: 2, PATH: 3, WOOD: 4, FLOWER: 5, HILL: 6, ROCK: 7, POND: 8, FLOOR: 9, TILEF: 10, MAT: 11, ALLEY: 12, BOARD: 13 };
const isRoadT = (t) => t === T.PATH || t === T.ALLEY || t === T.BOARD || t === T.WOOD;
const TILE_NAMES = ['water', 'sand', 'grass', 'path', 'wood', 'flower', 'hill', 'rock', 'pond', 'floor', 'tilefloor', 'mat', 'alley', 'board'];

const MAPS = {};
let M = null;
const POI = {};                     // 이름 붙은 좌표 (타일 중심)
const P_ = (k) => POI[k] || [64.5, 62.5];
function makeMap(id, W, H, o = {}) {
  const m = Object.assign({ id, W, H, tiles: new Uint8Array(W * H), block: new Uint8Array(W * H), buildings: [], objects: [], benches: {}, places: {}, order: [], interior: false, ground: null, groundKey: '' }, o);
  MAPS[id] = m; return m;
}
const inMap = (x, y, m = M) => x >= 0 && y >= 0 && x < m.W && y < m.H;
function tileAt(x, y, m = M) { return inMap(x, y, m) ? m.tiles[y * m.W + x] : T.WATER; }
function walkable(x, y, m = M) {
  if (!inMap(x, y, m)) return false;
  const t = m.tiles[y * m.W + x];
  return t !== T.WATER && t !== T.POND && !m.block[y * m.W + x];
}
const isWaterT = (t) => t === T.WATER;

/* 마을 중심부 — 넉넉한 간격의 거리 격자 (가로 y=52·62·72, 세로 x=46·56·62·70·78) */
const BUILDINGS = [
  { id: 'school', name: '해월초등학교', x: 49, y: 48, w: 4, h: 4, wallH: 26, roofH: 14, wall: '#f4e6b8', base: '#d9c48d', roof: '#b8503f', sign: 'school', signX: 2.6, windows: [['L', 0.08, 0.13], ['L', 0.62, 0.13], ['L', 0.8, 0.13], ['R', 0.12, 0.14], ['R', 0.42, 0.14], ['R', 0.72, 0.14]] },
  { id: 'clinic', name: '보건지소', x: 65, y: 49, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f8f8f4', base: '#cfd8dc', roof: '#5aa0a6', sign: 'cross', windows: [['L', 0.08, 0.16], ['L', 0.72, 0.18], ['R', 0.18, 0.2], ['R', 0.6, 0.2]] },
  { id: 'hall', name: '마을회관', x: 72, y: 48, w: 4, h: 4, wallH: 24, roofH: 14, wall: '#f1e7d0', base: '#c9b98e', roof: '#3f7f6a', sign: 'hall', signX: 1.6, windows: [['L', 0.62, 0.14], ['L', 0.82, 0.12], ['R', 0.12, 0.16], ['R', 0.45, 0.16], ['R', 0.75, 0.16]] },
  { id: 'sataek', name: '경찰 사택', x: 43, y: 50, w: 2, h: 2, wallH: 18, roofH: 12, wall: '#e4ddd0', base: '#b9ae9a', roof: '#2e3d66', doorT: 0.55, windows: [['L', 0.1, 0.22], ['R', 0.35, 0.28]] },
  { id: 'cafe', name: '카페 쉼터', x: 50, y: 59, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f7e3c4', base: '#d8b98e', roof: '#c96b4a', sign: 'cup', awning: '#e3615a', windows: [['L', 0.07, 0.18], ['L', 0.7, 0.2], ['R', 0.15, 0.25], ['R', 0.58, 0.25]] },
  { id: 'clothes', name: '해월 옷가게', x: 57, y: 60, w: 3, h: 2, wallH: 20, roofH: 10, wall: '#fbeef2', base: '#e7bcc8', roof: '#d9688a', sign: 'dress', awning: '#f19ab5', windows: [['L', 0.62, 0.22], ['R', 0.3, 0.4]] },
  { id: 'police', name: '파출소', x: 64, y: 59, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f3f1ea', base: '#2e3d66', roof: '#3f63a8', sign: 'police', door: '#2e3d66', windows: [['L', 0.07, 0.18], ['L', 0.7, 0.2], ['R', 0.15, 0.22], ['R', 0.58, 0.22]],
    extra(g, S, E) { const p = E(65.5, 60.5); g.fillStyle = '#e3484a'; g.fillRect(p[0] - 3, p[1] - 15, 3, 3); g.fillStyle = '#3f8ae0'; g.fillRect(p[0], p[1] - 15, 3, 3); g.fillStyle = '#2b2026'; g.fillRect(p[0] - 3, p[1] - 12, 6, 1); } },
  { id: 'super', name: '마을 슈퍼', x: 72, y: 60, w: 2, h: 2, wallH: 18, roofH: 10, wall: '#e9f0e2', base: '#b9c9a8', roof: '#4f9a6a', sign: 'basket', awning: '#4f9a6a', doorT: 0.55, windows: [['L', 0.08, 0.24], ['R', 0.3, 0.36]] },
  { id: 'salon', name: '미용실 해바라기', x: 75, y: 60, w: 2, h: 2, wallH: 18, roofH: 10, wall: '#f4f0ff', base: '#c9bfe6', roof: '#8a6fc9', sign: 'scissors', awning: '#b9a6e8', doorT: 0.55, windows: [['L', 0.08, 0.24], ['R', 0.3, 0.36]] },
  { id: 'home', name: '내 집', x: 66, y: 70, w: 2, h: 2, wallH: 18, roofH: 12, wall: '#f3dad2', base: '#d7b2a6', roof: '#e08a6e', sign: 'heart', doorT: 0.55, windows: [['L', 0.08, 0.22], ['R', 0.35, 0.3]] },
  { id: 'houseA', name: '이웃집', x: 58, y: 70, w: 2, h: 2, wallH: 17, roofH: 11, wall: '#eef0e4', base: '#c8cbb4', roof: '#6f9a5a', doorT: 0.55, windows: [['L', 0.08, 0.22], ['R', 0.35, 0.3]] },
  { id: 'houseB', name: '이웃집', x: 73, y: 70, w: 2, h: 2, wallH: 17, roofH: 11, wall: '#f3ead6', base: '#d6c6a0', roof: '#c9884a', doorT: 0.55, windows: [['L', 0.08, 0.22], ['R', 0.35, 0.3]] },
  { id: 'furniture', name: '해월 가구점', x: 42, y: 69, w: 3, h: 3, wallH: 20, roofH: 12, wall: '#f3e7d6', base: '#c9a87e', roof: '#8a5a3a', sign: 'chair', awning: '#c99a64', windows: [['L', 0.62, 0.2], ['R', 0.15, 0.25], ['R', 0.58, 0.25]] },
  { id: 'houseC', name: '이웃집', x: 79, y: 59, w: 2, h: 3, wallH: 17, roofH: 11, wall: '#e8eef5', base: '#b9c6d6', roof: '#5a7aa8', doorT: 0.55, windows: [['L', 0.08, 0.22], ['R', 0.35, 0.3]] },
];
const ENTERABLE = ['school', 'clinic', 'hall', 'sataek', 'cafe', 'police', 'super', 'sashimi', 'home', 'storage', 'clothes', 'salon', 'furniture'];

const PLACE_DEFS = {
  fishing: { name: '부두 낚시터' }, pier: { name: '동쪽 포구' }, rocks: { name: '갯바위 낚시터' }, cafe: { name: '카페 쉼터' }, police: { name: '파출소' },
  plaza: { name: '마을 광장' }, furniture: { name: '해월 가구점' }, booth: { name: '네컷사진 부스' }, dock: { name: '여객선 선착장' }, promenade: { name: '해안 산책로' }, clothes: { name: '해월 옷가게' }, salon: { name: '미용실 해바라기' }, super: { name: '마을 슈퍼' }, sashimi: { name: '해월 횟집' }, school: { name: '해월초등학교' }, clinic: { name: '보건지소' },
  hall: { name: '마을회관' }, sataek: { name: '경찰 사택' }, observatory: { name: '언덕 전망대' }, hill: { name: '해월 언덕' }, home: { name: '내 집' },
  storage: { name: '해녀창고' }, lighthouse: { name: '등대' }, pavilion: { name: '동백숲 정자' }, forest: { name: '동백숲' }, orchard: { name: '마을 귤밭' },
  farm: { name: '귤 농장 마을' }, ranch: { name: '조랑말 목장' }, windmill: { name: '풍차 언덕' }, field: { name: '꽃밭 들판' }, beach: { name: '해수욕장' }, coast: { name: '해안 산책로' },
};
const ISLET_PLACES = {
  isletDock: { name: '무인도 선착장', test: (x) => x <= 6 },
  isletHill: { name: '무인도 언덕', c: [11.5, 8.5], r: 2.5 },
  isletBeach: { name: '무인도 모래사장', test: () => true },
};

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function obj(m, kind, x, y, extra = {}) {
  if (!inMap(x, y, m)) return null;
  if (m.tiles[y * m.W + x] === T.WATER && !extra.water) m.tiles[y * m.W + x] = T.SAND;
  const o = Object.assign({ kind, x, y, solid: !extra.season }, extra);
  m.objects.push(o);
  if (o.solid) m.block[y * m.W + x] = 1;
  return o;
}
function nearRoad(m, x, y, d) {
  for (let yy = y - d; yy <= y + d; yy++) for (let xx = x - d; xx <= x + d; xx++) {
    const t = tileAt(xx, yy, m);
    if (t === T.PATH || t === T.WOOD || t === T.ROCK || (inMap(xx, yy, m) && m.block[yy * m.W + xx])) return true;
  }
  return false;
}
function plantTrees(m, r, count, region, avoid, density) {
  let tries = 0, planted = 0;
  while (planted < count && tries++ < count * 40) {
    const x = region ? region[0] + Math.floor(r() * (region[2] - region[0] + 1)) : Math.floor(r() * m.W);
    const y = region ? region[1] + Math.floor(r() * (region[3] - region[1] + 1)) : Math.floor(r() * m.H);
    const t = tileAt(x, y, m);
    if (t !== T.GRASS && t !== T.SAND && t !== T.HILL && t !== T.FLOWER) continue;
    if (nearRoad(m, x, y, density ? 0 : 1)) continue;
    if (m.objects.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < (density ? 1 : 3))) continue;
    if (avoid && avoid(x, y)) continue;
    if (t === T.SAND) { if (r() < 0.5) continue; obj(m, 'palm', x, y); }
    else obj(m, 'tree', x, y, { v: planted % 4 });
    planted++;
  }
}

function buildIsland() {
  const W = 128, m = makeMap('island', W, W, { name: '해월도' });
  const set = (x, y, t) => { if (inMap(x, y, m)) m.tiles[y * W + x] = t; };
  const land = (x, y) => { if (tileAt(x, y, m) === T.WATER) set(x, y, T.SAND); };
  const hline = (y, x0, x1, t = T.PATH) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, t); };
  const vline = (x, y0, y1, t = T.PATH) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) set(x, y, t); };
  const rect = (x0, y0, x1, y1, t, onlyLand) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!onlyLand || tileAt(x, y, m) !== T.WATER) set(x, y, t); };
  // 섬 모양
  const R = (a) => 54 + 5 * Math.sin(3 * a) + 3 * Math.sin(5 * a + 1) + 2 * Math.sin(9 * a);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - 64, dy = y + 0.5 - 64, d = Math.hypot(dx, dy), r = R(Math.atan2(dy, dx));
    if (d <= r) set(x, y, d > r - 2.6 ? T.SAND : T.GRASS);
  }
  const rowEdge = (y, dir) => { let x = 64; while (inMap(x + dir, y, m) && tileAt(x + dir, y, m) !== T.WATER) x += dir; return x; };
  const colEdge = (x, dir) => { let y = 64; while (inMap(x, y + dir, m) && tileAt(x, y + dir, m) !== T.WATER) y += dir; return y; };
  const EX = rowEdge(62, 1), WX = rowEdge(62, -1), SY = colEdge(62, 1);
  // 지형
  for (let y = 10; y <= 30; y++) for (let x = 50; x <= 74; x++) if (Math.hypot(x - 62.5, (y - 20.5) * 1.1) < 9 && tileAt(x, y, m) !== T.WATER) set(x, y, T.HILL);
  rect(40, 42, 50, 50, T.FLOWER, true);
  rect(WX - 1, 58, WX + 3, 66, T.ROCK);
  const CE = {}; for (let x = 36; x <= 94; x++) CE[x] = colEdge(x, 1);
  for (let x = 38; x <= 92; x++) for (let y = CE[x] - 7; y <= CE[x]; y++) if (tileAt(x, y, m) === T.GRASS) set(x, y, T.SAND);
  // 등대 곶
  let lx = 64, ly = 64; while (tileAt(Math.round(lx + 0.7), Math.round(ly + 0.75), m) !== T.WATER) { lx += 0.7; ly += 0.75; }
  lx = Math.round(lx - 3.5); ly = Math.round(ly - 3.8);
  for (let y = ly - 2; y <= ly + 5; y++) for (let x = lx - 3; x <= lx + 5; x++) land(x, y);
  for (let y = 72; y <= 86; y++) for (let x = lx - 9; x <= lx + 6; x++) if (Math.hypot(x - lx + 1.5, y - 79) < 6.5 && tileAt(x, y, m) === T.GRASS) set(x, y, T.HILL);

  // 길
  hline(62, WX + 4, EX); vline(62, 17, SY - 8);
  hline(52, 41, 81); hline(72, 41, 81); for (const x of [46, 56, 70, 78]) vline(x, 52, 72, T.ALLEY); vline(41, 52, 72, T.ALLEY); vline(81, 52, 72, T.ALLEY);
  // 큰길은 두 칸 폭 (마을 중심), 골목은 한 칸
  hline(63, 41, EX - 1); hline(53, 41, 81); hline(73, 41, 81); vline(63, 17, SY - 8);
  hline(56, 57, 59, T.ALLEY);                       // 막다른 골목
  vline(46, 38, 52); vline(78, 38, 52); hline(38, 84, 96); vline(96, 38, 62); vline(24, 38, 62);
  vline(52, 70, 72, T.ALLEY); vline(43, 72, 73);
  hline(38, 24, 84); vline(28, 36, 38); vline(84, 36, 38); vline(41, 35, 38);
  vline(34, 62, 96); hline(96, 34, 44);
  { let py = CE[44] - 8; for (let x = 44; x <= 88; x++) { const ny = CE[x] - 8; vline(x, py, ny, T.BOARD); py = ny; } vline(62, SY - 8, CE[62] - 8); vline(46, 72, CE[46] - 8); vline(78, 72, CE[78] - 8); vline(44, 96, CE[44] - 8);
    const pe = CE[88] - 8; hline(pe, 88, lx - 1); vline(lx - 1, ly + 2, pe); }
  vline(lx - 1, 63, ly + 2); hline(ly + 2, lx - 1, lx + 1);
  // 포구 (나무 데크)
  hline(62, EX + 1, EX + 6, T.WOOD); hline(63, EX, EX + 2, T.WOOD); for (let y = 61; y <= 63; y++) hline(y, EX + 3, EX + 6, T.WOOD);
  for (let y = 64; y <= 65; y++) hline(y, EX + 5, EX + 7, T.WOOD);   // 여객선 선착장
  // 연못
  for (let y = 88; y <= 91; y++) for (let x = 38; x <= 41; x++) if (Math.hypot(x - 39.5, y - 89.5) < 2.3) set(x, y, T.POND);
  // 꽃 (마을 · 숲 · 들판)
  for (const [x, y] of [[48, 54], [49, 54], [54, 54], [60, 54], [68, 54], [76, 54], [48, 64], [60, 66], [64, 66], [74, 64], [76, 66], [44, 60], [58, 74], [64, 74], [72, 74], [80, 66]]) if (tileAt(x, y, m) === T.GRASS) set(x, y, T.FLOWER);
  const rf = rng(99);
  for (let i = 0; i < 70; i++) { const x = 20 + Math.floor(rf() * 28), y = 70 + Math.floor(rf() * 28); if (tileAt(x, y, m) === T.GRASS) set(x, y, T.FLOWER); }
  for (let i = 0; i < 40; i++) { const x = 70 + Math.floor(rf() * 30), y = 40 + Math.floor(rf() * 18); if (tileAt(x, y, m) === T.GRASS) set(x, y, T.FLOWER); }

  // 포구 건물 · 등대 · 농장 · 목장
  const harborB = [
    { id: 'sashimi', name: '해월 횟집', x: EX - 14, y: 59, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#eef4f7', base: '#9fbccc', roof: '#2f6fa8', sign: 'fish', awning: '#2f6fa8', windows: [['L', 0.07, 0.18], ['L', 0.72, 0.18], ['R', 0.15, 0.25], ['R', 0.58, 0.25]] },
    { id: 'storage', name: '해녀창고', x: EX - 8, y: 60, w: 3, h: 2, wallH: 18, roofH: 8, wall: '#8aa0b0', base: '#5f7584', roof: '#5f7a8c', sign: 'wave', door: '#3b4a56', windows: [['R', 0.35, 0.3]] },
    { id: 'lighthouse', name: '등대', kind: 'lighthouse', x: lx, y: ly, w: 2, h: 2 },
    { id: 'farmhouse', name: '귤 농가', x: 40, y: 32, w: 3, h: 3, wallH: 18, roofH: 12, wall: '#efe2c6', base: '#c9b98e', roof: '#e3893a', doorT: 0.5, windows: [['L', 0.1, 0.2], ['R', 0.3, 0.3]] },
    { id: 'stable', name: '목장 마구간', x: 78, y: 27, w: 4, h: 3, wallH: 18, roofH: 12, wall: '#c99a64', base: '#8a5a3a', roof: '#8a3f2f', doorT: 0.4, windows: [['R', 0.2, 0.2], ['R', 0.6, 0.2]] },
  ];
  for (const b of [...BUILDINGS, ...harborB]) {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { if (tileAt(x, y, m) === T.WATER) set(x, y, T.SAND); m.block[y * W + x] = 1; }
    b.doorTile = b.doorTile || [b.x + 1, b.y + b.h];
    m.buildings.push(b);
  }
  const B = (id) => m.buildings.find(b => b.id === id);
  B('sataek').doorTile = [44, 52]; B('super').doorTile = [73, 62]; B('salon').doorTile = [76, 62]; B('home').doorTile = [67, 72]; B('houseA').doorTile = [59, 72]; B('houseB').doorTile = [74, 72]; B('lighthouse').doorTile = [lx + 1, ly + 2];
  B('farmhouse').doorTile = [41, 35]; B('furniture').doorTile = [43, 72];
  // 길 모서리 다듬기: 두 방향이 길로 막힌 안쪽 모서리를 둥글게 채움 (큰길만)
  { const isMain = (x, y) => { const t = tileAt(x, y, m); return t === T.PATH; };
    const add = [];
    for (let y = 40; y <= 100; y++) for (let x = 20; x <= 100; x++) {
      const t = tileAt(x, y, m); if (t !== T.GRASS && t !== T.FLOWER) continue; if (m.block[y * W + x]) continue;
      const L = isMain(x - 1, y), Rr = isMain(x + 1, y), U = isMain(x, y - 1), D = isMain(x, y + 1);
      if ((L && U && isMain(x - 1, y - 1)) || (Rr && D && isMain(x + 1, y + 1)) || (L && D && isMain(x - 1, y + 1)) || (Rr && U && isMain(x + 1, y - 1))) add.push([x, y]);
    }
    for (const [x, y] of add) set(x, y, T.PATH); }

  // 벤치
  m.benches = {
    cafe: { name: '카페 테라스 벤치', place: 'cafe', seats: [[53, 63], [54, 63]], stand: [[53, 62], [54, 62]] },
    pier: { name: '포구 벤치', place: 'pier', seats: [[EX + 4, 61], [EX + 5, 61]], stand: [[EX + 4, 62], [EX + 5, 62]] },
    lighthouse: { name: '등대 벤치', place: 'lighthouse', seats: [[lx + 2, ly + 3], [lx + 3, ly + 3]], stand: [[lx + 2, ly + 4], [lx + 3, ly + 4]] },
    observatory: { name: '언덕 전망대 벤치', place: 'observatory', seats: [[63, 14], [64, 14]], stand: [[63, 15], [64, 15]] },
    pavilion: { name: '동백숲 정자', place: 'pavilion', seats: [[35, 84], [36, 84]], stand: [[35, 85], [36, 85]] },
    beach: { name: '해변 벤치', place: 'beach', seats: [[59, CE[59] - 5], [60, CE[59] - 5]], stand: [[59, CE[59] - 4], [60, CE[59] - 4]] },
    plaza: { name: '광장 벤치', place: 'plaza', seats: [[60, 64], [61, 64]], stand: [[60, 65], [61, 65]] },
    farm: { name: '농장 평상', place: 'farm', seats: [[44, 36], [45, 36]], stand: [[44, 37], [45, 37]] },
  };
  for (const bk of Object.values(m.benches)) for (const p of [...bk.seats, ...bk.stand]) land(p[0], p[1]);
  for (const [k, bk] of Object.entries(m.benches)) for (const s of bk.seats) obj(m, 'bench', s[0], s[1], { bench: k });

  // 마을 소품
  for (let x = 48; x <= 54; x++) for (let y = 64; y <= 69; y++) { const border = x === 48 || x === 54 || y === 64 || y === 69; if (border && !(x === 52 && y === 69)) obj(m, 'wall', x, y); }
  for (const [x, y] of [[50, 65], [52, 65], [50, 67], [53, 67]]) obj(m, 'orange', x, y);
  obj(m, 'hare', 61, 61); obj(m, 'hare', 63, 63); obj(m, 'board', 67, 63); obj(m, 'crates', 74, 63); obj(m, 'parasol', 55, 63);
  for (const [x, y] of [[60, 63], [55, 61], [69, 63], [63, 53], [55, 53], [71, 53], [61, 71], [69, 71], [45, 61], [79, 63], [90, 63], [102, 63], [EX - 2, 63], [62, 40], [62, 28], [62, 80], [62, 96], [34, 70], [34, 90], [40, 61], [26, 61], [45, 44], [77, 44], [45, 80], [77, 80]]) obj(m, 'lamp', x, y, { light: true });
  for (const [x, y] of [[49, 61], [60, 61], [71, 64], [65, 69], [42, 55], [57, 69]]) obj(m, 'pot', x, y);
  obj(m, 'snowman', 60, 60, { season: 'winter' }); obj(m, 'snowman', 68, 65, { season: 'winter' }); obj(m, 'snowman', 60, CE[60] - 9, { season: 'winter' });
  // 포구
  obj(m, 'tankOut', EX - 10, 61); obj(m, 'crates', EX - 4, 60);
  obj(m, 'boat', EX + 4, 65, { solid: false, water: true, ride: true }); obj(m, 'boat', EX + 1, 58, { solid: false, water: true }); obj(m, 'boat', EX - 1, 67, { solid: false, water: true });
  // 갯바위 · 오름 · 숲 · 해변
  for (const [x, y] of [[WX - 3, 59], [WX - 2, 65], [WX - 4, 62]]) obj(m, 'rocks', x, y, { water: tileAt(x, y, m) === T.WATER });
  obj(m, 'telescope', 61, 14); obj(m, 'pavilion', 37, 83);
  for (const x of [50, 55, 66, 70, 76, 82]) obj(m, 'parasol', x, CE[x] - 3, { season: 'summer' });
  // 풍차
  for (const [x, y] of [[lx - 6, 78], [lx + 2, 76], [lx - 2, 82]]) obj(m, 'windmill', x, y);
  // 귤 농장 (돌담 + 귤나무)
  for (let x = 20; x <= 36; x++) for (let y = 26; y <= 36; y++) { const border = x === 20 || x === 36 || y === 26 || y === 36; if (border && !(x === 28 && y === 36)) obj(m, 'wall', x, y); }
  for (let x = 22; x <= 34; x += 3) for (let y = 28; y <= 34; y += 3) obj(m, 'orange', x, y);
  // 목장 (울타리)
  for (let x = 74; x <= 92; x++) for (let y = 24; y <= 36; y++) { const border = x === 74 || x === 92 || y === 24 || y === 36; if (border && !(x === 84 && y === 36)) obj(m, 'fence', x, y); }
  obj(m, 'hay', 86, 27); obj(m, 'hay', 88, 30); obj(m, 'hay', 77, 33);
  // v6: 네컷사진 부스 · 횡단보도 · 매표소 · 장식 (길을 막지 않게)
  obj(m, 'booth', 54, 60); obj(m, 'crosswalk', 53, 52, { solid: false, flat: true }); obj(m, 'crosswalk', 53, 53, { solid: false, flat: true });
  obj(m, 'ticket', EX - 1, 61); obj(m, 'signpost', 52, 54);
  obj(m, 'furnDisplay', 45, 71);
  const decorOk = (x, y) => { const t = tileAt(x, y, m); if (t !== T.GRASS && t !== T.FLOWER) return false; if (m.block[y * W + x]) return false;
    for (const b of m.buildings) if (Math.abs(b.doorTile[0] - x) <= 1 && Math.abs(b.doorTile[1] - y) <= 1) return false;
    return !m.objects.some(o => o.x === x && o.y === y); };
  const deco = (kind, pts, extra) => { for (const [x, y] of pts) if (decorOk(x, y)) obj(m, kind, x, y, Object.assign({}, extra)); };
  deco('flowerbed', [[48, 58], [53, 58], [61, 58], [68, 58], [71, 58], [76, 58], [47, 69], [61, 69], [69, 69], [76, 69], [64, 48], [70, 48]]);
  deco('bush', [[42, 58], [48, 56], [60, 56], [67, 56], [74, 56], [80, 56], [42, 66], [58, 66], [64, 67], [74, 66], [80, 68], [55, 48], [69, 50], [77, 50], [57, 75], [65, 76], [73, 76]]);
  deco('lowfence', [[64, 69], [65, 68], [68, 69], [69, 68], [57, 68], [60, 68], [72, 68], [75, 68]]);
  deco('stone', [[44, 57], [59, 57], [66, 57], [77, 57], [44, 67], [60, 67], [72, 67], [79, 70], [52, 75], [70, 75]], { solid: false });
  deco('pot', [[56, 58], [63, 58], [66, 66], [44, 63]]);
  deco('stone', [[EX - 15, 63], [EX - 11, 64], [EX - 5, 64]], { solid: false });
  // 마을버스 정류장
  const stops = { busVillage: [61, 63], busHarbor: [EX - 3, 61], busBeach: [64, CE[64] - 9], busFarm: [30, 39], busRanch: [85, 39], busHill: [61, 18], busRocks: [WX + 5, 61], busForest: [33, 72], busLight: [lx - 2, ly + 1] };
  for (const [k, [x, y]] of Object.entries(stops)) { land(x, y); obj(m, 'busstop', x, y, { stop: k }); }
  // 나무 — 마을은 적게, 숲은 빽빽하게, 들은 드문드문
  const r = rng(20240611);
  const inVillage = (x, y) => x >= 40 && x <= 82 && y >= 44 && y <= 76;
  const inFarm = (x, y) => x >= 19 && x <= 37 && y >= 25 && y <= 37;
  const inRanch = (x, y) => x >= 73 && x <= 93 && y >= 23 && y <= 37;
  const benchNear = (x, y) => Object.values(m.benches).some(bk => [...bk.seats, ...bk.stand].some(p => Math.abs(p[0] - x) <= 1 && Math.abs(p[1] - y) <= 1));
  plantTrees(m, r, 14, [40, 44, 82, 76], (x, y) => benchNear(x, y));
  plantTrees(m, r, 150, [18, 70, 47, 100], (x, y) => Math.abs(x - 34) <= 1 || Math.hypot(x - 36, y - 86) < 4.5 || benchNear(x, y) || Math.abs(y - 72) < 1, true);
  plantTrees(m, r, 120, null, (x, y) => inVillage(x, y) || inFarm(x, y) || inRanch(x, y) || (x >= 38 && x <= 92 && y >= (CE[x] || 999) - 10) || benchNear(x, y) || (x >= 40 && x <= 50 && y >= 42 && y <= 50) || Math.hypot(x - 62.5, y - 20.5) < 7 || (x >= 18 && x <= 47 && y >= 70 && y <= 100));

  // 장소 판정
  const C = (c, r) => ({ c, r }), TST = (f) => ({ test: f });
  const pl = {
    fishing: TST((x, y) => x >= EX + 5.5 && y >= 60.5 && y < 64), pier: TST((x, y) => x >= EX - 16 && y >= 56 && y <= 68),
    rocks: TST((x, y) => x <= WX + 4 && y >= 57 && y <= 67), lighthouse: C([lx + 2, ly + 3], 4), windmill: TST((x, y) => Math.hypot(x - lx + 1.5, y - 79) < 7),
    observatory: C([63.5, 15], 3), hill: TST((x, y) => Math.hypot(x - 62.5, (y - 20.5) * 1.1) < 9.5), pavilion: C([36, 85], 2.5), forest: TST((x, y) => x >= 18 && x <= 47 && y >= 70 && y <= 100),
    farm: TST((x, y) => x >= 18 && x <= 47 && y >= 24 && y <= 40), ranch: TST((x, y) => x >= 73 && x <= 93 && y >= 22 && y <= 40), field: TST((x, y) => x >= 40 && x <= 50 && y >= 42 && y <= 50),
    booth: C([54.5, 61.5], 1.1), dock: TST((x, y) => x >= EX + 4.5 && y >= 63.5 && y < 66), furniture: C([43.5, 72.8], 1.4), promenade: TST((x, y) => tileAt(Math.floor(x), Math.floor(y), MAPS.island) === T.BOARD),
    cafe: C([51.5, 63.5], 2.4), police: C([65.5, 62.8], 1.6), plaza: C([62.5, 62.5], 1.8), super: C([73.5, 62.8], 1.3), clothes: C([58.5, 62.8], 1.3), salon: C([76.5, 62.8], 1.3), sashimi: C([EX - 12.5, 62.8], 1.6),
    school: C([51, 53], 2.6), clinic: C([67.5, 53], 1.8), hall: C([73.5, 53], 2), sataek: C([44.5, 52.8], 1.3), home: C([67.5, 72.8], 1.6), storage: C([EX - 6.5, 62.8], 1.6),
    orchard: TST((x, y) => x >= 48 && x <= 54.99 && y >= 64 && y <= 69.99),
    beach: TST((x, y) => y >= 90 && x >= 38 && x <= 92 && tileAt(Math.floor(x), Math.floor(y), MAPS.island) === T.SAND),
    coast: TST((x, y) => tileAt(Math.floor(x), Math.floor(y), MAPS.island) === T.SAND),
  };
  for (const k of Object.keys(pl)) pl[k].name = PLACE_DEFS[k].name;
  m.places = pl;
  m.order = ['dock', 'fishing', 'booth', 'furniture', 'pier', 'rocks', 'lighthouse', 'windmill', 'observatory', 'hill', 'pavilion', 'cafe', 'police', 'super', 'clothes', 'salon', 'sashimi', 'plaza', 'school', 'clinic', 'hall', 'sataek', 'home', 'storage', 'orchard', 'farm', 'ranch', 'field', 'forest', 'beach', 'promenade', 'coast'];

  // 이름 붙은 좌표
  Object.assign(POI, {
    plaza: [62.5, 62.5], station: [65.5, 63.5], police: [65.5, 62.5], cafeDoor: [51.5, 62.5], schoolFront: [50.5, 52.5], clinicFront: [66.5, 52.5], hallFront: [73.5, 53.5], clothesDoor: [58.5, 62.5], salonDoor: [76.5, 62.5],
    homeDoor: [67.5, 72.5], sataekDoor: [44.5, 52.5], superDoor: [73.5, 62.5], orchardGate: [52.5, 70.5], villageEast: [78.5, 66.5], villageWest: [46.5, 62.5],
    harbor: [EX - 3.5, 62.5], pierEnd: [EX + 6.5, 62.5], pierEnd2: [EX + 6.5, 61.5], boatSpot: [EX + 4.5, 63.5], sashimiDoor: [EX - 12.5, 62.5], storageDoor: [EX - 6.5, 62.5],
    rocks: [WX + 0.5, 62.5], rocksFish: [WX - 0.5, 62.5], beach: [62.5, CE[62] - 5.5], beachEast: [76.5, CE[76] - 4.5], beachWest: [50.5, CE[50] - 4.5], beachBench: [59.5, CE[59] - 3.5],
    lighthouse: [lx + 2.5, ly + 4.5], lighthouseDoor: [lx + 1.5, ly + 2.5], windmill: [lx - 1.5, 79.5], hill: [62.5, 18.5], observatory: [63.5, 15.5],
    forest: [34.5, 80.5], pavilion: [35.5, 85.5], pond: [37.5, 87.5], farm: [28.5, 38.5], farmIn: [28.5, 33.5], farmhouse: [41.5, 36.5], ranch: [84.5, 38.5], ranchIn: [84.5, 31.5], field: [45.5, 46.5],
    cafeBench: [53.5, 62.5], plazaBench: [60.5, 65.5],
    furnitureDoor: [43.5, 72.5], booth: [54.5, 61.5], dockGate: [EX + 6.5, 64.5], ferryDock: [EX + 6.5, 63.5], ticket: [EX - 0.5, 62.5],
    schoolYard: [54.5, 50.5], schoolWall: [47.5, 50.5], crosswalk: [53.5, 54.5], alley: [56.5, 57.5], alleyEnd: [58.5, 56.5],
    promenade: [50.5, CE[50] - 7.5], stoneWall: [47.5, 66.5], digSpot: [lx - 4.5, 84.5],
  });
  for (const k of ['schoolYard', 'schoolWall', 'crosswalk', 'alley', 'alleyEnd', 'promenade', 'stoneWall', 'digSpot', 'booth', 'dockGate']) POI[k] = nearestWalkable(POI[k][0], POI[k][1], m);
  // 숨겨진 장소 입구 (발견 전에는 보이지 않음)
  m.portals = [
    { id: 'h_forest', x: 27, y: 93, to: [5.5, 9.5] }, { id: 'h_cave', x: WX + 1, y: 58, to: [3.5, 6.5] },
    { id: 'h_view', x: lx + 4, y: ly + 1, to: [3.5, 7.5] }, { id: 'h_cellar', x: 38, y: 35, to: [3.5, 4.5] },
  ];
  for (const p of m.portals) { const [x, y] = nearestWalkable(p.x + 0.5, p.y + 0.5, m); p.x = Math.floor(x); p.y = Math.floor(y); }
  m.ferry = { dock: [EX + 9, 65] };
  m.spawn = { doctor: [66.5, 52.5], teacher: [50.5, 52.5], traveler: [EX + 4.5, 62.5], cafe: [51.5, 62.5], haenyeo: [EX - 6.5, 62.5] };
  m.boatSpot = POI.boatSpot;
  m.stops = Object.fromEntries(Object.entries(stops).map(([k, [x, y]]) => [k, [x + 0.5, y + 1.5]]));
  for (const k of Object.keys(m.stops)) m.stops[k] = nearestWalkable(m.stops[k][0], m.stops[k][1], m);
}
const BUS_NAMES = { busVillage: '해월 마을', busHarbor: '동쪽 포구', busBeach: '해수욕장', busFarm: '귤 농장 마을', busRanch: '조랑말 목장', busHill: '해월 언덕', busRocks: '갯바위', busForest: '동백숲', busLight: '등대 · 풍차 언덕' };

function buildIslet() {
  const W = 22, H = 18, m = makeMap('islet', W, H, { name: '작은 무인도', places: ISLET_PLACES, order: ['isletDock', 'isletHill', 'isletBeach'] });
  const set = (x, y, t) => { if (inMap(x, y, m)) m.tiles[y * W + x] = t; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = Math.hypot((x + 0.5 - 12) / 1.25, y + 0.5 - 9), r = 6.3 + 0.5 * Math.sin(x * 1.3 + y);
    if (n <= r) set(x, y, n > r - 2.3 ? T.SAND : T.GRASS);
  }
  for (let x = 2; x <= 6; x++) set(x, 9, T.WOOD);
  set(2, 8, T.WOOD); set(2, 10, T.WOOD);
  m.benches = { islet: { name: '무인도 통나무 벤치', place: 'isletHill', seats: [[12, 6], [13, 6]], stand: [[12, 7], [13, 7]] } };
  for (const s of m.benches.islet.seats) obj(m, 'bench', s[0], s[1], { bench: 'islet' });
  obj(m, 'boat', 2, 11, { solid: false, water: true, ride: true });
  obj(m, 'rocks', 16, 12); obj(m, 'parasol', 15, 9, { season: 'summer' });
  plantTrees(m, rng(777), 7, null, (x, y) => (y === 9 && x < 8) || (x >= 11 && x <= 14 && y >= 5 && y <= 8));
  m.spawn = { dock: [5.5, 9.5] };
  m.boatSpot = [3.5, 9.5];
  m.portals = [{ id: 'h_secret', x: 17, y: 6, to: [2.5, 5.5] }];
  for (const p of m.portals) { const [x, y] = nearestWalkable(p.x + 0.5, p.y + 0.5, m); p.x = Math.floor(x); p.y = Math.floor(y); }
}
/* v6: 숨겨진 장소 (발견하면 지도에 등록) */
const HIDDEN_DEFS = {
  h_forest: { name: '숲속 오래된 정자', from: 'island', icon: '⛩️' },
  h_cave: { name: '썰물 동굴', from: 'island', icon: '🕳️' },
  h_secret: { name: '무인도 비밀 해변', from: 'islet', icon: '🏝️' },
  h_view: { name: '등대 뒤편 전망대', from: 'island', icon: '🔭' },
  h_cellar: { name: '오래된 귤 저장고', from: 'island', icon: '🍊' },
};
function buildHidden() {
  const mk = (id, W, H, fill, o = {}) => { const m = makeMap(id, W, H, Object.assign({ name: HIDDEN_DEFS[id].name, hidden: true, places: {}, order: [] }, o)); m.tiles.fill(fill); return m; };
  const setT = (m, x, y, t) => { if (inMap(x, y, m)) m.tiles[y * m.W + x] = t; };
  { // 숲속 오래된 정자
    const m = mk('h_forest', 12, 12, T.GRASS);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) if (x === 0 || y === 0 || x === 11) { if (!(x === 5 && y === 11)) obj(m, 'tree', x, y, { v: (x + y) % 4 }); }
    for (let y = 4; y <= 11; y++) setT(m, 5, y, T.ALLEY); for (let x = 3; x <= 8; x++) setT(m, x, 4, T.ALLEY);
    for (let y = 1; y <= 3; y++) for (let x = 8; x <= 10; x++) if (Math.hypot(x - 9, y - 2) < 1.6) setT(m, x, y, T.POND);
    for (const [x, y] of [[2, 7], [3, 9], [8, 8], [9, 6], [2, 2], [7, 10]]) setT(m, x, y, T.FLOWER);
    obj(m, 'pavilion', 5, 2); obj(m, 'stone', 3, 6, { solid: false }); obj(m, 'stone', 8, 5, { solid: false }); obj(m, 'bush', 9, 9); obj(m, 'bush', 1, 9);
    m.benches = { h_forest: { name: '오래된 정자 마루', place: 'h_forest', seats: [[4, 3], [6, 3]], stand: [[4, 4], [6, 4]] } };
    for (const s of m.benches.h_forest.seats) obj(m, 'bench', s[0], s[1], { bench: 'h_forest' });
    m.exitTile = [5, 11]; m.spawn = { in: [5.5, 10.5] }; m.dig = [2.5, 4.5];
  }
  { // 썰물 동굴
    const m = mk('h_cave', 10, 10, T.WATER, { dark: true });
    for (let y = 1; y < 9; y++) for (let x = 1; x < 9; x++) if (Math.hypot(x - 4.5, y - 4.5) < 4) setT(m, x, y, T.SAND);
    for (let y = 1; y < 9; y++) for (let x = 1; x < 9; x++) if (tileAt(x, y, m) === T.SAND && Math.hypot(x - 4.5, y - 4.5) > 3.1) setT(m, x, y, T.ROCK);
    for (const [x, y] of [[2, 3], [7, 3], [6, 7], [2, 6]]) obj(m, 'rocks', x, y);
    obj(m, 'glowShell', 4, 3, { solid: false }); obj(m, 'glowShell', 6, 5, { solid: false });
    m.exitTile = [3, 7]; setT(m, 3, 7, T.ROCK); setT(m, 3, 8, T.ROCK); m.spawn = { in: [3.5, 6.5] }; m.dig = [5.5, 3.5];
  }
  { // 무인도 비밀 해변
    const m = mk('h_secret', 14, 10, T.WATER);
    for (let y = 0; y < 10; y++) for (let x = 0; x < 14; x++) { const r = Math.hypot((x - 6.5) / 1.4, y - 4.5); if (r < 4.6) setT(m, x, y, r < 2.4 ? T.GRASS : T.SAND); }
    for (const [x, y] of [[4, 2], [9, 3], [6, 6]]) obj(m, 'palm', x, y);
    obj(m, 'parasol', 8, 6, { season: 'summer' }); obj(m, 'glowShell', 10, 5, { solid: false });
    m.benches = { h_secret: { name: '비밀 해변 통나무', place: 'h_secret', seats: [[6, 3], [7, 3]], stand: [[6, 4], [7, 4]] } };
    for (const s of m.benches.h_secret.seats) obj(m, 'bench', s[0], s[1], { bench: 'h_secret' });
    m.exitTile = [2, 5]; m.spawn = { in: [3.5, 5.5] }; m.dig = [9.5, 6.5];
  }
  { // 등대 뒤편 전망대
    const m = mk('h_view', 10, 9, T.WATER);
    for (let y = 1; y < 9; y++) for (let x = 0; x < 9; x++) if (Math.hypot(x - 4, (y - 5) * 1.2) < 4.4) setT(m, x, y, T.HILL);
    for (let x = 1; x <= 7; x++) if (tileAt(x, 2, m) === T.HILL) obj(m, 'lowfence', x, 2);
    obj(m, 'telescope', 6, 4); obj(m, 'flowerbed', 1, 6);
    m.benches = { h_view: { name: '숨은 전망대 벤치', place: 'h_view', seats: [[3, 3], [4, 3]], stand: [[3, 4], [4, 4]] } };
    for (const s of m.benches.h_view.seats) obj(m, 'bench', s[0], s[1], { bench: 'h_view' });
    m.exitTile = [3, 8]; setT(m, 3, 8, T.HILL); m.spawn = { in: [3.5, 7.5] }; m.dig = [6.5, 6.5];
  }
  { // 오래된 귤 저장고 (실내)
    const m = makeMap('h_cellar', 7, 6, { name: HIDDEN_DEFS.h_cellar.name, interior: true, hidden: true, owner: null, wall: '#b9a88a', wall2: '#6a4a30', places: {}, order: [] });
    m.tiles.fill(T.MAT); m.exit = [3, 5]; m.exitTile = [3, 5]; m.spawn = { in: [3.5, 4.5] }; m.visit = [];
    setFurniture(m, [['crate', 0, 0], ['crate', 1, 0], ['crate', 5, 0], ['shelf', 3, 0], ['crate', 6, 1], ['crate', 0, 2], ['lamp', 6, 3]]);
    m.dig = [4.5, 2.5];
  }
}

/* ---------------- 건물 내부 (벽을 따라 가지런히) ---------------- */
const INTERIORS = {
  home: { name: '내 집', W: 8, H: 7, floor: T.FLOOR, wall: '#f6dcd3', wall2: '#e3b9ac', decor: true, exit: [3, 6] },
  police: { name: '파출소', W: 8, H: 7, floor: T.TILEF, wall: '#dfe7f2', wall2: '#2e3d66', exit: [3, 6],
    furn: [['locker', 6, 0], ['plant', 7, 0], ['desk', 2, 0, 0, 'desk'], ['desk', 4, 0], ['chair', 2, 1], ['chair', 4, 1], ['board', 0, 2, 1, 'board'], ['crate', 0, 4, 0, 'lost']], visit: [[5.5, 3.5], [2.5, 3.5]] },
  cafe: { name: '카페 쉼터', W: 8, H: 7, floor: T.FLOOR, wall: '#f7e3c4', wall2: '#c96b4a', exit: [3, 6],
    furn: [['counter', 1, 0, 0, 'order'], ['counter', 2, 0], ['shelf', 4, 0], ['lamp', 6, 0], ['plant', 7, 0], ['table', 2, 3], ['chair', 1, 3], ['table', 5, 3], ['chair', 6, 3], ['plant', 0, 5]], visit: [[1.5, 4.5], [6.5, 4.5], [4.5, 4.5]] },
  sashimi: { name: '해월 횟집', W: 8, H: 7, floor: T.TILEF, wall: '#eef4f7', wall2: '#2f6fa8', exit: [3, 6],
    furn: [['tank', 1, 0, 0, 'tank'], ['tank', 2, 0], ['counter', 5, 0], ['plant', 7, 0], ['dining', 2, 3, 0, 'eat'], ['cushion', 2, 4], ['dining', 5, 3, 0, 'eat'], ['cushion', 5, 4]], visit: [[1.5, 3.5], [6.5, 3.5], [4.5, 4.5]] },
  hall: { name: '마을회관', W: 9, H: 8, floor: T.MAT, wall: '#f1e7d0', wall2: '#3f7f6a', exit: [4, 7],
    furn: [['screen', 2, 0], ['stage', 2, 1, 0, 'karaoke'], ['bunting', 4, 0], ['board', 6, 0, 0, 'events'], ['piano', 0, 4, 1, 'piano'], ['dining', 5, 4, 0, 'snack'], ['cushion', 5, 5], ['dining', 7, 4], ['cushion', 7, 5]], visit: [[4.5, 4.5], [6.5, 5.5], [3.5, 5.5], [8.5, 5.5]] },
  super: { name: '마을 슈퍼', W: 7, H: 6, floor: T.TILEF, wall: '#e9f0e2', wall2: '#4f9a6a', exit: [3, 5],
    furn: [['register', 1, 0, 0, 'shop'], ['shelf', 3, 0], ['shelf', 4, 0], ['shelf', 5, 0], ['plant', 6, 0], ['fridge', 0, 2, 1, 'furnShop'], ['crate', 6, 2]], visit: [[4.5, 1.5], [5.5, 3.5]] },
  school: { name: '해월초등학교', W: 8, H: 7, floor: T.FLOOR, wall: '#f4e6b8', wall2: '#5aa850', exit: [3, 6],
    furn: [['plant', 0, 0], ['board', 3, 0, 0, 'work'], ['shelf', 6, 0], ['plant', 7, 0], ['desk', 1, 2], ['desk', 5, 2], ['desk', 1, 4], ['desk', 5, 4]], visit: [[1.5, 3.5], [5.5, 3.5], [1.5, 5.5], [5.5, 5.5]] },
  clinic: { name: '보건지소', W: 8, H: 7, floor: T.TILEF, wall: '#f4f8f8', wall2: '#5aa0a6', exit: [3, 6],
    furn: [['bed', 0, 1], ['desk', 4, 0, 0, 'work'], ['shelf', 6, 0], ['plant', 7, 0], ['locker', 0, 4, 1], ['chair', 6, 3], ['chair', 6, 4]], visit: [[5.5, 3.5], [5.5, 4.5], [1.5, 2.5]] },
  storage: { name: '해녀창고', W: 8, H: 6, floor: T.FLOOR, wall: '#c9d3da', wall2: '#5f7584', exit: [3, 5],
    furn: [['gear', 1, 0, 0, 'gear'], ['gear', 2, 0], ['counter', 5, 0, 0, 'prep'], ['tank', 6, 0], ['locker', 0, 2, 1], ['crate', 7, 3], ['crate', 7, 4]], visit: [[4.5, 2.5], [5.5, 3.5]] },
  clothes: { name: '해월 옷가게', W: 7, H: 6, floor: T.FLOOR, wall: '#fbeef2', wall2: '#d9688a', exit: [3, 5],
    furn: [['rack', 1, 0, 0, 'clothes'], ['rack', 2, 0], ['mirror', 4, 0, 0, 'clothes'], ['mannequin', 6, 0], ['mannequin', 0, 2, 1], ['plant', 6, 3], ['rug', 3, 3]], visit: [[2.5, 2.5], [5.5, 2.5]] },
  salon: { name: '미용실 해바라기', W: 7, H: 6, floor: T.TILEF, wall: '#f4f0ff', wall2: '#8a6fc9', exit: [3, 5],
    furn: [['mirror', 1, 0], ['salonChair', 1, 1, 0, 'salon'], ['mirror', 4, 0], ['salonChair', 4, 1, 0, 'salon'], ['shelf', 6, 0], ['plant', 0, 4], ['sofa', 6, 3, 1]], visit: [[5.5, 4.5], [2.5, 3.5]] },
  furniture: { name: '해월 가구점', W: 8, H: 7, floor: T.FLOOR, wall: '#f3e7d6', wall2: '#8a5a3a', exit: [3, 6],
    furn: [['counter', 1, 0, 0, 'furnShop'], ['register', 2, 0, 0, 'furnShop'], ['shelf', 4, 0], ['lamp', 6, 0], ['plant', 7, 0], ['sofa2', 0, 2, 3], ['bedS', 6, 2, 0], ['tableR', 3, 3], ['chair', 2, 3, 1], ['chair', 4, 3, 3], ['rug', 3, 4]], visit: [[1.5, 5.5], [5.5, 5.5]] },
  sataek: { name: '경찰 사택', W: 7, H: 6, floor: T.FLOOR, wall: '#e4ddd0', wall2: '#2e3d66', exit: [3, 5],
    furn: [['bed', 0, 1, 0, 'detBed'], ['photo', 1, 0, 0, null, 5], ['desk', 3, 0], ['shelf', 5, 0], ['plant', 6, 0], ['rug', 3, 3]] },
};
const HOME_DEFAULT = [['bed', 0, 1, 0], ['plant', 0, 4, 0], ['kitchen', 3, 0, 0], ['fridge', 4, 0, 0], ['lamp', 6, 0, 0], ['rug', 3, 3, 0], ['table', 5, 3, 0], ['chair', 5, 4, 0]];

function buildInterior(id) {
  const I = INTERIORS[id];
  const m = makeMap('in_' + id, I.W, I.H, { name: I.name, interior: true, owner: id, wall: I.wall, wall2: I.wall2 });
  m.tiles.fill(I.floor);
  m.exit = I.exit; m.spawn = { door: [I.exit[0] + 0.5, I.exit[1] - 0.5] };
  m.tiles[I.exit[1] * I.W + I.exit[0]] = T.MAT;
  m.visit = I.visit || [[I.exit[0] + 0.5, I.exit[1] - 1.5]];
  setFurniture(m, I.furn || []);
  return m;
}
function setFurniture(m, list) {
  m.objects = m.objects.filter(o => o.kind !== 'furn'); m.block.fill(0);
  for (const f of list) {
    const isArr = Array.isArray(f);
    const k = isArr ? f[0] : f.k, x = isArr ? f[1] : f.x, y = isArr ? f[2] : f.y;
    const rot = ((isArr ? f[3] : f.rot) | 0) & 3, act = isArr ? f[4] : f.act, minStage = isArr ? f[5] : 0;
    if (!FURN[k] || !inMap(x, y, m)) continue;
    const F = FURN[k], [fw, fh] = typeof furnFoot === 'function' ? furnFoot(k, rot) : [1, 1];
    const o = { kind: 'furn', k, x, y, rot, fw, fh, flip: rot & 1, act: act || null, minStage: minStage || 0, solid: !F.flat && !F.wall, id: isArr ? null : f.id };
    m.objects.push(o);
    if (o.solid) for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) if (inMap(xx, yy, m)) m.block[yy * m.W + xx] = 1;
  }
  if (m.exit) m.block[m.exit[1] * m.W + m.exit[0]] = 0;
}
function buildWorld() {
  for (const k of Object.keys(MAPS)) delete MAPS[k];
  buildIsland(); buildIslet();
  for (const id of Object.keys(INTERIORS)) buildInterior(id);
  buildHidden();
  M = MAPS.island;
}
function placeAt(x, y, m = M) {
  if (m.hidden) return m.id;
  if (m.interior) return 'in_' + m.owner;
  for (const k of m.order) {
    const p = m.places[k];
    if (p.test ? p.test(x, y) : Math.hypot(x - p.c[0], y - p.c[1]) <= p.r) return k;
  }
  return null;
}
function placeName(k) {
  if (!k) return '';
  if (k.startsWith('in_')) return (INTERIORS[k.slice(3)] || { name: '' }).name;
  if (HIDDEN_DEFS[k]) return HIDDEN_DEFS[k].name;
  return (PLACE_DEFS[k] || ISLET_PLACES[k] || { name: '' }).name;
}

/* ---------------- 길찾기 (A*, 이진 힙, 8방향) ---------------- */
function findPath(sx, sy, tx, ty, opts = {}) {
  const m = opts.map || M;
  sx = Math.floor(sx); sy = Math.floor(sy); tx = Math.floor(tx); ty = Math.floor(ty);
  const ok = (x, y) => walkable(x, y, m) || (opts.allow && opts.allow(x, y));
  if (!inMap(sx, sy, m)) return null;
  if (!ok(tx, ty)) {
    let best = null, bd = 1e9;
    for (let r = 1; r <= 4 && !best; r++) for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
      if (!ok(x, y)) continue; const d = Math.hypot(x - tx, y - ty) + Math.hypot(x - sx, y - sy) * 0.01;
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) return null; [tx, ty] = best;
  }
  if (sx === tx && sy === ty) return [];
  const W = m.W, N = m.W * m.H;
  const g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [], hf = [];
  const push = (f, i) => { heap.push(i); hf.push(f); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (hf[p] <= hf[c]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; [hf[p], hf[c]] = [hf[c], hf[p]]; c = p; } };
  const pop = () => { const top = heap[0]; const li = heap.pop(), lf = hf.pop(); if (heap.length) { heap[0] = li; hf[0] = lf; let c = 0; for (;;) { const l = c * 2 + 1, r = l + 1; let s = c; if (l < heap.length && hf[l] < hf[s]) s = l; if (r < heap.length && hf[r] < hf[s]) s = r; if (s === c) break; [heap[s], heap[c]] = [heap[c], heap[s]]; [hf[s], hf[c]] = [hf[c], hf[s]]; c = s; } } return top; };
  const h = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return (Math.max(dx, dy) + 0.414 * Math.min(dx, dy)) * 0.9; };
  const s = sy * W + sx; g[s] = 0; push(h(sx, sy), s);
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let found = false, iter = 0;
  while (heap.length && iter++ < 60000) {
    const cur = pop();
    if (closed[cur]) continue; closed[cur] = 1;
    const cx = cur % W, cy = (cur / W) | 0;
    if (cx === tx && cy === ty) { found = true; break; }
    for (const [dx, dy, cost] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (!ok(nx, ny)) continue;
      if (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy))) continue;
      const ni = ny * W + nx; if (closed[ni]) continue;
      const t = m.tiles[ni];
      const ng = g[cur] + cost * (isRoadT(t) ? 0.9 : 1);
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; push(ng + h(nx, ny), ni); }
    }
  }
  if (!found) return null;
  const path = []; let c = ty * W + tx;
  while (c !== s && c >= 0) { path.push([c % W + 0.5, ((c / W) | 0) + 0.5]); c = came[c]; }
  return path.reverse();
}
function nearestWalkable(x, y, m = M) {
  const fx = Math.floor(x), fy = Math.floor(y);
  if (walkable(fx, fy, m)) return [x, y];
  for (let r = 1; r <= 6; r++) for (let yy = fy - r; yy <= fy + r; yy++) for (let xx = fx - r; xx <= fx + r; xx++) if (walkable(xx, yy, m)) return [xx + 0.5, yy + 0.5];
  return [x, y];
}
function nextToWater(x, y, m = M) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => isWaterT(tileAt(Math.floor(x) + a, Math.floor(y) + b, m))); }
