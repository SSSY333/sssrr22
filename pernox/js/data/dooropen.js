// 바깥 맵 건물 문: 좁은 통로에 붙어 들어가기 어려운 문은 더 트인 쪽(앞면 L · 오른쪽 R)으로 옮긴다
// 문 앞 3×3 칸이 얼마나 비어 있는지(다른 건물 · 막는 장식 · 맵 끝) + 길 위면 가산점. 지금 자리가 충분히 트였으면 그대로 둔다.
// 정한 문 앞 두 줄에 있는 작은 장식(가로등 · 화분 · 발광초 등)은 치운다.
'use strict';
(() => {
  const M = PX.MAPS, F = PX.FURN;
  const SMALL = /^(streetlamp|lantern|glowflower|planter|flowerbed|tree|tree2|bush|benchout|kiosk|neontree|parasol|trashcan|plant|bigplant)$/;
  const size = (e) => { const f = F[e[0]]; return f ? (e[3] % 2 ? [f.d, f.w] : [f.w, f.d]) : [1, 1]; };
  for (const id in M) {
    const m = M[id]; if (m.kind !== 'out' || !Array.isArray(m.buildings) || !m.buildings.length) continue;
    const W = m.w, H = m.h, decor = m.decor || [];
    const block = new Uint8Array(W * H);
    const mark = (x, y, w, d, v = 1) => { for (let yy = y; yy < y + d; yy++) for (let xx = x; xx < x + w; xx++) if (xx >= 0 && yy >= 0 && xx < W && yy < H) block[yy * W + xx] = v; };
    for (const b of m.buildings) mark(b.x, b.y, b.w, b.d, 2);
    for (const e of decor) { const f = F[e[0]]; if (f && f.blocks !== false && !(e[4] && Array.isArray(e[4]))) { const [w, d] = size(e); mark(e[1], e[2], w, d, 1); } } // 행사 때만 나오는 매대는 빼고
    const onRoad = (x, y) => (m.roads || []).some(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
    const free = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && block[y * W + x] !== 2;
    // 문 칸(ex,ey)에서 밖으로 나가는 방향(dx,dy)으로 3칸 깊이 · 좌우 1칸
    function score(ex, ey, dx, dy) {
      let s = 0;
      for (let k = 0; k < 3; k++) for (let o = -1; o <= 1; o++) {
        const x = ex + dx * k + (dy ? o : 0), y = ey + dy * k + (dx ? o : 0);
        if (!free(x, y)) { s -= k === 0 && o === 0 ? 20 : 3; continue; }
        s += block[y * W + x] ? 0.5 : 2; // 작은 장식은 치울 수 있으니 조금만 감점
        if (onRoad(x, y)) s += 0.3;
      }
      return s;
    }
    const cand = (b) => {
      const out = [], dw = b.door && b.door.wide ? 3 : 1;
      for (let u = 1; u + dw <= b.w - 1; u++) { const ex = b.x + u + Math.floor(dw / 2), ey = b.y + b.d; out.push({ f: 'L', u, ex, ey, dx: 0, dy: 1 }); }
      for (let u = 1; u + dw <= b.d - 1; u++) { const ex = b.x + b.w, ey = b.y + u + Math.floor(dw / 2); out.push({ f: 'R', u, ex, ey, dx: 1, dy: 0 }); }
      return out;
    };
    for (const b of m.buildings) {
      if (!b.door || b.closed) continue;
      const all = cand(b).map(c => Object.assign(c, { s: score(c.ex, c.ey, c.dx, c.dy) }));
      const cur = all.find(c => c.f === b.door.f && c.u === b.door.u);
      const best = all.reduce((a, c) => (c.s > a.s + 0.01 || (Math.abs(c.s - a.s) < 0.01 && Math.abs(c.u - (b.door.f === c.f ? b.door.u : 99)) < Math.abs(a.u - (b.door.f === a.f ? b.door.u : 99))) ? c : a), all[0]);
      const pick = !cur || best.s > cur.s + 3 ? best : cur; // 지금 자리가 충분히 괜찮으면 그대로
      if (pick !== cur) { b.door = Object.assign({}, b.door, { f: pick.f, u: pick.u }); b.doorMoved = true; }
      // 문 앞 두 줄의 작은 장식 치우기
      const ex = pick.ex, ey = pick.ey;
      for (let i = decor.length - 1; i >= 0; i--) {
        const e = decor[i]; if (!SMALL.test(e[0])) continue;
        const [w, d] = size(e);
        for (let k = 0; k < 2; k++) for (let o = -1; o <= 1; o++) {
          const x = ex + pick.dx * k + (pick.dy ? o : 0), y = ey + pick.dy * k + (pick.dx ? o : 0);
          if (x >= e[1] && x < e[1] + w && y >= e[2] && y < e[2] + d && decor[i] === e) decor.splice(i, 1);
        }
      }
    }
  }
})();
