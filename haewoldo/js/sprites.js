'use strict';
/* =========================================================
 *  해월도 마을생활 — 픽셀아트 생성기
 *  모든 그림은 코드로 한 픽셀씩 그립니다 (외부 이미지 없음).
 * ========================================================= */

const PAL = {
  out: '#2b2026', skin: '#f7d4b5', skinS: '#e8b590', blush: '#f4a3a3',
  eye: '#2a2130', mouth: '#b4545e', white: '#ffffff', gold: '#f0c13e', goldS: '#b98a1c',
};

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function shade(hex, f) { // f<1 어둡게, f>1 밝게
  const [r, g, b] = hexRgb(hex);
  const m = (v) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  return '#' + ((1 << 24) | (m(r) << 16) | (m(g) << 8) | m(b)).toString(16).slice(1);
}

/* 투명 픽셀 중 불투명 픽셀과 맞닿은 곳에 1px 외곽선 */
function autoOutline(c, col = PAL.out) {
  const g = c.getContext('2d'), W = c.width, H = c.height;
  const d = g.getImageData(0, 0, W, H), a = d.data;
  const src = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) src[i] = a[i * 4 + 3] > 0 ? 1 : 0;
  const [r, gg, b] = hexRgb(col);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (src[i]) continue;
    if ((x > 0 && src[i - 1]) || (x < W - 1 && src[i + 1]) || (y > 0 && src[i - W]) || (y < H - 1 && src[i + W])) {
      a[i * 4] = r; a[i * 4 + 1] = gg; a[i * 4 + 2] = b; a[i * 4 + 3] = 255;
    }
  }
  g.putImageData(d, 0, 0);
  return c;
}

/* 스캔라인 다각형 채우기 — 안티에일리어싱 없는 또렷한 픽셀 */
function fillPoly(g, pts, col) {
  g.fillStyle = col;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const sy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) xs.push(a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = Math.round(xs[k]), x1 = Math.round(xs[k + 1]);
      if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
    }
  }
}
function fillEllipse(g, cx, cy, rx, ry, col) {
  g.fillStyle = col;
  for (let y = -ry; y < ry; y++) {
    const t = (y + 0.5) / ry, w = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
}

/* ---------------------------------------------------------
 *  캐릭터 외형 정의
 * --------------------------------------------------------- */
const LOOKS = {
  det: {
    name: '파출소 형사님', tall: true, hair: 'wavy', hairC: '#2a2320', hairH: '#4b3c33', eyeC: '#6b4430',
    outfits: {
      work: { coat: '#2e3d66', coatS: '#212c4b', shirt: '#f1f1ee', pants: '#1e2437', shoes: '#5b3b2a', badge: true },
      casual: { coat: '#a8cbea', coatS: '#87acd2', shirt: '#a8cbea', pants: '#cbb792', shoes: '#6a4934', rolled: true, closed: true, collar: '#eef5fc' },
    },
  },
  halmeoni: {
    name: '순덕 할머니', hair: 'bun', hairC: '#c9c6cf', hairH: '#e6e4ea', eyeC: '#4a3a30', closedEyes: true,
    outfits: { base: { coat: '#9a6fb0', coatS: '#7a5590', shirt: '#9a6fb0', pants: '#5d5470', shoes: '#4a3a30', closed: true, collar: '#e7d7ef' } },
  },
  kid: {
    name: '꼬마 하늘이', kid: true, hair: 'short', hairC: '#3a2a22', hairH: '#5a4234', eyeC: '#4a3020',
    outfits: { base: { coat: '#f2c94c', coatS: '#d6a92c', shirt: '#f2c94c', pants: '#3f6fb5', shoes: '#e55b5b', closed: true, collar: '#fff2c4' } },
  },
  fisher: {
    name: '어부 아저씨', hair: 'cap', hairC: '#3b3b3b', hairH: '#555', capC: '#d9583f', eyeC: '#4a3020',
    outfits: { base: { coat: '#6f8a4f', coatS: '#57703b', shirt: '#e9e2cf', pants: '#4b5568', shoes: '#2f2f2f' } },
  },
};

/* 플레이어: 직업별 옷 + 고를 수 있는 머리 */
const PLAYER_HAIRS = {
  ponytail: { label: '포니테일', hair: 'ponytail', hairC: '#6a4230', hairH: '#8a5a40' },
  bob: { label: '단발', hair: 'bob', hairC: '#3b2a24', hairH: '#5a4236' },
  short: { label: '짧은 머리', hair: 'short', hairC: '#4a3226', hairH: '#6b4a36' },
};
const JOB_OUTFITS = {
  doctor: { coat: '#f6f7fb', coatS: '#d5d9e6', shirt: '#8fb8de', pants: '#4a5878', shoes: '#3b3b48', stetho: true },
  teacher: { coat: '#e9b44c', coatS: '#c8932f', shirt: '#fbf7ee', pants: '#5a6a86', shoes: '#6a4934' },
  traveler: { coat: '#5fb3c8', coatS: '#468fa3', shirt: '#fbf7ee', pants: '#3f5a8a', shoes: '#e9e4da', backpack: '#c46a3c', strap: '#8c4422' },
  cafe: { coat: '#fbf7ee', coatS: '#ddd6c6', shirt: '#fbf7ee', pants: '#4b4038', shoes: '#3b2e28', apron: '#7a4e33', closed: true, collar: '#fbf7ee' },
  haenyeo: { coat: '#2a2c34', coatS: '#1c1d23', shirt: '#2a2c34', pants: '#2a2c34', shoes: '#22232a', closed: true, collar: '#2a2c34', accent: '#ef7b3a' },
};
function playerLook(job, hairKey) {
  const h = PLAYER_HAIRS[hairKey] || PLAYER_HAIRS.ponytail;
  return { name: '나', hair: h.hair, hairC: h.hairC, hairH: h.hairH, eyeC: '#5a3a28', outfits: { base: JOB_OUTFITS[job] || JOB_OUTFITS.traveler } };
}

/* ---------------------------------------------------------
 *  SD 캐릭터 (24×34) — face: 'f' 앞 / 'b' 뒤, 오른쪽을 보는 그림. 왼쪽은 좌우반전.
 *  pose: stand | sit | fish
 * --------------------------------------------------------- */
function drawChibi(look, outfitKey, face, frame, pose, blink) {
  const W = 24, H = 34, c = mkCanvas(W, H), g = c.getContext('2d');
  const o = typeof outfitKey === 'object' ? outfitKey : (look.outfits[outfitKey] || Object.values(look.outfits)[0]);
  const P = (col, x, y, w = 1, h = 1) => { if (!col) return; g.fillStyle = col; g.fillRect(x, y, w, h); };
  const cx = 12, base = 32;
  const kid = !!look.kid, tall = !!look.tall;
  const sit = pose === 'sit';
  const legH = sit ? 3 : (tall ? 6 : kid ? 3 : 5);
  const bodyH = tall ? 8 : kid ? 5 : 7;
  const hw = tall ? 5 : kid ? 3 : 4;
  const walking = frame === 1 || frame === 3;
  const bob = walking ? -1 : 0;
  const legTop = base - legH + 1;
  const bodyTop = legTop - bodyH + bob;
  const headTop = bodyTop - 12;
  const hx = cx - 7;
  const front = face === 'f';
  const H1 = look.hairC, H2 = look.hairH;

  // --- 뒤쪽 머리 (몸 뒤로 보이는 부분)
  if (front && look.hair === 'ponytail') { P(H1, hx + 14, headTop + 3, 2, 7); P(H2, hx + 14, headTop + 4, 1, 3); }

  // --- 다리
  if (sit) {
    P(o.pants, cx - 4, legTop - 1, 4, 2); P(o.pants, cx + 1, legTop - 1, 4, 2);
    P(o.shoes, cx - 4, legTop + 1, 3, 1); P(o.shoes, cx + 2, legTop + 1, 3, 1);
  } else {
    const lUp = frame === 1 ? 1 : 0, rUp = frame === 3 ? 1 : 0;
    P(o.pants, cx - 3, legTop, 3, legH - 1 - lUp); P(o.shoes, cx - 3, base - lUp, 3, 1);
    P(o.pants, cx + 1, legTop, 3, legH - 1 - rUp); P(o.shoes, cx + 1, base - rUp, 3, 1);
    if (tall) { P(shade(o.pants, 0.8), cx - 1, legTop, 1, legH - 2); P(shade(o.pants, 0.8), cx + 3, legTop, 1, legH - 2); }
    if (o.shorts) { P(PAL.skin, cx - 3, legTop + 2, 3, legH - 3 - lUp); P(PAL.skin, cx + 1, legTop + 2, 3, legH - 3 - rUp); }
    if (o.jeans) { P(shade(o.pants, 1.25), cx - 2, legTop + 1, 1, 2); P(shade(o.pants, 1.25), cx + 2, legTop + 1, 1, 2); }
  }

  if (o.skirt) {
    if (sit) P(o.skirt, cx - 4, legTop - 1, 9, 2);
    else { P(o.skirt, cx - hw, legTop - 1, hw * 2 + 1, 3); P(shade(o.skirt, 0.8), cx - hw, legTop + 1, hw * 2 + 1, 1); if (o.long) P(o.skirt, cx - hw - 1, legTop + 2, hw * 2 + 3, 2); }
  }
  // --- 몸통
  P(o.coat, cx - hw, bodyTop, hw * 2 + 1, bodyH);
  P(o.coatS, cx + hw, bodyTop, 1, bodyH);
  if (o.stripe) for (let r = 1; r < bodyH - 1; r += 2) P(o.stripe, cx - hw, bodyTop + r, hw * 2 + 1, 1);
  if (o.knit) for (let r = 1; r < bodyH - 1; r++) for (let x = cx - hw + (r % 2); x <= cx + hw; x += 2) P(shade(o.coat, 1.1), x, bodyTop + r, 1, 1);
  if (o.denim) { P(shade(o.coat, 1.2), cx - hw, bodyTop + 2, hw * 2 + 1, 1); P('#f0c13e', cx - 3, bodyTop + 3, 1, 1); P('#f0c13e', cx + 3, bodyTop + 3, 1, 1); }
  if (o.vest) { P(o.vest, cx - hw, bodyTop, hw * 2 + 1, bodyH - 1); P(shade(o.vest, 0.8), cx, bodyTop + 1, 1, bodyH - 2); P('#f2c94c', cx - hw, bodyTop + 4, hw * 2 + 1, 1); }
  if (front) {
    if (!o.closed) {
      P(o.shirt, cx - 1, bodyTop, 3, bodyH - 2);
      P(o.coatS, cx - 2, bodyTop, 1, 3); P(o.coatS, cx + 2, bodyTop, 1, 3);
    } else {
      P(o.collar || o.shirt, cx - 2, bodyTop, 5, 1);
      P(o.coatS, cx, bodyTop + 1, 1, bodyH - 2);
    }
    if (o.badge) { P(PAL.gold, cx + 2, bodyTop + 2, 2, 2); P(PAL.goldS, cx + 3, bodyTop + 3, 1, 1); P('#cfd6e6', cx - 4, bodyTop + 3, 2, 1); }
    if (o.apron) { P(o.apron, cx - hw + 1, bodyTop + 2, hw * 2 - 1, bodyH - 1); P(shade(o.apron, 0.8), cx - 2, bodyTop + 1, 1, 1); P(shade(o.apron, 0.8), cx + 2, bodyTop + 1, 1, 1); P(shade(o.apron, 1.3), cx - 1, bodyTop + 4, 3, 1); }
    if (o.stetho) { P('#4b5878', cx - 2, bodyTop + 1, 1, 3); P('#4b5878', cx + 2, bodyTop + 1, 1, 3); P('#c9ced8', cx + 2, bodyTop + 4, 1, 1); }
    if (o.strap) { P(o.strap, cx - hw, bodyTop + 1, 1, bodyH - 2); P(o.strap, cx + hw - 1, bodyTop + 1, 1, bodyH - 2); }
    if (o.accent) { P(o.accent, cx - hw, bodyTop + 3, hw * 2 + 1, 1); }
  } else {
    if (o.backpack) { P(o.backpack, cx - 3, bodyTop + 1, 7, bodyH - 1); P(shade(o.backpack, 0.8), cx - 3, bodyTop + bodyH - 2, 7, 1); P(shade(o.backpack, 1.25), cx - 2, bodyTop + 2, 5, 1); }
    if (o.accent) { P(o.accent, cx - hw, bodyTop + 3, hw * 2 + 1, 1); }
    if (o.apron) { P(o.apron, cx - 1, bodyTop + 2, 3, 1); }
  }
  P(shade(o.coat, 0.78), cx - hw, bodyTop + bodyH - 1, hw * 2 + 1, 1); // 밑단
  if (o.bow && front) { P(o.bow, cx - 2, bodyTop + 1, 2, 1); P(o.bow, cx + 1, bodyTop + 1, 2, 1); P(shade(o.bow, 0.7), cx, bodyTop + 1, 1, 1); }
  if (o.corsage && front) { P(o.corsage, cx + 2, bodyTop + 2, 2, 2); }
  if (o.hood) { if (front) { P(shade(o.coat, 0.8), cx - 3, bodyTop, 7, 1); P('#ffffff', cx - 1, bodyTop + 1, 1, 2); P('#ffffff', cx + 1, bodyTop + 1, 1, 2); P(shade(o.coat, 0.85), cx - 2, bodyTop + 4, 5, 2); } else { P(shade(o.coat, 0.85), cx - 3, bodyTop, 7, 3); P(shade(o.coat, 0.7), cx - 2, bodyTop + 2, 5, 1); } }
  if (o.scarf) { P(o.scarf, cx - hw, bodyTop, hw * 2 + 1, 2); P(shade(o.scarf, 0.8), cx - hw, bodyTop + 1, hw * 2 + 1, 1); if (front) P(o.scarf, cx + 1, bodyTop + 2, 2, 3); else P(o.scarf, cx - 2, bodyTop + 2, 2, 2); }

  // --- 팔
  const armTop = bodyTop + 1, armLen = Math.max(3, bodyH - 2);
  let lOff = 0, rOff = 0;
  if (walking) { lOff = frame === 1 ? 1 : -1; rOff = -lOff; }
  const sleeve = o.sleeve || o.coat;
  const drawArm = (ax, off) => {
    if (pose === 'fish' || sit) {
      P(sleeve, ax, armTop, 2, armLen - 1);
      P(PAL.skin, ax + (ax < cx ? 1 : -1), armTop + armLen - 1, 2, 2);
      return;
    }
    P(sleeve, ax, armTop + off, 2, armLen);
    if (o.rolled) P(PAL.skin, ax, armTop + off + Math.ceil(armLen / 2), 2, armLen - Math.ceil(armLen / 2));
    P(PAL.skin, ax, armTop + off + armLen, 2, 1);
  };
  drawArm(cx - hw - 2, lOff);
  drawArm(cx + hw + 1, rOff);
  if (pose === 'fish' && front) { P(PAL.skin, cx + 2, armTop + 3, 3, 2); }

  // --- 머리
  P(PAL.skin, hx, headTop, 14, 12);
  g.clearRect(hx, headTop, 1, 1); g.clearRect(hx + 13, headTop, 1, 1);
  g.clearRect(hx, headTop + 11, 1, 1); g.clearRect(hx + 13, headTop + 11, 1, 1);
  P(PAL.skinS, hx + 3, headTop + 11, 8, 1);

  if (o.veil && !front) { P('#fbfbff', hx - 1, headTop + 3, 16, 15); P('#e9ecf7', hx + 2, headTop + 10, 10, 1); }
  drawHair(P, g, look, front, hx, headTop, cx);
  if (o.hat === 'straw') { P('#e8c66a', hx - 2, headTop + 1, 18, 2); P('#f1d27e', hx + 2, headTop - 3, 10, 4); P('#e3615a', hx + 2, headTop, 10, 1); P(shade('#e8c66a', 0.8), hx - 2, headTop + 2, 18, 1); }
  else if (o.hat === 'beanie') { P(o.hatC || '#e3615a', hx, headTop - 2, 14, 5); P(shade(o.hatC || '#e3615a', 0.8), hx, headTop + 2, 14, 1); P('#ffffff', cx - 1, headTop - 4, 3, 2); }
  if (o.veil) { P('#f7b9c9', hx + 2, headTop - 1, 3, 1); P('#ffffff', hx + 6, headTop - 1, 2, 1); P('#f7b9c9', hx + 9, headTop - 1, 3, 1); if (front) { P('#fbfbff', hx - 1, headTop + 3, 1, 13); P('#fbfbff', hx + 14, headTop + 3, 1, 13); } }

  if (front) {
    const s = 1;
    const ex1 = hx + 3 + s, ex2 = hx + 9 + s, ey = headTop + 6;
    if (blink || look.closedEyes) {
      P(PAL.eye, ex1, ey + 2, 2, 1); P(PAL.eye, ex2, ey + 2, 2, 1);
    } else {
      P(PAL.eye, ex1, ey, 2, 3); P(PAL.eye, ex2, ey, 2, 3);
      P(look.eyeC, ex1, ey + 2, 2, 1); P(look.eyeC, ex2, ey + 2, 2, 1);
      P(PAL.white, ex1, ey, 1, 1); P(PAL.white, ex2, ey, 1, 1);
      if (look.fem) { P(PAL.eye, ex1 - 1, ey, 1, 1); P(PAL.eye, ex2 + 2, ey, 1, 1); }
    }
    P(PAL.blush, ex1 - 2, ey + 3, 2, 1); P(PAL.blush, ex2 + 2, ey + 3, 1, 1);
    P(look.fem ? '#d9606f' : PAL.mouth, cx + s - 1, headTop + 10, 2, 1);
  }

  autoOutline(c);
  return c;
}

function drawHair(P, g, look, front, hx, ht, cx) {
  const A = look.hairC, B = look.hairH, st = look.hair;
  if (st === 'cap') {
    const C = look.capC;
    P(C, hx, ht - 1, 14, 4); P(C, hx + 1, ht - 2, 12, 1); P(shade(C, 1.2), hx + 3, ht - 1, 5, 1);
    if (front) { P(shade(C, 0.75), hx + 2, ht + 3, 14, 1); P(A, hx, ht + 3, 2, 3); P(A, hx + 12, ht + 3, 2, 2); }
    else { P(A, hx, ht + 3, 14, 6); P(shade(C, 0.75), hx, ht + 3, 14, 1); }
    return;
  }
  // 윗머리 볼륨
  P(A, hx + 1, ht - 1, 12, 1); P(A, hx, ht, 14, 4);
  if (st === 'bun') { P(A, cx - 3, ht - 4, 6, 3); P(B, cx - 2, ht - 4, 3, 1); }
  if (st === 'twin') { P(A, hx - 2, ht - 2, 4, 4); P(A, hx + 12, ht - 2, 4, 4); P(B, hx - 1, ht - 2, 2, 1); P(B, hx + 13, ht - 2, 2, 1); }
  if (!front) {
    // 뒤통수
    const depth = st === 'bob' ? 11 : st === 'short' ? 9 : st === 'bun' ? 9 : (st === 'long' || st === 'wave') ? 18 : 10;
    P(A, hx, ht, 14, depth);
    if (st === 'wave') { P(B, hx + 2, ht + 8, 2, 6); P(B, hx + 9, ht + 10, 2, 6); P(A, hx - 1, ht + 6, 1, 10); P(A, hx + 14, ht + 6, 1, 10); }
    if (st === 'twin') { P(A, hx, ht + 10, 3, 4); P(A, hx + 11, ht + 10, 3, 4); }
    P(B, hx + 3, ht + 1, 5, 1); P(B, hx + 9, ht + 2, 2, 1);
    if (st === 'wavy') { P(A, hx + 1, ht + depth, 3, 1); P(A, hx + 6, ht + depth, 3, 1); P(A, hx + 11, ht + depth, 2, 1); P(shade(A, 1.15), hx + 4, ht + 5, 6, 1); }
    if (st === 'ponytail') { P('#e0606f', cx - 1, ht + 6, 3, 1); P(A, cx - 1, ht + 7, 3, 8); P(B, cx, ht + 8, 1, 4); }
    return;
  }
  if (st === 'wavy') {
    P(A, hx + 3, ht - 2, 3, 1); P(A, hx + 8, ht - 2, 2, 1);
    P(A, hx, ht + 4, 14, 1); P(PAL.skin, hx + 5, ht + 4, 1, 1); P(PAL.skin, hx + 9, ht + 4, 1, 1);
    P(A, hx, ht + 5, 3, 1); P(A, hx + 6, ht + 5, 2, 1); P(A, hx + 11, ht + 5, 3, 1);
    P(A, hx, ht + 6, 2, 3); P(A, hx + 12, ht + 6, 2, 2);
    P(B, hx + 3, ht + 1, 4, 1); P(B, hx + 9, ht + 2, 2, 1); P(B, hx + 2, ht + 3, 2, 1);
  } else if (st === 'ponytail') {
    P(A, hx, ht + 4, 14, 1); P(PAL.skin, hx + 6, ht + 4, 2, 1);
    P(A, hx, ht + 5, 2, 4); P(A, hx + 12, ht + 5, 2, 4); P(A, hx + 3, ht + 5, 2, 1);
    P(B, hx + 3, ht + 1, 4, 1); P(B, hx + 9, ht + 1, 2, 1);
  } else if (st === 'bob') {
    P(A, hx, ht + 4, 14, 2); P(PAL.skin, hx + 4, ht + 5, 6, 1);
    P(A, hx, ht + 6, 2, 5); P(A, hx + 12, ht + 6, 2, 5); P(A, hx - 1, ht + 3, 1, 7); P(A, hx + 14, ht + 3, 1, 7);
    P(B, hx + 2, ht + 1, 5, 1); P(B, hx + 9, ht + 2, 3, 1);
  } else if (st === 'short') {
    P(A, hx, ht + 4, 14, 1); P(PAL.skin, hx + 4, ht + 4, 2, 1); P(PAL.skin, hx + 9, ht + 4, 1, 1);
    P(A, hx, ht + 5, 2, 1); P(A, hx + 12, ht + 5, 2, 1);
    P(B, hx + 3, ht + 1, 4, 1);
  } else if (st === 'bun') {
    P(A, hx, ht + 4, 3, 2); P(A, hx + 11, ht + 4, 3, 2); P(B, hx + 4, ht + 1, 6, 1);
  } else if (st === 'long' || st === 'wave' || st === 'twin') {
    P(A, hx, ht + 4, 14, 1); P(PAL.skin, hx + 5, ht + 4, 3, 1); P(A, hx + 3, ht + 5, 2, 1); P(A, hx + 9, ht + 5, 2, 1);
    const L = st === 'twin' ? 8 : 15;
    P(A, hx - 1, ht + 2, 3, L); P(A, hx + 12, ht + 2, 3, L);
    if (st === 'wave') { P(B, hx - 1, ht + 8, 1, 5); P(B, hx + 14, ht + 9, 1, 5); P(A, hx - 2, ht + 10, 1, 6); P(A, hx + 15, ht + 10, 1, 6); }
    P(B, hx + 3, ht + 1, 5, 1); P(B, hx + 10, ht + 2, 2, 1);
  }
}

/* 스프라이트 캐시 */
const _chibiCache = new Map();
function chibi(look, outfitKey, face, frame, pose, blink) {
  const key = (look.cacheId || look.name) + '|' + (typeof outfitKey === 'string' ? outfitKey : outfitKey.key) + '|' + face + frame + pose + (blink ? 1 : 0);
  let c = _chibiCache.get(key);
  if (!c) { c = drawChibi(look, outfitKey, face, frame, pose, blink); _chibiCache.set(key, c); }
  return c;
}

/* ---------------------------------------------------------
 *  대화창 초상화 (32×32) — 표정 8종
 *  normal · smile · laugh · surprise · blush · tease · serious · sad
 * --------------------------------------------------------- */
function drawPortrait(look, outfitKey, expr) {
  const c = mkCanvas(32, 32), g = c.getContext('2d');
  const o = typeof outfitKey === 'object' ? outfitKey : (look.outfits[outfitKey] || Object.values(look.outfits)[0]);
  const P = (col, x, y, w = 1, h = 1) => { if (!col) return; g.fillStyle = col; g.fillRect(x, y, w, h); };
  const A = look.hairC, B = look.hairH, st = look.hair;

  if (st === 'ponytail') { P(A, 25, 6, 4, 13); P(B, 26, 8, 1, 6); }
  // 어깨
  P(o.coat, 2, 26, 28, 6); P(o.coatS, 2, 27, 3, 5); P(o.coatS, 27, 27, 3, 5);
  P(PAL.skin, 13, 22, 6, 5); P(PAL.skinS, 13, 22, 6, 1);
  if (!o.closed) { P(o.shirt, 12, 26, 8, 6); P(o.coatS, 11, 26, 2, 6); P(o.coatS, 19, 26, 2, 6); }
  else { P(o.collar || o.shirt, 11, 26, 10, 1); P(o.coatS, 15, 27, 2, 5); }
  if (o.badge) { P(PAL.gold, 22, 28, 3, 3); P(PAL.goldS, 23, 29, 1, 1); }
  if (o.apron) { P(o.apron, 8, 28, 16, 4); P(shade(o.apron, 0.8), 10, 27, 1, 1); P(shade(o.apron, 0.8), 21, 27, 1, 1); }
  if (o.stetho) { P('#4b5878', 12, 26, 1, 4); P('#4b5878', 19, 26, 1, 4); P('#c9ced8', 19, 30, 2, 2); }
  if (o.accent) { P(o.accent, 2, 29, 28, 1); }
  if (o.stripe) for (let y = 27; y < 32; y += 2) P(o.stripe, 2, y, 28, 1);
  if (o.knit) for (let y = 27; y < 32; y++) for (let x = 3 + (y % 2); x < 29; x += 2) P(shade(o.coat, 1.1), x, y, 1, 1);
  if (o.vest) { P(o.vest, 4, 27, 8, 5); P(o.vest, 20, 27, 8, 5); P('#f2c94c', 4, 29, 8, 1); P('#f2c94c', 20, 29, 8, 1); }
  if (o.denim) { P(shade(o.coat, 1.2), 3, 28, 7, 1); P(shade(o.coat, 1.2), 22, 28, 7, 1); }
  if (o.hood) { P(shade(o.coat, 0.8), 7, 25, 18, 2); P('#ffffff', 13, 27, 1, 4); P('#ffffff', 18, 27, 1, 4); }
  if (o.strap) { P(o.strap, 6, 26, 2, 6); P(o.strap, 24, 26, 2, 6); }

  // 얼굴
  P(PAL.skin, 6, 5, 20, 18);
  g.clearRect(6, 5, 2, 1); g.clearRect(24, 5, 2, 1); g.clearRect(6, 6, 1, 1); g.clearRect(25, 6, 1, 1);
  g.clearRect(6, 22, 3, 1); g.clearRect(23, 22, 3, 1); g.clearRect(6, 21, 1, 1); g.clearRect(25, 21, 1, 1);
  P(PAL.skin, 4, 13, 2, 4); P(PAL.skin, 26, 13, 2, 4); // 귀
  P(PAL.skinS, 4, 14, 1, 2); P(PAL.skinS, 27, 14, 1, 2);

  // 머리카락
  if (st === 'cap') {
    const C = look.capC;
    P(C, 5, 2, 22, 7); P(C, 7, 1, 18, 1); P(shade(C, 1.2), 9, 3, 8, 1); P(shade(C, 0.72), 4, 9, 26, 2);
    P(A, 5, 11, 2, 4); P(A, 25, 11, 2, 4);
  } else {
    P(A, 5, 2, 22, 8); P(A, 7, 1, 18, 1); P(A, 4, 5, 2, 9); P(A, 26, 5, 2, 9);
    if (st === 'wavy') {
      P(A, 9, 0, 4, 1); P(A, 17, 0, 3, 1);
      P(A, 6, 10, 4, 1); P(A, 11, 10, 3, 1); P(A, 16, 10, 3, 1); P(A, 21, 10, 5, 1);
      P(A, 6, 11, 2, 1); P(A, 12, 11, 1, 1); P(A, 17, 11, 1, 1); P(A, 23, 11, 3, 1);
      P(A, 4, 14, 2, 3); P(A, 26, 14, 2, 2);
      P(B, 9, 3, 5, 1); P(B, 18, 4, 4, 1); P(B, 7, 6, 2, 1); P(B, 14, 7, 3, 1); P(B, 22, 7, 2, 1);
    } else if (st === 'ponytail') {
      P(A, 6, 10, 9, 1); P(A, 18, 10, 8, 1); P(A, 6, 11, 4, 1); P(A, 22, 11, 4, 1);
      P(A, 4, 14, 2, 5); P(A, 26, 14, 2, 5); P('#e0606f', 25, 6, 2, 2);
      P(B, 9, 3, 6, 1); P(B, 19, 4, 3, 1);
    } else if (st === 'bob') {
      P(A, 6, 10, 20, 2); P(A, 3, 6, 3, 15); P(A, 26, 6, 3, 15); P(A, 6, 12, 2, 1); P(A, 24, 12, 2, 1);
      P(B, 9, 3, 7, 1); P(B, 19, 4, 4, 1); P(B, 4, 9, 1, 5);
    } else if (st === 'short') {
      P(A, 6, 10, 5, 1); P(A, 13, 10, 7, 1); P(A, 22, 10, 4, 1); P(A, 6, 11, 2, 1);
      P(B, 10, 3, 5, 1);
    } else if (st === 'bun') {
      P(A, 11, -1, 10, 4); P(B, 13, 0, 4, 1);
      P(A, 6, 10, 4, 1); P(A, 22, 10, 4, 1); P(B, 8, 4, 8, 1);
    } else if (st === 'long' || st === 'wave' || st === 'twin') {
      P(A, 6, 10, 7, 1); P(A, 18, 10, 8, 1); P(A, 6, 11, 3, 1); P(A, 23, 11, 3, 1); P(A, 12, 11, 2, 1);
      const L = st === 'twin' ? 14 : 26;
      P(A, 2, 6, 4, L); P(A, 26, 6, 4, L);
      if (st === 'twin') { P(A, 1, 0, 7, 6); P(A, 24, 0, 7, 6); P(B, 2, 1, 3, 1); P(B, 25, 1, 3, 1); }
      if (st === 'wave') { P(B, 3, 14, 1, 8); P(B, 28, 16, 1, 8); P(A, 1, 18, 1, 10); P(A, 30, 18, 1, 10); }
      P(B, 9, 3, 6, 1); P(B, 19, 4, 4, 1);
    }
  }
  if (o.hat === 'straw') { P('#f1d27e', 7, -1, 18, 7); P('#e3615a', 7, 4, 18, 1); P('#e8c66a', 0, 6, 32, 3); P(shade('#e8c66a', 0.8), 0, 8, 32, 1); }
  else if (o.hat === 'beanie') { const hc = o.hatC || '#e3615a'; P(hc, 5, 0, 22, 8); P(shade(hc, 0.8), 5, 7, 22, 2); P('#ffffff', 14, -1, 4, 2); }
  if (o.veil) { P('#fbfbff', 1, 5, 3, 27); P('#fbfbff', 28, 5, 3, 27); P('#f7b9c9', 8, 2, 4, 2); P('#ffffff', 14, 1, 4, 2); P('#f7b9c9', 20, 2, 4, 2); }
  if (o.scarf) { P(o.scarf, 7, 23, 18, 4); P(shade(o.scarf, 0.8), 7, 26, 18, 1); P(o.scarf, 18, 26, 4, 5); }
  if (o.bow) { P(o.bow, 12, 26, 3, 3); P(o.bow, 17, 26, 3, 3); P(shade(o.bow, 0.7), 15, 27, 2, 1); }

  // 표정
  const L = 9, R = 20, EY = 13;
  const eyeOpen = (x) => { P(PAL.eye, x, EY, 3, 4); P(look.eyeC, x, EY + 2, 3, 2); P(PAL.eye, x + 1, EY + 3, 1, 1); P(PAL.white, x, EY, 1, 1); P(PAL.white, x + 2, EY + 2, 1, 1); if (look.fem) { P(PAL.eye, x === L ? x - 1 : x + 3, EY - 1, 1, 1); } };
  const eyeArc = (x) => { P(PAL.eye, x, EY + 2, 1, 1); P(PAL.eye, x + 1, EY + 1, 1, 1); P(PAL.eye, x + 2, EY + 2, 1, 1); P(PAL.eye, x - 1, EY + 3, 1, 1); P(PAL.eye, x + 3, EY + 3, 1, 1); };
  const eyeLine = (x) => { P(PAL.eye, x - 1, EY + 2, 5, 1); };
  const brow = (x, tilt) => {
    if (tilt === 0) P(A, x, EY - 2, 3, 1);
    else if (tilt > 0) { P(A, x, EY - 3, 1, 1); P(A, x + 1, EY - 2, 2, 1); } // 안쪽으로 찌푸림
    else { P(A, x, EY - 2, 2, 1); P(A, x + 2, EY - 3, 1, 1); }
  };
  const blush = (strong) => { P(PAL.blush, 7, 18, 3, 1); P(PAL.blush, 22, 18, 3, 1); if (strong) { P(PAL.blush, 8, 19, 2, 1); P(PAL.blush, 22, 19, 2, 1); P('#ee8a8a', 8, 18, 1, 1); P('#ee8a8a', 23, 18, 1, 1); } };
  const M = look.fem ? '#d9606f' : PAL.mouth, mx = 15, my = 20;
  const ce = look.closedEyes;
  switch (expr) {
    case 'smile':
      brow(L, 0); brow(R, 0); eyeArc(L); eyeArc(R); blush(false);
      P(M, mx - 2, my, 1, 1); P(M, mx - 1, my + 1, 3, 1); P(M, mx + 2, my, 1, 1); break;
    case 'laugh':
      brow(L, -1); brow(R, 1 * 0); eyeArc(L); eyeArc(R); blush(false);
      P(M, mx - 2, my, 5, 2); P('#f08a96', mx - 1, my + 1, 3, 1); P(PAL.white, mx - 1, my, 3, 1); break;
    case 'surprise':
      brow(L, -1); brow(R, 1); if (ce) { eyeLine(L); eyeLine(R); } else { eyeOpen(L); eyeOpen(R); }
      P(M, mx - 1, my, 2, 2); break;
    case 'blush':
      brow(L, -1); P(A, R, EY - 3, 1, 1); P(A, R + 1, EY - 2, 2, 1);
      if (ce) { eyeLine(L); eyeLine(R); } else { P(PAL.eye, L, EY + 1, 3, 3); P(PAL.eye, R, EY + 1, 3, 3); P(look.eyeC, L, EY + 2, 3, 2); P(look.eyeC, R, EY + 2, 3, 2); P(PAL.white, L, EY + 1, 1, 1); P(PAL.white, R, EY + 1, 1, 1); }
      blush(true); P(M, mx - 1, my, 1, 1); P(M, mx, my + 1, 1, 1); P(M, mx + 1, my, 1, 1); break;
    case 'tease':
      brow(L, 0); P(A, R, EY - 3, 3, 1); eyeArc(L); if (ce) eyeLine(R); else eyeOpen(R); blush(false);
      P(M, mx - 1, my + 1, 3, 1); P(M, mx + 2, my, 1, 1); break;
    case 'serious':
      brow(L, 1); brow(R, -1); if (ce) { eyeLine(L); eyeLine(R); } else { eyeOpen(L); eyeOpen(R); P(PAL.skin, L, EY, 3, 1); P(PAL.skin, R, EY, 3, 1); }
      P(M, mx - 1, my, 3, 1); break;
    case 'sad':
      brow(L, -1); brow(R, 1); if (ce) { eyeLine(L); eyeLine(R); } else { eyeOpen(L); eyeOpen(R); }
      P(M, mx - 1, my + 1, 3, 1); P(M, mx - 2, my + 2, 1, 1); P(M, mx + 2, my + 2, 1, 1); break;
    default:
      brow(L, 0); brow(R, 0); if (ce) { eyeLine(L); eyeLine(R); } else { eyeOpen(L); eyeOpen(R); } blush(false);
      P(M, mx - 1, my + 1, 3, 1); P(M, mx - 2, my, 1, 1); P(M, mx + 2, my, 1, 1);
  }
  autoOutline(c);
  return c;
}

/* ---------------------------------------------------------
 *  지형 타일 (쿼터뷰 32×16)
 * --------------------------------------------------------- */
const TW = 32, TH = 16;
function hash2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

function tileUV(px, py) { // 타일 캔버스 픽셀 → 타일 내부 좌표 (0..1)
  const sx = px + 0.5 - 16, sy = py + 0.5;
  return [(sx / 16 + sy / 8) / 2, (sy / 8 - sx / 16) / 2];
}
function inDiamond(px, py) {
  const sx = Math.abs(px + 0.5 - 16) / 16, sy = Math.abs(py + 0.5 - 8) / 8;
  return sx + sy <= 1.0001;
}

const SEASON_GRASS = {
  summer: ['#80c159', '#6fb04f', '#93d066', '#a4dc74'],
  autumn: ['#b8b45c', '#a39d48', '#cfc46c', '#e0a24a'],
  winter: ['#eef3f7', '#d9e3ec', '#ffffff', '#a9c39b'],
  spring: ['#97d167', '#84c05a', '#b2de80', '#f2d84a'],
};
function makeTile(type, variant, frame = 0, season = 'summer') {
  const SG = SEASON_GRASS[season] || SEASON_GRASS.summer;
  const c = mkCanvas(TW, TH), g = c.getContext('2d');
  const img = g.createImageData(TW, TH), a = img.data;
  for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
    if (!inDiamond(px, py)) continue;
    const [u, v] = tileUV(px, py);
    const n = hash2(px + variant * 31, py + variant * 17, 7);
    let col;
    if (type === 'grass' || type === 'flower' || type === 'hill') {
      col = n < 0.12 ? SG[1] : n > 0.9 ? SG[2] : SG[0];
      if (type === 'hill') col = shade(col, n > 0.5 ? 1.06 : 1.02);
      if (variant % 3 === 1 && n > 0.95) col = SG[3];
    } else if (type === 'rock') {
      const cell = hash2(Math.floor(u * 3) + variant, Math.floor(v * 3), 4);
      col = cell < 0.3 ? '#4b4f59' : cell < 0.7 ? '#5b5f69' : '#666a75';
      if (n > 0.93) col = '#80848e'; if (season === 'winter' && n > 0.8) col = '#e6ecf2';
    } else if (type === 'floor') {
      const pu = u * 4, fu = pu - Math.floor(pu);
      col = fu < 0.08 ? '#9a6b45' : (Math.floor(pu) % 2 ? '#d7a874' : '#cf9d68');
    } else if (type === 'tilefloor') {
      const su = u * 3, sv = v * 3, fu = su - Math.floor(su), fv = sv - Math.floor(sv);
      col = (fu < 0.07 || fv < 0.07) ? '#b7c3c9' : ((Math.floor(su) + Math.floor(sv)) % 2 ? '#eef3f5' : '#e1e9ec');
    } else if (type === 'mat') {
      const su = u * 4, fu = su - Math.floor(su);
      col = fu < 0.1 ? '#a99b6a' : '#d9cc96';
    } else if (type === 'pond') {
      col = n < 0.3 ? '#3f8fa8' : '#4c9db4'; if (n > 0.97) col = '#b9e4ee';
    } else if (type === 'path') {
      const su = u * 2.5 + (Math.floor(v * 2.5) % 2) * 0.5, sv = v * 2.5;
      const fu = su - Math.floor(su), fv = sv - Math.floor(sv);
      const cell = hash2(Math.floor(su) + variant * 5, Math.floor(sv), 3);
      col = (fu < 0.1 || fv < 0.1) ? '#b7aa95' : cell < 0.33 ? '#ddd3c0' : cell < 0.66 ? '#e6ddcb' : '#d3c8b3';
      if (n > 0.97) col = '#f1ebdf';
      if (season === 'winter' && n > 0.72) col = '#f7fafc';
      if (season === 'autumn' && n > 0.96) col = '#e0a24a';
    } else if (type === 'sand') {
      col = n < 0.08 ? '#e2c98f' : n > 0.94 ? '#fbedc4' : '#f1dca6';
    } else if (type === 'wood') {
      const pu = u * 4, fu = pu - Math.floor(pu);
      col = fu < 0.14 ? '#7a5236' : (Math.floor(pu) % 2 ? '#c08a5a' : '#b37e50');
      if (n > 0.95) col = '#9c6c44';
    } else if (type === 'water') {
      const w = Math.sin((u * 6 + v * 2 + frame * 0.33 + variant * 0.7) * Math.PI);
      col = w > 0.86 ? '#9fd6f2' : (n < 0.3 ? '#4a9bd4' : '#53a6dc');
      if (season === 'winter') col = w > 0.86 ? '#a9cde2' : (n < 0.3 ? '#3f86ba' : '#4892c4');
      if (n > 0.985) col = '#c9ecfb';
    }
    const [r, gg, b] = hexRgb(col); const i = (py * TW + px) * 4;
    a[i] = r; a[i + 1] = gg; a[i + 2] = b; a[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  if (type === 'grass' && variant % 4 === 0 && season !== 'winter') { g.fillStyle = shade(SG[1], 0.85); g.fillRect(10 + variant % 5, 6, 1, 2); g.fillRect(12 + variant % 5, 7, 1, 1); }
  if (type === 'grass' && season === 'spring' && variant % 5 === 2) { g.fillStyle = '#ffffff'; g.fillRect(9, 7, 1, 1); g.fillRect(20, 9, 1, 1); g.fillStyle = '#f2d84a'; g.fillRect(14, 5, 1, 1); }
  if (type === 'flower') {
    const sets = { summer: [['#7fa3e6', '#a9c3f2'], ['#c08ad8', '#dcb5ee'], ['#f19ab5', '#f8c3d4']], spring: [['#f2d84a', '#fff1a0'], ['#f5e05a', '#fff6c0'], ['#f19ab5', '#fbd3df']], autumn: [['#e9e1c9', '#ffffff'], ['#f19ab5', '#f8c3d4'], ['#e9e1c9', '#f5efdd']], winter: [['#d9404f', '#f08a94'], ['#3f7f4a', '#5a9a60'], ['#d9404f', '#ff9aa4']] }[season];
    for (let k = 0; k < 4; k++) {
      const [c1, c2] = sets[(variant + k) % 3];
      const fx = 7 + ((k * 7 + variant * 3) % 16), fy = 4 + ((k * 5 + variant) % 7);
      if (season === 'autumn' && k % 2 === 0) { g.fillStyle = '#b8a77a'; g.fillRect(fx, fy - 3, 1, 5); g.fillStyle = c1; g.fillRect(fx - 1, fy - 5, 3, 3); }
      else { fillEllipse(g, fx, fy, 3, 2, c1); g.fillStyle = c2; g.fillRect(fx - 1, fy - 1, 2, 1); g.fillStyle = '#4f8a3a'; g.fillRect(fx + 2, fy + 1, 1, 1); }
    }
  }
  if (type === 'pond' && variant % 2 === 0) { fillEllipse(g, 12 + variant, 8, 3, 2, '#5aa850'); g.fillStyle = '#f7b9c9'; g.fillRect(12 + variant, 7, 1, 1); }
  return c;
}

/* ---------------------------------------------------------
 *  소품 스프라이트 — {c: canvas, ax, ay}  (ax,ay = 타일 중심이 놓이는 캔버스 좌표)
 * --------------------------------------------------------- */
function sprTree(kind, v, season = 'summer') {
  const c = mkCanvas(32, 44), g = c.getContext('2d');
  const cx = 16, by = 38;
  fillEllipse(g, cx, by, 9, 3, 'rgba(0,0,0,0.18)');
  if (kind === 'palm') {
    g.fillStyle = '#9a6a43';
    for (let i = 0; i < 26; i++) g.fillRect(cx - 1 + Math.round(Math.sin(i / 8) * 2), by - i, 3, 1);
    g.fillStyle = '#7d5434'; for (let i = 2; i < 26; i += 3) g.fillRect(cx - 1 + Math.round(Math.sin(i / 8) * 2), by - i, 3, 1);
    const tx = cx + 2, ty = by - 26;
    const leaf = (dx, dy, col) => { for (let i = 0; i < 9; i++) { g.fillStyle = col; g.fillRect(Math.round(tx + dx * i), Math.round(ty + dy * i + i * i * 0.08), 3, 2); } };
    leaf(-1.2, 0.1, '#3f8f45'); leaf(1.2, 0.1, '#3f8f45'); leaf(-0.8, -0.5, '#56a856'); leaf(0.8, -0.5, '#56a856'); leaf(0.1, -0.7, '#6cbf62'); leaf(-0.4, 0.5, '#3f8f45'); leaf(0.5, 0.5, '#4a9a4c');
  } else {
    g.fillStyle = '#87603f'; g.fillRect(cx - 2, by - 12, 4, 12); g.fillStyle = '#6b4a30'; g.fillRect(cx + 1, by - 12, 1, 12);
    let main = kind === 'orange' ? '#4f9a46' : (v % 2 ? '#4f9e4a' : '#5aa850');
    if (kind !== 'orange') {
      if (season === 'autumn') main = ['#e0893a', '#d9643f', '#e8b34a', '#c9733a'][v % 4];
      if (season === 'spring') main = v % 2 ? '#f6b8c8' : '#8fd06a';
    }
    if (season === 'winter' && kind !== 'orange' && v % 2 === 0) {
      // 앙상한 겨울나무 + 눈
      g.fillStyle = '#7a5a3f';
      for (const [dx, dy, l] of [[-1, -14, 9], [2, -18, 7], [-4, -20, 6], [4, -23, 5]]) for (let i = 0; i < l; i++) g.fillRect(cx + Math.round(dx * i / 3), by + dy - i, 1, 1);
      g.fillStyle = '#ffffff'; g.fillRect(cx - 5, by - 26, 3, 1); g.fillRect(cx + 4, by - 27, 3, 1); g.fillRect(cx, by - 30, 2, 1);
      autoOutline(c, '#3a3a3a');
      return { c, ax: 16, ay: 37 };
    }
    if (season === 'winter' && kind !== 'orange') main = '#3f7a55';
    fillEllipse(g, cx, by - 20, 12, 10, shade(main, 0.8));
    fillEllipse(g, cx - 1, by - 22, 11, 9, main);
    fillEllipse(g, cx - 3, by - 25, 6, 5, shade(main, 1.25));
    if (season === 'winter') { fillEllipse(g, cx - 1, by - 28, 8, 3, '#ffffff'); }
    if (season === 'spring' && v % 2) { g.fillStyle = '#ffffff'; for (const [dx, dy] of [[-5, -21], [3, -25], [6, -18], [-2, -16]]) g.fillRect(cx + dx, by + dy, 1, 1); }
    if (kind === 'orange' && season === 'spring') { g.fillStyle = '#ffffff'; for (const [dx, dy] of [[-6, -18], [4, -16], [-1, -24], [6, -23]]) g.fillRect(cx + dx, by + dy, 2, 1); }
    else if (kind === 'orange' && season === 'summer') { g.fillStyle = '#9bd24f'; for (const [dx, dy] of [[-6, -18], [4, -16], [-1, -24], [6, -23]]) g.fillRect(cx + dx, by + dy, 2, 2); }
    else if (kind === 'orange') {
      g.fillStyle = '#f39a2b';
      for (const [dx, dy] of [[-6, -18], [4, -16], [-1, -24], [6, -23], [-7, -25], [1, -15], [8, -19]]) { g.fillRect(cx + dx, by + dy, 2, 2); }
      g.fillStyle = '#ffc163'; g.fillRect(cx - 6, by - 18, 1, 1); g.fillRect(cx + 4, by - 16, 1, 1);
    } else if (v % 3 === 0 && season === 'summer') {
      g.fillStyle = '#f7b9c9'; for (const [dx, dy] of [[-5, -21], [3, -25], [6, -18]]) g.fillRect(cx + dx, by + dy, 2, 1);
    }
  }
  autoOutline(c, '#2a3a26');
  return { c, ax: 16, ay: 37 };
}
function sprWall() {
  const c = mkCanvas(32, 24), g = c.getContext('2d');
  // 제주 돌담 — 현무암
  const cols = ['#4c4f58', '#5b5f69', '#41444c', '#666a74'];
  for (let i = 0; i < 9; i++) {
    const x = 5 + (i % 3) * 8 + (Math.floor(i / 3) % 2) * 3, y = 6 + Math.floor(i / 3) * 4;
    fillEllipse(g, x, y, 4, 3, cols[i % 4]);
    g.fillStyle = '#7a7e88'; g.fillRect(x - 2, y - 2, 2, 1);
  }
  autoOutline(c, '#26272c');
  return { c, ax: 16, ay: 17 };
}
function sprBench() {
  const c = mkCanvas(32, 24), g = c.getContext('2d');
  fillPoly(g, [[4, 10], [16, 4], [28, 10], [16, 16]], '#c58a55');
  fillPoly(g, [[4, 10], [16, 16], [16, 18], [4, 12]], '#8c5c36');
  fillPoly(g, [[16, 16], [28, 10], [28, 12], [16, 18]], '#a06a3e');
  g.fillStyle = '#9c6a40'; for (let i = 0; i < 3; i++) { g.fillRect(8 + i * 6, 7 + (i % 2), 4, 1); }
  g.fillStyle = '#5a3a24'; g.fillRect(6, 12, 2, 5); g.fillRect(25, 12, 2, 5); g.fillRect(15, 17, 2, 4);
  autoOutline(c, '#3a2618');
  return { c, ax: 16, ay: 10 };
}
function sprLamp() {
  const c = mkCanvas(16, 40), g = c.getContext('2d');
  fillEllipse(g, 8, 36, 4, 2, 'rgba(0,0,0,0.2)');
  g.fillStyle = '#3d4658'; g.fillRect(7, 10, 2, 26); g.fillRect(5, 34, 6, 2);
  g.fillStyle = '#2e3646'; g.fillRect(4, 6, 8, 2); g.fillRect(5, 4, 6, 2);
  g.fillStyle = '#ffe9a6'; g.fillRect(5, 8, 6, 4); g.fillStyle = '#fff6d6'; g.fillRect(6, 9, 2, 2);
  autoOutline(c, '#22262f');
  return { c, ax: 8, ay: 35 };
}
function sprParasol() {
  const c = mkCanvas(32, 40), g = c.getContext('2d');
  g.fillStyle = '#e9e2d2'; g.fillRect(15, 12, 2, 20);
  fillPoly(g, [[16, 2], [30, 12], [16, 16], [2, 12]], '#f2f2ee');
  g.fillStyle = '#e3615a'; for (let x = 4; x < 30; x += 6) { fillPoly(g, [[16, 2], [x, 12], [x + 3, 12.5]], '#e3615a'); }
  fillPoly(g, [[6, 28], [16, 24], [26, 28], [16, 32]], '#f4efe6');
  g.fillStyle = '#b9ab95'; g.fillRect(15, 32, 2, 4);
  g.fillStyle = '#7a4e33'; g.fillRect(12, 26, 3, 2); g.fillStyle = '#ffffff'; g.fillRect(18, 27, 2, 2);
  autoOutline(c, '#3a2c2a');
  return { c, ax: 16, ay: 34 };
}
function sprTelescope() {
  const c = mkCanvas(20, 30), g = c.getContext('2d');
  g.fillStyle = '#6c7a8e'; g.fillRect(9, 14, 2, 12); g.fillRect(5, 25, 10, 2);
  fillPoly(g, [[3, 12], [15, 6], [17, 9], [5, 15]], '#3f6fb5');
  g.fillStyle = '#cfe0f5'; g.fillRect(15, 6, 2, 3);
  autoOutline(c);
  return { c, ax: 10, ay: 26 };
}
function sprHareubang() {
  const c = mkCanvas(20, 34), g = c.getContext('2d');
  // 돌하르방 — 제주 현무암 석상
  fillEllipse(g, 10, 30, 6, 2, 'rgba(0,0,0,0.2)');
  fillEllipse(g, 10, 22, 6, 8, '#5d616b');
  fillEllipse(g, 10, 10, 6, 7, '#666a74');
  fillEllipse(g, 10, 5, 6, 3, '#555962');
  g.fillStyle = '#3d4048'; g.fillRect(7, 9, 2, 2); g.fillRect(12, 9, 2, 2); g.fillRect(9, 12, 3, 2);
  g.fillStyle = '#4a4d56'; g.fillRect(5, 19, 10, 2);
  g.fillStyle = '#7d818b'; g.fillRect(7, 7, 2, 1); g.fillRect(6, 17, 2, 4);
  autoOutline(c, '#26272c');
  return { c, ax: 10, ay: 29 };
}
function sprBoard() {
  const c = mkCanvas(24, 34), g = c.getContext('2d');
  g.fillStyle = '#7a5236'; g.fillRect(4, 14, 2, 18); g.fillRect(18, 14, 2, 18);
  g.fillStyle = '#a7774c'; g.fillRect(2, 4, 20, 14); g.fillStyle = '#f4efe2'; g.fillRect(4, 6, 16, 10);
  g.fillStyle = '#3f63a8'; fillPoly(g, [[6, 7], [11, 7], [11, 11], [8.5, 13], [6, 11]], '#3f63a8');
  g.fillStyle = PAL.gold; g.fillRect(8, 9, 1, 2);
  g.fillStyle = '#c9c1ae'; g.fillRect(13, 8, 5, 1); g.fillRect(13, 10, 5, 1); g.fillRect(13, 12, 4, 1);
  g.fillStyle = '#e3615a'; g.fillRect(16, 7, 3, 2);
  autoOutline(c, '#3a2618');
  return { c, ax: 12, ay: 31 };
}
function sprCrates() {
  const c = mkCanvas(28, 22), g = c.getContext('2d');
  const box = (x, y, fruit) => {
    g.fillStyle = '#b98a58'; g.fillRect(x, y + 3, 10, 6); g.fillStyle = '#8f6640'; g.fillRect(x, y + 6, 10, 1);
    g.fillStyle = fruit; for (let i = 0; i < 4; i++) g.fillRect(x + 1 + i * 2, y + 1 + (i % 2), 2, 2);
  };
  box(3, 8, '#f39a2b'); box(14, 8, '#e3484a'); box(8, 2, '#9bd24f');
  autoOutline(c, '#3a2618');
  return { c, ax: 14, ay: 16 };
}
function sprBoat() {
  const c = mkCanvas(44, 30), g = c.getContext('2d');
  fillPoly(g, [[2, 14], [30, 2], [42, 8], [16, 22]], '#f4f1ea');
  fillPoly(g, [[2, 14], [16, 22], [16, 26], [4, 17]], '#3f6fb5');
  fillPoly(g, [[16, 22], [42, 8], [40, 12], [16, 26]], '#355d9a');
  fillPoly(g, [[18, 10], [26, 6], [30, 9], [22, 13]], '#e3615a');
  g.fillStyle = '#7a7e88'; g.fillRect(24, 0, 1, 8);
  autoOutline(c, '#22304a');
  return { c, ax: 22, ay: 16 };
}
function sprPot() {
  const c = mkCanvas(16, 20), g = c.getContext('2d');
  fillEllipse(g, 8, 8, 6, 5, '#5aa850'); fillEllipse(g, 6, 6, 3, 2, '#7cc46a');
  g.fillStyle = '#f19ab5'; g.fillRect(5, 5, 2, 2); g.fillRect(10, 7, 2, 2); g.fillStyle = '#7fa3e6'; g.fillRect(8, 4, 2, 2);
  g.fillStyle = '#c4704e'; g.fillRect(4, 12, 8, 5); g.fillStyle = '#a65a3c'; g.fillRect(4, 12, 8, 1);
  autoOutline(c, '#3a2618');
  return { c, ax: 8, ay: 16 };
}

/* ---------------------------------------------------------
 *  건물 — 쿼터뷰 상자 + 모임지붕 (낮/밤 창문 두 장)
 * --------------------------------------------------------- */
function iso(x, y) { return [(x - y) * 16, (x + y) * 8]; }

function makeBuilding(b, night, season) {
  if (b.kind === 'lighthouse') return makeLighthouse(b, night);
  const { x: bx, y: by, w: bw, h: bh } = b;
  const H = b.wallH, RH = b.roofH, o = 0.22;
  const T = iso(bx, by), R = iso(bx + bw, by), B = iso(bx + bw, by + bh), L = iso(bx, by + bh);
  const pad = 10;
  const minX = L[0] - pad - 8, maxX = R[0] + pad + 8, minY = T[1] - H - RH - pad - 14, maxY = B[1] + pad;
  const c = mkCanvas(maxX - minX, maxY - minY), g = c.getContext('2d');
  const ox = -minX, oy = -minY;
  const S = (p, h = 0) => [p[0] + ox, p[1] + oy - h];

  // 벽 (픽셀 단위 열 채우기)
  const face = (A, Bp, col, colTop) => {
    const a = S(A), bb = S(Bp), slope = (bb[1] - a[1]) / (bb[0] - a[0]);
    for (let X = Math.round(a[0]); X < Math.round(bb[0]); X++) {
      const yE = a[1] + (X + 0.5 - a[0]) * slope;
      g.fillStyle = col; g.fillRect(X, Math.round(yE - H), 1, H);
      if (colTop) { g.fillStyle = colTop; g.fillRect(X, Math.round(yE - 4), 1, 4); }
    }
  };
  const faceRect = (which, t0, t1, h0, h1, col) => {
    const [A, Bp] = which === 'L' ? [L, B] : [B, R];
    const a = S(A), bb = S(Bp), slope = (bb[1] - a[1]) / (bb[0] - a[0]);
    const x0 = Math.round(a[0] + (bb[0] - a[0]) * t0), x1 = Math.round(a[0] + (bb[0] - a[0]) * t1);
    g.fillStyle = col;
    for (let X = x0; X < x1; X++) { const yE = a[1] + (X + 0.5 - a[0]) * slope; g.fillRect(X, Math.round(yE - h1), 1, Math.max(1, h1 - h0)); }
  };

  face(L, B, b.wall, b.base);
  face(B, R, shade(b.wall, 0.82), b.base ? shade(b.base, 0.82) : null);
  if (b.stone) { // 돌 질감
    for (let i = 0; i < 40; i++) {
      const which = i % 2 ? 'L' : 'R', t = hash2(i, 3, 9) * 0.92, h = 2 + hash2(i, 5, 9) * (H - 5);
      faceRect(which, t, t + 0.08, h, h + 2, i % 3 ? shade(b.wall, 1.18) : shade(b.wall, 0.75));
    }
  }

  // 창문
  const winCol = night ? '#ffd77a' : '#9cc9e8', winHi = night ? '#fff1c2' : '#d6ecfa', frame = shade(b.wall, 0.6);
  const winH0 = Math.round(H * 0.4), winH1 = Math.round(H * 0.4) + (b.winH || 7);
  for (const wnd of (b.windows || [])) {
    const [which, t] = wnd, tw = wnd[2] || 0.16;
    faceRect(which, t - 0.015, t + tw + 0.015, winH0 - 1, winH1 + 1, frame);
    faceRect(which, t, t + tw, winH0, winH1, which === 'R' ? shade(winCol, 0.85) : winCol);
    faceRect(which, t, t + tw * 0.35, winH1 - 3, winH1 - 1, winHi);
  }
  // 문 (+y면 = 왼쪽 아래 면)
  const dt = (b.doorT != null ? b.doorT : (1.5 / bw)) - 0.09;
  faceRect('L', dt - 0.02, dt + 0.2, 0, 13, frame);
  faceRect('L', dt, dt + 0.18, 0, 12, b.door || '#7a5236');
  faceRect('L', dt + 0.13, dt + 0.15, 5, 7, PAL.gold);
  if (night) faceRect('L', dt + 0.03, dt + 0.15, 7, 10, '#ffd77a');
  // 차양
  if (b.awning) {
    for (let k = 0; k < 6; k++) faceRect('L', dt - 0.08 + k * 0.06, dt - 0.02 + k * 0.06, 14, 18, k % 2 ? '#ffffff' : b.awning);
  }

  // 지붕
  const E = (x, y) => S(iso(x, y), H);
  const Tq = E(bx - o, by - o), Rq = E(bx + bw + o, by - o), Bq = E(bx + bw + o, by + bh + o), Lq = E(bx - o, by + bh + o);
  let r1, r2;
  if (bw >= bh) { r1 = S(iso(bx + bh / 2, by + bh / 2), H + RH); r2 = S(iso(bx + bw - bh / 2, by + bh / 2), H + RH); }
  else { r1 = S(iso(bx + bw / 2, by + bw / 2), H + RH); r2 = S(iso(bx + bw / 2, by + bh - bw / 2), H + RH); }
  const rc = b.roof, rcL = shade(rc, 1.12), rcD = shade(rc, 0.78);
  let fBack1, fBack2, fRight, fFront;
  if (bw >= bh) { fBack1 = [Tq, Rq, r2, r1]; fBack2 = [Tq, Lq, r1]; fRight = [Rq, Bq, r2]; fFront = [Lq, Bq, r2, r1]; }
  else { fBack1 = [Tq, Rq, r1]; fBack2 = [Tq, Lq, r2, r1]; fRight = [Rq, Bq, r2, r1]; fFront = [Lq, Bq, r2]; }
  if (b.flat) {
    fillPoly(g, [Tq, Rq, Bq, Lq].map(p => [p[0], p[1] - 2]), rcL);
    fillPoly(g, [Lq, Bq, [Bq[0], Bq[1] - 2], [Lq[0], Lq[1] - 2]], rcD);
    fillPoly(g, [Bq, Rq, [Rq[0], Rq[1] - 2], [Bq[0], Bq[1] - 2]], shade(rcD, 0.85));
  } else {
    fillPoly(g, fBack1, rcL); fillPoly(g, fBack2, rcL);
    fillPoly(g, fRight, rcD); fillPoly(g, fFront, rc);
    // 기와 줄무늬
    const stripe = (poly, col, eA, eB) => {
      const path = new Path2D(); path.moveTo(poly[0][0], poly[0][1]); for (const p of poly.slice(1)) path.lineTo(p[0], p[1]); path.closePath();
      g.fillStyle = col;
      const slope = (eB[1] - eA[1]) / (eB[0] - eA[0]);
      for (let k = 3; k < RH + 20; k += 4) {
        for (let X = Math.floor(Math.min(eA[0], eB[0])); X < Math.ceil(Math.max(eA[0], eB[0])); X++) {
          const y = Math.round(eA[1] + (X + 0.5 - eA[0]) * slope - k);
          if (g.isPointInPath(path, X + 0.5, y + 0.5)) g.fillRect(X, y, 1, 1);
        }
      }
    };
    stripe(fFront, shade(rc, 0.88), Lq, Bq);
    stripe(fRight, shade(rcD, 0.86), Bq, Rq);
    if (season === 'winter') {
      const snowy = (poly, k) => { const cxp = poly.reduce((a, p) => a + p[0], 0) / poly.length; const top = Math.min(...poly.map(p => p[1])); fillPoly(g, poly.map(p => [p[0] + (cxp - p[0]) * 0.05, top + (p[1] - top) * k]), '#f4f8fb'); };
      snowy(fFront, 0.62); snowy(fRight, 0.55); snowy(fBack1, 0.7); snowy(fBack2, 0.7);
    }
    // 처마 끝선
    const eave = (A, Bp, col) => { const s = (Bp[1] - A[1]) / (Bp[0] - A[0]); g.fillStyle = col; for (let X = Math.round(A[0]); X < Math.round(Bp[0]); X++) g.fillRect(X, Math.round(A[1] + (X + 0.5 - A[0]) * s), 1, 2); };
    eave(Lq, Bq, shade(rc, 0.62)); eave(Bq, Rq, shade(rc, 0.55));
  }

  // 간판 아이콘
  if (b.sign) drawSign(g, b.sign, S(iso(bx + (b.signX != null ? b.signX : 1.5), by + bh), H + 2));
  if (b.extra) b.extra(g, S, E, H);

  autoOutline(c, '#2b2026');
  return { c, x: minX, y: minY };
}

function drawSign(g, kind, p) {
  const [x, y] = [Math.round(p[0]), Math.round(p[1])];
  const plate = (col) => { fillEllipse(g, x, y - 6, 6, 6, '#ffffff'); fillEllipse(g, x, y - 6, 5, 5, col); };
  if (kind === 'police') {
    plate('#3f63a8');
    fillPoly(g, [[x - 3, y - 9], [x + 3, y - 9], [x + 3, y - 5], [x, y - 2], [x - 3, y - 5]], PAL.gold);
    g.fillStyle = '#3f63a8'; g.fillRect(x - 1, y - 7, 2, 2);
  } else if (kind === 'cross') {
    plate('#ffffff'); g.fillStyle = '#e3484a'; g.fillRect(x - 1, y - 10, 3, 9); g.fillRect(x - 4, y - 7, 9, 3);
  } else if (kind === 'cup') {
    plate('#7a4e33'); g.fillStyle = '#ffffff'; g.fillRect(x - 3, y - 8, 5, 5); g.fillRect(x + 2, y - 7, 2, 2); g.fillStyle = '#f2e6d0'; g.fillRect(x - 2, y - 10, 1, 2); g.fillRect(x, y - 11, 1, 2);
  } else if (kind === 'basket') {
    plate('#4f9a6a'); g.fillStyle = '#f3c15a'; g.fillRect(x - 4, y - 7, 8, 4); g.fillStyle = '#e3484a'; g.fillRect(x - 2, y - 9, 2, 2); g.fillStyle = '#f39a2b'; g.fillRect(x + 1, y - 9, 2, 2);
  } else if (kind === 'school') {
    plate('#b8503f'); g.fillStyle = '#ffffff'; g.fillRect(x - 3, y - 9, 6, 6); g.fillStyle = '#2b2026'; g.fillRect(x, y - 8, 1, 3); g.fillRect(x, y - 6, 2, 1);
  } else if (kind === 'heart') {
    plate('#e08a6e'); fillPoly(g, [[x - 4, y - 8], [x - 2, y - 10], [x, y - 8], [x + 2, y - 10], [x + 4, y - 8], [x, y - 3]], '#ffffff');
  } else if (kind === 'dress') {
    plate('#d9688a'); fillPoly(g, [[x - 2, y - 10], [x + 2, y - 10], [x + 4, y - 3], [x - 4, y - 3]], '#ffffff'); g.fillStyle = '#d9688a'; g.fillRect(x - 1, y - 8, 2, 1);
  } else if (kind === 'scissors') {
    plate('#8a6fc9'); g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { g.fillRect(x - 3 + i, y - 10 + i, 1, 1); g.fillRect(x + 2 - i, y - 10 + i, 1, 1); } fillEllipse(g, x - 3, y - 3, 2, 2, '#ffffff'); fillEllipse(g, x + 3, y - 3, 2, 2, '#ffffff');
  } else if (kind === 'fish') {
    plate('#2f6fa8'); fillEllipse(g, x - 1, y - 6, 4, 2, '#ffffff'); fillPoly(g, [[x + 2, y - 6], [x + 5, y - 9], [x + 5, y - 3]], '#ffffff'); g.fillStyle = '#2f6fa8'; g.fillRect(x - 3, y - 7, 1, 1);
  } else if (kind === 'hall') {
    plate('#3f7f6a'); fillPoly(g, [[x - 4, y - 6], [x, y - 10], [x + 4, y - 6]], '#ffffff'); g.fillStyle = '#ffffff'; g.fillRect(x - 3, y - 6, 6, 4); g.fillStyle = '#3f7f6a'; g.fillRect(x - 1, y - 4, 2, 2);
  } else if (kind === 'wave') {
    plate('#3a8fc4'); g.fillStyle = '#ffffff'; g.fillRect(x - 4, y - 7, 2, 1); g.fillRect(x - 2, y - 8, 2, 1); g.fillRect(x, y - 7, 2, 1); g.fillRect(x + 2, y - 8, 2, 1); g.fillStyle = '#ef7b3a'; g.fillRect(x - 1, y - 5, 3, 2);
  }
}

function makeLighthouse(b, night) {
  const c = mkCanvas(64, 120), g = c.getContext('2d');
  const cx = 32, base = 104;
  // 바위 받침
  fillPoly(g, [[cx - 30, base], [cx, base - 15], [cx + 30, base], [cx, base + 15]], '#7a7e88');
  fillPoly(g, [[cx - 30, base], [cx, base + 15], [cx, base + 19], [cx - 30, base + 4]], '#5b5f69');
  fillPoly(g, [[cx, base + 15], [cx + 30, base], [cx + 30, base + 4], [cx, base + 19]], '#4c4f58');
  const hTower = 70, r0 = 12, r1 = 8;
  for (let i = 0; i < hTower; i++) {
    const r = Math.round(r0 + (r1 - r0) * (i / hTower)), y = base - i;
    const band = Math.floor(i / 12) % 2 === 1;
    for (let X = -r; X <= r; X++) {
      const t = (X + r) / (2 * r);
      const baseCol = band ? '#d9473f' : '#f6f3ec';
      g.fillStyle = shade(baseCol, t < 0.25 ? 1.08 : t > 0.7 ? 0.78 : 0.95);
      g.fillRect(cx + X, y, 1, 1);
    }
  }
  const top = base - hTower;
  g.fillStyle = '#2f3a4e'; g.fillRect(cx - 12, top - 2, 24, 3);
  g.fillStyle = night ? '#fff0a8' : '#cfe8f7'; g.fillRect(cx - 6, top - 12, 12, 10);
  g.fillStyle = '#2f3a4e'; g.fillRect(cx - 1, top - 12, 2, 10);
  fillPoly(g, [[cx - 8, top - 12], [cx, top - 20], [cx + 8, top - 12]], '#d9473f');
  g.fillStyle = '#2f3a4e'; g.fillRect(cx, top - 23, 1, 3);
  // 문
  g.fillStyle = '#3f63a8'; g.fillRect(cx - 3, base - 10, 6, 10); g.fillStyle = PAL.gold; g.fillRect(cx + 1, base - 5, 1, 1);
  g.fillStyle = night ? '#ffd77a' : '#9cc9e8'; g.fillRect(cx - 2, base - 40, 4, 5); g.fillRect(cx - 2, base - 58, 3, 4);
  autoOutline(c, '#2b2026');
  const [sx, sy] = iso(b.x + b.w / 2, b.y + b.h / 2);
  return { c, x: sx - cx, y: sy - base };
}

/* =========================================================
 *  v2 — 동물 · 가구 · 계절 소품
 * ========================================================= */
const ANIMAL_LOOKS = {
  cheese: { kind: 'cat', name: '노랑이', body: '#f2b84b', dark: '#d9952e', light: '#fbe0a0', belly: '#fff3dc' },
  mackerel: { kind: 'cat', name: '고등어', body: '#8f99a6', dark: '#5f6875', light: '#b8c0ca', belly: '#f4f4f4', stripes: true },
  calico: { kind: 'cat', name: '삼색이', body: '#fbf6ee', dark: '#d9792e', light: '#ffffff', belly: '#ffffff', patches: '#3a3030' },
  baekgu: { kind: 'dog', name: '백구', body: '#f7f3ea', dark: '#ddd3c0', light: '#ffffff', belly: '#ffffff' },
  nureongi: { kind: 'dog', name: '누렁이', body: '#c98a4b', dark: '#9c6532', light: '#e2aa6d', belly: '#f2d3a8' },
};
const _animalCache = new Map();
function animalSprite(al, frame, sit) {
  const key = al.name + frame + (sit ? 's' : '');
  if (_animalCache.has(key)) return _animalCache.get(key);
  const c = mkCanvas(22, 18), g = c.getContext('2d');
  const P = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const dog = al.kind === 'dog';
  const by = 15, lg = frame % 2;
  // 꼬리
  if (dog) { P(al.dark, 3, 7 - lg, 2, 2); P(al.body, 2, 5 - lg, 2, 2); }
  else { P(al.body, 3, 4, 2, 6); P(al.body, 2, 2, 2, 3); if (al.stripes) P(al.dark, 3, 6, 2, 1); }
  // 몸
  if (sit) { P(al.body, 5, 8, 9, 7); P(al.belly, 9, 10, 4, 5); }
  else {
    P(al.body, 4, 8, 11, 5); P(al.belly, 6, 11, 7, 2);
    P(al.dark, 5, 13, 2, 2 - lg); P(al.dark, 12, 13, 2, 1 + lg); P(al.body, 7, 13, 2, 1 + lg); P(al.body, 10, 13, 2, 2 - lg);
  }
  if (al.stripes) { P(al.dark, 7, 8, 1, 3); P(al.dark, 10, 8, 1, 3); }
  if (al.patches) { P(al.patches, 6, 8, 3, 2); P(al.dark, 11, 9, 3, 2); }
  // 머리
  const hx = 12, hy = dog ? 3 : 4;
  P(al.body, hx, hy, 8, 7); P(al.light, hx + 1, hy + 1, 3, 1);
  if (dog) { P(al.dark, hx - 1, hy, 2, 4); P(al.dark, hx + 7, hy, 2, 4); P(al.belly, hx + 5, hy + 4, 4, 3); P('#2a2130', hx + 7, hy + 4, 2, 1); }
  else { P(al.body, hx, hy - 2, 2, 2); P(al.body, hx + 6, hy - 2, 2, 2); P('#f4a3a3', hx + 1, hy - 1, 1, 1); P('#f4a3a3', hx + 6, hy - 1, 1, 1); P(al.belly, hx + 3, hy + 4, 4, 2); P('#f08a96', hx + 4, hy + 4, 1, 1); }
  if (al.patches) { P(al.patches, hx, hy, 3, 2); P(al.dark, hx + 5, hy, 3, 2); }
  P('#2a2130', hx + 2, hy + 3, 1, 2); P('#2a2130', hx + 5, hy + 3, 1, 2);
  P('#f4a3a3', hx + 1, hy + 5, 1, 1); P('#f4a3a3', hx + 6, hy + 5, 1, 1);
  autoOutline(c, '#3a2a26');
  _animalCache.set(key, c);
  return c;
}

/* 가구: 쿼터뷰 상자 + 디테일. w·d = 타일 비율, h = 높이(px) */
function isoBox(g, cx, cy, w, d, h, top, left, right) {
  const hw = 16 * w, hd = 16 * d;
  const T = [cx + (hw - hd) / 2 * 1, cy - (hw + hd) / 4];
  const Rr = [cx + (hw + hd) / 2, cy + (hw - hd) / 4 - 0];
  const B = [cx + (hw - hd) / 2 - (hw - hd) / 2 + 0, cy + (hw + hd) / 4];
  // 단순화: 정사각 기준 다이아몬드
  const px = 16 * w, py = 8 * d;
  const t = [cx, cy - py - h], r = [cx + px, cy - h], b = [cx, cy + py - h], l = [cx - px, cy - h];
  fillPoly(g, [l, b, [b[0], b[1] + h], [l[0], l[1] + h]], left);
  fillPoly(g, [b, r, [r[0], r[1] + h], [b[0], b[1] + h]], right);
  fillPoly(g, [t, r, b, l], top);
  return { t, r, b, l };
}
const FURN = {
  bed: { name: '포근한 침대', price: 30000, h: 1, draw(g, x, y) { isoBox(g, x, y, 0.9, 0.9, 7, '#f7f2ea', '#c9b9a5', '#b3a18c'); isoBox(g, x - 6, y - 3, 0.35, 0.5, 3, '#ffffff', '#e6e1d8', '#d6d0c6'); fillPoly(g, [[x - 2, y - 6], [x + 14, y - 7], [x + 2, y + 1], [x - 10, y - 1]], '#f19ab5'); isoBox(g, x - 12, y - 6, 0.12, 0.9, 14, '#8a5a3a', '#7a4e33', '#6a4229'); } },
  sofa: { name: '체크 소파', price: 22000, draw(g, x, y) { isoBox(g, x, y, 0.9, 0.55, 6, '#7fa3e6', '#5f83c6', '#5577b8'); isoBox(g, x - 4, y - 4, 0.9, 0.18, 12, '#8fb0ec', '#6a8dd0', '#5f83c6'); g.fillStyle = '#ffffff'; g.fillRect(x - 6, y - 10, 2, 2); g.fillRect(x + 4, y - 9, 2, 2); } },
  table: { name: '원목 테이블', price: 12000, draw(g, x, y) { g.fillStyle = '#6a4229'; g.fillRect(x - 9, y - 6, 2, 8); g.fillRect(x + 8, y - 6, 2, 8); g.fillRect(x - 1, y - 2, 2, 7); isoBox(g, x, y - 8, 0.7, 0.7, 3, '#d7a874', '#b98a58', '#a87a4a'); } },
  chair: { name: '나무 의자', price: 5000, draw(g, x, y) { g.fillStyle = '#6a4229'; g.fillRect(x - 4, y - 3, 1, 6); g.fillRect(x + 4, y - 3, 1, 6); isoBox(g, x, y - 4, 0.35, 0.35, 2, '#d7a874', '#b98a58', '#a87a4a'); isoBox(g, x - 3, y - 7, 0.35, 0.08, 9, '#c99a64', '#a87a4a', '#946a40'); } },
  desk: { name: '책상', price: 15000, draw(g, x, y) { isoBox(g, x, y, 0.85, 0.5, 13, '#c99a64', '#a87a4a', '#946a40'); g.fillStyle = '#f4efe2'; g.fillRect(x - 6, y - 17, 7, 3); g.fillStyle = '#3f6fb5'; g.fillRect(x + 3, y - 19, 4, 4); } },
  shelf: { name: '책장', price: 18000, draw(g, x, y) { isoBox(g, x, y, 0.8, 0.3, 26, '#a87a4a', '#946a40', '#7a5236'); const cols = ['#e3615a', '#3f6fb5', '#f0c13e', '#5aa850', '#c08ad8']; for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) { g.fillStyle = cols[(i + r) % 5]; g.fillRect(x - 11 + i * 2, y - 22 + r * 8 + Math.round(i * 0.5), 2, 5); } } },
  plant: { name: '몬스테라 화분', price: 6000, draw(g, x, y) { isoBox(g, x, y, 0.3, 0.3, 6, '#c4704e', '#a65a3c', '#8f4c32'); fillEllipse(g, x, y - 14, 7, 6, '#4f9e4a'); fillEllipse(g, x - 3, y - 17, 4, 3, '#6cbf62'); fillEllipse(g, x + 4, y - 12, 3, 3, '#3f8f45'); } },
  rug: { name: '동그란 러그', price: 8000, flat: true, draw(g, x, y) { fillEllipse(g, x, y, 15, 7, '#f19ab5'); fillEllipse(g, x, y, 11, 5, '#fbd3df'); fillEllipse(g, x, y, 5, 2, '#f19ab5'); } },
  lamp: { name: '스탠드 조명', price: 7000, light: true, draw(g, x, y) { g.fillStyle = '#5b5f69'; g.fillRect(x - 1, y - 20, 2, 20); g.fillRect(x - 3, y - 1, 6, 2); fillPoly(g, [[x - 5, y - 20], [x + 5, y - 20], [x + 3, y - 27], [x - 3, y - 27]], '#fff1c2'); } },
  tv: { name: '텔레비전', price: 25000, draw(g, x, y) { isoBox(g, x, y, 0.8, 0.35, 8, '#7a5236', '#6a4229', '#5a3a24'); isoBox(g, x - 1, y - 10, 0.7, 0.1, 12, '#2b2f3a', '#3a3f4c', '#22252e'); g.fillStyle = '#7fc4e8'; g.fillRect(x - 9, y - 20, 9, 7); } },
  kitchen: { name: '주방 조리대', price: 28000, draw(g, x, y) { isoBox(g, x, y, 0.9, 0.5, 14, '#eef3f5', '#c9d3d8', '#b7c3c9'); g.fillStyle = '#3b3f48'; g.fillRect(x - 6, y - 17, 4, 2); g.fillRect(x + 2, y - 16, 4, 2); g.fillStyle = '#9aa3b0'; g.fillRect(x + 8, y - 22, 1, 6); } },
  fridge: { name: '냉장고', price: 26000, draw(g, x, y) { isoBox(g, x, y, 0.5, 0.45, 28, '#f4f8fb', '#d6dee4', '#c3ccd3'); g.fillStyle = '#9aa3b0'; g.fillRect(x - 3, y - 20, 1, 6); g.fillRect(x - 3, y - 10, 1, 4); } },
  tank: { name: '수족관', price: 35000, draw(g, x, y) { isoBox(g, x, y, 0.8, 0.4, 8, '#5b5f69', '#4c4f58', '#41444c'); isoBox(g, x, y - 8, 0.8, 0.4, 12, '#a9dcf2', '#7fc4e8', '#6ab4dc'); g.fillStyle = '#f39a2b'; g.fillRect(x - 5, y - 15, 3, 2); g.fillStyle = '#e3484a'; g.fillRect(x + 3, y - 12, 3, 2); g.fillStyle = '#5aa850'; g.fillRect(x - 1, y - 12, 1, 4); } },
  counter: { name: '카운터', price: 20000, draw(g, x, y) { isoBox(g, x, y, 0.95, 0.5, 14, '#8a5a3a', '#7a4e33', '#6a4229'); isoBox(g, x, y - 14, 0.95, 0.5, 2, '#d7a874', '#b98a58', '#a87a4a'); } },
  register: { name: '계산대', price: 20000, draw(g, x, y) { isoBox(g, x, y, 0.9, 0.5, 13, '#4f9a6a', '#3f8058', '#356c4a'); isoBox(g, x + 4, y - 15, 0.25, 0.2, 5, '#5b5f69', '#4c4f58', '#41444c'); } },
  dining: { name: '좌식 상', price: 14000, draw(g, x, y) { isoBox(g, x, y, 0.8, 0.6, 6, '#a0522d', '#8a4526', '#743a20'); g.fillStyle = '#ffffff'; g.fillRect(x - 6, y - 9, 4, 2); g.fillRect(x + 2, y - 8, 4, 2); g.fillStyle = '#e3615a'; g.fillRect(x - 5, y - 10, 2, 1); } },
  cushion: { name: '방석', price: 3000, flat: true, draw(g, x, y) { isoBox(g, x, y, 0.4, 0.4, 2, '#e3615a', '#c9484a', '#b33c3e'); } },
  board: { name: '게시판', price: 9000, draw(g, x, y) { isoBox(g, x, y, 0.8, 0.12, 20, '#a7774c', '#8a5a3a', '#7a4e33'); g.fillStyle = '#f4efe2'; g.fillRect(x - 8, y - 18, 6, 5); g.fillStyle = '#fff3a0'; g.fillRect(x - 1, y - 16, 5, 4); g.fillStyle = '#f7b9c9'; g.fillRect(x + 5, y - 19, 4, 4); } },
  stage: { name: '노래방 무대', price: 40000, draw(g, x, y) { isoBox(g, x, y, 0.95, 0.95, 4, '#7a5ea8', '#5f4790', '#503c7a'); g.fillStyle = '#2b2f3a'; g.fillRect(x - 1, y - 20, 2, 16); fillEllipse(g, x, y - 21, 2, 2, '#9aa3b0'); g.fillStyle = '#fff3a0'; g.fillRect(x + 8, y - 8, 2, 2); } },
  screen: { name: '노래방 화면', price: 30000, draw(g, x, y) { isoBox(g, x, y, 0.9, 0.15, 22, '#2b2f3a', '#3a3f4c', '#22252e'); g.fillStyle = '#7a5ea8'; g.fillRect(x - 10, y - 20, 12, 8); g.fillStyle = '#fff3a0'; g.fillRect(x - 8, y - 15, 8, 1); } },
  locker: { name: '사물함', price: 12000, draw(g, x, y) { isoBox(g, x, y, 0.8, 0.35, 24, '#8aa0b0', '#6f8696', '#5f7584'); g.fillStyle = '#5f7584'; g.fillRect(x - 6, y - 22, 1, 18); g.fillRect(x, y - 21, 1, 18); } },
  gear: { name: '해녀 장비', price: 15000, draw(g, x, y) { g.fillStyle = '#7a5236'; g.fillRect(x - 8, y - 22, 16, 2); g.fillRect(x - 8, y - 22, 2, 22); g.fillRect(x + 6, y - 22, 2, 22); g.fillStyle = '#2a2c34'; g.fillRect(x - 4, y - 20, 4, 12); g.fillStyle = '#ef7b3a'; fillEllipse(g, x + 3, y - 8, 3, 3, '#ef7b3a'); g.fillStyle = '#9bd24f'; g.fillRect(x - 4, y - 7, 4, 5); } },
  crate: { name: '나무 상자', price: 4000, draw(g, x, y) { isoBox(g, x, y, 0.55, 0.55, 10, '#c99a64', '#a87a4a', '#946a40'); g.fillStyle = '#7a5236'; g.fillRect(x - 8, y - 6, 8, 1); g.fillRect(x, y - 6, 8, 1); } },
  shellDeco: { name: '소라 장식', price: 0, draw(g, x, y) { isoBox(g, x, y, 0.3, 0.3, 4, '#f4efe2', '#d9cfba', '#c9bea8'); fillEllipse(g, x, y - 8, 4, 3, '#f7b9c9'); g.fillStyle = '#e88aa4'; g.fillRect(x - 1, y - 9, 2, 1); } },
  pebble: { name: '조약돌 액자', price: 0, draw(g, x, y) { isoBox(g, x, y, 0.4, 0.12, 14, '#a7774c', '#8a5a3a', '#7a4e33'); fillEllipse(g, x - 3, y - 10, 2, 2, '#9aa3b0'); fillEllipse(g, x + 1, y - 8, 2, 2, '#c9c1ae'); } },
  photo: { name: '커플 액자', price: 6000, draw(g, x, y) { isoBox(g, x, y, 0.35, 0.12, 12, '#f4efe2', '#d9cfba', '#c9bea8'); g.fillStyle = '#7fc4e8'; g.fillRect(x - 3, y - 11, 5, 5); g.fillStyle = '#ff6f91'; g.fillRect(x - 1, y - 9, 2, 2); } },
  piano: { name: '미니 피아노', price: 45000, draw(g, x, y) { isoBox(g, x, y, 0.85, 0.45, 16, '#2b2f3a', '#3a3f4c', '#22252e'); g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) g.fillRect(x - 10 + i * 3, y - 18 + Math.round(i * 0.2), 2, 3); } },
  bunting: { name: '알전구 장식', price: 9000, light: true, draw(g, x, y) { g.fillStyle = '#5b5f69'; g.fillRect(x - 1, y - 26, 2, 26); const cols = ['#ffd77a', '#f7b9c9', '#9fd6f2']; for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % 3]; g.fillRect(x - 12 + i * 4, y - 24 + Math.abs(i - 3), 2, 2); } } },
  wedding: { name: '웨딩 아치', price: 0, draw(g, x, y) { g.fillStyle = '#ffffff'; g.fillRect(x - 14, y - 30, 2, 30); g.fillRect(x + 12, y - 30, 2, 30); fillPoly(g, [[x - 14, y - 30], [x, y - 40], [x + 14, y - 30], [x + 12, y - 28], [x, y - 36], [x - 12, y - 28]], '#ffffff'); for (const [dx, dy] of [[-12, -32], [-6, -37], [0, -38], [6, -37], [12, -32], [-13, -20], [13, -18]]) { fillEllipse(g, x + dx, y + dy, 2, 2, '#f7b9c9'); } } },
};
const _furnCache = new Map();
function furnSprite(k, flip) {
  const key = k + (flip ? 'f' : '');
  if (_furnCache.has(key)) return _furnCache.get(key);
  const c = mkCanvas(40, 50), g = c.getContext('2d');
  FURN[k].draw(g, 20, 40);
  autoOutline(c, '#3a2a26');
  let out = c;
  if (flip) { out = mkCanvas(40, 50); const og = out.getContext('2d'); og.translate(40, 0); og.scale(-1, 1); og.drawImage(c, 0, 0); }
  const sp = { c: out, ax: 20, ay: 40 };
  _furnCache.set(key, sp);
  return sp;
}

function sprPavilion() {
  const c = mkCanvas(44, 52), g = c.getContext('2d');
  g.fillStyle = '#7a4e33'; for (const x of [6, 20, 24, 38]) g.fillRect(x, 22, 2, 24);
  isoBox(g, 22, 46, 1.0, 1.0, 4, '#c99a64', '#a87a4a', '#946a40');
  fillPoly(g, [[0, 22], [22, 6], [44, 22], [22, 34]], '#3f7f6a');
  fillPoly(g, [[0, 22], [22, 34], [22, 36], [0, 24]], '#2f6a56'); fillPoly(g, [[22, 34], [44, 22], [44, 24], [22, 36]], '#285c4a');
  fillPoly(g, [[16, 10], [22, 2], [28, 10]], '#4c9a80');
  autoOutline(c, '#2a2a26');
  return { c, ax: 22, ay: 44 };
}
function sprSnowman() {
  const c = mkCanvas(20, 30), g = c.getContext('2d');
  fillEllipse(g, 10, 22, 7, 6, '#ffffff'); fillEllipse(g, 10, 12, 5, 5, '#ffffff'); g.fillStyle = '#e3615a'; g.fillRect(5, 15, 10, 2); g.fillRect(12, 17, 2, 4);
  g.fillStyle = '#2a2130'; g.fillRect(8, 11, 1, 1); g.fillRect(11, 11, 1, 1); g.fillStyle = '#f39a2b'; g.fillRect(9, 13, 3, 1);
  g.fillStyle = '#3b3b3b'; g.fillRect(6, 5, 8, 2); g.fillRect(7, 2, 6, 3);
  autoOutline(c, '#5a6070');
  return { c, ax: 10, ay: 27 };
}
function sprRocks() {
  const c = mkCanvas(32, 22), g = c.getContext('2d');
  fillEllipse(g, 12, 14, 9, 6, '#4c4f58'); fillEllipse(g, 21, 15, 7, 5, '#5b5f69'); fillEllipse(g, 10, 12, 4, 2, '#6b707b');
  autoOutline(c, '#26272c');
  return { c, ax: 16, ay: 16 };
}
function sprTankOut() {
  const c = mkCanvas(30, 30), g = c.getContext('2d');
  isoBox(g, 15, 24, 0.7, 0.45, 6, '#5b5f69', '#4c4f58', '#41444c');
  isoBox(g, 15, 18, 0.7, 0.45, 10, '#a9dcf2', '#7fc4e8', '#6ab4dc');
  g.fillStyle = '#e3484a'; g.fillRect(10, 14, 3, 2); g.fillStyle = '#f0f0f0'; g.fillRect(17, 16, 3, 2);
  autoOutline(c, '#26272c');
  return { c, ax: 15, ay: 24 };
}
function sprLantern() {
  const c = mkCanvas(16, 36), g = c.getContext('2d');
  g.fillStyle = '#7a5236'; g.fillRect(7, 8, 2, 26);
  fillEllipse(g, 8, 8, 5, 5, '#e3615a'); g.fillStyle = '#ffd77a'; g.fillRect(6, 6, 4, 4);
  autoOutline(c, '#3a2618');
  return { c, ax: 8, ay: 33 };
}
function sprStall() {
  const c = mkCanvas(36, 40), g = c.getContext('2d');
  isoBox(g, 18, 34, 0.8, 0.5, 12, '#c99a64', '#a87a4a', '#946a40');
  g.fillStyle = '#7a5236'; g.fillRect(5, 6, 2, 22); g.fillRect(29, 6, 2, 22);
  for (let i = 0; i < 6; i++) fillPoly(g, [[3 + i * 5, 6], [8 + i * 5, 6], [8 + i * 5, 12], [3 + i * 5, 12]], i % 2 ? '#ffffff' : '#e3615a');
  g.fillStyle = '#f39a2b'; g.fillRect(10, 18, 3, 2); g.fillRect(16, 18, 3, 2); g.fillStyle = '#9bd24f'; g.fillRect(22, 18, 3, 2);
  autoOutline(c, '#3a2618');
  return { c, ax: 18, ay: 34 };
}

/* v3 — 목장 · 풍차 · 정류장 */
function sprFence() {
  const c = mkCanvas(32, 24), g = c.getContext('2d');
  g.fillStyle = '#c99a64'; g.fillRect(6, 6, 2, 12); g.fillRect(24, 6, 2, 12);
  fillPoly(g, [[2, 9], [16, 3], [30, 9], [30, 11], [16, 5], [2, 11]], '#e0b583');
  fillPoly(g, [[2, 14], [16, 8], [30, 14], [30, 16], [16, 10], [2, 16]], '#d0a06c');
  autoOutline(c, '#5a3a24');
  return { c, ax: 16, ay: 15 };
}
function sprHay() {
  const c = mkCanvas(28, 24), g = c.getContext('2d');
  fillEllipse(g, 14, 14, 11, 8, '#e8c66a'); fillEllipse(g, 12, 11, 7, 4, '#f4dc8a');
  g.fillStyle = '#c9a24a'; for (let i = 0; i < 5; i++) g.fillRect(6 + i * 4, 12 + (i % 2), 2, 1);
  autoOutline(c, '#7a5a24');
  return { c, ax: 14, ay: 18 };
}
function sprWindmill() {
  const c = mkCanvas(48, 80), g = c.getContext('2d');
  fillPoly(g, [[18, 74], [30, 74], [27, 26], [21, 26]], '#f4f1ea');
  fillPoly(g, [[24, 74], [30, 74], [27, 26], [24, 26]], '#d9d3c6');
  g.fillStyle = '#3f63a8'; g.fillRect(22, 62, 4, 12);
  const hx = 24, hy = 26;
  g.fillStyle = '#ffffff';
  for (const [dx, dy] of [[0, -20], [18, 6], [-18, 6]]) { for (let i = 0; i < 20; i++) { const t = i / 20; g.fillRect(Math.round(hx + dx * t) - 1, Math.round(hy + dy * t) - 1, 3, 3); } }
  fillEllipse(g, hx, hy, 3, 3, '#e3615a');
  autoOutline(c, '#3a3a44');
  return { c, ax: 24, ay: 74 };
}
function sprBusStop() {
  const c = mkCanvas(24, 40), g = c.getContext('2d');
  g.fillStyle = '#5b5f69'; g.fillRect(11, 10, 2, 26);
  fillEllipse(g, 12, 9, 7, 7, '#2f8f5a'); fillEllipse(g, 12, 9, 5, 5, '#ffffff');
  g.fillStyle = '#2f8f5a'; g.fillRect(9, 7, 6, 4); g.fillStyle = '#ffffff'; g.fillRect(10, 8, 1, 1); g.fillRect(13, 8, 1, 1);
  g.fillStyle = '#f2c94c'; g.fillRect(6, 30, 12, 2);
  autoOutline(c, '#23262e');
  return { c, ax: 12, ay: 36 };
}
ANIMAL_LOOKS.pony = { kind: 'pony', name: '조랑이', body: '#a8703f', dark: '#7a4e2a', light: '#c98f5a', belly: '#d9b08a', mane: '#3a2a22' };
ANIMAL_LOOKS.pony2 = { kind: 'pony', name: '얼룩이', body: '#f4efe6', dark: '#cfc6b6', light: '#ffffff', belly: '#ffffff', mane: '#7a5a3f', patches: '#7a5a3f' };
const _animalSprite0 = animalSprite;
animalSprite = function (al, frame, sit) {
  if (al.kind !== 'pony') return _animalSprite0(al, frame, sit);
  const key = al.name + frame; if (_animalCache.has(key)) return _animalCache.get(key);
  const c = mkCanvas(28, 26), g = c.getContext('2d'); const P = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const lg = frame % 2;
  P(al.mane, 3, 9, 2, 7); P(al.body, 5, 10, 14, 7); P(al.belly, 7, 14, 10, 2);
  if (al.patches) { P(al.patches, 8, 10, 4, 3); P(al.patches, 15, 12, 3, 2); }
  P(al.dark, 6, 17, 2, 6 - lg); P(al.dark, 9, 17, 2, 5 + lg); P(al.dark, 14, 17, 2, 6 - lg); P(al.dark, 17, 17, 2, 5 + lg);
  P(al.body, 17, 4, 5, 9); P(al.body, 20, 6, 6, 5); P(al.mane, 16, 3, 3, 8); P(al.dark, 23, 9, 3, 2);
  P('#2a2130', 21, 7, 1, 1); P(al.body, 18, 2, 2, 2);
  autoOutline(c, '#3a2a20'); _animalCache.set(key, c); return c;
};

/* v4 — 옷가게 · 미용실 소품 */
Object.assign(FURN, {
  rack: { name: '옷걸이 행거', price: 9000, draw(g, x, y) { g.fillStyle = '#7a7e88'; g.fillRect(x - 12, y - 26, 2, 26); g.fillRect(x + 10, y - 26, 2, 26); g.fillRect(x - 12, y - 26, 24, 2); const cols = ['#f19ab5', '#7fa3e6', '#f2c94c', '#9bd24f', '#c08ad8']; for (let i = 0; i < 5; i++) { g.fillStyle = cols[i]; g.fillRect(x - 10 + i * 4, y - 24, 3, 12 + (i % 2) * 3); } } },
  mirror: { name: '전신 거울', price: 12000, draw(g, x, y) { isoBox(g, x, y, 0.5, 0.12, 26, '#c99a64', '#a87a4a', '#946a40'); g.fillStyle = '#cfe8f7'; g.fillRect(x - 6, y - 25, 6, 20); g.fillStyle = '#ffffff'; g.fillRect(x - 5, y - 23, 1, 8); } },
  mannequin: { name: '마네킹', price: 15000, draw(g, x, y) { g.fillStyle = '#7a7e88'; g.fillRect(x - 1, y - 8, 2, 8); g.fillRect(x - 4, y - 1, 8, 2); fillPoly(g, [[x - 6, y - 24], [x + 6, y - 24], [x + 4, y - 8], [x - 4, y - 8]], '#f19ab5'); fillEllipse(g, x, y - 28, 3, 3, '#f4efe6'); g.fillStyle = '#ffffff'; g.fillRect(x - 4, y - 16, 8, 1); } },
  salonChair: { name: '미용 의자', price: 20000, draw(g, x, y) { g.fillStyle = '#5b5f69'; g.fillRect(x - 1, y - 6, 2, 6); g.fillRect(x - 5, y - 1, 10, 2); isoBox(g, x, y - 6, 0.4, 0.4, 3, '#8a6fc9', '#6f55ad', '#5f4799'); isoBox(g, x - 3, y - 9, 0.4, 0.1, 10, '#9a80d9', '#7a60b9', '#6f55ad'); } },
});
