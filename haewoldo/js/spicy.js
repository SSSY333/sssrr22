/* =====================================================================
   🥵 아찔한 연애 모드 — 새 게임에서 고르는 별개 모드 (저장 칸마다 기록)
   · 섬 · 주민 · 결혼/부부 이벤트는 그대로, 형사님의 끌림 · 플러팅 · 속도만 달라요
   · 호감도 약 2배 · 단계 문턱 ↓ · 자연 감소 없음 · 먼저 다가오는 횟수 ↑
   · 성인 둘의 동의가 전제: 모든 스킨십 · 하룻밤은 선택지로 묻고, 거절하면 형사님이 물러나요
   · 하룻밤은 분위기 · 대화 · 포옹 · 입맞춤 · 화면 전환으로만 (노골적 묘사 없음)
   ===================================================================== */
const spOn = () => !!(S && S.romanceMode === 'SPICY');
function spState() {
  if (!S.spicy) S.spicy = {};
  return Object.assign(S.spicy, Object.assign({ firstAttractionTriggered: false, firstNightEventCompleted: false, morningAfterEventCompleted: false, romanticApproachHistory: [], unlockedSpicyEvents: {}, consentChoices: [], dialogueHistory: [], recent: [], last: {} }, S.spicy));
}
const spBand = (st = S.rel.stage) => st >= 8 ? 8 : st >= 6 ? 6 : st >= 5 ? 5 : st >= 4 ? 4 : st >= 2 ? 2 : 1;
function spLog(kind, id) { const s = spState(), arr = kind === 'approach' ? s.romanticApproachHistory : s.dialogueHistory; arr.unshift({ id, day: S.day, min: S.min }); if (arr.length > 60) arr.length = 60; }
function spConsent(id, yes) { const s = spState(); s.consentChoices.unshift({ id, yes: !!yes, day: S.day }); if (s.consentChoices.length > 40) s.consentChoices.length = 40; }
/* 최근에 한 말은 피해서 고르기 */
function spPick(pool) {
  if (!pool || !pool.length) return null;
  const s = spState(), fresh = pool.filter(t => !s.recent.includes(typeof t === 'string' ? t : JSON.stringify(t).slice(0, 40)));
  const v = pick(fresh.length ? fresh : pool), key = typeof v === 'string' ? v : JSON.stringify(v).slice(0, 40);
  s.recent.unshift(key); if (s.recent.length > 40) s.recent.length = 40; return v;
}
function spTalkPool() {
  const b = spBand(), h = S.min / 60, tk = h < 11 ? 'morning' : h < 16 ? 'noon' : h < 19.5 ? 'evening' : 'night', pl = M.interior ? M.id : curPlace();
  const pg = typeof PLACE_GROUP !== 'undefined' ? PLACE_GROUP[pl] : null;
  return [...SP.talk[b], ...SP.talk[b], ...(b <= 2 ? SP.job[S.job] || [] : []), ...(SP.time[tk] || []), ...(SP.weather[S.weather] || []), ...(SP.place[pl] || SP.place[pg] || [])];
}

/* ---------------- 새 게임: 연애 모드 고르기 ---------------- */
window.addEventListener('DOMContentLoaded', () => {
  const after = $('.bdayRow') || ($('#detIn') && $('#detIn').closest('label')); if (!after || $('#modeRow')) return;
  const wrap = document.createElement('section'); wrap.id = 'modeRow'; wrap.className = 'modeRow';
  wrap.innerHTML = `<div class="lbl">연애 모드</div><div class="modes"><button type="button" class="mode on" data-m="NORMAL"><b>🌷 일반 모드</b><small>천천히 가까워지는 연애. 친해진 뒤 연애와 스킨십</small></button><button type="button" class="mode" data-m="SPICY"><b>🥵 아찔한 모드</b><small>첫 만남부터 강하게 끌리는 형사님. 대담한 플러팅 · 빠른 관계 · 하룻밤 선택 이벤트 (성인 로맨스)</small></button></div>`;
  after.after(wrap);
  wrap.querySelectorAll('.mode').forEach(b => b.onclick = () => { Sound.sfx && Sound.sfx('tap'); wrap.querySelectorAll('.mode').forEach(x => x.classList.toggle('on', x === b)); });
});
const _newStateSp = newState;
newState = function (name, job, hair, detName) {
  const s = _newStateSp(name, job, hair, detName);
  const on = document.querySelector('#modeRow .mode.on');
  s.romanceMode = on && on.dataset.m === 'SPICY' ? 'SPICY' : 'NORMAL';
  if (s.romanceMode === 'SPICY') s.spicy = {};
  return s;
};

/* ---------------- 난이도: 단계 문턱 · 고백 · 프로포즈 ---------------- */
const SP_NEED0 = STAGES.map(st => st.need ? JSON.parse(JSON.stringify(st.need)) : null);
const SP_NEED = { 2: { aff: 20, days: 1 }, 3: { aff: 60, days: 2 }, 4: { aff: 130, days: 4, together: 90 }, 6: { aff: 420, loverDays: 7 } };
function spApplyPace() {
  STAGES.forEach((st, i) => { if (SP_NEED0[i]) st.need = JSON.parse(JSON.stringify(SP_NEED0[i])); });
  if (spOn()) for (const [n, nd] of Object.entries(SP_NEED)) Object.assign(STAGES[n - 1].need, nd);
  spRivalLines(spOn());
}
const _confessReadySp = confessReady;
confessReady = function () {
  if (!spOn()) return _confessReadySp();
  const r = S.rel; return r.stage === 4 && r.aff >= 200 && daysKnown() >= 5 && !r.flags.lovers && !r.flags.declined && S.day - r.confessDay >= 2 && S.min >= 16 * 60;
};
/* 말 놓기: 아는 사이부터 */
const _banmalDueSp = banmalDue;
banmalDue = function () {
  const r = S.rel;
  if (spOn() && r.stage === 2 && !r.flags.banmal && r.flags.met) { r.stage = 3; try { return _banmalDueSp(); } finally { r.stage = 2; } }
  return _banmalDueSp();
};
/* 호감도 약 2배 · 하루 상한 두 배 */
const _addAffSp = addAff;
addAff = function (n, opts = {}) {
  if (!spOn() || !n || n < 0) return _addAffSp(n, opts);
  const r = S.rel;
  if (opts.event) return _addAffSp(Math.round(n * 1.5), opts);
  const cap = DAILY_AFF_CAP * 2, left = cap - r.daily.affGain;
  if (left <= 0) { if (!opts.quiet && Math.random() < 0.3) floatText(G.det, '♥ 오늘은 충분해요', '#ffd3de'); return; }
  const m = Math.min(n * 2, left); r.daily.affGain += m;
  return _addAffSp(m, Object.assign({}, opts, { event: true }));
};
/* 자연 감소 없음 · 하룻밤 뒤 아침 */
const _endDaySp = endDay;
endDay = async function (forced) {
  const sp = spOn(), aff0 = S && S.rel.aff, night = sp && spState().nightPending;
  await _endDaySp(forced);
  if (sp && S.rel.aff < aff0) S.rel.aff = aff0;
  if (night) { spState().nightPending = null; setTimeout(() => runEvent(() => spMorningAfter(night)), 200); }
};
/* 시작할 때마다 모드에 맞게 */
const _startGameSp = startGame;
startGame = function (state, isNew) {
  if (state && !state.romanceMode) state.romanceMode = 'NORMAL';
  _startGameSp(state, isNew); spApplyPace();
  document.body.classList.toggle('spicyOn', spOn());
  if (spOn()) { spState(); if (isNew) setTimeout(() => toast('🥵 아찔한 모드 — 형사님이 처음 본 순간부터 당신을 의식해요'), 2600); }
};

/* ---------------- 대사 출력: 한 줄 또는 [행동 → 대사] 묶음 ---------------- */
async function spBeat(item, expr = 'normal') {
  if (!item) return;
  if (typeof item === 'string') return say('det', expr, item);
  for (const [e, t] of item) { if (e === 'n') await say('narr', '', t); else await say('det', e, t); }
}
/* 장면: 행동 서술 · 대사 · 선택 (topic 과 같은 형식, 'n' = 행동) */
async function spScene(sc) {
  for (const [e, t] of sc.t) { if (e === 'n') await say('narr', '', t); else await say('det', e, t); }
  const i = await choose(sc.c.map(c => c[0]));
  const [, aff, reply, ex] = sc.c[i];
  await say('det', ex, reply); addAff(aff); return i;
}
/* 웃음소리 지우기: 아찔한 모드에서 형사님 대사의 「하하 · 허허 · 후후 · 큭 · 흐음」 */
const SP_LAUGH = /(^|[\s(…])(?:하하+|허허+|후후+|흐흐+|크크+|큭+|흐음+)[,.!?~…]*\s*/g;
function spClean(t) { if (typeof t !== 'string') return t; const s = t.replace(SP_LAUGH, '$1').replace(/\s{2,}/g, ' ').trim(); return s || t; }

/* ---------------- 대사 바꿔 끼우기 ---------------- */
/* 인사 · 스킨십 · 먼저 다가오기에서 형사님 말 한 줄을 아찔한 모드 대사로 */
G.spCtx = null;
const _doInteractionSp = doInteraction;
doInteraction = function (id) {
  if (spOn()) {
    const r = S.rel, first = { hand: !r.flags.hand, kiss: !r.flags.kiss, cheek: !r.flags.cheek }[id];
    G.spCtx = first && SP.first[id] ? { k: 'first', id, at: Date.now() } : SP.inter[id] ? { k: 'inter', id, at: Date.now() } : id === 'greet' ? { k: 'greet', at: Date.now() } : null;
  }
  return _doInteractionSp(id);
};
const _detApproachSp = detApproach;
detApproach = async function () { if (spOn()) G.spCtx = { k: 'approach', at: Date.now() }; try { return await _detApproachSp(); } finally { G.spCtx = null; } };
const _saySp = say;
say = function (who, expr, text) {
  if (who === 'det' && spOn()) {
    const c = G.spCtx;
    if (c && Date.now() - c.at > 6000) G.spCtx = null;
    if (c && G.spCtx && typeof text === 'string' && text.replace(/[.…\s]/g, '').length > 3) {
      G.spCtx = null;
      const b = spBand(), pool = c.k === 'first' ? SP.first[c.id] : c.k === 'inter' ? SP.inter[c.id] : c.k === 'greet' ? SP.greet[b] : SP.approach[b];
      const t = spPick(pool);
      if (t) { spLog('line', c.k); if (typeof t === 'string') return _saySp(who, expr, t); return (async () => { for (const [e, x] of t) { if (e === 'n') await _saySp('narr', '', x); else await _saySp('det', e, x); } })(); }
    }
    text = spClean(text);
  }
  return _saySp(who, expr, text);
};
const _actorSaySp = Actor.prototype.say;
Actor.prototype.say = function (text, t) { if (this.id === 'det' && spOn()) text = spClean(text); return _actorSaySp.call(this, text, t); };
/* 하루 대화: 이야기 순서는 그대로 두고, 아찔한 대사 · 짧은 장면을 많이 섞음 */
const _dailyTalkSp = dailyTalk;
dailyTalk = async function () {
  if (!spOn() || S.rel.daily.fight) return _dailyTalkSp();
  const r = S.rel, b = spBand();
  if (r.daily.talk === 0 && Math.random() < 0.4) { await _dailyTalkSp(); await spBeat(spPick(spTalkPool())); return; }
  const scenes = SP.scene[b] || [];
  if (scenes.length && Math.random() < 0.4) { spLog('line', 'scene'); await spScene(spPick(scenes)); }
  else { await spBeat(spPick(spTalkPool()), b >= 4 ? 'normal' : 'smile'); addAff(1); }
  r.daily.talk++; memRecent('talk', '형사님과 이야기했다');
};
/* 벤치 · 돗자리 · 텐트 커플 행동 대사 */
const _coupleActSp = coupleAct;
coupleAct = async function (k, id) {
  if (!spOn() || !SP.couple[id]) return _coupleActSp(k, id);
  const prev = G._coupleOverride; G._coupleOverride = Object.assign({}, prev || {}, { [id]: SP.couple[id] });
  try { return await _coupleActSp(k, id); } finally { G._coupleOverride = prev; }
};
/* 주민 대사: 여성 주민들이 형사님 이야기 */
const _villagerLineSp = villagerLine;
villagerLine = function (vid) {
  if (spOn() && SP.npc[vid] && Math.random() < 0.35) return spPick(SP.npc[vid]);
  return _villagerLineSp(vid);
};
const SP_RIVAL_ADDED = { chat: [], before: [], after: [] };
function spRivalLines(on) {
  const rm = (arr, add) => { for (const x of add) { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); } };
  rm(RIVAL_CHAT, SP_RIVAL_ADDED.chat); rm(RIVAL_TALK.before, SP_RIVAL_ADDED.before); rm(RIVAL_TALK.after, SP_RIVAL_ADDED.after);
  SP_RIVAL_ADDED.chat = []; SP_RIVAL_ADDED.before = []; SP_RIVAL_ADDED.after = [];
  if (!on) return;
  for (const x of SP.rivalChat) { RIVAL_CHAT.push(x); SP_RIVAL_ADDED.chat.push(x); }
  for (const x of SP.rivalTalk.before) { RIVAL_TALK.before.push(x); SP_RIVAL_ADDED.before.push(x); }
  for (const x of SP.rivalTalk.after) { RIVAL_TALK.after.push(x); SP_RIVAL_ADDED.after.push(x); }
}
/* 함께 걸을 때 한마디 */
const _compLineSp = compLine;
compLine = function () { if (spOn() && Math.random() < 0.6) { const t = spPick(SP.walk[spBand()]); if (typeof t === 'string') return t; } return _compLineSp(); };

/* ---------------- 연출 도우미 ---------------- */
function spNear(px = 4) { const P = G.player, d = G.det, sx = (a, b) => (iso(b.x, b.y)[0] - iso(a.x, a.y)[0]) > 0 ? 1 : -1; P.ox = sx(P, d) * px; d.ox = sx(d, P) * px; P.lookAt(d); d.lookAt(P); }
function spReset() { const P = G.player, d = G.det; P.ox = P.oy = d.ox = d.oy = 0; P.lean = d.lean = false; }
async function spHug() { spNear(5); burst(G.det, 'heart', 6); burst(G.player, 'heart', 4); Sound.sfx('heart'); await sleep(500); }
async function spComeClose() {
  const d = G.det, P = G.player; scriptDet();
  if (d.map !== P.map || !d.visible) { d.map = P.map; d.visible = true; if (M.interior && M.exit) { [d.x, d.y] = nearestWalkable(M.exit[0] + 0.5, M.exit[1] - 0.5, M); } else { [d.x, d.y] = nearestWalkable(P.x + 5, P.y + 3, M); } }
  if (dist(d, P) > 1.6) { d.walkTo(P.x, P.y); if (d.path.length) d.path.pop(); await waitUntil(() => !d.path.length, 7); }
  d.lookAt(P); P.lookAt(d);
}
const spDet = (e, t) => say('det', e, t);
const spAct = (t) => say('narr', '', t);
const spMe = (t) => say('me', 'blush', t);
const spB = (st4, st1) => S.rel.stage >= 4 || casualOn() ? st4 : st1;   // 말 놓은 뒤 / 존댓말
async function spChoose(opts, id) { const i = await choose(opts); if (id) spConsent(id + ':' + i, i === 0); return i; }
function spDone(id) { const s = spState(); s.unlockedSpicyEvents[id] = (s.unlockedSpicyEvents[id] || 0) + 1; s.last[id] = S.day; spLog('approach', id); }
async function spGoInside(id) {
  const m = MAPS[id], P = G.player, d = G.det; if (!m) return false;
  await goMap(id, m.spawn.door[0], m.spawn.door[1] - 1);
  d.map = id; d.visible = true; d.state = 'script'; d.scripted = true; [d.x, d.y] = nearestWalkable(m.spawn.door[0] + 1, m.spawn.door[1] - 1, m);
  d.lookAt(P); P.lookAt(d); return true;
}
/* 밤을 함께 보내기: 화면 전환 → 다음 날 아침 */
async function spSpendNight(place) {
  const s = spState();
  s.nightPending = place;
  await fade(true); await spAct('조명이 하나씩 꺼지고, 바깥 파도 소리만 남았다.'); closeDialog();
  G.busy--; try { await endDay(false); } finally { G.busy++; }
}

/* ---------------- 아찔한 모드 전용 이벤트 ---------------- */
const SP_EVENTS = [
  /* 1. 첫 만남 직후 — 연락처 */
  { id: 'sp_number', once: true, ok: () => S.rel.flags.met && !spState().firstAttractionTriggered, run: async () => {
    const s = spState(); s.firstAttractionTriggered = true;
    await spComeClose();
    for (const [e, t] of (S.job === 'haenyeo' ? SP.attractHaenyeo : SP.attract)) { if (e === 'n') await spAct(t); else await spDet(e, t); }
    await spDet('normal', '연락처 받아도 될까요?');
    const i = await spChoose(['번호를 알려 준다', '다음에 또 보면요', '…왜요?'], 'number');
    if (i === 0) { await spAct('형사님이 번호를 저장하고, 화면을 한 번 더 확인한다.'); await spDet('smile', '오늘 저녁에 연락할게요.'); s.phone = true; addAff(6, { event: true }); }
    else if (i === 1) await spDet('normal', '그래요. 섬이 좁으니까 금방 또 볼 거예요.');
    else { await spAct('형사님이 잠깐 말을 고른다.'); await spDet('normal', '다시 보고 싶어서요. 그게 다예요.'); addAff(3, { event: true }); }
    memPerm('spAttract', { day: S.day });
  } },
  /* 2. 순찰 중 걸음을 멈춘 형사님 */
  { id: 'sp_patrolStop', cd: 3, st: 1, ok: () => !S.comp && detPlan(S.min).duty && !M.interior, run: async () => {
    await spComeClose(); await spAct('순찰 중이던 형사님이 이쪽을 보고 걸음을 멈춘다.');
    await spDet('normal', spB('지금 어디 가?', '지금 어디 가세요?'));
    await spDet('normal', spB('급한 거 아니면 같이 걷자. 순찰 코스 그쪽이야.', '급한 일 없으면 같이 걸을래요? 마침 그쪽 순찰이에요.'));
    const i = await spChoose(['같이 걸어요', '다음에요']);
    if (i === 0) { await spDet('smile', spB('가자.', '가요.')); startCompanion({ dutyUntil: S.min + 90 }); addAff(3); }
    else await spDet('normal', spB('응. 이따 연락할게.', '알겠어요. 이따 연락할게요.'));
  } },
  /* 3. 마주칠 때 짧고 직접적인 말 */
  { id: 'sp_compliment', cd: 1, st: 1, ok: () => true, run: async () => {
    await spComeClose();
    const L = { 1: [[['n', '형사님이 잠시 시선을 맞춘다.'], ['normal', '오늘 옷 잘 어울려요.']], '얼굴 보니까 좋네요.', [['n', '형사님이 가던 길을 멈추고 돌아선다.'], ['normal', '잠깐 얘기할 시간 있어요?']]], 2: ['오늘 보고 싶었어요.', [['n', '형사님이 다가와 옆에 선다.'], ['normal', '오늘 좋아 보여요.']]], 4: ['오늘 좋아 보인다.', '너 보고 싶어서 왔어.', [['n', '형사님이 잠시 말없이 바라본다.'], ['normal', '…그냥. 보고 싶었어.']]], 5: ['오늘 많이 보고 싶었어.', [['n', '형사님이 손을 내민다.'], ['normal', '손 줘.']]], 6: ['오늘 자고 가.', [['n', '형사님이 머리카락을 귀 뒤로 넘겨 준다.'], ['normal', '오늘 저녁 같이 먹자.']]], 8: ['여보, 오늘 일찍 와.', [['n', '형사님이 짧게 입을 맞추고 떨어진다.'], ['normal', '갔다 올게.']]] }[spBand()];
    await spBeat(spPick(L));
    const i = await spChoose(['나도 보고 싶었어요', '(웃는다)', '바빠서 이만']);
    if (i === 0) { await spAct('형사님이 짧게 웃는다.'); await spDet('normal', spB('다행이다.', '다행이네요.')); addAff(3); }
    else if (i === 1) { await spDet('normal', spB('그렇게 웃으면 더 있고 싶어지잖아.', '그렇게 웃으시면 더 있고 싶어져요.')); addAff(2); }
    else await spDet('normal', spB('응. 이따 보자.', '네. 이따 봬요.'));
  } },
  /* 4. 저녁 식사 신청 */
  { id: 'sp_dinner', cd: 6, st: 1, ok: () => S.min >= 16 * 60 && S.min < 19 * 60 && !M.interior, run: async () => {
    await spComeClose();
    await spDet('normal', spB('오늘 저녁에 시간 있어?', '오늘 저녁에 시간 있으세요?'));
    await spDet('normal', spB('나랑 저녁 먹자.', '같이 식사할래요?'));
    const i = await spChoose(['좋아요', '오늘은 어려워요'], 'dinner');
    if (i === 1) { await spDet('normal', spB('알았어. 다음에 또 물어볼게.', '알겠어요. 다음에 또 물어볼게요.')); return; }
    await walkBothTo(P_('sashimiDoor'), [P_('sashimiDoor')[0] + 1, P_('sashimiDoor')[1]]);
    await fade(true); advanceTime(80); await sleep(300); await fade(false);
    await spAct('🍣 마주 앉은 저녁. 형사님은 말수가 적었지만, 이쪽 접시가 비면 말없이 채워 주었다.');
    await spAct('식당을 나서는 길, 형사님이 잠깐 걸음을 늦춘다.');
    await spDet('normal', spB('오늘 좋았어. 또 하자.', '오늘 좋았어요. 또 해요.'));
    addAff(8, { event: true }); if (!S.rel.flags.spDinner) { S.rel.flags.spDinner = true; await addAlbum('형사님이 먼저 신청한 저녁', 'date'); }
  } },
  /* 5. 밤 해안 산책로 · 손잡기 */
  { id: 'sp_nightSea', cd: 5, st: 2, ok: () => S.min >= 19.5 * 60 && S.min < 23 * 60 && !M.interior && !rainy(), run: async () => {
    const d = G.det; await spComeClose();
    await spDet('normal', spB('바다 쪽 좀 걸을래?', '바다 쪽 좀 걸을래요?'));
    if (await spChoose(['좋아요', '오늘은 피곤해요']) === 1) { await spDet('normal', spB('그래. 집 앞까지 데려다줄게.', '그래요. 집 앞까지 데려다줄게요.')); return; }
    await walkBothTo(P_('promenade'), [P_('promenade')[0] + 1, P_('promenade')[1]]);
    spNear(3); await spAct('🌊 밤바람이 분다. 파도 소리 말고는 아무 소리도 없다.');
    await spDet('normal', spB('바람 좀 부네. 추우면 말해.', '바람 좀 부네요. 추우면 말해요.'));
    await spAct('형사님이 손을 내민다.');
    await spDet('normal', spB('손잡을래?', '손잡을래요?'));
    const i = await spChoose(['(손을 잡는다)', '아직은요'], 'hand');
    if (i === 0) { S.hold = true; S.arm = false; spNear(4); burst(d, 'heart', 4); await spAct('형사님이 손가락을 가볍게 맞잡는다. 그대로 한동안 말없이 걸었다.'); if (!S.rel.flags.hand) { S.rel.flags.hand = true; await addAlbum('밤바다에서 잡은 손', 'hand'); } addAff(6, { event: true }); }
    else { spReset(); await spDet('normal', spB('알았어. 그럼 이렇게 걷자.', '알겠어요. 그럼 이렇게 걸어요.')); addAff(2); }
  } },
  /* 6. 정자에 가까이 앉기 */
  { id: 'sp_pavilion', cd: 6, st: 2, ok: () => ['forest', 'pavilion'].includes(curPlace()) && !M.interior, run: async () => {
    await spComeClose(); await spDet('normal', spB('정자에 좀 앉았다 가자.', '정자에 좀 앉았다 가요.'));
    if (await spChoose(['좋아요', '그냥 걸어요']) === 1) { await spDet('normal', spB('그래, 걷자.', '그래요, 걸어요.')); return; }
    const bk = Object.keys(M.benches).find(k => /정자/.test(M.benches[k].name || '')) || Object.keys(M.benches).find(k => M.benches[k].place === 'pavilion');
    if (bk) { const b = M.benches[bk]; await walkBothTo([b.stand[0][0] + 0.5, b.stand[0][1] + 0.5], [b.stand[1][0] + 0.5, b.stand[1][1] + 0.5]); G.player.sitAt(bk, 0); G.det.sitAt(bk, 1); await sleep(400); if (!S.rel.flags.firstSit) { S.rel.flags.firstSit = true; await addAlbum('나란히 앉은 시간', 'sit'); } }
    spNear(4); await spAct('좁은 정자. 어깨가 닿는다. 형사님은 자리를 옮기지 않는다.');
    await spDet('normal', spB('오늘은 사람도 없네.', '오늘은 사람도 없네요.'));
    const i = await spChoose(['(어깨에 기댄다)', '(조용히 앉아 있는다)']);
    if (i === 0) { G.player.lean = true; burst(G.det, 'heart', 4); await spAct('형사님이 어깨를 조금 낮춰 준다.'); await spDet('normal', spB('편하게 있어.', '편하게 있어요.')); addAff(6, { event: true }); }
    else { await spAct('한동안 둘 다 말이 없다. 나뭇잎 흔들리는 소리만 들린다.'); await spDet('normal', spB('좀 더 있다 가자.', '좀 더 있다 가요.')); addAff(3); }
    spReset();
  } },
  /* 7. 캠핑장 — 고기 굽고 텐트에서 쉬기 */
  { id: 'sp_tent', cd: 7, st: 2, ok: () => S.min >= 18 * 60 && S.min < 23.5 * 60 && !M.interior && !rainy(), run: async () => {
    await spComeClose(); await spDet('normal', spB('캠핑장 가서 고기 구워 먹을래?', '캠핑장 가서 고기 구워 먹을래요?'));
    if (await spChoose(['좋아요', '다음에요']) === 1) { await spDet('normal', spB('그래. 다음에 가자.', '그래요. 다음에 가요.')); return; }
    const t = P_('tentA'); await walkBothTo([t[0], t[1] + 1], [t[0] + 1, t[1] + 1]);
    spNear(3); G.det.prop = 'tongs';
    await spDet('normal', spB('내가 구울게. 너는 앉아 있어.', '제가 구울게요. 앉아 있어요.'));
    await spAct('🔥 형사님이 잘 익은 고기를 이쪽 접시에 먼저 올려 준다.');
    G.det.prop = null;
    await spDet('normal', spB('먹고 텐트에서 좀 쉴까?', '먹고 텐트에서 좀 쉴까요?'));
    const i = await spChoose(['네, 쉬어요', '여기서 불 봐요'], 'tent');
    if (i === 0 && MAPS.in_tentA) {
      if (S.comp) endCompanion(true); await spGoInside('in_tentA');
      spNear(3); await spDet('normal', spB('여기 생각보다 괜찮네.', '여기 생각보다 괜찮네요.'));
      await spAct('형사님이 침낭 옆자리를 비워 준다.');
      await spDet('normal', spB('옆으로 와. 기대도 돼.', '옆으로 와요. 기대도 돼요.'));
      G.player.lean = true; burst(G.det, 'heart', 4);
      await spAct('텐트 천 너머로 모닥불 빛이 흔들린다. 둘은 낮은 목소리로 한참 이야기를 나눴다.');
      await spDet('normal', spB('오늘은 그냥 같이 있자.', '오늘은 그냥 같이 있어요.'));
      addAff(7, { event: true });
    } else { await spAct('타닥타닥 장작 타는 소리. 형사님이 겉옷을 벗어 어깨에 걸쳐 준다.'); await spDet('normal', spB('추우면 말해.', '추우면 말해요.')); addAff(5, { event: true }); }
    if (!S.rel.flags.spTent) { S.rel.flags.spTent = true; await addAlbum('캠핑장의 밤', 'date'); }
    spReset();
  } },
  /* 8. 비 오는 날 — 우산 하나 */
  { id: 'sp_umbrella', cd: 4, st: 1, ok: () => S.weather === 'rain' && !M.interior, run: async () => {
    await spComeClose(); spNear(4);
    await spAct('☔ 형사님이 우산을 펴 이쪽으로 씌운다.');
    await spDet('normal', spB('우산 없지? 같이 쓰자.', '우산 없죠? 같이 써요.'));
    await spAct('우산이 자꾸 이쪽으로 기운다. 형사님 반대쪽 어깨가 젖어 간다.');
    const i = await spChoose(['어깨 젖어요', '(더 가까이 붙는다)']);
    if (i === 0) await spDet('normal', spB('괜찮아. 더 붙어.', '괜찮아요. 더 붙어요.'));
    else { burst(G.det, 'heart', 4); await spAct('형사님이 우산을 고쳐 쥐고, 남은 손으로 어깨를 감싼다.'); await spDet('normal', spB('그래. 이렇게 가자.', '그래요. 이렇게 가요.')); }
    addAff(5, { event: true }); spReset();
  } },
  /* 9. 비 오는 밤 · 늦은 밤 — 사택 */
  { id: 'sp_sataek', cd: 7, st: 4, ok: () => S.min >= 20 * 60 && S.min < 23 * 60 && !M.interior, run: async () => {
    await spComeClose();
    await spDet('normal', rainy() ? '비 많이 오네. 우리 집 가까워. 그칠 때까지 있다 가.' : '벌써 시간이 이렇게 됐네. 우리 집에서 차 한잔하고 갈래?');
    const i = await spChoose(['응, 갈게', '오늘은 데려다줘'], 'sataek');
    if (i === 1) { await spDet('normal', '응. 집 앞까지 갈게.'); return; }
    S.hold = true; await walkBothTo(P_('sataekDoor'), [P_('sataekDoor')[0] + 1, P_('sataekDoor')[1]]);
    if (S.comp) endCompanion(true); await spGoInside('in_sataek');
    spNear(3); await spDet('normal', '편하게 있어. 물 마실래?');
    G.player.prop = 'tea'; await spAct('형사님이 잔을 건네고, 맞은편이 아니라 바로 옆에 앉는다.');
    await spDet('normal', rainy() ? '급하게 갈 필요 없어.' : '더 있다 가.');
    await spAct('형사님이 손을 잡는다.');
    await spDet('normal', '오늘 자고 갈래?');
    await spDet('normal', '부담 갖지는 말고. 네가 괜찮으면.');
    const k = await spChoose(['응, 있을게', '오늘은 갈게'], 'stay');
    G.player.prop = null;
    if (k === 1) { await spDet('normal', '응. 데려다줄게.'); addAff(4, { event: true }); return; }
    await spHug(); await spDet('normal', '…이리 와.'); await kissAnim('♥');
    await spSpendNight('sataek');
  } },
  /* 10. 첫 입맞춤 */
  { id: 'sp_firstKiss', once: true, st: 2, ok: () => !S.rel.flags.kiss && S.min >= 17 * 60 && !M.interior && (S.rel.stage >= 4 || S.rel.aff >= 110), run: async () => {
    await spComeClose(); spNear(5);
    await spAct('대화가 끊긴다. 형사님이 얼굴을 바라본다.');
    await spDet('normal', spB('키스해도 돼?', '키스해도 돼요?'));
    await spAct('형사님은 그 자리에서 대답을 기다린다.');
    const i = await spChoose(['(고개를 끄덕인다)', '(내가 먼저 다가간다)', '아직은요'], 'firstKiss');
    if (i === 2) { spReset(); await spDet('normal', spB('응. 알았어.', '네. 알겠어요.')); await spAct('형사님이 한 걸음 물러서며 평소처럼 웃는다.'); return; }
    if (i === 0) await spDet('normal', spB('그럼 이리 와.', '그럼 이리 와요.'));
    else await spAct('먼저 다가가자, 형사님이 자연스럽게 허리를 감싸 받아 준다.');
    await kissAnim('♥'); S.rel.flags.kiss = true; S.rel.flags.cheek = true;
    await spAct('형사님이 조금 떨어져 얼굴을 바라본다.');
    await spDet('normal', spB('한 번 더 해도 돼?', '한 번 더 해도 돼요?'));
    const k = await spChoose(['(눈을 감는다)', '오늘은 여기까지']);
    if (k === 0) await kissAnim('♥♥'); else await spDet('normal', spB('응. 좋았어.', '네. 좋았어요.'));
    addAff(10, { event: true }); await addAlbum('첫 입맞춤', 'kiss'); spReset();
  } },
  /* 11. 뜻밖의 하룻밤 — 처음 만난 날부터 가능, 두 번 묻기 */
  { id: 'sp_firstNight', once: true, st: 1, ok: () => !spState().firstNightEventCompleted && S.min >= 20 * 60 && S.min < 25 * 60 && !M.interior && !S.rel.flags.married && spState().firstAttractionTriggered && spState().nightDeclinedDay !== S.day, run: async () => {
    const s = spState(), d = G.det;
    await spComeClose();
    await spAct('늦은 밤, 형사님과 다시 마주쳤다. 형사님이 걸음을 멈춘다.');
    await spDet('normal', spB('또 만났네.', '또 만났네요.'));
    await spDet('normal', spB('아까 헤어지고 계속 생각났어.', '아까 헤어지고 계속 생각났어요.'));
    await spAct('잠깐의 침묵. 형사님이 시선을 피하지 않는다.');
    await spDet('normal', spB('오늘은 그냥 보내기 싫다.', '오늘은 그냥 보내기 싫네요.'));
    const i = await spChoose(['나도 조금 더 같이 있고 싶어요', '그럼 어디 조용한 데 갈까요?', '오늘은 여기까지만 해요'], 'night1');
    if (i === 2) { s.nightDeclinedDay = S.day; await spDet('normal', spB('응. 알았어. 데려다줄게.', '네. 알겠어요. 데려다줄게요.')); addAff(3, { event: true }); return; }
    const where = await spChoose(['형사님 집으로', '우리 집으로', '조금만 더 걸어요'], 'night1where');
    if (where === 2) {
      await walkBothTo(P_('promenade'), [P_('promenade')[0] + 1, P_('promenade')[1]]);
      spNear(3); await spAct('🌙 늦은 밤 해안 산책로. 형사님이 손을 내민다.');
      await spDet('normal', spB('손잡을래?', '손잡을래요?')); S.hold = true; burst(d, 'heart', 4);
      await spAct('한참을 걷다가, 형사님이 잡은 손에 힘을 준다.');
    }
    spNear(5); await spAct('형사님이 손을 잡는다.');
    await spDet('normal', spB('오늘 자고 갈래?', '오늘 같이 있을래요?'));
    await spDet('normal', spB('부담 갖지는 말고. 네가 괜찮으면.', '부담 갖지는 말고요. 괜찮으면.'));
    const c = await spChoose(['네, 같이 있을래요', '역시 오늘은 아닌 것 같아요'], 'night1consent');
    if (c === 1) { spReset(); s.nightDeclinedDay = S.day; await spDet('normal', spB('응. 말해 줘서 고마워. 내일 보자.', '네. 말해 줘서 고마워요. 내일 봐요.')); addAff(4, { event: true }); return; }
    await spAct('형사님이 다시 한번 얼굴을 살핀다.');
    await spDet('normal', spB('정말 괜찮아?', '정말 괜찮아요?'));
    const c2 = await spChoose(['네', '…생각해 보니 오늘은 아니에요'], 'night1confirm');
    if (c2 === 1) { spReset(); s.nightDeclinedDay = S.day; await spDet('normal', spB('응. 괜찮아. 데려다줄게.', '괜찮아요. 데려다줄게요.')); return; }
    await kissAnim('♥'); S.rel.flags.kiss = true; S.rel.flags.cheek = true; S.rel.flags.hand = true;
    S.hold = true;
    const place = where === 1 ? 'home' : 'sataek', door = place === 'home' ? P_('homeDoor') : P_('sataekDoor');
    await walkBothTo(door, [door[0] + 1, door[1]]); if (S.comp) endCompanion(true);
    await spGoInside(place === 'home' ? 'in_home' : 'in_sataek');
    spNear(5); await spAct('문이 닫히고, 바깥 파도 소리가 멀어졌다.');
    await spDet('normal', place === 'home' ? spB('편하게 있어. 여긴 네 집이지만.', '편하게 있어요. 여긴 {me} 집이지만요.') : spB('편하게 있어.', '편하게 있어요.'));
    await spAct('형사님이 팔을 벌린다. 다가가자, 천천히 끌어안는다.');
    await spHug(); await kissAnim('♥♥');
    s.firstNightEventCompleted = true; s.firstNightDay = S.day; s.firstNightPlace = place;
    memPerm('spFirstNight', { day: S.day, place });
    await spSpendNight(place);
  } },
  /* 13. 서로를 의식하며 어색하게 웃기 */
  { id: 'sp_awkward', once: true, st: 1, ok: () => spState().morningAfterEventCompleted && S.day > (spState().firstNightDay || 0) && S.day - spState().firstNightDay <= 4, run: async () => {
    await spComeClose();
    await spAct('눈이 마주치자 둘 다 동시에 시선을 피했다. 그리고 동시에 웃음이 났다.');
    await spDet('normal', spB('안녕.', '안녕하세요.'));
    await spAct('형사님이 목덜미를 한 번 쓸고, 다시 이쪽을 본다.');
    await spDet('normal', spB('잘 들어갔어? 연락하려다 말았어.', '잘 들어갔어요? 연락하려다 말았어요.'));
    const i = await spChoose(['연락하지 그랬어요', '나도 그랬어요']);
    await spDet('normal', i === 0 ? spB('그럼 오늘은 할게.', '그럼 오늘은 할게요.') : spB('그랬구나. 그럼 오늘 저녁에 보자.', '그랬구나. 그럼 오늘 저녁에 봐요.')); addAff(5, { event: true });
  } },
  /* 14. 형사님이 먼저 진지하게 */
  { id: 'sp_serious', once: true, st: 3, ok: () => (spState().firstNightEventCompleted || S.rel.aff >= 160) && S.min >= 16 * 60 && !S.rel.flags.lovers, run: async () => {
    await spComeClose(); await spDet('normal', spB('잠깐 얘기 좀 할 수 있어?', '잠깐 얘기 좀 할 수 있어요?'));
    await spAct('형사님이 벤치에 앉아 옆자리를 가리킨다. 평소보다 표정이 진지하다.');
    await spDet('normal', spB('처음엔 그냥 끌리는 거라고 생각했어.', '처음엔 그냥 끌리는 거라고 생각했어요.'));
    await spDet('normal', spB('지금은 아니야. 가볍게 하고 싶지 않아.', '지금은 아니에요. 가볍게 하고 싶지 않아요.'));
    const i = await spChoose(['나도 진지해요', '조금 더 생각할게요']);
    if (i === 0) { await spAct('형사님이 짧게 숨을 고르고 고개를 끄덕인다.'); await spDet('normal', spB('그럼 조만간 제대로 말할게.', '그럼 조만간 제대로 말할게요.')); S.rel.confessDay = Math.min(S.rel.confessDay || 0, S.day - 3); addAff(8, { event: true }); }
    else await spDet('normal', spB('응. 기다릴게.', '네. 기다릴게요.'));
  } },
  /* 15. 끌림이 아니라 사랑이었다 */
  { id: 'sp_realize', once: true, st: 4, ok: () => !!(spState().unlockedSpicyEvents.sp_serious) && S.min >= 18 * 60 && !M.interior, run: async () => {
    await spComeClose(); spNear(3);
    await spAct('해가 지는 쪽을 보던 형사님이 고개를 돌린다.');
    await spDet('normal', '처음엔 그냥 끌린 거였어.');
    await spDet('normal', '근데 요즘은 네가 안 보이면 하루가 이상해.');
    await spAct('형사님이 잠깐 말을 멈춘다.');
    await spDet('normal', '사랑해.');
    const i = await spChoose(['나도 사랑해', '(말없이 안긴다)']);
    if (i === 1) await spHug(); else burst(G.det, 'heart', 6);
    await spAct('형사님이 등을 감싸 안고, 한동안 놓지 않는다.');
    addAff(12, { event: true }); await addAlbum('사랑한다고 말한 날', 'love'); spReset();
  } },
  /* 질투 — 담담하게 */
  { id: 'sp_jealous', cd: 5, st: 2, ok: () => G.villagers && G.villagers.some(v => v.vid && /tourist/.test(v.vid) && v.visible && v.map === G.player.map && dist(v, G.det) < 3), run: async () => {
    const v = G.villagers.find(v => v.vid && /tourist/.test(v.vid) && v.visible && v.map === G.player.map); if (v) { v.stop && v.stop(); v.lookAt(G.det); v.say(spPick(['형사님~ 사진 한 장만요!', '형사님 저녁에 시간 있으세요?', '형사님 진짜 멋있으세요!']), 2.5); }
    await sleep(900); await spComeClose();
    await spBeat(spPick(SP.jealous));
    const i = await spChoose(['아니요', '…조금요']);
    await spDet('normal', i === 1 ? spB('말해 줘서 좋네. 가자.', '말해 줘서 좋네요. 가요.') : spB('그래. 가자.', '그래요. 가요.')); addAff(3);
  } },
];
/* 12. 다음 날 아침 */
async function spMorningAfter(place) {
  const s = spState(), P = G.player, d = G.det;
  const id = place === 'home' ? 'in_home' : 'in_sataek', m = MAPS[id];
  if (m && P.map !== id) await goMap(id, 3.5, 3.5, { noFade: true });
  d.map = P.map; d.visible = true; d.state = 'script'; d.scripted = true; d.outfit = 'casual'; [d.x, d.y] = nearestWalkable(P.x + 1, P.y, MAPS[P.map]); d.lookAt(P); P.lookAt(d);
  await spAct('🌅 커튼 사이로 아침 햇살이 들어왔다.');
  const v = pick(['A', 'B', 'C', 'D']);
  for (const [e, t] of SP.morning[v]) { if (e === 'n') await spAct(t); else await spDet(e, t); }
  const i = await spChoose(['잘 잤어요', '…좀 부끄럽네요', '배고파요']);
  if (i === 0) await spDet('normal', '나도.');
  else if (i === 1) { await spAct('형사님이 다가와 헝클어진 머리를 가만히 정리해 준다.'); await spDet('normal', '괜찮아.'); }
  else { d.prop = 'plate'; await spAct('형사님이 토스트와 계란을 담은 접시를 내민다.'); await spDet('normal', '먹어. 커피도 내릴게.'); d.prop = null; }
  for (const [e, t] of SP.morningAsk) { if (e === 'n') await spAct(t); else await spDet(e, t); }
  const k = await spChoose(['응, 저녁에 봐요', '생각해 볼게요'], 'morningDate');
  if (k === 0) { await spDet('normal', '여섯 시에 부두 끝에서.'); addAff(6, { event: true }); }
  else await spDet('normal', '응. 연락할게.');
  await spAct('형사님이 문 앞에서 한 번 돌아본다.');
  await spDet('normal', '갔다 올게.');
  s.morningAfterEventCompleted = true;
  await addAlbum('뜻밖의 하룻밤, 그다음 아침', 'love');
  closeDialog(); d.scripted = false; d.state = 'sched'; d.visible = false; d.map = 'island';
}
/* ---------------- 이벤트 고르기 · 먼저 다가오기 · 말풍선 ---------------- */
function spCheck() {
  const r = S.rel, d = G.det, P = G.player, s = spState();
  if (!r.flags.met || G.busy || G.dialog || G.sheet || G.screen || G.mgOn || G.dev || paused()) return false;
  const near = d.visible && d.map === P.map && dist(d, P) < 7 && d.state !== 'script';
  G._spT = (G._spT || 0) + 1;
  if (near && dist(d, P) < 4 && G._spT % 900 === 0) d.say(spPick(SP.bubble[spBand()]), 2.6);
  if (G._spT % 90 !== 0) return false;
  const detFree = !d.scripted && d.state !== 'script' && !S.rel.daily.fight && (d.task !== 'wedding');
  const now = S.day * 1440 + S.min; if (now - (s.last._any || -1e9) < (s.firstAttractionTriggered ? 60 : 0)) return false;
  const list = !s.firstAttractionTriggered ? SP_EVENTS.filter(e => e.id === 'sp_number') : SP_EVENTS.slice().sort(() => Math.random() - 0.5);
  for (const ev of list) {
    if (r.stage < (ev.st || 1)) continue;
    if (ev.far ? !detFree : !near) continue;
    if (ev.once && s.unlockedSpicyEvents[ev.id]) continue;
    if (ev.cd && s.last[ev.id] != null && S.day - s.last[ev.id] < ev.cd) continue;
    let ok = false; try { ok = ev.ok(); } catch (e) { ok = false; }
    if (!ok) continue;
    if (ev.id !== 'sp_number' && Math.random() > (ev.once ? 0.55 : 0.28)) continue;
    s.last._any = now; spDone(ev.id);
    runEvent(async () => { try { await ev.run(); } finally { spReset(); } });
    return true;
  }
  if (near && !S.comp && Math.random() < 0.3 && now - (s.last._appr || -1e9) > 120) { s.last._appr = now; s.last._any = now; spLog('approach', 'approach'); runEvent(detApproach); return true; }
  return false;
}
const _checkEventsSp = checkEvents;
checkEvents = function () { _checkEventsSp(); if (spOn() && !G.busy) try { spCheck(); } catch (e) { console.error('[spicy]', e); } };
/* 함께 앉기 (벤치 · 정자): 아찔한 모드에선 담백한 대사로 — 진행 플래그 · 앨범 · 고백 흐름은 그대로 */
SP.sit = {
  first: [['n', '나란히 앉았다. 어깨 사이가 한 뼘쯤.'], ['normal', '이렇게 앉으니까 좋네요.'], ['n', '형사님이 잠시 이쪽을 보다가, 다시 앞을 본다.']],
  1: [[['n', '형사님이 옆에 앉아 한동안 말없이 앞을 본다.'], ['normal', '좀 더 있다 가요.']], [['n', '바람이 분다. 형사님이 겉옷 자락을 이쪽으로 당겨 덮어 준다.'], ['normal', '추우면 말해요.']]],
  4: [[['n', '형사님이 가까이 앉는다. 어깨가 닿는다.'], ['normal', '좀 더 가까이 앉아도 돼?']], [['n', '형사님이 손을 벤치 위에 올려 둔다. 손등이 닿는다.'], ['normal', '…손 줘.']]],
  5: [[['n', '형사님이 팔을 둘러 어깨를 감싼다.'], ['normal', '기대.']], [['n', '형사님이 손가락을 깍지 끼운다.'], ['normal', '오늘은 여기서 노을 보고 가자.']]],
};
const _sitTogetherSp = sitTogether;
sitTogether = async function (benchKey) {
  if (!spOn()) return _sitTogetherSp(benchKey);
  await runEvent(async () => {
    const P = G.player, d = G.det;
    const [k] = benchKey ? [benchKey] : nearestBench(P);
    if (!k) { toast('여기엔 앉을 벤치가 없어요'); return; }
    const bk = M.benches[k]; scriptDet();
    await walkBothTo([bk.stand[0][0] + 0.5, bk.stand[0][1] + 0.5], [bk.stand[1][0] + 0.5, bk.stand[1][1] + 0.5]);
    P.sitAt(k, 0); d.sitAt(k, 1); await sleep(500);
    if (!S.rel.flags.firstSit) {
      for (const [e, t] of SP.sit.first) { if (e === 'n') await spAct(t); else await spDet(e, t); }
      S.rel.flags.firstSit = true; addAff(5, { event: true }); await addAlbum('나란히 앉은 시간', 'sit');
    } else { await spBeat(spPick(SP.sit[S.rel.stage >= 5 ? 5 : S.rel.stage >= 4 ? 4 : 1])); if (!S.rel.daily.sit[k]) addAff(2); }
    S.rel.daily.sit[k] = true; advanceTime(20);
    if (confessReady()) { closeDialog(); await confessionEvent(); }
    closeDialog(); toast('화면을 누르면 일어나요');
  });
};

/* =====================================================================
   🥵 일상 속 아찔한 순간들 — 슬쩍 다가와 손잡기, 카페에 와서 앉아 있기, 일터 · 집 찾아오기 …
   · far: 형사님이 근처에 없어도 직접 찾아와요
   ===================================================================== */
const spWorkMap = () => JOBS[S.job] && JOBS[S.job].place ? 'in_' + JOBS[S.job].place : null;
const spOffDuty = () => { const pl = detPlan(S.min); return !pl.duty || pl.k === 'lunch'; };
function spFreeBench(mapId) {
  const m = MAPS[mapId]; if (!m) return null; const P = G.player;
  const ks = Object.keys(m.benches).filter(k => !(P.seat && P.seat.bench === k));
  ks.sort((a, b) => { const A = m.benches[a].stand[0], B = m.benches[b].stand[0]; return Math.hypot(A[0] - P.x, A[1] - P.y) - Math.hypot(B[0] - P.x, B[1] - P.y); });
  return ks[0] || null;
}
async function spDetSitNear() {
  const d = G.det, k = spFreeBench(M.id); if (!k) return false; const bk = M.benches[k], st = bk.stand[bk.stand.length - 1];
  d.walkTo(st[0] + 0.5, st[1] + 0.5); await waitUntil(() => !d.path.length, 8);
  try { d.sitAt(k, bk.seats.length - 1); } catch (e) { return false; }
  return true;
}
/* 이 장면 뒤에도 형사님이 곁에 머물게 (같이 다니기) */
function spStay(min = 90) { if (!S.comp) { try { startCompanion({}); } catch (e) { } } G.det.state = 'comp'; void min; }
SP_EVENTS.push(
  /* 슬쩍 와서 손잡기 — 같이 걷는 중 */
  { id: 'sp_sneakHand', cd: 1, st: 2, ok: () => S.comp && !S.hold && !S.arm && G.player.moving, run: async () => {
    const d = G.det; spNear(3);
    await spAct('나란히 걷다가, 형사님 손이 슬쩍 손등에 닿는다. 그러다 그대로 손을 잡는다.');
    if (S.rel.stage < 4 && !S.rel.flags.hand) {
      await spDet('normal', spB('괜찮아?', '괜찮아요?'));
      const i = await spChoose(['(그대로 잡고 있는다)', '(살짝 손을 뺀다)'], 'sneakHand');
      if (i === 1) { spReset(); await spDet('normal', spB('응. 알았어.', '네. 알겠어요.')); return; }
      S.rel.flags.hand = true; await addAlbum('슬쩍 잡은 손', 'hand');
    }
    S.hold = true; S.arm = false; burst(d, 'heart', 3); addAff(3);
    await spAct('형사님은 아무 말 없이 앞을 보며 걷는다. 손에 살짝 힘이 들어간다.');
  } },
  /* 뒤에서 다가와 손잡기 — 혼자 걷는 중 */
  { id: 'sp_sneakFromBehind', cd: 2, st: 4, far: true, ok: () => !S.comp && !M.interior && spOffDuty() && S.min >= 9 * 60 && S.min < 21.5 * 60, run: async () => {
    const d = G.det, P = G.player; await spComeClose();
    await spAct('뒤에서 발소리가 가까워지더니, 누군가 손을 잡는다. 돌아보니 형사님이다.');
    await spDet('normal', spBeatText(['찾았다.', '어디 가? 같이 가.', '혼자 걷길래.']));
    S.hold = true; spStay(); burst(d, 'heart', 3); addAff(3);
  } },
  /* 카페에 와서 앉아 있기 */
  { id: 'sp_cafeSit', cd: 2, st: 1, far: true, ok: () => G.player.map === 'in_cafe' && spOffDuty() && !S.comp, run: async () => {
    const d = G.det; await spComeClose(); await sleep(200);
    const sat = await spDetSitNear();
    if (S.job === 'cafe') {
      await spAct(sat ? '형사님이 들어와 창가 자리에 앉는다. 주문은 하지 않고, 일하는 쪽을 가만히 본다.' : '형사님이 들어와 카운터 앞에 선다. 주문은 하지 않고, 일하는 쪽을 가만히 본다.');
      await spDet('normal', spBeatText(spB(['일하는 거 보러 왔어. 신경 쓰지 마.', '마감까지 여기 있을게. 끝나면 같이 가자.', '아메리카노 하나. 천천히 줘.'], ['일하시는 거 보러 왔어요. 신경 쓰지 마세요.', '마감까지 여기 있을게요. 끝나면 같이 가요.', '아메리카노 하나요. 천천히 주세요.'])));
      const i = await spChoose(['(커피를 내려 건넨다)', '(옆에 잠깐 앉는다)', '(일하러 간다)']);
      if (i === 0) { G.det.prop = 'tea'; await spAct('형사님이 잔을 받으며 손가락이 잠깐 겹친다. 형사님은 손을 바로 떼지 않는다.'); await spDet('normal', spB('고마워.', '고마워요.')); addAff(4); }
      else if (i === 1) { await spAct('옆에 앉자, 형사님이 의자를 조금 당겨 앉는다.'); await spDet('normal', spB('잠깐만 이러고 있자.', '잠깐만 이러고 있어요.')); addAff(4); }
      else { await spAct('형사님은 말없이 고개를 끄덕이고, 다시 이쪽을 본다.'); addAff(2); }
    } else {
      await spAct(sat ? '형사님이 카페에 들어와, 말없이 맞은편 자리에 앉는다.' : '형사님이 카페에 들어와 옆에 선다.');
      await spDet('normal', spBeatText(spB(['여기 있을 것 같았어.', '나도 커피 마시러 왔어. 같이 앉아도 되지?', '오늘은 여기서 쉬다 가자.'], ['여기 계실 것 같았어요.', '저도 커피 마시러 왔어요. 같이 앉아도 되죠?', '오늘은 여기서 쉬다 가요.'])));
      const i = await spChoose(['(같이 앉아 있는다)', '(형사님 커피도 주문한다)']);
      if (i === 1) { G.det.prop = 'tea'; await spAct('형사님이 잔을 받아 들고, 한 모금 마신 뒤 이쪽을 본다.'); await spDet('normal', spB('다음엔 내가 살게.', '다음엔 제가 살게요.')); }
      else { await spAct('창밖으로 사람들이 지나간다. 형사님은 바깥보다 이쪽을 더 오래 본다.'); }
      addAff(4);
    }
    G.det.prop = null; spStay();
  } },
  /* 일터로 찾아오기 */
  { id: 'sp_workVisit', cd: 3, st: 2, far: true, ok: () => spWorkMap() && G.player.map === spWorkMap() && G.player.map !== 'in_cafe' && spOffDuty() && !S.comp, run: async () => {
    const d = G.det; await spComeClose();
    const k = pick(['coffee', 'snack', 'tangerine']); S.inv[k] = (S.inv[k] || 0) + 1;
    await spAct(`형사님이 문을 열고 들어와, ${ITEMS[k] ? ITEMS[k].name : '간식'}을 내민다.`);
    await spDet('normal', spBeatText(spB(['지나가다가. 먹고 해.', '오늘 바쁘지. 이거 먹어.', '끝나면 연락해. 데리러 올게.'], ['지나가다가요. 드시고 하세요.', '오늘 바쁘죠. 이거 드세요.', '끝나면 연락 주세요. 데리러 올게요.'])));
    const i = await spChoose(['고마워요', '(잠깐 손을 잡는다)']);
    if (i === 1) { burst(d, 'heart', 3); await spAct('형사님이 맞잡은 손을 엄지로 한 번 쓸고 놓는다.'); await spDet('normal', spB('이따 보자.', '이따 봬요.')); addAff(4); }
    else { await spDet('normal', spB('응. 이따 봐.', '네. 이따 봬요.')); addAff(3); }
    d.state = 'sched'; d.scripted = false;
  } },
  /* 저녁에 집으로 찾아오기 */
  { id: 'sp_homeKnock', cd: 4, st: 2, far: true, ok: () => G.player.map === 'in_home' && !S.rel.flags.married && S.min >= 18.5 * 60 && S.min < 22 * 60, run: async () => {
    const d = G.det; Sound.sfx('tap'); await spAct('똑똑. 현관문 두드리는 소리가 난다.'); await spComeClose();
    await spDet('normal', spBeatText(spB(['지나가다가. 밥 먹었어?', '저녁 같이 먹을까 해서. 재료 사 왔어.', '얼굴만 보고 갈게.'], ['지나가다가요. 저녁 드셨어요?', '저녁 같이 먹을까 해서요. 재료 사 왔어요.', '얼굴만 보고 갈게요.'])));
    const i = await spChoose(['들어와요', '오늘은 피곤해요'], 'homeKnock');
    if (i === 1) { await spDet('normal', spB('응. 푹 쉬어.', '네. 푹 쉬세요.')); d.state = 'sched'; d.scripted = false; return; }
    d.prop = 'pan'; await spAct('형사님이 소매를 걷고 부엌에 선다.'); await spDet('normal', spB('너 쉬어. 내가 할게.', '쉬어요. 제가 할게요.'));
    await fade(true); advanceTime(50); await sleep(250); await fade(false); d.prop = null;
    await spAct('🍲 둘이 마주 앉아 저녁을 먹었다. 설거지까지 끝내고 나서야 형사님이 겉옷을 집는다.');
    await spDet('normal', spB('다 끝났으면 이리 와.', '다 끝났으면 이리 와요.'));
    const k = await spChoose(['(다가간다)', '(문 앞까지 배웅한다)']);
    if (k === 0) { await spHug(); await spAct('형사님이 한동안 안고 있다가 천천히 놓는다.'); addAff(6, { event: true }); }
    else { await spAct('현관 앞, 형사님이 잠깐 돌아본다.'); await spDet('normal', spB('잘 자.', '잘 자요.')); addAff(4, { event: true }); }
    spReset(); d.state = 'sched'; d.scripted = false; d.visible = false; d.map = 'island';
  } },
  /* 밤에 온 메시지 */
  { id: 'sp_nightText', cd: 2, st: 2, far: true, ok: () => G.player.map === 'in_home' && !S.rel.flags.married && S.min >= 22 * 60 && S.spicy && S.spicy.phone !== false, run: async () => {
    Sound.sfx('bell'); await spAct('📱 휴대폰이 짧게 울린다. 형사님이다.');
    const L = spB([['자?', '목소리 듣고 싶어서.'], ['뭐 해?', '그냥. 생각나서.'], ['오늘 고마웠어.', '내일 아침에 데리러 갈게.']], [['주무세요?', '그냥 생각나서요.'], ['뭐 하세요?', '목소리 듣고 싶어서요.'], ['오늘 고마웠어요.', '내일 또 봬요.']]);
    const [a, b] = pick(L); await spAct(`💬 「${a}」`); await spAct(`💬 「${b}」`);
    const i = await spChoose(['(전화를 건다)', '(답장한다: 나도요)', '(이미 잠들었다)']);
    if (i === 0) { await spAct('신호음이 한 번 가기도 전에 형사님이 받는다.'); await spDet('normal', spB('…받을 줄 알았어.', '…받을 줄 알았어요.')); await spAct('별 얘기 없이 한참 통화했다. 끊기 전 형사님이 낮게 말한다.'); await spDet('normal', spB('잘 자.', '잘 자요.')); addAff(5, { event: true }); }
    else if (i === 1) { await spAct('💬 「나도요」 — 곧바로 답장이 온다.'); await spAct(spB('💬 「내일 보자. 일찍.」', '💬 「내일 봬요. 일찍요.」')); addAff(3); }
    else addAff(1);
  } },
  /* 아침 커피 배달 */
  { id: 'sp_morningCoffee', cd: 3, st: 2, far: true, ok: () => S.min >= 7 * 60 && S.min < 9 * 60 && !M.interior && !S.comp && G.player.map === 'island' && curPlace() === 'home', run: async () => {
    const d = G.det; await spComeClose(); S.inv.coffee = (S.inv.coffee || 0) + 1;
    await spAct('집 앞에서 형사님이 커피 두 잔을 들고 기다리고 있었다.');
    await spDet('normal', spB('출근길에. 하나는 네 거.', '출근길에요. 하나는 {me} 거예요.'));
    await spAct('잔을 건네며 형사님이 흘러내린 머리카락을 귀 뒤로 넘겨 준다.');
    await spDet('normal', spB('이따 점심 같이 먹자.', '이따 점심 같이 먹어요.')); addAff(4);
    d.state = 'sched'; d.scripted = false;
  } },
  /* 머리 정리 · 겉옷 걸쳐 주기 */
  { id: 'sp_jacket', cd: 3, st: 2, ok: () => !M.interior && (S.min >= 19 * 60 || ['winter', 'autumn'].includes(season()) || S.weather === 'rain'), run: async () => {
    await spComeClose(); spNear(3);
    await spAct('바람이 차다. 형사님이 아무 말 없이 겉옷을 벗어 어깨에 걸쳐 준다.');
    await spDet('normal', spB('입고 있어.', '입고 있어요.'));
    const i = await spChoose(['형사님은요?', '(옷깃을 여민다)']);
    await spDet('normal', i === 0 ? spB('난 괜찮아.', '저는 괜찮아요.') : spB('잘 맞네.', '잘 맞네요.')); addAff(4); spReset();
  } },
  { id: 'sp_hair', cd: 2, st: 2, ok: () => true, run: async () => {
    await spComeClose(); spNear(4);
    await spAct('형사님이 손을 뻗어 흐트러진 앞머리를 정리해 준다. 손이 생각보다 오래 머문다.');
    await spDet('normal', spB('됐다.', '됐어요.'));
    const i = await spChoose(['(가만히 있는다)', '(그 손을 잡는다)']);
    if (i === 1) { burst(G.det, 'heart', 4); await spAct('형사님이 잡힌 손을 내려다보다가, 그대로 손가락을 엮는다.'); S.hold = true; addAff(5); } else addAff(3);
    spReset();
  } },
  /* 시선 들킴 */
  { id: 'sp_caughtLooking', cd: 2, st: 1, ok: () => true, run: async () => {
    await spComeClose();
    await spAct('고개를 들었더니 형사님과 눈이 마주쳤다. 형사님은 시선을 피하지 않는다.');
    await spDet('normal', spBeatText(spB(['봤어. 계속 보고 있었어.', '왜. 보면 안 돼?', '…그냥 보고 싶어서.'], ['네, 보고 있었어요.', '보면 안 돼요?', '…그냥 보고 싶어서요.'])));
    const i = await spChoose(['(나도 계속 본다)', '(먼저 시선을 피한다)']);
    if (i === 0) { await spAct('몇 초가 길게 느껴진다. 먼저 웃은 건 형사님이다.'); addAff(4); } else { await spAct('형사님이 조용히 웃는다.'); addAff(2); }
  } },
  /* 귓속말 */
  { id: 'sp_whisper', cd: 3, st: 4, ok: () => !!(G.villagers || []).find(v => v.visible && v.map === G.player.map && dist(v, G.player) < 6), run: async () => {
    await spComeClose(); spNear(5);
    await spAct('주변에 사람이 있는데도, 형사님이 몸을 기울여 귓가에 낮게 말한다.');
    await spDet('normal', spBeatText(['오늘 저녁 비워 둬.', '이따 우리 집 와.', '나 지금 너 안고 싶어.']));
    const i = await spChoose(['(고개를 끄덕인다)', '여기서 그런 말 하면…']);
    await spDet('normal', i === 0 ? '좋아.' : '알아. 그래서 귓속말했어.'); addAff(i === 0 ? 5 : 3); spReset();
  } },
  /* 벤치에서 기다리기 */
  { id: 'sp_benchWait', cd: 3, st: 2, far: true, ok: () => !M.interior && !S.comp && spOffDuty() && S.min >= 16 * 60 && S.min < 20 * 60 && Object.keys(M.benches).length > 0, run: async () => {
    const d = G.det, P = G.player, k = spFreeBench(M.id); if (!k) return; const bk = M.benches[k];
    d.map = P.map; d.visible = true; [d.x, d.y] = nearestWalkable(bk.stand[0][0] + 0.5, bk.stand[0][1] + 0.5, M); scriptDet();
    try { d.sitAt(k, 1 < bk.seats.length ? 1 : 0); } catch (e) { }
    await spAct('벤치에 형사님이 앉아 있다. 이쪽을 보더니 옆자리를 손바닥으로 툭 친다.');
    await spDet('normal', spB('여기 앉아.', '여기 앉아요.'));
    const i = await spChoose(['(옆에 앉는다)', '(지나간다)']);
    if (i === 1) { await spDet('normal', spB('응. 이따 봐.', '네. 이따 봐요.')); d.standUp && d.standUp(); return; }
    await walkBothTo([bk.stand[0][0] + 0.5, bk.stand[0][1] + 0.5], [d.x, d.y]); try { P.sitAt(k, 0); } catch (e) { }
    spNear(3); await spAct('앉자마자 형사님이 어깨를 붙여 온다. 한동안 말없이 노을을 본다.');
    await spDet('normal', spB('오늘 하루 어땠어?', '오늘 하루 어땠어요?')); addAff(5);
    spReset(); spStay();
  } },
  /* 부두에서 같이 낚싯대 잡기 */
  { id: 'sp_fishTogether', cd: 4, st: 4, ok: () => G.det.task === 'fishing' || curPlace() === 'fishing' || curPlace() === 'pier', run: async () => {
    const d = G.det; await spComeClose(); spNear(6);
    await spAct('형사님이 낚싯대를 건네더니, 뒤에 서서 손 위에 자기 손을 겹친다.');
    await spDet('normal', '이렇게 잡아. 힘 빼고.');
    await spAct('등 뒤로 체온이 느껴진다. 찌가 흔들려도, 둘 다 한동안 움직이지 않는다.');
    const i = await spChoose(['(찌를 본다)', '(뒤돌아본다)']);
    if (i === 1) { await spAct('돌아보자 얼굴이 아주 가깝다. 형사님이 잠깐 멈춘다.'); await spDet('normal', '…키스해도 돼?'); const k = await spChoose(['(눈을 감는다)', '물고기 도망가요']); if (k === 0) { await kissAnim('♥'); addAff(6, { event: true }); } else { await spDet('normal', '그럼 하나 잡고.'); addAff(3); } }
    else { await spAct('결국 아무것도 못 잡았다. 형사님은 별로 아쉬워 보이지 않는다.'); addAff(4); }
    spReset();
  } },
  /* 노을 · 어깨 맞대기 */
  { id: 'sp_sunset', cd: 3, st: 2, ok: () => S.min >= 17.5 * 60 && S.min < 19.5 * 60 && !M.interior && ['beach', 'coast', 'promenade', 'lighthouse', 'pier', 'hill'].includes(curPlace()), run: async () => {
    await spComeClose(); spNear(4);
    await spAct('🌅 노을이 진다. 형사님이 옆에 서서, 어깨가 닿을 만큼 다가온다.');
    await spDet('normal', spB('좀 더 있다 가자.', '좀 더 있다 가요.'));
    const i = await spChoose(['(어깨에 머리를 기댄다)', '(손을 잡는다)', '(말없이 노을을 본다)']);
    if (i === 0) { G.player.lean = true; await spAct('형사님이 기댄 머리 위로 뺨을 살짝 얹는다.'); addAff(6, { event: true }); }
    else if (i === 1) { S.hold = true; await spAct('형사님이 잡은 손을 자기 코트 주머니에 같이 넣는다.'); addAff(5); }
    else { await spAct('해가 다 질 때까지, 둘 다 말이 없었다.'); addAff(3); }
    spReset();
  } },
  /* 비 피하기 — 처마 밑 */
  { id: 'sp_rainEave', cd: 4, st: 2, ok: () => S.weather === 'rain' && !M.interior, run: async () => {
    await spComeClose(); spNear(5);
    await spAct('☔ 갑자기 빗발이 굵어졌다. 형사님이 팔을 잡아끌어 가게 처마 밑으로 들어간다.');
    await spAct('좁은 처마. 비를 피하려니 가슴께가 거의 닿는다.');
    await spDet('normal', spB('그칠 때까지 여기 있자.', '그칠 때까지 여기 있어요.'));
    const i = await spChoose(['(가만히 있는다)', '(형사님 셔츠를 살짝 잡는다)']);
    if (i === 1) { await spAct('형사님이 내려다본다. 그리고 한 팔로 등을 감싸, 비 들이치는 쪽을 막는다.'); addAff(6, { event: true }); }
    else { await spAct('빗소리만 들린다. 형사님의 숨소리가 가깝다.'); addAff(4); }
    spReset();
  } },
  /* 별 보며 눕기 */
  { id: 'sp_stars', cd: 5, st: 4, ok: () => (S.min >= 20.5 * 60 || S.min < 2 * 60) && !M.interior && !rainy() && ['hill', 'observatory', 'beach', 'field'].includes(curPlace()), run: async () => {
    const P = G.player, d = G.det; await spComeClose();
    await spDet('normal', '누워 보자. 별 진짜 많아.');
    P.lie = -1; d.lie = -1; P.oy = d.oy = 3; spNear(3);
    await spAct('⭐ 풀밭에 나란히 누웠다. 형사님이 팔을 뻗어 베개 삼으라고 내준다.');
    const i = await spChoose(['(팔을 벤다)', '(옆에 그냥 눕는다)']);
    if (i === 0) { await spAct('팔을 베자 형사님이 몸을 살짝 돌려 이쪽을 본다. 별보다 가까운 얼굴.'); await spDet('normal', '…별 안 봐?'); await spDet('normal', '나도 안 보고 있었어.'); addAff(7, { event: true }); }
    else { await spAct('별똥별이 하나 떨어진다. 형사님 손이 풀밭 위에서 손을 찾아 잡는다.'); addAff(5); }
    P.lie = d.lie = 0; P.oy = d.oy = 0; spReset();
  } },
  /* 장 보기 — 바구니 들어 주기 */
  { id: 'sp_shopping', cd: 4, st: 2, far: true, ok: () => G.player.map === 'in_super' && spOffDuty(), run: async () => {
    const d = G.det; await spComeClose();
    await spAct('장바구니를 들고 있는데, 형사님이 다가와 말없이 손잡이를 가져간다.');
    await spDet('normal', spB('뭐 사? 내가 들게.', '뭐 사요? 제가 들게요.'));
    await spAct('진열대 사이를 같이 돈다. 형사님이 자꾸 이쪽이 좋아하는 과자를 바구니에 넣는다.');
    S.inv.snack = (S.inv.snack || 0) + 1; await spDet('normal', spB('이거 좋아하잖아.', '이거 좋아하잖아요.')); addAff(4); spStay();
  } },
  /* 집 앞 굿나잇 */
  { id: 'sp_goodnight', cd: 2, st: 4, ok: () => S.min >= 21 * 60 && !M.interior && G.player.map === 'island' && curPlace() === 'home' && S.comp, run: async () => {
    await spComeClose(); spNear(5);
    await spAct('집 앞. 헤어질 시간인데 형사님은 잡은 손을 놓지 않는다.');
    await spDet('normal', '벌써 시간이 이렇게 됐네.');
    await spDet('normal', S.rel.stage >= 5 ? '들어가기 전에… 키스해도 돼?' : '오늘 좋았어.');
    if (S.rel.stage >= 5) { const i = await spChoose(['(눈을 감는다)', '(볼에 먼저 입을 맞춘다)', '잘 자요']); if (i === 0) await kissAnim('♥'); else if (i === 1) { await kissAnim('쪽'); await spDet('normal', '…반대쪽도.'); } else await spDet('normal', '응. 잘 자.'); addAff(i === 2 ? 2 : 5); }
    else { await spAct('형사님이 손을 한 번 꽉 잡았다가 놓는다.'); addAff(3); }
    spReset();
  } },
  /* 뒤에서 안기 (연인) */
  { id: 'sp_backhugSurprise', cd: 3, st: 5, ok: () => !G.player.moving, run: async () => {
    const d = G.det, P = G.player; await spComeClose(); spNear(6);
    await spAct('뒤에서 두 팔이 허리를 감싼다. 어깨에 턱이 얹힌다.');
    await spDet('normal', pick(['잠깐만. 이러고 있을게.', '오늘 많이 보고 싶었어.', '움직이지 마. 조금만.']));
    const i = await spChoose(['(손을 겹친다)', '(돌아서 안는다)']);
    if (i === 1) { await spHug(); await spAct('형사님이 안은 팔에 조금 더 힘을 준다.'); }
    else await spAct('겹친 손 위로 형사님이 엄지를 천천히 움직인다.');
    addAff(5); spReset();
  } },
  /* 무릎 베개 (연인) */
  { id: 'sp_lap', cd: 4, st: 5, ok: () => !!G.player.seat && !!G.det.seat && G.det.seat.bench === G.player.seat.bench, run: async () => {
    const P = G.player;
    await spDet('normal', '피곤하면 누워.');
    await spAct('형사님이 무릎을 툭툭 친다.');
    const i = await spChoose(['(무릎을 벤다)', '(형사님이 누워요)']);
    if (i === 0) { P.lie = G.det.left ? 1 : -1; P.oy = 3; await spAct('형사님 손가락이 머리카락 사이를 천천히 쓸어내린다.'); await spDet('normal', '자도 돼. 깨워 줄게.'); }
    else { G.det.lie = -1; G.det.oy = 3; await spAct('형사님이 무릎을 베고 눕더니, 눈을 감은 채 손을 찾아 잡는다.'); await spDet('normal', '…좋다.'); }
    await fade(true); advanceTime(30); await sleep(250); await fade(false);
    P.lie = 0; P.oy = 0; G.det.lie = 0; G.det.oy = 0; addAff(6, { event: true });
  } },
  /* 같이 요리하다 백허그 (깊은 연인 · 부부) */
  { id: 'sp_cooking', cd: 4, st: 6, far: true, ok: () => G.player.map === 'in_home' && S.min >= 17.5 * 60 && S.min < 21 * 60, run: async () => {
    const d = G.det, P = G.player; await spComeClose(); P.prop = 'pan';
    await spAct('저녁을 만드는데, 형사님이 뒤로 와서 허리를 감싸 안는다.');
    await spDet('normal', '뭐 만들어?');
    const i = await spChoose(['칼 들고 있어요', '(그대로 둔다)']);
    if (i === 0) { await spDet('normal', '알아. 조심할게.'); await spAct('형사님은 팔을 풀지 않고, 그대로 어깨너머로 냄비를 들여다본다.'); }
    else { await spAct('형사님이 목덜미에 짧게 입을 맞추고, 그대로 기대어 선다.'); }
    P.prop = null; addAff(5); spReset();
  } },
  /* 네컷 사진 — 마지막 컷 */
  { id: 'sp_booth', cd: 6, st: 4, ok: () => curPlace() === 'booth' && !M.interior, run: async () => {
    await spComeClose(); spNear(6);
    await spAct('📸 좁은 사진 부스. 하나, 둘, 셋 — 세 컷은 웃으며 찍었다.');
    await spAct('마지막 컷 직전, 형사님이 이쪽을 돌아본다.');
    await spDet('normal', '마지막은 이렇게 찍자.');
    const i = await spChoose(['(볼에 입 맞추게 둔다)', '(내가 먼저 돌아본다)', '(브이를 한다)']);
    if (i === 0) { await kissAnim('찰칵♥'); await spAct('사진 속 마지막 컷: 눈 감은 얼굴, 볼에 닿은 입술.'); }
    else if (i === 1) { await kissAnim('찰칵♥♥'); await spAct('사진 속 마지막 컷: 둘 다 눈을 감고 있다.'); }
    else await spAct('사진 속 마지막 컷: 브이를 한 이쪽, 그걸 보고 있는 형사님.');
    S.lastPhotoDay = S.day; addAff(5, { event: true }); if (!S.rel.flags.spBooth) { S.rel.flags.spBooth = true; await addAlbum('네컷의 마지막 컷', 'photo'); } spReset();
  } },
  /* 광장에서 천천히 춤 (밤 · 연인) */
  { id: 'sp_dance', cd: 6, st: 5, ok: () => (S.min >= 20 * 60 && S.min < 23.5 * 60) && !M.interior && ['plaza', 'beach', 'pier', 'lighthouse'].includes(curPlace()), run: async () => {
    const d = G.det; await spComeClose(); spNear(6);
    await spAct('어디선가 라디오 노래가 흘러나온다. 형사님이 손을 내민다.');
    await spDet('normal', '춤출래? 아무도 안 봐.');
    const i = await spChoose(['(손을 잡는다)', '나 춤 못 춰요']);
    if (i === 1) await spDet('normal', '나도 못 춰. 그냥 흔들기만 하면 돼.');
    await spAct('한 손은 허리에, 한 손은 맞잡고. 박자도 없이 천천히 흔들렸다.');
    burst(d, 'heart', 6); Sound.sfx('heart');
    await spDet('normal', '…노래 끝나도 조금만 더.'); addAff(7, { event: true }); spReset();
  } },
);
/* 같은 말을 고르는 도우미 (문자열 배열 → 하나) */
function spBeatText(arr) { return spPick(arr); }
