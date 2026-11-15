// 장소별로 대위와 같이 할 수 있는 것 (대위 메뉴 → "📍 여기서 같이 하기")
// 장소마다 그곳에서만 할 수 있는 행동 · 대사 · 작은 게임 · 선물. 관계 단계에 따라 대사가 달라진다 (연인부터 서로 반말)
'use strict';
PX.Place = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const lov = () => St.S.rel.cap.stage >= 4;
  async function lines(ls) { const g = G(); g.modal++; await PX.Dlg.runLines(ls, { reply: true }); PX.Dlg.close(); g.modal--; }
  // 연인 전/후 대사 묶음 중 아직 안 한 것
  const say = (pre, love) => lines(PX.Dlg.capPick(lov() && love ? love : pre));
  // 하루에 한 번만 호감 · 처음 한 번은 추억
  function reward(id, aff, mem) {
    const S = St.S, k = 'pa_' + id + '_' + S.day;
    if (!S.done[k]) { S.done[k] = 1; St.addAff(aff); }
    if (mem && !S.done['pam_' + id]) { S.done['pam_' + id] = 1; G().memory(mem[0], mem[1], true); }
  }
  const pay = (n) => { if (!St.spend(n)) { PX.UI.toast(`💸 ₢${n}이 필요해요`); return false; } return true; };
  const night = () => { const m = St.S.time.min; return m >= 19 * 60 || m < 4 * 60; };

  const A = {}; // 맵 id → 행동 목록 [{ id, t, sub, s(최소 단계), when(), run }]
  const add = (maps, o) => { for (const m of [].concat(maps)) (A[m] = A[m] || []).push(o); };

  // ===================== 루비웨이 =====================
  add('rubyway', { id: 'rw_walk', t: '🌃 네온 거리 천천히 걷기', sub: '팔짱 끼고 한 바퀴', s: 2, run: async () => {
    await say([['N:네온사인이 바닥 타일에 분홍빛으로 번진다. 대위가 걸음을 늦춘다.', 'C:여긴 혼자 걸으면 이상한 데고, 같이 걸으면 좋은 데야.', 'C*:지금은 좋은 데.']],
      [['N:팔짱 낀 팔이 네온 아래서 붉게 물든다.', 'C*:다들 우리 본다.', 'P:{ob}가 커서 그래.', 'C^:아니. 네가 예뻐서 그래. 확실해.'], ['C:여기 오면 우리도 좀 대담해지는 것 같아.', 'P:{ob}만.', 'C*:응. 나만. 인정.']]);
    if (PX.Mind && PX.Mind.contact() === 'NONE' && St.S.rel.cap.stage >= 3) PX.Mind.setContact('ARM_LINK');
    St.advance(15); reward('rw_walk', 3, ['네온 거리', '루비웨이 네온 아래를 대위와 천천히 걸었다.']); } });
  add('rubyway', { id: 'rw_dance', t: '🎶 버스킹 노래에 맞춰 춤추기', sub: '밤 · 버스커 앞', s: 4, when: night, run: async () => {
    await say(null, [['N:버스커가 느린 곡으로 바꾼다. 대위가 손을 내민다.', 'C;:춤 못 춰. 진짜로.', 'P:그럼 흔들리기만 해.', 'N:둘이 천천히 흔들린다. 지나가던 사람들이 박수를 친다.', 'C~:…이제 그만 봐 줬으면.'], ['C*:한 곡만. 발 밟아도 돼.', 'N:대위가 허리를 가볍게 감싼다. 노래 한 곡이 너무 짧다.', 'C^:한 곡 더 신청할까?']]);
    St.advance(10); reward('rw_dance', 5, ['거리의 춤', '루비웨이 버스커 앞에서 대위와 춤을 췄다. 대위는 진짜로 못 췄다.']); } });
  add('rubyway', { id: 'rw_whisper', t: '🤫 귓속말 놀이', sub: '대위가 뭐라고 했는지 맞히기', s: 3, run: async () => {
    const S = St.S;
    await lines(['N:시끄러운 거리. 대위가 허리를 숙여 귀에 대고 뭔가 속삭인다.', 'C*:뭐라고 했게?']);
    const i = await PX.Dlg.choose([{ t: lov() ? '사랑한다고.' : '배고프다고요?' }, { t: lov() ? '집에 가자고.' : '시끄럽다고요?' }, { t: lov() ? '예쁘다고.' : '잘 안 들렸어요.' }]);
    const ans = U.pick([0, 2]);
    await lines(i === ans ? [lov() ? 'C^:정답. 상으로 한 번 더 말해 줄게. …사랑해.' : 'C^:정답. 너 나 잘 아네.'] : [lov() ? 'C*:땡. 정답은… 다시 귀 대 봐. 이번엔 크게 말할게.' : 'C*:땡. 비밀이다. 다음에 알려 줄게.']);
    reward('rw_whisper', 3); } });

  // ---------- 술집 골목 ----------
  add('pub', { id: 'pb_toast', t: '🍻 건배하기', sub: '₢8 · 한 잔씩', s: 0, run: async () => {
    if (!pay(8)) return;
    await say([['N:잔이 부딪친다. 대위의 잔엔 얼음이 반이다.', 'C:오늘도 무사히. 건배.', 'C*:미지근한 맥주는 범죄야. 그래서 얼음.']],
      [['C^:뭐에 건배할까.', { q: [['우리한테.', 3, ['C*:좋다. 우리한테. 짠.']], ['{ob} 무사 귀환에.', 3, ['C:…그럼 너 기다려 준 것에도. 짠.']]] }], ['N:잔을 부딪치고, 대위가 잔 너머로 한참 쳐다본다.', 'C*:취한 거 아니야. 그냥 보는 거야.']]);
    St.advance(20); reward('pb_toast', 2); } });
  add('pub', { id: 'pb_darts', t: '🎯 다트 대결', sub: '진 사람이 다음 잔', s: 0, run: async () => {
    const sc = await PX.Mini.timing({ title: '🎯 다트', help: '과녁 가운데(초록 구간)에서 던지세요', rounds: 3, speed: 70, btn: '던지기!', bg: '#3a2a20' });
    const win = (typeof sc === 'number' ? sc : 0.5) >= 0.67;
    await say([win ? ['C;:…졌다. 수색팀장이 다트에 졌다. 이건 기록에 남기지 마.', 'C:다음 잔은 내가 살게.'] : ['C*:이겼다. 저격수 출신 아닌 거 다행이지?', 'C^:벌칙은 없어. 그냥 이긴 기분만.']],
      [win ? ['C;:졌네. 소원 하나 들어줄게.', 'P:{ob} 오늘 집까지 업어 줘.', 'C^:…그건 벌칙이 아니라 상인데.'] : ['C*:이겼다. 내 소원은… 다음 주말 비워 두기.', 'C^:이미 알고 있었다는 얼굴이네.']]);
    St.advance(15); reward('pb_darts', 3); } });
  add('pub', { id: 'pb_truth', t: '🃏 진실 게임', sub: '하나씩 솔직하게', s: 3, run: async () => {
    await lines(['C*:하나씩 묻고 솔직하게 대답하기. 거짓말하면 원샷.', 'C:먼저 물어볼게. 나 처음 봤을 때 무서웠어?']);
    const i = await PX.Dlg.choose([{ t: lov() ? '응, 엄청.' : '네, 솔직히요.' }, { t: lov() ? '아니, 웃겼어.' : '아뇨, 좀 웃겼어요.' }, { t: lov() ? '설렜어.' : '…설렜어요.' }]);
    await lines([['C;:…알았어. 표정 연습할게.', 'C*:웃겼다고? 문틀에 박았을 때구나.', 'C!:…', 'C~:원샷 안 해도 되는 대답이다. 내가 마실게. 기분 좋아서.'][i], lov() ? 'C:이제 네 차례. 물어봐. 다 대답할게.' : 'C:네 차례야. 아무거나 물어봐.']);
    St.advance(20); reward('pb_truth', 4); } });

  // ---------- 퍼퓸덴 · 다이스키스 · 실버마스크 · 미드나잇 룸 · 쇼룸 ----------
  add('perfume', { id: 'pf_choose', t: '🧴 서로에게 어울리는 향 골라 주기', s: 1, run: async () => {
    await say([['C:나한테 어울리는 향? 어려운데. 화약 냄새 빼고.', 'N:대위가 시향지를 이것저것 맡더니 하나를 내민다.', 'C*:이거. 향열매에 바닐라. 너 같아. 달고, 오래 남아.']],
      [['C:손목 줘 봐.', 'N:대위가 손목에 향을 살짝 뿌리고, 고개를 숙여 맡는다.', 'C*:…이거 사자. 앞으로 이 냄새 나면 너 생각날 것 같아.', 'P:{ob} 것도 골라 줄게.', 'C^:은사막 밤공기 같은 거. 차가운 거로.']]);
    St.advance(15); reward('pf_choose', 3, ['향 고르기', '퍼퓸덴에서 대위가 나에게 어울리는 향을 골라 줬다.']); } });
  add('dice', { id: 'dc_bet', t: '🎲 소원 걸고 주사위', sub: '이긴 사람 소원 하나', s: 2, run: async () => {
    const me = 1 + Math.floor(Math.random() * 6), cap = 1 + Math.floor(Math.random() * 6);
    await lines([`N:🎲 나 ${me} · 대위 ${cap}`, me > cap ? (lov() ? 'C;:졌다. 소원 말해. 뭐든.' : 'C;:졌네. 소원 하나 말해. 들어줄게.') : me < cap ? (lov() ? 'C*:내가 이겼다. 소원은… 오늘 밤 내 옆자리.' : 'C*:이겼다. 소원은 보류. 아껴 둘게.') : 'C:비겼다. 둘 다 소원 하나씩. 좋은데?']);
    reward('dc_bet', 2); } });
  add('mask', { id: 'mk_strangers', t: '🎭 처음 만난 척하기', sub: '가면 쓰고 서로 모르는 사이', s: 3, run: async () => {
    await say([['C*:처음 뵙겠습니다. 여기 자주 오세요?', 'P:아뇨, 처음이에요.', 'C:그럼 제가 안내해 드려도 될까요? 저 덩치에 비해 친절합니다.', 'C;:…못 하겠다. 웃음 나.']],
      [['C*:처음 뵙겠습니다. 혹시 애인 있으세요?', 'P:있어요. 엄청 큰 사람.', 'C:…그 사람 부럽네요. 근데 제가 더 클걸요.', 'C^:역할극 끝. 나야. 질투했어, 방금.']]);
    reward('mk_strangers', 3); } });
  add('midnight', { id: 'mn_slow', t: '💃 느린 곡에 맞춰 춤', s: 4, run: async () => {
    await say(null, [['N:낮은 조명, 느린 음악. 대위가 이마를 맞대고 흔들린다.', 'C:…춤이라기보다 그냥 안고 있는 거네.', 'P:그게 좋아.', 'C^:응. 나도.'], ['C*:발 밟았지?', 'P:세 번.', 'C:그럼 세 번 업어 줄게. 집에 갈 때.']]);
    St.advance(15); reward('mn_slow', 5, ['미드나잇 룸', '느린 곡에 맞춰 대위와 이마를 맞대고 흔들렸다.']); } });
  add('showroom', { id: 'sr_watch', t: '🎭 쇼 같이 보기', s: 2, run: async () => {
    await say([['N:무대 위로 홀로그램 무용수들이 떠오른다. 대위는 무대보다 내 쪽을 더 본다.', 'C;:…무대 봤어. 진짜야.', 'C*:두 번 봤어. 너 한 번 볼 때.']],
      [['N:객석 불이 꺼지자 대위가 팔걸이 위로 손을 겹친다.', 'C:쇼 끝나도 이 손은 안 놓을 거야.']]);
    St.advance(40); reward('sr_watch', 3); } });

  // ---------- 은밀숙소 객실 (연인 · 노골적 묘사 없음) ----------
  add(['inn_mirror', 'inn_bath', 'inn_water'], { id: 'in_window', t: '🌃 창밖 야경 같이 보기', s: 4, run: async () => {
    await say(null, [['N:창밖으로 루비웨이 네온이 흐른다. 대위가 뒤에서 안는다.', 'C:시끄러운 동네인데 여기서 보니까 조용하다.', 'C^:너 있어서 그런가.'], ['C*:오늘 하루 어땠어?', 'P:마지막이 제일 좋았어.', 'C:…아직 안 끝났어. 하루.']]);
    reward('in_window', 3); } });
  add('inn_bath', { id: 'in_hair', t: '💨 머리 말려 주기', sub: '대위가 말려 준다', s: 4, run: async () => {
    await say(null, [['N:대위가 수건으로 머리를 조심조심 눌러 말린다. 큰 손이 의외로 섬세하다.', 'C:뜨거우면 말해. 드라이기 처음 써 봐.', 'C*:…거짓말이야. 연습했어. 너 해 주려고.']]);
    reward('in_hair', 4); } });

  // ===================== 606부대 =====================
  add('mess', { id: 'ms_swap', t: '🔄 반찬 바꿔 먹기', s: 0, run: async () => {
    await say([['C:너 그 반찬 안 좋아하지? 내 거랑 바꾸자.', 'C^:거래 성립. 조리장님한텐 비밀.'], ['C*:소시지 하나 줄게. 대신 김치 하나.', 'C:…공정한 거래였다.']],
      [['C^:{cv}, 고기 다 너 줄게. 대신 브로콜리 다 나 줘.', 'P:{ob} 브로콜리 싫어하잖아.', 'C*:너 먹는 거 보는 게 더 좋아서.']]);
    reward('ms_swap', 2); } });
  add('mess', { id: 'ms_coffee', t: '☕ 커피 타 주기', sub: '대위는 얼음 가득', s: 0, run: async () => {
    await say([['N:커피에 얼음을 가득 채워 건넨다.', 'C!:…얼음 비율 완벽하다. 어떻게 알았어?', 'C^:이제 커피는 네가 타 줘. 매일.']],
      [['N:얼음 가득한 커피를 건넨다.', 'C^:이 맛이야. 네가 타면 더 맛있어.', 'P:{ob} 똑같은 거야.', 'C*:아니야. 확실히 달라.']]);
    reward('ms_coffee', 2); } });
  add('mess', { id: 'ms_snack', t: '🥡 남은 간식 몰래 챙기기', sub: '야식용', s: 2, when: () => St.S.time.min >= 18 * 60, run: async () => {
    await lines(['N:대위가 남은 주먹밥 두 개를 냅킨에 싸서 주머니에 넣는다.', 'C*:야식. 이따 같이 먹자. 조리장님한테 걸리면 네가 시켰다고 할 거야.']);
    St.addItem('protein'); PX.UI.toast('🍙 야식 챙김 (단백질 바 +1)'); reward('ms_snack', 2); } });
  add('px', { id: 'px_shop', t: '🛒 같이 장보기', sub: '대위가 하나 사 준다', s: 0, run: async () => {
    const pick = U.pick(['iceDessert', 'coffee', 'earthSnack', 'fruitTea']);
    await say([['C:하나 골라. 오늘은 내가 산다.', 'C^:고민하는 얼굴 보는 게 재밌어서 천천히 골라도 돼.']], [['C^:장바구니 이리 줘. 들어 줄게.', 'C*:네 거 하나, 우리 거 하나. 계산은 내가.']]);
    St.addItem(pick); PX.UI.toast(`🎁 ${PX.ITEMS[pick].icon} ${PX.ITEMS[pick].name} 받음`); reward('px_shop', 2); } });
  add('lounge', { id: 'lg_movie', t: '🎬 영화 같이 보기', sub: '90분', s: 0, run: async () => {
    await say([['N:오래된 지구 영화가 흐른다. 대위는 중간에 한 번 졸고, 한 번 운다.', 'C;:…운 거 아니야. 눈에 먼지.', 'C:결말 좋았지? 다음엔 네가 골라.']],
      [['N:영화 중반, 대위가 어깨를 내준다. 결말 즈음엔 둘 다 졸고 있다.', 'C*:…영화 내용 하나도 기억 안 난다.', 'P:나도.', 'C^:그럼 다음에 또 보면 되겠네.']]);
    St.advance(90); reward('lg_movie', 4, ['휴게실 영화', '대위와 휴게실에서 지구 영화를 봤다. 대위는 울었다. 먼지라고 했다.']); } });
  add('lounge', { id: 'lg_board', t: '🎲 보드게임 한 판', s: 0, run: async () => {
    const sc = await PX.Mini.quiz({ title: '🎲 부대 상식 보드게임', help: '대위와 번갈아 문제 맞히기', qs: [
      { q: '대위가 제일 좋아하는 음식은?', a: ['냉삼', '라면', '김치찌개'], c: 0 }, { q: '페르녹스 돔시티의 인공 날씨를 정하는 곳은?', a: ['관리국', '606부대', '보급선'], c: 0 }, { q: '발광초는 언제 빛날까?', a: ['낮', '밤', '비 올 때'], c: 1 }] });
    await lines([(typeof sc === 'number' ? sc : 0.6) >= 0.67 ? 'C^:다 맞혔네. 날 너무 잘 아는 거 아니야?' : 'C*:첫 문제 틀린 건 용서 못 한다. 냉삼이잖아.']);
    St.advance(30); reward('lg_board', 3); } });
  add('gym', { id: 'gm_arm', t: '💪 팔씨름', sub: '이길 수 있을까', s: 0, run: async () => {
    const win = await PX.Mini.tapRace({ title: '💪 팔씨름', help: '연타! 대위는 봐주는 중이다', foe: 5.2, left: '나', right: '대위' });
    await say([win ? ['C*:…졌다. 봐준 거 아니야. 진짜 졌어. 아마.'] : ['C^:힘 좋은데? 박 중사보다 세다. 진짜로.']], [win ? ['C~:…졌어. 근데 손 놓기 싫어서 일부러 오래 버텼어.'] : ['C*:이겼다. 상으로 손 계속 잡고 있을게.']]);
    reward('gm_arm', 3); } });
  add('gym', { id: 'gm_plank', t: '⏱️ 플랭크 버티기 대결', s: 0, run: async () => {
    const sc = await PX.Mini.timing({ title: '⏱️ 플랭크', help: '흔들릴 때(초록 구간) 자세를 다잡으세요', rounds: 4, speed: 55, btn: '버텨!' });
    await lines([(typeof sc === 'number' ? sc : 0.5) >= 0.75 ? 'C!:…나보다 오래 버텼어. 오늘부터 너 교관이다.' : 'C^:잘했어. 처음엔 다 그래. 내일도 하자.']);
    St.advance(10); reward('gm_plank', 2); } });
  add('gym', { id: 'gm_stretch', t: '🤸 스트레칭 서로 도와주기', s: 1, run: async () => {
    await say([['C:등 대. 살살 밀어 줄게.', 'N:대위가 조심스럽게 등을 민다. 생각보다 힘 조절을 잘한다.', 'C^:유연하네. 나는 이거 하면 소리 나.']],
      [['C*:이번엔 네가 밀어 줘. 세게.', 'N:있는 힘껏 밀어도 대위는 꿈쩍도 안 한다.', 'C^:…시원하다. 진짜야. 마음이 시원해.']]);
    reward('gm_stretch', 2); } });
  add('ops', { id: 'op_map', t: '🗺️ 작전 지도 설명 듣기', sub: '근무 아닐 때', s: 0, when: () => !PX.Cap.onDuty(), run: async () => {
    await say([['C:여기가 우리 부대, 여기가 외곽 3구역 능선. 내가 매일 걷는 길.', 'C*:이 점선은… 발광초 군락. 안전해지면 너 데려갈 데.']],
      [['C:여기, 붉은 협곡. 작전 중에 제일 오래 있었던 데야.', 'C^:거기서 매일 밤 네 사진 봤어.']]);
    reward('op_map', 2); } });
  add('hangar', { id: 'hg_drone', t: '🛸 드론 같이 날려 보기', s: 0, run: async () => {
    const sc = await PX.Mini.targets({ title: '🛸 연습 드론 조종', help: '나타나는 표지를 빨리 누르세요', time: 15, goal: 12, color: '#7fd3ef', bg: '#3a4048' });
    await lines([(typeof sc === 'number' ? sc : 0.5) >= 0.6 ? 'C*:조종 실력 좋은데. 수색팀 올래?' : 'C^:깡통 8호 탄생할 뻔했다. 괜찮아, 다들 처음엔 그래.']);
    St.advance(15); reward('hg_drone', 3); } });
  add('comms', { id: 'cm_video', t: '📹 지구에 영상편지 같이 찍기', s: 2, run: async () => {
    await say([['C:나도 나와도 돼? 뒤에 서 있을게.', 'N:영상 끝에 대위가 화면 안으로 고개를 들이민다.', 'C:…안녕하세요. 잘 지내고 있습니다. 걱정 마십시오.']],
      [['C^:이번엔 옆에 서도 되지?', 'N:대위가 정자세로 인사한다. 녹화가 끝나자 한숨을 쉰다.', 'C;:작전 보고보다 떨린다. 너희 부모님이 보시는 거잖아.']]);
    St.advance(15); reward('cm_video', 4, ['영상편지', '지구에 보내는 영상편지에 대위가 함께 나왔다.']); } });
  add('base', { id: 'bs_stars', t: '🌌 깃대 아래서 별 보기', sub: '밤', s: 1, when: night, run: async () => {
    await say([['C:저기 밝은 게 제4행성. 그 옆이 제6행성.', 'C*:별자리 이름은 몰라. 그냥 내가 붙였어. 저건 “냉삼자리”.']],
      [['N:깃대 그림자 아래 나란히 눕는다. 대위의 팔이 베개가 된다.', 'C:여기가 부대에서 별이 제일 잘 보이는 데야.', 'C^:이제 별 볼 때마다 이 밤 생각날 거야.']]);
    St.advance(20); reward('bs_stars', 3); } });
  add('base', { id: 'bs_patrol', t: '🔦 야간 순찰 따라가기', sub: '부대 한 바퀴', s: 0, when: night, run: async () => {
    await say([['C:순찰은 이 길로 한 바퀴. 너는 내 뒤.', 'N:대위가 손전등으로 구석구석을 비춘다. 고양이만 한 사막도마뱀이 도망간다.', 'C*:이게 오늘 가장 위험한 적이었다.']],
      [['C*:순찰 핑계로 데이트하는 거 들키면 중령님한테 혼난다.', 'C^:그러니까 손은 주머니 안에서 잡자.']]);
    St.advance(25); reward('bs_patrol', 2); } });

  // ===================== 돔시티 · 데이트 장소 =====================
  add('plaza', { id: 'pz_coin', t: '🪙 분수대에 동전 던지기', sub: '₢1 · 같이 소원', s: 0, run: async () => {
    if (!pay(1)) return;
    await say([['N:동전 두 개가 물속으로 반짝이며 가라앉는다.', 'C:무슨 소원 빌었어? …말하지 마. 안 이뤄진대.', 'C*:내 건 너랑 상관있어. 그것만 알려 줄게.']],
      [['N:둘이 동시에 동전을 던진다.', 'C^:같은 소원 빌었을 것 같은데.', 'P:뭔데?', 'C*:말하면 안 이뤄진대. 근데 이미 이뤄진 거라 상관없어.']]);
    reward('pz_coin', 2); } });
  add('plaza', { id: 'pz_food', t: '🍢 길거리 음식 나눠 먹기', sub: '₢6', s: 0, run: async () => {
    if (!pay(6)) return;
    await say([['N:꼬치 하나를 사서 나눠 먹는다. 대위가 마지막 한 조각을 양보한다.', 'C:마지막 건 네 거. 원래 그런 거야.']], [['C*:한 입. 아니, 네가 먹여 줘.', 'P:{ob} 손 있잖아.', 'C^:지금은 없어. 방금 없어졌어.']]);
    reward('pz_food', 2); } });
  add('cafe', { id: 'cf_swap', t: '🥤 음료 바꿔 마셔 보기', s: 0, run: async () => {
    await say([['C:네 거 한 입만. 대신 내 거 한 입.', 'N:대위의 커피는 얼음 맛이 반이다.', 'C*:…달다. 너 거는 너처럼 달아.']], [['C^:빨대 같이 쓰자. 간접… 아, 우리 이제 그런 거 따질 사이 아니지.']]);
    reward('cf_swap', 2); } });
  add('cafe', { id: 'cf_people', t: '👀 창밖 사람 구경 놀이', sub: '지나가는 사람 이야기 지어내기', s: 1, run: async () => {
    await lines(['C:저 사람, 분명 첫 데이트야. 꽃 들고 세 번 왔다 갔다 했어.', 'C*:저 커플은 싸웠다 화해한 지 십 분. 남자 귀가 빨개.', { q: [['우리는 어때 보일까요?', 3, ['C^:…누가 봐도 좋아 죽는 사이.']], ['대위님 관찰력 무서워요.', 2, ['C*:직업병이야. 너는 관찰 안 해. 그냥 봐.']]] }]);
    St.advance(20); reward('cf_people', 2); } });
  add('samgyup', { id: 'sg_grill', t: '🥓 대위가 구워 주는 냉삼', sub: '₢20 · 기력 +30', s: 0, run: async () => {
    if (!pay(20)) return;
    await say([['N:대위가 집게를 쥐자 표정이 진지해진다.', 'C:가장자리만 살짝. 지금. 먹어.', 'C^:어때. 이게 대위의 유일한 특기야.']], [['C:제일 잘 구워진 거 너. 두 번째도 너.', 'P:{ob}는?', 'C*:나는 구우면서 이미 먹었어. 몰랐지?']]);
    St.S.energy = Math.min(100, St.S.energy + 30); St.advance(40); reward('sg_grill', 3); } });
  add('samgyup', { id: 'sg_ssam', t: '🥬 쌈 싸 주기', s: 2, run: async () => {
    await say([['N:쌈을 싸서 대위에게 내민다. 대위가 잠깐 굳는다.', 'C!:…나 주는 거야?', 'C~:한입에 다 먹어야지. 남기면 안 되니까.']], [['N:대위가 큼직한 쌈을 싸서 입 앞에 내민다.', 'C*:아~. 크다고? 다 들어가. 해 봐.', 'N:볼이 빵빵해지자 대위가 웃음을 못 참는다.']]);
    reward('sg_ssam', 3); } });
  add('flower', { id: 'fl_pick', t: '💐 꽃 골라 주기', sub: '대위가 사 준다', s: 1, run: async () => {
    await say([['C:하나 골라. 아니, 내가 골라 볼게.', 'N:대위가 한참 고민하다 작은 유리꽃을 집는다.', 'C*:너 닮았어. 반짝이고, 오래 가.']], [['C^:하얀 꽃. 네가 좋아한다고 했던 거. 기억하지?']]);
    St.addItem('glassflower'); PX.UI.toast('🎁 유리꽃 모조 장식 받음'); reward('fl_pick', 3, ['꽃 선물', '꽃시장에서 대위가 오래 고민해서 꽃을 골라 줬다.']); } });
  add('arcade', { id: 'ac_rhythm', t: '🎵 리듬 게임 대결', s: 0, run: async () => {
    const sc = await PX.Mini.timing({ title: '🎵 리듬 게임', help: '박자(초록 구간)에 맞춰 누르세요', rounds: 5, speed: 75, btn: '쿵!', bg: '#2a1f4f' });
    await lines([(typeof sc === 'number' ? sc : 0.5) >= 0.6 ? 'C;:…박자 감각이 없는 게 확실해졌다. 네가 이겼어.' : 'C*:비겼다. 아니, 내가 이겼다고 우겨도 돼?']);
    reward('ac_rhythm', 2); } });
  add('arcade', { id: 'ac_punch', t: '🥊 펀치 기계 최고 기록 도전', s: 0, run: async () => {
    await lines(['N:쾅! 기계가 요란하게 울리고 화면에 “NEW RECORD”가 뜬다.', 'C*:…너무 셌나. 주인아저씨 표정 봐.', 'C^:기록에 네 이름 써 놨어. 내 거 말고.']);
    reward('ac_punch', 2); } });
  add('starroom', { id: 'st_find', t: '✨ 별자리 찾기', s: 0, run: async () => {
    await say([['C:저기, 저 세 개가 지구에선 오리온자리래. 여기선 “박 중사 벨트”라고 불러.', 'C*:내가 지었어. 아무도 안 써.']], [['N:어두운 투영실, 천장의 별을 가리키던 손가락이 내 손가락에 얽힌다.', 'C:저 별 이름 붙여도 돼? …네 이름으로.']]);
    reward('st_find', 2); } });
  add('lake', { id: 'lk_skip', t: '🪨 물수제비 대결', s: 0, run: async () => {
    const sc = await PX.Mini.timing({ title: '🪨 물수제비', help: '손목 스냅(초록 구간)!', rounds: 3, speed: 65, btn: '휙!', bg: '#2a4a5a' });
    await lines([(typeof sc === 'number' ? sc : 0.5) >= 0.67 ? 'C!:다섯 번 튀었어. 나는 세 번. …다시 해.' : 'C*:나 일곱 번. 사막에서 돌 던지기만 오 년이야.']);
    reward('lk_skip', 2); } });
  add('lake', { id: 'lk_feet', t: '🦶 물에 발 담그기', sub: '여름', s: 1, when: () => St.season() === 'summer', run: async () => {
    await say([['C^:시원하다. 여름에 살아남는 법.', 'N:대위가 물장구로 살짝 물을 튀긴다.', 'C*:…일부러 아니야. 발이 미끄러졌어.']], [['C:네 발 차갑다. 좋다.', 'N:물속에서 대위의 발이 장난스럽게 발을 건드린다.']]);
    St.advance(20); reward('lk_feet', 3); } });
  add('hill', { id: 'hl_sunset', t: '🌅 노을 보며 사진 찍기', sub: '해 질 녘', s: 0, when: () => { const m = St.S.time.min; return m >= 16.5 * 60 && m < 20 * 60; }, run: async () => {
    await say([['N:노을이 언덕을 붉게 물들인다. 대위가 단말을 꺼내 사진을 찍는다.', 'C:노을 찍은 거야. …너도 나왔네. 우연이야.']], [['C^:해마다 여기서 같은 자리에서 찍자.', 'N:찰칵. 화면 속 둘이 노을보다 빨갛다.']]);
    St.advance(20); reward('hl_sunset', 3, ['언덕의 노을', '관람언덕에서 노을을 배경으로 대위와 사진을 찍었다.']); } });
  add('beach', { id: 'bc_castle', t: '🏰 모래성 대결', s: 0, run: async () => {
    await say([['N:대위가 수색팀 진지처럼 각 잡힌 성을 쌓는다. 해자까지 판다.', 'C*:방어력 비교해 보자. 파도한테.', 'N:파도가 밀려와 대위 성만 무너뜨린다.', 'C;:…설계 결함.']], [['C:우리 성은 같이 쌓자. 하나만.', 'C^:파도에 무너지면 또 쌓으면 되지. 몇 번이고.']]);
    St.advance(25); reward('bc_castle', 3); } });
  add(['glowpath', 'glasshouse', 'bluegarden', 'corridor', 'bridge'], { id: 'dm_walk', t: '🚶 천천히 한 바퀴 걷기', s: 0, run: async () => {
    await say([['C:여긴 천천히 걸어야 보이는 게 많아.', 'C^:빨리 걸으면 그냥 길이고, 천천히 걸으면 데이트야.']], [['N:손을 잡고 아무 말 없이 한 바퀴를 돈다. 그래도 하나도 어색하지 않다.', 'C:…좋다. 말 안 해도 좋은 거.']]);
    St.advance(20); reward('dm_walk_' + G().mapId, 2); } });
  add('farm', { id: 'fm_harvest', t: '🌱 향열매 같이 따기', s: 0, run: async () => {
    await lines(['N:대위가 키가 커서 높은 가지의 열매를 쉽게 딴다.', 'C*:키 큰 사람 하나 있으면 편하지?', 'C^:제일 잘 익은 거 너 줄게.']);
    St.addItem('rawfruit'); PX.UI.toast('🍑 갓 딴 향열매 +1'); St.advance(20); reward('fm_harvest', 2); } });

  // ===================== 여행지 =====================
  add(['station', 'skylounge'], { id: 'sl_find', t: '🔭 창밖에서 우리 부대 찾기', s: 0, run: async () => {
    await say([['C:저 붉은 데. 저기 어딘가에 우리 부대 있어. 점보다 작게.', 'C*:저 안에서 매일 너 찾으러 다니는 거야, 내가.']], [['C^:저기서 우리가 처음 만났어. 여기서 보니까 진짜 작다.', 'C:근데 그 점이 내 세상 전부야.']]);
    reward('sl_find', 3); } });
  add('skylounge', { id: 'sl_toast', t: '🍸 별빛 칵테일 건배', sub: '₢15', s: 2, run: async () => {
    if (!pay(15)) return;
    await say([['C:은사막 하나, 궤도광 하나. 얼음은 내 거에만 세 배.', 'C^:건배. 우주에서.']], [['C*:우주에서 건배하는 커플, 많지 않을걸.', 'P:{ob} 취하면 귀여워.', 'C:…안 취했어. 아직.']]);
    St.advance(30); reward('sl_toast', 3); } });
  add('zerohotel', { id: 'zh_float', t: '🫧 무중력에서 손잡고 떠다니기', s: 3, run: async () => {
    await say([['N:몸이 둥실 떠오른다. 대위가 벽을 잡고 손을 내민다.', 'C:잡아. 떠내려가면 못 찾아.', 'C*:…이거 생각보다 재밌다.']], [['N:둘이 손을 잡고 천천히 돈다. 대위가 웃음을 터뜨린다.', 'C^:중력 없으니까 너한테 끌려가는 게 더 잘 느껴져.']]);
    St.advance(20); reward('zh_float', 4, ['무중력', '무중력 호텔에서 대위와 손을 잡고 떠다녔다.']); } });
  add('planet3', { id: 'p3_sea', t: '🌊 처음 보는 바다 앞에 서기', s: 0, run: async () => {
    await lines(['N:돔 유리 너머로 끝없는 바다가 일렁인다. 대위가 한참 말이 없다.', 'C:…처음 봐. 바다.', lov() ? 'C^:처음 보는 걸 너랑 봐서 다행이다.' : 'C^:너랑 같이 봐서 다행이다.']);
    reward('p3_sea', 4, ['처음 본 바다', '제3행성에서 대위는 처음으로 바다를 봤다. 한참 말이 없었다.']); } });
  add('museum', { id: 'ms_guide', t: '💎 광물 설명 듣기', sub: '대위가 가이드', s: 0, run: async () => {
    await lines(['C:이건 외곽에서도 나오는 거. 깎으면 반짝여. 내가 너한테 준 거랑 같은 종류야.', 'C*:이건 오백 년 걸려서 생긴 거래. 내 마음은 사흘 만에 생겼지만.']);
    St.advance(25); reward('ms_guide', 2); } });
  add('onsen', { id: 'os_endure', t: '♨️ 온천 오래 버티기', sub: '대위는 더위에 약하다', s: 0, run: async () => {
    await lines(['N:대위의 얼굴이 점점 빨개진다.', 'C;:…괜찮아. 아직 안 더워.', 'N:삼 분 뒤.', 'C;:…졌다. 냉탕 간다. 넌 천천히 해.']);
    St.S.energy = Math.min(100, St.S.energy + 20); St.advance(30); reward('os_endure', 2); } });
  add(['planet6', 'aurora'], { id: 'p6_warm', t: '🧣 대위 코트 안으로 들어가기', s: 2, run: async () => {
    await say([['C^:추우면 들어와. 내 코트 넓어.', 'N:코트 안은 생각보다 따뜻하다. 대위는 반대로 신이 났다.', 'C*:나는 이 추위가 행복해. 너는 내가 따뜻하고. 완벽하다.']], [['N:대위가 코트 앞섶을 열어 감싸 안는다.', 'C:오로라 나올 때까지 이러고 있자. 몇 시간이 걸려도.']]);
    reward('p6_warm', 3); } });
  add('camp', { id: 'cp_marsh', t: '🔥 마시멜로 구워 주기', s: 0, when: () => St.S.time.min >= 18 * 60 || St.S.time.min < 4 * 60, run: async () => {
    await lines(['N:대위가 마시멜로를 꼬챙이에 꽂아 불 위에서 천천히 돌린다.', 'C:노릇노릇. 이게 제일 어려워. 수색보다.', 'C^:자, 첫 번째. 뜨거우니까 후 불어.']);
    St.advance(20); reward('cp_marsh', 3); } });
  add('silverdesert', { id: 'sd_view', t: '🏜️ 은사막 노을 같이 보기', s: 0, run: async () => {
    await lines(['C:해 질 때 사막이 은색이 돼. 모래가 빛을 튕겨서.', 'C*:작전 중에 이거 볼 때마다 너 데려오고 싶었어. 드디어.']);
    St.advance(20); reward('sd_view', 3); } });
  add(['port', 'terminal'], { id: 'pt_ships', t: '🚀 출항하는 배 구경하기', s: 0, run: async () => {
    await lines(['N:보급선 하나가 천천히 떠오른다. 엔진 빛이 하늘에 긴 선을 긋는다.', 'C:나 처음 올 때 저거 타고 왔어. 그땐 빨리 돌아가고 싶었는데.', 'C^:지금은 아니야.']);
    reward('pt_ships', 2); } });

  // ===================== 내 숙소 · 대위 막사 =====================
  for (const home of ['q_player', 'apt_player']) {
    add(home, { id: 'hm_cook', t: '🍳 같이 요리하기', sub: '기력 +25', s: 2, run: async () => {
      await say([['C:재료 썰기는 내가. 칼은 자신 있어.', 'N:대위가 채소를 군인답게 일정한 간격으로 썬다. 각이 살아 있다.', 'C*:간은 네가. 나 맛 감각 없대, 다들.']],
        [['N:좁은 부엌에서 자꾸 어깨가 부딪친다.', 'C*:좁아서 그래. 일부러 아니야.', 'P:{ob} 세 번째야.', 'C^:…네 번째는 일부러.']]);
      St.S.energy = Math.min(100, St.S.energy + 25); St.advance(45); reward('hm_cook', 3, ['같이 만든 저녁', '숙소에서 대위와 같이 저녁을 만들었다. 채소가 각이 잡혀 있었다.']); } });
    add(home, { id: 'hm_nap', t: '😴 소파에서 같이 낮잠', sub: '1시간', s: 4, when: () => St.S.time.min >= 12 * 60 && St.S.time.min < 18 * 60, run: async () => {
      await say(null, [['N:소파에 나란히 기대 눈을 감는다. 대위의 숨소리가 금방 느려진다.', 'C:…오 분만. …삼십 분만.', 'N:한 시간 뒤. 둘 다 같은 자세로 깬다.']]);
      St.S.energy = Math.min(100, St.S.energy + 20); St.advance(60); reward('hm_nap', 3); } });
    add(home, { id: 'hm_hair', t: '💇 머리 빗겨 주기', s: 3, run: async () => {
      await say([['C:…머리 빗어 줘도 돼? 해 보고 싶었어.', 'N:큰 손이 조심스럽게 빗질을 한다. 한 번도 엉키지 않는다.']], [['N:대위의 무릎 사이에 앉아 머리를 맡긴다.', 'C^:네 머리 만지는 거 좋아. 이건 매일 하고 싶다.']]);
      reward('hm_hair', 3); } });
  }
  add('q_captain', { id: 'qc_carve', t: '💎 광물 같이 깎기', sub: '완성되면 선물', s: 1, run: async () => {
    await lines(['C:이렇게 잡고, 결 따라서 살살. 그렇지.', 'N:대위가 뒤에서 손을 겹쳐 잡고 같이 깎는다. 숨소리가 가깝다.', 'C*:…집중 안 된다. 너 때문에.', 'C^:완성. 이건 네 거야. 우리 둘이 깎은 첫 번째.']);
    St.addItem('mineral'); PX.UI.toast('💎 같이 깎은 광물 조각 +1'); St.advance(40); reward('qc_carve', 4, ['같이 깎은 광물', '대위 막사에서 대위와 손을 겹쳐 광물을 깎았다.']); } });
  add('q_captain', { id: 'qc_ice', t: '🍨 냉각기 앞에서 아이스크림', s: 0, run: async () => {
    await lines(['C^:여기가 내 방에서 제일 좋은 자리야. 냉각기 바로 앞.', 'N:대위가 아이스크림 두 개를 꺼낸다. 하나를 내밀며 담요도 같이 준다.', 'C*:너는 춥잖아. 담요 덮고 먹어. 나는 이게 천국이고.']);
    reward('qc_ice', 2); } });

  // ---------- 은밀숙소의 밤 (연인 이상 · 내가 고를 때만) ----------
  const held = (fn) => async () => { const g = G(); g.modal++; try { await fn(); } finally { PX.Dlg.close(); g.modal--; } };
  add('rubyway', { id: 'rw_inn', t: '🗝️ 은밀숙소 가자고 하기', sub: '밤 · 연인', s: 4, when: night, run: held(() => PX.InnNight.suggest('street')) });
  add('inn', { id: 'in_lobby', t: '🗝️ 객실 올라가기 전에', sub: '연인', s: 4, run: held(() => PX.InnNight.suggest('lobby')) });
  add(['inn_mirror', 'inn_bath', 'inn_water'], { id: 'in_night', t: '🌙 오늘 밤 같이 있기', sub: '불 끄고 아침까지 · 연인', s: 4, when: () => { const m = St.S.time.min; return m >= 20 * 60 || m < 4 * 60; }, run: held(() => PX.InnNight.night()) });

  // ---------- 지금 할 수 있는 것 ----------
  function list() {
    const g = G(), S = St.S, cap = g.cap;
    if (!cap || cap.map !== g.mapId || cap.hidden) return [];
    const st = S.rel.cap.stage;
    return (A[g.mapId] || []).filter(a => st >= (a.s || 0) && (!a.when || a.when())).map(a => ({ t: a.t, sub: (a.sub || '') + (S.done['pa_' + a.id + '_' + S.day] ? (a.sub ? ' · ' : '') + '오늘 함' : ''), run: a.run }));
  }
  return { list, A };
})();
