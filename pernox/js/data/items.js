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
  it('perfume', { name: '향열매 향수', price: 55, capLike: 1, icon: '🧴', desc: '은은하고 시원한 향.' });
  it('pass', { name: '606부대 출입 허가증', cat: 'key', price: 0, icon: '🪪', desc: '민간인이 부대 시설에 들어갈 때 필요하다.' });
  it('capStone', { name: '대위가 주운 이상한 돌', cat: 'gift', price: 0, capLike: 0, icon: '🪨', desc: '"네가 좋아할 것 같아서." 반짝이는 줄무늬가 있다.', noGift: true });
  it('capSnack', { name: '대위가 사 온 간식', cat: 'food', price: 0, energy: 15, capLike: 0, icon: '🧁', desc: '"너 이거 좋아하잖아."', noGift: true });
  // 가구 아이템 (상점 구매 → 숙소 배치)
  for (const fid of ['plant', 'bigplant', 'lamp', 'rug', 'rug_blue', 'sidetable', 'cabinet', 'chair', 'stool', 'sofa', 'sofa_green', 'table', 'desk', 'shelf', 'mirror', 'cafetable', 'aquarium', 'cooler', 'tv', 'bed', 'bigbed', 'wardrobe', 'fridge', 'kitchen']) {
    const f = PX.FURN[fid];
    it('f_' + fid, { name: f.name, cat: 'furn', furn: fid, price: f.price || 100, icon: '🪑', desc: `숙소에 놓을 수 있는 가구 (${f.w}×${f.d})` });
  }
  PX.ITEMS = I;

  PX.SHOPS = {
    px: { name: '보급창고 PX', clerk: 'song', items: ['coffee', 'hotchoco', 'protein', 'ramen', 'samgyup', 'earthSnack', 'iceDessert', 'handfan', 'hotpack', 'toolkit', 'patch', 'mineral', 'f_plant', 'f_bigplant', 'f_lamp', 'f_rug', 'f_rug_blue', 'f_sidetable', 'f_cabinet', 'f_chair', 'f_stool', 'f_sofa', 'f_sofa_green', 'f_table', 'f_desk', 'f_shelf', 'f_mirror', 'f_cooler', 'f_tv', 'f_aquarium', 'f_bigbed', 'f_wardrobe'] },
    cafe: { name: '향열매 카페', clerk: 'shin', items: ['coffee', 'fruitTea', 'iceDessert', 'hotchoco', 'earthSnack', 'glassflower', 'perfume', 'book', 'f_cafetable', 'f_plant'] },
    vending: { name: '자판기', items: ['coffee', 'hotchoco', 'protein', 'earthSnack'] },
  };
})();
