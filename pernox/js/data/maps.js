// 맵 데이터: 606부대(64×64), 돔시티 연구·주거구역(48×48), 실내 16곳
// 가구 항목: [가구id, x, y, 회전(0~3), 스폿이름?]   스폿만: ['@', x, y, 방향(0=S,1=E,2=N,3=W), 스폿이름, 자세]
// 벽 장식: [벽 'B'(뒷벽 y=0) | 'L'(왼벽 x=0), 위치, 종류, 폭]
'use strict';
(() => {
  const M = {};

  // ---------------- 실내 (Alpha 0.3: 아담하게 줄임) ----------------
  function room(id, o) {
    M[id] = Object.assign({ id, kind: 'in', wallH: 52 }, o);
  }
  const playerRoom = [
    ['plant', 0, 0, 0], ['bed', 1, 0, 0, 'home.bed'], ['sidetable', 2, 0, 0], ['terminal', 3, 0, 0], ['chair', 4, 1, 2], ['cooler', 5, 0, 0], ['photo', 6, 0, 0], ['fridge', 7, 0, 0], ['kitchen', 8, 0, 0], ['bigplant', 10, 0, 0],
    ['mirror', 0, 1, 3], ['wardrobe', 0, 2, 3], ['lamp', 0, 4, 0], ['tv', 0, 5, 3], ['rug', 2, 5, 0], ['sofa', 4, 5, 1, 'home.sofa'],
    ['table', 7, 3, 0], ['chair', 6, 4, 3], ['chair', 9, 3, 1], ['plant', 10, 8, 0],
  ];
  const homeWalls = [['B', 2.5, 'window', 1.0], ['B', 6.6, 'poster', 0.7], ['L', 4.2, 'window', 1.0], ['L', 7.6, 'clock', 0.5]];
  room('q_player', { name: '내 숙소 (간부 숙소동)', w: 11, h: 9, floor: 'wood', wall: '#e9dcc8', exit: 8, home: true, furn: playerRoom.map(a => a.slice()), walls: homeWalls });
  room('apt_player', { name: '내 숙소 (민간 주거구역)', w: 11, h: 9, floor: 'cafe', wall: '#dfe8f0', exit: 8, home: true, furn: playerRoom.map(a => a.slice()), walls: homeWalls });
  room('q_captain', { name: '대위 개인 막사', w: 12, h: 10, floor: 'darkwood', wall: '#5f6b5a', exit: 9, lowDoor: true,
    furn: [['cooler', 0, 0, 0], ['bigbed', 1, 0, 0, 'cap.bed'], ['sidetable', 3, 0, 0], ['weaponrack', 4, 0, 0], ['alienbench', 6, 0, 0], ['@', 6, 1, 2, 'cap.craft', 'work'], ['stool', 7, 1, 0], ['fridge', 9, 0, 0], ['cooler', 10, 0, 0], ['bigplant', 11, 0, 0],
      ['kitchen', 0, 3, 3], ['tv', 0, 5, 3], ['rug_blue', 1, 5, 0], ['sofa_green', 4, 5, 1, 'cap.sofa'], ['table', 6, 3, 0], ['chair', 5, 3, 3], ['chair', 8, 4, 1],
      ['weights', 11, 3, 1], ['@', 10, 4, 1, 'cap.gym', 'workout'], ['benchpress', 9, 6, 0], ['lamp', 11, 6, 0], ['punchbag', 7, 7, 0], ['crates', 10, 9, 0]],
    walls: [['B', 4.2, 'flag', 0.9], ['B', 8.8, 'toolwall', 1.4], ['L', 1.0, 'window', 0.9], ['L', 7.4, 'poster', 0.7]] });
  room('ops', { name: '수색팀 작전동', w: 16, h: 12, floor: 'metal', wall: '#56606b', exit: 13,
    furn: [['opsdesk', 1, 0, 0], ['chair', 2, 1, 2, 'ops.d1'], ['opsdesk', 4, 0, 0], ['chair', 5, 1, 2, 'ops.d2'], ['console', 7, 0, 0], ['server', 9, 0, 0], ['opsdesk', 10, 0, 0], ['chair', 11, 1, 2, 'ops.d3'], ['opsdesk', 13, 0, 0], ['chair', 13, 1, 2, 'ops.cap'], ['flagstand', 15, 0, 0],
      ['locker', 0, 3, 3], ['locker', 0, 4, 3], ['locker', 0, 5, 3], ['weaponrack', 0, 7, 3],
      ['briefing', 6, 5, 0, 'ops.work'], ['@', 5, 6, 1, 'ops.b1', 'stand'], ['@', 9, 5, 3, 'ops.b2', 'stand'], ['@', 7, 7, 2, 'ops.b3', 'stand'], ['@', 8, 4, 0, 'ops.b4', 'stand'], ['@', 6, 4, 0, 'ops.b5', 'stand'],
      ['opsdesk', 11, 8, 0], ['chair', 12, 9, 2, 'ops.d4'], ['drone', 3, 9, 0], ['crates', 1, 11, 0], ['bench', 5, 10, 0], ['vending', 15, 4, 1], ['bigplant', 15, 11, 0]],
    walls: [['B', 6.2, 'map', 1.0], ['L', 9.6, 'board', 1.2], ['L', 1.0, 'window', 1.0]] });
  const mess = [['crates', 0, 0, 0], ['stove', 3, 0, 0], ['stove', 5, 0, 0], ['fridge', 7, 0, 0], ['fridge', 8, 0, 0], ['servecounter', 3, 2, 0, 'mess.counter'], ['@', 4, 1, 0, 'mess.cook', 'stand'], ['@', 6, 1, 0, 'mess.cook2', 'stand'],
    ['vending', 0, 3, 3], ['vending', 0, 4, 3], ['sink', 16, 0, 0], ['bigplant', 15, 0, 0], ['bigplant', 0, 12, 0], ['bigplant', 16, 12, 0]];
  for (const [ri, ty] of [[0, 6], [1, 10]]) for (const [ci, tx] of [[0, 2], [1, 5], [2, 10], [3, 13]]) {
    mess.push(['bench', tx, ty - 1, 0, `mess.b${ri}${ci}a`], ['messtable', tx, ty, 0], ['bench', tx, ty + 1, 2, `mess.b${ri}${ci}b`]);
  }
  room('mess', { name: '식당동', w: 17, h: 13, floor: 'lino', wall: '#d9c7a8', exit: 8, furn: mess,
    walls: [['B', 1.6, 'notice', 0.9], ['B', 10.4, 'window', 1.0], ['B', 12.8, 'window', 1.0], ['L', 6.0, 'window', 1.0], ['L', 9.0, 'clock', 0.5]] });
  room('med', { name: '의무동', w: 15, h: 11, floor: 'medtile', wall: '#dfeceb', exit: 10,
    furn: [['medcab', 0, 0, 0], ['medcab', 1, 0, 0], ['examdesk', 2, 0, 0, 'med.work'], ['chair', 3, 1, 2, 'med.doc'], ['stool', 2, 2, 0, 'med.patient'], ['scanner', 5, 0, 0],
      ['medbed', 8, 0, 0, 'med.bed1'], ['curtain', 9, 0, 1], ['medbed', 10, 0, 0, 'med.bed2'], ['curtain', 11, 0, 1], ['medbed', 12, 0, 0, 'med.bed3'], ['curtain', 13, 0, 1], ['medbed', 14, 0, 0, 'med.bed4'],
      ['bench', 0, 5, 3, 'med.wait'], ['opsdesk', 5, 5, 0], ['chair', 6, 6, 2, 'med.nurse'], ['sink', 14, 4, 1], ['vending', 14, 6, 1], ['plant', 0, 10, 0], ['bigplant', 14, 10, 0]],
    walls: [['B', 7.2, 'cross', 0.7], ['L', 3.6, 'window', 1.0], ['L', 8.6, 'window', 1.0]] });
  room('hangar', { name: '정비격납고', w: 19, h: 14, floor: 'hangar', wall: '#6b737e', exit: 9, wallH: 64,
    furn: [['workbench', 5, 0, 0, 'hg.work'], ['@', 5, 1, 2, 'hg.w1', 'work'], ['workbench', 8, 0, 0], ['@', 8, 1, 2, 'hg.w2', 'work'], ['workbench', 11, 0, 0], ['@', 11, 1, 2, 'hg.w3', 'work'],
      ['crates', 14, 0, 0], ['crate', 16, 0, 0], ['crate', 17, 0, 0], ['rover', 1, 3, 0], ['rover', 1, 7, 0], ['drone', 7, 4, 0], ['drone', 9, 4, 0], ['drone', 11, 4, 0], ['@', 8, 5, 0, 'hg.drone', 'work'],
      ['truck', 13, 6, 0], ['locker', 0, 11, 3], ['locker', 0, 12, 3], ['crates', 14, 12, 0], ['crate', 17, 12, 0], ['bench', 4, 11, 0, 'hg.rest']],
    walls: [['B', 1.2, 'toolwall', 2.0], ['B', 14.4, 'hazard', 1.6], ['L', 2.6, 'shutter', 2.6], ['L', 7.0, 'shutter', 2.6]] });
  room('gym', { name: '체육관', w: 15, h: 11, floor: 'rubber', wall: '#4f5f6e', exit: 7,
    furn: [['treadmill', 1, 0, 0, 'gym.t1'], ['treadmill', 2, 0, 0, 'gym.t2'], ['treadmill', 3, 0, 0, 'gym.t3'], ['weights', 5, 0, 0], ['@', 5, 1, 2, 'gym.wt', 'workout'], ['weights', 8, 0, 0], ['@', 8, 1, 2, 'gym.wt2', 'workout'],
      ['benchpress', 11, 0, 0, 'gym.bp'], ['benchpress', 13, 0, 0, 'gym.bp2'], ['pullup', 11, 4, 0], ['punchbag', 14, 6, 0], ['@', 13, 6, 1, 'gym.bag', 'workout'],
      ['mat', 2, 4, 0], ['mat', 5, 4, 0], ['@', 3, 5, 0, 'gym.mat', 'workout'], ['locker', 0, 3, 3], ['locker', 0, 4, 3], ['locker', 0, 5, 3], ['vending', 0, 7, 3], ['bench', 1, 9, 0, 'gym.rest'], ['armtable', 9, 8, 0], ['bigplant', 14, 10, 0]],
    walls: [['B', 0.2, 'window', 0.8], ['B', 7.4, 'poster', 0.7], ['L', 7.4, 'mirrorw', 1.6]] });
  room('px', { name: '보급창고 (PX)', w: 13, h: 10, floor: 'concrete', wall: '#c9c1a8', exit: 6,
    furn: [['shopcounter', 5, 2, 0, 'px.shop'], ['@', 5, 1, 0, 'px.clerk', 'stand'], ['crates', 0, 0, 0], ['crates', 9, 0, 0], ['crate', 11, 0, 0], ['crate', 12, 0, 0],
      ['pxshelf', 1, 5, 0], ['pxshelf', 3, 5, 0], ['pxshelf', 8, 5, 0], ['pxshelf', 10, 5, 0], ['pxshelf', 1, 7, 0], ['pxshelf', 3, 7, 0], ['pxshelf', 8, 7, 0], ['pxshelf', 10, 7, 0], ['vending', 0, 3, 3], ['bigplant', 12, 9, 0]],
    walls: [['B', 6.2, 'notice', 0.9], ['L', 6.4, 'window', 1.0]] });
  room('lounge', { name: '휴게실', w: 13, h: 10, floor: 'carpet', wall: '#e2d5f0', exit: 6,
    furn: [['shelf', 0, 0, 0], ['tv', 3, 0, 0, 'lng.tv'], ['rug_blue', 3, 1, 0], ['sofa', 2, 3, 2, 'lng.sofa1'], ['sofa_green', 4, 3, 2, 'lng.sofa2'], ['arcade', 8, 0, 0], ['@', 8, 1, 2, 'lng.arcade', 'stand'], ['arcade', 9, 0, 0], ['arcade', 10, 0, 0], ['vending', 12, 0, 0],
      ['gametable', 9, 5, 0], ['stool', 8, 5, 0, 'lng.g1'], ['stool', 11, 5, 0, 'lng.g2'], ['lamp', 0, 3, 0], ['sofa', 0, 4, 3, 'lng.sofa3'], ['sidetable', 0, 6, 0], ['plant', 12, 9, 0], ['bigplant', 0, 9, 0]],
    walls: [['B', 1.8, 'window', 1.0], ['B', 6.4, 'poster', 0.7], ['L', 1.2, 'window', 1.0], ['L', 7.4, 'poster', 0.7]] });
  room('shower', { name: '샤워실', w: 11, h: 8, floor: 'tile', wall: '#cfe3ea', exit: 5,
    furn: [['showerstall', 1, 0, 0, 'sh.1'], ['showerstall', 2, 0, 0], ['showerstall', 3, 0, 0], ['showerstall', 4, 0, 0], ['sink', 0, 2, 3], ['sink', 0, 3, 3], ['sink', 0, 4, 3], ['locker', 7, 0, 0], ['locker', 8, 0, 0], ['locker', 9, 0, 0], ['locker', 10, 0, 0], ['bench', 6, 4, 0, 'sh.bench'], ['mirror', 0, 5, 3], ['plant', 10, 7, 0]],
    walls: [['L', 1.8, 'mirrorw', 2.0], ['B', 5.6, 'window', 0.8]] });
  room('admin', { name: '행정동', w: 13, h: 10, floor: 'carpet', wall: '#d8d2c0', exit: 6,
    furn: [['opsdesk', 1, 0, 0], ['chair', 2, 1, 2, 'adm.c1'], ['opsdesk', 4, 0, 0], ['chair', 5, 1, 2, 'adm.c2'], ['filecab', 6, 0, 0], ['filecab', 7, 0, 0], ['flagstand', 8, 0, 0], ['flagstand', 11, 0, 0], ['chair', 9, 1, 0, 'adm.cmd'], ['opsdesk', 9, 2, 0], ['bigplant', 12, 0, 0],
      ['bench', 0, 4, 3, 'adm.wait'], ['table', 4, 5, 0], ['chair', 3, 5, 3, 'adm.m1'], ['chair', 6, 6, 1, 'adm.m2'], ['plant', 12, 9, 0], ['bigplant', 0, 9, 0]],
    walls: [['B', 9.6, 'flag', 0.9], ['L', 1.8, 'board', 1.2], ['L', 7.6, 'window', 1.0]] });
  room('comms', { name: '통신실', w: 12, h: 9, floor: 'darktile', wall: '#3d4654', exit: 6,
    furn: [['console', 1, 0, 0], ['chair', 2, 1, 2, 'com.1'], ['console', 4, 0, 0], ['chair', 5, 1, 2, 'com.2'], ['console', 7, 0, 0], ['chair', 8, 1, 2, 'com.3'], ['server', 10, 0, 0], ['server', 11, 0, 0], ['server', 0, 3, 3], ['server', 0, 4, 3],
      ['opsdesk', 3, 5, 0], ['chair', 4, 6, 2, 'com.4'], ['bench', 8, 6, 0], ['plant', 0, 8, 0]],
    walls: [['L', 5.6, 'map', 1.4], ['B', 9.4, 'screen', 0.9]] });
  const brk = [];
  [1, 3, 5, 9, 11, 13].forEach((x, i) => brk.push(['bunk', x, 0, 0, 'brk.bed' + i]));
  [2, 4, 10, 12].forEach(x => brk.push(['locker', x, 0, 0]));
  [1, 3, 11, 13].forEach((x, i) => brk.push(['bunk', x, 8, 2, 'brk.bedb' + i]));
  brk.push(['table', 6, 4, 0], ['stool', 5, 4, 0, 'brk.s1'], ['stool', 8, 5, 0, 'brk.s2'], ['stool', 6, 6, 0, 'brk.s3'], ['tv', 0, 4, 3], ['bench', 1, 4, 1, 'brk.tv']);
  room('barracks', { name: '병사 생활관', w: 15, h: 10, floor: 'lino', wall: '#c9d1bd', exit: 7, furn: brk,
    walls: [['B', 6.6, 'window', 1.2], ['L', 2.4, 'window', 0.9], ['L', 6.4, 'board', 1.0]] });
  room('lab', { name: '민간 생태연구소', w: 15, h: 11, floor: 'tile', wall: '#e6f2ee', exit: 7,
    furn: [['labbench', 1, 0, 0, 'lab.work'], ['stool', 2, 1, 0, 'lab.1'], ['labbench', 4, 0, 0], ['stool', 5, 1, 0, 'lab.2'], ['specimen', 7, 0, 0], ['specimen', 8, 0, 0], ['opsdesk', 10, 0, 0], ['chair', 11, 1, 2, 'lab.boss'], ['shelf', 13, 0, 0],
      ['bigplant', 0, 3, 0], ['plant', 0, 4, 0], ['bigplant', 0, 5, 0], ['labbench', 5, 5, 0], ['stool', 6, 6, 0, 'lab.3'], ['@', 8, 6, 3, 'lab.c', 'work'], ['specimen', 14, 5, 0], ['specimen', 14, 6, 0], ['bench', 10, 9, 0], ['bigplant', 14, 10, 0]],
    walls: [['B', 9.6, 'window', 1.0], ['L', 7.0, 'window', 1.0], ['L', 9.2, 'board', 1.2]] });
  const cafe = [['cafecounter', 4, 2, 0, 'cafe.shop'], ['@', 5, 1, 0, 'cafe.barista', 'stand'], ['kitchen', 2, 0, 0], ['fridge', 7, 0, 0], ['shelf', 8, 0, 0], ['plant', 0, 0, 0], ['plant', 12, 0, 0],
    ['bigplant', 0, 9, 0], ['bigplant', 12, 9, 0], ['sofa', 12, 3, 1, 'cafe.sofa'], ['cafetable', 11, 3, 0], ['lamp', 0, 3, 0]];
  for (const ty of [5, 8]) for (const tx of [2, 9]) cafe.push(['chair', tx - 1, ty, 3, `cafe.c${tx}${ty}a`], ['cafetable', tx, ty, 0], ['chair', tx + 1, ty, 1, `cafe.c${tx}${ty}b`]);
  room('cafe', { name: '향열매 카페', w: 13, h: 10, floor: 'cafe', wall: '#f4e4c8', exit: 6, furn: cafe, date: true,
    walls: [['B', 9.6, 'window', 1.0], ['L', 5.6, 'window', 1.0], ['L', 7.6, 'poster', 0.7], ['B', 0.6, 'menu', 1.2]] });

  // ---------------- 606부대 야외 ----------------
  const base = { id: 'base', name: '606부대 생활구역', kind: 'out', w: 64, h: 64, buildings: [], decor: [], zones: [] };
  // 건물: door {f: 'L'(y+d면) | 'R'(x+w면), u: 면 위치}
  base.buildings = [
    { id: 'b_ops', name: '수색팀 작전동', to: 'ops', x: 16, y: 5, w: 13, d: 10, h: 58, wall: '#8a9468', roof: '#5f6847', stripe: '#c9a227', icon: 'star', door: { f: 'R', u: 6 }, roofDeco: ['antenna', 'ac'] },
    { id: 'b_comms', name: '통신실', to: 'comms', x: 5, y: 5, w: 8, d: 9, h: 50, wall: '#7f8a96', roof: '#56606b', stripe: '#5fa8ff', icon: 'antenna', door: { f: 'R', u: 4 }, roofDeco: ['dish', 'antenna'] },
    { id: 'b_cap', name: '대위 개인 막사', to: 'q_captain', x: 6, y: 18, w: 8, d: 7, h: 46, wall: '#6b7a5c', roof: '#4a5640', stripe: '#d0563b', icon: 'home', door: { f: 'L', u: 3 }, roofDeco: ['ac', 'ac'] },
    { id: 'b_admin', name: '행정동', to: 'admin', x: 17, y: 18, w: 11, d: 9, h: 54, wall: '#b9ad92', roof: '#7f7560', stripe: '#2f5a3a', icon: 'doc', door: { f: 'L', u: 5 }, roofDeco: ['ac'] },
    { id: 'b_mess', name: '식당동', to: 'mess', x: 34, y: 6, w: 14, d: 12, h: 52, wall: '#c9b48c', roof: '#8a7552', stripe: '#d36b4a', icon: 'fork', door: { f: 'L', u: 6 }, roofDeco: ['vents', 'ac'] },
    { id: 'b_med', name: '의무동', to: 'med', x: 50, y: 6, w: 9, d: 10, h: 50, wall: '#e6ecee', roof: '#a9b4bc', stripe: '#d64545', icon: 'cross', door: { f: 'L', u: 4 }, roofDeco: ['ac'] },
    { id: 'b_shower', name: '샤워실', to: 'shower', x: 34, y: 22, w: 7, d: 6, h: 40, wall: '#a9c3cc', roof: '#6f8a94', stripe: '#5fc8e8', icon: 'drop', door: { f: 'R', u: 2 }, roofDeco: ['vents'] },
    { id: 'b_lounge', name: '휴게실', to: 'lounge', x: 50, y: 20, w: 8, d: 7, h: 42, wall: '#b8a6c9', roof: '#7a6a8a', stripe: '#ff8bea', icon: 'controller', door: { f: 'L', u: 3 }, roofDeco: ['ac'] },
    { id: 'b_quarters', name: '간부 숙소동', to: 'q_player', x: 18, y: 36, w: 11, d: 8, h: 56, wall: '#c2b49a', roof: '#857a62', stripe: '#3b7dd8', icon: 'bed', door: { f: 'R', u: 4 }, roofDeco: ['ac', 'solar'] },
    { id: 'b_barracks', name: '병사 생활관', to: 'barracks', x: 18, y: 48, w: 11, d: 8, h: 50, wall: '#a8b08e', roof: '#6f7758', stripe: '#c9a227', icon: 'bed', door: { f: 'R', u: 4 }, roofDeco: ['ac'] },
    { id: 'b_px', name: '보급창고 (PX)', to: 'px', x: 5, y: 36, w: 9, d: 8, h: 46, wall: '#b3a37a', roof: '#7a6c4b', stripe: '#7fb86a', icon: 'box', door: { f: 'L', u: 4 }, roofDeco: ['vents'] },
    { id: 'b_hangar', name: '정비격납고', to: 'hangar', x: 36, y: 35, w: 14, d: 11, h: 66, wall: '#8d98a3', roof: '#5d666f', stripe: '#e8c56a', icon: 'wrench', door: { f: 'L', u: 6, wide: true }, roofDeco: ['vents', 'vents', 'antenna'] },
    { id: 'b_gym', name: '체육관', to: 'gym', x: 52, y: 35, w: 8, d: 9, h: 50, wall: '#7f9aa8', roof: '#56707e', stripe: '#ff9b42', icon: 'dumbbell', door: { f: 'L', u: 3 }, roofDeco: ['ac'] },
  ];
  // 장식: [가구id, x, y, r]
  const D = base.decor;
  // 가로등 (도로변)
  for (let t = 6; t <= 58; t += 7) { D.push(['streetlamp', 29, t, 0], ['streetlamp', t, 29, 0]); }
  // 광장
  D.push(['flagpole', 35, 35, 0], ['benchout', 26, 34, 2], ['benchout', 25, 28, 0], ['planter', 27, 28, 0], ['benchout', 35, 28, 0], ['planter', 25, 33, 0], ['kiosk', 33, 28, 0], ['planter', 37, 33, 1], ['benchout', 34, 37, 2]);
  // 나무와 화단
  const trees = [[4, 16], [4, 26], [15, 27], [15, 16], [44, 21], [46, 27], [59, 18], [59, 28], [33, 4], [48, 4], [4, 45], [15, 46], [4, 57], [30, 57], [51, 33], [45, 32], [6, 31], [12, 33], [40, 28], [56, 46]];
  trees.forEach(([x, y], i) => D.push([i % 3 === 2 ? 'tree2' : 'tree', x, y, 0]));
  [[3, 30], [8, 34], [43, 30], [55, 31], [14, 58], [9, 49], [16, 33]].forEach(([x, y]) => D.push(['bush', x, y, 0]));
  [[5, 28], [7, 28], [42, 24], [48, 24], [10, 46], [3, 47], [24, 45], [47, 19]].forEach(([x, y]) => D.push(['glowflower', x, y, 0]));
  // 정문
  D.push(['guardpost', 34, 58, 0], ['barrier', 29, 60, 0], ['sandbags', 26, 59, 0], ['sandbags', 34, 56, 1], ['shuttlestop', 24, 57, 0], ['kiosk', 23, 56, 0]);
  // 통신 · 시설
  D.push(['radar', 6, 15, 0], ['watertank', 3, 20, 0], ['solar', 3, 33, 0], ['solar', 3, 35, 0], ['solar', 3, 37, 0]);
  // 격납고 앞 계류장 · 차량
  D.push(['truck', 38, 48, 0], ['crates', 44, 48, 0], ['crate', 47, 48, 0], ['crates', 53, 47, 1], ['rover', 30, 47, 0]);
  // 훈련장
  D.push(['hurdle', 40, 52, 0], ['hurdle', 44, 52, 0], ['hurdle', 48, 52, 0], ['climbwall', 52, 51, 0], ['sandbags', 40, 56, 0], ['sandbags', 44, 56, 0], ['benchout', 37, 55, 1]);
  // 식당 앞 벤치 · 자판기
  D.push(['benchout', 38, 20, 0], ['vending', 44, 18, 0], ['benchout', 12, 44, 0], ['crates', 8, 46, 0]);
  base.decor = D;
  base.zones = [
    { t: 'plaza', x0: 25, y0: 25, x1: 38, y1: 38 },
    { t: 'grass', x0: 3, y0: 26, x1: 16, y1: 34 }, { t: 'grass', x0: 40, y0: 19, x1: 49, y1: 29 }, { t: 'grass', x0: 3, y0: 44, x1: 16, y1: 59 }, { t: 'grass', x0: 54, y0: 17, x1: 60, y1: 30 },
    { t: 'dirt', x0: 36, y0: 50, x1: 59, y1: 59 }, { t: 'hangar', x0: 36, y0: 46, x1: 59, y1: 49 },
  ];
  base.roads = [{ x0: 30, y0: 3, x1: 32, y1: 63, axis: 'y' }, { x0: 3, y0: 30, x1: 60, y1: 32, axis: 'x' }];
  base.walls = [ // 외곽 방벽 (정문 x 30~32 비움)
    { x: 2, y: 2, w: 60, d: 1 }, { x: 2, y: 3, w: 1, d: 58 }, { x: 61, y: 3, w: 1, d: 58 }, { x: 2, y: 61, w: 28, d: 1 }, { x: 33, y: 61, w: 29, d: 1 },
  ];
  base.decor.push(['eventbooth', 34, 33, 0, ['LB38', 'LB46', 'LB49', 'LB47', 'LB44', 'LB48', 'LB42', 'LB45', 'LB43', 'LB40', 'LB41', 'LB52', 'LB55', 'LB56', 'LB39']], ['pullup', 46, 54, 0], ['target', 55, 56, 0], ['target', 57, 56, 0], ['coursestart', 38, 53, 1]);
  base.desert = true;
  base.spots = { // 야외 스폿
    'base.flag': [33, 34, 0, 'stand'], 'base.gate': [33, 59, 3, 'stand'], 'base.gate2': [28, 59, 1, 'stand'], 'base.train1': [42, 54, 0, 'workout'], 'base.train2': [46, 54, 0, 'workout'], 'base.train3': [50, 54, 0, 'workout'],
    'base.ev1': [33, 35, 2, 'stand'], 'base.ev2': [37, 35, 2, 'stand'], 'base.ev3': [34, 36, 2, 'stand'], 'base.ev4': [36, 36, 2, 'stand'], 'base.ev5': [32, 34, 1, 'stand'], 'base.ev6': [38, 34, 3, 'stand'],
    'base.messfront': [41, 21, 0, 'stand'], 'base.plaza1': [30, 27, 0, 'stand'], 'base.plaza2': [34, 30, 3, 'stand'], 'base.apron': [42, 47, 1, 'stand'], 'base.quarters': [30, 41, 3, 'stand'],
  };
  M.base = base;

  // ---------------- 돔시티 연구·주거구역 ----------------
  const dome = { id: 'dome', name: '돔시티 · 연구·주거구역', kind: 'out', w: 48, h: 48, dome: true, buildings: [], decor: [] };
  dome.buildings = [
    { id: 'd_apt', name: '민간 주거구역', to: 'apt_player', x: 4, y: 4, w: 11, d: 10, h: 92, wall: '#dfe6ee', roof: '#9fb0c0', stripe: '#7fb8e8', icon: 'home', door: { f: 'R', u: 4 }, roofDeco: ['solar', 'ac'], tall: true },
    { id: 'd_lab', name: '민간 생태연구소', to: 'lab', x: 30, y: 4, w: 12, d: 10, h: 62, wall: '#e6f2ee', roof: '#8fc4b4', stripe: '#3fb08a', icon: 'leaf', door: { f: 'L', u: 5 }, roofDeco: ['dish', 'vents'], glass: true },
    { id: 'd_cafe', name: '향열매 카페', to: 'cafe', x: 4, y: 29, w: 9, d: 9, h: 44, wall: '#f4e4c8', roof: '#c98a5a', stripe: '#ff8b5e', icon: 'cup', door: { f: 'R', u: 3 }, roofDeco: ['ac'], awning: '#ff8b5e' },
    { id: 'd_apt2', name: '민간 주거 B동', x: 32, y: 31, w: 10, d: 8, h: 84, wall: '#e8e0d4', roof: '#a99c88', stripe: '#c9a27a', icon: 'home', roofDeco: ['solar', 'ac'], tall: true },
  ];
  const DD = dome.decor;
  DD.push(['fountain', 20, 20, 0], ['benchout', 16, 18, 0], ['benchout', 26, 18, 0], ['benchout', 16, 25, 2], ['benchout', 26, 25, 2]);
  for (const [x, y] of [[17, 16], [27, 16], [17, 27], [27, 27], [16, 10], [24, 8], [24, 14], [14, 33], [24, 33], [24, 40], [38, 22], [30, 22]]) DD.push(['streetlamp', x, y, 0]);
  for (const [x, y] of [[2, 18], [6, 18], [10, 18], [2, 22], [7, 23], [11, 22], [36, 16], [42, 16], [44, 21], [44, 26], [16, 42], [10, 42], [4, 42], [40, 41]]) DD.push(['tree', x, y, 0]);
  for (const [x, y] of [[4, 20], [9, 20], [12, 24], [38, 19], [41, 24], [13, 40], [7, 44]]) DD.push(['glowflower', x, y, 0]);
  DD.push(['shuttlestop', 22, 42, 0], ['kiosk', 26, 42, 0], ['parasol', 14, 30, 0], ['parasol', 14, 35, 0], ['flowerbed', 30, 41, 0], ['benchout', 36, 42, 0], ['arch', 20, 1, 0], ['planter', 30, 15, 0], ['planter', 38, 15, 0], ['kiosk', 19, 15, 0], ['bush', 3, 26, 0], ['bush', 44, 18, 0], ['vending', 28, 37, 0]);
  dome.zones = [
    { t: 'plaza', x0: 15, y0: 15, x1: 29, y1: 29 }, { t: 'domegrass', x0: 1, y0: 16, x1: 14, y1: 27 }, { t: 'domegrass', x0: 34, y0: 16, x1: 46, y1: 28 }, { t: 'domegrass', x0: 1, y0: 39, x1: 18, y1: 46 },
    { t: 'cafe', x0: 13, y0: 29, x1: 17, y1: 38 }, { t: 'water', x0: 34, y0: 44, x1: 46, y1: 46 },
  ];
  dome.roads = [{ x0: 20, y0: 1, x1: 22, y1: 47, axis: 'y', walk: true }, { x0: 1, y0: 20, x1: 46, y1: 22, axis: 'x', walk: true }];
  dome.links = [{ x0: 20, x1: 22, y0: 0, y1: 0, to: 'plaza', ax: 25.5, ay: 48.5, label: '🚶 중앙광장 · 상업구역으로' }];
  dome.walls = [{ x: 0, y: 0, w: 20, d: 1, glass: true }, { x: 23, y: 0, w: 25, d: 1, glass: true }, { x: 0, y: 1, w: 1, d: 47, glass: true }, { x: 47, y: 1, w: 1, d: 47, glass: true }, { x: 1, y: 47, w: 46, d: 1, glass: true }];
  dome.spots = { 'dome.plaza': [19, 24, 0, 'stand'], 'dome.bench': [17, 19, 0, 'stand'], 'dome.shuttle': [23, 41, 0, 'stand'], 'dome.apt': [16, 8, 1, 'stand'], 'dome.lab': [35, 15, 0, 'stand'] };
  M.dome = dome;


  // ---------------- 돔시티 중앙광장 · 상업구역 (Alpha 0.2) ----------------
  const plaza = { id: 'plaza', name: '돔시티 · 중앙광장 · 상업구역', kind: 'out', w: 52, h: 52, dome: true, buildings: [], decor: [] };
  plaza.buildings = [
    { id: 'p_deck', name: '관람데크 · 별비 투영실', to: 'starroom', x: 28, y: 14, w: 8, d: 7, h: 40, wall: '#3a3f6a', roof: '#d9dde2', stripe: '#9fe6ff', icon: 'star', door: { f: 'L', u: 3 }, roofDeco: ['dish'], glass: true },
    { id: 'p_samgyup', name: '냉삼집 (문성호네)', to: 'samgyup', x: 4, y: 13, w: 8, d: 8, h: 44, wall: '#d9c7a8', roof: '#8a5a3c', stripe: '#d0563b', icon: 'fork', door: { f: 'R', u: 3 }, roofDeco: ['vents', 'ac'], awning: '#d0563b' },
    { id: 'p_arcade', name: '오락실', to: 'arcade', x: 4, y: 26, w: 8, d: 7, h: 46, wall: '#3a2a6a', roof: '#2a1f4f', stripe: '#ff6bd5', icon: 'controller', door: { f: 'R', u: 3 }, roofDeco: ['ac'] },
    { id: 'p_flower', name: '유리돔 꽃시장', to: 'flower', x: 15, y: 39, w: 8, d: 7, h: 40, wall: '#e8f4f0', roof: '#9fd8e8', stripe: '#ff9ed2', icon: 'heart', door: { f: 'R', u: 3 }, glass: true, awning: '#ff9ed2' },
    { id: 'p_pub', name: '술집 골목 입구', x: 4, y: 3, w: 9, d: 6, h: 48, wall: '#4a3a40', roof: '#2a2025', stripe: '#ffb070', icon: 'cup', closed: true, closedMsg: '🍺 술집 골목 — 성인 콘텐츠는 이후 버전에서 플레이어가 직접 선택할 때만 열려요' },
    { id: 'p_port', name: '우주항구 방면 터미널', x: 38, y: 3, w: 10, d: 6, h: 52, wall: '#9fb0c0', roof: '#5d666f', stripe: '#3b5fa8', icon: 'bus', closed: true, closedMsg: '🚀 우주항구 · 행성 간 여행은 Beta 0.6에서 열려요' },
  ];
  const PD = plaza.decor;
  PD.push(['fountain', 18, 18, 0], ['benchout', 16, 22, 2], ['benchout', 20, 22, 2], ['benchout', 16, 15, 0], ['kiosk', 23, 27, 0], ['arch', 24, 50, 0]);
  for (const [x, y] of [[14, 14], [22, 14], [14, 36], [36, 36], [36, 23], [22, 30], [28, 30], [13, 24]]) PD.push(['streetlamp', x, y, 0]);
  for (let x = 14; x <= 36; x += 4) PD.push(['lantern', x, 10, 0]);
  for (let y = 14; y <= 46; y += 4) PD.push(['lantern', 27, y, 0]);
  for (const [x, y] of [[2, 23], [2, 36], [9, 36], [14, 48], [33, 47], [46, 47], [49, 40], [49, 13]]) PD.push(['tree', x, y, 0]);
  // 투명수로 정원
  for (const [x, y] of [[40, 17], [40, 25], [40, 32], [47, 20], [47, 29]]) PD.push(['glowflower', x, y, 0]);
  PD.push(['benchout', 44, 16, 0], ['benchout', 44, 34, 2], ['tree2', 48, 24, 0], ['flowerbed', 25, 42, 0]);
  // 축제 · 야시장 매대 (행사가 열릴 때만 나타남)
  for (const [x, y] of [[29, 25], [29, 28], [33, 25], [33, 28], [16, 31], [19, 31]]) PD.push(['stall', x, y, 0, ['LB02', 'LB04', 'LB05', 'LB09', 'LB12', 'LB13', 'LB11']]);
  plaza.zones = [
    { t: 'plaza', x0: 13, y0: 13, x1: 37, y1: 37 }, { t: 'glassfloor', x0: 39, y0: 15, x1: 49, y1: 35 }, { t: 'water', x0: 42, y0: 17, x1: 42, y1: 33 }, { t: 'water', x0: 46, y0: 17, x1: 46, y1: 33 },
    { t: 'domegrass', x0: 1, y0: 34, x1: 13, y1: 50 }, { t: 'domegrass', x0: 30, y0: 39, x1: 50, y1: 50 }, { t: 'cafe', x0: 2, y0: 9, x1: 50, y1: 11 },
  ];
  plaza.roads = [{ x0: 24, y0: 1, x1: 26, y1: 51, axis: 'y', walk: true }, { x0: 1, y0: 24, x1: 38, y1: 26, axis: 'x', walk: true }];
  plaza.walls = [{ x: 0, y: 0, w: 52, d: 1, glass: true }, { x: 0, y: 1, w: 1, d: 51, glass: true }, { x: 51, y: 1, w: 1, d: 51, glass: true }, { x: 1, y: 51, w: 23, d: 1, glass: true }, { x: 27, y: 51, w: 24, d: 1, glass: true }];
  plaza.links = [{ x0: 24, x1: 26, y0: 51, y1: 51, to: 'dome', ax: 21.5, ay: 2.5, label: '🚶 연구·주거구역으로' }];
  plaza.spots = { 'plaza.kiosk': [22, 28, 1, 'stand'], 'plaza.water': [44, 21, 3, 'stand'], 'plaza.gate': [25, 47, 0, 'stand'], 'plaza.deck': [31, 23, 2, 'stand'], 'plaza.fountain': [21, 19, 3, 'stand'], 'plaza.street': [20, 12, 0, 'stand'] };
  M.plaza = plaza;

  // 실내
  const sg = [['kitchen', 0, 0, 0], ['stove', 2, 0, 0], ['cafecounter', 4, 1, 0, 'sg.shop'], ['@', 5, 0, 0, 'sg.boss', 'stand'], ['fridge', 8, 0, 0], ['fridge', 9, 0, 0], ['bigplant', 11, 0, 0]];
  for (const ty of [4, 7]) for (const tx of [2, 8]) { sg.push(['grilltable', tx, ty, 0, `sg.t${tx}${ty}`], ['stool', tx - 1, ty, 0, `sg.s${tx}${ty}a`], ['stool', tx - 1, ty + 1, 0], ['stool', tx + 2, ty, 0], ['stool', tx + 2, ty + 1, 0]); }
  room('samgyup', { name: '냉삼집', w: 12, h: 9, floor: 'darkwood', wall: '#d9c7a8', exit: 6, furn: sg, date: true,
    walls: [['B', 0.6, 'menu', 1.2], ['B', 6.8, 'notice', 0.9], ['L', 2.2, 'window', 1.0], ['L', 5.6, 'poster', 0.7]] });
  room('flower', { name: '유리돔 꽃시장', w: 11, h: 9, floor: 'tile', wall: '#e8f4f0', exit: 5, date: true,
    furn: [['cafecounter', 4, 1, 0, 'fl.shop'], ['@', 5, 0, 0, 'fl.clerk', 'stand'], ['flowershelf', 0, 0, 0], ['flowershelf', 8, 0, 0], ['flowershelf', 0, 3, 3], ['flowerbed', 2, 4, 0], ['flowerbed', 7, 4, 0], ['bench', 2, 7, 0], ['glassvase', 10, 0, 0], ['bigplant', 10, 8, 0], ['plant', 0, 8, 0]],
    walls: [['B', 2.6, 'window', 1.0], ['B', 7.4, 'window', 1.0], ['L', 6.0, 'window', 1.0]] });
  room('arcade', { name: '오락실', w: 13, h: 10, floor: 'darktile', wall: '#2a1f4f', exit: 6, date: true,
    furn: [['arcade', 1, 0, 0], ['arcade', 2, 0, 0], ['arcade', 3, 0, 0], ['arcade', 4, 0, 0], ['@', 2, 1, 2, 'ac.player', 'stand'], ['clawmachine', 8, 0, 0], ['clawmachine', 9, 0, 0], ['clawmachine', 10, 0, 0], ['clawmachine', 11, 0, 0], ['clawmachine', 0, 3, 3], ['clawmachine', 0, 4, 3],
      ['shopcounter', 10, 4, 0], ['@', 11, 3, 0, 'ac.clerk', 'stand'], ['vending', 12, 6, 1], ['gametable', 5, 5, 0], ['stool', 4, 5, 0], ['stool', 7, 5, 0], ['bench', 1, 8, 0], ['bigplant', 12, 9, 0]],
    walls: [['B', 5.4, 'poster', 0.7], ['B', 11.0, 'screen', 1.2], ['L', 6.8, 'poster', 0.7]] });
  const st = [['projector', 6, 2, 0, 'star.proj'], ['bigplant', 0, 0, 0], ['bigplant', 13, 0, 0]];
  for (const ty of [6, 8]) for (let tx = 1; tx <= 12; tx++) if (tx !== 6 && tx !== 7) st.push(['theaterseat', tx, ty, 2, `star.s${tx}_${ty}`]);
  room('starroom', { name: '별비 투영실', w: 14, h: 10, floor: 'darktile', wall: '#141028', exit: 7, wallH: 60, date: true, stars: true, furn: st,
    walls: [['B', 1.4, 'screen', 2.6], ['B', 9.6, 'screen', 2.6], ['L', 3.0, 'screen', 3.4]] });

  // 바깥 건물을 줄여 길과 마당이 보이게 (문 쪽 면은 그대로 두고 반대편을 줄임)
  function shrink(b, f = 0.72, fh = 0.74) {
    const w = Math.max(5, Math.round(b.w * f)), d = Math.max(4, Math.round(b.d * f));
    if (b.door && b.door.f === 'R') { b.x += b.w - w; b.door.u = Math.min(d - (b.door.wide ? 3 : 1), Math.max(1, Math.round(b.door.u * d / b.d))); }
    else if (b.door && b.door.f === 'L') { b.y += b.d - d; b.door.u = Math.min(w - (b.door.wide ? 3 : 1), Math.max(1, Math.round(b.door.u * w / b.w))); }
    b.w = w; b.d = d; b.h = Math.round(b.h * fh);
  }
  for (const k of ['base', 'dome', 'plaza']) for (const b of M[k].buildings) shrink(b);

  // 실내 → 바깥 연결
  const outOf = { q_player: ['base', 'b_quarters'], q_captain: ['base', 'b_cap'], ops: ['base', 'b_ops'], mess: ['base', 'b_mess'], med: ['base', 'b_med'], hangar: ['base', 'b_hangar'], gym: ['base', 'b_gym'],
    px: ['base', 'b_px'], lounge: ['base', 'b_lounge'], shower: ['base', 'b_shower'], admin: ['base', 'b_admin'], comms: ['base', 'b_comms'], barracks: ['base', 'b_barracks'],
    apt_player: ['dome', 'd_apt'], lab: ['dome', 'd_lab'], cafe: ['dome', 'd_cafe'], samgyup: ['plaza', 'p_samgyup'], flower: ['plaza', 'p_flower'], arcade: ['plaza', 'p_arcade'], starroom: ['plaza', 'p_deck'] };
  for (const k in outOf) { M[k].parent = outOf[k][0]; M[k].building = outOf[k][1]; }

  PX.MAPS = M;
})();
