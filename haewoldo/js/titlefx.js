/* =====================================================================
   첫 화면 효과 — 표지 그림 위에 도트 느낌으로
   · 왼쪽 위 벚나무에서 꽃잎이 흩날림 · 수국 위 나비 · 바다 반짝임 · 물결
   · 로고(해 · 등대 · 나침반 · 펜)에 반짝 · 가로등 불빛이 은은하게
   · 좌표는 표지 그림(998×1576) 기준 → 화면에 맞춰 자동 변환
   ===================================================================== */
const TFX = { on: false, c: null, g: null, t: 0, petals: [], twinkles: [], flies: [], waves: [], last: 0 };
const COVER = { w: 998, h: 1576 };
function tfxMap() {
  const el = $('#title'), r = el.getBoundingClientRect(), s = Math.max(r.width / COVER.w, r.height / COVER.h);
  return { W: r.width, H: r.height, s, ox: (r.width - COVER.w * s) / 2, oy: 0 };
}
const tfxAt = (m, x, y) => [m.ox + x * m.s, m.oy + y * m.s];
function tfxInit() {
  if (TFX.c) return;
  const c = document.createElement('canvas'); c.id = 'titleFx'; $('#title').insertBefore(c, $('#title').firstChild);
  TFX.c = c; TFX.g = c.getContext('2d');
  for (let i = 0; i < 26; i++) TFX.petals.push(tfxPetal(true));
  TFX.flies = [{ hx: 120, hy: 540, a: 0 }, { hx: 905, hy: 215, a: 2 }, { hx: 930, hy: 1190, a: 4 }].map(f => Object.assign(f, { x: f.hx, y: f.hy, col: ['#ffffff', '#ffd35a', '#bfe3ff'][Math.floor(Math.random() * 3)] }));
  for (let i = 0; i < 7; i++) TFX.waves.push({ x: 780 + Math.random() * 220, y: 1440 + Math.random() * 130, ph: Math.random() * 6 });
}
function tfxPetal(scatter) {
  // 벚나무(왼쪽 위)에서 주로, 가끔 화면 위쪽 아무 데서나
  const fromTree = Math.random() < 0.75;
  return { x: fromTree ? Math.random() * 330 : Math.random() * 998, y: scatter ? Math.random() * 1500 : (fromTree ? Math.random() * 200 : -20), vx: 18 + Math.random() * 26, vy: 26 + Math.random() * 22, sw: Math.random() * 6, sz: Math.random() < 0.35 ? 3 : 2, rot: Math.floor(Math.random() * 4), col: ['#ffc6d9', '#ffb3cc', '#ffe0ea', '#f7a8c4'][Math.floor(Math.random() * 4)], life: 0 };
}
const TFX_GLINT = [[588, 238], [712, 292], [276, 510], [788, 432], [655, 520], [250, 435]];
const TFX_LAMPS = [[130, 150, 46], [885, 372, 44]];
function tfxFrame(ts) {
  const title = $('#title');
  if (!title || title.classList.contains('hidden')) { TFX.on = false; return; }
  requestAnimationFrame(tfxFrame);
  const dt = Math.min(0.05, ((ts - (TFX.last || ts)) / 1000) || 0.016); TFX.last = ts; TFX.t += dt;
  const m = tfxMap(), D = Math.min(2, window.devicePixelRatio || 1), c = TFX.c, g = TFX.g;
  if (c.width !== Math.round(m.W * D) || c.height !== Math.round(m.H * D)) { c.width = Math.round(m.W * D); c.height = Math.round(m.H * D); c.style.width = m.W + 'px'; c.style.height = m.H + 'px'; }
  g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, m.W, m.H); g.imageSmoothingEnabled = false;
  const px = Math.max(2, Math.round(m.s * 3.2)); // 도트 한 칸 크기
  const dot = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  // 가로등 불빛 (은은하게 숨 쉬듯)
  for (const [x, y, r] of TFX_LAMPS) {
    const [X, Y] = tfxAt(m, x, y), R = r * m.s * (1 + 0.08 * Math.sin(TFX.t * 2 + x));
    const gr = g.createRadialGradient(X, Y, 1, X, Y, R); gr.addColorStop(0, 'rgba(255,230,150,0.75)'); gr.addColorStop(1, 'rgba(255,230,150,0)');
    g.fillStyle = gr; g.fillRect(X - R, Y - R, R * 2, R * 2);
  }
  // 바다 물결 (하얀 짧은 선이 좌우로 일렁)
  for (const w of TFX.waves) {
    const [X, Y] = tfxAt(m, w.x + Math.sin(TFX.t * 0.8 + w.ph) * 8, w.y);
    if (X > m.W || Y > m.H) continue;
    const a = 0.35 + 0.35 * Math.sin(TFX.t * 1.6 + w.ph);
    g.globalAlpha = Math.max(0, a); dot(X, Y, px * 4, Math.max(1, px / 2), '#ffffff'); dot(X + px, Y - px / 2, px * 2, Math.max(1, px / 2), '#e8fbff'); g.globalAlpha = 1;
  }
  // 반짝임: 바다 위 무작위 + 로고의 해 · 등대 · 나침반 · 펜
  if (Math.random() < dt * 3.2) TFX.twinkles.push({ x: 800 + Math.random() * 190, y: 1420 + Math.random() * 150, t: 0, d: 0.7 + Math.random() * 0.5 });
  if (Math.random() < dt * 1.1) { const p = TFX_GLINT[Math.floor(Math.random() * TFX_GLINT.length)]; TFX.twinkles.push({ x: p[0] + (Math.random() - 0.5) * 14, y: p[1] + (Math.random() - 0.5) * 14, t: 0, d: 0.9, big: true }); }
  TFX.twinkles = TFX.twinkles.filter(k => (k.t += dt) < k.d);
  for (const k of TFX.twinkles) {
    const [X, Y] = tfxAt(m, k.x, k.y), f = Math.sin(Math.PI * k.t / k.d), L = Math.round((k.big ? 3 : 2) * f) * px / 2;
    if (L < 1) continue;
    g.globalAlpha = 0.95; dot(X - L, Y, L * 2 + px / 2, px / 2, '#ffffff'); dot(X, Y - L, px / 2, L * 2 + px / 2, '#ffffff'); dot(X - px / 2, Y - px / 2, px * 1.5, px * 1.5, k.big ? '#fff6c8' : '#e8fbff'); g.globalAlpha = 1;
  }
  // 나비 (수국 위를 팔랑팔랑)
  for (const f of TFX.flies) {
    f.a += dt * (0.6 + Math.sin(TFX.t * 0.3 + f.hx) * 0.2);
    f.x = f.hx + Math.cos(f.a) * 34 + Math.sin(f.a * 2.3) * 10; f.y = f.hy + Math.sin(f.a * 1.3) * 18 - 10;
    const [X, Y] = tfxAt(m, f.x, f.y), flap = Math.floor(TFX.t * 9 + f.hx) % 2, px0 = px; { const px = Math.round(px0 * 1.6);
    if (X < -20 || X > m.W + 20 || Y > m.H) continue;
    dot(X - px / 2, Y - px, px, px * 2, '#3a2a26');
    if (flap) { dot(X - px * 2.5, Y - px * 1.5, px * 2, px * 2, f.col); dot(X + px * 0.5, Y - px * 1.5, px * 2, px * 2, f.col); }
    else { dot(X - px * 1.5, Y - px * 1.5, px, px * 2, f.col); dot(X + px * 0.5, Y - px * 1.5, px, px * 2, f.col); } }
  }
  // 벚꽃잎 (흔들리며 오른쪽 아래로)
  for (let i = 0; i < TFX.petals.length; i++) {
    const p = TFX.petals[i]; p.life += dt;
    p.x += (p.vx + Math.sin(TFX.t * 2 + p.sw) * 22) * dt; p.y += p.vy * dt;
    if (Math.floor(p.life * 4) !== Math.floor((p.life - dt) * 4)) p.rot = (p.rot + 1) % 4;
    if (p.y > COVER.h + 20 || p.x > COVER.w + 20) { TFX.petals[i] = tfxPetal(false); continue; }
    const [X, Y] = tfxAt(m, p.x, p.y), q = px * p.sz;
    if (Y > m.H) { TFX.petals[i] = tfxPetal(false); continue; }
    // 4가지 모양을 번갈아 → 빙글빙글 도는 느낌
    if (p.rot === 0) { dot(X, Y, q * 2, q, p.col); dot(X + q / 2, Y - q / 2, q, q / 2 || 1, '#ffffff'); }
    else if (p.rot === 1) { dot(X, Y, q, q * 2, p.col); }
    else if (p.rot === 2) { dot(X, Y, q * 2, q, p.col); dot(X + q, Y + q, q / 2 || 1, q / 2 || 1, '#e98aa8'); }
    else { dot(X, Y, q, q, p.col); }
  }
}
function tfxStart() {
  const title = $('#title'); if (!title || title.classList.contains('hidden') || TFX.on) return;
  tfxInit(); TFX.on = true; TFX.last = 0; requestAnimationFrame(tfxFrame);
}
window.addEventListener('DOMContentLoaded', () => {
  tfxStart();
  // 「새로 시작」에서 돌아오는 등 첫 화면이 다시 보이면 다시 켬
  new MutationObserver(() => tfxStart()).observe($('#title'), { attributes: true, attributeFilter: ['class'] });
});
