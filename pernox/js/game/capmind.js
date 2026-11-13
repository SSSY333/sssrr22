// 대위의 단기 기억 · 접촉 상태 머신 · 스킨십 카탈로그
// 대화·이동·스킨십·동행·메시지가 모두 이 기억을 함께 본다. (호감도 수치만으로 고르지 않는다)
'use strict';
PX.Mind = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const now = () => St.absMin();

  // ---------- 1. 단기 기억 ----------
  function mem() {
    const c = St.S.cap;
    if (!c.mem) c.mem = {};
    return Object.assign(c.mem, Object.assign({ talk: -1e9, talkMap: null, topic: null, meet: -1e9, part: -1e9, skin: null, skinMin: -1e9, contact: 'NONE', refused: {}, lines: [], acts: {}, ph: {}, longing: 0, fatigue: 0, smile: -1e9, look: -1e9, goal: null, reunion: null, stayRefusedDay: -1 }, c.mem));
  }
  const gap = () => { const m = mem(); return now() - Math.max(m.talk, m.meet); };
  // 마지막 대화·만남 이후 경과 시간 → 인사 종류
  function gapCat() {
    const m = mem(), g = gap();
    if (m.reunion) return 'reunion';
    if (g < 2) return 'cont'; if (g < 15) return 'brief'; if (g < 60) return 'recontact';
    if (g < 360) return 'again'; if (g < 1440) return 'miss'; return 'long';
  }
  const noteTalk = (topic) => { const m = mem(); m.talk = now(); m.talkMap = G().mapId; if (topic) m.topic = topic; };
  const noteMeet = () => { mem().meet = now(); };
  // 헤어짐: 30분 동안 다시 따라오거나 부르지 않는다 (먼저 말을 거는 건 언제든 가능)
  function notePart(mins = 30) { const m = mem(), r = St.S.rel.cap; m.part = now(); r.noFollowUntil = Math.max(r.noFollowUntil || 0, now() + mins); }
  const justParted = (mins = 30) => now() - mem().part < mins;
  function noteRefuse(act, mins = 180) { mem().refused[act] = now() + mins; }
  const refused = (act) => (mem().refused[act] || 0) > now();
  // 대사 ID · 표현 반복 방지
  const PHRASES = [['miss', /보고 싶었|보고 싶다|보고 싶어/], ['cute', /귀여/], ['pretty', /예뻐|예쁘다/], ['hugq', /안아 줄까|안아줄까/], ['kissq', /뽀뽀해 줄까|뽀뽀할까|뽀뽀해도/], ['sleepq', /나랑 잘래|같이 잘래|같이 자자/]];
  function phrasesOf(text) { return PHRASES.filter(([, re]) => re.test(text)).map(([k]) => k); }
  function phraseOk(text) { const m = mem(); return phrasesOf(text).every(k => now() - (m.ph[k] || -1e9) > 45); }
  function notePhrases(text) { const m = mem(); for (const k of phrasesOf(text)) m.ph[k] = now(); }
  function noteLine(id) { const m = mem(); m.lines = [id, ...m.lines.filter(x => x !== id)].slice(0, 60); }
  const usedRecently = (id, n = 25) => mem().lines.slice(0, n).includes(id);
  // 오래 떨어져 있었다는 말: 실제로 오래 떨어져 있었을 때만
  const LONG_RE = /오랜만|어디 갔다 왔|왜 이렇게 늦게|하루 종일 기다|한참 찾았|며칠 만|보고 싶었잖아/;
  function textOk(text) { const g = gap(); if (LONG_RE.test(text) && g < 360 && !mem().reunion) return false; return phraseOk(text); }

  // ---------- 2. 접촉 상태 머신 ----------
  const WALK = { HAND_HOLD: 'hand', ARM_LINK: 'arm', WAIST_HOLD: 'waist', SHOULDER_HOLD: 'shoulder' };
  const STILL = { SIDE_HUG: 1, FRONT_HUG: 1, BACK_HUG: 1, EMBRACE: 1 };
  const REST = { LAP_REST: 1, CUDDLE: 1, SLEEP_CUDDLE: 1 };
  const NAME = { NONE: '접촉 없음', HAND_HOLD: '손잡기', ARM_LINK: '팔짱', WAIST_HOLD: '허리 감싸기', SHOULDER_HOLD: '어깨 감싸기', SIDE_HUG: '옆에서 안기', FRONT_HUG: '포옹', BACK_HUG: '백허그', EMBRACE: '품에 안기', LAP_REST: '무릎베개', CUDDLE: '누워서 껴안기', SLEEP_CUDDLE: '함께 잠들기' };
  const ICON = { NONE: '🚶', HAND_HOLD: '🤝', ARM_LINK: '💞', WAIST_HOLD: '🫶', SHOULDER_HOLD: '🤗', SIDE_HUG: '🤗', FRONT_HUG: '🫂', BACK_HUG: '🫂', EMBRACE: '🫂', LAP_REST: '😌', CUDDLE: '🛌', SLEEP_CUDDLE: '💤' };
  const contact = () => mem().contact;
  const isWalk = (c = contact()) => !!WALK[c], isHug = (c = contact()) => !!STILL[c], isRest = (c = contact()) => !!REST[c];
  // 상태를 바꾸면 이전 자세를 먼저 끝내고 새 자세를 건다 (두 접촉이 동시에 유지되지 않게)
  function setContact(st) {
    const m = mem(), g = G(), cap = g.cap, p = g.player;
    const prev = m.contact;
    if (STILL[prev] || prev === 'NONE') { cap.tempPose = null; p.tempPose = null; }
    m.contact = st;
    apply();
    if (STILL[st]) { cap.doPose(st === 'BACK_HUG' ? 'hug' : 'hug', 9999, 'smile'); p.doPose('hug', 9999, 'blush'); }
    return prev;
  }
  function apply() {
    const g = G(), cap = g.cap, p = g.player, st = mem().contact;
    cap.holding = p.holding = !!WALK[st];
    cap.holdWith = p; p.holdWith = cap;
    cap.grip = WALK[st] || null;
    p.grip = st === 'ARM_LINK' ? 'arm' : st === 'HAND_HOLD' ? 'hand' : 'free';
    St.S.cap.holding = !!WALK[st];
  }
  // 걷기 시작하면 포옹은 자연스럽게 풀린다 · 맵을 떠나면 접촉 해제
  let moveT = 0;
  function tick(dt) {
    const g = G(), st = contact();
    if (!g.cap || st === 'NONE') return;
    if (g.cap.map !== g.mapId || PX.Cap.mode !== 'follow' && PX.Cap.mode !== 'visit' && PX.Cap.mode !== 'stay') { mem().contact = 'NONE'; apply(); return; }
    if (STILL[st] && g.player.moving) { moveT += dt; if (moveT > 0.25) { moveT = 0; setContact('NONE'); g.cap.tempPose = null; g.player.tempPose = null; if (Math.random() < 0.5) g.bubble(g.cap, U.pickFresh('hugEnd', ['벌써 가?', '…응, 가자.', '아쉽다.', '다음엔 더 길게.']), 1.8); } }
    else moveT = 0;
    if (REST[st] && !g.player.seat) setContact('NONE');
  }

  // ---------- 3. 스킨십 카탈로그 ----------
  // where: any(같은 맵 가까이) · walk(동행 중 서서) · sit(같이 앉아서) · bed(침대·숙소) · hug(포옹 중)
  // req/forbid: 필요한/안 되는 접촉 상태 · to: 끝난 뒤 접촉 상태(null이면 그대로) · cd: 쿨다운(게임 분)
  // anim: pat · hug · bend · hold · lean · none · carry
  const A = (id, o) => Object.assign({ id, need: 1, where: 'any', req: null, forbid: null, to: null, cd: 10, anim: 'bend', cat: 'light' }, o);
  const HUGS = ['SIDE_HUG', 'FRONT_HUG', 'BACK_HUG', 'EMBRACE'];
  const ACTS = [
    // 접촉 상태 바꾸기 (걸을 때)
    A('hand', { name: '손잡기', icon: '🤝', need: 2, cat: 'walk', forbid: ['HAND_HOLD'], to: 'HAND_HOLD', cd: 0, anim: 'hold', lines: [['C^:이거 내가 먼저 하려 했는데.'], ['N:큰 손이 내 손을 통째로 감싼다.', 'C*:손 차갑다. 내가 데워 줄게. 계속.'], ['C:잡았다. 이제 안 놔.']] }),
    A('interlace', { name: '손깍지 끼기', icon: '🫱', need: 3, cat: 'walk', req: ['HAND_HOLD'], to: 'HAND_HOLD', cd: 5, anim: 'hold', lines: [['N:대위가 손가락 사이로 손가락을 하나씩 끼워 넣는다.', 'C*:이게 진짜 잡은 거지.'], ['C:깍지 끼니까 네 손이 진짜 작은 게 느껴진다.', 'C^:놓치면 큰일 나겠네.']] }),
    A('armlink', { name: '팔짱 끼기', icon: '💞', need: 3, cat: 'walk', forbid: ['ARM_LINK'], to: 'ARM_LINK', cd: 0, anim: 'hold', lines: [['C*:팔 더 꽉 잡아. 놓치면 안 되니까.'], ['C:내 팔 굵어서 잡기 힘들지.', 'C^:양손으로 잡아도 돼.']] }),
    A('waist', { name: '허리 감싸기', icon: '🫶', need: 4, cat: 'walk', forbid: ['WAIST_HOLD'], to: 'WAIST_HOLD', cd: 0, anim: 'hold', lines: [['N:커다란 팔이 허리를 둘러 자기 쪽으로 끌어당긴다.', 'C*:이 정도는 붙어 다녀야 연인이지.'], ['C:허리 가늘다. 밥 더 먹어.', 'C^:…말은 그렇게 해도 손은 안 뗄 거야.']] }),
    A('shoulder', { name: '어깨 감싸기', icon: '🤗', need: 3, cat: 'walk', forbid: ['SHOULDER_HOLD'], to: 'SHOULDER_HOLD', cd: 0, anim: 'hold', lines: [['N:대위가 팔을 내 어깨에 툭 걸친다. 무겁고 따뜻하다.', 'C:이러면 아무도 너한테 안 부딪혀.'], ['C*:어깨동무. 학교 다닐 때 이후로 처음이다.']] }),
    A('pull', { name: '자기 쪽으로 살짝 당기기', icon: '🫴', need: 3, cat: 'walk', req: ['HAND_HOLD', 'ARM_LINK', 'WAIST_HOLD', 'SHOULDER_HOLD'], cd: 8, anim: 'hold', lines: [['N:대위가 나를 슬쩍 자기 쪽으로 당긴다.', 'C:사람 지나가. …핑계야.'], ['C*:좀 더 붙어. 바람 막아 줄게.']] }),
    A('thumb', { name: '엄지로 손등 쓰다듬기', icon: '👍', need: 3, cat: 'walk', req: ['HAND_HOLD'], cd: 8, anim: 'none', lines: [['N:잡은 손등을 엄지가 천천히 쓸어내린다.', 'C:…버릇 됐네. 잡으면 이렇게 하게 돼.'], ['N:걷는 동안 엄지가 손등 위에서 작게 원을 그린다.', 'C*:간지러워? 그럼 더 해야지.']] }),
    A('release', { name: '손 놓기', icon: '✋', need: 0, cat: 'walk', req: ['HAND_HOLD', 'ARM_LINK', 'WAIST_HOLD', 'SHOULDER_HOLD'], to: 'NONE', cd: 0, anim: 'none', lines: [['C;:…아쉽다.'], ['C:응. 필요하면 다시 잡아.'], ['C*:놓아준 거 아니다. 잠깐 빌려준 거야.']] }),
    // 가벼운 애정 표현
    A('pat', { name: '머리 쓰다듬기', icon: '✋', need: 1, anim: 'pat', lines: [['N:커다란 손이 머리 위에 얹힌다.', 'C^:머리 작다. 한 손에 다 들어와.'], ['N:대위가 머리를 헝클어뜨렸다가, 다시 정리해 준다.', 'C*:원상복구. …거의.'], ['C:오늘도 잘했어. 그 말 하려고.']] }),
    A('bangs', { name: '앞머리 정리해 주기', icon: '💇', need: 2, anim: 'bend', lines: [['N:대위가 손가락 끝으로 앞머리를 정리해 준다. 생각보다 섬세하다.', 'C:바람에 다 날렸네. …됐다. 예쁘다.'], ['C*:가만있어. 눈 찌르겠다.', 'N:손끝이 이마를 스친다.']] }),
    A('cheek', { name: '뺨 쓰다듬기', icon: '🫳', need: 3, anim: 'bend', lines: [['N:큰 손바닥이 뺨을 감싼다. 굳은살이 까칠하다.', 'C:손 거칠지. 미안. 그래도 이러고 싶었어.'], ['C*:얼굴 뜨겁다. 내 손이 차가운 거 아니고.']] }),
    A('chin', { name: '턱 살짝 받치기', icon: '☝️', need: 4, anim: 'bend', lines: [['N:대위가 손가락으로 턱을 살짝 들어 올린다.', 'C*:고개 숙이지 마. 얼굴 보고 싶어.'], ['C:이렇게 보니까 더 잘 보인다.', 'C^:…뭘 기대한 얼굴이야, 그건.']] }),
    A('backpat', { name: '등 토닥이기', icon: '🫶', need: 1, anim: 'pat', lines: [['N:두툼한 손이 등을 툭툭 두드린다.', 'C:수고했어. 오늘 하루.'], ['C^:잘하고 있어. 진짜로.']] }),
    A('wrist', { name: '손목 가볍게 잡기', icon: '🤚', need: 2, anim: 'hold', lines: [['N:대위가 손목을 가볍게 잡아 멈춰 세운다.', 'C:잠깐. 그냥… 가지 말라고.'], ['C*:맥박 빠르다. 왜 그럴까.']] }),
    A('handkiss', { name: '손등에 입맞춤', icon: '💋', need: 4, cd: 20, anim: 'bend', lines: [['N:대위가 내 손을 들어 손등에 짧게 입을 맞춘다.', 'C*:기사 흉내. 어울려?'], ['N:잡고 있던 손등에 입술이 닿았다 떨어진다.', 'C^:손 잡고 있으면 자꾸 이러고 싶어져.']] }),
    A('fingerkiss', { name: '손가락 끝에 입맞춤', icon: '💋', need: 4, cd: 20, anim: 'bend', lines: [['N:손가락 끝에 하나씩 입술이 닿는다. 다섯 번.', 'C*:하나도 안 빼먹었다.']] }),
    A('forehead', { name: '이마 맞대기', icon: '🙇', need: 3, cd: 15, anim: 'bend', lines: [['N:대위가 허리를 숙여 이마를 맞댄다. 숨결이 가깝다.', 'C:열 없네. 다행이다.', 'C*:…핑계였어. 그냥 가까이 있고 싶어서.'], ['N:이마가 닿는다. 대위가 눈을 감는다.', 'C:잠깐만. 이대로.']] }),
    A('nose', { name: '코끝 맞대기', icon: '👃', need: 4, cd: 15, anim: 'bend', lines: [['N:코끝이 살짝 닿는다.', 'C^:에스키모 인사래. 정시우가 알려 줬어.'], ['C*:코 차갑다. 데워 줄게.', 'N:코끝을 문지른다.']] }),
    A('pinch', { name: '볼 살짝 꼬집기', icon: '🤏', need: 2, cd: 10, anim: 'bend', lines: [['N:대위가 볼을 살짝 꼬집는다.', 'C*:말랑하다. 이거 매일 해도 돼?'], ['C^:볼에 뭐 묻은 줄 알았는데 그냥 귀여워서 그랬어.']] }),
    A('whisper', { name: '귀에 대고 속삭이기', icon: '🗣️', need: 3, cd: 15, anim: 'bend', lines: [['N:대위가 허리를 숙여 귀에 낮게 말한다.', 'C*:…오늘 너 진짜 예쁘다. 크게 말하면 다 들으니까.'], ['N:귓가에 낮은 목소리.', 'C:비밀 하나 알려 줄까. …아무것도 아니야. 이러고 싶었어.']] }),
    A('lean', { name: '일부러 몸 숙여 눈 맞추기', icon: '🙃', need: 2, cd: 10, anim: 'bend', lines: [['N:올려다보자 대위가 일부러 허리를 숙여 눈높이를 맞춘다.', 'C*:목 아프지? 내가 내려올게.'], ['C^:이제 똑같은 높이다. …가까워졌네.']] }),
    A('chinhead', { name: '머리 위에 턱 올리기', icon: '🗻', need: 3, cd: 15, anim: 'hug', lines: [['N:대위가 내 정수리에 턱을 툭 올린다.', 'C^:딱 맞는 받침대.'], ['C*:여기서 보면 세상이 다 내 거 같다. 너 포함.']] }),
    A('bite', { name: '볼을 입술로 물었다 놓기', icon: '😙', need: 5, cd: 30, anim: 'bend', lines: [['N:대위가 볼을 입술로 살짝 물었다 놓는다.', 'C*:맛있어 보여서.'], ['C^:아프지? 아니지? 그럼 한 번 더.']] }),
    A('carry', { name: '업어 달라고 하기', icon: '🧗', need: 4, cd: 30, anim: 'carry', lines: [['C^:올라와. 가볍네. 더 먹어야겠다.'], ['C*:업은 김에 집까지 갈까?']] }),
    // 포옹
    A('fronthug', { name: '정면으로 끌어안기', icon: '🫂', need: 3, cat: 'hug', forbid: HUGS, to: 'FRONT_HUG', cd: 3, anim: 'hug', lines: [['N:넓은 품이 뜨끈하다.', 'C:…좀 더 이러고 있자.'], ['N:대위가 두 팔로 꽉 끌어안는다. 숨이 막힐 만큼은 아니게.', 'C*:이 정도면 안 아프지?'], ['C^:안기면 네 머리가 딱 내 심장 자리야.']] }),
    A('backhug', { name: '뒤에서 안기 (백허그)', icon: '🫂', need: 4, cat: 'hug', forbid: HUGS, to: 'BACK_HUG', cd: 3, anim: 'hug', lines: [['N:뒤에서 큰 팔이 감겨 온다. 등 전체가 따뜻하다.', 'C*:앞에 뭐 보고 있었어? 나도 같이 볼래.'], ['C:이러면 네가 어디 못 가지.']] }),
    A('sidehug', { name: '옆에서 허리 감싸 안기', icon: '🤗', need: 3, cat: 'hug', forbid: HUGS, to: 'SIDE_HUG', cd: 3, anim: 'hug', lines: [['N:대위가 옆에서 허리를 감싸 자기 쪽으로 끌어당긴다.', 'C^:딱 붙었다.']] }),
    A('embrace', { name: '품에 안기', icon: '🫂', need: 4, cat: 'hug', forbid: HUGS, to: 'EMBRACE', cd: 3, anim: 'hug', lines: [['N:팔 안에 가두듯 포근하게 안긴다. 바깥 소리가 멀어진다.', 'C:여기 있으면 아무 일도 안 생겨. 약속해.'], ['C*:들어와. 자리 비워 놨어.']] }),
    A('hugmore', { name: '조금 더 안기', icon: '🫂', need: 3, where: 'hug', cd: 2, anim: 'hug', lines: [['C*:좀 더? 좋아. 얼마든지.'], ['N:팔이 더 깊게 감긴다.', 'C:…놓기 싫다.']] }),
    A('rock', { name: '안은 채 천천히 흔들기', icon: '🎶', need: 4, where: 'hug', cd: 5, anim: 'hug', lines: [['N:대위가 안은 채 몸을 좌우로 천천히 흔든다.', 'C^:춤 아니야. 그냥 이러고 싶어서.']] }),
    A('bury', { name: '어깨에 얼굴 묻기', icon: '😌', need: 4, where: 'hug', cd: 5, anim: 'hug', lines: [['N:대위가 고개를 숙여 내 어깨에 얼굴을 묻는다.', 'C:…잠깐만. 충전 중이야.'], ['C;:오늘 좀 힘들었거든. 이거면 돼.']] }),
    A('hugpat', { name: '안은 채 등 토닥이기', icon: '🫶', need: 3, where: 'hug', cd: 4, anim: 'hug', lines: [['N:안은 채 등을 천천히 토닥인다.', 'C:괜찮아. 다 괜찮아.']] }),
    A('lookface', { name: '얼굴 바라보기', icon: '👀', need: 3, where: 'hug', cd: 3, anim: 'hug', lines: [['N:대위가 안은 채 고개를 숙여 얼굴을 들여다본다.', 'C*:빨개졌다. 기록해 둔다.'], ['C^:이 거리에서 보는 게 제일 좋아.']] }),
    A('hugkiss', { name: '안은 채 입맞춤', icon: '💋', need: 4, where: 'hug', cd: 15, anim: 'hug', lines: [['N:안긴 채로 짧게 입술이 닿는다.', 'C:…한 번 더 해도 돼?'], ['N:대위가 품 안에서 이마에 입을 맞춘다.', 'C^:안고 있으면 이것까지 해야 완성이야.']] }),
    A('hugend', { name: '포옹 풀기', icon: '✋', need: 0, cat: 'hug', req: HUGS, to: 'NONE', cd: 0, anim: 'none', lines: [['C;:벌써?'], ['C:응. …한 번만 더 꽉.', 'N:놓기 직전에 한 번 더 꽉 안는다.']] }),
    // 입맞춤
    A('kissforehead', { name: '이마에 입맞춤', icon: '😚', need: 4, cat: 'kiss', cd: 15, anim: 'bend', lines: [['N:이마에 입술이 오래 머문다.', 'C:이건 잘 자라는 거 말고, 그냥 좋아서.'], ['C^:이마는 허락 안 받아도 되는 데라고 내가 정했어.']] }),
    A('kisstemple', { name: '관자놀이에 입맞춤', icon: '😚', need: 4, cat: 'kiss', cd: 15, anim: 'bend', lines: [['N:관자놀이에 짧게 입술이 닿는다.', 'C*:여기 맥 뛰는 거 느껴져.']] }),
    A('kisscheek', { name: '볼에 입맞춤', icon: '😚', need: 4, cat: 'kiss', cd: 10, anim: 'bend', lines: [['N:볼에 쪽.', 'C^:소리 났다. 다들 들었겠다.'], ['C*:한쪽만 하면 섭섭하잖아.', 'N:반대쪽 볼에도 쪽.']] }),
    A('kissnose', { name: '코끝에 입맞춤', icon: '😚', need: 4, cat: 'kiss', cd: 15, anim: 'bend', lines: [['N:코끝에 쪽.', 'C^:제일 튀어나온 데부터.']] }),
    A('kissmany', { name: '볼에 장난스럽게 여러 번', icon: '😘', need: 4, cat: 'kiss', cd: 30, anim: 'bend', lines: [['N:쪽, 쪽, 쪽. 볼에 연달아 입맞춤이 쏟아진다.', 'C*:셀 수 있으면 세 봐.'], ['C^:한 번만 하려 했는데 멈추는 법을 까먹었어.']] }),
    A('kiss', { name: '입술에 짧게 입맞춤', icon: '💋', need: 4, cat: 'kiss', cd: 15, anim: 'bend', lines: [['N:짧게 입술이 닿았다 떨어진다.', 'C*:…짧았지. 일부러야. 아쉬우라고.'], ['N:대위가 허리를 숙인다. 짧고 조심스러운 입맞춤.', 'C:괜찮았어?']] }),
    A('kisslong', { name: '조금 더 오래 입맞춤', icon: '💋', need: 5, cat: 'kiss', cd: 30, anim: 'bend', lines: [['N:이번엔 조금 더 오래. 큰 손이 뒷목을 받친다.', 'C:…숨 쉬었어?', 'C*:다음엔 숨 쉬는 법부터 같이 연습하자.'], ['N:입맞춤이 길어진다. 떨어지고 나서도 이마가 닿아 있다.', 'C:이러면 오늘 하루 다 괜찮아져.']] }),
    A('kissafter', { name: '입맞춤 뒤 얼굴 바라보기', icon: '👀', need: 4, cat: 'kiss', cd: 10, anim: 'bend', after: ['kiss', 'kisslong', 'hugkiss'], lines: [['N:대위가 얼굴을 떼지 않고 가만히 바라본다.', 'C*:이 표정 보려고 하는 거야.']] }),
    // 앉아서
    A('sitclose', { name: '옆에 바짝 앉기', icon: '🪑', need: 2, where: 'sit', cd: 10, anim: 'none', lines: [['N:대위가 엉덩이를 붙여 바짝 당겨 앉는다.', 'C*:자리 넓은데 왜 붙냐고? 넓어서.'], ['C:여기 앉으면 네 어깨가 내 팔에 닿아. 그게 좋아.']] }),
    A('leanshoulder', { name: '어깨에 머리 기대기', icon: '😌', need: 3, where: 'sit', cd: 10, anim: 'none', lines: [['N:대위 어깨에 머리를 기댄다. 대위가 숨을 고르며 움직이지 않는다.', 'C:…편해? 그럼 나 오늘 여기서 안 움직인다.'], ['C^:어깨 높이 딱 맞지. 이러려고 큰 거야.']] }),
    A('sitwaist', { name: '앉은 채 허리에 팔 두르기', icon: '🫶', need: 4, where: 'sit', cd: 10, anim: 'none', lines: [['N:팔이 허리를 감아 자기 쪽으로 당긴다.', 'C*:앉아 있을 땐 이게 정석이야.']] }),
    A('lappillow', { name: '무릎베개 해 주기', icon: '😌', need: 4, where: 'sit', to: 'LAP_REST', cd: 20, anim: 'none', lines: [['N:대위가 무릎을 툭툭 친다. 누우라는 뜻이다.', 'C:허벅지 단단해서 베개로는 별로일 거야.', 'C^:대신 머리는 계속 쓰다듬어 줄게.'], ['N:대위 무릎에 머리를 누인다. 커다란 손이 머리카락을 천천히 빗어 넘긴다.', 'C:자도 돼. 깨울 일 없어.']] }),
    A('backstroke', { name: '등을 천천히 쓰다듬기', icon: '🫳', need: 3, where: 'sit', cd: 10, anim: 'none', lines: [['N:커다란 손이 등을 위아래로 천천히 쓸어내린다.', 'C:긴장 풀어. 여긴 안전해.']] }),
    A('fingers', { name: '손가락 만지작거리기', icon: '🫱', need: 3, where: 'sit', cd: 10, anim: 'none', lines: [['N:대위가 내 손가락을 하나씩 접었다 폈다 한다.', 'C*:손가락 하나가 내 손가락 반이야.'], ['C:가만있어. 반지 사이즈 재는 거 아니야. …아마.']] }),
    A('cheekpoke', { name: '장난스럽게 뺨 누르기', icon: '👉', need: 2, where: 'sit', cd: 10, anim: 'none', lines: [['N:손가락이 볼을 꾹 누른다.', 'C^:들어간다. 신기하다.']] }),
    // 침대 · 휴식 공간 (연인 이상, 같은 방에 있을 때)
    A('liebeside', { name: '침대에 나란히 눕기', icon: '🛏️', need: 4, where: 'bed', cd: 10, anim: 'none', lines: [['N:침대가 대위 무게에 한쪽으로 기운다. 자연스럽게 그쪽으로 굴러간다.', 'C*:중력이야. 내 탓 아니야.'], ['C:천장 보는 거 좋다. 옆에 네가 있으니까.']] }),
    A('armpillow', { name: '팔베개 해 주기', icon: '💪', need: 4, where: 'bed', cd: 15, anim: 'none', lines: [['N:대위가 팔을 쭉 뻗어 베개를 만든다. 단단하고 따뜻하다.', 'C:저려도 말 안 할게.', 'C*:대신 아침에 팔 못 쓰면 네가 밥 먹여 줘.']] }),
    A('cuddle', { name: '옆으로 누워 끌어안기', icon: '🛌', need: 4, where: 'bed', to: 'CUDDLE', cd: 10, anim: 'none', lines: [['N:대위가 옆으로 돌아누워 품 안에 끌어안는다.', 'C:…이게 제일 좋은 자세야. 결정했어.'], ['N:뒤에서 감싸 안긴다. 등에 심장 소리가 느껴진다.', 'C*:심장 소리 크지. 너 때문이야.']] }),
    A('hairstroke', { name: '머리카락 쓰다듬기', icon: '🫳', need: 4, where: 'bed', cd: 8, anim: 'none', lines: [['N:머리카락 사이로 손가락이 천천히 지나간다.', 'C:졸리면 자. 계속 이러고 있을게.']] }),
    A('massage', { name: '어깨 주물러 주기', icon: '💆', need: 3, where: 'bed', cd: 30, anim: 'none', energy: 12, lines: [['N:큰 손이 어깨를 조심스럽게 주무른다. 힘 조절에 엄청 신경 쓰는 게 느껴진다.', 'C:아프면 말해. 나 손힘 세서.', 'C^:어깨 많이 뭉쳤네. 오늘 고생했구나.'], ['N:엄지가 날갯죽지 밑을 꾹꾹 누른다.', 'C*:여기가 제일 뭉쳤다. 내가 다 풀어 줄게.']] }),
    A('blanket', { name: '이불 덮어 주기', icon: '🛏️', need: 4, where: 'bed', cd: 30, anim: 'none', lines: [['N:대위가 이불을 턱 밑까지 끌어올려 덮어 준다. 귀퉁이까지 꼼꼼하게.', 'C:군대식이야. 각 잡아서 덮었어.']] }),
    A('watchsleep', { name: '잠든 척하기', icon: '😴', need: 4, where: 'bed', cd: 30, anim: 'none', lines: [['N:눈을 감는다. 한참 동안 시선이 느껴진다.', 'C:…자는 얼굴도 예쁘네. 이건 깨어 있을 땐 못 하는 말이야.', 'N:이마에 조심스러운 입맞춤.']] }),
  ];
  const BY = {}; for (const a of ACTS) BY[a.id] = a;

  // 지금 이 행동을 할 수 있는가 → { ok, why }
  function where() {
    const g = G(), cap = g.cap, p = g.player;
    if (!cap || cap.map !== g.mapId || U.dist(cap.x, cap.y, p.x, p.y) > 3.2) return null;
    const md = PX.MAPS[g.mapId];
    const privateRoom = md.home || md.innRoom || g.mapId === 'q_captain';
    const onBed = p.seat && p.seat.obj && p.seat.obj.use === 'bed';
    return { hug: isHug(), sit: !!p.seat && !onBed, bed: privateRoom && (onBed || PX.Cap.mode === 'visit' || PX.Cap.mode === 'stay'), walk: !p.seat, privateRoom };
  }
  function check(a) {
    const S = St.S, st = S.rel.cap.stage, c = contact(), w = where(), m = mem();
    if (!w) return { ok: false, why: '대위가 가까이 있어야 해요' };
    if (st < a.need) return { ok: false, why: `${St.STAGES[a.need]} 이상` };
    if (a.req && !a.req.includes(c)) return { ok: false, hide: true };
    if (a.forbid && a.forbid.includes(c)) return { ok: false, hide: true }; // 이미 하고 있는 건 다시 묻지 않는다
    if (a.where === 'hug' && !w.hug) return { ok: false, hide: true };
    if (a.where === 'sit' && !w.sit) return { ok: false, hide: true };
    if (a.where === 'bed' && !w.bed) return { ok: false, hide: true };
    if (a.cat === 'walk' && !w.walk && a.id !== 'release') return { ok: false, hide: true };
    if (a.after && !a.after.includes(m.skin)) return { ok: false, hide: true };
    if (S.rel.cap.backoffUntil > now() && a.cat === 'kiss') return { ok: false, why: '오늘은 조심스러워해요' };
    const left = (m.acts[a.id] || -1e9) + a.cd - now();
    if (left > 0) return { ok: false, why: `방금 했어요 (${Math.ceil(left)}분 뒤)` };
    return { ok: true };
  }
  // 메뉴에 보일 행동 (숨길 건 숨기고, 못 하는 건 이유와 함께 흐리게)
  function menuItems() {
    const out = [];
    for (const a of ACTS) { const c = check(a); if (c.hide) continue; out.push({ a, ok: c.ok, why: c.why }); }
    return out;
  }
  // 실행: 이전 자세 끝내기 → 위치 맞추기 → 애니메이션 → 대사 → 상태·기록
  async function perform(id, capAsked) {
    const a = BY[id], g = G(), cap = g.cap, p = g.player, S = St.S, m = mem();
    if (!a) return false;
    const c = check(a); if (!c.ok) { if (c.why) PX.UI.toast(c.why); return false; }
    if (a.to && WALK[a.to] && PX.Cap.mode !== 'follow' && PX.Cap.mode !== 'visit' && PX.Cap.mode !== 'stay') PX.Cap.startFollow();
    // 포옹·서서 하는 행동은 가까이 붙는다 (손잡기 상태는 유지)
    const w = where();
    if (!w.sit && !w.bed && a.anim !== 'none' && !WALK[a.to || '']) {
      const m2 = PX.W.maps[cap.map];
      if (a.to === 'BACK_HUG') { const t = [p.x - (p.dir === 1 ? 0.6 : p.dir === 3 ? -0.6 : 0), p.y - (p.dir === 0 ? 0.6 : p.dir === 2 ? -0.6 : 0)]; if (PX.W.walkable(m2, Math.floor(t[0]), Math.floor(t[1]))) { cap.x = t[0]; cap.y = t[1]; } cap.dir = p.dir; }
      else { const t = PX.Path.nearestWalkable(m2, p.x + 0.7, p.y - 0.7, 2); if (t) { cap.x = t[0] + 0.5; cap.y = t[1] + 0.5; if (U.dist(cap.x, cap.y, p.x, p.y) > 1.3) { cap.x = p.x + 0.6; cap.y = p.y - 0.6; } } cap.setDirTo(p.x, p.y); p.setDirTo(cap.x, cap.y); }
      cap.stop();
    }
    if (a.to) setContact(a.to);
    if (!STILL[a.to || ''] && !isHug()) {
      if (a.anim === 'pat') { cap.doPose('pat', 2.2, 'smile'); p.doPose('idle', 2.2, 'smile'); }
      else if (a.anim === 'bend') { cap.doPose('bend', 2, 'smile'); p.doPose('idle', 2, 'blush'); }
      else if (a.anim === 'hug') { cap.doPose('hug', 2.4, 'smile'); p.doPose('hug', 2.4, 'blush'); }
      else if (a.anim === 'carry') { cap.doPose('carry', 2.5, 'smirk'); p.hidden = true; setTimeout(() => (p.hidden = false), 2500); }
    }
    if (a.cat === 'kiss' || a.id === 'fronthug' || a.id === 'embrace') { cap.showEmote('heart', 2.2); setTimeout(() => p.showEmote('heart', 1.8), 400); }
    m.acts[a.id] = now(); m.skin = a.id; m.skinMin = now(); noteMeet();
    // 대사: 이 행동에서 최근에 안 나온 묶음
    const pool = a.lines.map((l, i) => ({ l, k: a.id + '#' + i })).filter(x => !usedRecently(x.k, 12));
    const pick = U.pick(pool.length ? pool : a.lines.map((l, i) => ({ l, k: a.id + '#' + i })));
    noteLine(pick.k);
    g.modal++; await PX.Dlg.runLines(pick.l, { reply: true }); PX.Dlg.close(); g.modal--;
    if (a.energy) S.energy = Math.min(100, S.energy + a.energy);
    St.addAff(capAsked ? 3 : (a.need >= 4 ? 4 : 2));
    const key = 'skin_' + a.id;
    if (!S.done[key] && !['release', 'hugend'].includes(a.id) && (a.need >= 3 || ['hand', 'pat'].includes(a.id))) { S.done[key] = 1; g.memory(a.name, firstText(a), true); }
    return true;
  }
  const firstText = (a) => ({ hand: '처음 손을 잡았다. 손이 반쯤 사라졌다.', fronthug: '처음 안겼다. 품이 뜨끈했다.', kiss: '처음 입을 맞췄다. 짧았는데 오래 기억날 것 같다.', waist: '허리에 감긴 팔이 묵직했다.', lappillow: '대위 무릎을 베고 잠깐 졸았다.', armpillow: '팔베개는 생각보다 단단했다.' }[a.id] || `처음으로 ${a.name}. 얼굴이 화끈거렸다.`);

  // ---------- 대위가 먼저 원할 때 (먼저 묻고, 거절하면 같은 건 한동안 다시 안 묻는다) ----------
  const ASKS = [
    { id: 'hand', ask: [['C:손. 이리 줘.', 'C*:싫으면 안 줘도 돼. 대신 표정으로 말해 줘.'], ['C:사람 많다. 손 잡을까?']] },
    { id: 'armlink', ask: [['C:팔 내줄게. 잡을래?']] },
    { id: 'waist', ask: [['C:허리 좀 감아도 돼? 사람 많아서… 아니, 그냥 하고 싶어서.']] },
    { id: 'fronthug', ask: [['C:안아도 돼?', 'C*:지금 좀 안고 싶어. 이유는 안아 보고 말할게.'], ['C:…잠깐 이리 와 봐. 안아 보게.']] },
    { id: 'pat', ask: [['C:머리 이리 내밀어. 쓰다듬게.']] },
    { id: 'kisscheek', ask: [['C:볼 좀 빌려줘. 금방 돌려줄게.']] },
    { id: 'kissforehead', ask: [['C:이마 좀. …이마에 하는 건 괜찮지?']] },
    { id: 'kiss', ask: [['C:…해도 돼?', 'C*:뭘 하냐고 묻지 마. 알잖아.']] },
  ];
  async function capAsk() {
    const g = G(), S = St.S, m = mem();
    const list = ASKS.filter(x => { const a = BY[x.id]; return check(a).ok && !refused(x.id) && !usedRecently('ask_' + x.id, 6); });
    if (!list.length) return false;
    const x = U.pick(list), bd = U.pick(x.ask);
    noteLine('ask_' + x.id);
    g.modal++;
    g.cap.setDirTo(g.player.x, g.player.y);
    await PX.Dlg.runLines(bd);
    const i = await PX.Dlg.choose([{ t: '좋아요.' }, { t: '지금은 싫어요.' }]);
    if (i === 0) { await PX.Dlg.say('player', '좋아요.'); PX.Dlg.close(); g.modal--; await perform(x.id, true); return true; }
    await PX.Dlg.say('player', '지금은 싫어요.');
    await PX.Dlg.say('cap', U.pickFresh('backoff', ['응, 알았어.', '그래. 싫으면 안 하는 거야.', '알았어. 대신 옆에서 걷는 건 돼?', '응. 물어본 거야. 조른 거 아니고.', '알았어. 다음엔 네가 먼저 하고 싶을 때까지 기다릴게.']), 'smile');
    PX.Dlg.close(); g.modal--;
    noteRefuse(x.id, 240);
    return true;
  }

  return { mem, gap, gapCat, noteTalk, noteMeet, notePart, justParted, noteRefuse, refused, phraseOk, notePhrases, noteLine, usedRecently, textOk, contact, setContact, apply, isWalk, isHug, isRest, tick, ACTS, BY, check, menuItems, perform, capAsk, NAME, ICON, where };
})();
