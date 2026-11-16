// 춤: 대위와 마주 보고 무대에서 실제로 움직인다 (돌기 · 흔들기 · 허리 감싸기 · 손 들어 한 바퀴 · 들어 올리기 · 꼭 안고 흔들기)
// 대사는 춤추는 동안 함께 흐른다.
'use strict';
PX.Dance = (() => {
  const G = () => PX.Game;
  // 스텝: hand 손잡고 · waist 허리 감싸고 돌기 · spin 손 들어 나를 한 바퀴 · lift 들어 올려 돌기 · hug 꼭 안고 흔들기 · bounce 신나게 들썩
  const SPEED = { hand: 0.55, waist: 0.95, spin: 0.35, lift: 1.7, hug: 0.22, bounce: 0.7 };
  const RAD = { hand: 0.5, waist: 0.3, spin: 0.55, lift: 0.26, hug: 0.27, bounce: 0.72 };
  function center() {
    const g = G(), m = PX.W.maps[g.mapId];
    const fl = m && m.objs.find(o => o.fid === 'dancefloor') || m && m.objs.find(o => /^rug/.test(o.fid || ''));
    if (fl) return { x: fl.x + (fl.fw || 3) / 2, y: fl.y + (fl.fd || 3) / 2 };
    return { x: (g.player.x + g.cap.x) / 2, y: (g.player.y + g.cap.y) / 2 };
  }
  function run(steps) {
    const g = G(), p = g.player, c = g.cap, ctr = center();
    p.leaveSeat(); c.leaveSeat(); if (c.stop) c.stop(); if (p.stop) p.stop();
    if (PX.Mind) PX.Mind.setContact('NONE');
    const total = steps.reduce((a, s) => a + s.d, 0);
    let ang = Math.atan2(c.y - ctr.y, c.x - ctr.x) || 0, t0 = performance.now(), last = t0, rr = 0.5;
    return new Promise((res) => {
      const f = (now) => {
        const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (t >= total || g.mapId !== c.map) { end(); res(); return; }
        let acc = 0, s = steps[steps.length - 1];
        for (const x of steps) { if (t < acc + x.d) { s = x; break; } acc += x.d; }
        const lt = t - acc;
        ang += dt * (SPEED[s.k] || 0.5);
        rr += (RAD[s.k] - rr) * Math.min(1, dt * 3); // 거리는 부드럽게 좁혀지고 벌어진다
        const sway = Math.sin(t * 2.2) * 0.05, beat = Math.abs(Math.sin(t * Math.PI * 1.6));
        c.x = ctr.x + Math.cos(ang) * rr + sway; c.y = ctr.y + Math.sin(ang) * rr;
        p.x = ctr.x - Math.cos(ang) * rr + sway; p.y = ctr.y - Math.sin(ang) * rr;
        c.path = []; p.path = []; c.moving = false; p.moving = false;
        c.setDirTo(p.x, p.y); p.setDirTo(c.x, c.y);
        c.z = 0; p.z = 0;
        switch (s.k) {
          case 'hand': c.tempPose = 'hold'; p.tempPose = 'holdL'; p.z = beat * 0.05; break;
          case 'waist': c.tempPose = 'hug'; p.tempPose = 'hug'; p.z = beat * 0.03; break;
          case 'spin': c.tempPose = 'wave'; p.tempPose = 'wave'; p.dir = Math.floor(lt * 7) % 4; p.z = beat * 0.08; break;
          case 'lift': c.tempPose = 'carry'; p.tempPose = 'hug'; p.z = 0.28 + Math.sin(lt * 3) * 0.05; break;
          case 'hug': c.tempPose = 'hug'; p.tempPose = 'hug'; break;
          case 'bounce': c.tempPose = Math.floor(t * 2) % 2 ? 'wave' : null; p.tempPose = Math.floor(t * 2 + 1) % 2 ? 'wave' : null; c.z = beat * 0.1; p.z = beat * 0.12; break;
        }
        c.poseUntil = p.poseUntil = performance.now() + 250;
        if (Math.random() < dt * 0.7) (Math.random() < 0.5 ? c : p).showEmote(s.k === 'bounce' ? 'note' : 'heart', 0.9);
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });
    function end() {
      p.tempPose = c.tempPose = null; p.z = c.z = 0;
      if (PX.Mind) { PX.Mind.mem().danceAt = PX.St.absMin(); PX.Mind.noteMeet && PX.Mind.noteMeet(); }
      const m = PX.W.maps[g.mapId];
      for (const a of [p, c]) if (m && !PX.W.walkable(m, Math.floor(a.x), Math.floor(a.y))) { const w = PX.Path.nearestWalkable(m, a.x, a.y); if (w) { a.x = w[0] + 0.5; a.y = w[1] + 0.5; } }
      c.setDirTo(p.x, p.y); p.setDirTo(c.x, c.y);
    }
  }
  // 춤추면서 대사 (대사가 먼저 끝나도 춤은 끝까지, 춤이 먼저 끝나도 대사는 끝까지)
  async function withLines(steps, lines) {
    const g = G(); g.modal++;
    try { await Promise.all([run(steps), PX.Dlg.runLines(lines, { reply: true })]); }
    finally { PX.Dlg.close(); g.modal--; }
  }
  return { run, withLines, center };
})();
