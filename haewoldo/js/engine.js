'use strict';
/* 받침에 맞는 조사 (와/과 · 을/를 · 이/가 · 은/는 · (으)로) */
function josa(w, a, b) { const c = String(w).replace(/[^가-힣0-9]+$/, '').slice(-1).charCodeAt(0); const has = c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 > 0 : /[136780]$/.test(String.fromCharCode(c)); return w + (has ? a : b); }
function josaRo(w) { const c = String(w).replace(/[^가-힣0-9]+$/, '').slice(-1).charCodeAt(0); const jong = c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 : 0; return w + (jong && jong !== 8 ? '으로' : '로'); }
/* =========================================================
 *  해월도 다이어리 v2 — 엔진 (상태 · 캐릭터 · 렌더링 · 입력 · 시간)
 * ========================================================= */
const SAVE_KEY = 'haewoldo-village-v3';
const MIN_PER_SEC = 1;               // 현실 1초 = 게임 1분 → 하루 약 17분, 계절(30일) 약 8~9시간
const DOW = ['월', '화', '수', '목', '금', '토', '일'];
const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmtMoney = (n) => Math.round(n).toLocaleString('ko-KR') + '원';
const fmtTime = (m) => { m = Math.floor(m); const h = Math.floor(m / 60) % 24, mm = m % 60; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
const dist = (a, b) => (a.map && b.map && a.map !== b.map) ? 999 : Math.hypot(a.x - b.x, a.y - b.y);

let S = null;
const G = {
  player: null, det: null, villagers: [], staff: [], rivals: {}, pets: [], actors: [],
  busy: 0, dialog: false, sheet: false, screen: false,
  waiters: [], floats: [], parts: [], fx: [], tapMark: null, tempObjs: [],
  cam: { x: 0, y: 0 }, camFocus: null, camSnap: true, t: 0, waterFrame: 0, waterT: 0,
  hist: [], walkedTogether: 0, rainWalk: 0, compIdle: 0, compSettled: false, compRepath: 0, togetherAcc: 0,
  lastPlace: null, pending: null, keys: {}, ctxAction: null, ctxT: 0, saveT: 0,
  fishing: null, started: false, working: null, decor: null, title: true,
};
const paused = () => G.dialog || G.sheet || G.screen;
const season = () => S ? calendar(S.day).season : 'summer';

/* ---------------- 상태 ---------------- */
function newDaily() { return { talk: 0, greet: false, gift: false, date: false, sit: {}, fish: 0, autoGreet: false, favor: false, hug: false, kiss: false, togetherAff: 0, visit: false, halmeoni: false, affGain: 0, met: false, shells: 0, oranges: 0, cafe: false, eat: false, karaoke: false, stars: false, cook: false, pets: {}, rival: null, rivalSeen: false, pickup: false, eventsSeen: {}, lost: null, staff: {} }; }
function newState(name, job, hair, detName) {
  const st = MAPS.island.spawn[job];
  return {
    v: 3, name, job, hair, detName: detName || '', day: 1, min: 8 * 60, weather: 'sunny', money: 12000, jobLv: 1, jobExp: 0, works: 0,
    inv: { coffee: 1, tangerine: 1, snack: 2 }, furnInv: { plant: 1, cushion: 1 }, home: HOME_DEFAULT.map(f => f.slice()),
    map: 'island', p: { x: st[0], y: st[1] }, d: (() => { const [x, y] = nearestWalkable(st[0] - 7, st[1] + 0.5, MAPS.island); return { x, y, vis: true, map: 'island' }; })(),
    comp: false, hold: false, arm: false, speed: 1,
    rel: { aff: 0, stage: 1, together: 0, gifts: 0, dates: 0, dateLog: [], giftLog: [], flags: {}, talkIdx: {}, guide: {}, favor: null, confessDay: -9, proposeDay: -9, metDay: 0, loverDay: 0, missDays: 0, lastGift: {}, daily: newDaily() },
    names: { detNick: '', meNick: '' }, wedding: null,
    album: [], spots: {}, dex: {}, eventsDone: {}, settings: { music: true, sfx: true, mini: true },
  };
}
function save() {
  if (!S || !G.started) return false;
  S.map = G.player.map; S.p = { x: G.player.x, y: G.player.y };
  S.d = { x: G.det.x, y: G.det.y, vis: G.det.visible, map: G.det.map };
  S.savedAt = Date.now();
  for (let i = 0; i < 8; i++) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; }
    catch (e) { const k = S.album.findIndex(a => a.img); if (k < 0) return false; S.album[k].img = null; }
  }
  return false;
}
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.v === 3 && JOBS[s.job] ? s : null; } catch (e) { return null; } }

/* ---------------- 캐릭터 ---------------- */
class Actor {
  constructor(id, look, outfit, map = 'island') {
    Object.assign(this, { id, look, outfit, map, x: 0, y: 0, path: [], speed: 2.5, speedMul: 1, face: 'f', left: false, anim: 0, moving: false, pose: 'stand', visible: true, bubble: null, blinkT: rand(1, 4), blink: false, seat: null, emote: null, onArrive: null, wait: 0 });
  }
  walkTo(tx, ty, opts = {}) { const p = findPath(this.x, this.y, tx, ty, Object.assign({ map: MAPS[this.map] }, opts)); if (p) { this.path = p; return true; } return false; }
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
      if (d <= step) { this.x = nx; this.y = ny; this.path.shift(); this.anim += d * 3.4; } else { this.x += dx / d * step; this.y += dy / d * step; this.anim += step * 3.4; }
      if (d > 0.001) this.faceTo(dx, dy);
      this.moving = true;
      if (!this.path.length) { this.moving = false; const f = this.onArrive; this.onArrive = null; if (f) f(); }
    } else { this.moving = false; }
  }
  frame() { return this.moving ? Math.floor(this.anim) % 4 : 0; }
  say(text, t = 3.2) { this.bubble = { text: fillNames(text), t }; }
  emo(icon, t = 1.6) { this.emote = { icon, t }; }
  sitAt(benchKey, idx) {
    const bk = MAPS[this.map].benches[benchKey]; const s = bk.seats[idx];
    this.stop(); this.seat = { bench: benchKey, idx }; this.x = s[0] + 0.5; this.y = s[1] + 0.5; this.pose = 'sit'; this.face = 'f'; this.left = true;
  }
  standUp() {
    if (!this.seat) return; const bk = MAPS[this.map].benches[this.seat.bench];
    const s = bk.stand[this.seat.idx]; this.x = s[0] + 0.5; this.y = s[1] + 0.5; this.seat = null; this.pose = 'stand';
  }
}

/* ---------------- 계절 옷차림 ---------------- */
const _wearCache = new Map();
function wearOf(a) {
  if (a.pet) return null;
  const se = season(), look = a.look;
  const key = (look.cacheId || look.name) + '|' + a.outfit + '|' + se;
  let w = _wearCache.get(key);
  if (w) return w;
  const base = look.outfits[a.outfit] || Object.values(look.outfits)[0];
  w = Object.assign({}, base);
  if (a.outfit === 'suit' || a.outfit === 'wedding') { w.key = key; _wearCache.set(key, w); return w; }
  if (a.id === 'det') Object.assign(w, (SEASON_WEAR.det[a.outfit] || {})[se] || {});
  else if (!base.accent && !base.apron) {
    if (se === 'summer') w.rolled = true;
    if (se === 'autumn' && !base.stetho) { w.coat = mixHex2(base.coat, '#a9845f', 0.3); w.coatS = shade(w.coat, 0.82); }
    if (se === 'winter') { w.coat = shade(base.coat, 0.82); w.coatS = shade(base.coat, 0.66); let h = 0; for (const ch of (look.name || '')) h += ch.charCodeAt(0); w.scarf = SCARF_COLORS[h % SCARF_COLORS.length]; if (look.kid) { w.hat = 'beanie'; w.hatC = w.scarf; } if (w.hat === 'straw') w.hat = null; }
  } else if (se === 'winter') { let h = 0; for (const ch of (look.name || '')) h += ch.charCodeAt(0); w.scarf = SCARF_COLORS[h % SCARF_COLORS.length]; }
  if (se !== 'summer' && w.hat === 'straw' && !look.keepHat) w.hat = null;
  w.key = key; _wearCache.set(key, w);
  return w;
}
function mixHex2(a, b, k) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }

/* ---------------- 이름 · 호칭 ---------------- */
function himCall() {
  const st = S ? S.rel.stage : 1;
  if (st >= 8) return '여보';
  if (st >= 5 && S.names.detNick) return S.names.detNick;
  if (st >= 5 && S.detName) return S.detName;
  if (st >= 4 && S.detName) return S.detName + ' 씨';
  return '형사님';
}
function detLabel() {
  if (!S) return '파출소 형사님';
  const h = himCall();
  if (h !== '형사님') return h;
  return S.detName ? S.detName + ' 형사님' : '파출소 형사님';
}
function meCall() {
  const st = S.rel.stage;
  if (st >= 8) return '여보';
  if (st >= 5 && S.names.meNick) return S.names.meNick;
  if (st >= 5) return S.name;
  return S.name + ' 씨';
}
function fillNames(t) {
  if (!S) return t;
  return t.replace(/\{name\}/g, S.name).replace(/\{me\}/g, meCall()).replace(/\{him\}/g, himCall()).replace(/\{det\}/g, S.detName || '형사');
}
function choiceText(t) { t = fillNames(t); return S.rel.stage >= 4 && himCall() !== '형사님' ? t.replace(/형사님/g, himCall()) : t; }

/* ---------------- 렌더러 ---------------- */
const R = { scale: 2, dpr: 1, K: 2, view: null, v: null, cssW: 0, cssH: 0, shadow: null, glow: null, objSpr: {} };

function groundKey(m) { return m.interior ? 'in' : season(); }
function buildGround(m) {
  const se = season();
  const W = (m.W + m.H) * 16 + 32, top = m.interior ? 56 : 0, H = (m.W + m.H) * 8 + 40 + top;
  m.gOX = m.H * 16 + 16; m.gOY = top;
  const cache = {};
  const tile = (type, v, f) => { const k = type + v + '_' + f; return cache[k] || (cache[k] = makeTile(type, v, f, se)); };
  const frames = m.interior ? 1 : 3;
  m.ground = [];
  for (let f = 0; f < frames; f++) {
    const c = mkCanvas(W, H), g = c.getContext('2d');
    if (!m.interior) for (let s = 0; s <= m.W + m.H; s++) for (let x = 0; x < m.W; x++) {
      const y = s - x; if (y < 0 || y >= m.H) continue;
      const t = tileAt(x, y, m); if (t !== T.WATER && t !== T.WOOD) continue;
      const [sx, sy] = iso(x, y), ox = sx - 16 + m.gOX, oy = sy + m.gOY;
      g.drawImage(tile('water', Math.floor(hash2(x, y, 1) * 4), f), ox, oy);
      const landN = (xx, yy) => { const tt = tileAt(xx, yy, m); return tt !== T.WATER && tt !== T.WOOD; };
      g.fillStyle = 'rgba(255,255,255,0.75)';
      if (landN(x - 1, y)) for (let X = 0; X < 16; X++) if ((X + f * 3) % 5 < 3) g.fillRect(ox + X, oy + 8 - Math.floor(X / 2) + 1, 1, 1);
      if (landN(x, y - 1)) for (let X = 16; X < 32; X++) if ((X + f * 3) % 5 < 3) g.fillRect(ox + X, oy + Math.floor((X - 16) / 2) + 1, 1, 1);
    }
    for (let s = 0; s <= m.W + m.H; s++) for (let x = 0; x < m.W; x++) {
      const y = s - x; if (y < 0 || y >= m.H) continue;
      const t = tileAt(x, y, m); if (t === T.WATER) continue;
      const [sx, sy] = iso(x, y), ox = sx - 16 + m.gOX, oy = sy + m.gOY;
      const v = Math.floor(hash2(x, y, 2) * 8);
      g.drawImage(tile(TILE_NAMES[t], v, f), ox, oy);
      if (m.interior) continue;
      const edgeCol = t === T.WOOD ? '#6e4a30' : t === T.SAND || t === T.PATH ? '#cfae72' : t === T.ROCK ? '#3b3e46' : '#9b7049';
      const edgeH = t === T.WOOD ? 3 : 5;
      const wat = (xx, yy) => tileAt(xx, yy, m) === T.WATER;
      if (wat(x + 1, y)) for (let X = 16; X < 32; X++) { const ye = 16 - Math.floor((X - 16) / 2); g.fillStyle = edgeCol; g.fillRect(ox + X, oy + ye - 1, 1, edgeH); g.fillStyle = shade(edgeCol, 0.8); g.fillRect(ox + X, oy + ye + edgeH - 2, 1, 1); }
      if (wat(x, y + 1)) for (let X = 0; X < 16; X++) { const ye = 8 + Math.floor(X / 2); g.fillStyle = shade(edgeCol, 1.1); g.fillRect(ox + X, oy + ye, 1, edgeH); g.fillStyle = shade(edgeCol, 0.8); g.fillRect(ox + X, oy + ye + edgeH - 1, 1, 1); }
      if (t === T.WOOD && (wat(x + 1, y + 1) || wat(x, y + 1))) { g.fillStyle = '#5a3a24'; g.fillRect(ox + 15, oy + 15, 2, 6); }
    }
    if (m.interior) drawInteriorWalls(g, m);
    m.ground.push(c);
  }
  m.groundKey = groundKey(m);
}
function drawInteriorWalls(g, m) {
  const WH = 46, ox = m.gOX, oy = m.gOY;
  const P = (x, y) => [iso(x, y)[0] + ox, iso(x, y)[1] + oy];
  // 뒤쪽 두 벽: y=0 모서리(오른쪽 위), x=0 모서리(왼쪽 위)
  const wall = (A, B, col, col2) => {
    const a = P(...A), b = P(...B), slope = (b[1] - a[1]) / (b[0] - a[0]);
    const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]);
    for (let X = Math.round(x0); X < Math.round(x1); X++) {
      const yE = a[1] + (X + 0.5 - a[0]) * slope;
      g.fillStyle = col; g.fillRect(X, Math.round(yE - WH), 1, WH);
      g.fillStyle = col2; g.fillRect(X, Math.round(yE - 14), 1, 14);
      g.fillStyle = shade(col2, 0.8); g.fillRect(X, Math.round(yE - 15), 1, 1);
      g.fillStyle = shade(col, 1.08); g.fillRect(X, Math.round(yE - WH), 1, 3);
    }
  };
  wall([0, 0], [m.W, 0], shade(m.wall, 0.92), shade(m.wall2, 0.9));
  wall([0, m.H], [0, 0], m.wall, m.wall2);
  // 창문
  const win = (A, B, t0, t1, col) => {
    const a = P(...A), b = P(...B), slope = (b[1] - a[1]) / (b[0] - a[0]);
    const xa = a[0] + (b[0] - a[0]) * t0, xb = a[0] + (b[0] - a[0]) * t1;
    for (let X = Math.round(Math.min(xa, xb)); X < Math.round(Math.max(xa, xb)); X++) {
      const yE = a[1] + (X + 0.5 - a[0]) * slope;
      g.fillStyle = shade(m.wall, 0.6); g.fillRect(X, Math.round(yE - 38), 1, 18);
      g.fillStyle = col; g.fillRect(X, Math.round(yE - 37), 1, 16);
      g.fillStyle = '#ffffff'; if ((X % 7) === 0) g.fillRect(X, Math.round(yE - 37), 1, 16);
    }
  };
  if (!m.noWindows) {
    win([0, 0], [m.W, 0], 0.55, 0.75, '#bfe3f7');
    win([0, m.H], [0, 0], 0.25, 0.42, '#bfe3f7');
  }
  // 문 매트 위 문틀
  const [ex, ey] = m.exit; const dp = P(ex + 0.5, ey + 1);
  g.fillStyle = 'rgba(255,240,200,0.25)'; g.fillRect(Math.round(dp[0] - 8), Math.round(dp[1] - 4), 16, 4);
}
const _bldCache = new Map();
function buildingSprite(b, night) {
  const key = b.id + '|' + season() + '|' + (night ? 1 : 0);
  let s = _bldCache.get(key);
  if (!s) {
    s = makeBuilding(b, night, season());
    const c = s.c, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    s.mask = new Uint8Array(c.width * c.height); for (let i = 0; i < s.mask.length; i++) s.mask[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    _bldCache.set(key, s);
  }
  return s;
}
function objSprite(o) {
  const se = season();
  if (o.kind === 'furn') return furnSprite(o.k, o.rot != null ? o.rot : (o.flip ? 1 : 0));
  if (o.kind === 'prop') return R.objSpr['prop' + o.v] || (R.objSpr['prop' + o.v] = sprProp(o.v));
  if (o.kind === 'portal') return R.objSpr['portal' + o.v] || (R.objSpr['portal' + o.v] = sprPortal(o.v));
  const key = o.kind + (o.v || 0) + (['tree', 'palm', 'orange', 'flowerbed', 'bush'].includes(o.kind) ? se : '');
  if (R.objSpr[key]) return R.objSpr[key];
  const mk = {
    tree: () => sprTree('tree', o.v || 0, se), palm: () => sprTree('palm', 0, se), orange: () => sprTree('orange', 0, se),
    wall: sprWall, bench: sprBench, lamp: sprLamp, parasol: sprParasol, telescope: sprTelescope, hare: sprHareubang, board: sprBoard,
    fence: sprFence, hay: sprHay, windmill: sprWindmill, busstop: sprBusStop,
    booth: sprBooth, crosswalk: sprCrosswalk, ticket: sprTicket, signpost: sprSignpost, flowerbed: sprFlowerbed, bush: sprBush, lowfence: sprLowFence, stone: sprStone, glowShell: sprGlowShell, furnDisplay: sprFurnDisplay, clue: sprClue, dig: sprDig,
    crates: sprCrates, boat: sprBoat, pot: sprPot, rocks: sprRocks, snowman: sprSnowman, pavilion: sprPavilion, tankOut: sprTankOut, lantern: sprLantern, stall: sprStall,
  }[o.kind];
  return (R.objSpr[key] = mk ? mk() : sprPot());
}

function resize() {
  const box = $('#game').getBoundingClientRect();
  R.dpr = Math.min(3, window.devicePixelRatio || 1);
  const md = Math.min(box.width, box.height);
  R.scale = md >= 540 ? 2.8 : md >= 440 ? 2.5 : 2;
  R.cur = 0; R.K = R.scale * R.dpr;
  R.view.width = Math.round(box.width * R.dpr); R.view.height = Math.round(box.height * R.dpr);
  R.cssW = box.width; R.cssH = box.height;
  R.lw = box.width / R.scale; R.lh = box.height / R.scale;
}
function daylight(min) {
  const h = (min / 60) % 24;
  if (h >= 7 && h < 16.5) return { mul: null, night: 0, mood: 'day' };
  if (h >= 16.5 && h < 18.3) { const k = (h - 16.5) / 1.8; return { mul: mixHex('#ffffff', '#ffc89a', k), night: 0, mood: 'evening' }; }
  if (h >= 18.3 && h < 19.6) { const k = (h - 18.3) / 1.3; return { mul: mixHex('#ffc89a', '#6a75b8', k), night: k, mood: 'evening' }; }
  if (h >= 19.6 || h < 5.5) return { mul: '#5f6bb0', night: 1, mood: 'night' };
  const k = (h - 5.5) / 1.5; return { mul: mixHex('#7e86c4', '#ffffff', k), night: 1 - k, mood: 'day' };
}
function mixHex(a, b, k) { const A = hexRgb(a), B = hexRgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')'; }

/* 화면 좌표 (장치 픽셀) — 카메라는 소수 단위, 그림은 픽셀마다 반올림 → 끊김 없이 부드럽게 */
const SX = (wx) => Math.round((wx - G.cam.x) * R.K);
const SY = (wy) => Math.round((wy - G.cam.y) * R.K);
function blit(g, img, wx, wy, flip) {
  const X = SX(wx), Y = SY(wy), w = Math.round(img.width * R.K), h = Math.round(img.height * R.K);
  if (X > R.view.width || Y > R.view.height || X + w < 0 || Y + h < 0) return;
  if (flip) { g.save(); g.translate(X + w, Y); g.scale(-1, 1); g.drawImage(img, 0, 0, w, h); g.restore(); }
  else g.drawImage(img, X, Y, w, h);
}
function prect(g, wx, wy, w, h, col) { g.fillStyle = col; g.fillRect(SX(wx), SY(wy), Math.max(1, Math.round(w * R.K)), Math.max(1, Math.round(h * R.K))); }

function render(dt) {
  const g = R.v, P = G.player, m = M;
  // 실내도 바깥과 같은 크기로 (방이 화면보다 크면 카메라가 따라다님)
  const fitRoom = m.interior && G.decor;   // 꾸미기 중엔 방 전체가 한눈에 보이게
  const zm = G.zoom || 1, sc = (fitRoom ? Math.min(R.scale, R.cssW / ((m.W + m.H) * 16 + 56), R.cssH / ((m.W + m.H) * 8 + 150)) : R.scale) * zm;
  if (sc !== R.cur) { const pinching = G.pinching; R.cur = sc; R.K = sc * R.dpr; R.lw = R.cssW / sc; R.lh = R.cssH / sc; if (!pinching) G.camSnap = true; else G.camSnap = true; }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = false;
  if (m.interior && (!m.ground || m.groundKey !== groundKey(m))) buildGround(m);
  // 카메라
  let fx, fy;
  if (G.camFocus) [fx, fy] = iso(G.camFocus.x, G.camFocus.y);
  else [fx, fy] = iso(P.x, P.y);
  let tx = fx - R.lw / 2, ty = fy - 14 - R.lh * 0.5;
  if (fitRoom && !G.camFocus) { [fx, fy] = iso(m.W / 2, m.H / 2 + 0.6); tx = fx - R.lw / 2; ty = fy - 14 - R.lh * 0.46; }
  else if (m.interior && !G.camFocus) {
    // 방 테두리(벽 포함) 안에서만 움직이게: 방이 화면보다 작으면 가운데, 크면 내 위치를 따라가되 벽 밖은 안 보이게
    const bx0 = iso(0, m.H)[0] - 10, bx1 = iso(m.W, 0)[0] + 10, by0 = iso(0, 0)[1] - 58, by1 = iso(m.W, m.H)[1] + 30;
    const fit = (a0, a1, v, L, extra) => (a1 - a0 <= L ? (a0 + a1) / 2 - L / 2 : Math.max(a0, Math.min(a1 - L + extra, v)));
    tx = fit(bx0, bx1, tx, R.lw, 0);
    ty = fit(by0, by1, ty, R.lh, 90 / R.cur);  // 아래쪽은 행동 버튼 · 대화창 자리만큼 여유
  }
  if (G.camSnap) { G.cam.x = tx; G.cam.y = ty; G.camSnap = false; }
  else { const k = 1 - Math.exp(-dt * 7); G.cam.x += (tx - G.cam.x) * k; G.cam.y += (ty - G.cam.y) * k; }

  g.fillStyle = m.interior ? '#2b2340' : (season() === 'winter' ? '#4892c4' : '#53a6dc');
  g.fillRect(0, 0, R.view.width, R.view.height);
  if (m.interior) blit(g, m.ground[0], -m.gOX, -m.gOY); else drawTiles(g, m);
  const dl = S ? daylight(S.min) : { night: 0 };
  const lit = !m.interior && dl.night > 0.5;
  const se = season();

  for (const o of m.objects) if (o.water) { const sp = objSprite(o), [sx, sy] = iso(o.x + 0.5, o.y + 0.5); blit(g, sp.c, sx - sp.ax, sy - sp.ay + Math.sin(G.t * 1.5 + o.x) * 0.8); }
  if (G.tapMark && G.tapMark.t > 0) {
    const [sx, sy] = iso(G.tapMark.x, G.tapMark.y), a = G.tapMark.t, r = 8 + (1 - a) * 4;
    g.globalAlpha = Math.min(1, a * 2);
    for (let i = -r; i <= r; i++) { const h = Math.round((r - Math.abs(i)) / 2); prect(g, sx + i, sy - h, 1, 1, '#ffffff'); prect(g, sx + i, sy + h, 1, 1, '#ffffff'); }
    g.globalAlpha = 1;
  }
  if (G.decor && m.id === 'in_home') drawDecorGrid(g);

  const list = [], solids = [], lights = [];
  const inView = (sx, sy, mg = 60) => sx - G.cam.x > -mg && sx - G.cam.x < R.lw + mg && sy - G.cam.y > -mg - 70 && sy - G.cam.y < R.lh + mg;
  for (const b of m.buildings) {
    const spr = buildingSprite(b, lit);
    if (!inView(spr.x + spr.c.width / 2, spr.y + spr.c.height / 2, 160)) continue;
    const key = b.x + b.w + b.y + b.h;
    list.push({ d: key, f: () => blit(g, spr.c, spr.x, spr.y) });
    solids.push({ x: b.x, y: b.y, w: b.w, h: b.h, key, sx0: iso(b.x, b.y + b.h)[0], sx1: iso(b.x + b.w, b.y)[0] });
  }
  const temps = G.tempObjs.filter(o => (o.map || 'island') === m.id);
  const objs = temps.length ? m.objects.concat(temps) : m.objects;
  if (!m.interior && typeof drawFerry === 'function') drawFerry(g, list, inView);
  for (const o of objs) {
    if (o.water) continue;
    if (o.hide && o.hide()) continue;
    if (o.season && o.season !== se) continue;
    if (o.minStage && (!S || S.rel.stage < o.minStage)) continue;
    const sp = objSprite(o), [sx, sy] = iso(o.x + 0.5, o.y + 0.5); if (!inView(sx, sy)) continue;
    const fw = o.fw || 1, fh = o.fh || 1, flat = o.flat || (o.kind === 'furn' && FURN[o.k].flat), wallI = o.kind === 'furn' && FURN[o.k].wall;
    const key = o.keyFix != null ? o.keyFix : wallI ? o.x + o.y + 0.1 : flat ? -1000 + o.x + o.y : o.x + o.y + (fw - 1) + (fh - 1) + 2;   // 러그 · 매트 같은 바닥 장식은 늘 사람 · 가구 밑에
    o._key = key;
    const ghost = G.decor && G.decor.drag && G.decor.drag.o === o;
    list.push({ d: ghost ? 999 : key, f: () => {
      if (ghost) g.globalAlpha = 0.55;
      const sc = o.scale && o.scale !== 1 ? o.scale : 0;
      if (sc) { const cw = sp.c.width, ch = sp.c.height; g.drawImage(sp.c, SX(sx - sp.ax * sc), SY(sy - sp.ay * sc), Math.round(cw * sc * R.K), Math.round(ch * sc * R.K)); }
      else if (o.mirror) blit(g, sp.c, sx - (sp.c.width - sp.ax), sy - sp.ay, true);
      else blit(g, sp.c, sx - sp.ax, sy - sp.ay);
      g.globalAlpha = 1;
    } });
    if (o.kind !== 'bench' && !flat && !wallI) solids.push({ x: o.x, y: o.y, w: fw, h: fh, key, sx0: sx - sp.ax, sx1: sx - sp.ax + sp.c.width });
    if ((o.light && lit) || (o.kind === 'furn' && FURN[o.k].light)) lights.push([sx, sy - (o.kind === 'furn' ? 24 : 30)]);
  }
  for (const a of G.actors) {
    if (!a.visible || a.map !== m.id) continue;
    const [sx, sy] = iso(a.x, a.y); if (!inView(sx, sy)) continue;
    let d = a.x + a.y;
    if (a.seat) { const s = m.benches[a.seat.bench].seats[a.seat.idx]; const sd = typeof seatDepth === 'function' ? seatDepth(a, m) : null; d = sd != null ? sd : s[0] + s[1] + 2.05; }
    else if (a.seatFurn) d = (a.seatFurn._key || a.seatFurn.x + a.seatFurn.y + 2) + (a._bedLie ? 0.3 : a.seatFurn.front ? 0.05 : -0.05);
    else if (a.carried) d = G.det.x + G.det.y + 0.05;
    else if (!a.seatFurn) for (const s of solids) {
      if (sx + 8 < s.sx0 || sx - 8 > s.sx1) continue;
      if (Math.abs(a.x - (s.x + s.w / 2)) > 6 || Math.abs(a.y - (s.y + s.h / 2)) > 6) continue;
      if (a.x >= s.x + s.w || a.y >= s.y + s.h) d = Math.max(d, s.key + 0.01);
    }
    list.push({ d, f: () => drawActor(g, a, sx, sy) });
  }
  list.sort((p, q) => p.d - q.d);
  for (const it of list) it.f();

  // 파티클
  for (const p of G.parts) {
    if (p.map && p.map !== m.id) continue;
    const [sx, sy] = iso(p.x, p.y); const X = sx + p.ox, Y = sy - p.h;
    g.globalAlpha = Math.min(1, p.t * 2);
    if (p.kind === 'heart') { prect(g, X - 2, Y, 2, 2, '#ff6f91'); prect(g, X + 1, Y, 2, 2, '#ff6f91'); prect(g, X - 2, Y + 1, 5, 2, '#ff6f91'); prect(g, X - 1, Y + 3, 3, 1, '#ff6f91'); prect(g, X, Y + 4, 1, 1, '#ff6f91'); prect(g, X - 1, Y, 1, 1, '#ffd0dc'); }
    else if (p.kind === 'spark') { prect(g, X, Y - 1, 1, 3, '#fff3a0'); prect(g, X - 1, Y, 3, 1, '#fff3a0'); }
    else if (p.kind === 'note') { prect(g, X, Y, 2, 2, '#6b8ff0'); prect(g, X + 1, Y - 4, 1, 4, '#6b8ff0'); prect(g, X + 2, Y - 4, 1, 1, '#6b8ff0'); }
    else if (p.kind === 'conf') { prect(g, X, Y, 2, 1, p.col); }
    g.globalAlpha = 1;
  }
  // 날씨 · 낮밤
  const wz = S ? S.weather : 'sunny';
  if (!m.interior && wz !== 'sunny') { g.globalCompositeOperation = 'multiply'; g.fillStyle = wz === 'rain' || wz === 'storm' ? '#b4bccf' : wz === 'snow' ? '#e4e8f0' : '#dde1ea'; g.fillRect(0, 0, R.view.width, R.view.height); g.globalCompositeOperation = 'source-over'; }
  if (m.dark) { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#5a6488'; g.fillRect(0, 0, R.view.width, R.view.height); g.globalCompositeOperation = 'source-over'; }
  if (dl.mul) { g.globalCompositeOperation = 'multiply'; g.fillStyle = m.interior ? mixHex('#ffffff', '#ffd9b0', Math.min(1, dl.night)) : dl.mul; g.fillRect(0, 0, R.view.width, R.view.height); g.globalCompositeOperation = 'source-over'; }
  if (dl.night > 0.2 || m.interior) {
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = m.interior ? 0.35 : Math.min(1, dl.night * 1.2);
    for (const [lx, ly] of lights) blit(g, R.glow, lx - 24, ly - 16);
    if (!m.interior) for (const b of m.buildings) { const [dx, dy] = iso(b.doorTile[0] + 0.5, b.doorTile[1]); blit(g, R.glow, dx - 24, dy - 22); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const lh = m.buildings.find(b => b.id === 'lighthouse');
    if (lh && dl.night > 0.2) {
      const [lx, ly] = iso(lh.x + 1, lh.y + 1), ang = G.t * 0.9, ox = SX(lx), oy = SY(ly - 82), L = 300 * R.K;
      g.globalAlpha = 0.2 * dl.night; g.fillStyle = '#fff4b0';
      g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(ang - 0.12) * L, oy + Math.sin(ang - 0.12) * L / 2); g.lineTo(ox + Math.cos(ang + 0.12) * L, oy + Math.sin(ang + 0.12) * L / 2); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
  }
  if (!m.interior) drawWeatherFx(g, wz);
  drawFx(g, dt);

  // 글자 레이어
  const D = R.dpr;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (G.started && !G.noLabels) {
    g.font = `${10.5 * D}px Jua, 'Noto Sans KR', sans-serif`;
    for (const b of m.buildings) {
      const spr = buildingSprite(b, lit); const X = SX(spr.x + spr.c.width / 2), Y = SY(spr.y + (b.kind === 'lighthouse' ? 2 : 10));
      if (X < -100 || X > R.view.width + 100 || Y < -40 || Y > R.view.height + 40) continue;
      const name = b.id === 'home' && S.job === 'traveler' ? '게스트하우스 (숙소)' : b.id === 'home' && S.rel.stage >= 8 ? '우리 집' : b.name;
      pill(g, X, Y, name, 'rgba(255,253,246,0.88)', '#5b4450');
    }
    for (const a of G.actors) {
      if (!a.visible || a.map !== m.id) continue;
      const [sx, sy] = iso(a.x, a.y); const headY = sy - (a.pet ? 18 : a.pose === 'sit' ? 38 : a.look.tall ? 36 : 33) - (a.carried ? 12 : 0);
      const X = SX(sx), Y = SY(headY);
      if (a === G.det) {
        const cm = S.comp, tag = (cm ? '♥ ' : '') + detLabel();
        g.font = `${9.5 * D}px Jua, sans-serif`; pill(g, X, Y - 4 * D, tag, cm ? 'rgba(255,111,145,0.92)' : 'rgba(46,61,102,0.88)', '#ffffff');
      } else if (a !== P && dist(a, P) < 4) {
        g.font = `${9 * D}px Jua, sans-serif`; pill(g, X, Y - 4 * D, a.pet ? a.pet.name : a.look.name, a.isRival ? 'rgba(255,236,245,0.92)' : 'rgba(255,255,255,0.85)', '#5b4450');
      }
      if (a.bubble) drawBubble(g, X, Y - 18 * D, a.bubble.text);
      if (a.emote) { g.font = `${15 * D}px sans-serif`; g.fillText(a.emote.icon, X + 14 * D, Y - 16 * D - Math.sin(G.t * 6) * 2 * D); }
    }
    if (typeof drawWorldMarkers === 'function') drawWorldMarkers(g);
    for (const f of G.floats) {
      if (f.map && f.map !== m.id) continue;
      const [sx, sy] = iso(f.x, f.y); const X = SX(sx), Y = SY(sy - 40 - (1.6 - f.t) * 14);
      g.globalAlpha = Math.min(1, f.t * 2);
      g.font = `${13 * D}px Jua, sans-serif`; g.lineWidth = 4 * D; g.strokeStyle = '#3a2533'; g.strokeText(f.text, X, Y); g.fillStyle = f.color; g.fillText(f.text, X, Y);
      g.globalAlpha = 1;
    }
  }
}
function pill(v, X, Y, text, bg, fg) {
  const D = R.dpr, w = v.measureText(text).width + 10 * D, h = 15 * D;
  v.fillStyle = bg; roundRect(v, X - w / 2, Y - h / 2, w, h, h / 2); v.fill();
  v.fillStyle = fg; v.fillText(text, X, Y + 0.5 * D);
}
function roundRect(v, x, y, w, h, r) { v.beginPath(); v.moveTo(x + r, y); v.arcTo(x + w, y, x + w, y + h, r); v.arcTo(x + w, y + h, x, y + h, r); v.arcTo(x, y + h, x, y, r); v.arcTo(x, y, x + w, y, r); v.closePath(); }
function drawBubble(v, X, Y, text) {
  const D = R.dpr;
  v.font = `${11.5 * D}px Jua, sans-serif`;
  const maxW = 150 * D, lines = []; let cur = '';
  for (const ch of [...text]) { if (v.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch; }
  if (cur) lines.push(cur);
  const lh = 15 * D, w = Math.min(maxW, Math.max(...lines.map(l => v.measureText(l).width))) + 14 * D, h = lines.length * lh + 10 * D;
  const x = Math.max(4, Math.min(R.view.width - w - 4, X - w / 2)), y = Y - h;
  v.fillStyle = '#ffffff'; v.strokeStyle = '#3a2533'; v.lineWidth = 2 * D;
  roundRect(v, x, y, w, h, 8 * D); v.fill(); v.stroke();
  v.beginPath(); v.moveTo(X - 5 * D, y + h - 1); v.lineTo(X, y + h + 6 * D); v.lineTo(X + 5 * D, y + h - 1); v.fill(); v.stroke();
  v.fillStyle = '#ffffff'; v.fillRect(X - 4 * D, y + h - 3 * D, 8 * D, 3 * D);
  v.fillStyle = '#3a2533'; lines.forEach((l, i) => v.fillText(l, x + w / 2, y + 5 * D + lh * (i + 0.5)));
}
function drawActor(g, a, sx, sy) {
  if (a.pet) {
    const spr = animalSprite(a.pet, a.moving ? Math.floor(a.anim * 1.5) % 2 : 0, a.pose === 'sit');
    blit(g, R.shadow, sx - 7, sy - 3); if (a.pet.kind === 'pony') blit(g, spr, sx - 14, sy - 24, a.left); else blit(g, spr, sx - 11, sy - 16, a.left); return;
  }
  const lift = a.seat ? 4 : a.carried ? 13 : 0;
  if (!a.seat && !a.carried) blit(g, R.shadow, sx - 7, sy - 3);
  const spr = chibi(a.look, wearOf(a), a.face, a.carried ? 0 : a.frame(), a.carried ? 'sit' : a.pose, a.blink);
  const lean = a.lean ? (a.left ? 2 : -2) : 0;
  blit(g, spr, sx - 12 + lean + (a.carried ? (a.left ? 2 : -2) : 0), sy - 31 - lift, a.left);
  if (a.pose === 'fish') {
    const dir = a.left ? -1 : 1, hx = sx + dir * 6, hy = sy - 11;
    for (let i = 0; i < 14; i++) prect(g, hx + dir * i, hy - Math.round(i * 0.9), 1, 1, '#5a3a24');
    const tipX = hx + dir * 14, tipY = hy - 13, bob = G.fishing && G.fishing.bite && a === G.player ? Math.sin(G.t * 30) * 2 : Math.sin(G.t * 2 + a.x);
    for (let i = 0; i < 12; i++) prect(g, tipX + dir * i * 0.6, tipY + i * 2, 1, 1, 'rgba(255,255,255,0.8)');
    prect(g, tipX + dir * 7, tipY + 24 + bob, 2, 2, '#e3484a');
  }
  if (a.dig) { const k = Math.sin(G.t * 14); prect(g, sx + 5, sy - 6 + k * 2, 3, 2, '#9a6b45'); }
}
function drawDecorGrid(g) {
  const m = M;
  g.globalAlpha = 0.35;
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
    const [sx, sy] = iso(x + 0.5, y + 0.5);
    prect(g, sx - 1, sy, 2, 1, '#ffffff');
  }
  g.globalAlpha = 1;
  const d = G.decor;
  const mark = (x, y, col) => { const [sx, sy] = iso(x, y); for (let i = 0; i <= 16; i++) { const h = Math.round((16 - i) / 2); prect(g, sx - 16 + i, sy + 8 - h, 1, 1, col); prect(g, sx + 16 - i, sy + 8 - h, 1, 1, col); prect(g, sx - 16 + i, sy + 8 + h, 1, 1, col); prect(g, sx + 16 - i, sy + 8 + h, 1, 1, col); } };
  if (d.sel != null && S.home[d.sel]) mark(S.home[d.sel][1], S.home[d.sel][2], '#ff6f91');
  if (d.hover) mark(d.hover[0], d.hover[1], '#fff3a0');
}

/* 날씨 · 축제 효과 (화면 좌표) */
function drawWeatherFx(g, wz) {
  const W = R.view.width, H = R.view.height, D = R.dpr;
  if (wz === 'rain' || wz === 'storm') {
    g.fillStyle = 'rgba(220,235,255,0.7)'; const n = wz === 'storm' ? 140 : 80;
    for (let i = 0; i < n; i++) { const x = (hash2(i, 1) * W + G.t * 80 * D * (0.5 + hash2(i, 2)) * (wz === 'storm' ? 3 : 1)) % W, y = (hash2(i, 3) * H + G.t * 460 * D * (0.7 + hash2(i, 4) * 0.5)) % H; g.fillRect(Math.round(x), Math.round(y), Math.max(1, D), 8 * D); }
  } else if (wz === 'snow') {
    g.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 90; i++) { const x = (hash2(i, 1) * W + Math.sin(G.t * 0.8 + i) * 20 * D) % W, y = (hash2(i, 3) * H + G.t * 40 * D * (0.6 + hash2(i, 4) * 0.6)) % H; const r = (1 + hash2(i, 5) * 2) * D; g.fillRect(Math.round(x), Math.round(y), r, r); }
  }
}
function drawFx(g, dt) {
  const W = R.view.width, H = R.view.height, D = R.dpr;
  for (let i = G.fx.length - 1; i >= 0; i--) {
    const f = G.fx[i]; f.t -= dt;
    if (f.t <= 0) { G.fx.splice(i, 1); continue; }
    if (f.kind === 'firework') {
      const k = 1 - f.t / f.life, cx = f.x * W, cy = f.y * H;
      if (k < 0.25) { g.fillStyle = '#fff3c4'; g.fillRect(cx, cy + (1 - k / 0.25) * H * 0.3, 2 * D, 5 * D); continue; }
      const r = (k - 0.25) * f.r * D * 1.4; g.globalAlpha = Math.max(0, 1 - k);
      for (let j = 0; j < 18; j++) { const a = j / 18 * Math.PI * 2; g.fillStyle = f.cols[j % f.cols.length]; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r + k * k * 30 * D), 2.5 * D, 2.5 * D); }
      g.globalAlpha = 1;
    } else if (f.kind === 'petal' || f.kind === 'confetti' || f.kind === 'snowlight') {
      f.y += f.vy * dt; f.x += Math.sin(G.t * 2 + f.ph) * dt * 0.03;
      g.fillStyle = f.col; g.globalAlpha = Math.min(1, f.t); g.fillRect(Math.round(f.x * W), Math.round(f.y * H), f.s * D, f.s * D * 0.7); g.globalAlpha = 1;
    } else if (f.kind === 'meteor') {
      const k = 1 - f.t / f.life; g.strokeStyle = `rgba(255,255,230,${1 - k})`; g.lineWidth = 2 * D;
      g.beginPath(); const x = (f.x + k * 0.3) * W, y = (f.y + k * 0.15) * H; g.moveTo(x, y); g.lineTo(x - 40 * D, y - 20 * D); g.stroke();
    } else if (f.kind === 'firefly') {
      const [sx, sy] = iso(f.wx + Math.sin(G.t * 0.7 + f.ph) * 1.2, f.wy + Math.cos(G.t * 0.6 + f.ph) * 1.2);
      g.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 3 + f.ph); g.fillStyle = '#f6ff9a'; g.fillRect(SX(sx), SY(sy - 14 - Math.sin(G.t + f.ph) * 6), 2 * D, 2 * D); g.globalAlpha = 1;
    }
  }
}
function spawnFx(kind) {
  if (kind === 'fireworks') { const cols = pick([['#ff6f91', '#ffd3de', '#fff3a0'], ['#7fc4e8', '#ffffff', '#c9b5ff'], ['#ffd77a', '#ff9a5a', '#ffffff']]); G.fx.push({ kind: 'firework', x: rand(0.15, 0.85), y: rand(0.12, 0.38), r: rand(28, 46), cols, t: 2.2, life: 2.2 }); Sound.sfx('firework'); }
  else if (kind === 'petals' || kind === 'confetti' || kind === 'snowlights') for (let i = 0; i < 2; i++) G.fx.push({ kind: kind === 'petals' ? 'petal' : kind === 'confetti' ? 'confetti' : 'snowlight', x: Math.random(), y: -0.02, vy: rand(0.05, 0.12), ph: Math.random() * 6, s: rand(2, 4), col: kind === 'petals' ? pick(['#ffc0d4', '#ffe1ea', '#f2d84a']) : kind === 'confetti' ? pick(['#ff6f91', '#7fc4e8', '#f2d84a', '#9bd24f', '#c08ad8']) : pick(['#ffd77a', '#ff9aa4', '#9fd6f2', '#b8f0a0']), t: 8 });
  else if (kind === 'meteors') G.fx.push({ kind: 'meteor', x: rand(0.1, 0.8), y: rand(0.05, 0.3), t: 0.9, life: 0.9 });
}

/* ---------------- 지도 이동 ---------------- */
async function goMap(id, x, y, opts = {}) {
  G.busy++;
  if (!opts.noFade) await fade(true);
  const P = G.player;
  if (P.seat) P.standUp();
  P.stop(); P.map = id; [P.x, P.y] = nearestWalkable(x, y, MAPS[id]);
  M = MAPS[id];
  if (S.comp && G.det.state === 'comp') {
    const d = G.det; if (d.seat) d.standUp(); d.stop(); d.map = id; d.visible = true;
    const n = [[1, 0], [0, -1], [-1, 0], [0, 1]].map(([a, b]) => [Math.floor(P.x) + a, Math.floor(P.y) + b]).find(([xx, yy]) => walkable(xx, yy, M));
    [d.x, d.y] = n ? [n[0] + 0.5, n[1] + 0.5] : [P.x, P.y];
    G.hist = []; G.compSettled = false;
  }
  if (id === 'in_home') setFurniture(MAPS.in_home, homeFurnList());
  refreshStaff();
  G.camSnap = true; G.lastPlace = null;
  P.face = 'f'; P.left = true;
  updateHUD(); drawMinimapBase();
  await sleep(120);
  if (!opts.noFade) await fade(false);
  G.busy = Math.max(0, G.busy - 1);
  save();
}
function homeFurnList() {
  const acts = { bed: 'sleep', kitchen: 'cook', tv: 'tv', piano: 'piano', tank: 'tankHome', sofa: 'sofa' };
  return S.home.map(([k, x, y, f]) => [k, x, y, f, acts[k] || null]);
}

/* ---------------- 시간 · 하루 ---------------- */
function curPlace() { return placeAt(G.player.x, G.player.y, MAPS[G.player.map]); }
function dateLabel(day = S.day) { const c = calendar(day); return `${c.month}월 ${c.dom}일`; }

/* ---------------- 이펙트 ---------------- */
function floatText(a, text, color = '#ffe37a') { G.floats.push({ x: a.x, y: a.y, map: a.map, text, color, t: 1.6 }); }
function burst(a, kind, n = 5) { for (let i = 0; i < n; i++) G.parts.push({ kind, x: a.x, y: a.y, map: a.map, ox: rand(-8, 8), h: rand(26, 34), vh: rand(10, 20), t: rand(0.9, 1.5), col: pick(['#ff6f91', '#7fc4e8', '#f2d84a', '#9bd24f']) }); }
function toast(text) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = fillNames(text);
  const box = $('#toasts'); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100);
}
function fade(out) { const f = $('#fade'); f.classList.toggle('on', out); return sleep(420); }
function waitUntil(cond, timeout = 15) { return new Promise(res => G.waiters.push({ cond, res, t: timeout })); }

/* ---------------- 입력 ---------------- */
function screenToWorld(px, py) {
  const wx = px / R.cur + G.cam.x, wy = py / R.cur + G.cam.y;
  return { wx, wy, tx: (wx / 16 + wy / 8) / 2, ty: (wy / 8 - wx / 16) / 2 };
}
function onTap(px, py) {
  Sound.init();
  if (G.fishing) { fishTap(); return; }
  if (!G.started || paused() || G.busy || G.working) return;
  const { wx, wy, tx, ty } = screenToWorld(px, py);
  if (G.decor) { decorTap(Math.floor(tx), Math.floor(ty)); return; }
  const P = G.player;
  let best = null, bd = 1e9;
  for (const a of G.actors) {
    if (a === P || !a.visible || a.map !== M.id) continue;
    const [sx, sy] = iso(a.x, a.y), hh = a.pet ? 16 : 34;
    if (wx > sx - 11 && wx < sx + 11 && wy > sy - hh && wy < sy + 4) { const dd = Math.hypot(wx - sx, wy - sy + hh / 2); if (dd < bd) { bd = dd; best = a; } }
  }
  if (P.seat) { standUpPlayer(); if (!best) return; }
  if (best) { approach(best); return; }
  for (const b of M.buildings) {
    const s = buildingSprite(b, false), lx = Math.floor(wx - s.x), ly = Math.floor(wy - s.y);
    if (lx >= 0 && ly >= 0 && lx < s.c.width && ly < s.c.height && s.mask[ly * s.c.width + lx]) {
      const [dx, dy] = b.doorTile; walkPlayer(dx + 0.5, dy + 0.5, () => openBuilding(b)); return;
    }
  }
  const ix = Math.floor(tx), iy = Math.floor(ty);
  if (M.interior && ix === M.exit[0] && iy === M.exit[1]) { walkPlayer(ix + 0.5, iy + 0.5, leaveInterior); return; }
  for (const [k, bk] of Object.entries(M.benches)) {
    const si = bk.seats.findIndex(s => s[0] === ix && s[1] === iy);
    if (si >= 0) { const st = bk.stand[si]; walkPlayer(st[0] + 0.5, st[1] + 0.5, () => benchAction(k)); return; }
  }
  const o = M.objects.find(o => o.x === ix && o.y === iy && (o.kind === 'orange' || (o.kind === 'furn' && o.act) || o.ride || o.lost));
  if (o) { walkPlayer(o.x + 0.5, o.y + 0.5, () => { G.ctxT = 0; }); return; }
  walkPlayer(tx, ty);
}
function walkPlayer(x, y, onArrive) {
  const P = G.player; G.pending = null;
  if (P.carried) { G.det.walkTo(x, y); G.tapMark = { x, y, t: 1 }; return; }
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
  P.walkTo(a.x, a.y); if (P.path.length) P.path.pop();
}
function pendingUpdate(dt) {
  const pd = G.pending; if (!pd) return;
  const P = G.player;
  if (!pd.a.visible || pd.a.map !== P.map) { G.pending = null; return; }
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
  const ok = (x, y) => [[0.25, 0.25], [-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25]].every(([a, b]) => walkable(Math.floor(x + a), Math.floor(y + b)));
  const ox = P.x, oy = P.y;
  if (ok(P.x + mx * sp, P.y)) P.x += mx * sp;
  if (ok(P.x, P.y + my * sp)) P.y += my * sp;
  P.faceTo(mx, my); P.moving = true; P.anim += Math.hypot(P.x - ox, P.y - oy) * 3.4;
  return true;
}

/* ---------------- 바닥 타일 (화면에 보이는 것만 매 프레임) ---------------- */
const _tileC = new Map();
function compTile(m, x, y, f) {
  const se = season(), t = tileAt(x, y, m);
  if (t === T.WATER) {
    const wv = Math.floor(hash2(x, y, 1) * 4);
    const landN = (xx, yy) => { const tt = tileAt(xx, yy, m); return tt !== T.WATER && tt !== T.WOOD; };
    const fa = landN(x - 1, y) ? 1 : 0, fb = landN(x, y - 1) ? 1 : 0;
    const key = 'w' + wv + f + fa + fb + se;
    let c = _tileC.get(key);
    if (!c) {
      c = mkCanvas(32, 16); const g = c.getContext('2d'); g.drawImage(makeTile('water', wv, f, se), 0, 0);
      g.fillStyle = 'rgba(255,255,255,0.75)';
      if (fa) for (let X = 0; X < 16; X++) if ((X + f * 3) % 5 < 3) g.fillRect(X, 8 - Math.floor(X / 2) + 1, 1, 1);
      if (fb) for (let X = 16; X < 32; X++) if ((X + f * 3) % 5 < 3) g.fillRect(X, Math.floor((X - 16) / 2) + 1, 1, 1);
      _tileC.set(key, c);
    }
    return c;
  }
  const v = Math.floor(hash2(x, y, 2) * 8);
  const wat = (xx, yy) => tileAt(xx, yy, m) === T.WATER;
  const e1 = wat(x + 1, y) ? 1 : 0, e2 = wat(x, y + 1) ? 1 : 0, wp = t === T.WOOD && (wat(x + 1, y + 1) || e2) ? 1 : 0;
  const isR = t === T.PATH || t === T.ALLEY || t === T.BOARD || t === 14 || (t === T.SAND && m.id === 'island' && !m.noSandEdge);
  const gr = (xx, yy) => { const tt = tileAt(xx, yy, m); return tt === T.GRASS || tt === T.FLOWER || tt === T.HILL; };
  const tm = isR ? (gr(x - 1, y) ? 1 : 0) | (gr(x, y - 1) ? 2 : 0) | (gr(x + 1, y) ? 4 : 0) | (gr(x, y + 1) ? 8 : 0) : 0;
  const key = t + '_' + v + '_' + e1 + e2 + wp + se + '_' + tm;
  let c = _tileC.get(key);
  if (!c) {
    c = mkCanvas(32, 24); const g = c.getContext('2d');
    g.drawImage(makeTile(TILE_NAMES[t], v, 0, se), 0, 0);
    const edgeCol = t === T.WOOD || t === T.BOARD ? '#6e4a30' : t === T.SAND || t === T.PATH || t === T.ALLEY ? '#cfae72' : t === T.ROCK ? '#3b3e46' : '#9b7049';
    const edgeH = t === T.WOOD ? 3 : 5;
    if (e1) for (let X = 16; X < 32; X++) { const ye = 16 - Math.floor((X - 16) / 2); g.fillStyle = edgeCol; g.fillRect(X, ye - 1, 1, edgeH); g.fillStyle = shade(edgeCol, 0.8); g.fillRect(X, ye + edgeH - 2, 1, 1); }
    if (e2) for (let X = 0; X < 16; X++) { const ye = 8 + Math.floor(X / 2); g.fillStyle = shade(edgeCol, 1.1); g.fillRect(X, ye, 1, edgeH); g.fillStyle = shade(edgeCol, 0.8); g.fillRect(X, ye + edgeH - 1, 1, 1); }
    if (wp) { g.fillStyle = '#5a3a24'; g.fillRect(15, 15, 2, 6); }
    if (tm) { // 잔디와 길 사이 부드러운 전환 (가장자리에 풀 가닥)
      const SG = SEASON_GRASS[se] || SEASON_GRASS.summer, gc = SG[0], gd = SG[1];
      for (let px = 0; px < 32; px++) for (let py = 0; py < 16; py++) {
        if (!inDiamond(px, py)) continue; const [u, vv] = tileUV(px, py); const n = hash2(px + v * 7, py, 9);
        const near = ((tm & 1) && u < 0.16) || ((tm & 2) && vv < 0.16) || ((tm & 4) && u > 0.84) || ((tm & 8) && vv > 0.84);
        const near2 = ((tm & 1) && u < 0.07) || ((tm & 2) && vv < 0.07) || ((tm & 4) && u > 0.93) || ((tm & 8) && vv > 0.93);
        if (near2 || (near && n < 0.45)) { g.fillStyle = n < 0.2 ? gd : gc; g.fillRect(px, py, 1, 1); }
      }
    }
    _tileC.set(key, c);
  }
  return c;
}
function drawTiles(g, m) {
  const inv = (wx, wy) => [(wx / 16 + wy / 8) / 2, (wy / 8 - wx / 16) / 2];
  const cx0 = G.cam.x - 32, cy0 = G.cam.y - 32, cx1 = G.cam.x + R.lw + 32, cy1 = G.cam.y + R.lh + 32;
  const cs = [inv(cx0, cy0), inv(cx1, cy0), inv(cx0, cy1), inv(cx1, cy1)];
  const x0 = Math.max(0, Math.floor(Math.min(...cs.map(c => c[0])))), x1 = Math.min(m.W - 1, Math.ceil(Math.max(...cs.map(c => c[0]))));
  const y0 = Math.max(0, Math.floor(Math.min(...cs.map(c => c[1])))), y1 = Math.min(m.H - 1, Math.ceil(Math.max(...cs.map(c => c[1]))));
  for (let pass = 0; pass < 2; pass++) {
    for (let s = x0 + y0; s <= x1 + y1; s++) {
      for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
        const y = s - x, t = m.tiles[y * m.W + x];
        if ((t === T.WATER) !== (pass === 0)) continue;
        const wx = (x - y) * 16 - 16, wy = (x + y) * 8;
        if (wx > cx1 || wx + 32 < cx0 || wy > cy1 || wy + 24 < cy0) continue;
        const c = compTile(m, x, y, G.waterFrame);
        const X = SX(wx), Y = SY(wy);
        g.drawImage(c, X, Y, SX(wx + 32) - X, SY(wy + c.height) - Y);
      }
    }
  }
}

/* ---------------- 섬 지도 (접어 두었다가 누르면 크게) ---------------- */
const BIGMAP = { key: '', s: 3 };
function buildBigMap() {
  const m = MAPS.island, s = BIGMAP.s, key = season();
  if (BIGMAP.key === key && BIGMAP.base) return;
  const W = (m.W + m.H) * s, H = (m.W + m.H) * s / 2 + 8;
  const c = mkCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = season() === 'winter' ? '#5f9fd0' : '#7fc4e8'; g.fillRect(0, 0, W, H);
  const se = season();
  const cols = { [T.SAND]: '#f1dca6', [T.GRASS]: se === 'winter' ? '#eef3f7' : se === 'autumn' ? '#c9bd6a' : se === 'spring' ? '#a8dc78' : '#8ccb64', [T.PATH]: '#fff6e0', [T.ALLEY]: '#efe2c8', [T.BOARD]: '#d9b98a', [T.WOOD]: '#b37e50', [T.FLOWER]: se === 'spring' ? '#f2d84a' : se === 'winter' ? '#d9404f' : '#c9a0e8', [T.HILL]: se === 'winter' ? '#e4ecf2' : '#6fb04f', [T.ROCK]: '#5b5f69', [T.POND]: '#4c9db4' };
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
    const t = m.tiles[y * m.W + x]; if (t === T.WATER) continue;
    g.fillStyle = cols[t] || '#8ccb64';
    const X = (x - y + m.H) * s, Y = (x + y) * s / 2 + 4;
    g.fillRect(Math.round(X - s), Math.round(Y), s * 2, Math.ceil(s / 2) + 1);
  }
  for (const o of m.objects) if (o.kind === 'tree' || o.kind === 'palm' || o.kind === 'orange') { g.fillStyle = o.kind === 'orange' ? '#3f8f45' : se === 'autumn' ? '#d9843a' : se === 'winter' ? '#9fb8a8' : '#3f8f45'; const X = (o.x - o.y + m.H) * s, Y = (o.x + o.y) * s / 2 + 4; g.fillRect(X - 1, Y - 2, 3, 3); }
  for (const b of m.buildings) { g.fillStyle = b.roof || '#d9473f'; const X = (b.x - b.y - b.h + m.H) * s, Y = (b.x + b.y) * s / 2 + 4; g.fillRect(X, Y - 3, (b.w + b.h) * s, (b.w + b.h) * s / 2 + 3); }
  BIGMAP.base = c; BIGMAP.key = key;
}
function openBigMap() {
  if (!S || G.busy) return;
  buildBigMap();
  BIGMAP.zoom = BIGMAP.zoom || 1;
  drawBigMap();
  $('#mapView').classList.remove('hidden'); G.screen = true;
  $('#mapHint').textContent = G.player.map === 'island' ? '가고 싶은 곳을 누르면 걸어가요 · 🚌 정류장에서 마을버스를 탈 수 있어요' : '지금은 섬 밖이나 건물 안이에요. 밖으로 나가면 지도를 눌러 이동할 수 있어요';
  const P = G.player;
  if (BIGMAP.zoom > 1 && P.map === 'island') { const w = $('.map-wrap'), c = $('#bigMap'); const [X, Y] = BIGMAP.at(P.x, P.y); w.scrollLeft = X / R.dpr - w.clientWidth / 2; w.scrollTop = Y / R.dpr - w.clientHeight / 2; void c; }
}
function drawBigMap() {
  const c = $('#bigMap'), m = MAPS.island, s = BIGMAP.s, base = BIGMAP.base;
  // 섬이 있는 부분만 잘라서 화면 너비에 맞춤
  const sx0 = 12 * s, sx1 = base.width - 12 * s, sy0 = 4 * s, sy1 = base.height - 6 * s;
  const gb = $('#game').getBoundingClientRect(), cssW = Math.min(gb.width - 20, 460), Z = BIGMAP.zoom;
  const cw = cssW * Z, ch = cw * (sy1 - sy0) / (sx1 - sx0);
  // 휴대폰 캔버스 한계(가로 4096px · 면적) 안으로 해상도를 맞춤 — 넘으면 지도가 깜빡이거나 하얗게 사라짐
  const D = BIGMAP.D = Math.max(1, Math.min(R.dpr, 4000 / cw, 4000 / ch, Math.sqrt(10e6 / (cw * ch))));
  c.style.width = cw + 'px'; c.style.height = ch + 'px';
  c.width = Math.round(cw * D); c.height = Math.round(ch * D);
  const k = c.width / (sx1 - sx0);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(base, sx0, sy0, sx1 - sx0, sy1 - sy0, 0, 0, c.width, c.height);
  const at = BIGMAP.at = (x, y) => [((x - y + m.H) * s - sx0) * k, ((x + y) * s / 2 + 4 - sy0) * k];
  BIGMAP.inv = (X, Y) => { const wx = X / k + sx0, wy = Y / k + sy0; const a = wx / s - m.H, b = (wy - 4) * 2 / s; return [(a + b) / 2, (b - a) / 2]; };
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const fs = (big) => (big ? 12.5 : 10.5) * D * Math.min(1.25, Z);
  const label = (x, y, text, big) => { const [X, Y] = at(x, y); g.font = `${fs(big)}px Jua, sans-serif`; const w = g.measureText(text).width + 8 * D, h = fs(big) + 6 * D; g.fillStyle = 'rgba(255,253,246,0.94)'; roundRect(g, X - w / 2, Y - h / 2, w, h, h / 2); g.fill(); g.strokeStyle = '#3a2533'; g.lineWidth = 1.2 * D; g.stroke(); g.fillStyle = '#3a2533'; g.fillText(text, X, Y + 0.5 * D); };
  const L = [['plaza', '해월 마을', 1], ['harbor', '동쪽 포구', 1], ['beach', '해수욕장', 1], ['farm', '귤 농장', 1], ['ranchIn', '조랑말 목장', 1], ['hill', '해월 언덕', 1], ['rocks', '갯바위', 0], ['forest', '동백숲', 1], ['lighthouse', '등대', 0], ['windmill', '풍차 언덕', 0], ['field', '꽃밭', 0]];
  if (Z > 1) L.push(['schoolFront', '학교', 0], ['cafeDoor', '카페', 0], ['police', '파출소', 0], ['homeDoor', '내 집', 0], ['hallFront', '회관', 0], ['sashimiDoor', '횟집', 0], ['storageDoor', '해녀창고', 0], ['sataekDoor', '사택', 0]);
  for (const [kk, t, big] of L) { const p = P_(kk); label(p[0], p[1] - (kk === 'plaza' && Z === 1 ? 5 : 0), t, big); }
  g.font = `${11 * D * Math.min(1.3, Z)}px sans-serif`;
  for (const p of Object.values(m.stops)) { const [X, Y] = at(p[0], p[1]); g.fillText('🚌', X, Y - 9 * D); }
  const ev = activeEvent(); if (ev) { const p = P_(ev.at); const [X, Y] = at(p[0], p[1]); g.font = `${16 * D}px sans-serif`; g.fillText('⭐', X + 14 * D, Y - 14 * D); }
  const P = G.player, here = P.map === 'island' ? [P.x, P.y] : P.map.startsWith('in_') ? ((m.buildings.find(b => 'in_' + b.id === P.map) || { doorTile: [62, 62] }).doorTile) : P_('boatSpot');
  const [X, Y] = at(here[0], here[1]);
  g.fillStyle = '#3a2533'; g.beginPath(); g.arc(X, Y, 6 * D, 0, 7); g.fill(); g.fillStyle = '#ff6f91'; g.beginPath(); g.arc(X, Y, 4.5 * D, 0, 7); g.fill();
  g.font = `${12 * D}px Jua, sans-serif`; g.fillStyle = '#ff6f91'; g.strokeStyle = '#ffffff'; g.lineWidth = 3 * D; g.strokeText('나', X, Y - 12 * D); g.fillText('나', X, Y - 12 * D);
  $('#mapZoom').textContent = Z > 1 ? '－ 전체 보기' : '＋ 확대해서 보기';
}
function closeBigMap() { $('#mapView').classList.add('hidden'); G.screen = false; }
function bigMapTap(e) {
  const c = $('#bigMap'), r = c.getBoundingClientRect(), m = MAPS.island;
  const [x, y] = BIGMAP.inv((e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height);
  closeBigMap();
  if (G.player.map === 'island' && !G.busy && !G.decor && inMap(Math.floor(x), Math.floor(y), m)) walkPlayer(x, y);
}
function toggleBigMapZoom() { BIGMAP.zoom = BIGMAP.zoom > 1.05 ? 1 : 2.4; openBigMap(); }
function drawMinimapBase() { }
function drawMinimap() { }
