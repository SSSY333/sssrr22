// 직업별 근무: 근무마다 그날 할 수 있는 업무 셋 중 하나를 골라 한다 (업무마다 다른 미니게임 · 동료 · 대사)
// + 의무팀: 대위 복귀 검진 (17:00, 의무동에 있으면 내가 · 없으면 윤서진 간호장교가)
'use strict';
PX.Jobs = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  async function lines(ls) { const g = G(); g.modal++; try { await PX.Dlg.runLines(ls); } finally { PX.Dlg.close(); g.modal--; } }
  const T = (id, t, sub, mini, opt, intro, good, bad) => ({ id, t, sub, mini, opt, intro, good, bad });
  const SOLDIERS = ['정시우 일병', '최민재 병장', '외곽 경계병', '정비병', '통신병', '보급병', '취사병'];

  // ---------- 업무 목록 ----------
  const TASKS = {
    medic: [
      T('wound', '🩹 외상 처치', '수색 · 훈련 부상자', 'treat', null,
        ['S:yoon:선생님, {pt} 들어와요. 철조망에 긁혔대요.', 'N:소독약 냄새 사이로 붉은 모래가 묻은 팔이 내밀어진다.'],
        ['S:yoon:깔끔하네요. 흉 안 지겠어요.', 'N:환자가 고개를 꾸벅 숙이고 나간다.'], ['S:yoon:괜찮아요, 오늘 손이 좀 굳었네요. 마무리는 제가 볼게요.']),
      T('vaccine', '💉 포자 예방접종 날', '줄 선 병사들에게 차례로', 'timing', { title: '💉 예방접종', help: '팔에 힘을 뺀 순간(초록 구간)에 놓으세요', rounds: 6, speed: 64, btn: '주사!', bg: '#dfeceb', zoneW: 26 },
        ['N:외곽 포자 계절이다. 의무동 앞에 병사들이 길게 줄을 섰다.', 'S:baek:선생님, 오늘 예순두 명이에요. 주사 무서워하는 사람이 반이고요.', 'N:덩치 큰 병사 하나가 벌써 눈을 질끈 감고 있다.'],
        ['S:baek:와, 아무도 안 울었어요. 신기록이에요.', 'N:마지막 병사가 사탕을 받아 들고 쑥스럽게 웃는다.'], ['N:몇 명은 끝내 소리를 질렀다. 백승현이 사탕을 두 개씩 쥐여 준다.']),
      T('checkup', '🩺 정기 건강검진', '증상 듣고 판단하기', 'quiz', { title: '🩺 정기 건강검진', help: '증상을 듣고 먼저 할 일을 고르세요', qs: [
          { q: '모래폭풍 뒤 마른기침을 하는 경계병. 먼저 할 일은?', a: ['산소포화도 재기', '진통제 주기', '그냥 돌려보내기'], c: 0 },
          { q: '외곽 근무 후 눈이 따갑다는 병사. 먼저?', a: ['식염수로 세척', '눈을 비비게 하기', '안대만 붙이기'], c: 0 },
          { q: '발광초에 손이 닿아 손등이 빨개졌다. 먼저?', a: ['찬물로 충분히 씻기', '연고부터 바르기', '붕대로 꽉 감기'], c: 0 },
          { q: '야간 근무 연속으로 어지럽다는 통신병. 먼저?', a: ['혈압 · 혈당 확인', '커피 처방', '체력단련 권유'], c: 0 },
          { q: '제6행성 다녀온 뒤 손가락 끝이 하얘졌다. 먼저?', a: ['미지근한 물로 천천히 데우기', '뜨거운 물에 바로 넣기', '세게 문지르기'], c: 0 }] },
        ['S:yoon:오늘 검진 명단이에요. 수색팀 절반, 정비팀 절반.', 'N:차트 더미 맨 위에 "외곽 노출 시간" 칸이 빨갛게 칠해져 있다.'],
        ['S:yoon:판단 정확했어요. 기록은 제가 정리할게요.'], ['S:yoon:두어 개는 다시 볼게요. 바쁜 날엔 누구나 헷갈려요.']),
      T('stock', '📦 약품 재고 정리', '보급선 들어온 날', 'sort', null,
        ['N:보급선이 내려놓고 간 상자가 의무동 복도를 가득 채웠다.', 'S:baek:항생제, 붕대, 포자 해독제… 라벨이 다 지구 표준이라 헷갈려요.'],
        ['S:baek:선반이 이렇게 반듯한 거 처음 봐요.'], ['S:baek:몇 개는 자리를 바꿔야겠네요. 제가 할게요.']),
      T('emergency', '🚑 응급 호출', '격납고에서 부상자', 'tapRace', { title: '🚑 들것 운반', help: '연타! 의무동까지 빨리 옮기세요', left: '의무동', right: '거리', foe: 6.2, btn: '달려!', bg: '#5a5f66' },
        ['N:무전이 울린다. "격납고, 낙하물 사고. 의무팀 바로 와 주세요."', 'S:yoon:들것 챙겨요! 백 상병, 산소!', 'N:정비병 하나가 다리를 붙잡고 바닥에 앉아 있다. 오지훈 상사가 옆에서 손을 꽉 잡아 주고 있다.'],
        ['S:oh:빨리 와 줘서 고맙소. 저놈 우리 팀 막내요.', 'N:엑스레이 결과, 골절은 아니다. 다들 그제야 숨을 쉰다.'], ['N:조금 늦었지만 큰 부상은 아니었다. 정비병이 오히려 미안하다며 웃는다.']),
      T('heat', '🌡️ 열사병 환자 냉각', '외곽 훈련 직후', 'timing', { title: '🌡️ 체온 내리기', help: '냉각 팩을 맞는 자리(초록 구간)에 대세요', rounds: 5, speed: 72, btn: '❄️', bg: '#3a4a5a' },
        ['N:외곽 행군에서 돌아온 병사가 얼굴이 새빨갛게 달아 들것에 실려 왔다.', 'S:yoon:체온 39.6도. 겨드랑이, 목, 사타구니 쪽으로 냉각 팩 부탁해요.'],
        ['N:체온이 37도대로 내려온다. 병사가 눈을 뜨고 물을 찾는다.', 'S:yoon:잘했어요. 오늘 밤은 여기서 재울게요.'], ['N:조금 오래 걸렸지만 체온은 내려갔다. 수액을 꽂아 두고 지켜본다.']),
    ],
    scout: [
      T('recon', '🛰️ 드론 정찰', '외곽 3구역 능선', 'drone', null,
        ['S:park:오늘은 3구역 능선 너머. 드론으로 먼저 본다.', 'N:화면 너머로 붉은 모래 언덕이 끝없이 이어진다.'], ['S:park:좌표 깔끔하다. 대위님이 좋아하겠다.'], ['S:park:드론 하나 모래에 박았다. 괜찮아. 내가 주워 올게.']),
      T('range', '🎯 사격 훈련', '부대 사격장', 'targets', { title: '🎯 사격 훈련', help: '나타나는 표적을 빠르게 누르세요', time: 20, goal: 18, bg: '#4a4a3a' },
        ['S:lee:오늘 사격 기록 측정이래요. 대위님이 지켜보신대요. 긴장되네.', 'N:표적이 모래바람 사이로 하나씩 일어선다.'], ['S:lee:와, 이거 수색팀 기록 갱신 아니에요?'], ['S:lee:바람이 셌어요. 바람 탓이에요. 진짜로.']),
      T('march', '🥾 외곽 행군', '장비 메고 10km', 'tapRace', { title: '🥾 행군', help: '연타! 대열에서 처지지 마세요', left: '나', right: '대열', foe: 6.4, btn: '한 걸음!', bg: '#7a4a3a' },
        ['S:choi:오늘 행군 10킬로. 물 두 통 챙기세요. 모래 먹으면 목 다 쉬어요.', 'N:등에 진 장비가 한 걸음마다 무거워진다.'], ['S:choi:선두로 들어왔네요. 대위님이 엄지 들었어요.'], ['S:jung:저도 헉헉… 거렸어요. 같이 꼴찌 해서 다행이에요.']),
      T('map', '🗺️ 지형도 정리', '어제 수색 기록', 'sort', null,
        ['S:park:어제 찍은 좌표들 구역별로 정리해 줘. 발광초 군락 · 잔해 · 위험 지대.', 'N:모니터 가득 점들이 흩어져 있다.'], ['S:park:보기 좋다. 이거 그대로 작전실 벽에 건다.'], ['S:park:몇 개는 내가 다시 볼게. 원래 이게 제일 지루한 일이야.']),
      T('survival', '📋 외곽 생존 교육', '신병 앞에서', 'quiz', { title: '📋 외곽 생존 교육', help: '신병 질문에 답해 주세요', qs: [
          { q: '모래폭풍이 다가올 때 제일 먼저?', a: ['가까운 바위 뒤로 엎드리기', '차량으로 뛰기', '무전부터 하기'], c: 0 },
          { q: '드리프터 떼를 만나면?', a: ['움직이지 말고 지나가길 기다리기', '불빛으로 쫓기', '뛰어서 도망치기'], c: 0 },
          { q: '물이 반 남았을 때 귀환까지 하루 거리라면?', a: ['조금씩 나눠 마시고 낮엔 그늘에서 쉬기', '지금 다 마시기', '밤새 걷기'], c: 0 },
          { q: '발광초 군락을 밤에 지날 때?', a: ['손대지 않고 가장자리로 돌아가기', '가운데로 지나가기', '한 송이 꺾어 길 밝히기'], c: 0 }] },
        ['N:신병 다섯 명이 수첩을 들고 앉아 있다. 정시우 일병이 맨 앞자리다.', 'S:jung:질문 있습니다! …많습니다!'], ['S:jung:다 받아 적었습니다! 수첩 두 쪽 썼습니다!'], ['S:jung:…몇 개는 대위님한테 다시 여쭤볼게요.']),
      T('radio', '📻 무전 주파수 맞추기', '중계탑 점검', 'timing', { title: '📻 주파수', help: '잡음이 사라지는 순간(초록 구간)에 고정하세요', rounds: 5, speed: 78, btn: '고정', bg: '#2a3a2a' },
        ['S:lee:3번 중계탑 신호가 또 끊겨요. 주파수 다시 잡아야 해요.', 'N:치직거리는 잡음 사이로 누군가의 목소리가 희미하게 섞인다.'], ['S:lee:깨끗하다! 이제 외곽에서도 잘 들려요.'], ['S:lee:반쯤 잡혔어요. 내일 한 번 더 해요.']),
    ],
    engineer: [
      T('circuit', '🔌 배전반 수리', '막사 전력 불안정', 'circuit', null,
        ['S:kimh:BETA구역 막사 조명이 깜빡인대요. 배전반 같이 봐요.', 'N:배전반 뚜껑을 열자 모래 먼지가 쏟아진다.'], ['S:kimh:불 다 들어왔어요. 막사에서 박수 쳤대요.'], ['S:kimh:일단 임시로 살렸어요. 부품 오면 다시 해요.']),
      T('drone', '🚁 드론 정비 · 시험 비행', '수색팀 드론', 'drone', null,
        ['S:oh:수색팀 드론 로터 갈았어. 시험 비행 해 봐.', 'N:격납고 천장 아래서 드론이 웅웅 떠오른다.'], ['S:oh:좋아. 이대로 수색팀에 넘겨.'], ['S:oh:조금 흔들리네. 균형추 다시 달자.']),
      T('parts', '🔩 부품 분류', '보급선 하역', 'sort', null,
        ['S:oh:보급선 부품 상자 왔다. 규격별로 나눠. 섞이면 한 달 고생한다.', 'N:볼트, 너트, 센서, 회로판이 산처럼 쌓여 있다.'], ['S:oh:깔끔하군. 쓸 만한 놈이야.'], ['S:oh:몇 개 섞였네. 괜찮아, 다음엔 안 섞여.']),
      T('weld', '🔥 방벽 용접', '외곽 방벽 균열', 'timing', { title: '🔥 용접', help: '불꽃이 이음매(초록 구간)에 올 때 누르세요', rounds: 6, speed: 70, btn: '용접', bg: '#3a3f4a' },
        ['N:외곽 방벽 한쪽에 금이 갔다. 모래바람이 그 틈으로 휘파람 소리를 낸다.', 'S:kimh:보호안경 쓰세요. 이음매만 따라가면 돼요.'], ['S:kimh:이 정도면 모래폭풍 열 번은 버텨요.'], ['S:kimh:조금 울퉁불퉁하지만 막혔어요. 그게 중요하죠.']),
      T('generator', '⚙️ 비상 발전기 시동', '정전 대비 점검', 'tapRace', { title: '⚙️ 수동 시동', help: '연타! 크랭크를 돌려 시동을 거세요', left: '회전', right: '저항', foe: 6.6, btn: '돌려!', bg: '#4a4a52' },
        ['S:oh:비상 발전기 점검이다. 시동 모터가 나갔으니 손으로 돌려.', 'N:녹슨 크랭크가 무겁게 버틴다.'], ['N:발전기가 부르릉 깨어난다. 오지훈 상사가 처음으로 웃는다.'], ['N:세 번 만에 시동이 걸렸다. 팔이 덜덜 떨린다.']),
      T('spark', '⚡ 누전 찾기', '식당동 합선', 'targets', { title: '⚡ 누전 찾기', help: '튀는 불꽃을 빠르게 눌러 차단하세요', time: 18, goal: 16, bg: '#2a2a3a', color: '#ffd166' },
        ['N:식당동 주방에서 퍽 소리와 함께 불이 나갔다. 남기철 조리장이 냄비를 든 채 굳어 있다.', 'S:nam:저녁 배식 한 시간 남았어! 부탁해!'], ['S:nam:살았다! 오늘 저녁 고기 한 점 더 줄게.'], ['S:nam:조금 늦어도 괜찮아. 불만 들어오면 돼.']),
    ],
    researcher: [
      T('sort', '🧫 표본 분류', '채집해 온 외계식물', 'sort', null,
        ['S:jo:어제 채집한 표본이에요. 잎 모양 · 발광 여부별로 나눠 주세요.', 'N:유리병마다 작은 식물이 은은하게 빛난다.'], ['S:jo:완벽해요! 이 분류표 논문에 그대로 쓸게요.'], ['S:jo:두어 개는 다시 볼게요. 이 아이들 진짜 헷갈려요.']),
      T('scope', '🔬 현미경 관찰', '발광초 세포', 'timing', { title: '🔬 초점 맞추기', help: '세포가 선명해지는 순간(초록 구간)에 멈추세요', rounds: 5, speed: 60, btn: '찰칵', bg: '#1f3a3a' },
        ['N:현미경 아래 발광초 세포가 별처럼 점멸한다.', 'S:ryu:발광 주기가 길어졌어. 기록 부탁하네.'], ['S:ryu:훌륭해. 이 사진은 학회 표지감이야.'], ['S:ryu:흐려도 괜찮아. 저 친구들도 오늘 기분이 별로인가 보지.']),
      T('field', '🛸 채집 드론 운용', '농업돔 외곽', 'drone', null,
        ['S:jo:농업돔 바깥에 새 군락이 생겼대요. 드론으로 샘플 떠 와요.', 'N:유리돔 너머로 붉은 평원이 펼쳐진다.'], ['S:jo:샘플 상태 최상이에요!'], ['S:jo:반은 모래네요. 그래도 반은 건졌어요!']),
      T('incubator', '🌡️ 배양조 회로 점검', '온도가 오락가락', 'circuit', null,
        ['S:ryu:3번 배양조 온도가 춤을 추는군. 회로 좀 봐 주게.', 'N:배양액 속 이끼가 불안하게 깜빡인다.'], ['S:ryu:이끼가 다시 차분해졌어. 고맙네.'], ['S:ryu:일단 버틸 거야. 내일 기술팀 부르지.']),
      T('quiz', '📚 연구소 견학 안내', '돔시티 학생들', 'quiz', { title: '📚 견학 안내', help: '학생들 질문에 답해 주세요', qs: [
          { q: '발광초는 왜 밤에 빛날까요?', a: ['낮에 모은 빛을 밤에 내보내서', '전기가 흘러서', '사람이 칠해서'], c: 0 },
          { q: '돔 밖 식물을 돔 안에 바로 심으면?', a: ['검역 · 적응 기간을 거쳐야 해요', '바로 잘 자라요', '불법이 아니에요'], c: 0 },
          { q: '향열매는 어디서 처음 재배됐을까요?', a: ['농업돔 체험장', '우주항구', '사막 한가운데'], c: 0 },
          { q: '외계식물을 만졌을 때 지켜야 할 것은?', a: ['장갑 · 손 씻기', '맛보기', '꺾어서 가져가기'], c: 0 }] },
        ['N:노란 모자를 쓴 돔시티 초등학생 열두 명이 연구소 로비에 모였다.', 'S:jo:오늘 안내는 선생님이 해 주세요. 저는 표본 지킬게요!'], ['N:학생들이 박수를 친다. 한 아이가 "커서 연구원 할래요!" 하고 외친다.'], ['N:몇 문제는 아이들이 더 잘 알았다. 그래도 다들 즐거워했다.']),
      T('spores', '🌫️ 포자 포집', '포자 계절 관측', 'targets', { title: '🌫️ 포자 포집', help: '떠다니는 포자를 눌러 포집하세요', time: 18, goal: 16, bg: '#2a3a2a', color: '#b9ffe8' },
        ['S:jo:포자 계절이에요! 관측창 열 테니까 떠다니는 거 다 잡아 주세요.', 'N:은빛 포자가 바람을 타고 둥실둥실 떠오른다.'], ['S:jo:역대 최다 포집이에요! 소장님 기절하시겠다.'], ['S:jo:바람이 너무 셌어요. 그래도 꽤 모았어요.']),
    ],
  };
  // 이번 근무에 할 수 있는 업무 세 가지 (하루 · 근무마다 다르게)
  function offer(jobId, key) {
    const all = TASKS[jobId] || []; let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pool = all.slice(), out = [];
    while (out.length < 3 && pool.length) { h = (h * 1103515245 + 12345) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); }
    return out;
  }
  async function playMini(task, ctx) {
    const M = PX.Mini, o = task.opt || {};
    if (['treat', 'drone', 'circuit', 'sort'].includes(task.mini)) return M.run(task.mini, ctx);
    const r = await M[task.mini](o);
    return r === true ? 1 : r === false ? 0.3 : (typeof r === 'number' ? r : 0.6);
  }
  // 근무: 업무 고르기 → 동료 대사 → 미니게임 → 결과 대사. 점수(0~1)를 돌려준다
  async function shift(jobId, key) {
    const tasks = offer(jobId, key);
    if (!tasks.length) return PX.Mini.run(PX.JOBS[jobId].mini, {});
    const it = await PX.UI.menu('📋 이번 근무 업무', tasks.map(t => ({ t: t.t, sub: t.sub, k: t })));
    if (!it) return null;
    const task = it.k, pt = U.pick(SOLDIERS), fill = (ls) => ls.map(l => l.replace('{pt}', pt));
    await lines(fill(task.intro));
    const score = await playMini(task, { patient: pt });
    await lines(fill(score >= 0.6 ? task.good : task.bad));
    const S = St.S; S.done.jobTasks = S.done.jobTasks || {}; S.done.jobTasks[task.id] = (S.done.jobTasks[task.id] || 0) + 1;
    return score;
  }

  // ---------- 의무팀: 대위 복귀 검진 ----------
  const examKey = () => 'capExam_' + St.S.day;
  const examWin = () => { const t = St.S.time.min; return !St.isWeekend() && t >= 17 * 60 && t < 17 * 60 + 30; };
  const capInMed = () => { const g = G(); return g.cap && g.cap.map === 'med' && !g.cap.hidden && (g.cap.atSpot === 'med.patient' || g.cap.seat); };
  async function capExam() {
    const S = St.S, g = G(), lov = S.rel.cap.stage >= 4;
    S.done[examKey()] = 'me';
    g.modal++;
    try {
      g.cap.setDirTo(g.player.x, g.player.y);
      await PX.Dlg.runLines(PX.Dlg.capPick(lov ? [['N:대위가 검진 의자에 앉아 군복 소매를 걷는다. 팔뚝에 붉은 모래가 아직 붙어 있다.', 'C*:복귀 검진 받으러 왔어. 오늘은 네 차례라서 십 분 일찍 왔어.'], ['N:대위가 의자에 앉자마자 내 가운 소매를 살짝 잡는다.', 'C^:오늘 하루 중에 이 시간이 제일 좋아. 합법적으로 네 앞에 앉아 있는 시간.']]
        : [['N:대위가 검진 의자에 앉아 군복 소매를 걷는다.', 'C:수색팀 {c}, 복귀 검진 받으러 왔습니다. …선생님.', 'C*:이렇게 부르니까 좀 이상하다.'], ['N:대위가 모래를 털며 들어와 검진 의자에 앉는다. 의자가 작아 보인다.', 'C:복귀 검진. 오늘은 별일 없었어. 아마.']]));
      // 1) 문진
      const qs = [{ t: '오늘 어디 아픈 데 없어요?', k: 'pain' }, { t: '물은 충분히 마셨어요?', k: 'water' }, { t: '어젯밤에 잠은 잘 잤어요?', k: 'sleep' }];
      const i = await PX.Dlg.choose(qs);
      await PX.Dlg.say('player', qs[i].t);
      const ANS = { pain: lov ? ['C:무릎이 좀 쑤셔. …아니, 사실 안 아파. 네가 물어봐 주니까 아픈 척하고 싶었어.'] : ['C:왼쪽 어깨가 좀 뻐근해. 드론 케이스 메고 다녀서.'],
        water: lov ? ['C;:…두 통. 아니 한 통 반. 혼나기 전에 자백할게.', 'C*:이제 물 마실 때마다 네 얼굴 생각나. 효과 있어.'] : ['C:두 통. 외곽은 마셔도 금방 마른다.'],
        sleep: lov ? ['C:네가 잘 자라고 보낸 메시지 보고 바로 잤어. 네 시간.', 'C^:…네 시간이면 많이 잔 거야. 그 표정 하지 마.'] : ['C:네 시간. 수색팀 기준으로는 숙면이야.'] };
      await PX.Dlg.runLines(ANS[qs[i].k]);
      // 2) 청진
      await PX.Dlg.runLines(['N:청진기를 대위 가슴에 댄다. 차가운 금속에 대위가 움찔한다.']);
      PX.Dlg.close();
      const sc = await PX.Mini.timing({ title: '🩺 청진', help: '심장 소리에 맞춰(초록 구간) 누르세요', rounds: 4, speed: 66, btn: '♥', bg: '#dfeceb', result: (h) => h >= 3 ? '규칙적인 심음. …조금 빠르다.' : '잡음이 섞였다. 다시 들어 보니 괜찮다.' });
      await PX.Dlg.runLines(PX.Dlg.capPick(lov ? [['N:심장 소리가 규칙적이다. 그런데 조금 빠르다.', 'P:심박이 좀 빠른데.', 'C*:네가 가까이 있잖아. 그건 기록하지 마.'], ['N:청진기 너머로 쿵쿵 소리가 점점 빨라진다.', 'C~:…일부러 그러는 거 아니야. 네가 이렇게 가까이 오면 원래 이래.']]
        : [['N:심장 소리가 규칙적이다. 그런데 조금 빠르다.', 'C;:…뛰어와서 그래. 진짜야.'], ['N:청진기 너머로 묵직한 심장 소리가 들린다.', 'C:이상 없지? 튼튼한 게 내 유일한 장점이야.']]));
      // 3) 상처가 있는 날만 처치
      if (Math.random() < 0.45) {
        await PX.Dlg.runLines(['N:소매 안쪽에 길게 긁힌 자국이 있다. 대위는 말 안 할 생각이었던 얼굴이다.', 'C;:…아, 그거. 별거 아니야. 철조망.']);
        PX.Dlg.close();
        await PX.Mini.run('treat', { patient: S.capName + ' 대위' });
        await PX.Dlg.runLines(PX.Dlg.capPick(lov ? [['C^:하나도 안 아팠어. 너한테는 아파도 안 아프다고 할 거지만.'], ['N:붕대를 다 감자 대위가 붕대 끝을 손가락으로 톡 건드린다.', 'C*:리본으로 묶어 주면 안 돼? …농담이야. 반만.']] : [['C:고마워. 손이 좋다.'], ['C:다음엔 안 긁히게 할게. 아마.']]));
      }
      // 4) 결과
      await PX.Dlg.runLines(PX.Dlg.capPick(lov ? [['N:검진표에 "이상 없음"이라고 적는다. 대위가 고개를 빼고 들여다본다.', 'C*:거기 "보호자 동반 요망"이라고도 적어 줘.'], ['N:검진표에 서명하자 대위가 펜 끝을 슬쩍 잡는다.', 'C^:검진 끝났으니까 이제 선생님 아니고 내 사람.']]
        : [['N:검진표에 "이상 없음"이라고 적는다.', 'C:고생했어, 선생님. 내일도 무사히 올게.'], ['N:검진표에 서명한다. 대위가 일어서다 말고 돌아본다.', 'C*:…네가 봐 주니까 진짜 이상 없는 것 같다.']]));
      St.addAff(sc >= 0.6 ? 5 : 3); S.money += 30; PX.UI.toast('🩺 복귀 검진 완료 · 검진 수당 ₢30');
      if (!S.done.capExamMem) { S.done.capExamMem = 1; g.memory('복귀 검진', '수색에서 돌아온 대위의 심장 소리를 처음 들었다. 생각보다 빨랐다.', true); }
    } finally { PX.Dlg.close(); g.modal--; }
    g.trigger(() => PX.Cap.afterTreat());
  }
  // 의무팀이 아니거나 의무동에 없으면 → 윤서진 간호장교가 검진 (보이면 말풍선)
  function nurseExam() {
    const S = St.S, g = G();
    S.done[examKey()] = 'nurse';
    if (g.mapId === 'med') {
      const nurse = g.npcs.find(n => n.id === 'yoon' && n.map === 'med');
      if (nurse) g.bubble(nurse, U.pick(['대위님, 팔 이리 주세요.', '물 두 통 드셨다면서요. 한 통이죠?', '오늘도 이상 없어요. 가셔도 돼요.']), 3);
      setTimeout(() => g.bubble(g.cap, U.pick(['…살살요.', '고맙습니다, 윤 중위.', '네. 이상 없습니다.']), 2.6), 1600);
    }
    if (S.player.job === 'medic' && S.rel.cap.stage >= 2) S.done.examMissed = S.day; // 나중에 만나면 한마디
  }
  function minute() {
    const S = St.S, g = G();
    if (!S || !g || !g.cap) return;
    const done = S.done[examKey()];
    if (!done && examWin() && capInMed()) {
      const medicHere = S.player.job === 'medic' && g.mapId === 'med' && !g.modal && !g.queue.length && !(PX.Op && PX.Op.inField());
      if (medicHere) { S.done[examKey()] = 'asked'; g.trigger(async () => { const ok = await PX.UI.ask('🩺 복귀 검진', `${S.capName} 대위가 수색에서 돌아와 검진받으러 왔어요.`, '검진하기', '윤 중위에게 맡기기'); if (ok) await capExam(); else nurseExam(); }); }
      else if (S.time.min >= 17 * 60 + 12) nurseExam();
    }
    // 내가 검진 못 한 날, 저녁에 만나면 한마디
    if (S.done.examMissed === S.day && g.cap.map === g.mapId && !g.modal && S.time.min >= 17 * 60 + 30 && U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) < 3) {
      S.done.examMissed = null;
      const lov = S.rel.cap.stage >= 4;
      g.trigger(() => lines([PX.Dlg.capPick(lov ? ['C:오늘 검진은 윤 중위가 해 줬어. …솔직히 네 손이 더 좋아.', 'C*:검진 의자에 앉았는데 네가 없더라. 심박이 평소대로 나왔어. 재미없게.'] : ['C:오늘 검진은 윤 중위가 봐 줬어. 이상 없대.', 'C:의무동 갔는데 너 없더라. 바빴구나.'])]));
    }
  }
  const examWanted = () => St.S.player.job === 'medic' && examWin() && capInMed() && !['me'].includes(St.S.done[examKey()]);
  return { shift, offer, TASKS, capExam, minute, examWanted };
})();
