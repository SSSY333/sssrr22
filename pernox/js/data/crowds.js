// 맵별 사람들 (이름 없는 주민 · 병사 · 손님 · 관광객). 낮에 붐비고 밤엔 한산하다.
'use strict';
(() => {
  const M = PX.MAPS;
  const D = (role, n, o = {}) => Object.assign({ role, n, busy: 'day' }, o);
  const set = (id, list) => { if (M[id]) M[id].crowd = (M[id].crowd || []).concat(list); };
  // 606부대
  set('base', [D('soldier', 7, { from: 6, to: 22 }), D('jogger', 3, { from: 6, to: 20, x0: 20, y0: 26, x1: 44, y1: 44 })]);
  set('px', [D('pxshopper', 3, { from: 8, to: 21 })]);
  set('mess', [D('messgoer', 4, { from: 7, to: 20, x0: 6, y0: 6, x1: 15, y1: 11 })]);
  set('gym', [D('gymgoer', 3, { from: 6, to: 22 })]);
  set('lounge', [D('offduty', 3, { from: 12, to: 23 })]);
  set('barracks', [D('offduty', 2, { from: 18, to: 23 })]);
  set('hangar', [D('mechanic', 3, { from: 8, to: 19 })]);
  set('admin', [D('clerkmil', 2, { from: 8, to: 18 })]);
  set('ops', [D('clerkmil', 1, { from: 8, to: 18 })]);
  // 돔시티
  set('dome', [D('citizen', 10, { to: 23 })]);
  set('plaza', [D('citizen', 12, { to: 24 }), D('tourist', 4, { from: 9, to: 22 })]);
  set('lab', [D('researcher', 2, { from: 8, to: 19 })]);
  set('cafe', [D('cafeguest', 3, { from: 8, to: 22 })]);
  set('samgyup', [D('diner', 3, { from: 11, to: 24 })]);
  set('flower', [D('shopper', 2, { from: 8, to: 20 })]);
  set('arcade', [D('arcader', 4, { from: 10, to: 23 })]);
  set('starroom', [D('spectator', 3, { from: 10, to: 23 })]);
  // 관광지 · 항구 · 다른 행성
  for (const [id, n] of [['lake', 6], ['farm', 4], ['glasshouse', 4], ['glowpath', 3], ['bluegarden', 3], ['hill', 4], ['silverdesert', 3], ['beach', 6], ['camp', 3], ['bridge', 4], ['corridor', 5], ['planet3', 7], ['planet4', 7], ['planet6', 5]]) set(id, [D('tourist', n, { from: 8, to: 23 })]);
  set('port', [D('traveler', 8, { from: 5, to: 24 })]);
  set('station', [D('traveler', 6, { from: 0, to: 24 })]);
  set('terminal', [D('traveler', 4, { from: 5, to: 24 })]);
  set('skylounge', [D('tourist', 3, { from: 12, to: 24 })]);
  set('museum', [D('tourist', 3, { from: 9, to: 19 })]);
  set('aurora', [D('tourist', 3, { from: 12, to: 24 })]);
})();
