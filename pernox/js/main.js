// 게임 본체: 루프 · 입력 · 상호작용 · 맵 이동 · 잠 · 근무 · 사진첩
'use strict';
(() => {
  const U = PX.U, St = PX.St, Cal = PX.Cal, W = PX.W, A = PX.A, UI = PX.UI, Dlg = PX.Dlg, Cap = PX.Cap;
  const $ = id => document.getElementById(id);
  const Game = PX.Game = {
    player: null, cap: null, npcs: [], actors: [], mapId: null, prevMap: null, modal: 0, sleeping: false, inMini: false, transition: false, running: false,
    queue: [], target: null, bubbles: [], logLines: [],
  };

  // ---------- 시작 ----------
  function initWorld() {
    for (const id in PX.MAPS) W.build(id);
    A.indexSpots();
    const S = St.S;
    const home = W.maps[PX.JOBS[S.player.job].home];
    if (S.homeLayout && S.homeMap === home.id) PX.Decor.applyLayout(home, S.homeLayout);
    PX.Decor.applyAll();
    Game.player = new A.Actor('player', PX.S.playerApp(S.player, St.season()), { name: S.player.name, speed: 3.4 });
    Game.cap = new A.NPC(PX.NPC_BY_ID.cap); Game.capOutfit(); Game.cap.name = S.capName; Game.cap.speed = 3.3; Game.cap.big = true;
    Game.npcs = PX.NPCS.filter(n => n.id !== 'cap').map(n => new A.NPC(n));
    Game.actors = [Game.player, Game.cap, ...Game.npcs];
    Cap.init(Game.cap);
    if (S.cap.stay) Cap.mode = 'stay';
  }
  // 대위 복장: 여름엔 재킷 없이 군용 나시, 그 외엔 나시 위에 앞이 열린 위장 재킷
  Game.capOutfit = () => { const base = PX.NPC_BY_ID.cap.look; Game.cap.app = St.season() === 'summer' ? Object.assign({}, base, { jacket: null, sleeve: 'none' }) : base; };
  Game.startNew = (f) => {
    St.newGame(f);
    St.S.quests = []; St.S.codex = {}; St.makeQuests();
    initWorld();
    const S = St.S;
    const home = PX.JOBS[S.player.job].home;
    enterMap(home, 7.5, 5.5, true);
    Game.player.dir = 0;
    for (const n of Game.npcs) n.place(S);
    Game.cap.place(S);
    St.save();
    run();
    Game.trigger(intro);
  };
  Game.loadSlot = (n) => {
    if (!St.load(n)) { UI.toast('불러오지 못했어요'); return; }
    $('title').classList.add('hidden');
    initWorld();
    const S = St.S;
    enterMap(S.pos.map, S.pos.x, S.pos.y, true);
    for (const n2 of Game.npcs) n2.place(S);
    if (Cap.mode === 'stay') { const m = W.maps[Cap.homeId()]; Cap.moveTo(Cap.homeId()); const sofa = m.objs.find(o => o.kind === 'furn' && o.fid.startsWith('sofa')); if (sofa) Game.cap.sitOn(sofa.seats[0]); Game.cap.pose = 'lie'; }
    else Game.cap.place(S);
    run();
    UI.toast(`📂 저장 칸 ${n} 불러옴 · ${Cal.fmtDate(S.time)} ${Cal.fmtTime(S.time.min)}`);
  };
  Game.toTitle = () => { Game.running = false; $('hud').classList.add('hidden'); UI.title(); };
  Game.beforeSave = (S) => { S.pos = { map: Game.mapId, x: Game.player.x, y: Game.player.y }; };

  async function intro() {
    const S = St.S, job = PX.JOBS[S.player.job];
    Game.modal++;
    await Dlg.say('narr', `${Cal.fmtDate(S.time)}. 제5행성 페르녹스, 지구군 606부대.`);
    await Dlg.say('narr', '전쟁은 끝나 가고, 이 붉은 행성에선 경계와 관리의 날들이 이어진다.');
    await Dlg.say('narr', `${S.player.name} — ${job.ko}. 이곳에 온 지 꼭 일 년이 되었다.`);
    await Dlg.say('narr', `그리고 일 년 전 처음 만난 날부터, ${U.josa(S.capName, '은')} 한 번도 마음을 숨긴 적이 없다.`);
    Dlg.close(); Game.modal--;
    UI.toast('👆 화면을 누르면 그곳으로 걸어가요. 문·가구·사람을 누르면 상호작용해요.', 5000);
    setTimeout(() => UI.toast('📟 단말에서 일정표·근무표·관계도를 볼 수 있어요.', 4500), 5200);
  }
  // 첫 외출: 대위가 문 앞에서 기다린다
  async function firstMeet() {
    const S = St.S;
    S.done.intro = 1;
    const m = W.maps[Game.mapId];
    const p = Game.player;
    const t = PX.Path.nearestWalkable(m, p.x + 1.5, p.y + 0.5);
    Cap.moveTo(Game.mapId); if (t) { Game.cap.x = t[0] + 0.5; Game.cap.y = t[1] + 0.5; }
    Game.cap.setDirTo(p.x, p.y);
    Game.modal++;
    await Dlg.runLines(['N:문을 나서자 커다란 그림자가 기다리고 있다.', 'C*:어, 나왔네. 좋은 아침.', 'P:…또 기다리셨어요?', 'C:응. 브리핑 전에 얼굴 보려고.', 'C^:오늘도 무사히. 근무 끝나면 찾으러 갈게.']);
    Dlg.close(); Game.modal--;
    St.addAff(3);
    Game.memory('일 년째 아침', `${PX.U.josa(S.capName, '이')} 숙소 앞에서 기다리고 있었다. 오늘도.`, true);
    Cap.mode = 'sched';
  }

  // ---------- 맵 이동 ----------
  function enterMap(id, x, y, silent) {
    if (id !== 'mask' && PX.Ruby) PX.Ruby.unmask();
    Game.prevMap = Game.mapId;
    Game.mapId = id;
    const p = Game.player;
    p.leaveSeat(); p.stop(); p.map = id; p.x = x; p.y = y;
    const m = W.maps[id];
    const t = PX.Path.nearestWalkable(m, x, y); if (t && !W.walkable(m, Math.floor(x), Math.floor(y))) { p.x = t[0] + 0.5; p.y = t[1] + 0.5; }
    // 이 맵에 있어야 할 NPC 즉시 배치 (보이지 않던 사이 위치 동기화)
    for (const n of Game.npcs) { if (n.map === id || n.desired(St.S).map === id) n.place(St.S); }
    if (Cap.mode === 'sched' && Game.cap.map !== id && Game.cap.desired(St.S).map === id) Game.cap.place(St.S);
    Game.target = null;
    W.view.camX = W.G ? 0 : 0;
    snapCam();
    if (!silent) { PX.Audio.door(); fade(); St.save(); }
    UI.hud();
    $('decorBtn').textContent = PX.MAPS[id].home ? '🛋️' : '🛠️';
    $('decorBtn').setAttribute('aria-label', PX.MAPS[id].home ? '숙소 꾸미기' : '맵 편집');
    W.updateEvents(m, St.S.time, St.S.time.min);
    PX.Act.spawnCritters(m);
    if (!silent) dateCheck(id);
    if (!silent && !St.S.done.intro && PX.MAPS[id].kind === 'out' && Game.prevMap === PX.JOBS[St.S.player.job].home && St.S.time.min < 12 * 60) Game.trigger(firstMeet);
    if (PX.Rom && PX.MAPS[id].kind === 'out') setTimeout(() => { if (Game.mapId === id) PX.Rom.festivalScene(); }, 900);
  }
  Game.enterMap = enterMap;
  let capCommentT = 40;
  Game.fade = () => fade();
  Game.sleepUntil = (h, p) => sleepUntil(h, p);
  function fade() { const f = $('fade'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 260); }
  function enterBuilding(door) {
    const S = St.S;
    const act = door.bld && door.bld.b.act;
    if (act) { if (act.shop) return UI.shop(act.shop); if (act.travel) return PX.Act.travelMenu(); }
    if (door.closed) { UI.toast(door.closedMsg || `🚧 ${door.name} — 아직 문을 열지 않았어요`); return; }
    const hrs = door.bld && door.bld.b.hours;
    if (hrs) { const t = S.time.min, a = Cal.toMin(hrs[0]), b = Cal.toMin(hrs[1]); const open = a < b ? t >= a && t < b : t >= a || t < b; if (!open) { UI.toast(`🌙 ${door.name} — 영업시간 ${hrs[0]}~${hrs[1]}`); return; } }
    const to = door.to;
    if (to === 'q_captain') {
      const capIn = Game.cap.map === 'q_captain';
      if (!(capIn || Cap.mode === 'follow' || S.rel.cap.stage >= 4)) { UI.toast('🔒 대위 개인 막사 — 문이 잠겨 있다. 대위가 있을 때 오자.'); return; }
      if (capIn && Cap.mode !== 'follow') Game.trigger(async () => { Game.modal++; await Dlg.runLines(['N:똑똑.', 'C!:어? 너야?', 'C*:들어와. 냉각기 최저야, 춥다?']); Dlg.close(); Game.modal--; });
    }
    if (to === 'apt_player' && S.player.job !== 'researcher' || to === 'q_player' && S.player.job === 'researcher') { UI.toast('🔒 다른 사람의 숙소예요'); return; }
    if (PX.MAPS[to].parent === 'base' && !PX.JOBS[S.player.job].military && !St.has('pass')) { UI.toast('🪪 출입 허가증이 필요해요'); return; }
    const m = W.maps[to];
    enterMap(to, m.exit.x + 0.5, m.exit.y - 0.5);
    Game.player.dir = 2;
  }
  function leaveRoom() {
    const m = W.maps[Game.mapId];
    if (m.def.exitTo) { // 은밀숙소 객실 → 로비
      const lb = W.maps[m.def.exitTo];
      enterMap(lb.id, lb.exit.x + 0.5, lb.exit.y - 2.5); Game.player.dir = 2; return;
    }
    const out = W.maps[m.def.parent];
    const d = out.doors.find(d => d.to === m.id);
    enterMap(out.id, d.x + 0.5, d.y + 0.5);
    const b = d.bld.b;
    Game.player.dir = b.door.f === 'L' ? 0 : 1;
  }
  Game.goOutside = () => { if (PX.MAPS[Game.mapId].kind === 'in') leaveRoom(); };
  function shuttle() {
    const S = St.S, from = Game.mapId, to = from === 'base' ? 'dome' : 'base';
    if (to === 'base' && !PX.JOBS[S.player.job].military && !St.has('pass')) { UI.toast('🪪 부대 출입 허가증이 필요해요'); return; }
    UI.menu('셔틀 정류장', [{ t: to === 'dome' ? '🚌 돔시티행 셔틀 타기' : '🚌 606부대행 셔틀 타기', sub: '30분 · 무료', fn: async () => {
      const following = Cap.mode === 'follow';
      fade(); St.advance(30);
      const sp = to === 'dome' ? [23.5, 40.5] : [27.5, 58.5];
      enterMap(to, sp[0], sp[1]);
      if (following) { Cap.moveTo(to); Game.cap.x = sp[0] + 1; Game.cap.y = sp[1]; Cap.mode = 'follow'; }
      UI.toast(`🚌 ${PX.MAPS[to].name} 도착`);
    } }]);
  }

  // ---------- 이벤트 큐 ----------
  Game.trigger = (fn) => { Game.queue.push(fn); };
  async function pump() {
    if (Game.busyEvent || Game.modal || !Game.queue.length) return;
    Game.busyEvent = true;
    const fn = Game.queue.shift();
    try { await fn(); } catch (e) { console.error(e); Game.modal = Math.max(0, Game.modal); }
    Game.busyEvent = false;
  }

  // ---------- 말풍선 · 기록 · 사진 ----------
  Game.bubble = (actor, text, sec = 3) => {
    const b = U.el('div', { class: 'bubble' }, text);
    $('bubbles').append(b);
    Game.bubbles.push({ actor, el: b, until: performance.now() + sec * 1000 });
  };
  Game.log = (name, text) => { const S = St.S; if (!S) return; S.history.push([S.day, S.time.min, name, text]); if (S.history.length > 80) S.history.splice(0, S.history.length - 80); };
  Game.codex = (id) => {
    const S = St.S; S.codex = S.codex || {};
    if (S.codex[id]) return false;
    const e = PX.CODEX.find(c => c.id === id); if (!e) return false;
    S.codex[id] = S.day;
    UI.toast(`📗 생태도감 등록: ${e.n}`);
    return true;
  };
  Game.memory = (title, text, snap) => {
    const S = St.S;
    let img = null;
    if (snap) {
      try {
        const v = W.view, p = Game.player;
        const [sx, sy] = W.toScreen(p.x, p.y);
        const c = PX.G.canvas(96, 72), g = c.getContext('2d');
        g.drawImage(v.cv, sx - 48, sy - 50, 96, 72, 0, 0, 96, 72);
        img = c.toDataURL('image/png');
      } catch (e) { img = null; }
    }
    S.album.push({ title, text, date: Cal.fmtDate(S.time) + ' ' + Cal.fmtTime(S.time.min), place: PX.MAPS[Game.mapId].name, img });
    if (S.album.length > 30) S.album.splice(0, S.album.length - 30);
    UI.toast(`📷 추억 기록: ${title}`);
  };

  // ---------- 상호작용 ----------
  const MEALS = [['07:00', '09:00'], ['11:30', '13:30'], ['17:30', '19:30']];
  const MENU = ['김치찌개', '된장국과 즉석밥', '통조림 햄 볶음밥', '냉동 만두 국', '라면 (보급 지연)', '뿌리채소 카레', '냉동 삼겹살 구이'];
  function useObj(o) {
    const S = St.S, f = o.f, home = PX.MAPS[Game.mapId].home, job = PX.JOBS[S.player.job];
    if (PX.Act.LABEL[o.use] || (o.use === 'shop' && Game.mapId === 'inn')) { PX.Act.use(o); return; }
    switch (o.use) {
      case 'bed':
        if (home) return sleepMenu();
        if (PX.MAPS[Game.mapId].innRoom) return PX.Act.innBed(o);
        return sit(o, '잠깐 눕기');
      case 'sit': return sit(o);
      case 'terminal': return UI.terminal();
      case 'album': return UI.terminal('album');
      case 'storage': return UI.terminal('inv');
      case 'shop': return UI.shop({ cafe: 'cafe', samgyup: 'samgyup', flower: 'flower', arcade: 'arcade' }[Game.mapId] || 'px');
      case 'grill': return grill(o);
      case 'claw': return claw();
      case 'show': return show();
      case 'stall': return UI.shop('festival');
      case 'vending': return UI.shop('vending');
      case 'meal': return meal();
      case 'work': return work(o);
      case 'wardrobe': return wardrobe();
      case 'fridge': return fridge();
      case 'kitchen': return cook();
      case 'tv': return tv();
      case 'cooler': return say1(Cap.mode === 'visit' || Game.cap.map === Game.mapId ? 'C*:최저로 해. 아니, 너 추우면 내가 안아 줄게.' : 'N:냉각기를 켰다. 서늘한 바람이 나온다.');
      case 'shower': St.advance(15); S.energy = Math.min(100, S.energy + 10); fade(); return UI.toast('🚿 개운하게 씻었다 (기력 +10)');
      case 'sink': return UI.toast('🫧 손을 씻었다');
      case 'workout': { St.advance(30); S.energy = Math.max(0, S.energy - 8); Game.player.doPose('workout', 2.5); UI.toast('💪 30분 운동했다 (기력 -8)'); if (Game.cap.map === Game.mapId && Math.random() < 0.5) Game.bubble(Game.cap, U.pick(['자세 좋다.', '무리하지 마.', '나랑 같이 할래?'])); return; }
      case 'arcade': return arcade();
      case 'game': St.advance(30); return UI.toast('🃏 카드 게임 한 판. ' + U.pick(['이겼다!', '졌다…', '비겼다.']));
      case 'inspect': return inspect(o);
      case 'kiosk': return kiosk();
      case 'shuttle': return shuttle();
      case 'desk': return UI.toast(U.pick(['📄 서류가 가지런히 쌓여 있다.', '🖥️ 화면에 근무 일정표가 떠 있다.', '📡 통신 기록이 흘러간다.']));
    }
  }
  async function say1(line) { Game.modal++; await Dlg.runLines([line]); Dlg.close(); Game.modal--; }
  function sit(o, label) {
    const p = Game.player;
    const seat = o.seats.filter(s => !s.by).sort((a, b) => U.dist(a.x, a.y, p.x, p.y) - U.dist(b.x, b.y, p.x, p.y))[0];
    if (!seat) { UI.toast('빈자리가 없어요'); return; }
    p.sitOn(seat);
  }
  function standUp() {
    Game.player.leaveSeat();
    if (Game.cap.seat && (Cap.mode === 'follow' || Cap.mode === 'visit')) { if (Cap.mode === 'follow') Game.cap.leaveSeat(); }
  }
  async function sleepMenu() {
    const S = St.S;
    const it = await UI.menu('침대', [
      { t: '😴 잠자기 (아침 6시)', k: 6 }, { t: '😴 잠자기 (아침 7시)', k: 7 }, { t: '😪 늦잠 (아침 9시)', k: 9 }, { t: '🛏️ 낮잠 1시간', k: 'nap' }]);
    if (!it) return;
    await Cap.beforeSleep();
    if (it.k === 'nap') { fade(); St.advance(60); S.energy = Math.min(100, S.energy + 15); UI.toast('💤 한숨 잤다 (기력 +15)'); return; }
    await sleepUntil(it.k);
  }
  async function sleepUntil(hour, passOut) {
    const S = St.S;
    if (Cap.forceLeave()) UI.toast(`${PX.U.josa(S.capName, '은')} 조용히 막사로 돌아갔다`);
    if (Cap.mode === 'follow') Cap.release();
    Game.sleeping = true;
    const f = $('fade'); f.classList.add('on', 'long');
    const mins = ((hour * 60 - S.time.min) + 1440) % 1440 || 1440;
    await U.sleep(600);
    St.advance(mins);
    S.energy = passOut ? 55 : Math.min(100, 70 + Math.min(30, mins / 16));
    if (passOut) { const home = PX.JOBS[S.player.job].home, m = W.maps[home]; enterMap(home, m.exit.x + 0.5, m.exit.y - 1.5, true); }
    for (const n of Game.npcs) n.place(S);
    if (Cap.mode !== 'stay') Game.cap.place(S);
    Game.sleeping = false;
    St.save();
    await U.sleep(400);
    f.classList.remove('on', 'long');
    const ev = Cal.eventsOn(S.time);
    UI.toast(`☀️ ${Cal.fmtDate(S.time)} ${Cal.fmtTime(S.time.min)} · ${Cal.WEATHER[St.weather()].icon} ${Cal.WEATHER[St.weather()].ko}`, 3500);
    if (ev.length) setTimeout(() => UI.toast('📅 오늘: ' + ev.map(e => e.originalTitle).join(', '), 4500), 1200);
    if (S.cap.stay) Game.trigger(() => Cap.morningAfter());
  }
  async function meal() {
    const S = St.S, t = S.time.min;
    const open = MEALS.some(([a, b]) => t >= Cal.toMin(a) && t < Cal.toMin(b));
    if (!open) { UI.toast('🍽️ 배식 시간이 아니에요 (07:00~09:00 · 11:30~13:30 · 17:30~19:30)'); return; }
    if (S.ateMeal === S.day + ':' + Math.floor(t / 300)) { UI.toast('이번 끼니는 이미 먹었어요'); return; }
    const special = Cal.eventsOn(S.time).some(e => e.id === 'LB82');
    const menu = special ? '🎉 부대 특식: 냉동 삼겹살 구이 + 김치찌개' : MENU[(S.day + Math.floor(t / 300)) % MENU.length];
    const civ = !PX.JOBS[S.player.job].military;
    if (civ && !St.spend(8)) { UI.toast('돈이 모자라요 (민간인 식권 ₢8)'); return; }
    S.ateMeal = S.day + ':' + Math.floor(t / 300);
    S.energy = Math.min(100, S.energy + (special ? 45 : 35));
    UI.toast(`🍱 오늘 메뉴: ${menu}${civ ? ' (₢8)' : ''} · 기력 +${special ? 45 : 35}`);
    // 빈자리에 앉아 먹기
    const m = W.maps[Game.mapId], p = Game.player;
    let best = null, bd = 99;
    for (const o of m.objs) if (o.fid === 'bench') for (const s of o.seats) if (!s.by) { const d = U.dist(s.x, s.y, p.x, p.y); if (d < bd) { bd = d; best = s; } }
    if (best) { const a = W.accessTile(m, best.obj); p.goTo(m, a.x, a.y, () => { p.sitOn(best); p.doPose('eat', 6); St.advance(20); }); }
  }
  async function work(o) {
    const S = St.S, job = PX.JOBS[S.player.job];
    if (o.spot !== job.workSpot) { UI.toast(`🔧 ${o.f.name} — ${job.short}의 업무 자리가 아니에요`); return; }
    if (St.isWeekend()) { UI.toast('🏖️ 오늘은 비번(주말)이에요'); return; }
    if (PX.Rom.onLeave('p', S.day)) { UI.toast('🏖️ 오늘은 휴가예요. 푹 쉬세요'); return; }
    if (PX.Op.inField()) { UI.toast('🛰️ 작전 중이에요. 작전 일과는 안내 단말에서'); return; }
    const t = S.time.min;
    const shift = t >= 9 * 60 && t < 12 * 60 ? 0 : t >= 13 * 60 && t < 17 * 60 ? 1 : -1;
    if (shift < 0) { UI.toast('⏰ 근무 시간이 아니에요 (09:00~12:00, 13:00~17:00)'); return; }
    const key = S.day + ':' + shift;
    if (S.workLog[key]) { UI.toast('이번 근무는 이미 마쳤어요'); return; }
    if (S.energy < 12) { UI.toast('😵 너무 피곤해서 일할 수 없어요. 뭘 좀 먹거나 쉬어요.'); return; }
    const ctx = {};
    if (job.mini === 'treat') ctx.patient = Cap.spotKind() === 'duty' && Math.random() < 0.3 ? S.capName + ' 대위' : U.pick(['정시우 일병', '최민재 병장', '이준혁 하사', '외곽 경계병']);
    const score = await PX.Mini.run(job.mini, ctx);
    for (const id of (PX.Mini.lastFound || [])) Game.codex(id);
    if (job.mini === 'circuit' && score > 0.6) Game.codex('mineral');
    const pay = Math.round(job.pay * (0.6 + 0.6 * score));
    S.money += pay; S.energy = Math.max(0, S.energy - 18); S.workLog[key] = 1; S.workLog[S.day] = (S.workLog[S.day] || 0) + 1; S.stats.work++;
    const end = shift === 0 ? 12 * 60 : 17 * 60;
    if (S.time.min < end) St.advance(end - S.time.min);
    UI.toast(`💰 급여 ₢${pay} · 기력 -18`);
    PX.Audio.coin();
    if (ctx.patient && ctx.patient.startsWith(S.capName)) Game.trigger(async () => { Game.modal++; await Dlg.runLines(['C*:선생님 손 진짜 부드럽다.', 'C^:다음에 또 다쳐 와야겠다.', { q: [['다치지 마세요.', 3, ['C:응. 네가 그러라면.']], ['일부러 다치면 혼나요.', 2, ['C*:혼나는 것도 좋은데.']]] }]); Dlg.close(); Game.modal--; });
    if (!S.done.firstWork) { S.done.firstWork = 1; Game.memory('첫 근무', `${U.josa(job.ko, '으로')}서의 하루. 급여 ₢${pay}.`, true); }
    for (const n of Game.npcs) n.place(S);
  }
  async function wardrobe() {
    const S = St.S;
    const it = await UI.menu('옷장', Object.entries(PX.S.OUTFITS).map(([k, o]) => ({ t: (S.player.outfit === k ? '✔ ' : '') + o.ko, k })));
    if (!it) return;
    S.player.outfit = it.k; Game.player.app = PX.S.playerApp(S.player, St.season());
    UI.toast('👕 옷을 갈아입었다');
    if (Cap.mode === 'visit' || (Game.cap.map === Game.mapId && Cap.mode === 'follow')) setTimeout(() => Game.bubble(Game.cap, U.pick(['오, 그거 잘 어울린다.', '…나 지금 눈 둘 데가 없다.', '예쁘다. 그거 입고 나랑 나가자.'])), 600);
  }
  function fridge() {
    const S = St.S;
    if ((S.fridgeDay || '') === S.day + ':' + (S.fridgeN || 0) && (S.fridgeN || 0) >= 3) { UI.toast('냉장고가 텅 비었다'); return; }
    if (S.fridgeDay && !S.fridgeDay.startsWith(S.day + ':')) S.fridgeN = 0;
    S.fridgeN = (S.fridgeN || 0) + 1; S.fridgeDay = S.day + ':' + S.fridgeN;
    S.energy = Math.min(100, S.energy + 5);
    UI.toast('🧊 시원한 물 한 잔 (기력 +5)');
  }
  async function cook() {
    const S = St.S;
    const withCap = Cap.mode === 'visit' && Game.cap.map === Game.mapId;
    fade(); St.advance(30); S.energy = Math.min(100, S.energy + 20);
    Game.player.doPose('work', 2);
    if (withCap) {
      Game.modal++;
      await Dlg.runLines(['N:좁은 주방에 둘이 서니 어깨가 자꾸 닿는다.', 'C*:칼질은 내가 할게. 넌 간 봐.', 'C^:…맛있다. 우리 둘이 하면 뭐든 되네.']);
      Dlg.close(); Game.modal--; St.addAff(5);
      if (!S.done.cookTogether) { S.done.cookTogether = 1; Game.memory('함께 요리하기', '좁은 주방에서 같이 만든 저녁.', true); }
    } else UI.toast('🍳 간단히 요리해 먹었다 (기력 +20)');
  }
  async function tv() {
    const S = St.S;
    const withCap = Cap.mode === 'visit' && Game.cap.map === Game.mapId;
    fade(); St.advance(60);
    if (withCap) {
      Game.modal++;
      await Dlg.runLines([U.pick(['N:옛날 지구 영화. 무서운 장면마다 대위가 슬쩍 가까이 온다.', 'N:로맨스 영화. 대위는 화면보다 내 옆얼굴을 더 오래 본다.', 'N:우주 전쟁 영화. 대위가 "저건 고증이 틀렸어"를 다섯 번 말한다.']), 'C*:재밌었다. 다음에 또 보자. 핑계 삼아.']);
      Dlg.close(); Game.modal--; St.addAff(4);
      if (!S.done.movie) { S.done.movie = 1; Game.memory('같이 영화 보기', '소파에 나란히. 영화 내용은 별로 기억나지 않는다.', true); }
    } else UI.toast('📺 한 시간 동안 TV를 봤다');
  }
  function arcade() {
    St.advance(20);
    const sc = Math.floor(Math.random() * 9000) + 1000;
    UI.toast(`👾 오락 점수 ${sc}점! ${sc > 8000 ? '최고 기록 갱신!' : ''}`);
    if (Cap.mode === 'follow' && Game.cap.map === Game.mapId) setTimeout(() => Game.bubble(Game.cap, sc > 6000 ? '…나보다 잘하네. 한 판 더.' : '내가 이겼다. 상품은 뽀뽀.'), 500);
  }
  function goLink(l) {
    St.advance(3);
    enterMap(l.to, l.ax, l.ay);
    UI.toast(`📍 ${PX.MAPS[l.to].name}`);
  }
  // 데이트 장소에 대위와 함께 들어오면 데이트로 기록
  function dateCheck(id) {
    const S = St.S, d = PX.MAPS[id];
    if (!d.date || Cap.mode !== 'follow') return;
    const own = ['samgyup', 'starroom'].includes(id); // 이 두 곳은 활동 기록이 따로 남는다
    const key = 'date_' + id;
    if (S.cap.lastDateDay === S.day + id) return;
    S.cap.lastDateDay = S.day + id;
    St.addAff(6);
    S.stats.dates = (S.stats.dates || 0) + 1;
    setTimeout(() => Game.bubble(Game.cap, U.pick({ samgyup: ['냄새 좋다. 오늘 고기는 내가 굽는다.', '여기 내 단골이야. 너랑 오니까 더 좋네.'], flower: ['너 꽃 좋아하잖아. 골라. 내가 살게.', '여기 너랑 어울린다.'], arcade: ['인형 뽑기 할래? 내가 뽑아 줄게.', '오락실 데이트, 나쁘지 않네.'], starroom: ['어두워지면 손 잡아도 되지?', '별 보러 온 거 맞지? 나는 너 보러 온 건데.'], cafe: ['얼음 많이. 너는 늘 먹던 거?', '여기 앉자. 창가.'] }[id] || ['데이트네.'])), 900);
    if (!own && !S.done[key]) { S.done[key] = 1; setTimeout(() => Game.memory(`${d.name} 데이트`, `${U.josa(S.capName, '와')} 함께 ${d.name}에 왔다.`, true), 1500); }
  }
  async function grill(o) {
    const S = St.S;
    const withCap = Cap.mode === 'follow' && Game.cap.map === Game.mapId;
    const it = await UI.menu('냉삼 주문', [{ t: '🥓 냉삼 2인분 + 즉석밥', sub: '₢36 · 40분 · 기력 +40', k: 1 }, { t: '🌶️ 매운 양념 냉삼 2인분', sub: '₢40 · 40분 · 기력 +45', k: 2 }]);
    if (!it) return;
    if (!St.spend(it.k === 1 ? 36 : 40)) { UI.toast('돈이 모자라요'); return; }
    { // 테이블 옆 스툴에 앉기
      const m = W.maps[Game.mapId], p = Game.player;
      const stools = m.objs.filter(x => x.fid === 'stool' && x.x >= o.x - 1 && x.x <= o.x + o.fw && x.y >= o.y && x.y < o.y + o.fd && !x.seats[0].by);
      stools.sort((a, b) => U.dist(a.x, a.y, p.x, p.y) - U.dist(b.x, b.y, p.x, p.y));
      if (stools[0]) p.sitOn(stools[0].seats[0]);
    }
    if (withCap) Cap.sitNear(Game);
    Game.player.doPose('eat', 5);
    Game.modal++;
    if (withCap) {
      await Dlg.runLines(U.pick([
        ['N:불판 위에서 냉삼이 지글지글 오그라든다.', 'C:가만있어. 굽는 건 내가 해.', 'C^:자, 제일 잘 익은 거. 아~', { q: [['받아먹기', 5, ['C*:…귀엽네. 한 점 더.']], ['제가 먹을게요!', 2, ['C:그래. 대신 쌈은 내가 싸 줄게.']]] }],
        ['C:여기 사장님이 나 오면 고기를 두 배로 썰어.', 'C*:오늘은 너 때문에 세 배 썰었을걸.', 'N:대위는 자기 접시보다 내 접시를 더 자주 채운다.'],
        ['C:매운 거 괜찮아?', 'P:조금요.', 'C^:그럼 덜 매운 쪽은 네 쪽에 놓을게. 물도 미리 따라 놨어.'],
      ]));
      St.addAff(5);
      if (!S.done.grillDate) { S.done.grillDate = 1; Game.memory('냉삼 데이트', '대위가 고기를 굽고, 제일 잘 익은 건 늘 내 접시로 왔다.', true); }
    } else await Dlg.runLines(['N:혼자 냉삼을 구웠다. 맛있다. …누가 구워 줬으면 더 맛있었을지도.']);
    Dlg.close(); Game.modal--;
    fade(); St.advance(40); S.energy = Math.min(100, S.energy + (it.k === 1 ? 40 : 45));
    Game.codex('fruit');
  }
  async function claw() {
    const S = St.S;
    const withCap = Cap.mode === 'follow' && Game.cap.map === Game.mapId;
    const it = await UI.menu('인형 뽑기', [{ t: '🕹️ 내가 해 보기', sub: '₢5 · 한 판', k: 'me' }].concat(withCap ? [{ t: `🎯 ${S.capName}에게 뽑아 달라고 하기`, sub: '₢5', k: 'cap' }] : []));
    if (!it) return;
    if (!St.spend(5)) { UI.toast('돈이 모자라요'); return; }
    let win;
    if (it.k === 'me') win = await PX.Mini.claw();
    else {
      Game.modal++;
      await Dlg.runLines(['C*:잘 봐. 이런 건 각도랑 타이밍이야.', 'N:대위가 진지한 얼굴로 레버를 잡는다. 덩치 때문에 기계가 장난감처럼 보인다.']);
      win = Math.random() < 0.7;
      await Dlg.runLines(win ? ['N:집게가 토끼 인형의 리본을 정확히 걸었다!', 'C^:거봐. 자, 너 줄게.', 'C*:…인형보다 네가 더 좋아하는 얼굴이 보고 싶어서 뽑은 거야.'] : ['N:집게가 인형을 툭 놓쳤다.', 'C;:…이거 집게 힘 조작한 거 아니야?', 'C:한 판만 더. 아니, 될 때까지.']);
      Dlg.close(); Game.modal--;
      if (win) St.addAff(5);
    }
    if (win) {
      St.addItem('bunny'); UI.toast('🐰 토끼 인형을 얻었다! (숙소 꾸미기에서 놓을 수 있어요)');
      if (it.k === 'cap' && !S.done.capClaw) { S.done.capClaw = 1; Game.memory('인형 뽑기', `${U.josa(S.capName, '이')} 뽑아 준 토끼 인형.`, true); }
    } else if (it.k === 'me') UI.toast('아깝다! 집게가 미끄러졌다');
  }
  async function show() {
    const S = St.S;
    const special = Cal.openAt(PX.LORE_BY_ID.LB68, S.time, S.time.min);
    const withCap = Cap.mode === 'follow' && Game.cap.map === Game.mapId;
    const it = await UI.menu('별비 투영실', [{ t: special ? '🌠 오늘의 특별 투영 「별비」 보기' : '✨ 정기 투영 「페르녹스의 하늘」 보기', sub: special ? '매월 1·15·마지막 날 20:00~22:30 · ₢10 · 1시간' : '₢6 · 40분', k: 1 }]);
    if (!it) return;
    if (!St.spend(special ? 10 : 6)) { UI.toast('돈이 모자라요'); return; }
    const m = W.maps[Game.mapId];
    const seat = m.objs.filter(o => o.fid === 'theaterseat' && !o.seats[0].by).sort((a, b) => U.dist(a.x, a.y, Game.player.x, Game.player.y) - U.dist(b.x, b.y, Game.player.x, Game.player.y))[0];
    if (seat) sit(seat);
    if (withCap) Cap.sitNear(Game);
    Game.showing = performance.now();
    Game.modal++;
    await U.sleep(1800);
    if (special) await Dlg.runLines(['N:천장 가득 빛줄기가 비처럼 쏟아진다. 별비다.', ...(withCap ? ['N:어둠 속에서 커다란 손이 내 손을 찾아 조심스럽게 감싼다.', 'C:…예쁘다.', 'P:별이요?', 'C*:아니. 너.'] : ['N:모두가 숨을 죽이고 천장을 올려다본다.'])]);
    else await Dlg.runLines(['N:지구 바다, 페르녹스 초원, 먼 항로가 천장을 따라 흘러간다.', ...(withCap ? ['C:저기 깜빡이는 거, 우리 부대 쪽 항로등이야.', 'C^:다음엔 진짜 하늘 보러 가자. 은사막 전망대.'] : [])]);
    Dlg.close(); Game.modal--;
    Game.showing = 0;
    fade(); St.advance(special ? 60 : 40);
    if (withCap) { St.addAff(special ? 8 : 4); if (!S.done.starDate) { S.done.starDate = 1; Game.memory(special ? '별비 아래에서' : '투영실 데이트', special ? '별비가 쏟아지는 동안 대위가 내 손을 잡았다.' : '천장을 흐르는 하늘을 같이 올려다봤다.', true); } }
  }
  function inspect(o) {
    const S = St.S;
    if (o.fid === 'glowflower') { Game.codex('glowgrass'); Game.codex('crystaltree'); return UI.toast('✨ 발광초가 은은하게 숨 쉬듯 빛난다.'); }
    if (o.fid === 'flowerbed') { Game.codex('glassflower'); return UI.toast('🌸 유리꽃 꽃잎이 빛을 받아 무지갯빛으로 반짝인다.'); }
    if (o.fid === 'specimen') { Game.codex('drifter'); return UI.toast('🧪 배양조 안에서 반투명한 생명체가 천천히 떠오른다.'); }
    if (o.fid === 'alienbench') Game.codex('chitin');
    if (o.fid === 'alienbench') { if (Game.cap.map === Game.mapId) return say1('C^:그거? 외곽에서 주운 잔해로 만드는 중이야. 완성되면 너 줄게.'); return UI.toast('🔮 외계 생명체 잔해가 은은하게 빛난다. 무언가 만드는 중인 것 같다.'); }
    if (o.fid === 'stonedisplay') return UI.toast(`🪨 ${PX.U.josa(S.capName, '이')} 준 돌. 빛을 받으면 줄무늬가 반짝인다.`);
    UI.toast('🧪 배양조 안에서 외계 식물이 천천히 흔들린다.');
  }
  function kiosk() {
    const S = St.S;
    const ev = Cal.eventsOn(S.time);
    const places = PX.LORE.filter(e => e.eventType === 'place' && e.startTime && Cal.openAt(e, S.time, S.time.min)).slice(0, 4);
    UI.sheet('안내 단말', b => {
      b.append(U.el('h4', null, Cal.fmtDate(S.time) + ' 오늘의 행사'));
      if (!ev.length) b.append(U.el('p', { class: 'muted' }, '오늘은 예정된 행사가 없어요.'));
      for (const e of ev) b.append(U.el('div', { class: 'ev' }, U.el('b', null, e.originalTitle), U.el('small', null, e.location + (e.startTime ? ` · ${e.startTime}~${e.endTime}` : '')), U.el('p', null, e.description)));
      b.append(U.el('h4', null, '지금 운영 중인 명소'));
      if (!places.length) b.append(U.el('p', { class: 'muted' }, '지금 시간대에 특별히 운영 중인 곳은 없어요.'));
      for (const e of places) b.append(U.el('div', { class: 'ev' }, U.el('b', null, e.originalTitle), U.el('small', null, `${e.location} · ${e.startTime}~${e.endTime}`)));
      b.append(U.el('p', { class: 'muted' }, '돔시티 관광지 맵은 Alpha 0.2~Beta 0.5에서 차례로 열려요. 전체 정보는 단말 → 로어북.'));
    });
  }

  // ---------- 대위 메뉴 ----------
  // 대위 메뉴: 지금 상황에서 할 수 있는 것만 (이미 하고 있는 건 다시 묻지 않는다)
  async function capMenu() {
    const S = St.S, r = S.rel.cap, cap = Game.cap, M = PX.Mind;
    const duty = Cap.onDuty() && Cap.mode !== 'follow';
    const st = r.stage;
    const items = [{ t: '💬 대화하기', k: 'talk' }];
    if (PX.AI.available()) items.push({ t: '✨ 자유롭게 대화하기', k: 'ai', sub: '하고 싶은 말을 직접 입력 · AI가 대위로 대답해요' });
    items.push({ t: '😊 표정·행동으로 반응하기', k: 'react', sub: '웃으며 바라보기 · 빤히 보기 · 부끄러워하기 …' });
    if (!duty) items.push({ t: '🤝 스킨십', k: 'skin', sub: M.contact() !== 'NONE' ? `지금: ${M.NAME[M.contact()]}` : '손잡기 · 포옹 · 입맞춤 …' });
    for (const a of PX.CapAct.list()) items.push({ t: a.t, sub: a.sub, k: 'act', fn: a.fn });
    if (Cap.mode === 'follow') items.push({ t: '🧭 동행 관리', k: 'comp', sub: `지금: ${M.NAME[M.contact()] === '접촉 없음' ? '함께 걷기' : M.NAME[M.contact()]}` });
    else if (Cap.mode !== 'visit' && Cap.mode !== 'stay') items.push({ t: '🚶 같이 다녀요', k: 'follow', off: duty, offMsg: '지금은 근무 중이라 같이 다닐 수 없어요' });
    const dt = PX.Rom.nextDate();
    if (dt && dt.state === 'on') items.push({ t: '🌇 데이트 마치기', k: 'dateEnd' });
    else if (st >= 2 && !dt) items.push({ t: '📅 데이트 약속 잡기', k: 'date', sub: '장소와 시간을 정해요' });
    if (st === 6) items.push({ t: '💒 결혼식 날짜 잡기', k: 'wed', sub: S.wedding ? `${PX.Rom.dayKo(S.wedding.day)} 11:00 · 연병장` : '약혼 열흘 뒤부터' });
    items.push({ t: '❓ 물어보기', k: 'topic', sub: '대위에 대해 궁금한 것' });
    items.push({ t: '🎁 선물하기', k: 'gift' });
    items.push({ t: '😮‍💨 고민 털어놓기', k: 'comfort' });
    if (Cap.mode === 'visit') { items.push({ t: '🌙 자고 가도 돼요', k: 'stay', off: st < 2, offMsg: '아직은 조금 이른 것 같아요' }, { t: '🚪 이제 가 보세요', k: 'leave' }); }
    else if (Cap.mode !== 'follow') items.push({ t: '🌙 오늘은 혼자 있고 싶어요', k: 'alone' });
    const it = await UI.menu(`${S.capName} 대위`, items);
    if (!it) return;
    if (it.k === 'act') { cap.setDirTo(Game.player.x, Game.player.y); return it.fn(); }
    if (it.k === 'topic') return PX.CapAct.askTopic();
    if (it.k === 'date') return PX.Rom.askDate();
    if (it.k === 'dateEnd') { const d = PX.Rom.nextDate(); if (d) { d.started = -1e9; } return; }
    if (it.k === 'wed') return PX.Rom.planWedding();
    if (it.k === 'talk') return Dlg.capTalk();
    if (it.k === 'ai') return PX.AI.chat();
    if (it.k === 'react') return reactMenu();
    if (it.k === 'comp') return compMenu();
    if (it.k === 'follow') { Cap.startFollow(); M.noteMeet(); Game.bubble(cap, U.pickFresh('followYes', ['좋아. 어디든.', '그 말 기다렸어.', '오케이. 네 속도에 맞출게.', '가자. 오늘은 네가 대장이야.'])); St.addAff(1); return; }
    if (it.k === 'gift') return gift();
    if (it.k === 'skin') return skinMenu();
    if (it.k === 'comfort') return Dlg.capTalk('comfort');
    if (it.k === 'alone') { Game.modal++; await Dlg.say('player', '오늘은 혼자 있고 싶어요.'); await Dlg.say('cap', U.pick(['응, 알았어. 푹 쉬어. 내일 보자.', '그래. 필요하면 불러. 바로 갈게.']), 'smile'); Dlg.close(); Game.modal--; r.noFollowUntil = (S.day + (S.time.min >= 6 * 60 ? 1 : 0)) * 1440 + 6 * 60; M.noteRefuse('follow', 600); M.notePart(60); return; }
    if (it.k === 'stay') { S.cap.lastStayAskDay = -1; Game.modal++; await Dlg.say('player', '…자고 가도 돼요.', 'blush'); await Dlg.runLines(U.pick(PX.DLG_CAP.stayYes)); Dlg.close(); Game.modal--; S.cap.stay = 'sofa'; S.cap.lastStayAskDay = S.day; Cap.mode = 'stay'; St.addAff(6); const m = W.maps[Game.mapId]; const sofa = m.objs.find(o => o.kind === 'furn' && o.fid.startsWith('sofa') && o.seats && o.seats.some(x => !x.by)); if (sofa) { const a = W.accessTile(m, sofa); if (a) cap.goTo(m, a.x, a.y, () => { const seat = sofa.seats.find(x => !x.by); if (seat) cap.sitOn(seat); }); } return; }
    if (it.k === 'leave') { Game.modal++; await Dlg.say('player', '이제 가 보세요.'); await Dlg.runLines(PX.Dlg.pick('v_farewell', PX.DLG_V2.farewell).l); Dlg.close(); Game.modal--; const m = W.maps[Game.mapId]; cap.leaveSeat(); Cap.release(null, 60); cap.goTo(m, m.exit.x, m.exit.y, () => Cap.moveTo(m.def.parent, m.id), { allow: (x, y) => x === m.exit.x && y === m.exit.y }); }
  }
  // 동행 관리: 지금 상태는 '사용 중'으로 표시하고 다시 고르게 하지 않는다
  async function compMenu() {
    const M = PX.Mind, c = M.contact(), st = St.S.rel.cap.stage;
    const row = (t, k, need, cur) => ({ t: (cur ? '✔ ' : '') + t, k, off: cur || st < need, offMsg: cur ? '지금 하고 있어요' : '아직은 조금 이른 것 같아요', sub: cur ? '사용 중' : st < need ? `(${St.STAGES[need]} 이상)` : null });
    const it = await UI.menu('🧭 동행 관리', [
      row('🚶 함께 걷기 (접촉 없이)', 'NONE', 0, c === 'NONE'), row('🤝 손잡기', 'hand', 2, c === 'HAND_HOLD'), row('💞 팔짱', 'armlink', 3, c === 'ARM_LINK'),
      row('🫶 허리 감싸기', 'waist', 4, c === 'WAIST_HOLD'), row('🤗 어깨 감싸기', 'shoulder', 3, c === 'SHOULDER_HOLD'),
      { t: '⏸️ 여기서 잠깐 기다려 줘요', k: 'pause', sub: '대위가 이 자리에서 기다려요' }, { t: '👋 동행 종료', k: 'end' }]);
    if (!it) return;
    if (it.k === 'NONE') { if (c !== 'NONE') await M.perform('release'); return; }
    if (it.k === 'pause') { Cap.pause(); return; }
    if (it.k === 'end') { Game.modal++; await Dlg.say('player', '오늘은 여기까지 같이 갈게요.'); const bd = PX.Dlg.pick('v_farewell', PX.DLG_V2.farewell); await Dlg.runLines(bd ? bd.l : ['C:응. 이따 보자.']); Dlg.close(); Game.modal--; Cap.release(null, 30); return; }
    await M.perform(it.k);
  }
  // 스킨십: 카탈로그에서 지금 가능한 것만 (못 하는 건 이유와 함께)
  async function skinMenu() {
    const M = PX.Mind, list = M.menuItems();
    const groups = [['walk', '걸을 때'], ['light', '가벼운 애정 표현'], ['hug', '포옹'], ['kiss', '입맞춤']];
    const items = [];
    for (const x of list) items.push({ t: `${x.a.icon} ${x.a.name}`, k: x.a.id, off: !x.ok, offMsg: x.why, sub: !x.ok ? x.why : x.a.where === 'sit' ? '앉아 있을 때' : x.a.where === 'bed' ? '침대·숙소에서' : x.a.where === 'hug' ? '포옹 중' : null, g: x.a.cat });
    items.sort((a, b) => groups.findIndex(g => g[0] === a.g) - groups.findIndex(g => g[0] === b.g));
    const it = await UI.menu(`🤝 스킨십 · 지금: ${M.NAME[M.contact()]}`, items);
    if (it) await M.perform(it.k);
  }
  // 플레이어의 표정·행동 → 대위의 반응
  async function reactMenu() {
    const it = await UI.menu('😊 표정·행동', [{ t: '😊 웃으며 바라보기', k: 'smile' }, { t: '👀 빤히 바라보기', k: 'stare' }, { t: '😳 부끄러워하기', k: 'shy' }, { t: '😤 삐진 척하기', k: 'angry' }, { t: '🥱 피곤한 티 내기', k: 'tired' }]);
    if (!it) return;
    return react(it.k);
  }
  async function react(kind) {
    const M = PX.Mind, cap = Game.cap, p = Game.player, bd = PX.Dlg.pick('v_r_' + kind, PX.DLG_V2['r_' + kind]);
    if (!bd) return;
    p.doPose('idle', 2, kind === 'shy' ? 'blush' : kind === 'angry' ? 'angry' : kind === 'smile' ? 'smile' : 'normal');
    if (kind === 'smile' || kind === 'stare') { cap.setDirTo(p.x, p.y); if (St.S.rel.cap.stage >= 2 && U.dist(cap.x, cap.y, p.x, p.y) > 1.2) cap.goTo(W.maps[cap.map], Math.floor(p.x + 1), Math.floor(p.y)); }
    M.mem()[kind === 'smile' ? 'smile' : 'look'] = St.absMin();
    Game.modal++; await Dlg.runLines(bd.l); Dlg.close(); Game.modal--;
    if (kind === 'angry') { St.S.rel.cap.backoffUntil = St.absMin() + 120; cap.showEmote('sweat', 2); }
    else if (kind === 'tired') St.S.energy = Math.min(100, St.S.energy + 3);
    else { cap.showEmote(kind === 'shy' ? 'heart' : 'note', 1.6); St.addAff(1); }
    M.noteTalk('react_' + kind);
  }
  async function gift() {
    const S = St.S, r = S.rel.cap;
    const id = await UI.pickGift();
    if (!id) return;
    if (id === 'ring' && r.stage === 5) { St.addItem(id, -1); return PX.Rom.playerProposes(); }
    const it = PX.ITEMS[id];
    St.addItem(id, -1);
    const like = it.capLike;
    Game.modal++;
    Game.player.doPose('carry', 1.2);
    await Dlg.say('player', `${it.icon} 이거 드릴게요.`);
    const own = PX.DLG_GIFT && PX.DLG_GIFT[id];
    await Dlg.runLines(own && (r['gifted_' + id] = (r['gifted_' + id] || 0) + 1) <= 2 ? U.pick(own) : U.pick(PX.DLG_CAP.giftReact[like]));
    Dlg.close(); Game.modal--;
    const giftsToday = r.giftDay === S.day ? (r.giftsToday || 0) : 0;
    r.giftDay = S.day; r.giftsToday = giftsToday + 1; r.gifts++;
    const base = { 2: 14, 1: 9, 0: 5, '-1': 2 }[like];
    St.addAff(Math.round(base / (1 + giftsToday)));
    Game.cap.showEmote(like >= 1 ? 'heart' : 'note', 2);
    if (like >= 1) PX.Audio.heart();
    if (!S.done.firstGiftToCap) { S.done.firstGiftToCap = 1; Game.memory('내가 준 선물', `${S.capName}에게 ${PX.U.josa(it.name, '을')} 줬다.`, true); }
  }


  // ---------- 탭 → 행동 ----------
  function interactables() {
    const m = W.maps[Game.mapId], list = [];
    for (const o of m.objs) {
      if (o.hidden) continue;
      if (o.kind === 'bld' && o.door) list.push({ type: 'door', o, x: o.door.x + 0.5, y: o.door.y + 0.5, label: o.b.act ? o.b.act.label : o.door.closed ? `🚧 ${o.b.name}` : `🚪 ${o.b.name} 들어가기`, fn: () => enterBuilding(m.doors.find(d => d.bld === o)) });
      else if (o.kind === 'furn' && (o.use || (o.seats && o.seats.length))) {
        const a = W.accessTile(m, o);
        if (a) list.push({ type: 'obj', o, x: a.x + 0.5, y: a.y + 0.5, cx: o.x + o.fw / 2, cy: o.y + o.fd / 2, label: objLabel(o), fn: () => useObj(o) });
      }
    }
    if (m.kind === 'in') list.push({ type: 'exit', x: m.exit.x + 0.5, y: m.exit.y + 0.5, label: m.def.exitTo ? '🚪 로비로 내려가기' : '🚪 밖으로 나가기', fn: leaveRoom });
    for (const l of m.links || []) { const lx = Math.floor((l.x0 + l.x1) / 2); list.push({ type: 'link', l, x: lx + 0.5, y: l.y0 + 0.5, label: l.label, fn: () => goLink(l) }); }
    for (const c of Game.critters || []) if (!c.hidden) list.push(c.extra ? { type: 'extra', a: c, x: c.x, y: c.y, label: `💬 ${c.name}`, fn: () => PX.Ruby.talk(c) } : { type: 'critter', a: c, x: c.x, y: c.y, label: '🔍 관찰하기', fn: () => PX.Act.observe(c) });
    for (const n of Game.npcs) if (n.map === Game.mapId && !n.hidden) list.push({ type: 'npc', a: n, x: n.x, y: n.y, label: `💬 ${n.def.name}`, fn: () => Dlg.npcTalk(n) });
    if (Game.cap.map === Game.mapId) list.push({ type: 'cap', a: Game.cap, x: Game.cap.x, y: Game.cap.y, label: `💗 ${St.S.capName}`, fn: capMenu });
    return list;
  }
  function objLabel(o) {
    const job = PX.JOBS[St.S.player.job], home = PX.MAPS[Game.mapId].home;
    if (PX.Act.LABEL[o.use]) return PX.Act.LABEL[o.use];
    const L0 = { grill: '🥓 냉삼 먹기', claw: '🐰 인형 뽑기', show: '🌠 투영 보기', stall: '🏮 축제 매대' };
    if (L0[o.use]) return L0[o.use];
    const L = { bed: home ? '🛏️ 침대' : '🛏️ 잠깐 눕기', sit: '🪑 앉기', terminal: '📟 개인 단말', album: '📷 사진첩', storage: '🗄️ 수납장', shop: '🛒 상점', vending: '🥤 자판기', meal: '🍱 식사하기', wardrobe: '👕 옷장', fridge: '🧊 냉장고', kitchen: '🍳 요리하기', tv: '📺 TV 보기', cooler: '❄️ 냉각기', shower: '🚿 샤워하기', sink: '🫧 세면대', workout: '💪 운동하기', arcade: '👾 오락기', game: '🃏 카드 게임', inspect: '🔍 살펴보기', kiosk: 'ℹ️ 안내 단말', shuttle: '🚌 셔틀 타기', desk: '🖥️ 살펴보기', work: o.spot === job.workSpot ? '🛠️ 근무하기' : '🔍 살펴보기' };
    return L[o.use] || (o.seats && o.seats.length ? '🪑 앉기' : '🔍 살펴보기');
  }
  function tapAt(sx, sy) {
    const m = W.maps[Game.mapId], p = Game.player;
    const list = interactables();
    // 0) 화면에서 실제로 누른 그림 (맨 위부터, 투명 픽셀 통과) — 의자·소파·사람을 정확히 고른다
    const pk = W.pick(sx, sy);
    if (pk) {
      if (pk.a && pk.a !== p) { const it = list.find(i => i.a === pk.a); if (it) return goInteract(it, pk.a.x, pk.a.y); }
      if (pk.o) { const it = list.find(i => i.o === pk.o); if (it) return goInteract(it); if (pk.o.kind === 'bld') { UI.toast(pk.o.closedMsg || `🏢 ${pk.o.b.name}`); return; } }
    }
    // 1) 사람 (스프라이트 영역)
    const people = [Game.cap, ...Game.npcs, ...(Game.critters || [])].filter(a => a.map === Game.mapId && a.screen && !a.hidden);
    let hit = null;
    for (const a of people) { const s = a.screen; if (sx > s.x - 9 && sx < s.x + 9 && sy > s.top + 4 && sy < s.foot + 2) { if (!hit || a.y + a.x > hit.y + hit.x) hit = a; } }
    if (hit) { const it = list.find(i => i.a === hit); return goInteract(it, hit.x, hit.y); }
    const [wx, wy] = W.toWorld(sx, sy);
    const tx = Math.floor(wx), ty = Math.floor(wy);
    // 2) 출구 매트 · 연결 통로
    if (m.kind === 'in' && tx === m.exit.x && ty === m.exit.y) return goInteract(list.find(i => i.type === 'exit'));
    const lk = list.find(i => i.type === 'link' && ty >= i.l.y0 - 1 && ty <= i.l.y0 + 1 && tx >= i.l.x0 && tx <= i.l.x1);
    if (lk) return goInteract(lk);
    // 3) 가구 · 건물 (발밑 + 스프라이트 높이 고려: 위쪽으로 몇 칸까지 확인)
    for (let k = 0; k < 4; k++) {
      const cx = wx + k * 0.5, cy = wy + k * 0.5; // 화면 위쪽 클릭 → 뒤쪽 물체
      const fx = Math.floor(cx), fy = Math.floor(cy);
      const o = m.objs.find(o => (o.kind === 'bld' || (o.kind === 'furn' && !o.f.flat)) && fx >= o.x && fx < o.x + o.fw && fy >= o.y && fy < o.y + o.fd);
      if (o) {
        const it = list.find(i => i.o === o);
        if (it) return goInteract(it);
        if (o.kind === 'bld') { UI.toast(o.closedMsg || `🏢 ${o.b.name}`); return; }
        if (k === 0) { UI.toast(`${o.f.name}`); return; }
      }
    }
    // 4) 바닥
    const tgt = PX.Path.nearestWalkable(m, tx, ty, 3);
    if (!tgt) return;
    if (p.seat) standUp();
    const path = PX.Path.find(m, Math.floor(p.x), Math.floor(p.y), tgt[0], tgt[1]);
    if (path) { p.speedNow = path.length > 8 ? 5.4 : 3.6; if (St.S.energy < 15) p.speedNow *= 0.7; p.walkPath(path); Game.target = { x: tgt[0], y: tgt[1], t: 0 }; }
  }
  function goInteract(it, ax, ay) {
    if (!it) return;
    const m = W.maps[Game.mapId], p = Game.player;
    const tx = it.x, ty = it.y;
    const near = U.dist(p.x, p.y, tx, ty) < 1.3 || (it.a && U.dist(p.x, p.y, it.a.x, it.a.y) < 1.8);
    if (near) { p.stop(); if (it.cx != null) p.setDirTo(it.cx, it.cy); else if (it.a) p.setDirTo(it.a.x, it.a.y); it.fn(); return; }
    if (p.seat) standUp();
    let gx = Math.floor(tx), gy = Math.floor(ty);
    if (it.a) { const t = PX.Path.nearestWalkable(m, it.a.x + 0.8, it.a.y + 0.8, 3); if (t) { gx = t[0]; gy = t[1]; } }
    const allow = it.type === 'exit' ? (x, y) => x === m.exit.x && y === m.exit.y : undefined;
    if (it.type === 'link') { gy = it.l.y0 === 0 ? 1 : it.l.y0 - 1; }
    const path = PX.Path.find(m, Math.floor(p.x), Math.floor(p.y), gx, gy, { allow });
    if (!path) { UI.toast('그곳까지 갈 길이 없어요'); return; }
    p.speedNow = path.length > 8 ? 5.4 : 3.6;
    Game.target = { x: gx, y: gy, t: 0 };
    p.walkPath(path, () => { Game.target = null; if (it.cx != null) p.setDirTo(it.cx, it.cy); else if (it.a) p.setDirTo(it.a.x, it.a.y); if (!it.a || U.dist(p.x, p.y, it.a.x, it.a.y) < 2.6) it.fn(); });
  }
  // 가까운 상호작용 (행동 버튼 · E키)
  // 가까운 대상들 (가까운 순). 대위는 전용 버튼이 따로 있으니 다른 대상이 있으면 기본 버튼을 차지하지 않는다
  function nearby() {
    const p = Game.player, out = [];
    for (const it of interactables()) { const d = U.dist(p.x, p.y, it.a ? it.a.x : it.x, it.a ? it.a.y : it.y); const lim = it.a ? 1.9 : 1.3; if (d < lim) out.push({ it, d: d - (it.a ? 0.2 : 0) }); }
    return out.sort((a, b) => a.d - b.d).map(x => x.it);
  }
  function nearest() { const l = nearby(); return l.find(i => i.type !== 'cap') || l[0] || null; }
  const capNear = () => Game.cap && Game.cap.map === Game.mapId && !Game.cap.hidden && U.dist(Game.cap.x, Game.cap.y, Game.player.x, Game.player.y) < 3.2;
  async function pickNearby() {
    const l = nearby(); if (!l.length) return;
    const it = await UI.menu('주변 대상', l.map(i => ({ t: i.type === 'cap' ? `💗 ${St.S.capName}와(과) 대화`.replace('와(과)', U.hasBatchim(St.S.capName) ? '과' : '와') : i.label, k: i })));
    if (it) { const t = it.k; Game.player.stop(); if (t.cx != null) Game.player.setDirTo(t.cx, t.cy); else if (t.a) Game.player.setDirTo(t.a.x, t.a.y); t.fn(); }
  }

  // ---------- 입력 ----------
  const cv = $('game');
  const toInternal = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W.view.w, (e.clientY - r.top) / r.height * W.view.h]; };
  let downAt = null;
  cv.addEventListener('pointerdown', e => {
    PX.Audio.unlock();
    if (!Game.running || Game.modal && !PX.Decor.active) return;
    const [x, y] = toInternal(e);
    downAt = { x, y, t: performance.now() };
    if (PX.Decor.active) { PX.Decor.down(x, y); cv.setPointerCapture(e.pointerId); }
  });
  cv.addEventListener('pointermove', e => { if (PX.Decor.active && downAt) { const [x, y] = toInternal(e); PX.Decor.move(x, y); } });
  cv.addEventListener('pointerup', e => {
    if (!downAt) return;
    const [x, y] = toInternal(e);
    if (PX.Decor.active) { PX.Decor.up(); downAt = null; return; }
    if (!Game.modal && !(Game.pinchUntil > performance.now()) && Math.hypot(x - downAt.x, y - downAt.y) < 8) tapAt(x, y);
    downAt = null;
  });
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    keys[e.key] = true;
    if (!Game.running) return;
    if (Game.modal) { if (e.key === 'Escape') { const x = document.querySelector('.sheet-wrap:last-child .x'); if (x) x.click(); } return; }
    if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); actionBtn(); }
    if (e.key === 't' || e.key === 'T' || e.key === 'Tab') { e.preventDefault(); UI.terminal(); }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  const everyone = () => Game.critters && Game.critters.length ? Game.actors.concat(Game.critters) : Game.actors;
  // 서 있는 사람들이 차지한 칸 (길찾기가 돌아가도록) + 한 칸에 겹쳐 선 사람 떼어 놓기
  let occT = 0;
  function crowdTick(dt) {
    occT -= dt; if (occT > 0) return; occT = 0.4;
    const m = W.maps[Game.mapId], occ = new Map(), here = everyone().filter(a => a.map === Game.mapId && !a.hidden);
    for (const a of here) {
      if (a.moving || a.path.length || a.seat) continue;
      const k = Math.floor(a.y) * m.w + Math.floor(a.x), b = occ.get(k);
      if (!b) { occ.set(k, a); continue; }
      // 같은 칸에 둘: 플레이어·대위·제자리 직원이 아닌 쪽이 옆 칸으로 비켜 선다
      const mover = [a, b].find(x => x !== Game.player && x !== Game.cap && !x.fixed && !x.critter) || (a !== Game.player && a !== Game.cap ? a : b !== Game.player && b !== Game.cap ? b : null);
      if (!mover || mover === Game.player || Game.modal) continue;
      const cx = Math.floor(mover.x), cy = Math.floor(mover.y);
      const spots = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dy]) => [cx + dx, cy + dy]).filter(([x, y]) => W.walkable(m, x, y) && !occ.has(y * m.w + x));
      if (spots.length) { const s = U.pick(spots.slice(0, 4)); mover.walkPath([[s[0], s[1]]]); occ.set(s[1] * m.w + s[0], mover); }
    }
    Game.occ = occ;
  }
  function keyMove(dt) {
    const p = Game.player;
    let dx = 0, dy = 0; // 화면 기준 → 타일 기준 변환
    if (keys.ArrowUp || keys.w || keys.W) { dx -= 1; dy -= 1; }
    if (keys.ArrowDown || keys.s || keys.S) { dx += 1; dy += 1; }
    if (keys.ArrowLeft || keys.a || keys.A) { dx -= 1; dy += 1; }
    if (keys.ArrowRight || keys.d || keys.D) { dx += 1; dy -= 1; }
    let run = !!keys.Shift, mag = 1;
    if (joy.active && (joy.x || joy.y)) { // 화면 오른쪽 = 타일 (+1,-1), 화면 아래 = (+1,+1)
      const sx = joy.x, sy = joy.y;
      dx += sx + sy; dy += sy - sx;
      const d = Math.hypot(sx, sy);
      run = run || d > 0.92; mag = Math.max(0.45, Math.min(1, d / 0.7));
    }
    p.kbMoving = false;
    if (Math.hypot(dx, dy) < 0.08) return;
    if (p.seat) standUp();
    p.stop(); Game.target = null;
    const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    const sp = (run ? 5.4 : 3.6 * mag) * (St.S.energy < 15 ? 0.7 : 1) * dt;
    p.speedNow = sp / dt;
    const m = W.maps[Game.mapId];
    // 벽·가구 + 서 있는 사람(뚫고 지나가지 않게. 이미 겹쳐 있으면 빠져나올 수는 있다)
    const others = everyone().filter(a => a !== p && a.map === Game.mapId && !a.hidden && !a.seat && !a.moving);
    let bumped = null;
    const hit = (x, y) => { for (const a of others) { const d = U.dist(x, y, a.x, a.y); if (d < 0.55 && d < U.dist(p.x, p.y, a.x, a.y) - 0.001) { bumped = a; return true; } } return false; };
    const free = (x, y) => { const r = 0.25; for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (!W.walkable(m, Math.floor(x + ox), Math.floor(y + oy))) return false; return !hit(x, y); };
    const nx = p.x + dx * sp, ny = p.y + dy * sp;
    const ox0 = p.x, oy0 = p.y;
    if (free(nx, ny)) { p.x = nx; p.y = ny; } else if (nx !== p.x && free(nx, p.y)) p.x = nx; else if (ny !== p.y && free(p.x, ny)) p.y = ny;
    if (Math.hypot(p.x - ox0, p.y - oy0) < sp * 0.3 && bumped && !bumped.fixed && !bumped.critter && !bumped.path.length && !bumped.seat && (bumped.pushT || 0) < performance.now()) {
      bumped.pushT = performance.now() + 1500; // 길을 막고 선 사람은 옆으로 비켜 준다
      const bx = Math.floor(bumped.x), by = Math.floor(bumped.y), px0 = Math.floor(p.x), py0 = Math.floor(p.y);
      const sp2 = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([ax, ay]) => [bx + ax, by + ay]).filter(([x, y]) => W.walkable(m, x, y) && !(x === px0 && y === py0)).sort((u, v) => U.dist(v[0], v[1], p.x, p.y) - U.dist(u[0], u[1], p.x, p.y));
      if (sp2.length) { bumped.walkPath([sp2[0]]); if (Math.random() < 0.3 && bumped !== Game.cap) Game.bubble(bumped, U.pick(['앗.', '어이쿠.', '…!']), 1.4); }
    }
    p.dir = A.vecDir(dx, dy, p.dir); p.kbMoving = true;
    if (m.kind === 'in' && Math.floor(p.x) === m.exit.x && Math.floor(p.y) === m.exit.y) leaveRoom();
    for (const l of m.links || []) if (Math.floor(p.y) === l.y0 && Math.floor(p.x) >= l.x0 && Math.floor(p.x) <= l.x1) { goLink(l); break; }
  }
  function actionBtn() {
    if (Game.player.seat) { standUp(); return; }
    const it = nearest();
    if (it) { Game.player.stop(); if (it.cx != null) Game.player.setDirTo(it.cx, it.cy); it.fn(); }
  }
  $('actBtn').onclick = actionBtn;
  // ---------- 조이스틱 (왼쪽 아래) ----------
  const joy = { x: 0, y: 0, active: false };
  {
    const pad = document.getElementById('joy'), knob = document.getElementById('knob');
    const touch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if (touch) pad.classList.remove('hidden');
    let id = null, cx = 0, cy = 0;
    const R = 46;
    const move = (e) => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      joy.x = dx / R; joy.y = dy / R; joy.active = true;
      pad.classList.toggle('run', Math.hypot(joy.x, joy.y) > 0.92);
    };
    const end = (e) => { if (e.pointerId !== id) return; id = null; joy.active = false; joy.x = joy.y = 0; knob.style.transform = ''; pad.classList.remove('run'); };
    pad.addEventListener('pointerdown', (e) => {
      if (Game.modal) return;
      PX.Audio.unlock();
      id = e.pointerId; pad.setPointerCapture(id);
      const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      move(e); e.preventDefault();
    });
    pad.addEventListener('pointermove', move);
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    Game.joy = joy; Game.joyEnd = () => { id = null; joy.active = false; joy.x = joy.y = 0; knob.style.transform = ''; pad.classList.remove('run'); };
  }
  // ---------- 키보드: 입력창에 포커스가 가면 화면 위쪽으로 올려 가리지 않게 ----------
  {
    const bar = document.getElementById('chatbar');
    bar.addEventListener('focusin', () => bar.classList.add('kbtop'));
    bar.addEventListener('focusout', () => setTimeout(() => { if (!bar.contains(document.activeElement)) bar.classList.remove('kbtop'); }, 50));
    const sh = document.getElementById('sheets');
    sh.addEventListener('focusin', (e) => { if (e.target.tagName === 'INPUT') { const w = e.target.closest('.sheet-wrap'); if (w) w.classList.add('kbtop'); } });
    sh.addEventListener('focusout', (e) => { const w = e.target.closest && e.target.closest('.sheet-wrap'); if (w) setTimeout(() => { if (!w.contains(document.activeElement)) w.classList.remove('kbtop'); }, 50); });
  }
  // ---------- 확대 · 축소 (버튼 · 휠 · 두 손가락) ----------
  const zoom = (step) => { if (W.zoomBy(step)) { snapCam(); try { St.S.settings.zoomOff = W.view.zoomOff; } catch (e) { /* 저장 전 */ } } };
  $('zoomIn').onclick = () => zoom(1);
  $('zoomOut').onclick = () => zoom(-1);
  cv.addEventListener('wheel', (e) => { e.preventDefault(); if (!Game.running || PX.Decor.active) return; zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  const pts = new Map(); let pinch = null;
  cv.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; downAt = null; }
  }, true);
  cv.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d > pinch.d * 1.25) { zoom(1); pinch.d = d; } else if (d < pinch.d / 1.25) { zoom(-1); pinch.d = d; }
    }
  }, true);
  const lift = (e) => { pts.delete(e.pointerId); if (pts.size < 2 && pinch) { pinch = null; downAt = null; Game.pinchUntil = performance.now() + 300; } };
  cv.addEventListener('pointerup', lift, true); cv.addEventListener('pointercancel', lift, true);
  $('termBtn').onclick = () => { if (!Game.modal) UI.terminal(); };
  $('photoBtn').onclick = () => { if (!Game.modal) { Game.memory('사진', `${PX.MAPS[Game.mapId].name}에서 찰칵.`, true); PX.Audio.blip(2); } };
  $('decorBtn').onclick = () => { if (!Game.modal) PX.Decor.start(); };
  $('capChip').onclick = () => { if (Game.modal) return; if (Cap.mode === 'follow' && Game.cap.map === Game.mapId) compMenu(); else UI.terminal('rel'); };
  $('talkBtn').onclick = () => { if (!Game.modal && capNear()) { Game.player.setDirTo(Game.cap.x, Game.cap.y); capMenu(); } };
  $('skinBtn').onclick = () => { if (!Game.modal && capNear()) skinMenu(); };
  $('moreBtn').onclick = () => { if (!Game.modal) pickNearby(); };

  // ---------- 루프 ----------
  let last = 0, acc = 0, hudT = 0, npcT = 0, saveT = 0, minuteAcc = 0;
  function run() {
    W.view.zoomOff = (St.S.settings && St.S.settings.zoomOff) || 0; W.resize(); snapCam();
    $('hud').classList.remove('hidden');
    $('title').classList.add('hidden'); $('create').classList.add('hidden');
    UI.badge();
    if (!Game.running) { Game.running = true; last = performance.now(); requestAnimationFrame(frame); }
  }
  // 카메라 목표: 플레이어 중심, 단 맵 바깥 허공이 화면을 많이 차지하지 않게 맵 경계 안으로 당김
  function camTarget() {
    const p = Game.player, m = W.maps[Game.mapId];
    let [cx, cy] = PX.G.proj(p.x, p.y); cy -= 14;
    if (!m) return [cx, cy];
    const vw = W.view.w, vh = W.view.h, pad = 24;
    const x0 = -m.h * 16 - pad, x1 = m.w * 16 + pad, y0 = -60, y1 = (m.w + m.h) * 8 + pad;
    const clamp = (v, a, b) => a > b ? (a + b) / 2 : Math.max(a, Math.min(b, v));
    cx = clamp(cx, x0 + vw / 2, x1 - vw / 2); cy = clamp(cy, y0 + vh / 2, y1 - vh / 2);
    return [cx, cy];
  }
  // 카메라: 실수 좌표(camF)로 부드럽게 따라가고, 그리기는 정수 픽셀 + 남는 소수점은 CSS 이동
  const camF = { x: 0, y: 0 };
  function applyCam() {
    const v = W.view, sc = v.cssScale || 1;
    v.camX = Math.round(camF.x); v.camY = Math.round(camF.y);
    const tr = `translate(${((v.camX - camF.x) - 1) * sc}px, ${((v.camY - camF.y) - 1) * sc}px)`;
    v.cv.style.transform = tr; $('labels').style.transform = tr; $('bubbles').style.transform = tr;
  }
  function snapCam() { const p = Game.player; if (!p) return; const [px, py] = camTarget(); camF.x = px; camF.y = py; applyCam(); }
  // ---------- 자동 절전: 느린 폰이면 가볍게 ----------
  let skipFrame = false, renderDt = 0, perfAcc = 0, perfN = 0, perfSlow = 0;
  function perfTick(dt) {
    const q = St.S.settings.quality || 'auto';
    if (q !== 'auto') { Game.lowPerf = q === 'low'; return; }
    if (Game.modal || Game.sleeping) return;
    perfAcc += dt; perfN++;
    if (perfAcc < 3) return;
    const avg = perfAcc / perfN; perfAcc = 0; perfN = 0;
    // 3초 평균 프레임이 26ms(약 38fps)보다 길면 두 번 연속일 때 절전, 아주 여유로우면 해제
    if (!Game.lowPerf) { perfSlow = avg > 0.026 ? perfSlow + 1 : 0; if (perfSlow >= 2) { Game.lowPerf = true; perfSlow = 0; trimCrowd(); } }
  }
  function trimCrowd() { if (!Game.critters) return; const ex = Game.critters.filter(c => c.extra && !c.fixed); ex.slice(0, Math.floor(ex.length / 2)).forEach(c => { c.hidden = true; c.map = null; }); Game.critters = Game.critters.filter(c => c.map); }
  Game.trimCrowd = trimCrowd;
  // 플레이어가 멈춰 서서 대위를 계속 바라보면 대위가 먼저 반응한다
  let stareT = 0;
  function stareTick(dt) {
    const p = Game.player, cap = Game.cap;
    if (Game.modal || p.moving || !capNear() || cap.moving) { stareT = 0; return; }
    const facing = A.vecDir(cap.x - p.x, cap.y - p.y, p.dir) === p.dir;
    stareT = facing ? stareT + dt : 0;
    if (stareT > 7 && !Game.bubbles.some(b => b.actor === cap)) {
      stareT = -25;
      cap.setDirTo(p.x, p.y);
      const st = St.S.rel.cap.stage;
      Game.bubble(cap, U.pickFresh('stareB' + (st >= 4 ? 'L' : 'P'), st >= 4 ? ['왜 그렇게 봐?', '계속 봐도 돼. 돈 안 받아.', '내 얼굴 마음에 들어?', '그렇게 보면 기대하게 되는데.', '뽀뽀해도 되는 상황인가?', '…뭐. 왜. 좋아서?'] : ['뭐 묻었어?', '왜 그렇게 봐?', '할 말 있어?', '…흉터 봐? 괜찮아.']), 2.6);
      PX.Mind.mem().look = St.absMin();
    }
  }
  function frame(t) {
    if (!Game.running) return;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    const S = St.S;
    // 시간
    if (!Game.modal && !Game.sleeping && !Game.transition) {
      minuteAcc += dt * 1000 * Cal.SPEEDS[S.settings.speed];
      if (minuteAcc >= 1) { const n = Math.floor(minuteAcc); minuteAcc -= n; St.advance(n); }
    }
    // 이동 · AI
    if (!Game.modal) keyMove(dt);
    crowdTick(dt);
    for (const a of Game.actors) a.update(dt);
    if (Game.critters) { for (const c of Game.critters) c.update(dt); PX.Act.critterThink(); }
    if (PX.CapAct) PX.CapAct.tick(dt);
    if (PX.Mind) { PX.Mind.tick(dt); stareTick(dt); }
    capCommentT -= dt; if (capCommentT <= 0) { capCommentT = 45 + Math.random() * 45; PX.Act.placeComment(false); }
    npcT -= dt;
    if (npcT <= 0 && !Game.sleeping) { npcT = 0.5; if (!Game.modal) for (const n of Game.npcs) n.think(S, Game.mapId); }
    if (!Game.modal || Cap.mode === 'follow') Cap.update(Game.modal ? 0 : dt);
    pump();
    // 카메라
    const p = Game.player;
    const [px, py] = camTarget();
    const k = 1 - Math.exp(-dt * 7);
    camF.x += (px - camF.x) * k; camF.y += (py - camF.y) * k;
    if (Math.abs(px - camF.x) < 0.02) camF.x = px; if (Math.abs(py - camF.y) < 0.02) camF.y = py;
    applyCam();
    // 렌더 (절전 모드: 30fps로 그린다. 게임 시간·이동은 그대로)
    perfTick(dt);
    if (Game.lowPerf && (skipFrame = !skipFrame)) { renderDt += dt; hudT -= dt; if (hudT <= 0) { hudT = 0.25; UI.hud(); updateAction(); } requestAnimationFrame(frame); return; }
    const rdt = dt + renderDt; renderDt = 0;
    const env = { season: PX.MAPS[Game.mapId].dome && St.season() === 'winter' ? 'domeWinter' : St.season(), night: St.isNight(), min: S.time.min, weather: PX.MAPS[Game.mapId].dome ? 'clear' : St.weather(), dt: rdt, low: Game.lowPerf };
    W.render(W.maps[Game.mapId], Game.critters && Game.critters.length ? Game.actors.concat(Game.critters) : Game.actors, env, { overlay: overlay, lights: p.map ? [] : [] });
    positionBubbles(); positionLabels(); ambient(dt);
    hudT -= dt; if (hudT <= 0) { hudT = 0.25; UI.hud(); updateAction(); }
    saveT += dt; if (saveT > 300) { saveT = 0; St.save(); }
    requestAnimationFrame(frame);
  }
  // 오버레이: 목적지 표시 · 감정 아이콘 · 가까운 물체 화살표
  function overlay(g) {
    PX.Decor.overlay(g);
    PX.Rom.overlay(g, W.view.w, W.view.h);
    const S = St.S, md = PX.MAPS[Game.mapId], now = performance.now() / 1000;
    if (md.stars) { // 투영실 천장 별
      const r = U.rng('stars' + Math.floor(now / 3));
      const n = Game.showing ? 70 : 24;
      for (let i = 0; i < n; i++) { const x = (r() * W.view.w) | 0, y = (r() * W.view.h * 0.6) | 0; g.fillStyle = r() < 0.3 ? '#bfe3ff' : '#ffffff'; g.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(now * 2 + i)); g.fillRect(x, y, 1, 1); if (Game.showing && i % 9 === 0) { const t = (now * 40 + i * 37) % 120; g.fillRect(x, y + t * 0.6, 1, 3); } }
      g.globalAlpha = 1;
    }
    if (Game.mapId === 'plaza' && Cal.openAt(PX.LORE_BY_ID.LB58, S.time, S.time.min)) { // 투명수로 정원 입체영상 물고기
      for (let i = 0; i < 9; i++) {
        const fx = 39.5 + ((now * (0.3 + i * 0.05) + i * 1.7) % 10), fy = 16 + (i * 2.1) % 18 + Math.sin(now + i) * 0.4;
        const [sx, sy] = W.toScreen(fx, fy);
        g.fillStyle = ['#7fe3ff', '#ffb36b', '#ff7ac8'][i % 3]; g.globalAlpha = 0.75;
        g.fillRect(sx - 2, sy, 4, 2); g.fillRect(sx - 4, sy - 1, 2, 4); g.globalAlpha = 1;
      }
      if (!S.codex || !S.codex.holofish) { const p = Game.player; if (p.x > 39 && p.y > 15 && p.y < 35) Game.codex('holofish'); }
    }
    const tg = Game.target;
    if (tg && Game.player.path.length) {
      tg.t += 0.05;
      const a = W.toScreen(tg.x + 0.2, tg.y + 0.2), b = W.toScreen(tg.x + 0.8, tg.y + 0.2), c = W.toScreen(tg.x + 0.8, tg.y + 0.8), d = W.toScreen(tg.x + 0.2, tg.y + 0.8);
      g.globalAlpha = 0.5 + 0.3 * Math.sin(tg.t * 4);
      PX.G.line(g, a[0], a[1], b[0], b[1], '#ffffff'); PX.G.line(g, b[0], b[1], c[0], c[1], '#ffffff'); PX.G.line(g, c[0], c[1], d[0], d[1], '#ffffff'); PX.G.line(g, d[0], d[1], a[0], a[1], '#ffffff');
      g.globalAlpha = 1;
    }
    for (const a of Game.actors) {
      if (!a.emote || a.map !== Game.mapId || !a.screen) continue;
      const x = a.screen.x - 3, y = a.screen.top - 6 + Math.round(Math.sin(performance.now() / 200) * 1);
      if (a.emote === 'heart') PX.G.icon(g, 'heart', x, y, '#ff5a7a');
      else if (a.emote === 'stars') { g.fillStyle = '#ffd166'; g.fillRect(x, y + 2, 2, 2); g.fillRect(x + 5, y, 2, 2); g.fillRect(x + 3, y + 5, 1, 1); }
      else if (a.emote === 'sweat') PX.G.icon(g, 'drop', x + 4, y, '#7fd3ef');
      else if (a.emote === 'note') PX.G.icon(g, 'star', x, y, '#ffd166');
    }
    if (!Game.modal && !PX.Decor.active) {
      const it = nearest();
      if (it) {
        const sx = it.a ? it.a.screen && it.a.screen.x : W.toScreen(it.cx != null ? it.cx : it.x, it.cy != null ? it.cy : it.y)[0];
        let sy = it.a ? it.a.screen && it.a.screen.top - 4 : W.toScreen(it.cx != null ? it.cx : it.x, it.cy != null ? it.cy : it.y, 26)[1];
        if (sx != null && sy != null) { sy += Math.round(Math.sin(performance.now() / 180) * 1.5); g.fillStyle = '#ffd166'; g.fillRect(sx - 2, sy - 3, 5, 1); g.fillRect(sx - 1, sy - 2, 3, 1); g.fillRect(sx, sy - 1, 1, 1); }
      }
    }
  }
  // 건물 이름표 (지붕 위에 떠 있음)
  const labelEls = new Map(); let labelMap = null;
  function positionLabels() {
    const box = document.getElementById('labels'), sc = W.view.cssScale, m = W.maps[Game.mapId];
    if (labelMap !== Game.mapId) { box.innerHTML = ''; labelEls.clear(); labelMap = Game.mapId; }
    if (m.kind !== 'out') return;
    for (const o of m.objs) {
      if (o.kind !== 'bld') continue;
      let e = labelEls.get(o.id);
      if (!e) { e = U.el('div', { class: 'blabel' + (o.b.closed ? ' closed' : '') }, U.el('i', { style: `background:${o.b.stripe}` }), o.b.name.replace(/ \(.*\)$/, '')); box.append(e); labelEls.set(o.id, e); }
      const [sx, sy] = W.toScreen(o.x + o.fw / 2, o.y + o.fd / 2, o.b.h + 22);
      const px = sx * sc, py = sy * sc;
      const vis = sx > -60 && sx < W.view.w + 60 && sy > -10 && sy < W.view.h + 10 && py > 108 && !(px > innerWidth - 120 && py < 380);
      if (e._vis !== vis) { e._vis = vis; e.style.display = vis ? '' : 'none'; }
      const tr = `translate(${Math.round(sx * sc)}px, ${Math.round(sy * sc)}px) translate(-50%, -100%)`;
      if (vis && e._tr !== tr) { e._tr = tr; e.style.transform = tr; }
    }
  }
  // NPC 혼잣말 말풍선 (지금 하는 일에 맞춰)
  let ambT = 4, lastAmb = null;
  function ambient(dt) {
    ambT -= dt; if (ambT > 0) return;
    ambT = 4 + Math.random() * 4;
    if (Game.modal) return;
    const p = Game.player;
    // 지나가면 먼저 인사 (하루에 한 번씩)
    const S0 = St.S; S0.done.hiDay = S0.done.hiDay === S0.day ? S0.done.hiDay : (S0.done.hiSet = {}, S0.day);
    const hiN = Game.npcs.find(n => n.map === Game.mapId && PX.HI && PX.HI[n.id] && !S0.done.hiSet[n.id] && n.activity() !== 'sleep' && U.dist(n.x, n.y, p.x, p.y) < 2.4 && !Game.bubbles.some(b => b.actor === n));
    if (hiN) { S0.done.hiSet[hiN.id] = 1; if (!hiN.path.length && !hiN.seat) hiN.setDirTo(p.x, p.y); Game.bubble(hiN, U.pickFresh('hi_' + hiN.id, PX.HI[hiN.id]), 2.2); if (!hiN.seat && !['workout', 'cook', 'grill', 'guard'].includes(hiN.activity())) hiN.doPose('wave', 1); ambT = 2.5; return; }
    if (Math.random() < 0.4) return;
    // 가까이 있는 두 사람이 말을 주고받는다
    if (PX.CHATTER && Math.random() < 0.4) {
      const here = Game.npcs.filter(n => n.map === Game.mapId && n.activity() !== 'sleep' && U.dist(n.x, n.y, p.x, p.y) < 9 && !Game.bubbles.some(b => b.actor === n));
      for (const a of here) for (const b2 of here) {
        if (a === b2 || U.dist(a.x, a.y, b2.x, b2.y) > 3.2) continue;
        const pl = PX.CHATTER.pair[a.id + '+' + b2.id];
        if (!pl) continue;
        const ex = U.pick(pl);
        Game.bubble(a, ex[0], 2.6); setTimeout(() => { if (b2.map === Game.mapId && !Game.modal) Game.bubble(b2, ex[1], 2.6); }, 1900);
        ambT = 6; return;
      }
      const exs = (Game.critters || []).filter(c => c.extra && !c.fixed && U.dist(c.x, c.y, p.x, p.y) < 8 && !Game.bubbles.some(b => b.actor === c));
      for (const a of exs) for (const b2 of exs) {
        if (a === b2 || a.extra !== b2.extra || U.dist(a.x, a.y, b2.x, b2.y) > 3) continue;
        const k = { messgoer: 'eat', gymgoer: 'workout', offduty: 'rest', arcader: 'game', soldier: 'stroll', citizen: 'stroll', cafeguest: 'cafe', patron: 'rest' }[a.extra];
        if (!k) continue;
        const ex = U.pick(PX.CHATTER.act[k]);
        Game.bubble(a, ex[0], 2.4); setTimeout(() => { if (b2.map === Game.mapId && !Game.modal) Game.bubble(b2, ex[1], 2.4); }, 1700);
        ambT = 6; return;
      }
    }
    const near = Game.npcs.filter(n => n.map === Game.mapId && n !== lastAmb && U.dist(n.x, n.y, p.x, p.y) < 9 && !Game.bubbles.some(b => b.actor === n));
    if (!near.length) return;
    const n = U.pick(near), act = n.activity(), A = PX.NPC_ACT[act];
    if (!A) return;
    let pool = A.amb;
    const md = PX.MAPS[n.map], w = St.weather();
    if (md.kind === 'out' && !md.dome && PX.NPC_ACT.weather[w] && Math.random() < 0.3) pool = PX.NPC_ACT.weather[w];
    lastAmb = n;
    Game.bubble(n, U.pickFresh('amb_' + n.id + act, pool).replace(/\{c\}/g, St.S.capName).replace(/\{cs\}/g, Cap.status()), 2.6);
  }
  function positionBubbles() {
    const now = performance.now(), sc = W.view.cssScale;
    Game.bubbles = Game.bubbles.filter(b => { if (now > b.until || b.actor.map !== Game.mapId) { b.el.remove(); return false; } return true; });
    for (const b of Game.bubbles) { const s = b.actor.screen; if (!s) continue; const tr = `translate(${Math.round(s.x * sc)}px, ${Math.round((s.top - 4) * sc)}px) translate(-50%, -100%)`; if (b._tr !== tr) { b._tr = tr; b.el.style.transform = tr; } }
  }
  function updateAction() {
    const btn = $('actBtn');
    document.getElementById('joy').style.visibility = Game.modal || PX.Decor.active ? 'hidden' : '';
    if (Game.modal && Game.joy && Game.joy.active) Game.joyEnd();
    if (Game.modal || PX.Decor.active) { btn.classList.add('hidden'); $('capBtns').classList.add('hidden'); $('moreBtn').classList.add('hidden'); return; }
    if (Game.player.seat) { btn.textContent = '⬆️ 일어나기'; btn.classList.remove('hidden'); return; }
    const l = nearby(), it = l.find(i => i.type !== 'cap') || l[0];
    if (it) { btn.textContent = it.label; btn.classList.remove('hidden'); } else btn.classList.add('hidden');
    $('capBtns').classList.toggle('hidden', !capNear() || PX.Cap.onDuty() && Cap.mode !== 'follow' && !capNear());
    $('moreBtn').classList.toggle('hidden', l.length < 2);
  }

  // ---------- 시간 이벤트 ----------
  St.on('minute', () => {
    const S = St.S;
    if (S.time.min % 5 === 0 && Game.mapId) W.updateEvents(W.maps[Game.mapId], S.time, S.time.min);
    if (!Game.sleeping) S.energy = Math.max(0, S.energy - 0.025);
    Cap.msgTick();
    PX.Op.tick();
    PX.Rom.minute();
    // 새벽 2시까지 안 자면 쓰러지듯 잠든다
    if (!Game.sleeping && S.time.min >= 2 * 60 && S.time.min < 2 * 60 + 2 && !Game.passing) {
      Game.passing = true;
      Game.trigger(async () => { UI.toast('😵 너무 늦었다… 쓰러지듯 잠들었다', 3000); await U.sleep(800); await sleepUntil(8, true); Game.passing = false; });
    }
  });
  St.on('newDay', () => {
    const S = St.S;
    PX.Op.maybeSchedule();
    St.makeQuests();
    S.rel.cap.talksToday = 0;
    // 계절이 바뀌면 옷 갱신
    Game.player.app = PX.S.playerApp(S.player, St.season()); Game.capOutfit();
    if (S.time.d === 1) setTimeout(() => UI.toast(`🗓️ ${S.time.m}월 · ${Cal.SEASON_KO[St.season()]}`), 500);
  });
  window.addEventListener('resize', () => { W.resize(); snapCam(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.running && St.S) St.save(); });

  // ---------- 부팅 ----------
  async function boot() {
    W.setCanvas(cv); W.resize();
    Dlg.init();
    try { await Promise.race([document.fonts.load('16px Jua'), U.sleep(2500)]); } catch (e) { /* 글꼴 없이 진행 */ }
    $('loading').classList.add('hidden');
    UI.title();
  }
  Game.boot = boot;
  // 디버그/테스트용 훅
  window.__px = { Game, St, W, Cap, Dlg, UI, tapAt, interactables, nearest, enterBuilding, leaveRoom, sleepUntil, useObj, capMenu };
  boot();
})();
