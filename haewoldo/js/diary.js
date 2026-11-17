/* =====================================================================
   일기장 — 내 일기 · 형사님 일기
   · 잠들 때 그날 실제로 한 일(선물·요리·낚시·데이트·장소·날씨)로 내 일기가 써짐
   · 형사님도 매일 밤 일기를 씀 — 문장 조각을 매번 새로 조합하고, 꼭 「나」 이야기가 섞임
   · 가끔 아침에 형사님 일기 한 장을 몰래 보게 되고(그때그때), 연인이 되면 일기장을 통째로 보여 줌
   · 메뉴 → 추억 → 일기장
   ===================================================================== */
function diaryState() { if (!S.diary) S.diary = { me: [], det: [], seen: 0, last: 0 }; return S.diary; }
const _pk = (a) => a[Math.floor(Math.random() * a.length)];
const _fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] != null ? v[k] : '');
function dName() {   // 형사님이 일기에서 나를 부르는 말
  const st = S.rel.stage;
  if (st >= 8) return _pk(['우리 ' + (S.names.meNick || S.name), S.names.meNick || S.name]);
  if (st >= 5) return S.names.meNick || S.name;
  if (st >= 4) return S.name;
  return S.name + ' 씨';
}
const WX_ME = { sunny: ['하늘이 맑았다.', '햇살이 좋은 날이었다.', '바람이 살랑 불었다.'], cloudy: ['구름이 잔뜩 낀 날이었다.', '하늘이 회색이었다.'], rain: ['하루 종일 비가 왔다.', '빗소리를 들으며 하루를 보냈다.'], storm: ['바람이 엄청 불었다. 창문이 덜컹거렸다.'], snow: ['눈이 내렸다. 섬이 하얗게 변했다.', '발밑에서 눈이 뽀드득 소리를 냈다.'] };
const WX_DET = { sunny: ['날씨 맑음.', '맑음. 바다가 유난히 파랬다.', '볕 좋음. 순찰 돌기 좋은 날.'], cloudy: ['흐림.', '흐림. 비 올 줄 알았는데 안 왔다.'], rain: ['비.', '비. 우산을 두 개 챙겼다. 혹시 몰라서.', '비. 빗소리 때문인지 이상하게 생각이 많아지는 밤.'], storm: ['태풍. 하루 종일 비상 대기.', '바람이 무섭게 불었다. 다들 무사해서 다행.'], snow: ['눈.', '눈이 왔다. 섬에서 보는 눈은 처음이다.', '눈. 발자국이 두 줄로 남아 있었다.'] };

/* ---------------- 하루 기록 모으기 ---------------- */
function dayFacts() {
  const r = S.rel, D = r.daily || {}, today = S.mem.recent.filter(m => m.day === S.day);
  const st = diaryState(); const places = (st.places && st.places.day === S.day) ? st.places.list : [];
  const gift = (r.giftLog[0] && r.giftLog[0].day === S.day) ? ITEMS[r.giftLog[0].k] : null;
  return { D, today, places, gift, met: !!D.met || D.talk > 0, talk: D.talk || 0, fish: D.fish || 0, wx: S.weather, cook: today.find(m => m.type === 'cook'), farm: today.find(m => m.type === 'farm'), date: today.find(m => m.type === 'date'), act: today.find(m => m.type === 'act' || m.type === 'leisure'), cs: today.find(m => m.type === 'case'), photo: today.find(m => m.type === 'photo'), fest: today.find(m => m.type === 'festival'), walk: !!r.flags.met && (D.togetherAff || 0) > 0, hug: D.hug, kiss: D.kiss, sit: Object.keys(D.sit || {}).length > 0, pet: today.find(m => m.type === 'pet'), peek: today.find(m => m.type === 'peek'), bday: today.find(m => /생일/.test(m.text)), ev: today.find(m => m.type === 'sevent') };
}

/* ---------------- 내 일기 ---------------- */
function writeMyDiary(F) {
  const h = himCall(), L = [];
  L.push(_pk(WX_ME[F.wx] || WX_ME.sunny));
  if (F.places.length) L.push(_pk([`오늘은 ${F.places.slice(0, 3).join(', ')}에 다녀왔다.`, `${F.places.slice(0, 3).join(', ')}… 섬 여기저기를 돌아다녔다.`]));
  if (S.rel.flags.met && F.met) L.push(_pk([`${josa(h, '과', '와')} 이야기를 나눴다.`, `오늘도 ${josa(h, '을', '를')} 만났다.`, `${josa(h, '이', '가')} 먼저 인사해 줬다.`]));
  if (F.gift) L.push(`${h}에게 ${josa(F.gift.name, '을', '를')} 선물했다. ${_pk(['좋아하는 것 같았다.', '표정을 몰래 봤는데 웃고 있었다.', '받는 손이 조심스러웠다.'])}`);
  if (F.cook) L.push(F.cook.text + '. ' + _pk(['꽤 잘 된 것 같다.', '다음엔 더 잘할 수 있을 것 같다.', '맛있었다!']));
  if (F.farm) L.push(F.farm.text + '. 텃밭 일은 늘 뿌듯하다.');
  if (F.fish) L.push(`물고기를 ${F.fish}마리 낚았다. ${F.fish >= 3 ? '오늘은 운이 좋았다!' : ''}`);
  if (F.date) L.push(`${F.date.text}. ${_pk(['두근거렸다.', '오래 기억하고 싶은 시간이었다.', '시간이 너무 빨리 갔다.'])}`);
  if (F.walk) L.push(_pk([`${josa(h, '과', '와')} 같이 걸었다.`, '나란히 걷는 길이 짧게 느껴졌다.']));
  if (F.sit) L.push('나란히 앉아 바다를 봤다.');
  if (F.hug) L.push('안아 줬다. 따뜻했다.');
  if (F.kiss) L.push('…오늘 일은 일기에도 못 쓰겠다. 비밀.');
  if (F.cs) L.push(F.cs.text + '.');
  if (F.photo) L.push(`사진을 찍었다 — 「${F.photo.text}」.`);
  if (F.pet) L.push(F.pet.text + '.');
  if (F.peek) L.push(`${h} 몰래 훔쳐봤다. ${F.peek.text}.`);
  if (F.ev) L.push(F.ev.text + '.');
  if (F.bday) L.push(F.bday.text + '. 잊지 못할 하루.');
  if (L.length < 3) L.push(_pk(['평범한 하루였다. 그래도 나쁘지 않았다.', '오늘은 조용히 지나갔다.', '내일은 뭘 해 볼까.']));
  L.push(_pk(S.rel.stage >= 5 ? ['내일도 보고 싶다.', `잘 자, ${h}.`, '오늘도 행복했다.'] : S.rel.stage >= 3 ? ['내일은 무슨 얘기를 할까.', '왜 자꾸 생각나지?', '내일도 마주치면 좋겠다.'] : ['해월도 생활, 생각보다 괜찮다.', '내일도 힘내자.', '이 섬이 점점 좋아진다.']));
  return L.join(' ');
}

/* ---------------- 형사님 일기 ---------------- */
const DET_OPEN = {
  low: ['오늘 근무 일지는 따로 썼으니, 여기엔 개인적인 것만.', '일기를 쓰는 건 경찰학교 이후 처음이다.', '섬 근무 ○일째. 적응 중.', '파출소 불 끄고 사택에 와서 쓴다.', '조용한 섬이라더니, 하루가 꽤 길었다.'],
  mid: ['요즘 일기가 길어진다. 이유는 알 것 같다.', '오늘도 쓸 말이 많다. 다 한 사람 얘기지만.', '펜을 들었는데 첫 줄부터 이름이 떠올랐다.', '이 일기장, 누가 보면 큰일 난다.', '순찰 일지보다 이게 더 어렵다.'],
  high: ['오늘의 기록. 제목: 또 반했다.', '이 일기장의 주인공이 바뀐 지 오래다.', '사랑하는 사람이 있는 섬에서 하루를 마쳤다.', '오늘도 쓴다. 너에 대해서.', '자기 전에 꼭 쓰기로 했다. 잊고 싶지 않아서.'],
  wed: ['옆에서 자는 숨소리를 들으면서 쓴다.', '결혼하고 나서 일기장이 행복한 말로만 찬다.', '오늘도 같은 집으로 퇴근했다. 아직도 신기하다.'],
};
const DET_ABOUT = {   // 나에 대한 문장 — {n} 내 이름, {g} 선물, {p} 장소, {c} 요리, {j} 직업
  gift: { low: ['{n}이(가) {g}을(를) 줬다. 이유 없는 선물은 처음 받아 본다. 책상 서랍에 넣어 뒀다.', '{g}. {n}한테 받았다. 고맙다는 말을 제대로 못 했다. 내일 다시 해야지.'], mid: ['{n}이(가) {g}을(를) 줬다. 내가 좋아하는 걸 어떻게 알았지? …관찰력은 나보다 낫다.', '{g}을(를) 받았다. 받자마자 웃어 버렸다. 들켰을까.', '{g}. 아까워서 아직 못 썼다. 아마 계속 못 쓸 것 같다.'], high: ['{n}이(가) 준 {g}. 이 사람은 나를 너무 잘 안다.', '선물 같은 거 안 줘도 되는데. 그래도 {g}을(를) 내미는 손을 보면 매번 심장이 쿵 한다.'] },
  cook: { low: ['{n}이(가) {c}을(를) 만들었다고 한다. 냄새가 파출소까지 났다… 는 건 과장이고.', '{c}. 요리도 하는구나. 메모.'], mid: ['{n}의 {c}. 한 입 먹고 말을 잃었다. 맛있어서.', '{c}을(를) 만든 얘기를 하는데 눈이 반짝였다. 그 얼굴이 더 기억에 남는다.'], high: ['오늘 저녁은 {n}표 {c}. 세상에서 제일 맛있는 식당은 우리 집이다.', '{c}. 간 보라고 숟가락을 내밀었다. 그 장면이 하루 종일 떠올랐다.'] },
  fish: { low: ['{n}이(가) 포구에서 낚시하는 걸 봤다. 생각보다 진지하다.', '{n} 오늘 물고기 꽤 낚았다던데. 만복 아저씨가 견제하는 눈치.'], mid: ['{n}이(가) 고기를 낚을 때마다 나보다 더 신나서 뛰는 모습. 순찰 중인데 웃음이 났다.', '낚시 실력이 늘었다. 언젠가 나를 이길지도.'], high: ['같이 낚시하면 물고기는 사실 상관없다. 옆에 앉아 있는 게 좋다.'] },
  walk: { low: ['{n}이(가) {p} 쪽 길을 물어봐서 같이 걸었다. 안내만 했다. 그게 다다.', '{p}까지 같이 걸었다. 걸음 속도를 맞추느라 신경 쓰였다.'], mid: ['{p}까지 같이 걸었다. 일부러 먼 길로 돌았다는 건 비밀.', '걷는 내내 무슨 얘기를 했는지 기억이 안 난다. 옆얼굴만 기억난다.', '{n}이(가) 웃을 때 나도 모르게 따라 웃는다. 큰일이다.'], high: ['손을 잡고 {p}까지 걸었다. 손이 차서 주머니에 같이 넣었다.', '{p}에서 노을을 봤다. 노을보다 옆 사람을 더 오래 봤다.'] },
  sit: { low: ['벤치에 나란히 앉았다. 생각보다 어색하지 않았다.'], mid: ['나란히 앉았는데 어깨가 닿을 듯 말 듯. 아무 말도 못 했다.', '바다를 보는 척했다. 사실은 옆을 봤다.'], high: ['어깨에 기대 온 무게가 좋았다. 오래 이러고 싶었다.'] },
  talk: { low: ['{n}은(는) {j} 일을 한다. 섬에 온 지 얼마 안 됐는데 벌써 동네 사람들이 다 안다.', '{n}이(가) 오늘도 먼저 인사했다. 이 섬 사람들 중 제일 밝다.', '{n}. 이름 쓰는 게 왜 이렇게 어색하지.'], mid: ['오늘 {n}이(가) 한 말을 계속 곱씹는다. 별것 아닌 말인데.', '{n}이(가) 나를 부를 때 목소리가 좋다. 이걸 왜 쓰고 있지.', '대화하다가 시간 가는 줄 몰랐다. 순찰 늦을 뻔.'], high: ['오늘도 {n}의 목소리로 하루를 시작하고 끝냈다.', '{n}이(가) "보고 싶었어"라고 했다. 몇 시간 만에 봤는데. 나도 그랬다.'] },
  none: { low: ['오늘은 {n}을(를) 못 봤다. 그게 왜 신경 쓰이지.', '순찰하다가 {n}네 집 쪽을 봤다. 불이 켜져 있었다. 다행이다.'], mid: ['하루 종일 {n}을(를) 못 봤다. 일부러 그 길로 순찰을 두 번 돌았는데.', '못 본 날은 하루가 덜 끝난 느낌이다.'], high: ['오늘은 못 봤다. 하루가 이렇게 길 줄이야. 내일은 내가 먼저 찾아가야지.'] },
  date: { mid: ['데이트… 라고 불러도 되나. {p}에서. 오늘 셔츠 잘 입었다.'], high: ['{p} 데이트. 계속 웃던 얼굴이 아직도 눈앞에 있다.', '{p}에서 {n}이(가) 내 손을 먼저 잡았다. 오늘 일기는 이걸로 끝.'] },
  farm: { low: ['{n}네 텃밭에 뭔가 자라고 있었다. 부지런하다.'], mid: ['{n}이(가) 텃밭에서 흙 묻은 손으로 손을 흔들었다. 그게 왜 그렇게 예뻐 보였는지.'], high: ['우리 텃밭. 이제 우리라고 쓴다.'] },
  pet: { low: ['{n}네 반려동물이 나를 보고 꼬리를 흔들었다. 주인 닮아서 붙임성이 좋다.'], mid: ['{n}의 반려동물이 내 신발 위에서 잠들었다. 못 움직였다. 행복한 벌.'], high: ['우리 집 막내가 오늘 나를 마중 나왔다. 이 가족이 너무 좋다.'] },
  peek: { mid: ['오늘 누가 나를 몰래 보는 것 같았다. 모른 척했다. 사실 알고 있었다.'], high: ['훔쳐보는 거 다 알아. 귀엽게 숨는 거 보려고 모른 척하는 거다.'] },
};
const DET_CLOSE = {
  low: ['내일도 무사한 하루이길.', '이상 끝.', '…잘 자라는 말은 일기에 써도 되나. 잘 자요.', '이 섬, 생각보다 마음에 든다.'],
  mid: ['이거 혹시 좋아하는 건가. 아니다. 아니겠지. …아마도.', '내일은 먼저 말을 걸어 봐야지.', '{n}. 이름 세 번 써 봤다. 지운다.', '자려고 누웠는데 또 생각날 것 같다.', '형사가 이렇게 마음을 들키면 안 되는데.'],
  high: ['사랑한다. 오늘도.', '내일 아침 첫 마디는 내가 먼저 할 거다.', '이 사람이 내 사람이라니. 아직도 꿈 같다.', '잘 자, {n}. 꿈에서 보자.'],
};
function detBand() { const st = S.rel.stage; return st >= 8 ? 'wed' : st >= 5 ? 'high' : st >= 3 ? 'mid' : 'low'; }
function aboutLine(kind, v) { const band = detBand() === 'wed' ? 'high' : detBand(); const P = DET_ABOUT[kind]; if (!P) return null; const pool = P[band] || P.mid || P.low; return pool ? fixJosa(_fill(_pk(pool), v)) : null; }
function fixJosa(s) { return s.replace(/(\S+?)(이\(가\)|을\(를\)|은\(는\)|과\(와\))/g, (m, w, j) => { const [a, b] = j === '이(가)' ? ['이', '가'] : j === '을(를)' ? ['을', '를'] : j === '은(는)' ? ['은', '는'] : ['과', '와']; return josa(w, a, b); }); }
function writeDetDiary(F) {
  const band = detBand(), cb = band === 'wed' ? 'high' : band;
  const v = { n: dName(), g: F.gift ? F.gift.name : '', p: F.places[0] || pick(['등대', '포구', '해변', '언덕 전망대']), c: F.cook ? ((F.cook.text.match(/([가-힣·]+(?: [가-힣]+)?)[을를] 만들었다/) || [])[1] || '') : '', j: JOBS[S.job] ? JOBS[S.job].name : '' };
  const L = [_pk(WX_DET[F.wx] || WX_DET.sunny), _pk(DET_OPEN[band])];
  const kinds = [];
  if (F.gift) kinds.push('gift'); if (F.date) kinds.push('date'); if (F.cook && v.c) kinds.push('cook'); if (F.walk) kinds.push('walk'); if (F.sit) kinds.push('sit');
  if (F.fish) kinds.push('fish'); if (F.farm) kinds.push('farm'); if (F.pet) kinds.push('pet'); if (F.peek && S.rel.stage >= 3) kinds.push('peek');
  if (F.met || F.talk) kinds.push('talk');
  if (!kinds.length) kinds.push(S.rel.flags.met ? 'none' : 'talk');
  const use = kinds.sort(() => Math.random() - 0.5).slice(0, 3);
  for (const k of use) { const s = aboutLine(k, v); if (s) L.push(s); }
  if (F.hug && cb !== 'low') L.push(_pk(['오늘 안았을 때, 심장 소리 들렸을까. 들렸겠지.', '품에 쏙 들어오는 게 반칙이다.']));
  if (F.kiss) L.push(_pk(['…이건 일기에 안 쓴다.', '오늘 일은 평생 안 잊을 거다. 자세한 건 생략.']));
  if (F.bday) L.push(_pk(['생일. 이 날짜는 이제 달력에 빨간 동그라미다.', '케이크 촛불 너머로 본 얼굴, 오래 기억할 거다.']));
  if (F.ev) L.push(`${F.ev.text}. 같이 봐서 다행이다.`);
  L.push(fixJosa(_fill(_pk(DET_CLOSE[cb]), v)));
  return L.join('\n');
}

/* ---------------- 하루 끝 · 아침에 몰래 보기 ---------------- */
let _dPlT = 0;
const _loopDiary = loop;
loop = function (ts) {
  if (G.started && S && !G.dev && G.player) { _dPlT += 1 / 60; if (_dPlT > 3) { _dPlT = 0; try { const st = diaryState(); if (!st.places || st.places.day !== S.day) st.places = { day: S.day, list: [] }; const n = G.player.map === 'island' ? placeName(curPlace()) : (M && M.name); if (n && !st.places.list.includes(n)) st.places.list.push(n); } catch (e) { } } }
  _loopDiary(ts);
};
const _endDayDiary = endDay;
endDay = async function (forced) {
  let wrote = null;
  try {
    const st = diaryState(), F = dayFacts(), day = S.day;
    if (!st.me.find(e => e.day === day)) { st.me.unshift({ day, text: writeMyDiary(F) }); st.me = st.me.slice(0, 120); }
    if (S.rel.flags.met && !st.det.find(e => e.day === day)) { wrote = { day, text: writeDetDiary(F), read: false }; st.det.unshift(wrote); st.det = st.det.slice(0, 120); }
  } catch (e) { console.error(e); }
  await _endDayDiary(forced);
  try {
    const st = diaryState();
    // 아침에 가끔 — 너무 자주 말고(평균 3~4일에 한 번), 특별한 일이 있던 날은 더 잘
    const special = wrote && /선물|데이트|안았|생일|손을|사랑/.test(wrote.text);
    if (wrote && S.day - (st.last || 0) >= 2 && Math.random() < (special ? 0.55 : 0.28)) { st.last = S.day; setTimeout(() => { if (!G.busy && !G.sheet && !G.screen) diaryPeekPopup(wrote); else st.pending = wrote.day; }, 2600); }
  } catch (e) { console.error(e); }
};
const PEEK_INTRO = {
  low: ['📓 파출소 앞 벤치에 낡은 수첩이 떨어져 있다. 「개인 기록」… 한 장만 보고 돌려 드려야지.', '📓 순찰 가방에서 수첩 한 권이 삐져나와 있다. 바람에 한 장이 넘어갔다.'],
  mid: ['📓 형사님이 깜빡 두고 간 수첩이 펼쳐져 있다. …내 이름이 보인 것 같은데?', '📓 바람에 날아온 종이 한 장. 형사님 글씨다.'],
  high: ['📓 형사님 일기장이 머리맡에 놓여 있다. 포스트잇에 「읽어도 돼」라고 적혀 있다.', '📓 「오늘 거 읽어 볼래?」 형사님이 쑥스럽게 일기장을 내밀었다.'],
};
function diaryPeekPopup(e) {
  const band = detBand() === 'wed' ? 'high' : detBand();
  e.read = true; diaryState().seen++;
  openPanel('📓 형사님의 일기', `<p class="psub">${_pk(PEEK_INTRO[band])}</p><div class="diaryPage det"><div class="dDate">${dateLabel(e.day)}</div>${esc(e.text).replace(/\n/g, '<br>')}</div><p class="psub">${band === 'high' ? '메뉴 → 추억 → 일기장에서 언제든 다시 읽을 수 있어요.' : '…몰래 본 건 비밀로 하자. (일기장에 기록됐어요)'}</p>`);
  memRecent('peek', '형사님 일기를 몰래 읽었다');
}
const _dayStartDiary = dayStartMessages;
dayStartMessages = function () { _dayStartDiary(); const st = diaryState(); if (st.pending) { const e = st.det.find(x => x.day === st.pending); st.pending = 0; if (e) setTimeout(() => { if (!G.busy && !G.sheet && !G.screen) diaryPeekPopup(e); }, 5000); } };

/* ---------------- 일기장 메뉴 ---------------- */
function diaryMenu(tab = 'me') {
  const st = diaryState(), open = S.rel.stage >= 5;
  const list = tab === 'me' ? st.me : st.det.filter(e => open || e.read);
  const tabs = `<div class="dTabs"><button class="dTab ${tab === 'me' ? 'on' : ''}" data-t="me">📒 내 일기</button><button class="dTab ${tab === 'det' ? 'on' : ''}" data-t="det">📓 ${himCall()} 일기</button></div>`;
  const body = list.length ? list.slice(0, 40).map(e => `<div class="diaryPage ${tab}"><div class="dDate">${dateLabel(e.day)}</div>${esc(e.text).replace(/\n/g, '<br>')}</div>`).join('')
    : `<p class="psub">${tab === 'me' ? '잠들 때마다 그날 일기가 써져요.' : S.rel.flags.met ? (open ? '아직 쓴 일기가 없어요.' : '형사님 일기는… 아직 몰래 본 페이지가 없어요. 가끔 아침에 기회가 와요.') : '아직 형사님을 만나지 못했어요.'}</p>`;
  const note = tab === 'det' && !open && S.rel.flags.met ? `<p class="psub">몰래 본 페이지 ${list.length}장 · 연인이 되면 일기장을 통째로 보여 줘요</p>` : '';
  openPanel('📔 일기장', tabs + note + body, (root) => { root.querySelectorAll('.dTab').forEach(b => b.onclick = () => { Sound.sfx('tap'); diaryMenu(b.dataset.t); }); });
}
/* 메뉴 → 추억 에 「일기장」 */
const _openSheetDiary = openSheet;
openSheet = function (o) {
  if (o && o.title === '📔 추억' && !o.items.find(i => i.label === '일기장')) o = Object.assign({}, o, { items: [{ icon: '📓', label: '일기장', onClick: () => diaryMenu() }, ...o.items] });
  if (o && o.title === '💗 관계' && typeof bdayMenu === 'function' && !o.items.find(i => i.label === '생일')) o = Object.assign({}, o, { items: [...o.items, { icon: '🎂', label: '생일', onClick: bdayMenu }] });
  return _openSheetDiary(o);
};
const _ensureV4Diary = ensureV4;
ensureV4 = function (s) { _ensureV4Diary(s); if (!s.diary) s.diary = { me: [], det: [], seen: 0, last: 0 }; return s; };
(() => { const st = document.createElement('style'); st.textContent = `.dTabs{display:flex;gap:6px;margin:0 0 8px}.dTab{flex:1;padding:8px;border-radius:10px;border:1px solid #d8cdb8;background:#f7f1e4;font-weight:700}.dTab.on{background:#f3c46b;border-color:#d9a640}
.diaryPage{background:repeating-linear-gradient(#fffdf6 0 23px,#e9e1cf 23px 24px);border-radius:10px;padding:10px 12px 12px;margin:0 0 10px;line-height:24px;font-size:14px;color:#4a3d2c;box-shadow:0 1px 3px #0002}.diaryPage.det{background:repeating-linear-gradient(#f4f7ff 0 23px,#d6deef 23px 24px);color:#2c3a55;font-family:'Nanum Pen Script',cursive,inherit;font-size:15px}.dDate{font-weight:800;font-size:12px;opacity:.7;line-height:18px;margin-bottom:2px}`; document.head.appendChild(st); })();
