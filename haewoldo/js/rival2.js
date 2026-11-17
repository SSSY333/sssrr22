/* =====================================================================
   v1.22 — 형사님과 젊은 미혼 주민(윤서 · 하은 선생님, 지아, 소연 사장님, 미나)
   · 썸 전(처음 만난 사이 ~ 친한 사이): 둘이 나란히 걷는 모습. 마주치면 인사만, 형사님은 하던 산책으로 돌아감
     (예전엔 말을 걸면 그 사람을 보내고 갑자기 나와 같이 다니는 상태가 됐음)
   · 썸 이후: 길에서 잠깐 서서 이야기하다가 나를 보면 눈치 보고 당황 — 같이 갈지는 내가 고름
   ===================================================================== */
const RIVAL_SPOTS = ['cafeDoor', 'plaza', 'harbor', 'promenade', 'beachBench', 'clothesDoor', 'superDoor'];
const rvName = (a) => (a && a.rv && a.rv.name) || '그분';
const dlr = (polite, casual) => `[[${polite}||${casual}]]`;
function detSayOther(text, t) { G._detToOther = true; try { G.det.say(text, t); } finally { G._detToOther = false; } }   // 형사님이 다른 사람에게 하는 말은 존댓말 그대로

/* ---------------- 하루 일정 ---------------- */
const _planDayR2 = planDay;
planDay = function () {
  const r = _planDayR2.apply(this, arguments);
  const R = S.rel, d = R.daily, jobs = Object.keys(G.rivals || {});
  delete d.rival;
  if (!R.flags.met || !jobs.length) return r;
  if (R.stage <= 3) {
    // 썸 전: 하루 한 번쯤 둘이 산책 (오전 · 점심 · 저녁 중)
    if (Math.random() < 0.5) { const w = pick([[10 * 60, 11.3 * 60], [12.6 * 60, 13.5 * 60], [17.4 * 60, 18.6 * 60]]); const st = rand(w[0], w[1]); d.rival = { job: pick(jobs), start: st, end: st + rand(35, 55), done: false, mode: 'walk' }; }
  } else if (Math.random() < (R.flags.married ? 0.15 : 0.3)) {
    // 썸 이후: 길에서 잠깐 서서 이야기
    const st = rand(10 * 60, 16.5 * 60); d.rival = { job: pick(jobs), start: st, end: st + rand(20, 30), done: false, mode: 'chat', spot: pick(RIVAL_SPOTS) };
  }
  return r;
};

/* ---------------- 같이 걷기 · 서서 이야기 ---------------- */
rivalWalkUpdate = function (dt) {
  const d = G.det, rw = S.rel.daily.rival, a = G.rivals[rw.job], P = G.player;
  if (!a) return;
  if (rw.mode === 'chat') {
    const sp = P_(rw.spot || 'plaza');
    if (!rw.arrived) { d.speedMul = 1; if (Math.hypot(d.x - sp[0], d.y - sp[1]) > 1.2) { if (!d.path.length) d.walkTo(sp[0], sp[1]); } else { rw.arrived = true; d.stop(); } }
    else { d.stop(); if (dist(a, d) < 1.8) { d.lookAt(a); a.lookAt(d); } }
    rw.chatT = (rw.chatT || 0) - dt;
    if (rw.arrived && rw.chatT <= 0 && dist(a, d) < 2.2) {
      rw.chatT = 4.2; const CH = RIVAL_LINES[rw.job].chat; rw.ci = (rw.ci || 0) + 1; const c = CH[Math.floor(rw.ci / 2) % CH.length];
      if (rw.ci % 2) a.say(c[0], 4); else detSayOther(c[1], 4);
      if (rw.ci % 3 === 0) d.emo('👀', 1.4);   // 이야기하면서도 자꾸 주위를 둘러봄
    }
    // 나를 멀리서 발견하면 먼저 움찔
    if (!rw.spotted && P.map === d.map && dist(d, P) < 9 && dist(d, P) >= 4.5 && !G.busy) { rw.spotted = true; d.lookAt(P); d.emo('😳', 2.2); d.say(dlr('…어? 저기 {me}…?', '…어? 저기 {me}…?'), 2.6); }
  } else {
    d.speedMul = 0.6;
    if (!d.path.length && d.wait <= 0) { const wp = P_(STROLL[d.sub % STROLL.length]); d.sub++; d.walkTo(wp[0], wp[1]); d.wait = rand(2, 4); }
    rw.chatT = (rw.chatT || 0) - dt;
    if (rw.chatT <= 0) {
      rw.chatT = 4.5; const CH = RIVAL_LINES[rw.job].chat; rw.ci = (rw.ci || 0) + 1; const c = CH[Math.floor(rw.ci / 2) % CH.length];
      if (rw.ci % 2) a.say(c[0], 4); else detSayOther(c[1], 4);
      if (rw.ci % 4 === 0) { a.emo('😊', 1.6); d.emo('😄', 1.6); }
    }
  }
  if (!rw.seen && P.map === d.map && dist(d, P) < (rw.mode === 'chat' ? 4.2 : 4.5) && !G.busy && !paused() && !G.working) { rw.seen = true; runEvent(() => rivalMeet(a, rw)); }
};
/* 상대도 형사님 옆에 붙어 다니다가, 이야기할 땐 마주 보고 섬 */
const _rivalUpdateR2 = rivalUpdate;
rivalUpdate = function (a, dt) {
  const rw = S.rel.daily.rival, d = G.det;
  if (rw && !rw.done && rw.job === a.job && rw.mode === 'chat' && d.task === 'rivalWalk' && d.state === 'sched' && !a.talking) {
    if (a.map !== d.map) { a.map = d.map; [a.x, a.y] = nearestWalkable(d.x + 1, d.y, MAPS[d.map]); }
    a.visible = true; a.speedMul = 1.2;
    if (rw.arrived) { const tgt = nearestWalkable(d.x + 1.1, d.y + 0.2, MAPS[d.map]); if (Math.hypot(a.x - tgt[0], a.y - tgt[1]) > 0.5) { if (!a.path.length) a.walkTo(tgt[0], tgt[1]); } else { a.stop(); a.lookAt(d); } }
    else if (dist(a, d) > 1.3 && !a.path.length) { a.walkTo(d.x, d.y); if (a.path.length) a.path.pop(); }
    return;
  }
  return _rivalUpdateR2(a, dt);
};

/* ---------------- 마주쳤을 때 ---------------- */
async function rivalMeet(a, rw) {
  const d = G.det, P = G.player, nm = rvName(a), st = S.rel.stage;
  scriptDet(); a.stop(); d.lookAt(P); a.lookAt(P); P.lookAt(d);
  if (rw.mode === 'chat') {
    // 썸 이후: 당황 · 눈치
    d.emo('💦', 2.5); burst(d, 'spark', 2);
    const nmI = josa(nm, '이', '가'), nmR = josa(nm, '이랑', '랑');
    await say('det', 'surprise', pick([dlr('어, {me}! 언제부터 거기… 아니, 그게, ' + nmI + ' 길을 물어보셔서요.', '어, {me}! 언제부터 거기… 아니, 그게, ' + nmI + ' 길을 물어보셔서.'), dlr('아, {me}…! 이건 그냥, 마주쳐서 인사만 하던 중이었어요. 진짜로요.', '아, {me}…! 이건 그냥, 마주쳐서 인사만 하던 중이었어. 진짜로.'), dlr('…{me}? 하하, 타이밍이 참… 오해하지 마요.', '…{me}? 하하, 타이밍 참… 오해하지 마.')]));
    await say(a.id, 'tease', pick([`어머~ 형사님 얼굴 빨개지셨네요? 호호. 저는 이만 가 볼게요.`, `아하, 이분이구나~ 형사님이 요즘 자꾸 웃는 이유. 방해 안 할게요!`, `형사님, 그렇게 당황하시면 더 수상해 보여요~ 저 먼저 갈게요.`]));
    a.talking = true; endRivalWalk(); a.talking = false;
    const c = await choose(['누구랑 그렇게 즐겁게 얘기했어요?', '(살짝 삐친 척 고개를 돌린다)', '(웃으며) 다 봤어요~']);
    if (c === 0) { await say('det', 'blush', dlr(josa(nm, '이랑', '랑') + '요? 그냥 날씨 얘기 했어요. 제일 즐거운 얘기는 지금부터 할 거예요.', josa(nm, '이랑', '랑') + '? 그냥 날씨 얘기 했어. 제일 즐거운 얘기는 지금부터 할 거야.')); addAff(1, { event: true }); }
    else if (c === 1) { d.emo('😰', 2); await say('det', 'surprise', dlr('어, 어? 삐쳤어요? 진짜 아무것도 아니에요. …이따 맛있는 거 사 줄게요. 네?', '어, 어? 삐쳤어? 진짜 아무것도 아니야. …이따 맛있는 거 사 줄게. 응?')); await say('narr', '', '형사님이 안절부절못하며 내 눈치를 살핀다. 조금 귀엽다.'); addAff(2, { event: true }); }
    else { await say('det', 'laugh', dlr('하하… 다 봤어요? 그럼 제가 계속 이쪽만 보고 있던 것도 봤겠네요.', '하하… 다 봤어? 그럼 내가 계속 이쪽만 보고 있던 것도 봤겠네.')); addAff(1, { event: true }); }
    const k = await choose(['같이 가요', '괜찮아요, 일 보세요']);
    if (k === 0) { await say('det', 'smile', dlr('네. 이제 순찰은 당신 옆에서 할게요.', '응. 이제 순찰은 네 옆에서 할게.')); startCompanion(); }
    else { await say('det', 'smile', dlr('그럼 이따 꼭 봐요. 오해 풀릴 때까지 연락할 거예요.', '그럼 이따 꼭 보자. 오해 풀릴 때까지 연락할 거야.')); d.state = 'sched'; }
    memRecent('rival', `${josa(nm, '이랑', '랑')} 이야기하던 형사님이 나를 보고 당황했다`);
    return;
  }
  // 썸 전: 가볍게 인사, 형사님은 하던 산책으로
  await say(a.id, 'smile', RIVAL_LINES[a.job].intro);
  await say('det', 'smile', pick([dlr('아, {me}! 안녕하세요. ' + josa(nm, '이랑', '랑') + ' 산책 겸 순찰 중이에요.', '아, {me}! 안녕. ' + josa(nm, '이랑', '랑') + ' 산책 겸 순찰 중이야.'), dlr('{me}, 마침 지나가시네요. 오늘 날씨 좋죠?', '{me}, 마침 지나가네. 오늘 날씨 좋지?')]));
  const c = await choose(['안녕하세요! 두 분 산책 중이세요?', '(인사만 하고 지나간다)', '저도 같이 걸어도 돼요?']);
  if (c === 0) { await say('det', 'smile', dlr('네, 순찰 도는 길이 겹쳐서요. 좋은 하루 보내요!', '응, 순찰 도는 길이 겹쳐서. 좋은 하루 보내!')); await say(a.id, 'smile', '다음에 또 봬요~'); }
  else if (c === 1) { await say('narr', '', '가볍게 고개를 숙이고 지나갔다. 뒤에서 두 사람의 웃음소리가 들린다.'); if (st >= 3) { d.lookAt(P); d.emo('…', 1.6); } }
  else {
    await say(a.id, 'smile', pick(['어머, 좋아요! …아, 저 이제 들어가 봐야 하는 시간이네요. 두 분 천천히 걸으세요~', '그럼 저는 여기까지! 형사님, 다음에 또 같이 걸어요~']));
    a.talking = true; endRivalWalk(); a.talking = false;
    await say('det', 'smile', dlr('그럼 같이 걸어요. 어디로 갈까요?', '그럼 같이 걷자. 어디로 갈까?')); addAff(1, { event: true }); startCompanion(); return;
  }
  rw.seen = true; d.state = 'sched'; d.scripted = false;   // 형사님은 하던 산책으로 돌아감
}
jealousEvent = function (a) { const rw = S.rel.daily.rival || { mode: S.rel.stage >= 4 ? 'chat' : 'walk' }; return rivalMeet(a, rw); };

/* 같이 있는 중에 형사님에게 말을 걸면: 동행으로 바뀌지 않고 같은 장면으로 */
const _interactWithR2 = interactWith;
interactWith = function (a) {
  const rw = S.rel && S.rel.daily.rival, d = G.det;
  if (a === d && rw && !rw.done && d.task === 'rivalWalk' && !S.comp) {
    const rv = G.rivals[rw.job];
    if (!rw.seen) { rw.seen = true; runEvent(() => rivalMeet(rv, rw)); return; }
    runEvent(async () => { scriptDet(); d.lookAt(G.player); await say('det', 'smile', rw.mode === 'chat' ? dlr('아까 그건 진짜 아무것도 아니에요. 이따 봐요!', '아까 그건 진짜 아무것도 아니야. 이따 봐!') : dlr('아, {me}! 지금은 ' + rvName(rv) + ' 배웅하는 중이라… 이따 봬요!', '아, {me}! 지금은 ' + rvName(rv) + ' 배웅하는 중이라… 이따 봐!')); d.state = 'sched'; });
    return;
  }
  if (a && a.isRival && rw && !rw.done && rw.job === a.job && d.task === 'rivalWalk' && !rw.seen) { rw.seen = true; runEvent(() => rivalMeet(a, rw)); return; }
  return _interactWithR2(a);
};
