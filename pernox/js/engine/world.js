// 맵 런타임 생성 + 렌더러 (바닥 캐시, 깊이 정렬, 낮/밤 조명, 날씨)
'use strict';
PX.W = (() => {
  const G = PX.G, O = PX.O, U = PX.U;
  const maps = {};

  // ---------- 맵 빌드 ----------
  function build(id) {
    if (maps[id]) return maps[id];
    const def = PX.MAPS[id];
    const m = { id, def, name: def.name, kind: def.kind, w: def.w, h: def.h, objs: [], spots: {}, doors: [], lights: [], ground: {}, tiles: [], walk: null };
    m.walk = new Uint8Array(m.w * m.h).fill(1);
    const T = (x, y, t) => { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.tiles[y * m.w + x] = t; };
    const fill = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) T(x, y, t); };
    if (def.kind === 'in') {
      fill(0, 0, m.w - 1, m.h - 1, def.floor);
      m.exit = { x: def.exit, y: m.h - 1 };
      (def.furn || []).forEach((a, i) => {
        if (a[0] === '@') { m.spots[a[4]] = { x: a[1] + 0.5, y: a[2] + 0.5, dir: a[3], pose: a[5] || 'stand', z: 0 }; return; }
        addFurn(m, a[0], a[1], a[2], a[3] || 0, a[4], 'f' + i);
      });
    } else {
      fill(0, 0, m.w - 1, m.h - 1, def.fill || (def.dome ? 'plaza' : 'sand'));
      for (const z of def.zones || []) fill(z.x0, z.y0, z.x1, z.y1, z.t);
      for (const r of def.roads || []) {
        if (r.walk) { fill(r.x0, r.y0, r.x1, r.y1, 'concrete'); continue; }
        // 인도
        if (r.axis === 'y') { fill(r.x0 - 1, r.y0, r.x0 - 1, r.y1, 'concrete'); fill(r.x1 + 1, r.y0, r.x1 + 1, r.y1, 'concrete'); }
        else { fill(r.x0, r.y0 - 1, r.x1, r.y0 - 1, 'concrete'); fill(r.x0, r.y1 + 1, r.x1, r.y1 + 1, 'concrete'); }
      }
      for (const r of def.roads || []) {
        if (r.walk) continue;
        fill(r.x0, r.y0, r.x1, r.y1, 'asphalt');
        const mid = r.axis === 'y' ? Math.floor((r.x0 + r.x1) / 2) : Math.floor((r.y0 + r.y1) / 2);
        if (r.axis === 'y') fill(mid, r.y0, mid, r.y1, 'roadline'); else fill(r.x0, mid, r.x1, mid, 'roadline');
      }
      const plaza = (def.zones || []).find(z => z.t === 'plaza');
      if (plaza) fill(plaza.x0, plaza.y0, plaza.x1, plaza.y1, 'plaza');
      for (const b of def.buildings) fill(b.x - 1, b.y - 1, b.x + b.w, b.y + b.d, def.dome ? 'concrete' : 'concrete');
      for (const r of def.roads || []) if (!r.walk) { // 도로는 건물 앞마당보다 우선
        fill(r.x0, r.y0, r.x1, r.y1, 'asphalt');
        const mid = r.axis === 'y' ? Math.floor((r.x0 + r.x1) / 2) : Math.floor((r.y0 + r.y1) / 2);
        if (r.axis === 'y') fill(mid, r.y0, mid, r.y1, 'roadline'); else fill(r.x0, mid, r.x1, mid, 'roadline');
      }
      if (plaza) fill(plaza.x0, plaza.y0, plaza.x1, plaza.y1, 'plaza');
      // 건물
      for (const b of def.buildings) {
        const o = { kind: 'bld', id: b.id, b, x: b.x, y: b.y, fw: b.w, fd: b.d, blocks: true, name: b.name, closedMsg: b.closedMsg };
        m.objs.push(o);
        for (let y = b.y; y < b.y + b.d; y++) for (let x = b.x; x < b.x + b.w; x++) m.walk[y * m.w + x] = 0;
        if (b.door) {
          const dw = b.door.wide ? 3 : 1;
          const ex = b.door.f === 'L' ? b.x + b.door.u + Math.floor(dw / 2) : b.x + b.w;
          const ey = b.door.f === 'L' ? b.y + b.d : b.y + b.door.u + Math.floor(dw / 2);
          o.door = { x: ex, y: ey, to: b.to, closed: !!b.closed };
          m.doors.push({ x: ex, y: ey, to: b.to, bld: o, closed: !!b.closed, name: b.name, closedMsg: b.closedMsg });
          // 문등 (밤)
          const lp = b.door.f === 'L' ? [b.x + b.door.u + dw / 2, b.y + b.d + 0.2] : [b.x + b.w + 0.2, b.y + b.door.u + dw / 2];
          if (!b.closed) m.lights.push({ x: lp[0], y: lp[1], z: 34, r: 3.2, c: '#ffd9a0', night: true });
        }
      }
      // 외곽 벽
      for (const w of def.walls || []) {
        m.objs.push({ kind: 'wall', w, x: w.x, y: w.y, fw: w.w, fd: w.d, blocks: true });
        for (let y = w.y; y < w.y + w.d; y++) for (let x = w.x; x < w.x + w.w; x++) if (x < m.w && y < m.h) m.walk[y * m.w + x] = 0;
      }
      if (def.desert) { // 방벽 밖 사막: 걸을 수 없음, 바위 장식
        const r = U.rng('desert' + id);
        for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
          const out = x < 2 || y < 2 || x > 61 || y > 61;
          if (out) { m.walk[y * m.w + x] = 0; if (r() < 0.05 && !(x >= 29 && x <= 33 && y > 61)) m.objs.push(mkDecor(m, r() < 0.3 ? 'rockbig' : 'rock', x, y, 0, true)); }
        }
      }
      (def.decor || []).forEach(([fid, x, y, rr, ev]) => { const o = mkDecor(m, fid, x, y, rr || 0); if (ev) o.event = ev; m.objs.push(o); });
      m.links = (def.links || []).map(l => Object.assign({}, l));
      for (const k in def.spots || {}) { const [x, y, dir, pose] = def.spots[k]; m.spots[k] = { x: x + 0.5, y: y + 0.5, dir, pose, z: 0 }; }
      // 물 타일은 못 걷는다
      for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === 'water' || m.tiles[i] === 'deepwater' || m.tiles[i] === 'void') m.walk[i] = 0;
    }
    // 가구 막힘 반영
    for (const o of m.objs) if (o.kind === 'furn' && o.blocks) for (let y = o.y; y < o.y + o.fd; y++) for (let x = o.x; x < o.x + o.fw; x++) if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.walk[y * m.w + x] = 0;
    resolveSpots(m);
    m.staticLights = m.lights.filter(L => !L.obj);
    maps[id] = m;
    return m;
  }
  function mkDecor(m, fid, x, y, r, desert) {
    const f = PX.FURN[fid];
    const [fw, fd] = O.footprint(f, r);
    const o = { kind: 'furn', fid, f, x, y, r, fw, fd, blocks: f.blocks, use: f.use, desert };
    o.seats = O.seatsOf(f, r).map(s => ({ x: x + s.x, y: y + s.y, dir: s.dir, z: s.z, obj: o, by: null }));
    if (f.light) { o.light = { x: x + fw / 2, y: y + fd / 2, z: f.light.z, r: f.light.r, c: f.light.c, night: !!f.light.night, obj: o }; m.lights.push(o.light); }
    if (f.blocks && !desert) for (let yy = y; yy < y + fd; yy++) for (let xx = x; xx < x + fw; xx++) if (xx < m.w && yy < m.h) m.walk[yy * m.w + xx] = 0;
    return o;
  }
  function addFurn(m, fid, x, y, r, spot, uid) {
    const f = PX.FURN[fid];
    if (!f) { console.warn('unknown furniture', fid); return null; }
    const [fw, fd] = O.footprint(f, r);
    const o = { kind: 'furn', uid, fid, f, x, y, r, fw, fd, blocks: f.blocks, use: f.use, spot };
    o.seats = O.seatsOf(f, r).map(s => ({ x: x + s.x, y: y + s.y, dir: s.dir, z: s.z, obj: o, by: null }));
    if (f.light) { o.light = { x: x + fw / 2, y: y + fd / 2, z: f.light.z, r: f.light.r, c: f.light.c, night: !!f.light.night, obj: o }; m.lights.push(o.light); }
    m.objs.push(o);
    return o;
  }
  // 행사 매대: 해당 로어북 행사가 열려 있을 때만 보이고 길을 막는다
  function updateEvents(m, date, min) {
    for (const o of m.objs) {
      if (!o.event) continue;
      const on = o.event.some(id => PX.Cal.openAt(PX.LORE_BY_ID[id], date, min));
      if (o.hidden === !on) continue;
      o.hidden = !on;
      for (let y = o.y; y < o.y + o.fd; y++) for (let x = o.x; x < o.x + o.fw; x++) m.walk[y * m.w + x] = on && o.blocks ? 0 : 1;
      if (o.light) o.light.off = !on;
    }
  }
  // 가구 하나 다시 배치 (꾸미기 모드)
  // 가구를 뺀 기본 길 (건물 · 벽 · 물 · 우주 · 사막 가장자리)
  function baseGrid(m) {
    const g = new Uint8Array(m.w * m.h).fill(1);
    if (m.kind === 'out') {
      for (const o of m.objs) if (o.kind === 'bld' || o.kind === 'wall') for (let y = o.y; y < o.y + o.fd; y++) for (let x = o.x; x < o.x + o.fw; x++) if (x >= 0 && y >= 0 && x < m.w && y < m.h) g[y * m.w + x] = 0;
      for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === 'water' || m.tiles[i] === 'deepwater' || m.tiles[i] === 'void') g[i] = 0;
      if (m.def.desert) for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (x < 2 || y < 2 || x > 61 || y > 61) g[y * m.w + x] = 0;
    }
    return g;
  }
  function rebuildWalk(m) {
    m.walk.set(baseGrid(m));
    for (const o of m.objs) if (o.kind === 'furn' && o.blocks && !o.hidden && !o.desert) for (let y = o.y; y < o.y + o.fd; y++) for (let x = o.x; x < o.x + o.fw; x++) if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.walk[y * m.w + x] = 0;
    m.lights = (m.staticLights || []).concat(m.objs.filter(o => o.light).map(o => o.light));
    resolveSpots(m);
  }
  function refreshObj(m, o) {
    const [fw, fd] = O.footprint(o.f, o.r); o.fw = fw; o.fd = fd;
    o.seats = O.seatsOf(o.f, o.r).map(s => ({ x: o.x + s.x, y: o.y + s.y, dir: s.dir, z: s.z, obj: o, by: null }));
    if (o.f.light) o.light = { x: o.x + fw / 2, y: o.y + fd / 2, z: o.f.light.z, r: o.f.light.r, c: o.f.light.c, night: false, obj: o };
    o.spr = null;
  }
  function resolveSpots(m) {
    for (const o of m.objs) {
      if (o.kind !== 'furn' || !o.spot) continue;
      if (o.seats.length) {
        o.seats.forEach((s, i) => { m.spots[o.spot + (i ? '/' + i : '')] = { x: s.x, y: s.y, dir: s.dir, pose: o.use === 'bed' ? 'lie' : 'sit', z: s.z, seat: s, obj: o }; });
        m.spots[o.spot + '/0'] = m.spots[o.spot];
      } else {
        const a = accessTile(m, o);
        if (a) m.spots[o.spot] = { x: a.x + 0.5, y: a.y + 0.5, dir: a.dir, pose: o.use === 'workout' ? 'workout' : o.use === 'work' ? 'work' : 'stand', z: 0, obj: o };
      }
    }
  }
  const walkable = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.walk[y * m.w + x] === 1;
  // 물체 앞의 걸을 수 있는 칸 (정면 우선)
  function accessTile(m, o) {
    const cand = [];
    const front = o.kind === 'furn' ? O.rotDir(0, o.r) : 0;
    for (let x = o.x - 1; x <= o.x + o.fw; x++) for (let y = o.y - 1; y <= o.y + o.fd; y++) {
      const inside = x >= o.x && x < o.x + o.fw && y >= o.y && y < o.y + o.fd;
      if (inside || !walkable(m, x, y)) continue;
      const diag = (x < o.x || x >= o.x + o.fw) && (y < o.y || y >= o.y + o.fd);
      if (diag) continue;
      let dir = y >= o.y + o.fd ? 2 : x >= o.x + o.fw ? 3 : y < o.y ? 0 : 1; // 물체를 바라보는 방향
      const side = y >= o.y + o.fd ? 0 : x >= o.x + o.fw ? 1 : y < o.y ? 2 : 3;
      cand.push({ x, y, dir, score: (side === front ? 0 : 1) + Math.abs(x + 0.5 - (o.x + o.fw / 2)) * 0.1 + Math.abs(y + 0.5 - (o.y + o.fd / 2)) * 0.1 });
    }
    cand.sort((a, b) => a.score - b.score);
    return cand[0] || null;
  }

  // ---------- 바닥 캔버스 ----------
  function groundCanvas(m, season, night) {
    const key = season + (m.kind === 'in' && night ? 'N' : 'D');
    if (m.ground[key]) return m.ground[key];
    const W = (m.w + m.h) * 16 + 8, H = (m.w + m.h) * 8 + (m.kind === 'in' ? m.def.wallH + 30 : 16);
    const c = G.canvas(W, H), g = c.getContext('2d');
    const ox = m.h * 16 + 4, oy = m.kind === 'in' ? m.def.wallH + 20 : 4;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const t = m.tiles[y * m.w + x];
      const v = U.hash(x + ',' + y + m.id) % 4;
      const p = G.proj(x, y);
      g.drawImage(G.tile(t, season, v), ox + p[0] - 16, oy + p[1]);
    }
    if (m.kind === 'in') {
      O.drawRoomShell(g, ox, oy, Object.assign({}, m.def, { w: m.w, h: m.h }), night);
      // 출구 매트
      const e = m.exit;
      G.topRect(g, ox, oy, e.x + 0.08, e.y + 0.15, e.x + 0.92, e.y + 0.95, 0.5, '#3b2f45');
      G.topRect(g, ox, oy, e.x + 0.18, e.y + 0.3, e.x + 0.82, e.y + 0.85, 0.5, '#5a4a6a');
      const ap = G.proj(e.x + 0.5, e.y + 0.62);
      g.fillStyle = '#ffd166';
      for (let i = 0; i < 4; i++) g.fillRect(ox + ap[0] - 1 - i, oy + ap[1] - 2 + i, 2 + i * 2, 1);
    }
    m.ground[key] = { c, ox, oy };
    return m.ground[key];
  }

  // ---------- 렌더 ----------
  const view = { cv: null, g: null, w: 0, h: 0, zoom: 3, camX: 0, camY: 0, dark: null };
  function setCanvas(cv) { view.cv = cv; view.g = cv.getContext('2d'); }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = window.innerWidth, ch = window.innerHeight;
    const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    view.base = Math.max(2, Math.round(pw / 250));
    view.zoom = Math.max(1, Math.min(view.base + 3, view.base + (view.zoomOff || 0)));
    // 화면보다 사방 1픽셀씩 크게 그려 두고, 카메라의 소수점만큼 CSS로 밀어서 부드럽게 스크롤한다
    view.w = Math.ceil(pw / view.zoom) + 2; view.h = Math.ceil(ph / view.zoom) + 2;
    view.cssScale = cw / (view.w - 2);
    view.cv.width = view.w; view.cv.height = view.h;
    view.cv.style.width = view.w * view.cssScale + 'px'; view.cv.style.height = view.h * view.cssScale + 'px';
    view.cv.style.inset = 'auto'; view.cv.style.left = '0'; view.cv.style.top = '0'; view.cv.style.willChange = 'transform';
    view.g.imageSmoothingEnabled = false;
    view.dark = G.canvas(view.w, view.h);
  }
  // 화면의 한 점을 눌렀을 때 맨 위에 그려진 물체/사람 (투명한 픽셀은 통과)
  function pick(sx, sy) {
    const order = view.lastOrder || [];
    for (let i = order.length - 1; i >= 0; i--) {
      const e = order[i], c = e.spr ? e.spr.c : e.fr.c;
      let x = Math.floor(sx - e.dx), y = Math.floor(sy - e.dy);
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue;
      if (e.fr && e.fr.flip) x = c.width - 1 - x;
      if (!c._a) { try { c._a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; } catch (err) { return e; } }
      if (c._a[(y * c.width + x) * 4 + 3] > 20) return e;
    }
    return null;
  }
  // 확대·축소: 픽셀이 뭉개지지 않게 정수 배율로만 (기본 배율 -3 ~ +3)
  function zoomBy(step) {
    const lo = Math.max(1, view.base - 3), hi = view.base + 3;
    const nz = Math.max(lo, Math.min(hi, view.zoom + step));
    if (nz === view.zoom) return false;
    view.zoomOff = nz - view.base;
    resize();
    return true;
  }
  const toScreen = (x, y, z = 0) => { const p = G.proj(x, y, z); return [Math.round(p[0] - view.camX + view.w / 2), Math.round(p[1] - view.camY + view.h / 2)]; };
  function toWorld(sx, sy) { // 화면(내부 픽셀) → 타일 좌표 (z=0)
    const px = sx - view.w / 2 + view.camX, py = sy - view.h / 2 + view.camY;
    return [(px / 16 + py / 8) / 2, (py / 8 - px / 16) / 2];
  }

  function objSprite(o, season, night) {
    const key = season + (night ? 1 : 0);
    if (o.spr && o.sprKey === key) return o.spr;
    if (o.kind === 'furn') o.spr = O.furniture(o.fid, o.r, season);
    else if (o.kind === 'bld') o.spr = O.building(o.b, season, night);
    else o.spr = O.longWall(o.w, season);
    o.sprKey = key;
    return o.spr;
  }
  const behind = (a, b) => a.x1 <= b.x0 + 0.001 || a.y1 <= b.y0 + 0.001;

  // 조명 정도: 0 = 한낮, 1 = 깊은 밤
  function ambient(m, min, weather) {
    const h = min / 60;
    let d;
    if (h < 4.5) d = 1; else if (h < 7) d = 1 - (h - 4.5) / 2.5; else if (h < 17.5) d = 0; else if (h < 20) d = (h - 17.5) / 2.5; else d = 1;
    let tint = null;
    if (h >= 5 && h < 7.2) tint = ['#ff9a6a', 0.18 * (1 - Math.abs(h - 6) / 1.2)];
    if (h >= 17 && h < 19.5) tint = ['#ff7a4a', 0.24 * (1 - Math.abs(h - 18.2) / 1.3)];
    if (m.def.dome) { d *= 0.7; if (min >= 17 * 60 + 40 && min < 18 * 60 + 30) tint = ['#ff8a5a', m.def.sunsetView ? 0.34 : 0.26]; }
    if (m.kind === 'in') { d = d * 0.35; tint = null; }
    if (m.def.amb) d = Math.max(d, m.def.amb);
    if (m.def.tint && !tint) tint = m.def.tint;
    if (weather === 'cloudy' || weather === 'rain') d = Math.min(1, d + 0.12);
    if (weather === 'dust' && m.kind === 'out' && !m.def.dome) tint = ['#d0603a', 0.22];
    return { d, tint };
  }

  // 메인 렌더
  function render(m, actors, env, extra) {
    const g = view.g, W = view.w, H = view.h;
    const season = env.season, night = env.night;
    // 배경
    g.fillStyle = m.def.bg || (m.kind === 'in' ? '#17121f' : m.def.dome ? '#2a3850' : G.SEASON_PAL[season].sand);
    g.fillRect(0, 0, W, H);
    const gr = groundCanvas(m, season, night);
    const sx0 = Math.round(-view.camX + W / 2 - gr.ox), sy0 = Math.round(-view.camY + H / 2 - gr.oy);
    g.drawImage(gr.c, sx0, sy0);
    if (extra && extra.underlay) extra.underlay(g);
    // 그릴 것 모으기
    const list = [];
    for (const o of m.objs) {
      const spr = objSprite(o, season, night);
      const [sx, sy] = toScreen(o.x, o.y);
      const dx = sx - spr.ax, dy = sy - spr.ay;
      if (dx > W || dy > H || dx + spr.c.width < 0 || dy + spr.c.height < 0) continue;
      if (o.hidden) continue;
      const e = { o, spr, dx, dy, x0: o.x, y0: o.y, x1: o.x + o.fw, y1: o.y + o.fd, flat: o.f && o.f.flat };
      if (e.flat) { g.drawImage(spr.c, dx, dy); continue; }
      list.push(e);
    }
    for (const a of actors) {
      if (a.map !== m.id || a.hidden) continue;
      const fr = a.frameInfo();
      const [sx, sy] = toScreen(a.x, a.y, a.z || 0);
      const dx = sx - fr.ax, dy = sy - fr.ay;
      if (dx > W || dy > H || dx + fr.c.width < 0 || dy + fr.c.height < 0) continue;
      const r = a.seat ? 0.05 : 0.3;
      list.push({ a, fr, dx, dy, sx, sy, x0: a.x - r, y0: a.y - r, x1: a.x + r, y1: a.y + r, onObj: a.seat ? a.seat.obj : null });
    }
    // 깊이 정렬: 화면에서 겹치는 쌍만 앞뒤를 정해 위상 정렬 (Kahn)
    const n = list.length, order = [];
    const cs = list.map(e => e.x0 + e.x1 + e.y0 + e.y1);
    const rw = list.map(e => (e.spr ? e.spr.c.width : e.fr.c.width)), rh = list.map(e => (e.spr ? e.spr.c.height : e.fr.c.height));
    const indeg = new Int32Array(n), adj = [];
    for (let i = 0; i < n; i++) adj.push([]);
    for (let i = 0; i < n; i++) {
      const A = list[i];
      for (let j = i + 1; j < n; j++) {
        const B = list[j];
        if (A.dx >= B.dx + rw[j] || B.dx >= A.dx + rw[i] || A.dy >= B.dy + rh[j] || B.dy >= A.dy + rh[i]) continue;
        let aFirst;
        if (A.onObj && B.o === A.onObj) aFirst = false;
        else if (B.onObj && A.o === B.onObj) aFirst = true;
        else {
          const bA = behind(A, B), bB = behind(B, A);
          if (bA && !bB) aFirst = true; else if (bB && !bA) aFirst = false; else aFirst = cs[i] <= cs[j];
        }
        if (aFirst) { adj[i].push(j); indeg[j]++; } else { adj[j].push(i); indeg[i]++; }
      }
    }
    const done = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      let best = -1;
      for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (best < 0 || cs[i] < cs[best])) best = i;
      if (best < 0) for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || cs[i] < cs[best])) best = i; // 순환 시
      done[best] = 1; order.push(list[best]);
      for (const j of adj[best]) indeg[j]--;
    }
    view.lastOrder = order;
    for (const e of order) {
      if (e.o) {
        if (e.o.ghost) g.globalAlpha = 0.55;
        g.drawImage(e.spr.c, e.dx, e.dy);
        g.globalAlpha = 1;
        if (extra && extra.objOverlay) extra.objOverlay(g, e);
      } else {
        const a = e.a;
        // 그림자
        if (!a.seat) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(e.sx - 5 - (a.big ? 2 : 0), e.sy - 1, 10 + (a.big ? 4 : 0), 2); g.fillRect(e.sx - 4, e.sy - 2, 8, 4); }
        if (e.fr.flip) { g.save(); g.translate(e.dx + e.fr.c.width, e.dy); g.scale(-1, 1); g.drawImage(e.fr.c, 0, 0); g.restore(); }
        else g.drawImage(e.fr.c, e.dx, e.dy);
        a.screen = { x: e.sx, y: e.dy + e.fr.headY - 2, top: e.dy, foot: e.sy };
      }
    }
    // 조명 · 날씨
    const amb = ambient(m, env.min, env.weather);
    if (m.kind === 'out' && !m.def.dome && m.def.fx !== 'stars') weatherFx(g, env, W, H);
    if (amb.tint) { g.globalAlpha = amb.tint[1]; g.fillStyle = amb.tint[0]; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (amb.d > 0.02) {
      const dk = view.dark, dg = dk.getContext('2d');
      dg.globalCompositeOperation = 'source-over';
      dg.clearRect(0, 0, W, H);
      dg.fillStyle = m.kind === 'in' ? 'rgba(20,14,40,' + (0.62 * amb.d).toFixed(3) + ')' : 'rgba(10,12,38,' + (0.68 * amb.d).toFixed(3) + ')';
      dg.fillRect(0, 0, W, H);
      dg.globalCompositeOperation = 'destination-out';
      const lights = m.lights.concat(extra && extra.lights || []);
      for (const L of lights) {
        if (L.off) continue;
        const [lx, ly] = toScreen(L.x, L.y, L.z * 0.5);
        const r = L.r * 16;
        if (lx < -r || ly < -r || lx > W + r || ly > H + r) continue;
        const gr2 = dg.createRadialGradient(lx, ly, 0, lx, ly, r);
        gr2.addColorStop(0, 'rgba(0,0,0,0.95)'); gr2.addColorStop(0.5, 'rgba(0,0,0,0.5)'); gr2.addColorStop(1, 'rgba(0,0,0,0)');
        dg.fillStyle = gr2;
        dg.beginPath(); dg.ellipse(lx, ly, r, r * 0.6, 0, 0, Math.PI * 2); dg.fill();
      }
      g.drawImage(dk, 0, 0);
      // 따뜻한 빛 번짐
      g.globalCompositeOperation = 'lighter';
      for (const L of lights) {
        if (L.off) continue;
        const [lx, ly] = toScreen(L.x, L.y, L.z * 0.5);
        const r = L.r * 9;
        if (lx < -r || ly < -r || lx > W + r || ly > H + r) continue;
        const gr3 = g.createRadialGradient(lx, ly, 0, lx, ly, r);
        const [cr, cg, cb] = U.hexToRgb(L.c);
        gr3.addColorStop(0, `rgba(${cr},${cg},${cb},${(0.22 * amb.d).toFixed(3)})`); gr3.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr3; g.fillRect(lx - r, ly - r, r * 2, r * 2);
      }
      g.globalCompositeOperation = 'source-over';
    }
    if (m.kind === 'out' && m.def.dome) domeFx(g, env, W, H);
    if (m.def.fx) specialFx(g, m, env, W, H);
    if (extra && extra.overlay) extra.overlay(g);
  }

  // 날씨 파티클
  const parts = [];
  let partKind = '';
  function weatherFx(g, env, W, H) {
    let kind = env.weather;
    if (kind === 'clear' || kind === 'cloudy') kind = env.season === 'spring' ? 'petal' : env.season === 'autumn' ? 'leaf' : env.season === 'winter' ? 'snowlight' : 'none';
    if (kind !== partKind) { parts.length = 0; partKind = kind; }
    const target = { rain: 90, snow: 70, snowlight: 18, dust: 80, glow: 40, petal: 14, leaf: 14, none: 0 }[kind] || 0;
    while (parts.length < target) parts.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), t: Math.random() * 100 });
    const dt = env.dt;
    if (kind === 'dust') { g.fillStyle = 'rgba(200,90,50,0.16)'; g.fillRect(0, 0, W, H); }
    for (const p of parts) {
      p.t += dt;
      switch (kind) {
        case 'rain': p.x -= 30 * dt; p.y += 260 * dt; g.fillStyle = 'rgba(190,220,255,0.55)'; g.fillRect(p.x | 0, p.y | 0, 1, 4); break;
        case 'snow': case 'snowlight': p.x += Math.sin(p.t * 1.5 + p.s * 6) * 10 * dt; p.y += (18 + p.s * 14) * dt; g.fillStyle = 'rgba(240,246,255,0.9)'; g.fillRect(p.x | 0, p.y | 0, p.s > 0.6 ? 2 : 1, p.s > 0.6 ? 2 : 1); break;
        case 'dust': p.x += (120 + p.s * 80) * dt; p.y += Math.sin(p.t * 2) * 8 * dt; g.fillStyle = 'rgba(230,140,90,0.6)'; g.fillRect(p.x | 0, p.y | 0, 2, 1); break;
        case 'glow': p.y -= (6 + p.s * 8) * dt; p.x += Math.sin(p.t + p.s * 9) * 6 * dt; g.fillStyle = `rgba(170,255,240,${0.4 + 0.4 * Math.sin(p.t * 3)})`; g.fillRect(p.x | 0, p.y | 0, 1, 1); break;
        case 'petal': p.x += (12 + Math.sin(p.t) * 8) * dt; p.y += (14 + p.s * 6) * dt; g.fillStyle = '#ffb3d9'; g.fillRect(p.x | 0, p.y | 0, 2, 1); break;
        case 'leaf': p.x += (16 + Math.sin(p.t) * 10) * dt; p.y += (16 + p.s * 8) * dt; g.fillStyle = p.s > 0.5 ? '#ee9a47' : '#d0603a'; g.fillRect(p.x | 0, p.y | 0, 2, 2); break;
      }
      if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; }
      if (p.x > W + 4) p.x = -4; if (p.x < -4) p.x = W + 4;
      if (p.y < -6) p.y = H + 4;
    }
  }
  // 지역 특수 효과: 별, 오로라, 빛먼지
  const sfx = [];
  function specialFx(g, m, env, W, H) {
    const t = performance.now() / 1000, fx = m.def.fx;
    if (fx === 'aurora' && (env.min >= 19 * 60 || env.min < 5 * 60)) {
      for (let i = 0; i < 3; i++) {
        const y0 = 30 + i * 22 + Math.sin(t * 0.3 + i) * 6;
        for (let x = 0; x < W; x += 2) { const y = y0 + Math.sin(x / 30 + t * 0.6 + i * 2) * 12; g.fillStyle = `rgba(${i === 1 ? '160,120,255' : '110,255,190'},${0.16 + 0.08 * Math.sin(x / 17 + t)})`; g.fillRect(x, y, 2, 18 + 10 * Math.sin(x / 23 + i)); }
      }
    }
    if (fx === 'lightdust') {
      const wd = PX.Cal.weekday(PX.St.S.time.y, PX.St.S.time.m, PX.St.S.time.d);
      const on = (wd === 3 || wd === 6) && env.min >= 20 * 60 + 30 && env.min < 21 * 60 + 30;
      const n = on ? 90 : 14;
      while (sfx.length < n) sfx.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() });
      sfx.length = n;
      for (const p of sfx) { p.y -= (4 + p.s * 8) * env.dt; p.x += Math.sin(t + p.s * 9) * 5 * env.dt; if (p.y < 0) { p.y = H; p.x = Math.random() * W; } g.fillStyle = `rgba(255,${200 + 55 * p.s | 0},${160 + 90 * p.s | 0},${0.4 + 0.5 * Math.abs(Math.sin(t * 2 + p.s * 7))})`; g.fillRect(p.x | 0, p.y | 0, on ? 2 : 1, on ? 2 : 1); }
    }
  }
  function domeFx(g, env, W, H) { // 돔 안: 은은한 발광 포자
    if (partKind !== 'dome') { parts.length = 0; partKind = 'dome'; }
    while (parts.length < 16) parts.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), t: Math.random() * 100 });
    for (const p of parts) { p.t += env.dt; p.y -= 5 * env.dt; p.x += Math.sin(p.t + p.s * 7) * 4 * env.dt; if (p.y < -2) { p.y = H + 2; p.x = Math.random() * W; } g.fillStyle = `rgba(190,240,255,${0.3 + 0.3 * Math.sin(p.t * 2)})`; g.fillRect(p.x | 0, p.y | 0, 1, 1); }
  }

  return { baseGrid, pick, zoomBy, updateEvents, build, maps, view, setCanvas, resize, toScreen, toWorld, render, walkable, accessTile, addFurn, rebuildWalk, refreshObj, groundCanvas };
})();
