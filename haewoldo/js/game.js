'use strict';
/* =========================================================
 *  해월도 마을생활 — 엔진 · AI · 이벤트 · UI
 * ========================================================= */

const SAVE_KEY = 'haewoldo-village-v1';
const MIN_PER_SEC = 1;               // 현실 1초 = 게임 1분
const DOW = ['월', '화', '수', '목', '금', '토', '일'];
const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmtMoney = (n) => n.toLocaleString('ko-KR') + '원';
const fmtTime = (m) => { m = Math.floor(m); const h = Math.floor(m / 60) % 24, mm = m % 60; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };

let S = null;           // 저장되는 상태
const G = {             // 런타임 상태
  player: null, det: null, villagers: [], actors: [],
  busy: 0, dialog: false, sheet: false, screen: false,
  waiters: [], floats: [], parts: [], tapMark: null,
  cam: { x: 0, y: 0 }, camFocus: null, t: 0, waterFrame: 0, waterT: 0,
  hist: [], walkedTogether: 0, rainWalk: 0, compIdle: 0, compSettled: false, compRepath: 0,
  lastPlace: null, pending: null, keys: {}, ctxAction: null, ctxT: 0, saveT: 0, togetherAcc: 0,
  fishing: null, started: false, working: null, lastStageShown: 1,
};
const paused = () => G.dialog || G.sheet || G.screen;

/* ---------------- 상태 ---------------- */
function newDaily() { return { talk: 0, greet: false, gift: false, date: false, sit: {}, fish: false, autoGreet: false, favor: false, hug: false, togetherAff: 0, visit: false, halmeoni: false }; }
function newState(name, job, hair) {
  const st = JOBS[job].start;
  return {
    v: 1, name, job, hair, day: 1, min: 8 * 60, weather: 'sunny', money: 10000, jobLv: 1, jobExp: 0, works: 0,
    inv: { coffee: 1, tangerine: 1 }, p: { x: st[0], y: st[1] }, d: { x: 20.5, y: 17.5, vis: true },
    comp: false, hold: false, arm: false, speed: 1,
    rel: { aff: 0, stage: 1, together: 0, gifts: 0, dates: 0, dateLog: [], giftLog: [], flags: {}, talkIdx: {}, guide: {}, favor: null, confessDay: -9, daily: newDaily() },
    album: [], spots: {},
  };
}
function save() {
  if (!S || !G.started) return;
  S.p = { x: G.player.x, y: G.player.y };
  S.d = { x: G.det.x, y: G.det.y, vis: G.det.visible };
  S.savedAt = Date.now();
  for (let i = 0; i < 6; i++) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; }
    catch (e) { const k = S.album.findIndex(a => a.img); if (k < 0) return false; S.album[k].img = null; }
  }
  return false;
}
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.v === 1 && JOBS[s.job] ? s : null; } catch (e) { return null; } }

/* ---------------- 캐릭터 ---------------- */
class Actor {
  constructor(id, look, outfit) {
    Object.assign(this, { id, look, outfit, x: 0, y: 0, path: [], speed: 2.5, speedMul: 1, face: 'f', left: false, anim: 0, moving: false, pose: 'stand', visible: true, bubble: null, blinkT: rand(1, 4), blink: false, seat: null, emote: null, onArrive: null });
  }
  walkTo(tx, ty, opts) { const p = findPath(this.x, this.y, tx, ty, opts); if (p) { this.path = p; return true; } return false; }
  stop() { this.path = []; this.moving = false; }
  faceTo(dx, dy) { const sx = dx - dy, sy = dx + dy; if (Math.abs(sx) > 0.02) this.left = sx < 0; if (Math.abs(sy) > 0.02) this.face = sy >= 0 ? 'f' : 'b'; }
  lookAt(a) { this.faceTo(a.x - this.x, a.y - this.y); }
  update(dt) {
    this.blinkT -= dt; if (this.blinkT < 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.13 : rand(2, 5); }
    if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; }
    if (this.emote) { this.emote.t -= dt; if (this.emote.t <= 0) this.emote = null; }
    if (this.path.length) {
      const [nx, ny] = this.path[0], dx = nx - this.x, dy = ny - this.y, d = Math.hypot(dx, dy);
      const step = this.speed * this.speedMul * dt;
      if (d <= step) { this.x = nx; this.y = ny; this.path.shift(); } else { this.x += dx / d * step; this.y += dy / d * step; }
      if (d > 0.001) this.faceTo(dx, dy);
      this.moving = true; this.anim += dt * 7.5 * Math.min(1.4, this.speedMul);
      if (!this.path.length) { this.moving = false; const f = this.onArrive; this.onArrive = null; if (f) f(); }
    } else { this.moving = false; this.anim = 0; }
  }
  frame() { return this.moving ? Math.floor(this.anim) % 4 : 0; }
  say(text, t = 3.2) { this.bubble = { text, t }; }
  emo(icon, t = 1.6) { this.emote = { icon, t }; }
  sitAt(benchKey, idx) {
    const s = BENCHES[benchKey].seats[idx];
    this.stop(); this.seat = { bench: benchKey, idx }; this.x = s[0] + 0.5; this.y = s[1] + 0.5; this.pose = 'sit'; this.face = 'f'; this.left = true;
  }
  standUp() {
    if (!this.seat) return; const s = BENCHES[this.seat.bench].stand[this.seat.idx];
    this.x = s[0] + 0.5; this.y = s[1] + 0.5; this.seat = null; this.pose = 'stand';
  }
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function nearestWalkable(x, y) {
  const fx = Math.floor(x), fy = Math.floor(y);
  if (walkable(fx, fy)) return [x, y];
  for (let r = 1; r <= 4; r++) for (let yy = fy - r; yy <= fy + r; yy++) for (let xx = fx - r; xx <= fx + r; xx++) if (walkable(xx, yy)) return [xx + 0.5, yy + 0.5];
  return [x, y];
}

/* ---------------- 렌더러 ---------------- */
const R = { scale: 2, lw: 200, lh: 400, low: null, l: null, view: null, v: null, dpr: 1, ground: [], gOX: MAP * 16, gOY: 0, shadow: null, glow: null };

function buildGround() {
  const W = MAP * 32 + 32, H = MAP * 16 + 40;
  const tileCache = {};
  const tile = (type, v, f) => { const k = type + v + '_' + f; return tileCache[k] || (tileCache[k] = makeTile(type, v, f)); };
  R.ground = [];
  for (let f = 0; f < 3; f++) {
    const c = mkCanvas(W, H), g = c.getContext('2d');
    // 물 먼저
    for (let s = 0; s <= 2 * MAP; s++) for (let x = 0; x < MAP; x++) {
      const y = s - x; if (y < 0 || y >= MAP) continue;
      const t = tileAt(x, y); if (t !== T.WATER && t !== T.WOOD) continue;
      const [sx, sy] = iso(x, y);
      g.drawImage(tile('water', Math.floor(hash2(x, y, 1) * 4), f), sx - 16 + R.gOX, sy + R.gOY);
      // 해안 거품
      const landN = (xx, yy) => { const tt = tileAt(xx, yy); return tt !== T.WATER && tt !== T.WOOD; };
      g.fillStyle = 'rgba(255,255,255,0.75)';
      if (landN(x - 1, y)) for (let X = 0; X < 16; X++) if ((X + f * 3) % 5 < 3) g.fillRect(sx - 16 + R.gOX + X, sy + R.gOY + 8 - Math.floor(X / 2) + 1, 1, 1);
      if (landN(x, y - 1)) for (let X = 16; X < 32; X++) if ((X + f * 3) % 5 < 3) g.fillRect(sx - 16 + R.gOX + X, sy + R.gOY + Math.floor((X - 16) / 2) + 1, 1, 1);
    }
    // 땅
    for (let s = 0; s <= 2 * MAP; s++) for (let x = 0; x < MAP; x++) {
      const y = s - x; if (y < 0 || y >= MAP) continue;
      const t = tileAt(x, y); if (t === T.WATER) continue;
      const [sx, sy] = iso(x, y); const ox = sx - 16 + R.gOX, oy = sy + R.gOY;
      const v = Math.floor(hash2(x, y, 2) * 8);
      g.drawImage(tile(TILE_NAMES[t], v, 0), ox, oy);
      const edgeCol = t === T.WOOD ? '#6e4a30' : t === T.SAND || t === T.PATH ? '#cfae72' : '#9b7049';
      const edgeH = t === T.WOOD ? 3 : 5;
      const wat = (xx, yy) => tileAt(xx, yy) === T.WATER;
      if (wat(x + 1, y)) for (let X = 16; X < 32; X++) { const ye = 16 - Math.floor((X - 16) / 2); g.fillStyle = edgeCol; g.fillRect(ox + X, oy + ye - 1, 1, edgeH); g.fillStyle = shade(edgeCol, 0.8); g.fillRect(ox + X, oy + ye + edgeH - 2, 1, 1); }
      if (wat(x, y + 1)) for (let X = 0; X < 16; X++) { const ye = 8 + Math.floor(X / 2); g.fillStyle = shade(edgeCol, 1.1); g.fillRect(ox + X, oy + ye, 1, edgeH); g.fillStyle = shade(edgeCol, 0.8); g.fillRect(ox + X, oy + ye + edgeH - 1, 1, 1); }
      if (t === T.WOOD && (wat(x + 1, y + 1) || wat(x, y + 1))) { g.fillStyle = '#5a3a24'; g.fillRect(ox + 15, oy + 15, 2, 6); }
    }
    R.ground.push(c);
  }
  // 그림자 / 빛
  R.shadow = mkCanvas(14, 6); fillEllipse(R.shadow.getContext('2d'), 7, 3, 6, 2, 'rgba(30,40,30,0.28)');
  R.glow = mkCanvas(48, 32);
  { const g = R.glow.getContext('2d'); const gr = g.createRadialGradient(24, 16, 1, 24, 16, 22); gr.addColorStop(0, 'rgba(255,214,130,0.75)'); gr.addColorStop(1, 'rgba(255,214,130,0)'); g.setTransform(1, 0, 0, 0.66, 0, 5.4); g.fillStyle = gr; g.fillRect(0, 0, 48, 48); }
  for (const b of World.buildings) {
    b.sprD = makeBuilding(b, false); b.sprN = makeBuilding(b, true);
    b.key = b.x + b.w + b.y + b.h;
    const c = b.sprD.c, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    b.mask = new Uint8Array(c.width * c.height); for (let i = 0; i < b.mask.length; i++) b.mask[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  }
}

function resize() {
  const box = $('#game').getBoundingClientRect();
  R.dpr = Math.min(3, window.devicePixelRatio || 1);
  R.scale = Math.max(2, Math.round(box.width / 210));
  R.lw = Math.ceil(box.width / R.scale); R.lh = Math.ceil(box.height / R.scale);
  R.low.width = R.lw; R.low.height = R.lh;
  R.view.width = Math.round(box.width * R.dpr); R.view.height = Math.round(box.height * R.dpr);
  R.cssW = box.width; R.cssH = box.height;
}

function daylight(min) {
  const h = (min / 60) % 24;
  if (h >= 7 && h < 16.5) return { mul: null, night: 0 };
  if (h >= 16.5 && h < 18.3) { const k = (h - 16.5) / 1.8; return { mul: mixHex('#ffffff', '#ffc89a', k), night: 0 }; }
  if (h >= 18.3 && h < 19.6) { const k = (h - 18.3) / 1.3; return { mul: mixHex('#ffc89a', '#6a75b8', k), night: k }; }
  if (h >= 19.6 || h < 5.5) return { mul: '#5f6bb0', night: 1 };
  const k = (h - 5.5) / 1.5; return { mul: mixHex('#7e86c4', '#ffffff', k), night: 1 - k };
}
function mixHex(a, b, k) { const A = hexRgb(a), B = hexRgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')'; }

function render(dt) {
  const g = R.l, P = G.player;
  g.imageSmoothingEnabled = false;
  // 카메라
  let fx, fy;
  if (G.camFocus) { [fx, fy] = iso(G.camFocus.x, G.camFocus.y); }
  else { [fx, fy] = iso(P.x, P.y); }
  const tx = fx - R.lw / 2, ty = fy - 14 - R.lh * 0.5;
  if (G.camSnap) { G.cam.x = tx; G.cam.y = ty; G.camSnap = false; }
  else { const k = Math.min(1, dt * 5); G.cam.x += (tx - G.cam.x) * k; G.cam.y += (ty - G.cam.y) * k; }
  const cx = Math.round(G.cam.x), cy = Math.round(G.cam.y);
  R.cx = cx; R.cy = cy;

  g.fillStyle = '#53a6dc'; g.fillRect(0, 0, R.lw, R.lh);
  g.drawImage(R.ground[G.waterFrame], -cx - R.gOX, -cy - R.gOY);
  const night = S ? daylight(S.min) : { night: 0 };
  const isNight = night.night > 0.5;

  // 물 위 소품
  const objs = World.objects;
  for (const o of objs) if (o.water) { const [sx, sy] = iso(o.x + 0.5, o.y + 0.5); g.drawImage(o.spr.c, Math.round(sx - o.spr.ax - cx), Math.round(sy - o.spr.ay - cy + Math.sin(G.t * 1.5 + o.x) * 1)); }

  // 탭 표시
  if (G.tapMark && G.tapMark.t > 0) {
    const [sx, sy] = iso(G.tapMark.x, G.tapMark.y); const a = G.tapMark.t;
    g.globalAlpha = Math.min(1, a * 2); g.fillStyle = '#ffffff';
    const r = 8 + (1 - a) * 4;
    for (let i = -r; i <= r; i++) { const h = Math.round((r - Math.abs(i)) / 2); g.fillRect(Math.round(sx - cx + i * 1), Math.round(sy - cy - h), 1, 1); g.fillRect(Math.round(sx - cx + i), Math.round(sy - cy + h), 1, 1); }
    g.globalAlpha = 1;
  }

  // 그릴 목록 (깊이 정렬)
  const list = [];
  const inView = (sx, sy, m = 60) => sx - cx > -m && sx - cx < R.lw + m && sy - cy > -m - 60 && sy - cy < R.lh + m;
  const solids = [];
  for (const b of World.buildings) {
    const spr = isNight ? b.sprN : b.sprD;
    if (!inView(spr.x + spr.c.width / 2, spr.y + spr.c.height / 2, 140)) continue;
    list.push({ d: b.key, f: () => g.drawImage(spr.c, spr.x - cx, spr.y - cy) });
    solids.push({ x: b.x, y: b.y, w: b.w, h: b.h, key: b.key, sx0: iso(b.x, b.y + b.h)[0], sx1: iso(b.x + b.w, b.y)[0] });
  }
  for (const o of objs) {
    if (o.water) continue;
    const [sx, sy] = iso(o.x + 0.5, o.y + 0.5); if (!inView(sx, sy)) continue;
    const key = o.x + o.y + 2;
    list.push({ d: key, f: () => g.drawImage(o.spr.c, Math.round(sx - o.spr.ax - cx), Math.round(sy - o.spr.ay - cy)) });
    if (o.kind !== 'bench') solids.push({ x: o.x, y: o.y, w: 1, h: 1, key, sx0: sx - o.spr.ax, sx1: sx - o.spr.ax + o.spr.c.width });
    if (o.light && isNight) G._lights.push([sx, sy - 30]);
  }
  for (const a of G.actors) {
    if (!a.visible) continue;
    const [sx, sy] = iso(a.x, a.y); if (!inView(sx, sy)) continue;
    let d = a.x + a.y;
    if (a.seat) { const s = BENCHES[a.seat.bench].seats[a.seat.idx]; d = s[0] + s[1] + 2.05; }
    else for (const s of solids) {
      if (sx + 8 < s.sx0 || sx - 8 > s.sx1) continue;
      if (Math.abs(a.x - (s.x + s.w / 2)) > 6 || Math.abs(a.y - (s.y + s.h / 2)) > 6) continue;
      if (a.x >= s.x + s.w || a.y >= s.y + s.h) d = Math.max(d, s.key + 0.01);
    }
    list.push({ d, f: () => drawActor(g, a, sx - cx, sy - cy) });
  }
  list.sort((p, q) => p.d - q.d);
  for (const it of list) it.f();

  // 파티클 (하트, 반짝이)
  for (const p of G.parts) {
    const [sx, sy] = iso(p.x, p.y); const X = Math.round(sx - cx + p.ox), Y = Math.round(sy - cy - p.h);
    g.globalAlpha = Math.min(1, p.t * 2);
    if (p.kind === 'heart') { g.fillStyle = '#ff6f91'; g.fillRect(X - 2, Y, 2, 2); g.fillRect(X + 1, Y, 2, 2); g.fillRect(X - 2, Y + 1, 5, 2); g.fillRect(X - 1, Y + 3, 3, 1); g.fillRect(X, Y + 4, 1, 1); g.fillStyle = '#ffd0dc'; g.fillRect(X - 1, Y, 1, 1); }
    else if (p.kind === 'spark') { g.fillStyle = '#fff3a0'; g.fillRect(X, Y - 1, 1, 3); g.fillRect(X - 1, Y, 3, 1); }
    else if (p.kind === 'note') { g.fillStyle = '#6b8ff0'; g.fillRect(X, Y, 2, 2); g.fillRect(X + 1, Y - 4, 1, 4); g.fillRect(X + 2, Y - 4, 1, 1); }
    g.globalAlpha = 1;
  }

  // 날씨
  if (S && S.weather !== 'sunny') { g.globalCompositeOperation = 'multiply'; g.fillStyle = S.weather === 'rain' ? '#b9c0d2' : '#dde1ea'; g.fillRect(0, 0, R.lw, R.lh); g.globalCompositeOperation = 'source-over'; }
  // 낮/밤
  if (night.mul) { g.globalCompositeOperation = 'multiply'; g.fillStyle = night.mul; g.fillRect(0, 0, R.lw, R.lh); g.globalCompositeOperation = 'source-over'; }
  if (isNight || night.night > 0.2) {
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, night.night * 1.2);
    for (const [lx, ly] of G._lights) g.drawImage(R.glow, Math.round(lx - cx - 24), Math.round(ly - cy - 16));
    for (const b of World.buildings) { const [dx, dy] = iso(b.doorTile[0] + 0.5, b.doorTile[1]); g.drawImage(R.glow, Math.round(dx - cx - 24), Math.round(dy - cy - 22)); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // 등대 불빛
    const lh = World.buildings.find(b => b.id === 'lighthouse'); const [lx, ly] = iso(lh.x + 1, lh.y + 1);
    const ang = G.t * 0.9, ox = lx - cx, oy = ly - cy - 82;
    g.globalAlpha = 0.22 * night.night; g.fillStyle = '#fff4b0';
    g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(ang - 0.12) * 260, oy + Math.sin(ang - 0.12) * 130); g.lineTo(ox + Math.cos(ang + 0.12) * 260, oy + Math.sin(ang + 0.12) * 130); g.closePath(); g.fill();
    g.globalAlpha = 1;
  }
  G._lights = [];
  if (S && S.weather === 'rain') {
    g.fillStyle = 'rgba(220,235,255,0.7)';
    for (let i = 0; i < 70; i++) { const x = (hash2(i, 1) * R.lw + G.t * 40 * (0.5 + hash2(i, 2))) % R.lw, y = (hash2(i, 3) * R.lh + G.t * 220 * (0.7 + hash2(i, 4) * 0.5)) % R.lh; g.fillRect(Math.round(x), Math.round(y), 1, 4); }
  }

  // 고해상도 레이어
  const v = R.v, K = R.scale * R.dpr;
  v.imageSmoothingEnabled = false;
  v.drawImage(R.low, 0, 0, R.lw * K, R.lh * K);
  const W2D = (wx, wy) => [(wx - cx) * K, (wy - cy) * K];
  v.textAlign = 'center'; v.textBaseline = 'middle';
  // 건물 이름표
  v.font = `${10.5 * R.dpr}px Jua, 'Noto Sans KR', sans-serif`;
  if (G.started) for (const b of World.buildings) {
    const spr = b.sprD; const [X, Y] = W2D(spr.x + spr.c.width / 2, spr.y + (b.kind === 'lighthouse' ? 2 : 10));
    if (X < -100 || X > R.view.width + 100 || Y < -40 || Y > R.view.height + 40) continue;
    const name = b.id === 'home' && S && S.job === 'traveler' ? '게스트하우스 (숙소)' : b.name;
    pill(v, X, Y, name, 'rgba(255,253,246,0.88)', '#5b4450');
  }
  // 캐릭터 이름표 / 말풍선 / 이모트
  for (const a of G.actors) {
    if (!a.visible) continue;
    const [sx, sy] = iso(a.x, a.y); const headY = sy - (a.pose === 'sit' ? 38 : a.look.tall ? 36 : 33);
    const [X, Y] = W2D(sx, headY);
    if (a === G.det) {
      const cm = S && S.comp, tag = cm ? '♥ 파출소 형사님' : '파출소 형사님';
      v.font = `${9.5 * R.dpr}px Jua, sans-serif`; pill(v, X, Y - 4 * R.dpr, tag, cm ? 'rgba(255,111,145,0.92)' : 'rgba(46,61,102,0.88)', '#ffffff');
    } else if (a.isVillager && dist(a, P) < 4) {
      v.font = `${9 * R.dpr}px Jua, sans-serif`; pill(v, X, Y - 4 * R.dpr, a.look.name, 'rgba(255,255,255,0.85)', '#5b4450');
    }
    if (a.bubble) drawBubble(v, X, Y - 18 * R.dpr, a.bubble.text);
    if (a.emote) { v.font = `${15 * R.dpr}px sans-serif`; v.fillText(a.emote.icon, X + 14 * R.dpr, Y - 16 * R.dpr - Math.sin(G.t * 6) * 2 * R.dpr); }
  }
  // 떠오르는 글자
  for (const f of G.floats) {
    const [sx, sy] = iso(f.x, f.y); const [X, Y] = W2D(sx, sy - 40 - (1.6 - f.t) * 14);
    v.globalAlpha = Math.min(1, f.t * 2);
    v.font = `${13 * R.dpr}px Jua, sans-serif`; v.lineWidth = 4 * R.dpr; v.strokeStyle = '#3a2533'; v.strokeText(f.text, X, Y); v.fillStyle = f.color; v.fillText(f.text, X, Y);
    v.globalAlpha = 1;
  }
}
function pill(v, X, Y, text, bg, fg) {
  const w = v.measureText(text).width + 10 * R.dpr, h = 15 * R.dpr;
  v.fillStyle = bg; roundRect(v, X - w / 2, Y - h / 2, w, h, h / 2); v.fill();
  v.fillStyle = fg; v.fillText(text, X, Y + 0.5 * R.dpr);
}
function roundRect(v, x, y, w, h, r) { v.beginPath(); v.moveTo(x + r, y); v.arcTo(x + w, y, x + w, y + h, r); v.arcTo(x + w, y + h, x, y + h, r); v.arcTo(x, y + h, x, y, r); v.arcTo(x, y, x + w, y, r); v.closePath(); }
function drawBubble(v, X, Y, text) {
  v.font = `${11.5 * R.dpr}px Jua, sans-serif`;
  const maxW = 150 * R.dpr; const words = [...text]; const lines = []; let cur = '';
  for (const ch of words) { if (v.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch; }
  if (cur) lines.push(cur);
  const lh = 15 * R.dpr, w = Math.min(maxW, Math.max(...lines.map(l => v.measureText(l).width))) + 14 * R.dpr, h = lines.length * lh + 10 * R.dpr;
  const x = Math.max(4, Math.min(R.view.width - w - 4, X - w / 2)), y = Y - h;
  v.fillStyle = '#ffffff'; v.strokeStyle = '#3a2533'; v.lineWidth = 2 * R.dpr;
  roundRect(v, x, y, w, h, 8 * R.dpr); v.fill(); v.stroke();
  v.beginPath(); v.moveTo(X - 5 * R.dpr, y + h - 1); v.lineTo(X, y + h + 6 * R.dpr); v.lineTo(X + 5 * R.dpr, y + h - 1); v.fill(); v.stroke();
  v.fillStyle = '#ffffff'; v.fillRect(X - 4 * R.dpr, y + h - 3 * R.dpr, 8 * R.dpr, 3 * R.dpr);
  v.fillStyle = '#3a2533'; lines.forEach((l, i) => v.fillText(l, x + w / 2, y + 5 * R.dpr + lh * (i + 0.5)));
}
function drawActor(g, a, sx, sy) {
  if (!a.seat) g.drawImage(R.shadow, Math.round(sx - 7), Math.round(sy - 3));
  const spr = chibi(a.look, a.outfit, a.face, a.frame(), a.pose, a.blink);
  const X = Math.round(sx - 12), Y = Math.round(sy - 31 - (a.seat ? 4 : 0));
  if (a.left) { g.save(); g.translate(X + 24, Y); g.scale(-1, 1); g.drawImage(spr, 0, 0); g.restore(); }
  else g.drawImage(spr, X, Y);
  if (a.pose === 'fish') { // 낚싯대
    const dir = a.left ? -1 : 1, hx = X + 12 + dir * 6, hy = Y + 20;
    g.fillStyle = '#5a3a24'; for (let i = 0; i < 14; i++) g.fillRect(hx + dir * i, hy - Math.round(i * 0.9), 1, 1);
    const tipX = hx + dir * 14, tipY = hy - 13, bob = G.fishing && G.fishing.bite ? Math.sin(G.t * 30) * 2 : Math.sin(G.t * 2);
    g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 12; i++) g.fillRect(Math.round(tipX + dir * i * 0.6), tipY + i * 2, 1, 1);
    g.fillStyle = '#e3484a'; g.fillRect(Math.round(tipX + dir * 7), Math.round(tipY + 24 + bob), 2, 2);
  }
}

/* ---------------- 시간 · 하루 ---------------- */
function curPlace() { return placeAt(G.player.x, G.player.y); }
function advanceTime(mins) {
  const before = S.min; S.min += mins;
  if (S.comp) {
    S.rel.together += mins; G.togetherAcc += mins;
    if (G.togetherAcc >= 15) { G.togetherAcc -= 15; if (S.rel.daily.togetherAff < 10) { S.rel.daily.togetherAff++; addAff(1, true); } }
  }
  if (before < 22 * 60 && S.min >= 22 * 60 && S.comp) G.forceEndComp = true;
  if (S.min >= 24 * 60) G.dayOver = true;
}
async function endDay(forced) {
  G.busy++;
  if (forced) { await say('narr', '', S.comp ? '밤이 깊었다… 형사님이 집 앞까지 데려다주었다.' : '밤이 깊었다… 졸음이 쏟아진다.'); closeDialog(); }
  if (S.comp) endCompanion(true);
  await fade(true);
  S.day++; S.min = 7 * 60; G.dayOver = false;
  const r = Math.random(); S.weather = r < 0.18 ? 'rain' : r < 0.42 ? 'cloudy' : 'sunny';
  S.rel.daily = newDaily(); S.spots = {};
  if (S.rel.favor && S.day - S.rel.favor.day > 2) S.rel.favor = null;
  const home = BUILDINGS.find(b => b.id === 'home').doorTile;
  G.player.standUp(); G.player.stop(); G.player.x = home[0] + 0.5; G.player.y = home[1] + 0.5; G.player.pose = 'stand';
  G.det.state = 'sched'; G.det.task = null; G.det.visible = false; G.det.pose = 'stand'; G.det.seat = null;
  const dh = BUILDINGS.find(b => b.id === 'detHouse').doorTile; G.det.x = dh[0] + 0.5; G.det.y = dh[1] + 0.5;
  G.camSnap = true;
  save();
  await sleep(300);
  await fade(false);
  G.busy--;
  toast(`☀ ${S.day}일째 아침 · ${({ sunny: '맑음', cloudy: '흐림', rain: '비' })[S.weather]}`);
  if (S.weather === 'rain') toast('비가 와요. 형사님과 우산을 같이 쓸 수 있을지도…');
}

/* ---------------- 호감도 · 관계 ---------------- */
function addAff(n, quiet) {
  if (!n) return;
  S.rel.aff = Math.max(0, S.rel.aff + n);
  if (!quiet || n > 0) floatText(G.det, (n > 0 ? '♥+' : '♥') + n, '#ff9ab5');
  if (n >= 3) burst(G.det, 'heart', Math.min(6, n));
  updateHUD();
  checkStage();
}
function stageReady(n) {
  const st = STAGES[n - 1]; if (!st || !st.need || st.need.soon) return false;
  const nd = st.need, r = S.rel;
  if (nd.aff && r.aff < nd.aff) return false;
  if (nd.together && r.together < nd.together) return false;
  for (const f of (nd.flags || [])) if (!r.flags[f]) return false;
  return true;
}
function checkStage() {
  let up = false;
  while (S.rel.stage < 6 && stageReady(S.rel.stage + 1)) { S.rel.stage++; up = true; }
  if (up) { G.stageUpPending = true; updateHUD(); save(); }
}
function stageName(n = S.rel.stage) { return STAGES[n - 1].name; }

/* ---------------- 이펙트 ---------------- */
function floatText(a, text, color = '#ffe37a') { G.floats.push({ x: a.x, y: a.y, text, color, t: 1.6 }); }
function burst(a, kind, n = 5) { for (let i = 0; i < n; i++) G.parts.push({ kind, x: a.x, y: a.y, ox: rand(-8, 8), h: rand(26, 34), vh: rand(10, 20), t: rand(0.9, 1.5) }); }
function toast(text) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
  $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100);
}
function fade(out) { const f = $('#fade'); f.classList.toggle('on', out); return sleep(420); }
function waitUntil(cond, timeout = 15) { return new Promise(res => G.waiters.push({ cond, res, t: timeout })); }

/* ---------------- 대화창 ---------------- */
const SPEAKERS = { det: () => ({ name: '파출소 형사님', look: LOOKS.det, outfit: G.det.outfit }), me: () => ({ name: S.name, look: G.player.look, outfit: 'base' }), halmeoni: () => ({ name: LOOKS.halmeoni.name, look: LOOKS.halmeoni, outfit: 'base' }), kid: () => ({ name: LOOKS.kid.name, look: LOOKS.kid, outfit: 'base' }), fisher: () => ({ name: LOOKS.fisher.name, look: LOOKS.fisher, outfit: 'base' }) };
const EXPR_EMOTE = { blush: '💗', surprise: '❗', laugh: '♪', sad: '💧', tease: '😏', smile: null };
let _dlgResolve = null, _dlgTyping = null;
function say(who, expr, text) {
  return new Promise((res) => {
    G.dialog = true;
    const box = $('#dlg'); box.classList.remove('hidden'); $('#dlgChoices').innerHTML = '';
    const face = $('#dlgFace'), fg = face.getContext('2d');
    const sp = SPEAKERS[who] ? SPEAKERS[who]() : null;
    $('#dlgName').textContent = sp ? sp.name : '';
    box.classList.toggle('narr', !sp);
    fg.clearRect(0, 0, 32, 32);
    if (sp) fg.drawImage(drawPortrait(sp.look, sp.outfit, expr || 'normal'), 0, 0);
    if (who === 'det' && EXPR_EMOTE[expr]) G.det.emo(EXPR_EMOTE[expr]);
    if (who === 'det' && expr === 'blush') burst(G.det, 'heart', 3);
    const el = $('#dlgText'); el.textContent = ''; const full = text.replace(/\{name\}/g, S ? S.name : '');
    let i = 0; clearInterval(_dlgTyping);
    _dlgTyping = setInterval(() => { i++; el.textContent = full.slice(0, i); if (i >= full.length) { clearInterval(_dlgTyping); _dlgTyping = null; } }, 26);
    _dlgResolve = () => {
      if (_dlgTyping) { clearInterval(_dlgTyping); _dlgTyping = null; el.textContent = full; return; }
      _dlgResolve = null; res();
    };
  });
}
function choose(options) {
  return new Promise((res) => {
    const wrap = $('#dlgChoices'); wrap.innerHTML = '';
    $('#dlg').classList.add('choosing');
    if (_dlgTyping) { clearInterval(_dlgTyping); _dlgTyping = null; }
    options.forEach((o, i) => {
      const b = document.createElement('button'); b.className = 'choice'; b.textContent = o;
      b.onclick = (e) => { e.stopPropagation(); wrap.innerHTML = ''; $('#dlg').classList.remove('choosing'); res(i); };
      wrap.appendChild(b);
    });
  });
}
function closeDialog() { $('#dlg').classList.add('hidden'); G.dialog = false; }
async function talk(lines, who = 'det') { for (const [e, t] of lines) await say(who, e, t); }
async function topic(tp, who = 'det') {
  await talk(tp.t, who);
  const i = await choose(tp.c.map(c => c[0]));
  const [, aff, reply, ex] = tp.c[i];
  await say(who, ex, reply);
  if (who === 'det') addAff(aff);
  return i;
}

/* ---------------- 시트 메뉴 ---------------- */
function openSheet({ title, sub, items, cols = 3, onClose }) {
  G.sheet = true;
  $('#sheetTitle').textContent = title; $('#sheetSub').innerHTML = sub || '';
  const body = $('#sheetBody'); body.innerHTML = ''; body.style.setProperty('--cols', cols);
  for (const it of items) {
    const b = document.createElement('button'); b.className = 'sitem' + (it.locked ? ' locked' : '') + (it.disabled ? ' disabled' : '') + (it.wide ? ' wide' : '');
    b.innerHTML = `<span class="si-icon">${it.locked ? '🔒' : it.icon || ''}</span><span class="si-label">${it.label}</span>${it.note ? `<span class="si-note">${it.note}</span>` : ''}`;
    b.onclick = () => {
      if (it.locked || it.disabled) { if (it.why) toast(it.why); return; }
      if (!it.keep) closeSheet();
      if (it.onClick) it.onClick();
    };
    body.appendChild(b);
  }
  $('#sheet').classList.remove('hidden');
  G._sheetClose = onClose;
}
function closeSheet() { $('#sheet').classList.add('hidden'); G.sheet = false; const f = G._sheetClose; G._sheetClose = null; if (f) f(); }

/* ---------------- 형사님 AI ---------------- */
const PATROL = [[20.5, 18.5], [17.5, 12.5], [21.5, 10.5], [14.5, 10.5], [12.5, 17.5], [11.5, 22.5], [17.5, 24.5], [21.5, 24.5], [23.5, 26.5], [17.5, 17.5], [27.5, 17.5]];
const PIER_PATROL = [[31.5, 17.5], [34.5, 17.5], [35.5, 18.5], [30.5, 18.5]];
const STROLL = [[17.5, 27.5], [21.5, 28.5], [25.5, 28.5], [17.5, 17.5], [14.5, 27.5], [28.5, 21.5]];
function detPlan(min) {
  if (S.day === 1 && !S.rel.flags.met && min >= 8 * 60 + 3 && min < 13 * 60) return { k: 'meet', duty: true };
  if (min < 7 * 60 || min >= 22 * 60) return { k: 'home', duty: false };
  if (min < 8.5 * 60) return { k: 'station', duty: true };
  if (min < 12 * 60) return { k: 'patrol', duty: true };
  if (min < 13 * 60) return { k: 'lunch', duty: true };
  if (min < 15 * 60) return { k: 'station', duty: true };
  if (min < 17 * 60) return { k: 'pier', duty: true };
  if (min < 19.5 * 60) return { k: 'stroll', duty: false };
  if (min < 21.5 * 60) return { k: 'fishing', duty: false };
  return { k: 'goHome', duty: false };
}
const TASK_LABEL = { meet: '누군가를 찾는 중', home: '집에서 쉬는 중', station: '파출소 근무 중', patrol: '마을 순찰 중', lunch: '카페에서 점심', pier: '부두 순찰 중', stroll: '퇴근 후 해변 산책', fishing: '부두에서 낚시', goHome: '집에 가는 중' };
const DUTY_LINES = { station: ['오늘도 이상 무.', '하암… 평화롭다.', '게시판 정리 좀 해야겠다.'], patrol: ['순찰 중~', '까마귀 녀석, 또 귤밭에?', '오늘은 조용하네.'], pier: ['배 들어올 시간이네.', '물살이 좀 세다.'], stroll: ['퇴근이다~', '노을 좋다.'], fishing: ['…입질 왔나?', '오늘은 꼭 잡는다.'] };

function detUpdate(dt) {
  const d = G.det, P = G.player;
  const plan = detPlan(S.min);
  d.outfit = plan.duty || plan.k === 'home' && S.min < 12 * 60 ? 'work' : 'casual';
  if (plan.k === 'home' && S.min >= 12 * 60) d.outfit = 'casual';
  if (d.state === 'comp') { compUpdate(dt, plan); return; }
  if (d.state !== 'sched') return;
  if (d.talking) { d.stop(); d.lookAt(P); return; }

  if (d.task !== plan.k) {
    d.task = plan.k; d.stop(); d.wait = 0; d.sub = 0;
    if (d.seat) d.standUp();
    d.pose = 'stand';
    if (!d.visible && plan.k !== 'home') { const dh = BUILDINGS.find(b => b.id === 'detHouse').doorTile; d.x = dh[0] + 0.5; d.y = dh[1] + 0.5; d.visible = true; }
  }
  d.wait -= dt;
  const goto = (x, y) => { if (Math.hypot(d.x - x, d.y - y) > 0.3 && !d.path.length) d.walkTo(x, y); };

  // 관계에 따른 자율 행동: 먼저 다가와 인사
  if (S.rel.stage >= 3 && !plan.duty && !S.rel.daily.autoGreet && d.visible && plan.k !== 'home' && plan.k !== 'goHome' && dist(d, P) < 7 && !G.busy && !G.working && !P.seat) {
    S.rel.daily.autoGreet = true;
    runEvent(detApproach);
    return;
  }

  switch (plan.k) {
    case 'home': {
      const dh = BUILDINGS.find(b => b.id === 'detHouse').doorTile;
      if (d.visible) { if (Math.hypot(d.x - dh[0] - 0.5, d.y - dh[1] - 0.5) < 0.3) d.visible = false; else goto(dh[0] + 0.5, dh[1] + 0.5); }
      break;
    }
    case 'goHome': {
      const dh = BUILDINGS.find(b => b.id === 'detHouse').doorTile;
      if (Math.hypot(d.x - dh[0] - 0.5, d.y - dh[1] - 0.5) < 0.3) d.visible = false; else goto(dh[0] + 0.5, dh[1] + 0.5);
      break;
    }
    case 'meet': {
      d.speedMul = 1.1;
      if (d.wait <= 0) { d.wait = 1.2; if (dist(d, P) > 1.6) d.walkTo(P.x, P.y); else d.stop(); }
      break;
    }
    case 'station': {
      goto(20.5, 18.5);
      if (!d.path.length && d.wait <= 0) { d.wait = rand(3, 7); d.left = !d.left; if (Math.random() < 0.3) d.say(pick(DUTY_LINES.station), 2.5); }
      break;
    }
    case 'patrol': case 'pier': case 'stroll': {
      const route = plan.k === 'patrol' ? PATROL : plan.k === 'pier' ? PIER_PATROL : STROLL;
      d.speedMul = plan.k === 'stroll' ? 0.75 : 0.9;
      if (!d.path.length && d.wait <= 0) {
        if (d.sub > 0 && Math.random() < 0.25) d.say(pick(DUTY_LINES[plan.k]), 2.5);
        const wp = route[d.sub % route.length]; d.sub++;
        d.walkTo(wp[0], wp[1]); d.wait = rand(1.5, 3.5);
      }
      break;
    }
    case 'lunch': {
      const bk = BENCHES.cafe;
      if (d.seat) break;
      const st = bk.stand[1];
      if (Math.hypot(d.x - st[0] - 0.5, d.y - st[1] - 0.5) < 0.3) { if (!(P.seat && P.seat.bench === 'cafe' && P.seat.idx === 1)) d.sitAt('cafe', 1); }
      else goto(st[0] + 0.5, st[1] + 0.5);
      break;
    }
    case 'fishing': {
      const fx = 36.5, fy = 17.5;
      if (Math.hypot(d.x - fx, d.y - fy) < 0.3) { d.pose = 'fish'; d.face = 'f'; d.left = false; if (d.wait <= 0) { d.wait = rand(6, 12); if (Math.random() < 0.3) d.say(pick(DUTY_LINES.fishing), 2.5); } }
      else { d.pose = 'stand'; goto(fx, fy); }
      break;
    }
  }
}

/* 동행 이동 */
function startCompanion(opts = {}) {
  const d = G.det;
  S.comp = true; d.state = 'comp'; d.talking = false; if (d.seat) d.standUp(); d.pose = 'stand'; d.visible = true;
  G.hist = []; G.walkedTogether = 0; G.rainWalk = 0; G.compSettled = false; G.compIdle = 0;
  G.compDutyUntil = opts.dutyUntil || null;
  updateHUD();
}
function endCompanion(silent) {
  const d = G.det;
  S.comp = false; S.hold = false; S.arm = false; d.state = 'sched'; d.task = null; d.speedMul = 1;
  if (d.seat) d.standUp(); d.pose = 'stand';
  if (!silent) toast('형사님과의 동행이 끝났어요');
  updateHUD();
}
function trailPoint(gap) {
  const P = G.player; let acc = 0, prev = [P.x, P.y];
  for (const h of G.hist) { acc += Math.hypot(h[0] - prev[0], h[1] - prev[1]); if (acc >= gap) return h; prev = h; }
  return G.hist.length ? G.hist[G.hist.length - 1] : null;
}
function compUpdate(dt, plan) {
  const d = G.det, P = G.player;
  if (d.scripted) return;
  const dd = dist(d, P);
  if (dd > 9) { // 너무 멀면 근처로 순간이동 (장면 전환 후 등)
    const n = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1]].map(([a, b]) => [Math.floor(P.x) + a, Math.floor(P.y) + b]).find(([x, y]) => walkable(x, y));
    if (n) { d.x = n[0] + 0.5; d.y = n[1] + 0.5; d.stop(); }
    return;
  }
  if (P.seat || d.seat) return;
  const close = S.hold || S.arm;
  const gap = close ? 0.75 : 1.15;
  if (P.moving) {
    G.compSettled = false; G.compIdle = 0;
    const tgt = trailPoint(gap);
    if (tgt) {
      const td = Math.hypot(tgt[0] - d.x, tgt[1] - d.y);
      G.compRepath -= dt;
      if (td > 2.6) { if (G.compRepath <= 0) { G.compRepath = 0.5; d.walkTo(tgt[0], tgt[1]); } }
      else if (dd > gap * 0.9) d.path = [tgt];
      else d.stop();
    }
    d.speedMul = dd > 2.4 ? 1.45 : dd < gap ? 0.7 : 1.05;
  } else {
    d.speedMul = 1;
    if (!G.compSettled) {
      G.compSettled = true;
      // 플레이어 옆자리 (바라보는 방향의 수직)
      const fv = P.face === 'f' ? (P.left ? [0, 1] : [1, 0]) : (P.left ? [-1, 0] : [0, -1]);
      const sides = [[fv[1], fv[0]], [-fv[1], -fv[0]], [-fv[0], -fv[1]], [fv[0], fv[1]]];
      const px = Math.floor(P.x), py = Math.floor(P.y);
      const opts = sides.map(([a, b]) => [px + a, py + b]).filter(([x, y]) => walkable(x, y));
      opts.sort((p, q) => Math.hypot(p[0] + 0.5 - d.x, p[1] + 0.5 - d.y) - Math.hypot(q[0] + 0.5 - d.x, q[1] + 0.5 - d.y));
      if (opts.length) { const [x, y] = opts[0]; d.walkTo(x + 0.5, y + 0.5); d.onArrive = () => { d.face = P.face; d.left = P.left; }; }
    }
    if (!d.moving) {
      G.compIdle += dt;
      if (G.compIdle > 7 && Math.floor(G.compIdle) % 4 === 0 && Math.floor(G.compIdle - dt) % 4 !== 0) { if (Math.random() < 0.5) d.left = !d.left; else d.lookAt(P); }
      if (G.compIdle > 11 && !d.bubble && Math.random() < dt * 0.09) {
        const pl = curPlace(); const pool = [...IDLE[Math.min(5, S.rel.stage)], ...(PLACE_IDLE[pl] || [])];
        d.lookAt(P); d.say(pick(pool), 3.2);
      }
    }
  }
  // 근무 중 동행 시간 제한
  if (G.compDutyUntil && S.min > G.compDutyUntil && !G.busy) {
    G.compDutyUntil = null;
    runEvent(async () => { await say('det', 'sad', '아, 슬슬 파출소 들어가 봐야겠어요. 무전이 와서.'); await say('det', 'smile', '퇴근하고 또 같이 걸어요. 약속.'); closeDialog(); endCompanion(); });
  }
}

/* ---------------- 주민 ---------------- */
function villagerUpdate(a, dt) {
  const V = VILLAGERS[a.vid];
  if (a.talking) { a.stop(); a.lookAt(G.player); return; }
  if (V.hours) { const on = S.min >= V.hours[0] && S.min < V.hours[1]; if (!on) { a.visible = false; return; } a.visible = true; }
  if (S.min >= 21 * 60 || S.min < 7 * 60) { a.visible = false; return; } else if (!V.hours) a.visible = true;
  a.wait = (a.wait || 0) - dt;
  if (!a.path.length && a.wait <= 0) { const sp = pick(V.spots); a.walkTo(sp[0], sp[1]); a.wait = rand(4, 9); }
}

/* ---------------- 입력 ---------------- */
function screenToWorld(px, py) {
  const wx = px / R.scale + R.cx, wy = py / R.scale + R.cy;
  return { wx, wy, tx: (wx / 16 + wy / 8) / 2, ty: (wy / 8 - wx / 16) / 2 };
}
function onTap(px, py) {
  if (G.fishing) { fishTap(); return; }
  if (!G.started || paused() || G.busy || G.working) return;
  const { wx, wy, tx, ty } = screenToWorld(px, py);
  const P = G.player;
  // 캐릭터
  let best = null, bd = 1e9;
  for (const a of G.actors) {
    if (a === P || !a.visible) continue;
    const [sx, sy] = iso(a.x, a.y);
    if (wx > sx - 11 && wx < sx + 11 && wy > sy - 34 && wy < sy + 4) { const dd = Math.hypot(wx - sx, wy - sy + 14); if (dd < bd) { bd = dd; best = a; } }
  }
  if (P.seat) { standUpPlayer(); if (!best) return; }
  if (best) { approach(best); return; }
  // 건물
  for (const b of World.buildings) {
    const s = b.sprD, lx = Math.floor(wx - s.x), ly = Math.floor(wy - s.y);
    if (lx >= 0 && ly >= 0 && lx < s.c.width && ly < s.c.height && b.mask[ly * s.c.width + lx]) {
      const [dx, dy] = b.doorTile; walkPlayer(dx + 0.5, dy + 0.5, () => openBuilding(b)); return;
    }
  }
  // 벤치
  const ix = Math.floor(tx), iy = Math.floor(ty);
  for (const [k, bk] of Object.entries(BENCHES)) {
    const si = bk.seats.findIndex(s => s[0] === ix && s[1] === iy);
    if (si >= 0) { const st = bk.stand[si]; walkPlayer(st[0] + 0.5, st[1] + 0.5, () => benchAction(k)); return; }
  }
  walkPlayer(tx, ty);
}
function walkPlayer(x, y, onArrive) {
  const P = G.player; G.pending = null;
  if (P.seat) standUpPlayer();
  if (P.walkTo(x, y)) {
    const last = P.path.length ? P.path[P.path.length - 1] : [P.x, P.y];
    G.tapMark = { x: last[0], y: last[1], t: 1 };
    P.onArrive = onArrive || null;
    if (!P.path.length && onArrive) { P.onArrive = null; onArrive(); }
  }
}
function approach(a) {
  const P = G.player;
  if (dist(a, P) < 1.7) { interactWith(a); return; }
  G.pending = { a, t: 0, tries: 0 };
  P.walkTo(a.x, a.y, { allow: (x, y) => x === Math.floor(a.x) && y === Math.floor(a.y) });
  // 마지막 칸(상대가 있는 칸)은 빼고 옆에 선다
  if (P.path.length) P.path.pop();
}
function pendingUpdate(dt) {
  const pd = G.pending; if (!pd) return;
  const P = G.player;
  if (!pd.a.visible) { G.pending = null; return; }
  if (dist(pd.a, P) < 1.7) { G.pending = null; P.stop(); interactWith(pd.a); return; }
  pd.t -= dt;
  if (!P.path.length && pd.t <= 0) { pd.t = 0.6; pd.tries++; if (pd.tries > 6) { G.pending = null; return; } P.walkTo(pd.a.x, pd.a.y); if (P.path.length) P.path.pop(); }
}
function keyMove(dt) {
  const k = G.keys; let mx = 0, my = 0;
  if (k.ArrowUp || k.w) { mx -= 1; my -= 1; } if (k.ArrowDown || k.s) { mx += 1; my += 1; }
  if (k.ArrowLeft || k.a) { mx -= 1; my += 1; } if (k.ArrowRight || k.d) { mx += 1; my -= 1; }
  if (!mx && !my) return false;
  const P = G.player; if (P.seat) standUpPlayer();
  P.path = []; G.pending = null;
  const l = Math.hypot(mx, my); mx /= l; my /= l;
  const sp = P.speed * dt;
  const ok = (x, y) => walkable(Math.floor(x + 0.25), Math.floor(y + 0.25)) && walkable(Math.floor(x - 0.25), Math.floor(y - 0.25)) && walkable(Math.floor(x + 0.25), Math.floor(y - 0.25)) && walkable(Math.floor(x - 0.25), Math.floor(y + 0.25));
  if (ok(P.x + mx * sp, P.y)) P.x += mx * sp;
  if (ok(P.x, P.y + my * sp)) P.y += my * sp;
  P.faceTo(mx, my); P.moving = true; P.anim += dt * 7.5;
  return true;
}

/* ---------------- 상호작용 ---------------- */
function interactWith(a) {
  if (a === G.det) { detMenu(); return; }
  if (a.isVillager) runEvent(() => villagerTalk(a));
}
async function villagerTalk(a) {
  a.talking = true; a.stop(); a.lookAt(G.player); G.player.lookAt(a);
  const V = VILLAGERS[a.vid];
  await say(a.vid, 'smile', pick(V.lines));
  if (a.vid === 'halmeoni' && !S.rel.daily.halmeoni) {
    S.rel.daily.halmeoni = true; S.inv.tangerine = (S.inv.tangerine || 0) + 1;
    await say(a.vid, 'smile', '옜다, 귤 하나 줄게. 형사 양반 주든가~ 호호.'); toast('🍊 해월도 귤을 받았다');
  }
  closeDialog(); a.talking = false;
}

function detMenu() {
  const d = G.det, P = G.player;
  if (!S.rel.flags.met) { runEvent(firstMeeting); return; }
  d.talking = true; d.stop(); d.lookAt(P); P.lookAt(d);
  const st = S.rel.stage;
  const items = INTERACTIONS.map(it => {
    const o = { icon: it.icon, label: it.label };
    if (it.id === 'follow' && S.comp) { o.label = '동행 종료'; o.icon = '👋'; }
    if (it.id === 'hand' && S.hold) o.label = '손 놓기';
    if (it.id === 'arm' && S.arm) o.label = '팔짱 풀기';
    if (st < it.stage) { o.locked = true; o.note = it.stage === 6 ? '다음 업데이트' : `${it.stage}단계 ${STAGES[it.stage - 1].name}`; o.why = `「${STAGES[it.stage - 1].name}」 단계에서 열려요`; }
    else if (it.maxStage && st > it.maxStage) { o.disabled = true; o.note = '완료'; }
    else if (it.id === 'confess' && S.rel.flags.lovers) { o.disabled = true; o.note = '완료'; }
    else if (it.companion && !S.comp) { o.disabled = true; o.note = '동행 중 가능'; o.why = '먼저 「함께 다니기」를 해 보세요'; }
    o.onClick = () => doInteraction(it.id);
    return o;
  });
  openSheet({ title: '파출소 형사님', sub: relSummaryHTML(), items, cols: 3, onClose: () => { if (!G.busy) d.talking = false; } });
}
function relSummaryHTML() {
  const r = S.rel, next = STAGES[r.stage];
  let need = '';
  if (next && next.need && !next.need.soon) need = `다음: ${next.name} · ♥ ${r.aff}/${next.need.aff}`;
  else if (next) need = '다음 단계는 업데이트 예정';
  const pct = next && next.need && next.need.aff ? Math.min(100, r.aff / next.need.aff * 100) : 100;
  return `<div class="relline"><b>${r.stage}단계 · ${stageName()}</b><span>${TASK_LABEL[G.det.task] || ''}${S.comp ? ' · 동행 중' : ''}</span></div><div class="bar"><i style="width:${pct}%"></i></div><div class="relneed">${need}</div>`;
}

async function doInteraction(id) {
  runEvent(async () => {
    const d = G.det, r = S.rel, st = r.stage;
    d.talking = true;
    switch (id) {
      case 'greet': {
        const tod = S.min < 11 * 60 ? 'morning' : S.min < 17 * 60 ? 'day' : 'evening';
        d.emo('👋');
        await say('det', st >= 4 ? 'blush' : 'smile', pick(GREETS[tod][Math.min(5, st)]));
        if (!r.daily.greet) { r.daily.greet = true; addAff(1); } else await say('det', 'laugh', '또 인사해요? 하하, 좋아요. 안녕하세요~');
        break;
      }
      case 'talk': await dailyTalk(); break;
      case 'follow': if (S.comp) { await say('det', 'smile', st >= 4 ? '벌써요? …아쉽다. 조심히 가요.' : '네, 오늘 즐거웠어요. 또 불러요.'); closeDialog(); endCompanion(); } else await requestFollow(); break;
      case 'favor': await favor(); break;
      case 'gift': closeDialog(); d.talking = false; G.busy--; giftMenu(); G.busy++; return;
      case 'photo': await takePhoto(); break;
      case 'sit': closeDialog(); d.talking = false; G.busy--; await sitTogether(); G.busy++; return;
      case 'fish': closeDialog(); d.talking = false; G.busy--; await fishTogether(); G.busy++; return;
      case 'arm':
        S.arm = !S.arm; if (S.arm) S.hold = false;
        if (S.arm) { await say('det', 'blush', r.flags.arm ? '…이제 이거 자연스럽네요, 우리.' : '…이거 반칙인데요. 좋아서 하는 말이에요.'); r.flags.arm = true; burst(d, 'heart', 4); }
        else await say('det', 'tease', '벌써 놔요? 아쉽다.');
        break;
      case 'hand':
        S.hold = !S.hold; if (S.hold) S.arm = false;
        if (S.hold) {
          if (!r.flags.hand) { await say('det', 'surprise', '……'); await say('det', 'blush', '손, 따뜻하네요. 이제 놓으라고 해도 안 놓을 거예요.'); r.flags.hand = true; await addAlbum('처음 손잡은 날', 'hand'); addAff(3); }
          else await say('det', 'smile', pick(['손 차갑다. 제 주머니에 넣을래요?', '이렇게 걸으면 길이 더 짧아져요.', '꼭 잡아요. 섬 바람 세니까.']));
          burst(d, 'heart', 4);
        } else await say('det', 'tease', '놓는 거예요? 다시 잡을 거죠?');
        break;
      case 'hug':
        burst(d, 'heart', 8); burst(G.player, 'heart', 4);
        await say('det', 'surprise', '어…'); await say('det', 'blush', pick(['…심장 소리 들리죠? 모른 척해 줘요.', '이대로 5분만. 아니, 10분.', '오늘 하루 피로가 다 풀리네요.']));
        if (!r.daily.hug) { r.daily.hug = true; addAff(2); }
        break;
      case 'pat':
        d.emo('💗');
        await say('det', 'blush', pick(['제가 해야 하는 거 아니에요? …뭐, 좋네요.', '형사 머리 쓰다듬는 사람은 당신이 처음이에요.', '…한 번 더 해 줘요.']));
        break;
      case 'date': closeDialog(); d.talking = false; G.busy--; dateMenu(); G.busy++; return;
      case 'confess': await playerConfess(); break;
    }
    closeDialog(); d.talking = false;
  });
}

async function dailyTalk() {
  const r = S.rel, st = Math.min(5, r.stage);
  if (r.daily.talk >= 2) {
    if (r.daily.talk === 2) await say('det', 'laugh', '오늘 말 많이 하네요? 좋아요, 저 수다 좋아해요.');
    await say('det', 'smile', pick(SMALLTALK[st]));
    r.daily.talk++; return;
  }
  const pool = TALKS[st] || [], idx = r.talkIdx[st] || 0;
  if (idx < pool.length) {
    const tp = pool[idx].job ? JOB_TALK[S.job] : pool[idx];
    await topic(tp);
    r.talkIdx[st] = idx + 1;
  } else {
    await say('det', 'smile', pick(SMALLTALK[st])); addAff(1);
  }
  r.daily.talk++;
}

async function requestFollow() {
  const plan = detPlan(S.min), st = S.rel.stage;
  if (plan.k === 'home' || plan.k === 'goHome' || S.min >= 21.7 * 60) {
    await say('det', 'smile', '오늘은 너무 늦었어요. 집까지 조심히 가요. 내일 같이 걸어요.'); return;
  }
  if (plan.duty && st < 2) { await say('det', 'normal', '아, 지금 근무 중이라서요. 퇴근하면… 오후 5시쯤이면 괜찮아요.'); return; }
  if (plan.duty) {
    await say('det', 'tease', '순찰 중인데… 같이 걸을래요? 순찰 보조 요원으로 임명합니다.');
    await say('det', 'normal', '대신 한 시간 반 정도만이에요. 무전 오면 가 봐야 해서.');
    startCompanion({ dutyUntil: S.min + 90 });
  } else {
    await say('det', st >= 4 ? 'blush' : 'smile', st === 1 ? '좋죠. 해월도 처음이면 제가 마을 안내해 드릴게요. 따라와요… 아니, 앞장서요. 제가 따라갈게요.' : st >= 4 ? '기다렸어요. 어디든 가요.' : '좋아요. 어디 갈까요? 당신이 앞장서요.');
    startCompanion();
  }
  toast('👣 형사님이 함께 다녀요 — 왼쪽 위 아이콘으로 메뉴를 열 수 있어요');
}

async function favor() {
  const r = S.rel;
  if (r.favor) {
    const F = FAVORS[r.favor.i];
    if ((S.inv[F.item] || 0) > 0) {
      S.inv[F.item]--; await say('det', 'smile', F.thanks);
      S.money += ITEMS[F.item].price + 500; floatText(G.player, '+' + fmtMoney(ITEMS[F.item].price + 500));
      r.favor = null; r.daily.favor = true; addAff(5); updateHUD();
    } else await say('det', 'normal', `${ITEMS[F.item].icon} ${ITEMS[F.item].name}, 기억하죠? 마을 슈퍼에 있어요. 천천히 해도 돼요.`);
    return;
  }
  if (r.daily.favor) { await say('det', 'tease', '오늘은 부탁할 거 없어요. 당신 얼굴 본 걸로 충분해요.'); return; }
  const i = Math.floor(Math.random() * FAVORS.length);
  await say('det', 'normal', FAVORS[i].ask);
  const c = await choose(['맡겨 주세요', '다음에요']);
  if (c === 0) { r.favor = { i, day: S.day }; await say('det', 'smile', '고마워요. 역시 믿을 사람은 당신뿐.'); toast(`📝 부탁: ${ITEMS[FAVORS[i].item].name} 전해 주기`); }
  else await say('det', 'smile', '네, 괜찮아요. 바쁜데 미안해요.');
}

function giftMenu() {
  const d = G.det; d.talking = true;
  const items = Object.entries(S.inv).filter(([k, n]) => n > 0 && ITEMS[k]).map(([k, n]) => {
    const it = ITEMS[k], lock = it.minStage && S.rel.stage < it.minStage;
    return { icon: it.icon, label: it.name, note: lock ? '아직 이른 선물' : `${n}개`, disabled: lock, why: '조금 더 가까워진 뒤에 주면 좋을 것 같아요', onClick: () => runEvent(() => giveGift(k)) };
  });
  if (!items.length) { toast('줄 수 있는 물건이 없어요. 마을 슈퍼에 가 보세요'); d.talking = false; return; }
  openSheet({ title: '선물하기', sub: '<div class="relneed">형사님 취향: 따뜻한 캔커피 · 도시락 · 직접 딴 해산물 <br>하루에 한 번 마음을 전할 수 있어요</div>', items, cols: 3, onClose: () => { if (!G.busy) d.talking = false; } });
}
async function giveGift(k) {
  const d = G.det, r = S.rel, it = ITEMS[k];
  d.talking = true;
  if (r.daily.gift) { await say('det', 'smile', '오늘은 벌써 받았는데요. 그건 내일 줘요, 기다릴게요.'); closeDialog(); d.talking = false; return; }
  S.inv[k]--; r.daily.gift = true; r.gifts++; r.giftLog.unshift({ k, day: S.day }); r.giftLog = r.giftLog.slice(0, 30);
  if (r.favor && FAVORS[r.favor.i].item === k) { await say('det', 'surprise', '어, 이거 제가 부탁한 거!'); r.favor = null; r.daily.favor = true; addAff(3); }
  await say('det', it.react[1], it.react[0]);
  addAff(it.gift);
  if (!r.flags.firstGift) { r.flags.firstGift = true; await addAlbum('첫 선물', 'gift'); }
  closeDialog(); d.talking = false;
}

/* ---------------- 이벤트 실행 ---------------- */
async function runEvent(fn) {
  G.busy++; G.player.stop(); G.pending = null;
  try { await fn(); } catch (e) { console.error(e); }
  finally {
    closeDialog(); G.busy = Math.max(0, G.busy - 1);
    if (G.det.state === 'script') G.det.state = S.comp ? 'comp' : 'sched';
    G.det.talking = false; G.det.scripted = false; G.camFocus = null;
    save(); updateHUD();
    if (G.stageUpPending && !G.busy) showStageUp();
  }
}
function scriptDet() { if (G.det.state !== 'comp') G.det.state = 'script'; G.det.scripted = true; G.det.stop(); }

async function firstMeeting() {
  const d = G.det, P = G.player; scriptDet();
  d.lookAt(P); P.lookAt(d); d.emo('❗');
  const job = S.job;
  const H = G.villagers.find(v => v.vid === 'halmeoni');
  if (job === 'doctor') {
    const n = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([a, b]) => [Math.floor(d.x) + a, Math.floor(d.y) + b]).find(([x, y]) => walkable(x, y) && !(x === Math.floor(P.x) && y === Math.floor(P.y)));
    if (n && H) { H.x = n[0] + 0.5; H.y = n[1] + 0.5; H.visible = true; H.stop(); H.talking = true; H.lookAt(P); }
    await say('narr', '', '보건지소 문이 벌컥 열렸다.');
    await say('det', 'serious', '실례합니다! 여기 의사 선생님…');
    await say('det', 'surprise', '아, 새로 오신 선생님이구나. 순덕 할머니가 귤밭에서 넘어지셔서요.');
    await say('halmeoni', 'smile', '아이고, 별것도 아닌디 이 양반이 업고 뛰어왔어.');
    await say('narr', '', '할머니 무릎을 소독하고 밴드를 붙였다.');
    await topic({ t: [], c: [['다행히 가벼운 찰과상이에요', 3, '다행이다… 제가 더 놀랐네요. 하하.', 'smile'], ['형사님 이마에도 땀이…', 4, '아, 이건… 할머니가 생각보다 무거우셔서. 쉿.', 'blush'], ['다음부터 조심하세요', 2, '네, 할머니. 들으셨죠? …저한테 하신 말이에요?', 'laugh']] });
    if (H) H.talking = false;
  } else if (job === 'teacher') {
    await say('narr', '', '학교 앞. 아이들이 "경찰 아저씨!" 하며 누군가를 둘러싸고 있다.');
    await say('det', 'laugh', '얘들아, 아저씨 말고 형사님. 몇 번을 말해.');
    await say('det', 'surprise', '아, 새로 오신 선생님? 등굣길 안전 순찰 중이었어요.');
    await topic({ t: [], c: [['아이들이 형사님을 좋아하네요', 3, '저보다는 제 호루라기를 좋아하죠.', 'tease'], ['안전 순찰 감사합니다', 2, '선생님도 아이들 길 건널 때 같이 봐 줘요. 우리 둘이 하면 철통보안.', 'smile'], ['아저씨 맞는데요?', 3, '…방금 상처받았어요. 진짜로.', 'laugh']] });
    await say('det', 'smile', '운동회 때 제가 줄다리기 심판 보기로 했어요. 그때 또 봐요.');
  } else if (job === 'traveler') {
    await say('narr', '', '배에서 내리자마자 바닷바람에 지도가 날아갔다…');
    await say('det', 'surprise', '어이쿠, 잡았다! 이거 찾으세요?');
    await say('det', 'smile', '해월도 처음이죠? 짐 보면 알아요. 형사의 감.');
    await topic({ t: [], c: [['길을 잃었어요', 3, '섬에서 길 잃기가 더 어려운데. 그래도 제가 안내해 드릴게요.', 'tease'], ['지도 고마워요', 2, '지도보다 제가 더 정확해요. 필요하면 파출소로 와요.', 'smile'], ['형사님이세요?', 2, '네, 해월도 파출소 형사. 섬에 형사가 저 하나라 그냥 "형사님"이에요.', 'laugh']] });
    await say('det', 'normal', '숙소는 저 아래 분홍 지붕 집이에요. 섬 구경 같이 하고 싶으면 말 걸어요.');
  } else if (job === 'cafe') {
    await say('narr', '', '개업 첫날. 딸랑, 첫 손님이 들어왔다.');
    await say('det', 'smile', '여기 문 연 거죠? 아메리카노 하나요. 따뜻한 걸로.');
    await say('det', 'tease', '개업 첫 손님이 경찰이면 장사 잘된대요. 방금 제가 지어낸 말이지만.');
    await topic({ t: [], c: [['첫 손님이니까 서비스예요', 4, '…이러면 매일 오게 되잖아요.', 'blush'], ['4,500원입니다', 2, '하하, 원칙주의 사장님. 좋아요, 단골 하겠습니다.', 'laugh'], ['지어낸 말이요?', 3, '형사의 직감은 잘 맞아요. 두고 봐요.', 'tease']] });
    S.money += 4500; floatText(P, '+4,500원');
  } else {
    await say('narr', '', '불턱 앞. 물질 준비를 하는데 누군가 다가왔다.');
    await say('det', 'serious', '오늘 오후에 너울 온대요. 물질 나가시면 일찍 들어오세요.');
    await say('det', 'smile', '…아, 새로 오신 분이구나. 순덕 할머니가 막내 해녀 들어왔다고 자랑하시더니.');
    await topic({ t: [], c: [['걱정해 주셔서 고마워요', 3, '해안 안전이 제 담당이라서요. …그런 걸로 해 두죠.', 'tease'], ['바다는 제가 더 잘 알걸요?', 3, '하하, 맞는 말이에요. 그럼 바다는 당신이, 육지는 제가.', 'laugh'], ['네, 조심할게요', 1, '착하다. 아, 실례. 반말 아니고 감탄이에요.', 'smile']] });
  }
  await say('det', 'normal', '인사가 늦었네요. 해월도 파출소 형사예요. 다들 그냥 "형사님"이라고 불러요.');
  const nm = await choose([`저는 ${S.name}이에요`, '잘 부탁드려요, 형사님']);
  await say('det', 'tease', nm === 0 ? `${S.name}. 좋은 이름이다. 수첩에 적어 둘게요. 중요 인물로.` : '저야말로요. 앞으로 자주 보겠네요. 이 섬, 좁거든요.');
  S.rel.flags.met = true; addAff(5);
  await addAlbum('첫 만남', 'meet');
  await say('narr', '', '💡 형사님을 눌러 대화하고, 「함께 다니기」로 같이 마을을 걸어 보세요.');
}

async function detApproach() {
  const d = G.det, P = G.player; scriptDet();
  d.walkTo(P.x, P.y); if (d.path.length) d.path.pop();
  d.say('어, {name}!'.replace('{name}', S.name), 2);
  await waitUntil(() => !d.path.length, 8);
  d.lookAt(P); P.lookAt(d);
  const st = S.rel.stage;
  await say('det', st >= 4 ? 'blush' : 'smile', st >= 5 ? '찾았다. 보고 싶어서 일부러 이쪽으로 왔어요.' : st >= 4 ? '저기서부터 보였어요. 그래서… 왔어요.' : '멀리서 보여서 왔어요. 오늘 어땠어요?');
  addAff(1);
  if (st >= 4 && (S.day % 2 === 0)) {
    const k = pick(['tangerine', 'coffee']);
    await say('det', 'tease', `이거, 지나가다 생각나서요. ${ITEMS[k].icon}`);
    S.inv[k] = (S.inv[k] || 0) + 1; toast(`${ITEMS[k].icon} 형사님에게 ${ITEMS[k].name}을(를) 받았다`);
  }
  if (st >= 3 && !S.comp && detPlan(S.min).k !== 'goHome') {
    await say('det', st >= 5 ? 'smile' : 'normal', st >= 5 ? '오늘 저녁, 같이 있을래요?' : '시간 있으면 좀 걸을래요?');
    const c = await choose(['좋아요', '오늘은 바빠요']);
    if (c === 0) { await say('det', 'smile', '좋다. 앞장서요.'); startCompanion(); }
    else await say('det', 'smile', '아쉽다. 그럼 내일요.');
  }
}

async function firstWalkEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P); P.lookAt(d);
  await say('det', 'smile', '…같이 걸으니까 길이 짧네요.');
  await say('det', 'tease', '아니, 해월도가 원래 작긴 한데. 오늘은 유난히.');
  await topic({ t: [], c: [['저도 그렇게 느꼈어요', 5, '그쵸? 저만 그런 거 아니죠?', 'blush'], ['형사님 걸음이 빨라서요', 2, '아, 미안해요. 천천히 맞출게요. 당신 보폭으로.', 'laugh'], ['한 바퀴 더 돌까요?', 4, '좋아요. 순찰 핑계 대고 두 바퀴도 가능.', 'smile']] });
  await say('det', 'normal', '앞으로도 자주 걸어요. 이건 공식 제안이에요.');
  S.rel.flags.firstWalk = true; await addAlbum('첫 산책', 'walk'); checkStage();
}
async function pierWaitEvent() {
  scriptDet(); const d = G.det, P = G.player; d.pose = 'stand'; d.lookAt(P); P.lookAt(d);
  await say('det', 'surprise', '왔어요? 기다렸… 아니, 낚시하고 있었어요. 낚시.');
  await say('det', 'tease', '오늘 한 마리도 못 잡은 건, 당신 기다리느라 집중을 못 해서예요.');
  await topic({ t: [], c: [['기다린 거 맞죠?', 4, '…네. 기다렸어요. 됐어요?', 'blush'], ['물고기 탓 아니고요?', 2, '물고기들도 당신 기다렸나 봐요. 지금 막 입질 온다.', 'laugh']] });
  S.rel.flags.pierWait = true; await addAlbum('부두에서 기다려 준 사람', 'pier');
  d.task = null;
}
async function nightEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P); P.lookAt(d);
  await say('det', 'surprise', '어? 이 시간에 혼자 다니면 위험해요.');
  await say('det', 'smile', '…라고 형사로서 말하고, 개인적으로는 만나서 반가워요.');
  const i = await topic({ t: [], c: [['데려다 줄래요?', 4, '당연하죠. 야간 순찰 코스 변경. 당신 집 경유.', 'smile'], ['형사님 보러 나왔어요', 5, '…그런 말은 밤에 하면 더 반칙이에요.', 'blush'], ['산책 중이었어요', 2, '그럼 같이 해요. 밤바다 소리 좋거든요.', 'normal']] });
  S.rel.flags.night = true; await addAlbum('야간 순찰 중 우연히', 'night');
  if (i === 0) { const h = BUILDINGS.find(b => b.id === 'home').doorTile; startCompanion(); closeDialog(); walkPlayer(h[0] + 0.5, h[1] + 0.5); }
}
async function rainEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P);
  await say('narr', '', '빗방울이 굵어졌다. 형사님이 우산을 펼쳐 내 쪽으로 기울였다.');
  await say('det', 'normal', '어깨 젖어요. 이쪽으로 더 와요.');
  await topic({ t: [], c: [['형사님 어깨 다 젖었어요', 4, '괜찮아요. 형사는 방수예요.', 'laugh'], ['(조금 더 가까이 간다)', 5, '…아, 네. 좋아요. 이 정도.', 'blush']] });
  S.rel.flags.rain = true; await addAlbum('우산 하나, 두 사람', 'rain');
}
async function confessionEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P); P.lookAt(d);
  await say('det', 'serious', '잠깐만요. 할 말이 있어요.');
  await say('det', 'normal', '처음엔 그냥, 새로 온 사람이니까 챙겨야지 했거든요.');
  await say('det', 'blush', '근데 언제부턴가 제 순찰 코스가 전부 당신 쪽으로 바뀌어 있더라고요.');
  await say('det', 'serious', '좋아해요. 장난 아니고, 진심으로.');
  await say('det', 'normal', '대답은 천천히 해도 돼요. 어떤 대답이든 괜찮아요.');
  const c = await choose(['저도 좋아해요', '조금만 더 생각해 볼게요', '지금처럼 지내고 싶어요']);
  if (c === 0) await becomeLovers(false);
  else if (c === 1) { S.rel.confessDay = S.day; await say('det', 'smile', '네. 기다리는 거 잘해요. 낚시꾼이잖아요.'); }
  else { S.rel.flags.declined = true; await say('det', 'sad', '…그래요. 말해 줘서 고마워요.'); await say('det', 'smile', '지금처럼, 좋은 사이로 있어요. 이것도 저는 좋아요.'); }
}
async function playerConfess() {
  if (S.rel.aff < 150) {
    await say('me', 'blush', '(형사님께 마음을 전하려다… 조금 더 가까워진 뒤에 말하기로 했다.)');
    await say('det', 'tease', '왜요? 할 말 있는 얼굴인데. …천천히 해요. 저 어디 안 가요.');
    return;
  }
  await say('me', 'blush', '형사님, 저… 형사님 좋아해요.');
  await say('det', 'surprise', '……네?');
  await say('det', 'blush', S.rel.flags.declined ? '다시 기회 주는 거예요? …고마워요. 저도요. 계속 좋아하고 있었어요.' : '아, 잠깐만. 그거 제가 먼저 하려고 했는데.');
  await becomeLovers(true);
}
async function becomeLovers(byPlayer) {
  const d = G.det;
  burst(d, 'heart', 10); burst(G.player, 'heart', 6);
  await say('det', 'blush', byPlayer ? '저도 좋아해요. 훨씬 전부터.' : '…진짜죠? 취소 안 돼요.');
  await say('det', 'laugh', '아, 큰일 났다. 저 지금 너무 좋아서 순찰 못 하겠어요.');
  S.rel.flags.lovers = true; S.rel.flags.declined = false; addAff(10);
  await addAlbum('우리, 오늘부터', 'confess');
  checkStage();
}

/* ---------------- 함께 앉기 · 낚시 · 사진 · 데이트 ---------------- */
function nearestBench(from) {
  let best = null, bd = 1e9;
  for (const [k, bk] of Object.entries(BENCHES)) { const s = bk.stand[0], dd = Math.hypot(s[0] + 0.5 - from.x, s[1] + 0.5 - from.y); if (dd < bd) { bd = dd; best = k; } }
  return [best, bd];
}
async function walkBothTo(pp, dp) {
  const P = G.player, d = G.det; d.scripted = true;
  P.walkTo(pp[0], pp[1]); d.walkTo(dp[0], dp[1]);
  await waitUntil(() => !P.path.length && !d.path.length, 25);
  if (Math.hypot(P.x - pp[0], P.y - pp[1]) > 0.5) { P.x = pp[0]; P.y = pp[1]; }
  if (Math.hypot(d.x - dp[0], d.y - dp[1]) > 0.5) { d.x = dp[0]; d.y = dp[1]; }
}
async function sitTogether(benchKey) {
  await runEvent(async () => {
    const P = G.player, d = G.det;
    const [k] = benchKey ? [benchKey] : nearestBench(P);
    const bk = BENCHES[k];
    scriptDet();
    if (dist(P, { x: bk.stand[0][0] + 0.5, y: bk.stand[0][1] + 0.5 }) > 1.2) toast(`🪑 ${bk.name}(으)로 같이 가요`);
    await walkBothTo([bk.stand[0][0] + 0.5, bk.stand[0][1] + 0.5], [bk.stand[1][0] + 0.5, bk.stand[1][1] + 0.5]);
    P.sitAt(k, 0); d.sitAt(k, 1);
    await sleep(500);
    const tier = S.rel.stage >= 5 ? 2 : S.rel.stage >= 3 ? 1 : 0;
    await talk(SIT_TALK[bk.place][tier]);
    if (!S.rel.flags.firstSit) {
      await say('det', 'normal', '이렇게 나란히 앉으니까 이상하게 말이 잘 안 나오네요.');
      await say('det', 'tease', '형사는 원래 마주 앉는 게 익숙해서요. 취조실에서.');
      await topic({ t: [], c: [['취조당하는 기분이에요?', 3, '아니요. 오히려 제가 자백할 것 같아서 문제예요.', 'laugh'], ['옆에 앉는 게 좋아요', 5, '…저도요. 같은 걸 보잖아요.', 'blush'], ['조용한 것도 좋네요', 3, '네. 이런 시간, 좋다.', 'smile']] });
      S.rel.flags.firstSit = true; await addAlbum('나란히 앉은 시간', 'sit');
    } else if (!S.rel.daily.sit[k]) addAff(3);
    S.rel.daily.sit[k] = true;
    advanceTime(20);
    if (S.rel.stage === 4 && confessReady()) { closeDialog(); await confessionEvent(); }
    closeDialog();
    toast('화면을 누르면 일어나요');
  });
}
function standUpPlayer() {
  const P = G.player, d = G.det;
  if (!P.seat) return;
  const bench = P.seat.bench; P.standUp();
  if (S.comp && d.seat && d.seat.bench === bench) { d.standUp(); G.compSettled = false; }
  else if (d.seat && d.seat.bench === bench && d.task === 'lunch') { /* 점심 중인 형사님은 계속 앉아 있음 */ }
}
async function benchAction(k) {
  const P = G.player, d = G.det;
  if (S.comp && S.rel.stage >= 2) { sitTogether(k); return; }
  const bk = BENCHES[k];
  const occupied = d.seat && d.seat.bench === k;
  P.sitAt(k, occupied && d.seat.idx === 0 ? 1 : 0);
  if (occupied && S.rel.flags.met && !S.rel.daily.sit[k]) {
    runEvent(async () => {
      d.talking = true;
      await say('det', 'surprise', '어? 옆자리 앉은 거예요?');
      await say('det', 'smile', S.rel.stage >= 2 ? '점심시간이라 다행이다. 같이 쉬어요.' : '하하, 여기 자리 좋죠. 점심 먹는 중이었어요.');
      S.rel.daily.sit[k] = true;
      if (!S.rel.flags.firstSit && S.rel.stage >= 2) { S.rel.flags.firstSit = true; addAff(4); await addAlbum('나란히 앉은 시간', 'sit'); }
      else addAff(2);
      d.talking = false;
    });
  } else toast(`🪑 ${bk.name}에 앉았다 — 화면을 누르면 일어나요`);
}

async function fishTogether() {
  await runEvent(async () => {
    const P = G.player, d = G.det; scriptDet();
    toast('🎣 낚시터로 이동해요');
    await walkBothTo([36.5, 17.5], [36.5, 16.5]);
    P.pose = 'fish'; d.pose = 'fish'; P.face = d.face = 'f'; P.left = d.left = false;
    await say('det', 'tease', '지는 사람이 내일 커피 사기. 콜?');
    closeDialog();
    const mine = await fishMinigame();
    const his = Math.random() < 0.6 ? Math.round(rand(14, 38)) : 0;
    P.pose = 'fish';
    if (mine) await say('narr', '', `🐟 ${mine}cm 전갱이를 낚았다!`); else await say('narr', '', '…놓쳐 버렸다.');
    await say('det', his ? 'smile' : 'sad', his ? `저는 ${his}cm. ` + (mine > his ? '…졌다. 커피는 제가 살게요.' : mine ? '이겼다! 내일 커피 기대할게요.' : '하하, 다음엔 미끼 제가 끼워 줄게요.') : '저는 꽝… 오늘은 물고기들이 당신 편이네.');
    if (mine && mine > his) burst(d, 'note', 3);
    if (!S.rel.daily.fish) { S.rel.daily.fish = true; addAff(3); }
    if (!S.rel.flags.fishDuel) { S.rel.flags.fishDuel = true; await addAlbum('낚시 대결', 'fish'); }
    P.pose = 'stand'; d.pose = 'stand';
  });
}
async function soloFish() {
  await runEvent(async () => {
    const P = G.player; P.pose = 'fish'; P.face = 'f'; P.left = false;
    const mine = await fishMinigame();
    if (mine) await say('narr', '', `🐟 ${mine}cm 전갱이를 낚았다!`); else await say('narr', '', '…놓쳐 버렸다.');
    P.pose = 'stand';
  });
}
function fishMinigame() {
  return new Promise(async (res) => {
    G.fishing = { bite: false, res, done: false };
    setAction({ label: '기다리는 중…', icon: '🎣' }, true);
    await sleep(rand(1800, 3800));
    if (!G.fishing) return;
    G.fishing.bite = true; G.player.emo('❗', 1.3);
    setAction({ label: '지금! 챔질!', icon: '❗', hot: true }, true);
    G.fishing.timer = setTimeout(() => endFish(false), 1600);
  });
}
function fishTap() { if (!G.fishing) return; if (G.fishing.bite) endFish(true); }
function endFish(ok) {
  const f = G.fishing; if (!f || f.done) return; f.done = true; clearTimeout(f.timer); G.fishing = null;
  setAction(null, true);
  const size = ok ? Math.round(rand(12, 42)) : 0;
  if (ok) { S.inv.fish = (S.inv.fish || 0) + 1; burst(G.player, 'spark', 5); }
  f.res(size);
}

async function takePhoto() {
  const d = G.det, P = G.player;
  scriptDet(); d.lookAt(P); d.face = 'f'; P.face = 'f';
  await say('det', 'smile', S.rel.stage >= 5 ? '더 가까이 와요. 화면에 안 들어와요. …핑계예요.' : '사진이요? 좋아요. 하나, 둘…');
  closeDialog();
  const fl = $('#flash'); fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 160);
  d.emo('✌'); P.emo('✌');
  await sleep(200);
  await addAlbum('함께 찍은 사진', 'photo');
  toast('📷 추억 앨범에 저장했어요');
}

function dateMenu() {
  const items = Object.entries(DATES).map(([k, D]) => ({ icon: D.icon, label: D.name, note: D.time && S.min < D.time ? `${fmtTime(D.time)}부터` : '', onClick: () => doDate(k) }));
  openSheet({ title: '데이트 장소', sub: '<div class="relneed">함께 갈 곳을 골라요. 하루 한 번 데이트에 특별한 추억이 남아요.</div>', items, cols: 2 });
}
async function doDate(k) {
  await runEvent(async () => {
    const D = DATES[k], P = G.player, d = G.det;
    if (S.min >= 23 * 60) { await say('det', 'smile', '오늘은 너무 늦었어요. 내일 꼭 가요. 약속.'); return; }
    if (D.time && S.min < D.time) { await say('det', 'tease', `${D.name}은(는) ${fmtTime(D.time)}쯤이 제일 좋아요. 그때까지 같이 있어요.`); S.min = D.time; }
    if (!S.comp) startCompanion();
    scriptDet();
    await fade(true);
    if (P.seat) P.standUp(); if (d.seat) d.standUp();
    P.stop(); d.stop();
    const [px, py] = nearestWalkable(D.pos[0], D.pos[1]); P.x = px; P.y = py;
    const n = [[1, 0], [0, 1], [-1, 0], [0, -1], [0, -1]].map(([a, b]) => [Math.floor(px) + a, Math.floor(py) + b]).find(([x, y]) => walkable(x, y)) || [Math.floor(px), Math.floor(py)];
    d.x = n[0] + 0.5; d.y = n[1] + 0.5;
    if (D.bench) { P.sitAt(D.bench, 0); d.sitAt(D.bench, 1); }
    else { d.lookAt(P); P.lookAt(d); }
    if (k === 'fishing') { P.pose = d.pose = 'fish'; P.face = d.face = 'f'; P.left = d.left = false; }
    if (k === 'beach' || S.hold) S.hold = true;
    G.camSnap = true;
    await sleep(250); await fade(false);
    await talk(D.lines);
    const c = await choose(D.c.map(x => x[0]));
    await say('det', 'smile', D.c[c][1]);
    burst(d, 'heart', 6);
    S.rel.dates++; S.rel.dateLog.unshift({ k, day: S.day }); S.rel.dateLog = S.rel.dateLog.slice(0, 30);
    if (!S.rel.daily.date) { S.rel.daily.date = true; addAff(6); await addAlbum(D.name + ' 데이트', 'date'); }
    if (!S.rel.flags.firstDate) { S.rel.flags.firstDate = true; await say('det', 'blush', '첫 데이트였네요, 오늘. 기억해 둘게요. 평생.'); }
    advanceTime(90);
    closeDialog();
    if (k === 'fishing') { P.pose = 'stand'; d.pose = 'stand'; }
  });
}

/* ---------------- 추억 앨범 ---------------- */
async function addAlbum(title, kind) {
  const P = G.player, d = G.det;
  const midX = d.visible ? (P.x + d.x) / 2 : P.x, midY = d.visible ? (P.y + d.y) / 2 : P.y;
  G.camFocus = { x: midX, y: midY }; G.camSnap = true;
  render(0.016);
  const [sx, sy] = iso(midX, midY);
  const W = 120, H = 90, c = mkCanvas(W, H);
  c.getContext('2d').drawImage(R.low, Math.round(sx - R.cx - W / 2), Math.round(sy - R.cy - 26 - H / 2), W, H, 0, 0, W, H);
  G.camFocus = null;
  let img = null; try { img = c.toDataURL('image/png'); } catch (e) { }
  const place = curPlace();
  S.album.unshift({ title, kind, day: S.day, time: fmtTime(S.min), place: place ? PLACES[place].name : '해월도', stage: S.rel.stage, img });
  const photos = S.album.filter(a => a.kind === 'photo');
  if (S.album.length > 36 && photos.length) S.album.splice(S.album.lastIndexOf(photos[photos.length - 1]), 1);
  S.album = S.album.slice(0, 40);
  if (kind !== 'photo') toast(`📔 추억 앨범: 「${title}」`);
  save();
}

/* ---------------- 이벤트 트리거 ---------------- */
function confessReady() {
  const r = S.rel;
  return r.stage === 4 && r.aff >= 150 && !r.flags.lovers && !r.flags.declined && S.day - r.confessDay >= 2 && S.min >= 17 * 60;
}
function checkEvents() {
  if (G.busy || paused() || G.working || G.fishing) return;
  const d = G.det, P = G.player, r = S.rel, pl = curPlace(), dd = dist(d, P);
  if (!d.visible) return;
  if (!r.flags.met && dd < 2.2) { runEvent(firstMeeting); return; }
  if (!r.flags.met) return;
  if (S.comp) {
    if (r.stage >= 2 && !r.flags.firstWalk && G.walkedTogether >= 25 && ['pier', 'beach', 'lighthouse', 'fishing', 'observatory'].includes(pl) && !P.moving) { runEvent(firstWalkEvent); return; }
    if (r.stage >= 3 && S.weather === 'rain' && !r.flags.rain && G.rainWalk >= 12) { runEvent(rainEvent); return; }
    if (confessReady() && ['lighthouse', 'pier', 'observatory', 'fishing', 'beach'].includes(pl) && !P.moving && dd < 2) { runEvent(confessionEvent); return; }
    if (r.stage === 1 && !P.moving && pl && GUIDE[pl] && !r.guide[pl] && dd < 3) {
      r.guide[pl] = true; d.lookAt(P); d.say(GUIDE[pl], 5); addAff(1, true); return;
    }
  } else {
    if (r.stage >= 3 && !r.flags.pierWait && d.task === 'fishing' && d.pose === 'fish' && dd < 2.5) { runEvent(pierWaitEvent); return; }
    if (r.stage >= 2 && !r.flags.night && S.min >= 21 * 60 && dd < 3) { runEvent(nightEvent); return; }
  }
  if (G.forceEndComp) {
    G.forceEndComp = false;
    if (S.comp) runEvent(async () => { await say('det', 'smile', '벌써 열 시네요. 오늘은 여기까지. 집에 들어가는 거 보고 갈게요.'); closeDialog(); endCompanion(true); });
  }
}

/* ---------------- 건물 · 직업 ---------------- */
function nearDoor(id, r = 1.4) { const b = BUILDINGS.find(x => x.id === id); return Math.hypot(G.player.x - b.doorTile[0] - 0.5, G.player.y - b.doorTile[1] - 0.5) <= r; }
function canWork() {
  const J = JOBS[S.job];
  if (S.job === 'traveler') { const pl = curPlace(); return pl && TRAVEL_SPOTS.includes(pl) && !S.spots[pl]; }
  return nearDoor(J.place);
}
function openBuilding(b) {
  const J = JOBS[S.job];
  if (J.place === b.id) { doWork(); return; }
  if (b.id === 'super') { shopMenu(); return; }
  if (b.id === 'home') { homeMenu(); return; }
  if (b.id === 'police') {
    const d = G.det;
    runEvent(async () => {
      if (d.visible && dist(d, G.player) < 4) { await say('narr', '', '형사님이 바로 앞에 있다.'); return; }
      await say('narr', '', `📋 파출소 게시판 — "형사 부재 중: ${TASK_LABEL[d.task] || '순찰 중'}"`);
      await say('narr', '', '오늘의 일과표: 07시 출근 · 08시반 마을 순찰 · 12시 카페 점심 · 15시 부두 순찰 · 17시 퇴근 후 산책 · 19시반 부두 낚시 · 22시 귀가');
    });
    return;
  }
  if (b.id === 'detHouse') { runEvent(async () => { await say('narr', '', S.rel.stage >= 5 ? '형사님 집이다. 창가에 내가 준 손수건이 걸려 있다…?' : '형사님 집이다. 문패에 작게 "해월도 파출소"라고 적혀 있다.'); }); return; }
  if (b.id === 'lighthouse') { runEvent(async () => { await say('narr', '', S.min >= 17 * 60 && S.min < 19.5 * 60 ? '노을이 바다를 주황빛으로 물들이고 있다.' : '하얀 등대. 저녁에 오면 노을이 예쁘다고 한다.'); }); return; }
  runEvent(async () => { await say('narr', '', `${b.name}. 지금은 들어갈 일이 없다.`); });
}
function doWork() {
  const J = JOBS[S.job];
  const end = S.job === 'cafe' ? 20 * 60 : S.job === 'traveler' ? 20 * 60 : 18.5 * 60;
  if (S.min < 7.5 * 60 || S.min >= end) { toast(`${J.act}은(는) ${fmtTime(end)} 전까지만 할 수 있어요`); return; }
  if (!canWork()) { toast(S.job === 'traveler' ? '이 장소는 오늘 이미 기록했어요. 다른 명소로 가 보세요' : `${J.act}는 일터 앞에서 할 수 있어요`); return; }
  const P = G.player; P.stop(); if (P.seat) P.standUp();
  G.working = { t: 0, dur: 2.2, mins: 60 };
  setAction({ label: J.act + ' 중…', icon: J.icon }, true);
}
function workUpdate(dt) {
  const w = G.working; if (!w) return;
  const step = Math.min(dt, w.dur - w.t); w.t += step;
  advanceTime(w.mins * step / w.dur);
  if (Math.random() < dt * 6) burst(G.player, 'spark', 1);
  G.player.anim += dt * 8; G.player.moving = false;
  if (w.t >= w.dur) {
    G.working = null; setAction(null, true);
    const J = JOBS[S.job];
    const pay = Math.round(rand(J.pay[0], J.pay[1]) * (1 + (S.jobLv - 1) * 0.12) / 100) * 100;
    S.money += pay; S.works++; S.jobExp++;
    floatText(G.player, '+' + fmtMoney(pay), '#ffe37a');
    toast(`${J.icon} ${pick(J.work)}`);
    if (S.job === 'traveler') S.spots[curPlace()] = true;
    if (J.loot && Math.random() < 0.45) { S.inv[J.loot] = (S.inv[J.loot] || 0) + 1; toast(`${ITEMS[J.loot].icon} ${ITEMS[J.loot].name}을(를) 얻었다`); }
    if (S.jobExp >= S.jobLv * 4) { S.jobExp = 0; S.jobLv++; toast(`⭐ 직업 레벨 업! ${J.name} Lv.${S.jobLv}`); burst(G.player, 'spark', 10); }
    updateHUD();
    // 일하는 모습을 보러 온 형사님
    const d = G.det;
    if (S.rel.flags.met && S.rel.stage >= 2 && !S.comp && d.visible && !S.rel.daily.visit && Math.random() < 0.4 && detPlan(S.min).k !== 'goHome') {
      S.rel.daily.visit = true;
      runEvent(async () => {
        scriptDet(); const n = findPath(d.x, d.y, G.player.x, G.player.y);
        if (n && n.length > 1 && n.length < 40) { n.pop(); d.path = n; d.speedMul = 1.6; await waitUntil(() => !d.path.length, 10); } else { d.x = G.player.x + 1; d.y = G.player.y; if (!walkable(Math.floor(d.x), Math.floor(d.y))) d.y += 1; }
        d.speedMul = 1; d.lookAt(G.player); G.player.lookAt(d);
        const L = { doctor: '순찰 왔다가 들렀어요. 선생님 일하는 거 보니까 든든하네요.', teacher: '운동장 쪽 순찰하다가… 수업하는 목소리 들려서요. 잘 가르치네요.', traveler: '기록하는 거 구경했어요. 저도 한 줄 들어가면 좋겠다.', cafe: '아메리카노 하나요. 그리고… 일하는 모습 보러 왔어요. 둘 다 진짜예요.', haenyeo: '물질 끝났어요? 부두에서 계속 지켜봤어요. 안전 확인차. …반은.' };
        await say('det', S.rel.stage >= 4 ? 'blush' : 'smile', L[S.job]);
        addAff(2);
      });
    }
    save();
  }
}
function shopMenu() {
  const items = SHOP.map(k => { const it = ITEMS[k]; return { icon: it.icon, label: it.name, note: fmtMoney(it.price), keep: true, onClick: () => { if (S.money < it.price) { toast('돈이 부족해요'); return; } S.money -= it.price; S.inv[k] = (S.inv[k] || 0) + 1; toast(`${it.icon} ${it.name} 구입 (보유 ${S.inv[k]})`); updateHUD(); save(); } }; });
  for (const [k, price] of [['abalone', 5000], ['fish', 2000]]) if (S.inv[k] > 0) items.push({ icon: ITEMS[k].icon, label: ITEMS[k].name + ' 팔기', note: '+' + fmtMoney(price) + ` (${S.inv[k]}개)`, keep: true, onClick: () => { if (!(S.inv[k] > 0)) return; S.inv[k]--; S.money += price; toast(`${ITEMS[k].name}을(를) 팔았다`); updateHUD(); save(); } });
  openSheet({ title: '마을 슈퍼', sub: `<div class="relneed">보유 금액 ${fmtMoney(S.money)} · 형사님 선물이나 부탁 물건을 살 수 있어요</div>`, items, cols: 3 });
}
function homeMenu() {
  const late = S.min >= 18 * 60;
  openSheet({ title: S.job === 'traveler' ? '게스트하우스' : '내 집', sub: `<div class="relneed">${S.day}일째 · ${fmtTime(S.min)}</div>`, cols: 2, items: [
    { icon: '🛏', label: '잠자기', note: late ? '다음 날 아침으로' : '18:00부터', disabled: !late, why: '아직 이른 시간이에요. 저녁 6시부터 잘 수 있어요', onClick: () => endDay(false) },
    { icon: '☕', label: '한숨 돌리기', note: '1시간 휴식', onClick: () => { advanceTime(60); toast('차 한 잔 마시며 쉬었다'); } },
    { icon: '📔', label: '추억 앨범', onClick: () => openRel('album') },
    { icon: '🏠', label: '형사님 초대하기', locked: S.rel.stage < 6, note: '다음 업데이트', why: '「깊어진 연인」 단계 콘텐츠는 다음 업데이트에 추가돼요' },
  ] });
}

/* ---------------- 상황별 행동 버튼 ---------------- */
function computeAction() {
  const P = G.player, d = G.det;
  if (G.working || G.fishing) return G.ctxAction;
  if (P.seat) return { label: '일어나기', icon: '🧍', fn: standUpPlayer };
  if (d.visible && dist(d, P) < 1.9) return { label: S.rel.flags.met ? '형사님' : '말 걸기', icon: '💬', fn: () => interactWith(d), hot: !S.rel.flags.met };
  const J = JOBS[S.job];
  if (canWork()) return { label: J.act, icon: J.icon, fn: doWork, hot: true };
  for (const v of G.villagers) if (v.visible && dist(v, P) < 1.7) return { label: '말 걸기', icon: '💬', fn: () => interactWith(v) };
  if (curPlace() === 'fishing' && P.x > 35.9) return { label: S.comp && S.rel.stage >= 3 ? '함께 낚시' : '낚시하기', icon: '🎣', fn: () => (S.comp && S.rel.stage >= 3 ? fishTogether() : soloFish()) };
  for (const [k, bk] of Object.entries(BENCHES)) for (const s of bk.stand) if (Math.hypot(P.x - s[0] - 0.5, P.y - s[1] - 0.5) < 0.9) return { label: S.comp && S.rel.stage >= 2 ? '함께 앉기' : '앉기', icon: '🪑', fn: () => benchAction(k) };
  for (const b of World.buildings) if (Math.hypot(P.x - b.doorTile[0] - 0.5, P.y - b.doorTile[1] - 0.5) < 1.1) {
    const lab = { super: '가게', home: '집', police: '게시판', lighthouse: '등대', detHouse: '형사님 집' }[b.id] || b.name;
    return { label: lab, icon: { super: '🛒', home: '🏠', police: '📋', lighthouse: '🗼' }[b.id] || '🚪', fn: () => openBuilding(b) };
  }
  return null;
}
function setAction(a, lock) {
  if (lock) G.ctxLock = !!a;
  G.ctxAction = a;
  const btn = $('#actBtn');
  if (!a) { btn.classList.add('hidden'); return; }
  btn.classList.remove('hidden'); btn.classList.toggle('hot', !!a.hot);
  btn.innerHTML = `<span>${a.icon}</span><b>${a.label}</b>`;
}

/* ---------------- HUD ---------------- */
function updateHUD() {
  if (!S) return;
  $('#hDay').textContent = `${S.day}일째 (${DOW[(S.day - 1) % 7]})`;
  $('#hTime').textContent = fmtTime(S.min);
  $('#hWeather').textContent = ({ sunny: S.min >= 19.6 * 60 || S.min < 6 * 60 ? '🌙' : '☀️', cloudy: '☁️', rain: '🌧️' })[S.weather];
  $('#hMoney').textContent = fmtMoney(S.money);
  $('#hSpeed').textContent = '⏩' + S.speed + 'x';
  const r = S.rel, next = STAGES[r.stage];
  $('#relStage').textContent = stageName();
  $('#relBar').style.width = (next && next.need && next.need.aff ? Math.min(100, r.aff / next.need.aff * 100) : 100) + '%';
  $('#compIcon').classList.toggle('hidden', !S.comp);
  if (S.comp && G._compFace !== G.det.outfit + S.rel.stage) {
    G._compFace = G.det.outfit + S.rel.stage; const cf = $('#compFace').getContext('2d'); cf.clearRect(0, 0, 32, 32);
    cf.drawImage(drawPortrait(LOOKS.det, G.det.outfit, S.rel.stage >= 4 ? 'blush' : 'smile'), 0, 0);
  }
  $('#compState').textContent = S.hold ? '손잡고 걷는 중' : S.arm ? '팔짱 끼고 걷는 중' : '동행 중';
  const pl = curPlace(); $('#hPlace').textContent = pl ? PLACES[pl].name : '해월도';
}
function compMenu() {
  if (!S.comp || G.busy) return;
  const st = S.rel.stage, d = G.det;
  const L = (s) => st < s ? { locked: true, note: `${s}단계 ${STAGES[s - 1].name}`, why: `「${STAGES[s - 1].name}」 단계에서 열려요` } : {};
  openSheet({ title: '동행 중', sub: relSummaryHTML(), cols: 2, items: [
    { icon: '💬', label: '대화하기', onClick: () => doInteraction('talk') },
    { icon: '🌿', label: '함께 활동하기', onClick: activityMenu },
    Object.assign({ icon: '💗', label: '데이트하기', onClick: dateMenu }, L(5)),
    Object.assign({ icon: '📷', label: '사진 찍기', onClick: () => doInteraction('photo') }, L(3)),
    { icon: '👋', label: '동행 종료', onClick: () => doInteraction('follow'), wide: true },
  ] });
}
function activityMenu() {
  const st = S.rel.stage;
  const L = (s) => st < s ? { locked: true, note: `${s}단계`, why: `「${STAGES[s - 1].name}」 단계에서 열려요` } : {};
  const go = (x, y, msg) => () => { walkPlayer(x, y); if (msg) toast(msg); };
  openSheet({ title: '함께 활동하기', cols: 3, items: [
    Object.assign({ icon: '🪑', label: '함께 앉기', note: '가까운 벤치', onClick: () => sitTogether() }, L(2)),
    Object.assign({ icon: '🎣', label: '낚시하기', note: '부두 끝', onClick: () => fishTogether() }, L(3)),
    { icon: '🐚', label: '해변 산책', onClick: go(19.5, 28.5, '🐚 해안 산책로로 걸어가요') },
    { icon: '🗼', label: '등대 구경', onClick: go(25.5, 28.5, '🗼 등대로 걸어가요') },
    { icon: '☕', label: '카페 방문', onClick: go(12.5, 18.5, '☕ 카페 쉼터로 걸어가요') },
    { icon: '⚓', label: '부두 가기', onClick: go(32.5, 17.5, '⚓ 해월도 부두로 걸어가요') },
    { icon: '⭐', label: '전망대', onClick: go(7.5, 7.5, '⭐ 언덕 전망대로 걸어가요') },
    Object.assign({ icon: '💞', label: S.arm ? '팔짱 풀기' : '팔짱 끼기', onClick: () => doInteraction('arm') }, L(4)),
    Object.assign({ icon: '🤝', label: S.hold ? '손 놓기' : '손잡기', onClick: () => doInteraction('hand') }, L(5)),
    Object.assign({ icon: '🫂', label: '안아주기', onClick: () => doInteraction('hug') }, L(5)),
    Object.assign({ icon: '✋', label: '머리 쓰다듬기', onClick: () => doInteraction('pat') }, L(5)),
  ] });
}

/* ---------------- 관계 화면 ---------------- */
function openRel(tab = 'profile') {
  G.screen = true; $('#rel').classList.remove('hidden');
  const r = S.rel;
  const face = $('#relFace').getContext('2d'); face.clearRect(0, 0, 32, 32);
  face.drawImage(drawPortrait(LOOKS.det, G.det.outfit, r.stage >= 4 ? 'blush' : r.stage >= 2 ? 'smile' : 'normal'), 0, 0);
  $('#relTitle').textContent = `${r.stage}단계 · ${stageName()}`;
  const next = STAGES[r.stage];
  let reqHTML = '';
  if (next && next.need && !next.need.soon) {
    const nd = next.need, rows = [];
    rows.push([`호감도 ${r.aff} / ${nd.aff}`, r.aff >= nd.aff]);
    if (nd.together) rows.push([`함께 보낸 시간 ${Math.floor(r.together)} / ${nd.together}분`, r.together >= nd.together]);
    for (const f of nd.flags || []) rows.push([FLAG_LABELS[f] + (f === 'lovers' ? (r.flags.declined ? ' (마음 전하기로 다시 시도)' : ' (호감도 150 · 저녁 · 바닷가 · 동행 중)') : ''), !!r.flags[f]]);
    reqHTML = `<h4>다음 단계: ${next.name}</h4><ul class="req">${rows.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${t}</li>`).join('')}</ul>`;
  } else reqHTML = `<h4>다음 단계: 깊어진 연인</h4><p class="muted">기념일 · 특별한 약속 · 동거 콘텐츠는 다음 업데이트에서 열려요.</p>`;
  const plan = detPlan(S.min);
  $('#tab-profile').innerHTML = `
    <div class="stages">${STAGES.map(s => `<div class="stg ${s.n <= r.stage ? 'on' : ''} ${s.n === r.stage ? 'cur' : ''}"><b>${s.n}</b><span>${s.name}</span></div>`).join('')}</div>
    <div class="bar big"><i style="width:${next && next.need && next.need.aff ? Math.min(100, r.aff / next.need.aff * 100) : 100}%"></i></div>
    ${reqHTML}
    <div class="stats">
      <div><b>${r.aff}</b><span>호감도</span></div>
      <div><b>${Math.floor(r.together / 60)}시간 ${Math.floor(r.together % 60)}분</b><span>함께 보낸 시간</span></div>
      <div><b>${r.gifts}</b><span>받은 선물</span></div>
      <div><b>${r.dates}</b><span>데이트</span></div>
    </div>
    <h4>프로필</h4>
    <dl class="prof">
      <dt>소속</dt><dd>해월도 파출소 형사</dd>
      <dt>성격</dt><dd>여유롭고 능글맞지만 다정함. 웃으면 눈매가 부드럽게 휜다</dd>
      <dt>좋아하는 것</dt><dd>따뜻한 캔커피 · 부두 낚시 · 노을 · ${r.stage >= 4 ? '<b>당신</b>' : '???'}</dd>
      <dt>싫어하는 것</dt><dd>서류 작업 · 귤 훔치는 까마귀</dd>
      <dt>지금</dt><dd>${S.comp ? '당신과 함께 걷는 중' : TASK_LABEL[plan.k]}</dd>
    </dl>
    <h4>최근 선물 · 데이트</h4>
    <p class="muted">${r.giftLog.slice(0, 6).map(g => ITEMS[g.k].icon).join(' ') || '아직 없음'} ${r.dateLog.length ? ' · ' + r.dateLog.slice(0, 4).map(x => DATES[x.k].icon + DATES[x.k].name).join(', ') : ''}</p>`;
  $('#tab-acts').innerHTML = `<p class="muted">관계 단계가 오르면 할 수 있는 행동이 늘어나요.</p><div class="acts">${INTERACTIONS.map(it => `<div class="act ${r.stage >= it.stage ? '' : 'lock'}"><span>${r.stage >= it.stage ? it.icon : '🔒'}</span><b>${it.label}</b><small>${it.stage}단계 ${STAGES[it.stage - 1].name}</small></div>`).join('')}</div>`;
  $('#tab-album').innerHTML = S.album.length ? `<div class="album">${S.album.map((a, i) => `<figure data-i="${i}">${a.img ? `<img src="${a.img}" alt="">` : '<div class="noimg">📔</div>'}<figcaption><b>${a.title}</b><small>${a.day}일째 ${a.time} · ${a.place}</small></figcaption></figure>`).join('')}</div>` : '<p class="muted center">아직 추억이 없어요. 형사님과 함께 시간을 보내 보세요.</p>';
  $('#tab-album').querySelectorAll('figure').forEach(f => f.onclick = () => { const a = S.album[+f.dataset.i]; if (!a.img) return; $('#zoomImg').src = a.img; $('#zoomCap').textContent = `${a.title} — ${a.day}일째 ${a.time}, ${a.place}`; $('#zoom').classList.remove('hidden'); });
  setTab(tab);
}
function setTab(tab) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + tab));
}
function closeRel() { $('#rel').classList.add('hidden'); G.screen = false; }

function showStageUp() {
  G.stageUpPending = false;
  const st = STAGES[S.rel.stage - 1];
  $('#suName').textContent = `${st.n}단계 · ${st.name}`;
  $('#suUnlock').textContent = st.unlock;
  $('#stageUp').classList.remove('hidden'); G.screen = true;
  burst(G.det, 'heart', 10);
}

function mainMenu() {
  openSheet({ title: '메뉴', cols: 2, sub: `<div class="relneed">${S.name} · ${JOBS[S.job].name} Lv.${S.jobLv} · 경험 ${S.jobExp}/${S.jobLv * 4}<br>자동 저장됨 ${S.savedAt ? new Date(S.savedAt).toLocaleTimeString('ko-KR') : ''}</div>`, items: [
    { icon: '🎒', label: '소지품', onClick: () => { const s = Object.entries(S.inv).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMS[k].icon} ${ITEMS[k].name} ×${n}`).join('<br>') || '비어 있어요'; openSheet({ title: '소지품', sub: `<div class="relneed">${s}${S.rel.favor ? `<br><br>📝 부탁: ${ITEMS[FAVORS[S.rel.favor.i].item].name} 전해 주기` : ''}</div>`, items: [] }); } },
    { icon: '💗', label: '형사님 관계', onClick: () => openRel('profile') },
    { icon: '❓', label: '도움말', onClick: () => { G.screen = true; $('#help').classList.remove('hidden'); } },
    { icon: '💾', label: '지금 저장', onClick: () => { toast(save() ? '저장했어요' : '저장 공간이 부족해요'); } },
    { icon: '🔄', label: '처음부터', wide: true, onClick: () => { if (confirm('저장된 진행 상황을 지우고 처음부터 시작할까요?')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } location.reload(); } } },
  ] });
}

/* ---------------- 메인 루프 ---------------- */
let _last = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - _last) / 1000 || 0.016); _last = ts;
  G.t += dt;
  G.waterT += dt; if (G.waterT > 0.55) { G.waterT = 0; G.waterFrame = (G.waterFrame + 1) % 3; }
  if (G.started) {
    if (!paused()) {
      const mult = G.busy ? 1 : S.speed;
      if (!G.working) advanceTime(dt * MIN_PER_SEC * mult);
      workUpdate(dt);
      const P = G.player;
      const ox = P.x, oy = P.y;
      if (!G.busy && !G.working && !G.fishing && !keyMove(dt)) P.update(dt); else if (G.busy) P.update(dt); else P.update(0);
      const moved = Math.hypot(P.x - ox, P.y - oy);
      if (moved > 0) {
        const h0 = G.hist[0]; if (!h0 || Math.hypot(h0[0] - P.x, h0[1] - P.y) > 0.2) { G.hist.unshift([P.x, P.y]); if (G.hist.length > 60) G.hist.pop(); }
        if (S.comp && dist(P, G.det) < 3) { G.walkedTogether += moved; if (S.weather === 'rain') G.rainWalk += moved; }
      }
      detUpdate(dt); G.det.update(dt);
      for (const v of G.villagers) { villagerUpdate(v, dt); v.update(dt); }
      pendingUpdate(dt);
      for (let i = G.waiters.length - 1; i >= 0; i--) { const w = G.waiters[i]; w.t -= dt; if (w.cond() || w.t <= 0) { G.waiters.splice(i, 1); w.res(); } }
      checkEvents();
      if (G.dayOver && !G.busy) endDay(true);
      else if (G.stageUpPending && !G.busy) showStageUp();
      // 장소 알림
      const pl = curPlace(); if (pl !== G.lastPlace) { G.lastPlace = pl; if (pl) { const el = $('#placeTag'); el.textContent = '📍 ' + PLACES[pl].name; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); } }
      G.saveT += dt; if (G.saveT > 15) { G.saveT = 0; save(); }
    }
    G.ctxT -= dt;
    if (G.ctxT <= 0 && !G.ctxLock) { G.ctxT = 0.2; const a = (!paused() && !G.busy) ? computeAction() : null; const cur = G.ctxAction; if (!a !== !cur || (a && cur && (a.label !== cur.label))) setAction(a); else if (a) G.ctxAction.fn = a.fn; }
    if (Math.floor(G.t * 4) !== Math.floor((G.t - dt) * 4)) updateHUD();
  }
  for (let i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t -= dt; if (G.floats[i].t <= 0) G.floats.splice(i, 1); }
  for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.t -= dt; p.h += p.vh * dt; p.ox += Math.sin(G.t * 5 + i) * dt * 6; if (p.t <= 0) G.parts.splice(i, 1); }
  if (G.tapMark) G.tapMark.t -= dt * 1.5;
  if (G.titleCam) { G.titleCam.a += dt * 0.08; G.camFocus = { x: 17.5 + Math.cos(G.titleCam.a) * 7, y: 17.5 + Math.sin(G.titleCam.a) * 7 }; }
  render(dt);
  requestAnimationFrame(loop);
}

/* ---------------- 시작 ---------------- */
function spawnActors() {
  G.player = new Actor('player', Object.assign(playerLook(S.job, S.hair), { cacheId: 'player-' + S.job + S.hair }), 'base');
  G.player.speed = 2.9;
  G.player.x = S.p.x; G.player.y = S.p.y;
  if (!walkable(Math.floor(G.player.x), Math.floor(G.player.y))) { const st = JOBS[S.job].start; G.player.x = st[0]; G.player.y = st[1]; }
  G.det = new Actor('det', Object.assign({}, LOOKS.det, { cacheId: 'det' }), 'work');
  G.det.speed = 2.5; G.det.state = 'sched'; G.det.x = S.d.x; G.det.y = S.d.y; G.det.visible = S.d.vis !== false;
  if (!walkable(Math.floor(G.det.x), Math.floor(G.det.y))) { G.det.x = 20.5; G.det.y = 17.5; }
  G.villagers = Object.entries(VILLAGERS).map(([k, V], i) => { const a = new Actor(k, Object.assign({}, LOOKS[V.look], { cacheId: k }), 'base'); a.vid = k; a.isVillager = true; a.speed = k === 'kid' ? 2.2 : 1.5; [a.x, a.y] = V.spots[0]; return a; });
  G.actors = [G.player, G.det, ...G.villagers];
  if (S.comp) { startCompanion(); const n = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([a, b]) => [Math.floor(G.player.x) + a, Math.floor(G.player.y) + b]).find(([x, y]) => walkable(x, y)); if (n) { G.det.x = n[0] + 0.5; G.det.y = n[1] + 0.5; } }
  G.camSnap = true;
}
function startGame(state, isNew) {
  S = state; S.rel.daily = Object.assign(newDaily(), S.rel.daily || {});
  G.titleCam = null; G.camFocus = null;
  spawnActors();
  G.started = true; G.lastStageShown = S.rel.stage;
  $('#title').classList.add('hidden'); $('#newgame').classList.add('hidden'); $('#hud').classList.remove('hidden');
  updateHUD(); save();
  if (isNew) {
    setTimeout(() => toast('화면을 눌러 이동해요. 해월도에 온 걸 환영해요!'), 400);
    setTimeout(() => toast('🚓 저 멀리서 누군가 다가오는 것 같아요…'), 3200);
  } else toast(`이어하기 — ${S.day}일째 ${fmtTime(S.min)} · ${stageName()}`);
}

function buildNewGameUI() {
  const jobs = $('#jobList'); jobs.innerHTML = '';
  let job = 'doctor', hair = 'ponytail';
  const prev = () => {
    const look = Object.assign(playerLook(job, hair), { cacheId: 'prev-' + job + hair });
    const c = $('#pvChibi'), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
    g.drawImage(chibi(look, 'base', 'f', 0, 'stand', false), 0, 0);
    const p = $('#pvFace').getContext('2d'); p.clearRect(0, 0, 32, 32); p.drawImage(drawPortrait(look, 'base', 'smile'), 0, 0);
    $('#jobDesc').textContent = JOBS[job].desc;
  };
  for (const [k, J] of Object.entries(JOBS)) {
    const b = document.createElement('button'); b.className = 'job' + (k === job ? ' on' : ''); b.innerHTML = `<span>${J.icon}</span><b>${J.name}</b>`;
    b.onclick = () => { job = k; jobs.querySelectorAll('.job').forEach(x => x.classList.remove('on')); b.classList.add('on'); prev(); };
    jobs.appendChild(b);
  }
  const hairs = $('#hairList'); hairs.innerHTML = '';
  for (const [k, H] of Object.entries(PLAYER_HAIRS)) {
    const b = document.createElement('button'); b.className = 'hair' + (k === hair ? ' on' : ''); b.textContent = H.label;
    b.onclick = () => { hair = k; hairs.querySelectorAll('.hair').forEach(x => x.classList.remove('on')); b.classList.add('on'); prev(); };
    hairs.appendChild(b);
  }
  prev();
  $('#startBtn').onclick = () => {
    const name = ($('#nameIn').value || '').trim().slice(0, 8) || '해월';
    try { localStorage.setItem(SAVE_KEY + '-name', name); } catch (e) { }
    startGame(newState(name, job, hair), true);
  };
  try { $('#nameIn').value = localStorage.getItem(SAVE_KEY + '-name') || ''; } catch (e) { }
}

function bindUI() {
  const view = R.view; let down = null;
  view.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  view.addEventListener('pointerup', (e) => {
    if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (moved > 14) return;
    const r = view.getBoundingClientRect(); onTap(e.clientX - r.left, e.clientY - r.top);
  });
  window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; G.keys[k] = true;
    if ((k === ' ' || k === 'e' || k === 'Enter') && G.started) {
      if (G.dialog && _dlgResolve && !$('#dlg').classList.contains('choosing')) { _dlgResolve(); e.preventDefault(); return; }
      if (!paused() && G.ctxAction && G.ctxAction.fn) { G.ctxAction.fn(); e.preventDefault(); }
      else if (G.fishing) fishTap();
    }
    if (k === 'Escape') { if (G.sheet) closeSheet(); else if (G.screen && !$('#rel').classList.contains('hidden')) closeRel(); }
  });
  window.addEventListener('keyup', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; G.keys[k] = false; });
  window.addEventListener('blur', () => { G.keys = {}; });
  $('#dlg').addEventListener('click', () => { if (_dlgResolve && !$('#dlg').classList.contains('choosing')) _dlgResolve(); });
  $('#actBtn').addEventListener('click', () => { if (G.fishing) { fishTap(); return; } if (!paused() && !G.busy && G.ctxAction && G.ctxAction.fn) G.ctxAction.fn(); });
  $('#sheetClose').onclick = closeSheet;
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
  $('#relBtn').onclick = () => { if (!G.busy && !paused()) openRel('profile'); };
  $('#relClose').onclick = closeRel;
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  $('#compIcon').onclick = compMenu;
  $('#hSpeed').onclick = () => { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; updateHUD(); };
  $('#menuBtn').onclick = () => { if (!G.busy && !paused()) mainMenu(); };
  $('#suOk').onclick = () => { $('#stageUp').classList.add('hidden'); G.screen = false; };
  $('#zoom').onclick = () => $('#zoom').classList.add('hidden');
  $('#helpOk').onclick = () => { $('#help').classList.add('hidden'); G.screen = false; };
  $('#btnNew').onclick = () => { $('#title').classList.add('hidden'); $('#newgame').classList.remove('hidden'); buildNewGameUI(); };
  $('#btnBack').onclick = () => { $('#newgame').classList.add('hidden'); $('#title').classList.remove('hidden'); };
  $('#btnCont').onclick = () => { const s = loadSave(); if (s) startGame(s, false); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  window.addEventListener('resize', resize);
}

function boot() {
  R.view = $('#view'); R.v = R.view.getContext('2d');
  R.low = mkCanvas(200, 400); R.l = R.low.getContext('2d');
  buildWorld(); buildGround();
  resize(); bindUI();
  const s = loadSave();
  $('#btnCont').classList.toggle('hidden', !s);
  if (s) $('#contInfo').textContent = `${s.name} · ${JOBS[s.job].name} · ${s.day}일째 · ${STAGES[s.rel.stage - 1].name}`;
  // 타이틀 화면 배경용 임시 상태
  S = null; G.titleCam = { a: 0 };
  G.player = new Actor('p', playerLook('traveler', 'ponytail'), 'base'); G.player.x = 17.5; G.player.y = 17.5; G.player.visible = false;
  G.det = new Actor('det', Object.assign({}, LOOKS.det, { cacheId: 'det' }), 'casual'); G.det.x = 31.5; G.det.y = 17.5;
  G.actors = [G.det]; G._lights = [];
  G.camSnap = true;
  requestAnimationFrame(loop);
}
G._lights = [];
window.addEventListener('DOMContentLoaded', boot);

/* 테스트/디버그용 */
window.HW = { G, get S() { return S; }, addAff, startCompanion, endCompanion, save, checkStage, render, endDay };
