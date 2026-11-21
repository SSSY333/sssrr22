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
    return true;
  }

  // ================= 급한 밤 (장기 수색 복귀 · 힘든 날) =================
  function markUrgent(why, hours) { const S = St.S; if (S.rel.cap.stage < 4) return; S.cap.urgent = { why, exp: St.absMin() + hours * 60, msg: why === 'op' }; }
  function newDay() {
    const S = St.S;
    if (S.cap.urgent && St.absMin() > S.cap.urgent.exp) S.cap.urgent = null;
    if (S.rel.cap.stage >= 4 && !S.cap.urgent && !(PX.Op.isAway && PX.Op.isAway('cap')) && Math.random() < 0.08) markUrgent('hard', 22);
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
    if (S.cap.rumorNext && t >= 12 * 60 && t < 20 * 60) { S.cap.rumorNext = 0; msg(U.pick(L().storage.rumor), [['헉, 우리 조심하자.', 2, '응. …근데 창고 또 가고 싶다.'], ['우리도 들킬 뻔했잖아.', 3, '쉿. 그건 기밀이야.']]); }
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
  const carSeats = () => { const m = PX.W.maps.jeep_in, fr = m.objs.filter(o => o.fid === 'carseat').sort((a, b) => a.y - b.y), bk = m.objs.find(o => o.fid === 'carback'); return { drv: fr[0].seats[0], pas: fr[1].seats[0], back: bk.seats }; };
  function seatUs(where) {
    const g = G(), s = carSeats();
    for (const st of [s.drv, s.pas, ...s.back]) if (st.by && st.by !== g.player && st.by !== g.cap) st.by = null;
    if (g.player.seat) g.player.leaveSeat(); if (g.cap.seat) g.cap.leaveSeat();
    if (where === 'back') { g.cap.sitOn(s.back[0]); g.player.sitOn(s.back[1]); }
    else { g.cap.sitOn(s.drv); g.player.sitOn(s.pas); }
  }
  function enterCar() {
    const g = G(), m = PX.W.maps.jeep_in;
    g.enterMap('jeep_in', m.exit.x + 0.5, m.exit.y - 0.5);
    PX.Cap.moveTo('jeep_in'); g.cap.x = 1.5; g.cap.y = 0.5; g.cap.hidden = false; PX.Cap.mode = 'follow';
    if (PX.Mind) PX.Mind.setContact('NONE');
    seatUs('front');
  }
  const destOf = () => L().car.dest.find(d => d.id === (St.S.car || {}).dest);
  const parked = () => !St.S.car || St.S.car.dest === 'base';
  async function drive() {
    const g = G(), S = St.S, C = L().car;
    if (!withCap()) { PX.UI.toast(`🚙 ${U.josa(S.capName, '이')} 같이 있어야 탈 수 있어요`); return; }
    if (PX.Cap.onDuty()) { await talk(['C:…지금은 근무 중이야. 끝나고 태워 줄게.']); return; }
    if (S.rel.cap.stage < 2) { await talk(['C:…부대 차량이야. 아무나 못 태워. …아직은.']); return; }
    face(); await talk(fresh('carBoard', C.board));
    await fadeOn(); S.car = { dest: 'base', at: St.absMin() }; enterCar(); await U.sleep(150); await fadeOff();
    PX.UI.toast('🚙 대시보드나 「앉아서 할 일」로 차 안에서 할 일을 골라요', 3000);
    await carMenu();
  }
  // 출발 · 다른 곳으로 · 돌아오기: 실제로 달린다 (시간이 흐르고 창밖이 바뀐다)
  async function goTo(id) {
    const g = G(), S = St.S, C = L().car, d = C.dest.find(x => x.id === id);
    seatUs('front'); if (PX.Mind) PX.Mind.setContact('NONE');
    await fadeOn(); St.advance(id === 'base' || parked() ? 40 : 20); S.car.dest = id; await fadeOff();
    if (id === 'base') { await talk(fresh('carHome', C.home)); if (PX.Recent) PX.Recent.note('지프 드라이브를 마치고 부대로 돌아옴 (아직 차 안)'); PX.UI.toast('🚪 차에서 내리려면 문을 누르세요', 2600); return; }
    await talk([fresh('carRoad', C.road)[0], ...d.line]); // 가는 길 한 줄 + 도착
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
      g.player.x = 57.5; g.player.y = 50.5; if (g.cap.map === 'base') { g.cap.x = 58.5; g.cap.y = 50.5; }
      return;
    }
    const d = destOf();
    const it = await PX.UI.menu('🚪 차에서 내릴까요?', [{ t: '🏠 부대로 돌아가서 내리기', k: 'home', sub: '40분' }, { t: `🚶 ${PX.MAPS[d.id].name}에서 내리기`, k: 'out', sub: '지프는 세워 두고 같이 걷기 (돌아갈 땐 이동 메뉴로)' }, { t: '그대로 있기', k: null }]);
    if (!it || !it.k) return;
    if (it.k === 'home') { await hold(goTo)('base'); return carExit(); }
    out(); await PX.Act.travel(d.id, 1); S.car = null;
    if (PX.Recent) PX.Recent.note(`지프에서 내려 ${PX.MAPS[d.id].name}에 섰다`);
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
  return { encore: H2.encore, scene, dark, urgentNight: H2.urgentNight, markUrgent, newDay, minute, storeGo, nook: H2.nook, drive: H2.drive, familyBath: H2.familyBath, carMenu: H2.carMenu, carExit: () => carExit(), H };
})();
