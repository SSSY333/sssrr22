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
  const capDefNow = () => {
    const S = St.S, base = PX.NPC_BY_ID.cap;
    if (PX.Rom && PX.Rom.onLeave('cap', S.day)) return Object.assign({}, base, { sched: base.we, sched2: null });
    // 복귀 검진을 이미 받았으면 (내가 · 윤 중위가) 의무동에 남아 있지 않고 바로 작전동 보고로
    const ex = S.done && S.done['capExam_' + S.day];
    if (ex === 'me' || ex === 'nurse') { const sk = (t) => t && t.replace('17:00 med.patient', '17:00 ops.cap'); return Object.assign({}, base, { sched: sk(base.sched), sched2: sk(base.sched2) }); }
    return base;
  };
  // 치료 뒤 약속한 저녁 시간 (보고 → 자유 시간으로 플레이어 곁에)
  const freeNow = () => { const f = St.S.cap.freeWin, t = St.absMin(); return !!(f && t >= f.from && t < f.until); };
  const entry = () => { const e = A.schedEntry(capDefNow(), St.S); return freeNow() && e.spot !== 'cap.bed' ? Object.assign({}, e, { spot: 'free' }) : e; };
  function spotKind(e = entry()) {
    if (e.spot === 'field') return 'field';
    if (e.spot === 'free') return 'free';
    if (e.spot === 'cap.bed') return 'sleep';
    if (e.spot.startsWith('mess')) return 'meal';
    if (e.spot.startsWith('cap.')) return 'rest';
    if (e.spot.startsWith('gym.')) return 'gym'; // 아침 운동은 근무가 아니다
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
    if (mode === 'linger') return St.S.cap.arriving ? '약속대로 찾아오는 중' : '가기 전에 아쉬워하는 중';
    if (mode === 'date') return '약속 장소에서 기다리는 중';
    if (mode === 'waitOut') return '밖에서 기다리는 중';
    if (mode === 'paused') return '그 자리에서 기다리는 중';
    if (mode === 'follow' && PX.Plan && PX.Plan.label()) return `약속: ${PX.Plan.label()}`;
    if (mode === 'follow' && St.S.cap.hosting) return '막사에서 나랑 쉬는 중';
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
    if (cap) cap.atSpot = null; // 이전 일정 자리(예: 의무실 침대)가 남아 다른 곳에서 의무실 행동이 뜨지 않게
    cap.stop(); cap.leaveSeat(); cap.holding = false;
    cap.map = mapId;
    if (!mapId) return;
    const ep = A.entryPoint(mapId, fromMap);
    cap.x = ep.x; cap.y = ep.y; cap.pose = 'idle';
    const m = PX.W.maps[mapId];
    if (m.kind === 'in' && G().mapId === mapId) bump(m);
  }
  let lastBump = -1e9;
  function bump(m) {
    const now = St.absMin();
    if (now - lastBump > 240 && Math.random() < (m.def.lowDoor ? 0.5 : 0.18)) { // 문틀 박치기는 가끔만 (네 시간에 한 번 이하)
      lastBump = now;
      setTimeout(() => { if (cap.seat || cap.map !== G().mapId) return; cap.doPose('bump', 1.1, 'surprise'); cap.showEmote('stars', 1.6); G().bubble(cap, U.pickFresh('capBump', ['아야.', '…또 박았네.', '이 문틀 누가 이렇게 낮게 만들었어.', '부대 문은 다 내 키 싫어하는 사람이 설계했어.', '괜찮아. 문이 더 아플 거야.', '…못 본 걸로 해.', '이마에 문틀 자국 생기겠다.', '오늘은 안 박으려고 했는데.'])); }, 250);
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
      } else if (cap.wander || cap.seat || (cap.toSeat && cap.path.length)) {
        // 앉아 있거나 자리로 가는 중 · 방을 둘러보는 중엔 따라가기를 멈춘다
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
      if (cap.toSeat && cap.path.length) { toSeatT += dt; if (toSeatT > 2) { toSeatT = 0; cap.stop(); cap.toSeat = false; sitT = 0; } } else toSeatT = 0; // 자리로 가다 막히면 다시 판단
      if (p.seat && !cap.seat && !cap.path.length && !cap.wander && sitT <= 0) { sitT = 2; sitNear(g); }
      if (!p.seat && cap.seat) cap.leaveSeat();
      sitT -= dt;
    }
    // 내 방에 놀러 왔을 때: 소파에만 붙어 있지 않는다 (내가 앉으면 옆자리로, 멀리 돌아다니면 일어나서 온다)
    if (mode === 'visit' && cap.map === g.mapId && g.mapId === homeId() && !g.modal && !cap.wander) {
      const d = U.dist(cap.x, cap.y, p.x, p.y);
      if (p.seat && (!cap.seat || U.dist(cap.seat.x, cap.seat.y, p.x, p.y) > 3.6) && !cap.path.length && sitT <= 0 && (p.seat.obj && (p.seat.obj.use || (p.seat.obj.f && p.seat.obj.f.use)) !== 'bed')) { sitT = 3; if (cap.seat) cap.leaveSeat(); sitNear(g); }
      else if (!p.seat && cap.seat && !cap.seat.virt && d > 2.4 && !p.moving) { farT += dt; if (farT > 3) { farT = 0; cap.leaveSeat(); const m = PX.W.maps[cap.map]; const t = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => [Math.floor(p.x) + dx, Math.floor(p.y) + dy]).find(([x, y]) => PX.W.walkable(m, x, y)); if (t) cap.goTo(m, t[0], t[1], () => cap.setDirTo(p.x, p.y)); } }
      else farT = 0;
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
    if (O && O.phase === 'away' && !O.joint) { if (mode !== 'op' || cap.map) { cap.map = null; cap.stop && cap.stop(); mode = 'op'; } return; } // 작전 중엔 어디에도 없다 (불러오기 직후 포함)
    if (O && O.phase === 'away' && O.joint) { if (mode !== 'follow' && cap.map === g.mapId) mode = 'follow'; if (mode === 'follow' && cap.map !== g.mapId && !g.transition) followIntoMap(); return; }
    if (mode === 'op') mode = 'sched';
    if (S.cap.hosting && mode !== 'follow') S.cap.hosting = false;
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
      // 내가 잠깐 나가도 바로 가 버리지 않는다: 방에서 기다리다가, 너무 오래(90분) 안 오거나 근무 · 잘 시간이면 메시지 남기고 간다
      if (g.mapId !== homeId()) {
        if (!S.cap.homeLeft) { S.cap.homeLeft = now; if (cap.seat && cap.seat.virt) { cap.leaveSeat(); cap.busy = false; } }
        if (now - S.cap.homeLeft > 90 || k === 'duty' || k === 'field' || (k === 'sleep' && S.time.min >= 23 * 60)) {
          S.cap.homeLeft = 0; release();
          if (PX.Op && PX.Op.send) PX.Op.send({ t: k === 'duty' || k === 'field' ? '근무 들어가야 해서 먼저 나왔어. 문은 잘 닫아 뒀어.' : U.pick(['기다리다 먼저 나왔어. 다음엔 같이 나가자.', '방 지키다 왔어. 너 오면 주려고 물 한 잔 떠 놨어.']), r: [['미안, 금방 갈 줄 알았어.', 1, '괜찮아. 다음엔 나도 데려가.']] });
        }
        return;
      }
      if (S.cap.homeLeft) { const away = now - S.cap.homeLeft; S.cap.homeLeft = 0; if (away >= 3 && !g.modal) setTimeout(() => g.bubble(cap, U.pickFresh('homeBack', away > 40 ? ['왔어? 오래 걸렸네. 기다렸어.', '…늦었다. 걱정했잖아.', '어디 갔다 왔어? 나 혼자 방 구경 다 했어.'] : ['왔어? 기다렸어.', '빨리 왔네.', '어, 왔다. 심심했어.']), 2.6), 600); }
      if (k === 'duty' || k === 'field') { startFarewell(k); return; }
      if (S.cap.visitShort && now > S.cap.visitShort && !g.modal) { S.cap.visitShort = 0; g.trigger(async () => { g.modal++; await PX.Dlg.runLines(PX.Dlg.capPick([['C:차 잘 마셨어. 약속대로 한 잔만.', 'C^:…한 잔 더는 다음에.'], ['C:한 시간 됐다. 약속은 지켜야지.', 'C*:붙잡으면 못 이기는 척 있을게.']])); const i = await PX.Dlg.choose([{ t: PX.Dlg.capTone('조심히 가요.') }, { t: PX.Dlg.capTone('조금만 더 있다 가요.') }]); PX.Dlg.close(); g.modal--; if (i === 0) { const m = PX.W.maps[g.mapId]; cap.leaveSeat(); release(null, 60); cap.goTo(m, m.exit.x, m.exit.y, () => moveTo(m.def.parent, m.id), { allow: (x, y) => x === m.exit.x && y === m.exit.y }); } }); return; }
      if (S.cap.cohab && S.time.min >= 22 * 60 && !g.modal) { S.cap.stay = 'bed'; mode = 'stay'; bedTogether(); return; } // 같이 사는 사이: 묻지 않고 함께 잔다
      if (S.time.min >= 22 * 60 && !g.modal) g.trigger(nightCheck);
      return;
    }
    if (mode === 'linger') return; // 작별 인사 중: 그 자리에
    if (mode === 'paused') { if (k === 'duty' || k === 'field' || St.absMin() > pausedUntil) { release(); } return; }
    if (mode === 'waitOut') { if (k === 'duty' || k === 'field' || St.absMin() > (waitOut ? waitOut.until : 0)) { release(); return; } waitOutTick(); return; }
    // 동행 해제 조건: 근무·작전 시간
    if (mode === 'follow') {
      if (S.cap.hosting && g.mapId !== 'q_captain' && cap.map === 'q_captain' && !g.transition) { S.cap.hosting = false; release(null, 20); cap.wander = false; if (cap.seat) cap.leaveSeat(); return; } // 막사에 놀러 왔다 혼자 나가면: 대위는 막사에 남는다
      if (k === 'duty' || k === 'field') { startFarewell(k); return; } // 칼같이 가지 않는다: 아쉬워하다 간다
      if (k === 'sleep' && S.time.min >= 23 * 60 + 30 && PX.LateNight && PX.LateNight.check()) { if (cap.map !== g.mapId && !g.transition) followIntoMap(); return; } // 데이트 중이면 밤을 어디서 보낼지 묻는다 · 같이 다닌다
      if (k === 'sleep' && S.time.min >= 23 * 60 + 30) { release('늦었다. 잘 자, ' + U.josa(U.givenName(S.player.name), '아') + '.'); return; }
      if (cap.map !== g.mapId && !g.transition) followIntoMap();
      // 가끔 스킨십 요청
      const calm = !g.transition && !g.queue.length && !g.modal && now - (g.enteredAt || -1e9) >= 5 && !(PX.Mind && now - (PX.Mind.mem().joinAt || -1e9) < 25); // 문 앞 · 다른 대화 직후엔 묻지 않는다
      if (calm && (!g.player.seat && r.stage >= 2 && r.backoffUntil < now && now - lastSkinReq > 150 && Math.random() < 0.04 && !(PX.Mind && now - (PX.Mind.mem().playerSkinAt || -1e9) < 120) && !g.modal && PX.Mind && PX.Mind.contact() === 'NONE' || (PX.Mind && r.stage >= 3 && PX.Mind.isWalk() && now - lastSkinReq > 180 && Math.random() < 0.02 && now - (PX.Mind.mem().playerSkinAt || -1e9) >= 120 && !g.modal && r.backoffUntil < now))) { lastSkinReq = now; g.trigger(() => PX.Mind.capAsk()); }
      return;
    }
    if (mode === 'wait_door') {
      if (g.mapId !== homeId()) { // 플레이어가 나왔다
        mode = 'seek';
      } else if (knockedToday !== S.day && !g.modal) { knockedToday = S.day; g.trigger(knock); }
      if (k !== 'free' || !playerAvailable()) release();
      return;
    }
    // 내가 대위 막사에 찾아왔을 때: 쉬는 시간이면 나를 맞는다 (같이 있는 상태)
    if (g.mapId === 'q_captain' && cap.map === 'q_captain' && ['sched', 'seek'].includes(mode) && !['duty', 'field', 'sleep'].includes(k) && r.stage >= 1 && !g.sleeping && !g.inMini && S.time.min >= 6 * 60 + 30 && S.time.min < 23 * 60 && !g.modal && !g.transition && !g.queue.length) { // 내가 직접 찾아온 거라 '나중에' 거절과 상관없이 맞는다
      mode = 'follow'; S.cap.hosting = true; St.S.cap.follow = true; waitOut = null;
      if (S.done.hostGreet !== S.day + ':' + Math.floor(S.time.min / 120)) { S.done.hostGreet = S.day + ':' + Math.floor(S.time.min / 120); cap.setDirTo(g.player.x, g.player.y); cap.showEmote('heart', 1.4); g.bubble(cap, U.pickFresh('hostHi', r.stage >= 4 ? ['왔어? 들어와. 여기 앉아.', '내 방에 네가 있으니까 이상하게 좋다.', '마침 보고 싶었어. 진짜로.', '왔네. 뭐 할까? 아무거나.'] : ['어, 왔어? 들어와. 좀 어질러져 있어.', '여기까지 찾아왔네. 앉아. 뭐 마실래?', '내 방은 좁아도 냉각기는 최고야. 들어와.']), 2.8); }
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
  // 내 옆에 와서 앉을 때 한마디 (10분에 한 번 이하 · 시간·장소에 맞는 말 · 안 한 말부터)
  let lastSitLine = -1e9, toSeatT = 0, farT = 0;
  const SIT_B = ['여기 앉아도 되지? 이미 앉았지만.', '다리 좀 쉬자.', '옆자리 비어 있길래.', '자리 좋다. 너 옆이라.', '조금만 쉬었다 가자.', '앉으니까 살 것 같다.', '여기 앉으면 네 얼굴 잘 보여.', '천천히 쉬어. 급할 거 없어.',
    '나 무거워서 의자가 삐걱거린다. 못 들은 걸로 해.', '여기 경치 괜찮네.', '좁아? 내가 좀 비켜 앉을게.', '이렇게 나란히 앉는 거 좋아.', '오늘 많이 걸었지. 발 아프지 않아?', '밤공기 좋다.', '아침부터 앉아 있으니까 사치 같다.', '점심 먹고 앉으니까 졸리네.'];
  const SIT_BL = ['어깨 빌려줄게.', '손 이리 줘.', '좀 더 붙어 앉아.', '자기 옆이 제일 편해.', '여기 내 지정석이다.', '기대도 돼. 아니, 기대.', '오늘은 여기서 안 움직일 거야.', '한 뼘도 멀다.'];
  function sitLine(g) {
    const now = St.absMin(), p = g.player;
    if (now - lastSitLine < 10 || !p.seat || U.dist(cap.x, cap.y, p.x, p.y) > 2.2 || g.modal || !(mode === 'follow' || mode === 'visit' || mode === 'stay')) return;
    if (Math.random() < 0.35) return; // 매번은 아니고
    lastSitLine = now;
    const pool = St.S.rel.cap.stage >= 4 ? SIT_BL.concat(SIT_B) : SIT_B;
    setTimeout(() => g.bubble(cap, PX.Dlg.capPick(pool)), 400);
  }
  function sitNear(g) {
    const m = PX.W.maps[cap.map], p = g.player;
    let best = null, bd = 9;
    for (const o of m.objs) if (o.seats) for (const s of o.seats) { if (s.by) continue; const d = U.dist(s.x, s.y, p.x, p.y); if (d < bd && d < 2.2) { bd = d; best = s; } }
    if (!best) return false;
    if (U.dist(cap.x, cap.y, best.x, best.y) < 2.6) { cap.stop(); cap.toSeat = false; cap.sitOn(best); sitLine(g); return true; } // 바로 옆자리면 돌아가지 않고 그대로 앉는다
    const a = PX.W.accessTile(m, best.obj);
    if (!a) return false;
    cap.toSeat = true;
    if (!cap.goTo(m, a.x, a.y, () => { cap.toSeat = false; if (!best.by) { cap.sitOn(best); sitLine(g); } })) { cap.toSeat = false; if (U.dist(cap.x, cap.y, best.x, best.y) < 2.6 && !best.by) { cap.stop(); cap.sitOn(best); sitLine(g); } } // 손잡고 있다 바로 옆이면 그냥 앉는다
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
    if ((to === 'onsen_f' || to === 'onsen_m') && S.cap.onsenSplit) { mode = 'waitOut'; waitOut = { map: from, inside: to, until: St.absMin() + 120 }; if (M) { M.mem().contact = 'NONE'; M.apply(); } return; } // 남자 탈의실에서 갈아입는 중
    if (to === 'inn_bathroom' && S.cap.bathAlone) { mode = 'waitOut'; waitOut = { map: from, inside: to, until: St.absMin() + 120 }; if (M) { M.mem().contact = 'NONE'; M.apply(); } return; } // 혼자 욕실: 객실에서 기다린다
    // 대위가 들어가지 않는 곳: 밖에서 기다린다 (플레이어 입장은 그대로)
    if (NO_ENTRY[to]) {
      mode = 'waitOut'; waitOut = { map: from, inside: to, until: St.absMin() + 90 };
      if (M) { M.mem().contact = 'NONE'; M.apply(); }
      const tease = V.showerTease && S.rel.cap.stage >= 2 && Math.random() < 0.75; // 썸 이후엔 능글맞게
      const said = tease ? PX.Dlg.pick('v_showerT', V.showerTease) : V.shower ? PX.Dlg.pick('v_shower', V.shower) : null;
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
        const i = await PX.Dlg.choose([{ t: PX.Dlg.capTone('들어와요.') }, { t: PX.Dlg.capTone('차 한 잔만이에요.') }, { t: PX.Dlg.capTone('오늘은 여기까지요.') }]);
        if (i < 2) { await PX.Dlg.say('player', PX.Dlg.capTone(i === 0 ? '들어와요.' : '차 한 잔만이에요.')); await PX.Dlg.runLines(U.pick(V.homeYes || [['C^:고마워.']])); PX.Dlg.close(); g.modal--; startVisit(true); if (i === 1) St.S.cap.visitShort = St.absMin() + 60; }
        else { await PX.Dlg.say('player', PX.Dlg.capTone('오늘은 여기까지요.')); await PX.Dlg.runLines(U.pick(V.homeNo || [['C:응, 알았어.']])); PX.Dlg.close(); g.modal--; if (M) M.noteRefuse('home', 240); release(null, 60); }
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
    if (to === 'inn' && S.rel.cap.stage >= 4 && !PX.Act.innLeaving() && !(PX.Plan && PX.Plan.cur() && PX.Plan.cur().id === 'inn')) setTimeout(() => g.trigger(() => PX.Act.innDesk(true)), 900); // 같이 들어오면 프런트가 바로 방을 묻는다
    if (to === 'rubyway' && from === 'inn' && PX.Act.innLeaving() && V.rubyOut) { const bd = PX.Dlg.pick('v_rubyOut', V.rubyOut); if (bd) g.trigger(async () => { g.modal++; await PX.Dlg.runLines(bd.l); PX.Dlg.close(); g.modal--; }); }
    else if (to === 'rubyway' && V.ruby && S.done.rubyLine !== S.day) { S.done.rubyLine = S.day; const been = Object.keys(S.done).some(k => /^inn_inn_/.test(k)) || S.done.innNightMem; const bd = PX.Dlg.pick('v_ruby', been ? V.ruby.filter(x => !/처음/.test(JSON.stringify(x))) : V.ruby); if (bd) g.trigger(async () => { g.modal++; await PX.Dlg.runLines(bd.l); PX.Dlg.close(); g.modal--; }); }
    if (to === 'q_captain' && V.capHome && S.done.capHomeLine !== S.day) { S.done.capHomeLine = S.day; const bd = PX.Dlg.pick('v_capHome', V.capHome); if (bd) g.trigger(async () => { g.modal++; await PX.Dlg.runLines(bd.l); PX.Dlg.close(); g.modal--; }); }
  }
  // 밖에서 기다리던 대위: 플레이어가 나오면 다시 동행
  function waitOutTick() {
    const g = G(), w = waitOut;
    if (!w) return;
    if (g.mapId === w.inside) return;
    if (g.mapId === w.map) {
      mode = 'follow'; waitOut = null; cap.setDirTo(g.player.x, g.player.y);
      if (w.inside === 'onsen_f' || w.inside === 'onsen_m') { if (PX.Bath) g.trigger(() => PX.Bath.reunite()); return; }
      if (w.inside === 'inn_bathroom') { St.S.cap.bathAlone = false; if (PX.InnBath) g.trigger(() => PX.InnBath.welcomeBack()); return; }
      if (/shower/.test(w.inside)) St.S.lastShower = St.absMin();
      const V = PX.DLG_V2 || {};
      const tb = V.showerOutTease && St.S.rel.cap.stage >= 2 && Math.random() < 0.7 ? PX.Dlg.pick('v_showerOT', V.showerOutTease) : null;
      if (V.showerOut) g.trigger(async () => { g.modal++; await PX.Dlg.runLines(tb ? tb.l : U.pickFresh('showerOut', V.showerOut)); PX.Dlg.close(); g.modal--; });
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
    if (PX.Bday && await PX.Bday.meet()) { /* 생일: 축하가 인사를 대신한다 */ } else
    if (reu && PX.DLG_V2) {
      const bd = PX.Dlg.pick('v_reunion', PX.DLG_V2.reunion);
      await PX.Dlg.runLines(bd ? bd.l : ['C:나 왔어.'], { reply: true });
      if (S.cap.giftPending) { const gid = S.cap.giftPending; S.cap.giftPending = null; cap.doPose('carry', 1.4, 'smile'); await PX.Dlg.runLines(['C:선물. 작전 중에 찾은 거야. 네 생각나서 챙겼어.']); St.addItem(gid); PX.UI.toast(`🎁 ${PX.U.josa(PX.ITEMS[gid].name, '을')} 받았다`); }
      M.mem().reunion = null; M.mem().longing = 20; M.noteMeet(); M.noteTalk('reunion');
      if (r.stage >= 3) { const i = await PX.Dlg.choose([{ t: PX.Dlg.capTone('안아 줄게요.') }, { t: PX.Dlg.capTone('수고했어요.') }]); if (i === 0) { PX.Dlg.close(); g.modal--; await M.perform('fronthug', true); g.modal++; } else await PX.Dlg.say('player', PX.Dlg.capTone('수고했어요.')); }
      g.memory('무사 귀환', `${reu.days}일 만에 돌아온 대위가 제일 먼저 나를 찾아왔다.`, true);
      if (PX.Love) PX.Love.markUrgent('op', 30); // 오늘 밤, 참고 참은 만큼
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
    // 상황에 맞는 제안 · 질문과 그 질문에 맞는 대답 (말투는 관계에 따라)
    const { k } = await PX.Ask.propose();
    if (['follow', 'meal', 'walk', 'escort', 'hand', 'hug', 'kiss', 'sit'].includes(k)) {
      startFollow(); St.addAff(2);
      if (k === 'meal') PX.UI.toast('🍚 같이 식당에 가요 · 식당에서 앉으면 같이 먹을 수 있어요', 3200);
      if (k === 'escort') PX.UI.toast('🏠 대위가 숙소까지 데려다줘요', 2600);
    }
    else if (k === 'alone' || k === 'rest') { if (PX.Mind) PX.Mind.noteRefuse('follow', 600); r.noFollowUntil = (S.day + (S.time.min >= 6 * 60 ? 1 : 0)) * 1440 + 6 * 60; mode = 'sched'; }
    else if (k === 'later') { if (PX.Mind) PX.Mind.noteRefuse('follow', 90); r.lastApproach = St.absMin() + 30; mode = 'sched'; r.noFollowUntil = St.absMin() + 60; }
    PX.Dlg.close(); g.modal--;
    if (k === 'talk') await PX.Dlg.capTalk();
    // 대답에 따라 스킨십 (내가 먼저 청한 것이므로 거절 없이)
    const SK = { hand: 'hand', hug: 'fronthug', kiss: 'kisscheek' };
    if (SK[k] && PX.Mind) { try { await PX.Mind.perform(SK[k], true); } catch (e) { console.error(e); } }
    if (k === 'sit' && !g.player.seat) { const b = PX.W.maps[g.mapId].objs.find(o => o.seats && o.seats.some(x => !x.by) && U.dist(o.x + (o.fw || 1) / 2, o.y + (o.fd || 1) / 2, g.player.x, g.player.y) < 3); const st = b && b.seats.find(x => !x.by); if (st && b.use !== 'bed' && !(b.f && b.f.use === 'bed')) { g.player.x = st.x; g.player.y = st.y; g.player.sitOn(st); } else PX.UI.toast('🪑 가까운 자리에 앉으면 대위도 옆에 앉아요', 2400); }
  }
  // 수색 복귀 후 치료를 받은 뒤: 바로 가 버리지 않고 이후를 정한다
  async function afterTreat() {
    const S = St.S, g = G(), r = S.rel.cap, now = St.absMin();
    if (cap.map !== g.mapId) return;
    g.modal++;
    const { k } = await PX.Ask.propose(false, 'afterTreat');
    PX.Dlg.close(); g.modal--;
    const end = (S.day * 1440) + 21 * 60;
    r.noFollowUntil = 0; r.lastApproach = 0;
    if (k === 'follow') { S.cap.freeWin = { from: now, until: Math.max(end, now + 120) }; startFollow(); St.addAff(2); }
    else if (k === 'later') { S.cap.freeWin = { from: now + 20, until: Math.max(end, now + 140) }; mode = 'sched'; PX.UI.toast('⏳ 대위가 보고를 마치고 찾아올 거예요', 2600); }
    else { S.cap.freeWin = null; mode = 'sched'; }
    if (PX.Mind) { PX.Mind.noteMeet(); PX.Mind.noteTalk('afterTreat'); }
    if (PX.CapAct) PX.CapAct.markField(); // 치료하며 이미 만났다: '다녀왔어' 인사 다시 안 함
  }
  // ---------- 저장 · 불러오기: 동행·방문·대기 상태와 위치를 그대로 ----------
  function saveState() {
    if (!cap) return null;
    return { mode, map: cap.map, x: cap.x, y: cap.y, waitOut, pausedUntil, seat: cap.seat ? { x: cap.seat.x, y: cap.seat.y } : null, pose: cap.pose };
  }
  function restore(st) {
    const KEEP = ['follow', 'visit', 'stay', 'paused', 'waitOut', 'date', 'op', 'wait_door'];
    if (!st || !KEEP.includes(st.mode) || !cap) return false;
    const g = G(), S = St.S;
    mode = st.mode; waitOut = st.waitOut || null; pausedUntil = st.pausedUntil || 0;
    if (mode === 'follow') S.cap.follow = true;
    if (!st.map) { cap.map = null; return true; } // 작전 등으로 부대에 없음
    moveTo(st.map);
    const m = PX.W.maps[st.map];
    if (mode === 'follow' && st.map === g.mapId) { // 동행 중이었으면 내 바로 옆
      const t = PX.Path.nearestWalkable(m, Math.floor(g.player.x) + 1, Math.floor(g.player.y), 3);
      if (t) { cap.x = t[0] + 0.5; cap.y = t[1] + 0.5; }
    } else if (st.x != null && PX.W.walkable(m, Math.floor(st.x), Math.floor(st.y))) { cap.x = st.x; cap.y = st.y; }
    if (st.seat) { const o = m.objs.find(o => o.seats && o.seats.some(x => Math.abs(x.x - st.seat.x) < 0.01 && Math.abs(x.y - st.seat.y) < 0.01)); const seat = o && o.seats.find(x => Math.abs(x.x - st.seat.x) < 0.01 && Math.abs(x.y - st.seat.y) < 0.01); if (seat && !seat.by) { cap.sitOn(seat); if (st.pose) cap.pose = st.pose; } }
    if (PX.Mind) try { PX.Mind.apply(); } catch (e) { /* 무시 */ }
    return true;
  }
  // ---------- 근무·수색 시간이 되었을 때의 작별 (아쉬워하고 · 우물쭈물하고 · 꼭 안고 간다) ----------
  let farewellKey = null;
  const FW_PRE = [['N:대위가 시계를 보고, 나를 보고, 또 시계를 본다.', 'C*:…시계가 고장 났으면 좋겠다.', 'C:가야 돼. 이따 끝나고 찾아갈게.'], ['C:…벌써 시간이 이렇게 됐네.', 'C;:가야 되는데 발이 안 떨어진다.', 'C:이따 꼭 보자.'],
    ['C;:가기 싫다. 이 말 해도 되나 모르겠는데.', 'C^:…해 버렸네. 다녀올게.'], ['N:대위가 몇 걸음 가다 말고 돌아온다.', 'C:…아니, 그냥. 인사 제대로 하려고.', 'C^:이따 봐.']];
  const FW_MID = [['N:대위가 손을 잡았다 놓았다를 몇 번이나 반복한다.', 'C;:…이거 놓으면 진짜 가야 되잖아.', 'C*:이따 다시 잡는다. 예약.'], ['C:근무 끝나면 제일 먼저 너 찾으러 올게.', 'N:그래 놓고 대위는 한참 그 자리에 서 있다.', 'C;:…가라고 등 좀 밀어 줘.'],
    ['C*:오 분만 더 있으면 안 될까. …안 되겠지.', 'N:대위가 머리를 한 번 쓰다듬고서야 돌아선다.']];
  const FW_LOV = [['N:대위가 말없이 끌어안는다. 꽤 오래.', 'C;:…충전 중이야. 근무 버티려면 필요해.', 'C:다녀올게, {cv}.'], ['C*:가기 전에 한 번만.', 'N:이마에 짧게 입을 맞추고, 그래도 아쉬운지 한 번 더 꽉 안는다.', 'C;:…진짜 가야 되는데.'],
    ['N:대위가 뒤에서 껴안고 어깨에 턱을 얹는다.', 'C:…딱 열까지만 세고 갈게. 하나, 둘…', 'C*:…열. 아니, 다시 하나부터 셀까.'], ['C;:오 분만 더 있다 가면 안 될까. 중령님 무섭긴 한데.', 'N:대위가 손을 놓았다가, 다시 잡았다가, 결국 품에 한 번 끌어안고서야 놓는다.'],
    ['N:대위가 정수리에 볼을 대고 한참 숨을 쉰다.', 'C:…네 냄새 기억해 두는 중. 근무 중에 꺼내 쓰게.'], ['C^:갔다 올게. 뽀뽀는 이따 두 배로.', 'N:말은 그렇게 해 놓고 대위가 볼에 하나를 먼저 남긴다.', 'C*:…선불이야.']];
  const FW_FIELD = [['C:외곽 나간다. 다섯 시쯤 올 거야.', 'N:대위가 꼭 끌어안는다. 군복에서 기름 냄새가 난다.', 'C:…무사히 갔다 올게. 약속.'], ['C;:수색 나갈 때가 제일 싫어. 너 두고 가니까.', 'C^:모래 잔뜩 묻혀 올 테니까 털어 줘.']];
  function startFarewell(k) {
    const g = G(), S = St.S, key = S.day + ':' + k + ':' + Math.floor(S.time.min / 120);
    if (farewellKey === key || g.modal) { if (farewellKey === key && mode !== 'linger') release(); return; }
    farewellKey = key; mode = 'linger'; cap.stop();
    g.trigger(async () => {
      const r = S.rel.cap, st = r.stage, M = PX.Mind;
      if (cap.map !== g.mapId || cap.hidden) { mode = 'follow'; release(null, 30); return; } // 그사이 떨어졌으면 조용히 간다
      g.modal++;
      try {
        cap.setDirTo(g.player.x, g.player.y); g.player.setDirTo(cap.x, cap.y);
        const pool = (k === 'field' && st >= 3 ? FW_FIELD : []).concat(st >= 4 ? FW_LOV : st >= 3 ? FW_MID.concat(FW_LOV.slice(0, 2)) : st >= 2 ? FW_MID.concat(FW_PRE) : FW_PRE);
        // 연인 이상이면 껴안고 (앉아 있으면 앉은 채로)
        if (st >= 3 && M && !M.refused('fronthug') && !g.player.seat) { M.setContact('FRONT_HUG'); }
        await PX.Dlg.runLines(PX.Dlg.capPick(pool));
        if (st >= 2) {
          const i = await PX.Dlg.choose([{ t: st >= 4 ? '조금만 더 있다 가.' : '조금만 더 있다 가요.' }, { t: st >= 4 ? '얼른 가. 늦어.' : '얼른 가세요. 늦어요.' }]);
          await PX.Dlg.say('player', i === 0 ? (st >= 4 ? '조금만 더 있다 가.' : '조금만 더 있다 가요.') : (st >= 4 ? '얼른 가. 늦어.' : '얼른 가세요. 늦어요.'), i === 0 ? 'blush' : 'normal');
          if (i === 0) { await PX.Dlg.runLines(PX.Dlg.capPick([['C^:…응. 오 분만. 진짜 오 분.', 'N:오 분이 십 분이 된다. 결국 대위의 단말이 울린다.', 'C;:…혼나러 간다. 근데 하나도 후회 안 해.'], ['C~:그 말 기다렸어.', 'N:대위가 다시 꼭 끌어안는다. 이번엔 더 오래.', 'C:…됐다. 이제 진짜 간다.'], ['N:대위가 그 자리에 다시 앉는다. 시계는 일부러 안 본다.', 'C*:지각 사유: 애인이 붙잡음. 이거면 통과될까.']])); St.advance(10); St.addAff(2); }
          else await PX.Dlg.runLines(PX.Dlg.capPick([['C:…응. 너 말 들을게.', 'C*:대신 이따 마중 나와.'], ['C^:알았어. 걱정해 주는 거지? 그거면 됐어.'], ['C;:…쫓겨났다. 서운한데 맞는 말이라 할 말이 없네.']]));
        }
      } finally {
        if (PX.Mind && PX.Mind.contact() !== 'NONE') PX.Mind.setContact('NONE');
        cap.tempPose = null; g.player.tempPose = null;
        PX.Dlg.close(); g.modal--;
        mode = 'follow'; release(null, 30);
        setTimeout(() => G().bubble(cap, PX.Dlg.capPick(['…진짜 간다.', '이따 봐!', '뒤돌아보면 못 갈 것 같아서 안 돌아본다.', '…한 번만 더 볼게.', '도망가지 마. 이따 찾으러 온다.', '다녀올게!'])), 1800);
      }
    });
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
      if (sofa && Math.random() < 0.4) { const seat = sofa.seats.find(s => !s.by); cap.goTo(m, Math.floor(seat.x), Math.floor(seat.y + 1), () => cap.sitOn(seat)); }
      else { const p = g.player; const t = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => [Math.floor(p.x) + dx, Math.floor(p.y) + dy]).find(([x, y]) => PX.W.walkable(m, x, y)); if (t) cap.goTo(m, t[0], t[1], () => cap.setDirTo(p.x, p.y)); } // 늘 소파로 가지 않고 내 옆에 서 있기도
    });
  }
  async function knock() {
    const S = St.S, g = G(), D = PX.DLG_CAP;
    g.modal++;
    await PX.Dlg.runLines(U.pick(D.knock));
    const i = await PX.Dlg.choose([{ t: PX.Dlg.capTone('들어오라고 한다') }, { t: PX.Dlg.capTone('밖으로 나가서 만난다') }, { t: PX.Dlg.capTone('오늘은 쉬고 싶다고 말한다') }]);
    PX.Dlg.close(); g.modal--;
    if (i === 0) { await PX.Dlg.say('player', PX.Dlg.capTone('들어와요.')); PX.Dlg.close(); startVisit(); }
    else if (i === 1) { g.goOutside(); startFollow(); g.trigger(async () => { await PX.Dlg.say('cap', '나와 줬네. 산책할래?', 'smile'); PX.Dlg.close(); }); }
    else {
      await PX.Dlg.say('player', PX.Dlg.capTone('오늘은 좀 쉬고 싶어요.'));
      await PX.Dlg.say('cap', PX.Dlg.capPick(['응, 알았어. 푹 자. 내일 보자.', '그래. 얼굴은 내일 보면 되지. 잘 자.']), 'smile'); PX.Dlg.close();
      S.rel.cap.noFollowUntil = (S.day + 1) * 1440 + 6 * 60; release();
    }
  }
  // 방문 중 밤: 숙박 요청 또는 귀가
  // 침대에서 같이 자기로 했을 때: 나는 침대에 눕고 대위는 옆자리(1인용이면 반씩)
  function bedTogether() {
    const g = G();
    if (!PX.Bed || g.mapId !== cap.map) return false;
    const f = document.getElementById('fade'); if (f) { f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 300); }
    if (!PX.Bed.lieDown()) return false;
    PX.Bed.capOnBed();
    if (PX.Mind && St.S.rel.cap.stage >= 4) PX.Mind.setContact('CUDDLE');
    cap.setDirTo(g.player.x, g.player.y);
    return true;
  }
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
      await PX.Dlg.say('player', PX.Dlg.capTone(opts[i].t));
      if (opts[i].k !== 'no') {
        await PX.Dlg.runLines(U.pick(D.stayYes));
        S.cap.stay = opts[i].k; mode = 'stay'; St.addAff(6);
        if (!S.done.firstStay) { S.done.firstStay = 1; g.memory('첫 숙박', `${PX.U.josa(S.capName, '이')} 내 숙소에서 하룻밤 머물렀다.${opts[i].k === 'bed' ? ' 좁은 침대에서 같이.' : ' 소파 밖으로 다리가 삐져나왔다.'}`, true); }
        if (opts[i].k === 'bed') bedTogether(); // 침대에서 같이: 둘 다 침대로
        else {
          const m = PX.W.maps[homeId()];
          const sofa = m.objs.find(o => o.kind === 'furn' && o.fid.startsWith('sofa'));
          if (sofa) cap.sitOn(sofa.seats.find(s => !s.by) || sofa.seats[0]);
          cap.pose = 'lie';
        }
      } else {
        await PX.Dlg.runLines(U.pick(D.stayNo));
        leaveHome();
      }
      PX.Dlg.close(); g.modal--;
    } else if (S.time.min >= 22 * 60 + 20) {
      g.modal++;
      await PX.Dlg.say('cap', U.fmt(U.pickFresh('capGoHome', [St.isWeekend() ? '늦었다. 나 갈게. 푹 자.' : '내일 아침 일찍 브리핑이야. 간다. 문 잠가.', '늦었다. 나 갈게. 잘 자.', '오늘 좋았다. 진짜로. 잘 자.', '더 있으면 안 갈 것 같아서 지금 간다.', '문 잠그는 소리 듣고 갈게.', '{p아}, 잘 자. 꿈에 나 나와도 놀라지 마.']), PX.Dlg.ctx()), 'smile');
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
    if (S.outbox && S.outbox.length) return; // 내가 보낸 메시지에 아직 답장 안 했으면 딴소리 먼저 하지 않는다
    if (S.time.min < 8 * 60 || S.time.min > 23 * 60 + 30) return;
    if (now - (S.cap.lastMsgMin || 0) < 150 || Math.random() > 0.3) return;
    if (r.noFollowUntil > now && S.time.min > 21 * 60) return;
    S.cap.lastMsgMin = now;
    let msg;
    if (PX.Op && PX.Op.isAway && PX.Op.isAway('cap')) return; /* 장기작전 중엔 작전 메시지만 */
    if (spotKind() === 'field') msg = { t: U.pickFresh('fieldMsg', ['여긴 별일 없어. 너는?', '외곽 모래 장난 아니다. 너는 실내지?', '지금 잠깐 쉬는 중. 너 생각나서.', '오늘 수색 구역은 바위가 많아. 등산하는 기분이야.', '드론이 은빛 이끼 군락 찍었어. 이따 보여 줄게.', '물 마시는 중. 네가 물 많이 마시라고 해서.', '바람 방향 바뀌었다. 오늘은 일찍 들어갈 수도 있어.', '정시우가 또 도마뱀 보고 놀랐어. 귀엽지.', '외곽인데 단말 잘 터진다. 그래서 보내는 거야.', '다섯 시까지 두 시간. 버틴다. 너 보러 간다.']), r: [['저도 별일 없어요.', 2, '다행이다. 다섯 시에 봐.'], ['조심하세요.', 3, '응. 너 보러 꼭 무사히 갈게.']] };
    else msg = PX.Dlg.pick('msg', PX.DLG_CAP.msg);
    if (!msg) return;
    S.messages.unshift({ id: now, t: msg.t, r: msg.r, day: S.day, min: S.time.min, reply: null });
    S.messages = S.messages.slice(0, 40);
    PX.UI.toast(`📱 ${S.capName}: ${msg.t}`, 4000);
    PX.UI.badge();
    if (Math.random() < 0.25 && spotKind() === 'field') S.cap.giftPending = Math.random() < 0.5 ? 'capStone' : 'capSnack';
  }

  return { bedTogether, saveState, restore, afterTreat, pause, forceLeave, sitNear, init, update, status, onDuty, isMeal, atPlayerWork, release, startFollow, startVisit, doSkin, beforeSleep, morningAfter, msgTick, moveTo, get mode() { return mode; }, set mode(v) { mode = v; }, spotKind, homeId, bump };
})();
