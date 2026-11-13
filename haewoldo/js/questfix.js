/* =====================================================================
   형사님과 하는 퀘스트 · 대화 간격
   · 약속: 이미 같이 다니는 중이면 함께 약속 장소에 가면 바로 만남 성립
     (예전엔 형사님이 따로 먼저 가서 기다려야만 성립해서, 동행 중엔 「약속을 놓쳤어요」가 떴음)
     약속 시간을 같이 보내고 있으면 놓친 걸로 치지 않음
   · 대화 간격: 형사님과 이야기 · 상호작용한 뒤 게임 시간 2시간 동안은
     형사님이 먼저 다가오거나 말을 걸지 않음 (내가 먼저 말 걸기 · 같이 다니기 · 정해진 약속/프로포즈/결혼은 그대로)
   ===================================================================== */
const DET_QUIET_MIN = 120;
const nowAbs = () => S.day * 1440 + S.min;
function detTouched() { if (S) S.rel.daily.lastDetTalk = nowAbs(); }
function detQuietNow() {
  if (!S || S.comp) return false;
  const r = S.rel.daily, t = nowAbs();
  if (r.lastDetTalk != null && t - r.lastDetTalk < DET_QUIET_MIN) return true;
  if (r.compEndAt != null && t - r.compEndAt < DET_QUIET_MIN) return true;
  return false;
}
/* 형사님과 말한 시각 기록 */
const _sayQF = say;
say = function (who, expr, text) { if (who === 'det' && S && G.started) detTouched(); return _sayQF(who, expr, text); };
const _endCompanionQF = endCompanion;
endCompanion = function (silent) { detTouched(); return _endCompanionQF(silent); };
/* 형사님이 먼저 다가오는 것 막기 */
const _detApproachQF = detApproach;
detApproach = async function () { if (detQuietNow()) { G.det.state = 'sched'; G.det.scripted = false; return; } return _detApproachQF(); };
const _surpriseTickQF = surpriseTick;
surpriseTick = function () { if (detQuietNow()) return false; return _surpriseTickQF(); };
/* 이벤트 검사: 조용히 할 시간엔 형사님이 먼저 거는 장면(밤길 · 부두 기다림 · 이름 · 애칭 · 말 놓기 · 안내 말풍선 · 깜짝 이벤트)을 미룸 */
const _checkEventsQF = checkEvents;
checkEvents = function () {
  const d = G.det;
  const quiet = S && G.started && detQuietNow() && !['waitLighthouse', 'wedding', 'appt'].includes(d.task) && !activeAppt(S.min) && !G.busy;
  if (!quiet) { _checkEventsQF(); apptTogetherTick(); return; }
  const vis = d.visible; d.visible = false;
  try { _checkEventsQF(); } finally { d.visible = vis; }
};

/* ---------------- 약속: 같이 다니는 중이면 ---------------- */
function apptTogetherTick() {
  if (!S || !S.comp || G.busy) return;
  const ap = activeAppt(S.min); if (!ap || S.min < ap.min - 40) return;
  const p = apptPos(ap), P = G.player, d = G.det;
  const near = P.map === 'island' && Math.hypot(P.x - p[0], P.y - p[1]) < 3.6 && d.map === P.map && dist(d, P) < 4.5;
  if (near) { runEvent(() => apptMeetTogether(ap)); return; }
  if (!ap._remind && S.min >= ap.min - 15) { ap._remind = true; S.track = 'appt_' + ap.id; toast(`💌 약속 시간이 다 됐어요 — ${josa(himCall(), '과', '와')} 함께 ${josaRo(APPT_PLACES[ap.place].name)} 가요`); }
}
async function apptMeetTogether(a) {
  const d = G.det, P = G.player, c = casualOn(), AP = APPT_PLACES[a.place];
  scriptDet(); d.lookAt(P); P.lookAt(d);
  a.status = 'met'; d.apptArrived = null;
  await say('det', 'smile', pickFresh(c ? ['같이 오니까 기다릴 필요도 없네. 약속 장소 도착.', '여기 맞지? 오늘은 같이 와서 좋다.', '약속 장소 도착. 같이 오니까 금방이네.'] : ['같이 오니까 기다릴 필요가 없네요. 약속 장소 도착이에요.', '여기 맞죠? 오늘은 같이 와서 좋네요.', '약속 장소 도착이에요. 같이 오니까 금방이네요.']));
  qSet('appt_' + a.id, { state: 'COMPLETED' }); if (S.track === 'appt_' + a.id) S.track = null;
  memRecent('appt', `${AP.name} 약속`); addAff(4, { event: true });
  if (AP.photo) { closeDialog(); await photoSession(); return; }
  if (AP.shop) { await say('det', 'smile', c ? '우리 집에 뭐 들일지 같이 보자.' : '어떤 가구가 좋을지 같이 봐요.'); closeDialog(); furnShopMenu(); return; }
  if (AP.fest) { await say('det', 'laugh', c ? '축제 시작이다! 오늘은 순찰 말고 너랑 다닐 거야.' : '축제 시작이에요! 오늘은 같이 다녀요.'); return; }
  if (AP.date && DATES[AP.date]) { if (AP.date === 'islet') { await say('det', 'smile', c ? '자, 배 타러 가자.' : '자, 배 타러 가요.'); closeDialog(); await rideBoat(); } setTimeout(() => doDate(AP.date), 50); }
}
/* 약속 시간을 함께 보내고 있었다면 놓친 걸로 치지 않음 */
const _apptTickQF = apptTick;
apptTick = function () {
  if (S && S.comp && G.det.map === G.player.map && dist(G.det, G.player) < 6)
    for (const a of S.appts) if (a.status === 'set' && a.day === S.day && S.min >= a.min + 90) { a.status = 'met'; qSet('appt_' + a.id, { state: 'COMPLETED' }); memRecent('appt', `${APPT_PLACES[a.place].name} 약속 (함께 보냄)`); toast(`💌 약속 장소엔 못 갔지만 ${josa(himCall(), '과', '와')} 함께 시간을 보냈어요`); }
  return _apptTickQF();
};
