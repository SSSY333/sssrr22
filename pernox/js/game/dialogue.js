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
  const ctx = () => ({ p: St.S.player.name, c: St.S.capName, rival: St.S.lastRival || '' });

  function portrait(speaker, face) {
    const g = portEl.getContext('2d');
    g.clearRect(0, 0, portEl.width, portEl.height);
    let app = null;
    if (speaker === 'cap') app = PX.Game.cap.app;
    else if (speaker === 'player') app = PX.Game.player.app;
    else if (PX.NPC_BY_ID[speaker]) app = PX.NPC_BY_ID[speaker].look;
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
  function say(speaker, text, face) {
    return new Promise(res => {
      open = true; box.classList.remove('hidden'); chEl.innerHTML = ''; chEl.classList.add('hidden');
      const nm = speaker === 'cap' ? St.S.capName : speaker === 'player' ? St.S.player.name : speaker === 'narr' ? '' : (PX.NPC_BY_ID[speaker] || { name: speaker }).name;
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
      typing = setInterval(() => { i += 2; textEl.textContent = text.slice(0, i); if (i >= text.length) finish(); }, 28);
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
  function choose(opts) {
    return new Promise(res => {
      chEl.innerHTML = ''; chEl.classList.remove('hidden'); nextEl.classList.add('hidden');
      box.classList.remove('hidden');
      opts.forEach((o, i) => {
        const b = U.el('button', { class: 'choice' + (o.hurt ? ' hurt' : '') }, (i + 1) + '. ' + o.t);
        b.addEventListener('click', (e) => { e.stopPropagation(); document.removeEventListener('keydown', onKey); chEl.classList.add('hidden'); res(i); });
        chEl.append(b);
      });
      const onKey = (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= opts.length) { document.removeEventListener('keydown', onKey); chEl.classList.add('hidden'); res(n - 1); } };
      document.addEventListener('keydown', onKey);
    });
  }
  function close() { open = false; box.classList.add('hidden'); chEl.classList.add('hidden'); }

  // 대사 줄 실행 → { aff, tags }
  async function runLines(lines, opt = {}) {
    const res = { aff: 0, tags: [] };
    const c = ctx();
    for (const ln of lines) {
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
      const m = /^([CPN])([*^;!~]?):(.*)$/.exec(ln);
      if (!m) { await say('narr', U.fmt(ln, c)); continue; }
      const who = m[1] === 'C' ? (opt.speaker || 'cap') : m[1] === 'P' ? 'player' : 'narr';
      const face = m[2] ? FACES[m[2]] : (m[1] === 'P' ? 'normal' : 'normal');
      await say(who, U.fmt(m[3], c), m[1] === 'P' && m[2] === '!' ? 'blush' : face);
    }
    if (opt.refuse && !lines.some(l => typeof l === 'object')) {
      const i = await choose([{ t: '…(웃는다)' }, { t: '대위님도 참.' }, { t: '그런 말은 좀 싫어요.', hurt: true }]);
      if (i === 0) res.aff += 2; else if (i === 1) { await say('player', '대위님도 참.'); res.aff += 1; }
      else { await say('player', '그런 말은 좀 싫어요.'); res.tags.push('hurt'); }
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
      if (bd.wd === 'weekday' && !wkd) return false;
      if (cond.act && bd.act !== cond.act) return false;
      return true;
    });
    if (!ok.length) return null;
    const used = S.recent;
    const fresh = ok.filter(({ i }) => !(used[cat + i] && S.day - used[cat + i] < 4));
    // 조건이 붙은 묶음(날씨·행사 등)을 조금 더 자주
    const pool = fresh.length ? fresh : ok.sort((a, b) => (used[cat + a.i] || 0) - (used[cat + b.i] || 0)).slice(0, 2);
    const weighted = [];
    for (const p of pool) { weighted.push(p); if (p.bd.w || p.bd.event || p.bd.job || p.bd.t) weighted.push(p, p); }
    const chosen = U.pick(weighted);
    used[cat + chosen.i] = S.day;
    return chosen.bd;
  }

  // ---------- 대위와 대화 ----------
  async function capTalk(forceCat) {
    const S = St.S, r = S.rel.cap, G = PX.Game, D = PX.DLG_CAP;
    const cap = G.cap;
    const min = S.time.min, part = Cal.partOfDay(min);
    const firstToday = r.lastTalkDay !== S.day;
    const backoff = r.backoffUntil > St.absMin();
    let cat = forceCat;
    const duty = PX.Cap.onDuty();
    if (!cat) {
      if (duty && PX.Cap.atPlayerWork()) cat = 'jobVisit';
      else if (duty && !PX.Cap.isMeal()) cat = 'working';
      else if (firstToday) cat = part === 'morning' ? 'morning' : part === 'noon' ? 'lunch' : (min >= 17 * 60 && min < 21 * 60) ? 'offwork' : part === 'night' ? 'night' : 'greet';
      else if (S.lastRival && St.absMin() - S.lastRivalMin < 90 && !backoff && Math.random() < 0.6) cat = 'jealousy';
      else if ((S.energy < 30 || ['dust', 'rain'].includes(St.weather())) && Math.random() < 0.4) cat = 'worry';
      else {
        const opts = backoff ? ['greet', 'praise', 'worry', 'dateAsk'] : ['tease', 'tease', 'praise', 'aegyo', 'flirt', 'greet', 'dateAsk', 'aegyo'];
        if (!backoff && r.stage >= 2) opts.push('explicit', 'flirt');
        if (part === 'night') opts.push('night');
        cat = U.pick(opts);
      }
    }
    let bd = cat === 'jobVisit' ? pick('jv_' + S.player.job, D.jobVisit[S.player.job]) : pick(cat, D[cat]);
    if (!bd) bd = pick('greet', D.greet);
    const refuse = ['tease', 'flirt', 'explicit', 'aegyo'].includes(cat);
    G.modal++;
    cap.setDirTo(G.player.x, G.player.y); G.player.setDirTo(cap.x, cap.y);
    const res = await runLines(bd.l, { refuse });
    if (cat === 'jealousy') S.lastRival = null; // 대사가 끝난 뒤에 지운다
    let gain = res.aff;
    if (firstToday) { gain += 4; r.talksToday = 0; }
    else if (r.talksToday < 5) gain += 1;
    r.talksToday++; r.lastTalkDay = S.day; S.stats.talks++;
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
    let pool = [...(L.g || [])];
    if (part === 'morning' && L.m) pool.push(...L.m, ...L.m);
    if ((part === 'evening' || part === 'night') && (L.e || L.night)) pool.push(...(L.e || []), ...(L.night || []));
    if (w === 'rain' && L.rain) pool.push(...L.rain, ...L.rain);
    if (L.cap && S.rel.cap.stage >= 1) pool.push(...L.cap);
    if (L.job && L.job[S.player.job]) pool.push(...L.job[S.player.job], ...L.job[S.player.job]);
    // 오늘 행사 안내
    const ev = PX.Cal.eventsOn(S.time);
    if (ev.length && Math.random() < 0.35) pool = [`오늘 ${ev[0].originalTitle} 있는 날이에요. ${ev[0].startTime ? ev[0].startTime + '부터요.' : ''}`];
    const key = 'npc_' + npc.id;
    const recent = S.recent[key] || [];
    let cand = pool.filter(t => !recent.includes(t));
    if (!cand.length) cand = pool;
    let line = U.pick(cand);
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
        await say(npc.id, U.pick(['와, 진짜 고마워요! 이건 사례예요.', '구해 주셨네요! 덕분에 살았어요.', '역시 믿을 만해요. 받아 주세요.']), 'smile');
        PX.UI.toast(`✅ 부탁 완료 · ₢${q.reward} · ${d.name}와(과) 친해졌다`.replace('와(과)', U.hasBatchim(d.name) ? '과' : '와'));
        close(); G.modal--; return;
      }
    } else if (q && Math.random() < 0.5) {
      line = `아, 혹시 ${PX.ITEMS[q.item].name} 구하면 저 좀 주실래요? ${q.hint}`;
    }
    await say(npc.id, U.fmt(line, ctx()), 'smile');
    if (r.lastTalkDay !== S.day) { St.addNpcF(npc.id, 3); r.lastTalkDay = S.day; }
    r.talks++;
    close(); G.modal--;
    if (!['kang', 'nam', 'ryu', 'moon', 'song'].includes(npc.id)) { S.lastRival = d.name.slice(1); S.lastRivalMin = St.absMin(); }
  }

  return { init, say, choose, close, runLines, pick, capTalk, npcTalk, apology, maybeConfess, get open() { return open; }, ctx };
})();
