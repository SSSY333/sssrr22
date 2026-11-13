// 가구 · 건물 · 실내 벽 스프라이트 생성 (회전 지원, 계절/밤 변형 캐시)
'use strict';
PX.O = (() => {
  const G = PX.G, { shade, mix } = PX.U;
  const DIRV = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // S E N W
  const vecToDir = (dx, dy) => (dy > 0.5 ? 0 : dx > 0.5 ? 1 : dy < -0.5 ? 2 : 3);

  function footprint(f, r) { return r % 2 ? [f.d, f.w] : [f.w, f.d]; }
  function rotPt(px, py, W, D, r) {
    switch (r & 3) { case 0: return [px, py]; case 1: return [D - py, px]; case 2: return [W - px, D - py]; default: return [py, W - px]; }
  }
  function rotDir(dir, r) {
    let [dx, dy] = DIRV[dir];
    for (let i = 0; i < (r & 3); i++) [dx, dy] = [-dy, dx];
    return vecToDir(dx, dy);
  }
  function rotBox(p, W, D, r) {
    const a = rotPt(p[0], p[1], W, D, r), b = rotPt(p[0] + p[3], p[1] + p[4], W, D, r);
    return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]), d: Math.abs(a[1] - b[1]), z: p[2], h: p[5] };
  }
  const col = (c, season) => (c && c[0] === '@' ? G.SEASON_PAL[season][c.slice(1)] : c);

  // 상자들끼리 앞뒤 정렬 (A가 B 뒤에 있으면 먼저)
  function behind(a, b) {
    const e = 0.001;
    if (a.x + a.w <= b.x + e || a.y + a.d <= b.y + e) return true;
    if (b.x + b.w <= a.x + e || b.y + b.d <= a.y + e) return false;
    return a.z + a.h <= b.z + 0.01 && !(b.z + b.h <= a.z + 0.01);
  }
  function sortBoxes(list) {
    const out = [], used = new Array(list.length).fill(false);
    for (let k = 0; k < list.length; k++) {
      let pick = -1;
      for (let i = 0; i < list.length && pick < 0; i++) {
        if (used[i]) continue;
        let ok = true;
        for (let j = 0; j < list.length; j++) if (j !== i && !used[j] && behind(list[j], list[i]) && !behind(list[i], list[j])) { ok = false; break; }
        if (ok) pick = i;
      }
      if (pick < 0) pick = used.indexOf(false);
      used[pick] = true; out.push(list[pick]);
    }
    return out;
  }

  // ---------- 가구 ----------
  const cache = new Map();
  function furniture(id, r, season = 'spring') {
    const key = id + '|' + r + '|' + season;
    if (cache.has(key)) return cache.get(key);
    const f = PX.FURN[id];
    const W = f.w, D = f.d;
    const boxes = f.parts.map((p, i) => Object.assign(rotBox(p, W, D, r), { c: col(p[6], season), a: p[7] && p[7].a, i }));
    const sorted = sortBoxes(boxes);
    const spr = G.makeSprite(boxes, (g, ox, oy) => {
      for (const b of sorted) {
        if (b.a) g.globalAlpha = 0.6;
        G.box(g, ox, oy, b);
        g.globalAlpha = 1;
        for (const dt of f.det) if (dt.p === b.i) detail(g, ox, oy, f, dt, b, r, season, W, D);
      }
    }, { outlineColor: '#1b1424' });
    cache.set(key, spr);
    return spr;
  }
  function detail(g, ox, oy, f, dt, wb, r, season, W, D) {
    const p = f.parts[dt.p];
    const c = col(dt.c, season);
    if (dt.f === 'T') {
      const a = rotPt(dt.r[0], dt.r[1], W, D, r), b = rotPt(dt.r[2], dt.r[3], W, D, r);
      G.topRect(g, ox, oy, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), wb.z + wb.h, c);
      return;
    }
    const fi = 'SENW'.indexOf(dt.f);
    const wdir = rotDir(fi, r);
    if (wdir !== 0 && wdir !== 1) return; // 보이지 않는 면
    const loc = u => {
      const [bx, by, , bw, bd] = p;
      switch (dt.f) { case 'S': return [bx + u, by + bd]; case 'E': return [bx + bw, by + u]; case 'N': return [bx + u, by]; default: return [bx, by + u]; }
    };
    const w0 = rotPt(...loc(dt.u[0]), W, D, r), w1 = rotPt(...loc(dt.u[1]), W, D, r);
    const face = wdir === 0 ? 'L' : 'R';
    const u0 = face === 'L' ? w0[0] - wb.x : w0[1] - wb.y, u1 = face === 'L' ? w1[0] - wb.x : w1[1] - wb.y;
    G.faceRect(g, ox, oy, wb, face, Math.min(u0, u1), Math.max(u0, u1), dt.v[0], dt.v[1], c);
  }
  // 앉는 자리 / 조명 위치 (월드 기준, 가구 원점 기준 상대)
  function seatsOf(f, r) {
    if (!f.seats) return [];
    return f.seats.map(([sx, sy, dir, z]) => { const p = rotPt(sx, sy, f.w, f.d, r); return { x: p[0], y: p[1], dir: rotDir(dir, r), z }; });
  }

  // ---------- 건물 ----------
  function building(b, season, night) {
    const key = 'B|' + b.id + '|' + season + '|' + (night ? 1 : 0);
    if (cache.has(key)) return cache.get(key);
    if (b.rock) { const r = rockMound(b, night); cache.set(key, r); return r; }
    const body = { x: 0, y: 0, z: 0, w: b.w, d: b.d, h: b.h, c: b.wall };
    const roof = { x: -0.15, y: -0.15, z: b.h, w: b.w + 0.3, d: b.d + 0.3, h: 4, c: b.roof };
    const parapet = { x: 0.2, y: 0.2, z: b.h + 4, w: b.w - 0.4, d: b.d - 0.4, h: 1, c: shade(b.roof, -0.1), edge: false };
    const extras = [];
    const rng = PX.U.rng(b.id);
    (b.roofDeco || []).forEach((k, i) => {
      const px = 1 + (i * 3.3) % Math.max(1, b.w - 3), py = 1 + rng() * Math.max(0.5, b.d - 3);
      if (k === 'ac') extras.push({ x: px, y: py, z: b.h + 4, w: 1.2, d: 1, h: 7, c: '#c9ced4', kind: k });
      if (k === 'vents') extras.push({ x: px, y: py, z: b.h + 4, w: 0.5, d: 0.5, h: 9, c: '#9aa3ad', kind: k });
      if (k === 'solar') extras.push({ x: px, y: py, z: b.h + 6, w: 2, d: 1.2, h: 1, c: '#2a3a6a', kind: k });
      if (k === 'antenna') extras.push({ x: px + 0.4, y: py + 0.4, z: b.h + 4, w: 0.12, d: 0.12, h: 34, c: '#c9ced4', kind: k });
      if (k === 'dish') extras.push({ x: px, y: py, z: b.h + 4, w: 1.4, d: 1.4, h: 6, c: '#e9eef2', kind: k });
    });
    const all = [body, roof, ...extras];
    const spr = G.makeSprite(all, (g, ox, oy) => {
      // 바닥 그림자(앰비언트 오클루전)
      g.globalAlpha = 0.22;
      G.topRect(g, ox, oy, -0.3, -0.3, b.w + 0.45, b.d + 0.45, 0, '#000');
      g.globalAlpha = 1;
      G.box(g, ox, oy, body);
      // 띠 · 하부 기단
      G.faceRect(g, ox, oy, body, 'L', 0, b.w, 0, 4, shade(b.wall, -0.25));
      G.faceRect(g, ox, oy, body, 'R', 0, b.d, 0, 4, shade(b.wall, -0.4));
      G.faceRect(g, ox, oy, body, 'L', 0, b.w, b.h - 8, b.h - 5, b.stripe);
      G.faceRect(g, ox, oy, body, 'R', 0, b.d, b.h - 8, b.h - 5, shade(b.stripe, -0.2));
      // 창문
      const door = b.door;
      const floors = Math.max(1, Math.floor((b.h - 14) / 22));
      for (const face of ['L', 'R']) {
        const len = face === 'L' ? b.w : b.d;
        for (let u = 0.6; u + 0.8 < len; u += 1.6) {
          if (door && door.f === face && u + 0.8 > door.u - 0.3 && u < door.u + (door.wide ? 3 : 1) + 0.3) continue;
          for (let fl = 0; fl < floors; fl++) {
            const v0 = 14 + fl * 22, v1 = v0 + (b.glass ? 18 : 12);
            const lit = night && rng() < 0.65;
            const wc = lit ? '#ffe2a0' : night ? '#2b3550' : (b.glass ? '#a9e2f0' : '#8fc4dc');
            G.faceRect(g, ox, oy, body, face, u - 0.06, u + 0.86, v0 - 1.5, v1 + 1.5, shade(b.wall, -0.3));
            G.faceRect(g, ox, oy, body, face, u, u + 0.8, v0, v1, face === 'R' ? shade(wc, -0.12) : wc);
            if (!night) G.faceRect(g, ox, oy, body, face, u + 0.1, u + 0.25, v0 + 3, v1 - 2, '#d8f2ff');
          }
        }
      }
      // 문
      if (door) {
        const dw = door.wide ? 3 : 1;
        const dh = door.wide ? 40 : 30;
        const lit = night;
        G.faceRect(g, ox, oy, body, door.f, door.u - 0.12, door.u + dw + 0.12, 0, dh + 3, shade(b.wall, -0.45));
        G.faceRect(g, ox, oy, body, door.f, door.u, door.u + dw, 0, dh, b.closed ? '#5a5f66' : (lit ? '#ffd58a' : '#3b4655'));
        if (!b.closed) G.faceRect(g, ox, oy, body, door.f, door.u + dw / 2 - 0.03, door.u + dw / 2 + 0.03, 0, dh, lit ? '#e0a95a' : '#2a323d');
        if (door.wide) for (let v = 4; v < dh; v += 5) G.faceRect(g, ox, oy, body, door.f, door.u, door.u + dw, v, v + 1, lit ? '#e0a95a' : '#2f3945');
        // 간판
        const su0 = door.u + dw / 2 - 0.55, su1 = door.u + dw / 2 + 0.55;
        G.faceRect(g, ox, oy, body, door.f, su0, su1, dh + 5, dh + 15, '#f4efe4');
        G.faceRect(g, ox, oy, body, door.f, su0 + 0.06, su1 - 0.06, dh + 6, dh + 14, b.stripe);
        // 아이콘 (간판 중앙)
        const cu = door.u + dw / 2, cv = dh + 10;
        const p = door.f === 'L' ? G.proj(cu, b.d, cv) : G.proj(b.w, cu, cv);
        G.icon(g, b.icon, Math.round(p[0] + ox - 3.5), Math.round(p[1] + oy - 3.5 + (door.f === 'L' ? -1 : 1)), '#ffffff');
      }
      if (b.awning) {
        const aw = { x: 0, y: b.d, z: 34, w: b.w, d: 0.6, h: 3, c: b.awning };
        G.box(g, ox, oy, aw);
        for (let u = 0; u < b.w; u += 0.8) G.faceRect(g, ox, oy, aw, 'L', u, u + 0.4, 0, 3, '#ffffff');
      }
      G.box(g, ox, oy, roof);
      G.box(g, ox, oy, parapet);
      for (const e of extras) {
        G.box(g, ox, oy, e);
        if (e.kind === 'ac') G.faceRect(g, ox, oy, e, 'L', 0.2, 1.0, 2, 5, '#7a8089');
        if (e.kind === 'antenna') G.box(g, ox, oy, { x: e.x - 0.08, y: e.y - 0.08, z: e.z + e.h, w: 0.28, d: 0.28, h: 3, c: night ? '#ff5a5a' : '#d0563b' });
        if (e.kind === 'dish') G.box(g, ox, oy, { x: e.x + 0.2, y: e.y + 0.2, z: e.z + 6, w: 1.0, d: 1.0, h: 4, c: '#ffffff' });
      }
    });
    cache.set(key, spr);
    return spr;
  }

  // 바위 언덕 + 동굴 입구 (창문·지붕 없는 자연 지형 건물)
  function rockMound(b, night) {
    const rng = PX.U.rng(b.id), c = b.wall;
    const parts = [];
    // 아래가 넓고 위로 갈수록 좁아지는 바위 층
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const ins = i * 0.7 + rng() * 0.3;
      parts.push({ x: ins, y: ins * 0.8, z: i * (b.h / layers), w: Math.max(1.5, b.w - ins * 2), d: Math.max(1.5, b.d - ins * 1.6), h: b.h / layers + 1, c: shade(c, i * 0.06 - 0.05) });
    }
    // 울퉁불퉁한 돌덩이
    for (let i = 0; i < 6; i++) { const w = 0.8 + rng() * 1.4; parts.push({ x: rng() * (b.w - w), y: rng() * (b.d - w), z: b.h * (0.5 + rng() * 0.45), w, d: w * 0.9, h: 4 + rng() * 6, c: shade(c, rng() * 0.2 - 0.1) }); }
    const body = { x: 0, y: 0, z: 0, w: b.w, d: b.d, h: b.h, c };
    return G.makeSprite(parts, (g, ox, oy) => {
      g.globalAlpha = 0.22; G.topRect(g, ox, oy, -0.3, -0.3, b.w + 0.45, b.d + 0.45, 0, '#000'); g.globalAlpha = 1;
      for (const p of parts) G.box(g, ox, oy, p);
      const d = b.door; if (!d) return;
      // 동굴 입구: 어두운 아치 + 안쪽 결정 빛
      const dw = 1.8, u0 = d.u - 0.4;
      G.faceRect(g, ox, oy, body, d.f, u0 - 0.2, u0 + dw + 0.2, 0, 22, shade(c, -0.35));
      G.faceRect(g, ox, oy, body, d.f, u0, u0 + dw, 0, 18, '#140c18');
      G.faceRect(g, ox, oy, body, d.f, u0 + 0.3, u0 + dw - 0.3, 18, 21, '#140c18');
      G.faceRect(g, ox, oy, body, d.f, u0 + 0.4, u0 + 0.6, 2, 7, night ? '#d6a2ff' : '#9b7fd0');
      G.faceRect(g, ox, oy, body, d.f, u0 + 1.2, u0 + 1.35, 3, 10, night ? '#7fe3ff' : '#5fa8c8');
      // 경고 표지판
      G.faceRect(g, ox, oy, body, d.f, u0 + dw + 0.5, u0 + dw + 1.3, 10, 16, '#ffd166');
      G.faceRect(g, ox, oy, body, d.f, u0 + dw + 0.85, u0 + dw + 0.95, 11, 14, '#2a2433');
    });
  }

  // 외곽 방벽 · 돔 유리벽 (긴 상자 하나로)
  function longWall(w, season) {
    const key = 'W|' + w.x + ',' + w.y + ',' + w.w + ',' + w.d + '|' + (w.glass ? 1 : 0) + season;
    if (cache.has(key)) return cache.get(key);
    const h = w.glass ? 34 : 24;
    const b = { x: 0, y: 0, z: 0, w: w.w, d: w.d, h, c: w.glass ? '#9fd8e8' : '#7a7f75' };
    const spr = G.makeSprite([b, { x: 0, y: 0, z: h, w: w.w, d: w.d, h: 3, c: '#000' }], (g, ox, oy) => {
      if (w.glass) g.globalAlpha = 0.75;
      G.box(g, ox, oy, b);
      g.globalAlpha = 1;
      G.box(g, ox, oy, { x: 0, y: 0, z: h, w: w.w, d: w.d, h: 3, c: w.glass ? '#d9dde2' : '#5e635a' });
      if (!w.glass) {
        G.faceRect(g, ox, oy, b, 'L', 0, w.w, 10, 12, '#e8c56a'); G.faceRect(g, ox, oy, b, 'R', 0, w.d, 10, 12, '#c9a74a');
        for (let u = 0; u < Math.max(w.w, w.d); u += 3) { G.faceRect(g, ox, oy, b, 'L', u, u + 0.12, 0, h, '#686d63'); G.faceRect(g, ox, oy, b, 'R', u, u + 0.12, 0, h, '#5a5f56'); }
      } else {
        for (let u = 0; u < Math.max(w.w, w.d); u += 2) { G.faceRect(g, ox, oy, b, 'L', u, u + 0.1, 0, h, '#e9f6fa'); G.faceRect(g, ox, oy, b, 'R', u, u + 0.1, 0, h, '#e9f6fa'); }
      }
    });
    cache.set(key, spr);
    return spr;
  }

  // 실내: 뒷벽(y=0) · 왼벽(x=0) + 벽 장식. 바닥 캔버스에 직접 그린다
  function drawRoomShell(g, ox, oy, m, night) {
    const H = m.wallH, t = 0.35;
    const wc = m.wall;
    // 바닥 판 두께 (디오라마 느낌)
    const slab = { x: 0, y: 0, z: -10, w: m.w, d: m.h, h: 10, c: shade(wc, -0.55), noTop: true, edge: false };
    G.box(g, ox, oy, slab);
    const back = { x: -t, y: -t, z: -10, w: m.w + t, d: t, h: H + 10, c: wc, lf: wc, top: shade(wc, -0.3) };
    const left = { x: -t, y: 0, z: -10, w: t, d: m.h, h: H + 10, c: wc, rf: shade(wc, -0.12), top: shade(wc, -0.3) };
    G.box(g, ox, oy, back); G.box(g, ox, oy, left);
    // 걸레받이
    const bb = { x: 0, y: -t, z: 0, w: m.w, d: t, h: 0 }, lb = { x: -t, y: 0, z: 0, w: t, d: m.h, h: 0 };
    G.faceRect(g, ox, oy, bb, 'L', 0, m.w, 0, 3, shade(wc, -0.3));
    G.faceRect(g, ox, oy, lb, 'R', 0, m.h, 0, 3, shade(wc, -0.38));
    // 벽 위쪽 몰딩
    G.faceRect(g, ox, oy, bb, 'L', 0, m.w, H - 4, H - 2, shade(wc, 0.25));
    G.faceRect(g, ox, oy, lb, 'R', 0, m.h, H - 4, H - 2, shade(wc, 0.15));
    for (const [wall, u, kind, wd] of m.walls || []) wallDecor(g, ox, oy, wall === 'B' ? bb : lb, wall === 'B' ? 'L' : 'R', u, wd || 1, kind, night, H);
  }
  function wallDecor(g, ox, oy, b, face, u, w, kind, night, H) {
    const R = (u0, u1, v0, v1, c) => G.faceRect(g, ox, oy, b, face, u0, u1, v0, v1, c);
    const dark = face === 'R' ? -0.1 : 0;
    const C = c => shade(c, dark);
    switch (kind) {
      case 'window': {
        R(u - 0.08, u + w + 0.08, 18, 46, C('#f4efe4'));
        R(u, u + w, 20, 44, C(night ? '#1c2440' : '#f0a68a'));
        R(u, u + w, 20, 30, C(night ? '#24305a' : '#ffcfa8'));
        if (night) { R(u + 0.2, u + 0.25, 38, 39, '#ffffff'); R(u + w * 0.7, u + w * 0.7 + 0.05, 33, 34, '#ffffff'); }
        else { R(u, u + w, 20, 24, C('#b8603f')); R(u + w * 0.6, u + w * 0.8, 24, 27, C('#e8c08a')); }
        R(u + w / 2 - 0.03, u + w / 2 + 0.03, 20, 44, C('#f4efe4'));
        R(u, u + w, 31.5, 32.5, C('#f4efe4'));
        break;
      }
      case 'poster': R(u, u + w, 22, 40, C('#2f5a3a')); R(u + 0.08, u + w - 0.08, 24, 38, C('#e8c56a')); R(u + 0.2, u + w - 0.2, 30, 35, C('#2f5a3a')); break;
      case 'clock': R(u, u + w, 34, 42, C('#3a3f45')); R(u + 0.06, u + w - 0.06, 35, 41, C('#ffffff')); R(u + w / 2 - 0.02, u + w / 2 + 0.03, 37, 40, '#000'); break;
      case 'flag': R(u, u + w, 26, 44, C('#2f5a3a')); R(u + w * 0.3, u + w * 0.7, 31, 39, C('#e8c56a')); R(u + w * 0.42, u + w * 0.58, 33, 37, C('#2f5a3a')); break;
      case 'map': R(u - 0.1, u + w + 0.1, 20, 46, C('#22282f')); R(u, u + w, 22, 44, C('#1f4a5a')); R(u + w * 0.2, u + w * 0.5, 28, 36, C('#3f8a7a')); R(u + w * 0.55, u + w * 0.85, 32, 40, C('#c9654a')); R(u + w * 0.6, u + w * 0.66, 36, 38, '#ff6b6b'); break;
      case 'board': R(u, u + w, 22, 42, C('#8a6a4c')); R(u + 0.06, u + w - 0.06, 23, 41, C('#d9c29a')); R(u + 0.2, u + 0.5, 32, 38, C('#ffffff')); R(u + 0.7, u + 1.0, 28, 35, C('#ffd166')); R(u + 1.0, u + 1.25, 34, 39, C('#9fd8ff')); break;
      case 'notice': R(u, u + w, 24, 42, C('#ffffff')); R(u + 0.1, u + w - 0.1, 37, 40, C('#d36b4a')); for (let v = 27; v < 35; v += 3) R(u + 0.1, u + w - 0.2, v, v + 1, C('#9aa3ad')); break;
      case 'menu': R(u, u + w, 26, 44, C('#3a2a20')); for (let v = 29; v < 42; v += 3) R(u + 0.15, u + w - 0.4, v, v + 1, C('#f1e6d0')); R(u + w - 0.35, u + w - 0.15, 29, 41, C('#ffb36b')); break;
      case 'screen': R(u, u + w, 24, 42, C('#15161c')); R(u + 0.06, u + w - 0.06, 25, 41, C('#2f6d7f')); R(u + 0.2, u + 0.6, 30, 33, C('#7fffbf')); break;
      case 'cross': R(u, u + w, 24, 42, C('#ffffff')); R(u + w * 0.38, u + w * 0.62, 26, 40, C('#d64545')); R(u + w * 0.15, u + w * 0.85, 31, 35, C('#d64545')); break;
      case 'toolwall': R(u, u + w, 18, 44, C('#5a5f66')); for (let k = 0; k < w * 3; k++) R(u + 0.15 + k * 0.33, u + 0.22 + k * 0.33, 24 + (k % 3) * 3, 36 + (k % 2) * 4, C(['#c9ced4', '#e8c56a', '#d0563b'][k % 3])); break;
      case 'hazard': for (let k = 0; k < w * 4; k++) R(u + k * 0.25, u + k * 0.25 + 0.125, 4, 10, C('#e8c56a')); break;
      case 'shutter': R(u, u + w, 0, H - 14, C('#7a828c')); for (let v = 3; v < H - 14; v += 4) R(u, u + w, v, v + 1, C('#5f6670')); break;
      case 'mirrorw': R(u, u + w, 16, 44, C('#9aa3ad')); R(u + 0.06, u + w - 0.06, 17, 43, C('#cfe6f2')); R(u + 0.2, u + 0.35, 24, 40, '#ffffff'); break;
    }
  }

  return { footprint, rotPt, rotDir, furniture, seatsOf, building, longWall, drawRoomShell, DIRV, cache };
})();
