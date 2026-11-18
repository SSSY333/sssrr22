// 대위의 부탁 · 대위가 먼저 해 주는 행동 (내 직업에 맞춰)
// easy: 그 자리에서 바로 · deep: 어디로 같이 가거나 뭘 가져다줘야 끝남(며칠 기억) · act: 대위가 내 일터에서 먼저 무언가 해 준다
'use strict';
PX.CapFavor = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const mins = () => St.absMin();
  const mapName = (id) => (PX.MAPS[id] && PX.MAPS[id].name) || '';
  const byId = (id) => (PX.CAP_FAVOR || []).find(f => f.id === id);
  const st = () => St.S.rel.cap.stage;
  const log = () => (St.S.done.favorLog = St.S.done.favorLog || []); // [{ id, day }] 최근 것부터

  const pending = () => { const p = St.S.cap.favor; return p && byId(p.id) ? p : null; };
  const near = (r = 3) => { const g = G(); return g.cap && g.cap.map === g.mapId && !g.cap.hidden && U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) < r; };
  const busy = () => { const g = G(); return g.modal || g.transition || g.queue.length; };
  const ready = (f) => (!f.go || G().mapId === f.go) && (!f.item || St.has(f.item));
  function todo(f) { // 남은 일 설명
    const a = [];
    if (f.go && G().mapId !== f.go) a.push(`${mapName(f.go)}에 같이 가기`);
    if (f.item && !St.has(f.item)) a.push(`${PX.ITEMS[f.item].icon} ${PX.ITEMS[f.item].name} 가져가기`);
    return a.join(' · ') || '대위 곁으로 가기';
  }
  function label() { const p = pending(); return p ? byId(p.id).ask[0][0].replace(/^C[*^;!~]?:/, '').slice(0, 18) + '…' : null; }

  // ---------- 고르기 ----------
  function cands(kind) {
    const S = St.S, job = S.player.job, L = log();
    const recent = (id) => L.some(x => x.id === id && S.day - x.day < 12);
    const all = (PX.CAP_FAVOR || []).filter(f => f.kind === kind && (f.job === job || f.job === '*') && st() >= f.s && !recent(f.id));
    const never = all.filter(f => !L.some(x => x.id === f.id));
    return never.length ? never : all;
  }
  function lastOf(kind) { const L = log(); const x = L.find(e => byId(e.id) && byId(e.id).kind === kind); return x ? x.day : -99; }
  function note(f) { const L = log(); const e = { id: f.id, day: St.S.day, st: 'asked' }; L.unshift(e); L.splice(40); return e; }
  // 기록 상태: done 들어줌 · no 거절 · wait 진행 중 · cancel 작전으로 취소 · expired 지나감
  function mark(id, st) { const e = log().find(x => x.id === id && (x.st === 'wait' || x.st === 'asked')); if (e) e.st = st; }
  const opBusy = () => { const o = St.S.cap.op; return !!(o && ['planned', 'away', 'return'].includes(o.phase)); };

  // ---------- 실행 ----------
  async function lines(ls) { await PX.Dlg.runLines(ls, { reply: true }); }
  async function scene(f) {
    const sc = U.pickFresh('favsc_' + f.id, f.sc);
    G().cap.setDirTo(G().player.x, G().player.y);
    await lines(sc);
  }
  function reward(f, n) {
    const S = St.S;
    St.addAff(n); S.stats.favors = (S.stats.favors || 0) + 1;
    G().cap.showEmote('heart', 1.6);
    if (f.mem && !S.done['favm_' + f.id]) { S.done['favm_' + f.id] = 1; G().memory(f.mem[0], f.mem[1], true); }
  }
  const NO = [['C:알았어. 괜찮아.'], ['C^:거절도 귀엽네. 알았어.'], ['C;:…응. 내가 할게.'], ['C:그래. 다음에 또 부탁할게.']];
  const LATER = [['C:응. 급한 거 아니야. 생각나면.'], ['C^:기다릴게. 오래 걸려도.']];

  async function offer(f) {
    const g = G(); g.modal++; const e = note(f);
    try {
      if (f.kind === 'act') { e.st = 'done'; await scene(f); reward(f, 1); return; }
      await lines(U.pickFresh('favask_' + f.id, f.ask));
      const opts = [{ t: f.yes }, { t: f.no }]; if (f.kind === 'deep') opts.splice(1, 0, { t: '지금은 좀… 나중에 해도 돼요?' });
      for (const o of opts) o.t = PX.Dlg.capTone(o.t); // 대위에게 하는 말: 관계에 맞는 말투로
      const i = await PX.Dlg.choose(opts);
      await PX.Dlg.say('player', opts[i].t);
      if (i === opts.length - 1) { e.st = 'no'; await lines(U.pickFresh('favno', NO)); return; }
      if (f.kind === 'easy') { e.st = 'done'; await scene(f); reward(f, 2); return; }
      // deep: 지금 바로 할 수 있으면 바로, 아니면 기억해 두고 같이 간다
      if (i === 0 && ready(f)) { e.st = 'done'; await scene(f); reward(f, 5); return; }
      e.st = 'wait';
      St.S.cap.favor = { id: f.id, made: mins(), until: mins() + 2 * 1440, nag: 0 };
      if (i === 1) await lines(U.pickFresh('favlater', LATER));
      PX.UI.toast(`📋 대위 부탁: ${todo(f)}`, 3200);
      if (f.go && i === 0 && PX.Cap.mode !== 'follow' && PX.Cap.mode !== 'visit' && PX.Cap.mode !== 'stay') PX.Cap.startFollow();
    } finally { PX.Dlg.close(); g.modal--; }
  }
  async function finish(p) {
    const g = G(), f = byId(p.id); g.modal++; St.S.cap.favor = null; mark(p.id, 'done');
    try {
      if (f.item) { St.addItem(f.item, -1); await PX.Dlg.say('player', `${PX.ITEMS[f.item].icon} 부탁한 거 가져왔어요.`); }
      await scene(f); reward(f, 5);
    } finally { PX.Dlg.close(); g.modal--; }
  }

  // ---------- 매 프레임 ----------
  let t = 0;
  function tick(dt) {
    t -= dt; if (t > 0) return; t = 2.5;
    const g = G(), S = St.S;
    if (!g.cap || busy() || !S.done.intro) return;
    const p = pending();
    if (p && opBusy()) { S.cap.favor = null; mark(p.id, 'cancel'); if (near(6)) g.bubble(g.cap, U.pickFresh('favop', ['작전 잡혔다. 그 부탁은 잊어. 다녀와서 다른 거 부탁할게.', '부탁한 거, 작전 때문에 못 하겠다. 신경 쓰지 마.']), 3); return; }
    if (p && mins() > p.until) { S.cap.favor = null; mark(p.id, 'expired'); if (near(6)) g.bubble(g.cap, U.pickFresh('favexp', ['그 부탁, 신경 쓰지 마. 괜찮아.', '부탁한 거 잊어도 돼. 진짜로.']), 2.6); return; }
    const mode = PX.Cap.mode, withMe = ['follow', 'visit', 'stay'].includes(mode);
    if (p) {
      const f = byId(p.id);
      const sameRoom = g.cap.map === g.mapId && !PX.Cap.onDuty() && PX.Cap.spotKind() !== 'sleep'; // 대위 막사처럼 대위가 쉬고 있는 곳에 내가 찾아가도 된다
      if (near(3) && ready(f) && (withMe || sameRoom || f.item && !f.go)) { finish(p); return; }
      if (near(5) && withMe && mins() > (p.nag || 0)) { p.nag = mins() + 90; g.bubble(g.cap, U.pickFresh('favnag', ['부탁한 거, 기억하지?', `${todo(f)}. 부탁해.`, '그 부탁, 언제든 괜찮아.']), 2.8); }
    }
    if (PX.Plan && PX.Plan.cur()) return; // 약속 하러 가는 중엔 새 부탁 안 함
    { const md = PX.MAPS[g.mapId] || {}, t2 = S.time.min; if (md.innRoom || md.adult || (md.home && (t2 >= 21 * 60 || t2 < 6 * 60)) || t2 >= 22 * 60 || t2 < 6 * 60) return; } // 은밀숙소 · 루비웨이 · 밤에 방에서는 일 부탁 안 함
    if (mins() < (S.cap.favorNext || 0) || !near(3.2)) return;
    if (PX.Cap.onDuty && PX.Cap.onDuty()) return;
    const atWork = g.mapId === PX.JOBS[S.player.job].work;
    let pick = null;
    // 내 일터에 같이 있을 때: 대위가 먼저 해 주는 것 (하루 한 번)
    if (atWork && lastOf('act') !== S.day && Math.random() < 0.5) pick = U.pick(cands('act'));
    if (!pick && withMe && lastOf('easy') !== S.day && Math.random() < 0.35) pick = U.pick(cands('easy'));
    if (!pick && withMe && !p && !opBusy() && S.day - lastOf('deep') >= 2 && st() >= 2 && Math.random() < 0.25) pick = U.pick(cands('deep'));
    S.cap.favorNext = mins() + 40 + Math.floor(Math.random() * 60);
    if (pick) offer(pick);
  }

  // ---------- 단말 "대위 부탁" 탭 ----------
  function pane(p, el) {
    const S = St.S, pf = pending();
    if (pf) {
      const f = byId(pf.id), left = Math.max(0, Math.ceil((pf.until - mins()) / 60));
      p.append(el('div', { class: 'ev' }, el('b', null, '📌 ' + f.ask[0][0].replace(/^C[*^;!~]?:/, '')), el('small', null, `할 일: ${todo(f)} · 남은 시간 약 ${left}시간`)));
    } else p.append(el('p', { class: 'muted' }, '지금 대위가 부탁해 둔 건 없어요. 같이 있다 보면 직업에 맞는 부탁을 하거나, 일터로 찾아와 뭔가 해 줘요.'));
    const L = log().slice(0, 10);
    if (L.length) p.append(el('p', { class: 'muted' }, '최근'));
    const ICON = { done: '✅', no: '🙅', cancel: '🚫', expired: '⌛', asked: '✅' }, WHY = { no: '거절함', cancel: '장기작전으로 취소', expired: '시간이 지남' };
    for (const x of L) { const f = byId(x.id); if (!f || x.st === 'wait') continue; const k = { easy: '부탁', deep: '깊은 부탁', act: '대위가 해 준 것' }[f.kind]; const st = x.st || 'done'; p.append(el('div', { class: 'ev' + (st === 'done' || st === 'asked' ? ' done' : '') }, el('b', null, `${f.kind === 'act' ? '💝' : ICON[st]} ${(f.kind === 'act' ? f.sc[0][0].replace(/^N:/, '') : f.ask[0][0].replace(/^C[*^;!~]?:/, '')).slice(0, 32)}…`), el('small', null, `${k}${WHY[st] ? ' · ' + WHY[st] : ''} · ${S.day - x.day === 0 ? '오늘' : S.day - x.day + '일 전'}`))); }
    p.append(el('p', { class: 'muted' }, `지금까지 들어준 대위 부탁 ${S.stats.favors || 0}건`));
  }
  return { tick, offer, pending, label, pane, cands, finish };
})();
