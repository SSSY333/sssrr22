/* =====================================================================
   물리 점검 (v1.14)
   · 가구를 다시 배치해도 앉아 있던 사람은 의자째 따라가거나 일어나서 빈 바닥으로
   · 일터 손님 · 학생 · 환자는 「지금 놓인」 의자 · 책상을 찾아서 앉음 (고정 좌표 X)
   · 가게에 놀러 온 주민도 빈 의자가 있으면 앉았다 감
   · 가구 위 · 벽 속에 서 있는 사람, 막힌 방문 지점 정리
   ===================================================================== */
const FACE_V = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const isSeatFurn = (o) => o && o.kind === 'furn' && FURN[o.k] && FURN[o.k].seat;
/* 의자 앞 빈 칸 (앞쪽 우선) */
function seatStand(o, m, sx = o.x, sy = o.y) {
  const r = (o.rot || 0) & 3, fv = FACE_V[r], cands = [[sx + fv[0], sy + fv[1]], [sx, sy + 1], [sx + 1, sy], [sx - 1, sy], [sx, sy - 1]];
  const foot = new Set(); for (let yy = o.y; yy < o.y + (o.fh || 1); yy++) for (let xx = o.x; xx < o.x + (o.fw || 1); xx++) foot.add(xx + ',' + yy);
  return cands.find(([x, y]) => !foot.has(x + ',' + y) && walkable(x, y, m)) || null;
}
/* 이 의자에 누가 앉아 있나 */
function seatOccupant(o, sx, sy, except) {
  return G.actors.find(a => a !== except && a.seatFurn === o && Math.floor(a.x) === sx && Math.floor(a.y) === sy) || null;
}
/* 맵에 있는 앉을 자리 목록: 의자 · 소파 (소파는 칸마다) */
function seatList(m) {
  const out = [];
  for (const o of m.objects) {
    if (!isSeatFurn(o)) continue;
    for (let yy = o.y; yy < o.y + (o.fh || 1); yy++) for (let xx = o.x; xx < o.x + (o.fw || 1); xx++) {
      const st = seatStand(o, m, xx, yy); if (st) out.push({ o, x: xx, y: yy, stand: st });
      if (o.fh > 1) break;   // 선베드처럼 긴 건 한 자리
    }
  }
  return out;
}
function sitOnFurn(a, s) {
  a.stop(); a.seatFurn = s.o; s.o.front = ((s.o.rot || 0) & 3) < 2; a.pose = 'sit'; a.x = s.x + 0.5; a.y = s.y + 0.5;
  const fv = FACE_V[(s.o.rot || 0) & 3]; a.faceTo(fv[0], fv[1]);
}
function standFromFurn(a) {
  const o = a.seatFurn, m = MAPS[a.map]; a.seatFurn = null; a.pose = 'stand';
  if (!m) return;
  const st = o && seatStand(o, m, Math.floor(a.x), Math.floor(a.y));
  [a.x, a.y] = st ? [st[0] + 0.5, st[1] + 0.5] : nearestWalkable(a.x, a.y, m);
}

/* ---------------- 가구를 다시 놓은 뒤 정리 ---------------- */
function physSettle(m) {
  if (!m || !G.actors) return;
  const objs = new Set(m.objects);
  for (const a of G.actors) {
    if (a.map !== m.id) continue;
    if (a.seatFurn && !objs.has(a.seatFurn)) {
      // 같은 가구가 같은 자리에 다시 생겼으면 그대로 앉아 있고, 아니면 일어남
      const old = a.seatFurn, nu = (old.id != null && m.objects.find(o => o.kind === 'furn' && o.id === old.id && o.k === old.k)) || m.objects.find(o => o.kind === 'furn' && o.k === old.k && Math.floor(a.x) >= o.x && Math.floor(a.x) < o.x + (o.fw || 1) && Math.floor(a.y) >= o.y && Math.floor(a.y) < o.y + (o.fh || 1));
      if (nu) { a.seatFurn = nu; nu.front = ((nu.rot || 0) & 3) < 2; if (a._wseat && !a._wseat.desk) a._wseat = { o: nu, x: Math.floor(a.x), y: Math.floor(a.y), stand: seatStand(nu, m, Math.floor(a.x), Math.floor(a.y)) || [Math.floor(a.x), Math.floor(a.y) + 1] }; }
      else { a.seatFurn = old; standFromFurn(a); if (a._wseat) custSeatLost(a); continue; }
    }
    if (a.seatFurn) {
      // 앉아 있던 의자를 옮겼으면 의자째 따라가고, 돌렸으면 방향도 맞춤 (자리가 없으면 일어남)
      const o = a.seatFurn, x = Math.floor(a.x), y = Math.floor(a.y);
      const inside = x >= o.x && x < o.x + (o.fw || 1) && y >= o.y && y < o.y + (o.fh || 1);
      if (!inside) {
        const s = seatList(m).find(s => s.o === o && !seatOccupant(o, s.x, s.y, a));
        if (s) { sitOnFurn(a, s); if (a._wseat && !a._wseat.desk) a._wseat = s; }
        else { a.x = o.x + 0.5; a.y = o.y + 0.5; standFromFurn(a); if (a._wseat) custSeatLost(a); }
      } else { const fv = FACE_V[(o.rot || 0) & 3]; o.front = ((o.rot || 0) & 3) < 2; a.faceTo(fv[0], fv[1]); }
      continue;
    }
    if (a.seatFurn || a.seat) continue;
    if (a._deskSit) { const d = a._deskSit; if (!m.objects.includes(d.o) || d.o.x !== d.x || d.o.y + (d.o.fh || 1) !== d.y) { a._deskSit = null; a.pose = 'stand'; [a.x, a.y] = nearestWalkable(a.x, a.y, m); } continue; }
    if (a._wseat && a._wseat.desk) { const d = a._wseat; if (!m.objects.includes(d.o) || d.o.x !== d.x || d.o.y + (d.o.fh || 1) !== d.y || !walkable(d.x, d.y, m)) custSeatLost(a); continue; }
    const x = Math.floor(a.x), y = Math.floor(a.y);
    if (!walkable(x, y, m)) { if (a.pose === 'sit' && a !== G.player) a.pose = 'stand'; [a.x, a.y] = nearestWalkable(a.x, a.y, m); a.path = []; }
    else if (a.path && a.path.length) { const t = a.path[a.path.length - 1]; if (!walkable(Math.floor(t[0]), Math.floor(t[1]), m)) a.path = []; }
  }
  // 방문 지점 · 문 앞 정리
  if (m.visit) m.visit = m.visit.map(p => walkable(Math.floor(p[0]), Math.floor(p[1]), m) ? p : nearestWalkable(p[0], p[1], m));
}
const _setFurniturePF = setFurniture;
setFurniture = function (m, list) { _setFurniturePF(m, list); try { physSettle(m); } catch (e) { console.error(e); } };
if (typeof devApplyMap === 'function') {
  const _devApplyMapPF = devApplyMap;
  devApplyMap = function (m, md) { _devApplyMapPF(m, md); try { physSettle(m); } catch (e) { console.error(e); } };
}
/* 직원 · 다른 직업 주민이 가구에 묻혀 있으면 빈 칸으로 */
function staffSettle() {
  for (const a of [...(G.staff || []), ...Object.values(G.rivals || {})]) {
    const m = MAPS[a.map]; if (!m || a.seatFurn) continue;
    if (!walkable(Math.floor(a.x), Math.floor(a.y), m)) [a.x, a.y] = nearestWalkable(a.x, a.y, m);
  }
}

/* 플레이어가 앉으려는 의자에 이미 누가 있으면 */
const _furnActionPF = furnAction;
furnAction = async function (o) {
  const F = FURN[o.k];
  if (F && F.act === 'sit' && F.seat) {
    const P = G.player, m = MAPS[P.map];
    const free = seatList(m).filter(s => s.o === o && !seatOccupant(o, s.x, s.y, P));
    if (!free.length) { toast('🪑 누가 앉아 있어요 — 다른 자리를 찾아봐요'); return; }
    const r = await _furnActionPF(o);
    // 소파 두 칸 중 빈 칸으로
    if (P.seatFurn === o) { const s = free.sort((a, b) => Math.hypot(a.x + 0.5 - P.x, a.y + 0.5 - P.y) - Math.hypot(b.x + 0.5 - P.x, b.y + 0.5 - P.y))[0]; P.x = s.x + 0.5; P.y = s.y + 0.5; }
    return r;
  }
  return _furnActionPF(o);
};

/* ---------------- 일터 손님 자리: 지금 놓인 가구에서 찾기 ---------------- */
function workSeatList(W) {
  const m = MAPS[W.map]; if (!m) return [];
  if (W === WORKS.teacher) {
    // 학생은 책상 앞(아래 칸)에 앉아 칠판을 봄
    const out = [];
    for (const o of m.objects) if (o.kind === 'furn' && o.k === 'desk') { const x = o.x, y = o.y + (o.fh || 1); if (walkable(x, y, m)) out.push({ o, x, y, desk: true, stand: [x, y] }); }
    return out;
  }
  return seatList(m);
}
function workSeatTaken(s, except) {
  if (s.desk) return G.actors.some(o => o._deskSit && o._deskSit.x === s.x && o._deskSit.y === s.y) || G.customers.some(c => c !== except && c._wseat && c._wseat.desk && c._wseat.x === s.x && c._wseat.y === s.y)
    || G.player.map === MAPS[G.player.map].id && Math.floor(G.player.x) === s.x && Math.floor(G.player.y) === s.y && G.player.pose === 'sit';
  return !!seatOccupant(s.o, s.x, s.y, except) || G.customers.some(c => c !== except && c._wseat && c._wseat.o === s.o && c._wseat.x === s.x && c._wseat.y === s.y);
}
freeSeat = function (W) {
  const all = workSeatList(W).filter(s => !workSeatTaken(s));
  if (!all.length) return null;
  // 카운터에서 먼 자리부터 (줄 서는 곳을 막지 않게)
  const st = W.station; all.sort((a, b) => Math.hypot(b.x - st[0], b.y - st[1]) - Math.hypot(a.x - st[0], a.y - st[1]));
  return all[0];
};
custSitDown = function (a, W) {
  const s = freeSeat(W); if (!s) return false;
  a._wseat = s; a._seat = { taken: a, s: [s.x, s.y] };
  a.cst = 'toSeat'; a.walkTo(s.stand[0] + 0.5, s.stand[1] + 0.5); return true;
};
custSeated = function (a) {
  const s = a._wseat;
  if (!s || workSeatTaken(s, a) || (!s.desk && !MAPS[a.map].objects.includes(s.o))) {   // 그새 누가 앉았으면 다른 자리
    const W = myWork(); a._wseat = null;
    if (W && custSitDown(a, W)) return;
    a.pose = 'stand'; a.cst = 'seated'; a.t = 0; a._standOnly = true; return;
  }
  if (s.desk) { a.stop(); a.x = s.x + 0.5; a.y = s.y + 0.45; a.pose = 'sit'; a.face = 'b'; }
  else sitOnFurn(a, s);
  a.cst = 'seated'; a.t = 0;
};
function custSeatLost(a) {
  a._wseat = null; if (a._seat) a._seat = null;
  if (a.seatFurn) standFromFurn(a);
  a.pose = 'stand';
  const W = myWork();
  if (a.cst === 'seated' || a.cst === 'toSeat') { if (!(W && custSitDown(a, W))) { a.cst = 'seated'; a._standOnly = true; } }
}
/* 일어날 땐 의자 앞으로 나와서 */
const _custLeavePF = custLeave;
custLeave = function (a, now) {
  if (a.seatFurn) standFromFurn(a);
  else if (a._wseat && a._wseat.desk) { a.y = a._wseat.y + 0.5; }
  a._wseat = null; a._seat = null;
  return _custLeavePF(a, now);
};
const _custRemovePF = custRemove;
custRemove = function (a) { a.seatFurn = null; a._wseat = null; return _custRemovePF(a); };
/* 앉아 있는 손님: 누가 같은 자리를 차지하거나 의자가 사라지면 정리 */
function custSeatCheck() {
  for (const a of G.customers || []) {
    if (a.cst !== 'seated' || !a._wseat) continue;
    if (!a._wseat.desk && a.seatFurn !== a._wseat.o) { if (!MAPS[a.map].objects.includes(a._wseat.o)) custSeatLost(a); else sitOnFurn(a, a._wseat); }
  }
}

/* ---------------- 가게 · 학교에 놀러 온 주민: 빈 의자 · 책상에 앉았다 가기 ---------------- */
const SIT_PLACES = new Set(['in_cafe', 'in_sashimi', 'in_hall', 'in_furniture', 'in_salon', 'in_clinic', 'in_super', 'in_school']);
function deskSpots(m) { const out = []; for (const o of m.objects) if (o.kind === 'furn' && o.k === 'desk') { const x = o.x, y = o.y + (o.fh || 1); if (walkable(x, y, m)) out.push({ o, x, y, desk: true, stand: [x, y] }); } return out; }
function spotBusy(s, a) {
  if (!s.desk) return !!seatOccupant(s.o, s.x, s.y, a) || (G.customers || []).some(c => c._wseat && c._wseat.o === s.o && c._wseat.x === s.x && c._wseat.y === s.y);
  return G.actors.some(o => o !== a && (o._deskSit || (o._wseat && o._wseat.desk) || o._goSeat) && [o._deskSit, o._wseat, o._goSeat].some(q => q && q.desk && q.x === s.x && q.y === s.y));
}
function villSitDone(a) {
  if (a.seatFurn) standFromFurn(a);
  if (a._deskSit) { a.pose = 'stand'; a._deskSit = null; }
  a._sitUntil = null; a.wait = 0;
}
const _villagerUpdatePF = villagerUpdate;
villagerUpdate = function (a, dt) {
  const m = MAPS[a.map];
  if (a.seatFurn || a._deskSit) {
    a.wait = Math.max(a.wait, 0.5);
    const gone = !m || (a.seatFurn ? !m.objects.includes(a.seatFurn) : !m.objects.includes(a._deskSit.o) || a._deskSit.o.x !== a._deskSit.x || a._deskSit.o.y + (a._deskSit.o.fh || 1) !== a._deskSit.y);
    if (gone || (!a.talking && a._sitUntil != null && G.t > a._sitUntil)) villSitDone(a);
    else {
      const map0 = a.map, r = _villagerUpdatePF(a, dt);
      if (a.map !== map0 || !a.visible) { a.seatFurn = null; a._deskSit = null; a.pose = 'stand'; }
      else { if (a.path && a.path.length) a.path = []; a.pose = 'sit'; if (a._deskSit) a.face = 'b'; }
      return r;
    }
  }
  const r = _villagerUpdatePF(a, dt);
  // 실내에서 방문 지점으로 가려는 참이면 가끔 빈 의자로 (학교는 책상 앞)
  if (m && a.map === m.id && a.map !== 'island' && SIT_PLACES.has(a.map) && a.visible && !a._goSeat && a.path && a.path.length && a.wait > 4 && Math.random() < (a.map === 'in_school' ? 0.9 : 0.5)) {
    const list = (a.map === 'in_school' ? deskSpots(m) : seatList(m)).filter(s => !spotBusy(s, a) && !G.actors.some(o => o !== a && o._goSeat && o._goSeat.o === s.o && o._goSeat.x === s.x && o._goSeat.y === s.y));
    if (list.length) { const s = pick(list); a._goSeat = s; a.walkTo(s.stand[0] + 0.5, s.stand[1] + 0.5); a.wait = 30; }
  }
  if (a._goSeat) {
    const s = a._goSeat;
    if (!m || a.map !== m.id || !m.objects.includes(s.o)) a._goSeat = null;
    else if (!a.path.length) {
      a._goSeat = null;
      if (Math.hypot(a.x - s.stand[0] - 0.5, a.y - s.stand[1] - 0.5) < 0.8 && !spotBusy(s, a)) {
        if (s.desk) { a.stop(); a._deskSit = s; a.x = s.x + 0.5; a.y = s.y + 0.45; a.pose = 'sit'; a.face = 'b'; a._sitUntil = G.t + rand(40, 90); }
        else { sitOnFurn(a, s); a._sitUntil = G.t + rand(14, 30); if (Math.random() < 0.3 && dist(a, G.player) < 6) a.say(pick(['[[아이고, 다리야. 좀 앉았다 가야지.||아이고 다리야.]]', '[[여기 앉아도 되죠?||여기 앉는다~]]', '[[잠깐 쉬었다 갈게요.||잠깐 쉬었다 갈게.]]']), 2.6); }
      }
    }
  }
  return r;
};
/* 주민을 누르면 앉은 채로 이야기 */
const _interactWithPF = interactWith;
interactWith = function (a) { if (a && a.seatFurn && a._sitUntil != null) a._sitUntil = Math.max(a._sitUntil, G.t + 10); return _interactWithPF.apply(this, arguments); };

/* ---------------- 매 프레임 가벼운 점검 ---------------- */
let _pfT = 0;
const _workUpdatePF = workUpdate;
workUpdate = function (dt) {
  const r = _workUpdatePF(dt);
  _pfT += dt || 0;
  if (_pfT > 0.5) { _pfT = 0; try { custSeatCheck(); staffSettle(); physActorCheck(); } catch (e) { console.error(e); } }
  return r;
};
/* 의자에 앉은 채로 다른 맵에 가 있거나, 앉은 포즈인데 의자 · 벤치 · 돗자리 아닌 곳(가구 속)에 있으면 바로잡기 */
function physActorCheck() {
  for (const a of G.actors) {
    if (!a.visible || a.carried) continue;
    const m = MAPS[a.map]; if (!m) continue;
    if (a.seatFurn) {
      if (!m.objects.includes(a.seatFurn)) { if (a === G.player || a === G.det) { physSettle(m); } else standFromFurn(a); }
      continue;
    }
    if (a.seat || a._deskSit || a.isCustomer || a.pet || a.lie || a.pose === 'fish') continue;
    const x = Math.floor(a.x), y = Math.floor(a.y);
    if (a.pose === 'sit' && a !== G.player && !walkable(x, y, m) && !G.busy) { a.pose = 'stand'; [a.x, a.y] = nearestWalkable(a.x, a.y, m); }
  }
}

/* 같은 이름 학생이 동시에 두 명 앉지 않게 */
const _custLookPF = custLook;
custLook = function (kid) {
  const l = _custLookPF(kid); if (!kid) return l;
  const used = new Set((G.customers || []).map(c => c.cname)), names = ['반 친구 다온', '반 친구 서진', '반 친구 루아', '반 친구 지호', '반 친구 하율', '반 친구 예준', '반 친구 소윤'].filter(n => !used.has(n));
  if (used.has(l.name) && names.length) l.name = pick(names);
  return l;
};
