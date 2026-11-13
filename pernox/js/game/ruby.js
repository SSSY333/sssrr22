// 루비웨이 (LB76~LB78 · LB83~LB89): 거리 인파 · 가게 직원 · 노점 · 가게별 활동
// 성인 구역이지만 묘사는 암시와 분위기까지만. 대위는 늘 먼저 묻고, 거절하면 바로 물러선다.
PX.Ruby = (() => {
  const U = PX.U, St = PX.St, W = PX.W;
  const G = () => PX.Game;
  const withCap = () => PX.Act.withCap();
  async function lines(ls) { const g = G(); g.modal++; await PX.Dlg.runLines(ls); PX.Dlg.close(); g.modal--; }
  const once = (k) => { const S = St.S; if (S.done[k]) return false; S.done[k] = 1; return true; };
  const night = () => { const t = St.S.time.min; return t >= 18 * 60 || t < 5 * 60; };

  // ---------- 사람들 (이름 없는 손님 · 직원) ----------
  const SK = () => PX.S.SKINS, HC = () => Object.values(PX.S.HAIRC);
  const FANCY = ['#c2185b', '#2a1f3f', '#1f2a4a', '#5a2f6a', '#e8ebf2', '#3a3f4a', '#7a2f3f', '#2f4f5a', '#d6a2ff', '#111317'];
  const HAIRS = ['short', 'bob', 'long', 'bun', 'curly', 'wolf', 'crew', 'pony'];
  const CASUAL = ['#f4efe4', '#7fb6e6', '#ffd166', '#b8f0c8', '#ff9e7a', '#d9c8ff', '#8fd3c8', '#f2b8c6', '#6b8fd0', '#e8ebf2', '#c9a27a'];
  const PANTS = ['#4a5a7a', '#6b6f7a', '#3d3f47', '#7a6a55', '#2f4f5a'];
  function randomLook(seed, o = {}, casual) {
    const r = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
    const big = r(2);
    return Object.assign({ big, skin: SK()[r(5)], hair: HAIRS[r(HAIRS.length)], hairColor: HC()[r(HC().length)], eye: '#2a2228', top: casual ? CASUAL[r(CASUAL.length)] : FANCY[r(FANCY.length)], bottom: casual ? PANTS[r(PANTS.length)] : FANCY[r(4) + 1], shoe: '#1f1c22', sleeve: r(2) ? 'long' : 'short', brows: '#2a2433' }, big ? { hair: ['short', 'crew', 'wolf'][r(3)] } : {}, o);
  }
  const UNI = { top: '#4f5a3d', bottom: '#3f4a30', shoe: '#1f1c22' };
  // role: 이름 · 외형 덧씌우기 · 대사 (혼잣말 amb / 말 걸면 talk)
  const ROLES = {
    walker: { names: ['네온 아래 손님', '데이트 중인 손님', '퇴근한 항로 노동자', '구경 나온 관광객'], talk: ['오늘 밤 실버마스크 줄 길대요.', '루비웨이는 처음이에요? 퍼퓸덴부터 가 보세요.', '저기 장미 노점, 대위들이 자주 사 가요. 이상하죠?', '헌병 순찰 돌면 다들 갑자기 얌전해져요.', '포토부스 사진, 저는 벌써 세 장째예요.'], amb: ['어디 갈까?', '오늘 네온 예쁘다…', '한 잔만 더?', '사진 찍자!'] },
    mp: { names: ['헌병 순찰조'], look: { top: '#3f4a30', bottom: '#2f3a26', hat: '#2a2f22', big: 1, hair: 'crew' }, talk: ['헌병 순찰입니다. 즐기시되 적당히요.', '귀대 시간 지키세요. 셔틀 막차는 새벽 한 시입니다.', '시비 붙으면 바로 저를 부르세요.', '…아, 수색팀 대위님 일행이시구나. 실례했습니다.'], amb: ['순찰 중.', '다들 적당히.'] },
    rosevendor: { names: ['장미 노점 할머니'], look: { big: 0, hair: 'bun', hairColor: '#c9ccd6', top: '#7a2f3f', bottom: '#3a2a2a' }, talk: ['장미 한 송이 사 가. 루비웨이 장미는 밤에 더 빨개.', '아까 덩치 큰 군인이 한참 고민하다 한 송이 사 갔어. 누구 주려나.', '꽃은 받는 사람보다 주는 사람이 더 떨려.'], amb: ['장미 사세요~', '루비 장미 한 송이!'] },
    cocktailer: { names: ['칵테일 카트 주인'], look: { top: '#111317', bottom: '#111317' }, talk: ['루비 하이볼 한 잔? 오늘 얼음 새로 들어왔어요.', '무알코올도 맛있어요. 별빛 소다 추천.', '두 잔 넘어가면 제가 먼저 말려요.'], amb: ['하이볼 있어요~', '별빛 소다!'] },
    busker: { names: ['거리의 가수'], look: { hair: 'wolf', top: '#2a1f3f', sleeve: 'long' }, talk: ['신청곡 받아요. 팁은 마음대로.', '옛 지구 노래 좋아하세요? 저 그거 전문이에요.', '어젯밤엔 어떤 군인이 애인한테 불러 달라고 신청했어요. 귀여웠어요.'], amb: ['♪ 라라~', '♪ 별이 지는 밤에~', '♪'] },
    perfumer: { names: ['조향사 라엘'], look: { hair: 'long', hairColor: '#e3bf6c', top: '#e8ebf2', bottom: '#5a3f4a', big: 0 }, talk: ['피부 온도에 따라 향이 달라져요. 같은 향도 두 사람에게서 다르게 나요.', '시향 선반에서 먼저 맡아 보세요. 마음에 드는 향을 고르면 섞어 드려요.', '함께 오신 분 향도 맡아 볼까요? …아, 장비 기름 냄새네요. 그것도 나쁘지 않아요.'], amb: ['향이 섞이는 중이에요.', '이 병은 아직 비밀.'] },
    guest: { names: ['향을 고르는 손님'], talk: ['이 향, 제 애인이 좋아할까요?', '향수 이름을 직접 지을 수 있대요.'], amb: ['음… 이거 좋다.', '킁킁.'] },
    dealer: { names: ['딜러 칩'], look: { top: '#111317', bottom: '#111317', hair: 'short', big: 1 }, talk: ['여긴 큰돈 거는 데가 아니에요. 가벼운 내기, 서로 동의한 벌칙만.', '카드 하이로우 한 판? 세 번 중 두 번 맞히면 이겨요.', '벌칙은 둘 다 좋다고 해야 성립합니다. 그게 다이스키스 규칙이에요.'], amb: ['자, 한 판 더!', '주사위 굴러갑니다~'] },
    gamer: { names: ['내기 중인 손님'], talk: ['방금 벌칙으로 노래했어요. 아직 얼굴 빨개요.', '저 사람, 지고도 웃고 있어요. 벌칙이 뭐였길래.'], amb: ['한 판 더!', '아 졌다!', '벌칙! 벌칙!'] },
    bartender: { names: ['가면 쓴 바텐더'], look: { top: '#2a2f4a', mask: 'lace' }, talk: ['여기선 이름 대신 별칭이에요. 손님 별칭은요?', '가면을 써도 웃는 입은 안 가려져요.', '…저기 저분, 가면 썼는데 덩치 때문에 다 알아봐요. 수색팀이죠?'], amb: ['한 잔 하시겠어요?', '오늘 음악 좋네요.'] },
    maskhost: { names: ['가면 안내원'], look: { top: '#e8ebf2', mask: 'moon', big: 0, hair: 'bob' }, talk: ['가면 걸이에서 하나 골라 쓰세요. 나갈 때 두고 가시면 돼요.', '여기선 누구도 신원을 묻지 않아요. 묻는 사람은 제가 내보내요.'], amb: ['가면 쓰세요~', '별칭 정하셨어요?'] },
    dancer: { names: ['춤추는 손님'], look: { mask: '?' }, talk: ['같이 출래요? 아, 일행 있으시구나.', '가면 쓰면 덜 부끄러워요.'], amb: ['♪', '오늘 음악 최고!', '한 곡 더!'] },
    host: { names: ['미드나잇 룸 매니저'], look: { top: '#2a1f3f', bottom: '#111317' }, talk: ['예약제 라운지입니다. 두 시간, 방음은 확실해요.', '음악 채널과 향은 손님이 직접 고르실 수 있어요.'], amb: ['조용히 쉬다 가세요.'] },
    usher: { names: ['쇼룸 안내원'], look: { top: '#3a2a4a' }, talk: ['반투명 커튼 너머 실루엣 공연이에요. 공연자와 관객의 접촉은 금지입니다.', '무대 앞에 앉으시면 공연이 시작돼요. 관람료 ₢20.', '…함께 오신 분 표정이 좀 무서운데요. 괜찮으세요?'], amb: ['곧 공연 시작합니다.'] },
    audience: { names: ['관객'], talk: ['커튼 그림자만으로도 이렇게 설렐 줄이야.', '옆자리 군인 분이 계속 한숨 쉬어요.'], amb: ['와…', '쉿.'] },
    pubboss: { names: ['술집 사장'], look: { big: 1, hair: 'crew', hairColor: '#c9ccd6', top: '#5a3a2a' }, talk: ['군인, 항로 노동자, 경비원. 여긴 다 섞여서 마셔. 싸움만 안 나면 돼.', '소문 듣고 싶어? 앉아 봐. 여긴 소문이 안주야.', '수색팀 대위? 그 친구 두 잔에서 딱 멈추던데. 요즘은 더 일찍 멈추더라.'], amb: ['한 잔 더?', '어서 와!'] },
    patron: { names: ['항로 노동자', '민간 경비원', '비번 병사'], talk: ['통신탑 얘기 들었어? 밤마다 신호가 잡힌대.', '보급선 다음 달엔 두 번 온다더라. 진짜면 좋겠다.', '수색팀 애들은 술 세. 근데 다 일찍 들어가.', '은사막에 은색 여우가 산대. 내가 봤다니까?'], amb: ['건배!', '한 잔 더!', '아니 그러니까…'], look: UNI },
    attendant: { names: ['샤워실 관리인'], look: { top: '#e8ebf2', bottom: '#7fa0b0' }, talk: ['새벽 손님들은 다들 후기를 남기고 가요. 게시판 보세요.', '수건은 무료, 스파 부스는 ₢5.'], amb: ['수건 여기 있어요.'] },
    early: { names: ['새벽 손님'], talk: ['밤새 놀고 씻으러 왔어요. 이게 루비웨이 코스예요.', '어젯밤 다이스키스에서 벌칙으로 업혀 다녔어요.'], amb: ['하암…', '개운하다.'] },
    innclerk: { names: ['은밀숙소 프런트'], look: { top: '#5a2f3f', bottom: '#2a1f2a' }, talk: ['예약제입니다. 객실은 거울·큰 욕조·물침대 세 가지예요.', '대위님이 예약 화면 보시더니 바로 끄셨다가 다시 켜셨어요. 귀여우시던데요.'], amb: ['어서 오세요.'] },
  };
  // ---------- 돔시티 · 부대 · 관광지의 사람들 ----------
  const TEE = { top: '#3d3f47', bottom: '#3f4a30', shoe: '#1f1c22', sleeve: 'short' };
  Object.assign(ROLES, {
    citizen: { names: ['돔시티 주민', '퇴근길 연구원', '산책 나온 주민', '장 보러 나온 주민', '개척 2세대 학생'], talk: ['오늘 인공 날씨가 딱 좋네요. 관리국이 기분이 좋은가 봐요.', '보급선 들어오는 주엔 시장이 두 배로 커져요.', '꽃시장은 아침에 가야 해요. 오후엔 좋은 게 다 나가요.', '투명수로 정원, 밤에 꼭 가 보세요. 바닥에 물고기가 지나가요.', '돔 천장 청소하는 날엔 하늘이 줄무늬가 돼요. 귀엽죠.', '냉삼집 줄이 길면 그날은 군인 외출일이에요.', '여기서 태어났어요. 지구는 사진으로만 봤고요.'], amb: ['오늘 뭐 먹지.', '날씨 좋다.', '아, 늦었다.', '빵 냄새 난다.', '저기 새 가게 생겼네.'] },
    shopper: { names: ['물건 고르는 손님', '단골손님', '구경하는 손님'], browse: true, talk: ['이거랑 저거 중에 뭐가 나을까요? …아, 혼잣말이었어요.', '여기 단골이에요. 사장님이 제 취향을 다 알아요.', '선물 고르는 중이에요. 어렵네요.', '보급선 들어온 날 와야 물건이 많아요.'], amb: ['음… 이게 나으려나.', '이거 얼마지?', '하나만 사야지. 하나만.', '어, 이거 새로 나왔네.'] },
    cafeguest: { names: ['카페 손님', '책 읽는 손님'], talk: ['여기 빙수는 얼음이 달라요.', '카페에선 시간이 천천히 가요. 그래서 와요.', '컵에 그림 그려 주는 거 받아 보셨어요? 전 오늘 고양이였어요.'], amb: ['후… 좋다.', '한 잔 더 할까.', '여기 조용해서 좋아.'] },
    arcader: { names: ['오락실 꼬마 고수', '점수 내는 학생', '인형 노리는 손님'], browse: true, talk: ['저 인형 뽑기, 왼쪽으로 반 칸 더 가야 돼요. 제 연구 결과예요.', '최고 점수 "LJH"가 누군지 아세요? 군인이래요.', '동전 다 썼어요. 구경만 하는 중이에요.'], amb: ['아깝다!', '한 판만 더!', '오 신기록?', '으아 떨어졌다.'] },
    diner: { names: ['식사 중인 손님', '회식 나온 직장인'], talk: ['여기 양념장이 진짜예요.', '고기는 사장님이 뒤집으라고 할 때만 뒤집어야 해요. 혼나요.'], amb: ['한 판 더 주세요!', '아 배부르다.', '여기 밥 하나요!'] },
    tourist: { names: ['관광객', '사진 찍는 관광객', '다른 행성에서 온 여행자', '신혼여행 온 부부'], talk: ['사진 좀 찍어 주실래요? …아, 괜찮아요. 셀카로 할게요.', '안내 책자에 없는 곳 아세요?', '제3행성에서 왔어요. 여긴 모래 색이 달라요.', '돔 밖 별이 이렇게 많은 줄 몰랐어요.', '기념품은 어디서 사야 해요?'], amb: ['와, 예쁘다!', '여기서 한 장!', '안내 책자 어디 뒀지.', '다리 아프다…'] },
    traveler: { names: ['탑승 기다리는 승객', '마중 나온 사람', '환승객', '수송선 승무원'], talk: ['제 편이 삼십 분 지연이래요. 커피나 마셔야죠.', '동생이 귀환선으로 와요. 이 년 만이에요.', '짐이 다른 행성으로 갔대요. 저보다 여행을 많이 해요.', '환승만 세 번째예요. 창밖 구경이 제일 싸요.'], amb: ['몇 번 게이트더라.', '아직 안 왔나.', '여권… 있다.', '지연이라니.'] },
    soldier: { names: ['606부대 병사', '경계병', '보급병', '통신병', '비번 병사'], look: Object.assign({ hat: '#3f4a30' }, UNI), talk: ['충성! …아, 편하게 하라고요? 감사합니다.', '오늘 저녁 뭔지 아십니까? 저는 그것만 기다립니다.', '휴가가 십이 일 남았습니다. 세고 있습니다.', 'PX에 초코바 들어왔답니다. 빨리 가 보십시오.', '어젯밤 불침번이었습니다. 별은 잘 봤습니다.', '헌병 중사님 지나가셨습니까? 모자 삐뚤어져서요.', '생활관 리그 연습 중입니다. 종목은 제기차기입니다.'], amb: ['하나 둘, 하나 둘.', '아 졸려.', '오늘 저녁 뭐지.', '휴가 며칠 남았더라.', '충성.'] },
    jogger: { names: ['구보 중인 병사', '체력단련 중인 병사'], look: TEE, fast: true, talk: ['헉… 헉… 세 바퀴 남았습니다.', '뛰면 잡생각이 없어집니다. 숨만 찹니다.'], amb: ['하나! 둘!', '헉… 헉…', '한 바퀴 더!'] },
    pxshopper: { names: ['PX 온 병사', '월급 탄 병사', '간식 사러 온 병사'], look: UNI, browse: true, talk: ['월급 들어온 날입니다. 과자 코너를 지나칠 수 없습니다.', '아이스 팩이 또 품절입니다. 누가 박스째 사 간답니다.', '선임이 라면 사 오랬는데 맛을 까먹었습니다. 큰일입니다.', '보급담당 중사님은 숨겨 둔 게 꼭 있습니다. 물어보면 나옵니다.'], amb: ['라면… 매운맛이었나.', '초코바 있다!', '이번 달 돈 벌써 다 썼네.', '이거 하나만 더.', '뭐 사 오라고 했더라.'] },
    gymgoer: { names: ['운동하는 병사', '체력 측정 준비 중인 병사'], look: TEE, pose: 'workout', browse: true, talk: ['다음 주가 체력 측정입니다. 벼락치기 중입니다.', '수색팀 대위님 드시는 무게 보셨습니까? 저건 사람이 아닙니다.', '운동 끝나고 먹는 밥이 제일 맛있습니다.'], amb: ['후… 하나 더.', '열여덟… 열아홉…', '아 팔 떨려.', '물 좀.'] },
    messgoer: { names: ['식사하러 온 병사', '배식 기다리는 병사'], look: UNI, talk: ['오늘 국 냄새 좋습니다. 조리장님 기분 좋으신 날입니다.', '식판은 가득, 시간은 십 분. 이게 군인의 식사입니다.', '김치찌개 나오는 날은 줄이 연병장까지 갑니다.'], amb: ['배고프다.', '오늘 메뉴 뭐지.', '한 그릇 더 받아야지.', '국 냄새 좋다.'] },
    offduty: { names: ['쉬는 병사', '편지 쓰는 병사'], look: TEE, talk: ['소파는 선착순입니다. 저는 늦었습니다.', '집에 편지 쓰는 중입니다. 세 줄 쓰고 막혔습니다.', '오락기 순서 기다리는 중입니다. 이 하사님이 안 비켜 주십니다.'], amb: ['아 쉬고 싶다.', '편지 뭐라고 쓰지.', '오락기 언제 비지.', '하암.'] },
    mechanic: { names: ['정비병', '부품 나르는 정비병'], look: { top: '#5a5f66', bottom: '#3f4a30', shoe: '#1f1c22' }, browse: true, talk: ['3번 드론 로터 교체 중입니다. 상사님이 소리만 듣고 아셨습니다.', '공구는 쓴 자리에. 안 그러면 상사님께 혼납니다.', '기름 냄새가 이제 안 납니다. 코가 적응했습니다.'], amb: ['렌치 어디 갔지.', '이거 맞나…', '상사님 오신다.', '나사 하나 남았는데…'] },
    clerkmil: { names: ['행정병', '당직병'], look: UNI, browse: true, talk: ['근무표 수정이 세 번째입니다. 하사님이 공평하게 짜시느라.', '프린터가 또 삐졌습니다. 화요일이라 그렇습니다.'], amb: ['서류가 어디 갔지.', '프린터 또…', '도장, 도장.'] },
    researcher: { names: ['연구원', '표본 정리하는 연구원'], look: { top: '#e8ebf2', bottom: '#4a5a6a' }, browse: true, talk: ['발광초가 한 송이 더 폈대요. 조 연구원님이 박수 쳤어요.', '소장님 안경은 이마에 있어요. 말씀드릴까 말까 고민 중이에요.', '표본 번호가 하나 비어요. 큰일이에요.'], amb: ['62퍼센트… 좋아.', '표본 번호가…', '소장님 점심 드셨나.'] },
    spectator: { names: ['투영 보러 온 관람객', '데이트 중인 관람객'], talk: ['별비 투영은 뒷자리가 명당이에요.', '오늘 프로그램은 지구의 밤하늘이래요.'], amb: ['곧 시작한대.', '자리 여기 괜찮다.', '와…'] },
  });
  PX.EXTRA = PX.EXTRA || {};
  PX.EXTRA.mbartender = { name: '가면 쓴 바텐더', look: null };
  let seq = 1;
  function spawn(m, g) {
    const def = m.def;
    for (const c of def.crowd || []) {
      const R = ROLES[c.role]; if (!R) continue;
      if (c.nightOnly && !night()) continue;
      const hr = St.S.time.min / 60, awake = hr >= (c.from || 7) && hr < (c.to || 22);
      const n0 = c.fixed ? 1 : c.busy === 'day' ? (awake ? c.n : Math.floor(c.n / 4)) : (night() ? c.n : (c.day != null ? c.day : Math.ceil(c.n / 2)));
      const n = c.fixed ? n0 : Math.round(n0 * (PX.Game.lowPerf ? 0.5 : 1));
      if (c.fixed && c.busy === 'day' && !awake) continue;
      for (let i = 0; i < n; i++) {
        const id = 'ex' + (seq++);
        const look = randomLook(U.hash(m.id + c.role + i) + 7, R.look || {}, !m.def.adult);
        if (look.mask === '?') look.mask = Object.keys(PX.S.MASKS)[(U.hash(c.role + i) + i * 3) % Object.keys(PX.S.MASKS).length];
        const a = new PX.A.Actor(id, look, { map: m.id, name: U.pick(R.names), speed: R.fast ? 3.4 : 1.4 + Math.random() * 0.8 });
        a.extra = c.role; a.box = c;
        if (c.fixed) { a.x = c.fixed[0]; a.y = c.fixed[1]; a.dir = c.fixed[2] || 0; a.fixed = true; }
        else for (let k = 0; k < 40; k++) { if (c.x0 == null) { const io = m.kind === 'in'; c.x0 = io ? 1 : 4; c.y0 = io ? 2 : 4; c.x1 = m.w - (io ? 2 : 5); c.y1 = m.h - (io ? 3 : 5); } const x = c.x0 + Math.floor(Math.random() * (c.x1 - c.x0 + 1)), y = c.y0 + Math.floor(Math.random() * (c.y1 - c.y0 + 1)); if (W.walkable(m, x, y)) { a.x = x + 0.5; a.y = y + 0.5; break; } }
        if (!a.x) continue;
        a.nextMove = performance.now() + Math.random() * 4000;
        PX.EXTRA[id] = { name: a.name, look };
        g.critters.push(a);
      }
    }
  }
  function think(a, m, g, now) {
    if (a.fixed) { if (now > (a.nextMove || 0)) { a.nextMove = now + 6000 + Math.random() * 8000; if (Math.random() < 0.35 && !g.bubbles.some(b => b.actor === a)) g.bubble(a, U.pickFresh('xamb_' + a.extra, ROLES[a.extra].amb), 2.6); } return; }
    if (now < a.nextMove || a.path.length) return;
    a.nextMove = now + 3000 + Math.random() * 5000;
    if (Math.random() < 0.15 && !g.bubbles.some(b => b.actor === a) && U.dist(a.x, a.y, g.player.x, g.player.y) < 8) g.bubble(a, U.pickFresh('xamb_' + a.extra, ROLES[a.extra].amb), 2.6);
    const R = ROLES[a.extra];
    // 물건·기구 앞에 가서 들여다보기 (PX 진열대, 운동기구, 오락기 …)
    if (R.browse && Math.random() < 0.65) {
      const objs = m.objs.filter(o => o.kind === 'furn' && o.blocks !== false && !o.f.flat && !o.seats && (!R.pose || /bench|pullup|punch|tread|weight|dumb|bar/.test(o.fid)));
      const o = objs.length && U.pick(objs), t = o && W.accessTile(m, o);
      if (t && a.goTo(m, t.x, t.y, () => { a.setDirTo(o.x + o.fw / 2, o.y + o.fd / 2); if (R.pose) a.doPose(R.pose, 4 + Math.random() * 4); a.nextMove = performance.now() + 4000 + Math.random() * 5000; })) return;
    }
    const c = a.box, x = c.x0 + Math.floor(Math.random() * (c.x1 - c.x0 + 1)), y = c.y0 + Math.floor(Math.random() * (c.y1 - c.y0 + 1));
    if (R.fast) a.nextMove = now + 500;
    a.goTo(m, x, y);
  }
  // 말 걸기
  async function talk(a) {
    const g = G(), S = St.S, R = ROLES[a.extra];
    a.stop(); a.setDirTo(g.player.x, g.player.y);
    let pool = R.talk.slice();
    if (a.extra === 'mp' && !withCap()) pool = pool.filter(t => !t.includes('대위님 일행'));
    if (a.extra === 'pubboss' || a.extra === 'innclerk') pool = pool.filter(t => withCap() || !t.includes('대위'));
    await lines([`X:${a.id}:` + U.pickFresh('xtalk_' + a.extra, pool)]);
    // 직원은 하는 일로 이어진다
    const next = { dealer: () => H.cards(), pubboss: () => H.rumor(), host: () => H.reserve(), usher: null, maskhost: () => H.mask(), rosevendor: () => H.rosecart(), cocktailer: () => H.cocktail(), busker: () => H.busk() }[a.extra];
    if (next) await next();
    if (a.extra === 'mp' && withCap() && once('rubyMP')) await lines(['C*:헌병이 나 보고 경례하려다 말았어. 사복이라.', 'C:…그래도 너 데리고 다니는 거 다 봤겠다. 내일 소문 나겠네. 좋다.']);
  }

  // ---------- 활동 ----------
  const H = {};
  const capLine = async (pool) => { if (withCap()) { G().cap.setDirTo(G().player.x, G().player.y); await lines(U.pickFresh('rcap_' + pool.length + pool[0][0], pool)); } };
  H.statue = async () => {
    await lines(['N:루비웨이 입구의 붉은 결정 조형물. 바닥 물에 동전을 던지면 소원이 이뤄진다는 말이 있다.']);
    const it = await PX.UI.menu('루비 조형물', [{ t: '🪙 동전 던지고 소원 빌기 (₢1)', k: 1 }, { t: '그냥 보기', k: 0 }]);
    if (!it || !it.k) return;
    if (!St.spend(1)) { PX.UI.toast('동전이 없어요'); return; }
    await lines(['N:퐁. 동전이 붉은 물속으로 가라앉는다.']);
    await capLine([['C:무슨 소원 빌었어? …아니, 말하지 마. 말하면 안 이뤄진대.', 'C*:내 거? 나도 비밀. 근데 네가 알 것 같은데.'], ['N:대위도 주머니를 뒤져 동전을 던진다. 한참 눈을 감고 있다.', 'C^:길게 빌었지. 항목이 많아서.'], ['C:난 소원 같은 거 안 믿는데.', 'C*:…그래도 하나 던졌어. 혹시 모르니까.']]);
    St.addAff(withCap() ? 2 : 0);
  };
  H.rosecart = async () => {
    const S = St.S;
    const it = await PX.UI.menu('🌹 장미 노점', [{ t: '🌹 루비 장미 한 송이 · ₢8', k: 'rubyrose', p: 8 }, { t: '💐 루비 장미 다발 · ₢30', k: 'rosebunch', p: 30 }, { t: '구경만', k: null }]);
    if (!it || !it.k) return;
    if (withCap() && S.rel.cap.stage >= 2) {
      await lines(['C:잠깐. 그거 내가 살게.', 'C*:장미는 받는 사람이 사는 거 아니야.', 'N:대위가 값을 치르고, 장미를 내게 내민다. 눈은 딴 데를 보고 있다.']);
      St.addItem(it.k); St.addAff(4);
      if (once('rubyRose')) G().memory('루비 장미', '대위가 장미를 사서 내밀었다. 눈은 딴 데를 보면서.', true);
      return;
    }
    if (!St.spend(it.p)) { PX.UI.toast('돈이 모자라요'); return; }
    St.addItem(it.k); PX.UI.toast(`${it.k === 'rubyrose' ? '🌹' : '💐'} ${PX.ITEMS[it.k].name}을(를) 샀다`.replace('을(를)', U.hasBatchim(PX.ITEMS[it.k].name) ? '을' : '를'));
  };
  H.cocktail = async () => {
    const S = St.S;
    const it = await PX.UI.menu('🍸 칵테일 카트', [{ t: '🍸 루비 하이볼 · ₢10', k: 1 }, { t: '🫧 별빛 소다 (무알코올) · ₢5', k: 2 }, { t: '그만두기', k: 0 }]);
    if (!it || !it.k) return;
    if (!St.spend(it.k === 1 ? 10 : 5)) { PX.UI.toast('돈이 모자라요'); return; }
    St.advance(15); S.energy = Math.min(100, S.energy + 4);
    PX.UI.toast(it.k === 1 ? '🍸 붉은 하이볼. 달고 시원하다' : '🫧 별빛 소다. 혀끝에서 톡톡 터진다');
    await capLine(it.k === 1 ? [['C:한 모금만 줘 봐. …달다. 너 같네.'], ['C*:얼굴 벌써 분홍색이다. 네온 탓이라고 해 둘게.']] : [['C:소다 좋네. 나도 그거.', 'C^:취하는 건 너 보는 걸로 충분해.']]);
  };
  const FORTUNES = [
    ['오늘 밤, 큰 그림자가 당신을 지켜줄 것', 'C^:맞네. 기계가 뭘 좀 아네.'],
    ['당신의 연인은 말보다 행동이 빠른 사람', 'C*:…이거 누가 입력했어?'],
    ['곧 오래 기다린 소식이 도착한다', 'C:보급선 얘기겠지. …아니면 뭐, 다른 거.'],
    ['상대가 당신을 생각하는 시간: 하루 23시간', 'C;:…1시간은 자야지.'],
    ['오늘의 행운 장소: 장미 노점 앞', 'C:저기 바로 앞인데. 가자.'],
    ['조심! 질투가 많은 사람이 옆에 있다', 'C;:…아닌데. 별로 안 많은데.'],
    ['당신은 이미 답을 알고 있다', 'C*:그 답이 나면 좋겠다.'],
  ];
  H.fortune = async () => {
    if (!St.spend(3)) { PX.UI.toast('돈이 모자라요 (₢3)'); return; }
    const f = U.pick(FORTUNES);
    await lines(['N:보랏빛 구슬이 빙글 돈다. 덜컥, 종이 한 장이 나온다.', `N:🔮 「${f[0]}」`]);
    if (withCap()) await lines([f[1]]);
  };
  const POSES = [
    { k: 'v', t: '✌️ 브이', s: 0, txt: '둘 다 브이. 대위 손가락이 화면 밖으로 삐져나갔다.' },
    { k: 'cheek', t: '😊 볼 맞대기', s: 3, txt: '볼을 맞댄 사진. 대위 귀가 빨갛게 찍혔다.' },
    { k: 'hug', t: '🤗 뒤에서 안기', s: 3, txt: '대위가 뒤에서 감싸 안은 사진. 내 머리가 대위 턱 밑에 딱 맞는다.' },
    { k: 'funny', t: '🤪 웃긴 표정', s: 0, txt: '웃긴 표정 사진. 대위는 끝까지 진지한 얼굴이다. 그게 더 웃기다.' },
    { k: 'mask', t: '🎭 축제 가면 쓰고', s: 2, txt: '축제 가면을 쓴 두 사람. 그래도 누군지 다 알겠다.' },
  ];
  H.photobooth = async () => {
    const S = St.S, cap = withCap();
    const opts = POSES.filter(p => cap ? S.rel.cap.stage >= p.s : p.s === 0);
    const it = await PX.UI.menu('📸 네온 포토부스 · ₢10 (네 컷)', opts.map(p => ({ t: p.t, k: p })).concat([{ t: '그만두기', k: null }]));
    if (!it || !it.k) return;
    if (!St.spend(10)) { PX.UI.toast('돈이 모자라요'); return; }
    const g = G(); if (cap) PX.Cap.sitNear(g);
    for (let i = 0; i < 4; i++) { g.fade(); await U.sleep(320); }
    if (cap) {
      await lines([U.pick([['C:한 장 더 찍자. 나 눈 감았어.'], ['C*:이거 내 단말 배경으로 한다.'], ['C^:네 컷 중에 네가 제일 예쁜 컷은… 네 장 다.']])]);
      St.addAff(3);
      const key = 'booth_' + it.k.k;
      if (once(key)) g.memory('네온 포토부스 · ' + it.k.t.replace(/^\S+\s/, ''), it.k.txt, true);
      else PX.UI.toast('📸 사진이 나왔다');
    } else PX.UI.toast('📸 혼자 찍은 네 컷. 꽤 잘 나왔다');
  };
  H.busk = async () => {
    if (!night()) { PX.UI.toast('🎸 버스커는 밤에 나와요'); return; }
    const it = await PX.UI.menu('🎸 버스킹', [{ t: '🎧 듣기', k: 'listen' }, { t: '💰 팁 주기 (₢5)', k: 'tip' }, ...(withCap() ? [{ t: '🎵 대위가 신청곡 넣기', k: 'req' }] : [])]);
    if (!it) return;
    St.advance(15);
    if (it.k === 'tip') { if (!St.spend(5)) { PX.UI.toast('돈이 모자라요'); return; } PX.UI.toast('🎸 가수가 고개를 숙여 인사한다'); }
    if (it.k === 'req') {
      await lines(['C:저기, 한 곡 신청해도 됩니까?', 'C*:…이 사람이 좋아하는 걸로.', 'N:가수가 웃으며 옛 지구 노래를 시작한다. 대위가 슬쩍 내 손을 잡는다.', 'C:이 노래 끝날 때까지만. …아니, 그다음 곡도.']);
      St.addAff(4);
      if (once('rubyBusk')) G().memory('거리의 신청곡', '대위가 나를 위해 신청곡을 넣었다.', true);
      return;
    }
    await lines(['N:♪ 낮게 울리는 기타 소리가 네온 사이로 번진다.']);
    await capLine([['C:노래 좋다. 너 흥얼거리는 거 다 들려.'], ['C*:나도 기타 배워 볼까. 손가락이 굵어서 줄 두 개씩 눌릴 것 같지만.']]);
  };
  // 퍼퓸덴: 시향 (LB86)
  const NOTES = [['향열매', '달고 맑은 과일 향'], ['유리꽃', '차갑고 투명한 꽃 향'], ['발광초 잎', '풀잎을 비빈 듯한 초록 향'], ['제6행성 서리', '코끝이 찡한 겨울 향'], ['따뜻한 나무', '오래된 책장 같은 향'], ['광물염', '바다와 돌 냄새'], ['은사막 밤공기', '건조하고 서늘한 밤 냄새'], ['지구 커피', '쌉쌀하고 고소한 향'], ['꿀', '느리고 달콤한 잔향']];
  H.sniff = async () => {
    const S = St.S, picks = U.shuffle ? U.shuffle(NOTES.slice()).slice(0, 3) : NOTES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const it = await PX.UI.menu('🧪 시향 선반', picks.map(n => ({ t: `${n[0]}`, sub: n[1], k: n })).concat([{ t: '그만두기', k: null }]));
    if (!it || !it.k) return;
    S.done.likedNote = it.k[0];
    await lines([`N:종이 시향지에 한 방울. ${it.k[1]}가 난다.`.replace('가 난다', U.hasBatchim(it.k[1]) ? '이 난다' : '가 난다')]);
    if (withCap()) await lines([U.pick([[`C:${it.k[0]}… 이거 좋아하는구나. 기억해 둘게.`], ['C*:난 잘 모르겠는데, 네가 좋아하는 얼굴은 알겠어.'], ['N:대위가 시향지를 받아 코에 대더니 주머니에 넣는다.', 'C:가져갈게. 작전 나가서 꺼내 보게.']])]);
  };
  // 가면 (LB88)
  const MASKS = Object.entries(PX.S.MASKS).map(([k, m]) => ({ t: `${m.icon} ${m.name}`, c: k }));
  const ALIAS = ['루나', '블루', '미스틱', '체리', '노바'];
  function setMask(actor, c) { actor.app.mask = c; delete actor.app._k; }
  function unmask() { const g = G(); for (const a of [g.player, g.cap]) if (a && a.app && a.app.mask) { delete a.app.mask; delete a.app._k; } }
  H.mask = async () => {
    const S = St.S, g = G();
    if (g.player.app.mask) {
      const it = await PX.UI.menu('🎭 가면', [...(withCap() ? [{ t: '🎭 처음 보는 척하기', k: 'rp' }] : []), { t: '가면 벗기', k: 'off' }]);
      if (!it) return;
      if (it.k === 'off') { unmask(); PX.UI.toast('가면을 벗었다'); return; }
      return roleplay();
    }
    const m = await PX.UI.menu('🎭 가면 고르기', MASKS.map(x => ({ t: x.t, k: x })));
    if (!m) return;
    const al = await PX.UI.menu('별칭 정하기', ALIAS.map(a => ({ t: a, k: a })));
    if (!al) return;
    S.maskAlias = al.k; setMask(g.player, m.k.c);
    PX.UI.toast(`🎭 오늘 밤 별칭: ${al.k}`);
    if (withCap()) {
      const cm = await PX.UI.menu('대위 가면도 골라 주기', MASKS.filter(x => x.c !== m.k.c).sort(() => Math.random() - 0.5).slice(0, 4).map(x => ({ t: x.t, k: x })));
      setMask(g.cap, cm ? cm.k.c : 'lace');
      await lines([`N:대위가 ${PX.S.MASKS[g.cap.app.mask].name}을 쓴다. 가면이 얼굴에 비해 작아 보인다.`, 'C*:어때. 못 알아보겠지?', 'N:지나가던 가면 쓴 바텐더가 대위를 알아보고 꾸벅 인사한다.', 'X:mbartender:대위님, 오셨어요.', 'C;:…가면 썼는데.']);
      if (once('maskSpotted')) G().memory('가면 쓴 대위', '가면을 썼는데도 덩치 때문에 바로 들켰다.', true);
    }
  };
  async function roleplay() {
    const S = St.S;
    await lines([`C*:처음 뵙겠습니다. 별칭이… ${S.maskAlias || '루나'}?`, 'C^:좋은 이름이네요. 저는… 곰.', 'P:곰이요?', 'C:덩치 보면 알잖아요.', { q: [['곰 씨, 춤 한 곡 어때요?', 3, ['C*:처음 보는 사람이랑은 안 추는데… 당신이면 특별히.']], ['곰 씨는 애인 있어요?', 4, ['C:있어요. 엄청 예쁜.', 'C^:지금 제 앞에 있는 사람이랑 좀 닮았어요.']]] }, 'C;:…못 하겠다. 너한테 존댓말 하니까 혀가 꼬여.']);
    St.addAff(3);
    if (once('maskRP')) G().memory('곰 씨와 ' + (S.maskAlias || '루나'), '가면을 쓰고 처음 보는 척했다. 대위는 3분을 못 버텼다.', true);
  }
  // 미드나잇 룸 (LB85): 예약 · 음악 채널 · 향
  const booked = () => (St.S.done.midnightUntil || 0) > St.absMin();
  H.reserve = async () => {
    if (booked()) { PX.UI.toast('🕰️ 예약 중이에요. 편히 쉬다 가세요'); return true; }
    const ok = await PX.UI.ask('미드나잇 룸', '두 시간 예약할까요? (₢60 · 음악 채널 · 향 조절 · 방음)', '예약하기', '그만두기');
    if (!ok) return false;
    if (!St.spend(60)) { PX.UI.toast('돈이 모자라요'); return false; }
    St.S.done.midnightUntil = St.absMin() + 120;
    PX.UI.toast('🕰️ 두 시간 예약했다');
    if (withCap()) await lines(['C*:예약까지 했으니까 두 시간은 아무도 못 불러. 작전 무전도.', 'C:…무전은 켜 둘게. 그래도 귀는 너한테.']);
    return true;
  };
  const CHANNELS = [
    { t: '🎷 옛 지구 재즈', cap: ['C:재즈 좋네. 느려서 좋아.', 'C*:이런 거 틀어 놓으면 너 말도 느려지더라. 그게 좋아.'] },
    { t: '🌧️ 빗소리', cap: ['C:돔 안엔 비가 안 오니까. 이거라도.', 'C^:지구에선 비 오는 날 창가에서 라면 먹었어. 언젠가 같이.'] },
    { t: '📻 페르녹스 심야 라디오', cap: ['N:심야 라디오에서 외곽 2구역 통신이 복구됐다는 소식이 흘러나온다.', 'C:저거 우리 팀 소식이야. 들려줘서 다행이다. 무사하대.'] },
    { t: '🎧 대위의 플레이리스트', cap: ['C;:…그거 누르지 마.', 'N:첫 곡이 흘러나온다. 내가 예전에 좋다고 했던 노래다. 두 번째 곡도, 세 번째도.', 'C*:…네가 좋다고 한 것만 모은 거야. 들켰네.'] },
  ];
  H.channel = async () => {
    const g = G();
    if (g.mapId === 'midnight' && !booked() && !(await H.reserve())) return;
    if (g.mapId === 'midnight' && withCap() && once('midnightTuned')) await lines(['N:채널 박스를 켜니 이미 음악이 흐르고 있다. 내가 좋아하는 곡들이다.', 'C*:미리 맞춰 놨어. 너 차에서 흥얼거리던 거.']);
    const it = await PX.UI.menu('🎵 음악 채널', CHANNELS.map(c => ({ t: c.t, k: c })).concat(g.mapId === 'midnight' && withCap() ? [{ t: '🛋️ 소파에서 이야기하기', k: 'talk' }] : []));
    if (!it) return;
    if (it.k === 'talk') return H.lounge();
    PX.UI.toast(`${it.k.t} 재생 중`);
    if (withCap()) await lines(it.k.cap);
  };
  H.lounge = async () => {
    const g = G(), S = St.S;
    const sofa = W.maps[g.mapId].objs.find(o => o.fid === 'sofa');
    if (sofa) { const s = (sofa.seats || []).find(s => !s.by); if (s) g.player.sitOn(s); PX.Cap.sitNear(g); }
    await U.sleep(500);
    const deep = S.rel.cap.stage >= 5;
    await lines(U.pick(deep ? [
      ['C:…작전 나가면 제일 무서운 게 뭔지 알아?', 'C:죽는 거 아니야. 돌아왔는데 네가 없는 거.', { q: [['저 여기 있을게요.', 5, ['C*:응. 약속한 거다. 무르기 없다.']], ['대위님도 꼭 돌아와요.', 5, ['C^:당연하지. 난 늘 돌아와. 너한테.']]] }],
      ['C:나중에 전역하면 뭐 할 것 같아?', 'C*:난 정해 놨어. 너 출근할 때 문 앞에서 기다리는 거. 지금이랑 똑같네.', 'C^:아, 하나 다르다. 그땐 안 돌아가.'],
    ] : [
      ['C:방음 확실하대. 그러니까 하는 말인데.', 'C*:…너 오늘 진짜 예쁘다. 밖에서 말하면 헌병이 들을까 봐.'],
      ['C:이런 데 처음이야? 나도.', 'C;:…거짓말 아니야. 예약 화면 보는 데만 이십 분 걸렸어.'],
    ]));
    St.advance(40); St.addAff(5);
    if (once('midnightTalk')) g.memory('미드나잇 룸', '낮은 조명 아래서 대위가 평소엔 안 하던 이야기를 했다.', true);
  };
  H.scent = async () => {
    const S = St.S, g = G();
    if (g.mapId === 'midnight' && !booked() && !(await H.reserve())) return;
    const opts = [{ t: '🌙 은사막 밤공기', k: 'night' }, { t: '🍊 향열매', k: 'fruit' }, { t: '🪵 따뜻한 나무', k: 'wood' }];
    if (S.myPerfume) opts.unshift({ t: `🧴 내가 만든 향 「${S.myPerfume}」`, k: 'mine' });
    if (S.done.likedNote) opts.push({ t: `🧪 시향했던 ${S.done.likedNote}`, k: 'liked' });
    const it = await PX.UI.menu('🌫️ 향 조절', opts);
    if (!it) return;
    PX.UI.toast('🌫️ 방 안에 향이 천천히 퍼진다');
    if (!withCap()) return;
    if (it.k === 'mine') await lines(['C:…이거. 퍼퓸덴에서 네가 만든 거지.', 'C*:기억한다고 했잖아. 이 냄새 나면 너 생각난다고.']);
    else if (it.k === 'liked') await lines([`C:${S.done.likedNote}. 너 그거 좋다고 했잖아.`, 'C^:난 네가 좋다고 한 건 다 외워.']);
    else await lines([U.pick([['C:향 좋다. 근데 난 네 샴푸 냄새가 더 좋아.'], ['C*:이러다 졸겠다. 졸면 깨워 줘. 아니, 깨우지 마.']])]);
  };
  // 다이스키스 카드 하이로우 (LB87)
  H.cards = async () => {
    const S = St.S, cap = withCap();
    const ok = await PX.UI.ask('🃏 카드 하이로우', `다음 카드가 높을지 낮을지, 세 번 중 두 번 맞히면 승리. (₢10)${cap ? '\n진 쪽이 벌칙! 벌칙은 둘 다 좋다고 해야 성립.' : ''}`, '한 판!', '그만두기');
    if (!ok) return;
    if (!St.spend(10)) { PX.UI.toast('돈이 모자라요'); return; }
    let cur = 2 + Math.floor(Math.random() * 11), win = 0;
    for (let r = 0; r < 3; r++) {
      const it = await PX.UI.menu(`🃏 지금 카드: ${cur} (${r + 1}/3)`, [{ t: '⬆️ 높다', k: 1 }, { t: '⬇️ 낮다', k: -1 }]);
      let nx = 1 + Math.floor(Math.random() * 13); while (nx === cur) nx = 1 + Math.floor(Math.random() * 13);
      const right = it && ((nx > cur) === (it.k > 0));
      if (right) win++;
      PX.UI.toast(`${right ? '⭕' : '❌'} 다음 카드 ${nx}`);
      cur = nx; await U.sleep(350);
    }
    St.advance(20);
    const iWon = win >= 2;
    if (iWon) { S.money += 20; PX.UI.toast('🎉 이겼다! ₢20'); }
    if (!cap) return;
    if (iWon) {
      await lines(['C;:…졌다. 벌칙 받을게. 순순히.']);
      const pen = await PX.UI.menu('대위 벌칙 고르기', [{ t: '💪 그 자리에서 팔굽혀펴기 20개', k: 'push' }, { t: '🤫 비밀 하나 말하기', k: 'secret' }, { t: '🥺 애교 한마디', k: 'cute' }, { t: '봐주기', k: 'none' }]);
      const P = { push: ['N:대위가 바닥에 엎드린다. 스물. 숨도 안 찬다.', 'C*:벌칙 맞아? 이거 아침 운동인데.'], secret: [U.pick(['C:…처음 너 봤을 때, 사실 보고서 세 번 다시 썼어. 집중이 안 돼서.', 'C:네 숙소 앞 가로등, 내가 고쳐 달라고 민원 넣은 거야. 어두워서.', 'C:작전 나갈 때 네 사진 방탄조끼 안에 넣고 다녀.']), 'C;:…이제 됐지?'], cute: ['C;:…', 'C~:…자기야, 나 한 판만 봐주라.', 'N:주변 테이블이 조용해진다. 대위 귀가 새빨갛다.', 'C;:두 번은 없다.'], none: ['C^:봐주는 거야? 다음 판은 내가 봐줄게.'] }[pen ? pen.k : 'none'];
      await lines(P); St.addAff(4);
      if (pen && pen.k === 'cute' && once('capCute')) G().memory('대위의 애교', '벌칙으로 애교를 시켰다. 다이스키스가 조용해졌다.', true);
    } else {
      await lines(['C*:내가 이겼네. 벌칙은…', 'N:대위가 턱을 괴고 한참 고민한다. 일 분. 이 분.', 'C;:…못 고르겠다. 다 하고 싶은데 다 시키긴 미안하고.']);
      const pen = U.pick([['손잡고 집까지 걷기', 'C:좋아. 그럼 집까지 손 안 놓기. 그게 벌칙.'], ['내일 아침 같이 먹기', 'C:내일 아침 같이 먹기. 식당 말고, 내가 해 준 거.'], ['사진 한 장', 'C:포토부스 한 장. 내가 고른 포즈로.']]);
      const ok2 = await PX.UI.ask('대위의 벌칙', `「${pen[0]}」 — 괜찮아?`, '좋아요', '다른 걸로 해요');
      if (ok2) { await lines([pen[1], 'C^:벌칙인데 내가 상 받는 기분이다.']); St.addAff(4); }
      else await lines(['C:응, 알았어. 그럼 벌칙 없음. 다음에 써먹을게.']);
    }
  };
  H.darts = async () => {
    const sc = await PX.Mini.targets({ title: '🎯 다트', help: '과녁이 뜨면 빠르게 맞히세요!', time: 15, goal: 12, color: '#d0563b', bg: '#3a2a20' });
    St.advance(15);
    PX.UI.toast(`🎯 다트 ${Math.round(sc * 100)}점`);
    await capLine(sc > 0.6 ? [['C!:…잘 던지네? 사격장 데려가야겠다.']] : [['C:팔꿈치를 이렇게. …내가 잡아 줄게.', 'N:대위가 뒤에서 팔을 잡고 각도를 고쳐 준다. 숨결이 귀에 닿는다.']]);
  };
  // 술집 골목 소문 (LB77): 대위가 사실과 헛소문을 갈라 준다
  const RUMORS = [
    ['폐쇄 연구기지 지하에 아직 불이 켜져 있대.', 'C:불은 켜져 있어. 자동 전력이야. 사람은 없어. 내가 봤어.'],
    ['통신탑에서 밤마다 이상한 신호가 잡힌대.', 'C*:반은 맞아. 신호는 잡혀. 외계인 아니고 고장 난 중계기야.'],
    ['봉인 화물 안에 외계 알이 들었대.', 'C:헛소문. 봉인 화물은 대부분 서류야. 진짜로.'],
    ['보급선이 다음 달엔 두 번 온대.', 'C:확인 안 된 얘기. 기대는 하지 마. 실망하는 얼굴 보기 싫어.'],
    ['은사막에 은색 여우가 산대.', 'C*:봤다는 사람 셋 알아. 셋 다 술 취해 있었어.'],
    ['수색팀 대위가 요즘 연애한대.', null],
  ];
  H.rumor = async () => {
    const S = St.S, r = U.pick(RUMORS);
    PX.EXTRA.rumorer = { name: '옆자리 손님', look: null };
    await lines(['N:옆자리에서 낮은 목소리가 들린다.', `X:rumorer:${r[0]}`]);
    if (!withCap()) return;
    if (r[1]) await lines([r[1]]);
    else await lines(S.rel.cap.stage >= 4 ? ['C^:…그건 사실.', 'C*:누군지도 알려 줄까? 지금 내 앞에 있는데.'] : ['C;:…누가 그래?', 'C:헛소문이야. 아직은.']);
    St.addAff(1);
  };
  // 술: 대위는 두 잔에서 멈춘다 (LB76)
  H.drink = async () => {
    const S = St.S, g = G();
    const k = 'glass_' + S.day;
    const it = await PX.UI.menu(g.mapId === 'pub' ? '🍺 술집 골목' : '🍹 바', [{ t: '🍺 맥주 · ₢8', k: 1 }, { t: '🍹 향열매 칵테일 · ₢12', k: 2 }, { t: '🧃 무알코올 냉음료 · ₢6', k: 3 }, ...(g.mapId === 'pub' ? [{ t: '🗣️ 소문 듣기', k: 4 }] : [])]);
    if (!it) return;
    if (it.k === 4) return H.rumor();
    if (!St.spend([0, 8, 12, 6][it.k])) { PX.UI.toast('돈이 모자라요'); return; }
    St.advance(25); S.energy = Math.min(100, S.energy + 3);
    S.done[k] = (S.done[k] || 0) + (it.k < 3 ? 1 : 0);
    if (!withCap()) { PX.UI.toast('🍻 한 잔 마셨다'); return; }
    const n = S.done[k];
    if (it.k === 3) await lines([U.pick(['C:잘 골랐다. 나도 그거.', 'C*:취한 너도 귀엽지만, 멀쩡한 너랑 오래 얘기하는 게 더 좋아.'])]);
    else if (n === 1) await lines([U.pick(['C:건배. 오늘 무사히 끝난 거에.', 'C*:첫 잔은 원샷 안 해도 돼. 천천히.'])]);
    else if (n === 2) await lines(['C:나 여기서 멈출게. 두 잔.', 'C^:너 데려다줘야 하니까. 그게 내 몫이야.']);
    else await lines(['C;:…너 세 잔째다.', 'C:물 한 잔 시켜 줄게. 그다음에 업혀.']);
  };
  // 새벽 샤워실 (LB89)
  H.spa = async () => {
    if (!St.spend(5)) { PX.UI.toast('돈이 모자라요 (₢5)'); return; }
    G().fade(); St.advance(20); St.S.energy = Math.min(100, St.S.energy + 20);
    PX.UI.toast('🚿 뜨거운 물이 밤새 피로를 씻어 낸다 (기력 +20)');
    if (withCap() && once('dawnSpa')) await lines(['C:샤워는 부대 가서 해. 같이.', 'C*:…농담이야. 반은.']);
  };
  const REVIEWS = [
    '다이스키스 ★★★★★ 벌칙으로 노래 시켰더니 상대가 오페라를 함.',
    '은밀숙소 물침대 ★★★★☆ 멀미 주의. 그래도 다시 감.',
    '실버마스크 ★★★★★ 가면 썼는데 수색팀 대위 덩치는 못 숨김.',
    '퍼퓸덴 ★★★★☆ 향 이름을 애인 이름으로 지었다가 헤어짐. 향은 좋음.',
    '블라인드 쇼룸 ★★★☆☆ 같이 간 애인이 질투해서 공연 반만 봄.',
    '미드나잇 룸 ★★★★★ 방음 확실. 둘이 노래방처럼 씀.',
    '술집 골목 ★★★★☆ 사장님 소문이 안주보다 맛있음.',
    '장미 노점 ★★★★★ 할머니가 덤으로 한 송이 더 줌.',
  ];
  H.reviews = async () => {
    const r = REVIEWS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    await lines(['N:손글씨 후기가 빼곡하다.', ...r.map(x => 'N:📝 ' + x)]);
    await capLine([['C*:실버마스크 후기… 저거 나 아니야.', 'C;:…나 맞다.'], ['C:후기 쓰는 사람들 부지런하다. 난 너랑 다닌 데 별점 다 다섯 개야.']]);
  };

  const LABEL = { statue: '🪙 루비 조형물', rosecart: '🌹 장미 노점', cocktail: '🍸 칵테일 카트', fortune: '🔮 연애 운세', photobooth: '📸 포토부스', busk: '🎸 버스킹', sniff: '🧪 시향하기', mask: '🎭 가면', channel: '🎵 음악 채널', scent: '🌫️ 향 조절', cards: '🃏 카드 하이로우', darts: '🎯 다트', spa: '🚿 스파 샤워', reviews: '📝 후기 게시판' };
  Object.assign(PX.Act.LABEL, LABEL);
  return { spawn, think, talk, H, LABEL, unmask, ROLES, night };
})();
