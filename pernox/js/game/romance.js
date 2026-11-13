// 정식버전 관계 콘텐츠: 데이트 약속 · 휴가 신청 · 축제 당일 연출 · 프러포즈 · 약혼 · 결혼식 · 동거 · 기념일
'use strict';
PX.Rom = (() => {
  const U = PX.U, St = PX.St, Cal = PX.Cal, W = PX.W;
  const G = () => PX.Game;
  const now = () => St.absMin();
  const DAY = 1440;
  async function lines(ls) { const g = G(); g.modal++; await PX.Dlg.runLines(ls); PX.Dlg.close(); g.modal--; }
  const once = (k) => { const S = St.S; if (S.done[k]) return false; S.done[k] = 1; return true; };
  const st = () => St.S.rel.cap.stage;

  // ---------- 데이트 약속 ----------
  const PLACES = [
    { map: 'cafe', name: '향열매 카페', at: [12, 15, 19] }, { map: 'samgyup', name: '냉삼집', at: [12, 18, 19] }, { map: 'lake', name: '인공호수 공원', at: [11, 15, 18] },
    { map: 'hill', name: '관람언덕', at: [16, 18, 19] }, { map: 'starroom', name: '별비 투영실', at: [19, 20] }, { map: 'plaza', name: '중앙광장 분수대', at: [12, 18, 20] },
    { map: 'beach', name: '흰모래 해변돔', at: [11, 14, 16] }, { map: 'corridor', name: '인공노을 회랑', at: [17, 18] },
  ];
  const dates = () => (St.S.dates = St.S.dates || []);
  const nextDate = () => dates().find(d => d.state === 'planned' || d.state === 'on');
  // 그 시각에 대위가 시간이 되는가 (근무·장기작전·작전 예정)
  function capFreeAt(day, min) {
    const o = St.S.cap.op;
    if (o && o.phase !== 'done' && day * DAY + min >= o.start - 60 && day * DAY + min <= o.end + 240) return false;
    const wd = (Cal.dayNumber ? null : null, (St.weekday() + (day - St.S.day)) % 7 + 7) % 7;
    const weekend = wd === 0 || wd === 6 || onLeave('cap', day);
    return weekend ? min >= 10 * 60 : min >= 18 * 60;
  }
  async function askDate() {
    const S = St.S, g = G();
    if (nextDate()) { const d = nextDate(); PX.UI.toast(`📅 이미 약속이 있어요: ${dayKo(d.day)} ${Cal.fmtTime(d.min)} ${d.name}`); return; }
    const pl = await PX.UI.menu('📅 어디서 만날까요?', PLACES.map(p => ({ t: p.name, k: p })));
    if (!pl) return;
    const days = [0, 1, 2, 3, 4, 5, 6].map(k => S.day + k).filter(d => d > S.day || S.time.min < 17 * 60).slice(0, 5);
    const dy = await PX.UI.menu('📅 언제?', days.map(d => ({ t: dayKo(d), k: d })));
    if (!dy) return;
    const tm = await PX.UI.menu('⏰ 몇 시?', pl.k.at.map(h => ({ t: `${h}:00`, k: h * 60 })).filter(x => dy.k > S.day || x.k > S.time.min + 60));
    if (!tm) return;
    g.modal++;
    await PX.Dlg.say('player', `${dayKo(dy.k)} ${Cal.fmtTime(tm.k)}에 ${pl.k.name}에서 만나요.`);
    if (!capFreeAt(dy.k, tm.k)) {
      await PX.Dlg.runLines(['C;:아, 그때 근무야. …아니면 작전.', 'C:저녁이나 주말이면 무조건 비울게. 다시 정하자.']);
      PX.Dlg.close(); g.modal--; return;
    }
    await PX.Dlg.runLines([U.pick([['C!:…데이트 신청이야, 이거?', 'C^:받았다. 취소 불가.'], ['C*:네가 먼저 하자고 해 주니까 좋네.', 'C:그날 일 다 미리 끝내 놓을게.'], ['C:좋아. 십 분 일찍 가 있을게. 늘 그래.']])].flat());
    PX.Dlg.close(); g.modal--;
    dates().push({ id: now(), day: dy.k, min: tm.k, map: pl.k.map, name: pl.k.name, state: 'planned', by: 'p' });
    PX.UI.toast(`📅 약속: ${dayKo(dy.k)} ${Cal.fmtTime(tm.k)} · ${pl.k.name}`, 3500);
    if (PX.Mind) PX.Mind.noteTalk('date');
  }
  // 대위가 먼저 데이트를 신청 (동의할 때만 약속)
  async function capAskDate() {
    const S = St.S, g = G();
    if (nextDate() || st() < 2) return false;
    const pl = U.pick(PLACES), wd = St.weekday(), toSat = ((6 - wd) + 7) % 7 || 7, day = S.day + toSat, min = pl.at[pl.at.length - 1] * 60;
    if (!capFreeAt(day, min)) return false;
    g.modal++;
    await PX.Dlg.runLines([`C:이번 주말에 ${pl.name} 갈래? ${Cal.fmtTime(min)}.`, U.pick(['C*:데이트 신청이야. 정식으로.', 'C:싫으면 싫다고 해. 다른 데 찾으면 되니까.'])]);
    const i = await PX.Dlg.choose([{ t: '좋아요.' }, { t: '다른 날이 좋아요.' }]);
    if (i === 0) { await PX.Dlg.say('player', '좋아요.'); await PX.Dlg.say('cap', U.pick(['좋아. 그날 하루 비워 둔다.', '…좋다고 했다. 들었어.']), 'smile'); dates().push({ id: now(), day, min, map: pl.map, name: pl.name, state: 'planned', by: 'c' }); PX.UI.toast(`📅 약속: ${dayKo(day)} ${Cal.fmtTime(min)} · ${pl.name}`, 3500); }
    else { await PX.Dlg.say('player', '다른 날이 좋아요.'); await PX.Dlg.say('cap', '응. 네가 편한 날 말해 줘. 그날로 할게.', 'smile'); if (PX.Mind) PX.Mind.noteRefuse('dateAsk', 3 * DAY); }
    PX.Dlg.close(); g.modal--;
    return true;
  }
  function dayKo(d) { const S = St.S, k = d - S.day; if (k === 0) return '오늘'; if (k === 1) return '내일'; if (k === 2) return '모레'; return Cal.fmtDate(Cal.addDays({ y: 1, m: 1, d: 1 }, d)).replace(/^\d+\./, ''); }
  // 매 분: 약속 2시간 전 알림 → 대위가 먼저 가 있기 → 만나면 데이트 시작 → 끝 · 바람맞으면 순하게
  function tick() {
    const S = St.S, g = G(), d = nextDate();
    if (!d) return;
    const at = d.day * DAY + d.min, t = now();
    if (d.state === 'planned') {
      if (!d.reminded && t >= at - 120 && t < at) { d.reminded = true; sendMsg(U.pick([`이따 ${Cal.fmtTime(d.min)}, ${d.name}. 잊지 마.`, `두 시간 뒤에 ${d.name}. 나 벌써 옷 고르는 중.`]), [['곧 갈게요.', 2, '응. 먼저 가 있을게.'], ['설레요.', 3, '…나도.']]); }
      if (t >= at - 15 && t < at + 60 && !d.capThere) { // 대위가 먼저 가서 기다린다 (보이지 않는 이동)
        if (PX.Cap.mode !== 'follow' && PX.Cap.mode !== 'visit' && PX.Cap.mode !== 'stay' && PX.Cap.mode !== 'op') { d.capThere = true; PX.Cap.mode = 'date'; if (g.cap.map !== d.map) { PX.Cap.moveTo(d.map); const m = W.maps[d.map]; const a = m.def.arrive ? [m.def.arrive[0] + 1.5, m.def.arrive[1] - 1.5] : m.exit ? [m.exit.x + 0.5, m.exit.y - 2.5] : null; const tt = a && PX.Path.nearestWalkable(m, a[0], a[1], 4); if (tt) { g.cap.x = tt[0] + 0.5; g.cap.y = tt[1] + 0.5; } } }
      }
      if (d.capThere && g.mapId === d.map && g.cap.map === d.map && U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) < 6 && !g.modal) { d.state = 'on'; d.started = t; g.trigger(() => startDate(d)); }
      if (t >= at + 60) { // 바람맞음: 탓하지 않는다
        d.state = 'missed'; if (PX.Cap.mode === 'date') PX.Cap.mode = 'sched';
        sendMsg(U.pick(['오늘 무슨 일 있었어? 괜찮으면 됐어. 다음에 또 잡자.', '바빴구나. 괜찮아. 무사하면 됐어.']), [['미안해요. 다음엔 꼭 갈게요.', 1, '응. 사과 안 해도 돼. 다음엔 내가 데리러 갈게.']]);
      }
      return;
    }
    if (d.state === 'on' && (t - d.started > 180 || g.mapId !== d.map && !PX.MAPS[g.mapId].date && PX.MAPS[g.mapId].kind === 'in' && PX.MAPS[g.mapId].home)) endDate(d);
  }
  async function startDate(d) {
    const S = St.S, g = G();
    PX.Cap.startFollow(); g.cap.setDirTo(g.player.x, g.player.y);
    if (d.kind === 'proposal') return proposal(d);
    const late = now() - (d.day * DAY + d.min);
    await lines([late > 10 ? U.pick(['C:왔다. 늦은 거 아니야. 나도 방금 왔어. …거짓말이야.', 'C^:왔네. 기다리는 동안 열 번 시계 봤어.']) : U.pick(['C:정확하네. 나는 십 분 일찍 왔어. 습관이야.', 'C*:딱 맞춰 왔다. 오늘 예쁘게 하고 왔네.'])]);
    if (PX.Mind) { PX.Mind.noteMeet(); PX.Mind.noteTalk('dateStart'); }
    St.addAff(4);
  }
  async function endDate(d) {
    if (d.state !== 'on') return;
    d.state = 'done';
    const S = St.S, bd = PX.Dlg.pick('v_dateEnd', PX.DLG_V2.dateEnd);
    if (bd && G().cap.map === G().mapId) await lines(bd.l);
    S.stats.dates = (S.stats.dates || 0) + 1; St.addAff(6);
    if (once('date_' + d.map)) G().memory(`약속 데이트 · ${d.name}`, `약속한 시간에 ${d.name}에서 만났다.`, true);
  }
  function sendMsg(t, r) { PX.Op.send({ t, r }); }

  // ---------- 휴가 ----------
  function onLeave(who, day) { const L = St.S[who === 'cap' ? 'capLeave' : 'leave']; return !!(L && day >= L.from && day <= L.to); }
  async function applyLeave() {
    const S = St.S;
    if (S.leave && S.leave.to >= S.day) { PX.UI.toast(`🏖️ 이미 휴가 신청됨: ${dayKo(S.leave.from)}~${dayKo(S.leave.to)}`); return; }
    const used = (S.leaveUsed || []).filter(d => d > S.day - 30).length;
    if (used >= 6) { PX.UI.toast('🏖️ 30일 동안 쓸 수 있는 휴가(6일)를 다 썼어요'); return; }
    const o = S.cap.op; if (o && o.phase !== 'done' && o.joint) { PX.UI.toast('🛰️ 작전 명령이 걸려 있어서 휴가를 쓸 수 없어요'); return; }
    const it = await PX.UI.menu('🏖️ 휴가 신청 (내일부터)', [1, 2, 3].filter(n => n + used <= 6).map(n => ({ t: `${n}일`, k: n })));
    if (!it) return;
    S.leave = { from: S.day + 1, to: S.day + it.k }; S.leaveUsed = (S.leaveUsed || []).concat(Array.from({ length: it.k }, (_, i) => S.day + 1 + i));
    PX.UI.toast(`🏖️ 휴가 승인: ${dayKo(S.leave.from)}부터 ${it.k}일 · 배수아 하사가 근무표를 고쳐 줬어요`, 4000);
    // 대위도 같이 휴가를 맞춰 볼 수 있다 (연인 이상, 작전 없을 때)
    if (st() >= 4 && !(o && o.phase !== 'done') && Math.random() < 0.6) { S.capLeave = { from: S.leave.from, to: S.leave.to }; sendMsg('휴가 냈다며. 나도 냈어. 같은 날로.', [['진짜요?', 3, '진짜. 강 중령님이 웃으시더라. 어디 갈래?'], ['여행 가요!', 4, '좋아. 짐은 내가 들게.']]); }
    else if (st() >= 2) sendMsg('휴가 냈다며. 잘 쉬어. 나는 그날 근무라 아쉽다.', [['아쉬워요.', 2, '저녁엔 비워 둘게.']]);
  }

  // ---------- 축제 당일 연출 ----------
  const fx = [];
  function festivalScene() {
    const S = St.S, g = G(), md = PX.MAPS[g.mapId];
    const outId = md.kind === 'out' ? g.mapId : null;
    if (!outId) return;
    const ev = Cal.eventsOn(S.time).filter(e => ['festival', 'base'].includes(e.eventType) && Cal.openAt(e, S.time, S.time.min) && (e.location || '').match(outId === 'base' ? /부대|연병장|606/ : /돔|광장|상업|도시/));
    if (!ev.length) return;
    const e = ev[0], key = 'fest_' + e.id + '_' + S.day;
    if (S.done[key]) return;
    S.done[key] = 1;
    const withCap = g.cap.map === g.mapId && ['follow', 'date'].includes(PX.Cap.mode);
    if (/불꽃|별빛|퍼레이드|네온|기념제/.test(e.originalTitle) && St.isNight()) fireworks(12);
    g.trigger(async () => {
      await lines([`N:🎉 ${e.originalTitle}. ${e.description.slice(0, 60)}`, ...(withCap ? [`N:${e.captainReaction}`, U.pick(['C^:축제다. 오늘은 손 놓지 마.', 'C*:사람 많다. 내 옆에 딱 붙어.', 'C:이런 날 같이 와서 좋다.'])] : [])]);
      if (withCap) { St.addAff(4); if (once('festmem_' + e.id)) g.memory(e.originalTitle, `${e.originalTitle}에 대위와 함께 갔다. ${e.captainReaction}`, true); }
    });
  }
  function fireworks(n) { for (let i = 0; i < n; i++) fx.push({ t: -i * 0.35, x: 0.15 + Math.random() * 0.7, y: 0.12 + Math.random() * 0.25, c: U.pick(['#ff6b9b', '#ffd166', '#7fe3ff', '#b8f0c8', '#d6a2ff']) }); }
  let fxLast = 0;
  function overlay(g, Wd, Hd) {
    const tnow = performance.now() / 1000, dt = Math.min(0.05, fxLast ? tnow - fxLast : 0); fxLast = tnow;
    if (!fx.length) return;
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.t += dt;
      if (f.t < 0) continue;
      if (f.t > 1.6) { fx.splice(i, 1); continue; }
      const r = f.t < 0.4 ? 0 : (f.t - 0.4) * 28, cx = f.x * Wd, cy = f.y * Hd;
      g.fillStyle = f.c; g.globalAlpha = Math.max(0, 1 - (f.t - 0.4) / 1.2);
      if (f.t < 0.4) g.fillRect(cx, Hd - (Hd - cy) * (f.t / 0.4), 1, 3);
      else for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 2, 2); }
      g.globalAlpha = 1;
    }
  }

  // ---------- 프러포즈 · 약혼 · 결혼 · 동거 ----------
  // 깊어진 사랑 + 호감 950 + 연인 30일 이상 → 대위가 특별한 저녁 약속을 잡는다
  function proposalCheck() {
    const S = St.S, r = S.rel.cap;
    if (r.stage !== 5 || r.aff < 950 || r.loverSince == null || S.day - r.loverSince < 30) return;
    if (S.propose && (S.propose.state === 'planned' || S.day < (S.propose.retryDay || 0))) return;
    if (nextDate()) return;
    const o = S.cap.op; if (o && o.phase !== 'done') return;
    const day = S.day + 1, min = 19 * 60 + 30;
    S.propose = { state: 'planned', day };
    dates().push({ id: now(), day, min, map: 'hill', name: '관람언덕', state: 'planned', by: 'c', kind: 'proposal' });
    sendMsg('내일 저녁 일곱 시 반. 관람언덕. 꼭 와. …예쁘게 하고 와도 돼. 안 해도 예쁘지만.', [['무슨 날이에요?', 2, '와 보면 알아.'], ['갈게요.', 3, '응. 기다릴게.']]);
  }
  async function proposal(d) {
    const S = St.S, g = G(), r = S.rel.cap;
    g.modal++;
    await PX.Dlg.runLines(['N:노을이 돔 유리에 번진다. 대위가 평소와 다르게 말이 없다.', 'C:…연습 많이 했는데, 막상 하니까 다 까먹었다.', 'N:대위가 주머니에서 작은 것을 꺼낸다. 외곽에서 주운 광물을 직접 깎아 만든 반지다.', 'C:이거 만드는 데 석 달 걸렸어. 손이 커서.', 'C:나랑 결혼해 줄래?', 'C;:…대답 천천히 해도 돼. 백 년이라도 기다릴게.']);
    const i = await PX.Dlg.choose([{ t: '네. 할게요.' }, { t: '조금만 더 시간을 주세요.' }]);
    if (i === 0) {
      await PX.Dlg.say('player', '네. 할게요.', 'blush');
      await PX.Dlg.runLines(['C!:…', 'N:대위가 반지를 끼워 준다. 손이 떨려서 두 번 만에 들어간다.', 'C^:손 떨린 거 비밀이다.', 'N:대위가 나를 번쩍 안아 들었다가, 조심스럽게 내려놓는다.']);
      r.stage = 6; S.engagedDay = S.day; St.addItem('ring'); St.addAff(20);
      S.propose.state = 'yes'; d.state = 'done';
      g.memory('프러포즈', '관람언덕, 노을 아래에서. 직접 깎은 광물 반지.', true);
      PX.UI.toast('💍 약혼했다!', 3500);
    } else {
      await PX.Dlg.say('player', '조금만 더 시간을 주세요.');
      await PX.Dlg.runLines(['C:응. 당연하지.', 'C^:반지는 내가 갖고 있을게. 네가 됐다고 할 때 다시 꺼낼게.', 'C:…오늘 와 줘서 고마워. 그걸로 충분해.']);
      S.propose.state = 'wait'; S.propose.retryDay = S.day + 14; d.state = 'done';
    }
    PX.Dlg.close(); g.modal--;
  }
  // 플레이어가 반지를 건네는 경우 (선물하기에서 호출)
  async function playerProposes() {
    const S = St.S, g = G(), r = S.rel.cap;
    g.modal++;
    await PX.Dlg.runLines(['P:대위님. 이거… 받아 줄래요?', 'C!:…', 'C;:이거 반지야? 너 지금… 나한테 먼저?', 'C:…잠깐만. 숨 좀 쉬고.', 'C^:응. 할게. 결혼. 백 번이라도.', 'N:대위가 반지를 새끼손가락에 겨우 끼운다. 그리고 웃는다. 아주 오래.']);
    PX.Dlg.close(); g.modal--;
    r.stage = 6; S.engagedDay = S.day; St.addAff(25); S.propose = { state: 'yes', day: S.day };
    g.memory('내가 한 프러포즈', '반지는 대위 새끼손가락에 겨우 들어갔다. 대위는 그날 하루 종일 웃었다.', true);
    PX.UI.toast('💍 약혼했다!', 3500);
  }
  // 결혼식: 약혼 10일 뒤부터, 행정동 배수아 하사에게 신청 → 다음 토요일 11시 연병장
  async function planWedding() {
    const S = St.S;
    if (st() !== 6) return;
    if (S.wedding) { PX.UI.toast(`💒 결혼식: ${dayKo(S.wedding.day)} 11:00 · 연병장`); return; }
    if (S.day - (S.engagedDay || S.day) < 10) { PX.UI.toast('💒 약혼하고 열흘은 지나야 날짜를 잡을 수 있대요'); return; }
    const wd = St.weekday(), toSat = ((6 - wd) + 7) % 7 || 7;
    S.wedding = { day: S.day + toSat, min: 11 * 60, state: 'planned' };
    PX.UI.toast(`💒 결혼식 날짜: ${dayKo(S.wedding.day)} 11:00 · 606부대 연병장`, 4500);
    sendMsg('배 하사가 결혼식 날 잡아 줬대. …나 지금 손 떨려. 작전 때도 안 떨렸는데.', [['저도요.', 4, '같이 떨자. 그날까지.']]);
  }
  function weddingTick() {
    const S = St.S, g = G(), w = S.wedding;
    if (!w || w.state !== 'planned') return;
    const at = w.day * DAY + w.min, t = now();
    if (t >= at && t < at + 180 && g.mapId === 'base' && !g.modal) { w.state = 'on'; g.trigger(wedding); }
    else if (t >= at + 180 && w.state === 'planned') { w.day += 7; sendMsg('결혼식은 다음 주 토요일로 옮겼어. 괜찮아. 천천히 하자.', []); }
  }
  async function wedding() {
    const S = St.S, g = G(), r = S.rel.cap, p = g.player;
    // 부대원들이 모인다 (연병장 깃대 앞)
    const guests = ['kang', 'park', 'lee', 'choi', 'jung', 'yoon', 'bae', 'nam', 'oh', 'kimh'];
    guests.forEach((id, i) => { const n = g.npcs.find(n => n.id === id); if (!n) return; n.stop(); n.leaveSeat(); n.map = 'base'; n.x = p.x - 3 + (i % 5) * 1.2; n.y = p.y + 2 + Math.floor(i / 5) * 1.2; n.dir = 2; n.busy = true; });
    PX.Cap.moveTo('base'); g.cap.x = p.x + 1; g.cap.y = p.y; PX.Cap.mode = 'follow';
    fireworks(8);
    g.modal++;
    await PX.Dlg.runLines(['N:연병장에 부대원들이 모였다. 다들 처음 보는 단정한 차림이다.', 'N:강태욱 중령이 앞에 선다. 오늘은 지휘관이 아니라 주례다.', `N:"${S.capName} 대위. 이 사람을 평생 지키겠나." "예. 목숨 걸고." "목숨은 걸지 말고. 오래 살아서 지켜라."`, 'N:웃음이 터진다. 이준혁이 휘파람을 분다.', 'C:…네 차례야.']);
    const i = await PX.Dlg.choose([{ t: '평생 옆에 있을게요.' }, { t: '오래 살아서 같이 늙어요.' }]);
    await PX.Dlg.say('player', i === 0 ? '평생 옆에 있을게요.' : '오래 살아서 같이 늙어요.', 'blush');
    await PX.Dlg.runLines(['C^:…그 말 평생 기억할게.', 'N:대위가 허리를 숙인다. 부대원들의 환호 속에서 짧고 긴 입맞춤.', 'N:최민재가 "이제 밥 먹어요?"라고 묻는다. 남기철 조리장이 특식을 준비해 뒀다.']);
    PX.Dlg.close(); g.modal--;
    r.stage = 7; S.marriedDay = S.day; S.wedding.state = 'done'; St.addAff(30);
    guests.forEach(id => { const n = g.npcs.find(n => n.id === id); if (n) n.busy = false; });
    g.memory('결혼식', '606부대 연병장. 강태욱 중령의 주례, 부대원들의 환호, 그리고 대위의 떨리는 손.', true);
    PX.UI.toast('💒 부부가 되었다!', 4000);
    // 동거: 대위가 내 숙소로 들어온다
    g.trigger(async () => {
      g.modal++;
      await PX.Dlg.runLines(['C:그럼… 이제 짐 옮겨도 돼? 내 짐 별로 없어. 냉각기 하나랑 공구함.']);
      const k = await PX.Dlg.choose([{ t: '오늘부터 같이 살아요.' }, { t: '조금 천천히요.' }]);
      if (k === 0) { S.cap.cohab = true; await PX.Dlg.runLines(['C^:오늘부터 네 숙소가 우리 집이다.', 'C*:문틀은 내가 알아서 피할게.']); g.memory('같이 살기', '대위의 짐은 정말로 냉각기 하나와 공구함뿐이었다.', true); }
      else await PX.Dlg.runLines(['C:응. 네가 편할 때. 열쇠만 하나 줘. 가끔 와서 냉장고 채워 둘게.']);
      PX.Dlg.close(); g.modal--;
    });
  }
  // 동거: 밤 22:30 이후 플레이어가 집에 있으면 대위도 집으로 온다 (근무·작전 제외)
  function cohabTick() {
    const S = St.S, g = G();
    if (!S.cap.cohab) return;
    const home = PX.JOBS[S.player.job].home, t = S.time.min;
    const o = S.cap.op; if (o && o.phase !== 'done') return;
    if (t >= 22 * 60 + 30 && g.mapId === home && !['visit', 'stay', 'follow'].includes(PX.Cap.mode) && S.done.cohabDay !== S.day) {
      S.done.cohabDay = S.day;
      PX.Cap.moveTo(home, PX.MAPS[home].parent); PX.Cap.mode = 'visit';
      g.trigger(() => lines([U.pick(['N:문이 열린다. "다녀왔어."', 'N:익숙한 발소리. 문틀에 머리 박는 소리. "…다녀왔어."']), U.pick(['C:오늘 하루 어땠어?', 'C^:집에 오니까 네가 있네. 이게 제일 좋아.', 'C*:씻고 올게. 기다려. 아니, 먼저 자도 돼. 깨울 거지만.'])]));
    }
  }
  // 기념일: 연인 100·200·300·365·500·1000일, 결혼 1주년마다 (그날 첫 대화)
  function annivToday() {
    const S = St.S, r = S.rel.cap;
    if (r.loverSince == null) return null;
    const n = S.day - r.loverSince;
    if ([100, 200, 300, 365, 500, 730, 1000].includes(n)) return { n, kind: 'lover' };
    if (S.marriedDay != null && n > 0 && (S.day - S.marriedDay) > 0 && (S.day - S.marriedDay) % 365 === 0) return { n: S.day - S.marriedDay, kind: 'wedding' };
    return null;
  }
  function annivCheck() {
    const S = St.S, a = annivToday(), g = G();
    if (!a || S.done['anniv_' + S.day]) return false;
    if (g.cap.map !== g.mapId || U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) > 4) return false;
    S.done['anniv_' + S.day] = 1;
    g.trigger(async () => { const bd = PX.Dlg.pick('v_anniv', PX.DLG_V2.anniv); await lines(bd ? bd.l : ['C:오늘 우리 기념일이야.']); St.addItem('mineral'); PX.UI.toast('🎁 기념일 선물: 대위가 깎은 광물 조각'); g.memory(a.kind === 'wedding' ? `결혼 ${Math.round(a.n / 365)}주년` : `연인 ${a.n}일`, '대위는 날짜를 하루도 틀리지 않았다.', true); St.addAff(8); });
    return true;
  }

  function minute() { tick(); weddingTick(); cohabTick(); if (St.S.time.min % 30 === 0) proposalCheck(); annivCheck(); }
  return { askDate, capAskDate, nextDate, tick, minute, applyLeave, onLeave, festivalScene, overlay, fireworks, playerProposes, planWedding, proposalCheck, annivToday, dayKo, capFreeAt };
})();
