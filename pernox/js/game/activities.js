// 활동 · 이동 · 부대 행사 · 외계 생물 (Alpha 0.3)
'use strict';
PX.Act = (() => {
  const U = PX.U, St = PX.St, Cal = PX.Cal, W = PX.W;
  const G = () => PX.Game;
  const withCap = () => { const g = G(); return g.cap.map === g.mapId && ['follow', 'visit', 'stay'].includes(PX.Cap.mode); };
  async function lines(ls) { const g = G(); g.modal++; await PX.Dlg.runLines(ls); PX.Dlg.close(); g.modal--; }
  async function capSay(key, extra) {
    if (!withCap()) return;
    const pool = (PX.DLG_CAP2.activity[key] || []).concat(extra || []);
    if (!pool.length) return;
    G().cap.setDirTo(G().player.x, G().player.y);
    const g = G(); g.modal++; await PX.Dlg.runLines(U.pickFresh('capSay_' + key, pool), { reply: true }); PX.Dlg.close(); g.modal--;
  }
  const once = (k) => { const S = St.S; if (S.done[k]) return false; S.done[k] = 1; return true; };
  const ARRIVE = { base: [27.5, 58.5], dome: [23.5, 40.5], plaza: [26.5, 45.5] };

  // ---------- 이동 ----------
  async function travelMenu() {
    const g = G(), S = St.S, md = PX.MAPS[g.mapId];
    if (PX.Op && PX.Op.inField()) return PX.Op.board(); // 합동작전 중: 작전 일과
    const list = (md.travel || []).filter(t => PX.MAPS[t.to]);
    if (!list.length) { PX.UI.toast('이곳에서는 다른 곳으로 갈 수 없어요'); return; }
    const it = await PX.UI.menu(`${md.name} · 이동`, list.map(t => ({ t: t.label, sub: `${t.mins >= 60 ? Math.round(t.mins / 60) + '시간' : t.mins + '분'}${t.need === 'scout' ? ' · 수색팀 소속이거나 대위와 동행할 때' : t.need === 'adult' ? ' · 성인만' : ''}`, k: t })));
    if (!it) return;
    const t = it.k;
    if (t.need === 'scout' && S.player.job !== 'scout' && PX.Cap.mode !== 'follow') { PX.UI.toast('🚫 출입 제한 구역이에요. 수색팀 소속이거나 대위와 동행해야 해요.'); return; }
    if (t.need === 'pass' && !PX.JOBS[S.player.job].military && !St.has('pass')) { PX.UI.toast('🪪 부대 출입 허가증이 필요해요'); return; }
    if (t.need === 'adult' && !S.done.adultOk) {
      const ok = await PX.UI.ask('루비웨이', '루비웨이는 성인 대상 유흥 · 데이트 구역이에요. 성인이고, 직접 선택해서 들어가시나요? (노골적인 묘사는 나오지 않아요)', '네, 들어갈게요', '돌아가기');
      if (!ok) return; S.done.adultOk = 1;
    }
    await travel(t.to, t.mins);
  }
  async function travel(to, mins) {
    const g = G(), S = St.S;
    const following = PX.Cap.mode === 'follow' && g.cap.map === g.mapId;
    if (following && PX.Cap.onDuty()) { PX.Cap.release('나 근무 들어가야 돼. 조심히 다녀와.'); }
    const f = document.getElementById('fade'); f.classList.add('on', 'long');
    await U.sleep(500);
    St.advance(mins);
    const m = W.maps[to], a = ARRIVE[to] || (m.def.arrive ? [m.def.arrive[0] + 0.5, m.def.arrive[1] + 0.5] : [m.w / 2, m.h / 2]);
    g.enterMap(to, a[0], a[1]);
    if (following && PX.Cap.mode === 'follow') { PX.Cap.moveTo(to); g.cap.x = a[0] + 1; g.cap.y = a[1] - 0.5; PX.Cap.mode = 'follow'; }
    await U.sleep(300);
    f.classList.remove('on', 'long');
    PX.UI.toast(`📍 ${PX.MAPS[to].name}${mins >= 60 ? ` · ${Math.round(mins / 60)}시간 이동` : ''}`);
    const lore = PX.MAPS[to].lore && PX.LORE_BY_ID[PX.MAPS[to].lore];
    if (lore && once('visit_' + to)) setTimeout(() => PX.UI.toast(`📚 ${lore.originalTitle}: ${lore.description.slice(0, 48)}…`, 5000), 1200);
    if (following && PX.MAPS[to].kind === 'out') setTimeout(() => placeComment(true), 1500);
    if (following && to !== 'base' && to !== 'dome' && to !== 'plaza' && once('trip_' + to)) setTimeout(() => G().memory(`${PX.MAPS[to].name} 여행`, `${U.josa(S.capName, '와')} 함께 ${PX.MAPS[to].name}에 왔다.`, true), 2500);
  }
  // 대위가 장소에 대해 한마디 (동행 중)
  function placeComment(force) {
    const g = G();
    if (!withCap() || g.modal) return;
    const pool = PX.DLG_CAP2.placeAmb[g.mapId] || PX.DLG_CAP2.placeAmb._;
    if (!force && Math.random() < 0.4) return;
    g.bubble(g.cap, U.fmt(U.pickFresh('pamb_' + g.mapId, pool), PX.Dlg.ctx()), 3.2);
  }

  // ---------- 활동 ----------
  function goSit(o) { const p = G().player; const s = (o.seats || []).filter(s => !s.by).sort((a, b) => U.dist(a.x, a.y, p.x, p.y) - U.dist(b.x, b.y, p.x, p.y))[0]; if (s) p.sitOn(s); return s; }
  function nearSeat(o, r = 2.5) { const m = W.maps[G().mapId], p = G().player; let best = null, bd = r; for (const x of m.objs) if (x.seats) for (const s of x.seats) { if (s.by) continue; const d = U.dist(s.x, s.y, o.x + o.fw / 2, o.y + o.fd / 2); if (d < bd) { bd = d; best = s; } } if (best) p.sitOn(best); return best; }
  const H = {};
  H.hang = async (o) => { // 철봉
    const p = G().player, S = St.S;
    p.x = o.x + o.fw / 2; p.y = o.y + 0.6; p.dir = 0;
    p.doPose('hang', 60); p.z = 16;
    const n = await PX.Mini.timing({ title: '💪 철봉 · 턱걸이', help: '몸을 끌어올릴 때(초록 구간) 누르세요. 6번 도전!', rounds: 6, speed: 75, btn: '당기기!', bg: '#3d4a56',
      draw: (R, round, hits) => { R(30, 20, 60, 3, '#c9ced4'); const up = (performance.now() / 300) % 2 < 1; R(54, 23, 3, 10, '#e9b48c'); R(63, 23, 3, 10, '#e9b48c'); R(52, up ? 30 : 36, 16, 14, '#3b5fa8'); R(53, up ? 18 : 24, 14, 12, '#fde3cf'); } });
    p.doPose(null, 0); p.tempPose = null; p.z = 0;
    const reps = Math.round(n * 6) * 2 + Math.floor(Math.random() * 2);
    S.energy = Math.max(0, S.energy - 6); St.advance(10);
    const best = reps > (S.stats.pullup || 0) && reps > 0;
    S.stats.pullup = Math.max(S.stats.pullup || 0, reps);
    PX.UI.toast(`💪 턱걸이 ${reps}개${best ? ' · 개인 최고!' : ''}`);
    await capSay('hang');
  };
  H.armwrestle = async (o) => {
    const g = G(), S = St.S, cap = withCap();
    const foeN = g.npcs.find(n => n.map === g.mapId && U.dist(n.x, n.y, g.player.x, g.player.y) < 7);
    const foe = cap ? S.capName : foeN ? foeN.def.name : '부대원';
    if (!nearSeat(o, 2)) { /* 서서 해도 된다 */ }
    if (cap) await lines(['C*:나랑? 진심이야?', 'C^:좋아. 왼손 쓸게. 공평하게.']);
    const win = await PX.Mini.tapRace({ title: `💪 팔씨름 · vs ${foe}`, help: '버튼을 최대한 빨리 연타!', left: '나', right: foe, foe: cap ? 5.2 : 6.5, bg: '#4a2f3a',
      draw: (R, me) => { R(20, 40, 80, 20, '#c43d4b'); R(58 - (me - 50) * 0.3, 26, 6, 18, '#fde3cf'); } });
    G().player.leaveSeat();
    S.stats.armwins = (S.stats.armwins || 0) + (win ? 1 : 0);
    if (cap) await lines(win ? ['C!:…', 'C:졌다. 진짜로 졌어. 일부러 아니야.', 'C*:…아마도.'] : ['C^:힘 좋은데? 손이 따끈하다.', 'C*:이긴 상으로 손 좀 더 잡고 있을게.']);
    else PX.UI.toast(win ? `🏆 ${foe}을(를) 이겼다!`.replace('을(를)', U.hasBatchim(foe) ? '을' : '를') : `😤 ${foe}에게 졌다`);
    if (cap) St.addAff(3);
  };
  H.fish = async (o) => {
    const S = St.S, g = G();
    const sea = g.mapId === 'planet3';
    const sc = await PX.Mini.timing({ title: '🎣 낚시', help: '찌가 움직일 때(초록 구간) 낚아채세요!', rounds: 3, speed: 55, zoneW: 18, btn: '낚아채기!', bg: sea ? '#225d82' : '#2f6f8f',
      draw: (R) => { R(0, 0, 120, 120, sea ? '#2a6f9a' : '#3f8fbf'); R(58, 40 + Math.sin(performance.now() / 180) * 3, 4, 6, '#ff5a5a'); R(59, 10, 1, 32, '#e9eef2'); } });
    const n = Math.round(sc * 3);
    St.advance(30);
    if (n) { St.addItem('fish', n); PX.UI.toast(`🐟 물고기 ${n}마리! (캠프파이어나 숙소 주방에서 구울 수 있어요)`); G().codex('aquafish'); } else PX.UI.toast('🎣 오늘은 입질이 없다…');
    await capSay('fish');
  };
  H.harvest = async (o) => {
    const S = St.S, inSeason = [4, 9].includes(S.time.m);
    const sc = await PX.Mini.targets({ title: '🌱 향열매 수확', help: '익은 열매를 빨리 따세요!', time: 15, goal: 14, color: '#ff8b5e', bg: '#5a4a3a', draw: (R) => { for (let i = 0; i < 6; i++) R(10 + i * 18, 70, 8, 30, '#4fa35a'); } });
    const n = Math.max(1, Math.round(sc * (inSeason ? 6 : 3)));
    St.addItem('rawfruit', n); St.advance(30); S.energy = Math.max(0, S.energy - 5);
    PX.UI.toast(`🍊 향열매 ${n}개 수확${inSeason ? ' (수확철 보너스!)' : ''}`);
    G().codex('fruit');
    await capSay('harvest');
  };
  H.view = async (o) => {
    const S = St.S, g = G(), t = S.time.min, id = g.mapId;
    const sunset = t >= 17 * 60 && t < 19 * 60 + 30, night = t >= 19 * 60 + 30 || t < 5 * 60, dawn = t >= 5 * 60 && t < 7 * 60;
    const views = {
      hill: sunset ? '돔시티 지붕 위로 인공 노을이 번진다. 유리 돔이 주황빛으로 물든다.' : night ? '돔시티 야경. 상업구역 네온과 항구 셔틀 불빛이 점점이 반짝인다.' : '돔시티 전경이 한눈에 들어온다. 멀리 농업돔과 인공호수가 보인다.',
      silverdesert: dawn || sunset ? '은빛 모래 언덕이 빛을 받아 일렁인다. 바람이 지나간 자리마다 은색 물결이 생긴다.' : night ? '은사막 위로 별이 쏟아질 듯하다. 지평선 끝에 외곽 통신탑 불빛 하나.' : '끝없는 은사막. 안전 경계 너머로 붉은 사막이 이어진다.',
      corridor: t >= 17 * 60 + 40 && t < 18 * 60 + 30 ? '유리 복도 전체가 노을빛으로 바뀐다. 이 시간만의 색이다.' : '유리 너머로 농업돔의 초록 지붕이 보인다.',
      station: '창밖으로 붉은 페르녹스가 천천히 돈다. 그 너머로 항로등이 줄지어 있다.',
      skylounge: '거대한 안테나 너머로 먼 행성의 궤도광이 흐른다.',
      aurora: night ? '하늘 가득 초록과 보랏빛 오로라가 커튼처럼 흔들린다.' : '아직 낮이라 오로라는 보이지 않는다. 밤에 다시 오자.',
      planet6: night ? '얼음 평원 위로 오로라가 내려앉는다.' : '얼음 해변이 냉광 조명을 받아 반짝인다.',
    };
    const text = views[id] || '경치가 좋다.';
    G().player.setDirTo(o.x, o.y - 2);
    await lines(['N:' + text]);
    St.advance(15);
    if (withCap()) {
      await lines(U.pick(PX.DLG_CAP2.activity.view));
      St.addAff(3);
      if (once('view_' + id + (sunset ? 's' : night ? 'n' : 'd'))) G().memory(`${PX.MAPS[id].name}에서`, text.slice(0, 40), true);
    }
  };
  H.tent = async (o) => {
    const it = await PX.UI.menu('투명 돔 텐트', [{ t: '🪑 안에 들어가 앉기', k: 'sit' }, { t: '😴 한숨 자기 (1시간)', k: 'nap' }]);
    if (!it) return;
    if (it.k === 'sit') { goSit(o); if (withCap()) { PX.Cap.sitNear(G()); await capSay('tent'); } return; }
    G().fade(); St.advance(60); St.S.energy = Math.min(100, St.S.energy + 18); PX.UI.toast('💤 텐트 안에서 한숨 잤다 (기력 +18)');
  };
  H.campfire = async (o) => {
    const S = St.S;
    nearSeat(o, 3);
    if (withCap()) PX.Cap.sitNear(G());
    const night = S.time.min >= 19 * 60 || S.time.min < 5 * 60;
    if (St.has('fish')) { St.addItem('fish', -1); St.addItem('grilledFish', 1); PX.UI.toast('🔥 물고기를 구웠다 (구운 생선 +1)'); }
    St.advance(30); S.energy = Math.min(100, S.energy + 8);
    if (withCap()) {
      await lines(U.pick(PX.DLG_CAP2.activity.campfire));
      St.addAff(night ? 6 : 3);
      if (night && once('campfire_night')) G().memory('캠프파이어', '불꽃이 튀는 소리, 별, 그리고 대위의 낮은 목소리.', true);
    } else await lines(['N:타닥타닥 불꽃 튀는 소리. 마음이 조용해진다.']);
  };
  H.sandcastle = async () => {
    const win = await PX.Mini.tapRace({ title: '🏰 모래성 쌓기', help: '파도가 오기 전에 빨리 쌓으세요! 연타!', left: '모래성', right: '파도', foe: 5.5, btn: '쌓기!', bg: '#efe6d2', draw: (R, me) => { R(40, 90 - me * 0.6, 40, me * 0.6, '#d6c9aa'); R(55, 84 - me * 0.6, 10, 6, '#c9654a'); } });
    St.advance(20);
    PX.UI.toast(win ? '🏰 멋진 모래성 완성!' : '🌊 파도에 무너졌다…');
    if (withCap()) { await lines(win ? ['C^:오, 잘 만들었다. 깃발 꽂자.', 'C*:성 이름은 네 이름으로.'] : ['C:무너졌네. 다시 쌓자. 이번엔 내가 파도 막을게.']); if (win && once('sandcastle')) G().memory('모래성', '해변에서 같이 모래성을 쌓았다.', true); }
  };
  H.onsen = async (o) => {
    goSit(o); if (withCap()) PX.Cap.sitNear(G());
    G().fade(); St.advance(40); St.S.energy = Math.min(100, St.S.energy + 30);
    PX.UI.toast('♨️ 광물온천에 몸을 담갔다 (기력 +30)');
    await capSay('onsen');
    if (withCap() && once('onsen')) G().memory('광물온천', '대위는 3분 만에 덥다고 했지만 끝까지 옆에 있었다.', true);
  };
  H.salvage = async (o) => {
    const S = St.S, g = G();
    if (o.salvagedDay === S.day) { PX.UI.toast('이미 살펴본 잔해예요'); return; }
    o.salvagedDay = S.day;
    St.advance(20); S.energy = Math.max(0, S.energy - 6);
    if (Math.random() < 0.35) { // 가벼운 전투: 모래 갑각충 기습
      PX.UI.toast('⚠️ 잔해 밑에서 모래 갑각충이 튀어나왔다!');
      const sc = await PX.Mini.timing({ title: '⚔️ 모래 갑각충', help: '공격이 오는 순간(초록 구간) 피하기·반격!', rounds: 4, speed: 85, zoneW: 20, btn: '회피 · 반격', bg: '#5a2f25',
        draw: (R, round) => { const t = performance.now() / 150; R(50 + Math.sin(t) * 8, 30, 20, 12, '#8a3b30'); R(48 + Math.sin(t) * 8, 34, 4, 4, '#ffd166'); R(70 + Math.sin(t) * 8, 34, 4, 4, '#ffd166'); } });
      if (sc >= 0.5) { PX.UI.toast('🛡️ 갑각충을 쫓아냈다!'); St.addItem('chitin'); g.codex('chitin'); }
      else { S.energy = Math.max(0, S.energy - 15); PX.UI.toast('🤕 살짝 긁혔다 (기력 -15). 무리하지 말자.'); if (withCap()) await lines(['C!:야, 괜찮아?', 'C:보여 줘. …긁힌 거네. 의무동 가자. 다음엔 내 뒤에 있어.']); return; }
    }
    const r = Math.random();
    if (r < 0.45) { St.addItem('mineral'); g.codex('mineral'); PX.UI.toast('💎 외계 광물 조각을 찾았다'); }
    else if (r < 0.8) { St.addItem('chitin'); g.codex('chitin'); PX.UI.toast('🦂 외계 갑각 잔해를 회수했다'); }
    else PX.UI.toast('🔩 쓸 만한 건 없었다');
    await capSay('salvage');
  };
  H.rail = async () => {
    const S = St.S;
    if (!St.spend(15)) { PX.UI.toast('돈이 모자라요 (₢15)'); return; }
    G().fade(); St.advance(40);
    await lines(['N:투명 객실 너머로 빛을 머금은 광물층이 흘러간다. 오래된 채굴 기계가 어둠 속에서 거인처럼 서 있다.', ...(withCap() ? ['C:저 기계 아직 돌아가겠는데.', 'C^:…아니, 지금은 기계 말고 너 보는 중이야.'] : [])]);
    if (once('railtour')) G().memory('빛터널 레일투어', '광물층 사이를 달리는 열차.', true);
    if (withCap()) St.addAff(4);
  };
  H.exhibit = async () => {
    const ex = U.pick(['초기 개척민의 채굴복. 헬멧 유리에 긁힌 자국이 그대로 남아 있다.', '거대 드릴의 축소 모형. 실제는 이보다 서른 배 크다고 한다.', '광물벽 단면. 층마다 다른 색으로 빛난다.', '개척민 생활관 재현: 좁은 침대 두 개와 손때 묻은 주전자.', '안전 점검을 마친 구역만 개방한다는 안내문.']);
    await lines(['N:' + ex]); St.advance(10); G().codex('mineral');
    if (withCap() && Math.random() < 0.5) await lines(['C:드릴 구조 봐. 저렇게 만들면 진동이 안 와.', 'C*:…재미없지? 너 표정이 다 말해 주네.']);
  };
  H.dice = async () => {
    const S = St.S, cap = withCap();
    const it = await PX.UI.menu('주사위 한 판', [{ t: `🎲 ${cap ? S.capName + '와(과) 내기' : '딜러와 한 판'} (₢10)`.replace('와(과)', U.hasBatchim(S.capName) ? '과' : '와'), k: 1 }]);
    if (!it) return;
    if (!St.spend(10)) { PX.UI.toast('돈이 모자라요'); return; }
    const a = 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6), b = 2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
    await lines([`N:🎲 내 주사위 ${a} · ${cap ? '대위' : '딜러'} ${b}`]);
    St.advance(15);
    if (a > b) { S.money += 20; PX.UI.toast('🎉 이겼다! ₢20'); }
    if (!cap) return;
    if (a > b) {
      const pen = await PX.UI.menu('내가 이겼다! 벌칙은?', [{ t: '😚 볼에 뽀뽀 받기', k: 'cheek' }, { t: '🎤 노래 한 소절', k: 'song' }, { t: '🧗 업어 달라고 하기', k: 'carry' }, { t: '벌칙 없이 봐주기', k: 'none' }]);
      if (pen && pen.k === 'song') await lines(['C;:…진짜?', 'N:대위가 낮은 목소리로 옛 지구 노래를 한 소절 부른다. 의외로 음이 정확하다.', 'C*:박수 쳐.']);
      else if (pen && pen.k !== 'none' && St.S.rel.cap.stage >= (pen.k === 'cheek' ? 3 : 2)) { await PX.Cap.doSkin(pen.k, false); await lines(['C^:벌칙 받는 게 이렇게 좋을 수가.']); }
      else await lines(['C^:봐주는 거야? 다음엔 내가 봐줄게.']);
    } else if (a < b) await lines(['C*:내가 이겼네. 벌칙은…', 'C^:오늘 저녁 같이 먹기. 끝.', 'C:어려운 거 시킬 줄 알았지?']);
    else await lines(['C:비겼다. 한 판 더?']);
    St.addAff(3);
  };
  H.perfume = async () => {
    const S = St.S;
    const top = await PX.UI.menu('향 조합 1/3 · 첫 향', [{ t: '🍊 향열매', k: '향열매' }, { t: '🌸 유리꽃', k: '유리꽃' }, { t: '🌿 발광초 잎', k: '발광초' }]); if (!top) return;
    const mid = await PX.UI.menu('향 조합 2/3 · 가운데 향', [{ t: '❄️ 제6행성 서리', k: '서리' }, { t: '🪵 따뜻한 나무', k: '나무' }, { t: '🧂 광물염', k: '광물염' }]); if (!mid) return;
    const base = await PX.UI.menu('향 조합 3/3 · 잔향', [{ t: '🌙 은사막 밤공기', k: '밤공기' }, { t: '☕ 지구 커피', k: '커피' }, { t: '🍯 꿀', k: '꿀' }]); if (!base) return;
    if (!St.spend(45)) { PX.UI.toast('돈이 모자라요 (₢45)'); return; }
    const name = `${top.k}·${mid.k}·${base.k}`;
    S.myPerfume = name; St.addItem('perfume'); St.advance(30);
    await lines([`N:피부 온도에 맞춰 섞인 향. 「${name}」.`, ...(withCap() ? ['N:대위가 손목에 코를 가까이 댄다.', 'C:…이거 기억할게. 이제 이 냄새 나면 너 생각날 거야.'] : [])]);
    if (withCap() && once('perfume')) G().memory('나만의 향', `「${name}」. 대위가 이 향을 기억하겠다고 했다.`, true);
  };
  H.dance = async () => {
    const sc = await PX.Mini.timing({ title: '💃 실버마스크 · 춤', help: '박자(초록 구간)에 맞춰 누르세요!', rounds: 6, speed: 80, btn: '스텝!', bg: '#2a1f4f' });
    St.advance(20);
    if (withCap()) await lines(sc > 0.6 ? ['C*:가면 써도 네가 제일 눈에 띄어.', 'C^:한 곡 더.'] : ['C:박자 놓쳐도 돼. 내가 맞출게.', 'N:대위가 큰 손으로 허리를 잡고 천천히 이끈다.']);
    if (withCap() && once('dance')) G().memory('가면 아래에서', '실버마스크에서 대위와 춤을 췄다.', true);
  };
  H.perform = async (o) => {
    const g = G();
    if (g.mapId === 'showroom') { // 블라인드 쇼룸: 실루엣 공연 관람
      if (!St.spend(20)) { PX.UI.toast('돈이 모자라요 (₢20)'); return; }
      nearSeat(o, 6); if (withCap()) PX.Cap.sitNear(g);
      St.advance(40);
      await lines(['N:반투명 커튼 너머로 실루엣이 음악에 맞춰 움직인다. 직접 접촉은 금지된 공연이다.', ...(withCap() ? ['C:…', 'C*:솔직히 말할게. 질투 나. 내가 더 낫지 않아?', { q: [['대위님이 더 나아요.', 4, ['C^:그치? 그 말 들으려고 참았어.']], ['공연 보는 중이에요.', 1, ['C;:응… 조용히 볼게.']]] }] : [])]);
      return;
    }
    const sc = await PX.Mini.timing({ title: '🎤 무대 공연', help: '노래 박자(초록 구간)에 맞춰 누르세요!', rounds: 5, speed: 70, btn: '♪', bg: '#5a3f2a' });
    St.advance(20);
    PX.UI.toast(sc > 0.6 ? '👏 박수가 쏟아진다!' : '🎤 떨렸지만 끝까지 불렀다');
    if (withCap()) await lines(sc > 0.6 ? ['C!:…', 'C^:제일 크게 박수 친 사람 나야. 알지?'] : ['C:잘했어. 진짜로. 나는 무대 올라가면 다리 떨려.']);
  };
  H.shoot = async () => {
    const sc = await PX.Mini.targets({ title: '🎯 사격장', help: '표적을 빨리 정확하게!', time: 20, goal: 18, color: '#d0563b', bg: '#5a5040' });
    St.advance(20); St.S.energy = Math.max(0, St.S.energy - 4);
    const g = Math.round(sc * 100); St.S.stats.shoot = Math.max(St.S.stats.shoot || 0, g);
    PX.UI.toast(`🎯 사격 점수 ${g}점`);
    await capSay('shoot');
  };
  H.course = async () => {
    const sc = await PX.Mini.timing({ title: '🏃 장애물 코스', help: '허들 앞(초록 구간)에서 점프!', rounds: 5, speed: 90, btn: '점프!', bg: '#7a5a3a', draw: (R) => { R(0, 60, 120, 4, '#e8e3c8'); } });
    const sec = (42 - sc * 14 + Math.random() * 2).toFixed(1);
    St.advance(15); St.S.energy = Math.max(0, St.S.energy - 8);
    PX.UI.toast(`🏃 기록 ${sec}초`);
    await capSay('course');
  };
  H.observe = async (c) => { // 외계 생물 관찰
    const k = c.app.critter;
    await lines(['N:' + (k === 'lizard' ? '붉은 모래와 같은 색의 작은 도마뱀. 눈이 마주치자 모래 속으로 쏙 들어간다.' : '반투명한 생명체가 공중에 둥실 떠 있다. 가까이 가자 천천히 멀어진다.')]);
    G().codex(k === 'lizard' ? 'lizard' : 'drifter');
    if (withCap()) await lines([k === 'lizard' ? 'C:저건 무해해. 괜히 건드리지만 마.' : 'C:예쁘지? 근데 손은 대지 마. 독은 없는데 따가워.']);
  };

  // ---------- 상점 매대 ----------
  H.stall = async () => { const md = PX.MAPS[G().mapId]; PX.UI.shop((md.shops && md.shops.stall) || 'festival'); };

  // ---------- 은밀숙소 (LB83) · 연인 이상 · 대위와 함께 · 성인 요소는 암시만 ----------
  const INN_ROOMS = [
    { id: 'inn_mirror', t: '🪞 거울 객실', sub: '거울 벽 · 원형 침대 · 무드등', price: 120 },
    { id: 'inn_bath', t: '🛁 큰 욕조 객실', sub: '거품 욕조 · 캔들 · 큰 침대', price: 140 },
    { id: 'inn_water', t: '🌊 물침대 객실', sub: '물침대 · 별빛 창 · 냉장고', price: 160 },
  ];
  const innBooked = () => { const b = St.S.done.innBook; return b && St.absMin() < b.until ? b : null; };
  async function goInnRoom(id) {
    const g = G(), m = W.maps[id];
    const f = document.getElementById('fade'); f.classList.add('on');
    await U.sleep(450);
    g.enterMap(id, m.exit.x + 0.5, m.exit.y - 1.5);
    g.player.dir = 2;
    await U.sleep(250); f.classList.remove('on');
  }
  async function innDesk() {
    const S = St.S, b = innBooked();
    if (b) { const it = await PX.UI.menu('은밀숙소 프런트', [{ t: '🔑 객실로 올라가기', k: 1, sub: PX.MAPS[b.room].name }, { t: '그만두기', k: 0 }]); if (it && it.k) await goInnRoom(b.room); return; }
    if (!withCap() || S.rel.cap.stage < 4) { await lines(['N:예약제 테마형 숙박시설. 거울 객실, 큰 욕조 객실, 물침대 객실…', 'N:(대위와 연인 사이이고 함께 왔을 때 예약할 수 있어요)']); return; }
    G().cap.setDirTo(G().player.x, G().player.y);
    await lines([U.pick(['C*:예약 화면 봤어? …물침대 방도 있대.', 'C^:고르는 건 네가 해. 난 따라갈게.', 'C*:어느 방이든. 근데 욕조 큰 방은 좀 궁금하긴 하다.'])]);
    const it = await PX.UI.menu('은밀숙소 · 객실 예약 (다음 날 정오까지)', INN_ROOMS.map(r => ({ t: `${r.t} · ₢${r.price}`, sub: r.sub, k: r })).concat([{ t: '구경만 할래요', k: null }]));
    if (!it || !it.k) { await lines(['C:응. 구경만. 화면 끌게.']); return; }
    const r = it.k;
    if (!St.spend(r.price)) { PX.UI.toast('돈이 모자라요'); return; }
    const until = (S.day + 1) * 1440 + 12 * 60;
    S.done.innBook = { room: r.id, until };
    await lines([U.pick(['C!:…진짜 고른 거다? 무르기 없다.', 'C^:카드키 받았다. 가자.', 'C*:엘리베이터 안에서 웃지 마. 나 지금 표정 관리 중이야.'])]);
    await goInnRoom(r.id);
    if (once('inn_' + r.id)) setTimeout(() => G().trigger(() => lines(INN_ARRIVE[r.id])), 600);
  }
  const INN_ARRIVE = {
    inn_mirror: ['N:사방이 거울이다. 어디를 봐도 우리 둘이 보인다.', 'C*:…이거 좀 민망한데. 어딜 봐도 내 얼굴이야.', 'C^:근데 네가 여러 명이라 그건 좋다.'],
    inn_bath: ['N:캔들 불빛이 욕조 물 위에서 흔들린다.', 'C*:욕조 진짜 크네. 둘이 들어가도 남겠다.', 'C:물 받아 놓을까? 온도는 네가 정해.'],
    inn_water: ['N:창밖으로 루비웨이 불빛이 별처럼 번진다. 침대가 살짝 출렁인다.', 'C!:이거… 앉으니까 흔들린다. 배 타는 거 같아.', 'C*:멀미 나면 네 탓이다.'],
  };
  // 객실 침대: 같이 눕기 / 아침까지 (화면은 암전, 묘사는 하지 않음)
  async function innBed(o) {
    const g = G(), S = St.S;
    const water = o.fid === 'waterbed';
    const it = await PX.UI.menu(o.f.name, [{ t: '🛏️ 잠깐 눕기', k: 'lie' }, ...(withCap() ? [{ t: '🤍 같이 누워 이야기하기', k: 'talk' }, { t: '🌙 불 끄고 아침까지', k: 'night' }] : [{ t: '😴 혼자 아침까지 자기', k: 'solo' }])]);
    if (!it) return;
    goSit(o);
    if (it.k === 'lie') { if (water) PX.UI.toast('🌊 침대가 출렁인다'); return; }
    if (it.k === 'solo') { await g.sleepUntil(9); return; }
    PX.Cap.sitNear(g);
    if (it.k === 'talk') {
      await U.sleep(600);
      await lines([U.pick([
        ['C*:천장에도 거울 있었으면 큰일 날 뻔했다.', 'P:왜요?', 'C^:너만 보느라 잠 못 자지.'],
        ['C:…이렇게 가만히 누워 있는 거, 작전 나가면 제일 생각나.', 'C*:별거 아닌데. 옆에 네가 숨 쉬는 소리.'],
        ['C*:팔 베고 누울래? 저려도 말 안 할게.', { q: [['그럼 실례할게요.', 4, ['C^:실례는 무슨. 원래 네 자리야.']], ['조금만 이대로 있어요.', 3, ['C:응. 조금만. …아니, 많이.']]] }],
        ['C:우리 처음 만났을 때 기억나? 너 나 엄청 경계했잖아.', 'C*:지금은 내 옆에서 하품하고. 많이 컸다, 우리.'],
      ]).concat(water ? ['N:침대가 둘의 숨에 맞춰 천천히 출렁인다.'] : [])]);
      St.addAff(4); St.advance(30);
      if (once('innTalk')) g.memory('은밀숙소의 밤', '같이 누워 천장을 보며 아무 얘기나 했다.', true);
      return;
    }
    // 아침까지: 대위는 먼저 묻고, 거절하면 존중한다
    await lines(['C*:불 끌까?']);
    const ok = await PX.UI.ask('🌙 불 끄고 아침까지', '대위와 함께 아침까지 있을까요?', '응, 꺼요', '조금만 더 이야기해요');
    if (!ok) { await lines(['C:그래. 서두를 거 하나도 없어.', 'C*:네가 좋은 속도가 내 속도야.']); return; }
    await lines(['N:대위가 손을 뻗어 무드등을 끈다. 창밖 불빛만 남는다.', 'C*:…잘 자. 아니, 아직 자지 마.']);
    S.cap.stay = 'bed'; PX.Cap.mode = 'stay';
    St.addAff(6);
    if (once('innNight')) g.memory('은밀숙소', '루비웨이의 밤. 다음 날 아침, 대위가 먼저 좋은 아침이라고 말했다.', true);
    await g.sleepUntil(9);
  }
  H.bath = async (o) => {
    const g = G(), S = St.S;
    const it = await PX.UI.menu('🛁 큰 욕조', [{ t: '🫧 거품 목욕 (40분)', k: 'solo' }, ...(withCap() ? [{ t: '🛁 같이 들어가기', k: 'both' }] : [])]);
    if (!it) return;
    goSit(o);
    if (it.k === 'both') {
      await lines(['C*:…진짜? 나 들어가면 물 넘친다.']);
      const ok = await PX.UI.ask('🛁 같이 들어가기', '대위와 함께 욕조에 들어갈까요?', '같이 들어가요', '역시 혼자 할게요');
      if (!ok) { await lines(['C:응, 알았어. 밖에서 기다릴게. 천천히 해.']); }
      else {
        PX.Cap.sitNear(g);
        g.fade(); St.advance(40);
        await lines([U.pick([
          ['N:거품이 어깨까지 차오른다. 대위가 내 등 뒤에 기대 앉는다.', 'C*:…이래서 사람들이 욕조 큰 방을 고르는구나.', 'C^:작전 끝나고 이거 하나만 생각날 것 같다.'],
          ['N:캔들 불빛 아래, 대위가 거품을 한 줌 떠서 내 머리 위에 올린다.', 'C^:왕관이다. 잘 어울려.', 'C*:…가만있어. 사진 찍고 싶은데 단말이 저기 있네.'],
        ])]);
        S.energy = Math.min(100, S.energy + 35); St.addAff(5);
        if (once('innBath')) g.memory('큰 욕조', '대위가 거품으로 왕관을 만들어 줬다.', true);
        return;
      }
    }
    g.fade(); St.advance(40); S.energy = Math.min(100, S.energy + 30);
    PX.UI.toast('🫧 거품 목욕을 했다 (기력 +30)');
  };
  H.vanity = async () => {
    const g = G();
    if (!withCap()) { PX.UI.toast('🪞 거울 속의 나. 오늘 좀 괜찮은데?'); return; }
    PX.Cap.sitNear(g);
    await lines([U.pick([
      ['N:거울 앞에 나란히 선다.', 'C*:이렇게 보니까 우리, 좀 잘 어울리지 않냐.', 'C^:아니다. 네가 너무 예뻐서 내가 손해다.'],
      ['C:머리 묶어 줄까? 매듭은 내가 전문이야. 로프 매듭.', 'C*:…포니테일은 처음인데. 가만있어 봐.'],
      ['N:대위가 거울 너머로 나를 보며 넥타이 없는 칼라를 괜히 고친다.', 'C^:뭘 봐. 잘생겼지.'],
    ])]);
    St.addAff(2);
    if (once('innMirror')) g.memory('거울 앞의 우리', '거울 속 두 사람이 꽤 잘 어울렸다.', true);
  };

  // ---------- 부대 행사 ----------
  const BASE_EV = ['LB38', 'LB46', 'LB49', 'LB47', 'LB44', 'LB48', 'LB42', 'LB45', 'LB43', 'LB40', 'LB41', 'LB52', 'LB55', 'LB56', 'LB39'];
  function activeBase() { const S = St.S; return BASE_EV.map(id => PX.LORE_BY_ID[id]).filter(e => Cal.openAt(e, S.time, S.time.min)); }
  function quizQs(n = 5) {
    const pool = PX.LORE.filter(e => ['festival', 'base'].includes(e.eventType) && e.months.length === 1);
    const qs = [];
    for (const e of pool.sort(() => Math.random() - 0.5).slice(0, n)) {
      const c = e.months[0]; const opts = new Set([c]); while (opts.size < 4) opts.add(1 + Math.floor(Math.random() * 12));
      const a = [...opts].sort((x, y) => x - y); qs.push({ q: `「${e.originalTitle}」은(는) 몇 월 행사일까요?`.replace('은(는)', U.hasBatchim(e.originalTitle) ? '은' : '는'), a: a.map(m => m + '월'), c: a.indexOf(c) });
    }
    return qs;
  }
  async function eventBooth() {
    const S = St.S, ev = activeBase();
    if (!ev.length) { PX.UI.toast('지금은 진행 중인 부대 행사가 없어요. 단말 일정표에서 날짜를 확인하세요.'); return; }
    const e = ev[0];
    const A = {
      LB38: [['💪 팔씨름', () => H.armwrestle({ x: 34, y: 33, fw: 3, fd: 1 })], ['🪢 줄다리기', () => PX.Mini.tapRace({ title: '🪢 줄다리기', help: '연타! 팀이 이기게!', left: '우리 팀', right: '상대 팀', foe: 6.5 })], ['🏃 장애물 달리기', () => H.course()], ['⚡ 반응 속도', () => PX.Mini.targets({ title: '⚡ 반응 속도 게임', help: '불이 켜진 곳을 빨리!', time: 15, goal: 14, color: '#ffd166' })]],
      LB46: [['🛸 드론 장애물 코스', () => PX.Mini.run('drone')], ['🎯 공중 표적 맞히기', () => PX.Mini.targets({ title: '🎯 공중 표적', help: '드론으로 표적을 맞히세요', time: 18, goal: 16, color: '#5fa8ff' })]],
      LB49: [['🔫 물총 표적', () => PX.Mini.targets({ title: '💦 여름 물총전', help: '상대 팀 표적을 맞히세요!', time: 20, goal: 18, color: '#5fc8e8', bg: '#2f5a7a' })], ['🚩 깃발 지키기', () => PX.Mini.tapRace({ title: '🚩 깃발 지키기', help: '연타로 깃발 사수!', foe: 6 })]],
      LB47: [['❓ 단체 퀴즈', () => PX.Mini.quiz({ title: '❓ 생활관 리그 퀴즈', help: '페르녹스 행사 상식!', qs: quizQs(5) })], ['🛏️ 침상 정리 속도전', () => PX.Mini.tapRace({ title: '🛏️ 침상 정리', help: '연타로 각 잡기!', left: '나', right: '옆 생활관', foe: 6 })], ['👾 게임 점수전', () => PX.Mini.targets({ title: '👾 점수전', help: '최대한 많이!', time: 15, goal: 14, color: '#ff6bd5', bg: '#2a1f4f' })]],
      LB44: [['🎖️ 기념 패치 만들기', async () => { const d = await PX.UI.menu('패치 디자인', [{ t: '🦂 갑각충 마크', k: 1 }, { t: '🌸 유리꽃 마크', k: 2 }, { t: '⭐ 606 별 마크', k: 3 }]); if (d) { St.addItem('patch'); PX.UI.toast('🎖️ 수제 패치 완성!'); if (withCap()) await lines(['C*:나한테도 하나 줘. …근데 이니셜은 네 거 넣어 줘.']); } return 1; }], ['📸 사진 부스', async () => { G().memory('부대문화제 사진', '사진 부스에서 찰칵.', true); return 1; }], ['👾 게임 코너', () => PX.Mini.targets({ title: '🎯 게임 코너', help: '표적 맞히기!', time: 15, goal: 14 })]],
      LB48: [['🎤 장기자랑 참가', () => H.perform({})], ['💪 팔씨름 시범 구경', async () => { await lines(['N:대위가 팔씨름 시범에 나섰다. 도전자 다섯 명이 차례로 쓰러진다.', 'C*:다음 도전자? …너는 봐줄게.']); return 1; }]],
      LB42: [['🎖️ 기념식 참석', async () => { await lines(['N:부대기가 오른다. 강태욱 중령이 단상 앞에 선다.', 'S:kang:오늘도 다들 무사하라.']); return 1; }], ['📸 단체사진', async () => { await lines(['N:단체사진. 대위가 슬쩍 내 옆에 선다.']); G().memory('창설기념제 단체사진', '대위는 꼭 내 옆에 섰다.', true); return 1; }], ['🎯 장비 체험', () => H.shoot()]],
      LB45: [['🧰 장비함 정돈', () => PX.Mini.timing({ title: '🧰 장비함 정돈', help: '칸에 맞춰 넣기!', rounds: 5 })], ['🏷️ 장비 이름 붙이기', async () => { const n = await PX.UI.menu('내 장비 이름', [{ t: '든든이', k: 1 }, { t: '번개', k: 2 }, { t: '대위님 2호', k: 3 }]); if (n && withCap()) await lines(n.k === 3 ? ['C!:…대위님 2호?', 'C^:1호는 나라는 거지? 좋다.'] : ['C:좋은 이름이다.']); return 1; }]],
      LB43: [['🪖 사열 행진', () => PX.Mini.timing({ title: '🪖 합동사열제', help: '구령에 맞춰 발을 맞추세요!', rounds: 6, speed: 60 })]],
      LB40: [['🩺 신체검사 받기', async () => { await lines(['N:체성분, 혈압, 시력, 중력 적응도 검사. 모두 정상이다.', ...(withCap() ? ['C:체중계 숫자는 근육이야. 근육.'] : [])]); return 1; }]],
      LB41: [['🦺 전투복 피팅', async () => { await lines(['N:전투복과 하네스 치수를 잰다.', ...(withCap() ? ['C:하네스 불편해 보인다. 잠깐만.', 'N:대위가 끈을 하나하나 고쳐 매 준다. 손끝이 조심스럽다.'] : [])]); return 1; }]],
      LB52: [['📁 서류 정리', () => PX.Mini.quiz({ title: '📁 보안감사 서류 정리', help: '맞는 분류를 고르세요', qs: quizQs(3) })]],
      LB55: [['🕯️ 기록 정리 돕기', async () => { await lines(['N:오래된 이름표와 낡은 패치를 하나씩 정리한다.', ...(withCap() ? ['C:…', 'N:대위는 오늘 말수가 적다. 대신 내 옆을 떠나지 않는다.', 'C:고마워. 같이 있어 줘서.'] : [])]); return 1; }]],
      LB56: [['🫧 세척 드론 구경', async () => { await lines(['N:세척 드론 수십 대가 돔 외벽을 따라 천천히 움직인다.']); return 1; }]],
      LB39: [['🧺 야유회 출발 (인공호수 공원)', async () => { await travel('lake', 30); return 1; }]],
    }[e.id] || [];
    const it = await PX.UI.menu(`🎪 ${e.originalTitle}`, A.map(([t, f], i) => ({ t, k: i, sub: i === 0 ? e.description.slice(0, 40) : null })));
    if (!it) return;
    const res = await A[it.k][1]();
    const key = 'ev_' + e.id + '_' + S.time.y;
    const prize = typeof res === 'number' || res === true ? 40 : 20;
    S.money += prize;
    PX.UI.toast(`🎪 ${e.originalTitle} 참가 · 상품 ₢${prize}`);
    if (once(key)) { St.addItem('festivalBadge'); G().memory(e.originalTitle, `${e.originalTitle}에 참가했다.${withCap() ? ' ' + e.captainReaction : ''}`, true); }
    if (withCap()) { await lines(['N:' + e.captainReaction]); St.addAff(4); }
  }

  // ---------- 외계 생물 ----------
  function spawnCritters(m) {
    const g = G();
    g.critters = [];
    for (const c of m.def.critters || []) for (let i = 0; i < c.n; i++) {
      const a = new PX.A.Actor('critter' + i + c.kind, { critter: c.kind }, { map: m.id, speed: c.kind === 'lizard' ? 1.6 : 0.6 });
      for (let k = 0; k < 20; k++) { const x = c.x0 + Math.floor(Math.random() * (c.x1 - c.x0)), y = c.y0 + Math.floor(Math.random() * (c.y1 - c.y0)); if (W.walkable(m, x, y)) { a.x = x + 0.5; a.y = y + 0.5; break; } }
      a.box = c; a.nextMove = performance.now() + Math.random() * 3000;
      g.critters.push(a);
    }
    if (PX.Ruby) PX.Ruby.spawn(m, g);
  }
  function critterThink() {
    const g = G(), now = performance.now(), m = W.maps[g.mapId];
    for (const a of g.critters || []) {
      if (a.extra) { PX.Ruby.think(a, m, g, now); continue; }
      if (now < a.nextMove || a.path.length) continue;
      a.nextMove = now + 2500 + Math.random() * 4000;
      const c = a.box, x = c.x0 + Math.floor(Math.random() * (c.x1 - c.x0)), y = c.y0 + Math.floor(Math.random() * (c.y1 - c.y0));
      if (U.dist(a.x, a.y, g.player.x, g.player.y) < 2 && a.app.critter === 'lizard') { a.hidden = true; setTimeout(() => (a.hidden = false), 3000); continue; }
      a.goTo(m, x, y);
    }
  }

  async function use(o) {
    if (o.use === 'shuttle') return travelMenu();
    if (o.use === 'event') return eventBooth();
    if (o.use === 'shop' && G().mapId === 'inn') return innDesk();
    if (PX.Ruby && PX.Ruby.H[o.use]) { await PX.Ruby.H[o.use](o); return true; }
    if (H[o.use]) { await H[o.use](o); return true; }
    return false;
  }
  const LABEL = { hang: '💪 철봉 매달리기', armwrestle: '💪 팔씨름', fish: '🎣 낚시하기', harvest: '🌱 수확하기', view: '🔭 경치 보기', tent: '⛺ 텐트', campfire: '🔥 불 쬐기', sandcastle: '🏰 모래성 쌓기', onsen: '♨️ 온천욕', salvage: '🔍 잔해 살펴보기', bath: '🛁 욕조', vanity: '🪞 거울 화장대', rail: '🚃 레일투어 (₢15)', exhibit: '🔍 전시 보기', dice: '🎲 주사위', perfume: '🧴 향 조합 (₢45)', dance: '💃 춤추기', drink: '🍹 한잔하기', perform: '🎤 무대', shoot: '🎯 사격', course: '🏃 장애물 코스', event: '🎪 부대 행사 참가', shuttle: '🧭 이동하기', stall: '🛍️ 매대' };
  return { use, LABEL, innBed, travel, travelMenu, placeComment, activeBase, spawnCritters, critterThink, observe: H.observe, withCap };
})();
