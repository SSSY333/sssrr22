// A* 길찾기 (8방향, 모서리 끼어 지나가기 금지)
'use strict';
PX.Path = (() => {
  function find(m, sx, sy, tx, ty, opt = {}) {
    const W = m.w, H = m.h, walk = m.walk;
    const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (walk[y * W + x] === 1 || (opt.allow && opt.allow(x, y)));
    sx |= 0; sy |= 0; tx |= 0; ty |= 0;
    if (!ok(tx, ty)) return null;
    if (sx === tx && sy === ty) return [];
    const N = W * H;
    const g = new Float32Array(N).fill(Infinity), f = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const heap = [];
    const push = i => { heap.push(i); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (f[heap[p]] <= f[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let s = k; if (l < heap.length && f[heap[l]] < f[heap[s]]) s = l; if (r < heap.length && f[heap[r]] < f[heap[s]]) s = r; if (s === k) break; [heap[s], heap[k]] = [heap[k], heap[s]]; k = s; } } return top; };
    const hfn = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    const si = sy * W + sx, ti = ty * W + tx;
    g[si] = 0; f[si] = hfn(sx, sy); push(si);
    let iter = 0;
    while (heap.length && iter++ < 20000) {
      const cur = pop();
      if (cur === ti) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % W, cy = (cur / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!ok(nx, ny)) continue;
        if (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy))) continue;
        const ni = ny * W + nx;
        if (closed[ni]) continue;
        const ng = g[cur] + (dx && dy ? 1.414 : 1);
        if (ng < g[ni]) { g[ni] = ng; f[ni] = ng + hfn(nx, ny); from[ni] = cur; push(ni); }
      }
    }
    if (from[ti] < 0) return null;
    const out = [];
    for (let i = ti; i !== si; i = from[i]) out.push([i % W, (i / W) | 0]);
    out.reverse();
    return out;
  }
  // 목표 칸이 막혀 있으면 가장 가까운 걸을 수 있는 칸
  function nearestWalkable(m, tx, ty, maxR = 6) {
    tx |= 0; ty |= 0;
    if (PX.W.walkable(m, tx, ty)) return [tx, ty];
    for (let r = 1; r <= maxR; r++) {
      let best = null, bd = 1e9;
      for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
        if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r) continue;
        if (!PX.W.walkable(m, x, y)) continue;
        const d = Math.hypot(x - tx, y - ty);
        if (d < bd) { bd = d; best = [x, y]; }
      }
      if (best) return best;
    }
    return null;
  }
  // 두 칸이 이어져 있는가 (BFS) — 검증용
  function reachableSet(m, sx, sy) {
    const seen = new Uint8Array(m.w * m.h), q = [[sx, sy]];
    if (!PX.W.walkable(m, sx, sy)) return seen;
    seen[sy * m.w + sx] = 1;
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (PX.W.walkable(m, nx, ny) && !seen[ny * m.w + nx]) { seen[ny * m.w + nx] = 1; q.push([nx, ny]); }
      }
    }
    return seen;
  }
  return { find, nearestWalkable, reachableSet };
})();
