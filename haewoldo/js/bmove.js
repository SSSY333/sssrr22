/* =====================================================================
   건물 옮기기 — 섬 편집 「👆 선택」에서 건물을 누른 채 끌어 놓으면 통째로 이동
   · 문 · 입구 근처 이동 지점(주민 · 형사님이 가는 곳)도 함께 이동, 충돌 칸 다시 계산
   · 물 · 다른 건물 · 막힌 칸 위에는 못 놓고, 문 앞까지 길이 이어지는지 검사
   · 편집 데이터(DEVDATA.maps.island.bmove)에 저장 · 되돌리기 · 원래 자리 복원 가능
   ===================================================================== */
/* 건물 목록(BUILDINGS)은 다시 지어도 같은 물건을 쓰므로, 옮긴 값이 쌓이지 않게 매번 원래 자리로 되돌린 뒤 옮김 */
let _bmPrevPOI = {};
function bmMoves() { const md = DEVDATA.maps.island; return (md && md.bmove) || {}; }
function bmRestore() {
  for (const b of BUILDINGS) {
    if (!b._o) { b._o = { x: b.x, y: b.y, door: b.doorTile ? b.doorTile.slice() : null, extra: b.extra }; continue; }
    b.x = b._o.x; b.y = b._o.y; b.doorTile = b._o.door ? b._o.door.slice() : undefined; b.extra = b._o.extra; b._extraMoved = false; b.moved = false;
  }
  for (const [k, v] of Object.entries(_bmPrevPOI)) POI[k] = v.slice();
  _bmPrevPOI = {};
}
function bmApply(m) {
  const mv = (DEVDATA.maps[m.id] || {}).bmove; if (!mv || m.id !== 'island') return;
  const W = m.W, P0 = {};
  for (const [k, p] of Object.entries(POI)) if (Array.isArray(p) && typeof p[0] === 'number') P0[k] = p.slice();
  for (const [id, [dx, dy]] of Object.entries(mv)) {
    const b = m.buildings.find(x => x.id === id); if (!b || (!dx && !dy)) continue;
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (inMap(x, y, m)) m.block[y * W + x] = 0;
    const [ox, oy] = b.doorTile;
    for (const [k, p] of Object.entries(P0)) { if (_bmPrevPOI[k]) continue; if (Math.hypot(p[0] - ox - 0.5, p[1] - oy - 0.5) < 2.2 || (p[0] >= b.x - 0.5 && p[0] <= b.x + b.w + 0.5 && p[1] >= b.y - 0.5 && p[1] <= b.y + b.h + 0.5)) { _bmPrevPOI[k] = p.slice(); POI[k] = [p[0] + dx, p[1] + dy]; } }
    b.x += dx; b.y += dy; b.doorTile = [ox + dx, oy + dy]; b.moved = true;
    if (typeof b.extra === 'function' && !b._extraMoved) { const f = b.extra; b.extra = (g, S2, E) => f(g, S2, (x, y) => E(x + dx, y + dy)); b._extraMoved = true; }
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (inMap(x, y, m)) { if (tileAt(x, y, m) === T.WATER) m.tiles[y * W + x] = T.SAND; m.block[y * W + x] = 1; }
    // 새 문 앞이 물이면 모래로
    const [nx, ny] = b.doorTile; if (inMap(nx, ny, m) && tileAt(nx, ny, m) === T.WATER) m.tiles[ny * W + nx] = T.SAND;
  }
  if (m === MAPS.island) m.boatSpot = POI.boatSpot;
}
/* 건물 그림은 위치까지 미리 그려 두므로(캐시) 옮기거나 되돌릴 때마다 그 건물 그림을 지움 */
function bmClearSprites() { if (typeof _bldCache !== 'undefined') _bldCache.clear(); }
const _devApplyMapBM = devApplyMap;
devApplyMap = function (m, md) { try { if (m.id === 'island') bmClearSprites(); bmApply(m); } catch (e) { console.error('[bmove]', e); } return _devApplyMapBM(m, md); };
const _devHasEditsBM = devHasEdits;
devHasEdits = function (d = DEVDATA) { return _devHasEditsBM(d) || Object.values(d.maps).some(md => md.bmove && Object.keys(md.bmove).length); };

/* 놓을 수 있는지 검사: 새 발자국 칸이 맵 안 · 물 아님 · 다른 건물 아님 · 다른 물건 없음, 문 앞이 걸어갈 수 있고 광장과 이어짐 */
function bmCheck(b, dx, dy) {
  const m = MAPS.island, W = m.W, why = [];
  const own = (x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
  for (let y = b.y + dy; y < b.y + dy + b.h; y++) for (let x = b.x + dx; x < b.x + dx + b.w; x++) {
    if (!inMap(x, y, m) || x <= 1 || y <= 1 || x >= m.W - 2 || y >= m.H - 2) { why.push('맵 가장자리'); continue; }
    if (tileAt(x, y, m) === T.WATER) why.push('물 위');
    if (m.buildings.some(o => o !== b && x >= o.x - 0 && x < o.x + o.w && y >= o.y && y < o.y + o.h)) why.push('다른 건물과 겹침');
    if (m.buildings.some(o => o !== b && o.doorTile[0] === x && o.doorTile[1] === y)) why.push('다른 건물 문 앞');
    if (!own(x, y) && m.block[y * W + x]) why.push('나무 · 물건이 있음');
  }
  const [nx, ny] = [b.doorTile[0] + dx, b.doorTile[1] + dy];
  if (!inMap(nx, ny, m) || (m.block[ny * W + nx] && !own(nx, ny))) why.push('문 앞이 막힘');
  if (!why.length) {
    // 임시로 막아 보고 광장에서 문 앞까지 갈 수 있는지
    const save = m.block.slice();
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) m.block[y * W + x] = 0;
    for (let y = b.y + dy; y < b.y + dy + b.h; y++) for (let x = b.x + dx; x < b.x + dx + b.w; x++) m.block[y * W + x] = 1;
    m.block[ny * W + nx] = 0;
    const pz = P_('plaza'), px = Math.floor(pz[0]), py = Math.floor(pz[1]), seen = devReach(m, px, py);
    const tmp = m.block; m.block = save; const seen0 = devReach(m, px, py); m.block = tmp;
    const near = (sn, x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, c]) => inMap(x + a, y + c, m) && sn[(y + c) * W + x + a]);
    const ok = near(seen, nx, ny);
    const lost = m.buildings.filter(o => o !== b && o.doorTile && near(seen0, ...o.doorTile) && !near(seen, ...o.doorTile)).map(o => o.name);
    m.block = save;
    if (!ok) why.push('문까지 이어지는 길이 없음');
    if (lost.length && lost.length < 4) why.push('다른 건물 문을 막음: ' + lost.join(', '));
  }
  return [...new Set(why)];
}
function bmAt(x, y) { return M.id === 'island' ? M.buildings.find(b => x >= b.x - 0.5 && x < b.x + b.w + 0.5 && y >= b.y - 0.5 && y < b.y + b.h + 0.5) || M.buildings.find(b => b.doorTile[0] === x && b.doorTile[1] === y) : null; }
function bmTap(x, y) {
  const d = G.dev;
  if (M.id !== 'island') { toast('건물은 섬에서만 옮길 수 있어요'); return; }
  if (!d.bsel) {
    const b = bmAt(x, y); if (!b) { devInfo('🏠 옮길 건물을 눌러요'); return; }
    d.bsel = b.id; devInfo(`🏠 ${b.name} 선택 — 새 「문 앞」 자리를 눌러요 (같은 건물을 다시 누르면 메뉴)`); return;
  }
  const b = M.buildings.find(o => o.id === d.bsel); if (!b) { d.bsel = null; return; }
  if (bmAt(x, y) === b) {
    openSheet({ title: `🏠 ${b.name}`, cols: 3, items: [
      { icon: '↩', label: '원래 자리로', onClick: () => { devCommit(() => { const md = devMap('island'); if (md.bmove) delete md.bmove[b.id]; }, `🏠 ${josa(b.name, '을', '를')} 원래 자리로 돌렸어요`); d.bsel = null; } },
      { icon: '✋', label: '선택 취소', onClick: () => { d.bsel = null; devInfo('🏠 옮길 건물을 눌러요'); } },
      { icon: '📍', label: '여기 그대로', onClick: () => { d.bsel = null; } },
    ] });
    return;
  }
  bmDrop(b, x - b.doorTile[0], y - b.doorTile[1]);
}
/* 끌어 놓기 · 눌러 옮기기 공통: 검사 → (등대 · 집은 확인) → 옮기기 */
function bmDrop(b, dx, dy) {
  const d = G.dev; if (!d || (!dx && !dy)) return;
  const why = bmCheck(b, dx, dy);
  if (why.length) { toast('🚫 여기엔 못 옮겨요: ' + why.slice(0, 2).join(' · ')); devInfo(`🏠 ${b.name} — 다른 자리로 끌어 봐요`); return; }
  const go = () => { devCommit(() => { const md = devMap('island'); md.bmove = md.bmove || {}; const cur = md.bmove[b.id] || [0, 0]; md.bmove[b.id] = [cur[0] + dx, cur[1] + dy]; if (!md.bmove[b.id][0] && !md.bmove[b.id][1]) delete md.bmove[b.id]; }, `🏠 ${josa(b.name, '을', '를')} 옮겼어요 — 💾 저장을 눌러야 확정돼요`); d.bsel = b.id; devBarSel(); if (G.player.map === 'island') devNudgePlayer(); };
  if (['lighthouse', 'home'].includes(b.id)) openSheet({ title: `${josa(b.name, '을', '를')} 옮길까요?`, sub: '<div class="relneed">이벤트에 쓰는 건물이에요. 근처 이동 지점은 함께 옮겨지지만, 일부 연출은 원래 자리 기준일 수 있어요. 자동 백업을 남겨요.</div>', cols: 2, items: [{ icon: '✅', label: '옮기기', onClick: () => { devBackup('건물 이동 전 자동 백업'); go(); } }, { icon: '↩', label: '취소', onClick: () => { } }] });
  else go();
}
/* 고른 건물 막대: 원래 자리로 · 선택 취소 */
const _devBarSelBM = devBarSel;
devBarSel = function () {
  _devBarSelBM();
  const d = G.dev, el = $('#devSel'); if (!el || !d || d.sel || !d.bsel || d.tool !== 'select') return;
  const b = M.buildings.find(o => o.id === d.bsel); if (!b) { d.bsel = null; return; }
  const moved = !!(bmMoves()[b.id]);
  el.classList.remove('hidden');
  el.innerHTML = `<button data-a="home" ${moved ? '' : 'disabled'}>↩ 원래 자리로</button><button data-a="off">✋ 선택 취소</button>`;
  el.style.gridTemplateColumns = 'repeat(2, 1fr)';
  devInfo(`🏠 ${b.name}${moved ? ' · 옮긴 건물' : ''} — 누른 채 끌어서 옮겨요`);
  el.querySelectorAll('button').forEach(x => x.onclick = () => {
    Sound.sfx('tap');
    if (x.dataset.a === 'home') devCommit(() => { const md = devMap('island'); if (md.bmove) delete md.bmove[b.id]; }, `🏠 ${josa(b.name, '을', '를')} 원래 자리로 돌렸어요`);
    else d.bsel = null;
    devBarSel();
  });
};
const _devTapBM = devTap;
devTap = function (w, x, y) { const d = G.dev; if (d && d.tool === 'bld') return bmTap(x, y); return _devTapBM(w, x, y); };
const _devToolClickBM = devToolClick;
devToolClick = function (t) {
  const d = G.dev; if (!d) return;
  if (t === 'bld') { d.tool = 'bld'; d.sel = null; d.bsel = null; devBarSel(); devInfo(M.id === 'island' ? '🏠 옮길 건물을 눌러요 → 새 「문 앞」 자리를 눌러요' : '건물은 섬에서만 옮길 수 있어요'); devBarTools(); return; }
  if (d && t !== 'select' && !['undo', 'redo', 'coll', 'save', 'more'].includes(t)) d.bsel = null;
  return _devToolClickBM(t);
};
/* 선택한 건물 · 놓을 자리 표시 */
const _renderBM = render;
render = function (dt) {
  _renderBM(dt);
  const d = G.dev; if (!d || !d.bsel || M.id !== 'island' || (d.tool !== 'bld' && d.tool !== 'select')) return;
  const b = M.buildings.find(o => o.id === d.bsel); if (!b) return;
  try {
    const g = R.view.getContext('2d'), t = performance.now() / 300, bd = d.bdrag && d.bdrag.b === b && (d.bdrag.dx || d.bdrag.dy) ? d.bdrag : null;
    const ddx = bd ? bd.dx : 0, ddy = bd ? bd.dy : 0, bad = bd && bd.why.length;
    g.save();
    const poly = (x0, y0, x1, y1) => { const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => iso(x, y)); g.beginPath(); pts.forEach(([X, Y], i) => { const a = SX(X), c = SY(Y); i ? g.lineTo(a, c) : g.moveTo(a, c); }); g.closePath(); g.fill(); };
    if (bd) { // 원래 자리는 흐리게, 새 자리에 건물 그림
      g.globalAlpha = 0.25; g.fillStyle = '#ffffff'; poly(b.x, b.y, b.x + b.w, b.y + b.h);
      const s = buildingSprite(b, false), [ix, iy] = iso(ddx, ddy), [i0x, i0y] = iso(0, 0);
      g.globalAlpha = 0.7; g.imageSmoothingEnabled = false; g.drawImage(s.c, SX(s.x + ix - i0x), SY(s.y + iy - i0y), s.c.width * R.K, s.c.height * R.K);
    }
    g.globalAlpha = 0.35 + 0.15 * Math.sin(t); g.fillStyle = bad ? '#ff5a5a' : bd ? '#6fe08a' : '#ffd34d';
    poly(b.x + ddx, b.y + ddy, b.x + b.w + ddx, b.y + b.h + ddy); g.fillStyle = bad ? '#ff5a5a' : '#4fc3ff'; poly(b.doorTile[0] + ddx, b.doorTile[1] + ddy, b.doorTile[0] + 1 + ddx, b.doorTile[1] + 1 + ddy);
    g.restore();
  } catch (e) { }
};
/* 맵을 다시 지을 때(편집 · 되돌리기 · 기본 복원)마다 건물 그림을 새로 그리게 */
const _buildWorldBM = buildWorld;
buildWorld = function () { bmClearSprites(); try { bmRestore(); } catch (e) { console.error('[bmove]', e); } return _buildWorldBM(); };
