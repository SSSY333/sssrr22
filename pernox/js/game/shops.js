// 온천 · 스파 탈의실 (가운으로 갈아입고 들어가서, 탈의실에서 다시 갈아입기) · 미용실 · 상점가 점원
'use strict';
PX.Bath = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const withCap = () => PX.Act.withCap();
  const lov = () => St.S.rel.cap.stage >= 4;
  const toast = (t) => PX.UI.toast(t);
  async function lines(ls) { const g = G(); g.modal++; try { await PX.Dlg.runLines(ls, { reply: true }); } finally { PX.Dlg.close(); g.modal--; } }
  const pick = (pre, love) => PX.Dlg.capPick(lov() && love ? love : pre);
  const BATH_MAPS = ['onsen', 'spa'];
  const refresh = () => { G().player.app = PX.S.playerApp(St.S.player, St.season()); };
  function capRobe(on, col) {
    const g = G();
    if (on) { g.cap.app = Object.assign({}, PX.NPC_BY_ID.cap.look, { top: '#f4f1ea', bottom: '#f4f1ea', robe: col || '#4f6a8a', jacket: null, vest: null, coat: null, sleeve: 'short', badge: null, tag: 0, hat: null, shoe: '#e6d6c8' }); g.capRobe = true; }
    else if (g.capRobe) { g.capRobe = false; g.capOutfit(); }
  }
  const booth = () => PX.W.maps[G().mapId].objs.find(o => o.fid === 'changebooth');
  async function goBooth() {
    const o = booth(); if (!o) return;
    const g = G(), m = PX.W.maps[g.mapId], a = PX.W.accessTile(m, o);
    g.fade(); await U.sleep(250);
    if (!a) return;
    g.player.leaveSeat(); g.player.stop(); g.player.x = a.x + 0.5; g.player.y = a.y + 0.5; g.player.dir = 2;
    if (withCap()) { if (g.cap.leaveSeat) g.cap.leaveSeat(); const t = PX.Path.nearestWalkable(m, a.x + 1, a.y, 3); if (t) { g.cap.x = t[0] + 0.5; g.cap.y = t[1] + 0.5; } }
  }

  // ---------- 탈의실 ----------
  const IN = {
    solo: [['N:커튼을 치고 옷을 벗어 바구니에 개어 넣는다. 보송한 온천 가운을 걸치고 허리끈을 묶는다.', 'N:머리를 질끈 묶고 나오니 발바닥에 닿는 타일이 따뜻하다.'], ['N:탈의실 사물함에 옷을 넣고 열쇠 고리를 손목에 건다.', 'N:가운 자락에서 은은한 광물 향이 난다. 벌써 몸이 풀리는 것 같다.']],
    pre: [['N:두 칸짜리 탈의실. 대위가 옆 칸 커튼을 친다.', 'N:커튼 너머로 한참 동안 허리끈과 씨름하는 소리가 난다.', 'C;:…이 가운, 사이즈가 하나밖에 없대.', 'N:나와 보니 대위의 가운 소매가 팔꿈치에 걸려 있다.', 'C:웃지 마. 작전복보다 어렵다, 이거.'], ['N:각자 탈의실 칸으로 들어간다. 옆 칸에서 단추 푸는 소리가 작게 들린다.', 'C:다 갈아입었어? …나는 다 했어. 근데 이거 원래 이렇게 짧아?', 'N:나와 보니 대위 가운이 무릎 위로 한참 올라와 있다.']],
    love: [['N:대위가 옆 칸으로 들어가다 멈춘다.', 'C*:…같은 칸 쓰면 안 되나.', 'P:안 돼. 여기 공공장소야.', 'C^:알아. 물어만 본 거야.', 'N:나와 보니 대위가 허리끈을 대충 묶고 서 있다. 탕에 들어가지도 않았는데 귀가 빨갛다.', 'C~:…가운 잘 어울린다. 너 말이야.'], ['N:커튼 너머에서 대위가 낮게 부른다.', 'C:허리끈 어떻게 묶어? 리본? 매듭?', 'P:나와 봐. 묶어 줄게.', 'N:대위 허리에 끈을 둘러 리본으로 묶어 준다. 대위가 숨을 참는다.', 'C*:…이러니까 선물 포장된 것 같다.']],
  };
  const OUT = {
    solo: [['N:탈의실에서 젖은 머리를 수건으로 말리고, 개어 둔 옷으로 갈아입는다.', 'N:몸이 노곤하다. 피부에서 은은한 광물 냄새가 난다.'], ['N:가운을 반납함에 넣고 원래 옷을 입는다. 거울 속 볼이 발그레하다.']],
    pre: [['N:각자 탈의실에서 옷을 갈아입고 나온다.', 'C:머리 다 말렸어? 감기 걸린다.', 'N:대위는 머리에서 아직 물이 뚝뚝 떨어진다.'], ['N:옷을 갈아입고 나오니 대위가 벌써 나와 기다리고 있다. 원래 옷이 훨씬 편해 보인다.', 'C:역시 이게 낫다. 가운은 바람이 숭숭 들어와.']],
    love: [['N:옷을 갈아입고 나오니 대위가 수건을 들고 기다리고 있다.', 'C*:이리 와. 머리 덜 말랐어.', 'N:큰 손이 수건 너머로 머리를 꾹꾹 눌러 말려 준다.', 'C~:온천 냄새 난다. 좋다.'], ['N:옷을 다 입고 나오자 대위가 셔츠 단추를 하나 잘못 끼운 채 서 있다.', 'P:단추.', 'C;:…아.', 'N:단추를 다시 끼워 주자 대위가 고개를 숙여 이마를 살짝 맞댄다.', 'C*:고마워. 오늘 너한테 다 맡기고 싶다.']],
  };
  async function changeIn() {
    const S = St.S, wc = withCap();
    G().fade(); await U.sleep(200);
    S.player.bath = true; refresh(); if (wc) capRobe(true);
    St.advance(5);
    await lines(wc ? pick(IN.pre, IN.love) : U.pickFresh('bathIn', IN.solo));
    toast('🧺 온천 가운으로 갈아입었다');
  }
  async function changeOut() {
    const S = St.S, wc = withCap();
    G().fade(); await U.sleep(200);
    S.player.bath = false; refresh(); capRobe(false);
    St.advance(10);
    await lines(wc ? pick(OUT.pre, OUT.love) : U.pickFresh('bathOut', OUT.solo));
    toast('👕 원래 옷으로 갈아입었다');
  }
  async function changing() {
    const g = G();
    if (g.mapId === 'boutique') { PX.UI.shop('boutique'); return; } // 부티크 피팅룸 = 입어 보고 고르기
    if (!BATH_MAPS.includes(g.mapId)) return;
    g.modal++;
    try { if (St.S.player.bath) await changeOut(); else await changeIn(); } finally { g.modal--; }
  }
  // 탕에 들어가기 전: 가운으로 안 갈아입었으면 탈의실부터
  async function ensure() {
    if (St.S.player.bath) return true;
    if (!booth()) return true;
    const ok = await PX.UI.ask('♨️ 온천', '탕에는 탈의실에서 온천 가운으로 갈아입고 들어가요.', '탈의실 가기', '그만두기');
    if (!ok) return false;
    const g = G(); g.modal++;
    try { await goBooth(); await changeIn(); } finally { g.modal--; }
    return true;
  }
  // 탕에서 나온 뒤
  async function after() {
    if (!St.S.player.bath || !booth()) return;
    const it = await PX.UI.menu('♨️ 탕에서 나왔다', [{ t: '🚪 탈의실에서 옷 갈아입기', k: 'out' }, { t: '🧺 가운 입은 채로 좀 더 쉬기', sub: '나중에 탈의실에서 갈아입어요', k: 'stay' }]);
    if (!it || it.k !== 'out') return;
    const g = G(); g.modal++;
    try { await goBooth(); await changeOut(); } finally { g.modal--; }
  }
  // 온천을 벗어나면 (이동 · 잠 등) 탈의실에서 갈아입고 나온 걸로
  function onMap(id) {
    const S = St.S;
    const inn = (m) => !!(PX.MAPS[m] && (PX.MAPS[m].innRoom || PX.MAPS[m].innBath)); // 은밀숙소 객실·욕실 안에선 가운 그대로
    if (S && S.player.bath && !BATH_MAPS.includes(id) && !inn(id)) { const wasInn = inn(G().prevMap); S.player.bath = false; refresh(); capRobe(false); setTimeout(() => toast(wasInn ? '👕 옷을 갈아입고 객실을 나왔다' : '👕 탈의실에 들러 옷을 갈아입고 나왔다'), 400); }
  }

  // ---------- 미용실 ----------
  const STY = [['N:미용사가 어깨에 가운을 둘러 주고 거울 속 얼굴을 찬찬히 본다.', 'N:"얼굴선이 예뻐서 뭐든 어울리겠어요." 가위 소리가 경쾌하게 이어진다.'], ['N:따뜻한 물로 머리를 감겨 준다. 손끝이 두피를 꾹꾹 눌러 줘서 깜빡 졸 뻔한다.', 'N:"다 됐어요. 거울 보세요." 거울 속에 낯설고 반가운 내가 있다.'], ['N:미용사가 머리카락을 몇 갈래로 나눠 집게로 고정한다.', 'N:"돔 습도가 낮아서 이 머리는 오래 가요." 드라이기 바람이 따뜻하다.']];
  const CAP_WAIT = [['C:나 저기 앉아서 기다릴게. 천천히 해.'], ['C;:…여기 의자가 작다. 아니야, 괜찮아. 기다릴게.']];
  const CAP_SEE = {
    pre: [['C!:…어. 머리 했네.', 'C:잘 어울린다. 처음엔 누군지 몰랐어. 진짜로.'], ['C:기다리는 동안 잡지 세 권 읽었어. 다 머리 얘기더라.', 'C^:…근데 잡지보다 네가 낫다.'], ['C:바뀌었네. 좋다.', 'C*:…좋다는 말밖에 생각이 안 난다.']],
    love: [['C!:…', 'C*:잠깐. 한 바퀴만 돌아 봐.', 'C~:…또 반했다. 오늘만 두 번째야.'], ['N:대위가 손을 뻗어 새 머리 끝을 조심스럽게 만져 본다.', 'C:부드럽다. 향도 다르네.', 'C^:나 이제 너 볼 때마다 머리부터 볼 것 같아.'], ['C*:누가 내 애인을 이렇게 예쁘게 해 놨어.', 'C^:미용사님한테 팁 드리고 올게. 진심이야.']],
  };
  async function salon() {
    const S = St.S, P = S.player, F = PX.FASHION.salon, g = G();
    const what = await PX.UI.menu('✂️ 은하 헤어', [{ t: '✂️ 머리 모양 바꾸기', sub: `₢${F.cut} · 미리 보고 골라요`, k: 'cut' }, { t: '🎨 염색하기', sub: `₢${F.color}`, k: 'color' }, { t: '💇 커트 + 염색', sub: `₢${F.cut + F.color}`, k: 'both' }]);
    if (!what) return;
    let hair = P.hair, color = P.hairColor;
    if (what.k !== 'color') {
      const it = await PX.UI.pickCards('✂️ 머리 모양', Object.entries(PX.S.HAIRS).map(([k, n]) => ({ t: n, k, on: k === P.hair, sub: k === P.hair ? '지금 머리' : null, img: PX.UI.lookThumb({ hair: k, bath: false }) })), '내 얼굴에 직접 해 본 모습이에요.');
      if (!it) return; hair = it.k;
    }
    if (what.k !== 'cut') {
      const it = await PX.UI.pickCards('🎨 머리 색', Object.keys(PX.S.HAIRC).map(k => ({ t: k, k, on: k === P.hairColor, sub: k === P.hairColor ? '지금 색' : null, img: PX.UI.lookThumb({ hair, hairColor: k, bath: false }) })));
      if (!it) return; color = it.k;
    }
    if (hair === P.hair && color === P.hairColor) { toast('지금 머리 그대로예요'); return; }
    const cost = (hair !== P.hair ? F.cut : 0) + (color !== P.hairColor ? F.color : 0);
    if (!St.spend(cost)) { toast(`💸 ₢${cost}이 필요해요`); return; }
    const wc = withCap();
    if (wc) await lines(U.pickFresh('salonWait', CAP_WAIT));
    const ch = PX.W.maps[g.mapId].objs.find(o => o.fid === 'salonchair' && o.seats && o.seats.some(s => !s.by));
    if (ch) { const s = ch.seats.find(s => !s.by); g.player.sitOn(s); }
    await lines(U.pickFresh('salonSty', STY));
    g.fade(); St.advance(cost >= F.cut + F.color ? 120 : hair !== P.hair ? 60 : 90);
    P.hair = hair; P.hairColor = color; refresh();
    PX.Audio && PX.Audio.coin && PX.Audio.coin();
    toast(`💇 ${PX.S.HAIRS[hair]} · ${color}`);
    if (wc) { g.cap.setDirTo(g.player.x, g.player.y); await lines(pick(CAP_SEE.pre, CAP_SEE.love)); St.addAff(2); }
    else S.hairNew = S.day; // 따로 했으면 다음에 만났을 때 // 다음에 만나면 알아챈다
    if (!S.done.firstSalon) { S.done.firstSalon = 1; g.memory('새 머리', `은하 헤어에서 ${PX.S.HAIRS[hair]}로 바꿨다.`, true); }
  }
  // 따로 머리 하고 나서 처음 만나면
  function noticeHair() {
    const S = St.S, g = G();
    const innM = (m) => !!(PX.MAPS[m] && (PX.MAPS[m].innRoom || PX.MAPS[m].innBath));
    if (g.capRobe && !(withCap() && (BATH_MAPS.includes(g.cap.map) || innM(g.cap.map) && St.S.player.bath))) capRobe(false); // 대위가 온천·은밀숙소를 떠나면 원래 옷
    if (g.queue.length || g.transition) return;
    if (S.hairNew == null || S.day - S.hairNew > 3 || g.modal || g.cap.map !== g.mapId || U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) > 3) return;
    S.hairNew = null;
    g.trigger(async () => { if (g.modal) { S.hairNew = S.day; return; } g.cap.setDirTo(g.player.x, g.player.y); await lines(pick(CAP_SEE.pre, CAP_SEE.love)); });
  }

  // ---------- 점원 ----------
  Object.assign(PX.Ruby.ROLES, {
    furnclerk: { names: ['가구점 사장'], look: { top: '#c9a86a', bottom: '#4a3a2a', hair: 'bun', hairColor: '#6b4430', big: 0 }, talk: ['숙소가 좁아도 괜찮아요. 작은 것부터 하나씩 바꾸면 방이 달라져요.', '캐노피 침대는 신혼부부들이 제일 많이 봐요. 군인 한 분도 한참 서 있다 가셨어요.', '별 무드 조명은 밤에 켜야 진짜예요. 천장에 별이 떠요.'], amb: ['편하게 둘러보세요.', '앉아 보셔도 돼요.', '새 물건 들어왔어요.'], next: () => PX.UI.shop('interior') },
    boutiqueclerk: { names: ['부티크 점원'], look: { top: '#2a2346', bottom: '#2a2346', dress: true, hair: 'halfup', hairColor: '#b89ae0', big: 0 }, talk: ['다 입어 볼 수 있어요. 마음에 드는 거 있으면 말씀하세요.', '은하 드레스는 이번 보급선으로 들어온 거예요. 돔시티에 세 벌뿐이에요.', '같이 오신 분이 계속 이 원피스 앞에 서 있던데요. 아는 분이세요?'], amb: ['신상 들어왔어요~', '거울 앞에 서 보세요.'], next: () => PX.UI.shop('boutique') },
    stylist: { names: ['헤어 디자이너 미로'], look: { top: '#25232b', bottom: '#25232b', hair: 'pixie', hairColor: '#7fd3b8', big: 0 }, talk: ['돔 안은 건조해서 머리가 금방 상해요. 그래도 색은 오래 가요.', '이번 달 유행은 하이 포니테일이에요. 무중력 호텔 가는 분들이 많이 해요.', '아까 덩치 큰 손님이 "그냥 짧게"라고만 하고 가셨어요. 그분은 늘 그래요.'], amb: ['다음 분~', '드라이 들어갑니다.', '가위 소리 좋죠?'], next: () => salon() },
  });
  // 별빛 광장의 사람들
  Object.assign(PX.Ruby.ROLES, {
    audience: { names: ['버스킹 구경하는 사람', '박자 맞추는 학생', '퇴근길 관객', '손뼉 치는 아이'], talk: ['이 버스커 매주 화요일이랑 토요일에 와요. 오늘 운 좋으시네요.', '신청곡 받는대요. 옛 지구 노래도 다 안대요.', '저 무대 원래 행정국 행사용인데 요즘은 다 버스킹해요.', '돔 천장 울림 때문에 여기서 부르면 목소리가 두 배로 커져요.'], amb: ['♪ 따라 부르는 중', '앵콜!', '와아—', '(손뼉)'] },
    noodleboss: { names: ['국수당 사장 할머니'], look: { top: '#f4efe4', bottom: '#5a4a3a', hair: 'lowbun', hairColor: '#c9ccd6', big: 0 }, talk: ['국물은 아침 다섯 시부터 우려. 광물염 한 꼬집이 비법이야.', '덩치 큰 군인 하나가 맨날 곱빼기 시켜. 근데 꼭 반은 옆 사람 그릇에 덜어 주더라.', '바로 옆 냉삼집 문 사장이랑은 삼십 년 친구야. 손님 서로 보내 줘.', '물냉면은 살얼음이 생명이야. 녹기 전에 먹어.'], amb: ['어서 와요!', '국수 나왔어요~', '곱빼기 되지!'], next: () => PX.UI.shop('noodle') },
    picnicker: { names: ['분수대에 앉은 연인', '산책 나온 가족', '도시락 먹는 직장인', '스케치하는 학생'], browse: true, talk: ['분수 물빛이 밤엔 보라색으로 바뀌어요. 그때 다시 와 보세요.', '점심은 여기서 먹어요. 실내는 답답해서요.', '분수에 동전 던지면 소원 이뤄진대요. 저는 벌써 세 개 던졌어요.', '꽃시장에서 산 유리꽃이에요. 햇빛 받으면 무지개가 떠요.'], amb: ['날씨 좋다.', '물소리 좋네.', '한 입만 줘.', '여기 앉자.'] },
  });
  // 대위가 옆에 있을 때 상점가에서 한마디
  return { changing, ensure, after, onMap, salon, noticeHair, changeIn, changeOut, capRobe, refresh };
})();
// 탈의실 · 미용 의자 상호작용
Object.assign(PX.Act.LABEL, { changing: '🚪 탈의실', salon: '💇 미용 의자' });
Object.assign(PX.Ruby.H, { changing: () => PX.Bath.changing(), salon: () => PX.Bath.salon() });
