/* =====================================================================
   꾸미기 2 — 섬 꾸미기를 찾기 쉽고 바로 쓸 수 있게 + 장식 대폭 추가 + 내 일터(카페 · 학교…) 안 꾸미기
   · 꾸미기 막대 「🎨 장식 고르기」: 모든 장식이 바로 보이고, 없는 건 그 자리에서 사서 바로 놓기
   · 처음 꾸미기를 열면 기본 장식 몇 개를 선물
   · 섬 어디든(학교 운동장 · 카페 앞 테라스 · 놀이터 모래밭 · 돌길 광장 포함) 놓을 수 있음 — 큰길 · 부두 · 문 앞만 피함
   · 내 일터 안(카페 사장 → 카페, 선생님 → 학교, 의사 → 보건지소, 해녀 → 해녀창고)에도 실내 장식을 놓을 수 있음
   ===================================================================== */
/* ---------------- 장식 추가 (35가지) ---------------- */
Object.assign(YARD, {
  /* 🏫 학교 · 놀이 */
  soccerGoal: { name: '축구 골대', price: 9000, cat: 'school', fw: 2, blocks: () => [YB(0.1, 0.3, 0.18, 0.38, 0, 20, '#ffffff'), YB(1.82, 0.3, 1.9, 0.38, 0, 20, '#ffffff'), YB(0.1, 0.3, 1.9, 0.38, 20, 22, '#ffffff'), YB(0.18, 0.38, 1.82, 0.8, 2, 3, '#e8eef2')] },
  basketHoop: { name: '농구대', price: 10000, cat: 'school', blocks: () => [YB(0.44, 0.44, 0.56, 0.56, 0, 30, '#5b5f69'), YB(0.24, 0.4, 0.76, 0.48, 28, 38, '#ffffff'), YB(0.36, 0.48, 0.64, 0.66, 27, 28, '#f39a2b')] },
  pullupBar: { name: '철봉', price: 6000, cat: 'school', fw: 2, blocks: () => [YB(0.2, 0.44, 0.28, 0.56, 0, 22, '#3f8fd0'), YB(1.72, 0.44, 1.8, 0.56, 0, 22, '#3f8fd0'), YB(0.2, 0.47, 1.8, 0.53, 21, 23, '#c0c6d0')] },
  jungleGym: { name: '정글짐', price: 15000, cat: 'school', fw: 2, fd: 2, blocks: () => { const r = []; for (const u of [0.2, 1.0, 1.8]) for (const v of [0.2, 1.0, 1.8]) r.push(YB(u - 0.04, v - 0.04, u + 0.04, v + 0.04, 0, 24, ['#e3484a', '#ffd23a', '#3f8fd0'][Math.round(u)])); r.push(YB(0.2, 0.2, 1.8, 1.8, 12, 13, '#5aa850'), YB(0.2, 0.2, 1.8, 1.8, 24, 25, '#e3484a')); return r; } },
  sandbox: { name: '모래놀이터', price: 7000, cat: 'school', fw: 2, fd: 2, solid: false, flat: true, blocks: () => [YB(0.05, 0.05, 1.95, 1.95, 0, 3, '#c99a64'), YB(0.15, 0.15, 1.85, 1.85, 1, 3.2, '#f2dca0'), YB(0.5, 0.6, 0.7, 0.8, 3.2, 6, '#e3484a'), YB(1.3, 1.2, 1.5, 1.4, 3.2, 5, '#3f8fd0')] },
  flagPole: { name: '깃대', price: 8000, cat: 'school', blocks: () => [YB(0.38, 0.38, 0.62, 0.62, 0, 3, '#9aa3b0'), YB(0.48, 0.48, 0.52, 0.52, 3, 46, '#d9d6dd'), YB(0.52, 0.48, 0.82, 0.52, 36, 45, '#ffffff'), YB(0.6, 0.48, 0.72, 0.52, 39, 42, '#e3484a')] },
  schoolBell: { name: '학교 종', price: 7000, cat: 'school', blocks: () => [YB(0.2, 0.44, 0.28, 0.56, 0, 26, '#7a5236'), YB(0.72, 0.44, 0.8, 0.56, 0, 26, '#7a5236'), YB(0.2, 0.44, 0.8, 0.56, 26, 29, '#7a5236'), YB(0.38, 0.42, 0.62, 0.58, 15, 24, '#e8b84a')] },
  rabbitHutch: { name: '토끼장', price: 9000, cat: 'school', fw: 2, blocks: () => [YB(0.1, 0.2, 1.9, 0.8, 0, 12, '#c99a64'), YB(0.14, 0.22, 1.86, 0.78, 3, 11, '#e8e2d4'), YB(0.06, 0.16, 1.94, 0.84, 12, 15, '#c96a3a'), YB(0.5, 0.7, 0.7, 0.76, 3, 7, '#ffffff'), YB(1.2, 0.7, 1.4, 0.76, 3, 6, '#9aa3b0')] },
  hopscotch: { name: '사방치기 그림', price: 2000, cat: 'school', solid: false, flat: true, blocks: () => [YB(0.1, 0.1, 0.45, 0.45, 0, 0.6, '#ffffff'), YB(0.55, 0.1, 0.9, 0.45, 0, 0.6, '#ffffff'), YB(0.32, 0.55, 0.68, 0.9, 0, 0.6, '#ffffff')] },
  readingStatue: { name: '책 읽는 아이 동상', price: 16000, cat: 'school', blocks: () => [YB(0.24, 0.24, 0.76, 0.76, 0, 8, '#9aa3b0'), YB(0.36, 0.36, 0.64, 0.64, 8, 20, '#b8a070'), YB(0.38, 0.4, 0.62, 0.62, 20, 27, '#c9b080'), YB(0.3, 0.58, 0.7, 0.7, 14, 17, '#f4efe2')] },
  /* ☕ 카페 · 테라스 */
  terraceSet: { name: '테라스 테이블 세트', price: 12000, cat: 'cafe', fw: 2, blocks: () => [YB(0.75, 0.35, 1.25, 0.65, 8, 10, '#ffffff'), YB(0.97, 0.47, 1.03, 0.53, 0, 8, '#5b5f69'), YB(0.15, 0.35, 0.45, 0.65, 0, 6, '#3a3a48'), YB(0.15, 0.3, 0.45, 0.38, 6, 14, '#3a3a48'), YB(1.55, 0.35, 1.85, 0.65, 0, 6, '#3a3a48'), YB(1.55, 0.62, 1.85, 0.7, 6, 14, '#3a3a48'), YB(0.92, 0.42, 1.04, 0.54, 10, 13, '#c96a3a')] },
  cafeSign: { name: '카페 입간판', price: 5000, cat: 'cafe', blocks: () => [YB(0.3, 0.44, 0.7, 0.56, 0, 20, '#3a3a48', '#2a2a36', '#22222e'), YB(0.34, 0.43, 0.66, 0.45, 6, 18, '#f4efe2'), YB(0.38, 0.42, 0.62, 0.44, 12, 14, '#c96a3a')] },
  awningParasol: { name: '줄무늬 파라솔', price: 9000, cat: 'cafe', blocks: () => [YB(0.47, 0.47, 0.53, 0.53, 0, 30, '#ffffff'), YB(0.06, 0.06, 0.94, 0.94, 30, 32, '#e3484a'), YB(0.2, 0.2, 0.8, 0.8, 32, 34, '#ffffff'), YB(0.34, 0.34, 0.66, 0.66, 34, 36, '#e3484a')] },
  coffeeCart: { name: '커피 수레', price: 18000, cat: 'cafe', fw: 2, blocks: () => [YB(0.15, 0.25, 1.85, 0.75, 4, 16, '#7a5236', '#5e3f28', '#4e3420'), YB(0.1, 0.2, 1.9, 0.8, 16, 18, '#c99a64'), YB(0.3, 0.4, 0.6, 0.6, 18, 26, '#9aa3b0'), YB(1.2, 0.35, 1.7, 0.65, 18, 21, '#f4efe2'), YB(0.2, 0.7, 0.4, 0.78, 0, 5, '#3a3a48'), YB(1.6, 0.7, 1.8, 0.78, 0, 5, '#3a3a48')] },
  outdoorSofa: { name: '야외 소파', price: 14000, cat: 'cafe', fw: 2, blocks: () => [YB(0.1, 0.25, 1.9, 0.75, 0, 8, '#c9b48a'), YB(0.1, 0.2, 1.9, 0.32, 8, 16, '#b8a070'), YB(0.3, 0.32, 0.8, 0.7, 8, 11, '#f2d06a'), YB(1.2, 0.32, 1.7, 0.7, 8, 11, '#8fd0ff')] },
  bikeRack: { name: '자전거 거치대', price: 6000, cat: 'cafe', fw: 2, blocks: () => [...[0.3, 0.7, 1.1, 1.5].map(u => YB(u, 0.46, u + 0.08, 0.54, 0, 10, '#9aa3b0')), YB(0.25, 0.46, 1.65, 0.54, 9, 10, '#9aa3b0')] },
  menuBoard: { name: '메뉴 칠판', price: 4500, cat: 'cafe', blocks: () => [YB(0.32, 0.46, 0.38, 0.52, 0, 18, '#7a5236'), YB(0.62, 0.46, 0.68, 0.52, 0, 18, '#7a5236'), YB(0.28, 0.44, 0.72, 0.5, 8, 22, '#2f4a3a'), YB(0.34, 0.43, 0.66, 0.45, 18, 19, '#ffffff'), YB(0.34, 0.43, 0.56, 0.45, 14, 15, '#ffd23a')] },
  lightArch: { name: '전구 아치', price: 13000, cat: 'cafe', fw: 2, light: true, blocks: () => [YB(0.1, 0.44, 0.2, 0.56, 0, 30, '#ffffff'), YB(1.8, 0.44, 1.9, 0.56, 0, 30, '#ffffff'), YB(0.1, 0.46, 1.9, 0.54, 30, 32, '#ffffff'), ...[0.4, 0.8, 1.2, 1.6].map(u => YB(u - 0.05, 0.45, u + 0.05, 0.55, 26, 29, '#ffe27a'))] },
  /* 🪵 울타리 · 길 */
  whiteFence: { name: '하얀 울타리', price: 2500, cat: 'fence', fw: 2, blocks: () => [...[0.15, 0.6, 1.05, 1.5, 1.85].map(u => YB(u - 0.05, 0.46, u + 0.05, 0.54, 0, 14, '#ffffff')), YB(0.1, 0.47, 1.9, 0.53, 9, 11, '#ffffff'), YB(0.1, 0.47, 1.9, 0.53, 4, 6, '#ffffff')] },
  woodFence: { name: '통나무 울타리', price: 2500, cat: 'fence', fw: 2, blocks: () => [YB(0.1, 0.44, 0.2, 0.56, 0, 14, '#7a5236'), YB(1.8, 0.44, 1.9, 0.56, 0, 14, '#7a5236'), YB(0.1, 0.46, 1.9, 0.54, 10, 12, '#a87a4a'), YB(0.1, 0.46, 1.9, 0.54, 4, 6, '#a87a4a')] },
  hedge: { name: '네모 생울타리', price: 3500, cat: 'fence', fw: 2, blocks: () => [YB(0.05, 0.3, 1.95, 0.7, 0, 12, '#3f8a3a', '#357a30', '#2f6a2a'), YB(0.2, 0.34, 1.8, 0.66, 12, 13, '#5aa850')] },
  brickPath: { name: '벽돌길', price: 1500, cat: 'fence', solid: false, flat: true, blocks: () => [YB(0.02, 0.02, 0.48, 0.48, 0, 0.8, '#c96a4a'), YB(0.52, 0.02, 0.98, 0.48, 0, 0.8, '#b85a3a'), YB(0.02, 0.52, 0.48, 0.98, 0, 0.8, '#b85a3a'), YB(0.52, 0.52, 0.98, 0.98, 0, 0.8, '#c96a4a')] },
  woodDeck: { name: '나무 데크', price: 2000, cat: 'fence', solid: false, flat: true, blocks: () => [0, 1, 2, 3].map(i => YB(0.02, 0.02 + i * 0.245, 0.98, 0.24 + i * 0.245, 0, 1, i % 2 ? '#c99a64' : '#b88a54')) },
  flowerCarpet: { name: '꽃 카펫', price: 2500, cat: 'fence', solid: false, flat: true, blocks: () => [YB(0.05, 0.05, 0.95, 0.95, 0, 0.6, '#6fbf5a'), ...[[0.2, 0.2, '#ff9ec4'], [0.6, 0.3, '#ffe27a'], [0.35, 0.65, '#a98ae0'], [0.7, 0.7, '#ffffff']].map(([u, v, c]) => YB(u, v, u + 0.12, v + 0.12, 0.6, 1.4, c))] },
  /* 🏡 마당 소품 */
  swing: { name: '나무 그네', price: 14000, cat: 'island', fw: 2, blocks: () => [YB(0.1, 0.44, 0.2, 0.56, 0, 34, '#7a5236'), YB(1.8, 0.44, 1.9, 0.56, 0, 34, '#7a5236'), YB(0.1, 0.44, 1.9, 0.56, 34, 37, '#7a5236'), YB(0.7, 0.4, 1.3, 0.6, 9, 11, '#c99a64'), YB(0.72, 0.48, 0.74, 0.52, 11, 34, '#d9c8a0'), YB(1.26, 0.48, 1.28, 0.52, 11, 34, '#d9c8a0')] },
  birdFeeder: { name: '새 모이대', price: 3500, cat: 'island', blocks: () => [YB(0.47, 0.47, 0.53, 0.53, 0, 18, '#7a5236'), YB(0.3, 0.3, 0.7, 0.7, 18, 20, '#c99a64'), YB(0.36, 0.36, 0.64, 0.64, 20, 21, '#e8b84a'), YB(0.5, 0.5, 0.6, 0.6, 21, 24, '#7fc4e8')] },
  sundial: { name: '해시계', price: 8000, cat: 'island', blocks: () => [YB(0.3, 0.3, 0.7, 0.7, 0, 10, '#d9d6dd'), YB(0.24, 0.24, 0.76, 0.76, 10, 12, '#c0c6d0'), YB(0.48, 0.3, 0.52, 0.5, 12, 18, '#8a929e')] },
  well: { name: '돌우물', price: 15000, cat: 'island', fw: 2, fd: 2, blocks: () => [YB(0.3, 0.3, 1.7, 1.7, 0, 10, '#8a929e', '#7a808c', '#6a707c'), YB(0.45, 0.45, 1.55, 1.55, 6, 10.2, '#3f6fa8'), YB(0.3, 0.95, 0.4, 1.05, 10, 26, '#7a5236'), YB(1.6, 0.95, 1.7, 1.05, 10, 26, '#7a5236'), YB(0.2, 0.85, 1.8, 1.15, 26, 30, '#c96a3a')] },
  jars: { name: '장독대', price: 10000, cat: 'island', fw: 2, blocks: () => [YB(0.05, 0.25, 1.95, 0.75, 0, 3, '#9aa3b0'), YB(0.2, 0.32, 0.7, 0.68, 3, 14, '#6a4030'), YB(0.3, 0.38, 0.6, 0.62, 14, 16, '#4a2a20'), YB(0.9, 0.34, 1.3, 0.66, 3, 11, '#7a4a38'), YB(1.4, 0.36, 1.8, 0.64, 3, 9, '#6a4030')] },
  gazeboMini: { name: '작은 원두막', price: 25000, cat: 'island', fw: 2, fd: 2, blocks: () => [YB(0.15, 0.15, 1.85, 1.85, 6, 8, '#c99a64'), ...[[0.2, 0.2], [1.7, 0.2], [0.2, 1.7], [1.7, 1.7]].map(([u, v]) => YB(u, v, u + 0.1, v + 0.1, 0, 30, '#7a5236')), YB(0.05, 0.05, 1.95, 1.95, 30, 33, '#c9a050'), YB(0.35, 0.35, 1.65, 1.65, 33, 38, '#d9b060'), YB(0.7, 0.7, 1.3, 1.3, 38, 42, '#e8c070')] },
  beachChairs: { name: '선베드 두 개', price: 11000, cat: 'island', fw: 2, blocks: () => [YB(0.1, 0.2, 0.85, 0.8, 0, 5, '#ffffff'), YB(0.1, 0.2, 0.3, 0.8, 5, 12, '#3f8fd0'), YB(1.15, 0.2, 1.9, 0.8, 0, 5, '#ffffff'), YB(1.15, 0.2, 1.35, 0.8, 5, 12, '#ff9ec4')] },
  tent: { name: '작은 텐트', price: 16000, cat: 'island', fw: 2, fd: 2, blocks: () => [YB(0.2, 0.2, 1.8, 1.8, 0, 6, '#f2d06a'), YB(0.35, 0.35, 1.65, 1.65, 6, 14, '#e8b84a'), YB(0.55, 0.55, 1.45, 1.45, 14, 20, '#d9a63a'), YB(0.8, 1.7, 1.2, 1.82, 0, 10, '#7a5236')] },
});
Object.assign(YARD_CATS, { school: '🏫 학교 · 놀이', cafe: '☕ 카페 · 테라스', fence: '🪵 울타리 · 길' });
/* 실내 장식 (내 일터 안에 놓기) */
const YARD_IN = {
  inPlant: { name: '큰 화분', price: 4000, blocks: () => [YB(0.32, 0.32, 0.68, 0.68, 0, 9, '#c4704e'), YB(0.2, 0.2, 0.8, 0.8, 9, 24, '#4f9e4a', '#3f8a3a', '#357a30')] },
  inShelf: { name: '원두 선반', price: 8000, blocks: () => [YB(0.1, 0.3, 0.9, 0.7, 0, 26, '#a87a4a', '#8a5a3a', '#7a4a2a'), ...[6, 13, 20].map(z => YB(0.16, 0.66, 0.84, 0.72, z, z + 4, '#c96a3a'))] },
  inCake: { name: '디저트 진열장', price: 15000, blocks: () => [YB(0.1, 0.25, 0.9, 0.75, 0, 10, '#f4efe2'), YB(0.12, 0.27, 0.88, 0.73, 10, 20, '#bfe8f7'), YB(0.25, 0.4, 0.45, 0.6, 11, 15, '#ff9ec4'), YB(0.55, 0.4, 0.75, 0.6, 11, 14, '#c96a3a')] },
  inMachine: { name: '커피 머신', price: 20000, blocks: () => [YB(0.2, 0.3, 0.8, 0.7, 0, 10, '#7a5236'), YB(0.26, 0.34, 0.74, 0.66, 10, 22, '#c0c6d0', '#9aa3b0', '#8a929e'), YB(0.4, 0.6, 0.6, 0.68, 14, 17, '#3a3a48')] },
  inTable: { name: '작은 원형 테이블', price: 7000, blocks: () => [YB(0.46, 0.46, 0.54, 0.54, 0, 10, '#5b5f69'), YB(0.2, 0.2, 0.8, 0.8, 10, 12, '#ffffff'), YB(0.44, 0.44, 0.56, 0.56, 12, 15, '#ff9ec4')] },
  inStool: { name: '바 의자', price: 4000, blocks: () => [YB(0.46, 0.46, 0.54, 0.54, 0, 12, '#3a3a48'), YB(0.3, 0.3, 0.7, 0.7, 12, 14, '#c96a3a')] },
  inRug: { name: '동그란 러그', price: 5000, solid: false, flat: true, blocks: () => [YB(0.05, 0.05, 0.95, 0.95, 0, 0.6, '#e8b84a'), YB(0.2, 0.2, 0.8, 0.8, 0.6, 0.9, '#f2d06a')] },
  inBooks: { name: '책 더미 · 화분', price: 3500, blocks: () => [YB(0.2, 0.3, 0.6, 0.7, 0, 4, '#3f8fd0'), YB(0.22, 0.32, 0.58, 0.68, 4, 7, '#e3484a'), YB(0.24, 0.34, 0.56, 0.66, 7, 9, '#ffd23a'), YB(0.64, 0.4, 0.84, 0.6, 0, 7, '#c4704e'), YB(0.62, 0.38, 0.86, 0.62, 7, 13, '#5aa850')] },
  inLamp: { name: '스탠드 조명', price: 6000, light: true, blocks: () => [YB(0.4, 0.4, 0.6, 0.6, 0, 2, '#3a3a48'), YB(0.48, 0.48, 0.52, 0.52, 2, 24, '#3a3a48'), YB(0.34, 0.34, 0.66, 0.66, 24, 30, '#fff1c2')] },
  inBoard: { name: '알림판', price: 5000, blocks: () => [YB(0.15, 0.44, 0.85, 0.52, 6, 22, '#c99a64'), YB(0.2, 0.43, 0.4, 0.45, 12, 18, '#ffffff'), YB(0.5, 0.43, 0.75, 0.45, 10, 16, '#ffe27a'), YB(0.2, 0.46, 0.26, 0.5, 0, 6, '#7a5236'), YB(0.74, 0.46, 0.8, 0.5, 0, 6, '#7a5236')] },
  inGlobe: { name: '지구본', price: 6000, blocks: () => [YB(0.4, 0.4, 0.6, 0.6, 0, 3, '#7a5236'), YB(0.48, 0.48, 0.52, 0.52, 3, 8, '#c9a050'), YB(0.34, 0.34, 0.66, 0.66, 8, 18, '#3f8fd0'), YB(0.44, 0.36, 0.6, 0.5, 10, 16, '#5aa850')] },
  inFish: { name: '금붕어 어항', price: 7000, blocks: () => [YB(0.3, 0.3, 0.7, 0.7, 0, 8, '#a87a4a'), YB(0.32, 0.32, 0.68, 0.68, 8, 18, '#bfe8f7'), YB(0.45, 0.45, 0.55, 0.55, 11, 13, '#f39a2b')] },
};
for (const [k, F] of Object.entries(YARD_IN)) YARD[k] = Object.assign({ cat: 'indoor', indoor: true }, F);
YARD_CATS.indoor = '🏠 실내 장식';
/* ---------------- 어디를 꾸밀 수 있나 ---------------- */
function yardWorkMap() { const pl = JOBS[S.job] && JOBS[S.job].place; return pl && pl !== 'home' && MAPS['in_' + pl] ? 'in_' + pl : null; }
function yardMapOk(id) { return id === 'island' || id === yardWorkMap(); }
const yardMapOf = (p) => p.map || 'island';
/* ---------------- 놓기 · 그리기 (여러 장소) ---------------- */
yardApply = function () {
  if (!S) return;
  for (const m of Object.values(MAPS)) {
    if (!m.objects.some(o => o.kind === 'yd') && !yardState().placed.some(p => yardMapOf(p) === m.id)) continue;
    for (const o of m.objects) if (o.kind === 'yd' && o.solid) for (const [x, y] of yFoot(o)) m.block[y * m.W + x] = 0;
    m.objects = m.objects.filter(o => o.kind !== 'yd');
    for (const p of yardState().placed) {
      if (yardMapOf(p) !== m.id) continue;
      const F = YARD[p.k]; if (!F) continue; const [fw, fh] = yardFoot(p.k, p.rot || 0);
      const o = { kind: 'yd', k: p.k, x: p.x, y: p.y, rot: p.rot || 0, fw, fh, solid: F.solid !== false, flat: !!F.flat, light: !!F.light, yid: p.id };
      m.objects.push(o);
      if (o.solid) for (const [x, y] of yFoot(o)) m.block[y * m.W + x] = 1;
    }
    if (m.exit) m.block[m.exit[1] * m.W + m.exit[0]] = 0;
  }
  if (typeof autoSeats === 'function') try { autoSeats(); } catch (e) { }
};
const _yardCanPlaceIsland = yardCanPlace;
yardCanPlace = function (k, x, y, rot, ignoreId) {
  const m = M, F = YARD[k];
  if (!m || !yardMapOk(m.id)) return '여기서는 꾸밀 수 없어요';
  if (m.interior) {
    if (!F.indoor) return '실내에는 「실내 장식」만 놓을 수 있어요';
    const [fw, fh] = yardFoot(k, rot), tiles = [];
    for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) tiles.push([xx, yy]);
    const ign = ignoreId ? m.objects.find(o => o.yid === ignoreId) : null, ignT = ign ? yFoot(ign) : [];
    for (const [a, b] of tiles) {
      if (!inMap(a, b, m)) return '방 밖이에요';
      if (m.exit && Math.abs(m.exit[0] - a) <= 1 && Math.abs(m.exit[1] - b) <= 1) return '출입문 앞은 비워 둬야 해요';
      if (m.block[b * m.W + a] && !ignT.some(([p, q]) => p === a && q === b)) return '다른 물건이 있어요';
      if (Math.floor(G.player.x) === a && Math.floor(G.player.y) === b) return '내가 서 있는 자리예요';
    }
    if (F.solid === false) return null;
    // 출입문에서 가게 기능(주문대 등) · 손님 자리까지 길이 이어지는지
    const saved = tiles.map(([a, b]) => m.block[b * m.W + a]); tiles.forEach(([a, b]) => m.block[b * m.W + a] = 1); ignT.forEach(([a, b]) => m.block[b * m.W + a] = 0);
    let ok = true;
    try {
      const seen = new Uint8Array(m.W * m.H), q = [[m.exit[0], m.exit[1] - 1]]; if (inMap(q[0][0], q[0][1], m)) seen[q[0][1] * m.W + q[0][0]] = 1;
      while (q.length) { const [x0, y0] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x0 + dx, Y = y0 + dy; if (!inMap(X, Y, m) || seen[Y * m.W + X] || m.block[Y * m.W + X]) continue; seen[Y * m.W + X] = 1; q.push([X, Y]); } }
      const near = (x0, y0) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inMap(x0 + dx, y0 + dy, m) && seen[(y0 + dy) * m.W + x0 + dx]);
      for (const o of m.objects) if (o.kind === 'furn' && o.act) { const ft = yFoot(o); if (!ft.some(([a, b]) => near(a, b))) { ok = false; break; } }
      if (ok) for (const v of (m.visit || [])) if (!near(Math.floor(v[0]), Math.floor(v[1]))) { ok = false; break; }
    } finally { tiles.forEach(([a, b], i) => m.block[b * m.W + a] = saved[i]); ignT.forEach(([a, b]) => { const o = ign; if (o && o.solid) m.block[b * m.W + a] = 1; }); }
    return ok ? null : '여기 놓으면 손님이 다닐 길이 막혀요';
  }
  if (F.indoor) return '실내 장식은 내 일터 안에 놓아요';
  // 섬: 큰길 · 부두만 피하고, 돌길 광장 · 흙길 · 모래밭 · 운동장은 OK
  const [fw, fh] = yardFoot(k, rot);
  for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) { const t = tileAt(xx, yy, m); if (t === T.PATH) return '큰길 위에는 놓을 수 없어요'; if (t === T.WOOD) return '부두 위에는 놓을 수 없어요'; }
  const tmp = {}, conv = [];
  for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) { const i = yy * m.W + xx, t = m.tiles[i]; if (t === T.ALLEY || t === T.BOARD || t === 14) { conv.push([i, t]); m.tiles[i] = T.GRASS; } }
  try { return _yardCanPlaceIsland(k, x, y, rot, ignoreId); } finally { for (const [i, t] of conv) m.tiles[i] = t; }
};
yardTap = function (x, y) {
  const Y = G.yard, st = yardState(), m = M;
  const hit = m.objects.find(o => o.kind === 'yd' && yFoot(o).some(([a, b]) => a === x && b === y));
  if (hit && !Y.placing) { Y.sel = hit.yid; yardBar(); return; }
  if (!Y.placing) { Y.sel = null; yardBar(); return; }
  const k = Y.placing; if (!(st.inv[k] > 0)) { Y.placing = null; yardBar(); return; }
  if (st.placed.length >= YARD_MAX) { toast(`장식은 모두 ${YARD_MAX}개까지 놓을 수 있어요`); return; }
  const why = yardCanPlace(k, x, y, Y.rot || 0); if (why) { toast(why); return; }
  st.inv[k]--; st.placed.push({ id: 'y' + st.seq++, k, x, y, rot: Y.rot || 0, map: m.id === 'island' ? undefined : m.id }); yardApply(); Sound.sfx('tap'); save();
  if (!(st.inv[k] > 0)) Y.placing = null;
  yardBar();
  if (!S.paid.yardFirst) { S.paid.yardFirst = S.day; memRecent('decor', '섬을 꾸몄다'); typeof addRumor === 'function' && addRumor('decor', {}, { key: 'yard1' }); }
};
yardStart = function () {
  const P = G.player;
  if (G.busy || G.decor || G.dev) return;
  if (!yardMapOk(P.map)) {
    if (P.map === 'in_home') { toast('집 안은 「꾸미기」로 꾸며요. 바깥으로 나가서 섬을 꾸밀게요'); }
    const b = MAPS.island.buildings.find(x => 'in_' + x.id === P.map);
    if (b) { goMap('island', b.doorTile[0] + 0.5, b.doorTile[1] + 0.5); setTimeout(() => yardStart(), 1300); return; }
    toast('섬이나 내 일터 안에서 꾸밀 수 있어요'); return;
  }
  if (P.seat) standUpPlayer(); P.stop();
  G.yard = { placing: null, sel: null };
  document.body.classList.add('yardOn');
  let bar = $('#yardBar'); if (!bar) { bar = document.createElement('div'); bar.id = 'yardBar'; $('#game').appendChild(bar); }
  bar.classList.remove('hidden'); yardBar();
  const st = yardState();
  if (!S.paid.yardStarter) { S.paid.yardStarter = S.day; for (const [k, n] of [['potFlower', 2], ['benchWood', 1], ['whiteFence', 2], ['brickPath', 4], ['inPlant', 1]]) st.inv[k] = (st.inv[k] || 0) + n; toast('🎁 꾸미기 선물: 꽃 화분 2 · 나무 벤치 · 하얀 울타리 2 · 벽돌길 4 · 큰 화분'); }
  toast(P.map === 'island' ? '🌳 섬 꾸미기 — 「🎨 장식 고르기」에서 고르고 땅을 눌러 놓아요' : `🏠 ${M.name} 꾸미기 — 「🎨 장식 고르기」에서 실내 장식을 골라요`);
};
yardBar = function () {
  const Y = G.yard, bar = $('#yardBar'); if (!Y || !bar) return;
  const st = yardState(), sel = Y.sel && st.placed.find(p => p.id === Y.sel), here = st.placed.filter(p => yardMapOf(p) === M.id).length;
  const info = Y.placing ? `「${YARD[Y.placing].name}」 놓을 곳을 누르세요 (남은 ${st.inv[Y.placing] || 0}개)` : sel ? `선택: ${YARD[sel.k].name} — 돌리기 · 넣기` : `${M.id === 'island' ? '섬' : M.name}에 놓은 장식 ${here}개 · 전체 ${st.placed.length}/${YARD_MAX}`;
  bar.innerHTML = `<div id="yardInfo">${info}</div><div class="dbtns"><button data-a="pick" class="ok">🎨 장식 고르기</button><button data-a="rot" ${sel || Y.placing ? '' : 'disabled'}>↻ 돌리기</button><button data-a="put" ${sel ? '' : 'disabled'}>⬇ 넣기</button><button data-a="done">✔ 끝내기</button></div>`;
  bar.querySelectorAll('button').forEach(b => b.onclick = () => { Sound.sfx('tap'); yardBtn(b.dataset.a); });
};
const _yardBtn0 = yardBtn;
yardBtn = function (a) { if (a === 'pick' || a === 'bag' || a === 'shop') return yardPicker(); return _yardBtn0(a); };
/* 장식 고르기: 모든 장식 · 갖고 있으면 바로 놓기, 없으면 바로 사서 놓기 */
function yardPicker(cat) {
  const st = yardState(), indoor = !!M.interior;
  const cats = Object.keys(YARD_CATS).filter(c => indoor ? c === 'indoor' : c !== 'indoor');
  cat = cats.includes(cat) ? cat : (indoor ? 'indoor' : (Object.keys(st.inv).some(k => st.inv[k] > 0 && YARD[k] && !YARD[k].indoor) ? 'mine' : cats[0]));
  const tabs = `<div class="ptabs">${indoor ? '' : `<button data-c="mine" class="${cat === 'mine' ? 'on' : ''}">📦 갖고 있는 것</button>`}${cats.map(k => `<button data-c="${k}" class="${k === cat ? 'on' : ''}">${YARD_CATS[k]}</button>`).join('')}</div>`;
  const keys = cat === 'mine' ? Object.keys(st.inv).filter(k => st.inv[k] > 0 && YARD[k] && !YARD[k].indoor) : Object.keys(YARD).filter(k => YARD[k].cat === cat);
  openPanel(indoor ? `🏠 ${M.name} 꾸미기` : '🌳 섬 꾸미기', tabs + `<p class="psub">보유 <b>${fmtMoney(S.money)}</b> · 갖고 있는 장식은 눌러서 바로 놓고, 없는 건 사서 바로 놓아요</p><div class="pgrid">${keys.length ? keys.map(k => { const n = st.inv[k] || 0; return `<button class="pcard" data-k="${k}"><img src="${yardPreview(k, 2)}"><b>${YARD[k].name}</b><small>${n ? `📦 ${n}개 — 놓기` : fmtMoney(YARD[k].price)}</small></button>`; }).join('') : '<p class="psub">아직 없어요. 옆 탭에서 골라 보세요.</p>'}</div>`, (body) => {
    body.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => { Sound.sfx('tap'); yardPicker(b.dataset.c); });
    body.querySelectorAll('.pcard').forEach(b => b.onclick = () => {
      const k = b.dataset.k, F = YARD[k], Y = G.yard;
      const place = () => { if (!G.yard) return; closePanel(); G.yard.placing = k; G.yard.rot = 0; G.yard.sel = null; yardBar(); toast(`「${F.name}」 놓을 곳을 눌러요`); };
      if ((st.inv[k] || 0) > 0) { Sound.sfx('tap'); place(); return; }
      const [fw, fh] = yardFoot(k, 0);
      confirmBuy(F.name, F.price, yardPreview(k, 4), `${fw}×${fh}칸 · ${F.indoor ? '실내' : '야외'} 장식${F.light ? ' · 밤에 불이 켜져요' : ''}${F.solid === false ? ' · 밟고 지나갈 수 있어요' : ''}`, () => { st.inv[k] = (st.inv[k] || 0) + 1; }, () => { if (G.yard) place(); else yardPicker(cat); });
    });
  });
}
/* 선택 표시 (실내에서도) */
const _renderYard2 = render;
render = function (dt) {
  _renderYard2(dt);
  const Y = G.yard; if (!Y || M.id === 'island') return;
  const g = R.v, dia = (x, y, col) => { const [sx, sy] = iso(x, y); for (let r = 0; r < 8; r++) { prect(g, sx - 2 - r * 2, sy + r, 4 + r * 4, 1, col); prect(g, sx - 2 - r * 2, sy + 15 - r, 4 + r * 4, 1, col); } };
  const sel = Y.sel && M.objects.find(o => o.yid === Y.sel); if (sel) for (const [x, y] of yFoot(sel)) dia(x, y, 'rgba(120,220,140,0.5)');
};
/* 꾸미기 중 이동 · 다른 장소로 가면 끝내기 */
const _goMapYard2 = goMap;
goMap = async function (...a) { if (G.yard) yardEnd(); return _goMapYard2(...a); };
/* 메뉴 첫 화면에 「🎨 꾸미기」 바로가기 · 일터 안에서는 「가게 꾸미기」 */
const _openSheetYard2 = openSheet;
openSheet = function (o) {
  if (o && o.title === '메뉴' && o.items && !o.items.find(i => i.label === '꾸미기')) {
    const items = o.items.slice(); items.splice(5, 0, { icon: '🎨', label: '꾸미기', note: '섬 · 일터', onClick: () => { if (G.player.map === 'in_home' && typeof openDecor === 'function') openSheet({ title: '🎨 무엇을 꾸밀까요?', cols: 2, items: [{ icon: '🛋', label: '집 안 꾸미기', onClick: openDecor }, { icon: '🌳', label: '섬 꾸미기', onClick: yardStart }] }); else yardStart(); } });
    o = Object.assign({}, o, { items });
  }
  if (o && o.title === '🏠 집' && o.items) o = Object.assign({}, o, { items: o.items.map(i => i.label === '섬 꾸미기' ? Object.assign({}, i, { onClick: yardStart, note: '섬 · 일터' }) : i) });
  return _openSheetYard2(o);
};
/* 일터 안: 행동 버튼에 「가게 꾸미기」 */
const _computeActionYard2 = computeAction;
computeAction = function () {
  const a = _computeActionYard2();
  try {
    if (G.yard || G.dev || !S || G.player.map !== yardWorkMap() || G.working) return a;
    const c = { label: `${M.name} 꾸미기`, icon: '🎨', fn: yardStart };
    if (!a) return c;
    if (a.cands) { if (!a.cands.find(x => x.icon === '🎨')) a.cands.push(c); return a; }
    return Object.assign({}, a, { cands: [a, c] });
  } catch (e) { return a; }
};
