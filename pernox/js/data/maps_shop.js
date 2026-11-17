// 돔시티 중앙광장 상점가: 별빛 가구점 · 궤도 부티크 · 은하 헤어 + 온천 · 스파 탈의실
'use strict';
(() => {
  const M = PX.MAPS;
  const room = (id, o) => { M[id] = Object.assign({ id, kind: 'in', wallH: 84 }, o); };
  room('interior', { name: '별빛 가구점', w: 14, h: 10, floor: 'darkwood', wall: '#e8dccb', exit: 7,
    furn: [['shopcounter', 1, 1, 0, 'int.shop'], ['canopybed', 4, 0, 0], ['daybed', 7, 0, 0], ['bookcase_w', 10, 0, 0], ['starlamp', 12, 0, 0], ['armchair', 0, 4, 0], ['lowtable', 2, 4, 0], ['beanbag', 4, 5, 0], ['starrug', 7, 4, 0], ['globe', 10, 4, 0], ['clock', 13, 3, 0], ['fishbowl', 12, 5, 0], ['wallshelf_plant', 0, 8, 0], ['mobile', 11, 8, 0], ['bigplant', 13, 9, 0]],
    walls: [['B', 2.8, 'window', 1.2], ['L', 5.0, 'window', 1.2]], crowd: [{ role: 'furnclerk', fixed: [1.5, 0.5, 0] }, { role: 'shopper', n: 2, x0: 3, y0: 3, x1: 11, y1: 8 }] });
  room('boutique', { name: '궤도 부티크', w: 12, h: 9, floor: 'mosaic', wall: '#f2e6ee', exit: 6,
    furn: [['shopcounter', 9, 1, 0, 'bt.shop'], ['clothesrack', 1, 0, 0], ['clothesrack', 4, 0, 0], ['mannequin', 7, 0, 0], ['mannequin', 0, 3, 0], ['clothesrack', 0, 6, 3], ['changebooth', 9, 6, 0], ['mirror', 11, 4, 0], ['cushion', 5, 4, 0], ['bigplant', 11, 8, 0]],
    walls: [['B', 6.0, 'mirrorw', 1.0], ['L', 4.4, 'window', 1.0]], crowd: [{ role: 'boutiqueclerk', fixed: [9.5, 0.5, 0] }, { role: 'shopper', n: 2, x0: 2, y0: 2, x1: 8, y1: 7 }] });
  room('salon', { name: '은하 헤어', w: 12, h: 9, floor: 'tile', wall: '#e6eef4', exit: 6,
    furn: [['salonmirror', 1, 0, 0], ['salonchair', 1, 1, 0, 'sl.c1'], ['salonmirror', 3, 0, 0], ['salonchair', 3, 1, 0, 'sl.c2'], ['salonmirror', 5, 0, 0], ['salonchair', 5, 1, 0, 'sl.c3'], ['hairwash', 8, 0, 0], ['shopcounter', 9, 4, 0, 'sl.shop'], ['bench', 0, 6, 0], ['plant', 11, 0, 0], ['bigplant', 11, 8, 0]],
    walls: [['L', 4.4, 'window', 1.0]], crowd: [{ role: 'stylist', fixed: [2.5, 2.5, 2] }, { role: 'shopper', n: 1, x0: 1, y0: 4, x1: 8, y1: 7 }] });
  // 광장 상점가: 큰길(세로) 바로 옆과, 새로 낸 남쪽 상점가 길 앞에 문이 나도록 배치
  const P = M.plaza;
  P.buildings.push(
    { id: 'p_interior', name: '별빛 가구점', to: 'interior', x: 15, y: 31, w: 8, d: 6, h: 40, wall: '#e8dccb', roof: '#8a6a4a', stripe: '#ffd166', icon: 'sofa', door: { f: 'R', u: 3 }, awning: '#c9a86a' },
    { id: 'p_boutique', name: '궤도 부티크', to: 'boutique', x: 29, y: 39, w: 7, d: 7, h: 40, wall: '#f2e6ee', roof: '#c9b0e8', stripe: '#ff9ed2', icon: 'shirt', door: { f: 'L', u: 3 }, glass: true, awning: '#ff9ed2' },
    { id: 'p_salon', name: '은하 헤어', to: 'salon', x: 38, y: 39, w: 7, d: 7, h: 40, wall: '#e6eef4', roof: '#5a6a8a', stripe: '#7fe3ff', icon: 'scissors', door: { f: 'L', u: 3 }, glass: true, awning: '#7fe3ff' });
  for (const id of ['interior', 'boutique', 'salon']) { M[id].parent = 'plaza'; M[id].building = 'p_' + id; } // 나가면 광장 그 가게 앞으로
  P.roads.push({ x0: 27, y0: 46, x1: 50, y1: 47, axis: 'x', walk: true }); // 남쪽 상점가 길
  // 길을 막던 장식 옮기기: 큰길 위 유리꽃 화단 · 상점가 길 위 나무 · 가구점 자리의 축제 매대
  const mv = (fid, x, y, nx, ny) => { const d = P.decor.find(d => d[0] === fid && d[1] === x && d[2] === y); if (d) { d[1] = nx; d[2] = ny; } };
  mv('flowerbed', 25, 42, 12, 47); mv('tree', 33, 47, 36, 49); mv('tree', 46, 47, 48, 49);
  // 온천 · 스파 탈의실
  M.onsen.furn.push(['changebooth', 12, 4, 0]);
  M.spa.decor.push(['changebooth', 10, 16, 0]);
})();
