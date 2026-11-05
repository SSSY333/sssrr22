'use strict';
/* =========================================================
 *  해월도 지도 — 타일, 건물, 소품, 장소, 길찾기
 * ========================================================= */
const MAP = 38;
const T = { WATER: 0, SAND: 1, GRASS: 2, PATH: 3, WOOD: 4, FLOWER: 5, HILL: 6 };
const TILE_NAMES = ['water', 'sand', 'grass', 'path', 'wood', 'flower', 'hill'];

const World = {
  tiles: new Uint8Array(MAP * MAP),
  block: new Uint8Array(MAP * MAP),
  buildings: [], objects: [], benches: {}, places: {},
};
const tIdx = (x, y) => y * MAP + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MAP && y < MAP;
function tileAt(x, y) { return inMap(x, y) ? World.tiles[tIdx(x, y)] : T.WATER; }
function walkable(x, y) {
  if (!inMap(x, y)) return false;
  const t = World.tiles[tIdx(x, y)];
  return t !== T.WATER && !World.block[tIdx(x, y)];
}

/* 건물 정의 — 문은 (x+1, y+h) 타일 앞 */
const BUILDINGS = [
  { id: 'school', name: '해월초등학교', x: 13, y: 6, w: 4, h: 4, wallH: 26, roofH: 14, wall: '#f4e6b8', base: '#d9c48d', roof: '#b8503f', sign: 'school', signX: 2.6, windows: [['L', 0.08, 0.13], ['L', 0.62, 0.13], ['L', 0.8, 0.13], ['R', 0.12, 0.14], ['R', 0.42, 0.14], ['R', 0.72, 0.14]],
    extra(g, S, E, H) { const p = S(iso(17.3, 10.2)); g.fillStyle = '#9aa3b0'; g.fillRect(p[0], p[1] - 40, 1, 40); g.fillStyle = '#ffffff'; g.fillRect(p[0] + 1, p[1] - 40, 9, 6); g.fillStyle = '#e3484a'; g.fillRect(p[0] + 4, p[1] - 38, 3, 2); g.fillStyle = '#3f63a8'; g.fillRect(p[0] + 4, p[1] - 37, 3, 1); } },
  { id: 'clinic', name: '보건지소', x: 20, y: 7, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f8f8f4', base: '#cfd8dc', roof: '#5aa0a6', sign: 'cross', windows: [['L', 0.08, 0.16], ['L', 0.72, 0.18], ['R', 0.18, 0.2], ['R', 0.6, 0.2]] },
  { id: 'detHouse', name: '형사님 집', x: 10, y: 8, w: 2, h: 2, wallH: 18, roofH: 12, wall: '#ddd5c6', base: '#b9ae9a', roof: '#55606e', doorT: 0.55, windows: [['L', 0.1, 0.22], ['R', 0.35, 0.28]] },
  { id: 'cafe', name: '카페 쉼터', x: 11, y: 14, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f7e3c4', base: '#d8b98e', roof: '#c96b4a', sign: 'cup', awning: '#e3615a', windows: [['L', 0.07, 0.18], ['L', 0.7, 0.2], ['R', 0.15, 0.25], ['R', 0.58, 0.25]] },
  { id: 'police', name: '파출소', x: 19, y: 14, w: 3, h: 3, wallH: 22, roofH: 12, wall: '#f3f1ea', base: '#2e3d66', roof: '#3f63a8', sign: 'police', door: '#2e3d66', windows: [['L', 0.07, 0.18], ['L', 0.7, 0.2], ['R', 0.15, 0.22], ['R', 0.58, 0.22]],
    extra(g, S, E, H) { const p = E(20.5, 15.5); g.fillStyle = '#e3484a'; g.fillRect(p[0] - 3, p[1] - 15, 3, 3); g.fillStyle = '#3f8ae0'; g.fillRect(p[0], p[1] - 15, 3, 3); g.fillStyle = '#2b2026'; g.fillRect(p[0] - 3, p[1] - 12, 6, 1); } },
  { id: 'super', name: '마을 슈퍼', x: 23, y: 15, w: 2, h: 2, wallH: 18, roofH: 10, wall: '#e9f0e2', base: '#b9c9a8', roof: '#4f9a6a', sign: 'basket', awning: '#4f9a6a', doorT: 0.55, windows: [['L', 0.08, 0.24], ['R', 0.3, 0.36]] },
  { id: 'home', name: '내 집', x: 12, y: 22, w: 2, h: 2, wallH: 18, roofH: 12, wall: '#f3dad2', base: '#d7b2a6', roof: '#e08a6e', sign: 'heart', doorT: 0.55, windows: [['L', 0.08, 0.22], ['R', 0.35, 0.3]] },
  { id: 'haenyeo', name: '해녀 불턱', x: 20, y: 22, w: 3, h: 2, wallH: 14, roofH: 10, wall: '#5b5f69', roof: '#c9a86a', stone: true, sign: 'wave', door: '#3b2e28', windows: [['R', 0.35, 0.3]] },
  { id: 'lighthouse', name: '등대', kind: 'lighthouse', x: 24, y: 25, w: 2, h: 2 },
];

/* 문 타일 */
for (const b of BUILDINGS) b.door = b.door || null, b.doorTile = [b.x + 1, b.y + b.h];
BUILDINGS.find(b => b.id === 'detHouse').doorTile = [11, 10];
BUILDINGS.find(b => b.id === 'super').doorTile = [24, 17];
BUILDINGS.find(b => b.id === 'home').doorTile = [13, 24];
BUILDINGS.find(b => b.id === 'lighthouse').doorTile = [25, 27];

/* 벤치: 두 자리, 모두 카메라(왼쪽 아래)를 보고 앉음 */
const BENCHES = {
  cafe: { name: '카페 테라스 벤치', place: 'cafe', seats: [[12, 19], [13, 19]], stand: [[12, 20], [13, 20]] },
  pier: { name: '부두 벤치', place: 'pier', seats: [[34, 16], [35, 16]], stand: [[34, 17], [35, 17]] },
  lighthouse: { name: '등대 벤치', place: 'lighthouse', seats: [[26, 27], [27, 27]], stand: [[26, 28], [27, 28]] },
  observatory: { name: '전망대 벤치', place: 'observatory', seats: [[8, 6], [9, 6]], stand: [[8, 7], [9, 7]] },
};

const PLACES = {
  pier: { name: '해월도 부두', test: (x, y) => x >= 29 && y >= 14 && y <= 20 },
  fishing: { name: '낚시터', test: (x, y) => x >= 35 && y >= 16 && y <= 18 },
  cafe: { name: '카페 쉼터', c: [12.5, 18.5], r: 2.6 },
  police: { name: '파출소', c: [20.5, 17.8], r: 1.8 },
  plaza: { name: '마을 광장', c: [17.5, 17.5], r: 1.9 },
  super: { name: '마을 슈퍼', c: [24.5, 17.8], r: 1.6 },
  school: { name: '해월초등학교', c: [15, 11], r: 2.6 },
  clinic: { name: '보건지소', c: [21.5, 11], r: 2.2 },
  detHouse: { name: '형사님 집', c: [11.5, 10.8], r: 1.3 },
  home: { name: '내 집', c: [13.5, 24.8], r: 1.8 },
  haenyeo: { name: '해녀 불턱', c: [21.5, 24.8], r: 2 },
  lighthouse: { name: '등대', c: [25.5, 27.8], r: 2.8 },
  observatory: { name: '언덕 전망대', c: [8, 7], r: 2.6 },
  orchard: { name: '귤밭', test: (x, y) => x >= 6 && x <= 10 && y >= 19 && y <= 23 },
  beach: { name: '해안 산책로', test: (x, y) => tileAt(Math.floor(x), Math.floor(y)) === T.SAND },
};
const PLACE_ORDER = ['fishing', 'pier', 'lighthouse', 'observatory', 'cafe', 'police', 'super', 'plaza', 'school', 'clinic', 'detHouse', 'home', 'haenyeo', 'orchard', 'beach'];
function placeAt(x, y) {
  for (const k of PLACE_ORDER) {
    const p = PLACES[k];
    if (p.test ? p.test(x, y) : Math.hypot(x - p.c[0], y - p.c[1]) <= p.r) return k;
  }
  return null;
}

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function buildWorld() {
  const W = World;
  W.tiles.fill(T.WATER); W.block.fill(0);
  // 섬 모양 (초타원 + 물결)
  for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
    const dx = Math.abs(x + 0.5 - 17.5), dy = Math.abs(y + 0.5 - 17.5);
    const n = Math.pow(Math.pow(dx, 4) + Math.pow(dy, 4), 0.25);
    const r = 12.6 + 0.7 * Math.sin(x * 0.9) + 0.6 * Math.cos(y * 1.3);
    if (n <= r) W.tiles[tIdx(x, y)] = n > r - 2.1 ? T.SAND : T.GRASS;
  }
  const set = (x, y, t) => { if (inMap(x, y)) W.tiles[tIdx(x, y)] = t; };
  const land = (x, y) => { if (tileAt(x, y) === T.WATER) set(x, y, T.SAND); };
  const hline = (y, x0, x1, t = T.PATH) => { for (let x = x0; x <= x1; x++) set(x, y, t); };
  const vline = (x, y0, y1, t = T.PATH) => { for (let y = y0; y <= y1; y++) set(x, y, t); };

  // 언덕 전망대 주변
  for (let y = 4; y <= 8; y++) for (let x = 5; x <= 10; x++) if (Math.hypot(x - 7.5, y - 6.5) < 3.2) set(x, y, T.HILL);
  // 길
  hline(17, 6, 30); hline(10, 7, 26); hline(24, 10, 24);
  vline(17, 7, 28); vline(11, 17, 24); vline(7, 5, 10); vline(23, 24, 27); hline(27, 23, 25);
  for (let x = 28; x <= 30; x++) if (tileAt(x, 17) === T.WATER) set(x, 17, T.SAND);
  // 부두 (나무 데크)
  hline(17, 29, 33, T.WOOD);
  for (let y = 16; y <= 18; y++) hline(y, 33, 36, T.WOOD);
  // 해안 산책로는 모래사장 그대로
  for (const bk of Object.values(BENCHES)) for (const p of [...bk.seats, ...bk.stand]) land(p[0], p[1]);
  land(6, 6); land(26, 28); land(27, 28); land(28, 27);
  // 수국 꽃밭
  for (const [x, y] of [[14, 15], [14, 16], [10, 16], [18, 13], [22, 13], [12, 25], [14, 25], [18, 21], [19, 21], [9, 11], [25, 11], [16, 25], [22, 19], [23, 19], [15, 12]]) if (tileAt(x, y) === T.GRASS) set(x, y, T.FLOWER);

  // 건물
  W.buildings = [];
  for (const b of BUILDINGS) {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { if (tileAt(x, y) === T.WATER) set(x, y, T.SAND); W.block[tIdx(x, y)] = 1; }
    W.buildings.push(b);
  }

  // 소품
  W.objects = [];
  const obj = (kind, x, y, spr, solid = true, extra = {}) => {
    if (!inMap(x, y)) return;
    land(x, y);
    W.objects.push(Object.assign({ kind, x, y, w: 1, h: 1, spr, solid }, extra));
    if (solid) W.block[tIdx(x, y)] = 1;
  };
  const S = {
    tree: [0, 1, 2, 3].map(v => sprTree('tree', v)), palm: sprTree('palm', 0), orange: sprTree('orange', 0),
    wall: sprWall(), bench: sprBench(), lamp: sprLamp(), parasol: sprParasol(), telescope: sprTelescope(),
    hare: sprHareubang(), board: sprBoard(), crates: sprCrates(), boat: sprBoat(), pot: sprPot(),
  };
  W.spr = S;
  for (const [k, bk] of Object.entries(BENCHES)) for (const s of bk.seats) obj('bench', s[0], s[1], S.bench, true, { bench: k });
  // 귤밭 + 돌담
  for (let x = 6; x <= 10; x++) for (let y = 19; y <= 23; y++) {
    const border = x === 6 || x === 10 || y === 19 || y === 23;
    if (border && !(x === 10 && y === 21)) obj('wall', x, y, S.wall);
  }
  for (const [x, y] of [[7, 20], [9, 20], [7, 22], [9, 22], [8, 21]]) obj('orange', x, y, S.orange);
  // 광장
  obj('hare', 16, 16, S.hare); obj('hare', 18, 18, S.hare);
  obj('board', 22, 18, S.board); obj('crates', 25, 16, S.crates);
  obj('parasol', 14, 20, S.parasol);
  obj('telescope', 6, 6, S.telescope);
  for (const [x, y] of [[15, 18], [19, 18], [26, 18], [18, 12], [18, 22], [13, 11], [22, 25], [29, 18], [8, 11], [24, 23]]) obj('lamp', x, y, S.lamp, true, { light: true });
  for (const [x, y] of [[10, 17], [14, 23], [22, 11], [16, 21]]) obj('pot', x, y, S.pot);
  obj('boat', 33, 20, S.boat, false, { water: true }); obj('boat', 31, 15, S.boat, false, { water: true });

  // 나무 (시드 고정)
  const r = rng(20240611);
  const near = (x, y, d) => {
    for (let yy = y - d; yy <= y + d; yy++) for (let xx = x - d; xx <= x + d; xx++) {
      const t = tileAt(xx, yy);
      if (t === T.PATH || t === T.WOOD || (inMap(xx, yy) && W.block[tIdx(xx, yy)])) return true;
    }
    return false;
  };
  let tries = 0, planted = 0;
  while (planted < 46 && tries++ < 4000) {
    const x = Math.floor(r() * MAP), y = Math.floor(r() * MAP);
    const t = tileAt(x, y);
    if (t !== T.GRASS && t !== T.SAND && t !== T.HILL) continue;
    if (near(x, y, 1)) continue;
    let seatNear = false;
    for (const bk of Object.values(BENCHES)) for (const p of [...bk.seats, ...bk.stand]) if (Math.abs(p[0] - x) <= 1 && Math.abs(p[1] - y) <= 1) seatNear = true;
    if (seatNear) continue;
    if (t === T.SAND) { if (r() < 0.55) continue; obj('palm', x, y, S.palm); }
    else obj('tree', x, y, S.tree[planted % 4]);
    planted++;
  }
  W.benches = BENCHES; W.places = PLACES;
}

/* ---------------- 길찾기 (A*, 8방향, 모서리 끼임 방지) ---------------- */
function findPath(sx, sy, tx, ty, opts = {}) {
  sx = Math.floor(sx); sy = Math.floor(sy); tx = Math.floor(tx); ty = Math.floor(ty);
  const ok = (x, y) => walkable(x, y) || (opts.allow && opts.allow(x, y));
  if (!ok(tx, ty)) {
    // 가장 가까운 걸을 수 있는 칸으로
    let best = null, bd = 1e9;
    for (let r = 1; r <= 3 && !best; r++) for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
      if (!ok(x, y)) continue; const d = Math.hypot(x - tx, y - ty) + Math.hypot(x - sx, y - sy) * 0.01;
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) return null; [tx, ty] = best;
  }
  if (sx === tx && sy === ty) return [];
  const N = MAP * MAP, g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const open = [];
  const h = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const s = tIdx(sx, sy); g[s] = 0; open.push([h(sx, sy), s]);
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let found = false, iter = 0;
  while (open.length && iter++ < 6000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [, cur] = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (closed[cur]) continue; closed[cur] = 1;
    const cx = cur % MAP, cy = (cur / MAP) | 0;
    if (cx === tx && cy === ty) { found = true; break; }
    for (const [dx, dy, cost] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (!ok(nx, ny)) continue;
      if (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy))) continue;
      const ni = tIdx(nx, ny); if (closed[ni]) continue;
      const t = World.tiles[ni];
      const ng = g[cur] + cost * (t === T.PATH || t === T.WOOD ? 0.9 : 1);
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; open.push([ng + h(nx, ny), ni]); }
    }
  }
  if (!found) return null;
  const path = []; let c = tIdx(tx, ty);
  while (c !== s && c >= 0) { path.push([c % MAP + 0.5, ((c / MAP) | 0) + 0.5]); c = came[c]; }
  return path.reverse();
}
