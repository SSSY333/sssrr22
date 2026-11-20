// 대화창 · 선택지 · 대사 묶음 고르기(최근 대사 반복 방지) · 대위 대화 흐름
'use strict';
PX.Dlg = (() => {
  const U = PX.U, St = PX.St, Cal = PX.Cal;
  let box, nameEl, textEl, chEl, portEl, nextEl;
  let open = false;
  function init() {
    box = document.getElementById('dlg');
    nameEl = box.querySelector('.dname'); textEl = box.querySelector('.dtext'); chEl = document.getElementById('choices');
    portEl = box.querySelector('canvas'); nextEl = box.querySelector('.dnext');
  }
  const ctx = () => { const S = St.S, r = S.rel.cap, op = S.cap.op, lov = r.stage >= 4, call = S.player.callCap || '오빠', gn = U.givenName(S.player.name);
    // {ob} 내가 대위를 부르는 말(오빠/자기) · {oc} 부를 때(오빠/자기야) · {cv} 대위가 나를 부를 때(연인이면 가끔 자기야)
    return { p: S.player.name, c: S.capName, rival: S.lastRival || '', days: op ? op.days : 3, n: r.loverSince != null ? S.day - r.loverSince : 100,
      ob: lov ? call : (St.S.player.job !== 'scout' ? '대위' : '대위님'), oc: lov ? (call === '자기' ? '자기야' : '오빠') : (St.S.player.job !== 'scout' ? '대위' : '대위님'), cv: lov && Math.random() < 0.5 ? '자기야' : U.josa(gn, '아') }; };
  // ---------- 연인 말투: 플레이어가 대위에게 하는 말을 반말 + 오빠/자기로 ----------
  let npcActive = null; // 부대원과 대화 중이면 그 사람에게 하는 말
  const lovers = () => St.S.rel.cap.stage >= 4;
  // 대위에게 하는 말: 수색팀 소위는 연인 전까지 존댓말(상관), 그 밖엔 처음부터 반말
  const banmal = () => lovers() || St.S.player.job !== 'scout';
  function toCap() { const G = PX.Game; if (!banmal() || npcActive || !G.cap || G.cap.map !== G.mapId || G.cap.hidden) return false; return U.dist(G.cap.x, G.cap.y, G.player.x, G.player.y) < 6 || G.cap.atDoor; }
  function lover(t) {
    if (!t || !banmal()) return t;
    const call = lovers() ? (St.S.player.callCap || '오빠') : '대위', ob = call;
    // 존댓말 → 반말
    t = t.replace(/^(\([^)]*\)\s*)?네([,.!])/, (m, a, b) => (a || '') + '응' + b).replace(/아니요|아뇨/g, '아니');
    t = t.replace(/(^|[\s…])저는/g, '$1나는').replace(/(^|[\s…])전 /g, '$1난 ').replace(/(^|[\s…])제가/g, '$1내가').replace(/(^|[\s…])저도/g, '$1나도').replace(/(^|[\s…])저를/g, '$1나를').replace(/(^|[\s…])저한테/g, '$1나한테').replace(/(^|[\s…])저랑/g, '$1나랑').replace(/(^|[\s…])제 /g, '$1내 ').replace(/(^|[\s…])저희/g, '$1우리');
    t = t.replace(/시니까/g, '니까').replace(/(하|가|오|보)시면/g, '$1면');
    t = t.replace(/리셨/g, '렸').replace(/하셨/g, '했').replace(/오셨/g, '왔').replace(/가셨/g, '갔').replace(/드셨/g, '먹었').replace(/보셨/g, '봤').replace(/주셨/g, '줬').replace(/계셨/g, '있었').replace(/으셨/g, '었');
    t = t.replace(/입니다/g, '이야').replace(/습니다/g, '어').replace(/이에요/g, '이야').replace(/예요/g, '야').replace(/마세요/g, '마').replace(/드세요/g, '먹어').replace(/주세요/g, '줘').replace(/하세요/g, '해').replace(/가세요/g, '가').replace(/오세요/g, '와').replace(/쉬세요/g, '쉬어').replace(/보세요/g, '봐').replace(/계세요/g, '있어').replace(/으세요/g, '어').replace(/세요/g, '어').replace(/드릴게/g, '줄게').replace(/드려/g, '줘').replace(/군요/g, '구나').replace(/죠([.?!…~\s]|$)/g, '지$1');
    t = t.replace(/([가-힣])요([.?!…~,\s)]|$)/g, '$1$2');
    // 대위님 · 너 → 오빠/자기
    const J = { 은: '는', 는: '는', 이: '가', 가: '가', 을: '를', 를: '를', 과: '랑', 와: '랑', 이랑: '랑', 랑: '랑', 께: '한테', 께서: '가' };
    t = t.replace(/대위님(께서|이랑|은|는|이|가|을|를|과|와|랑|께)?/g, (m, j) => ob + (j ? J[j] : ''));
    const B = '(^|[\\s“"\'(…])';
    if (!lovers()) return t; // 연인 전엔 '너'를 그대로 둔다
    t = t.replace(new RegExp(B + '너(이랑|랑|는|도|를|한테|밖에|야|만|보다|처럼|하고|의)', 'g'), (m, a, j) => a + ob + (j === '이랑' ? '랑' : j));
    t = t.replace(new RegExp(B + '너(?=[\\s.?!,…~]|$)', 'g'), (m, a) => a + ob);
    t = t.replace(new RegExp(B + '넌(?=[\\s.?!,…~]|$)', 'g'), (m, a) => a + ob + '는').replace(new RegExp(B + '네가', 'g'), (m, a) => a + ob + '가').replace(new RegExp(B + '널(?=[\\s.?!,…~]|$)', 'g'), (m, a) => a + ob + '를');
    t = t.replace(new RegExp(B + '네 (?=[가-힣])', 'g'), (m, a) => a + ob + ' ');
    return t;
  }

  // 반말 → 존댓말 (수색팀 소위가 연인 되기 전, 상관인 대위에게)
  const KEEP = /^(아|어|음|와|헉|흠|앗|오|엥|에이|하하|헤헤|응응|으|흐|휴|읏|쉿|네|예|자기야|호|흥|칫|좀)$/;
  const hasBat = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0 && c % 28 !== 4 && c % 28 !== 8; }; // ㄴ · ㄹ 받침은 그냥 '요' (하면요 · 뭘요)
  function endPolite(w) {
    if (/(했|었|았|겠|였)다$/.test(w)) return w.slice(0, -1) + '어요'; // 깜빡했다 → 깜빡했어요
    if (w === '좋다') return '좋아요'; if (w === '그치') return '그렇죠';
    if (/였더라$/.test(w)) return w.replace(/였더라$/, '였죠'); if (/더라$/.test(w)) return w + '고요'; // 맛있더라 → 맛있더라고요
    if (/(요|니다|니까|죠|세요|다|님|기)$/.test(w) || KEEP.test(w)) return w;
    if (w === '마') return '마세요';
    if (w === '응') return '네'; if (w === '아니' || w === '아냐') return '아니요'; if (w === '미안') return '죄송해요'; if (w === '고마워') return '고마워요';
    if (/거야$/.test(w)) return w.replace(/거야$/, '거예요');
    if (/이야$/.test(w)) return w.replace(/이야$/, '이에요');
    if (/[냐니]$/.test(w) && w.length > 1) return w.slice(0, -1) + '나요';
    if (/[^는은인던까]지$/.test(w)) return w.slice(0, -1) + '죠'; // 여기까지 → 여기까지요 (여기까죠 X)
    if (/자$/.test(w) && w.length > 1) return w.slice(0, -1) + '죠';
    if (/야$/.test(w) && w.length > 1) { const c = w.charCodeAt(w.length - 2) - 0xac00; return c >= 0 && c % 28 === 0 ? w.slice(0, -1) + '예요' : w; }
    if (hasBat(w) && !/(걸|군|겠|었|았|않|는데|은데|던데|텐데)$/.test(w)) return w + '이요'; // 받침 있는 말: 손이요 · 외곽이요
    { const c = w.charCodeAt(w.length - 1) - 0xac00; if (c >= 0 && c % 28 === 4 && !/(면|는|은|인|던|런|건|선|친|간|된|한|운|른|든)$/.test(w)) return w + '이요'; } // ㄴ 받침 명사: 칭찬이요 · 세 번이요
    return w + '요';
  }
  function polite(t) {
    if (!t || /^\(.*\)$/.test(t.trim())) return t;
    t = t.replace(/(^|[\s…])나는/g, '$1저는').replace(/(^|[\s…])난 /g, '$1전 ').replace(/(^|[\s…])내가/g, '$1제가').replace(/(^|[\s…])나도/g, '$1저도').replace(/(^|[\s…])나를/g, '$1저를').replace(/(^|[\s…])나한테/g, '$1저한테').replace(/(^|[\s…])나랑/g, '$1저랑').replace(/(^|[\s…])내 (?=[가-힣])/g, '$1제 ');
    const J = { 는: '은', 도: '도', 를: '을', 한테: '한테', 랑: '이랑', 이랑: '이랑', 보다: '보다', 만: '만', 하고: '하고', 의: '의' };
    t = t.replace(/(^|[\s“"'(…])너(이랑|랑|는|도|를|한테|보다|만|하고|의)/g, (m, a, j) => a + '대위님' + J[j]).replace(/(^|[\s“"'(…])네가/g, '$1대위님이').replace(/(^|[\s“"'(…])넌(?=[\s.?!,…~]|$)/g, '$1대위님은').replace(/(^|[\s“"'(…])널(?=[\s.?!,…~]|$)/g, '$1대위님을').replace(/(^|[\s“"'(…])너(?=[\s.?!,…~]|$)/g, '$1대위님');
    // 맨 앞 맞장구 (쉼표 앞): 응, → 네, · 괜찮아, → 괜찮아요, · 글쎄, → 글쎄요,
    t = t.replace(/(^|[\s…])(응|그래|괜찮아|글쎄|좋아|아니|알았어)(,)/g, (m, a, w, c) => a + ({ 응: '네', 그래: '그래요', 괜찮아: '괜찮아요', 글쎄: '글쎄요', 좋아: '좋아요', 아니: '아니요', 알았어: '알겠어요' })[w] + c);
    t = t.replace(/(\S) 와([.!])/g, '$1 와요$2'); // 연락하고 와 → 와요 (감탄사 '와'는 그대로)
    // 문장 끝에서만 (말줄임표는 줄 끝일 때만 문장 끝으로 본다)
    return t.replace(/([가-힣]+)([.?!~]+[…]*|…+(?=\s*$)|$)(?=[\s"”')]|$)/g, (m, w, pun) => endPolite(w) + pun);
  }
  // 대위에게 하는 말을 지금 관계에 맞는 말투로 (연인이거나 수색팀이 아니면 반말 · 수색팀 소위는 연인 전까지 존댓말)
  const capTone = (t) => !t ? t : banmal() ? lover(t) : polite(t);
  function toCapAny() { const G = PX.Game; if (npcActive || !G || !G.cap) return false; if (G.cap.atDoor) return true; /* 문 앞(다른 맵)에서 묻는 대위에게 하는 말도 */ if (G.cap.map !== G.mapId || G.cap.hidden) return false; return U.dist(G.cap.x, G.cap.y, G.player.x, G.player.y) < 8 || G.cap.atDoor; }

  function portrait(speaker, face) {
    const g = portEl.getContext('2d');
    g.clearRect(0, 0, portEl.width, portEl.height);
    let app = null;
    if (speaker === 'cap') app = PX.Game.cap.app;
    else if (speaker === 'player') app = PX.Game.player.app;
    else if (PX.NPC_BY_ID[speaker]) app = PX.NPC_BY_ID[speaker].look;
    else if (PX.EXTRA && PX.EXTRA[speaker]) app = PX.EXTRA[speaker].look;
    portEl.style.visibility = app ? 'visible' : 'hidden';
    if (!app) return;
    const f = PX.S.get(app, 'idle', 0, 'F', face || 'normal');
    // 머리~가슴만 크게
    const top = Math.max(0, f.headY - 8);
    g.imageSmoothingEnabled = false;
    g.drawImage(f.c, 0, top, f.c.width, 30, (portEl.width - f.c.width * 2) / 2, 0, f.c.width * 2, 60);
  }
  const FACES = { '*': 'smirk', '^': 'smile', ';': 'sad', '!': 'surprise', '~': 'blush' };

  let typing = null;
  // 대화창은 하나다: 여러 흐름이 동시에 말하려 해도 한 줄씩 차례로 (이름·대사가 섞이지 않게)
  let lane = Promise.resolve(), pending = null;
  // 오류 복구용: 기다리던 줄을 풀어 주고 대기열을 비운다 (대화가 영영 안 나오는 일 없게)
  function reset() { const p = pending; pending = null; lane = Promise.resolve(); clearInterval(typing); typing = null; if (p) try { p(-1); } catch (e) { /* 무시 */ } }
  const inLane = (fn) => { const p = lane.then(fn, fn); lane = p.catch(() => {}); return p; };
  function say(speaker, text, face) {
    const G = PX.Game; // 대위가 이 장소에 없으면 대위의 말은 하지 않는다
    if (speaker === 'cap' && G && G.cap && !G.cap.atDoor && (G.cap.map !== G.mapId || G.cap.hidden)) { console.warn('대위 부재로 생략:', text); return Promise.resolve(); }
    return inLane(() => sayNow(speaker, text, face));
  }
  // ---------- 대위가 한 번 한 말은 기록 (저장 파일) — 다른 말이 남아 있는 한 다시 하지 않는다 ----------
  const capKey = (t) => {
    const S = St.S, gn = U.givenName(S.player.name || ''), names = [S.player.name, gn, S.capName].filter(Boolean);
    let x = String(t).replace(/\{[^}]*\}/g, '');
    for (const n of names) x = x.split(n).join('');
    x = x.replace(/자기야|자기|오빠|대위님/g, '').replace(/^[아야이],?/, '').replace(/[\s.,!?…~]/g, '');
    return U.hash(x);
  };
  // '…' '!' 같은 짧은 말은 기록하지 않는다 (모든 '…'가 같은 말로 취급돼 후보가 줄던 문제)
  const tooShort = (t) => String(t).replace(/\{[^}]*\}/g, '').replace(/[\s.,!?…~]/g, '').length < 3;
  function capSaid(t) { if (tooShort(t)) return false; const S = St.S; S.capSaid = S.capSaid || {}; return S.capSaid[capKey(t)] != null; }
  function noteCapSaid(t) { if (tooShort(t)) return; const S = St.S; S.capSaid = S.capSaid || {}; S.capSaid[capKey(t)] = St.absMin(); const ks = Object.keys(S.capSaid); if (ks.length > 6000) { ks.sort((a, b) => S.capSaid[a] - S.capSaid[b]).slice(0, 1000).forEach(k => delete S.capSaid[k]); } }
  const capLinesOf = (bd) => [].concat(bd && (bd.l || bd)).flatMap(x => typeof x === 'string' ? (/^C[*^;!~]?:/.test(x) ? [x.replace(/^C[*^;!~]?:/, '')] : []) : x && x.q ? x.q.flatMap(q => (q[2] || []).filter(y => typeof y === 'string' && /^C/.test(y)).map(y => y.replace(/^C[*^;!~]?:/, ''))) : []);
  const bundleSeen = (bd) => capLinesOf(bd).filter(t => !tooShort(t)).slice(0, 2).some(capSaid); // 첫 대사들이 이미 나온 묶음
  function sayNow(speaker, text, face) {
    if (speaker === 'cap') try { noteCapSaid(text); recentCap.push({ t: text, at: St.absMin() }); if (recentCap.length > 8) recentCap.shift(); } catch (e) { /* 무시 */ }
    text = U.fixNames(text);
    if (text && text[0] === '\u2060') text = text.slice(1); // 그대로 말하기 표시 (예: 근무 중 장난으로 '대위님')
    else if (speaker === 'player' && toCapAny()) text = capTone(text);
    if (speaker === 'cap' && lovers()) { const gn = U.givenName(St.S.player.name); text = text.replace(new RegExp('^' + gn + '(아|야)([,.!]|\\s)'), (m, a, b) => Math.random() < 0.5 ? '자기야' + b : m); }
    if (PX.Dlg.onSay) try { PX.Dlg.onSay(speaker, text); } catch (e) {}
    return new Promise(res0 => {
      const res = (v) => { pending = null; res0(v); }; pending = res;
      open = true; box.classList.remove('hidden'); chEl.innerHTML = ''; chEl.classList.add('hidden');
      const nm = speaker === 'cap' ? St.S.capName : speaker === 'player' ? St.S.player.name : speaker === 'narr' ? '' : (PX.NPC_BY_ID[speaker] || (PX.EXTRA && PX.EXTRA[speaker]) || { name: speaker }).name;
      nameEl.textContent = nm; nameEl.style.display = nm ? '' : 'none';
      box.classList.toggle('narr', speaker === 'narr');
      box.classList.toggle('mine', speaker === 'player');
      portrait(speaker, face);
      // 월드 속 캐릭터 표정도 함께
      const act = speaker === 'cap' ? PX.Game.cap : speaker === 'player' ? PX.Game.player : PX.Game.npcs.find(n => n.id === speaker);
      if (act && face) act.doPose(act.tempPose || null, 3, face);
      PX.Game.log(nm, text);
      let i = 0; textEl.textContent = '';
      nextEl.classList.add('hidden');
      clearInterval(typing);
      const finish = () => { clearInterval(typing); typing = null; textEl.textContent = text; nextEl.classList.remove('hidden'); };
      // 글자 단위(이모지·결합 문자 포함)로 끊어서 찍는다 — 중간에 깨진 문자가 보이지 않게
      const parts = (typeof Intl !== 'undefined' && Intl.Segmenter) ? [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(text)].map(x => x.segment) : Array.from(text);
      typing = setInterval(() => { i += 2; textEl.textContent = parts.slice(0, i).join(''); if (i >= parts.length) finish(); }, 28);
      PX.Audio && PX.Audio.blip(speaker === 'cap' ? 0.7 : speaker === 'player' ? 1.2 : 1);
      const onTap = (e) => {
        e.preventDefault();
        if (typing) { finish(); return; }
        box.removeEventListener('pointerup', onTap); document.removeEventListener('keydown', onKey);
        res();
      };
      const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') onTap(e); };
      box.addEventListener('pointerup', onTap);
      setTimeout(() => document.addEventListener('keydown', onKey), 50);
    });
  }
  function choose(...a) { return inLane(() => chooseNow(...a)); }
  function chooseNow(opts) {
    return new Promise(res0 => {
      const res = (v) => { pending = null; res0(v < 0 ? 0 : v); }; pending = res;
      chEl.innerHTML = ''; chEl.classList.remove('hidden'); nextEl.classList.add('hidden');
      box.classList.remove('hidden');
      opts.forEach((o, i) => {
        const b = U.el('button', { class: 'choice' + (o.hurt ? ' hurt' : '') }, toCapAny() ? capTone(o.t) : o.t);
        b.addEventListener('click', (e) => { e.stopPropagation(); chEl.classList.add('hidden'); res(i); });
        chEl.append(b);
      });
      // 선택지는 대화창 바로 위에 (대화창 높이에 맞춰), 넘치면 스크롤
      document.documentElement.style.setProperty('--dlgH', (box.offsetHeight || 120) + 'px');
      chEl.scrollTop = 0;
    });
  }
  // AI 응답을 기다리는 동안: 대위 초상 + 점점 늘어나는 "…"
  function thinking(who) {
    open = true; box.classList.remove('hidden'); chEl.classList.add('hidden');
    nameEl.textContent = who && PX.NPC_BY_ID[who] ? PX.NPC_BY_ID[who].name : St.S.capName; nameEl.style.display = ''; box.classList.remove('narr', 'mine');
    portrait(who || 'cap', 'normal'); nextEl.classList.add('hidden');
    let n = 0; textEl.textContent = '…';
    const iv = setInterval(() => { n = (n + 1) % 4; textEl.textContent = '…' + '.'.repeat(n); }, 350);
    return { stop: () => clearInterval(iv) };
  }
  // 다른 흐름이 아직 대답을 기다리는 중이면(탭·선택 대기) 닫지 않는다 — 보이지 않는 질문에 갇혀 멈추는 일 방지
  function close() { if (pending) return; open = false; box.classList.add('hidden'); chEl.classList.add('hidden'); }

  // 대사 줄 실행 → { aff, tags }
  async function runLines(lines, opt = {}) {
    // 대사 묶음이 배열 안에 한 번 더 들어와도 (['C:…','P:…'] 를 [ ] 로 또 감싼 경우) 한 줄씩 풀어서 말한다
    lines = [].concat(lines || []).flat(Infinity).filter(l => l != null);
    const others = lines.some(l => typeof l === 'string' && /^[SX]:/.test(l));
    const prevNpc = npcActive; if (others && !npcActive) npcActive = 'scene';
    try { return await runLines0(lines, opt); } finally { npcActive = prevNpc; }
  }
  async function runLines0(lines, opt = {}) {
    const res = { aff: 0, tags: [] };
    const c = ctx();
    let replied = false, skipQ = false;
    const capHere = () => { const G = PX.Game; return !!(G.cap && (G.cap.atDoor || (G.cap.map === G.mapId && !G.cap.hidden))); };
    // 대위가 나오는 장면인데 지금 대위가 없으면: 반쪽짜리 대화가 되지 않게 장면 전체를 건너뛴다
    { const isCapLn = (ln) => typeof ln === 'string' && (/^C[*^;!~]?:/.test(ln) && !opt.speaker); if (lines.some(isCapLn) && !capHere()) { console.warn('대위 부재로 생략: (장면 전체)', lines.find(isCapLn)); return res; } }
    for (let li = 0; li < lines.length; li++) {
      const ln = lines[li], last = li === lines.length - 1;
      if (typeof ln === 'object' && ln.q && skipQ) continue; // 대위가 없어서 못 한 말에 딸린 선택지
      if (typeof ln === 'string') {
        const capLine = /^C[*^;!~]?:/.test(ln) && !opt.speaker, capNarr = /^N:.*(대위(가|는|도|의|를|에게|와|랑| 귀| 옆| 입)|\{c[가-힣]*\}|\{cg\})/.test(ln) || (St.S.capName && ln.startsWith('N:') && ln.includes(St.S.capName));
        if ((capLine || capNarr) && !capHere()) { skipQ = true; console.warn('대위 부재로 생략:', ln); continue; }
        if (/^[CSX]/.test(ln)) skipQ = false;
      }
      if (typeof ln === 'object' && ln.q) {
        let q = ln.q.slice();
        if (opt.refuse) q.push(['그런 말은 좀 싫어요.', 0, null, 'hurt']);
        const i = await choose(q.map(x => ({ t: U.fmt(x[0], c), hurt: x[3] === 'hurt' })));
        const pick = q[i];
        await say('player', U.fmt(pick[0], c));
        res.aff += pick[1] || 0;
        if (pick[3]) res.tags.push(pick[3]);
        if (pick[3] === 'hurt') return res;
        if (pick[2]) { const r = await runLines(pick[2]); res.aff += r.aff; res.tags.push(...r.tags); }
        continue;
      }
      const xm = /^[XS]:([a-z0-9_]+):(.*)$/.exec(ln); // X: 이름 없는 사람 · S: NPC — 나레이션이 남의 말을 대신하지 않게 화자를 따로 둔다
      if (xm) { const tx = U.fmt(xm[2], c); await say(xm[1], tx); if (opt.reply && last && PX.Reply && PX.Reply.isQ(tx) && (PX.NPC_BY_ID[xm[1]] || (PX.EXTRA && PX.EXTRA[xm[1]]))) { const r = await PX.Reply.ask(xm[1], tx); res.aff += r.aff; replied = true; } continue; }
      const m = /^([CPN])([*^;!~]?):(.*)$/.exec(ln);
      if (!m) { await say('narr', U.fmt(ln, c)); continue; }
      const who = m[1] === 'C' ? (opt.speaker || 'cap') : m[1] === 'P' ? 'player' : 'narr';
      const face = m[2] ? FACES[m[2]] : (m[1] === 'P' ? 'normal' : 'normal');
      const tx = U.fmt(m[3], c);
      await say(who, tx, m[1] === 'P' && m[2] === '!' ? 'blush' : face);
      // 질문으로 끝나면 그 질문에 맞는 대답을 고른다 (장난·유혹 대사는 아래에서 따로)
      if (opt.reply && !opt.refuse && last && who === 'cap' && PX.Reply && PX.Reply.isQ(tx)) { const r = await PX.Reply.ask('cap', tx); res.aff += r.aff; replied = true; }
      if (last) res.lastText = tx;
    }
    if (opt.refuse && !lines.some(l => typeof l === 'object')) {
      const r = await PX.Reply.tease(res.lastText || '');
      res.aff += r.aff; if (r.hurt) res.tags.push('hurt');
    }
    return res;
  }

  // 조건에 맞는 묶음 고르기 (최근 사용 제외)
  // 대사 내용이 지금 상황과 맞는지 (오늘 수색을 다녀왔다는 말은 평일 오후 다섯 시 이후에만 등)
  // 대사 내용이 지금 시각 · 계절 · 날씨 · 장소와 맞는지 (밤에 '그늘로 가자', 겨울에 '덥다' 같은 말 막기)
  const HOT = { onsen: 1, inn_bath: 1, gym: 1, samgyup: 1, beach: 1, mess: 1 };
  const COLD = { planet6: 1, aurora: 1, q_captain: 1 };
  const FLIRT_HEAT = /너 때문|네가|너 보|붙어|안아|안고|가까이|부끄|얼굴|심장|설레/;
  function ctxOk(t) {
    if (!t) return true;
    t = String(t);
    const S = St.S, m = S.time.min, se = St.season(), G = PX.Game, map = G && G.mapId, md = (PX.MAPS && PX.MAPS[map]) || {};
    const w = md.dome || md.kind === 'in' ? 'clear' : St.weather();
    const wkd = !St.isWeekend() && !(PX.Rom && PX.Rom.onLeave && PX.Rom.onLeave('cap', S.day)) && !(S.cap.op && S.cap.op.phase === 'away');
    const day = m >= 7 * 60 && m < 18 * 60, night = m >= 19 * 60 || m < 5 * 60;
    if (/외곽 [^.]*(갔다 왔|다녀왔|별일 없었|조용했)|수색 (다녀|끝나고)|복귀 보고 끝|흙먼지만 잔뜩|검진은요/.test(t) && !(wkd && m >= 17 * 60)) return false;
    if (/오후에 [^.]*외곽 나가|외곽 코스 바뀌었|다섯 시쯤 들어오/.test(t) && !(wkd && m < 13 * 60)) return false;
    if (/좋은 아침|잘 잤어|일어났어\?|모닝/.test(t) && !(m >= 5 * 60 && m < 11 * 60 + 30)) return false;
    if (/잘 자[.,!]|잘 자$|꿈에서 보자|좋은 꿈|좋은 밤|굿나잇/.test(t) && !(m >= 20 * 60 || m < 4 * 60)) return false;
    if (/점심/.test(t) && !(m >= 6 * 60 && m < 15 * 60)) return false; // 아침의 '점심때 보자'는 괜찮다
    if (/노을/.test(t) && !(m >= 16 * 60 && m < 20 * 60 + 30)) return false;
    if (/별이 |별 (많|보러|봐|보여)|별빛 아래|별 좀/.test(t) && !night && !md.stars) return false;
    // 햇볕 · 그늘: 낮에만, 겨울엔 '덥다' 그늘은 아니다
    if (/그늘|햇볕|햇빛이|땡볕|해 (진짜 )?세|해가 세|자외선|선크림|탄다\.|타겠다/.test(t) && !(day && se !== 'winter')) return false;
    // 더위: 여름 낮·저녁, 봄가을 한낮, 원래 더운 곳, 설렘 때문에 덥다는 말만
    if (/덥다|더워|더위|땀 (난|나|흘)|녹는다|녹겠다/.test(t) && !(HOT[map] || FLIRT_HEAT.test(t) || (se === 'summer' && m >= 8 * 60 && m < 23 * 60) || ((se === 'spring' || se === 'autumn') && m >= 11 * 60 && m < 17 * 60))) return false;
    // 추위: 겨울, 봄가을 밤, 원래 추운 곳(냉각기 막사 · 제6행성), 냉방 얘기만
    if (/춥다|추워|추운|덜덜|목도리|코트 안으로|핫팩|손 시려|손이 시려/.test(t) && !(COLD[map] || se === 'winter' || (se !== 'summer' && night) || /냉각기|냉방|에어컨|얼음/.test(t))) return false;
    // 눈 · 꽃 · 낙엽
    if (/눈사람|눈 (와|온|오는|내리)|첫눈|은빛 눈/.test(t) && !(se === 'winter' || w === 'snow')) return false;
    if (/꽃 피|봄바람|벚꽃/.test(t) && se !== 'spring') return false;
    if (/낙엽|단풍/.test(t) && se !== 'autumn') return false;
    // 비 · 모래바람 (실외에서 지금 그 날씨일 때만)
    if (/비 온다|비 오네|비 맞|우산 (하나|같이)/.test(t) && w !== 'rain') return false;
    if (/모래바람 (심|분다|이다)|모래 들어가/.test(t) && w !== 'dust' && map !== 'outskirts') return false;
    // 식사 · 하루 일과
    // 방금 먹었으면: 배고프다 · 밥 먹었어? · 밥 먹으러 가자 같은 말은 안 한다
    { const now = St.absMin(), pAte = S.lastAte && now - S.lastAte < 150;
      const cMeal = [7 * 60 + 30, 12 * 60, 18 * 60].some(t0 => m >= t0 + 20 && m < t0 + 150) && !(S.cap.op && S.cap.op.phase === 'away'); // 대위 식사 시간 직후
      const cAte = (S.capAte && now - S.capAte < 150) || cMeal;
      if (/배고프|배고파|허기|굶었|굶어|배에서 소리|밥 생각/.test(t) && !/배고프면|배고파 보여|배고프지\?|배고프다고요/.test(t) && (cAte || pAte)) return false;
      if (/배고프지\?|배고파 보여|밥 (먹었어|은 먹었어|안 먹었|먹었냐)|밥은\?|안 먹었으면|먹고 다녀|식사(는 |했)/.test(t) && pAte) return false;
      if (/밥 먹으러|먹으러 가자|같이 먹(자|을래|어요)|밥 먹자|식당 가자|밥 같이|저녁 같이 먹|점심 같이|아침 같이|먹으러 갈래/.test(t) && pAte) return false;
    }
    if (/아침 먹|아침은 먹|아침밥/.test(t) && !(m >= 5 * 60 && m < 11 * 60)) return false;
    if (/저녁 (먹|뭐)|저녁은 먹|저녁밥/.test(t) && !(m >= 15 * 60 && m < 22 * 60)) return false;
    if (/야식/.test(t) && !(m >= 19 * 60 || m < 3 * 60)) return false;
    if (/출근(하기|길| 전)/.test(t) && !(wkd && m >= 5 * 60 && m < 10 * 60)) return false;
    if (/퇴근(했|하고|이다|길)/.test(t) && !(m >= 15 * 60 && m < 22 * 60)) return false;
    if (/하루 종일[^.?!]*(있을|붙어 있|같이 있|놀|비워|네 거)|오늘 하루 (비워|네 거|전부)|일정 다 비웠/.test(t)) { if (!(m >= 5 * 60 && m < 12 * 60)) return false; } // 앞으로의 하루 계획은 오전에만
    else if (/오늘 하루 (어땠|고생|종일)|하루 종일/.test(t) && !(m >= 13 * 60 || m < 3 * 60)) return false; // 지나간 하루 얘기는 오후부터
    if (/자고 가|잘 시간|불 끌까/.test(t) && !(m >= 19 * 60 || m < 5 * 60)) return false;
    if (/해 뜨|일출|동트/.test(t) && !(m >= 4 * 60 && m < 9 * 60)) return false;
    if (/밤공기|밤바람|밤하늘|오늘 밤은|이 밤에/.test(t) && !night) return false;
    if (/아침부터|아침 공기|이른 아침/.test(t) && !(m >= 5 * 60 && m < 12 * 60)) return false;
    if (/점심 먹고/.test(t) && !(m >= 12 * 60 && m < 16 * 60)) return false;
    if (/한낮|대낮/.test(t) && !(m >= 11 * 60 && m < 16 * 60)) return false;
    // 시제: 내일 봐는 저녁부터 · 이따 봐는 한밤엔 아님 · 좋은 하루는 오전 · 주말 인사는 금·주말
    if (/내일 (봐|보자|만나)|내일 아침에 (봐|보자)/.test(t) && !(m >= 16 * 60 || m < 4 * 60)) return false;
    if (/이따(가)? (봐|보자|만나)/.test(t) && (m >= 22 * 60 + 30 || m < 5 * 60)) return false;
    if (/좋은 하루|하루 잘 보내|오늘 하루도 힘내/.test(t) && !(m >= 4 * 60 && m < 14 * 60)) return false;
    if (/주말 잘 보내|좋은 주말/.test(t) && ![5, 6, 0].includes(St.weekday())) return false;
    // 지금 자세 · 접촉과 맞나 (앉아 있는데 앉자고 · 손잡고 있는데 손 달라고 하지 않는다)
    { const p = G && G.player, seated = !!(p && p.seat), ct = PX.Mind ? PX.Mind.contact() : 'NONE';
      if (seated && /여기 앉자|여기 앉아|앉을래\?|옆자리 비워|자리 맡아|앉자[.!]|벤치 가자|앉아서 얘기하자|앉아서 쉬자|좀 앉자/.test(t)) return false;
      if (!seated && /앉아 있으니까|이렇게 앉아 있|나란히 앉아 있|앉은 채로|기대 앉아 있/.test(t)) return false;
      if (seated && /걸으니까|걷는 중|걷다 보니|이렇게 걷는/.test(t)) return false;
      if (/HAND|ARM_LINK|WAIST|SIT_LEAN/.test(ct) && /손 (잡아도|잡을래|잡자|좀 줘|줘[.?!])|손이 (심심|허전|비어)|손 잡고 싶/.test(t)) return false;
      if (/HUG|EMBRACE|CUDDLE/.test(ct) && /안아 줄까|안아도 돼|안기고 싶|이리 와[.]? 안/.test(t)) return false;
    }
    // 방금 한 행동과 정반대 · 같은 걸 또 청하는 말 (15분 안)
    { const acts = PX.Mind ? (PX.Mind.mem().acts || {}) : {}, nowM = St.absMin(), did = (re) => Object.keys(acts).some(k => re.test(k) && nowM - acts[k] < 15);
      if (did(/hug|embrace|c_hug|c_backhug|c_liftHug/) && /안아 줄까|안아도 돼|안기고 싶|한 번만 안/.test(t)) return false;
      if (did(/kiss/) && /뽀뽀해도 돼|키스해도 돼|입 맞춰도 돼/.test(t)) return false;
      if (S.lastShower && nowM - S.lastShower < 90 && /씻고 와|샤워하고 와|씻어야겠다, 너|땀 냄새 나네/.test(t)) return false;
    }
    // 지붕 있는 실내에선 하늘·바람·노을을 '보는' 말을 안 한다 (창 얘기는 괜찮다)
    if (md.kind === 'in' && !md.dome && !md.stars && !/창|창가|창밖/.test(t) && /바람이 제일|이 시간 바람|바람 좋다|아침 공기|밤공기|밤바람|하늘 (봐|좀 봐|예쁘|맑|좀 보|진짜)|노을이|노을 (봐|좀)|별 (봐|보여|많|좀)|구름 (봐|좀)|해 (지|뜨)는 거|하늘 청소하는 거 보|하늘이 (흐|맑|빛)/.test(t)) return false;
    return true;
  }
  function pick(cat, list, cond = {}) {
    const S = St.S, st = S.rel.cap.stage, part = Cal.partOfDay(S.time.min), season = St.season();
    const w = PX.MAPS[PX.Game.mapId] && PX.MAPS[PX.Game.mapId].dome ? 'clear' : St.weather(); // 돔 안은 인공 기후
    const wkd = !St.isWeekend();
    const ok = list.map((bd, i) => ({ bd, i })).filter(({ bd }) => {
      if (bd.s && (st < bd.s[0] || st > bd.s[1])) return false;
      if (bd.t && !bd.t.includes(part)) return false;
      if (bd.w && !bd.w.includes(w)) return false;
      if (bd.season && !bd.season.includes(season)) return false;
      if (bd.job && bd.job !== S.player.job) return false;
      if (bd.event && !Cal.openAt(PX.LORE_BY_ID[bd.event], S.time, S.time.min)) return false; // 행사 시간 안에만
      if (bd.notJob && bd.notJob === S.player.job) return false;
      const mid = PX.Game.mapId, mOut = PX.MAPS[mid] && (PX.MAPS[mid].kind === 'out' ? mid : PX.MAPS[mid].parent);
      if (bd.notMap && (bd.notMap.includes(mid) || bd.notMap.includes(mOut))) return false;
      if (bd.map && !(bd.map.includes(mid) || bd.map.includes(mOut))) return false;
      if (bd.wd === 'weekday' && !wkd) return false;
      if (cond.act && bd.act !== cond.act) return false;
      return true;
    });
    if (!ok.length) return null;
    { const txt0 = (bd) => [].concat(bd.l || bd).filter(x => typeof x === 'string').join(' '); const okc = ok.filter(({ bd }) => ctxOk(txt0(bd))); if (okc.length) ok.splice(0, ok.length, ...okc); }
    // 기억 검사: 실제로 오래 떨어진 게 아니면 '오랜만' 류 금지 · 같은 표현(보고 싶어·귀여워·안아 줄까…)은 한동안 쉬게
    const M = PX.Mind, txt = (bd) => (bd.l || bd).filter ? (bd.l || bd).filter(x => typeof x === 'string').join(' ') : '';
    if (M) { const ok2 = ok.filter(({ bd }) => M.textOk(txt(bd))); if (ok2.length) ok.splice(0, ok.length, ...ok2); else if (ok.some(({ bd }) => /오랜만|어디 갔다 왔|한참 찾았|하루 종일 기다/.test(txt(bd)))) return null; }
    // 한 번도 안 나온 묶음부터. 다 나왔으면 가장 오래전에 나온 것들(하위 1/4) 중에서
    const used = S.recent;
    { const fresh2 = ok.filter(({ bd }) => !bundleSeen(bd)); if (fresh2.length) ok.splice(0, ok.length, ...fresh2); else if (cond.strict) return null; }
    { const nt = ok.filter(({ bd }) => !topicClash(capLinesOf(bd))); if (nt.length) ok.splice(0, ok.length, ...nt); }
    const never = ok.filter(({ i }) => used[cat + i] == null);
    const pool = never.length ? never : ok.slice().sort((a, b) => (used[cat + a.i] || 0) - (used[cat + b.i] || 0)).slice(0, Math.max(1, Math.ceil(ok.length / 4)));
    const weighted = [];
    for (const p of pool) { weighted.push(p); if (p.bd.w || p.bd.event || p.bd.job || p.bd.t) weighted.push(p, p); }
    const chosen = U.pick(weighted);
    used[cat + chosen.i] = St.absMin();
    if (M) { M.notePhrases(txt(chosen.bd)); M.noteLine(cat + '#' + chosen.i); }
    return chosen.bd;
  }

  // ---------- 대위와 대화 ----------
  async function capTalk(forceCat) {
    const S = St.S, r = S.rel.cap, G = PX.Game, D = PX.DLG_CAP;
    const cap = G.cap;
    if (!cap || cap.map !== G.mapId || cap.hidden) return; // 없는 사람과는 대화하지 않는다
    if (S.rel.cap.stage >= 4 && !S.player.callCap && !forceCat) { G.modal++; await askCall(); close(); G.modal--; return; } // 연인인데 아직 호칭을 안 정했으면 먼저
    const min = S.time.min, part = Cal.partOfDay(min);
    const firstToday = r.lastTalkDay !== S.day;
    const backoff = r.backoffUntil > St.absMin();
    let cat = forceCat;
    const duty = PX.Cap.onDuty();
    // 마지막 대화·만남 이후 흐른 시간과 지금 접촉 상태를 먼저 본다 (방금 얘기한 사람한테 '오랜만'이라고 하지 않게)
    const M = PX.Mind, V = PX.DLG_V2 || {}, ct = M ? M.contact() : 'NONE';
    // 계속 같이 있었으면 '또 봤네' '잠깐 사이에 뭐 했어?' 같은 다시 만난 인사는 하지 않는다
    const together = ['follow', 'visit', 'stay'].includes(PX.Cap.mode) && PX.Game.cap.map === PX.Game.mapId;
    let gc = M ? M.gapCat() : 'again';
    if (together && ['brief', 'recontact', 'again'].includes(gc)) gc = 'cont';
    if (!cat) {
      if (duty && PX.Cap.atPlayerWork()) cat = 'jobVisit';
      else if (duty && !PX.Cap.isMeal()) cat = 'working';
      else if (gc === 'reunion') cat = 'v:reunion';
      else if (S.cap.op && S.cap.op.phase === 'planned' && !S.cap.op.inPerson) { S.cap.op.inPerson = true; S.cap.op.told = true; cat = S.cap.op.joint ? 'v:opJoint' : 'v:opBefore'; }
      else if (PX.Situ && !backoff && PX.Situ.hasFresh(3) && Math.random() < 0.85) cat = 'situ'; // 장소·시간·상황이 딱 맞는 대사가 있으면 우선
      else if ((gc === 'cont' || gc === 'brief') && Math.random() < 0.55) cat = 'v:' + gc;
      else if (gc === 'recontact' && Math.random() < 0.4) cat = 'v:recontact';
      else if (gc === 'long' || gc === 'miss') cat = 'v:' + gc;
      else if (PX.Situ && !backoff && PX.Situ.hasFresh(2) && Math.random() < 0.8) cat = 'situ'; // 지금 장소·시간·상황에 딱 맞는 대사가 있으면 그걸로
      else if (gc === 'again' && Math.random() < 0.45) cat = 'v:again';
      else if (ct !== 'NONE' && Math.random() < 0.45) cat = M.isHug() ? 'v:c_hug' : ct === 'HAND_HOLD' ? 'v:c_hand' : ct === 'WAIST_HOLD' ? 'v:c_waist' : 'v:c_walk';
      else if (PX.Cap.mode === 'follow' && Math.random() < 0.2) cat = 'v:c_walk';
      else if (firstToday && gc === 'again') cat = part === 'morning' ? 'morning' : part === 'noon' ? 'lunch' : (min >= 17 * 60 && min < 21 * 60) ? 'offwork' : part === 'night' ? 'night' : 'greet';
      else if (S.lastRival && St.absMin() - S.lastRivalMin < 90 && !backoff && Math.random() < 0.6) cat = 'jealousy';
      else if ((S.energy < 30 || ['dust', 'rain'].includes(St.weather())) && Math.random() < 0.4) cat = 'worry';
      else {
        const opts = backoff ? ['praise', 'worry', 'dateAsk'] : ['tease', 'tease', 'praise', 'aegyo', 'flirt', 'dateAsk', 'aegyo'];
        if (gc === 'again') opts.push('greet');
        if (!backoff && r.stage >= 2) opts.push('explicit', 'flirt');
        if (part === 'night') opts.push('night');
        cat = U.pick(opts);
        const X = PX.DLG_CAP2;
        if (X && X.place[G.mapId] && Math.random() < 0.32) cat = 'place';
        else if (X && Math.random() < 0.22) cat = 'small';
        else if (PX.Ask && Math.random() < 0.3) cat = 'qa';
      }
    }
    let bd = cat === 'situ' ? PX.Situ.pick(2) : cat.startsWith('v:') ? pick('v_' + cat.slice(2), V[cat.slice(2)] || []) : cat === 'jobVisit' ? pick('jv_' + S.player.job, D.jobVisit[S.player.job]) : cat === 'place' ? pick('pl_' + G.mapId, PX.DLG_CAP2.place[G.mapId]) : cat === 'qa' ? pick('qa', PX.Ask.QA) : cat === 'small' ? pick('small', PX.DLG_CAP2.small) : pick(cat, D[cat]);
    if (cat === 'v:reunion' && M) M.mem().reunion = null;
    if (!forceCat && !cat.startsWith('v:') && cat !== 'jobVisit' && cat !== 'working' && PX.CapAct && Math.random() < 0.5) { const cb = PX.CapAct.talkBundle(); if (cb) { bd = cb; cat = 'ctx'; } }
    if (!bd) bd = pick('small', PX.DLG_CAP2.small) || pick('praise', D.praise);
    if (bd && bundleSeen(bd)) { // 이 상황 묶음은 다 들었다 → 아직 안 들은 말이 있는 곳에서
      const alt = (PX.Situ && PX.Situ.pick(1, true)) || pick('qa', PX.Ask ? PX.Ask.QA : [], { strict: true }) || (PX.DLG_CAP2 && PX.DLG_CAP2.place[G.mapId] && pick('pl_' + G.mapId, PX.DLG_CAP2.place[G.mapId], { strict: true })) || pick('small', PX.DLG_CAP2.small, { strict: true })
        || ['praise', 'tease', 'aegyo', 'greet', 'worry', ...(r.stage >= 2 ? ['flirt'] : []), ...(part === 'night' ? ['night'] : [])].map(k => D[k] && pick(k, D[k], { strict: true })).find(Boolean);
      if (alt) { bd = alt; cat = alt.situ ? 'situ' : cat; }
    }
    const refuse = ['tease', 'flirt', 'explicit', 'aegyo'].includes(cat) || (cat === 'situ' && bd && bd.tease);
    G.modal++;
    cap.setDirTo(G.player.x, G.player.y); G.player.setDirTo(cap.x, cap.y);
    const res = await runLines(bd.l, { refuse, reply: true });
    if (cat === 'jealousy') S.lastRival = null; // 대사가 끝난 뒤에 지운다
    let gain = res.aff;
    if (firstToday) { gain += 4; r.talksToday = 0; }
    else if (r.talksToday < 5) gain += 1;
    r.talksToday++; r.lastTalkDay = S.day; S.stats.talks++;
    if (M) M.noteTalk(cat);
    if (res.tags.includes('hurt')) { await apology(); }
    else if (res.tags.includes('alone')) { r.noFollowUntil = nextMorning(); PX.Cap.release(); }
    St.addAff(gain);
    close(); G.modal--;
    if (!res.tags.includes('hurt')) await maybeConfess();
    return res;
  }
  async function apology() {
    const S = St.S, r = S.rel.cap;
    const bd = pick('apology', PX.DLG_CAP.apology);
    await runLines(bd.l);
    r.backoffUntil = St.absMin() + (24 * 60 - S.time.min) + 6 * 60; // 다음 날 아침까지 장난 멈춤
    r.lastHurtDay = S.day;
    PX.Game.cap.showEmote('sweat', 3);
    if (!S.done.firstApology) { S.done.firstApology = 1; PX.Game.memory('사과', `${PX.U.josa(S.capName, '이')} 장난을 멈추고 먼저 사과했다. "다음엔 바로 멈출게."`); }
  }
  const nextMorning = () => { const S = St.S; return (S.day + (S.time.min >= 6 * 60 ? 1 : 0)) * 1440 + 6 * 60; };

  // 고백 이벤트 (고백 직전 단계, 호감도 충분)
  // 연인이 되면 서로 반말. 나는 대위를 뭐라고 부를지 고른다 (나중에 설정에서 바꿀 수 있다)
  async function askCall() {
    const S = St.S, again = !!S.player.callCap;
    await runLines(again ? ['C*:호칭 바꾸고 싶어? 뭐든 좋아. 뭐라고 부를 건데?'] : ['C*:이제 대위님은 그만. 근무 밖에선 반말해. 나도 그럴 거니까.', 'C^:뭐라고 부를 거야?']);
    const i = await choose([{ t: '오빠.' }, { t: '자기야.' }]);
    S.player.callCap = i === 0 ? '오빠' : '자기';
    await say('player', i === 0 ? '…오빠.' : '…자기야.', 'blush');
    await runLines(again ? [i === 0 ? 'C~:…오빠. 좋다. 몇 번을 들어도.' : 'C~:자기야. 응. 그것도 좋아.'] : [i === 0 ? 'C!:…' : 'C~:…', i === 0 ? 'C~:한 번 더. 아니, 계속 그렇게 불러.' : 'C~:와. 이거 생각보다 세다. 심장에.', 'C^:나도 이제 너 자기라고 부를 거야. 싫으면 말하고.']);
  }
  async function maybeConfess() {
    const S = St.S, r = S.rel.cap;
    if (r.stage !== 3 || r.aff < St.THRESH[4] || r.confessDay === S.day) return;
    if (r.confessAsked && S.day - r.confessAsked < 3) return;
    r.confessDay = S.day; r.confessAsked = S.day;
    const G = PX.Game; G.modal++;
    await runLines(PX.DLG_CAP.confess);
    const i = await choose([{ t: '저도 좋아요. 사귀어요.' }, { t: '조금만 더 생각해 볼게요.' }, { t: '지금처럼 지내고 싶어요.' }]);
    if (i === 0) {
      await say('player', '저도 좋아요. 사귀어요.', 'blush');
      await runLines(PX.DLG_CAP.confessYes);
      r.stage = 4; r.loverSince = S.day; St.addAff(20);
      G.cap.showEmote('heart', 4);
      await askCall();
      G.memory('고백', `${PX.U.josa(S.capName, '이')} 진지하게 고백했다. 오늘부터 연인.`, true);
      PX.UI.toast('💗 연인이 되었다!');
    } else if (i === 1) { await say('player', '조금만 더 생각해 볼게요.'); await runLines(PX.DLG_CAP.confessWait); }
    else { await say('player', '지금처럼 지내고 싶어요.'); await runLines(PX.DLG_CAP.confessNo); r.aff = St.THRESH[4] - 60; r.confessAsked = S.day + 7; }
    close(); G.modal--;
  }

  // ---------- NPC 대화 ----------
  async function npcTalk(npc) { npcActive = npc.id; try { return await npcTalk0(npc); } finally { npcActive = null; } }
  async function npcTalk0(npc) {
    const S = St.S, d = npc.def, r = S.rel.npc[npc.id];
    const part = Cal.partOfDay(S.time.min), w = St.weather();
    const L = d.lines || {};
    const PS = (PX.PERSONA || {})[npc.id];
    const capLine = (t) => /대위|\{c/.test(t);
    const talkCap = S.rel.cap.stage >= 1 && Math.random() < 0.12; // 대위 얘기는 가끔만
    let pool = (L.g || []).filter(t => talkCap || !capLine(t));
    if (PS) pool.push(...PS.p, ...PS.p);
    if (part === 'morning' && L.m) pool.push(...L.m, ...L.m);
    if ((part === 'evening' || part === 'night') && (L.e || L.night)) pool.push(...(L.e || []), ...(L.night || []));
    if (w === 'rain' && L.rain) pool.push(...L.rain, ...L.rain);
    if (L.cap && talkCap) pool = L.cap.slice();
    if (L.job && L.job[S.player.job]) pool.push(...L.job[S.player.job], ...L.job[S.player.job]);
    // 지금 하고 있는 일에 맞는 말 (운동 중엔 운동 이야기, 식사 중엔 밥 이야기…)
    const act = npc.activity(), A = PX.NPC_ACT;
    if (act && A[act]) {
      const t = d.banmal && !['cook', 'work_cmd'].includes(act) ? (A.banmal[act] || []) : A[act].talk;
      if (!talkCap) pool.push(...t, ...t); if (act === 'sleep' && t.length) pool = t.slice();
    }
    const outdoor = PX.MAPS[npc.map] && PX.MAPS[npc.map].kind === 'out' && !PX.MAPS[npc.map].dome;
    if (!d.banmal) { // 날씨·인사 공통 대사는 존댓말이라 존댓말 쓰는 사람만
      if (outdoor && A.weather[w]) pool.push(...A.weather[w], ...A.weather[w]);
      if (part === 'morning') pool.push(...A.weather.morning); else if (part === 'night') pool.push(...A.weather.night);
    }
    // 오늘 행사 안내
    const ev = PX.Cal.eventsOn(S.time);
    const evLine = ev.length ? (d.banmal ? `오늘 ${ev[0].originalTitle} 있는 날이야.${ev[0].startTime ? ' ' + ev[0].startTime + '부터.' : ''}` : `오늘 ${ev[0].originalTitle} 있는 날이에요.${ev[0].startTime ? ' ' + ev[0].startTime + '부터요.' : ''}`) : null;
    if (evLine && act !== 'sleep' && !(S.recent['npc_' + npc.id] || []).includes(evLine) && Math.random() < 0.25) pool = [evLine];
    const key = 'npc_' + npc.id;
    const recent = S.recent[key] || [];
    { const fit = pool.filter(t => ctxOk(t)); if (fit.length) pool = fit; }
    let cand = pool.filter(t => !recent.includes(t));
    if (!cand.length) cand = pool;
    let line = U.pick(cand).replace(/\{cs\}/g, PX.Cap.status());
    S.recent[key] = [line, ...recent].slice(0, Math.max(1, pool.length - 2));
    const G = PX.Game; G.modal++;
    npc.setDirTo(G.player.x, G.player.y); G.player.setDirTo(npc.x, npc.y);
    { const f = r.f || 0, busy = ['workout', 'cook', 'grill', 'work_hangar', 'work_med', 'guard', 'sleep', 'eat'].includes(act);
      if (!busy && !npc.seat && (r.lastTalkDay !== S.day)) npc.doPose('wave', 1.2);
      if (f >= 70 && Math.random() < 0.4) npc.showEmote('heart', 1.6); else if (/[!]$/.test(line) && Math.random() < 0.5) npc.showEmote('note', 1.4); }
    const said = U.fmt(line, ctx());
    await say(npc.id, said, 'smile');
    if (PX.Reply && PX.Reply.isQ(said) && act !== 'sleep') { const rr = await PX.Reply.ask(npc.id, said); if (rr.aff) St.addNpcF(npc.id, rr.aff); if (r.lastTalkDay !== S.day) { St.addNpcF(npc.id, 3); r.lastTalkDay = S.day; } r.talks++; close(); G.modal--; return; }
    // 이어서: 궁금한 것 물어보기 · (아티팩트) 자유롭게 이야기하기
    // 같은 질문은 한동안 다시 나오지 않는다 (기록: 물어본 날) · 일주일 뒤에 다시 물으면 '전에 말했죠' 하고 답한다
    S.done.npcAsked = S.done.npcAsked || {};
    const AK = S.done.npcAsked, askOk = (i) => AK[npc.id + i] == null || S.day - AK[npc.id + i] >= 7;
    const fresh = PS && PS.ask.some((q, i) => askOk(i));
    if (PS && act !== 'sleep' && (fresh || (PX.AI && PX.AI.available()))) {
      const qs = PS.ask.map((q, i) => ({ q, i })).filter(x => askOk(x.i)).sort((a, b) => (AK[npc.id + a.i] == null ? -1 : AK[npc.id + a.i]) - (AK[npc.id + b.i] == null ? -1 : AK[npc.id + b.i]));
      const q = qs[0];
      const opts = q ? [{ t: '❓ ' + q.q[0] }] : []; const ai = PX.AI && PX.AI.available();
      if (ai) opts.push({ t: '✨ 자유롭게 이야기하기' });
      opts.push({ t: '다음에 또 봐요.' });
      let i = await choose(opts); if (!q) i++;
      if (i === 0) { const again = AK[npc.id + q.i] != null; AK[npc.id + q.i] = S.day; await say('player', q.q[0]); const d = PX.NPC_BY_ID[npc.id]; await say(npc.id, (again ? (d && d.banmal ? '전에도 말했지만, ' : '전에도 말씀드렸는데, ') : '') + U.fmt(q.q[1], ctx()), 'smile'); if (!again) St.addNpcF(npc.id, 2); }
      else if (ai && i === 1) { if (r.lastTalkDay !== S.day) { St.addNpcF(npc.id, 3); r.lastTalkDay = S.day; } r.talks++; close(); G.modal--; return PX.AI.chat(npc); }
    }
    if (r.lastTalkDay !== S.day) { St.addNpcF(npc.id, 3); r.lastTalkDay = S.day; }
    r.talks++;
    close(); G.modal--;
    if (!['kang', 'nam', 'ryu', 'moon', 'song'].includes(npc.id)) { S.lastRival = d.name.slice(1); S.lastRivalMin = St.absMin(); }
  }

  // 대위 대사 후보 중 아직 안 한 말부터 (한 줄짜리든 여러 줄 묶음이든)
  const recentCap = []; // 방금 한 말 (같은 만남 안에서 같은 주제를 두 번 묻지 않게)
  const recentCapText = (mins = 20) => recentCap.filter(x => St.absMin() - x.at <= mins).map(x => x.t).join(' ');
  // 방금(20분 안) 물어본 주제를 또 묻는 묶음인가 (대위의 질문 줄만 본다)
  const TOPICS = [/밥|먹었|먹을래|식당|메뉴|냉삼|배고/, /어땠|하루|뭐 했|별일|그새/, /피곤|지쳐|잘 잤|아파|안색/, /걸을래|산책|걷자/, /비번|주말|계획/, /보고 싶었|보고 싶어/];
  function topicClash(lines) {
    const just = recentCapText(20); if (!just) return false;
    const qs = lines.filter(l => /\?\s*$/.test(l)).join(' '); if (!qs) return false;
    return TOPICS.some(re => re.test(just) && re.test(qs));
  }
  function capPick(arr) {
    if (!arr || !arr.length) return undefined;
    const first = (x) => String(Array.isArray(x) ? (x.find(y => typeof y === 'string' && /^C/.test(y) && !tooShort(y.replace(/^C[*^;!~]?:/, ''))) || x.find(y => typeof y === 'string' && /^C/.test(y)) || x[0]) : x).replace(/^C[*^;!~]?:/, '');
    const all = (x) => [].concat(x).filter(y => typeof y === 'string').join(' ');
    const fit = arr.filter(x => ctxOk(all(x))), base = fit.length ? fit : arr; // 지금 상황에 맞는 것만 (없으면 그대로)
    const un = base.filter(x => !capSaid(first(x)));
    return U.pickFresh('cp' + U.hash(arr.map(first).join('|')), un.length ? un : base);
  }
  return { topicClash, recentCapText, capPick, capSaid, noteCapSaid, bundleSeen, askCall, lover, polite, capTone, toCap, ctxOk, reset, thinking, init, say, choose, close, runLines, pick, capTalk, npcTalk, apology, maybeConfess, get open() { return open; }, ctx };
})();
