/* =====================================================================
   마을 슈퍼 새 단장
   · 분류: 간식 · 음료 / 생활 · 선물 / 씨앗 · 모종 / 육지 주문 / 팔기 / 가구 카탈로그
   · 육지 주문: 섬에서 구하기 힘든 물건을 주문 → 2일 뒤 여객선으로 들어옴(결항이면 하루 늦음)
     → 슈퍼 할아버지가 직접 건네줌
   ===================================================================== */
const NEW_ITEMS = {
  // 간식 · 음료
  bananamilk: { name: '바나나 우유', icon: '🥛', price: 1200, gift: 2, sell: 300, cat: 'snack', eat: '빨대로 쭉— 달달한 바나나 맛이 퍼진다.', react: ['바나나 우유! 어릴 때 목욕탕 다녀오면 꼭 먹었는데요.', 'laugh'] },
  orangejuice: { name: '감귤 주스', icon: '🧃', price: 1500, gift: 3, sell: 400, cat: 'snack', eat: '새콤달콤한 해월도 감귤 주스. 정신이 번쩍 든다.', react: ['감귤 주스네요. 순찰 끝나고 마시면 딱이에요.', 'smile'] },
  icecream: { name: '감귤 아이스크림', icon: '🍦', price: 1800, gift: 3, sell: 500, cat: 'snack', season: 'summer', eat: '차갑고 상큼하다. 녹기 전에 얼른!', react: ['아이스크림이다! 녹기 전에 같이 먹어요. 아, 이거 반 줄 거죠?', 'laugh'] },
  sweetpotato: { name: '군고구마', icon: '🍠', price: 2000, gift: 4, sell: 600, cat: 'snack', season: 'winter', eat: '호호 불어 가며 먹었다. 속이 노랗고 달다.', react: ['군고구마! 겨울엔 이게 최고죠. 손 녹이면서 먹어요.', 'smile'] },
  cupnoodle: { name: '컵라면', icon: '🍜', price: 1300, gift: 1, sell: 300, cat: 'snack', eat: '3분 기다려 후루룩. 바닷바람 맞고 먹으니 더 맛있다.', react: ['컵라면… 저 야근할 때 먹는 거 어떻게 알았어요? 하하.', 'laugh'] },
  cookie: { name: '버터 쿠키', icon: '🍪', price: 2500, gift: 4, sell: 800, cat: 'snack', eat: '바삭, 고소한 버터 향.', react: ['쿠키네요. 파출소에 두고 하나씩 꺼내 먹을게요.', 'smile'] },
  onigiri: { name: '참치마요 삼각김밥', icon: '🍙', price: 1200, gift: 2, sell: 300, cat: 'snack', eat: '비닐을 잘 벗겨 냈다. 김이 바삭하다.', react: ['점심 거른 거 들켰네요. 고마워요, 잘 먹을게요.', 'smile'] },
  // 생활 · 선물
  umbrella: { name: '노란 우산', icon: '☂️', price: 6000, gift: 4, sell: 1500, cat: 'life', react: ['우산이요? 비 오는 날 이거 쓰고 순찰 돌게요. 눈에 잘 띄겠다.', 'smile'] },
  sunscreen: { name: '선크림', icon: '🧴', price: 5000, gift: 3, sell: 1200, cat: 'life', season: 'summer', react: ['선크림… 제 얼굴 탄 거 티 났어요? 열심히 바를게요.', 'laugh'] },
  candle: { name: '귤 향초', icon: '🕯️', price: 7000, gift: 5, sell: 2000, cat: 'life', react: ['향초네요. 귤 향이 은은하게 나요. 사택에 켜 둘게요.', 'smile'] },
  postcard: { name: '해월도 엽서', icon: '💌', price: 800, gift: 3, sell: 200, cat: 'life', react: ['엽서에 뭐 써 줬어요? …지금 읽으면 안 되죠? 이따 몰래 볼게요.', 'blush'] },
  keyring: { name: '등대 키링', icon: '🗼', price: 3000, gift: 4, sell: 800, cat: 'life', react: ['등대 키링! 파출소 열쇠에 달아야겠다. 귀엽네요.', 'laugh'] },
  sunflower: { name: '해바라기 한 송이', icon: '🌻', price: 4000, gift: 5, sell: 1000, cat: 'life', season: 'summer', react: ['해바라기요? 해만 보는 꽃이라던데… 무슨 뜻인지 생각해 봐도 돼요?', 'blush'] },
  cattoy: { name: '고양이 낚싯대 장난감', icon: '🧶', price: 2500, gift: 2, sell: 500, cat: 'life', react: ['노랑이 주려고요? 걔 이거 보면 정신 못 차릴 거예요.', 'laugh'] },
};
/* 육지 주문 (2일 뒤 도착) */
const ORDER_ITEMS = {
  beans: { name: '고급 원두 세트', icon: '☕', price: 18000, gift: 8, sell: 5000, react: ['이거 육지에서만 파는 원두잖아요. …저 커피 좋아하는 거 기억했어요?', 'surprise'] },
  rose: { name: '장미 꽃다발', icon: '🌹', price: 25000, gift: 10, sell: 6000, minStage: 5, react: ['장미… 이거 섬에선 못 구하는 건데. 일부러 주문한 거예요? 진짜 고마워요.', 'blush'] },
  cake: { name: '생크림 케이크', icon: '🎂', price: 22000, gift: 9, sell: 6000, react: ['케이크다! 무슨 날이에요? 아니어도 좋아요. 같이 먹어요.', 'laugh'] },
  perfume: { name: '향수', icon: '🌸', price: 45000, gift: 11, sell: 12000, minStage: 5, react: ['향수요? …앞으로 이 향 맡으면 계속 생각나겠네요.', 'blush'] },
  scarf: { name: '캐시미어 목도리', icon: '🧣', price: 38000, gift: 10, sell: 10000, react: ['와, 엄청 부드럽다. 겨울 순찰 이제 하나도 안 춥겠어요.', 'smile'] },
  watch: { name: '가죽 손목시계', icon: '⌚', price: 80000, gift: 13, sell: 20000, minStage: 6, react: ['시계… 이건 너무 큰 선물인데. 매일 차고 다닐게요. 시간 볼 때마다 생각날 거예요.', 'blush'] },
  speaker: { name: '블루투스 스피커', icon: '🔊', price: 55000, gift: 9, sell: 14000, react: ['스피커! 낚시할 때 음악 틀어 놓으면 좋겠다. 같이 들어요.', 'laugh'] },
  boardgame: { name: '보드게임', icon: '🎲', price: 20000, gift: 7, sell: 5000, react: ['보드게임이요? 저 이거 지는 거 싫어하는데. 각오해요.', 'tease'] },
  polaroid: { name: '즉석카메라', icon: '📸', price: 65000, gift: 11, sell: 16000, react: ['즉석카메라다! 첫 장은 같이 찍어요. 그건 제가 가질게요.', 'blush'] },
  hanwoo: { name: '한우 바비큐 세트', icon: '🥩', price: 30000, gift: 0, sell: 0, give: { meat: 3 }, desc: '받으면 바비큐 고기 세트 3개' },
  couplemug: { name: '커플 머그컵', icon: '☕', price: 16000, gift: 9, sell: 4000, minStage: 5, react: ['커플 머그요? …하나는 제 거, 하나는 당신 거. 사택에 둘 다 둘게요.', 'blush'] },
  photobook: { name: '섬 사진집', icon: '📚', price: 15000, gift: 6, sell: 4000, react: ['해월도 사진집이네요. 여기 이 등대 사진, 우리가 노을 보던 데 같아요.', 'smile'] },
};
for (const [k, it] of Object.entries(NEW_ITEMS)) ITEMS[k] = Object.assign({}, it);
for (const [k, it] of Object.entries(ORDER_ITEMS)) ITEMS[k] = Object.assign({ order: true }, it);
const SHOP_SNACK = ['coffee', 'tangerine', 'bananamilk', 'orangejuice', 'icecream', 'sweetpotato', 'cupnoodle', 'onigiri', 'cookie', 'snack', 'watermelon', 'lunchbox', 'chocolate', 'candy', 'porridge'];
const SHOP_LIFE = ['hanky', 'flower', 'sunflower', 'hotpack', 'umbrella', 'sunscreen', 'candle', 'postcard', 'keyring', 'cattoy', 'meat', 'ring'];
for (const k of [...SHOP_SNACK, ...SHOP_LIFE]) if (ITEMS[k] && !SHOP.includes(k)) SHOP.push(k);
const itemSeasonOk = (k) => { const s = (ITEMS[k] && ITEMS[k].season) || SHOP_SEASON[k]; return !s || s === season(); };
const ORDER_DAYS = 2, ORDER_MAX = 6;
function orderState() { if (!S.orders) S.orders = []; return S.orders; }

/* ---------------- 슈퍼 메뉴 ---------------- */
function shopBuyItems(keys) {
  return keys.filter(k => ITEMS[k] && itemSeasonOk(k)).map(k => { const it = ITEMS[k], lock = it.minStage && S.rel.stage < it.minStage; return { icon: imgTag(itemIcon(k)), label: it.name, note: `${fmtMoney(it.price)}${S.inv[k] ? ` · ${S.inv[k]}개` : ''}`, keep: true, onClick: () => {
    if (S.money < it.price) { toast('돈이 부족해요'); return; }
    S.money -= it.price; S.inv[k] = (S.inv[k] || 0) + 1; Sound.sfx('coin'); toast(`${it.icon} ${josa(it.name, '을', '를')} 샀어요 (보유 ${S.inv[k]})`); updateHUD(); save();
    const n = [...document.querySelectorAll('#sheetBody .sitem')].find(b => b.querySelector('.si-label') && b.querySelector('.si-label').textContent === it.name); if (n) n.querySelector('.si-note').textContent = `${fmtMoney(it.price)} · ${S.inv[k]}개`;
  } }; });
}
function shopSub(title, items, note) {
  items.push({ icon: '↩️', label: '슈퍼로', onClick: () => shopMenu() });
  openSheet({ title, sub: `<div class="relneed">보유 ${fmtMoney(S.money)}${note ? ' · ' + note : ''}</div>`, items, cols: 4 });
}
shopMenu = function () {
  if (orderHandOver()) return;
  const se = season(), O = orderState(), wait = O.filter(o => o.at > S.day).length;
  const seasonal = Object.keys(ITEMS).filter(k => ITEMS[k].season === se && SHOP.includes(k)).map(k => ITEMS[k].name);
  openSheet({ title: '🏪 마을 슈퍼', sub: `<div class="relneed">보유 ${fmtMoney(S.money)}${seasonal.length ? ' · 계절 한정: ' + seasonal.join(', ') : ''}${wait ? ` · 📦 주문 ${wait}건 오는 중` : ''}</div>`, cols: 3, items: [
    { icon: '🍙', label: '간식 · 음료', note: '먹거리 · 간단 선물', onClick: () => shopSub('🍙 간식 · 음료', shopBuyItems(SHOP_SNACK)) },
    { icon: '🎁', label: '생활 · 선물', note: '꽃 · 소품 · 생활용품', onClick: () => shopSub('🎁 생활 · 선물', shopBuyItems(SHOP_LIFE)) },
    { icon: '🌱', label: '씨앗 · 모종', note: '텃밭용', onClick: () => seedShop() },
    { icon: '📦', label: '육지 주문', note: `${ORDER_DAYS}일 뒤 도착`, onClick: orderMenu },
    { icon: '💰', label: '팔기', note: '해산물 · 작물 · 요리', onClick: sellMenu },
    { icon: '🛋️', label: '가구 카탈로그', note: '가구 · 장식', onClick: () => furnShopMenu() },
  ] });
};

/* ---------------- 육지 주문 ---------------- */
function orderMenu() {
  const O = orderState(), pend = O.filter(o => !o.got);
  const items = Object.entries(ORDER_ITEMS).map(([k, it]) => { const lock = it.minStage && S.rel.stage < it.minStage; return { icon: it.icon, label: it.name, note: lock ? `「${STAGES[it.minStage - 1].name}」부터` : `${fmtMoney(it.price)}${it.desc ? ' · ' + it.desc : ''}`, locked: lock, why: '조금 더 가까워지면 주문할 수 있어요', onClick: () => orderConfirm(k) }; });
  const list = pend.length ? '<br>' + pend.map(o => `${ITEMS[o.k].icon} ${ITEMS[o.k].name} — ${o.at <= S.day ? '<b>도착! 받으러 오세요</b>' : `${dateLabel(o.at)} 도착 예정`}`).join('<br>') : '';
  shopSub('📦 육지 주문', items, `섬에서 구하기 힘든 물건을 여객선으로 받아요. 주문하면 ${ORDER_DAYS}일 뒤 도착 (배가 결항하면 하루 늦어요). 동시에 ${ORDER_MAX}개까지${list}`);
}
function orderConfirm(k) {
  const it = ITEMS[k], O = orderState();
  if (O.filter(o => !o.got).length >= ORDER_MAX) { toast(`주문은 한 번에 ${ORDER_MAX}개까지예요`); return; }
  if (S.money < it.price) { toast('돈이 부족해요'); return; }
  openSheet({ title: `📦 ${josa(it.name, '을', '를')} 주문할까요?`, sub: `<div class="relneed">${fmtMoney(it.price)} · ${dateLabel(S.day + ORDER_DAYS)} 도착 예정 · 돈은 지금 내요</div>`, cols: 2, items: [
    { icon: '✅', label: '주문하기', onClick: () => runEvent(async () => {
      S.money -= it.price; O.push({ k, at: S.day + ORDER_DAYS, day: S.day, got: false, told: false }); updateHUD(); Sound.sfx('coin');
      await say('superman', 'smile', pick([`${josa(it.name, '이', '가')}? 그래, 육지에 연락해 둘게. 모레 배로 들어올 거야.`, `알았어, 주문 넣었어. 배 들어오면 내가 챙겨 둘 테니 걱정 말고.`, `허허, 좋은 거 사네. 모레쯤 들르면 돼.`]));
      save();
    }) },
    { icon: '↩️', label: '그만두기', onClick: () => orderMenu() }] });
}
/* 날이 바뀌면: 여객선 결항이면 하루 늦어지고, 도착하면 알림 */
function orderTick() {
  if (!S || !G.started) return;
  const O = orderState(); let cancel = false;
  try { cancel = !!(typeof ferryPlan === 'function' && ferryPlan().cancel); } catch (e) { }
  for (const o of O) {
    if (o.got || o.at > S.day) continue;
    if (o.checked === S.day) continue;
    o.checked = S.day;
    if (cancel && o.at === S.day) { o.at++; toast(`⛴ 여객선 결항으로 ${ITEMS[o.k].name} 도착이 하루 늦어져요`); continue; }
    if (!o.told) { o.told = true; toast(`📦 육지에서 보낸 ${josa(ITEMS[o.k].name, '이', '가')} 도착했어요! 마을 슈퍼에서 받아 가세요`); }
  }
}
/* 슈퍼에 가면 할아버지가 건네줌 */
function orderHandOver() {
  const O = orderState(), ready = O.filter(o => !o.got && o.at <= S.day && o.told);
  if (!ready.length) return false;
  runEvent(async () => {
    await say('superman', 'laugh', pick(['왔다, 왔어! 육지에서 보낸 거. 배에서 내리자마자 챙겨 뒀지.', '어이, 기다렸지? 주문한 거 여기 있어. 상자 꼼꼼히 쌌더라.', '허허, 이거 받으러 왔구먼. 잘 도착했어.']));
    for (const o of ready) {
      const it = ITEMS[o.k]; o.got = true;
      if (it.give) for (const [g, n] of Object.entries(it.give)) S.inv[g] = (S.inv[g] || 0) + n; else S.inv[o.k] = (S.inv[o.k] || 0) + 1;
      await say('narr', '', `📦 ${it.icon} ${josa(it.name, '을', '를')} 받았다.${it.give ? ' (' + Object.entries(it.give).map(([g, n]) => `${ITEMS[g].name} ${n}개`).join(', ') + ')' : ''}`);
    }
    if (ready.some(o => ITEMS[o.k].minStage >= 5 || o.k === 'rose' || o.k === 'perfume' || o.k === 'watch')) await say('superman', 'tease', '근데 이거 누구 줄 거야? 허허, 안 물어볼게. 형사 총각 얼굴 보면 다 알겠지.');
    S.orders = O.filter(o => !o.got || S.day - o.at < 10);
    closeDialog(); save();
    setTimeout(() => { if (!G.busy) shopMenu(); }, 300);
  });
  return true;
}
/* 소지품에서 먹을 것 누르면 먹기 */
const _invMenuShop = invMenu;
invMenu = function () {
  _invMenuShop();
  document.querySelectorAll('#sheetBody .sitem').forEach(b => {
    const lab = b.querySelector('.si-label'), k = lab && Object.keys(NEW_ITEMS).find(x => NEW_ITEMS[x].eat && NEW_ITEMS[x].name === lab.textContent);
    if (!k || !(S.inv[k] > 0)) return;
    const n = b.querySelector('.si-note'); if (n && !/먹기/.test(n.textContent)) n.textContent += ' · 누르면 먹기';
    b.onclick = () => { Sound.sfx('tap'); closeSheet(); runEvent(async () => { S.inv[k]--; burst(G.player, 'heart', 2); await say('narr', '', `${ITEMS[k].icon} ${ITEMS[k].eat}`); const d = G.det; if (S.comp && d.visible && d.map === G.player.map && dist(d, G.player) < 4) { await say('det', 'tease', casualOn() ? '혼자 먹기야? 한 입만.' : '맛있어 보이네요. 한 입만요?'); addAff(1); } advanceTime(10); }); };
  });
};
/* 저장 · 루프 */
const _ensureV4Shop = ensureV4;
ensureV4 = function (s) { _ensureV4Shop(s); if (!s.orders) s.orders = []; return s; };
let _orderT = 0;
const _loopShop = loop;
loop = function (ts) { if (G.started && S && !G.dev) { _orderT += 1 / 60; if (_orderT > 3) { _orderT = 0; orderTick(); } } _loopShop(ts); };
for (const k of ['beans', 'cake', 'scarf']) if (!LIKES.includes(k)) LIKES.push(k);
