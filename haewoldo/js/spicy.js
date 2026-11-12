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
  if (d.map !== P.map || !d.visible) { d.map = P.map; d.visible = true; [d.x, d.y] = nearestWalkable(P.x + 3, P.y + 1, M); }
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
  if (!near || G._spT % 90 !== 0) return false;
  const now = S.day * 1440 + S.min; if (now - (s.last._any || -1e9) < (s.firstAttractionTriggered ? 75 : 0)) return false;
  for (const ev of SP_EVENTS) {
    if (r.stage < (ev.st || 1)) continue;
    if (ev.once && s.unlockedSpicyEvents[ev.id]) continue;
    if (ev.cd && s.last[ev.id] != null && S.day - s.last[ev.id] < ev.cd) continue;
    let ok = false; try { ok = ev.ok(); } catch (e) { ok = false; }
    if (!ok) continue;
    if (ev.id !== 'sp_number' && Math.random() > (ev.once ? 0.55 : 0.28)) continue;
    s.last._any = now; spDone(ev.id);
    runEvent(async () => { try { await ev.run(); } finally { spReset(); } });
    return true;
  }
  if (!S.comp && Math.random() < 0.3 && now - (s.last._appr || -1e9) > 120) { s.last._appr = now; s.last._any = now; spLog('approach', 'approach'); runEvent(detApproach); return true; }
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
