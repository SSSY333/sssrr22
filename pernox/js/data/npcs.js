// NPC 24명 (대위 포함). 일정: "HH:MM 스폿" 을 | 로 이음. '-' = 지도 밖(개인 숙소 등), 'field' = 외곽 임무
// 스폿 'mess.b00a/1' = 그 가구의 1번 자리
'use strict';
(() => {
  const S = PX.S;
  const UNI = { top: '#5a6b45', bottom: '#4a5240', shoe: '#2f2a24' };
  const look = (skin, hair, hc, eye, o = {}) => Object.assign({ skin: S.SKINS[skin], hair, hairColor: S.HAIRC[hc], eye: S.EYEC[eye], top: UNI.top, bottom: UNI.bottom, shoe: UNI.shoe, sleeve: 'long' }, o);
  const N = [];
  const add = (o) => N.push(o);

  add({ id: 'cap', name: '(사용자 지정)', age: 35, job: '606부대 수색팀 대위 · 팀장', team: '수색팀', main: true,
    look: { big: 1, skin: '#e8b48e', hair: 'slick', hairColor: '#17141d', eye: '#2a2228', top: '#232129', jacket: '#56603f', bottom: '#3d3f47', shoe: '#1f1c22', sleeve: 'short', scar: 1, brows: '#17141d', eyeStyle: 'sharp', tag: 1 },
    personality: '능글맞고 직설적. 플레이어에게 첫눈에 반했다. 일은 성실하게 한다.', work: '수색팀 작전동', home: '대위 개인 막사',
    sched: '06:00 cap.bed|06:30 gym.bp|07:30 mess.b01a/1|08:00 ops.b1|09:00 ops.cap|12:00 mess.b01a/1|13:00 field|17:00 med.patient|17:30 ops.cap|18:00 mess.b01a/1|19:00 free|22:00 cap.sofa/0|23:00 cap.bed',
    sched2: '06:00 cap.bed|06:30 hg.drone|07:30 mess.b01a/1|08:00 ops.b1|09:00 hg.w2|12:00 mess.b01a/1|13:00 field|17:00 med.patient|17:30 ops.cap|18:00 mess.b01a/1|19:00 free|22:00 cap.sofa/0|23:00 cap.bed',
    we: '07:30 cap.bed|08:30 mess.b01a/1|09:30 cap.craft|12:00 mess.b01a/1|13:00 free|18:00 mess.b01a/1|19:00 free|22:00 cap.sofa/0|23:30 cap.bed',
    likesFood: '냉삼, 김치찌개, 차가운 건 전부', likesGift: '외계 광물 조각, 공구, 냉각 선풍기, 플레이어가 준 것 전부', rel: '플레이어에게 첫눈에 반함 (만난 지 1년)',
    special: ['장기작전', '숙소 방문', '숙박 요청', '문틀 박치기'] });

  add({ banmal: true, id: 'kang', name: '강태욱', age: 52, job: '606부대 중령 · 부대 지휘관', team: '지휘부', look: look(2, 'crew', '은발', '갈색', { top: '#4f5a3d', bottom: '#3f4a30', badge: '#e8c56a', brows: '#8a8a8a' }),
    personality: '무뚝뚝하지만 부하들을 아낀다.', work: '행정동', home: '지휘관 숙소',
    sched: '07:00 -|08:00 ops.b3|09:00 adm.cmd|12:00 mess.b00a/0|13:00 adm.cmd|18:00 mess.b00a/0|19:00 base.flag|19:30 -', we: '09:00 -|10:00 base.flag|11:00 adm.cmd|12:00 mess.b00a/0|13:00 -',
    likesFood: '된장국', likesGift: '지구산 커피', rel: '상관',
    lines: { g: ['오늘도 별일 없지? 별일 없어야지.', '전선 행성이라고 매일 싸우는 건 아니야. 관리하는 거지.', '보고서는 짧고 정확하게. 그게 다다.', '{c} 대위? 실력은 내가 보증하지. 입이 문제지만.'],
      m: ['일찍 나왔군. 좋아.'], e: ['늦게까지 고생 많다. 들어가 쉬어.'], cap: ['그 녀석이 요즘 표정이 밝아. 누구 덕인지는 알 것 같고.', '{c} 녀석 문틀에 머리 박는 소리, 행정동까지 들려.'] } });
  add({ banmal: true, id: 'park', name: '박도현', age: 38, job: '수색팀 중사', team: '수색팀', look: look(2, 'crew', '흑발', '갈색', { brows: '#2a2433' }),
    personality: '대위의 오랜 동료. 묵묵하고 믿음직하다.', work: '수색팀 작전동', home: '간부 숙소동',
    sched: '06:30 base.train1|07:30 mess.b01a/0|08:00 ops.b2|09:00 ops.d1|12:00 mess.b01a/0|13:00 field|17:30 ops.d1|18:00 mess.b01b/0|19:00 lng.g1|22:00 -', we: '08:00 -|09:30 gym.wt|11:30 mess.b01b/0|13:00 lng.sofa3/0|17:00 -',
    likesFood: '김치찌개', likesGift: '정밀 공구 세트', rel: '동료',
    lines: { g: ['대위님이랑 같이 산 게 벌써 칠 년째야. 저 사람 원래 저래.', '외곽은 조용해. 조용할 때가 제일 조심해야 하지만.', '장비 점검은 두 번. 습관이야.', '…응. 수고했어.'],
      cap: ['대위님이 요새 작전 끝나면 뛰어가더라. 어딜 그렇게 가나 했지.', '저 사람이 사과하는 걸 처음 봤어. 너한테.', '흉터? 신병들 구하다 생긴 거야. 본인은 자랑으로 여겨.'], rain: ['비 오는 날 외곽은 흔적이 다 씻겨. 일이 두 배야.'] } });
  add({ id: 'lee', name: '이준혁', age: 27, job: '수색팀 하사', team: '수색팀', look: look(1, 'wolf', '밝은 갈색', '갈색'),
    personality: '분위기 메이커. 장난과 농담을 달고 산다.', work: '수색팀 작전동', home: '병사 생활관',
    sched: '06:00 brk.bed1|07:00 mess.b11a/1|08:00 ops.b4|09:00 ops.d2|12:00 mess.b11a/1|13:00 field|17:30 ops.d2|18:00 mess.b11a/1|19:00 lng.arcade|21:30 brk.tv/1|23:00 brk.bed1', we: '08:30 brk.bed1|09:30 lng.arcade|12:00 mess.b11a/1|13:00 lng.g2|17:00 base.plaza1|19:00 lng.arcade|23:00 brk.bed1',
    likesFood: '라면', likesGift: '지구산 과자', rel: '친구',
    lines: { g: ['어! 오셨어요? 오늘 운세 좋대요, 제가 방금 지어냈어요.', '오락기 최고 점수 또 제가 갱신했습니다. 박수!', '휴게실 소파는 선착순입니다. 진짜로.', '대위님 앞에서는 제가 얌전한 편이에요. 상대적으로.'],
      cap: ['대위님 요즘 단말 볼 때마다 웃어요. 무섭게.', '대위님이 저한테 "{p} 봤냐"고 세 번 물어봤어요. 오늘만.', '수색 중에도 "이거 {p이} 좋아하겠다" 이러면서 돌을 주워요.'], e: ['밤엔 오락기가 제일 잘 돼요. 기분 탓이지만요.'] } });
  add({ id: 'choi', name: '최민재', age: 23, job: '수색팀 병장', team: '수색팀', look: look(1, 'short', '흑발', '갈색', { brows: '#2a2433' }),
    personality: '먹는 걸 제일 좋아한다.', work: '수색팀 작전동', home: '병사 생활관',
    sched: '06:00 brk.bed2|07:00 mess.b11a/0|08:00 ops.b5|09:00 hg.rest/0|11:40 mess.b11a/0|13:00 field|17:30 base.messfront|18:00 mess.b11a/0|19:30 brk.s1|23:00 brk.bed2', we: '08:00 brk.bed2|09:00 mess.b11a/0|10:00 brk.s1|11:30 mess.b11a/0|13:30 base.messfront|17:30 mess.b11a/0|19:30 brk.s1|23:00 brk.bed2',
    likesFood: '전부. 특히 냉동 만두', likesGift: '냉삼 도시락', rel: '친구',
    lines: { g: ['오늘 점심 뭔지 아세요? 전 알아요. 김치찌개예요.', '배고파서 일이 안 돼요. 밥 먹으면 졸려서 안 되고요.', '특식일엔 제가 제일 먼저 줄 서요.', '보급선 오는 날은 간식 재고 체크가 제 취미예요.'],
      cap: ['대위님이 자기 고기를 누구한테 덜어주는 걸 처음 봤어요. 충격.'], m: ['아침 메뉴 미리 봤는데요… 좋은 소식이 있어요.'] } });
  add({ id: 'jung', name: '정시우', age: 21, job: '수색팀 일병', team: '수색팀', look: look(0, 'short', '갈색', '갈색'),
    personality: '겁이 많지만 성실하다.', work: '수색팀 작전동', home: '병사 생활관',
    sched: '05:50 brk.bed3|06:30 base.train2|07:20 mess.b12a/0|08:00 ops.b3|09:00 ops.d3|12:00 mess.b12a/0|13:00 ops.d3|17:30 ops.d3|18:00 mess.b12a/0|19:00 brk.s2|22:30 brk.bed3', we: '07:00 brk.bed3|08:00 base.train2|09:30 brk.s2|12:00 mess.b12a/0|13:00 brk.s2|18:00 mess.b12a/0|22:30 brk.bed3',
    likesFood: '향열매 빙수', likesGift: '페르녹스 생태도감', rel: '후배',
    lines: { g: ['아, 안녕하십니까! …아니 안녕하세요!', '외곽 소리는 아직도 무서워요. 그래도 나가야죠.', '오늘 보고서 세 번 고쳐 썼어요.', '대위님이 저한테 "잘했다"고 하셨어요. 하루 종일 그 생각만 나요.'],
      night: ['밤엔 통신탑 쪽 소리가 더 크게 들려요… 기분 탓이겠죠?'], cap: ['대위님 처음엔 무서웠는데 지금은 덜 무서워요. 조금요.'] } });
  add({ id: 'han', name: '한도윤', age: 34, job: '작전장교 대위', team: '작전통제팀', look: look(0, 'short', '흑발', '회색', { top: '#4f5a3d', bottom: '#3f4a30', brows: '#2a2433' }),
    personality: '냉정하고 꼼꼼하다.', work: '수색팀 작전동 · 행정동', home: '간부 숙소동',
    sched: '07:00 -|07:40 mess.b00a/2|08:00 ops.b5|09:00 adm.c2|12:00 mess.b00a/2|13:00 ops.d4|18:00 mess.b00b/2|19:00 -', we: '10:00 adm.c2|12:00 -',
    likesFood: '블랙커피', likesGift: '정리된 서류', rel: '동료',
    lines: { g: ['보고서는 오늘 18시까지.', '일정 변경은 최소 하루 전에 공유해 주세요.', '감정은 일 끝나고.', '…괜찮은 판단이었습니다.'],
      cap: ['{c} 대위의 작전 성공률은 높습니다. 보고서 제출률은 낮고요.', '그 사람이 보고서를 일찍 낸 날은 대개 {pf} 씨랑 약속이 있는 날이더군요.'] } });
  add({ id: 'yoon', name: '윤서진', age: 31, job: '의무팀 간호장교', team: '의무팀', look: look(0, 'pony', '갈색', '갈색', { top: '#e9eef2', bottom: '#4a5a6a', coat: '#ffffff', badge: '#d64545' }),
    personality: '친절하고 똑 부러진다.', work: '의무동', home: '간부 숙소동',
    sched: '07:00 -|07:30 mess.b02a/0|08:30 med.nurse|12:00 mess.b02a/0|13:00 med.nurse|18:00 mess.b02b/0|19:00 lng.sofa1/0|21:00 -', we: '09:00 -|10:00 med.nurse|14:00 lng.sofa1/0|17:00 -',
    likesFood: '향열매 차', likesGift: '향열매 향수', rel: '동료',
    lines: { g: ['물 많이 드세요. 인공대기는 생각보다 건조해요.', '아픈 데 있으면 참지 말고 오세요.', '수색팀은 왜 다 다치고도 괜찮다고 할까요.', '오늘 검진 일정 확인하셨죠?'],
      cap: ['{c} 대위님은 아프다고 엄살 부릴 때가 진짜 안 아플 때예요.', '대위님 체온이 원래 높아요. 열 아니에요. 매번 확인했어요.'], job: { medic: ['선생님, 오늘 환자 기록 정리해 뒀어요.'] } } });
  add({ id: 'baek', name: '백승현', age: 22, job: '의무병', team: '의무팀', look: look(1, 'curly', '갈색', '갈색', { top: '#e9eef2', bottom: '#4a5a6a', badge: '#d64545' }),
    personality: '부대 소문에 밝다.', work: '의무동', home: '병사 생활관',
    sched: '06:30 brk.bed4|07:20 mess.b12b/1|08:30 med.wait/0|12:00 mess.b12b/1|13:00 med.wait/0|18:00 mess.b12b/1|19:00 lng.sofa2/1|22:30 brk.bed4', we: '08:30 brk.bed4|10:00 lng.sofa2/1|12:00 mess.b12b/1|13:00 base.plaza2|18:00 lng.sofa2/1|22:30 brk.bed4',
    likesFood: '지구산 과자', likesGift: '지구산 과자', rel: '친구',
    lines: { g: ['소문 하나 들으실래요? 공짜예요.', '통신탑 쪽에서 이상한 신호가 잡혔대요. 아니래요. 또 맞대요.', '헌병 중사님 오늘 기분 안 좋아요. 피하세요.', '휴게실 새 오락기 들어온대요! …아마도요.'],
      cap: ['부대에 대위님이 {pf} 님한테 프러포즈한다는 소문이 돌아요. 아직은 소문이에요.', '대위님이 의무동 올 때마다 아픈 척하는 거, 저만 아는 거 아니에요.'], rain: ['비 오는 날엔 소문도 축축해요. 무슨 말인지 모르겠죠? 저도요.'] } });
  add({ banmal: true, id: 'oh', name: '오지훈', age: 45, job: '정비팀 상사', team: '기술정비팀', look: look(3, 'crew', '흑발', '갈색', { top: '#3d5a7a', bottom: '#34506e', brows: '#2a2433' }),
    personality: '장비에 집착하는 기술자.', work: '정비격납고', home: '간부 숙소동',
    sched: '06:30 -|07:30 mess.b03a/0|08:00 hg.w1|12:00 mess.b03a/0|13:00 hg.w1|18:30 mess.b03b/0|19:30 hg.w1|21:00 -', we: '09:00 hg.w1|12:00 mess.b03a/0|13:00 hg.w1|17:00 -',
    likesFood: '라면', likesGift: '정밀 공구 세트', rel: '동료',
    lines: { g: ['드론은 거짓말 안 해. 사람이 대충 고치지.', '이 나사 하나가 목숨을 살려.', '공구는 제자리에. 세 번 말 안 한다.', '외계 광물 부품은 열 받으면 색이 변해. 재밌지.'],
      cap: ['{c} 대위가 또 잔해로 뭘 만들었더라. 솜씨는 인정한다.', '그 양반이 장비를 너한테 맞춰 개조해 달라더라. 무슨 사이야?'], job: { engineer: ['중위님, 3번 드론 회로 좀 봐 줘요.'] } } });
  add({ id: 'kimh', name: '김하린', age: 29, job: '정비팀 중위', team: '기술정비팀', look: look(0, 'bun', '흑발', '갈색', { top: '#3d5a7a', bottom: '#34506e' }),
    personality: '침착하고 손재주가 좋다.', work: '정비격납고', home: '간부 숙소동',
    sched: '07:00 -|07:40 mess.b03a/1|08:30 hg.w3|12:00 mess.b03a/1|13:00 hg.drone|18:00 mess.b03b/1|19:00 lng.g2|21:00 -', we: '10:00 hg.w3|12:30 mess.b03a/1|14:00 lng.g2|17:00 -',
    likesFood: '향열매 빙수', likesGift: '유리꽃 모조 장식', rel: '동료',
    lines: { g: ['천천히 하면 빨라요.', '방호복 봉제선 점검은 제가 할게요.', '오늘 드론 세 대 살렸어요.', '손 다치지 않게 장갑 끼세요.'],
      cap: ['대위님이 만든 장비, 설계는 엉망인데 이상하게 잘 돌아가요.'] } });
  add({ banmal: true, id: 'song', name: '송재민', age: 36, job: '보급담당 중사', team: '보급팀', look: look(2, 'short', '갈색', '갈색', { top: '#6b6a45', bottom: '#4a5240' }),
    personality: '간식과 물자 관리의 달인.', work: '보급창고', home: '간부 숙소동',
    sched: '07:00 -|07:30 mess.b10a/0|08:30 px.clerk|12:00 mess.b10a/0|13:00 px.clerk|19:00 mess.b10a/0|19:40 -', we: '10:00 px.clerk|12:00 mess.b10a/0|13:00 px.clerk|18:00 -',
    likesFood: '지구산 과자', likesGift: '지구산 커피', rel: '친구',
    lines: { g: ['어서 와. 오늘 냉삼 도시락 들어왔어.', '재고는 거짓말 안 해. 근데 과자는 자꾸 사라지지.', '보급선 둘째 주말에 와. 장터 열리면 놓치지 마.', '외상은 안 돼. …대위는 예외고.'],
      cap: ['{c} 대위가 냉각 선풍기를 다섯 개째 사 갔어. 다 어디 쓰는 거야?'] } });
  add({ banmal: true, id: 'nam', name: '남기철', age: 48, job: '식당동 조리장', team: '보급팀', look: look(2, 'crew', '흑발', '갈색', { top: '#f4f6f8', bottom: '#4a4a52', hat: '#ffffff' }),
    personality: '푸짐한 식사를 내준다.', work: '식당동', home: '-',
    sched: '05:30 mess.cook|09:00 mess.cook2|11:00 mess.cook|14:00 mess.cook2|16:30 mess.cook|20:00 -', we: '06:30 mess.cook|13:00 mess.cook2|16:30 mess.cook|20:00 -',
    likesFood: '남이 맛있게 먹는 모습', likesGift: '광물염 조미료', rel: '단골 손님',
    lines: { g: ['많이 먹어. 페르녹스는 배고프면 더 추워.', '오늘은 김치찌개야. 국물 넉넉히 줄게.', '남기면 내가 슬퍼.', '보급 늦으면 라면이야. 그래도 맛있게 끓여 줄게.'],
      cap: ['그 큰 대위 놈이 요즘 두 그릇씩 가져가. 하나는 누구 주는 거냐?'], m: ['아침 꼭 먹어. 꼭.'] } });
  add({ id: 'seo', name: '서유진', age: 30, job: '통신담당 중위', team: '통신팀', look: look(0, 'long', '흑발', '갈색', { top: '#4f5a3d', bottom: '#3f4a30' }),
    personality: '정보에 밝다.', work: '통신실', home: '간부 숙소동',
    sched: '07:30 -|08:00 com.1|12:00 mess.b02a/2|13:00 com.1|18:00 mess.b02b/2|19:00 com.4|22:00 -', we: '10:00 com.1|13:00 -',
    likesFood: '아이스커피', likesGift: '향열매 향수', rel: '동료',
    lines: { g: ['통신 상태 양호. 오늘은요.', '외곽 통신은 날씨 따라 끊겨요. 특히 모래바람.', '첫째 주 목요일 밤엔 야간 음소거예요. 잊지 마세요.', '메시지 지연이 생기면 보통 통신탑 탓이에요.'],
      cap: ['작전 중에 {c} 대위가 보내는 개인 메시지 양이… 통신 기록에 다 남는다는 거, 알려 줘야 할까요.'] } });
  add({ id: 'lim', name: '임현우', age: 33, job: '헌병 중사', team: '경계팀', look: look(1, 'crew', '흑발', '회색', { top: '#3a4a3a', bottom: '#2f3a2f', hat: '#3a4a3a', badge: '#ffffff' }),
    personality: '규정에 엄격하다.', work: '정문 · 순찰', home: '간부 숙소동',
    sched: '06:00 -|07:00 base.gate|12:00 mess.b10b/1|13:00 base.gate|18:00 mess.b10b/1|19:00 base.plaza2|22:00 base.gate|23:00 -', we: '08:00 base.gate|12:00 mess.b10b/1|13:00 base.gate|20:00 base.plaza2|22:00 -',
    likesFood: '된장국', likesGift: '수제 부대 패치', rel: '동료',
    lines: { g: ['출입 기록은 정확하게.', '야간 외출은 22시까지 복귀.', '규정은 사람을 지키라고 있는 겁니다.', '…수고하십니다.'],
      cap: ['{c} 대위님 막사 출입 기록에 {pf} 님 이름이 자주 보이네요. 규정 위반은 아닙니다.'] } });
  add({ id: 'bae', name: '배수아', age: 26, job: '행정담당 하사', team: '행정지원팀', look: look(0, 'bob', '분홍', '갈색', { top: '#8a8a5a', bottom: '#5a5a3a' }),
    personality: '행사와 근무표 담당. 꼼꼼하고 다정하다.', work: '행정동', home: '간부 숙소동',
    sched: '07:00 -|07:30 mess.b02a/1|08:30 adm.c1|12:00 mess.b02a/1|13:00 adm.c1|18:00 mess.b02b/1|19:00 lng.sofa1/1|21:00 -', we: '10:00 lng.sofa1/1|12:00 mess.b02a/1|13:00 base.plaza1|17:00 -',
    likesFood: '향열매 빙수', likesGift: '유리꽃 모조 장식', rel: '친구',
    lines: { g: ['이번 달 행사 일정은 단말 일정표에 다 올려 뒀어요!', '근무표 바꾸고 싶으면 하루 전에 말해 주세요.', '휴가 신청서는 저한테요. 도장은 중령님한테요.', '행사 준비는 힘들어도 다들 웃으면 좋아요.'],
      cap: ['{c} 대위님이 휴가 신청서를 쓰다가 날짜를 세 번 고쳤어요. {pf} 님 일정이랑 맞추시려고.'] } });

  // 돔시티 주민
  add({ id: 'jo', name: '조은별', age: 28, job: '생태연구원 (외계식물 전문가)', team: '돔시티 생태연구소', look: look(0, 'curly', '밝은 갈색', '초록', { top: '#7fc8b4', bottom: '#3a4a5a', coat: '#ffffff' }),
    personality: '식물 이야기만 나오면 눈이 반짝인다.', work: '민간 생태연구소', home: '민간 주거구역',
    sched: '08:00 -|09:00 lab.2|12:00 cafe.c3' + '7a|13:00 lab.2|18:00 dome.bench|19:00 -', we: '11:00 dome.bench|13:00 cafe.c37a|15:00 -',
    likesFood: '향열매 차', likesGift: '페르녹스 생태도감', rel: '동료/친구',
    lines: { g: ['유리꽃 꽃잎이 왜 투명한지 아세요? 아직 아무도 몰라요! 멋지죠!', '발광초는 밤에 더 예뻐요. 꼭 보러 가세요.', '검역 표본이 오늘 스무 개나 들어왔어요.', '돔 밖 식물은 진짜 강해요. 부러울 만큼.'],
      cap: ['그 큰 군인분, 연구소 경계 지원 올 때마다 {pf} 씨 자리만 봐요.'] } });
  add({ id: 'ryu', name: '류현석', age: 55, job: '민간 연구소장', team: '돔시티 생태연구소', look: look(1, 'short', '은발', '회색', { top: '#9aa6b4', bottom: '#4a4a52', coat: '#ffffff' }),
    personality: '연구에 몰두해 끼니를 잊는다.', work: '민간 생태연구소', home: '민간 주거구역',
    sched: '07:30 lab.boss|12:30 lab.boss|19:00 lab.c|22:00 -', we: '09:00 lab.boss|15:00 -',
    likesFood: '샌드위치 (먹는 걸 자주 잊음)', likesGift: '연구 노트', rel: '상사',
    lines: { g: ['아, 왔나. 그 표본 결과… 아니 그건 내일이었나.', '외계 생태계는 적이 아니야. 이해하지 못한 이웃이지.', '점심? 먹었… 안 먹었군.', '데이터는 쌓이면 이야기가 된다네.'] } });
  add({ id: 'shin', name: '신나래', age: 32, job: '향열매 카페 사장', team: '돔시티', look: look(1, 'pony', '붉은색', '호박색', { top: '#ff8b5e', bottom: '#5a3f2a' }),
    personality: '밝고 사교적이다.', work: '향열매 카페', home: '민간 주거구역',
    sched: '09:30 cafe.barista|21:30 -', we: '09:30 cafe.barista|21:30 -',
    likesFood: '향열매 파이', likesGift: '유리꽃 모조 장식', rel: '단골',
    lines: { g: ['어서 오세요! 오늘 향열매 상태 최고예요.', '여름엔 빙수, 겨울엔 코코아. 그게 국룰이죠!', '단골은 얼음 추가 무료예요.', '연인이랑 오면 컵에 하트 그려 드려요.'],
      cap: ['그 덩치 큰 손님, 얼음만 세 컵 시켜요. 그리고 {pf} 님 음료는 꼭 자기가 계산해요.'] } });
  add({ id: 'moon', name: '문성호', age: 44, job: '냉삼집 사장', team: '돔시티', look: look(3, 'crew', '흑발', '갈색', { top: '#d0563b', bottom: '#3a3a3a', hat: '#f4efe4' }),
    personality: '대위의 단골집 사장. 화끈하다.', work: '냉삼집 (중앙광장 상업구역)', home: '-',
    sched: '10:30 sg.boss|23:30 -', we: '10:30 sg.boss|23:30 -',
    likesFood: '냉삼', likesGift: '광물염', rel: '단골집 사장',
    lines: { g: ['어서 와요! 불판 달궈 놨어요.', '{c} 대위 오면 고기 두 배로 썰어 놔야 돼요. 그 양반 혼자 세 판 먹어요.', '냉삼은 불 세기가 생명이야.', '{c} 대위? 우리 집 기둥 단골이지.'] } });
  add({ id: 'go', name: '고유림', age: 27, job: '꽃시장 상인', team: '돔시티', look: look(0, 'long', '금발', '파랑', { top: '#ff9ed2', bottom: '#f4efe4' }),
    personality: '유리꽃과 장식품을 판다. 수다스럽다.', work: '유리돔 꽃시장', home: '민간 주거구역',
    sched: '09:30 fl.clerk|18:30 -', we: '09:30 fl.clerk|18:30 -',
    likesFood: '향열매 캔디', likesGift: '향열매 향수', rel: '이웃',
    lines: { g: ['꽃시장은 3~4월이랑 10월 주말에 열려요!', '유리꽃은 빛을 먹고 반짝여요. 진짜로요.', '선물용이면 포장 예쁘게 해 드릴게요.'] } });
  add({ id: 'cha', name: '차민호', age: 34, job: '우주항구 직원 (수송선 일정)', team: '우주항구', look: look(1, 'short', '흑발', '갈색', { top: '#3b5fa8', bottom: '#2c3e66', hat: '#3b5fa8' }),
    personality: '수송선 일정을 꿰고 있다.', work: '우주항구', home: '-',
    sched: '07:00 dome.shuttle|20:00 -', we: '08:00 dome.shuttle|18:00 -',
    likesFood: '아이스커피', likesGift: '지구산 과자', rel: '이웃',
    lines: { g: ['셔틀은 부대 정문이랑 돔시티를 30분 간격으로 오가요.', '항로 폐쇄 대기 주간엔 보급선이 안 와요. 간식 미리 사 두세요.', '지구행 수송선은 매달 마지막 금요일 아침이에요.'] } });
  add({ id: 'hong', name: '홍세아', age: 29, job: '돔시티 여행 안내원', team: '돔시티', look: look(0, 'bob', '흑발', '갈색', { top: '#ffd166', bottom: '#3a3f4a', hat: '#ffd166' }),
    personality: '관광 정보 전문가. 친절하다.', work: '중앙광장 안내 단말', home: '민간 주거구역',
    sched: '09:00 plaza.kiosk|18:00 -', we: '09:00 plaza.kiosk|19:00 -',
    likesFood: '향열매 빙수', likesGift: '유리꽃 모조 장식', rel: '이웃',
    lines: { g: ['인공노을 회랑은 매일 17시 40분! 놓치지 마세요.', '빛먼지 산책교는 수요일이랑 토요일 밤이에요.', '별비 투영실은 1일, 15일, 그리고 마지막 날!', '은사막 전망대는 가을 새벽이 제일 예뻐요.'] } });
  add({ id: 'yu', name: '유건우', age: 40, job: '민간 경비원', team: '돔시티', look: look(2, 'crew', '갈색', '갈색', { top: '#2f3a4a', bottom: '#2a2d33', badge: '#e8c56a' }),
    personality: '도시 소문에 밝다. 듬직하다.', work: '돔시티 순찰', home: '-',
    sched: '08:00 dome.lab|11:00 plaza.gate|14:00 plaza.water|17:00 plaza.street|20:00 dome.plaza|22:00 -', we: '10:00 plaza.fountain|15:00 plaza.water|20:00 -',
    likesFood: '냉훈제 생선', likesGift: '아이스커피', rel: '이웃',
    lines: { g: ['밤길 조심해요. 돔 안이라도요.', '봉인 화물 이야기? 반은 헛소문이에요. 반은… 모르죠.', '술집 골목엔 헌병 순찰 돌아요. 걱정 마세요.'] } });

  PX.NPCS = N;
  PX.NPC_BY_ID = Object.fromEntries(N.map(n => [n.id, n]));
})();
