// 게임 상태 · 시간 흐름 · 관계 단계 · 저장(슬롯 2개 + 자동 저장, 버전 관리)
'use strict';
PX.St = (() => {
  const Cal = PX.Cal;
  const SAVE_VERSION = 2;
  const STAGES = ['아는 사이', '친한 사이', '썸', '고백 직전', '연인', '깊어진 사랑', '약혼', '부부'];
  const THRESH = [0, 100, 250, 450, 600, 800, 950, 1000];
  let S = null;

  function newGame(o) {
    const job = PX.JOBS[o.job];
    const start = o.start || { y: 2027, m: 1, d: 1 };
    const home = job.home;
    const st = {
      v: SAVE_VERSION, slot: o.slot || 1, created: Date.now(),
      player: { name: o.name, gender: o.gender, skin: o.skin, hair: o.hair, hairColor: o.hairColor, eye: o.eye, outfit: o.outfit, job: o.job },
      capName: o.capName, mode: o.mode,
      time: { y: start.y, m: start.m, d: start.d, min: 7 * 60 },
      startDate: { ...start }, speed: 'normal',
      pos: { map: home, x: 6.5, y: 4.5 },
      money: 300, energy: 90,
      inv: { coffee: 2, protein: 1 },
      rel: {
        cap: { aff: o.mode === 'lovers' ? 640 : 120, stage: o.mode === 'lovers' ? 4 : 1, lastTalkDay: -1, talksToday: 0, backoffUntil: 0, noFollowUntil: 0, lastApproach: 0, confessAsked: false, loverSince: o.mode === 'lovers' ? 0 : null, gifts: 0, giftDay: -1, skin: {} },
        npc: {},
      },
      homeLayout: null, // 꾸미기 저장 [[fid,x,y,r], ...]
      album: [], recent: {}, history: [], done: {}, messages: [], workLog: {},
      cap: { stay: false, lastVisitDay: -1, lastStayAskDay: -1, lastMsgMin: 0, follow: false, holding: false },
      day: 0, stats: { days: 1, work: 0, talks: 0 },
      settings: { speed: 'normal', sound: true },
    };
    if (job.military === false) st.inv.pass = 1;
    st.day = Cal.dayNumber(st.time.y, st.time.m, st.time.d);
    st.rel.cap.metDay = st.day - 365;
    for (const n of PX.NPCS) if (n.id !== 'cap') st.rel.npc[n.id] = { f: 20 + Math.floor(PX.U.hash(n.id) % 20), lastTalkDay: -1, talks: 0, idx: 0 };
    S = st;
    return st;
  }

  // ---------- 시간 ----------
  const listeners = { newDay: [], minute: [] };
  function on(ev, fn) { listeners[ev].push(fn); }
  function advance(mins) {
    let t = S.time;
    t.min += mins;
    while (t.min >= 1440) {
      t.min -= 1440;
      const nd = Cal.addDays(t, 1);
      t.y = nd.y; t.m = nd.m; t.d = nd.d;
      S.day = Cal.dayNumber(t.y, t.m, t.d);
      S.stats.days++;
      for (const fn of listeners.newDay) fn();
    }
    for (const fn of listeners.minute) fn(mins);
  }
  const season = () => Cal.season(S.time.m);
  const weather = () => Cal.weatherOf(S.time);
  const weekday = () => Cal.weekday(S.time.y, S.time.m, S.time.d);
  const isWeekend = () => { const w = weekday(); return w === 0 || w === 6; };
  const absMin = () => S.day * 1440 + S.time.min;
  const isNight = () => S.time.min < 6 * 60 || S.time.min >= 19 * 60 + 30;

  // ---------- 관계 ----------
  function capRel() { return S.rel.cap; }
  function stageName(i) { return STAGES[i]; }
  function addAff(n, reason) {
    const r = S.rel.cap;
    if (n > 0 && S.mode === 'fast') n *= 2;
    r.aff = Math.max(0, Math.min(1000, r.aff + n));
    // 자동 승급 (0~3), 연인은 고백 이벤트로
    let up = false;
    while (r.stage < 3 && r.aff >= THRESH[r.stage + 1]) { r.stage++; up = true; }
    if (r.stage === 4 && r.aff >= THRESH[5] && r.loverSince != null && S.day - r.loverSince >= 14) { r.stage = 5; up = true; }
    if (up && PX.UI) PX.UI.toast(`💞 관계가 깊어졌다: ${STAGES[r.stage]}`);
    return n;
  }
  function addNpcF(id, n) { const r = S.rel.npc[id]; if (r) r.f = Math.max(0, Math.min(100, r.f + n)); }

  // ---------- 아이템 · 돈 ----------
  function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; }
  const has = id => (S.inv[id] || 0) > 0;
  function spend(n) { if (S.money < n) return false; S.money -= n; return true; }

  // ---------- 저장 ----------
  const KEY = n => 'pernox.slot' + n;
  function safeLS() { try { const k = '__t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch (e) { return null; } }
  let memStore = {};
  const store = {
    get: k => { const ls = safeLS(); return ls ? ls.getItem(k) : memStore[k] || null; },
    set: k => v => { const ls = safeLS(); if (ls) ls.setItem(k, v); else memStore[k] = v; },
    del: k => { const ls = safeLS(); if (ls) ls.removeItem(k); else delete memStore[k]; },
  };
  function snapshot() {
    if (PX.Game && PX.Game.beforeSave) PX.Game.beforeSave(S);
    return JSON.stringify(S);
  }
  function save(slot = S.slot, auto = true) {
    try {
      S.slot = slot;
      S.savedAt = Date.now(); S.autoSaved = auto;
      store.set(KEY(slot))(snapshot());
      store.set('pernox.meta')(JSON.stringify({ last: slot }));
      return true;
    } catch (e) {
      // 용량 초과: 사진첩 이미지를 줄여 다시 시도
      if (S.album.length > 8) { S.album = S.album.slice(-8); try { store.set(KEY(slot))(snapshot()); return true; } catch (e2) { /* fallthrough */ } }
      console.warn('save failed', e);
      return false;
    }
  }
  function migrate(d) {
    if (!d.v) d.v = 1;
    if (d.v < 2) { // v1 → v2: 설정·메시지 필드 추가
      d.settings = d.settings || { speed: d.speed || 'normal', sound: true };
      d.messages = d.messages || [];
      d.cap = Object.assign({ stay: false, lastVisitDay: -1, lastStayAskDay: -1, lastMsgMin: 0, follow: false, holding: false }, d.cap || {});
      d.v = 2;
    }
    // 새로 추가된 NPC가 있으면 관계값 생성
    for (const n of PX.NPCS) if (n.id !== 'cap' && !d.rel.npc[n.id]) d.rel.npc[n.id] = { f: 25, lastTalkDay: -1, talks: 0, idx: 0 };
    return d;
  }
  function load(slot) {
    const raw = store.get(KEY(slot));
    if (!raw) return null;
    try { S = migrate(JSON.parse(raw)); S.slot = slot; return S; } catch (e) { console.warn('load failed', e); return null; }
  }
  function peek(slot) {
    const raw = store.get(KEY(slot));
    if (!raw) return null;
    try { const d = JSON.parse(raw); return { name: d.player.name, job: PX.JOBS[d.player.job].short, date: Cal.fmtDate(d.time) + ' ' + Cal.fmtTime(d.time.min), stage: STAGES[d.rel.cap.stage], cap: d.capName, savedAt: d.savedAt, v: d.v }; } catch (e) { return { broken: true }; }
  }
  function lastSlot() { try { return JSON.parse(store.get('pernox.meta') || '{}').last || null; } catch (e) { return null; } }
  function wipe(slot) { store.del(KEY(slot)); }

  return { newGame, get S() { return S; }, set S(v) { S = v; }, advance, on, season, weather, weekday, isWeekend, absMin, isNight, capRel, stageName, addAff, addNpcF, addItem, has, spend, save, load, peek, lastSlot, wipe, STAGES, THRESH, SAVE_VERSION, migrate };
})();
