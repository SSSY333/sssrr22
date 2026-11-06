'use strict';
/* =========================================================
 *  해월도 「살아 있는 해월도」 — 텐트 · 바비큐 · 카메라 · 동행 UI · 동행 대사 · 장소 활동 · 주민 생활 · 날씨 대사
 * ========================================================= */

/* ---------------- 스프라이트 ---------------- */
LSPR.tent = (v) => blockSprite([], 2, 2, 0, (g, P) => {
  const cl = v ? ['#f4ead6', '#e0d2b4', '#c9b894'] : ['#efe4cc', '#d9c9a6', '#c2ae88'];
  fillPoly(g, [P(0.15, 1.85, 0), P(1.85, 1.85, 0), P(1.85, 1.0, 24), P(0.15, 1.0, 24)], cl[0]);
  fillPoly(g, [P(1.85, 0.15, 0), P(1.85, 1.85, 0), P(1.85, 1.0, 24)], cl[1]);
  fillPoly(g, [P(0.62, 1.85, 0), P(1.38, 1.85, 0), P(1.0, 1.42, 14)], '#7a5a40');            // 앞쪽 입구
  fillPoly(g, [P(0.7, 1.85, 0), P(1.0, 1.85, 0), P(1.0, 1.5, 11)], '#a8845a');
  for (let i = 1; i < 4; i++) { const t = i / 4; if (Math.abs(t - 0.5) < 0.2) continue; const a = P(0.15 + 1.7 * t, 1.85, 0), b = P(0.15 + 1.7 * t, 1.0, 24); g.fillStyle = cl[2]; for (let k = 0; k <= 10; k++) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * k / 10), Math.round(a[1] + (b[1] - a[1]) * k / 10), 1, 1); }
  g.fillStyle = '#8a6a48'; const t1 = P(0.15, 1.0, 24), t2 = P(1.85, 1.0, 24); g.fillRect(t1[0], t1[1] - 3, 1, 4); g.fillRect(t2[0], t2[1] - 3, 1, 4);
  g.fillStyle = v ? '#e3615a' : '#3f8f6a'; g.fillRect(t2[0], t2[1] - 6, 4, 2);
});
LSPR.grill = (on) => blockSprite([..._legs(0.25, 0.3, 0.75, 0.7, 10, '#3a3a48', 0.06), _blk(0.18, 0.25, 0.82, 0.75, 10, 16, '#2b2f3a', '#3a3f4c', '#22252e'), _blk(0.82, 0.35, 1.0, 0.65, 13, 14, '#a87a4a')], 1, 1, 0, (g, P) => {
  const c = P(0.5, 0.5, 16);
  for (let i = -4; i <= 4; i += 2) { g.fillStyle = '#9aa3b0'; g.fillRect(c[0] + i, c[1] - 2, 1, 5); }
  if (on) { g.fillStyle = '#e3484a'; g.fillRect(c[0] - 4, c[1] + 1, 8, 1); g.fillStyle = '#f39a2b'; g.fillRect(c[0] - 3, c[1], 6, 1); fillEllipse(g, c[0] - 2, c[1] - 1, 2, 1, '#c96a4a'); fillEllipse(g, c[0] + 3, c[1], 2, 1, '#b85a3a'); }
});
LSPR.campTable2 = () => blockSprite([..._legs(0.14, 0.2, 1.86, 0.8, 9, '#7a5236'), _blk(0.08, 0.14, 1.92, 0.86, 9, 11, '#d7a874', '#b98a58', '#a87a4a'), _blk(0.3, 0.35, 0.6, 0.6, 11, 12, '#ffffff'), _blk(1.4, 0.4, 1.7, 0.62, 11, 12, '#ffffff'), _blk(0.9, 0.3, 1.05, 0.45, 11, 16, '#5aa850'), _blk(1.1, 0.5, 1.22, 0.62, 11, 15, '#e3615a')], 2, 1, 0);
LSPR.slide = () => blockSprite([_blk(0.15, 0.05, 0.25, 0.15, 0, 26, '#9aa3b0'), _blk(0.75, 0.05, 0.85, 0.15, 0, 26, '#9aa3b0'), _blk(0.15, 0.85, 0.25, 0.95, 0, 26, '#9aa3b0'), _blk(0.75, 0.85, 0.85, 0.95, 0, 26, '#9aa3b0'), _blk(0.1, 0.0, 0.9, 1.0, 24, 26, '#3f8ae0', '#2f6fb5', '#265b8a'), _blk(0.1, 0.0, 0.18, 1.0, 26, 31, '#e3615a'), _blk(0.82, 0.0, 0.9, 1.0, 26, 31, '#e3615a')], 1, 3, 0, (g, P) => {
  // 계단(뒤쪽 −y)과 내려오는 미끄럼판(앞쪽 +y)
  for (let i = 0; i < 6; i++) { const z = 4 + i * 4; fillPoly(g, [P(0.25, -0.05 + 0.0 * i, z), P(0.75, -0.05, z), P(0.75, 0.05, z), P(0.25, 0.05, z)], '#f2d06a'); }
  fillPoly(g, [P(0.2, 1.0, 24), P(0.8, 1.0, 24), P(0.8, 2.9, 1), P(0.2, 2.9, 1)], '#f2d06a');
  fillPoly(g, [P(0.8, 1.0, 24), P(0.8, 2.9, 1), P(0.8, 2.9, -1), P(0.8, 1.0, 22)], '#d9b44f');
  g.fillStyle = '#ffffff'; for (let k = 0; k <= 16; k++) { const p = P(0.5, 1.0 + 1.9 * k / 16, 24 - 23 * k / 16); g.fillRect(p[0], p[1], 1, 1); }
});
LSPR.springRider = () => blockSprite([_blk(0.3, 0.3, 0.7, 0.7, 0, 2, '#5b5f69')], 1, 1, 0, (g, P) => {
  const b = P(0.5, 0.5, 2), t = P(0.5, 0.5, 10); g.fillStyle = '#9aa3b0'; for (let y = b[1]; y > t[1]; y -= 2) g.fillRect(b[0] - 2, y, 5, 1);
  fillEllipse(g, t[0], t[1] - 3, 7, 4, '#5aa880'); fillEllipse(g, t[0] + 5, t[1] - 8, 3, 3, '#5aa880'); g.fillStyle = '#2b2026'; g.fillRect(t[0] + 6, t[1] - 9, 1, 1); g.fillStyle = '#f2d06a'; g.fillRect(t[0] - 1, t[1] - 9, 2, 3);
});
/* 울타리: 주변 울타리와 자동으로 이어지는 모서리 */
function fenceMask(o) { const m = MAPS[o.map || 'island'] || MAPS.island; const has = (x, y) => m.objects.some(q => q.kind === 'fence2' && q.x === x && q.y === y); return (has(o.x, o.y - 1) ? 1 : 0) | (has(o.x + 1, o.y) ? 2 : 0) | (has(o.x, o.y + 1) ? 4 : 0) | (has(o.x - 1, o.y) ? 8 : 0); }
function fenceSprite(mask) {
  const W1 = '#f4efe6', b = [_blk(0.42, 0.42, 0.58, 0.58, 0, 14, W1, '#ddd5c8', '#c9bfb0'), _blk(0.4, 0.4, 0.6, 0.6, 14, 15, '#ffffff')];
  const rail = (u0, v0, u1, v1) => { b.push(_blk(u0, v0, u1, v1, 5, 7, '#efe7d8', '#d9cfba', '#c9bea8'), _blk(u0, v0, u1, v1, 10, 12, '#efe7d8', '#d9cfba', '#c9bea8')); };
  if (mask & 1) rail(0.46, 0, 0.54, 0.46); if (mask & 2) rail(0.54, 0.46, 1, 0.54); if (mask & 4) rail(0.46, 0.54, 0.54, 1); if (mask & 8) rail(0, 0.46, 0.46, 0.54);
  return blockSprite(b, 1, 1, 0);
}
const _objSpriteLife = objSprite;
objSprite = function (o) {
  if (o.kind === 'fence2') { const mk = o._mask != null ? o._mask : (o._mask = fenceMask(o)); const key = 'F2' + mk; return R.objSpr[key] || (R.objSpr[key] = fenceSprite(mk)); }
  if (o.kind === 'grill') { const on = !!G.bbqOn, key = 'Lgrill' + (on ? 1 : 0); return R.objSpr[key] || (R.objSpr[key] = LSPR.grill(on)); }
  if (o.kind === 'campTable2' || o.kind === 'slide' || o.kind === 'springRider') { const key = 'L' + o.kind; return R.objSpr[key] || (R.objSpr[key] = LSPR[o.kind]()); }
  if (o.kind === 'sandcastle') { return R.objSpr.sandcastle || (R.objSpr.sandcastle = blockSprite([_blk(0.25, 0.25, 0.75, 0.75, 0, 6, '#e2c98f', '#d4b97a', '#c4a868'), _blk(0.35, 0.35, 0.65, 0.65, 6, 12, '#f1dca6', '#e2c98f', '#d4b97a'), _blk(0.45, 0.45, 0.55, 0.55, 12, 18, '#f1dca6')], 1, 1, 0, (g, P) => { const p = P(0.5, 0.5, 18); g.fillStyle = '#e3484a'; g.fillRect(p[0], p[1] - 6, 3, 2); g.fillStyle = '#5b5f69'; g.fillRect(p[0], p[1] - 6, 1, 6); })); }
  return _objSpriteLife(o);
};
function refreshFenceMasks(m = MAPS.island) { for (const o of m.objects) if (o.kind === 'fence2') o._mask = null; }

/* ---------------- 텐트 내부 ---------------- */
Object.assign(FURN, {
  sleepbag: { name: '침낭', price: 0, fw: 1, fd: 2, cat: 'bed', blocks: () => [_blk(0.08, 0.06, 0.92, 1.94, 0, 4, '#e3615a', '#c9484a', '#b33c3e'), _blk(0.14, 0.12, 0.86, 0.55, 4, 7, '#ffffff', '#ece8e0', '#dcd6cc'), _blk(0.1, 0.7, 0.9, 1.9, 4, 6, '#f2b0a0', '#e09888', '#cc8474'), _blk(0.1, 0.7, 0.9, 0.8, 6, 6.6, '#fbd3df')] },
  sleepbag2: { name: '침낭(파랑)', price: 0, fw: 1, fd: 2, cat: 'bed', blocks: () => [_blk(0.08, 0.06, 0.92, 1.94, 0, 4, '#3f6fb5', '#2f5a9a', '#264a80'), _blk(0.14, 0.12, 0.86, 0.55, 4, 7, '#ffffff', '#ece8e0', '#dcd6cc'), _blk(0.1, 0.7, 0.9, 1.9, 4, 6, '#8fc3ea', '#74a8d0', '#5f93bb'), _blk(0.1, 0.7, 0.9, 0.8, 6, 6.6, '#cfe6f7')] },
  tentBag: { name: '배낭', price: 0, cat: 'decor', blocks: () => [_blk(0.3, 0.35, 0.7, 0.65, 0, 12, '#5aa880', '#3f8f6a', '#2f7a58'), _blk(0.35, 0.62, 0.65, 0.68, 3, 8, '#3f8f6a'), _blk(0.32, 0.37, 0.68, 0.63, 12, 14, '#2f7a58')] },
  tentLamp: { name: '캠핑 랜턴', price: 0, cat: 'decor', light: true, blocks: () => [_blk(0.4, 0.4, 0.6, 0.6, 0, 2, '#5b5f69'), _blk(0.42, 0.42, 0.58, 0.58, 2, 9, '#fff1a0', '#f2dc6a', '#e0c55a'), _blk(0.4, 0.4, 0.6, 0.6, 9, 10, '#5b5f69')] },
  tentTable: { name: '접이식 테이블', price: 0, cat: 'decor', blocks: () => [..._legs(0.2, 0.25, 0.8, 0.75, 5, '#7a7e88', 0.06), _blk(0.15, 0.2, 0.85, 0.8, 5, 6, '#e9e4da'), _blk(0.3, 0.35, 0.45, 0.5, 6, 9, '#f4efe6'), _blk(0.55, 0.45, 0.75, 0.62, 6, 7, '#f39a2b')] },
  tentBlanket: { name: '담요', price: 0, flat: true, cat: 'decor', blocks: () => [_blk(0.1, 0.15, 0.9, 0.85, 0, 1, '#f2d06a'), _blk(0.1, 0.4, 0.9, 0.5, 1, 1.4, '#e3615a')] },
});
function buildTents() {
  for (const [id, door, colors] of [['A', 'tentA', ['#f0d9a8', '#c9955e']], ['B', 'tentB', ['#e6dcc4', '#6f9a7a']]]) {
    const m = makeMap('in_tent' + id, 6, 5, { name: '캠핑 텐트', interior: true, owner: null, tentDoor: door, wall: colors[0], wall2: colors[1], noWindows: true, places: {}, order: [] });
    m.tiles.fill(T.MAT); m.exit = [3, 4]; m.spawn = { door: [3.5, 3.5] }; m.visit = [];
    setFurniture(m, [['sleepbag', 1, 0, 0], [id === 'A' ? 'sleepbag2' : 'sleepbag', 2, 0, 0], ['tentLamp', 0, 0], ['tentBag', 5, 0], ['tentTable', 4, 2], ['tentBlanket', 0, 2], ['tentLamp', 5, 3]]);
    m.benches.tentSeat = { name: '텐트 침낭', place: 'tent', leisure: 'tent', seats: [[1, 1], [2, 1]], stand: [[1, 2], [2, 2]], face: [0, 0], ground: true, d: [6.2, 6.3], pairs: [[0, 1]] };
  }
}
const _buildWorldLife = buildWorld;
buildWorld = function () { _buildWorldLife(); buildTents(); refreshFenceMasks(); };
const _leaveInteriorLife = leaveInterior;
leaveInterior = function () { if (M.tentDoor) { const p = P_(M.tentDoor); G.player.seat && standUpPlayer(); goMap('island', p[0], p[1] + 0.6); return; } _leaveInteriorLife(); };
async function enterTent(which) {
  const m = MAPS['in_tent' + which];
  if (rainy()) toast('🌧 텐트 안은 보송보송해요. 빗소리가 좋아요');
  await goMap(m.id, m.spawn.door[0], m.spawn.door[1]);
  if (!S.leisure.mem.firstTent) { S.leisure.mem.firstTent = { day: S.day }; toast('⛺ 텐트 안은 생각보다 아늑해요. 침낭을 눌러 앉거나 누워 보세요'); }
}
function tentMenu() {
  const P = G.player, k = 'tentSeat', seated = P.seat && P.seat.bench === k;
  if (seated && bothSeated(k)) return tentCoupleMenu();
  const items = [];
  const add = (icon, label, fn, ok = true, why) => items.push({ icon, label, onClick: fn, disabled: !ok, why });
  if (!seated) { add('🪑', '침낭에 앉기', () => leisureSit(k), freeSeats(k, M.id).length > 0); if (detNearby() && S.rel.stage >= 2) add('💞', '나란히 앉기', () => leisureSitTogether(k), !!freePair(k, M.id)); }
  else add('🧍', '일어나기', () => standUpPlayer());
  add('🛌', '눕기', () => runEvent(async () => { if (!P.seat) leisureSit(k); P.lie = -1; await say('narr', '', '침낭 위에 벌러덩 누웠다. 텐트 천 너머로 햇빛이 은은하게 비친다.'); advanceTime(20); P.lie = 0; }));
  add('😌', '쉬기', () => leisureAct(k, 'rest'));
  add('💤', '낮잠 자기', () => leisureAct(k, 'nap'));
  add('🍙', '간식 먹기', () => leisureAct(k, 'snack'));
  add(M.dark ? '💡' : '🌑', M.dark ? '랜턴 켜기' : '랜턴 끄기', () => { M.dark = !M.dark; for (const o of M.objects) if (o.k === 'tentLamp') o.light = !M.dark; FURN.tentLamp.light = !M.dark; toast(M.dark ? '랜턴을 껐어요. 어둑어둑' : '랜턴을 켰어요. 따뜻한 빛'); });
  add('🚪', '텐트 밖으로', () => leaveInterior());
  openSheet({ title: '⛺ 캠핑 텐트', sub: '<div class="relneed">좁지만 아늑한 텐트. 침낭 · 랜턴 · 배낭 · 접이식 테이블.</div>', items, cols: 3 });
}
const TENT_ACTS = [
  ['side', 'close', '🪑', '나란히 앉기', 3], ['snack', 'snack', '🍙', '간식 먹기', 3], ['cards', 'chat', '🃏', '카드놀이', 3], ['talk', 'chat', '💬', '이야기 나누기', 3], ['rest', 'sea', '😌', '잠깐 쉬기', 3],
  ['closer', 'close', '↔', '가까이 앉기', 4], ['tease', 'tease', '😜', '장난치기', 4], ['look', 'look', '👀', '서로 바라보기', 4], ['lean', 'lean', '😌', '어깨에 기대기', 4], ['blanket', 'shoulder', '🧣', '담요 나눠 덮기', 4],
  ['hand', 'hand', '🤝', '손잡기', 5], ['hug', 'hug', '🤗', '포옹하기', 5], ['pat', 'pat', '✋', '머리 쓰다듬기', 5], ['lap', 'lap', '🛌', '무릎 베기', 5], ['kiss', 'cheek', '😚', '가벼운 입맞춤', 5], ['lieTalk', 'sky', '☁', '함께 누워 이야기', 5], ['napTwo', 'lapnap', '💤', '나란히 낮잠', 6],
  ['nestle', 'nestle', '🫶', '품에 안겨 쉬기', 8], ['blanket2', 'embrace', '🧸', '함께 담요 덮기', 8], ['sleepHug', 'lapnap', '😴', '끌어안고 잠들기', 8], ['sweet', 'sweet', '💕', '다정한 입맞춤', 8], ['bedtime', 'sky', '🌙', '잠들기 전 대화', 8], ['morning', 'morning', '🌅', '함께 아침 맞이하기', 8],
];
const TENT_LINES = {
  side: ['생각보다 안이 넓네. 둘이 앉기 딱 좋은데?', '이리 와. 여기 앉아.'], snack: ['과자 하나만. 아니, 이거 내 거야? 하하.'], cards: ['카드 한 판 할래? 지는 사람이 내일 아침 커피 사기.', '어? 너 지금 속였지? 다 봤어.'], talk: ['텐트 안에서 얘기하니까 비밀 얘기 하는 기분이다.'], rest: ['오늘은 그냥 이렇게 쉬자. 바깥도 조용하고.'],
  closer: ['왜 그렇게 멀리 앉아? 하하, 나 안 물어.'], tease: ['텐트 천 흔들면 비 오는 소리 난다. 들어 봐. …속았지?'], look: ['…왜 그렇게 봐? 랜턴 불빛에 얼굴 빨개 보이잖아.'], lean: ['기대도 돼. 오늘은 내 어깨 전세 내줄게.'], blanket: ['추워? 담요 같이 덮자.'],
  hand: ['손 줘. 텐트 안은 좀 쌀쌀하니까.'], hug: ['이리 와. 잠깐만 이러고 있자.'], pat: ['오늘 고생했어. 착하다, 착해.'], lap: ['아이고, 아주 내 무릎을 베개처럼 쓰네.'], kiss: ['…랜턴 끌까? 하하, 농담이야.'], lieTalk: ['텐트 천에 그림자 비치는 거 봐. 우리 둘이 나란히.'], napTwo: ['너 벌써 졸려? 그럼 조금 자. 나도 옆에서 잘게.'],
  nestle: ['여보, 이리 와. 오늘은 내가 이불 할게.'], blanket2: ['담요 하나로 둘이 덮으니까 딱 맞네. 우리 사이즈인가 봐.'], sleepHug: ['아이고, 아주 내 팔을 베개처럼 쓰네. 그래, 푹 자.'], sweet: ['오늘도 고마워. 사랑해.'], bedtime: ['내일 아침엔 뭐 먹을까? …아니다, 아침 생각하면 잠 안 와.', '하하, 나도 이렇게 놀러 오니까 좋다.'], morning: ['여보, 일어나. 해 뜬다. 텐트 밖 봐 봐.'],
};
function tentCoupleMenu() {
  const st = S.rel.stage;
  const items = TENT_ACTS.filter(a => a[4] <= st + 1).map(([id, vis, icon, label, need]) => ({ icon, label, locked: st < need, note: st < need ? STAGES[need - 1].name : '', why: `「${STAGES[need - 1].name}」 단계에서 할 수 있어요`, onClick: () => tentAct(id, vis) }));
  items.push({ icon: '🧍', label: '일어나기', onClick: () => standUpPlayer() });
  openSheet({ title: `⛺ 텐트 안 · ${himCall()}와 함께`, items, cols: 4 });
}
async function tentAct(id, vis) {
  if (id === 'morning') {
    if (S.min < 20 * 60) { toast('밤이 깊어지면 함께 아침을 맞을 수 있어요 (20시 이후)'); return; }
    await runEvent(async () => { await say('det', 'smile', '오늘은 여기서 자고 가자. 별 보면서 잠들고, 해 보면서 깨는 거야.'); });
    G._tentMorning = M.id; await endDay(false);
    return;
  }
  G._coupleOverride = { [vis]: TENT_LINES[id] };
  try { await coupleAct('tentSeat', vis); } finally { G._coupleOverride = null; }
  if (id === 'cards') runEvent(async () => { const win = Math.random() < 0.5; await say('narr', '', win ? '🃏 이겼다! 형사님이 억울한 얼굴로 카드를 섞는다.' : '🃏 졌다… 형사님이 승리의 브이를 한다.'); });
  if (!S.leisure.mem.firstTentDate) { S.leisure.mem.firstTentDate = { day: S.day }; memPerm('firstTentDate', { name: '텐트에서 함께' }); addAlbum('텐트에서 함께', 'date'); }
}
/* 텐트에서 아침 맞이: 다음 날 텐트 안에서 깨어남 */
const _endDayLife = endDay;
endDay = async function (f) {
  const tent = G._tentMorning; G._tentMorning = null;
  await _endDayLife(f);
  if (tent && MAPS[tent]) {
    await goMap(tent, 1.5, 2.5, { noFade: true });
    const d = G.det; if (S.rel.flags.married || S.rel.stage >= 5) { d.map = tent; d.visible = true; [d.x, d.y] = nearestWalkable(2.5, 2.5, MAPS[tent]); }
    runEvent(async () => { await say('narr', '', '🌅 텐트 틈으로 아침 햇살이 들어왔다. 새소리가 들린다.'); await say('det', 'smile', S.rel.stage >= 8 ? '좋은 아침, 여보. 텐트에서 자니까 허리는 아픈데 기분은 최고다.' : '잘 잤어? 나 너 코 고는 소리에 몇 번 깼다. 하하, 농담.'); memRecent('leisure', '텐트에서 함께 아침을 맞았다'); });
  }
};

/* ---------------- 바비큐 ---------------- */
ITEMS.meat = { name: '바비큐 고기 세트', icon: '🥩', price: 5000, gift: 3, sell: 1500, react: ['고기? 오늘 캠핑존 가자는 거지? 하하.', 'laugh'] };
if (!SHOP.includes('meat')) SHOP.push('meat');
PX_ITEMS.meat = (P, g) => { E_(g, 8, 9, 6, 4, '#c96a6a'); E_(g, 8, 9, 4, 2, '#f4c4b8'); P(4, 8, 8, 1, '#ffffff'); P(5, 11, 6, 1, '#a84848'); };
PX_ITEMS.tongs = (P) => { for (let i = 0; i < 10; i++) { P(4 + i, 3 + i, 1, 1, '#9aa3b0'); P(6 + i, 3 + i, 1, 1, '#9aa3b0'); } P(3, 2, 4, 2, '#3a3a48'); };
PX_ITEMS.plate = (P, g) => { E_(g, 8, 10, 6, 3, '#ffffff'); E_(g, 7, 9, 2, 1, '#b85a3a'); E_(g, 10, 10, 2, 1, '#c96a4a'); P(5, 9, 2, 1, '#5aa850'); };
function bbqTime() { return S.min >= 17 * 60 && S.min < 22 * 60; }
function nearGrill() { const P = G.player, p = P_('grillCook'); return P.map === 'island' && Math.hypot(P.x - p[0], P.y - p[1]) < 1.4; }
function bbqMenu() {
  const items = [], det = detNearby(8), st = S.rel.stage, meat = S.inv.meat || 0;
  if (!bbqTime()) { toast('🔥 바비큐는 저녁(17시~22시)에 할 수 있어요'); return; }
  if (rainy()) { toast('🌧 비가 와서 그릴에 불이 안 붙어요. 맑은 저녁에 해요'); return; }
  items.push({ icon: '🥩', label: '혼자 구워 먹기', note: `고기 ${meat}개`, onClick: () => bbqSolo(), disabled: !meat, why: '마을 슈퍼에서 「바비큐 고기 세트」를 사 와요' });
  if (det && st >= 4) items.push({ icon: '💞', label: '형사님이 구워 주기', note: '함께 먹기', onClick: () => bbqCouple(), disabled: !meat, why: '고기 세트가 있어야 해요' });
  else if (det && st >= 2) items.push({ icon: '🍖', label: '같이 구워 먹기', onClick: () => bbqCouple(), disabled: !meat, why: '고기 세트가 있어야 해요' });
  if (!meat) items.push({ icon: '🛒', label: '슈퍼 위치 보기', onClick: () => { S.track = null; toast('🛒 마을 슈퍼는 마을 광장 오른쪽에 있어요 (🚌 해월 마을 정류장)'); } });
  openSheet({ title: '🔥 바비큐 그릴', sub: `<div class="relneed">고기는 마을 슈퍼에서 팔아요 (5,000원). ${S.leisure.bbqCount ? `지금까지 바비큐 ${S.leisure.bbqCount}번` : ''}</div>`, items, cols: 2 });
}
async function grillGame(who) {
  let score = 0;
  for (let r = 0; r < 3; r++) {
    const state = pick(['아직 빨갛다', '노릇노릇하다', '가장자리가 거뭇해지려 한다']);
    burst(who, 'spark', 3); Sound.sfx('splash');
    await say('narr', '', `지글지글… 고기가 ${state}. (${r + 1}/3)`);
    const k = await choose(['지금 뒤집기!', '조금 더 굽기']);
    const good = (state === '노릇노릇하다' && k === 0) || (state === '아직 빨갛다' && k === 1) || (state === '가장자리가 거뭇해지려 한다' && k === 0);
    if (good) { score++; await say('narr', '', '좋아, 딱 좋은 타이밍!'); } else await say('narr', '', state === '가장자리가 거뭇해지려 한다' ? '앗, 살짝 탔다…' : '음, 조금 이른가?');
  }
  return score;
}
async function walkTo(a, p) { a.walkTo(p[0], p[1]); await waitUntil(() => !a.path.length, 12); }
async function bbqSolo() {
  await runEvent(async () => {
    const P = G.player; if (!(S.inv.meat > 0)) return;
    if (P.seat) P.standUp();
    await walkTo(P, P_('grillCook')); P.faceTo(0, -1); P.prop = 'tongs'; G.bbqOn = true;
    await say('narr', '', '🔥 그릴에 불을 붙이고 고기를 올렸다. 치이익—');
    const sc = await grillGame(P);
    S.inv.meat--; P.prop = 'plate';
    const seat = freeSeats('bbq')[0]; if (seat != null) { const st = MAPS.island.benches.bbq.stand[seat]; await walkTo(P, [st[0] + 0.5, st[1] + 0.5]); P.sitAt('bbq', seat); }
    P.prop = 'meat';
    await say('narr', '', sc >= 3 ? '🍖 완벽한 굽기! 겉은 바삭, 속은 촉촉. 혼자 먹기 아까울 정도다.' : sc >= 2 ? '🍖 맛있게 잘 구워졌다. 밤공기와 함께 먹으니 꿀맛.' : '🍖 조금 탔지만… 캠핑에선 이것도 낭만이다.');
    advanceTime(40); G.bbqOn = false; P.prop = null;
    S.leisure.bbqCount = (S.leisure.bbqCount || 0) + 1;
    if (sc >= 3 && !S.paid['bbqPerfect' + S.day]) { S.paid['bbqPerfect' + S.day] = S.day; S.inv.tangerine = (S.inv.tangerine || 0) + 1; toast('🏅 완벽한 바비큐! 후식으로 귤 한 개'); }
    memRecent('leisure', '캠핑존에서 혼자 바비큐');
  });
}
const BBQ_LINES = ['하하, 왜 그렇게 쳐다봐? 나 고기 꽤 잘 굽는다?', '너는 먹기만 해. 굽는 건 내가 할 테니까.', '어때? 맛있지? 나 이 정도면 고깃집 차려도 되겠는데.', '하하, 그럼 다음에도 내가 구워야겠네.', '여기서 이렇게 먹으니까 진짜 놀러 온 기분이다.', '다음엔 다른 것도 구워 먹자.'];
async function bbqCouple() {
  await runEvent(async () => {
    const P = G.player, d = G.det; if (!(S.inv.meat > 0)) return;
    if (!S.comp) startCompanion();
    scriptDet(); if (P.seat) P.standUp(); if (d.seat) d.standUp();
    const st = S.rel.stage, c = casualOn();
    await say('det', 'smile', st >= 4 ? '앉아 있어. 오늘은 내가 구울게.' : '[[제가 구울게요. 저 이래 봬도 고기 잘 굽습니다.||내가 구울게. 나 이래 봬도 고기 잘 구워.]]');
    closeDialog();
    const seats = freePair('bbq') || [0, 1], bk = MAPS.island.benches.bbq;
    await Promise.all([walkTo(P, [bk.stand[seats[0]][0] + 0.5, bk.stand[seats[0]][1] + 0.5]), walkTo(d, P_('grillCook'))]);
    P.sitAt('bbq', seats[0]); d.faceTo(0, -1); d.prop = 'tongs'; G.bbqOn = true;
    for (let i = 0; i < 3; i++) { burst(d, 'spark', 3); Sound.sfx('splash'); await sleep(500); }
    const ev = st >= 5 ? pick(['burn', 'best', 'ssam', 'tease', 'stars']) : pick(['burn', 'best', 'stars']);
    if (ev === 'burn') { d.emo('💦', 2); await say('det', 'surprise', c ? '어이쿠! 한 점 탔다. …이건 내가 먹을게. 너는 잘 익은 거.' : '어이쿠! 한 점 탔네요. 이건 제가 먹을게요.'); }
    else await say('det', 'tease', pick(BBQ_LINES.slice(0, 2)));
    d.prop = 'plate'; await walkTo(d, [bk.stand[seats[1]][0] + 0.5, bk.stand[seats[1]][1] + 0.5]); d.lookAt(P);
    await say('det', 'smile', c ? '자, 이거 먹어봐. 딱 잘 익었어.' : '자, 드셔 보세요. 딱 잘 익었어요.');
    d.sitAt('bbq', seats[1]); P.prop = 'meat'; d.prop = 'meat'; G.bbqOn = false;
    await say('det', 'laugh', c ? '아이고, 뜨거워. 천천히 먹어.' : '뜨거우니까 천천히 드세요.');
    if (ev === 'best') await say('det', 'blush', c ? '제일 맛있는 부위는 네 거. 원래 굽는 사람 마음이야.' : '제일 맛있는 부위는 드릴게요. 굽는 사람 마음이에요.');
    if (ev === 'ssam') { await say('det', 'blush', '쌈 싸 줄게. 아~ 해 봐.'); burst(d, 'heart', 5); const k = await choose(['(받아먹는다)', '나도 싸 줄게!']); await say('det', 'laugh', k === 0 ? '어때, 내가 싸 준 게 제일 맛있지?' : '…와, 이거 진짜 맛있다. 네가 싸 줘서 그런가.'); }
    if (ev === 'tease') { await say('det', 'tease', '고기 한 점에 뽀뽀 한 번. 거래할래? 하하, 농담이야.'); }
    if (ev === 'stars' && isNight()) await say('det', 'smile', c ? '별 봐. 고기 먹으면서 별 보는 거, 이거 최고 사치다.' : '별 좀 보세요. 고기 먹으면서 별 보는 거, 최고의 사치네요.');
    await say('det', 'smile', pick(BBQ_LINES.slice(2)));
    if ((S.inv.meat || 0) > 0 && st >= 3) { const k = await choose(['마지막 한 점은 너 먹어', '반 나눠 먹자']); await say('det', 'laugh', k === 0 ? (c ? '마지막 한 점 남았는데, 네가 먹을래? …아, 나 주는 거야? 감동이다.' : '마지막 한 점을 저 주시는 거예요? 감동이네요.') : (c ? '반반. 우리답다.' : '반씩 나눠요. 좋네요.')); }
    S.inv.meat--; P.prop = d.prop = null;
    await say('narr', '', '식사를 마치고 둘이 함께 그릴과 식탁을 정리했다.');
    advanceTime(60); addAff(st >= 4 ? 5 : 3, { event: !S.leisure.mem.firstBBQ });
    S.leisure.bbqCount = (S.leisure.bbqCount || 0) + 1;
    if (!S.leisure.mem.firstBBQ) { S.leisure.mem.firstBBQ = { day: S.day }; memPerm('firstBBQ', { name: '첫 캠핑 바비큐' }); await addAlbum('첫 캠핑 바비큐', 'date'); }
    memRecent('leisure', '형사님이 구워 준 바비큐');
    if (st >= 3 && S.min >= 19 * 60) { const k = await choose(['텐트에서 좀 쉬다 가자', '배부르다, 산책하자']); if (k === 0) { closeDialog(); await enterTent('A'); } }
  });
}

/* ---------------- 카메라 (스크린샷) ---------------- */
function captureView(mode) {
  const P = G.player, d = G.det, prev = { focus: G.camFocus, labels: G.noLabels };
  if (mode !== 'normal') G.noLabels = true;
  if (mode === 'couple' && d.visible && d.map === P.map) { G.camFocus = { x: (P.x + d.x) / 2, y: (P.y + d.y) / 2 }; G.camSnap = true; }
  render(0.016);
  let url = null; try { url = R.view.toDataURL('image/png'); } catch (e) { url = null; }
  G.noLabels = prev.labels; G.camFocus = prev.focus; G.camSnap = true;
  return url;
}
function cameraMenu() {
  if (G.busy) return;
  const canCouple = S.rel.flags.met && G.det.visible && G.det.map === G.player.map && dist(G.det, G.player) < 8;
  openPanel('📷 카메라', `<p class="psub">지금 화면을 사진으로 남겨요. 네컷사진과는 따로, 원하는 순간을 자유롭게 찍어요.</p>
    <div class="pgrid"><button class="pcard" data-m="normal"><span class="pic">🖼</span><b>일반 촬영</b><small>이름표 · 말풍선까지 그대로</small></button><button class="pcard" data-m="scenery"><span class="pic">🌄</span><b>풍경 촬영</b><small>글자 없이 월드만</small></button><button class="pcard ${canCouple ? '' : 'lock'}" data-m="couple"><span class="pic">💑</span><b>커플 촬영</b><small>${canCouple ? '형사님과 함께 가운데로' : '형사님이 가까이 있을 때'}</small></button></div>`, (b) => {
    b.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { if (x.dataset.m === 'couple' && !canCouple) { toast('형사님이 가까이 있을 때 찍을 수 있어요'); return; } shootCamera(x.dataset.m); });
  });
}
function shootCamera(mode) {
  closePanel(); $('#hud').style.visibility = 'hidden';
  setTimeout(() => {
    const url = captureView(mode); $('#hud').style.visibility = '';
    flashFx(); Sound.sfx('bell');
    if (!url) { toast('사진을 만들지 못했어요. 다시 시도해 주세요'); return; }
    openPanel('📷 미리보기', `<div class="aimg" style="text-align:center"><img src="${url}" style="max-height:56vh;max-width:100%;width:auto;display:inline-block"></div><div class="prow wrap"><button id="cmSave" class="big">💾 PNG 저장</button><button id="cmAlbum" class="big alt">📔 앨범에 넣기</button><button id="cmAgain" class="big alt">🔁 다시 찍기</button><button id="cmNo" class="big alt">취소</button></div>`, (b) => {
      b.querySelector('#cmSave').onclick = () => saveImage(url, `haewoldo-${S.day}-${Math.floor(S.min)}.png`);
      b.querySelector('#cmAlbum').onclick = () => { const c = mkCanvas(240, Math.round(240 * R.view.height / R.view.width)), g = c.getContext('2d'); const im = new Image(); im.onload = () => { g.drawImage(im, 0, 0, c.width, c.height); S.album.unshift({ id: 'cam' + Date.now().toString(36), title: '카메라 사진', cat: mode === 'couple' ? 'love' : 'daily', kind: 'photo', day: S.day, date: dateLabel(), time: fmtTime(S.min), place: placeName(curPlace()) || M.name, img: c.toDataURL('image/jpeg', 0.8), who: [S.name] }); save(); toast('📔 앨범에 넣었어요'); }; im.src = url; };
      b.querySelector('#cmAgain').onclick = () => cameraMenu();
      b.querySelector('#cmNo').onclick = () => closePanel();
    }, { full: true });
  }, 80);
}
/* 저장: 앱에서는 사진첩(갤러리)에, 브라우저에서는 다운로드 */
function saveImage(url, name) {
  try { if (window.Android && Android.saveImage) { const ok = Android.saveImage(url.split(',')[1], name); toast(ok ? '📷 사진첩(Pictures/해월도)에 저장했어요' : '저장하지 못했어요. 저장 공간을 확인해 주세요'); return; } } catch (e) { }
  downloadImg(url, name);
}
downloadImg = function (url, name) { if (window.Android && Android.saveImage) { saveImage(url, name); return; } try { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('💾 저장을 시도했어요 (막혀 있으면 사진을 길게 눌러 저장해요)'); } catch (e) { toast('이 화면에선 저장이 막혀 있어요. 사진을 길게 눌러 저장해요'); } };

/* ---------------- 동행 대사 ---------------- */
G.recentLines = [];
function compStage() { const st = S.rel.stage; return st >= 3 && !casualOn() ? 2 : st; }
const PLACE_GROUP = { pier: 'pier', fishing: 'pier', dock: 'pier', beach: 'beach', promenade: 'beach', coast: 'beach', picnic: 'beach', cafe: 'cafe', in_cafe: 'cafe', booth: 'cafe', lighthouse: 'lighthouse', windmill: 'lighthouse', camp: 'camp', playground: 'playground', pavilion: 'pavilion', forest: 'forest', rocks: 'rocks', orchard: 'orchard', farm: 'orchard', plaza: 'plaza' };
function compLine() {
  const st = compStage(), L = COMP_LINES[st]; if (!L) return '…';
  const h = S.min / 60, tk = h < 11 ? 'morning' : h < 16 ? 'noon' : h < 20.5 ? 'evening' : 'night';
  const pl = PLACE_GROUP[curPlace()] || null, r = S.rel;
  const pool = [];
  const push = (arr, w, cat) => { for (const t of arr || []) pool.push({ t, w, cat }); };
  push(L.w[S.weather] || L.w[S.weather === 'storm' ? 'rain' : 'cloudy'], 4, 'w'); push(L.t[tk], 2.5, 't'); if (pl) push(L.p[pl], 3.5, 'p'); push(L.j[S.job], 1.5, 'j');
  for (const c of ['d', 'v', 'n', 'f', 's', 'q', 'x', 'h', 'l', 'e']) push(L[c], 1, c);
  if ((st < 4 || r.flags.firstSit) && (st < 6 || S.mem.perm.firstDate || st >= 7)) push(L.m, 1.2, 'm');
  let cand = pool.filter(p => !G.recentLines.includes(p.t) && !(S.lineLog && S.lineLog[hashStr(p.t)] === S.day));
  if (!cand.length) cand = pool.filter(p => !G.recentLines.slice(-8).includes(p.t));
  if (!cand.length) cand = pool;
  let tot = cand.reduce((a, p) => a + p.w, 0), x = Math.random() * tot, sel = cand[0];
  for (const p of cand) { x -= p.w; if (x <= 0) { sel = p; break; } }
  G.recentLines.push(sel.t); if (G.recentLines.length > 40) G.recentLines.shift();
  S.lineLog = S.lineLog || {}; S.lineLog[hashStr(sel.t)] = S.day;
  const keys = Object.keys(S.lineLog); if (keys.length > 300) for (const k of keys.slice(0, 100)) delete S.lineLog[k];
  return sel.t;
}
function hashStr(t) { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
const _casualPoolLife = casualPool;
casualPool = function (st) { return [..._casualPoolLife(st), compLine(), compLine()]; };
/* 걷는 중 가끔 선택지 대화 → 실제 행동으로 이어짐 */
function compChoiceTick() {
  const d = G.det, P = G.player;
  if (!S.comp || G.busy || paused() || d.state !== 'comp' || P.seat || P.moving || dist(d, P) > 2.5) return;
  const now = S.day * 1440 + S.min; if (now - (G._lastChoice || S._lastChoice || -1e9) < 150) return;
  if (Math.random() > 0.004) return;
  const st = compStage(), list = COMP_CHOICES[st] || []; if (!list.length) return;
  const used = S.choiceLog = S.choiceLog || {};
  const avail = list.filter((c, i) => used[st + ':' + i] !== S.day);
  if (!avail.length) return;
  const ch = pick(avail), idx = list.indexOf(ch);
  used[st + ':' + idx] = S.day; G._lastChoice = S._lastChoice = now;
  runEvent(async () => {
    d.lookAt(P); P.lookAt(d);
    await say('det', st >= 4 ? 'blush' : 'smile', ch.q);
    const k = await choose(ch.c.map(c => c[0]));
    const [, reply, aff, act] = ch.c[k];
    await say('det', aff >= 3 ? 'blush' : 'smile', reply);
    if (aff) addAff(aff);
    closeDialog();
    if (act) await compAction(act);
  });
}
async function compAction(act) {
  const P = G.player, d = G.det;
  switch (act) {
    case 'sit': { const k = nearestSeat(); if (k) { if (MAPS[P.map].benches[k].leisure) await leisureSitTogether(k); else await sitTogether(k); } else toast('근처에 앉을 곳이 없어요. 걷다 보면 벤치가 나와요'); break; }
    case 'hand': S.hold = true; S.arm = false; burst(d, 'heart', 3); toast('🤝 손잡고 걸어요'); break;
    case 'hug': doInteraction('hug'); break;
    case 'photo': cameraMenu(); break;
    case 'booth': walkToPOI('booth', '📸 네컷사진 부스로 같이 가요'); break;
    case 'cafe': walkToPOI('cafeDoor', '☕ 카페 쉼터로 같이 가요'); break;
    case 'home': walkToPOI('homeDoor', '🏡 집으로 같이 가요'); break;
    case 'furn': walkToPOI('furnitureDoor', '🛋 가구점으로 같이 가요'); break;
    case 'bbq': if (bbqTime() && curPlace() === 'camp') bbqMenu(); else { S.rel.daily.bbqPromise = true; walkToPOI('campCenter', '🔥 캠핑존으로 같이 가요 (저녁 17시부터 바비큐)'); } break;
  }
}
function walkToPOI(k, msg) { if (G.player.map !== 'island') { toast('밖으로 나가서 가요'); return; } const p = P_(k); walkPlayer(p[0], p[1]); toast(msg + (Math.hypot(G.player.x - p[0], G.player.y - p[1]) > 40 ? ' · 멀면 🚌 마을버스가 빨라요' : '')); }
function nearestSeat() {
  const P = G.player, m = MAPS[P.map]; let best = null, bd = 1e9;
  for (const [k, bk] of Object.entries(m.benches || {})) { if (k === 'fishchair') continue; const pr = bk.pairs ? freePair(k, P.map) : null; if (bk.leisure && !pr) continue; for (const s of bk.stand) { const dd = Math.hypot(P.x - s[0], P.y - s[1]); if (dd < bd) { bd = dd; best = k; } } }
  return bd < 30 ? best : null;
}

/* ---------------- 동행 UI: 상호작용 버튼은 주변 오브젝트용, 형사님은 직접 눌러서 ---------------- */
const PLACE_ACTS = {};
function placeActsHere() {
  const P = G.player, pl = M.interior || M.hidden ? M.id : curPlace(), acts = [];
  for (const key of [pl, PLACE_GROUP[pl]]) if (key && PLACE_ACTS[key]) for (const a of PLACE_ACTS[key]) if (!a.cond || a.cond()) acts.push(a);
  return acts;
}
function placeActMenu() {
  const acts = placeActsHere(); if (!acts.length) return;
  openSheet({ title: `🌿 ${placeName(curPlace()) || M.name}에서 할 일`, items: acts.map(a => ({ icon: a.icon, label: a.label, onClick: () => (a.ui ? a.run() : runEvent(a.run)) })), cols: 3 });
}
const _computeActionLife = computeAction;
computeAction = function () {
  const P = G.player, d = G.det;
  if (G.working || G.fishing) return G.ctxAction;
  if (G.dev) return null;
  // 텐트 · 그릴 · 미끄럼틀
  if (M.tentDoor) { if (P.seat && P.seat.bench === 'tentSeat' && bothSeated('tentSeat')) return { label: '함께하기', icon: '💞', hot: true, fn: tentCoupleMenu }; if (!(M.exit && Math.floor(P.x) === M.exit[0] && Math.floor(P.y) === M.exit[1])) return { label: '텐트 안', icon: '⛺', fn: tentMenu }; }
  if (P.map === 'island' && !P.seat) {
    for (const w of ['A', 'B']) { const p = P_('tent' + w); if (Math.hypot(P.x - p[0], P.y - p[1]) < 1.15) return { label: '텐트 들어가기', icon: '⛺', hot: true, fn: () => enterTent(w) }; }
    if (nearGrill()) return { label: '고기 굽기', icon: '🔥', hot: bbqTime(), fn: bbqMenu };
  }
  const base = _computeActionLife();
  const cands = [];
  if (base) cands.push(base);
  // 동행 중에도 주변 사람 · 시설은 그대로, 여러 개면 고르기
  for (const a of G.actors) if (a !== P && a !== d && a.visible && a.map === P.map && dist(a, P) < 1.7 && !a.pet && (!base || base.label !== '말 걸기')) cands.push({ label: `${(a.look.name || '').split(' ').pop()}와 이야기`, icon: '💬', fn: () => interactWith(a) });
  if (S.comp && d.visible && d.map === P.map && dist(d, P) < 3 && !base) cands.push({ label: `${himCall()} 메뉴`, icon: '💞', fn: () => detMenu() });
  const pa = !base || base.label === '나가기' ? placeActsHere() : []; if (pa.length) cands.push({ label: '여기서 할 일', icon: '🌿', fn: placeActMenu });
  if (cands.length <= 1) return cands[0] || null;
  const head = cands[0];
  return { label: head.label.length > 6 ? head.label.slice(0, 6) + '…' : head.label, icon: head.icon, hot: head.hot, multi: cands.length, fn: () => openSheet({ title: '무엇을 할까요?', items: cands.map(c => ({ icon: c.icon, label: c.label, onClick: c.fn })), cols: 2 }) };
};
/* 형사님 전용 행동 메뉴 (형사님을 직접 누르거나 왼쪽 위 아이콘) */
const _detMenuLife = detMenu;
detMenu = function () {
  const r = S.rel, d = G.det, st = r.stage;
  const special = !r.flags.met || Object.values(S.cases).some(c => c.step === 'report') || (activeAppt(S.min) && d.apptArrived) || ['sick', 'waitLighthouse', 'wedding', 'pickup'].includes(d.task);
  if (special) { _detMenuLife(); return; }
  d.talking = true; d.stop(); d.lookAt(G.player); G.player.lookAt(d);
  const L = (n, extra = {}) => st < n ? Object.assign({ locked: true, note: STAGES[n - 1].name, why: `「${STAGES[n - 1].name}」 단계에서 열려요` }, extra) : extra;
  const items = [
    { icon: '💬', label: '대화하기', onClick: () => doInteraction('talk') },
    { icon: S.comp ? '👋' : '👣', label: S.comp ? '동행 종료' : '함께 걷기', onClick: () => doInteraction('follow') },
    Object.assign({ icon: '🤝', label: S.hold ? '손 놓기' : '손잡기', onClick: () => { if (!S.comp) { toast('함께 걸을 때 손잡을 수 있어요'); return; } doInteraction('hand'); } }, L(5)),
    Object.assign({ icon: '🫂', label: '안아주기', onClick: () => doInteraction('hug') }, L(5)),
    Object.assign({ icon: '🎁', label: '선물하기', onClick: () => doInteraction('gift') }, L(3)),
    Object.assign({ icon: '💗', label: '데이트 제안', onClick: () => dateMenu() }, L(5)),
    Object.assign({ icon: '🪑', label: '함께 앉기', onClick: () => compAction('sit') }, L(2)),
    { icon: '🌿', label: '함께 활동하기', onClick: () => activityMenu() },
    Object.assign({ icon: '📷', label: '사진 찍기', onClick: () => cameraMenu() }, L(3)),
    Object.assign({ icon: '📅', label: '약속 잡기', onClick: () => runEvent(apptMenu) }, L(3)),
    { icon: '➕', label: '더 보기', onClick: () => _detMenuLife() },
  ];
  openSheet({ title: detLabel(), sub: relSummaryHTML(), items, cols: 3, onClose: () => { if (!G.busy) d.talking = false; } });
};
compMenu = function () { if (!G.busy) detMenu(); };

/* ---------------- 장소별 활동 ---------------- */
const dl = (polite, casual) => `[[${polite}||${casual}]]`;
async function withDetLine(polite, casual, aff = 1) { if (detNearby(5)) { G.det.lookAt(G.player); await say('det', 'smile', dl(polite, casual)); if (!S.rel.daily['pa_' + polite.length]) { S.rel.daily['pa_' + polite.length] = true; addAff(aff); } } }
Object.assign(PLACE_ACTS, {
  beach: [
    { icon: '🏰', label: '모래성 만들기', run: async () => { const P = G.player; P.dig = true; await sleep(1200); P.dig = false; const [x, y] = nearestWalkable(P.x + 1, P.y, M); G.tempObjs.push({ kind: 'sandcastle', x: Math.floor(x), y: Math.floor(y), map: P.map, solid: false, day: S.day }); await say('narr', '', '🏰 탑이 세 개 달린 모래성을 완성했다! 파도가 오기 전까지는 내 성이다.'); await withDetLine('이야, 성이 아주 튼튼하네요. 제가 경비 서 드릴까요?', '오, 성 멋있다. 내가 성 지키는 기사 할게.'); advanceTime(30); } },
    { icon: '🧺', label: '돗자리 펴기', run: async () => { const P = G.player, m = MAPS.island; const x = Math.floor(P.x), y = Math.floor(P.y); if (!walkable(x + 1, y, m) || !walkable(x, y + 1, m) || !walkable(x + 1, y + 1, m)) { await say('narr', '', '여긴 돗자리를 펼 자리가 좁다. 좀 더 넓은 모래밭으로 가 보자.'); return; } G.tempObjs = G.tempObjs.filter(o => !o.tempMat); G.tempObjs.push({ kind: 'mat', x, y, fw: 2, fh: 1, flat: true, solid: false, keyFix: x + y - 0.5, tempMat: true, map: 'island' }); m.benches.tempMat = { name: '내 돗자리', place: 'beach', leisure: 'mat', seats: [[x, y], [x + 1, y]], stand: [[x, y + 1], [x + 1, y + 1]], face: [0, 0], ground: true, pairs: [[0, 1]], temp: true }; await say('narr', '', '🧺 체크무늬 돗자리를 쫙 펼쳤다. 이제 앉아서 바다를 볼 수 있다. (돗자리를 누르면 앉아요)'); } },
    { icon: '🌊', label: '바다 구경', run: async () => { await say('narr', '', pick(['파도가 밀려왔다 밀려간다. 멀리 여객선이 하얀 줄을 그으며 지나간다.', '반짝이는 수평선을 한참 바라봤다. 마음이 조용해진다.'])); await withDetLine('바다는 매일 봐도 매일 다르네요.', '바다는 매일 봐도 매일 달라. 신기하지?'); advanceTime(20); } },
    { icon: '🦶', label: '발 담그기', cond: () => !rainy() && season() !== 'winter', run: async () => { const P = G.player; P.pose = 'sit'; await say('narr', '', '신발을 벗고 파도에 발을 담갔다. 차갑다! 그런데 기분 좋다.'); await withDetLine('발 시리지 않으세요? 저도 담가 볼게요. …으, 차가워!', '나도 담글래. …으아, 차가워! 하하.'); advanceTime(20); P.pose = 'stand'; } },
    { icon: '🌅', label: '노을 감상', cond: () => S.min >= 17 * 60 && S.min < 19.6 * 60, run: async () => { await say('narr', '', '🌅 바다가 주황색에서 분홍색으로, 다시 보라색으로 물들었다.'); await withDetLine('노을이 오늘따라 진하네요. 내일 날씨가 좋으려나 봐요.', '오늘 노을 진짜 예쁘다. 너랑 봐서 더 그런가.', 2); advanceTime(25); } },
    { icon: '📷', label: '사진 찍기', ui: true, run: () => cameraMenu() },
  ],
  pier: [
    { icon: '⛴', label: '여객선 구경', run: async () => { const fp = ferryPhase(S.min); await say('narr', '', fp.phase === 'docked' ? '⛴ 여객선이 정박해 있다. 손님들이 짐을 들고 내린다.' : fp.phase === 'arriving' ? '⛴ 수평선 너머로 여객선이 천천히 다가온다.' : fp.phase === 'cancel' ? '오늘은 결항이라 부두가 한산하다.' : `여객선은 지금 없다. ${nextFerryText()}`); await withDetLine('배 들어오는 시간엔 저도 꼭 나와 봐요. 손님 안내하려고요.', '배 들어올 때 나 여기 꼭 있지? 길 안내 담당이라.'); } },
    { icon: '🐱', label: '항구고양이 찾기', ui: true, run: async () => { const cat = G.pets.find(p => p.pet && p.pet.kind === 'cat' && p.visible && p.map === G.player.map); const near = cat && dist(cat, G.player) < 12; await runEvent(async () => { await say('narr', '', near ? `${cat.pet.name || '고양이'}이(가) 그물 더미 위에서 하품을 한다.` : '고양이들이 어디 숨었는지 보이지 않는다. 창고 쪽에 있으려나?'); }); if (near) approach(cat); } },
    { icon: '🌊', label: '바다 구경', run: async () => { await say('narr', '', '부두 끝에 서서 파도 소리를 들었다. 갈매기가 머리 위를 맴돈다.'); advanceTime(15); } },
    { icon: '📷', label: '사진 찍기', ui: true, run: () => cameraMenu() },
  ],
  lighthouse: [
    { icon: '🔭', label: '전망 구경', run: async () => { await say('narr', '', '등대 아래에서 섬 전체가 한눈에 들어온다. 저 멀리 풍차가 천천히 돈다.'); await withDetLine('여기서 보면 섬이 손바닥만 하죠?', '여기서 보면 섬이 진짜 작아. 우리 집도 보인다, 저기.'); } },
    { icon: '🌃', label: '야경 감상', cond: () => isNight(), run: async () => { await say('narr', '', '🌃 마을의 불빛이 하나둘 켜지고, 등대 불빛이 바다를 천천히 쓸고 지나간다.'); await withDetLine('밤바다가 이렇게 조용한 줄 처음 아셨죠?', '이 시간 등대가 제일 좋아. 우리 둘만 있는 것 같아서.', 2); advanceTime(20); } },
    { icon: '💭', label: '추억 회상', cond: () => detNearby(5) && S.rel.stage >= 3, run: async () => { const m = memoryLine(); await say('det', 'smile', m || '여기서 있었던 일들, 하나하나 다 기억나.'); } },
    { icon: '📷', label: '사진 찍기', ui: true, run: () => cameraMenu() },
  ],
  in_hall: [
    { icon: '🗣', label: '주민들과 수다', run: async () => { await say('chief', 'laugh', pick(['허허, 왔구먼! 요즘 마을 얘기 들었어? 만복이가 또 대물 잡았다고 난리여.', '우리 마을이 요즘 활기가 넘쳐. 다 젊은 사람들 덕이지.', '축제 준비할 때 자네가 도와주면 든든하겠어.'])); advanceTime(20); } },
    { icon: '🍵', label: '차 마시기', run: async () => { G.player.prop = 'tea'; await say('narr', '', '회관 보리차를 한 잔 얻어 마셨다. 구수하다.'); G.player.prop = null; advanceTime(15); } },
    { icon: '🍪', label: '간식 먹기', run: async () => { await say('narr', '', '회관 탁자 위 강정 바구니에서 하나 집었다. 이장님이 "더 먹어!" 하신다.'); S.inv.snack = (S.inv.snack || 0) + (S.rel.daily.hallSnack ? 0 : 1); S.rel.daily.hallSnack = true; } },
    { icon: '📋', label: '마을 행사 보기', ui: true, run: () => { if (!festBoardMenu()) interiorAction('events'); } },
  ],
  forest: [
    { icon: '🚶', label: '숲길 산책', run: async () => { await say('narr', '', '동백나무 사이로 난 오솔길을 천천히 걸었다. 새소리가 따라온다.'); await withDetLine('숲에 오면 저도 모르게 목소리가 작아져요.', '숲에 오면 괜히 목소리 작아지지 않아? 하하.'); advanceTime(25); } },
    { icon: '🌸', label: '꽃 구경', cond: () => season() !== 'winter' || true, run: async () => { await say('narr', '', ({ spring: '🌸 들꽃이 한가득. 노란 꽃 사이로 나비가 날아다닌다.', summer: '🌺 수국이 탐스럽게 피었다.', autumn: '🍂 붉게 물든 잎이 바람에 흩날린다.', winter: '🌺 눈 속에 빨간 동백꽃이 피었다.' })[season()]); advanceTime(15); } },
    { icon: '🌳', label: '나무 아래 쉬기', run: async () => { const P = G.player; P.lie = -1; await say('narr', '', '나무 그늘에 누워 잎사귀 사이 하늘을 올려다봤다.'); advanceTime(30); P.lie = 0; } },
    { icon: '🔎', label: '숨은 물건 찾기', run: async () => { if (S.rel.daily.forestFind) { await say('narr', '', '오늘은 더 찾을 게 없어 보인다. 내일 또 와 보자.'); return; } S.rel.daily.forestFind = true; const r = Math.random(); if (r < 0.35) { S.inv.pebble = (S.inv.pebble || 0) + 1; await say('narr', '', '나무뿌리 사이에서 동글동글한 조약돌을 찾았다!'); } else if (r < 0.55) { S.inv.flower = (S.inv.flower || 0) + 1; await say('narr', '', '수풀 속에서 예쁜 들꽃 다발을 발견했다.'); } else if (r < 0.65 && !S.treasure.frags.hidden) { await say('narr', '', '나무 둥치에 이상한 표시가 새겨져 있다. …숲 깊은 곳에 뭔가 있는 걸까?'); } else await say('narr', '', '도토리만 잔뜩 나왔다. 다람쥐들의 보물 창고였나 보다.'); } },
    { icon: '🧺', label: '형사님과 소풍', cond: () => detNearby(6) && S.rel.stage >= 3, ui: true, run: async () => { if (S.rel.stage >= 5) doDate('forest'); else await runEvent(async () => { await say('det', 'smile', casualOn() ? '여기 그늘 좋다. 잠깐 앉아서 쉬다 가자.' : '여기 그늘 좋네요. 잠깐 앉아서 쉬었다 가요.'); closeDialog(); await compAction('sit'); }); } },
  ],
  cafe: [
    { icon: '🍰', label: '디저트 먹기', run: async () => { if (S.money < 3500) { await say('narr', '', '귤 케이크 한 조각 3,500원. 돈이 조금 모자라다.'); return; } S.money -= 3500; G.player.prop = 'tangerine'; await say('narr', '', '🍰 귤 크림이 올라간 케이크. 달콤새콤하다.'); await withDetLine('그거 한 입만… 아니, 괜찮아요. 하하.', '한 입만. 아니, 두 입.'); G.player.prop = null; updateHUD(); } },
    { icon: '🪟', label: '창밖 보기', run: async () => { await say('narr', '', '창밖으로 마을 사람들이 지나간다. 순덕 할머니가 손을 흔든다.'); advanceTime(15); } },
    { icon: '💗', label: '카페 데이트', cond: () => detNearby(6) && S.rel.stage >= 5, ui: true, run: () => doDate('cafe') },
  ],
  in_home: [
    { icon: '🪟', label: '창밖 보기', run: async () => { await say('narr', '', ({ sunny: '햇살이 쏟아진다. 마당 화분이 반짝인다.', cloudy: '구름이 낮게 흘러간다. 오늘은 집에서 뒹굴기 딱 좋은 날.', rain: '빗방울이 창문을 타고 흘러내린다. 따뜻한 차가 생각난다.', storm: '바람이 창문을 흔든다. 집 안이 이렇게 아늑할 수가.', snow: '눈이 소복소복 쌓인다. 온 마을이 하얗다.' })[S.weather]); advanceTime(10); } },
    { icon: '🍵', label: '차 마시기', run: async () => { G.player.prop = 'tea'; await say('narr', '', '보리차를 끓여 한 잔 마셨다. 몸이 따뜻해진다.'); if (detNearby(5)) { G.det.prop = 'tea'; await say('det', 'smile', S.rel.flags.married ? '여보가 끓인 차가 제일 맛있어.' : dl('차 향이 좋네요.', '차 맛있다. 한 잔 더.')); } G.player.prop = G.det.prop = null; advanceTime(20); } },
    { icon: '🛋', label: '함께 쉬기', cond: () => detNearby(6), run: async () => { const d = G.det; d.emo('😌', 2); await say('det', 'smile', S.rel.flags.married ? '오늘은 아무것도 하지 말자. 우리 둘이 소파 점령.' : dl('이렇게 쉬는 것도 좋네요.', '이렇게 아무것도 안 하고 있는 거, 너랑이니까 좋다.')); advanceTime(40); addAff(2); } },
    { icon: '🖼', label: '사진 구경', ui: true, run: async () => { albumMenu(); } },
    { icon: '🛠', label: '가구 정리', ui: true, run: async () => { openDecor(); } },
  ],
  playground: [
    { icon: '🧒', label: '아이들과 이야기', cond: () => G.villagers.some(v => v.look.kid && v.visible && dist(v, G.player) < 9), ui: true, run: async () => { const k = G.villagers.filter(v => v.look.kid && v.visible && v.map === G.player.map).sort((a, b) => dist(a, G.player) - dist(b, G.player))[0]; if (!k) { toast('지금은 놀이터에 아이들이 없어요'); return; } approach(k); } },
    { icon: '😜', label: '형사님과 장난치기', cond: () => detNearby(6) && S.rel.stage >= 3, run: async () => { const d = G.det; d.emo('😆', 2); await say('det', 'laugh', pick(['잡아 봐라~! …아이고, 숨차. 나이는 못 속인다.', '야, 미끄럼틀 누가 빨리 내려오나 내기하자. 지면 아이스크림!', '그네 타는 너 밀어줄게. 하나, 둘— 하하, 세게는 안 밀었어.'])); addAff(1); } },
  ],
  rocks: [
    { icon: '🧰', label: '낚시 용품 구경', run: async () => { await say('narr', '', '만복 아저씨의 도구 상자에는 찌, 바늘, 그리고 왜인지 사탕이 한가득 들어 있다.'); } },
    { icon: '🐟', label: '잡은 물고기 자랑', cond: () => Object.keys(S.inv).some(k => k.startsWith('f_') && S.inv[k] > 0), run: async () => { const k = Object.keys(S.inv).find(x => x.startsWith('f_') && S.inv[x] > 0); if (!k) return; const mb = G.villagers.find(v => v.id === 'manbok' && v.visible && dist(v, G.player) < 10); await say('narr', '', `${ITEMS[k].name}을(를) 번쩍 들어 보였다!`); if (mb) await say('manbok', 'laugh', '오오! 제법인데? 그래도 내가 어제 잡은 놈이 두 배는 컸어. 진짜여!'); await withDetLine('오, 대단하시네요! 저는 오늘도 꽝인데.', '오, 대박! 나 오늘도 꽝인데. 비결 좀.'); } },
  ],
  pavilion: [{ icon: '🍃', label: '바람 쐬기', run: async () => { await say('narr', '', '정자 처마 아래로 시원한 숲 바람이 지나간다. 땀이 싹 식는다.'); await withDetLine('바람 좋네요. 여기가 섬에서 제일 시원한 데예요.', '바람 좋다. 여기 우리 비밀 피서지 할까?'); advanceTime(15); } }],
  orchard: [{ icon: '🍊', label: '귤나무 보기', run: async () => { await say('narr', '', ({ spring: '하얀 귤꽃 향기가 진하다.', summer: '초록 풋귤이 조롱조롱 달렸다.', autumn: '귤이 노랗게 물들어 간다.', winter: '주황색 귤이 주렁주렁! 지금이 수확 철이다.' })[season()]); } }],
});
Object.assign(PLACE_ACTS, { promenade: PLACE_ACTS.beach, coast: PLACE_ACTS.beach, fishing: PLACE_ACTS.pier, dock: PLACE_ACTS.pier, in_cafe: PLACE_ACTS.cafe, farm: PLACE_ACTS.orchard, field: PLACE_ACTS.forest });

/* ---------------- 주민 날씨 · 시간 대사 (성격별 말투) ---------------- */
const V_WEATHER = {
  halmeoni: { sunny: '아이고, 볕 좋다. 이불 널기 딱 좋은 날이여.', cloudy: '날이 꾸물꾸물한 게 비 오려나 보다. 빨래 걷어야겄네.', rain: '비 오는 날엔 무릎이 쑤셔. 그래도 밭에는 좋은 비여.', storm: '태풍 오는 날 바다 근처엔 얼씬도 하지 말어. 할미 말 들어.', snow: '눈 오니께 손주들 생각나네. 다들 눈사람 만들고 있겄지?', morning: '아침 먹었어? 안 먹었으면 할미네 와. 밥 한 술 떠.', evening: '해 넘어간다. 얼른 들어가, 밤바람 차.' },
  okja: { sunny: '물 맑은 날이여. 오늘 물질 나간 애들 신났겄다.', cloudy: '흐린 날은 바다 속도 어두워. 조심해야 혀.', rain: '비 오는 날엔 해녀창고에서 그물 손질이나 하지.', storm: '이런 날 바다 들어가는 건 미친 짓이여. 오늘은 쉬어.', snow: '겨울 바다는 칼 같아도, 그 속 소라가 제일 달어.', morning: '새벽 물때 맞춰 나갔다 왔어. 허리가 아이고.', evening: '저녁엔 해녀들끼리 불턱에 모여 수다 떨던 게 그립네.' },
  kid: { sunny: '날씨 좋아요! 놀이터 가서 그네 탈 거예요!', cloudy: '구름이 솜사탕 같아요. 먹고 싶다~', rain: '비 와요! 장화 신고 웅덩이 첨벙첨벙 할 거예요!', storm: '바람 무서워요… 형사님이 지켜 주겠죠?', snow: '눈이다! 눈사람 만들어요! 형사님 모자도 씌워 줄 거예요!', morning: '학교 가기 싫어요~ 아니, 친구들 보고 싶어요!', evening: '엄마가 해 지기 전에 들어오래요. 조금만 더 놀래요!' },
  kid2: { sunny: '오늘은 노랑이랑 공 놀이 할 거예요.', cloudy: '흐린 날엔 매미도 조용해요.', rain: '비 오니까 지렁이가 나왔어요. 저 안 무서워요!', storm: '태풍이 오면 학교 쉬어요? …쉬었으면 좋겠다.', snow: '눈 뭉치 던지기 할래요? 저 잘 던져요!', morning: '아침에 귤 두 개 먹었어요. 키 클 거예요.', evening: '저녁에 형사님이 순찰 도는 거 따라다니고 싶어요.' },
  fisher: { sunny: '물빛 좋네. 이런 날은 고등어가 줄 서서 올라와.', cloudy: '흐린 날이 오히려 손맛이 좋아. 고기들이 경계를 덜 하거든.', rain: '비 오면 갯지렁이가 올라와. 미끼 걱정은 없지.', storm: '태풍 오는 날은 배 묶어 두고 술이나 한잔해야지. 허허.', snow: '눈 오는 날 바다 보면, 이 맛에 섬 사는 거여.', morning: '새벽 배 들어오는 거 봤어? 오늘 생선 싱싱하다.', evening: '저녁엔 횟집 가서 오늘 잡은 놈 자랑해야지.' },
  chief: { sunny: '허허, 날이 좋으니 마을 사람들 얼굴도 다 폈구먼.', cloudy: '날이 흐려도 마을 일은 쉬면 안 되지. 허허.', rain: '비 오는 날엔 회관에서 바둑이나 두자고. 한 판?', storm: '태풍 대비는 다 했어? 화분 들여놓고 창문 테이프 붙여!', snow: '눈 오면 회관 앞 눈은 내가 치우지. 젊은 사람들은 출근해야지.', morning: '아침부터 회관 문 열었어. 마을 일은 부지런해야 혀.', evening: '저녁엔 회관에서 노래방이나 하자고. 내 18번 들어 볼 텐가?' },
  postman: { sunny: '날 좋은 날은 배달도 신나요! 오늘 편지 많아요~', cloudy: '흐린 날엔 편지 젖을까 봐 가방을 꽉 닫아요.', rain: '비 오는 날 배달은 우비가 생명이죠. 하하.', storm: '오늘은 배가 안 떠서 우편물이 없어요. 덕분에 쉬네요.', snow: '눈길에 자전거는 위험해서 오늘은 걸어서 돌아요.', morning: '아침 우편물 왔어요~ 혹시 택배 기다리세요?', evening: '배달 끝! 저녁엔 카페에서 귤 라떼 한 잔.' },
  tourist: { sunny: '날씨 최고예요! 사진이 다 화보처럼 나와요.', cloudy: '흐려도 섬 분위기가 운치 있어서 좋네요.', rain: '비 오는 섬도 낭만 있어요. 카페 가서 비 구경해야겠어요.', storm: '배가 안 뜬대요… 하루 더 있게 됐어요. 오히려 좋아!', snow: '섬에 눈이라니! 육지 친구들한테 자랑해야지.', morning: '아침 해돋이 보러 갯바위 다녀왔어요!', evening: '노을 명소가 어디예요? 등대요? 가 볼게요!' },
  tourist2: { sunny: '햇살 좋다~ 신혼여행 날씨 운이 좋네요!', cloudy: '흐린 날엔 남편이랑 카페 투어해요.', rain: '비 오니까 숙소에서 귤 까 먹으면서 쉬어요.', storm: '태풍이래요. 무서워서 남편 손 꼭 잡고 있어요.', snow: '눈 오는 해월도, 평생 기억할 것 같아요.', morning: '아침 산책하다가 고양이랑 친구 됐어요!', evening: '저녁엔 횟집 물회 먹으러 가요. 벌써 기대돼요.' },
  rancher: { sunny: '말들이 볕 쬐면서 졸고 있어. 평화롭지?', cloudy: '흐린 날엔 말들도 얌전해.', rain: '비 오면 마구간에 다 들여놔야 해. 조랑이가 비 싫어하거든.', storm: '태풍 오면 밤새 마구간 지켜야 해. 오늘 잠은 다 잤다.', snow: '눈 오면 조랑이가 신나서 뛰어다녀. 강아지 같다니까.', morning: '아침마다 건초 주는 게 일이야. 말들이 나만 보면 울어.', evening: '해 지면 말들 재우고 나도 일찍 자.' },
  farmer: { sunny: '볕 좋을 때 귤 말려야지. 귤피차 만들어 줄게.', cloudy: '흐린 날엔 귤밭 김매기가 덜 덥지.', rain: '비 와서 귤나무가 좋아하겠네. 고마운 비야.', storm: '태풍 오면 귤 떨어질까 봐 밤새 걱정이야.', snow: '눈 쌓인 귤밭 봤어? 주황색이랑 하얀색이 얼마나 예쁜지.', morning: '아침 일찍 귤밭 한 바퀴 돌았어. 올해 귤 달다!', evening: '저녁엔 농장 평상에서 귤 까 먹는 게 낙이야.' },
  keeper: { sunny: '맑은 날엔 등대 불빛이 멀리까지 가지. 사십 년째 봐도 좋아.', cloudy: '흐린 날은 등대가 더 바빠. 배들한테 길을 알려 줘야 하니까.', rain: '비 오는 날 등대 렌즈 닦는 게 내 일이야.', storm: '이런 날 등대가 꺼지면 큰일 나. 오늘은 밤새 지켜야지.', snow: '눈 오는 밤 등대 불빛이 눈송이에 번지는 걸 봤어? 그게 장관이지.', morning: '아침엔 등대 불 끄고 한숨 자.', evening: '이제 불 켤 시간이야. 노을 보고 가.' },
  lifeguard: { sunny: '해수욕하기 딱 좋은 날! 깊은 데는 가지 마세요~', cloudy: '흐려도 자외선은 세요. 선크림 꼭이요!', rain: '비 오는 날엔 바다 입수 금지예요. 오늘은 순찰만!', storm: '태풍 경보! 해변 출입 통제 중이에요. 돌아가 주세요.', snow: '겨울엔 수영은 안 되지만 해변 산책은 좋아요.', morning: '아침 해변 청소 끝! 오늘도 깨끗한 바다.', evening: '해 지면 해변 폐장이에요. 노을만 보고 가세요~' },
  grandpa: { sunny: '귤나무가 볕을 받아야 달아지지. 오늘 같은 날이 보약이여.', cloudy: '흐린 날엔 내 허리도 흐려. 허허.', rain: '비 오는 날엔 귤나무 가지가 축 처져. 내일은 털어 줘야겄다.', storm: '태풍 오기 전에 귤 좀 따 둬야 하는디…', snow: '눈 덮인 귤밭 보면 젊을 적 생각나. 할멈이랑 귤 따던 때.', morning: '새벽부터 귤밭에 나와 있었어. 나무들이 나 기다려.', evening: '저녁 바람 차다. 귤 하나 까 먹고 들어가.' },
  manbok: { sunny: '이런 날은 물고기가 알아서 올라와! 오늘 대물 각이여!', cloudy: '흐린 날이 진짜 낚시 날씨여. 고기들이 방심하거든!', rain: '비 오는 날 갯바위는 미끄러워. 오늘은 횟집에서 낚시 얘기나 하자고.', storm: '태풍 오는 날 낚시하는 건 바보여. 나도 오늘은 집콕!', snow: '눈 오는 날 감성돔이 제일 맛있어. 근데 손이 얼어서 못 잡아. 허허.', morning: '새벽 물때에 맞춰 나왔지! 아직 한 마리도 못 잡았지만.', evening: '오늘 조과? 비밀이여. …사실 세 마리. 작은 놈으로.' },
};
const _villagerLineLife = villagerLine;
villagerLine = function (vid) {
  const W = V_WEATHER[vid], h = S.min / 60;
  if (W) { const r = Math.random(); if (r < 0.4 && W[S.weather]) return W[S.weather]; if (r < 0.55 && h < 10 && W.morning) return W.morning; if (r < 0.55 && h >= 17 && W.evening) return W.evening; }
  if (!VILLAGERS[vid] || !VILLAGERS[vid].lines) return W ? (W[S.weather] || W.sunny || '…') : '…';
  return _villagerLineLife(vid);
};
/* 형사님 날씨 인사 (기존 대사 풀에도 날씨별 문장 추가) */
Object.assign(WEATHER_IDLE, { sunny: ['오늘 날씨 진짜 좋네요. 순찰 핑계로 바다 보러 가야겠어요.'], storm: ['태풍 오는 날은 해안 순찰이 길어져요. 오늘은 바닷가에 가지 마세요.'] });

/* ---------------- 주민 생활 (서로 대화 · 선물 · 사진 · 꽃 구경) ---------------- */
const SOCIAL_TALK = [['오늘 귤값 들었어?', '또 올랐다며? 아이고.'], ['저기 형사 양반 또 웃고 다니네.', '좋은 일 있나 보지 뭐. 호호.'], ['내일 배 뜬대?', '날씨 보니까 뜰 것 같어.'], ['우리 손주가 이번에 상 받았어!', '아이고, 장하다! 국수 사야겄네.'], ['오늘 물회 먹었어?', '아직. 이따 같이 가자.'], ['놀이터에 그네 새로 칠했대.', '애들 신났겄네~']];
let _lifeT = 0;
function lifeTick() {
  if (!S || !G.started || G.busy) return;
  const vs = G.villagers.filter(v => v.visible && v.map === 'island' && !v.leis && !v.talking && !v.seat && !(v.hold > 0));
  // 둘이 마주치면 잠깐 서서 이야기
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
    const a = vs[i], b = vs[j]; if (dist(a, b) > 2.2 || Math.random() > 0.25) continue;
    const t = pick(SOCIAL_TALK); a.stop(); b.stop(); a.hold = 6; b.hold = 6; a.lookAt(b); b.lookAt(a);
    a.say(t[0], 3); setTimeout(() => b.visible && b.say(t[1], 3), 1600);
    if ((a.id === 'halmeoni' || a.id === 'grandpa') && b.look.kid) { setTimeout(() => { a.say('옜다, 귤 하나 먹어.', 2.5); burst(b, 'heart', 2); }, 3300); }
    return;
  }
  // 관광객은 명소에서 사진
  for (const v of vs) if ((v.id === 'tourist' || v.id === 'tourist2') && ['lighthouse', 'beach', 'windmill', 'field'].includes(placeAt(v.x, v.y, MAPS.island)) && Math.random() < 0.2) { v.stop(); v.hold = 4; v.say(pick(['📸 찰칵! 인생샷이다!', '📸 여기 배경 진짜 예쁘다~']), 2.6); burst(v, 'spark', 2); return; }
  // 봄 · 여름엔 꽃밭에서 꽃 구경
  for (const v of vs) if (['field', 'forest'].includes(placeAt(v.x, v.y, MAPS.island)) && ['spring', 'summer'].includes(season()) && Math.random() < 0.15) { v.stop(); v.hold = 4; v.say(pick(['꽃 향기 좋다~', '이 꽃 이름이 뭐더라?']), 2.6); return; }
}
/* 형사님 순찰 중 놀이터 들르기 */
function detPlaygroundTick() {
  const d = G.det; if (G.busy || S.comp || d.state !== 'sched' || G.detAuto || d.map !== 'island' || !d.visible || !S.rel.flags.met) return;
  if (detPlan(S.min).k !== 'patrol' || S.surp.pgVisit === S.day || Math.random() > 0.02) return;
  const kids = G.villagers.filter(v => v.look.kid && v.seat && MAPS.island.benches[v.seat.bench] && MAPS.island.benches[v.seat.bench].place === 'playground');
  if (!kids.length) return;
  S.surp.pgVisit = S.day;
  G.detAuto = { kind: 'pgVisit', t: 0, phase: 'go', target: P_('playgroundGate') }; d.stop(); d.walkTo(...P_('playgroundGate'));
}
const _autoUpdateLife = autoUpdate;
autoUpdate = function (dt) {
  const A = G.detAuto, d = G.det; if (!A || A.kind !== 'pgVisit') return _autoUpdateLife(dt);
  A.t += dt;
  if (A.phase === 'go') { if (!d.path.length && A.t > 1) { A.phase = 'greet'; A.t = 0; d.say('얘들아, 조심해서 놀아라~ 그네 너무 세게 타지 말고!', 3.5); const k = G.villagers.find(v => v.look.kid && v.seat); if (k) setTimeout(() => k.say('형사님 안녕하세요!! 같이 놀아요!', 3), 1500); } else if (!d.path.length) d.walkTo(...A.target); if (A.t > 30) endAuto(); return; }
  if (A.t > 6) endAuto();
};

/* ---------------- 미끄럼틀 · 흔들말 (놀이터) ---------------- */
const _playOffsetLife = playOffset;
playOffset = function (a) {
  if (a.seat && a.map === 'island') {
    const bk = MAPS.island.benches[a.seat.bench];
    if (bk && bk.play === 'slide') {
      const s = bk.seats[0], ex = bk.exit, ph = ((G.t + (a.id.length % 3)) % 3.2) / 3.2;
      let wy, z;
      if (ph < 0.3) { wy = s[1] - 0.6 + ph / 0.3 * 0.6; z = 24 * ph / 0.3; } else if (ph < 0.6) { wy = s[1]; z = 24; } else if (ph < 0.9) { const k = (ph - 0.6) / 0.3; wy = s[1] + k * (ex[1] - s[1] - 0.6); z = 24 * (1 - k); } else { wy = ex[1] - 0.6; z = 0; }
      const [px, py] = iso(s[0] + 0.5, wy + 0.5), [sx, sy] = iso(a.x, a.y);
      a._merryD = s[0] + wy + 1.5; return { dx: px - sx, dy: py - sy - z };
    }
    if (bk && bk.play === 'spring') { return { dx: Math.sin(G.t * 5) * 1.5, dy: -Math.abs(Math.sin(G.t * 5)) * 3 - 6 }; }
  }
  return _playOffsetLife(a);
};
const _seatDepthLife = seatDepth;
seatDepth = function (a, m) { const bk = m.benches[a.seat.bench]; if (bk && bk.play === 'slide' && a._merryD != null) return a._merryD; return _seatDepthLife(a, m); };
const _leisureMenuLife = leisureMenu;
leisureMenu = function (k) {
  const bk = M.benches[k];
  if (bk && bk.leisure === 'tent') return tentMenu();
  if (bk && (bk.leisure === 'slide' || bk.leisure === 'spring')) {
    if (rainy()) { toast('🌧 비가 와서 미끄러워요. 맑은 날 놀아요'); return; }
    const P = G.player;
    if (bk.leisure === 'slide') { runEvent(async () => { if (!seatFree('island', 'slide', 0, P.id)) { await say('narr', '', '누가 타고 있다. 차례를 기다리자.'); return; } P.sitAt('slide', 0); await sleep(3200); P.standUp(); const ex = bk.exit; P.x = ex[0] + 0.5; P.y = ex[1] + 0.5; await say('narr', '', pick(['슈우웅—! 엉덩이가 살짝 뜨거워졌다. 한 번 더?', '꺄— 생각보다 빠르다!'])); if (detNearby(6)) await say('det', 'laugh', dl('하하, 잘 내려오시네요! 저도 타 볼까요?', '하하, 나도 탈래! 비켜 봐!')); }); return; }
    if (!P.seat) { P.sitAt('spring', 0); toast('🐴 흔들흔들~ 땅을 누르면 내려요'); } else standUpPlayer();
    return;
  }
  return _leisureMenuLife(k);
};
LEISURE_PLANS.unshift({ h: [13.2, 14.2], who: ['kid2'], b: 'slide', act: 'play' }, { h: [16, 17], who: ['kid'], b: 'slide', act: 'play' }, { h: [14.5, 15.5], who: ['kid'], b: 'spring', act: 'play' });

/* ---------------- 저장 · 루프 ---------------- */
const _ensureV4Life = ensureV4;
ensureV4 = function (s) { _ensureV4Life(s); s.lineLog = s.lineLog || {}; s.choiceLog = s.choiceLog || {}; s.leisure.bbqCount = s.leisure.bbqCount || 0; return s; };
const _loopLife = loop;
let _lifeTimer = 0;
loop = function (ts) {
  if (G.started && S && !paused() && !G.dev) { _lifeTimer += 1 / 60; if (_lifeTimer > 2.5) { _lifeTimer = 0; lifeTick(); detPlaygroundTick(); } compChoiceTick(); }
  _loopLife(ts);
};
const _startGameLife = startGame;
startGame = function (state, isNew) { _startGameLife(state, isNew); G.bbqOn = false; G._lastChoice = null; for (const m of Object.values(MAPS)) if (m.benches && m.benches.tempMat) delete m.benches.tempMat; };
