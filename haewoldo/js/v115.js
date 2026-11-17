/* =====================================================================
   v1.15 — 저장 · 물리 · 놀이터 · 침대
   ===================================================================== */
/* ---------- 섬 · 일터 편집: 바꿀 때마다 자동 저장 (앱을 그냥 꺼도 남게) ---------- */
function devAutoSave() {
  DEVDATA.savedAt = Date.now(); const txt = JSON.stringify(DEVDATA);
  try { localStorage.setItem(DEV_KEY, txt); return true; } catch (e) { }
  // 저장 공간이 꽉 찼으면: 편집 백업부터 비우고, 그래도 안 되면 앨범 사진 몇 장을 줄여 자리 만들기 (게임 저장과 같은 방식)
  try { localStorage.removeItem(DEV_BAK); localStorage.setItem(DEV_KEY, txt); return true; } catch (e) { }
  if (S && S.album) for (let i = 0; i < 12; i++) {
    const k = S.album.findIndex(a => a.img && !a.fav), k2 = k >= 0 ? k : S.album.findIndex(a => a.img); if (k2 < 0) break;
    S.album[k2].img = null; S.album[k2].lost = true; try { save(); localStorage.setItem(DEV_KEY, txt); toast('📦 저장 공간이 부족해 오래된 사진 일부를 정리했어요'); return true; } catch (e) { }
  }
  if (!G._devSaveWarn) { G._devSaveWarn = true; toast('⚠ 저장 공간이 부족해 꾸민 내용을 저장하지 못했어요'); }
  return false;
}
const _devRebuild115 = devRebuild;
devRebuild = function () { const r = _devRebuild115.apply(this, arguments); if (G.dev) devAutoSave(); return r; };
const _appPause115 = appPause;
appPause = function () { if (G.dev) devAutoSave(); return _appPause115.apply(this, arguments); };
devExit = function () {
  const d = G.dev; if (!d) return;
  if (!d.dirty) { devStop(false); return; }
  openSheet({ title: '편집을 끝낼까요?', sub: '<div class="relneed">바꾼 내용은 자동으로 저장돼 있어요.</div>', cols: 3, items: [
    { icon: '✅', label: '이대로 끝내기', onClick: () => devStop(true) },
    { icon: '↩', label: '편집 전으로 되돌리기', onClick: () => { devStop(false); devAutoSave(); } },
    { icon: '✏️', label: '계속 편집', onClick: () => { } }] });
};
window.addEventListener('pagehide', () => { if (G.dev) devAutoSave(); });
window.addEventListener('beforeunload', () => { if (G.dev) devAutoSave(); try { if (S && G.started) save(); } catch (e) { } });
/* 집 꾸미기 중 바뀐 배치도 바로 저장 (꾸미기 창을 닫기 전에 앱을 꺼도 남게) */
let _decorSaveT = 0;
const _setFurniture115 = setFurniture;
setFurniture = function (m) {
  const lying = m ? G.actors.filter(a => a._bedLie && a.seatFurn && a.map === m.id).map(a => [a, a.seatFurn.id, a.seatFurn.k, a._bedLie.side]) : [];
  const r = _setFurniture115.apply(this, arguments);
  for (const [a, id, k, side] of lying) { const o = m.objects.find(q => q.kind === 'furn' && ((id != null && q.id === id) || (id == null && q.k === k)) && isBedFurn(q)); if (o) bedLay(a, o, side); else { a.seatFurn = null; bedUnlay(a); } } if (G.decor && m && m.id === 'in_home') { clearTimeout(_decorSaveT); _decorSaveT = setTimeout(() => { try { save(); } catch (e) { } }, 400); } return r; };

/* ---------- 침대: 누워 있기 · 누워서 폰 보기 · 낮잠 · 같이 눕기 ---------- */
PX_ITEMS.phone = PX_ITEMS.phone || ((P) => { P(5, 2, 6, 12, '#2b2f3a'); P(6, 3, 4, 9, '#8fd0f2'); P(6, 3, 4, 2, '#cfeaf8'); P(7, 13, 2, 1, '#5b5f69'); });
const isBedFurn = (o) => o && o.kind === 'furn' && FURN[o.k] && FURN[o.k].sleep;
function bedLay(a, o, side = 0) {
  const fw = o.fw || 1, fh = o.fh || 1, r = (o.rot || 0) & 3, fv = FACE_V[r], per = [Math.abs(fv[1]), Math.abs(fv[0])];
  const wide = (r & 1) ? fh : fw, sOff = wide >= 2 ? 0.5 : 0.22;
  a.stop(); a.seatFurn = o; a.pose = 'sit'; a._bedLie = { side };
  a.x = o.x + fw / 2 + per[0] * side * sOff - fv[0] * 0.15; a.y = o.y + fh / 2 + per[1] * side * sOff - fv[1] * 0.15;
  const sxv = fv[0] - fv[1], syv = (fv[0] + fv[1]) / 2; a.lie = Math.atan2(-sxv, syv) / (Math.PI / 2); a.oy = -2;
}
function bedUnlay(a) {
  a._bedLie = null; a.lie = 0; a.oy = 0; a.zzz = false; if (a.prop === 'phone') a.prop = null;
  const m = MAPS[a.map]; if (m && !walkable(Math.floor(a.x), Math.floor(a.y), m)) [a.x, a.y] = nearestWalkable(a.x, a.y, m);
}
/* 누운 사람: 침대를 옮기면 따라가고, 일어나면 바로 바닥으로 */
function bedTick() {
  for (const a of G.actors) {
    if (!a._bedLie) { if (a.seatFurn && isBedFurn(a.seatFurn) && a !== G.player) bedLay(a, a.seatFurn, a === G.det ? 1 : -1); continue; }
    if (!a.seatFurn || !isBedFurn(a.seatFurn)) { bedUnlay(a); continue; }
    const o = a.seatFurn, m = MAPS[a.map]; if (m && !m.objects.includes(o)) { a.seatFurn = null; bedUnlay(a); continue; }
    bedLay(a, o, a._bedLie.side);
  }
}
/* 누워서 폰: 폰은 얼굴 위에 */
const _drawActor115 = drawActor;
drawActor = function (g, a, sx, sy) {
  if (!a._bedLie || a.prop !== 'phone') return _drawActor115(g, a, sx, sy);
  a.prop = null; _drawActor115(g, a, sx, sy); a.prop = 'phone';
  const th = a.lie * Math.PI / 2, X = sx + (a.ox || 0) + 12 * Math.sin(th), Y = sy + (a.oy || 0) - 10 - 12 * Math.cos(th) - 7;
  g.drawImage(propCanvas('phone'), SX(X - 4), SY(Y - 4), 8 * R.K, 8 * R.K);
};
const BED_LIE = ['이불 속으로 쏙 들어갔다. 바스락거리는 소리가 좋다.', '천장을 보며 멍하니 누워 있었다. 창밖에서 갈매기 소리가 들린다.', '베개에 얼굴을 묻고 오늘 있었던 일을 하나씩 떠올렸다.', '뒹굴뒹굴. 아무것도 안 하는 시간도 필요하다.', '이불을 돌돌 말고 누웠다. 김밥이 된 기분이다.', '창으로 들어온 햇빛이 이불 위에 네모나게 앉았다. 따뜻하다.', '파도 소리를 세다가 스물까지 세고 잊어버렸다.'];
const BED_LIE_RAIN = ['빗소리를 들으며 이불을 끌어올렸다. 세상에서 제일 아늑한 곳.', '창문을 두드리는 빗방울 소리. 오늘은 이대로 있고 싶다.'];
const BED_LIE_NIGHT = ['창밖으로 별이 보인다. 이대로 잠들어도 좋겠다.', '멀리 등대 불빛이 천장을 천천히 한 바퀴 돌고 간다.'];
const BED_PHONE = ['섬 단톡방을 내려 봤다. 순덕 할머니가 귤 사진을 열두 장 올리셨다. 🍊', '날씨 앱을 켰다. 내일도 바다는 잔잔하대.', '해월도 소식 게시판: 「등대 앞 고양이가 새끼를 낳았어요」 — 귀엽다.', '좋아하는 노래를 틀어 놓고 천장을 봤다. 파도 소리가 반주처럼 깔린다.', '쇼핑 앱 장바구니에 커튼을 넣었다 뺐다 했다.', '고양이 영상을 보다가 시간 가는 줄 몰랐다.', '내일 할 일을 메모장에 적었다. 별거 없는데 괜히 뿌듯하다.', '레시피 영상을 저장했다. 귤 잼… 언젠가 만들어 봐야지.', '육지 친구한테 바다 사진을 보냈다. 「부럽다!!!」 답장이 바로 왔다.'];
function bedMenu(o) {
  const P = G.player, F = FURN[o.k], lying = P.seatFurn === o && P._bedLie, home = M.id === 'in_home', r = S.rel;
  const d = G.det, detHere = d.visible && d.map === P.map && S.rel.flags.met && !d.scripted && dist(d, P) < 7;
  const close = r.stage >= 5 || r.flags.married, items = [];
  const add = (icon, label, fn, ok = true, why) => items.push({ icon, label, onClick: fn, disabled: !ok, why });
  if (lying) add('🧍', '일어나기', () => { standUpPlayer(); });
  add('🛌', '누워 있기', () => bedRest(o, 'lie'));
  add('📱', '누워서 폰 보기', () => bedRest(o, 'phone'));
  if (detHere && close && home) add('💞', '같이 누워 있기', () => bedRest(o, 'together'), (o.fw || 1) * (o.fh || 1) >= 4, '둘이 눕기엔 좁아요 — 더블 · 커플 침대에서 같이 누워요');
  if (home && S.min >= 18 * 60) add('🌙', '잠자기 (하루 마치기)', () => { standUpPlayer(); interiorAction('sleep'); });
  else add('💤', '한숨 자기 (1시간)', () => bedRest(o, 'nap'));
  openSheet({ title: `🛏 ${F.name}`, sub: '<div class="relneed">포근한 침대. 잠깐 누워서 쉬어 가요.</div>', items, cols: 3 });
}
function bedRest(o, kind) {
  runEvent(async () => {
    const P = G.player, d = G.det, c = casualOn(), r = S.rel;
    if (P.seatFurn !== o) { if (P.seat) P.standUp(); if (P.seatFurn) standUpPlayer(); }
    bedLay(P, o, kind === 'together' ? -1 : 0);
    if (kind === 'lie') {
      await say('narr', '', pick(rainy() ? BED_LIE_RAIN.concat(BED_LIE) : isNight() ? BED_LIE_NIGHT.concat(BED_LIE) : BED_LIE));
      if (d.visible && d.map === P.map && r.flags.married && dist(d, P) < 7 && !d._bedLie) await say('det', 'smile', pick(['[[누워 계시니까 저도 눕고 싶네요.||너 누워 있으니까 나도 눕고 싶다.]]', '[[편해 보여요. 이불 덮어 드릴까요?||편해 보이네. 이불 덮어 줄까?]]']));
      advanceTime(20);
    } else if (kind === 'phone') {
      P.prop = 'phone';
      await say('narr', '', pick(BED_PHONE.concat(S.album && S.album.length ? [`사진첩을 넘기다가 ${josa(himCall(), "이랑", "랑")} 찍은 사진에서 손가락이 멈췄다. 혼자 웃음이 났다.`] : [])));
      const away = !(d.visible && d.map === P.map);
      if (r.flags.met && r.stage >= 3 && away && !r.daily.bedMsg) {
        r.daily.bedMsg = true;
        await say('narr', '', `📱 ${himCall()}한테 메시지가 왔다. 「${c ? pick(['뭐 해? 난 순찰 중. 바다 색 예쁘다.', '점심은 먹었어? 갑자기 생각나서.', '오늘 저녁에 잠깐 볼래?']) : pick(['뭐 하세요? 저는 순찰 중이에요.', '점심은 드셨어요? 갑자기 생각나서요.', '오늘 바다 색이 예뻐서 연락했어요.'])}」`);
        const ch = await choose(['💗 하트 보내기', '📷 지금 내 방 사진 보내기', '😌 읽고 미소만 짓기']);
        if (ch < 2) { addAff(1); await say('narr', '', ch === 0 ? `금방 답장이 왔다. 「${c ? '…하트 하나에 오늘 기운 다 찼다.' : '하트… 감사합니다. 힘이 나네요.'}」` : `「${c ? '이불 색 예쁘다. 나중에 나도 거기 누워 봐도 돼?' : '방이 아늑하네요. 쉬는 중이셨구나.'}」`); }
      }
      advanceTime(25); P.prop = null;
    } else if (kind === 'nap') {
      P.zzz = true; await say('narr', '', '스르르 눈이 감긴다… 💤'); await fade(true); advanceTime(60); await sleep(300); await fade(false); P.zzz = false;
      await say('narr', '', pick(['한숨 푹 잤다. 개운하다!', '짧게 잤는데도 몸이 가볍다.', '꿈에서 바다를 날아다녔다. 기분 좋은 낮잠.']));
    } else if (kind === 'together') {
      scriptDet(); bedLay(d, o, 1);
      await say('det', 'blush', pick(['[[…옆에 누워도 되죠? 이렇게 있으니까 좋네요.||…옆에 누워도 되지? 이렇게 있으니까 좋다.]]', '[[아무것도 안 하고 같이 누워 있는 거, 이게 제일 좋아요.||아무것도 안 하고 같이 누워 있는 거, 이게 제일 좋아.]]']));
      await say('narr', '', pick(['나란히 누워 천장을 봤다. 서로 숨소리가 들린다.', '형사님이 손을 슬쩍 잡았다. 따뜻하다.', '창밖 파도 소리를 같이 들었다. 말 안 해도 편하다.']));
      await say('det', 'smile', pick(['[[오늘 하루 어땠어요? 천천히 얘기해 줘요.||오늘 하루 어땠어? 천천히 얘기해 줘.]]', '[[주말엔 이렇게 늦잠 자요. 약속.||주말엔 이렇게 늦잠 자자. 약속.]]']));
      burst(d, 'heart', 4); burst(P, 'heart', 3); addAff(2); advanceTime(30);
      if (typeof memRecent === 'function') memRecent('bed', '침대에 나란히 누워 쉬었다');
      d.seatFurn = null; bedUnlay(d);
    }
  });
}
const _furnAction115 = furnAction;
furnAction = function (o) { if (isBedFurn(o) && !(FURN[o.k].act && FURN[o.k].act !== 'sleep')) return bedMenu(o); return _furnAction115.apply(this, arguments); };
const _computeAction115 = computeAction;
computeAction = function () {
  const a = _computeAction115.apply(this, arguments);
  const fix = (x) => { if (x && x.label === '잠자기') { x.label = '침대'; x.icon = '🛏'; } return x; };
  if (a && a.cands) a.cands.forEach(fix); else fix(a);
  return a;
};
/* 결혼 후 형사님이 침대 · 소파에서 일어날 때 가구 속에 서 있지 않게 */
const _marriedHomeUpdate115 = marriedHomeUpdate;
marriedHomeUpdate = function (dt) {
  const d = G.det, o = d.seatFurn;
  _marriedHomeUpdate115(dt);
  if (o && !d.seatFurn && d.map === 'in_home') { if (d._bedLie) bedUnlay(d); const m = MAPS.in_home; if (!walkable(Math.floor(d.x), Math.floor(d.y), m)) { const st = seatStand(o, m, Math.floor(d.x), Math.floor(d.y)); [d.x, d.y] = st ? [st[0] + 0.5, st[1] + 0.5] : nearestWalkable(d.x, d.y, m); if (d.path && d.path.length && d.onArrive) { const tgt = d.path[d.path.length - 1], cb = d.onArrive; d.walkTo(tgt[0], tgt[1]); d.onArrive = cb; } } }
};
/* 일어나기: 침대 · 의자 앞 빈 칸으로 */
const _standUpPlayer115 = standUpPlayer;
standUpPlayer = function () { const P = G.player; if (P.seatFurn) { const o = P.seatFurn; standFromFurn(P); if (P._bedLie) bedUnlay(P); return; } return _standUpPlayer115.apply(this, arguments); };
const _loop115 = loop;
loop = function (ts) { if (G.started && S) { try { bedTick(); } catch (e) { } } return _loop115(ts); };

/* ---------- 놀이터: 기구 그림 어디를 눌러도 그 기구로 · 버튼 이름도 기구 이름으로 ---------- */
const PG_RIDE = { swingSet: 'swing', slide: 'slide', springRider: 'spring', seesaw: 'seesaw', merry: 'merry' };
const PG_LABEL = { swing: ['🎠', '그네 타기'], slide: ['🛝', '미끄럼틀 타기'], spring: ['🐴', '흔들말 타기'], seesaw: ['⚖️', '시소 타기'], merry: ['🌀', '뺑뺑이 타기'] };
function pgRideAt(px, py) {
  if (M.id !== 'island') return null;
  const { wx, wy, tx, ty } = screenToWorld(px, py), ix = Math.floor(tx), iy = Math.floor(ty);
  let best = null, bk = -1e9, tile = null;
  for (const o of M.objects) {
    const k = PG_RIDE[o.kind]; if (!k || !M.benches[k]) continue;
    const key = o.x + o.y + (o.fw || 1) + (o.fh || 1);
    const sp = objSprite(o); if (sp) {
      const [sx, sy] = iso(o.x + 0.5, o.y + 0.5), lx = Math.floor(wx - (sx - sp.ax)), ly = Math.floor(wy - (sy - sp.ay));
      if (lx >= 0 && ly >= 0 && lx < sp.c.width && ly < sp.c.height) {
        if (key > bk) { bk = key; best = k; }
      }
    }
    if (!tile && ix >= o.x && ix < o.x + (o.fw || 1) && iy >= o.y && iy < o.y + (o.fh || 1)) tile = k;
  }
  return tile || best;
}
function pgGo(k) {
  const bk = M.benches[k], P = G.player;
  let si = bk.stand.findIndex((s, i) => seatFree('island', k, i, P.id)); if (si < 0) si = 0;
  const st = bk.stand.slice().map((s, i) => [s, i]).sort((a, b) => Math.hypot(a[0][0] + 0.5 - P.x, a[0][1] + 0.5 - P.y) - Math.hypot(b[0][0] + 0.5 - P.x, b[0][1] + 0.5 - P.y)).find(([s, i]) => seatFree('island', k, i, P.id));
  const s = st ? st[0] : bk.stand[si];
  walkPlayer(s[0] + 0.5, s[1] + 0.5, () => benchAction(k));
}
const _onTap115 = onTap;
onTap = function (px, py) {
  if (G.started && !paused() && !G.busy && !G.decor && !G.dev && !G.yard && !G.fishing && !G.working && M && M.id === 'island') {
    const P = G.player;
    if (!(P.seat && MAPS.island.benches[P.seat.bench] && MAPS.island.benches[P.seat.bench].play)) {
      const k = pgRideAt(px, py);
      if (k) { let hitActor = false; for (const a of G.actors) { if (a === P || !a.visible || a.map !== M.id) continue; const [sx, sy] = iso(a.x, a.y), w = screenToWorld(px, py); if (w.wx > sx - 11 && w.wx < sx + 11 && w.wy > sy - 34 && w.wy < sy + 4) hitActor = true; } if (!hitActor) { if (P.seatFurn) standUpPlayer(); pgGo(k); return; } }
    }
  }
  return _onTap115(px, py);
};
computeAction = (function (prev) {
  return function () {
    const a = prev.apply(this, arguments);
    const fix = (x) => {
      if (!x || !/앉기$/.test(x.label) || M.id !== 'island') return x;
      const P = G.player;
      for (const [k, bk] of Object.entries(M.benches)) if (bk.play && PG_LABEL[k] && bk.stand.some(s => Math.hypot(P.x - s[0] - 0.5, P.y - s[1] - 0.5) < 0.9)) { x.icon = PG_LABEL[k][0]; x.label = PG_LABEL[k][1]; break; }
      return x;
    };
    if (a && a.cands) a.cands.forEach(fix); else fix(a);
    return a;
  };
})(computeAction);

/* =====================================================================
   v1.16 — 섬 · 일터 편집으로 옮긴 물건의 기능이 새 자리로 따라가게
   · 네컷 부스 · 배 시간표 · 텐트 · 바비큐 그릴 · 모닥불 · 돗자리 · 정자 · 망원경 · 낚시 의자
     → 위치를 기억하는 지점(POI) · 장소 범위를 물건이 옮긴 만큼 같이 옮김
   · 일터 근무 자리(카운터 · 칠판 · 진료 책상 · 손질대)와 손님 줄 서는 자리도 가구를 따라감
   ===================================================================== */
const OBJ_LINKS = [
  { kind: 'booth', poi: ['booth'], place: ['booth'] },
  { kind: 'ticket', poi: ['ticket'] },
  { kind: 'tent', poi: ['tentA', 'tentB'] },
  { kind: 'grill', poi: ['grillCook'] },
  { kind: 'campfire', poi: ['campCenter', 'camp'] },
  { kind: 'mat', poi: ['picnic', 'picnicB'] },
  { kind: 'jeongjaBase', poi: ['pavilion'], place: ['pavilion'] },
  { kind: 'pavilion', poi: ['pavilion'], place: ['pavilion'] },
  { kind: 'telescope', poi: ['observatory'], place: ['observatory'] },
  { kind: 'fishChair', poi: ['manbokSeat'] },
];
const _poiBase = {}, _placeBase = {}, _poiMoved = new Set();
function objLinkApply(m) {
  if (!m || m.id !== 'island') return;
  const cen = (o, ox, oy) => [ox + (o._ofw || o.fw || 1) / 2, oy + (o._ofh || o.fh || 1) / 2];
  const nearest = (kind, p) => { let best = null, bd = 3.2; for (const o of m.objects) { if (o.kind !== kind || o._ox == null) continue; const [cx, cy] = cen(o, o._ox, o._oy), d = Math.hypot(cx - p[0], cy - p[1]); if (d < bd) { bd = d; best = o; } } return best; };
  for (const L of OBJ_LINKS) {
    for (const k of L.poi || []) {
      if (!Array.isArray(POI[k])) continue;
      if (!_poiBase[k] || !_poiMoved.has(k)) _poiBase[k] = POI[k].slice();
      const base = _poiBase[k], o = nearest(L.kind, base); if (!o) continue;
      const dx = o.x - o._ox, dy = o.y - o._oy;
      if (dx || dy) { POI[k] = nearestWalkable(base[0] + dx, base[1] + dy, m); _poiMoved.add(k); }
      else if (_poiMoved.has(k)) { POI[k] = base.slice(); _poiMoved.delete(k); }
    }
    for (const k of L.place || []) {
      const pl = m.places && m.places[k]; if (!pl || !pl.c) continue;
      if (!pl._c0) pl._c0 = pl.c.slice();
      const o = nearest(L.kind, pl._c0); if (!o) continue;
      pl.c = [pl._c0[0] + o.x - o._ox, pl._c0[1] + o.y - o._oy];
    }
  }
  if (POI.boatSpot) m.boatSpot = POI.boatSpot;
  // 마을버스: 정류장을 옮기면 내리는 자리도 새 정류장 앞으로
  if (m.stops) for (const o of m.objects) if (o.kind === 'busstop' && o.stop && o._ox != null && (o.x !== o._ox || o.y !== o._oy)) m.stops[o.stop] = nearestWalkable(o.x + 0.5, o.y + 1.5, m);
}
const _devApplyMap116 = devApplyMap;
devApplyMap = function (m, md) { const r = _devApplyMap116.apply(this, arguments); try { objLinkApply(m); } catch (e) { console.error('[objLink]', e); } return r; };

/* 일터: 근무 자리 · 줄 서는 자리를 근무용 가구(카운터 · 칠판 · 진료 책상 · 손질대) 위치에 맞춤 */
function workAnchor(W) {
  const m = MAPS[W.map]; if (!m) return null;
  return m.objects.find(o => o.kind === 'furn' && ['order', 'work', 'prep'].includes(o.act)) || null;
}
for (const W of Object.values(WORKS)) {
  const st0 = W.station.slice(), q0 = (W.queue || []).map(q => q.slice());
  const delta = () => { const o = workAnchor(W); return o && o._ox != null ? [o.x - o._ox, o.y - o._oy] : [0, 0]; };
  Object.defineProperty(W, 'station', { configurable: true, get() { const [dx, dy] = delta(); return [st0[0] + dx, st0[1] + dy]; } });
  Object.defineProperty(W, 'queue', { configurable: true, get() { const [dx, dy] = delta(), m = MAPS[W.map]; return q0.map(q => { const x = q[0] + dx, y = q[1] + dy; return m && !walkable(Math.floor(x), Math.floor(y), m) ? nearestWalkable(x, y, m) : [x, y]; }); } });
}

/* =====================================================================
   v1.17 — 형사님은 「나」에게만 반말: 동네 어른 · 주민에게 하는 말은 존댓말 그대로
   · 말 상대가 어른인 장면(바로 앞에 주민이 말함 · 「할머니,」처럼 부르는 말 · 엿보기 장면)에서는
     반말 변환기를 쓰지 않음
   · 대사를 [[존댓말||반말]] 두 가지로 직접 써 둔 건 변환하지 않음
   · 말풍선: 높임말(-시- · -세요 · 드릴게요 …)이 들어 있거나 주민과 수다 중이면 그대로
   ===================================================================== */
const DET_VOC = /(^|[\s…,.!?"「])(순덕 |옥자 |귤밭 |슈퍼 |등대지기 |박 씨 |만복 |목장 |농장 |횟집 |우체부 )?(할머니|할머님|할아버지|할아버님|어르신|이장님|아저씨|아주머니|이모님|이모|사장님|삼촌|아버님|어머님|선배님)(,|!|~|\?|…| 진정| 오늘| 다음| 이거| 제가| 저| 걱정| 고맙| 감사| 죄송| 괜찮| 안녕| 천천히| 조심| 들어| 여기| 그건| 혹시| 너무| 어디| 무거)/;
const DET_HON = /(으?시[는면고던지네죠겠잖]|으?셨|으?세요|드릴게요|드릴까요|드려요|드렸어요|드세요|습니다|십시오|진지|께서|여쭤)/;
const voiceOfActor = (id) => { const a = G.actors && G.actors.find(x => x.id === id); const vid = a ? (a.vid || a.id) : id; if ((a && a.look && a.look.kid) || (NPC_LOOKS[vid] && NPC_LOOKS[vid].kid)) return 'kid'; return typeof voiceOf === 'function' ? voiceOf(vid) : 'polite'; };
function detToOthers(text) {
  if (typeof text !== 'string') return false;
  if (text.indexOf('[[') >= 0) return true;                          // 두 말투를 직접 써 둔 대사
  if (G._peeking) return true;                                        // 엿보기: 형사님이 다른 사람과 있는 장면
  const t = speechPick(text);
  if (DET_VOC.test(t)) return true;                                   // 「할머니,」 「아저씨!」처럼 어른을 부름
  if (G._ctxOther && voiceOfActor(G._ctxOther) !== 'kid') return true;  // 바로 앞에 어른 주민이 말함
  return false;
}
const _say117 = say;
say = function (who, expr, text) {
  if (who !== 'narr' && who !== 'det' && who !== 'me') G._ctxOther = who;
  else if (who === 'me') G._ctxOther = null;
  if (who === 'det' && !G.rawSpeech && detToOthers(text)) { G.rawSpeech = true; try { return _say117(who, expr, text); } finally { G.rawSpeech = false; } }
  return _say117(who, expr, text);
};
const _runEvent117 = runEvent;
runEvent = async function () { try { return await _runEvent117.apply(this, arguments); } finally { if (!G.busy) G._ctxOther = null; } };
const _closeDialog117 = closeDialog;
closeDialog = function () { const r = _closeDialog117.apply(this, arguments); if (!G.busy) G._ctxOther = null; return r; };
/* 엿보기 장면 */
if (typeof doPeek === 'function') { const _doPeek117 = doPeek; doPeek = async function () { G._peeking = true; try { return await _doPeek117.apply(this, arguments); } finally { G._peeking = false; } }; }
/* 말풍선 */
const _actorSay117 = Actor.prototype.say;
Actor.prototype.say = function (text, t) {
  if (this.id === 'det' && typeof text === 'string' && casualOn()) {
    const s = speechPick(text), chat = G.detAuto && G.detAuto.kind === 'chat';
    if (text.indexOf('[[') >= 0 || chat || G._peeking || G._detToOther || DET_VOC.test(s) || DET_HON.test(s)) { const c = casualOn; casualOn = () => false; try { return _actorSay117.call(this, s, t); } finally { casualOn = c; } }
  }
  return _actorSay117.call(this, text, t);
};

/* 일터 손님: 동네 주민이 손님으로 오면 그 사람 말투로 (어르신 · 아저씨 · 젊은 어른) */
const CUST_V = {
  elder: { thanks: ['아이고, 맛있다. 또 올게~', '이 집 커피가 할미 입에도 맞네. 호호.', '잘 마셨어. 장사 잘 되거라~'], wrong: ['어? 이거 시킨 거 아닌데… 뭐, 아무거나 괜찮아.', '아이고, 바꿔 줬네. 괜찮아, 마시지 뭐.'], leave: ['아이고, 오래 걸리네. 다음에 올게.', '바쁜가 보네. 이따 또 올게~'], chat: ['여기 앉아 있으니 좋다~', '젊은 사람이 장사를 참 잘하네.', '오늘 바람이 좋아.'], buyer: ['물 좋은 걸로 골라 줘~', '요즘 바다는 어때? 많이 나와?'], buyLeave: '없으면 할 수 없지. 다음에 올게.', buyOk: ['아이고, 싱싱하다. 고마워~', '이거면 저녁 반찬 걱정 없다.'] },
  adult: { thanks: ['오, 맛있네. 또 올게.', '여기 커피 괜찮네. 자주 와야겠다.', '잘 마셨어. 수고해~'], wrong: ['어? 이거 내가 시킨 거 아닌데… 뭐, 마시지.', '이것도 맛있겠지, 뭐.'], leave: ['너무 오래 걸리네. 다음에 올게.', '바쁜가 보네. 이따 다시 올게.'], chat: ['여기 분위기 좋네.', '오늘 날씨 좋지?'], buyer: ['물 좋은 걸로 골라 줘.', '요즘 바다 어때?'], buyLeave: '없으면 할 수 없지. 다음에 올게.', buyOk: ['역시 싱싱하네. 고마워!', '값 넉넉히 쳐 줬어. 또 부탁해.'] },
  polite: { buyer: ['싱싱한 걸로 골라 주세요.', '요즘 바다는 어때요?'], buyLeave: '없으면 할 수 없죠. 다음에 올게요.', buyOk: ['와, 정말 싱싱해요. 감사합니다!', '이거면 오늘 저녁 걱정 없겠어요.'] },
  kid: { thanks: ['우와, 맛있어요! 또 올게요!'], chat: ['저 이거 처음 먹어 봐요!'], buyer: ['엄마가 조개 사 오래요!'], buyLeave: '없어요? 그럼 다음에 올게요!', buyOk: ['감사합니다! 엄마가 좋아하겠다!'] },
};
const _custActorSay117 = Actor.prototype.say;
Actor.prototype.say = function (text, t) {
  if (this.isCustomer && this.vSrc && typeof text === 'string' && typeof voiceOf === 'function') {
    const V = CUST_V[voiceOf(this.vSrc.vid || this.vSrc.id)];
    if (V) {
      const swap = (arr, key) => (arr && arr.includes(text) && V[key] ? pick(V[key]) : null);
      const r = swap(CAFE_THANKS, 'thanks') || swap(CAFE_WRONG, 'wrong') || swap(CAFE_LEAVE, 'leave') || swap(CUST_CHAT.cafe, 'chat') || swap(CUST_CHAT.buyer, 'buyer')
        || (text === '다음에 또 올게.' || text === '없으면 할 수 없지. 다음에 올게.' ? V.buyLeave : null) || (['역시 싱싱하네. 고마워!', '이거면 오늘 저녁 반찬 걱정 없다.', '값 넉넉히 쳐 줬어. 또 부탁해.'].includes(text) && V.buyOk ? pick(V.buyOk) : null);
      if (r) text = r;
    }
  }
  return _custActorSay117.call(this, text, t);
};
devSave = function () { const ok = devAutoSave(); if (ok && G.dev) { G.dev.dirty = false; G.dev.start = JSON.stringify(DEVDATA); } return ok; };

/* v1.19 — 말풍선은 글자 수만큼 오래 (긴 말이 다 읽기 전에 사라지지 않게) */
const _bubbleSay119 = Actor.prototype.say;
Actor.prototype.say = function (text, t = 3.2) { const r = _bubbleSay119.call(this, text, t); if (this.bubble && this.bubble.text) this.bubble.t = Math.max(this.bubble.t, 1.6 + [...String(this.bubble.text)].length * 0.11); return r; };

/* =====================================================================
   v1.20 — 앉는 자리 물리 점검 2
   · 섬 편집 꾸미기 의자 · 벤치: 돌린 방향을 바라보고, 앞쪽 칸에서 일어나고, 벤치에 가려지지 않게(2칸 벤치 왼쪽 자리)
   · 실내(카페 · 식당 등)에 놓은 꾸미기 의자에도 자리 생성
   · 방석 · 좌식 자리: 손님 · 주민도 앉고, 상을 바라보며 바닥 높이로 앉음
   · 문 앞에 사람이 있어도 「들어가기」가 먼저
   ===================================================================== */
Object.assign(SEAT_KINDS, {
  yd_outdoorSofa: { n: 2, name: '야외 소파' }, yd_swing: { n: 2, name: '나무 그네' }, yd_inStool: { n: 1, name: '바 의자' },
  yd_beachChairs: { n: 2, name: '선베드' }, yd_terraceSet: { n: 2, name: '테라스 테이블', front: true },
});
const objDrawKey = (o) => o.x + o.y + (o.fw || 1) - 1 + (o.fh || 1) - 1 + 2;
autoSeats = function (m) {
  if (!m) { for (const mm of Object.values(MAPS)) if (mm && mm.benches && mm.objects && (mm.id === 'island' || mm.objects.some(o => o.kind === 'yd'))) autoSeats(mm); return; }
  if (!m.benches) m.benches = {};
  for (const k of Object.keys(m.benches)) if (m.benches[k].auto) delete m.benches[k];
  const W = m.W, taken = new Set(); for (const bk of Object.values(m.benches)) for (const s of [...bk.seats, ...bk.stand]) taken.add(s[0] + ',' + s[1]);
  const free = (x, y) => inMap(x, y, m) && !m.block[y * W + x] && tileAt(x, y, m) !== T.WATER && !taken.has(x + ',' + y) && !(m.exit && x === m.exit[0] && y === m.exit[1]);
  let i = 0;
  for (const o of m.objects) {
    const K = SEAT_KINDS[seatKindOf(o)]; if (!K) continue;
    const fw = o.fw || 1, fh = o.fh || 1, r = (o.rot || 0) & 3, fv = FACE_V[r], seats = [], stand = [], face = [], dd = [];
    const own = (x, y) => x >= o.x && x < o.x + fw && y >= o.y && y < o.y + fh;
    const cand = K.side ? [[o.x, o.y], [o.x + 1, o.y]] : (() => { const c = []; for (let yy = o.y; yy < o.y + fh; yy++) for (let xx = o.x; xx < o.x + fw; xx++) c.push([xx, yy]); return c; })();
    for (const [sx, sy] of cand) {
      if (seats.length >= K.n) break;
      if (taken.has(sx + ',' + sy)) continue;
      if (K.side && !(sx === o.x && sy === o.y) && !free(sx, sy)) continue;
      // 앞쪽(바라보는 쪽) 칸에서 일어나고, 없으면 옆 → 뒤
      const order = K.side ? [[sx, sy + 1], [sx + 1, sy], [sx - 1, sy], [sx, sy - 1]] : [[sx + fv[0], sy + fv[1]], [sx + fv[1], sy + fv[0]], [sx - fv[1], sy - fv[0]], [sx - fv[0], sy - fv[1]]];
      const st = order.find(([a, b]) => free(a, b) && !own(a, b) && !(a === o.x && b === o.y));
      if (!st) continue;
      seats.push([sx, sy]); stand.push(st); taken.add(sx + ',' + sy); taken.add(st[0] + ',' + st[1]);
      face.push(K.side ? 0 : r);
      // 그리는 순서: 앞을 보는 의자면 의자 바로 위, 뒤를 보는 의자면 등받이 뒤
      dd.push(K.ground ? sx + sy + 0.6 : K.side ? sx + sy + 2.3 : objDrawKey(o) + (r < 2 ? 0.05 : -0.05));
    }
    if (!seats.length) continue;
    const key = 'auto_' + (o.aid || o.uid || (o.kind + ':' + (o.k || '') + '@' + o.x + ',' + o.y)); i++;   // 다시 만들어도 같은 이름
    m.benches[key] = { name: K.name, place: m.id === 'island' ? placeAt(o.x, o.y, m) : null, seats, stand, face, d: dd, pairs: seats.length > 1 ? [[0, 1]] : [], auto: true, obj: o };
    if (K.leisure) m.benches[key].leisure = K.leisure;
    if (K.ground) m.benches[key].ground = true;
    for (const [a, b] of stand) m.block[b * W + a] = 0;
  }
  // 섬 편집으로 좌우를 뒤집은 기본 벤치: 바라보는 방향도 뒤집기
  for (const bk of Object.values(m.benches)) { if (bk.auto) continue; bk.seats.forEach(([sx, sy], idx) => { const ob = m.objects.find(q => q.kind === 'bench' && q.x === sx && q.y === sy); if (ob && bk.face) bk.face[idx] = ob.mirror ? 1 : 0; }); }
};
/* 방석 · 좌식 자리는 바닥 높이로 */
function floorSitTick() {
  for (const a of G.actors) {
    const fl = a.seatFurn && typeof isFloorSeat === 'function' && isFloorSeat(a.seatFurn) && !a._bedLie;
    if (fl && !a._floorOy) { a._floorOy = true; a.oy = 4; floorSeatFace(a, a.seatFurn); }
    else if (!fl && a._floorOy) { a._floorOy = false; if (!a._bedLie) a.oy = 0; }
  }
}
const _loop120 = loop;
loop = function (ts) { if (G.started && S) { try { floorSitTick(); } catch (e) { } } return _loop120(ts); };

/* 문 앞: 근처에 사람이 있어도 「들어가기」를 먼저 (말 걸기는 옆 선택지로) */
computeAction = (function (prev) {
  return function () {
    const a = prev.apply(this, arguments), P = G.player;
    if (!a || !M || M.interior || P.seat || P.seatFurn || P.carried) return a;
    const first = a.cands ? a.cands[0] : a;
    if (!first || /들어가기|방문/.test(first.label)) return a;
    const b = M.buildings.find(b => b.doorTile && Math.hypot(P.x - b.doorTile[0] - 0.5, P.y - b.doorTile[1] - 0.5) < 1.1); if (!b) return a;
    // 사람을 잠깐 없는 셈 치고 문 행동을 구함 (이웃집 「방문」 같은 이름도 그대로)
    const hid = G.actors.filter(x => x !== P && x.visible && x.map === P.map && dist(x, P) < 2.2); hid.forEach(x => { x._hidTmp = true; x.visible = false; });
    let door = null; try { door = prev.apply(this, arguments); } finally { hid.forEach(x => { x.visible = true; delete x._hidTmp; }); }
    const d0 = door && (door.cands ? door.cands[0] : door); if (!d0 || d0.fn === first.fn || !/들어가기|방문|🚪/.test(d0.label + d0.icon)) return a;
    const rest = (a.cands || [a]).filter(c => c.label !== d0.label);
    return Object.assign({}, d0, { cands: [d0, ...rest].slice(0, 4) });
  };
})(computeAction);

/* 자리 정리: 섬 · 일터를 다시 지은 뒤 곧바로 앉을 자리 만들기, 사라진 자리에 앉아 있던 사람은 일으켜 세우기 */
const _devRebuild121 = devRebuild;
devRebuild = function () { const r = _devRebuild121.apply(this, arguments); try { autoSeats(); } catch (e) { console.error(e); } seatLostCheck(); return r; };
function seatLostCheck() {
  for (const a of G.actors || []) {
    if (!a.seat) continue; const m = MAPS[a.map], bk = m && m.benches && m.benches[a.seat.bench];
    if (bk && bk.seats[a.seat.idx]) continue;
    const k = G.seatOcc && seatKey ? seatKey(a.map, a.seat.bench, a.seat.idx) : null; if (k && G.seatOcc[k]) delete G.seatOcc[k];
    a.seat = null; a.pose = 'stand'; a.lie = 0; a.ox = 0; a.oy = 0; a.leis = null;
    if (m && !walkable(Math.floor(a.x), Math.floor(a.y), m)) [a.x, a.y] = nearestWalkable(a.x, a.y, m);
  }
}
let _slT = 0;
const _loop121 = loop;
loop = function (ts) { if (G.started && S && (_slT += 1 / 60) > 0.5) { _slT = 0; try { seatLostCheck(); } catch (e) { } } return _loop121(ts); };
const _buildWorld121 = buildWorld;
buildWorld = function () { const r = _buildWorld121.apply(this, arguments); try { if (S) autoSeats(); } catch (e) { console.error(e); } return r; };
