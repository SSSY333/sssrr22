/* =====================================================================
   요리 — 텃밭 작물마다 어울리는 요리 하나씩 + 재료 두 가지로 만드는 특별 요리
   · 집 주방(조리대)에서: 재료 확인 → 손질 · 조리 과정 → 요리 요령 고르기(맞히면 2인분)
   · 형사님이 곁에 있으면 함께 만들고 같이 먹음, 처음 만든 요리는 레시피 수첩에 기록
   · 만든 요리는 먹기(소지품) · 선물 · 팔기
   ===================================================================== */
const RECIPES = {
  lettuce_salad: { name: '상추 겉절이', icon: '🥗', need: { c_lettuce: 2 }, sell: 2600, gift: 4,
    steps: ['상추를 찬물에 살살 흔들어 씻었다. 잎이 파릇파릇 살아난다.', '고춧가루 · 참기름 · 깨를 넣고 손으로 가볍게 버무렸다.'],
    tip: ['상추는 어떻게 버무릴까?', ['먹기 직전에 살살', '미리 꾹꾹 무쳐 두기'], 0, '숨이 죽지 않아 아삭아삭하다!', '조금 숨이 죽었지만 그래도 맛있다.'],
    det: ['아삭아삭하다. 상추가 이렇게 맛있는 거였어?', 'smile'], eat: '아삭한 상추에 고소한 참기름 향. 입안이 개운하다.' },
  potato_pancake: { name: '감자전', icon: '🥞', need: { c_potato: 2 }, sell: 3400, gift: 5,
    steps: ['감자 껍질을 벗기고 강판에 사각사각 갈았다.', '달군 팬에 기름을 두르고 동그랗게 펴서 부쳤다. 치이익—'],
    tip: ['간 감자, 물기는?', ['꼭 짜고 녹말만 남기기', '그냥 부치기'], 0, '겉은 바삭, 속은 쫀득한 감자전 완성!', '조금 질척하지만 고소하다.'],
    det: ['감자전은 비 오는 날 먹어야 하는데. …아니다, 네가 해 주면 매일이 비 오는 날이야.', 'laugh'], eat: '바삭한 가장자리부터 한 입. 고소한 감자 맛이 퍼진다.' },
  butter_corn: { name: '버터 옥수수', icon: '🧈', need: { c_corn: 1 }, sell: 3200, gift: 5,
    steps: ['옥수수 알을 칼로 톡톡 떼어 냈다.', '팬에 버터를 녹이고 옥수수를 볶다가 설탕 한 꼬집.'],
    tip: ['버터는 언제 넣을까?', ['팬이 달궈진 뒤', '찬 팬에 미리'], 0, '버터 향이 확 올라오는 고소한 버터 옥수수!', '조금 눅눅하지만 달콤하다.'],
    det: ['버터 옥수수! 어릴 때 포장마차에서 사 먹던 맛이다.', 'laugh'], eat: '톡톡 터지는 달콤한 옥수수에 버터 향이 가득하다.' },
  tomato_egg: { name: '토마토 달걀볶음', icon: '🍳', need: { c_tomato: 2 }, sell: 3800, gift: 5,
    steps: ['토마토를 큼직하게 썰고, 달걀을 풀어 두었다.', '달걀을 먼저 몽글몽글 익혀 꺼내고, 토마토를 볶다가 다시 합쳤다.'],
    tip: ['달걀은 언제 넣을까?', ['먼저 익혀 꺼내 두기', '토마토랑 처음부터 같이'], 0, '보들보들한 달걀과 새콤한 토마토가 딱 어울린다!', '조금 질척하지만 새콤달콤하다.'],
    det: ['토마토랑 달걀? 처음 먹어 보는데… 어, 이거 밥이랑 먹으면 끝없이 들어가겠다.', 'surprise'], eat: '새콤달콤 보들보들. 밥 한 그릇이 금방 사라진다.' },
  melon_punch: { name: '수박화채', icon: '🍧', need: { c_melon: 1 }, sell: 6500, gift: 7,
    steps: ['수박을 반으로 쩍! 숟가락으로 동글동글 떠냈다.', '사이다 · 우유를 붓고 얼음을 동동 띄웠다.'],
    tip: ['수박씨는?', ['미리 대충 골라내기', '그냥 두기'], 0, '시원하고 달콤한 수박화채 한 대접!', '씨가 좀 씹히지만 여름 맛이다.'],
    det: ['와, 통째로 화채를? 이건 동네 사람들 다 불러야 하는 양인데. …아니, 우리 둘이 먹자.', 'laugh'], eat: '얼음이 사각, 수박이 달콤. 더위가 싹 가신다.' },
  strawberry_mochi: { name: '딸기 찹쌀떡', icon: '🍡', need: { c_strawberry: 2 }, sell: 4800, gift: 7,
    steps: ['팥소로 딸기를 하나씩 동그랗게 감쌌다.', '쫀득한 찹쌀 반죽으로 다시 한 번 감싸고 전분가루를 톡톡.'],
    tip: ['딸기 꼭지는?', ['떼고 물기 닦기', '그대로 감싸기'], 0, '말랑말랑, 반 자르면 빨간 딸기가 쏙!', '모양은 삐뚤지만 맛은 최고.'],
    det: ['반 잘라 봐. …딸기가 하트 모양이다. 너 이거 노리고 만든 거지?', 'blush'], eat: '쫀득한 떡 속에서 새콤한 딸기가 톡 터진다.' },
  carrot_cake: { name: '당근 케이크', icon: '🍰', need: { c_carrot: 2 }, sell: 5200, gift: 7,
    steps: ['당근을 곱게 채 썰어 반죽에 섞었다. 계피 향이 솔솔.', '오븐에 굽고, 식힌 뒤 크림치즈를 듬뿍 발랐다.'],
    tip: ['케이크가 다 구워졌는지는?', ['젓가락으로 찔러 보기', '그냥 시간 맞춰 꺼내기'], 0, '촉촉한 해월도 당근 케이크 완성!', '가운데가 살짝 덜 익었지만 달콤하다.'],
    det: ['당근 싫어하는 애들도 이건 먹겠다. 나도 사실 당근 별로였는데… 이건 맛있네.', 'smile'], eat: '촉촉한 시트에 상큼한 크림치즈. 해월도 당근이라 더 달다.' },
  pumpkin_pudding: { name: '단호박 푸딩', icon: '🍮', need: { c_pumpkin: 1 }, sell: 6200, gift: 7,
    steps: ['호박을 쪄서 숟가락으로 노란 속을 긁어냈다.', '우유 · 달걀과 곱게 섞어 컵에 담고 약불에 쪄냈다.'],
    tip: ['불 세기는?', ['약불로 은근하게', '센불로 빨리'], 0, '매끈매끈 노란 단호박 푸딩!', '구멍이 송송 났지만 달콤하다.'],
    det: ['노랗고 동그래서 꼭 보름달 같다. …먹기 아깝다. 그래도 먹을래.', 'smile'], eat: '부드럽게 녹는 단호박 맛. 마음까지 따뜻해진다.' },
  cabbage_soup: { name: '배추 된장국', icon: '🍲', need: { c_cabbage: 1 }, sell: 3600, gift: 5,
    steps: ['배추를 숭덩숭덩 썰고 멸치 육수를 우렸다.', '된장을 풀고 배추를 넣어 보글보글 끓였다.'],
    tip: ['된장은 언제 풀까?', ['육수가 끓은 뒤 체에 걸러', '처음부터 한꺼번에'], 0, '구수하고 시원한 배추 된장국!', '조금 텁텁하지만 속이 풀린다.'],
    det: ['…이거 우리 엄마 된장국 맛이다. 아니, 그보다 맛있다. 엄마한텐 비밀.', 'blush'], eat: '구수한 국물 한 숟갈. 속이 사르르 풀린다.' },
  spinach_rice: { name: '시금치 주먹밥', icon: '🍙', need: { c_spinach: 2 }, sell: 3000, gift: 5,
    steps: ['시금치를 살짝 데쳐 찬물에 헹구고 꼭 짰다.', '참기름 · 소금으로 무쳐 밥에 섞고 동글동글 뭉쳤다.'],
    tip: ['시금치 데치는 시간은?', ['소금 넣고 30초만', '푹 오래'], 0, '초록초록 고소한 시금치 주먹밥!', '조금 물렀지만 고소하다.'],
    det: ['순찰 나갈 때 이거 싸 가면 하루 종일 힘나겠다. 두 개 챙겨도 돼?', 'smile'], eat: '고소한 참기름 향에 시금치가 달큰하다.' },
  /* 두 가지 재료로 만드는 특별 요리 */
  ssam: { name: '고기 상추쌈', icon: '🌯', need: { c_lettuce: 2, meat: 1 }, sell: 7000, gift: 8, special: true,
    steps: ['바비큐 고기를 노릇노릇 구웠다.', '상추에 고기 한 점, 쌈장 콕, 마늘 하나 올려 크게 쌌다.'],
    tip: ['쌈은 어떻게 쌀까?', ['한입에 쏙 들어가게', '최대한 크게'], 0, '한입 가득 행복한 고기 상추쌈!', '너무 커서 입이 찢어질 것 같다. 하하.'],
    det: ['자, 아 해. …내가 싸 주는 게 제일 맛있다니까.', 'blush'], eat: '아삭한 상추와 고소한 고기. 이게 행복이다.' },
  curry: { name: '감자 당근 카레', icon: '🍛', need: { c_potato: 1, c_carrot: 1 }, sell: 6500, gift: 8, special: true,
    steps: ['감자 · 당근을 깍둑깍둑 썰어 볶았다.', '물을 붓고 끓이다 카레 가루를 풀어 뭉근하게 저었다.'],
    tip: ['카레는 언제 불을 끌까?', ['걸쭉해질 때까지 저어서', '물 같을 때 바로'], 0, '집 안 가득 카레 냄새. 진하고 맛있는 카레 완성!', '조금 묽지만 맛은 카레다.'],
    det: ['카레는 다음 날이 더 맛있대. 그러니까 내일도 같이 먹어야겠다.', 'tease'], eat: '포슬포슬 감자와 달큰한 당근. 따뜻한 카레 한 그릇.' },
  sandwich: { name: '토마토 상추 샌드위치', icon: '🥪', need: { c_tomato: 1, c_lettuce: 1 }, sell: 5000, gift: 7, special: true,
    steps: ['빵을 살짝 굽고, 토마토를 동그랗게 썰었다.', '상추 · 토마토를 차곡차곡 쌓고 반으로 싹둑.'],
    tip: ['토마토 물기는?', ['키친타월로 살짝 닦기', '그대로 넣기'], 0, '단면이 예쁜 샌드위치 완성! 소풍 가고 싶다.', '빵이 조금 젖었지만 상큼하다.'],
    det: ['이거 들고 무인도 소풍 가자. 도시락은 네가, 배는 내가.', 'smile'], eat: '바삭한 빵 사이로 상큼한 토마토와 아삭한 상추.' },
};
for (const [k, R0] of Object.entries(RECIPES)) ITEMS['d_' + k] = { name: R0.name, icon: R0.icon, price: 0, gift: R0.gift, sell: R0.sell, dish: k, react: R0.det };
const hasNeed = (R0) => Object.entries(R0.need).every(([k, n]) => (S.inv[k] || 0) >= n);
const needText = (R0) => Object.entries(R0.need).map(([k, n]) => `${ITEMS[k].name} ${n}`).join(' + ');
function cookState() { if (!S.cook) S.cook = { learned: {}, count: 0 }; return S.cook; }

/* ---------------- 주방 메뉴 ---------------- */
function kitchenMenu(together) {
  const C = cookState(), d = G.det, P = G.player;
  const withDet = together || (S.rel.flags.met && d.visible && d.map === P.map && dist(d, P) < 6 && S.rel.stage >= 3);
  const list = Object.entries(RECIPES).sort((a, b) => (hasNeed(b[1]) - hasNeed(a[1])) || (!!a[1].special - !!b[1].special));
  const items = list.map(([k, R0]) => ({ icon: R0.icon, label: R0.name + (C.learned[k] ? '' : ' ✨'), note: needText(R0), disabled: !hasNeed(R0), why: `재료가 부족해요: ${needText(R0)} (텃밭에서 키워요)`, onClick: () => cookDish(k, withDet) }));
  items.push({ icon: '🍱', label: '도시락', note: '재료비 2,000원', onClick: () => runEvent(async () => { if (S.money < 2000) { await say('narr', '', '재료비가 부족하다.'); return; } S.money -= 2000; S.inv.lunchbox = (S.inv.lunchbox || 0) + 1; await say('narr', '', '🍱 도시락을 만들었다. 누군가에게 주면 좋겠다.'); updateHUD(); }) });
  const dishes = Object.keys(RECIPES).filter(k => S.inv['d_' + k] > 0);
  if (dishes.length) items.push({ icon: '🍽️', label: '만든 요리 먹기', note: `${dishes.length}가지`, onClick: eatMenu });
  const learned = Object.keys(C.learned).length;
  openSheet({ title: withDet ? `🍳 ${josa(himCall(), '과', '와')} 같이 요리` : '🍳 무엇을 만들까요?', sub: `<div class="relneed">레시피 수첩 ${learned}/${Object.keys(RECIPES).length} · ✨는 아직 안 만들어 본 요리 · 재료는 텃밭에서 키워요</div>`, items, cols: 3 });
}
async function cookDish(k, withDet) {
  const R0 = RECIPES[k], C = cookState();
  await runEvent(async () => {
    if (!hasNeed(R0)) { await say('narr', '', `재료가 부족하다. (${needText(R0)})`); return; }
    const P = G.player, d = G.det, c = casualOn(), first = !C.learned[k];
    for (const [it, n] of Object.entries(R0.need)) S.inv[it] -= n;
    if (withDet) { scriptDet(); if (d.map === P.map) { d.lookAt(P); } await say('det', 'smile', c ? pick([`오늘 메뉴는 ${R0.name}? 좋아, 나는 보조 셰프.`, `${R0.name}! 시키는 대로 할게, 셰프님.`]) : `오늘 메뉴는 ${R0.name}${/[가-힣]/.test(R0.name.slice(-1)) && (R0.name.slice(-1).charCodeAt(0) - 0xAC00) % 28 ? '이에요' : '예요'}? 저는 보조할게요.`); }
    P.prop = 'pan';
    await say('narr', '', `${R0.icon} ${R0.steps[0]}`);
    if (withDet) await say('det', 'laugh', pick(c ? ['칼질은 내가 할게. …어, 이거 이렇게 써는 거 맞아?', '냄새 벌써 좋다. 간 좀 봐도 돼?', '내가 젓기 담당이다. 팔 힘은 자신 있어.'] : ['제가 썰어 볼게요. …이렇게 하는 거 맞죠?', '냄새 벌써 좋네요.']));
    await say('narr', '', `🔥 ${R0.steps[1]}`);
    const [q, opts, right, good, bad] = R0.tip;
    await say('narr', '', `💡 ${q}`);
    const pickI = await choose(opts);
    const ok = pickI === right, n = ok ? 2 : 1;
    Sound.sfx(ok ? 'bell' : 'tap'); burst(P, 'spark', ok ? 6 : 2);
    await say('narr', '', `${R0.icon} ${ok ? good : bad} (${R0.name} ${n}인분)`);
    P.prop = null;
    S.inv['d_' + k] = (S.inv['d_' + k] || 0) + n;
    C.count++;
    if (first) { C.learned[k] = S.day; toast(`📖 새 레시피: ${R0.name} — 레시피 수첩 ${Object.keys(C.learned).length}/${Object.keys(RECIPES).length}`); }
    if (withDet) {
      await say('det', R0.det[1], R0.det[0]);
      const e = await choose(['지금 같이 먹자', '나중에 먹을래']);
      if (e === 0) { S.inv['d_' + k]--; await say('narr', '', `🍽️ 마주 앉아 ${josa(R0.name, '을', '를')} 나눠 먹었다. ${R0.eat}`); await say('det', 'smile', c ? '같이 만들어서 그런가, 더 맛있다.' : '같이 만들어서 더 맛있네요.'); }
      if (!S.rel.daily.cook) { S.rel.daily.cook = true; addAff(R0.special ? 5 : 4); }
      if (!S.rel.flags.cook) { S.rel.flags.cook = true; await addAlbum('같이 만든 저녁', 'cook'); }
      memRecent('cook', `${josa(himCall(), '과', '와')} ${josa(R0.name, '을', '를')} 만들었다`);
    } else memRecent('cook', `${josa(R0.name, '을', '를')} 만들었다`);
    if (Object.keys(C.learned).length === Object.keys(RECIPES).length && !S.paid.cookMaster) { S.paid.cookMaster = S.day; toast('🏆 레시피 수첩 완성! 해월도 요리왕'); }
    advanceTime(R0.special ? 50 : 35); save();
  });
}
function eatMenu() {
  const items = Object.keys(RECIPES).filter(k => S.inv['d_' + k] > 0).map(k => ({ icon: RECIPES[k].icon, label: RECIPES[k].name, note: `${S.inv['d_' + k]}개`, onClick: () => eatDish(k) }));
  openSheet({ title: '🍽️ 무엇을 먹을까요?', items: items.length ? items : [{ icon: '🍽️', label: '만든 요리가 없어요', disabled: true, wide: true }], cols: 3 });
}
function eatDish(k) {
  const R0 = RECIPES[k];
  runEvent(async () => {
    if (!(S.inv['d_' + k] > 0)) return;
    S.inv['d_' + k]--; const P = G.player, d = G.det; P.prop = null; burst(P, 'heart', 2);
    await say('narr', '', `${R0.icon} ${R0.eat}`);
    if (S.comp && d.visible && d.map === P.map && dist(d, P) < 4) { await say('det', 'tease', casualOn() ? '혼자 먹기야? …한 입만. 아.' : '맛있어 보이네요. 한 입만요?'); burst(d, 'heart', 2); addAff(1); }
    advanceTime(15);
  });
}
/* 집 조리대 · 「같이 요리하기」를 요리 메뉴로 */
const _interiorActionCook = interiorAction;
interiorAction = function (act) { if (act === 'cook') { kitchenMenu(false); return; } return _interiorActionCook(act); };
cookTogether = async function () {
  if (G.player.map !== 'in_home') { toast('집 주방에서 같이 요리할 수 있어요'); return; }
  kitchenMenu(true);
};
/* 소지품에서 요리를 누르면 먹기 */
const _invMenuCook = invMenu;
invMenu = function () {
  _invMenuCook();
  const names = Object.fromEntries(Object.keys(RECIPES).map(k => [RECIPES[k].name, k]));
  document.querySelectorAll('#sheetBody .sitem').forEach(b => { const lab = b.querySelector('.si-label'); const k = lab && names[lab.textContent]; if (!k) return; const n = b.querySelector('.si-note'); if (n) n.textContent += ' · 누르면 먹기'; b.classList.remove('disabled'); b.onclick = () => { Sound.sfx('tap'); closeSheet(); eatDish(k); }; });
};
/* 형사님이 좋아하는 요리 */
if (typeof LIKES !== 'undefined') for (const k of ['d_curry', 'd_cabbage_soup', 'd_ssam']) if (!LIKES.includes(k)) LIKES.push(k);
PX_ITEMS.pan = (P) => { P(2, 8, 9, 3, '#3a3a48'); P(3, 7, 7, 1, '#5b5f69'); P(11, 9, 4, 1, '#7a5236'); P(4, 7, 2, 1, '#f2d06a'); P(7, 7, 2, 1, '#ffffff'); };
/* 저장 */
const _ensureV4Cook = ensureV4;
ensureV4 = function (s) { _ensureV4Cook(s); if (!s.cook) s.cook = { learned: {}, count: 0 }; return s; };
