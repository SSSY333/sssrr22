'use strict';
/* =========================================================
 *  해월도 마을생활 v2 — 게임 데이터 & 대사
 * ========================================================= */

const JOBS = {
  doctor: { name: '보건소 의사', icon: '🩺', place: 'clinic', act: '진료하기', pay: [9000, 13000],
    desc: '보건지소의 하나뿐인 의사. 할머니들의 무릎과 아이들의 감기를 책임져요.', work: ['할머니 혈압을 쟀다', '아이 무릎에 밴드를 붙였다', '어부 아저씨 허리에 파스를 붙였다', '예방접종 안내문을 붙였다'] },
  teacher: { name: '초등학교 선생님', icon: '📚', place: 'school', act: '수업하기', pay: [8000, 11000],
    desc: '전교생 열두 명, 해월초등학교 담임 선생님. 운동회와 소풍 준비로 바빠요.', work: ['받아쓰기 시험을 봤다', '바다 생물 그림을 그렸다', '운동회 계주 연습을 했다', '급식 당번을 도왔다'] },
  traveler: { name: '여행객', icon: '🧳', place: null, act: '여행 기록하기', pay: [3000, 6000],
    desc: '배낭 하나 메고 해월도에 막 도착한 여행객. 섬 곳곳을 기록하는 게 일이에요.', work: ['풍경을 스케치했다', '여행 블로그에 글을 올렸다', '사진 몇 장을 건졌다', '현지 맛집을 메모했다'] },
  cafe: { name: '카페 사장님', icon: '☕', place: 'cafe', act: '카페 영업', pay: [6000, 15000],
    desc: '섬에 하나뿐인 카페 쉼터의 사장님. 단골 1호는 아마… 파출소 쪽 사람이에요.', work: ['귤 라떼를 열 잔 팔았다', '원두를 볶았다', '테라스를 정리했다', '단골 할머니께 쌍화차를 냈다'] },
  haenyeo: { name: '해녀', icon: '🌊', place: 'storage', act: '물질하기', pay: [7000, 14000], loot: 'abalone',
    desc: '해녀창고에서 장비를 챙겨 바다로 나가는 해녀. 바다 날씨를 누구보다 잘 알아요.', work: ['소라를 한 망사리 땄다', '전복을 몇 개 건졌다', '성게를 캤다', '미역을 걷었다'] },
};
const TRAVEL_SPOTS = ['pier', 'lighthouse', 'observatory', 'cafe', 'beach', 'orchard', 'plaza', 'rocks', 'forest', 'pavilion', 'isletHill'];

/* ---------------- 달력 ---------------- */
const DAYS_PER_MONTH = 10;
const MONTH_SEASON = { 1: 'winter', 2: 'winter', 3: 'spring', 4: 'spring', 5: 'spring', 6: 'summer', 7: 'summer', 8: 'summer', 9: 'autumn', 10: 'autumn', 11: 'autumn', 12: 'winter' };
const SEASON_KO = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
const SEASON_ICON = { spring: '🌸', summer: '🌻', autumn: '🍁', winter: '❄️' };
function calendar(day) {
  const mo = Math.floor((day - 1) / DAYS_PER_MONTH);
  const month = ((6 + mo) % 12) + 1, dom = (day - 1) % DAYS_PER_MONTH + 1, year = Math.floor((6 + mo) / 12) + 1;
  return { month, dom, year, season: MONTH_SEASON[month] };
}

/* ---------------- 관계 단계 (8단계, 오래 즐기도록) ---------------- */
const STAGES = [
  { n: 1, name: '처음 만난 사이', unlock: '기본 대화 · 마을 안내' },
  { n: 2, name: '아는 사이', need: { aff: 30, flags: ['met'], days: 2 }, unlock: '일상 대화 · 작은 부탁 · 함께 앉기' },
  { n: 3, name: '친한 사이', need: { aff: 100, flags: ['firstWalk'], days: 5 }, unlock: '함께 산책 · 선물 · 사진 · 낚시' },
  { n: 4, name: '썸', need: { aff: 220, flags: ['firstSit'], together: 300, days: 10 }, unlock: '특별 대사 · 이름 부르기 · 팔짱 · 마음 전하기' },
  { n: 5, name: '연인', need: { aff: 400, flags: ['lovers'] }, unlock: '데이트 · 손잡기 · 볼 뽀뽀 · 안아주기 · 애칭 정하기' },
  { n: 6, name: '깊어진 연인', need: { aff: 600, flags: ['nickname'], loverDays: 20 }, unlock: '뽀뽀 · 업어주기 · 무릎베개 · 사택 초대' },
  { n: 7, name: '약혼', need: { flags: ['engaged'] }, unlock: '결혼 날짜 정하기 · 백허그 · 웨딩 준비' },
  { n: 8, name: '부부', need: { flags: ['married'] }, unlock: '함께 살기 · 아침 인사 · 퇴근 마중 · 신혼 이벤트' },
];
const FLAG_LABELS = { met: '첫 만남', firstWalk: '첫 산책 이벤트', firstSit: '나란히 앉기 이벤트', lovers: '고백 이벤트', nickname: '애칭 정하기 이벤트', engaged: '프로포즈 (만난 지 1년 이후)', married: '결혼식' };
const DAILY_AFF_CAP = 14;

const INTERACTIONS = [
  { id: 'greet', label: '인사하기', icon: '👋', stage: 1 },
  { id: 'talk', label: '대화하기', icon: '💬', stage: 1 },
  { id: 'follow', label: '함께 다니기', icon: '👣', stage: 1 },
  { id: 'favor', label: '작은 부탁', icon: '📝', stage: 2 },
  { id: 'sit', label: '함께 앉기', icon: '🪑', stage: 2, companion: true },
  { id: 'gift', label: '선물하기', icon: '🎁', stage: 3 },
  { id: 'photo', label: '사진 찍기', icon: '📷', stage: 3 },
  { id: 'fish', label: '같이 낚시', icon: '🎣', stage: 3, companion: true },
  { id: 'arm', label: '팔짱 끼기', icon: '💞', stage: 4, companion: true },
  { id: 'confess', label: '마음 전하기', icon: '💌', stage: 4, maxStage: 4 },
  { id: 'hand', label: '손잡기', icon: '🤝', stage: 5, companion: true },
  { id: 'cheek', label: '볼 뽀뽀', icon: '😚', stage: 5 },
  { id: 'hug', label: '안아주기', icon: '🫂', stage: 5 },
  { id: 'pat', label: '머리 쓰다듬기', icon: '✋', stage: 5 },
  { id: 'lean', label: '어깨 기대기', icon: '😌', stage: 5, sitting: true },
  { id: 'date', label: '데이트 신청', icon: '💗', stage: 5 },
  { id: 'cook', label: '같이 요리하기', icon: '🍳', stage: 5, companion: true, home: true },
  { id: 'kiss', label: '뽀뽀하기', icon: '💋', stage: 6 },
  { id: 'piggy', label: '업어 달라기', icon: '🎒', stage: 6, companion: true },
  { id: 'lap', label: '무릎베개', icon: '💤', stage: 6, sitting: true },
  { id: 'invite', label: '사택 놀러 가기', icon: '🏠', stage: 6 },
  { id: 'propose', label: '프로포즈 하기', icon: '💍', stage: 6, maxStage: 6 },
  { id: 'backhug', label: '백허그', icon: '💑', stage: 7 },
  { id: 'wedding', label: '결혼 날짜', icon: '💒', stage: 7, maxStage: 7 },
];

/* ---------------- 아이템 ---------------- */
const ITEMS = {
  coffee: { name: '따뜻한 캔커피', icon: '☕', price: 1500, gift: 5, sell: 500, react: ['아, 이거 제 최애인 거 어떻게 알았어요?', 'tease'] },
  tangerine: { name: '해월도 귤', icon: '🍊', price: 1000, gift: 2, sell: 400, react: ['귤은 언제 먹어도 좋죠. 하나 까 드릴까요?', 'smile'] },
  lunchbox: { name: '수제 도시락', icon: '🍱', price: 4000, gift: 5, sell: 1500, react: ['…저 점심 자주 거르는 거 들켰네요. 고마워요, 진짜로.', 'blush'] },
  hanky: { name: '손수건', icon: '🧣', price: 5000, gift: 4, sell: 2000, react: ['순찰하다 땀 닦을 때 쓸게요. 아까워서 못 쓰려나.', 'smile'] },
  flower: { name: '수국 꽃다발', icon: '💐', price: 8000, gift: 7, minStage: 4, sell: 3000, react: ['꽃은… 제가 드려야 하는 거 아니에요? 반칙이에요, 이거.', 'blush'] },
  snack: { name: '동물 간식', icon: '🦴', price: 800, gift: 0, sell: 300, react: ['이건… 노랑이 주려고 산 거 아니에요?', 'laugh'] },
  hotpack: { name: '핫팩', icon: '🔥', price: 1200, gift: 4, sell: 400, react: ['야간 순찰 필수품이죠. 손 따뜻해지겠다.', 'smile'] },
  watermelon: { name: '수박 한 조각', icon: '🍉', price: 2000, gift: 3, sell: 800, react: ['여름엔 역시 수박. 씨는 누가 멀리 뱉나 시합할래요?', 'laugh'] },
  songpyeon: { name: '송편', icon: '🥟', price: 0, gift: 5, sell: 1000, react: ['직접 빚은 거예요? 예쁘게 빚으면 예쁜 짝 만난다던데. …아, 이미 만났나.', 'tease'] },
  chocolate: { name: '수제 초콜릿', icon: '🍫', price: 6000, gift: 8, minStage: 3, sell: 2000, react: ['…초콜릿 데이에 이거 주면, 의미 있는 거 맞죠?', 'blush'] },
  candy: { name: '사탕 바구니', icon: '🍬', price: 6000, gift: 6, sell: 2000, react: ['원래 사탕은 제가 주는 날인데. 우리 둘 다 챙겼네요.', 'smile'] },
  porridge: { name: '전복죽', icon: '🥣', price: 6000, gift: 6, sell: 2500, react: ['따뜻하다… 아플 때 이거 먹으면 다 나을 것 같아요.', 'smile'] },
  ring: { name: '은반지', icon: '💍', price: 300000, gift: 0, sell: 150000, react: ['', 'blush'] },
  abalone: { name: '싱싱한 전복', icon: '🐚', price: 0, gift: 6, sell: 5000, react: ['직접 딴 거예요? 와… 오늘 저녁은 전복죽이다.', 'laugh'] },
  clam: { name: '바지락', icon: '🦪', price: 0, gift: 1, sell: 800, react: ['된장찌개 끓이면 딱이겠다.', 'smile'] },
  conch: { name: '소라', icon: '🐚', price: 0, gift: 2, sell: 1500, react: ['소라 굽는 냄새 상상하니까 배고프다.', 'smile'] },
  bomal: { name: '보말', icon: '🐌', price: 0, gift: 2, sell: 1200, react: ['보말 칼국수 각이다. 할머니한테 배워 볼까요?', 'smile'] },
  urchin: { name: '성게', icon: '🦔', price: 0, gift: 3, sell: 3000, react: ['성게 미역국…! 어떻게 알았어요, 제 생일 메뉴.', 'surprise'] },
  shell: { name: '예쁜 조개껍데기', icon: '🐚', price: 0, gift: 3, sell: 600, furn: 'shellDeco', react: ['예쁘다. 책상 위에 둘게요. 볼 때마다 생각나게.', 'blush'] },
  pebble: { name: '동글 조약돌', icon: '🪨', price: 0, gift: 1, sell: 200, furn: 'pebble', react: ['…이거 진짜 동글하다. 주머니에 넣고 다닐게요.', 'smile'] },
  pearl: { name: '작은 진주', icon: '⚪', price: 0, gift: 10, sell: 30000, react: ['진주요? 이건… 제가 받으면 안 될 것 같은데. 소중히 할게요.', 'surprise'] },
  seaweed: { name: '미역', icon: '🌿', price: 0, gift: 1, sell: 500, react: ['미역국 끓여 먹을게요.', 'normal'] },
  boot: { name: '낡은 장화', icon: '🥾', price: 0, gift: 0, sell: 0, react: ['…이건 선물이 아니라 증거품 같은데요?', 'laugh'] },
};
const FISH = {
  jack: { name: '전갱이', min: 14, max: 30, sell: 1500 }, mackerel: { name: '고등어', min: 20, max: 40, sell: 2500 },
  halfbeak: { name: '학꽁치', min: 18, max: 35, sell: 2000 }, rockfish: { name: '볼락', min: 12, max: 25, sell: 3000 },
  squid: { name: '한치', min: 15, max: 30, sell: 3500 }, opaleye: { name: '벵에돔', min: 20, max: 45, sell: 6000 },
  blackbream: { name: '감성돔', min: 25, max: 55, sell: 9000 }, knifejaw: { name: '돌돔', min: 25, max: 50, sell: 15000, rare: true },
  filefish: { name: '쥐치', min: 15, max: 28, sell: 2500 }, rockcod: { name: '우럭', min: 18, max: 40, sell: 4000 },
  redbream: { name: '참돔', min: 30, max: 70, sell: 20000, rare: true }, amberjack: { name: '방어', min: 50, max: 90, sell: 25000 },
  hairtail: { name: '갈치', min: 50, max: 100, sell: 12000 }, cuttle: { name: '무늬오징어', min: 20, max: 40, sell: 8000 },
  octopus: { name: '문어', min: 30, max: 60, sell: 10000 },
};
for (const [k, f] of Object.entries(FISH)) ITEMS['f_' + k] = { name: f.name, icon: f.rare ? '🐠' : k === 'squid' || k === 'cuttle' ? '🦑' : k === 'octopus' ? '🐙' : '🐟', price: 0, gift: f.rare ? 5 : 1, sell: f.sell, react: [f.rare ? `${f.name}요? 이건 진짜 대물인데. 낚시꾼으로서 존경합니다.` : '낚시꾼한테 생선 선물이라니, 하하. 도발이죠?', f.rare ? 'surprise' : 'tease'] };
const FISH_SPOTS = {
  pier: { name: '부두', table: { all: ['jack', 'jack', 'filefish'], summer: ['mackerel', 'squid'], autumn: ['mackerel', 'halfbeak'], winter: ['rockfish', 'rockfish'], spring: ['halfbeak', 'rockfish'] } },
  rocks: { name: '갯바위', table: { all: ['rockcod', 'filefish', 'opaleye'], summer: ['opaleye', 'knifejaw'], autumn: ['blackbream', 'opaleye'], winter: ['blackbream', 'rockfish'], spring: ['rockcod', 'opaleye'] } },
  islet: { name: '무인도', table: { all: ['redbream', 'rockcod', 'jack'], summer: ['octopus', 'knifejaw'], autumn: ['hairtail', 'cuttle'], winter: ['amberjack', 'amberjack'], spring: ['redbream', 'cuttle'] } },
};
const SHELL_TABLE = { beach: ['clam', 'clam', 'clam', 'conch', 'bomal', 'bomal', 'shell', 'pebble', 'seaweed'], islet: ['conch', 'bomal', 'urchin', 'shell', 'shell', 'pebble', 'clam', 'pearl'] };
const SHOP = ['coffee', 'tangerine', 'lunchbox', 'hanky', 'flower', 'snack', 'hotpack', 'watermelon', 'chocolate', 'candy', 'porridge', 'ring'];
const SHOP_SEASON = { watermelon: 'summer', hotpack: 'winter' };
const FURN_SHOP = ['bed', 'sofa', 'table', 'chair', 'desk', 'shelf', 'plant', 'rug', 'lamp', 'tv', 'kitchen', 'fridge', 'tank', 'dining', 'cushion', 'photo', 'piano', 'bunting', 'crate', 'rack', 'mirror', 'mannequin'];
const LIKES = ['coffee', 'lunchbox', 'abalone', 'porridge', 'chocolate'];
const FAVORS = [
  { item: 'coffee', ask: '오늘 서류가 산더미라… 혹시 슈퍼 갈 일 있으면 캔커피 하나만 부탁해도 돼요? 돈은 이따 드릴게요.', thanks: '살았다. 이걸로 오후 버틸 수 있겠어요. 이 은혜는 꼭 갚을게요.' },
  { item: 'tangerine', ask: '순찰 돌다 꼬마 하늘이한테 귤 주기로 약속했는데, 깜빡했어요. 귤 하나만 구해 줄래요?', thanks: '덕분에 약속 지켰어요. 하늘이가 이거 누가 준 거냐고 물으면… 우리 둘이 준 거라고 할게요.' },
  { item: 'lunchbox', ask: '점심시간을 또 놓쳤네… 아, 아니에요. 그냥 혼잣말. …진짜 도시락 사다 주면 감동할 것 같긴 해요.', thanks: '혼잣말 들은 거예요? 고마워요. 이건 진짜 잘 먹을게요.' },
];

const TALKS = {
  1: [
    { t: [['normal', '해월도는 처음엔 다 비슷해 보여도, 골목마다 냄새가 달라요.'], ['tease', '아침엔 바다, 낮엔 귤, 저녁엔… 누가 고등어 굽는 냄새.']],
      c: [['냄새로 길을 찾아요?', 3, '형사니까요. 코가 좀 좋습니다. …농담이에요, 반쯤은.', 'laugh'], ['지도가 있으면 좋겠어요', 1, '지도요? 저 부르면 되는데. 걸어 다니는 지도.', 'tease'], ['그렇군요', 0, '…반응이 담백하네. 좋아요, 다음엔 더 재밌는 얘기 준비해 올게요.', 'smile']] },
    { t: [['normal', '우리 파출소 사건 1위가 뭔지 알아요?'], ['serious', '도둑맞은 귤. 범인은 대부분 까마귀고요.']],
      c: [['까마귀를 체포해요?', 3, '시도는 해 봤죠. 묵비권을 행사하더라고요.', 'laugh'], ['평화로워서 좋네요', 2, '그게 제일 좋은 거예요. 제가 할 일 없는 섬.', 'smile'], ['심심하겠어요', 0, '심심할 틈이 없어요. 요즘은 새로 온 분 챙기느라.', 'tease']] },
    { job: true },
    { t: [['normal', '바다 색 보셨어요? 날씨마다 달라요.'], ['smile', '맑은 날은 유리 같고, 흐린 날은 회색 고양이 같고.']],
      c: [['고양이요?', 3, '보다 보면 진짜 고양이처럼 웅크린 날이 있어요. 언제 같이 봐요.', 'smile'], ['시인 같아요', 2, '형사가 시인이면 곤란한데. 조서에 시를 쓸 순 없잖아요.', 'laugh'], ['바다는 다 파랗죠', 0, '…다음에 부두에서 같이 보고 다시 얘기해요. 증명해 드릴게.', 'tease']] },
  ],
  2: [
    { t: [['normal', '퇴근하면 부두에서 낚시해요.'], ['smile', '잡는 것보다 기다리는 게 좋아서. 머리가 조용해지거든요.']],
      c: [['저도 해 보고 싶어요', 3, '진짜요? 그럼 제 옆자리 비워 둘게요. 미끼는 제가 끼워 줄게.', 'smile'], ['안 잡히면 지루하잖아요', 1, '그러니까 같이 할 사람이 있으면 좋죠. 수다라도 떨게.', 'tease'], ['생선은 싫어요', 0, '아… 그럼 잡아서 바로 놓아 주는 걸로. 평화주의 낚시.', 'normal']] },
    { t: [['normal', '저 사실 육지 사람이에요. 발령받고 왔다가… 눌러앉았죠.'], ['smile', '여기 사람들이 너무 챙겨 줘서. 반찬이 끊이질 않아요.']],
      c: [['저도 그 마음 알 것 같아요', 3, '그쵸? 해월도는 한번 정 들면 못 떠나요. 조심해요, 당신도.', 'tease'], ['육지가 그립진 않아요?', 2, '가끔요. 근데 요즘은… 여기가 더 재밌어서.', 'smile'], ['반찬 부럽네요', 1, '나눠 드려요? 순덕 할머니 깍두기는 진짜 국보급이에요.', 'laugh']] },
    { t: [['tease', '커피 취향 맞혀 볼까요? 음…'], ['normal', '단 거 좋아하는 얼굴인데. 맞죠?']],
      c: [['어떻게 알았어요?', 3, '형사의 감이죠. …사실 아까 귤 라떼 들고 있는 거 봤어요.', 'laugh'], ['아니요, 쓴 거요', 2, '오, 반전. 기억해 둘게요. 수첩에 적어도 되죠?', 'surprise'], ['형사님은요?', 2, '저는 캔커피요. 따뜻한 걸로. 선물 받으면 더 맛있고. …힌트예요.', 'tease']] },
    { t: [['normal', '오늘 하루 어땠어요?'], ['smile', '아, 형식적으로 묻는 거 아니에요. 진짜 궁금해서.']],
      c: [['좋았어요, 형사님 만나서', 4, '…갑자기 그렇게 훅 들어오면 제가 할 말이 없잖아요.', 'blush'], ['조금 피곤했어요', 2, '그럼 오늘은 일찍 들어가요. 집 앞까지는 제가 순찰 돌 테니까.', 'smile'], ['평범했어요', 1, '평범한 하루가 제일 어려운 거예요. 수고했어요.', 'normal']] },
  ],
  3: [
    { t: [['normal', '요즘 순찰 코스가 이상하게 그쪽 앞을 자주 지나가요.'], ['tease', '우연이에요. 진짜로. 형사가 거짓말하겠어요?']],
      c: [['우연이 너무 잦은데요?', 4, '들켰다. …그럼 이제 대놓고 지나갈게요.', 'laugh'], ['그럼 다음엔 들어와요', 3, '초대받은 걸로 알게요. 취소 안 돼요.', 'smile'], ['순찰 열심히 하네요', 1, '네, 아주 성실한 형사예요. 특정 구역만.', 'tease']] },
    { t: [['normal', '여기 밤하늘 봤어요? 육지랑 비교가 안 돼요.'], ['smile', '전망대 올라가면 별이 쏟아져요. 진짜 쏟아져.']],
      c: [['같이 보러 가요', 4, '…지금 데이트 신청한 거예요? 아니면 제가 착각한 거?', 'blush'], ['별자리 알아요?', 2, '국자 모양 하나는 확실히 알아요. 나머지는 제가 지어낼게요.', 'laugh'], ['추울 것 같아요', 1, '그럼 제 겉옷 하나 더 챙길게요. 핑계는 다 막았죠?', 'tease']] },
    { t: [['serious', '혹시 섬에서 불편한 거 있으면 말해요.'], ['normal', '형사로서 하는 말 반, 그냥 제가 신경 쓰여서 하는 말 반.']],
      c: [['나머지 반이 더 좋아요', 4, '…그 반을 좀 더 늘려 볼까 고민 중이에요.', 'blush'], ['덕분에 괜찮아요', 3, '다행이다. 그 말 들으려고 물어본 거예요.', 'smile'], ['형사님이나 잘 챙겨요', 2, '하하, 혼났다. 네, 밥 잘 먹을게요.', 'laugh']] },
    { t: [['tease', '마을 사람들이 요즘 저한테 자꾸 물어봐요.'], ['normal', '"그 사람이랑 무슨 사이야?" 라고.']],
      c: [['뭐라고 했어요?', 4, '"아직은 비밀"이라고요. 아직은.', 'tease'], ['친구라고 하면 되죠', 1, '친구. 음… 그렇죠. 친구. (조금 아쉬운 표정이다)', 'sad'], ['소문은 무섭네요', 2, '해월도 소문은 배보다 빨라요. 각오해요.', 'laugh']] },
  ],
  4: [
    { t: [['normal', '솔직히 말하면…'], ['blush', '퇴근 시간을 기다리는 이유가 하나 늘었어요.']],
      c: [['그 이유가 뭔데요?', 5, '지금 제 앞에 있는데요. 더 말하면 제가 너무 쑥스러워서 안 돼요.', 'blush'], ['저도 그래요', 5, '…그 말, 녹음해 둘 걸 그랬다.', 'smile'], ['낚시 때문이죠?', 1, '아… 네, 낚시. 물고기. 그렇죠. (웃음을 참는다)', 'tease']] },
    { t: [['serious', '제가 형사가 된 이유요?'], ['normal', '누군가 무사히 집에 들어가는 걸 보는 게 좋아서요. 그게 다예요.'], ['smile', '요즘은 그 누군가가 좀… 특정해졌지만.']],
      c: [['멋진 이유예요', 4, '처음 들어요, 그런 말. 오늘 밤 잠 다 잤다.', 'blush'], ['특정한 누구요?', 5, '수사 기밀입니다. …라고 하기엔 너무 티 나죠, 저.', 'tease'], ['힘들진 않아요?', 3, '가끔요. 근데 이렇게 얘기하면 다 풀려요. 신기하게.', 'smile']] },
    { t: [['normal', '다른 사람이랑도 이렇게 걸어요?'], ['tease', '…그냥 궁금해서요. 수사 아니고.']],
      c: [['형사님이랑만요', 5, '…좋네요. 그 대답. 아주 좋아요.', 'blush'], ['질투해요?', 4, '네. 아, 너무 빨리 대답했나.', 'laugh'], ['비밀이에요', 2, '해월도에서 비밀이 오래 가나 볼게요.', 'tease']] },
  ],
  5: [
    { t: [['smile', '오늘도 예쁘다고 하면, 매일 하는 말이라 감동 없죠?'], ['tease', '그래도 할래요. 오늘도 예뻐요.']],
      c: [['매일 들어도 좋아요', 4, '그럼 평생 매일 할게요. 약속.', 'smile'], ['형사님도 멋져요', 4, '…이런 반격은 예상 못 했는데.', 'blush'], ['식상해요', 1, '그럼 내일은 시로 할게요. 조서 말고.', 'laugh']] },
    { t: [['normal', '나중에… 해월도에 계속 있을 거예요?'], ['serious', '아니, 부담 주려는 건 아니고. 그냥 제 계획에 넣어도 되는지 궁금해서.']],
      c: [['넣어 주세요', 5, '그럼 제 계획 전부 다시 짜야겠다. 기분 좋은 수정이네.', 'smile'], ['형사님이 있으면요', 5, '그럼 저 평생 여기 있을게요. 발령 나도 버틸 거예요.', 'blush'], ['아직 모르겠어요', 2, '괜찮아요. 천천히. 저는 어디 안 가요.', 'normal']] },
    { t: [['tease', '파출소에 민원이 들어왔어요.'], ['serious', '"형사님이 요즘 너무 실실 웃고 다녀서 무섭다"고.']],
      c: [['제 탓이네요', 4, '네, 전부 당신 탓이에요. 책임져요.', 'laugh'], ['더 웃어요', 3, '그럼 민원이 두 배가 될 텐데. 괜찮아요, 감수할게요.', 'smile'], ['조심하세요', 1, '노력은 해 볼게요. 당신 보면 안 되겠지만.', 'tease']] },
  ],
};

const JOB_TALK = {
  doctor: { t: [['tease', '보건지소에 선생님 오시고 할머니들이 줄을 서요.'], ['normal', '저도 아프면 가도 돼요?']],
    c: [['꾀병은 안 돼요', 3, '들켰네. 그럼 진짜로 다쳐서 갈게요. …농담이에요, 화내지 마요.', 'laugh'], ['언제든 오세요', 2, '그 말 믿고 갑니다. 첫 진료는 마음 상태 검사로.', 'tease'], ['파스 드릴까요?', 1, '하하, 순찰 많이 도는 거 티 나요?', 'smile']] },
  teacher: { t: [['normal', '등굣길 순찰 돌 때 아이들이 선생님 얘기만 해요.'], ['tease', '"우리 선생님이 세상에서 제일 예뻐요" 라던데. 저도 동의했고.']],
    c: [['아이들이 그래요?', 3, '네. 그리고 저도 그렇다고 했다니까요. 그건 안 들렸어요?', 'tease'], ['형사님 인기도 많던데요', 2, '저는 "경찰 아저씨"예요. 선생님은 "우리 선생님"이고. 급이 달라요.', 'laugh'], ['수업 준비해야 해요', 0, '아, 바쁘시구나. 다음 쉬는 시간에 다시 올게요.', 'normal']] },
  traveler: { t: [['normal', '여행 일정은 얼마나 돼요?'], ['smile', '아, 그냥… 안내할 데가 많아서요. 일정 짜 드리려고.']],
    c: [['정해진 건 없어요', 3, '잘됐다. 그럼 해월도 투어 코스, 제가 끝까지 책임질게요.', 'smile'], ['오래 있을 거예요', 3, '그 말 기억해 둘게요. 증거로.', 'tease'], ['곧 떠나요', 0, '…그래요? 그럼 더 열심히 안내해야겠네.', 'sad']] },
  cafe: { t: [['tease', '사장님 카페 아메리카노가 섬에서 제일 맛있어요.'], ['normal', '섬에 카페가 하나뿐인 건 비밀로 할게요.']],
    c: [['단골 할인 해 드릴게요', 3, '오, 그럼 매일 와야겠다. 원래도 매일 왔지만.', 'laugh'], ['다른 데 없잖아요', 1, '그래도 제일이에요. 비교 대상이 없어도.', 'tease'], ['오늘도 아메리카노?', 2, '네, 늘 마시던 걸로. 이 말 해 보고 싶었어요.', 'smile']] },
  haenyeo: { t: [['serious', '오늘 바다 괜찮았어요? 물살 세던데.'], ['normal', '부두 순찰하면서 계속 그쪽만 봤어요. 안전 확인차.']],
    c: [['걱정했어요?', 3, '…해녀분들 안전 확인이 제 업무라서요. 특히 한 분.', 'blush'], ['저 베테랑이에요', 2, '알죠. 그래도 제가 보는 건 제 마음이니까.', 'smile'], ['괜찮았어요', 1, '다행이다. 다음 물질 때도 망보고 있을게요.', 'normal']] },
};

const SMALLTALK = {
  1: ['오늘 날씨 좋네요. 순찰하기 딱이에요.', '모르는 거 있으면 저한테 물어봐요. 웬만한 건 알아요.', '해월도 생활은 할 만해요?'],
  2: ['또 만났네요. 이 섬 좁은 거 알죠? 계속 만날 거예요.', '아까 슈퍼 앞에서 봤는데 바빠 보여서 못 불렀어요.', '오늘은 부두 쪽 바람이 좋아요.'],
  3: ['오늘 하루도 당신 덕에 재밌네요.', '어, 머리에 꽃잎 붙었다. …가만있어 봐요. 됐다.', '이따 퇴근하면 뭐 해요? 그냥, 물어보는 거예요.'],
  4: ['…아, 미안해요. 쳐다보고 있었어요. 들켰네.', '오늘 유난히 시간이 빨리 가요. 당신이랑 있어서 그런가.', '내일도 만날 수 있죠?'],
  5: ['보고 싶었어요. 아침에 봤는데도.', '오늘 저녁엔 뭐 먹을까요? 둘이.', '우리 둘이 걷는 거, 마을 사람들이 다 알아요. 저는 좋아요.'],
};

const GREETS = {
  morning: { 1: ['좋은 아침이에요. 잠은 잘 잤어요?'], 2: ['좋은 아침! 오늘도 부지런하네요.'], 3: ['아침부터 보니까 좋네요.'], 4: ['아… 좋은 아침. 오늘 왜 이렇게 반갑지.'], 5: ['굿모닝. 오늘 첫 인사는 제가 차지했네요.'] },
  day: { 1: ['안녕하세요. 순찰 중이에요.'], 2: ['어, 안녕하세요! 점심은 먹었어요?'], 3: ['또 만났다. 반가워요.'], 4: ['…방금 당신 생각하고 있었는데.'], 5: ['왔어요? 보고 싶었어요.'] },
  evening: { 1: ['저녁이네요. 늦게 다니면 위험해요.'], 2: ['퇴근했어요? 수고했어요.'], 3: ['퇴근하니까 딱 보이네요. 타이밍 좋다.'], 4: ['저녁 노을이랑 당신이랑 같이 보니까 좋네요.'], 5: ['오늘 하루 어땠어요? 다 얘기해 줘요.'] },
};

const IDLE = {
  1: ['저기 보이는 게 등대예요.', '천천히 걸어요. 저 안 바빠요.', '길은 제가 다 알아요.'],
  2: ['같이 걸으니까 순찰도 금방이네요.', '아, 저 고양이 또 왔다. 동네 대장이에요.', '배고프지 않아요?'],
  3: ['이렇게 걷는 거 좋네요.', '오늘 바람 좋다. 그쵸?', '…조금 더 천천히 걸을까요?'],
  4: ['아까부터 계속 웃음이 나요. 왜지.', '손이 시렵지 않아요? …아니, 그냥 물어본 거예요.', '집에 가기 싫다.'],
  5: ['이대로 섬 한 바퀴 더 돌까요?', '당신 옆이 제일 편해요.', '오늘 저녁 노을 같이 봐요.'],
};

/* ---------------- 단계 6~8 대화 ---------------- */
Object.assign(TALKS, {
  6: [
    { t: [['smile', '요즘 퇴근길에 자꾸 당신 집 쪽으로 걸어가요.'], ['tease', '발이 길을 외워 버렸어요. 형사 발이라 기억력이 좋아서.']],
      c: [['그럼 매일 와요', 4, '그 말 진짜죠? 내일부터 출석 체크합니다.', 'laugh'], ['저도 사택 쪽으로 가요', 4, '그럼 중간에서 만나요. 광장 돌하르방 앞.', 'smile'], ['길 잃으면 어떡해요', 2, '당신 있는 데가 제 집이에요. 안 잃어요.', 'blush']] },
    { t: [['normal', '어릴 때 꿈이 뭐였어요?'], ['smile', '저는 등대지기요. 밤새 누굴 지켜 주는 게 멋있어 보여서.']],
      c: [['지금도 지키고 있잖아요', 5, '…그러네. 꿈 이뤘네요, 저. 당신 덕분에 알았어요.', 'blush'], ['제 꿈은 비밀이에요', 3, '수사 들어갑니다. 꼭 알아낼 거예요.', 'tease'], ['등대 같이 가요', 3, '좋아요. 이번엔 불 켜지는 순간까지 있어요.', 'smile']] },
    { t: [['serious', '혹시 제가 서운하게 한 거 있으면 바로 말해 줘요.'], ['normal', '참다가 말하는 것보다, 바로 말해 주는 게 저는 좋아요.']],
      c: [['지금은 다 좋아요', 4, '다행이다. 그 말이 제일 듣기 좋아요.', 'smile'], ['연락 좀 자주 해요', 3, '무전기 말고 휴대폰으로요. 알겠습니다, 매시간.', 'laugh'], ['형사님도 그래요', 3, '네. 우리 둘 다 약속.', 'smile']] },
  ],
  7: [
    { t: [['smile', '결혼식에 누구 부를까요? 저는… 섬 사람 전부.'], ['laugh', '고양이들도요. 노랑이 빼면 서운해할 거예요.']],
      c: [['노랑이는 화동이에요', 5, '하하, 좋다. 꽃잎 뿌리다가 다 먹을 것 같지만.', 'laugh'], ['작게 하고 싶어요', 3, '그럼 바닷가에서 우리 둘이랑 할머니들만. 그것도 좋아요.', 'smile'], ['다 맡길게요', 2, '책임감이 막 생기네요. 실수 없이 할게요.', 'serious']] },
    { t: [['blush', '반지 끼고 있는 손 보면, 아직도 실감이 안 나요.'], ['tease', '꿈이면 깨우지 마요. 진짜로.']],
      c: [['꿈 아니에요 (꼬집는다)', 5, '아야. …진짜네. 진짜다.', 'laugh'], ['저도 실감 안 나요', 4, '그럼 우리 매일 확인해요. 손 잡으면서.', 'smile']] },
  ],
  8: [
    { t: [['smile', '여보, 오늘 저녁 뭐 먹을래요?'], ['tease', '"아무거나"는 금지예요. 형사도 그건 못 풀어요.']],
      c: [['전복죽!', 4, '좋아요. 오늘은 제가 끓일게요. 할머니 레시피로.', 'smile'], ['여보가 해 준 라면', 4, '계란 두 개, 파 송송. 알죠?', 'laugh'], ['같이 만들어요', 5, '그게 제일 맛있죠. 장 보러 가요.', 'smile']] },
    { t: [['normal', '아침에 눈 떴을 때 옆에 있으면… 하루가 다 괜찮아요.'], ['blush', '이 말 매일 해도 되죠?']],
      c: [['매일 해 줘요', 5, '평생 할게요. 지겹다고 해도.', 'blush'], ['저도 그래요', 5, '…그럼 우리 둘 다 매일 행복한 거네요.', 'smile']] },
    { t: [['tease', '마을 사람들이 우리 보고 "깨 볶는 집"이래요.'], ['laugh', '오늘 할머니가 참기름 주시면서 그러시더라고요.']],
      c: [['맞는 말이네요', 4, '그쵸. 반박 불가.', 'laugh'], ['조금만 참아요', 2, '노력은 해 볼게요. 근데 자신은 없어요.', 'tease']] },
  ],
});
Object.assign(SMALLTALK, {
  6: ['오늘 하루 중에 제일 좋은 시간이 지금이에요.', '손, 이리 줘요. 그냥 잡고 싶어서.', '사택 화분에 물 줬어요. 당신이 준 거.'],
  7: ['결혼 준비 체크리스트, 저 벌써 반 했어요.', '이장님이 주례 서 주신대요. 벌써 연습 중이시래요.', '반지 안 빠지게 꼭 끼고 다녀요. 저도 그럴게요.'],
  8: ['여보, 오늘도 무사히 퇴근했어요.', '집에 오는 길이 제일 좋아요. 당신이 있어서.', '우리 집 냄새 좋다. 당신 냄새.'],
});
Object.assign(IDLE, {
  6: ['이대로 시간이 멈췄으면.', '당신 걸음 소리만 들어도 알아요.', '이따 우리 뭐 할까요?'],
  7: ['웨딩 사진은 등대 앞에서 찍어요.', '신혼집 가구는 당신 취향대로.', '…좋다. 그냥, 다 좋다.'],
  8: ['여보, 천천히 가요.', '오늘 저녁 메뉴 정했어요?', '우리 집 가는 길 좋다.'],
});
for (const t of ['morning', 'day', 'evening']) GREETS[t][6] = GREETS[t][5];
GREETS.morning[7] = ['좋은 아침, 예비 신부님… 아니, 예비 짝꿍님.']; GREETS.day[7] = ['보고 싶어서 순찰 핑계 대고 왔어요.']; GREETS.evening[7] = ['오늘 하루도 고생했어요. 이리 와요.'];
GREETS.morning[8] = ['잘 잤어요, 여보?']; GREETS.day[8] = ['여보! 점심은 먹었어요?']; GREETS.evening[8] = ['다녀왔어요, 여보.'];

/* 계절 · 날씨 혼잣말 */
const SEASON_IDLE = {
  summer: ['덥다… 아이스 귤 라떼 땡긴다.', '매미 소리 들리죠? 여름이다.', '바닷물 시원해 보여요.', '선크림 발랐어요? 해월도 햇빛 세요.'],
  autumn: ['억새가 바람에 눕는 거 봐요. 예쁘다.', '하늘이 높아졌어요.', '귤이 노래지기 시작했네.', '가을 바람 냄새 좋다.'],
  winter: ['춥죠? 제 주머니에 손 넣어요.', '입김 나온다. 후~', '귤 까먹기 딱 좋은 날씨.', '눈 오면 같이 눈사람 만들어요.'],
  spring: ['유채꽃 향기 나요.', '벚꽃 잎 날린다. 잡으면 소원 이뤄진대요.', '봄이라 그런가, 괜히 설레요.', '해녀 할머니들 물질 시작하셨대요.'],
};
const WEATHER_IDLE = { rain: ['비 오는 날 파도 소리 좋죠.', '우산 제가 들게요.'], snow: ['눈 온다! 첫눈이에요?', '발자국 남기면서 걸어요.'], cloudy: ['흐린 날은 바다가 회색 고양이 같다니까요.'] };
const PLACE_IDLE = {
  pier: ['바다 냄새 좋다.', '저기 물고기 뛰었다! 봤어요?'], lighthouse: ['등대 불빛은 길 잃은 배를 위한 거래요. 낭만 있죠.'],
  cafe: ['귤 라떼 냄새 나요. 한 잔 할래요?'], beach: ['모래에 발자국 두 개. 좋네요.'], coast: ['파도 소리 들려요?'],
  observatory: ['섬이 한눈에 보이죠? 저기가 파출소, 저기가… 당신 집.'], orchard: ['귤 하나 몰래… 아니, 안 돼요. 형사잖아요.'],
  rocks: ['갯바위는 미끄러워요. 제 팔 잡아요.'], forest: ['숲 냄새 좋다. 피톤치드 충전.'], pavilion: ['정자에서 낮잠 자면 최고예요.'],
  sashimi: ['이모님 물회 진짜 맛있어요.'], hall: ['마을회관 노래방, 저 18번 있어요.'], isletBeach: ['여긴 우리 둘만 아는 섬 같아요.'], isletHill: ['무인도에서 보는 해월도, 작고 귀엽다.'],
};

/* 마을 안내 */
const GUIDE = {
  pier: '여기가 해월도 부두예요. 무인도 가는 배도 여기서 타요. 저녁엔 제 전용 낚시터.',
  cafe: '카페 쉼터. 귤 라떼가 유명해요. 테라스 벤치는 오후에 해가 예쁘게 들어요.',
  police: '제 일터, 파출소. 길 잃으면 여기로 와요. 분실물도 여기 있어요.',
  plaza: '마을 광장이에요. 저 돌하르방 둘은 섬에서 제일 오래된 주민이고요.',
  super: '마을 슈퍼. 가구도 팔아요. 배 들어오는 날 가면 신상이 있어요.',
  sashimi: '해월 횟집. 이모님 물회 한 그릇이면 여름 끝.',
  hall: '마을회관. 잔치, 회의, 노래방… 섬의 모든 일이 여기서 시작돼요.',
  school: '해월초등학교. 전교생 열두 명. 다 제 단골 민원인이에요.',
  clinic: '보건지소. 섬 사람들 건강 지킴이.',
  home: '여기가 당신 집이죠? 기억해 둘게요. 순찰 경로에… 아, 원래 있었어요.',
  storage: '해녀창고. 해녀분들 장비랑 해산물이 다 여기 있어요.',
  lighthouse: '등대예요. 노을 질 때 오면… 이건 직접 봐야 해요.',
  observatory: '언덕 전망대. 섬 전체가 다 보여요. 밤엔 별이 쏟아지고요.',
  orchard: '귤밭이에요. 겨울이면 온 섬이 귤 냄새.',
  beach: '해수욕장! 여름엔 파라솔이 쫙 펴져요.',
  coast: '해안 산책로. 썰물 때 오면 조개도 주울 수 있어요.',
  rocks: '갯바위 낚시터. 큰 놈은 여기서 나와요. 대신 미끄러우니까 조심.',
  forest: '숲길이에요. 여름밤엔 반딧불이가 나와요.',
  pavilion: '숲속 정자. 쉬어 가기 좋아요.',
  sataek: '…여긴 제가 사는 경찰 사택이에요. 왜 여기로 왔어요? 하하.',
};

/* 벤치 대사 — 장소 × (1-2 / 3-4 / 5+) */
const SIT_TALK = {
  cafe: [[['smile', '여기 앉아 있으면 마을 사람들이 다 지나가요.']], [['tease', '이렇게 같이 앉아 있으면 내일 소문 나요.'], ['smile', '…저는 괜찮아요. 소문.']], [['smile', '우리 단골 자리 정할까요? 여기. 당신 왼쪽, 제 오른쪽.']]],
  pier: [[['normal', '배 들어오는 소리, 좋죠. 마음이 놓여요.']], [['smile', '둘이 앉으니까 바다가 더 넓어 보여요.']], [['tease', '파도가 백 번 치면 말해 줄 게 있어요.'], ['blush', '…못 참겠다. 지금 말할게요. 좋아해요.']]],
  lighthouse: [[['normal', '등대에서 보는 노을은 해월도 명물이에요.']], [['smile', '노을이 당신 얼굴에 비치니까… 아, 아무것도 아니에요.']], [['smile', '매일 노을 볼 때마다 오늘을 기억할 것 같아요.']]],
  observatory: [[['normal', '여기 올라오면 섬이 장난감처럼 보여요.']], [['tease', '저기 저 집이 당신 집이죠? 순찰 강화 구역.']], [['smile', '별 보러 또 와요. 다음엔 담요 챙길게요.']]],
  pavilion: [[['normal', '정자 바람이 제일 시원해요.']], [['smile', '여기서 같이 쉬니까, 숲 소리가 다르게 들려요.']], [['blush', '…어깨 빌려줄까요? 졸리면.']]],
  beach: [[['normal', '모래 위 벤치는 해월도에 이거 하나뿐이에요.']], [['smile', '파도가 발끝까지 오다 말다 하네요. 밀당하나.']], [['tease', '수영복… 아니, 아무 말도 안 했어요.']]],
  isletHill: [[['normal', '여긴 진짜 조용하네요.']], [['smile', '무인도에 둘이 있으니까, 세상에 우리만 있는 것 같아요.']], [['blush', '여기 우리 이름 붙일래요? 우리 섬.']]],
};

/* 데이트 장소 (16곳) */
const DATES = {
  pier: { name: '부두 산책', icon: '⚓', map: 'island', bench: 'pier', pos: 'harbor', lines: [['smile', '바다 보면서 아무 말 안 해도 괜찮은 사람, 처음이에요.'], ['tease', '…그래도 말은 할 거예요. 저 수다쟁이거든요.']], c: [['계속 얘기해 줘요', '그럼 오늘 밤새도록.'], ['조용히 있어요', '네. …손은 잡고 있어도 되죠?']] },
  cafe: { name: '카페 데이트', icon: '☕', map: 'island', bench: 'cafe', pos: 'cafeBench', lines: [['smile', '귤 라떼 두 잔. 하나는 덜 달게. 당신 취향 맞죠?'], ['tease', '이 정도면 제가 당신 전문가예요.']], c: [['맞아요, 감동이에요', '수사력이 이런 데 쓰이네요.'], ['제가 계산할게요', '안 돼요. 첫 잔은 제 거예요.']] },
  lighthouse: { name: '등대 노을', icon: '🌅', map: 'island', bench: 'lighthouse', pos: 'lighthouse', time: 18 * 60, lines: [['normal', '타이밍 맞췄다. 지금이에요.'], ['blush', '…노을보다 당신을 더 많이 본 건 비밀로 해 줘요.']], c: [['다 봤어요', '들켰다. 그럼 숨길 필요 없겠네.'], ['저도요', '…우리 둘 다 노을 하나도 안 봤네요.']] },
  beach: { name: '해변 산책', icon: '🐚', map: 'island', bench: 'beach', pos: 'beachBench', lines: [['smile', '손잡고 걸으니까 모래가 더 부드러운 것 같아요.'], ['tease', '과학적으론 말이 안 되는데, 느낌상 그래요.']], c: [['조금 더 걸어요', '네. 섬 끝까지 가도 돼요.'], ['신발 벗을래요', '그럼 저도 벗을게요. 근무 아니니까.']] },
  super: { name: '같이 장보기', icon: '🛒', map: 'in_super', pos: [3.5, 3.5], lines: [['tease', '오늘 저녁 뭐 해 먹을까요? 저 라면 잘 끓여요.'], ['smile', '장바구니 제가 들게요. 형사는 힘이 세요.']], c: [['같이 요리해요', '좋아요. 당신이 지휘, 저는 칼질.'], ['라면 좋아요', '계란 두 개 넣는 거 알죠? 기본.']] },
  fishing: { name: '낚시 대결', icon: '🎣', map: 'island', pos: 'pierEnd', fish: true, lines: [['tease', '지는 사람이 내일 커피 사기. 콜?'], ['laugh', '…왜 당신 찌만 계속 움직여요? 물고기도 당신 좋아하나 봐.']], c: [['제가 이겼네요', '인정. 내일 커피 두 잔 살게요.'], ['져 드릴게요', '봐주는 거 다 보여요. 그래도 고마워요.']] },
  home: { name: '집 데이트', icon: '🏡', map: 'in_home', pos: [3.5, 4.5], lines: [['smile', '초대해 줘서 고마워요. …생각보다 떨리네.'], ['tease', '집 예쁘게 꾸몄네요. 당신 닮았다.']], c: [['영화 볼래요?', '좋아요. 무서운 거 나오면 당신 뒤에 숨을 거예요.'], ['그냥 쉬어요', '네. 이렇게 조용한 거, 좋다.']] },
  observatory: { name: '전망대 별 구경', icon: '⭐', map: 'island', bench: 'observatory', pos: 'observatory', time: 20 * 60, lines: [['smile', '봐요, 쏟아진다고 했죠.'], ['blush', '저 별 이름, 오늘부터 당신 이름으로 할래요.']], c: [['저 별은 형사님', '나란히 있네요. 딱 좋다.'], ['유치해요', '유치해도 좋아요. 당신이랑이면.']] },
  islet: { name: '무인도 소풍', icon: '🏝️', map: 'islet', bench: 'islet', pos: [12.5, 7.5], lines: [['smile', '배 타고 둘이 오니까 진짜 모험 같다.'], ['tease', '조난당하면 제가 책임질게요. 평생.']], c: [['평생이요?', '네. 무인도 서약.'], ['도시락 싸 왔어요', '…역시. 당신이 최고예요.']] },
  sashimi: { name: '횟집 저녁', icon: '🍣', map: 'in_sashimi', pos: [3.5, 4.5], lines: [['laugh', '이모님이 서비스로 전복 주셨어요. "형사 양반 장가가는 거여?" 하시면서.'], ['blush', '…대답은 못 했어요. 아직은.']], c: [['아직은이요?', '네, 아직은. 기대해도 돼요.'], ['맛있다!', '그쵸. 여기 물회는 진짜 국보급.']] },
  karaoke: { name: '마을회관 노래방', icon: '🎤', map: 'in_hall', pos: [2.5, 3.5], lines: [['laugh', '제 18번 나갑니다. 〈바다가 보이는 언덕〉!'], ['blush', '…가사가 전부 당신 얘기 같아서 부르다 웃음 나왔어요.']], c: [['앵콜!', '앵콜은 듀엣으로 해요. 마이크 하나 더.'], ['노래 잘해요', '진짜요? 순찰하면서 연습한 보람 있다.']] },
  forest: { name: '숲길 정자', icon: '🌲', map: 'island', bench: 'pavilion', pos: 'pavilion', lines: [['normal', '숲은 소리가 다 작아요. 우리 목소리만 들리고.'], ['smile', '여기서 낮잠 자면 깨워 줄게요.']], c: [['같이 자요', '…그럼 누가 깨워요. 좋아요, 둘 다 자요.'], ['얘기 더 해요', '네. 숲 다람쥐들이 엿들어도 괜찮으면.']] },
  rocks: { name: '갯바위 일출', icon: '🌄', map: 'island', pos: 'rocks', lines: [['smile', '여기서 보는 파도가 섬에서 제일 세요. 그래서 좋아요.'], ['serious', '…미끄러우니까, 제 손 놓지 마요.']], c: [['안 놓을게요', '약속이에요.'], ['형사님이 더 위험해요', '하하, 맞아요. 그럼 서로 꽉 잡아요.']] },
  orchard: { name: '귤밭 데이트', icon: '🍊', map: 'island', pos: 'orchardGate', lines: [['tease', '귤 하나 까서 반 나눠 먹으면 연인이래요. 섬 전설.'], ['laugh', '…방금 제가 지어냈어요. 그래도 반 줘요.']], c: [['반 줄게요', '이제 공식 연인. 전설 성립.'], ['다 내 거예요', '그럼 제 거 반 줄게요. 결국 같이 먹네요.']] },
  hallSnack: { name: '회관 야식', icon: '🍜', map: 'in_hall', pos: [4.5, 5.5], lines: [['smile', '이장님이 남은 잔치 국수 주셨어요. 둘이 먹으래요.'], ['tease', '이장님도 우리 응원하나 봐요.']], c: [['국수 맛있다', '당신이랑 먹어서 그래요.'], ['이장님 고마워요', '내일 귤 한 박스 갖다 드려야겠다.']] },
  ranch: { name: '조랑말 목장 산책', icon: '🐴', map: 'island', pos: 'ranchIn', lines: [['laugh', '조랑이가 자꾸 당신만 따라가요. 질투 나네.'], ['smile', '말 타 볼래요? 제가 고삐 잡을게요.']], c: [['타 볼래요!', '천천히… 그렇지. 잘한다. 멋있다.'], ['쓰다듬기만 할래요', '조랑이 표정 봐요. 녹았어요.']] },
  windmill: { name: '풍차 언덕 바람', icon: '🌬️', map: 'island', pos: 'windmill', lines: [['smile', '여기 바람이 섬에서 제일 세요. 모자 꽉 잡아요.'], ['blush', '…머리 날리는 것도 예쁘네.']], c: [['바람 시원해요', '그쵸. 속이 다 뻥 뚫려요.'], ['손 잡아 줘요', '날아가지 않게. 꽉.']] },
  farm: { name: '귤 농장 평상', icon: '🧺', map: 'island', bench: 'farm', pos: 'farm', lines: [['smile', '농장 아주머니가 귤 한 바구니 주셨어요. 같이 까먹어요.'], ['tease', '평상에 앉아 있으니까 우리 진짜 섬 사람 같다.']], c: [['귤 까 줄게요', '하얀 거까지 다 떼 줬네. 감동이다.'], ['낮잠 자고 싶다', '그럼 제 어깨. 무료예요.']] },
  field: { name: '꽃밭 들판', icon: '🌼', map: 'island', pos: 'field', lines: [['smile', '꽃밭 한가운데 서 봐요. 사진 찍어 줄게요.'], ['blush', '…꽃보다 사람이 더 예쁘면 어떻게 찍어요.']], c: [['같이 찍어요', '하나, 둘, 셋. 평생 간직할게요.'], ['꽃 이름 알아요?', '…모르는데 지어낼 수는 있어요. 이건 「당신꽃」.']] },
  sataek: { name: '사택 놀러 가기', icon: '🏠', map: 'in_sataek', pos: [3.5, 3.5], minStage: 6, lines: [['blush', '어… 치운다고 치웠는데. 많이 지저분하죠?'], ['smile', '저 화분 보여요? 당신이 준 거. 매일 물 줘요.']], c: [['깔끔한데요?', '다행이다. 사실 어제 밤새 치웠어요.'], ['화분 잘 컸네요', '당신 생각하면서 키워서 그래요.']] },
};

/* ---------------- 마을 주민 ---------------- */
const NPC_LOOKS = {
  halmeoni: { name: '순덕 할머니', hair: 'bun', hairC: '#c9c6cf', hairH: '#e6e4ea', eyeC: '#4a3a30', closedEyes: true, fem: true, outfits: { base: { coat: '#9a6fb0', coatS: '#7a5590', shirt: '#9a6fb0', pants: '#5d5470', shoes: '#4a3a30', closed: true, collar: '#e7d7ef' } } },
  okja: { name: '옥자 할머니', hair: 'bun', hairC: '#b9b6bf', hairH: '#dcdae0', eyeC: '#4a3a30', fem: true, outfits: { base: { coat: '#4f8fa8', coatS: '#3f7a90', shirt: '#4f8fa8', pants: '#3b4a56', shoes: '#3b3b3b', closed: true, collar: '#dcebf2' } } },
  kid: { name: '꼬마 하늘이', kid: true, hair: 'twin', hairC: '#3a2a22', hairH: '#5a4234', eyeC: '#4a3020', fem: true, outfits: { base: { coat: '#f2c94c', coatS: '#d6a92c', shirt: '#f2c94c', pants: '#f7d4b5', skirt: '#e55b5b', shoes: '#e55b5b', closed: true, collar: '#fff2c4' } } },
  kid2: { name: '꼬마 도윤이', kid: true, hair: 'short', hairC: '#2a2220', hairH: '#4a3a30', eyeC: '#4a3020', outfits: { base: { coat: '#5fb3c8', coatS: '#468fa3', shirt: '#5fb3c8', pants: '#3b4a56', shoes: '#f2c94c', closed: true, collar: '#ffffff' } } },
  fisher: { name: '박 씨 아저씨', hair: 'cap', hairC: '#3b3b3b', hairH: '#555', capC: '#d9583f', eyeC: '#4a3020', outfits: { base: { coat: '#6f8a4f', coatS: '#57703b', shirt: '#e9e2cf', pants: '#4b5568', shoes: '#2f2f2f' } } },
  chief: { name: '이장님', hair: 'short', hairC: '#8a8a8a', hairH: '#aaaaaa', eyeC: '#4a3020', outfits: { base: { coat: '#7a5236', coatS: '#5f3e28', shirt: '#f4efe2', pants: '#4b4038', shoes: '#2f2f2f' } } },
  postman: { name: '우체부 아저씨', hair: 'cap', hairC: '#2a2220', hairH: '#444', capC: '#e3484a', eyeC: '#4a3020', outfits: { base: { coat: '#e3484a', coatS: '#c03a3c', shirt: '#ffffff', pants: '#3b4a56', shoes: '#2f2f2f', strap: '#7a5236' } } },
  tourist: { name: '관광객 부부 (남)', hair: 'short', hairC: '#3a2a22', hairH: '#5a4234', eyeC: '#4a3020', outfits: { base: { coat: '#f4f1ea', coatS: '#d9d3c6', shirt: '#f4f1ea', pants: '#5a7aa8', shoes: '#e9e4da', hat: 'straw', backpack: '#4f9a6a' } } },
  tourist2: { name: '관광객 부부 (여)', hair: 'long', hairC: '#6a4230', hairH: '#8a5a40', eyeC: '#5a3a28', fem: true, outfits: { base: { coat: '#f19ab5', coatS: '#d97f9a', shirt: '#f19ab5', pants: '#f7d4b5', skirt: '#ffffff', shoes: '#ffffff', closed: true, collar: '#ffffff' } } },
  rancher: { name: '목장 아저씨', hair: 'cap', hairC: '#3a2a22', hairH: '#5a4234', capC: '#7a5236', eyeC: '#4a3020', outfits: { base: { coat: '#c46a3c', coatS: '#a3552e', shirt: '#f4efe2', pants: '#3f5a8a', shoes: '#5a3a24' } } },
  farmer: { name: '농장 아주머니', hair: 'bun', hairC: '#3a2a22', hairH: '#5a4234', eyeC: '#4a3020', fem: true, outfits: { base: { coat: '#f39a2b', coatS: '#d9822a', shirt: '#f39a2b', pants: '#5a6a86', shoes: '#4a3a30', closed: true, collar: '#fff1d6', hat: 'straw' } }, keepHat: true },
  keeper: { name: '등대지기 할아버지', hair: 'cap', hairC: '#d9d6dd', hairH: '#ffffff', capC: '#2e3d66', eyeC: '#4a3020', closedEyes: true, outfits: { base: { coat: '#2e3d66', coatS: '#212c4b', shirt: '#ffffff', pants: '#3b3b48', shoes: '#2f2f2f', closed: true, collar: '#ffffff' } } },
  lifeguard: { name: '해변 안전요원', hair: 'short', hairC: '#2a2220', hairH: '#4a3a30', eyeC: '#4a3020', outfits: { base: { coat: '#e3484a', coatS: '#c03a3c', shirt: '#e3484a', pants: '#f2c94c', shoes: '#f7d4b5', closed: true, collar: '#ffffff', hat: 'straw' } }, keepHat: true },
  grandpa: { name: '귤밭 할아버지', hair: 'cap', hairC: '#c9c6cf', hairH: '#e6e4ea', capC: '#f2c94c', eyeC: '#4a3a30', closedEyes: true, outfits: { base: { coat: '#8a7a5a', coatS: '#6f6246', shirt: '#f4efe2', pants: '#5d5470', shoes: '#4a3a30' } } },
  auntie: { name: '횟집 이모', hair: 'bob', hairC: '#3a2a22', hairH: '#5a4234', eyeC: '#4a3020', fem: true, outfits: { base: { coat: '#ffffff', coatS: '#dddddd', shirt: '#ffffff', pants: '#3b4a56', shoes: '#2f6fa8', apron: '#2f6fa8', closed: true } } },
  superman: { name: '슈퍼 할아버지', hair: 'short', hairC: '#d9d6dd', hairH: '#ffffff', eyeC: '#4a3020', outfits: { base: { coat: '#4f9a6a', coatS: '#3f8058', shirt: '#ffffff', pants: '#4b4038', shoes: '#2f2f2f', closed: false } } },
};
/* 바깥을 돌아다니는 주민: spots = 들르는 곳, hours = 활동 시간 */
const VILLAGERS = {
  halmeoni: { spots: ['storageDoor', 'plaza', 'cafeDoor', 'orchardGate', 'harbor', 'homeDoor'], speed: 0.75, visits: [[7, 9, 'storage'], [14, 15.5, 'cafe']], lines: { base: ['아이고, 고운 사람. 밥은 먹었어?', '형사 양반이 요즘 실실 웃고 다녀. 무슨 일 있나 몰라~', '바다는 무서워도 고마운 거여.'], summer: ['물질하기 딱 좋은 날씨여.', '수박 먹으러 회관 와~'], autumn: ['추석엔 송편 빚으러 와. 예쁘게 빚으면 예쁜 짝 만나.'], winter: ['손 시렵지? 귤 까먹어.', '겨울 바다는 말이여, 사람을 겸손하게 해.'], spring: ['봄 물질 시작했어. 올해 첫 전복 맛볼텨?'] } },
  okja: { spots: ['storageDoor', 'sashimiDoor', 'beach', 'harbor'], speed: 0.85, visits: [[11, 12.5, 'sashimi']], lines: { base: ['순덕이 언니 못 봤어?', '해녀창고 정리하느라 허리가 다 나가.', '젊은 사람이 섬에 오니 좋네~'], summer: ['한여름엔 해 뜨기 전에 물에 들어가야 혀.'], autumn: ['소라가 살이 올랐어.'], winter: ['겨울 물은 칼이여, 칼.'], spring: ['잠수굿 때 꼭 구경 와.'] } },
  kid: { spots: ['schoolFront', 'plaza', 'superDoor', 'beach', 'field'], speed: 1.5, visits: [[9, 13, 'school']], hours: [8 * 60, 19 * 60], lines: { base: ['형사님이 그러는데요, 까마귀가 범인이래요!', '형사님은 맨날 파출소 앞에서 누구 기다려요.', '심심해요~ 같이 놀아요!'], summer: ['바다 수영 갈 거예요! 튜브 있어요!'], autumn: ['운동회 때 저 계주 대표예요!'], winter: ['눈사람 만들었어요! 광장에 있어요!'], spring: ['벚꽃 잎 잡으면 소원 이뤄진대요!'] } },
  kid2: { spots: ['schoolFront', 'orchardGate', 'cafeDoor', 'ranch', 'plaza'], speed: 1.3, visits: [[9, 13, 'school'], [15, 16, 'super']], hours: [8 * 60, 18.5 * 60], lines: { base: ['고양이 노랑이 봤어요? 제 친구예요.', '저 커서 형사 될 거예요!', '하늘이가 또 제 과자 먹었어요…'], summer: ['매미 잡았어요! …놓쳤어요.'], autumn: ['도토리 주웠어요. 다람쥐 줄 거예요.'], winter: ['손이 꽁꽁… 호호~'], spring: ['개구리 알 봤어요!'] } },
  fisher: { spots: ['pierEnd', 'harbor', 'rocks', 'sashimiDoor', 'superDoor'], speed: 1.1, visits: [[18, 19.5, 'sashimi']], lines: { base: ['오늘은 고등어가 잘 잡히네.', '형사 양반은 고기는 못 잡고 맨날 노을만 봐.', '바다 일은 하늘이 반, 사람이 반이여.'], summer: ['한치 철이여! 밤바다에 불 켜진 배 봤어?'], autumn: ['갯바위에 감성돔 붙었어.'], winter: ['방어가 기름이 꽉 찼어. 무인도 쪽으로 가 봐.'], spring: ['학꽁치 떼가 들어왔네.'] } },
  chief: { spots: ['hallFront', 'plaza', 'clinicFront', 'farm'], speed: 0.95, visits: [[9, 11, 'hall']], hours: [7 * 60, 13 * 60], lines: { base: ['마을 일은 내가 다 꿰고 있지. 허허.', '회관 게시판 봤나? 행사 많아.', '형사 그 친구, 아주 성실해. 장가만 가면 되는데 말이야.'], summer: ['여름 축제 준비로 바빠.'], autumn: ['추석 잔치에 꼭 와.'], winter: ['연말엔 해넘이 보러 등대로 다 모이지.'], spring: ['유채꽃 축제 포스터 붙여야 하는데.'] } },
  postman: { spots: ['homeDoor', 'schoolFront', 'sataekDoor', 'hallFront', 'harbor', 'farmhouse', 'ranch'], speed: 1.35, visits: [[12, 13, 'police']], hours: [9 * 60, 16 * 60], lines: { base: ['편지 왔어요~ 아, 이건 이장님 거네.', '이 섬 배달은 30분이면 끝나요. 수다가 길어서 그렇지.', '요즘 형사님 앞으로 택배가 자주 와요. 뭘 그렇게 사나 몰라.'], winter: ['연하장 시즌이라 바빠요!'] } },
  tourist: { spots: ['beach', 'harbor', 'cafeDoor', 'lighthouse', 'windmill'], speed: 1.0, visits: [[13, 14, 'cafe']], hours: [10 * 60, 18 * 60], lines: { base: ['해월도 너무 예뻐요! 사진 찍어 주실래요?', '여기 맛집 어디예요? 횟집이요? 감사해요!', '등대 노을이 유명하다던데.'] } },
  tourist2: { spots: ['beachEast', 'harbor', 'cafeDoor', 'lighthouse', 'field'], speed: 0.9, visits: [[13, 14, 'cafe']], hours: [10 * 60, 18 * 60], lines: { base: ['신혼여행 왔어요~ 여기 너무 좋아요.', '아까 그 형사님 멋있으시던데, 혹시 애인 있으세요? …어머, 웃으시네.', '귤 라떼 꼭 마셔 보래요!'] } },
  grandpa: { spots: ['orchardGate', 'farm', 'farmIn', 'farmhouse'], speed: 0.7, visits: [[15, 16, 'clinic']], lines: { base: ['귤나무는 사람 발소리 듣고 큰다네.', '형사 총각이 귤 따는 거 도와주더라고. 기특해.'], winter: ['수확철이야! 몇 개 따 가. 대신 까서 먹어야 돼.'], spring: ['귤꽃 향기 맡아 봐. 이게 섬 향기지.'], summer: ['풋귤은 청으로 담그면 좋아.'], autumn: ['노랗게 익어 가는 거 보는 맛에 살지.'] } },
  rancher: { spots: ['ranchIn', 'ranch', 'farm', 'ranchIn'], speed: 1.05, lines: { base: ['조랑이 녀석, 오늘 기분 좋네.', '말은 눈을 보면 다 알아. 사람이랑 똑같지.', '형사 양반? 가끔 와서 건초 날라 줘. 착해.'], summer: ['여름엔 말들도 그늘을 좋아해.'], winter: ['겨울엔 말 털이 복슬복슬해져.'] } },
  farmer: { spots: ['farmIn', 'farm', 'farmhouse', 'field'], speed: 0.95, visits: [[12, 13, 'super']], lines: { base: ['우리 농장 귤은 섬에서 제일 달아!', '평상에 앉아서 쉬다 가.', '귤 창고에 일손이 모자라~'], winter: ['수확철이야! 일손 좀 빌려줘.'], spring: ['귤꽃 향기 맡으러 왔어?'] } },
  keeper: { spots: ['lighthouse', 'lighthouseDoor', 'windmill', 'beachEast'], speed: 0.8, lines: { base: ['등대 불은 사십 년째 내가 켜.', '바다는 밤에 더 정직해.', '노을 보려면 저녁 여섯 시쯤 와.'], winter: ['겨울 바다는 별이 더 잘 보여.'] } },
  lifeguard: { spots: ['beach', 'beachEast', 'beachWest', 'beachBench'], hours: [9 * 60, 18 * 60], speed: 1.2, lines: { base: ['깊은 데는 들어가지 마세요~', '해파리 조심! 오늘은 괜찮아요.', '형사님이랑 오셨어요? 사이좋아 보여요!'], winter: ['겨울엔 순찰만 돌아요. 바다 보러 오셨어요?'] } },
};
/* 건물 안에 있는 주민 */
const STAFF = {
  in_sashimi: [['auntie', 5.5, 2.5]],
  in_super: [['superman', 2.5, 2.5]],
  in_hall: [['chief', 6.5, 2.5, [13 * 60, 18 * 60]]],
  in_storage: [['okja', 4.5, 2.5, [7 * 60, 10 * 60]]],
};
const STAFF_LINES = {
  auntie: ['어서 와~ 오늘 물회 맛있어!', '형사 양반이랑 같이 오면 서비스 줄게. 호호.', '수조에 참돔 들어왔어, 구경해.'],
  superman: ['뭐 줄까? 가구도 들어왔어.', '형사 총각이 캔커피를 박스로 사 가더라.', '배 들어오는 날엔 신상 있어.'],
  chief: ['회관 행사 게시판 보고 가.', '노래 한 곡 하고 가게나.', '마을 일은 내가 다 꿰고 있지.'],
  okja: ['장비 손질 중이여. 구경하고 가.', '해산물 손질하면 값 더 쳐줘.'],
};

/* ---------------- 다른 직업 여성 주민 (질투 유발, 연애 대상 아님) ---------------- */
const RIVALS = {
  doctor: { id: 'r_doctor', name: '윤서 선생님', role: '보건지소 의사', home: 'in_clinic', at: [5.5, 2.5],
    look: { hair: 'long', hairC: '#3a2622', hairH: '#5a3a30', eyeC: '#5a3a28', fem: true, outfits: { base: { coat: '#f6f7fb', coatS: '#d5d9e6', shirt: '#9fc3e6', pants: '#f7d4b5', skirt: '#4a5878', shoes: '#3b3b48', stetho: true } } } },
  teacher: { id: 'r_teacher', name: '하은 선생님', role: '초등학교 선생님', home: 'in_school', at: [3.5, 1.5],
    look: { hair: 'wave', hairC: '#6a4230', hairH: '#8a5a40', eyeC: '#5a3a28', fem: true, outfits: { base: { coat: '#e9b44c', coatS: '#c8932f', shirt: '#fbf7ee', pants: '#f7d4b5', skirt: '#7a8fb0', shoes: '#6a4934' } } } },
  traveler: { id: 'r_traveler', name: '여행객 지아', role: '여행객', home: null, at: null,
    look: { hair: 'twin', hairC: '#4a3226', hairH: '#6b4a36', eyeC: '#5a3a28', fem: true, outfits: { base: { coat: '#5fb3c8', coatS: '#468fa3', shirt: '#fbf7ee', pants: '#f7d4b5', skirt: '#3f5a8a', shoes: '#e9e4da', backpack: '#c46a3c', strap: '#8c4422', hat: 'straw' } } } },
  cafe: { id: 'r_cafe', name: '소연 사장님', role: '카페 사장님', home: 'in_cafe', at: [2.5, 2.5],
    look: { hair: 'long', hairC: '#7a4a30', hairH: '#9a6a48', eyeC: '#5a3a28', fem: true, outfits: { base: { coat: '#fbf7ee', coatS: '#ddd6c6', shirt: '#fbf7ee', pants: '#4b4038', shoes: '#3b2e28', apron: '#7a4e33', closed: true, collar: '#fbf7ee' } } } },
  haenyeo: { id: 'r_haenyeo', name: '막내 해녀 미나', role: '해녀', home: 'in_storage', at: [3.5, 2.5],
    look: { hair: 'ponytail', hairC: '#2a2220', hairH: '#4a3a30', eyeC: '#5a3a28', fem: true, outfits: { base: { coat: '#2a2c34', coatS: '#1c1d23', shirt: '#2a2c34', pants: '#2a2c34', shoes: '#22232a', closed: true, collar: '#2a2c34', accent: '#ef7b3a' } } } },
};
/* 형사님과 나란히 걸으며 나누는 대화 [여성 주민, 형사님] */
const RIVAL_CHAT = [
  ['형사님, 저번에 짐 들어 주셔서 고마웠어요~', '에이, 당연한 거죠. 무거운 건 언제든 불러요.'],
  ['형사님은 주말에 뭐 하세요?', '음… 낚시요. 아니면 그냥 마을 한 바퀴.'],
  ['이 섬 노을은 형사님이랑 보면 더 예쁠 것 같아요. 호호.', '하하, 노을은 누구랑 봐도 예뻐요.'],
  ['형사님 웃을 때 눈 휘는 거, 마을 사람들이 다 좋아해요.', '…그래요? 처음 듣는데요.'],
  ['커피 한 잔 하실래요? 제가 살게요!', '아, 마음만 받을게요. 근무 중이라.'],
  ['형사님은 이상형이 어떻게 되세요?', '음… 글쎄요. 요즘 좀 생각이 바뀌는 중이라.'],
];
const RIVAL_TALK = {
  before: ['형사님이요? 정말 다정하시죠~ 저번에 우산도 빌려주셨어요.', '형사님이랑 친하세요? 부럽다~', '저 이번 축제 때 형사님이랑 같이 다닐까 해요. 호호, 농담이에요.', '형사님 좋아하는 커피 아세요? 캔커피래요. 의외죠?'],
  after: ['두 분 진짜 잘 어울려요! 축하해요~', '형사님이 요즘 매일 당신 얘기만 해요. 질투 나서 혼났어요. 호호.', '저는 이제 두 분 응원단이에요!', '형사님 웃는 거 보면 다 당신 덕분인 것 같아요.'],
};
const JEALOUS = [
  { q: '두 분 친해 보이던데요?', a: ['어… 그냥 마을 분이에요. 진짜로.', '…혹시 질투해요? 그럼 저 좀 기쁜데.'], aff: [2, 4] },
  { q: '(모른 척 지나간다)', a: ['잠깐만요! 그냥 가요? …서운하다.', '아까부터 당신 찾고 있었어요.'], aff: [0, 2] },
  { q: '저도 같이 걸어도 돼요?', a: ['당연하죠. 사실 당신이랑 걷고 싶었어요.', '오히려 제가 부탁하고 싶었는데.'], aff: [3, 3] },
];

/* ---------------- 동물 ---------------- */
const PETS = {
  cheese: { spots: ['plaza', 'cafeDoor', 'superDoor', 'homeDoor'], speed: 1.1, lines: ['냥?', '냐아~ (발라당 배를 보인다)', '골골골… (다리에 머리를 비빈다)', '(꼬리를 살랑살랑)', '냥! (생선 냄새를 맡았다)'] },
  mackerel: { spots: ['harbor', 'pierEnd', 'sashimiDoor', 'storageDoor'], speed: 0.9, lines: ['야옹. (포구 대장의 위엄)', '(낚싯바늘을 노려본다)', '냐… (졸린 눈으로 깜빡)', '냥냥! (생선 내놔라)'] },
  calico: { spots: ['orchardGate', 'schoolFront', 'farm', 'field'], speed: 1.0, lines: ['미야~', '(꾹꾹이를 한다)', '냥? (고개를 갸웃)', '(햇볕에서 식빵을 굽는다)'] },
  baekgu: { spots: ['station', 'plaza', 'clinicFront', 'beach'], speed: 1.6, lines: ['멍멍!', '왈! (꼬리를 붕붕 흔든다)', '킁킁… (간식 냄새를 맡는다)', '(앞발을 내민다. 손!)', '왈왈! (형사님 따라다니는 게 취미)'] },
  nureongi: { spots: ['forest', 'pavilion', 'villageWest', 'rocks'], speed: 1.4, lines: ['멍?', '헥헥 (산책 가자는 눈빛)', '(나뭇가지를 물어 온다)', '왈! (해변까지 달리기 시합!)'] },
  pony: { spots: ['ranchIn'], speed: 0.9, pen: [75, 25, 91, 35], lines: ['히힝~', '(당근 냄새를 맡는다)', '푸르르… (콧김을 뿜는다)', '(머리를 쓰다듬어 달라는 듯 숙인다)'] },
  pony2: { spots: ['ranchIn'], speed: 0.8, pen: [75, 25, 91, 35], lines: ['히히힝!', '(풀을 오물오물)', '(꼬리로 파리를 쫓는다)'] },
};

/* ---------------- 계절 행사 (날짜: 월/일, 한 달 = 10일) ---------------- */
const EVENTS = [
  { id: 'beachOpen', m: 7, d: 3, name: '해수욕장 개장', icon: '🏖️', from: 10 * 60, to: 17 * 60, map: 'island', at: 'beach', fx: 'confetti',
    intro: '오늘은 해수욕장 개장날! 해변에 사람들이 모여요.', lines: [[['smile', '개장 첫날은 사람 구경이 반이에요.']], [['tease', '수영할 거예요? 저는 구조대 대기할게요.']], [['smile', '튜브 하나 빌려 왔어요. 같이 둥둥 떠 있어요.']], [['laugh', '여보, 선크림! 등은 내가 발라 줄게요.']]],
    choice: [['물에 들어가요!', 3, '좋아요! 차가워도 비명 지르기 없기.'], ['모래성 쌓아요', 2, '형사의 건축 실력 보여 드리죠.']] },
  { id: 'fireworks', m: 7, d: 8, name: '여름밤 불꽃놀이', icon: '🎆', from: 19.5 * 60, to: 22 * 60, map: 'island', at: 'harbor', fx: 'fireworks',
    intro: '오늘 밤 8시, 동쪽 포구에서 불꽃놀이가 열려요!', lines: [[['surprise', '와, 시작했다! 올해 건 크네요.']], [['smile', '불꽃 터질 때마다 당신 얼굴이 환해져요.']], [['blush', '불꽃보다… 아니, 이 말 너무 뻔하죠. 그래도 할래요. 당신이 더 예뻐요.']], [['smile', '작년엔 연인이었는데 올해는 부부네요. 내년엔 뭐가 더 좋을까.']]],
    choice: [['소원 빌었어요', 4, '저도요. 아마 같은 소원일걸요.'], ['예쁘다…', 3, '네. 진짜 예쁘다.']] },
  { id: 'typhoon', m: 8, d: 2, name: '태풍 대비의 날', icon: '🌀', from: 8 * 60, to: 16 * 60, map: 'island', at: 'station', weather: 'storm',
    intro: '태풍이 다가와요. 파출소 앞에서 형사님이 안전 점검 중이에요.', lines: [[['serious', '오늘은 바닷가 가면 안 돼요. 꼭이요.']], [['serious', '창문 테이프 붙였어요? 이따 집 앞 확인하러 갈게요.']], [['serious', '오늘은 제 말 들어요. 집에 있어요. …걱정돼서 그래요.']], [['serious', '여보, 오늘은 집에 꼭 있어요. 일 끝나면 바로 갈게.']]],
    choice: [['조심하세요', 3, '네. 무사히 돌아올게요. 약속.'], ['도울 거 있어요?', 4, '그럼 할머니들 댁에 연락 좀 돌려 줄래요? 든든하다.']] },
  { id: 'watermelon', m: 8, d: 6, name: '회관 수박 나눠 먹기', icon: '🍉', from: 13 * 60, to: 17 * 60, map: 'island', at: 'hallFront', fx: 'confetti', reward: 'watermelon',
    intro: '마을회관 앞에서 수박을 나눠 줘요!', lines: [[['laugh', '씨 멀리 뱉기 대회 한대요. 저 작년 챔피언.']], [['tease', '수박 제일 빨간 부분, 당신 줄게요.']], [['smile', '한 입 줄래요? …아, 먹여 주는 거예요? 좋아요.']], [['laugh', '여보 입에 씨 붙었어요. 가만있어 봐.']]],
    choice: [['씨 뱉기 도전!', 3, '오, 진지하다. …졌다. 당신이 챔피언.'], ['한 조각 더!', 2, '제 거 드세요.']] },
  { id: 'fireflies', m: 8, d: 9, name: '반딧불이 산책', icon: '✨', from: 20 * 60, to: 23 * 60, map: 'island', at: 'pavilion', fx: 'fireflies',
    intro: '오늘 밤 동백숲 정자에 반딧불이가 나온대요.', lines: [[['surprise', '봐요, 반딧불이! 쉿, 조용히.']], [['smile', '반딧불이가 당신 머리에 앉았어요. 움직이지 마요.']], [['blush', '반딧불이 빛 속에서 보니까… 꿈 같아요.']], [['smile', '우리 아이 생기면, 꼭 같이 보여 주고 싶다.']]],
    choice: [['손에 앉았어요!', 4, '소원 빌어요. 빨리.'], ['너무 예뻐요', 3, '그쵸. 여름 끝나기 전에 꼭 보여 주고 싶었어요.']] },
  { id: 'chuseok', m: 9, d: 5, name: '추석 송편 빚기', icon: '🌕', from: 10 * 60, to: 18 * 60, map: 'island', at: 'hallFront', reward: 'songpyeon',
    intro: '추석이에요! 마을회관에서 송편을 빚어요.', lines: [[['laugh', '제 송편 모양 보세요. …만두 같다고요? 맞아요.']], [['tease', '예쁘게 빚으면 예쁜 짝 만난대요. 당신 거 엄청 예쁘네.']], [['smile', '보름달한테 소원 빌었어요. 내년에도 당신이랑 송편 빚게 해 달라고.']], [['smile', '우리 집 첫 추석이네요. 여보.']]],
    choice: [['제 송편 드세요', 4, '아까워서 못 먹겠다. …맛있다.'], ['달 보러 가요', 3, '좋아요. 전망대 가요.']] },
  { id: 'sports', m: 10, d: 3, name: '해월 운동회', icon: '🏃', from: 9 * 60, to: 15 * 60, map: 'island', at: 'schoolFront', fx: 'confetti',
    intro: '오늘은 학교 운동장에서 마을 운동회가 열려요!', lines: [[['laugh', '줄다리기 심판 보는데 할머니들이 반칙해요. 못 본 척 중.']], [['smile', '2인 3각 같이 나갈래요? 호흡 맞춰 봐요.']], [['tease', '2인 3각 1등! 우리 호흡 완벽하네요.']], [['laugh', '부부 대항 계주, 우리가 1등이에요 여보!']]],
    choice: [['같이 달려요!', 4, '하나, 둘! 하나, 둘! …넘어질 뻔.'], ['응원할게요', 2, '당신 응원이면 저 날아요.']] },
  { id: 'silvergrass', m: 10, d: 7, name: '억새 축제', icon: '🌾', from: 14 * 60, to: 19 * 60, map: 'island', at: 'hill',
    intro: '해월 오름에서 억새 축제가 열려요.', lines: [[['smile', '억새가 바람에 눕는 거, 파도 같죠.']], [['smile', '억새밭에서 사진 찍어 줄게요. 거기 서 봐요.']], [['blush', '억새 사이로 걷는 당신, 영화 같아요.']], [['smile', '가을마다 여기 오자. 우리 둘만의 행사.']]],
    choice: [['사진 찍어요', 3, '하나, 둘, 셋! 예쁘다.'], ['조금 쓸쓸해요', 3, '그럼 제가 옆에 꼭 붙어 있을게요.']] },
  { id: 'meteor', m: 11, d: 6, name: '별똥별이 쏟아지는 밤', icon: '🌠', from: 21 * 60, to: 23.9 * 60, map: 'island', at: 'observatory', fx: 'meteors',
    intro: '오늘 밤 유성우가 내린대요. 오름 전망대에서 보세요!', lines: [[['surprise', '봤어요? 방금 하나 떨어졌어요!']], [['smile', '소원 세 번 말해야 된대요. 너무 빨라서 못 하겠다.']], [['blush', '제 소원은 세 번 다 같아요. 당신.']], [['smile', '여보, 우리 소원 벌써 다 이뤘네요.']]],
    choice: [['소원 빌었어요', 4, '뭐 빌었어요? …비밀? 그럼 저도 비밀.'], ['춥다…', 3, '제 겉옷 입어요. 아니, 같이 덮어요.']] },
  { id: 'harvest', m: 12, d: 2, name: '귤 수확 축제', icon: '🍊', from: 10 * 60, to: 17 * 60, map: 'island', at: 'farm', reward: 'tangerine', fx: 'confetti',
    intro: '귤 수확 축제! 귤 농장 마을에서 다 같이 귤을 따요.', lines: [[['laugh', '귤 따는 것보다 까먹는 게 더 빨라요.']], [['tease', '손 노래졌어요. 귤 많이 먹었죠? 저도요.']], [['smile', '제일 맛있는 귤 골라서 당신 주려고 아껴 뒀어요.']], [['smile', '우리 집 귤 상자, 올해도 꽉 채우자.']]],
    choice: [['귤 까 줄게요', 4, '…하얀 거까지 다 떼 줬네. 감동이다.'], ['귤 던지기!', 2, '형사한테 귤 던지면 공무집행… 하하, 농담.']] },
  { id: 'firstsnow', m: 12, d: 5, name: '첫눈', icon: '❄️', from: 7 * 60, to: 23 * 60, map: 'island', at: 'plaza', weather: 'snow',
    intro: '해월도에 첫눈이 내려요!', lines: [[['surprise', '첫눈이다! 해월도엔 눈이 귀한데.']], [['smile', '첫눈 오는 날 같이 있으면 이뤄진대요. …아, 누가 그러던데.']], [['blush', '첫눈 오는 날 당신이랑 있어서 다행이다.']], [['smile', '여보, 눈사람 만들자. 우리 닮은 걸로 둘.']]],
    choice: [['눈사람 만들어요', 3, '머리는 귤로 할까요? 하하.'], ['손 시려요', 4, '이리 줘요. 제 주머니에 같이 넣어요.']] },
  { id: 'christmas', m: 12, d: 9, name: '크리스마스 이브', icon: '🎄', from: 18 * 60, to: 23.5 * 60, map: 'island', at: 'plaza', fx: 'snowlights',
    intro: '광장에 크리스마스 트리가 켜져요!', lines: [[['smile', '파출소 앞 트리, 제가 전구 달았어요.']], [['tease', '산타 할아버지한테 편지 썼어요? 저는 썼어요.']], [['blush', '선물이요? 저는… 오늘 같이 있는 게 선물이에요. 그래도 준비는 했어요.']], [['smile', '메리 크리스마스, 여보.']]],
    choice: [['메리 크리스마스!', 4, '메리 크리스마스. 당신 덕에 올해 진짜 따뜻했어요.'], ['선물 있어요?', 3, '눈 감아 봐요. …목도리. 직접 고른 거예요.']] },
  { id: 'sunset', m: 12, d: 10, name: '해넘이', icon: '🌇', from: 17 * 60, to: 19.5 * 60, map: 'island', at: 'lighthouse',
    intro: '올해 마지막 해넘이. 등대로 모여요.', lines: [[['normal', '올 한 해 수고 많았어요.']], [['smile', '올해 제일 잘한 일은… 당신 만난 거예요.']], [['blush', '내년에도, 그다음 해에도 같이 보자.']], [['smile', '우리 가족의 첫 해넘이네요.']]],
    choice: [['내년에도 같이요', 4, '약속. 새끼손가락.'], ['고마웠어요', 3, '제가 더요.']] },
  { id: 'newyear', m: 1, d: 1, name: '새해 해돋이', icon: '🌅', from: 6.9 * 60, to: 9 * 60, map: 'island', at: 'rocks',
    intro: '새해 첫날! 서쪽 갯바위에서 해돋이를 봐요.', lines: [[['smile', '새해 복 많이 받아요!']], [['tease', '새해 첫 인사, 제가 일등이죠?']], [['blush', '새해 첫 장면이 당신이라서 좋다.']], [['smile', '여보, 올해도 잘 부탁해요.']]],
    choice: [['새해 복 많이 받아요', 3, '당신도요. 복은 제가 다 나눠 줄게요.'], ['소원 빌어요', 3, '올해 소원은… 비밀. 대신 이루는 건 같이 해요.']] },
  { id: 'chocolate', m: 2, d: 4, name: '초콜릿 데이', icon: '🍫', from: 9 * 60, to: 21 * 60, map: 'island', at: 'station',
    intro: '오늘은 초콜릿 데이! 마음을 전해 보세요. (슈퍼에서 초콜릿을 팔아요)', lines: [[['normal', '오늘 파출소에 초콜릿이 몇 개 들어왔어요. 할머니들이.']], [['tease', '…혹시 저 주려고 온 거예요? 아니면 그냥 지나가는 길?']], [['blush', '오늘 하루 종일 기다렸어요. 티 났죠.']], [['smile', '여보 초콜릿이 세상에서 제일 달아요.']]],
    choice: [['(초콜릿을 건넨다)', 5, '…진짜요? 이거 평생 못 먹겠다. 아까워서.'], ['그냥 들렀어요', 1, '아… 네. 그렇죠. (시무룩)']] },
  { id: 'canola', m: 3, d: 6, name: '유채꽃 축제', icon: '🌼', from: 10 * 60, to: 18 * 60, map: 'island', at: 'field', fx: 'petals',
    intro: '꽃밭 들판에 유채꽃이 활짝! 축제가 열려요.', lines: [[['smile', '유채꽃 냄새 맡아 봐요. 봄 냄새.']], [['tease', '노란 꽃밭에 서 있으니까 당신이 제일 눈에 띄어요.']], [['blush', '꽃 하나 꺾어서… 아, 꺾으면 안 되죠. 대신 사진으로.']], [['smile', '봄마다 여기 오자, 여보.']]],
    choice: [['사진 찍어요', 3, '찰칵. 배경화면 해야지.'], ['봄이 좋아요', 3, '저도요. 당신이 웃는 계절이라.']] },
  { id: 'whiteday', m: 3, d: 4, name: '사탕 데이', icon: '🍬', from: 10 * 60, to: 21 * 60, map: 'island', at: 'station', reward: 'candy',
    intro: '오늘은 사탕 데이. 형사님이 뭔가 준비한 눈치예요.', lines: [[['smile', '할머니들 사탕 나눠 드리는 중이에요. 하나 가져가요.']], [['tease', '이거 당신 거예요. 특별히 큰 걸로.']], [['blush', '사탕 바구니요. 직접 포장했어요. 리본 묶는 데 한 시간.']], [['smile', '여보, 당신 몫은 따로 있어요. 제일 단 걸로.']]],
    choice: [['고마워요!', 3, '받아 줘서 제가 더 고마워요.'], ['리본 삐뚤어요', 2, '…알아요. 그래도 마음은 안 삐뚤어요.']] },
  { id: 'cherry', m: 4, d: 4, name: '벚꽃길 산책', icon: '🌸', from: 11 * 60, to: 19 * 60, map: 'island', at: 'schoolFront', fx: 'petals',
    intro: '학교 앞 벚꽃길이 만개했어요!', lines: [[['smile', '벚꽃 잎 잡으면 소원 이뤄진대요. 하늘이가 그러더라고요.']], [['tease', '잡았다! …당신 머리에 붙은 거 떼 준 거예요.']], [['blush', '벚꽃 아래 당신, 반칙이에요.']], [['smile', '여보, 꽃잎 하나 잡았어요. 우리 집 액자에 넣자.']]],
    choice: [['소원 빌어요', 3, '눈 감고… 빌었어요. 내용은 당신.'], ['꽃잎 잡기 시합!', 3, '하나, 둘… 졌다. 당신 반사신경 대단하다.']] },
  { id: 'jamsugut', m: 5, d: 3, name: '해녀 잠수굿', icon: '🌊', from: 9 * 60, to: 14 * 60, map: 'island', at: 'storageDoor', fx: 'confetti',
    intro: '해녀창고 앞에서 올해 물질의 안전을 비는 잠수굿이 열려요.', lines: [[['serious', '해녀분들 무사하시라고 다 같이 비는 날이에요.']], [['normal', '올해도 아무도 안 다치게. 저도 같이 빌어요.']], [['smile', '당신 안전도 같이 빌었어요. 제일 크게.']], [['smile', '여보, 우리 가족도 바다 덕에 사니까 같이 빌자.']]],
    choice: [['같이 빌어요', 3, '바다님, 잘 부탁드립니다.'], ['할머니들 멋있어요', 2, '그쵸. 이 섬의 진짜 영웅들이에요.']] },
  { id: 'hydrangea', m: 6, d: 5, name: '수국 축제', icon: '💠', from: 10 * 60, to: 18 * 60, map: 'island', at: 'homeDoor', fx: 'petals',
    intro: '파란 수국이 활짝 핀 수국 축제!', lines: [[['smile', '수국은 땅에 따라 색이 바뀐대요. 신기하죠.']], [['tease', '저는 당신 옆에 있으면 색이 바뀌어요. 빨개져요.']], [['blush', '수국 꽃말이 "진심"이래요. 딱 제 마음.']], [['smile', '우리 집 앞에도 수국 심자.']]],
    choice: [['파란 게 좋아요', 2, '저도요. 바다 색이라.'], ['진심 받았어요', 4, '…받았으면 됐어요. 그걸로 충분해요.']] },
];
const TIER_NAME = ['처음', '친구', '연인', '부부'];
function tierOf(stage) { return stage >= 8 ? 3 : stage >= 5 ? 2 : stage >= 3 ? 1 : 0; }

/* ---------------- 시즌 옷차림 ---------------- */
const SEASON_WEAR = {
  det: {
    work: { summer: { rolled: true }, autumn: {}, winter: { coat: '#283559', coatS: '#1c2645', scarf: '#5b5f69' }, spring: {} },
    casual: { summer: {}, autumn: { coat: '#c9a27a', coatS: '#a9845f', closed: false, shirt: '#eef5fc', rolled: false }, winter: { coat: '#34436b', coatS: '#26335a', closed: true, collar: '#34436b', scarf: '#d9404f', rolled: false }, spring: { coat: '#8fa6c4', coatS: '#7690b0', closed: false, shirt: '#ffffff', rolled: false } },
  },
  generic: { summer: { rolled: true }, autumn: { tint: '#a9845f' }, winter: { scarf: true, winterTint: true }, spring: {} },
};
const SCARF_COLORS = ['#d9404f', '#3f7f6a', '#f2c94c', '#7fa3e6', '#f4efe2'];

/* ---------------- v4: 형사님 옷 (외형은 그대로, 옷만 다양하게) ---------------- */
const DET_OUTFITS = {
  workShirt: { coat: '#9cc1e6', coatS: '#7ea4cc', shirt: '#9cc1e6', pants: '#1e2437', shoes: '#2b2220', badge: true, closed: true, collar: '#e8f2fc', rolled: true },
  workVest: { coat: '#f1f1ee', coatS: '#d5d5d0', shirt: '#f1f1ee', vest: '#2e3d66', pants: '#1e2437', shoes: '#2b2220', badge: true, closed: true, collar: '#ffffff' },
  linen: { coat: '#f4f1ea', coatS: '#d9d3c6', shirt: '#f4f1ea', pants: '#cbb792', shoes: '#8a5a3a', rolled: true, closed: true, collar: '#ffffff', shorts: true },
  stripe: { coat: '#f4f4f2', coatS: '#d8d8d4', shirt: '#f4f4f2', stripe: '#3a4a7a', pants: '#3f5a8a', jeans: true, shoes: '#f1efe9', closed: true, collar: '#f4f4f2', rolled: true },
  knit: { coat: '#e9dcc2', coatS: '#cdbfa2', shirt: '#e9dcc2', knit: true, pants: '#6b4a35', shoes: '#3b2e28', closed: true, collar: '#ffffff' },
  hoodie: { coat: '#8a8f9a', coatS: '#6f7480', shirt: '#8a8f9a', hood: true, pants: '#3f5a8a', jeans: true, shoes: '#f1efe9', closed: true, collar: '#8a8f9a' },
  denim: { coat: '#4f78b0', coatS: '#3c5f90', shirt: '#ffffff', denim: true, pants: '#23252e', shoes: '#2b2220' },
};
const DET_OUTFIT_NAMES = { work: '근무복 재킷', workShirt: '여름 근무 셔츠', workVest: '근무 조끼', casual: '하늘색 셔츠', linen: '리넨 셔츠 · 반바지', stripe: '줄무늬 티', knit: '니트 스웨터', hoodie: '후드티', denim: '데님 재킷' };
const DET_WEAR = {
  work: { summer: ['workShirt', 'workShirt', 'workVest'], autumn: ['work', 'workVest'], winter: ['work'], spring: ['work', 'workVest', 'workShirt'] },
  casual: { summer: ['casual', 'linen', 'stripe'], autumn: ['knit', 'denim', 'hoodie', 'casual'], winter: ['knit', 'hoodie'], spring: ['denim', 'stripe', 'casual', 'hoodie'] },
};
Object.assign(SEASON_WEAR.det, {
  workVest: { winter: { scarf: '#5b5f69' } }, knit: { winter: { scarf: '#d9404f' } }, hoodie: { winter: { scarf: '#3f7f6a' } }, denim: { winter: { scarf: '#f2c94c' } },
});
const DET_OUTFIT_LINES = { workShirt: '여름엔 반팔 근무복이에요. 시원해서 좋아요.', workVest: '오늘은 조끼 입었어요. 주머니가 많아서 귤도 들어가요.', linen: '반바지 처음 보죠? …다리 보지 마요.', stripe: '줄무늬 티, 어때요? 할머니가 사 주셨어요.', knit: '니트 입으니까 따뜻하다. 만져 볼래요?', hoodie: '쉬는 날엔 후드티가 최고예요.', denim: '데님 재킷 꺼냈어요. 좀 멋있어 보여요?' };

/* ---------------- v4: 옷가게 · 미용실 ---------------- */
const CLOTHES = {
  job: { name: '직업복', icon: '💼', price: 0 },
  dress: { name: '원피스', icon: '👗', price: 15000, fem: true, make: (c) => ({ coat: c, coatS: shade(c, 0.82), shirt: c, skirt: c, long: true, pants: '#f7d4b5', shoes: '#ffffff', closed: true, collar: '#ffffff', rolled: true }) },
  skirtTee: { name: '티셔츠 + 치마', icon: '👚', price: 12000, fem: true, make: (c) => ({ coat: '#fbf7ee', coatS: '#ddd6c6', shirt: '#fbf7ee', skirt: c, pants: '#f7d4b5', shoes: '#e9e4da', closed: true, collar: '#fbf7ee', rolled: true }) },
  jeansTee: { name: '티셔츠 + 청바지', icon: '👖', price: 12000, make: (c) => ({ coat: c, coatS: shade(c, 0.82), shirt: c, pants: '#4a6fa8', jeans: true, shoes: '#f1efe9', closed: true, collar: c, rolled: true }) },
  shorts: { name: '반바지 세트', icon: '🩳', price: 10000, make: (c) => ({ coat: c, coatS: shade(c, 0.82), shirt: c, pants: '#e9e4da', shorts: true, shoes: '#f1efe9', closed: true, collar: '#ffffff', rolled: true }) },
  knitSkirt: { name: '니트 + 롱스커트', icon: '🧶', price: 18000, fem: true, make: (c) => ({ coat: c, coatS: shade(c, 0.85), shirt: c, knit: true, skirt: '#6b4a35', long: true, pants: '#f7d4b5', shoes: '#6a4934', closed: true, collar: '#ffffff' }) },
  hoodieJeans: { name: '후드티 + 청바지', icon: '🧥', price: 16000, make: (c) => ({ coat: c, coatS: shade(c, 0.8), shirt: c, hood: true, pants: '#4a6fa8', jeans: true, shoes: '#f1efe9', closed: true, collar: c }) },
  shirtSlacks: { name: '셔츠 + 슬랙스', icon: '👔', price: 16000, make: (c) => ({ coat: '#ffffff', coatS: '#dddddd', shirt: '#ffffff', pants: c, shoes: '#3b2e28', closed: true, collar: '#ffffff', rolled: true }) },
  stripeTee: { name: '줄무늬 티', icon: '🎽', price: 11000, make: (c) => ({ coat: '#ffffff', coatS: '#dcdcd8', shirt: '#ffffff', stripe: c, pants: '#3f5a8a', jeans: true, shoes: '#f1efe9', closed: true, collar: '#ffffff', rolled: true }) },
  denimJacket: { name: '데님 재킷', icon: '🧢', price: 20000, make: (c) => ({ coat: '#4f78b0', coatS: '#3c5f90', shirt: c, denim: true, pants: '#23252e', shoes: '#f1efe9' }) },
  hanbok: { name: '개량 한복', icon: '🎎', price: 30000, fem: true, make: (c) => ({ coat: '#fbf7ee', coatS: '#e3dccd', shirt: '#fbf7ee', skirt: c, long: true, accent: shade(c, 0.8), pants: '#f7d4b5', shoes: '#ffffff', closed: true, collar: c }) },
};
const CLOTH_COLORS = [['핑크', '#f19ab5'], ['하늘', '#8fc3ea'], ['민트', '#8fd6b8'], ['노랑', '#f2d06a'], ['라벤더', '#b9a6e8'], ['화이트', '#f6f4ee'], ['네이비', '#3a4a7a'], ['버건디', '#a8404f']];
const HAIR_STYLES = { ponytail: '포니테일', bob: '단발', short: '짧은 머리', long: '긴 생머리', wave: '긴 웨이브', twin: '양갈래', bun: '똥머리' };
const HAIR_COLORS = [['흑갈색', '#3b2a24'], ['밤색', '#6a4230'], ['초코', '#4a3226'], ['애쉬 브라운', '#8a7a70'], ['금발', '#d9a84a'], ['핑크', '#e88aa4'], ['와인', '#8a3040'], ['블루블랙', '#23283a']];
const STYLE_PRICE = { hair: 8000, color: 6000 };
Object.assign(NPC_LOOKS, {
  tailor: { name: '옷가게 사장님', hair: 'bob', hairC: '#8a3040', hairH: '#a84a5a', eyeC: '#4a3020', fem: true, outfits: { base: { coat: '#2b2f3a', coatS: '#1c1f28', shirt: '#2b2f3a', skirt: '#2b2f3a', pants: '#f7d4b5', shoes: '#e3484a', closed: true, collar: '#ffffff' } } },
  stylist: { name: '미용실 원장님', hair: 'wave', hairC: '#d9a84a', hairH: '#f0c870', eyeC: '#4a3020', fem: true, outfits: { base: { coat: '#f4f0ff', coatS: '#d9d0f0', shirt: '#f4f0ff', pants: '#3b3b48', shoes: '#2f2f2f', apron: '#8a6fc9', closed: true } } },
});
STAFF.in_clothes = [['tailor', 5.5, 1.5]];
STAFF.in_salon = [['stylist', 2.5, 1.5]];
STAFF_LINES.tailor = ['어서 오세요~ 오늘 들어온 원피스 예쁘죠?', '형사님도 가끔 오세요. 늘 같은 셔츠만 고르시지만. 호호.', '색 하나만 바꿔도 기분이 달라져요.'];
STAFF_LINES.stylist = ['어머, 머리결 좋다~ 오늘은 어떤 스타일?', '형사님 앞머리는 제가 잘라 드려요. 비밀인데, 엄청 신경 쓰세요.', '봄엔 밝은 색이 잘 어울려요!'];

/* ---------------- v4: 여성 주민 — 사람마다 성격과 말투 ---------------- */
const RIVAL_LINES = {
  doctor: { trait: '차분하고 걱정 많은 의사 · 건강 잔소리',
    before: ['오늘 물 많이 드셨어요? 해월도 햇볕은 생각보다 세요.', '형사님이요? 순찰을 너무 무리하셔서 걱정이에요. 파스를 몰래 주머니에 넣어 드렸어요.', '진료 끝나고 등대 쪽 산책하는 게 제 유일한 취미예요. 가끔 형사님도 마주쳐요.', '형사님은 커피를 너무 많이 마셔요. 하루 세 캔은 과해요… 말려도 안 들으시네요.', '섬에 오고 나서 처음으로 마음 편히 웃었어요. 사람들이 다정해서요.', '혹시 요즘 잠은 잘 자요? 눈 밑이 조금 어두워 보여서요.', '형사님 손에 상처가 있길래 소독해 드렸어요. "고마워요" 하고 웃으시더라고요.'],
    after: ['두 분 같이 다니시는 거 보면, 제가 처방한 어떤 약보다 효과가 좋아 보여요.', '형사님 요즘 건강 수치가 아주 좋아졌어요. 이유는… 알 것 같네요.', '행복도 전염된다더니, 두 분 보면 저까지 기분이 좋아져요.', '결혼하시면 건강검진은 제가 해 드릴게요. 약속이에요.'],
    chat: [['형사님, 어제 또 야근하셨죠? 눈이 빨개요.', '들켰네요. 선생님 앞에선 거짓말을 못 하겠어요.'], ['이거 비타민이에요. 하루에 한 알.', '하하, 처방까지. 감사합니다, 선생님.'], ['요즘 웃는 얼굴이 많아지셨어요. 좋은 일 있으세요?', '…그렇게 티 나요?'], ['산책은 혈압에도 좋아요. 같이 걸으니 좋네요.', '건강 상담 겸 순찰이네요.'], ['형사님은 아플 때 누가 챙겨 줘요?', '음… 요즘은 챙겨 주는 사람이 있는 것 같기도 해요.'], ['다음 주 보건 교육, 같이 해 주실 거죠?', '네, 안전 교육은 제가 맡을게요.']],
    intro: '어머, 안녕하세요. 형사님 혈압 얘기 하면서 걷는 중이었어요.', leave: '…두 분 얘기 나누세요. 저는 진료 시간이라 먼저 가 볼게요.',
    season: { summer: '더위 먹으면 바로 보건지소로 오세요.', autumn: '환절기라 감기 환자가 많아요. 따뜻하게 입어요.', winter: '손 시리면 핫팩 하나 드릴까요?', spring: '꽃가루 알레르기 있으면 말해 주세요.' } },
  teacher: { trait: '밝고 수다스러운 선생님 · 아이들 이야기',
    before: ['어머, 안녕하세요! 오늘 우리 반 애들이 형사님 그림을 그렸는데 완전 미남으로 그렸어요!', '형사님이 호루라기 불면 애들이 줄을 착착 서요. 비결 좀 배우고 싶어요~', '운동회 때 형사님이랑 2인 3각 나가기로 했어요! …아직 형사님은 모르시지만요. 호호.', '하늘이가 그러는데 형사님 이상형이 "잘 웃는 사람"이래요. 저 많이 웃는데!', '수업 끝나고 바닷가 가는 게 제 낙이에요. 조개 주우면 애들 줘요.', '혹시 동화책 추천해 줄 수 있어요? 애들이 형사 나오는 이야기를 좋아해서요.', '어제 급식에 귤이 나왔는데, 순찰 오신 형사님께 하나 드렸거든요. 엄청 좋아하시더라고요!'],
    after: ['우와, 두 분 사귀신다면서요! 애들이 벌써 축하 그림 그리고 있어요!', '하늘이가 결혼식에 화동 하고 싶대요. 꼭 시켜 주세요!', '부러워요~ 저도 해월도에서 운명 만날 수 있을까요?', '두 분 보면 동화책 주인공 같아요. 해피엔딩!'],
    chat: [['형사님! 애들이 형사님 보고 싶대요. 내일 교통 안전 교실 와 주세요!', '하하, 좋아요. 호루라기 챙겨 갈게요.'], ['어머, 형사님 오늘 옷 예쁘다!', '…그래요? 그냥 입은 건데.'], ['형사님은 어릴 때 꿈이 뭐였어요? 저는 선생님!', '음, 저는 등대지기요.'], ['노을 보면 왜 이렇게 설레죠? 형사님도 그래요?', '…요즘 좀 그래요. 이유는 다른 데 있지만.'], ['같이 운동회 준비해요! 줄다리기 밧줄 사러 가요!', '네, 무거운 건 제가 들게요.'], ['형사님 웃을 때 눈 휘는 거 애들이 따라 해요. 귀여워요!', '하하, 그건 좀 부끄럽네요.']],
    intro: '어머! 안녕하세요~ 형사님이랑 운동회 얘기하면서 걷고 있었어요!', leave: '아, 저 채점하러 가야 해요! 두 분 재밌게 놀아요~ 안녕!',
    season: { summer: '여름방학엔 애들이랑 바다 캠프 가요!', autumn: '운동회 준비로 목이 다 쉬었어요~', winter: '눈 오면 애들이랑 눈사람 만들 거예요!', spring: '새 학기라 정신없어요. 그래도 즐거워요!' } },
  traveler: { trait: '자유분방한 여행객 · 사진 · 친근한 반말',
    before: ['헐, 여기 진짜 인생샷 맛집이다! 같이 찍을래요?', '나 원래 사흘만 있으려 했는데 벌써 한 달째예요. 해월도 마법인가 봐.', '형사님 진짜 포토제닉해요. 몰래 찍은 사진 보여 줄까요? …비밀!', '내일은 무인도 갈 거예요. 혼자 가면 무서우려나? 형사님 시간 되시려나~', '여행하면서 만난 사람 중에 형사님이 제일 친절해요. 길을 다섯 번 물어봤는데 다섯 번 다 웃으면서 알려 줬어요.', '블로그에 해월도 썼는데 조회수 대박 났어요! 형사님 사진도 살짝 넣었는데… 괜찮겠죠?', 'Life is short, 귤은 많이! 이게 제 해월도 좌우명이에요.'],
    after: ['대박! 두 분 커플이에요? 커플 사진 찍어 줄게요. 프로필용으로!', '해월도 여행기 마지막 장은 두 분 이야기로 할래요. 완전 로맨스 영화야.', '나도 언젠가 이런 섬에서 이런 사랑 하고 싶다~', '두 분 결혼식 하면 꼭 불러 줘요. 비행기 타고서라도 올게요!'],
    chat: [['형사님, 여기서 사진 한 장만! 하나 둘 셋!', '하하, 저 사진 잘 못 찍혀요.'], ['형사님 추천 맛집 어디예요? 진짜 로컬로!', '횟집 이모님 물회요. 이건 진짜예요.'], ['나 여기 눌러살까 봐요. 형사님 생각은요?', '해월도는 오는 사람 안 막아요. 환영이에요.'], ['형사님은 여행 안 가고 싶어요?', '음… 요즘은 여기가 제일 좋아서요.'], ['오늘 노을 미쳤다! 같이 봐요, 같이!', '네, 여기서 보면 제일 예뻐요.'], ['혹시 여자친구 있어요? 그냥 궁금해서~', '…비밀이에요. 하하.']],
    intro: '오, 안녕! 나 형사님한테 섬 투어 받고 있었어요~', leave: '아 맞다, 나 배 시간! 먼저 갈게요, 바이바이~!',
    season: { summer: '여름 바다 색 미쳤어요. 필터 필요 없음!', autumn: '억새 사진 찍으러 오름 갔다 왔어요!', winter: '귤 따기 체험 완전 강추!', spring: '유채꽃은 보정 안 해도 노래요!' } },
  cafe: { trait: '새침한 츤데레 카페 사장 · 커피 장인',
    before: ['어서 오세요. …아, 손님 아니었어요? 흥, 그럼 커피 한 잔은 사 가요.', '형사님이요? 딱히 신경 쓰는 건 아닌데, 매일 같은 시간에 오니까 커피를 미리 내려 두는 것뿐이에요.', '라떼 아트 연습 중이에요. 하트가 자꾸 찌그러져요. …누구 줄 건 아니에요!', '해월도 원두는 바닷바람을 맞아서 맛이 달라요. 진짜로요.', '형사님이 "오늘도 맛있네요" 하고 가면 그날은 기분이 좋아요. …방금 그 말 잊어요.', '단골 할인은 없어요. 근데 웃는 손님한텐 쿠키 하나 더 줘요.', '비 오는 날엔 카페가 제일 좋아요. 빗소리랑 커피 향.'],
    after: ['…두 분 사귀는 거 다 알아요. 흥, 축하해요. 진심으로요.', '커플 메뉴 새로 만들었어요. 딱히 두 분 때문은 아니고요.', '형사님 요즘 커피에 설탕 넣어요. 연애하면 입맛도 달달해지나 봐요.', '결혼식 케이크는 제가 할게요. 거절하면 서운할 거예요.'],
    chat: [['형사님, 오늘 원두 새로 볶았어요. …딱히 형사님 주려고 한 건 아니고.', '하하, 그래도 제일 먼저 맛보는 영광이네요.'], ['또 캔커피 마셨죠? 카페 사장 앞에서.', '들켰다. 내일은 꼭 카페 갈게요.'], ['흥, 산책은 그냥 원두 배달 가는 길이에요.', '네네, 배달 동행해 드릴게요.'], ['형사님은 단 거 싫어하죠? …아니에요? 기억해 둘게요.', '요즘은 좀 좋아졌어요.'], ['쿠키 남았는데 하나 드실래요? 남은 거예요, 남은 거.', '감사히 받을게요. 남은 거.'], ['…형사님, 요즘 누구 생각하면서 웃죠?', '하하… 티 나요?']],
    intro: '…아, 안녕하세요. 원두 배달 가는 길에 형사님이랑 마주쳤을 뿐이에요. 그냥 그런 거예요.', leave: '흥, 저 바빠요. 카페 문 열어야 해서. …잘 가요.',
    season: { summer: '아이스 귤 라떼 개시했어요. 맛없으면 말해요.', autumn: '가을엔 시나몬이죠. 딱히 추천하는 건 아니에요.', winter: '따뜻한 귤 차 마셔요. 감기 걸리면 곤란하니까.', spring: '벚꽃 라떼… 핑크라서 좀 부끄럽지만 팔아요.' } },
  haenyeo: { trait: '씩씩하고 털털한 막내 해녀 · 제주 말투',
    before: ['혼저 옵서~ 오늘 바당 물 좋수다!', '형사님이 맨날 부두에서 제 물질을 지켜봐요. 안전 확인이래요. 고맙긴 한데 좀 민망하수다.', '전복 하나 줄까요? 오늘 제일 큰 거 땄어요!', '할망들한테 아직 막내라고 혼나요. 그래도 숨 참기는 제가 제일 오래 해요!', '형사님한테 해녀 노래 가르쳐 줬는데 음치예요. 하하!', '바당은 무섭지만 정직해요. 사람도 그랬으면 좋겠수다.', '물질 끝나고 할망들이랑 떡 먹는 게 최고 행복이에요.'],
    after: ['두 분 사귄다는 소문, 부두까지 다 퍼졌수다! 할망들이 난리예요.', '형사님 요즘 부두 순찰할 때 콧노래 불러요. 다 당신 덕이우다!', '결혼하면 제가 딴 제일 큰 전복으로 잔치해요!', '바당에 대고 두 분 행복하라고 빌었어요. 바당은 소원을 잘 들어줘요!'],
    chat: [['형사님! 오늘 소라 엄청 땄수다. 하나 드릴까?', '하하, 막내 해녀님 덕에 저녁 반찬 생겼네요.'], ['물살 셀 땐 저 혼자 안 들어가요. 걱정 마시라고요!', '그래도 걱정되는 건 어쩔 수 없어요.'], ['형사님은 수영 잘해요? 제가 가르쳐 줄까?', '…저 맥주병이에요. 비밀로 해 줘요.'], ['할망들이 형사님 장가 언제 가냐고 물어보래요!', '하하… 그건 저도 궁금하네요.'], ['바당 냄새 좋지요? 이게 해월도 냄새우다.', '네, 이제 이 냄새 없으면 못 살 것 같아요.'], ['해녀 노래 다시 불러 봐요. 이어도사나~', '이어도… 사나… 하하, 또 틀렸죠?']],
    intro: '혼저 옵서! 형사님이랑 바당 얘기하면서 걷고 있었수다!', leave: '저 물질 준비하러 가야 해요! 두 분 좋은 시간 보내수다~',
    season: { summer: '여름 바당은 미역이 최고우다!', autumn: '가을 소라가 제일 달아요!', winter: '겨울 물은 칼 같아요. 그래도 들어가요!', spring: '봄 물질 시작했수다. 잠수굿도 보러 와요!' } },
};

/* ---------------- v5: 초반부 대화 새로 쓰기 (1~2단계 · 직업별) ---------------- */
TALKS[1] = [
  { t: [['normal', '해월도 와서 제일 먼저 뭐가 눈에 들어왔어요?']],
    c: [['바다 색이요', 3, '역시. 해월도 바다는 사진보다 실물이 나아요. 저처럼.', 'tease'], ['형사님이요', 4, '…어, 그건 예상 못 한 대답인데요. 지금 귀 빨개졌죠, 저.', 'blush'], ['돌하르방이요', 2, '광장 두 분이요? 저보다 오래 근무하신 대선배님들이에요.', 'laugh']] },
  { t: [['serious', '혹시 이 섬에서 꼭 지켜야 하는 규칙 알아요?'], ['tease', '첫째, 할머니가 주는 귤은 무조건 받는다. 둘째, 노랑이한테 생선을 뺏기지 않는다.']],
    c: [['셋째는요?', 3, '셋째는… 길 잃으면 파출소 형사를 부른다. 이게 제일 중요해요.', 'smile'], ['노랑이가 누구예요?', 2, '광장 대장 고양이요. 냥펀치가 아주 매워요. 경험담이에요.', 'laugh'], ['외워 둘게요', 2, '시험은 없어요. 대신 제가 가끔 불시 점검할 거예요.', 'tease']] },
  { job: true },
  { t: [['normal', '저 원래 이 섬 사람 아니에요. 육지에서 발령받고 왔어요.'], ['smile', '처음엔 1년만 있으려 했는데, 벌써 몇 년째네요.']],
    c: [['왜 계속 있어요?', 3, '글쎄요. 노을 때문인가. 아니면… 그건 아직 비밀.', 'tease'], ['저도 그렇게 될까요?', 4, '아마도요. 해월도는 한번 붙잡으면 안 놔줘요. 저처럼.', 'smile'], ['육지가 그립진 않아요?', 2, '가끔요. 근데 여기 사람들이 그리워할 틈을 안 줘요.', 'normal']] },
];
TALKS[2] = [
  { t: [['tease', '오늘 파출소에 들어온 신고, 맞혀 볼래요?']],
    c: [['귤 도둑?', 3, '정답. 범인은 또 까마귀. 증거는 귤 껍질 세 개.', 'laugh'], ['고양이 실종?', 2, '노랑이는 실종이 아니라 낮잠 중이었어요. 슈퍼 지붕에서.', 'tease'], ['마음 도둑?', 4, '…그런 신고는 처리 방법을 모르는데. 혹시 피해자예요?', 'blush']] },
  { t: [['normal', '쉬는 날엔 뭐 해요?'], ['smile', '저는 부두에서 낚시하거나, 오름 올라가서 멍 때려요.']],
    c: [['같이 멍 때려요', 4, '좋아요. 아무 말 안 해도 어색하지 않은 사이, 해 보고 싶었어요.', 'smile'], ['낚시는 잘 잡혀요?', 2, '…잡는 게 목적이 아니에요. 라고 말해 두죠.', 'laugh'], ['저는 집에서 쉬어요', 1, '그것도 좋죠. 가끔은 섬 구경도 해요. 안내는 제가 할게요.', 'normal']] },
  { t: [['smile', '요즘 마을 사람들이 당신 얘기를 자주 해요.'], ['tease', '"새로 온 사람 참 싹싹하다"고요. 저도 동의했고요.']],
    c: [['형사님은 뭐라고 했어요?', 3, '"그쵸, 웃는 게 예뻐요." …라고 했나? 기억 안 나요.', 'blush'], ['부끄러워요', 2, '부끄러워하는 것도 소문날 거예요. 이 섬 좁거든요.', 'laugh'], ['좋은 말만 해 주세요', 2, '나쁜 말 할 게 없어서 걱정 안 해도 돼요.', 'smile']] },
  { t: [['normal', '저 어릴 때 꿈이 등대지기였어요.'], ['smile', '밤새 불 켜 놓고, 길 잃은 배를 집으로 보내 주는 사람.']],
    c: [['지금도 비슷하네요', 4, '…그러네요. 형사도 등대 같은 거네. 처음 알았어요.', 'surprise'], ['낭만 있다', 3, '낭만 빼면 시체예요, 저.', 'tease'], ['왜 포기했어요?', 2, '포기 안 했어요. 언젠가 등대지기 할아버지한테 배울 거예요.', 'smile']] },
];
Object.assign(JOB_TALK, {
  doctor: { t: [['tease', '손 다 나았어요. 선생님 덕분에 흉터도 안 남았어요.'], ['normal', '노랑이도 안부 전해 달래요. 아까 저한테 또 냥펀치 날렸지만.']],
    c: [['또 다치면 오세요', 3, '다칠 핑계 생겼다. …농담이에요, 조심할게요.', 'laugh'], ['노랑이랑 화해하세요', 2, '협상 중이에요. 참치 캔으로.', 'tease'], ['흉터 안 남아서 다행이에요', 3, '선생님 손이 좋아서 그래요.', 'smile']] },
  teacher: { t: [['laugh', '똘이 잘 있어요? 그날 이후로 저, 애들한테 "소라게 형사"라고 불려요.'], ['normal', '파출소 벽에 소라게 그림이 열두 장 붙었어요. 전교생 전부요.']],
    c: [['똘이 수사반장님!', 3, '…그 호칭 마음에 드네요. 명함 새로 팔까.', 'tease'], ['애들이 형사님 좋아해요', 3, '선생님 반 아이들이라 그래요. 담임 닮아서 착해요.', 'smile'], ['모자 검사는 하셨어요?', 2, '매일 아침 확인해요. 트라우마 생겼어요.', 'laugh']] },
  traveler: { t: [['smile', '그날 찍은 사진, 잘 나왔어요?'], ['tease', '저 사진 잘 안 받는데. 궁금해서 잠이 안 왔어요. …거짓말이에요.']],
    c: [['인생샷이에요', 3, '그럼 파출소 게시판에 붙여도 되죠? 홍보용으로.', 'laugh'], ['보여 줄까요?', 4, '…오, 생각보다 괜찮네. 찍은 사람이 잘 찍어서 그래요.', 'blush'], ['비밀이에요', 2, '수사권 발동할까 보다.', 'tease']] },
  cafe: { t: [['normal', '머신은 오늘도 잘 돌아가요?'], ['tease', '안 되면 불러요. 출장 수리 기사 대기 중이에요.']],
    c: [['오늘은 멀쩡해요', 2, '아쉽다. 들를 핑계가 없어졌네.', 'tease'], ['일부러 고장 낼까요?', 4, '…그건 범죄예요. 근데 신고는 안 할게요.', 'laugh'], ['커피 한 잔 하실래요?', 3, '늘 마시던 걸로. 이 말 꼭 해 보고 싶었어요.', 'smile']] },
  haenyeo: { t: [['sad', '신발… 결국 못 찾았어요. 바다가 가져갔어요.'], ['tease', '그래서 새로 샀는데, 이번엔 물에 뜨는 걸로 샀어요.']],
    c: [['제가 찾아 줄게요', 4, '진짜요? 그럼 그 신발은 평생 가보로 할게요.', 'blush'], ['물에 뜨는 신발이요?', 2, '다음에 또 뛰어들 일 생기면 대비해야죠.', 'laugh'], ['이제 안 뛰어들 거죠?', 3, '…약속은 못 해요. 당신이 3분 넘게 안 나오면.', 'serious']] },
});
SMALLTALK[1] = ['해월도 바람, 적응됐어요? 처음엔 다들 모자를 날려요.', '모르는 거 있으면 물어봐요. 섬 소문까지 다 알려 줄게요.', '오늘 돌하르방 선배님들한테 인사했어요? 그게 예의예요.', '길 잃으면 바다 보이는 쪽으로 걸어요. 결국 다 이어져요.'];
SMALLTALK[2] = ['또 만났네요. 이쯤 되면 우연이 아닌데.', '오늘 마을버스 기사님이 노래를 불러요. 타 보면 알아요.', '아까 슈퍼에서 당신 좋아하는 거 봤어요. 뭔지는 비밀.', '노랑이가 오늘 당신 찾던데요. 저 말고 당신.'];
GREETS.morning[1] = ['좋은 아침이에요. 해월도 아침 공기는 공짜예요, 많이 마셔요.']; GREETS.day[1] = ['안녕하세요. 순찰 중인데, 마침 반가운 얼굴이네요.']; GREETS.evening[1] = ['저녁이네요. 노을 보러 가는 길이에요?'];
GREETS.morning[2] = ['좋은 아침! 오늘도 일찍 나왔네요.']; GREETS.day[2] = ['어, 안녕하세요! 점심은 먹었어요? 안 먹었으면 카페 가요.']; GREETS.evening[2] = ['퇴근했어요? 저도요. 타이밍 좋다.'];
IDLE[1] = ['저기 보이는 게 해월 오름이에요.', '천천히 걸어요. 저 안 바빠요. …아마도.', '길은 제가 다 알아요. 지름길도요.'];
IDLE[2] = ['같이 걸으니까 순찰도 금방이네요.', '아, 노랑이 또 왔다. 동네 대장이에요.', '배고프지 않아요? 횟집 이모님이 오늘 물회 개시했대요.'];
