// 직업 4종 · 아이템 · 상점
'use strict';
(() => {
  PX.JOBS = {
    medic: { ko: '606부대 군의관', short: '군의관', team: '의무팀', rank: '대위', military: true, work: 'med', workSpot: 'med.work', home: 'q_player',
      top: '#e9eef2', coat: '#ffffff', bottom: '#4a5a6a', color: '#d64545', mini: 'treat', pay: 140,
      desc: '의무동에서 환자를 진찰하고 상처를 치료한다. 수색팀 복귀자 검진도 맡는다.' },
    scout: { ko: '수색팀 소위', short: '수색팀 소위', team: '수색팀', rank: '소위', military: true, work: 'ops', workSpot: 'ops.work', home: 'q_player',
      top: '#5a6b45', bottom: '#4a5240', color: '#c9a227', mini: 'drone', pay: 120,
      desc: '외곽 순찰, 드론 정찰, 흔적 조사. 대위가 직속 상관이다.' },
    engineer: { ko: '기술정비팀 중위', short: '정비팀 중위', team: '기술정비팀', rank: '중위', military: true, work: 'hangar', workSpot: 'hg.work', home: 'q_player',
      top: '#3d5a7a', bottom: '#34506e', color: '#e8c56a', mini: 'circuit', pay: 130,
      desc: '드론 수리, 방호복 정비, 차량 점검, 외계 광물 부품 분석.' },
    researcher: { ko: '민간 생태연구원', short: '생태연구원', team: '돔시티 생태연구소', rank: '민간인', military: false, work: 'lab', workSpot: 'lab.work', home: 'apt_player',
      top: '#7fc8b4', coat: '#ffffff', bottom: '#3a4a5a', color: '#3fb08a', mini: 'sort', pay: 125,
      desc: '외계식물 관찰, 유리꽃 연구, 검역 표본 분석. 돔시티에 살며 부대 출입엔 허가증이 필요하다.' },
  };

  // 아이템: cat food/gift/furn/key, energy 회복, price, capLike: 대위 반응(2 아주 좋아함, 1 좋아함, 0 보통, -1 별로)
  const I = {};
  const it = (id, o) => (I[id] = Object.assign({ id, cat: 'gift', price: 0, capLike: 0 }, o));
  it('coffee', { name: '지구식 아이스커피', cat: 'food', price: 12, energy: 15, capLike: 1, icon: '☕', desc: '얼음 가득. 잠이 깬다.' });
  it('hotchoco', { name: '따뜻한 코코아', cat: 'food', price: 12, energy: 12, capLike: -1, icon: '🍫', desc: '추운 날엔 최고. 대위는 더워한다.' });
  it('protein', { name: '단백질 바', cat: 'food', price: 8, energy: 10, capLike: 1, icon: '🍫', desc: '제4행성식 고단백 가공식.' });
  it('ramen', { name: '컵라면', cat: 'food', price: 10, energy: 20, capLike: 1, icon: '🍜', desc: '지구식 메뉴. 보급 상황에 따라 품절.' });
  it('samgyup', { name: '냉삼 도시락', cat: 'food', price: 28, energy: 30, capLike: 2, icon: '🥓', desc: '냉동 삼겹살 + 즉석밥. 대위의 최애.' });
  it('fruitTea', { name: '향열매 차', cat: 'food', price: 14, energy: 12, capLike: 0, icon: '🍹', desc: '페르녹스 향열매로 우린 차갑고 향긋한 차.' });
  it('iceDessert', { name: '제6행성 얼음 디저트', cat: 'food', price: 22, energy: 14, capLike: 2, icon: '🍧', desc: '입에 넣으면 머리가 띵할 만큼 차갑다.' });
  it('earthSnack', { name: '지구산 과자', cat: 'food', price: 16, energy: 8, capLike: 1, icon: '🍪', desc: '보급선이 오면 금방 동난다.' });
  it('mineral', { name: '외계 광물 조각', price: 40, capLike: 2, icon: '💎', desc: '빛을 머금는 광물. 장비 개조 재료로도 쓴다.' });
  it('toolkit', { name: '정밀 공구 세트', price: 70, capLike: 2, icon: '🔧', desc: '손재주 좋은 사람에게 딱.' });
  it('glassflower', { name: '유리꽃 모조 장식', price: 45, capLike: 1, icon: '🌸', desc: '투명한 꽃잎이 빛을 받아 반짝인다.' });
  it('handfan', { name: '휴대용 냉각 선풍기', price: 35, capLike: 2, icon: '🌀', desc: '더위 타는 사람에게 최고의 선물.' });
  it('hotpack', { name: '핫팩', price: 6, capLike: -1, icon: '🔥', desc: '추위 타는 사람용. 대위에겐… 글쎄.' });
  it('patch', { name: '수제 부대 패치', price: 25, capLike: 1, icon: '🎖️', desc: '606 마크를 수놓은 패치.' });
  it('book', { name: '페르녹스 생태도감 (보급판)', price: 30, capLike: 0, icon: '📗', desc: '외계 생물 그림이 가득하다.' });
  it('rubyrose', { name: '루비 장미', price: 8, capLike: 1, icon: '🌹', desc: '루비웨이 노점의 붉은 장미 한 송이.' });
  it('rosebunch', { name: '루비 장미 다발', price: 30, capLike: 1, icon: '💐', desc: '네온 아래서 더 붉게 보이는 장미 다발.' });
  it('ring', { name: '은하 결정 반지', price: 320, capLike: 2, icon: '💍', desc: '제4행성 광물을 깎아 만든 반지. 마음을 전할 때.' });
  it('perfume', { name: '향열매 향수', price: 55, capLike: 1, icon: '🧴', desc: '은은하고 시원한 향.' });
  it('pass', { name: '606부대 출입 허가증', cat: 'key', price: 0, icon: '🪪', desc: '민간인이 부대 시설에 들어갈 때 필요하다.' });
  it('capStone', { name: '대위가 주운 이상한 돌', cat: 'gift', price: 0, capLike: 0, icon: '🪨', desc: '"네가 좋아할 것 같아서." 반짝이는 줄무늬가 있다.', noGift: true });
  it('capSnack', { name: '대위가 사 온 간식', cat: 'food', price: 0, energy: 15, capLike: 0, icon: '🧁', desc: '"너 이거 좋아하잖아."', noGift: true });
  it('bunny', { name: '토끼 인형', cat: 'gift', furn: 'bunnyplush', price: 0, capLike: 1, icon: '🐰', desc: '오락실 인형 뽑기 경품. 숙소에 놓을 수도 있다.' });
  it('bouquet', { name: '유리꽃 꽃다발', price: 38, capLike: 1, icon: '💐', desc: '빛을 머금은 투명한 꽃잎.' });
  it('skewer', { name: '행성권 꼬치', cat: 'food', price: 9, energy: 14, capLike: 2, icon: '🍢', desc: '축제·야시장 매대 인기 메뉴.' });
  it('fruitIce', { name: '향열매 빙수', cat: 'food', price: 15, energy: 12, capLike: 2, icon: '🍧', desc: '얼음 산 위에 향열매 시럽.' });
  it('samgyupMeal', { name: '냉삼 한 판 (포장)', cat: 'food', price: 24, energy: 30, capLike: 2, icon: '🥓', desc: '문성호네 냉삼. 대위의 최애.' });
  it('fish', { name: '물고기', cat: 'food', price: 0, energy: 6, capLike: 0, icon: '🐟', desc: '인공호수에서 낚았다. 구우면 더 맛있다.' });
  it('grilledFish', { name: '구운 생선', cat: 'food', price: 0, energy: 25, capLike: 2, icon: '🍢', desc: '캠프파이어에 구웠다. 대위가 좋아할 것 같다.' });
  it('rawfruit', { name: '갓 딴 향열매', cat: 'food', price: 0, energy: 10, capLike: 1, icon: '🍊', desc: '농업돔에서 직접 딴 향열매.' });
  it('chitin', { name: '외계 갑각 잔해', price: 0, capLike: 2, icon: '🦂', desc: '외곽에서 회수한 외골격 조각. 대위의 장비 재료.' });
  it('seafood', { name: '제3행성 해산물 꼬치', cat: 'food', price: 18, energy: 22, capLike: 2, icon: '🦐', desc: '해양도시 명물.' });
  it('smoked', { name: '냉훈제 생선', cat: 'food', price: 20, energy: 24, capLike: 2, icon: '🐟', desc: '제6행성 냉훈제거리의 별미.' });
  it('mineralSalt', { name: '광물염', price: 15, capLike: 1, icon: '🧂', desc: '제4행성 광물염 조미료. 요리 좋아하는 사람에게.' });
  it('souvenir', { name: '돔시티 스노볼', price: 25, capLike: 1, icon: '🔮', desc: '흔들면 은빛 가루가 흩날린다.' });
  it('festivalBadge', { name: '축제 기념 배지', price: 20, capLike: 0, icon: '🎗️', desc: '돔시티 행사 기념품.' });
  // 가구 아이템 (상점 구매 → 숙소 배치)
  for (const fid of ['plant', 'bigplant', 'lamp', 'rug', 'rug_blue', 'sidetable', 'cabinet', 'chair', 'stool', 'sofa', 'sofa_green', 'table', 'desk', 'shelf', 'mirror', 'cafetable', 'aquarium', 'cooler', 'tv', 'bed', 'bigbed', 'wardrobe', 'fridge', 'kitchen', 'glassvase']) {
    const f = PX.FURN[fid];
    it('f_' + fid, { name: f.name, cat: 'furn', furn: fid, price: f.price || 100, icon: '🪑', desc: `숙소에 놓을 수 있는 가구 (${f.w}×${f.d})` });
  }
  PX.ITEMS = I;
  // 생태도감: 직업 업무·살펴보기로 채워진다
  PX.CODEX = [
    { id: 'glassflower', n: '유리꽃', t: '식물', d: '꽃잎이 유리처럼 투명하다. 빛을 받으면 무지갯빛으로 반짝인다. 투명한 이유는 아직 밝혀지지 않았다.', how: '검역 분류 · 꽃시장 화단' },
    { id: 'glowgrass', n: '발광초', t: '식물', d: '밤이 되면 청록색으로 빛나는 풀. 봄과 10월에 가장 밝다.', how: '발광초 화단 살펴보기 · 검역 분류' },
    { id: 'silvermoss', n: '은빛 이끼', t: '식물', d: '은사막 바위틈에 자라는 이끼. 손으로 누르면 잠깐 빛난다.', how: '검역 분류' },
    { id: 'fruit', n: '향열매', t: '식물', d: '농업돔에서 키우는 열매. 상큼하고 시원한 향. 차와 빙수로 인기.', how: '검역 분류 · 향열매 디저트 맛보기' },
    { id: 'root', n: '페르녹스 뿌리채소', t: '식물', d: '보랏빛 껍질의 뿌리채소. 튀김과 카레로 많이 먹는다.', how: '검역 분류' },
    { id: 'redspore', n: '붉은 포자버섯', t: '식물 (위험)', d: '포자에 약한 독성이 있다. 격리 보관 대상.', how: '검역 분류' },
    { id: 'tentvine', n: '가시 촉수 덩굴', t: '식물 (위험)', d: '움직이는 것에 반응해 가시를 세운다. 외곽 폐쇄구역에서 발견.', how: '검역 분류' },
    { id: 'acidflower', n: '산성 점액 꽃', t: '식물 (위험)', d: '꽃잎에서 산성 점액이 흐른다. 장갑 필수.', how: '검역 분류' },
    { id: 'crystaltree', n: '수정잎 나무', t: '식물', d: '잎이 결정처럼 각진 나무. 부대와 돔시티 곳곳에 심어져 있다. 계절마다 색이 바뀐다.', how: '발광초 화단 살펴보기' },
    { id: 'lizard', n: '붉은모래 도마뱀', t: '생명체 (무해)', d: '사막 모래에 녹아드는 몸 색. 사람을 보면 모래 속으로 숨는다.', how: '드론 정찰에서 흔적 기록' },
    { id: 'trace', n: '대형 생명체 발자국', t: '생명체 (경계)', d: '세 갈래 발톱 자국. 외곽 수색팀이 꾸준히 추적 중.', how: '드론 정찰에서 흔적 기록' },
    { id: 'drifter', n: '부유 해파리체', t: '생명체 (무해)', d: '저기압 날이면 공중에 떠다니는 반투명 생명체. 발광포자 바람과 함께 나타난다.', how: '배양조 살펴보기' },
    { id: 'chitin', n: '외계 갑각 잔해', t: '잔해', d: '오래전 전투에서 남은 외골격 조각. 대위가 장비 재료로 쓴다.', how: '대위 막사 작업대 · 정비 근무' },
    { id: 'mineral', n: '발광 광물', t: '광물', d: '빛을 머금었다가 천천히 내뿜는 광물. 제4행성 광물등축제의 재료.', how: '외계 광물 조각 얻기 · 정비 근무' },
    { id: 'aquafish', n: '외계어', t: '생명체 (무해)', d: '수조에서 키우는 작은 외계 물고기. 지느러미가 네 개.', how: '외계어 수조 살펴보기 · 투명수로 정원' },
    { id: 'holofish', n: '입체영상 물고기', t: '홀로그램', d: '투명수로 정원 바닥 아래를 헤엄치는 영상. 밤 19~23시에만 보인다.', how: '밤에 투명수로 정원 방문' },
  ];

  PX.SHOPS = {
    px: { name: '보급창고 PX', clerk: 'song', items: ['coffee', 'hotchoco', 'protein', 'ramen', 'samgyup', 'earthSnack', 'iceDessert', 'handfan', 'hotpack', 'toolkit', 'patch', 'mineral', 'f_plant', 'f_bigplant', 'f_lamp', 'f_rug', 'f_rug_blue', 'f_sidetable', 'f_cabinet', 'f_chair', 'f_stool', 'f_sofa', 'f_sofa_green', 'f_table', 'f_desk', 'f_shelf', 'f_mirror', 'f_cooler', 'f_tv', 'f_aquarium', 'f_bigbed', 'f_wardrobe'] },
    cafe: { name: '향열매 카페', clerk: 'shin', items: ['coffee', 'fruitTea', 'iceDessert', 'hotchoco', 'earthSnack', 'glassflower', 'perfume', 'book', 'f_cafetable', 'f_plant'] },
    samgyup: { name: '냉삼집 포장 코너', clerk: 'moon', items: ['samgyupMeal', 'ramen', 'coffee'] },
    flower: { name: '유리돔 꽃시장', clerk: 'go', items: ['bouquet', 'glassflower', 'perfume', 'ring', 'f_glassvase', 'f_plant', 'f_bigplant'] },
    arcade: { name: '오락실 카운터', items: ['earthSnack', 'iceDessert', 'coffee'] },
    festival: { name: '축제 · 야시장 매대', items: ['skewer', 'fruitIce', 'earthSnack', 'iceDessert', 'festivalBadge', 'glassflower'] },
    farm: { name: '농업돔 매대', items: ['fruitTea', 'rawfruit', 'fruitIce', 'f_plant'] },
    souvenir: { name: '관람언덕 기념품 매대', items: ['souvenir', 'glassflower', 'coffee', 'iceDessert'] },
    beach: { name: '해변 매점', items: ['fruitIce', 'iceDessert', 'coffee', 'skewer'] },
    seafood: { name: '해양도시 매대', items: ['seafood', 'iceDessert', 'souvenir'] },
    mineral: { name: '광물도시 매대', items: ['mineral', 'mineralSalt', 'ring', 'protein', 'souvenir'] },
    smoked: { name: '냉훈제거리', items: ['smoked', 'hotchoco', 'iceDessert', 'souvenir'] },
    vending: { name: '자판기', items: ['coffee', 'hotchoco', 'protein', 'earthSnack'] },
  };
})();
