// 캐릭터 · NPC 일과 AI · 대위 행동 우선순위
'use strict';
PX.A = (() => {
  const U = PX.U, St = PX.St;
  const DIR_FLIP = [true, false, false, true];      // S E N W
  const DIR_VIEW = ['F', 'F', 'B', 'B'];

  class Actor {
    constructor(id, app, o = {}) {
      Object.assign(this, { id, app, name: o.name || id, map: o.map || null, x: o.x || 0, y: o.y || 0, z: 0, dir: 0, path: [], speed: o.speed || 3.2, pose: 'idle', seat: null, face: 'normal', t: Math.random() * 10, poseUntil: 0, tempPose: null, emote: null, emoteT: 0, big: !!app.big, blinkT: 2 + Math.random() * 3 });
    }
    setDirTo(tx, ty) { this.dir = vecDir(tx - this.x, ty - this.y, this.dir); }
    stop() { this.path = []; }
    walkPath(path, onArrive) { this.leaveSeat(); this.path = path ? path.map(([x, y]) => [x + 0.5, y + 0.5]) : []; this.onArrive = onArrive || null; if (!path) return false; if (!path.length && onArrive) { const f = onArrive; this.onArrive = null; f(); } return true; }
    goTo(m, tx, ty, onArrive, opt) {
      const tgt = PX.Path.nearestWalkable(m, tx, ty, 4);
      if (!tgt) return false;
      const p = PX.Path.find(m, Math.floor(this.x), Math.floor(this.y), tgt[0], tgt[1], opt);
      if (!p) return false;
      return this.walkPath(p, onArrive);
    }
    sitOn(seat) {
      if (seat.by && seat.by !== this.id) return false;
      this.leaveSeat();
      seat.by = this.id; this.seat = seat;
      this.x = seat.x; this.y = seat.y; this.z = seat.z; this.dir = seat.dir;
      this.pose = seat.obj.use === 'bed' ? 'lie' : 'sit';
      return true;
    }
    leaveSeat() {
      if (!this.seat) return;
      const m = PX.W.maps[this.map];
      if (this.seat.by === this.id) this.seat.by = null;
      const o = this.seat.obj;
      this.seat = null; this.z = 0;
      if (m) { // 가구 옆 칸으로 내려오기
        const a = PX.W.accessTile(m, o) || (PX.Path.nearestWalkable(m, this.x, this.y) && { x: PX.Path.nearestWalkable(m, this.x, this.y)[0], y: PX.Path.nearestWalkable(m, this.x, this.y)[1] });
        if (a) { this.x = a.x + 0.5; this.y = a.y + 0.5; }
      }
      if (this.pose === 'sit' || this.pose === 'lie') this.pose = 'idle';
    }
    doPose(p, sec, face) { this.tempPose = p; this.poseUntil = performance.now() + sec * 1000; if (face) { this.tempFace = face; } }
    showEmote(icon, sec = 2) { this.emote = icon; this.emoteT = sec; }
    update(dt) {
      this.t += dt;
      if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
      this.blinkT -= dt; if (this.blinkT < -0.15) this.blinkT = 2 + Math.random() * 4;
      if (this.tempPose && performance.now() > this.poseUntil) { this.tempPose = null; this.tempFace = null; }
      if (this.path.length) {
        const [nx, ny] = this.path[0];
        const dx = nx - this.x, dy = ny - this.y, d = Math.hypot(dx, dy);
        const sp = this.speedNow || this.speed;
        if (d < sp * dt + 0.001) { this.x = nx; this.y = ny; this.path.shift(); if (!this.path.length) { this.moving = false; if (this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); } } }
        else { this.x += dx / d * sp * dt; this.y += dy / d * sp * dt; this.dir = vecDir(dx, dy, this.dir); this.moving = true; }
      } else this.moving = this.kbMoving || false;
    }
    frameInfo() {
      let pose = this.tempPose || this.pose;
      let fr = 0;
      if (this.moving && !this.tempPose) { pose = this.holding ? (this.holdSide < 0 ? 'walkholdL' : 'walkhold') : 'walk'; fr = Math.floor(this.t * 8) % 4; }
      else if (pose === 'idle' || pose === 'stand') { pose = this.holding ? (this.holdSide < 0 ? 'holdL' : 'hold') : 'idle'; fr = Math.floor(this.t * 1.6) % 2; }
      else if (['work', 'workout', 'eat', 'wave', 'hug', 'carry', 'pat'].includes(pose)) fr = Math.floor(this.t * 3) % 2;
      let face = this.tempFace || this.face;
      if (face === 'normal' && this.blinkT < 0) face = 'sleep';
      if (pose === 'lie') face = 'sleep';
      let view = DIR_VIEW[this.dir], flip = DIR_FLIP[this.dir];
      if (pose === 'lie') { view = 'F'; flip = false; }
      const f = PX.S.get(this.app, pose, fr, view, face);
      return { c: f.c, ax: f.ax, ay: f.ay, headY: f.headY, flip };
    }
  }
  function vecDir(dx, dy, cur) {
    const sx = dx - dy, sy = dx + dy;
    if (Math.abs(sx) < 0.001 && Math.abs(sy) < 0.001) return cur;
    if (sy > 0.001) return sx >= 0 ? 1 : 0;
    if (sy < -0.001) return sx >= 0 ? 2 : 3;
    return sx > 0 ? 1 : 0;
  }

  // ---------- 일정 ----------
  const schedCache = {};
  function parseSched(str) {
    if (schedCache[str]) return schedCache[str];
    const out = str.split('|').map(s => { const [hm, spot] = s.trim().split(' '); return { min: PX.Cal.toMin(hm), spot }; }).sort((a, b) => a.min - b.min);
    schedCache[str] = out;
    return out;
  }
  function schedEntry(npc, S) {
    const we = St.isWeekend();
    let str = we && npc.we ? npc.we : npc.sched;
    if (!we && npc.sched2 && S.day % 2 === 1) str = npc.sched2;
    const list = parseSched(str);
    const min = S.time.min;
    let cur = list[list.length - 1]; // 자정 넘김: 전날 마지막 항목
    for (const e of list) if (e.min <= min) cur = e;
    return cur;
  }
  // 스폿 색인 (모든 맵)
  let spotIndex = null;
  function indexSpots() {
    spotIndex = {};
    for (const id in PX.MAPS) { const m = PX.W.build(id); for (const k in m.spots) spotIndex[k] = { map: id, s: m.spots[k] }; }
    return spotIndex;
  }
  const spot = name => (spotIndex || indexSpots())[name] || null;

  // 맵 입구 (NPC가 나타나는 곳)
  function entryPoint(mapId, fromMap) {
    const m = PX.W.maps[mapId];
    if (m.kind === 'in') return { x: m.exit.x + 0.5, y: m.exit.y - 0.5 };
    if (fromMap) {
      const d = m.doors.find(d => d.to === fromMap); if (d) return { x: d.x + 0.5, y: d.y + 0.5 };
      const fromOut = PX.MAPS[fromMap].kind === 'out' ? fromMap : PX.MAPS[fromMap].parent;
      const l = (m.links || []).find(l => l.to === fromOut); if (l) return { x: l.ax2 != null ? l.ax2 : (l.x0 + l.x1) / 2 + 0.5, y: l.y0 + (l.y0 === 0 ? 1.5 : -0.5) };
    }
    return mapId === 'base' ? { x: 31.5, y: 59.5 } : mapId === 'plaza' ? { x: 25.5, y: 47.5 } : { x: 23.5, y: 40.5 };
  }
  // 이 맵에서 목적지 맵으로 나가는 곳
  function exitPoint(m, toMap) {
    if (m.kind === 'in') return { x: m.exit.x, y: m.exit.y };
    const d = m.doors.find(d => d.to === toMap);
    if (d) return { x: d.x, y: d.y };
    const toOut = toMap ? (PX.MAPS[toMap].kind === 'out' ? toMap : PX.MAPS[toMap].parent) : null;
    const l = (m.links || []).find(l => l.to === toOut); if (l) return { x: Math.floor((l.x0 + l.x1) / 2), y: l.y0 };
    return m.id === 'base' ? { x: 31, y: 60 } : m.id === 'plaza' ? { x: 25, y: 51 } : { x: 23, y: 41 };
  }

  // ---------- NPC ----------
  class NPC extends Actor {
    constructor(def) {
      super(def.id, def.look, { name: def.name, speed: 2.8 + (U.hash(def.id) % 10) / 20 });
      this.def = def;
      this.target = null; this.leaving = null;
    }
    // 현재 일정 목적지
    desired(S) {
      const e = schedEntry(this.def, S);
      if (e.spot === '-' || e.spot === 'field' || e.spot === 'free') return { kind: e.spot, map: null };
      const sp = spot(e.spot);
      if (!sp) return { kind: '-', map: null };
      return { kind: 'spot', map: sp.map, s: sp.s, name: e.spot };
    }
    // 플레이어가 맵에 들어왔을 때 즉시 배치
    place(S) {
      const d = this.desired(S);
      this.stop(); this.leaveSeat();
      if (!d.map) { this.map = null; return; }
      this.map = d.map; this.arrive(d);
    }
    arrive(d) {
      const s = d.s;
      if (s.seat) { if (!this.sitOn(s.seat)) { this.x = s.x; this.y = s.y + 0.6; this.pose = 'idle'; this.unstick(); } }
      else { this.x = s.x; this.y = s.y; this.dir = s.dir; this.pose = s.pose === 'stand' ? 'idle' : s.pose; }
      this.atSpot = d.name;
    }
    // 지금 하고 있는 일 → 상황별 대사 고르기에 쓴다
    activity() {
      if (!this.map) return null;
      const sp = this.atSpot || '', m = this.map, pose = this.tempPose || this.pose;
      if (pose === 'lie') return 'sleep';
      if (this.path.length || this.wandering) return PX.MAPS[m].kind === 'out' ? 'stroll' : (m === 'mess' ? 'eat' : 'rest');
      if (pose === 'workout' || m === 'gym' || sp.startsWith('base.train')) return 'workout';
      if (sp.startsWith('mess.cook')) return 'cook';
      if (m === 'mess' && this.seat) return 'eat';
      if (sp === 'sg.boss') return 'grill';
      if (/clerk|barista/.test(sp) || sp === 'plaza.kiosk') return 'shop';
      if (sp === 'base.gate' || sp === 'base.gate2') return 'guard';
      if (sp === 'adm.cmd') return 'work_cmd';
      const work = { med: 'work_med', ops: 'work_ops', hangar: 'work_hangar', lab: 'work_lab', comms: 'work_comms', admin: 'work_admin' }[m];
      if (work && !(m === 'hangar' && sp === 'hg.rest')) return work;
      if (sp === 'lng.arcade' || sp.startsWith('lng.g') || m === 'arcade') return 'game';
      if (m === 'cafe') return 'cafe';
      if (m === 'lounge' || m === 'barracks' || this.seat) return 'rest';
      return PX.MAPS[m].kind === 'out' ? 'stroll' : 'rest';
    }
    // 자리 근처를 잠깐 거닐다 돌아온다 (앉아 있거나 운동·계산대 근무 중이면 제자리)
    maybeWander(d) {
      const now = performance.now();
      if (!this.nextWander) { this.nextWander = now + 4000 + Math.random() * 12000; return; }
      if (now < this.nextWander) return;
      this.nextWander = now + 6000 + Math.random() * 14000;
      const sp = d.name || '';
      if (this.seat || /clerk|barista|boss|cook/.test(sp) || ['workout', 'work', 'lie', 'sit', 'eat'].includes(this.pose)) return;
      const m = PX.W.maps[this.map];
      if (this.wandering) { this.wandering = false; this.headTo(d); return; }
      const R = m.kind === 'out' ? 5 : 3;
      for (let k = 0; k < 8; k++) {
        const tx = Math.floor(d.s.x + (Math.random() * 2 - 1) * R), ty = Math.floor(d.s.y + (Math.random() * 2 - 1) * R);
        if (!PX.W.walkable(m, tx, ty)) continue;
        const p = PX.Path.find(m, Math.floor(this.x), Math.floor(this.y), tx, ty);
        if (p && p.length && p.length <= R * 2) { this.speedNow = this.speed * 0.75; this.wandering = true; this.walkPath(p, () => { this.speedNow = 0; this.pose = 'idle'; }); return; }
      }
    }
    unstick() { const m = PX.W.maps[this.map]; const t = PX.Path.nearestWalkable(m, this.x, this.y); if (t) { this.x = t[0] + 0.5; this.y = t[1] + 0.5; } }
    think(S, playerMap) {
      if (this.busy) return;
      const d = this.desired(S);
      const visible = this.map === playerMap;
      if (!visible) { // 보이지 않으면 순간이동
        if (d.map === playerMap && this.map !== playerMap) { // 플레이어 맵으로 들어옴 → 입구에서 걸어 들어온다
          const from = this.map;
          this.stop(); this.leaveSeat();
          this.map = playerMap;
          const ep = entryPoint(playerMap, from && PX.MAPS[from] && PX.MAPS[from].kind === 'in' ? from : null);
          this.x = ep.x; this.y = ep.y; this.pose = 'idle'; this.atSpot = null;
          this.headTo(d);
        } else if (this.map !== d.map || this.atSpot !== d.name) { this.stop(); this.leaveSeat(); this.map = d.map; if (d.map) this.arrive(d); }
        return;
      }
      if (this.path.length) return;
      if (d.map === this.map) { if (this.atSpot !== d.name) { this.wandering = false; this.headTo(d); } else if (d.kind === 'spot') this.maybeWander(d); return; }
      // 다른 맵으로 가야 함 → 출구로 걸어가서 사라짐
      const m = PX.W.maps[this.map];
      const target = d.map ? (PX.MAPS[d.map].kind === 'in' && PX.MAPS[d.map].parent === this.map ? d.map : (m.kind === 'in' ? m.def.parent : d.map)) : null;
      const ep = exitPoint(m, target);
      this.atSpot = null;
      if (!this.goTo(m, ep.x, ep.y, () => { this.map = d.map; this.atSpot = null; if (d.map) { if (d.map !== playerMap) this.arrive(d); } }, { allow: (x, y) => x === ep.x && y === ep.y })) { this.map = d.map; if (d.map) this.arrive(d); }
    }
    headTo(d) {
      const m = PX.W.maps[this.map];
      const s = d.s;
      let tx = s.x, ty = s.y;
      if (s.seat) { const a = PX.W.accessTile(m, s.obj); if (a) { tx = a.x + 0.5; ty = a.y + 0.5; } }
      const ok = this.goTo(m, Math.floor(tx), Math.floor(ty), () => this.arrive(d));
      if (!ok) this.arrive(d);
    }
  }

  return { Actor, NPC, vecDir, schedEntry, parseSched, spot, indexSpots, entryPoint, exitPoint };
})();
