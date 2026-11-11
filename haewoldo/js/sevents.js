/* =====================================================================
   특별한 날씨 · 계절 이벤트 — 정말 가끔만
   · 조건(계절 · 전날 날씨 · 오늘 날씨 · 날짜)이 맞는 날, 확률로만 열림
   · 한 번 열리면 최소 6일은 다음 이벤트 없음 · 같은 이벤트는 1년(120일)에 한 번
   · 아침에 「오늘 ○○ 쪽에 무슨 일이 있을 것 같아요」 힌트 → 그 시간 그 장소에 가면 장면
   · 형사님을 만난 뒤라면 형사님도 와서 단계별로 다른 말을 함 · 앨범에 남음
   ===================================================================== */
const SEV_GAP = 6;
const SEVENTS = {
  rainbow: { icon: '🌈', name: '비 갠 뒤 쌍무지개', at: 'observatory', from: 14, to: 17.5, p: 0.5,
    ok: (c, w, pw) => pw === 'rain' && w === 'sunny' && c.season !== 'winter',
    hint: '비가 그쳤어요. 오후에 언덕 전망대에서 바다 쪽을 보면 뭔가 보일지도…',
    narr: ['🌈 언덕 위에서 바다를 내려다보는데— 무지개가 떴다. 아니, 두 개다! 쌍무지개.', '젖은 풀 냄새와 반짝이는 바다 위로 일곱 빛깔이 겹겹이 걸려 있다.'],
    det: { low: '쌍무지개… 처음 봐요. 사진 찍어 둘까요? 같이 찍어도… 괜찮으면요.', mid: '쌍무지개 보면 소원 이뤄진대. 나 방금 빌었어. 뭔지는 비밀.', high: '이런 거 같이 보려고 내가 이 섬에 왔나 봐. …소원 빌었어? 난 너랑 또 보는 거.' } },
  firstSnow: { icon: '❄️', name: '올해 첫눈', at: 'beach', from: 8, to: 21, p: 1, outdoor: true,
    ok: (c, w) => c.season === 'winter' && w === 'snow',
    hint: '창밖이 하얘요! 올해 첫눈이에요. 바닷가에 나가 볼까요?',
    narr: ['❄️ 해변에 눈이 내린다. 파도가 눈송이를 삼키고, 모래 위엔 발자국이 하나도 없다.', '손바닥을 펴자 눈송이가 내려앉았다가 금세 녹았다.'],
    det: { low: '첫눈이네요. 섬에서 맞는 첫눈은 처음이에요. …첫눈 오는 날 같이 있는 사람이, 음, 아니에요.', mid: '첫눈 오면 만나자고 할 걸 그랬다. …근데 벌써 만났네. 운 좋다.', high: '첫눈 오는 날 같이 있으면 평생 같이 있는대. 이미 그럴 생각이었지만.' } },
  cleanup: { icon: '🧹', name: '태풍 지난 뒤 해변 청소', at: 'beach', from: 9, to: 15, p: 0.8,
    ok: (c, w, pw) => pw === 'storm' && w !== 'storm',
    hint: '태풍이 지나갔어요. 오전에 마을 사람들이 해변 청소를 한대요!',
    narr: ['🧹 해변에 마을 사람들이 모여 있다. 태풍이 쓸어 온 나뭇가지와 쓰레기가 가득하다.', '다 같이 줍다 보니 모래 속에서 반짝이는 무언가가— 예쁜 유리 조각이다. 파도에 닳아 동글동글하다.'],
    det: { low: '도와주셔서 고마워요. 마을 사람들이 다들 좋아하시네요. …저도요.', mid: '같이 하니까 금방 끝났다. 그 유리 조각, 나 줄래? 파출소 책상에 둘게.', high: '땀 흘리는 것도 예쁘다. …아, 이건 진심이야. 수건 써.' },
    reward: () => { S.inv.pebble = (S.inv.pebble || 0) + 1; S.rep = (S.rep || 0) + 3; return '바다 유리 조약돌 · 마을 평판 +3'; } },
  meteor: { icon: '🌠', name: '유성우가 쏟아지는 밤', at: 'observatory', from: 21, to: 23.5, p: 0.45, fx: 'meteors',
    ok: (c, w) => (c.season === 'summer' || c.season === 'autumn') && w === 'sunny',
    hint: '오늘 밤 유성우가 온대요. 밤 9시 넘어서 언덕 전망대가 명당이래요.',
    narr: ['🌠 별이 쏟아진다. 하나, 둘— 셀 수 없을 만큼 긴 꼬리를 그리며 떨어진다.', '섬에 불빛이 적어서 하늘이 유난히 까맣고, 그래서 별이 더 밝다.'],
    det: { low: '와… 소원 빌어야 하는데 너무 많아서 뭘 빌지 모르겠어요.', mid: '방금 거 봤어? 엄청 길었다. 나 소원 세 개 빌었어. 셋 다 같은 거.', high: '별 보러 와서 계속 너만 봤다. 별보다 네가 더 반짝여서. …오글거려? 진심인데.' } },
  fireflies: { icon: '✨', name: '반딧불이 숲', at: 'forest', from: 20, to: 22.5, p: 0.5, fx: 'fireflies',
    ok: (c, w) => c.season === 'summer' && w !== 'rain' && w !== 'storm',
    hint: '여름밤, 숲 쪽에서 작은 불빛이 떠다닌다는 소문이 있어요. 저녁 8시 이후에…',
    narr: ['✨ 숲길에 들어서자 작은 불빛들이 하나둘 떠오른다. 반딧불이다.', '깜빡, 깜빡— 숨을 쉬듯 켜졌다 꺼진다. 숲 전체가 천천히 숨 쉬는 것 같다.'],
    det: { low: '반딧불이네요. 어릴 때 이후로 처음 봐요. …조용히 해야 안 놀라겠죠.', mid: '(속삭이며) 손 내밀어 봐. 가만히— 앉았다! 너한테 앉았어.', high: '(손을 꼭 잡고 속삭인다) 이 순간 그대로 멈췄으면 좋겠다.' } },
  fullMoon: { icon: '🌕', name: '바다 위 보름달 길', at: 'pierEnd', from: 20, to: 23.5, p: 0.6,
    ok: (c, w) => c.dom === 5 && (c.season === 'autumn' || c.month === 8) && w === 'sunny',
    hint: '오늘은 보름달이 가장 큰 날이래요. 밤에 부두 끝에 가 보세요.',
    narr: ['🌕 커다란 보름달이 떴다. 달빛이 바다 위로 길게 이어져 꼭 걸어갈 수 있는 길 같다.', '잔잔한 파도가 달빛 길을 조금씩 흔든다.'],
    det: { low: '달빛이 길처럼 보이네요. 저 끝에 뭐가 있을까요.', mid: '달 보면서 무슨 생각해? …나는 지금 옆에 있는 사람 생각.', high: '저 달빛 길 끝까지 같이 걸어갈래? …평생 걸리겠지만.' } },
  fog: { icon: '🌫️', name: '안개 낀 등대의 아침', at: 'lighthouse', from: 6.5, to: 9.5, p: 0.35,
    ok: (c, w) => (c.season === 'spring' || c.season === 'autumn') && w === 'cloudy',
    hint: '새벽부터 안개가 자욱해요. 아침 일찍 등대에 가면 특별한 소리를 들을 수 있대요.',
    narr: ['🌫️ 등대 주변이 온통 하얀 안개다. 한 발 앞도 잘 안 보인다.', '부우웅— 안개 속에서 등대 무적(霧笛) 소리가 길게 울린다. 배들에게 「여기 섬이 있어」라고 알려 주는 소리.'],
    det: { low: '안개가 짙네요. 제 옷소매 잡고 걸으세요. 길 잃으면 큰일이에요.', mid: '앞이 안 보여도 괜찮아. 내가 옆에 있잖아. …손 잡을래?', high: '안개 속에서도 너는 바로 찾겠다. 무적 소리처럼, 나도 계속 여기 있다고 알려 줄게.' } },
  sunrise: { icon: '🌅', name: '새해 첫 해돋이', at: 'observatory', from: 6, to: 8.5, p: 1,
    ok: (c, w) => c.month === 1 && c.dom === 1 && w !== 'storm',
    hint: '새해 첫날이에요! 아침 일찍 언덕 전망대에서 해돋이를 볼 수 있어요.',
    narr: ['🌅 수평선이 붉게 물들더니, 해가 바다를 밀어 올리듯 천천히 솟아오른다.', '마을 사람들이 「와—」 하고 박수를 친다. 새해다.'],
    det: { low: '새해 복 많이 받으세요. 올해는… 더 자주 뵈었으면 좋겠어요.', mid: '새해 첫 해를 같이 봤네. 올해 첫 소원은 이미 이뤄졌다.', high: '올해도, 내년에도, 그 다음 해에도. 해돋이는 너랑 볼 거야. 약속.' },
    reward: () => { S.inv.ricecake = (S.inv.ricecake || 0) + 1; return '할머니가 나눠 준 떡'; } },
  blossom: { icon: '🌸', name: '꽃비 내리는 정자', at: 'pavilion', from: 10, to: 17, p: 0.4, fx: 'petals',
    ok: (c, w) => c.season === 'spring' && c.dom >= 3 && c.dom <= 7 && w === 'sunny',
    hint: '정자 옆 벚나무가 활짝 폈대요. 바람 부는 낮에 가면 꽃비가 내려요.',
    narr: ['🌸 바람이 불자 꽃잎이 비처럼 쏟아진다. 정자 지붕 위에도, 머리 위에도.', '떨어지는 꽃잎을 잡으면 사랑이 이뤄진다는 말이 있다.'],
    det: { low: '머리에 꽃잎 붙었어요. …아, 제가 떼 드려도 될까요?', mid: '잡았다! 꽃잎. 이거 너 줄게. …의미는 묻지 마.', high: '꽃잎 잡았어. 이제 사랑 이뤄지는 거지? 이미 이뤄졌는데. 그럼 두 배로.' } },
  dolphins: { icon: '🐬', name: '돌고래 떼가 지나간 날', at: 'rocks', from: 10, to: 16, p: 0.3,
    ok: (c, w) => (c.season === 'summer' || c.season === 'spring') && w === 'sunny',
    hint: '어부 아저씨가 그러는데, 오늘 갯바위 앞바다에 돌고래가 지나갈지도 모른대요!',
    narr: ['🐬 갯바위 앞바다에서 물보라가 일었다. 돌고래다! 열 마리는 넘어 보인다.', '반짝이는 등지느러미가 파도를 넘으며 수평선 쪽으로 멀어져 간다.'],
    det: { low: '돌고래! 진짜 돌고래예요! …죄송해요, 너무 신나서 소리 질렀네요.', mid: '봤어?! 방금 점프했어! 하하, 나 지금 애 같지?', high: '돌고래도 짝지어 다니네. 우리처럼. …아, 오늘 나 좀 감성적이다.' } },
  glow: { icon: '💙', name: '파랗게 빛나는 밤바다', at: 'beach', from: 21, to: 23.5, p: 0.3,
    ok: (c, w) => c.season === 'summer' && w === 'sunny',
    hint: '여름밤, 파도가 파랗게 빛나는 날이 있대요. 밤 9시 넘어 해변에 가 보세요.',
    narr: ['💙 밀려오는 파도 끝이 파랗게 빛난다. 야광 플랑크톤이다.', '발을 담그자 발 주변으로 파란 불빛이 번진다. 별이 바다에 내려온 것 같다.'],
    det: { low: '이거 꿈 아니죠? 바다가 빛나요.', mid: '같이 발 담가 볼래? 차가워도 이건 해 봐야 돼.', high: '(바지를 걷어 올리고 손을 내민다) 별 위를 걷자. 너랑만.' } },
};
function sevState() { if (!S.sev) S.sev = { done: {}, last: -99, prevW: null, today: null }; return S.sev; }
function sevRoll() {
  const st = sevState(), c = calendar(S.day), w = S.weather, pw = st.prevW;
  st.today = null;
  const fixed = Object.entries(SEVENTS).filter(([id, E]) => E.p >= 1 && E.ok(c, w, pw) && !(st.done[id] && S.day - st.done[id] < 100));
  let pick1 = fixed[0];
  if (!pick1 && S.day - st.last >= SEV_GAP && S.day > 3) {
    const cand = Object.entries(SEVENTS).filter(([id, E]) => E.p < 1 && E.ok(c, w, pw) && !(st.done[id] && S.day - st.done[id] < 100));
    if (cand.length && Math.random() < 0.55) { const [id, E] = pick(cand); if (Math.random() < E.p) pick1 = [id, E]; }
  }
  if (pick1) { st.today = { id: pick1[0], day: S.day, seen: false }; st.last = S.day; }
  st.prevW = w;
}
function sevHint() {
  const st = sevState(); if (!st.today || st.today.day !== S.day || st.today.seen) return;
  const E = SEVENTS[st.today.id];
  setTimeout(() => toast(`${E.icon} ${E.hint}`), 3800);
}
const _dayStartSev = dayStartMessages;
dayStartMessages = function () { _dayStartSev(); try { sevRoll(); sevHint(); } catch (e) { console.error(e); } };

function sevNear(E) {
  const P = G.player; if (P.map !== 'island') return false;
  if (E.outdoor) return true;
  const p = P_(E.at); return Math.hypot(P.x - p[0], P.y - p[1]) < 6;
}
function sevTick() {
  if (!S || !G.started || G.busy || G.dialog || G.sheet || G.screen) return;
  const st = sevState(), T = st.today; if (!T || T.seen || T.day !== S.day) return;
  const E = SEVENTS[T.id], h = S.min / 60;
  if (h < E.from || h > E.to) return;
  if (sevNear(E)) runEvent(() => sevScene(T.id));
}
async function sevScene(id) {
  const st = sevState(), E = SEVENTS[id], P = G.player, d = G.det;
  st.today.seen = true; st.done[id] = S.day;
  P.stop();
  const withDet = S.rel.flags.met && S.rel.stage >= 2;
  if (withDet && !(d.visible && d.map === P.map && dist(d, P) < 6)) { scriptDet(); d.map = P.map; [d.x, d.y] = nearestWalkable(P.x + 1.2, P.y + 0.4, MAPS[P.map]); d.visible = true; d.stop(); d.pose = 'stand'; }
  G.camFocus = { x: P.x, y: P.y };
  let fxT = 0; const fxOn = E.fx; const fxLoop = fxOn ? setInterval(() => { if (fxT++ > 80) return; if (fxOn === 'fireflies') { if (G.fx.filter(f => f.kind === 'firefly').length < 30) G.fx.push({ kind: 'firefly', wx: P.x + rand(-4, 4), wy: P.y + rand(-4, 4), ph: rand(0, 6), t: 9, life: 9 }); } else spawnFx(fxOn); }, 300) : 0;
  for (const n of E.narr) await say('narr', '', n);
  if (withDet) {
    d.lookAt(P); P.lookAt(d);
    const b = S.rel.stage >= 5 ? 'high' : S.rel.stage >= 3 ? 'mid' : 'low';
    if (!S.comp) await say('narr', '', '어느새 형사님이 옆에 와 서 있었다.');
    await say('det', b === 'high' ? 'blush' : b === 'mid' ? 'smile' : 'surprise', E.det[b]);
    const c = await choose(b === 'low' ? ['같이 보길 잘했어요', '(조용히 고개를 끄덕인다)'] : ['나도 같은 생각 했어', '(살짝 기댄다)']);
    if (c === 1 && b !== 'low') { burst(d, 'heart', 6); await say('det', 'blush', '…이대로 조금만 더 있자.'); }
    burst(d, 'heart', 4); addAff(b === 'low' ? 4 : 6, { event: true });
  } else { await say('narr', '', '…혼자 보기 아까운 풍경이다. 누군가와 함께였다면.'); }
  let rw = ''; if (E.reward) rw = E.reward();
  if (rw) await say('narr', '', `🎁 ${rw}`);
  await addAlbum(E.name, 'love');
  memRecent('sevent', `${josa(E.name, '을', '를')} ${withDet ? '함께 ' : ''}봤다`);
  if (fxLoop) setTimeout(() => clearInterval(fxLoop), 6000);
  G.camFocus = null; closeDialog();
  if (withDet && !S.comp) { d.state = 'sched'; d.task = null; }
}
let _sevT = 0;
const _loopSev = loop;
loop = function (ts) { if (G.started && S && !G.dev) { _sevT += 1 / 60; if (_sevT > 1) { _sevT = 0; try { sevTick(); } catch (e) { console.error(e); } } } _loopSev(ts); };
const _ensureV4Sev = ensureV4;
ensureV4 = function (s) { _ensureV4Sev(s); if (!s.sev) s.sev = { done: {}, last: -99, prevW: null, today: null }; return s; };
