'use strict';
/* =========================================================
 *  해월도 v6 — 연결 레이어
 *  첫 만남 40종 · 말 놓기 8종 · 말투 · 형사님 자율 행동 · 약속 · 깜짝 이벤트 15종
 *  연계 이벤트 5종 · 이벤트 우선순위 · 행동 버튼 · 메뉴 · 시작/하루 훅
 * ========================================================= */
G.visitors = [];

/* ---------------- 말투: 대사 출력 단계에서 일관되게 ---------------- */
const _say0 = say;
say = function (who, expr, text) {
  let t = speechPick(text);
  if (who !== 'me' && who !== 'narr') G._talkTo = who;
  if (!G.rawSpeech && casualOn()) { if (who === 'det') t = toBanmal(t); else if (who === 'me' && G._talkTo === 'det') t = toBanmalMe(t); }
  return _say0(who, expr, t);
};
choiceText = function (t) { t = speechPick(fillNames(t)); if (G._talkTo && G._talkTo !== 'det') return t; if (casualOn() && !G.rawSpeech) return toBanmalMe(t); return S.rel.stage >= 4 && himCall() !== '형사님' ? t.replace(/형사님/g, himCall()) : t; };
const _actorSay0 = Actor.prototype.say;
Actor.prototype.say = function (text, t) { let s = speechPick(text); if (this.id === 'det' && casualOn()) s = toBanmal(s); return _actorSay0.call(this, s, t); };
himCall = function () {
  const st = S ? S.rel.stage : 1;
  if (st >= 8) return '여보';
  if (st >= 5 && S.names.detNick) return S.names.detNick;
  if (st >= 5 && S.detName) return S.detName;
  if (casualOn() && S.detName) return S.detName;
  if (st >= 4 && S.detName) return S.detName + ' 씨';
  return '형사님';
};
meCall = function () {
  const st = S.rel.stage;
  if (st >= 8) return '여보';
  if (st >= 5 && S.names.meNick) return S.names.meNick;
  if (casualOn()) return S.name;
  return S.name + ' 씨';
};

/* ---------------- 첫 만남 40종 (직업별 8종 중 하나, 번호는 보이지 않음) ---------------- */
const FM_POS = { in_clinic: ['in_clinic', 3.5, 3.5], in_school: ['in_school', 3.5, 3.5], in_cafe: ['in_cafe', 3.5, 1.5] };
function fmPos(at) { if (FM_POS[at]) return FM_POS[at]; const p = P_(at); return ['island', p[0], p[1]]; }
function chooseFirstMeeting(job) {
  const list = FIRST_MEETINGS.filter(f => f.job === job);
  const f = list[Math.floor(Math.random() * list.length)];
  return { id: f.id, place: f.place, at: f.at, done: false };
}
function fmDef() { return S.fm && FIRST_MEETINGS.find(f => f.id === S.fm.id); }
function fmSetup() {
  const F = fmDef(); if (!F || S.rel.flags.met) return;
  const [map, x, y] = fmPos(F.at), P = G.player;
  if (F.weather) S.weather = F.weather;
  P.map = map; M = MAPS[map]; [P.x, P.y] = nearestWalkable(x, y, M);
  const d = G.det; d.state = 'sched';
  if (map === 'island') {
    const dirs = [[6, 2], [-6, 2], [2, 6], [-2, -6], [6, -3]]; let spot = null;
    for (const [a, b] of dirs) { const [tx, ty] = nearestWalkable(P.x + a, P.y + b, MAPS.island); if (findPath(tx, ty, P.x, P.y, { map: MAPS.island })) { spot = [tx, ty]; break; } }
    d.map = 'island'; [d.x, d.y] = spot || nearestWalkable(P.x + 3, P.y, MAPS.island); d.visible = true;
  } else { d.map = 'island'; d.visible = false; d.fmEnterAt = 8 * 60 + 6; }
  G.tempObjs = G.tempObjs.filter(o => !o.fmProp);
  F.props.forEach((pv, i) => { if (pv === 'cat') { const cat = G.pets.find(v => v.vid === 'cheese'); if (cat) { cat.map = map; [cat.x, cat.y] = nearestWalkable(P.x + 1, P.y + 1, M); cat.pose = 'sit'; cat.hold = 9999; } return; } const [px, py] = nearestWalkable(P.x + (i ? -1 : 1), P.y + 1, M); G.tempObjs.push({ kind: 'prop', v: pv, x: Math.floor(px), y: Math.floor(py), map, solid: false, fmProp: true }); });
  if (F.npc) { const a = G.actors.find(v => v.id === F.npc); if (a) { a.map = map; [a.x, a.y] = nearestWalkable(P.x - 1, P.y + 1, M); a.stop(); a.hold = 9999; a.lookAt(P); } }
  G.camSnap = true;
}
function autoExpr(t) { return /하하|허허/.test(t) ? 'laugh' : /어이쿠|아이고|잠깐만요|!/.test(t) ? 'surprise' : /\?/.test(t) ? 'smile' : 'normal'; }
firstMeeting = async function () {
  const d = G.det, P = G.player, F = fmDef() || FIRST_MEETINGS.find(f => f.job === S.job);
  scriptDet(); d.lookAt(P); P.lookAt(d); d.emo('❗');
  G.rawSpeech = true;
  try {
    if (F.npc) { const a = G.actors.find(v => v.id === F.npc); if (a) { a.talking = true; a.map = P.map; if (dist(a, P) > 3) [a.x, a.y] = nearestWalkable(P.x - 1, P.y + 1, M); a.lookAt(P); } }
    await say('narr', '', F.narr);
    for (const [who, line] of F.lines) {
      if (who === 'det') { d.lookAt(P); await say('det', autoExpr(line), line); }
      else await say(who, autoExpr(line), line);
    }
    if (S.job === 'haenyeo') {
      const c = await choose(['형사님도 순찰 수고하세요', '(웃으며 고개를 끄덕인다)']);
      await say('det', 'smile', c === 0 ? '하하, 네. 오늘도 물 조심하시고요.' : '하하. 그럼 또 부두에서 봬요.');
    } else {
      const c = await choose([`저는 ${S.name}이에요. 잘 부탁드려요`, '네, 잘 부탁드려요']);
      await say('det', 'smile', c === 0 ? `${S.name} 씨. 기억해 두겠습니다.` : '네. 섬이 좁아서 자주 뵙게 될 거예요.');
    }
  } finally { G.rawSpeech = false; }
  if (F.npc) { const a = G.actors.find(v => v.id === F.npc); if (a) { a.talking = false; a.hold = 0; } }
  const cat = G.pets.find(v => v.vid === 'cheese'); if (cat) cat.hold = 0;
  G.tempObjs = G.tempObjs.filter(o => !o.fmProp);
  S.rel.flags.met = true; S.rel.metDay = S.day; S.rel.daily.met = true; addAff(5, { event: true });
  S.fm.done = true; S.fm.day = S.day;
  memPerm('firstMeet', { id: F.id, place: F.place, title: F.title });
  qSet('first_meet', { state: 'COMPLETED' });
  await addAlbum('첫 만남', 'meet');
  S.album[0].desc = `${F.place}에서 처음 만났다.`;
  await say('narr', '', '💡 형사님을 눌러 대화하고, 「함께 다니기」로 같이 마을을 걸어 보세요. 오른쪽 📋 퀘스트에서 할 일을 볼 수 있어요.');
  d.task = null;
};
QDEF.first_meet = { title: '해월도에서의 첫날', view: () => { if (S.rel.flags.met) return { hidden: true }; const F = fmDef(); return { desc: S.job === 'haenyeo' ? '오늘도 평소처럼 하루를 시작해요.' : '새로운 섬 생활의 첫날이에요.', goal: '마을을 둘러보며 사람들과 인사하기', target: null }; } };

/* ---------------- 말 놓기 이벤트 8종 ---------------- */
function banmalPlaceOk(v) {
  const pl = curPlace(), P = G.player, t = tileAt(Math.floor(P.x), Math.floor(P.y), MAPS[P.map]);
  switch (v) {
    case 'ban_A': return t === T.BOARD || pl === 'promenade' || pl === 'beach';
    case 'ban_B': return pl === 'cafe' || P.map === 'in_cafe';
    case 'ban_C': return ['pier', 'fishing', 'dock'].includes(pl);
    case 'ban_D': return (S.weather === 'rain' || S.weather === 'snow') && !M.interior;
    case 'ban_E': return pl === 'orchard' || pl === 'farm';
    case 'ban_F': return t === T.ALLEY;
    case 'ban_G': return pl === 'lighthouse';
    case 'ban_H': return pl === 'hall' || P.map === 'in_hall';
  }
  return false;
}
function banmalDue() {
  const r = S.rel; if (r.flags.banmal || r.stage < 3 || !r.flags.met) return null;
  if (!r.speech.informalSpeechEventVariant) { r.speech.informalSpeechEventVariant = pick(BANMAL_EVENTS).id; r.speech.since = S.day; r.speech.informalSpeechUnlocked = true; }
  const v = r.speech.informalSpeechEventVariant;
  const d = G.det, near = d.visible && d.map === G.player.map && dist(d, G.player) < 3.2;
  if (!near) return null;
  if (banmalPlaceOk(v)) return v;
  if (S.day - (r.speech.since || S.day) >= 2) return v === 'ban_D' && !banmalPlaceOk(v) ? 'ban_F' : v;
  return null;
}
async function banmalEvent(v) {
  const E = BANMAL_EVENTS.find(e => e.id === v), d = G.det, P = G.player, r = S.rel;
  scriptDet(); d.lookAt(P); P.lookAt(d);
  G.rawSpeech = true;
  try {
    if (v === 'ban_H') { const a = G.actors.find(x => x.id === 'chief'); if (a) { a.map = P.map; [a.x, a.y] = nearestWalkable(P.x - 1, P.y + 1, M); a.talking = true; a.lookAt(P); } }
    for (const [who, line] of E.lines) await say(who, who === 'det' ? autoExpr(line) : 'smile', line);
  } finally { G.rawSpeech = false; const a = G.actors.find(x => x.id === 'chief'); if (a) a.talking = false; }
  r.flags.banmal = true;
  Object.assign(r.speech, { informalSpeechUnlocked: true, informalSpeechEventCompleted: true, informalSpeechEventVariant: v, informalSpeechEventDate: S.day });
  memPerm('banmal', { variant: v, place: E.place });
  addAff(4, { event: true }); burst(d, 'heart', 4);
  toast('💬 이제 서로 편하게 말을 놓아요');
  await addAlbum('말 놓은 날', 'walk');
}

/* ---------------- 일상 대화: 단계에 맞는 말투 풀 ---------------- */
dailyTalk = async function () {
  const r = S.rel, cas = casualOn(), st = cas ? Math.min(8, r.stage) : Math.min(2, r.stage);
  if (r.daily.fight) { await fightTalk(); return; }
  const smallPool = () => cas ? casualPool(r.stage) : [...SMALLTALK[st], ...SEASON_IDLE[season()], ...(WEATHER_IDLE[S.weather] || [])];
  if (r.daily.talk >= 2) { if (r.daily.talk === 2) await say('det', 'laugh', cas ? '오늘 말 많이 하네? 좋아, 나 수다 좋아해.' : '오늘 말 많이 하네요? 좋아요, 저 수다 좋아해요.'); await say('det', 'smile', pick(smallPool())); r.daily.talk++; return; }
  // 기억 기반 한마디
  if (cas && r.daily.talk === 1 && Math.random() < 0.5) { const m = memoryLine(); if (m) { await say('det', 'smile', m); r.daily.talk++; addAff(1); return; } }
  const pool = TALKS[st] || [], idx = r.talkIdx[st] || 0;
  if (idx < pool.length && r.daily.talk === 0) { const tp = pool[idx].job ? JOB_TALK[S.job] : pool[idx]; await topic(tp); r.talkIdx[st] = idx + 1; }
  else { await say('det', 'smile', pick(smallPool())); addAff(1); }
  r.daily.talk++;
  memRecent('talk', '형사님과 이야기했다');
};
/* 실제 기록된 기억으로만 말한다 */
function memoryLine() {
  const P = S.mem.perm, c = casualOn(), out = [];
  if (P.firstMeet && P.firstMeet.place) out.push(c ? `우리 ${P.firstMeet.place}에서 처음 봤던 거 기억나? ${S.job === 'haenyeo' ? '얼굴은 원래 알았지만.' : '그때 너 표정 아직도 생각나.'}` : `${P.firstMeet.place}에서 처음 뵀던 날 기억나요?`);
  if (P.firstDate) out.push(`첫 데이트 ${P.firstDate.place} 갔던 거, 가끔 생각나.`);
  const food = memTop('food'); if (food && ITEMS[food]) out.push(`너 ${ITEMS[food].name} 진짜 좋아하더라. 다음에 내가 사 올게.`);
  const pl = memTop('place'); if (pl) out.push(`우리 ${placeName(pl) || pl} 자주 가네. 거기 좋아?`);
  const lastFest = memLast('festival'); if (lastFest) out.push(`지난번 ${lastFest.text.replace(/에 함께했다$/, '')} 재밌었지.`);
  const lastCase = memLast('case'); if (lastCase) out.push(`${lastCase.text.replace(/을\(를\) 함께 해결했다$/, '')} 사건, 우리 콤비 꽤 괜찮았어.`);
  if (P.firstPhoto) out.push('그 네컷사진 아직 갖고 있지? 나 지갑에 넣고 다녀.');
  return out.length ? pick(out) : null;
}
const _giveGift0 = giveGift;
giveGift = async function (k) {
  const top = memTop('gift');
  memPref('gift', k); memRecent('gift', `${josa(ITEMS[k].name, '을', '를')} 선물했다`);
  if (casualOn() && top === k && !S.rel.daily.gift) { G.det.talking = true; await say('det', 'blush', '또 이거야? 하하, 내가 이거 좋아하는 거 확실히 아는구나.'); }
  return _giveGift0(k);
};
const _doDate0 = doDate;
doDate = async function (k) {
  const D = DATES[k], first = S.mem.perm.firstDate;
  if (first && first.k === k && casualOn()) G._revisitLine = '여기 기억나? 우리 처음 같이 왔던 곳인데.';
  await _doDate0(k);
  memPerm('firstDate', { k, place: D.name }); memPref('date', k); memPref('place', curPlace()); memRecent('date', D.name);
  if (G._revisitLine) { const l = G._revisitLine; G._revisitLine = null; runEvent(async () => { await say('det', 'smile', l); }); }
  qSet('first_date', { state: 'COMPLETED' });
};
QDEF.first_date = { title: '💗 형사님과 첫 데이트', view: () => S.rel.stage >= 5 && !S.mem.perm.firstDate ? { desc: '연인이 되었어요! 첫 데이트를 해 봐요.', goal: '형사님 메뉴 → 데이트 신청', reward: '호감도 · 추억 기록' } : { hidden: true } };

/* ---------------- 약속 (날짜 · 시간 · 장소) ---------------- */
const APPT_PLACES = {
  cafe: { name: '카페 쉼터', pos: 'cafeBench', date: 'cafe' }, lighthouse: { name: '등대', pos: 'lighthouse', date: 'lighthouse' }, promenade: { name: '해안 산책로', pos: 'promenade', date: 'beach' },
  rocks: { name: '갯바위', pos: 'rocks', date: 'rocks' }, islet: { name: '포구 배 앞 (무인도행)', pos: 'boatSpot', date: 'islet' }, orchard: { name: '귤밭', pos: 'orchardGate', date: 'orchard' },
  fest: { name: '축제장', pos: null, fest: true }, home: { name: '우리 집 앞', pos: 'homeDoor', date: 'home' }, booth: { name: '네컷사진 부스', pos: 'booth', photo: true }, furniture: { name: '가구점', pos: 'furnitureDoor', shop: true },
};
const APPT_TIMES = [[12 * 60, '12:00 (점심시간)'], [17.5 * 60, '17:30'], [19 * 60, '19:00'], [20.5 * 60, '20:30']];
function apptPos(a) { const P = APPT_PLACES[a.place]; if (P.fest) { const fe = Object.keys(FESTS).map(id => ({ id, day: festDay(id, a.day) })).find(x => x.day === a.day); return P_(fe ? FESTS[fe.id].at : 'plaza'); } return P_(P.pos); }
function activeAppt(min) { return S.appts.find(a => a.day === S.day && a.status === 'set' && min >= a.min - 50 && min < a.min + 90) || null; }
function apptQuestDef(id) {
  const a = S.appts.find(x => 'appt_' + x.id === id); if (!a) return null;
  return { title: `💌 형사님과 ${APPT_PLACES[a.place].name}에서 만나기`, view: () => { if (a.status !== 'set') return { hidden: true }; const p = apptPos(a); return { desc: a.day === S.day ? '오늘 약속이 있어요!' : `${dateLabel(a.day)} 약속`, goal: `${fmtTime(a.min)}까지 ${APPT_PLACES[a.place].name}로 이동`, target: { map: 'island', x: p[0], y: p[1] }, place: APPT_PLACES[a.place].name, reward: '호감도 · 추억 기록', time: `${dateLabel(a.day)} ${fmtTime(a.min)}` }; } };
}
async function apptMenu() {
  const c = casualOn();
  const pending = S.appts.filter(a => a.status === 'set' && a.day >= S.day);
  if (pending.length >= 2) { await say('det', 'smile', c ? '약속이 벌써 두 개야. 그거 먼저 지키자.' : '약속이 벌써 두 개예요. 그거 먼저 지켜요.'); return; }
  await say('me', 'smile', c ? '우리 약속 잡을래?' : '형사님, 같이 약속 잡을래요?');
  await say('det', 'smile', c ? '좋지. 언제가 좋아?' : '좋아요. 언제가 좋아요?');
  const days = [0, 1, 2, 3].map(k => S.day + k);
  const di = await choose(days.map((d, i) => i === 0 ? '오늘' : i === 1 ? '내일' : dateLabel(d)));
  const day = days[di];
  const times = APPT_TIMES.filter(([m]) => day > S.day || m > S.min + 40);
  if (!times.length) { await say('det', 'smile', c ? '오늘은 시간이 다 갔다. 내일로 하자.' : '오늘은 시간이 늦었네요. 내일로 해요.'); return; }
  const ti = await choose(times.map(t => t[1]));
  const keys = Object.keys(APPT_PLACES).filter(k => k !== 'fest' || Object.keys(FESTS).some(id => festDay(id, day) === day));
  await say('det', 'tease', c ? '어디서 볼까?' : '어디서 만날까요?');
  const pi = await choose(keys.slice(0, 5).map(k => APPT_PLACES[k].name).concat(['다른 곳…']));
  let place = keys[pi];
  if (pi === 5) { const rest = keys.slice(5); const pj = await choose(rest.map(k => APPT_PLACES[k].name)); place = rest[pj]; }
  if (place === 'home' && S.rel.stage < 5 && !S.rel.flags.married) place = 'cafe';
  const a = { id: 'a' + S.day + '_' + Date.now().toString(36).slice(-3), day, min: times[ti][0], place, status: 'set', resched: 0, made: S.day };
  S.appts.push(a); qSet('appt_' + a.id, { state: 'ACTIVE' });
  await say('det', 'blush', c ? `${dateLabel(day)} ${fmtTime(a.min)}, ${APPT_PLACES[place].name}. 수첩에 적었다. 늦으면 벌금이다?` : `${dateLabel(day)} ${fmtTime(a.min)}, ${APPT_PLACES[place].name}. 수첩에 적었어요. 늦으면 안 돼요?`);
  toast(`📅 약속 — ${dateLabel(day)} ${fmtTime(a.min)} ${APPT_PLACES[place].name}`);
}
function calendarMenu() {
  const rows = [];
  for (let k = 0; k < 10; k++) {
    const day = S.day + k, c = calendar(day), items = [];
    for (const e of EVENTS) if (e.m === c.month && e.dom === undefined && e.d === c.dom) items.push(`${e.icon} ${e.name}`);
    for (const a of S.appts) if (a.day === day && a.status === 'set') items.push(`💌 ${fmtTime(a.min)} ${APPT_PLACES[a.place].name} <button class="mini" data-cancel="${a.id}">취소</button> <button class="mini" data-re="${a.id}">미루기</button>`);
    if (S.wedding === day) items.push('💒 결혼식');
    if (S.rel.flags.married && S.rel.marriedDay && (day - S.rel.marriedDay) % 120 === 0 && day > S.rel.marriedDay) items.push('💍 결혼기념일');
    rows.push(`<li><b>${c.month}/${c.dom}</b> ${DOW[(day - 1) % 7]} ${k === 0 ? '<small>오늘</small>' : ''}<div>${items.join('<br>') || '<span class="muted">—</span>'}</div></li>`);
  }
  const hist = S.appts.filter(a => a.status !== 'set').slice(-5).reverse().map(a => `<li>${dateLabel(a.day)} ${APPT_PLACES[a.place].name} — ${{ met: '만남 ✔', late: '늦게 만남', missed: '못 만남', cancel: '취소' }[a.status]}</li>`).join('');
  openPanel('📅 약속 · 달력', `<ul class="cal">${rows.join('')}</ul>${hist ? `<h4>지난 약속</h4><ul class="req">${hist}</ul>` : ''}<p class="psub">약속은 형사님 메뉴의 「약속 잡기」에서 정해요. 약속 시간이 되면 형사님이 그 장소로 가서 기다려요.</p>`, (body) => {
    body.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => { const a = S.appts.find(x => x.id === b.dataset.cancel); a.status = 'cancel'; qSet('appt_' + a.id, { state: 'CANCELLED' }); addAff(-1); memRecent('appt', '약속을 취소했다'); toast('약속을 취소했어요. 형사님이 조금 아쉬워해요'); calendarMenu(); });
    body.querySelectorAll('[data-re]').forEach(b => b.onclick = () => { const a = S.appts.find(x => x.id === b.dataset.re); a.day++; a.resched++; if (a.resched > 1) addAff(-1); toast(`약속을 ${dateLabel(a.day)}로 미뤘어요`); calendarMenu(); });
  });
}
async function apptMeet(a) {
  const d = G.det, P = G.player, c = casualOn(), late = S.min > a.min + 15;
  scriptDet(); d.lookAt(P); P.lookAt(d);
  a.status = late ? 'late' : 'met';
  if (late) { await say('det', 'tease', c ? '아이고, 늦었네~ 그래도 왔으니까 봐준다. 무슨 일 있었던 건 아니지?' : '아이고, 늦으셨네요. 그래도 오셨으니 됐어요. 별일 없으셨죠?'); }
  else await say('det', 'blush', c ? pick(['딱 맞춰 왔네. 나 먼저 와서 기다렸어.', '왔다! 괜히 두리번거리고 있었어.']) : pick(['딱 맞춰 오셨네요. 저 먼저 와서 기다렸어요.', '오셨네요! 괜히 두리번거리고 있었어요.']));
  qSet('appt_' + a.id, { state: 'COMPLETED' });
  memRecent('appt', `${APPT_PLACES[a.place].name} 약속`);
  addAff(late ? 2 : 5, { event: true });
  const AP = APPT_PLACES[a.place];
  if (!S.comp) startCompanion();
  if (AP.photo) { closeDialog(); await photoSession(); return; }
  if (AP.shop) { await say('det', 'smile', c ? '우리 집에 뭐 들일지 같이 보자.' : '어떤 가구가 좋을지 같이 봐요.'); closeDialog(); furnShopMenu(); return; }
  if (AP.fest) { await say('det', 'laugh', c ? '축제 시작이다! 오늘은 순찰 말고 너랑 다닐 거야.' : '축제 시작이에요! 오늘은 같이 다녀요.'); return; }
  if (AP.date && DATES[AP.date]) { if (AP.date === 'islet') { await say('det', 'smile', c ? '자, 배 타러 가자.' : '자, 배 타러 가요.'); closeDialog(); await rideBoat(); } setTimeout(() => doDate(AP.date), 50); }
}
function apptTick() {
  for (const a of S.appts) if (a.status === 'set' && (a.day < S.day || (a.day === S.day && S.min >= a.min + 90))) {
    a.status = 'missed'; qSet('appt_' + a.id, { state: 'FAILED' });
    const r = S.rel, floor = (STAGES[r.stage - 1].need && STAGES[r.stage - 1].need.aff) || 0; r.aff = Math.max(floor, r.aff - 2);
    memRecent('appt', '약속에 못 갔다', { missed: a.id }); S.rel.flags.apptMissed = a.id;
    toast(`💌 ${APPT_PLACES[a.place].name} 약속을 놓쳤어요…`);
  }
}

/* ---------------- 형사님 일정 · 자율 행동 ---------------- */
const _detPlan0 = detPlan;
detPlan = function (min) {
  const r = S.rel;
  if ((S.day <= 2) && !r.flags.met && min >= 8 * 60 + 3 && min < 18 * 60) return { k: 'meet', duty: true };
  const base = _detPlan0(min);
  if (['meet', 'sick', 'wedding', 'waitLighthouse'].includes(base.k)) return base;
  const ap = activeAppt(min); if (ap) return { k: 'appt', ap, duty: false };
  if (G.detAuto && !G.detAuto.done) return { k: 'auto', duty: base.duty, base };
  if (S.weather === 'rain' && base.k === 'patrol') return { k: 'station', duty: true };
  if (S.weather === 'storm' && (base.k === 'patrol' || base.k === 'stroll')) return { k: 'pier', duty: true };
  if (r.flags.married && base.k === 'home') return base;
  return base;
};
Object.assign(TASK_LABEL, { appt: '약속 장소로 가는 중', auto: '마을을 돌아다니는 중' });
const DET_STATE_OF = { meet: 'WALK', home: 'REST', station: 'WORK', patrol: 'PATROL', lunch: 'REST', pier: 'PATROL', stroll: 'WALK', fishing: 'REST', goHome: 'WALK', event: 'PATROL', rivalWalk: 'WALK', sick: 'REST', wedding: 'EVENT_LOCK', waitLighthouse: 'WAIT', pickup: 'WAIT', appt: 'WAIT', auto: 'VISIT' };
function detStateName() {
  const d = G.det; if (G.busy && d.scripted) return 'EVENT_LOCK'; if (d.state === 'comp') return Object.values(S.cases).some(c => c.step === 'investigate') ? 'INVESTIGATE' : 'FOLLOW';
  if (d.talking) return 'TALK'; const k = d.task; if (k === 'home' && S.min >= 22.5 * 60 || k === 'home' && S.min < 6.5 * 60) return 'SLEEP';
  if (k === 'appt' && d.apptArrived) return 'WAIT'; if (k === 'appt') return 'WALK';
  if (k === 'auto' && G.detAuto) return { cat: 'IDLE', chat: 'TALK', work: 'VISIT', home: 'VISIT', fishDuel: 'WALK', dinner: 'WALK' }[G.detAuto.kind] || 'IDLE';
  return DET_STATE_OF[k] || 'IDLE';
}
/* 멀면 버스를 탄다 (순간이동 없이) */
function detTravel(tx, ty) {
  const d = G.det;
  if (d.map !== 'island') return;
  if (d.bus) { if (S.min >= d.bus.until) { const [sx, sy] = d.bus.to; d.x = sx; d.y = sy; d.visible = true; d.bus = null; d.walkTo(tx, ty); } return; }
  const far = Math.hypot(d.x - tx, d.y - ty);
  if (far > 38 && !d.path.length) {
    const stops = MAPS.island.stops; let near = null, nd = 1e9, dest = null, dd = 1e9;
    for (const p of Object.values(stops)) { const a = Math.hypot(p[0] - d.x, p[1] - d.y), b = Math.hypot(p[0] - tx, p[1] - ty); if (a < nd) { nd = a; near = p; } if (b < dd) { dd = b; dest = p; } }
    if (near && dest && near !== dest && dd + nd + 6 < far) {
      if (nd < 1.2) { d.visible = false; d.bus = { until: S.min + 15, to: dest }; return; }
      d.walkTo(near[0], near[1]); return;
    }
  }
  if (!d.path.length && far > 0.4) d.walkTo(tx, ty);
}
const _detUpdate0 = detUpdate;
detUpdate = function (dt) {
  const d = G.det, P = G.player;
  if (!S.rel.flags.met && d.state === 'sched' && d.fmEnterAt && S.min >= d.fmEnterAt && P.map !== 'island' && P.map === fmPos((fmDef() || {}).at || 'plaza')[0]) {
    d.fmEnterAt = null; const m = MAPS[P.map]; d.map = P.map; d.x = m.spawn.door[0]; d.y = m.spawn.door[1]; d.visible = true; d.task = 'meet';
  }
  if (!S.rel.flags.met && d.state === 'sched' && d.map !== 'island' && d.map === P.map) { d.outfit = detDayOutfit('work'); if (!d.talking && !d.path.length && dist(d, P) > 1.6) d.walkTo(P.x, P.y); return; }
  const apNow = activeAppt(S.min); if (apNow) S.rel.daily.autoGreet = true;
  _detUpdate0(dt);
  if (d.state !== 'sched' || d.talking) return;
  const plan = detPlan(S.min);
  if (plan.k === 'appt') {
    const p = apptPos(plan.ap); if (d.map !== 'island') { d.map = 'island'; [d.x, d.y] = detHomeDoor(); }
    d.visible = d.bus ? false : true; d.speedMul = 1.15;
    if (Math.hypot(d.x - p[0], d.y - p[1]) < 1.3) { d.apptArrived = plan.ap.id; d.stop(); d.lookAt(P); if (!d.bubble && Math.random() < dt * 0.06) d.say(pick(['…언제 오려나.', '시계만 보게 되네.', '조금 일찍 왔나?']), 2.6); }
    else detTravel(p[0] + 0.5, p[1]);
  } else if (plan.k === 'auto') autoUpdate(dt);
  else if (plan.k === 'home' && S.rel.flags.married) marriedHomeUpdate(dt);
  else maybeStartAuto(plan);
};
function maybeStartAuto(plan) {
  const r = S.rel, d = G.det, P = G.player;
  if (G.busy || !r.flags.met || d.map !== 'island' || !d.visible || G.detAuto) return;
  if (S.appts.some(a => a.status === 'set' && a.day === S.day && S.min > a.min - 70 && S.min < a.min + 90)) return;
  G._autoT = (G._autoT || 0) + 1; if (G._autoT % 90 !== 0) return;     // 약 1.5초마다 한 번 판단
  const day = S.day, used = (k) => S.surp['auto_' + k] === day;
  const inJob = P.map === 'in_' + JOBS[S.job].place || (JOBS[S.job].place && nearDoor(JOBS[S.job].place, 3));
  const pick1 = [];
  if (plan.k === 'patrol' && r.stage >= 2 && inJob && !used('work')) pick1.push('work');
  if ((plan.k === 'patrol' || plan.k === 'stroll') && !used('cat') && Math.random() < 0.25) pick1.push('cat');
  if ((plan.k === 'patrol' || plan.k === 'stroll') && !used('chat') && Math.random() < 0.3) pick1.push('chat');
  if (plan.k === 'stroll' && r.stage >= 5 && !r.flags.married && P.map === 'in_home' && !used('home') && (S.surp.homeVisitDay || 0) < day - 2) pick1.push('home');
  if (plan.k === 'fishing' && r.stage >= 3 && P.map === 'island' && dist(d, P) < 10 && !used('fishDuel') && (S.surp.duelDay || 0) < day - 1) pick1.push('fishDuel');
  if (plan.k === 'stroll' && r.stage >= 4 && S.min >= 18 * 60 && S.min < 19.3 * 60 && dist(d, P) < 9 && !used('dinner') && !S.comp) pick1.push('dinner');
  if (!pick1.length) return;
  const kind = pick(pick1); S.surp['auto_' + kind] = day;
  let target = null;
  if (kind === 'work') { const b = MAPS.island.buildings.find(x => x.id === JOBS[S.job].place); target = b ? [b.doorTile[0] + 0.5, b.doorTile[1] + 0.5] : null; }
  if (kind === 'cat') { const cat = G.pets.find(a => a.map === 'island' && a.visible && dist(a, d) < 25); target = cat ? [cat.x, cat.y] : null; G._autoCat = cat; }
  if (kind === 'chat') { const v = G.villagers.filter(a => a.map === 'island' && a.visible && dist(a, d) < 18).sort((a, b) => dist(a, d) - dist(b, d))[0]; target = v ? [v.x, v.y] : null; G._autoChat = v; }
  if (kind === 'home') { S.surp.homeVisitDay = day; target = P_('homeDoor'); }
  if (kind === 'fishDuel' || kind === 'dinner') { if (kind === 'fishDuel') S.surp.duelDay = day; target = [P.x, P.y]; }
  if (!target) return;
  G.detAuto = { kind, target, t: 0, phase: 'go' }; d.stop(); d.walkTo(target[0], target[1]);
}
function autoUpdate(dt) {
  const A = G.detAuto, d = G.det, P = G.player; if (!A) return;
  A.t += dt; if (A.t > 60) { endAuto(); return; }
  if (A.kind === 'cat' && G._autoCat) A.target = [G._autoCat.x, G._autoCat.y];
  if (A.kind === 'chat' && G._autoChat) A.target = [G._autoChat.x, G._autoChat.y];
  if (A.kind === 'fishDuel' || A.kind === 'dinner') A.target = [P.x, P.y];
  const dd = Math.hypot(d.x - A.target[0], d.y - A.target[1]);
  if (A.phase === 'go') {
    if (dd > 1.6) { if (!d.path.length) d.walkTo(A.target[0], A.target[1]); return; }
    d.stop(); A.phase = 'do'; A.t2 = 0;
    if (A.kind === 'cat') { d.pose = 'sit'; d.emo('🐱', 3); d.say(pick(['노랑아, 밥은 먹었냐?', '오늘은 안 도망가네?', '쓰담쓰담… 아이고 좋아하네.']), 3.5); if (G._autoCat) { G._autoCat.stop(); G._autoCat.hold = 6; G._autoCat.lookAt(d); } }
    if (A.kind === 'chat' && G._autoChat) { const v = G._autoChat; v.stop(); v.hold = 6; v.lookAt(d); d.lookAt(v); d.say(pick(['안녕하세요~ 별일 없으시죠?', '오늘도 수고 많으세요.', '하하, 그 얘기 저도 들었어요.']), 3); setTimeout(() => { if (v.visible) v.say(pick(VILLAGERS[v.vid] ? VILLAGERS[v.vid].lines.base : ['허허.']), 3); }, 1400); }
    if (A.kind === 'work') { if (P.map === 'island' && dist(d, P) < 5) runEvent(autoWorkVisit); else if (P.map === 'in_' + JOBS[S.job].place) { const m = MAPS[P.map]; d.map = P.map; d.x = m.spawn.door[0]; d.y = m.spawn.door[1]; runEvent(autoWorkVisit); } }
    if (A.kind === 'home') { if (P.map === 'in_home') { const m = MAPS.in_home; d.map = 'in_home'; d.x = m.spawn.door[0]; d.y = m.spawn.door[1]; runEvent(autoHomeVisit); } else endAuto(); }
    if (A.kind === 'fishDuel') runEvent(autoFishDuel);
    if (A.kind === 'dinner') runEvent(autoDinner);
    return;
  }
  A.t2 += dt; if (A.t2 > 7) endAuto();
}
function endAuto() { const d = G.det; if (G.detAuto && G.detAuto.kind === 'cat') d.pose = 'stand'; G.detAuto = null; d.task = null; if (d.map !== 'island' && d.state === 'sched' && !S.rel.flags.married) { const b = MAPS.island.buildings.find(x => 'in_' + x.id === d.map); if (b) { d.map = 'island'; d.x = b.doorTile[0] + 0.5; d.y = b.doorTile[1] + 0.5; } } }
async function autoWorkVisit() {
  const d = G.det, P = G.player, c = casualOn(); scriptDet(); d.walkTo(P.x, P.y); if (d.path.length) d.path.pop(); await waitUntil(() => !d.path.length, 6); d.lookAt(P); P.lookAt(d);
  await say('det', 'smile', c ? pick(['일하는 모습 보러 왔어. 방해 안 할게, 진짜로.', '순찰 돌다가 잠깐 들렀어. 오늘 바빠?']) : pick(['순찰 중에 잠깐 들렀어요. 일하는 모습 보기 좋네요.', '잠깐 인사드리러 왔어요. 바쁘시죠?']));
  if (S.rel.stage >= 4) { const k = season() === 'winter' ? 'hotpack' : 'coffee'; S.inv[k] = (S.inv[k] || 0) + 1; await say('det', 'tease', c ? `이거 마시면서 해. ${ITEMS[k].icon}` : `이거 드시면서 하세요. ${ITEMS[k].icon}`); toast(`${ITEMS[k].icon} ${josa(ITEMS[k].name, '을', '를')} 받았다`); }
  addAff(2); memRecent('visit', '형사님이 일터에 찾아왔다'); endAuto();
}
async function autoHomeVisit() {
  const d = G.det, P = G.player, c = casualOn(); scriptDet(); d.walkTo(P.x, P.y); if (d.path.length) d.path.pop(); await waitUntil(() => !d.path.length, 6); d.lookAt(P); P.lookAt(d);
  await say('det', 'smile', c ? '똑똑~ 지나가다 불 켜져 있길래. 잠깐 집 구경해도 돼?' : '지나가다 불이 켜져 있길래요. 잠깐 구경해도 될까요?');
  const n = await detFurnReact();
  if (!n) await say('det', 'tease', c ? '집 깔끔하네. 나보다 낫다, 하하.' : '집이 깔끔하네요. 저보다 낫네요, 하하.');
  addAff(2); memRecent('visit', '형사님이 집에 놀러 왔다');
  d.walkTo(MAPS.in_home.exit[0] + 0.5, MAPS.in_home.exit[1] - 0.5); await waitUntil(() => !d.path.length, 6);
  endAuto();
}
async function autoFishDuel() {
  const d = G.det, P = G.player, c = casualOn(); scriptDet(); d.lookAt(P); P.lookAt(d);
  await say('det', 'tease', c ? '낚시 대결 할래? 지는 사람이 내일 커피 사기.' : '낚시 대결 하실래요? 지는 사람이 내일 커피 사기.');
  const k = await choose(['좋아, 덤벼!', '다음에']);
  if (k === 0) { await say('det', 'laugh', c ? '부두 끝으로 가자. 오늘은 안 진다.' : '부두 끝으로 가요. 오늘은 안 집니다.'); if (!S.comp) startCompanion(); toast('🎣 부두 끝에서 「같이 낚시」를 해 봐요'); S.rel.daily.duel = true; }
  else await say('det', 'smile', c ? '쫄았구나? 하하, 농담이야.' : '하하, 다음엔 꼭 해요.');
  endAuto();
}
async function autoDinner() {
  const d = G.det, P = G.player, c = casualOn(); scriptDet(); d.lookAt(P); P.lookAt(d);
  await say('det', 'smile', c ? '저녁 먹었어? 안 먹었으면 횟집 가자. 내가 살게.' : '저녁 드셨어요? 안 드셨으면 횟집 가요. 제가 살게요.');
  const k = await choose(['좋아!', '오늘은 괜찮아']);
  if (k === 0) { if (!S.comp) startCompanion(); S.rel.daily.dinnerTreat = true; S.track = null; toast('🍲 포구의 해월 횟집으로 가요 (형사님이 계산해요)'); }
  else await say('det', 'smile', c ? '그래, 다음에 꼭.' : '네, 다음에 꼭요.');
  endAuto();
}
const _interiorAction0 = interiorAction;
interiorAction = async function (act) {
  if (act === 'eat' && S.rel.daily.dinnerTreat && S.comp) { S.rel.daily.dinnerTreat = false; S.money += 9000; await _interiorAction0(act); runEvent(async () => { await say('det', 'laugh', casualOn() ? '오늘은 내가 쐈다. 맛있지?' : '오늘은 제가 샀어요. 맛있죠?'); memRecent('date', '형사님이 저녁을 사 줬다'); }); return; }
  if (act === 'events') { if (festBoardMenu()) return; }
  if (act === 'furnShop') { furnShopMenu(); return; }
  if (act === 'clothes') { openSheet({ title: '👗 해월 옷가게', cols: 2, items: [{ icon: '👚', label: '색 골라 입기', note: '기존 옷', onClick: clothesMenu }, { icon: '💑', label: '커플 · 계절 의상', note: '옷장에 보관', onClick: outfitShopMenu }, { icon: '🚪', label: '옷장 열기', onClick: () => wardrobeMenu('p') }] }); return; }
  return _interiorAction0(act);
};

/* ---------------- 깜짝 이벤트 15종 ---------------- */
const SURPRISES = [
  { id: 'umbrella', st: 3, cd: 5, ok: () => (S.weather === 'rain') && !M.interior && !S.comp, run: async (c) => { await say('det', 'smile', c ? '비 맞고 다니면 감기 걸려. 우산 가져왔어, 같이 쓰자.' : '비 맞으시면 감기 걸려요. 우산 같이 쓰실래요?'); startCompanion(); } },
  { id: 'snack', st: 3, cd: 4, ok: () => S.min >= 17 * 60 && S.min < 18.5 * 60, run: async (c) => { const k = pick(['coffee', 'snack', 'tangerine']); S.inv[k] = (S.inv[k] || 0) + 1; await say('det', 'tease', c ? `퇴근길에 생각나서 샀어. ${ITEMS[k].icon} 받아.` : `퇴근길에 생각나서요. ${ITEMS[k].icon} 받으세요.`); } },
  { id: 'homeWait', st: 5, cd: 6, ok: () => S.min >= 7.3 * 60 && S.min < 9 * 60 && G.player.map === 'island' && curPlace() === 'home', run: async (c) => { await say('det', 'blush', c ? '나왔다! 출근길에 얼굴 보고 가려고 기다렸어.' : '나오셨네요. 출근길에 얼굴 보려고 기다렸어요.'); } },
  { id: 'favFood', st: 4, cd: 6, ok: () => !!memTop('food'), run: async (c) => { const k = memTop('food'); S.inv[k] = (S.inv[k] || 0) + 1; await say('det', 'smile', `너 ${ITEMS[k].name} 좋아하잖아. 늘 먹던 걸로 골랐어. 맞지?`); } },
  { id: 'withCat', st: 2, cd: 7, ok: () => !M.interior, run: async (c) => { const cat = G.pets.find(p => p.vid === 'cheese'); if (cat) { cat.map = G.player.map; [cat.x, cat.y] = nearestWalkable(G.det.x + 1, G.det.y, M); cat.follow = 6; } await say('det', 'laugh', c ? '이 녀석이 자꾸 따라오잖아. 너 보러 가는 거 알았나 봐.' : '이 녀석이 자꾸 따라오네요. 같이 인사하러 왔어요.'); } },
  { id: 'holdHand', st: 5, cd: 3, ok: () => S.comp && !S.hold && G.walkedTogether > 20, run: async (c) => { await say('det', 'blush', '…손 줘. 그냥, 잡고 싶어서.'); S.hold = true; } },
  { id: 'firstDateInvite', st: 5, cd: 25, ok: () => !!S.mem.perm.firstDate && S.min < 16 * 60, run: async (c) => { const k = S.mem.perm.firstDate.k; await say('det', 'smile', `오늘 저녁에 ${DATES[k] ? DATES[k].name : '거기'} 갈래? 우리 첫 데이트 했던 데.`); const a = { id: 'a' + S.day + 'inv', day: S.day, min: 19 * 60, place: { cafe: 'cafe', lighthouse: 'lighthouse', beach: 'promenade', rocks: 'rocks', orchard: 'orchard', islet: 'islet', home: 'home' }[k] || 'cafe', status: 'set', resched: 0, made: S.day }; S.appts.push(a); qSet('appt_' + a.id, { state: 'ACTIVE' }); toast('📅 오늘 19:00 약속이 생겼어요'); } },
  { id: 'flower', st: 4, cd: 8, ok: () => ['spring', 'summer'].includes(season()), run: async (c) => { S.inv.flower = (S.inv.flower || 0) + 1; await say('det', 'blush', c ? '꽃밭 지나다가… 너 생각나서. 꺾은 거 아니고 산 거다?' : '꽃밭 지나다가 생각나서요. 꺾은 거 아니고 산 거예요.'); } },
  { id: 'praise', st: 2, cd: 2, ok: () => S.rel.daily.styleChanged, run: async (c) => { await say('det', 'surprise', c ? '어, 옷 바꿨네? 잘 어울린다. 진짜로.' : '어, 옷 바꾸셨네요? 잘 어울려요. 진짜로.'); } },
  { id: 'coupleLook', st: 5, cd: 6, ok: () => Object.keys(OUTFITS).some(k => OUTFITS[k].couple && S.ward.p[k]) && !(S.style.clothes || '').startsWith('w_couple'), run: async (c) => { const k = Object.keys(OUTFITS).find(x => OUTFITS[x].couple && S.ward.p[x]); await say('det', 'tease', `우리 ${OUTFITS[k].name} 있잖아. 오늘 그거 맞춰 입을래?`); const i = await choose(['좋아, 맞춰 입자!', '다음에']); if (i === 0) { applyStyle(Object.assign({}, S.style, { clothes: 'w_' + k })); S.wear.d = k; G.det.outfit = detDayOutfit('casual'); await say('det', 'laugh', '하하, 누가 봐도 커플이다.'); memPref('outfit', k); } } },
  { id: 'photoAsk', st: 3, cd: 5, ok: () => S.min >= 17 * 60 && !M.interior && (S.day - (S.lastPhotoDay || -99)) >= 5, run: async (c) => { await say('det', 'smile', c ? '우리 사진 부스 가서 한 장 찍을래? 요즘 안 찍었잖아.' : '사진 부스에서 한 장 찍을래요? 요즘 안 찍었잖아요.'); const i = await choose(['좋아!', '다음에']); if (i === 0) { if (!S.comp) startCompanion(); S.track = null; toast('📸 카페 옆 네컷사진 부스로 가요'); S.rel.daily.photoAsk = true; } } },
  { id: 'furnGift', st: 5, cd: 999, ok: () => !S.paid.furnGift, run: async (c) => { payOnce('furnGift', () => furnGive('catBed')); await say('det', 'tease', '이거 너희 집에 두라고. 노랑이 놀러 오면 앉으라고 산 방석이야. …핑계지만.'); toast('🛋 「고양이 방석」을 받았다 — 가구 보관함'); } },
  { id: 'festGift', st: 4, cd: 30, ok: () => !!festivalSoon(0), run: async (c) => { S.inv.candy = (S.inv.candy || 0) + 1; await say('det', 'smile', c ? '축제 기념품. 줄 서서 샀다? 하하.' : '축제 기념품이에요. 줄 서서 샀어요.'); } },
  { id: 'caseDinner', st: 3, cd: 2, ok: () => !!S.rel.daily.caseSolved, run: async (c) => { await say('det', 'laugh', c ? '사건도 풀었으니 밥 먹으러 가자. 오늘은 내가 산다.' : '사건도 풀었으니 식사하러 가요. 오늘은 제가 살게요.'); S.rel.daily.dinnerTreat = true; if (!S.comp) startCompanion(); } },
  { id: 'anniv', st: 8, cd: 100, ok: () => S.rel.flags.married && S.rel.marriedDay && S.day > S.rel.marriedDay && (S.day - S.rel.marriedDay) % 120 === 0, run: async () => anniversaryMarried() },
];
function surpriseTick() {
  const r = S.rel, d = G.det, P = G.player;
  if (!r.flags.met || G.busy) return false;
  if (!d.visible || d.map !== P.map || dist(d, P) > 7 || d.state === 'script') return false;
  G._surpT = (G._surpT || 0) + 1; if (G._surpT % 200 !== 0) return false;
  const now = S.day * 1440 + S.min; if (now - (S.surp._last || -1e9) < 150) return false;
  if (S.appts.some(a => a.status === 'set' && a.day === S.day && S.min > a.min - 70 && S.min < a.min + 90)) return false;
  for (const s of SURPRISES) {
    if (r.stage < s.st) continue; const last = S.surp[s.id]; if (last != null && S.day - last < s.cd) continue;
    let ok = false; try { ok = s.ok(); } catch (e) { ok = false; }
    if (!ok || Math.random() > 0.5) continue;
    S.surp[s.id] = S.day; S.surp._last = now;
    runEvent(async () => { scriptDet(); if (dist(d, P) > 1.8) { d.walkTo(P.x, P.y); if (d.path.length) d.path.pop(); await waitUntil(() => !d.path.length, 6); } d.lookAt(P); P.lookAt(d); await s.run(casualOn()); addAff(2); memRecent('surprise', s.id); });
    return true;
  }
  return false;
}
/* 연계 이벤트 5 — 결혼기념일 */
async function anniversaryMarried() {
  const yrs = Math.round((S.day - S.rel.marriedDay) / 120);
  await say('det', 'blush', `여보, 오늘 무슨 날인지 알지? 우리 결혼기념일. ${yrs}년 됐다.`);
  await say('det', 'smile', '선물 준비했어. 그리고… 저녁에 사진 한 장 찍으러 가자. 기념일 프레임으로.');
  S.inv.flower = (S.inv.flower || 0) + 1;
  if (!S.frames.includes('anniv')) { S.frames.push('anniv'); toast('🖼 「결혼기념일」 프레임 해금!'); }
  payOnce('annivFrame' + yrs, () => furnGive('frame4'));
  memRecent('anniv', `결혼기념일 ${yrs}년`); await addAlbum(`결혼기념일 ${yrs}년`, 'married');
  const i = await choose(['지금 찍으러 가자!', '저녁에 가자']);
  if (i === 0) { if (!S.comp) startCompanion(); toast('📸 네컷사진 부스로 가요 (결혼기념일 프레임)'); }
}
/* 연계 이벤트 2 — 축제 커플룩 */
async function festCoupleLook() {
  const k = Object.keys(OUTFITS).find(x => OUTFITS[x].couple && S.ward.p[x]) || (S.ward.p.festival ? 'festival' : null); if (!k) return false;
  await say('det', 'tease', `오늘 축제잖아. 우리 ${OUTFITS[k].name} 맞춰 입고 갈래?`);
  const i = await choose(['맞춰 입자!', '그냥 갈래']);
  if (i === 0) { applyStyle(Object.assign({}, S.style, { clothes: 'w_' + k })); S.wear.d = k; G.det.outfit = detDayOutfit('casual'); await say('det', 'laugh', '좋다. 오늘 섬 사람들 다 우리만 보겠네.'); S.rel.daily.festCouple = true; addRumor('photo', {}, { key: 'festcouple' + S.day }); }
  return true;
}
/* 연계 이벤트 4 — 보물로 꾸민 집에 대한 형사님 반응 */
async function treasureHomeReact() {
  S.rel.flags.treasureDecorReact = false;
  await say('det', 'surprise', casualOn() ? '어, 그 보물 상자 여기 놨구나! 하하, 우리 집이 박물관 됐네.' : '그 보물 상자 여기 두셨네요! 집이 박물관 같아요.');
  await say('det', 'smile', casualOn() ? '나중에 우리 애들한테 이거 엄마 아빠가 찾은 거라고 자랑해야지. …아, 너무 앞서갔나?' : '이 섬에 이런 보물이 있었다니. 같이 찾아서 더 뜻깊네요.');
  addAff(4, { event: true }); memRecent('treasure', '보물로 집을 꾸몄다');
}

/* ---------------- 이벤트 우선순위 ---------------- */
checkEvents = function () {
  if (G.busy || paused() || G.working || G.fishing || G.decor) return;
  const d = G.det, P = G.player, r = S.rel, pl = curPlace(), dd = dist(d, P);
  // 0. 첫 만남 (한 번만)
  if (!r.flags.met) { if (d.visible && d.map === P.map && dd < 2.2) runEvent(firstMeeting); return; }
  const nearP = (k, rr) => P.map === 'island' && Math.hypot(P.x - P_(k)[0], P.y - P_(k)[1]) < rr;
  const sameMap = d.visible && d.map === P.map;
  // 1. 주요 스토리
  if (sameMap) {
    if (!r.flags.engaged && r.daily.proposal && S.min >= 17.5 * 60 && S.min < 21.5 * 60 && dd < 2.5 && (d.task === 'waitLighthouse' || (S.comp && nearP('lighthouse', 3.5)))) { runEvent(proposalEvent); return; }
    if (!r.flags.married && S.wedding === S.day && S.min >= 9 * 60 && S.min < 18 * 60 && dd < 3 && (d.task === 'wedding' || (S.comp && nearP('beach', 4)))) { runEvent(weddingEvent); return; }
    if (S.comp && confessReady() && ['lighthouse', 'pier', 'observatory', 'fishing', 'beach', 'coast', 'pavilion', 'promenade', 'h_view', 'h_secret', 'h_forest'].includes(pl) && !P.moving && dd < 2) { runEvent(confessionEvent); return; }
    const bv = banmalDue(); if (bv && !P.moving) { runEvent(() => banmalEvent(bv)); return; }
  }
  // 2. 진행 중인 수사 (단서 · 탐문은 플레이어가 직접) / 3. 확정된 약속
  const ap = activeAppt(S.min);
  if (ap && sameMap && d.apptArrived === ap.id && dd < 2.6) { d.apptArrived = null; runEvent(() => apptMeet(ap)); return; }
  // 4. 계절 축제
  const ev = activeEvent();
  if (ev && ev.map === P.map && !r.daily.eventsSeen[ev.id] && Math.hypot(P.x - P_(ev.at)[0], P.y - P_(ev.at)[1]) < 3.2) {
    const fn = festNow();
    runEvent(async () => { if (fn && fn.st.joined && S.rel.stage >= 5 && !r.daily.festCouple && sameMap && dd < 6) await festCoupleLook(); await seasonEvent(ev); if (fn && fn.ev === ev.id && !fn.st.done) await festivalRun(fn); });
    return;
  }
  if (!sameMap) return;
  // 5. 직업 · 관계 이벤트 (기존)
  if (d.task === 'pickup' && dd < 2.2 && !r.daily.pickup) { runEvent(pickupEvent); return; }
  if (S.comp) {
    if (r.stage >= 2 && !r.flags.firstWalk && G.walkedTogether >= 30 && ['pier', 'beach', 'coast', 'lighthouse', 'fishing', 'observatory', 'rocks', 'promenade'].includes(pl) && !P.moving) { runEvent(firstWalkEvent); return; }
    if (r.stage >= 3 && (S.weather === 'rain' || S.weather === 'snow') && !r.flags.rain && G.rainWalk >= 12) { runEvent(rainEvent); return; }
    if (r.stage >= 4 && !r.flags.named && !P.moving && dd < 2.2) { runEvent(nameEvent); return; }
    if (r.stage >= 5 && !r.flags.nickname && loverDays() >= 3 && S.min >= 16 * 60 && !P.moving && dd < 2.2) { runEvent(nicknameEvent); return; }
    for (const n of [50, 100]) if (r.flags.lovers && loverDays() >= n && !r.flags['anni' + n] && !P.moving && dd < 2.2) { runEvent(() => anniversaryEvent(n)); return; }
    if (r.stage === 1 && !P.moving && pl && GUIDE[pl] && !r.guide[pl] && dd < 3) { r.guide[pl] = true; d.lookAt(P); d.say(GUIDE[pl], 5); addAff(1, { quiet: true }); return; }
  } else {
    if (r.stage >= 3 && !r.flags.pierWait && d.task === 'fishing' && d.pose === 'fish' && dd < 2.5) { runEvent(pierWaitEvent); return; }
    if (r.stage >= 2 && !r.flags.night && S.min >= 21 * 60 && dd < 3 && !r.flags.married) { runEvent(nightEvent); return; }
  }
  // 6. 커플 촬영 · 집 · 보물 연계
  if (r.flags.treasureDecorReact && P.map === 'in_home' && dd < 4) { runEvent(treasureHomeReact); return; }
  if (P.map === 'in_home' && d.map === 'in_home' && S.furn.placed.some(f => !S.furnSeen[f.id]) && S.rel.flags.married && !G._furnReactT) { G._furnReactT = 1; runEvent(async () => { await detFurnReact(); G._furnReactT = 0; }); return; }
  if (r.flags.apptMissed && dd < 2.2) { const id = r.flags.apptMissed; r.flags.apptMissed = null; runEvent(async () => { await say('det', 'sad', casualOn() ? '어제… 나 좀 기다렸다? 무슨 일 있었던 건 아니지? 다음엔 꼭 보자.' : '지난번에 좀 기다렸어요. 별일 없으셨죠? 다음엔 꼭 봬요.'); void id; }); return; }
  // 7. 형사님 깜짝 이벤트
  if (surpriseTick()) return;
  if (G.forceEndComp) { G.forceEndComp = false; if (S.comp && !r.flags.married) runEvent(async () => { await say('det', 'smile', casualOn() ? '벌써 열 시네. 오늘은 여기까지. 집에 들어가는 거 보고 갈게.' : '벌써 열 시네요. 오늘은 여기까지. 집에 들어가는 거 보고 갈게요.'); closeDialog(); endCompanion(true); }); }
};

/* ---------------- 형사님 메뉴 확장 ---------------- */
const _detMenu0 = detMenu;
detMenu = function () {
  const r = S.rel, d = G.det;
  if (!r.flags.met) { runEvent(firstMeeting); return; }
  const caseRep = Object.entries(S.cases).find(([, st]) => st.step === 'report');
  if (caseRep) { runEvent(() => caseConsult(caseRep[0])); return; }
  const ap = activeAppt(S.min); if (ap && d.apptArrived === ap.id) { d.apptArrived = null; runEvent(() => apptMeet(ap)); return; }
  _detMenu0();
  if (!G.sheet) return;
  const body = $('#sheetBody'), add = (icon, label, note, fn, lock) => { const b = document.createElement('button'); b.className = 'sitem' + (lock ? ' locked' : ''); b.innerHTML = `<span class="si-icon">${lock ? '🔒' : icon}</span><span class="si-label">${label}</span>${note ? `<span class="si-note">${note}</span>` : ''}`; b.onclick = () => { Sound.sfx('tap'); if (lock) { toast(lock); return; } closeSheet(); fn(); }; body.appendChild(b); };
  add('📅', '약속 잡기', '날짜·시간·장소', () => runEvent(apptMenu), r.stage < 3 ? '「친한 사이」가 되면 약속을 잡을 수 있어요' : null);
  add('📸', '사진 찍자', '네컷 부스', () => { if (dist(G.player, { x: P_('booth')[0], y: P_('booth')[1], map: 'island' }) < 3) runEvent(boothAction); else runEvent(async () => { await say('det', 'smile', casualOn() ? '좋아, 부스로 가자.' : '좋아요, 부스로 가요.'); if (!S.comp) startCompanion(); toast('📸 카페 옆 네컷사진 부스로 가요'); }); }, r.stage < 3 ? '「친한 사이」부터 함께 찍을 수 있어요' : null);
  add('💭', '추억 이야기', '기억 회상', () => runEvent(async () => { const m = memoryLine(); await say('det', 'smile', m || (casualOn() ? '음… 우리 아직 추억이 별로 없네. 오늘 하나 만들까?' : '아직 함께한 추억이 많지 않네요. 하나 만들어 봐요.')); }), r.stage < 3 ? '조금 더 친해지면 열려요' : null);
};

/* ---------------- 상황별 행동 버튼 ---------------- */
const _computeAction0 = computeAction;
computeAction = function () {
  const P = G.player, d = G.det;
  if (G.working || G.fishing) return G.ctxAction;
  if (P.seatFurn) return { label: '일어나기', icon: '🧍', fn: () => { const o = P.seatFurn; P.seatFurn = null; P.pose = 'stand'; const [x, y] = nearestWalkable(o.x + 0.5, o.y + 1.5, M); P.x = x; P.y = y; } };
  // 단서 · 땅 파기 · 숨은 길
  const clue = G.tempObjs.find(o => o.clue && (o.map || 'island') === P.map && Math.hypot(P.x - o.x - 0.5, P.y - o.y - 0.5) < 1.3);
  if (clue) return { label: '조사하기', icon: '🔍', hot: true, fn: () => runEvent(() => inspectClue(clue)) };
  if (M.hidden) {
    const dig = M.objects.find(o => o.kind === 'dig' && Math.hypot(P.x - o.x - 0.5, P.y - o.y - 0.5) < 1.3); if (dig) return { label: '땅 파기', icon: '⛏', hot: true, fn: () => runEvent(() => digAt(dig)) };
    if (M.exitTile && Math.hypot(P.x - M.exitTile[0] - 0.5, P.y - M.exitTile[1] - 0.5) < 1.2) return { label: '돌아가기', icon: '↩', fn: leaveHidden };
  }
  if (P.map === 'island' && S.treasure.deduced && !S.treasure.dug && Math.hypot(P.x - P_('digSpot')[0], P.y - P_('digSpot')[1]) < 1.5) return { label: '보물 파기', icon: '⛏', hot: true, fn: () => runEvent(treasureDig) };
  const portal = (M.portals || []).find(p => portalVisible(p) && Math.hypot(P.x - p.x - 0.5, P.y - p.y - 0.5) < 1.3);
  if (portal) return { label: HIDDEN_DEFS[portal.id].name.slice(0, 7), icon: HIDDEN_DEFS[portal.id].icon, hot: true, fn: () => enterHidden(portal) };
  if (M.id === 'island' && Math.hypot(P.x - P_('booth')[0], P.y - P_('booth')[1]) < 0.9) return { label: '네컷사진', icon: '📸', hot: S.rel.stage >= 3, fn: () => runEvent(boothAction) };
  const a = _computeAction0();
  if (a && a.label !== '나가기' && a.icon !== '🚪') { /* 사람 · 낚시 등 기존 우선 */ }
  if (d.visible && d.map === P.map && dist(d, P) < 1.9) return a;
  for (const v of G.visitors) if (v.visible && v.map === P.map && dist(v, P) < 1.6) return { label: '말 걸기', icon: VISITOR_TYPES[v.vt].icon, fn: () => runEvent(() => visitorTalk(v)) };
  if (M.id === 'island' && Math.hypot(P.x - P_('ticket')[0], P.y - P_('ticket')[1]) < 1.2) return { label: '배 시간표', icon: '⛴', fn: ferryInfo };
  if (a && a.label === '나가기' && M.exit && Math.floor(P.x) === M.exit[0] && Math.floor(P.y) === M.exit[1]) return a;
  if (M.id === 'in_home') {
    const fo = M.objects.find(o => o.kind === 'furn' && FURN[o.k] && FURN[o.k].act && !(o.act && o.act !== FURN[o.k].act) && footTiles(o.k, o.x, o.y, o.rot || 0).some(([x, y]) => Math.hypot(P.x - x - 0.5, P.y - y - 0.5) < 1.25));
    if (fo && M.id === 'in_home') { const L = { sleep: '잠자기', sit: '앉기', eat: '식사하기', cook: '요리하기', read: '책 읽기', wardrobe: '옷장', photo: '사진 보기', tv: 'TV 보기' }[FURN[fo.k].act]; const I = { sleep: '🛏', sit: '🪑', eat: '🍽', cook: '🍳', read: '📖', wardrobe: '👗', photo: '🖼', tv: '📺' }[FURN[fo.k].act]; return { label: L, icon: I, fn: () => furnAction(fo) }; }
  }
  return a;
};
function ferryInfo() {
  const f = ferryPlan(), fp = ferryPhase(S.min);
  runEvent(async () => {
    await say('narr', '', `⛴ 해월도 여객선 — 09:00 입항 · 14:00 입항 · 17:00 출항\n오늘: ${f.cancel ? '기상 악화로 결항' : { arriving: '입항 중', docked: '정박 중', departing: '출항 중', away: '운항 중' }[fp.phase]} · 다음: ${nextFerryText()}`);
    if (G.visitors.length) await say('narr', '', `지금 섬에 온 손님: ${G.visitors.map(v => VISITOR_TYPES[v.vt].name).join(', ')}`);
  });
}

/* ---------------- 상호작용 훅 ---------------- */
const _interactWith0 = interactWith;
interactWith = function (a) {
  if (a.isVisitor) { runEvent(() => { G._talkTo = a.id; return visitorTalk(a); }); return; }
  if (a.isVillager || a.isStaff) {
    runEvent(async () => {
      G._talkTo = a.id; a.talking = true; a.stop(); a.lookAt(G.player); G.player.lookAt(a);
      if (await caseTalk(a)) { closeDialog(); a.talking = false; return; }
      if (a.isVillager && await festDonate(a)) { closeDialog(); a.talking = false; return; }
      const rm = a.isVillager && rumorFor(a.vid);
      if (rm && Math.random() < 0.6) { rm.told.push(a.vid); await say(a.id, 'laugh', rm.text); }
      if (a.isVillager && !S.rel.daily['vf_' + a.vid] && villagerFavorTalk) { if (await villagerFavorTalk(a)) { closeDialog(); a.talking = false; return; } }
      a.talking = false;
      if (a.isStaff) await staffTalk(a); else await villagerTalk(a);
    });
    return;
  }
  _interactWith0(a);
};
/* 반복 퀘스트: 일일 낚시 의뢰 · 주민 부탁 */
QDEF.daily_fish = { title: '🎣 박 씨 아저씨의 일일 낚시 의뢰', kind: 'repeat', view: (q) => q.day !== S.day ? { hidden: true } : { desc: '오늘 횟집에 넣을 물고기가 모자라대요.', goal: '물고기 2마리 낚기', prog: [Math.min(2, (S.rel.daily.fish || 0)), 2], target: { map: 'island', x: P_('pierEnd')[0], y: P_('pierEnd')[1] }, place: '부두 낚시터', reward: '2,000원 (하루 한 번)' } };
QDEF.v_favor = { title: '📝 주민 부탁', kind: 'repeat', view: (q) => q.day !== S.day ? { hidden: true } : { desc: `${NPC_LOOKS[q.who] ? NPC_LOOKS[q.who].name : '주민'}의 부탁: ${ITEMS[q.item].icon} ${ITEMS[q.item].name} 가져다주기`, goal: `${josa(ITEMS[q.item].name, '을', '를')} 들고 다시 말 걸기`, prog: [Math.min(1, S.inv[q.item] || 0), 1], target: (() => { const a = G.actors.find(x => x.id === q.who); return a ? { map: a.map, x: a.x, y: a.y } : null; })(), reward: '1,500원 · 평판 (하루 한 번)' } };
QDEF.v_photo = { title: '📸 사진작가의 노을', view: (q) => q.day !== S.day ? { hidden: true } : { desc: '사진작가가 등대 노을 명당을 알려 달래요.', goal: '17시 이후 등대 벤치에 가기', target: { map: 'island', x: P_('lighthouse')[0], y: P_('lighthouse')[1] }, place: '등대', reward: '등대 프레임' } };
QDEF.v_request = { title: '✉️ 특별 의뢰 — 소라 한 개', view: (q) => q.day !== S.day ? { hidden: true } : { desc: '의뢰인의 어머니가 해월도 소라를 보고 싶어 하신대요.', goal: '소라를 구해 의뢰인에게 주기 (16:30 전)', prog: [Math.min(1, S.inv.conch || 0), 1], reward: '4,000원' } };
QDEF.job = { title: () => `${JOBS[S.job].icon} ${JOBS[S.job].name}의 하루`, view: (q) => q.state === 'COMPLETED' ? { hidden: true } : { desc: { doctor: '보건지소 어르신들을 돌봐 드려요.', teacher: '아이들 수업을 맡아요.', traveler: '섬 곳곳을 여행 일지에 기록해요.', cafe: '카페 쉼터를 영업해요.', haenyeo: '바다에 나가 물질을 해요.' }[S.job], goal: `${JOBS[S.job].act} 5번`, prog: [Math.min(5, S.stats.works), 5], reward: '10,000원 · 직업 경험치' } };
async function villagerFavorTalk(a) {
  const q = qGet('v_favor');
  if (q.day === S.day && q.who === a.id && qIsOpen(q)) {
    if ((S.inv[q.item] || 0) > 0) { S.inv[q.item]--; await say(a.id, 'laugh', '아이고, 가져왔구나! 고마워라.'); if (!qRepeatPaid('v_favor', 'd' + S.day)) { S.money += 1500; S.rep += 1; floatText(G.player, '+1,500원'); } S.stats.favors++; if (S.stats.favors >= 3) treasureFrag('favor'); qSet('v_favor', { state: 'COMPLETED' }); S.rel.daily['vf_' + a.vid] = true; return true; }
    return false;
  }
  if (q.day !== S.day && Math.random() < 0.35 && S.day >= 2) {
    const item = pick(['coffee', 'tangerine', 'snack', 'hanky', 'candy']);
    await say(a.id, 'smile', `아, 마침 잘 만났다. 혹시 ${ITEMS[item].name} 하나만 구해다 줄 수 있어? 슈퍼에 있을 거야.`);
    const c = await choose(['네, 구해 올게요', '오늘은 어려워요']);
    if (c === 0) { Object.assign(q, { day: S.day, who: a.id, item }); qSet('v_favor', { state: 'ACTIVE' }); }
    S.rel.daily['vf_' + a.vid] = c !== 0; return true;
  }
  return false;
}
/* 활동 훅 */
const _endFish0 = endFish;
endFish = async function (ok) {
  const before = Object.keys(S.dex).length;
  await _endFish0(ok);
  if (!ok) return;
  S.stats.fish++; S.rel.daily.fish = (S.rel.daily.fish || 0) + 1;
  if (S.stats.fish >= 5) treasureFrag('fish');
  if (Object.keys(S.dex).length > before) { const last = Object.entries(S.dex).pop(); if (last && FISH[last[0]] && FISH[last[0]].rare) addRumor('fish', { fish: FISH[last[0]].name }, { key: 'fish' + last[0] }); }
  const q = qGet('daily_fish'); if (q.day === S.day && qIsOpen(q) && S.rel.daily.fish >= 2) { if (!qRepeatPaid('daily_fish', 'd' + S.day)) { S.money += 2000; toast('🎣 일일 낚시 의뢰 완료! +2,000원'); } qSet('daily_fish', { state: 'COMPLETED' }); }
  if (S.rel.daily.duel && S.comp && !S.rel.daily.duelDone) { S.rel.daily.duelDone = true; const win = Math.random() < 0.55; runEvent(async () => { await say('det', win ? 'sad' : 'laugh', win ? (casualOn() ? '…졌다. 내일 커피 두 캔 산다.' : '…제가 졌네요. 내일 커피 살게요.') : (casualOn() ? '하하, 내가 이겼다! 내일 커피 잘 마실게.' : '하하, 제가 이겼네요!')); addAff(2); memRecent('act', '낚시 대결'); }); }
  if (S.track === null && Math.random() < 0) void 0;
};
const _gatherShell0 = gatherShell;
gatherShell = function () { const before = S.rel.daily.shells; _gatherShell0(); setTimeout(() => { if (S.rel.daily.shells > before) { S.stats.shells++; if (S.stats.shells >= 8) treasureFrag('shell'); } }, 1500); };
const _doWork0 = doWork;
doWork = function () { const w = S.works; _doWork0(); setTimeout(() => { if (S.works > w || G.working) { S.stats.works++; if (S.stats.works >= 5) { const q = qGet('job'); if (q.state !== 'COMPLETED') { payOnce('jobQuest', () => { S.money += 10000; S.jobExp += 2; }); qSet('job', { state: 'COMPLETED' }); addRumor('job', {}, { key: 'job' + S.job }); } } updateQuestBtn(); } }, 300); };
const _favor0 = favor;
favor = async function () { const had = !!S.rel.favor; await _favor0(); if (had && !S.rel.favor) { S.stats.favors++; if (S.stats.favors >= 3) treasureFrag('favor'); } };
const _becomeLovers0 = becomeLovers;
becomeLovers = async function (byPlayer) { await _becomeLovers0(byPlayer); memPerm('confess', { by: byPlayer ? 'me' : 'det' }); memPerm('lovers', {}); addRumor('lovers', {}, { key: 'lovers' }); S.rel.flags.banmal = true; if (payOnce('coupleTee', () => giveOutfit('coupleTee'))) toast('💑 커플 티셔츠가 옷장에 들어갔어요'); };
const _proposalEvent0 = proposalEvent;
proposalEvent = async function () { await _proposalEvent0(); if (S.rel.flags.engaged) { memPerm('propose', {}); addRumor('engaged', {}, { key: 'engaged' }); if (payOnce('coupleHood', () => giveOutfit('coupleHood'))) toast('🧸 커플 후드티가 옷장에 들어갔어요'); } };
const _weddingEvent0 = weddingEvent;
weddingEvent = async function () { await _weddingEvent0(); if (S.rel.flags.married) { memPerm('married', {}); addRumor('married', {}, { key: 'married' }); S.rel.marriedDay = S.rel.marriedDay || S.day; giveOutfit('weddingSet'); if (!S.frames.includes('anniv')) S.frames.push('anniv'); } };
const _rideBoat0 = rideBoat;
rideBoat = async function () { await _rideBoat0(); if (G.player.map === 'islet') { memPref('place', 'islet'); if (S.rel.stage >= 3 && !S.cases.islet) caseDiscover('islet'); } };
const _styleReaction0 = styleReaction;
styleReaction = function () { S.rel.daily.styleChanged = true; _styleReaction0(); };

/* ---------------- 메뉴 묶음 ---------------- */
mainMenu = function () {
  const grp = (title, items) => openSheet({ title, cols: 2, items, onClose: null });
  openSheet({ title: '메뉴', cols: 3, sub: `<div class="relneed">${S.name} · ${JOBS[S.job].name} Lv.${S.jobLv} · 마을 평판 ${S.rep}<br>${calendar(S.day).year}년째 · <span id="saveInfo">자동 저장 ${S.savedAt ? new Date(S.savedAt).toLocaleTimeString('ko-KR') : ''}</span></div>`, items: [
    { icon: '💗', label: '관계', note: '형사님·약속', onClick: () => grp('💗 관계', [
      { icon: '🕵️', label: '형사님 정보', onClick: () => openRel('profile') }, { icon: '📅', label: '약속 · 달력', onClick: calendarMenu }, { icon: '💭', label: '기억', onClick: memoryMenu },
      { icon: '💌', label: '데이트 장소', onClick: () => openRel('acts') }, { icon: '💑', label: '커플 의상', onClick: () => wardrobeMenu('d') }, { icon: '✏️', label: '형사님 이름', onClick: renameDet }]) },
    { icon: '🏘', label: '마을', note: '배·소문·축제', onClick: () => grp('🏘 마을', [
      { icon: '⛴', label: '여객선', onClick: ferryInfo }, { icon: '🧳', label: '방문객', onClick: visitorMenu }, { icon: '🗣', label: '소문', onClick: rumorMenu }, { icon: '🎪', label: '축제', onClick: festMenu }]) },
    { icon: '📒', label: '수첩', note: '수사·보물', onClick: () => grp('📒 수첩', [
      { icon: '🔎', label: '수사 수첩', onClick: () => notebookMenu('case') }, { icon: '🧭', label: '탐험 수첩', onClick: () => notebookMenu('explore') }, { icon: '🗺', label: '보물지도', onClick: () => notebookMenu('treasure') }, { icon: '🐟', label: '물고기 도감', onClick: dexMenu }]) },
    { icon: '📔', label: '추억', note: '앨범·네컷', onClick: () => grp('📔 추억', [
      { icon: '📔', label: '앨범', onClick: () => albumMenu() }, { icon: '🎞', label: '네컷사진', onClick: () => albumMenu({ cat: 'fourcut' }) }, { icon: '💍', label: '기념일', onClick: annivMenu }]) },
    { icon: '🏠', label: '집', note: '가구·옷장', onClick: () => grp('🏠 집', [
      { icon: '🛋', label: '가구 배치', note: '집 안에서', onClick: () => { if (M.id === 'in_home') openDecor(); else toast('집 안에서 「꾸미기」를 눌러요'); } }, { icon: '🛒', label: '가구점 카탈로그', onClick: () => furnShopMenu() }, { icon: '🏗', label: '집 확장', onClick: expandMenu },
      { icon: '👗', label: '옷장', onClick: () => wardrobeMenu('p') }, { icon: '🖼', label: '사진 액자', onClick: () => albumMenu({ cat: 'fourcut' }) }, { icon: '🏡', label: '공동생활', onClick: homeLifeMenu }]) },
    { icon: '🎒', label: '소지품', onClick: invMenu },
    { icon: S.settings.music ? '🎵' : '🔇', label: S.settings.music ? '음악 끄기' : '음악 켜기', onClick: () => { S.settings.music = !S.settings.music; Sound.init(); Sound.setOn('music', S.settings.music); save(); } },
    { icon: S.settings.sfx ? '🔊' : '🔈', label: S.settings.sfx ? '효과음 끄기' : '효과음 켜기', onClick: () => { S.settings.sfx = !S.settings.sfx; Sound.init(); Sound.setOn('sfx', S.settings.sfx); save(); } },
    { icon: '❓', label: '도움말', onClick: () => { G.screen = true; $('#help').classList.remove('hidden'); } },
    { icon: '💾', label: '지금 저장', onClick: () => { toast(save() ? '💾 저장했어요' : '저장 공간이 부족해요'); } },
    { icon: '🔄', label: '처음부터', onClick: () => openSheet({ title: '처음부터 다시 할까요?', sub: '<div class="relneed">저장된 관계 · 추억 앨범 · 소지품이 모두 지워져요. 되돌릴 수 없어요.</div>', cols: 2, items: [
      { icon: '🗑', label: '지우고 처음부터', onClick: () => { G.started = false; try { localStorage.removeItem(SAVE_KEY4); localStorage.removeItem(SAVE_KEY); } catch (e) { } location.reload(); } },
      { icon: '↩', label: '계속 플레이', onClick: () => { } }] }) },
  ] });
};
function memoryMenu() {
  const P = S.mem.perm, L = { firstMeet: '첫 만남', banmal: '말 놓은 날', firstDate: '첫 데이트', confess: '고백', lovers: '연애 시작', propose: '프로포즈', married: '결혼', firstPhoto: '첫 네컷사진', treasure: '보물 발견' };
  const perm = Object.entries(P).filter(([k]) => L[k] || k.startsWith('case_') || k.startsWith('fest_') || k.startsWith('hidden_')).map(([k, v]) => `<li class="ok">💗 ${L[k] || (k.startsWith('case_') ? '사건 해결 · ' + CASES[k.slice(5)].name : k.startsWith('fest_') ? '축제 · ' + v.name : '탐험 · ' + v.name)} — ${v.date || dateLabel(v.day)} ${v.place ? '· ' + esc(v.place) : ''}</li>`).join('');
  const pref = [['food', '좋아하는 음식', (k) => ITEMS[k] && ITEMS[k].name], ['gift', '자주 준 선물', (k) => ITEMS[k] && ITEMS[k].name], ['place', '자주 가는 곳', (k) => placeName(k) || k], ['outfit', '즐겨 입는 옷', (k) => OUTFITS[k] ? OUTFITS[k].name : '직업복'], ['date', '자주 한 데이트', (k) => DATES[k] && DATES[k].name], ['act', '즐겨 하는 활동', (k) => ({ sit: '함께 앉기' })[k] || k]].map(([c, n, f]) => { const t = memTop(c); return `<li>${n}: ${t ? esc(f(t) || t) : '<span class="muted">아직 몰라요</span>'}</li>`; }).join('');
  const rec = S.mem.recent.slice(0, 10).map(r => `<li>${dateLabel(r.day)} · ${esc(r.text)}${r.place ? ' · ' + esc(r.place) : ''}</li>`).join('');
  openPanel('💭 형사님의 기억', `<h4>영구 기억</h4><ul class="req">${perm || '<li class="muted">아직 없어요</li>'}</ul><h4>취향 기억</h4><ul class="req">${pref}</ul><h4>최근 기억</h4><ul class="req">${rec || '<li class="muted">아직 없어요</li>'}</ul><p class="psub">형사님은 실제로 함께 겪은 일만 기억하고 이야기해요.</p>`);
}
function visitorMenu() { openPanel('🧳 방문객', `<p class="psub">⛴ ${nextFerryText()} · 오늘 ${ferryPlan().cancel ? '결항' : '운항'}</p>${G.visitors.length ? `<ul class="req">${G.visitors.map(v => `<li>${VISITOR_TYPES[v.vt].icon} ${esc(v.look.name)} — ${v.leaving ? '배 타러 가는 중' : placeName(placeAt(v.x, v.y, MAPS.island)) || '마을'}</li>`).join('')}</ul>` : '<p class="psub">지금 섬에 온 방문객이 없어요. 배가 들어오면 손님이 내려요.</p>'}<p class="psub">누적 방문객 ${S.stats.visitors}명 · 마을 평판 ${S.rep}</p>`); }
function rumorMenu() { const heard = S.rumors.filter(r => r.told.length); openPanel('🗣 마을 소문', heard.length ? `<ul class="req">${heard.slice().reverse().map(r => `<li>"${esc(r.text)}" <small>— ${dateLabel(r.day)}, ${r.told.map(v => NPC_LOOKS[v] ? NPC_LOOKS[v].name : v).slice(0, 2).join(', ')}</small></li>`).join('')}</ul>` : '<p class="psub">아직 들은 소문이 없어요. 주민들에게 말을 걸어 보세요.</p>'); }
function festMenu() { const list = Object.values(S.fest).sort((a, b) => b.day - a.day); openPanel('🎪 축제', `${list.length ? list.map(st => { const F = FESTS[st.fid]; return `<div class="nb ${st.done ? 'solved' : ''}"><b>${F.icon} ${F.name}</b><small>${dateLabel(st.day)} · ${st.done ? '끝남' : st.joined ? `준비 ${Math.min(5, st.step)}/5단계 · 예산 ${fmtMoney(st.budget)}` : '준비위원 모집 중 (마을회관)'}</small></div>`; }).join('') : '<p class="psub">축제 일주일 전쯤 공고가 붙어요.</p>'}<h4>올해 축제</h4><ul class="req">${Object.entries(FESTS).map(([id, F]) => `<li>${F.icon} ${F.name} — ${dateLabel(festDay(id))}</li>`).join('')}</ul><p class="psub">축제 평판 누적 ${S.rep} · 참여한 축제 ${S.stats.festivals}회</p>`); }
function annivMenu() { const r = S.rel, rows = []; if (r.flags.met) rows.push(`만난 날 — ${dateLabel(r.metDay)} (${daysKnown()}일째)`); if (r.flags.lovers) rows.push(`사귄 날 — ${dateLabel(r.loverDay)} (${loverDays()}일째)`); if (S.wedding) rows.push(`결혼식 — ${dateLabel(S.wedding)}`); if (r.flags.married && r.marriedDay) { const nx = r.marriedDay + Math.ceil((S.day - r.marriedDay + 1) / 120) * 120; rows.push(`다음 결혼기념일 — ${dateLabel(nx)}`); } openPanel('💍 기념일', rows.length ? `<ul class="req">${rows.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p class="psub">아직 기념일이 없어요.</p>'); }
function homeLifeMenu() { openPanel('🏡 공동생활', S.rel.flags.married ? `<p class="psub">형사님이 집에서 함께 살아요. 아침엔 주방·식탁, 저녁엔 소파·TV·책장, 밤엔 침대를 써요. 새 가구를 놓으면 알아보고 이야기해요.</p><ul class="req"><li>집 단계: ${HOME_LV[S.homeLv].name}</li><li>배치한 가구: ${S.furn.placed.length}개 · 보관함 ${S.furn.store.length}개</li><li>형사님 지금: ${G.det.map === 'in_home' ? '집에 있어요' : TASK_LABEL[G.det.task] || '밖에 있어요'}</li></ul>` : '<p class="psub">결혼하면 형사님과 한집에서 살 수 있어요. 그 전에도 집을 넓히고 꾸밀 수 있어요.</p>'); }

/* ---------------- 시작 · 하루 훅 ---------------- */
const _newState0 = newState;
newState = function (name, job, hair, detName) {
  const s = ensureV4(_newState0(name, job, hair, detName));
  s.fm = chooseFirstMeeting(job);
  s.wardInit = true; giveOutfitTo(s, 'daily'); giveOutfitTo(s, 'pajama');
  qInit(s);
  return s;
};
function giveOutfitTo(s, k) { s.ward.p[k] = 1; s.ward.d[k] = 1; }
function qInit(s) { s.quests.first_meet = { state: 'ACTIVE', step: 0, n: 0, done: false, claimed: false, reps: {} }; s.quests.job = { state: 'ACTIVE', step: 0, n: 0, done: false, claimed: false, reps: {} }; }
function extraPOIs() {
  const L = P_('lighthouse'), H = P_('harbor'), HF = P_('hallFront');
  const set = (k, x, y, m = MAPS.island) => { POI[k] = nearestWalkable(x, y, m); };
  set('lighthouseC1', L[0] - 2, L[1] + 1); set('lighthouseC2', L[0] + 2, L[1] - 2); set('lighthouseC3', L[0] + 0.5, L[1] - 1);
  set('harborC1', H[0] - 2, H[1] + 1); set('harborC2', H[0] - 4, H[1] + 0.5); set('harborC3', H[0] - 9, H[1] + 1);
  set('hallC1', HF[0] - 2, HF[1] + 2); set('isletBox', 13.5, 10.5, MAPS.islet);
  for (const id of ['orange', 'islet']) for (const c of CASES[id].clues) if (Array.isArray(c[3])) { const m = MAPS[c[2]]; c[3] = nearestWalkable(c[3][0], c[3][1], m); }
  for (const c of CASES.festival.clues) if (Array.isArray(c[3])) c[3] = nearestWalkable(c[3][0], c[3][1], MAPS[c[2]]);
}
const _buildWorld0 = buildWorld;
buildWorld = function () { _buildWorld0(); extraPOIs(); };
const _startGame0 = startGame;
startGame = function (state, isNew) {
  ensureV4(state);
  if (!state.rel.flags.met && !state.fm) state.fm = chooseFirstMeeting(state.job);
  G.visitors = []; G.detAuto = null;
  _startGame0(state, isNew);
  rebuildHome(); if (G.player.map === 'in_home') M = MAPS.in_home;
  setPortalObjects(); setCaseObjects(); festUpdateDaily();
  if (isNew) fmSetup();
  else {
    // 저장된 위치 보정 (지도가 바뀌어도 걸을 수 있는 곳으로)
    const P = G.player; if (!MAPS[P.map]) P.map = 'island'; M = MAPS[P.map];
    if (!walkable(Math.floor(P.x), Math.floor(P.y), M)) [P.x, P.y] = nearestWalkable(P.x, P.y, M);
    const fp = ferryPhase(S.min); if (fp.phase === 'docked' || (S.min > 9 * 60 && S.min < 16.4 * 60 && !ferryPlan().cancel)) { ferryPlan().arrived = { 1: true, 2: S.min >= 14 * 60 }; spawnVisitors(S.min >= 14 * 60 ? 2 : 1); for (const v of G.visitors) { const p = P_(v.route[0]); [v.x, v.y] = nearestWalkable(p[0], p[1], MAPS.island); } }
    if (state._migratedFrom === 3) { delete state._migratedFrom; setTimeout(() => toast('🆕 「우리들의 해월도」 업데이트! 이전 저장을 새 버전으로 옮겼어요'), 1200); }
  }
  if (!qGet('daily_fish').day || qGet('daily_fish').day !== S.day) dailyQuests();
  updateQuestBtn(); $('#questBtn').classList.remove('hidden');
  G.camSnap = true; save();
};
function dailyQuests() {
  const q = qGet('daily_fish'); if (S.day >= 2 && q.day !== S.day && S.rel.flags.met) { Object.assign(q, { day: S.day }); q.state = 'LOCKED'; qSet('daily_fish', { state: 'ACTIVE' }); }
}
const _endDay0 = endDay;
endDay = async function (forced) {
  await _endDay0(forced);
  { const P = G.player; rebuildHome(); if (P.map === 'in_home') { M = MAPS.in_home; [P.x, P.y] = nearestWalkable(P.x, P.y, M); } const d = G.det; if (d.map === 'in_home') [d.x, d.y] = nearestWalkable(d.x, d.y, MAPS.in_home); }
  spreadRumors(); festUpdateDaily(); apptTick(); dailyQuests();
  for (const v of [...G.visitors]) removeVisitor(v);
  rebuildHome(); if (G.player.map === 'in_home') M = MAPS.in_home;
  setPortalObjects(); setCaseObjects();
  G.detAuto = null; G.det.apptArrived = null;
  for (const a of S.appts) if (a.day === S.day && a.status === 'set') setTimeout(() => toast(`💌 오늘 ${fmtTime(a.min)} ${APPT_PLACES[a.place].name}에서 형사님과 약속!`), 3400);
  updateQuestBtn(); save();
};
/* 루프 훅 — 가벼운 주기 검사 */
const _loop0 = loop;
let _sysT = 0;
loop = function (ts) {
  if (G.started && S && !paused()) {
    const dt = Math.min(0.05, (ts - (G._lastTs || ts)) / 1000);
    for (const v of G.visitors) { visitorUpdate(v, dt); v.update(dt); }
    _sysT += dt;
    if (_sysT > 1) {
      _sysT = 0; ferryUpdate(); apptTick(); hiddenCheck(); if (S.rel.flags.met) caseCheckTriggers();
      const vp = qGet('v_photo'); if (qIsOpen(vp) && vp.day === S.day && S.min >= 17 * 60 && curPlace() === 'lighthouse') { qSet('v_photo', { state: 'COMPLETED' }); if (!S.frames.includes('lighthouse')) S.frames.push('lighthouse'); toast('📸 사진작가가 고마워하며 「등대」 프레임을 줬어요'); }
      const cat = G.pets.find(p => p.vid === 'cheese'); if (cat && S.cases.cat && S.cases.cat.step !== 'solved') cat.visible = false;
      for (const a of [...G.villagers, ...G.pets]) if (a.hold > 0) a.hold--;
    }
  }
  G._lastTs = ts;
  _loop0(ts);
};
const _villagerUpdate0 = villagerUpdate; villagerUpdate = function (a, dt) { if (a.hold > 0 || a.talking) { a.stop(); return; } _villagerUpdate0(a, dt); };
const _petUpdate0 = petUpdate; petUpdate = function (a, dt) { if (a.hold > 0) { a.stop(); return; } _petUpdate0(a, dt); };
const _standUpPlayer0 = standUpPlayer; standUpPlayer = function () { const P = G.player; if (P.seatFurn) { const o = P.seatFurn; P.seatFurn = null; P.pose = 'stand'; [P.x, P.y] = nearestWalkable(o.x + 0.5, o.y + 1.5, M); return; } _standUpPlayer0(); };
const _onTap0 = onTap; onTap = function (px, py) { if (G._suppressTap) return; if (G.player && G.player.seatFurn && !G.decor) { standUpPlayer(); return; } _onTap0(px, py); };
const _walkPlayer0 = walkPlayer; walkPlayer = function (x, y, cb) { if (G.player.seatFurn) standUpPlayer(); _walkPlayer0(x, y, cb); };
const _goMap0 = goMap; goMap = async function (id, x, y, opts) { if (id === 'in_home') rebuildHome(); G.player.seatFurn = null; await _goMap0(id, x, y, opts); if (id === 'in_home' && S.rel.flags.married) G._furnReactT = 0; };
const _openBuilding0 = openBuilding; openBuilding = function (b) { if (b.id === 'furniture') { const m = MAPS.in_furniture; goMap(m.id, m.spawn.door[0], m.spawn.door[1]); return; } _openBuilding0(b); };
const _updateHUD0 = updateHUD; updateHUD = function () { _updateHUD0(); document.body.classList.toggle('talking', !!G.dialog); if (S && G.started && Math.floor(G.t * 4) % 8 === 0) updateQuestBtn(); };
const _openRel0 = openRel;
openRel = function (tab) {
  _openRel0(tab);
  const pr = $('#tab-profile'); if (!pr) return;
  const st = detStateName(), sp = S.rel.speech;
  pr.insertAdjacentHTML('beforeend', `<h4>지금 형사님</h4><dl class="prof"><dt>상태</dt><dd>${st} · ${S.comp ? '함께 다니는 중' : TASK_LABEL[detPlan(S.min).k] || ''}</dd><dt>말투</dt><dd>${casualOn() ? '반말 (편하게)' : '존댓말'}${sp.informalSpeechEventCompleted ? ` · ${dateLabel(sp.informalSpeechEventDate)}에 말을 놓았어요` : ''}</dd><dt>첫 만남</dt><dd>${S.mem.perm.firstMeet ? esc(S.mem.perm.firstMeet.place) + ' · ' + (S.mem.perm.firstMeet.date || '') : '아직'}</dd></dl>`);
  $('#tab-album').innerHTML = `<p class="muted">추억 앨범은 분류 · 정렬 · 즐겨찾기 · 저장을 지원해요.</p><button class="big" id="albOpen">📔 추억 앨범 열기</button>`;
  $('#albOpen').onclick = () => { closeRel(); albumMenu(); };
};
const _bindUI0 = bindUI;
bindUI = function () {
  _bindUI0();
  bindDecorDrag();
  $('#dRotate').onclick = decorRotate; $('#dStore').onclick = decorStore; $('#dBag').onclick = decorStorage;
  $('#dMove').onclick = () => { const d = G.decor; if (!d || !d.sel) return; d.moving = true; $('#decorInfo').textContent = '옮길 곳을 누르세요'; };
  $('#dDone').onclick = () => closeDecor(false); $('#dCancel').onclick = () => closeDecor(true);
  $('#questBtn').onclick = (e) => { e.stopPropagation(); toggleQuestPanel(); };
  $('#questClose').onclick = () => toggleQuestPanel(false);
  $('#panelClose').onclick = closePanel; $('#panelBack').onclick = () => { const f = G._panelBack; G._panelClose = null; if (f) f(); };
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#panel').classList.contains('hidden')) closePanel(); });
};
const _setupLooks0 = setupLooks; setupLooks = function () { _setupLooks0(); setupOutfits(); };
window.HW.sys = { qGet, qSet, questViews, caseDiscover, unlockHidden, treasureFrag, ferryPhase, spawnVisitors, festivalSoon, festUpdateDaily, apptMenu, photoSession, composeStrip, canPlace, rebuildHome, banmalDue, banmalEvent, toBanmal, casualOn, memoryLine, detStateName, furnGive, giveOutfit };
/* 대사가 끝난 뒤 캐릭터 이동을 기다릴 때 대화창이 열린 채로 멈추지 않게 */
const _waitUntil0 = waitUntil;
waitUntil = function (cond, timeout) { if (G.dialog && !_dlgResolve) closeDialog(); return _waitUntil0(cond, timeout); };

/* 대화 상대 기록: 이벤트는 기본적으로 형사님과의 대화 */
const _runEventT = runEvent;
runEvent = function (fn) { return _runEventT(async () => { G._talkTo = 'det'; return fn(); }); };
