/* =====================================================================
   반려동물 — 내 고양이 · 강아지
   · 메뉴 → 집 → 반려동물 : 이장님 댁에서 태어난 새끼를 데려와 이름 짓기
   · 평소엔 집에서 지내고(밤엔 쿨쿨), 「같이 산책」을 켜면 어디든 졸졸 따라옴
   · 쓰다듬기 · 간식 · 놀아 주기 · 산책 · 이름 바꾸기, 친해질수록 반응이 다양해짐
   · 형사님도 관계에 따라 다르게 반응 — 가끔 먼저 쓰다듬고 말을 걺
   ===================================================================== */
const PET_LOOKS = {
  p_cheese: { kind: 'cat', label: '치즈 고양이', body: '#f4a640', dark: '#d07f22', light: '#ffd28a', belly: '#fff6e4', stripes: true },
  p_tuxedo: { kind: 'cat', label: '턱시도 고양이', body: '#2f2c33', dark: '#18161b', light: '#55505c', belly: '#ffffff' },
  p_gray: { kind: 'cat', label: '회색 고양이', body: '#a9b0bb', dark: '#7d8590', light: '#cfd4db', belly: '#eef0f3' },
  p_white: { kind: 'dog', label: '하얀 강아지', body: '#fffdf8', dark: '#e6dccb', light: '#ffffff', belly: '#ffffff' },
  p_brown: { kind: 'dog', label: '갈색 강아지', body: '#a8703c', dark: '#7d4f26', light: '#c99260', belly: '#f0d8b8' },
  p_black: { kind: 'dog', label: '까만 강아지', body: '#33302e', dark: '#1d1b1a', light: '#5a5450', belly: '#c98a4b' },
};
const _animalSpritePet = animalSprite;
animalSprite = function (al, frame, sit) { return al.myPet ? _animalSpritePet(Object.assign({}, al, { name: '§' + al.lookId + '§' + al.name }), frame, sit) : _animalSpritePet(al, frame, sit); };
function petLook() { const p = S.pet, L = PET_LOOKS[p.look]; return Object.assign({}, L, { name: p.name, lookId: p.look, myPet: true }); }
const petCat = () => S.pet && PET_LOOKS[S.pet.look].kind === 'cat';
const petSound = () => petCat() ? '냥' : '멍';
function petBond() { return S.pet ? S.pet.aff : 0; }

/* ---------------- 액터 ---------------- */
function spawnMyPet() {
  if (G.myPet) { G.actors = G.actors.filter(a => a !== G.myPet); G.myPet = null; }
  if (!S.pet) return;
  const a = new Actor('myPet', { name: S.pet.name, outfits: {} }, 'base', 'in_home');
  a.vid = 'myPet'; a.pet = petLook(); a.speed = petCat() ? 2.3 : 2.7; a.wait = 0; a.isMyPet = true;
  const P = G.player;
  if (S.pet.walk && P) { a.map = P.map; [a.x, a.y] = nearestWalkable(P.x + 0.8, P.y + 0.6, MAPS[P.map]); }
  else { a.map = 'in_home'; [a.x, a.y] = nearestWalkable(2.5, 3.5, MAPS.in_home); }
  a.visible = true; G.myPet = a; G.actors.push(a);
}
function myPetTick(dt) {
  const a = G.myPet; if (!a || !S.pet) return;
  const P = G.player, night = S.min >= 22.5 * 60 || S.min < 6.5 * 60;
  a.wait -= dt;
  if (S.pet.walk && !night) {
    if (a.map !== P.map) { a.map = P.map; [a.x, a.y] = nearestWalkable(P.x, P.y + 0.8, MAPS[P.map]); a.stop(); }
    const k = dist(a, P);
    if (k > 1.3) { if (!a.path.length || a.wait <= 0) { a.wait = 0.45; a.walkTo(P.x, P.y); if (a.path.length) a.path.pop(); } a.pose = 'stand'; }
    else if (!a.path.length && a.wait <= 0) { a.pose = Math.random() < 0.5 ? 'sit' : 'stand'; a.wait = rand(1.5, 4); }
    a.speedMul = k > 3 ? 1.7 : 1;
    if (k > 12) { [a.x, a.y] = nearestWalkable(P.x, P.y + 0.8, MAPS[P.map]); a.stop(); }
  } else {
    if (S.pet.walk && night) { S.pet.walk = false; toast(`🌙 ${josa(S.pet.name, '은', '는')} 졸려서 집으로 갔어요`); }
    if (a.map !== 'in_home') { a.map = 'in_home'; [a.x, a.y] = nearestWalkable(2.5, 3.5, MAPS.in_home); a.stop(); }
    a.speedMul = 1;
    if (!a.path.length && a.wait <= 0) {
      if (night || Math.random() < 0.45) { a.pose = 'sit'; a.wait = rand(5, 12); }
      else { a.pose = 'stand'; const m = MAPS.in_home; const [x, y] = nearestWalkable(rand(1, m.W - 1), rand(1, m.H - 1), m); a.walkTo(x, y); a.wait = rand(2, 5); }
      // 집에 들어오면 마중
      if (P.map === 'in_home' && !night && Math.random() < 0.3 && dist(a, P) > 2) a.walkTo(P.x + 0.6, P.y + 0.6);
    }
  }
  if (Math.random() < dt * 0.015 && a.map === P.map && dist(a, P) < 6) a.say(pick(petCat() ? ['냥~', '냐아옹', '(골골골)', '(꼬리를 세운다)'] : ['멍!', '왈왈!', '(꼬리 붕붕)', '헥헥']), 1.6);
  a.update(dt);
  petDetTick(dt);
}
const _detUpdatePet = detUpdate;
detUpdate = function (dt) { _detUpdatePet(dt); try { myPetTick(dt); } catch (e) { console.error(e); } };

/* ---------------- 형사님 반응 ---------------- */
const PET_DET = {
  low: ['{p}? 이름 잘 지으셨네요. …손 냄새 맡게 해 줘도 돼요?', '{p}, 주인 닮아서 순하네요.', '(쪼그려 앉아 {p}와 눈높이를 맞춘다) 안녕. 나 경찰이야. 무서운 사람 아니야.'],
  mid: ['{p}! 오늘도 귀엽네. …너 말고 {p} 말한 거야. 아니, 둘 다.', '{p}가 나 알아보는 것 같아. 꼬리 흔드는 거 봐.', '{p}한테 간식 주려고 주머니에 넣어 다녀. 비밀이야.'],
  high: ['우리 {p}~ 아빠 왔다. …아빠라고 해도 되지?', '{p}가 나보다 너를 더 좋아하는 것 같아. 질투 나.', '나중에 셋이 같이 사진 찍자. {p}도 같이.'],
};
let _petDetT = 0;
function petDetTick(dt) {
  const a = G.myPet, d = G.det; if (!a || !S.rel.flags.met || !d.visible || d.map !== a.map || G.busy) return;
  _petDetT -= dt; if (_petDetT > 0 || dist(a, d) > 2.2) return;
  _petDetT = rand(40, 90);
  const b = S.rel.stage >= 5 ? 'high' : S.rel.stage >= 3 ? 'mid' : 'low';
  const line = fixJosa(pick(PET_DET[b]).replace(/\{p\}/g, S.pet.name));
  d.say(line.length > 26 ? line.slice(0, 26) + '…' : line, 3); burst(a, 'heart', 2);
  a.say(petCat() ? '(골골)' : '(꼬리 붕붕)', 2);
}

/* ---------------- 상호작용 ---------------- */
const PET_PAT = {
  cat: [['(머리를 손에 비빈다) 골골골골…', '(눈을 가늘게 뜬다) 냥.'], ['(배를 보여 준다!) …만지면 물 것 같다.', '(턱을 쓰다듬자 고개를 쭉 뺀다)'], ['(무릎 위로 올라와 동그랗게 눕는다)', '(꾹꾹이를 한다) 사랑받는 기분이다.']],
  dog: [['(꼬리를 흔든다) 멍!', '(손을 핥는다) 헥헥.'], ['(벌러덩 누워 배를 보여 준다)', '(앞발을 손에 올린다) 손!'], ['(얼굴을 핥고 펄쩍펄쩍 뛴다)', '(온몸으로 기대 온다) 세상에서 네가 제일 좋대.']],
};
async function myPetMenu() {
  const p = S.pet, a = G.myPet, P = G.player; a.stop(); a.lookAt(P); P.lookAt(a);
  const D = p.daily && p.daily.day === S.day ? p.daily : (p.daily = { day: S.day, pat: 0, snack: false, play: false });
  const snackK = ['petsnack', 'snack', 'f_jack', 'f_mackerel'].find(k => (S.inv[k] || 0) > 0);
  openSheet({ title: `${petCat() ? '🐱' : '🐶'} ${p.name}`, sub: `<div class="relneed">${PET_LOOKS[p.look].label} · 함께한 지 ${S.day - p.day + 1}일 · 친밀도 ${'♥'.repeat(Math.min(5, 1 + Math.floor(p.aff / 20)))}${'♡'.repeat(Math.max(0, 4 - Math.floor(p.aff / 20)))}</div>`, cols: 3, items: [
    { icon: '🤲', label: '쓰다듬기', onClick: () => runEvent(async () => { const lv = Math.min(2, Math.floor(p.aff / 35)); Sound.sfx(petCat() ? 'meow' : 'woof'); a.pose = 'sit'; burst(a, 'heart', 3); await say('narr', '', `${p.name}: ${pick(PET_PAT[petCat() ? 'cat' : 'dog'][lv])}`); if (D.pat < 3) { D.pat++; p.aff = Math.min(100, p.aff + 2); } petDetReact('pat'); }) },
    { icon: '🦴', label: '간식 주기', note: D.snack ? '오늘 줬어요' : snackK ? ITEMS[snackK].name : '간식 없음', disabled: D.snack || !snackK, why: D.snack ? '간식은 하루 한 번!' : '슈퍼에서 간식을 사 와요', onClick: () => runEvent(async () => { S.inv[snackK]--; D.snack = true; p.aff = Math.min(100, p.aff + 5); burst(a, 'heart', 5); Sound.sfx(petCat() ? 'meow' : 'woof'); await say('narr', '', `${p.name}: ${petCat() ? '(냠냠… 다 먹고 입맛을 다신다) 냐앙!' : '(한입에 꿀꺽!) 왈왈! (더 달라는 눈빛)'}`); petDetReact('snack'); }) },
    { icon: petCat() ? '🧶' : '🎾', label: '놀아 주기', note: D.play ? '오늘 놀았어요' : '', disabled: D.play, why: '오늘은 충분히 놀았어요. 내일 또!', onClick: () => runEvent(petPlay) },
    { icon: p.walk ? '🏠' : '🦮', label: p.walk ? '집에 두기' : '같이 산책', note: p.walk ? '지금 따라다녀요' : '어디든 따라와요', onClick: () => { p.walk = !p.walk; if (p.walk) { a.map = P.map; [a.x, a.y] = nearestWalkable(P.x + 0.6, P.y + 0.6, MAPS[P.map]); toast(`🦮 ${josa(p.name, '이', '가')} 따라와요`); memRecent('pet', `${josa(p.name, '과', '와')} 산책했다`); } else toast(`🏠 ${josa(p.name, '은', '는')} 집에서 기다려요`); save(); } },
    { icon: '📷', label: '사진 찍기', onClick: () => runEvent(async () => { a.pose = 'sit'; await addAlbum(`${p.name}의 하루`, 'photo'); }) },
    { icon: '✏️', label: '이름 바꾸기', onClick: () => runEvent(async () => { const n = await askText(`${p.name}의 새 이름`, p.name, 6); if (n) { p.name = n; a.pet = petLook(); a.look.name = n; await say('narr', '', `이제 「${n}」이에요.`); } }) },
  ] });
}
async function petPlay() {
  const p = S.pet, a = G.myPet, P = G.player; p.daily.play = true;
  await say('narr', '', petCat() ? '🧶 털실 공을 굴렸다!' : '🎾 공을 멀리 던졌다!');
  const [tx, ty] = nearestWalkable(P.x + rand(-3, 3), P.y + rand(-3, 3), MAPS[P.map]);
  a.pose = 'stand'; a.speedMul = 2; a.walkTo(tx, ty); await sleep(1300); a.walkTo(P.x + 0.5, P.y + 0.5); await sleep(1300); a.speedMul = 1;
  const good = Math.random() < 0.5 + p.aff / 200;
  await say('narr', '', petCat() ? (good ? `${p.name}: (공을 앞발로 톡톡 치다가 벌러덩) 냥냥!` : `${p.name}: (공을 쳐다만 보고 하품…) 고양이는 원래 이래요.`) : (good ? `${p.name}: (공을 물고 돌아와 발 앞에 툭!) 왈! 한 번 더!` : `${p.name}: (공 대신 나뭇가지를 물어 왔다) 헥헥.`));
  p.aff = Math.min(100, p.aff + 4); burst(a, 'heart', 4); memRecent('pet', `${josa(p.name, '과', '와')} 신나게 놀았다`);
  petDetReact('play');
  if (p.aff >= 60 && !p.album60) { p.album60 = true; await addAlbum(`${josa(p.name, '과', '와')} 단짝`, 'daily'); }
}
async function petDetReact(kind) {
  const d = G.det, a = G.myPet; if (!S.rel.flags.met || !d.visible || d.map !== a.map || dist(d, a) > 5) return;
  const b = S.rel.stage >= 5 ? 'high' : S.rel.stage >= 3 ? 'mid' : 'low', n = S.pet.name;
  const L = { pat: { low: `${josa(n, '이', '가')} 기분 좋아 보이네요.`, mid: `나도 쓰다듬어 봐도 돼? …와, 털 진짜 부드럽다.`, high: `${n}만 쓰다듬어 주고. 나는?` }, snack: { low: '간식 먹는 소리 들으니까 저도 배고프네요.', mid: `${n} 먹는 거 보니까 흐뭇하다.`, high: `${n} 살찌면 산책 두 배로 시키자. 우리가 같이.` }, play: { low: '하하, 잘 노네요.', mid: '나도 끼워 줘! 공 던지기는 자신 있어.', high: '우리 셋, 가족 같다. …진짜 가족 하자.' } }[kind][b];
  d.lookAt(a); await say('det', b === 'high' ? 'blush' : 'smile', L); addAff(1);
}
const _interactWithPet = interactWith;
interactWith = function (a) { if (a && a.isMyPet) { Sound.init(); myPetMenu(); return; } return _interactWithPet(a); };

/* ---------------- 입양 ---------------- */
function petAdoptMenu() {
  if (S.pet) { if (G.myPet) { openSheet({ title: `🐾 ${S.pet.name}`, sub: `<div class="relneed">${S.pet.walk ? '지금 같이 산책 중' : '집에서 지내요'} · 친밀도 ${S.pet.aff}</div>`, cols: 2, items: [{ icon: S.pet.walk ? '🏠' : '🦮', label: S.pet.walk ? '집에 두기' : '부르기 (같이 산책)', onClick: () => { S.pet.walk = !S.pet.walk; if (S.pet.walk) { const P = G.player, a = G.myPet; a.map = P.map; [a.x, a.y] = nearestWalkable(P.x + 0.6, P.y + 0.6, MAPS[P.map]); } toast(S.pet.walk ? `🦮 ${josa(S.pet.name, '이', '가')} 달려왔어요` : `🏠 ${josa(S.pet.name, '은', '는')} 집으로 갔어요`); } }, { icon: '🤲', label: '돌봐 주기', onClick: () => { if (G.myPet.map !== G.player.map) { S.pet.walk = true; G.myPet.map = G.player.map; [G.myPet.x, G.myPet.y] = nearestWalkable(G.player.x + 0.6, G.player.y + 0.6, M); } myPetMenu(); } }] }); } return; }
  openSheet({ title: '🐾 반려동물 데려오기', sub: '<div class="relneed">이장님 댁 누렁이 · 삼색이가 새끼를 낳았대요. 한 마리를 가족으로 데려올까요?</div>', cols: 3, items: Object.entries(PET_LOOKS).map(([k, L]) => ({ icon: L.kind === 'cat' ? '🐱' : '🐶', label: L.label, onClick: () => runEvent(() => petAdopt(k)) })) });
}
async function petAdopt(k) {
  const L = PET_LOOKS[k];
  await say('narr', '', `${L.kind === 'cat' ? '🐱' : '🐶'} 작은 ${josa(L.label, '이', '가')} 품에 쏙 안겼다. 따뜻하다.`);
  const n = await askText(L.kind === 'cat' ? '예: 귤이, 모래, 콩떡' : '예: 보리, 해피, 몽실이', '', 6);
  const name = n || (L.kind === 'cat' ? '귤이' : '보리');
  S.pet = { look: k, name, day: S.day, aff: 10, walk: true, daily: null };
  spawnMyPet();
  burst(G.myPet, 'heart', 6); Sound.sfx(L.kind === 'cat' ? 'meow' : 'woof');
  await say('narr', '', `오늘부터 ${josa(name, '과', '와')} 함께예요! 평소엔 집에 있고, 「같이 산책」을 누르면 따라와요.`);
  memRecent('pet', `${josa(name, '을', '를')} 가족으로 맞았다`);
  await addAlbum(`${name}, 우리 집에 온 날`, 'daily');
  if (S.rel.flags.met) addRumor && addRumor('pet', { name }, { key: 'pet' });
}
/* 메뉴 → 집 에 「반려동물」 */
const _openSheetPet = openSheet;
openSheet = function (o) {
  if (o && o.title === '🏠 집' && !o.items.find(i => i.label === '반려동물')) o = Object.assign({}, o, { items: [...o.items, { icon: '🐾', label: '반려동물', note: S.pet ? S.pet.name : '데려오기', onClick: petAdoptMenu }] });
  return _openSheetPet(o);
};
const _startGamePet = startGame;
startGame = function (state, isNew) { _startGamePet(state, isNew); try { spawnMyPet(); } catch (e) { console.error(e); } };
const _endDayPet = endDay;
endDay = async function (forced) { await _endDayPet(forced); if (S.pet) { S.pet.walk = false; spawnMyPet(); } };
const _ensureV4Pet = ensureV4;
ensureV4 = function (s) { _ensureV4Pet(s); if (s.pet === undefined) s.pet = null; return s; };
if (typeof RUMOR_TEXT !== 'undefined' && !RUMOR_TEXT.pet) RUMOR_TEXT.pet = ['그 집 새 식구 {name}, 봤어? 엄청 귀여워.', '새로 온 {name}, 우리 손주가 매일 보러 간대.'];
ITEMS.petsnack = ITEMS.petsnack || { name: '반려동물 간식', icon: '🦴', price: 1500, gift: 1, sell: 300, react: ['반려동물 간식이요? …아, 제 거 아니죠? 하하.', 'laugh'] };
if (typeof SHOP_LIFE !== 'undefined' && !SHOP_LIFE.includes('petsnack')) { SHOP_LIFE.push('petsnack'); if (!SHOP.includes('petsnack')) SHOP.push('petsnack'); }
