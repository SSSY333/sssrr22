// 여러 장소의 둘만의 시간: 급한 밤 · 한 번 더 · 부대 지하 창고 · 지프 드라이브 · 온천 가족탕
// 대사는 data/love_spots.js (PX.LOVE) · 직접적인 묘사 없이 암전 · 언제든 멈출 수 있다
'use strict';
PX.Love = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game, L = () => PX.LOVE;
  const ctx = () => PX.Dlg.ctx();
  const lov = () => St.S.rel.cap.stage >= 4;
  const withCap = () => PX.Act.withCap();
  const fresh = (key, arr) => U.pickFresh(key, arr);
  const shuffle = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const freshFirst = (arr) => { const f = arr.filter(m => !PX.Dlg.bundleSeen({ l: m })), r = arr.filter(m => !f.includes(m)); return [...shuffle(f), ...shuffle(r)]; };
  const fadeOn = async () => { document.getElementById('fade').classList.add('on'); await U.sleep(700); };
  const fadeOff = async () => { document.getElementById('fade').classList.remove('on'); await U.sleep(300); };
  async function lines(ls) { const g = G(); g.modal++; try { return await PX.Dlg.runLines(ls); } finally { g.modal--; } }
  async function talk(ls) { await lines(ls); PX.Dlg.close(); }
  async function choose2(pair, face = 'blush') {
    const a = U.fmt(pair[0], ctx()), b = U.fmt(pair[1], ctx());
    const g = G(); g.modal++;
    try { const i = await PX.Dlg.choose([{ t: a }, { t: b }]); await PX.Dlg.say('player', i === 0 ? a : b, i === 0 ? face : 'normal'); return i; } finally { g.modal--; }
  }
  const affOnce = (k, n) => { const S = St.S, key = 'love_' + k + '_' + S.day; if (!S.done[key]) { S.done[key] = 1; St.addAff(n); } };
  // 장면 내내 다른 이벤트가 끼어들지 않게 (암전 · 메뉴 사이 빈틈 포함)
  const hold = (fn) => async (...a) => { const g = G(); g.modal++; try { return await fn(...a); } finally { g.modal--; } };
  function face() { const g = G(); if (g.cap) g.cap.setDirTo(g.player.x, g.player.y); }

  // ---------- 암전과 사이사이 들리는 말 ----------
  // between(i): 속삭임 사이에 끼어드는 일 (창고: 누가 온다 · 들킨다). 'stop' 을 돌려주면 거기서 끝
  async function dark(P, key, { n = 2, mins = 60, between } = {}) {
    PX.Dlg.close(); await fadeOn();
    await lines([fresh(key + 'Dark', P.dark)]);
    const order = freshFirst(P.murmur.concat(L().breath)).slice(0, n);
    let res = null;
    for (let i = 0; i < order.length; i++) {
      St.advance(Math.round(mins / order.length));
      const r = await lines(order[i]); St.addAff(Math.min(3, (r && r.aff) || 1));
      if (between) { res = await between(i); if (res === 'stop') break; }
    }
    PX.Dlg.close(); await fadeOff();
    return res;
  }
  // ---------- 하루에 여러 번: 대위가 챙겨 준다 ----------
  const loveKey = () => 'loveCount_' + St.S.day;
  async function careAfter() { // 장면 하나가 끝날 때마다 (한 번 더 포함) 부른다
    const S = St.S, k = loveKey(); S.done[k] = (S.done[k] || 0) + 1;
    const n = S.done[k], C = L().care;
    if (n < 2 || !C) return;
    if (PX.Recent) PX.Recent.note(`오늘만 ${n}번째로 사랑을 나눔 (대위가 무리하지 않았는지 챙기는 중)`);
    face(); await talk(fresh('care' + (n >= 3 ? 'More' : 'Two'), n >= 3 ? C.more : C.two));
    if (PX.Mind) PX.Mind.setContact(G().player.seat && G().player.seat.obj && (G().player.seat.obj.use === 'bed' || (G().player.seat.obj.f && G().player.seat.obj.f.use === 'bed')) ? 'CUDDLE' : 'NONE');
  }
  // ---------- 한 번 더 (가끔 · 대위가 먼저 또는 내가) ----------
  async function encore(force) {
    const E = L().encore, S = St.S;
    if (!force && Math.random() > 0.45) return false;
    let i;
    if (Math.random() < 0.5) { face(); await lines(fresh('encCap', E.capAsk)); i = await choose2(['…응. 한 번 더.', '오늘은 여기까지.']); }
    else { i = await choose2([U.pick(E.me), '…이제 자자.']); if (i === 0) await lines(fresh('encYes', E.yesCap)); }
    if (i !== 0) { await talk(fresh('encNo', E.no)); return false; }
    await dark(E, 'enc', { n: 2, mins: 50 });
    await talk(fresh('encAfter', E.after));
    St.addAff(3); S.energy = Math.max(5, (S.energy || 50) - 10);
    S.done[loveKey()] = (S.done[loveKey()] || 0) + 1; // 한 번 더도 센다
    if (PX.Recent) PX.Recent.note('조금만 더 하자고 해서 한 번 더 (방금 끝남)');
    return true;
  }
  // ---------- 한 장면: 분위기 → 할지 말지 → 챙기기 → 암전 → 그 후 → (한 번 더) ----------
  async function scene(P, key, o = {}) {
    if (o.mood !== false) await lines(fresh(key + 'Mood', P.mood));
    const go = fresh(key + 'Go', P.go);
    const i = await choose2(go);
    if (i !== 0) { await talk(fresh(key + 'Stop', P.stop)); return false; }
    if (P.prep) await lines(fresh(key + 'Prep', P.prep));
    const r = await dark(P, key, { n: o.n || 2, mins: o.mins || 60, between: o.between });
    if (r === 'stop') return 'caught';
    await lines(fresh(key + 'After', P.after));
    PX.Dlg.close();
    St.addAff(5); St.S.energy = Math.max(5, (St.S.energy || 50) - 12);
    if (PX.Recent && key !== 'car') PX.Recent.note(({ st: '부대 지하 창고에서 몰래 사랑을 나눔', fam: '온천 가족탕에서 사랑을 나눔' })[key] || '둘만의 시간을 보냄'); // 차는 carMenu 에서 기록
    if (o.encore) await PX.Love.encore();
    await careAfter();
    return true;
  }

  // ================= 급한 밤 (장기 수색 복귀 · 힘든 날) =================
  function markUrgent(why, hours) { const S = St.S; if (S.rel.cap.stage < 4) return; S.cap.urgent = { why, exp: St.absMin() + hours * 60, msg: why === 'op' }; }
  function newDay() {
    const S = St.S;
    if (S.cap.urgent && St.absMin() > S.cap.urgent.exp) S.cap.urgent = null;
    if (S.rel.cap.stage >= 4 && !S.cap.urgent && !(PX.Op.isAway && PX.Op.isAway('cap')) && Math.random() < 0.08) markUrgent('hard', 22);
    // 대위 휴가 (가끔): 일과 없이 나랑 논다 · 장기수색과 겹치지 않게
    { const o = S.cap.op, busy = o && o.phase !== 'done', has = S.capLeave && S.capLeave.to >= S.day;
      if (S.rel.cap.stage >= 3 && !busy && !has && Math.random() < 0.1) {
        const from = S.day + 1 + (Math.random() < 0.5 ? 0 : 1), len = Math.random() < 0.7 ? 1 : 2;
        S.capLeave = { from, to: from + len - 1, self: true }; S.cap.leaveNote = 'ask';
      } }
    // 다른 부대 커플이 창고에서 들켰다는 소문 (아주 가끔)
    if (S.rel.cap.stage >= 4 && S.done.storeVisit && Math.random() < 0.05) S.cap.rumorNext = 1;
  }
  function msg(t, r) {
    const S = St.S, now = St.absMin();
    S.messages.unshift({ id: now, t, r, day: S.day, min: S.time.min, reply: null }); S.messages = S.messages.slice(0, 40);
    PX.UI.toast(`📱 ${S.capName}: ${t}`, 4000); PX.UI.badge();
  }
  function minute() {
    const S = St.S, g = G(), t = S.time.min, u = S.cap.urgent;
    if (!g || !g.cap) return;
    // 지프 안: 대위가 서 있으면 운전석에 앉는다 (불러오기 뒤 등) · 차에서 이미 내렸는데 차 정보가 남았으면 정리
    if (g.mapId === 'jeep_in' && g.cap.map === 'jeep_in' && g.player.seat && !g.cap.seat && !g.modal) { const s = carSeats(); if (!s.drv.by) g.cap.sitOn(s.drv); } // 내가 앉으면 대위는 운전석
    if (g.mapId !== 'jeep_in' && S.car && g.cap.map !== 'jeep_in') S.car = null;
    if (S.cap.rumorNext && t >= 12 * 60 && t < 20 * 60) { S.cap.rumorNext = 0; msg(U.pick(L().storage.rumor), [['헉, 우리 조심하자.', 2, '응. …근데 창고 또 가고 싶다.'], ['우리도 들킬 뻔했잖아.', 3, '쉿. 그건 기밀이야.']]); }
    // 대위 휴가 메시지: 낸 날 낮에 한 번 · 휴가 당일 아침에 한 번
    if (S.cap.leaveNote && S.capLeave && t >= 9 * 60 && t < 21 * 60 && !(PX.Op.isAway && PX.Op.isAway('cap'))) {
      const L2 = S.capLeave, n = L2.to - L2.from + 1, R = PX.Rom;
      if (S.cap.leaveNote === 'ask' && S.day < L2.from) { S.cap.leaveNote = 'day';
        const mine = S.leave && S.leave.to >= L2.from && S.leave.from <= L2.to; // 내 휴가와 겹치면
        if (mine) msg(`${R.dayKo(L2.from)} 휴가 냈어. 너 쉬는 날이라며. 맞춰서 냈지.`, [['역시!', 4, '응. 하루 종일 네 거야.'], ['어떻게 알았어요?', 3, '근무표 봤어. 비밀이야.']]); else
        msg(U.pick([`${R.dayKo(L2.from)} 휴가 냈어${n > 1 ? `. ${n}일` : ''}. 이유는 너.`, `나 ${R.dayKo(L2.from)} 쉬어. 일과 없음. 너랑 놀려고 낸 거야.`, `휴가 냈다. ${R.dayKo(L2.from)}${n > 1 ? `부터 ${n}일` : ''}. 그날 비워 둘 수 있어?`]),
          [['진짜? 좋아!', 3, '응. 하루 종일 네 거야.'], ['나 그날 일하는데…', 2, '괜찮아. 끝날 때까지 기다릴게. 데리러 갈게.']]);
      } else if (S.cap.leaveNote === 'day' && S.day >= L2.from && S.day <= L2.to && t < 12 * 60) { S.cap.leaveNote = null;
        msg(U.pick(['오늘 휴가. 군복 안 입었어. 어디야? 찾으러 갈게.', '좋은 아침. 오늘은 근무 없음. 너만 있음.', '휴가 첫날. 뭐 할지 아무것도 안 정했어. 너랑 정하려고.']),
          [['나 지금 숙소야.', 3, '알았어. 금방 갈게.'], ['일 끝나고 보자.', 2, '응. 끝나는 시간에 앞에 있을게.']]);
      }
    }
    if (!u) return;
    if (St.absMin() > u.exp) { S.cap.urgent = null; return; }
    if (u.why === 'hard' && !u.msg && t >= 17 * 60 && t < 21 * 60) { u.msg = true; msg(U.pick(['오늘 진짜 힘들었다. 이따 너한테 가도 돼?', '하루 종일 최악이었어. 너 보고 싶어. 지금 당장.', '오늘 버틴 거, 다 너 때문이야. 퇴근하면 갈게.']), [['응, 와.', 3, '…달려갈게.'], ['기다리고 있을게.', 3, '문 잠그지 마. 노크 안 하고 들어갈지도.']]); }
    const md = PX.MAPS[g.mapId] || {};
    if (!md.home || !(t >= 19 * 60 || t < 60) || g.modal || g.queue.length || g.transition || g.sleeping || g.busyEvent) return;
    if ((PX.Op.isAway && PX.Op.isAway('cap')) || PX.Cap.onDuty() || S.done['homeNight_' + S.day]) return;
    if (PX.Cap.mode === 'stay' && g.cap.map === g.mapId) return; // 이미 같이 있으면 평소 밤으로
    S.cap.urgent = null;
    g.trigger(() => H2u(u.why));
  }
  const H2u = (why) => PX.Love.urgentNight(why);
  async function urgentNight(why) {
    const S = St.S, g = G(), U2 = L().urgent, m = PX.W.maps[g.mapId];
    PX.Cap.moveTo(g.mapId); g.cap.x = m.exit.x + 0.5; g.cap.y = m.exit.y - 0.8; g.cap.hidden = false;
    PX.Cap.mode = 'stay'; S.cap.stay = 'bed'; S.cap.lastStayAskDay = S.day;
    if (g.player.seat) g.player.leaveSeat();
    g.player.setDirTo(g.cap.x, g.cap.y); face();
    if (PX.Mind) { PX.Mind.setContact('NONE'); PX.Mind.noteMeet && PX.Mind.noteMeet(); }
    S.done['homeNight_' + S.day] = 1;
    await lines(fresh('urg_' + why, U2.arrive[why] || U2.arrive.hard));
    const pair = fresh('urgGo', U2.go);
    const i = await choose2(pair);
    if (i !== 0) {
      if (/안고만/.test(pair[1])) { await talk(fresh('urgStop', U2.stop)); return; }
      await lines(fresh('urgSlow', U2.slow));
    }
    const prep = PX.InnNight && PX.InnNight.PREP && PX.InnNight.PREP.home;
    if (prep && prep.length) await lines(fresh('urgPrep', prep));
    await dark(U2, 'urg', { n: 3, mins: 90 });
    await lines(fresh('urgAfter', U2.after)); PX.Dlg.close();
    St.addAff(8); S.energy = Math.max(5, (S.energy || 50) - 15);
    await PX.Love.encore();
    await careAfter();
    if (!S.done.urgentMem) { S.done.urgentMem = 1; g.memory(why === 'op' ? '다녀왔어' : '참고 참다가', why === 'op' ? '장기 수색에서 돌아온 그는 인사보다 먼저 나를 안았다.' : '최악의 하루 끝에, 그는 문을 열자마자 나를 찾았다.', false); }
    if (PX.Recent) PX.Recent.note(why === 'op' ? '장기 수색에서 돌아온 대위가 방에 들이닥쳐 바로 사랑을 나눔' : '힘든 하루 끝에 대위가 방에 들이닥쳐 바로 사랑을 나눔');
    PX.UI.toast('🛌 침대에서 잠자기를 고르면 같이 잠들어요', 3200);
  }

  // ================= 부대 지하 창고 =================
  async function storeGo() {
    const g = G(), S = St.S, m = PX.W.maps.storage;
    const following = PX.Cap.mode === 'follow' && g.cap.map === g.mapId;
    g.enterMap('storage', m.exit.x + 0.5, m.exit.y - 0.6);
    if (following) { PX.Cap.moveTo('storage'); g.cap.x = m.exit.x + 1.3; g.cap.y = m.exit.y - 0.8; PX.Cap.mode = 'follow'; }
    S.done.storeVisit = 1;
    if (!following || !lov()) { PX.UI.toast('📦 먼지 냄새 나는 좁은 창고다'); return; }
    await U.sleep(300);
    g.trigger(async () => {
      if (Math.random() < 0.06) { await talk(L().storage.found[0]); }
      face(); await lines(fresh('stEnter', L().storage.enter));
      if (Math.random() < 0.6) await lines(fresh('stEye', L().storage.eye));
      PX.Dlg.close();
      PX.UI.toast('📦 상자 더미 뒤로 가면 둘만 있을 수 있어요', 2600);
    });
  }
  async function nook() {
    const g = G(), S = St.S, P = L().storage, M = P.menu;
    if (!withCap()) { PX.UI.toast('📦 상자 더미 뒤. 혼자 있기엔 좀 으스스하다'); return; }
    face();
    for (let n = 0; n < 5; n++) {
      const items = [{ t: M.talk, k: 'talk' }, PX.AI && PX.AI.available() ? { t: '✨ 자유롭게 대화하기', k: 'ai', sub: '작게 속삭이듯' } : null, S.rel.cap.stage >= 3 ? { t: M.kiss, k: 'kiss' } : null, lov() ? { t: M.love, k: 'love', sub: '…누가 올지도 몰라' } : null, { t: M.out, k: 'out' }].filter(Boolean);
      const it = await PX.UI.menu('📦 상자 더미 뒤에서', items);
      if (!it || it.k === 'out') break;
      if (it.k === 'ai') { await PX.AI.chat(); continue; }
      if (it.k === 'talk') { await talk(fresh('stTalk', P.talk)); St.advance(10); affOnce('stTalk', 2); if (PX.Recent) PX.Recent.note('창고 상자 더미 뒤에서 소곤소곤 이야기'); continue; }
      if (it.k === 'kiss') { if (PX.Recent) PX.Recent.note('창고에서 몰래 입맞춤'); await talk(fresh('stKiss', P.kiss)); St.advance(5); affOnce('stKiss', 3); if (Math.random() < 0.15) { await talk(fresh('stAlmost', P.almost)); } continue; }
      if (it.k === 'love') {
        let caught = false, almost = false;
        const between = async () => {
          const r = Math.random();
          if (!caught && r < 0.06) { caught = true; await lines(fresh('stCaught', P.caught)); return 'stop'; }
          if (!almost && r < 0.3) { almost = true; await lines(fresh('stAlmost', P.almost)); }
          return null;
        };
        const res = await scene(P, 'st', { n: 3, mins: 40, between });
        if (res === 'caught') {
          await talk(fresh('stCaughtAfter', P.caughtAfter));
          S.done.storeCaught = (S.done.storeCaught || 0) + 1; St.addAff(3);
          PX.UI.toast('😳 들켰다… 부대에 소문이 날지도', 3000);
          if (!S.done.storeCaughtMem) { S.done.storeCaughtMem = 1; g.memory('재고 조사 중', '창고 문이 열렸다. 그날 이후 그는 그 병사에게 유난히 친절하다.', false); }
          break;
        }
        if (res && !S.done.storeMem) { S.done.storeMem = 1; g.memory('지하 창고 C-7', '훈련 구령이 들리는 낮, 먼지 냄새 나는 창고에서. 둘만 아는 재고 조사.', false); }
        if (res) break;
      }
    }
    PX.Dlg.close();
  }

  // ================= 지프 드라이브 (차 안 맵: 앞 = 왼쪽 유리창) =================
  // 흐름: 부대 지프를 누르면 → 차 안(부대에 세워 둔 채) → 🚗 출발 → 드라이브 장소 → 돌아오기 → 내리기
  // 차 안 메뉴는 한 번에 하나만 하고 닫힌다 (대시보드 · '앉아서 할 일'로 다시 연다)
  const carSeats = () => { const m = PX.W.maps.jeep_in, ss = m.objs.filter(o => /^carseat/.test(o.fid)), fr = ss.filter(o => o.x + o.y >= 3), bk = ss.filter(o => o.x + o.y < 3), E = (arr) => arr.find(o => o.fid === 'carseatE').seats[0], Sx = (arr) => arr.find(o => o.fid === 'carseat').seats[0]; return { drv: Sx(fr), pas: E(fr), back: [E(bk), Sx(bk)] }; }; // 앞(대각선 앞줄): 조수석(왼쪽) · 운전석(오른쪽) · 뒷좌석도 같은 배치
  function seatUs(where) {
    const g = G(), s = carSeats();
    for (const st of [s.drv, s.pas, ...s.back]) if (st.by && st.by !== g.player && st.by !== g.cap) st.by = null;
    if (g.player.seat) g.player.leaveSeat(); if (g.cap.seat) g.cap.leaveSeat();
    if (where === 'back') { g.cap.sitOn(s.back[1]); g.player.sitOn(s.back[0]); }
    else { g.cap.sitOn(s.drv); g.player.sitOn(s.pas); }
  }
  function enterCar() {
    const g = G(), m = PX.W.maps.jeep_in;
    g.enterMap('jeep_in', m.exit.x + 0.5, m.exit.y - 0.5);
    PX.Cap.moveTo('jeep_in'); g.cap.x = 2.5; g.cap.y = 1.5; /* 운전석 */ g.cap.hidden = false; PX.Cap.mode = 'follow';
    if (PX.Mind) PX.Mind.setContact('NONE');
    seatUs('front');
  }
  // ---------- 드라이브 장소에 세워 둔 지프 (내려서 걷다가 다시 타고 돌아간다) ----------
  function placeParked(id) {
    const S = St.S, P = S.carParked; if (!P || P.map !== id) return;
    const m = PX.W.maps[id]; if (!m || m.objs.some(o => o.parked)) return;
    const o = PX.W.addFurn(m, 'jeep', P.x, P.y, 0, null, 'parkedJeep'); if (!o) return;
    o.parked = true; PX.W.rebuildWalk(m);
  }
  function parkHere() {
    const g = G(), S = St.S, m = PX.W.maps[g.mapId], px = Math.floor(g.player.x), py = Math.floor(g.player.y);
    const free = (x, y) => PX.W.walkable(m, x, y) && !(x === px && y === py);
    let best = null;
    for (let r = 1; r <= 9 && !best; r++) for (let y = py - r; y <= py + r && !best; y++) for (let x = px - r; x <= px + r && !best; x++) {
      let ok = true; for (let yy = y; yy < y + 2 && ok; yy++) for (let xx = x; xx < x + 3 && ok; xx++) ok = free(xx, yy);
      if (ok && free(x + 1, y + 2)) best = [x, y]; // 앞(아래)에 탈 자리
    }
    if (!best) return false;
    S.carParked = { map: g.mapId, x: best[0], y: best[1] };
    placeParked(g.mapId);
    return true;
  }
  function unpark() {
    const S = St.S, P = S.carParked; if (!P) return;
    const m = PX.W.maps[P.map]; if (m) { const i = m.objs.findIndex(o => o.parked); if (i >= 0) { m.objs.splice(i, 1); PX.W.rebuildWalk(m); } }
    S.carParked = null;
  }
  const onMap = (id) => placeParked(id);
  const destOf = () => { const c = St.S.car || {}; return L().car.dest.find(d => d.id === (c.to || c.dest)); };
  const parked = () => !St.S.car || St.S.car.dest === 'base';
  async function drive() {
    const g = G(), S = St.S, C = L().car;
    if (!withCap()) { PX.UI.toast(`🚙 ${U.josa(S.capName, '이')} 같이 있어야 탈 수 있어요`); return; }
    if (PX.Cap.onDuty()) { await talk(['C:…지금은 근무 중이야. 끝나고 태워 줄게.']); return; }
    if (S.rel.cap.stage < 2) { await talk(['C:…부대 차량이야. 아무나 못 태워. …아직은.']); return; }
    const here = S.carParked && S.carParked.map === g.mapId && C.dest.some(d => d.id === g.mapId); // 드라이브 장소에 세워 둔 지프
    face(); await talk(here ? fresh('carReboard', C.reboard) : fresh('carBoard', C.board));
    await fadeOn(); if (here) unpark(); S.car = { dest: here ? g.mapId : 'base', at: St.absMin() }; enterCar(); await U.sleep(150); await fadeOff();
    PX.UI.toast('🚙 대시보드나 「앉아서 할 일」로 차 안에서 할 일을 골라요', 3000);
    await carMenu();
  }
  // 출발 · 다른 곳으로 · 돌아오기: 실제로 달린다 (시간이 흐르고 창밖이 바뀐다)
  // ---------- 달리는 동안: 신호(바라보기 · 미소 · 손등 · 속삭임)가 쌓이면 대위가 차를 세운다 ----------
  async function signal(k) {
    const S = St.S, D = L().car.drive, car = S.car;
    await talk([U.pick(D.do[k])]);
    car.heat = (car.heat || 0) + (k === 'look' ? 1 : k === 'whisper' || k === 'lip' ? 2 : 1.5);
    if (PX.Recent) PX.Recent.note('차 안에서 대위에게 신호: ' + D.menu[k].replace(/^\S+\s/, ''));
    if (car.heat >= 3 && lov()) return deepTouch();
    await talk(fresh('drvRe' + (car.heat >= 2 ? 2 : 1), D.re[car.heat >= 2 ? 2 : 1]));
    return false;
  }
  // 깊은 접촉: 차를 세우고 → 입맞춤 → (밤이면) 뒷좌석으로 → 암전 · 낮이면 키스까지
  async function deepTouch() {
    const g = G(), S = St.S, C = L().car, D = C.drive, t = S.time.min, night = t >= 18 * 60 || t < 5 * 60;
    S.car.heat = 0;
    await lines(fresh('drvPull', D.pull));
    const i = await choose2(fresh('drvPullGo', D.pullGo));
    if (i !== 0) { await talk(fresh('drvPullStop', D.pullStop)); if (PX.Mind) PX.Mind.setContact('SIT_HAND'); return false; }
    if (PX.Mind) PX.Mind.setContact('SIT_LEAN'); if (g.cap.showEmote) g.cap.showEmote('heart', 1.4);
    await lines(fresh('drvDeep', D.deep)); St.advance(10); affOnce('drvDeep', 4);
    if (PX.Recent) PX.Recent.note('신호를 주고받다 대위가 차를 세우고 깊게 입맞춤');
    if (!night) { await talk(fresh('drvDay', D.day)); return 'kiss'; }
    await lines(D.backAsk[0]);
    const j = await choose2(D.backGo[0]);
    if (j !== 0) { await talk(fresh('drvPullStop', D.pullStop)); return 'kiss'; }
    seatUs('back');
    if (C.prep) await lines(fresh('carPrep', C.prep));
    await dark(C, 'car', { n: 3, mins: 60 });
    await lines(fresh('carAfter', C.after)); PX.Dlg.close();
    St.addAff(5); S.energy = Math.max(5, (S.energy || 50) - 12);
    if (PX.Recent) PX.Recent.note('차를 세운 채 지프 뒷좌석에서 사랑을 나눔 (방금 끝남)');
    if (!S.done.carMem) { S.done.carMem = 1; g.memory('김 서린 창문', '달리던 차를 그가 세웠다. 좁은 뒷좌석, 그는 머리를 세 번 부딪히고도 웃었다.', false); }
    await PX.Love.encore();
    await careAfter();
    seatUs('front');
    return 'love';
  }
  async function goTo(id) {
    const g = G(), S = St.S, C = L().car, D = C.drive, d = C.dest.find(x => x.id === id);
    seatUs('front'); if (PX.Mind) PX.Mind.setContact('NONE');
    S.car.heat = 0;
    if (id === 'base') { await fadeOn(); St.advance(40); S.car.dest = id; await fadeOff(); await talk(fresh('carHome', C.home)); if (PX.Recent) PX.Recent.note('지프 드라이브를 마치고 부대로 돌아옴 (아직 차 안)'); PX.UI.toast('🚪 차에서 내리려면 문을 누르세요', 2600); return; }
    // 달리는 중 (세 구간): 신호를 줄 수 있다 · '그냥 가기'면 바로 도착
    const legs = 3, per = parked() ? 12 : 7;
    S.car.dest = 'road'; S.car.to = id;
    await talk(fresh('carRoad', C.road));
    let stopped = false;
    for (let n = 0; n < legs; n++) {
      const M = D.menu;
      const items = [{ t: M.look, k: 'look' }, { t: M.smile, k: 'smile' }, S.rel.cap.stage >= 3 ? { t: M.touch, k: 'touch' } : null, lov() ? { t: M.whisper, k: 'whisper' } : null, lov() ? { t: M.lip, k: 'lip' } : null, { t: M.go, k: 'go', sub: '도착까지 그대로' }].filter(Boolean);
      const it = await PX.UI.menu(`🚗 달리는 중 · ${d.t.replace(/^\S+\s/, '')}까지 ${legs - n}구간`, items);
      St.advance(per);
      if (!it || it.k === 'go') break;
      const r = await signal(it.k);
      if (r) { stopped = true; if (r) await talk(fresh('drvResume', D.resume)); break; }
    }
    await fadeOn(); S.car.dest = id; delete S.car.to; await fadeOff();
    await talk(d.line); // 도착
    if (PX.Recent) PX.Recent.note(`지프를 타고 ${PX.MAPS[id].name}에 도착 (차 안)`);
    if (!S.done.driveMem) { S.done.driveMem = 1; g.memory('둘만의 드라이브', `${U.josa(S.capName, '이')} 무릎이 핸들에 닿는 지프로 ${PX.MAPS[id].name}까지 데려갔다.`, true); }
  }
  async function pickDest(title) {
    const S = St.S, C = L().car;
    const d = await PX.UI.menu(title, C.dest.filter(x => x.id !== S.car.dest).map(x => ({ t: x.t, sub: parked() ? '40분' : '20분', k: x })).concat([{ t: '그만두기', k: null }]));
    return d && d.k ? d.k.id : null;
  }
  async function carMenu() {
    const g = G(), S = St.S, C = L().car, M = C.menu;
    if (g.mapId !== 'jeep_in') return;
    if (g.cap.map !== 'jeep_in') { PX.UI.toast('🚙 대위가 없으면 운전을 못 해요'); return; }
    S.car = S.car || { dest: 'base' };
    const t = S.time.min, night = t >= 18 * 60 || t < 5 * 60, back = g.player.seat && carSeats().back.includes(g.player.seat), d = destOf();
    const items = [
      parked() ? { t: '🚗 출발하기', k: 'go', sub: '드라이브 장소 고르기' } : { t: M.move, k: 'move', sub: '다른 드라이브 장소로' },
      !parked() ? { t: M.home, k: 'home', sub: '부대로 40분' } : null,
      !parked() ? { t: '👀 대위 바라보기', k: 'sig_look' } : null, !parked() ? { t: '😊 대위 보고 미소 짓기', k: 'sig_smile' } : null, !parked() && lov() ? { t: '🫦 입술 살짝 깨물기', k: 'sig_lip' } : null,
      { t: M.talk, k: 'talk' }, d ? { t: M.view, k: 'view', sub: d.t.replace(/^\S+\s/, '') } : null,
      PX.AI && PX.AI.available() ? { t: '✨ 자유롭게 대화하기', k: 'ai', sub: '지금 차 안 · 방금 한 일을 기억해요' } : null,
      S.rel.cap.stage >= 3 ? { t: M.hand, k: 'hand' } : null, S.rel.cap.stage >= 3 ? { t: M.lean, k: 'lean' } : null,
      { t: M.radio, k: 'radio' }, { t: M.snack, k: 'snack' },
      lov() ? { t: M.kiss, k: 'kiss' } : null, lov() ? { t: M.hug, k: 'hug' } : null,
      lov() && !back && !parked() ? { t: M.back, k: 'back', sub: night ? '좁아서 머리 부딪힐지도' : '해가 지면', off: !night, offMsg: '아직 너무 밝아요. 해가 지고 나서.' } : null,
      back ? { t: M.front, k: 'front' } : null,
    ].filter(Boolean);
    const it = await PX.UI.menu(parked() ? '🚙 지프 안 (부대 주차장)' : `🚙 지프 안 · ${PX.MAPS[S.car.dest].name}`, items);
    if (!it) return;
    if (it.k === 'go' || it.k === 'move') { const id = await pickDest(it.k === 'go' ? '🚗 어디로 갈까요?' : '🧭 어디로 갈까요?'); if (id) await goTo(id); return; }
    if (it.k === 'home') return goTo('base');
    if (it.k === 'ai') return PX.AI.chat();
    if (/^sig_/.test(it.k)) { const r = await signal(it.k.slice(4)); if (r === 'love' || r === 'kiss') { /* 세워 둔 차라 그대로 */ } return; }
    if (it.k === 'front') { seatUs('front'); if (PX.Mind) PX.Mind.setContact('NONE'); await talk(fresh('carFront', C.front)); return; }
    if (it.k === 'back') {
      seatUs('back'); if (PX.Mind) PX.Mind.setContact('SIT_LEAN');
      const r = await scene(C, 'car', { n: 3, mins: 70, encore: true });
      if (PX.Recent) PX.Recent.note(r ? '지프 뒷좌석에서 사랑을 나눔 (방금 끝나고 숨 고르는 중)' : '지프 뒷좌석으로 넘어갔다가 멈춤 (손만 잡기로)');
      if (r && !S.done.carMem) { S.done.carMem = 1; g.memory('김 서린 창문', '좁은 지프 뒷좌석. 그는 머리를 세 번 부딪히고도 웃었다.', false); }
      return;
    }
    if (PX.Mind) { if (it.k === 'lean' || it.k === 'hug') PX.Mind.setContact('SIT_LEAN'); else if (it.k === 'hand') PX.Mind.setContact('SIT_HAND'); }
    if ((it.k === 'kiss' || it.k === 'hug') && g.cap.showEmote) g.cap.showEmote('heart', 1.2);
    const pool = it.k === 'view' ? (C.view[S.car.dest] || C.view.lake) : C[it.k];
    await talk(fresh('car_' + it.k, pool));
    if (PX.Recent) PX.Recent.note('지프 안: ' + it.t.replace(/^\S+\s/, ''));
    St.advance(it.k === 'talk' || it.k === 'view' ? 15 : 10); affOnce('car_' + it.k, it.k === 'kiss' || it.k === 'hug' ? 3 : 2);
  }
  // 차 문을 열고 내릴 때
  async function carExit() {
    const g = G(), S = St.S;
    const out = () => { if (g.player.seat) g.player.leaveSeat(); if (g.cap.seat) g.cap.leaveSeat(); if (PX.Mind) PX.Mind.setContact('NONE'); };
    if (parked()) { // 부대 주차장: 그냥 내린다
      out(); S.car = null;
      await PX.Act.travel('base', 1);
      g.player.x = 57.5; g.player.y = 50.5; if (g.cap.map !== 'base') PX.Cap.moveTo('base'); g.cap.x = 58.5; g.cap.y = 50.5; g.cap.hidden = false; PX.Cap.mode = 'follow';
      return;
    }
    const d = destOf();
    const it = await PX.UI.menu('🚪 차에서 내릴까요?', [{ t: `🚶 ${PX.MAPS[d.id].name}에서 내리기`, k: 'out', sub: '지프는 옆에 세워 두고 같이 걷기 · 다시 타면 부대로' }, { t: '🏠 부대로 돌아가서 내리기', k: 'home', sub: '40분' }, { t: '그대로 있기', k: null }]);
    if (!it || !it.k) return;
    if (it.k === 'home') { await hold(goTo)('base'); return carExit(); }
    out(); await PX.Act.travel(d.id, 1); S.car = null;
    if (g.cap.map !== d.id) { PX.Cap.moveTo(d.id); g.cap.x = g.player.x + 1; g.cap.y = g.player.y; g.cap.hidden = false; } PX.Cap.mode = 'follow'; // 대위도 같이 내린다
    if (parkHere()) PX.UI.toast('🚙 지프는 바로 옆에 세워 뒀어요. 지프를 누르면 다시 타고 부대로 돌아가요', 3600);
    if (PX.Recent) PX.Recent.note(`지프에서 내려 ${PX.MAPS[d.id].name}에 섰다 (지프는 옆에 세워 둠)`);
  }

  // ================= 온천 가족탕 =================
  async function familyBath() {
    const g = G(), S = St.S, F = L().family, M = F.menu;
    if (!St.spend(30)) { PX.UI.toast('💸 가족탕은 ₢30이에요'); return; }
    await fadeOn(); St.advance(10); await fadeOff();
    face(); await lines(fresh('famEnter', F.enter)); PX.Dlg.close();
    for (let n = 0; n < 6; n++) {
      const it = await PX.UI.menu('🔒 가족탕에서', [{ t: M.lean, k: 'lean' }, { t: M.splash, k: 'splash' }, { t: M.wash, k: 'wash' }, { t: M.mood, k: 'mood', sub: '둘만 있으니까' }, { t: M.out, k: 'out' }]);
      if (!it || it.k === 'out') break;
      if (it.k === 'mood') { const r = await scene(F, 'fam', { n: 3, mins: 50, encore: true, mood: true }); if (r && !S.done.famMem) { S.done.famMem = 1; g.memory('가족탕', '미끄러운 돌 위에서 그는 한 번도 내 손을 놓지 않았다.', false); } if (r) break; continue; }
      await talk(fresh('fam_' + it.k, F[it.k])); St.advance(15); affOnce('fam_' + it.k, 2); if (PX.Recent) PX.Recent.note('가족탕: ' + it.t.replace(/^\S+\s/, ''));
    }
    S.energy = Math.min(100, (S.energy || 50) + 20);
    PX.UI.toast('♨️ 가족탕에서 나왔다 (기력 +20)');
  }

  // ---------- 상호작용 연결 ----------
  Object.assign(PX.Act.LABEL, { storego: '🪜 지하 창고로 내려가기', nook: '📦 상자 더미 뒤', drive: '🚙 지프 타기', carmenu: '🚙 대시보드 · 차 안에서 할 일' });
  const H = { storego: storeGo, nook, drive, carmenu: carMenu };
  const H2 = { encore: hold(encore), urgentNight: hold(urgentNight), nook: hold(nook), drive: hold(drive), familyBath: hold(familyBath) };
  H2.carMenu = hold(carMenu); H.nook = H2.nook; H.drive = H2.drive; H.carmenu = H2.carMenu;
  return { careAfter: hold(careAfter), onMap, unpark, encore: H2.encore, scene, dark, urgentNight: H2.urgentNight, markUrgent, newDay, minute, storeGo, nook: H2.nook, drive: H2.drive, familyBath: H2.familyBath, carMenu: H2.carMenu, carExit: () => hold(carExit)(), H };
})();
