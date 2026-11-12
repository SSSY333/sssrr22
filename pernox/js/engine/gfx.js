// 쿼터뷰 픽셀 그래픽 기본 도구 — 모든 그림은 코드로 직접 찍는다 (외부 이미지 없음)
'use strict';
PX.G = (() => {
  const { shade, rng, hash } = PX.U;
  const TW = 32, TH = 16;
  const proj = (x, y, z = 0) => [(x - y) * 16, (x + y) * 8 - z];

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return c;
  }

  // 볼록 다각형을 세로 줄 단위로 칠한다 → 안티앨리어싱 없는 깔끔한 도트 경계
  function fillPoly(g, pts, color) {
    let minX = Infinity, maxX = -Infinity;
    for (const p of pts) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; }
    g.fillStyle = color;
    const x0 = Math.floor(minX), x1 = Math.ceil(maxX);
    const n = pts.length;
    for (let cx = x0; cx < x1; cx++) {
      const sx = cx + 0.5;
      let ymin = Infinity, ymax = -Infinity;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        if ((a[0] <= sx && b[0] >= sx) || (b[0] <= sx && a[0] >= sx)) {
          if (a[0] === b[0]) continue;
          const y = a[1] + (b[1] - a[1]) * (sx - a[0]) / (b[0] - a[0]);
          if (y < ymin) ymin = y; if (y > ymax) ymax = y;
        }
      }
      if (ymin === Infinity) continue;
      const t = Math.round(ymin), bt = Math.round(ymax);
      if (bt > t) g.fillRect(cx, t, 1, bt - t);
    }
  }
  function line(g, x0, y0, x1, y1, color) {
    g.fillStyle = color;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let i = 0; i < 2000; i++) {
      g.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // 박스: x,y,w,d = 타일 단위, z,h = 픽셀. (ox,oy) = 월드 원점의 화면 위치
  function box(g, ox, oy, b) {
    const c = b.c;
    const top = b.top || shade(c, 0.16), lf = b.lf || c, rf = b.rf || shade(c, -0.2);
    const P = (x, y, z) => { const p = proj(x, y, z); return [p[0] + ox, p[1] + oy]; };
    const { x, y, z = 0, w, d, h } = b;
    if (h > 0) {
      fillPoly(g, [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)], lf);
      fillPoly(g, [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)], rf);
    }
    if (!b.noTop) fillPoly(g, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top);
    if (b.edge !== false && h > 0) { // 윗면 앞모서리 하이라이트
      const hl = shade(top, 0.25);
      const a = P(x, y + d, z + h), m = P(x + w, y + d, z + h), r = P(x + w, y, z + h);
      line(g, a[0], a[1] - 1, m[0] - 1, m[1] - 1, hl);
      line(g, m[0], m[1] - 1, r[0] - 1, r[1], hl);
    }
  }
  // 박스 면 위의 사각형 (창문, 문, 무늬). face 'L'(y+d면, u는 x방향) / 'R'(x+w면, u는 y방향)
  function faceRect(g, ox, oy, b, face, u0, u1, v0, v1, color) {
    const z = b.z || 0;
    const P = face === 'L'
      ? (u, v) => { const p = proj(b.x + u, b.y + b.d, z + v); return [p[0] + ox, p[1] + oy]; }
      : (u, v) => { const p = proj(b.x + b.w, b.y + u, z + v); return [p[0] + ox, p[1] + oy]; };
    fillPoly(g, [P(u0, v1), P(u1, v1), P(u1, v0), P(u0, v0)], color);
  }
  function topRect(g, ox, oy, x0, y0, x1, y1, z, color) {
    const P = (x, y) => { const p = proj(x, y, z); return [p[0] + ox, p[1] + oy]; };
    fillPoly(g, [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], color);
  }

  // 알파 경계에 어두운 외곽선을 둘러 도트 느낌을 살린다
  function outline(c, color = '#1b1424', inner = false) {
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const src = g.getImageData(0, 0, W, H), s = src.data;
    const out = g.createImageData(W, H), o = out.data;
    const [r, gg, b] = PX.U.hexToRgb(color);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (s[i + 3] > 0) continue;
      const nb = (x > 0 && s[i - 1] > 0) || (x < W - 1 && s[i + 7] > 0) || (y > 0 && s[i - W * 4 + 3] > 0) || (y < H - 1 && s[i + W * 4 + 3] > 0);
      if (nb) { o[i] = r; o[i + 1] = gg; o[i + 2] = b; o[i + 3] = 255; }
    }
    g.putImageData(out, 0, 0);
    // 원본을 그 위에 다시 그림
    const tmp = canvas(W, H); tmp.getContext('2d').putImageData(src, 0, 0);
    g.drawImage(tmp, 0, 0);
  }

  // 박스 목록의 화면 경계 계산 → 스프라이트 캔버스 생성
  function boundsOf(boxes, extra = 0) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const b of boxes) {
      const z = b.z || 0;
      for (const [px, py, pz] of [[b.x, b.y, z], [b.x + b.w, b.y, z], [b.x, b.y + b.d, z], [b.x + b.w, b.y + b.d, z]]) {
        for (const zz of [pz, pz + b.h]) {
          const p = proj(px, py, zz);
          x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
        }
      }
    }
    return { x0: Math.floor(x0) - 2 - extra, y0: Math.floor(y0) - 2 - extra * 2, x1: Math.ceil(x1) + 2 + extra, y1: Math.ceil(y1) + 2 + extra };
  }
  // draw(g, ox, oy) 를 실행해 스프라이트를 만든다. ax, ay = 월드 원점이 캔버스에서 놓이는 위치
  function makeSprite(boxes, draw, { outlineColor = '#1b1424', extra = 0, noOutline = false } = {}) {
    const B = boundsOf(boxes, extra);
    const c = canvas(B.x1 - B.x0, B.y1 - B.y0);
    const g = c.getContext('2d');
    const ox = -B.x0, oy = -B.y0;
    draw(g, ox, oy);
    if (!noOutline) outline(c, outlineColor);
    return { c, ax: ox, ay: oy };
  }

  // ---------- 바닥 타일 ----------
  const diamond = [[16, 0], [32, 8], [16, 16], [0, 8]];
  const inDiamond = (x, y) => Math.abs(x + 0.5 - 16) / 16 + Math.abs(y + 0.5 - 8) / 8 <= 1.0;

  // 팔레트: 계절별 야외 색
  const SEASON_PAL = {
    spring: { sand: '#c9775a', sand2: '#d98d6c', grass: '#6fbf73', grass2: '#8fd88a', flower: '#ff9ed2', leaf: '#7ce0c3', leaf2: '#b5f5df', glow: '#9ff5ff' },
    summer: { sand: '#c4613f', sand2: '#d97a4f', grass: '#4fa35a', grass2: '#6cc06a', flower: '#ffd166', leaf: '#3fbf9a', leaf2: '#7fe6c2', glow: '#c8ff9f' },
    autumn: { sand: '#b8664a', sand2: '#c97b55', grass: '#b0953f', grass2: '#d0ad52', flower: '#ff8b5e', leaf: '#ee9a47', leaf2: '#ffd07a', glow: '#ffd59f' },
    domeWinter: { sand: '#c9775a', sand2: '#d98d6c', grass: '#5fae74', grass2: '#7fcc8a', flower: '#ffffff', leaf: '#4fae8a', leaf2: '#e8f6ff', glow: '#ffe2a0' },
    winter: { sand: '#c9a7a4', sand2: '#e2cbc8', grass: '#9fb7b0', grass2: '#c8dcd6', flower: '#cfe8ff', leaf: '#a7d3e8', leaf2: '#e8f6ff', glow: '#d8ecff' },
  };

  const TILE_DEF = {
    sand: (P) => ({ base: P.sand, dots: [[P.sand2, .12], [shade(P.sand, -.12), .08]] }),
    grass: (P) => ({ base: P.grass, dots: [[P.grass2, .16], [shade(P.grass, -.15), .1]], blades: P.grass2 }),
    flowers: (P) => ({ base: P.grass, dots: [[P.grass2, .14], [P.flower, .05], ['#ffffff', .015]] }),
    concrete: () => ({ base: '#a7a3a8', dots: [['#b7b3b8', .08], ['#96929a', .06]], seam: '#8c8890' }),
    plaza: () => ({ base: '#c9c1b6', dots: [['#d6cec3', .1]], pavers: '#ada395' }),
    asphalt: () => ({ base: '#4a4652', dots: [['#55515e', .12], ['#3f3b47', .08]] }),
    roadline: () => ({ base: '#4a4652', dots: [['#55515e', .1]], stripe: '#e8d36a' }),
    metal: () => ({ base: '#7f8a96', dots: [['#8d98a3', .05]], plate: '#6b7682', rivet: '#b8c2cc' }),
    hangar: () => ({ base: '#6d7480', dots: [['#787f8b', .06]], plate: '#5d636e', hazard: true }),
    wood: () => ({ base: '#b9875a', planks: '#a4744b', dots: [['#c69564', .06]] }),
    darkwood: () => ({ base: '#7d5538', planks: '#6a462d', dots: [['#8a603f', .06]] }),
    tile: () => ({ base: '#dfe6ea', checker: '#cfd8de', dots: [] }),
    medtile: () => ({ base: '#e6f2f0', checker: '#d2e7e3', dots: [] }),
    carpet: () => ({ base: '#6a6fa8', dots: [['#757ab3', .2], ['#5f649b', .15]] }),
    rubber: () => ({ base: '#3d4a56', dots: [['#465462', .2]] }),
    lino: () => ({ base: '#9fb59a', dots: [['#a9bfa4', .1]], seam: '#8fa58a' }),
    darktile: () => ({ base: '#5b6374', checker: '#535b6b', dots: [] }),
    cafe: () => ({ base: '#e8d2b0', checker: '#dcc29c', dots: [] }),
    dirt: (P) => ({ base: shade(P.sand, -.18), dots: [[shade(P.sand, -.28), .15], [P.sand, .08]] }),
    domegrass: () => ({ base: '#64c27a', dots: [['#86d991', .16], ['#55a96a', .1]], blades: '#9be6a4' }),
    water: () => ({ base: '#4fb3d9', dots: [['#7fd3ef', .12], ['#3f9cc4', .1]] }),
    glassfloor: () => ({ base: '#9fd8e8', dots: [['#c4eef7', .1]], seam: '#7fbfd2' }),
    silversand: () => ({ base: '#c9ccd6', dots: [['#e4e6ee', .14], ['#aeb2bf', .08], ['#ffffff', .02]] }),
    whitesand: () => ({ base: '#efe6d2', dots: [['#f8f1e2', .14], ['#ddd2ba', .08]] }),
    ice: () => ({ base: '#bfe6f2', dots: [['#e2f6fb', .12], ['#9fd2e4', .06]], seam: '#d8f2fa' }),
    snowfield: () => ({ base: '#e8f0f6', dots: [['#ffffff', .2], ['#cfdbe6', .08]] }),
    void: () => ({ base: '#0d0a1c', dots: [['#ffffff', .012], ['#9fd8ff', .008], ['#1a1530', .2]] }),
    crystal: () => ({ base: '#4a3a6a', dots: [['#6a5a9a', .1], ['#b9a0ff', .03], ['#3a2d55', .1]] }),
    redrock: (P) => ({ base: shade(P.sand, -0.25), dots: [[shade(P.sand, -0.35), .15], [shade(P.sand, -0.12), .1]] }),
    deepwater: () => ({ base: '#2a6f9a', dots: [['#3f8fbf', .12], ['#225d82', .1], ['#7fd3ef', .02]] }),
    boardwalk: () => ({ base: '#a0743f', planks: '#7a5530', dots: [['#b0844f', .06]] }),
    mosaic: () => ({ base: '#d6c9e8', checker: '#c3b2de', dots: [] }),
    neonfloor: () => ({ base: '#2a1f3f', checker: '#33264d', dots: [['#ff6bd5', .01]] }),
    rail: () => ({ base: '#5a4a6a', dots: [['#6a5a7a', .1]], stripe: '#c9ced4' }),
  };
  function makeTile(type, season, variant) {
    const P = SEASON_PAL[season];
    const def = TILE_DEF[type](P);
    const c = canvas(32, 17), g = c.getContext('2d');
    fillPoly(g, diamond, def.base);
    const r = rng(type + season + variant);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {
      if (!inDiamond(x, y)) continue;
      // 타일 좌표계 (u: x방향, v: y방향, 0..1)
      const u = (x / 16 + y / 8) / 2 - 0.5, v = (y / 8 - x / 16) / 2 + 0.5;
      let col = null;
      for (const [dc, p] of def.dots || []) if (r() < p) { col = dc; break; }
      if (def.checker && ((u < .5) !== (v < .5))) col = def.checker;
      if (def.planks && Math.abs((u * 4) % 1) < 0.07) col = def.planks;
      if (def.seam && (u < 0.04 || v < 0.04)) col = def.seam;
      if (def.pavers && ((Math.abs((u * 2) % 1) < 0.06) || (Math.abs((v * 2) % 1) < 0.06))) col = def.pavers;
      if (def.plate && (u < 0.05 || v < 0.05)) col = def.plate;
      if (def.rivet && ((u > .1 && u < .16) || (u > .84 && u < .9)) && ((v > .1 && v < .16) || (v > .84 && v < .9))) col = def.rivet;
      if (def.stripe && Math.abs(v - 0.5) < 0.06 && (u % 0.5) < 0.3) col = def.stripe;
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
    if (def.blades && variant % 2 === 0) {
      g.fillStyle = def.blades;
      for (let i = 0; i < 4; i++) { const bx = 8 + Math.floor(r() * 16), by = 4 + Math.floor(r() * 8); g.fillRect(bx, by - 1, 1, 2); }
    }
    return c;
  }
  const tileCache = new Map();
  function tile(type, season, variant) {
    const k = type + '|' + season + '|' + variant;
    let t = tileCache.get(k);
    if (!t) { t = makeTile(type, season, variant); tileCache.set(k, t); }
    return t;
  }

  // ---------- 7×7 도트 아이콘 (간판용) ----------
  const ICONS = {
    cross: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'],
    fork: ['#.#.#..', '#.#.#.#', '#####.#', '..#..##', '..#..##', '..#...#', '..#...#'],
    wrench: ['.##....', '#..#...', '#..##..', '.####..', '...###.', '....###', '.....##'],
    bell: ['...#...', '..###..', '.#####.', '.#####.', '.#####.', '#######', '...#...'],
    dumbbell: ['.......', '##...##', '##...##', '#######', '##...##', '##...##', '.......'],
    box: ['.......', '.#####.', '#######', '#..#..#', '#..#..#', '#######', '.......'],
    antenna: ['#..#..#', '.#.#.#.', '..###..', '...#...', '...#...', '..###..', '.#####.'],
    bed: ['.......', '#......', '##.....', '#######', '#######', '#.....#', '.......'],
    star: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
    drop: ['...#...', '..###..', '.#####.', '#######', '#######', '.#####.', '..###..'],
    doc: ['.####..', '.#..##.', '.#...#.', '.####..', '.#...#.', '.####..', '.......'],
    cup: ['.......', '#####..', '#####.#', '######.', '#####..', '.###...', '#####..'],
    leaf: ['....###', '..#####', '.######', '.####.#', '.###...', '.#.....', '#......'],
    home: ['...#...', '..###..', '.#####.', '#######', '.##.##.', '.##.##.', '.##.##.'],
    controller: ['.......', '.#####.', '#.#####', '###.#.#', '#.#####', '.#...#.', '.......'],
    bus: ['.#####.', '#.....#', '#.....#', '#######', '#.###.#', '.#...#.', '.......'],
    heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...', '.......'],
    flask: ['..###..', '...#...', '...#...', '..###..', '.#####.', '#######', '#######'],
  };
  function icon(g, name, x, y, color, s = 1) {
    const m = ICONS[name]; if (!m) return;
    g.fillStyle = color;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (m[j][i] === '#') g.fillRect(x + i * s, y + j * s, s, s);
  }

  return { TW, TH, proj, canvas, fillPoly, line, box, faceRect, topRect, outline, makeSprite, boundsOf, tile, SEASON_PAL, icon, ICONS, inDiamond };
})();
