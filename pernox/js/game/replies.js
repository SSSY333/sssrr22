// 질문에 맞는 대답 선택지 + 직접 대답하기
// 대위·NPC가 질문으로 말을 끝내면, 그 질문의 종류와 상대·관계에 맞는 말투로 대답을 고른다.
// 말투: p 존댓말 · h 반존대 · c 반말 · f 친근한 존댓말(후배·손님에게)
'use strict';
PX.Reply = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;

  // ---------- 질문 분류 ----------
  const CATS = [
    ['permit', /(해도|가도|들어가도|잡아도|안아도|앉아도|만져도|봐도|써도|돼)\s*\??$|괜찮지\?$|줄래\?$|빌려줘/],
    ['know', /알아\?|아세요\?|아시|봤어\?|보셨|들었어\?|들으셨|알지\?|기억나\?|기억나세요|기억해\?|아는/],
    ['meal', /밥|먹었|드셨|먹을래|드실래|배고프|메뉴|국 |간식|커피 마|뭐 먹|저녁 뭔|점심 뭔/],
    ['tired', /피곤|힘들|아파|다친 데|잘 잤|잠은|괜찮아\?|괜찮으세요|어디 아|졸려|추워|더워|춥지|덥지/],
    ['day', /너는\?|넌\?|너는 어땠|오늘 (어땠|뭐 했|하루)|뭐 했어|그새|하루 어땠|별일 없었|근무 어땠|무슨 일 있었|어떻게 지냈/],
    ['invite', /(할래|갈래|볼래|올래|먹을래|마실래|탈래|출래|걸을래|앉을래|들을래|하실래요|가실래요|보실래요)\?|(하자|가자|보자|먹자)[.?]?$|어때\?$|어떠|한 판|같이 /],
    ['like', /좋아해\?|좋아\?|마음에 들|좋지\?|예쁘지|맛있지|재밌지|괜찮지\?|어울려\?/],
    ['why', /왜\?|왜 그렇게|왜 웃|왜 봐/],
    ['what', /뭐야\?|뭐 해\?|뭐 할|어디|언제|누구|몇|뭐 사|뭐 봐|무슨/],
  ];
  const catOf = (t) => { for (const [k, re] of CATS) if (re.test(t)) return k; return 'misc'; };
  const isQ = (t) => /[?？]\s*$/.test(t.trim());

  // ---------- 대답 (말투별) ----------
  // mood: pos 긍정 · neg 거절·지침 · neu 담담 · flirt 애정 (연애 단계에서만)
  const R = (mood, p, h, c, f) => ({ mood, p, h: h || p, c: c || h || p, f: f || p });
  const WORK = { medic: '환자 몇 명 봤어요', engineer: '드론 두 대 고쳤어요', scout: '정찰 보고서 정리했어요', researcher: '표본 정리했어요' };
  const WORKc = { medic: '환자 몇 명 봤어', engineer: '드론 두 대 고쳤어', scout: '정찰 보고서 정리했어', researcher: '표본 정리했어' };
  const REPLIES = {
    day: [R('neu', '저는 평범했어요. {work}.', '나는 평범했어요. {work}.', '난 평범했어. {workc}.', '평범했어. {workc}.'), R('pos', '오늘은 꽤 괜찮았어요.', '오늘은 좀 괜찮았어요, 나.', '오늘 괜찮았어.', '괜찮았지.'), R('neg', '저는 좀 지쳤어요.', '나 오늘 좀 지쳤어요.', '나 오늘 좀 지쳤어.', '좀 지치네.'), R('flirt', '대위님 생각하느라 하루가 갔어요.', '대위님 생각하다 하루 다 갔어요.', '너 생각하다 하루 다 갔어.'), R('neu', '다친 데는 없어요? 그게 먼저예요.', '다친 데 없죠? 그것부터.', '다친 데 없지? 그것부터.')],
    meal: [R('pos', '먹었어요. 든든해요.', '먹었어요. 배불러.', '먹었어. 배불러.', '먹었지. 든든해.'), R('neu', '아직이요. 같이 먹을래요?', '아직이에요. 같이 먹어요.', '아직. 같이 먹자.', '아직. 같이 먹을래?'), R('neg', '깜빡했어요…', '아, 깜빡했어요.', '아, 깜빡했다.', '아, 까먹었다.'), R('flirt', '대위님이랑 먹으려고 기다렸어요.', '대위님이랑 먹으려고 참았어요.', '너랑 먹으려고 기다렸지.')],
    tired: [R('pos', '괜찮아요. 걱정 마세요.', '괜찮아요, 진짜로.', '괜찮아. 걱정 마.', '괜찮아. 걱정 마.'), R('neg', '조금 피곤해요.', '좀 피곤하긴 해요.', '좀 피곤해.', '좀 피곤하네.'), R('flirt', '대위님 보니까 다 나았어요.', '대위님 보니까 괜찮아졌어요.', '너 보니까 괜찮아졌어.'), R('neu', '대위님은요? 대위님이 더 피곤해 보여요.', '대위님이 더 피곤해 보이는데요.', '너야말로 피곤해 보여.', '너는? 너야말로.')],
    permit: [R('pos', '네, 괜찮아요.', '응, 돼요.', '응, 돼.', '그래.'), R('neg', '지금은 좀 그래요.', '지금은 싫어요.', '지금은 싫어.', '지금은 좀.'), R('neu', '조금만이요.', '조금만이에요.', '조금만.', '조금만.'), R('flirt', '물어보지 않아도 돼요.', '그런 건 안 물어봐도 돼요.', '그런 건 안 물어봐도 돼.')],
    invite: [R('pos', '좋아요!', '좋아요, 가요.', '좋아. 가자.', '좋지!'), R('neg', '오늘은 말고 다음에요.', '다음에 해요.', '다음에 하자.', '다음에.'), R('neu', '어디로요? 언제요?', '언제요? 어디로?', '언제? 어디로?', '어디로?'), R('flirt', '대위님이랑이면 어디든요.', '대위님이랑이면 다 좋아요.', '너랑이면 어디든.')],
    like: [R('pos', '좋아요. 정말로요.', '좋아요, 진짜.', '좋아. 진짜.', '좋아.'), R('neu', '글쎄요… 아직 잘 모르겠어요.', '음, 잘 모르겠어요.', '음, 잘 모르겠어.', '글쎄.'), R('neg', '솔직히 별로예요.', '솔직히 좀 별로예요.', '솔직히 별로야.', '별로야.'), R('flirt', '대위님만큼 좋진 않아요.', '대위님보다 좋은 건 없어요.', '너보다 좋은 건 없어.')],
    know: [R('pos', '네, 알아요.', '알아요, 알아.', '알지.', '알지.'), R('neu', '아뇨, 처음 들어요. 뭔데요?', '처음 들어요. 뭔데요?', '처음 듣는데. 뭔데?', '처음 들어. 뭔데?'), R('neg', '기억이 잘 안 나요…', '가물가물해요.', '가물가물해.', '잘 기억 안 나.'), R('flirt', '대위님 얘기라면 다 기억해요.', '대위님 얘기는 다 기억하죠.', '네 얘기는 다 기억해.')],
    why: [R('neu', '그냥요.', '그냥이에요.', '그냥.', '그냥.'), R('pos', '비밀이에요.', '비밀.', '비밀이야.', '비밀.'), R('flirt', '대위님이 좋아서요.', '대위님이 좋으니까요.', '네가 좋으니까.'), R('neg', '아무것도 아니에요.', '아니에요, 아무것도.', '아무것도 아니야.', '아무것도 아냐.')],
    what: [R('neu', '음, 아직 생각 중이에요.', '아직 생각 중이에요.', '아직 생각 중.', '생각 중이야.'), R('pos', '대위님이 정해 주세요.', '대위님이 정해요.', '네가 정해.', '네가 정해.'), R('neu', '그러게요. 뭐가 좋을까요?', '뭐가 좋을까요?', '뭐가 좋을까?', '뭐가 좋을까?'), R('flirt', '대위님이 있는 데요.', '대위님 있는 곳이요.', '너 있는 데.')],
    misc: [R('pos', '네, 그럼요.', '그럼요.', '그럼.', '당연하지.'), R('neu', '음… 글쎄요.', '음, 글쎄요.', '음, 글쎄.', '글쎄.'), R('neg', '아니요.', '아뇨.', '아니.', '아니.'), R('flirt', '대위님은 어떻게 생각하는데요?', '대위님 생각은요?', '넌 어떻게 생각해?')],
  };

  // ---------- 반응 ----------
  // 대위: 질문 종류 × 대답 분위기
  const CAP_RE = {
    pos: ['C^:다행이다.', 'C^:그 말 들으니까 좋다.', 'C:응. 좋아.', 'C^:그래야지.', 'C*:역시. 그럴 줄 알았어.'],
    neg: ['C:응, 알았어. 무리하지 마.', 'C;:그랬구나. 내가 뭐 해 줄 거 없어?', 'C:괜찮아. 그런 날도 있어.', 'C:알았어. 억지로 안 해도 돼.'],
    neu: ['C:그렇구나.', 'C:응. 천천히 생각해.', 'C*:흠, 그래?', 'C:알겠어.'],
    flirt: ['C!:…', 'C*:그런 말 갑자기 하면 반칙이야.', 'C^:…방금 그거 녹음하고 싶다.', 'C*:너 오늘 왜 이렇게 나 설레게 해.', 'C;:…얼굴 빨개진 거 보지 마.'],
  };
  const CAP_RE_CAT = {
    meal: { neu: ['C^:좋아. 식당 가자. 내가 식판 들어 줄게.'], neg: ['C:밥은 거르지 마. 지금 뭐라도 먹자.'], flirt: ['C^:기다렸다고? …지금 바로 가자.'] },
    tired: { neg: ['C:그럼 오늘은 일찍 쉬어. 데려다줄게.', 'C:어깨 이리 와. 기대.'], neu: ['C*:나? 나는 튼튼해. 네 걱정이나 해.'] },
    permit: { neg: ['C:응. 알았어. 안 할게.', 'C:그래. 싫으면 안 하는 거야.'] },
    invite: { neg: ['C:응. 다음에 꼭.', 'C:알았어. 네가 편할 때.'], neu: ['C:네가 정해. 어디든 따라갈게.'] },
    day: { neg: ['C:고생했다. 오늘은 내가 다 들어 줄게.'], neu: ['C:응, 멀쩡해. 걱정해 줘서 고마워.'] },
  };
  // NPC: 반말 쓰는 사람 · 존댓말 쓰는 사람
  const NPC_RE = {
    p: { pos: ['다행이네요.', '좋네요!', '그쵸?', '역시요.'], neg: ['아이고, 무리하지 마세요.', '그럴 수 있죠.', '괜찮아요, 다음에 해요.'], neu: ['그렇군요.', '아, 그래요?', '음, 그렇구나.'], flirt: ['대위님이 들으면 좋아하시겠네요.', '그 말 대위님한테 꼭 해 드리세요.'] },
    b: { pos: ['다행이다.', '좋네.', '그렇지?', '역시.'], neg: ['무리하지 마.', '그럴 수 있지.', '괜찮아, 다음에 하자.'], neu: ['그렇구나.', '아, 그래?', '음.'], flirt: ['그 녀석이 들으면 좋아하겠다.', '그 말은 그 녀석한테 직접 해.'] },
  };

  // 말투 정하기: 상대·관계·직업
  function tone(who) {
    const S = St.S, st = S.rel.cap.stage, mil = PX.JOBS[S.player.job].military;
    if (who === 'cap') return st >= 5 ? 'c' : st >= 3 ? 'h' : 'p';
    const d = PX.NPC_BY_ID[who];
    if (!d) return 'p';
    if (mil && d.age <= 23 && !d.banmal) return 'f'; // 후배 병사에겐 편한 말
    return 'p';
  }
  function fill(t) { const j = St.S.player.job; return t.replace('{work}', WORK[j] || '일했어요').replace('{workc}', WORKc[j] || '일했어'); }
  function options(who, q) {
    const S = St.S, cat = catOf(q), tn = tone(who), love = who === 'cap' && S.rel.cap.stage >= 2;
    let list = REPLIES[cat].filter(r => r.mood !== 'flirt' || love);
    // 서로 다른 분위기 3개 (+ 애정 단계면 하나 더)
    const moods = ['pos', 'neu', 'neg', 'flirt'], out = [];
    for (const m of moods) { const c = list.filter(r => r.mood === m); if (c.length) out.push(U.pick(c)); }
    // 연애 단계면 말투를 하나 섞는다 (반존대 ↔ 존댓말)
    return out.slice(0, love ? 4 : 3).map((r, i) => {
      let t = r[tn];
      if (who === 'cap' && S.rel.cap.stage >= 3 && i === 1) t = r[tn === 'c' ? 'h' : tn === 'h' ? 'c' : 'p'] || t;
      if (r.mood === 'flirt' && tn === 'p') t = r.p;
      return { t: fill(t), mood: r.mood, cat };
    });
  }

  // 질문에 대답하기: 선택지 → 내 말 → 상대 반응. 직접 입력도 된다.
  async function ask(who, q) {
    const S = St.S, opts = options(who, q);
    const items = opts.map(o => ({ t: o.t })).concat([{ t: '✍️ 직접 대답하기' }]);
    const i = await PX.Dlg.choose(items);
    if (i === items.length - 1) return direct(who, q);
    const o = opts[i];
    await PX.Dlg.say('player', o.t, o.mood === 'flirt' ? 'blush' : 'normal');
    await react(who, o.cat, o.mood);
    return { aff: o.mood === 'flirt' ? 3 : o.mood === 'neg' ? 0 : 1 };
  }
  async function react(who, cat, mood) {
    if (who === 'cap') {
      const pool = (CAP_RE_CAT[cat] && CAP_RE_CAT[cat][mood]) || CAP_RE[mood];
      const ln = U.pickFresh('re_' + cat + mood, pool);
      const m = /^C([*^;!~]?):(.*)$/.exec(ln);
      await PX.Dlg.say('cap', U.fmt(m[2], PX.Dlg.ctx()), { '*': 'smirk', '^': 'smile', ';': 'sad', '!': 'surprise', '~': 'blush' }[m[1]] || 'normal');
      if (mood === 'flirt') G().cap.showEmote('heart', 1.4);
      if (PX.Mind) PX.Mind.noteTalk('reply_' + cat);
    } else {
      const d = PX.NPC_BY_ID[who] || (PX.EXTRA && PX.EXTRA[who]);
      const b = d && d.banmal ? 'b' : 'p';
      await PX.Dlg.say(who, U.pickFresh('nre_' + b + mood, NPC_RE[b][mood] || NPC_RE[b].neu), 'smile');
    }
  }
  // ---------- 직접 대답하기 ----------
  // 아티팩트에서는 Claude가 그 인물로 대답하고, 아니면 말의 분위기를 읽어 고정 반응을 고른다
  function readMood(t) {
    if (/사랑|좋아해|보고 싶|안아|뽀뽀|멋있|잘생|설레|예뻐/.test(t)) return 'flirt';
    if (/싫|아니|안 돼|별로|피곤|힘들|아파|졸려|그만|나중에|다음에/.test(t)) return 'neg';
    if (/좋|네|응|그래|당연|고마|맛있|괜찮|재밌|알았/.test(t)) return 'pos';
    return 'neu';
  }
  function input() {
    return new Promise(res => {
      const bar = document.getElementById('chatbar');
      const inp = bar.querySelector('input'), send = bar.querySelector('.send'), end = bar.querySelector('.end');
      bar.querySelector('.chips2').innerHTML = ''; bar.querySelector('.last').textContent = '';
      bar.classList.remove('hidden'); inp.value = ''; setTimeout(() => inp.focus(), 50);
      const done = (v) => { bar.classList.add('hidden'); send.onclick = null; end.onclick = null; inp.onkeydown = null; res(v); };
      send.onclick = () => { const v = inp.value.trim(); if (v) done(v.slice(0, 160)); };
      inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing) { const v = inp.value.trim(); if (v) done(v.slice(0, 160)); } if (e.key === 'Escape') done(null); };
      end.onclick = () => done(null);
    });
  }
  async function direct(who, q, teaseCtx) {
    PX.Dlg.close();
    const text = await input();
    if (!text) { // 그냥 닫으면: 고개만 끄덕인 걸로
      await PX.Dlg.say('narr', '말없이 고개를 끄덕인다.');
      await react(who, catOf(q), 'neu');
      return { aff: 0 };
    }
    await PX.Dlg.say('player', text);
    if (PX.AI && PX.AI.available()) {
      const ok = await PX.AI.answer(who, q, text);
      if (ok) return { aff: ok.aff || 1, hurt: !!ok.hurt };
    }
    const mood = readMood(text);
    if (teaseCtx && /싫|그만|하지 마|불편/.test(text)) return { aff: 0, hurt: true };
    await react(who, catOf(q), mood);
    return { aff: mood === 'flirt' ? 3 : mood === 'neg' ? 0 : 1 };
  }

  // 장난·유혹 대사에 대한 반응 (싫다고 말하는 선택지는 언제나 있다)
  const TEASE = [
    R('pos', '대위님도 참.', '아 진짜, 대위님.', '진짜 못 말려.'), R('pos', '…(웃음을 참는다)', '…(웃음이 터진다)', '…(웃음이 터진다)'),
    R('flirt', '저도 그 말 듣고 싶었어요.', '나도 그래요.', '나도.'), R('flirt', '조금 설렜어요.', '좀 설렜어요, 방금.', '방금 좀 설렜어.'),
    R('neu', '…(못 들은 척한다)', '…(못 들은 척한다)', '…(못 들은 척한다)'), R('neu', '또 그런다.', '또 시작이에요?', '또 시작이야?'),
  ];
  const HURT = { p: '그런 말은 좀 싫어요.', h: '그런 말은 싫어요.', c: '그런 말은 싫어.' };
  async function tease(q) {
    const S = St.S, tn = tone('cap'), love = S.rel.cap.stage >= 2;
    const pool = TEASE.filter(r => r.mood !== 'flirt' || love);
    const picks = ['pos', 'flirt', 'neu'].map(m => pool.filter(r => r.mood === m)).filter(x => x.length).map(x => U.pick(x));
    const items = picks.map(r => ({ t: r[tn] })).concat([{ t: HURT[tn], hurt: true }, { t: '✍️ 직접 대답하기' }]);
    const i = await PX.Dlg.choose(items);
    if (i === items.length - 1) { const r = await direct('cap', q, true); return r; }
    if (items[i].hurt) { await PX.Dlg.say('player', items[i].t); return { aff: 0, hurt: true }; }
    const o = picks[i], t = items[i].t;
    if (!/^…\(/.test(t)) await PX.Dlg.say('player', t, o.mood === 'flirt' ? 'blush' : 'normal');
    if (o.mood === 'flirt' || Math.random() < 0.5) await react('cap', 'misc', o.mood);
    return { aff: o.mood === 'flirt' ? 3 : 2 };
  }

  return { ask, tease, isQ, catOf, options, input, readMood, react, tone };
})();
