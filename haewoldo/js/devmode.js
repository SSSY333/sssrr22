/* =====================================================================
   개발자 모드 — 섬 · 실내 자유 편집
   · 기본 맵 코드는 그대로 두고, 편집 내용은 별도 저장소(오버레이)에 저장
   · 게임 업데이트 뒤에도 같은 자리의 오브젝트에 다시 적용됨
   · 편집 중에는 시간 · 주민이 멈춤
   ===================================================================== */
const DEV_KEY = 'haewoldo-mapedit-v1', DEV_BAK = 'haewoldo-mapedit-v1-bak', DEV_VER = 1;
const devEmpty = () => ({ ver: DEV_VER, maps: {}, savedAt: 0 });
function devValid(d) {
  if (!d || typeof d !== 'object' || !d.maps || typeof d.maps !== 'object') return false;
  for (const md of Object.values(d.maps)) if (!md || typeof md !== 'object' || (md.add && !Array.isArray(md.add)) || (md.seats && !Array.isArray(md.seats))) return false;
  return true;
}
function devNorm(d) { for (const md of Object.values(d.maps)) { md.mod = md.mod || {}; md.add = md.add || []; md.tiles = md.tiles || {}; md.seats = md.seats || []; } d.ver = DEV_VER; return d; }
function devLoad() { try { const t = localStorage.getItem(DEV_KEY); if (t) { const d = JSON.parse(t); if (devValid(d)) return devNorm(d); } } catch (e) { } return devEmpty(); }
let DEVDATA = devLoad();
function devMap(id) { return DEVDATA.maps[id] || (DEVDATA.maps[id] = { mod: {}, add: [], tiles: {}, seats: [] }); }
function devHasEdits(d = DEVDATA) { return Object.values(d.maps).some(md => Object.keys(md.mod).length || md.add.length || Object.keys(md.tiles).length || md.seats.length); }

/* 편집 가능한 붓 · 추가 목록 */
const DEV_TILES = [[T.GRASS, '잔디', '🌱'], [14, '흙길', '🟫'], [T.ALLEY, '돌길', '🪨'], [T.PATH, '큰길', '🛣'], [T.SAND, '모래', '🏖'], [T.FLOWER, '꽃밭', '🌼'], [T.BOARD, '나무 데크', '🪵'], [T.FLOOR, '실내 바닥', '🟨'], [T.TILEF, '타일 바닥', '⬜'], [T.MAT, '매트', '🟥']];
const DEV_ADD = [
  ['tree', '나무', '🌳'], ['palm', '야자수', '🌴'], ['orange', '귤나무', '🍊'], ['bush', '덤불', '🌿'], ['flowerbed', '화단', '🌷'], ['stone', '돌', '🪨'], ['rocks', '바위', '🗿'],
  ['bench', '벤치', '🪑'], ['lamp', '가로등', '💡'], ['parasol', '파라솔', '⛱'], ['pot', '화분', '🪴'], ['crates', '나무 상자', '📦'], ['hay', '건초', '🌾'], ['lantern', '등불', '🏮'],
  ['lowfence', '낮은 울타리', '🚧'], ['fence2', '나무 울타리', '🪵'], ['campChair', '캠핑 의자', '🪑'], ['campTable', '캠핑 테이블', '🍽'], ['campLantern', '캠핑 랜턴', '🏮'], ['woodbox', '장작 상자', '🪵'], ['icebox', '아이스박스', '🧊'], ['basket', '바구니', '🧺'], ['fparasol', '낚시 파라솔', '⛱'], ['woodSign', '나무 표지판', '🪧'], ['sandcastle', '모래성', '🏰'],
];
const DEV_PROTECT_KINDS = ['busstop', 'booth', 'ticket', 'tankOut', 'stall', 'furnDisplay', 'boat', 'telescope', 'grill', 'tent', 'campfire', 'swingSet', 'slide', 'seesaw', 'merry', 'springRider'];
const DEV_GROUPS = [['jeongjaBase', 'jeongjaRoof']];
const DEV_KIND_NAME = Object.fromEntries(DEV_ADD.map(([k, n]) => [k, n]));
Object.assign(DEV_KIND_NAME, { wall: '담장', board: '게시판', telescope: '망원경', hare: '돌하르방', fence: '울타리', windmill: '풍차', busstop: '버스 정류장', booth: '네컷 부스', boat: '보트', pavilion: '정자', tent: '텐트', campfire: '모닥불', grill: '바비큐 그릴', swingSet: '그네', slide: '미끄럼틀', seesaw: '시소', merry: '뺑뺑이', springRider: '스프링 놀이기구', playSign: '놀이터 표지판', mat: '돗자리', jeongjaBase: '정자', jeongjaRoof: '정자 지붕', campTable2: '바비큐 식탁', furn: '가구' });
const devName = (o) => o.kind === 'furn' ? (FURN[o.k] ? FURN[o.k].name : '가구') : DEV_KIND_NAME[o.kind] || o.kind;

/* ---------------- 오브젝트 식별자 · 오버레이 적용 ---------------- */
function devAssignUids(m) {
  const cnt = {};
  for (const o of m.objects) {
    if (o.uid || o.aid || o.portal || o.dig || o.back) continue;
    const base = o.kind + ':' + (o.k || o.v || 0) + '@' + o.x + ',' + o.y;
    const n = cnt[base] = (cnt[base] || 0) + 1; o.uid = base + (n > 1 ? '#' + n : '');
    o._ox = o.x; o._oy = o.y; o._ofw = o.fw || 1; o._ofh = o.fh || 1;
  }
}
const devFoot = (o, x = o.x, y = o.y, fw = o.fw || 1, fh = o.fh || 1) => { const r = []; for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) r.push([xx, yy]); return r; };
function devMakeObj(e) {
  if (e.kind === 'furn') {
    if (!FURN[e.k]) return null; const rot = (e.rot | 0) & 3, F = FURN[e.k], [fw, fh] = typeof furnFoot === 'function' ? furnFoot(e.k, rot) : [1, 1];
    return { kind: 'furn', k: e.k, x: e.x, y: e.y, rot, fw, fh, flip: rot & 1, solid: !F.flat && !F.wall, aid: e.aid, scale: e.scale, light: e.light };
  }
  const o = { kind: e.kind, v: e.v || 0, x: e.x, y: e.y, solid: e.solid !== false, aid: e.aid };
  if (e.rot) o.rot = e.rot; if (e.scale) o.scale = e.scale; if (e.mirror) o.mirror = true; if (e.light) o.light = true;
  if (e.kind === 'mat') { o.fw = 2; o.fh = 1; o.flat = true; o.solid = false; }
  if (e.kind === 'sandcastle') o.solid = false;
  return o;
}
function devApplyMap(m, md) {
  if (!md) return;
  const W = m.W, base = m.block.slice();
  for (const [i, t] of Object.entries(md.tiles)) { const idx = +i; if (idx >= 0 && idx < m.tiles.length && (TILE_NAMES[t] != null || t === 14)) m.tiles[idx] = t; }
  const touched = [];
  for (const o of m.objects) {
    const e = o.uid && md.mod[o.uid]; if (!e) continue;
    touched.push(o);
    if (o.solid !== false) for (const [x, y] of devFoot(o, o._ox, o._oy, o._ofw, o._ofh)) if (inMap(x, y, m)) base[y * W + x] = 0;
    const dx = (e.x != null ? e.x : o.x) - o._ox, dy = (e.y != null ? e.y : o.y) - o._oy;
    if (e.del) { o._del = true; devShiftSeats(m, o, null); continue; }
    if (e.rot != null) { o.rot = e.rot & 3; if (o.kind === 'furn') { const [fw, fh] = furnFoot(o.k, o.rot); o.fw = fw; o.fh = fh; o.flip = o.rot & 1; } }
    if (e.mirror != null) o.mirror = !!e.mirror;
    if (e.scale) o.scale = e.scale;
    if (e.light != null) o.light = !!e.light;
    if (dx || dy) { devShiftSeats(m, o, [dx, dy]); o.x = o._ox + dx; o.y = o._oy + dy; if (o.keyFix != null) o.keyFix += dx + dy; }
  }
  m.objects = m.objects.filter(o => !o._del);
  for (const e of md.add) { const o = devMakeObj(e); if (o && inMap(o.x, o.y, m)) m.objects.push(o); }
  // 충돌 다시 계산: 원래 막힘 − 옮긴 물건의 원래 자리 + 지금 물건들
  m.block = base;
  for (const o of m.objects) if (o.solid && !o.water && !(o.kind === 'furn' && (FURN[o.k].flat || FURN[o.k].wall))) for (const [x, y] of devFoot(o)) if (inMap(x, y, m)) m.block[y * W + x] = 1;
  for (const b of m.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) m.block[y * W + x] = 1;
  // NPC 쉼터 자리
  for (const s of md.seats) {
    const ok = (x, y) => inMap(x, y, m) && tileAt(x, y, m) !== T.WATER;
    if (!ok(s.x, s.y)) continue;
    const two = ok(s.x + 1, s.y), seats = two ? [[s.x, s.y], [s.x + 1, s.y]] : [[s.x, s.y]], stand = seats.map(([x, y]) => [x, y + 1]);
    const onObj = m.objects.some(o => ['bench', 'campChair', 'fishChair'].includes(o.kind) && o.x === s.x && o.y === s.y);
    m.benches['dev_' + s.sid] = { name: s.name || '쉼터 자리', place: m.id === 'island' ? placeAt(s.x, s.y, m) : null, seats, stand, face: seats.map(() => 0), ground: !onObj, pairs: two ? [[0, 1]] : [], dev: true };
    for (const [x, y] of stand) if (inMap(x, y, m)) m.block[y * W + x] = 0;
  }
  for (const bk of Object.values(m.benches)) for (const s of bk.stand) if (inMap(s[0], s[1], m) && !m.buildings.some(b => s[0] >= b.x && s[0] < b.x + b.w && s[1] >= b.y && s[1] < b.y + b.h)) m.block[s[1] * W + s[0]] = 0;
  if (m.exit) m.block[m.exit[1] * W + m.exit[0]] = 0;
  for (const b of m.buildings) if (b.doorTile && inMap(b.doorTile[0], b.doorTile[1], m)) m.block[b.doorTile[1] * W + b.doorTile[0]] = 0;
}
/* 의자 · 벤치를 옮기면 앉는 자리도 같이 옮겨감 */
function devShiftSeats(m, o, d) {
  const inF = (x, y) => x >= o._ox && x < o._ox + o._ofw && y >= o._oy && y < o._oy + o._ofh;
  for (const [k, bk] of Object.entries(m.benches)) {
    if (bk.dev) continue;
    const idx = bk.seats.map((s, i) => inF(s[0], s[1]) ? i : -1).filter(i => i >= 0); if (!idx.length) continue;
    if (!d) { if (idx.length === bk.seats.length) delete m.benches[k]; continue; }
    for (const i of idx) { bk.seats[i] = [bk.seats[i][0] + d[0], bk.seats[i][1] + d[1]]; bk.stand[i] = [bk.stand[i][0] + d[0], bk.stand[i][1] + d[1]]; }
    if (idx.length === bk.seats.length) { if (bk.exit) bk.exit = bk.exit.map(e => Array.isArray(e) ? [e[0] + d[0], e[1] + d[1]] : e); if (bk.center) bk.center = [bk.center[0] + d[0], bk.center[1] + d[1]]; }
  }
}
function devApplyAll() {
  for (const m of Object.values(MAPS)) { devAssignUids(m); }
  for (const [id, md] of Object.entries(DEVDATA.maps)) if (MAPS[id] && id !== 'in_home') devApplyMap(MAPS[id], md);
  if (typeof refreshFenceMasks === 'function') for (const m of Object.values(MAPS)) refreshFenceMasks(m);
  devSyncPlans();
}
const _buildWorldDev = buildWorld;
buildWorld = function () { _buildWorldDev(); try { devApplyAll(); } catch (e) { console.error('[devmode] 편집 적용 실패', e); } };
/* 개발자가 만든 쉼터 자리를 주민들도 씀 */
const DEV_PLANS = [];
function devSyncPlans() {
  for (const p of DEV_PLANS) { const i = LEISURE_PLANS.indexOf(p); if (i >= 0) LEISURE_PLANS.splice(i, 1); }
  DEV_PLANS.length = 0;
  const md = DEVDATA.maps.island; if (!md) return;
  const pool = ['halmeoni', 'grandpa', 'okja', 'chief', 'postman', 'farmer', 'keeper', 'tourist', 'kid'];
  md.seats.forEach((s, i) => { const who = pool[(s.sid * 7 + i) % pool.length]; const p = { h: [9 + (i % 3) * 2, 13 + (i % 3) * 2], who: [who], b: 'dev_' + s.sid, act: i % 2 ? 'chat' : 'rest', dev: true }; DEV_PLANS.push(p); LEISURE_PLANS.push(p); });
}

/* ---------------- 편집 세션 ---------------- */
G.dev = null;
function devToggleSetting() {
  S.settings.dev = !S.settings.dev; save();
  toast(S.settings.dev ? '🛠 개발자 모드가 켜졌어요. 메뉴 → 설정 → 「맵 편집 시작」' : '개발자 모드를 껐어요. 저장한 편집은 그대로 남아요');
}
function devStart() {
  if (!S.settings.dev) { toast('설정에서 개발자 모드를 먼저 켜요'); return; }
  if (G.busy || G.dialog) { toast('지금은 편집을 시작할 수 없어요'); return; }
  if (M.id === 'in_home') { toast('집 안은 「꾸미기」로 편집해요'); if (typeof openDecor === 'function') openDecor(); return; }
  const P = G.player;
  if (P.seat) standUpPlayer();
  for (const v of G.villagers) if (v.leis) endLeis(v);
  P.stop && P.stop();
  G.dev = { tool: 'select', sel: null, brush: T.GRASS, addKind: 'tree', undo: [], redo: [], dirty: false, coll: false, start: JSON.stringify(DEVDATA), drag: null, pan: null };
  G.camFocus = { x: P.x, y: P.y }; G.screen = true;
  document.body.classList.add('devOn'); devBar(); devInfo('편집할 물건을 눌러요. 빈 곳을 끌면 화면이 움직여요');
  toast('🛠 편집 중 — 시간과 주민이 멈춰요');
}
function devStop(saveIt) {
  const d = G.dev; if (!d) return;
  if (saveIt) devSave(); else if (d.dirty) { DEVDATA = devNorm(JSON.parse(d.start)); devRebuild(); }
  G.dev = null; G.camFocus = null; G.camSnap = true; G.screen = false;
  document.body.classList.remove('devOn'); const bar = $('#devBar'); if (bar) bar.remove();
  devNudgePlayer();
  toast(saveIt ? '💾 편집을 저장했어요' : '편집을 끝냈어요');
}
function devExit() {
  const d = G.dev; if (!d) return;
  if (!d.dirty) { devStop(false); return; }
  openSheet({ title: '편집을 끝낼까요?', sub: '<div class="relneed">저장하지 않은 편집이 있어요.</div>', cols: 3, items: [
    { icon: '💾', label: '저장하고 끝내기', onClick: () => devStop(true) },
    { icon: '🗑', label: '저장 안 함', onClick: () => devStop(false) },
    { icon: '↩', label: '계속 편집', onClick: () => { } }] });
}
function devSave() {
  DEVDATA.savedAt = Date.now();
  try { localStorage.setItem(DEV_KEY, JSON.stringify(DEVDATA)); if (G.dev) { G.dev.dirty = false; G.dev.start = JSON.stringify(DEVDATA); } return true; } catch (e) { toast('저장 공간이 부족해요'); return false; }
}
function devBackup(label) {
  try { const list = JSON.parse(localStorage.getItem(DEV_BAK) || '[]'); list.unshift({ at: Date.now(), label: label || '수동 백업', data: DEVDATA }); localStorage.setItem(DEV_BAK, JSON.stringify(list.slice(0, 5))); return true; } catch (e) { return false; }
}
/* 바꾸기 → 되돌리기 기록 → 다시 짓기 */
function devCommit(fn, msg) {
  const d = G.dev, before = JSON.stringify(DEVDATA);
  fn();
  if (JSON.stringify(DEVDATA) === before) return;
  d.undo.push(before); if (d.undo.length > 60) d.undo.shift(); d.redo = []; d.dirty = true;
  devRebuild(); if (msg) devInfo(msg); devCheck();
}
function devUndo() { const d = G.dev; if (!d.undo.length) { toast('되돌릴 게 없어요'); return; } d.redo.push(JSON.stringify(DEVDATA)); DEVDATA = devNorm(JSON.parse(d.undo.pop())); d.dirty = true; devRebuild(); devInfo('↶ 되돌렸어요'); }
function devRedo() { const d = G.dev; if (!d.redo.length) { toast('다시 할 게 없어요'); return; } d.undo.push(JSON.stringify(DEVDATA)); DEVDATA = devNorm(JSON.parse(d.redo.pop())); d.dirty = true; devRebuild(); devInfo('↷ 다시 했어요'); }
function devRebuild() {
  const d = G.dev, selId = d && d.sel ? (d.sel.uid || d.sel.aid) : null, pmap = G.player.map;
  buildWorld();
  if (S) { if (typeof rebuildHome === 'function') rebuildHome(); else setFurniture(MAPS.in_home, homeFurnList()); if (typeof setPortalObjects === 'function') setPortalObjects(); if (typeof setCaseObjects === 'function') setCaseObjects(); }
  M = MAPS[pmap] || MAPS.island;
  for (const k of Object.keys(R.objSpr)) if (k.startsWith('F2')) delete R.objSpr[k];
  if (d) { d.sel = selId ? M.objects.find(o => o.uid === selId || o.aid === selId) || null : null; devBarSel(); }
  if (typeof drawMinimapBase === 'function') drawMinimapBase();
}
/* 막힌 길 · 갇힘 · 주민 경로 검사 */
function devReach(m, sx, sy) {
  const seen = new Uint8Array(m.W * m.H), q = [[sx, sy]]; if (!inMap(sx, sy, m)) return seen; seen[sy * m.W + sx] = 1;
  while (q.length) { const [x, y] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + a, Y = y + b; if (!inMap(X, Y, m) || seen[Y * m.W + X] || !walkable(X, Y, m)) continue; seen[Y * m.W + X] = 1; q.push([X, Y]); } }
  return seen;
}
function devCheck(verbose) {
  const m = M, P = G.player, probs = [];
  let px = Math.floor(P.x), py = Math.floor(P.y);
  if (!walkable(px, py, m)) { devNudgePlayer(); px = Math.floor(P.x); py = Math.floor(P.y); probs.push('내 자리가 막혀서 옆으로 옮겼어요'); }
  const seen = devReach(m, px, py), near = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inMap(x + a, y + b, m) && seen[(y + b) * m.W + x + a]);
  const doors = m.buildings.filter(b => b.doorTile && !near(b.doorTile[0], b.doorTile[1])).map(b => b.name);
  if (doors.length) probs.push('막힌 문: ' + doors.slice(0, 3).join(', ') + (doors.length > 3 ? ` 외 ${doors.length - 3}곳` : ''));
  if (m.exit && !near(m.exit[0], m.exit[1])) probs.push('출구로 갈 수 없어요');
  if (m.id === 'island') {
    const bad = []; for (const [k, p] of Object.entries(POI)) { if (!Array.isArray(p) || typeof p[0] !== 'number') continue; const x = Math.floor(p[0]), y = Math.floor(p[1]); if (!inMap(x, y, m) || tileAt(x, y, m) === T.WATER) continue; if (!near(x, y)) bad.push(k); }
    if (bad.length) probs.push('주민 이동 지점 막힘: ' + bad.slice(0, 4).map(k => placeName(k) || k).join(', ') + (bad.length > 4 ? ` 외 ${bad.length - 4}곳` : ''));
    const seatsBad = Object.entries(m.benches).filter(([, bk]) => bk.stand.some(s => !near(s[0], s[1]))).map(([, bk]) => bk.name);
    if (seatsBad.length) probs.push('앉을 수 없는 자리: ' + [...new Set(seatsBad)].slice(0, 3).join(', '));
  }
  if (probs.length) { devInfo('⚠ ' + probs[0]); if (verbose || probs.length) toast('⚠ ' + probs.join(' · ')); }
  else if (verbose) toast('✅ 막힌 길 · 문 · 자리 없음');
  return probs;
}
function devNudgePlayer() {
  const P = G.player, m = MAPS[P.map] || M; if (walkable(Math.floor(P.x), Math.floor(P.y), m)) return;
  for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = Math.floor(P.x) + dx, y = Math.floor(P.y) + dy; if (walkable(x, y, m)) { P.x = x + 0.5; P.y = y + 0.5; P.path = []; return; } }
}
/* 보호 구역 경고 */
function devGuard(m, tiles, o) {
  const why = [];
  for (const [x, y] of tiles) {
    if (!inMap(x, y, m) || x <= 0 || y <= 0 || x >= m.W - 1 || y >= m.H - 1) { why.push('맵 가장자리'); continue; }
    if (m.buildings.some(b => b.doorTile && b.doorTile[0] === x && b.doorTile[1] === y)) why.push('건물 문 앞');
    if (m.buildings.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)) why.push('건물 위');
    if (m.exit && m.exit[0] === x && m.exit[1] === y) why.push('출입구');
    if ((m.portals || []).some(p => p.x === x && p.y === y)) why.push('숨은 장소 입구');
    if (m.boatSpot && Math.hypot(m.boatSpot[0] - x - 0.5, m.boatSpot[1] - y - 0.5) < 1) why.push('보트 타는 곳');
    if (Object.values(m.benches).some(bk => bk.stand.some(s => s[0] === x && s[1] === y))) why.push('의자 앞 서는 자리');
    if (Math.floor(G.player.x) === x && Math.floor(G.player.y) === y) why.push('내가 서 있는 자리');
  }
  if (o && DEV_PROTECT_KINDS.includes(o.kind)) why.push('이벤트 · 활동에 쓰는 물건');
  return [...new Set(why)];
}
function devConfirm(why, go) {
  if (!why.length) { go(); return; }
  openSheet({ title: '⚠ 주의가 필요한 자리예요', sub: `<div class="relneed">${why.map(esc).join(' · ')}<br>길이 막히거나 이벤트가 동작하지 않을 수 있어요. 진행하면 자동 백업을 남겨요.</div>`, cols: 2, items: [
    { icon: '✅', label: '그래도 진행', onClick: () => { devBackup('경고 무시 전 자동 백업'); go(); } },
    { icon: '↩', label: '취소', onClick: () => { devRebuild(); } }] });
}

/* ---------------- 편집 동작 ---------------- */
const devId = (o) => o.uid || o.aid;
const devGroup = (o) => { const g = DEV_GROUPS.find(g => g.includes(o.kind)); return g ? M.objects.filter(x => g.includes(x.kind) && Math.abs(x.x - o.x) <= 1 && Math.abs(x.y - o.y) <= 1) : [o]; };
function devSet(o, patch) {
  const md = devMap(M.id);
  if (o.aid) { const e = md.add.find(e => e.aid === o.aid); if (!e) return; if (patch.del) md.add.splice(md.add.indexOf(e), 1); else Object.assign(e, patch); return; }
  const e = md.mod[o.uid] = md.mod[o.uid] || {}; Object.assign(e, patch);
  if (e.x === o._ox && e.y === o._oy) { delete e.x; delete e.y; }
  if (!Object.keys(e).length) delete md.mod[o.uid];
}
const devNewId = () => 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
function devMove(o, nx, ny) {
  const grp = devGroup(o), dx = nx - o.x, dy = ny - o.y; if (!dx && !dy) { devRebuild(); return; }
  const tiles = o.solid ? devFoot(o, nx, ny) : [];
  devConfirm(devGuard(M, tiles, o), () => devCommit(() => { for (const x of grp) devSet(x, { x: x.x + dx, y: x.y + dy }); }, `↔ ${devName(o)}을(를) 옮겼어요`));
}
function devRotate(o) {
  const lspr = typeof LSPR !== 'undefined' && LSPR[o.kind];
  if (o.kind === 'furn' || lspr) devCommit(() => devSet(o, { rot: ((o.rot || 0) + 1) & 3 }), '↻ 돌렸어요');
  else devCommit(() => devSet(o, { mirror: !o.mirror }), '↔ 좌우를 뒤집었어요');
}
function devScale(o, f) { const s = Math.max(0.5, Math.min(2, Math.round(((o.scale || 1) + f) * 10) / 10)); devCommit(() => devSet(o, { scale: s === 1 ? 0 : s }), `크기 ${Math.round(s * 100)}%`); }
function devDelete(o) {
  const why = DEV_PROTECT_KINDS.includes(o.kind) ? ['이벤트 · 활동에 쓰는 물건'] : [];
  if (Object.values(M.benches).some(bk => bk.seats.some(s => s[0] >= o.x && s[0] < o.x + (o.fw || 1) && s[1] >= o.y && s[1] < o.y + (o.fh || 1)))) why.push('앉는 자리가 함께 사라져요');
  devConfirm(why, () => devCommit(() => { for (const x of devGroup(o)) devSet(x, { del: true }); G.dev.sel = null; }, `🗑 ${devName(o)}을(를) 지웠어요`));
}
function devDuplicate(o) {
  const m = M; let spot = null;
  for (const [a, b] of [[1, 0], [0, 1], [-1, 0], [0, -1], [2, 0], [0, 2], [1, 1]]) { const x = o.x + a * (o.fw || 1), y = o.y + b * (o.fh || 1); if (devFoot(o, x, y).every(([X, Y]) => walkable(X, Y, m) && !devGuard(m, [[X, Y]]).length)) { spot = [x, y]; break; } }
  if (!spot) { toast('옆에 놓을 빈자리가 없어요'); return; }
  const e = { aid: devNewId(), kind: o.kind, k: o.k, v: o.v || 0, x: spot[0], y: spot[1], rot: o.rot || 0, scale: o.scale || 0, mirror: !!o.mirror, light: !!o.light, solid: o.solid !== false };
  devCommit(() => devMap(m.id).add.push(e), `⧉ ${devName(o)} 복제`);
  G.dev.sel = M.objects.find(x => x.aid === e.aid) || null; devBarSel();
}
function devAddAt(kind, x, y, extra = {}) {
  const m = M; if (!inMap(x, y, m)) return;
  if (tileAt(x, y, m) === T.WATER) { toast('물 위에는 놓을 수 없어요'); return; }
  const e = Object.assign({ aid: devNewId(), kind, v: 0, x, y, solid: !['sandcastle', 'mat'].includes(kind) }, extra);
  if (kind === 'lamp') e.light = true;
  const tiles = e.solid ? [[x, y]] : [];
  if (m.objects.some(o => o.solid && devFoot(o).some(([a, b]) => a === x && b === y)) || m.block[y * m.W + x]) { toast('이미 막혀 있는 칸이에요'); return; }
  devConfirm(devGuard(m, tiles), () => { devCommit(() => devMap(m.id).add.push(e), `＋ ${DEV_KIND_NAME[kind] || kind} 추가`); G.dev.sel = M.objects.find(o => o.aid === e.aid) || null; devBarSel(); });
}
function devPaint(x, y) {
  const m = M; if (!inMap(x, y, m) || x <= 0 || y <= 0 || x >= m.W - 1 || y >= m.H - 1) return false;
  const t = tileAt(x, y, m), want = G.dev.brush;
  if (t === T.WATER || t === T.POND || t === T.ROCK || t === T.WOOD) return false;
  if (m.buildings.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)) return false;
  if (t === want) return false;
  devMap(m.id).tiles[y * m.W + x] = want; m.tiles[y * m.W + x] = want; return true;
}
function devFenceAt(x, y) {
  const m = M, f = m.objects.find(o => o.kind === 'fence2' && o.x === x && o.y === y);
  if (f) { devCommit(() => devSet(f, { del: true }), '울타리를 걷었어요'); return; }
  if (!walkable(x, y, m)) { toast('여긴 울타리를 놓을 수 없어요'); return; }
  const why = devGuard(m, [[x, y]]);
  devConfirm(why, () => devCommit(() => devMap(m.id).add.push({ aid: devNewId(), kind: 'fence2', x, y, solid: true }), '🪵 울타리 (모서리는 자동으로 이어져요)'));
}
function devLightAt(x, y) {
  const o = devObjAt(x, y);
  if (o) { devCommit(() => devSet(o, { light: !o.light }), o.light ? '💡 불을 껐어요' : '💡 밤에 불이 켜져요'); return; }
  devAddAt('lamp', x, y);
}
function devSeatAt(x, y) {
  const m = M, md = devMap(m.id), ex = md.seats.find(s => (s.x === x || s.x + 1 === x) && s.y === y);
  if (ex) { devCommit(() => md.seats.splice(md.seats.indexOf(ex), 1), '쉼터 자리를 없앴어요'); return; }
  if (tileAt(x, y, m) === T.WATER || !walkable(x, y + 1, m)) { toast('앞(아래쪽)에 설 자리가 있어야 해요'); return; }
  const sid = (md.seats.reduce((a, s) => Math.max(a, s.sid), 0) || 0) + 1;
  devCommit(() => md.seats.push({ sid, x, y }), '🧑‍🤝‍🧑 쉼터 자리 — 나도, 주민도 앉아 쉬어요');
}
function devObjAt(x, y) {
  let best = null, bk = -1e9;
  for (const o of M.objects) { if (o.water || !devId(o)) continue; if (devFoot(o).some(([a, b]) => a === x && b === y)) { const k = (o._key != null ? o._key : o.x + o.y) + (o.flat ? -5 : 0); if (k > bk) { bk = k; best = o; } } }
  return best;
}
function devObjAtScreen(wx, wy, tx, ty) {
  const f = devObjAt(Math.floor(tx), Math.floor(ty)); if (f) return f;
  let best = null, bd = 1e9;
  for (const o of M.objects) {
    if (o.water || !devId(o) || o.flat) continue; const sp = objSprite(o), [sx, sy] = iso(o.x + 0.5, o.y + 0.5);
    const x0 = sx - sp.ax, y0 = sy - sp.ay; if (wx < x0 || wx > x0 + sp.c.width || wy < y0 || wy > y0 + sp.c.height) continue;
    const dd = Math.hypot(wx - sx, wy - sy); if (dd < bd) { bd = dd; best = o; }
  }
  return best;
}

/* ---------------- 화면 조작 ---------------- */
function devBindInput() {
  const view = R.view; let ptrs = 0, painted = false;
  const W = (e) => { const r = view.getBoundingClientRect(); return screenToWorld(e.clientX - r.left, e.clientY - r.top); };
  view.addEventListener('pointerdown', (e) => {
    const d = G.dev; if (!d || G.sheet) return; ptrs++;
    if (ptrs > 1) { d.drag = null; d.pan = null; return; }
    const w = W(e), x = Math.floor(w.tx), y = Math.floor(w.ty);
    d.down = { cx: e.clientX, cy: e.clientY, x, y, moved: false };
    if (d.tool === 'select' && d.sel && devFoot(d.sel).some(([a, b]) => a === x && b === y)) { d.drag = { o: d.sel, ox: x - d.sel.x, oy: y - d.sel.y, grp: devGroup(d.sel).map(o => [o, o.x, o.y]) }; return; }
    if (d.tool === 'tile') { d.paintBefore = JSON.stringify(DEVDATA); painted = devPaint(x, y); d.painting = true; return; }
    d.pan = { cx: e.clientX, cy: e.clientY, fx: G.camFocus.x, fy: G.camFocus.y };
  }, true);
  view.addEventListener('pointermove', (e) => {
    const d = G.dev; if (!d || !d.down || ptrs > 1) return;
    if (Math.hypot(e.clientX - d.down.cx, e.clientY - d.down.cy) > 8) d.down.moved = true;
    const w = W(e), x = Math.floor(w.tx), y = Math.floor(w.ty);
    if (d.drag && d.down.moved) { const o = d.drag.o, nx = x - d.drag.ox, ny = y - d.drag.oy, dx = nx - o.x, dy = ny - o.y; if (dx || dy) for (const g of d.drag.grp) { g[0].x += dx; g[0].y += dy; } d.hover = [nx, ny]; return; }
    if (d.painting) { if (devPaint(x, y)) painted = true; return; }
    if (d.pan && d.down.moved) { const k = R.cur || 1, ddx = (e.clientX - d.pan.cx) / k, ddy = (e.clientY - d.pan.cy) / k; G.camFocus = { x: d.pan.fx - (ddx / 16 + ddy / 8) / 2, y: d.pan.fy - (ddy / 8 - ddx / 16) / 2 }; G.camSnap = true; }
  }, true);
  const up = (e) => {
    const d = G.dev; ptrs = Math.max(0, ptrs - 1); if (!d || !d.down) return;
    const dn = d.down; d.down = null;
    if (d.drag) { const dr = d.drag; d.drag = null; d.hover = null; if (dn.moved) { const o = dr.o, nx = o.x, ny = o.y; for (const g of dr.grp) { g[0].x = g[1]; g[0].y = g[2]; } devMove(o, nx, ny); return; } }
    if (d.painting) { d.painting = false; if (painted) { d.undo.push(d.paintBefore); d.redo = []; d.dirty = true; devRebuild(); devInfo(`🖌 ${DEV_TILES.find(t => t[0] === d.brush)[1]}으로 칠했어요`); devCheck(); } painted = false; return; }
    d.pan = null;
    if (dn.moved || G.sheet) return;
    const w = W(e), x = Math.floor(w.tx), y = Math.floor(w.ty);
    devTap(w, x, y);
  };
  view.addEventListener('pointerup', up, true); view.addEventListener('pointercancel', (e) => { const d = G.dev; ptrs = Math.max(0, ptrs - 1); if (d) { if (d.drag) for (const g of d.drag.grp) { g[0].x = g[1]; g[0].y = g[2]; } d.drag = null; d.pan = null; d.down = null; d.painting = false; } }, true);
}
function devTap(w, x, y) {
  const d = G.dev;
  if (d.tool === 'select') { d.sel = devObjAtScreen(w.wx, w.wy, w.tx, w.ty); if (!d.sel) { const any = M.objects.find(o => !devId(o) && !o.water && o.x === x && o.y === y); if (any) toast('이벤트 · 시스템용 물건이라 편집할 수 없어요'); } devBarSel(); return; }
  if (d.tool === 'add') { devAddAt(d.addKind, x, y); return; }
  if (d.tool === 'fence') { devFenceAt(x, y); return; }
  if (d.tool === 'light') { devLightAt(x, y); return; }
  if (d.tool === 'seat') { devSeatAt(x, y); return; }
}
/* 선택 · 충돌 · 자리 표시 */
const _renderDev = render;
render = function (dt) {
  _renderDev(dt);
  const d = G.dev; if (!d || !G.started) return;
  const g = R.v, m = M;
  const dia = (x, y, col) => { const [sx, sy] = iso(x, y); for (let r = 0; r < 8; r++) { prect(g, sx - 2 - r * 2, sy + r, 4 + r * 4, 1, col); prect(g, sx - 2 - r * 2, sy + 15 - r, 4 + r * 4, 1, col); } };
  const view = (x, y) => { const [sx, sy] = iso(x, y); return sx - G.cam.x > -40 && sx - G.cam.x < R.lw + 40 && sy - G.cam.y > -40 && sy - G.cam.y < R.lh + 40; };
  if (d.coll) {
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) { if (!view(x, y)) continue; if (!walkable(x, y, m)) { if (tileAt(x, y, m) !== T.WATER) dia(x, y, 'rgba(240,80,80,0.32)'); } }
    for (const b of m.buildings) if (b.doorTile) dia(b.doorTile[0], b.doorTile[1], 'rgba(255,214,80,0.6)');
    if (m.exit) dia(m.exit[0], m.exit[1], 'rgba(255,214,80,0.6)');
  }
  if (d.coll || d.tool === 'seat') for (const bk of Object.values(m.benches)) { for (const s of bk.seats) dia(s[0], s[1], bk.dev ? 'rgba(180,120,255,0.55)' : 'rgba(110,170,255,0.45)'); for (const s of bk.stand) dia(s[0], s[1], 'rgba(120,230,150,0.35)'); }
  const o = d.drag ? d.drag.o : d.sel;
  if (o) { const ok = !d.drag || !devGuard(m, o.solid ? devFoot(o) : [], null).length; for (const [x, y] of devFoot(o)) dia(x, y, ok ? 'rgba(120,220,140,0.5)' : 'rgba(240,90,90,0.5)'); }
};

/* ---------------- 편집 막대 ---------------- */
function devInfo(t) { const el = $('#devInfo'); if (el) el.textContent = t; }
function devBar() {
  let bar = $('#devBar'); if (bar) bar.remove();
  bar = document.createElement('div'); bar.id = 'devBar';
  bar.innerHTML = `<div id="devInfo"></div><div id="devSel" class="dbtns hidden"></div><div class="dbtns" id="devTools"></div>`;
  $('#game').appendChild(bar);
  devBarTools(); devBarSel();
}
function devBarTools() {
  const d = G.dev, el = $('#devTools'); if (!el) return;
  const tools = [['select', '👆 선택'], ['add', '＋ 추가'], ['tile', '🖌 바닥'], ['fence', '🪵 울타리'], ['light', '💡 조명'], ['seat', '🪑 쉼터'], ['coll', d.coll ? '▦ 충돌 끄기' : '▦ 충돌'], ['undo', '↶ 되돌리기'], ['redo', '↷ 다시'], ['more', '⋯ 더보기']];
  el.innerHTML = tools.map(([k, l]) => `<button data-t="${k}" class="${d.tool === k ? 'ok' : ''}">${l}</button>`).join('') + '<button data-t="save" class="ok">💾 저장</button><button data-t="exit">✕ 끝내기</button>';
  el.querySelectorAll('button').forEach(b => b.onclick = () => { Sound.sfx('tap'); devToolClick(b.dataset.t); });
  el.style.gridTemplateColumns = 'repeat(6, 1fr)';
}
function devToolClick(t) {
  const d = G.dev;
  if (t === 'undo') return devUndo(); if (t === 'redo') return devRedo();
  if (t === 'coll') { d.coll = !d.coll; devBarTools(); return; }
  if (t === 'save') { if (devSave()) { toast('💾 저장했어요 (기본 맵은 그대로예요)'); devCheck(true); } return; }
  if (t === 'exit') return devExit();
  if (t === 'more') return devMoreMenu();
  d.tool = t; if (t !== 'select') { d.sel = null; devBarSel(); }
  if (t === 'add') { openSheet({ title: '＋ 무엇을 놓을까요?', sub: '<div class="relneed">고른 뒤 땅을 누르면 놓여요. 돈 · 개수 제한 없음</div>', cols: 4, items: [...DEV_ADD.map(([k, n, i]) => ({ icon: i, label: n, onClick: () => { d.addKind = k; devInfo(`＋ ${n} — 놓을 곳을 눌러요`); } })), ...(M.interior ? Object.keys(FURN).filter(k => !FURN[k].wall).slice(0, 24).map(k => ({ icon: '🛋', label: FURN[k].name, onClick: () => { d.addKind = 'furn:' + k; devInfo(`＋ ${FURN[k].name} — 놓을 곳을 눌러요`); } })) : [])] }); }
  if (t === 'tile') { if (M.interior) d.brush = T.FLOOR; openSheet({ title: '🖌 바닥 붓', sub: '<div class="relneed">고른 뒤 땅을 누르거나 끌어서 칠해요. 물 · 건물 칸은 칠해지지 않아요</div>', cols: 5, items: DEV_TILES.map(([v, n, i]) => ({ icon: i, label: n, onClick: () => { d.brush = v; devInfo(`🖌 ${n} — 누르거나 끌어서 칠해요`); } })) }); }
  const hint = { select: '물건을 눌러 고르고, 끌어서 옮겨요', fence: '칸을 누르면 울타리가 놓이고, 다시 누르면 걷혀요. 모서리는 자동으로 이어져요', light: '물건을 누르면 밤 조명이 켜지고 꺼져요. 빈 칸은 가로등 추가', seat: '칸을 누르면 2인 쉼터 자리가 생겨요(아래 칸이 서는 자리). 주민도 와서 쉬어요' }[t];
  if (hint) devInfo(hint);
  devBarTools();
}
/* 추가 도구가 가구일 때 */
const _devAddAt0 = devAddAt;
devAddAt = function (kind, x, y, extra) { if (kind.startsWith('furn:')) { const k = kind.slice(5); return _devAddAt0('furn', x, y, Object.assign({ k }, extra || {})); } return _devAddAt0(kind, x, y, extra); };
function devBarSel() {
  const d = G.dev, el = $('#devSel'); if (!el || !d) return;
  const o = d.sel; el.classList.toggle('hidden', !o);
  if (!o) { el.innerHTML = ''; return; }
  devInfo(`${devName(o)} · (${o.x}, ${o.y})${o.scale ? ' · ' + Math.round(o.scale * 100) + '%' : ''}${o.light ? ' · 조명' : ''}${o.aid ? ' · 새로 놓은 것' : ''} — 끌어서 옮겨요`);
  el.innerHTML = [['rot', '↻ 회전'], ['dup', '⧉ 복제'], ['big', '＋ 크게'], ['small', '－ 작게'], ['light', o.light ? '💡 끄기' : '💡 조명'], ['del', '🗑 삭제']].map(([k, l]) => `<button data-a="${k}">${l}</button>`).join('');
  el.style.gridTemplateColumns = 'repeat(6, 1fr)';
  el.querySelectorAll('button').forEach(b => b.onclick = () => {
    Sound.sfx('tap'); const a = b.dataset.a, s = G.dev.sel; if (!s) return;
    if (a === 'rot') devRotate(s); else if (a === 'dup') devDuplicate(s); else if (a === 'big') devScale(s, 0.1); else if (a === 'small') devScale(s, -0.1);
    else if (a === 'light') devCommit(() => devSet(s, { light: !s.light }), s.light ? '💡 조명 끔' : '💡 밤에 불이 켜져요'); else if (a === 'del') devDelete(s);
  });
}
function devMoreMenu() {
  openSheet({ title: '⋯ 편집 관리', cols: 3, sub: `<div class="relneed">편집은 기본 맵과 따로 저장돼요 · 마지막 저장 ${DEVDATA.savedAt ? new Date(DEVDATA.savedAt).toLocaleString('ko-KR') : '없음'}</div>`, items: [
    { icon: '🔍', label: '길 · 문 검사', onClick: () => devCheck(true) },
    { icon: '📂', label: '저장본 불러오기', onClick: () => { const d = G.dev; d.undo.push(JSON.stringify(DEVDATA)); DEVDATA = devLoad(); d.dirty = true; devRebuild(); toast('마지막 저장본을 불러왔어요'); } },
    { icon: '🗂', label: '백업 만들기', onClick: () => toast(devBackup() ? '🗂 백업했어요 (최근 5개 보관)' : '백업 실패') },
    { icon: '♻', label: '백업에서 복원', onClick: devRestoreMenu },
    { icon: '📤', label: 'JSON 내보내기', onClick: devExport },
    { icon: '📥', label: 'JSON 가져오기', onClick: devImport },
    { icon: '🧹', label: '이 장소만 초기화', onClick: () => openSheet({ title: `${M.name || '이 맵'} 편집을 지울까요?`, cols: 2, items: [{ icon: '🧹', label: '지우기', onClick: () => { devBackup('초기화 전 자동 백업'); devCommit(() => { delete DEVDATA.maps[M.id]; }, '이 장소를 기본 상태로 돌렸어요'); } }, { icon: '↩', label: '취소', onClick: () => { } }] }) },
    { icon: '🏝', label: '전체 기본 복원', onClick: () => openSheet({ title: '모든 편집을 지우고 기본 맵으로?', sub: '<div class="relneed">자동 백업을 남긴 뒤 지워요. 저장 버튼을 눌러야 확정돼요.</div>', cols: 2, items: [{ icon: '🏝', label: '기본으로 되돌리기', onClick: () => { devBackup('기본 복원 전 자동 백업'); devCommit(() => { DEVDATA = devEmpty(); }, '기본 맵으로 되돌렸어요 (저장해야 확정)'); } }, { icon: '↩', label: '취소', onClick: () => { } }] }) },
  ] });
}
function devRestoreMenu() {
  let list = []; try { list = JSON.parse(localStorage.getItem(DEV_BAK) || '[]'); } catch (e) { }
  if (!list.length) { toast('백업이 없어요'); return; }
  openSheet({ title: '♻ 백업에서 복원', cols: 1, items: list.map(b => ({ icon: '🗂', label: `${new Date(b.at).toLocaleString('ko-KR')}`, note: b.label, wide: true, onClick: () => { if (!devValid(b.data)) { toast('손상된 백업이에요'); return; } devCommit(() => { DEVDATA = devNorm(JSON.parse(JSON.stringify(b.data))); }, '백업을 불러왔어요 (저장해야 확정)'); } })) });
}
function devExport() {
  const txt = JSON.stringify(DEVDATA);
  openPanel('📤 맵 편집 내보내기', `<p class="psub">아래 글을 복사해 두면 다른 기기에서 「가져오기」로 똑같이 만들 수 있어요.</p><textarea id="devTxt" readonly style="width:100%;height:180px;font-size:11px">${esc(txt)}</textarea><div class="dbtns" style="grid-template-columns:1fr 1fr;margin-top:8px"><button id="devCopy">복사하기</button><button id="devFile">파일로 저장</button></div>`, (b) => {
    b.querySelector('#devCopy').onclick = () => { const t = b.querySelector('#devTxt'); t.select(); try { navigator.clipboard.writeText(txt).then(() => toast('복사했어요'), () => { document.execCommand('copy'); toast('복사했어요'); }); } catch (e) { document.execCommand('copy'); toast('복사했어요'); } };
    b.querySelector('#devFile').onclick = () => { const url = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(txt))); if (window.Android && Android.saveText) { toast(Android.saveText(txt, 'haewoldo-map.json') ? '📁 다운로드 폴더에 저장했어요' : '저장 실패'); return; } try { const a = document.createElement('a'); a.href = url; a.download = 'haewoldo-map.json'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { toast('복사하기를 써 주세요'); } };
  });
}
function devImport() {
  openPanel('📥 맵 편집 가져오기', `<p class="psub">내보낸 글을 붙여 넣거나 파일을 골라요. 지금 편집은 자동 백업돼요.</p><textarea id="devTxt" style="width:100%;height:160px;font-size:11px" placeholder='{"ver":1,"maps":{...}}'></textarea><input type="file" id="devFileIn" accept=".json,application/json" style="margin:6px 0"><div class="dbtns" style="grid-template-columns:1fr;margin-top:6px"><button id="devGo" class="ok">가져오기</button></div>`, (b) => {
    b.querySelector('#devFileIn').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { b.querySelector('#devTxt').value = r.result; }; r.readAsText(f); };
    b.querySelector('#devGo').onclick = () => {
      let d; try { d = JSON.parse(b.querySelector('#devTxt').value); } catch (e) { toast('JSON 형식이 아니에요'); return; }
      if (!devValid(d)) { toast('해월도 맵 편집 파일이 아니에요'); return; }
      devBackup('가져오기 전 자동 백업'); closePanel(); G.screen = true;
      devCommit(() => { DEVDATA = devNorm(d); }, '📥 가져왔어요 (저장해야 확정)');
    };
  });
}

/* ---------------- 메뉴 · 루프 연결 ---------------- */
function settingsMenu() {
  openSheet({ title: '⚙ 설정', cols: 2, items: [
    { icon: S.settings.music ? '🎵' : '🔇', label: S.settings.music ? '음악 끄기' : '음악 켜기', onClick: () => { S.settings.music = !S.settings.music; Sound.init(); Sound.setOn('music', S.settings.music); save(); } },
    { icon: S.settings.sfx ? '🔊' : '🔈', label: S.settings.sfx ? '효과음 끄기' : '효과음 켜기', onClick: () => { S.settings.sfx = !S.settings.sfx; Sound.init(); Sound.setOn('sfx', S.settings.sfx); save(); } },
    { icon: '🛠', label: S.settings.dev ? '개발자 모드 끄기' : '개발자 모드 켜기', note: S.settings.dev ? '켜짐' : '꺼짐', onClick: devToggleSetting },
    Object.assign({ icon: '🗺', label: '맵 편집 시작', note: devHasEdits() ? '편집 있음' : '', onClick: devStart }, S.settings.dev ? {} : { disabled: true, note: '개발자 모드 필요' }),
  ] });
}
const _mainMenuDev = mainMenu;
mainMenu = function () {
  _mainMenuDev();
  // 음악 · 효과음 칸을 「카메라」 · 「설정」으로 바꿔 한 화면에 들어가게
  const body = $('#sheetBody'); if (!body) return;
  const btns = [...body.querySelectorAll('.sitem')];
  const swap = (b, icon, label, fn) => { if (!b) return; b.querySelector('.si-icon').innerHTML = icon; b.querySelector('.si-label').textContent = label; const n = b.querySelector('.si-note'); if (n) n.remove(); b.onclick = () => { Sound.sfx('tap'); closeSheet(); fn(); }; };
  const mus = btns.find(b => /음악/.test(b.textContent)), sfx = btns.find(b => /효과음/.test(b.textContent));
  swap(mus, '📷', '카메라', () => cameraMenu());
  swap(sfx, '⚙', '설정', settingsMenu);
};
const _loopDev = loop;
loop = function (ts) { if (G.dev) G.screen = true; _loopDev(ts); };
const _startGameDev = startGame;
startGame = function (state, isNew) { G.dev = null; document.body.classList.remove('devOn'); _startGameDev(state, isNew); S.settings.dev = !!S.settings.dev; try { devNudgePlayer(); } catch (e) { } /* 지도 개편 · 편집으로 저장 위치가 막혔으면 옆 칸으로 */ };
window.addEventListener('DOMContentLoaded', () => { if (R.view) devBindInput(); else setTimeout(devBindInput, 0); });
