/* =========================================================================
   보장원 도트 — 지도
   3D 버전과 같은 배치 · 같은 색 (1 m = 16 px)
   x: 왼쪽(-) ~ 오른쪽(+), z: 건물 안쪽(-30) ~ 정문(0) ~ 길 건너 맛집(+32)
   ========================================================================= */
import { T, mk, R, shade, sprite, SPR, hash, SHOPS, posterPixel, neighborSprite, plaqueSprite, parasolSprite, shopCounterSprite, shopDecor } from './sprites.js';

const M = 16;
export const X = (x) => Math.round((x + 40.5) * M);
export const Y = (z) => Math.round((z + 33) * M);
export const MW = X(40.5), MH = Y(43);
export const FACE = 32; // 벽 높이 (화면에서)

export const OFFICE = { x0: X(-20), x1: X(20), y0: Y(-30), y1: Y(0) };
export const DOOR = { x0: X(-1.6), x1: X(1.6), y: Y(0) };
export const LANES = [
  { y: Y(6.7), dir: -1 }, { y: Y(9.8), dir: -1 },
  { y: Y(20.2), dir: 1 }, { y: Y(23.3), dir: 1 },
];
export const CROSSWALKS = [{ x0: X(-4.5), x1: X(4.5) }];
export const ROAD = [{ y0: Y(5), y1: Y(11.5) }, { y0: Y(18.5), y1: Y(25) }];

export function buildWorld(FONT) {
  const W = {
    objects: [], solids: [], walls: [], seats: [], stations: [], zones: [], spots: [], glows: [], dims: [],
    posters: [], clocks: [], furniture: [], catRoutes: [], npcs: [],
  };
  const solid = (x, y, w, h, tag = 'wall') => { const r = { x, y, w, h, tag }; W.solids.push(r); if (tag !== 'wall') W.furniture.push(r); return r; };
  // 사물 놓기: (x = 가운데, y = 바닥선) · fp = 바닥 차지 영역 [왼쪽, 위, 폭, 높이] (기준점 기준)
  const put = (name, x, y, fp, o = {}) => {
    const s = typeof name === 'string' ? SPR[name] : name;
    const obj = { img: s.c, x: Math.round(x - s.ax), y: Math.round(y - s.ay), sort: y + (o.sortAdd || 0), name: o.label || (typeof name === 'string' ? name : 'obj'), ...o };
    W.objects.push(obj);
    if (fp) obj.fp = solid(x + fp[0], y + fp[1], fp[2], fp[3], o.tag || obj.name);
    return obj;
  };
  const seat = (kind, x, y, dir, o = {}) => { const s = { id: kind + W.seats.length, kind, x, y, dir, ...o }; W.seats.push(s); return s; };
  const station = (kind, x, y, o = {}) => { const s = { id: kind + W.stations.length, kind, x, y, ...o }; W.stations.push(s); return s; };
  const mount = (img, x, y, wallY) => W.objects.push({ img, x, y, sort: wallY + 1, mount: true, name: 'mount' });

  /* ---------- 벽 ---------- */
  const STY = {
    brick: { cap: '#8a5a4a', face: (P, w) => { P(0, 0, w, FACE, '#c27a62'); for (let y = 0; y < FACE; y += 6) for (let x = (y / 6) % 2 ? -6 : 0; x < w; x += 12) P(x + 1, y + 1, 10, 4, '#d08a70'); P(0, FACE - 3, w, 3, '#7a4a3a'); } },
    side: { cap: '#8a8f96', face: (P, w) => { P(0, 0, w, FACE, '#d8cfc4'); P(0, FACE - 4, w, 4, '#9a8a78'); } },
    glass: { cap: '#2b2d33', face: (P, w) => { P(0, 0, w, FACE, 'rgba(169,203,216,0.32)'); for (let x = 0; x < w; x += 24) P(x, 0, 2, FACE, '#2b2d33'); P(0, 0, w, 2, '#2b2d33'); P(0, FACE - 3, w, 3, '#2b2d33'); P(0, 11, w, 1, 'rgba(255,255,255,0.4)'); } },
    frost: { cap: '#9aa3aa', face: (P, w) => { P(0, 0, w, FACE, 'rgba(244,246,246,0.82)'); for (let x = 12; x < w; x += 24) P(x, 3, 1, FACE - 8, '#dfe2e2'); P(0, 0, w, 2, '#9aa3aa'); P(0, FACE - 3, w, 3, '#9aa3aa'); } },
    pink: { cap: '#8a5a4a', face: (P, w) => { P(0, 0, w, FACE, '#f7dcd2'); for (let x = 0; x < w; x += 8) P(x, 0, 3, FACE, 'rgba(255,255,255,0.35)'); for (let x = 4; x < w; x += 16) { P(x, 8, 3, 2, '#f08c94'); P(x - 1, 9, 5, 2, '#f08c94'); P(x, 11, 3, 1, '#f08c94'); P(x + 8, 20, 2, 2, '#f6c453'); } P(0, FACE - 4, w, 4, '#7b4a2c'); } },
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
  function capwall(x0, x1, y) { // 앞쪽(카메라 쪽) 벽은 윗면만 그려 안이 보이게
    const w = x1 - x0, [c, g] = mk(w, 8);
    R(g, 0, 0, w, 8, '#6a5a52'); R(g, 0, 0, w, 1, '#8a7a72'); R(g, 0, 7, w, 1, '#4a3e38');
    W.objects.push({ img: c, x: x0, y: y - 8, sort: y, wall: true, name: 'wall' });
    W.walls.push(solid(x0, y - 8, w, 8));
  }
  function vwall(x, y0, y1, style) {
    const st = STY[style];
    for (let a = y0; a < y1; a += T) {
      const h = Math.min(T, y1 - a), last = a + h >= y1;
      const [c, g] = mk(8, h + (last ? FACE : 0));
      R(g, 0, 0, 8, h, st.cap); R(g, 0, 0, 1, h, shade(st.cap, 0.25)); R(g, 7, 0, 1, h, shade(st.cap, -0.25));
      if (last) { g.save(); g.translate(0, h); st.face((xx, yy, ww, hh, col) => R(g, xx, yy, ww, hh, col), 8); g.restore(); }
      W.objects.push({ img: c, x: x - 4, y: a - FACE, sort: a + h, wall: true, name: 'wall' });
    }
    W.walls.push(solid(x - 4, y0, 8, y1 - y0));
  }
  // 바깥 경계 · 걸을 수 없는 곳 (이웃 빌딩 · 건물 뒤 · 차도 · 맛집 건물)
  solid(-T, -T, MW + 2 * T, T); solid(-T, MH, MW + 2 * T, T); solid(-T, 0, T, MH); solid(MW, 0, T, MH);
  solid(0, 0, X(-20) - 4, Y(0)); solid(X(20) + 4, 0, MW - X(20) - 4, Y(0)); solid(X(-20), 0, X(20) - X(-20), Y(-30) - 8);
  for (const r of ROAD) { solid(0, r.y0, X(-4.5), r.y1 - r.y0); solid(X(4.5), r.y0, MW - X(4.5), r.y1 - r.y0); }

  // 건물 벽 (3D와 같은 자리)
  hwall(X(-20), X(20), Y(-30), 'brick');
  vwall(X(-20), Y(-30), Y(0), 'side'); vwall(X(20), Y(-30), Y(0), 'side');
  capwall(X(-20) + 4, X(-13.2), Y(0)); // 불만창고 앞벽은 윗면만 (안이 잘 보이게)
  hwall(X(-13.2), DOOR.x0, Y(0), 'glass'); hwall(DOOR.x1, X(20) - 4, Y(0), 'glass');
  // 회의실 (안쪽 왼쪽 구석): 유리벽, 문은 오른쪽 끝
  hwall(X(-20) + 4, X(-13.3), Y(-23.6), 'glass');
  vwall(X(-11.5), Y(-30), Y(-23.6), 'glass');
  // 수면실 (안쪽 오른쪽): 반투명 벽, 문은 왼쪽 위 모서리
  hwall(X(4.6), X(20) - 4, Y(-16), 'frost');
  vwall(X(2.5), Y(-30), Y(-16), 'frost');
  // 불만창고 (로비 왼쪽 구석): 하트·별 벽지, 입구는 로비 쪽 커튼
  hwall(X(-20) + 4, X(-13.2) + 4, Y(-5.8), 'pink');
  vwall(X(-13.2), Y(-3.9), Y(0), 'pink');

  /* ---------- 바닥 ---------- */
  const [floor, fg] = mk(MW, MH);
  const F = (x, y, w, h, c) => R(fg, x, y, w, h, c);
  const pattern = (x0, y0, w, h, step, fn) => { for (let y = y0; y < y0 + h; y += step) for (let x = x0; x < x0 + w; x += step) fn(x, y, ((x - x0) / step + (y - y0) / step) | 0); };
  F(0, 0, MW, MH, '#4e7a3e'); // 건물 뒤 · 골목 화단
  pattern(0, 0, MW, Y(0), 8, (x, y) => { const r = hash(x, y); if (r < 0.14) F(x + 2, y + 3, 2, 2, '#406a32'); else if (r > 0.94) F(x + 4, y + 1, 1, 2, '#6a9a4a'); });
  // 인도 (pavement: 회갈색 보도블록)
  const pave = (x, y, w, h) => { F(x, y, w, h, '#b9b0a4'); pattern(x, y, w, h, 16, (xx, yy, k) => { F(xx, yy, 16, 8, (k % 3) ? '#c2b9ad' : '#b4aa9e'); F(xx, yy + 8, 16, 8, (k % 2) ? '#bdb4a8' : '#c6bdb1'); F(xx, yy, 16, 1, '#a69c90'); F(xx + ((yy / 8) % 2 ? 8 : 0), yy, 1, 16, '#a69c90'); }); };
  pave(0, Y(0), MW, Y(5) - Y(0));
  pave(0, Y(25), MW, Y(32.25) - Y(25));
  F(0, Y(5) - 3, MW, 3, '#b7afa4'); F(0, Y(25), MW, 3, '#b7afa4'); // 연석
  // 중앙 광장 (밝은 큰 타일)
  F(0, Y(11.5), MW, Y(18.5) - Y(11.5), '#f2e6d6');
  pattern(0, Y(11.5), MW, Y(18.5) - Y(11.5), 32, (x, y, k) => { F(x, y, 32, 32, k % 2 ? '#efe2d0' : '#f5ebdd'); F(x, y, 32, 1, '#ddcfba'); F(x, y, 1, 32, '#ddcfba'); });
  F(0, Y(11.5), MW, 3, '#b7afa4'); F(0, Y(18.5) - 3, MW, 3, '#b7afa4');
  // 차도
  for (const r of ROAD) {
    F(0, r.y0, MW, r.y1 - r.y0, '#45444c');
    pattern(0, r.y0, MW, r.y1 - r.y0, 4, (x, y) => { if (hash(x, y) < 0.08) F(x, y, 1, 1, '#53525a'); });
  }
  for (let x = 0; x < MW; x += 7 * M) { F(x, Y(8.25) - 1, 3 * M, 2, '#e9e5dd'); F(x, Y(21.75) - 1, 3 * M, 2, '#e9e5dd'); } // 차선
  // 횡단보도: 흰 막대가 차가 다니는 방향(가로)으로 길게, 건너는 방향(세로)으로 줄지어
  for (const cw of CROSSWALKS) for (const r of ROAD) for (let y = r.y0 + 4; y < r.y1 - 4; y += 12) F(cw.x0 + 4, y, cw.x1 - cw.x0 - 8, 6, '#f0ece4');
  // 맛집 건물 사이 골목
  F(0, Y(32.25), MW, MH - Y(32.25), '#3a3438');
  // 건물 안 바닥 (3D와 같은 재질 · 색)
  const lobbyTile = (x, y, w, h) => { F(x, y, w, h, '#f3ece2'); pattern(x, y, w, h, 38, (xx, yy, k) => { F(xx, yy, 38, 38, k % 2 ? '#efe6da' : '#f5efe6'); F(xx, yy, 38, 1, '#e0d6c6'); F(xx, yy, 1, 38, '#e0d6c6'); }); };
  const concrete = (x, y, w, h) => { F(x, y, w, h, '#e9ebee'); pattern(x, y, w, h, 4, (xx, yy) => { const r = hash(xx + 3, yy); if (r < 0.06) F(xx, yy, 2, 2, '#dfe2e6'); else if (r > 0.97) F(xx, yy, 2, 1, '#f4f5f7'); }); pattern(x, y, w, h, 64, (xx, yy) => { F(xx, yy, 64, 1, '#dcdfe3'); F(xx, yy, 1, 64, '#dcdfe3'); }); };
  const herring = (x, y, w, h, c1, c2, c3) => { F(x, y, w, h, c1); pattern(x, y, w, h, 8, (xx, yy, k) => { if (((xx / 8) + (yy / 8)) % 2) { F(xx, yy, 8, 4, c2); F(xx, yy + 4, 8, 1, c3); } else { F(xx, yy, 4, 8, c2); F(xx + 4, yy, 1, 8, c3); } }); };
  F(X(-20), Y(-31), X(20) - X(-20), Y(0) - Y(-31), '#e9ebee');
  concrete(X(-20), Y(-30), X(2.5) - X(-20), Y(-6) - Y(-30));
  lobbyTile(X(-20), Y(-6), X(2.5) - X(-20), Y(0) - Y(-6));
  herring(X(2.5), Y(-16), X(20) - X(2.5), Y(0) - Y(-16), '#e2b98a', '#d9ad7c', '#c89a68'); // 휴게실 원목
  herring(X(2.5), Y(-30), X(20) - X(2.5), Y(-16) - Y(-30), '#a8907e', '#9e8674', '#8a7462'); // 수면실 (어두운 원목)
  // 러그 · 매트
  const rug = (x, y, w, h, c1, c2) => { F(x, y, w, h, c1); F(x + 3, y + 3, w - 6, h - 6, c2); F(x + 6, y + 6, w - 12, h - 12, c1); };
  rug(X(-19.2), Y(-28.6), X(-12.2) - X(-19.2), Y(-24.6) - Y(-28.6), '#5a6a7a', '#6e7e8e'); // 회의실
  rug(X(-18.8), Y(-3.6), X(-14) - X(-18.8), Y(-0.9) - Y(-3.6), '#e889a0', '#f6c8d4'); // 불만창고
  rug(X(-2.2), Y(-1.3), X(2.2) - X(-2.2), Y(0) - Y(-1.3) - 2, '#5a4a40', '#6a5a50'); // 현관 매트
  // 수면실 라벤더 원형 러그
  { const cx = X(14.2), cy = Y(-22.2), r = 2.6 * M; for (let y = -r; y <= r; y += 1) { const w = Math.round(Math.sqrt(r * r - y * y)); F(cx - w, cy + y, w * 2, 1, Math.abs(y) > r - 3 || false ? '#a894c8' : '#b9a6d9'); } }
  W.floor = floor;

  /* ---------- 로비 ---------- */
  put('bigplant', X(-2.4), Y(-1), [-8, -6, 16, 6]);
  put('bigplant', X(2.4), Y(-1), [-8, -6, 16, 6]);

  /* ---------- 업무공간: 책상 섬 5개 (3D와 같은 자리) ---------- */
  let chairN = 0;
  function pod(cx, cy) { // 4인 책상 섬 (60 × 64 px)
    const top = cy - 32, L = cx - 15, Rr = cx + 15;
    put('chair' + (chairN++ % 6), L, top + 12, null); seat('desk', L, top + 10, 0, { chair: true });
    put('chair' + (chairN++ % 6), Rr, top + 12, null); seat('desk', Rr, top + 10, 0, { chair: true });
    put('deskB', L, top + 34, null); put('deskB', Rr, top + 34, null);
    put('desk', L, top + 54, null); put('desk', Rr, top + 54, null);
    solid(cx - 30, top + 15, 60, 37, 'desk');
    put('chairB' + (chairN++ % 6), L, top + 64, null, { sortAdd: 3 }); seat('desk', L, top + 61, 1, { chair: true });
    put('chairB' + (chairN++ % 6), Rr, top + 64, null, { sortAdd: 3 }); seat('desk', Rr, top + 61, 1, { chair: true });
  }
  for (const [px, pz] of [[-14.5, -10.6], [-14.5, -17.4], [-6.5, -10.6], [-6.5, -17.4], [-6.5, -24.2]]) pod(X(px), Y(pz));
  // 포스터 벽 (뒷벽, 반듯하게) + 벽시계
  [['cheer', -8.09], ['lunch', -6.5], ['sports', -4.86], ['notice', -3.3]].forEach(([k, x]) => {
    const s = posterPixel(k);
    mount(s.c, X(x), Y(-30) - FACE + 3, Y(-30));
    W.posters.push({ kind: k, x: X(x) + 11, y: Y(-30) });
  });
  station('poster', X(-5.6), Y(-30) + 16, { label: '🔍 포스터 보기', face: 1 });
  W.clocks.push({ x: X(-2.5) + 6, y: Y(-30) - FACE + 10, sort: Y(-30) + 1 });
  // 복합기 3대 · 파쇄기 · 정수기 (수면실 벽 앞)
  [-28.4, -26.8, -25.2].forEach((z, i) => {
    put('printerS', X(1.85), Y(z) + 9, [-10, -9, 20, 9], { printer: i, label: 'printer' });
    station('printer', X(0.75), Y(z) + 8, { label: `🖨️ 프린터 ${i + 1}로 출력하기`, printer: i, face: 3 });
  });
  put('shredS', X(1.9), Y(-23.4) + 9, [-7, -9, 14, 9]);
  station('shredder', X(0.75), Y(-23.4) + 8, { label: '✂️ 문서 파쇄하기', face: 3 });
  put('water', X(1.6), Y(-20.5) + 8, [-7, -8, 14, 8]);
  station('water', X(1.6), Y(-20.5) + 20, { label: '💧 물 받기', face: 1 });
  // 업무/휴게 구분 책장 (화분 3개)
  put('vshelf', X(2.5), Y(-6.5), [-6, -106, 12, 106]);

  /* ---------- 회의실 ---------- */
  put('tv', X(-15.7), Y(-30) + 2, null, { sortAdd: 2, mount: true });
  const mtable = sprite(80, 30, (P) => { P(0, 0, 80, 22, '#f2efe8'); P(0, 20, 80, 2, '#d8d2c6'); P(4, 22, 3, 8, '#6e767c'); P(73, 22, 3, 8, '#6e767c'); for (const x of [8, 30, 52]) P(x, 5, 8, 6, '#ffffff'); P(36, 8, 9, 6, '#3a3d42'); });
  const MT = Y(-26.75) + 15;
  put(mtable, X(-15.7), MT, [-40, -26, 80, 20], { tag: 'meetTable' });
  for (const dx of [-24, 0, 24]) { put('chair1', X(-15.7) + dx, MT - 30, null); seat('meeting', X(-15.7) + dx, MT - 32, 0, { chair: true }); }
  for (const dx of [-24, 0, 24]) { put('chairB1', X(-15.7) + dx, MT + 12, null, { sortAdd: 3 }); seat('meeting', X(-15.7) + dx, MT + 9, 1, { chair: true }); }
  mount(plaqueSprite('회의실', FONT, '#1f2738', '#e6eef6').c, X(-18.6), Y(-23.6) - FACE + 6, Y(-23.6));

  /* ---------- 탕비 코너 (왼쪽 창가): 냉장고 · 싱크대 · 커피 머신 · 과일 · 간식이 한 줄로 ---------- */
  {
    const top = Y(-14.3);
    put('pantry', X(-19.25), top + 92, [-8, -92, 16, 92]);
    const sx = X(-17.9);
    station('sink', sx, top + 34, { label: '🚰 물 마시기', face: 2 });
    station('coffee', sx, top + 52, { label: '☕ 커피 뽑기', face: 2 });
    station('snack', sx, top + 67, { label: '🍎 사과 먹기', face: 2, item: 'apple' });
    station('snack', sx, top + 84, { label: '🍪 간식 먹기', face: 2, item: 'snack' });
    put('bins', X(-17.6), Y(-14.8), [-13, -8, 26, 8]);
    W.objects.push({ img: plaqueSprite('탕비실', FONT, '#4a2c1a', '#ffe2bd').c, x: X(-19.7), y: top - 14, sort: top + 1, mount: true, name: 'mount' });
    W.glows.push({ x: X(-18.6), y: top + 40, r: 30, col: '255,220,170', a: 0.3, always: true });
  }

  /* ---------- 불만창고 (3D와 같은 구성) ---------- */
  // 왼쪽 벽 벽난로 · 큰 곰인형 · 대나무숲 구멍(임금님 귀는 당나귀 귀) · 스트레스 적는 책상 · 방석 · 꼬마전구 · 별빛 천장 · 구슬 커튼
  put('fireSide', X(-19.15), Y(-1.7), [-8, -44, 16, 44]);
  W.fire = { x: X(-18.6), y: Y(-3.05), box: { x: X(-19.15) - 8 + 7, y: Y(-1.7) - 44 + 11, w: 9, h: 23 } };
  station('fire', X(-17.7), Y(-2.7), { label: '🔥 종이 던지기', face: 2 });
  put('teddy', X(-17.7), Y(-0.45), [-13, -10, 26, 10]);
  station('teddy', X(-16.7), Y(-0.55), { label: '🧸 꼭 안아주기', face: 2 });
  put('bearS', X(-19.2), Y(-4.95), [-6, -5, 12, 5]);
  put('bamboo', X(-16.2), Y(-5.15), [-30, -6, 60, 6], { mount: true });
  const king = sprite(66, 26, (P, g) => { P(0, 0, 66, 26, '#7b4a2c'); P(1, 1, 64, 24, '#9a6a44'); g.fillStyle = '#fff1d6'; g.font = `11px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('임금님 귀는', 34, 8); g.fillText('당나귀 귀', 34, 19); });
  W.objects.push({ img: king.c, x: X(-16.2) - 33, y: Y(-5.15) - 44, sort: Y(-5.15) + 1, mount: true, name: 'mount' });
  put('hole', X(-16.2), Y(-4.35), null, { low: true, sortAdd: -40 });
  station('rant', X(-16.2), Y(-3.55), { label: '🎋 구멍에 마구 외치기', face: 1 });
  put('cushionY', X(-17.0), Y(-1.65), null, { low: true }); seat('cushion', X(-17.0), Y(-1.65) - 2, 2);
  put('cushionM', X(-15.4), Y(-2.2), null, { low: true }); seat('cushion', X(-15.4), Y(-2.2) - 2, 2);
  put('writeDesk', X(-14.3), Y(-0.45), [-10, -7, 20, 7]);
  put('pinkChair', X(-14.3), Y(-1.35), null); seat('write', X(-14.3), Y(-1.35) - 2, 0, { chair: true });
  put('paperBin', X(-13.65), Y(-2.1), null, { low: true });
  for (let k = 0; k < 2; k++) W.objects.push({ img: SPR.beadCurtain.c, x: X(-13.2) - 3 + k * 2, y: Y(-3.95) - 27, sort: Y(-3.95), mount: true, name: 'mount' });
  const neon = sprite(50, 24, (P, g) => { P(24, 12, 2, 12, '#6e767c'); P(0, 0, 50, 13, '#2a1f2d'); P(1, 1, 48, 11, '#3a2430'); g.fillStyle = '#ff8ab0'; g.font = `11px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('불만창고', 26, 8); });
  put(neon, X(-11.6), Y(-3.8), [-2, -3, 4, 3], { label: 'neon' });
  W.dims.push({ x: X(-20), y: Y(-5.8) - 8, w: X(-13.2) - X(-20), h: Y(0) - Y(-5.8) + 8, a: 0.16, col: '#3a1640' });
  W.glows.push({ x: X(-18.3), y: Y(-3.1), r: 52, col: '255,140,60', a: 0.5, always: true, flicker: true });
  // 꼬마전구 (방 가장자리를 따라)
  const bulbCols = ['255,213,154', '255,159,196', '255,240,200', '184,224,255'];
  let bi = 0;
  for (let x = X(-19.5); x < X(-13.4); x += 9) W.glows.push({ x, y: Y(-5.8) - 42 + (bi % 2) * 3, r: 5, col: bulbCols[bi++ % 4], a: 0.8, always: true });
  for (let y = Y(-5.4); y < Y(-0.4); y += 10) { W.glows.push({ x: X(-19.6), y: y - 26, r: 6, col: bulbCols[bi++ % 4], a: 0.9, always: true }); W.glows.push({ x: X(-13.4), y: y - 26, r: 6, col: bulbCols[bi++ % 4], a: 0.9, always: true }); }
  for (let i = 0; i < 12; i++) W.glows.push({ x: X(-19.4) + hash(i, 7) * (X(-13.6) - X(-19.4)), y: Y(-5.6) + hash(i, 8) * (Y(-0.6) - Y(-5.6)) - 24, r: 4, col: '255,240,200', a: 0.9, always: true, twinkle: i + 20 });

  /* ---------- 휴게실 (오른쪽 앞) ---------- */
  const LX = X(11), LY = Y(-8.5);
  put('sofaTop', LX, LY - 28, [-38, -14, 76, 12]);
  put('sofaLeft', LX - 47, LY + 16, [-9, -44, 18, 42]);
  put('sofaRight', LX + 47, LY + 16, [-9, -44, 18, 42]);
  for (const dx of [-27, -9, 9, 27]) seat('lounge', LX + dx, LY - 34, 0);
  for (const dy of [-16, 4]) { seat('lounge', LX - 45, LY + dy, 3); seat('lounge', LX + 45, LY + dy, 2); }
  put('rtable', LX, LY + 8, [-15, -12, 30, 10]);
  put('beanbag', X(15.9), Y(-8.1), [-10, -8, 20, 8], { sortAdd: 3 }); seat('beanbag', X(15.9), Y(-8.1) - 5, 1);
  put('ottoman', X(15.4), Y(-6.0), [-7, -6, 14, 6]);
  // 주방 카운터 (오른쪽 벽)
  put('vcounter', X(19.2), Y(-4.2), [-6, -92, 12, 92]);
  put('coffeeTop', X(19.2), Y(-5) + 6, null, { sortAdd: 1, mount: true });
  put('fruit', X(19.2), Y(-6.8) + 4, null, { sortAdd: 1, mount: true });
  station('coffee', X(18.3) - 4, Y(-5) + 4, { label: '☕ 커피 뽑기', face: 3 });
  station('snack', X(18.3) - 4, Y(-6.8) + 6, { label: '🍎 사과 먹기', face: 3 });
  // 탁구대
  put('pingpong', X(9.5), Y(-2.8) + 17, [-30, -30, 60, 28]);
  station('pp', X(9.5) - 42, Y(-2.8) + 4, { label: '🏓 탁구 치기', side: 0 });
  station('pp', X(9.5) + 42, Y(-2.8) + 4, { label: '🏓 탁구 치기', side: 1 });
  W.pingpong = { x: X(9.5), y: Y(-2.8) - 2 };
  // 줄조명 · 링 펜던트
  for (let i = 0; i < 9; i++) W.glows.push({ x: X(4) + i * 28, y: Y(-14.5) + Math.sin(i) * 4, r: 9, col: '255,210,140', a: 0.7, always: true });
  W.glows.push({ x: LX, y: LY - 4, r: 46, col: '255,200,140', a: 0.3, always: true });
  mount(plaqueSprite('휴게실', FONT, '#6a3a20', '#ffe2bd').c, X(12), Y(-16) - FACE + 6, Y(-16));

  /* ---------- 수면실 ---------- */
  [6.2, 9.6, 13.0, 16.4].forEach((x, i) => {
    const bx = X(x), base = Y(-28.5) + 18;
    put('bedS' + i, bx, base, [-11, -36, 22, 36]);
    station('bed', bx, base + 12, { label: '😴 침대에 눕기', bed: { x: bx, top: base - 37, col: ['#9bbf6a', '#f2b84b', '#e8907a', '#b9a6d9'][i] }, face: 1 });
    if (i < 3) put('curtainS', X(x + 1.7), base - 2, [-2, -6, 4, 6]);
    W.glows.push({ x: bx, y: base - 8, r: 26, col: '255,190,120', a: 0.4, always: true });
  });
  put('reclinerA', X(12.8), Y(-21.8) + 10, [-8, -12, 16, 12]); seat('recline', X(12.8), Y(-21.8) + 2, 0);
  put('reclinerB', X(16.4), Y(-21.6) + 10, [-8, -12, 16, 12]); seat('recline', X(16.4), Y(-21.6) + 2, 0);
  put('beanbag2', X(4.9), Y(-24.6), [-10, -8, 20, 8], { sortAdd: 3 }); seat('beanbag', X(4.9), Y(-24.6) - 5, 1);
  put('moonlamp', X(19.1), Y(-16.8), [-6, -6, 12, 6]);
  mount(plaqueSprite('수면실', FONT, '#3a3a5a', '#e6e3ee').c, X(6.4), Y(-16) - FACE + 6, Y(-16));
  W.dims.push({ x: X(2.5), y: Y(-30) - 40, w: X(20) - X(2.5), h: Y(-16) - Y(-30) + 40, a: 0.3, col: '#1a1840' });
  for (let i = 0; i < 14; i++) W.glows.push({ x: X(3.5) + hash(i, 1) * (X(19.5) - X(3.5)), y: Y(-29.5) + hash(i, 2) * (Y(-16.5) - Y(-29.5)), r: 5, col: '255,250,220', a: 0.9, always: true, twinkle: i });

  /* ---------- 바깥: 이웃 빌딩 · 거리 · 맛집 ---------- */
  const nb1 = neighborSprite(X(-24) - 2, Y(0) - 20, '#46505c', '#b9ab98');
  W.objects.push({ img: nb1.c, x: -1, y: 20 - 1, sort: Y(0) - 1, name: 'neighbor' });
  const nb2 = neighborSprite(MW - X(24), Y(0) - 20, '#3d3836', '#8e5a46');
  W.objects.push({ img: nb2.c, x: X(24) - 1, y: 20 - 1, sort: Y(0) - 1, name: 'neighbor' });
  // 골목 화단 (건물과 이웃 빌딩 사이)
  for (const x0 of [X(-24), X(20) + 4]) {
    const w = X(-20) - 4 - X(-24);
    const s = sprite(w, 16, (P) => { P(0, 4, w, 12, '#8a8f96'); P(1, 0, w - 2, 7, '#5aa04a'); for (let x = 2; x < w - 2; x += 5) P(x, 1, 2, 2, '#7cc05a'); });
    W.objects.push({ img: s.c, x: x0 - 1, y: Y(0) - 17, sort: Y(0) - 1, name: 'planter' });
  }
  // 은행나무 · 가로등 (3D와 같은 간격)
  const treeAt = (x, z) => put('ginkgo', X(x), Y(z), [-4, -5, 8, 5], { tree: true });
  const lampAt = (x, z) => { put('lamp', X(x), Y(z), [-3, -4, 6, 4]); W.glows.push({ x: X(x), y: Y(z) - 50, r: 56, col: '255,210,140', a: 0.55, lamp: true }); };
  for (const x of [-37, -28, -19, -10, 8, 17, 26, 35]) treeAt(x, 4.3);
  for (const x of [-32.5, -14.5, 12.5, 30.5]) lampAt(x, 4.6);
  for (const x of [-36, -26, -16, 14, 24, 34]) treeAt(x, 25.9);
  for (const x of [-31, -21, 19, 29]) lampAt(x, 25.8);
  for (const x of [-28, -16, 8, 20, 32]) treeAt(x, 12.8);
  for (const x of [-22, -10, 14, 26, 38]) treeAt(x, 17.8);
  for (const x of [-28, -16, 8, 20, 32]) put('flowerBed', X(x), Y(15.3), [-15, -8, 30, 8], { label: 'flowerBed' });
  // 금빛 동상 (중앙 광장)
  const statue = sprite(36, 56, (P) => {
    P(2, 36, 32, 20, '#a59b8d'); P(0, 34, 36, 4, '#8f8578'); P(4, 52, 28, 4, '#8f8578');
    const gd = '#d9a84a', gd2 = '#b8862e';
    P(8, 22, 20, 14, gd); P(10, 10, 16, 14, gd); P(13, 2, 10, 10, gd); P(14, 0, 8, 3, gd2); P(10, 26, 16, 2, gd2); P(6, 18, 6, 10, gd2); P(24, 16, 6, 12, gd2);
  });
  put(statue, X(-36), Y(15.6), [-18, -14, 36, 14], { label: 'statue' });
  put('roadSign', X(-6.2), Y(4.6), [-2, -3, 4, 3], { label: 'roadSign' });
  put('bench', X(-23.5), Y(2.2), [-20, -8, 40, 8]); seat('bench', X(-23.5) - 10, Y(2.2) - 6, 0); seat('bench', X(-23.5) + 10, Y(2.2) - 6, 0);
  put('bench', X(-4), Y(16.6), [-20, -8, 40, 8], { label: 'bench2' }); // 중앙 광장 쉼터 (횡단보도 옆)
  W.seats.push({ id: 'bench_m0', kind: 'bench', x: X(-4) - 10, y: Y(16.6) - 6, dir: 0 }, { id: 'bench_m1', kind: 'bench', x: X(-4) + 10, y: Y(16.6) - 6, dir: 0 });
  // 맞은편 맛집 거리: 가게 안(계산대 · 사장님 · 식탁)과 가게 앞 파라솔 테라스
  const FLOORS = { tteok: ['#f6e3a0', '#efd88a'], latte: ['#8a5a3e', '#7e5036'], cake: ['#fbe4ea', '#ffffff'], meat: ['#5a4a46', '#504240'], pancake: ['#e8efe6', '#dbe6d8'], pizza: ['#d98a5a', '#cc7e50'] };
  const ZF = 32.25, ZB = 42.8;
  let prevX1 = null;
  SHOPS.forEach((shop, i) => {
    const x0m = Math.max(-40.5, shop.x0), x1m = Math.min(40.5, shop.x0 + shop.w), wm = x1m - x0m;
    const xa = X(x0m), xb = X(x1m), yf = Y(ZF), yb = Y(ZB);
    // 바닥
    const [c1, c2] = FLOORS[shop.item] || ['#e9e2d6', '#ddd4c6'];
    F(xa, yf, xb - xa, yb - yf, c1); pattern(xa, yf, xb - xa, yb - yf, 16, (x, y, k) => { if (k % 2) F(x, y, 16, 16, c2); });
    // 벽: 앞은 유리 진열창 + 문, 옆은 벽, 뒤(카메라 쪽)는 윗면만
    const dL = X(x1m - 2.9), dR = X(x1m - 1.2);
    hwall(xa + 4, dL, yf, 'glass'); hwall(dR, xb - 4, yf, 'glass');
    vwall(xa, yf, yb, 'side'); vwall(xb, yf, yb, 'side');
    capwall(xa, xb, yb);
    if (prevX1 !== null && xa - prevX1 > 8) solid(prevX1 + 4, yf - 8, xa - prevX1 - 8, MH - yf + 8, 'alley');
    prevX1 = xb;
    // 차양 + 간판 (길 쪽으로 나와요)
    const aw = sprite(xb - xa, 20, (P, g) => {
      for (let x = 0, k = 0; x < xb - xa; x += 8, k++) { P(x, 6, 8, 11, shop.awn[k % 2]); P(x + 1, 17, 6, 3, shop.awn[k % 2]); }
      const sw = Math.min(xb - xa - 20, shop.name.length * 11 + 14);
      P((xb - xa - sw) / 2, 0, sw, 13, shop.sign); P((xb - xa - sw) / 2 + 1, 1, sw - 2, 1, shade(shop.sign, 0.3));
      g.fillStyle = '#fffaf0'; g.font = `11px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(shop.name, (xb - xa) / 2 + 1, 7.5);
    });
    W.objects.push({ img: aw.c, x: xa - 1, y: yf - FACE - 8 - 14, sort: yf + 0.5, mount: true, name: 'mount' });
    // 계산대 · 사장님 · 주문
    put(shopCounterSprite(shop), X(x0m + 1.6), Y(ZF + 1.3) + 68, [-8, -68, 16, 68], { label: 'counter' });
    W.npcs.push({ x: X(x0m + 0.75), y: Y(ZF + 3.6), dir: 3, design: (i + 2) % 5, name: '', shop: i, apron: shop.sign });
    station('shop', X(x0m + 2.75), Y(ZF + 3.6), { label: `🛍️ ${shop.name} 주문하기`, shop: i, face: 2 });
    // 가게마다 다른 소품
    const dec = shopDecor(shop.item);
    if (shop.item === 'pizza') put(dec, X(x1m - 1.3), Y(ZB - 0.9), [-15, -10, 30, 10], { label: 'oven' });
    else if (shop.item !== 'meat') put(dec, X(x0m + 1.6), Y(ZF + 7.6), [-dec.c.width / 2 + 1, -8, dec.c.width - 2, 8], { label: 'decor' });
    put('plant', X(x0m + 0.9), Y(ZB - 0.7), [-6, -6, 12, 6]);
    // 식탁 (안)
    for (const fx of [0.46, 0.76]) for (const fz of [ZF + 3.6, ZF + 7.3]) {
      const tx = X(x0m + wm * fx), ty = Y(fz);
      if (shop.item === 'meat') put(shopDecor('meat'), tx, ty, [-10, -8, 20, 8], { label: 'grill' });
      else put(ttable(), tx, ty, [-9, -6, 18, 6], { label: 'ttable' });
      put('stool', tx - 20, ty, null); seat('cafe', tx - 20, ty - 2, 3, { shop: i });
      put('stool', tx + 20, ty, null); seat('cafe', tx + 20, ty - 2, 2, { shop: i });
    }
    W.glows.push({ x: X(x0m + wm * 0.5), y: Y(ZF + 3), r: 46, col: '255,210,150', a: 0.35, always: true });
    W.glows.push({ x: X(x0m + wm * 0.5), y: Y(ZF + 7), r: 46, col: '255,210,150', a: 0.3, always: true });
    // 가게 앞 테라스: 파라솔 식탁 2개 + 입간판
    for (const fx of [0.24, 0.55]) {
      const tx = X(x0m + wm * fx), ty = Y(28.7), gid = 'terrace' + i + fx;
      if (tx - 28 < 4) continue;
      put(ttable(), tx, ty, [-9, -6, 18, 6], { label: 'ttable', group: gid });
      put(parasolSprite(shop.awn), tx, ty + 1, null, { label: 'parasol', group: gid });
      put('stool', tx - 20, ty, null, { group: gid }); seat('terrace', tx - 20, ty - 2, 3, { shop: i });
      put('stool', tx + 20, ty, null, { group: gid }); seat('terrace', tx + 20, ty - 2, 2, { shop: i });
    }
    put('menuBoard', X(x1m - 3.5), Y(31.6), [-5, -3, 10, 3]);
    W.zones.push({ id: 'shop' + i, name: shop.name, x: xa, y: yf, w: xb - xa, h: yb - yf, phr: shop.phr, music: 'food' });
  });
  function ttable() { return (W._tt ||= sprite(20, 20, (P) => { P(0, 0, 20, 8, '#f4f1ea'); P(0, 6, 20, 2, '#c8c2b8'); P(9, 8, 2, 10, '#3a3d42'); P(5, 18, 10, 2, '#3a3d42'); P(7, 2, 4, 3, '#e889a0'); })); }
  // 맛집 거리 줄조명
  for (let x = 12; x < MW; x += 26) W.glows.push({ x, y: Y(31.8) + Math.sin(x) * 2, r: 8, col: '255,200,130', a: 0.8, lamp: true });

  /* ---------- 고양이 길 (미터) ---------- */
  const cr = (pts) => W.catRoutes.push(pts.map(([x, z]) => [X(x), Y(z)]));
  cr([[-30, 2.2], [-12, 2.2], [-12, 3.6], [-30, 3.6]]);
  cr([[8, 13.6], [30, 13.6], [30, 16.6], [8, 16.6]]);
  cr([[-34, 27.2], [-12, 27.2], [-12, 28.0], [-34, 28.0]]);
  cr([[10, 27.2], [34, 27.2], [34, 28.0], [10, 28.0]]);

  /* ---------- 구역 (말하기 문구 · 음악) ---------- */
  const Z = (id, name, x0, z0, x1, z1, phr, music) => W.zones.push({ id, name, x: X(x0), y: Y(z0), w: X(x1) - X(x0), h: Y(z1) - Y(z0), phr, music });
  Z('vent', '불만창고', -20, -5.8, -13.2, 0, 'vent', 'vent');
  Z('meeting', '회의실', -20, -30, -11.5, -23.6, 'meeting', 'work');
  Z('nap', '수면실', 2.5, -30, 20, -16, 'nap', 'nap');
  Z('lounge', '휴게실', 2.5, -16, 20, 0, 'lounge', 'lounge');
  Z('lobby', '로비', -13.2, -6, 2.5, 0, 'lobby', 'lobby');
  Z('work', '업무공간', -20, -30, 2.5, -6, 'work', 'work');
  Z('food', '맛집 거리', -40.5, 25, 40.5, 43, 'food', 'food');
  Z('street', '광화문 거리', -40.5, -33, 40.5, 43, 'street', 'street');

  /* ---------- 순간이동 (3D와 같은 곳) ---------- */
  W.spots = [
    ['🏙️ 광화문 거리', X(0), Y(3.4)], ['🚪 로비', X(0), Y(-4.2)], ['💻 업무공간', X(-2.2), Y(-13.5)], ['🛋️ 휴게실', X(6.4), Y(-5.6)],
    ['🛏️ 수면실', X(5.4), Y(-18.6)], ['🍰 맛집 거리', X(-9), Y(28.6)], ['🔥 불만창고', X(-15.6), Y(-1.9)],
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
