// 페르녹스 전역 (Alpha 0.3): 돔시티 관광구역 · 루비웨이 · 우주항구 · 궤도정거장 · 제3/4/6행성 · 외곽 수색구역
// 각 지역의 이동 안내 단말(travelkiosk)에서 travel 목록으로 이동한다.
'use strict';
(() => {
  const M = PX.MAPS;
  function out(id, o) {
    const m = Object.assign({ id, kind: 'out', buildings: [], decor: [], zones: [], roads: [], spots: {}, travel: [], dome: true }, o);
    if (o.edge !== 'none') {
      const g = o.edge !== 'rock';
      m.walls = [{ x: 0, y: 0, w: m.w, d: 1, glass: g }, { x: 0, y: 1, w: 1, d: m.h - 1, glass: g }, { x: m.w - 1, y: 1, w: 1, d: m.h - 1, glass: g }, { x: 1, y: m.h - 1, w: m.w - 2, d: 1, glass: g }];
    } else m.walls = [];
    m.decor.push(['travelkiosk', m.arrive[0] + 1, m.arrive[1] - 1, 0]);
    M[id] = m;
    return m;
  }
  function room(id, o) { M[id] = Object.assign({ id, kind: 'in', wallH: 52 }, o); }
  const DOME = (mins = 20) => ({ to: 'dome', label: '🚌 돔시티 연구·주거구역', mins });
  const PORT = (mins) => ({ to: 'port', label: '🚀 페르녹스 우주항구', mins });

  // ================= 돔시티 관광구역 =================
  const lake = out('lake', { name: '인공호수 공원', w: 40, h: 34, fill: 'domegrass', arrive: [20, 30], lore: 'LB15', travel: [DOME(20)] });
  lake.zones = [{ t: 'sand', x0: 10, y0: 8, x1: 29, y1: 22 }, { t: 'water', x0: 12, y0: 10, x1: 27, y1: 20 }, { t: 'boardwalk', x0: 19, y0: 15, x1: 20, y1: 21 }, { t: 'concrete', x0: 6, y0: 26, x1: 34, y1: 27 }, { t: 'concrete', x0: 6, y0: 5, x1: 7, y1: 27 }, { t: 'concrete', x0: 33, y0: 5, x1: 34, y1: 27 }, { t: 'concrete', x0: 6, y0: 4, x1: 34, y1: 5 }];
  lake.decor.push(['fishspot', 19, 15, 0], ['fishspot', 11, 15, 0], ['stage', 34, 8, 1], ['benchout', 8, 23, 0], ['benchout', 30, 23, 0], ['benchout', 14, 24, 0], ['benchout', 24, 24, 0],
    ['parasol', 4, 29, 0], ['parasol', 9, 30, 0], ['parasol', 30, 29, 0], ['vending', 36, 26, 0], ['kiosk', 23, 29, 0]);
  for (const [x, y] of [[3, 3], [3, 12], [3, 20], [37, 3], [37, 14], [37, 20], [14, 2], [26, 2], [10, 28], [29, 31]]) lake.decor.push(['tree', x, y, 0]);
  for (const [x, y] of [[7, 3], [33, 3], [7, 25], [33, 25], [20, 25]]) lake.decor.push(['streetlamp', x, y, 0]);
  lake.spots = { 'lake.pier': [19, 21, 2, 'stand'], 'lake.bench': [16, 26, 0, 'stand'] };

  const farm = out('farm', { name: '농업돔 체험장', w: 34, h: 28, fill: 'domegrass', arrive: [17, 24], lore: 'LB19', travel: [DOME(25)] });
  farm.zones = [{ t: 'dirt', x0: 3, y0: 3, x1: 21, y1: 19 }, { t: 'concrete', x0: 3, y0: 21, x1: 31, y1: 22 }, { t: 'concrete', x0: 23, y0: 3, x1: 24, y1: 21 }];
  for (let y = 4; y <= 18; y += 2) for (let x = 4; x <= 20; x += 2) farm.decor.push(['crop', x, y, 0]);
  farm.decor.push(['stall', 26, 6, 0], ['stall', 26, 10, 0], ['benchout', 27, 15, 0], ['bigplant', 30, 3, 0], ['watertank', 27, 2, 0], ['solar', 26, 18, 0], ['crates', 29, 17, 0]);
  farm.shops = { stall: 'farm' };

  const glasshouse = out('glasshouse', { name: '유리꽃 온실', w: 28, h: 24, fill: 'glassfloor', arrive: [14, 20], lore: 'LB22', travel: [DOME(15)] });
  glasshouse.zones = [{ t: 'domegrass', x0: 2, y0: 2, x1: 9, y1: 9 }, { t: 'domegrass', x0: 18, y0: 2, x1: 25, y1: 9 }, { t: 'domegrass', x0: 2, y0: 12, x1: 9, y1: 17 }, { t: 'domegrass', x0: 18, y0: 12, x1: 25, y1: 17 }];
  for (const [x, y] of [[4, 4], [7, 6], [20, 4], [23, 6], [4, 13], [7, 15], [20, 13], [23, 15]]) glasshouse.decor.push(['flowerbed', x, y, 0]);
  glasshouse.decor.push(['specimen', 13, 4, 0], ['specimen', 14, 4, 0], ['benchout', 12, 10, 0], ['benchout', 12, 15, 0], ['glowflower', 11, 7, 0], ['glowflower', 16, 7, 0], ['tree2', 12, 1, 0]);

  const glowpath = out('glowpath', { name: '발광초 온실길', w: 34, h: 14, fill: 'domegrass', arrive: [4, 7], lore: 'LB60', amb: 0.5, travel: [DOME(15)] });
  glowpath.zones = [{ t: 'glassfloor', x0: 1, y0: 6, x1: 32, y1: 7 }];
  for (let x = 3; x <= 31; x += 2) glowpath.decor.push(['glowflower', x, 4, 0], ['glowflower', x + 1, 9, 0]);
  for (let x = 6; x <= 30; x += 8) glowpath.decor.push(['lantern', x, 5, 0]);
  glowpath.decor.push(['benchout', 14, 9, 0], ['benchout', 24, 9, 0], ['tree', 2, 2, 0], ['tree', 31, 11, 0]);

  const bluegarden = out('bluegarden', { name: '푸른기압 정원', w: 24, h: 22, fill: 'domegrass', arrive: [12, 18], lore: 'LB65', tint: ['#5fa8ff', 0.1], travel: [DOME(15)] });
  bluegarden.zones = [{ t: 'water', x0: 8, y0: 6, x1: 15, y1: 11 }, { t: 'glassfloor', x0: 3, y0: 14, x1: 20, y1: 15 }];
  bluegarden.decor.push(['benchout', 5, 12, 0], ['benchout', 16, 12, 0], ['bigplant', 3, 3, 0], ['bigplant', 20, 3, 0], ['tree2', 4, 7, 0], ['tree2', 18, 7, 0], ['glowflower', 7, 13, 0], ['glowflower', 16, 9, 0]);

  const hill = out('hill', { name: '관람언덕', w: 32, h: 26, fill: 'domegrass', arrive: [16, 22], lore: 'LB23', sunsetView: true, travel: [DOME(20)] });
  hill.zones = [{ t: 'plaza', x0: 9, y0: 4, x1: 22, y1: 10 }, { t: 'concrete', x0: 15, y0: 11, x1: 16, y1: 21 }];
  hill.decor.push(['telescope', 11, 5, 0], ['telescope', 15, 4, 0], ['telescope', 19, 5, 0], ['benchout', 10, 8, 0], ['benchout', 19, 8, 0], ['railing', 9, 3, 0], ['railing', 13, 3, 0], ['railing', 17, 3, 0], ['vending', 22, 9, 0], ['stall', 6, 12, 0], ['kiosk', 23, 6, 0]);
  for (const [x, y] of [[3, 4], [4, 15], [27, 5], [27, 16], [8, 20], [24, 20]]) hill.decor.push(['tree', x, y, 0]);
  hill.shops = { stall: 'souvenir' };

  const silver = out('silverdesert', { name: '은사막 전망대', w: 36, h: 28, fill: 'silversand', dome: false, edge: 'rock', arrive: [18, 24], lore: 'LB63', sunsetView: true, travel: [DOME(40)] });
  silver.zones = [{ t: 'boardwalk', x0: 11, y0: 4, x1: 24, y1: 9 }, { t: 'concrete', x0: 17, y0: 10, x1: 18, y1: 23 }];
  silver.decor.push(['telescope', 13, 5, 0], ['telescope', 18, 4, 0], ['telescope', 22, 5, 0], ['railing', 11, 3, 0], ['railing', 15, 3, 0], ['railing', 19, 3, 0], ['benchout', 13, 8, 0], ['benchout', 20, 8, 0], ['rover', 23, 18, 0]);
  for (const [x, y] of [[4, 5], [6, 14], [28, 6], [30, 15], [8, 22], [27, 22], [3, 10], [32, 11]]) silver.decor.push([(x + y) % 2 ? 'rockbig' : 'rock', x, y, 0]);

  const beach = out('beach', { name: '흰모래 해변돔', w: 40, h: 30, fill: 'whitesand', arrive: [20, 4], lore: 'LB69', travel: [DOME(25)] });
  beach.zones = [{ t: 'water', x0: 1, y0: 21, x1: 38, y1: 28 }, { t: 'boardwalk', x0: 4, y0: 2, x1: 36, y1: 3 }];
  for (const [x, y] of [[6, 10], [14, 12], [24, 10], [32, 13]]) beach.decor.push(['parasol', x, y, 0], ['beachchair', x + 2, y + 1, 0], ['beachchair', x - 1, y + 1, 0]);
  beach.decor.push(['sandpile', 18, 17, 0], ['sandpile', 28, 18, 0], ['sandpile', 9, 18, 0], ['vending', 36, 5, 0], ['stall', 30, 5, 0], ['guardpost', 2, 14, 0]);
  beach.shops = { stall: 'beach' };

  const camp = out('camp', { name: '안정구역 캠핑장', w: 36, h: 30, fill: 'sand', dome: false, edge: 'rock', arrive: [18, 26], lore: 'LB25', travel: [DOME(40)] });
  camp.zones = [{ t: 'grass', x0: 4, y0: 4, x1: 31, y1: 21 }, { t: 'dirt', x0: 15, y0: 11, x1: 20, y1: 15 }];
  camp.decor.push(['campfire', 17, 13, 0], ['logseat', 15, 11, 0], ['logseat', 18, 15, 2], ['logseat', 14, 14, 3], ['logseat', 20, 12, 1],
    ['dometent', 6, 6, 0], ['dometent', 11, 5, 0], ['dometent', 24, 6, 0], ['dometent', 28, 10, 0], ['dometent', 6, 16, 0], ['stove', 24, 17, 0], ['crates', 27, 17, 0], ['lantern', 13, 9, 0], ['lantern', 22, 9, 0], ['lantern', 22, 17, 0]);
  for (const [x, y] of [[3, 3], [31, 3], [3, 22], [32, 22], [9, 24], [26, 24]]) camp.decor.push(['tree', x, y, 0]);

  const bridge = out('bridge', { name: '빛먼지 산책교', w: 42, h: 12, fill: 'void', edge: 'none', arrive: [3, 6], lore: 'LB64', fx: 'lightdust', amb: 0.25, bg: '#0d0a1c', travel: [{ to: 'plaza', label: '🚶 중앙광장', mins: 10 }, { to: 'port', label: '🚶 우주항구 구역', mins: 15 }] });
  bridge.zones = [{ t: 'glassfloor', x0: 1, y0: 4, x1: 40, y1: 7 }];
  for (let x = 6; x <= 36; x += 6) bridge.decor.push(['streetlamp', x, 4, 0], ['railing', x - 2, 7, 0]);
  bridge.decor.push(['benchout', 13, 7, 0], ['benchout', 25, 7, 0]);

  const corridor = out('corridor', { name: '인공노을 회랑', w: 38, h: 12, fill: 'glassfloor', arrive: [3, 6], lore: 'LB59', sunsetView: true, travel: [{ to: 'plaza', label: '🚶 중앙광장', mins: 10 }, { to: 'farm', label: '🚶 농업돔 방향', mins: 15 }] });
  corridor.zones = [{ t: 'mosaic', x0: 1, y0: 5, x1: 36, y1: 6 }];
  for (let x = 6; x <= 27; x += 7) corridor.decor.push(['benchout', x, 8, 0], ['bigplant', x + 3, 2, 0], ['telescope', x + 1, 2, 0]);

  // ================= 루비웨이 (성인 · 직접 선택) =================
  const ruby = out('rubyway', { name: '루비웨이', w: 36, h: 28, fill: 'neonfloor', arrive: [18, 24], adult: true, amb: 0.4, tint: ['#ff6bd5', 0.08], travel: [{ to: 'plaza', label: '🚶 중앙광장', mins: 10 }] });
  ruby.buildings = [
    { id: 'r_perfume', name: '퍼퓸덴', to: 'perfume', x: 3, y: 3, w: 7, d: 6, h: 38, wall: '#4a2f4a', roof: '#2a1f2a', stripe: '#ff9ed2', icon: 'drop', door: { f: 'R', u: 2 }, awning: '#ff9ed2', hours: ['14:00', '02:00'] },
    { id: 'r_dice', name: '다이스키스', to: 'dice', x: 3, y: 12, w: 7, d: 6, h: 40, wall: '#2a2f4a', roof: '#1a1f2a', stripe: '#ffd166', icon: 'star', door: { f: 'R', u: 2 }, awning: '#ffd166', hours: ['18:00', '05:00'] },
    { id: 'r_mask', name: '실버마스크', to: 'mask', x: 3, y: 20, w: 7, d: 5, h: 40, wall: '#3a3f4a', roof: '#c9ccd6', stripe: '#c9ccd6', icon: 'star', door: { f: 'R', u: 2 }, hours: ['18:00', '05:00'] },
    { id: 'r_midnight', name: '미드나잇 룸', to: 'midnight', x: 25, y: 3, w: 8, d: 6, h: 42, wall: '#2a1f3f', roof: '#1a1428', stripe: '#9b5fd0', icon: 'heart', door: { f: 'L', u: 3 }, hours: ['18:00', '05:00'] },
    { id: 'r_inn', name: '돔시티 은밀숙소', to: 'inn', x: 25, y: 12, w: 8, d: 6, h: 56, wall: '#5a2f3f', roof: '#3a1f2a', stripe: '#ff6b8b', icon: 'bed', door: { f: 'L', u: 3 } },
    { id: 'r_show', name: '블라인드 쇼룸', to: 'showroom', x: 13, y: 3, w: 8, d: 5, h: 40, wall: '#3a2a4a', roof: '#2a1f3a', stripe: '#ff8bea', icon: 'star', door: { f: 'L', u: 3 }, hours: ['19:00', '02:00'] },
    { id: 'r_pub', name: '술집 골목', to: 'pub', x: 25, y: 20, w: 8, d: 5, h: 40, wall: '#4a3a30', roof: '#2a2020', stripe: '#ffb070', icon: 'cup', door: { f: 'L', u: 3 }, awning: '#ffb070', hours: ['18:00', '03:00'] },
    { id: 'r_shower', name: '새벽 샤워실', to: 'dawnshower', x: 13, y: 11, w: 6, d: 5, h: 34, wall: '#3f5a6a', roof: '#2a3f4a', stripe: '#7fe3ff', icon: 'drop', door: { f: 'L', u: 2 }, hours: ['02:00', '08:00'] },
  ];
  for (const [x, y] of [[12, 10], [22, 10], [12, 18], [22, 18]]) ruby.decor.push(['neonsign', x, y, 0]);
  for (let y = 4; y <= 24; y += 5) ruby.decor.push(['lantern', 11, y, 0], ['lantern', 23, y, 0]);
  ruby.zones = [{ t: 'darktile', x0: 11, y0: 1, x1: 23, y1: 27 }, { t: 'mosaic', x0: 13, y0: 17, x1: 21, y1: 25 }, { t: 'darktile', x0: 10, y0: 4, x1: 10, y1: 23 }, { t: 'darktile', x0: 24, y0: 8, x1: 24, y1: 26 }];
  ruby.decor.push(['benchout', 15, 20, 0], ['benchout', 19, 17, 0], ['neonarch', 15, 26, 0], ['rubystatue', 20, 13, 0], ['rosecart', 12, 22, 0], ['cocktailcart', 21, 21, 0], ['fortune', 22, 15, 0], ['photobooth', 12, 15, 0], ['amp', 17, 19, 0],
    ['neontree', 12, 5, 0], ['neontree', 21, 5, 0], ['hoload', 10, 10, 0], ['hoload', 24, 10, 0], ['velvetrope', 14, 9, 0], ['velvetrope', 18, 9, 0], ['vending', 24, 26, 0], ['planter', 13, 24, 0], ['planter', 20, 24, 0]);
  // 거리 사람들: 밤에 붐비고 낮엔 한산 · 헌병 순찰(LB76) · 노점 주인 · 버스커
  ruby.crowd = [{ role: 'walker', n: 7, day: 2, x0: 11, y0: 8, x1: 23, y1: 26 }, { role: 'mp', n: 1, nightOnly: true, x0: 11, y0: 2, x1: 24, y1: 26 },
    { role: 'rosevendor', fixed: [14.5, 22.5, 3] }, { role: 'cocktailer', fixed: [21.5, 20.4, 0], nightOnly: true }, { role: 'busker', fixed: [18.5, 19.5, 0], nightOnly: true }];

  // ================= 우주항구 · 궤도정거장 =================
  const port = out('port', { name: '페르녹스 우주항구', w: 44, h: 34, fill: 'concrete', dome: false, edge: 'rock', arrive: [22, 30], lore: 'LB51', travel: [{ to: 'plaza', label: '🚌 돔시티 중앙광장', mins: 20 }, { to: 'bridge', label: '🚶 빛먼지 산책교', mins: 10 }] });
  port.buildings = [{ id: 'p_terminal', name: '여객 터미널', to: 'terminal', x: 16, y: 14, w: 12, d: 8, h: 48, wall: '#9fb0c0', roof: '#5d666f', stripe: '#3b5fa8', icon: 'bus', door: { f: 'L', u: 5 }, glass: true, roofDeco: ['antenna', 'dish'] }];
  port.zones = [{ t: 'asphalt', x0: 2, y0: 2, x1: 13, y1: 12 }, { t: 'asphalt', x0: 30, y0: 2, x1: 41, y1: 12 }, { t: 'hangar', x0: 2, y0: 24, x1: 13, y1: 31 }];
  port.decor.push(['ship', 3, 4, 0], ['ship', 31, 4, 0], ['crates', 4, 25, 0], ['crates', 7, 25, 0], ['crate', 10, 25, 0], ['crates', 4, 28, 0], ['crate', 8, 28, 0], ['truck', 32, 24, 0], ['barrier', 14, 11, 0], ['barrier', 27, 11, 0], ['sandbags', 31, 15, 0], ['guardpost', 38, 16, 0], ['benchout', 18, 26, 0], ['benchout', 24, 26, 0]);
  for (const [x, y] of [[15, 25], [29, 25], [15, 13], [29, 13]]) port.decor.push(['streetlamp', x, y, 0]);
  port.spots = { 'port.wave': [21, 24, 2, 'stand'], 'port.wave2': [24, 24, 2, 'stand'] };

  const station = out('station', { name: '궤도정거장', w: 36, h: 28, fill: 'metal', edge: 'none', arrive: [18, 24], amb: 0.3, fx: 'stars', bg: '#0d0a1c', travel: [PORT(120)] });
  station.zones = [{ t: 'void', x0: 0, y0: 0, x1: 35, y1: 1 }, { t: 'void', x0: 0, y0: 0, x1: 1, y1: 27 }, { t: 'void', x0: 34, y0: 0, x1: 35, y1: 27 }, { t: 'void', x0: 0, y0: 26, x1: 35, y1: 27 },
    { t: 'domegrass', x0: 22, y0: 15, x1: 31, y1: 23 }];
  station.buildings = [
    { id: 's_lounge', name: '항성 · 별빛 라운지', to: 'skylounge', x: 4, y: 4, w: 10, d: 7, h: 44, wall: '#3a3f6a', roof: '#c9d1d9', stripe: '#9fe6ff', icon: 'star', door: { f: 'L', u: 4 }, glass: true },
    { id: 's_hotel', name: '무중력 호텔', to: 'zerohotel', x: 20, y: 3, w: 11, d: 7, h: 60, wall: '#d9dde2', roof: '#7f8a96', stripe: '#b9a0ff', icon: 'bed', door: { f: 'L', u: 5 }, glass: true },
  ];
  station.decor.push(['bigplant', 23, 16, 0], ['bigplant', 30, 16, 0], ['glowflower', 25, 19, 0], ['glowflower', 28, 21, 0], ['tree2', 26, 17, 0], ['benchout', 24, 22, 0], ['windowseat', 4, 15, 0], ['windowseat', 8, 15, 0], ['telescope', 12, 16, 0], ['kiosk', 16, 14, 0]);
  station.lore = 'LB37';

  // ================= 다른 행성 =================
  const p3 = out('planet3', { name: '제3행성 · 해양돔거리', w: 44, h: 34, fill: 'deepwater', arrive: [22, 29], lore: 'LB33', travel: [PORT(360)] });
  p3.zones = [{ t: 'plaza', x0: 16, y0: 24, x1: 28, y1: 31 }, { t: 'plaza', x0: 4, y0: 6, x1: 15, y1: 15 }, { t: 'plaza', x0: 28, y0: 6, x1: 39, y1: 15 }, { t: 'plaza', x0: 18, y0: 3, x1: 26, y1: 10 },
    { t: 'boardwalk', x0: 21, y0: 11, x1: 22, y1: 23 }, { t: 'boardwalk', x0: 10, y0: 16, x1: 11, y1: 25 }, { t: 'boardwalk', x0: 12, y0: 24, x1: 15, y1: 25 }, { t: 'boardwalk', x0: 33, y0: 16, x1: 34, y1: 25 }, { t: 'boardwalk', x0: 29, y0: 24, x1: 32, y1: 25 }];
  p3.buildings = [{ id: 'p3_food', name: '해산물 요리점', x: 6, y: 7, w: 6, d: 5, h: 36, wall: '#e8f4f0', roof: '#3b8fbf', stripe: '#ff8b5e', icon: 'fork', awning: '#ff8b5e', door: { f: 'L', u: 2 }, act: { shop: 'seafood', label: '🐟 해산물 요리점 주문하기' } },
    { id: 'p3_shop', name: '부유식 상점', x: 31, y: 7, w: 6, d: 5, h: 34, wall: '#f4e4c8', roof: '#5fa8ff', stripe: '#5fc8e8', icon: 'box', awning: '#5fc8e8', door: { f: 'L', u: 2 }, act: { shop: 'seafood', label: '🛍️ 부유식 상점 둘러보기' } }];
  p3.decor.push(['stall', 8, 13, 0], ['stall', 33, 13, 0], ['parasol', 19, 26, 0], ['parasol', 25, 26, 0], ['benchout', 18, 8, 0], ['fountain', 21, 4, 0], ['streetlamp', 17, 24, 0], ['streetlamp', 28, 24, 0], ['fishspot', 16, 28, 0]);
  p3.shops = { stall: 'seafood' };

  const p4 = out('planet4', { name: '제4행성 · 광물도시', w: 40, h: 34, fill: 'crystal', dome: true, edge: 'rock', arrive: [20, 29], lore: 'LB26', amb: 0.42, travel: [PORT(360)] });
  p4.zones = [{ t: 'rail', x0: 1, y0: 8, x1: 38, y1: 8 }, { t: 'concrete', x0: 18, y0: 9, x1: 21, y1: 28 }, { t: 'redrock', x0: 25, y0: 18, x1: 37, y1: 27 }];
  p4.buildings = [
    { id: 'p4_museum', name: '제4 광물박물관', to: 'museum', x: 4, y: 12, w: 10, d: 7, h: 46, wall: '#7a6a5a', roof: '#4a3a2a', stripe: '#c9a227', icon: 'star', door: { f: 'R', u: 3 } },
    { id: 'p4_onsen', name: '제4 광물온천', to: 'onsen', x: 4, y: 22, w: 9, d: 6, h: 36, wall: '#8a7a6a', roof: '#5a4a3a', stripe: '#7fd3d0', icon: 'drop', door: { f: 'R', u: 3 } },
  ];
  p4.decor.push(['railstation', 18, 9, 0], ['lantern', 17, 12, 0], ['lantern', 22, 12, 0]);
  for (const [x, y] of [[26, 19], [29, 21], [32, 19], [34, 23], [27, 25], [31, 25], [24, 13], [34, 13], [3, 3], [36, 3]]) p4.decor.push(['crystalcluster', x, y, 0]);
  for (const [x, y] of [[23, 15], [16, 18], [23, 22], [16, 24]]) p4.decor.push(['lantern', x, y, 0, ['LB29']]);
  p4.decor.push(['benchout', 24, 27, 0], ['stall', 14, 20, 0]);
  p4.shops = { stall: 'mineral' };

  const p6 = out('planet6', { name: '제6행성 · 얼음권 기지', w: 40, h: 34, fill: 'snowfield', dome: false, edge: 'rock', arrive: [20, 29], lore: 'LB30', weather: 'snow', fx: 'aurora', travel: [PORT(360)] });
  p6.zones = [{ t: 'ice', x0: 2, y0: 2, x1: 37, y1: 9 }, { t: 'concrete', x0: 19, y0: 10, x1: 20, y1: 28 }, { t: 'boardwalk', x0: 4, y0: 20, x1: 18, y1: 21 }];
  p6.buildings = [{ id: 'p6_aurora', name: '오로라 관측기지', to: 'aurora', x: 26, y: 13, w: 10, d: 7, h: 52, wall: '#d9e6ee', roof: '#9fb0c0', stripe: '#7fffd4', icon: 'star', door: { f: 'L', u: 4 }, glass: true, roofDeco: ['dish'] }];
  for (const [x, y] of [[6, 4], [12, 6], [18, 4], [26, 6], [32, 4]]) p6.decor.push(['icesculpture', x, y, 0]);
  for (let x = 5; x <= 17; x += 4) p6.decor.push(['lantern', x, 19, 0]);
  p6.decor.push(['stall', 6, 24, 0], ['stall', 10, 24, 0], ['benchout', 14, 24, 0], ['telescope', 22, 11, 0]);
  p6.shops = { stall: 'smoked' };

  // ================= 외곽 수색구역 (출입 제한) =================
  const os = out('outskirts', { name: '외곽 수색구역', w: 56, h: 52, fill: 'sand', dome: false, edge: 'rock', arrive: [28, 48], restricted: true, travel: [{ to: 'base', label: '🚙 606부대 정문으로 복귀', mins: 30 }] });
  os.zones = [{ t: 'redrock', x0: 2, y0: 2, x1: 20, y1: 18 }, { t: 'dirt', x0: 22, y0: 4, x1: 34, y1: 14 }, { t: 'redrock', x0: 38, y0: 28, x1: 53, y1: 46 }, { t: 'silversand', x0: 36, y0: 2, x1: 53, y1: 16 }, { t: 'dirt', x0: 26, y0: 15, x1: 29, y1: 47 }];
  os.buildings = [
    { id: 'o_lab', name: '폐쇄 연구기지', to: 'ruinlab', x: 5, y: 5, w: 10, d: 8, h: 40, wall: '#6a6560', roof: '#4a4540', stripe: '#d0563b', icon: 'flask', door: { f: 'R', u: 3 } },
    { id: 'o_cave', name: '미확인 동굴', to: 'cave', x: 42, y: 32, w: 8, d: 7, h: 34, wall: '#8a4a36', roof: '#5a2f25', stripe: '#b9a0ff', icon: 'star', door: { f: 'L', u: 3 }, rock: true },
  ];
  os.decor.push(['tower', 26, 6, 0], ['ruinwall', 40, 6, 0], ['ruinwall', 44, 9, 1], ['ruinwall', 48, 5, 0], ['crates', 45, 12, 0], ['sandbags', 41, 12, 0], ['crate', 49, 12, 0]);
  for (const [x, y] of [[8, 24], [14, 30], [20, 26], [11, 36], [18, 40], [6, 44]]) os.decor.push(['debris', x, y, 0]);
  for (const [x, y] of [[34, 22], [38, 20], [44, 22], [48, 24], [36, 26]]) os.decor.push(['glowflower', x, y, 0]);
  for (const [x, y] of [[3, 22], [22, 34], [32, 40], [52, 20], [4, 48], [50, 48], [24, 20], [33, 30]]) os.decor.push(['rockbig', x, y, 0]);
  os.critters = [{ kind: 'lizard', x0: 32, y0: 18, x1: 50, y1: 27, n: 4 }, { kind: 'drifter', x0: 4, y0: 20, x1: 22, y1: 44, n: 3 }];

  // ================= 실내 =================
  room('terminal', { name: '여객 터미널', w: 16, h: 11, floor: 'tile', wall: '#d9e6ee', exit: 8, travelRoom: true,
    furn: [['travelkiosk', 6, 2, 0], ['travelkiosk', 9, 2, 0], ['bench', 1, 6, 0], ['bench', 1, 8, 0], ['bench', 11, 6, 0], ['bench', 11, 8, 0], ['vending', 15, 2, 1], ['shopcounter', 1, 1, 0], ['bigplant', 0, 0, 0], ['bigplant', 15, 0, 0], ['@', 8, 4, 0, 'term.desk', 'stand']],
    walls: [['B', 3.0, 'screen', 2.4], ['B', 10.6, 'screen', 2.4], ['L', 4.0, 'window', 1.4]],
    travel: [{ to: 'station', label: '🛰️ 궤도정거장 (2시간)', mins: 120 }, { to: 'planet3', label: '🌊 제3행성 해양도시 (6시간)', mins: 360 }, { to: 'planet4', label: '💎 제4행성 광물도시 (6시간)', mins: 360 }, { to: 'planet6', label: '❄️ 제6행성 얼음권 기지 (6시간)', mins: 360 }] });
  room('skylounge', { name: '항성 · 별빛 라운지', w: 14, h: 10, floor: 'carpet', wall: '#141028', exit: 7, stars: true, date: true,
    furn: [['windowseat', 1, 0, 0], ['windowseat', 4, 0, 0], ['windowseat', 8, 0, 0], ['windowseat', 11, 0, 0], ['telescope', 0, 3, 0], ['barcounter', 10, 6, 0], ['cafetable', 3, 5, 0], ['chair', 2, 5, 3], ['chair', 4, 5, 1], ['cafetable', 7, 5, 0], ['chair', 6, 5, 3], ['chair', 8, 5, 1], ['bigplant', 13, 9, 0]],
    walls: [['B', 0.4, 'window', 2.2], ['B', 3.6, 'window', 2.2], ['B', 7.4, 'window', 2.2], ['B', 10.6, 'window', 2.2]] });
  room('zerohotel', { name: '무중력 호텔 객실', w: 11, h: 9, floor: 'mosaic', wall: '#d9dde2', exit: 5, stars: true, lowgrav: true, date: true,
    furn: [['bigbed', 1, 0, 0, 'hotel.bed'], ['sidetable', 3, 0, 0], ['windowseat', 5, 0, 0], ['fridge', 9, 0, 0], ['cabinet', 10, 0, 0], ['sofa', 0, 4, 3], ['cafetable', 2, 4, 0], ['lamp', 10, 5, 0], ['plant', 0, 8, 0]],
    walls: [['B', 4.6, 'window', 2.4], ['L', 2.4, 'window', 1.2]] });
  room('museum', { name: '제4 광물박물관', w: 15, h: 11, floor: 'darktile', wall: '#5a4a3a', exit: 7,
    furn: [['exhibit', 1, 0, 0], ['exhibit', 3, 0, 0], ['exhibit', 5, 0, 0], ['exhibit', 9, 0, 0], ['exhibit', 11, 0, 0], ['exhibit', 13, 0, 0], ['exhibit', 0, 3, 0], ['exhibit', 0, 6, 0], ['crystalcluster', 6, 5, 0], ['crystalcluster', 8, 5, 0], ['drone', 12, 5, 0], ['bench', 4, 8, 0], ['bench', 9, 8, 0]],
    walls: [['B', 6.6, 'board', 1.6], ['L', 8.6, 'map', 1.2]] });
  room('onsen', { name: '제4 광물온천', w: 12, h: 10, floor: 'tile', wall: '#8a7a6a', exit: 6, date: true,
    furn: [['hotspring', 1, 1, 0], ['hotspring', 7, 1, 0], ['bench', 1, 6, 0], ['locker', 9, 6, 0], ['locker', 10, 6, 0], ['locker', 11, 6, 0], ['bigplant', 0, 9, 0], ['sink', 11, 0, 0]],
    walls: [['B', 4.6, 'window', 1.6], ['L', 4.0, 'window', 1.2]] });
  room('aurora', { name: '오로라 관측기지 상층 돔', w: 14, h: 10, floor: 'carpet', wall: '#141028', exit: 7, stars: true, auroraRoom: true, date: true,
    furn: [['windowseat', 1, 1, 0], ['windowseat', 4, 1, 0], ['windowseat', 8, 1, 0], ['windowseat', 11, 1, 0], ['telescope', 6, 1, 0], ['barcounter', 1, 6, 0], ['bench', 9, 6, 0], ['bigplant', 13, 9, 0]],
    walls: [['B', 0.4, 'window', 3.0], ['B', 5.0, 'window', 3.0], ['B', 9.6, 'window', 3.0]] });
  room('ruinlab', { name: '폐쇄 연구기지 (내부)', w: 14, h: 10, floor: 'darktile', wall: '#4a4540', exit: 7, amb: 0.55,
    furn: [['labbench', 1, 0, 0], ['specimen', 4, 0, 0], ['specimen', 5, 0, 0], ['server', 9, 0, 0], ['server', 10, 0, 0], ['debris', 2, 4, 0], ['debris', 9, 5, 0], ['crates', 11, 8, 0], ['filecab', 0, 4, 0], ['crystalcluster', 6, 6, 0]],
    walls: [['B', 6.6, 'hazard', 1.6], ['L', 6.0, 'board', 1.2]] });
  room('cave', { name: '미확인 동굴', w: 14, h: 11, floor: 'crystal', wall: '#3a2a3a', exit: 7, amb: 0.65,
    furn: [['crystalcluster', 1, 0, 0], ['crystalcluster', 4, 1, 0], ['crystalcluster', 9, 0, 0], ['crystalcluster', 12, 2, 0], ['crystalcluster', 0, 5, 0], ['crystalcluster', 11, 6, 0], ['rock', 3, 5, 0], ['rockbig', 6, 3, 0], ['debris', 8, 7, 0]],
    walls: [], critters: [{ kind: 'drifter', x0: 2, y0: 2, x1: 12, y1: 8, n: 2 }] });
  room('pub', { name: '술집 골목', w: 13, h: 9, floor: 'darkwood', wall: '#4a3a30', exit: 6, amb: 0.3, date: true, adult: true,
    furn: [['barcounter', 2, 1, 0], ['barcounter', 5, 1, 0], ['stool', 2, 2, 0], ['stool', 3, 2, 0], ['stool', 5, 2, 0], ['stool', 6, 2, 0], ['cafetable', 9, 4, 0], ['chair', 8, 4, 3], ['chair', 10, 4, 1], ['cafetable', 2, 6, 0], ['chair', 1, 6, 3], ['chair', 3, 6, 1], ['dartboard', 12, 1, 0], ['jukebox', 0, 0, 0], ['bigplant', 12, 8, 0], ['lamp', 9, 0, 0]],
    walls: [['B', 9.6, 'poster', 0.7], ['L', 3.0, 'window', 1.2]], crowd: [{ role: 'pubboss', fixed: [3.5, 0.5, 0] }, { role: 'patron', n: 3, x0: 1, y0: 3, x1: 11, y1: 7 }, { role: 'mp', n: 1, nightOnly: true, x0: 4, y0: 4, x1: 9, y1: 7 }] });
  room('perfume', { name: '퍼퓸덴', w: 11, h: 8, floor: 'mosaic', wall: '#4a2f4a', exit: 5, date: true, adult: true, amb: 0.2,
    furn: [['perfumebar', 3, 1, 0], ['scentshelf', 0, 0, 0], ['scentshelf', 8, 0, 0], ['sofa', 0, 4, 3], ['cafetable', 1, 4, 0], ['diffuser', 9, 3, 0], ['glassvase', 10, 5, 0], ['plant', 10, 7, 0], ['moodlamp', 0, 7, 0], ['candles', 6, 0, 0]],
    walls: [['B', 2.8, 'mirrorw', 1.6], ['L', 1.0, 'window', 1.2]], crowd: [{ role: 'perfumer', fixed: [4.5, 0.5, 0] }, { role: 'guest', n: 1, x0: 5, y0: 3, x1: 9, y1: 6 }] });
  room('dice', { name: '다이스키스', w: 12, h: 9, floor: 'neonfloor', wall: '#2a2f4a', exit: 6, date: true, adult: true, amb: 0.35,
    furn: [['dicetable', 1, 3, 0], ['chair', 0, 3, 3], ['chair', 3, 4, 1], ['cardtable', 8, 3, 0], ['chair', 7, 3, 3], ['chair', 10, 4, 1], ['barcounter', 4, 1, 0], ['arcade', 0, 0, 0], ['arcade', 11, 0, 0], ['velvetrope', 4, 7, 0], ['velvetrope', 8, 7, 0], ['moodlamp', 0, 8, 0], ['moodlamp', 11, 8, 0]],
    walls: [['B', 2.0, 'poster', 0.7], ['B', 8.6, 'poster', 0.7]], crowd: [{ role: 'dealer', fixed: [5.5, 0.5, 0] }, { role: 'gamer', n: 2, x0: 1, y0: 5, x1: 10, y1: 7 }] });
  room('mask', { name: '실버마스크', w: 13, h: 10, floor: 'neonfloor', wall: '#3a3f4a', exit: 6, amb: 0.4, date: true, adult: true,
    furn: [['dancefloor', 5, 3, 0], ['barcounter', 1, 1, 0], ['sofa', 9, 0, 0], ['sofa', 12, 4, 1], ['cafetable', 10, 2, 0], ['jukebox', 12, 0, 0], ['maskrack', 11, 7, 0], ['moodlamp', 0, 8, 0], ['moodlamp', 0, 4, 0], ['velvetrope', 3, 7, 0], ['velvetrope', 9, 7, 0]],
    walls: [['B', 5.0, 'mirrorw', 2.0], ['L', 2.0, 'mirrorw', 1.4]], crowd: [{ role: 'bartender', fixed: [2.5, 0.5, 0] }, { role: 'maskhost', fixed: [10.5, 7.5, 2] }, { role: 'dancer', n: 3, x0: 4, y0: 2, x1: 8, y1: 6 }] });
  room('midnight', { name: '미드나잇 룸', w: 11, h: 8, floor: 'carpet', wall: '#2a1f3f', exit: 5, amb: 0.45, date: true, adult: true,
    furn: [['sofa', 1, 0, 0], ['sofa', 3, 0, 0], ['sofa', 0, 2, 3], ['cafetable', 2, 2, 0], ['rug', 2, 3, 0], ['jukebox', 7, 0, 0], ['diffuser', 9, 0, 0], ['moodlamp', 10, 0, 0], ['sidetable', 0, 4, 0], ['candles', 3, 2, 0], ['bigplant', 10, 4, 0]],
    walls: [['B', 5.6, 'screen', 1.2], ['L', 1.0, 'window', 1.2]], crowd: [{ role: 'host', fixed: [7.5, 6.5, 2] }] });
  room('inn', { name: '은밀숙소 로비', w: 11, h: 8, floor: 'carpet', wall: '#5a2f3f', exit: 5, amb: 0.25, adult: true,
    furn: [['shopcounter', 4, 1, 0, 'inn.desk'], ['sofa', 0, 4, 3], ['bigplant', 10, 0, 0], ['lamp', 0, 0, 0], ['mirror', 10, 4, 1]], walls: [['B', 7.0, 'board', 1.2]], crowd: [{ role: 'innclerk', fixed: [4.5, 0.5, 0] }] });
  // 은밀숙소 테마 객실: 로비 프런트에서 예약하면 올라감 (나가면 로비로)
  const INN = { w: 10, h: 8, exit: 5, adult: true, date: true, innRoom: true, exitTo: 'inn', amb: 0.3, parent: 'rubyway' };
  room('inn_mirror', Object.assign({}, INN, { name: '은밀숙소 · 거울 객실', floor: 'carpet', wall: '#3f2a4a',
    furn: [['roundbed', 3, 0, 0, 'innm.bed'], ['sidetable', 2, 0, 0], ['sidetable', 5, 0, 0], ['vanity', 9, 2, 1], ['mirror', 0, 3, 3], ['sofa', 0, 6, 3], ['moodlamp', 9, 0, 0], ['candles', 6, 3, 0], ['rug', 3, 3, 0]],
    walls: [['B', 0.6, 'mirrorw', 1.4], ['B', 7.0, 'mirrorw', 1.4], ['L', 1.2, 'mirrorw', 1.6]] }));
  room('inn_bath', Object.assign({}, INN, { name: '은밀숙소 · 큰 욕조 객실', floor: 'tile', wall: '#2f4a5a',
    furn: [['bigbed', 6, 0, 0, 'innb.bed'], ['sidetable', 8, 0, 0], ['bathtub', 1, 0, 0], ['candles', 3, 0, 0], ['candles', 0, 2, 0], ['plant', 0, 7, 0], ['moodlamp', 9, 3, 0], ['sofa', 9, 5, 1], ['vanity', 4, 0, 0]],
    walls: [['B', 1.0, 'window', 1.6], ['L', 4.0, 'mirrorw', 1.2]] }));
  room('inn_water', Object.assign({}, INN, { name: '은밀숙소 · 물침대 객실', floor: 'neonfloor', wall: '#1f2a4a', stars: true,
    furn: [['waterbed', 4, 1, 0, 'innw.bed'], ['sidetable', 3, 1, 0], ['sidetable', 6, 1, 0], ['moodlamp', 0, 0, 0], ['moodlamp', 9, 0, 0], ['fridge', 9, 4, 1], ['sofa', 0, 5, 3], ['candles', 7, 4, 0], ['vanity', 1, 0, 0]],
    walls: [['B', 2.0, 'window', 1.4], ['B', 7.0, 'window', 1.4]] }));
  room('showroom', { name: '블라인드 쇼룸', w: 13, h: 10, floor: 'neonfloor', wall: '#3a2a4a', exit: 6, amb: 0.5, adult: true,
    furn: [['stage', 4, 0, 0, 'show.stage'], ['curtain', 4, 3, 0], ['curtain', 6, 3, 0], ['theaterseat', 3, 6, 2], ['theaterseat', 4, 6, 2], ['theaterseat', 5, 6, 2], ['theaterseat', 7, 6, 2], ['theaterseat', 8, 6, 2], ['theaterseat', 9, 6, 2], ['barcounter', 10, 8, 0], ['velvetrope', 2, 4, 0], ['velvetrope', 9, 4, 0], ['moodlamp', 0, 0, 0], ['moodlamp', 12, 0, 0]], walls: [],
    crowd: [{ role: 'usher', fixed: [2.5, 8.5, 2] }, { role: 'audience', n: 2, x0: 2, y0: 5, x1: 10, y1: 7 }] });
  room('dawnshower', { name: '새벽 샤워실', w: 11, h: 8, floor: 'tile', wall: '#3f5a6a', exit: 5, adult: true,
    furn: [['spastall', 1, 0, 0], ['spastall', 2, 0, 0], ['spastall', 3, 0, 0], ['sink', 0, 2, 3], ['sink', 0, 3, 3], ['locker', 7, 0, 0], ['locker', 8, 0, 0], ['reviewboard', 9, 0, 0], ['bench', 6, 4, 0], ['diffuser', 10, 4, 0], ['plant', 10, 7, 0]],
    walls: [['L', 1.4, 'mirrorw', 1.6]], crowd: [{ role: 'attendant', fixed: [5.5, 1.5, 0] }, { role: 'early', n: 2, x0: 4, y0: 3, x1: 9, y1: 6 }] });

  // 기존 지역의 이동 목록
  M.dome.travel = [{ to: 'base', label: '🚌 606부대 정문 (30분)', mins: 30, need: 'pass' }, { to: 'lake', label: '🌳 인공호수 공원', mins: 20 }, { to: 'farm', label: '🌱 농업돔 체험장', mins: 25 }, { to: 'glasshouse', label: '🌸 유리꽃 온실', mins: 15 },
    { to: 'glowpath', label: '✨ 발광초 온실길', mins: 15 }, { to: 'bluegarden', label: '💧 푸른기압 정원', mins: 15 }, { to: 'hill', label: '🌇 관람언덕', mins: 20 }, { to: 'beach', label: '🏖️ 흰모래 해변돔', mins: 25 },
    { to: 'silverdesert', label: '🚙 은사막 전망대 (안정도로 40분)', mins: 40 }, { to: 'camp', label: '⛺ 안정구역 캠핑장', mins: 40 }];
  M.base.travel = [{ to: 'dome', label: '🚌 돔시티 (30분)', mins: 30 }, { to: 'outskirts', label: '🚙 외곽 수색구역 (출입 제한)', mins: 30, need: 'scout' }];
  M.plaza.travel = [{ to: 'port', label: '🚀 우주항구 (20분)', mins: 20 }, { to: 'corridor', label: '🌅 인공노을 회랑', mins: 10 }, { to: 'bridge', label: '🌉 빛먼지 산책교', mins: 10 }, { to: 'rubyway', label: '🌹 루비웨이 (성인 · 직접 선택)', mins: 10, need: 'adult' }, { to: 'dome', label: '🚶 연구·주거구역', mins: 5 }];
  M.plaza.decor.push(['travelkiosk', 28, 46, 0]);
  M.plaza.buildings = M.plaza.buildings.filter(b => b.id !== 'p_pub' && b.id !== 'p_port');
  M.plaza.buildings.push({ id: 'p_port', name: '우주항구 · 루비웨이 방면', x: 38, y: 4, w: 8, d: 5, h: 40, wall: '#9fb0c0', roof: '#5d666f', stripe: '#3b5fa8', icon: 'bus', door: { f: 'L', u: 3 }, act: { travel: true, label: '🚌 우주항구 · 루비웨이 방면 셔틀' } });

  // 실내 ↔ 바깥 연결 자동 등록
  for (const id in M) { const m = M[id]; if (m.kind !== 'out') continue; for (const b of m.buildings) if (b.to && M[b.to] && !M[b.to].parent) { M[b.to].parent = id; M[b.to].building = b.id; } }
})();
