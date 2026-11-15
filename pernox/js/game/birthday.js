// 생일: 내 생일 · 대위 생일 (캐릭터 만들 때 / 설정에서 정한다)
// 내 생일: 0시 메시지 → 처음 만날 때 축하와 선물 → 저녁에 같이 있으면 케이크와 촛불
// 대위 생일: 전날 알림 → 처음 만날 때 내가 축하(선물 줄 수 있음) → 저녁에 같이 있으면 대위의 한마디
'use strict';
PX.Bday = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const S = () => St.S;
  const same = (b, t) => b && b.m === t.m && b.d === t.d;
  const mine = () => same(S().player.bday, S().time);
  const caps = () => same(S().capBday, S().time);
  const key = (k) => `bday_${k}_${S().time.y}`;
  const lv = () => { const s = S().rel.cap.stage; return s >= 4 ? 'lov' : s >= 2 ? 'mid' : 'pre'; };
  const pickL = (k, o) => U.pickFresh('bday_' + k + lv(), o[lv()]);
  const run = async (ls) => PX.Dlg.runLines(ls, { reply: true });
  const near = (r = 3.2) => { const g = G(); return g.cap && g.cap.map === g.mapId && !g.cap.hidden && U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) < r; };
  const withMe = () => ['follow', 'visit', 'stay'].includes(PX.Cap.mode);

  // ---------- 내 생일 ----------
  const MSG = {
    pre: ['생일 축하한다. 부대 기록 보다가 알았어. 좋은 하루 보내.', '오늘 생일이라며. 축하해. 나중에 커피 하나 살게.'],
    mid: ['0시 됐다. 생일 축하해. 제일 먼저 말하고 싶어서 안 잤어.', '생일 축하해. 오늘 하루는 네가 제일 주인공이야. 이따 꼭 보자.'],
    lov: ['0시 땡. 생일 축하해, 자기야. 세상에 태어나 줘서 고마워.', '자기야, 생일 축하해. 오늘 하루 비워 둬. 전부 내 거야. 아니, 전부 네 거야.'],
  };
  const MEET = {
    pre: [['C:생일이라며. 축하한다.', 'C:이거. 별거 아닌데, PX에서 제일 괜찮아 보이는 걸로 골랐어.']],
    mid: [['C*:생일 축하해. 오늘 하루 종일 이 말 하려고 기다렸어.', 'C:눈 감아 봐. …손 내밀고.', 'N:손바닥 위에 무언가가 조심스럽게 올려진다.', 'C^:뜯어 봐. 고민 엄청 했다.'],
      ['C:야, 생일. 축하해.', 'C;:…이런 거 잘 못 하는데. 그래도 해야 될 것 같아서.', 'N:대위가 등 뒤에 숨기고 있던 것을 불쑥 내민다.']],
    lov: [['N:대위가 다가오더니 아무 말 없이 꽉 끌어안는다.', 'C*:생일 축하해, 자기야. 네가 태어난 날이라서, 오늘이 일 년 중에 제일 좋은 날이야.', 'N:품에서 떨어지자 대위가 작은 상자를 내민다.', 'C^:열어 봐. 마음에 안 들면 거짓말로 좋다고 해 줘.'],
      ['C:생일 축하해. 오늘 아침부터 계속 이 말만 연습했어.', 'N:대위가 이마에 짧게 입을 맞추고 선물을 손에 쥐여 준다.', 'C*:저녁엔 더 있어. 기대해.']],
  };
  const GIFT = { pre: 'earthSnack', mid: 'bouquet', lov: 'perfume' };
  const CAKE = {
    pre: [['N:대위가 컵케이크 하나에 초를 꽂아 내민다.', 'C:소원 빌어. 크게는 말고.', 'N:촛불을 끄자 대위가 짧게 박수를 친다.', 'C:…생일 축하해. 진짜로.']],
    mid: [['N:대위가 작은 케이크를 들고 온다. 초가 삐뚤게 꽂혀 있다.', 'C;:식당 아주머니한테 사정해서 만들었어. 모양은 묻지 마.', 'C:소원 빌어. 그리고 하나는 나 관련으로 빌어 줘.', { q: [['(눈을 감고 소원을 빈다)', 3, ['N:촛불이 꺼진다. 대위가 조용히 웃는다.', 'C*:무슨 소원 빌었는지 안 물을게. 대신 이뤄지게 도와줄게.']], ['대위님이랑 내년에도 이러는 거요.', 4, ['C!:…', 'C*:그거 소원 아니야. 약속이야. 이미 이뤄졌어.']]] }]],
    lov: [['N:불이 꺼진다. 어둠 속에서 촛불 몇 개가 다가온다.', 'C:생일 축하합니다… 생일 축하합니다…', 'N:노래 실력은 형편없는데, 목소리가 떨린다. 진심이라서.', 'C*:사랑하는 우리 자기, 생일 축하합니다.', { q: [['(소원을 빌고 촛불을 끈다)', 3, ['N:촛불이 꺼지자 대위가 어둠 속에서 입을 맞춘다.', 'C^:소원 하나는 내가 방금 이뤄 줬다.']], ['…오빠도 같이 불어요.', 4, ['N:둘이 같이 촛불을 끈다. 어둠 속에서 대위가 웃는다.', 'C~:같이 빈 소원은 두 배로 이뤄진대. 방금 지어냈어.']]] }]],
  };
  async function myMeet() {
    const g = G(), s = S(); s.done[key('meet')] = 1;
    await run(pickL('meet', MEET));
    const gid = GIFT[lv()]; St.addItem(gid);
    PX.UI.toast(`🎁 ${U.josa(PX.ITEMS[gid].name, '을')} 받았다`);
    g.cap.showEmote('heart', 2); St.addAff(3);
    g.memory(`${s.time.y}년 내 생일`, `대위가 생일을 축하하며 ${U.josa(PX.ITEMS[gid].name, '을')} 줬다.`, true);
  }
  async function myCake() {
    const g = G(), s = S(); s.done[key('cake')] = 1;
    await run(pickL('cake', CAKE)); St.addAff(3);
    g.memory(`${s.time.y}년 생일 케이크`, '대위가 케이크에 초를 꽂아 왔다. 같이 촛불을 껐다.', true);
  }

  // ---------- 대위 생일 ----------
  const CMEET = {
    pre: [['C:…어? 내 생일 어떻게 알았어?', 'C;:부대에서 이런 거 챙겨 주는 사람 처음이야.']],
    mid: [['C!:…내 생일 기억했어?', 'C;:나 이런 거 진짜 약한데.', 'C*:고맙다. 올해 들은 말 중에 제일 좋다.']],
    lov: [['C!:…', 'C*:아침부터 아무도 모르길래 그냥 넘어가는 줄 알았어.', 'C~:네가 기억해 주면 됐어. 그거면 다 됐어.']],
  };
  async function capMeet() {
    const g = G(), s = S(); s.done[key('cmeet')] = 1;
    const gifts = Object.keys(s.inv).filter(k => s.inv[k] > 0 && PX.ITEMS[k] && ['gift', 'food'].includes(PX.ITEMS[k].cat) && k !== 'pass');
    const opts = [{ t: '생일 축하해요!' }];
    if (gifts.length) opts.push({ t: '🎁 선물 준비했어요.' });
    if (s.rel.cap.stage >= 4) opts.push({ t: '생일 축하해. (볼에 뽀뽀한다)' });
    const i = await PX.Dlg.choose(opts);
    await PX.Dlg.say('player', opts[i].t.replace(/^🎁 /, ''));
    await run(pickL('cmeet', CMEET));
    if (opts[i].t.startsWith('🎁')) {
      PX.Dlg.close();
      const it = await PX.UI.menu('대위에게 줄 선물', gifts.map(k => ({ t: `${PX.ITEMS[k].icon} ${PX.ITEMS[k].name}`, k })));
      if (it) {
        const like = PX.ITEMS[it.k].capLike || 0; St.addItem(it.k, -1);
        await run(like >= 2 ? ['C!:…이거 내가 갖고 싶었던 거.', 'C*:어떻게 알았어. 나 지금 좀 감동했다.'] : like >= 1 ? ['C^:고마워. 잘 쓸게. 아니, 아껴 둘게.'] : ['C;:…솔직히 나랑은 잘 안 맞는데.', 'C^:근데 네가 줬으니까 제일 소중한 거 됐다.']);
        St.addAff(4 + like * 2);
        g.memory(`${s.time.y}년 대위 생일`, `대위 생일에 ${U.josa(PX.ITEMS[it.k].name, '을')} 선물했다.`, true);
      }
    } else if (opts[i].t.includes('뽀뽀')) { await run(['C~:…생일 선물 받았다. 제일 좋은 걸로.']); St.addAff(5); g.memory(`${s.time.y}년 대위 생일`, '대위 생일에 볼에 입을 맞춰 줬다.', true); }
    else { St.addAff(3); g.memory(`${s.time.y}년 대위 생일`, '대위 생일을 기억해서 축하해 줬다.', false); }
    g.cap.showEmote('heart', 2);
  }
  const CEVE = {
    pre: [['C:오늘 축하해 줘서 고마웠어. 생일이 좀 덜 심심했다.']],
    mid: [['C:생일에 이렇게 누구랑 같이 있는 거, 몇 년 만이야.', 'C*:내년에도 부탁해.']],
    lov: [['C:올해 생일이 내 인생에서 제일 좋았어.', 'C*:이유는 알지? 너.', 'N:대위가 손을 꼭 잡는다.']],
  };

  // 대위가 처음 다가와 인사할 때 (captain.approach) · 처리했으면 true
  async function meet() {
    const s = S();
    if (mine() && !s.done[key('meet')]) { await myMeet(); return true; }
    if (caps() && !s.done[key('cmeet')]) { await capMeet(); return true; }
    return false;
  }
  // 같이 있는데 아직 안 했으면
  let t = 0;
  function tick(dt) {
    t -= dt; if (t > 0) return; t = 2;
    const g = G(), s = S();
    if (!g.cap || g.modal || g.transition || g.queue.length || !s.done.intro || !near()) return;
    if (PX.Cap.onDuty && PX.Cap.onDuty() && !withMe()) return;
    const ev = s.time.min >= 18 * 60;
    let fn = null;
    if (mine() && !s.done[key('meet')]) fn = myMeet;
    else if (mine() && ev && withMe() && !s.done[key('cake')]) fn = myCake;
    else if (caps() && !s.done[key('cmeet')]) fn = capMeet;
    else if (caps() && ev && withMe() && s.done[key('cmeet')] && !s.done[key('ceve')]) fn = async () => { s.done[key('ceve')] = 1; await run(pickL('ceve', CEVE)); };
    if (fn) g.trigger(async () => { g.modal++; try { await fn(); } finally { PX.Dlg.close(); g.modal--; } });
  }
  // 하루가 바뀔 때: 0시 메시지 · 알림
  function newDay() {
    const s = S(), name = s.capName;
    if (mine()) {
      s.messages.unshift({ id: St.absMin(), t: U.pickFresh('bdaymsg' + lv(), MSG[lv()]), r: [['고마워요!', 3, '오늘 얼굴 보자. 꼭.'], ['벌써 일어나 있었어요?', 2, '너 생일인데 자고 있을 수가 없지.']], day: s.day, min: 0, reply: null }); s.messages = s.messages.slice(0, 40); PX.UI.badge();
      setTimeout(() => PX.UI.toast('🎂 오늘은 내 생일! 대위에게서 메시지가 왔어요', 3200), 800);
    }
    if (caps()) setTimeout(() => PX.UI.toast(`🎂 오늘은 ${name}의 생일이에요`, 3200), 1400);
    const tm = PX.Cal.addDays(s.time, 1);
    if (same(s.capBday, tm)) setTimeout(() => PX.UI.toast(`🎈 내일은 ${name}의 생일이에요 · 선물 준비해 볼까요?`, 3200), 1400);
  }
  const isMine = (date) => same(S().player.bday, date), isCap = (date) => same(S().capBday, date);
  return { meet, tick, newDay, isMine, isCap };
})();
