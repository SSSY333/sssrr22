// 숙소 꾸미기: 가구 선택 → 끌어서 옮기기 · 회전 · 보관 · 꺼내기. 배치할 때마다 겹침/통로/출구를 검사한다.
'use strict';
PX.Decor = (() => {
  const U = PX.U, St = PX.St, W = PX.W, el = U.el;
  const FIXED = ['terminal', 'photo'];
  let active = false, m = null, sel = null, drag = null, bar = null, before = null;

  function validate(map) {
    const occ = new Map();
    for (const o of map.objs) {
      if (o.kind !== 'furn') continue;
      if (o.x < 0 || o.y < 0 || o.x + o.fw > map.w || o.y + o.fd > map.h) return { ok: false, reason: '방 밖으로 나갔어요', o };
      if (!o.blocks) continue;
      for (let y = o.y; y < o.y + o.fd; y++) for (let x = o.x; x < o.x + o.fw; x++) {
        const k = x + ',' + y;
        if (occ.has(k)) return { ok: false, reason: `${PX.U.josa(o.f.name, '이')} ${PX.U.josa(occ.get(k).f.name, '와')} 겹쳐요`, o };
        occ.set(k, o);
      }
    }
    const e = map.exit;
    for (const [x, y] of [[e.x, e.y], [e.x, e.y - 1]]) if (occ.has(x + ',' + y)) return { ok: false, reason: '출입구 앞은 비워 두세요', o: occ.get(x + ',' + y) };
    // 통로 검사
    const save = map.walk.slice();
    map.walk.fill(1);
    for (const o of occ.values()) for (let y = o.y; y < o.y + o.fd; y++) for (let x = o.x; x < o.x + o.fw; x++) map.walk[y * map.w + x] = 0;
    const reach = PX.Path.reachableSet(map, e.x, e.y);
    let bad = null;
    for (const o of map.objs) {
      if (o.kind !== 'furn' || !(o.use || (o.seats && o.seats.length))) continue;
      const a = W.accessTile(map, o);
      if (!a || !reach[a.y * map.w + a.x]) { bad = o; break; }
    }
    map.walk.set(save);
    if (bad) return { ok: false, reason: `${bad.f.name}에 다가갈 길이 막혀요`, o: bad };
    return { ok: true };
  }
  const layoutOf = map => map.objs.filter(o => o.kind === 'furn').map(o => [o.fid, o.x, o.y, o.r, o.spot || null]);
  // 저장된 배치를 맵에 적용
  function applyLayout(map, layout) {
    if (!layout) return;
    map.objs = map.objs.filter(o => o.kind !== 'furn');
    layout.forEach(([fid, x, y, r, spot], i) => W.addFurn(map, fid, x, y, r, spot, 'h' + i));
    W.rebuildWalk(map);
  }

  function start() {
    const G = PX.Game;
    if (!PX.MAPS[G.mapId].home) return;
    if (PX.Cap.mode === 'visit' || PX.Cap.mode === 'stay') { PX.UI.toast('손님이 있을 땐 가구를 옮길 수 없어요'); return; }
    active = true; m = W.maps[G.mapId]; sel = null;
    before = layoutOf(m);
    G.player.leaveSeat();
    G.modal++;
    bar = el('div', { id: 'decorbar' },
      el('p', { class: 'dhint' }, '가구를 눌러 고르고 끌어서 옮기세요.'),
      el('div', { class: 'dbtns' },
        btn('⟳ 회전', rotate), btn('📦 보관', store), btn('➕ 꺼내기', takeOut), btn('↩ 되돌리기', revert), btn('✔ 완료', done, 'ok')));
    document.body.append(bar);
    hint();
  }
  const btn = (t, fn, cls) => { const b = el('button', { class: cls || '' }, t); b.onclick = fn; return b; };
  function hint(msg) { if (bar) bar.querySelector('.dhint').textContent = msg || (sel ? `${sel.f.name} 선택됨 · 끌어서 옮기기 / 회전 / 보관` : '가구를 눌러 고르고 끌어서 옮기세요.'); }

  function objAt(tx, ty) {
    const list = m.objs.filter(o => o.kind === 'furn' && tx >= o.x && tx < o.x + o.fw && ty >= o.y && ty < o.y + o.fd);
    return list.sort((a, b) => (b.blocks ? 1 : 0) - (a.blocks ? 1 : 0))[0] || null;
  }
  // 포인터 (main에서 내부 좌표로 전달)
  function down(sx, sy) {
    const [wx, wy] = W.toWorld(sx, sy);
    const o = objAt(Math.floor(wx), Math.floor(wy));
    if (o) { sel = o; drag = { ox: o.x, oy: o.y, dx: wx - o.x, dy: wy - o.y, moved: false }; hint(); }
    else { sel = null; hint(); }
  }
  function move(sx, sy) {
    if (!drag || !sel) return;
    const [wx, wy] = W.toWorld(sx, sy);
    const nx = Math.round(wx - drag.dx), ny = Math.round(wy - drag.dy);
    if (nx !== sel.x || ny !== sel.y) { sel.x = nx; sel.y = ny; W.refreshObj(m, sel); drag.moved = true; }
  }
  function up() {
    if (!drag || !sel) { drag = null; return; }
    if (drag.moved) {
      const v = validate(m);
      if (!v.ok) { PX.UI.toast('⚠️ ' + v.reason); sel.x = drag.ox; sel.y = drag.oy; W.refreshObj(m, sel); }
      W.rebuildWalk(m);
    }
    drag = null;
  }
  function rotate() {
    if (!sel) { hint('먼저 가구를 눌러 고르세요.'); return; }
    const old = [sel.r, sel.x, sel.y];
    sel.r = (sel.r + 1) % 4; W.refreshObj(m, sel);
    let v = validate(m);
    if (!v.ok) { // 회전 후 자리를 조금 옮겨서 맞춰 보기
      for (const [dx, dy] of [[0, -1], [-1, 0], [0, 1], [1, 0], [-1, -1]]) { sel.x = old[1] + dx; sel.y = old[2] + dy; W.refreshObj(m, sel); v = validate(m); if (v.ok) break; }
    }
    if (!v.ok) { PX.UI.toast('⚠️ ' + v.reason); [sel.r, sel.x, sel.y] = old; W.refreshObj(m, sel); }
    W.rebuildWalk(m);
  }
  function store() {
    if (!sel) { hint('먼저 가구를 눌러 고르세요.'); return; }
    if (FIXED.includes(sel.fid)) { PX.UI.toast('이 가구는 숙소에 고정돼 있어요'); return; }
    if ((sel.f.use === 'bed') && m.objs.filter(o => o.kind === 'furn' && o.f.use === 'bed').length <= 1) { PX.UI.toast('침대는 하나는 있어야 해요'); return; }
    m.objs.splice(m.objs.indexOf(sel), 1);
    const item = sel.fid === 'stonedisplay' ? 'capStone' : (Object.values(PX.ITEMS).find(i => i.furn === sel.fid && !i.id.startsWith('f_')) || { id: 'f_' + sel.fid }).id;
    St.addItem(item); PX.UI.toast(`📦 ${PX.U.josa(sel.f.name, '을')} 보관함에 넣었어요`);
    sel = null; W.rebuildWalk(m); hint();
  }
  function takeOut() {
    const S = St.S;
    const ids = Object.keys(S.inv).filter(k => S.inv[k] > 0 && (PX.ITEMS[k].furn || k === 'capStone'));
    if (!ids.length) { PX.UI.toast('보관 중인 가구가 없어요. PX에서 살 수 있어요.'); return; }
    PX.UI.menu('가구 꺼내기', ids.map(k => ({ t: `${PX.ITEMS[k].icon} ${k === 'capStone' ? '대위의 돌 진열대' : PX.ITEMS[k].name} ×${S.inv[k]}`, fn: () => place(k) })));
  }
  function place(itemId) {
    const fid = itemId === 'capStone' ? 'stonedisplay' : PX.ITEMS[itemId].furn;
    const o = W.addFurn(m, fid, 0, 0, 0, null, 'n' + Date.now());
    // 빈자리 찾기 (방 가운데부터)
    const cx = Math.floor(m.w / 2), cy = Math.floor(m.h / 2);
    const cand = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) cand.push([x, y, Math.hypot(x - cx, y - cy)]);
    cand.sort((a, b) => a[2] - b[2]);
    for (const [x, y] of cand) for (const r of [0, 1, 2, 3]) { o.x = x; o.y = y; o.r = r; W.refreshObj(m, o); if (validate(m).ok) { St.addItem(itemId, -1); sel = o; W.rebuildWalk(m); hint(); PX.UI.toast(`${PX.U.josa(o.f.name, '을')} 놓았어요. 끌어서 옮겨 보세요.`); return; } }
    m.objs.splice(m.objs.indexOf(o), 1);
    PX.UI.toast('놓을 자리가 없어요. 다른 가구를 보관해 보세요.');
  }
  function revert() { applyLayout(m, before); sel = null; hint('처음 배치로 되돌렸어요.'); }
  function done() {
    const v = validate(m);
    if (!v.ok) { PX.UI.toast('⚠️ ' + v.reason); sel = v.o; return; }
    St.S.homeLayout = layoutOf(m);
    // 같은 배치를 두 숙소 맵에 공유하지 않음: 현재 숙소만
    St.S.homeMap = m.id;
    end();
    St.save();
    PX.UI.toast('🛋️ 숙소 배치를 저장했어요');
  }
  function end() {
    active = false; sel = null; drag = null;
    if (bar) bar.remove(); bar = null;
    PX.Game.modal--;
    const p = PX.Game.player; const t = PX.Path.nearestWalkable(m, p.x, p.y); if (t) { p.x = t[0] + 0.5; p.y = t[1] + 0.5; }
  }
  // 렌더 오버레이: 선택 가구 바닥 표시
  function overlay(g) {
    if (!active || !sel) return;
    const v = validate(m);
    const col = v.ok ? 'rgba(120,255,180,0.45)' : 'rgba(255,90,90,0.5)';
    for (let y = sel.y; y < sel.y + sel.fd; y++) for (let x = sel.x; x < sel.x + sel.fw; x++) {
      const a = W.toScreen(x, y), b = W.toScreen(x + 1, y), c = W.toScreen(x + 1, y + 1), d = W.toScreen(x, y + 1);
      PX.G.fillPoly(g, [a, b, c, d], col);
    }
  }
  return { start, down, move, up, overlay, validate, applyLayout, layoutOf, get active() { return active; } };
})();
