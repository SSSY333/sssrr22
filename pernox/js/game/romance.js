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
    { map: 'cafe', name: '향열매 카페', at: [12, 15, 19] }, { map: 'samgyup', name: '냉삼집', at: [12, 18, 19] }, { map: 'noodle', name: '은하 국수당', at: [12, 18, 19] }, { map: 'lake', name: '인공호수 공원', at: [11, 15, 18] },
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
    await PX.Dlg.runLines(PX.Dlg.capPick([['C!:…데이트 신청이야, 이거?', 'C^:받았다. 취소 불가.'], ['C*:네가 먼저 하자고 해 주니까 좋네.', 'C:그날 일 다 미리 끝내 놓을게.'], ['C:좋아. 십 분 일찍 가 있을게. 늘 그래.']]).flat());
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
    await PX.Dlg.runLines([`C:이번 주말에 ${pl.name} 갈래? ${Cal.fmtTime(min)}.`, U.pickFresh('dateAskTail', ['C*:데이트 신청이야. 정식으로.', 'C:싫으면 싫다고 해. 다른 데 찾으면 되니까.', 'C^:거기 가 보고 싶었어. 너랑.', 'C*:미리 말하는 거야. 그날 비워 둬.', 'C:시간 안 되면 말해. 날짜는 바꾸면 돼.', 'C;:…긴장했다. 데이트 신청은 매번 처음 같아.'].filter(l => !PX.Dlg.capSaid(l.slice(2))).concat(['C^:어때?']))]);
    const i = await PX.Dlg.choose([{ t: '좋아요.' }, { t: '다른 날이 좋아요.' }]);
    if (i === 0) { await PX.Dlg.say('player', '좋아요.'); await PX.Dlg.say('cap', PX.Dlg.capPick(['좋아. 그날 하루 비워 둔다.', '…좋다고 했다. 들었어.']), 'smile'); dates().push({ id: now(), day, min, map: pl.map, name: pl.name, state: 'planned', by: 'c' }); PX.UI.toast(`📅 약속: ${dayKo(day)} ${Cal.fmtTime(min)} · ${pl.name}`, 3500); }
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
      if (!d.reminded && t >= at - 120 && t < at) { d.reminded = true; if (PX.Op.together && PX.Op.together()) sendMsg(U.pick([`두 시간 뒤에 ${d.name} 가기로 한 거, 잊은 거 아니지?`, `이따 ${Cal.fmtTime(d.min)}에 ${d.name}. 이렇게 같이 있으니까 그냥 같이 가면 되겠다.`]), [['응, 같이 가요.', 2, '좋아. 시간 되면 내가 손 잡고 간다.'], ['설레요.', 3, '…나도. 옆에 있는데도 설레.']]); else sendMsg(U.pick([`이따 ${Cal.fmtTime(d.min)}, ${d.name}. 잊지 마.`, `두 시간 뒤에 ${d.name}. 나 벌써 옷 고르는 중.`]), [['곧 갈게요.', 2, '응. 먼저 가 있을게.'], ['설레요.', 3, '…나도.']]); }
      // 약속 시간에 이미 같이 있으면: 바람맞은 걸로 치지 않고, 같이 가거나 여기서 데이트하거나
      const withMe = ['follow', 'visit', 'stay'].includes(PX.Cap.mode) && g.cap.map === g.mapId;
      if (withMe && t >= at - 15 && t < at + 60) d.together = true;
      if (withMe && t >= at - 5 && t < at + 60 && !d.capThere && !d.asked && !g.modal && !g.transition) {
        d.asked = true;
        if (g.mapId === d.map) { d.state = 'on'; d.started = t; g.trigger(() => startDate(d, true)); return; }
        g.trigger(() => togetherAsk(d));
        return;
      }
      if (t >= at - 15 && t < at + 60 && !d.capThere) { // 대위가 먼저 가서 기다린다 (보이지 않는 이동)
        if (PX.Cap.mode !== 'follow' && PX.Cap.mode !== 'visit' && PX.Cap.mode !== 'stay' && PX.Cap.mode !== 'op') { d.capThere = true; PX.Cap.mode = 'date'; if (g.cap.map !== d.map) { PX.Cap.moveTo(d.map); const m = W.maps[d.map]; const a = m.def.arrive ? [m.def.arrive[0] + 1.5, m.def.arrive[1] - 1.5] : m.exit ? [m.exit.x + 0.5, m.exit.y - 2.5] : null; const tt = a && PX.Path.nearestWalkable(m, a[0], a[1], 4); if (tt) { g.cap.x = tt[0] + 0.5; g.cap.y = tt[1] + 0.5; } } }
      }
      if (d.capThere && g.mapId === d.map && g.cap.map === d.map && U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) < 6 && !g.modal) { d.state = 'on'; d.started = t; g.trigger(() => startDate(d)); }
      if (t >= at + 60 && d.together) { d.state = 'skipped'; return; } // 같이 있었으면 바람맞은 게 아니다
      if (t >= at + 60) { // 바람맞음: 탓하지 않는다
        d.state = 'missed'; if (PX.Cap.mode === 'date') PX.Cap.mode = 'sched';
        sendMsg(U.pick(['오늘 무슨 일 있었어? 괜찮으면 됐어. 다음에 또 잡자.', '바빴구나. 괜찮아. 무사하면 됐어.']), [['미안해요. 다음엔 꼭 갈게요.', 1, '응. 사과 안 해도 돼. 다음엔 내가 데리러 갈게.']]);
      }
      return;
    }
    if (d.state === 'on') { // 데이트 도중: 가끔 대위가 먼저 작은 순간을 만든다 (한 데이트에 최대 3번)
      const withMe = ['follow', 'visit', 'stay'].includes(PX.Cap.mode) && g.cap.map === g.mapId && !g.cap.hidden;
      if (!d.nextMo) d.nextMo = d.started + 20 + Math.floor(Math.random() * 15);
      if (withMe && t >= d.nextMo && (d.moN || 0) < 3 && !g.modal && !g.transition && U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) < 5) {
        d.moN = (d.moN || 0) + 1; d.nextMo = t + 35 + Math.floor(Math.random() * 25);
        g.trigger(() => dateMoment());
      }
    }
    if (d.state === 'on' && (t - d.started > 180 || g.mapId !== d.map && !PX.MAPS[g.mapId].date && PX.MAPS[g.mapId].kind === 'in' && PX.MAPS[g.mapId].home)) endDate(d);
  }
  // 같이 있을 때 약속 시간이 되면
  async function togetherAsk(d) {
    const g = G();
    g.modal++;
    let k;
    try {
      g.cap.setDirTo(g.player.x, g.player.y);
      await PX.Dlg.runLines(PX.Dlg.capPick([['C:어, 벌써 약속 시간이다.', `C*:${d.name}. 같이 갈래? 아니면 여기서 그냥 데이트할까.`], ['C^:이미 같이 있는데 약속 시간 됐네.', `C:${d.name} 갈까? 너 하고 싶은 대로.`]]));
      const opts = [{ t: `🚶 ${d.name} 같이 가기`, k: 'go' }, { t: '💕 여기서 데이트하기', k: 'here' }, { t: '🌙 오늘은 다음에 하자', k: 'later' }];
      const i = await PX.Dlg.choose(opts); k = opts[i].k;
      await PX.Dlg.say('player', opts[i].t.replace(/^\S+ /, ''));
      if (k === 'later') await PX.Dlg.runLines(PX.Dlg.capPick([['C:응. 오늘은 이렇게 같이 있는 걸로 충분해.'], ['C^:좋아. 약속은 다음에 다시 잡자. 대신 지금 손은 내 거.']]));
    } finally { PX.Dlg.close(); g.modal--; }
    if (k === 'later') { d.state = 'skipped'; return; }
    if (k === 'here') { d.map = g.mapId; }
    else if (PX.Act && PX.Act.travel && g.mapId !== d.map) await PX.Act.travel(d.map, 15);
    d.state = 'on'; d.started = now();
    await startDate(d, true);
  }
  async function startDate(d, together) {
    const S = St.S, g = G();
    PX.Cap.startFollow(); g.cap.setDirTo(g.player.x, g.player.y);
    if (d.kind === 'proposal') return proposal(d);
    const late = now() - (d.day * DAY + d.min);
    if (together) await lines(PX.Dlg.capPick([['C^:같이 오니까 기다릴 필요도 없고 좋다.', 'C*:오늘 데이트 시작.'], ['C:원래는 먼저 와서 기다리려고 했는데.', 'C~:같이 걸어온 게 더 좋았어.']]));
    else await lines([late > 10 ? PX.Dlg.capPick(['C:왔다. 늦은 거 아니야. 나도 방금 왔어. …거짓말이야.', 'C^:왔네. 기다리는 동안 열 번 시계 봤어.']) : PX.Dlg.capPick(['C:정확하네. 나는 십 분 일찍 왔어. 습관이야.', 'C*:딱 맞춰 왔다. 오늘 예쁘게 하고 왔네.'])]);
    if (PX.Mind) { PX.Mind.noteMeet(); PX.Mind.noteTalk('dateStart'); }
    St.addAff(4);
  }
  // 데이트 도중의 작은 순간들: 장소 분위기 × 관계 단계. 같은 장면은 다 돌기 전까지 다시 안 나온다
  const MOMENT = {
    any: { pre: [['N:대위가 걸음을 내 보폭에 맞춰 늦춘다. 처음엔 몰랐는데, 계속 그렇다.', 'C:…빨랐어? 버릇이야. 맞출게.'], ['C:아까부터 사람들이 쳐다보는데.', 'C;:내 키 때문이겠지. 신경 쓰지 마.', 'N:대위가 슬쩍 사람들 쪽 시야를 몸으로 가려 준다.'], ['C:오늘 몇 시까지 괜찮아?', { q: [['늦게까지요.', 2, ['C^:좋다. 그럼 천천히 다니자.']], ['정해 두진 않았어요.', 1, ['C:그럼 피곤해지면 말해. 바로 데려다줄게.']]] }], ['N:바람에 머리카락이 흐트러진다. 대위가 손을 뻗었다가 멈춘다.', 'C;:…머리. 붙었어. 떼도 돼?', 'N:허락하자 대위가 아주 조심스럽게 떼어 준다.']],
      love: [['N:걷다가 대위가 갑자기 멈춰서 나를 내려다본다.', 'C*:아니, 그냥. 오늘 예뻐서 한 번 더 보려고.'], ['C:손 차갑다. 이리 줘.', 'N:대위가 내 손을 자기 외투 주머니에 같이 넣는다. 주머니 안에서 손가락이 얽힌다.', 'C^:이제 따뜻하지.'], ['C:아까 그 사람이 우리 보고 신혼이냐고 물어볼 뻔했어.', { q: [['뭐라고 할 건데?', 3, ['C*:"아직요." 라고. 아직.']], ['아니라고 해.', 1, ['C;:…응. 아니라고. 아직은.']]] }], ['N:신호를 기다리는 동안 대위가 정수리에 턱을 살짝 얹는다.', 'C~:키 차이 활용하는 중.'], ['C:오늘 데이트 점수 몇 점이야?', { q: [['백 점.', 3, ['C^:만점이다. 기록해 둘게.']], ['아직 몰라. 남은 시간에 달렸지.', 2, ['C*:…그럼 지금부터 더 열심히 한다.']]] }]] },
    water: { pre: [['N:물 위로 빛나는 무언가가 튀어 오른다. 작은 발광 물고기다.', 'C:저거 봐. 저 녀석 길 잃었나 봐.', 'C^:…너도 봤지? 나 혼자 본 거 아니지?']], love: [['N:물가 난간에 나란히 기댄다. 물에 비친 둘의 그림자가 하나로 겹쳐 있다.', 'C*:물속 우리가 더 붙어 있네.', 'N:대위가 그림자처럼 한 걸음 더 붙는다.'], ['C:물에 손 넣어 봐. 차가워.', 'N:손을 넣자 대위가 물속에서 손을 잡는다.', 'C~:물속이라 아무도 못 봐.']] },
    sky: { pre: [['N:하늘을 가로지르는 긴 빛줄기. 유성이다.', 'C:소원 빌었어?', { q: [['빌었어요.', 2, ['C:무슨 소원인지는 안 물어볼게. 이뤄지라고.']], ['너무 빨라서 못 빌었어요.', 1, ['C^:다음 거 오면 내가 신호 줄게. 지금처럼 같이 보고 있으면 돼.']]] }]], love: [['N:별이 하나 떨어진다. 대위가 내 손을 잡고 눈을 감는다.', 'C*:같은 소원 빌었을 것 같다.', 'P:뭔데?', 'C^:지금 이대로, 오래.'], ['C:저기 저 별 빛, 이천 년 전에 출발한 거래.', 'C*:나는 지금 출발했어. 너한테.', 'C;:…방금 그 말 잊어. 너무 느끼했다.']] },
    bloom: { pre: [['N:꽃잎 하나가 대위 어깨에 내려앉는다. 대위는 모른다.', { q: [['떼 준다.', 2, ['C!:…아, 고마워.', 'C*:꽃잎이 나보다 먼저 너한테 들켰네.']], ['그냥 둔다.', 1, ['N:대위는 꽃잎을 단 채 한참을 걷는다. 조금 귀엽다.']]] }]], love: [['N:대위가 길가 꽃 하나를 가리킨다. 꺾지는 않는다.', 'C:저거 네 머리에 꽂으면 예쁘겠다. 근데 꺾으면 불쌍하니까.', 'C*:…대신 내가 귀 뒤로 머리 넘겨 줄게.'], ['N:꽃향기 속에서 대위가 고개를 숙여 내 머리 냄새를 맡는다.', 'C~:꽃보다 네가 더 좋은 냄새 나.']] },
    neon: { pre: [['N:네온 간판이 깜빡이며 대위 얼굴을 파랑, 분홍으로 물들인다.', 'C;:…왜 웃어.', 'C:내 얼굴 색 바뀌는 거 보고 웃은 거지. 알아.']], love: [['N:사람들이 몰려와 둘 사이를 갈라놓으려 한다. 대위가 손목을 잡아 끌어당긴다.', 'C*:놓치는 줄 알았다. 이제 안 놔.'], ['N:쇼윈도에 비친 둘을 본다. 대위가 유리에 대고 손가락으로 하트를 그린다.', 'C~:…아무도 못 봤지?']] },
    food: { pre: [['C:여기서 제일 맛있는 거 시켜. 오늘은 내가 산다.', 'C^:대신 다음엔 네가 사. 그래야 또 오지.']], love: [['N:대위가 내 접시에 제일 잘 익은 걸 자꾸 올려 준다.', 'C:먹어. 넌 많이 먹어야 돼.', 'P:{ob}는?', 'C*:너 먹는 거 보면 배불러. 진짜로.']] },
  };
  async function dateMoment() {
    const g = G();
    if (g.modal || g.cap.map !== g.mapId) return;
    const f = PX.Place && PX.Place.flavor ? PX.Place.flavor() : 'any', love = st() >= 4;
    const pool = [].concat((MOMENT[f] || {})[love ? 'love' : 'pre'] || [], MOMENT.any[love ? 'love' : 'pre']);
    g.cap.setDirTo(g.player.x, g.player.y);
    g.modal++;
    try { await PX.Dlg.runLines(PX.Dlg.capPick(pool), { reply: true }); } finally { PX.Dlg.close(); g.modal--; }
    St.addAff(2);
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
      await lines([`N:🎉 ${e.originalTitle}. ${e.description.slice(0, 60)}`, ...(withCap ? [`N:${e.captainReaction}`, PX.Dlg.capPick(['C^:축제다. 오늘은 손 놓지 마.', 'C*:사람 많다. 내 옆에 딱 붙어.', 'C:이런 날 같이 와서 좋다.'])] : [])]);
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
    await PX.Dlg.runLines(['N:연병장에 부대원들이 모였다. 다들 처음 보는 단정한 차림이다.', 'N:강태욱 중령이 앞에 선다. 오늘은 지휘관이 아니라 주례다.', `S:kang:${S.capName} 대위. 이 사람을 평생 지키겠나.`, 'C:예. 목숨 걸고.', 'S:kang:목숨은 걸지 말고. 오래 살아서 지켜라.', 'N:웃음이 터진다. 이준혁이 휘파람을 분다.', 'C:…네 차례야.']);
    const i = await PX.Dlg.choose([{ t: '평생 옆에 있을게요.' }, { t: '오래 살아서 같이 늙어요.' }]);
    await PX.Dlg.say('player', i === 0 ? '평생 옆에 있을게요.' : '오래 살아서 같이 늙어요.', 'blush');
    await PX.Dlg.runLines(['C^:…그 말 평생 기억할게.', 'N:대위가 허리를 숙인다. 부대원들의 환호 속에서 짧고 긴 입맞춤.', 'S:choi:이제 밥 먹어요?', 'N:남기철 조리장이 특식을 준비해 뒀다.']);
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
      g.trigger(() => lines([...U.pick([['N:문이 열린다.', 'C:다녀왔어.'], ['N:익숙한 발소리. 문틀에 머리 박는 소리.', 'C;:…다녀왔어.']]), PX.Dlg.capPick(['C:오늘 하루 어땠어?', 'C^:집에 오니까 네가 있네. 이게 제일 좋아.', 'C*:씻고 올게. 기다려. 아니, 먼저 자도 돼. 깨울 거지만.'])]));
    }
  }
  // 기념일: 연인 100·200·300·365·500·1000일, 결혼 1주년마다 (그날 첫 대화)
  function annivToday() {
    const S = St.S, r = S.rel.cap;
    if (r.loverSince == null) return null;
    const n = S.day - r.loverSince;
    if (n > 0 && n % 365 === 0) return { n, kind: 'lover' }; // 100일 같은 날짜 세기는 하지 않는다 · 1주년마다만
    if (S.marriedDay != null && n > 0 && (S.day - S.marriedDay) > 0 && (S.day - S.marriedDay) % 365 === 0) return { n: S.day - S.marriedDay, kind: 'wedding' };
    return null;
  }
  function annivCheck() {
    const S = St.S, a = annivToday(), g = G();
    if (!a || S.done['anniv_' + S.day]) return false;
    if (g.cap.map !== g.mapId || U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) > 4) return false;
    S.done['anniv_' + S.day] = 1;
    g.trigger(async () => { const bd = a.kind === 'wedding' ? { l: PX.Dlg.capPick([['C:오늘 무슨 날인지 알아?', 'C^:결혼기념일. 일 년 더 내 옆에 있어 줘서 고마워.'], ['C*:결혼기념일 선물. 이번에도 직접 깎았어.', 'C^:내년에도, 그다음 해에도.'], ['C:그날 네 손 떨리던 거 아직 기억나.', 'C^:나도 떨렸어. 지금 말하는 거야.']]) } : PX.Dlg.pick('v_anniv', PX.DLG_V2.anniv); await lines(bd ? bd.l : ['C:오늘 우리 기념일이야.']); St.addItem('mineral'); PX.UI.toast('🎁 기념일 선물: 대위가 깎은 광물 조각'); g.memory(a.kind === 'wedding' ? `결혼 ${Math.round(a.n / 365)}주년` : `연인 ${Math.round(a.n / 365)}주년`, '대위는 날짜를 하루도 틀리지 않았다.', true); St.addAff(8); });
    return true;
  }

  function minute() { tick(); weddingTick(); cohabTick(); if (St.S.time.min % 30 === 0) proposalCheck(); annivCheck(); if (PX.Bath) PX.Bath.noticeHair(); }
  return { askDate, capAskDate, nextDate, tick, minute, applyLeave, onLeave, festivalScene, overlay, fireworks, playerProposes, planWedding, proposalCheck, annivToday, dayKo, capFreeAt };
})();
