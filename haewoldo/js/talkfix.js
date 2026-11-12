/* =====================================================================
   형사님 대사 점검 — 같은 말 되풀이 · 상황에 안 맞는 말 줄이기
   · pickFresh: 요즘 한 말은 피하고, 지금 시간 · 날씨 · 장소 · 계절에 안 맞는 말은 고르지 않음
   · 다시 인사 · 순찰 동행 · 기억 한마디를 여러 가지로, 하루 횟수 제한
   ===================================================================== */
G._detRecent = [];
function detRemember(t) { if (typeof t !== 'string') return; const R = G._detRecent; R.push(t); if (R.length > 60) R.shift(); }
/* 지금 상황에 맞는 말인지 */
function lineFits(t) {
  if (!S || typeof t !== 'string') return true;
  const m = S.min, w = S.weather, se = season(), indoor = !!(MAPS[G.player.map] && MAPS[G.player.map].interior);
  const has = (re) => re.test(t);
  if (has(/점심 뭐 먹었|점심은 먹었|점심 먹었/) ? !(12 * 60 <= m && m < 17 * 60) : has(/점심/) && !(10.5 * 60 <= m && m < 14.5 * 60) && !/이따 점심|내일 점심/.test(t)) return false;
  if (has(/오늘 저녁|이따 저녁|저녁 메뉴|저녁엔 뭐/) && m >= 20 * 60) return false;
  if (has(/이따 퇴근하면|일찍 퇴근하고/) && m >= 17 * 60) return false;
  if (has(/출근 전에|출근하기 전/) && m >= 9.5 * 60) return false;
  if (has(/아침에 봤는데도/) && m < 11 * 60) return false;
  if (has(/좋은 아침|굿모닝|아침 먹었|아침 공기|출근길|일찍 나왔|잘 잤어/) && m >= 11.5 * 60) return false;
  if (has(/퇴근했|퇴근하고 바로|퇴근길/) && m < 16 * 60) return false;
  if (has(/잘 자|좋은 밤|야경|밤바다|별 보|별이 많|오늘 밤|이 밤/) && 6 * 60 <= m && m < 17.5 * 60) return false;
  if (has(/노을/) && !(15.5 * 60 <= m && m < 20 * 60) && !/노을 같이 봐요|노을 보러/.test(t)) return false;
  if (has(/노을 같이 봐요|노을 보러/) && m >= 19.5 * 60) return false;
  if (has(/선크림|햇빛 세|해가 쨍쨍|매미/) && (m >= 18.5 * 60 || m < 7 * 60 || indoor || w === 'rain')) return false;
  if (has(/우산|비 오는|빗소리|비가 오/) && w !== 'rain' && w !== 'storm') return false;
  if (has(/눈 온다|첫눈|눈이 와|발자국 남기/) && w !== 'snow') return false;
  if (indoor && has(/파도 소리|바닷바람|바다 냄새|바닷물|벚꽃 잎 날|유채꽃 향기|억새|매미|하늘이 높|바람 좋|바람 냄새|모래|입김/)) return false;
  if (has(/벚꽃|유채/) && se !== 'spring') return false;
  if (has(/단풍|억새|낙엽/) && se !== 'autumn') return false;
  if (has(/매미|수박|빙수|아이스 귤/) && se !== 'summer') return false;
  if (has(/입김|핫팩|눈사람/) && se !== 'winter') return false;
  if (has(/순찰/) && /같이 걸으니까 순찰|순찰도 금방/.test(t) && !detPlan(m).duty) return false;
  return true;
}
/* 고르기: 상황에 맞고, 최근에 안 한 말 */
function pickFresh(arr, fallback) {
  const a = (arr || []).filter(x => x != null);
  const fit = a.filter(x => typeof x !== 'string' || lineFits(x));
  let pool = fit.length ? fit : (fallback && fallback.length ? fallback.filter(x => lineFits(x)) : []);
  if (!pool.length) pool = fit.length ? fit : a;
  if (!pool.length) return '…';
  const fresh = pool.filter(x => !G._detRecent.includes(x));
  const v = pick(fresh.length ? fresh : pool); detRemember(v); return v;
}
/* 형사님이 한 말은 모두 기억 (같은 말 연속 방지용) */
const _sayTalkFix = say;
say = function (who, expr, text) { if (who === 'det') detRemember(text); return _sayTalkFix(who, expr, text); };
const _actorSayTalkFix = Actor.prototype.say;
Actor.prototype.say = function (text, t) {
  if (this.id === 'det') { if (typeof text === 'string' && !lineFits(text)) return; if (G._detRecent.slice(-12).includes(text)) return; detRemember(text); }
  return _actorSayTalkFix.call(this, text, t);
};
/* 함께 걸을 때 한마디도 같은 기준으로 */
const _compLineTalkFix = compLine;
compLine = function () { for (let i = 0; i < 6; i++) { const t = _compLineTalkFix(); if (lineFits(t) && !G._detRecent.includes(t)) return t; } return _compLineTalkFix(); };
/* 기억 한마디: 하루 한 번, 같은 기억 되풀이 X */
const _memoryLineTalkFix = memoryLine;
memoryLine = function () {
  if (S.rel.daily.memLine) return null;
  for (let i = 0; i < 6; i++) { const t = _memoryLineTalkFix(); if (t && !G._detRecent.includes(t)) { S.rel.daily.memLine = true; return t; } }
  return null;
};
/* 다시 인사할 때 */
const GREET_AGAIN = {
  p: ['또 봤네요. 오늘 자주 마주치네요.', '네, 또 안녕하세요.', '방금 인사했는데요. 좋아서 또 받아요.', '두 번째 인사네요. 세 번째도 기다릴게요.', '오늘 인사 많이 받네요.'],
  c: ['또 인사해? 좋아.', '응, 또 안녕.', '아까 했잖아. 근데 또 해도 돼.', '오늘 몇 번째야. 싫다는 거 아니고.', '인사 말고 할 말 있으면 해도 돼.'],
};
function greetAgainLine() { return pickFresh(casualOn() ? GREET_AGAIN.c : GREET_AGAIN.p); }
/* 근무 중 같이 걷기: 말을 여러 가지로, 하루 두 번까지 */
const DUTY_WALK = {
  offer: { p: ['순찰 중인데… 같이 걸을래요? 순찰 보조 요원으로 임명합니다.', '마침 그쪽 순찰이에요. 같이 가요.', '근무 중이라 오래는 못 있어요. 그래도 같이 걸어요.', '순찰 코스 같이 돌아요. 길 안내도 할 겸.'], c: ['순찰 중인데 같이 걸을래? 보조 요원으로 임명.', '마침 그쪽 순찰이야. 같이 가자.', '근무 중이라 오래는 못 있어. 그래도 같이 걷자.', '순찰 같이 돌자. 혼자 도는 것보다 낫다.'] },
  limit: { p: ['대신 한 시간 반 정도만이에요.', '파출소 들어가기 전까지만요.', '무전 오면 가야 해요. 그 전까지만.'], c: ['대신 한 시간 반 정도만.', '파출소 들어가기 전까지만이야.', '무전 오면 가야 돼. 그 전까지.'] },
  end: { p: [['아, 슬슬 파출소 들어가 봐야겠어요. 무전이 와서.', '퇴근하고 또 같이 걸어요. 약속.'], ['순찰 끝났어요. 들어가 봐야겠다.', '이따 저녁에 봐요.'], ['서류 정리하러 들어가야 해요.', '같이 걸어 줘서 고마워요.']], c: [['슬슬 파출소 들어가 봐야겠다. 무전 왔어.', '퇴근하고 또 걷자. 약속.'], ['순찰 끝. 들어가 볼게.', '이따 저녁에 봐.'], ['서류 정리하러 가야 돼.', '같이 걸어 줘서 고마워.']] },
  full: { p: '오늘은 순찰 같이 많이 했어요. 퇴근하고 걸어요.', c: '오늘은 순찰 같이 많이 했잖아. 퇴근하고 걷자.' },
};
const dw = (k) => DUTY_WALK[k][casualOn() ? 'c' : 'p'];
const _requestFollowTalkFix = requestFollow;
requestFollow = async function () {
  const plan = detPlan(S.min), r = S.rel;
  if (plan.duty && r.stage >= 2 && !(plan.k === 'home' && !r.flags.married) && plan.k !== 'goHome') {
    if ((r.daily.dutyWalk || 0) >= 2) { await say('det', 'smile', dw('full')); return; }
    r.daily.dutyWalk = (r.daily.dutyWalk || 0) + 1;
    await say('det', 'tease', pickFresh(dw('offer'))); await say('det', 'normal', pickFresh(dw('limit')));
    startCompanion({ dutyUntil: S.min + 90 });
    toast('👣 형사님이 함께 다녀요 — 왼쪽 위 아이콘으로 동행 메뉴를 열어요');
    return;
  }
  return _requestFollowTalkFix();
};
function dutyWalkEndLines() { return pickFresh(dw('end')); }
