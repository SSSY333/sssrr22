/* =====================================================================
   첫 화면 효과 — 표지 그림 위에 잔잔한 도트 움직임
   · 나무에서 잎이 천천히 떨어짐 · 수국 위 나비 · 가끔 지나가는 갈매기
   · 구름 그림자가 천천히 지나감 · 등대 불빛 · 가로등 불빛
   · 로고(등대 · 히비스커스 · 조개 · 불가사리 · 닻)와 바다에 반짝임 · 물결
   · 좌표는 표지 그림(998×1576) 기준 → 화면에 맞춰 자동 변환
   ===================================================================== */
const TFX = { on: false, c: null, g: null, t: 0, leaves: [], twinkles: [], flies: [], waves: [], gull: null, gullWait: 4, last: 0 };
const COVER = { w: 998, h: 1576 };
const TFX_POS = {
  trees: [[0, 330, 0, 110], [690, 998, 0, 100]],          // 잎이 떨어지는 나무 (x0, x1, y0, y1)
  flowers: [[150, 610], [930, 260], [610, 850], [380, 1360], [950, 1190]],
  lamps: [[130, 118, 44], [885, 380, 42]],
  lighthouse: [712, 290],
  glint: [[712, 290], [275, 350], [242, 525], [300, 570], [760, 570], [560, 572]],
  sea: [790, 998, 1400, 1576],
};
function tfxMap() {
  const r = $('#title').getBoundingClientRect(), s = Math.max(r.width / COVER.w, r.height / COVER.h);
  return { W: r.width, H: r.height, s, ox: (r.width - COVER.w * s) / 2, oy: 0 };
}
const tfxAt = (m, x, y) => [m.ox + x * m.s, m.oy + y * m.s];
const rnd = (a, b) => a + Math.random() * (b - a);
function tfxLeaf(scatter) {
  const T = TFX_POS.trees[Math.random() < 0.5 ? 0 : 1];
  return { x: rnd(T[0], T[1]), y: scatter ? rnd(0, 1300) : rnd(T[2], T[3]), vx: rnd(-6, 10), vy: rnd(14, 24), sw: rnd(0, 6), rot: Math.floor(rnd(0, 4)), col: ['#9fd45a', '#c9e46a', '#7cbf4a', '#e8d86a'][Math.floor(rnd(0, 4))], t: 0 };
}
function tfxInit() {
  if (TFX.c) return;
  const c = document.createElement('canvas'); c.id = 'titleFx'; $('#title').insertBefore(c, $('#title').firstChild);
  TFX.c = c; TFX.g = c.getContext('2d');
  for (let i = 0; i < 9; i++) TFX.leaves.push(tfxLeaf(true));
  TFX.flies = TFX_POS.flowers.slice(0, 4).map(([hx, hy], i) => ({ hx, hy, a: i * 1.7, x: hx, y: hy, col: ['#ffd23a', '#ff9ec4', '#8fd0ff', '#ffb35a'][i % 4] }));
  const S0 = TFX_POS.sea; for (let i = 0; i < 8; i++) TFX.waves.push({ x: rnd(S0[0], S0[1] - 30), y: rnd(S0[2] + 20, S0[3] - 10), ph: rnd(0, 6) });
  TFX.cloud = { x: -300, y: rnd(300, 900) };
}
function tfxFrame(ts) {
  const title = $('#title');
  if (!title || title.classList.contains('hidden')) { TFX.on = false; return; }
  requestAnimationFrame(tfxFrame);
  const dt = Math.min(0.05, ((ts - (TFX.last || ts)) / 1000) || 0.016); TFX.last = ts; TFX.t += dt;
  const m = tfxMap(), D = Math.min(2, window.devicePixelRatio || 1), c = TFX.c, g = TFX.g, t = TFX.t;
  if (c.width !== Math.round(m.W * D) || c.height !== Math.round(m.H * D)) { c.width = Math.round(m.W * D); c.height = Math.round(m.H * D); c.style.width = m.W + 'px'; c.style.height = m.H + 'px'; }
  g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, m.W, m.H); g.imageSmoothingEnabled = false;
  const px = Math.max(2, Math.round(m.s * 3.4));
  const dot = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const glow = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };

  // 구름 그림자: 아주 연하게, 천천히 왼쪽 위 → 오른쪽 아래
  const cl = TFX.cloud; cl.x += 9 * dt; cl.y += 4 * dt; if (cl.x > COVER.w + 320) { cl.x = -320; cl.y = rnd(250, 900); }
  { const [X, Y] = tfxAt(m, cl.x, cl.y), R = 260 * m.s; g.save(); g.translate(X, Y); g.scale(1.6, 0.8); const gr = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R); gr.addColorStop(0, 'rgba(40,60,90,0.10)'); gr.addColorStop(1, 'rgba(40,60,90,0)'); g.fillStyle = gr; g.fillRect(-R, -R, R * 2, R * 2); g.restore(); }

  // 가로등 · 등대 불빛 (숨 쉬듯)
  for (const [x, y, r] of TFX_POS.lamps) { const [X, Y] = tfxAt(m, x, y); glow(X, Y, r * m.s * (1 + 0.07 * Math.sin(t * 1.6 + x)), '255,228,150', 0.6); }
  { const [X, Y] = tfxAt(m, ...TFX_POS.lighthouse); glow(X, Y, 40 * m.s * (1 + 0.25 * Math.sin(t * 1.2)), '255,240,170', 0.7); }

  // 바다 물결
  for (const w of TFX.waves) {
    const [X, Y] = tfxAt(m, w.x + Math.sin(t * 0.7 + w.ph) * 9, w.y);
    if (X > m.W || Y > m.H) continue;
    g.globalAlpha = Math.max(0, 0.3 + 0.35 * Math.sin(t * 1.3 + w.ph));
    dot(X, Y, px * 4, px / 2, '#ffffff'); dot(X + px, Y - px / 2, px * 2, px / 2, '#e8fbff'); g.globalAlpha = 1;
  }
  // 반짝임: 바다(자주) · 로고(가끔)
  const S0 = TFX_POS.sea;
  if (Math.random() < dt * 2.2) TFX.twinkles.push({ x: rnd(S0[0], S0[1]), y: rnd(S0[2], S0[3]), t: 0, d: rnd(0.8, 1.3) });
  if (Math.random() < dt * 0.55) { const p = TFX_POS.glint[Math.floor(rnd(0, TFX_POS.glint.length))]; TFX.twinkles.push({ x: p[0] + rnd(-8, 8), y: p[1] + rnd(-8, 8), t: 0, d: 1.1, big: true }); }
  TFX.twinkles = TFX.twinkles.filter(k => (k.t += dt) < k.d);
  for (const k of TFX.twinkles) {
    const [X, Y] = tfxAt(m, k.x, k.y), f = Math.sin(Math.PI * k.t / k.d), L = Math.round((k.big ? 3 : 2) * f) * px / 2;
    if (L < 1) continue;
    g.globalAlpha = 0.9 * f + 0.1; dot(X - L, Y, L * 2 + px / 2, px / 2, '#ffffff'); dot(X, Y - L, px / 2, L * 2 + px / 2, '#ffffff'); dot(X - px / 4, Y - px / 4, px, px, k.big ? '#fff3b8' : '#e8fbff'); g.globalAlpha = 1;
  }
  // 나비 (수국 위를 천천히)
  { const bp = Math.max(2, Math.round(px * 1.1));
    for (const f of TFX.flies) {
      f.a += dt * 0.45;
      f.x = f.hx + Math.cos(f.a) * 30 + Math.sin(f.a * 2.1) * 8; f.y = f.hy - 18 + Math.sin(f.a * 1.4) * 14;
      const [X, Y] = tfxAt(m, f.x, f.y), flap = Math.floor(t * 6 + f.hx) % 2;
      if (X < -20 || X > m.W + 20 || Y > m.H) continue;
      const o = Math.max(1, Math.round(bp / 3)), wing = (x, y, w, h) => { dot(x - o, y - o, w + o * 2, h + o * 2, '#4a3030'); dot(x, y, w, h, f.col); dot(x + o, y + o, Math.max(1, w / 3), Math.max(1, h / 3), '#ffffff'); };
      const ww = flap ? 2 : 1;   // 날개를 폈다 접었다
      wing(X - bp * (ww + 0.9), Y - bp * 2, bp * ww, bp * 1.8); wing(X + bp * 0.9, Y - bp * 2, bp * ww, bp * 1.8);
      wing(X - bp * (ww * 0.7 + 0.9), Y + bp * 0.1, bp * ww * 0.7, bp * 1.1); wing(X + bp * 0.9, Y + bp * 0.1, bp * ww * 0.7, bp * 1.1);
      dot(X - bp * 0.35, Y - bp * 2.1, bp * 0.7, bp * 3.4, '#3a2a26');
    } }
  // 갈매기: 가끔 한 마리가 위쪽을 천천히 가로지름
  if (!TFX.gull) { TFX.gullWait -= dt; if (TFX.gullWait <= 0) { const ltr = Math.random() < 0.6; TFX.gull = { x: ltr ? -40 : COVER.w + 40, y: rnd(60, 260), vx: (ltr ? 1 : -1) * rnd(42, 58), ph: rnd(0, 6) }; } }
  else {
    const gl = TFX.gull; gl.x += gl.vx * dt; gl.y += Math.sin(t * 0.9 + gl.ph) * 6 * dt;
    if (gl.x < -60 || gl.x > COVER.w + 60) { TFX.gull = null; TFX.gullWait = rnd(10, 18); }
    else {
      const [X, Y] = tfxAt(m, gl.x, gl.y), q = Math.round(px * 1.4), up = Math.sin(t * 3 + gl.ph) > 0, dir = gl.vx > 0 ? 1 : -1;
      dot(X - q, Y, q * 3, q, '#ffffff'); dot(X + dir * q * 1.5, Y - q / 2, q, q, '#ffffff'); dot(X + dir * q * 2.4, Y - q / 4, q / 2, q / 2, '#f2b23a');
      if (up) { dot(X - q * 3, Y - q * 2, q * 2, q, '#f4f6f8'); dot(X + q, Y - q * 2, q * 2, q, '#f4f6f8'); dot(X - q * 3.5, Y - q * 2.5, q, q, '#8a95a5'); dot(X + q * 2.5, Y - q * 2.5, q, q, '#8a95a5'); }
      else { dot(X - q * 3, Y + q / 2, q * 2, q, '#e9edf2'); dot(X + q, Y + q / 2, q * 2, q, '#e9edf2'); }
    }
  }
  // 나뭇잎 (천천히 흔들리며 떨어짐)
  for (let i = 0; i < TFX.leaves.length; i++) {
    const p = TFX.leaves[i]; p.t += dt;
    p.x += (p.vx + Math.sin(t * 1.4 + p.sw) * 16) * dt; p.y += p.vy * dt;
    if (Math.floor(p.t * 2.5) !== Math.floor((p.t - dt) * 2.5)) p.rot = (p.rot + 1) % 4;
    const [X, Y] = tfxAt(m, p.x, p.y);
    if (p.y > COVER.h || Y > m.H || X < -20 || X > m.W + 20) { TFX.leaves[i] = tfxLeaf(false); continue; }
    const q = px * 1.5, a = Math.min(1, p.t * 1.5); g.globalAlpha = a;
    if (p.rot === 0) { dot(X, Y, q * 2, q, p.col); dot(X + q * 1.5, Y - q / 2, q / 2, q / 2, '#5a8a3a'); }
    else if (p.rot === 1) { dot(X, Y, q, q * 2, p.col); }
    else if (p.rot === 2) { dot(X, Y, q * 2, q, shade(p.col, 0.85)); }
    else dot(X, Y, q, q, p.col);
    g.globalAlpha = 1;
  }
}
function tfxStart() {
  const title = $('#title'); if (!title || title.classList.contains('hidden') || TFX.on) return;
  tfxInit(); TFX.on = true; TFX.last = 0; requestAnimationFrame(tfxFrame);
}
window.addEventListener('DOMContentLoaded', () => {
  tfxStart();
  new MutationObserver(() => tfxStart()).observe($('#title'), { attributes: true, attributeFilter: ['class'] });
});
