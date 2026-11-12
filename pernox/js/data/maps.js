// 맵 데이터: 606부대(64×64), 돔시티 연구·주거구역(48×48), 실내 16곳
// 가구 항목: [가구id, x, y, 회전(0~3), 스폿이름?]   스폿만: ['@', x, y, 방향(0=S,1=E,2=N,3=W), 스폿이름, 자세]
// 벽 장식: [벽 'B'(뒷벽 y=0) | 'L'(왼벽 x=0), 위치, 종류, 폭]
'use strict';
(() => {
  const M = {};

  // ---------------- 실내 ----------------
  function room(id, o) {
    M[id] = Object.assign({ id, kind: 'in', wallH: 58 }, o);
  }
  const playerRoom = [
    ['plant', 0, 0, 0], ['bed', 1, 0, 0, 'home.bed'], ['sidetable', 2, 0, 0], ['cabinet', 3, 0, 0], ['terminal', 5, 0, 0], ['chair', 6, 1, 2],
    ['cooler', 7, 0, 0], ['shelf', 8, 0, 0], ['photo', 10, 0, 0], ['fridge', 11, 0, 0], ['kitchen', 12, 0, 0],
    ['mirror', 0, 1, 3], ['wardrobe', 0, 3, 3], ['lamp', 0, 6, 0], ['tv', 0, 7, 3], ['rug', 2, 7, 0], ['sofa', 4, 7, 1, 'home.sofa'],
    ['table', 10, 3, 0], ['chair', 9, 4, 3], ['chair', 12, 3, 1], ['plant', 13, 9, 0], ['bigplant', 0, 11, 0],
  ];
  room('q_player', { name: '내 숙소 (간부 숙소동)', w: 14, h: 12, floor: 'wood', wall: '#e9dcc8', exit: 10, home: true,
    furn: playerRoom.map(a => a.slice()),
    walls: [['B', 3.6, 'window', 1.2], ['B', 9.2, 'poster', 0.8], ['L', 5.0, 'window', 1.2], ['L', 9.8, 'clock', 0.5]] });
  room('apt_player', { name: '내 숙소 (민간 주거구역)', w: 14, h: 12, floor: 'cafe', wall: '#dfe8f0', exit: 10, home: true,
    furn: playerRoom.map(a => a.slice()),
    walls: [['B', 3.6, 'window', 1.2], ['B', 9.2, 'poster', 0.8], ['L', 5.0, 'window', 1.2], ['L', 9.8, 'clock', 0.5]] });
  room('q_captain', { name: '대위 개인 막사', w: 16, h: 14, floor: 'darkwood', wall: '#5f6b5a', exit: 12, lowDoor: true,
    furn: [['cooler', 0, 0, 0], ['bigbed', 1, 0, 0, 'cap.bed'], ['sidetable', 3, 0, 0], ['cooler', 4, 0, 0], ['weaponrack', 6, 0, 0], ['alienbench', 9, 0, 0], ['@', 9, 1, 2, 'cap.craft', 'work'], ['stool', 10, 1, 0],
      ['workbench', 12, 0, 0], ['fridge', 14, 0, 0], ['bigplant', 15, 0, 0], ['kitchen', 0, 3, 3], ['tv', 0, 6, 3], ['rug_blue', 2, 6, 0], ['sofa_green', 6, 6, 1, 'cap.sofa'],
      ['weights', 0, 9, 3], ['benchpress', 3, 10, 0], ['punchbag', 5, 12, 0], ['@', 2, 11, 1, 'cap.gym', 'workout'], ['table', 11, 5, 0], ['chair', 10, 6, 3], ['chair', 13, 5, 1], ['locker', 15, 3, 1], ['crates', 14, 10, 0], ['lamp', 15, 8, 0]],
    walls: [['B', 5.0, 'flag', 1.0], ['B', 12.6, 'toolwall', 1.6], ['L', 1.2, 'window', 1.1], ['L', 8.6, 'poster', 0.8]] });
  room('ops', { name: '수색팀 작전동', w: 22, h: 16, floor: 'metal', wall: '#56606b', exit: 18,
    furn: [['opsdesk', 2, 0, 0], ['chair', 3, 1, 2, 'ops.d1'], ['opsdesk', 5, 0, 0], ['chair', 6, 1, 2, 'ops.d2'], ['console', 9, 0, 0], ['server', 11, 0, 0], ['server', 12, 0, 0],
      ['opsdesk', 13, 0, 0], ['chair', 14, 1, 2, 'ops.d3'], ['opsdesk', 16, 0, 0], ['chair', 17, 1, 2, 'ops.d4'], ['opsdesk', 19, 0, 0], ['chair', 19, 1, 2, 'ops.cap'], ['flagstand', 21, 0, 0],
      ['locker', 0, 3, 3], ['locker', 0, 4, 3], ['locker', 0, 5, 3], ['locker', 0, 6, 3], ['locker', 0, 7, 3], ['weaponrack', 0, 9, 3],
      ['briefing', 8, 6, 0, 'ops.work'], ['@', 7, 7, 1, 'ops.b1', 'stand'], ['@', 11, 6, 3, 'ops.b2', 'stand'], ['@', 9, 8, 2, 'ops.b3', 'stand'], ['@', 10, 5, 0, 'ops.b4', 'stand'], ['@', 8, 5, 0, 'ops.b5', 'stand'],
      ['drone', 4, 11, 0], ['crates', 2, 14, 0], ['crate', 5, 14, 0], ['bench', 13, 11, 0], ['vending', 21, 5, 1], ['bigplant', 21, 14, 0]],
    walls: [['B', 7.6, 'map', 1.2], ['L', 12.2, 'board', 1.4], ['L', 1.2, 'window', 1.1]] });
  const mess = [['fridge', 9, 0, 0], ['fridge', 10, 0, 0], ['stove', 5, 0, 0], ['stove', 7, 0, 0], ['servecounter', 5, 2, 0, 'mess.counter'], ['@', 6, 1, 0, 'mess.cook', 'stand'], ['@', 8, 1, 0, 'mess.cook2', 'stand'],
    ['vending', 0, 3, 3], ['vending', 0, 4, 3], ['bigplant', 23, 0, 0], ['bigplant', 0, 17, 0], ['bigplant', 23, 17, 0], ['sink', 22, 0, 0], ['crates', 1, 0, 0]];
  for (const [ri, ty] of [[0, 6], [1, 10], [2, 14]]) for (const [ci, tx] of [[0, 3], [1, 8], [2, 14], [3, 19]]) {
    mess.push(['bench', tx, ty - 1, 0, `mess.b${ri}${ci}a`], ['messtable', tx, ty, 0], ['bench', tx, ty + 1, 2, `mess.b${ri}${ci}b`]);
  }
  room('mess', { name: '식당동', w: 24, h: 18, floor: 'lino', wall: '#d9c7a8', exit: 12, furn: mess,
    walls: [['B', 2.6, 'notice', 1.0], ['B', 13.4, 'window', 1.2], ['B', 16.4, 'window', 1.2], ['B', 19.4, 'window', 1.2], ['L', 7.8, 'window', 1.2], ['L', 11.8, 'window', 1.2], ['L', 15.0, 'clock', 0.5]] });
  room('med', { name: '의무동', w: 20, h: 16, floor: 'medtile', wall: '#dfeceb', exit: 14,
    furn: [['medcab', 0, 0, 0], ['medcab', 1, 0, 0], ['examdesk', 3, 0, 0, 'med.work'], ['chair', 4, 1, 2, 'med.doc'], ['stool', 3, 2, 0, 'med.patient'], ['scanner', 7, 0, 0],
      ['medbed', 11, 0, 0, 'med.bed1'], ['curtain', 12, 0, 1], ['medbed', 13, 0, 0, 'med.bed2'], ['curtain', 14, 0, 1], ['medbed', 15, 0, 0, 'med.bed3'], ['curtain', 16, 0, 1], ['medbed', 17, 0, 0, 'med.bed4'],
      ['medcab', 0, 3, 3], ['medcab', 0, 4, 3], ['bench', 0, 8, 3, 'med.wait'], ['opsdesk', 7, 7, 0], ['chair', 8, 8, 2, 'med.nurse'], ['sink', 19, 3, 1], ['vending', 19, 8, 1], ['plant', 0, 14, 0], ['bigplant', 19, 14, 0]],
    walls: [['B', 9.8, 'cross', 0.8], ['L', 6.2, 'window', 1.2], ['L', 12.0, 'window', 1.2]] });
  room('hangar', { name: '정비격납고', w: 26, h: 20, floor: 'hangar', wall: '#6b737e', exit: 13, wallH: 72,
    furn: [['workbench', 8, 0, 0, 'hg.work'], ['@', 8, 1, 2, 'hg.w1', 'work'], ['workbench', 11, 0, 0], ['@', 11, 1, 2, 'hg.w2', 'work'], ['workbench', 14, 0, 0], ['@', 14, 1, 2, 'hg.w3', 'work'],
      ['crates', 19, 0, 0], ['crates', 22, 0, 0], ['crate', 24, 0, 0], ['crate', 25, 0, 0], ['rover', 3, 4, 0], ['rover', 3, 9, 0], ['drone', 10, 5, 0], ['drone', 12, 5, 0], ['drone', 14, 5, 0],
      ['@', 11, 6, 0, 'hg.drone', 'work'], ['truck', 18, 8, 0], ['locker', 0, 13, 3], ['locker', 0, 14, 3], ['locker', 0, 15, 3], ['crates', 20, 15, 0], ['crate', 23, 15, 0], ['crate', 23, 16, 0], ['bench', 8, 15, 0, 'hg.rest']],
    walls: [['B', 2.0, 'toolwall', 2.4], ['B', 17.0, 'hazard', 1.8], ['L', 3.0, 'shutter', 3.0], ['L', 9.0, 'shutter', 3.0]] });
  room('gym', { name: '체육관', w: 22, h: 16, floor: 'rubber', wall: '#4f5f6e', exit: 11,
    furn: [['treadmill', 2, 0, 0, 'gym.t1'], ['treadmill', 4, 0, 0, 'gym.t2'], ['treadmill', 6, 0, 0, 'gym.t3'], ['weights', 9, 0, 0], ['@', 9, 1, 2, 'gym.wt', 'workout'], ['weights', 12, 0, 0], ['@', 12, 1, 2, 'gym.wt2', 'workout'],
      ['benchpress', 15, 0, 0, 'gym.bp'], ['benchpress', 18, 0, 0, 'gym.bp2'], ['punchbag', 20, 4, 0], ['@', 19, 4, 1, 'gym.bag', 'workout'], ['punchbag', 20, 7, 0],
      ['mat', 3, 6, 0], ['mat', 6, 6, 0], ['mat', 9, 8, 0], ['@', 4, 7, 0, 'gym.mat', 'workout'], ['locker', 0, 4, 3], ['locker', 0, 5, 3], ['locker', 0, 6, 3], ['locker', 0, 7, 3],
      ['bench', 2, 12, 0, 'gym.rest'], ['vending', 0, 10, 3], ['mat', 13, 8, 0], ['punchbag', 16, 9, 0], ['bigplant', 21, 14, 0]],
    walls: [['B', 0.6, 'window', 1.2], ['B', 10.8, 'poster', 0.8], ['L', 9.4, 'mirrorw', 2.0]] });
  room('px', { name: '보급창고 (PX)', w: 18, h: 14, floor: 'concrete', wall: '#c9c1a8', exit: 9,
    furn: [['shopcounter', 8, 3, 0, 'px.shop'], ['@', 8, 2, 0, 'px.clerk', 'stand'], ['crates', 1, 0, 0], ['crates', 4, 0, 0], ['crates', 13, 0, 0], ['crate', 16, 0, 0], ['crate', 17, 0, 0],
      ['pxshelf', 2, 6, 0], ['pxshelf', 5, 6, 0], ['pxshelf', 11, 6, 0], ['pxshelf', 14, 6, 0], ['pxshelf', 2, 9, 0], ['pxshelf', 5, 9, 0], ['pxshelf', 11, 9, 0], ['pxshelf', 14, 9, 0],
      ['vending', 0, 4, 3], ['bigplant', 17, 13, 0]],
    walls: [['B', 9.0, 'notice', 1.0], ['L', 9.0, 'window', 1.2]] });
  room('lounge', { name: '휴게실', w: 18, h: 14, floor: 'carpet', wall: '#e2d5f0', exit: 9,
    furn: [['shelf', 1, 0, 0], ['tv', 6, 0, 0, 'lng.tv'], ['rug_blue', 5, 1, 0], ['sofa', 5, 3, 2, 'lng.sofa1'], ['sofa_green', 7, 3, 2, 'lng.sofa2'],
      ['arcade', 12, 0, 0], ['@', 12, 1, 2, 'lng.arcade', 'stand'], ['arcade', 13, 0, 0], ['arcade', 14, 0, 0], ['vending', 17, 0, 0],
      ['gametable', 11, 6, 0], ['stool', 10, 6, 0, 'lng.g1'], ['stool', 13, 6, 0, 'lng.g2'], ['lamp', 0, 5, 0], ['sofa', 0, 6, 3, 'lng.sofa3'], ['sidetable', 0, 8, 0], ['plant', 16, 13, 0], ['bigplant', 0, 13, 0]],
    walls: [['B', 3.6, 'window', 1.2], ['B', 9.8, 'poster', 0.8], ['L', 1.6, 'window', 1.2], ['L', 10.2, 'poster', 0.8]] });
  room('shower', { name: '샤워실', w: 14, h: 12, floor: 'tile', wall: '#cfe3ea', exit: 7,
    furn: [['showerstall', 1, 0, 0, 'sh.1'], ['showerstall', 2, 0, 0], ['showerstall', 3, 0, 0], ['showerstall', 4, 0, 0], ['showerstall', 5, 0, 0], ['showerstall', 6, 0, 0],
      ['sink', 0, 3, 3], ['sink', 0, 4, 3], ['sink', 0, 5, 3], ['sink', 0, 6, 3], ['locker', 9, 0, 0], ['locker', 10, 0, 0], ['locker', 11, 0, 0], ['locker', 12, 0, 0], ['locker', 13, 0, 0],
      ['bench', 8, 6, 0, 'sh.bench'], ['mirror', 0, 8, 3], ['plant', 13, 11, 0]],
    walls: [['L', 4.4, 'mirrorw', 2.4], ['B', 7.6, 'window', 1.0]] });
  room('admin', { name: '행정동', w: 18, h: 14, floor: 'carpet', wall: '#d8d2c0', exit: 9,
    furn: [['opsdesk', 2, 0, 0], ['chair', 3, 1, 2, 'adm.c1'], ['opsdesk', 5, 0, 0], ['chair', 6, 1, 2, 'adm.c2'], ['filecab', 8, 0, 0], ['filecab', 9, 0, 0], ['filecab', 10, 0, 0],
      ['flagstand', 12, 0, 0], ['flagstand', 15, 0, 0], ['chair', 13, 1, 0, 'adm.cmd'], ['opsdesk', 13, 2, 0], ['bigplant', 17, 0, 0],
      ['bench', 0, 6, 3, 'adm.wait'], ['table', 6, 7, 0], ['chair', 5, 7, 3, 'adm.m1'], ['chair', 8, 8, 1, 'adm.m2'], ['plant', 17, 13, 0], ['bigplant', 0, 13, 0]],
    walls: [['B', 13.6, 'flag', 1.0], ['B', 0.6, 'window', 1.2], ['L', 3.0, 'board', 1.4], ['L', 10.2, 'window', 1.2]] });
  room('comms', { name: '통신실', w: 16, h: 12, floor: 'darktile', wall: '#3d4654', exit: 8,
    furn: [['console', 2, 0, 0], ['chair', 3, 1, 2, 'com.1'], ['console', 5, 0, 0], ['chair', 6, 1, 2, 'com.2'], ['console', 8, 0, 0], ['chair', 9, 1, 2, 'com.3'],
      ['server', 11, 0, 0], ['server', 12, 0, 0], ['server', 13, 0, 0], ['server', 14, 0, 0], ['server', 15, 0, 0], ['server', 0, 3, 3], ['server', 0, 4, 3], ['server', 0, 5, 3],
      ['opsdesk', 6, 6, 0], ['chair', 7, 7, 2, 'com.4'], ['bench', 12, 9, 0], ['plant', 0, 10, 0]],
    walls: [['L', 7.4, 'map', 1.6], ['B', 0.6, 'screen', 1.0]] });
  const brk = [];
  [1, 3, 5, 7, 12, 14, 16, 18].forEach((x, i) => brk.push(['bunk', x, 0, 0, 'brk.bed' + i]));
  [2, 4, 6, 13, 15, 17].forEach(x => brk.push(['locker', x, 0, 0]));
  [1, 3, 5, 14, 16, 18].forEach((x, i) => brk.push(['bunk', x, 11, 2, 'brk.bedb' + i]));
  brk.push(['table', 9, 5, 0], ['stool', 8, 5, 0, 'brk.s1'], ['stool', 11, 6, 0, 'brk.s2'], ['stool', 9, 7, 0, 'brk.s3'], ['tv', 0, 5, 3], ['bench', 2, 5, 1, 'brk.tv']);
  room('barracks', { name: '병사 생활관', w: 20, h: 14, floor: 'lino', wall: '#c9d1bd', exit: 10, furn: brk,
    walls: [['B', 9.2, 'window', 1.4], ['L', 3.2, 'window', 1.0], ['L', 8.6, 'board', 1.2]] });
  room('lab', { name: '민간 생태연구소', w: 22, h: 16, floor: 'tile', wall: '#e6f2ee', exit: 11,
    furn: [['labbench', 2, 0, 0, 'lab.work'], ['stool', 3, 1, 0, 'lab.1'], ['labbench', 5, 0, 0], ['stool', 6, 1, 0, 'lab.2'], ['labbench', 8, 0, 0], ['stool', 9, 1, 0, 'lab.3'],
      ['specimen', 12, 0, 0], ['specimen', 13, 0, 0], ['specimen', 14, 0, 0], ['specimen', 15, 0, 0], ['opsdesk', 17, 0, 0], ['chair', 18, 1, 2, 'lab.boss'], ['shelf', 20, 0, 0],
      ['bigplant', 0, 3, 0], ['plant', 0, 4, 0], ['bigplant', 0, 5, 0], ['plant', 0, 6, 0], ['bigplant', 0, 7, 0], ['labbench', 8, 7, 0], ['labbench', 12, 7, 0], ['@', 10, 8, 1, 'lab.c', 'work'],
      ['specimen', 21, 6, 0], ['specimen', 21, 7, 0], ['bench', 15, 13, 0], ['bigplant', 21, 14, 0]],
    walls: [['B', 10.4, 'window', 1.2], ['L', 9.8, 'window', 1.2], ['L', 13.0, 'board', 1.4]] });
  const cafe = [['cafecounter', 6, 2, 0, 'cafe.shop'], ['@', 7, 1, 0, 'cafe.barista', 'stand'], ['fridge', 9, 0, 0], ['shelf', 10, 0, 0], ['kitchen', 4, 0, 0], ['plant', 0, 0, 0], ['plant', 17, 0, 0],
    ['bigplant', 0, 13, 0], ['bigplant', 17, 13, 0], ['sofa', 0, 3, 3, 'cafe.sofa'], ['cafetable', 1, 3, 0], ['lamp', 0, 6, 0]];
  for (const ty of [7, 10]) for (const tx of [3, 7, 11, 15]) cafe.push(['chair', tx - 1, ty, 3, `cafe.c${tx}${ty}a`], ['cafetable', tx, ty, 0], ['chair', tx + 1, ty, 1, `cafe.c${tx}${ty}b`]);
  room('cafe', { name: '향열매 카페', w: 18, h: 14, floor: 'cafe', wall: '#f4e4c8', exit: 9, furn: cafe,
    walls: [['B', 13.0, 'window', 1.4], ['B', 15.2, 'window', 1.4], ['L', 8.8, 'window', 1.4], ['L', 11.6, 'poster', 0.8], ['B', 1.2, 'menu', 1.6]] });

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
  D.push(['radar', 6, 15, 0], ['watertank', 2, 20, 0], ['solar', 3, 33, 0], ['solar', 3, 35, 0], ['solar', 3, 37, 0]);
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
  base.desert = true;
  base.spots = { // 야외 스폿
    'base.flag': [33, 34, 0, 'stand'], 'base.gate': [33, 59, 3, 'stand'], 'base.gate2': [28, 59, 1, 'stand'], 'base.train1': [42, 54, 0, 'workout'], 'base.train2': [46, 54, 0, 'workout'], 'base.train3': [50, 54, 0, 'workout'],
    'base.messfront': [41, 21, 0, 'stand'], 'base.plaza1': [30, 27, 0, 'stand'], 'base.plaza2': [34, 30, 3, 'stand'], 'base.apron': [42, 47, 1, 'stand'], 'base.quarters': [30, 41, 3, 'stand'],
  };
  M.base = base;

  // ---------------- 돔시티 연구·주거구역 ----------------
  const dome = { id: 'dome', name: '돔시티 · 연구·주거구역', kind: 'out', w: 48, h: 48, dome: true, buildings: [], decor: [] };
  dome.buildings = [
    { id: 'd_apt', name: '민간 주거구역', to: 'apt_player', x: 4, y: 4, w: 11, d: 10, h: 92, wall: '#dfe6ee', roof: '#9fb0c0', stripe: '#7fb8e8', icon: 'home', door: { f: 'R', u: 4 }, roofDeco: ['solar', 'ac'], tall: true },
    { id: 'd_lab', name: '민간 생태연구소', to: 'lab', x: 30, y: 4, w: 12, d: 10, h: 62, wall: '#e6f2ee', roof: '#8fc4b4', stripe: '#3fb08a', icon: 'leaf', door: { f: 'L', u: 5 }, roofDeco: ['dish', 'vents'], glass: true },
    { id: 'd_cafe', name: '향열매 카페', to: 'cafe', x: 4, y: 29, w: 9, d: 9, h: 44, wall: '#f4e4c8', roof: '#c98a5a', stripe: '#ff8b5e', icon: 'cup', door: { f: 'R', u: 3 }, roofDeco: ['ac'], awning: '#ff8b5e' },
    { id: 'd_shop1', name: '냉삼집 (Alpha 0.2 예정)', x: 31, y: 30, w: 6, d: 6, h: 40, wall: '#d9c7a8', roof: '#8a5a3c', stripe: '#d0563b', icon: 'fork', awning: '#d0563b', closed: true },
    { id: 'd_shop2', name: '유리돔 꽃시장 (Alpha 0.2 예정)', x: 39, y: 30, w: 6, d: 6, h: 40, wall: '#e8f4f0', roof: '#9fd8e8', stripe: '#ff9ed2', icon: 'heart', awning: '#ff9ed2', glass: true, closed: true },
    { id: 'd_shop3', name: '오락실 (Alpha 0.2 예정)', x: 31, y: 39, w: 6, d: 5, h: 42, wall: '#3a2a6a', roof: '#2a1f4f', stripe: '#ff6bd5', icon: 'controller', closed: true },
  ];
  const DD = dome.decor;
  DD.push(['fountain', 20, 20, 0], ['benchout', 16, 18, 0], ['benchout', 26, 18, 0], ['benchout', 16, 25, 2], ['benchout', 26, 25, 2]);
  for (const [x, y] of [[17, 16], [27, 16], [17, 27], [27, 27], [16, 10], [24, 8], [24, 14], [14, 33], [24, 33], [24, 40], [38, 22], [30, 22]]) DD.push(['streetlamp', x, y, 0]);
  for (const [x, y] of [[2, 18], [6, 18], [10, 18], [2, 22], [7, 23], [11, 22], [36, 16], [42, 16], [44, 21], [44, 26], [16, 42], [10, 42], [4, 42], [40, 44]]) DD.push(['tree', x, y, 0]);
  for (const [x, y] of [[4, 20], [9, 20], [12, 24], [38, 19], [41, 24], [13, 40], [7, 44]]) DD.push(['glowflower', x, y, 0]);
  DD.push(['shuttlestop', 22, 42, 0], ['kiosk', 26, 42, 0], ['parasol', 14, 30, 0], ['parasol', 14, 35, 0], ['neonsign', 37, 37, 0], ['planter', 30, 15, 0], ['planter', 38, 15, 0], ['kiosk', 19, 15, 0], ['bush', 3, 26, 0], ['bush', 44, 18, 0], ['vending', 28, 37, 0]);
  dome.zones = [
    { t: 'plaza', x0: 15, y0: 15, x1: 29, y1: 29 }, { t: 'domegrass', x0: 1, y0: 16, x1: 14, y1: 27 }, { t: 'domegrass', x0: 34, y0: 16, x1: 46, y1: 28 }, { t: 'domegrass', x0: 1, y0: 39, x1: 18, y1: 46 },
    { t: 'cafe', x0: 13, y0: 29, x1: 17, y1: 38 }, { t: 'water', x0: 34, y0: 44, x1: 46, y1: 46 },
  ];
  dome.roads = [{ x0: 20, y0: 1, x1: 22, y1: 47, axis: 'y', walk: true }, { x0: 1, y0: 20, x1: 46, y1: 22, axis: 'x', walk: true }];
  dome.walls = [{ x: 0, y: 0, w: 48, d: 1, glass: true }, { x: 0, y: 1, w: 1, d: 47, glass: true }, { x: 47, y: 1, w: 1, d: 47, glass: true }, { x: 1, y: 47, w: 46, d: 1, glass: true }];
  dome.spots = { 'dome.plaza': [19, 24, 0, 'stand'], 'dome.bench': [17, 19, 0, 'stand'], 'dome.shuttle': [23, 41, 0, 'stand'], 'dome.apt': [16, 8, 1, 'stand'], 'dome.lab': [35, 15, 0, 'stand'] };
  M.dome = dome;

  // 실내 → 바깥 연결
  const outOf = { q_player: ['base', 'b_quarters'], q_captain: ['base', 'b_cap'], ops: ['base', 'b_ops'], mess: ['base', 'b_mess'], med: ['base', 'b_med'], hangar: ['base', 'b_hangar'], gym: ['base', 'b_gym'],
    px: ['base', 'b_px'], lounge: ['base', 'b_lounge'], shower: ['base', 'b_shower'], admin: ['base', 'b_admin'], comms: ['base', 'b_comms'], barracks: ['base', 'b_barracks'],
    apt_player: ['dome', 'd_apt'], lab: ['dome', 'd_lab'], cafe: ['dome', 'd_cafe'] };
  for (const k in outOf) { M[k].parent = outOf[k][0]; M[k].building = outOf[k][1]; }

  PX.MAPS = M;
})();
