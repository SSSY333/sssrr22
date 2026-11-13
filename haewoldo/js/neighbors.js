/* =====================================================================
   이웃집 = 주민들 집
   · 「이웃집」 3채에 주인을 정하고, 마을에 3채를 더 지음 (옥자 할머니 · 우체부 아저씨 · 해월 민박)
   · 주민들은 아침엔 집에서 나오고, 저녁엔 각자 집으로 들어감 → 그 시간에 놀러 가면 집 안에서 만남
   · 집 안은 주인마다 다르게 꾸밈, 하루 한 번 놀러 가면 주인 말투로 반겨 주고 작은 먹을거리를 줌
   · 늦은 밤 · 아무도 없을 땐 문이 닫혀 있음
   ===================================================================== */
const NB_HOMES = {
  houseA: { name: '순덕 할머니 댁', who: ['halmeoni', 'kid'], gift: ['ricecake', '떡'], greet: '아이고, 우리 집까지 왔어? 들어와, 들어와. 떡 쪄 놨어.', again: '또 왔네. 할미는 좋아. 앉아서 쉬다 가.' },
  houseB: { name: '박 씨 아저씨네', who: ['fisher', 'kid2'], gift: ['f_mackerel', '고등어'], greet: '오, 어서 와. 집이 좀 비린내 나도 이해해 줘. 오늘 잡은 고등어 하나 가져가.', again: '또 왔구먼. 도윤이가 손님 왔다고 좋아하네.' },
  houseC: { name: '이장님 댁', who: ['chief'], gift: ['tangerine', '귤'], greet: '허허, 이장 집에 손님이라니 반갑네. 귤 좀 들고 가게.', again: '자주 와. 마을 얘기는 다 여기서 시작돼. 허허.' },
  houseD: { name: '옥자 할머니 댁', who: ['okja'], gift: ['seaweed', '미역'], greet: '어머, 우리 집엔 웬일이야? 바다 냄새 나지? 오늘 딴 미역 좀 줄게.', again: '왔어? 차 한 잔 하고 가.', b: { x: 84, y: 59, w: 2, h: 2, wallH: 17, roofH: 11, wall: '#e6f1f4', base: '#a9c3cc', roof: '#3f88a8', doorT: 0.55, windows: [['L', 0.1, 0.22], ['R', 0.35, 0.3]] } },
  houseE: { name: '우체부 아저씨네', who: ['postman'], gift: ['postcard', '엽서'], greet: '어, 우리 집을 다 찾아오셨네요! 예쁜 엽서가 남는데 하나 드릴게요.', again: '오늘도 배달 끝! 쉬다 가세요~', b: { x: 81, y: 49, w: 2, h: 2, wallH: 17, roofH: 11, wall: '#fbeee0', base: '#d8bfa0', roof: '#d9473f', doorT: 0.55, windows: [['L', 0.1, 0.22], ['R', 0.35, 0.3]] } },
  houseF: { name: '해월 민박', who: ['tourist', 'tourist2'], gift: ['cookie', '쿠키'], greet: '어머, 놀러 오셨어요? 저희 여기 민박에 묵고 있어요. 육지에서 사 온 쿠키 드세요!', again: '또 오셨네요! 오늘 어디가 제일 좋았는지 얘기해 주세요.', b: { x: 56, y: 49, w: 2, h: 2, wallH: 18, roofH: 11, wall: '#fff6e0', base: '#d9c8a0', roof: '#7a9a4a', doorT: 0.55, windows: [['L', 0.1, 0.22], ['R', 0.35, 0.3]] } },
};
const NB_INTERIORS = {
  houseA: { wall: '#f1e6d2', wall2: '#a8794e', floor: T.MAT, furn: [['dining', 2, 2], ['cushion', 2, 3], ['cushion', 4, 3], ['shelf', 0, 0], ['cuckoo', 2, 0], ['radio', 4, 0], ['miniOrange', 6, 0], ['bed', 5, 3], ['paperLantern', 1, 4]], visit: [[3.5, 3.5], [1.5, 2.5], [4.5, 2.5]] },
  houseB: { wall: '#e3eef2', wall2: '#2f6fa8', floor: T.FLOOR, furn: [['netDeco', 1, 0], ['tank', 3, 0], ['fridge', 5, 0], ['table', 2, 3], ['chair', 1, 3], ['chair', 3, 3], ['bed', 5, 3], ['crate', 0, 4], ['posterSea', 6, 0]], visit: [[4.5, 2.5], [1.5, 2.5], [3.5, 4.5]] },
  houseC: { wall: '#f1ead8', wall2: '#3f7f6a', floor: T.MAT, furn: [['desk', 1, 0], ['shelf', 3, 0], ['wallCal', 5, 0], ['bonsai', 6, 0], ['dining', 2, 3], ['cushion', 2, 4], ['cushion', 4, 3], ['bed', 5, 3], ['plant', 0, 4]], visit: [[1.5, 1.5], [3.5, 2.5], [4.5, 4.5]] },
  houseD: { wall: '#e6f1f4', wall2: '#3f88a8', floor: T.FLOOR, furn: [['gear', 1, 0], ['shellDeco', 3, 0], ['shellLamp', 4, 0], ['fishBowl', 6, 0], ['dining', 2, 3], ['cushion', 2, 4], ['bed', 5, 3], ['plant', 0, 4]], visit: [[3.5, 2.5], [1.5, 2.5], [4.5, 4.5]] },
  houseE: { wall: '#fbeee0', wall2: '#d9473f', floor: T.FLOOR, furn: [['desk', 1, 0], ['crate', 3, 0], ['crate', 4, 0], ['hatHook', 5, 0], ['table', 2, 3], ['chair', 3, 3], ['bed', 5, 3], ['bookStack', 0, 4], ['plant', 6, 0]], visit: [[1.5, 2.5], [4.5, 2.5], [2.5, 4.5]] },
  houseF: { wall: '#fff6e0', wall2: '#7a9a4a', floor: T.FLOOR, furn: [['bed', 0, 1], ['bed', 5, 1], ['table', 3, 3], ['chair', 2, 3], ['chair', 4, 3], ['posterOrange', 3, 0], ['plant', 2, 0], ['umbrellaStand', 0, 4], ['picnicBasket', 6, 4]], visit: [[3.5, 2.5], [2.5, 4.5], [4.5, 4.5]] },
};
/* 집 · 실내 등록 (buildWorld 전에) */
for (const [id, H] of Object.entries(NB_HOMES)) {
  let b = BUILDINGS.find(x => x.id === id);
  if (!b && H.b) { b = Object.assign({ id }, H.b); BUILDINGS.push(b); }
  if (b) { b.name = H.name; b.nbHome = true; }
  const I = NB_INTERIORS[id];
  INTERIORS[id] = { name: H.name, W: 7, H: 6, floor: I.floor, wall: I.wall, wall2: I.wall2, exit: [3, 5], furn: I.furn.filter(f => FURN[f[0]]), visit: I.visit };
  if (!ENTERABLE.includes(id)) ENTERABLE.push(id);
}
/* 주민 하루: 아침 · 저녁엔 집 */
const NB_SCHED = {
  halmeoni: { hours: [7, 22], home: [[19.5, 22]] }, kid: { hours: [7.5, 21], home: [[18.5, 21]] },
  fisher: { hours: [6.5, 22], home: [[6.5, 7.5], [20, 22]] }, kid2: { hours: [7.5, 21], home: [[18, 21]] },
  chief: { hours: [7, 22], home: [[18.5, 22]] }, okja: { hours: [6.5, 22], home: [[6.5, 7], [19, 22]] },
  postman: { hours: [7.5, 21.5], home: [[7.5, 8.5], [16.5, 21.5]] }, tourist: { hours: [9, 21.5], home: [[18.5, 21.5]] }, tourist2: { hours: [9, 21.5], home: [[18.5, 21.5]] },
};
const NB_OF = {}; for (const [id, H] of Object.entries(NB_HOMES)) for (const v of H.who) NB_OF[v] = id;
for (const [vid, s] of Object.entries(NB_SCHED)) {
  const V = VILLAGERS[vid]; if (!V) continue;
  V.home = NB_OF[vid]; V.hours = [s.hours[0] * 60, s.hours[1] * 60];
  V.visits = (V.visits || []).filter(v => v[2] !== V.home).concat(s.home.map(([f, t]) => [f, t, V.home]));
}
function nbResidentsIn(id) { return G.villagers.filter(v => v.visible && v.map === 'in_' + id && NB_HOMES[id].who.includes(v.vid)); }
const _openBuildingNB = openBuilding;
openBuilding = function (b) {
  const H = NB_HOMES[b.id]; if (!H) return _openBuildingNB(b);
  const inside = nbResidentsIn(b.id);
  if (inside.length) { runEvent(async () => { Sound.sfx('tap'); await say('narr', '', '🚪 똑똑—'); await say('narr', '', `「누구세요~? 아, 들어와요!」 ${H.name}에 들어간다.`); closeDialog(); }).then(() => { const m = MAPS['in_' + b.id]; goMap(m.id, m.spawn.door[0], m.spawn.door[1]); }); return; }
  const night = S.min >= 22 * 60 || S.min < 7 * 60;
  const when = Math.min(...H.who.map(v => (NB_SCHED[v].home.find(h => h[0] >= 12) || NB_SCHED[v].home[0])[0]));
  runEvent(async () => { await say('narr', '', night ? `🌙 ${H.name}. 불이 꺼져 있다. 다들 주무시나 보다.` : `🚪 ${H.name}. 똑똑… 아무도 없는 것 같다. (저녁 ${fmtTime(when * 60)}쯤엔 집에 계셔요)`); });
};
/* 행동 버튼 이름: 「놀러 가기」 */
const _computeActionNB = computeAction;
computeAction = function () {
  const a = _computeActionNB();
  try {
    const P = G.player; if (!a || P.map !== 'island') return a;
    const fix = (c) => { if (c && c.label === '들어가기') { const b = M.buildings.find(b => NB_HOMES[b.id] && Math.hypot(P.x - b.doorTile[0] - 0.5, P.y - b.doorTile[1] - 0.5) < 1.1); if (b) { c.label = `${NB_HOMES[b.id].name} 방문`; c.icon = '🏡'; } } };
    fix(a); if (a.cands) a.cands.forEach(fix);
  } catch (e) { }
  return a;
};
/* 이장님은 13~18시엔 마을회관(직원)에 계시니 밖에서는 안 보이게 */
const _villagerUpdateNB = villagerUpdate;
villagerUpdate = function (a, dt) {
  const V = VILLAGERS[a.vid];
  if (V && V.home && a.leis && a.map === 'island' && (V.visits || []).some(([f, t, id]) => id === V.home && S.min >= f * 60 && S.min < t * 60) && typeof endLeis === 'function') endLeis(a);
  if (a.vid === 'chief' && S.min >= 13 * 60 && S.min < 18 * 60 && !activeEvent()) { a.visible = false; a.map = 'island'; [a.x, a.y] = P_('hallFront'); a.stop(); return; }
  return _villagerUpdateNB(a, dt);
};
/* 집에 놀러 가서 말 걸면: 하루 한 번 반겨 주고 먹을거리 */
const _villagerTalkNB = villagerTalk;
villagerTalk = async function (a) {
  const id = NB_OF[a.vid], H = id && NB_HOMES[id];
  if (H && a.map === 'in_' + id && H.who[0] === a.vid) {
    if (!S.nb) S.nb = { visit: {}, count: {} };
    if (S.nb.visit[id] !== S.day) {
      S.nb.visit[id] = S.day; const first = !S.nb.count[id]; S.nb.count[id] = (S.nb.count[id] || 0) + 1;
      a.talking = true; a.stop(); a.lookAt(G.player); burst(a, 'heart', 3);
      await say(a.id, 'smile', first ? H.greet : H.again);
      const [k, nm] = H.gift; if (ITEMS[k]) { S.inv[k] = (S.inv[k] || 0) + 1; await say('narr', '', `🎁 ${josa(nm, '을', '를')} 받았다.`); }
      if (typeof addRep === 'function') addRep(1); else S.rep = (S.rep || 0) + 1;
      memRecent('visit', `${H.name}에 놀러 갔다`);
      if (first && Object.keys(S.nb.count).length === Object.keys(NB_HOMES).length) { toast('🏘 마을 모든 집에 놀러 가 봤어요!'); addAlbum('이웃집 나들이', 'daily'); }
      a.talking = false; closeDialog(); return;
    }
  }
  return _villagerTalkNB(a);
};
const _ensureV4NB = ensureV4;
ensureV4 = function (s) { _ensureV4NB(s); if (!s.nb) s.nb = { visit: {}, count: {} }; return s; };
