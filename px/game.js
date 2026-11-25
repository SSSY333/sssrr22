/* =========================================================================
   보장원 도트 — 광화문 거리의 유리 빌딩, 2D 도트 멀티플레이 오피스
   ========================================================================= */
import { T, mk, R, DESIGNS, charSheet, charPreview, CW, CH, ITEMS, SHOPS, drawPoster, outline, flipX } from './sprites.js';
import { buildWorld, makeCollider, MW, MH, OFFICE, DOOR, LANES, CROSSWALKS, FACE } from './world.js';
import { connect, RELAY, NET, netPeer, onNetStatus } from './net.js';
import { audio } from './audio.js';

const $ = (s) => document.querySelector(s);
const FONT = 'Galmuri11';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const isTouch = matchMedia('(pointer: coarse)').matches;
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 무시 */ } } };
const cleanText = (t, n) => String(t ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n);

const PHRASES = {
  work: ['회의 5분 전!', '배포 성공 🎉', '커피 수혈 필요…☕', '이거 버그 아니고 기능이에요....!', 'PPT 한 장만 더!', '오늘 칼퇴 가능?', '타닥타닥 ⌨️', '메일 확인했어요!', '아이디어 있어요 💡', '엑셀 왜 이래…', '숫자 맞췄다!', '네? 제가요?'],
  lobby: ['어서오세요! 😊', '좋은 하루 보내세요!', '점심 뭐 먹지?', '오늘 날씨 좋네요!'],
  lounge: ['ㅋㅋㅋㅋㅋ', '이 과자 맛있다!', '주말에 뭐 해요?', '하하하 😂', '피자 한 조각 더!', '생일 축하해요 🎂', '진짜요?!', '우리 팀 최고 👍', '나도 나도!', '아 배불러~'],
  pingpong: ['나이스! 🏓', '한 판 더!', '스매시!', '으앗!', '11 : 9!', '봐주는 거야~'],
  nap: ['Zzz…', '5분만 더…', '💤', '음냐음냐…', 'Zzz…😇…', '깨우지 마세요 🤫'],
  food: ['맛있겠다! 😋', '여기 줄 서 있네!', '빵 냄새 너무 좋다 🥐', '떡볶이 먹고 싶다 🌶️', '커피 한 잔 할까? ☕', '디저트 배는 따로 있지', '오늘 점심은 여기다!', '냄새 미쳤다…'],
  cafe: ['맛있겠다! 😋', '이 집 라떼 맛집이래 ☕', '케이크 하나 더 시킬까? 🍰', '여기 분위기 좋다!', '한 입만~', '사진 먼저 찍고 먹자 📸', '배불러… 행복해', '잘 먹겠습니다!'],
  street: ['광화문 도착!', '은행잎 진짜 예쁘다 🍂', '점심 먹으러 가자', '버스 왔다!', '산책하기 딱 좋네', '퇴근하자!'],
  meeting: ['회의 시작할게요!', '다음 안건이요', '좋은 의견이네요 👍', '그건 다음 회의 때…', '결론 내 볼까요?', '오늘 회의는 여기까지!', '자료 공유할게요 📊', '잠깐, 질문 있어요 🙋'],
  vent: ['후련하다~', '다 타버려라! 🔥', '오늘도 버텼다 💪', '곰돌아 고마워 🧸', '힐링된다…', '내일은 괜찮을 거야', '심호흡… 후—'],
  office: ['안녕하세요! 👋', '반가워요!', '커피 한잔 하실래요?', '오늘도 화이팅! 💪', '같이 놀아요!', '헤헤 😊'],
};
const POKE_FROM = ['콕! 👉', '안녕~ 콕콕!', '나 여기 있어요!', '뭐 해~?', '톡톡!'];
const POKE_TO = ['앗, 깜짝이야! 😳', '누구야~?', '간지러워 ㅋㅋㅋ', '반가워요! 👋', '헉!', '왜 불러~?', '히힛 😆'];
const SEAT_LABEL = { desk: '💻 앉아서 일하기', meeting: '💼 회의 자리에 앉기', sofa: '🛋️ 소파에 앉기', lounge: '🛋️ 원형 소파에 앉기', recline: '💺 리클라이너에 눕듯 앉기', beanbag: '☁️ 빈백에 기대기', bench: '🪑 벤치에 앉기', terrace: '☕ 테라스에 앉기', stool: '🪑 의자에 앉기' };
const SEAT_PHR = { desk: 'work', meeting: 'meeting', sofa: 'lounge', lounge: 'lounge', recline: 'nap', beanbag: 'lounge', bench: 'street', terrace: 'cafe', stool: 'lounge' };

/* ---------- 화면 ---------- */
const canvas = document.createElement('canvas');
$('#app').appendChild(canvas);
const ctx = canvas.getContext('2d', { alpha: false });
if (!ctx) { $('#error').classList.remove('hidden'); throw new Error('no 2d'); }
let DPR = 1, S = 3, VW = 0, VH = 0, fontPx = 11;
function onResize() {
  DPR = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.round(innerWidth * DPR); canvas.height = Math.round(innerHeight * DPR);
  S = Math.max(2, Math.floor(Math.min(canvas.width, canvas.height) / 256));
  VW = canvas.width / S; VH = canvas.height / S;
  fontPx = 11 * Math.max(1, Math.round(DPR));
}
addEventListener('resize', onResize); onResize();

await Promise.race([document.fonts.load(`11px ${FONT}`).catch(() => {}), new Promise((r) => setTimeout(r, 2500))]);
const W = buildWorld(FONT);
const COL = makeCollider(W.solids);
W.objects.sort((a, b) => a.sort - b.sort);

/* ---------- 길찾기 (8px 칸) ---------- */
const PC = 8, GW = Math.ceil(MW / PC), GH = Math.ceil(MH / PC);
const walk = new Uint8Array(GW * GH);
for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) walk[gy * GW + gx] = COL.hit(gx * PC + 4, gy * PC + 6) ? 0 : 1;
const okCell = (gx, gy) => gx >= 0 && gy >= 0 && gx < GW && gy < GH && walk[gy * GW + gx];
function nearestFree(gx, gy) {
  for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && okCell(gx + dx, gy + dy)) return [gx + dx, gy + dy];
  return null;
}
function findPath(x0, y0, x1, y1) {
  const s = nearestFree(Math.floor(x0 / PC), Math.floor((y0 - 6) / PC)), g = nearestFree(Math.floor(x1 / PC), Math.floor((y1 - 6) / PC));
  if (!s || !g) return null;
  const N = GW * GH, si = s[1] * GW + s[0], gi = g[1] * GW + g[0];
  const cost = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1);
  const open = [[0, si]]; cost[si] = 0;
  const H = (i) => { const x = i % GW, y = (i / GW) | 0; const dx = Math.abs(x - g[0]), dy = Math.abs(y - g[1]); return Math.max(dx, dy) + 0.41 * Math.min(dx, dy); };
  let n = 0;
  while (open.length && n++ < 40000) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
    const [, i] = open.splice(bi, 1)[0];
    if (i === gi) break;
    const x = i % GW, y = (i / GW) | 0;
    for (const [dx, dy, c] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]]) {
      const nx = x + dx, ny = y + dy;
      if (!okCell(nx, ny) || (dx && dy && (!okCell(x + dx, y) || !okCell(x, y + dy)))) continue;
      const ni = ny * GW + nx, nc = cost[i] + c;
      if (nc < cost[ni]) { cost[ni] = nc; from[ni] = i; open.push([nc + H(ni), ni]); }
    }
    if (open.length > 6000) open.splice(0, open.length - 6000);
  }
  if (from[gi] < 0 && gi !== si) return null;
  const pts = [];
  for (let i = gi; i >= 0 && i !== si; i = from[i]) pts.push([(i % GW) * PC + 4, ((i / GW) | 0) * PC + 6]);
  pts.reverse();
  // 직선으로 갈 수 있으면 중간 점 생략
  const out = []; let cur = [x0, y0];
  for (let k = 0; k < pts.length; k++) {
    const nxt = pts[k + 1];
    if (nxt && clearLine(cur, nxt)) continue;
    out.push(pts[k]); cur = pts[k];
  }
  if (!out.length || out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1] || [x1, y1]);
  return out;
}
function clearLine(a, b) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(d / 4);
  for (let i = 1; i <= n; i++) if (COL.hit(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)) return false;
  return true;
}

/* ---------- 나 · 다른 사람 ---------- */
const SPEED = 74;
const me = { x: (DOOR.x0 + DOOR.x1) / 2, y: DOOR.y + 54, dir: 1, design: 0, name: '', walkT: 0, moving: false, seat: null, bed: null, hold: null, holdUntil: 0, act: null, actUntil: 0, say: null, sayN: 0, pokeN: 0, fxN: 0, petN: 0, hop: 0, path: null, then: null, vx: 0, vy: 0, playing: false };
const remotes = new Map();
const seatById = new Map(W.seats.map((s) => [s.id, s]));
const stById = new Map(W.stations.map((s) => [s.id, s]));
const zoneAt = (x, y) => W.zones.find((z) => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) || W.zones[W.zones.length - 1];
const everyone = () => [me, ...[...remotes.values()].map((r) => r.A)];

function sayLine(A, text, dur = 4200) {
  A.say = { t: cleanText(text, 40), until: performance.now() + dur };
  if (A === me) { me.sayN++; sendPresence(true); }
  if (nearMe(A) > 0.05) audio.sfx('bubble', A === me ? 0.8 : nearMe(A) * 0.6);
}
const nearMe = (A) => (A === me ? 1 : clamp(1 - Math.hypot(A.x - me.x, A.y - me.y) / 260, 0, 1));
function sfxAt(name, A, ...a) { const v = nearMe(A); if (v > 0.05) audio.sfx(name, v, ...a); }

/* ---------- 고양이 (모두에게 같은 길: 시계 기준) ---------- */
function catSprites(body, patch) {
  const mkCat = (frame, sit) => {
    const [c, g] = mk(18, 14);
    const P = (x, y, w, h, col) => R(g, x + 1, y + 1, w, h, col);
    if (sit) { P(4, 4, 9, 8, body); P(9, 0, 6, 6, body); P(9, -1, 2, 2, body); P(13, -1, 2, 2, body); P(10, 2, 1, 1, '#2a1f2d'); P(13, 2, 1, 1, '#2a1f2d'); P(1, 9, 4, 2, body); if (patch) P(5, 6, 4, 4, patch); }
    else {
      P(2, 4, 11, 5, body); P(11, 1, 5, 5, body); P(11, 0, 2, 2, body); P(14, 0, 2, 2, body); P(14, 3, 1, 1, '#2a1f2d'); P(0, 2 + (frame ? 1 : 0), 3, 2, body);
      const l = frame ? [3, 6, 9, 11] : [4, 5, 10, 12];
      for (const x of l) P(x, 9, 1, 3, body);
      if (patch) P(4, 4, 4, 3, patch);
    }
    return outline(c);
  };
  const r = [mkCat(0), mkCat(1)], s = mkCat(0, true);
  return { right: r, left: r.map(flipX), sitR: s, sitL: flipX(s) };
}
const CATS = [
  { col: '#f2a65a', patch: '#ffffff' }, { col: '#2a2a30', patch: '#f4f1ea' }, { col: '#9aa3aa', patch: null }, { col: '#f4efe6', patch: '#c08a5a' },
].map((c, i) => ({ ...c, route: W.catRoutes[i % W.catRoutes.length] })).map((c, i) => {
  const segs = []; let L = 0;
  for (let k = 0; k < c.route.length; k++) { const a = c.route[k], b = c.route[(k + 1) % c.route.length]; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, d, t0: L }); L += d / 16 + 3; }
  return { ...c, i, segs, period: L, spr: catSprites(c.col, c.patch), x: c.route[0][0], y: c.route[0][1], face: 1, moving: false, petUntil: 0, hearts: 0 };
});
function catTarget(c, now) {
  const tt = ((now / 1000 + c.i * 7.3) % c.period + c.period) % c.period;
  for (const s of c.segs) {
    if (tt < s.t0 + 3) return [s.a[0], s.a[1], false];
    const u = (tt - s.t0 - 3) * 16 / s.d;
    if (u <= 1) return [s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u, true];
  }
  return [c.route[0][0], c.route[0][1], false];
}
function updateCats(dt, now) {
  for (const c of CATS) {
    if (now < c.petUntil) { c.moving = false; continue; }
    const [tx, ty] = catTarget(c, Date.now());
    const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
    if (d > 300) { c.x = tx; c.y = ty; }
    const step = Math.min(d, (d > 20 ? 40 : 16) * dt);
    if (d > 0.3) { c.x += dx / d * step; c.y += dy / d * step; if (Math.abs(dx) > 0.2) c.face = dx > 0 ? 1 : -1; }
    c.moving = d > 0.5;
  }
}
function petCat(c, A) {
  c.petUntil = performance.now() + 3500;
  for (let i = 0; i < 4; i++) particle({ type: 'heart', x: c.x + rand(-6, 6), y: c.y - 12, vy: -18, vx: rand(-6, 6), life: 1.6, delay: i * 0.25 });
  sfxAt('pop', A, 1.4);
}

/* ---------- 자동차 ---------- */
function carSprite(type, color) {
  const bus = type === 'bus', w = bus ? 64 : 32, h = bus ? 22 : 18;
  const [c, g] = mk(w + 2, h + 2);
  const P = (x, y, ww, hh, col) => R(g, x + 1, y + 1, ww, hh, col);
  P(2, 2, w - 4, h - 6, color); P(2, h - 6, w - 4, 2, '#00000033');
  if (bus) { for (let x = 6; x < w - 10; x += 9) P(x, 4, 7, 6, '#9fc3d8'); P(w - 8, 4, 5, 9, '#9fc3d8'); P(2, 11, w - 4, 2, '#ffffff'); }
  else { P(w - 14, 3, 7, h - 9, '#26324a'); P(6, 3, 5, h - 9, '#26324a'); P(12, 4, 9, h - 11, type === 'taxi' ? '#f6d36a' : color); if (type === 'taxi') P(15, 1, 5, 2, '#fff2c0'); }
  for (const x of bus ? [8, w - 14] : [5, w - 11]) { P(x, h - 5, 7, 4, '#16161a'); P(x + 2, h - 4, 3, 2, '#5a5f66'); }
  P(w - 3, 5, 2, 3, '#fff5d6'); P(1, 5, 2, 3, '#ff3b30');
  outline(c);
  return { r: c, l: flipX(c), w, h };
}
const cars = [];
LANES.forEach((ln, li) => {
  for (let i = 0; i < 3; i++) {
    const type = Math.random() < 0.15 ? 'bus' : Math.random() < 0.35 ? 'taxi' : 'car';
    const spr = carSprite(type, type === 'taxi' ? '#f28c28' : type === 'bus' ? '#2f6fd6' : pick(['#f4f4f2', '#22252b', '#a9adb3', '#8a1f2a', '#2e4e6e', '#3a7a5a']));
    cars.push({ lane: ln, x: (i / 3) * MW + rand(0, 200) + li * 90, spr, speed: type === 'bus' ? rand(46, 56) : rand(60, 86), v: 60 });
  }
});
function updateCars(dt) {
  const ppl = everyone();
  for (const c of cars) {
    const dir = c.lane.dir, front = c.x + dir * c.spr.w / 2;
    let stop = false;
    for (const A of ppl) if (Math.abs(A.y - (c.lane.y + 4)) < 26 && (A.x - front) * dir > -6 && (A.x - front) * dir < 46) stop = true;
    for (const o of cars) if (o !== c && o.lane === c.lane && (o.x - c.x) * dir > 0 && (o.x - c.x) * dir < (c.spr.w + o.spr.w) / 2 + 14) stop = true;
    c.v += ((stop ? 0 : c.speed) - c.v) * Math.min(1, dt * (stop ? 6 : 1.2));
    c.x += dir * c.v * dt;
    if (dir > 0 && c.x > MW + 120) c.x = -120;
    if (dir < 0 && c.x < -120) c.x = MW + 120;
  }
}

/* ---------- 효과 입자 ---------- */
const parts = [];
function particle(p) { parts.push({ vx: 0, vy: 0, life: 1, t: 0, delay: 0, ...p }); }
const HEART = (() => { const [c, g] = mk(9, 8); const P = (x, y, w, h) => R(g, x + 1, y + 1, w, h, '#ff5a7a'); P(0, 1, 3, 3); P(4, 1, 3, 3); P(1, 0, 2, 1); P(4, 0, 2, 1); P(0, 2, 7, 2); P(1, 4, 5, 1); P(2, 5, 3, 1); P(3, 6, 1, 1); return outline(c, '#7a1f3a'); })();
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.delay > 0) { p.delay -= dt; continue; }
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.g) p.vy += p.g * dt;
    if (p.t > p.life) parts.splice(i, 1);
  }
}

/* ---------- 프린터 · 탁구 · 불꽃 ---------- */
const printerObjs = W.objects.filter((o) => o.printer !== undefined);
const printers = [0, 1, 2].map((i) => ({ shakeUntil: 0, blinkUntil: 0, obj: printerObjs.find((o) => o.printer === i) }));
const fireFx = { burstUntil: 0 };
const pp = { t: 0 };

/* ---------- 입력 ---------- */
const keys = new Set();
const joy = { x: 0, y: 0, on: false };
const mode = { playing: false, modal: false };
addEventListener('keydown', (e) => {
  if (!mode.playing || mode.modal || e.target.closest('input, textarea')) return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(k)) e.preventDefault();
  if (k === ' ' || k === 'enter' || k === 'e') { doAction(); return; }
  if (k === 'q') { doAction2(); return; }
  if (k === 't') { togglePhrases(); return; }
  keys.add(k);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
// 조이스틱 (터치)
{
  const pad = $('#joy'), knob = $('#knob');
  let id = null, cx = 0, cy = 0;
  const move = (e) => {
    const t = [...e.changedTouches].find((x) => x.identifier === id); if (!t) return;
    let dx = t.clientX - cx, dy = t.clientY - cy; const d = Math.hypot(dx, dy), m = 42;
    if (d > m) { dx = dx / d * m; dy = dy / d * m; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.x = dx / m; joy.y = dy / m; joy.on = Math.hypot(joy.x, joy.y) > 0.18;
  };
  pad.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; id = t.identifier; const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); }, { passive: false });
  pad.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
  const end = (e) => { if (![...e.changedTouches].some((x) => x.identifier === id)) return; id = null; joy.x = joy.y = 0; joy.on = false; knob.style.transform = ''; };
  pad.addEventListener('touchend', end); pad.addEventListener('touchcancel', end);
}
// 화면 누르기: 사람 → 콕 찌르기 · 물건 → 가서 하기 · 바닥 → 걸어가기
const cam = { x: 0, y: 0 };
const toWorld = (cx, cy) => [cam.x + cx * DPR / S, cam.y + cy * DPR / S];
canvas.addEventListener('pointerdown', (e) => {
  if (!mode.playing || mode.modal) return;
  audio.start();
  closePhrases();
  const [wx, wy] = toWorld(e.clientX, e.clientY);
  // 다른 사람
  let best = null, bd = 1e9;
  for (const R2 of remotes.values()) { const A = R2.A; if (wx > A.x - 10 && wx < A.x + 10 && wy > A.y - 26 && wy < A.y + 2) { const d = Math.hypot(A.x - wx, A.y - 12 - wy); if (d < bd) { bd = d; best = R2; } } }
  if (best) { if (Math.hypot(best.A.x - me.x, best.A.y - me.y) < 70) poke(best); else goTo(best.A.x, best.A.y + 10, () => poke(best)); return; }
  // 고양이
  for (const c of CATS) if (Math.abs(wx - c.x) < 12 && wy > c.y - 16 && wy < c.y + 4) { goTo(c.x - 14 * c.face, c.y + 2, () => doPet(c)); return; }
  // 자리 · 할 일
  let tgt = null; bd = 18;
  for (const s of W.seats) { const d = Math.hypot(s.x - wx, s.y - 8 - wy); if (d < bd && !seatTaken(s)) { bd = d; tgt = { seat: s }; } }
  for (const s of W.stations) { const d = Math.hypot(s.x - wx, s.y - 14 - wy); if (d < bd + 4) { bd = d; tgt = { st: s }; } }
  if (tgt) {
    standUp();
    if (tgt.seat) goTo(tgt.seat.x, tgt.seat.y + 10, () => sitDown(tgt.seat));
    else goTo(tgt.st.x, tgt.st.y, () => useStation(tgt.st));
    return;
  }
  standUp();
  goTo(wx, wy);
});
function goTo(x, y, then = null) {
  const p = findPath(me.x, me.y, x, y);
  me.path = p; me.then = then;
  if (!p) { me.then = null; if (then && Math.hypot(x - me.x, y - me.y) < 30) then(); }
}

/* ---------- 행동 ---------- */
function seatTaken(s) { for (const R2 of remotes.values()) if (R2.A.seat === s) return true; return false; }
function standUp() {
  if (!me.seat && !me.bed) return;
  const s = me.seat, b = me.bed;
  me.seat = null; me.bed = null;
  if (s) { if (s.dir === 0) me.y = s.y + 14; else if (s.dir === 1) me.y = s.y + 10; else { me.x = s.x + (s.dir === 2 ? -16 : 16); me.y = s.y + 4; } }
  if (b) { me.x = b.x; me.y = b.y; }
  unstick();
  sendPresence(true); refreshContext(true);
}
function unstick() { if (COL.hit(me.x, me.y)) { const f = nearestFree(Math.floor(me.x / PC), Math.floor((me.y - 6) / PC)); if (f) { me.x = f[0] * PC + 4; me.y = f[1] * PC + 6; } } }
function sitDown(s) {
  if (seatTaken(s)) return;
  me.path = null; me.seat = s; me.bed = null; me.x = s.x; me.y = s.y; me.dir = s.dir;
  sfxAt('pop', me, 0.8);
  if (Math.random() < 0.5) setTimeout(() => { if (me.seat === s) sayLine(me, pick(PHRASES[SEAT_PHR[s.kind]] || PHRASES.office)); }, 700);
  sendPresence(true); refreshContext(true);
}
function holdItem(name, sec) { me.hold = name; me.holdUntil = performance.now() + sec * 1000; }
function doFx(A, k, a, r) { // 모두에게 똑같이 보이는 효과
  const st = typeof a === 'string' ? stById.get(a) : null;
  if (k === 'coffee') { sfxAt('brew', A); for (let i = 0; i < 6; i++) particle({ type: 'steam', x: (st?.x ?? A.x) + rand(-3, 3), y: (st?.y ?? A.y) - 30, vy: -10, life: 1.4, delay: i * 0.25 }); }
  else if (k === 'snack') sfxAt('crunch', A);
  else if (k === 'water') sfxAt('sip', A);
  else if (k === 'print') {
    const P = printers[r?.i ?? 0]; if (!P?.obj) return;
    const ox = P.obj.x + 14, oy = P.obj.y + 14;
    sfxAt('print', A, r.r);
    if (r.r === 'ok') particle({ type: 'paper', x: ox, y: oy, vy: -14, vx: 0, life: 1.2, g: 30, delay: 1.3 });
    else if (r.r === 'jam') { P.blinkUntil = performance.now() + 2600; for (let i = 0; i < 4; i++) particle({ type: 'smoke', x: ox + rand(-6, 6), y: oy - 8, vy: -12, life: 1.2, delay: 0.7 + i * 0.3 }); }
    else { P.shakeUntil = performance.now() + 3200; for (let i = 0; i < 10; i++) particle({ type: 'paper', x: ox, y: oy, vx: rand(-60, 60), vy: rand(-70, -30), g: 90, life: 1.6, delay: 0.3 + i * 0.28, spin: rand(-6, 6) }); }
  }
  else if (k === 'shred') { sfxAt('shred', A); for (let i = 0; i < 10; i++) particle({ type: 'strip', x: (st?.x ?? A.x) + rand(-5, 5), y: (st?.y ?? A.y) - 22, vy: 20, life: 0.8, delay: i * 0.14 }); }
  else if (k === 'burn') {
    sfxAt('paper', A);
    particle({ type: 'ball', x: A.x, y: A.y - 16, tx: W.fire.x, ty: W.fire.y, life: 0.7, arc: true });
    setTimeout(() => { fireFx.burstUntil = performance.now() + 2200; sfxAt('whoosh', A); for (let i = 0; i < 14; i++) particle({ type: 'ember', x: W.fire.x + rand(-12, 12), y: W.fire.y + 6, vx: rand(-14, 14), vy: rand(-50, -20), life: rand(0.8, 1.6) }); }, 650);
  }
  else if (k === 'hug') { sfxAt('hug', A); for (let i = 0; i < 5; i++) particle({ type: 'heart', x: A.x + rand(-10, 10), y: A.y - 26, vy: -16, vx: rand(-6, 6), life: 1.6, delay: i * 0.2 }); }
  else if (k === 'pet') { const c = CATS[a]; if (c) petCat(c, A); }
  else if (k === 'shop') sfxAt('ding', A);
}
function useStation(st) {
  me.path = null;
  const fxNow = (k, a, r) => { me.fx = { n: ++me.fxN, k, a, r }; doFx(me, k, a, r); sendPresence(true); };
  const face = st.face ?? 1;
  if (st.kind === 'coffee') { me.dir = face; me.act = 'brew'; me.actUntil = performance.now() + 1400; fxNow('coffee', st.id); setTimeout(() => { holdItem('coffee', 40); if (Math.random() < 0.6) sayLine(me, '커피 수혈 필요…☕'); sendPresence(true); }, 1400); }
  else if (st.kind === 'snack') { me.dir = face; holdItem('snack', 25); fxNow('snack', st.id); if (Math.random() < 0.6) sayLine(me, '이 과자 맛있다!'); }
  else if (st.kind === 'water' || st.kind === 'sink') { me.dir = face; holdItem('water', 25); fxNow('water', st.id); }
  else if (st.kind === 'printer') {
    me.dir = face; const r = Math.random(), res = r < 0.55 ? 'ok' : r < 0.8 ? 'jam' : 'run';
    fxNow('print', st.id, { i: st.printer, r: res });
    if (res === 'ok') setTimeout(() => { holdItem('paper', 30); sendPresence(true); }, 1500);
    if (res === 'jam') setTimeout(() => sayLine(me, '앗 종이 걸렸다! 😵'), 900);
    if (res === 'run') setTimeout(() => sayLine(me, '으악 멈춰!! 🖨️💨'), 600);
  }
  else if (st.kind === 'shredder') { me.dir = face; if (me.hold === 'paper') me.hold = null; fxNow('shred', st.id); }
  else if (st.kind === 'fire') { me.dir = face; openVent(); }
  else if (st.kind === 'teddy') { me.dir = face; fxNow('hug', st.id); setTimeout(() => sayLine(me, '곰돌아 고마워 🧸'), 500); }
  else if (st.kind === 'book') { me.dir = face; holdItem('book', 60); sfxAt('paper', me); }
  else if (st.kind === 'poster') { openPosters(); }
  else if (st.kind === 'shop') { me.dir = face; const sh = SHOPS[st.shop]; holdItem(sh.item, 45); fxNow('shop', st.id); setTimeout(() => sayLine(me, pick(PHRASES[sh.phr])), 600); }
  else if (st.kind === 'bed') { me.bed = { x: st.x, y: st.y, bx: st.bed.x, top: st.bed.top, col: st.bed.col, st: st.id }; me.seat = null; me.hold = null; sfxAt('pop', me, 0.7); }
  else if (st.kind === 'pp') { me.x = st.x; me.y = st.y; me.dir = st.side ? 2 : 3; me.playing = !me.playing; holdItem(me.playing ? 'paddle' : null, 600); if (me.playing && Math.random() < 0.5) sayLine(me, pick(PHRASES.pingpong)); }
  sendPresence(true); refreshContext(true);
}
function doPet(c) { me.petN++; me.pet = { n: me.petN, c: c.i }; me.dir = c.x > me.x ? 3 : 2; doFx(me, 'pet', c.i); sendPresence(true); }
function poke(R2) {
  me.pokeN++; me.poke = { n: me.pokeN, to: R2.peer };
  me.dir = Math.abs(R2.A.x - me.x) > Math.abs(R2.A.y - me.y) ? (R2.A.x > me.x ? 3 : 2) : (R2.A.y > me.y ? 0 : 1);
  sfxAt('poke', me); R2.A.hop = 0.5;
  sayLine(me, pick(POKE_FROM));
}
// 근처에서 할 수 있는 것
let ctxTarget = null, ctxBuddy = null;
function findTarget() {
  if (me.seat || me.bed) return { label: '🚶 일어나기', fn: standUp };
  if (me.playing) return { label: '🏓 그만 치기', fn: () => { me.playing = false; me.hold = null; sendPresence(true); refreshContext(true); } };
  let best = null, bd = 26;
  for (const s of W.seats) { const d = Math.hypot(s.x - me.x, s.y + 8 - me.y); if (d < bd && !seatTaken(s)) { bd = d; best = { label: SEAT_LABEL[s.kind] || '🪑 앉기', fn: () => sitDown(s) }; } }
  for (const s of W.stations) { const d = Math.hypot(s.x - me.x, s.y - me.y); if (d < bd + 4) { bd = d; best = { label: s.label, fn: () => useStation(s) }; } }
  for (const c of CATS) { const d = Math.hypot(c.x - me.x, c.y - me.y); if (d < 26 && d < bd + 6) { bd = d; best = { label: '🐱 쓰다듬기', fn: () => doPet(c) }; } }
  return best;
}
function findBuddy() {
  let best = null, bd = 44;
  for (const R2 of remotes.values()) { const d = Math.hypot(R2.A.x - me.x, R2.A.y - me.y); if (d < bd) { bd = d; best = R2; } }
  return best;
}
function refreshContext(force) {
  const tg = findTarget(), bu = (me.seat || me.bed) ? null : findBuddy();
  const act = $('#act'), act2 = $('#act2');
  const l1 = tg ? tg.label : bu ? `👉 ${bu.A.name} 콕 찌르기` : '';
  const l2 = tg && bu ? `👉 ${bu.A.name} 콕` : '';
  ctxTarget = tg || (bu ? { fn: () => poke(bu) } : null); ctxBuddy = tg && bu ? bu : null;
  if (force || act.textContent !== l1) { act.textContent = l1; act.hidden = !l1; }
  if (force || act2.textContent !== l2) { act2.textContent = l2; act2.hidden = !l2; }
}
function doAction() { audio.start(); if (ctxTarget) ctxTarget.fn(); }
function doAction2() { if (ctxBuddy) poke(ctxBuddy); }
$('#act').addEventListener('click', doAction);
$('#act2').addEventListener('click', doAction2);

/* ---------- 말하기 목록 ---------- */
function buildPhrases() {
  const box = $('#phrases'); box.replaceChildren();
  const z = zoneAt(me.x, me.y);
  let key = me.seat ? SEAT_PHR[me.seat.kind] : me.bed ? 'nap' : me.playing ? 'pingpong' : z.phr;
  const list = [...new Set([...(PHRASES[key] || []), ...PHRASES.office])].slice(0, 16);
  for (const p of list) { const b = document.createElement('button'); b.type = 'button'; b.textContent = p; b.addEventListener('click', () => { sayLine(me, p); closePhrases(); }); box.appendChild(b); }
}
function togglePhrases() { const box = $('#phrases'); if (box.hidden) { buildPhrases(); box.hidden = false; $('#talk').setAttribute('aria-expanded', 'true'); } else closePhrases(); }
function closePhrases() { $('#phrases').hidden = true; $('#talk').setAttribute('aria-expanded', 'false'); }
$('#talk').addEventListener('click', () => { audio.start(); togglePhrases(); });

/* ---------- 네트워크 ---------- */
let room = null, lastSent = 0, lastMoveSent = 0;
function presenceData() {
  return {
    v: 2, n: me.name, d: me.design, x: Math.round(me.x), y: Math.round(me.y), f: me.dir,
    vx: Math.round(me.vx), vy: Math.round(me.vy), s: me.seat ? me.seat.id : null, b: me.bed ? me.bed.st : null,
    h: me.hold, p: me.playing ? 1 : 0,
    say: me.say && me.sayN ? { n: me.sayN, t: me.say.t } : null, poke: me.poke || null, fx: me.fx || null, pet: me.pet || null,
  };
}
function sendPresence(force) {
  if (!room || !mode.playing) return;
  const now = performance.now();
  if (!force && now - lastSent < 150) return;
  lastSent = now;
  try { room.presence(presenceData()); } catch (e) { /* 무시 */ }
}
const num = (v, a, b, d = 0) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
function applyRemote(p) {
  const pr = p.presence || {};
  if (pr.v !== 2 || typeof pr.n !== 'string') return;
  let R2 = remotes.get(p.peer);
  const name = cleanText(pr.n, 10) || '방문자';
  if (!R2) {
    R2 = { peer: p.peer, A: { x: num(pr.x, 0, MW), y: num(pr.y, 0, MH), dir: 0, walkT: 0, moving: false, name, design: 0, hop: 0 }, sayN: pr.say?.n, pokeN: pr.poke?.n, fxN: pr.fx?.n, petN: pr.pet?.n };
    remotes.set(p.peer, R2);
  }
  const A = R2.A;
  A.name = name; A.design = num(pr.d, 0, DESIGNS.length - 1) | 0;
  R2.tx = num(pr.x, 0, MW); R2.ty = num(pr.y, 0, MH); R2.vx = num(pr.vx, -200, 200); R2.vy = num(pr.vy, -200, 200); R2.at = performance.now();
  A.dir = num(pr.f, 0, 3) | 0;
  A.seat = typeof pr.s === 'string' ? seatById.get(pr.s) || null : null;
  const bs = typeof pr.b === 'string' ? stById.get(pr.b) : null;
  A.bed = bs && bs.bed ? { x: bs.x, y: bs.y, bx: bs.bed.x, top: bs.bed.top, col: bs.bed.col, st: bs.id } : null;
  A.hold = typeof pr.h === 'string' && ITEMS[pr.h] ? pr.h : null;
  A.playing = !!pr.p;
  if (pr.say && pr.say.n !== R2.sayN) { R2.sayN = pr.say.n; if (typeof pr.say.t === 'string') sayLine(A, pr.say.t); }
  if (pr.poke && pr.poke.n !== R2.pokeN) {
    R2.pokeN = pr.poke.n;
    A.hop = 0.5; sfxAt('poke', A);
    if (room && pr.poke.to === myPeer) { me.hop = 0.6; setTimeout(() => sayLine(me, pick(POKE_TO)), 500); }
  }
  if (pr.fx && pr.fx.n !== R2.fxN) { R2.fxN = pr.fx.n; if (typeof pr.fx.k === 'string') doFx(A, pr.fx.k, pr.fx.a, pr.fx.r && typeof pr.fx.r === 'object' ? { i: num(pr.fx.r.i, 0, 2) | 0, r: ['ok', 'jam', 'run'].includes(pr.fx.r.r) ? pr.fx.r.r : 'ok' } : pr.fx.r); }
  if (pr.pet && pr.pet.n !== R2.petN) { R2.petN = pr.pet.n; doFx(A, 'pet', num(pr.pet.c, 0, CATS.length - 1) | 0); }
}
let myPeer = null;
function onPeers(ch) {
  const mine = ch.peers.find((p) => p.isMe); if (mine) myPeer = mine.peer;
  for (const p of ch.left) remotes.delete(p.peer);
  for (const p of [...ch.joined, ...ch.updated]) if (!p.isMe && p.viewer !== false) applyRemote(p);
  updateOnline();
}
function updateOnline() { $('#online').textContent = `👥 ${remotes.size + 1}명`; }
onNetStatus((s) => { const el = $('#online'); el.classList.toggle('net-wait', RELAY.relay && s !== 'ok'); el.title = s === 'ok' ? '멀티플레이 연결됨' : '멀티플레이 연결 중…'; });
(async () => { room = await connect(); if (room) { myPeer = room.selfId; room.onPeers(onPeers); if (mode.playing) sendPresence(true); } })();
function updateRemotes(dt) {
  for (const R2 of remotes.values()) {
    const A = R2.A;
    if (A.seat) { A.x = A.seat.x; A.y = A.seat.y; A.dir = A.seat.dir; A.moving = false; continue; }
    if (A.bed) { A.x = A.bed.x; A.y = A.bed.y; A.moving = false; continue; }
    const age = Math.min(0.6, (performance.now() - (R2.at || 0)) / 1000 + (RELAY.relay ? 0.2 : 0.05));
    let px = R2.tx + (R2.vx || 0) * age, py = R2.ty + (R2.vy || 0) * age;
    if ((R2.vx || R2.vy) && COL.hit(px, py)) { px = R2.tx; py = R2.ty; }
    const dx = px - A.x, dy = py - A.y, d = Math.hypot(dx, dy);
    if (d > 120) { A.x = px; A.y = py; } else { const k = Math.min(1, dt * 12); A.x += dx * k; A.y += dy * k; }
    A.moving = Math.hypot(R2.vx || 0, R2.vy || 0) > 8 || d > 3;
    if (A.moving) A.walkT += dt;
  }
}

/* ---------- 움직이기 ---------- */
function updateMe(dt) {
  let ix = 0, iy = 0;
  if (!mode.modal) {
    if (keys.has('arrowleft') || keys.has('a')) ix -= 1;
    if (keys.has('arrowright') || keys.has('d')) ix += 1;
    if (keys.has('arrowup') || keys.has('w')) iy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) iy += 1;
    if (joy.on) { ix = joy.x; iy = joy.y; }
  }
  if ((ix || iy) && (me.seat || me.bed || me.playing)) { if (me.playing) { me.playing = false; me.hold = null; } standUp(); }
  if (ix || iy) { me.path = null; me.then = null; closePhrases(); }
  let vx = 0, vy = 0;
  if (ix || iy) { const m = Math.min(1, Math.hypot(ix, iy)); const d = Math.hypot(ix, iy) || 1; vx = ix / d * SPEED * m; vy = iy / d * SPEED * m; }
  else if (me.path && me.path.length) {
    const [tx, ty] = me.path[0], dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy);
    if (d < 3) { me.path.shift(); if (!me.path.length) { me.path = null; const f = me.then; me.then = null; if (f) f(); } }
    else { vx = dx / d * SPEED; vy = dy / d * SPEED; }
  }
  if (me.seat || me.bed) { vx = vy = 0; }
  if (vx || vy) {
    const nx = me.x + vx * dt, ny = me.y + vy * dt;
    if (!COL.hit(nx, me.y)) me.x = nx; else if (me.path) me.x = nx * 0 + me.x;
    if (!COL.hit(me.x, ny)) me.y = ny;
    if (Math.abs(vx) > Math.abs(vy)) me.dir = vx > 0 ? 3 : 2; else me.dir = vy > 0 ? 0 : 1;
    me.walkT += dt; me.moving = true;
  } else me.moving = false;
  me.x = clamp(me.x, 6, MW - 6); me.y = clamp(me.y, 8, MH - 2);
  me.vx = vx; me.vy = vy;
  const now = performance.now();
  if (me.hold && me.holdUntil < now) { me.hold = null; sendPresence(true); }
  if (me.moving && now - lastMoveSent > 150) { lastMoveSent = now; sendPresence(true); }
  else if (!me.moving && me.wasMoving) sendPresence(true);
  me.wasMoving = me.moving;
  if (now - lastSent > 2000) sendPresence(true);
  // 구역 바뀌면 음악 바꾸기
  const z = zoneAt(me.x, me.y);
  const mz = z.music === 'street' && TOD.night > 0.5 ? 'streetNight' : z.music;
  if (z !== me.zone || mz !== me.mz) { me.zone = z; me.mz = mz; audio.setZone(mz); if (!$('#phrases').hidden) buildPhrases(); }
}

/* ---------- 시간 (서울) ---------- */
function seoulHour() {
  const s = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const [h, m] = s.split(':').map(Number);
  return { h: (h % 24) + m / 60, label: s };
}
let TOD = { h: 12, night: 0, dusk: 0 };
function updateTOD() {
  if (updateTOD.frozen) return;
  const { h, label } = seoulHour();
  const night = h < 5 || h >= 20 ? 1 : h < 7 ? 1 - (h - 5) / 2 : h >= 18 ? (h - 18) / 2 : 0;
  const dusk = h >= 16.5 && h < 19.5 ? 1 - Math.abs(h - 18) / 1.5 : h >= 5 && h < 7 ? 0.5 - Math.abs(h - 6) / 2 : 0;
  TOD = { h, night, dusk };
  $('#clock').textContent = `${night > 0.5 ? '🌙' : '☀️'} ${label}`;
}
updateTOD(); setInterval(updateTOD, 20000);

/* ---------- 그리기 ---------- */
function drawChar(A, now) {
  const sh = charSheet(A.design);
  let img, dx = A.x - CW / 2, dy = A.y - CH + 3;
  const hop = A.hop > 0 ? -Math.abs(Math.sin(A.hop * 12)) * 4 : 0;
  if (A.bed) {
    img = sh.sleep;
    const bx = A.bed.bx, tp = A.bed.top;
    ctx.drawImage(img, Math.round(bx - CW / 2), Math.round(tp + 3));
    // 이불 덮기 (머리만 베개 위로)
    const bl = A.bed.col || '#8fb8de';
    R(ctx, bx - 10, tp + 16, 20, 19, bl); R(ctx, bx - 10, tp + 16, 20, 2, '#ffffff55');
    for (let y = tp + 22; y < tp + 35; y += 5) R(ctx, bx - 10, y, 20, 1, '#00000022');
    return;
  }
  if (A.seat) img = sh.sit[A.dir];
  else img = sh.walk[A.dir][A.moving ? 1 + (Math.floor(A.walkT * 8) % 2) : 0];
  // 그림자
  ctx.globalAlpha = 0.22; R(ctx, A.x - 6, A.y - 1, 12, 3, '#000000'); ctx.globalAlpha = 1;
  ctx.drawImage(img, Math.round(dx), Math.round(dy + hop));
  if (A.hold && ITEMS[A.hold]) {
    const it = ITEMS[A.hold];
    const hx = A.dir === 2 ? A.x - 12 : A.dir === 3 ? A.x + 4 : A.x + 3, hy = A.y - (A.seat ? 9 : 11) + hop;
    if (A.dir !== 1) ctx.drawImage(it, Math.round(hx), Math.round(hy));
  }
}
function drawCat(c) {
  const s = c.spr, img = c.moving ? (c.face > 0 ? s.right : s.left)[Math.floor(performance.now() / 160) % 2] : c.face > 0 ? s.sitR : s.sitL;
  ctx.globalAlpha = 0.2; R(ctx, c.x - 6, c.y - 1, 12, 2, '#000000'); ctx.globalAlpha = 1;
  ctx.drawImage(img, Math.round(c.x - 9), Math.round(c.y - 13));
}
function drawCar(c) { const img = c.lane.dir > 0 ? c.spr.r : c.spr.l; ctx.drawImage(img, Math.round(c.x - c.spr.w / 2 - 1), Math.round(c.lane.y - c.spr.h + 4)); }
function drawDoors() {
  let open = 0;
  for (const A of everyone()) if (Math.abs(A.x - (DOOR.x0 + DOOR.x1) / 2) < 64 && Math.abs(A.y - DOOR.y) < 40) open = 1;
  drawDoors.o = (drawDoors.o || 0) + (open - (drawDoors.o || 0)) * 0.15;
  const w = (DOOR.x1 - DOOR.x0) / 2, sl = drawDoors.o * (w - 6), y = DOOR.y - FACE;
  for (const [x0, s] of [[DOOR.x0, -sl], [DOOR.x0 + w, sl]]) { ctx.fillStyle = 'rgba(170,215,235,0.4)'; ctx.fillRect(x0 + s, y, w, FACE); R(ctx, x0 + s, y, 2, FACE, '#5a646c'); R(ctx, x0 + s + w - 2, y, 2, FACE, '#5a646c'); }
  // 간판
  R(ctx, DOOR.x0 - 12, y - 22, DOOR.x1 - DOOR.x0 + 24, 16, '#26324a'); R(ctx, DOOR.x0 - 10, y - 20, DOOR.x1 - DOOR.x0 + 20, 12, '#2f3f5a');
  ctx.fillStyle = '#ffe2bd'; ctx.font = `11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('보장원', (DOOR.x0 + DOOR.x1) / 2, y - 14);
}
function drawFire(now) {
  const big = now < fireFx.burstUntil, x = W.fire.x, y = W.fire.y + 14;
  for (let i = 0; i < (big ? 9 : 5); i++) {
    const ph = now / 120 + i * 1.7, hgt = (big ? 18 : 10) + Math.sin(ph) * 3 + (i % 3) * 2;
    const fx = x - 12 + i * (24 / (big ? 8 : 4));
    R(ctx, fx - 2, y - hgt, 4, hgt, '#e0703c'); R(ctx, fx - 1, y - hgt * 0.7, 2, hgt * 0.7, '#f2c14e');
  }
  R(ctx, x - 12, y, 24, 3, '#6a3a20');
}
function drawClock(c) {
  const { h } = TOD;
  R(ctx, c.x - 7, c.y - 7, 14, 14, '#3a2a30'); R(ctx, c.x - 6, c.y - 6, 12, 12, '#fffaf2');
  const hand = (a, l, col) => { for (let i = 0; i < l; i++) R(ctx, c.x + Math.round(Math.sin(a) * i) - 0.5, c.y - Math.round(Math.cos(a) * i) - 0.5, 1, 1, col); };
  hand((h % 12) / 12 * Math.PI * 2, 4, '#2a1f2d'); hand((h % 1) * Math.PI * 2, 5, '#c0392b');
}
function drawPingpong(now) {
  if (!everyone().some((A) => A.playing)) return;
  const u = (now / 900) % 2, k = u < 1 ? u : 2 - u;
  const x = W.pingpong.x - 26 + 52 * k, y = W.pingpong.y - Math.abs(Math.sin(k * Math.PI)) * 10;
  R(ctx, x - 1, y - 1, 3, 3, '#ffffff');
  const hitNow = Math.floor(now / 900);
  if (hitNow !== drawPingpong.last) { drawPingpong.last = hitNow; if (me.playing) audio.sfx('ball', 0.7); }
}
function drawParts() {
  for (const p of parts) {
    if (p.delay > 0) continue;
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = clamp(a * 1.5, 0, 1);
    if (p.type === 'heart') ctx.drawImage(HEART, Math.round(p.x - 4), Math.round(p.y));
    else if (p.type === 'steam' || p.type === 'smoke') { R(ctx, p.x - 1 + Math.sin(p.t * 6) * 2, p.y, 3, 3, p.type === 'steam' ? '#ffffff' : '#8a8a90'); }
    else if (p.type === 'paper') { R(ctx, p.x - 3, p.y - 4, 6, 8, '#ffffff'); R(ctx, p.x - 2, p.y - 2, 4, 1, '#9aa3aa'); }
    else if (p.type === 'strip') R(ctx, p.x, p.y + p.t * 14, 1, 4, '#ffffff');
    else if (p.type === 'ember') R(ctx, p.x, p.y, 2, 2, p.t < 0.4 ? '#f2c14e' : '#e0703c');
    else if (p.type === 'zzz') { ctx.fillStyle = '#ffffff'; ctx.font = `11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('z', p.x, p.y); }
    else if (p.type === 'ball') { const u = p.t / p.life; const x = p.x + (p.tx - p.x) * u, y = p.y + (p.ty - p.y) * u - Math.sin(u * Math.PI) * 20; R(ctx, x - 3, y - 3, 6, 6, '#f4f1ea'); R(ctx, x - 2, y - 2, 2, 2, '#c8c2b8'); }
  }
  ctx.globalAlpha = 1;
}
const GLOW = new Map();
function glowSprite(r, col) {
  const k = r + col; if (GLOW.has(k)) return GLOW.get(k);
  const [c, g] = mk(r * 2, r * 2);
  const gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, `rgba(${col},0.9)`); gr.addColorStop(0.4, `rgba(${col},0.35)`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); GLOW.set(k, c); return c;
}
function render(now) {
  // 카메라
  const tx = clamp(me.x - VW / 2, 0, Math.max(0, MW - VW)), ty = clamp(me.y - 12 - VH / 2, 0, Math.max(0, MH - VH));
  cam.x += (tx - cam.x) * 0.18; cam.y += (ty - cam.y) * 0.18;
  if (Math.abs(tx - cam.x) > 400 || Math.abs(ty - cam.y) > 400) { cam.x = tx; cam.y = ty; }
  const cx = Math.round(cam.x * S) / S, cy = Math.round(cam.y * S) / S;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#3a5a2a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(S, 0, 0, S, -cx * S, -cy * S);
  ctx.drawImage(W.floor, Math.floor(cx), Math.floor(cy), Math.ceil(VW) + 2, Math.ceil(VH) + 2, Math.floor(cx), Math.floor(cy), Math.ceil(VW) + 2, Math.ceil(VH) + 2);
  // 깊이 순서대로
  const x0 = cx - 400, x1 = cx + VW + 400, y0 = cy - 40, y1 = cy + VH + 300;
  const list = [];
  for (const o of W.objects) { if (o.sort < y0 || o.y > y1 || o.x > x1 || o.x + o.img.width < x0) continue; list.push(o); }
  for (const A of everyone()) list.push({ sort: A.seat ? (A.dir === 1 ? A.y : A.y + 12) : A.bed ? A.bed.top + 38 : A.y, A });
  for (const c of CATS) list.push({ sort: c.y, cat: c });
  for (const c of cars) if (c.x > x0 && c.x < x1) list.push({ sort: c.lane.y + 4, car: c });
  list.push({ sort: DOOR.y + 0.5, doors: true });
  list.push({ sort: W.fire.y + 21, fire: true });
  for (const c of W.clocks) list.push({ sort: c.sort, clock: c });
  list.push({ sort: W.pingpong.y + 1, pp: true });
  list.sort((a, b) => a.sort - b.sort);
  for (const o of list) {
    if (o.A) drawChar(o.A, now);
    else if (o.cat) drawCat(o.cat);
    else if (o.car) drawCar(o.car);
    else if (o.doors) drawDoors();
    else if (o.fire) drawFire(now);
    else if (o.clock) drawClock(o.clock);
    else if (o.pp) drawPingpong(now);
    else if (o.printer !== undefined) {
      const P = printers[o.printer];
      const sx = now < P.shakeUntil ? Math.round(Math.sin(now / 30) * 2) : 0;
      ctx.drawImage(o.img, o.x + sx, o.y);
      if (now < P.blinkUntil && Math.floor(now / 200) % 2) R(ctx, o.x + 20, o.y + 7, 2, 2, '#ff3030');
    } else ctx.drawImage(o.img, o.x, o.y);
  }
  drawParts();
  // 어두운 방 · 낮과 밤
  for (const d of W.dims) { ctx.globalAlpha = d.a; ctx.fillStyle = d.col; ctx.fillRect(d.x, d.y, d.w, d.h); }
  ctx.globalAlpha = 1;
  const n = TOD.night;
  const tint = (a, col) => {
    if (a <= 0.01) return;
    ctx.globalAlpha = a; ctx.fillStyle = col;
    ctx.fillRect(cx, cy, VW + 2, Math.max(0, OFFICE.y0 - 40 - cy));
    ctx.fillRect(cx, OFFICE.y1, VW + 2, cy + VH - OFFICE.y1 + 2);
    ctx.fillRect(cx, OFFICE.y0 - 40, Math.max(0, OFFICE.x0 - cx), OFFICE.y1 - OFFICE.y0 + 40);
    ctx.fillRect(OFFICE.x1, OFFICE.y0 - 40, Math.max(0, cx + VW - OFFICE.x1 + 2), OFFICE.y1 - OFFICE.y0 + 40);
  };
  tint(n * 0.55, '#141a46');
  tint(TOD.dusk * 0.16, '#ff8a3c');
  if (n > 0.01) { ctx.globalAlpha = n * 0.14; ctx.fillStyle = '#141a46'; ctx.fillRect(OFFICE.x0, OFFICE.y0 - 40, OFFICE.x1 - OFFICE.x0, OFFICE.y1 - OFFICE.y0 + 40); }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'lighter';
  for (const gl of W.glows) {
    const a = (gl.always ? gl.a * (0.6 + 0.4 * n) * (gl.flicker ? 0.85 + 0.15 * Math.sin(now / 90) : 1) : gl.a * n) * (gl.twinkle !== undefined ? 0.45 + 0.55 * Math.abs(Math.sin(now / 700 + gl.twinkle * 1.7)) : 1);
    if (a < 0.02 || gl.x + gl.r < cx || gl.x - gl.r > cx + VW || gl.y + gl.r < cy || gl.y - gl.r > cy + VH) continue;
    ctx.globalAlpha = a; ctx.drawImage(glowSprite(gl.r, gl.col), gl.x - gl.r, gl.y - gl.r);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // 이름 · 말풍선 (화면 좌표, 또렷하게)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `${fontPx}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lw = Math.max(2, Math.round(fontPx / 4));
  const placed = []; // 말풍선끼리 겹치면 위로 비켜요
  for (const A of everyone()) {
    const bx = A.bed ? A.bed.bx : A.x, byw = A.bed ? A.bed.top + 2 : A.y - (A.seat ? 24 : 26) + (A.hop > 0 ? -4 : 0);
    const sx = Math.round((bx - cx) * S), sy = Math.round((byw - cy) * S);
    if (sx < -200 || sx > canvas.width + 200 || sy < -100 || sy > canvas.height + 100) continue;
    ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(30,20,35,0.85)'; ctx.strokeText(A.name, sx, sy - fontPx * 0.2);
    ctx.fillStyle = A === me ? '#ffe08a' : '#ffffff'; ctx.fillText(A.name, sx, sy - fontPx * 0.2);
    if (A.say && A.say.until > now) {
      const lines = wrap(A.say.t, fontPx * 11);
      const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + fontPx * 1.2, bh = lines.length * fontPx * 1.3 + fontPx * 0.8;
      let by = sy - fontPx * 1.2 - bh;
      for (let k = 0; k < 6; k++) { const hit = placed.find((r) => sx - bw / 2 < r.x + r.w && sx + bw / 2 > r.x && by < r.y + r.h && by + bh > r.y); if (!hit) break; by = hit.y - bh - fontPx * 0.4; }
      placed.push({ x: sx - bw / 2, y: by, w: bw, h: bh });
      const fade = clamp((A.say.until - now) / 400, 0, 1);
      ctx.globalAlpha = fade;
      const px = Math.max(2, Math.round(fontPx / 8));
      ctx.fillStyle = '#2a1f2d'; ctx.fillRect(sx - bw / 2 - px, by - px, bw + px * 2, bh + px * 2);
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(sx - bw / 2, by, bw, bh);
      ctx.fillStyle = '#2a1f2d'; ctx.fillRect(sx - px * 2, by + bh, px * 4, px * 2); ctx.fillStyle = '#fffaf0'; ctx.fillRect(sx - px, by + bh, px * 2, px);
      ctx.fillStyle = '#2a1f2d';
      lines.forEach((l, i) => ctx.fillText(l, sx, by + fontPx * 0.4 + fontPx * 1.3 * (i + 0.5) + 1));
      ctx.globalAlpha = 1;
    }
  }
  for (const A of everyone()) if (A.bed && Math.random() < 0.012) particle({ type: 'zzz', x: A.bed.bx + 8, y: A.bed.top + 4, vy: -10, vx: 6, life: 1.6 });
}
function wrap(text, maxW) {
  const out = []; let line = '';
  for (const ch of [...text]) { if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch.trim() ? ch : ''; if (out.length === 2) break; } else line += ch; }
  if (out.length < 2 && line) out.push(line);
  return out;
}

/* ---------- 반복 ---------- */
let last = performance.now(), photoReq = null, ctxTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode.playing) { updateMe(dt); updateRemotes(dt); }
  updateCats(dt, now); updateCars(dt); updateParts(dt);
  for (const A of everyone()) if (A.hop > 0) A.hop = Math.max(0, A.hop - dt);
  render(now);
  if (photoReq) { const f = photoReq; photoReq = null; canvas.toBlob(f, 'image/png'); }
  if (mode.playing && (ctxTick += dt) > 0.15) { ctxTick = 0; refreshContext(false); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- 입장 ---------- */
const picker = $('#designs');
function fillPicker(box, onPick, current) {
  box.replaceChildren();
  DESIGNS.forEach((d, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'design'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === current ? 'true' : 'false'); b.setAttribute('aria-label', d.name);
    b.appendChild(charPreview(i, 3));
    b.addEventListener('click', () => { box.querySelectorAll('.design').forEach((x) => x.setAttribute('aria-checked', x === b ? 'true' : 'false')); onPick(i); });
    box.appendChild(b);
  });
}
me.design = Number(store.get('bjp.design')) || 0;
fillPicker(picker, (i) => { me.design = i; audio.start(); audio.sfx('pop', 0.6); }, me.design);
$('#nick').value = store.get('bjp.nick') || '';
const enterBtn = $('#enter');
enterBtn.disabled = false; enterBtn.textContent = '입장하기';
function enterGame() {
  const raw = cleanText($('#nick').value, 10).trim();
  if (!raw) { $('#nick').focus(); $('.card').classList.remove('shake'); void $('.card').offsetWidth; $('.card').classList.add('shake'); return; }
  me.name = raw; store.set('bjp.nick', raw); store.set('bjp.design', String(me.design));
  audio.start(); audio.sfx('pop', 0.8);
  $('#intro').classList.add('hidden');
  document.querySelectorAll('.hud').forEach((el) => el.classList.remove('hidden'));
  if (!isTouch) $('#joy').classList.add('hidden');
  mode.playing = true;
  me.x = (DOOR.x0 + DOOR.x1) / 2 + rand(-20, 20); me.y = DOOR.y + 50;
  $('#hint').textContent = isTouch ? '조이스틱이나 화면을 눌러 움직여요 · 사람을 누르면 콕!' : '방향키/WASD로 걷고 스페이스로 행동 · 화면을 눌러도 걸어가요';
  setTimeout(() => $('#hint').classList.add('fade'), 7000);
  updateOnline(); sendPresence(true); refreshContext(true);
}
enterBtn.addEventListener('click', enterGame);
$('#nick').addEventListener('keydown', (e) => { if (e.key === 'Enter') enterGame(); });

/* ---------- 상단 버튼 ---------- */
const openSheet = (id) => { $(id).hidden = false; mode.modal = true; keys.clear(); };
const closeSheet = (id) => { $(id).hidden = true; mode.modal = false; refreshContext(true); };
for (const id of ['#charSheet', '#shotSheet', '#netSheet', '#posterSheet', '#vent']) $(id).addEventListener('click', (e) => { if (e.target === $(id)) closeSheet(id); });
// 캐릭터 바꾸기
$('#char').addEventListener('click', () => { fillPicker($('#charPick'), (i) => { me.design = i; store.set('bjp.design', String(i)); audio.sfx('pop', 0.7); sendPresence(true); closeSheet('#charSheet'); }, me.design); openSheet('#charSheet'); });
document.querySelector('.char-cancel').addEventListener('click', () => closeSheet('#charSheet'));
// 장소 이동
{
  const panel = $('#tpPanel');
  for (const [label, x, y] of W.spots) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('role', 'menuitem');
    b.addEventListener('click', () => { standUp(); me.playing = false; me.x = x; me.y = y; unstick(); me.path = null; panel.classList.add('hidden'); cam.x = me.x - VW / 2; cam.y = me.y - VH / 2; audio.sfx('pop', 0.7, 1.3); sendPresence(true); refreshContext(true); });
    panel.appendChild(b);
  }
  $('#tp').addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('hidden'); });
  addEventListener('pointerdown', (e) => { if (!panel.contains(e.target) && e.target !== $('#tp')) panel.classList.add('hidden'); });
}
// 음악
$('#music').addEventListener('click', () => { const on = !audio.on; audio.start(); audio.toggle(on); $('#music').setAttribute('aria-pressed', String(on)); $('#music').classList.toggle('off', !on); });
// 사진
let downloadsCap;
$('#shot').addEventListener('click', () => {
  const fl = $('#flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
  audio.sfx('pop', 0.8, 1.9);
  photoReq = (blob) => {
    if (!blob) return;
    const d = new Date(), pad = (n) => String(n).padStart(2, '0');
    const filename = `보장원_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`;
    const url = URL.createObjectURL(blob);
    $('#shotImg').src = url; $('#shotInfo').textContent = '';
    openSheet('#shotSheet');
    $('#shotSave').onclick = async () => {
      try {
        if (downloadsCap === undefined) downloadsCap = window.claude?.use ? await window.claude.use('downloads') : null;
        if (downloadsCap) await downloadsCap.save({ filename, data: blob });
        else { const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }
        $('#shotInfo').textContent = '사진을 저장했어요 📸';
      } catch (e) { $('#shotInfo').textContent = e?.code === 'declined' ? '저장을 취소했어요.' : '여기서는 저장할 수 없어요. 사진을 길게 눌러(또는 오른쪽 클릭) 저장해 주세요.'; }
    };
  };
});
document.querySelector('.shot-close').addEventListener('click', () => closeSheet('#shotSheet'));
// 포스터 크게 보기
function openPosters() {
  const box = $('#posterBox');
  if (!box.childElementCount) {
    for (const k of ['cheer', 'lunch', 'sports', 'notice']) {
      const c = document.createElement('canvas'); c.width = 300; c.height = k === 'notice' ? 244 : 400;
      drawPoster(k, c.getContext('2d'), c.width, c.height, FONT); box.appendChild(c);
    }
  }
  openSheet('#posterSheet');
}
document.querySelector('.poster-close').addEventListener('click', () => closeSheet('#posterSheet'));
// 불만창고: 쓴 내용은 저장하지 않고, 아무에게도 보내지 않아요 (태우는 모습만 보여요)
function openVent() { const ta = $('#vent .vent-text'); ta.value = ''; openSheet('#vent'); setTimeout(() => ta.focus(), 30); }
function closeVent() { const ta = $('#vent .vent-text'); ta.value = ''; ta.blur(); closeSheet('#vent'); }
document.querySelector('#vent .sheet-cancel').addEventListener('click', closeVent);
document.querySelector('#vent .sheet-go').addEventListener('click', () => {
  const ta = $('#vent .vent-text');
  if (!ta.value.trim()) { const sh = document.querySelector('#vent .sheet'); sh.classList.remove('shake'); void sh.offsetWidth; sh.classList.add('shake'); return; }
  ta.value = '';
  closeVent();
  me.fx = { n: ++me.fxN, k: 'burn' }; doFx(me, 'burn'); sendPresence(true);
  setTimeout(() => sayLine(me, pick(PHRASES.vent)), 1600);
});
$('#vent .vent-text').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeVent(); });
// 네트워크 상태
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const latClass = (ms) => (ms == null ? '' : ms < 300 ? 'good' : ms < 600 ? 'ok' : 'bad');
function renderNet() {
  const box = $('#netBody'); if (!box || $('#netSheet').hidden) return;
  const now = performance.now();
  box.replaceChildren();
  const line = (cls, ...cells) => { const r = document.createElement('div'); r.className = 'net-row ' + (cls || ''); for (const c of cells) { const s = document.createElement('span'); s.textContent = c; r.appendChild(s); } box.appendChild(r); };
  if (!RELAY.relay) { const p = document.createElement('p'); p.className = 'sheet-note'; p.textContent = room ? 'claude.ai 아티팩트 연결을 쓰고 있어요. 지연 측정은 GitHub Pages 주소에서 볼 수 있어요.' : '멀티플레이에 연결되어 있지 않아요 (혼자 모드).'; box.appendChild(p); return; }
  const names = ['HiveMQ', 'EMQX'], tot = NET.firstFrom[0] + NET.firstFrom[1] || 1;
  line('net-head', '중계소', '상태', '먼저 도착');
  RELAY.clients.forEach((c, i) => line(c.connected ? 'good' : 'bad', names[i], c.connected ? '연결됨' : '연결 중…', `${Math.round(NET.firstFrom[i] / tot * 100)}%`));
  line('net-head', '접속자', '왕복 지연', '받는 횟수 · 마지막');
  const all = [];
  for (const R2 of remotes.values()) {
    const P = NET.peers.get(R2.peer) || { rtt: [], times: [] };
    P.times = P.times.filter((x) => now - x < 5000);
    const rtt = median(P.rtt); if (rtt != null) all.push(rtt);
    const lastT = P.times.length ? ((now - P.times[P.times.length - 1]) / 1000).toFixed(1) + '초 전' : '-';
    line(latClass(rtt), R2.A.name, rtt == null ? '재는 중…' : `${Math.round(rtt)} ms`, `${(P.times.length / 5).toFixed(1)}/초 · ${lastT}`);
  }
  if (!remotes.size) line('', '다른 접속자가 없어요', '', '');
  const sum = $('#netSum');
  if (all.length) { const avg = all.reduce((a, b) => a + b, 0) / all.length, worst = Math.max(...all); sum.textContent = `평균 ${Math.round(avg)} ms · 가장 느린 사람 ${Math.round(worst)} ms — ${worst < 300 ? '끊김 없이 좋아요 👍' : worst < 600 ? '조금 늦지만 괜찮아요' : '느려요 (끊겨 보일 수 있어요)'}`; sum.className = 'net-sum ' + latClass(worst); }
  else { sum.textContent = '왕복 지연은 이 창을 열어 둔 동안 2초마다 재요.'; sum.className = 'net-sum'; }
}
setInterval(renderNet, 1000);
setInterval(() => { if (!$('#netSheet').hidden) room?.ping?.(); }, 2000);
const openNet = () => { if (!mode.playing) return; openSheet('#netSheet'); room?.ping?.(); renderNet(); };
$('#brand').addEventListener('click', openNet);
$('#brand').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNet(); } });
document.querySelector('.net-close').addEventListener('click', () => closeSheet('#netSheet'));

// 개발 · 점검용
window.__px = { W, me, remotes, cars, CATS, COL, findPath, seatById, stById, sitDown, useStation, standUp, enterGame, doAction, cam, render: () => render(performance.now()), walk, GW, GH, PC, setHour: (h) => { const real = seoulHour; TOD = { h, night: h < 5 || h >= 20 ? 1 : h < 7 ? 1 - (h - 5) / 2 : h >= 18 ? (h - 18) / 2 : 0, dusk: h >= 16.5 && h < 19.5 ? 1 - Math.abs(h - 18) / 1.5 : 0 }; void real; updateTOD.frozen = true; } };
