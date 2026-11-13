// 벽 장식 자리 정리: 키 큰 가구(냉장고·거치대·자판기 …) 뒤에 가려지는 창문·포스터·화면을 빈 벽으로 옮긴다
'use strict';
(() => {
  const F = PX.FURN;
  for (const id in PX.MAPS) {
    const m = PX.MAPS[id];
    if (m.kind !== 'in' || !m.walls) continue;
    const cover = { B: [], L: [] };
    for (const f of m.furn || []) {
      const d = F[f[0]]; if (!d) continue;
      const tall = Math.max(0, ...(d.parts || []).map(p => p[2] + p[5]));
      if (tall < 26 || f[0] === 'sink') continue; // 세면대 위 거울은 원래 자리
      const rot = f[3] || 0, fw = rot % 2 ? d.d : d.w, fd = rot % 2 ? d.w : d.d;
      if (f[2] === 0) cover.B.push([f[1], f[1] + fw]);
      if (f[1] === 0) cover.L.push([f[2], f[2] + fd]);
    }
    const hit = (list, a, b, pad = 0.15) => list.some(([x0, x1]) => a < x1 - pad && b > x0 + pad);
    const out = [];
    for (const w of m.walls) {
      const [side, pos, type, width = 1] = w, lim = side === 'B' ? m.w : m.h;
      const taken = out.filter(o => o[0] === side).map(o => [o[1], o[1] + (o[3] || 1)]);
      if (!hit(cover[side], pos, pos + width) && !hit(taken, pos, pos + width, 0)) { out.push(w); continue; }
      let best = null;
      for (let p = 0.4; p + width <= lim - 0.4; p += 0.2) {
        if (hit(cover[side], p, p + width) || hit(taken, p - 0.2, p + width + 0.2, 0)) continue;
        if (best == null || Math.abs(p - pos) < Math.abs(best - pos)) best = p;
      }
      if (best != null) out.push([side, Math.round(best * 10) / 10, type, width]);
      // 자리가 없으면 그 장식은 뺀다 (가구 뒤에 반만 보이는 것보다 낫다)
    }
    m.walls = out;
  }
})();
