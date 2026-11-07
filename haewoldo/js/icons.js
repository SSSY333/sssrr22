'use strict';
/* =========================================================
 *  해월도 — 픽셀 아이콘 (이모지 대신 코드로 그린 16×16 도트)
 *  아이템 · 물고기 · 조개 · 옷 · 머리 · 색 · 축제 장식 · 주민 얼굴
 * ========================================================= */
const _pxCache = new Map();
function pxCanvas(draw, w = 16, h = 16, outline = '#3a2a26') {
  const c = mkCanvas(w, h), g = c.getContext('2d');
  const P = (x, y, ww = 1, hh = 1, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
  draw(P, g);
  if (outline) autoOutline(c, outline);
  return c;
}
function toURL(c, scale = 3) { const o = mkCanvas(c.width * scale, c.height * scale), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height); return o.toDataURL(); }
const E_ = (g, cx, cy, rx, ry, col) => fillEllipse(g, cx, cy, rx, ry, col);
/* 아이템 그림 */
const PX_ITEMS = {
  coffee: (P) => { P(5, 3, 6, 11, '#c0392b'); P(5, 3, 6, 1, '#d9d6dd'); P(5, 13, 6, 1, '#d9d6dd'); P(6, 6, 4, 4, '#f4efe6'); P(7, 7, 2, 2, '#7a4a2a'); P(6, 3, 1, 10, '#e05a4c'); },
  tangerine: (P, g) => { E_(g, 8, 9, 5, 5, '#f39a2b'); E_(g, 7, 8, 2, 2, '#f7b65a'); P(8, 3, 1, 2, '#6a4a30'); P(9, 3, 3, 2, '#4f9e4a'); },
  lunchbox: (P) => { P(2, 5, 12, 8, '#e3615a'); P(3, 6, 10, 6, '#fff8ee'); P(4, 7, 3, 3, '#ffffff'); P(8, 7, 2, 2, '#f2d06a'); P(10, 7, 2, 2, '#5aa850'); P(8, 10, 4, 1, '#e3615a'); P(2, 5, 12, 1, '#c94a44'); },
  hanky: (P) => { P(3, 3, 10, 10, '#8fc3ea'); for (let i = 0; i < 5; i++) P(3 + i * 2, 3, 1, 10, '#b9dcf5'); P(3, 7, 10, 1, '#ffffff'); P(11, 11, 2, 2, '#f19ab5'); },
  flower: (P, g) => { P(7, 9, 2, 6, '#4f8a3a'); P(5, 12, 6, 3, '#f4efe6'); for (const [x, y, c] of [[5, 5, '#8fc3ea'], [10, 5, '#c08ad8'], [8, 3, '#b9a6e8'], [6, 8, '#a9c3f2'], [10, 8, '#8fc3ea']]) E_(g, x, y, 2, 2, c); },
  snack: (P, g) => { P(4, 7, 8, 2, '#f4efe6'); E_(g, 4, 6, 2, 2, '#f4efe6'); E_(g, 4, 10, 2, 2, '#f4efe6'); E_(g, 12, 6, 2, 2, '#f4efe6'); E_(g, 12, 10, 2, 2, '#f4efe6'); },
  hotpack: (P) => { P(4, 3, 8, 10, '#f7f2ea'); P(5, 5, 6, 6, '#f39a2b'); P(6, 6, 4, 4, '#ffd77a'); P(7, 7, 2, 2, '#e3484a'); },
  watermelon: (P, g) => { for (let y = 0; y < 7; y++) { const w = 13 - y * 2; if (w > 0) { P(8 - Math.floor(w / 2), 5 + y, w, 1, y === 0 ? '#e3484a' : '#ef5a5a'); } } P(2, 4, 12, 1, '#4f9e4a'); P(3, 5, 10, 1, '#c9f0a0'); P(6, 7, 1, 1, '#2b2026'); P(9, 7, 1, 1, '#2b2026'); P(8, 9, 1, 1, '#2b2026'); },
  songpyeon: (P, g) => { E_(g, 5, 9, 3, 2, '#f4efe6'); E_(g, 11, 9, 3, 2, '#f7b9c9'); E_(g, 8, 6, 3, 2, '#b9e0a0'); },
  chocolate: (P) => { P(3, 4, 10, 8, '#6a4230'); for (let x = 3; x < 13; x += 3) P(x, 4, 1, 8, '#4a2e20'); P(3, 8, 10, 1, '#4a2e20'); P(9, 3, 4, 3, '#f19ab5'); P(10, 4, 2, 1, '#ffffff'); },
  candy: (P, g) => { P(3, 8, 10, 6, '#c99a64'); for (let x = 3; x < 13; x += 2) P(x, 9, 1, 5, '#a87a4a'); E_(g, 5, 7, 2, 2, '#f19ab5'); E_(g, 8, 6, 2, 2, '#8fc3ea'); E_(g, 11, 7, 2, 2, '#f2d06a'); P(3, 4, 1, 4, '#a87a4a'); P(12, 4, 1, 4, '#a87a4a'); P(3, 3, 10, 1, '#a87a4a'); },
  porridge: (P, g) => { P(2, 8, 12, 2, '#f4efe6'); E_(g, 8, 10, 6, 3, '#e3615a'); E_(g, 8, 8, 5, 2, '#f2e2b0'); P(6, 7, 1, 1, '#4f9e4a'); P(9, 8, 1, 1, '#4f9e4a'); P(6, 3, 1, 3, '#ffffff'); P(10, 2, 1, 3, '#ffffff'); },
  ring: (P, g) => { E_(g, 8, 10, 4, 4, '#d9d6dd'); E_(g, 8, 10, 2, 2, 'rgba(0,0,0,0)'); g.clearRect(6, 9, 4, 3); P(6, 3, 4, 3, '#cfe8f7'); P(7, 4, 1, 1, '#ffffff'); P(7, 6, 2, 1, '#d9d6dd'); },
  abalone: (P, g) => { E_(g, 8, 9, 6, 4, '#8a7a6a'); E_(g, 8, 9, 4, 3, '#b9e0d8'); E_(g, 7, 8, 2, 1, '#f7c9e8'); for (let i = 0; i < 4; i++) P(4 + i * 2, 6, 1, 1, '#5a4a3a'); },
  clam: (P, g) => { E_(g, 8, 9, 5, 4, '#d9c4a0'); for (let i = 0; i < 4; i++) P(5 + i * 2, 6, 1, 6, '#b9a07a'); P(4, 12, 8, 1, '#8a7050'); },
  conch: (P, g) => { E_(g, 9, 9, 5, 4, '#f7b9c9'); E_(g, 6, 8, 3, 3, '#f4d4dc'); P(12, 6, 2, 2, '#e88aa4'); P(5, 9, 4, 1, '#e88aa4'); P(3, 11, 3, 2, '#f7b9c9'); },
  bomal: (P, g) => { E_(g, 8, 9, 4, 4, '#3a3a48'); E_(g, 8, 9, 2, 2, '#5b5f69'); P(8, 9, 1, 1, '#9aa3b0'); },
  urchin: (P, g) => { for (let a = 0; a < 12; a++) { const x = 8 + Math.round(Math.cos(a / 12 * 6.28) * 6), y = 9 + Math.round(Math.sin(a / 12 * 6.28) * 5); P(x, y, 1, 1, '#3a2a48'); } E_(g, 8, 9, 4, 4, '#5a3a6a'); P(7, 7, 2, 1, '#8a6a9a'); },
  shell: (P, g) => { for (let i = 0; i < 5; i++) P(4 + i * 2, 5 + Math.abs(2 - i), 2, 8 - Math.abs(2 - i), i % 2 ? '#fbd3df' : '#f7b9c9'); P(6, 12, 4, 2, '#e88aa4'); },
  pebble: (P, g) => { E_(g, 8, 10, 5, 3, '#9aa3b0'); E_(g, 7, 9, 3, 1, '#c3c9d1'); },
  pearl: (P, g) => { E_(g, 8, 10, 6, 3, '#8a7a6a'); E_(g, 8, 8, 3, 3, '#f4f1f8'); P(7, 7, 1, 1, '#ffffff'); },
  seaweed: (P) => { for (const [x, c] of [[5, '#4f8a3a'], [8, '#3f7a30'], [11, '#5a9a40']]) for (let y = 3; y < 14; y++) P(x + (y % 4 < 2 ? 0 : 1), y, 2, 1, c); },
  boot: (P) => { P(5, 2, 5, 9, '#5a4a3a'); P(5, 10, 9, 4, '#5a4a3a'); P(6, 3, 3, 1, '#7a6a5a'); P(5, 13, 9, 1, '#3a2a20'); P(11, 11, 2, 1, '#9fd6f2'); },
  songpyeon2: null,
};
/* 물고기: 몸 색 · 무늬 · 지느러미 */
const FISH_LOOK = {
  jack: ['#9fb8c9', '#c9d8e2', 'stripe'], mackerel: ['#3f6fb5', '#d9e3ec', 'wave'], halfbeak: ['#a9c3d6', '#eef3f7', 'beak'], rockfish: ['#8a5a3a', '#c99a64', 'spot'],
  opaleye: ['#3a4a5a', '#5b6b7a', ''], blackbream: ['#5b5f69', '#9aa3b0', 'stripe'], knifejaw: ['#e9e4da', '#2b2f3a', 'bands'], filefish: ['#c9b48a', '#e9d9b0', 'tall'],
  rockcod: ['#5a4a3a', '#8a7a5a', 'spot'], redbream: ['#e3615a', '#f7b9c9', 'spot'], amberjack: ['#5a7a9a', '#f2d06a', 'line'], hairtail: ['#d9e3ec', '#ffffff', 'long'],
};
function drawFish(P, g, k, silhouette) {
  const S2 = silhouette ? '#4a4050' : null;
  if (k === 'squid' || k === 'cuttle') { const b = S2 || (k === 'squid' ? '#f4d4dc' : '#e9c9a0'); P(5, 2, 6, 8, b); P(4, 3, 1, 5, b); P(11, 3, 1, 5, b); for (let i = 0; i < 4; i++) P(5 + i * 2, 10, 1, 4, b); if (!S2) { P(6, 7, 1, 1, '#2b2026'); P(9, 7, 1, 1, '#2b2026'); if (k === 'cuttle') for (let i = 0; i < 3; i++) P(6 + i * 2, 4, 1, 1, '#a87a4a'); } return; }
  if (k === 'octopus') { const b = S2 || '#d9583f'; E_(g, 8, 6, 4, 4, b); for (let i = 0; i < 5; i++) P(4 + i * 2, 9, 1, 5, b); if (!S2) { P(6, 6, 1, 1, '#ffffff'); P(9, 6, 1, 1, '#ffffff'); } return; }
  const [body, belly, pat] = FISH_LOOK[k] || ['#7fa3e6', '#cfe6f7', ''];
  const b = S2 || body, be = S2 || belly;
  const long = pat === 'long', tall = pat === 'tall';
  if (long) { P(1, 7, 13, 3, b); P(1, 9, 13, 1, be); P(14, 7, 1, 2, b); P(12, 7, 1, 1, S2 || '#2b2026'); return; }
  E_(g, 7, 8, 5, tall ? 5 : 3, b); E_(g, 7, 9, 4, tall ? 3 : 1, be);
  P(12, 5, 1, 7, b); P(13, 4, 1, 3, b); P(13, 9, 1, 3, b); P(14, 3, 1, 2, b); P(14, 10, 1, 2, b);
  P(6, tall ? 3 : 5, 3, 1, b);
  if (pat === 'beak') P(0, 8, 2, 1, b);
  if (S2) return;
  P(3, 7, 1, 1, '#2b2026'); P(3, 6, 1, 1, '#ffffff');
  if (pat === 'stripe') P(4, 8, 7, 1, shade(body, 0.8));
  if (pat === 'wave') for (let x = 5; x < 11; x += 2) P(x, 6 + (x % 4 ? 0 : 1), 1, 1, '#2b3a5a');
  if (pat === 'spot') for (const [x, y] of [[6, 7], [8, 6], [9, 8]]) P(x, y, 1, 1, shade(body, 0.7));
  if (pat === 'bands') for (const x of [5, 8, 10]) P(x, 5, 1, 7, belly);
  if (pat === 'line') P(3, 8, 9, 1, belly);
}
function pxIcon(key) {
  if (_pxCache.has(key)) return _pxCache.get(key);
  let url;
  if (key.startsWith('f_') || key.startsWith('fish?')) { const k = key.replace(/^f_|^fish\?/, ''), sil = key.startsWith('fish?'); url = toURL(pxCanvas((P, g) => drawFish(P, g, k, sil), 16, 16, sil ? '#2a2430' : '#2a3040')); }
  else if (PX_ITEMS[key]) url = toURL(pxCanvas((P, g) => PX_ITEMS[key](P, g)));
  else if (key.startsWith('sw:')) { const col = key.slice(3); url = toURL(pxCanvas((P) => { P(2, 2, 12, 12, col); P(3, 3, 5, 2, 'rgba(255,255,255,0.45)'); P(2, 13, 12, 1, shade(col, 0.75)); })); }
  else if (key === 'album') url = toURL(pxCanvas((P) => { P(2, 2, 12, 12, '#f19ab5'); P(3, 3, 10, 10, '#fbd3df'); P(5, 5, 6, 5, '#ffffff'); P(6, 6, 4, 3, '#8fc3ea'); P(2, 2, 1, 12, '#c96a86'); }));
  else if (key === 'film') url = toURL(pxCanvas((P) => { P(4, 1, 8, 14, '#2b2f3a'); for (let i = 0; i < 4; i++) P(5, 2 + i * 3, 6, 2, '#fbd3df'); }));
  else if (key === 'bag') url = toURL(pxCanvas((P) => { P(3, 5, 10, 9, '#c99a64'); P(5, 3, 6, 3, '#a87a4a'); P(6, 4, 4, 1, '#c99a64'); P(3, 8, 10, 1, '#a87a4a'); P(7, 8, 2, 2, '#f2d06a'); }));
  else if (key === 'q') url = toURL(pxCanvas((P) => { P(5, 3, 6, 2, '#9aa3b0'); P(10, 5, 2, 3, '#9aa3b0'); P(7, 8, 3, 2, '#9aa3b0'); P(7, 12, 2, 2, '#9aa3b0'); }));
  else url = toURL(pxCanvas((P) => { P(4, 4, 8, 8, '#d9d6dd'); }));
  _pxCache.set(key, url); return url;
}
function itemIcon(k) { if (!ITEMS[k]) return pxIcon('q'); if (k.startsWith('f_')) return pxIcon(k); return pxIcon(PX_ITEMS[k] ? k : 'q'); }
/* 스프라이트 · 가구 · 캐릭터를 아이콘으로 */
function spriteIcon(sp, scale = 2) { const c = sp.c || sp; return toURL(c, scale); }
function chibiIcon(look, outfit, cacheId) { const key = 'chibi:' + cacheId; if (_pxCache.has(key)) return _pxCache.get(key); const c = chibi(Object.assign({}, look, { cacheId }), outfit, 'f', 0, 'stand', false); const u = toURL(c, 2); _pxCache.set(key, u); return u; }
function faceIcon(look, outfit, expr = 'smile', cacheId) { const key = 'face:' + cacheId + expr; if (_pxCache.has(key)) return _pxCache.get(key); const u = toURL(drawPortrait(look, outfit, expr), 2); _pxCache.set(key, u); return u; }
function playerPreview(style) { const st = Object.assign({}, S.style, style); return chibiIcon(playerLookV2(S.job, S.hair, st), 'base', 'pv' + styleKey(st) + S.job); }
const imgTag = (u, cls = 'si-img') => `<img class="${cls}" src="${u}" alt="">`;

/* ---------------- 메뉴에 픽셀 그림 넣기 ---------------- */
shopMenu = function () {
  const se = season();
  const items = SHOP.filter(k => !SHOP_SEASON[k] || SHOP_SEASON[k] === se).map(k => { const it = ITEMS[k]; return { icon: imgTag(itemIcon(k)), label: it.name, note: fmtMoney(it.price), keep: true, onClick: () => { if (S.money < it.price) { toast('돈이 부족해요'); return; } S.money -= it.price; S.inv[k] = (S.inv[k] || 0) + 1; Sound.sfx('coin'); toast(`${it.name} 구입 (보유 ${S.inv[k]})`); updateHUD(); save(); } }; });
  items.push({ icon: imgTag(pxIcon('bag')), label: '팔기', note: '해산물 · 물고기', onClick: sellMenu });
  items.push({ icon: imgTag(furnPreview('sofa', 0, 1)), label: '가구점 카탈로그', onClick: () => furnShopMenu() });
  openSheet({ title: '마을 슈퍼', sub: `<div class="relneed">보유 ${fmtMoney(S.money)} · 계절 한정: ${se === 'summer' ? '수박' : se === 'winter' ? '핫팩' : '없음'}</div>`, items, cols: 4 });
};
sellMenu = function () {
  const items = Object.entries(S.inv).filter(([k, n]) => n > 0 && ITEMS[k] && ITEMS[k].sell > 0 && !SHOP.includes(k)).map(([k, n]) => ({ icon: imgTag(itemIcon(k)), label: ITEMS[k].name, note: `${fmtMoney(ITEMS[k].sell)} · ${n}개`, keep: true, onClick: () => { if (!(S.inv[k] > 0)) return; S.inv[k]--; S.money += ITEMS[k].sell; Sound.sfx('coin'); toast(`${ITEMS[k].name}을(를) 팔았다 +${fmtMoney(ITEMS[k].sell)}`); updateHUD(); save(); sellMenu(); } }));
  openSheet({ title: '팔기', sub: `<div class="relneed">보유 ${fmtMoney(S.money)}</div>`, items: items.length ? items : [{ icon: imgTag(pxIcon('bag')), label: '팔 물건이 없어요', disabled: true, wide: true }], cols: 4 });
};
invMenu = function () {
  const items = Object.entries(S.inv).filter(([k, n]) => n > 0 && ITEMS[k]).map(([k, n]) => ({ icon: imgTag(itemIcon(k)), label: ITEMS[k].name, note: `${n}개${k === 'tangerine' ? ' · 누르면 먹기' : ''}`, keep: k === 'tangerine', onClick: k === 'tangerine' ? () => { S.inv.tangerine--; toast('귤을 까먹었다. 새콤달콤!'); closeSheet(); invMenu(); } : null }));
  const nf = S.furn ? S.furn.store.length : 0;
  openSheet({ title: '소지품', sub: `<div class="relneed">${S.rel.favor ? `📝 부탁: ${ITEMS[FAVORS[S.rel.favor.i].item].name} 전해 주기<br>` : ''}${nf ? `가구 보관함 ${nf}개 (집 「꾸미기」에서 놓아요)` : ''}</div>`, items: items.length ? items : [{ icon: imgTag(pxIcon('bag')), label: '비어 있어요', disabled: true, wide: true }], cols: 4 });
};
dexMenu = function () {
  const items = Object.entries(FISH).map(([k, f]) => ({ icon: imgTag(pxIcon(S.dex[k] ? 'f_' + k : 'fish?' + k)), label: S.dex[k] ? f.name : '???', note: S.dex[k] ? `최고 ${S.dex[k]}cm` : Object.entries(FISH_SPOTS).filter(([, sp]) => Object.values(sp.table).flat().includes(k)).map(([, sp]) => sp.name).join('·'), disabled: !S.dex[k] }));
  openSheet({ title: `물고기 도감 ${Object.keys(S.dex).length}/${Object.keys(FISH).length}`, sub: '<div class="relneed">부두 · 갯바위 · 무인도마다, 계절마다 잡히는 물고기가 달라요. 아직 못 잡은 물고기는 그림자로 보여요.</div>', items, cols: 5 });
};
giftMenu = function () {
  const d = G.det; d.talking = true;
  const items = Object.entries(S.inv).filter(([k, n]) => n > 0 && ITEMS[k] && k !== 'ring' && k !== 'snack').map(([k, n]) => {
    const it = ITEMS[k], lock = it.minStage && S.rel.stage < it.minStage;
    return { icon: imgTag(itemIcon(k)), label: it.name, note: lock ? '아직 이른 선물' : `${n}개${LIKES.includes(k) ? ' · 좋아함' : ''}`, disabled: lock, why: '조금 더 가까워진 뒤에 주면 좋을 것 같아요', onClick: () => runEvent(() => giveGift(k)) };
  });
  if (!items.length) { toast('줄 수 있는 물건이 없어요. 마을 슈퍼에 가 보세요'); d.talking = false; return; }
  openSheet({ title: '선물하기', sub: '<div class="relneed">형사님 취향: 따뜻한 캔커피 · 도시락 · 직접 딴 해산물 · 전복죽 · 하루 한 번</div>', items, cols: 4, onClose: () => { if (!G.busy) d.talking = false; } });
};
colorMenu = function (title, colors, done, preview) {
  const items = colors.map(([name, col]) => ({ icon: imgTag(preview ? preview(col) : pxIcon('sw:' + col)), label: name, onClick: () => done(col, name) }));
  openSheet({ title, items, cols: 4 });
};
clothesMenu = function () {
  const items = Object.entries(CLOTHES).map(([k, C]) => ({ icon: imgTag(playerPreview({ clothes: k, cc: k === 'job' ? null : (S.style.clothes === k && S.style.cc) || '#f19ab5' }), 'si-img chibi'), label: C.name, note: k === 'job' ? '무료 · 원래 옷' : (S.style.clothes === k ? '입는 중 · ' : '') + fmtMoney(C.price), onClick: () => {
    if (k === 'job') { applyStyle(Object.assign({}, S.style, { clothes: 'job', cc: null })); toast('직업복으로 갈아입었어요'); styleReaction(); return; }
    colorMenu('색을 골라요 — ' + C.name, CLOTH_COLORS, (col, name) => {
      if (S.money < C.price) { toast('돈이 부족해요'); return; }
      S.money -= C.price; Sound.sfx('coin'); applyStyle(Object.assign({}, S.style, { clothes: k, cc: col })); updateHUD();
      toast(`${name} ${C.name}(으)로 갈아입었어요`); styleReaction();
    }, (col) => playerPreview({ clothes: k, cc: col }));
  } }));
  openSheet({ title: '해월 옷가게', sub: `<div class="relneed">보유 ${fmtMoney(S.money)} · 옷을 고르면 색을 정할 수 있어요</div>`, items, cols: 4 });
};
salonMenu = function () {
  const items = Object.entries(HAIR_STYLES).map(([k, name]) => ({ icon: imgTag(playerPreview({ hair: k }), 'si-img chibi'), label: name, note: (S.style.hair === k ? '지금 머리 · ' : '') + fmtMoney(STYLE_PRICE.hair), onClick: () => {
    if (S.money < STYLE_PRICE.hair) { toast('돈이 부족해요'); return; }
    S.money -= STYLE_PRICE.hair; Sound.sfx('coin'); applyStyle(Object.assign({}, S.style, { hair: k })); updateHUD(); toast(`${name}(으)로 바꿨어요`); styleReaction();
  } }));
  items.push({ icon: imgTag(pxIcon('sw:' + S.style.hairC)), label: '머리 색 바꾸기', note: fmtMoney(STYLE_PRICE.color), onClick: () => colorMenu('머리 색 고르기', HAIR_COLORS, (col, name) => {
    if (S.money < STYLE_PRICE.color) { toast('돈이 부족해요'); return; }
    S.money -= STYLE_PRICE.color; Sound.sfx('coin'); applyStyle(Object.assign({}, S.style, { hairC: col })); updateHUD(); toast(`${name}(으)로 염색했어요`); styleReaction();
  }, (col) => playerPreview({ hairC: col })) });
  openSheet({ title: '미용실 해바라기', sub: `<div class="relneed">보유 ${fmtMoney(S.money)} · 머리 모양 ${fmtMoney(STYLE_PRICE.hair)} · 염색 ${fmtMoney(STYLE_PRICE.color)}</div>`, items, cols: 4 });
};
/* 커플 의상 가게 · 행상인 · 가구 상인: 실제 캐릭터 미리보기 */
function outfitIcon(k) { return playerPreview({ clothes: 'w_' + k }); }
outfitShopMenu = function () {
  const goods = OUTFIT_SHOP.map(k => ({ name: OUTFITS[k].name, price: OUTFITS[k].price, img: outfitIcon(k), owned: S.ward.p[k], desc: `${OUTFITS[k].cat} · 나와 형사님 옷장에 함께 들어가요`, buy: () => giveOutfit(k) }));
  shopPanel('해월 옷가게 — 커플 · 계절 의상', '산 옷은 옷장에서 갈아입어요', goods);
};
function frameIcon(k) { const f = FRAMES[k]; return toURL(pxCanvas((P) => { P(3, 1, 10, 14, f[1]); P(4, 2, 8, 5, f[2]); P(4, 8, 8, 5, f[2]); P(5, 3, 6, 3, f[1]); P(5, 9, 6, 3, f[1]); })); }
peddlerShop = function () {
  const goods = [
    { name: '커플 티셔츠 세트', price: 14000, img: outfitIcon('coupleTee'), desc: '나와 형사님이 함께 입는 커플 티. 옷장에 들어가요.', owned: S.ward.p.coupleTee, buy: () => giveOutfit('coupleTee') },
    { name: '바다 프레임', price: 3000, img: frameIcon('sea'), desc: '네컷사진 「바다」 프레임', owned: S.frames.includes('sea'), buy: () => { if (!S.frames.includes('sea')) S.frames.push('sea'); } },
    { name: '작은 진주', price: 6000, img: itemIcon('pearl'), desc: '선물용. 형사님이 좋아할지도?', buy: () => { S.inv.pearl = (S.inv.pearl || 0) + 1; } },
    { name: '여름 휴양복', price: 12000, img: outfitIcon('resort'), desc: '휴양지 느낌 셔츠 (두 사람 모두)', owned: S.ward.p.resort, buy: () => giveOutfit('resort') },
  ];
  shopPanel('행상인의 보따리', '오늘 배로 들어온 행상인', goods);
};
/* 축제 장식 · 역할: 게임 안 스프라이트와 주민 얼굴 */
const DECOR_SPR = { '🌼': () => sprFlowerbed(), '📸': () => sprBooth(), 'ℹ️': () => sprSignpost(), '🪴': () => sprPot(), '🎈': () => sprLantern(), '🏮': () => sprLantern(), '🍢': () => sprStall(), '🚧': () => sprLowFence(), '🧺': () => furnSprite('rug', 0), '🚩': () => sprBoard(), '⚪': () => sprCrosswalk(), '📣': () => furnSprite('sofa2', 0), '🎁': () => furnSprite('chest', 0), '🚰': () => sprTankOut(), '🍊': () => furnSprite('orangeCrate', 0), '📦': () => sprCrates(), '🥄': () => furnSprite('tableR', 0), '⛄': () => sprSnowman() };
function decorIcon(em) { const key = 'dec:' + em; if (_pxCache.has(key)) return _pxCache.get(key); const f = DECOR_SPR[em]; const u = f ? spriteIcon(f(), 1.5) : pxIcon('q'); _pxCache.set(key, u); return u; }
/* 새 게임 화면: 직업 · 머리 버튼에도 캐릭터 도트 */
const _buildNewGameUI0 = buildNewGameUI;
buildNewGameUI = function () {
  _buildNewGameUI0();
  const jobs = Object.keys(JOBS);
  document.querySelectorAll('#jobList .job').forEach((b, i) => { const sp = b.querySelector('span'); if (sp) sp.innerHTML = imgTag(chibiIcon(playerLookV2(jobs[i], 'ponytail'), 'base', 'ng-' + jobs[i]), ''); });
  const hairs = Object.keys(PLAYER_HAIRS);
  document.querySelectorAll('#hairList .hair').forEach((b, i) => { const k = hairs[i]; if (!k) return; b.innerHTML = imgTag(chibiIcon(playerLookV2('traveler', k), 'base', 'ngh-' + k), '') + `<span>${b.textContent}</span>`; });
};
let _bmW = 0; window.addEventListener('resize', () => { const w = $('#game') ? Math.round($('#game').getBoundingClientRect().width) : 0; if (w === _bmW) return; _bmW = w; if ($('#mapView') && !$('#mapView').classList.contains('hidden')) drawBigMap(); });
