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
  const ctx = () => { const S = St.S, r = S.rel.cap, op = S.cap.op; return { p: S.player.name, c: S.capName, rival: S.lastRival || '', days: op ? op.days : 3, n: r.loverSince != null ? S.day - r.loverSince : 100 }; };

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
  function sayNow(speaker, text, face) {
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
        const b = U.el('button', { class: 'choice' + (o.hurt ? ' hurt' : '') }, o.t);
        b.addEventListener('click', (e) => { e.stopPropagation(); if (navigator.vibrate) try { navigator.vibrate(8); } catch (_) {} chEl.classList.add('hidden'); res(i); });
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
  function close() { open = false; box.classList.add('hidden'); chEl.classList.add('hidden'); }

  // 대사 줄 실행 → { aff, tags }
  async function runLines(lines, opt = {}) {
    const res = { aff: 0, tags: [] };
    const c = ctx();
    let replied = false, skipQ = false;
    const capHere = () => { const G = PX.Game; return !!(G.cap && (G.cap.atDoor || (G.cap.map === G.mapId && !G.cap.hidden))); };
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
    // 기억 검사: 실제로 오래 떨어진 게 아니면 '오랜만' 류 금지 · 같은 표현(보고 싶어·귀여워·안아 줄까…)은 한동안 쉬게
    const M = PX.Mind, txt = (bd) => (bd.l || bd).filter ? (bd.l || bd).filter(x => typeof x === 'string').join(' ') : '';
    if (M) { const ok2 = ok.filter(({ bd }) => M.textOk(txt(bd))); if (ok2.length) ok.splice(0, ok.length, ...ok2); else if (ok.some(({ bd }) => /오랜만|어디 갔다 왔|한참 찾았|하루 종일 기다/.test(txt(bd)))) return null; }
    const used = S.recent;
    const fresh = ok.filter(({ i }) => !(used[cat + i] && S.day - used[cat + i] < 4));
    // 조건이 붙은 묶음(날씨·행사 등)을 조금 더 자주
    const pool = fresh.length ? fresh : ok.sort((a, b) => (used[cat + a.i] || 0) - (used[cat + b.i] || 0)).slice(0, 2);
    const weighted = [];
    for (const p of pool) { weighted.push(p); if (p.bd.w || p.bd.event || p.bd.job || p.bd.t) weighted.push(p, p); }
    const chosen = U.pick(weighted);
    used[cat + chosen.i] = S.day;
    if (M) { M.notePhrases(txt(chosen.bd)); M.noteLine(cat + '#' + chosen.i); }
    return chosen.bd;
  }

  // ---------- 대위와 대화 ----------
  async function capTalk(forceCat) {
    const S = St.S, r = S.rel.cap, G = PX.Game, D = PX.DLG_CAP;
    const cap = G.cap;
    if (!cap || cap.map !== G.mapId || cap.hidden) return; // 없는 사람과는 대화하지 않는다
    const min = S.time.min, part = Cal.partOfDay(min);
    const firstToday = r.lastTalkDay !== S.day;
    const backoff = r.backoffUntil > St.absMin();
    let cat = forceCat;
    const duty = PX.Cap.onDuty();
    // 마지막 대화·만남 이후 흐른 시간과 지금 접촉 상태를 먼저 본다 (방금 얘기한 사람한테 '오랜만'이라고 하지 않게)
    const M = PX.Mind, V = PX.DLG_V2 || {}, gc = M ? M.gapCat() : 'again', ct = M ? M.contact() : 'NONE';
    if (!cat) {
      if (duty && PX.Cap.atPlayerWork()) cat = 'jobVisit';
      else if (duty && !PX.Cap.isMeal()) cat = 'working';
      else if (gc === 'reunion') cat = 'v:reunion';
      else if (S.cap.op && S.cap.op.phase === 'planned' && !S.cap.op.inPerson) { S.cap.op.inPerson = true; S.cap.op.told = true; cat = S.cap.op.joint ? 'v:opJoint' : 'v:opBefore'; }
      else if ((gc === 'cont' || gc === 'brief') && Math.random() < 0.55) cat = 'v:' + gc;
      else if (gc === 'recontact' && Math.random() < 0.4) cat = 'v:recontact';
      else if (gc === 'long' || gc === 'miss') cat = 'v:' + gc;
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
    let bd = cat.startsWith('v:') ? pick('v_' + cat.slice(2), V[cat.slice(2)] || []) : cat === 'jobVisit' ? pick('jv_' + S.player.job, D.jobVisit[S.player.job]) : cat === 'place' ? pick('pl_' + G.mapId, PX.DLG_CAP2.place[G.mapId]) : cat === 'qa' ? pick('qa', PX.Ask.QA) : cat === 'small' ? pick('small', PX.DLG_CAP2.small) : pick(cat, D[cat]);
    if (cat === 'v:reunion' && M) M.mem().reunion = null;
    if (!forceCat && !cat.startsWith('v:') && cat !== 'jobVisit' && cat !== 'working' && PX.CapAct && Math.random() < 0.5) { const cb = PX.CapAct.talkBundle(); if (cb) { bd = cb; cat = 'ctx'; } }
    if (!bd) bd = pick('small', PX.DLG_CAP2.small) || pick('praise', D.praise);
    const refuse = ['tease', 'flirt', 'explicit', 'aegyo'].includes(cat);
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
      G.memory('고백', `${PX.U.josa(S.capName, '이')} 진지하게 고백했다. 오늘부터 연인.`, true);
      PX.UI.toast('💗 연인이 되었다!');
    } else if (i === 1) { await say('player', '조금만 더 생각해 볼게요.'); await runLines(PX.DLG_CAP.confessWait); }
    else { await say('player', '지금처럼 지내고 싶어요.'); await runLines(PX.DLG_CAP.confessNo); r.aff = St.THRESH[4] - 60; r.confessAsked = S.day + 7; }
    close(); G.modal--;
  }

  // ---------- NPC 대화 ----------
  async function npcTalk(npc) {
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
    let cand = pool.filter(t => !recent.includes(t));
    if (!cand.length) cand = pool;
    let line = U.pick(cand).replace(/\{cs\}/g, PX.Cap.status());
    S.recent[key] = [line, ...recent].slice(0, Math.max(1, pool.length - 2));
    const G = PX.Game; G.modal++;
    npc.setDirTo(G.player.x, G.player.y); G.player.setDirTo(npc.x, npc.y);
    // 부탁(퀘스트) 전달
    const q = (S.quests || []).find(q => q.npc === npc.id && !q.done);
    if (q && St.has(q.item)) {
      const it = PX.ITEMS[q.item];
      const i = await choose([{ t: `${it.icon} 부탁하신 ${it.name} 여기요.` }, { t: '그냥 얘기하러 왔어요.' }]);
      if (i === 0) {
        await say('player', `부탁하신 ${it.name} 여기요.`);
        St.addItem(q.item, -1); q.done = true; S.money += q.reward; St.addNpcF(npc.id, 8); S.stats.quests = (S.stats.quests || 0) + 1;
        await say(npc.id, U.pick(d.banmal ? ['오, 구해 왔네. 고맙다. 이건 사례야.', '덕분에 살았다. 받아 둬.'] : ['와, 진짜 고마워요! 이건 사례예요.', '구해 주셨네요! 덕분에 살았어요.', '역시 믿을 만해요. 받아 주세요.']), 'smile');
        PX.UI.toast(`✅ 부탁 완료 · ₢${q.reward} · ${d.name}와(과) 친해졌다`.replace('와(과)', U.hasBatchim(d.name) ? '과' : '와'));
        close(); G.modal--; return;
      }
    } else if (q && Math.random() < 0.5) {
      line = d.banmal ? `아, ${PX.ITEMS[q.item].name} 구하면 나 좀 줘. ${q.hint.replace(/에요\.$/, '야.').replace(/있어요\.$/, '있어.').replace(/팔아요\.$/, '팔아.').replace(/거예요\.$/, '거야.').replace(/더라고요\.$/, '더라.')}` : `아, 혹시 ${PX.ITEMS[q.item].name} 구하면 저 좀 주실래요? ${q.hint}`;
    }
    { const f = r.f || 0, busy = ['workout', 'cook', 'grill', 'work_hangar', 'work_med', 'guard', 'sleep', 'eat'].includes(act);
      if (!busy && !npc.seat && (r.lastTalkDay !== S.day)) npc.doPose('wave', 1.2);
      if (f >= 70 && Math.random() < 0.4) npc.showEmote('heart', 1.6); else if (/[!]$/.test(line) && Math.random() < 0.5) npc.showEmote('note', 1.4); }
    const said = U.fmt(line, ctx());
    await say(npc.id, said, 'smile');
    if (PX.Reply && PX.Reply.isQ(said) && act !== 'sleep') { const rr = await PX.Reply.ask(npc.id, said); if (rr.aff) St.addNpcF(npc.id, rr.aff); if (r.lastTalkDay !== S.day) { St.addNpcF(npc.id, 3); r.lastTalkDay = S.day; } r.talks++; close(); G.modal--; return; }
    // 이어서: 궁금한 것 물어보기 · (아티팩트) 자유롭게 이야기하기
    const fresh = PS && PS.ask.some((q, i) => !(S.done.askSeen || {})[npc.id + i]);
    if (PS && act !== 'sleep' && (fresh || (PX.AI && PX.AI.available()) || Math.random() < 0.25)) {
      S.done.askSeen = S.done.askSeen || {};
      const qs = PS.ask.map((q, i) => ({ q, i })).sort((a, b) => (S.done.askSeen[npc.id + a.i] || 0) - (S.done.askSeen[npc.id + b.i] || 0));
      const q = qs[0];
      const opts = [{ t: '❓ ' + q.q[0] }]; const ai = PX.AI && PX.AI.available();
      if (ai) opts.push({ t: '✨ 자유롭게 이야기하기' });
      opts.push({ t: '다음에 또 봐요.' });
      const i = await choose(opts);
      if (i === 0) { S.done.askSeen[npc.id + q.i] = (S.done.askSeen[npc.id + q.i] || 0) + 1; await say('player', q.q[0]); await say(npc.id, U.fmt(q.q[1], ctx()), 'smile'); if (S.done.askSeen[npc.id + q.i] === 1) St.addNpcF(npc.id, 2); }
      else if (ai && i === 1) { if (r.lastTalkDay !== S.day) { St.addNpcF(npc.id, 3); r.lastTalkDay = S.day; } r.talks++; close(); G.modal--; return PX.AI.chat(npc); }
    }
    if (r.lastTalkDay !== S.day) { St.addNpcF(npc.id, 3); r.lastTalkDay = S.day; }
    r.talks++;
    close(); G.modal--;
    if (!['kang', 'nam', 'ryu', 'moon', 'song'].includes(npc.id)) { S.lastRival = d.name.slice(1); S.lastRivalMin = St.absMin(); }
  }

  return { reset, thinking, init, say, choose, close, runLines, pick, capTalk, npcTalk, apology, maybeConfess, get open() { return open; }, ctx };
})();
