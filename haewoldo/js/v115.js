/* =====================================================================
   v1.15 — 저장 · 물리 · 놀이터 · 침대
   ===================================================================== */
/* ---------- 섬 · 일터 편집: 바꿀 때마다 자동 저장 (앱을 그냥 꺼도 남게) ---------- */
function devAutoSave() { try { DEVDATA.savedAt = Date.now(); localStorage.setItem(DEV_KEY, JSON.stringify(DEVDATA)); return true; } catch (e) { return false; } }
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
