/* =====================================================================
   텃밭 — 집 뒤 6칸 밭에 씨앗을 심고, 매일 물 주고, 다 자라면 수확
   · 씨앗: 마을 슈퍼 「씨앗 · 모종」(계절마다 다름)
   · 물을 준 날(비 오는 날은 저절로) 하루씩 자라고, 사흘 내리 마르면 시듦
   · 수확한 작물은 팔거나 형사님께 선물, 요리 재료로도 씀
   ===================================================================== */
const CROPS = {
  lettuce: { name: '상추', icon: '🥬', seed: 600, days: 2, sell: 1000, gift: 2, se: ['spring', 'summer', 'autumn'], leaf: '#6cc04a', fruit: '#8fd46a', react: ['상추네? 고기 생각나는데. 다음에 이걸로 쌈 싸 먹자.', 'smile'] },
  potato: { name: '감자', icon: '🥔', seed: 800, days: 3, sell: 1600, gift: 3, se: ['spring', 'summer', 'autumn'], leaf: '#4f9e4a', fruit: '#c9a064', react: ['직접 캔 감자야? 쪄 먹으면 진짜 맛있겠다.', 'smile'] },
  corn: { name: '옥수수', icon: '🌽', seed: 1000, days: 4, sell: 2200, gift: 4, se: ['summer'], leaf: '#5aa850', fruit: '#f2d06a', tall: true, react: ['옥수수! 여름엔 역시 이거지. 하모니카처럼 먹는 거 알아?', 'laugh'] },
  tomato: { name: '토마토', icon: '🍅', seed: 1200, days: 4, sell: 2400, gift: 4, se: ['summer'], leaf: '#3f8a3a', fruit: '#e3484a', react: ['빨갛게 잘 익었네. 이거 네가 키운 거라고? 대단하다.', 'surprise'] },
  melon: { name: '수박', icon: '🍉', seed: 2000, days: 5, sell: 5000, gift: 6, se: ['summer'], leaf: '#4f9e4a', fruit: '#2f8a3a', big: true, react: ['통수박을? 이거 들고 오느라 힘들었겠다. 반 갈라서 같이 먹자.', 'laugh'] },
  strawberry: { name: '딸기', icon: '🍓', seed: 1500, days: 4, sell: 2800, gift: 5, se: ['spring'], leaf: '#4f9e4a', fruit: '#e3484a', react: ['딸기다. …하나는 너 먹여 줄게. 아.', 'blush'] },
  carrot: { name: '당근', icon: '🥕', seed: 800, days: 3, sell: 1700, gift: 3, se: ['autumn', 'winter', 'spring'], leaf: '#5aa850', fruit: '#f39a2b', react: ['해월도 겨울 당근은 달기로 유명해. 직접 키운 건 더 달겠다.', 'smile'] },
  pumpkin: { name: '호박', icon: '🎃', seed: 1500, days: 5, sell: 4200, gift: 5, se: ['autumn'], leaf: '#4f8a3a', fruit: '#f39a2b', big: true, react: ['이렇게 큰 호박을? 호박죽 끓여 먹자. 내가 저을게.', 'laugh'] },
  cabbage: { name: '배추', icon: '🥬', seed: 1000, days: 4, sell: 2300, gift: 3, se: ['autumn', 'winter'], leaf: '#8fd46a', fruit: '#cfeeb0', react: ['배추가 실하네. 김장할 때 나 불러. 힘쓰는 건 자신 있어.', 'smile'] },
  spinach: { name: '시금치', icon: '🌿', seed: 600, days: 2, sell: 1100, gift: 2, se: ['winter'], leaf: '#3f8a3a', fruit: '#5aa850', react: ['겨울 시금치가 제일 달대. 나물 무쳐 먹자.', 'smile'] },
};
for (const [k, C] of Object.entries(CROPS)) {
  ITEMS['seed_' + k] = { name: `${C.name} 씨앗`, icon: '🌱', price: C.seed, gift: 0, sell: 0, seed: k, react: ['씨앗? 같이 심자는 거지?', 'smile'] };
  ITEMS['c_' + k] = { name: C.name, icon: C.icon, price: 0, gift: C.gift, sell: C.sell, crop: k, react: C.react };
}
PX_ITEMS.wcan = (P) => { P(3, 6, 8, 7, '#5aa0d8'); P(4, 7, 6, 2, '#8fc3ea'); P(11, 7, 3, 1, '#5aa0d8'); P(13, 5, 2, 2, '#5aa0d8'); P(5, 3, 4, 1, '#2f6fa8'); P(4, 4, 1, 3, '#2f6fa8'); P(9, 4, 1, 3, '#2f6fa8'); };
const GARDEN = { x: 66, y: 66, w: 3, h: 2 };
const FARM_LIMIT = GARDEN.w * GARDEN.h;

/* ---------------- 밭 만들기 ---------------- */
function farmBuild() {
  const m = MAPS.island, W = m.W, { x: X, y: Y, w, h } = GARDEN;
  m.objects = m.objects.filter(o => { const inn = !o.water && o.x >= X - 1 && o.x <= X + w && o.y >= Y - 1 && o.y <= Y + h + 1; if (inn) for (let yy = o.y; yy < o.y + (o.fh || 1); yy++) for (let xx = o.x; xx < o.x + (o.fw || 1); xx++) m.block[yy * W + xx] = 0; return !inn; });
  let i = 0;
  for (let y = Y; y < Y + h; y++) for (let x = X; x < X + w; x++) { m.tiles[y * W + x] = T.DIRT; m.objects.push({ kind: 'plot', x, y, solid: false, flat: true, plot: i++, keyFix: x + y + 0.15 }); }
  const sign = { kind: 'woodSign', x: X - 1, y: Y - 1, solid: true }; m.objects.push(sign); m.block[sign.y * W + sign.x] = 1;
  const bk = { kind: 'basket', x: X + w, y: Y - 1, solid: true }; m.objects.push(bk); m.block[bk.y * W + bk.x] = 1;
  POI.garden = [X + 1.5, Y + h + 0.6];
}
const _buildWorldFarm = buildWorld;
buildWorld = function () { _buildWorldFarm(); farmBuild(); };

/* ---------------- 상태 ---------------- */
function farmState() {
  if (!S.farm) S.farm = { plots: [], day: S.day, harvested: 0, first: null };
  while (S.farm.plots.length < FARM_LIMIT) S.farm.plots.push(null);
  return S.farm;
}
const plotRipe = (p) => p && !p.dead && p.grow >= CROPS[p.crop].days;
const plotStage = (p) => !p ? -1 : p.dead ? 9 : plotRipe(p) ? 3 : p.grow === 0 ? 0 : p.grow >= CROPS[p.crop].days - 1 ? 2 : 1;
const plotWet = (p) => p && p.wet === S.day;
/* 날이 바뀌면: 물 준 날만큼 자라고, 사흘 마르면 시듦 */
function farmAdvance() {
  const F = farmState(); if (F.day >= S.day) return;
  for (let d = F.day; d < S.day; d++) for (const p of F.plots) {
    if (!p || p.dead || plotRipe(p)) continue;
    if (p.wet === d) { p.grow++; p.dry = 0; } else { p.dry = (p.dry || 0) + 1; if (p.dry >= 3) p.dead = true; }
  }
  F.day = S.day;
  // 결혼 후엔 형사님이 아침에 물을 줌
  if (S.rel.flags.married && F.plots.some(p => p && !p.dead && !plotRipe(p))) { for (const p of F.plots) if (p && !p.dead) p.wet = S.day; setTimeout(() => toast(`🌱 ${josa(himCall(), '이', '가')} 아침 일찍 텃밭에 물을 줬어요`), 2600); }
}
function farmTick() {
  if (!S || !G.started) return;
  farmAdvance();
  if (rainy()) for (const p of farmState().plots) if (p && !p.dead) p.wet = S.day;
}

/* ---------------- 그림 ---------------- */
function plotSprite(p) {
  const st = plotStage(p), wet = plotWet(p), C = p ? CROPS[p.crop] : null;
  const key = 'PLOT' + st + (wet ? 'w' : '') + (p ? p.crop : '');
  if (R.objSpr[key]) return R.objSpr[key];
  const spr = blockSprite([], 1, 1, 0, (g, P) => {
    const soil = wet ? '#6a4a34' : '#9a6e4a', soil2 = wet ? '#5a3c28' : '#83593a';
    fillPoly(g, [P(0.08, 0.08, 1), P(0.92, 0.08, 1), P(0.92, 0.92, 1), P(0.08, 0.92, 1)], soil);
    for (const v of [0.3, 0.55, 0.8]) { const a = P(0.15, v, 2), b = P(0.85, v, 2); g.fillStyle = soil2; for (let t = 0; t <= 1; t += 0.06) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), 2, 1); }
    if (st < 0) return;
    const spots = [[0.3, 0.35], [0.7, 0.35], [0.3, 0.72], [0.7, 0.72]];
    for (const [u, v] of spots) {
      const [x, y] = P(u, v, 2);
      if (st === 9) { g.fillStyle = '#8a6a3a'; g.fillRect(x - 1, y - 3, 1, 3); g.fillRect(x + 1, y - 2, 2, 1); continue; }
      if (st === 0) { g.fillStyle = '#5a3c28'; g.fillRect(x - 1, y - 1, 3, 2); g.fillStyle = '#c9a064'; g.fillRect(x, y - 1, 1, 1); continue; }
      const hgt = st === 1 ? 4 : C.tall ? 13 : 8;
      g.fillStyle = C.leaf; g.fillRect(x, y - hgt, 1, hgt);
      g.fillRect(x - 2, y - hgt + 1, 2, 2); g.fillRect(x + 1, y - hgt + 2, 2, 2);
      if (st >= 2) { g.fillRect(x - 3, y - 4, 3, 2); g.fillRect(x + 1, y - 5, 3, 2); }
      if (st === 3) {
        g.fillStyle = C.fruit;
        if (C.big) { fillEllipse(g, x, y - 2, 4, 3, C.fruit); g.fillStyle = shade(C.fruit, 1.25); g.fillRect(x - 2, y - 4, 2, 1); }
        else if (C.tall) { g.fillRect(x + 1, y - 9, 2, 5); }
        else { g.fillRect(x - 2, y - hgt + 2, 2, 2); g.fillRect(x + 2, y - hgt + 4, 2, 2); }
      }
    }
  }, 4);
  return (R.objSpr[key] = spr);
}
const _objSpriteFarm = objSprite;
objSprite = function (o) { if (o.kind === 'plot') return plotSprite(S ? farmState().plots[o.plot] : null); return _objSpriteFarm(o); };

/* ---------------- 행동 ---------------- */
function nearGarden() { const P = G.player; return P.map === 'island' && P.x >= GARDEN.x - 1.2 && P.x <= GARDEN.x + GARDEN.w + 1.2 && P.y >= GARDEN.y - 1.2 && P.y <= GARDEN.y + GARDEN.h + 1.4; }
function seedsOwned() { return Object.keys(CROPS).filter(k => S.inv['seed_' + k] > 0); }
function farmAction() {
  const F = farmState(), ps = F.plots;
  if (ps.some(plotRipe)) return { label: '수확하기', icon: '🧺', hot: true, fn: farmHarvest };
  if (ps.some(p => p && !p.dead && !plotWet(p))) return { label: '물 주기', icon: '🚿', hot: true, fn: farmWater };
  if (ps.some(p => !p) && seedsOwned().length) return { label: '씨앗 심기', icon: '🌱', fn: farmPlantMenu };
  return { label: '텃밭 보기', icon: '🌱', fn: farmMenu };
}
const _computeActionFarm = computeAction;
computeAction = function () {
  const a = _computeActionFarm();
  if (G.dev || !S || !nearGarden() || G.player.seat) return a;
  const f = farmAction();
  if (!a) return f;
  const rest = a.cands ? a.cands : [a];
  return Object.assign({}, f, { cands: [f, ...rest.filter(c => c.label !== f.label)].slice(0, 4) });
};
function farmMenu() {
  const F = farmState(), items = [];
  F.plots.forEach((p, i) => {
    const C = p && CROPS[p.crop];
    const note = !p ? '비어 있음' : p.dead ? '시들었어요' : plotRipe(p) ? '다 자랐어요!' : `${CROPS[p.crop].days - p.grow}일 남음 · ${plotWet(p) ? '물 줌' : '목말라요'}`;
    items.push({ icon: !p ? '🟫' : p.dead ? '🥀' : plotRipe(p) ? C.icon : '🌱', label: `${i + 1}번 밭${C ? ' · ' + C.name : ''}`, note, onClick: () => { if (!p) farmPlantMenu(i); else if (p.dead) { F.plots[i] = null; toast('시든 작물을 정리했어요'); save(); } else if (plotRipe(p)) farmHarvest(); else farmWater(); } });
  });
  items.push({ icon: '🛒', label: '씨앗 사러 가기', note: '마을 슈퍼', onClick: () => toast('🛒 마을 슈퍼 「씨앗 · 모종」에서 계절 씨앗을 팔아요') });
  openSheet({ title: '🌱 우리 텃밭', sub: `<div class="relneed">매일 물을 주면(비 오는 날은 저절로) 하루씩 자라요. 사흘 동안 물을 못 받으면 시들어요. 지금까지 수확 ${F.harvested}번</div>`, items, cols: 3 });
}
function farmPlantMenu(only) {
  const own = seedsOwned();
  if (!own.length) { toast('씨앗이 없어요. 마을 슈퍼 「씨앗 · 모종」에서 사 와요'); return; }
  openSheet({ title: '🌱 무엇을 심을까요?', sub: '<div class="relneed">고른 씨앗을 빈 밭에 차례로 심어요 (가진 만큼).</div>', cols: 3, items: own.map(k => { const C = CROPS[k], off = !C.se.includes(season()); return { icon: C.icon, label: C.name, note: `${S.inv['seed_' + k]}개 · ${C.days}일${off ? ' · 제철 아님' : ''}`, onClick: () => farmPlant(k, only) }; }) });
}
function farmPlant(k, only) {
  const F = farmState(), C = CROPS[k];
  runEvent(async () => {
    const P = G.player, d = G.det, withDet = S.comp && d.visible && d.map === 'island' && dist(d, P) < 4;
    let n = 0;
    F.plots.forEach((p, i) => { if (p || !(S.inv['seed_' + k] > 0) || (only != null && i !== only)) return; S.inv['seed_' + k]--; F.plots[i] = { crop: k, grow: 0, wet: -1, dry: 0, day: S.day, off: !C.se.includes(season()) }; n++; });
    if (!n) return;
    P.faceTo(0, -1); burst(P, 'spark', 3); Sound.sfx('tap');
    await say('narr', '', `🌱 ${C.name} 씨앗을 ${n}칸에 심었다. 흙을 토닥토닥 덮어 줬다. (${C.days}일 뒤 수확)`);
    if (!C.se.includes(season())) await say('narr', '', '제철이 아니라 조금 걱정되지만… 정성으로 키워 보자.');
    if (withDet) { scriptDet(); d.lookAt(P); await say('det', 'smile', casualOn() ? pick([`${C.name}? 좋다. 다 자라면 나도 한 입만 줘.`, '흙 만지니까 기분 좋다. 순찰보다 이게 체질인가.']) : `${josa(C.name, '을', '를')} 심으셨네요. 다 자라면 저도 구경시켜 주세요.`); addAff(1); }
    advanceTime(10); save();
  });
}
function farmWater() {
  const F = farmState();
  runEvent(async () => {
    const P = G.player, d = G.det, withDet = S.comp && d.visible && d.map === 'island' && dist(d, P) < 4;
    const targets = F.plots.filter(p => p && !p.dead && !plotWet(p)); if (!targets.length) { await say('narr', '', '오늘은 이미 물을 흠뻑 줬다.'); return; }
    P.faceTo(0, -1); P.prop = 'wcan';
    for (let i = 0; i < 3; i++) { burst(P, 'spark', 2); Sound.sfx('splash'); await sleep(260); }
    for (const p of targets) p.wet = S.day;
    P.prop = null;
    await say('narr', '', `🚿 물뿌리개로 ${targets.length}칸에 물을 줬다. 흙 냄새가 올라온다.`);
    if (withDet) {
      scriptDet(); d.lookAt(P); const st = S.rel.stage, c = casualOn();
      if (st >= 5 && Math.random() < 0.5) { await say('det', 'tease', '나도 줘 봐. …어, 어! 신발에 다 쏟았다. 하하, 너도 좀 맞았지?'); burst(d, 'heart', 3); }
      else await say('det', 'smile', c ? pick(['쑥쑥 자라라. …식물한테 말 걸면 잘 자란대서.', '물 주는 모습 보니까 여기 진짜 네 집 같다.']) : '쑥쑥 자라겠네요. 정성이 보여요.');
      if (!S.rel.daily.farmTogether) { S.rel.daily.farmTogether = true; addAff(2); }
    }
    advanceTime(10); save();
  });
}
function farmHarvest() {
  const F = farmState();
  runEvent(async () => {
    const P = G.player, d = G.det, withDet = S.comp && d.visible && d.map === 'island' && dist(d, P) < 4;
    const got = {};
    F.plots.forEach((p, i) => { if (!plotRipe(p)) return; const n = CROPS[p.crop].big ? 1 : (p.off ? 1 : 2) + (Math.random() < 0.35 ? 1 : 0); got[p.crop] = (got[p.crop] || 0) + n; S.inv['c_' + p.crop] = (S.inv['c_' + p.crop] || 0) + n; F.plots[i] = null; });
    const list = Object.entries(got); if (!list.length) return;
    F.harvested++; P.faceTo(0, -1); burst(P, 'spark', 6); Sound.sfx('coin');
    await say('narr', '', `🧺 수확! ${list.map(([k, n]) => `${CROPS[k].name} ${n}개`).join(', ')}를 거뒀다.`);
    if (withDet) {
      scriptDet(); d.lookAt(P); burst(d, 'heart', 4);
      const k = list[0][0];
      await say('det', 'laugh', casualOn() ? `와, 진짜 ${CROPS[k].name}다! 네가 키운 거 맞지? …대단하다, 진짜로.` : `와, 직접 키우신 ${CROPS[k].name}이네요. 대단해요.`);
      if (S.rel.stage >= 5) { const c = await choose([`이거 ${himCall()} 몫이야`, '같이 요리해 먹자']); if (c === 0) { S.inv['c_' + k]--; await say('det', 'blush', '…나 주는 거야? 이건 아까워서 못 먹겠다. 그래도 먹을 거지만.'); addAff(4); } else { await say('det', 'smile', '좋아. 오늘 저녁은 우리 텃밭 요리다.'); addAff(2); } }
    }
    if (!F.first) { F.first = { day: S.day, crop: list[0][0] }; memPerm('firstHarvest', { name: '첫 수확' }); await addAlbum('텃밭 첫 수확', 'daily'); toast('🏅 첫 수확! 수확한 작물은 슈퍼에서 팔거나 선물할 수 있어요'); }
    memRecent('farm', `텃밭에서 ${josa(list.map(([k]) => CROPS[k].name).join('·'), '을', '를')} 수확했다`);
    advanceTime(15); save();
  });
}

/* ---------------- 슈퍼: 씨앗 · 모종 ---------------- */
function seedShop() {
  const se = season();
  const items = Object.entries(CROPS).filter(([, C]) => C.se.includes(se)).map(([k, C]) => ({ icon: C.icon, label: `${C.name} 씨앗`, note: `${fmtMoney(C.seed)} · ${C.days}일 · 보유 ${S.inv['seed_' + k] || 0}`, keep: true, onClick: () => { if (S.money < C.seed) { toast('돈이 부족해요'); return; } S.money -= C.seed; S.inv['seed_' + k] = (S.inv['seed_' + k] || 0) + 1; Sound.sfx('coin'); toast(`🌱 ${C.name} 씨앗을 샀어요`); updateHUD(); save(); seedShop(); } }));
  items.push({ icon: '↩️', label: '슈퍼로', onClick: () => shopMenu() });
  openSheet({ title: '🌱 씨앗 · 모종', sub: `<div class="relneed">보유 ${fmtMoney(S.money)} · 지금 계절(${({ spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' })[se]}) 씨앗만 팔아요. 집 뒤 텃밭에 심어요.</div>`, items, cols: 3 });
}
const _shopMenuFarm = shopMenu;
shopMenu = function () {
  _shopMenuFarm();
  const body = $('#sheetBody'); if (!body) return;
  const b = document.createElement('button'); b.className = 'sitem'; b.innerHTML = `<span class="si-icon">🌱</span><span class="si-label">씨앗 · 모종</span><span class="si-note">텃밭용</span>`;
  b.onclick = () => { Sound.sfx('tap'); closeSheet(); seedShop(); };
  body.insertBefore(b, body.firstChild);
};
/* 씨앗은 선물 목록에 안 보이게 */
const _giftMenuFarm = giftMenu;
giftMenu = function () {
  const hid = {}; for (const k of Object.keys(S.inv)) if (k.startsWith('seed_') && S.inv[k] > 0) { hid[k] = S.inv[k]; S.inv[k] = 0; }
  try { _giftMenuFarm(); } finally { Object.assign(S.inv, hid); }
};
/* 아이템 그림: 도트 그림이 없는 건 컬러 이모지로 */
const _emoImg = new Map();
function emojiImgURL(e) {
  if (_emoImg.has(e)) return _emoImg.get(e);
  const c = mkCanvas(48, 48), g = c.getContext('2d'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '38px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
  g.fillText(typeof fixEmoji === 'function' ? fixEmoji(e) : e, 24, 26);
  const u = c.toDataURL(); _emoImg.set(e, u); return u;
}
const _itemIconFarm = itemIcon;
itemIcon = function (k) { if (ITEMS[k] && !k.startsWith('f_')) return emojiImgURL(ITEMS[k].icon); return _itemIconFarm(k); };
const PX_EMO = { bag: '🛍️', album: '📔', film: '🎞️', q: '❓' };
const _pxIconFarm = pxIcon;
pxIcon = function (k) { if (PX_EMO[k]) return emojiImgURL(PX_EMO[k]); if (ITEMS[k] && !k.startsWith('f_') && !k.startsWith('fish?')) return emojiImgURL(ITEMS[k].icon); return _pxIconFarm(k); };

/* ---------------- 저장 · 루프 ---------------- */
const _ensureV4Farm = ensureV4;
ensureV4 = function (s) { _ensureV4Farm(s); if (!s.farm) s.farm = { plots: [], day: s.day || 1, harvested: 0, first: null }; return s; };
let _farmT = 0;
const _loopFarm = loop;
loop = function (ts) { if (G.started && S && !G.dev) { _farmT += 1 / 60; if (_farmT > 2) { _farmT = 0; farmTick(); } } _loopFarm(ts); };
const _startGameFarm = startGame;
startGame = function (state, isNew) { _startGameFarm(state, isNew); farmState(); if (S.farm.day > S.day) S.farm.day = S.day; farmAdvance(); };
/* 장소 이름 */
PLACE_DEFS.garden = { name: '우리 텃밭' };
const _placeAtFarm = placeAt;
placeAt = function (x, y, m = M) { if (m && m.id === 'island' && x >= GARDEN.x - 0.5 && x < GARDEN.x + GARDEN.w + 0.5 && y >= GARDEN.y - 0.5 && y < GARDEN.y + GARDEN.h + 1.3) return 'garden'; return _placeAtFarm(x, y, m); };
