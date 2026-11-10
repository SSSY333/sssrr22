/* =====================================================================
   집 꾸미기 확장
   · 장식 47가지: 벽 장식 · 조명 · 식물 · 소품 · 러그 · 계절 (가구점 카탈로그 새 탭)
   · 벽지 12가지 · 바닥 10가지 — 꾸미기 막대 「🎨 벽지 · 바닥」 또는 메뉴 → 집
   ===================================================================== */
const DB = (u0, v0, u1, v1, z0, z1, top, l, r) => _blk(u0, v0, u1, v1, z0, z1, top, l, r);
const dpot = (col = '#c4704e', s = 0.32) => DB(0.5 - s / 2, 0.5 - s / 2, 0.5 + s / 2, 0.5 + s / 2, 0, 7, col);
/* 벽걸이용: 액자 테두리 + 그림 칸 */
const dFrame = (frameCol, layers, u0 = 0.2, u1 = 0.8, z0 = 20, z1 = 36) => () => [DB(u0, 0, u1, 0.08, z0, z1, frameCol), ...layers.map(([a0, a1, b0, b1, col]) => DB(u0 + (u1 - u0) * a0, 0.08, u0 + (u1 - u0) * a1, 0.1, z0 + (z1 - z0) * b0, z0 + (z1 - z0) * b1, col))];
const DECOR = {
  /* 🖼 벽 장식 */
  posterSea: { name: '바다 포스터', price: 4000, wall: true, cat: 'walldeco', blocks: dFrame('#ffffff', [[0.08, 0.92, 0.1, 0.9, '#7fc4e8'], [0.08, 0.92, 0.1, 0.4, '#3f8fd0'], [0.55, 0.8, 0.6, 0.85, '#fff3a0']]) },
  posterOrange: { name: '귤 포스터', price: 4000, wall: true, cat: 'walldeco', blocks: dFrame('#fff6e6', [[0.08, 0.92, 0.1, 0.9, '#fbe6c8'], [0.3, 0.7, 0.25, 0.65, '#f39a2b'], [0.45, 0.6, 0.65, 0.78, '#4f9e4a']]) },
  paintFlower: { name: '꽃 그림', price: 9000, wall: true, cat: 'walldeco', blocks: dFrame('#c99a64', [[0.08, 0.92, 0.1, 0.9, '#f4efe6'], [0.2, 0.45, 0.45, 0.75, '#f19ab5'], [0.55, 0.8, 0.5, 0.8, '#c08ad8'], [0.4, 0.6, 0.1, 0.5, '#5aa850']]) },
  paintLight: { name: '등대 그림', price: 9000, wall: true, cat: 'walldeco', blocks: dFrame('#7a5236', [[0.08, 0.92, 0.4, 0.9, '#ffd9a0'], [0.08, 0.92, 0.1, 0.4, '#5aa0d8'], [0.45, 0.6, 0.3, 0.8, '#ffffff'], [0.45, 0.6, 0.7, 0.8, '#e3484a']]) },
  wallShelf: { name: '벽 선반', price: 6000, wall: true, cat: 'walldeco', blocks: () => [DB(0.12, 0, 0.88, 0.16, 22, 24, '#a87a4a'), DB(0.2, 0.02, 0.34, 0.14, 24, 30, '#c4704e'), DB(0.22, 0.03, 0.32, 0.12, 30, 34, '#5aa850'), DB(0.48, 0.03, 0.62, 0.13, 24, 31, '#3f6fb5'), DB(0.68, 0.03, 0.82, 0.13, 24, 28, '#f2d06a')] },
  wreath: { name: '초록 리스', price: 5000, wall: true, cat: 'walldeco', blocks: () => [DB(0.3, 0, 0.7, 0.08, 22, 24, '#4f9e4a'), DB(0.3, 0, 0.7, 0.08, 34, 36, '#4f9e4a'), DB(0.3, 0, 0.36, 0.08, 24, 34, '#3f8f45'), DB(0.64, 0, 0.7, 0.08, 24, 34, '#3f8f45'), DB(0.46, 0.06, 0.54, 0.1, 21, 24, '#e3484a')] },
  garland: { name: '전구 가랜드', price: 7000, wall: true, light: true, cat: 'walldeco', blocks: () => [DB(0.02, 0, 0.98, 0.04, 36, 37, '#5b5f69'), ...[0.1, 0.3, 0.5, 0.7, 0.9].map((u, i) => DB(u - 0.04, 0.02, u + 0.04, 0.08, 31 + (i % 2) * 2, 35, ['#ffe27a', '#ff9ec4', '#8fd0ff', '#b8f28a', '#ffd23a'][i]))] },
  mirrorRound: { name: '둥근 벽거울', price: 8000, wall: true, cat: 'walldeco', blocks: () => [DB(0.3, 0, 0.7, 0.08, 18, 36, '#c99a64'), DB(0.34, 0.08, 0.66, 0.1, 20, 34, '#cfe6f7'), DB(0.38, 0.08, 0.48, 0.11, 28, 32, '#ffffff')] },
  pennant: { name: '해월도 깃발', price: 3000, wall: true, cat: 'walldeco', blocks: () => [DB(0.15, 0, 0.85, 0.06, 32, 34, '#7a5236'), DB(0.2, 0.02, 0.8, 0.08, 24, 32, '#3f6fb5'), DB(0.3, 0.06, 0.7, 0.1, 27, 29, '#ffffff')] },
  wallCal: { name: '벽 달력', price: 2500, wall: true, cat: 'walldeco', blocks: () => [DB(0.36, 0, 0.64, 0.06, 18, 34, '#ffffff'), DB(0.36, 0.05, 0.64, 0.08, 30, 34, '#e3484a'), DB(0.4, 0.05, 0.6, 0.08, 20, 28, '#d9d6dd')] },
  dreamcatcher: { name: '드림캐처', price: 5000, wall: true, cat: 'walldeco', blocks: () => [DB(0.38, 0, 0.62, 0.06, 28, 36, '#c99a64'), DB(0.42, 0.04, 0.58, 0.08, 30, 34, '#f4efe6'), DB(0.4, 0.04, 0.44, 0.08, 18, 28, '#c08ad8'), DB(0.56, 0.04, 0.6, 0.08, 18, 28, '#8fd0ff')] },
  hatHook: { name: '밀짚모자 걸이', price: 4500, wall: true, cat: 'walldeco', blocks: () => [DB(0.45, 0, 0.55, 0.1, 30, 32, '#7a5236'), DB(0.25, 0.02, 0.75, 0.16, 24, 27, '#f2d06a'), DB(0.36, 0.04, 0.64, 0.14, 27, 32, '#e9c25a'), DB(0.36, 0.04, 0.64, 0.14, 27, 28.5, '#e3484a')] },
  netDeco: { name: '어망 장식', price: 5000, wall: true, cat: 'walldeco', blocks: () => [DB(0.1, 0, 0.9, 0.04, 20, 38, '#9fb8a8'), DB(0.2, 0.03, 0.3, 0.07, 26, 30, '#f7b9c9'), DB(0.55, 0.03, 0.65, 0.07, 32, 35, '#ffffff'), DB(0.7, 0.03, 0.8, 0.07, 22, 25, '#f39a2b')] },
  cuckoo: { name: '뻐꾸기 시계', price: 12000, wall: true, cat: 'walldeco', blocks: () => [DB(0.34, 0, 0.66, 0.12, 20, 34, '#8a5a3a'), DB(0.3, 0, 0.7, 0.14, 34, 38, '#5f3b25'), DB(0.4, 0.12, 0.6, 0.14, 24, 31, '#f4efe6'), DB(0.46, 0.12, 0.54, 0.16, 35, 37, '#f2d06a'), DB(0.48, 0.05, 0.5, 0.08, 10, 20, '#d9b44f')] },
  hangPlant: { name: '행잉 화분', price: 6000, wall: true, cat: 'walldeco', blocks: () => [DB(0.48, 0.1, 0.52, 0.14, 30, 40, '#c9a064'), DB(0.38, 0.06, 0.62, 0.22, 22, 30, '#f4efe6'), DB(0.3, 0.04, 0.7, 0.24, 18, 26, '#5aa850'), DB(0.36, 0.1, 0.46, 0.2, 12, 20, '#4f9e4a')] },
  /* 💡 조명 */
  floorLamp: { name: '플로어 램프', price: 11000, light: true, cat: 'lightdeco', blocks: () => [DB(0.4, 0.4, 0.6, 0.6, 0, 2, '#3a3a48'), DB(0.47, 0.47, 0.53, 0.53, 2, 30, '#5b5f69'), DB(0.32, 0.32, 0.68, 0.68, 30, 38, '#fff1c2', '#f2dfa0', '#e3cc86')] },
  moonLamp: { name: '달 무드등', price: 8000, light: true, cat: 'lightdeco', blocks: () => [DB(0.4, 0.4, 0.6, 0.6, 0, 2, '#c99a64'), DB(0.34, 0.34, 0.66, 0.66, 2, 12, '#fff3b8', '#f2df9a', '#e3cc80')] },
  candles: { name: '촛대', price: 4000, light: true, cat: 'lightdeco', blocks: () => [DB(0.34, 0.34, 0.66, 0.66, 0, 2, '#d9b44f'), DB(0.38, 0.42, 0.46, 0.5, 2, 10, '#fffaf0'), DB(0.52, 0.48, 0.6, 0.56, 2, 8, '#fffaf0'), DB(0.4, 0.44, 0.44, 0.48, 10, 12, '#ffb35a'), DB(0.54, 0.5, 0.58, 0.54, 8, 10, '#ffb35a')] },
  paperLantern: { name: '한지 등', price: 9000, light: true, cat: 'lightdeco', blocks: () => [DB(0.38, 0.38, 0.62, 0.62, 0, 2, '#7a5236'), DB(0.47, 0.47, 0.53, 0.53, 2, 10, '#7a5236'), DB(0.3, 0.3, 0.7, 0.7, 10, 26, '#fff6e0', '#f2e2c0', '#e3cfa6'), DB(0.3, 0.3, 0.7, 0.7, 17, 18, '#c96a3a')] },
  shellLamp: { name: '조개 조명', price: 10000, light: true, cat: 'lightdeco', blocks: () => [DB(0.38, 0.38, 0.62, 0.62, 0, 3, '#f4efe6'), DB(0.3, 0.36, 0.7, 0.64, 3, 13, '#ffd1e3', '#f2b8cc', '#e3a2b6')] },
  fireflyJar: { name: '반딧불 유리병', price: 6000, light: true, cat: 'lightdeco', blocks: () => [DB(0.4, 0.4, 0.6, 0.6, 0, 12, '#e8fbff', '#cfeef7', '#b8e2ee'), DB(0.4, 0.4, 0.6, 0.6, 12, 14, '#c99a64'), DB(0.46, 0.46, 0.5, 0.5, 5, 7, '#fff36a'), DB(0.52, 0.52, 0.55, 0.55, 8, 10, '#fff36a')] },
  /* 🪴 식물 */
  cactus: { name: '선인장', price: 3500, cat: 'plantdeco', blocks: () => [dpot('#e3a26a'), DB(0.44, 0.44, 0.56, 0.56, 7, 20, '#5aa850'), DB(0.34, 0.46, 0.44, 0.54, 11, 16, '#4f9e4a'), DB(0.56, 0.46, 0.64, 0.54, 13, 18, '#4f9e4a'), DB(0.47, 0.47, 0.53, 0.53, 20, 22, '#ff9ec4')] },
  sunflowerPot: { name: '해바라기 화분', price: 5000, cat: 'plantdeco', blocks: () => [dpot(), DB(0.48, 0.48, 0.52, 0.52, 7, 22, '#4f9e4a'), DB(0.36, 0.4, 0.64, 0.56, 22, 30, '#ffd23a'), DB(0.44, 0.44, 0.56, 0.54, 24, 28, '#8a5a3a')] },
  olive: { name: '올리브 나무', price: 14000, cat: 'plantdeco', blocks: () => [dpot('#d9cfba', 0.4), DB(0.47, 0.47, 0.53, 0.53, 7, 24, '#8a6a4a'), DB(0.24, 0.26, 0.76, 0.74, 24, 38, '#8fb06a', '#7a9a58', '#688848'), DB(0.34, 0.36, 0.66, 0.64, 38, 42, '#a3c27a')] },
  bonsai: { name: '분재', price: 12000, cat: 'plantdeco', blocks: () => [DB(0.3, 0.36, 0.7, 0.64, 0, 4, '#3a5a8a'), DB(0.47, 0.47, 0.53, 0.53, 4, 12, '#7a5236'), DB(0.28, 0.36, 0.56, 0.6, 12, 17, '#3f7a30'), DB(0.48, 0.42, 0.72, 0.62, 14, 19, '#4f8a3a')] },
  tulip: { name: '튤립 화분', price: 4500, cat: 'plantdeco', blocks: () => [dpot('#f4efe6'), ...[[0.4, '#e3484a'], [0.5, '#ffd23a'], [0.6, '#ff9ec4']].map(([u, c], i) => [DB(u - 0.02, 0.48, u + 0.02, 0.52, 7, 14 + i * 2, '#4f9e4a'), DB(u - 0.05, 0.46, u + 0.05, 0.54, 14 + i * 2, 19 + i * 2, c)]).flat()] },
  miniOrange: { name: '미니 귤나무', price: 13000, cat: 'plantdeco', blocks: () => [dpot('#c4704e', 0.38), DB(0.47, 0.47, 0.53, 0.53, 7, 16, '#7a5236'), DB(0.26, 0.28, 0.74, 0.72, 16, 30, '#4f9e4a', '#3f8a3a', '#357a30'), DB(0.34, 0.66, 0.42, 0.72, 20, 25, '#f39a2b'), DB(0.6, 0.62, 0.68, 0.7, 24, 29, '#f39a2b'), DB(0.48, 0.3, 0.56, 0.36, 28, 32, '#f39a2b')] },
  /* 🧸 소품 */
  teddy: { name: '곰 인형', price: 7000, cat: 'propdeco', blocks: () => [DB(0.34, 0.38, 0.66, 0.64, 0, 10, '#c99a64'), DB(0.38, 0.4, 0.62, 0.6, 10, 18, '#d7a874'), DB(0.36, 0.44, 0.44, 0.5, 18, 21, '#c99a64'), DB(0.56, 0.44, 0.64, 0.5, 18, 21, '#c99a64'), DB(0.46, 0.58, 0.54, 0.62, 12, 14, '#3a2a26')] },
  globe: { name: '지구본', price: 9000, cat: 'propdeco', blocks: () => [DB(0.4, 0.4, 0.6, 0.6, 0, 3, '#8a5a3a'), DB(0.48, 0.48, 0.52, 0.52, 3, 8, '#d9b44f'), DB(0.34, 0.34, 0.66, 0.66, 8, 20, '#5aa0d8', '#3f8fd0', '#2f6fa8'), DB(0.4, 0.5, 0.52, 0.6, 12, 17, '#5aa850')] },
  guitar: { name: '통기타', price: 15000, cat: 'propdeco', blocks: () => [DB(0.34, 0.5, 0.66, 0.62, 0, 12, '#d7a874'), DB(0.38, 0.52, 0.62, 0.6, 12, 18, '#c99a64'), DB(0.47, 0.54, 0.53, 0.58, 18, 34, '#7a5236'), DB(0.46, 0.6, 0.54, 0.63, 6, 9, '#3a2a26')] },
  bookStack: { name: '책 더미', price: 3000, cat: 'propdeco', blocks: () => [DB(0.3, 0.36, 0.7, 0.64, 0, 3, '#3f6fb5'), DB(0.33, 0.34, 0.68, 0.62, 3, 6, '#e3615a'), DB(0.31, 0.37, 0.66, 0.65, 6, 9, '#f2d06a'), DB(0.36, 0.38, 0.64, 0.6, 9, 11, '#5aa850')] },
  radio: { name: '레트로 라디오', price: 8000, cat: 'propdeco', blocks: () => [DB(0.3, 0.38, 0.7, 0.62, 0, 10, '#c96a3a', '#a85a32', '#8a4a2a'), DB(0.34, 0.6, 0.5, 0.63, 2, 8, '#f4efe6'), DB(0.56, 0.6, 0.64, 0.63, 4, 7, '#3a2a26'), DB(0.6, 0.4, 0.62, 0.42, 10, 18, '#9aa3b0')] },
  fishBowl: { name: '금붕어 어항', price: 10000, cat: 'propdeco', blocks: () => [DB(0.36, 0.36, 0.64, 0.64, 0, 3, '#7a5236'), DB(0.34, 0.34, 0.66, 0.66, 3, 15, '#bfe8f7', '#a9dcf2', '#8fd0ea'), DB(0.44, 0.5, 0.54, 0.56, 7, 10, '#f39a2b'), DB(0.38, 0.4, 0.62, 0.6, 3, 4, '#5aa850')] },
  turntable: { name: '레코드 플레이어', price: 18000, cat: 'propdeco', blocks: () => [DB(0.24, 0.3, 0.76, 0.7, 0, 8, '#8a5a3a'), DB(0.3, 0.34, 0.62, 0.66, 8, 9, '#2b2f3a'), DB(0.42, 0.46, 0.5, 0.54, 9, 10, '#e3484a'), DB(0.66, 0.36, 0.7, 0.4, 8, 12, '#9aa3b0')] },
  catBed: { name: '고양이 쿠션', price: 6000, cat: 'propdeco', blocks: () => [DB(0.26, 0.3, 0.74, 0.7, 0, 5, '#c08ad8'), DB(0.32, 0.36, 0.68, 0.64, 2, 3.5, '#e8d4f2'), DB(0.4, 0.42, 0.6, 0.6, 3, 6, '#f39a2b')] },
  picnicBasket: { name: '피크닉 바구니', price: 5000, cat: 'propdeco', blocks: () => [DB(0.3, 0.36, 0.7, 0.64, 0, 8, '#c99a64', '#a87a4a', '#8a5f38'), DB(0.3, 0.36, 0.7, 0.64, 8, 9, '#e3484a'), DB(0.46, 0.48, 0.54, 0.52, 9, 15, '#8a5f38')] },
  miniHare: { name: '미니 돌하르방', price: 7000, cat: 'propdeco', blocks: () => [DB(0.38, 0.4, 0.62, 0.6, 0, 3, '#5b5f69'), DB(0.4, 0.42, 0.6, 0.58, 3, 16, '#7a808c', '#6a707c', '#5a606c'), DB(0.38, 0.4, 0.62, 0.6, 16, 20, '#5b5f69'), DB(0.44, 0.56, 0.48, 0.59, 12, 14, '#3a3e46'), DB(0.52, 0.56, 0.56, 0.59, 12, 14, '#3a3e46')] },
  surfboard: { name: '서핑보드', price: 20000, cat: 'propdeco', blocks: () => [DB(0.4, 0.08, 0.6, 0.18, 0, 40, '#8fd0ff', '#74b8e8', '#5fa0d0'), DB(0.4, 0.08, 0.6, 0.18, 18, 22, '#ffd23a')] },
  umbrellaStand: { name: '우산꽂이', price: 4500, cat: 'propdeco', blocks: () => [DB(0.38, 0.38, 0.62, 0.62, 0, 12, '#5b5f69'), DB(0.42, 0.44, 0.46, 0.48, 12, 24, '#ffd23a'), DB(0.52, 0.5, 0.56, 0.54, 12, 22, '#e3484a')] },
  easel: { name: '이젤', price: 11000, cat: 'propdeco', blocks: () => [DB(0.3, 0.5, 0.34, 0.54, 0, 30, '#a87a4a'), DB(0.66, 0.5, 0.7, 0.54, 0, 30, '#a87a4a'), DB(0.26, 0.46, 0.74, 0.5, 14, 32, '#fffaf0'), DB(0.36, 0.48, 0.6, 0.5, 18, 26, '#f19ab5'), DB(0.46, 0.48, 0.66, 0.5, 22, 30, '#7fc4e8')] },
  /* 🟫 러그 · 매트 */
  rugOrange: { name: '귤 러그', price: 7000, flat: true, cat: 'rugdeco', blocks: () => [DB(0.1, 0.1, 0.9, 0.9, 0, 0.6, '#f39a2b'), DB(0.24, 0.24, 0.76, 0.76, 0.6, 1, '#ffc56a'), DB(0.44, 0.1, 0.56, 0.22, 1, 1.4, '#4f9e4a')] },
  rugStripe: { name: '줄무늬 러그', price: 12000, flat: true, fw: 2, fd: 1, cat: 'rugdeco', blocks: () => [DB(0.06, 0.1, 1.94, 0.9, 0, 0.6, '#f4efe6'), ...[0.2, 0.6, 1.0, 1.4, 1.8].map((u, i) => DB(u - 0.08, 0.1, u + 0.08, 0.9, 0.6, 1, ['#5aa0d8', '#f19ab5', '#5aa0d8', '#f19ab5', '#5aa0d8'][i]))] },
  rugWave: { name: '파도 러그', price: 11000, flat: true, fw: 2, fd: 2, cat: 'rugdeco', blocks: () => [DB(0.1, 0.1, 1.9, 1.9, 0, 0.6, '#3f8fd0'), DB(0.1, 0.5, 1.9, 0.7, 0.6, 1, '#cfe6f7'), DB(0.1, 1.1, 1.9, 1.3, 0.6, 1, '#cfe6f7'), DB(0.1, 1.6, 1.9, 1.9, 0.6, 1, '#f2e2b0')] },
  doorMat: { name: '현관 매트', price: 3000, flat: true, cat: 'rugdeco', blocks: () => [DB(0.12, 0.22, 0.88, 0.78, 0, 0.8, '#c99a64'), DB(0.22, 0.32, 0.78, 0.68, 0.8, 1.2, '#a87a4a')] },
  rugHeart: { name: '하트 러그', price: 9000, flat: true, cat: 'rugdeco', blocks: () => [DB(0.2, 0.3, 0.5, 0.8, 0, 0.8, '#ff9ec4'), DB(0.5, 0.2, 0.8, 0.7, 0, 0.8, '#ff9ec4'), DB(0.3, 0.3, 0.7, 0.7, 0, 1, '#ffd1e3')] },
  /* 🎄 계절 */
  xmasTree: { name: '크리스마스트리', price: 18000, light: true, cat: 'seasondeco', blocks: () => [dpot('#e3484a', 0.36), DB(0.24, 0.24, 0.76, 0.76, 7, 18, '#3f7a30'), DB(0.3, 0.3, 0.7, 0.7, 18, 28, '#4f8a3a'), DB(0.38, 0.38, 0.62, 0.62, 28, 36, '#5aa850'), DB(0.46, 0.46, 0.54, 0.54, 36, 40, '#ffd23a'), DB(0.3, 0.7, 0.36, 0.76, 12, 15, '#e3484a'), DB(0.62, 0.66, 0.68, 0.72, 20, 23, '#8fd0ff')] },
  snowmanDoll: { name: '눈사람 인형', price: 6000, cat: 'seasondeco', blocks: () => [DB(0.34, 0.36, 0.66, 0.64, 0, 10, '#ffffff', '#e6eef4', '#d2dee8'), DB(0.38, 0.4, 0.62, 0.6, 10, 18, '#ffffff', '#e6eef4', '#d2dee8'), DB(0.36, 0.4, 0.64, 0.6, 18, 20, '#3a2a26'), DB(0.48, 0.58, 0.54, 0.64, 13, 15, '#f39a2b')] },
  pumpkinLamp: { name: '호박 등', price: 7000, light: true, cat: 'seasondeco', blocks: () => [DB(0.3, 0.32, 0.7, 0.68, 0, 12, '#f39a2b', '#d9822a', '#c06f22'), DB(0.47, 0.47, 0.53, 0.53, 12, 15, '#4f9e4a'), DB(0.38, 0.66, 0.46, 0.69, 6, 9, '#fff36a'), DB(0.54, 0.66, 0.62, 0.69, 6, 9, '#fff36a')] },
  springBasket: { name: '유채꽃 바구니', price: 6000, cat: 'seasondeco', blocks: () => [DB(0.3, 0.36, 0.7, 0.64, 0, 7, '#c99a64'), DB(0.28, 0.34, 0.72, 0.66, 7, 13, '#ffe04a', '#f2cf30', '#e0bc20'), DB(0.4, 0.44, 0.48, 0.52, 13, 15, '#ffffff')] },
  beachSet: { name: '여름 바캉스 세트', price: 9000, cat: 'seasondeco', blocks: () => [DB(0.2, 0.3, 0.8, 0.7, 0, 1, '#ff9ec4'), DB(0.3, 0.4, 0.44, 0.54, 1, 6, '#ffffff'), DB(0.56, 0.4, 0.7, 0.58, 1, 4, '#ffd23a'), DB(0.47, 0.47, 0.5, 0.5, 1, 26, '#ffffff'), DB(0.3, 0.3, 0.7, 0.7, 26, 30, '#e3484a')] },
};
const DECOR_CATS = { walldeco: '🖼 벽 장식', lightdeco: '💡 조명', plantdeco: '🪴 식물', propdeco: '🧸 소품', rugdeco: '🟫 러그', seasondeco: '🎄 계절' };
for (const [k, F] of Object.entries(DECOR)) FURN[k] = Object.assign({ fw: 1, fd: 1 }, F);
for (const [cat, label] of Object.entries(DECOR_CATS)) FURN_CATS[cat] = [label, Object.keys(DECOR).filter(k => DECOR[k].cat === cat)];

/* ---------------- 벽지 · 바닥 ---------------- */
const WALLPAPERS = [
  ['크림 (기본)', null, null], ['벚꽃 분홍', '#f9dde4', '#eab7c4'], ['하늘', '#d8ecf7', '#a9cbe0'], ['민트', '#d9f2e6', '#a8d8c0'], ['라벤더', '#e6defa', '#c3b4e8'], ['귤빛', '#ffe6c4', '#f2bf82'],
  ['연노랑', '#fbf3c8', '#e6d68e'], ['바다 남색', '#bcd0e6', '#5f7fa8'], ['숲 초록', '#cfe2c4', '#8fb07a'], ['따뜻한 회색', '#e4e0dc', '#b7b0a8'], ['나무 판자', '#e2c49a', '#a87a4a'], ['하양', '#fbfaf7', '#d9d6d0'],
];
const FLOORS = [
  ['원목 (기본)', null], ['진한 원목', { pat: 'plank', a: '#8a5a3a', b: '#74492f' }], ['하얀 원목', { pat: 'plank', a: '#efe4d2', b: '#dccbb0' }], ['체크 타일', { pat: 'check', a: '#f4efe6', b: '#c9d3d8' }],
  ['하늘 타일', { pat: 'check', a: '#d8ecf7', b: '#a9cbe0' }], ['분홍 카펫', { pat: 'carpet', a: '#f7c6d4', b: '#eab0c0' }], ['초록 카펫', { pat: 'carpet', a: '#b8d8a8', b: '#a3c890' }], ['대리석', { pat: 'marble', a: '#f2f2ee', b: '#c9c9c2' }],
  ['다다미', { pat: 'tatami', a: '#d7d59a', b: '#a8a66a' }], ['테라코타', { pat: 'check', a: '#d98a5f', b: '#c4704e' }],
];
const WALL_PRICE = 2000;
for (let i = 1; i < FLOORS.length; i++) { T['HF' + i] = 40 + i; TILE_NAMES[40 + i] = 'hf' + i; }
const _makeTileDecor = makeTile;
makeTile = function (type, variant, frame = 0, se = 'summer') {
  if (!/^hf\d+$/.test(type)) return _makeTileDecor(type, variant, frame, se);
  const F = FLOORS[+type.slice(2)][1], c = mkCanvas(TW, TH), g = c.getContext('2d'), img = g.createImageData(TW, TH), d = img.data;
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = hex(F.a), Bc = hex(F.b);
  for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
    if (!inDiamond(px, py)) continue;
    const [u, v] = tileUV(px, py), n = hash2(px + variant * 31, py + variant * 17, 5);
    let col = A;
    if (F.pat === 'plank') { const row = Math.floor(v * 4); col = (Math.abs(v * 4 - Math.round(v * 4)) < 0.08 || Math.abs((u + row * 0.37) % 1 - 0.5) < 0.02) ? Bc : A; if (n > 0.92) col = Bc; }
    else if (F.pat === 'check') col = (Math.floor(u * 2) + Math.floor(v * 2)) % 2 ? Bc : A;
    else if (F.pat === 'carpet') col = n > 0.7 ? Bc : A;
    else if (F.pat === 'marble') col = Math.abs(Math.sin((u * 3 + v * 7 + variant) * 2.1)) < 0.08 ? Bc : A;
    else if (F.pat === 'tatami') col = (u < 0.06 || u > 0.94 || Math.abs(v - 0.5) < 0.03) ? Bc : A;
    const i = (py * TW + px) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
};
function homeStyle() { if (!S.homeStyle) S.homeStyle = { wall: 0, floor: 0 }; return S.homeStyle; }
function applyHomeStyle(m = MAPS.in_home) {
  if (!m || !S) return;
  const st = homeStyle(), W0 = INTERIORS.home, wp = WALLPAPERS[st.wall] || WALLPAPERS[0];
  m.wall = wp[1] || W0.wall; m.wall2 = wp[2] || W0.wall2;
  const fl = st.floor | 0;
  for (let i = 0; i < m.tiles.length; i++) { const t = m.tiles[i]; if (t === T.FLOOR || (t >= 41 && t <= 49)) m.tiles[i] = fl ? 40 + fl : T.FLOOR; }
  m.ground = null;
}
const _rebuildHomeDecor = rebuildHome;
rebuildHome = function () { const m = _rebuildHomeDecor(); applyHomeStyle(m); return m; };
function styleMenu(tab = 'wall') {
  const st = homeStyle();
  const tabs = `<div class="ptabs"><button data-t="wall" class="${tab === 'wall' ? 'on' : ''}">🧱 벽지</button><button data-t="floor" class="${tab === 'floor' ? 'on' : ''}">🟫 바닥</button></div>`;
  const sw = (a, b) => `<span style="display:inline-block;width:46px;height:34px;border:3px solid var(--line);border-radius:8px;background:linear-gradient(${a} 62%, ${b} 62%)"></span>`;
  const cards = tab === 'wall'
    ? WALLPAPERS.map(([n, a, b], i) => `<button class="pcard ${st.wall === i ? 'lock' : ''}" data-i="${i}">${sw(a || INTERIORS.home.wall, b || INTERIORS.home.wall2)}<b>${n}</b><small>${st.wall === i ? '지금 벽지' : i ? fmtMoney(WALL_PRICE) : '무료'}</small></button>`).join('')
    : FLOORS.map(([n, F], i) => `<button class="pcard ${st.floor === i ? 'lock' : ''}" data-i="${i}"><img src="${floorPreview(i)}" style="width:64px;image-rendering:pixelated"><b>${n}</b><small>${st.floor === i ? '지금 바닥' : i ? fmtMoney(WALL_PRICE) : '무료'}</small></button>`).join('');
  openPanel('🎨 벽지 · 바닥', tabs + `<p class="psub">보유 <b>${fmtMoney(S.money)}</b> · 바꾸면 바로 집에 적용돼요</p><div class="pgrid">${cards}</div>`, (body) => {
    body.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => styleMenu(b.dataset.t));
    body.querySelectorAll('.pcard').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, key = tab === 'wall' ? 'wall' : 'floor'; if (st[key] === i) return;
      if (i && S.money < WALL_PRICE) { toast('돈이 부족해요'); return; }
      if (i) S.money -= WALL_PRICE; st[key] = i; applyHomeStyle(); updateHUD(); save(); Sound.sfx('coin');
      toast(`🎨 ${tab === 'wall' ? '벽지를' : '바닥을'} ${josaRo('「' + (tab === 'wall' ? WALLPAPERS : FLOORS)[i][0].replace(/ \(기본\)/, '') + '」')} 바꿨어요`);
      styleMenu(tab);
    });
  });
}
function floorPreview(i) {
  if (!i) { const c = makeTile('floor', 1, 0); return dUpscale(c); }
  return dUpscale(makeTile('hf' + i, 1, 0));
}
function dUpscale(c) { const o = mkCanvas(c.width * 2, c.height * 2), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height); return o.toDataURL(); }
/* 꾸미기 막대에 버튼 · 집 메뉴에도 */
window.addEventListener('DOMContentLoaded', () => {
  const bar = document.querySelector('#decorBar .dbtns'); if (!bar || document.querySelector('#dStyle')) return;
  const b = document.createElement('button'); b.id = 'dStyle'; b.textContent = '🎨 벽지 · 바닥'; b.onclick = () => { Sound.sfx('tap'); styleMenu(); };
  bar.insertBefore(b, bar.querySelector('#dDone'));
});
const _ensureV4Decor = ensureV4;
ensureV4 = function (s) { _ensureV4Decor(s); if (!s.homeStyle) s.homeStyle = { wall: 0, floor: 0 }; return s; };
const _startGameDecor = startGame;
startGame = function (state, isNew) { _startGameDecor(state, isNew); try { applyHomeStyle(); } catch (e) { } };
/* 메뉴 → 집 에 「벽지 · 바닥」 */
const _mainMenuDecor = mainMenu;
mainMenu = function () {
  _mainMenuDecor();
  const home = [...document.querySelectorAll('#sheetBody .sitem')].find(b => /^집/.test((b.querySelector('.si-label') || {}).textContent || ''));
  if (!home) return; const f = home.onclick;
  home.onclick = () => { f && f(); const body = $('#sheetBody'); if (!body) return; const nb = document.createElement('button'); nb.className = 'sitem'; nb.innerHTML = '<span class="si-icon">🎨</span><span class="si-label">벽지 · 바닥</span>'; nb.onclick = () => { Sound.sfx('tap'); closeSheet(); styleMenu(); }; body.insertBefore(nb, body.children[1] || null); };
};
