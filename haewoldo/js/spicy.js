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
  const b = spBand(), h = S.min / 60, tk = h < 11 ? 'morning' : h < 16 ? 'noon' : h < 19.5 ? 'evening' : 'night', pl = curPlace();
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
  if (left <= 0) { if (!opts.quiet && Math.random() < 0.3) floatText(G.det, '♥ 오늘은 충분… 아니, 더 보고 싶어', '#ffd3de'); return; }
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

/* ---------------- 대사 바꿔 끼우기 ---------------- */
/* 인사 · 스킨십 · 먼저 다가오기에서 형사님 말 한 줄을 아찔한 모드 대사로 */
G.spCtx = null;
const _doInteractionSp = doInteraction;
doInteraction = function (id) {
  if (spOn()) {
    const r = S.rel, first = { hand: !r.flags.hand, kiss: !r.flags.kiss, cheek: !r.flags.cheek }[id];
    G.spCtx = (SP.inter[id] && !first) ? { k: 'inter', id, at: Date.now() } : id === 'greet' ? { k: 'greet', at: Date.now() } : null;
  }
  return _doInteractionSp(id);
};
const _detApproachSp = detApproach;
detApproach = async function () { if (spOn()) G.spCtx = { k: 'approach', at: Date.now() }; try { return await _detApproachSp(); } finally { G.spCtx = null; } };
const _saySp = say;
say = function (who, expr, text) {
  const c = G.spCtx;
  if (c && Date.now() - c.at > 6000) G.spCtx = null;
  if (c && G.spCtx && who === 'det' && spOn() && typeof text === 'string' && text.replace(/[.…\s]/g, '').length > 3) {
    G.spCtx = null;
    const b = spBand(), pool = c.k === 'inter' ? SP.inter[c.id] : c.k === 'greet' ? SP.greet[b] : SP.approach[b];
    const t = spPick(pool); if (t) { spLog('line', c.k); return _saySp(who, b >= 4 ? 'blush' : expr, t); }
  }
  return _saySp(who, expr, text);
};
/* 하루 대화: 이야기 순서는 그대로 두고, 아찔한 대사 · 짧은 이야기를 많이 섞음 */
const _dailyTalkSp = dailyTalk;
dailyTalk = async function () {
  if (!spOn() || S.rel.daily.fight) return _dailyTalkSp();
  const r = S.rel, b = spBand();
  if (r.daily.talk === 0 && Math.random() < 0.45) { await _dailyTalkSp(); await say('det', b >= 4 ? 'blush' : 'tease', spPick(spTalkPool())); return; }
  const scenes = SP.scene[b] || [];
  if (scenes.length && Math.random() < 0.4) { const sc = spPick(scenes); spLog('line', 'scene'); await topic(JSON.parse(JSON.stringify(sc))); }
  else { await say('det', b >= 4 ? (Math.random() < 0.5 ? 'blush' : 'tease') : pick(['smile', 'tease', 'blush']), spPick(spTalkPool())); addAff(1); }
  r.daily.talk++; memRecent('talk', '형사님과 이야기했다');
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

/* ---------------- 연출 도우미 ---------------- */
function spNear(px = 4) { const P = G.player, d = G.det, sx = (a, b) => (iso(b.x, b.y)[0] - iso(a.x, a.y)[0]) > 0 ? 1 : -1; P.ox = sx(P, d) * px; d.ox = sx(d, P) * px; P.lookAt(d); d.lookAt(P); }
function spReset() { const P = G.player, d = G.det; P.ox = P.oy = d.ox = d.oy = 0; P.lean = d.lean = false; }
async function spHug(text) { spNear(5); burst(G.det, 'heart', 6); burst(G.player, 'heart', 4); Sound.sfx('heart'); if (text) floatText(G.player, text, '#ff9ab5'); await sleep(500); }
async function spComeClose() {
  const d = G.det, P = G.player; scriptDet();
  if (d.map !== P.map || !d.visible) { d.map = P.map; d.visible = true; [d.x, d.y] = nearestWalkable(P.x + 3, P.y + 1, M); }
  if (dist(d, P) > 1.6) { d.walkTo(P.x, P.y); if (d.path.length) d.path.pop(); await waitUntil(() => !d.path.length, 7); }
  d.lookAt(P); P.lookAt(d);
}
const spDet = (e, t) => say('det', e, t);
const spMe = (t) => say('me', 'blush', t);
async function spChoose(opts, id) { const i = await choose(opts); if (id) spConsent(id + ':' + i, i === 0); return i; }
function spDone(id) { const s = spState(); s.unlockedSpicyEvents[id] = (s.unlockedSpicyEvents[id] || 0) + 1; s.last[id] = S.day; spLog('approach', id); }

/* ---------------- 아찔한 모드 전용 이벤트 15 ---------------- */
const SP_EVENTS = [
  /* 1. 첫 만남 직후 — 연락처 묻는 형사님 */
  { id: 'sp_number', once: true, ok: () => S.rel.flags.met && !spState().firstAttractionTriggered, run: async () => {
    const s = spState(); s.firstAttractionTriggered = true;
    await spComeClose(); G.det.emo('❗', 1.2);
    for (const [e, t] of (S.job === 'haenyeo' ? SP.attractHaenyeo : SP.attract)) await spDet(e, t);
    const i = await spChoose(['번호를 알려 준다', '다음에 또 보면요', '…왜요?'], 'number');
    if (i === 0) { await spDet('blush', '…고마워요. 오늘 밤에 연락해도 돼요? 아, 너무 빠른가. 내일 아침에 할게요. 아니, 오늘 밤에 할래요.'); s.phone = true; addAff(6, { event: true }); burst(G.det, 'heart', 5); }
    else if (i === 1) await spDet('tease', '다음에요. 좋아요. 이 섬 좁은 거 알죠? 금방 또 볼 거예요. 제가 그렇게 만들 거라서.');
    else { await spDet('surprise', '왜냐면…'); await spDet('blush', '처음 보자마자 눈을 못 떼겠어서요. 이유는 그게 다예요. 이상하면 잊어 주세요. 근데 저는 못 잊을 것 같아요.'); addAff(3, { event: true }); }
    memPerm && memPerm('spAttract', { day: S.day });
  } },
  /* 2. 순찰 중 발걸음을 멈춘 형사님 */
  { id: 'sp_patrolStop', cd: 3, st: 1, ok: () => !S.comp && detPlan(S.min).duty && !M.interior, run: async () => {
    const d = G.det; await spComeClose(); d.emo('💓', 1.5);
    await spDet('surprise', spPick(['아, 순찰 중인데… 발이 안 떨어지네요.', '어, 잠깐만요. 그냥 지나치려고 했는데 몸이 먼저 이쪽으로 왔어요.', '순찰 중이에요. 근데 지금 눈앞에 제일 위험한 사람이 있네요. 제 마음한테.']));
    const i = await spChoose(['순찰 잘하세요', '같이 걸을래요?']);
    if (i === 0) await spDet('laugh', '네. 근데 이제 집중은 다 했어요. 하루 종일 이 장면만 생각날 것 같아서.');
    else { await spDet('blush', '…그 말 기다렸어요. 순찰 보조 요원으로 임명합니다. 바로 옆자리로.'); startCompanion({ dutyUntil: S.min + 90 }); }
    addAff(2);
  } },
  /* 3. 마주칠 때마다 대담한 칭찬 */
  { id: 'sp_compliment', cd: 1, st: 1, ok: () => true, run: async () => {
    await spComeClose();
    const L = { 1: ['오늘 진짜 예쁘시다. 아니, 멋있다. 아무튼 눈부셔요.', '그 옷 누가 골라 줬어요? 상 줘야겠다.', '방금 웃는 거 다시 해 줄래요? 못 봐서요. 아니, 봤는데 또 보고 싶어서요.'], 2: ['어제보다 오늘이 더 좋네요. 내일은 얼마나 좋을지 무서워요.', '머리 바꿨어요? 아니면 제가 오늘 유난히 좋아 보이는 건가.', '{me} 지나가면 마을이 환해지는 것 같아요. 저만 그런가.'], 4: ['너 오늘 반칙이야. 그렇게 하고 나오면 나 어떡하라고.', '예쁘다. 진짜로. 말 안 하면 터질 것 같아서 말하는 거야.', '눈 마주치니까 숨이 멎었어. 책임져.'], 5: ['우리 애인 오늘 제일 예쁘네. 아, 매일 하는 말이지만 매일 진심이야.', '오늘 그 모습 나만 보고 싶다. 다른 사람 보지 말라고 할까.'], 6: ['이렇게 예쁜 사람이 내 사람이라니. 아직도 실감 안 나.'], 8: ['여보, 오늘도 반했어. 결혼해서 다행이다, 다른 사람 못 데려가게.'] }[spBand()];
    await spDet(spBand() >= 4 ? 'blush' : 'tease', spPick(L));
    const i = await spChoose(['고마워요', '형사님도 멋있어요', '(웃으며 쳐다본다)']);
    await spDet(i === 1 ? 'blush' : 'laugh', [spPick(['하하, 칭찬은 받는 것보다 하는 게 좋아요. {me}한테는요.', '그렇게 웃으면 제가 하루 종일 칭찬할 거예요.']), spPick(['…방금 그 말 반칙이에요. 저 지금 얼굴 빨개요.', '진짜요? 오늘 거울 한 번 더 봐야겠다.']), spPick(['그렇게 보면 저 오해해요. 아니, 오해하고 싶어요.', '…말 없이 웃는 게 제일 위험하다는 거 알아요?'])][i]);
    addAff(i === 1 ? 3 : 2);
  } },
  /* 4. 먼저 저녁 데이트 신청 */
  { id: 'sp_dinner', cd: 6, st: 2, ok: () => S.min >= 16 * 60 && S.min < 19 * 60 && !M.interior && S.money >= 0, run: async () => {
    const d = G.det, P = G.player; await spComeClose();
    await spDet('smile', '오늘 저녁 비어 있어요? 횟집 이모님이 오늘 참돔 좋은 거 들어왔대요.');
    await spDet('blush', '데이트 신청이에요. 돌려 말하면 못 알아들을까 봐 그냥 말할게요.');
    const i = await spChoose(['좋아요, 가요', '오늘은 어려워요'], 'dinner');
    if (i === 1) { await spDet('smile', '알겠어요. 대신 다음엔 제가 한 번 더 신청할 거예요. 거절해도 또 할 거예요. 괜찮죠?'); return; }
    S.hold = false; startCompanion({});
    await walkBothTo(P_('sashimiDoor'), [P_('sashimiDoor')[0] + 1, P_('sashimiDoor')[1]]);
    await fade(true); advanceTime(80); await sleep(300); await fade(false);
    await say('narr', '', '🍣 마주 앉은 저녁. 형사님은 회를 먹는 것보다 이쪽을 보는 시간이 더 길었다.');
    await spDet('tease', '왜요? 저 계속 쳐다봐서요? 어쩔 수 없어요. 앞에 앉은 사람이 너무 예뻐서.');
    await spDet('blush', '오늘 저녁, 제 인생 저녁 중에 제일 좋았어요. 진짜로.');
    addAff(8, { event: true }); if (!S.rel.flags.spDinner) { S.rel.flags.spDinner = true; await addAlbum('형사님이 먼저 신청한 저녁', 'date'); }
  } },
  /* 5. 밤바다 산책 · 손잡기 제안 */
  { id: 'sp_nightSea', cd: 5, st: 2, ok: () => S.min >= 19.5 * 60 && S.min < 23 * 60 && !M.interior && !rainy(), run: async () => {
    const P = G.player, d = G.det; await spComeClose();
    await spDet('smile', '바다 보러 갈래요? 밤바다는 혼자 보기 아까워서요.');
    if (await spChoose(['가요', '오늘은 피곤해요']) === 1) { await spDet('smile', '그럼 집 앞까지만 데려다줄게요. 그건 거절 못 해요.'); return; }
    startCompanion({}); await walkBothTo(P_('beach'), [P_('beach')[0] + 1, P_('beach')[1]]);
    spNear(3); await say('narr', '', '🌊 파도 소리만 들리는 밤. 달빛이 물 위에 길을 냈다.');
    await spDet('blush', '…손, 잡아도 돼요? 싫으면 말해요. 바로 놓을게요.');
    const i = await spChoose(['응, 잡아요', '아직은요'], 'hand');
    if (i === 0) { S.hold = true; S.arm = false; spNear(4); burst(d, 'heart', 6); await spDet('blush', '따뜻하다. 오늘 밤 내내 이 손 생각날 것 같아요.'); if (!S.rel.flags.hand) { S.rel.flags.hand = true; await addAlbum('밤바다에서 잡은 손', 'hand'); } addAff(6, { event: true }); }
    else { spReset(); await spDet('smile', '알았어요. 그럼 이 정도 거리에서 걸어요. 그래도 좋아요, 옆에 있으니까.'); addAff(2); }
  } },
  /* 6. 둘만 있는 정자에서 가까이 앉기 */
  { id: 'sp_pavilion', cd: 6, st: 2, ok: () => ['forest', 'pavilion'].includes(curPlace()) && !M.interior, run: async () => {
    await spComeClose(); await spDet('smile', '정자 쪽 가 볼래요? 이 시간엔 아무도 없어요.');
    if (await spChoose(['좋아요', '여기 있을래요']) === 1) { await spDet('laugh', '그럼 여기서요. 어디든 상관없어요, {me}랑이면.'); return; }
    const bk = Object.keys(M.benches).find(k => /정자/.test(M.benches[k].name || '')) || Object.keys(M.benches).find(k => M.benches[k].place === 'pavilion');
    if (bk) { closeDialog(); G.busy--; try { await sitTogether(bk); } finally { G.busy++; } }
    spNear(4); await spDet('blush', '…좁네요, 여기. 좁아서 좋아요.');
    await spDet('tease', '어깨 닿았는데 안 피하네요? 그럼 저도 안 피할게요.');
    const i = await spChoose(['기대 본다', '살짝 웃는다']);
    if (i === 0) { G.player.lean = true; burst(G.det, 'heart', 5); await spDet('blush', '……심장 소리 들려요? 지금 엄청 시끄러울 텐데.'); addAff(6, { event: true }); }
    else { await spDet('laugh', '그렇게 웃으면 저 진짜 못 참아요. 일어나야겠다. 아니, 조금만 더 있다가.'); addAff(3); }
    spReset();
  } },
  /* 7. 캠핑장 텐트 앞 모닥불 · 다정한 대화 */
  { id: 'sp_tent', cd: 7, st: 3, ok: () => S.min >= 19 * 60 && S.min < 23.5 * 60 && P_('tentA') && !M.interior && !rainy(), run: async () => {
    await spComeClose(); await spDet('smile', '캠핑장에 모닥불 피워 놨어요. 같이 불 보러 갈래요?');
    if (await spChoose(['가요', '다음에요']) === 1) { await spDet('smile', '다음에 꼭이요. 마시멜로 사 둘게요.'); return; }
    startCompanion({}); const t = P_('tentA'); await walkBothTo([t[0], t[1] + 1], [t[0] + 1, t[1] + 1]);
    spNear(3); await say('narr', '', '🔥 타닥타닥 장작 타는 소리. 불빛이 형사님 얼굴을 주황색으로 물들였다.');
    await spDet('normal', '저 사실 사람 사귀는 거 엄청 조심하는 편이었어요. 다치는 게 무서워서.');
    await spDet('blush', '근데 {me}는 처음부터 조심할 틈을 안 줬어요. 그게 무섭기도 하고, 좋기도 해요.');
    const i = await spChoose(['나도 그래요', '천천히 알아 가요']);
    await spDet(i === 0 ? 'blush' : 'smile', i === 0 ? '…다행이다. 나만 그런 거 아니라서.' : '응. 천천히, 대신 매일 조금씩. 약속이에요.'); addAff(i === 0 ? 7 : 5, { event: true });
    if (!S.rel.flags.spTent) { S.rel.flags.spTent = true; await addAlbum('모닥불 앞 고백 같은 이야기', 'date'); }
  } },
  /* 8. 비 오는 날 우산 하나 */
  { id: 'sp_umbrella', cd: 4, st: 1, ok: () => S.weather === 'rain' && !M.interior, run: async () => {
    await spComeClose(); spNear(4); G.det.emo('☂', 2);
    await spDet('smile', S.rel.stage >= 4 ? '우산 없지? 이리 와. 하나로 같이 쓰자.' : '우산 없으세요? 이리 오세요. 하나로 같이 써요.');
    await say('narr', '', '☔ 우산 하나에 두 사람. 형사님 쪽 어깨가 점점 젖어 간다.');
    const i = await spChoose(['어깨 젖잖아요', '(더 가까이 붙는다)']);
    if (i === 0) await spDet('laugh', '괜찮아요. 제 어깨는 젖어도 돼요. {me}만 안 젖으면.');
    else { burst(G.det, 'heart', 5); await spDet('blush', '……그렇게 붙으면 제가 우산을 어떻게 똑바로 들어요. 손 떨리잖아요.'); }
    addAff(5, { event: true }); spReset();
  } },
  /* 9. 늦은 밤 사택에 초대 */
  { id: 'sp_sataek', cd: 7, st: 4, ok: () => S.min >= 20 * 60 && S.min < 23 * 60 && !M.interior && spState().firstNightEventCompleted, run: async () => {
    await spComeClose(); await spDet('blush', '우리 집에서 차 한잔할래? 사택이라 좁긴 한데. 아무 짓도 안 할게. …네가 원하지 않으면.');
    const i = await spChoose(['좋아, 갈게', '오늘은 데려다줘'], 'sataek');
    if (i === 1) { await spDet('smile', '응. 집 앞까지. 문 닫히는 거 보고 갈게.'); return; }
    startCompanion({}); S.hold = true; await walkBothTo(P_('sataekDoor'), [P_('sataekDoor')[0] + 1, P_('sataekDoor')[1]]);
    endCompanion(true); const m = MAPS.in_sataek;
    if (m) { await goMap('in_sataek', m.spawn.door[0], m.spawn.door[1] - 1); const d = G.det; d.map = 'in_sataek'; d.visible = true; [d.x, d.y] = nearestWalkable(m.spawn.door[0] + 1, m.spawn.door[1] - 2, m); d.state = 'script'; G.player.prop = 'tea'; d.prop = 'tea'; }
    spNear(4); await spDet('smile', '여기 앉아. 차 식기 전에.');
    await spDet('blush', '네가 우리 집에 있으니까 집이 처음으로 집 같다.');
    const k = await spChoose(['오늘 자고 갈래', '차만 마시고 갈게'], 'stay');
    G.player.prop = null; G.det.prop = null;
    if (k === 0) { await spDet('blush', '…진짜? 그럼 오늘은 놓아주지 않을게. 아침까지.'); await spHug('♥'); spState().nightPending = 'sataek'; await fade(true); await say('narr', '', '🌙 창밖으로 등대 불빛이 천천히 돌았다. 밤이 조용히 깊어 갔다.'); closeDialog(); G.busy--; try { await endDay(false); } finally { G.busy++; } return; }
    await spDet('smile', '응. 데려다줄게. 오늘 와 줘서 고마워. 진짜로.'); addAff(5, { event: true });
  } },
  /* 10. 첫 입맞춤 — 묻고, 기다리는 형사님 */
  { id: 'sp_firstKiss', once: true, st: 2, ok: () => !S.rel.flags.kiss && S.min >= 17 * 60 && !M.interior && (S.rel.stage >= 4 || spState().firstNightEventCompleted || S.rel.aff >= 110), run: async () => {
    await spComeClose(); spNear(5);
    await spDet('normal', '…{me}.');
    await say('narr', '', '말이 끊겼다. 파도 소리가 두 번 지나갈 만큼의 침묵.');
    await spDet('blush', S.rel.stage >= 4 ? '너 지금 내가 무슨 생각 하는지 알아? 입 맞추고 싶다는 생각.' : '지금 제가 무슨 생각 하는지 알아요? 입 맞추고 싶다는 생각이요.');
    await spDet('blush', S.rel.stage >= 4 ? '괜찮으면 내가 먼저 해도 돼?' : '괜찮으면… 제가 먼저 해도 돼요?');
    const i = await spChoose(['(눈을 감는다)', '내가 먼저 할래', '아직은 아니야'], 'firstKiss');
    if (i === 2) { spReset(); await spDet('smile', '알았어요. 기다릴게요. 얼마든지. 대신 그때 되면 꼭 말해 줘요.'); spConsent('kissNo', false); return; }
    if (i === 1) await spMe('(까치발을 하고 먼저 입을 맞췄다.)');
    await kissAnim('♥'); S.rel.flags.kiss = true; S.rel.flags.cheek = true;
    await spDet('surprise', i === 1 ? '……반칙. 그건 진짜 반칙이에요.' : '……');
    await spDet('blush', '평생 기억할 거예요. 지금 이 바람, 이 소리, 이 얼굴.');
    addAff(10, { event: true }); await addAlbum('첫 입맞춤', 'kiss'); spReset();
  } },
  /* 11. 뜻밖의 하룻밤 — 처음 만난 날부터 가능, 반드시 두 번 묻기 */
  { id: 'sp_firstNight', once: true, st: 1, ok: () => !spState().firstNightEventCompleted && S.min >= 20 * 60 && S.min < 25 * 60 && !M.interior && !S.rel.flags.married && spState().firstAttractionTriggered && spState().nightDeclinedDay !== S.day, run: async () => {
    const s = spState(), P = G.player, d = G.det;
    await spComeClose();
    await spDet('smile', '이 시간에 또 만나네. 우리 오늘 좀 자주 마주친다?');
    await spDet('normal', '나 사실 아까 헤어지고도 계속 네 생각했어.');
    await spDet('blush', '처음 본 사람한테 이러는 거, 나도 좀 낯설거든.');
    await spDet('blush', '그런데 오늘은… 그냥 보내기 싫다.');
    const i = await spChoose(['나도 조금 더 같이 있고 싶어', '그럼 어디 조용한 데 갈까?', '오늘은 여기까지만 하자'], 'night1');
    if (i === 2) { s.nightDeclinedDay = S.day; await spDet('smile', '응. 알았어. 오늘 만나서 정말 좋았어. 집 앞까지만 데려다줄게. 그건 해도 되지?'); addAff(3, { event: true }); return; }
    const where = await spChoose(['형사님 사택으로', '우리 집으로', '바다 보면서 조금만 더 걷자'], 'night1where');
    if (where === 2) { startCompanion({}); await walkBothTo(P_('promenade'), [P_('promenade')[0] + 1, P_('promenade')[1]]); spNear(3); await say('narr', '', '🌙 늦은 밤 해안 산책로. 바람에 서로의 옷깃이 스쳤다.'); await spDet('blush', '…이렇게 걷기만 해도 좋다. 근데 솔직히 손은 잡고 싶어.'); S.hold = true; burst(d, 'heart', 4); }
    spNear(5); await spDet('normal', '잠깐. 정말 괜찮겠어?');
    await spDet('normal', '나중에 후회할 일은 만들고 싶지 않거든. 네가 싫으면, 지금 말해도 돼. 아무렇지 않아.');
    const c = await spChoose(['응, 괜찮아. 같이 있자', '역시 오늘은 아닌 것 같아'], 'night1consent');
    if (c === 1) { spReset(); s.nightDeclinedDay = S.day; await spDet('smile', '응. 말해 줘서 고마워. 진짜로. 그럼 오늘은 데려다주고, 내일 다시 보자.'); addAff(4, { event: true }); return; }
    await kissAnim('♥'); S.rel.flags.kiss = true; S.rel.flags.cheek = true; S.rel.flags.hand = true;
    await spDet('blush', '그럼 오늘 밤은 조금만 더 같이 있자.');
    S.hold = true; startCompanion({});
    const place = where === 1 ? 'home' : 'sataek', door = place === 'home' ? P_('homeDoor') : P_('sataekDoor');
    await walkBothTo(door, [door[0] + 1, door[1]]); endCompanion(true);
    const m = MAPS[place === 'home' ? 'in_home' : 'in_sataek'];
    if (m) { await goMap(m.id, m.spawn.door[0], m.spawn.door[1] - 1); d.map = m.id; d.visible = true; [d.x, d.y] = nearestWalkable(m.spawn.door[0] + 1, m.spawn.door[1] - 1, m); d.state = 'script'; }
    spNear(5); await spHug('♥');
    await say('narr', '', '문이 닫히고, 바깥 파도 소리가 멀어졌다.');
    await spDet('blush', '…너 떨고 있다. 나도. 우리 둘 다 똑같네.');
    await kissAnim('♥♥');
    await say('narr', '', '조명이 하나씩 꺼지고, 서로의 숨소리만 남았다.');
    s.firstNightEventCompleted = true; s.firstNightDay = S.day; s.firstNightPlace = place; s.nightPending = place;
    memPerm && memPerm('spFirstNight', { day: S.day, place });
    await fade(true); await say('narr', '', '🌙 그렇게 해월도의 밤이 천천히 지나갔다.'); closeDialog();
    G.busy--; try { await endDay(false); } finally { G.busy++; }
  } },
  /* 13. 서로를 의식하며 어색하게 웃기 (하룻밤 다음 날 이후) */
  { id: 'sp_awkward', once: true, st: 1, ok: () => spState().morningAfterEventCompleted && S.day > (spState().firstNightDay || 0) && S.day - spState().firstNightDay <= 4, run: async () => {
    await spComeClose(); G.det.emo('💦', 1.2);
    await spDet('surprise', '어, 어… 안녕.');
    await say('narr', '', '눈이 마주치자 둘 다 동시에 딴 데를 봤다. 그리고 동시에 웃음이 터졌다.');
    await spDet('laugh', '하하, 우리 왜 이래. 중학생도 아니고.');
    await spDet('blush', '근데 이상하게 기분 좋다. 너 볼 때마다 그날 생각나서.');
    const i = await spChoose(['나도 그래', '그 얘기 하지 마…!']);
    await spDet(i === 0 ? 'blush' : 'tease', i === 0 ? '…그럼 우리 둘 다 같은 생각 하는 거네. 큰일이다.' : '알았어, 안 할게. 대신 표정으로 할게. 이렇게.'); addAff(5, { event: true });
  } },
  /* 14. 형사님이 먼저 관계를 진지하게 */
  { id: 'sp_serious', once: true, st: 3, ok: () => (spState().firstNightEventCompleted || S.rel.aff >= 160) && S.min >= 16 * 60 && !S.rel.flags.lovers, run: async () => {
    await spComeClose(); await spDet('normal', '잠깐 얘기 좀 할 수 있어? 장난 말고, 진지하게.');
    await spDet('normal', '나 처음엔 너한테 끌리는 게 그냥 설레는 거라고 생각했어. 오래 안 갈 줄 알았고.');
    await spDet('blush', '근데 아니더라. 아침에 눈 뜨면 네 생각부터 나. 순찰 돌다가도, 낚시하다가도.');
    await spDet('smile', '그래서 말인데, 나 이거 가볍게 하고 싶지 않아. 제대로 하고 싶어. 너만 괜찮다면.');
    const i = await spChoose(['나도 제대로 하고 싶어', '조금만 더 생각할게']);
    if (i === 0) { await spDet('blush', '…다행이다. 그럼 조만간, 정말 제대로 말할게. 분위기 좋은 데서.'); S.rel.confessDay = Math.min(S.rel.confessDay || 0, S.day - 3); addAff(8, { event: true }); }
    else await spDet('smile', '응. 기다릴게. 서두를 생각 없어. 네 대답이 제일 중요하니까.');
  } },
  /* 15. 끌림인 줄 알았는데 사랑이었다 */
  { id: 'sp_realize', once: true, st: 4, ok: () => !!(spState().unlockedSpicyEvents.sp_serious) && S.min >= 18 * 60 && !M.interior, run: async () => {
    await spComeClose(); spNear(3);
    await spDet('normal', '나 오늘 하루 종일 한 가지만 생각했어.');
    await spDet('blush', '처음 본 날, 그냥 끌렸어. 눈이 자꾸 가고, 말 걸고 싶고. 그게 다인 줄 알았어.');
    await spDet('blush', '근데 네가 다른 사람이랑 웃는 거 보면 질투 나고, 네가 아프다고 하면 내가 아프고, 네가 웃으면 하루가 좋아.');
    await spDet('smile', '이거 사랑이더라. 이제야 알았어. 늦어서 미안.');
    const i = await spChoose(['나도 사랑해', '(말없이 안긴다)']);
    if (i === 1) await spHug('♥'); else burst(G.det, 'heart', 8);
    await spDet('blush', '…고마워. 이 말 평생 아껴 들을게.'); addAff(12, { event: true }); await addAlbum('사랑이라는 걸 깨달은 날', 'love'); spReset();
  } },
  /* 덤: 여성 주민이 형사님께 들이대는 걸 본 뒤 */
  { id: 'sp_jealous', cd: 5, st: 2, ok: () => G.villagers && G.villagers.some(v => v.vid && /tourist/.test(v.vid) && v.visible && v.map === G.player.map && dist(v, G.det) < 3), run: async () => {
    const v = G.villagers.find(v => v.vid && /tourist/.test(v.vid) && v.visible && v.map === G.player.map); if (v) { v.stop && v.stop(); v.lookAt(G.det); v.say(spPick(['형사님~ 사진 한 장만요!', '형사님 저녁에 시간 있으세요?', '형사님 진짜 멋있으세요!']), 2.5); }
    await sleep(900); await spComeClose();
    await spDet('smile', spPick(SP.jealous));
    const i = await spChoose(['질투 안 났어요', '…조금 났어요']);
    await spDet(i === 1 ? 'blush' : 'tease', i === 1 ? '…좋다. 아니, 미안. 근데 좋다. 나만 질투하는 거 아니라서.' : '진짜? 그럼 다음엔 일부러 오래 얘기해 볼까. 농담이야. 너밖에 안 보여.'); addAff(4);
  } },
];
/* 12. 다음 날 아침 재회 */
async function spMorningAfter(place) {
  const s = spState(), P = G.player, d = G.det;
  const m = MAPS[place === 'home' ? 'in_home' : 'in_sataek'];
  if (m && P.map !== m.id) await goMap(m.id, 3.5, 3.5, { noFade: true });
  d.map = P.map; d.visible = true; d.state = 'script'; d.scripted = true; d.outfit = 'casual'; [d.x, d.y] = nearestWalkable(P.x + 1, P.y, MAPS[P.map]); d.lookAt(P); P.lookAt(d);
  await say('narr', '', '🌅 커튼 사이로 아침 햇살이 들어왔다. 옆에서 누군가 먼저 깨어 있었다.');
  const v = pick(['A', 'B', 'C', 'D']);
  for (const [e, t] of SP.morning[v]) await spDet(e, t);
  const i = await spChoose(['좋은 아침', '…어젯밤 꿈 아니지?', '(이불 속으로 숨는다)']);
  await spDet(['smile', 'blush', 'laugh'][i], ['좋은 아침. 이 말 매일 하고 싶다.', '꿈이면 나 다시 잘래. 근데 꿈 아니야. 여기 있잖아, 나.', '하하, 거기 숨어도 다 보여. 귀까지 빨개.'][i]);
  for (const [e, t] of SP.morningAsk) await spDet(e, t);
  const k = await spChoose(['좋아, 저녁에 봐', '생각해 볼게'], 'morningDate');
  if (k === 0) { await spDet('blush', '좋다. 그럼 저녁 여섯 시에 부두 끝에서. 이번엔 꽃도 들고 갈게.'); addAff(6, { event: true }); }
  else await spDet('smile', '응, 천천히. 네 대답 기다리는 것도 좋아.');
  await spDet('normal', '…아, 나 출근해야 돼. 가기 싫다. 진짜로.');
  burst(d, 'heart', 5);
  s.morningAfterEventCompleted = true;
  await addAlbum('뜻밖의 하룻밤, 그다음 아침', 'love');
  closeDialog(); d.scripted = false; d.state = 'sched'; d.visible = false; d.map = 'island';
}
/* ---------------- 이벤트 고르기 · 먼저 다가오기 · 말풍선 ---------------- */
function spCheck() {
  const r = S.rel, d = G.det, P = G.player, s = spState();
  if (!r.flags.met || G.busy || G.dialog || G.sheet || G.mgOn || G.dev) return false;
  const near = d.visible && d.map === P.map && dist(d, P) < 7 && d.state !== 'script';
  G._spT = (G._spT || 0) + 1;
  // 말풍선
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
  // 먼저 다가와서 한마디 (자주)
  if (!S.comp && Math.random() < 0.3 && now - (s.last._appr || -1e9) > 120) { s.last._appr = now; s.last._any = now; spLog('approach', 'approach'); runEvent(detApproach); return true; }
  return false;
}
const _checkEventsSp = checkEvents;
checkEvents = function () { _checkEventsSp(); if (spOn() && !G.busy) try { spCheck(); } catch (e) { console.error('[spicy]', e); } };
/* 함께 걸을 때 한마디 */
const _compLineSp = compLine;
compLine = function () { if (spOn() && Math.random() < 0.6) return spPick(SP.walk[spBand()]); return _compLineSp(); };
