'use strict';
/* =========================================================
 *  해월도 「느긋한 하루」 — 캠핑존 · 돗자리 · 정자 · 갯바위 낚시터 · 강만복
 *  모든 오브젝트는 쿼터뷰 블록 도트로 코드에서 그린다. 앉는 자리는 실제 좌석(점유 관리)으로 동작.
 * ========================================================= */
T.DIRT = 14; TILE_NAMES[14] = 'dirt';
const _makeTileL = makeTile;
makeTile = function (type, variant, frame = 0, season = 'summer') {
  if (type !== 'dirt') return _makeTileL(type, variant, frame, season);
  const c = mkCanvas(TW, TH), g = c.getContext('2d'), img = g.createImageData(TW, TH), a = img.data;
  for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
    if (!inDiamond(px, py)) continue; const n = hash2(px + variant * 31, py + variant * 17, 7);
    let col = n < 0.15 ? '#a8845a' : n > 0.9 ? '#d2b088' : '#c09a6c'; if (n > 0.97) col = '#8a6a48'; if (season === 'winter' && n > 0.75) col = '#f2f6f9';
    const [r, gg, b] = hexRgb(col), i = (py * TW + px) * 4; a[i] = r; a[i + 1] = gg; a[i + 2] = b; a[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
};

/* ---------------- 스프라이트 ---------------- */
function blockSprite(blocks, W, D, rot = 0, extra, pad = 6) {
  const [X, Y] = (rot & 1) ? [D, W] : [W, D];
  const maxH = Math.max(10, ...blocks.map(b => b[5])) + (extra ? 16 : 0);
  const c = mkCanvas((X + Y) * 16 + pad * 2, (X + Y) * 8 + maxH + pad * 2), g = c.getContext('2d'), ox = Y * 16 + pad, oy = maxH + pad;
  drawBlocks(g, ox, oy, blocks, W, D, rot);
  if (extra) extra(g, (x, y, z) => [ox + (x - y) * 16, oy + (x + y) * 8 - z], ox, oy);
  autoOutline(c, '#3a2a26');
  return { c, ax: ox, ay: oy + 8 };
}
const LSPR = {
  tent: (v) => blockSprite([], 2, 2, 0, (g, P) => {
    const cl = v ? ['#f4ead6', '#e0d2b4', '#c9b894'] : ['#efe4cc', '#d9c9a6', '#c2ae88'];
    fillPoly(g, [P(0.15, 1.85, 0), P(1.85, 1.85, 0), P(1.85, 1.0, 24), P(0.15, 1.0, 24)], cl[0]);
    fillPoly(g, [P(1.85, 0.15, 0), P(1.85, 1.85, 0), P(1.85, 1.0, 24)], cl[1]);
    fillPoly(g, [P(1.85, 0.6, 0), P(1.85, 1.4, 0), P(1.85, 1.0, 13)], '#6a5a48');
    for (let i = 1; i < 4; i++) { const t = i / 4; const a = P(0.15 + 1.7 * t, 1.85, 0), b = P(0.15 + 1.7 * t, 1.0, 24); g.fillStyle = cl[2]; for (let k = 0; k <= 10; k++) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * k / 10), Math.round(a[1] + (b[1] - a[1]) * k / 10), 1, 1); }
    g.fillStyle = '#8a6a48'; const t1 = P(0.15, 1.0, 24), t2 = P(1.85, 1.0, 24); g.fillRect(t1[0], t1[1] - 3, 1, 4); g.fillRect(t2[0], t2[1] - 3, 1, 4);
    g.fillStyle = v ? '#e3615a' : '#3f8f6a'; const fl = P(1.85, 1.0, 24); g.fillRect(fl[0], fl[1] - 6, 4, 2);
  }),
  campChair: (rot) => blockSprite([..._legs(0.22, 0.22, 0.78, 0.78, 6, '#5b5f69', 0.07), _blk(0.18, 0.24, 0.82, 0.8, 6, 8, '#3f8f6a', '#2f7a58', '#2a6a4c'), _blk(0.18, 0.18, 0.82, 0.3, 8, 19, '#4fa07a', '#3f8f6a', '#2f7a58'), _blk(0.14, 0.3, 0.2, 0.8, 9, 11, '#5b5f69'), _blk(0.8, 0.3, 0.86, 0.8, 9, 11, '#5b5f69')], 1, 1, rot),
  campTable: () => blockSprite([..._legs(0.14, 0.2, 0.86, 0.8, 7, '#7a5236'), _blk(0.1, 0.16, 0.9, 0.84, 7, 9, '#d7a874', '#b98a58', '#a87a4a'), _blk(0.2, 0.35, 0.34, 0.5, 9, 17, '#c0392b', '#a83228', '#902a22'), _blk(0.2, 0.35, 0.34, 0.5, 17, 18, '#d9d6dd'), _blk(0.5, 0.4, 0.62, 0.52, 9, 13, '#f4efe6'), _blk(0.68, 0.55, 0.8, 0.67, 9, 13, '#8fc3ea')], 1, 1, 0),
  woodbox: () => blockSprite([_blk(0.15, 0.25, 0.85, 0.8, 0, 9, '#8a5a3a', '#74492f', '#5f3b25'), _blk(0.2, 0.3, 0.8, 0.45, 9, 12, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.2, 0.5, 0.8, 0.65, 9, 12, '#b98a58', '#a07040', '#8a5f38'), _blk(0.35, 0.38, 0.65, 0.55, 12, 15, '#c99a64')], 1, 1, 0),
  icebox: () => blockSprite([_blk(0.2, 0.3, 0.8, 0.75, 0, 9, '#3f8ae0', '#2f6fb5', '#265b8a'), _blk(0.18, 0.28, 0.82, 0.77, 9, 11, '#f4f6fb'), _blk(0.42, 0.45, 0.58, 0.58, 11, 13, '#9aa3b0')], 1, 1, 0),
  basket: () => blockSprite([_blk(0.28, 0.35, 0.72, 0.7, 0, 7, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.3, 0.37, 0.7, 0.68, 7, 8, '#e3615a'), _blk(0.3, 0.5, 0.7, 0.53, 8, 13, '#8a5f38')], 1, 1, 0),
  campLantern: (lit) => blockSprite([_blk(0.45, 0.45, 0.55, 0.55, 0, 24, '#5b5f69'), _blk(0.35, 0.45, 0.55, 0.52, 22, 24, '#5b5f69'), _blk(0.3, 0.42, 0.44, 0.56, 13, 21, lit ? '#fff1a0' : '#e9e4da', lit ? '#f2dc6a' : '#cfc8b8', lit ? '#e0c55a' : '#b9b2a2'), _blk(0.28, 0.4, 0.46, 0.58, 21, 22, '#3a3a48')], 1, 1, 0),
  campfire: (on, fr) => blockSprite([_blk(0.15, 0.4, 0.3, 0.6, 0, 3, '#9aa3b0'), _blk(0.7, 0.4, 0.85, 0.6, 0, 3, '#8a929e'), _blk(0.4, 0.15, 0.6, 0.3, 0, 3, '#9aa3b0'), _blk(0.4, 0.7, 0.6, 0.85, 0, 3, '#8a929e'), _blk(0.25, 0.25, 0.3, 0.35, 0, 3, '#a9b0ba'), _blk(0.7, 0.7, 0.75, 0.8, 0, 3, '#a9b0ba'), _blk(0.3, 0.45, 0.7, 0.55, 2, 4, '#7a4e33'), _blk(0.45, 0.3, 0.55, 0.7, 3, 5, '#6a4229')], 1, 1, 0, (g, P) => {
    const [x, y] = P(0.5, 0.5, 5);
    if (!on) { g.fillStyle = '#5b5f69'; g.fillRect(x - 3, y - 1, 6, 1); return; }
    const f = fr % 2, cols = ['#e3484a', '#f39a2b', '#ffd77a'];
    fillPoly(g, [[x - 5, y], [x + 5, y], [x + 2 + f, y - 10], [x, y - 14 - f], [x - 2, y - 9]], cols[0]);
    fillPoly(g, [[x - 3, y], [x + 3, y], [x + 1, y - 8 - f], [x - 1, y - 6]], cols[1]);
    g.fillStyle = cols[2]; g.fillRect(x - 1, y - 4, 2, 4); g.fillRect(x + (f ? 2 : -3), y - 12, 1, 1);
  }),
  mat: (four) => {
    const W = 2, D = four ? 2 : 1;
    return blockSprite([_blk(0.5, 0.1, 0.8, 0.35, 1, 7, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.52, 0.12, 0.78, 0.33, 7, 8, '#ffffff'), _blk(1.2, 0.15, 1.38, 0.3, 1, 5, '#8fc3ea'), _blk(1.42, 0.18, 1.58, 0.32, 1, 6, '#f2d06a')], W, D, 0, (g, P) => {
      const cA = four ? '#7fa3e6' : '#e3615a', cB = '#f4efe6';
      const n = 6;
      for (let i = 0; i < n * W / 2 * 2; i++) for (let j = 0; j < n * D / 2 * 2; j++) {
        const u0 = 0.04 + i * (W - 0.08) / (n * W), v0 = 0.04 + j * (D - 0.08) / (n * D), u1 = u0 + (W - 0.08) / (n * W), v1 = v0 + (D - 0.08) / (n * D);
        if (u1 > W || v1 > D) continue;
        fillPoly(g, [P(u0, v0, 1), P(u1, v0, 1), P(u1, v1, 1), P(u0, v1, 1)], (i + j) % 2 ? cA : cB);
      }
      const plate = P(1.0, D - 0.45, 1.5); fillEllipse(g, plate[0], plate[1], 4, 2, '#ffffff'); g.fillStyle = '#f39a2b'; g.fillRect(plate[0] - 2, plate[1] - 1, 2, 1); g.fillStyle = '#e3484a'; g.fillRect(plate[0] + 1, plate[1] - 1, 1, 1);
      const fl = P(0.2, 0.25, 1.5); fillEllipse(g, fl[0], fl[1], 2, 2, '#f7b9c9'); g.fillStyle = '#4f8a3a'; g.fillRect(fl[0] + 2, fl[1], 1, 2);
    });
  },
  cushion2: () => blockSprite([_blk(0.25, 0.25, 0.75, 0.75, 0, 3, '#f7b9c9', '#e39fb2', '#cf8a9e')], 1, 1, 0),
  rodHolder: () => blockSprite([_blk(0.35, 0.35, 0.65, 0.65, 0, 5, '#5b5f69'), _blk(0.45, 0.45, 0.55, 0.55, 5, 12, '#7a7e88')], 1, 1, 0, (g, P) => {
    for (const [dy, len] of [[0.25, 1], [0.6, 0.85]]) { const a = P(0.5, 0.5 + dy * 0.3, 12), b = P(-0.7 * len, 0.5 + dy, 24); g.fillStyle = '#3a2a26'; for (let k = 0; k <= 30; k++) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * k / 30), Math.round(a[1] + (b[1] - a[1]) * k / 30), 1, 1); g.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 10; k++) g.fillRect(b[0] - k, b[1] + k * 2, 1, 1); }
  }, 22),
  fishChair: (rot) => blockSprite([..._legs(0.22, 0.22, 0.78, 0.78, 6, '#5b5f69', 0.07), _blk(0.18, 0.24, 0.82, 0.8, 6, 8, '#3f6fb5', '#2f5a9a', '#264a80'), _blk(0.18, 0.18, 0.82, 0.3, 8, 18, '#4f7fc5', '#3f6fb5', '#2f5a9a'), _blk(0.3, 0.17, 0.7, 0.2, 13, 17, '#ffffff')], 1, 1, rot),
  tackle: () => blockSprite([_blk(0.2, 0.3, 0.8, 0.7, 0, 7, '#3f8f6a', '#2f7a58', '#2a6a4c'), _blk(0.22, 0.32, 0.78, 0.68, 7, 8, '#5aa880'), _blk(0.42, 0.45, 0.58, 0.55, 8, 11, '#5b5f69'), _blk(0.2, 0.69, 0.8, 0.71, 3, 4, '#f2d06a')], 1, 1, 0),
  bait: () => blockSprite([_blk(0.32, 0.32, 0.68, 0.68, 0, 7, '#f2d06a', '#d9b44f', '#c49f3f'), _blk(0.35, 0.35, 0.65, 0.65, 7, 8, '#7a5236'), _blk(0.45, 0.5, 0.55, 0.56, 8, 9, '#e88aa4')], 1, 1, 0),
  net: () => blockSprite([_blk(0.47, 0.47, 0.53, 0.53, 0, 20, '#a87a4a')], 1, 1, 0, (g, P) => { const c0 = P(0.5, 0.5, 24); fillEllipse(g, c0[0], c0[1], 5, 3, '#d9e3ec'); fillEllipse(g, c0[0], c0[1], 3, 2, 'rgba(0,0,0,0)'); g.fillStyle = '#9aa3b0'; for (let i = -4; i <= 4; i += 2) g.fillRect(c0[0] + i, c0[1] - 1, 1, 3); }),
  keeper: () => blockSprite([_blk(0.3, 0.3, 0.7, 0.7, 0, 12, '#5aa880', '#3f8f6a', '#2f7a58'), _blk(0.3, 0.3, 0.7, 0.7, 12, 13, '#2f7a58'), _blk(0.36, 0.69, 0.64, 0.71, 3, 10, '#8fd6b8')], 1, 1, 0),
  bucket: () => blockSprite([_blk(0.32, 0.32, 0.68, 0.68, 0, 8, '#e3615a', '#c9484a', '#b33c3e'), _blk(0.35, 0.35, 0.65, 0.65, 8, 8.5, '#7fc4e8')], 1, 1, 0),
  fbag: () => blockSprite([_blk(0.1, 0.4, 0.9, 0.6, 0, 5, '#4b5568', '#3b4558', '#2f3748'), _blk(0.4, 0.4, 0.6, 0.6, 5, 7, '#7a7e88')], 1, 1, 0),
  thermos: () => blockSprite([_blk(0.42, 0.42, 0.58, 0.58, 0, 11, '#c0392b', '#a83228', '#902a22'), _blk(0.42, 0.42, 0.58, 0.58, 11, 13, '#d9d6dd'), _blk(0.6, 0.45, 0.72, 0.57, 0, 4, '#f4efe6')], 1, 1, 0),
  fparasol: () => blockSprite([_blk(0.47, 0.47, 0.53, 0.53, 0, 26, '#d9d6dd')], 1, 1, 0, (g, P) => { const c0 = P(0.5, 0.5, 28); for (let i = 0; i < 6; i++) fillPoly(g, [[c0[0], c0[1] - 6], [c0[0] - 15 + i * 5, c0[1] + 2], [c0[0] - 10 + i * 5, c0[1] + 2]], i % 2 ? '#ffffff' : '#3f6fb5'); }),
  safetySign: () => blockSprite([_blk(0.45, 0.47, 0.55, 0.53, 0, 14, '#7a7e88'), _blk(0.2, 0.45, 0.8, 0.55, 14, 26, '#f2d06a', '#d9b44f', '#c49f3f')], 1, 1, 0, (g, P) => { const a = P(0.5, 0.55, 22); g.fillStyle = '#e3484a'; g.fillRect(a[0] - 4, a[1] - 3, 8, 2); g.fillStyle = '#2b2026'; g.fillRect(a[0] - 3, a[1] + 1, 6, 1); g.fillRect(a[0] - 2, a[1] + 3, 4, 1); }),
  woodSign: () => blockSprite([_blk(0.45, 0.47, 0.55, 0.53, 0, 14, '#7a5236'), _blk(0.15, 0.45, 0.85, 0.55, 14, 24, '#c99a64', '#a87a4a', '#8a5f38')], 1, 1, 0, (g, P) => { const a = P(0.5, 0.55, 20); g.fillStyle = '#5f3b25'; g.fillRect(a[0] - 5, a[1] - 2, 10, 1); g.fillRect(a[0] - 3, a[1] + 1, 6, 1); }),
  /* 정자: 마루(아래) + 기둥·지붕(위)을 따로 그려 캐릭터가 마루 위·지붕 아래에 자연스럽게 */
  jeongjaBase: () => blockSprite([_blk(0.05, 0.05, 2.95, 2.95, 0, 4, '#b9b2a2', '#9c9484', '#857d6e'), _blk(0.15, 0.15, 2.85, 2.85, 4, 9, '#c99a64', '#a87a4a', '#8a5f38'), _blk(0.15, 0.15, 2.85, 2.85, 9, 10, '#d7a874'), _blk(0.9, 2.62, 2.1, 2.98, 0, 4, '#c99a64', '#a87a4a', '#8a5f38')], 3, 3, 0, (g, P) => { g.fillStyle = '#b98a58'; for (let i = 1; i < 6; i++) { const a = P(0.15 + i * 0.45, 0.15, 10), b = P(0.15 + i * 0.45, 2.85, 10); for (let k = 0; k <= 20; k++) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * k / 20), Math.round(a[1] + (b[1] - a[1]) * k / 20), 1, 1); } }),
  jeongjaRoof: () => {
    const post = (x, y) => _blk(x, y, x + 0.16, y + 0.16, 10, 40, '#8a5a3a', '#74492f', '#5f3b25');
    return blockSprite([post(0.2, 0.2), post(2.64, 0.2), post(0.2, 2.64), post(2.64, 2.64), _blk(0.2, 0.2, 2.8, 0.36, 36, 40, '#a0522d', '#8a4526', '#743a20'), _blk(0.2, 2.64, 2.8, 2.8, 36, 40, '#a0522d', '#8a4526', '#743a20'), _blk(0.2, 0.2, 0.36, 2.8, 36, 40, '#a0522d', '#8a4526', '#743a20'), _blk(2.64, 0.2, 2.8, 2.8, 36, 40, '#a0522d', '#8a4526', '#743a20')], 3, 3, 0, (g, P) => {
      const e = -0.45, E2 = 3.45, z0 = 41, zr = 60;
      const A = P(e, e, z0), B = P(E2, e, z0), C = P(E2, E2, z0), Dd = P(e, E2, z0), R1 = P(1.1, 1.5, zr), R2 = P(1.9, 1.5, zr);
      fillPoly(g, [A, B, R2, R1], '#3e4656'); fillPoly(g, [A, Dd, R1], '#3e4656');
      fillPoly(g, [Dd, C, R2, R1], '#5a6478'); fillPoly(g, [C, B, R2], '#4a5266');
      g.fillStyle = '#6f7a90';
      for (let i = 1; i <= 4; i++) { const t = i / 5; const a = [Dd[0] + (R1[0] - Dd[0]) * t, Dd[1] + (R1[1] - Dd[1]) * t], b = [C[0] + (R2[0] - C[0]) * t, C[1] + (R2[1] - C[1]) * t]; for (let k = 0; k <= 40; k++) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * k / 40), Math.round(a[1] + (b[1] - a[1]) * k / 40), 1, 1); const c2 = [C[0] + (R2[0] - C[0]) * t, C[1] + (R2[1] - C[1]) * t], d2 = [B[0] + (R2[0] - B[0]) * t, B[1] + (R2[1] - B[1]) * t]; for (let k = 0; k <= 30; k++) g.fillRect(Math.round(c2[0] + (d2[0] - c2[0]) * k / 30), Math.round(c2[1] + (d2[1] - c2[1]) * k / 30), 1, 1); }
      g.fillStyle = '#8a5a3a'; for (let k = 0; k <= 60; k++) { g.fillRect(Math.round(Dd[0] + (C[0] - Dd[0]) * k / 60), Math.round(Dd[1] + (C[1] - Dd[1]) * k / 60) + 1, 1, 2); g.fillRect(Math.round(C[0] + (B[0] - C[0]) * k / 60), Math.round(C[1] + (B[1] - C[1]) * k / 60) + 1, 1, 2); }
      g.fillStyle = '#2f3542'; for (let k = 0; k <= 20; k++) g.fillRect(Math.round(R1[0] + (R2[0] - R1[0]) * k / 20), Math.round(R1[1] + (R2[1] - R1[1]) * k / 20) - 1, 1, 2);
      for (const p of [Dd, C, B]) { g.fillStyle = '#5a6478'; g.fillRect(p[0] - 1, p[1] - 3, 3, 2); }
    }, 18);
  },
};
function _legs(u0, v0, u1, v1, h, col, t = 0.09) { return legs(u0, v0, u1, v1, h, col, t); }

/* 오브젝트 그림 */
const _objSpriteL = objSprite;
objSprite = function (o) {
  if (!LSPR[o.kind]) return _objSpriteL(o);
  let key = 'L' + o.kind + (o.rot || 0) + (o.v || 0), arg = o.rot || 0;
  if (o.kind === 'campfire') { const on = leisureFireOn(); key += on ? 'on' + (Math.floor(G.t * 5) % 2) : 'off'; return R.objSpr[key] || (R.objSpr[key] = LSPR.campfire(on, Math.floor(G.t * 5) % 2)); }
  if (o.kind === 'campLantern') { const lit = S && (daylight(S.min).night > 0.3 || S.min >= 18 * 60); key += lit ? 'l' : ''; arg = lit; }
  if (o.kind === 'mat') arg = !!o.four;
  if (o.kind === 'tent') arg = o.v || 0;
  return R.objSpr[key] || (R.objSpr[key] = LSPR[o.kind](arg));
};
function leisureFireOn() {
  if (!S || S.weather === 'rain' || S.weather === 'storm' || S.weather === 'snow') return false;
  if (S.min < 17.5 * 60 && S.min > 6 * 60) return false;
  return G.actors.some(a => a.visible && a.seat && a.seat.bench === 'camp') || (G.player.map === 'island' && Math.hypot(G.player.x - 28.5, G.player.y - 57.5) < 3.6);
}

/* ---------------- 지도에 배치 ---------------- */
const LEISURE_KINDS = { camp: '캠핑 의자', picnicA: '바닷가 돗자리', picnicB: '큰 돗자리', pavilion: '동백숲 정자', fishchair: '갯바위 낚시 의자' };
function leisureBuild() {
  const m = MAPS.island, W = m.W;
  const setT = (x, y, t) => { if (inMap(x, y, m)) m.tiles[y * W + x] = t; };
  const clear = (x0, y0, x1, y1) => { m.objects = m.objects.filter(o => { const inn = o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1; if (inn && !o.water) { m.block[o.y * W + o.x] = 0; return false; } return true; }); };
  const put = (kind, x, y, extra = {}) => { const o = Object.assign({ kind, x, y, solid: extra.solid !== false }, extra); m.objects.push(o); if (o.solid) for (let yy = y; yy < y + (o.fh || 1); yy++) for (let xx = x; xx < x + (o.fw || 1); xx++) m.block[yy * W + xx] = 1; return o; };
  const blockT = (x, y) => { m.block[y * W + x] = 1; };
  /* 1) 캠핑존 — 마을 서쪽 풀밭. 텐트 구역(위) · 휴식 구역(왼쪽 아래) · 바비큐 구역(오른쪽 아래) · 가운데 흙길 */
  const CX0 = 25, CY0 = 50, CX1 = 37, CY1 = 61;
  clear(CX0, CY0, CX1, CY1);
  for (let y = CY0; y <= CY1; y++) for (let x = CX0; x <= CX1; x++) if (!isRoadT(tileAt(x, y, m))) setT(x, y, T.GRASS);
  // 흙길: 출입구(아래) → 가운데 → 양쪽 텐트, 텐트 아래 평탄한 흙바닥
  for (let y = 54; y <= CY1 + 1; y++) setT(31, y, T.DIRT);
  for (let x = 26; x <= 36; x++) setT(x, 54, T.DIRT);
  for (const [x0, y0] of [[26, 51], [34, 51]]) for (let y = y0; y <= y0 + 2; y++) for (let x = x0 - 1; x <= x0 + 2; x++) setT(x, y, T.DIRT);
  // 휴식 구역 화로 주변 흙바닥, 바비큐 구역 돌바닥
  for (let y = 56; y <= 59; y++) for (let x = 26; x <= 29; x++) if ((x + y) % 5) setT(x, y, T.DIRT);
  for (let y = 56; y <= 59; y++) for (let x = 33; x <= 36; x++) setT(x, y, T.ALLEY);
  for (const [x, y] of [[29, 52], [33, 52], [26, 60], [36, 60], [30, 51], [32, 51]]) setT(x, y, T.FLOWER);
  // 텐트 구역 — 입구는 모두 앞(아래) 방향
  put('tent', 26, 51, { fw: 2, fh: 2, v: 0, tent: 'A' }); put('tent', 34, 51, { fw: 2, fh: 2, v: 1, tent: 'B' });
  put('campLantern', 29, 53, { light: true }); put('campLantern', 33, 53, { light: true });
  // 휴식 구역 — 화로를 둘러싼 의자 4 · 작은 테이블 · 돗자리 · 화분
  put('campfire', 28, 57);
  put('campChair', 27, 57, { rot: 1, seatOf: 'camp' }); put('campChair', 29, 57, { rot: 3, seatOf: 'camp' }); put('campChair', 28, 56, { rot: 0, seatOf: 'camp' }); put('campChair', 28, 58, { rot: 2, seatOf: 'camp' });
  put('woodbox', 26, 56); put('campTable', 26, 59); put('pot', 30, 60); put('mat', 27, 60, { fw: 2, fh: 1, flat: true, solid: false, keyFix: 27 + 60 - 0.5 }); m.block[60 * W + 27] = 1; m.block[60 * W + 28] = 1;
  // 바비큐 구역 — 그릴 · 식탁 · 의자 · 식재료 보관함 · 작은 조명
  put('grill', 35, 57); put('campTable2', 33, 59, { fw: 2, fh: 1 }); put('icebox', 36, 59); put('campLantern', 36, 56, { light: true });
  put('campChair', 33, 58, { rot: 0, seatOf: 'bbq' }); put('campChair', 34, 58, { rot: 0, seatOf: 'bbq' });
  put('woodSign', 29, 62);
  // 울타리 — 모서리 자동 연결, 출입구(아래 가운데)는 비움
  for (let x = CX0; x <= CX1; x++) { put('fence2', x, CY0); if (x < 30 || x > 32) put('fence2', x, CY1); }
  for (let y = CY0 + 1; y < CY1; y++) { put('fence2', CX0, y); put('fence2', CX1, y); }
  m.benches.camp = { name: '캠핑 의자', place: 'camp', leisure: 'camp', seats: [[27, 57], [29, 57], [28, 56], [28, 58]], stand: [[26, 57], [30, 57], [28, 55], [28, 59]], face: [1, 3, 0, 2], behind: [0, 0, 0, 1], pairs: [[0, 2], [1, 2], [0, 3], [1, 3]] };
  m.benches.bbq = { name: '바비큐 식탁', place: 'camp', leisure: 'camp', seats: [[33, 58], [34, 58]], stand: [[33, 57], [34, 57]], face: [0, 0], pairs: [[0, 1]] };
  m.benches.campMat = { name: '캠핑 돗자리', place: 'camp', leisure: 'mat', seats: [[27, 60], [28, 60]], stand: [[27, 59], [29, 60]], face: [0, 0], ground: true, pairs: [[0, 1]] };
  POI.camp = [31.5, 59.5]; POI.campCenter = [31.5, 56.5]; POI.grillCook = [35.5, 58.5]; POI.tentA = [27.0, 53.5]; POI.tentB = [35.0, 53.5];
  /* 2) 돗자리 — 바다가 보이는 해변 위 잔디 */
  const CE = (x) => { let y = 64; while (inMap(x, y + 1, m) && tileAt(x, y + 1, m) !== T.WATER) y++; return y; };
  const findSpot = (w, h, xs) => { for (const x0 of xs) { const yb = CE(x0) - 11; for (let y0 = yb; y0 >= yb - 5; y0--) { let ok = true; for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) { const t = tileAt(x, y, m); if (!(t === T.GRASS || t === T.FLOWER || t === T.SAND) || m.buildings.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)) ok = false; } if (ok) return [x0, y0]; } } return null; };
  const sA = findSpot(2, 2, [70, 72, 68, 74, 66, 76, 54, 52]) || [70, CE(70) - 12];
  clear(sA[0] - 1, sA[1] - 1, sA[0] + 2, sA[1] + 2);
  put('mat', sA[0], sA[1], { fw: 2, fh: 1, flat: true, solid: false, keyFix: sA[0] + sA[1] - 0.5 });
  for (const s of [[sA[0], sA[1]], [sA[0] + 1, sA[1]]]) blockT(...s);
  m.benches.picnicA = { name: '바닷가 돗자리', place: 'picnic', leisure: 'mat', seats: [[sA[0], sA[1]], [sA[0] + 1, sA[1]]], stand: [[sA[0], sA[1] + 1], [sA[0] + 1, sA[1] + 1]], face: [0, 0], ground: true, pairs: [[0, 1]] };
  const sB = findSpot(2, 2, [sA[0] + 5, sA[0] + 7, sA[0] - 6, sA[0] - 8, 80, 60]) || [sA[0] + 5, sA[1]];
  clear(sB[0] - 1, sB[1] - 1, sB[0] + 2, sB[1] + 2);
  put('mat', sB[0], sB[1], { fw: 2, fh: 2, flat: true, solid: false, four: true, keyFix: sB[0] + sB[1] - 0.5 });
  for (const s of [[sB[0], sB[1]], [sB[0] + 1, sB[1]], [sB[0], sB[1] + 1], [sB[0] + 1, sB[1] + 1]]) blockT(...s);
  m.benches.picnicB = { name: '큰 돗자리', place: 'picnic', leisure: 'mat', seats: [[sB[0], sB[1] + 1], [sB[0] + 1, sB[1] + 1], [sB[0], sB[1]], [sB[0] + 1, sB[1]]], stand: [[sB[0], sB[1] + 2], [sB[0] + 1, sB[1] + 2], [sB[0] - 1, sB[1]], [sB[0] + 2, sB[1]]], face: [0, 0, 0, 0], ground: true, pairs: [[0, 1], [2, 3]] };
  POI.picnic = [sA[0] + 1, sA[1] + 1.5]; POI.picnicB = [sB[0] + 1, sB[1] + 2.5];
  put('pot', sA[0] + 3, sA[1] - 1);
  /* 3) 동백숲 정자 — 3×3 목조 정자로 다시 */
  m.objects = m.objects.filter(o => !(o.kind === 'pavilion' && o.x === 37 && o.y === 83) && !(o.kind === 'bench' && o.bench === 'pavilion'));
  clear(34, 81, 38, 85); for (let y = 81; y <= 86; y++) for (let x = 35; x <= 38; x++) if (m.block[y * W + x]) m.block[y * W + x] = 0;
  for (let y = 82; y <= 84; y++) for (let x = 35; x <= 37; x++) { setT(x, y, T.GRASS); blockT(x, y); }
  for (const x of [35, 36, 37]) setT(x, 85, T.ALLEY); setT(36, 86, T.ALLEY);
  put('jeongjaBase', 35, 82, { fw: 3, fh: 3, flat: true, solid: false, keyFix: 117.5 });
  put('jeongjaRoof', 35, 82, { fw: 3, fh: 3, solid: false, keyFix: 121.3 });
  put('flowerbed', 38, 85); put('flowerbed', 34, 81); put('woodSign', 38, 84);
  const roofKey = 35 + 82 + 2 + 2 + 0.3;
  m.benches.pavilion = { name: '동백숲 정자', place: 'pavilion', leisure: 'pavilion', seats: [[35, 84], [36, 84], [37, 84], [36, 83], [35, 83]], stand: [[35, 85], [36, 85], [37, 85], [36, 85], [35, 85]], face: [0, 0, 0, 0, 0], floor: true, d: [roofKey - 0.2, roofKey - 0.2, roofKey - 0.2, roofKey - 0.4, roofKey - 0.4], pairs: [[0, 1], [1, 2], [4, 3]] };
  /* 4) 갯바위 낚시터 꾸미기 */
  const WX = Math.floor(P_('rocksFish')[0]);
  const rk = [['rodHolder', WX, 59], ['fishChair', WX + 1, 60, { rot: 3, seatOf: 'fishchair' }], ['tackle', WX + 3, 59], ['bait', WX + 2, 59], ['icebox', WX + 2, 60, { solid: true }], ['thermos', WX + 3, 60], ['fparasol', WX + 4, 59], ['fishChair', WX + 1, 64, { rot: 3, seatOf: 'fishchair' }], ['rodHolder', WX, 65], ['net', WX + 3, 65], ['keeper', WX + 2, 65], ['bucket', WX + 3, 66], ['fbag', WX + 4, 65], ['safetySign', WX + 5, 63]];
  for (const [k, x, y, ex] of rk) { m.objects = m.objects.filter(o => !(o.x === x && o.y === y && !o.water)); if (tileAt(x, y, m) === T.WATER) setT(x, y, T.ROCK); put(k, x, y, ex || {}); }
  m.benches.fishchair = { name: '갯바위 낚시 의자', place: 'rocks', leisure: 'fish', seats: [[WX + 1, 60], [WX + 1, 64]], stand: [[WX + 2, 61], [WX + 2, 63]], face: [3, 3], pairs: [] };
  POI.manbokSeat = [WX + 1.5, 60.5];
  for (const bk of Object.values(m.benches)) if (bk.leisure) for (const s of bk.stand) { if (m.block[s[1] * W + s[0]]) m.block[s[1] * W + s[0]] = 0; if (tileAt(s[0], s[1], m) === T.WATER) setT(s[0], s[1], T.SAND); }
  // 장소 판정
  m.places.camp = { name: '캠핑존', test: (x, y) => x >= 25 && x <= 38 && y >= 50 && y <= 62 }; PLACE_DEFS.camp = { name: '캠핑존' };
  m.places.picnic = { name: '바닷가 돗자리', test: (x, y) => (x >= sA[0] - 1 && x <= sA[0] + 3 && y >= sA[1] - 1 && y <= sA[1] + 2) || (x >= sB[0] - 1 && x <= sB[0] + 3 && y >= sB[1] - 1 && y <= sB[1] + 3) }; PLACE_DEFS.picnic = { name: '바닷가 돗자리' };
  m.order = ['camp', 'picnic', ...m.order.filter(k => k !== 'camp' && k !== 'picnic')];
}
const _buildWorldL = buildWorld;
buildWorld = function () { _buildWorldL(); leisureBuild(); };
/* 렌더 순서: 정자 지붕은 앉은 사람 위, 앞을 지나는 사람 아래 */
const _setPortalL = typeof setPortalObjects === 'function' ? setPortalObjects : null;

/* ---------------- 좌석 점유 ---------------- */
G.seatOcc = {};
const seatKey = (map, b, i) => map + ':' + b + ':' + i;
function seatOwner(map, b, i) { return G.seatOcc[seatKey(map, b, i)] || null; }
function seatFree(map, b, i, who) { const o = seatOwner(map, b, i); if (!o || o === who) return true; const a = G.actors.find(x => x.id === o); const reserved = a && ((a.leis && a.leis.b === b && a.leis.i === i) || (a === G.det && G.detAuto && G.detAuto.kind === 'rest' && G.detAuto.b === b && G.detAuto.i === i)); if (reserved) return false; if (!a || !a.seat || a.seat.bench !== b || a.seat.idx !== i || a.map !== map || !a.visible) { delete G.seatOcc[seatKey(map, b, i)]; return true; } return false; }
const _sitAtL = Actor.prototype.sitAt;
Actor.prototype.sitAt = function (benchKey, idx) {
  const bk = MAPS[this.map].benches[benchKey];
  if (bk && !seatFree(this.map, benchKey, idx, this.id)) { const alt = bk.seats.findIndex((s, i) => seatFree(this.map, benchKey, i, this.id)); if (alt >= 0) idx = alt; }
  if (this.seat) this.standUp();
  _sitAtL.call(this, benchKey, idx);
  G.seatOcc[seatKey(this.map, benchKey, idx)] = this.id;
  if (bk && bk.face) { const f = bk.face[idx]; const v = [[0, 1], [1, 0], [0, -1], [-1, 0]][f]; this.faceTo(v[0], v[1]); }
};
const _standUpL = Actor.prototype.standUp;
Actor.prototype.standUp = function () {
  if (this.seat) { const k = seatKey(this.map, this.seat.bench, this.seat.idx); if (G.seatOcc[k] === this.id) delete G.seatOcc[k]; }
  this.lie = 0; this.ox = 0; this.oy = 0; this.prop = null; this.lean = false;
  _standUpL.call(this);
};
function freeSeats(b, map = 'island') { const bk = MAPS[map].benches[b]; return bk ? bk.seats.map((s, i) => i).filter(i => seatFree(map, b, i)) : []; }
function freePair(b, map = 'island') { const bk = MAPS[map].benches[b]; if (!bk) return null; for (const [i, j] of (bk.pairs || [])) if (seatFree(map, b, i) && seatFree(map, b, j)) return [i, j]; return null; }

/* ---------------- 캐릭터 그리기: 눕기 · 밀착 · 들고 있는 것 ---------------- */
const _drawActorL = drawActor;
drawActor = function (g, a, sx, sy) {
  if (a.pet) return _drawActorL(g, a, sx, sy);
  const X = sx + (a.ox || 0), Y = sy + (a.oy || 0);
  if (a.lie) {
    const px = SX(X), py = SY(Y - 10); g.save(); g.translate(px, py); g.rotate(a.lie * Math.PI / 2); g.translate(-px, -py);
    const pose = a.pose; a.pose = 'stand'; const seat = a.seat; a.seat = null; _drawActorL(g, a, X, Y + 4); a.pose = pose; a.seat = seat; g.restore();
    if (a.zzz) { g.font = `${10 * R.dpr}px sans-serif`; g.fillStyle = '#5b6b9a'; g.fillText('z', SX(X + 8), SY(Y - 18 - (G.t * 4 % 6))); }
  } else _drawActorL(g, a, X, Y);
  if (a.prop) { const c = propCanvas(a.prop); const hx = X + (a.left ? -7 : 7), hy = Y - (a.seat ? 18 : 14); g.drawImage(c, SX(hx - 4), SY(hy - 4), 8 * R.K, 8 * R.K); }
};
const _propC = {};
function propCanvas(k) { if (_propC[k]) return _propC[k]; const c = PX_ITEMS[k] ? pxCanvas((P, g) => PX_ITEMS[k](P, g)) : pxCanvas((P) => { P(5, 6, 6, 7, '#ffffff'); P(6, 7, 4, 2, '#a0522d'); P(11, 8, 2, 3, '#ffffff'); }); return (_propC[k] = c); }
/* 앉은 자리 렌더 순서 보정 (정자 · 등 돌린 의자) */
function seatDepth(a, m) { const bk = m.benches[a.seat.bench]; if (!bk) return null; if (bk.d) return bk.d[a.seat.idx]; const s = bk.seats[a.seat.idx]; if (bk.behind && bk.behind[a.seat.idx]) return s[0] + s[1] + 1.95; if (bk.ground) return s[0] + s[1] + 0.6; return null; }

/* ---------------- 휴식 행동 메뉴 ---------------- */
function leisureSeatOf(P) { return P.seat && M.benches[P.seat.bench] && M.benches[P.seat.bench].leisure ? P.seat.bench : null; }
const _benchActionL = benchAction;
benchAction = function (k) {
  const bk = M.benches[k];
  if (!bk || !bk.leisure) return _benchActionL(k);
  leisureMenu(k);
};
function isNight() { return S.min >= 19.5 * 60 || S.min < 5 * 60; }
function rainy() { return S.weather === 'rain' || S.weather === 'storm' || S.weather === 'snow'; }
function detNearby(r = 7) { const d = G.det; return S.rel.flags.met && d.visible && d.map === G.player.map && dist(d, G.player) < r && !d.scripted; }
function bothSeated(k) { const P = G.player, d = G.det; return P.seat && d.seat && P.seat.bench === k && d.seat.bench === k && d.map === P.map; }
function leisureMenu(k) {
  const bk = M.benches[k], P = G.player, st = S.rel.stage, kind = bk.leisure, seated = P.seat && P.seat.bench === k;
  if (kind !== 'pavilion' && rainy() && !M.interior) { toast(kind === 'camp' ? '🌧 비가 와서 캠핑존은 잠시 쉬어요. 화로도 꺼져 있어요' : '🌧 비가 와서 돗자리가 젖었어요. 맑은 날 와요'); return; }
  const items = [];
  const add = (icon, label, fn, ok = true, why) => items.push({ icon, label, onClick: fn, disabled: !ok, why });
  if (seated && bothSeated(k)) return coupleMenu(k);
  if (!seated) {
    add('🪑', bk.floor ? '마루에 앉기' : kind === 'mat' ? '돗자리에 앉기' : '앉기', () => leisureSit(k), freeSeats(k, M.id).length > 0, '자리가 다 찼어요');
    if (detNearby() && st >= 2) add('💞', kind === 'camp' && st >= 3 ? '형사님과 캠핑' : '함께 앉기', () => leisureSitTogether(k), !!freePair(k, M.id), '나란히 앉을 자리가 없어요');
  } else add('🧍', '일어나기', () => standUpPlayer());
  add('😌', '쉬기', () => leisureAct(k, 'rest'));
  add('🍙', '간식 먹기', () => leisureAct(k, 'snack'));
  if (kind === 'camp' || kind === 'pavilion') add('🍵', '차 마시기', () => leisureAct(k, 'tea'));
  if (kind === 'camp') add('🔥', '화로 앞에서 쉬기', () => leisureAct(k, 'fire'), leisureFireReady(), '저녁이 되면 화로에 불을 붙일 수 있어요');
  if (kind !== 'fish') add('🌌', '밤하늘 보기', () => leisureAct(k, 'stars'), isNight(), '밤에 볼 수 있어요');
  if (kind === 'pavilion' || kind === 'mat') add('💤', '낮잠', () => leisureAct(k, 'nap'));
  if (kind === 'pavilion') add('🦵', '다리 뻗고 쉬기', () => leisureAct(k, 'legs'));
  add('👀', kind === 'mat' ? '바다 구경' : '풍경 구경', () => leisureAct(k, 'view'));
  add('📸', '사진 찍기', () => leisureAct(k, 'photo'));
  if (kind === 'fish') add('🎣', '낚시하기', () => { if (!P.seat) leisureSit(k); setTimeout(() => soloFish('rocks'), 150); });
  const npc = G.actors.find(a => a !== P && a !== G.det && a.seat && a.seat.bench === k && a.map === M.id && !a.pet);
  if (npc) add('💬', `${npc.look.name.split(' ').pop()}와 이야기`, () => interactWith(npc));
  openSheet({ title: bk.name, sub: `<div class="relneed">${leisureSub(kind)}</div>`, items, cols: 3 });
}
function leisureSub(kind) { const n = isNight(), ev = S.min >= 17.5 * 60; return { camp: n ? '랜턴과 화로가 은은하게 밝혀요.' : ev ? '랜턴에 불이 들어왔어요.' : '햇살 좋은 작은 캠핑존.', mat: '바다가 보이는 체크무늬 돗자리.', pavilion: '바람이 시원한 오래된 목조 정자.', fish: '낚싯대 거치대와 의자가 놓인 갯바위.' }[kind]; }
function leisureFireReady() { return !rainy() && (S.min >= 17.5 * 60 || S.min < 6 * 60); }
function leisureSit(k) {
  const P = G.player, bk = M.benches[k], free = freeSeats(k, M.id); if (!free.length) { toast('자리가 다 찼어요'); return; }
  const i = free.sort((a, b) => Math.hypot(P.x - bk.stand[a][0], P.y - bk.stand[a][1]) - Math.hypot(P.x - bk.stand[b][0], P.y - bk.stand[b][1]))[0];
  P.stop(); P.sitAt(k, i); toast(`🪑 ${bk.name}에 앉았다 — 화면을 누르면 일어나요`);
}
async function leisureSitTogether(k) {
  await runEvent(async () => {
    const P = G.player, d = G.det, bk = M.benches[k], pr = freePair(k, M.id); if (!pr) return;
    if (!S.comp) startCompanion();
    scriptDet();
    await walkBothTo([bk.stand[pr[0]][0] + 0.5, bk.stand[pr[0]][1] + 0.5], [bk.stand[pr[1]][0] + 0.5, bk.stand[pr[1]][1] + 0.5]);
    P.sitAt(k, pr[0]); d.sitAt(k, pr[1]);
    await sleep(350);
    await leisureTalk(bk.leisure, true);
    if (!S.rel.flags.firstSit && S.rel.stage >= 2) { S.rel.flags.firstSit = true; addAff(4, { event: true }); await addAlbum('나란히 앉은 시간', 'sit'); }
    leisureMemory(bk.leisure);
    if (!S.rel.daily.sit[k]) { S.rel.daily.sit[k] = true; addAff(2); }
    advanceTime(15);
    if (confessReady()) { closeDialog(); await confessionEvent(); }
    closeDialog();
    toast(S.rel.stage >= 3 ? '💞 오른쪽 아래 버튼으로 함께할 행동을 골라요 · 땅을 누르면 일어나요' : '땅을 누르면 일어나요');
  });
}
const LEISURE_LINES = {
  camp: { 2: ['[[여기 꽤 괜찮네요. 마을에 이런 데가 생기니까 좋다.||여기 꽤 괜찮네. 마을에 이런 데가 생기니까 좋다.]]', '[[앉아 보세요. 저도 잠깐 쉬었다 갈게요.||앉아봐. 나도 잠깐 쉬었다 가게.]]'], 5: ['이리 와. 옆에 자리 남겨놨어.', '하하, 이렇게 앉아 있으니까 어디 멀리 놀러 온 것 같네.'], 8: ['여보, 커피 한 잔 줄까? 내가 타 왔어.', '우리 집 마당에도 이런 거 하나 만들어볼까?'] },
  mat: { 2: ['[[여기 앉으면 바다 잘 보여요.||이리 와. 여기 앉으면 바다 잘 보여.]]', '[[돗자리 깔고 앉아 있으니까 소풍 온 것 같네요.||오늘은 그냥 이렇게 있자. 급한 일도 없잖아.]]'], 4: ['왜 그렇게 멀리 앉아? 옆으로 좀 와봐.', '오늘은 그냥 이렇게 있자. 급한 일도 없잖아.'], 5: ['하하, 기대도 돼. 어깨 안 닳아.', '이리 와. 여기 앉으면 바다 잘 보여.'] },
  pavilion: { 2: ['[[여기 앉아 있으니까 좋네요. 바람도 시원하고.||여기 앉아 있으니까 좋네. 바람도 시원하고.]]', '[[이 정자 참 오래됐는데, 아직도 멀쩡하네요.||이 정자 참 오래됐는데, 아직도 멀쩡하네.]]'], 3: ['아이고, 오늘은 좀 피곤하다. 잠깐만 쉬었다 가자.', '너도 이리 와서 앉아. 자리 넓잖아.'], 8: ['여보, 여기서 잠깐 쉬었다 갈까?'] },
  fish: { 2: ['[[낚시는 아저씨한테 배우는 게 빨라요. 저는 맨날 꽝이라.||낚시는 만복 아저씨한테 배우는 게 빨라. 난 맨날 꽝이거든.]]'], 5: ['나란히 낚싯대 드리우고 있으니까 좋다. 안 잡혀도 돼.'] },
};
async function leisureTalk(kind, first) {
  const st = S.rel.stage, L = LEISURE_LINES[kind] || {};
  const key = Object.keys(L).map(Number).filter(n => n <= st).sort((a, b) => b - a)[0];
  let pool = key ? L[key] : ['같이 앉으니까 좋다.'];
  if (kind === 'pavilion' && st >= 8 && S.leisure.mem.firstPavilionDate) pool = pool.concat(['우리 처음 여기 앉았을 때 기억나?']);
  if (kind === 'pavilion' && isNight() && st >= 5) pool = pool.concat(['밤에 여기 오니까 별소리가 다 들린다. …네 숨소리까지.']);
  if (kind === 'camp' && isNight() && st >= 5) pool = pool.concat(['불멍 하니까 아무 생각이 안 나네. 너 빼고.']);
  G.det.lookAt(G.player);
  await say('det', st >= 5 ? 'blush' : 'smile', first && key ? pool[0] : pick(pool));
  if (first && pool[1]) await say('det', 'laugh', pool[1]);
}
function leisureMemory(kind) {
  const k = { camp: 'firstCampingDate', mat: 'firstPicnicDate', pavilion: 'firstPavilionDate' }[kind]; if (!k || S.leisure.mem[k]) return;
  S.leisure.mem[k] = { day: S.day, date: dateLabel(), stage: S.rel.stage };
  const t = { camp: '캠핑존에서 함께', mat: '돗자리 소풍', pavilion: '정자에 나란히' }[kind];
  memPerm(k, { name: t }); S.leisure.history.push({ type: kind, day: S.day }); addAlbum(t, 'date');
}
async function leisureAct(k, act) {
  const P = G.player, kind = M.benches[k].leisure, withDet = bothSeated(k) || (detNearby(3) && G.det.seat && G.det.seat.bench === k), c = casualOn();
  if (!P.seat || P.seat.bench !== k) leisureSit(k);
  await runEvent(async () => {
    const d = G.det;
    switch (act) {
      case 'rest': await say('narr', '', pick(['바람 소리를 들으며 잠시 눈을 감았다.', '아무 생각 없이 하늘을 올려다봤다. 마음이 느긋해진다.'])); advanceTime(30); break;
      case 'snack': { const food = ['snack', 'tangerine', 'lunchbox', 'watermelon', 'candy', 'chocolate', 'songpyeon'].find(f => S.inv[f] > 0 && f !== 'snack') || (S.inv.snack > 0 ? 'snack' : null);
        if (!food) { await say('narr', '', '먹을 게 없다. 마을 슈퍼에서 간식을 사 오자.'); break; }
        S.inv[food]--; P.prop = food; await say('narr', '', `${josa(ITEMS[food].name, '을', '를')} 꺼내 먹었다. 밖에서 먹으니 더 맛있다.`); memPref('food', food);
        if (withDet) { d.prop = food; await say('det', 'laugh', c ? '나도 하나만. …역시 밖에서 먹으면 다 맛있어.' : '저도 하나만요. 밖에서 먹으니까 더 맛있네요.'); addAff(1); }
        P.prop = null; d.prop = null; advanceTime(15); break; }
      case 'tea': P.prop = 'tea'; await say('narr', '', kind === 'camp' ? '보온병에 담긴 따뜻한 보리차를 따랐다. 김이 모락모락.' : '정자 마루에 앉아 따뜻한 차를 홀짝였다.'); if (withDet) { d.prop = 'tea'; await say('det', 'smile', c ? '차 맛 좋다. 이런 게 쉬는 거지.' : '차 맛 좋네요. 이런 게 쉬는 거죠.'); } P.prop = null; d.prop = null; advanceTime(20); break;
      case 'fire': await say('narr', '', '타닥타닥… 화로 불빛이 얼굴을 따뜻하게 비춘다.'); if (withDet) await say('det', S.rel.stage >= 5 ? 'blush' : 'smile', S.rel.stage >= 5 ? '불 보고 있는 네 얼굴, 오늘따라 예쁘다.' : c ? '불멍이라는 게 이래서 좋구나.' : '불멍이라는 게 이래서 좋네요.'); advanceTime(30); break;
      case 'stars': await say('narr', '', pick(['⭐ 별이 쏟아질 것 같다. 은하수가 섬 위를 가로지른다.', '⭐ 별똥별 하나가 길게 떨어졌다.'])); if (withDet) await say('det', 'smile', S.rel.stage >= 5 ? '소원 빌었어? 난 벌써 이뤘는데. 옆에 있잖아.' : c ? '여기서 보는 별이 섬에서 제일이야.' : '여기서 보는 별이 섬에서 제일이에요.'); break;
      case 'nap': P.lie = -1; P.zzz = true; await say('narr', '', '스르르 눈이 감긴다… 💤'); await fade(true); advanceTime(60); await sleep(300); await fade(false); P.lie = 0; P.zzz = false; await say('narr', '', '한숨 푹 잤다. 개운하다!'); if (withDet) await say('det', 'tease', c ? '깼어? 코 고는 소리 녹음해 둘 걸.' : '깨셨어요? 하하, 푹 주무시던데요.'); break;
      case 'legs': P.oy = 2; await say('narr', '', '마루 끝에 다리를 쭉 뻗었다. 아이고, 시원하다.'); advanceTime(20); P.oy = 0; break;
      case 'view': await say('narr', '', kind === 'mat' ? '반짝이는 바다와 하얀 파도. 멀리 여객선이 지나간다.' : kind === 'camp' ? '나무 사이로 마을 지붕들과 풍차가 보인다.' : kind === 'fish' ? '파도가 갯바위에 부딪혀 하얗게 부서진다.' : '동백꽃 사이로 숲 바람이 지나간다.'); if (withDet) await say('det', 'smile', c ? '이 경치 혼자 보기 아깝다고 생각했었는데. 이제 안 아깝다.' : '이 경치 혼자 보기 아까웠는데 다행이네요.'); break;
      case 'photo': await say('narr', '', '찰칵! 지금 이 순간을 남겼다.'); flashFx(); await addAlbum({ camp: '캠핑존에서', mat: '돗자리 소풍', pavilion: '정자에서', fish: '갯바위 낚시터' }[kind], withDet ? 'date' : 'travel'); break;
    }
  });
}
/* 함께 앉았을 때 — 관계 단계별 행동 */
const COUPLE_ACTS = [
  ['chat', '💬', '수다 떨기', 2], ['snack', '🍙', '함께 간식', 2], ['sea', '🌊', '경치 구경', 2], ['tease', '😜', '장난치기', 3],
  ['close', '↔', '가까이 앉기', 4], ['look', '👀', '서로 바라보기', 4], ['shoulder', '💗', '어깨 닿기', 4],
  ['hand', '🤝', '손잡기', 5], ['lean', '😌', '어깨에 기대기', 5], ['pat', '✋', '머리 쓰다듬기', 5], ['hug', '🤗', '가볍게 안기', 5], ['cheek', '😘', '볼 뽀뽀', 5], ['kiss', '💋', '입맞춤', 6], ['lap', '🛌', '무릎 베고 눕기', 6], ['feed', '🍡', '먹여주기', 5],
  ['nestle', '🫶', '품에 안겨 쉬기', 8], ['lapnap', '💤', '무릎 낮잠', 8], ['embrace', '💞', '끌어안고 앉기', 8], ['brow', '🙆', '이마 맞대기', 8], ['pinch', '🤏', '볼 꼬집기', 8], ['sweet', '💕', '다정한 입맞춤', 8], ['sky', '☁', '함께 누워 하늘 보기', 8],
];
function coupleMenu(k) {
  const st = S.rel.stage;
  const items = COUPLE_ACTS.filter(a => st >= Math.min(a[3], 8) || a[3] <= st + 1).map(([id, icon, label, need]) => ({ icon, label, locked: st < need, note: st < need ? STAGES[need - 1].name : '', why: `「${STAGES[need - 1].name}」 단계에서 할 수 있어요`, onClick: () => coupleAct(k, id) }));
  items.push({ icon: '😌', label: '쉬기', onClick: () => leisureAct(k, 'rest') }, { icon: '🧍', label: '일어나기', onClick: () => standUpPlayer() });
  openSheet({ title: `${M.benches[k].name} · ${himCall()}와 함께`, items, cols: 4 });
}
const COUPLE_LINES = {
  chat: ['오늘 뭐 했어? 천천히 얘기해 봐.', '하하, 너 진짜 별걸 다 알고 있네.'], snack: ['하나만 줘. 아니, 두 개.'], sea: ['파도 소리 좋다. 이대로 한참 있고 싶다.'], tease: ['너 머리에 뭐 묻었다. …거짓말이지롱. 하하.', '잠깐만. 머리에 뭐 묻었어. 가만있어 봐.'],
  close: ['왜 그렇게 멀리 앉아? 옆으로 좀 와봐.'], look: ['…왜 그렇게 봐? 나 얼굴에 뭐 묻었어?'], shoulder: ['어, 어깨 닿았다. …뭐, 나쁘지 않네.'],
  hand: ['손 줘. 이렇게 있으면 따뜻하잖아.'], lean: ['하하, 기대도 돼. 어깨 안 닳아.'], pat: ['착하다, 착해. …왜, 나도 해 달라고?'], hug: ['이리 와. 잠깐만 이러고 있자.'],
  cheek: ['뽀뽀해 달라고? 아이고, 여기 사람들 다 보는데.', '하하, 알았어. 이리 와.'], kiss: ['…눈 감아 봐.'], lap: ['아이고, 아주 편하게 누웠네. 내 무릎이 베개야?'], feed: ['아~ 해 봐. 내가 먹여 줄게.'],
  nestle: ['여보, 이리 와. 오늘은 내가 이불 해 줄게.'], lapnap: ['자, 무릎 대령. 푹 자. 내가 지켜줄게.'], embrace: ['이렇게 꽉 안고 있으면 바람도 안 춥다.'], brow: ['이마 맞대니까 네 생각이 다 들리는 것 같아.'], pinch: ['볼이 말랑말랑하네. 하하, 아파? 미안미안.'], sweet: ['사랑해. 그냥, 지금 말하고 싶었어.'], sky: ['구름이 고래 모양이다. 저기 봐, 꼬리.'],
};
async function coupleAct(k, id) {
  await runEvent(async () => {
    const P = G.player, d = G.det; d.talking = true;
    const dir = Math.sign(d.x - P.x + (d.y - P.y)) || 1, toward = (a, b, px) => { const sx = (iso(b.x, b.y)[0] - iso(a.x, a.y)[0]) > 0 ? 1 : -1; a.ox = sx * px; };
    const reset = () => { P.ox = P.oy = d.ox = d.oy = 0; P.lean = d.lean = false; P.lie = d.lie = 0; P.zzz = d.zzz = false; P.prop = d.prop = null; };
    const lines = (G._coupleOverride && G._coupleOverride[id]) || COUPLE_LINES[id] || ['…'];
    const faceEach = () => { P.lookAt(d); d.lookAt(P); };
    const hearts = (n = 4) => { burst(d, 'heart', n); burst(P, 'heart', n - 1); };
    switch (id) {
      case 'close': case 'shoulder': toward(P, d, 3); toward(d, P, 3); break;
      case 'look': faceEach(); break;
      case 'hand': toward(P, d, 3); toward(d, P, 3); hearts(3); S.rel.daily.hand = true; break;
      case 'lean': toward(P, d, 4); P.lean = true; P.oy = 1; hearts(3); break;
      case 'pat': toward(d, P, 4); d.emo('✋', 2); hearts(2); break;
      case 'hug': case 'embrace': case 'nestle': toward(P, d, 5); toward(d, P, 5); faceEach(); hearts(6); break;
      case 'brow': toward(P, d, 6); toward(d, P, 6); faceEach(); hearts(4); break;
      case 'pinch': faceEach(); P.emo('💢', 1.2); toward(d, P, 3); break;
      case 'lap': case 'lapnap': P.lie = d.left ? 1 : -1; toward(P, d, 8); P.oy = 3; if (id === 'lapnap') P.zzz = true; hearts(3); break;
      case 'sky': P.lie = -1; d.lie = -1; P.oy = d.oy = 3; break;
      case 'feed': case 'snack': P.prop = 'tangerine'; d.prop = 'tangerine'; faceEach(); break;
      case 'cheek': case 'kiss': case 'sweet': faceEach(); toward(P, d, 4); toward(d, P, 4); break;
    }
    if (id === 'cheek') { await say('det', 'blush', lines[0]); await say('det', 'laugh', lines[1]); await kissAnim('쪽♥', 'kiss'); }
    else if (id === 'kiss' || id === 'sweet') { await say('det', 'blush', pick(lines)); await kissAnim('♥', 'kiss'); }
    else await say('det', ['chat', 'sea', 'snack'].includes(id) ? 'smile' : ['tease', 'pinch', 'look'].includes(id) ? 'tease' : 'blush', pick(lines));
    if (id === 'lapnap' || id === 'nestle') { await fade(true); advanceTime(40); await sleep(250); await fade(false); await say('det', 'smile', '잘 잤어? 다리 저린 건 비밀.'); }
    if (!S.rel.daily['ca_' + id]) { S.rel.daily['ca_' + id] = true; addAff(id === 'chat' || id === 'sea' ? 1 : 2); }
    memPref('act', id);
    await sleep(900); reset(); d.talking = false;
  });
}

/* ---------------- 주민 · 형사님의 휴식 ---------------- */
const V_REL = { 'halmeoni+okja': 'friend', 'kid+kid2': 'friend', 'tourist+tourist2': 'lovers', 'farmer+rancher': 'married', 'fisher+manbok': 'friend', 'chief+grandpa': 'friend' };
function vRel(a, b) { return V_REL[a + '+' + b] || V_REL[b + '+' + a] || null; }
const LEISURE_PLANS = [
  { h: [7, 10], who: ['grandpa'], b: 'pavilion', act: 'read' }, { h: [7.5, 10], who: ['halmeoni'], b: 'pavilion', act: 'rest' },
  { h: [11, 13.4], who: ['halmeoni', 'okja'], b: 'picnicB', act: 'chat' }, { h: [18.6, 19.5], who: ['kid', 'kid2'], b: 'pavilion', act: 'snack' },
  { h: [12, 17], who: ['tourist', 'tourist2'], b: 'picnicA', act: 'couple' }, { h: [16, 19.5], who: ['farmer', 'rancher'], b: 'camp', act: 'couple' },
  { h: [17, 20], who: ['chief', 'grandpa'], b: 'pavilion', act: 'chat' }, { h: [13, 17], who: ['keeper'], b: 'picnicB', act: 'nap' }, { h: [18, 20.5], who: ['postman'], b: 'camp', act: 'rest' },
];
const LEIS_TALK = { chat: ['그 집 손주가 그렇게 컸다며?', '호호, 그러게 말이야.', '요즘 형사 양반 얼굴이 폈어.'], snack: ['과자 반 나눠 줄게!', '내가 더 많이 먹었다~'], couple: ['바다 예쁘다, 그치?', '당신이랑 오니까 더 좋다.'], read: ['📰 오늘 신문… 귤값이 올랐네.'], rest: ['아이고, 다리야.', '바람 좋다~'], nap: ['드르렁…'] };
function leisureTick() {
  if (!S || !G.started) return;
  if (rainy()) { for (const a of G.villagers) if (a.leis && MAPS.island.benches[a.leis.b].leisure !== 'pavilion') endLeis(a); return; }
  const h = S.min / 60;
  for (const pl of LEISURE_PLANS) {
    if (h < pl.h[0] || h >= pl.h[1]) continue;
    const key = pl.who.join('+') + pl.b + pl.h[0] + ':' + S.day; if (G._leisDone && G._leisDone[key]) continue;
    const as = pl.who.map(id => G.villagers.find(v => v.id === id));
    if (as.some(a => !a || !a.visible || a.map !== 'island' || a.leis || a.talking || a.hold > 0)) continue;
    if (Math.random() > 0.15) continue;
    let seats;
    if (as.length === 2) { const pr = freePair(pl.b); if (!pr) continue; seats = pr; }
    else { const f = freeSeats(pl.b); if (!f.length) continue; seats = [f[0]]; }
    if (pl.act === 'couple' && !['lovers', 'married'].includes(vRel(pl.who[0], pl.who[1]))) continue;
    (G._leisDone = G._leisDone || {})[key] = true;
    const until = S.min + rand(50, 90);
    as.forEach((a, i) => { const bk = MAPS.island.benches[pl.b], s = bk.stand[seats[i]]; G.seatOcc[seatKey('island', pl.b, seats[i])] = a.id; a.leis = { b: pl.b, i: seats[i], act: pl.act, until, partner: as[1 - i] || null, phase: 'go' }; a.stop(); a.walkTo(s[0] + 0.5, s[1] + 0.5); });
  }
}
function endLeis(a) { if (a.seat) a.standUp(); const L = a.leis; if (L) { const k = seatKey('island', L.b, L.i); if (G.seatOcc[k] === a.id) delete G.seatOcc[k]; } a.leis = null; a.lie = 0; a.ox = 0; a.zzz = false; a.lean = false; a.prop = null; a.wait = 0; }
function leisUpdate(a, dt) {
  const L = a.leis, bk = MAPS.island.benches[L.b];
  if (a.talking) { a.stop(); return; }
  if (L.phase === 'go') {
    const s = bk.stand[L.i];
    if (Math.hypot(a.x - s[0] - 0.5, a.y - s[1] - 0.5) < 0.4 || (!a.path.length && Math.hypot(a.x - s[0] - 0.5, a.y - s[1] - 0.5) < 1.6)) { a.sitAt(L.b, L.i); L.phase = 'sit'; L.t = 0; if (L.act === 'nap') { a.lie = -1; a.zzz = true; } if (L.act === 'snack') a.prop = 'snack'; if (L.act === 'read') a.prop = 'tea'; }
    else if (!a.path.length) { a.wait -= dt; if (a.wait <= 0) { a.wait = 2; if (!a.walkTo(s[0] + 0.5, s[1] + 0.5)) endLeis(a); } }
    if (S.min > L.until) endLeis(a);
    return;
  }
  L.t += dt;
  if (L.act === 'couple' && L.partner && L.partner.seat && L.partner.seat.bench === L.b) { if (!a.ox) { const sx = iso(L.partner.x, L.partner.y)[0] - iso(a.x, a.y)[0]; a.ox = sx > 0 ? 3 : -3; } if (Math.random() < dt * 0.15) burst(a, 'heart', 1); }
  if (Math.random() < dt * 0.05 && !a.bubble) { a.say(typeof leisLine === 'function' ? leisLine(a, L.act) : pick(LEIS_TALK[L.act] || LEIS_TALK.rest), 3); if (L.partner) setTimeout(() => L.partner && L.partner.leis && L.partner.say(typeof leisLine === 'function' ? leisLine(L.partner, L.act) : pick(LEIS_TALK[L.act] || ['그러게~']), 3), 1500); }
  if (S.min > L.until) endLeis(a);
}
const _villagerUpdateL = villagerUpdate;
villagerUpdate = function (a, dt) {
  if (a.id === 'manbok') { manbokUpdate(a, dt); return; }
  if (a.leis) { if (!a.visible || a.map !== 'island') { endLeis(a); return; } leisUpdate(a, dt); return; }
  _villagerUpdateL(a, dt);
};

/* ---------------- 강만복 ---------------- */
NPC_LOOKS.manbok = { name: '강만복 아저씨', hair: 'cap', hairC: '#2a2220', hairH: '#4a3a30', capC: '#6f8a4f', eyeC: '#4a3020', skin: '#e0a878', outfits: { base: { coat: '#6f8a4f', coatS: '#57703b', shirt: '#e9e2cf', vest: '#7a8a5a', pants: '#5a5a48', shoes: '#3a4a3a', scarf: '#ffffff', rolled: true } } };
VILLAGERS.manbok = { spots: ['rocks', 'harbor', 'sashimiDoor', 'hallFront', 'plaza'], speed: 0.85, visits: [[18.5, 20, 'sashimi'], [20, 21.2, 'hall']], lines: { base: [] } };
const MANBOK_LINES = ['어이구, 왔어? 오늘 물고기들이 아주 난리 났다니까!', '내가 어제 이만한 놈을 잡았거든? 진짜야! 두 팔로 안아야 했다니까!', '형사 양반은 낚시를 영 못해. 성질이 급해서 말이야. 허허!', '낚시는 기다림이야, 기다림! 인생이랑 똑같다니까.', '아이고, 또 미끼만 먹고 튀었네. 요즘 물고기들이 아주 영악해.', '거기 앉아봐. 내가 낚시 하나는 제대로 가르쳐줄게.', '뭐? 내가 맨날 빈손으로 간다고? 누가 그런 소릴 해!', '아이고, 이 녀석 봐라. 물고기보다 내가 더 놀랐네!', '형사 양반한테 말하지 마라. 오늘도 한 마리도 못 잡았다는 거.', '내가 젊었을 땐 말이야, 여기서 팔뚝만 한 놈들이 막 올라왔어!', '허허, 오늘은 바다가 나한테 좀 야박하네.', '저기 봐라! 찌 움직인다! 움직여! ...아, 파도였네.', '커피 한 잔 할래? 낚시는 원래 커피 마시면서 하는 거야.', '아이고, 이놈의 허리야. 낚시보다 일어나는 게 더 힘들어.', '오늘 잡은 거? 비밀이지. 하하! 뭐, 아직 없긴 한데.',
  '미끼는 크릴이 최고야. 바다 고기들도 입맛이 고급이라.', '갯바위는 미끄러우니 장화 신고 다녀. 내 꼴 나지 말고. 허허.', '이 낚싯대가 말이야, 우리 할아버지 때부터… 아니다, 작년에 샀다.', '오늘 참돔 잡으면 횟집 이모한테 자랑하러 간다!'];
VILLAGERS.manbok.lines.base = MANBOK_LINES;
function manbokFishing() { const h = S.min / 60; return h >= 7.5 && h < 15.3 && S.weather !== 'storm' && S.weather !== 'rain'; }
function manbokUpdate(a, dt) {
  if (S.weather === 'storm' || S.weather === 'rain') { if (a.seat) a.standUp(); a.visible = false; return; }
  const h = S.min / 60; a.visible = h >= 7 && h < 21.5;
  if (!a.visible) return;
  if (a.talking) { a.stop(); return; }
  if (manbokFishing()) {
    const bk = MAPS.island.benches.fishchair;
    if (a.seat && a.seat.bench === 'fishchair') {
      a.wait -= dt; a.pose = 'fish';
      if (a.wait <= 0) {
        a.wait = rand(6, 12); const r = Math.random();
        if (r < 0.18) { a.emo('❗', 1.4); a.say(pick(['왔다 왔어!', '어이구, 이 녀석!', '잡았다!']), 2.5); burst(a, 'spark', 4); S.fishingNPC.caught = (S.fishingNPC.caught || 0) + 1; }
        else if (r < 0.45 && dist(a, G.player) < 9) a.say(pick(MANBOK_LINES), 3.5);
        else if (r < 0.6) { a.pose = 'stand'; setTimeout(() => { if (a.seat) a.pose = 'fish'; }, 900); }
      }
      return;
    }
    if (a.map !== 'island') { a.map = 'island'; [a.x, a.y] = P_('harbor'); }
    const s = bk.stand[0];
    if (seatFree('island', 'fishchair', 0, a.id) && Math.hypot(a.x - s[0] - 0.5, a.y - s[1] - 0.5) < 0.6) { a.sitAt('fishchair', 0); a.pose = 'fish'; a.say('자, 오늘도 한판 붙어 보자고!', 2.5); return; }
    if (!a.path.length) { a.wait -= dt; if (a.wait <= 0) { a.wait = 3; a.walkTo(s[0] + 0.5, s[1] + 0.5); } }
    return;
  }
  if (a.seat) { a.standUp(); a.pose = 'stand'; a.say(pick(['오늘은 이쯤 하자. 장비 정리 끝!', '허허, 오늘 조과는… 비밀이야.']), 3); }
  a.pose = 'stand';
  _villagerUpdateL(a, dt);
}
async function manbokTalk(a) {
  const F = S.fishingNPC, c = casualOn(), d = G.det;
  a.talking = true; a.lookAt(G.player); G.player.lookAt(a);
  if (!F.met) { F.met = S.day; await say(a.id, 'laugh', '어이구, 처음 보는 얼굴이네! 나 강만복이야. 이 갯바위의 터줏대감이지. 허허!'); await say(a.id, 'smile', '낚시 궁금하면 언제든 와. 내가 다 가르쳐 줄게. 물고기는… 내가 다 잡아 버려서 남은 게 없을 수도 있지만!'); F.friendship += 2; a.talking = false; return; }
  const ev = [];
  if (!F.completedEvents.includes('legend') && F.friendship >= 3) ev.push('legend');
  if (!F.completedEvents.includes('rod') && S.day >= 4 && S.rel.flags.met && S.rel.stage >= 2) ev.push('rod');
  if (!F.completedEvents.includes('withDet') && d.visible && dist(d, G.player) < 6 && S.rel.flags.met) ev.push('withDet');
  if (ev.length && Math.random() < 0.7) { await manbokEvent(a, ev[0]); a.talking = false; return; }
  await say(a.id, 'laugh', pick(MANBOK_LINES));
  const opts = ['낚시 대결 해요!', '낚시 좀 알려주세요', '커피 드실래요?', '다음에 또 올게요'];
  const k = await choose(opts);
  if (k === 0) await manbokDuel(a);
  else if (k === 1) { await say(a.id, 'smile', '찌가 쑥 들어가면 바로 챔질! 너무 빨라도 늦어도 안 돼. 기다림이야, 기다림!'); await say(a.id, 'tease', '그리고 갯바위에선 무늬오징어도 가끔 나와. 비밀이다?'); F.friendship++; }
  else if (k === 2) { if ((S.inv.coffee || 0) > 0) { S.inv.coffee--; await say(a.id, 'laugh', '아이고, 고맙구먼! 낚시는 원래 커피 마시면서 하는 거야. 옜다, 미끼 좀 가져가.'); S.inv.snack = (S.inv.snack || 0) + 1; F.friendship += 2; } else await say(a.id, 'smile', '허허, 마음만 받을게. 다음엔 캔커피 하나 들고 와.'); }
  F.friendship++; a.talking = false;
}
async function manbokEvent(a, id) {
  const F = S.fishingNPC, d = G.det, c = casualOn();
  if (id === 'legend') {
    await say(a.id, 'laugh', '야야, 이거 봐라! 어제 내가 잡은 전설의 대물! 한 1미터는 됐어!');
    await say('narr', '', '휴대폰 사진 속에는… 손바닥만 한 전갱이 한 마리가 찍혀 있다.');
    const k = await choose(['우와, 진짜 대물이네요!', '이거… 전갱이 아니에요?', '사진이 좀 작게 나왔네요']);
    await say(a.id, k === 1 ? 'surprise' : 'laugh', k === 0 ? '그치?! 역시 보는 눈이 있어! 허허허!' : k === 1 ? '쉿! 사진이 원래 작게 나오는 거야! 실물은 이~만했다니까!' : '그래, 그래! 카메라가 대물을 못 담아. 허허!');
    F.friendship += 3; F.completedEvents.push('legend'); memRecent('leisure', '만복 아저씨의 전설의 대물 이야기');
  } else if (id === 'rod') {
    await say(a.id, 'surprise', '아이고, 큰일 났어! 내 낚싯대가 없어졌어! 누가 훔쳐 갔나 봐!');
    await say(a.id, 'sad', '형사 양반! 형사 양반 좀 불러 줘!');
    if (d.visible && d.map === 'island') { scriptDet(); d.walkTo(a.x + 1, a.y + 1); await waitUntil(() => !d.path.length, 8); }
    else { await say('narr', '', '전화를 걸자 잠시 후 형사님이 헐레벌떡 뛰어왔다.'); d.map = 'island'; d.visible = true; [d.x, d.y] = nearestWalkable(a.x + 1, a.y + 1, MAPS.island); scriptDet(); }
    d.lookAt(a);
    await say('det', 'serious', '[[아저씨, 진정하시고요. 마지막으로 어디 두셨어요?||아저씨, 진정하시고요. 마지막으로 어디 두셨어요?]]');
    await say('narr', '', '어디부터 찾아볼까?');
    let found = false;
    while (!found) {
      const k = await choose(['바위 틈', '아이스박스 뒤', '낚시 가방 속']);
      if (k === 2) { found = true; await say('narr', '', '🎣 낚시 가방 속에 낚싯대가 얌전히 접혀 들어가 있었다.'); }
      else await say('narr', '', k === 0 ? '바위 틈엔 게 한 마리만 있다.' : '아이스박스 뒤엔 빈 커피 캔뿐이다.');
    }
    await say(a.id, 'surprise', '어? 내가… 아까 비 올까 봐 넣어 뒀구나!');
    G.rawSpeech = true;
    await say('det', 'tease', '아저씨, 다음부턴 물건부터 잘 찾아보시고 신고하세요.');
    await say(a.id, 'laugh', '아이고, 형사 양반! 내가 괜히 불렀나 보네. 허허!');
    await say('det', 'laugh', '하하, 커피 한 잔 사시면 없던 일로 해드릴게요.');
    G.rawSpeech = false;
    F.completedEvents.push('rod'); F.friendship += 3; addAff(2, { event: true }); memRecent('case', '만복 아저씨의 낚싯대 소동'); addRumor('case', { case: '낚싯대 실종', truth: '아저씨 본인' }, { key: 'manbokrod' });
  } else if (id === 'withDet') {
    d.lookAt(a);
    await say(a.id, 'laugh', '오, 형사 양반! 오늘은 웬일로 낚싯대 들고 왔어? 또 꽝 치려고?');
    G.rawSpeech = true; await say('det', 'tease', '아저씨, 오늘은 제가 이길 거예요. 어제 미끼 연구 좀 했거든요.'); G.rawSpeech = false;
    await say(a.id, 'tease', '허허, 미끼 연구? 물고기는 연구한다고 안 잡혀! 성질부터 고쳐!');
    await say('narr', '', '두 사람이 나란히 낚싯대를 드리웠다…');
    const k = await choose(['나도 같이 할래요!', '옆에서 구경할게요']);
    if (k === 0) { closeDialog(); const res = await fishMinigame('rocks'); await say(a.id, 'laugh', res ? '어이구, 손님이 제일 잘 잡네! 형사 양반 체면이 말이 아니야!' : '허허, 셋 다 꽝이구먼. 오늘 바다가 야박하네.'); }
    else { await say('narr', '', '…형사님의 찌가 먼저 움직였다! 그런데 올라온 건 낡은 장화였다.'); await say(a.id, 'laugh', '푸하하! 형사 양반 장화 낚았네! 내가 이래서 형사 양반을 좋아한다니까!'); }
    G.rawSpeech = true; await say('det', 'laugh', casualOn() ? '하하… 아저씨, 오늘 일 비밀이에요. 특히 너도.' : '하하… 아저씨, 오늘 일은 비밀입니다.'); G.rawSpeech = false;
    F.completedEvents.push('withDet'); F.friendship += 2; addAff(2, { event: true }); memRecent('act', '형사님 · 만복 아저씨와 낚시');
  }
}
async function manbokDuel(a) {
  const F = S.fishingNPC;
  if (F.lastDuel === S.day) { await say(a.id, 'smile', '오늘은 한 판 했잖아. 내일 또 붙자고! 허허.'); return; }
  await say(a.id, 'laugh', '좋아! 세 번 던져서 큰 놈 잡는 사람이 이기는 거야. 진 사람이 커피 사기!');
  closeDialog();
  const P = G.player; P.pose = 'fish'; P.left = true;
  let mine = 0;
  for (let i = 0; i < 3; i++) { toast(`🎣 ${i + 1}번째 캐스팅!`); const r = await fishMinigame('rocks'); mine = Math.max(mine, r && r.size || 0); }
  P.pose = 'stand';
  const his = Math.random() < 0.75 ? Math.round(rand(18, 48)) : 0;
  F.lastDuel = S.day;
  if (mine > his) { await say(a.id, 'surprise', `내가 ${his ? his + 'cm' : '꽝'}… 자네가 ${mine}cm?! 아이고, 졌다 졌어! 약속은 약속이야.`); payOnce('manbokDuel' + S.day, () => { S.money += 2000; S.inv.snack = (S.inv.snack || 0) + 2; }); toast('🏆 승리! 2,000원과 미끼(간식) 2개'); F.friendship += 2; F.wins = (F.wins || 0) + 1; }
  else await say(a.id, 'laugh', his ? `허허! 나는 ${his}cm, 자네는 ${mine ? mine + 'cm' : '꽝'}! 아직 멀었구먼. 커피는 다음에 사!` : '허허, 둘 다 꽝이구먼! 오늘은 바다가 야박하네. 무승부야!');
  memRecent('act', '만복 아저씨와 낚시 대결');
}
const _interactWithL = interactWith;
interactWith = function (a) { if (a && a.id === 'manbok') { runEvent(async () => { G._talkTo = 'manbok'; await manbokTalk(a); }); return; } _interactWithL(a); };

/* 형사님도 퇴근길에 정자 · 캠핑존에서 쉰다 */
function detRestTick() {
  const d = G.det, plan = detPlan(S.min);
  if (G.busy || S.comp || d.state !== 'sched' || G.detAuto || d.map !== 'island' || !d.visible || !S.rel.flags.met || rainy()) return;
  if (plan.k !== 'stroll' || S.surp.restDay === S.day || Math.random() > 0.05) return;
  const b = pick(['pavilion', 'camp']), f = freeSeats(b); if (!f.length) return;
  S.surp.restDay = S.day;
  G.detAuto = { kind: 'rest', b, i: f[0], t: 0, phase: 'go', target: MAPS.island.benches[b].stand[f[0]].map(v => v + 0.5) };
  G.seatOcc[seatKey('island', b, f[0])] = 'det';
  d.stop(); d.walkTo(...G.detAuto.target);
}
const _autoUpdateL = autoUpdate;
autoUpdate = function (dt) {
  const A = G.detAuto, d = G.det;
  if (!A || A.kind !== 'rest') return _autoUpdateL(dt);
  A.t += dt;
  if (A.phase === 'go') { if (Math.hypot(d.x - A.target[0], d.y - A.target[1]) < 0.5 || (!d.path.length && A.t > 2)) { d.sitAt(A.b, A.i); A.phase = 'sit'; A.t = 0; d.say(pick(['아이고, 오늘은 좀 피곤하다.', '바람 시원하네.', '잠깐만 쉬었다 가자.']), 3); } else if (!d.path.length) d.walkTo(...A.target); if (A.t > 25) endAuto(); return; }
  if (A.t > 24) { d.standUp(); endAuto(); }
};
const _endAutoL = endAuto;
endAuto = function () { const A = G.detAuto; if (A && A.kind === 'rest') { const k = seatKey('island', A.b, A.i); if (G.seatOcc[k] === 'det') delete G.seatOcc[k]; if (G.det.seat) G.det.standUp(); } _endAutoL(); };

/* ---------------- 저장 · 루프 연결 ---------------- */
const _ensureV4L = ensureV4;
ensureV4 = function (s) {
  _ensureV4L(s);
  s.leisure = s.leisure || { areas: { campingZoneUnlocked: true, picnicAreaUnlocked: true, pavilionRenovated: true, fishingSpotDecorated: true }, mem: { firstCampingDate: null, firstPicnicDate: null, firstPavilionDate: null }, history: [] };
  s.fishingNPC = Object.assign({ npcId: 'kang_manbok', friendship: 0, completedEvents: [] }, s.fishingNPC || {});
  return s;
};
const _startGameL = startGame;
startGame = function (state, isNew) {
  G.seatOcc = {}; G._leisDone = {};
  _startGameL(state, isNew);
  for (const a of G.actors) { a.leis = null; a.lie = 0; a.ox = 0; a.oy = 0; a.prop = null; if (a !== G.player && a.seat) a.standUp(); }
};
const _endDayL = endDay;
endDay = async function (f) { for (const a of G.villagers) if (a.leis) endLeis(a); G.seatOcc = {}; G._leisDone = {}; await _endDayL(f); };
let _leisT = 0;
const _loopL = loop;
loop = function (ts) {
  if (G.started && S && !paused()) { _leisT += 1 / 60; if (_leisT > 1.5) { _leisT = 0; leisureTick(); detRestTick(); } }
  _loopL(ts);
};
/* 앉아 있는 동안 걷기 애니메이션 · 위치 고정 */
const _actorUpdateL = Actor.prototype.update;
Actor.prototype.update = function (dt) { if (this.seat && this.path.length) this.path = []; return _actorUpdateL.call(this, dt); };

/* 앉아 있을 때 행동 버튼 = 휴식 메뉴 */
const _computeActionL = computeAction;
computeAction = function () {
  const P = G.player, k = P && leisureSeatOf(P);
  if (k && !G.working && !G.fishing) return { label: bothSeated(k) ? '함께하기' : '휴식 메뉴', icon: bothSeated(k) ? '💞' : '🍃', hot: bothSeated(k), fn: () => leisureMenu(k) };
  return _computeActionL();
};
