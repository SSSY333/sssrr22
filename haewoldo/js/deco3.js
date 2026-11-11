/* =====================================================================
   섬 · 일터 꾸미기 = 기본 도구 (사지 않음)
   · 집 안만 가구점에서 가구를 사서 꾸미고, 섬 장식 · 일터 실내 장식은 처음부터 전부 무료 · 개수 제한 없이
   · 🎨 꾸미기: 장식을 고르면 바로 놓기 (보관함 · 구매 없음), 「치우기」는 그냥 없앰
   · 개발자 모드 섬 편집 「＋ 추가」 안에도 장식 79가지를 종류별로 넣음 (섬 · 실내 모두)
   · 예전에 돈 주고 산 섬 장식은 한 번 환불
   ===================================================================== */
const YARD_FREE_MAX = 300;
/* ---------------- 🎨 꾸미기: 무료 ---------------- */
yardPicker = function (cat) {
  const indoor = !!M.interior;
  const cats = Object.keys(YARD_CATS).filter(c => indoor ? c === 'indoor' : c !== 'indoor');
  cat = cats.includes(cat) ? cat : cats[0];
  const tabs = `<div class="ptabs">${cats.map(k => `<button data-c="${k}" class="${k === cat ? 'on' : ''}">${YARD_CATS[k]}</button>`).join('')}</div>`;
  const keys = Object.keys(YARD).filter(k => YARD[k].cat === cat);
  openPanel(indoor ? `🏠 ${M.name} 꾸미기` : '🌳 섬 꾸미기', tabs + `<p class="psub">장식은 모두 무료예요. 골라서 놓을 곳을 누르면 몇 개든 놓을 수 있어요</p><div class="pgrid">${keys.map(k => `<button class="pcard" data-k="${k}"><img src="${yardPreview(k, 2)}"><b>${YARD[k].name}</b><small>${(() => { const [w, h] = yardFoot(k, 0); return `${w}×${h}칸${YARD[k].solid === false ? ' · 밟고 지나감' : ''}${YARD[k].light ? ' · 밤에 빛남' : ''}`; })()}</small></button>`).join('')}</div>`, (body) => {
    body.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => { Sound.sfx('tap'); yardPicker(b.dataset.c); });
    body.querySelectorAll('.pcard').forEach(b => b.onclick = () => { const k = b.dataset.k; Sound.sfx('tap'); closePanel(); if (!G.yard) return; G.yard.placing = k; G.yard.rot = 0; G.yard.sel = null; G.yard.cat = cat; yardBar(); toast(`「${YARD[k].name}」 놓을 곳을 눌러요 · 계속 누르면 여러 개`); });
  });
};
yardTap = function (x, y) {
  const Y = G.yard, st = yardState(), m = M;
  const hit = m.objects.find(o => o.kind === 'yd' && yFoot(o).some(([a, b]) => a === x && b === y));
  if (hit && !Y.placing) { Y.sel = hit.yid; yardBar(); return; }
  if (!Y.placing) { Y.sel = null; yardBar(); return; }
  if (st.placed.length >= YARD_FREE_MAX) { toast(`장식은 ${YARD_FREE_MAX}개까지 놓을 수 있어요`); return; }
  const k = Y.placing, why = yardCanPlace(k, x, y, Y.rot || 0); if (why) { toast(why); return; }
  st.placed.push({ id: 'y' + st.seq++, k, x, y, rot: Y.rot || 0, map: m.id === 'island' ? undefined : m.id }); yardApply(); Sound.sfx('tap'); save();
  yardBar();
  if (!S.paid.yardFirst) { S.paid.yardFirst = S.day; memRecent('decor', '섬을 꾸몄다'); typeof addRumor === 'function' && addRumor('decor', {}, { key: 'yard1' }); }
};
yardBar = function () {
  const Y = G.yard, bar = $('#yardBar'); if (!Y || !bar) return;
  const st = yardState(), sel = Y.sel && st.placed.find(p => p.id === Y.sel), here = st.placed.filter(p => (p.map || 'island') === M.id).length;
  const info = Y.placing ? `「${YARD[Y.placing].name}」 놓을 곳을 누르세요 · 다 놓았으면 「그만 놓기」` : sel ? `선택: ${YARD[sel.k].name} — 돌리기 · 치우기` : `${M.id === 'island' ? '섬' : M.name}에 놓은 장식 ${here}개 · 장식은 모두 무료`;
  bar.innerHTML = `<div id="yardInfo">${info}</div><div class="dbtns"><button data-a="pick" class="ok">🎨 장식 고르기</button><button data-a="rot" ${sel || Y.placing ? '' : 'disabled'}>↻ 돌리기</button>${Y.placing ? '<button data-a="stop">✋ 그만 놓기</button>' : `<button data-a="put" ${sel ? '' : 'disabled'}>🗑 치우기</button>`}<button data-a="done">✔ 끝내기</button></div>`;
  bar.querySelectorAll('button').forEach(b => b.onclick = () => { Sound.sfx('tap'); yardBtn(b.dataset.a); });
};
const _yardBtnFree = yardBtn;
yardBtn = function (a) {
  const Y = G.yard, st = yardState();
  if (a === 'stop') { Y.placing = null; yardBar(); return; }
  if (a === 'put') { const i = st.placed.findIndex(q => q.id === Y.sel); if (i < 0) return; const p = st.placed[i]; st.placed.splice(i, 1); Y.sel = null; yardApply(); yardBar(); save(); toast(`🗑 ${josa(YARD[p.k].name, '을', '를')} 치웠어요`); return; }
  return _yardBtnFree(a);
};
/* 가게 대신 바로 꾸미기 */
yardShop = function () { closePanel(); if (G.yard) yardPicker(); else yardStart(); };
/* 가구점 카탈로그에서 「섬 꾸미기」 탭 빼기 (집 가구만 팔기) */
const _furnShopMenuFree = furnShopMenu;
furnShopMenu = function (cat) { _furnShopMenuFree(cat); try { [...document.querySelectorAll('#panelBody .ptabs button')].filter(b => /섬 꾸미기/.test(b.textContent)).forEach(b => b.remove()); } catch (e) { } };
/* 시작 선물 · 구매 흔적 정리 + 예전에 산 장식 환불 */
const _yardStartFree = yardStart;
yardStart = function () { if (S && !S.paid.yardStarter) S.paid.yardStarter = -1; return _yardStartFree(); };
function yardRefund() {
  const st = yardState(); if (S.paid.yardFree) return; S.paid.yardFree = S.day;
  const starter = S.paid.yardStarter > 0 ? { potFlower: 2, benchWood: 1, whiteFence: 2, brickPath: 4, inPlant: 1 } : {};
  const bought = {}; for (const [k, n] of Object.entries(st.inv || {})) bought[k] = (bought[k] || 0) + n; for (const p of st.placed) bought[p.k] = (bought[p.k] || 0) + 1;
  let refund = 0; for (const [k, n] of Object.entries(bought)) { const paid = Math.max(0, n - (starter[k] || 0)); if (YARD[k]) refund += paid * YARD[k].price; }
  st.inv = {};
  if (refund > 0) { S.money += refund; setTimeout(() => toast(`🌳 섬 꾸미기가 무료가 됐어요 · 전에 산 장식값 ${fmtMoney(refund)}을 돌려드렸어요`), 3000); updateHUD(); }
}
const _startGameFree = startGame;
startGame = function (state, isNew) { _startGameFree(state, isNew); try { if (S) yardRefund(); } catch (e) { console.error(e); } };

/* ---------------- 개발자 모드 섬 편집 「＋ 추가」에 장식 전부 ---------------- */
DEV_KIND_NAME.yd = '꾸미기 장식';
const _devMakeObjYd = devMakeObj;
devMakeObj = function (e) {
  if (e.kind !== 'yd') return _devMakeObjYd(e);
  const F = YARD[e.k]; if (!F) return null; const rot = (e.rot | 0) & 3, [fw, fh] = yardFoot(e.k, rot);
  const o = { kind: 'yd', k: e.k, x: e.x, y: e.y, rot, fw, fh, solid: F.solid !== false, flat: !!F.flat, light: !!F.light || !!e.light, aid: e.aid };
  if (e.scale) o.scale = e.scale; return o;
};
const _devAddAtYd = devAddAt;
devAddAt = function (kind, x, y, extra) {
  if (!kind.startsWith('yd:')) return _devAddAtYd(kind, x, y, extra);
  const k = kind.slice(3), F = YARD[k], m = M; if (!F) return;
  if (!!F.indoor !== !!m.interior) { toast(F.indoor ? '실내 장식은 건물 안에 놓아요' : '야외 장식은 섬에 놓아요'); return; }
  const [fw, fh] = yardFoot(k, 0), tiles = []; for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) tiles.push([xx, yy]);
  for (const [a, b] of tiles) { if (!inMap(a, b, m)) { toast('맵 밖이에요'); return; } if (tileAt(a, b, m) === T.WATER) { toast('물 위에는 놓을 수 없어요'); return; } if (m.block[b * m.W + a]) { toast('이미 막혀 있는 칸이에요'); return; } }
  const e = { aid: devNewId(), kind: 'yd', k, x, y, solid: F.solid !== false };
  devConfirm(devGuard(m, F.solid === false ? [] : tiles), () => { devCommit(() => devMap(m.id).add.push(e), `＋ ${F.name} 추가`); G.dev.sel = M.objects.find(o => o.aid === e.aid) || null; devBarSel(); });
};
const _devToolClickYd = devToolClick;
devToolClick = function (t) {
  const r = _devToolClickYd(t);
  if (t === 'add' && G.dev && G.sheet) {
    const body = $('#sheetBody'), cats = Object.keys(YARD_CATS).filter(c => M.interior ? c === 'indoor' : c !== 'indoor');
    for (const c of cats.reverse()) {
      const b = document.createElement('button'); b.className = 'sitem'; b.innerHTML = `<span class="si-icon">${YARD_CATS[c].split(' ')[0]}</span><span class="si-label">${YARD_CATS[c].replace(/^\S+\s/, '')}</span><span class="si-note">장식 ${Object.keys(YARD).filter(k => YARD[k].cat === c).length}개</span>`;
      b.onclick = () => { Sound.sfx('tap'); devYardCat(c); };
      body.insertBefore(b, body.firstChild);
    }
  }
  return r;
};
function devYardCat(c) {
  const d = G.dev;
  openSheet({ title: `＋ ${YARD_CATS[c]}`, sub: '<div class="relneed">고른 뒤 땅을 누르면 놓여요. 무료 · 개수 제한 없음</div>', cols: 3, items: [...Object.keys(YARD).filter(k => YARD[k].cat === c).map(k => ({ icon: `<img class="si-img" src="${yardPreview(k, 1)}">`, label: YARD[k].name, onClick: () => { d.addKind = 'yd:' + k; d.tool = 'add'; devBarTools(); devInfo(`＋ ${YARD[k].name} — 놓을 곳을 눌러요 (계속 누르면 여러 개)`); } })), { icon: '↩', label: '뒤로', onClick: () => devToolClick('add') }] });
}
/* 편집에서 선택한 장식 이름 */
const _devBarSelYd = devBarSel;
devBarSel = function () { _devBarSelYd(); const s = G.dev && G.dev.sel; if (s && s.kind === 'yd' && YARD[s.k]) devInfo(`${YARD[s.k].name} · (${s.x}, ${s.y}) — 끌어서 옮겨요`); };
