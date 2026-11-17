/* =====================================================================
   동백숲 다시 가꾸기
   · 마구 뭉쳐 있던 나무를 정리: 나무끼리 한 칸씩 띄우고, 군데군데 빽빽한 군락 · 탁 트인 빈터
   · 대부분 동백나무(겨울~봄 빨간 꽃, 떨어진 꽃잎) + 사이사이 일반 나무
   · 숲을 한 바퀴 도는 흙 오솔길, 길가 벤치 3곳, 「숲속 쉼터」(테이블 · 의자 · 등불 · 표지판)
   ===================================================================== */
const FOREST = { x0: 18, y0: 70, x1: 47, y1: 100 };
/* 오솔길 (꺾이는 점들) */
const FOREST_TRAILS = [
  [[33, 76], [28, 76], [24, 78], [23, 83], [24, 88], [28, 89], [33, 89]],   // 서쪽 고리
  [[24, 88], [24, 92], [26, 92]],                                            // 숲속 오래된 정자 입구 쪽
  [[35, 78], [40, 78], [44, 78], [47, 78]],                                  // 동쪽 오솔길
];
const FOREST_BENCHES = [
  { key: 'forestB1', name: '오솔길 벤치', seats: [[29, 75], [30, 75]] },
  { key: 'forestB2', name: '동백나무 아래 벤치', seats: [[21, 82], [22, 82]] },
  { key: 'forestB3', name: '숲길 벤치', seats: [[41, 77], [42, 77]] },
];
const FOREST_REST = { x: 28, y: 83 };   // 쉼터 가운데 (테이블)

function sprCamellia(v, season) {
  const c = mkCanvas(32, 44), g = c.getContext('2d'), cx = 16, by = 38;
  fillEllipse(g, cx, by, 9, 3, 'rgba(0,0,0,0.18)');
  g.fillStyle = '#7a5638'; g.fillRect(cx - 2, by - 11, 4, 11); g.fillStyle = '#5e412a'; g.fillRect(cx + 1, by - 11, 1, 11);
  const main = v % 2 ? '#2f6e42' : '#357a4a';
  const tall = v % 4 >= 2;   // 키 큰 것 · 동그란 것
  if (tall) { fillEllipse(g, cx, by - 17, 9, 8, shade(main, 0.75)); fillEllipse(g, cx, by - 25, 8, 8, shade(main, 0.85)); fillEllipse(g, cx - 1, by - 22, 9, 9, main); fillEllipse(g, cx - 3, by - 28, 4, 3, shade(main, 1.35)); }
  else { fillEllipse(g, cx, by - 18, 12, 9, shade(main, 0.75)); fillEllipse(g, cx - 1, by - 20, 11, 8, main); fillEllipse(g, cx - 4, by - 24, 5, 3, shade(main, 1.35)); }
  // 반짝이는 잎
  g.fillStyle = shade(main, 1.6); for (const [dx, dy] of [[-6, -19], [4, -23], [7, -16], [-2, -14]]) g.fillRect(cx + dx, by + dy, 1, 1);
  if (season === 'winter') { fillEllipse(g, cx - 1, by - (tall ? 32 : 27), 7, 2, '#ffffff'); }
  const bloom = season === 'winter' ? 7 : season === 'spring' ? 8 : season === 'autumn' ? 2 : 0;
  const spots = [[-7, -18], [5, -15], [-2, -25], [7, -22], [-5, -12], [2, -20], [-8, -23], [8, -17]];
  for (let i = 0; i < bloom; i++) { const [dx, dy] = spots[(i + v) % spots.length]; g.fillStyle = '#d9303e'; g.fillRect(cx + dx, by + dy, 2, 2); g.fillStyle = '#ff6b6b'; g.fillRect(cx + dx, by + dy, 1, 1); if (season !== 'autumn') { g.fillStyle = '#ffd34d'; g.fillRect(cx + dx + 1, by + dy + 1, 1, 1); } }
  // 바닥에 떨어진 동백꽃
  if (season === 'spring' || season === 'winter') { g.fillStyle = '#c92a36'; for (const [dx, dy] of [[-8, 0], [6, 1], [9, -1]].slice(0, 2 + (v % 2))) g.fillRect(cx + dx, by + dy, 2, 1); }
  autoOutline(c, '#1f3324');
  return { c, ax: 16, ay: 37 };
}
const _sprTreeForest = sprTree;
sprTree = function (kind, v, season) { if (kind === 'tree' && v >= 4) return sprCamellia(v, season); return _sprTreeForest(kind, v, season); };

function forestBuild() {
  const m = MAPS.island; if (!m) return;
  const W = m.W, F = FOREST, inF = (x, y) => x >= F.x0 && x <= F.x1 && y >= F.y0 && y <= F.y1;
  const setT = (x, y, t) => { if (inMap(x, y, m)) m.tiles[y * W + x] = t; };
  // 1) 숲 나무 전부 걷기
  m.objects = m.objects.filter(o => { if ((o.kind === 'tree' || o.kind === 'palm') && inF(o.x, o.y)) { m.block[o.y * W + o.x] = 0; return false; } return true; });
  // 2) 오솔길
  const trail = new Set();
  for (const line of FOREST_TRAILS) for (let i = 0; i < line.length - 1; i++) {
    const [ax, ay] = line[i], [bx, by] = line[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    let px = null, py = null;
    for (let k = 0; k <= n; k++) {
      const x = Math.round(ax + (bx - ax) * k / n), y = Math.round(ay + (by - ay) * k / n);
      if (px !== null && x !== px && y !== py) { const t = tileAt(px, y, m); if (t === T.GRASS || t === T.FLOWER) { setT(px, y, T.DIRT); trail.add(px + ',' + y); } }   // 대각선은 계단처럼 이어서 끊기지 않게
      const t = tileAt(x, y, m); if (t === T.GRASS || t === T.FLOWER) { setT(x, y, T.DIRT); trail.add(x + ',' + y); }
      px = x; py = y;
    }
  }
  const put = (kind, x, y, extra = {}) => { const o = Object.assign({ kind, x, y, solid: extra.solid !== false }, extra); m.objects.push(o); if (o.solid) m.block[y * W + x] = 1; if (tileAt(x, y, m) === T.DIRT) setT(x, y, T.GRASS); return o; };
  // 3) 벤치
  for (const B of FOREST_BENCHES) {
    const seats = B.seats, stand = seats.map(([x, y]) => [x, y + 1]);
    for (const [x, y] of [...seats, ...stand]) { m.objects = m.objects.filter(o => !(o.x === x && o.y === y && !o.water)); m.block[y * W + x] = 0; }
    for (const [x, y] of seats) put('bench', x, y, { bench: B.key });
    m.benches[B.key] = { name: B.name, place: 'forest', seats, stand, face: seats.map(() => 0), pairs: [[0, 1]] };
  }
  // 4) 숲속 쉼터: 둥근 빈터 + 테이블 · 의자 4 · 등불 2 · 표지판 · 꽃
  const R = FOREST_REST;
  for (let y = R.y - 3; y <= R.y + 3; y++) for (let x = R.x - 3; x <= R.x + 3; x++) if (Math.hypot(x - R.x, y - R.y) <= 3.2) { m.objects = m.objects.filter(o => !(o.x === x && o.y === y && !o.water)); m.block[y * W + x] = 0; const t = tileAt(x, y, m); if (t === T.GRASS || t === T.FLOWER) setT(x, y, Math.hypot(x - R.x, y - R.y) <= 2.2 ? T.DIRT : t); }
  put('campTable', R.x, R.y);
  const chairs = [[R.x - 1, R.y, 1], [R.x + 1, R.y, 3], [R.x, R.y - 1, 0], [R.x, R.y + 1, 2]];
  for (const [x, y, rot] of chairs) put('campChair', x, y, { rot, seatOf: 'forestRest' });
  put('lantern', R.x - 2, R.y - 2, { light: true }); put('lantern', R.x + 2, R.y + 2, { light: true });
  put('woodSign', R.x + 2, R.y - 2); put('flowerbed', R.x - 2, R.y + 2);
  m.benches.forestRest = { name: '숲속 쉼터', place: 'forest', seats: chairs.map(c => [c[0], c[1]]), stand: [[R.x - 2, R.y], [R.x + 2, R.y], [R.x, R.y - 2], [R.x, R.y + 2]], face: [1, 3, 0, 2], pairs: [[0, 1], [2, 3], [0, 2], [1, 3]] };
  for (const [x, y] of m.benches.forestRest.stand) m.block[y * W + x] = 0;
  POI.forestRest = [R.x + 0.5, R.y + 2.5];
  // 5) 나무: 한 칸씩 띄워 심되, 군락은 빽빽 · 빈터는 듬성
  const r = rng(7341);
  const nearTile = (x, y, d, f) => { for (let yy = y - d; yy <= y + d; yy++) for (let xx = x - d; xx <= x + d; xx++) if (f(xx, yy)) return true; return false; };
  const roadish = (x, y) => { const t = tileAt(x, y, m); return isRoadT(t) || t === T.DIRT || t === T.POND || t === T.WATER || t === T.SAND; };
  const keepOut = (x, y) => Object.values(m.benches).some(bk => [...bk.seats, ...bk.stand].some(p => Math.abs(p[0] - x) <= 1 && Math.abs(p[1] - y) <= 1))
    || Math.hypot(x - R.x, y - R.y) < 4.2 || Math.hypot(x - 36, y - 84) < 4 || (m.portals || []).some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1)
    || Math.abs(x - 34) <= 1 || Math.abs(y - 72) <= 1;
  const cells = []; for (let y = F.y0; y <= F.y1; y++) for (let x = F.x0; x <= F.x1; x++) cells.push([x, y]);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const trees = []; let n = 0;
  for (const [x, y] of cells) {
    const t = tileAt(x, y, m); if (t !== T.GRASS && t !== T.FLOWER) continue;
    if (m.block[y * W + x] || nearTile(x, y, 1, roadish) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inMap(x + a, y + b, m) && m.block[(y + b) * W + x + a]) || keepOut(x, y)) continue;
    if (trees.some(([a, b]) => { const dx = a - x, dy = b - y; return (Math.abs(dx) + Math.abs(dy) === 1) || (dx === dy && Math.abs(dx) === 1) || (dx === dy && Math.abs(dx) === 2 && r() < 0.5); })) continue;   // 옆 · 바로 위아래(같은 화면 줄)만 피하고 비스듬히는 허용
    const g = Math.sin(x * 0.42 + 1.3) + Math.cos(y * 0.37) + Math.sin((x + y) * 0.23);
    const p = g > 0.7 ? 0.95 : g > -0.4 ? 0.62 : 0.22;
    if (r() > p) continue;
    trees.push([x, y]);
  }
  for (const [x, y] of trees) { obj(m, 'tree', x, y, { v: r() < 0.82 ? 4 + (n % 4) : n % 4, forest: true }); n++; }
  // 들꽃 정리: 마구 흩어진 꽃 칸을 줄이고, 오솔길 가 · 쉼터 둘레에만 조금
  for (let y = F.y0; y <= F.y1; y++) for (let x = F.x0; x <= F.x1; x++) if (tileAt(x, y, m) === T.FLOWER && !nearTile(x, y, 1, (a, b) => tileAt(a, b, m) === T.DIRT) && r() < 0.75) setT(x, y, T.GRASS);
}
const _leisureBuildForest = leisureBuild;
leisureBuild = function () { _leisureBuildForest(); try { forestBuild(); } catch (e) { console.error('[forest]', e); } };
