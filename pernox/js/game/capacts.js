// 대위와의 상황별 상호작용: 지금 대위가 있는 곳·하는 일에 따라 내가 해 줄 수 있는 일이 달라진다
// (의무실에 오면 처치해 주기, 운동 중엔 보조, 식사 중엔 반찬 얹어 주기 …) + 물어보기(질문 주제) + 상황 대사
'use strict';
PX.CapAct = (() => {
  const U = PX.U, St = PX.St, W = PX.W;
  const G = () => PX.Game;
  async function lines(ls) { const g = G(); g.modal++; await PX.Dlg.runLines(ls, { reply: true }); PX.Dlg.close(); g.modal--; }
  const once = (k) => { const S = St.S; if (S.done[k]) return false; S.done[k] = 1; return true; };
  // 하루 한 번만 호감이 오르는 행동 (같은 날 또 하면 짧은 반응)
  const today = (k) => { const S = St.S; if (S.done['ca_' + k] === S.day) return false; S.done['ca_' + k] = S.day; return true; };
  const has = (id) => St.has(id);

  // ---------- 지금 대위의 상황 ----------
  function ctx() {
    const g = G(), cap = g.cap, S = St.S;
    if (!cap || cap.map !== g.mapId) return null;
    const mode = PX.Cap.mode, sp = cap.atSpot || '', m = cap.map;
    if (mode === 'follow') return 'walk';
    if (mode === 'visit' || mode === 'stay') return 'home';
    if (sp === 'med.patient' || (m === 'med' && cap.seat)) return 'med';
    if (m === 'gym' || sp.startsWith('gym.') || sp.startsWith('base.train')) return 'gym';
    if (m === 'mess') return 'meal';
    if (m === 'ops') return 'ops';
    if (m === 'hangar') return 'hangar';
    if (m === 'q_captain') return sp === 'cap.craft' ? 'craft' : 'rest';
    return null;
  }
  // 수색 다녀온 직후 (평일 17~20시): 먼지투성이 · 지쳐 있음
  const postField = () => { const t = St.S.time.min; return !St.isWeekend() && t >= 17 * 60 && t < 20 * 60; };

  // ---------- 상황 대사 (말 걸기에서 절반쯤은 여기서 나온다) ----------
  const TALK = {
    med: [
      ['C:별거 아니야. 긁힌 거. 근데 간호장교가 안 놔줘.', 'C*:네가 봐 주면 바로 나을 것 같은데.'],
      ['C;:…소독약 냄새 싫어.', 'C:외계 생물은 안 무서운데 주삿바늘은 좀 그래. 비밀이다.'],
      ['C:수색 끝나면 의무동 들르는 게 규정이야. 귀찮아도.', 'C^:오늘은 안 귀찮네. 네가 있어서.'],
      ['C:팔 좀 봐 줄래? 내가 보기엔 멀쩡한데, 다들 아니래.', { q: [['이리 줘 봐요.', 3, ['C*:응. 살살.', 'C:…아니다, 세게 해도 돼. 네 손이면.']], ['엄살이죠?', 1, ['C^:들켰네. 반은 엄살.']]] }],
      ['C:여기 앉아 있으면 다들 날 환자 취급해.', 'C*:너만 그래 줘. 다른 사람은 됐고.'],
    ],
    gym: [
      ['C:백이십. 오늘은 가볍게.', 'C*:보고만 있지 말고 숫자 좀 세 줘. 네가 세면 두 개 더 해.'],
      ['C:운동은 안 하면 불안해. 팀원들 업고 뛰어야 할 때가 있으니까.', 'C^:너 업는 건 운동도 아니고.'],
      ['C!:어, 봤어? 방금 거.', 'C*:안 봤으면 한 번 더 한다. 봐.'],
      ['C:땀 냄새 나지. 미안. 저쪽 가서 말할까?', { q: [['괜찮아요.', 2, ['C^:괜찮다고 했다. 기록해 둔다.']], ['수건부터 써요.', 2, ['C:응. …던져 줘. 받는 건 잘해.']]] }],
      ['C:너도 해 볼래? 자세는 내가 잡아 줄게.', 'C*:핑계 아니야. 진짜 자세 때문이야. 반은.'],
    ],
    meal: [
      ['C:여기 앉아. 네 자리 맡아 놨어.', 'C*:식판 내가 들어 줄까? 농담이야. 반은.'],
      ['C:오늘 국 괜찮아. 조리장 기분 좋은 날이야.', 'C:많이 먹어. 넌 좀 더 먹어야 돼.'],
      ['C!:그거 안 먹어? 그럼 내가.', 'C^:대신 이건 네가 먹어. 제일 맛있는 부분이야.'],
      ['C:밥 먹을 땐 일 얘기 안 해. 내 규칙이야.', 'C*:네 얘기는 해도 돼. 오늘 뭐 했어?'],
      ['C:매운 거 더 줄까? …아, 너 매운 거 약하지. 기억해.'],
    ],
    ops: [
      ['C:보고서 쓰는 중. 십 분만.', 'C*:…옆에 서 있어도 돼. 집중은 안 되겠지만 좋으니까.'],
      ['C:외곽 3구역 지도 다시 그리는 중이야. 모래가 길을 또 바꿨어.', 'C:이런 건 내가 직접 봐야 마음이 놓여.'],
      ['C;:글씨 쓰는 일이 제일 힘들어. 총이 낫지.', { q: [['제가 좀 도울까요?', 3, ['C!:진짜? 그럼 이쪽 서류 좀.', 'C^:넌 진짜 못 하는 게 뭐야.']], ['힘내요, 대위님.', 2, ['C*:방금 그걸로 삼십 분은 버틴다.']]] }],
      ['C:팀원들 다 무사해. 그게 오늘 보고서 첫 줄이야.', 'C:그 줄 쓸 때가 제일 좋아.'],
      ['C:커피 생각난다. 식은 걸로.', 'C*:뜨거운 건 네가 불어 줘야 마셔.'],
    ],
    hangar: [
      ['C:드론 날개 축이 휘었어. 오 상사한테 들키기 전에 내가 고쳐.', 'C*:넌 못 본 거다.'],
      ['C:기계는 정직해. 고친 만큼 돌아가.', 'C:사람 일은 그게 안 돼서 어렵지. 넌 빼고.'],
      ['C:거기 렌치 좀. 아니, 그 옆에. 응, 그거.', 'C^:손발이 맞네. 우리 팀 올래?'],
      ['C:기름 묻었어? 이리 와 봐. …아니, 내 손이 더 더럽네. 미안.'],
    ],
    craft: [
      ['C:뭐 만드냐고? 비밀. 다 되면 네 거야.', 'C*:그러니까 지금은 보지 마. …봐도 돼. 조금만.'],
      ['C:잔해에서 주운 광물이야. 갈면 이런 색이 나와.', 'C:처음엔 총열 닦던 손버릇이었는데, 이젠 이게 더 재밌어.'],
      ['C:손이 커서 작은 건 오래 걸려.', 'C^:오래 걸려도 돼. 줄 사람 생각하면서 하니까.'],
    ],
    rest: [
      ['C:냉각기 최저야. 춥지? 이리 와.', 'C*:담요는 없어. 내가 담요야.'],
      ['C:쉬는 법을 잘 몰라. 가만있으면 손이 심심해.', 'C:네가 옆에 있으면 가만있어져. 신기해.'],
      ['C:막사 좁지. 덩치에 비해.', 'C^:문틀에 머리 박는 소리는 못 들은 걸로 해 줘.'],
    ],
    home: [
      ['C:네 방 냄새 좋다. 뭐 뿌렸어?', 'C*:아무것도 안 뿌렸으면 그냥 네 냄새네. 큰일이다.'],
      ['C:여기 오면 무전 소리가 안 들려. 꺼 놓은 것도 아닌데.'],
      ['C:소파 작다. 다리가 남아.', 'C^:불평 아니야. 네 쪽으로 붙을 핑계야.'],
    ],
    walk: [
      ['C:어디 가고 싶은 데 있어? 없으면 그냥 걷자.', 'C:난 목적지 없는 게 더 좋아. 오래 걸리니까.'],
      ['C:보폭 맞추는 중이야. 내가 너무 빨랐지.', 'C*:이제 네 속도 외웠어.'],
      ['C:사람 많은 데선 안쪽으로 걸어. 바깥은 내 자리야.'],
      ['C:방금 저 사람들 우리 봤다.', 'C^:보라고 해. 난 자랑하고 싶으니까.'],
    ],
    postField: [
      ['C:오늘 외곽 조용했어. 조용해서 더 신경 썼지.', 'C*:돌아오는 길엔 네 생각만 했어. 그건 신경 안 쓰고도 되더라.'],
      ['C;:모래가 입에서도 나온다. 씻고 올걸.', 'C:근데 씻는 시간이 아까웠어. 너 먼저 보려고.'],
      ['C:정시우가 오늘 도마뱀 보고 소리 질렀어. 무전으로 다 들었다.', 'C^:나도 처음엔 그랬어. 걔한텐 비밀이야.'],
      ['C:다친 사람 없어. 나도. 그러니까 그 얼굴 풀어.', 'C*:걱정해 주는 얼굴은 좋은데, 오래 하면 미안해져.'],
      ['C:외곽에서 주운 거야. 은색 돌. 네 눈 색이랑 안 닮았는데 그냥 네 생각 나서.'],
    ],
  };
  // 근처에 있을 때 대위가 먼저 부르는 말풍선
  const HINT = {
    med: ['…{p아}, 나 좀 봐 줘.', '이거 네가 감아 주면 안 돼?', '여기. 나 환자야.'],
    gym: ['숫자 좀 세 줘.', '보조 좀 서 줄래?', '보고 있어? 한 개 더 한다.'],
    meal: ['여기 앉아. 자리 맡았어.', '{p아}, 밥 같이 먹자.'],
    ops: ['…십 분만. 금방 끝나.', '커피 냄새 난다. 네가 가져왔으면 좋겠다.'],
    hangar: ['거기 렌치 좀.', '이리 와 봐. 이거 봐.'],
    craft: ['아직 보면 안 돼. …조금만 봐.'],
    postField: ['다녀왔어.', '나 왔다. 무사히.', '…보고 싶었어.'],
  };
  let hintT = 25;
  function tick(dt) {
    hintT -= dt; if (hintT > 0) return;
    hintT = 22 + Math.random() * 20;
    const g = G(); if (g.modal || !g.cap) return;
    let k = ctx(); if (!k || k === 'walk' || k === 'home' || k === 'rest') { if (!(k && postField())) return; }
    if (postField() && Math.random() < 0.4 && k !== 'med') k = 'postField';
    if (U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) > 7 || g.bubbles.some(b => b.actor === g.cap)) return;
    if (St.S.rel.cap.backoffUntil > St.absMin()) return;
    g.bubble(g.cap, U.fmt(U.pickFresh('hint_' + k, HINT[k] || HINT.postField), PX.Dlg.ctx()), 3.2);
  }

  // ---------- 해 줄 수 있는 일 ----------
  const A = {};
  const gain = (k, n) => { if (today(k)) { St.addAff(n); return true; } return false; };
  A.treat = async () => {
    const S = St.S, medic = S.player.job === 'medic';
    await lines(['C:…네가 해 주는 거야? 그럼 얌전히 있을게.', 'N:대위가 소매를 걷는다. 팔뚝에 긁힌 자국과 모래가 묻어 있다.']);
    const r = await PX.Mini.run('treat', { patient: S.capName + ' 대위' });
    const sc = r && r.score != null ? r.score : (typeof r === 'number' ? r : 0.7);
    St.advance(15);
    await lines(sc >= 0.6 ? [medic ? 'C!:…하나도 안 아파. 역시 전문가네.' : 'C!:…하나도 안 아파. 손이 좋네.', 'C^:다음에도 다치면 너한테 올게. 일부러는 안 다칠게. 아마.'] : ['C;:…읏.', 'C*:아니야, 안 아파. 진짜야. 표정은 원래 이래.', 'C:고마워. 서툴러도 네가 해 준 게 제일 잘 나아.']);
    if (gain('treat', sc >= 0.6 ? 6 : 4) && once('capTreat')) G().memory('대위의 상처', '수색에서 돌아온 대위의 팔을 처치해 줬다. 얌전히 앉아 있는 모습이 낯설었다.', true);
  };
  A.forehead = async () => { await lines(['N:손등을 대위 이마에 대 본다. 뜨겁다. 원래 뜨거운 사람이긴 하다.', 'C*:열 있어? 너 때문일걸.', 'C:…농담이고. 괜찮아. 걱정해 줘서 고마워.']); gain('forehead', 2); };
  A.water = async () => {
    await lines(['N:물병을 건넨다. 대위가 한 번에 절반을 비운다.', U.pick(['C:살 것 같다. 외곽은 물도 모래 맛이야.', 'C^:딱 필요했어. 어떻게 알았어?', 'C*:네가 주니까 물도 달다. …진짜야, 웃지 마.'])]);
    gain('water', 3);
  };
  A.dust = async () => {
    await lines(['N:어깨와 머리에 앉은 붉은 모래를 털어 준다. 대위가 고개를 숙여 준다.', 'C:…이런 거 해 주는 사람 처음이야.', U.pick(['C*:머리도. 거기 더 있어. 아마.', 'C^:다 털었어? 아쉽네.'])]);
    if (gain('dust', 4) && once('capDust')) G().memory('붉은 모래', '수색에서 돌아온 대위의 어깨에서 모래를 털어 줬다. 큰 사람이 고개를 숙였다.', true);
  };
  const FIELD = [
    ['C:3구역 능선까지 갔다 왔어. 발광초 군락이 새로 생겼더라.', 'C*:밤에 보면 예쁠 거야. 안전해지면 데려갈게.'],
    ['C:통신탑 중계기 하나가 또 모래에 묻혔어. 넷이서 파냈어.', 'C:삽질은 군대의 기본이야. 행성이 바뀌어도.'],
    ['C:드리프터 떼가 지나가서 이십 분 엎드려 있었어.', 'C^:그 사이에 이준혁이 농담 세 개 했어. 무전 끄고 싶더라.'],
    ['C:폐쇄 기지 근처는 오늘도 조용했어. 문은 그대로 잠겨 있고.', 'C:그런 데는 조용한 게 좋은 거야.'],
    ['C:박 중사가 발자국 하나 찾았어. 오래된 거. 큰 건 아니야.', 'C:그래도 내일 한 번 더 본다. 두 번 보는 게 우리 방식이야.'],
    ['C:은사막 쪽으로 해 지는 거 봤어.', 'C*:예쁜 거 보면 네가 생각나서 큰일이야. 경계 서야 하는데.'],
    ['C:최민재가 전투식량 남은 거 다 먹었어. 내 것도.', 'C^:그래서 지금 배고파. 밥 같이 먹자.'],
    ['C:모래폭풍 냄새가 났어. 그래서 일찍 접었어.', 'C:무리 안 해. 돌아올 데가 있으니까.'],
  ];
  A.fieldTalk = async () => { await lines(['P:오늘 수색은 어땠어요?', ...U.pick(FIELD)]); gain('fieldTalk', 3); };
  A.spot = async () => {
    await lines(['C:보조 서 줄래? 바 떨어지면 네가 깔리겠지만.', 'C*:안 떨어뜨려. 네가 보고 있는데.']);
    const sc = await PX.Mini.timing({ title: '🏋️ 벤치프레스 보조', help: '대위가 바를 올릴 때(초록 구간) 같이 받쳐 주세요!', rounds: 5, speed: 70, btn: '받쳐 주기!', bg: '#3d4a56' });
    St.advance(15);
    await lines(sc >= 0.6 ? ['C!:호흡 잘 맞는데?', 'C^:다음부터 내 전담 보조야. 거절은 안 받아.'] : ['C:괜찮아. 사실 혼자서도 들 수 있어.', 'C*:네가 서 있는 게 중요한 거야. 힘이 더 나거든.']);
    gain('spot', 4);
  };
  A.count = async () => {
    const n = 18 + Math.floor(Math.random() * 14);
    await lines(['N:하나, 둘, 셋…', `N:…${n - 2}, ${n - 1}, ${n}.`, U.pick(['C;:…후.', 'C!:몇 개야?']), `P:${n}개요.`, U.pick(['C*:네가 세니까 평소보다 다섯 개 더 했어.', 'C^:목소리 좋다. 계속 세 줘. 숫자 말고 아무거나.'])]);
    St.advance(8); gain('count', 3);
  };
  A.towel = async () => { await lines(['N:수건을 건넨다. 대위가 얼굴을 닦다 말고 이쪽을 본다.', U.pick(['C*:닦아 주는 것까지 해 주면 안 돼?', 'C:고마워. 딱 필요했어.']), ...(St.S.rel.cap.stage >= 3 ? ['N:수건으로 이마를 꾹꾹 눌러 닦아 준다.', 'C^:…오늘 운동 제일 잘한 일이 이거다.'] : [])]); gain('towel', 3); };
  A.eat = async () => {
    const g = G(), cap = g.cap;
    if (cap.seat) { const s = (cap.seat.obj.seats || []).find(s => !s.by) || null; if (s) g.player.sitOn(s); }
    await U.sleep(400);
    await lines(['N:대위 옆자리에 앉는다.', U.pick(['C^:왔어? 기다렸어. 숟가락 안 들고.', 'C:여기. 네 자리야. 늘.']), U.pick(['C:오늘 뭐 했는지 말해 봐. 먹으면서 들을게.', 'C*:너랑 먹으면 급식도 외식 같아.'])]);
    St.advance(20); St.S.energy = Math.min(100, St.S.energy + 8); gain('eat', 4);
  };
  A.sidedish = async () => {
    await lines(['N:내 반찬 하나를 대위 식판에 얹어 준다.', 'C!:…이거 나 주는 거야?', U.pick(['C^:그럼 난 이거. 제일 큰 걸로.', 'C*:이런 건 연인끼리 하는 건데. 알고 한 거지?']), 'N:대위가 제일 잘 익은 것을 골라 내 식판에 올려놓는다.']);
    if (gain('sidedish', 4) && once('capSide')) G().memory('반찬 한 점', '반찬을 얹어 줬더니 대위가 제일 큰 걸 돌려줬다.', true);
  };
  A.coffee = async () => {
    if (!has('coffee')) { PX.UI.toast('☕ 커피가 없어요 (PX나 카페에서 살 수 있어요)'); return; }
    St.addItem('coffee', -1);
    await lines(['N:책상에 커피를 내려놓는다.', 'C!:…어.', U.pick(['C^:방금 보고서 세 줄이 저절로 써졌어.', 'C*:식혀서 가져왔네. 나 뜨거운 거 못 마시는 거 기억했구나.']), 'C:고마워. 금방 끝낼게.']);
    gain('coffee', 5);
  };
  A.papers = async () => {
    await lines(['C:진짜 도와준다고? 그럼 이 더미를 구역별로만 나눠 줘.']);
    const r = await PX.Mini.run('sort');
    const sc = r && r.score != null ? r.score : (typeof r === 'number' ? r : 0.7);
    St.advance(20);
    await lines(sc >= 0.6 ? ['C!:벌써? 나 혼자 하면 한 시간인데.', 'C^:퇴근이 당겨졌다. 그 시간 네 거야.'] : ['C:괜찮아, 반은 줄었어.', 'C*:사실 옆에 있어 준 게 더 도움 됐어.']);
    gain('papers', 5);
  };
  A.cheer = async () => { await lines(['P:힘내요, 대위님.', U.pick(['C*:방금 그걸로 삼십 분은 버틴다.', 'C^:…한 번만 더 말해 줘. 녹음하게.', 'C:응. 끝나고 바로 갈게.'])]); gain('cheer', 2); };
  const TOOLS = [['십자드라이버', '🔩 나사가 십자 모양이다'], ['토크 렌치', '🔧 볼트를 정해진 힘으로 조여야 한다'], ['절연 테이프', '⚡ 전선 피복이 벗겨졌다'], ['에어 블로어', '💨 틈에 모래가 꼈다']];
  A.tool = async () => {
    const t = U.pick(TOOLS);
    await lines(['C:거기 공구 좀. ' + t[1].slice(2) + '.']);
    const it = await PX.UI.menu(t[1], TOOLS.slice().sort(() => Math.random() - 0.5).map(x => ({ t: x[0], k: x[0] })));
    if (!it) return;
    await lines(it.k === t[0] ? ['C!:맞아, 그거.', 'C^:말 안 해도 아네. 우리 팀 정비병보다 낫다.'] : ['C:그건 아닌데… 줘 봐. 이걸로도 돼.', 'C*:네가 준 거면 뭐든 써 볼게.']);
    St.advance(10); gain('tool', it.k === t[0] ? 4 : 2);
  };
  A.watchCraft = async () => {
    await lines(['N:대위의 큰 손이 작은 광물 조각을 천천히 간다. 숨소리까지 조심스럽다.', U.pick(['C:…보고 있으면 손 떨려.', 'C:이 부분이 제일 어려워. 너무 갈면 깨져.']), 'C*:다 되면 제일 먼저 보여 줄게. 아니, 줄게.']);
    St.advance(15); gain('watchCraft', 3);
  };
  A.massage = async () => {
    await lines(['N:대위 어깨에 손을 올린다. 돌덩이 같다.', 'C!:…어.', U.pick(['C;:거기. 거기 좀 더.', 'C:…아. 거기 뭉쳤구나. 몰랐어.']), 'C^:너 손 작은데 힘 좋다. 다음엔 내가 해 줄게. 살살.']);
    St.advance(10); gain('massage', 4);
  };
  A.sitBy = async () => { const g = G(); PX.Cap.sitNear(g); if (g.cap.seat) { const s = (g.cap.seat.obj.seats || []).find(s => !s.by); if (s) g.player.sitOn(s); } await lines([U.pick(['C:응. 여기 있어. 아무 말 안 해도 돼.', 'C*:조금 더 붙어. 냉각기 바람 막아 줄게.'])]); gain('sitBy', 2); };
  A.collar = async () => { await lines(['N:대위의 구겨진 옷깃을 펴 준다. 대위가 숨을 멈춘다.', U.pick(['C*:…가까이 오면 미리 말해. 심장 준비하게.', 'C^:매일 구기고 다녀야겠다.'])]); gain('collar', 3); };
  A.snack = async () => {
    const id = ['earthSnack', 'iceDessert', 'fruitTea', 'hotchoco'].find(has);
    if (!id) { PX.UI.toast('🍬 나눠 먹을 간식이 없어요'); return; }
    St.addItem(id, -1);
    await lines([`N:${PX.ITEMS[id].name}을(를) 반으로 나눈다.`.replace('을(를)', U.hasBatchim(PX.ITEMS[id].name) ? '을' : '를'), U.pick(['C:큰 쪽 네가 먹어.', 'C!:나 주는 거야? 네 건데?']), 'C^:반 나눠 먹으니까 두 배로 맛있다. 계산이 이상한데 맞아.']);
    gain('snack', 4);
  };
  A.race = async () => {
    await lines(['P:저기까지 달리기 시합해요!', 'C*:나 수색팀이야. 봐줄 생각 없어.', 'C:…출발은 네가 먼저 해. 셋 세고 갈게.']);
    const win = await PX.Mini.tapRace({ title: '🏃 달리기 시합', help: '버튼을 연타해서 대위보다 먼저!', time: 8, foe: 7, btn: '달려!', left: '나', right: '대위' });
    await lines(win ? ['C;:…졌다.', 'C^:봐준 거 아니야. 네 뒷모습 보느라 늦은 거야.'] : ['C*:이겼다. 소원 하나.', 'C:소원은… 내일도 같이 걷기.']);
    St.S.energy = Math.max(0, St.S.energy - 4); gain('race', 3);
  };

  // ---------- 물어보기 ----------
  const TOPICS = [
    { t: '흉터는 어쩌다 생겼어요?', s: 0, a: [['C:신병 둘 끌고 나오다가. 발톱이 스쳤어.', 'C:둘 다 살았으니까 싼 값이야. 난 이게 마음에 들어.'], ['C:거울 볼 때마다 생각해. 그날 한 발만 늦었으면.', 'C*:안 늦었잖아. 그래서 자랑이야.']] },
    { t: '지구에선 어디 살았어요?', s: 0, a: [['C:계곡 있는 동네. 여름엔 물에서 안 나왔어.', 'C:그래서 더위에 약한가 봐. 여긴 계곡이 없잖아.'], ['C:작은 동네야. 버스가 하루 네 번 왔어.', 'C^:언젠가 같이 가자. 네 번 중에 첫차 타고.']] },
    { t: '왜 군인이 됐어요?', s: 0, a: [['C:덩치가 커서. 진짜야. 다들 그러라고 했어.', 'C:해 보니까 맞더라. 누굴 지키는 게 적성이야.'], ['C:전쟁 끝나고 뭐가 남았는지 보고 싶었어.', 'C*:와 보니까 네가 남아 있더라. 잘 왔지.']] },
    { t: '수색팀은 어떤 팀이에요?', s: 0, a: [['C:악명 높지. 일이 거칠어서 사람도 거칠어.', 'C:근데 한 명도 안 두고 와. 그게 우리 팀 규칙 1번이야.'], ['C:박 중사가 눈, 이준혁이 입, 최민재가 위장, 정시우가 양심이야.', 'C^:나는 등. 다 내 뒤에 세우니까.']] },
    { t: '제일 좋아하는 음식은요?', s: 0, a: [['C:냉삼. 그리고 김치찌개. 그리고 차가운 건 전부.', 'C*:네가 해 준 건 뭐든. 아직 못 먹어 봤지만 미리 정했어.'], ['C:어머니 김치찌개. 조리장 게 팔 할은 따라와.']] },
    { t: '더위를 그렇게 많이 타요?', s: 0, a: [['C:체온이 높아. 의무동에서도 포기했어.', 'C:그래서 내 방 냉각기는 늘 최저야. 넌 담요 들고 와.'], ['C;:이 행성은 나한테 너무해.', 'C^:근데 겨울엔 내가 난로야. 그땐 인기 많아.']] },
    { t: '쉬는 날엔 뭐 해요?', s: 0, a: [['C:잔해 갈아서 뭐 만들어. 손이 심심하면 안 돼서.', 'C*:요즘은 쉬는 날 일정이 하나 늘었어. 너 찾아가기.'], ['C:자. 열두 시간도 자. 깨면 운동하고.', 'C:단순하지? 단순한 게 오래가.']] },
    { t: '무서운 게 있어요?', s: 1, a: [['C:주삿바늘. …웃지 마.', 'C:그리고 무전이 조용해지는 순간. 그건 진짜 무서워.'], ['C:돌아왔는데 아무도 없는 거.', 'C*:그래서 숙소 앞에 서 있는 거야. 네가 있나 확인하려고.']] },
    { t: '제 첫인상은 어땠어요?', s: 1, a: [['C:큰일 났다. 그게 첫 생각이었어.', 'C^:일 년 넘게 지났는데 아직 큰일이야.'], ['C:보고서 세 번 다시 썼어. 그날.', 'C*:집중이 안 돼서. 네 탓이야. 책임져.']] },
    { t: '박 중사님이랑은 어떤 사이예요?', s: 0, a: [['C:칠 년. 말 안 해도 아는 사이.', 'C:그 사람이 없었으면 난 흉터가 아니라 묘비가 있었을 거야.'], ['C:내가 떠들고 그 사람이 듣는 사이.', 'C^:요즘은 내가 네 얘기만 해서 귀찮아해.']] },
    { t: '가족은 어떤 분들이에요?', s: 2, a: [['C:어머니 한 분. 지구에 계셔. 편지를 손으로 쓰셔.', 'C*:네 얘기도 썼어. 답장에 "밥은 잘 먹는 애냐"고 하시더라.'], ['C:아버지는 일찍 가셨어. 덩치는 그쪽 닮았대.', 'C:어머니는 내가 문틀에 머리 박을 때마다 웃으셨어.']] },
    { t: '전역하면 뭐 하고 싶어요?', s: 2, a: [['C:수리점. 작은 거. 뭐든 고치는.', 'C^:옆에 네 가게든 연구실이든 있으면 좋겠다. 점심 같이 먹게.'], ['C:계곡 있는 데서 살 거야. 너는… 올 거지?', 'C*:대답은 천천히 해도 돼. 난 기다리는 거 잘해.']] },
    { t: '요즘 고민 있어요?', s: 2, a: [['C:너 볼 시간이 모자라. 그게 제일 커.', 'C:그다음은 신병들. 아직 겁이 많아. 좋은 건데, 걱정돼.'], ['C;:…내가 장난이 심한가 싶을 때가 있어.', 'C:싫으면 꼭 말해 줘. 한 번 말하면 바로 멈출게.']] },
    { t: '페르녹스에서 제일 좋아하는 곳은요?', s: 0, a: [['C:은사막. 해 질 때. 모래가 다 은색으로 바뀌어.', 'C*:요즘은 네 숙소 앞이 1위야. 경치는 별로인데.'], ['C:식당동. 농담 아니야. 다들 살아서 밥 먹는 데잖아.']] },
    { t: '제 어디가 좋아요?', s: 3, a: [['C:전부라고 하면 성의 없지.', 'C:…웃을 때 눈. 화낼 때 입. 집중할 때 미간. 그리고 나 부를 때 목소리.', 'C^:더 해? 밤새 할 수 있어.'], ['C:내가 덩치 크다고 안 무서워한 거.', 'C*:그리고 무서운 건 무섭다고 말한 거. 그게 좋았어.']] },
    { t: '저한테 바라는 거 있어요?', s: 4, a: [['C:다치지 마. 그리고 밥 거르지 마.', 'C:나머지는 내가 할게.'], ['C:가끔 먼저 찾아와 줘. 내가 맨날 가니까.', 'C^:오늘처럼. 오늘 좋았어.']] },
  ];
  async function askTopic() {
    const S = St.S, st = S.rel.cap.stage;
    S.done.topicSeen = S.done.topicSeen || {};
    const ok = TOPICS.filter(t => st >= t.s);
    // 아직 안 물어본 것부터 네 개
    const pool = ok.slice().sort((a, b) => (S.done.topicSeen[a.t] || 0) - (S.done.topicSeen[b.t] || 0) || Math.random() - 0.5).slice(0, 4);
    const it = await PX.UI.menu('❓ 물어보기', pool.map(t => ({ t: t.t, k: t })));
    if (!it) return;
    const n = S.done.topicSeen[it.k.t] || 0;
    S.done.topicSeen[it.k.t] = n + 1;
    G().cap.setDirTo(G().player.x, G().player.y);
    await lines(['P:' + it.k.t, ...it.k.a[n % it.k.a.length]]);
    if (n < it.k.a.length) St.addAff(2);
  }

  // 지금 상황에서 고를 수 있는 일 목록
  function list() {
    const k = ctx(), S = St.S, st = S.rel.cap.stage, out = [];
    const add = (t, fn, sub) => out.push({ t, fn, sub });
    if (!k) return out;
    if (k === 'med') { add('🩹 상처 처치해 주기', A.treat, '수색에서 긁힌 팔'); add('🌡️ 이마 짚어 보기', A.forehead); }
    if (k === 'gym') { add('🏋️ 운동 보조해 주기', A.spot); add('🔢 개수 세어 주기', A.count); add('🧺 수건 건네주기', A.towel); }
    if (k === 'meal') { add('🍚 옆에 앉아 같이 먹기', A.eat); add('🥢 반찬 얹어 주기', A.sidedish); }
    if (k === 'ops') { add('☕ 커피 가져다주기', A.coffee, has('coffee') ? null : '커피가 필요해요'); add('📋 서류 정리 도와주기', A.papers); add('📣 조용히 응원하기', A.cheer); }
    if (k === 'hangar') { add('🔧 공구 건네주기', A.tool); add('📣 조용히 응원하기', A.cheer); }
    if (k === 'craft') { add('🔩 만드는 것 구경하기', A.watchCraft); add('💆 어깨 주물러 주기', A.massage); }
    if (k === 'rest' || k === 'home') { add('🛋️ 옆에 앉기', A.sitBy); add('💆 어깨 주물러 주기', A.massage); }
    if (k === 'walk') { add('👔 옷깃 정리해 주기', A.collar); add('🍬 간식 나눠 먹기', A.snack); if (PX.MAPS[G().mapId].kind === 'out') add('🏃 달리기 시합', A.race); }
    if (postField()) { add('💧 물 건네주기', A.water); add('🧹 모래 털어 주기', A.dust); add('🗺️ 오늘 수색 어땠는지 묻기', A.fieldTalk); }
    return out;
  }
  // 말 걸기용 상황 대사 묶음 (없으면 null)
  function talkBundle() {
    let k = ctx();
    if (postField() && k !== 'med' && Math.random() < 0.45) k = 'postField';
    const pool = k && TALK[k];
    if (!pool) return null;
    const S = St.S, key = 'ctx_' + k, recent = S.recent[key] || [];
    let cand = pool.map((l, i) => i).filter(i => !recent.includes(i));
    if (!cand.length) cand = pool.map((l, i) => i);
    const i = U.pick(cand);
    S.recent[key] = [i, ...recent].slice(0, Math.max(1, pool.length - 1));
    return { l: pool[i] };
  }
  // ---------- 같이 하기: 내가 뭔가를 하면 근처의 대위가 와서 함께 한다 ----------
  // own: 그 활동에 대위 대사가 이미 있으면 위치만 맞추고 대사는 활동 쪽에 맡긴다
  const JOIN = {
    meal: { sit: 'eat', lines: [['C:같이 먹자. 내 자리 여기.', 'C*:식판 부딪히면서 먹는 거, 이게 부대 데이트야.'], ['C^:오늘 메뉴 괜찮지? 너 그거 좋아하잖아.', 'N:대위가 자기 식판에서 제일 큰 고기를 내 쪽으로 옮긴다.'], ['C:천천히 먹어. 나 먼저 다 먹어도 기다릴게.'], ['C*:너 먹는 거 보면 나도 배불러. 거짓말이야. 나도 먹을 거야.'], ['C:국 식기 전에 먹어. 나 다 먹으면 네 거 넘볼 거야.'], ['N:대위가 말없이 내 쪽으로 물컵을 밀어 준다.', 'C^:목 막힐까 봐.']] },
    sit: { sit: true, lines: [['C:옆자리 비었지?', 'C*:비었다고 해 줘.'], ['C:잠깐 앉아 있자. 다리 쉬게.'], ['N:대위가 옆에 앉는다. 자리가 한쪽으로 살짝 기운다.', 'C^:덩치 탓이야.']] },
    workout: { pose: 'workout', lines: [['C:같이 하자. 자세는 내가 봐 줄게.'], ['C*:나랑 같이 하면 두 배로 힘들어. 각오해.'], ['C:숨 쉬는 거 잊지 마. 들 때 내쉬고.']] },
    hang: { pose: 'workout', own: true }, fish: { stand: true, own: true }, harvest: { stand: true, own: true }, campfire: { sit: true, own: true }, view: { stand: true, own: true }, onsen: { own: true }, tent: { own: true }, sandcastle: { stand: true, own: true }, shoot: { stand: true, own: true },
    shop: { stand: true, lines: [['C:나도 하나. 차가운 걸로.'], ['C*:뭐 사? 계산은 내가 할게. …진짜로.'], ['C:그거 맛있어? 한 입만.'], ['C^:고르는 데 오래 걸리네. 귀엽다. 천천히 골라.']] },
    vending: { stand: true, lines: [['C:나도. 제일 차가운 거.'], ['C*:동전 있어? 내가 넣을게.']] },
    tv: { sit: true, lines: [['C:뭐 봐? 나도 볼래.'], ['C*:영화 무서운 거면 내 팔 잡아. 내가 무서운 거 아니고.'], ['N:대위가 옆에 앉아 팔을 소파 등받이에 걸친다. 자연스럽게, 아주 자연스럽게.']] },
    show: { sit: true, own: true }, claw: { stand: true, lines: [['C:왼쪽. 아니 오른쪽. …아, 그냥 내가 뽑아 줄게.'], ['C*:인형 하나에 이렇게 진지할 일이야? 응. 진지하게 가자.']] },
    arcade: { stand: true, lines: [['C:나랑 한 판 해. 진 사람이 음료수.'], ['C^:오락기 앞에선 계급 없다. 봐주지 마.']] },
    game: { sit: true, lines: [['C:한 판 끼워 줘. 돈은 안 걸고.']] },
    grill: { own: true },
    kitchen: { stand: true, lines: [['C:뭐 만들어? 칼질은 내가 할게. 칼은 잘 다뤄.'], ['C*:요리하는 뒷모습 좋다. 아, 도와줄게. 구경만 하면 혼나니까.']] },
    perform: { stand: true, own: true }, dance: { stand: true, own: true }, cocktail: { stand: true, own: true }, fortune: { stand: true, own: true }, photobooth: { own: true }, busk: { stand: true, own: true },
  };
  function canJoin() {
    const g = G(), cap = g.cap, S = St.S;
    if (!cap || cap.map !== g.mapId || cap.hidden) return false;
    const mode = PX.Cap.mode;
    if (mode === 'follow' || mode === 'visit' || mode === 'stay') return 'with';
    if (['op', 'travel', 'waitOut', 'date', 'paused'].includes(mode)) return false;
    if (PX.Cap.onDuty() && !PX.Cap.isMeal()) return false; // 근무 중엔 안 온다
    const M = PX.Mind;
    if (M && (M.refused('follow') || M.justParted(30))) return false; // 혼자 있고 싶다고 했거나 방금 헤어졌으면 존중
    if (S.rel.cap.stage < 1) return false;
    if (U.dist(cap.x, cap.y, g.player.x, g.player.y) > 12) return false;
    return 'near';
  }
  // useObj 직전에 부른다: 함께할 수 있으면 (활동 대사가 대위를 '함께'로 보도록) 바로 동행으로 바꾸고 다가온다
  function join(kind, o) {
    const J = JOIN[kind]; if (!J) return;
    const how = canJoin(); if (!how) return;
    const g = G(), cap = g.cap, S = St.S;
    if (how === 'near') { PX.Cap.startFollow(); if (PX.Mind) PX.Mind.noteMeet(); }
    const k = 'join_' + kind, here = g.mapId;
    if (PX.Mind) PX.Mind.mem().joinAt = St.absMin(); // 함께하는 동안엔 다른 요청으로 끼어들지 않는다
    setTimeout(async () => {
      if (cap.map !== g.mapId || g.mapId !== here) return;
      if (J.sit) { // 내가 앉을 때까지 기다렸다가 옆자리에 (동행 로직이 옆자리를 찾는다)
        for (let i = 0; i < 20 && !g.player.seat; i++) await U.sleep(300);
        if (g.player.seat && !cap.seat) PX.Cap.sitNear(g);
        for (let i = 0; i < 12 && !cap.seat; i++) await U.sleep(300);
        if (J.sit === 'eat' && cap.seat) cap.doPose('eat', 8);
      }
      else if (J.stand || J.pose) { const m = PX.W.maps[cap.map], p = g.player; const t = PX.Path.nearestWalkable(m, p.x + 1, p.y, 2); if (t) cap.goTo(m, t[0], t[1], () => { cap.setDirTo(p.x, p.y); if (J.pose) cap.doPose(J.pose, 6); }); }
      if (J.own || !J.lines) return;
      await U.sleep(how === 'near' && !J.sit ? 1600 : 400);
      for (let i = 0; i < 20 && g.modal; i++) await U.sleep(250); // 다른 장면이 끝나길 잠깐 기다린다
      if (g.modal || g.mapId !== here || cap.map !== here) return; // 장소가 바뀌었으면 그 대사는 하지 않는다
      const ls = U.pickFresh('join_' + kind, J.lines);
      g.modal++; await PX.Dlg.runLines(how === 'near' && !S.done[k + S.day] ? [U.pickFresh('joinHi', ['C:어, 여기 있었네.', 'C^:마침 잘 만났다.', 'C:나도 끼워 줘.', 'C*:혼자 하게 둘 리가 없지.']), ...ls] : ls, { reply: true }); PX.Dlg.close(); g.modal--;
      if (!S.done[k + S.day]) { S.done[k + S.day] = 1; St.addAff(3); }
      if (kind === 'meal' && !S.done.firstMealTogether) { S.done.firstMealTogether = 1; g.memory('같이 먹은 밥', '식판을 나란히 놓고 먹었다. 대위가 고기를 옮겨 줬다.', true); }
      if (PX.Mind) PX.Mind.noteTalk('join_' + kind);
    }, 500);
  }

  return { ctx, list, askTopic, talkBundle, tick, postField, TALK, TOPICS, FIELD, HINT, join, canJoin, JOIN };
})();
