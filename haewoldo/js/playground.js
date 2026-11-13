'use strict';
/* =========================================================
 *  해월도 놀이터 — 그네 · 시소 · 뺑뺑이 · 모래놀이터 · 벤치
 *  아이들이 자주 오고, 할머니들도 그네에 앉거나 벤치에서 손주 구경하며 수다
 *  + 풀밭 위에 놓여 있던 배를 바다로 옮김
 * ========================================================= */
const PG = { x: 106, y: 69 };            // 놀이터 왼쪽 위 기준
G.merry = { ang: 0, spd: 0 };

/* ---------------- 스프라이트 ---------------- */
function pgSwing(occ) {
  const post = (u) => [_blk(u, 0.1, u + 0.12, 0.22, 0, 36, '#e3615a', '#c9484a', '#b33c3e'), _blk(u, 0.78, u + 0.12, 0.9, 0, 36, '#e3615a', '#c9484a', '#b33c3e')];
  return blockSprite([...post(0.02), ...post(1.86), _blk(0.02, 0.44, 1.98, 0.56, 34, 38, '#f2d06a', '#d9b44f', '#c49f3f')], 2, 1, 0, (g, P) => {
    [0.5, 1.5].forEach((u, i) => {
      if (occ[i]) return;
      const top1 = P(u - 0.18, 0.5, 34), top2 = P(u + 0.18, 0.5, 34), b1 = P(u - 0.18, 0.5, 9), b2 = P(u + 0.18, 0.5, 9);
      g.fillStyle = '#7a7e88'; for (const [a, b] of [[top1, b1], [top2, b2]]) for (let k = 0; k <= 24; k++) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * k / 24), Math.round(a[1] + (b[1] - a[1]) * k / 24), 1, 1);
      fillPoly(g, [P(u - 0.24, 0.38, 9), P(u + 0.24, 0.38, 9), P(u + 0.24, 0.62, 9), P(u - 0.24, 0.62, 9)], '#3f6fb5');
      fillPoly(g, [P(u - 0.24, 0.62, 9), P(u + 0.24, 0.62, 9), P(u + 0.24, 0.62, 7), P(u - 0.24, 0.62, 7)], '#2f5a9a');
    });
  });
}
function pgSeesaw(tilt) {
  return blockSprite([_blk(1.35, 0.35, 1.65, 0.65, 0, 7, '#5b5f69', '#4c4f58', '#41444c')], 3, 1, 0, (g, P) => {
    const zl = 7 - tilt * 6, zr = 7 + tilt * 6;
    fillPoly(g, [P(0.1, 0.38, zl + 2), P(2.9, 0.38, zr + 2), P(2.9, 0.62, zr + 2), P(0.1, 0.62, zl + 2)], '#f2d06a');
    fillPoly(g, [P(0.1, 0.62, zl + 2), P(2.9, 0.62, zr + 2), P(2.9, 0.62, zr), P(0.1, 0.62, zl)], '#d9b44f');
    for (const [u, z] of [[0.35, zl], [2.65, zr]]) { const a = P(u, 0.5, z + 2), b = P(u, 0.5, z + 9); g.fillStyle = '#e3615a'; for (let k = 0; k <= 7; k++) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * k / 7), Math.round(a[1] + (b[1] - a[1]) * k / 7), 2, 1); g.fillRect(b[0] - 3, b[1], 7, 2); }
  });
}
function pgMerry(step) {
  return blockSprite([_blk(0.85, 0.85, 1.15, 1.15, 0, 4, '#5b5f69')], 2, 2, 0, (g, P) => {
    const c = P(1, 1, 5), cols = ['#e3615a', '#f2d06a', '#5aa880', '#3f6fb5'];
    for (let i = 0; i < 4; i++) {
      const a0 = step * Math.PI / 8 + i * Math.PI / 2, a1 = a0 + Math.PI / 2, pts = [c];
      for (let k = 0; k <= 6; k++) { const a = a0 + (a1 - a0) * k / 6; pts.push(P(1 + Math.cos(a) * 0.95, 1 + Math.sin(a) * 0.95, 5)); }
      fillPoly(g, pts, cols[i]);
    }
    for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI * 2; const p = P(1 + Math.cos(a) * 0.95, 1 + Math.sin(a) * 0.95, 5); g.fillStyle = '#ffffff'; g.fillRect(p[0], p[1], 1, 1); }
    for (let i = 0; i < 4; i++) { const a = step * Math.PI / 8 + i * Math.PI / 2 + Math.PI / 4, b = P(1 + Math.cos(a) * 0.6, 1 + Math.sin(a) * 0.6, 5), t = P(1 + Math.cos(a) * 0.6, 1 + Math.sin(a) * 0.6, 15); g.fillStyle = '#7a7e88'; for (let k = 0; k <= 10; k++) g.fillRect(b[0], Math.round(b[1] + (t[1] - b[1]) * k / 10), 1, 1); g.fillRect(t[0] - 2, t[1], 5, 1); }
    const top = P(1, 1, 18); g.fillStyle = '#7a7e88'; for (let y = 0; y < 13; y++) g.fillRect(c[0], c[1] - y, 1, 1); fillEllipse(g, top[0], top[1], 4, 2, '#f19ab5');
  });
}
function pgSandbox() {
  return blockSprite([_blk(0.05, 0.05, 1.95, 0.2, 0, 4, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.05, 1.8, 1.95, 1.95, 0, 4, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.05, 0.2, 0.2, 1.8, 0, 4, '#c99a64', '#a87a4a', '#8a5f38'), _blk(1.8, 0.2, 1.95, 1.8, 0, 4, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.2, 0.2, 1.8, 1.8, 0, 2, '#f1dca6', '#e2c98f', '#d4b97a'), _blk(0.6, 0.6, 1.0, 0.95, 2, 7, '#e3615a', '#c9484a', '#b33c3e'), _blk(0.62, 0.62, 0.98, 0.93, 7, 7.5, '#f1dca6'), _blk(1.2, 1.1, 1.5, 1.2, 2, 3, '#3f6fb5'), _blk(1.0, 1.35, 1.4, 1.6, 2, 4, '#e2c98f')], 2, 2, 0);
}
function pgSign() {
  return blockSprite([_blk(0.2, 0.47, 0.28, 0.53, 0, 18, '#7a5236'), _blk(0.72, 0.47, 0.8, 0.53, 0, 18, '#7a5236'), _blk(0.08, 0.45, 0.92, 0.55, 14, 26, '#8fd6b8', '#74bfa0', '#5faa8b')], 1, 1, 0, (g, P) => { const a = P(0.5, 0.55, 21); g.fillStyle = '#ffffff'; g.fillRect(a[0] - 6, a[1] - 3, 12, 1); g.fillStyle = '#e3615a'; fillEllipse(g, a[0] - 3, a[1] + 1, 1, 1, '#e3615a'); g.fillStyle = '#f2d06a'; g.fillRect(a[0] + 1, a[1], 3, 2); });
}
const _objSpritePG = objSprite;
objSprite = function (o) {
  if (o.kind === 'swingSet') { const occ = [0, 1].map(i => seatOwner('island', 'swing', i) ? 1 : 0), key = 'PGsw' + occ.join(''); return R.objSpr[key] || (R.objSpr[key] = pgSwing(occ)); }
  if (o.kind === 'seesaw') { const tl = seesawTilt(), f = tl > 0.35 ? 1 : tl < -0.35 ? -1 : 0, key = 'PGss' + f; return R.objSpr[key] || (R.objSpr[key] = pgSeesaw(f)); }
  if (o.kind === 'merry') { const st = ((Math.floor(G.merry.ang / (Math.PI / 8)) % 4) + 4) % 4, key = 'PGmr' + st; return R.objSpr[key] || (R.objSpr[key] = pgMerry(st)); }
  if (o.kind === 'sandbox') return R.objSpr.PGsb || (R.objSpr.PGsb = pgSandbox());
  if (o.kind === 'playSign') return R.objSpr.PGsg || (R.objSpr.PGsg = pgSign());
  return _objSpritePG(o);
};
function seesawTilt() {
  const a = seatOwner('island', 'seesaw', 0), b = seatOwner('island', 'seesaw', 1);
  if (a && b) return Math.sin(G.t * 2.2);
  if (a) return -1; if (b) return 1; return 0;
}

/* ---------------- 지도에 배치 ---------------- */
function playgroundBuild() {
  const m = MAPS.island, W = m.W, X = PG.x, Y = PG.y;
  const setT = (x, y, t) => { if (inMap(x, y, m)) m.tiles[y * W + x] = t; };
  const put = (kind, x, y, extra = {}) => { const o = Object.assign({ kind, x, y, solid: extra.solid !== false }, extra); m.objects.push(o); if (o.solid) for (let yy = y; yy < y + (o.fh || 1); yy++) for (let xx = x; xx < x + (o.fw || 1); xx++) m.block[yy * W + xx] = 1; return o; };
  // 풀밭 위의 배 → 가장 가까운 바다로
  for (const o of m.objects) if (o.kind === 'boat' && tileAt(o.x, o.y, m) !== T.WATER) {
    let best = null, bd = 1e9;
    for (let y = o.y - 8; y <= o.y + 8; y++) for (let x = o.x - 8; x <= o.x + 8; x++) {
      if (tileAt(x, y, m) !== T.WATER) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => tileAt(x + a, y + b, m) !== T.WATER);
      const clash = m.objects.some(q => q !== o && q.kind === 'boat' && Math.abs(q.x - x) + Math.abs(q.y - y) < 3);
      const d = Math.hypot(x - o.x, y - o.y) + (near ? 0 : 3);
      if (!clash && d < bd) { bd = d; best = [x, y]; }
    }
    if (best) { o.x = best[0]; o.y = best[1]; }
  }
  // 놀이터 자리 정리
  m.objects = m.objects.filter(o => { const inn = o.x >= X - 2 && o.x <= X + 11 && o.y >= Y - 2 && o.y <= Y + 11 && !o.water; if (inn) m.block[o.y * W + o.x] = 0; return !inn; });
  for (let y = Y - 2; y <= Y + 11; y++) for (let x = X - 2; x <= X + 11; x++) if (tileAt(x, y, m) !== T.WATER && !isRoadT(tileAt(x, y, m))) setT(x, y, T.GRASS);
  // 큰길에서 출입구(왼쪽)까지 흙길, 벤치 앞 보행로, 놀이 공간은 모래 바닥
  let rx = X - 2; while (rx > X - 22 && !isRoadT(tileAt(rx, Y + 5, m))) { setT(rx, Y + 5, T.DIRT); rx--; }
  for (let x = X - 1; x <= X + 9; x++) setT(x, Y + 1, T.DIRT);
  for (let y = Y + 2; y <= Y + 9; y++) setT(X - 1, y, y >= Y + 4 && y <= Y + 6 ? T.DIRT : T.GRASS);
  for (let y = Y + 2; y <= Y + 9; y++) for (let x = X; x <= X + 9; x++) { const corner = (x === X || x === X + 9) && (y === Y + 2 || y === Y + 9); setT(x, y, corner ? T.GRASS : T.SAND); }
  for (const [x, y] of [[X + 10, Y + 1], [X - 1, Y + 9], [X + 10, Y + 9], [X + 4, Y - 1], [X + 9, Y - 1]]) setT(x, y, T.FLOWER);
  // 놀이기구 — 서로 한 칸 이상 떨어지게
  put('swingSet', X + 1, Y + 3, { fw: 2, fh: 1 });
  put('slide', X + 5, Y + 3, { fw: 1, fh: 3 });
  put('springRider', X + 8, Y + 3);
  put('seesaw', X + 1, Y + 7, { fw: 3, fh: 1 });
  put('merry', X + 6, Y + 7, { fw: 2, fh: 2 });
  // 벤치는 놀이기구를 바라보게(앞쪽 보행로), 뒤에는 화단과 나무
  put('bench', X + 1, Y, { bench: 'pgBench' }); put('bench', X + 2, Y, { bench: 'pgBench' });
  put('bench', X + 6, Y, { bench: 'pgBench2' }); put('bench', X + 7, Y, { bench: 'pgBench2' });
  put('lamp', X + 4, Y, { light: true });
  put('flowerbed', X + 1, Y - 1); put('flowerbed', X + 2, Y - 1); put('flowerbed', X + 6, Y - 1); put('flowerbed', X + 7, Y - 1);
  put('tree', X - 1, Y - 1, { v: 1 }); put('tree', X + 9, Y - 2, { v: 2 }); put('tree', X + 11, Y + 6, { v: 0 }); put('bush', X + 10, Y + 10);
  put('playSign', X - 2, Y + 3);
  // 울타리 — 출입구(왼쪽 가운데)와 보행로 쪽은 열어 둠
  for (let y = Y + 2; y <= Y + 10; y++) { if (y < Y + 4 || y > Y + 6) put('fence2', X - 1, y); put('fence2', X + 10, y); }
  for (let x = X; x <= X + 9; x++) put('fence2', x, Y + 10);
  // 좌석 (그네 2 · 미끄럼틀 · 흔들말 · 시소 2 · 뺑뺑이 3 · 벤치 2+2)
  const B = m.benches;
  B.swing = { name: '그네', place: 'playground', leisure: 'swing', play: 'swing', seats: [[X + 1, Y + 3], [X + 2, Y + 3]], stand: [[X + 1, Y + 4], [X + 2, Y + 4]], face: [0, 0], pairs: [[0, 1]] };
  B.slide = { name: '미끄럼틀', place: 'playground', leisure: 'slide', play: 'slide', seats: [[X + 5, Y + 3]], stand: [[X + 5, Y + 2]], exit: [X + 5, Y + 6], face: [0], pairs: [] };
  B.spring = { name: '흔들말', place: 'playground', leisure: 'spring', play: 'spring', seats: [[X + 8, Y + 3]], stand: [[X + 8, Y + 4]], face: [0], pairs: [] };
  B.seesaw = { name: '시소', place: 'playground', leisure: 'seesaw', play: 'seesaw', seats: [[X + 1, Y + 7], [X + 3, Y + 7]], stand: [[X + 1, Y + 8], [X + 3, Y + 8]], face: [1, 3], pairs: [[0, 1]] };
  B.merry = { name: '뺑뺑이', place: 'playground', leisure: 'merry', play: 'merry', center: [X + 7, Y + 8], seats: [[X + 6, Y + 7], [X + 7, Y + 7], [X + 6, Y + 8]], stand: [[X + 6, Y + 6], [X + 7, Y + 6], [X + 5, Y + 8]], face: [0, 0, 0], pairs: [[0, 1], [1, 2]] };
  B.pgBench = { name: '놀이터 벤치', place: 'playground', leisure: 'park', seats: [[X + 1, Y], [X + 2, Y]], stand: [[X + 1, Y + 1], [X + 2, Y + 1]], face: [0, 0], pairs: [[0, 1]] };
  B.pgBench2 = { name: '놀이터 벤치', place: 'playground', leisure: 'park', seats: [[X + 6, Y], [X + 7, Y]], stand: [[X + 6, Y + 1], [X + 7, Y + 1]], face: [0, 0], pairs: [[0, 1]] };
  for (const k of ['swing', 'slide', 'spring', 'seesaw', 'merry', 'pgBench', 'pgBench2']) for (const s of B[k].stand) m.block[s[1] * W + s[0]] = 0;
  m.block[(Y + 6) * W + X + 5] = 0;
  POI.playground = [X + 4.5, Y + 5.5]; POI.playgroundGate = [X - 1.5, Y + 5.5];
  m.places.playground = { name: '해월 놀이터', test: (x, y) => x >= X - 2 && x <= X + 11 && y >= Y - 1 && y <= Y + 11 }; PLACE_DEFS.playground = { name: '해월 놀이터' };
  m.order = ['playground', ...m.order.filter(k => k !== 'playground')];
}
const _buildWorldPG = buildWorld;
buildWorld = function () { _buildWorldPG(); playgroundBuild(); };

/* ---------------- 움직임: 그네 흔들기 · 시소 · 뺑뺑이 회전 ---------------- */
G.swingPush = {};
function playOffset(a) {
  if (!a.seat || a.map !== 'island') return null;
  const bk = MAPS.island.benches[a.seat.bench]; if (!bk || !bk.play) return null;
  if (bk.play === 'swing') { const amp = Math.min(0.55, 0.28 + (G.swingPush[a.id] || 0)); const s = Math.sin(G.t * 2.6 + a.seat.idx * 1.7) * amp; return { dx: -s * 16, dy: s * 8 - Math.abs(s) * 5, swing: true }; }
  if (bk.play === 'seesaw') { const tl = seesawTilt(), up = a.seat.idx === 0 ? -tl : tl; return { dx: 0, dy: -up * 6 }; }
  if (bk.play === 'merry') {
    const [cx, cy] = bk.center, n = bk.seats.length, ang = G.merry.ang + a.seat.idx * Math.PI * 2 / n;
    const wx = cx + Math.cos(ang) * 0.62, wy = cy + Math.sin(ang) * 0.62, [px, py] = iso(wx, wy), [sx, sy] = iso(a.x, a.y);
    a._merryD = wx + wy + 0.6; return { dx: px - sx, dy: py - sy - 3 };
  }
  return null;
}
const _drawActorPG = drawActor;
drawActor = function (g, a, sx, sy) {
  const off = !a.pet && playOffset(a);
  if (!off) return _drawActorPG(g, a, sx, sy);
  const ox = a.ox, oy = a.oy; a.ox = (ox || 0) + off.dx; a.oy = (oy || 0) + off.dy;
  _drawActorPG(g, a, sx, sy);
  if (off.swing) {
    const seat = MAPS.island.benches.swing.seats[a.seat.idx], [tx, ty] = iso(seat[0] + 0.5, seat[1] + 0.5);
    g.fillStyle = '#7a7e88';
    for (const dx of [-4, 4]) { const x0 = SX(tx + dx), y0 = SY(ty - 34), x1 = SX(sx + a.ox + dx), y1 = SY(sy + a.oy - 14); const n = 18; for (let k = 0; k <= n; k++) g.fillRect(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), Math.max(1, R.K * 0.6), Math.max(1, R.K * 0.6)); }
  }
  a.ox = ox; a.oy = oy;
};
const _seatDepthPG = seatDepth;
seatDepth = function (a, m) { const bk = m.benches[a.seat.bench]; if (bk && bk.play === 'merry' && a._merryD != null) return a._merryD; return _seatDepthPG(a, m); };
let _pgT = 0;
const _loopPG = loop;
loop = function (ts) {
  const dt = 1 / 60;
  if (G.started && S) {
    const riders = MAPS.island.benches.merry ? [0, 1, 2].filter(i => seatOwner('island', 'merry', i)).length : 0;
    const target = riders ? 1.3 : 0; G.merry.spd += ((G.merry.boost ? 3.2 : target) - G.merry.spd) * dt * 0.8; if (G.merry.boost) G.merry.boost = Math.max(0, G.merry.boost - dt); G.merry.ang += G.merry.spd * dt;
    for (const k of Object.keys(G.swingPush)) { G.swingPush[k] = Math.max(0, G.swingPush[k] - dt * 0.04); if (!G.swingPush[k]) delete G.swingPush[k]; }
    if (!paused()) { _pgT += dt; if (_pgT > 2) { _pgT = 0; playgroundTick(); } }
  }
  _loopPG(ts);
};

/* ---------------- 플레이어 행동 ---------------- */
const _leisureMenuPG = leisureMenu;
leisureMenu = function (k) {
  const bk = M.benches[k]; if (!bk || !['swing', 'seesaw', 'merry', 'park'].includes(bk.leisure)) return _leisureMenuPG(k);
  if (rainy()) { toast('🌧 비가 와서 놀이기구가 미끄러워요. 맑은 날 놀아요'); return; }
  const P = G.player, seated = P.seat && P.seat.bench === k, det = detNearby(), st = S.rel.stage, items = [];
  const add = (icon, label, fn, ok = true, why) => items.push({ icon, label, onClick: fn, disabled: !ok, why });
  const name = { swing: '그네 타기', seesaw: '시소 타기', merry: '뺑뺑이 타기', park: '벤치에 앉기' }[bk.leisure];
  if (!seated) add({ swing: '🎠', seesaw: '⚖️', merry: '🌀', park: '🪑' }[bk.leisure], name, () => leisureSit(k), freeSeats(k, M.id).length > 0, '자리가 다 찼어요');
  else add('🧍', '내리기', () => standUpPlayer());
  if (!seated && det && st >= 2) add('💞', bk.leisure === 'seesaw' ? '형사님과 시소' : '형사님과 함께', () => playTogether(k), !!freePair(k, M.id), '같이 탈 자리가 없어요');
  if (bk.leisure === 'swing') {
    if (seated) add('⬆️', '더 높이 구르기', () => { G.swingPush[P.id] = 0.25; Sound.sfx('tap'); toast('슝— 바람이 시원해요!'); });
    const other = G.actors.find(a => a !== P && a.seat && a.seat.bench === 'swing' && a.map === M.id);
    if (other && !seated) add('🙌', `${other === G.det ? himCall() : other.look.name.split(' ').pop()} 밀어주기`, () => pushSwing(other));
  }
  if (bk.leisure === 'merry') add('💫', '뺑뺑이 돌리기', () => spinMerry());
  if (bk.leisure === 'seesaw' && seated) { const other = G.actors.find(a => a !== P && a.seat && a.seat.bench === 'seesaw' && a.map === M.id); if (!other) add('🤷', '반대편이 비었어요', () => toast('형사님이나 아이들이 반대편에 앉으면 시소가 움직여요'), true); }
  if (bk.leisure === 'park') { add('😌', '쉬기', () => leisureAct(k, 'rest')); add('👀', '아이들 구경', () => watchKids()); }
  const npc = G.actors.find(a => a !== P && a !== G.det && a.seat && a.seat.bench === k && a.map === M.id && !a.pet);
  if (npc) add('💬', `${npc.look.name.split(' ').pop()}와 이야기`, () => interactWith(npc));
  openSheet({ title: `해월 놀이터 · ${bk.name}`, sub: '<div class="relneed">아이들이 좋아하는 놀이터. 할머니들은 벤치에서 손주 구경을 하세요.</div>', items, cols: 3 });
};
async function playTogether(k) {
  await leisureSitTogether(k);
  const bk = M.benches[k], c = casualOn(), st = S.rel.stage;
  const L = { swing: c ? ['그네 진짜 오랜만이다. 어릴 때 이거 엄청 탔는데.', '누가 더 높이 가나 내기할래? 하하.'] : ['그네 정말 오랜만이네요. 어릴 때 많이 탔는데.', '누가 더 높이 가나 내기할까요? 하하.'], seesaw: c ? ['어이쿠, 내가 무거워서 너 계속 위에 있겠다.', '하하, 꽉 잡아! 올라간다~'] : ['어이쿠, 제가 무거워서 계속 위에 계시겠네요.', '하하, 꽉 잡으세요!'], merry: c ? ['어지러워도 나 탓하기 없기다?', '하하, 세상이 빙글빙글 돈다!'] : ['어지러워도 제 탓 하기 없기예요?', '하하, 세상이 빙글빙글 도네요!'], park: c ? ['애들 노는 거 보니까 마음이 편해지네.'] : ['아이들 노는 거 보니까 마음이 편해지네요.'] }[bk.leisure];
  if (bk.leisure === 'merry') G.merry.boost = 2;
  await runEvent(async () => { G.det.lookAt(G.player); await say('det', 'laugh', pick(L)); if (st >= 5 && bk.leisure === 'swing') await say('det', 'blush', '…이렇게 나란히 흔들리니까 좋다. 박자 맞춰 봐.'); if (!S.leisure.mem.firstPlayground) { S.leisure.mem.firstPlayground = { day: S.day, date: dateLabel() }; memPerm('firstPlayground', { name: '놀이터에서' }); await addAlbum('놀이터에서', 'date'); } addAff(2); });
}
function pushSwing(a) {
  G.swingPush[a.id] = 0.27; Sound.sfx('tap'); burst(a, 'spark', 2);
  runEvent(async () => {
    if (a === G.det) await say('det', 'laugh', casualOn() ? '어어, 너무 세! 하하, 무섭다고!' : '어어, 너무 세요! 하하!');
    else if (a.look.kid) a.say(pick(['꺄하하! 더 높이요!', '와아! 하늘 닿겠다!']), 3);
    else a.say(pick(['아이고, 할미 날아가겠네!', '호호, 살살해~']), 3);
    if (a.vid && !S.rel.daily['push_' + a.vid]) { S.rel.daily['push_' + a.vid] = true; S.rep += 1; }
  });
}
function spinMerry() { G.merry.boost = 2.5; Sound.sfx('tap'); toast('🌀 빙글빙글!'); const rid = G.actors.filter(a => a.seat && a.seat.bench === 'merry' && a.map === 'island'); for (const a of rid) if (a !== G.player) a.say(a.look.kid ? pick(['꺄아~!', '어지러워요!']) : '어이쿠!', 2); }
function watchKids() {
  runEvent(async () => {
    const kids = G.villagers.filter(v => v.look.kid && v.seat && MAPS.island.benches[v.seat.bench] && MAPS.island.benches[v.seat.bench].play);
    await say('narr', '', kids.length ? `${kids.map(k => k.look.name.split(' ').pop()).join('·')}(이)가 신나게 놀고 있다. 웃음소리가 놀이터에 가득하다.` : '지금은 놀이터가 조용하다. 아이들은 학교가 끝나면 우르르 몰려온다.');
    const gm = G.villagers.find(v => (v.id === 'halmeoni' || v.id === 'okja') && v.seat && v.seat.bench.startsWith('pgBench'));
    if (gm) await say(gm.id, 'smile', pick(['애들 노는 거 보면 시간 가는 줄 몰라.', '우리 손주도 저만할 때가 엊그제 같은데~']));
    advanceTime(20);
  });
}

/* ---------------- 주민: 아이들 · 할머니들 · 가끔 어른들 ---------------- */
LEISURE_PLANS.push(
  { h: [13, 14.6], who: ['kid', 'kid2'], b: 'swing', act: 'play' }, { h: [14.6, 15.8], who: ['kid', 'kid2'], b: 'seesaw', act: 'play' }, { h: [15.8, 17.2], who: ['kid', 'kid2'], b: 'merry', act: 'play' }, { h: [17.2, 18.6], who: ['kid'], b: 'swing', act: 'play' },
  { h: [13.5, 17.5], who: ['halmeoni', 'okja'], b: 'pgBench', act: 'watch' }, { h: [10, 12], who: ['halmeoni'], b: 'swing', act: 'rest' }, { h: [16, 18], who: ['okja'], b: 'swing', act: 'rest' },
  { h: [9, 11.5], who: ['grandpa'], b: 'pgBench2', act: 'watch' }, { h: [10, 12.5], who: ['tourist', 'tourist2'], b: 'swing', act: 'couple' }, { h: [18, 19.5], who: ['farmer', 'rancher'], b: 'pgBench2', act: 'couple' },
);
// 아이들 놀이 계획이 먼저 잡히도록 앞쪽으로
LEISURE_PLANS.sort((a, b) => (b.act === 'play') - (a.act === 'play'));
Object.assign(LEIS_TALK, { play: ['더 높이! 더 높이!', '꺄하하!', '내 차례야!', '빙글빙글~', '형님 나 좀 밀어 줘!'], watch: ['아이고, 우리 손주 잘 탄다~', '조심해, 떨어질라!', '애들 노는 거 보면 시간 가는 줄 몰라.', '저 집 손녀가 벌써 저렇게 컸어.'] });
function playgroundTick() {
  // 아이들이 놀 때 뺑뺑이는 스스로 돌리고, 할머니는 손주 응원
  const kidsOnMerry = G.villagers.some(v => v.look.kid && v.seat && v.seat.bench === 'merry');
  if (kidsOnMerry && Math.random() < 0.3) G.merry.boost = 1.5;
  for (const v of G.villagers) if (v.look.kid && v.seat && v.seat.bench === 'swing' && Math.random() < 0.2) G.swingPush[v.id] = 0.22;
}
/* 형사님도 퇴근길에 가끔 그네에 */
const _detRestTickPG = detRestTick;
detRestTick = function () {
  const d = G.det;
  if (!G.busy && !S.comp && d.state === 'sched' && !G.detAuto && d.map === 'island' && d.visible && S.rel.flags.met && !rainy() && detPlan(S.min).k === 'stroll' && S.surp.swingDay !== S.day && Math.random() < 0.03) {
    const f = freeSeats('swing'); if (f.length) { S.surp.swingDay = S.day; S.surp.restDay = S.day; G.detAuto = { kind: 'rest', b: 'swing', i: f[0], t: 0, phase: 'go', target: MAPS.island.benches.swing.stand[f[0]].map(v => v + 0.5) }; G.seatOcc[seatKey('island', 'swing', f[0])] = 'det'; d.stop(); d.walkTo(...G.detAuto.target); return; }
  }
  _detRestTickPG();
};
