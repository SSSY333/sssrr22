// 꾸미기 · 맵 편집
//  - 내 숙소: 소지품(구매한 가구)으로 꾸미기, 치우면 보관함으로
//  - 그 밖의 모든 맵: 장식 카탈로그에서 자유롭게 놓기 · 옮기기 · 회전 · 치우기 (건물은 그대로)
// 놓을 때마다 겹침 · 출입구 · 통로(문 · 출구 · 연결 통로 · 쓸 수 있는 물건까지 길이 이어지는지)를 검사한다.
'use strict';
PX.Decor = (() => {
  const U = PX.U, St = PX.St, W = PX.W, el = U.el;
  const OUT_CAT = ['tree', 'tree2', 'bush', 'glowflower', 'flowerbed', 'planter', 'bigplant', 'plant', 'streetlamp', 'lantern', 'benchout', 'logseat', 'beachchair', 'parasol', 'cafetable', 'fountain', 'kiosk', 'telescope', 'vending', 'campfire', 'dometent', 'icesculpture', 'crystalcluster', 'rock', 'rockbig', 'crate', 'crates', 'sandbags', 'railing', 'neonsign', 'stall', 'pullup', 'target'];
  const IN_CAT = ['plant', 'bigplant', 'lamp', 'rug', 'rug_blue', 'chair', 'stool', 'sofa', 'sofa_green', 'bench', 'cafetable', 'table', 'sidetable', 'shelf', 'cabinet', 'tv', 'arcade', 'gametable', 'vending', 'locker', 'crate', 'crates', 'mirror', 'aquarium', 'glassvase', 'bunnyplush', 'cooler', 'pullup', 'armtable'];
  let active = false, m = null, sel = null, drag = null, bar = null, before = null, homeMode = false;
  const locked = o => !!(o.spot || o.event || o.desert || ['shuttle', 'event', 'work', 'meal', 'shop'].includes(o.use) || ['terminal', 'photo'].includes(o.fid));

  function entryPoint(map) {
    if (map.kind === 'in') return [map.exit.x, map.exit.y];
    const a = { base: [31, 58], dome: [23, 40], plaza: [25, 47] }[map.id] || map.def.arrive;
    return a;
  }
  function validate(map) {
    const occ = new Map(), base = W.baseGrid(map);
    for (const o of map.objs) {
      if (o.kind !== 'furn' || o.desert || o.hidden) continue;
      if (o.x < 0 || o.y < 0 || o.x + o.fw > map.w || o.y + o.fd > map.h) return { ok: false, reason: '맵 밖으로 나갔어요', o };
      if (!o.blocks) continue;
      for (let y = o.y; y < o.y + o.fd; y++) for (let x = o.x; x < o.x + o.fw; x++) {
        if (!base[y * map.w + x]) return { ok: false, reason: `${o.f.name}이(가) 건물·벽·물 위에 걸쳐요`.replace('이(가)', U.hasBatchim(o.f.name) ? '이' : '가'), o };
        const k = x + ',' + y;
        if (occ.has(k)) return { ok: false, reason: `${U.josa(o.f.name, '이')} ${U.josa(occ.get(k).f.name, '와')} 겹쳐요`, o };
        occ.set(k, o);
      }
    }
    const must = [];
    if (map.kind === 'in') { const e = map.exit; must.push([e.x, e.y, '출입구'], [e.x, e.y - 1, '출입구 앞']); }
    for (const d of map.doors || []) must.push([d.x, d.y, `${d.name} 문 앞`]);
    for (const l of map.links || []) must.push([Math.floor((l.x0 + l.x1) / 2), l.y0, '연결 통로']);
    for (const [x, y, n] of must) if (occ.has(x + ',' + y)) return { ok: false, reason: `${n}은 비워 두세요`, o: occ.get(x + ',' + y) };
    const save = map.walk.slice();
    map.walk.set(base);
    for (const o of occ.values()) for (let y = o.y; y < o.y + o.fd; y++) for (let x = o.x; x < o.x + o.fw; x++) map.walk[y * map.w + x] = 0;
    const [sx, sy] = entryPoint(map);
    const reach = PX.Path.reachableSet(map, sx, sy);
    let bad = null;
    for (const [x, y, n] of must) if (!reach[y * map.w + x] && n !== '출입구 앞') { bad = { f: { name: n } }; break; }
    if (!bad) for (const o of map.objs) {
      if (o.kind !== 'furn' || o.hidden || o.desert || !(o.use || (o.seats && o.seats.length))) continue;
      const a = W.accessTile(map, o);
      if (!a || !reach[a.y * map.w + a.x]) { bad = o; break; }
    }
    map.walk.set(save);
    if (bad) return { ok: false, reason: `${bad.f.name}(으)로 가는 길이 막혀요`.replace('(으)로', U.hasBatchim(bad.f.name) && !/ㄹ$/.test(bad.f.name) ? '으로' : '로'), o: bad.kind ? bad : null };
    return { ok: true };
  }
  const layoutOf = map => map.objs.filter(o => o.kind === 'furn' && !o.desert).map(o => [o.fid, o.x, o.y, o.r, o.spot || null, o.event || null]);
  function applyLayout(map, layout) {
    if (!layout) return;
    map.objs = map.objs.filter(o => o.kind !== 'furn' || o.desert);
    layout.forEach(([fid, x, y, r, spot, ev], i) => { if (!PX.FURN[fid]) return; const o = W.addFurn(map, fid, x, y, r, spot, 'h' + i); if (ev) o.event = ev; });
    W.rebuildWalk(map);
    if (St.S) W.updateEvents(map, St.S.time, St.S.time.min);
  }
  function applyAll() { // 저장된 맵 편집 모두 적용
    const S = St.S;
    for (const id in (S.mapEdits || {})) if (W.maps[id]) applyLayout(W.maps[id], S.mapEdits[id]);
  }

  function start() {
    const G = PX.Game;
    homeMode = !!PX.MAPS[G.mapId].home;
    if (homeMode && (PX.Cap.mode === 'visit' || PX.Cap.mode === 'stay')) { PX.UI.toast('손님이 있을 땐 가구를 옮길 수 없어요'); return; }
    active = true; m = W.maps[G.mapId]; sel = null;
    before = layoutOf(m);
    G.player.leaveSeat();
    G.modal++;
    bar = el('div', { id: 'decorbar' },
      el('p', { class: 'dhint' }, ''),
      el('div', { class: 'dbtns' }, btn('⟳ 회전', rotate), btn(homeMode ? '📦 보관' : '🗑️ 치우기', store), btn('➕ ' + (homeMode ? '꺼내기' : '추가'), takeOut), btn('↩ 되돌리기', revert), btn('✔ 완료', done, 'ok')));
    document.body.append(bar);
    hint();
  }
  const btn = (t, fn, cls) => { const b = el('button', { class: cls || '' }, t); b.onclick = fn; return b; };
  function hint(msg) { if (bar) bar.querySelector('.dhint').textContent = msg || (sel ? `${sel.f.name} 선택됨 · 끌어서 옮기기 / 회전 / ${homeMode ? '보관' : '치우기'}` : (homeMode ? '가구를 눌러 고르고 끌어서 옮기세요.' : '🛠️ 맵 편집: 장식을 눌러 고르고 끌어서 옮기세요. 건물은 움직이지 않아요.')); }
  function objAt(tx, ty) {
    const list = m.objs.filter(o => o.kind === 'furn' && !o.desert && !o.hidden && tx >= o.x && tx < o.x + o.fw && ty >= o.y && ty < o.y + o.fd);
    return list.sort((a, b) => (b.blocks ? 1 : 0) - (a.blocks ? 1 : 0))[0] || null;
  }
  function down(sx, sy) {
    const pk = W.pick(sx, sy);
    let o = pk && pk.o && pk.o.kind === 'furn' ? pk.o : null;
    const [wx, wy] = W.toWorld(sx, sy);
    if (!o) o = objAt(Math.floor(wx), Math.floor(wy));
    if (o && locked(o)) { PX.UI.toast('🔒 ' + o.f.name + ' — 사람들이 쓰는 자리라 고정돼 있어요'); sel = null; hint(); return; }
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
    if (drag.moved) { const v = validate(m); if (!v.ok) { PX.UI.toast('⚠️ ' + v.reason); sel.x = drag.ox; sel.y = drag.oy; W.refreshObj(m, sel); } W.rebuildWalk(m); }
    drag = null;
  }
  function rotate() {
    if (!sel) { hint('먼저 물건을 눌러 고르세요.'); return; }
    const old = [sel.r, sel.x, sel.y];
    sel.r = (sel.r + 1) % 4; W.refreshObj(m, sel);
    let v = validate(m);
    if (!v.ok) for (const [dx, dy] of [[0, -1], [-1, 0], [0, 1], [1, 0], [-1, -1]]) { sel.x = old[1] + dx; sel.y = old[2] + dy; W.refreshObj(m, sel); v = validate(m); if (v.ok) break; }
    if (!v.ok) { PX.UI.toast('⚠️ ' + v.reason); [sel.r, sel.x, sel.y] = old; W.refreshObj(m, sel); }
    W.rebuildWalk(m);
  }
  function store() {
    if (!sel) { hint('먼저 물건을 눌러 고르세요.'); return; }
    if (sel.f.use === 'bed' && m.objs.filter(o => o.kind === 'furn' && o.f.use === 'bed').length <= 1 && homeMode) { PX.UI.toast('침대는 하나는 있어야 해요'); return; }
    m.objs.splice(m.objs.indexOf(sel), 1);
    if (homeMode) { const item = sel.fid === 'stonedisplay' ? 'capStone' : (Object.values(PX.ITEMS).find(i => i.furn === sel.fid && !i.id.startsWith('f_')) || { id: 'f_' + sel.fid }).id; St.addItem(item); PX.UI.toast(`📦 ${U.josa(sel.f.name, '을')} 보관함에 넣었어요`); }
    else PX.UI.toast(`🗑️ ${U.josa(sel.f.name, '을')} 치웠어요`);
    sel = null; W.rebuildWalk(m); hint();
  }
  function takeOut() {
    const S = St.S;
    if (homeMode) {
      const ids = Object.keys(S.inv).filter(k => S.inv[k] > 0 && (PX.ITEMS[k].furn || k === 'capStone'));
      if (!ids.length) { PX.UI.toast('보관 중인 가구가 없어요. PX에서 살 수 있어요.'); return; }
      PX.UI.menu('가구 꺼내기', ids.map(k => ({ t: `${PX.ITEMS[k].icon} ${k === 'capStone' ? '대위의 돌 진열대' : PX.ITEMS[k].name} ×${S.inv[k]}`, fn: () => place(k === 'capStone' ? 'stonedisplay' : PX.ITEMS[k].furn, k) })));
      return;
    }
    const cat = (m.kind === 'out' ? OUT_CAT : IN_CAT).filter(id => PX.FURN[id]);
    PX.UI.menu('장식 추가 (무료)', cat.map(id => ({ t: PX.FURN[id].name, sub: `${PX.FURN[id].w}×${PX.FURN[id].d}`, fn: () => place(id, null) })));
  }
  function place(fid, itemId) {
    const o = W.addFurn(m, fid, 0, 0, 0, null, 'n' + Date.now());
    const p = PX.Game.player, cx = Math.floor(p.x), cy = Math.floor(p.y);
    const cand = [];
    for (let y = Math.max(0, cy - 8); y < Math.min(m.h, cy + 8); y++) for (let x = Math.max(0, cx - 8); x < Math.min(m.w, cx + 8); x++) cand.push([x, y, Math.hypot(x - cx, y - cy)]);
    cand.sort((a, b) => a[2] - b[2]);
    for (const [x, y] of cand) { if (x === cx && y === cy) continue; for (const r of [0, 1]) { o.x = x; o.y = y; o.r = r; W.refreshObj(m, o); if (validate(m).ok) { if (itemId) St.addItem(itemId, -1); sel = o; W.rebuildWalk(m); hint(); PX.UI.toast(`${U.josa(o.f.name, '을')} 놓았어요. 끌어서 옮겨 보세요.`); return; } } }
    m.objs.splice(m.objs.indexOf(o), 1);
    PX.UI.toast('근처에 놓을 자리가 없어요. 조금 넓은 곳으로 가서 다시 해 보세요.');
  }
  function revert() { applyLayout(m, before); sel = null; hint('처음 배치로 되돌렸어요.'); }
  function done() {
    const v = validate(m);
    if (!v.ok) { PX.UI.toast('⚠️ ' + v.reason); sel = v.o || null; return; }
    const S = St.S;
    if (homeMode) { S.homeLayout = layoutOf(m); S.homeMap = m.id; }
    else { S.mapEdits = S.mapEdits || {}; S.mapEdits[m.id] = layoutOf(m); }
    end();
    PX.A.indexSpots();
    St.save();
    PX.UI.toast(homeMode ? '🛋️ 숙소 배치를 저장했어요' : `🛠️ ${m.name} 편집을 저장했어요`);
  }
  function end() {
    active = false; sel = null; drag = null;
    if (bar) bar.remove(); bar = null;
    PX.Game.modal--;
    const p = PX.Game.player; const t = PX.Path.nearestWalkable(m, p.x, p.y); if (t && !W.walkable(m, Math.floor(p.x), Math.floor(p.y))) { p.x = t[0] + 0.5; p.y = t[1] + 0.5; }
  }
  function overlay(g) {
    if (!active || !sel) return;
    const v = validate(m);
    const col = v.ok ? 'rgba(120,255,180,0.45)' : 'rgba(255,90,90,0.5)';
    for (let y = sel.y; y < sel.y + sel.fd; y++) for (let x = sel.x; x < sel.x + sel.fw; x++) {
      const a = W.toScreen(x, y), b = W.toScreen(x + 1, y), c = W.toScreen(x + 1, y + 1), d = W.toScreen(x, y + 1);
      PX.G.fillPoly(g, [a, b, c, d], col);
    }
  }
  return { start, down, move, up, overlay, validate, applyLayout, applyAll, layoutOf, get active() { return active; } };
})();
