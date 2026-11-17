// 실내 입구 앞 통로 비우기: 들어오면 바로 직진할 수 있게
// 출구 칸 + 그 앞 두 줄(출구 좌우 한 칸씩) + 세 번째 줄 가운데에 걸친 가구는 가장 가까운 빈자리로 옮긴다
'use strict';
(() => {
  const M = PX.MAPS, F = PX.FURN;
  const size = (e) => { const f = F[e[0]]; if (!f) return null; return e[3] % 2 ? [f.d, f.w] : [f.w, f.d]; };
  const hit = (ax, ay, aw, ad, bx, by, bw, bd) => ax < bx + bw && bx < ax + aw && ay < by + bd && by < ay + ad;
  for (const id in M) {
    const m = M[id]; if (m.kind !== 'in' || !Array.isArray(m.furn) || m.exit == null) continue;
    const W = m.w, H = m.h, ex = m.exit, ey = H - 1;
    const zone = [[ex - 1, ey - 2, 3, 3], [ex, ey - 3, 1, 1]]; // [x, y, w, d]
    const inZone = (x, y, w, d) => zone.some(z => hit(x, y, w, d, z[0], z[1], z[2], z[3]));
    const solid = m.furn.filter(e => e[0] !== '@' && F[e[0]] && F[e[0]].blocks !== false);
    for (const e of solid) {
      const sz = size(e); if (!sz) continue;
      const [w, d] = sz;
      if (!inZone(e[1], e[2], w, d)) continue;
      const free = (x, y) => x >= 0 && y >= 0 && x + w <= W && y + d <= H && !inZone(x, y, w, d) && !solid.some(o => o !== e && size(o) && hit(x, y, w, d, o[1], o[2], ...size(o)));
      let best = null;
      for (let dy = 0; dy >= -5 && !best; dy--) for (let k = 1; k <= 8 && !best; k++) for (const dx of [-k, k]) { const x = e[1] + dx, y = e[2] + dy; if (free(x, y)) { best = [x, y]; break; } }
      if (best) { e[1] = best[0]; e[2] = best[1]; }
    }
  }
})();
