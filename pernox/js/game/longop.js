// 장기작전: 일정 · 직업별 동행 · 원거리 단말 메시지 · 사진 · 그리움 · 복귀 절차 · 합동작전 일과
// 대위는 작전 중에 순간이동해서 나타나지 않는다. 멀리 있으면 단말로만 반응한다.
'use strict';
PX.Op = (() => {
  const U = PX.U, St = PX.St, Cal = PX.Cal;
  const G = () => PX.Game;
  const now = () => St.absMin();
  const op = () => St.S.cap.op || null;
  const DAY = 1440;
  const AREAS = ['외곽 3구역 능선', '붉은 협곡 지대', '은사막 북쪽 가장자리', '폐쇄 통신탑 일대', '모래폭풍 관측 구역'];
  const SQUAD = ['park', 'lee', 'choi', 'jung'];

  // ---------- 일정 ----------
  // 열흘에 한 번꼴, 이틀 전에 잡히고 대위가 미리 말해 준다
  function maybeSchedule() {
    const S = St.S, o = op();
    if (o && o.phase !== 'done') return;
    if (S.rel.cap.stage < 1) return;
    const last = o ? o.end : -1e9;
    if (now() - last < 9 * DAY || Math.random() > 0.14) return;
    plan();
  }
  function plan(opts = {}) {
    const S = St.S, job = S.player.job;
    const days = opts.days || U.pick([3, 4, 5, 5, 6, 7, 7, 10]);
    const startDay = S.day + (opts.inDays != null ? opts.inDays : 2);
    // 직업별 동행: 수색팀은 함께 · 군의관·정비는 가끔 · 민간 연구원은 승인된 공동 조사일 때만
    const p = { scout: 1, medic: 0.25, engineer: 0.25, researcher: 0.12 }[job] || 0;
    const joint = opts.joint != null ? opts.joint : Math.random() < p;
    S.cap.op = { phase: 'planned', startDay, start: startDay * DAY + 6 * 60, days, end: (startDay + days) * DAY + 14 * 60, joint, area: U.pick(AREAS), comms: Array.from({ length: days + 1 }, (_, i) => i === 0 || Math.random() > 0.2), sent: {}, queue: [], jointDone: {}, told: false, role: joint ? { scout: '수색팀 소위', medic: '의료 지원', engineer: '현장 기술 지원', researcher: '공동 안전구역 조사' }[job] : null };
    return S.cap.op;
  }
  const isAway = (id) => { const o = op(); return !!(o && o.phase === 'away' && (id === 'cap' || (SQUAD.includes(id) && !o.joint) || (o.joint && SQUAD.includes(id)))); };
  const inField = () => { const o = op(); return !!(o && o.phase === 'away' && o.joint); };
  const dayIdx = () => { const o = op(); return o ? Math.floor((now() - o.start) / DAY) + 1 : 0; };

  // 매 분 호출
  function tick() {
    const S = St.S, o = op(), t = now(), g = G();
    dailyTick();
    if (!o) return;
    if (o.phase !== 'away' && o.outbox && o.outbox.length) { for (const id of o.outbox) { const m = S.messages.find(x => x.id === id); if (m && m.st === 'sent') m.st = 'read'; } o.outbox = []; } // 돌아왔으면 직접 얘기한다
    if (o.phase === 'planned') {
      // 전날 저녁까지 못 만났으면 단말로 알린다
      if (!o.told && t >= o.start - DAY + 18 * 60 - 6 * 60) { o.told = true; send(o.joint ? { t: `작전 명령 내려왔어. 내일 아침 6시, ${o.days}일. 이번엔 같이 간다. 장비 챙겨.`, r: [['네, 준비할게요.', 2, '좋아. 내 뒤로 두 걸음. 그것만 기억해.'], ['떨려요.', 2, '정상이야. 내가 있어.']] } : { t: `나 내일 아침에 장기작전 나가. ${o.days}일. 위치는 말 못 해. 미안.`, r: [['조심히 다녀와요.', 3, '응. 꼭 돌아올게. 약속.'], ['가기 전에 얼굴 봐요.', 3, '이따 저녁에 갈게. 기다려.']] }); }
      if (t >= o.start) depart();
      return;
    }
    if (o.phase === 'away') {
      if (!o.joint) { awayMessages(); outboxTick(); St.S.cap.mem && (St.S.cap.mem.longing = Math.min(100, (St.S.cap.mem.longing || 0) + 100 / (o.days * DAY))); }
      if (t >= o.end) o.joint ? jointReturn() : returnHome();
      return;
    }
    if (o.phase === 'return') returnTick();
  }

  // ---------- 출발 ----------
  function depart() {
    const S = St.S, o = op(), g = G();
    o.phase = 'away';
    PX.Cap.release(null, 0);
    if (o.joint) { g.trigger(jointDepart); return; }
    PX.Cap.moveTo(null); g.cap.map = null; PX.Cap.mode = 'op';
    send({ t: '출발했어. 수송선 안이야.', photo: 'ship', r: [['조심히 다녀와요.', 2, '응. 도착하면 연락할게.'], ['벌써 보고 싶어요.', 3, '…출발한 지 십 분 됐어. 나도.']] });
  }
  // ---------- 원거리 메시지 ----------
  const MSG = {
    1: [{ t: '아침 먹었어? 난 먹었어. 맛은 없었고.', r: [['먹었어요.', 1, '잘했어. 나 없다고 거르지 마.'], ['아직이요.', 1, '지금 먹어. 확인한다.']] }, { t: '도착했다. 야영지 치는 중. 바람이 엄청 분다.', photo: 'camp', r: [['조심해요.', 2, '응. 텐트가 날아가면 사진 보내 줄게.']] }, { t: '수송차 타고 이동 중. 창밖이 온통 모래야. 너 사진은 아까 다 봤어.', r: [['안전하게 가요.', 2, '응. 도착하면 또 보낼게.'], ['몇 번 봤어요?', 2, '…세다가 까먹었어.']] }, { t: '첫날이라 다들 긴장했어. 내가 제일 안 긴장한 척하는 중.', r: [['척이에요?', 2, '…응. 너 보고 싶어서 좀 들떴어.'], ['대위님 최고.', 2, '팀장이니까. 너한텐 그냥 나지만.']] }, { t: '야영지에서 보는 첫 노을. 사막이 은색으로 바뀌어.', photo: 'desert', r: [['예뻐요.', 2, '은사막 전망대보다 더 넓어. 다음엔 같이 보자.'], ['사진 고마워요.', 2, '하루에 한 장은 꼭 보낼게.']] }],
    2: [{ t: '오늘 하루 종일 걸었어. 다리 아프다.', r: [['고생했어요.', 2, '그 말 들으니까 반은 나았다.'], ['주물러 주고 싶다.', 3, '돌아가면 해 줘. 기억해 둔다.']] }, { t: '여긴 바람이 엄청 불어. 모래가 안 들어간 데가 없어.', photo: 'desert', r: [['물 많이 마셔요.', 2, '응. 너 말 들으려고 방금 마셨어.']] }, { t: '너 지금 뭐 해?', r: [['일하는 중이에요.', 1, '열심히 하네. 나도 열심히 할게.'], ['대위님 생각이요.', 3, '…지금 그 말 때문에 경계 서다가 웃었어.']] }, { t: '오늘 처음으로 외계 생물 발자국 찾았어. 무해한 거야. 걱정 마.', r: [['신기하다.', 2, '연구원들이 좋아하겠다. 너한테 먼저 말한 거야.'], ['진짜 괜찮아요?', 2, '응. 크기가 고양이만 해.']] }, { t: '정시우가 오늘 처음으로 길 안내 맡았어. 잘했어. 나 칭찬했다.', photo: 'squad', r: [['칭찬 잘했어요.', 2, '너한테 배운 거야. 칭찬하는 법.'], ['대위님 좋은 팀장이에요.', 3, '…그 말 오늘 하루 최고였어.']] }],
    3: [{ t: '이상한 광물 하나 찾았어. 네가 좋아할 것 같아서 챙겨 놨어.', photo: 'mineral', r: [['예뻐요!', 2, '실물이 더 예뻐. 너처럼.'], ['위험한 건 아니죠?', 2, '박 중사가 두 번 확인했어.']] }, { t: '오늘은 통신이 좀 불안정해. 답 늦어도 걱정하지 마.', r: [['알겠어요.', 1, '고마워.']] }, { t: '반쯤 왔어. 남은 날 세는 중. 너도 세고 있어?', r: [['세고 있어요.', 3, '같이 세니까 금방 가겠다.'], ['안 셌어요.', 1, '그럼 내가 세 줄게. 너 몫까지.']] }, { t: '오늘은 바람이 안 불어서 수색 빨리 끝났어. 남는 시간에 너 사진 봤어.', r: [['저도 대위님 사진 봤어요.', 3, '…같은 시간에? 좋다.'], ['쉬어요 좀.', 1, '사진 보는 게 쉬는 거야.']] }, { t: '박 중사가 요즘 내 표정이 바뀌었대. 좋은 쪽으로.', r: [['왜요?', 2, '알면서. 너 때문이지.'], ['다행이에요.', 2, '응. 나도 그렇게 느껴.']] }],
    late: [{ t: '오늘은 진짜 네 목소리 듣고 싶네.', r: [['저도요.', 3, '돌아가면 하루 종일 말 걸어 줘.']] }, { t: '이제 며칠 안 남았어.', r: [['기다릴게요.', 3, '응. 그 말 들고 버틴다.']] }, { t: '돌아가면 안아 줘. 오래.', r: [['약속해요.', 3, '약속받았다. 저장.'], ['얼마나요?', 2, '내가 됐다고 할 때까지. 안 할 거지만.']] }, { t: '짐 정리 시작했어. 너 줄 거 먼저 챙겼어.', photo: 'mineral', r: [['뭔데요?', 2, '비밀. 손으로 직접 줄 거야.'], ['고마워요.', 2, '아직 받지도 않았는데 고마워하지 마. 받고 해.']] }, { t: '돌아가면 첫날은 너 일 끝날 때까지 앞에서 기다릴 거야.', r: [['좋아요.', 3, '문 앞에서 제일 먼저 손 흔들게.'], ['피곤할 텐데 쉬어요.', 2, '너 보는 게 쉬는 거라니까.']] }, { t: '오늘 팀원들이 돌아가면 뭐 할지 얘기했어. 나는 네 얘기만 했대.', photo: 'squad', r: [['뭐라고 했어요?', 2, '냉삼, 산책, 별 보기. 다 너랑.'], ['부끄러워요.', 2, '다들 이미 알아. 괜찮아.']] }, { t: '수색 마지막 구역 끝냈어. 이제 정리만 남았어.', r: [['수고했어요!', 3, '그 말 듣고 싶어서 먼저 보냈어.'], ['조심히 정리해요.', 2, '응. 끝까지 조심할게.']] }, { t: '꿈에 네가 나왔어. 같이 냉삼 먹는 꿈. 깨니까 배고프더라.', r: [['곧 진짜 먹어요.', 3, '응. 첫날 저녁 예약.'], ['꿈에서 몇 점 먹었어요?', 2, '네가 다 먹었어. 꿈에서도 네 접시에 다 놔 줬거든.']] }],
    last: [{ t: '내일 돌아가. 수송선 오후 도착.', photo: 'selfie', r: [['마중 나갈게요.', 3, '…보고하고 씻고 갈게. 냄새나니까. 기다려.'], ['무사히 와요.', 2, '응. 늘 그랬듯이.']] }, { t: '마지막 날 밤이야. 내일이면 본다. 잠이 안 와.', photo: 'night', r: [['저도요.', 3, '같이 안 자는 거네. 그래도 자. 내일 얼굴 붓는다.'], ['얼른 자요.', 1, '알았어. 눈 감으면 너 보일 거야.']] }, { t: '짐 다 쌌어. 너 줄 광물도 제일 위에 넣었어.', photo: 'mineral', r: [['기대돼요.', 2, '내일 손에 쥐여 줄게.'], ['조심히 와요.', 2, '응. 늘 그랬듯이.']] }, { t: '내일 수송선 도착하면 보고부터 하고 바로 갈게. 오래 안 걸려.', r: [['기다릴게요.', 3, '기다려 줘. 이번엔 내가 뛰어간다.'], ['천천히 와요.', 2, '…천천히는 못 하겠다.']] }],
    meal: [{ t: '점심은 전투식량 3번. 그나마 제일 맛있는 거야.', photo: 'meal', r: [['맛있게 먹어요.', 1, '네가 먹으라니까 맛있게 먹을게.'], ['돌아오면 냉삼 먹어요.', 3, '그거 들고 버틴다. 진짜로.']] },
      { t: '점심시간. 이준혁이 전투식량으로 비빔밥 만든다고 난리야.', r: [['맛있대요?', 1, '…의외로 먹을 만해. 분하다.'], ['대위님도 해 봐요.', 2, '나는 그냥 냉삼 생각하면서 먹을래.']] },
      { t: '바람 피해서 바위 뒤에서 밥 먹는 중. 모래가 반찬이야.', photo: 'desert', r: [['꼭꼭 씹어요.', 2, '모래도 꼭꼭 씹을게. 농담이야.'], ['얼른 와서 제대로 먹어요.', 3, '응. 너랑 먹는 밥이 제일 맛있어.']] },
      { t: '오늘 점심 김치찌개맛 전투식량. 맛이 김치찌개를 흉내만 내.', r: [['돌아오면 진짜 김치찌개 먹어요.', 3, '식당 김치찌개 나오는 날로 맞춰서 돌아갈게.'], ['그래도 먹어요.', 1, '응. 다 먹었어. 확인 사진은 생략.']] },
      { t: '너 점심 뭐 먹었어? 나만 맛없는 거 먹는 거 억울해서 물어보는 거야.', r: [['식당 밥이요.', 1, '부럽다. 진심으로.'], ['비밀이에요.', 2, '…냉삼이지. 다 알아.']] },
      { t: '정시우가 자기 초콜릿 나눠 줬어. 팀장이라고. 착한 애야.', r: [['귀여워요.', 2, '응. 너한테도 하나 남겨 두라고 했어.'], ['대위님도 나눠 줘요.', 2, '내 건 이미 너한테 갈 거라 못 줘.']] },
      { t: '물 끓여서 커피 탔어. 얼음이 없어서 이건 커피가 아니야.', r: [['그래도 마셔요.', 1, '응. 마시면서 아이스커피 상상 중.'], ['돌아오면 얼음 가득 사 줄게요.', 3, '그 말 저장했다. 컵 반이 얼음.']] },
      { t: '밥 먹고 십 분 쉬는 중. 이 십 분을 너한테 쓰는 중.', r: [['고마워요.', 2, '아니야. 내가 좋아서 하는 거야.'], ['푹 쉬어요.', 2, '너한테 메시지 보내는 게 쉬는 거야.']] },
      { t: '박 중사가 전투식량 4번을 제일 맛있다고 우겨. 난 3번파야.', photo: 'squad', r: [['저는 4번이요.', 1, '…배신이다. 돌아가서 토론하자.'], ['3번이요.', 2, '역시 너는 내 편이야.']] },
      { t: '데워 먹는 발열팩이 안 데워져서 찬밥 먹었어. 난 차가운 거 좋아하니까 괜찮아.', r: [['배탈 조심해요.', 2, '응. 따뜻한 물도 마셨어.'], ['역시 대위님.', 1, '차가운 거 사랑해. 너 다음으로.']] }, { t: '오늘 점심 메뉴 이름이 "행복한 닭고기"야. 하나도 안 행복해.', r: [['그래도 먹어요.', 1, '먹었어. 이름값은 못 하더라.'], ['돌아오면 진짜 맛있는 거 먹어요.', 3, '네가 고르는 걸로. 다 좋아.']] }, { t: '밥 먹는데 도마뱀이 옆에 앉았어. 한 입 달라는 얼굴로.', r: [['줬어요?', 2, '규정상 안 돼. …눈 마주쳐서 힘들었어.'], ['귀엽다.', 2, '너도 보면 좋아할 거야.']] }, { t: '점심 먹고 단말 켰는데 네 메시지 없어서 서운할 뻔했어. 아직 근무 중이지?', r: [['네, 근무 중이에요.', 1, '응. 열심히 해. 나도 오후 수색 간다.'], ['지금 보냈어요!', 3, '…방금 왔다. 오후 힘난다.']] }, { t: '매운 소스 아껴 둔 거 오늘 다 썼어. 이제 남은 날은 심심한 맛이야.', r: [['돌아오면 매운 거 먹어요.', 2, '냉삼에 매운 양념. 예약.'], ['참아요.', 1, '…참을게. 너 생각하면서.']] }],
    night: [{ t: '여긴 별이 엄청 많아. 너도 보고 있어?', photo: 'night', r: [['네, 보고 있어요.', 3, '같은 거 보는 중이네.']] }, { t: '잘 자. 꿈에서 보자.', r: [['잘 자요.', 2, '응. 내 꿈 꿔.']] }, { t: '경계 근무 중. 졸리다. 너 생각하면 안 졸려.', r: [['힘내요.', 2, '두 시간 남았다. 버틴다.']] },
      { t: '텐트 안. 다들 코 고는 소리 경연 대회 중이야. 1등은 박 중사.', r: [['귀마개 해요.', 1, '귀마개 대신 네 메시지 보는 중.'], ['푹 자요.', 2, '응. 너도. 따뜻하게.']] },
      { t: '여기 밤엔 은빛 이끼가 빛나. 발밑이 다 반짝여.', photo: 'night', r: [['예쁘겠다.', 2, '응. 너 보여 주고 싶어서 한참 봤어.'], ['사진 더 보내 줘요.', 2, '통신 좋을 때 보낼게. 약속.']] },
      { t: '오늘 하루도 무사히 끝. 이 말 너한테 제일 먼저 하고 싶었어.', r: [['고생했어요.', 3, '그 말 들으려고 하루 버텼어.'], ['내일도 무사히요.', 2, '응. 약속.']] },
      { t: '침낭이 작아. 다리가 밖으로 나와. 193의 숙명이야.', r: [['귀여워요.', 2, '…다리 밖으로 나온 게 귀여워? 알았어.'], ['감기 조심해요.', 2, '난 추운 거 좋아해. 괜찮아.']] },
      { t: '야간 정찰 끝. 손 시려. …아니, 난 추운 거 좋아하지. 그래도 너 손은 생각나.', r: [['돌아오면 손 잡아 줄게요.', 3, '그거면 다 녹는다.'], ['장갑 껴요.', 1, '꼈어. 네가 말하니까 한 겹 더.']] },
      { t: '오늘 밤은 바람이 조용해. 이런 밤엔 네 목소리 생각나.', r: [['목소리 녹음해서 보낼까요?', 3, '…진짜? 보내 줘. 매일 들을 거야.'], ['저도 생각나요.', 2, '같은 시간에 같은 생각. 좋다.']] },
      { t: '정시우가 무서운 얘기 해서 다들 못 자. 나는 네 생각 해서 못 자.', r: [['얼른 자요.', 1, '알았어. 지금 바로 잘게.'], ['둘 다 핑계죠?', 2, '…들켰다.']] },
      { t: '하늘에 우주항구 셔틀 불빛 지나간다. 저거 돔시티 쪽으로 가는 거야.', photo: 'night', r: [['저도 볼게요.', 2, '응. 같은 불빛 보자.'], ['그거 타고 오면 좋겠다.', 3, '나도. 며칠만 기다려.']] }, { t: '모닥불 대신 발열팩 하나 켜 놓고 다 같이 둘러앉았어. 귀엽지.', photo: 'camp', r: [['귀여워요.', 2, '이 덩치들이 발열팩 하나에 붙어 있어. 상상해 봐.'], ['따뜻해요?', 1, '나는 원래 안 추워. 다른 애들이 붙어.']] }, { t: '내일 일정 브리핑 끝. 이제 내 시간. 내 시간은 너한테 쓴다.', r: [['기다렸어요.', 3, '…기다렸다는 말 제일 좋아.'], ['일찍 자요.', 1, '오 분만 너랑 얘기하고 잘게.']] }, { t: '오늘 밤 하늘에 제4행성이 엄청 밝아. 광물온천 있는 데.', photo: 'night', r: [['같이 가고 싶다.', 3, '휴가 맞추자. 진짜로.'], ['보여요.', 2, '그럼 지금 같은 별 보는 거다.']] }, { t: '침낭 안에서 몰래 단말 보는 중. 박 중사한테 걸리면 혼나.', r: [['얼른 자요!', 1, '…응. 마지막으로 하나만. 잘 자.'], ['같이 혼나요.', 2, '너는 안 혼나. 내가 다 맞을게.']] }, { t: '여기 밤바람 소리가 파도 소리 같대. 바다 본 적 있는 애가 그러더라.', r: [['언젠가 같이 바다 가요.', 3, '제3행성 해양돔. 약속.'], ['신기하다.', 2, '눈 감고 들으면 진짜 바다 같아.']] }, { t: '오늘 하루 중에 제일 좋았던 거? 지금. 너한테 보내는 거.', r: [['저도 지금이요.', 3, '같은 답. 좋다.'], ['다른 건 없었어요?', 1, '있었지. 근데 이게 1등이야.']] }],
    mid: [{ t: '보고 싶다.', r: [['저도요.', 3, '…지금 근무만 아니면 뛰어갔어.'], ['얼마 안 남았어요.', 2, '응. 세고 있어.']] }, { t: '나 돌아가면 하루는 네 옆에 붙어 있을 거야.', r: [['좋아요.', 3, '취소 불가다.'], ['하루는 너무 길어요.', 1, '그럼 두 시간만 붙어 있을게. 네가 싫다고 하면.']] }, { t: '박 중사가 나보고 단말 좀 그만 보래.', photo: 'squad', r: [['안 돼요. 계속 봐요.', 3, '명령 접수.'], ['박 중사님 말 들어요.', 1, '…알았어. 대신 밤에 볼게.']] }, { t: '정비하다가 손 긁혔어. 별거 아니야.', photo: 'gear', r: [['소독했어요?', 2, '했어. 네가 물어볼 줄 알았어.'], ['조심 좀 해요!', 2, '응. 혼나니까 좋네.']] },
      { t: '오늘 드론으로 협곡 지도 그렸어. 생각보다 예쁘더라.', photo: 'desert', r: [['보고 싶어요.', 2, '돌아가서 보여 줄게. 화면 크게.'], ['대단해요.', 2, '칭찬받았다. 팀원들한테 자랑해야지.']] },
      { t: '최민재가 위장망 치다가 자기가 갇혔어. 다들 오 분 동안 웃었어.', photo: 'squad', r: [['ㅋㅋ 귀엽다.', 2, '본인은 안 웃었어. 나중에 너한테도 말해 줄게.'], ['구해 줬어요?', 1, '응. 사진 찍고 나서.']] },
      { t: '여기 바위가 하트 모양이야. 진짜야. 사진 보낼게.', photo: 'desert', r: [['진짜 하트네!', 3, '그치. 너 생각나서 십 분 서 있었어.'], ['억지 아니에요?', 1, '…각도 맞추면 하트야. 믿어 줘.']] },
      { t: '오늘 도마뱀이 내 군화 위에서 낮잠 잤어. 못 움직였어.', r: [['귀여워요!', 2, '응. 결국 이십 분 서 있었어.'], ['사진은요?', 2, '못 찍었어. 움직이면 깰까 봐.']] },
      { t: '외곽 기온 영하야. 다들 춥다는데 나만 신났어.', r: [['역시 대위님.', 1, '추위 최고. 근데 너는 따뜻하게 있어.'], ['감기 걸려요.', 2, '안 걸려. 돌아가서 네 옆에 있어야 하니까.']] },
      { t: '이준혁이 너 안부 물어봐. 다들 우리 사이 알아.', r: [['안부 전해 줘요.', 2, '전했어. 다들 부러워해.'], ['부끄러워요.', 2, '나는 자랑스러운데.']] },
      { t: '수색 루트 바꿨어. 덕분에 하루 일찍 끝날 수도 있대. 기대는 하지 말고.', r: [['기대할래요.', 3, '…그럼 진짜 일찍 끝낸다.'], ['무리하지 마요.', 2, '응. 안전이 먼저. 그다음이 너.']] },
      { t: '돌아가면 뭐 먹고 싶어? 네가 고르는 거 먹으러 가자.', r: [['냉삼이요.', 2, '역시. 예약해 둔다.'], ['향열매 카페요.', 2, '얼음 가득 시켜 줄게.']] },
      { t: '모래 폭풍 지나갔어. 다들 무사해. 걱정할까 봐 먼저 말해.', photo: 'desert', r: [['다행이다.', 2, '응. 너 생각나서 제일 먼저 보냈어.'], ['보고 싶어요.', 3, '나도. 폭풍보다 그게 더 셌어.']] },
      { t: '광물 조각 하나 깎는 중. 완성되면 너 줄 거야. 아직 비밀.', photo: 'mineral', r: [['기대돼요.', 2, '기대해. 이번 건 진짜 잘 깎았어.'], ['벌써 말했잖아요.', 1, '…모양은 비밀이야.']] }],
  };
  function awayMessages() {
    const S = St.S, o = op(), d = dayIdx(), min = S.time.min;
    if (d < 1 || d > o.days) return;
    const comms = o.comms[d] !== false;
    const slots = [[9 * 60, 'day'], [12 * 60 + 30, 'meal'], [16 * 60, 'day'], [21 * 60 + 30, 'night']];
    const longing = (S.cap.mem && S.cap.mem.longing) || 0;
    const nSlots = longing > 60 ? 4 : longing > 30 ? 3 : 2; // 그리울수록 자주
    for (let i = 0; i < nSlots; i++) {
      const [at, kind] = slots[i];
      const key = d + ':' + i;
      if (o.sent[key] || min < at) continue;
      o.sent[key] = 1;
      const pool = kind === 'meal' ? MSG.meal : kind === 'night' ? MSG.night : d === 1 ? MSG[1] : d === 2 ? MSG[2] : d === 3 ? MSG[3] : d === o.days ? MSG.last : d >= o.days - 1 ? MSG.late : MSG.mid;
      const usedKey = 'opmsg', m = pickFresh(pool, usedKey);
      if (!m) continue;
      if (comms) send(m); else o.queue.push(m);
    }
    // 통신 복구: 밀린 메시지를 한꺼번에
    if (comms && o.queue.length) { send({ t: `통신 복구됐다. 밀린 거 보낸다. (${o.queue.length}개)`, r: [] }); for (const m of o.queue.splice(0)) send(m, true); }
  }
  function pickFresh(pool, key) { const S = St.S; S.done[key] = S.done[key] || []; const ok = pool.filter(m => !PX.Dlg || PX.Dlg.ctxOk(m.t)); if (ok.length) pool = ok; const c = pool.filter(m => !S.done[key].includes(m.t)); const m = c.length ? U.pick(c) : pool.slice().sort((a, b) => S.done[key].indexOf(b.t) - S.done[key].indexOf(a.t))[0]; /* 다 썼으면 가장 오래전에 쓴 것 */ S.done[key] = [m.t, ...S.done[key]].slice(0, 60); return m; }
  // ---------- 작전 중인 대위에게 내가 보내는 메시지 ----------
  // 답장 텀이 들쭉날쭉: 금방 · 한두 시간 · 반나절 · 통신 끊긴 날은 복구될 때 · 밤엔 아침에
  const canMsg = () => { const o = op(); return !!(o && o.phase === 'away' && !o.joint); };
  const QUICK = { pre: ['오늘은 괜찮았어요?', '밥은 챙겨 먹었어요?', '조심히 다녀오세요.', '오늘 부대는 조용했어요.', '잘 자요.'],
    mid: ['밥은 먹었어요?', '보고 싶어요.', '오늘 뭐 했는지 알려 줘요.', '저 오늘 일 잘 끝냈어요.', '조심해요. 꼭이요.', '잘 자요. 꿈에서 봐요.'],
    lov: ['밥 먹었어?', '보고 싶어.', '오늘 뭐 했어? 다 말해 줘.', '나 오늘 {ob} 생각 엄청 했어.', '다친 데 없지?', '사랑해. 얼른 와.', '잘 자. 꿈에 나와.'] };
  function quick() {
    const st = St.S.rel.cap.stage, lv = st >= 4 ? 'lov' : st >= 2 ? 'mid' : 'pre', away = canMsg();
    const night = St.S.time.min >= 21 * 60 || St.S.time.min < 5 * 60;
    return ((away ? QUICK : QUICK_D)[lv] || QUICK_D.pre).filter(t => night || !/잘 자/.test(t)).map(t => PX.Dlg.capTone(U.fmt(t, PX.Dlg.ctx())));
  }
  // 평소 (작전 아닐 때) 떨어져 있으면 보내는 메시지
  const QUICK_D = { pre: ['뭐 해요?', '밥 먹었어요?', '오늘 하루 어땠어요?', '이따 시간 돼요?', '오늘 고마웠어요.', '잘 자요.'],
    mid: ['뭐 해요?', '밥은 먹었어요?', '보고 싶어요.', '이따 만날래요?', '오늘 하루 어땠어요?', '방금 대위님 생각났어요.', '잘 자요. 꿈에서 봐요.'],
    lov: ['뭐 해?', '밥 먹었어?', '보고 싶어.', '이따 볼래?', '오늘 하루 어땠어?', '방금 {ob} 생각났어.', '사랑해.', '잘 자. 꿈에 나와.'] };
  const canText = () => { const o = op(); if (o && o.phase === 'away') return !o.joint; return !together(); };
  function dailyAt() { // 대위가 지금 뭐 하는지에 따라 답장 텀이 다르다
    const k = PX.Cap.spotKind(), r = Math.random(), t = St.S.time.min;
    if (k === 'sleep' || t < 5 * 60) { let at = now(); const m = ((at % DAY) + DAY) % DAY; at += (m < 6 * 60 + 20 ? 0 : DAY) + 6 * 60 + 20 - m + Math.random() * 40; return Math.round(at); }
    if (k === 'duty' || k === 'field') return Math.round(now() + (r < 0.35 ? 12 + Math.random() * 30 : 45 + Math.random() * 110)); // 쉬는 시간에 몰래
    return Math.round(now() + (r < 0.65 ? 1 + Math.random() * 6 : 8 + Math.random() * 25));
  }
  const RE_D = [
    [/이따|만날|볼래|시간 돼|놀/, { pre: ['지금 근무 중. 끝나면 연락할게.', '좋아. 어디서 볼까?'], lov: ['당연하지. 끝나자마자 간다.', '볼래가 아니라 봐야 돼. 어디야?'], free: true }],
    [/밥|먹었|배고/, { pre: ['먹었어. 너도 챙겨 먹어.', '아직. 이제 먹으러 간다. 너는?'], lov: ['먹었어. 너는? 거르면 혼난다.', '아직. 같이 먹을래? 데리러 갈게.'] }],
    [/보고 싶|생각/, { pre: ['…그런 말 받으니까 일이 손에 안 잡힌다.', '나도 방금 네 생각 했어. 진짜로.'], lov: ['나도. 지금 바로 가고 싶다.', '그 말 세 번 읽었어. 아껴 읽는 중.', '보고 싶다는 말 들으면 걸음이 빨라져. 곧 갈게.'] }],
    [/뭐 해|뭐해/, { pre: ['작전동에서 서류 보는 중. 지루해.', '장비 정리 중. 너는?'], lov: ['너 생각. 아, 일도 하고 있어. 조금.', '박 중사 잔소리 듣는 중. 구해 줘.'] }],
    [/하루|어땠/, { pre: ['평범했어. 지금 이 메시지가 제일 좋은 일이야.', '외곽은 조용했어. 다행이지. 너는?'], lov: ['길었어. 근데 네 메시지 받으니까 다 괜찮아졌어.', '별일 없었어. 너 보러 가면 별일 생기겠지.'] }],
    [/고마/, { pre: ['내가 더 고마워.', '천만에. 또 불러.'], lov: ['고마운 건 나야. 매일.'] }],
    [/잘 자|꿈/, { pre: ['너도 잘 자. 따뜻하게 하고.'], lov: ['잘 자, 자기야. 꿈에서는 내가 먼저 갈게.', '이불 꼭 덮어. 내일 아침에 제일 먼저 연락할게.'] }],
    [/사랑/, { pre: ['…고마워. 진심으로.'], lov: ['나도 사랑해. 단말로 하니까 아쉽다. 이따 직접 할게.', '사랑해. 이거 화면 캡처했어.'] }],
  ];
  const GEN_D = { pre: ['응, 봤어. 고마워.', '확인했어. 이따 얘기하자.'], lov: ['응응. 네 메시지 오면 그냥 좋다.', '봤어. 답장 고르느라 오래 걸렸어.'] };
  function dailyReply(text) {
    const lv = St.S.rel.cap.stage >= 4 ? 'lov' : 'pre', k = PX.Cap.spotKind(), free = !['duty', 'field', 'sleep'].includes(k);
    const hit = RE_D.find(([re]) => re.test(text)), set = hit ? hit[1] : GEN_D;
    let pool = set[lv] || set.pre;
    if (hit && hit[1].free) pool = free ? pool.filter(l => !/근무 중/.test(l)) : ['지금 근무 중이야. 끝나면 바로 연락할게.', '근무 끝나고 갈게. 조금만 기다려.'];
    let r = U.pickFresh('dre_' + (hit ? RE_D.indexOf(hit) : 'g') + lv, pool);
    if (k === 'duty' || k === 'field') r = U.pick(['근무 중이라 늦었어. ', '쉬는 시간에 몰래 보는 거야. ', '']) + r;
    if (now() % DAY < 7 * 60 && k !== 'free') r = U.pick(['아침에 봤다. ', '일어나자마자 본다. ']) + r;
    return { text: r, meet: !!(hit && hit[1].free && free) };
  }
  let dReplying = false;
  async function dailyTick() {
    const S = St.S; if (!S.outbox || !S.outbox.length || dReplying) return;
    const list = S.outbox.map(id => S.messages.find(m => m.id === id)).filter(Boolean);
    if (!list.length) { S.outbox = []; return; }
    for (const m of list) if (m.st === 'sent' && now() >= m.readAt) m.st = 'read';
    const due = list.some(m => now() >= m.replyAt) || together(); // 그 사이 만났으면 직접 대답
    if (!due) return;
    dReplying = true;
    try {
      const all = list.map(m => m.mine).join(' / ');
      let r = dailyReply(all), ans = null;
      if (PX.AI && PX.AI.available() && !together()) { try { ans = await PX.AI.replyMsg({ t: `(평소 · 대위는 지금 ${{ duty: '근무 중', field: '외곽 근무 중', sleep: '자다 깬 참', meal: '밥 먹는 중', rest: '막사에서 쉬는 중' }[PX.Cap.spotKind()] || '쉬는 시간'} · 플레이어가 보낸 메시지에 답장)` }, all); } catch (e) { ans = null; } }
      for (const m of list) m.st = 'answered';
      S.outbox = [];
      send({ t: ans || r.text, r: [] });
      if (r.meet && PX.Cap.mode === 'sched' && !together()) PX.Cap.mode = 'seek'; // 시간 되면 정말 찾아온다
      if (S.done.dmsgDay !== S.day) { S.done.dmsgDay = S.day; St.addAff(1); }
    } finally { dReplying = false; PX.UI.badge(); }
  }
  function delayFor(o) {
    const r = Math.random(), S = St.S;
    let d = r < 0.25 ? 4 + Math.random() * 16 : r < 0.6 ? 35 + Math.random() * 90 : r < 0.85 ? 150 + Math.random() * 240 : 360 + Math.random() * 300;
    let at = now() + d;
    const m = ((at % DAY) + DAY) % DAY;
    if (m < 6 * 60 + 20) at += 6 * 60 + 20 - m + Math.random() * 60; // 한밤엔 자고 아침에
    return Math.round(at);
  }
  function sendToCap(text) {
    const S = St.S, o = op(); if (!canText() || !text) return null;
    const t = String(text).trim().slice(0, 120); if (!t) return null;
    if (!canMsg()) { // 평소
      const m = { id: now() + Math.random(), out: true, mine: t, t: '', r: [], day: S.day, min: S.time.min, reply: 'none', st: 'sent', at: now() };
      m.replyAt = dailyAt(); m.readAt = Math.round(now() + Math.random() * Math.max(1, (m.replyAt - now()) * 0.6));
      S.messages.unshift(m); S.messages = S.messages.slice(0, 50);
      (S.outbox = S.outbox || []).push(m.id);
      return m;
    }
    const m = { id: now() + Math.random(), out: true, mine: t, t: '', r: [], day: S.day, min: S.time.min, reply: 'none', st: 'sent', at: now() };
    m.readAt = Math.round(now() + Math.random() * Math.max(5, (delayFor(o) - now()) * 0.7));
    m.replyAt = delayFor(o);
    S.messages.unshift(m); S.messages = S.messages.slice(0, 50);
    (o.outbox = o.outbox || []).push(m.id);
    return m;
  }
  // 카테고리별 답장 (AI를 못 쓸 때)
  const RE = [
    [/밥|먹었|식사|배고/, { pre: ['먹었어. 전투식량이지만. 너도 챙겨 먹어.', '방금 먹었다. 맛은 묻지 마.'], lov: ['먹었어. 전투식량. 네가 해 준 밥 생각나더라.', '먹었어. 근데 너랑 먹는 게 백 배 맛있어. 돌아가면 냉삼.', '먹었어! 너는? 거르지 마. 내가 확인할 거야.'] }],
    [/보고 싶|그리|생각/, { pre: ['…그런 말 들으니까 힘난다. 고마워.'], lov: ['나도. 진짜 많이.', '보고 싶다는 말 세 번 읽었어. 아껴 읽는 중.', '나는 더. 돌아가면 제일 먼저 너한테 간다.', '단말 사진 몇 번 봤는지 몰라. 너 사진.'] }],
    [/다친|괜찮|조심|무사/, { pre: ['멀쩡해. 걱정 마. 늘 하던 거야.', '괜찮아. 팀 전원 이상 없음.'], lov: ['다친 데 없어. 약속했잖아. 꼭 그대로 돌아간다고.', '멀쩡해. 걱정해 줘서 고마워. 그 걱정 덕에 더 조심하고 있어.'] }],
    [/잘 자|굿나잇|꿈/, { pre: ['너도 잘 자. 따뜻하게 하고.'], lov: ['잘 자, 자기야. 꿈에서는 내가 먼저 갈게.', '방금 보고 잤어. 아니, 이제 잘게. 너도.'] }],
    [/사랑/, { pre: ['…고마워. 진심으로.'], lov: ['나도 사랑해. 모래바람 속에서도 이 말 하니까 웃음 난다.', '사랑해. 단말 너머로 하는 거 아쉽다. 돌아가서 직접 할게. 백 번.'] }],
    [/뭐 했|오늘|알려/, { pre: ['오늘은 계속 걸었어. 모래만 봤다. 너는?'], lov: ['종일 걷고, 좌표 찍고, 너 생각하고. 순서는 반대일지도.', '오늘 은빛 이끼 군락 봤어. 너 보여 주고 싶더라. 사진은 통신 좋을 때 보낼게.'] }],
  ];
  const GEN = { pre: ['메시지 잘 받았어. 고맙다.', '응. 확인했어.'], lov: ['네 메시지 오면 기운 난다. 계속 보내 줘.', '답장 늦어서 미안. 방금 쉬는 시간이야. 너 메시지부터 열었어.', '응응. 다 읽었어. 돌아가서 다 대답해 줄게.'] };
  function cannedReply(text, late) {
    const lv = St.S.rel.cap.stage >= 4 ? 'lov' : 'pre';
    const hit = RE.find(([re]) => re.test(text)), pool = (hit ? hit[1] : GEN)[lv] || (hit ? hit[1] : GEN).pre;
    let r = U.pickFresh('opre_' + (hit ? RE.indexOf(hit) : 'g') + lv, pool);
    if (late) r = U.pick(['답장 늦었지. 미안. ', '이제 봤다. 미안. ', '통신 잡히자마자 보는 거야. ']) + r;
    return r;
  }
  let replying = false;
  async function outboxTick() {
    const S = St.S, o = op(); if (!o || !o.outbox || !o.outbox.length || replying) return;
    const d = dayIdx(), comms = o.comms[d] !== false;
    const list = o.outbox.map(id => S.messages.find(m => m.id === id)).filter(Boolean);
    for (const m of list) if (m.st === 'sent' && now() >= m.readAt && comms) m.st = 'read';
    const due = list.filter(m => now() >= m.replyAt);
    if (!due.length || !comms) return; // 통신 끊긴 날은 복구될 때까지 기다린다
    replying = true;
    try {
      const all = list.map(m => m.mine).join(' / '), last = due[due.length - 1], late = now() - due[0].at > 180;
      let ans = null;
      if (PX.AI && PX.AI.available()) { try { ans = await PX.AI.replyMsg({ t: `(장기작전 ${d}일째 · 외곽 수색 중 · 플레이어가 보낸 메시지에 답장)` }, all); } catch (e) { ans = null; } }
      if (!ans) ans = cannedReply(all, late);
      for (const m of list) m.st = 'answered';
      o.outbox = [];
      send({ t: ans, r: [] });
      if (!S.done['opmsgOut_' + o.start]) { S.done['opmsgOut_' + o.start] = 1; St.addAff(2); }
    } finally { replying = false; PX.UI.badge(); }
  }
  // 대위가 바로 옆에 있으면 단말 대신 직접 말한다
  function together() {
    const g = G(), o = op();
    if (!g || !g.cap || g.cap.hidden || g.cap.map !== g.mapId || (o && o.phase === 'away' && !o.joint)) return false;
    return ['follow', 'visit', 'stay'].includes(PX.Cap.mode) || U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) < 6;
  }
  function sayInPerson(m) {
    const g = G();
    g.trigger(async () => {
      g.modal++;
      try {
        g.cap.setDirTo(g.player.x, g.player.y);
        await PX.Dlg.say('cap', U.fmt(m.t, PX.Dlg.ctx()), 'normal');
        if (m.r && m.r.length) {
          const i = await PX.Dlg.choose(m.r.map(r => ({ t: r[0] })));
          await PX.Dlg.say('player', m.r[i][0]);
          St.addAff(m.r[i][1] || 0);
          if (m.r[i][2]) await PX.Dlg.say('cap', U.fmt(m.r[i][2], PX.Dlg.ctx()), 'smile');
        }
      } finally { PX.Dlg.close(); g.modal--; }
    });
  }
  function send(m, quiet) {
    const S = St.S;
    if (!quiet && !m.photo && together()) return sayInPerson(m);
    const msg = { id: now() + Math.random(), t: m.t, r: m.r || [], day: S.day, min: S.time.min, reply: m.r && m.r.length ? null : 'none', photo: m.photo ? photo(m.photo) : null };
    S.messages.unshift(msg); S.messages = S.messages.slice(0, 40);
    if (msg.photo && !quiet) { S.capPhotos = S.capPhotos || []; S.capPhotos.unshift({ day: S.day, kind: m.photo, img: msg.photo, t: m.t }); S.capPhotos = S.capPhotos.slice(0, 24); }
    if (!quiet) PX.UI.toast(`📱 ${S.capName}: ${m.t}${m.photo ? ' 📷' : ''}`, 4200);
    PX.UI.badge();
  }

  // ---------- 사진 (대위의 SD 도트 + 배경을 즉석에서 그린다) ----------
  function photo(kind) {
    const W = 120, H = 90, c = PX.G.canvas(W, H), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const sky = { ship: '#2a3240', camp: '#e8956a', desert: '#f2b07a', mineral: '#3a2a3a', squad: '#d98d6c', gear: '#4a5560', night: '#141028', meal: '#5a4a3a', selfie: '#e8956a' }[kind] || '#555';
    R(0, 0, W, H, sky);
    if (kind === 'ship') { R(0, 0, W, H, '#3a4250'); for (let x = 6; x < W; x += 28) { R(x, 12, 20, 14, '#0e1220'); R(x + 3, 15, 2, 2, '#fff'); R(x + 12, 19, 1, 1, '#fff'); } R(0, 70, W, 20, '#2a303a'); }
    else if (kind === 'night') { for (let i = 0; i < 50; i++) R((i * 37) % W, (i * 53) % 55, 1, 1, i % 5 ? '#fff' : '#ffd166'); R(0, 62, W, 28, '#5a2f25'); R(18, 52, 26, 12, '#3f5a3a'); R(30, 46, 2, 6, '#3f5a3a'); }
    else if (kind === 'mineral') { R(0, 60, W, 30, '#5a3a30'); for (const [x, h, col] of [[50, 26, '#b9a0ff'], [62, 34, '#d6c0ff'], [74, 22, '#9b7fd0']]) { R(x, 60 - h, 10, h, col); R(x + 2, 62 - h, 3, h - 6, '#ffffff55'); } }
    else if (kind === 'meal') { R(0, 0, W, H, '#6b5a48'); R(20, 30, 80, 46, '#9aa3ad'); R(26, 36, 30, 16, '#c9a27a'); R(60, 36, 34, 16, '#7fb86a'); R(26, 56, 68, 14, '#e8d6b0'); }
    else if (kind === 'gear') { R(0, 0, W, H, '#4a5560'); R(10, 50, 100, 30, '#5a5f66'); R(30, 40, 50, 18, '#3a3f46'); R(40, 44, 10, 10, '#ffd166'); R(60, 46, 14, 6, '#d0563b'); }
    else { R(0, 54, W, 36, '#c4613f'); R(0, 48, W, 8, '#d97a4f'); R(70, 30, 30, 22, '#8a3b30'); if (kind === 'camp' || kind === 'selfie') { R(12, 44, 30, 14, '#5a6b4f'); R(22, 36, 10, 8, '#5a6b4f'); } }
    // 인물 (대위 + 단체사진이면 팀원)
    const capApp = Object.assign({}, G().cap.app); delete capApp._k;
    if (kind === 'ship' || kind === 'camp') capApp.hat = '#3f4a30';
    const who = kind === 'squad' ? ['park', 'cap', 'lee'] : ['desert', 'mineral', 'meal', 'gear'].includes(kind) ? [] : ['cap'];
    who.forEach((id, i) => {
      const app = id === 'cap' ? capApp : Object.assign({}, PX.NPC_BY_ID[id].look);
      const f = PX.S.get(app, 'idle', 0, 'F', id === 'cap' ? 'smirk' : 'smile');
      const sc = id === 'cap' ? 2 : 1.6, w = f.c.width * sc, h = f.c.height * sc;
      const x = who.length === 1 ? (W - w) / 2 + 14 : 10 + i * 36, y = H - h + (id === 'cap' ? 26 : 22);
      g.imageSmoothingEnabled = false; g.drawImage(f.c, x, y, w, h);
    });
    if (kind === 'selfie' || kind === 'ship') { R(4, 4, 30, 9, '#00000066'); g.fillStyle = '#fff'; g.font = '7px sans-serif'; g.fillText(kind === 'ship' ? 'IN TRANSIT' : 'D-1', 7, 11); }
    return c.toDataURL('image/png');
  }

  // ---------- 복귀 (혼자 다녀온 경우): 도착 → 보고 → 장비 반납 → 검진 → 샤워·환복 → 플레이어 찾기 ----------
  const RETURN_STEPS = [[0, 'base.gate', '부대 도착'], [30, 'ops.cap', '복귀 보고'], [60, 'hg.w2', '장비 반납'], [90, 'med.patient', '의료 확인'], [120, 'shower', '샤워·환복'], [150, null, '찾아가기']];
  function returnHome() {
    const S = St.S, o = op();
    o.phase = 'return'; o.retStart = now();
    PX.Cap.mode = 'sched';
    S.cap.giftPending = 'mineral';
    const m = PX.Mind.mem(); m.reunion = { days: o.days }; m.longing = Math.max(m.longing || 0, 70);
    send({ t: '착륙했다. 보고하고, 장비 반납하고, 씻고 갈게. 두 시간만 기다려.', r: [['기다릴게요.', 3, '응. 뛰어갈게.'], ['천천히 와요.', 2, '천천히는 안 돼. 그건 약속 못 해.']] });
  }
  function returnTick() {
    const o = op(), g = G(), el = now() - o.retStart;
    let step = RETURN_STEPS[0];
    for (const s of RETURN_STEPS) if (el >= s[0]) step = s;
    o.retStep = step[2];
    if (step[1] === null) { o.phase = 'done'; o.end = now(); PX.Cap.mode = 'sched'; St.S.rel.cap.noFollowUntil = 0; if (PX.Mind) PX.Mind.mem().part = -1e9; return; }
  }
  // 복귀 절차 중의 일정 (actors 의 일정 대신)
  function schedOverride() {
    const o = op();
    if (!o || o.phase !== 'return') return null;
    const step = RETURN_STEPS.find(s => s[2] === o.retStep) || RETURN_STEPS[0];
    if (step[1] === 'shower') return '00:00 -';
    return step[1] ? '00:00 ' + step[1] : null;
  }

  // ---------- 합동작전 (플레이어도 투입) ----------
  async function jointDepart() {
    const S = St.S, o = op(), g = G(), V = PX.DLG_V2;
    PX.Cap.moveTo(g.mapId); const tt = PX.Path.nearestWalkable(PX.W.maps[g.mapId], g.player.x + 1, g.player.y, 3); if (tt) { g.cap.x = tt[0] + 0.5; g.cap.y = tt[1] + 0.5; }
    g.modal++;
    await PX.Dlg.runLines([`N:새벽 6시. 수송선 격납고. 엔진 소리가 바닥을 울린다. 작전 기간 ${o.days}일, ${o.area}.`, ...(PX.Dlg.pick('v_opJoint', V.opJoint) || { l: ['C:내 뒤로 두 걸음.'] }).l]);
    PX.Dlg.close(); g.modal--;
    const f = document.getElementById('fade'); f.classList.add('on', 'long'); await U.sleep(600);
    St.advance(120);
    g.enterMap('outskirts', 27.5, 44.5);
    PX.Cap.moveTo('outskirts'); g.cap.x = 28.5; g.cap.y = 43.5; PX.Cap.mode = 'follow'; S.cap.follow = true;
    await U.sleep(300); f.classList.remove('on', 'long');
    PX.UI.toast(`🛰️ 합동작전 1일 차 · ${o.area} · 역할: ${o.role}`, 4500);
    g.memory('첫 합동작전', `${o.area}. ${o.role}로 대위와 같은 작전에 투입됐다.`, true);
  }
  // 작전 일과 게시판 (외곽 수색구역 안내 단말에서 연다)
  const TASKS = [
    { k: 'brief', t: '📋 작전 브리핑', day1: true, run: async () => { await lines(['N:대위가 지도를 펼친다. 손가락이 경로를 짚는다.', 'C:오늘은 여기까지. 흔적 확인, 중계기 점검, 해 지기 전에 복귀.', 'C*:질문? 없으면… 아, 넌 내 뒤로 두 걸음. 그게 제일 중요해.']); } },
    { k: 'camp', t: '⛺ 야영지 설치', day1: true, run: async () => { await PX.Mini.timing({ title: '⛺ 야영지 설치', help: '말뚝을 박을 때(초록 구간) 누르세요', rounds: 4, speed: 60, btn: '쾅!' }); await lines(['C:잘 박았네. 바람에 안 날아가겠다.', 'C^:옆 텐트가 내 거야. 무서우면 불러.']); } },
    { k: 'gear', t: '🔧 장비 점검', run: async () => { await PX.Mini.run('circuit'); await lines([PX.Dlg.capPick(['C:배선 깔끔하다. 오 상사가 보면 좋아하겠어.', 'C*:두 번 확인했지? 박 중사 버릇 옮았네.'])]); } },
    { k: 'trace', t: '🔍 외계 생명체 흔적 조사', run: async () => { await PX.Mini.run('drone'); await lines([PX.Dlg.capPick(['C:이 발자국은 이틀 됐어. 크기 봐. 위험한 건 아니야.', 'C:사막도마뱀 흔적이네. 무해해. 기록만 해 둬.', 'N:모래 위로 이상한 무늬가 이어진다. 대위가 한참 들여다보더니 사진을 찍는다.', 'C:이건 보고서에 넣는다. 잘 찾았어.'])]); } },
    { k: 'watch', t: '🌙 경계 근무', night: true, run: async () => { await PX.Mini.timing({ title: '🌙 경계 근무', help: '움직임(초록 구간)이 보이면 누르세요', rounds: 5, speed: 55, btn: '확인!', bg: '#141028' }); await lines(['N:교대 시간. 대위가 보온병을 내민다.', 'C:졸리지? 나도. 근데 너랑 서니까 시간이 빨리 가.']); } },
    { k: 'meal', t: '🍲 작전 중 식사', run: async () => { St.S.energy = Math.min(100, St.S.energy + 20); await lines(U.pick([['N:전투식량을 데운다. 대위가 자기 것에서 고기를 골라 내 쪽으로 옮긴다.', 'C:3번이 제일 맛있어. 그중에 고기가 제일 맛있고. 그러니까 네 거.'], ['N:모닥불 옆에서 다 같이 먹는다. 이준혁이 농담을 하고 최민재가 남은 걸 노린다.', 'C^:이게 우리 팀이야. 시끄럽지.']]).flat()); } },
    { k: 'night', t: '💬 야간 대화', night: true, run: async () => { await lines(U.pick([['N:텐트 앞. 별이 쏟아진다. 대위가 옆에 앉는다.', 'C:작전 중엔 이런 말 안 하는데.', 'C*:…같이 와서 좋다. 무섭기도 하고. 네가 다칠까 봐.', { q: [['대위님 뒤에 있으면 안 다쳐요.', 4, ['C^:그 말 믿고 내일도 앞에 설게.']], ['저도 대위님 지킬게요.', 4, ['C!:…', 'C*:그 말은 반칙이다.']]] }], ['C:별 많지. 부대에선 이렇게 안 보여.', 'C:여기 오면 늘 혼자 봤는데.', 'C^:오늘은 아니네.']])); St.addAff(4); } },
    { k: 'rest', t: '😴 텐트에서 하루 마치기', always: true, run: async () => { await G().sleepUntil(6); } },
  ];
  async function lines(ls) { const g = G(); g.modal++; await PX.Dlg.runLines(ls); PX.Dlg.close(); g.modal--; }
  async function board() {
    const o = op(), d = dayIdx(), S = St.S;
    if (!inField()) return false;
    const night = S.time.min >= 19 * 60 || S.time.min < 5 * 60;
    if (d > o.days || now() >= o.end - 120) { const it = await PX.UI.menu(`🛰️ 작전 ${d}일 차 · 귀환`, [{ t: '🚁 귀환 수송선 타기', k: 1 }]); if (it) jointReturn(); return true; }
    const done = o.jointDone[d] = o.jointDone[d] || {};
    const items = TASKS.filter(x => (!x.day1 || d === 1) && (!x.night || night)).map(x => ({ t: (done[x.k] ? '✔ ' : '') + x.t, k: x, off: !!done[x.k] && !x.always, offMsg: '오늘은 이미 했어요' }));
    const it = await PX.UI.menu(`🛰️ 합동작전 ${d}/${o.days}일 차 · ${o.area}`, items);
    if (!it) return true;
    done[it.k.k] = 1;
    await it.k.run(); St.advance(it.k.k === 'rest' ? 0 : 40); St.addAff(2);
    return true;
  }
  async function jointReturn() {
    const S = St.S, o = op(), g = G();
    if (o.phase !== 'away') return;
    o.phase = 'done'; o.end = now();
    const f = document.getElementById('fade'); f.classList.add('on', 'long'); await U.sleep(600);
    St.advance(120);
    const m = PX.W.maps.base; g.enterMap('base', 31.5, 40.5);
    PX.Cap.moveTo('base'); g.cap.x = 32.5; g.cap.y = 40.5; PX.Cap.mode = 'follow';
    await U.sleep(300); f.classList.remove('on', 'long');
    g.modal++; const bd = PX.Dlg.pick('v_opJointEnd', PX.DLG_V2.opJointEnd); await PX.Dlg.runLines(bd ? bd.l : ['C:고생했다.']); PX.Dlg.close(); g.modal--;
    if (PX.Mind) { PX.Mind.noteMeet(); PX.Mind.noteTalk('opJointEnd'); }
    S.stats.ops = (S.stats.ops || 0) + 1; St.addAff(6);
    g.memory('함께 귀환', `${o.days}일간의 ${o.area} 작전을 마치고 함께 돌아왔다.`, true);
  }

  return { together, canMsg, canText, sendToCap, quick, maybeSchedule, plan, tick, isAway, inField, dayIdx, board, schedOverride, photo, send, op, jointReturn, depart };
})();
