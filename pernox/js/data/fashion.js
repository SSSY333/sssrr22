// 옷 · 가구 · 미용실 카탈로그
//  - 옷: 궤도 부티크에서 사서 옷장에서 갈아입는다 (모든 옷은 실제 캐릭터 모습으로 미리 보기)
//  - 가구: 별빛 가구점(돔시티) · PX에서 사서 숙소에 놓는다 (실제 가구 그림으로 미리 보기)
//  - 머리: 은하 헤어(미용실)에서 모양 · 색을 바꾼다
'use strict';
(() => {
  // ---------------- 옷 ----------------
  // top/bottom/shoe: 색 · sleeve: long/short/none · skirt(짧은 치마) · dress(무릎 아래) · stripe/trim/scarf/vest/coat/hat: 포인트 색
  const O = (ko, price, o) => Object.assign({ ko, price, sleeve: 'long', shoe: '#3a3340' }, o);
  const NEW = {
    // 데일리
    knit_cream: O('크림 꽈배기 니트 · 청바지', 120, { top: '#f2e8d5', bottom: '#4a6a9a', shoe: '#f4efe4', trim: '#e0d2b6' }),
    stripe_tee: O('줄무늬 티 · 면바지', 80, { top: '#f4f6f8', stripe: '#3b5fa8', bottom: '#c9b48a', shoe: '#f4efe4', sleeve: 'short' }),
    mint_cardigan: O('민트 가디건 · 플리츠 치마', 140, { top: '#a8e0cc', vest: '#f4f6f8', bottom: '#5a6a8a', skirt: true, shoe: '#5a3f2a' }),
    denim_jacket: O('데님 재킷 · 흰 티', 160, { top: '#f4f6f8', coat: '#4a6a9a', bottom: '#2f3a4a', shoe: '#e9eef2' }),
    navy_sweat: O('네이비 맨투맨 · 조거', 90, { top: '#2f3f66', bottom: '#5a5f6a', shoe: '#e9eef2', trim: '#f4f6f8' }),
    lilac_hood: O('라일락 후드 · 트레이닝', 110, { top: '#c9b0e8', bottom: '#4a4560', shoe: '#f4efe4', hood: true }),
    check_shirt: O('체크 셔츠 · 청바지', 100, { top: '#b8543a', stripe: '#6b2a20', bottom: '#4a6a9a', shoe: '#5a3f2a' }),
    sky_blouse: O('하늘 블라우스 · 롱스커트', 150, { top: '#cfe6f7', bottom: '#f4efe4', dress: true, shoe: '#e6d6c8', trim: '#ffffff' }),
    yellow_knit: O('노란 니트 조끼 · 셔츠', 130, { top: '#f4f6f8', vest: '#f2c94c', bottom: '#4a4a52', shoe: '#5a3f2a' }),
    black_casual: O('올블랙 캐주얼', 120, { top: '#25232b', bottom: '#1f1c22', shoe: '#1f1c22', trim: '#4a4555' }),
    // 원피스 · 데이트
    rose_dress: O('장미빛 원피스', 220, { top: '#d9566f', bottom: '#d9566f', dress: true, shoe: '#f4efe4', sleeve: 'short', trim: '#ffd1dc' }),
    white_dress: O('하얀 여름 원피스', 210, { top: '#fbfaf6', bottom: '#fbfaf6', dress: true, shoe: '#e6d6c8', sleeve: 'none', trim: '#e8d9b8' }),
    navy_dress: O('네이비 셔츠 원피스', 200, { top: '#2f3f66', bottom: '#2f3f66', dress: true, shoe: '#5a3f2a', trim: '#f4f6f8' }),
    floral_dress: O('유리꽃 무늬 원피스', 240, { top: '#ffe0ec', stripe: '#ff9ed2', bottom: '#ffe0ec', dress: true, shoe: '#f4efe4', sleeve: 'short' }),
    lavender_dress: O('라벤더 쉬폰 원피스', 230, { top: '#c9b0e8', bottom: '#b89ae0', dress: true, shoe: '#f4efe4', sleeve: 'short', trim: '#efe6ff' }),
    star_dress: O('은하 드레스', 380, { top: '#1f2346', stripe: '#3a3f7a', bottom: '#1f2346', dress: true, shoe: '#c9ccd6', sleeve: 'none', trim: '#e8c56a' }),
    red_slip: O('붉은 슬립 드레스', 320, { top: '#a8243a', bottom: '#a8243a', dress: true, shoe: '#1f1c22', sleeve: 'none' }),
    // 셔츠 · 정장
    suit_black: O('검정 슈트', 350, { top: '#f4f6f8', coat: '#25232b', bottom: '#25232b', shoe: '#1f1c22', trim: '#25232b' }),
    suit_beige: O('베이지 셋업', 330, { top: '#f4efe4', coat: '#c9b48a', bottom: '#c9b48a', shoe: '#5a3f2a' }),
    trench: O('트렌치코트', 290, { top: '#f4efe4', coat: '#c9a86a', bottom: '#3a3f4a', shoe: '#5a3f2a', trim: '#a8865a' }),
    blouse_slacks: O('리본 블라우스 · 슬랙스', 180, { top: '#fbfaf6', scarf: '#d9566f', bottom: '#3a3f4a', shoe: '#1f1c22' }),
    // 계절
    puffer: O('하얀 패딩 · 니트', 300, { top: '#eef2f5', bottom: '#4a4a52', shoe: '#c9b48a', trim: '#cfd8de' }),
    muffler_coat: O('카멜 코트 · 머플러', 320, { top: '#f2e8d5', coat: '#a8754a', scarf: '#b8243a', bottom: '#3a3f4a', shoe: '#5a3f2a' }),
    winter_knit: O('눈꽃 스웨터', 160, { top: '#b8243a', stripe: '#f4f6f8', bottom: '#3a3f4a', shoe: '#5a3f2a' }),
    summer_set: O('린넨 반팔 · 반바지', 110, { top: '#f2e8d5', bottom: '#c9b48a', shoe: '#e6d6c8', sleeve: 'short' }),
    beach_shirt: O('하와이안 셔츠', 120, { top: '#3ab0c9', stripe: '#ffd166', bottom: '#f4efe4', shoe: '#e6d6c8', sleeve: 'short' }),
    tank_shorts: O('나시 · 숏팬츠', 90, { top: '#f4f6f8', bottom: '#4a6a9a', shoe: '#f4efe4', sleeve: 'none' }),
    // SF · 행성 스타일
    pilot_suit: O('항로 조종사 점프슈트', 260, { top: '#e8eef4', bottom: '#e8eef4', shoe: '#3a4450', trim: '#ff8a3d', vest: '#5fa8ff' }),
    nebula_hood: O('성운 그라데이션 후드', 200, { top: '#6a4ab0', stripe: '#9f7fe0', bottom: '#2a2346', shoe: '#e9eef2', hood: true }),
    silver_jacket: O('은빛 보머 재킷', 280, { top: '#25232b', coat: '#c9ccd6', bottom: '#2f3a4a', shoe: '#e9eef2' }),
    glow_tee: O('발광 실 티셔츠', 140, { top: '#1f2a3a', stripe: '#7fe3ff', bottom: '#2f3a4a', shoe: '#e9eef2', sleeve: 'short' }),
    researcher_coat: O('연구원 롱가운 스타일', 210, { top: '#cfe6f7', coat: '#fbfaf6', bottom: '#3a3f4a', shoe: '#e6d6c8' }),
    crystal_dress: O('광물빛 원피스', 360, { top: '#7fd3d0', stripe: '#bff5f0', bottom: '#5ab8b4', dress: true, shoe: '#f4efe4', sleeve: 'short' }),
    // 잠옷 · 집
    pajama_pink: O('분홍 잠옷', 90, { top: '#ffc9da', stripe: '#ffe8ef', bottom: '#ffc9da', shoe: '#ffffff' }),
    pajama_navy: O('네이비 체크 잠옷', 90, { top: '#2f3f66', stripe: '#5a6a9a', bottom: '#2f3f66', shoe: '#ffffff' }),
    homewear: O('니트 홈웨어 세트', 100, { top: '#e6d6c8', bottom: '#e6d6c8', shoe: '#f4efe4', trim: '#c9b49a' }),
    oversized_shirt: O('대위 셔츠 같은 오버핏 셔츠', 130, { top: '#6b7a5a', bottom: '#2a2f22', shoe: '#ffffff', trim: '#4f5a3d' }),
  };
  Object.assign(PX.S.OUTFITS, NEW);
  // 온천 · 스파 탈의실 전용 (사지 않음)
  PX.S.OUTFITS.bathrobe = O('온천 가운', 0, { top: '#f4f1ea', bottom: '#f4f1ea', robe: '#7fb3c9', shoe: '#e6d6c8', sleeve: 'short', noSale: true });
  PX.FASHION = { outfits: Object.keys(NEW) };

  // ---------------- 가구 (숙소용 새 가구) ----------------
  const P = (x, y, z, w, d, h, c, o) => [x, y, z, w, d, h, c, o];
  const legs4 = (w, d, h, c, i = 0.08, s = 0.1) => [P(i, i, 0, s, s, h, c), P(w - i - s, i, 0, s, s, h, c), P(i, d - i - s, 0, s, s, h, c), P(w - i - s, d - i - s, 0, s, s, h, c)];
  const def = (id, o) => { PX.FURN[id] = Object.assign({ id, w: 1, d: 1, parts: [], det: [], blocks: true, use: null, seats: null, cat: 'home' }, o); };
  def('armchair', { name: '패브릭 안락의자', price: 220, use: 'sit', seats: [[0.5, 0.55, 0, 8]], parts: [P(0.1, 0.15, 0, 0.8, 0.75, 8, '#d9a87a'), P(0.1, 0.1, 8, 0.8, 0.2, 12, '#c4915f'), P(0.05, 0.15, 8, 0.15, 0.75, 6, '#c4915f'), P(0.8, 0.15, 8, 0.15, 0.75, 6, '#c4915f')] });
  def('beanbag', { name: '빈백 소파', price: 150, use: 'sit', seats: [[0.5, 0.5, 0, 5]], parts: [P(0.1, 0.1, 0, 0.8, 0.8, 6, '#e07a5f'), P(0.15, 0.1, 6, 0.7, 0.3, 5, '#d0694f')] });
  def('lowtable', { name: '원목 좌식 테이블', w: 2, price: 140, parts: [...legs4(2, 1, 6, '#8a5a3c', 0.12), P(0, 0.05, 6, 2, 0.9, 2, '#c49a6c'), P(0.6, 0.3, 8, 0.3, 0.3, 3, '#f4efe4')] });
  def('cushion', { name: '방석', price: 30, blocks: false, use: 'sit', seats: [[0.5, 0.5, 0, 3]], parts: [P(0.15, 0.15, 0, 0.7, 0.7, 3, '#ff9ed2'), P(0.45, 0.45, 3, 0.1, 0.1, 1, '#e05a7a')] });
  def('starlamp', { name: '별 무드 조명', price: 120, parts: [P(0.35, 0.35, 0, 0.3, 0.3, 4, '#3a3f4a'), P(0.25, 0.25, 4, 0.5, 0.5, 9, '#fff3b0', { a: 1 }), P(0.4, 0.4, 13, 0.2, 0.2, 3, '#ffd166')], light: { r: 2.4, c: '#ffe9a8', z: 10, night: true } });
  def('globe', { name: '행성 지구본', price: 160, parts: [P(0.4, 0.4, 0, 0.2, 0.2, 8, '#8a6a3a'), P(0.22, 0.22, 8, 0.56, 0.56, 12, '#4a8fd0'), P(0.3, 0.3, 12, 0.3, 0.2, 4, '#5fb06a'), P(0.55, 0.5, 15, 0.2, 0.2, 3, '#5fb06a')] });
  def('teddy', { name: '곰 인형', price: 70, blocks: false, parts: [P(0.25, 0.3, 0, 0.5, 0.4, 8, '#b8865a'), P(0.3, 0.32, 8, 0.4, 0.35, 7, '#c4935f'), P(0.28, 0.32, 14, 0.12, 0.12, 3, '#a8754a'), P(0.6, 0.32, 14, 0.12, 0.12, 3, '#a8754a')] });
  def('cactus', { name: '외계 선인장', price: 60, parts: [P(0.3, 0.3, 0, 0.4, 0.4, 6, '#c9654a'), P(0.4, 0.4, 6, 0.2, 0.2, 14, '#5fb06a'), P(0.25, 0.42, 11, 0.15, 0.15, 6, '#5fb06a'), P(0.45, 0.42, 20, 0.12, 0.12, 2, '#ff9ed2')] });
  def('terrarium', { name: '발광 이끼 테라리움', price: 130, parts: [P(0.2, 0.2, 0, 0.6, 0.6, 2, '#5a4a3a'), P(0.2, 0.2, 2, 0.6, 0.6, 10, '#cfe8f2', { a: 1 }), P(0.3, 0.3, 2, 0.4, 0.4, 4, '#7fe3a0')], light: { r: 1.4, c: '#9ff5c0', z: 6, night: true } });
  def('record', { name: '레트로 음악 상자', price: 190, parts: [P(0.1, 0.2, 0, 0.8, 0.6, 9, '#7a5236'), P(0.15, 0.25, 9, 0.6, 0.5, 1, '#25232b'), P(0.65, 0.3, 10, 0.15, 0.15, 1, '#e8c56a')], det: [{ p: 0, f: 'S', u: [0.15, 0.65], v: [2, 6], c: '#5a3a24' }] });
  def('easel', { name: '그림 이젤', price: 110, parts: [P(0.2, 0.5, 0, 0.08, 0.08, 26, '#8a5a3c'), P(0.72, 0.5, 0, 0.08, 0.08, 26, '#8a5a3c'), P(0.15, 0.45, 10, 0.7, 0.06, 14, '#fbfaf6'), P(0.25, 0.43, 14, 0.4, 0.02, 6, '#8ac4ef')] });
  def('clock', { name: '괘종시계', price: 240, parts: [P(0.25, 0.3, 0, 0.5, 0.4, 32, '#6b4430'), P(0.3, 0.28, 22, 0.4, 0.05, 8, '#f4efe4')], det: [{ p: 0, f: 'S', u: [0.15, 0.35], v: [6, 16], c: '#e8c56a' }] });
  def('dresser', { name: '흰 서랍장', w: 2, price: 230, parts: [P(0.05, 0.15, 0, 1.9, 0.7, 16, '#f4f1ea'), P(0.3, 0.3, 16, 0.3, 0.3, 6, '#ff9ed2'), P(1.3, 0.35, 16, 0.4, 0.25, 3, '#c9b48a')], det: [{ p: 0, f: 'S', u: [0.1, 1.8], v: [2, 7], c: '#e6e0d4' }, { p: 0, f: 'S', u: [0.1, 1.8], v: [9, 14], c: '#e6e0d4' }] });
  def('nightstand', { name: '원목 협탁', price: 90, parts: [P(0.15, 0.15, 0, 0.7, 0.7, 10, '#a87c52'), P(0.35, 0.35, 10, 0.25, 0.25, 6, '#f2d28a')], det: [{ p: 0, f: 'S', u: [0.1, 0.6], v: [3, 7], c: '#8a6240' }] });
  def('bookcase_w', { name: '하얀 책장', w: 2, price: 210, parts: [P(0, 0.1, 0, 2, 0.8, 30, '#f4f1ea'), P(0.1, 0.12, 4, 0.5, 0.05, 6, '#5b7fc7'), P(0.7, 0.12, 4, 0.4, 0.05, 6, '#d9566f'), P(1.2, 0.12, 16, 0.6, 0.05, 6, '#5fb06a'), P(0.2, 0.12, 16, 0.3, 0.05, 6, '#f2c94c')] });
  def('heartrug', { name: '하트 러그', w: 2, d: 2, price: 120, blocks: false, parts: [P(0.2, 0.3, 0, 1.6, 1.4, 1, '#ffb3c9'), P(0.4, 0.15, 0, 0.5, 0.3, 1, '#ffb3c9'), P(1.1, 0.15, 0, 0.5, 0.3, 1, '#ffb3c9'), P(0.6, 0.6, 1, 0.8, 0.6, 0.5, '#ffd1dc')] });
  def('starrug', { name: '은하수 러그', w: 2, d: 2, price: 150, blocks: false, parts: [P(0.1, 0.1, 0, 1.8, 1.8, 1, '#2a2f5a'), P(0.4, 0.5, 1, 0.1, 0.1, 0.5, '#ffffff'), P(1.3, 0.4, 1, 0.1, 0.1, 0.5, '#fff3b0'), P(0.9, 1.2, 1, 0.1, 0.1, 0.5, '#ffffff'), P(0.3, 1.5, 1, 0.8, 0.1, 0.5, '#9f7fe0')] });
  def('fishbowl', { name: '발광 물고기 어항', price: 140, parts: [P(0.25, 0.25, 0, 0.5, 0.5, 6, '#8a5a3c'), P(0.2, 0.2, 6, 0.6, 0.6, 9, '#bfe3ee', { a: 1 }), P(0.4, 0.4, 9, 0.15, 0.1, 2, '#ff8a3d')], light: { r: 1.4, c: '#9fe6ff', z: 10, night: true } });
  def('keyboard', { name: '전자 키보드', w: 2, price: 280, parts: [...legs4(2, 0.6, 10, '#3a3f4a', 0.1), P(0, 0.1, 10, 2, 0.5, 3, '#25232b'), P(0.1, 0.25, 13, 1.8, 0.25, 1, '#fbfaf6')] });
  def('screen', { name: '꽃무늬 칸막이', w: 2, price: 170, parts: [P(0, 0.4, 0, 0.66, 0.08, 28, '#f2e8d5'), P(0.68, 0.4, 0, 0.66, 0.08, 28, '#f2e8d5'), P(1.36, 0.4, 0, 0.64, 0.08, 28, '#f2e8d5')], det: [{ p: 0, f: 'S', u: [0.1, 0.5], v: [10, 20], c: '#ff9ed2' }, { p: 2, f: 'S', u: [0.1, 0.5], v: [6, 16], c: '#ff9ed2' }] });
  def('robotvac', { name: '청소 로봇', price: 200, blocks: false, parts: [P(0.25, 0.25, 0, 0.5, 0.5, 2, '#e8eef4'), P(0.45, 0.3, 2, 0.1, 0.1, 1, '#5fa8ff')] });
  def('mobile', { name: '행성 모빌 스탠드', price: 180, parts: [P(0.45, 0.45, 0, 0.1, 0.1, 30, '#c9ccd6'), P(0.2, 0.45, 30, 0.6, 0.06, 1, '#c9ccd6'), P(0.15, 0.4, 24, 0.15, 0.15, 5, '#ff8a3d'), P(0.7, 0.4, 22, 0.12, 0.12, 4, '#7fd3d0'), P(0.4, 0.2, 26, 0.12, 0.12, 4, '#b89ae0')] });
  def('hammock', { name: '실내 해먹 체어', price: 260, use: 'sit', seats: [[0.5, 0.6, 0, 9]], parts: [P(0.45, 0.45, 0, 0.1, 0.1, 30, '#8a5a3c'), P(0.2, 0.35, 6, 0.6, 0.5, 6, '#f2e8d5'), P(0.2, 0.3, 12, 0.6, 0.1, 10, '#e6d6c8')] });
  def('canopybed', { name: '캐노피 침대', w: 2, d: 2, price: 820, use: 'bed', seats: [[0.6, 1.1, 0, 10], [1.4, 1.1, 0, 10]], parts: [P(0, 0, 0, 2, 2, 6, '#f4f1ea'), P(0.06, 0.16, 6, 1.88, 1.78, 4, '#fbfaf6'), P(0.06, 0.75, 9, 1.88, 1.19, 3, '#ffc9da'), P(0.15, 0.24, 10, 0.75, 0.36, 3, '#ffffff'), P(1.1, 0.24, 10, 0.75, 0.36, 3, '#ffffff'), P(0, 0, 0, 0.1, 0.1, 40, '#e6d6c8'), P(1.9, 0, 0, 0.1, 0.1, 40, '#e6d6c8'), P(0, 0, 40, 2, 0.1, 2, '#e6d6c8'), P(0, 0.1, 30, 0.06, 1.0, 10, '#ffe8ef', { a: 1 })] });
  def('daybed', { name: '창가 데이베드', w: 2, price: 360, use: 'sit', seats: [[0.6, 0.5, 0, 8], [1.4, 0.5, 0, 8]], parts: [P(0, 0.05, 0, 2, 0.9, 7, '#7a8aa8'), P(0, 0.05, 7, 2, 0.2, 9, '#6a7a98'), P(0.1, 0.3, 7, 0.4, 0.3, 3, '#f2d28a'), P(1.5, 0.3, 7, 0.4, 0.3, 3, '#ff9ed2')] });
  def('coffeemaker', { name: '향열매 커피머신 선반', price: 210, parts: [P(0.1, 0.15, 0, 0.8, 0.7, 14, '#8a5a3c'), P(0.2, 0.25, 14, 0.4, 0.4, 9, '#3a3f4a'), P(0.65, 0.35, 14, 0.15, 0.15, 3, '#fbfaf6')] });
  def('plushcap', { name: '대위 닮은 인형', price: 150, blocks: false, parts: [P(0.2, 0.3, 0, 0.6, 0.4, 9, '#6b7a5a'), P(0.25, 0.32, 9, 0.5, 0.36, 8, '#f6cba6'), P(0.25, 0.3, 16, 0.5, 0.4, 2, '#2a2433')] });
  def('lavalamp', { name: '라바 램프', price: 90, parts: [P(0.38, 0.38, 0, 0.24, 0.24, 3, '#3a3f4a'), P(0.36, 0.36, 3, 0.28, 0.28, 12, '#ff6bd5', { a: 1 }), P(0.42, 0.42, 6, 0.15, 0.15, 3, '#ffb0e8')], light: { r: 1.6, c: '#ff8fe0', z: 8, night: true } });
  def('wallshelf_plant', { name: '식물 선반', w: 2, price: 180, parts: [...legs4(2, 0.6, 22, '#c9ccd6', 0.05, 0.06), P(0, 0.1, 10, 2, 0.5, 1, '#e6e0d4'), P(0, 0.1, 21, 2, 0.5, 1, '#e6e0d4'), P(0.2, 0.2, 11, 0.3, 0.3, 6, '#5fb06a'), P(1.2, 0.2, 11, 0.3, 0.3, 8, '#7fd3a0'), P(0.7, 0.2, 22, 0.3, 0.3, 6, '#ff9ed2')] });

  // 가게 · 탈의실 설비 (판매 안 함)
  def('changebooth', { name: '탈의실', w: 2, cat: 'base', use: 'changing', parts: [P(0, 0.1, 0, 2, 0.8, 2, '#cfd8de'), P(0, 0.1, 2, 0.08, 0.8, 30, '#e6e0d4'), P(0.96, 0.1, 2, 0.08, 0.8, 30, '#e6e0d4'), P(1.92, 0.1, 2, 0.08, 0.8, 30, '#e6e0d4'), P(0, 0.1, 32, 2, 0.8, 2, '#c9b49a'), P(0.08, 0.84, 6, 0.88, 0.05, 25, '#9fd8e8'), P(1.04, 0.84, 6, 0.88, 0.05, 25, '#f2b8c9')], det: [{ p: 5, f: 'S', u: [0.1, 0.8], v: [3, 22], c: '#b8e6f2' }, { p: 6, f: 'S', u: [0.1, 0.8], v: [3, 22], c: '#ffd1dc' }] });
  def('clothesrack', { name: '옷걸이 행거', w: 2, cat: 'base', parts: [P(0.05, 0.45, 0, 0.08, 0.08, 28, '#c9ccd6'), P(1.87, 0.45, 0, 0.08, 0.08, 28, '#c9ccd6'), P(0.05, 0.45, 27, 1.9, 0.08, 2, '#c9ccd6'), P(0.2, 0.3, 12, 0.3, 0.35, 14, '#d9566f'), P(0.55, 0.3, 12, 0.3, 0.35, 14, '#f2e8d5'), P(0.9, 0.3, 10, 0.3, 0.35, 16, '#2f3f66'), P(1.25, 0.3, 12, 0.3, 0.35, 14, '#a8e0cc'), P(1.6, 0.3, 11, 0.25, 0.35, 15, '#c9b0e8')] });
  def('mannequin', { name: '마네킹', cat: 'base', parts: [P(0.35, 0.35, 0, 0.3, 0.3, 2, '#3a3f4a'), P(0.47, 0.47, 2, 0.06, 0.06, 10, '#c9ccd6'), P(0.3, 0.38, 12, 0.4, 0.25, 12, '#ff9ed2'), P(0.25, 0.36, 8, 0.5, 0.3, 6, '#ff9ed2'), P(0.4, 0.42, 24, 0.2, 0.15, 5, '#e6e0d4')] });
  def('salonchair', { name: '미용 의자', cat: 'base', use: 'salon', seats: [[0.5, 0.6, 2, 10]], parts: [P(0.4, 0.4, 0, 0.2, 0.2, 7, '#c9ccd6'), P(0.15, 0.25, 7, 0.7, 0.6, 3, '#2a2f3a'), P(0.15, 0.75, 10, 0.7, 0.12, 12, '#2a2f3a'), P(0.1, 0.25, 10, 0.08, 0.5, 4, '#c9ccd6'), P(0.82, 0.25, 10, 0.08, 0.5, 4, '#c9ccd6')] });
  def('salonmirror', { name: '미용실 거울', cat: 'base', parts: [P(0.05, 0.1, 0, 0.9, 0.3, 10, '#f4f1ea'), P(0.1, 0.12, 10, 0.8, 0.06, 22, '#cfe8f2'), P(0.05, 0.1, 32, 0.9, 0.1, 2, '#e8c56a')], det: [{ p: 1, f: 'S', u: [0.05, 0.75], v: [2, 20], c: '#e6f6fb' }], light: { r: 1.6, c: '#fff3d8', z: 26 } });
  def('hairwash', { name: '샴푸대', w: 2, cat: 'base', parts: [P(0, 0.2, 0, 2, 0.7, 9, '#f4f1ea'), P(0.2, 0.25, 9, 0.6, 0.5, 3, '#fbfaf6'), P(1.0, 0.3, 9, 0.9, 0.5, 4, '#2a2f3a')] });

  const NEWF = ['armchair', 'beanbag', 'lowtable', 'cushion', 'starlamp', 'globe', 'teddy', 'cactus', 'terrarium', 'record', 'easel', 'clock', 'dresser', 'nightstand', 'bookcase_w', 'heartrug', 'starrug', 'fishbowl', 'keyboard', 'screen', 'robotvac', 'mobile', 'hammock', 'canopybed', 'daybed', 'coffeemaker', 'plushcap', 'lavalamp', 'wallshelf_plant'];
  // 별빛 가구점 판매 목록: 기존 숙소 가구 + 새 가구
  PX.FASHION.furniture = ['plant', 'bigplant', 'lamp', 'rug', 'rug_blue', 'sidetable', 'cabinet', 'chair', 'stool', 'sofa', 'sofa_green', 'table', 'desk', 'shelf', 'mirror', 'cafetable', 'aquarium', 'cooler', 'tv', 'bed', 'bigbed', 'wardrobe', 'fridge', 'kitchen', 'glassvase', 'bunnyplush', 'moodlamp', 'candles', 'vanity', 'waterbed', 'roundbed', 'bathtub'].concat(NEWF);

  // ---------------- 미용실 ----------------
  PX.FASHION.salon = { cut: 60, color: 80 };
})();
