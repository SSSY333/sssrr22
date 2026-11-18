// 메시지로 한 약속을 실제 약속으로: "내가 갈게" → 그 시간에 내가 있는 곳으로 온다 · "어디서 만나" → 데이트 약속
'use strict';
PX.Promise = (() => {
  const U = PX.U, St = PX.St, Cal = PX.Cal;
  const G = () => PX.Game;
  const DAY = 1440, now = () => St.absMin();
  const dates = () => (St.S.dates = St.S.dates || []);
  const busy = () => dates().some(d => d.state === 'planned' || d.state === 'on');
  const homeOf = () => PX.JOBS[St.S.player.job].home;
  // 장소 이름 → 맵 (데이트할 만한 곳 우선)
  function findMap(name) {
    if (!name) return null;
    const n = String(name).replace(/\s/g, '');
    const hit = Object.entries(PX.MAPS).filter(([id, m]) => m.name && !m.innRoom && (n.includes(m.name.replace(/\s|\(.*\)/g, '').slice(0, 4)) || m.name.replace(/\s/g, '').includes(n.slice(0, 4))));
    hit.sort((a, b) => (b[1].date ? 1 : 0) - (a[1].date ? 1 : 0));
    return hit.length ? hit[0][0] : null;
  }
  function add(d) { dates().push(Object.assign({ id: now() + Math.random(), state: 'planned', by: 'c', reminded: true }, d)); PX.UI.toast(`📅 약속: ${PX.Rom.dayKo(d.day)} ${Cal.fmtTime(d.min)} · ${d.name}`, 3600); if (PX.UI.badge) PX.UI.badge(); }
  // 대위가 내가 있는 곳으로 온다
  function come(mins) {
    if (busy()) return false;
    const g = G(), S = St.S, at = now() + U.clamp(Math.round(Number(mins) || 30), 10, 180);
    const md = PX.MAPS[g.mapId] || {}, map = md.home ? g.mapId : (md.kind === 'out' ? g.mapId : md.parent || g.mapId);
    add({ day: Math.floor(at / DAY), min: at % DAY, map, name: md.home ? '대위가 내 숙소로 오기' : `${PX.MAPS[map].name}에서 만나기`, kind: 'come' });
    return true;
  }
  function meet(place, time) {
    if (busy()) return false;
    const map = findMap(place); if (!map) return false;
    const S = St.S, m = /(\d{1,2})\s*[:시]\s*(\d{2})?/.exec(String(time || '')); let min = m ? (+m[1]) * 60 + (+(m[2] || 0)) : S.time.min + 60;
    if (m && +m[1] < 12 && S.time.min > 12 * 60 && (+m[1] + 12) * 60 > S.time.min) min += 12 * 60; // "7시" → 저녁 7시
    let day = S.day; if (min <= S.time.min + 10) day += 1;
    add({ day, min: min % DAY, map, name: PX.MAPS[map].name });
    return true;
  }
  function fromAI(plan) {
    try { if (plan.type === 'come') return come(plan.in); if (plan.type === 'meet') return meet(plan.place, plan.time); } catch (e) { /* 무시 */ }
    return false;
  }
  // 약속 시간: 'come'은 내가 있는 곳으로 찾아온다
  function tick(d) {
    const S = St.S, g = G(), at = d.day * DAY + d.min, t = now();
    if (t < at) return;
    d.state = 'done';
    const here = g.mapId === d.map, homeId = homeOf();
    if (PX.Cap.onDuty() || (S.cap.op && S.cap.op.phase === 'away')) { PX.Op.send({ t: '미안, 갑자기 근무가 잡혔어. 끝나면 바로 연락할게.', r: [] }); return; }
    if (here && d.map === homeId) { // 노크하고 들어온다
      if (g.cap.leaveSeat) g.cap.leaveSeat();
      { PX.Cap.moveTo(homeId, PX.MAPS[homeId].parent); const hm = PX.W.maps[homeId]; g.cap.x = hm.exit.x + 0.5; g.cap.y = hm.exit.y - 0.5; g.cap.setDirTo(g.player.x, g.player.y); PX.Cap.mode = 'linger'; S.cap.arriving = true; } // 문 앞에 선다
      g.trigger(async () => { g.modal++; try { await PX.Dlg.runLines([PX.Dlg.capPick(S.rel.cap.stage >= 4 ? [['N:똑똑. 문이 열리기도 전에 익숙한 목소리가 들린다.', 'C^:왔어. 약속대로.'], ['N:노크 두 번. 문틀을 피해 고개를 숙이며 대위가 들어온다.', 'C*:보고 싶어서 뛰어왔어. 진짜로.']] : [['N:똑똑.', 'C:왔어. 들어가도 되지?'], ['N:노크 소리. 대위가 문틈으로 고개를 내민다.', 'C^:약속 지키러 왔다.']])]); } finally { PX.Dlg.close(); g.modal--; } S.cap.arriving = false; if (PX.Cap.mode === 'linger') PX.Cap.startVisit(); }); // 노크 → 들어와서 방문
      return;
    }
    if (here) { // 바깥 · 다른 곳: 입구에서 걸어와 합류
      const m = PX.W.maps[d.map]; PX.Cap.moveTo(d.map); const a = m.kind === 'in' ? [m.exit.x + 0.5, m.exit.y - 0.5] : m.def.arrive ? [m.def.arrive[0] + 0.5, m.def.arrive[1] + 0.5] : [g.player.x + 2, g.player.y];
      g.cap.x = a[0]; g.cap.y = a[1]; PX.Cap.startFollow();
      setTimeout(() => g.bubble(g.cap, U.pickFresh('promiseCome', ['왔다. 오래 기다렸지?', '약속대로 왔어.', '찾았다. 가자.'])), 900);
      return;
    }
    PX.Op.send({ t: U.pick(['도착했는데 없네? 어디야? 내가 찾으러 갈게.', '약속 장소 왔어. 너 어디야? 그쪽으로 갈게.']), r: [['미안, 잠깐 나왔어.', 1, '괜찮아. 거기 있어. 금방 가.']] });
    if (PX.Cap.mode === 'sched') PX.Cap.mode = 'seek';
  }
  return { come, meet, fromAI, tick, findMap };
})();
