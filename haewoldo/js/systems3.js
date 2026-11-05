'use strict';
/* =========================================================
 *  해월도 v6 — 커플 의상 · 네컷사진 · 추억 앨범 · 가구점 · 집 확장 · 꾸미기 · 공동생활
 * ========================================================= */

/* ---------------- 커플 의상 (얼굴 · 체형은 그대로, 옷 레이어만) ---------------- */
const OUTFITS = {
  daily: { name: '일상복', icon: '👕', cat: '일상복', price: 9000, p: { coat: '#f6f4ee', coatS: '#dcd6c8', shirt: '#f6f4ee', pants: '#5a7aa8', jeans: true, shoes: '#f1efe9', closed: true, collar: '#f6f4ee', rolled: true }, d: { coat: '#eef0f4', coatS: '#d2d6de', shirt: '#eef0f4', pants: '#3f5a8a', jeans: true, shoes: '#f1efe9', closed: true, collar: '#eef0f4', rolled: true } },
  picnic: { name: '봄 소풍복', icon: '🧺', cat: '봄 소풍복', price: 14000, p: { coat: '#f7e7a0', coatS: '#e2cc78', shirt: '#ffffff', skirt: '#8fd6b8', long: true, pants: '#f7d4b5', shoes: '#ffffff', closed: true, collar: '#ffffff', hat: 'straw' }, d: { coat: '#d9efe4', coatS: '#b9d9c8', shirt: '#ffffff', pants: '#cbb792', shoes: '#8a5a3a', closed: false, rolled: true } },
  resort: { name: '여름 휴양복', icon: '🌺', cat: '여름 휴양복', price: 12000, p: { coat: '#8fc3ea', coatS: '#74a8d0', shirt: '#8fc3ea', stripe: '#ffffff', pants: '#f4efe6', shorts: true, shoes: '#f7d4b5', closed: true, collar: '#ffffff', rolled: true, hat: 'straw' }, d: { coat: '#8fc3ea', coatS: '#74a8d0', shirt: '#8fc3ea', stripe: '#ffffff', pants: '#f4efe6', shorts: true, shoes: '#8a5a3a', closed: true, collar: '#ffffff', rolled: true } },
  knitA: { name: '가을 니트', icon: '🧶', cat: '가을 니트', price: 16000, p: { coat: '#d9a05a', coatS: '#bf8846', shirt: '#d9a05a', knit: true, skirt: '#6b4a35', long: true, pants: '#f7d4b5', shoes: '#6a4934', closed: true, collar: '#ffffff' }, d: { coat: '#c98a4a', coatS: '#ad733a', shirt: '#c98a4a', knit: true, pants: '#4b4038', shoes: '#3b2e28', closed: true, collar: '#ffffff' } },
  winterCoat: { name: '겨울 외투', icon: '🧥', cat: '겨울 외투', price: 22000, p: { coat: '#a8404f', coatS: '#8a3040', shirt: '#f4efe6', pants: '#3a3a48', shoes: '#3b2e28', closed: true, collar: '#f4efe6', scarf: '#f4efe6' }, d: { coat: '#34436b', coatS: '#26335a', shirt: '#f4efe6', pants: '#23252e', shoes: '#2b2220', closed: true, collar: '#34436b', scarf: '#a8404f' } },
  festival: { name: '축제 의상', icon: '🏮', cat: '축제 의상', price: 0, p: { coat: '#f4efe6', coatS: '#ddd5c8', shirt: '#f4efe6', skirt: '#3f6fb5', long: true, accent: '#e3615a', pants: '#f7d4b5', shoes: '#7a5236', closed: true, collar: '#3f6fb5' }, d: { coat: '#2e3d66', coatS: '#212c4b', shirt: '#2e3d66', accent: '#f4efe6', pants: '#2e3d66', shoes: '#7a5236', closed: true, collar: '#f4efe6' } },
  pajama: { name: '잠옷', icon: '🌙', cat: '잠옷', price: 9000, p: { coat: '#fbd3df', coatS: '#e8b5c4', shirt: '#fbd3df', stripe: '#ffffff', pants: '#fbd3df', shoes: '#ffffff', closed: true, collar: '#ffffff' }, d: { coat: '#b9cde6', coatS: '#9fb4d0', shirt: '#b9cde6', stripe: '#ffffff', pants: '#b9cde6', shoes: '#ffffff', closed: true, collar: '#ffffff' } },
  raincoat: { name: '비옷', icon: '☔', cat: '비옷', price: 8000, p: { coat: '#f2d06a', coatS: '#d9b44f', shirt: '#f2d06a', hood: true, pants: '#5a7aa8', shoes: '#3f6fb5', closed: true, collar: '#f2d06a' }, d: { coat: '#f2d06a', coatS: '#d9b44f', shirt: '#f2d06a', hood: true, pants: '#23252e', shoes: '#3f6fb5', closed: true, collar: '#f2d06a' } },
  coupleTee: { name: '커플 티셔츠', icon: '💑', cat: '커플 티셔츠', price: 0, couple: true, p: { coat: '#ffffff', coatS: '#e0dcd4', shirt: '#ffffff', accent: '#ff6f91', pants: '#5a7aa8', jeans: true, shoes: '#f1efe9', closed: true, collar: '#ffffff', rolled: true }, d: { coat: '#ffffff', coatS: '#e0dcd4', shirt: '#ffffff', accent: '#ff6f91', pants: '#3f5a8a', jeans: true, shoes: '#f1efe9', closed: true, collar: '#ffffff', rolled: true } },
  coupleHood: { name: '커플 후드티', icon: '🧸', cat: '커플 후드티', price: 0, couple: true, p: { coat: '#f19ab5', coatS: '#d97f9a', shirt: '#f19ab5', hood: true, pants: '#f4efe6', shoes: '#f1efe9', closed: true, collar: '#f19ab5' }, d: { coat: '#8fc3ea', coatS: '#74a8d0', shirt: '#8fc3ea', hood: true, pants: '#3f5a8a', jeans: true, shoes: '#f1efe9', closed: true, collar: '#8fc3ea' } },
  formal: { name: '정장', icon: '🎩', cat: '정장', price: 30000, p: { coat: '#3a3a48', coatS: '#2a2a36', shirt: '#ffffff', pants: '#3a3a48', skirt: null, shoes: '#2b2220', collar: '#ffffff' }, d: { coat: '#23252e', coatS: '#17181f', shirt: '#ffffff', pants: '#23252e', shoes: '#17181f', bow: '#2b2b33' } },
  onepiece: { name: '원피스', icon: '👗', cat: '원피스', price: 16000, p: { coat: '#ffffff', coatS: '#e6e1d8', shirt: '#ffffff', skirt: '#ffffff', long: true, pants: '#f7d4b5', shoes: '#f7b9c9', closed: true, collar: '#f7b9c9', rolled: true }, d: { coat: '#f4f1ea', coatS: '#d9d3c6', shirt: '#ffffff', pants: '#cbb792', shoes: '#8a5a3a', closed: false } },
  sport: { name: '운동회 체육복', icon: '🏅', cat: '특별 이벤트 의상', price: 0, p: { coat: '#3f6fb5', coatS: '#2f5a9a', shirt: '#3f6fb5', stripe: '#ffffff', pants: '#3f6fb5', shoes: '#ffffff', closed: true, collar: '#ffffff' }, d: { coat: '#3f6fb5', coatS: '#2f5a9a', shirt: '#3f6fb5', stripe: '#ffffff', pants: '#3f6fb5', shoes: '#ffffff', closed: true, collar: '#ffffff' } },
  detective: { name: '탐정 콤비 코트', icon: '🕵️', cat: '특별 이벤트 의상', price: 0, p: { coat: '#b9945a', coatS: '#9a7a46', shirt: '#f4efe6', pants: '#4b4038', shoes: '#3b2e28', collar: '#f4efe6' }, d: { coat: '#a8844e', coatS: '#8a6a3a', shirt: '#f4efe6', pants: '#3b3b48', shoes: '#2b2220', collar: '#f4efe6' } },
  sailor: { name: '세일러 의상', icon: '⚓', cat: '특별 이벤트 의상', price: 0, p: { coat: '#ffffff', coatS: '#dfe3ea', shirt: '#ffffff', collar: '#2f5a9a', skirt: '#2f5a9a', pants: '#f7d4b5', shoes: '#2b2220', closed: true, bow: '#e3484a' }, d: { coat: '#ffffff', coatS: '#dfe3ea', shirt: '#ffffff', collar: '#2f5a9a', pants: '#2f5a9a', shoes: '#2b2220', closed: true } },
  weddingSet: { name: '결혼식 의상', icon: '💍', cat: '결혼식 의상', price: 0, p: 'wedding', d: 'suit' },
};
const OUTFIT_SHOP = ['daily', 'picnic', 'resort', 'knitA', 'winterCoat', 'pajama', 'raincoat', 'formal', 'onepiece'];
function setupOutfits() { for (const [k, O] of Object.entries(OUTFITS)) if (typeof O.d === 'object') LOOKS.det.outfits['w_' + k] = Object.assign({}, O.d); }
function giveOutfit(k) { if (!OUTFITS[k]) return false; const had = S.ward.p[k]; S.ward.p[k] = S.ward.p[k] || S.day; S.ward.d[k] = S.ward.d[k] || S.day; return !had; }
/* 플레이어 외형: 옷장 의상(w_) 지원 */
const _playerLookV2_0 = playerLookV2;
playerLookV2 = function (job, hairKey, style) {
  const l = _playerLookV2_0(job, hairKey, style && style.clothes && style.clothes.startsWith('w_') ? Object.assign({}, style, { clothes: 'job' }) : style);
  if (style && style.clothes && style.clothes.startsWith('w_')) {
    const O = OUTFITS[style.clothes.slice(2)];
    if (O && O.p === 'wedding') l.outfits.base = Object.assign({}, l.outfits.wedding);
    else if (O) { l.outfits.base = Object.assign({}, O.p); if (O.p.skirt && !l.fem && O.p.skirt !== null) { l.outfits.base.skirt = null; l.outfits.base.pants = O.p.skirt; } }
  }
  return l;
};
/* 형사님: 근무 중엔 근무복 우선, 퇴근 후엔 정해 둔 사복 */
const _detDayOutfit0 = detDayOutfit;
detDayOutfit = function (kind) {
  if (kind === 'casual' && S && S.wear && S.wear.d) { const O = OUTFITS[S.wear.d]; if (O) return O.d === 'suit' ? 'suit' : 'w_' + S.wear.d; }
  return _detDayOutfit0(kind);
};
function wardrobeMenu(who = 'p') {
  const st = S.rel.stage, canDet = st >= 5 || S.rel.flags.married;
  const owned = Object.keys(OUTFITS).filter(k => S.ward[who][k]);
  const curP = S.style.clothes, curD = S.wear.d;
  const tabs = `<div class="ptabs"><button data-w="p" class="${who === 'p' ? 'on' : ''}">나의 옷장</button><button data-w="d" class="${who === 'd' ? 'on' : ''}">${canDet ? '형사님 사복' : '🔒 형사님 사복'}</button></div>`;
  const preview = (k) => { const look = who === 'p' ? playerLookV2(S.job, S.hair, Object.assign({}, S.style, { clothes: k ? 'w_' + k : 'job' })) : LOOKS.det; const c = mkCanvas(48, 68), g = c.getContext('2d'); g.imageSmoothingEnabled = false; const ok = who === 'p' ? 'base' : (k ? (OUTFITS[k].d === 'suit' ? 'suit' : 'w_' + k) : 'casual'); g.drawImage(chibi(Object.assign({}, look, { cacheId: 'ward' + who + (k || 'none') + styleKey(S.style) }), ok, 'f', 0, 'stand', false), 0, 0, 48, 68); return c.toDataURL(); };
  let html = tabs;
  if (who === 'd' && !canDet) html += '<p class="psub">연인이 되면 형사님의 사복을 골라 줄 수 있어요. (근무 중에는 항상 근무복)</p>';
  else {
    const list = [null, ...owned];
    html += `<p class="psub">${who === 'p' ? '옷을 누르면 바로 갈아입어요.' : '퇴근 후 형사님이 입을 사복을 골라요. 근무 중엔 근무복을 입어요.'}</p><div class="pgrid">${list.map(k => `<button class="pcard ${(who === 'p' ? (k ? curP === 'w_' + k : curP === 'job' || !curP.startsWith('w_')) : curD === k) ? 'on' : ''}" data-k="${k || ''}"><img src="${preview(k)}" class="chibi"><b>${k ? OUTFITS[k].name : who === 'p' ? '기본 (지금 옷)' : '날마다 고르기'}</b><small>${k ? OUTFITS[k].cat + (OUTFITS[k].couple ? ' · 커플' : '') : ''}</small></button>`).join('')}</div>`;
  }
  openPanel('👗 옷장', html, (body) => {
    body.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => wardrobeMenu(b.dataset.w));
    body.querySelectorAll('.pcard').forEach(b => b.onclick = () => {
      const k = b.dataset.k || null;
      if (who === 'p') { applyStyle(Object.assign({}, S.style, { clothes: k ? 'w_' + k : 'job', cc: S.style.cc })); memPref('outfit', k || 'job'); toast(k ? `${OUTFITS[k].icon} ${OUTFITS[k].name}(으)로 갈아입었어요` : '원래 옷으로 갈아입었어요'); S.rel.daily.styleChanged = true; }
      else { S.wear.d = k; toast(k ? `형사님 사복: ${OUTFITS[k].name}` : '형사님이 날마다 옷을 골라 입어요'); G.det.outfit = detDayOutfit(detPlan(S.min).duty ? 'work' : 'casual'); }
      save(); wardrobeMenu(who);
    });
  });
}
function outfitShopMenu() {
  const goods = OUTFIT_SHOP.map(k => ({ name: OUTFITS[k].name, price: OUTFITS[k].price, icon: OUTFITS[k].icon, owned: S.ward.p[k], desc: `${OUTFITS[k].cat} · 나와 형사님 옷장에 함께 들어가요`, buy: () => giveOutfit(k) }));
  shopPanel('👗 해월 옷가게 — 커플 의상', '산 옷은 옷장에서 갈아입어요', goods);
}

/* ---------------- 네컷사진 ---------------- */
const FRAMES = { white: ['흰색', '#ffffff', '#3a2533'], sky: ['하늘색', '#bfe3f7', '#2f5a9a'], pink: ['분홍색', '#fbd3df', '#a0405a'], sea: ['바다', '#7fc4e8', '#ffffff'], lighthouse: ['해월도 등대', '#2e3d66', '#fff3a0'], spring: ['봄꽃', '#fff6c0', '#c9a020'], fireworks: ['여름 불꽃놀이', '#1f2440', '#ffd77a'], autumn: ['가을 귤밭', '#f7c27a', '#7a4a20'], winter: ['겨울 눈꽃', '#e8f0f8', '#5a7aa8'], anniv: ['결혼기념일', '#fff1f4', '#c0405a'] };
const POSES = {
  1: [['나란히 서기', 'smile', 'smile', 0], ['손 흔들기', 'laugh', 'smile', 'wave'], ['브이', 'laugh', 'tease', 'v'], ['서로 바라보기', 'smile', 'smile', 'look'], ['장난스러운 표정', 'tease', 'laugh', 0], ['고개 기울이기', 'smile', 'smile', 'tilt']],
  2: [['어깨 붙이기', 'smile', 'laugh', 'close'], ['서로 놀리기', 'tease', 'tease', 'look'], ['손가락 하트', 'blush', 'smile', 'heartS'], ['웃음 참기', 'laugh', 'laugh', 'close']],
  3: [['손잡기', 'blush', 'smile', 'close'], ['뒤에서 안기', 'blush', 'blush', 'hug'], ['볼 가까이 대기', 'blush', 'tease', 'cheek'], ['이마 맞대기', 'blush', 'blush', 'brow'], ['서로 바라보며 웃기', 'laugh', 'laugh', 'look']],
  4: [['함께 하트', 'blush', 'laugh', 'heartB'], ['결혼반지 보여주기', 'laugh', 'smile', 'ring'], ['다정하게 기대기', 'smile', 'blush', 'lean'], ['장난스럽게 밀착하기', 'tease', 'laugh', 'cheek'], ['품에 안기', 'blush', 'smile', 'hug']],
};
function posePool() { const st = S.rel.stage; let p = [...POSES[1]]; if (st >= 3) p = p.concat(POSES[2]); if (st >= 5) p = p.concat(POSES[3]); if (st >= 8) p = p.concat(POSES[4]); return p; }
function pickPoses(manual) {
  const pool = posePool(), out = []; let last = G._lastPose || null;
  for (let i = 0; i < 4; i++) { let c; if (manual && manual[i]) c = manual[i]; else { let tries = 0; do { c = pick(pool); } while (c[0] === last && tries++ < 10); } out.push(c); last = c[0]; }
  G._lastPose = last; return out;
}
function boothState() { const st = S.rel.stage; return st >= 3 ? 'ok' : 'lock'; }
async function boothAction() {
  const d = G.det, P = G.player, c = casualOn();
  if (boothState() === 'lock') { await say('narr', '', '📸 네컷사진 부스. 「둘이 찍으면 더 예뻐요!」 — 친한 사이가 되면 형사님과 찍을 수 있어요.'); return; }
  const near = d.visible && d.map === P.map && dist(d, P) < 8;
  if (!near) { await say('narr', '', '📸 네컷사진 부스. 형사님과 함께 와야 찍을 수 있다. (함께 다니기로 데려오거나, 형사님이 근처에 있을 때)'); return; }
  if (!S.comp) {
    if (detPlan(S.min).duty && S.rel.stage < 5) { await say('det', 'smile', c ? '지금 근무 중이라… 퇴근하고 찍자. 약속.' : '지금 근무 중이라서요. 퇴근하고 찍어요, 약속.'); return; }
    await say('me', 'smile', toBanmalIf('형사님, 사진 같이 찍어요!'));
    await say('det', 'laugh', c ? '사진? 좋지. 나 잘 나오게 찍어 줘야 한다?' : '사진이요? 좋죠. 저 잘 나오게 찍어 주셔야 해요?');
    scriptDet(); d.walkTo(...P_('booth')); await waitUntil(() => !d.path.length, 10);
  }
  closeDialog();
  await photoSession();
}
async function photoSession(opts = {}) {
  return new Promise(res => {
    const st = S.rel.stage; let frame = opts.frame || S.frames[S.frames.length - 1] || 'white', mode = 'random', manual = [];
    const pool = posePool();
    const draw = () => {
      openPanel('📸 네컷사진', `<p class="psub">프레임과 포즈를 골라요 · 단계가 깊어지면 포즈가 늘어나요</p>
        <h4>프레임</h4><div class="chips">${Object.entries(FRAMES).map(([k, f]) => `<button class="chip ${frame === k ? 'on' : ''} ${S.frames.includes(k) ? '' : 'lock'}" data-f="${k}" style="--c:${f[1]}">${S.frames.includes(k) ? f[0] : '🔒 ' + f[0]}</button>`).join('')}</div>
        <h4>포즈</h4><div class="chips"><button class="chip ${mode === 'random' ? 'on' : ''}" data-m="random">🎲 랜덤 (연속 중복 없음)</button><button class="chip ${mode === 'pick' ? 'on' : ''}" data-m="pick">✋ 직접 고르기</button></div>
        ${mode === 'pick' ? `<div class="chips">${pool.map((p, i) => `<button class="chip ${manual.includes(p) ? 'on' : ''}" data-p="${i}">${manual.includes(p) ? (manual.indexOf(p) + 1) + '컷 ' : ''}${p[0]}</button>`).join('')}</div><p class="psub">${manual.length}/4컷 선택</p>` : ''}
        <h4>의상 · 소품</h4><p class="psub">지금 입은 옷 그대로 찍혀요. 옷장에서 커플 의상으로 바꿀 수도 있어요.</p>
        <div class="prow"><button id="phWard" class="big alt">👗 옷장</button><button id="phGo" class="big">📸 촬영!</button></div>`, (body) => {
        body.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { if (!S.frames.includes(b.dataset.f)) { toast('축제 · 탐험 · 상점에서 얻을 수 있어요'); return; } frame = b.dataset.f; draw(); });
        body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; manual = []; draw(); });
        body.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const p = pool[+b.dataset.p]; if (manual.includes(p)) manual = manual.filter(x => x !== p); else if (manual.length < 4) manual.push(p); draw(); });
        body.querySelector('#phWard').onclick = () => { G._panelClose = null; wardrobeMenu('p'); G._panelClose = () => draw(); };
        body.querySelector('#phGo').onclick = async () => { G._panelClose = null; const poses = pickPoses(mode === 'pick' && manual.length === 4 ? manual : null); await shootStrip(frame, poses); res(); };
      }, { full: true });
      G._panelClose = () => res();
    };
    draw();
  });
}
async function shootStrip(frame, poses) {
  const body = $('#panelBody'); $('#panelTitle').textContent = '📸 촬영 중';
  const shots = [];
  for (let i = 0; i < 4; i++) {
    for (const n of [3, 2, 1]) { body.innerHTML = `<div class="countdown"><b>${n}</b><small>${i + 1}컷 · ${poses[i][0]}</small></div>`; Sound.sfx('tap'); await sleep(420); }
    flashFx(); Sound.sfx('bell'); shots.push(poses[i]); await sleep(260);
  }
  const img = composeStrip(frame, poses);
  const desc = stripDesc(poses);
  const id = 'p' + Date.now().toString(36);
  const pl = placeName(curPlace()) || '네컷사진 부스';
  const entry = { id, title: S.stats.photos === 0 ? '우리의 첫 네컷사진' : `${FRAMES[frame][0]} 네컷사진`, cat: 'fourcut', kind: 'fourcut', day: S.day, date: dateLabel(), time: fmtTime(S.min), place: pl, stage: S.rel.stage, img, desc, frame, poses: poses.map(p => p[0]), who: [S.name, detLabel()] };
  S.album.unshift(entry); S.stats.photos++; S.lastPhotoDay = S.day;
  const fourcuts = S.album.filter(a => a.cat === 'fourcut' && a.img);
  if (fourcuts.length > 10) { const old = fourcuts[fourcuts.length - 1]; if (!old.fav) { old.img = null; old.lost = true; } }
  S.furn.store.push({ id: 'f' + S.furn.seq++, k: 'frame4', photo: id });
  addRumor('photo', {}, { key: 'photo' + S.day, days: 5 }); memRecent('photo', entry.title); memPerm('firstPhoto', { id });
  addAff(4, { event: true });
  save();
  openPanel('📸 완성!', `<div class="strip"><img src="${img}"></div><p class="psub">${esc(desc)}</p><p class="psub">🖼 네컷사진 액자가 가구 보관함에 들어갔어요. 집에 걸어 보세요!</p><div class="prow"><button id="phSave" class="big alt">💾 사진 저장</button><button id="phOk" class="big">좋아요</button></div>`, (b) => {
    b.querySelector('#phSave').onclick = () => downloadImg(img, `haewoldo-4cut-${S.day}.png`);
    b.querySelector('#phOk').onclick = () => closePanel();
  }, { full: true });
  G._panelClose = () => { runEvent(async () => { const c = casualOn(); await say('det', 'laugh', S.rel.stage >= 8 ? '우리 집 액자 또 하나 늘었네. 볼 때마다 웃기겠다.' : c ? '하하, 세 번째 컷 내 표정 봐. 이거 너만 갖고 있어야 한다?' : '하하, 세 번째 컷 제 표정 좀 보세요. 이건 비밀로 해 주세요.'); }); };
}
function downloadImg(url, name) { try { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('💾 저장을 시도했어요 (막혀 있으면 사진을 길게 눌러 저장해요)'); } catch (e) { toast('이 화면에선 저장이 막혀 있어요. 사진을 길게 눌러 저장해요'); } }
function stripDesc(poses) { const n = poses.map(p => p[0]); return `첫 번째 컷은 「${n[0]}」, 두 번째는 「${n[1]}」. 세 번째 「${n[2]}」에서 웃음이 터졌고, 마지막 「${n[3]}」은 둘 다 카메라를 제대로 못 봤다.`; }
function composeStrip(frame, poses) {
  const [, bg, fg] = FRAMES[frame], W = 184, PH = 104, H = 26 + PH * 4 + 8 * 3 + 34;
  const c = mkCanvas(W, H), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // 프레임 무늬
  const r = rng(frame.length * 97);
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H; g.fillStyle = fg; g.globalAlpha = 0.25; if (frame === 'spring') fillEllipse(g, x, y, 2, 2, '#f5e05a'); else if (frame === 'fireworks') { g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 1, 3, 1); } else if (frame === 'winter') { g.fillStyle = '#ffffff'; g.globalAlpha = 0.8; g.fillRect(x, y, 1, 1); } else if (frame === 'autumn') fillEllipse(g, x, y, 2, 2, '#f39a2b'); else if (frame === 'sea') { g.fillStyle = '#ffffff'; g.fillRect(x, y, 3, 1); } else if (frame === 'anniv' || frame === 'pink') { drawPixHeart(g, x, y, '#ff6f91'); } g.globalAlpha = 1; }
  g.fillStyle = fg; g.font = '11px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('HAEWOLDO · 해월도', W / 2, 16);
  const pFace = drawPortrait(G.player.look, wearOf(G.player), 'smile'), dLook = LOOKS.det, dOut = wearOf(G.det);
  poses.forEach((p, i) => {
    const y0 = 24 + i * (PH + 8), x0 = 7, pw = W - 14;
    const sky = { white: ['#f4f8fb', '#dfe9f2'], sky: ['#cfe9f8', '#a9d6f0'], pink: ['#fde4ec', '#f8c9d8'], sea: ['#9fd6f2', '#53a6dc'], lighthouse: ['#384a7a', '#1f2a4a'], spring: ['#fff9d6', '#f2e48a'], fireworks: ['#2a3060', '#151a36'], autumn: ['#ffe2b0', '#f2b46a'], winter: ['#f4f8fc', '#d6e4f2'], anniv: ['#fff4f7', '#fbd3df'] }[frame];
    const gr = g.createLinearGradient(0, y0, 0, y0 + PH); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); g.fillStyle = gr; g.fillRect(x0, y0, pw, PH);
    const [name, eP, eD, kind] = p;
    const meImg = drawPortrait(G.player.look, wearOf(G.player), eP), heImg = drawPortrait(dLook, dOut, eD);
    let mx = x0 + 14, hx = x0 + pw - 14 - 64, my = y0 + PH - 64, hy = y0 + PH - 70, flipH = true, flipM = false, tiltM = 0, tiltH = 0;
    if (kind === 'close' || kind === 'cheek' || kind === 'lean' || kind === 'heartB' || kind === 'ring') { mx += 12; hx -= 12; }
    if (kind === 'brow') { mx += 18; hx -= 18; }
    if (kind === 'hug') { mx = x0 + pw / 2 - 40; hx = x0 + pw / 2 - 20; hy = y0 + PH - 76; }
    if (kind === 'look') { flipM = true; flipH = false; }
    if (kind === 'tilt' || kind === 'lean') { tiltM = 0.12; tiltH = -0.08; }
    if (kind === 'cheek') tiltH = -0.15;
    const put = (img, x, y, flip, tilt) => { g.save(); g.translate(x + 32, y + 32); if (tilt) g.rotate(tilt); if (flip) g.scale(-1, 1); g.drawImage(img, -32, -32, 64, 64); g.restore(); };
    g.save(); g.beginPath(); g.rect(x0, y0, pw, PH); g.clip();
    if (kind === 'hug') { put(meImg, mx, my, flipM, tiltM); put(heImg, hx, hy, flipH, tiltH); }
    else { put(heImg, hx, hy, flipH, tiltH); put(meImg, mx, my, flipM, tiltM); }
    // 소품
    if (kind === 'v') { drawVsign(g, mx + 52, my + 30); }
    if (kind === 'wave') { g.fillStyle = '#ffe3cf'; g.fillRect(mx + 56, my + 18, 5, 6); g.fillStyle = fg; g.fillRect(mx + 63, my + 16, 1, 2); g.fillRect(mx + 64, my + 21, 2, 1); }
    if (kind === 'heartS') drawPixHeart(g, x0 + pw / 2 - 2, y0 + 20, '#ff6f91');
    if (kind === 'heartB') { for (const [a, b] of [[0, 0], [-8, 8], [8, 8], [-4, 14], [4, 14]]) drawPixHeart(g, x0 + pw / 2 + a, y0 + 12 + b, '#ff6f91'); }
    if (kind === 'ring') { g.fillStyle = '#fff3a0'; g.fillRect(x0 + pw / 2 - 2, y0 + 30, 4, 4); g.fillStyle = '#ffffff'; g.fillRect(x0 + pw / 2 - 1, y0 + 26, 1, 3); }
    if (kind === 'brow' || kind === 'cheek' || kind === 'hug') { drawPixHeart(g, x0 + pw / 2, y0 + 14, '#ff9ab5'); }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = '8px Jua, sans-serif'; g.textAlign = 'left'; g.fillText(name, x0 + 4, y0 + 10);
  });
  g.fillStyle = fg; g.font = '10px Jua, sans-serif'; g.textAlign = 'center'; g.fillText(`${dateLabel()} · ${S.name} ♥ ${detLabel()}`, W / 2, H - 14);
  void pFace;
  try { return c.toDataURL('image/png'); } catch (e) { return null; }
}
function drawPixHeart(g, x, y, col) { g.fillStyle = col; g.fillRect(x - 2, y, 2, 2); g.fillRect(x + 1, y, 2, 2); g.fillRect(x - 3, y + 1, 7, 2); g.fillRect(x - 2, y + 3, 5, 1); g.fillRect(x - 1, y + 4, 3, 1); g.fillRect(x, y + 5, 1, 1); }
function drawVsign(g, x, y) { g.fillStyle = '#ffe3cf'; g.fillRect(x, y, 6, 6); g.fillRect(x + 1, y - 6, 2, 6); g.fillRect(x + 4, y - 6, 2, 6); g.fillStyle = '#c99a84'; g.fillRect(x, y + 6, 6, 1); }

/* ---------------- 추억 앨범 v2 ---------------- */
const ALBUM_CATS = { meet: '첫 만남', firstDate: '첫 데이트', daily: '일상', festival: '축제', travel: '여행', case: '사건 해결', fourcut: '네컷사진', love: '연애', propose: '프로포즈', wedding: '결혼', married: '결혼 후 생활' };
function albumCat(kind) { return ({ meet: 'meet', date: 'love', walk: 'daily', sit: 'daily', pier: 'daily', gift: 'daily', photo: 'daily', season: 'festival', festival: 'festival', case: 'case', fourcut: 'fourcut', confess: 'love', lovers: 'love', kiss: 'love', anni: 'love', propose: 'propose', wedding: 'wedding', married: 'married', islet: 'travel', travel: 'travel', eat: 'daily', karaoke: 'daily', firstDate: 'firstDate' })[kind] || 'daily'; }
const _addAlbum0 = addAlbum;
addAlbum = async function (title, kind) {
  await _addAlbum0(title, kind);
  const a = S.album[0]; if (!a) return;
  a.id = a.id || 'a' + Date.now().toString(36); a.cat = albumCat(kind);
  if (kind === 'date' && !S.mem.perm.firstDate) a.cat = 'firstDate';
  if (S.rel.flags.married && a.cat === 'daily') a.cat = 'married';
  a.who = [S.name, G.det.visible && dist(G.det, G.player) < 6 ? detLabel() : null].filter(Boolean);
  a.memId = Object.keys(S.mem.perm).find(k => S.mem.perm[k].day === S.day) || null;
};
function albumMenu(opts = {}) {
  const cat = opts.cat || 'all', sort = opts.sort || 'date';
  let list = S.album.map((a, i) => Object.assign({ i }, a)).filter(a => cat === 'all' || (cat === 'fav' ? a.fav : a.cat === cat));
  if (sort === 'place') list.sort((p, q) => (p.place || '').localeCompare(q.place || '') || q.day - p.day); else list.sort((p, q) => q.day - p.day);
  const cats = [['all', '전체'], ['fav', '⭐ 즐겨찾기'], ...Object.entries(ALBUM_CATS)];
  openPanel('📔 추억 앨범', `<div class="chips small">${cats.map(([k, n]) => `<button class="chip ${cat === k ? 'on' : ''}" data-c="${k}">${n}</button>`).join('')}</div>
    <div class="chips small"><button class="chip ${sort === 'date' ? 'on' : ''}" data-s="date">날짜순</button><button class="chip ${sort === 'place' ? 'on' : ''}" data-s="place">장소순</button></div>
    ${list.length ? `<div class="album">${list.map(a => `<figure data-i="${a.i}" class="${a.cat === 'fourcut' ? 'fc' : ''}">${a.img ? `<img src="${a.img}" alt="">` : `<div class="noimg">${a.cat === 'fourcut' ? '🎞' : '📔'}</div>`}<figcaption><b>${a.fav ? '⭐ ' : ''}${esc(a.title)}</b><small>${a.date || a.day + '일째'} ${a.time || ''} · ${esc(a.place || '')}<br>${ALBUM_CATS[a.cat] || ''}</small></figcaption></figure>`).join('')}</div>` : '<p class="psub">이 분류엔 아직 추억이 없어요.</p>'}`, (body) => {
    body.querySelectorAll('[data-c]').forEach(b => b.onclick = () => albumMenu({ cat: b.dataset.c, sort }));
    body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => albumMenu({ cat, sort: b.dataset.s }));
    body.querySelectorAll('figure').forEach(f => f.onclick = () => albumDetail(+f.dataset.i, { cat, sort }));
  });
}
function albumDetail(i, back) {
  const a = S.album[i]; if (!a) return;
  const canRecall = S.rel.flags.met && G.det.visible && G.det.map === G.player.map && dist(G.det, G.player) < 6;
  openPanel(a.title, `${a.img ? `<div class="${a.cat === 'fourcut' ? 'strip' : 'aimg'}"><img src="${a.img}"></div>` : `<div class="noimg big">${a.lost ? '🖼 (저장 공간 때문에 그림은 지워졌어요)' : '📔'}</div>`}
    <dl class="prof"><dt>날짜</dt><dd>${a.date || a.day + '일째'} ${a.time || ''}</dd><dt>장소</dt><dd>${esc(a.place || '')}</dd><dt>함께</dt><dd>${esc((a.who || [S.name]).join(', '))}</dd><dt>분류</dt><dd>${ALBUM_CATS[a.cat] || ''}</dd>${a.poses ? `<dt>포즈</dt><dd>${esc(a.poses.join(' · '))}</dd>` : ''}</dl>${a.desc ? `<p class="psub">${esc(a.desc)}</p>` : ''}
    <div class="prow wrap"><button id="aFav" class="big alt">${a.fav ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기'}</button>${a.img ? '<button id="aSave" class="big alt">💾 저장</button>' : ''}${a.cat === 'fourcut' ? '<button id="aFrame" class="big alt">🖼 액자 만들기</button>' : ''}<button id="aRecall" class="big ${canRecall ? '' : 'alt'}">💬 형사님과 회상</button></div>`, (body) => {
    body.querySelector('#aFav').onclick = () => { a.fav = !a.fav; save(); albumDetail(i, back); };
    const sv = body.querySelector('#aSave'); if (sv) sv.onclick = () => downloadImg(a.img, `haewoldo-${a.id}.${a.cat === 'fourcut' ? 'png' : 'jpg'}`);
    const fr = body.querySelector('#aFrame'); if (fr) fr.onclick = () => { if (S.furn.store.some(f => f.photo === a.id) || S.furn.placed.some(f => f.photo === a.id)) { toast('이미 액자가 있어요 (보관함 · 집)'); return; } S.furn.store.push({ id: 'f' + S.furn.seq++, k: 'frame4', photo: a.id }); save(); toast('🖼 액자를 보관함에 넣었어요. 집 「꾸미기」에서 벽에 걸어요'); };
    body.querySelector('#aRecall').onclick = () => { if (!canRecall) { toast('형사님이 곁에 있을 때 함께 회상할 수 있어요'); return; } closePanel(); runEvent(() => recallMemory(a)); };
  }, { back: () => albumMenu(back) });
}
async function recallMemory(a) {
  const c = casualOn(), d = G.det; d.lookAt(G.player);
  const known = a.memId && S.mem.perm[a.memId];
  const lines = {
    meet: c ? `${S.fm && S.fm.place ? S.fm.place + '에서' : '그때'} 처음 봤던 날이네. 솔직히 그땐 이렇게 될 줄 몰랐다.` : `${S.fm && S.fm.place ? S.fm.place + '에서' : '그때'} 처음 만난 날이네요. 벌써 이렇게 됐네.`,
    fourcut: c ? '하하, 이 컷 내 표정 진짜 웃기다. 또 찍으러 가자.' : '하하, 이 컷 제 표정 좀 보세요. 또 찍으러 가요.',
    festival: c ? `${a.title}… 그날 진짜 재밌었지.` : `${a.title}… 그날 정말 즐거웠죠.`,
    case: c ? '그 사건, 우리 콤비 아니었으면 못 풀었을걸?' : '그 사건, 같이 아니었으면 못 풀었을 거예요.',
    firstDate: c ? '여기 기억나? 우리 처음 같이 왔던 곳인데.' : '여기 기억나요? 우리 처음 같이 왔던 곳인데.',
    wedding: '우리 결혼사진 다시 볼까? 볼 때마다 웃겨.',
  };
  await say('det', 'smile', lines[a.cat] || (c ? `${a.date}… ${a.place}였지? 그날 기억나.` : `${a.date}, ${a.place}였죠? 기억나요.`));
  if (known && a.cat !== 'meet') await say('det', 'tease', c ? '나 이런 거 은근히 다 기억한다?' : '저 이런 거 은근히 다 기억해요.');
  if (!S.rel.daily.recall) { S.rel.daily.recall = true; addAff(2); }
}

/* ---------------- 가구: 인스턴스 · 가구점 · 집 확장 · 꾸미기 ---------------- */
function furnGive(k, extra = {}) { if (!FURN[k]) return null; const f = Object.assign({ id: 'f' + S.furn.seq++, k }, extra); S.furn.store.push(f); return f; }
const FURN_CATS = { bed: ['🛏 침실', ['bed', 'bedS', 'bedD', 'nightstand', 'wardrobe', 'lamp']], living: ['🛋 거실', ['sofa', 'sofa2', 'table', 'shelf', 'rug', 'rugL', 'plant', 'tv', 'desk']], kitchen: ['🍳 주방', ['diningT', 'chair', 'kshelf', 'fridge', 'kitchen', 'dining']], decor: ['🖼 장식', ['clock', 'frame', 'vase', 'curtain', 'photoStand', 'frame4']], couple: ['💞 커플', ['bedCouple', 'mugs', 'souvenir', 'seaChair', 'tank', 'piano']] };
function furnShopMenu(cat = 'bed') {
  const [label, keys] = FURN_CATS[cat]; const lock = cat === 'couple' && S.rel.stage < 5;
  const tabs = `<div class="ptabs">${Object.entries(FURN_CATS).map(([k, v]) => `<button data-c="${k}" class="${k === cat ? 'on' : ''}">${v[0]}</button>`).join('')}</div>`;
  openPanel('🛋 해월 가구점', tabs + `<p class="psub">보유 <b>${fmtMoney(S.money)}</b> · 산 가구는 보관함에 들어가고, 집 「꾸미기」에서 놓아요${lock ? '<br>💞 커플 가구는 연인이 되면 살 수 있어요' : ''}</p>
    <div class="pgrid">${keys.map(k => { const n = S.furn.store.filter(f => f.k === k).length + S.furn.placed.filter(f => f.k === k).length; return `<button class="pcard ${lock ? 'lock' : ''}" data-k="${k}"><img src="${furnPreview(k, 0, 2)}"><b>${FURN[k].name}</b><small>${fmtMoney(FURN[k].price)}${n ? ` · 보유 ${n}` : ''}</small></button>`; }).join('')}</div>`, (body) => {
    body.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => furnShopMenu(b.dataset.c));
    body.querySelectorAll('.pcard').forEach(b => b.onclick = () => { if (lock) { toast('연인이 되면 열려요'); return; } furnDetail(b.dataset.k, cat, 0); });
  });
}
function furnDetail(k, cat, rot) {
  const F = FURN[k], [fw, fd] = furnFoot(k, rot);
  confirmBuy(F.name, F.price, furnPreview(k, rot, 4), `${fw}×${fd}칸${F.wall ? ' · 벽걸이' : F.flat ? ' · 바닥 장식(겹쳐 놓기 가능)' : ''}${F.act ? ' · ' + ({ sleep: '잠자기', sit: '앉기', eat: '식사', cook: '요리', read: '책 읽기', wardrobe: '옷 갈아입기', photo: '사진 보기', tv: 'TV 보기' })[F.act] : ''}`, () => furnGive(k), () => furnShopMenu(cat));
  const img = $('#panelBody img'); if (img) { img.style.cursor = 'pointer'; img.title = '눌러서 돌려 보기'; img.onclick = () => { $('#panelBody img').src = furnPreview(k, (rot = (rot + 1) & 3), 4); }; }
}
const HOME_LV = [
  { W: 8, H: 7, name: '기본 집', cost: 0, desc: '시작 집' },
  { W: 9, H: 8, name: '1차 확장', cost: 3000, desc: '실내 면적이 넓어져요' },
  { W: 10, H: 9, name: '2차 확장', cost: 8000, desc: '침실 공간이 생겨요', zone: 'bed' },
  { W: 12, H: 9, name: '3차 확장', cost: 15000, desc: '별도의 방이 생겨요', zone: 'room' },
  { W: 12, H: 11, name: '최종 확장', cost: 30000, desc: '넓은 공동생활 공간', zone: 'all' },
];
function homeDims(lv = S.homeLv) { return HOME_LV[lv]; }
function rebuildHome() {
  const L = homeDims(), I = INTERIORS.home;
  const m = makeMap('in_home', L.W, L.H, { name: I.name, interior: true, owner: 'home', wall: I.wall, wall2: I.wall2 });
  m.tiles.fill(T.FLOOR);
  if (L.zone) for (let y = 0; y < Math.min(4, L.H - 2); y++) for (let x = L.W - 4; x < L.W; x++) m.tiles[y * L.W + x] = T.MAT;
  if (L.zone === 'room' || L.zone === 'all') for (let y = L.H - 4; y < L.H - 1; y++) for (let x = 0; x < 3; x++) m.tiles[y * L.W + x] = T.TILEF;
  m.exit = [Math.floor(L.W / 2) - 1, L.H - 1]; m.spawn = { door: [m.exit[0] + 0.5, m.exit[1] - 0.5] }; m.tiles[m.exit[1] * L.W + m.exit[0]] = T.MAT;
  m.visit = [[m.exit[0] + 0.5, m.exit[1] - 1.5]];
  M = G.player && G.player.map === 'in_home' ? m : M;
  setFurniture(m, homeFurnList());
  return m;
}
homeFurnList = function () { return S.furn.placed.map(f => ({ id: f.id, k: f.k, x: f.x, y: f.y, rot: f.rot || 0, act: FURN[f.k] && FURN[f.k].act || null })); };
function footTiles(k, x, y, rot) { const [w, h] = furnFoot(k, rot), out = []; for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) out.push([xx, yy]); return out; }
/* 배치 가능 여부 — 벽 밖 · 출입문 · 겹침 · 길 막힘 · 벽걸이 */
function canPlace(f, x, y, rot, ignoreId) {
  const m = MAPS.in_home, F = FURN[f.k], tiles = footTiles(f.k, x, y, rot);
  if (tiles.some(([a, b]) => !inMap(a, b, m))) return '벽 밖에는 놓을 수 없어요';
  const [ex, ey] = m.exit;
  if (F.wall) {
    if (!tiles.every(([a, b]) => b === 0 || a === 0)) return '벽걸이 가구는 벽에 붙여 걸어요';
    if (S.furn.placed.some(o => o.id !== ignoreId && FURN[o.k].wall && o.x === x && o.y === y)) return '이미 다른 장식이 걸려 있어요';
    return null;
  }
  if (tiles.some(([a, b]) => (a === ex && (b === ey || b === ey - 1)))) return '출입문 앞을 막을 수 없어요';
  const others = S.furn.placed.filter(o => o.id !== ignoreId && !FURN[o.k].wall);
  for (const o of others) { const ot = footTiles(o.k, o.x, o.y, o.rot || 0); const flatPair = !!F.flat !== !!FURN[o.k].flat; if (!flatPair && ot.some(([a, b]) => tiles.some(([c, d]) => a === c && b === d))) return '다른 가구와 겹쳐요'; }
  if (F.flat) return null;
  // 길 막힘 검사
  const block = new Uint8Array(m.W * m.H);
  for (const o of others) if (!FURN[o.k].flat) for (const [a, b] of footTiles(o.k, o.x, o.y, o.rot || 0)) block[b * m.W + a] = 1;
  for (const [a, b] of tiles) block[b * m.W + a] = 1;
  const P = G.player; if (P.map === 'in_home' && block[Math.floor(P.y) * m.W + Math.floor(P.x)]) return '내가 서 있는 자리예요';
  const seen = new Uint8Array(m.W * m.H), q = [[ex, ey]]; seen[ey * m.W + ex] = 1; let n = 1;
  while (q.length) { const [a, b] = q.pop(); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = a + da, d = b + db; if (!inMap(c, d, m) || block[d * m.W + c] || seen[d * m.W + c]) continue; seen[d * m.W + c] = 1; n++; q.push([c, d]); } }
  let free = 0; for (let i = 0; i < block.length; i++) if (!block[i]) free++;
  if (n < free) return '이동 경로가 막혀요';
  const acts = [...others.filter(o => FURN[o.k].act), ...(F.act ? [{ k: f.k, x, y, rot }] : [])];
  for (const o of acts) { const ot = footTiles(o.k, o.x, o.y, o.rot || 0); if (!ot.some(([a, b]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => { const c = a + da, d = b + db; return inMap(c, d, m) && seen[d * m.W + c]; }))) return `${FURN[o.k].name}에 다가갈 수 없게 돼요`; }
  return null;
}
function expandMenu() {
  const lv = S.homeLv, next = HOME_LV[lv + 1];
  const plan = (L, list) => { const c = mkCanvas(L.W * 10 + 4, L.H * 10 + 4), g = c.getContext('2d'); g.fillStyle = '#f6dcd3'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#d7a874'; g.fillRect(2, 2, L.W * 10, L.H * 10); if (L.zone) { g.fillStyle = '#d9cc96'; g.fillRect(2 + (L.W - 4) * 10, 2, 40, Math.min(4, L.H - 2) * 10); } g.fillStyle = '#ffd77a'; g.fillRect(2 + (Math.floor(L.W / 2) - 1) * 10, 2 + (L.H - 1) * 10, 10, 10); for (const f of list) { const [w, h] = furnFoot(f.k, f.rot || 0); g.fillStyle = FURN[f.k].wall ? '#8fc3ea' : FURN[f.k].flat ? 'rgba(241,154,181,0.6)' : '#7a5236'; g.fillRect(3 + f.x * 10, 3 + f.y * 10, w * 10 - 2, h * 10 - 2); } return c.toDataURL(); };
  const paid = lv + 1;
  openPanel('🏠 집 확장', `<div class="hplan"><figure><img src="${plan(HOME_LV[lv], S.furn.placed)}"><figcaption>지금: ${HOME_LV[lv].name} (${HOME_LV[lv].W}×${HOME_LV[lv].H})</figcaption></figure>${next ? `<figure><img src="${plan(next, S.furn.placed)}"><figcaption>다음: ${next.name} (${next.W}×${next.H})</figcaption></figure>` : ''}</div>
    <ul class="req">${HOME_LV.map((L, i) => `<li class="${i <= lv ? 'ok' : ''}">${i <= lv ? '✔' : '○'} ${L.name} — ${L.desc} · ${i ? fmtMoney(L.cost) : '무료'}</li>`).join('')}</ul>
    ${next ? `<p class="psub">기존 가구는 그대로 남아요. 새 출입문 자리와 겹치는 가구만 보관함으로 옮겨져요.</p><button id="hxGo" class="big">${fmtMoney(next.cost)}으로 ${next.name}</button>` : '<p class="psub">최종 단계까지 확장했어요! 🎉</p>'}`, (body) => {
    const b = body.querySelector('#hxGo'); if (!b) return;
    b.onclick = () => {
      if (S.homeLv + 1 !== paid) return;                       // 중복 결제 방지
      if (S.money < next.cost) { toast('돈이 부족해요'); return; }
      if (S.paid['home' + paid]) { toast('이미 결제한 단계예요'); return; }
      S.money -= next.cost; S.paid['home' + paid] = S.day; S.homeLv = paid;
      const m = rebuildHome(); const [ex, ey] = m.exit; let moved = 0;
      for (const f of [...S.furn.placed]) { const tiles = footTiles(f.k, f.x, f.y, f.rot || 0); if (!FURN[f.k].wall && tiles.some(([a, b2]) => a === ex && (b2 === ey || b2 === ey - 1))) { S.furn.placed = S.furn.placed.filter(o => o !== f); S.furn.store.push({ id: f.id, k: f.k, photo: f.photo }); moved++; } }
      rebuildHome(); memPerm('home' + paid, { name: next.name }); addRumor('decor', {}, { key: 'home' + paid });
      if (G.player.map === 'in_home') { G.player.x = m.spawn.door[0]; G.player.y = m.spawn.door[1]; G.camSnap = true; }
      Sound.sfx('bell'); updateHUD(); save(); toast(`🏠 ${next.name} 완료!${moved ? ` 가구 ${moved}개는 보관함으로` : ''}`); expandMenu();
    };
  });
}
/* 꾸미기 모드 v2 — 선택 · 끌어 옮기기 · 회전 · 놓기 · 취소 · 넣기 */
openDecor = function () {
  if (M.id !== 'in_home' || G.busy) return;
  G.decor = { sel: null, placing: null, snap: JSON.stringify(S.furn), drag: null };
  $('#decorBar').classList.remove('hidden'); $('#decorBtn').classList.add('hidden');
  updateDecorBar();
};
closeDecor = function (cancel) {
  if (cancel === true && G.decor) { S.furn = JSON.parse(G.decor.snap); toast('↩ 꾸미기 전으로 되돌렸어요'); }
  G.decor = null; $('#decorBar').classList.add('hidden'); updateDecorUI();
  setFurniture(MAPS.in_home, homeFurnList()); save();
  if (S.rel.flags.treasureDecorPending && S.furn.placed.some(f => f.k === 'chest' || f.k === 'shipModel')) { S.rel.flags.treasureDecorPending = false; S.rel.flags.treasureDecorReact = true; }
};
updateDecorBar = function () {
  const d = G.decor; if (!d) return;
  const sel = d.sel && S.furn.placed.find(f => f.id === d.sel);
  $('#decorInfo').textContent = d.placing ? `「${FURN[d.placing.k].name}」 놓을 곳을 누르세요` : sel ? `선택: ${FURN[sel.k].name} — 끌어서 옮기거나 ↻로 돌려요` : '가구를 누르거나 끌어서 옮겨요';
  $('#dMove').disabled = !sel; $('#dRotate').disabled = !(sel || d.placing); $('#dStore').disabled = !sel;
};
function furnAt(x, y) { const list = [...S.furn.placed].reverse(); return list.find(f => !FURN[f.k].flat && footTiles(f.k, f.x, f.y, f.rot || 0).some(([a, b]) => a === x && b === y)) || list.find(f => footTiles(f.k, f.x, f.y, f.rot || 0).some(([a, b]) => a === x && b === y)) || null; }
decorTap = function (x, y) {
  const d = G.decor, m = MAPS.in_home;
  if (!inMap(x, y, m)) return;
  if (d.placing) {
    const why = canPlace(d.placing, x, y, d.placing.rot || 0);
    if (why) { toast(why); return; }
    S.furn.store = S.furn.store.filter(f => f.id !== d.placing.id);
    S.furn.placed.push(Object.assign({}, d.placing, { x, y, rot: d.placing.rot || 0 }));
    d.sel = d.placing.id; d.placing = null; Sound.sfx('tap');
  } else if (d.moving && d.sel) {
    const f = S.furn.placed.find(o => o.id === d.sel), why = canPlace(f, x, y, f.rot || 0, f.id);
    if (why) { toast(why); return; }
    f.x = x; f.y = y; d.moving = false; Sound.sfx('tap');
  } else { const f = furnAt(x, y); d.sel = f ? f.id : null; }
  d.hover = [x, y];
  setFurniture(m, homeFurnList()); updateDecorBar();
};
function decorRotate() {
  const d = G.decor; if (!d) return;
  if (d.placing) { d.placing.rot = ((d.placing.rot || 0) + 1) & 3; updateDecorBar(); return; }
  const f = d.sel && S.furn.placed.find(o => o.id === d.sel); if (!f) return;
  if (FURN[f.k].wall) { toast('벽걸이는 벽 방향에 맞춰져요'); return; }
  for (let i = 1; i <= 3; i++) { const r = ((f.rot || 0) + i) & 3; if (!canPlace(f, f.x, f.y, r, f.id)) { f.rot = r; setFurniture(MAPS.in_home, homeFurnList()); Sound.sfx('tap'); return; } }
  toast('돌릴 공간이 없어요');
}
function decorStore() {
  const d = G.decor; const f = d && d.sel && S.furn.placed.find(o => o.id === d.sel); if (!f) return;
  S.furn.placed = S.furn.placed.filter(o => o !== f); S.furn.store.push({ id: f.id, k: f.k, photo: f.photo }); d.sel = null;
  setFurniture(MAPS.in_home, homeFurnList()); updateDecorBar(); toast(`📦 ${FURN[f.k].name}을(를) 보관함에 넣었어요`);
}
decorStorage = function () {
  const groups = {}; for (const f of S.furn.store) (groups[f.k + (f.photo || '')] = groups[f.k + (f.photo || '')] || []).push(f);
  openPanel('📦 가구 보관함', `<p class="psub">고른 뒤 방바닥(벽걸이는 벽 쪽)을 눌러 놓아요. ↻로 방향을 바꿀 수 있어요.</p>${Object.keys(groups).length ? `<div class="pgrid">${Object.values(groups).map(arr => `<button class="pcard" data-id="${arr[0].id}"><img src="${furnPreview(arr[0].k, 0, 2)}"><b>${FURN[arr[0].k].name}</b><small>${arr.length}개${arr[0].photo ? ' · 네컷사진' : ''}</small></button>`).join('')}</div>` : '<p class="psub">보관함이 비어 있어요. 가구점에서 살 수 있어요.</p>'}<button id="dsShop" class="big alt">🛋 가구점 카탈로그</button>`, (body) => {
    body.querySelectorAll('.pcard').forEach(b => b.onclick = () => { const f = S.furn.store.find(x => x.id === b.dataset.id); G.decor.placing = Object.assign({ rot: FURN[f.k].wall ? 0 : 0 }, f); G.decor.sel = null; closePanel(); updateDecorBar(); });
    body.querySelector('#dsShop').onclick = () => furnShopMenu();
  });
};
/* 끌어서 옮기기 */
function bindDecorDrag() {
  const view = R.view;
  view.addEventListener('pointerdown', (e) => {
    const d = G.decor; if (!d || d.placing || G.pinching) return;
    const r = view.getBoundingClientRect(), w = screenToWorld(e.clientX - r.left, e.clientY - r.top), x = Math.floor(w.tx), y = Math.floor(w.ty);
    const f = furnAt(x, y); if (!f) return;
    d.sel = f.id; d.drag = { f, ox: x - f.x, oy: y - f.y, sx: e.clientX, sy: e.clientY, moved: false, o: MAPS.in_home.objects.find(o => o.id === f.id) };
    updateDecorBar();
  });
  view.addEventListener('pointermove', (e) => {
    const d = G.decor; if (!d || !d.drag) return;
    if (Math.hypot(e.clientX - d.drag.sx, e.clientY - d.drag.sy) > 10) d.drag.moved = true;
    if (!d.drag.moved) return;
    const r = view.getBoundingClientRect(), w = screenToWorld(e.clientX - r.left, e.clientY - r.top);
    const o = d.drag.o; if (o) { o.x = Math.floor(w.tx) - d.drag.ox; o.y = Math.floor(w.ty) - d.drag.oy; }
  });
  const end = (e) => {
    const d = G.decor; if (!d || !d.drag) return;
    const dr = d.drag; d.drag = null;
    if (!dr.moved) return;
    const r = view.getBoundingClientRect(), w = screenToWorld(e.clientX - r.left, e.clientY - r.top);
    const nx = Math.floor(w.tx) - dr.ox, ny = Math.floor(w.ty) - dr.oy, why = canPlace(dr.f, nx, ny, dr.f.rot || 0, dr.f.id);
    if (why) toast(why); else { dr.f.x = nx; dr.f.y = ny; Sound.sfx('tap'); }
    setFurniture(MAPS.in_home, homeFurnList()); G._suppressTap = true; setTimeout(() => { G._suppressTap = false; }, 60);
  };
  view.addEventListener('pointerup', end, true); view.addEventListener('pointercancel', end, true);
}
/* 꾸미기 중 격자: 놓을 수 있으면 초록, 없으면 빨강 */
drawDecorGrid = function (g) {
  const m = M, d = G.decor;
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) { const [sx, sy] = iso(x, y); g.fillStyle = 'rgba(255,255,255,0.13)'; for (let i = 0; i < 16; i++) prect(g, sx - 16 + i * 2, sy + 8 - i * 0.5, 1, 1, 'rgba(255,255,255,0.25)'); void sx; }
  const show = (f, x, y, rot, ign) => { const ok = !canPlace(f, x, y, rot, ign); for (const [a, b] of footTiles(f.k, x, y, rot)) { if (!inMap(a, b, m)) continue; const [sx, sy] = iso(a, b); const col = ok ? 'rgba(120,220,140,0.45)' : 'rgba(240,90,90,0.45)'; for (let r2 = 0; r2 < 8; r2++) prect(g, sx - 16 + r2 * 2, sy + r2, 32 - r2 * 4, 1, col), prect(g, sx - 16 + r2 * 2, sy + 15 - r2, 32 - r2 * 4, 1, col); } };
  if (d.placing && d.hover) show(d.placing, d.hover[0], d.hover[1], d.placing.rot || 0);
  else if (d.drag && d.drag.moved && d.drag.o) show(d.drag.f, d.drag.o.x, d.drag.o.y, d.drag.f.rot || 0, d.drag.f.id);
  else if (d.sel) { const f = S.furn.placed.find(o => o.id === d.sel); if (f) show(f, f.x, f.y, f.rot || 0, f.id); }
};

/* ---------------- 가구 상호작용 · 형사님 반응 ---------------- */
async function furnAction(o) {
  const F = FURN[o.k], P = G.player, c = casualOn(), d = G.det, withDet = d.visible && d.map === P.map && dist(d, P) < 5 && S.rel.flags.met;
  switch (F.act) {
    case 'sleep': interiorAction('sleep'); return;
    case 'cook': interiorAction('cook'); return;
    case 'tv': interiorAction('tv'); return;
    case 'wardrobe': wardrobeMenu('p'); return;
    case 'sit': {
      const front = (o.rot || 0) < 2; P.stop(); P.seatFurn = o; o.front = front; P.pose = 'sit'; P.x = o.x + 0.5; P.y = o.y + 0.5;
      const fv = [[0, 1], [1, 0], [0, -1], [-1, 0]][o.rot || 0]; P.faceTo(fv[0], fv[1]);
      toast('🪑 앉았어요 (다시 누르면 일어나요)'); memPref('act', 'sit');
      if (withDet && !S.rel.daily.sofaTalk && o.k.startsWith('sofa')) { S.rel.daily.sofaTalk = true; runEvent(async () => { await say('det', 'smile', S.rel.flags.married ? '여보, 옆자리 비었지? 나도 앉을래.' : c ? '오, 소파 편해 보인다. 옆에 앉아도 돼?' : '오, 소파 바꾸셨네요. 앉아봐도 됩니까?'); addAff(1); }); }
      return;
    }
    case 'eat': runEvent(async () => {
      const food = ['lunchbox', 'porridge', 'songpyeon', 'watermelon', 'tangerine', 'snack'].find(k => S.inv[k] > 0);
      if (food) { S.inv[food]--; await say('narr', '', `🍽 ${ITEMS[food].icon} ${ITEMS[food].name}을(를) 맛있게 먹었다.`); memPref('food', food); if (withDet) { await say('det', 'laugh', c ? '나도 한 입만. …역시 같이 먹으니까 더 맛있다.' : '저도 한 입만요. 같이 먹으니까 더 맛있네요.'); if (!S.rel.daily.eatHome) { S.rel.daily.eatHome = true; addAff(2); } } }
      else await say('narr', '', '식탁에 앉아 따뜻한 보리차를 한 잔 마셨다. (먹을 것이 있으면 식사할 수 있어요)');
      advanceTime(20);
    }); return;
    case 'read': runEvent(async () => { await say('narr', '', pick(['📖 『해월도 바다 생물 도감』 — 문어는 심장이 세 개래.', '📖 『섬마을 요리책』 — 보말 칼국수 레시피에 밑줄을 그었다.', '📖 『별자리 이야기』 — 여름밤 은하수 아래 견우와 직녀.', '📖 『형사 수첩 쓰는 법』 — …누가 꽂아 둔 거지?'])); if (withDet) await say('det', 'tease', c ? '그 책 재밌어? 다 읽으면 나도 빌려줘.' : '그 책 재밌어요? 다 읽으면 저도 빌려주세요.'); advanceTime(30); }); return;
    case 'photo': runEvent(async () => {
      const f = S.furn.placed.find(x => x.id === o.id), a = f && f.photo && S.album.find(x => x.id === f.photo);
      if (a && a.img) { $('#zoomImg').src = a.img; $('#zoomCap').textContent = `${a.title} — ${a.date}`; $('#zoom').classList.remove('hidden'); }
      else await say('narr', '', o.k === 'chest' ? '보물 상자. 안에는 옛 해월도 사진과 편지가 소중히 들어 있다.' : '액자 속 풍경을 한참 바라봤다.');
      if (withDet) await say('det', 'laugh', a ? (c ? '아, 이 사진 여기 걸어놨네? 볼 때마다 웃기네.' : '이 사진 여기 걸어놨네요? 하하, 볼 때마다 웃기겠습니다.') : (c ? '이거 보면 그날 생각난다.' : '이거 보면 그날 생각나네요.'));
    }); return;
  }
}
/* 형사님이 집에 들어오면 새 가구를 알아본다 */
async function detFurnReact() {
  const c = casualOn(), seen = S.furnSeen, out = [];
  for (const f of S.furn.placed) if (!seen[f.id]) out.push(f);
  for (const f of out) seen[f.id] = S.day;
  const pickF = (pred) => out.find(pred);
  const lines = [];
  const fr = pickF(f => f.k === 'frame4' && f.photo); if (fr) lines.push(c ? '어, 이 사진 여기 걸어놨네? 하하, 볼 때마다 웃기겠다.' : '이 사진 여기 걸어놨네요? 하하, 볼 때마다 웃기겠습니다.');
  const sf = pickF(f => f.k.startsWith('sofa')); if (sf) lines.push(c ? '오, 소파 새로 들였네? 앉아 봐도 되지?' : '오, 소파 바꾸셨네요. 앉아봐도 됩니까?');
  const mg = pickF(f => f.k === 'mugs'); if (mg) lines.push(c ? '어라, 이거 내 컵이야? 내 자리까지 생겼네.' : '어라, 이거 제 컵입니까? 제 자리까지 생겼네요.');
  const ch = pickF(f => f.k === 'chest' || f.k === 'shipModel'); if (ch) lines.push(c ? '그 보물 여기 뒀구나. 우리 집 가보 1호다, 이거.' : '그 보물 여기 두셨네요. 집안 가보 1호네요.');
  const bd = pickF(f => f.k === 'bedCouple' || f.k === 'bedD'); if (bd) lines.push(S.rel.flags.married ? '침대 넓어졌다. 이제 이불 뺏기 싸움 안 해도 되겠네.' : c ? '침대가 엄청 넓네… 아, 아무 생각 안 했어. 진짜로.' : '침대가 넓네요… 아, 아무 생각 안 했습니다.');
  if (!lines.length && out.length) lines.push(c ? `${FURN[out[0].k].name} 새로 샀어? 집이 점점 예뻐진다.` : `${FURN[out[0].k].name} 새로 들이셨네요? 집이 점점 예뻐지네요.`);
  for (const l of lines.slice(0, 2)) await say('det', 'smile', l);
  if (S.rel.flags.married && S.furn.placed.length >= 14 && !S.rel.flags.moreStuff) { S.rel.flags.moreStuff = true; await say('det', 'tease', '이제 내 물건보다 네 물건이 더 많아진 것 같은데? 하하.'); }
  return lines.length;
}
/* 결혼 후 — 형사님이 집 안 가구를 실제로 사용 */
function marriedHomeUpdate(dt) {
  const d = G.det; if (d.map !== 'in_home' || d.state !== 'sched' || d.talking || G.busy) return;
  d.homeT = (d.homeT || 0) - dt;
  if (d.path.length || d.homeT > 0) return;
  const h = S.min / 60, list = MAPS.in_home.objects.filter(o => o.kind === 'furn');
  const want = h < 8 ? ['kitchen', 'diningT', 'table', 'dining'] : h >= 21.5 || h < 6 ? ['bed', 'bedD', 'bedCouple', 'bedS'] : ['sofa2', 'sofa', 'tv', 'shelf', 'kitchen', 'desk'];
  const cands = list.filter(o => want.includes(o.k)); const o = cands.length ? pick(cands) : null;
  if (d.seatFurn) { d.seatFurn = null; d.pose = 'stand'; }
  d.homeT = rand(14, 26);
  if (!o) { d.left = !d.left; return; }
  const tiles = footTiles(o.k, o.x, o.y, o.rot || 0), adj = [];
  for (const [a, b] of tiles) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (walkable(a + da, b + db, MAPS.in_home)) adj.push([a + da, b + db]);
  if (!adj.length) return;
  const [tx, ty] = pick(adj); d.walkTo(tx + 0.5, ty + 0.5);
  d.onArrive = () => {
    d.lookAt({ x: o.x + 0.5, y: o.y + 0.5 });
    const F = FURN[o.k];
    if (F.seat || F.sleep) { d.seatFurn = o; o.front = (o.rot || 0) < 2; d.pose = 'sit'; d.x = o.x + 0.5; d.y = o.y + 0.5; }
    d.say(F.sleep ? '하암… 먼저 누울게.' : o.k === 'kitchen' ? pick(['계란 두 개면 되지?', '오늘 아침은 내가 한다.']) : F.seat ? pick(['아이고, 소파 최고.', '여보, 이리 와. 같이 앉자.']) : o.k === 'tv' ? '일기예보 보자.' : o.k === 'shelf' ? '이 책 또 읽어야지.' : pick(['집이 제일 좋다.', '오늘 뭐 먹을까?']), 3);
  };
}
