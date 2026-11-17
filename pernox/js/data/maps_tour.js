// 돔시티 관광지 보강: 로어북에만 있던 명소를 실제 장소로 + 모든 관광지에 장소별 효과(fx)
// fx: fireflies 반딧불 · petals 유리꽃잎 · bubbles 빛 거품 · waves 물빛 반짝임 · meteors 유성 · silver 은빛 모래 · steam 김
//     sunset 노을빛 · fish 홀로그램 물고기 · orbit 궤도광 고리 · beacons 항로등 · neon 네온 안개 · trainstars 창밖 별 흐름 · stars 별
'use strict';
(() => {
  const M = PX.MAPS;
  const TOUR = PX.TOUR = []; // 셔틀 목적지: [id, 아이콘, 이동 분, 운영 시간(없으면 상시)]
  function out(id, o) {
    const m = Object.assign({ id, kind: 'out', buildings: [], decor: [], zones: [], roads: [], spots: {}, travel: [], dome: true, tour: true }, o);
    if (o.edge !== 'none') { const g = o.edge !== 'rock'; m.walls = [{ x: 0, y: 0, w: m.w, d: 1, glass: g }, { x: 0, y: 1, w: 1, d: m.h - 1, glass: g }, { x: m.w - 1, y: 1, w: 1, d: m.h - 1, glass: g }, { x: 1, y: m.h - 1, w: m.w - 2, d: 1, glass: g }]; }
    else m.walls = [];
    m.decor.push(['travelkiosk', m.arrive[0] + 1, m.arrive[1] - 1, 0]);
    M[id] = m; return m;
  }

  // ---------- 저중력 수영장 (LB17) ----------
  const pool = out('pool', { name: '저중력 수영장', w: 30, h: 24, fill: 'glassfloor', arrive: [15, 17], lore: 'LB17', fx: ['bubbles', 'waves'], hours: ['09:00', '21:00'], tint: ['#7fd8ff', 0.06] });
  pool.zones = [{ t: 'water', x0: 5, y0: 4, x1: 24, y1: 15 }, { t: 'deepwater', x0: 10, y0: 7, x1: 19, y1: 12 }, { t: 'mosaic', x0: 3, y0: 17, x1: 26, y1: 18 }];
  pool.decor.push(['beachchair', 4, 18, 0], ['beachchair', 7, 18, 0], ['beachchair', 21, 18, 0], ['beachchair', 24, 18, 0], ['parasol', 2, 17, 0], ['parasol', 26, 17, 0], ['bigplant', 2, 2, 0], ['bigplant', 27, 2, 0], ['vending', 27, 20, 0], ['moodlamp', 4, 3, 0], ['moodlamp', 25, 3, 0]);
  pool.spots = { 'pool.edge': [14, 16, 0, 'stand'] };

  // ---------- 광물온천 스파 (LB18) ----------
  const spa = out('spa', { name: '광물온천 스파', w: 28, h: 22, fill: 'mosaic', arrive: [14, 14], lore: 'LB18', fx: ['steam'], hours: ['10:00', '23:00'], amb: 0.25, tint: ['#ffb38a', 0.05] });
  spa.zones = [{ t: 'water', x0: 4, y0: 4, x1: 11, y1: 9 }, { t: 'water', x0: 16, y0: 4, x1: 23, y1: 9 }, { t: 'crystal', x0: 12, y0: 3, x1: 15, y1: 4 }];
  spa.decor.push(['hotspring', 6, 11, 0], ['hotspring', 18, 11, 0], ['crystalcluster', 2, 3, 0], ['crystalcluster', 25, 3, 0], ['crystalcluster', 13, 6, 0], ['spastall', 22, 16, 0], ['benchout', 5, 15, 0], ['benchout', 17, 15, 0], ['candles', 3, 12, 0], ['candles', 24, 12, 0], ['bigplant', 2, 18, 0]);
  spa.shops = { stall: 'mineral' };

  // ---------- 별빛 관람열차 (LB21) ----------
  const train = out('startrain', { name: '별빛 관람열차', w: 40, h: 9, fill: 'void', edge: 'none', arrive: [6, 4], lore: 'LB21', fx: ['trainstars', 'stars'], bg: '#0b0820', amb: 0.2, hours: ['18:00', '24:00'] });
  train.zones = [{ t: 'carpet', x0: 1, y0: 3, x1: 38, y1: 6 }];
  train.walls = [{ x: 0, y: 2, w: 40, d: 1, glass: true }, { x: 0, y: 7, w: 40, d: 1, glass: true }];
  for (let x = 4; x <= 34; x += 6) train.decor.push(['windowseat', x, 3, 0], ['windowseat', x + 2, 6, 2], ['moodlamp', x + 4, 3, 0]);

  // ---------- 향열매 카페거리 (LB24) ----------
  const cst = out('cafestreet', { name: '향열매 카페거리', w: 40, h: 18, fill: 'plaza', arrive: [8, 9], lore: 'LB24', fx: ['petals'], hours: ['10:00', '22:00'] });
  cst.zones = [{ t: 'mosaic', x0: 1, y0: 8, x1: 38, y1: 10 }, { t: 'flowers', x0: 2, y0: 2, x1: 37, y1: 3 }, { t: 'flowers', x0: 2, y0: 15, x1: 37, y1: 16 }];
  for (let x = 6; x <= 34; x += 7) cst.decor.push(['cafetable', x, 5, 0], ['parasol', x + 1, 4, 0], ['cafetable', x + 2, 12, 0], ['lantern', x + 4, 7, 0]);
  cst.decor.push(['stall', 18, 3, 0], ['stall', 24, 13, 0], ['flowerbed', 12, 13, 0], ['flowerbed', 30, 5, 0], ['tree2', 2, 5, 0], ['tree2', 37, 12, 0]);
  cst.shops = { stall: 'cafe' };

  // ---------- 투명수로 정원 (LB58) ----------
  const aqua = out('aquagarden', { name: '투명수로 정원', w: 30, h: 24, fill: 'domegrass', arrive: [11, 10], lore: 'LB58', fx: ['fish', 'bubbles'], best: ['19:00', '23:00'], tint: ['#5fd8ff', 0.06] });
  aqua.zones = [{ t: 'water', x0: 3, y0: 6, x1: 26, y1: 7 }, { t: 'water', x0: 3, y0: 13, x1: 26, y1: 14 }, { t: 'water', x0: 14, y0: 3, x1: 15, y1: 18 }, { t: 'glassfloor', x0: 6, y0: 6, x1: 7, y1: 7 }, { t: 'glassfloor', x0: 22, y0: 13, x1: 23, y1: 14 }, { t: 'glassfloor', x0: 14, y0: 10, x1: 15, y1: 10 }, { t: 'boardwalk', x0: 3, y0: 18, x1: 26, y1: 19 }];
  aqua.decor.push(['glowflower', 4, 4, 0], ['glowflower', 25, 4, 0], ['glowflower', 4, 11, 0], ['glowflower', 25, 11, 0], ['benchout', 9, 9, 0], ['benchout', 19, 9, 0], ['benchout', 9, 16, 0], ['benchout', 19, 16, 0], ['tree2', 2, 2, 0], ['tree2', 27, 2, 0], ['streetlamp', 6, 18, 0], ['streetlamp', 23, 18, 0]);

  // ---------- 궤도광 테라스 (LB62) ----------
  const ter = out('terrace', { name: '궤도광 테라스', w: 30, h: 20, fill: 'mosaic', arrive: [15, 9], lore: 'LB62', fx: ['orbit', 'meteors', 'stars'], best: ['20:00', '24:00'], bg: '#0b0820', amb: 0.3 });
  ter.zones = [{ t: 'glassfloor', x0: 4, y0: 2, x1: 25, y1: 5 }];
  ter.decor.push(['railing', 4, 1, 0], ['railing', 8, 1, 0], ['railing', 12, 1, 0], ['railing', 16, 1, 0], ['railing', 20, 1, 0], ['telescope', 8, 3, 0], ['telescope', 15, 3, 0], ['telescope', 22, 3, 0], ['benchout', 7, 8, 0], ['benchout', 19, 8, 0], ['cafetable', 12, 11, 0], ['cafetable', 18, 12, 0], ['moodlamp', 3, 10, 0], ['moodlamp', 26, 10, 0], ['bigplant', 2, 15, 0], ['bigplant', 27, 15, 0]);

  // ---------- 항로등 거리 (LB67) ----------
  const bea = out('beaconst', { name: '항로등 거리', w: 42, h: 14, fill: 'asphalt', arrive: [8, 7], lore: 'LB67', fx: ['beacons', 'neon'], best: ['19:00', '01:00'], amb: 0.35 });
  bea.zones = [{ t: 'mosaic', x0: 1, y0: 6, x1: 40, y1: 8 }, { t: 'plaza', x0: 1, y0: 2, x1: 40, y1: 4 }, { t: 'plaza', x0: 1, y0: 10, x1: 40, y1: 12 }];
  for (let x = 5; x <= 37; x += 4) bea.decor.push(['streetlamp', x, 5, 0], ['streetlamp', x + 2, 9, 0]);
  bea.decor.push(['neonsign', 10, 2, 0], ['neonsign', 24, 2, 0], ['neonsign', 17, 11, 0], ['kiosk', 31, 11, 0], ['stall', 6, 11, 0], ['benchout', 20, 3, 0], ['benchout', 34, 3, 0]);
  bea.shops = { stall: 'festival' };

  // ---------- 기존 관광지에도 효과 ----------
  const addFx = (id, fx, extra) => { const m = M[id]; if (!m) return; m.fx = [].concat(m.fx || [], fx); m.tour = true; Object.assign(m, extra || {}); };
  addFx('lake', ['waves', 'fireflies']); addFx('glasshouse', ['petals']); addFx('glowpath', ['fireflies']); addFx('bluegarden', ['bubbles']);
  addFx('hill', ['meteors']); addFx('silverdesert', ['silver', 'meteors']); addFx('beach', ['waves']); addFx('camp', ['fireflies', 'meteors']);
  addFx('corridor', ['sunset']); addFx('farm', ['fireflies']); addFx('bridge', []);

  // ---------- 셔틀 목적지 (한 메뉴에서 어디든) ----------
  TOUR.push(
    ['plaza', '🏙️', 10], ['rubyway', '🌹', 10], ['cafestreet', '☕', 10], ['beaconst', '🏮', 10], ['bridge', '✨', 10], ['corridor', '🌅', 10],
    ['lake', '🦢', 15], ['glasshouse', '🌸', 15], ['glowpath', '🌿', 15], ['bluegarden', '💧', 15], ['aquagarden', '🐠', 15], ['pool', '🏊', 15], ['spa', '♨️', 20],
    ['hill', '🔭', 20], ['terrace', '🪐', 20], ['startrain', '🚞', 20], ['farm', '🍊', 25], ['beach', '🏖️', 25], ['silverdesert', '🏜️', 40], ['camp', '🏕️', 40],
    ['dome', '🏘️', 10], ['port', '🚀', 20], ['base', '🪖', 30]);
})();
