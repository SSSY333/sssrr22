/* =====================================================================
   1년이 길어진 만큼 — 주민 심부름 퀘스트 · 형사님 깜짝 이벤트 · 마을 행사 · 대사 더
   ===================================================================== */

/* ---------------- 1) 주민 심부름 (하루 하나, 장소 둘러보기 · 배달) ---------------- */
const ERRANDS = [
  { id: 'chiefPatrol', who: 'chief', title: '이장님의 마을 점검', ask: '마침 잘 왔네. 광장이랑 회관 앞, 슈퍼 앞 좀 한 바퀴 둘러봐 줄 수 있나? 허리가 영 시원찮아서.', thanks: '허허, 다 둘러봤다고? 고맙네. 이건 수고비야.', places: ['plaza', 'hallFront', 'superDoor'], money: 3000, rep: 2 },
  { id: 'kidPlay', who: 'kid', title: '하늘이랑 놀이터', ask: '놀이터 같이 가요! 미끄럼틀 타는 거 봐 주세요! 네? 네?', thanks: '와아, 진짜 와 줬어요! 이거 제가 아끼는 사탕이에요!', places: ['playground'], until: 18.5, item: ['candy', 1], rep: 1 },
  { id: 'kid2Shell', who: 'kid2', title: '도윤이의 조개 보물', ask: '해변에 제 조개 보물 숨겨 놨는데 잘 있는지 봐 주실래요? 저는 숙제해야 돼요…', thanks: '잘 있었어요? 다행이다! 하나 가지셔도 돼요!', places: ['beach'], item: ['shell', 1], rep: 1 },
  { id: 'touristPhoto', who: 'tourist', title: '관광객의 등대 사진', ask: '혹시 등대 앞에서 저희 사진 좀 찍어 주실 수 있을까요? 거기서 기다릴게요!', thanks: '와, 사진 너무 잘 나왔어요! 감사해요. 이거 작은 사례예요.', places: ['lighthouse'], money: 2500, rep: 1 },
  { id: 'tourist2View', who: 'tourist2', title: '전망대 가는 길', ask: '언덕 전망대가 그렇게 예쁘다던데, 길을 잘 모르겠어요. 먼저 가 보시고 알려 주실래요?', thanks: '덕분에 전망대 다녀왔어요! 섬이 한눈에 보이더라고요. 감사해요!', places: ['observatory'], money: 2000, rep: 1 },
  { id: 'okjaNet', who: 'okja', title: '옥자 할머니의 그물', ask: '해녀창고 앞에 널어 둔 그물 좀 봐 줄래? 바람에 날아갔을까 봐.', thanks: '그물 그대로지? 아이고 다행이다. 미역 좀 가져가.', places: ['storageDoor'], item: ['seaweed', 1], rep: 1 },
  { id: 'keeperLamp', who: 'keeper', title: '등대 불 확인', ask: '저녁 6시 넘어서 등대 불 잘 들어왔나 한 번 봐 주겠나? 눈이 침침해서 말이야.', thanks: '불 잘 켜졌다고? 고맙네. 사십 년째 켜는데도 매번 걱정이야.', places: ['lighthouse'], after: 18, money: 2000, rep: 2 },
  { id: 'grandpaCrow', who: 'grandpa', title: '귤밭 까마귀 쫓기', ask: '까마귀 녀석들이 또 귤밭에 왔어. 귤밭 입구랑 농장 쪽 한 번 휘 돌아 주겠나?', thanks: '휘 돌고 왔더니 조용하구먼. 귤 좀 가져가게.', places: ['orchardGate', 'farm'], item: ['tangerine', 3], rep: 1 },
  { id: 'farmerField', who: 'farmer', title: '꽃밭 들판 살피기', ask: '꽃밭 들판에 꽃 상태 좀 봐 줄 수 있어? 바람이 세서 걱정이야.', thanks: '꽃 괜찮다니 다행이다! 한 송이 가져가.', places: ['field'], item: ['flower', 1], rep: 1 },
  { id: 'guardBeach', who: 'lifeguard', title: '해변 순찰 돕기', ask: '해변 서쪽이랑 동쪽 끝 좀 같이 봐 주실래요? 혼자서는 다 못 봐서요.', thanks: '덕분에 순찰 금방 끝났어요! 아이스크림 하나 드릴게요.', places: ['beachWest', 'beachEast'], item: ['icecream', 1], rep: 1 },
  { id: 'halmeoniBundle', who: 'halmeoni', title: '할머니의 보따리', ask: '아이고, 동백숲 쉼터에 보따리를 두고 왔나 봐. 가서 좀 봐 줄 수 있어?', thanks: '보따리 거기 있었지? 고마워라. 떡 하나 먹어.', places: ['forestRest'], item: ['ricecake', 1], rep: 1 },
  { id: 'fisherTide', who: 'fisher', title: '갯바위 물때 보기', ask: '갯바위 물 빠졌나 좀 봐 줄래? 이따 낚시 갈까 하는데.', thanks: '물 빠졌다고? 좋아, 오늘 대물이다. 이거 어제 잡은 거, 가져가.', places: ['rocks'], item: ['f_mackerel', 1], rep: 1 },
  { id: 'rancherFence', who: 'rancher', title: '목장 울타리 점검', ask: '목장 쪽 울타리 좀 봐 줄 수 있어? 조랑이가 또 빠져나갈까 봐.', thanks: '울타리 멀쩡하다니 다행이야. 수고비 받아.', places: ['ranch'], money: 2500, rep: 1 },
  { id: 'postLetter', who: 'postman', title: '편지 배달 돕기', ask: '배달이 너무 밀려서요… 이 편지 한 통만 대신 전해 주실 수 있을까요?', thanks: '배달 끝났어요? 정말 감사해요! 이건 남는 엽서예요.', deliver: ['halmeoni', 'okja', 'fisher', 'chief', 'grandpa', 'farmer'], item: ['postcard', 1], money: 1500, rep: 2 },
  { id: 'halmeoniSide', who: 'halmeoni', title: '반찬 심부름', ask: '옥자한테 이 반찬 좀 갖다줄 수 있어? 내가 무릎이 아파서.', thanks: '갖다줬어? 아이고 착해라.', deliver: ['okja'], money: 1500, rep: 2 },
];
const ERR_PLACE = { plaza: '마을 광장', hallFront: '마을회관 앞', superDoor: '슈퍼 앞', playground: '놀이터', beach: '해수욕장', lighthouse: '등대', observatory: '언덕 전망대', storageDoor: '해녀창고 앞', orchardGate: '귤밭 입구', farm: '귤 농장', field: '꽃밭 들판', beachWest: '해변 서쪽', beachEast: '해변 동쪽', forestRest: '숲속 쉼터', rocks: '갯바위', ranch: '목장' };
const errPlaceName = (p) => ERR_PLACE[p] || placeName(p) || p;
ITEMS.letter = ITEMS.letter || { name: '맡은 편지 · 반찬', icon: '📨', price: 0, gift: 0, sell: 0 };
function errState() { if (!S.errand) S.errand = null; return S.errand; }
QDEF.v_errand = { title: () => { const e = S.errand && ERRANDS.find(x => x.id === S.errand.id); return e ? `🧺 ${e.title}` : '🧺 주민 심부름'; }, kind: 'repeat', view: (q) => {
  const st = S.errand, E = st && ERRANDS.find(x => x.id === st.id); if (!st || st.day !== S.day || st.done || !E) return { hidden: true };
  const giver = NPC_LOOKS[E.who] ? NPC_LOOKS[E.who].name : '주민';
  if (E.deliver) { const to = NPC_LOOKS[st.to] ? NPC_LOOKS[st.to].name : '주민', a = G.actors.find(x => x.vid === st.to && x.isVillager); return { desc: `${giver}의 부탁`, goal: `📨 ${to}에게 전해 주기`, prog: [0, 1], target: a ? { map: a.map, x: a.x, y: a.y } : null, reward: errRewardText(E) }; }
  const left = E.places.filter(p => !st.seen.includes(p)), nx = left[0] && P_(left[0]);
  return { desc: `${giver}의 부탁${E.after ? ` (${E.after}시 이후)` : ''}${E.until ? ` (${fmtTime(E.until * 60)}까지)` : ''}`, goal: E.places.map(p => (st.seen.includes(p) ? '✔ ' : '· ') + errPlaceName(p)).join('  '), prog: [st.seen.length, E.places.length], target: nx ? { map: 'island', x: nx[0], y: nx[1] } : null, reward: errRewardText(E) };
} };
function errRewardText(E) { return [E.money ? fmtMoney(E.money) : '', E.item && ITEMS[E.item[0]] ? `${ITEMS[E.item[0]].icon} ${ITEMS[E.item[0]].name}${E.item[1] > 1 ? ' ×' + E.item[1] : ''}` : '', E.rep ? `평판 +${E.rep}` : ''].filter(Boolean).join(' · '); }
function errPay(E) { if (E.money) { S.money += E.money; floatText(G.player, '+' + fmtMoney(E.money)); } if (E.item && ITEMS[E.item[0]]) S.inv[E.item[0]] = (S.inv[E.item[0]] || 0) + E.item[1]; S.rep = (S.rep || 0) + (E.rep || 0); S.stats.favors = (S.stats.favors || 0) + 1; updateHUD(); }
function errDone(E, speaker) {
  const st = S.errand; st.done = true; qSet('v_errand', { state: 'COMPLETED' }); errPay(E);
  S.errDone = (S.errDone || 0) + 1; memRecent('visit', `${E.title} 심부름을 했다`);
  if (speaker) return; toast(`🧺 ${NPC_LOOKS[E.who].name}: 「${E.thanks}」`); toast(`🎁 ${errRewardText(E)}`);
  if (S.errDone === 10) addAlbum('마을 심부름꾼 10회', 'daily');
}
async function errOffer(a) {
  const pool = ERRANDS.filter(E => E.who === a.vid && !(E.until && S.min > (E.until - 1.5) * 60) && !(E.after && S.min > 21 * 60)); if (!pool.length) return false;
  const E = pick(pool);
  a.talking = true; a.stop(); a.lookAt(G.player);
  await say(a.id, 'smile', E.ask);
  const c = await choose(['좋아요, 해 볼게요', '오늘은 어려워요']);
  if (c === 0) {
    S.errand = { id: E.id, day: S.day, seen: [], done: false, to: E.deliver ? pick(E.deliver.filter(v => v !== a.vid)) : null };
    if (E.deliver) { S.inv.letter = (S.inv.letter || 0) + 1; toast(`📨 ${NPC_LOOKS[S.errand.to].name}에게 전해 줘요`); }
    qSet('v_errand', { state: 'ACTIVE', day: S.day }); toast('🧺 퀘스트에 심부름이 추가됐어요');
  } else await say(a.id, 'normal', voiceOf(a.vid) === 'kid' ? '힝… 그럼 다음에 꼭이요!' : voiceOf(a.vid) === 'polite' ? '아, 괜찮아요! 다음에 부탁드릴게요.' : '그래, 바쁘면 어쩔 수 없지.');
  S.rel.daily['vf_' + a.vid] = true; a.talking = false; return true;
}
function errTick() {
  const st = S.errand; if (!st || st.done || st.day !== S.day) return;
  const E = ERRANDS.find(x => x.id === st.id), P = G.player; if (!E || E.deliver || P.map !== 'island') return;
  if (E.after && S.min < E.after * 60) return;
  if (E.until && S.min > E.until * 60) return;
  for (const p of E.places) { if (st.seen.includes(p)) continue; const q = P_(p); if (Math.hypot(P.x - q[0], P.y - q[1]) < 3) { st.seen.push(p); Sound.sfx('tap'); toast(`✔ ${errPlaceName(p)} 확인!`); } }
  if (st.seen.length === E.places.length) errDone(E);
}
/* 배달: 받는 사람에게 말 걸면 */
const _villagerTalkErr = villagerTalk;
villagerTalk = async function (a) {
  const st = S.errand, E = st && ERRANDS.find(x => x.id === st.id);
  if (E && E.deliver && !st.done && st.day === S.day && a.vid === st.to && (S.inv.letter || 0) > 0) {
    S.inv.letter--; a.talking = true; a.stop(); a.lookAt(G.player);
    const v = voiceOf(a.vid);
    await say(a.id, 'smile', v === 'elder' ? '아이고, 나한테 온 거야? 이렇게 갖다주고 고마워라.' : v === 'adult' ? '오, 나한테? 고마워. 덕분에 살았다.' : '저한테요? 감사합니다!');
    errDone(E, true); await say('narr', '', `🧺 ${NPC_LOOKS[E.who].name}에게서 「${E.thanks}」 · ${errRewardText(E)}`);
    a.talking = false; closeDialog(); return;
  }
  return _villagerTalkErr(a);
};

/* ---------------- 2) 주민 부탁: 말투에 맞게 · 계절 물건 ---------------- */
const FAVOR_ASK = { elder: (n) => `아, 마침 잘 만났다. 혹시 ${josa(n, '을', '를')} 하나 구해다 줄 수 있어? 슈퍼에 있을 거야.`, adult: (n) => `어이, 부탁 하나만 하자. ${n} 하나만 사다 줄래? 돈은 넉넉히 줄게.`, polite: (n) => `저기, 실례지만… ${n} 하나만 구해다 주실 수 있을까요? 사례할게요!`, kid: (n) => `저기요, 저기요! ${n} 하나만 갖다주시면 안 돼요? 할머니한테는 비밀이에요!` };
const FAVOR_THANKS = { elder: '아이고, 가져왔구나! 고마워라.', adult: '오, 벌써 사 왔어? 고마워! 이거 받아.', polite: '와, 정말 가져다주셨네요! 감사합니다!', kid: '우와! 진짜 고마워요! 비밀이에요!' };
const FAVOR_ITEMS = { base: ['coffee', 'tangerine', 'snack', 'hanky', 'candy', 'bananamilk', 'cupnoodle', 'onigiri', 'cookie', 'postcard'], summer: ['icecream', 'sunscreen'], winter: ['hotpack', 'sweetpotato'], spring: ['flower'], autumn: ['orangejuice'] };
villagerFavorTalk = async function (a) {
  const q = qGet('v_favor'), v = voiceOf(a.vid);
  if (q.day === S.day && q.who === a.id && qIsOpen(q)) {
    if ((S.inv[q.item] || 0) > 0) { S.inv[q.item]--; await say(a.id, 'laugh', FAVOR_THANKS[v] || FAVOR_THANKS.polite); if (!qRepeatPaid('v_favor', 'd' + S.day)) { S.money += 1500; S.rep += 1; floatText(G.player, '+1,500원'); } S.stats.favors++; if (S.stats.favors >= 3) treasureFrag('favor'); qSet('v_favor', { state: 'COMPLETED' }); S.rel.daily['vf_' + a.vid] = true; return true; }
    return false;
  }
  if (S.day < 2) return false;
  // 심부름 (하루 하나)
  if (!(S.errand && S.errand.day === S.day) && Math.random() < 0.3 && ERRANDS.some(E => E.who === a.vid)) return errOffer(a);
  if (q.day !== S.day && Math.random() < 0.3) {
    const pool = [...FAVOR_ITEMS.base, ...(FAVOR_ITEMS[season()] || [])].filter(k => ITEMS[k] && (typeof itemSeasonOk !== 'function' || itemSeasonOk(k)));
    const item = pick(pool);
    await say(a.id, 'smile', (FAVOR_ASK[v] || FAVOR_ASK.polite)(ITEMS[item].name));
    const c = await choose(['네, 구해 올게요', '오늘은 어려워요']);
    if (c === 0) { Object.assign(q, { day: S.day, who: a.id, item }); qSet('v_favor', { state: 'ACTIVE' }); }
    S.rel.daily['vf_' + a.vid] = c !== 0; return true;
  }
  return false;
};

/* ---------------- 3) 형사님 깜짝 이벤트 더 ---------------- */
const isNightNow = () => S.min >= 20 * 60 || S.min < 5 * 60;
SURPRISES.push(
  { id: 'starInvite', st: 3, cd: 7, ok: () => S.min >= 20 * 60 && S.min < 22.5 * 60 && S.weather === 'sunny' && !M.interior, run: async (c) => { await say('det', 'smile', c ? '오늘 하늘 맑다. 별 보러 언덕 갈래? 내가 데려다줄게.' : '오늘 하늘 맑네요. 별 보러 언덕 갈래요? 데려다 드릴게요.'); if (!S.comp) startCompanion(); } },
  { id: 'lunchShare', st: 3, cd: 6, ok: () => S.min >= 11.8 * 60 && S.min < 13.3 * 60, run: async (c) => { S.inv.onigiri = (S.inv.onigiri || 0) + 1; await say('det', 'tease', c ? '점심 먹었어? 삼각김밥 두 개 샀는데 하나 너 줄게. 참치마요야.' : '점심 드셨어요? 삼각김밥 두 개 샀는데 하나 드릴게요. 참치마요예요.'); } },
  { id: 'winterScarf', st: 4, cd: 10, ok: () => season() === 'winter' && !M.interior, run: async (c) => { await say('det', 'blush', c ? '목 시려 보여. 내 목도리 해. …싫어도 해.' : '목 시려 보여요. 제 목도리 하세요. …싫어도요.'); burst(G.player, 'heart', 3); } },
  { id: 'iceCream', st: 3, cd: 7, ok: () => season() === 'summer' && S.min >= 13 * 60 && S.min < 18 * 60, run: async (c) => { S.inv.icecream = (S.inv.icecream || 0) + 1; await say('det', 'laugh', c ? '더워 죽겠다. 아이스크림 두 개 샀어. 녹기 전에 빨리!' : '덥죠. 아이스크림 두 개 샀어요. 녹기 전에 빨리요!'); } },
  { id: 'leafInHair', st: 4, cd: 8, ok: () => season() === 'autumn' && !M.interior, run: async (c) => { await say('det', 'smile', c ? '가만있어 봐. 머리에 낙엽 붙었어. …됐다. 귀엽다, 그냥.' : '가만있어 봐요. 머리에 낙엽 붙었어요. …됐다.'); } },
  { id: 'petal', st: 4, cd: 8, ok: () => season() === 'spring' && !M.interior, run: async (c) => { await say('det', 'blush', c ? '꽃잎 하나가 네 어깨에 앉았어. 꽃도 너 좋아하나 봐.' : '꽃잎이 어깨에 앉았어요. 꽃도 당신이 좋은가 봐요.'); } },
  { id: 'snowball', st: 3, cd: 6, ok: () => S.weather === 'snow' && !M.interior, run: async (c) => { await say('det', 'tease', c ? '받아라! …하하, 미안. 눈만 보면 참을 수가 없어.' : '받아라! …하하, 죄송해요. 눈만 보면 참을 수가 없어서.'); burst(G.player, 'spark', 4); const k = await choose(['나도 던진다!', '차가워요!']); await say('det', 'laugh', k === 0 ? (c ? '으악! 정통으로 맞았다. 항복!' : '으악! 정통으로 맞았어요. 항복!') : (c ? '미안, 미안. 손 줘 봐, 녹여 줄게.' : '미안해요. 손 줘 봐요, 녹여 드릴게요.')); } },
  { id: 'sunsetCall', st: 4, cd: 6, ok: () => S.min >= 17.3 * 60 && S.min < 18.5 * 60 && S.weather === 'sunny' && !M.interior, run: async (c) => { await say('det', 'smile', c ? '지금 노을 진짜 예뻐. 바닷가 가서 같이 보자. 5분이면 돼.' : '지금 노을 진짜 예뻐요. 바닷가 가서 같이 봐요. 5분이면 돼요.'); if (!S.comp) startCompanion(); } },
  { id: 'tiredDet', st: 5, cd: 6, ok: () => S.min >= 18 * 60 && S.min < 21 * 60, run: async (c) => { await say('det', 'normal', c ? '오늘 좀 피곤하다… 잠깐 기대도 돼? 1분만.' : '오늘 좀 피곤하네요… 잠깐 기대도 돼요?'); burst(G.det, 'heart', 3); await say('narr', '', '형사님이 어깨에 살짝 기댔다. 바다 냄새가 났다.'); } },
  { id: 'detPhoto', st: 4, cd: 8, ok: () => !M.interior && S.min >= 9 * 60 && S.min < 18 * 60, run: async (c) => { await say('det', 'tease', c ? '거기 서 봐. 찰칵. …왜, 예뻐서 찍었는데.' : '거기 서 봐요. 찰칵. …왜요, 예뻐서 찍었는데.'); await addAlbum('형사님이 몰래 찍은 사진', 'photo'); } },
  { id: 'weekendPlan', st: 3, cd: 6, ok: () => (S.day - 1) % 7 === 4, run: async (c) => { await say('det', 'smile', c ? '내일 주말인데 뭐 해? 시간 되면 나랑 놀자. 비워 놔.' : '내일 주말인데 뭐 해요? 시간 되면 저랑 놀아요.'); } },
  { id: 'monthStart', st: 2, cd: 25, ok: () => calendar(S.day).dom === 1, run: async (c) => { const m = calendar(S.day).month; await say('det', 'smile', c ? `벌써 ${m}월이다. 이번 달에도 잘 부탁해.` : `벌써 ${m}월이네요. 이번 달도 잘 부탁해요.`); } },
  { id: 'rainWait', st: 4, cd: 6, ok: () => S.weather === 'rain' && M.interior, run: async (c) => { await say('det', 'smile', c ? '비 그칠 때까지 여기서 같이 있자. 빗소리 좋다.' : '비 그칠 때까지 여기 같이 있어요. 빗소리 좋네요.'); } },
  { id: 'secretNote', st: 5, cd: 9, ok: () => S.min >= 8 * 60 && S.min < 12 * 60, run: async (c) => { await say('det', 'blush', c ? '이거… 나중에 펴 봐. 지금 말고!' : '이거… 나중에 펴 봐요. 지금 말고요!'); await say('narr', '', pick(['💌 쪽지: 「오늘도 웃는 거 보러 갈게」', '💌 쪽지: 「점심 꼭 챙겨 먹어. 내가 확인한다」', '💌 쪽지: 「보고 싶다. 아까 봤는데도」', '💌 쪽지: 「오늘 퇴근길에 기다릴게」'])); } },
  { id: 'nightWalkHome', st: 4, cd: 5, ok: () => isNightNow() && S.min < 23 * 60 && !M.interior && !S.comp, run: async (c) => { await say('det', 'serious', c ? '밤길 위험해. 집까지 데려다줄게.' : '밤길 위험해요. 집까지 데려다 드릴게요.'); startCompanion(); } },
  { id: 'cookTogether', st: 6, cd: 8, ok: () => S.min >= 17 * 60 && S.min < 19.5 * 60, run: async (c) => { await say('det', 'smile', c ? '오늘 저녁 같이 해 먹을래? 장은 내가 봐 왔어.' : '오늘 저녁 같이 해 먹을래요? 장은 제가 봐 왔어요.'); S.inv.meat = (S.inv.meat || 0) + 1; toast('🥩 고기 세트를 받았어요'); } },
);

/* ---------------- 4) 마을 행사 더 ---------------- */
EVENTS.push(
  { id: 'iceFishing', m: 1, d: 18, name: '겨울 바다 낚시 대회', icon: '🎣', from: 8 * 60, to: 14 * 60, map: 'island', at: 'pierEnd', reward: 'f_mackerel',
    intro: '부두에서 겨울 바다 낚시 대회가 열려요! 만복 아저씨가 우승을 장담 중.', lines: [[['laugh', '만복 아저씨가 올해는 꼭 이긴대요. 매년 그러세요.']], [['tease', '저랑 한 팀 할래요? 미끼는 제가 끼울게요.']], [['smile', '대물 잡으면 당신 이름 붙일 거예요.']], [['smile', '우리 집 저녁 반찬은 오늘 대회 결과에 달렸어요.']]],
    choice: [['같이 나가요!', 3, '좋아요! 우승 상품은 반반.'], ['응원할게요', 2, '당신 응원이면 고래도 잡겠어요.']] },
  { id: 'schoolPicnic', m: 4, d: 20, name: '학교 봄 소풍', icon: '🧺', from: 10 * 60, to: 15 * 60, map: 'island', at: 'field', fx: 'petals', reward: 'lunchbox',
    intro: '해월초등학교 봄 소풍! 꽃밭 들판에서 보물찾기를 해요.', lines: [[['laugh', '보물찾기 쪽지 숨기는 거 제가 도왔어요. 어딘지는 비밀.']], [['smile', '애들이 김밥 하나씩 줘서 배불러요.']], [['tease', '우리도 소풍 온 것 같다. 돗자리 펴요.']], [['smile', '나중에 우리 애 소풍 때 도시락은 제가 쌀게요.']]],
    choice: [['보물 찾아요!', 3, '찾았다! …아, 이건 제가 숨긴 거네요. 하하.'], ['김밥 먹어요', 2, '한 줄 다 드세요. 저는 꼬다리.']] },
  { id: 'seaDay', m: 5, d: 31, name: '바다의 날 해변 청소', icon: '🌊', from: 9 * 60, to: 13 * 60, map: 'island', at: 'beach', fx: 'confetti',
    intro: '바다의 날! 마을 사람들이 다 같이 해변을 청소해요.', lines: [[['smile', '바다가 깨끗해야 해녀 할머니들이 웃으세요.']], [['laugh', '집게 들고 줍기 시합해요. 지는 사람이 아이스크림.']], [['smile', '같이 하니까 일도 데이트 같네요.']], [['smile', '우리 바다, 우리가 지켜요.']]],
    choice: [['시합해요!', 3, '…졌다. 아이스크림 살게요.'], ['병 주웠어요', 2, '오, 편지 들었나 봐요. …없네. 아쉽다.']] },
  { id: 'dano', m: 6, d: 10, name: '단오 그네뛰기', icon: '🎐', from: 10 * 60, to: 17 * 60, map: 'island', at: 'playground',
    intro: '단오날! 놀이터에서 그네뛰기 · 창포물 머리 감기 체험을 해요.', lines: [[['smile', '단오엔 창포물에 머리 감으면 1년 내내 건강하대요.']], [['tease', '그네 밀어 줄게요. 무서우면 말해요.']], [['blush', '그네 탈 때 웃는 거 보니까 저도 날아갈 것 같아요.']], [['smile', '매년 단오엔 그네 밀어 줄게요. 할머니 돼도요.']]],
    choice: [['더 높이!', 3, '하늘까지 밀어 줄게요!'], ['같이 타요', 3, '두 사람은… 좀 좁겠지만 좋아요.']] },
  { id: 'concert', m: 9, d: 27, name: '가을 광장 음악회', icon: '🎻', from: 18.5 * 60, to: 21.5 * 60, map: 'island', at: 'plaza', fx: 'confetti',
    intro: '광장에서 작은 가을 음악회가 열려요. 우체부 아저씨가 기타를 친대요.', lines: [[['smile', '우체부 아저씨 기타 잘 치시네요. 몰랐어요.']], [['smile', '이 노래 좋다. 가사가… 아, 아니에요.']], [['blush', '이 노래, 우리 노래 하자.']], [['smile', '처음 같이 들었던 노래 기억나요? 오늘도 그 노래 신청했어요.']]],
    choice: [['같이 들어요', 3, '어깨 빌려 드릴게요.'], ['춤춰요!', 4, '…저 춤 못 춰요. 그래도 손 잡을게요.']] },
  { id: 'kimjang', m: 11, d: 25, name: '마을 김장 하는 날', icon: '🥬', from: 9 * 60, to: 16 * 60, map: 'island', at: 'hallFront',
    intro: '마을회관 앞에서 다 같이 김장을 해요. 수육도 삶는대요!', lines: [[['laugh', '할머니들이 저한테 배추 나르라고 하세요. 형사 힘 쓸 데가 여기네요.']], [['tease', '김치 속 한 입 먹어 볼래요? 아— 해요.']], [['smile', '고무장갑 낀 손도 예쁘네요. 진심이에요.']], [['smile', '우리 집 김치는 올해 우리가 담가요. 할머니 레시피로.']]],
    choice: [['수육 먹어요!', 2, '제일 맛있는 부분 드릴게요.'], ['같이 버무려요', 3, '양념 튀었어요. 가만있어 봐요, 닦아 줄게요.']] },
);

/* ---------------- 5) 대사 더 ---------------- */
/* 주민 개인 대사 */
const V_MORE = {
  halmeoni: ['젊을 땐 나도 물질했어. 지금은 무릎이 말을 안 들어.', '우리 하늘이가 형사 양반 따라 한다고 경례하고 다녀.', '밥때 되면 우리 집 와. 숟가락 하나 더 놓으면 돼.', '감기 들면 생강차가 최고야. 끓여 줄까?', '형사 양반 얼굴이 요즘 훤해졌어. 좋은 일 있나 봐.', '귤 껍질 말려서 차 끓이면 향이 좋아.'],
  okja: ['물질은 숨이 반, 욕심 안 내는 마음이 반이야.', '오늘 바다는 순하더라. 이런 날이 고마워.', '해녀 장비 손질하는 거 구경할래?', '순덕이 언니가 또 내 반찬 훔쳐 갔어. 호호.', '바다 소리 들으면 잠이 와.', '전복은 아무나 못 따. 바다가 허락해야 돼.'],
  kid: ['형사님이 저한테 경례 가르쳐 줬어요! 충성!', '할머니가 귤 다섯 개만 먹으래요. 저 여섯 개 먹었어요.', '고양이 노랑이랑 친구 됐어요!', '커서 형사 될 거예요. 아니다, 해녀!', '숙제 다 했어요! …거의요.', '오늘 받아쓰기 백 점 맞았어요!'],
  kid2: ['우리 아빠가 이만한 고기 잡았대요! 진짜예요!', '저 비밀 기지 있어요. 동백숲에요. 비밀이에요!', '형사님은 왜 맨날 바다 봐요?', '저 줄넘기 백 개 해요!', '아빠가 오늘 저녁은 고등어래요. 또요.', '반딧불이 봤어요? 저는 세 번 봤어요!'],
  fisher: ['고기는 새벽에 잘 물어. 부지런해야 돼.', '도윤이 녀석이 커서 어부 된다더라. 말렸어. 허허.', '바다는 겸손해야 돼. 큰소리치면 꼭 빈손이야.', '만복이 그 친구 또 대물 얘기 하지? 다 뻥이야.', '배 기름값이 올라서 걱정이야.', '오늘 잡은 놈 횟집에 넘기고 왔어.'],
  chief: ['회관 노래방 기계 새로 들였어. 한 곡 하고 가.', '마을 회의에서 가로등 더 달기로 했네.', '젊은 사람이 섬에 와 줘서 고마워. 진심이야.', '형사 그 친구, 처음엔 무뚝뚝했는데 많이 변했어.', '올해 축제는 더 크게 해 볼까 하네.', '마을 일은 다 같이 하는 거야. 허허.'],
  postman: ['오늘 편지는 육지에서 온 게 많네요.', '이 섬은 주소 없어도 이름만 쓰면 다 배달돼요. 하하.', '형사님 앞으로 택배가 자주 와요. 뭔지는 비밀이에요.', '자전거로 섬 한 바퀴 도는 게 제 운동이에요.', '손편지 받는 사람들 표정 보는 게 이 일의 보람이에요.', '비 오는 날은 편지가 젖을까 봐 품에 안고 다녀요.'],
  tourist: ['여기 민박 아주머니가 아침밥을 너무 많이 주세요.', '사진 백 장 찍었는데 다 마음에 들어요.', '육지 가기 싫어요. 그냥 여기 살까 봐요.', '귤 따기 체험 언제 해요?', '이 섬은 공기부터 달라요.', '형사님한테 길 물어봤는데 엄청 친절하시더라고요.'],
  tourist2: ['신혼여행으로 왔는데 1년에 한 번씩 오고 싶어요.', '해변 모래가 진짜 고와요.', '남편이 낚시만 하려고 해서 고민이에요. 하하.', '등대 노을 보셨어요? 꼭 보세요.', '여기 카페 귤 라떼 너무 맛있어요.', '두 분 잘 어울려요. …아, 형사님 말한 거예요.'],
  grandpa: ['귤나무는 사람 발소리 듣고 자란다네.', '젊었을 땐 이 섬을 하루에 두 바퀴 걸었지.', '까마귀 녀석들이 귤 맛을 알아.', '귤꽃 필 때 향기 맡아 봤나? 그게 봄이야.', '보건지소 선생이 술 줄이래. 귤 술은 괜찮겠지?', '손주들이 육지에서 귤 보내 달래.'],
  rancher: ['조랑이가 오늘 기분이 좋아. 당근 줘 볼래?', '말은 거짓말을 안 해. 사람보다 나아.', '목장 일은 끝이 없어. 그래도 좋아.', '조랑말 타고 해변 달리면 기분 최고야.', '건초 냄새 좋지? 나는 이게 향수야.'],
  farmer: ['밭은 거짓말 안 해. 정성만큼 돌아와.', '귤 창고에 일손이 모자라. 놀러 와.', '우리 집 귤이 섬에서 제일 달아. 진짜야.', '농사는 하늘이 반이야. 비 오는 거 봐야 해.', '텃밭 키운다며? 모르는 거 있으면 물어봐.'],
  keeper: ['등대 계단이 백열두 개야. 매일 세면서 올라가.', '바다는 밤에 더 정직해.', '옛날엔 등대가 섬의 전부였지.', '배가 무사히 들어오면 그날은 잘 잔다네.', '노을은 매일 달라. 같은 날이 없어.'],
  lifeguard: ['오늘 파도 높아요. 깊은 데 가지 마세요.', '해파리 조심! 오늘은 괜찮아요.', '선크림 꼭 바르세요. 섬 햇볕 세요.', '수영 배우고 싶으면 아침에 오세요. 알려 드려요.', '구조 요청 없는 날이 제일 좋은 날이에요.'],
};
for (const [vid, L] of Object.entries(V_MORE)) if (VILLAGERS[vid] && VILLAGERS[vid].lines) VILLAGERS[vid].lines.base.push(...L);
/* 형사님 일상 한마디 (존댓말 · 단계별) */
const DET_MORE = {
  1: ['섬 생활은 좀 익숙해졌어요? 모르는 거 있으면 파출소로 와요.', '여기 주민분들 다 좋으세요. 조금 시끄러울 뿐.', '오늘도 이상 없음이에요. 그게 제일 좋은 거예요.', '마을버스 시간표 아세요? 정류장에 붙어 있어요.'],
  2: ['오늘 또 마주쳤네요. 이쯤 되면 인연이에요.', '할머니가 저보고 요즘 웃는 일 있냐고 물어보시더라고요.', '순찰 코스에 카페가 있는 건 우연이에요. 진짜로.', '오늘 점심 뭐 먹었어요? 저는 또 캔커피.'],
  3: ['당신이랑 얘기하면 시간이 빨리 가요.', '오늘 무슨 일 있었어요? 다 얘기해 줘요.', '오늘 저녁 노을 같이 볼래요? 그냥, 예쁠 것 같아서.', '요즘 순찰 돌 때 당신 일하는 데 일부러 지나가요. 비밀이에요.'],
  4: ['당신 웃는 거 보면 하루가 괜찮아져요.', '…아까부터 무슨 말 하려다가 까먹었어요. 당신 보느라.', '내일도 볼 수 있죠?', '당신 이름 부르는 거 아직도 좀 떨려요.'],
  5: ['오늘도 고생했어요. 이리 와요.', '하루 종일 당신 생각했어요. 업무 중에도요.', '우리 다음 주말에 무인도 갈래요?', '같이 있으면 아무것도 안 해도 좋아요.'],
};
for (const [st, L] of Object.entries(DET_MORE)) if (SMALLTALK[st]) SMALLTALK[st].push(...L);
const DET_MORE_CAS = {
  3: ['오늘 뭐 했어? 하나도 빼놓지 말고 말해 줘.', '배고프다. 같이 뭐 먹을래?', '너랑 얘기하면 순찰이 순찰 같지가 않아.'],
  4: ['너 오늘 좀 예쁘다. …매일 그렇지만.', '왜 자꾸 너 생각나는지 모르겠어.', '이따 저녁에 뭐 해? 비워 둬.'],
  5: ['보고 싶었어. 아까 봤는데도.', '손 줘. 그냥 잡고 싶어서.', '오늘 저녁 메뉴는 네가 정해. 난 너만 있으면 돼.'],
  6: ['요즘 행복해서 무섭다. 진짜로.', '사택 열쇠 하나 더 만들었어. 너 줄 거야.', '나중에 우리 집엔 마당 있었으면 좋겠다.'],
  7: ['결혼 준비하면서 싸우는 커플 많다던데, 우린 안 싸울 거야. 아마도.', '웨딩드레스… 아니, 상상만 해도 심장 아프다.', '신혼집 커튼 색 정했어? 난 다 좋아.'],
  8: ['여보, 오늘 저녁은 내가 할게.', '집에 오면 네가 있는 게 아직도 신기해.', '우리 늙어서도 이 섬에서 살자.'],
};
for (const [st, L] of Object.entries(DET_MORE_CAS)) if (CASUAL_LINES[st]) CASUAL_LINES[st].push(...L);

/* ---------------- 루프 · 저장 ---------------- */
let _moreT = 0;
const _loopMore = loop;
loop = function (ts) { if (G.started && S && !G.dev) { _moreT += 1 / 60; if (_moreT > 0.8) { _moreT = 0; try { errTick(); } catch (e) { console.error(e); } } } _loopMore(ts); };
const _ensureV4More = ensureV4;
ensureV4 = function (s) { _ensureV4More(s); if (s.errand === undefined) s.errand = null; return s; };
