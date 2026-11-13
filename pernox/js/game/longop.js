// 장기작전: 일정 · 직업별 동행 · 원거리 단말 메시지 · 사진 · 그리움 · 복귀 절차 · 합동작전 일과
// 대위는 작전 중에 순간이동해서 나타나지 않는다. 멀리 있으면 단말로만 반응한다.
'use strict';
PX.Op = (() => {
  const U = PX.U, St = PX.St, Cal = PX.Cal;
  const G = () => PX.Game;
  const now = () => St.absMin();
  const op = () => St.S.cap.op || null;
  const DAY = 1440;
  const AREAS = ['외곽 3구역 능선', '붉은 협곡 지대', '은사막 북쪽 가장자리', '폐쇄 통신탑 일대', '모래폭풍 관측 구역'];
  const SQUAD = ['park', 'lee', 'choi', 'jung'];

  // ---------- 일정 ----------
  // 열흘에 한 번꼴, 이틀 전에 잡히고 대위가 미리 말해 준다
  function maybeSchedule() {
    const S = St.S, o = op();
    if (o && o.phase !== 'done') return;
    if (S.rel.cap.stage < 1) return;
    const last = o ? o.end : -1e9;
    if (now() - last < 9 * DAY || Math.random() > 0.14) return;
    plan();
  }
  function plan(opts = {}) {
    const S = St.S, job = S.player.job;
    const days = opts.days || U.pick([3, 4, 5, 5, 6, 7, 7, 10]);
    const startDay = S.day + (opts.inDays != null ? opts.inDays : 2);
    // 직업별 동행: 수색팀은 함께 · 군의관·정비는 가끔 · 민간 연구원은 승인된 공동 조사일 때만
    const p = { scout: 1, medic: 0.25, engineer: 0.25, researcher: 0.12 }[job] || 0;
    const joint = opts.joint != null ? opts.joint : Math.random() < p;
    S.cap.op = { phase: 'planned', startDay, start: startDay * DAY + 6 * 60, days, end: (startDay + days) * DAY + 14 * 60, joint, area: U.pick(AREAS), comms: Array.from({ length: days + 1 }, (_, i) => i === 0 || Math.random() > 0.2), sent: {}, queue: [], jointDone: {}, told: false, role: joint ? { scout: '수색팀 소위', medic: '의료 지원', engineer: '현장 기술 지원', researcher: '공동 안전구역 조사' }[job] : null };
    return S.cap.op;
  }
  const isAway = (id) => { const o = op(); return !!(o && o.phase === 'away' && (id === 'cap' || (SQUAD.includes(id) && !o.joint) || (o.joint && SQUAD.includes(id)))); };
  const inField = () => { const o = op(); return !!(o && o.phase === 'away' && o.joint); };
  const dayIdx = () => { const o = op(); return o ? Math.floor((now() - o.start) / DAY) + 1 : 0; };

  // 매 분 호출
  function tick() {
    const S = St.S, o = op(), t = now(), g = G();
    if (!o) return;
    if (o.phase === 'planned') {
      // 전날 저녁까지 못 만났으면 단말로 알린다
      if (!o.told && t >= o.start - DAY + 18 * 60 - 6 * 60) { o.told = true; send(o.joint ? { t: `작전 명령 내려왔어. 내일 아침 6시, ${o.days}일. 이번엔 같이 간다. 장비 챙겨.`, r: [['네, 준비할게요.', 2, '좋아. 내 뒤로 두 걸음. 그것만 기억해.'], ['떨려요.', 2, '정상이야. 내가 있어.']] } : { t: `나 내일 아침에 장기작전 나가. ${o.days}일. 위치는 말 못 해. 미안.`, r: [['조심히 다녀와요.', 3, '응. 꼭 돌아올게. 약속.'], ['가기 전에 얼굴 봐요.', 3, '이따 저녁에 갈게. 기다려.']] }); }
      if (t >= o.start) depart();
      return;
    }
    if (o.phase === 'away') {
      if (!o.joint) { awayMessages(); St.S.cap.mem && (St.S.cap.mem.longing = Math.min(100, (St.S.cap.mem.longing || 0) + 100 / (o.days * DAY))); }
      if (t >= o.end) o.joint ? jointReturn() : returnHome();
      return;
    }
    if (o.phase === 'return') returnTick();
  }

  // ---------- 출발 ----------
  function depart() {
    const S = St.S, o = op(), g = G();
    o.phase = 'away';
    PX.Cap.release(null, 0);
    if (o.joint) { g.trigger(jointDepart); return; }
    PX.Cap.moveTo(null); g.cap.map = null; PX.Cap.mode = 'op';
    send({ t: '출발했어. 수송선 안이야.', photo: 'ship', r: [['조심히 다녀와요.', 2, '응. 도착하면 연락할게.'], ['벌써 보고 싶어요.', 3, '…출발한 지 십 분 됐어. 나도.']] });
  }
  // ---------- 원거리 메시지 ----------
  const MSG = {
    1: [{ t: '아침 먹었어? 난 먹었어. 맛은 없었고.', r: [['먹었어요.', 1, '잘했어. 나 없다고 거르지 마.'], ['아직이요.', 1, '지금 먹어. 확인한다.']] }, { t: '도착했다. 야영지 치는 중. 바람이 엄청 분다.', photo: 'camp', r: [['조심해요.', 2, '응. 텐트가 날아가면 사진 보내 줄게.']] }],
    2: [{ t: '오늘 하루 종일 걸었어. 다리 아프다.', r: [['고생했어요.', 2, '그 말 들으니까 반은 나았다.'], ['주물러 주고 싶다.', 3, '돌아가면 해 줘. 기억해 둔다.']] }, { t: '여긴 바람이 엄청 불어. 모래가 안 들어간 데가 없어.', photo: 'desert', r: [['물 많이 마셔요.', 2, '응. 너 말 들으려고 방금 마셨어.']] }, { t: '너 지금 뭐 해?', r: [['일하는 중이에요.', 1, '열심히 하네. 나도 열심히 할게.'], ['대위님 생각이요.', 3, '…지금 그 말 때문에 경계 서다가 웃었어.']] }],
    3: [{ t: '이상한 광물 하나 찾았어. 네가 좋아할 것 같아서 챙겨 놨어.', photo: 'mineral', r: [['예뻐요!', 2, '실물이 더 예뻐. 너처럼.'], ['위험한 건 아니죠?', 2, '박 중사가 두 번 확인했어.']] }, { t: '오늘은 통신이 좀 불안정해. 답 늦어도 걱정하지 마.', r: [['알겠어요.', 1, '고마워.']] }],
    mid: [{ t: '보고 싶다.', r: [['저도요.', 3, '…지금 근무만 아니면 뛰어갔어.'], ['얼마 안 남았어요.', 2, '응. 세고 있어.']] }, { t: '나 돌아가면 하루는 네 옆에 붙어 있을 거야.', r: [['좋아요.', 3, '취소 불가다.'], ['하루는 너무 길어요.', 1, '그럼 두 시간만 붙어 있을게. 네가 싫다고 하면.']] }, { t: '박 중사가 나보고 단말 좀 그만 보래.', photo: 'squad', r: [['안 돼요. 계속 봐요.', 3, '명령 접수.'], ['박 중사님 말 들어요.', 1, '…알았어. 대신 밤에 볼게.']] }, { t: '정비하다가 손 다쳤어. 아니, 긁힌 거. 별거 아니야.', photo: 'gear', r: [['소독했어요?', 2, '했어. 네가 물어볼 줄 알았어.'], ['조심 좀 해요!', 2, '응. 혼나니까 좋네.']] }],
    late: [{ t: '오늘은 진짜 네 목소리 듣고 싶네.', r: [['저도요.', 3, '돌아가면 하루 종일 말 걸어 줘.']] }, { t: '이제 며칠 안 남았어.', r: [['기다릴게요.', 3, '응. 그 말 들고 버틴다.']] }, { t: '돌아가면 안아 줘. 오래.', r: [['약속해요.', 3, '약속받았다. 저장.'], ['얼마나요?', 2, '내가 됐다고 할 때까지. 안 할 거지만.']] }],
    last: [{ t: '내일 돌아가. 수송선 오후 도착.', photo: 'selfie', r: [['마중 나갈게요.', 3, '…보고하고 씻고 갈게. 냄새나니까. 기다려.'], ['무사히 와요.', 2, '응. 늘 그랬듯이.']] }],
    night: [{ t: '여긴 별이 엄청 많아. 너도 보고 있어?', photo: 'night', r: [['네, 보고 있어요.', 3, '같은 거 보는 중이네.']] }, { t: '잘 자. 꿈에서 보자.', r: [['잘 자요.', 2, '응. 내 꿈 꿔.']] }, { t: '경계 근무 중. 졸리다. 너 생각하면 안 졸려.', r: [['힘내요.', 2, '두 시간 남았다. 버틴다.']] }],
    meal: [{ t: '저녁은 전투식량 3번. 그나마 제일 맛있는 거야.', photo: 'meal', r: [['맛있게 먹어요.', 1, '네가 먹으라니까 맛있게 먹을게.'], ['돌아오면 냉삼 먹어요.', 3, '그거 들고 버틴다. 진짜로.']] }],
  };
  function awayMessages() {
    const S = St.S, o = op(), d = dayIdx(), min = S.time.min;
    if (d < 1 || d > o.days) return;
    const comms = o.comms[d] !== false;
    const slots = [[9 * 60, 'day'], [12 * 60 + 30, 'meal'], [16 * 60, 'day'], [21 * 60 + 30, 'night']];
    const longing = (S.cap.mem && S.cap.mem.longing) || 0;
    const nSlots = longing > 60 ? 4 : longing > 30 ? 3 : 2; // 그리울수록 자주
    for (let i = 0; i < nSlots; i++) {
      const [at, kind] = slots[i];
      const key = d + ':' + i;
      if (o.sent[key] || min < at) continue;
      o.sent[key] = 1;
      const pool = kind === 'meal' ? MSG.meal : kind === 'night' ? MSG.night : d === 1 ? MSG[1] : d === 2 ? MSG[2] : d === 3 ? MSG[3] : d === o.days ? MSG.last : d >= o.days - 1 ? MSG.late : MSG.mid;
      const usedKey = 'opmsg', m = pickFresh(pool, usedKey);
      if (!m) continue;
      if (comms) send(m); else o.queue.push(m);
    }
    // 통신 복구: 밀린 메시지를 한꺼번에
    if (comms && o.queue.length) { send({ t: `통신 복구됐다. 밀린 거 보낸다. (${o.queue.length}개)`, r: [] }); for (const m of o.queue.splice(0)) send(m, true); }
  }
  function pickFresh(pool, key) { const S = St.S; S.done[key] = S.done[key] || []; const c = pool.filter(m => !S.done[key].includes(m.t)); const m = U.pick(c.length ? c : pool); S.done[key] = [m.t, ...S.done[key]].slice(0, 30); return m; }
  function send(m, quiet) {
    const S = St.S;
    const msg = { id: now() + Math.random(), t: m.t, r: m.r || [], day: S.day, min: S.time.min, reply: m.r && m.r.length ? null : 'none', photo: m.photo ? photo(m.photo) : null };
    S.messages.unshift(msg); S.messages = S.messages.slice(0, 40);
    if (msg.photo && !quiet) { S.capPhotos = S.capPhotos || []; S.capPhotos.unshift({ day: S.day, kind: m.photo, img: msg.photo, t: m.t }); S.capPhotos = S.capPhotos.slice(0, 24); }
    if (!quiet) PX.UI.toast(`📱 ${S.capName}: ${m.t}${m.photo ? ' 📷' : ''}`, 4200);
    PX.UI.badge();
  }

  // ---------- 사진 (대위의 SD 도트 + 배경을 즉석에서 그린다) ----------
  function photo(kind) {
    const W = 120, H = 90, c = PX.G.canvas(W, H), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const sky = { ship: '#2a3240', camp: '#e8956a', desert: '#f2b07a', mineral: '#3a2a3a', squad: '#d98d6c', gear: '#4a5560', night: '#141028', meal: '#5a4a3a', selfie: '#e8956a' }[kind] || '#555';
    R(0, 0, W, H, sky);
    if (kind === 'ship') { R(0, 0, W, H, '#3a4250'); for (let x = 6; x < W; x += 28) { R(x, 12, 20, 14, '#0e1220'); R(x + 3, 15, 2, 2, '#fff'); R(x + 12, 19, 1, 1, '#fff'); } R(0, 70, W, 20, '#2a303a'); }
    else if (kind === 'night') { for (let i = 0; i < 50; i++) R((i * 37) % W, (i * 53) % 55, 1, 1, i % 5 ? '#fff' : '#ffd166'); R(0, 62, W, 28, '#5a2f25'); R(18, 52, 26, 12, '#3f5a3a'); R(30, 46, 2, 6, '#3f5a3a'); }
    else if (kind === 'mineral') { R(0, 60, W, 30, '#5a3a30'); for (const [x, h, col] of [[50, 26, '#b9a0ff'], [62, 34, '#d6c0ff'], [74, 22, '#9b7fd0']]) { R(x, 60 - h, 10, h, col); R(x + 2, 62 - h, 3, h - 6, '#ffffff55'); } }
    else if (kind === 'meal') { R(0, 0, W, H, '#6b5a48'); R(20, 30, 80, 46, '#9aa3ad'); R(26, 36, 30, 16, '#c9a27a'); R(60, 36, 34, 16, '#7fb86a'); R(26, 56, 68, 14, '#e8d6b0'); }
    else if (kind === 'gear') { R(0, 0, W, H, '#4a5560'); R(10, 50, 100, 30, '#5a5f66'); R(30, 40, 50, 18, '#3a3f46'); R(40, 44, 10, 10, '#ffd166'); R(60, 46, 14, 6, '#d0563b'); }
    else { R(0, 54, W, 36, '#c4613f'); R(0, 48, W, 8, '#d97a4f'); R(70, 30, 30, 22, '#8a3b30'); if (kind === 'camp' || kind === 'selfie') { R(12, 44, 30, 14, '#5a6b4f'); R(22, 36, 10, 8, '#5a6b4f'); } }
    // 인물 (대위 + 단체사진이면 팀원)
    const capApp = Object.assign({}, G().cap.app); delete capApp._k;
    if (kind === 'ship' || kind === 'camp') capApp.hat = '#3f4a30';
    const who = kind === 'squad' ? ['park', 'cap', 'lee'] : ['desert', 'mineral', 'meal', 'gear'].includes(kind) ? [] : ['cap'];
    who.forEach((id, i) => {
      const app = id === 'cap' ? capApp : Object.assign({}, PX.NPC_BY_ID[id].look);
      const f = PX.S.get(app, 'idle', 0, 'F', id === 'cap' ? 'smirk' : 'smile');
      const sc = id === 'cap' ? 2 : 1.6, w = f.c.width * sc, h = f.c.height * sc;
      const x = who.length === 1 ? (W - w) / 2 + 14 : 10 + i * 36, y = H - h + (id === 'cap' ? 26 : 22);
      g.imageSmoothingEnabled = false; g.drawImage(f.c, x, y, w, h);
    });
    if (kind === 'selfie' || kind === 'ship') { R(4, 4, 30, 9, '#00000066'); g.fillStyle = '#fff'; g.font = '7px sans-serif'; g.fillText(kind === 'ship' ? 'IN TRANSIT' : 'D-1', 7, 11); }
    return c.toDataURL('image/png');
  }

  // ---------- 복귀 (혼자 다녀온 경우): 도착 → 보고 → 장비 반납 → 검진 → 샤워·환복 → 플레이어 찾기 ----------
  const RETURN_STEPS = [[0, 'base.gate', '부대 도착'], [30, 'ops.cap', '복귀 보고'], [60, 'hg.w2', '장비 반납'], [90, 'med.patient', '의료 확인'], [120, 'shower', '샤워·환복'], [150, null, '찾아가기']];
  function returnHome() {
    const S = St.S, o = op();
    o.phase = 'return'; o.retStart = now();
    PX.Cap.mode = 'sched';
    S.cap.giftPending = 'mineral';
    const m = PX.Mind.mem(); m.reunion = { days: o.days }; m.longing = Math.max(m.longing || 0, 70);
    send({ t: '착륙했다. 보고하고, 장비 반납하고, 씻고 갈게. 두 시간만 기다려.', r: [['기다릴게요.', 3, '응. 뛰어갈게.'], ['천천히 와요.', 2, '천천히는 안 돼. 그건 약속 못 해.']] });
  }
  function returnTick() {
    const o = op(), g = G(), el = now() - o.retStart;
    let step = RETURN_STEPS[0];
    for (const s of RETURN_STEPS) if (el >= s[0]) step = s;
    o.retStep = step[2];
    if (step[1] === null) { o.phase = 'done'; o.end = now(); PX.Cap.mode = 'sched'; St.S.rel.cap.noFollowUntil = 0; if (PX.Mind) PX.Mind.mem().part = -1e9; return; }
  }
  // 복귀 절차 중의 일정 (actors 의 일정 대신)
  function schedOverride() {
    const o = op();
    if (!o || o.phase !== 'return') return null;
    const step = RETURN_STEPS.find(s => s[2] === o.retStep) || RETURN_STEPS[0];
    if (step[1] === 'shower') return '00:00 -';
    return step[1] ? '00:00 ' + step[1] : null;
  }

  // ---------- 합동작전 (플레이어도 투입) ----------
  async function jointDepart() {
    const S = St.S, o = op(), g = G(), V = PX.DLG_V2;
    g.modal++;
    await PX.Dlg.runLines([`N:새벽 6시. 수송선 격납고. 엔진 소리가 바닥을 울린다. 작전 기간 ${o.days}일, ${o.area}.`, ...(PX.Dlg.pick('v_opJoint', V.opJoint) || { l: ['C:내 뒤로 두 걸음.'] }).l]);
    PX.Dlg.close(); g.modal--;
    const f = document.getElementById('fade'); f.classList.add('on', 'long'); await U.sleep(600);
    St.advance(120);
    g.enterMap('outskirts', 27.5, 44.5);
    PX.Cap.moveTo('outskirts'); g.cap.x = 28.5; g.cap.y = 43.5; PX.Cap.mode = 'follow'; S.cap.follow = true;
    await U.sleep(300); f.classList.remove('on', 'long');
    PX.UI.toast(`🛰️ 합동작전 1일 차 · ${o.area} · 역할: ${o.role}`, 4500);
    g.memory('첫 합동작전', `${o.area}. ${o.role}로 대위와 같은 작전에 투입됐다.`, true);
  }
  // 작전 일과 게시판 (외곽 수색구역 안내 단말에서 연다)
  const TASKS = [
    { k: 'brief', t: '📋 작전 브리핑', day1: true, run: async () => { await lines(['N:대위가 지도를 펼친다. 손가락이 경로를 짚는다.', 'C:오늘은 여기까지. 흔적 확인, 중계기 점검, 해 지기 전에 복귀.', 'C*:질문? 없으면… 아, 넌 내 뒤로 두 걸음. 그게 제일 중요해.']); } },
    { k: 'camp', t: '⛺ 야영지 설치', day1: true, run: async () => { await PX.Mini.timing({ title: '⛺ 야영지 설치', help: '말뚝을 박을 때(초록 구간) 누르세요', rounds: 4, speed: 60, btn: '쾅!' }); await lines(['C:잘 박았네. 바람에 안 날아가겠다.', 'C^:옆 텐트가 내 거야. 무서우면 불러.']); } },
    { k: 'gear', t: '🔧 장비 점검', run: async () => { await PX.Mini.run('circuit'); await lines([U.pick(['C:배선 깔끔하다. 오 상사가 보면 좋아하겠어.', 'C*:두 번 확인했지? 박 중사 버릇 옮았네.'])]); } },
    { k: 'trace', t: '🔍 외계 생명체 흔적 조사', run: async () => { await PX.Mini.run('drone'); await lines([U.pick(['C:이 발자국은 이틀 됐어. 크기 봐. 위험한 건 아니야.', 'C:사막도마뱀 흔적이네. 무해해. 기록만 해 둬.', 'N:모래 위로 이상한 무늬가 이어진다. 대위가 한참 들여다보더니 사진을 찍는다.', 'C:이건 보고서에 넣는다. 잘 찾았어.'])]); } },
    { k: 'watch', t: '🌙 경계 근무', night: true, run: async () => { await PX.Mini.timing({ title: '🌙 경계 근무', help: '움직임(초록 구간)이 보이면 누르세요', rounds: 5, speed: 55, btn: '확인!', bg: '#141028' }); await lines(['N:교대 시간. 대위가 보온병을 내민다.', 'C:졸리지? 나도. 근데 너랑 서니까 시간이 빨리 가.']); } },
    { k: 'meal', t: '🍲 작전 중 식사', run: async () => { St.S.energy = Math.min(100, St.S.energy + 20); await lines([U.pick([['N:전투식량을 데운다. 대위가 자기 것에서 고기를 골라 내 쪽으로 옮긴다.', 'C:3번이 제일 맛있어. 그중에 고기가 제일 맛있고. 그러니까 네 거.'], ['N:모닥불 옆에서 다 같이 먹는다. 이준혁이 농담을 하고 최민재가 남은 걸 노린다.', 'C^:이게 우리 팀이야. 시끄럽지.']])].flat()); } },
    { k: 'night', t: '💬 야간 대화', night: true, run: async () => { await lines(U.pick([['N:텐트 앞. 별이 쏟아진다. 대위가 옆에 앉는다.', 'C:작전 중엔 이런 말 안 하는데.', 'C*:…같이 와서 좋다. 무섭기도 하고. 네가 다칠까 봐.', { q: [['대위님 뒤에 있으면 안 다쳐요.', 4, ['C^:그 말 믿고 내일도 앞에 설게.']], ['저도 대위님 지킬게요.', 4, ['C!:…', 'C*:그 말은 반칙이다.']]] }], ['C:별 많지. 부대에선 이렇게 안 보여.', 'C:여기 오면 늘 혼자 봤는데.', 'C^:오늘은 아니네.']])); St.addAff(4); } },
    { k: 'rest', t: '😴 텐트에서 하루 마치기', always: true, run: async () => { await G().sleepUntil(6); } },
  ];
  async function lines(ls) { const g = G(); g.modal++; await PX.Dlg.runLines(ls); PX.Dlg.close(); g.modal--; }
  async function board() {
    const o = op(), d = dayIdx(), S = St.S;
    if (!inField()) return false;
    const night = S.time.min >= 19 * 60 || S.time.min < 5 * 60;
    if (d > o.days || now() >= o.end - 120) { const it = await PX.UI.menu(`🛰️ 작전 ${d}일 차 · 귀환`, [{ t: '🚁 귀환 수송선 타기', k: 1 }]); if (it) jointReturn(); return true; }
    const done = o.jointDone[d] = o.jointDone[d] || {};
    const items = TASKS.filter(x => (!x.day1 || d === 1) && (!x.night || night)).map(x => ({ t: (done[x.k] ? '✔ ' : '') + x.t, k: x, off: !!done[x.k] && !x.always, offMsg: '오늘은 이미 했어요' }));
    const it = await PX.UI.menu(`🛰️ 합동작전 ${d}/${o.days}일 차 · ${o.area}`, items);
    if (!it) return true;
    done[it.k.k] = 1;
    await it.k.run(); St.advance(it.k.k === 'rest' ? 0 : 40); St.addAff(2);
    return true;
  }
  async function jointReturn() {
    const S = St.S, o = op(), g = G();
    if (o.phase !== 'away') return;
    o.phase = 'done'; o.end = now();
    const f = document.getElementById('fade'); f.classList.add('on', 'long'); await U.sleep(600);
    St.advance(120);
    const m = PX.W.maps.base; g.enterMap('base', 31.5, 40.5);
    PX.Cap.moveTo('base'); g.cap.x = 32.5; g.cap.y = 40.5; PX.Cap.mode = 'follow';
    await U.sleep(300); f.classList.remove('on', 'long');
    g.modal++; const bd = PX.Dlg.pick('v_opJointEnd', PX.DLG_V2.opJointEnd); await PX.Dlg.runLines(bd ? bd.l : ['C:고생했다.']); PX.Dlg.close(); g.modal--;
    if (PX.Mind) { PX.Mind.noteMeet(); PX.Mind.noteTalk('opJointEnd'); }
    S.stats.ops = (S.stats.ops || 0) + 1; St.addAff(6);
    g.memory('함께 귀환', `${o.days}일간의 ${o.area} 작전을 마치고 함께 돌아왔다.`, true);
  }

  return { maybeSchedule, plan, tick, isAway, inField, dayIdx, board, schedOverride, photo, send, op, jointReturn, depart };
})();
