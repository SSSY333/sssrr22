/* =========================================================================
   보장원 도트 — 지도 (광화문 거리 · 유리 빌딩 보장원 · 맛집 거리)
   단위: 픽셀 (1칸 = 16px). 동선은 3칸(48px) 이상 넓게, 가구는 서로 겹치지 않게
   ========================================================================= */
import { T, mk, R, shade, sprite, SPR, hash, gateSprite, shopSprite, SHOPS, posterPixel } from './sprites.js';

export const MW = 150 * T, MH = 78 * T;
export const FACE = 32; // 벽 높이 (화면에서)
const t = (n) => n * T;

export const OFFICE = { x0: t(30), x1: t(114), y0: t(4), y1: t(46) };
export const DOOR = { x0: t(69), x1: t(75), y: t(46) };
export const LANES = [
  { y: t(53.5), dir: -1 }, { y: t(56.5), dir: -1 },
  { y: t(63.5), dir: 1 }, { y: t(66.5), dir: 1 },
];
export const CROSSWALKS = [{ x0: t(69), x1: t(75) }, { x0: t(128), x1: t(134) }];
export const ROAD = [{ y0: t(52), y1: t(58) }, { y0: t(62), y1: t(68) }];

export function buildWorld(FONT) {
  const W = {
    objects: [], solids: [], walls: [], seats: [], stations: [], zones: [], spots: [], glows: [], dims: [],
    posters: [], clocks: [], furniture: [],
  };
  const solid = (x, y, w, h, tag = 'wall') => { const r = { x, y, w, h, tag }; W.solids.push(r); if (tag !== 'wall') W.furniture.push(r); return r; };
  // 사물 하나 놓기: (x = 가운데, y = 바닥선) · fp = 바닥 차지 영역 [왼쪽, 위, 폭, 높이] (기준점 기준)
  const put = (name, x, y, fp, o = {}) => {
    const s = typeof name === 'string' ? SPR[name] : name;
    const obj = { img: s.c, x: Math.round(x - s.ax), y: Math.round(y - s.ay), sort: y + (o.sortAdd || 0), name: o.label || name, ...o };
    W.objects.push(obj);
    if (fp) obj.fp = solid(x + fp[0], y + fp[1], fp[2], fp[3], o.tag || (typeof name === 'string' ? name : 'obj'));
    return obj;
  };
  const seat = (kind, x, y, dir, o = {}) => { const s = { id: kind + W.seats.length, kind, x, y, dir, ...o }; W.seats.push(s); return s; };
  const station = (kind, x, y, o = {}) => { const s = { id: kind + W.stations.length, kind, x, y, ...o }; W.stations.push(s); return s; };

  /* ---------- 벽 ---------- */
  const STY = {
    brick: { cap: '#8a5a4a', face: (P, w) => { P(0, 0, w, FACE, '#b5634a'); for (let y = 0; y < FACE; y += 6) for (let x = (y / 6) % 2 ? -6 : 0; x < w; x += 12) P(x + 1, y + 1, 10, 4, '#c8735a'); P(0, FACE - 3, w, 3, '#7a4a3a'); } },
    plaster: { cap: '#cfc4b4', face: (P, w) => { P(0, 0, w, FACE, '#f1e8da'); P(0, 0, w, 2, '#ffffff'); P(0, FACE - 5, w, 5, '#b89a7a'); P(0, FACE - 5, w, 1, '#d0b494'); } },
    warm: { cap: '#9a6a4a', face: (P, w) => { P(0, 0, w, FACE, '#c8946a'); for (let x = 0; x < w; x += 8) P(x, 0, 1, FACE, '#b07a52'); P(0, FACE - 5, w, 5, '#7a4e2a'); } },
    frost: { cap: '#bfc4cc', face: (P, w) => { P(0, 0, w, FACE, '#e6e3ee'); for (let x = 12; x < w; x += 24) P(x, 2, 1, FACE - 6, '#cfcad8'); P(0, FACE - 4, w, 4, '#9aa3aa'); } },
    side: { cap: '#9aa3aa', face: (P, w) => { P(0, 0, w, FACE, '#d6dce2'); P(0, FACE - 4, w, 4, '#8a949c'); } },
    glass: { cap: '#7a848c', alpha: true, face: (P, w) => { P(0, 0, w, FACE, 'rgba(170,215,235,0.34)'); for (let x = 0; x < w; x += 32) P(x, 0, 2, FACE, '#5a646c'); P(0, 0, w, 2, '#5a646c'); P(0, FACE - 3, w, 3, '#4a545c'); P(0, 12, w, 1, 'rgba(255,255,255,0.35)'); } },
  };
  function hwall(x0, x1, y, style) {
    const st = STY[style], w = x1 - x0;
    const [c, g] = mk(w, FACE + 8);
    const P = (x, yy, ww, hh, col) => R(g, x, yy, ww, hh, col);
    P(0, 0, w, 8, st.cap); P(0, 0, w, 1, shade(st.cap, 0.25)); P(0, 7, w, 1, shade(st.cap, -0.25));
    g.save(); g.translate(0, 8); st.face(P, w); g.restore();
    W.objects.push({ img: c, x: x0, y: y - FACE - 8, sort: y, wall: true, name: 'wall' });
    W.walls.push(solid(x0, y - 8, w, 8));
  }
  function vwall(x, y0, y1, style) {
    const st = STY[style === 'glass' ? 'glass' : style];
    for (let a = y0; a < y1; a += T) {
      const h = Math.min(T, y1 - a), last = a + h >= y1;
      const [c, g] = mk(8, h + (last ? FACE : 0));
      R(g, 0, 0, 8, h, st.cap); R(g, 0, 0, 1, h, shade(st.cap, 0.25)); R(g, 7, 0, 1, h, shade(st.cap, -0.25));
      if (last) { g.save(); g.translate(0, h); st.face((xx, yy, ww, hh, col) => R(g, xx, yy, ww, hh, col), 8); g.restore(); }
      W.objects.push({ img: c, x: x - 4, y: a - FACE, sort: a + h, wall: true, name: 'wall' });
    }
    W.walls.push(solid(x - 4, y0, 8, y1 - y0));
  }
  // 바깥 경계 (걸을 수 없는 곳)
  solid(-T, -T, MW + 2 * T, T); solid(-T, MH, MW + 2 * T, T); solid(-T, 0, T, MH); solid(MW, 0, T, MH);
  solid(0, 0, t(30), t(45.5)); solid(t(114), 0, MW - t(114), t(45.5)); solid(t(30), 0, t(84), t(3.5));

  // 건물 외벽
  hwall(t(30), t(114), t(4), 'brick');
  vwall(t(30), t(4), t(46), 'side'); vwall(t(114), t(4), t(46), 'side');
  hwall(t(30) + 4, DOOR.x0, t(46), 'glass'); hwall(DOOR.x1, t(114) - 4, t(46), 'glass');
  // 위층 방들 (아래쪽 벽에 문틈)
  hwall(t(30) + 4, t(41), t(17), 'plaster'); hwall(t(44), t(47), t(17), 'plaster'); // 회의실
  vwall(t(47), t(4), t(17), 'plaster');
  hwall(t(47), t(50), t(17), 'plaster'); hwall(t(56), t(59), t(17), 'plaster'); // 프린터실
  vwall(t(59), t(4), t(17), 'warm');
  hwall(t(59), t(65), t(17), 'warm'); hwall(t(69), t(75), t(17), 'warm'); // 불만창고
  vwall(t(75), t(4), t(17), 'warm');
  vwall(t(89), t(4), t(24), 'frost'); // 수면실
  hwall(t(89), t(92), t(24), 'frost'); hwall(t(96), t(114) - 4, t(24), 'frost');

  /* ---------- 바닥 ---------- */
  const [floor, fg] = mk(MW, MH);
  const F = (x, y, w, h, c) => R(fg, x, y, w, h, c);
  const pattern = (x0, y0, w, h, step, fn) => { for (let y = y0; y < y0 + h; y += step) for (let x = x0; x < x0 + w; x += step) fn(x, y, ((x - x0) / step + (y - y0) / step) | 0); };
  // 잔디 · 북악산 쪽
  F(0, 0, MW, MH, '#6a9a4a');
  pattern(0, 0, MW, MH, 8, (x, y) => { const r = hash(x, y); if (r < 0.12) F(x + 2, y + 3, 2, 2, '#5a8a3e'); else if (r > 0.93) F(x + 4, y + 1, 1, 2, '#88b85e'); });
  // 인도 (건물 앞)
  const sidewalk = (x, y, w, h) => { F(x, y, w, h, '#c9b8a6'); pattern(x, y, w, h, 16, (xx, yy, k) => { F(xx, yy, 16, 16, (k % 3) ? '#d2c2b0' : '#c4b2a0'); F(xx, yy, 16, 1, '#b8a694'); F(xx, yy, 1, 16, '#b8a694'); }); };
  sidewalk(0, t(44), MW, t(8));
  // 광화문 앞 돌바닥
  F(0, t(30), t(30), t(14), '#b8ae9c'); pattern(0, t(30), t(30), t(14), 32, (x, y, k) => { F(x, y, 32, 32, k % 2 ? '#c2b8a6' : '#b8ae9c'); F(x, y, 32, 1, '#a49a88'); F(x, y, 1, 32, '#a49a88'); });
  // 차도
  for (const r of ROAD) {
    F(0, r.y0, MW, r.y1 - r.y0, '#4a4a52');
    pattern(0, r.y0, MW, r.y1 - r.y0, 4, (x, y) => { if (hash(x, y) < 0.08) F(x, y, 1, 1, '#56565e'); });
    F(0, r.y0, MW, 2, '#8a8a90'); F(0, r.y1 - 2, MW, 2, '#8a8a90');
    for (let x = 0; x < MW; x += 48) F(x, (r.y0 + r.y1) / 2 - 1, 24, 2, '#e8e4dc'); // 차선
  }
  F(0, t(58), MW, 2, '#f2c14e'); F(0, t(62) - 2, MW, 2, '#f2c14e'); // 중앙선
  // 중앙 화단 (가운데)
  F(0, t(58) + 2, MW, t(4) - 4, '#7aa85a');
  // 건너편 인도 · 공원
  sidewalk(0, t(68), MW, t(4));
  F(0, t(72), MW, t(6), '#78a85a');
  pattern(0, t(72), MW, t(6), 8, (x, y) => { const r = hash(x + 7, y); if (r < 0.1) F(x + 1, y + 2, 2, 2, '#6a9a4a'); else if (r > 0.96) { F(x + 3, y + 3, 2, 2, ['#f6d5d8', '#fff1c4', '#ffffff'][(r * 300 | 0) % 3]); } });
  F(0, t(75), MW, t(1), '#d2c2b0'); // 공원 산책길
  // 횡단보도: 흰 막대가 차가 다니는 방향(가로)으로 길게, 건너는 방향(세로)으로 줄지어
  for (const cw of CROSSWALKS) {
    F(cw.x0, t(58), cw.x1 - cw.x0, t(4), '#c9b8a6'); // 중앙 화단 틈 (보행로)
    for (const r of ROAD) for (let y = r.y0 + 4; y < r.y1 - 4; y += 12) F(cw.x0 + 4, y, cw.x1 - cw.x0 - 8, 6, '#f4f1ea');
  }
  // 건물 안 바닥
  const inside = (x, y, w, h, base, alt, step, line) => { F(x, y, w, h, base); pattern(x, y, w, h, step, (xx, yy, k) => { if (alt && k % 2) F(xx, yy, step, step, alt); if (line) { F(xx, yy, step, 1, line); F(xx, yy, 1, step, line); } }); };
  inside(t(30), t(2), t(84), t(44), '#e9e2d6', null, 16, '#ddd4c6'); // 기본 (로비 · 홀: 대리석)
  pattern(t(56), t(17), t(33), t(29), 32, (x, y, k) => { F(x, y, 32, 32, k % 2 ? '#efe9de' : '#e4dccd'); F(x, y, 32, 1, '#d6ccbc'); });
  inside(t(30), t(17), t(26), t(29), '#9fb0c0', '#a8b8c6', 16, null); // 업무공간 카펫
  inside(t(30), t(2), t(17), t(15), '#8a9aa8', '#92a2b0', 16, null); // 회의실
  inside(t(47), t(2), t(12), t(15), '#c8c4bc', null, 16, '#bab6ae'); // 프린터실
  inside(t(59), t(2), t(16), t(15), '#b07a52', null, 8, null); // 불만창고 (원목)
  pattern(t(59), t(2), t(16), t(15), 8, (x, y) => F(x, y + 7, 8, 1, '#9a6a44'));
  inside(t(75), t(2), t(14), t(15), '#f4f1ea', '#e6e2da', 16, null); // 탕비실 타일
  inside(t(89), t(2), t(25), t(22), '#6a6a8a', '#707092', 16, null); // 수면실 카펫
  inside(t(89), t(24), t(25), t(22), '#c8925a', null, 8, null); // 라운지 원목
  pattern(t(89), t(24), t(25), t(22), 8, (x, y, k) => { F(x, y, 8, 1, '#b07a48'); if (k % 2) F(x, y, 1, 8, '#b07a48'); });
  // 러그
  const rug = (x, y, w, h, c1, c2) => { F(x, y, w, h, c1); F(x + 4, y + 4, w - 8, h - 8, c2); F(x + 8, y + 8, w - 16, h - 16, c1); };
  rug(t(99), t(30), t(12), t(9), '#e9c46a', '#f4efe6');
  rug(t(63), t(8), t(8), t(6), '#c0503a', '#e9a07a');
  rug(t(68), t(43), t(8), t(3), '#8a4a3a', '#a85a4a'); // 현관 매트
  rug(t(34), t(7.5), t(11), t(6), '#6a7a8a', '#7a8a9a');
  // 문턱
  F(DOOR.x0, t(46) - 8, DOOR.x1 - DOOR.x0, 8, '#9aa3aa');
  W.floor = floor;

  /* ---------- 회의실 (x 30~47, y 4~17) ---------- */
  put('tv', t(38.5), t(4) + 2, null, { sortAdd: 2, mount: true });
  put('whiteb', t(32.8), t(4) + 2, null, { sortAdd: 2, mount: true });
  put('meetTable', t(38.5), t(11), [-56, -28, 112, 22], { label: 'meetTable' });
  for (const x of [-36, 0, 36]) { put('chair1', t(38.5) + x, t(8.4), null); seat('meeting', t(38.5) + x, t(8.4) - 2, 0, { chair: true }); }
  for (const x of [-36, 0, 36]) { put('chairB1', t(38.5) + x, t(12.6), null, { sortAdd: 3 }); seat('meeting', t(38.5) + x, t(12.6) - 3, 1, { chair: true }); }
  put('plant', t(45.6), t(15.6), [-6, -6, 12, 6]);
  put('plant', t(31.4), t(15.6), [-6, -6, 12, 6]);

  /* ---------- 프린터실 (x 47~59) ---------- */
  [t(48.8), t(51.4), t(54)].forEach((x, i) => {
    put('printer', x, t(4) + 24, [-13, -14, 26, 14], { printer: i });
    station('printer', x, t(4) + 38, { label: '🖨️ 출력하기', printer: i });
  });
  put('shredder', t(57.2), t(4) + 22, [-8, -12, 16, 12]);
  station('shredder', t(57.2), t(4) + 36, { label: '🗑️ 문서 파쇄하기' });
  put('paperShelf', t(52), t(13) + 4, [-15, -10, 30, 10]);

  /* ---------- 불만창고 (x 59~75) — 벽난로 · 곰 인형 ---------- */
  const fire = put('fireplace', t(67), t(4) + 44, [-28, -16, 56, 16]);
  W.fire = { x: t(67), y: t(4) + 24 };
  station('fire', t(67), t(4) + 58, { label: '🔥 스트레스 태우기' });
  put('teddy', t(61.2), t(4) + 32, [-13, -12, 26, 12]);
  station('teddy', t(61.2), t(4) + 46, { label: '🧸 꼭 안아주기' });
  put('beanbag', t(64), t(14), [-10, -8, 20, 8], { sortAdd: 3 }); seat('beanbag', t(64), t(14) - 5, 1);
  put('beanbag2', t(70), t(14), [-10, -8, 20, 8], { sortAdd: 3 }); seat('beanbag', t(70), t(14) - 5, 1);
  put('plant', t(73.6), t(4) + 24, [-6, -6, 12, 6]);
  W.dims.push({ x: t(59), y: t(2), w: t(16), h: t(15), a: 0.28, col: '#2a1630' });
  W.glows.push({ x: t(67), y: t(4) + 30, r: 70, col: '255,150,60', a: 0.45, always: true, flicker: true });

  /* ---------- 탕비실 (x 75~89) ---------- */
  put('counter', t(79.6), t(4) + 30, [-56, -14, 112, 14]);
  put('coffeeM', t(77.4), t(4) + 22, null, { sortAdd: 9, mount: true });
  station('coffee', t(77.4), t(4) + 44, { label: '☕ 커피 내리기' });
  station('sink', t(80.4) + 6, t(4) + 44, { label: '🚰 물 마시기' });
  put('snackShelf', t(86.3), t(4) + 36, [-15, -12, 30, 12]);
  station('snack', t(86.3), t(4) + 50, { label: '🍪 간식 꺼내기' });
  put('hiTable', t(82), t(11.5), [-15, -12, 30, 12]);
  put('stool', t(79.6), t(11.6), null); seat('stool', t(79.6), t(11.6) - 2, 3);
  put('stool', t(84.4), t(11.6), null); seat('stool', t(84.4), t(11.6) - 2, 2);
  put('fridge', t(76.3), t(11), [-13, -12, 26, 12]);
  put('bins', t(87.9), t(15.4), [-13, -8, 26, 8]);

  /* ---------- 수면실 (x 89~114, y 4~24) ---------- */
  const bedXs = [t(95), t(100), t(105), t(110)];
  for (const [row, by] of [[0, t(4) + 54], [1, t(14) + 54]]) {
    bedXs.forEach((x, i) => {
      put('bed', x, by, [-17, -48, 34, 48]);
      station('bed', x, by + 12, { label: '😴 침대에 눕기', bed: { x, y: by - 30 }, id: 'bed' + row + i });
      W.glows.push({ x, y: by - 50, r: 26, col: ['255,190,120', '200,170,255', '255,170,200', '170,220,255'][(i + row) % 4], a: 0.5, always: true });
      if (i < 3) put('curtain', x + 40, by, [-3, -12, 6, 12]);
    });
  }
  put('moonlamp', t(91), t(4) + 30, [-6, -6, 12, 6]);
  W.dims.push({ x: t(89), y: t(2), w: t(25), h: t(22), a: 0.32, col: '#14143a' });

  /* ---------- 라운지 (x 89~114, y 24~46) ---------- */
  [t(101), t(105), t(109)].forEach((x, i) => { put('shelf', x, t(24) + 6, [-24, -4, 48, 4], { mount: true }); station('book', x, t(24) + 22, { label: '📖 책 꺼내 읽기' }); });
  put('sofaL', t(105), t(32.5), [-32, -20, 64, 18]);
  [-20, 0, 20].forEach((dx) => seat('sofa', t(105) + dx, t(32.5) - 8, 0));
  put('ctable', t(105), t(35.4), [-18, -14, 36, 12]);
  put('beanbag', t(101.5), t(38.6), [-10, -8, 20, 8], { sortAdd: 3 }); seat('beanbag', t(101.5), t(38.6) - 5, 1);
  put('beanbag2', t(108.5), t(38.6), [-10, -8, 20, 8], { sortAdd: 3 }); seat('beanbag', t(108.5), t(38.6) - 5, 1);
  put('pingpong', t(95), t(42.5), [-30, -32, 60, 30]);
  station('pp', t(95) - 42, t(42.5) - 14, { label: '🏓 탁구 치기', side: 0 });
  station('pp', t(95) + 42, t(42.5) - 14, { label: '🏓 탁구 치기', side: 1 });
  W.pingpong = { x: t(95), y: t(42.5) - 20 };
  put('bigplant', t(112.4), t(30), [-8, -6, 16, 6]);
  put('plant', t(90.6), t(27), [-6, -6, 12, 6]);

  /* ---------- 업무공간 (x 30~56, y 17~46) ---------- */
  // 포스터 벽 (회의실 아래쪽 벽에 반듯하게)
  ['cheer', 'lunch', 'sports', 'notice'].forEach((k, i) => {
    const s = posterPixel(k), x = t(31) + 6 + i * 34;
    W.objects.push({ img: s.c, x, y: t(17) - FACE + 2, sort: t(17) + 1, mount: true, name: 'poster' });
    W.posters.push({ kind: k, x: x + 12, y: t(17) });
  });
  station('poster', t(34.3), t(17) + 18, { label: '🔍 포스터 보기' });
  W.clocks.push({ x: t(40.3), y: t(17) - FACE + 14, sort: t(17) + 1 });
  // 책상 섬 (4자리) — 통로 3칸 이상
  let chairN = 0;
  function pod(cx, top) {
    const L = cx - 15, Rr = cx + 15;
    put('chair' + (chairN++ % 6), L, top + 14, null); seat('desk', L, top + 12, 0, { chair: true });
    put('chair' + (chairN++ % 6), Rr, top + 14, null); seat('desk', Rr, top + 12, 0, { chair: true });
    put('deskB', L, top + 38, null); put('deskB', Rr, top + 38, null);
    put('desk', L, top + 60, null); put('desk', Rr, top + 60, null);
    solid(cx - 30, top + 18, 60, 40, 'desk');
    put('chairB' + (chairN++ % 6), L, top + 72, null, { sortAdd: 3 }); seat('desk', L, top + 69, 1, { chair: true });
    put('chairB' + (chairN++ % 6), Rr, top + 72, null, { sortAdd: 3 }); seat('desk', Rr, top + 69, 1, { chair: true });
  }
  for (const cx of [t(34.5), t(41.5), t(48.5)]) for (const top of [t(20.5), t(31)]) pod(cx, top);
  put('water', t(32), t(44.4), [-7, -8, 14, 8]); station('water', t(32), t(44.4) + 4, { label: '💧 물 받기' });
  put('bigplant', t(54.6), t(19), [-8, -6, 16, 6]);
  put('plant', t(54.6), t(44.6), [-6, -6, 12, 6]);
  put('bins', t(36), t(45.2), [-13, -8, 26, 8]);

  /* ---------- 홀 · 로비 (x 56~89) ---------- */
  put('bigplant', t(72), t(25), [-8, -6, 16, 6]);
  put('bench', t(68), t(26.4), [-20, -8, 40, 8]); seat('bench', t(68) - 10, t(26.4) - 6, 0); seat('bench', t(68) + 10, t(26.4) - 6, 0);
  put('bench', t(76), t(26.4), [-20, -8, 40, 8]); seat('bench', t(76) - 10, t(26.4) - 6, 0); seat('bench', t(76) + 10, t(26.4) - 6, 0);
  put('plant', t(66.2), t(45.4), [-6, -6, 12, 6]); put('plant', t(77.8), t(45.4), [-6, -6, 12, 6]);
  put('bigplant', t(57.6), t(19), [-8, -6, 16, 6]); put('bigplant', t(87.4), t(19.6), [-8, -6, 16, 6]);

  /* ---------- 바깥: 광화문 · 거리 · 맛집 ---------- */
  const gate = gateSprite();
  W.objects.push({ img: gate.c, x: t(14) - gate.ax, y: t(44) - gate.ay, sort: t(44), name: 'gate' });
  solid(t(14) - 190, t(44) - 40, 380, 40, 'gate');
  // 동상 (중앙 화단)
  const statue = sprite(36, 56, (P) => {
    P(2, 36, 32, 20, '#a59b8d'); P(0, 34, 36, 4, '#8f8578'); P(4, 52, 28, 4, '#8f8578');
    const gd = '#d9a84a', gd2 = '#b8862e';
    P(8, 22, 20, 14, gd); P(10, 10, 16, 14, gd); P(13, 2, 10, 10, gd); P(14, 0, 8, 3, gd2); P(10, 26, 16, 2, gd2); P(6, 18, 6, 10, gd2); P(24, 16, 6, 12, gd2);
  });
  W.objects.push({ img: statue.c, x: t(14) - statue.ax, y: t(61) - statue.ay, sort: t(61), name: 'statue' });
  solid(t(14) - 18, t(61) - 14, 36, 14, 'statue');
  // 중앙 화단 울타리 (횡단보도 틈만 열려 있어요)
  let hx = 0;
  const gaps = [...CROSSWALKS.map((c) => [c.x0, c.x1]), [t(14) - 20, t(14) + 20]].sort((a, b) => a[0] - b[0]);
  for (const [g0, g1] of gaps) { hedge(hx, g0); hx = g1; }
  hedge(hx, MW);
  function hedge(x0, x1) {
    if (x1 - x0 < 8) return;
    for (let a = x0; a < x1; a += 64) {
      const w = Math.min(64, x1 - a);
      const s = sprite(w, 14, (P) => { P(0, 0, w, 14, '#4e8a3e'); P(0, 0, w, 3, '#6aa84a'); for (let x = 2; x < w; x += 6) P(x, 4 + (x % 4), 2, 2, '#3e7a30'); for (let x = 4; x < w; x += 16) P(x, 2, 3, 3, ['#f6d5d8', '#fff1c4', '#e889a0'][(x / 16 | 0) % 3]); });
      W.objects.push({ img: s.c, x: a - 1, y: t(60.5) - 14, sort: t(60.5), name: 'hedge', low: true });
    }
    solid(x0, t(58.5), x1 - x0, t(3), 'hedge');
  }
  // 은행나무 · 가로등 (건물 앞 인도: y 46~52)
  const treeAt = (x, y) => { put('ginkgo', x, y, [-4, -5, 8, 5], { tree: true }); };
  const lampAt = (x, y) => { put('lamp', x, y, [-3, -4, 6, 4]); W.glows.push({ x, y: y - 50, r: 56, col: '255,210,140', a: 0.55, lamp: true }); };
  for (let x = t(36); x < t(146); x += t(10)) {
    if (CROSSWALKS.some((c) => x > c.x0 - 30 && x < c.x1 + 30) || (x > DOOR.x0 - 40 && x < DOOR.x1 + 40)) continue;
    if (x > t(115) && x < t(149)) continue; // 맛집 앞은 테라스 자리
    treeAt(x, t(51.4));
  }
  for (const x of [t(41), t(61), t(83), t(103), t(121.75), t(140.5)]) lampAt(x, t(51.6));
  for (let x = t(4); x < t(148); x += t(12)) { if (CROSSWALKS.some((c) => x > c.x0 - 30 && x < c.x1 + 30)) continue; treeAt(x, t(71.6)); }
  for (const x of [t(10), t(34), t(58), t(86), t(110), t(140)]) lampAt(x, t(71.8));
  put('busstop', t(96), t(71.2), [-23, -8, 46, 8]); seat('bench', t(96) - 10, t(71.2) - 6, 0, { busstop: true }); seat('bench', t(96) + 10, t(71.2) - 6, 0, { busstop: true });
  put('hydrant', t(62), t(51.2), [-4, -4, 8, 4]);
  put('bench', t(55), t(47.2), [-20, -8, 40, 8]); seat('bench', t(55) - 10, t(47.2) - 6, 0); seat('bench', t(55) + 10, t(47.2) - 6, 0);
  // 공원 벤치
  for (const x of [t(20), t(48), t(84), t(118)]) { put('bench', x, t(74.6), [-20, -8, 40, 8]); seat('bench', x - 10, t(74.6) - 6, 0); seat('bench', x + 10, t(74.6) - 6, 0); }
  // 맛집 거리 (x 116~148): 가게 정면이 길 쪽
  SHOPS.forEach((shop, i) => {
    const w = 96, x0 = t(116.5) + i * (w + 4);
    const s = shopSprite(shop, w, FONT);
    W.objects.push({ img: s.c, x: x0 - 1, y: t(46) - 152, sort: t(46) - 1, name: 'shop' });
    solid(x0, t(46) - 44, w, 44 - 2, 'shop');
    station('shop', x0 + w - 23, t(46) + 10, { label: `🛍️ ${shop.name} 주문`, shop: i });
    W.glows.push({ x: x0 + w / 2 - 10, y: t(46) - 22, r: 46, col: '255,210,150', a: 0.5, window: true });
    // 테라스: 둥근 탁자 + 의자 2개
    const tx = x0 + 34, ty = t(49.2);
    put(ttable(), tx, ty, [-9, -6, 18, 6], { tag: 'ttable' });
    put('stool', tx - 20, ty, null); seat('terrace', tx - 20, ty - 2, 3, { shop: i });
    put('stool', tx + 20, ty, null); seat('terrace', tx + 20, ty - 2, 2, { shop: i });
  });
  function ttable() { return (W._tt ||= sprite(20, 20, (P) => { P(0, 0, 20, 8, '#f4f1ea'); P(0, 6, 20, 2, '#c8c2b8'); P(9, 8, 2, 10, '#3a3d42'); P(5, 18, 10, 2, '#3a3d42'); P(7, 2, 4, 3, '#e889a0'); })); }

  /* ---------- 구역 (말하기 문구 · 음악) ---------- */
  const Z = (id, name, x, y, w, h, phr, music) => W.zones.push({ id, name, x, y, w, h, phr, music });
  Z('meeting', '회의실', t(30), t(2), t(17), t(15), 'meeting', 'office');
  Z('print', '프린터실', t(47), t(2), t(12), t(15), 'work', 'office');
  Z('vent', '불만창고', t(59), t(2), t(16), t(15), 'vent', 'vent');
  Z('tangbi', '탕비실', t(75), t(2), t(14), t(15), 'lounge', 'office');
  Z('nap', '수면실', t(89), t(2), t(25), t(22), 'nap', 'nap');
  Z('lounge', '라운지', t(89), t(24), t(25), t(22), 'lounge', 'lounge');
  Z('work', '업무공간', t(30), t(17), t(26), t(29), 'work', 'office');
  Z('lobby', '로비', t(56), t(17), t(33), t(29), 'lobby', 'office');
  Z('food', '맛집 거리', t(115), t(44), t(35), t(8), 'food', 'food');
  Z('gate', '광화문', 0, t(30), t(30), t(22), 'street', 'street');
  Z('park', '공원', 0, t(72), MW, t(6), 'street', 'street');
  Z('street', '광화문 거리', 0, 0, MW, MH, 'street', 'street');

  /* ---------- 순간이동 ---------- */
  W.spots = [
    ['🚪 로비', t(72), t(42)], ['💻 업무공간', t(38), t(28.6)], ['💼 회의실', t(38.5), t(15)], ['🖨️ 프린터실', t(53), t(9.6)],
    ['🔥 불만창고', t(67), t(11.2)], ['☕ 탕비실', t(82), t(14.6)], ['😴 수면실', t(91.4), t(12)], ['🛋️ 라운지', t(97), t(34)],
    ['🌳 광화문 거리', t(72), t(48.6)], ['🍜 맛집 거리', t(132), t(51)], ['🏯 광화문', t(14), t(48)], ['🌷 공원', t(66), t(76.4)],
  ];
  return W;
}

// 걸을 수 있는지 (발 상자 vs 막힌 곳)
export const FOOT = { w: 10, h: 6 };
export function makeCollider(solids) {
  const CELL = 64, grid = new Map();
  const key = (cx, cy) => cx + ',' + cy;
  for (const r of solids) {
    for (let cx = Math.floor(r.x / CELL); cx <= Math.floor((r.x + r.w) / CELL); cx++) for (let cy = Math.floor(r.y / CELL); cy <= Math.floor((r.y + r.h) / CELL); cy++) {
      const k = key(cx, cy); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(r);
    }
  }
  const near = (x, y) => grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL))) || [];
  const hit = (x, y, fw = FOOT.w, fh = FOOT.h) => {
    const x0 = x - fw / 2, y0 = y - fh, x1 = x + fw / 2, y1 = y;
    for (const cx of [x0, x1]) for (const cy of [y0, y1]) for (const r of near(cx, cy)) if (x0 < r.x + r.w && x1 > r.x && y0 < r.y + r.h && y1 > r.y) return r;
    return null;
  };
  return { hit };
}
