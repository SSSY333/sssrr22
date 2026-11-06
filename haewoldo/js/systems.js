'use strict';
/* =========================================================
 *  해월도 v6 「우리들의 해월도」 — 공통 시스템
 *  저장 v4 · 기억 · 소문 · 퀘스트 가이드 · 패널 · 추적 표시 · 여객선 · 방문객 · 축제 경영
 * ========================================================= */
const SAVE_KEY4 = 'haewoldo-village-v4';

/* ---------------- 저장 v4 (v3 저장은 자동 이전) ---------------- */
save = function () {
  if (!S || !G.started) return false;
  S.map = G.player.map; S.p = { x: G.player.x, y: G.player.y };
  S.d = { x: G.det.x, y: G.det.y, vis: G.det.visible, map: G.det.map };
  S.savedAt = Date.now();
  showSaving();
  for (let i = 0; i < 12; i++) {
    try { localStorage.setItem(SAVE_KEY4, JSON.stringify(S)); return true; }
    catch (e) { const k = S.album.findIndex(a => a.img && !a.fav); const k2 = k >= 0 ? k : S.album.findIndex(a => a.img); if (k2 < 0) return false; S.album[k2].img = null; S.album[k2].lost = true; }
  }
  return false;
};
function showSaving() { const el = $('#saveDot'); if (!el) return; el.classList.add('on'); clearTimeout(G._saveDotT); G._saveDotT = setTimeout(() => el.classList.remove('on'), 700); }
loadSave = function () {
  try {
    const s4 = JSON.parse(localStorage.getItem(SAVE_KEY4) || 'null');
    if (s4 && s4.v === 4 && JOBS[s4.job]) return s4;
    const s3 = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s3 && s3.v === 3 && JOBS[s3.job]) { s3._migrated = true; return s3; }
  } catch (e) { }
  return null;
};
/* 새 시스템 필드를 채워 넣는다 (v3 → v4 이전 포함, 기존 진행도 보존) */
function ensureV4(s) {
  const was3 = s.v === 3;
  s.v = 4;
  s.mem = s.mem || { perm: {}, pref: { food: {}, gift: {}, place: {}, outfit: {}, date: {}, act: {} }, recent: [] };
  for (const k of ['food', 'gift', 'place', 'outfit', 'date', 'act']) s.mem.pref[k] = s.mem.pref[k] || {};
  s.rumors = s.rumors || []; s.quests = s.quests || {}; s.track = s.track || null; s.appts = s.appts || [];
  s.fest = s.fest || {}; s.cases = s.cases || {}; s.hidden = s.hidden || {}; s.treasure = s.treasure || { frags: {}, restored: false, deduced: false, dug: false };
  s.ward = s.ward || { p: {}, d: {} }; s.wear = s.wear || { d: null }; s.frames = s.frames || ['white', 'sky', 'pink'];
  s.stats = Object.assign({ fish: 0, shells: 0, favors: 0, works: 0, photos: 0, festivals: 0, cases: 0, visitors: 0 }, s.stats || {});
  s.surp = s.surp || {}; s.paid = s.paid || {}; s.rep = s.rep || 0; s.homeLv = s.homeLv || 0; s.furnSeen = s.furnSeen || {};
  s.rel.speech = Object.assign({ informalSpeechUnlocked: false, informalSpeechEventCompleted: false, informalSpeechEventVariant: null, informalSpeechEventDate: null }, s.rel.speech || {});
  if (s.rel.stage >= 4 && !s.rel.flags.banmal) { s.rel.flags.banmal = true; s.rel.speech.informalSpeechUnlocked = true; }
  if (s.rel.stage >= 3) s.rel.speech.informalSpeechUnlocked = true;
  if (!s.furn) { // 기본 가구 · 산 가구를 같은 배치 시스템으로
    s.furn = { seq: 1, placed: [], store: [] };
    for (const f of (s.home || HOME_DEFAULT)) s.furn.placed.push({ id: 'f' + s.furn.seq++, k: f[0], x: f[1], y: f[2], rot: f[3] ? 1 : 0 });
    for (const [k, n] of Object.entries(s.furnInv || {})) for (let i = 0; i < n; i++) s.furn.store.push({ id: 'f' + s.furn.seq++, k });
    delete s.home; delete s.furnInv;
    s.furn.placed = s.furn.placed.filter(f => FURN[f.k]);
  }
  if (s.rel.flags.met && !s.fm) s.fm = { id: 'legacy', place: '해월도', day: s.rel.metDay || 1 };
  if (s.rel.flags.met && !s.mem.perm.firstMeet) s.mem.perm.firstMeet = { day: s.rel.metDay || 1, place: s.fm ? s.fm.place : '해월도', id: s.fm ? s.fm.id : 'legacy', date: dateLabel(s.rel.metDay || 1) };
  for (const a of s.album) { a.id = a.id || 'a' + Math.random().toString(36).slice(2, 8); a.cat = a.cat || albumCat(a.kind); }
  if (was3) s._migratedFrom = 3;
  return s;
}

/* ---------------- 기억 시스템 ---------------- */
function memPerm(key, data = {}) { if (S.mem.perm[key]) return false; S.mem.perm[key] = Object.assign({ day: S.day, date: dateLabel(), place: placeName(curPlace()) || M.name }, data); return true; }
function memPref(cat, key, n = 1) { if (!key) return; const p = S.mem.pref[cat]; p[key] = (p[key] || 0) + n; }
function memTop(cat) { const p = S.mem.pref[cat] || {}; let best = null, bv = 0; for (const [k, v] of Object.entries(p)) if (v > bv) { best = k; bv = v; } return bv >= 2 ? best : null; }
function memRecent(type, text, extra = {}) { S.mem.recent.unshift(Object.assign({ type, text, day: S.day, place: placeName(curPlace()) || (M && M.name) || '' }, extra)); S.mem.recent = S.mem.recent.slice(0, 24); }
function memLast(type) { return S.mem.recent.find(r => r.type === type) || null; }

/* ---------------- 소문 (실제 일어난 일만) ---------------- */
const RUMOR_TEXT = {
  walk: ['두 분 요즘 자주 같이 다니시더라?', '형사 양반이 요즘 누구랑 그렇게 산책을 해~?', '어제 {place}에서 둘이 걷는 거 봤어. 호호.'],
  lovers: ['형사 양반 연애한대! 상대가 누군지는… 다 알지?', '둘이 사귄다며? 섬이 좁아서 소문 금방이여.'],
  engaged: ['프로포즈 받았다며! 반지 좀 보여 줘 봐~', '형사 양반 장가간다더라!'],
  married: ['형사 양반이 요즘 퇴근하면 곧장 집에 간다면서?', '신혼집 불이 일찍 꺼진다던데~ 호호.'],
  photo: ['어머, 그 사진 부스에서 찍은 거예요?', '네컷사진 찍었다며? 나도 보여 줘~'],
  festival: ['이번 축제 준비를 아주 잘했다던데?', '{name} 덕분에 {fest}가 대성공이었대!'],
  case: ['{case} 사건, 형사 양반이랑 같이 해결했다며?', '{case} 범인이 {truth}였다고? 아이고 참.'],
  fish: ['{fish}를 낚았다며? 대단한 솜씨여!', '{fish}가 걸렸다던데, 진짜야?'],
  visitor: ['오늘 배로 {who}가 들어왔다더라.', '여객선 타고 손님들 왔던데 봤어?'],
  job: ['{name} {job} 솜씨가 늘었대. 칭찬 자자해.'],
  decor: ['{name} 집을 새로 꾸몄다며? 구경 가도 돼?', '집을 넓혔다던데, 집들이 언제 해?'],
};
function addRumor(topic, vars = {}, opts = {}) {
  if (!S) return;
  const key = opts.key || topic + ':' + (vars.key || S.day);
  if (S.rumors.some(r => r.key === key)) return;
  const vids = Object.keys(VILLAGERS);
  const know = []; while (know.length < 2) { const v = pick(vids); if (!know.includes(v)) know.push(v); }
  let text = pick(RUMOR_TEXT[topic] || ['요즘 섬이 시끌벅적해.']);
  text = text.replace(/\{(\w+)\}/g, (m0, k) => vars[k] != null ? vars[k] : (k === 'name' ? S.name : k === 'place' ? (placeName(curPlace()) || '마을') : k === 'job' ? JOBS[S.job].name : m0));
  S.rumors.push({ id: 'r' + Date.now().toString(36) + Math.floor(Math.random() * 99), key, topic, text, day: S.day, exp: S.day + (opts.days || 7), know, told: [], about: opts.about || null });
  if (S.rumors.length > 40) S.rumors = S.rumors.slice(-40);
}
function spreadRumors() {
  const vids = Object.keys(VILLAGERS);
  S.rumors = S.rumors.filter(r => r.exp >= S.day);
  for (const r of S.rumors) for (let i = 0; i < 2; i++) { const v = pick(vids); if (!r.know.includes(v)) r.know.push(v); }
}
function rumorFor(vid) { return S.rumors.find(r => r.know.includes(vid) && !r.told.includes(vid)) || null; }

/* ---------------- 공용 패널 (복잡한 화면용) ---------------- */
function openPanel(title, html, bind, opts = {}) {
  G.screen = true; G._panelBack = opts.back || null;
  $('#panelTitle').textContent = title; const body = $('#panelBody'); body.innerHTML = html; body.scrollTop = 0;
  $('#panel').classList.remove('hidden'); $('#panel').classList.toggle('full', !!opts.full);
  $('#panelBack').classList.toggle('hidden', !opts.back);
  if (bind) bind(body);
}
function closePanel() { $('#panel').classList.add('hidden'); G.screen = false; const f = G._panelClose; G._panelClose = null; if (f) f(); }
const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------------- 퀘스트 가이드 ---------------- */
const Q_STATE_KO = { LOCKED: '잠김', AVAILABLE: '받을 수 있음', ACTIVE: '진행 중', READY_TO_COMPLETE: '완료 가능', COMPLETED: '완료', FAILED: '실패', CANCELLED: '취소' };
const QDEF = {};  // id → { title, kind: 'once'|'repeat', view(q) → { desc, goal, prog:[n,m], target:{map,x,y}, reward, time } }
function qGet(id) { return S.quests[id] || (S.quests[id] = { state: 'LOCKED', step: 0, n: 0, done: false, claimed: false, reps: {} }); }
function qSet(id, patch) {
  const q = qGet(id), prev = q.state; Object.assign(q, patch);
  if (patch.state && patch.state !== prev) {
    if (patch.state === 'COMPLETED') { q.done = true; toast(`✅ 퀘스트 완료 — ${qTitle(id)}`); if (S.track === id) S.track = null; }
    else if ((patch.state === 'AVAILABLE' || patch.state === 'ACTIVE') && prev === 'LOCKED' && !/^(case_|hidden_|appt_)/.test(id)) toast(`📋 새 퀘스트 — ${qTitle(id)}`);
  }
  updateQuestBtn();
}
function qTitle(id) { const d = qDef(id); return d ? (typeof d.title === 'function' ? d.title() : d.title) : id; }
function qDef(id) { if (QDEF[id]) return QDEF[id]; if (id.startsWith('appt_')) return apptQuestDef(id); return null; }
function qIsOpen(q) { return q && (q.state === 'AVAILABLE' || q.state === 'ACTIVE' || q.state === 'READY_TO_COMPLETE'); }
/* 반복 퀘스트 보상: 같은 날짜(또는 시즌)에 한 번만 */
function qRepeatPaid(id, period) { const q = qGet(id); if (q.reps[period]) return true; q.reps[period] = S.day; const ks = Object.keys(q.reps); if (ks.length > 40) delete q.reps[ks[0]]; return false; }
function payOnce(key, fn) { if (S.paid[key]) return false; S.paid[key] = S.day; fn(); return true; }
function questViews() {
  const out = [];
  for (const [id, q] of Object.entries(S.quests)) {
    if (!qIsOpen(q)) continue; const d = qDef(id); if (!d) continue;
    let v; try { v = d.view(q) || {}; } catch (e) { console.error(e); continue; }
    if (v.hidden) continue;
    out.push(Object.assign({ id, title: qTitle(id), state: q.state, kind: d.kind || 'once' }, v));
  }
  const order = { READY_TO_COMPLETE: 0, ACTIVE: 1, AVAILABLE: 2 };
  out.sort((a, b) => (a.id === S.track ? -1 : 0) - (b.id === S.track ? -1 : 0) || order[a.state] - order[b.state]);
  return out;
}
function updateQuestBtn() { if (!S) return; const n = questViews().length; const b = $('#questBtn'); if (b) b.innerHTML = `📋 퀘스트 <b>(${n})</b>`; if (!$('#questPanel').classList.contains('hidden')) renderQuestPanel(); }
function toggleQuestPanel(force) {
  const p = $('#questPanel'), open = force != null ? force : p.classList.contains('hidden');
  p.classList.toggle('hidden', !open); $('#questBtn').classList.toggle('open', open);
  if (open) renderQuestPanel();
}
function renderQuestPanel() {
  const list = questViews(), body = $('#questList');
  if (!list.length) { body.innerHTML = '<p class="qempty">진행 중인 퀘스트가 없어요.<br>마을 사람들과 이야기하거나<br>형사님과 시간을 보내 보세요.</p>'; return; }
  body.innerHTML = list.map(v => {
    const pr = v.prog ? `<div class="qprog"><i style="width:${Math.min(100, v.prog[0] / Math.max(1, v.prog[1]) * 100)}%"></i><span>${v.prog[0]}/${v.prog[1]}</span></div>` : '';
    return `<div class="qcard ${v.state === 'READY_TO_COMPLETE' ? 'ready' : ''} ${S.track === v.id ? 'tracked' : ''}">
      <div class="qtop"><b>${esc(v.title)}</b><small>${v.kind === 'repeat' ? '반복 · ' : ''}${Q_STATE_KO[v.state]}</small></div>
      ${v.desc ? `<p>${esc(v.desc)}</p>` : ''}${v.goal ? `<p class="qgoal">목표: ${esc(v.goal)}</p>` : ''}${pr}
      ${v.place ? `<p class="qmeta">📍 ${esc(v.place)}</p>` : ''}${v.reward ? `<p class="qmeta">🎁 ${esc(v.reward)}</p>` : ''}${v.time ? `<p class="qmeta">⏰ ${esc(v.time)}</p>` : ''}
      ${v.target ? `<button class="qtrack" data-id="${v.id}">${S.track === v.id ? '추적 중지' : '🧭 추적'}</button>` : ''}</div>`;
  }).join('');
  body.querySelectorAll('.qtrack').forEach(b => b.onclick = (e) => { e.stopPropagation(); S.track = S.track === b.dataset.id ? null : b.dataset.id; if (S.track) toast('🧭 화면과 지도에 목표가 표시돼요'); renderQuestPanel(); });
}
function trackedTarget() { if (!S || !S.track) return null; const v = questViews().find(x => x.id === S.track); return v && v.target ? v.target : null; }
/* 현재 맵에서 목표로 가는 길목 */
function routeTarget(t) {
  if (!t) return null; const P = G.player;
  if (t.map === P.map) return { x: t.x, y: t.y, final: true };
  if (M.interior || M.hidden) { if (M.exitTile) return { x: M.exitTile[0] + 0.5, y: M.exitTile[1] + 0.5 }; if (M.exit) return { x: M.exit[0] + 0.5, y: M.exit[1] + 0.5 }; }
  if (P.map === 'islet') return { x: MAPS.islet.boatSpot[0], y: MAPS.islet.boatSpot[1] };
  if (P.map === 'island') {
    if (t.map.startsWith('in_')) { const b = MAPS.island.buildings.find(b => 'in_' + b.id === t.map); if (b) return { x: b.doorTile[0] + 0.5, y: b.doorTile[1] + 0.5 }; }
    if (t.map === 'islet' || t.map === 'h_secret') return { x: P_('boatSpot')[0], y: P_('boatSpot')[1] };
    const pt = (MAPS.island.portals || []).find(p => p.id === t.map); if (pt) return { x: pt.x + 0.5, y: pt.y + 0.5 };
  }
  return null;
}
function drawWorldMarkers(g) {
  if (!S || !G.started) return;
  const D = R.dpr, t = routeTarget(trackedTarget());
  if (!t) return;
  const [sx, sy] = iso(t.x, t.y), X = SX(sx), Y = SY(sy - 30) - Math.abs(Math.sin(G.t * 3)) * 6 * D;
  const inside = X > 20 * D && X < R.view.width - 20 * D && Y > 60 * D && Y < R.view.height - 90 * D;
  g.font = `${16 * D}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (inside) {
    g.fillStyle = 'rgba(255,111,145,0.95)'; g.beginPath(); g.moveTo(X, Y + 9 * D); g.lineTo(X - 7 * D, Y - 3 * D); g.lineTo(X + 7 * D, Y - 3 * D); g.closePath(); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2 * D; g.stroke();
    const [gx, gy] = [SX(sx), SY(sy)]; g.strokeStyle = 'rgba(255,111,145,0.8)'; g.lineWidth = 2 * D; g.beginPath(); g.ellipse(gx, gy, 12 * D, 6 * D, 0, 0, 7); g.stroke();
  } else {
    const cx = R.view.width / 2, cy = R.view.height / 2, ang = Math.atan2(Y - cy, X - cx);
    const ex = cx + Math.cos(ang) * (R.view.width / 2 - 26 * D), ey = Math.max(150 * D, Math.min(R.view.height - 130 * D, cy + Math.sin(ang) * (R.view.height / 2 - 40 * D)));
    g.save(); g.translate(ex, ey); g.rotate(ang); g.fillStyle = 'rgba(255,111,145,0.95)'; g.beginPath(); g.moveTo(17 * D, 0); g.lineTo(-8 * D, -11 * D); g.lineTo(-8 * D, 11 * D); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2 * D; g.stroke(); g.restore();
  }
}
/* 지도에 숨겨진 장소 · 여객선 · 목표 표시 */
const _drawBigMap0 = drawBigMap;
drawBigMap = function () {
  _drawBigMap0();
  if (!S) return;
  const c = $('#bigMap'), g = c.getContext('2d'), D = BIGMAP.D || R.dpr, at = BIGMAP.at;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const lab = (x, y, text, col = '#3a2533', bg = 'rgba(255,253,246,0.94)') => { const [X, Y] = at(x, y); g.font = `${10 * D * Math.min(1.25, BIGMAP.zoom)}px Jua, sans-serif`; const w = g.measureText(text).width + 8 * D, h = 15 * D; g.fillStyle = bg; roundRect(g, X - w / 2, Y - h / 2, w, h, h / 2); g.fill(); g.fillStyle = col; g.fillText(text, X, Y + 0.5 * D); };
  for (const p of MAPS.island.portals) if (S.hidden[p.id]) lab(p.x + 0.5, p.y - 1, HIDDEN_DEFS[p.id].icon + ' ' + HIDDEN_DEFS[p.id].name, '#5a3a7a');
  if (S.hidden.h_secret) lab(...P_('boatSpot').map((v, i) => v + (i ? 3 : 2)), '🏝️ 비밀 해변(무인도)', '#5a3a7a');
  if (BIGMAP.zoom > 1) { lab(...P_('booth'), '📸 네컷 부스'); lab(...P_('furnitureDoor'), '🛋 가구점'); }
  const fp = ferryPhase(S.min); lab(P_('dockGate')[0] + 3, P_('dockGate')[1] + 2, fp.phase === 'cancel' ? '⛴ 결항' : fp.phase === 'docked' ? '⛴ 정박 중' : '⛴ ' + nextFerryText(), '#2f6fa8');
  const t = trackedTarget();
  if (t) { let p = t.map === 'island' ? [t.x, t.y] : null; if (!p) { const r = t.map.startsWith('in_') ? MAPS.island.buildings.find(b => 'in_' + b.id === t.map) : null; if (r) p = [r.doorTile[0] + 0.5, r.doorTile[1] + 0.5]; else if (t.map === 'islet' || t.map === 'h_secret') p = P_('boatSpot'); else { const pt = MAPS.island.portals.find(q => q.id === t.map); if (pt) p = [pt.x, pt.y]; } }
    if (p) { const [X, Y] = at(p[0], p[1]); g.font = `${18 * D}px sans-serif`; g.fillText('📍', X, Y - 12 * D); } }
  for (const a of G.actors) if (a.isVisitor && a.visible && a.map === 'island') { const [X, Y] = at(a.x, a.y); g.fillStyle = '#2f6fa8'; g.beginPath(); g.arc(X, Y, 2.5 * D, 0, 7); g.fill(); }
};

/* ---------------- 여객선 ---------------- */
function ferryPlan() {
  if (!S.ferry || S.ferry.day !== S.day) {
    const bad = S.weather === 'storm' || (S.weather === 'rain' && hash2(S.day, 3, 11) < 0.35) || (S.weather === 'snow' && hash2(S.day, 5, 11) < 0.25);
    S.ferry = { day: S.day, cancel: bad, arrived: {}, left: {} };
  }
  return S.ferry;
}
function ferryPhase(min) {
  const f = ferryPlan(); if (f.cancel) return { phase: 'cancel', off: 99 };
  const segs = [[8.5 * 60, 9 * 60, 'arriving', 1], [9 * 60, 9.7 * 60, 'docked', 1], [9.7 * 60, 10.2 * 60, 'departing', 1], [13.5 * 60, 14 * 60, 'arriving', 2], [14 * 60, 17 * 60, 'docked', 2], [17 * 60, 17.5 * 60, 'departing', 2]];
  for (const [a, b, ph, run] of segs) if (min >= a && min < b) { const k = (min - a) / (b - a); return { phase: ph, run, off: ph === 'arriving' ? (1 - k) * 16 : ph === 'departing' ? k * 16 : 0 }; }
  return { phase: 'away', off: 99 };
}
function nextFerryText() { if (ferryPlan().cancel) return '오늘 결항'; const m = S.min; if (m < 9 * 60) return '09:00 입항 예정'; if (m < 14 * 60) return '14:00 입항 예정'; if (m < 17 * 60) return '17:00 출항 예정'; return '내일 09:00 입항'; }
function drawFerry(g, list, inView) {
  if (!S || M.id !== 'island') return;
  const fp = ferryPhase(S.min); if (fp.off > 20) return;
  const [dx, dy] = MAPS.island.ferry.dock, x = dx + fp.off, y = dy;
  const [sx, sy] = iso(x + 0.5, y + 0.5); if (!inView(sx, sy, 140)) return;
  const night = daylight(S.min).night > 0.5;
  const key = 'ferry' + (night ? 1 : 0); const sp = R.objSpr[key] || (R.objSpr[key] = sprFerry(night));
  const bob = Math.sin(G.t * 1.4) * 0.8;
  list.push({ d: x + y + 3, f: () => blit(g, sp.c, sx - sp.ax, sy - sp.ay + bob) });
}
function ferryUpdate() {
  const f = ferryPlan(), fp = ferryPhase(S.min);
  if (f.cancel) { if (!f.toldCancel && S.min >= 8.5 * 60) { f.toldCancel = true; toast('⛴ 날씨가 나빠 오늘 여객선은 결항이에요'); } return; }
  if (fp.phase === 'arriving' && !f['horn' + fp.run]) { f['horn' + fp.run] = true; if (M.id === 'island' && Math.hypot(G.player.x - P_('dockGate')[0], G.player.y - P_('dockGate')[1]) < 30) Sound.sfx('bell'); }
  if (fp.phase === 'docked' && !f.arrived[fp.run]) { f.arrived[fp.run] = true; spawnVisitors(fp.run); }
  if (fp.phase === 'departing' && fp.run === 2 && !f.left[2]) { f.left[2] = true; }
}

/* ---------------- 방문객 ---------------- */
const VISITOR_TYPES = {
  tourist: { name: '관광객', icon: '📷', dest: ['cafeDoor', 'promenade', 'beachBench', 'plaza'] },
  photographer: { name: '사진작가', icon: '📸', dest: ['lighthouse', 'windmill'] },
  angler: { name: '낚시 여행객', icon: '🎣', dest: ['rocks', 'pierEnd'] },
  peddler: { name: '행상인', icon: '🧺', dest: ['plaza'], stay: true },
  merchant: { name: '가구 상인', icon: '🪑', dest: ['furnitureDoor'], stay: true },
  returnee: { name: '귀향객', icon: '🧳', dest: ['plaza', 'hallFront'] },
  fester: { name: '축제 참가자', icon: '🎉', dest: ['plaza'] },
  client: { name: '특별 의뢰인', icon: '✉️', dest: ['station'] },
  caseVisitor: { name: '사건 관련 방문객', icon: '❓', dest: ['station'] },
};
const V_NAMES = ['민준', '서윤', '하준', '지우', '도현', '수아', '예준', '하린', '시우', '지안', '건우', '서아'];
function visitorLook(type, i) {
  const r = rng(S.day * 31 + i * 7 + type.length);
  const fem = r() < 0.5, hairs = fem ? ['long', 'bob', 'ponytail', 'wave', 'bun'] : ['short', 'cap', 'short'];
  const cols = ['#e3615a', '#f2c94c', '#5fb3c8', '#8fd6b8', '#b9a6e8', '#f19ab5', '#7fa3e6', '#f4f1ea', '#6f8a4f'];
  const coat = cols[Math.floor(r() * cols.length)], hairC = ['#2a2220', '#3a2a22', '#6a4230', '#8a6a50'][Math.floor(r() * 4)];
  const o = { coat, coatS: shade(coat, 0.82), shirt: coat, pants: ['#3b4a56', '#5a7aa8', '#e9e4da', '#4b4038'][Math.floor(r() * 4)], shoes: '#3b3b3b', closed: true, collar: '#ffffff' };
  if (type === 'tourist' || type === 'photographer') o.backpack = '#4f9a6a';
  if (type === 'angler') { o.hat = 'straw'; o.vest = '#6f8a4f'; }
  if (type === 'peddler' || type === 'merchant') o.apron = '#7a5236';
  if (type === 'tourist' && fem) o.skirt = '#ffffff';
  const name = V_NAMES[Math.floor(r() * V_NAMES.length)];
  return { name: `${VISITOR_TYPES[type].name} ${name}`, hair: hairs[Math.floor(r() * hairs.length)], hairC, hairH: shade(hairC, 1.35), capC: '#3f6fb5', eyeC: '#4a3020', fem, keepHat: true, outfits: { base: o } };
}
function spawnVisitors(run) {
  if (!G.started) return;
  const types = [];
  const fe = festivalSoon(0);
  if (run === 1) { types.push(pick(['tourist', 'photographer', 'angler'])); types.push(pick(['tourist', 'peddler', 'returnee'])); if (S.day % 3 === 0) types.push('merchant'); }
  else { types.push(pick(['tourist', 'angler', 'tourist'])); if (S.day % 2 === 0) types.push(pick(['client', 'photographer'])); }
  if (fe) types.push('fester', 'tourist');
  if (S.day >= 5 && !S.cases.light && S.rel.stage >= 2) types.push('caseVisitor');
  const gate = P_('dockGate');
  types.forEach((ty, i) => {
    const a = mkActor('vis_' + S.day + '_' + run + '_' + i, visitorLook(ty, i + run * 5), 'base', 'island', 'vis' + S.day + run + i);
    a.isVisitor = true; a.vt = ty; a.speed = rand(0.9, 1.3); a.x = gate[0] + rand(-0.4, 0.4); a.y = gate[1] + 0.3; a.route = VISITOR_TYPES[ty].dest.slice(); a.ri = 0; a.wait = i * 2.5; a.leaving = false; a.talked = false;
    if (ty === 'fester' && fe) a.route = [fe.at];
    G.visitors.push(a); G.actors.push(a);
  });
  S.stats.visitors += types.length;
  if (M.id === 'island' && Math.hypot(G.player.x - gate[0], G.player.y - gate[1]) < 25) toast(`⛴ 여객선이 들어왔어요 — 손님 ${types.length}명`);
  addRumor('visitor', { who: VISITOR_TYPES[types[0]].name }, { key: 'visitor' + S.day + run, days: 2 });
}
function visitorUpdate(a, dt) {
  if (a.talking) { a.stop(); return; }
  const fp = ferryPhase(S.min);
  if (!a.leaving && S.min >= 16.4 * 60 && a.vt !== 'returnee') { a.leaving = true; a.stop(); a.walkTo(...P_('dockGate')); }
  if (a.leaving) {
    if (!a.path.length && Math.hypot(a.x - P_('dockGate')[0], a.y - P_('dockGate')[1]) > 1.2) { a.wait -= dt; if (a.wait <= 0) { a.wait = 2; a.walkTo(...P_('dockGate')); } }
    if ((fp.phase === 'departing' && fp.run === 2) || fp.phase === 'away' && S.min >= 17 * 60) removeVisitor(a);
    return;
  }
  if (a.vt === 'returnee' && a.ri >= a.route.length) { const h = MAPS.island.buildings.find(b => b.id === 'houseA'); if (Math.hypot(a.x - h.doorTile[0] - 0.5, a.y - h.doorTile[1] - 0.5) < 0.5) removeVisitor(a); else if (!a.path.length) a.walkTo(h.doorTile[0] + 0.5, h.doorTile[1] + 0.5); return; }
  a.wait -= dt;
  if (!a.path.length && a.wait <= 0) {
    if (a.ri < a.route.length) { const p = P_(a.route[a.ri]); a.walkTo(p[0] + rand(-1.2, 1.2), p[1] + rand(-1, 1)); a.ri++; a.wait = VISITOR_TYPES[a.vt].stay ? 999 : rand(12, 25); }
    else if (!VISITOR_TYPES[a.vt].stay) { a.ri = 0; a.wait = rand(8, 16); }
    if (Math.random() < 0.3) a.say(pick({ tourist: ['와, 바다 색 좀 봐!', '여기 사진 명소래.', '귤 라떼 어디서 팔아요?'], photographer: ['빛이 좋다…', '등대는 노을에 찍어야지.'], angler: ['오늘 손맛 좀 보려나.', '갯바위가 어디죠?'], peddler: ['좋은 물건 있어요~', '육지 물건 구경하세요!'], merchant: ['가구 구경하고 가세요~'], returnee: ['얼마 만의 고향이야…', '그대로네, 해월도.'], fester: ['축제 언제 시작해요?', '포스터 보고 왔어요!'], client: ['파출소가 어디죠?'], caseVisitor: ['저기… 파출소가 어디죠? 꼭 할 얘기가 있어서요.'] }[a.vt]), 3);
  }
}
function removeVisitor(a) { a.visible = false; G.visitors = G.visitors.filter(v => v !== a); G.actors = G.actors.filter(v => v !== a); }
async function visitorTalk(a) {
  const P = G.player; a.talking = true; a.stop(); a.lookAt(P); P.lookAt(a);
  const first = !a.talked; a.talked = true;
  const tip = (n) => { S.money += n; floatText(P, '+' + fmtMoney(n)); S.rep += 1; };
  switch (a.vt) {
    case 'tourist': {
      const asks = [['숙소', '게스트하우스는 어디예요? 오늘 하룻밤 묵으려고요.', ['파출소 옆 골목', '내 집 근처 게스트하우스', '등대 안'], 1, '마을 아래쪽 집들 사이에 있어요. 간판이 보일 거예요.'], ['맛집', '여기 맛집이 어디예요? 물회 먹고 싶어요!', ['해월 횟집', '마을 슈퍼', '목장'], 0, '포구에 있는 해월 횟집이요. 이모님 물회가 최고예요.'], ['노을', '노을은 어디서 봐야 예뻐요?', ['등대', '학교', '귤밭'], 0, '등대 벤치요. 저녁 6시쯤 가 보세요.']];
      const [, q, opts, ans, line] = asks[(S.day + a.x | 0) % asks.length];
      await say(a.id, 'smile', q);
      const c = await choose(opts);
      if (c === ans) { await say('me', 'smile', line); await say(a.id, 'laugh', '친절하시다! 감사해요. 이거 받으세요, 육지에서 사 온 과자예요.'); if (first) { tip(500); S.inv.snack = (S.inv.snack || 0) + 1; } }
      else await say(a.id, 'normal', '아, 그래요? …한번 가 볼게요! (조금 갸웃거린다)');
      break;
    }
    case 'photographer': {
      await say(a.id, 'smile', '해월도 등대를 노을 속에서 찍고 싶어서 왔어요. 혹시 제일 예쁜 자리를 아세요?');
      if (!qIsOpen(qGet('v_photo')) && !qGet('v_photo').done) { qSet('v_photo', { state: 'ACTIVE', step: 0, day: S.day }); await say(a.id, 'smile', '저녁 5시 넘어서 등대 벤치에서 만나요! 같이 봐 주시면 사진 한 장 드릴게요.'); }
      else await say(a.id, 'laugh', '빛이 정말 좋아요. 여기 사람들은 매일 이걸 보는 거죠?');
      break;
    }
    case 'angler': {
      await say(a.id, 'smile', '갯바위에 감성돔이 붙었다던데. 혹시 잡은 물고기 있으면 비싸게 살게요!');
      const fishes = Object.keys(S.inv).filter(k => S.inv[k] > 0 && ITEMS[k] && ITEMS[k].fish);
      if (fishes.length) { const k = fishes[0]; const c = await choose([`${ITEMS[k].name} 팔기 (${fmtMoney(Math.round(ITEMS[k].sell * 1.6))})`, '다음에요']); if (c === 0 && S.inv[k] > 0) { S.inv[k]--; tip(Math.round(ITEMS[k].sell * 1.6)); await say(a.id, 'laugh', '좋은 놈이네! 감사합니다.'); } }
      else await say(a.id, 'normal', '아직 빈손이시구나. 행운을 빌어요!');
      break;
    }
    case 'peddler': await say(a.id, 'smile', '육지에서 귀한 물건 가져왔어요~ 구경만 해도 돼요.'); closeDialog(); a.talking = false; peddlerShop(); return;
    case 'merchant': await say(a.id, 'smile', '바닷가 테마 가구 들여왔어요. 섬에선 오늘만 팔아요!'); closeDialog(); a.talking = false; merchantShop(); return;
    case 'returnee': await say(a.id, 'smile', '어릴 때 여기 살았어요. 그 등대, 그 귤밭… 하나도 안 변했네.'); await say(a.id, 'normal', '형사님은 아직 그 파출소에 계세요? 그분 덕에 섬이 늘 조용했죠.'); if (first) memRecent('visitor', '귀향객의 옛 이야기를 들었다'); break;
    case 'fester': { await say(a.id, 'laugh', '축제 포스터 보고 왔어요! 어디서 해요?'); const fe = festivalSoon(0); if (fe) { await say('me', 'smile', `${placeName(placeAt(...P_(fe.at), MAPS.island)) || '마을'} 쪽이에요. 같이 즐겨요!`); const st = festState(fe); if (st && first) { st.part = (st.part || 0) + 3; toast('🎉 축제 홍보 성공! 참여도 +3'); } } break; }
    case 'client': {
      if (!qIsOpen(qGet('v_request')) && !qGet('v_request').reps[S.day]) {
        await say(a.id, 'serious', '실례지만… 이 섬에서 나는 소라를 하나 구할 수 있을까요? 어머니가 소라 껍데기를 꼭 보고 싶어 하셔서요.');
        const c = await choose(['찾아볼게요', '어려울 것 같아요']);
        if (c === 0) { qSet('v_request', { state: 'ACTIVE', step: 0, day: S.day, who: a.id }); await say(a.id, 'smile', '고맙습니다! 오후 4시 반까지 부두 근처에 있을게요.'); }
      } else if ((S.inv.conch || 0) > 0 && qIsOpen(qGet('v_request'))) {
        S.inv.conch--; await say(a.id, 'laugh', '이거예요! 정말 고맙습니다. 약소하지만 사례예요.'); if (!qRepeatPaid('v_request', 'd' + S.day)) tip(4000); qSet('v_request', { state: 'COMPLETED' }); qGet('v_request').state = 'LOCKED';
      } else await say(a.id, 'normal', '소라 하나만 구하면 돼요. 해변이나 무인도에서 주울 수 있대요.');
      break;
    }
    case 'caseVisitor': await say(a.id, 'serious', '어젯밤 등대 쪽에서 이상한 불빛이 깜빡였어요. 누가 신호를 보내는 것 같았어요…'); await say(a.id, 'normal', '파출소에 말씀드리려는데, 혹시 형사님 아세요?'); caseDiscover('light'); break;
  }
  closeDialog(); a.talking = false;
}
function shopPanel(title, sub, goods, back) {
  openPanel(title, `<p class="psub">${sub} · 보유 <b>${fmtMoney(S.money)}</b></p><div class="pgrid">${goods.map((g2, i) => `<button class="pcard ${g2.owned ? 'owned' : ''}" data-i="${i}">${g2.img ? `<img src="${g2.img}">` : `<span class="pic">${g2.icon}</span>`}<b>${esc(g2.name)}</b><small>${g2.owned ? '보유 중' : fmtMoney(g2.price)}</small></button>`).join('')}</div>`, (body) => {
    body.querySelectorAll('.pcard').forEach(b => b.onclick = () => { const it = goods[+b.dataset.i]; confirmBuy(it.name, it.price, it.img, it.desc, () => { it.buy(); }, () => shopPanel(title, sub, goods, back)); });
  });
}
/* 구매 확인 — 화폐 차감과 지급을 한 번에 (실패 시 아무것도 바뀌지 않음) */
function confirmBuy(name, price, img, desc, give, back) {
  openPanel('구매 확인', `<div class="buy">${img ? `<img src="${img}">` : ''}<h3>${esc(name)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}<p class="price">${fmtMoney(price)} <small>(보유 ${fmtMoney(S.money)})</small></p><div class="prow"><button id="bOk" class="big">구매</button><button id="bNo" class="big alt">취소</button></div></div>`, (body) => {
    body.querySelector('#bOk').onclick = () => {
      if (S.money < price) { toast('돈이 부족해요'); return; }
      const before = S.money; try { S.money -= price; give(); } catch (e) { S.money = before; console.error(e); toast('구매에 실패했어요'); return; }
      Sound.sfx('coin'); updateHUD(); save(); toast(`🛍 ${name} 구입!`); back && back();
    };
    body.querySelector('#bNo').onclick = () => { back ? back() : closePanel(); };
  });
}
function peddlerShop() {
  const goods = [
    { name: '커플 티셔츠 세트', price: 14000, icon: '👕', desc: '나와 형사님이 함께 입는 커플 티. 옷장에 들어가요.', owned: S.ward.p.coupleTee, buy: () => giveOutfit('coupleTee') },
    { name: '바다 프레임', price: 3000, icon: '🌊', desc: '네컷사진 「바다」 프레임', owned: S.frames.includes('sea'), buy: () => { if (!S.frames.includes('sea')) S.frames.push('sea'); } },
    { name: '진주 머리핀', price: 6000, icon: '🦪', desc: '선물용. 형사님이 좋아할지도?', buy: () => { S.inv.pearl = (S.inv.pearl || 0) + 1; } },
    { name: '여름 휴양복', price: 12000, icon: '🌺', desc: '휴양지 느낌 셔츠 (두 사람 모두)', owned: S.ward.p.resort, buy: () => giveOutfit('resort') },
  ];
  shopPanel('🧺 행상인의 보따리', '오늘 배로 들어온 행상인', goods);
}
function merchantShop() {
  const goods = ['seaChair', 'souvenir', 'rugL', 'vase'].map(k => ({ name: FURN[k].name, price: Math.round((FURN[k].price || 10000) * 0.85), img: furnPreview(k, 0, 2), desc: '오늘만 15% 할인 · 보관함으로 들어가요', buy: () => furnGive(k) }));
  shopPanel('🪑 떠돌이 가구 상인', '바닷가 테마 가구', goods);
}

/* ---------------- 축제 경영 ---------------- */
const FESTS = {
  canola: { ev: 'canola', name: '유채꽃 축제', icon: '🌼', at: 'field', mats: { flower: 4 }, outfit: 'picnic', furn: 'canolaVase', frame: 'spring', with: '형사님과 꽃길 사진',
    decor: [['꽃길 장식', '🌼', 3000, 3], ['포토존', '📸', 4000, 4], ['관광객 안내소', 'ℹ️', 2000, 2], ['꽃 화분 줄', '🪴', 2500, 2], ['나비 풍선', '🎈', 1500, 1]], roles: ['꽃길 안내', '포토존 담당', '관광객 안내'] },
  fireworks: { ev: 'fireworks', name: '여름밤 불꽃놀이', icon: '🎆', at: 'harbor', mats: { snack: 3, watermelon: 1 }, outfit: 'festival', furn: 'festLamp', frame: 'fireworks', with: '형사님과 불꽃놀이',
    decor: [['포장마차', '🏮', 3000, 3], ['간식 판매대', '🍢', 2500, 3], ['해변 안전 펜스', '🚧', 2000, 2], ['등불 줄', '🏮', 2000, 2], ['돗자리 구역', '🧺', 1500, 1]], roles: ['포장마차', '간식 판매', '해변 안전 점검'] },
  sports: { ev: 'sports', name: '해월 운동회', icon: '🏃', at: 'schoolFront', mats: { lunchbox: 2, hanky: 2 }, outfit: 'sport', furn: 'medal', frame: 'autumn', with: '형사님과 2인 3각',
    decor: [['만국기', '🚩', 2000, 2], ['경기장 라인', '⚪', 2500, 3], ['응원석', '📣', 3000, 3], ['상품 테이블', '🎁', 2500, 2], ['물 마시는 곳', '🚰', 1500, 1]], roles: ['청팀 응원단장', '백팀 응원단장', '진행 요원'] },
  harvest: { ev: 'harvest', name: '귤 수확 축제', icon: '🍊', at: 'farm', mats: { tangerine: 6 }, outfit: 'winterCoat', furn: 'orangeCrate', frame: 'winter', with: '형사님과 귤 나눠 먹기',
    decor: [['귤 판매대', '🍊', 3000, 3], ['포장 작업대', '📦', 2500, 3], ['귤 등불', '🏮', 2000, 2], ['시식 코너', '🥄', 2000, 2], ['눈사람 장식', '⛄', 1500, 1]], roles: ['귤 수확', '포장', '판매대 운영'] },
};
FURN.orangeCrate = { name: '귤 상자 장식', price: 0, cat: 'couple', blocks: () => [_blk(0.15, 0.25, 0.85, 0.8, 0, 10, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.2, 0.3, 0.45, 0.55, 10, 14, '#f39a2b'), _blk(0.5, 0.35, 0.75, 0.6, 10, 14, '#f7a93b'), _blk(0.35, 0.5, 0.6, 0.75, 10, 13, '#f39a2b')] };
function festDay(fid, from = S.day) { const e = EVENTS.find(x => x.id === FESTS[fid].ev); for (let d = from; d < from + 130; d++) { const c = calendar(d); if (c.month === e.m && c.dom === e.d) return d; } return null; }
function festKey(fid, day) { return fid + '_' + calendar(day).year; }
function festState(fe) { return fe ? S.fest[festKey(fe.id, fe.day)] : null; }
/* 앞으로 n일 안의 축제 (0이면 오늘) */
function festivalSoon(n) { for (const fid of Object.keys(FESTS)) { const d = festDay(fid); if (d != null && d - S.day >= 0 && d - S.day <= n) return Object.assign({ id: fid, day: d }, FESTS[fid]); } return null; }
function festUpdateDaily() {
  for (const fid of Object.keys(FESTS)) {
    const d = festDay(fid); if (d == null) continue;
    const key = festKey(fid, d), left = d - S.day;
    if (left >= 0 && left <= 6 && !S.fest[key]) {
      S.fest[key] = { fid, day: d, step: 0, budget: 0, donors: [], mats: {}, decor: [], roles: {}, part: 0, joined: false, done: false };
      qSet('fest_' + key, { state: 'AVAILABLE', step: 0 });
      QDEF['fest_' + key] = festQuestDef(key);
      setTimeout(() => toast(`📢 ${FESTS[fid].icon} ${FESTS[fid].name} 공고! ${dateLabel(d)} — 마을회관에서 준비위원을 모집해요`), 3200);
    }
  }
  for (const key of Object.keys(S.fest)) if (!QDEF['fest_' + key]) QDEF['fest_' + key] = festQuestDef(key);
}
function festQuestDef(key) {
  return { title: () => `${FESTS[S.fest[key].fid].icon} ${FESTS[S.fest[key].fid].name} 준비`, kind: 'repeat', view: () => {
    const st = S.fest[key], F = FESTS[st.fid], left = st.day - S.day;
    const hallT = { map: 'in_hall', x: 6.5, y: 1.5 };
    const time = left > 0 ? `축제까지 ${left}일 (${dateLabel(st.day)})` : left === 0 ? `오늘 ${fmtTime(EVENTS.find(e => e.id === F.ev).from)}부터!` : '';
    if (!st.joined) return { desc: '이장님이 축제 준비위원을 찾고 있어요.', goal: '마을회관 행사 게시판에서 준비위원 신청', target: hallT, place: '마을회관', reward: '축제 보상 · 평판', time };
    if (st.step === 1) return { desc: '주민들에게 후원을 받아 예산을 모아요.', goal: `주민 후원 받기 (말 걸기)`, prog: [st.donors.length, 3], place: '마을 곳곳', reward: `예산 ${fmtMoney(st.budget)}`, time };
    if (st.step === 2) { const tot = Object.values(F.mats).reduce((a, b) => a + b, 0), have = Object.entries(F.mats).reduce((a, [k, n]) => a + Math.min(n, st.mats[k] || 0), 0); return { desc: '필요한 재료: ' + Object.entries(F.mats).map(([k, n]) => `${ITEMS[k].icon}${ITEMS[k].name} ${n}`).join(' · '), goal: '재료를 모아 마을회관 게시판에 내기', prog: [have, tot], target: hallT, place: '마을회관', time }; }
    if (st.step === 3) return { desc: `예산 ${fmtMoney(st.budget)}으로 장식과 가판대를 놓아요.`, goal: '마을회관 게시판에서 장식 · 가판대 배치', target: hallT, time };
    if (st.step === 4) return { desc: '주민들에게 역할을 맡겨요.', goal: '마을회관 게시판에서 역할 배정', target: hallT, time };
    const at = P_(F.at); return { desc: `준비 완료! ${F.with}도 기대돼요.`, goal: left > 0 ? `${dateLabel(st.day)} 축제 참여` : `축제장으로 가기`, target: { map: 'island', x: at[0], y: at[1] }, place: placeName(placeAt(at[0], at[1], MAPS.island)), reward: '한정 의상 · 특별 가구 · 프레임', time };
  } };
}
function festNow() { const fe = festivalSoon(0); if (!fe) return null; const st = festState(fe); return st ? Object.assign({ st }, fe) : null; }
function festBoardMenu() {
  const opens = Object.entries(S.fest).filter(([, st]) => !st.done && st.day >= S.day);
  if (!opens.length) return false;
  const [key, st] = opens[0], F = FESTS[st.fid];
  runEvent(async () => {
    if (!st.joined) {
      await say('chief', 'smile', `${F.name} 준비위원을 모집 중이여. 자네가 맡아 줄 텐가?`);
      const c = await choose(['준비위원 할게요!', '다음에요']);
      if (c !== 0) return;
      st.joined = true; st.step = 1; qSet('fest_' + key, { state: 'ACTIVE' });
      await say('chief', 'laugh', '고맙구먼! 일단 예산부터 모아야 혀. 자네는 얼마나 보탤 텐가?');
      const opts = [0, 3000, 8000].filter(v => v <= S.money);
      const k = await choose(opts.map(v => v ? `${fmtMoney(v)} 보태기` : '돈 대신 발로 뛸게요'));
      S.money -= opts[k]; st.budget = 4000 + opts[k]; if (opts[k]) S.rep += 1;
      await say('chief', 'smile', '주민들한테도 후원을 받아 봐. 세 사람만 설득하면 넉넉할 거여.');
      if (casualOn() && G.det.visible && dist(G.det, G.player) < 6) await say('det', 'tease', '준비위원? 그럼 나는 안전 담당 할게. 축제 날 순찰은 원래 내 일이니까.');
      return;
    }
    if (st.step === 2) {
      let gave = false;
      for (const [k, n] of Object.entries(F.mats)) { const need = n - (st.mats[k] || 0); const g2 = Math.min(need, S.inv[k] || 0); if (g2 > 0) { S.inv[k] -= g2; st.mats[k] = (st.mats[k] || 0) + g2; gave = true; } }
      const done = Object.entries(F.mats).every(([k, n]) => (st.mats[k] || 0) >= n);
      await say('chief', gave ? 'smile' : 'normal', done ? '재료가 다 모였구먼! 이제 장식이랑 가판대를 정하자고.' : gave ? '받아 뒀어. 조금만 더 모으면 되겠어.' : '아직 재료가 부족혀. ' + Object.entries(F.mats).map(([k2, n]) => `${ITEMS[k2].name} ${st.mats[k2] || 0}/${n}`).join(', '));
      if (done) st.step = 3; else return;
    }
    if (st.step === 3) {
      closeDialog(); await festDecorPick(key); return;
    }
    if (st.step === 4) { closeDialog(); await festRolePick(key); return; }
    if (st.step >= 5) await say('chief', 'laugh', `준비 끝! ${dateLabel(st.day)}에 ${F.name}에서 보자고.`);
  });
  return true;
}
function festDecorPick(key) {
  return new Promise(res => {
    const st = S.fest[key], F = FESTS[st.fid], chosen = new Set();
    const draw = () => {
      const cost = [...chosen].reduce((a, i) => a + F.decor[i][2], 0);
      openPanel('장식 · 가판대 배치', `<p class="psub">예산 <b>${fmtMoney(st.budget)}</b> · 선택 ${fmtMoney(cost)} · 최대 3개</p><div class="pgrid">${F.decor.map((d, i) => `<button class="pcard ${chosen.has(i) ? 'on' : ''}" data-i="${i}"><img src="${decorIcon(d[1])}"><b>${d[0]}</b><small>${fmtMoney(d[2])} · 장식 +${d[3]}</small></button>`).join('')}</div><button id="fdOk" class="big">이렇게 꾸미기</button>`, (body) => {
        body.querySelectorAll('.pcard').forEach(b => b.onclick = () => { const i = +b.dataset.i; if (chosen.has(i)) chosen.delete(i); else if (chosen.size < 3) chosen.add(i); draw(); });
        body.querySelector('#fdOk').onclick = () => { const c2 = [...chosen].reduce((a, i) => a + F.decor[i][2], 0); if (!chosen.size) { toast('하나 이상 골라요'); return; } if (c2 > st.budget) { toast('예산이 모자라요'); return; } st.budget -= c2; st.decor = [...chosen]; st.step = 4; closePanel(); toast('🎪 장식과 가판대 배치 완료!'); save(); res(); };
      });
      G._panelClose = () => res();
    };
    draw();
  });
}
function festRolePick(key) {
  return new Promise(res => {
    const st = S.fest[key], F = FESTS[st.fid];
    const fits = { canola: ['farmer', 'lifeguard', 'postman'], fireworks: ['auntie', 'superman', 'lifeguard'], sports: ['kid', 'kid2', 'chief'], harvest: ['grandpa', 'farmer', 'superman'] }[st.fid];
    const cand = ['halmeoni', 'okja', 'kid', 'kid2', 'fisher', 'chief', 'postman', 'grandpa', 'farmer', 'lifeguard', 'auntie', 'superman'].filter(v => NPC_LOOKS[v]);
    let ri = 0; st.roles = {};
    const draw = () => {
      if (ri >= F.roles.length) { st.part += F.roles.reduce((a, r, i) => a + (st.roles[r] === fits[i] ? 3 : 1), 0); st.step = 5; closePanel(); toast('🙌 역할 배정 끝! 축제 준비 완료'); qSet('fest_' + key, { state: 'READY_TO_COMPLETE' }); save(); res(); return; }
      openPanel(`역할 배정 — ${F.roles[ri]}`, `<p class="psub">${ri + 1}/${F.roles.length} · 어울리는 사람을 고르면 참여도가 더 올라요</p><div class="pgrid">${cand.filter(v => !Object.values(st.roles).includes(v)).map(v => `<button class="pcard" data-v="${v}"><img src="${faceIcon(NPC_LOOKS[v], 'base', 'smile', v)}"><b>${NPC_LOOKS[v].name}</b></button>`).join('')}</div>`, (body) => {
        body.querySelectorAll('.pcard').forEach(b => b.onclick = () => { st.roles[F.roles[ri]] = b.dataset.v; ri++; draw(); });
      });
      G._panelClose = () => res();
    };
    draw();
  });
}
/* 주민 후원 */
async function festDonate(a) {
  const fe = Object.values(S.fest).find(st => st.joined && st.step === 1 && !st.done);
  if (!fe || fe.donors.includes(a.vid)) return false;
  await say('me', 'smile', `${FESTS[fe.fid].name} 준비 중인데, 조금 보태 주실 수 있을까요?`);
  await say(a.id, 'laugh', pick(['아이고, 그런 일이면 당연하지! 옜다.', '축제? 좋지~ 이거 보태.', '마을 일인데 빠질 수 있나.']));
  fe.donors.push(a.vid); fe.budget += 2000; fe.part += 1; toast(`💰 후원 +2,000원 (예산 ${fmtMoney(fe.budget)})`);
  if (fe.donors.length >= 3) { fe.step = 2; toast('예산이 모였어요! 이제 재료를 모아요'); }
  updateQuestBtn(); return true;
}
/* 축제 당일 — 실제 장소에서 진행 · 만족도 · 보상 */
async function festivalRun(fe) {
  const st = fe.st, F = FESTS[fe.id], P = G.player, d = G.det;
  if (st.done) return;
  st.done = true;
  const decor = st.decor.reduce((a, i) => a + F.decor[i][3], 0);
  const ready = st.step >= 5 ? 10 : st.step * 2;
  const tourists = G.visitors.length + (ferryPlan().cancel ? 0 : 2);
  const sat = Math.min(100, 35 + decor * 4 + ready * 2 + st.part * 2 + tourists * 2 + Math.min(10, Math.floor(st.budget / 1000)));
  const withDet = S.rel.flags.met && d.visible && d.map === P.map && dist(d, P) < 8;
  await say('narr', '', `${F.icon} 「${F.name}」 시작! ${st.joined ? '준비위원으로 뛴 보람이 있다.' : ''}`);
  if (withDet) await festivalWithDet(fe.id);
  const rep = Math.round(sat / 10); S.rep += rep; S.stats.festivals++;
  openPanel(`${F.icon} ${F.name} 결과`, `<div class="fres"><div><b>${sat}</b><span>관광객 만족도</span></div><div><b>${decor}</b><span>장식 점수</span></div><div><b>${st.part}</b><span>주민 참여도</span></div><div><b>${ready * 10}%</b><span>준비도</span></div><div><b>+${rep}</b><span>축제 평판</span></div><div><b>${S.rep}</b><span>마을 평판</span></div></div><p class="psub">${sat >= 80 ? '대성공! 섬 전체가 들썩였어요.' : sat >= 60 ? '즐거운 축제였어요.' : '아쉽지만 다음엔 더 잘할 수 있어요.'}</p>`);
  G._panelClose = () => {};
  const key = festKey(fe.id, fe.day);
  payOnce('fest_' + key, () => {
    const money = 3000 + sat * 60; S.money += money; floatText(P, '+' + fmtMoney(money));
    const got = [`💰 ${fmtMoney(money)}`];
    if (st.joined) { if (giveOutfit(F.outfit)) got.push('👘 한정 의상'); furnGive(F.furn); got.push('🛋 ' + FURN[F.furn].name); if (!S.frames.includes(F.frame)) { S.frames.push(F.frame); got.push('🖼 네컷 프레임'); } treasureFrag('festival'); }
    toast('🎁 ' + got.join(' · '));
  });
  qSet('fest_' + key, { state: 'COMPLETED' });
  addRumor('festival', { fest: F.name }, { key: 'fest' + key, days: 8 });
  memRecent('festival', `${F.name}에 함께했다`); memPerm('fest_' + fe.id, { name: F.name });
  await addAlbum(F.name, 'festival');
}
async function festivalWithDet(fid) {
  const d = G.det, P = G.player; scriptDet(); d.walkTo(P.x + 1, P.y); await waitUntil(() => !d.path.length, 6); d.lookAt(P); P.lookAt(d);
  const c = casualOn();
  if (fid === 'canola') { await say('det', 'smile', c ? '꽃길 진짜 잘 꾸몄다. 여기 서 봐, 사진 찍자.' : '꽃길 정말 잘 꾸미셨네요. 여기 서 보세요, 사진 찍어 드릴게요.'); burst(P, 'heart', 4); }
  else if (fid === 'fireworks') { await say('det', 'smile', c ? '저기, 첫 발 올라간다!' : '저기, 첫 발 올라가요!'); for (let i = 0; i < 4; i++) { spawnFx('fireworks'); await sleep(260); } await say('det', S.rel.stage >= 5 ? 'blush' : 'laugh', S.rel.stage >= 5 ? '불꽃보다 네 얼굴 보는 게 더 재밌네.' : c ? '하하, 매년 보는데도 매년 좋다.' : '하하, 매년 봐도 매년 좋네요.'); }
  else if (fid === 'sports') { await say('det', 'tease', c ? '2인 3각, 나랑 나가자. 발 묶는다?' : '2인 3각, 저랑 나가실래요? 발 묶습니다?'); const score = await threeLegged(); await say('det', score >= 5 ? 'laugh' : 'smile', score >= 5 ? (c ? '1등! 우리 호흡 완벽한데?' : '1등이에요! 호흡이 완벽했네요.') : (c ? '하하, 넘어질 뻔했다. 그래도 재밌었어.' : '하하, 넘어질 뻔했네요. 그래도 재밌었어요.')); if (score >= 5) furnGive('medal'); }
  else { await say('det', 'smile', c ? '귤 하나 까 줄게. 반은 내 거다?' : '귤 하나 까 드릴게요. 반은 제 겁니다?'); S.inv.tangerine = (S.inv.tangerine || 0) + 1; }
  addAff(5, { event: true });
  memRecent('festival', FESTS[fid].with);
}
async function threeLegged() {
  await say('narr', '', '🏃 2인 3각! 형사님과 발을 맞춰요. 「하나」(묶은 발) → 「둘」(바깥 발) 순서로!');
  let ok = 0;
  for (let i = 0; i < 6; i++) { const want = i % 2; const c = await choose(i % 3 === 2 ? ['둘!', '하나!'] : ['하나!', '둘!']); const pickIdx = i % 3 === 2 ? 1 - c : c; if (pickIdx === want) { ok++; Sound.sfx('tap'); burst(G.player, 'spark', 2); } else { Sound.sfx('splash'); G.det.emo('💦'); } }
  await say('narr', '', `발 맞춘 걸음: ${ok}/6`);
  return ok;
}
