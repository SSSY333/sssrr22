/* =====================================================================
   하루 엿보기 — 형사님이 혼자 뭔가 하고 있을 때 몰래 지켜보기
   · 조금 떨어진 곳(2.5~7칸)에서 형사님이 일하는 중이면 작은 버튼 「👀 몰래 보기」
   · 하는 일 · 관계 단계에 맞는 장면이 나오고, 가끔은 들킴 → 단계별 반응
   · 하루 한 번 · 본 장면은 다시 잘 안 나옴
   ===================================================================== */
/* who: 'det' 대사(혼잣말), 'narr' 지문 · st: [최소, 최대] 단계 · t: 할 일 */
const PEEKS = [
  { id: 'cat_talk', t: ['patrol', 'pier', 'stroll'], st: [1, 8], s: [['narr', '형사님이 길고양이 앞에 쪼그려 앉았다. 주변을 두리번거리더니…'], ['det', 'smile', '(속닥) 너 밥은 먹었어? …나? 나는 아직. 같이 굶자.'], ['narr', '고양이가 하품을 하자 형사님도 따라서 하품을 했다.']], sum: '길고양이랑 속닥속닥 대화하는 걸 봤다' },
  { id: 'mirror', t: ['station'], st: [3, 7], s: [['narr', '파출소 창문 너머, 형사님이 작은 거울을 들여다보고 있다.'], ['det', 'normal', '(앞머리를 넘겼다가, 다시 내렸다가) …이게 낫나. 아니면 이거.'], ['det', 'blush', '오늘 {n} 마주치면… 아니 무슨 상관이야. 근무 중이잖아.']], sum: '거울 앞에서 앞머리를 열 번쯤 만지는 걸 봤다' },
  { id: 'practice', t: ['station', 'stroll'], st: [3, 4], s: [['narr', '형사님이 혼자 중얼거리며 뭔가 연습하고 있다.'], ['det', 'normal', '(헛기침) 저기, {n} 씨. 혹시 이번 주말에… 아니야. 너무 딱딱해.'], ['det', 'blush', '{n} 씨, 밥… 같이… 으아. 사건 브리핑이 백 배 쉽다.']], sum: '나한테 할 말을 혼자 연습하는 걸 봤다' },
  { id: 'phone_photo', t: ['station', 'lunch', 'home'], st: [5, 8], s: [['narr', '형사님이 휴대폰 화면을 보며 혼자 웃고 있다. 슬쩍 보니… 내 사진이다.'], ['det', 'smile', '(화면을 확대하며) 이때 눈 감았네. 하하. 이것도 예쁘다.'], ['narr', '저장된 사진 폴더 이름이 「♥」였다.']], sum: '휴대폰으로 내 사진을 보며 웃는 걸 봤다' },
  { id: 'kids', t: ['patrol', 'stroll'], st: [1, 8], s: [['narr', '아이들이 형사님 다리에 매달려 있다. 「경찰 아저씨 술래!」'], ['det', 'laugh', '야, 형사는 술래 안 해. …딱 열까지만 센다? 하나, 둘—'], ['narr', '형사님은 아이들한테 일부러 져 주고 있었다. 엄청 진지하게.']], sum: '아이들이랑 술래잡기하며 일부러 져 주는 걸 봤다' },
  { id: 'halmeoni', t: ['patrol'], st: [1, 8], s: [['narr', '할머니 짐을 형사님이 대신 들고 언덕길을 오르고 있다.'], ['det', 'smile', '할머니, 천천히 오세요. 이거 제가 집까지 들어 드릴게요.'], ['narr', '할머니가 형사님 등을 두드리며 「장가는 언제 가누」라고 했다. 형사님 귀가 빨개졌다.']], sum: '할머니 짐을 들어 드리다 장가 얘기에 귀 빨개지는 걸 봤다' },
  { id: 'sing', t: ['stroll', 'pier'], st: [2, 8], s: [['narr', '아무도 없는 줄 아는지, 형사님이 파도 소리에 맞춰 흥얼거린다.'], ['det', 'smile', '♪ 바다가 보이는 언덕에… 음… 다음 가사 뭐였지.'], ['narr', '음정이… 꽤 많이 틀렸다. 근데 표정은 엄청 행복해 보였다.']], sum: '혼자 노래 부르는 걸 봤다 (음정은 비밀)' },
  { id: 'fish_fail', t: ['fishing'], st: [1, 8], s: [['narr', '형사님 낚싯대가 크게 휘었다!'], ['det', 'surprise', '왔다, 왔다— 대물이다!'], ['narr', '…올라온 건 장화 한 짝이었다. 형사님이 아무도 못 봤는지 주변을 살핀다.'], ['det', 'normal', '(장화를 슬쩍 내려놓으며) …못 본 걸로.']], sum: '대물인 줄 알고 장화를 낚는 걸 봤다' },
  { id: 'lunch_alone', t: ['lunch'], st: [1, 4], s: [['narr', '카페 창가 자리, 형사님이 혼자 점심을 먹고 있다.'], ['det', 'normal', '(맞은편 빈 의자를 한 번 보고) …다음엔 누구랑 먹으면 좋겠다.'], ['narr', '포크로 감귤을 하나씩 골라 맨 마지막에 먹는다. 좋아하는 건 아껴 먹는 타입.']], sum: '좋아하는 걸 맨 마지막에 아껴 먹는 걸 봤다' },
  { id: 'lunch_menu', t: ['lunch'], st: [5, 8], s: [['narr', '형사님이 메뉴판을 보며 진지하게 메모하고 있다.'], ['det', 'normal', '{n}이(가) 이거 좋아했고… 이건 매운 거 못 먹으니까 빼고.'], ['narr', '메모 제목은 「다음 데이트 메뉴 후보」였다.']], sum: '다음 데이트 메뉴를 메모하는 걸 봤다' },
  { id: 'report', t: ['station'], st: [1, 8], s: [['narr', '형사님이 보고서를 쓰다가 펜을 입에 물고 고민 중이다.'], ['det', 'normal', '「특이사항 없음」… 진짜 없나. 아, 까마귀가 또 귤밭 습격. 이것도 써야 하나.'], ['narr', '결국 「까마귀 1마리, 훈방」이라고 적었다.']], sum: '까마귀를 훈방 조치하는 보고서를 봤다' },
  { id: 'doodle', t: ['station'], st: [4, 8], s: [['narr', '근무 일지 귀퉁이에 형사님이 뭔가 끄적이고 있다.'], ['narr', '자세히 보니 작은 하트 안에 「{n}」. 쓰고, 지우고, 다시 쓰고 있다.'], ['det', 'blush', '…뭐 하는 거야, 나. (그래도 안 지운다)']], sum: '근무 일지에 내 이름을 하트 안에 쓰는 걸 봤다' },
  { id: 'sunset', t: ['stroll'], st: [2, 8], s: [['narr', '해변에 앉은 형사님이 노을을 한참 바라보고 있다.'], ['det', 'normal', '…여기 오길 잘했다. 처음엔 좌천인 줄 알았는데.'], ['det', 'smile', '{n} 덕분인가. 하하, 내가 무슨 소리를.']], sum: '노을을 보며 내 덕분이라고 혼잣말하는 걸 봤다' },
  { id: 'dog', t: ['patrol', 'pier', 'stroll'], st: [1, 8], s: [['narr', '백구가 형사님 순찰 모자를 물고 달아났다!'], ['det', 'surprise', '야! 그거 공무 집행 물품이야! 거기 서!'], ['narr', '형사님이 백구를 쫓아 해안길을 한 바퀴 뛰었다. 백구가 이겼다.']], sum: '백구한테 모자 뺏기고 쫓아다니는 걸 봤다' },
  { id: 'flower', t: ['patrol', 'stroll'], st: [4, 8], s: [['narr', '형사님이 길가 들꽃 앞에서 망설이고 있다.'], ['det', 'normal', '(한 송이 꺾으려다) …아니, 꽃은 그냥 두는 게 낫지. 대신 같이 보러 오자고 해야겠다.'], ['narr', '형사님은 휴대폰으로 꽃 사진을 찍고 지도에 위치를 저장했다.']], sum: '나랑 같이 보려고 꽃 위치를 저장하는 걸 봤다' },
  { id: 'workout', t: ['home', 'station'], st: [2, 8], s: [['narr', '사택 마당에서 형사님이 팔굽혀펴기를 하고 있다.'], ['det', 'normal', '…스물아홉, 서른. (헉헉) 하나만 더.'], ['narr', '한 개 더 하다가 풀썩 엎어졌다. 아무도 없는 줄 알고 혼자 웃는다.']], sum: '운동하다 풀썩 엎어지는 걸 봤다' },
  { id: 'gift_box', t: ['home', 'station'], st: [5, 8], s: [['narr', '형사님이 작은 상자를 들고 이리저리 리본을 묶고 있다. 서툴다.'], ['det', 'normal', '이게 왜 나비 모양이 안 되지… 유튜브에선 쉬웠는데.'], ['narr', '상자 위 카드에는 「To. {n}」이라고 쓰여 있다.']], sum: '나한테 줄 선물 포장을 낑낑대며 하는 걸 봤다' },
  { id: 'married_cook', t: ['home'], st: [8, 8], s: [['narr', '부엌에서 형사님이 앞치마를 두르고 요리책을 보고 있다.'], ['det', 'normal', '소금 한 꼬집… 한 꼬집이 몇 그램이야. 형사는 정확한 게 좋은데.'], ['det', 'smile', '여보가 좋아하는 맛… 이 정도면 되겠지.']], sum: '나를 위해 요리책을 보며 고민하는 걸 봤다' },
];
const PEEK_CAUGHT = {
  low: [['surprise', '…어? 언제부터 계셨어요? 아, 아무것도 아니에요. 진짜로요.'], ['normal', '(헛기침) 근무 중입니다. 못 본 걸로 해 주세요.']],
  mid: [['blush', '…다 봤어? 아니, 그건 그냥… 하. 오늘 운 진짜 없다.'], ['blush', '몰래 보는 거 반칙이야. 다음엔 나도 몰래 볼 거야.']],
  high: [['laugh', '들켰다. 언제부터 보고 있었어? …이리 와. 몰래 보지 말고 옆에서 봐.'], ['blush', '훔쳐보는 거 다 알았어. 귀여워서 모른 척했지.']],
};
function peekBand() { const st = S.rel.stage; return st >= 5 ? 'high' : st >= 3 ? 'mid' : 'low'; }
function peekPool() {
  const d = G.det, st = S.rel.stage, seen = (S.peek && S.peek.seen) || [];
  const fit = PEEKS.filter(p => p.t.includes(d.task) && st >= p.st[0] && st <= p.st[1]);
  const fresh = fit.filter(p => !seen.includes(p.id));
  return fresh.length ? fresh : fit;
}
function peekAvail() {
  const P = G.player, d = G.det;
  if (!S || !S.rel.flags.met || S.comp || G.busy || G.dialog || !d.visible || d.map !== P.map || d.talking || d.seat && P.seat && d.seat.bench === P.seat.bench) return false;
  if (S.rel.daily.peek) return false;
  const k = dist(d, P); if (k < 2.3 || k > 7) return false;
  return peekPool().length > 0;
}
async function doPeek() {
  if (!S.peek) S.peek = { seen: [], n: 0 };
  const d = G.det, P = G.player, pool = peekPool(); if (!pool.length) return;
  const sc = pick(pool), n = S.rel.stage >= 5 ? (S.names.meNick || S.name) : S.name;
  S.rel.daily.peek = true; S.peek.seen.push(sc.id); S.peek.seen = S.peek.seen.slice(-12); S.peek.n++;
  P.stop(); if (!P.seat) P.pose = 'stand'; P.lookAt(d);
  G.camFocus = { x: d.x, y: d.y };
  await say('narr', '', '👀 (나무 뒤에 숨어서 슬쩍…)');
  for (const l of sc.s) { const txt = (l.length === 2 ? l[1] : l[2]).replace(/\{n\}/g, n); const tx2 = typeof fixJosa === 'function' ? fixJosa(txt) : txt; if (l[0] === 'narr') await say('narr', '', tx2); else { if (Math.random() < 0.6) d.say(tx2.slice(0, 22) + (tx2.length > 22 ? '…' : ''), 2.2); await say('det', l[1], tx2); } }
  const caught = Math.random() < (S.rel.stage >= 5 ? 0.45 : 0.3);
  if (caught) {
    d.lookAt(P); burst(d, S.rel.stage >= 3 ? 'heart' : 'spark', 3);
    await say('narr', '', '…앗, 형사님이 이쪽을 돌아봤다! 눈이 마주쳤다.');
    const c = await choose(['모른 척 딴 데 보기', '손 흔들기 👋', '도망가기 🏃']);
    const b = peekBand(), r = pick(PEEK_CAUGHT[b]);
    if (c === 2) await say('det', 'laugh', b === 'low' ? '…방금 누가 뛰어간 것 같은데. 기분 탓인가.' : b === 'mid' ? '거기 서! …하하, 도망가는 뒷모습도 다 보인다.' : '도망가 봤자야. 저녁에 다 물어볼 거야.');
    else if (c === 0) await say('det', 'normal', b === 'low' ? '(…못 본 척해 주는 건가.)' : '딴 데 보는 척 다 보인다. 하하.');
    else await say('det', r[0], r[1]);
    addAff(b === 'low' ? 1 : 3);
  } else { addAff(1); await say('narr', '', '형사님은 끝까지 눈치채지 못했다. 나만 아는 비밀이 하나 생겼다. 🤫'); }
  G.camFocus = null; closeDialog();
  memRecent('peek', sc.sum);
  if (S.peek.n === 1 || S.peek.n === 10) addAlbum(S.peek.n === 1 ? '처음 몰래 본 형사님' : '형사님 관찰 일지 10회', 'daily');
}
const _computeActionPeek = computeAction;
computeAction = function () {
  const base = _computeActionPeek();
  try {
    if (!G.started || G.dev || G.decor || G.yard || G.working || G.fishing || !peekAvail()) return base;
    const pk = { label: '몰래 보기', icon: '👀', fn: () => runEvent(doPeek) };
    if (!base) return pk;
    if (base.cands) { if (!base.cands.find(c => c.label === pk.label)) base.cands.push(pk); return base; }
    return Object.assign({}, base, { cands: [base, pk] });
  } catch (e) { return base; }
};
const _ensureV4Peek = ensureV4;
ensureV4 = function (s) { _ensureV4Peek(s); if (!s.peek) s.peek = { seen: [], n: 0 }; return s; };
