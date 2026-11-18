// 은밀숙소 객실 욕실: 욕실 문 → 욕실(샤워 부스 · 거품 욕조 · 화장실 · 세면대) → 씻고 나면 둘 다 가운
// 같이 들어가거나 혼자 들어가거나 고를 수 있다 (혼자면 대위는 객실에서 기다린다)
'use strict';
PX.InnBath = (() => {
  const U = PX.U, St = PX.St, W = PX.W;
  const G = () => PX.Game;
  const D = () => PX.INN_BATH;
  { const B = PX.INN_BATH, X2 = PX.INN_MORE || {};
    for (const k of ['goTogether', 'capWait', 'back', 'toilet', 'brush', 'robeAmb']) B[k].push(...(X2[k] || []));
    if (PX.DLG_V2 && X2.rubyOut) PX.DLG_V2.rubyOut.push(...X2.rubyOut.map(l => ({ s: [4, 7], l })));
    const A2 = PX.DLG_CAP2 && PX.DLG_CAP2.placeAmb; if (A2) for (const id in (X2.roomAmb || {})) A2[id] = (A2[id] || []).concat(X2.roomAmb[id]);
    for (const id in (X2.roomTalk || {})) for (const l of X2.roomTalk[id]) PX.SITU.push({ m: [id], s: [4, 7], tz: 1, l });
  }
  const ROBE = '#efe7e1';
  const inRoom = () => !!(PX.MAPS[G().mapId] || {}).innRoom;
  const inBath = () => G().mapId === 'inn_bathroom';
  const withCap = () => { const g = G(); return g.cap && g.cap.map === g.mapId && !g.cap.hidden && ['follow', 'visit', 'stay'].includes(PX.Cap.mode); };
  const useOf = (o) => o.use || (o.f && o.f.use);
  async function lines(ls) { const g = G(); g.modal++; try { await PX.Dlg.runLines(ls, { reply: true }); } finally { PX.Dlg.close(); g.modal--; } }
  const pick = (k) => PX.Dlg.capPick(D()[k]);
  const fade = async (ms = 450) => { const f = document.getElementById('fade'); f.classList.add('on'); await U.sleep(ms); return () => f.classList.remove('on'); };

  // 가운 입기 · 벗기
  function robe(on) {
    const S = St.S, g = G();
    S.player.bath = !!on; PX.Bath.refresh();
    if (on && withCap()) PX.Bath.capRobe(true, ROBE); else if (!on) PX.Bath.capRobe(false);
  }
  const robed = () => !!St.S.player.bath;

  // ---------- 욕실 문 ----------
  async function door(o) {
    const g = G(), S = St.S, wc = withCap();
    const items = [];
    if (wc) items.push({ t: '🚿 같이 들어가기', sub: '샤워 · 거품 목욕', k: 'both' });
    items.push({ t: '🚪 혼자 들어가기', sub: wc ? '화장실 · 혼자 씻기 · 대위는 방에서 기다려요' : '화장실 · 씻기', k: 'solo' });
    const it = await PX.UI.menu('🚪 욕실', items);
    if (!it) return;
    S.cap.innRoom = g.mapId;
    if (it.k === 'both') { await lines(pick('goTogether')); S.cap.bathAlone = false; }
    else { S.cap.bathAlone = !!wc; if (wc) { g.cap.setDirTo(g.player.x, g.player.y); await lines(pick('capWait')); } }
    const m = W.maps.inn_bathroom;
    g.enterMap('inn_bathroom', m.exit.x + 0.5, m.exit.y - 1.5);
    g.player.dir = 2;
  }
  // 욕실에서 나가기 → 들어왔던 객실, 욕실 문 앞으로
  function leave() {
    const g = G(), S = St.S, back = S.cap.innRoom && PX.MAPS[S.cap.innRoom] ? S.cap.innRoom : null;
    if (!back) { const lb = W.maps.inn; g.enterMap('inn', lb.exit.x + 0.5, lb.exit.y - 2.5); return; }
    const m = W.maps[back], d = m.objs.find(o => o.fid === 'bathdoor'), a = d && W.accessTile(m, d);
    g.enterMap(back, a ? a.x + 0.5 : m.exit.x + 0.5, a ? a.y + 0.5 : m.exit.y - 1.5);
    g.player.dir = 0;
  }
  // 함께 씻고 나서: 객실로 돌아와 가운 차림으로
  async function backInRobes() {
    const g = G(), S = St.S;
    const off = await fade(400);
    robe(true);
    if (inBath()) { leave(); if (withCap() || PX.Cap.mode === 'follow') { const t = PX.Path.nearestWalkable(W.maps[g.mapId], g.player.x + 1, g.player.y, 3); if (t) { PX.Cap.moveTo(g.mapId); g.cap.x = t[0] + 0.5; g.cap.y = t[1] + 0.5; PX.Cap.mode = 'follow'; PX.Bath.capRobe(true, ROBE); } } }
    await U.sleep(200); off();
    PX.UI.toast('🧺 가운으로 갈아입었다', 1800);
    g.cap.setDirTo(g.player.x, g.player.y);
    await lines(pick('robe'));
  }

  // ---------- 욕조 · 샤워 ----------
  function seatIn(o) {
    const g = G(), s = (o.seats || []).filter(x => !x.by);
    if (s[0]) g.player.sitOn(s[0]);
    if (withCap() && s[1]) { if (g.cap.leaveSeat) g.cap.leaveSeat(); g.cap.sitOn(s[1]); }
  }
  function standBy(o) {
    const g = G(), m = W.maps[g.mapId], a = W.accessTile(m, o);
    if (!a) return;
    g.player.leaveSeat(); g.player.stop(); g.player.x = a.x + 0.5; g.player.y = a.y + 0.5; g.player.setDirTo(o.x + 0.5, o.y + 0.5);
    if (withCap()) { g.cap.leaveSeat(); const t = PX.Path.nearestWalkable(m, a.x + 1, a.y, 2); if (t) { g.cap.stop(); g.cap.x = t[0] + 0.5; g.cap.y = t[1] + 0.5; } g.cap.setDirTo(g.player.x, g.player.y); }
  }
  async function wash(o, kind) { // kind: bubble | shower
    const g = G(), S = St.S, wc = withCap();
    const items = wc ? [{ t: kind === 'bubble' ? '🫧 같이 거품 목욕' : '🚿 같이 샤워하기', k: 'both' }, { t: kind === 'bubble' ? '🛁 혼자 거품 목욕' : '🚿 혼자 씻기', k: 'solo' }] : [{ t: kind === 'bubble' ? '🛁 거품 목욕 (40분)' : '🚿 씻기 (15분)', k: 'solo' }];
    const it = await PX.UI.menu(kind === 'bubble' ? '🛁 욕조' : '🚿 샤워 부스', items);
    if (!it) return;
    g.modal++;
    try {
      if (it.k === 'solo') {
        if (wc) { await PX.Dlg.runLines(pick('capWait')); PX.Dlg.close(); }
        const off = await fade(500); St.advance(kind === 'bubble' ? 40 : 15); robe(true); off();
        S.energy = Math.min(100, S.energy + (kind === 'bubble' ? 30 : 12));
        PX.UI.toast(kind === 'bubble' ? '🫧 거품 목욕을 하고 가운을 입었다' : '🚿 개운하게 씻고 가운을 입었다', 2200);
        return;
      }
      if (kind === 'bubble') seatIn(o); else standBy(o);
      const off = await fade(350); off();
      // 서로 다른 장면 두 개 (같은 말 반복 없이)
      await PX.Dlg.runLines(pick(kind)); PX.Dlg.close();
      St.advance(kind === 'bubble' ? 25 : 12);
      await PX.Dlg.runLines(pick(kind), { reply: true }); PX.Dlg.close();
      St.advance(kind === 'bubble' ? 20 : 10);
      S.energy = Math.min(100, S.energy + (kind === 'bubble' ? 35 : 15));
      const k = 'ib_' + kind + '_' + S.day; if (!S.done[k]) { S.done[k] = 1; St.addAff(kind === 'bubble' ? 5 : 4); }
      if (!S.done['ibm_' + kind]) { S.done['ibm_' + kind] = 1; g.memory(kind === 'bubble' ? '둘이 한 욕조' : '둘이 한 샤워', kind === 'bubble' ? '은밀숙소 욕실, 거품이 넘치는 욕조에 둘이 들어갔다. 대위가 등을 밀어 줬다.' : '좁은 샤워 부스에서 대위가 내 머리를 감겨 줬다. 물이 비처럼 내렸다.', true); }
      g.player.leaveSeat(); if (g.cap.seat) g.cap.leaveSeat();
    } finally { PX.Dlg.close(); g.modal--; }
    await backInRobes();
  }

  // ---------- 화장실 · 세면대 · 가운 걸이 ----------
  async function toilet() {
    const g = G();
    if (withCap()) await lines(pick('toilet'));
    const off = await fade(500); St.advance(3); off();
    PX.UI.toast('🚽 화장실에 다녀왔다', 1400);
  }
  async function sink(o) {
    const g = G();
    if (!withCap()) { St.advance(5); PX.UI.toast('🪥 양치하고 세수했다', 1600); return; }
    standBy(o);
    await lines(pick('brush'));
    St.advance(8);
  }
  async function robeHook() {
    const g = G();
    if (robed()) { const off = await fade(400); robe(false); off(); PX.UI.toast('👕 원래 옷으로 갈아입었다', 1600); return; }
    const off = await fade(400); robe(true); off();
    PX.UI.toast('🧺 가운으로 갈아입었다', 1600);
    if (withCap()) await lines(pick('robe'));
  }

  // ---------- 상호작용 연결 ----------
  function handles(o) {
    const u = useOf(o);
    if (['innbath', 'toilet', 'robe'].includes(u)) return true;
    if ((inBath() || inRoom()) && ['bath', 'shower', 'spa', 'sink'].includes(u)) return true;
    return false;
  }
  function use(o) {
    const u = useOf(o);
    if (u === 'innbath') return door(o);
    if (u === 'toilet') return toilet();
    if (u === 'robe') return robeHook();
    if (u === 'sink') return sink(o);
    if (u === 'bath') return wash(o, 'bubble');
    return wash(o, 'shower'); // shower · spa
  }
  // 혼자 다녀와서 객실로 돌아왔을 때 대위 한마디
  async function welcomeBack() { await lines(pick('back')); }
  return { handles, use, leave, door, robe, robed, welcomeBack, wash };
})();
