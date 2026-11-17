/* =====================================================================
   꾸미기 하나로 묶기
   · 섬 · 일터 꾸미기 = 「🛠 섬 편집」 하나 (따로 있던 섬 꾸미기 모드 · 개발자 모드 켜기 없앰)
   · 메뉴 「🎨 꾸미기」 → 집 꾸미기(가구 · 벽지 · 바닥) / 섬 · 일터 편집 / 가구점, 이 세 가지만
   · 예전에 섬 꾸미기로 놓은 장식은 섬 편집 데이터로 옮김 (그대로 보이고, 편집에서 옮기기 · 지우기 가능)
   ===================================================================== */
/* 편집은 누구나 (개발자 모드 켜기 불필요) */
const _devStartEdit = devStart;
devStart = function () { if (S) S.settings.dev = true; if (G.yard) yardEnd(); return _devStartEdit(); };
yardStart = function () { devStart(); };
yardShop = function () { closePanel(); devStart(); };
/* 섬 꾸미기로 놓았던 장식 → 섬 편집으로 옮기기 (한 번) */
function editMigrateYard() {
  const st = yardState(); if (!st.placed.length) return;
  for (const p of st.placed) { const F = YARD[p.k]; if (!F) continue; devMap(p.map || 'island').add.push({ aid: devNewId(), kind: 'yd', k: p.k, x: p.x, y: p.y, rot: p.rot || 0, solid: F.solid !== false }); }
  const n = st.placed.length; st.placed = []; st.inv = {};
  devSave(); devRebuild(); save();
  setTimeout(() => toast(`🛠 섬 꾸미기 장식 ${n}개를 「섬 편집」으로 옮겼어요 — 메뉴 → 🎨 꾸미기에서 같이 고쳐요`), 3200);
}
const _startGameEdit = startGame;
startGame = function (state, isNew) { _startGameEdit(state, isNew); try { editMigrateYard(); } catch (e) { console.error(e); } };

/* 집 꾸미기: 집 밖이면 집으로 들어가서 */
function editHome() {
  if (G.player.map === 'in_home') { if (typeof openDecor === 'function') openDecor(); return; }
  const b = MAPS.island.buildings.find(x => x.id === 'home');
  if (G.player.map !== 'island' && b) { toast('집으로 가서 꾸며요'); }
  const m = MAPS.in_home; goMap('in_home', m.spawn.door[0], m.spawn.door[1]); setTimeout(() => { if (G.player.map === 'in_home' && typeof openDecor === 'function') openDecor(); }, 1400);
}
function editMenu() {
  const wm = typeof yardWorkMap === 'function' ? yardWorkMap() : null, here = G.player.map;
  openSheet({ title: '🎨 꾸미기', sub: '<div class="relneed">집은 가구점 가구로 · 섬과 일터는 「섬 편집」에서 무료 장식으로 꾸며요</div>', cols: 3, items: [
    { icon: '🛋', label: '집 꾸미기', note: '가구 · 벽지 · 바닥', onClick: editHome },
    { icon: '🛠', label: here !== 'island' && here !== 'in_home' && MAPS[here] && MAPS[here].interior ? `${MAPS[here].name} 편집` : '섬 편집', note: wm ? '섬 · 일터 장식' : '섬 장식 · 길 · 나무', onClick: () => { if (here === 'in_home') { const b = MAPS.island.buildings.find(x => x.id === 'home'); goMap('island', b.doorTile[0] + 0.5, b.doorTile[1] + 0.5); setTimeout(devStart, 1300); } else devStart(); } },
    { icon: '🛒', label: '가구점', note: '집 가구 사기', onClick: () => furnShopMenu() },
  ] });
}
/* 메뉴 정리: 첫 화면 「꾸미기」 하나, 집 메뉴에서 꾸미기 항목 빼기, 설정에서 개발자 모드 빼기 */
const _openSheetEdit = openSheet;
openSheet = function (o) {
  if (o && o.items) {
    if (o.title === '메뉴') { const items = o.items.filter(i => i.label !== '꾸미기'); items.splice(5, 0, { icon: '🎨', label: '꾸미기', note: '집 · 섬 · 일터', onClick: editMenu }); o = Object.assign({}, o, { items }); }
    if (o.title === '🏠 집') setTimeout(() => { if (!G.sheet || $('#sheetTitle').textContent !== '🏠 집') return; document.querySelectorAll('#sheetBody .sitem').forEach(b => { const l = b.querySelector('.si-label'); if (l && ['가구 배치', '벽지 · 바닥', '섬 꾸미기', '가구점 카탈로그'].includes(l.textContent)) b.remove(); }); }, 0);
    if (o.title === '🏠 집') o = Object.assign({}, o, { items: o.items.filter(i => !['가구 배치', '벽지 · 바닥', '섬 꾸미기', '가구점 카탈로그'].includes(i.label)) });
    if (o.title === '⚙ 설정') o = Object.assign({}, o, { items: [...o.items.filter(i => !/개발자 모드|맵 편집/.test(i.label)), { icon: '🛠', label: '섬 편집', note: '꾸미기와 같아요', onClick: devStart }] });
  }
  return _openSheetEdit(o);
};
/* 일터 안 행동 버튼 · 집 안 「꾸미기」는 그대로, 일터 꾸미기는 편집으로 */
const _computeActionEdit = computeAction;
computeAction = function () {
  const a = _computeActionEdit();
  const fix = (c) => { if (c && c.icon === '🎨' && c.fn === yardStart) c.fn = devStart; };
  if (a) { fix(a); if (a.cands) a.cands.forEach(fix); }
  return a;
};
/* ---------------- 편집 「＋ 추가」: 묶음만 보여서 덜 복잡하게 ---------------- */
/* 이모지 대신 실제 모양 그림 (한 번 그려 두고 재사용) */
const _editPrevCache = {};
function editObjPreview(k) {
  if (k in _editPrevCache) return _editPrevCache[k];
  let url = null;
  try {
    const sp = objSprite({ kind: k, v: 0, x: 0, y: 0, solid: true });
    if (sp && sp.c && sp.c.width) { const sc = Math.max(1, Math.min(3, Math.floor(48 / Math.max(sp.c.width, sp.c.height)) || 1)), c = mkCanvas(sp.c.width * sc, sp.c.height * sc), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(sp.c, 0, 0, c.width, c.height); url = c.toDataURL(); }
  } catch (e) { url = null; }
  return (_editPrevCache[k] = url);
}
function editFurnPreview(k) { const key = 'F:' + k; if (key in _editPrevCache) return _editPrevCache[key]; let url = null; try { url = furnPreview(k, 0, 2); } catch (e) { } return (_editPrevCache[key] = url); }
function editYardPreview(k) { const key = 'Y:' + k; if (key in _editPrevCache) return _editPrevCache[key]; let url = null; try { url = yardPreview(k, 1); } catch (e) { } return (_editPrevCache[key] = url); }
const editImg = (url, fb) => url ? `<img class="si-img" src="${url}">` : fb;
const _devToolClickEdit = devToolClick;
devToolClick = function (t) {
  const d = G.dev; if (!d) return;
  if (t !== 'add') return _devToolClickEdit(t);
  d.tool = 'add'; d.sel = null; devBarSel(); devBarTools();
  const inside = !!M.interior, groups = [];
  if (!inside) groups.push({ icon: editImg(editObjPreview('tree'), '🌳'), label: '자연 · 기본', note: `나무 · 바위 · 벤치 · 가로등 ${DEV_ADD.length}개`, onClick: () => openSheet({ title: '＋ 자연 · 기본', cols: 4, items: [...DEV_ADD.map(([k, n, i]) => ({ icon: editImg(editObjPreview(k), i), label: n, onClick: () => { d.addKind = k; devInfo(`＋ ${n} — 놓을 곳을 눌러요`); } })), { icon: '↩', label: '뒤로', onClick: () => devToolClick('add') }] }) });
  for (const c of Object.keys(YARD_CATS).filter(c => inside ? c === 'indoor' : c !== 'indoor')) groups.push({ icon: (() => { const k0 = Object.keys(YARD).find(k => YARD[k].cat === c); return editImg(k0 && editYardPreview(k0), YARD_CATS[c].split(' ')[0]); })(), label: YARD_CATS[c].replace(/^\S+\s/, ''), note: `${Object.keys(YARD).filter(k => YARD[k].cat === c).length}개`, onClick: () => devYardCat(c) });
  if (inside) groups.push({ icon: editImg(editFurnPreview('sofa') || editFurnPreview(Object.keys(FURN)[0]), '🛋'), label: '가구', note: '가게 · 건물 안 가구', onClick: () => openSheet({ title: '＋ 가구', cols: 4, items: [...Object.keys(FURN).filter(k => !FURN[k].wall && !FURN[k].season).slice(0, 40).map(k => ({ icon: editImg(editFurnPreview(k), '🛋'), label: FURN[k].name, onClick: () => { d.addKind = 'furn:' + k; devInfo(`＋ ${FURN[k].name} — 놓을 곳을 눌러요`); } })), { icon: '↩', label: '뒤로', onClick: () => devToolClick('add') }] }) });
  openSheet({ title: '＋ 무엇을 놓을까요?', sub: '<div class="relneed">모두 무료 · 개수 제한 없음. 고른 뒤 땅을 누르면 놓이고, 계속 누르면 여러 개</div>', cols: 3, items: groups });
  devInfo('＋ 묶음을 골라요');
};
