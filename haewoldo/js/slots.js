/* =====================================================================
   저장 칸 두 개 — 저장 1 · 저장 2 를 따로 이어 하기 · 새로 시작
   · 저장 1 = 예전 저장 그대로 (haewoldo-village-v4), 저장 2 = 새 칸
   · 칸마다 연애 모드(🌷 일반 · 🥵 아찔한)가 따로 기록돼요
   ===================================================================== */
const SLOT_KEYS = { 1: 'haewoldo-village-v4', 2: 'haewoldo-village-v4-s2' };
const SLOT_LAST = 'haewoldo-slot-last';
G.slot = 1;
try { G.slot = +localStorage.getItem(SLOT_LAST) === 2 ? 2 : 1; } catch (e) { }
function slotKey(n = G.slot) { return SLOT_KEYS[n === 2 ? 2 : 1]; }
function slotRead(n) {
  try {
    const s4 = JSON.parse(localStorage.getItem(slotKey(n)) || 'null');
    if (s4 && s4.v === 4 && JOBS[s4.job]) return s4;
    if (n === 1) { const s3 = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s3 && s3.v === 3 && JOBS[s3.job]) { s3._migrated = true; return s3; } }
  } catch (e) { }
  return null;
}
save = function () {
  if (!S || !G.started) return false;
  S.map = G.player.map; S.p = { x: G.player.x, y: G.player.y };
  S.d = { x: G.det.x, y: G.det.y, vis: G.det.visible, map: G.det.map };
  S.savedAt = Date.now(); S.slot = G.slot;
  showSaving();
  for (let i = 0; i < 12; i++) {
    try { localStorage.setItem(slotKey(), JSON.stringify(S)); try { localStorage.setItem(SLOT_LAST, String(G.slot)); } catch (e) { } return true; }
    catch (e) { const k = S.album.findIndex(a => a.img && !a.fav); const k2 = k >= 0 ? k : S.album.findIndex(a => a.img); if (k2 < 0) return false; S.album[k2].img = null; S.album[k2].lost = true; }
  }
  return false;
};
loadSave = function (n = G.slot) { return slotRead(n); };
function slotInfo(s) {
  if (!s) return '비어 있어요';
  const mode = s.romanceMode === 'SPICY' ? '🥵 아찔한' : '🌷 일반';
  return `${mode} · ${s.name} · ${JOBS[s.job].name} · ${dateLabel(s.day)} · ${STAGES[Math.max(0, (s.rel && s.rel.stage || 1) - 1)].name}`;
}
/* 타이틀: 저장 칸 고르기 */
function slotPicker(kind) {
  const old = $('#slotPick'); if (old) old.remove();
  const box = document.createElement('div'); box.id = 'slotPick';
  const cards = [1, 2].map(n => { const s = slotRead(n); return `<button class="slotCard${s ? '' : ' empty'}" data-n="${n}"><b>💾 저장 ${n}</b><small>${esc(slotInfo(s))}</small>${kind === 'new' && s ? '<em>새로 시작하면 이 칸의 진행이 지워져요</em>' : ''}</button>`; }).join('');
  box.innerHTML = `<div class="pop"><h2>${kind === 'new' ? '어느 칸에 새로 시작할까요?' : '어느 저장을 이어 할까요?'}</h2>${cards}<button class="big alt" id="slotBack">뒤로</button></div>`;
  $('#title').appendChild(box);
  box.querySelector('#slotBack').onclick = () => { Sound.sfx('tap'); box.remove(); };
  box.querySelectorAll('.slotCard').forEach(b => b.onclick = () => {
    const n = +b.dataset.n, s = slotRead(n); Sound.init(); Sound.sfx('tap');
    if (kind === 'cont') { if (!s) { toast('비어 있는 칸이에요'); return; } G.slot = n; box.remove(); buildWorld(); startGame(s, false); return; }
    const go = () => { G.slot = n; box.remove(); $('#title').classList.add('hidden'); $('#newgame').classList.remove('hidden'); buildNewGameUI(); };
    if (s && !b.classList.contains('sure')) { b.classList.add('sure'); b.querySelector('em').textContent = '⚠ 한 번 더 누르면 지우고 새로 시작해요'; return; }
    go();
  });
}
function slotTitle() {
  const s1 = slotRead(1), s2 = slotRead(2), any = s1 || s2;
  $('#btnCont').classList.toggle('hidden', !any);
  const last = slotRead(G.slot) ? G.slot : s1 ? 1 : 2;
  if (any) $('#contInfo').textContent = s1 && s2 ? '저장 1 · 저장 2' : `저장 ${last} · ${slotInfo(last === 1 ? s1 : s2)}`;
}
window.addEventListener('DOMContentLoaded', () => {
  slotTitle();
  $('#btnCont').onclick = () => {
    Sound.init(); const s1 = slotRead(1), s2 = slotRead(2);
    if (s1 && s2) return slotPicker('cont');
    const n = s1 ? 1 : 2, s = s1 || s2; if (!s) return; G.slot = n; buildWorld(); startGame(s, false);
  };
  $('#btnNew').onclick = () => {
    Sound.init(); const s1 = slotRead(1), s2 = slotRead(2);
    if (!s1 && !s2) { G.slot = 1; $('#title').classList.add('hidden'); $('#newgame').classList.remove('hidden'); buildNewGameUI(); return; }
    slotPicker('new');
  };
});
/* 지금 칸 표시 · 「지우고 처음부터」는 지금 칸만 */
const _openSheetSlot = openSheet;
openSheet = function (o) {
  if (o && o.items) {
    o = Object.assign({}, o, { items: o.items.map(i => /지우고 처음부터/.test(i.label) ? Object.assign({}, i, { label: `저장 ${G.slot} 지우고 처음부터`, onClick: () => { G.started = false; try { localStorage.removeItem(slotKey()); if (G.slot === 1) localStorage.removeItem(SAVE_KEY); } catch (e) { } location.reload(); } }) : i) });
    if (o.title === '⚙ 설정') o.items.push({ icon: '💾', label: `저장 ${G.slot} 사용 중`, note: S && S.romanceMode === 'SPICY' ? '🥵 아찔한 모드' : '🌷 일반 모드', onClick: () => openSheet({ title: `💾 지금은 저장 ${G.slot}`, sub: '<div class="relneed">자동으로 저장되고 있어요. 다른 칸은 처음 화면에서 골라요.</div>', cols: 2, items: [{ icon: '🏠', label: '처음 화면으로', note: '저장하고 나가기', onClick: () => { save(); G.started = false; location.reload(); } }, { icon: '↩', label: '계속 플레이', onClick: () => { } }] }) });
  }
  return _openSheetSlot(o);
};
