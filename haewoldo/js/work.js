/* =====================================================================
   일터에서 일하기 — 오픈 · 마감, 손님, 형사님 방문, 직업별 미니게임
   · 문 앞 「일하기」 대신 일터 안으로 들어가서 「○○ 오픈」 → 일하고 → 「마감」
   · 카페: 손님이 들어와 주문 → 「주문 받기」 → 음료 고르기 → 전달 · 결제 → 자리에 앉았다가 돌아감
   · 보건지소: 환자가 대기 의자에 앉음 → 「진료하기」 → 진찰 · 처치 미니게임
   · 학교: 아이들이 자리에 앉음 → 「수업하기」 → 퀴즈 미니게임
   · 해녀창고: 「물질 나가기」 → 잠수 미니게임 → 「손질해서 넘기기」, 가끔 해산물 사러 오는 주민
   · 여행객은 예전처럼 섬 곳곳에서 「여행 기록하기」
   · 오픈 시간을 강제하지 않음 (07~22시 사이 아무 때나), 일터를 나가면 자동 마감
   ===================================================================== */
const WORKS = {
  cafe: { map: 'in_cafe', open: ['☕', '카페 오픈하기'], close: ['🌙', '카페 마감하기'], openMsg: '☕ 카페 문을 열었어요 — 손님이 오면 「주문 받기」', closeMsg: '카페 문을 닫았어요', station: [1.5, 1.6], max: 4, every: [14, 30], seats: [[1, 3], [6, 3], [2, 4], [5, 4]], queue: [[2.5, 1.6], [3.5, 1.9], [4.5, 2.1], [3.5, 2.6]] },
  doctor: { map: 'in_clinic', open: ['🩺', '진료 시작하기'], close: ['🌙', '진료 마감하기'], openMsg: '🩺 진료를 시작했어요 — 환자가 오면 「진료하기」', closeMsg: '진료를 마쳤어요', station: [4.5, 1.6], max: 3, every: [22, 40], seats: [[6, 3], [6, 4], [5, 5]], queue: [] },
  teacher: { map: 'in_school', open: ['📚', '수업 준비하기'], close: ['🌙', '수업 마치기'], openMsg: '📚 수업 준비 — 아이들이 자리에 앉으면 칠판 앞에서 「수업하기」', closeMsg: '오늘 수업 끝!', station: [3.5, 1.6], max: 4, every: [3, 6], seats: [[1, 3], [5, 3], [1, 5], [5, 5]], queue: [] },
  haenyeo: { map: 'in_storage', open: ['🌊', '작업 시작하기'], close: ['🌙', '작업 마치기'], openMsg: '🌊 작업 시작 — 장비 앞에서 「물질 나가기」, 손질대에서 「넘기기」', closeMsg: '오늘 작업 끝!', station: [5.5, 1.6], max: 1, every: [45, 80], seats: [], queue: [[4.5, 2.5]] },
};
/* 카페: 의자 두 개 더 */
if (INTERIORS.cafe && !INTERIORS.cafe.furn.some(f => f[0] === 'chair' && f[1] === 2 && f[2] === 4)) INTERIORS.cafe.furn.push(['chair', 2, 4, 2], ['chair', 5, 4, 2]);
const myWork = () => S && WORKS[S.job] || null;
const inMyWork = () => { const W = myWork(); return !!(W && G.player.map === W.map); };
const W_PRICE = (lo, hi) => Math.round(rand(lo, hi) * (1 + (S.jobLv - 1) * 0.1) / 100) * 100;
G.shift = null; G.customers = [];

/* ---------------- 오픈 · 마감 ---------------- */
function shiftOpen() {
  const W = myWork(); if (!W) return;
  if (S.min < 7 * 60 || S.min >= 22 * 60) { toast('지금은 문을 열기엔 너무 이르거나 늦었어요 (07~22시)'); return; }
  if (S.job === 'haenyeo' && S.weather === 'storm') { toast('태풍이라 오늘은 바다에 나가지 않아요'); return; }
  G.shift = { job: S.job, map: W.map, start: S.min, day: S.day, served: 0, earned: 0, tips: 0, next: S.min + 3, detDone: !!S.rel.daily.workDet };
  Sound.sfx('bell'); toast(W.openMsg); burst(G.player, 'spark', 4);
  if (S.job === 'teacher') G.shift.next = S.min + 1;
}
function shiftClose(why) {
  const sh = G.shift; if (!sh) return; const W = WORKS[sh.job];
  G.shift = null;
  for (const c of G.customers.slice()) custLeave(c, true);
  const msg = sh.served ? `${W.closeMsg} · ${sh.served}번 · ${fmtMoney(sh.earned)}${sh.tips ? ` (팁 ${fmtMoney(sh.tips)})` : ''}` : W.closeMsg;
  toast((why ? why + ' — ' : '') + msg); updateHUD(); save();
}
function workPaid(pay, tip = 0, text) {
  const J = JOBS[S.job], sh = G.shift;
  S.money += pay + tip; S.works++; S.jobExp++; if (S.stats) S.stats.works = (S.stats.works || 0) + 1;
  if (sh) { sh.served++; sh.earned += pay + tip; sh.tips += tip; }
  Sound.sfx('coin'); floatText(G.player, '+' + fmtMoney(pay + tip), '#ffe37a');
  if (text) toast(text);
  if (S.jobExp >= S.jobLv * 4) { S.jobExp = 0; S.jobLv++; toast(`⭐ 직업 레벨 업! ${J.name} Lv.${S.jobLv}`); burst(G.player, 'spark', 10); }
  updateHUD();
}

/* ---------------- 손님 ---------------- */
const CUST_NAMES = ['손님', '여행객', '동네 손님'];
function custLook(kid) {
  const cols = ['#e3615a', '#f2c94c', '#5fb3c8', '#8fd6b8', '#b9a6e8', '#f19ab5', '#7fa3e6', '#f4f1ea', '#6f8a4f'], c = pick(cols), fem = Math.random() < 0.5;
  if (kid) { const base = NPC_LOOKS[pick(['kid', 'kid2'])]; return Object.assign({}, base, { name: pick(['반 친구 다온', '반 친구 서진', '반 친구 루아', '반 친구 지호', '반 친구 하율']), outfits: { base: Object.assign({}, base.outfits.base, { coat: c, coatS: shade(c, 0.82), shirt: c }) } }); }
  const hairC = pick(['#2a2220', '#3a2a22', '#6a4230', '#8a6a50']);
  return { name: pick(CUST_NAMES), hair: pick(fem ? ['long', 'bob', 'ponytail', 'wave', 'bun'] : ['short', 'cap', 'short']), hairC, hairH: shade(hairC, 1.35), capC: '#3f6fb5', eyeC: '#4a3020', fem, outfits: { base: { coat: c, coatS: shade(c, 0.82), shirt: c, pants: pick(['#3b4a56', '#5a7aa8', '#e9e4da', '#4b4038']), shoes: '#3b3b3b', closed: true, collar: '#ffffff' } } };
}
/* 동네 주민이 손님으로 오면 밖에 있는 그 사람은 잠깐 안 보이게 (한 사람이 두 군데 있지 않게) */
function custFromVillager(kid) {
  const P = G.player, pool = G.villagers.filter(v => !v._inWork && v.map !== P.map && (kid ? v.look.kid : !v.look.kid) && !v.talking && !v.leis);
  if (!pool.length || Math.random() < 0.45) return null; return pick(pool);
}
let _custSeq = 0;
function custSpawn(kind, opts = {}) {
  const W = myWork(), m = MAPS[W.map]; if (!m) return null;
  const v = opts.det ? null : custFromVillager(kind === 'kid');
  const look = v ? NPC_LOOKS[v.vid] : custLook(kind === 'kid');
  const a = mkActor('cust' + (++_custSeq), look, 'base', W.map, v ? v.vid : 'cust-' + _custSeq);
  a.isCustomer = true; a.ckind = kind; a.speed = kind === 'kid' ? 1.6 : rand(1.0, 1.3); a.vSrc = v || null; a.cname = look.name;
  if (v) { v._inWork = true; v.visible = false; }
  const ex = m.exit; a.x = ex[0] + 0.5; a.y = ex[1] + 0.4; a.face = 'b'; a.cst = 'enter'; a.t = 0;
  Object.assign(a, opts);
  G.customers.push(a); G.actors.push(a);
  return a;
}
function custRemove(a) {
  G.customers = G.customers.filter(c => c !== a); G.actors = G.actors.filter(c => c !== a);
  if (a.vSrc) { a.vSrc._inWork = false; }
  if (a._seat) a._seat.taken = null;
}
function custLeave(a, now) {
  if (now) { custRemove(a); return; }
  a.cst = 'leave'; a.pose = 'stand'; a.bubble = null; const m = MAPS[a.map]; a.walkTo(m.exit[0] + 0.5, m.exit[1] + 0.4); a.wait = 0;
}
function freeSeat(W) { W._seats = W._seats || W.seats.map(s => ({ s, taken: null })); return W._seats.find(x => !x.taken); }
function custSitDown(a, W) {
  const s = freeSeat(W); if (!s) return false; s.taken = a; a._seat = s;
  const [sx, sy] = s.s, m = MAPS[a.map], st = nearestWalkable(sx + 0.5, sy + 1.5, m);
  a.cst = 'toSeat'; a.walkTo(st[0], st[1]); return true;
}
function custSeated(a) { const [sx, sy] = a._seat.s; a.x = sx + 0.55; a.y = sy + 0.8; a.pose = 'sit'; a.face = 'f'; a.cst = 'seated'; a.t = 0; }

/* 카페 메뉴 */
const CAFE_MENU = [['americano', '☕', '아메리카노', [3000, 4000]], ['latte', '🥛', '카페 라떼', [3500, 4500]], ['citrus', '🍊', '귤 라떼', [4000, 5000]], ['tea', '🍵', '보리차 · 녹차', [2500, 3500]], ['ade', '🍹', '귤 에이드', [4000, 5000]], ['cake', '🍰', '귤 케이크', [4500, 5500]]];
const CAFE_ORDER_LINES = { americano: ['아메리카노 한 잔 주세요.', '따뜻한 아메리카노요.', '진한 커피 한 잔이요.'], latte: ['라떼 한 잔이요. 우유 많이요.', '카페 라떼 주세요.'], citrus: ['여기 귤 라떼가 유명하다면서요?', '귤 라떼 하나 부탁해요.'], tea: ['따뜻한 차 한 잔 주세요.', '커피 말고 차 있어요? 녹차요.'], ade: ['시원한 귤 에이드요!', '에이드 하나요. 얼음 많이.'], cake: ['귤 케이크 한 조각 주세요.', '달달한 거… 케이크 있어요?'] };
const CAFE_THANKS = ['와, 맛있다. 또 올게요.', '분위기 좋네요. 잠깐 앉았다 갈게요.', '여기 커피 진짜 괜찮네요.', '고마워요. 오늘 하루 버틸 힘이 나네요.', '사장님 손맛이 좋으시네요.'];
const CAFE_WRONG = ['어? 이거 주문한 거 아닌데… 그래도 마실게요.', '음… 제가 시킨 건 이게 아니었는데. 괜찮아요.', '이것도 맛있겠죠, 뭐.'];
const CAFE_LEAVE = ['너무 오래 기다렸네요… 다음에 올게요.', '바쁘신가 봐요. 이따 다시 올게요.'];
/* 보건지소 증상 */
const SYMPTOMS = [
  { s: '넘어져서 무릎이 까졌어요', hint: '피가 조금 나고 흙이 묻었어요', ans: '소독하고 붕대 감기', opts: ['소독하고 붕대 감기', '해열제 주기', '안약 넣기'], type: 'bandage' },
  { s: '열이 나고 으슬으슬해요', hint: '이마가 뜨겁고 기운이 없어요', ans: '해열 주사', opts: ['해열 주사', '붕대 감기', '파스 붙이기'], type: 'shot' },
  { s: '벌에 쏘였어요', hint: '팔이 빨갛게 부었어요', ans: '침 빼고 연고 바르기', opts: ['침 빼고 연고 바르기', '기침 시럽', '소화제'], type: 'bandage' },
  { s: '배가 살살 아파요', hint: '아까 회를 너무 많이 먹었대요', ans: '소화제', opts: ['소화제', '붕대 감기', '안약'], type: 'pill', pill: '소화제' },
  { s: '기침이 안 멈춰요', hint: '바닷바람 맞고 목이 칼칼하대요', ans: '기침 시럽', opts: ['기침 시럽', '파스', '연고'], type: 'pill', pill: '기침 시럽' },
  { s: '허리가 쑤셔요', hint: '그물을 오래 끌었대요', ans: '찜질하고 파스', opts: ['찜질하고 파스', '해열 주사', '안약'], type: 'bandage' },
  { s: '눈에 모래가 들어갔어요', hint: '눈이 빨갛고 눈물이 나요', ans: '식염수로 씻기', opts: ['식염수로 씻기', '소화제', '붕대 감기'], type: 'pill', pill: '식염수' },
  { s: '해파리에 쏘였어요', hint: '다리가 따끔따끔 화끈거려요', ans: '식초로 씻고 연고', opts: ['식초로 씻고 연고', '기침 시럽', '해열제'], type: 'bandage' },
  { s: '감기 기운이 있어요', hint: '콧물이 나고 목이 부었어요', ans: '감기약', opts: ['감기약', '파스', '붕대 감기'], type: 'pill', pill: '감기약' },
];
const CLINIC_THANKS = ['아이고, 선생님 덕분에 살았어요.', '훨씬 낫네요. 고맙습니다!', '역시 우리 섬 선생님이 최고야.', '이제 안 아파요! 감사합니다!', '내일 또 오라고 하면 올게요. 아니, 안 아프면 안 와도 되죠?'];

/* ---------------- 매 프레임 ---------------- */
function custUpdate(dt) {
  const sh = G.shift, W = myWork();
  // 일터를 나가거나 날이 바뀌면 마감
  if (sh && (G.player.map !== sh.map || S.day !== sh.day)) shiftClose(G.player.map !== sh.map ? '일터를 비워서' : '');
  if (sh && S.min >= 22 * 60) shiftClose('늦었어요');
  for (const a of G.customers.slice()) {
    a.update(dt); a.t += dt;
    if (a.ckind === 'det') continue;
    switch (a.cst) {
      case 'enter': { const q = W && W.queue.length ? W.queue[G.customers.filter(c => c.cst === 'order' || c.cst === 'enter').indexOf(a) % W.queue.length] : null;
        if (a.ckind === 'kid' || a.ckind === 'patient') { if (!custSitDown(a, W)) custLeave(a); }
        else if (q) { a.cst = 'toQueue'; a.walkTo(q[0], q[1]); } else a.cst = 'order';
        break; }
      case 'toQueue': if (!a.path.length) { a.cst = 'order'; a.t = 0; a.lookAt(G.player); a.say(a.orderText, 4); a.emo(a.orderIcon, 3); } break;
      case 'order': if (a.t > 6 && !a.bubble && Math.random() < dt * 0.25) a.emo(a.orderIcon || '❓', 2); if (a.t > (a.patience || 70)) { a.say(pick(CAFE_LEAVE), 3); a.emo('💦', 2); custLeave(a); } break;
      case 'toSeat': if (!a.path.length) custSeated(a); break;
      case 'seated':
        if (a.ckind === 'patient' && !a.treated) { if (a.t > 4 && !a.emote && Math.random() < dt * 0.2) a.emo('🤒', 2); if (a.t > 120) { a.say('오늘은 그냥 집에서 쉴게요…', 3); a.pose = 'stand'; custLeave(a); } }
        else if (a.ckind === 'kid') { if (!G.shift) custLeave(a); else if (a.t > 6 && Math.random() < dt * 0.05) a.emo(pick(['✏️', '📖', '💭', '😆']), 1.6); }
        else if (a.t > (a.stay || 40)) { a.pose = 'stand'; a._seat.taken = null; a._seat = null; custLeave(a); }
        break;
      case 'leave': if (!a.path.length) custRemove(a); break;
      case 'buyer': if (a.t > 70) { a.say('다음에 또 올게.', 2.5); custLeave(a); } break;
    }
  }
  if (!sh || !W || G.busy) return;
  // 새 손님
  if (S.min >= sh.next) {
    sh.next = S.min + rand(W.every[0], W.every[1]);
    const n = G.customers.filter(c => c.ckind !== 'det').length;
    if (n < W.max) {
      if (sh.job === 'cafe') { const it = pick(CAFE_MENU); const a = custSpawn('cafe'); if (a) { a.order = it[0]; a.orderIcon = it[1]; a.orderText = pick(CAFE_ORDER_LINES[it[0]]); a.patience = rand(55, 85); a.stay = rand(25, 55); } }
      else if (sh.job === 'doctor') { const a = custSpawn('patient'); if (a) a.sym = pick(SYMPTOMS); }
      else if (sh.job === 'teacher') custSpawn('kid');
      else if (sh.job === 'haenyeo') { const want = pick(['abalone', 'conch', 'urchin', 'seaweed']); const a = custSpawn('buyer'); if (a) { a.want = want; const q = W.queue[0]; a.walkTo(q[0], q[1]); a.cst = 'buyer'; a.t = 0; setTimeout(() => { if (G.customers.includes(a)) { a.lookAt(G.player); a.say(`${ITEMS[want].name} 있으면 좀 넘겨줘. 값 잘 쳐줄게.`, 4); a.emo(ITEMS[want].icon, 3); } }, 2500); } }
    }
  }
  // 형사님 방문 (하루 한 번, 근무 · 대화 간격 지키기)
  if (!sh.detDone && S.rel.flags.met && S.min - sh.start > 25 && Math.random() < dt * 0.02) detWorkVisit();
}
/* 프레임마다 손님 움직이기 (workUpdate 는 매 프레임 불림) */
const _workUpdateW = workUpdate;
workUpdate = function (dt) { _workUpdateW(dt); try { if (G.customers.length || G.shift) custUpdate(dt); } catch (e) { console.error('[work]', e); } };
/* 동네 주민이 손님으로 와 있는 동안엔 밖에서 안 보이게 */
const _villagerUpdateW = villagerUpdate;
villagerUpdate = function (a, dt) { if (a._inWork) { a.visible = false; return; } return _villagerUpdateW(a, dt); };

/* ---------------- 형사님 방문 ---------------- */
function detWorkVisit() {
  const sh = G.shift, d = G.det, plan = detPlan(S.min);
  if (!sh || G.busy || S.comp || (typeof detQuietNow === 'function' && detQuietNow())) return;
  if (['home', 'goHome', 'sick', 'wedding', 'waitLighthouse', 'rivalWalk', 'appt'].includes(plan.k) || d.state === 'script' || !d.visible) return;
  sh.detDone = true; S.rel.daily.workDet = true;
  runEvent(async () => {
    const W = myWork(), m = MAPS[W.map], c = casualOn(), st = S.rel.stage, P = G.player;
    scriptDet(); d.map = W.map; d.visible = true; d.x = m.exit[0] + 0.5; d.y = m.exit[1] + 0.4;
    const tgt = nearestWalkable(P.x + 1, P.y + 0.6, m); d.walkTo(tgt[0], tgt[1]); await waitUntil(() => !d.path.length, 6); d.lookAt(P); P.lookAt(d);
    const L = {
      cafe: c ? ['나도 손님이야. 아메리카노 하나. 따뜻한 걸로.', '일하는 거 보러 왔어. 커피는 핑계고.'] : ['손님으로 왔어요. 따뜻한 아메리카노 하나요.', '순찰 중에 잠깐 들렀어요. 커피 한 잔 주세요.'],
      doctor: c ? ['환자 아니야. 그냥 얼굴 보러 왔어.', '순찰 돌다가 손등 좀 긁혔는데… 핑계 맞아.'] : ['환자는 아니에요. 순찰 중에 잠깐 들렀어요.', '손등을 좀 긁혀서요. …사실 별거 아니에요.'],
      teacher: c ? ['안전 교육 하러 왔어. 애들아, 길 건널 땐?', '목소리 밖까지 들리더라. 잘 가르치네.'] : ['안전 교육 하러 왔어요. 얘들아, 길 건널 땐?', '수업하는 목소리가 밖까지 들려서요.'],
      haenyeo: c ? ['물질 끝났어? 걱정돼서 와 봤어.', '오늘 바다 괜찮았어? 무리하지 마.'] : ['물질은 끝나셨어요? 걱정돼서 와 봤어요.', '오늘 바다 괜찮았어요? 무리하지 마세요.'],
    }[sh.job];
    await say('det', st >= 4 ? 'blush' : 'smile', pick(L));
    if (sh.job === 'cafe') {
      const k = await choose(['(아메리카노를 내린다)', '오늘은 서비스예요', '(라떼 아트로 하트를 그린다)']);
      if (k === 1) await say('det', 'surprise', c ? '공짜? 그럼 다음엔 내가 밥 살게.' : '서비스요? 그럼 다음엔 제가 밥 살게요.');
      else { const pay = k === 2 ? 5000 : 3500; workPaid(pay, k === 2 ? 1000 : 0); await say('det', k === 2 ? 'blush' : 'smile', k === 2 ? (c ? '…하트네. 마시기 아깝다.' : '…하트네요. 마시기 아깝네요.') : (c ? '역시 여기 커피가 제일이야.' : '역시 여기 커피가 제일이에요.')); }
    } else if (sh.job === 'doctor') {
      const k = await choose(['(소독하고 밴드를 붙여 준다)', '엄살이에요', '차 한잔하고 가요']);
      await say('det', k === 0 ? 'blush' : 'laugh', [c ? '…손 따뜻하다. 이제 하나도 안 아파.' : '…손이 따뜻하네요. 이제 안 아파요.', c ? '들켰네. 사실 보고 싶어서 왔어.' : '들켰네요. 사실 보고 싶어서 왔어요.', c ? '그럼 딱 한 잔만. 환자들 오면 바로 갈게.' : '딱 한 잔만요. 환자분 오면 바로 갈게요.'][k]);
    } else if (sh.job === 'teacher') {
      for (const k of G.customers.filter(x => x.ckind === 'kid')) { k.emo('🙋', 2); k.say(pick(['형사님이다!', '경례! 충성!', '오른쪽, 왼쪽 보고 건너요!']), 2.5); }
      await sleep(900); await say('det', 'smile', c ? '애들이 너 엄청 좋아하네. 나도 그 마음 알아.' : '아이들이 선생님을 엄청 좋아하네요.');
    } else {
      await say('det', 'smile', c ? '이거, 따뜻한 거. 바닷물 차가웠을 거 아냐.' : '따뜻한 거 사 왔어요. 바닷물 차가우셨죠?'); S.inv.coffee = (S.inv.coffee || 0) + 1;
    }
    addAff(2); S.rel.daily.met = true;
    await say('det', 'normal', c ? '일 방해하면 안 되지. 나 갈게. 이따 봐.' : '일 방해하면 안 되죠. 저 갈게요. 이따 봬요.');
    closeDialog(); d.walkTo(m.exit[0] + 0.5, m.exit[1] + 0.4); await waitUntil(() => !d.path.length, 6);
    d.map = 'island'; const b = MAPS.island.buildings.find(x => 'in_' + x.id === W.map); if (b) [d.x, d.y] = [b.doorTile[0] + 0.5, b.doorTile[1] + 0.9];
  });
}

/* ---------------- 행동 버튼 ---------------- */
function nearestCust(fn, r = 2.4) { const P = G.player; return G.customers.filter(a => a.map === P.map && fn(a) && dist(a, P) < r).sort((a, b) => dist(a, G.player) - dist(b, G.player))[0] || null; }
function workActions() {
  const W = myWork(), P = G.player, sh = G.shift, out = [];
  const nearSt = Math.hypot(P.x - W.station[0], P.y - W.station[1]) < 2.4;
  if (!sh) { out.push({ label: W.open[1], icon: W.open[0], hot: true, fn: shiftOpen }); return out; }
  if (sh.job === 'cafe') {
    const c = nearestCust(a => a.cst === 'order' || (a.cst === 'toQueue' && dist(a, P) < 1.6), 3.2) || (nearSt ? nearestCust(a => a.cst === 'order', 6) : null);
    if (c) out.push({ label: `주문 받기 · ${c.orderIcon}`, icon: '📝', hot: true, fn: () => cafeTakeOrder(c) });
  } else if (sh.job === 'doctor') {
    const c = nearestCust(a => a.ckind === 'patient' && a.cst === 'seated' && !a.treated, 3) || (nearSt ? nearestCust(a => a.ckind === 'patient' && a.cst === 'seated' && !a.treated, 9) : null);
    if (c) out.push({ label: '진료하기', icon: '🩺', hot: true, fn: () => clinicTreat(c) });
  } else if (sh.job === 'teacher') {
    const kids = G.customers.filter(a => a.ckind === 'kid' && a.cst === 'seated').length;
    if (nearSt) out.push(kids ? { label: `수업하기 (${kids}명)`, icon: '📚', hot: true, fn: classTeach } : { label: '아이들 기다리는 중…', icon: '⏳', fn: () => toast('아이들이 곧 들어와요. 자리에 앉으면 시작해요') });
  } else if (sh.job === 'haenyeo') {
    const b = nearestCust(a => a.cst === 'buyer', 3);
    if (b) out.push({ label: `넘기기 · ${ITEMS[b.want].icon}`, icon: '🤝', hot: true, fn: () => seaSellTo(b) });
    if (Math.hypot(P.x - 1.5, P.y - 1.4) < 2.6) out.push({ label: '물질 나가기', icon: '🤿', hot: true, fn: seaDive });
    if (nearSt) out.push({ label: '손질해서 넘기기', icon: '🔪', fn: seaSellAll });
  }
  out.push({ label: W.close[1], icon: W.close[0], fn: () => shiftClose() });
  return out;
}
const _computeActionW = computeAction;
computeAction = function () {
  if (S && !G.working && !G.fishing && !G.dev && inMyWork() && !G.player.seat) {
    const P = G.player, base = _computeActionW();
    // 출구 · 사람과 이야기하기는 그대로
    if (base && (base.label === '나가기' && Math.floor(P.x) === M.exit[0] && Math.floor(P.y) === M.exit[1])) return base;
    const acts = workActions(); const others = base && base.label !== '나가기' && !/일하기|진료하기|수업하기|카페 영업|물질/.test(base.label) ? [base] : [];
    const all = [...acts, ...others].slice(0, 4);
    return all.length > 1 ? Object.assign({}, all[0], { cands: all }) : all[0] || base;
  }
  return _computeActionW();
};
/* 문 앞에서 「일하기」 대신 「들어가기」 (여행객 빼고) */
const _canWorkW = canWork;
canWork = function () { if (myWork()) return false; return _canWorkW(); };
/* 일터 안 가구 행동(카운터 · 책상 · 칠판 · 장비)을 근무로 */
const _interiorActionW = interiorAction;
interiorAction = function (act) {
  if (inMyWork() && ['work', 'order', 'gear', 'prep'].includes(act)) { const a = workActions()[0]; if (a && a.fn) a.fn(); return; }
  return _interiorActionW(act);
};
const _endDayW = endDay;
endDay = async function (f) { if (G.shift) shiftClose(); for (const c of G.customers.slice()) custRemove(c); return _endDayW(f); };
const _goMapW = goMap;
goMap = async function (id, x, y, o) { const r = await _goMapW(id, x, y, o); if (G.shift && G.player.map !== G.shift.map) shiftClose('일터를 비워서'); for (const c of G.customers.slice()) if (c.map !== G.player.map) custRemove(c); return r; };

/* ---------------- 카페: 주문 받기 ---------------- */
function cafeTakeOrder(c) {
  const P = G.player; c.lookAt(P); P.lookAt(c);
  openSheet({ title: `📝 ${c.cname}의 주문`, sub: `<div class="relneed">「${c.orderText}」</div>`, cols: 3, items: CAFE_MENU.map(([k, ic, nm]) => ({ icon: ic, label: nm, onClick: () => cafeServe(c, k) })) });
}
function cafeServe(c, k) {
  if (!G.customers.includes(c)) return;
  const it = CAFE_MENU.find(x => x[0] === k), ok = k === c.order;
  runEvent(async () => {
    const P = G.player; P.prop = k === 'cake' ? 'plate' : 'tea'; setAction({ label: `${it[2]} 만드는 중…`, icon: it[1] }, true);
    await sleep(900); P.prop = null; setAction(null, true);
    const wait = c.t, tip = ok && wait < 25 ? pick([500, 1000, 1000, 1500]) : 0, pay = ok ? W_PRICE(...it[3]) : Math.round(W_PRICE(...it[3]) / 2 / 100) * 100;
    c.emo(ok ? '😊' : '😅', 2); burst(c, ok ? 'heart' : 'spark', 2);
    c.say(ok ? pick(CAFE_THANKS) : pick(CAFE_WRONG), 3.2);
    workPaid(pay, tip, `${it[1]} ${it[2]} ${ok ? '전달 완료' : '— 다른 걸 시켰었어요'}${tip ? ` · 팁 ${fmtMoney(tip)}` : ''}`);
    c.cst = 'served'; if (!custSitDown(c, myWork())) custLeave(c);
  });
}

/* ---------------- 보건지소: 진료 ---------------- */
function clinicTreat(c) {
  runEvent(async () => {
    const P = G.player; c.lookAt(P); P.lookAt(c);
    await say('narr', '', `🤒 ${c.cname}: 「${c.sym.s}」`); closeDialog();
    const res = await mgClinic(c.sym);
    if (!res || res.quit) { await say('narr', '', '…잠깐만 기다려 달라고 했다.'); return; }
    c.treated = true; c.emo(res.score >= 70 ? '😊' : '😣', 2); burst(c, 'heart', 2);
    c.say(res.score >= 70 ? pick(CLINIC_THANKS) : '조금 나아진 것 같아요…', 3.2);
    const pay = Math.round(W_PRICE(JOBS.doctor.pay[0], JOBS.doctor.pay[1]) * (0.5 + res.score / 200) / 100) * 100;
    workPaid(pay, 0, `🩺 ${c.sym.ans} — ${res.score}점`);
    c.pose = 'stand'; if (c._seat) { c._seat.taken = null; c._seat = null; } custLeave(c);
  });
}
function mgClinic(sym) {
  const opts = sym.opts.slice().sort(() => Math.random() - 0.5);
  const PILLS = ['소화제', '기침 시럽', '감기약', '식염수', '비타민', '진통제'];
  return mgRun({
    icon: '🩺', title: '진료', hint: '증상에 맞는 처치를 고르고, 처치를 마무리해요', time: 0,
    rules: ['환자의 증상을 보고 알맞은 처치를 골라요', '붕대: 움직이는 표시가 초록 칸에 올 때 세 번 눌러요', '주사: 꾹 눌러 눈금을 초록 칸에 맞춰 잠깐 버텨요 · 약: 맞는 약을 눌러요'],
    init(st) { st.ph = 'diag'; st.opts = opts; st.diagOk = null; st.taps = 0; st.hits = 0; st.k = 0; st.g = 0; st.hold2 = 0; st.pills = PILLS.filter(p => p !== sym.pill).sort(() => Math.random() - 0.5).slice(0, 2).concat(sym.pill || []).sort(() => Math.random() - 0.5); st.wt = 0; },
    update(st, dt) {
      st.k += dt;
      if (st.ph === 'shot') { st.g += (st.hold ? 0.55 : -0.45) * dt; st.g = Math.max(0, Math.min(1, st.g)); if (st.g > 0.55 && st.g < 0.78) st.hold2 += dt; if (st.hold2 >= 1.6) { st.hits = 3; st.ph = 'done'; st.wt = 0.6; mgTone(84, 0.2); } if (st.k > 9) { st.ph = 'done'; st.wt = 0.6; } }
      if (st.ph === 'done') { st.wt -= dt; if (st.wt <= 0) st.end(); }
      st.hud(st.ph === 'diag' ? '진찰' : st.ph === 'done' ? '마무리' : '처치');
    },
    down(st, x, y) {
      if (st.ph === 'diag') { const i = [0, 1, 2].find(i => y > 220 + i * 52 && y < 262 + i * 52 && x > 30 && x < 290); if (i == null) return; st.diagOk = st.opts[i] === sym.ans; mgTone(st.diagOk ? 79 : 52, 0.2); mgPop(st, st.diagOk ? '정확해요!' : '음… 다시 보니 아닌 것 같아요', 160, 200, st.diagOk ? '#bdf5c8' : '#ffb3b3', 15); st.ph = sym.type; st.k = 0; return; }
      if (st.ph === 'bandage') { const ang = (st.k * 3.2) % (Math.PI * 2), inZone = Math.abs(Math.sin(ang)) < 0.28 && Math.cos(ang) > 0; st.taps++; if (inZone) { st.hits++; mgTone(76 + st.hits * 2, 0.12); mgPop(st, '착!', 160, 150, '#bdf5c8'); } else mgPop(st, '삐끗', 160, 150, '#ffb3b3'); if (st.taps >= 3) { st.ph = 'done'; st.wt = 0.7; } return; }
      if (st.ph === 'pill') { const i = [0, 1, 2].find(i => x > 20 + i * 98 && x < 108 + i * 98 && y > 230 && y < 320); if (i == null) return; const ok = st.pills[i] === sym.pill; st.hits = ok ? 3 : 1; mgTone(ok ? 79 : 52, 0.2); mgPop(st, ok ? '맞는 약이에요' : '이 약이 아닌데…', 160, 200, ok ? '#bdf5c8' : '#ffb3b3'); st.ph = 'done'; st.wt = 0.7; }
    },
    draw(g, st) {
      mgBg(g, '#e8f6f4', '#cfe8e6');
      mgRR(g, 20, 20, 280, 120, 14, '#ffffff'); mgText(g, '🤒 ' + sym.s, 34, 50, 16, '#3a2a26'); mgText(g, sym.hint, 34, 80, 13, '#5b4450');
      if (st.ph === 'diag') { mgText(g, '어떤 처치가 필요할까요?', 160, 190, 15, '#3a2a26', 'center'); st.opts.forEach((o, i) => { mgRR(g, 30, 220 + i * 52, 260, 42, 10, '#3a2a26'); mgRR(g, 33, 223 + i * 52, 254, 36, 8, '#fffaf2'); mgText(g, o, 160, 241 + i * 52, 15, '#3a2a26', 'center'); }); }
      if (st.ph === 'bandage') { const cx = 160, cy = 250, ang = (st.k * 3.2) % (Math.PI * 2); mgText(g, `붕대 감기 ${st.taps}/3 — 초록 칸에서 눌러요`, cx, 180, 14, '#3a2a26', 'center'); g.strokeStyle = '#d7c7b0'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, 52, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#7be08e'; g.beginPath(); g.arc(cx, cy, 52, -0.28, 0.28); g.stroke(); mgCircle(g, cx + Math.cos(ang) * 52, cy + Math.sin(ang) * 52, 9, '#e3615a'); mgCircle(g, cx, cy, 30, '#f7d4b5'); mgText(g, '🩹', cx, cy, 24, '#fff', 'center'); }
      if (st.ph === 'shot') { mgText(g, '꾹 눌러서 초록 칸에 맞춰요', 160, 180, 14, '#3a2a26', 'center'); mgRR(g, 140, 200, 40, 150, 10, '#3a2a26'); mgRR(g, 144, 204 + 142 * (1 - 0.78), 32, 142 * 0.23, 6, 'rgba(123,224,142,0.7)'); mgRR(g, 146, 204 + 142 * (1 - st.g), 28, 4, 2, '#e3615a'); mgText(g, '💉', 110, 270, 30, '#fff', 'center'); mgRR(g, 200, 340, 100, 10, 5, '#d7c7b0'); mgRR(g, 200, 340, 100 * Math.min(1, st.hold2 / 1.6), 10, 5, '#7be08e'); }
      if (st.ph === 'pill') { mgText(g, `처방: ${sym.ans} — 맞는 약을 골라요`, 160, 200, 14, '#3a2a26', 'center'); st.pills.forEach((p, i) => { mgRR(g, 20 + i * 98, 230, 88, 90, 12, '#3a2a26'); mgRR(g, 23 + i * 98, 233, 82, 84, 10, '#ffffff'); mgText(g, '💊', 64 + i * 98, 262, 26, '#fff', 'center'); mgText(g, p, 64 + i * 98, 300, 12, '#3a2a26', 'center'); }); }
      if (st.ph === 'done') mgText(g, st.hits >= 3 ? '처치 완료!' : '어설프지만 끝!', 160, 260, 22, '#3a2a26', 'center');
    },
    result(st) { const score = st.quit ? 0 : Math.round((st.diagOk ? 55 : 15) + st.hits / 3 * 45); return { score, quit: !!st.quit, big: st.quit ? '🩺' : `${score}점`, text: st.quit ? '진료를 멈췄어요' : `${st.diagOk ? '진찰 정확' : '진찰이 빗나감'} · 처치 ${st.hits >= 3 ? '완벽' : '조금 아쉬움'}` }; },
  });
}

/* ---------------- 학교: 수업 (퀴즈) ---------------- */
const QUIZ = [
  ['7 + 8 은?', '15', ['14', '16']], ['12 - 5 는?', '7', ['6', '8']], ['3 × 4 는?', '12', ['7', '14']], ['20 ÷ 4 는?', '5', ['4', '6']],
  ['해는 어느 쪽에서 뜰까요?', '동쪽', ['서쪽', '북쪽']], ['바닷물은 무슨 맛?', '짠맛', ['단맛', '쓴맛']], ['귤은 어느 계절에 익을까요?', '겨울', ['봄', '여름']],
  ['문어 다리는 몇 개?', '8개', ['6개', '10개']], ['거미 다리는 몇 개?', '8개', ['6개', '4개']], ['물이 얼면?', '얼음', ['수증기', '모래']],
  ['「나무」의 받침 없는 글자 수는?', '2', ['1', '3']], ['무지개 색은 몇 가지?', '7가지', ['5가지', '9가지']], ['밀물과 썰물을 만드는 건?', '달', ['구름', '바람']],
  ['등대가 하는 일은?', '배에게 길 알려 주기', ['물고기 잡기', '비 막기']], ['일주일은 며칠?', '7일', ['5일', '10일']], ['우리나라의 수도는?', '서울', ['부산', '대전']],
  ['꿀벌이 만드는 것은?', '꿀', ['우유', '실']], ['식물이 자라려면 필요한 것은?', '햇빛과 물', ['소금', '모래']], ['횡단보도를 건널 땐?', '좌우를 살핀다', ['뛰어간다', '눈을 감는다']],
  ['1년은 몇 달?', '12달', ['10달', '13달']], ['고래는 무엇으로 숨 쉴까요?', '폐', ['아가미', '피부']], ['9 + 6 은?', '15', ['13', '16']], ['한 시간은 몇 분?', '60분', ['100분', '30분']],
];
function classTeach() {
  runEvent(async () => {
    await say('narr', '', '📚 칠판 앞에 섰다. 아이들 눈이 반짝반짝.'); closeDialog();
    const kids = G.customers.filter(a => a.ckind === 'kid' && a.cst === 'seated');
    const res = await mgQuiz(kids.length);
    if (!res || res.quit) { await say('narr', '', '…잠깐 쉬는 시간으로 했다.'); return; }
    for (const k of kids) { k.emo(res.score >= 60 ? pick(['😆', '🙋', '💡']) : '😴', 2); }
    const pay = Math.round(W_PRICE(JOBS.teacher.pay[0], JOBS.teacher.pay[1]) * (0.5 + res.score / 200) * (0.8 + kids.length * 0.1) / 100) * 100;
    workPaid(pay, 0, `📚 수업 끝 — 정답 ${res.correct}/${res.total} · 아이들 ${kids.length}명`);
    advanceTime(40);
    if (Math.random() < 0.5) { const k = pick(kids); if (k) k.say(pick(['선생님 오늘 수업 재밌었어요!', '내일은 바다 생물 공부해요!', '숙제 없어요? 없죠? 그쵸?']), 3); }
  });
}
function mgQuiz(nKids) {
  const qs = QUIZ.slice().sort(() => Math.random() - 0.5).slice(0, 5).map(([q, a, w]) => ({ q, a, opts: [a, ...w].sort(() => Math.random() - 0.5) }));
  return mgRun({
    icon: '📚', title: '수업', hint: '아이들이 낸 문제에 맞는 답을 눌러요', time: 0,
    rules: ['문제 다섯 개, 한 문제에 8초', '맞는 답을 누르면 아이들이 박수 쳐요', `오늘 반 아이들: ${nKids}명`],
    init(st) { st.i = 0; st.k = 0; st.ok = 0; st.fb = null; st.fbT = 0; st.qs = qs; },
    update(st, dt) {
      if (st.fbT > 0) { st.fbT -= dt; if (st.fbT <= 0) { st.i++; st.k = 0; st.fb = null; if (st.i >= qs.length) st.end(); } return; }
      st.k += dt; if (st.k >= 8) { st.fb = 'time'; st.fbT = 0.9; mgTone(52, 0.2); }
      st.hud(`${Math.min(st.i + 1, qs.length)}/${qs.length} · 정답 ${st.ok}`);
    },
    down(st, x, y) {
      if (st.fbT > 0 || st.i >= qs.length) return; const Q = qs[st.i];
      const i = [0, 1, 2].find(i => y > 200 + i * 56 && y < 246 + i * 56 && x > 30 && x < 290); if (i == null) return;
      const ok = Q.opts[i] === Q.a; if (ok) { st.ok++; mgTone(79 + st.ok, 0.18); } else mgTone(52, 0.2);
      st.fb = ok ? 'ok' : 'no'; st.fbT = 0.9; st.pickI = i;
    },
    draw(g, st) {
      mgBg(g, '#2f5f4a', '#3f7a5a'); g.fillStyle = '#c99a64'; g.fillRect(0, 380, 320, 20);
      const Q = qs[Math.min(st.i, qs.length - 1)];
      mgText(g, `문제 ${Math.min(st.i + 1, qs.length)}`, 20, 34, 14, '#e8f5e9'); mgText(g, Q.q, 160, 110, 19, '#ffffff', 'center');
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(20, 150, 280 * Math.max(0, 1 - st.k / 8), 5);
      Q.opts.forEach((o, i) => { const sel = st.fbT > 0 && (o === Q.a || i === st.pickI); mgRR(g, 30, 200 + i * 56, 260, 46, 10, sel ? (o === Q.a ? '#7be08e' : '#ff7a6a') : '#fffaf2'); mgText(g, o, 160, 223 + i * 56, 16, '#3a2a26', 'center'); });
      if (st.fb === 'ok') mgText(g, '👏 정답!', 160, 168, 16, '#fff36b', 'center', true); else if (st.fb) mgText(g, st.fb === 'time' ? '⏰ 시간 끝!' : '아쉬워요!', 160, 168, 16, '#ffd0d0', 'center', true);
    },
    result(st) { const score = st.quit ? 0 : Math.round(st.ok / qs.length * 100); return { score, correct: st.ok, total: qs.length, quit: !!st.quit, big: st.quit ? '📚' : `${st.ok}/${qs.length}`, text: st.quit ? '수업을 멈췄어요' : st.ok >= 4 ? '아이들이 신나서 박수를 쳤어요!' : st.ok >= 2 ? '조금 어려웠지만 다들 열심히 했어요' : '내일 다시 복습해요' }; },
  });
}

/* ---------------- 해녀: 물질 ---------------- */
function seaDive() {
  if (S.min >= 18.5 * 60) { toast('해 지기 전까지만 물질해요'); return; }
  runEvent(async () => {
    await say('narr', '', '🤿 테왁을 메고 바다로 나섰다. 숨을 크게 들이쉰다.'); closeDialog();
    await fade(true); await sleep(200);
    const res = await mgDive();
    await fade(false);
    if (!res || res.quit || !res.got.length) { await say('narr', '', '…오늘 바다는 쉽게 내주지 않았다.'); advanceTime(30); return; }
    const cnt = {}; for (const k of res.got) { S.inv[k] = (S.inv[k] || 0) + 1; cnt[k] = (cnt[k] || 0) + 1; }
    S.works++; S.jobExp++;
    if (S.jobExp >= S.jobLv * 4) { S.jobExp = 0; S.jobLv++; toast(`⭐ 직업 레벨 업! ${JOBS.haenyeo.name} Lv.${S.jobLv}`); }
    await say('narr', '', `🌊 망사리 가득: ${Object.entries(cnt).map(([k, n]) => `${ITEMS[k].icon}${ITEMS[k].name} ${n}`).join(' · ')}`);
    advanceTime(50); updateHUD();
  });
}
const SEA_ITEMS = ['abalone', 'conch', 'urchin', 'seaweed'];
function seaSellAll() {
  const have = SEA_ITEMS.filter(k => S.inv[k] > 0); if (!have.length) { toast('넘길 해산물이 없어요 — 먼저 「물질 나가기」'); return; }
  let total = 0; const parts = [];
  for (const k of have) { const n = S.inv[k], p = Math.round((ITEMS[k].sell || 1000) * 1.4 / 100) * 100; total += n * p; parts.push(`${ITEMS[k].icon}${n}`); S.inv[k] = 0; }
  workPaid(total, 0, `🔪 손질해서 넘겼어요 ${parts.join(' ')}`);
}
function seaSellTo(b) {
  const k = b.want; runEvent(async () => {
    if (!(S.inv[k] > 0)) { await say('narr', '', `${ITEMS[k].icon} ${ITEMS[k].name}이(가) 없다.`); b.say('없으면 할 수 없지. 다음에 올게.', 2.5); custLeave(b); return; }
    S.inv[k]--; const p = Math.round((ITEMS[k].sell || 1000) * 2 / 100) * 100;
    b.say(pick(['역시 싱싱하네. 고마워!', '이거면 오늘 저녁 반찬 걱정 없다.', '값 넉넉히 쳐 줬어. 또 부탁해.']), 3); b.emo('😊', 2);
    workPaid(p, 0, `🤝 ${ITEMS[k].name} 넘김`); custLeave(b);
  });
}
function mgDive() {
  return mgRun({
    icon: '🤿', title: '물질', hint: '꾹 누르면 잠수, 떼면 올라와요 · 좌우로 끌어 움직여요', time: 35,
    rules: ['꾹 누르면 내려가고, 떼면 물 위로 올라와요', '좌우로 끌어서 해산물에 닿으면 망사리에 담겨요', '숨 게이지가 비기 전에 올라와서 숨을 쉬어요 · 해파리 조심!'],
    init(st) { st.x = 160; st.y = 60; st.vy = 0; st.air = 1; st.got = []; st.items = []; st.jelly = []; for (let i = 0; i < 7; i++) st.items.push({ k: pick(SEA_ITEMS), x: 30 + Math.random() * 260, y: 230 + Math.random() * 140, got: false }); for (let i = 0; i < 2; i++) st.jelly.push({ x: Math.random() * 320, y: 180 + Math.random() * 120, v: (Math.random() < 0.5 ? -1 : 1) * rand(30, 55) }); st.hurt = 0; },
    update(st, dt) {
      const surf = 60; st.vy += (st.hold ? 260 : -220) * dt; st.vy *= Math.pow(0.15, dt); st.y += st.vy * dt; st.y = Math.max(surf, Math.min(375, st.y));
      if (st.hold) st.x += (st.px - st.x) * Math.min(1, dt * 4);
      if (st.y > surf + 4) st.air -= dt * 0.11; else st.air = Math.min(1, st.air + dt * 0.5);
      if (st.air <= 0) { st.air = 0; st.vy = -300; st.y = Math.max(surf, st.y - 4); if (!st.gasp) { st.gasp = 1; mgPop(st, '숨차요!', st.x, st.y - 20, '#ffb3b3'); } } else st.gasp = 0;
      for (const it of st.items) if (!it.got && Math.hypot(it.x - st.x, it.y - st.y) < 20) { it.got = true; st.got.push(it.k); mgTone(76 + st.got.length, 0.12); mgPop(st, ITEMS[it.k].icon + '+1', it.x, it.y - 10, '#fff'); }
      if (st.items.filter(i => !i.got).length < 3 && st.items.length < 12) st.items.push({ k: pick(SEA_ITEMS), x: 30 + Math.random() * 260, y: 240 + Math.random() * 130, got: false });
      for (const j of st.jelly) { j.x += j.v * dt; if (j.x < 10 || j.x > 310) j.v *= -1; if (st.hurt <= 0 && Math.hypot(j.x - st.x, j.y - st.y) < 18) { st.hurt = 1.2; st.air = Math.max(0, st.air - 0.25); mgPop(st, '따끔!', st.x, st.y - 20, '#ffb3b3'); mgTone(48, 0.2, 'square', 0.05); } }
      st.hurt = Math.max(0, st.hurt - dt);
      st.hud(`망사리 ${st.got.length}개`);
    },
    draw(g, st) {
      mgBg(g, '#7fc4e8', '#1f4f78'); g.fillStyle = '#bfe6f5'; g.fillRect(0, 0, 320, 56); g.fillStyle = '#e8f6fb'; for (let i = 0; i < 8; i++) g.fillRect((i * 47 + st.t * 30) % 320, 54, 22, 3);
      g.fillStyle = '#c9a77a'; g.fillRect(0, 380, 320, 20); for (let i = 0; i < 9; i++) mgCircle(g, i * 40 + 10, 384, 10, '#8a7a5a');
      for (const it of st.items) if (!it.got) mgText(g, ITEMS[it.k].icon, it.x, it.y, 20, '#fff', 'center');
      for (const j of st.jelly) mgText(g, '🪼', j.x, j.y, 22, '#fff', 'center');
      g.globalAlpha = st.hurt > 0 && Math.floor(st.hurt * 10) % 2 ? 0.4 : 1; mgText(g, '🤿', st.x, st.y, 26, '#fff', 'center'); g.globalAlpha = 1;
      mgRR(g, 12, 18, 120, 12, 6, '#3a2a26'); mgRR(g, 14, 20, 116 * st.air, 8, 4, st.air < 0.3 ? '#ff7a6a' : '#7be08e'); mgText(g, '숨', 140, 24, 12, '#3a2a26');
      mgText(g, `🧺 ${st.got.length}`, 300, 24, 14, '#3a2a26', 'right');
    },
    result(st) { const got = st.quit ? [] : st.got; return { got, quit: !!st.quit, big: `🧺 ${got.length}개`, text: st.quit ? '물질을 멈췄어요' : got.length >= 8 ? '망사리가 묵직해요!' : got.length >= 4 ? '오늘 수확 괜찮네요' : '바다가 오늘은 깐깐하네요' }; },
  });
}
/* 손님에게 말 걸기 */
const CUST_CHAT = { cafe: ['여기 분위기 좋네요.', '사장님, 오늘 날씨 좋죠?', '여기 자주 올 것 같아요.', '창가 자리 명당이네요.'], patient: ['선생님, 저 금방 낫겠죠?', '기다리는 건 괜찮아요.', '아까보다 좀 나은 것 같기도 하고요.'], kid: ['선생님! 오늘 숙제 있어요?', '저 어제 조개 열 개 주웠어요!', '쉬는 시간 언제예요?', '선생님 형사님이랑 친해요?'], buyer: ['물 좋은 걸로 골라 줘.', '요즘 바다 어때?'] };
const _interactWithW = interactWith;
interactWith = function (a) {
  if (a && a.isCustomer) { a.lookAt(G.player); G.player.lookAt(a); a.say(pick(CUST_CHAT[a.ckind] || CUST_CHAT.cafe), 3); return; }
  return _interactWithW(a);
};
const _custSeatedW = custSeated;
custSeated = function (a) { _custSeatedW(a); if (a.ckind === 'kid') a.face = 'b'; };
