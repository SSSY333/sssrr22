/* =====================================================================
   UI 정리 — 형사님 메뉴 · 행동 버튼(작은 보조 버튼) · 숨은 조이스틱 · 버튼 배치
   ===================================================================== */

/* ---------------- 장소별 할 일: 중복 · 겹치는 항목 정리 ---------------- */
{
  // 카메라는 메뉴 → 카메라, 데이트는 형사님 → 데이트, 가구는 「꾸미기」에서 — 같은 기능을 여기저기 두지 않음
  const DROP = ['사진 찍기', '가구 정리', '카페 데이트', '형사님과 소풍', '마을 행사 보기'];
  for (const k of Object.keys(PLACE_ACTS)) { const arr = PLACE_ACTS[k]; for (let i = arr.length - 1; i >= 0; i--) if (DROP.includes(arr[i].label)) arr.splice(i, 1); }
}
placeActsHere = function () {
  const pl = M.interior || M.hidden ? M.id : curPlace(), acts = [], seen = new Set();
  for (const key of [pl, PLACE_GROUP[pl]]) if (key && PLACE_ACTS[key]) for (const a of PLACE_ACTS[key]) { if (seen.has(a.label) || (a.cond && !a.cond())) continue; seen.add(a.label); acts.push(a); }
  return acts;
};

/* ---------------- 형사님 메뉴: 한 화면 9칸 + 묶음 ---------------- */
function detIt(id, over = {}) {
  const it = INTERACTIONS.find(i => i.id === id), P = G.player, d = G.det, st = S.rel.stage;
  const sitting = P.seat && d.seat && P.seat.bench === d.seat.bench;
  const o = { icon: it.icon, label: it.label };
  if (id === 'follow') { o.label = S.comp ? '동행 종료' : '함께 걷기'; if (S.comp) o.icon = '👋'; }
  if (id === 'hand' && S.hold) o.label = '손 놓기';
  if (id === 'arm' && S.arm) o.label = '팔짱 풀기';
  if (id === 'piggy' && P.carried) o.label = '내려 줘';
  if (st < it.stage) { o.locked = true; o.note = STAGES[it.stage - 1].name; o.why = `「${STAGES[it.stage - 1].name}」 단계에서 열려요`; }
  else if (it.companion && !S.comp && id !== 'sit') { o.disabled = true; o.note = '함께 걸을 때'; o.why = '먼저 「함께 걷기」를 해요'; }
  else if (it.sitting && !sitting) { o.disabled = true; o.note = '나란히 앉아서'; o.why = '벤치에 함께 앉았을 때 할 수 있어요'; }
  else if (it.home && M.id !== 'in_home') { o.disabled = true; o.note = '집 안에서'; o.why = '집 안 주방에서 할 수 있어요'; }
  o.onClick = () => doInteraction(id);
  return Object.assign(o, over);
}
function detSub(title, items, cols = 3) {
  items.push({ icon: '↩', label: '뒤로', onClick: () => detMenu() });
  openSheet({ title: `${detLabel()} · ${title}`, items, cols, onClose: () => { if (!G.busy) G.det.talking = false; } });
}
function detTouchMenu() {
  detSub('스킨십', ['arm', 'hand', 'hug', 'pat', 'cheek', 'lean', 'kiss', 'piggy', 'lap', 'backhug'].map(id => detIt(id)));
}
function detTogetherMenu() {
  const st = S.rel.stage, L = (n) => st < n ? { locked: true, note: STAGES[n - 1].name, why: `「${STAGES[n - 1].name}」 단계에서 열려요` } : {};
  detSub('함께 하기', [
    detIt('sit', { onClick: () => compAction('sit') }),
    detIt('fish'),
    detIt('cook'),
    detIt('favor'),
    detIt('photo'),
    Object.assign({ icon: '🎞', label: '네컷사진', note: '카페 옆 부스', onClick: () => { if (Math.hypot(G.player.x - P_('booth')[0], G.player.y - P_('booth')[1]) < 3 && G.player.map === 'island') runEvent(boothAction); else runEvent(async () => { await say('det', 'smile', casualOn() ? '좋아, 부스로 가자.' : '좋아요, 부스로 가요.'); if (!S.comp) startCompanion(); closeDialog(); walkToPOI('booth', '📸 네컷사진 부스로 같이 가요'); }); } }, L(3)),
    Object.assign({ icon: '💭', label: '추억 이야기', onClick: () => runEvent(async () => { const m = memoryLine(); await say('det', 'smile', m || (casualOn() ? '음… 우리 아직 추억이 별로 없네. 오늘 하나 만들까?' : '아직 함께한 추억이 많지 않네요. 하나 만들어 봐요.')); }) }, L(3)),
  ]);
}
const OUTINGS = [['beach', '🐚', '해수욕장'], ['lighthouse', '🗼', '등대'], ['cafeDoor', '☕', '카페 쉼터'], ['harbor', '⚓', '동쪽 포구'], ['pavilion', '🌲', '동백숲 정자'], ['campCenter', '⛺', '캠핑존'], ['playground', '🛝', '놀이터'], ['ranchIn', '🐴', '조랑말 목장'], ['windmill', '🌬', '풍차 언덕'], ['observatory', '⭐', '오름 전망대'], ['rocks', '🪨', '갯바위'], ['farm', '🍊', '귤 농장']];
function detOutingMenu() {
  const st = S.rel.stage;
  if (st >= 5) {
    // 연인부터는 데이트 장소(특별한 대사 · 추억) — 같은 곳을 「걸어가기」로 또 넣지 않음
    const items = Object.entries(DATES).map(([k, D]) => { const lock = D.minStage && st < D.minStage; return { icon: D.icon, label: D.name, locked: lock, why: `「${lock ? STAGES[D.minStage - 1].name : ''}」 단계에서 열려요`, note: lock ? STAGES[D.minStage - 1].name : D.time && S.min < D.time ? `${fmtTime(D.time)}부터` : '', onClick: () => doDate(k) }; });
    detSub('데이트', items, 3); return;
  }
  const go = (k, name) => () => { if (G.player.map !== 'island') { toast('밖으로 나가서 가요'); return; } if (!S.comp) startCompanion(); const [x, y] = P_(k); walkPlayer(x, y); toast(`${name}(으)로 같이 걸어가요` + (Math.hypot(G.player.x - x, G.player.y - y) > 40 ? ' · 멀면 🚌 마을버스가 빨라요' : '')); };
  detSub('같이 가기', OUTINGS.filter(([k]) => POI[k]).map(([k, i, n]) => ({ icon: i, label: n, onClick: go(k, n) })), 3);
}
detMenu = function () {
  const r = S.rel, d = G.det, P = G.player;
  if (!r.flags.met) { runEvent(firstMeeting); return; }
  const caseRep = Object.entries(S.cases).find(([, st]) => st.step === 'report'); if (caseRep) { runEvent(() => caseConsult(caseRep[0])); return; }
  const ap = activeAppt(S.min); if (ap && d.apptArrived === ap.id) { d.apptArrived = null; runEvent(() => apptMeet(ap)); return; }
  if (d.task === 'sick' && !r.daily.nursed) { runEvent(sickEvent); return; }
  if (d.task === 'waitLighthouse' && !r.flags.engaged) { runEvent(proposalEvent); return; }
  if (d.task === 'wedding' && !r.flags.married) { runEvent(weddingEvent); return; }
  if (d.task === 'pickup' && !r.daily.pickup) { runEvent(pickupEvent); return; }
  d.talking = true; d.stop(); d.lookAt(P); P.lookAt(d);
  const st = r.stage;
  const items = [detIt('greet'), detIt('talk'), detIt('follow'), detIt('gift'),
    Object.assign({ icon: '💞', label: '스킨십', onClick: detTouchMenu }, st < 4 ? { locked: true, note: STAGES[3].name, why: `「${STAGES[3].name}」 단계에서 열려요` } : {}),
    { icon: '🌿', label: '함께 하기', onClick: detTogetherMenu },
    { icon: st >= 5 ? '💗' : '👣', label: st >= 5 ? '데이트' : '같이 가기', onClick: detOutingMenu },
    Object.assign({ icon: '📅', label: '약속 잡기', onClick: () => runEvent(apptMenu) }, st < 3 ? { locked: true, note: STAGES[2].name, why: `「${STAGES[2].name}」 단계에서 열려요` } : {}),
  ];
  // 고백 · 프로포즈 · 결혼 날짜: 지금 할 수 있을 때만 한 칸
  for (const id of ['confess', 'propose', 'wedding']) { const it = INTERACTIONS.find(i => i.id === id); if (st >= it.stage && st <= it.maxStage && !(id === 'confess' && r.flags.lovers)) { items.push(Object.assign(detIt(id), { hot: true })); break; } }
  openSheet({ title: detLabel(), sub: relSummaryHTML(), items, cols: 3, onClose: () => { if (!G.busy) d.talking = false; } });
};
activityMenu = function () { G.det.talking = true; detTogetherMenu(); };
dateMenu = function () { G.det.talking = true; detOutingMenu(); };

/* ---------------- 행동 버튼: 큰 버튼 하나 + 작은 보조 버튼 ---------------- */
const _computeActionUI = computeAction;
computeAction = function () {
  const a = _computeActionUI();
  if (!a || !a.cands) return a;
  return a;
};
function actKey(a) { return a ? a.label + '|' + (a.cands || []).map(c => c.label).join(',') : ''; }
const _setActionUI = setAction;
setAction = function (a, lock) {
  _setActionUI(a, lock);
  let box = $('#actChips');
  if (!box) { box = document.createElement('div'); box.id = 'actChips'; $('#game').appendChild(box); }
  const extra = a && a.cands ? a.cands.slice(1) : [];
  box.innerHTML = ''; box.classList.toggle('hidden', !extra.length);
  for (const c of extra) {
    const b = document.createElement('button'); b.className = 'chip'; b.innerHTML = `<span>${c.icon}</span><b>${c.label}</b>`;
    b.onclick = (e) => { e.stopPropagation(); Sound.init(); Sound.sfx('tap'); if (!paused() && !G.busy) c.fn(); };
    box.appendChild(b);
  }
};

/* ---------------- 숨은 조이스틱 (왼쪽 아래를 끌면 이동, 누르기는 그대로) ---------------- */
G.joy = null;
function bindJoystick() {
  const view = R.view;
  const zone = (e) => { const r = $('#game').getBoundingClientRect(); return e.clientX - r.left < r.width * 0.5 && e.clientY - r.top > r.height * 0.5; };
  view.addEventListener('pointerdown', (e) => {
    if (G.dev || G.decor || !G.started || G.joy || !zone(e)) return;
    G.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, on: false };
  });
  view.addEventListener('pointermove', (e) => {
    const j = G.joy; if (!j || j.id !== e.pointerId) return;
    const dx = e.clientX - j.x0, dy = e.clientY - j.y0, L = Math.hypot(dx, dy);
    if (!j.on && L > 14) j.on = true;
    if (j.on) { const k = Math.min(1, L / 34); j.dx = dx / (L || 1) * k; j.dy = dy / (L || 1) * k; }
  });
  const end = (e) => { const j = G.joy; if (j && j.id === e.pointerId) { G.joy = null; if (j.on) { G.player.moving = false; G._suppressTap = true; setTimeout(() => { G._suppressTap = false; }, 50); } } };
  view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
}
const _keyMoveUI = keyMove;
keyMove = function (dt) {
  const j = G.joy;
  if (!j || !j.on || G.pinching || (Math.abs(j.dx) + Math.abs(j.dy) < 0.12)) return _keyMoveUI(dt);
  const P = G.player; if (P.seat) standUpPlayer();
  P.path = []; G.pending = null;
  let mx = j.dx + j.dy, my = j.dy - j.dx; const l = Math.hypot(mx, my) || 1; mx /= l; my /= l;
  const sp = P.speed * dt * 1.7 * Math.max(0.6, Math.min(1, Math.hypot(j.dx, j.dy)));
  const ok = (x, y) => [[0.25, 0.25], [-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25]].every(([a, b]) => walkable(Math.floor(x + a), Math.floor(y + b)));
  const ox = P.x, oy = P.y;
  if (ok(P.x + mx * sp, P.y)) P.x += mx * sp;
  if (ok(P.x, P.y + my * sp)) P.y += my * sp;
  P.faceTo(mx, my); P.moving = true; P.anim += Math.hypot(P.x - ox, P.y - oy) * 3.4;
  return true;
};
/* 조이스틱으로 끈 뒤에는 그 자리 「누르기 이동」이 일어나지 않게 */
const _onTapUI = onTap;
onTap = function (px, py) { if (G._suppressTap) return; return _onTapUI(px, py); };

/* ---------------- 오른쪽 버튼 정리: 지도 · 퀘스트를 한 줄로 ---------------- */
function tidyHud() {
  const mb = $('#mapBtn'), qb = $('#questBtn'); if (!mb || !qb || qb.parentNode === mb.parentNode) return;
  const row = document.createElement('div'); row.id = 'sideBtns';
  mb.parentNode.insertBefore(row, mb); row.appendChild(mb); row.appendChild(qb);
}
window.addEventListener('DOMContentLoaded', () => { tidyHud(); setTimeout(() => { if (R.view) bindJoystick(); }, 0); });
