// 데이트하다 밤이 깊으면: 대위가 그냥 가 버리지 않고 어디서 밤을 보낼지 묻는다
// 은밀숙소 · 내 숙소 · 숙소 앞까지 데려다주기 · 조금만 더 · 오늘은 여기까지 (바로 아침으로 넘어가지 않는다)
'use strict';
PX.LateNight = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const near = (id) => { const md = PX.MAPS[id] || {}; const out = md.kind === 'out' ? id : md.parent; return ['plaza', 'rubyway', 'lake', 'hill', 'glasshouse', 'glowpath', 'bluegarden', 'corridor', 'bridge', 'beach', 'farm', 'camp', 'silverdesert'].includes(out) || ['pub', 'inn', 'mask', 'midnight', 'dice', 'perfume', 'showroom', 'cafe', 'samgyup', 'flower', 'arcade', 'starroom'].includes(id); };
  const homeId = () => PX.JOBS[St.S.player.job].home;
  const LINES = {
    ask: { mid: [['C;:…벌써 이 시간이다.', 'C:시간이 왜 이렇게 빨리 가냐. 너랑 있으면.'], ['C:늦었다. 근데 보내기 싫다.', 'C*:어떡할래?']],
      lov: [['N:대위가 걸음을 멈추고 손을 꼭 쥔다.', 'C;:…자정 다 됐다. 근데 아직 너 보내기 싫어.', 'C*:오늘 밤, 어디서 보낼래?'], ['C~:별이 이렇게 많은데 집에 가는 거 아깝지 않아?', 'C*:…우리 오늘 같이 있을까.'], ['N:돔 천장의 인공 별빛이 한층 짙어진다.', 'C:이 시간 돔시티 좋다. 근데 너랑 있는 게 더 좋아.', 'C*:들어갈래, 아니면… 같이 있을래?']] },
    more: [['C^:좋아. 삼십 분 더. 진짜 삼십 분.', 'N:대위가 손을 다시 고쳐 잡는다.'], ['C*:…그 말 기다렸어.']],
    bye: { mid: [['C:응. 오늘 진짜 좋았다. 조심히 들어가.', 'C*:들어가면 메시지 하나만.'], ['C^:잘 자. 오늘 꿈에 나와.']],
      lov: [['N:대위가 이마에 오래 입을 맞춘다.', 'C:잘 자, 자기야. 아침에 제일 먼저 연락할게.'], ['C;:…보내기 싫은데. 알았어. 잘 자.', 'N:손을 놓았다가, 다시 잡았다가, 결국 꼭 끌어안고서야 놓는다.']] },
    escort: [['N:둘이 천천히 걸어 숙소 앞까지 왔다.', 'C:다 왔네. …왜 이렇게 금방이야.', 'C*:들어가. 들어가는 거 보고 갈게.'], ['N:숙소 앞 가로등 아래. 대위가 머리를 쓰다듬는다.', 'C^:오늘 고마웠어. 잘 자.']],
    home: [['C*:…진짜? 자고 가도 돼?', 'C^:얌전히 있을게. 아마.'], ['C~:좁은 침대에 둘이. …좋다.']],
  };
  const pickL = (pool) => PX.Dlg.capPick(pool);
  async function run(ls) { await PX.Dlg.runLines(ls, { reply: true }); }

  // captain.update 에서 잘 시간에 부른다 · true 면 대위가 바로 가지 않는다
  function check() {
    const S = St.S, g = G(), r = S.rel.cap, key = 'late_' + S.day;
    if (r.stage < 2 || PX.Cap.mode !== 'follow') return false;
    if (St.absMin() < (S.done.lateMore || 0)) return true; // '조금만 더' 중
    if ((S.done[key] || 0) >= 3) return false;
    if (g.modal || g.transition) return true;
    S.done[key] = (S.done[key] || 0) + 1;
    g.trigger(ask);
    return true;
  }
  async function ask() {
    const S = St.S, g = G(), st = S.rel.cap.stage, lov = st >= 4, here = g.mapId;
    g.modal++;
    let pick;
    try {
      g.cap.setDirTo(g.player.x, g.player.y);
      await PX.Dlg.runLines(pickL(LINES.ask[lov ? 'lov' : 'mid'])); // 바로 선택지로 (따로 대답 주고받기 없이)
      const opts = [];
      if (lov && near(here)) opts.push({ t: '🗝️ 은밀숙소에서 같이 있자', k: 'inn' });
      if (lov) opts[here === 'q_captain' ? 'unshift' : 'push']({ t: here === 'q_captain' ? '🪖 여기서 자고 갈래' : '🪖 {ob} 막사에서 자고 갈래', k: 'capRoom' });
      { const outer = (id) => { const md = PX.MAPS[id] || {}; return md.kind === 'out' ? id : md.parent; }, far = outer(here) !== PX.MAPS[homeId()].parent; if (lov) opts.push({ t: far ? `🏠 내 숙소로 같이 가자 (${PX.MAPS[PX.MAPS[homeId()].parent].name.split(' ')[0]} · 이동)` : '🏠 내 숙소로 같이 가자', k: 'home' }); }
      if (st >= 3) { const outer = (id) => { const md = PX.MAPS[id] || {}; return md.kind === 'out' ? id : md.parent; }, far = outer(here) !== PX.MAPS[homeId()].parent; opts.push({ t: far ? '🚌 셔틀 정류장까지 데려다줘' : '🪖 숙소 앞까지 데려다줘', k: 'escort' }); }
      if ((S.done['late_' + S.day] || 0) < 3) opts.push({ t: '🌙 조금만 더 있다 가자', k: 'more' });
      opts.push({ t: '오늘은 여기까지 하자', k: 'bye' });
      opts.forEach(o => { o.t = U.fmt(o.t, PX.Dlg.ctx()); });
      const i = await PX.Dlg.choose(opts);
      pick = opts[i].k;
      await PX.Dlg.say('player', opts[i].t.replace(/^\S+ /, '').replace(/ \(.*\)$/, ''), pick === 'bye' ? 'normal' : 'blush');
      if (pick === 'more') { await run(pickL(LINES.more)); S.done.lateMore = St.absMin() + 40; }
      else if (pick === 'bye') { await run(pickL(LINES.bye[lov ? 'lov' : 'mid'])); }
      else if (pick === 'escort') { /* 아래에서 */ }
      else if (pick === 'home') await run(pickL(LINES.home));
      else if (pick === 'capRoom') await run(pickL([['C*:…내 방? 좋아. 냉각기는 꺼 둘게.'], ['C^:내 침대 좁은데. …그래서 좋다.'], ['C~:응. 오늘은 내 구역에서 재울게.']]));
      else if (pick === 'inn') await run(pickL([['C!:…', 'C~:…응. 가자. 지금.'], ['C*:엘리베이터에서 손 놓지 마.'], ['C^:카드키는 내가 받을게.']]));
    } finally { PX.Dlg.close(); g.modal--; }
    if (pick === 'inn' || pick === 'home' || pick === 'escort' || pick === 'capRoom') { S.done['late_' + S.day] = 99; S.done.lateMore = (S.time.min < 6 * 60 ? S.day : S.day + 1) * 1440 + 7 * 60; } // 정했으면 오늘 밤은 다시 안 묻고 같이 있는다
    if (pick === 'bye') { PX.Cap.release(null, 30); if (PX.Mind) PX.Mind.notePart(30); return; }
    if (pick === 'more') return;
    if (pick === 'escort') {
      // 지금 둘이 있는 곳 기준: 숙소가 같은 구역이면 숙소 건물 문 앞까지 걸어서 · 다른 구역(돔시티)이면 이 구역 셔틀 정류장까지
      const hm = homeId(), out = PX.MAPS[hm].parent, outer = (id) => { const md = PX.MAPS[id] || {}; return md.kind === 'out' ? id : md.parent; }, here2 = outer(g.mapId);
      const same = here2 === out;
      const goOut = same ? out : here2;
      if (g.mapId !== goOut) await PX.Act.travel(goOut, 5);
      const m = PX.W.maps[goOut];
      let spot = null;
      if (same) { const d = m.doors.find(d => d.to === hm); if (d) spot = d.bld.b.door.f === 'L' ? [d.x + 0.5, d.y + 1.5] : [d.x + 1.5, d.y + 0.5]; }
      else { const st = m.objs.find(o => o.fid === 'shuttlestop'); if (st) { const a2 = PX.W.accessTile(m, st); if (a2) spot = [a2.x + 0.5, a2.y + 0.5]; } }
      if (spot) { await U.sleep(200); g.player.x = spot[0]; g.player.y = spot[1]; if (g.cap.map === g.mapId) { g.cap.x = spot[0] + 1; g.cap.y = spot[1]; } }
      g.modal++; try { await run(same ? pickL(LINES.escort) : [['C:여기서 셔틀 타면 돼. 도착하면 꼭 연락해.', 'C~:…같이 가 주고 싶은데, 아침 점호라. 미안.'], ['C:셔틀 올 때까지 같이 있을게.', 'C^:타는 것까지 보고 갈 거야.']][Math.random() < 0.5 ? 0 : 1]); } finally { PX.Dlg.close(); g.modal--; }
      PX.Cap.release(null, 30); return;
    }
    if (pick === 'inn') {
      if (g.mapId !== 'rubyway' && g.mapId !== 'inn') await PX.Act.travel('rubyway', 15);
      if (g.mapId !== 'inn') { await PX.Act.travel('inn', 2); }
      await U.sleep(400); g.trigger(() => PX.Act.innDesk(true)); // 로비 프런트에서 바로 방 고르기
      return;
    }
    if (pick === 'capRoom') { // 대위 막사에서 자고 가기
      if (g.mapId !== 'q_captain') { await PX.Act.travel('q_captain', near(g.mapId) ? 45 : 10); const m = PX.W.maps.q_captain; g.player.x = m.exit.x + 0.5; g.player.y = m.exit.y - 1.5; g.cap.x = g.player.x + 1; g.cap.y = g.player.y; }
      if (PX.Mind) PX.Mind.setContact('NONE'); g.cap.holding = false; g.cap.holdSide = 0; g.player.holdSide = 0;
      await U.sleep(400); g.trigger(() => PX.InnNight.capNight(true));
      return;
    }
    if (pick === 'home') {
      const hm = homeId();
      await PX.Act.travel(hm, near(g.mapId) ? 45 : 10);
      PX.Cap.mode = 'stay'; S.cap.stay = 'bed'; S.cap.lastStayAskDay = S.day;
      if (PX.Mind) PX.Mind.setContact('NONE'); g.cap.holding = false; g.cap.holdSide = 0; g.player.holdSide = 0; // 손잡고 온 자세 풀기
      if (!S.done.firstStay) { S.done.firstStay = 1; g.memory('첫 숙박', `${U.josa(S.capName, '이')} 데이트 끝에 내 숙소에서 같이 밤을 보냈다.`, true); }
      PX.UI.toast('🛌 침대에서 같이 뒹굴거리거나, 잠자기를 고를 수 있어요', 3600);
      setTimeout(() => g.trigger(async () => { await PX.Bed.lounge(); }), 900);
    }
  }
  return { check, ask };
})();
