/* =====================================================================
   생일 — 내 생일 · 형사님 생일 (게임 달력: 한 달 10일)
   · 새 게임 화면에서 정하고, 형사님 이름을 바꿀 때 생일도 함께 · 메뉴 → 관계 → 생일
   · 내 생일: 주민들이 뜻밖의 선물 · 축하, 형사님은 관계 단계에 따라 전혀 다르게 챙김
   · 형사님 생일: 메뉴에 「생일 축하해요」, 선물은 두 배로 기뻐함, 케이크가 있으면 특별 장면
   ===================================================================== */
/* 생일은 실제 날짜(1~31일)로 정하고, 해월도 달력(한 달 10일)에선 비율대로 그 달의 같은 무렵에 맞이함
   예) 7월 23일 → 해월도 7월 8일. 예전 저장(1~10일로 정한 것)은 그대로 해월도 날짜 */
const BDAY_MDAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const bdayGameDom = (b) => b.r ? Math.min(DAYS_PER_MONTH, Math.max(1, Math.ceil(b.d * DAYS_PER_MONTH / BDAY_MDAYS[b.m - 1]))) : b.d;
const bdayStr = (b) => b ? `${b.m}월 ${b.d}일` : '아직 안 정함';
const bdayGameStr = (b) => b ? (b.r && bdayGameDom(b) !== b.d ? `${b.m}월 ${b.d}일 (해월도 달력 ${b.m}월 ${bdayGameDom(b)}일)` : `${b.m}월 ${b.d}일`) : '아직 안 정함';
const isBday = (b, day = S.day) => { if (!b) return false; const c = calendar(day); return c.month === b.m && c.dom === bdayGameDom(b); };
const bdayKey = (who) => who + calendar(S.day).year;
function bdayState() { if (!S.bdays) S.bdays = { me: null, det: null, done: {} }; return S.bdays; }

/* ---------------- 정하기 UI ---------------- */
const BDAY_MICON = ['❄️', '🌨️', '🌸', '🌷', '🌿', '☀️', '🌊', '🍉', '🍂', '🍁', '🍊', '🎄'];
function bdayPick(title, cur, cb, back) {
  const backIt = back ? [{ icon: '↩️', label: '뒤로', onClick: back }] : [];
  openSheet({ title: `🎂 ${title} — 몇 월?`, sub: `<div class="relneed">지금: ${bdayGameStr(cur)}</div>`, cols: 4, items: [...Array.from({ length: 12 }, (_, i) => ({ icon: BDAY_MICON[i], label: `${i + 1}월`, onClick: () => openSheet({ title: `🎂 ${title} — ${i + 1}월 며칠?`, sub: '<div class="relneed">해월도 달력은 한 달이 10일이라, 그 달의 같은 무렵에 생일을 맞아요</div>', cols: 7, items: [...Array.from({ length: BDAY_MDAYS[i] }, (_, d) => ({ label: `${d + 1}`, onClick: () => cb({ m: i + 1, d: d + 1, r: true }) })), { icon: '↩️', label: '월 다시', onClick: () => bdayPick(title, cur, cb, back) }] }) })), ...backIt] });
}
function bdayMenu(opts = {}) {
  const B = bdayState(), again = () => bdayMenu(opts);
  const items = [
    { icon: '🎂', label: '내 생일', note: bdayStr(B.me), onClick: () => bdayPick('내 생일', B.me, (b) => { B.me = b; save(); toast(`🎂 내 생일: ${bdayGameStr(b)}`); again(); }, again) },
    { icon: '🎁', label: `${himCall()} 생일`, note: bdayStr(B.det), onClick: () => bdayPick(`${himCall()} 생일`, B.det, (b) => { B.det = b; save(); toast(`🎁 ${himCall()} 생일: ${bdayGameStr(b)}`); again(); }, again) },
  ];
  if (opts.done !== false) items.push({ icon: '✅', label: '다 정했어요', onClick: () => { } });
  openSheet({ title: '🎂 생일', sub: `<div class="relneed">내 생일 ${bdayGameStr(B.me)}<br>${himCall()} 생일 ${bdayGameStr(B.det)}</div>`, cols: 3, items });
}
/* 새 게임 화면에 생일 칸 (달마다 날짜 수가 바뀜) */
function bdaySelects(id, label, def) {
  const opt = (n, v) => Array.from({ length: n }, (_, i) => `<option value="${i + 1}" ${i + 1 === v ? 'selected' : ''}>${i + 1}</option>`).join('');
  return `<label class="lbl bday">${label}<span><select id="${id}M">${opt(12, def.m)}</select>월 <select id="${id}D">${opt(BDAY_MDAYS[def.m - 1], def.d)}</select>일</span></label>`;
}
window.addEventListener('DOMContentLoaded', () => {
  const det = $('#detIn'); if (!det || $('#bdMeM')) return;
  const wrap = document.createElement('section'); wrap.className = 'bdayRow';
  const rm = 1 + Math.floor(Math.random() * 12);
  wrap.innerHTML = bdaySelects('bdMe', '내 생일', { m: 7, d: 5 }) + bdaySelects('bdDet', '형사님 생일', { m: rm, d: 1 + Math.floor(Math.random() * BDAY_MDAYS[rm - 1]) });
  det.closest('label').after(wrap);
  for (const id of ['bdMe', 'bdDet']) {
    const mS = $('#' + id + 'M'), dS = $('#' + id + 'D');
    mS.addEventListener('change', () => { const n = BDAY_MDAYS[+mS.value - 1], cur = Math.min(+dS.value, n); dS.innerHTML = Array.from({ length: n }, (_, i) => `<option value="${i + 1}" ${i + 1 === cur ? 'selected' : ''}>${i + 1}</option>`).join(''); });
  }
});
const _newStateBday = newState;
newState = function (name, job, hair, detName) {
  const s = _newStateBday(name, job, hair, detName);
  const v = (id) => { const el = $('#' + id); return el ? +el.value : 0; };
  s.bdays = { me: v('bdMeM') ? { m: v('bdMeM'), d: v('bdMeD'), r: true } : null, det: v('bdDetM') ? { m: v('bdDetM'), d: v('bdDetD'), r: true } : null, done: {} };
  return s;
};
/* 형사님 이름 바꿀 때 생일도 */
const _renameDetBday = renameDet;
renameDet = function () {
  _renameDetBday();
  const t = setInterval(() => { if (G.busy || G.dialog || G.sheet) return; clearInterval(t); const B = bdayState(); openSheet({ title: `🎁 ${himCall()} 생일도 정할까요?`, sub: `<div class="relneed">지금: ${bdayGameStr(B.det)}</div>`, cols: 2, items: [{ icon: '🎂', label: '생일 정하기', onClick: () => bdayPick(`${himCall()} 생일`, B.det, (b) => { B.det = b; save(); toast(`🎁 ${himCall()} 생일: ${bdayGameStr(b)}`); }) }, { icon: '↩️', label: '그대로 두기', onClick: () => { } }] }); }, 400);
};
/* ---------------- 내 생일 ---------------- */
const BDAY_GIFTS = {
  halmeoni: ['ricecake', '아이고, 생일이라며! 할미가 떡 쪄 왔어. 많이 먹고 건강해.'], okja: ['abalone', '생일이라며? 오늘 딴 전복이야. 제일 큰 놈으로 골랐어.'],
  grandpa: ['tangerine', '생일 축하하네. 우리 밭에서 제일 단 귤로만 골랐어.', 5], chief: ['yard:bedYellow', '이장이 주는 생일 선물이야. 집 앞에 심으면 예쁠 거야. 허허.'],
  kid: ['drawing', '생일 축하해요! 이거 제가 그린 그림이에요. 형사님도 그렸어요!'], kid2: ['shell', '생일 축하해요! 제가 제일 아끼는 조개예요. 드릴게요!'],
  fisher: ['f_mackerel', '생일이라고? 오늘 잡은 고등어 줄게. 구워 먹어.'], farmer: ['c_strawberry', '생일 축하해! 하우스에서 딴 딸기야.', 3],
  rancher: ['money:5000', '생일 축하해. 많진 않지만 맛있는 거 사 먹어.'], postman: ['postcard', '생일 축하드려요! 육지에서 온 예쁜 엽서인데, 하나 드릴게요.'],
  lifeguard: ['icecream', '생일 축하드려요! 아이스크림 하나 사 왔어요.'], keeper: ['photobook', '생일이라니. 등대에서 찍은 사진들이야. 가져가.'],
tourist: ['cookie', '오늘 생일이세요? 축하드려요! 육지에서 사 온 쿠키예요.'], tourist2: ['candle', '생일 축하드려요! 여행 왔다가 산 향초인데 드릴게요.'],
};
ITEMS.ricecake = ITEMS.ricecake || { name: '할머니표 꿀떡', icon: '🍡', price: 0, gift: 4, sell: 500, eat: '쫄깃하고 달다. 할머니 손맛이다.', react: ['꿀떡이네요. 할머니가 주셨구나. 같이 먹어요.', 'smile'] };
ITEMS.drawing = ITEMS.drawing || { name: '아이가 그린 그림', icon: '🖍️', price: 0, gift: 0, sell: 0, react: ['하늘이 그림이네? 나도 그려 줬구나. 하하, 코가 엄청 크다.', 'laugh'] };
function bdayGiveFrom(vid) {
  const g = BDAY_GIFTS[vid]; if (!g) return null;
  const [what, line, n = 1] = g;
  if (what.startsWith('money:')) { const m = +what.slice(6); S.money += m; return [line, fmtMoney(m)]; }
  if (what.startsWith('yard:')) { const k = what.slice(5); const st = yardState(); st.inv[k] = (st.inv[k] || 0) + 1; return [line, YARD[k].name + ' (섬 꾸미기)']; }
  S.inv[what] = (S.inv[what] || 0) + n; return [line, (ITEMS[what] ? ITEMS[what].name : what) + (n > 1 ? ` ${n}개` : '')];
}
const _villagerTalkBday = villagerTalk;
villagerTalk = async function (a) {
  const B = bdayState();
  if (isBday(B.me) && !(B.done[bdayKey('v_' + a.vid)])) {
    B.done[bdayKey('v_' + a.vid)] = true;
    const r = bdayGiveFrom(a.vid);
    if (r) { a.talking = true; a.stop(); a.lookAt(G.player); burst(a, 'heart', 3); await say(a.id, 'laugh', r[0]); await say('narr', '', `🎁 ${josa(r[1], '을', '를')} 받았다.`); a.talking = false; closeDialog(); return; }
  }
  return _villagerTalkBday(a);
};
const MY_BDAY = {
  1: [['smile', '아, 오늘 생일이시라면서요? 할머니께 들었어요. 축하드려요.'], ['normal', '…빈손이라 이거라도. 캔커피예요. 따뜻할 때 드세요.'], { give: { coffee: 1 } }],
  2: [['smile', '생일 축하해요! 소문 듣고 슈퍼에 들렀는데, 뭘 좋아하실지 몰라서 이것저것 담았어요.'], ['laugh', '감귤 주스랑 쿠키예요. 취향 아니면… 다음엔 꼭 맞혀 볼게요.'], { give: { orangejuice: 1, cookie: 1 } }],
  3: [['blush', '오늘 생일이지? …이거. 손으로 쓴 카드야. 지금 읽으면 안 돼. 집에 가서 읽어.'], ['smile', '그리고 향초. 방에 켜 두면 좋을 것 같아서. 생일 축하해.'], { give: { candle: 1 }, card: true }],
  4: [['blush', '생일 축하해. 아침부터 이 말 하려고 기다렸어.'], ['smile', '목도리야. 육지에서 주문했는데, 늦을까 봐 조마조마했다. 오늘 저녁엔 내가 맛있는 거 살게.'], { give: { scarf: 1 }, card: true }],
  5: [['blush', '…생일 축하해. 오늘은 하루 종일 네 거야. 순찰도 다 바꿔 놨어.'], ['smile', '저녁 7시에 등대로 와. 그 전엔 비밀이야.'], { evening: true }],
  6: [['blush', '생일 축하해. 너 태어난 날이 왜 이렇게 고맙지. …나 지금 되게 진지해.'], ['smile', '저녁에 등대로 와. 준비한 게 있어.'], { evening: true }],
  7: [['blush', '생일 축하해, 예비 신부님… 아니, 신랑님? 하하. 아무튼 내 사람 생일이다.'], ['smile', '오늘 저녁 등대에서 보자. 이번엔 정말 크게 준비했어.'], { evening: true }],
  8: [['smile', '여보, 일어났어? 생일 축하해. 미역국 끓여 놨어. 간은… 좀 싱거울 수도 있어.'], ['blush', '저녁엔 마을 사람들이랑 작게 파티하기로 했어. 다들 너 기다려.'], { give: { porridge: 1 }, evening: true }],
};
async function myBdayDet() {
  const B = bdayState(), st = Math.min(8, S.rel.stage), L = MY_BDAY[st], d = G.det;
  B.done[bdayKey('det')] = true;
  scriptDet(); d.lookAt(G.player); burst(d, 'heart', 6);
  await say('det', L[0][0], L[0][1]); await say('det', L[1][0], L[1][1]);
  const opt = L[2];
  if (opt.give) { for (const [k, n] of Object.entries(opt.give)) S.inv[k] = (S.inv[k] || 0) + n; { const nm = Object.keys(opt.give).map(k => ITEMS[k].name).join(', '); await say('narr', '', `🎁 ${josa(nm, '을', '를')} 받았다.`); } }
  if (opt.card) { await say('narr', '', '💌 카드 봉투에는 또박또박한 글씨로 「태어나 줘서 고마워요」라고 적혀 있다.'); }
  if (opt.evening) { B.evening = S.day; toast('🎂 저녁 7시에 등대로 오래요'); }
  addAff(st >= 5 ? 6 : 4, { event: true });
  if (memPerm('bday_' + calendar(S.day).year, { name: '내 생일' })) await addAlbum(st >= 5 ? '형사님이 챙겨 준 생일' : '생일 축하', 'love');
}
async function myBdayEvening() {
  const B = bdayState(), st = S.rel.stage, d = G.det, P = G.player;
  B.done[bdayKey('eve')] = true;
  scriptDet(); [d.x, d.y] = nearestWalkable(P.x + 1, P.y, MAPS.island); d.map = 'island'; d.visible = true;
  G.camFocus = { x: P.x, y: P.y };
  await say('narr', '', st >= 8 ? '🎉 등대 앞 잔디밭에 마을 사람들이 모여 있다. 「생일 축하해!」 하는 소리와 함께 폭죽이 터졌다.' : '🕯 등대 앞에 작은 케이크와 촛불이 놓여 있다. 노을 아래 형사님이 서 있다.');
  for (let i = 0; i < 6; i++) { spawnFx && spawnFx('fireworks'); await sleep(250); }
  await say('det', 'smile', st >= 8 ? '여보, 촛불 불어. 소원은 나한테만 말해 줘.' : '자, 촛불 불어. 소원 빌고.');
  const c = await choose(['소원 빌기 (눈을 감는다)', '같이 불자']);
  await say('det', 'blush', c === 0 ? '무슨 소원 빌었는지는 안 물어볼게. …근데 내 소원도 이루어졌으면 좋겠다.' : '같이? 좋아. 하나, 둘, 셋— 후.');
  const gifts = st >= 8 ? ['perfume', '향수'] : st >= 7 ? ['watch', '손목시계'] : st >= 6 ? ['polaroid', '즉석카메라'] : ['couplemug', '커플 머그컵'];
  S.inv[gifts[0]] = (S.inv[gifts[0]] || 0) + 1;
  await say('det', 'blush', `그리고 이거. ${gifts[1]}. 오래 고민했어. 생일 축하해, 진심으로.`);
  burst(d, 'heart', 10); burst(P, 'heart', 8); addAff(5, { event: true });
  await addAlbum('등대에서 맞은 생일', 'love'); G.camFocus = null; memRecent('date', '등대에서 생일 축하를 받았다');
}
/* ---------------- 형사님 생일 ---------------- */
const _detMenuBday = detMenu;
detMenu = function () {
  _detMenuBday();
  const B = bdayState(); if (!isBday(B.det) || !G.sheet || !S.rel.flags.met) return;
  const body = $('#sheetBody'), done = B.done[bdayKey('wish')];
  const b = document.createElement('button'); b.className = 'sitem' + (done ? ' disabled' : ''); b.innerHTML = `<span class="si-icon">🎂</span><span class="si-label">생일 축하해요</span><span class="si-note">${done ? '오늘 축하함' : '오늘은 생일!'}</span>`;
  b.onclick = () => { if (done) return; Sound.sfx('tap'); closeSheet(); runEvent(detBdayWish); };
  body.insertBefore(b, body.firstChild);
};
async function detBdayWish() {
  const B = bdayState(), st = S.rel.stage, d = G.det, c = casualOn(); B.done[bdayKey('wish')] = true;
  d.lookAt(G.player);
  await say('me', 'smile', '생일 축하해요!');
  if (st <= 2) await say('det', 'surprise', '어… 제 생일 어떻게 아셨어요? 아무한테도 말 안 했는데. …고마워요. 진짜로.');
  else if (st <= 4) await say('det', 'blush', c ? '기억해 줬구나. 사실 아침부터 혹시나 했어. 고마워.' : '기억해 주셨네요. 사실 아침부터 혹시나 했어요.');
  else await say('det', 'blush', '네가 축하해 주니까 이제야 진짜 생일 같다. …안아 줘도 돼?');
  if (S.inv.cake > 0) {
    const k = await choose(['케이크 꺼내기 🎂', '그냥 축하만']);
    if (k === 0) { S.inv.cake--; await say('narr', '', '🎂 주문해 둔 생크림 케이크를 꺼냈다. 초에 불을 붙이자 형사님 눈이 동그래졌다.'); await say('det', 'laugh', c ? '이거 육지에서 주문한 거지? 언제 이렇게 준비했어… 나 감동받았어.' : '이거 육지에서 주문하신 거죠? 저 감동받았어요.'); burst(d, 'heart', 10); addAff(6, { event: true }); await addAlbum('형사님 생일 케이크', 'love'); }
  }
  addAff(3, { event: true }); S.rel.daily.bdayGift = true; memPerm('detBday_' + calendar(S.day).year, { name: '형사님 생일' }); memRecent('gift', `${himCall()}의 생일을 축하했다`);
}
/* 생일 선물은 두 배로 기뻐함 */
const _giveGiftBday = giveGift;
giveGift = async function (k) {
  const B = bdayState(), bd = isBday(B.det);
  if (bd && S.rel.daily.gift && !B.done[bdayKey('gift')]) S.rel.daily.gift = false;   // 생일엔 한 번 더 받아요
  await _giveGiftBday(k);
  if (bd && !B.done[bdayKey('gift')]) { B.done[bdayKey('gift')] = true; await say('det', 'blush', casualOn() ? '생일 선물이라니… 이거 평생 간직할게.' : '생일 선물이라니요… 평생 간직할게요.'); addAff(ITEMS[k] ? Math.max(2, ITEMS[k].gift) : 3, { event: true }); closeDialog(); }
};
/* ---------------- 날마다 확인 ---------------- */
function bdayTick() {
  if (!S || !G.started || G.busy || G.dialog) return;
  const B = bdayState(), P = G.player, d = G.det;
  if (B.dayToast !== S.day) {
    B.dayToast = S.day;
    if (isBday(B.me)) setTimeout(() => toast('🎂 오늘은 내 생일! 마을 사람들에게 말을 걸어 봐요'), 2400);
    if (isBday(B.det) && S.rel.flags.met) setTimeout(() => toast(`🎁 오늘은 ${himCall()} 생일이에요!`), 3400);
    if (isBday(B.det, S.day + 1) && S.rel.stage >= 2 && S.rel.flags.met) setTimeout(() => toast(`📅 내일은 ${himCall()} 생일이에요. 선물을 준비해 볼까요?`), 4400);
  }
  if (isBday(B.me) && S.rel.flags.met && !B.done[bdayKey('det')] && d.visible && d.map === P.map && dist(d, P) < 3.2 && S.min > 7 * 60) runEvent(myBdayDet);
  if (B.evening === S.day && !B.done[bdayKey('eve')] && S.min >= 19 * 60 && S.min < 23 * 60 && P.map === 'island' && Math.hypot(P.x - P_('lighthouse')[0], P.y - P_('lighthouse')[1]) < 5) runEvent(myBdayEvening);
}
let _bdT = 0;
const _loopBday = loop;
loop = function (ts) { if (G.started && S && !G.dev) { _bdT += 1 / 60; if (_bdT > 1) { _bdT = 0; try { bdayTick(); } catch (e) { console.error(e); } } } _loopBday(ts); };
const _ensureV4Bday = ensureV4;
ensureV4 = function (s) { _ensureV4Bday(s); if (!s.bdays) s.bdays = { me: null, det: null, done: {} }; return s; };
const _startGameBday = startGame;
startGame = function (state, isNew) { _startGameBday(state, isNew); if (!isNew && S.bdays && !S.bdays.me && !S.bdays.asked) { S.bdays.asked = true; setTimeout(() => { if (!G.busy && !G.sheet) bdayMenu(); toast('🎂 새 기능: 내 생일과 형사님 생일을 정할 수 있어요'); }, 3500); } };
