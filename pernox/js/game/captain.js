// 대위 행동: 근무 우선 → 근무 후 플레이어 찾기 → 동행 / 숙소 앞 기다리기 → 방문 · 숙박 요청
// 원칙: 작전·근무 중엔 나타나지 않는다. 잠든 플레이어 숙소에 들어가지 않는다. 거절하면 물러난다.
'use strict';
PX.Cap = (() => {
  const U = PX.U, St = PX.St, A = PX.A;
  let cap = null;
  let mode = 'sched'; // sched | seek | follow | wait_door | visit | stay | travel
  let waitOut = null; // 샤워실처럼 대위가 못 들어가는 곳: 밖에서 기다리는 자리
  let sitT = 0, thinkT = 0, repathT = 0, travelUntil = 0, travelTo = null, lastSkinReq = 0, knockedToday = -1, lastMsgCheck = 0;
  const G = () => PX.Game;

  function init(actor) { cap = actor; mode = 'sched'; }
  // 휴가 중이면 주말 일정으로 지낸다
  const capDefNow = () => { const S = St.S; return PX.Rom && PX.Rom.onLeave('cap', S.day) ? Object.assign({}, PX.NPC_BY_ID.cap, { sched: PX.NPC_BY_ID.cap.we, sched2: null }) : PX.NPC_BY_ID.cap; };
  const entry = () => A.schedEntry(capDefNow(), St.S);
  function spotKind(e = entry()) {
    if (e.spot === 'field') return 'field';
    if (e.spot === 'free') return 'free';
    if (e.spot === 'cap.bed') return 'sleep';
    if (e.spot.startsWith('mess')) return 'meal';
    if (e.spot.startsWith('cap.')) return 'rest';
    return 'duty';
  }
  const onDuty = () => ['duty', 'field'].includes(spotKind());
  const isMeal = () => spotKind() === 'meal';
  const homeId = () => PX.JOBS[St.S.player.job].home;
  function atPlayerWork() {
    const j = PX.JOBS[St.S.player.job];
    return cap.map === j.work && G().mapId === j.work;
  }
  function status() {
    const O = PX.Op && PX.Op.op();
    if (O && O.phase === 'away') return O.joint ? '합동작전 중 (함께)' : '장기작전 중';
    if (O && O.phase === 'return') return { '부대 도착': '부대 도착', '복귀 보고': '작전 복귀 보고 중', '장비 반납': '장비 반납 중', '의료 확인': '복귀 검진 중', '샤워·환복': '씻는 중', '찾아가기': '나를 찾는 중' }[O.retStep] || '작전 복귀 중';
    if (mode === 'date') return '약속 장소에서 기다리는 중';
    if (mode === 'waitOut') return '밖에서 기다리는 중';
    if (mode === 'paused') return '그 자리에서 기다리는 중';
    if (mode === 'follow') return cap.holding ? '손잡고 동행 중' : '동행 중';
    if (mode === 'visit') return '내 숙소 방문 중';
    if (mode === 'stay') return '내 숙소에서 쉬는 중';
    if (mode === 'wait_door') return '숙소 앞에서 기다리는 중';
    if (mode === 'travel') return '이동 중';
    if (mode === 'seek') return '나를 찾는 중';
    const e = entry(), k = spotKind(e);
    if (k === 'field') return '외곽 수색 중';
    if (k === 'sleep') return St.S.time.min >= 6 * 60 && St.S.time.min < 8 * 60 ? '기상 준비 중' : '취침 중';
    if (k === 'meal') return '식사 중';
    if (k === 'free') return '개인 시간';
    if (e.spot.startsWith('gym') || e.spot === 'cap.gym') return '체력 단련 중';
    if (e.spot === 'ops.b1') return '작전 브리핑 중';
    if (e.spot === 'med.patient') return '복귀 검진 중';
    if (e.spot.startsWith('hg')) return '장비 점검 중';
    if (e.spot === 'cap.craft') return '장비 개조 중';
    if (e.spot.startsWith('cap.sofa')) return '막사에서 휴식 중';
    return '근무 중';
  }
  function playerAvailable() {
    const S = St.S, g = G();
    if (g.sleeping || g.inMini) return false;
    if (S.rel.cap.noFollowUntil > St.absMin()) return false;
    if (S.time.min >= 23 * 60 || S.time.min < 6 * 60 + 30) return false;
    return true;
  }
  // 대위를 다른 맵으로 옮김 (보이지 않는 이동)
  function moveTo(mapId, fromMap) {
    cap.stop(); cap.leaveSeat(); cap.holding = false;
    cap.map = mapId;
    if (!mapId) return;
    const ep = A.entryPoint(mapId, fromMap);
    cap.x = ep.x; cap.y = ep.y; cap.pose = 'idle';
    const m = PX.W.maps[mapId];
    if (m.kind === 'in' && G().mapId === mapId) bump(m);
  }
  function bump(m) {
    if (Math.random() < (m.def.lowDoor ? 0.6 : 0.25)) {
      setTimeout(() => { cap.doPose('bump', 1.1, 'surprise'); cap.showEmote('stars', 1.6); G().bubble(cap, U.pick(['아야.', '…또 박았네.', '이 문틀 누가 이렇게 낮게 만들었어.'])); }, 250);
    }
  }
  function release(line, partMins = 30) { const was = mode === 'follow' || mode === 'visit' || mode === 'stay' || mode === 'waitOut'; if (mode === 'follow' || mode === 'visit' || mode === 'stay' || mode === 'seek' || mode === 'wait_door' || mode === 'waitOut') mode = 'sched'; if (PX.Mind) { PX.Mind.mem().contact = 'NONE'; PX.Mind.apply(); if (was) PX.Mind.notePart(partMins); } cap.holding = false; G().player.holding = false; St.S.cap.follow = false; waitOut = null; if (line) G().bubble(cap, line); }

  // ---------- 매 프레임 ----------
  function update(dt) {
    if (!cap) return;
    const S = St.S, g = G(), p = g.player;
    // 동행 중 따라가기 (프레임 단위)
    if (mode === 'follow' && cap.map === g.mapId && !g.modal) {
      const d = U.dist(cap.x, cap.y, p.x, p.y);
      cap.speedNow = Math.max(cap.speed, p.speedNow || p.speed) * (d > 3 ? 1.35 : 1);
      repathT -= dt;
      if (cap.holding && d < 2.2) {
        // 손잡기: 플레이어 옆자리
        const m = PX.W.maps[cap.map];
        const ox = p.x + 0.55, oy = p.y - 0.55;
        if (PX.W.walkable(m, Math.floor(ox), Math.floor(oy))) { cap.path = []; const k = Math.min(1, dt * 10); cap.x += (ox - cap.x) * k; cap.y += (oy - cap.y) * k; cap.dir = p.dir; cap.moving = p.moving; }
        else if (repathT <= 0) { repathT = 0.4; cap.goTo(m, Math.floor(p.x), Math.floor(p.y)); }
        cap.holdSide = -1; p.holdSide = 1;
      } else if (cap.seat || (cap.toSeat && cap.path.length)) {
        // 앉아 있거나 자리로 가는 중엔 따라가기를 멈춘다
      } else if (d > 1.9 && repathT <= 0) {
        repathT = 0.35;
        const m = PX.W.maps[cap.map];
        const bx = p.x - Math.sign(p.x - cap.x) * 0.9, by = p.y - Math.sign(p.y - cap.y) * 0.9;
        cap.goTo(m, Math.floor(bx), Math.floor(by));
        if (cap.path.length > 1) cap.path.pop(); // 바로 옆까진 안 붙음
      } else if (d < 1.2 && cap.path.length) cap.stop();
      else if (d < 0.6 && !cap.path.length && !p.moving && repathT <= 0) { repathT = 0.5; const m = PX.W.maps[cap.map]; const t = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => [Math.floor(p.x) + dx, Math.floor(p.y) + dy]).find(([x, y]) => PX.W.walkable(m, x, y)); if (t) cap.goTo(m, t[0], t[1]); }
      if (d > 14 && repathT <= 0) { const t = PX.Path.nearestWalkable(PX.W.maps[cap.map], p.x - 1, p.y - 1); if (t) { cap.x = t[0] + 0.5; cap.y = t[1] + 0.5; } } // 끼임 방지
      if (!cap.path.length && !cap.holding && d < 2.5 && !cap.seat) cap.setDirTo(p.x, p.y);
      // 플레이어가 앉으면 옆자리, 일어나면 같이 일어난다
      if (p.seat && !cap.seat && !cap.path.length && sitT <= 0) { sitT = 2; sitNear(g); }
      if (!p.seat && cap.seat) cap.leaveSeat();
      sitT -= dt;
    }
    thinkT -= dt;
    if (thinkT > 0) return;
    thinkT = 0.5;
    think(S, g);
  }

  function think(S, g) {
    const now = St.absMin();
    // 장기작전: 떠나 있는 동안은 나타나지 않는다 (함께 투입된 경우만 동행) · 복귀 절차 중엔 절차부터
    const O = PX.Op && PX.Op.op();
    if (O && O.phase === 'away' && !O.joint) { if (mode !== 'op') { cap.map = null; mode = 'op'; } return; }
    if (O && O.phase === 'away' && O.joint) { if (mode !== 'follow' && cap.map === g.mapId) mode = 'follow'; if (mode === 'follow' && cap.map !== g.mapId && !g.transition) followIntoMap(); return; }
    if (mode === 'op') mode = 'sched';
    if (mode === 'date') { const d = PX.Rom && PX.Rom.nextDate(); if (!d || d.state !== 'planned') mode = 'sched'; else { cap.stop(); return; } }
    if (O && O.phase === 'return') { mode = 'sched'; schedule(S, g); return; }
    const k = spotKind();
    const r = S.rel.cap;
    // 이동 중 (보이지 않음)
    if (mode === 'travel') { if (now >= travelUntil) { mode = travelTo.mode; moveTo(travelTo.map, travelTo.from); } return; }
    // 숙박
    if (mode === 'stay') {
      if (S.time.min >= 7 * 60 + 30 && S.time.min < 20 * 60 && !g.modal) { // 아침 먹으러 간다
        release(); S.cap.stay = false; g.bubble(cap, '나 아침 먹고 근무 간다. 이따 봐.');
      }
      return;
    }
    if (mode === 'visit') {
      if (g.mapId !== homeId() || k === 'duty' || k === 'field') { release(); return; }
      if (S.cap.visitShort && now > S.cap.visitShort && !g.modal) { S.cap.visitShort = 0; g.trigger(async () => { g.modal++; await PX.Dlg.runLines(U.pick([['C:차 잘 마셨어. 약속대로 한 잔만.', 'C^:…한 잔 더는 다음에.'], ['C:한 시간 됐다. 약속은 지켜야지.', 'C*:붙잡으면 못 이기는 척 있을게.']])); const i = await PX.Dlg.choose([{ t: '조심히 가요.' }, { t: '조금만 더 있다 가요.' }]); PX.Dlg.close(); g.modal--; if (i === 0) { const m = PX.W.maps[g.mapId]; cap.leaveSeat(); release(null, 60); cap.goTo(m, m.exit.x, m.exit.y, () => moveTo(m.def.parent, m.id), { allow: (x, y) => x === m.exit.x && y === m.exit.y }); } }); return; }
      if (S.cap.cohab && S.time.min >= 22 * 60 && !g.modal) { S.cap.stay = 'bed'; mode = 'stay'; return; } // 같이 사는 사이: 묻지 않고 함께 잔다
      if (S.time.min >= 22 * 60 && !g.modal) g.trigger(nightCheck);
      return;
    }
    if (mode === 'paused') { if (k === 'duty' || k === 'field' || St.absMin() > pausedUntil) { release(); } return; }
    if (mode === 'waitOut') { if (k === 'duty' || k === 'field' || St.absMin() > (waitOut ? waitOut.until : 0)) { release(); return; } waitOutTick(); return; }
    // 동행 해제 조건: 근무·작전 시간
    if (mode === 'follow') {
      if (k === 'duty' || k === 'field') { release(); g.trigger(async () => { await PX.Dlg.say('cap', U.pick(['나 근무 들어가야 돼. 끝나고 찾아갈게.', '브리핑 시간이다. 이따 보자. 도망가지 마.', '작전 나간다. 금방 올게.'])); PX.Dlg.close(); }); return; }
      if (k === 'sleep' && S.time.min >= 23 * 60 + 30) { release('늦었다. 잘 자, ' + U.josa(U.givenName(S.player.name), '아') + '.'); return; }
      if (cap.map !== g.mapId && !g.transition) followIntoMap();
      // 가끔 스킨십 요청
      if (!(PX.Mind && now - (PX.Mind.mem().joinAt || -1e9) < 25) && !g.player.seat && r.stage >= 2 && r.backoffUntil < now && now - lastSkinReq > 40 && Math.random() < 0.08 && !g.modal && PX.Mind && PX.Mind.contact() === 'NONE' || (PX.Mind && r.stage >= 3 && PX.Mind.isWalk() && now - lastSkinReq > 60 && Math.random() < 0.04 && !g.modal && r.backoffUntil < now)) { lastSkinReq = now; g.trigger(() => PX.Mind.capAsk()); }
      return;
    }
    if (mode === 'wait_door') {
      if (g.mapId !== homeId()) { // 플레이어가 나왔다
        mode = 'seek';
      } else if (knockedToday !== S.day && !g.modal) { knockedToday = S.day; g.trigger(knock); }
      if (k !== 'free' || !playerAvailable()) release();
      return;
    }
    // 자유 시간: 플레이어 찾기
    const free = k === 'free' || (k === 'meal' && g.mapId === 'mess');
    if (free && playerAvailable() && r.lastApproachDay !== S.day + 0.5) {
      if (mode !== 'seek') mode = 'seek';
      seek(S, g, now);
      return;
    }
    if (mode === 'seek') mode = 'sched';
    // 식당: 플레이어가 앉아 있으면 옆자리 차지
    if (k === 'meal' && g.mapId === 'mess' && cap.map === 'mess' && g.player.seat && !cap.path.length) {
      if (!cap.seat || U.dist(cap.seat.x, cap.seat.y, g.player.x, g.player.y) > 1.6) { if (sitNear(g)) { cap.busy = true; return; } }
      else { cap.busy = true; if (S.cap.mealTalk !== S.day + ':' + Math.floor(S.time.min / 300) && !g.modal) { S.cap.mealTalk = S.day + ':' + Math.floor(S.time.min / 300); g.trigger(() => PX.Dlg.capTalk(S.time.min < 11 * 60 ? 'morning' : S.time.min < 15 * 60 ? 'lunch' : 'offwork')); } return; }
    }
    cap.busy = false;
    schedule(S, g);
  }

  // 일정 따라가기 (NPC와 같은 방식)
  function schedule(S, g) {
    if (!cap.def) cap.def = PX.NPC_BY_ID.cap;
    const e = entry();
    const ov = PX.Op && PX.Op.schedOverride();
    if (ov) { cap.def = Object.assign({}, PX.NPC_BY_ID.cap, { sched: ov, we: ov, sched2: null }); cap.think(S, g.mapId); return; }
    if (e.spot === 'free') { // 개인 시간인데 플레이어가 혼자 있고 싶어함 → 막사
      cap.def = Object.assign({}, PX.NPC_BY_ID.cap, { sched: '00:00 cap.sofa', we: '00:00 cap.sofa', sched2: null });
    } else cap.def = capDefNow();
    cap.think(S, g.mapId);
  }

  function seek(S, g, now) {
    const pm = g.mapId, home = homeId();
    const r = S.rel.cap;
    // 연구원은 돔시티에 산다: 화·목·토 저녁에만 돔시티로 찾아간다
    const job = PX.JOBS[S.player.job];
    const pmOut = PX.MAPS[pm].kind === 'out' ? pm : PX.MAPS[pm].parent;
    const capOut = cap.map ? (PX.MAPS[cap.map].kind === 'out' ? cap.map : PX.MAPS[cap.map].parent) : null;
    if (pmOut === 'dome' && !job.military) { const wd = St.weekday(); if (![2, 4, 6].includes(wd)) { mode = 'sched'; schedule(S, g); return; } }
    if (!['base', 'dome', 'plaza'].includes(pmOut)) { mode = 'sched'; schedule(S, g); return; } // 멀리 나가 있으면 찾아가지 않는다
    if (capOut !== pmOut) { // 다른 구역: 셔틀로 이동
      const near = ['dome', 'plaza'].includes(pmOut) && ['dome', 'plaza'].includes(capOut);
      travel(pmOut, near ? 6 : 30, 'seek', capOut);
      return;
    }
    if (pm === home) { // 숙소 안: 문 앞까지만
      if (cap.map !== pmOut) { exitTo(pmOut); return; }
      const door = PX.W.maps[pmOut].doors.find(d => d.to === home);
      if (U.dist(cap.x, cap.y, door.x + 0.5, door.y + 0.5) > 1.2) { if (!cap.path.length) cap.goTo(PX.W.maps[pmOut], door.x, door.y); }
      else { mode = 'wait_door'; cap.dir = 2; }
      return;
    }
    if (cap.map !== pm) {
      if (PX.MAPS[pm].kind === 'in') {
        if (cap.map !== pmOut) { exitTo(pmOut); return; }
        const door = PX.W.maps[pmOut].doors.find(d => d.to === pm);
        if (!door) return;
        if (U.dist(cap.x, cap.y, door.x + 0.5, door.y + 0.5) > 1.2) { if (!cap.path.length) cap.goTo(PX.W.maps[pmOut], door.x, door.y); }
        else moveTo(pm, pmOut);
      } else exitTo(pm);
      return;
    }
    // 같은 맵
    const p = g.player;
    const d = U.dist(cap.x, cap.y, p.x, p.y);
    if (d > 2.2) {
      if (!cap.path.length || Math.random() < 0.3) cap.goTo(PX.W.maps[pm], Math.floor(p.x), Math.floor(p.y + 1));
      if (cap.path.length > 1) cap.path.pop();
    } else if (!g.modal && now - r.lastApproach > 45) {
      r.lastApproach = now;
      g.trigger(approach);
    }
  }
  // 플레이어 옆 빈자리에 앉기
  function sitNear(g) {
    const m = PX.W.maps[cap.map], p = g.player;
    let best = null, bd = 9;
    for (const o of m.objs) if (o.seats) for (const s of o.seats) { if (s.by) continue; const d = U.dist(s.x, s.y, p.x, p.y); if (d < bd && d < 2.2) { bd = d; best = s; } }
    if (!best) return false;
    const a = PX.W.accessTile(m, best.obj);
    if (!a) return false;
    cap.toSeat = true;
    if (!cap.goTo(m, a.x, a.y, () => { cap.toSeat = false; if (!best.by) cap.sitOn(best); })) cap.toSeat = false;
    return true;
  }
  function exitTo(outMap) { // 현재 실내 → 바깥, 바깥 → 다른 바깥은 travel
    if (!cap.map) { moveTo(outMap); return; }
    const m = PX.W.maps[cap.map];
    if (m.kind === 'in') {
      if (G().mapId === cap.map) { // 보이면 걸어서 나감
        if (!cap.path.length) { const from = cap.map; cap.goTo(m, m.exit.x, m.exit.y, () => moveTo(m.def.parent, from), { allow: (x, y) => x === m.exit.x && y === m.exit.y }); }
      } else moveTo(m.def.parent, cap.map);
    } else moveTo(outMap);
  }
  function travel(toMap, mins, nextMode, from) {
    cap.stop(); cap.leaveSeat();
    mode = 'travel'; travelUntil = St.absMin() + mins; travelTo = { map: toMap, mode: nextMode, from: null };
    cap.map = null;
  }

  // 동행 중 플레이어가 맵을 옮겼을 때
  // 동행 중 플레이어가 다른 맵으로 들어갔을 때: 장소마다 대위가 판단한다
  const NO_ENTRY = { shower: '샤워실', dawnshower: '새벽 샤워실' };
  function followIntoMap() {
    const g = G(), S = St.S, V = PX.DLG_V2 || {}, M = PX.Mind;
    const to = g.mapId, from = g.prevMap;
    // 대위가 들어가지 않는 곳: 밖에서 기다린다 (플레이어 입장은 그대로)
    if (NO_ENTRY[to]) {
      mode = 'waitOut'; waitOut = { map: from, inside: to, until: St.absMin() + 90 };
      if (M) { M.mem().contact = 'NONE'; M.apply(); }
      const said = V.shower ? PX.Dlg.pick('v_shower', V.shower) : null;
      if (said) g.trigger(async () => { g.modal++; cap.atDoor = true; try { await PX.Dlg.runLines(said.l); } finally { cap.atDoor = false; } PX.Dlg.close(); g.modal--; });
      return;
    }
    if (to === homeId() && mode === 'follow') { // 숙소엔 물어보고 들어간다 (거절하면 한동안 다시 안 묻는다)
      if (M && M.refused('home')) { release(U.pick(['오늘은 문 앞까지. 잘 자.', '들어가. 내일 보자.'])); return; }
      g.trigger(async () => {
        g.modal++; cap.atDoor = true; // 문 앞에 서서 묻는다 (방 밖이지만 실제로 거기 있다)
        try {
        const bd = V.homeAsk ? PX.Dlg.pick('v_homeAsk', V.homeAsk) : null;
        await PX.Dlg.runLines(bd ? bd.l : ['C*:나도 들어가도 돼?']);
        const i = await PX.Dlg.choose([{ t: '들어와요.' }, { t: '차 한 잔만이에요.' }, { t: '오늘은 여기까지요.' }]);
        if (i < 2) { await PX.Dlg.say('player', i === 0 ? '들어와요.' : '차 한 잔만이에요.'); await PX.Dlg.runLines(U.pick(V.homeYes || [['C^:고마워.']])); PX.Dlg.close(); g.modal--; startVisit(true); if (i === 1) St.S.cap.visitShort = St.absMin() + 60; }
        else { await PX.Dlg.say('player', '오늘은 여기까지요.'); await PX.Dlg.runLines(U.pick(V.homeNo || [['C:응, 알았어.']])); PX.Dlg.close(); g.modal--; if (M) M.noteRefuse('home', 240); release(null, 60); }
        } finally { cap.atDoor = false; }
      });
      mode = 'sched'; // 대답 전까지는 밖에서 대기
      return;
    }
    moveTo(to, from);
    const p = g.player, m = PX.W.maps[to];
    // 플레이어와 겹치지 않는 옆 칸
    const px = Math.floor(p.x), py = Math.floor(p.y);
    const cand = [[1, -1], [-1, 1], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1]].map(([dx, dy]) => [px + dx, py + dy]).filter(([x, y]) => PX.W.walkable(m, x, y));
    if (cand.length) { cap.x = cand[0][0] + 0.5; cap.y = cand[0][1] + 0.5; }
    if (M) M.apply(); // 손잡기·팔짱은 문을 지나도 이어진다
    if (to === 'rubyway' && V.ruby && S.done.rubyLine !== S.day) { S.done.rubyLine = S.day; const bd = PX.Dlg.pick('v_ruby', V.ruby); if (bd) g.trigger(async () => { g.modal++; await PX.Dlg.runLines(bd.l); PX.Dlg.close(); g.modal--; }); }
    if (to === 'q_captain' && V.capHome && S.done.capHomeLine !== S.day) { S.done.capHomeLine = S.day; const bd = PX.Dlg.pick('v_capHome', V.capHome); if (bd) g.trigger(async () => { g.modal++; await PX.Dlg.runLines(bd.l); PX.Dlg.close(); g.modal--; }); }
  }
  // 밖에서 기다리던 대위: 플레이어가 나오면 다시 동행
  function waitOutTick() {
    const g = G(), w = waitOut;
    if (!w) return;
    if (g.mapId === w.inside) return;
    if (g.mapId === w.map) {
      mode = 'follow'; waitOut = null; cap.setDirTo(g.player.x, g.player.y);
      const V = PX.DLG_V2 || {};
      if (V.showerOut) g.trigger(async () => { g.modal++; await PX.Dlg.runLines(U.pick(V.showerOut)); PX.Dlg.close(); g.modal--; });
      return;
    }
    release(); // 다른 데로 가 버렸다
  }

  // ---------- 이벤트 ----------
  async function approach() {
    const S = St.S, r = S.rel.cap, g = G(), D = PX.DLG_CAP;
    g.modal++;
    cap.setDirTo(g.player.x, g.player.y); g.player.setDirTo(cap.x, cap.y);
    cap.showEmote('heart', 1.5);
    // 장기작전에서 돌아와 찾아온 경우: 특별한 재회
    const M = PX.Mind, reu = M && M.mem().reunion;
    if (reu && PX.DLG_V2) {
      const bd = PX.Dlg.pick('v_reunion', PX.DLG_V2.reunion);
      await PX.Dlg.runLines(bd ? bd.l : ['C:나 왔어.'], { reply: true });
      if (S.cap.giftPending) { const gid = S.cap.giftPending; S.cap.giftPending = null; cap.doPose('carry', 1.4, 'smile'); await PX.Dlg.runLines(['C:선물. 작전 중에 찾은 거야. 네 생각나서 챙겼어.']); St.addItem(gid); PX.UI.toast(`🎁 ${PX.U.josa(PX.ITEMS[gid].name, '을')} 받았다`); }
      M.mem().reunion = null; M.mem().longing = 20; M.noteMeet(); M.noteTalk('reunion');
      if (r.stage >= 3) { const i = await PX.Dlg.choose([{ t: '안아 줄게요.' }, { t: '수고했어요.' }]); if (i === 0) { PX.Dlg.close(); g.modal--; await M.perform('fronthug', true); g.modal++; } else await PX.Dlg.say('player', '수고했어요.'); }
      g.memory('무사 귀환', `${reu.days}일 만에 돌아온 대위가 제일 먼저 나를 찾아왔다.`, true);
    } else
    // 선물 들고 오기
    if (S.cap.giftPending) {
      const gid = S.cap.giftPending; S.cap.giftPending = null;
      cap.doPose('carry', 1.5, 'smile');
      if (gid === 'capStone') await PX.Dlg.runLines(['C:이거. 외곽에서 주웠어.', 'C*:네가 좋아할 것 같아서. 반짝이지?']);
      else await PX.Dlg.runLines(['C:너 이거 좋아하잖아. 오다가 샀어.', 'C^:먹어. 나 보는 데서.']);
      St.addItem(gid);
      PX.UI.toast(`🎁 ${PX.U.josa(PX.ITEMS[gid].name, '을')} 받았다`);
      if (!S.done.firstCapGift) { S.done.firstCapGift = 1; g.memory('첫 선물', `${PX.U.josa(S.capName, '이')} ${PX.U.josa(PX.ITEMS[gid].name, '을')} 내밀었다.`, true); }
    } else {
      const cat = S.lastRival && St.absMin() - S.lastRivalMin < 60 && r.backoffUntil < St.absMin() ? 'jealousy' : null;
      if (cat) { await PX.Dlg.runLines(PX.Dlg.pick('jealousy', D.jealousy).l); S.lastRival = null; }
      else { // 마지막으로 본 뒤 얼마나 지났는지에 맞는 인사
        const gc = PX.Mind ? PX.Mind.gapCat() : 'again', V = PX.DLG_V2 || {};
        const bd = V[gc === 'cont' || gc === 'brief' ? 'brief' : gc] ? PX.Dlg.pick('v_' + gc, V[gc === 'cont' ? 'brief' : gc]) : null;
        if (bd) await PX.Dlg.runLines(bd.l, { reply: true }); else await PX.Dlg.say('cap', U.fmt(U.pick(['{p아}. 근무 끝났어.', '나 왔어.', '너 보러 왔어. 딴 이유 없어.']), PX.Dlg.ctx()), 'smirk');
        if (PX.Mind) PX.Mind.noteMeet();
      }
    }
    if (r.stage >= 2 && PX.Rom && !PX.Rom.nextDate() && !(PX.Mind && PX.Mind.refused('dateAsk')) && St.isWeekend() === false && Math.random() < 0.2) { PX.Dlg.close(); g.modal--; await PX.Rom.capAskDate(); g.modal++; }
    const opts = [{ t: '같이 다녀요.', k: 'follow' }, { t: '잠깐 얘기해요.', k: 'talk' }, { t: '오늘은 혼자 있고 싶어요.', k: 'alone' }, { t: '이따 봐요.', k: 'later' }];
    const i = await PX.Dlg.choose(opts);
    const k = opts[i].k;
    await PX.Dlg.say('player', opts[i].t);
    if (k === 'follow') { await PX.Dlg.say('cap', U.pick(['그 말 기다렸어.', '좋아. 어디든.', '오케이. 네 속도에 맞출게.']), 'smile'); startFollow(); St.addAff(2); }
    else if (k === 'alone') { if (PX.Mind) PX.Mind.noteRefuse('follow', 600); await PX.Dlg.say('cap', U.pick(['응, 알았어. 푹 쉬어. 내일 보자.', '그래. 필요하면 불러. 바로 갈게.']), 'smile'); r.noFollowUntil = (S.day + (S.time.min >= 6 * 60 ? 1 : 0)) * 1440 + 6 * 60; mode = 'sched'; }
    else if (k === 'later') { if (PX.Mind) PX.Mind.noteRefuse('follow', 90); await PX.Dlg.say('cap', '응. 이따 꼭 보자.'); r.lastApproach = St.absMin() + 30; mode = 'sched'; r.noFollowUntil = St.absMin() + 60; }
    PX.Dlg.close(); g.modal--;
    if (k === 'talk') await PX.Dlg.capTalk();
  }
  function startFollow() { mode = 'follow'; St.S.cap.follow = true; waitOut = null; }
  // 동행 잠시 멈추기: 그 자리에서 기다린다 (한 시간 지나거나 근무 시간이면 자기 일정으로)
  let pausedUntil = 0;
  function pause() { if (PX.Mind) { PX.Mind.mem().contact = 'NONE'; PX.Mind.apply(); } mode = 'paused'; pausedUntil = St.absMin() + 60; cap.stop(); G().bubble(cap, U.pickFresh('pause', ['응. 여기 있을게.', '다녀와. 안 움직이고 있을게.', '기다리는 건 잘해. 매복 훈련 받았거든.'])); }
  function startVisit() {
    const g = G();
    mode = 'visit';
    moveTo(homeId(), PX.MAPS[homeId()].parent);
    const m = PX.W.maps[homeId()];
    const sofa = m.objs.find(o => o.kind === 'furn' && o.fid.startsWith('sofa') && o.seats.some(s => !s.by));
    g.trigger(async () => {
      g.modal++;
      const bd = PX.Dlg.pick('visit', PX.DLG_CAP.visit);
      await PX.Dlg.runLines(bd.l);
      if (bd.gift) { St.addItem(bd.gift); PX.UI.toast(`🎁 ${PX.U.josa(PX.ITEMS[bd.gift].name, '을')} 받았다`); }
      PX.Dlg.close(); g.modal--;
      St.S.cap.lastVisitDay = St.S.day;
      if (!St.S.done.firstVisit) { St.S.done.firstVisit = 1; g.memory('숙소 방문', `${PX.U.josa(St.S.capName, '이')} 처음으로 내 숙소에 놀러 왔다.`, true); }
      if (sofa) { const seat = sofa.seats.find(s => !s.by); cap.goTo(m, Math.floor(seat.x), Math.floor(seat.y + 1), () => cap.sitOn(seat)); }
    });
  }
  async function knock() {
    const S = St.S, g = G(), D = PX.DLG_CAP;
    g.modal++;
    await PX.Dlg.runLines(U.pick(D.knock));
    const i = await PX.Dlg.choose([{ t: '들어오라고 한다' }, { t: '밖으로 나가서 만난다' }, { t: '오늘은 쉬고 싶다고 말한다' }]);
    PX.Dlg.close(); g.modal--;
    if (i === 0) { await PX.Dlg.say('player', '들어와요.'); PX.Dlg.close(); startVisit(); }
    else if (i === 1) { g.goOutside(); startFollow(); g.trigger(async () => { await PX.Dlg.say('cap', '나와 줬네. 산책할래?', 'smile'); PX.Dlg.close(); }); }
    else {
      await PX.Dlg.say('player', '오늘은 좀 쉬고 싶어요.');
      await PX.Dlg.say('cap', U.pick(['응, 알았어. 푹 자. 내일 보자.', '그래. 얼굴은 내일 보면 되지. 잘 자.']), 'smile'); PX.Dlg.close();
      S.rel.cap.noFollowUntil = (S.day + 1) * 1440 + 6 * 60; release();
    }
  }
  // 방문 중 밤: 숙박 요청 또는 귀가
  async function nightCheck() {
    const S = St.S, g = G(), r = S.rel.cap, D = PX.DLG_CAP;
    if (mode !== 'visit') return;
    if (r.stage >= 2 && S.cap.lastStayAskDay !== S.day) {
      S.cap.lastStayAskDay = S.day;
      g.modal++;
      cap.leaveSeat(); cap.setDirTo(g.player.x, g.player.y);
      const bd = PX.Dlg.pick('stayRequest', D.stayRequest);
      await PX.Dlg.runLines(bd.l);
      const opts = [{ t: '…소파에서 자고 가요.', k: 'sofa' }];
      if (r.stage >= 4) opts.push({ t: '침대에서 같이 자요.', k: 'bed' });
      opts.push({ t: '오늘은 막사로 돌아가세요.', k: 'no' });
      const i = await PX.Dlg.choose(opts);
      await PX.Dlg.say('player', opts[i].t);
      if (opts[i].k !== 'no') {
        await PX.Dlg.runLines(U.pick(D.stayYes));
        S.cap.stay = opts[i].k; mode = 'stay'; St.addAff(6);
        if (!S.done.firstStay) { S.done.firstStay = 1; g.memory('첫 숙박', `${PX.U.josa(S.capName, '이')} 내 숙소에서 하룻밤 머물렀다.${opts[i].k === 'bed' ? ' 좁은 침대에서 같이.' : ' 소파 밖으로 다리가 삐져나왔다.'}`, true); }
        const m = PX.W.maps[homeId()];
        const sofa = m.objs.find(o => o.kind === 'furn' && o.fid.startsWith('sofa'));
        if (sofa) cap.sitOn(sofa.seats.find(s => !s.by) || sofa.seats[0]);
        cap.pose = 'lie';
      } else {
        await PX.Dlg.runLines(U.pick(D.stayNo));
        leaveHome();
      }
      PX.Dlg.close(); g.modal--;
    } else if (S.time.min >= 22 * 60 + 20) {
      g.modal++;
      await PX.Dlg.say('cap', U.pick(['늦었다. 나 갈게. 잘 자.', '내일 아침 일찍 브리핑이야. 간다. 문 잠가.']), 'smile');
      PX.Dlg.close(); g.modal--;
      leaveHome();
    }
  }
  function leaveHome() {
    const m = PX.W.maps[homeId()];
    cap.leaveSeat(); mode = 'sched';
    St.S.rel.cap.noFollowUntil = (St.S.day + 1) * 1440 + 6 * 60;
    cap.goTo(m, m.exit.x, m.exit.y, () => moveTo(m.def.parent, m.id), { allow: (x, y) => x === m.exit.x && y === m.exit.y });
  }
  // 플레이어가 침대에 누울 때 (방문 중이면 먼저 정리)
  async function beforeSleep() {
    if (mode === 'visit') { await nightCheck(); if (mode === 'visit') { await PX.Dlg.say('cap', '잘 자. 나 간다.', 'smile'); PX.Dlg.close(); leaveHome(); } }
  }
  function forceLeave() { // 플레이어가 잠들 때: 허락 없이 머물지 않는다
    if (mode !== 'visit') return false;
    cap.leaveSeat(); mode = 'sched';
    St.S.rel.cap.noFollowUntil = (St.S.day + 1) * 1440 + 6 * 60;
    moveTo(PX.MAPS[homeId()].parent, homeId());
    return true;
  }
  async function morningAfter() {
    const S = St.S, g = G();
    if (!S.cap.stay) return;
    const bed = S.cap.stay === 'bed';
    S.cap.stay = false;
    cap.leaveSeat(); cap.setDirTo(g.player.x, g.player.y);
    g.modal++;
    await PX.Dlg.runLines(U.pick(PX.DLG_CAP.morningAfter));
    if (bed) await PX.Dlg.runLines(['C*:좋은 아침. 오늘은 내가 제일 먼저 말했다.']);
    PX.Dlg.close(); g.modal--;
    mode = 'stay'; // 07:30까지 있다가 아침 먹으러 간다
  }
  async function doSkin(act, capAsked) { // 예전 이름 호환 (AI 대화 행동 등)
    const map = { hand: 'hand', pat: 'pat', hug: 'fronthug', kiss: 'kiss', cheek: 'kisscheek', carry: 'carry', armlink: 'armlink' };
    return PX.Mind.perform(map[act] || act, capAsked);
  }

  // ---------- 메시지 ----------
  function msgTick() {
    const S = St.S, g = G(), r = S.rel.cap;
    const now = St.absMin();
    if (now - lastMsgCheck < 20) return; lastMsgCheck = now;
    if (r.stage < 1 || mode === 'follow' || mode === 'visit' || mode === 'stay' || mode === 'waitOut' || cap.map === g.mapId) return;
    if (PX.Mind && PX.Mind.justParted(20)) return;
    if (S.time.min < 8 * 60 || S.time.min > 23 * 60 + 30) return;
    if (now - (S.cap.lastMsgMin || 0) < 150 || Math.random() > 0.3) return;
    if (r.noFollowUntil > now && S.time.min > 21 * 60) return;
    S.cap.lastMsgMin = now;
    let msg;
    if (spotKind() === 'field') msg = { t: U.pick(['여긴 별일 없어. 너는?', '외곽 모래 장난 아니다. 너는 실내지?', '지금 잠깐 쉬는 중. 너 생각나서.']), r: [['저도 별일 없어요.', 2, '다행이다. 다섯 시에 봐.'], ['조심하세요.', 3, '응. 너 보러 꼭 무사히 갈게.']] };
    else msg = PX.Dlg.pick('msg', PX.DLG_CAP.msg);
    if (!msg) return;
    S.messages.unshift({ id: now, t: msg.t, r: msg.r, day: S.day, min: S.time.min, reply: null });
    S.messages = S.messages.slice(0, 40);
    PX.UI.toast(`📱 ${S.capName}: ${msg.t}`, 4000);
    PX.UI.badge();
    if (Math.random() < 0.25 && spotKind() === 'field') S.cap.giftPending = Math.random() < 0.5 ? 'capStone' : 'capSnack';
  }

  return { pause, forceLeave, sitNear, init, update, status, onDuty, isMeal, atPlayerWork, release, startFollow, startVisit, doSkin, beforeSleep, morningAfter, msgTick, moveTo, get mode() { return mode; }, set mode(v) { mode = v; }, spotKind, homeId, bump };
})();
