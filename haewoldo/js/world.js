'use strict';
/* =========================================================
 *  해월도 지도 — 섬 · 무인도 · 건물 내부, 장소, 길찾기
 * ========================================================= */
const T = { WATER: 0, SAND: 1, GRASS: 2, PATH: 3, WOOD: 4, FLOWER: 5, HILL: 6, ROCK: 7, POND: 8, FLOOR: 9, TILEF: 10, MAT: 11 };
const TILE_NAMES = ['water', 'sand', 'grass', 'path', 'wood', 'flower', 'hill', 'rock', 'pond', 'floor', 'tilefloor', 'mat'];

const MAPS = {};
let M = null;                       // 지금 보고 있는 지도
function makeMap(id, W, H, o = {}) {
  const m = Object.assign({ id, W, H, tiles: new Uint8Array(W * H), block: new Uint8Array(W * H), buildings: [], objects: [], benches: {}, exits: [], places: {}, interior: false, ground: null, groundKey: '' }, o);
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

/* ---------------- 섬 (46×46) ---------------- */
const BUILDINGS = [
  { id: 'school', name: '해월초등학교', x: 17, y: 10, w: 4, h: 4, wallH: 26, roofH: 14, wall: '#f4e6b8', base: '#d9c48d', roof: '#b8503f', sign: 'school', signX: 2.6, windows: [['L', 0.08, 0.13], ['L', 0.62, 0.13], ['L', 0.8, 0.13], ['R', 0.12, 0.14], ['R', 0.42, 0.14], ['R', 0.72, 0.14]],
    extra(g, S) { const p = S(iso(21.3, 14.2)); g.fillStyle = '#9aa3b0'; g.fillRect(p[0], p[1] - 40, 1, 40); g.fillStyle = '#ffffff'; g.fillRect(p[0] + 1, p[1] - 40, 9, 6); g.fillStyle = '#e3484a'; g.fillRect(p[0] + 4, p[1] - 38, 3, 2); g.fillStyle = '#3f63a8'; g.fillRect(p[0] + 4, p[1] - 37, 3, 1); } },
  { id: 'clinic', name: '보건지소', x: 23, y: 11, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f8f8f4', base: '#cfd8dc', roof: '#5aa0a6', sign: 'cross', windows: [['L', 0.08, 0.16], ['L', 0.72, 0.18], ['R', 0.18, 0.2], ['R', 0.6, 0.2]] },
  { id: 'hall', name: '마을회관', x: 27, y: 10, w: 4, h: 4, wallH: 24, roofH: 14, wall: '#f1e7d0', base: '#c9b98e', roof: '#3f7f6a', sign: 'hall', signX: 1.6, windows: [['L', 0.62, 0.14], ['L', 0.82, 0.12], ['R', 0.12, 0.16], ['R', 0.45, 0.16], ['R', 0.75, 0.16]] },
  { id: 'sataek', name: '경찰 사택', x: 13, y: 12, w: 2, h: 2, wallH: 18, roofH: 12, wall: '#e4ddd0', base: '#b9ae9a', roof: '#2e3d66', doorT: 0.55, windows: [['L', 0.1, 0.22], ['R', 0.35, 0.28]] },
  { id: 'cafe', name: '카페 쉼터', x: 15, y: 18, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f7e3c4', base: '#d8b98e', roof: '#c96b4a', sign: 'cup', awning: '#e3615a', windows: [['L', 0.07, 0.18], ['L', 0.7, 0.2], ['R', 0.15, 0.25], ['R', 0.58, 0.25]] },
  { id: 'police', name: '파출소', x: 22, y: 18, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f3f1ea', base: '#2e3d66', roof: '#3f63a8', sign: 'police', door: '#2e3d66', windows: [['L', 0.07, 0.18], ['L', 0.7, 0.2], ['R', 0.15, 0.22], ['R', 0.58, 0.22]],
    extra(g, S, E) { const p = E(23.5, 19.5); g.fillStyle = '#e3484a'; g.fillRect(p[0] - 3, p[1] - 15, 3, 3); g.fillStyle = '#3f8ae0'; g.fillRect(p[0], p[1] - 15, 3, 3); g.fillStyle = '#2b2026'; g.fillRect(p[0] - 3, p[1] - 12, 6, 1); } },
  { id: 'super', name: '마을 슈퍼', x: 26, y: 19, w: 2, h: 2, wallH: 18, roofH: 10, wall: '#e9f0e2', base: '#b9c9a8', roof: '#4f9a6a', sign: 'basket', awning: '#4f9a6a', doorT: 0.55, windows: [['L', 0.08, 0.24], ['R', 0.3, 0.36]] },
  { id: 'sashimi', name: '해월 횟집', x: 29, y: 18, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#eef4f7', base: '#9fbccc', roof: '#2f6fa8', sign: 'fish', awning: '#2f6fa8', windows: [['L', 0.07, 0.18], ['L', 0.72, 0.18], ['R', 0.15, 0.25], ['R', 0.58, 0.25]] },
  { id: 'home', name: '내 집', x: 17, y: 26, w: 2, h: 2, wallH: 18, roofH: 12, wall: '#f3dad2', base: '#d7b2a6', roof: '#e08a6e', sign: 'heart', doorT: 0.55, windows: [['L', 0.08, 0.22], ['R', 0.35, 0.3]] },
  { id: 'storage', name: '해녀창고', x: 23, y: 26, w: 3, h: 2, wallH: 18, roofH: 8, wall: '#8aa0b0', base: '#5f7584', roof: '#5f7a8c', sign: 'wave', door: '#3b4a56', windows: [['R', 0.35, 0.3]],
    extra(g, S) { for (let t = 0.05; t < 1; t += 0.09) { const a = S(iso(23, 28)), b = S(iso(26, 28)); const x = Math.round(a[0] + (b[0] - a[0]) * t), y = Math.round(a[1] + (b[1] - a[1]) * t); g.fillStyle = 'rgba(40,60,75,0.35)'; g.fillRect(x, y - 17, 1, 13); } } },
  { id: 'lighthouse', name: '등대', kind: 'lighthouse', x: 33, y: 31, w: 2, h: 2 },
];
for (const b of BUILDINGS) b.doorTile = [b.x + 1, b.y + b.h];
BUILDINGS.find(b => b.id === 'sataek').doorTile = [14, 14];
BUILDINGS.find(b => b.id === 'super').doorTile = [27, 21];
BUILDINGS.find(b => b.id === 'home').doorTile = [18, 28];
BUILDINGS.find(b => b.id === 'lighthouse').doorTile = [34, 33];
const ENTERABLE = ['school', 'clinic', 'hall', 'sataek', 'cafe', 'police', 'super', 'sashimi', 'home', 'storage'];

const ISLAND_BENCHES = {
  cafe: { name: '카페 테라스 벤치', place: 'cafe', seats: [[16, 23], [17, 23]], stand: [[16, 24], [17, 24]] },
  pier: { name: '부두 벤치', place: 'pier', seats: [[42, 20], [43, 20]], stand: [[42, 21], [43, 21]] },
  lighthouse: { name: '등대 벤치', place: 'lighthouse', seats: [[35, 34], [36, 34]], stand: [[35, 35], [36, 35]] },
  observatory: { name: '전망대 벤치', place: 'observatory', seats: [[9, 12], [10, 12]], stand: [[9, 13], [10, 13]] },
  pavilion: { name: '숲속 정자', place: 'pavilion', seats: [[35, 24], [36, 24]], stand: [[35, 25], [36, 25]] },
  beach: { name: '해변 벤치', place: 'beach', seats: [[17, 35], [18, 35]], stand: [[17, 36], [18, 36]] },
};

const ISLAND_PLACES = {
  fishing: { name: '부두 낚시터', test: (x, y) => x >= 44 && y >= 20 && y <= 22 },
  pier: { name: '해월도 부두', test: (x, y) => x >= 37 && y >= 18 && y <= 24 },
  rocks: { name: '갯바위 낚시터', test: (x, y) => x <= 8.9 && y >= 22.5 && y <= 29 },
  cafe: { name: '카페 쉼터', c: [16.5, 22.5], r: 2.4 },
  police: { name: '파출소', c: [23.5, 21.8], r: 1.6 },
  plaza: { name: '마을 광장', c: [21.5, 21.5], r: 1.8 },
  super: { name: '마을 슈퍼', c: [27.5, 21.8], r: 1.3 },
  sashimi: { name: '해월 횟집', c: [30.5, 21.8], r: 1.6 },
  school: { name: '해월초등학교', c: [19, 15], r: 2.6 },
  clinic: { name: '보건지소', c: [24.5, 15], r: 1.8 },
  hall: { name: '마을회관', c: [28.5, 15], r: 2 },
  sataek: { name: '경찰 사택', c: [14.5, 14.8], r: 1.3 },
  observatory: { name: '언덕 전망대', c: [9.5, 12.5], r: 2.6 },
  home: { name: '내 집', c: [18.5, 28.8], r: 1.6 },
  storage: { name: '해녀창고', c: [24.5, 28.8], r: 1.8 },
  lighthouse: { name: '등대', c: [34.5, 34], r: 2.8 },
  pavilion: { name: '숲속 정자', c: [35.5, 24.5], r: 2.2 },
  forest: { name: '숲길', test: (x, y) => x >= 31 && x <= 39 && y >= 22 && y <= 30 },
  orchard: { name: '귤밭', test: (x, y) => x >= 10 && x <= 14.99 && y >= 23 && y <= 27.99 },
  beach: { name: '해수욕장', test: (x, y) => y >= 33 && tileAt(Math.floor(x), Math.floor(y), MAPS.island) === T.SAND },
  coast: { name: '해안 산책로', test: (x, y) => tileAt(Math.floor(x), Math.floor(y), MAPS.island) === T.SAND },
};
const ISLAND_ORDER = ['fishing', 'pier', 'rocks', 'lighthouse', 'observatory', 'pavilion', 'cafe', 'police', 'super', 'sashimi', 'plaza', 'school', 'clinic', 'hall', 'sataek', 'home', 'storage', 'orchard', 'forest', 'beach', 'coast'];

const ISLET_PLACES = {
  isletDock: { name: '무인도 선착장', test: (x, y) => x <= 6 },
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
function plantTrees(m, r, count, region, avoid) {
  let tries = 0, planted = 0;
  const near = (x, y, d) => {
    for (let yy = y - d; yy <= y + d; yy++) for (let xx = x - d; xx <= x + d; xx++) {
      const t = tileAt(xx, yy, m);
      if (t === T.PATH || t === T.WOOD || t === T.ROCK || (inMap(xx, yy, m) && m.block[yy * m.W + xx])) return true;
    }
    return false;
  };
  while (planted < count && tries++ < 5000) {
    const x = region ? region[0] + Math.floor(r() * (region[2] - region[0] + 1)) : Math.floor(r() * m.W);
    const y = region ? region[1] + Math.floor(r() * (region[3] - region[1] + 1)) : Math.floor(r() * m.H);
    const t = tileAt(x, y, m);
    if (t !== T.GRASS && t !== T.SAND && t !== T.HILL) continue;
    if (near(x, y, region ? 0 : 1)) continue;
    if (avoid && avoid(x, y)) continue;
    if (t === T.SAND) { if (r() < 0.55) continue; obj(m, 'palm', x, y); }
    else obj(m, 'tree', x, y, { v: planted % 4 });
    planted++;
  }
}

function buildIsland() {
  const W = 46, m = makeMap('island', W, W, { name: '해월도', places: ISLAND_PLACES, order: ISLAND_ORDER, benches: ISLAND_BENCHES });
  const set = (x, y, t) => { if (inMap(x, y, m)) m.tiles[y * W + x] = t; };
  const land = (x, y) => { if (tileAt(x, y, m) === T.WATER) set(x, y, T.SAND); };
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const dx = Math.abs(x + 0.5 - 22.5), dy = Math.abs(y + 0.5 - 22.5);
    const n = Math.pow(Math.pow(dx, 4) + Math.pow(dy, 4), 0.25);
    const r = 15.6 + 0.7 * Math.sin(x * 0.9) + 0.6 * Math.cos(y * 1.3);
    if (n <= r) set(x, y, n > r - 2.1 ? T.SAND : T.GRASS);
  }
  const hline = (y, x0, x1, t = T.PATH) => { for (let x = x0; x <= x1; x++) set(x, y, t); };
  const vline = (x, y0, y1, t = T.PATH) => { for (let y = y0; y <= y1; y++) set(x, y, t); };
  for (let y = 9; y <= 15; y++) for (let x = 6; x <= 13; x++) if (Math.hypot(x - 9.5, y - 12) < 3) set(x, y, T.HILL);
  for (let y = 23; y <= 28; y++) for (let x = 5; x <= 8; x++) set(x, y, T.ROCK);
  set(4, 25, T.ROCK); set(4, 26, T.ROCK);
  hline(21, 8, 37); hline(14, 9, 32); hline(28, 13, 34);
  vline(21, 9, 36); vline(15, 21, 28); vline(34, 22, 28); vline(32, 29, 33); hline(33, 32, 34); vline(8, 21, 22);
  hline(21, 38, 41, T.WOOD); for (let y = 20; y <= 22; y++) hline(y, 41, 44, T.WOOD);
  for (const [x, y] of [[37, 27], [38, 27], [37, 28], [38, 28]]) set(x, y, T.POND);
  for (const bk of Object.values(ISLAND_BENCHES)) for (const p of [...bk.seats, ...bk.stand]) land(p[0], p[1]);
  for (const [x, y] of [[34, 34], [33, 34], [36, 33], [37, 33]]) land(x, y);
  for (const [x, y] of [[18, 19], [18, 20], [14, 20], [22, 17], [26, 17], [16, 29], [20, 29], [22, 25], [22, 24], [13, 15], [29, 16], [20, 26], [26, 23], [27, 23], [19, 16], [12, 21], [33, 25], [36, 26]]) if (tileAt(x, y, m) === T.GRASS) set(x, y, T.FLOWER);

  for (const b of BUILDINGS) {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { if (tileAt(x, y, m) === T.WATER) set(x, y, T.SAND); m.block[y * W + x] = 1; }
    m.buildings.push(b);
  }
  for (const [k, bk] of Object.entries(ISLAND_BENCHES)) for (const s of bk.seats) obj(m, 'bench', s[0], s[1], { bench: k });
  for (let x = 10; x <= 14; x++) for (let y = 23; y <= 27; y++) {
    const border = x === 10 || x === 14 || y === 23 || y === 27;
    if (border && !(x === 14 && y === 25)) obj(m, 'wall', x, y);
  }
  for (const [x, y] of [[11, 24], [13, 24], [11, 26], [13, 26], [12, 25]]) obj(m, 'orange', x, y);
  obj(m, 'hare', 20, 20); obj(m, 'hare', 22, 22);
  obj(m, 'board', 25, 22); obj(m, 'crates', 28, 20); obj(m, 'tankOut', 32, 20);
  obj(m, 'parasol', 18, 23); obj(m, 'telescope', 8, 12); obj(m, 'pavilion', 36, 23);
  for (const [x, y] of [[19, 22], [25, 20], [31, 22], [22, 13], [16, 15], [26, 15], [20, 27], [26, 29], [36, 22], [14, 22], [33, 27], [40, 22], [22, 35], [9, 20]]) obj(m, 'lamp', x, y, { light: true });
  for (const [x, y] of [[14, 19], [26, 24], [20, 25], [12, 15]]) obj(m, 'pot', x, y);
  for (const [x, y] of [[4, 23], [5, 29], [3, 27]]) obj(m, 'rocks', x, y, { water: tileAt(x, y, m) === T.WATER });
  obj(m, 'boat', 41, 24, { solid: false, water: true, ride: true }); obj(m, 'boat', 38, 18, { solid: false, water: true });
  // 계절 소품
  for (const [x, y] of [[19, 36], [24, 36], [26, 35]]) obj(m, 'parasol', x, y, { season: 'summer' });
  obj(m, 'snowman', 19, 19, { season: 'winter' }); obj(m, 'snowman', 25, 24, { season: 'winter' });
  const r = rng(20240611);
  plantTrees(m, r, 22, [31, 22, 39, 31], (x, y) => Math.abs(x - 34) <= 1 || (y >= 23 && y <= 26 && x >= 34 && x <= 37));
  plantTrees(m, r, 64, null, (x, y) => Object.values(ISLAND_BENCHES).some(bk => [...bk.seats, ...bk.stand].some(p => Math.abs(p[0] - x) <= 1 && Math.abs(p[1] - y) <= 1)) || (y >= 34 && x >= 16 && x <= 27));
  m.spawn = { doctor: [24.5, 14.5], teacher: [18.5, 14.5], traveler: [42.5, 21.5], cafe: [16.5, 21.5], haenyeo: [24.5, 28.5] };
  m.boatSpot = [41.5, 22.5];
}

function buildIslet() {
  const W = 22, H = 18, m = makeMap('islet', W, H, { name: '작은 무인도', places: ISLET_PLACES, order: ['isletDock', 'isletHill', 'isletBeach'] });
  const set = (x, y, t) => { if (inMap(x, y, m)) m.tiles[y * W + x] = t; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = Math.abs(x + 0.5 - 12), dy = Math.abs(y + 0.5 - 9);
    const n = Math.hypot(dx / 1.25, dy);
    const r = 6.3 + 0.5 * Math.sin(x * 1.3 + y);
    if (n <= r) set(x, y, n > r - 2.3 ? T.SAND : T.GRASS);
  }
  for (let x = 2; x <= 6; x++) set(x, 9, T.WOOD);
  set(2, 8, T.WOOD); set(2, 10, T.WOOD);
  m.benches = { islet: { name: '무인도 통나무 벤치', place: 'isletHill', seats: [[12, 6], [13, 6]], stand: [[12, 7], [13, 7]] } };
  for (const s of m.benches.islet.seats) obj(m, 'bench', s[0], s[1], { bench: 'islet' });
  obj(m, 'boat', 2, 11, { solid: false, water: true, ride: true });
  obj(m, 'rocks', 16, 12); obj(m, 'rocks', 17, 5, { water: tileAt(17, 5, m) === T.WATER });
  obj(m, 'parasol', 15, 9, { season: 'summer' });
  const r = rng(777);
  plantTrees(m, r, 10, null, (x, y) => (y === 9 && x < 8) || (x >= 11 && x <= 14 && y >= 5 && y <= 8));
  m.spawn = { dock: [5.5, 9.5] };
  m.boatSpot = [3.5, 9.5];
}

/* ---------------- 건물 내부 ---------------- */
const INTERIORS = {
  home: { name: '내 집', W: 8, H: 7, floor: T.FLOOR, wall: '#f6dcd3', wall2: '#e3b9ac', decor: true, exit: [3, 6] },
  police: { name: '파출소', W: 8, H: 7, floor: T.TILEF, wall: '#dfe7f2', wall2: '#2e3d66', exit: [3, 6],
    furn: [['desk', 2, 1, 0, 'desk'], ['desk', 5, 1], ['board', 0, 3, 1, 'board'], ['locker', 7, 1], ['chair', 2, 2], ['plant', 7, 5], ['crate', 6, 4, 0, 'lost']] },
  cafe: { name: '카페 쉼터', W: 8, H: 7, floor: T.FLOOR, wall: '#f7e3c4', wall2: '#c96b4a', exit: [3, 6],
    furn: [['counter', 2, 1, 0, 'order'], ['counter', 3, 1], ['shelf', 5, 0], ['table', 5, 3], ['chair', 6, 3], ['chair', 4, 3], ['table', 5, 5], ['chair', 6, 5], ['plant', 0, 5], ['lamp', 7, 1, 0, null]] },
  sashimi: { name: '해월 횟집', W: 8, H: 7, floor: T.TILEF, wall: '#eef4f7', wall2: '#2f6fa8', exit: [3, 6],
    furn: [['tank', 1, 1, 0, 'tank'], ['tank', 2, 1], ['counter', 5, 1, 0, 'counter'], ['dining', 4, 3, 0, 'eat'], ['cushion', 3, 3], ['cushion', 5, 4], ['dining', 6, 5, 0, 'eat'], ['cushion', 5, 5], ['plant', 0, 5]] },
  hall: { name: '마을회관', W: 9, H: 8, floor: T.MAT, wall: '#f1e7d0', wall2: '#3f7f6a', exit: [4, 7],
    furn: [['screen', 1, 0], ['stage', 1, 1, 0, 'karaoke'], ['board', 6, 0, 0, 'events'], ['piano', 8, 2, 1, 'piano'], ['dining', 4, 4, 0, 'snack'], ['cushion', 3, 4], ['cushion', 5, 4], ['dining', 6, 5], ['cushion', 7, 5], ['bunting', 3, 0, 0, null]] },
  super: { name: '마을 슈퍼', W: 7, H: 6, floor: T.TILEF, wall: '#e9f0e2', wall2: '#4f9a6a', exit: [3, 5],
    furn: [['register', 1, 1, 0, 'shop'], ['shelf', 3, 0], ['shelf', 4, 0], ['shelf', 5, 0], ['fridge', 6, 2, 1, 'furnShop'], ['crate', 5, 3], ['crate', 1, 4]] },
  school: { name: '해월초등학교', W: 8, H: 7, floor: T.FLOOR, wall: '#f4e6b8', wall2: '#5aa850', exit: [3, 6],
    furn: [['board', 3, 0, 0, 'work'], ['desk', 1, 2], ['desk', 3, 2], ['desk', 5, 2], ['desk', 1, 4], ['desk', 5, 4], ['shelf', 7, 1], ['plant', 7, 5]] },
  clinic: { name: '보건지소', W: 8, H: 7, floor: T.TILEF, wall: '#f4f8f8', wall2: '#5aa0a6', exit: [3, 6],
    furn: [['bed', 1, 1], ['desk', 4, 1, 0, 'work'], ['chair', 4, 2], ['shelf', 6, 0], ['plant', 7, 4], ['locker', 0, 4, 1]] },
  storage: { name: '해녀창고', W: 8, H: 6, floor: T.FLOOR, wall: '#c9d3da', wall2: '#5f7584', exit: [3, 5],
    furn: [['gear', 1, 0, 0, 'gear'], ['gear', 2, 0], ['counter', 5, 1, 0, 'prep'], ['tank', 6, 1], ['crate', 1, 3], ['crate', 7, 4], ['locker', 0, 2, 1]] },
  sataek: { name: '경찰 사택', W: 7, H: 6, floor: T.FLOOR, wall: '#e4ddd0', wall2: '#2e3d66', exit: [3, 5],
    furn: [['bed', 1, 1, 0, 'detBed'], ['desk', 4, 0], ['shelf', 6, 1, 1], ['plant', 0, 4], ['rug', 3, 3], ['photo', 5, 0, 0, null, 5]] },
};
const HOME_DEFAULT = [['bed', 1, 1, 0], ['rug', 4, 4, 0], ['table', 5, 3, 0], ['chair', 4, 3, 0], ['kitchen', 6, 0, 0], ['plant', 0, 5, 0], ['lamp', 7, 2, 0]];

function buildInterior(id, furnList) {
  const I = INTERIORS[id];
  const m = makeMap('in_' + id, I.W, I.H, { name: I.name, interior: true, owner: id, wall: I.wall, wall2: I.wall2, places: {}, order: [] });
  m.tiles.fill(I.floor);
  m.exit = I.exit; m.spawn = { door: [I.exit[0] + 0.5, I.exit[1] - 0.5] };
  m.tiles[I.exit[1] * I.W + I.exit[0]] = T.MAT;
  setFurniture(m, furnList || (I.furn || []).map(f => f));
  return m;
}
function setFurniture(m, list) {
  m.objects = m.objects.filter(o => o.kind !== 'furn'); m.block.fill(0);
  for (const f of list) {
    const [k, x, y, flip, act, minStage] = f;
    if (!FURN[k] || !inMap(x, y, m)) continue;
    const o = { kind: 'furn', k, x, y, flip: !!flip, act: act || null, minStage: minStage || 0, solid: !FURN[k].flat };
    m.objects.push(o);
    if (o.solid) m.block[y * m.W + x] = 1;
  }
  // 출구는 늘 비워 둠
  m.block[m.exit[1] * m.W + m.exit[0]] = 0;
}

function buildWorld() {
  for (const k of Object.keys(MAPS)) delete MAPS[k];
  buildIsland(); buildIslet();
  for (const id of Object.keys(INTERIORS)) buildInterior(id);
  M = MAPS.island;
}

function placeAt(x, y, m = M) {
  if (m.interior) return 'in_' + m.owner;
  for (const k of m.order) {
    const p = m.places[k];
    if (p.test ? p.test(x, y) : Math.hypot(x - p.c[0], y - p.c[1]) <= p.r) return k;
  }
  return null;
}
function placeName(k) {
  if (!k) return '';
  if (k.startsWith('in_')) return INTERIORS[k.slice(3)].name;
  return (ISLAND_PLACES[k] || ISLET_PLACES[k] || { name: '' }).name;
}

/* ---------------- 길찾기 (A*, 8방향) ---------------- */
function findPath(sx, sy, tx, ty, opts = {}) {
  const m = opts.map || M;
  sx = Math.floor(sx); sy = Math.floor(sy); tx = Math.floor(tx); ty = Math.floor(ty);
  const ok = (x, y) => walkable(x, y, m) || (opts.allow && opts.allow(x, y));
  if (!ok(tx, ty)) {
    let best = null, bd = 1e9;
    for (let r = 1; r <= 3 && !best; r++) for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
      if (!ok(x, y)) continue; const d = Math.hypot(x - tx, y - ty) + Math.hypot(x - sx, y - sy) * 0.01;
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) return null; [tx, ty] = best;
  }
  if (sx === tx && sy === ty) return [];
  const W = m.W, N = m.W * m.H, g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const open = [];
  const h = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  if (!inMap(sx, sy, m)) return null;
  const s = sy * W + sx; g[s] = 0; open.push([h(sx, sy), s]);
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let found = false, iter = 0;
  while (open.length && iter++ < 9000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [, cur] = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (closed[cur]) continue; closed[cur] = 1;
    const cx = cur % W, cy = (cur / W) | 0;
    if (cx === tx && cy === ty) { found = true; break; }
    for (const [dx, dy, cost] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (!ok(nx, ny)) continue;
      if (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy))) continue;
      const ni = ny * W + nx; if (closed[ni]) continue;
      const t = m.tiles[ni];
      const ng = g[cur] + cost * (t === T.PATH || t === T.WOOD ? 0.9 : 1);
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; open.push([ng + h(nx, ny), ni]); }
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
  for (let r = 1; r <= 5; r++) for (let yy = fy - r; yy <= fy + r; yy++) for (let xx = fx - r; xx <= fx + r; xx++) if (walkable(xx, yy, m)) return [xx + 0.5, yy + 0.5];
  return [x, y];
}
function nextToWater(x, y, m = M) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => isWaterT(tileAt(Math.floor(x) + a, Math.floor(y) + b, m))); }
