'use strict';
/* =========================================================
 *  해월도 다이어리 v2 — 대화 · AI · 관계 · 이벤트
 * ========================================================= */

/* ---------------- 대화창 ---------------- */
function speakerOf(who) {
  if (who === 'det') return { name: detLabel(), look: G.det.look, outfit: wearOf(G.det) };
  if (who === 'me') return { name: S.name, look: G.player.look, outfit: wearOf(G.player) };
  const a = G.actors.find(x => x.id === who);
  if (a && !a.pet) return { name: a.look.name, look: a.look, outfit: wearOf(a) };
  if (NPC_LOOKS[who]) return { name: NPC_LOOKS[who].name, look: NPC_LOOKS[who], outfit: 'base' };
  return null;
}
const EXPR_EMOTE = { blush: '💗', surprise: '❗', laugh: '♪', sad: '💧', tease: '😏' };
let _dlgResolve = null, _dlgTyping = null;
function say(who, expr, text) {
  return new Promise((res) => {
    G.dialog = true;
    const box = $('#dlg'); box.classList.remove('hidden'); $('#dlgChoices').innerHTML = '';
    const fg = $('#dlgFace').getContext('2d');
    const sp = speakerOf(who);
    $('#dlgName').textContent = sp ? sp.name : '';
    box.classList.toggle('narr', !sp);
    fg.clearRect(0, 0, 32, 32);
    if (sp) fg.drawImage(drawPortrait(sp.look, sp.outfit, expr || 'normal'), 0, 0);
    if (who === 'det' && EXPR_EMOTE[expr]) G.det.emo(EXPR_EMOTE[expr]);
    if (who === 'det' && expr === 'blush') burst(G.det, 'heart', 3);
    const el = $('#dlgText'); el.textContent = ''; const full = fillNames(text);
    let i = 0; clearInterval(_dlgTyping);
    _dlgTyping = setInterval(() => { i++; el.textContent = full.slice(0, i); if (i >= full.length) { clearInterval(_dlgTyping); _dlgTyping = null; } }, 24);
    _dlgResolve = () => {
      if (_dlgTyping) { clearInterval(_dlgTyping); _dlgTyping = null; el.textContent = full; return; }
      _dlgResolve = null; Sound.sfx('tap'); res();
    };
  });
}
function choose(options) {
  return new Promise((res) => {
    const wrap = $('#dlgChoices'); wrap.innerHTML = '';
    $('#dlg').classList.add('choosing');
    if (_dlgTyping) { clearInterval(_dlgTyping); _dlgTyping = null; }
    options.forEach((o, i) => {
      const b = document.createElement('button'); b.className = 'choice'; b.textContent = choiceText(o);
      b.onclick = (e) => { e.stopPropagation(); wrap.innerHTML = ''; $('#dlg').classList.remove('choosing'); Sound.sfx('tap'); res(i); };
      wrap.appendChild(b);
    });
  });
}
function askText(placeholder, def = '', max = 8) {
  return new Promise((res) => {
    const wrap = $('#dlgChoices'); wrap.innerHTML = '';
    $('#dlg').classList.add('choosing');
    if (_dlgTyping) { clearInterval(_dlgTyping); _dlgTyping = null; }
    const row = document.createElement('div'); row.className = 'askrow';
    row.innerHTML = `<input id="askIn" maxlength="${max}" autocomplete="off" placeholder="${placeholder}"><button class="choice ok">확인</button>`;
    wrap.appendChild(row);
    const inp = row.querySelector('input'); inp.value = def; setTimeout(() => inp.focus(), 50);
    const done = (e) => { if (e) e.stopPropagation(); const v = inp.value.trim().slice(0, max); wrap.innerHTML = ''; $('#dlg').classList.remove('choosing'); res(v); };
    row.querySelector('button').onclick = done;
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') done(e); };
    row.onclick = (e) => e.stopPropagation();
  });
}
function closeDialog() { $('#dlg').classList.add('hidden'); G.dialog = false; }
async function talk(lines, who = 'det') { for (const [e, t] of lines) await say(who, e, t); }
async function topic(tp, who = 'det') {
  await talk(tp.t, who);
  const i = await choose(tp.c.map(c => c[0]));
  const [, aff, reply, ex] = tp.c[i];
  await say(who, ex, reply);
  if (who === 'det') addAff(aff);
  return i;
}

/* ---------------- 시트 메뉴 ---------------- */
function openSheet({ title, sub, items, cols = 3, onClose }) {
  G.sheet = true;
  $('#sheetTitle').textContent = title; $('#sheetSub').innerHTML = sub || '';
  const body = $('#sheetBody'); body.innerHTML = ''; body.style.setProperty('--cols', cols);
  for (const it of items) {
    const b = document.createElement('button'); b.className = 'sitem' + (it.locked ? ' locked' : '') + (it.disabled ? ' disabled' : '') + (it.wide ? ' wide' : '');
    b.innerHTML = `<span class="si-icon">${it.locked ? '🔒' : it.icon || ''}</span><span class="si-label">${it.label}</span>${it.note ? `<span class="si-note">${it.note}</span>` : ''}`;
    b.onclick = () => {
      Sound.sfx('tap');
      if (it.locked || it.disabled) { if (it.why) toast(it.why); return; }
      if (!it.keep) closeSheet();
      if (it.onClick) it.onClick();
    };
    body.appendChild(b);
  }
  $('#sheet').classList.remove('hidden');
  G._sheetClose = onClose;
}
function closeSheet() { $('#sheet').classList.add('hidden'); G.sheet = false; const f = G._sheetClose; G._sheetClose = null; if (f) f(); }

/* ---------------- 호감도 · 단계 ---------------- */
function addAff(n, opts = {}) {
  if (!n) return;
  const r = S.rel;
  if (n > 0 && !opts.event) {
    const left = DAILY_AFF_CAP - r.daily.affGain;
    if (left <= 0) { if (!opts.quiet && Math.random() < 0.3) floatText(G.det, '♥ 오늘은 충분해요', '#ffd3de'); return; }
    n = Math.min(n, left); r.daily.affGain += n;
  }
  r.aff = Math.max(0, r.aff + n);
  if (n > 0) { floatText(G.det, '♥+' + n, '#ff9ab5'); Sound.sfx('heart'); }
  if (n >= 3) burst(G.det, 'heart', Math.min(6, n));
  updateHUD(); checkStage();
}
function daysKnown() { return S.rel.flags.met ? S.day - S.rel.metDay + 1 : 0; }
function loverDays() { return S.rel.flags.lovers ? S.day - S.rel.loverDay : 0; }
function stageReady(n) {
  const st = STAGES[n - 1]; if (!st || !st.need) return false;
  const nd = st.need, r = S.rel;
  if (nd.aff && r.aff < nd.aff) return false;
  if (nd.together && r.together < nd.together) return false;
  if (nd.days && daysKnown() < nd.days) return false;
  if (nd.loverDays && loverDays() < nd.loverDays) return false;
  for (const f of (nd.flags || [])) if (!r.flags[f]) return false;
  return true;
}
function checkStage() {
  let up = false;
  while (S.rel.stage < 8 && stageReady(S.rel.stage + 1)) { S.rel.stage++; up = true; }
  if (up) { G.stageUpPending = true; updateHUD(); save(); }
}
function stageName(n = S.rel.stage) { return STAGES[n - 1].name; }

/* ---------------- 형사님 AI ---------------- */
const PATROL = ['station', 'schoolFront', 'clinicFront', 'hallFront', 'plaza', 'cafeDoor', 'orchardGate', 'homeDoor', 'villageEast', 'superDoor', 'villageWest', 'plaza'];
const PIER_PATROL = ['harbor', 'pierEnd', 'sashimiDoor', 'storageDoor', 'boatSpot', 'harbor'];
const STROLL = ['beach', 'beachEast', 'beachBench', 'beachWest', 'beach'];
const STATION = null;
function detDayOutfit(kind) { const pool = DET_WEAR[kind][season()]; return pool[(S.day * 7 + (kind === 'work' ? 3 : 0)) % pool.length]; }
function detHomeDoor() { return S.rel.flags.married ? P_('homeDoor') : P_('sataekDoor'); }
function todayEvents() { const c = calendar(S.day); return EVENTS.filter(e => e.m === c.month && e.d === c.dom); }
function activeEvent() { if (!S) return null; return todayEvents().find(e => S.min >= e.from && S.min < e.to) || null; }
function detPlan(min) {
  const r = S.rel, d = r.daily;
  if (S.day === 1 && !r.flags.met && min >= 8 * 60 + 3 && min < 13 * 60) return { k: 'meet', duty: true };
  if (d.sick) return { k: 'sick', duty: false };
  if (S.wedding === S.day && !r.flags.married && min >= 9 * 60 && min < 18 * 60) return { k: 'wedding', duty: false };
  if (d.proposal && min >= 17.5 * 60 && min < 21.5 * 60) return { k: 'waitLighthouse', duty: false };
  const ev = activeEvent(); if (ev && r.flags.met && ev.id !== 'typhoon') return { k: 'event', ev, duty: false };
  if (d.rival && !d.rival.done && min >= d.rival.start && min < d.rival.end) return { k: 'rivalWalk', duty: false };
  if (r.flags.married && min >= 17 * 60 && min < 17.7 * 60 && !d.pickup) return { k: 'pickup', duty: false };
  if (min < (r.flags.married ? 7.6 * 60 : 7 * 60) || min >= 22 * 60) return { k: 'home', duty: false };
  if (min < 8.5 * 60) return { k: 'station', duty: true };
  if (min < 12 * 60) return { k: 'patrol', duty: true };
  if (min < 13 * 60) return { k: 'lunch', duty: true };
  if (min < 15 * 60) return { k: 'station', duty: true };
  if (min < 17 * 60) return { k: 'pier', duty: true };
  if (min < 19.5 * 60) return { k: 'stroll', duty: false };
  if (min < 21.5 * 60) return { k: 'fishing', duty: false };
  return { k: 'goHome', duty: false };
}
const TASK_LABEL = { meet: '누군가를 찾는 중', home: '집에서 쉬는 중', station: '파출소 근무 중', patrol: '마을 순찰 중', lunch: '카페에서 점심', pier: '부두 · 갯바위 순찰 중', stroll: '퇴근 후 해변 산책', fishing: '부두에서 낚시', goHome: '집에 가는 중', event: '마을 행사 구경 중', rivalWalk: '마을 사람과 산책 중', sick: '감기로 사택에서 쉬는 중', wedding: '결혼식 준비 중', waitLighthouse: '등대에서 누군가를 기다리는 중', pickup: '퇴근 마중 기다리는 중' };
const DUTY_LINES = { station: ['오늘도 이상 무.', '하암… 평화롭다.', '게시판 정리 좀 해야겠다.'], patrol: ['순찰 중~', '까마귀 녀석, 또 귤밭에?', '오늘은 조용하네.'], pier: ['배 들어올 시간이네.', '물살이 좀 세다.', '갯바위 미끄러우니 조심하세요~'], stroll: ['퇴근이다~', '노을 좋다.'], fishing: ['…입질 왔나?', '오늘은 꼭 잡는다.'] };

function detUpdate(dt) {
  const d = G.det, P = G.player;
  const plan = detPlan(S.min);
  if (plan.k === 'wedding' || (S.rel.daily.weddingDone)) d.outfit = 'suit';
  else d.outfit = detDayOutfit(plan.duty ? 'work' : 'casual');
  if (d.state === 'comp') { compUpdate(dt, plan); return; }
  if (d.state !== 'sched') return;
  if (d.talking) { d.stop(); d.lookAt(P); return; }
  if (d.carrying) return;

  if (d.task !== plan.k) {
    d.task = plan.k; d.stop(); d.wait = 0; d.sub = 0;
    if (d.seat) d.standUp();
    d.pose = 'stand';
    const needIsland = !['home', 'sick'].includes(plan.k);
    if (needIsland && (d.map !== 'island' || !d.visible)) { const h = d.map === 'in_home' ? P_('homeDoor') : d.map === 'in_sataek' ? P_('sataekDoor') : detHomeDoor(); d.map = 'island'; d.x = h[0]; d.y = h[1]; d.visible = true; }
    if (plan.k === 'sick') { d.map = S.rel.flags.married ? 'in_home' : 'in_sataek'; [d.x, d.y] = nearestWalkable(2.5, 2.5, MAPS[d.map]); d.visible = true; d.face = 'f'; d.left = true; }
  }
  d.wait -= dt;
  const goto = (x, y) => { if (Math.hypot(d.x - x, d.y - y) > 0.3 && !d.path.length) d.walkTo(x, y); };
  const r = S.rel;

  if (r.stage >= 3 && !plan.duty && !r.daily.autoGreet && d.visible && d.map === P.map && !['home', 'goHome', 'sick', 'wedding', 'waitLighthouse', 'rivalWalk'].includes(plan.k) && dist(d, P) < 7 && !G.busy && !G.working && !P.seat) {
    r.daily.autoGreet = true; runEvent(detApproach); return;
  }

  switch (plan.k) {
    case 'home': {
      if (S.rel.flags.married) {
        if (d.map !== 'in_home') { if (d.map === 'island' && d.visible) { const h = detHomeDoor(); if (Math.hypot(d.x - h[0], d.y - h[1]) < 0.3) { d.map = 'in_home'; d.x = 2.5; d.y = 3.5; } else goto(h[0], h[1]); } else { d.map = 'in_home'; d.x = 2.5; d.y = 3.5; d.visible = true; } }
        else if (d.wait <= 0) { d.wait = rand(5, 10); d.left = !d.left; }
      } else if (d.visible) { const h = detHomeDoor(); if (Math.hypot(d.x - h[0], d.y - h[1]) < 0.3) d.visible = false; else goto(h[0], h[1]); }
      break;
    }
    case 'goHome': { const h = detHomeDoor(); if (Math.hypot(d.x - h[0], d.y - h[1]) < 0.3) { if (S.rel.flags.married) { d.map = 'in_home'; d.x = 2.5; d.y = 3.5; } else d.visible = false; } else goto(h[0], h[1]); break; }
    case 'meet': { d.speedMul = 1.1; if (d.wait <= 0) { d.wait = 1.2; if (P.map === 'island' && dist(d, P) > 1.6) d.walkTo(P.x, P.y); else d.stop(); } break; }
    case 'station': goto(...P_('station')); if (!d.path.length && d.wait <= 0) { d.wait = rand(3, 7); d.left = !d.left; if (Math.random() < 0.3) d.say(pick(DUTY_LINES.station), 2.5); } break;
    case 'pickup': goto(...P_('station')); if (!d.path.length) { d.face = 'f'; if (d.wait <= 0) { d.wait = 8; d.say('여보 언제 오나~', 2.5); } } break;
    case 'patrol': case 'pier': case 'stroll': {
      const route = plan.k === 'patrol' ? PATROL : plan.k === 'pier' ? PIER_PATROL : STROLL;
      d.speedMul = plan.k === 'stroll' ? 0.75 : 0.9;
      if (!d.path.length && d.wait <= 0) {
        if (d.sub > 0 && Math.random() < 0.25) d.say(pick(Math.random() < 0.4 ? SEASON_IDLE[season()] : DUTY_LINES[plan.k]), 2.6);
        const wp = P_(route[d.sub % route.length]); d.sub++; d.walkTo(wp[0] + rand(-1, 1), wp[1] + rand(-1, 1)); d.wait = rand(1.5, 3.5);
      }
      break;
    }
    case 'lunch': {
      const bk = MAPS.island.benches.cafe;
      if (d.seat) break;
      const st = bk.stand[1];
      if (Math.hypot(d.x - st[0] - 0.5, d.y - st[1] - 0.5) < 0.3) { if (!(P.seat && P.seat.bench === 'cafe' && P.seat.idx === 1 && P.map === 'island')) d.sitAt('cafe', 1); }
      else goto(st[0] + 0.5, st[1] + 0.5);
      break;
    }
    case 'fishing': {
      const [fx, fy] = P_('pierEnd2');
      if (Math.hypot(d.x - fx, d.y - fy) < 0.3) { d.pose = 'fish'; d.face = 'f'; d.left = false; if (d.wait <= 0) { d.wait = rand(6, 12); if (Math.random() < 0.3) d.say(pick(DUTY_LINES.fishing), 2.5); } }
      else { d.pose = 'stand'; goto(fx, fy); }
      break;
    }
    case 'event': { const ev = plan.ev; goto(P_(ev.at)[0] + 1, P_(ev.at)[1]); if (!d.path.length && d.wait <= 0) { d.wait = rand(4, 8); d.lookAt(P); if (Math.random() < 0.4) d.say(`${ev.icon} ${ev.name}!`, 2.4); } break; }
    case 'rivalWalk': rivalWalkUpdate(dt); break;
    case 'sick': if (d.wait <= 0) { d.wait = 6; d.emo('🤒', 3); } break;
    case 'wedding': goto(...P_('beach')); if (!d.path.length && d.wait <= 0) { d.wait = 7; d.face = 'f'; d.say('…떨린다.', 2); } break;
    case 'waitLighthouse': goto(...P_('lighthouse')); if (!d.path.length) { d.face = 'f'; d.left = true; if (d.wait <= 0) { d.wait = 9; d.emo('💍', 2); } } break;
  }
}

/* 동행 */
function startCompanion(opts = {}) {
  const d = G.det, P = G.player;
  S.comp = true; d.state = 'comp'; d.talking = false; if (d.seat) d.standUp(); d.pose = 'stand'; d.visible = true;
  if (d.map !== P.map) { d.map = P.map; d.x = P.x; d.y = P.y; }
  G.hist = []; G.walkedTogether = 0; G.rainWalk = 0; G.compSettled = false; G.compIdle = 0;
  G.compDutyUntil = opts.dutyUntil || null;
  S.rel.daily.met = true;
  endRivalWalk();
  updateHUD();
}
function endCompanion(silent) {
  const d = G.det;
  S.comp = false; S.hold = false; S.arm = false; d.state = 'sched'; d.task = null; d.speedMul = 1;
  if (G.player.carried) stopPiggy();
  if (d.seat) d.standUp(); d.pose = 'stand';
  if (d.map !== 'island') { const b = MAPS.island.buildings.find(b => 'in_' + b.id === d.map); const h = b ? b.doorTile : [62, 62]; d.map = 'island'; d.x = h[0] + 0.5; d.y = h[1] + 0.5; if (G.player.map === 'islet') { [d.x, d.y] = P_('boatSpot'); } }
  if (!silent) toast('형사님과의 동행이 끝났어요');
  updateHUD();
}
function trailPoint(gap) {
  const P = G.player; let acc = 0, prev = [P.x, P.y];
  for (const h of G.hist) { acc += Math.hypot(h[0] - prev[0], h[1] - prev[1]); if (acc >= gap) return h; prev = h; }
  return G.hist.length ? G.hist[G.hist.length - 1] : null;
}
function compUpdate(dt, plan) {
  const d = G.det, P = G.player;
  if (d.scripted || d.carrying) return;
  if (d.map !== P.map) { d.map = P.map; d.x = P.x; d.y = P.y; }
  const dd = dist(d, P);
  if (dd > 9) { const n = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1]].map(([a, b]) => [Math.floor(P.x) + a, Math.floor(P.y) + b]).find(([x, y]) => walkable(x, y, MAPS[d.map])); if (n) { d.x = n[0] + 0.5; d.y = n[1] + 0.5; d.stop(); } return; }
  if (P.seat || d.seat) return;
  const close = S.hold || S.arm, gap = close ? 0.75 : 1.15;
  if (P.moving) {
    G.compSettled = false; G.compIdle = 0;
    const tgt = trailPoint(gap);
    if (tgt) {
      const td = Math.hypot(tgt[0] - d.x, tgt[1] - d.y);
      G.compRepath -= dt;
      if (td > 2.6) { if (G.compRepath <= 0) { G.compRepath = 0.5; d.walkTo(tgt[0], tgt[1]); } }
      else if (dd > gap * 0.9) d.path = [tgt];
      else d.stop();
    }
    d.speedMul = dd > 2.4 ? 1.45 : dd < gap ? 0.7 : 1.05;
  } else {
    d.speedMul = 1;
    if (!G.compSettled) {
      G.compSettled = true;
      const fv = P.face === 'f' ? (P.left ? [0, 1] : [1, 0]) : (P.left ? [-1, 0] : [0, -1]);
      const sides = [[fv[1], fv[0]], [-fv[1], -fv[0]], [-fv[0], -fv[1]], [fv[0], fv[1]]];
      const px = Math.floor(P.x), py = Math.floor(P.y);
      const opts = sides.map(([a, b]) => [px + a, py + b]).filter(([x, y]) => walkable(x, y, MAPS[d.map]));
      opts.sort((p, q) => Math.hypot(p[0] + 0.5 - d.x, p[1] + 0.5 - d.y) - Math.hypot(q[0] + 0.5 - d.x, q[1] + 0.5 - d.y));
      if (opts.length) { const [x, y] = opts[0]; d.walkTo(x + 0.5, y + 0.5); d.onArrive = () => { d.face = P.face; d.left = P.left; }; }
    }
    if (!d.moving) {
      G.compIdle += dt;
      if (G.compIdle > 7 && Math.floor(G.compIdle) % 4 === 0 && Math.floor(G.compIdle - dt) % 4 !== 0) { if (Math.random() < 0.5) d.left = !d.left; else d.lookAt(P); }
      if (G.compIdle > 11 && !d.bubble && Math.random() < dt * 0.09) {
        const pl = curPlace(), st = Math.min(8, S.rel.stage);
        const pool = [...IDLE[st], ...(PLACE_IDLE[pl] || []), ...SEASON_IDLE[season()], ...(WEATHER_IDLE[S.weather] || [])];
        d.lookAt(P); d.say(typeof compLine === 'function' && Math.random() < 0.7 ? compLine() : pick(pool), 3.2);
      }
    }
  }
  if (G.compDutyUntil && S.min > G.compDutyUntil && !G.busy) {
    G.compDutyUntil = null;
    runEvent(async () => { await say('det', 'sad', '아, 슬슬 파출소 들어가 봐야겠어요. 무전이 와서.'); await say('det', 'smile', '퇴근하고 또 같이 걸어요. 약속.'); closeDialog(); endCompanion(); });
  }
}

/* ---------------- 주민 · 여성 주민 · 동물 ---------------- */
function villagerUpdate(a, dt) {
  const V = VILLAGERS[a.vid];
  if (a.talking) { a.stop(); a.lookAt(G.player); return; }
  const on = V.hours ? S.min >= V.hours[0] && S.min < V.hours[1] : S.min >= 7 * 60 && S.min < 21 * 60;
  const ev = activeEvent();
  if ((!on && !ev) || S.weather === 'storm') { a.visible = false; if (a.map !== 'island') { a.map = 'island'; [a.x, a.y] = P_(V.spots[0]); } return; }
  a.visible = true;
  a.wait -= dt;
  // 건물 안팎 오가기
  const vis = !ev && (V.visits || []).find(([f, t]) => S.min >= f * 60 && S.min < t * 60);
  const want = vis ? 'in_' + vis[2] : 'island';
  if (a.map !== want) {
    if (a.map === 'island') {
      const b = MAPS.island.buildings.find(b => b.id === vis[2]), dx = b.doorTile[0] + 0.5, dy = b.doorTile[1] + 0.5;
      if (Math.hypot(a.x - dx, a.y - dy) < 0.7) { a.map = want; [a.x, a.y] = MAPS[want].spawn.door; a.stop(); a.wait = 0; }
      else if (!a.path.length && a.wait <= 0) { a.walkTo(dx, dy); a.wait = 2; }
    } else {
      const im = MAPS[a.map], ex = [im.exit[0] + 0.5, im.exit[1] + 0.5];
      if (Math.hypot(a.x - ex[0], a.y - ex[1]) < 0.7) { const b = MAPS.island.buildings.find(b => 'in_' + b.id === im.id); a.map = 'island'; [a.x, a.y] = [b.doorTile[0] + 0.5, b.doorTile[1] + 0.5]; a.stop(); a.wait = 0; }
      else if (!a.path.length && a.wait <= 0) { a.walkTo(ex[0], ex[1]); a.wait = 1.5; }
    }
    return;
  }
  if (!a.path.length && a.wait <= 0) {
    if (a.map !== 'island') { const sp = pick(MAPS[a.map].visit); a.walkTo(sp[0], sp[1]); a.wait = rand(5, 12); return; }
    let sp = P_(pick(V.spots)); sp = [sp[0] + rand(-2, 2), sp[1] + rand(-2, 2)];
    if (ev && ev.map === 'island' && Math.random() < 0.7) { const e = P_(ev.at); sp = [e[0] + rand(-3, 3), e[1] + rand(-3, 3)]; }
    a.walkTo(sp[0], sp[1]); a.wait = rand(5, 11);
    if (Math.random() < 0.15 && dist(a, G.player) < 8) a.say(villagerLine(a.vid), 2.6);
  }
}
function villagerLine(vid) { const L = VILLAGERS[vid].lines, pool = [...L.base, ...(L[season()] || []), ...(L[season()] || [])]; return pick(pool); }
function staffUpdate(a) {
  const hours = a.hours || [7 * 60, 22 * 60];
  a.visible = S.min >= hours[0] && S.min < hours[1];
  if (!a.talking) { a.face = 'f'; a.left = true; }
}
function refreshStaff() { for (const a of G.staff) staffUpdate(a); }
function rivalUpdate(a, dt) {
  const rv = a.rv, d = G.det, rw = S.rel.daily.rival;
  if (a.talking) { a.stop(); a.lookAt(G.player); return; }
  if (rw && !rw.done && rw.job === a.job && d.task === 'rivalWalk' && d.state === 'sched') {
    if (a.map !== 'island') { a.map = 'island'; a.x = d.x + 1; a.y = d.y; }
    a.visible = true;
    if (dist(a, d) > 1.3 && !a.path.length) { a.walkTo(d.x, d.y); if (a.path.length) a.path.pop(); }
    a.speedMul = dist(a, d) > 2.5 ? 1.4 : 0.8;
    return;
  }
  const day = S.min >= 8 * 60 && S.min < 19 * 60;
  if (rv.home) {
    if (a.map !== rv.home) { a.map = rv.home; a.x = rv.at[0]; a.y = rv.at[1]; a.stop(); }
    a.visible = day; a.face = 'f'; a.left = true;
  } else {
    a.map = 'island'; a.visible = day && S.weather !== 'storm';
    a.wait -= dt;
    if (!a.path.length && a.wait <= 0) { const sp = P_(pick(['beach', 'harbor', 'cafeDoor', 'lighthouse', 'observatory', 'windmill', 'field'])); a.walkTo(sp[0] + rand(-2, 2), sp[1] + rand(-2, 2)); a.wait = rand(6, 12); }
  }
}
function rivalWalkUpdate(dt) {
  const d = G.det, rw = S.rel.daily.rival, a = G.rivals[rw.job];
  d.speedMul = 0.6;
  if (!d.path.length && d.wait <= 0) { const wp = P_(STROLL[d.sub % STROLL.length]); d.sub++; d.walkTo(wp[0], wp[1]); d.wait = rand(2, 4); }
  rw.chatT = (rw.chatT || 0) - dt;
  if (rw.chatT <= 0 && a) {
    rw.chatT = 4.5; const CH = RIVAL_LINES[rw.job].chat; rw.ci = (rw.ci || 0) + 1; const c = CH[Math.floor(rw.ci / 2) % CH.length];
    if (rw.ci % 2) a.say(c[0], 4); else d.say(c[1], 4);
  }
  const P = G.player;
  if (!rw.seen && a && P.map === 'island' && dist(d, P) < 5 && !G.busy && !paused() && !G.working) { rw.seen = true; runEvent(() => jealousEvent(a)); }
}
function endRivalWalk() {
  const rw = S.rel.daily.rival; if (!rw || rw.done) return;
  rw.done = true; const a = G.rivals[rw.job];
  if (a) { a.bubble = null; if (a.rv.home) { a.map = a.rv.home; a.x = a.rv.at[0]; a.y = a.rv.at[1]; a.stop(); } }
}
function petUpdate(a, dt) {
  const P = G.player, V = PETS[a.vid];
  if (a.map !== 'island') a.map = 'island';
  a.visible = S.weather !== 'storm' && !(S.min >= 22.5 * 60 || S.min < 6 * 60);
  a.wait -= dt;
  if (a.follow > 0 && P.map === 'island' && (!V.pen || (P.x > V.pen[0] && P.x < V.pen[2] && P.y > V.pen[1] && P.y < V.pen[3]))) {
    a.follow -= dt; a.pose = 'stand';
    if (dist(a, P) > 1.4) { if (!a.path.length || a.wait <= 0) { a.wait = 0.5; a.walkTo(P.x, P.y); if (a.path.length) a.path.pop(); } }
    else a.stop();
    a.speedMul = dist(a, P) > 3 ? 1.5 : 1;
    if (a.follow <= 0) { a.say(a.pet.kind === 'cat' ? '냥~ (갈 길 간다)' : '왈! (다른 데로 뛰어간다)', 2); a.wait = 0; }
    return;
  }
  a.speedMul = 1;
  if (!a.path.length && a.wait <= 0) {
    if (Math.random() < 0.35) { a.pose = 'sit'; a.wait = rand(4, 10); }
    else { a.pose = 'stand'; let sp; if (V.pen) sp = [rand(V.pen[0], V.pen[2]), rand(V.pen[1], V.pen[3])]; else { const p = P_(pick(V.spots)); sp = [p[0] + rand(-2, 2), p[1] + rand(-2, 2)]; } a.walkTo(sp[0], sp[1]); a.wait = rand(3, 8); }
  }
}
function josa(w, a, b) { const c = w.charCodeAt(w.length - 1); return w + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? a : b); }
async function petTalk(a) {
  const al = a.pet, cat = al.kind === 'cat', pony = al.kind === 'pony';
  a.stop(); a.pose = 'sit'; a.lookAt(G.player);
  Sound.sfx(cat ? 'meow' : 'woof'); burst(a, 'heart', 2);
  await say('narr', '', `${pony ? '🐴' : cat ? '🐱' : '🐶'} ${al.name}: ${pick(PETS[a.vid].lines)}`);
  const opts = ['쓰다듬는다', (S.inv.snack || 0) > 0 ? '간식을 준다 🦴' : '간식이 없다…', '그냥 둔다'];
  const c = await choose(opts);
  if (c === 0) { await say('narr', '', cat ? `${josa(al.name, '이', '가')} 눈을 가늘게 뜨고 골골거린다. 몇 걸음 졸졸 따라온다.` : `${josa(al.name, '이', '가')} 꼬리를 붕붕 흔든다. 신이 나서 따라온다!`); a.follow = rand(6, 11); }
  else if (c === 1 && S.inv.snack > 0) { S.inv.snack--; burst(a, 'heart', 5); await say('narr', '', `${josa(al.name, '이', '가')} 간식을 냠냠 먹고 행복해한다. 한참 따라올 것 같다!`); a.follow = 30; S.rel.daily.pets[a.vid] = true; if (G.det.visible && dist(G.det, G.player) < 4 && S.rel.flags.met) { await say('det', 'smile', `${josa(al.name, '이', '가')} 당신을 엄청 좋아하네요. 저보다 더.`); addAff(1); } }
  else await say('narr', '', `${josa(al.name, '은', '는')} 하품을 하고 제 갈 길을 간다.`);
}

/* ---------------- 상호작용 ---------------- */
function interactWith(a) {
  Sound.init();
  if (a === G.det) { detMenu(); return; }
  if (a.pet) { runEvent(() => petTalk(a)); return; }
  if (a.isRival) { runEvent(() => rivalTalk(a)); return; }
  if (a.isStaff) { runEvent(() => staffTalk(a)); return; }
  if (a.isVillager) runEvent(() => villagerTalk(a));
}
async function villagerTalk(a) {
  a.talking = true; a.stop(); a.lookAt(G.player); G.player.lookAt(a);
  await say(a.id, 'smile', villagerLine(a.vid));
  const lost = S.rel.daily.lost;
  if (lost && lost.found && !lost.returned && lost.owner === a.vid) { lost.returned = true; S.money += 3000; floatText(G.player, '+3,000원'); await say(a.id, 'laugh', `어머, 내 ${lost.item}! 찾아 줬구나. 고마워라~ 이거 용돈이야.`); }
  if (a.vid === 'halmeoni' && !S.rel.daily.halmeoni) { S.rel.daily.halmeoni = true; S.inv.tangerine = (S.inv.tangerine || 0) + 1; await say(a.id, 'smile', '옜다, 귤 하나 줄게. 형사 양반 주든가~ 호호.'); toast('🍊 해월도 귤을 받았다'); }
  if (a.vid === 'grandpa' && season() === 'winter' && !S.rel.daily.grandpa) { S.rel.daily.grandpa = true; S.inv.tangerine = (S.inv.tangerine || 0) + 2; toast('🍊 귤 두 개를 받았다'); }
  closeDialog(); a.talking = false;
}
async function staffTalk(a) {
  a.talking = true; a.lookAt(G.player);
  await say(a.id, 'smile', pick(STAFF_LINES[a.id] || ['어서 와요~']));
  if (a.id === 'superman') { closeDialog(); a.talking = false; shopMenu(); return; }
  closeDialog(); a.talking = false;
}
async function rivalTalk(a) {
  a.talking = true; a.stop(); a.lookAt(G.player); G.player.lookAt(a);
  const after = S.rel.flags.lovers;
  const RL = RIVAL_LINES[a.job], pool = after ? RL.after : [...RL.before, RL.season[season()]];
  await say(a.id, after ? 'smile' : pick(['smile', 'tease', 'normal']), pick(pool).replace(/형사님/g, S.rel.stage >= 4 ? himCall() : '형사님'));
  if (Math.random() < 0.4) await say(a.id, 'smile', pick(pool.filter(x => x)).replace(/형사님/g, S.rel.stage >= 4 ? himCall() : '형사님'));
  if (!after && S.rel.stage >= 2 && Math.random() < 0.5) {
    await say(a.id, 'tease', '…혹시 형사님이랑 무슨 사이예요? 그냥 궁금해서요~');
    const c = await choose(['그냥 아는 사이예요', '…비밀이에요', '친한 사이예요']);
    await say(a.id, c === 1 ? 'surprise' : 'smile', ['아~ 그렇구나. 호호.', '어머, 비밀이요? 수상한데~', '그렇구나~ 부럽다.'][c]);
  }
  closeDialog(); a.talking = false;
}
async function jealousEvent(a) {
  const d = G.det, P = G.player; scriptDet();
  d.lookAt(P); a.stop(); a.lookAt(P);
  await say(a.id, 'smile', RIVAL_LINES[a.job].intro);
  await say('det', 'surprise', `아, {me}! …마침 잘 왔어요.`);
  const j = JEALOUS[Math.floor(Math.random() * JEALOUS.length)];
  const opts = JEALOUS.map(x => x.q);
  const c = await choose(opts);
  const J = JEALOUS[c], hi = S.rel.stage >= 4 ? 1 : 0;
  await say('det', hi ? 'blush' : 'normal', J.a[hi]);
  addAff(J.aff[hi], { event: true });
  await say(a.id, 'sad', RIVAL_LINES[a.job].leave);
  endRivalWalk();
  if (c === 2 || S.rel.stage >= 3) { await say('det', 'smile', '같이 걸어요. 어디든.'); startCompanion(); }
  void j;
}

function detMenu() {
  const d = G.det, P = G.player;
  if (!S.rel.flags.met) { runEvent(firstMeeting); return; }
  if (d.task === 'sick' && !S.rel.daily.nursed) { runEvent(sickEvent); return; }
  if (d.task === 'waitLighthouse' && !S.rel.flags.engaged) { runEvent(proposalEvent); return; }
  if (d.task === 'wedding' && !S.rel.flags.married) { runEvent(weddingEvent); return; }
  if (d.task === 'pickup' && !S.rel.daily.pickup) { runEvent(pickupEvent); return; }
  d.talking = true; d.stop(); d.lookAt(P); P.lookAt(d);
  const st = S.rel.stage, sitting = P.seat && d.seat && P.seat.bench === d.seat.bench;
  const items = INTERACTIONS.map(it => {
    const o = { icon: it.icon, label: it.label };
    if (it.id === 'follow' && S.comp) { o.label = '동행 종료'; o.icon = '👋'; }
    if (it.id === 'hand' && S.hold) o.label = '손 놓기';
    if (it.id === 'arm' && S.arm) o.label = '팔짱 풀기';
    if (it.id === 'piggy' && P.carried) o.label = '내려 줘요';
    if (st < it.stage) { o.locked = true; o.note = `${it.stage}단계 ${STAGES[it.stage - 1].name}`; o.why = `「${STAGES[it.stage - 1].name}」 단계에서 열려요`; }
    else if (it.maxStage && st > it.maxStage) { o.disabled = true; o.note = '완료'; }
    else if (it.id === 'confess' && S.rel.flags.lovers) { o.disabled = true; o.note = '완료'; }
    else if (it.companion && !S.comp) { o.disabled = true; o.note = '동행 중 가능'; o.why = '먼저 「함께 다니기」를 해 보세요'; }
    else if (it.sitting && !sitting) { o.disabled = true; o.note = '나란히 앉아서'; o.why = '벤치에 함께 앉았을 때 할 수 있어요'; }
    else if (it.home && M.id !== 'in_home') { o.disabled = true; o.note = '집 안에서'; o.why = '집 안 주방에서 할 수 있어요'; }
    o.onClick = () => doInteraction(it.id);
    return o;
  });
  openSheet({ title: detLabel(), sub: relSummaryHTML(), items, cols: 3, onClose: () => { if (!G.busy) d.talking = false; } });
}
function relSummaryHTML() {
  const r = S.rel, next = STAGES[r.stage];
  let need = '';
  if (next && next.need && next.need.aff) need = `다음: ${next.name} · ♥ ${r.aff}/${next.need.aff}`;
  else if (next) need = `다음: ${next.name} — 특별한 이벤트로 열려요`;
  const pct = next && next.need && next.need.aff ? Math.min(100, r.aff / next.need.aff * 100) : 100;
  return `<div class="relline"><b>${r.stage}단계 · ${stageName()}</b><span>${TASK_LABEL[G.det.task] || ''}${S.comp ? ' · 동행 중' : ''}</span></div><div class="bar"><i style="width:${pct}%"></i></div><div class="relneed">${need} · 오늘 ♥ ${r.daily.affGain}/${DAILY_AFF_CAP}</div>`;
}
async function kissAnim(text, sfx = 'kiss') {
  const d = G.det, P = G.player;
  d.lookAt(P); P.lookAt(d);
  Sound.sfx(sfx); floatText(P, text, '#ff6f91'); burst(d, 'heart', 8); burst(P, 'heart', 6);
  const fl = $('#flash'); fl.classList.add('pink', 'on'); setTimeout(() => fl.classList.remove('on'), 200); setTimeout(() => fl.classList.remove('pink'), 600);
  await sleep(450);
}
function doInteraction(id) {
  runEvent(async () => {
    const d = G.det, r = S.rel, st = r.stage, P = G.player;
    d.talking = true; r.daily.met = true;
    switch (id) {
      case 'greet': {
        const tod = S.min < 11 * 60 ? 'morning' : S.min < 17 * 60 ? 'day' : 'evening';
        d.emo('👋');
        await say('det', st >= 4 ? 'blush' : 'smile', pick(GREETS[tod][Math.min(8, st)]));
        if (!r.daily.greet) { r.daily.greet = true; addAff(1); if (DET_OUTFIT_LINES[d.outfit] && st >= 2) await say('det', 'tease', DET_OUTFIT_LINES[d.outfit]); } else await say('det', 'laugh', '또 인사해요? 하하, 좋아요.');
        break;
      }
      case 'talk': await dailyTalk(); break;
      case 'follow': if (S.comp) { await say('det', 'smile', st >= 4 ? '벌써요? …아쉽다. 조심히 가요.' : '네, 오늘 즐거웠어요. 또 불러요.'); closeDialog(); endCompanion(); } else await requestFollow(); break;
      case 'favor': await favor(); break;
      case 'gift': closeDialog(); d.talking = false; G.busy--; giftMenu(); G.busy++; return;
      case 'photo': await takePhoto(); break;
      case 'sit': closeDialog(); d.talking = false; G.busy--; await sitTogether(); G.busy++; return;
      case 'fish': closeDialog(); d.talking = false; G.busy--; await fishTogether(); G.busy++; return;
      case 'date': closeDialog(); d.talking = false; G.busy--; dateMenu(); G.busy++; return;
      case 'arm':
        S.arm = !S.arm; if (S.arm) S.hold = false;
        if (S.arm) { await say('det', 'blush', r.flags.arm ? '…이제 이거 자연스럽네요, 우리.' : '…이거 반칙인데요. 좋아서 하는 말이에요.'); r.flags.arm = true; burst(d, 'heart', 4); }
        else await say('det', 'tease', '벌써 놔요? 아쉽다.');
        break;
      case 'hand':
        S.hold = !S.hold; if (S.hold) S.arm = false;
        if (S.hold) {
          if (!r.flags.hand) { await say('det', 'surprise', '……'); await say('det', 'blush', '손, 따뜻하네요. 이제 놓으라고 해도 안 놓을 거예요.'); r.flags.hand = true; await addAlbum('처음 손잡은 날', 'hand'); addAff(3, { event: true }); }
          else await say('det', 'smile', pick(['손 차갑다. 제 주머니에 넣을래요?', '이렇게 걸으면 길이 더 짧아져요.', '꼭 잡아요. 섬 바람 세니까.']));
          burst(d, 'heart', 4);
        } else await say('det', 'tease', '놓는 거예요? 다시 잡을 거죠?');
        break;
      case 'cheek':
        await kissAnim('쪽♥');
        await say('det', 'surprise', '……방금, 볼에…');
        await say('det', 'blush', pick(['반대쪽도 비어 있는데요. …농담이에요. 반은.', '오늘 세수 안 할래요.', '…심장 터질 뻔했어요.']));
        if (!r.flags.cheek) { r.flags.cheek = true; await addAlbum('볼에 쪽', 'cheek'); addAff(3, { event: true }); } else if (!r.daily.kiss) { r.daily.kiss = true; addAff(2); }
        break;
      case 'kiss':
        await kissAnim('쪽♥♥');
        await say('det', 'blush', r.flags.kiss ? pick(['…한 번 더.', '이건 매일 해도 안 질려요.', '사랑해요.']) : '…첫 뽀뽀예요. 기억할 거예요. 평생.');
        if (!r.flags.kiss) { r.flags.kiss = true; await addAlbum('첫 뽀뽀', 'kiss'); addAff(5, { event: true }); } else if (!r.daily.kiss) { r.daily.kiss = true; addAff(2); }
        break;
      case 'hug':
        burst(d, 'heart', 8); burst(P, 'heart', 4); Sound.sfx('heart');
        await say('det', 'surprise', '어…'); await say('det', 'blush', pick(['…심장 소리 들리죠? 모른 척해 줘요.', '이대로 5분만. 아니, 10분.', '오늘 하루 피로가 다 풀리네요.']));
        if (!r.daily.hug) { r.daily.hug = true; addAff(2); }
        break;
      case 'backhug':
        burst(d, 'heart', 10); Sound.sfx('heart');
        await say('narr', '', '뒤에서 살며시 안았다.');
        await say('det', 'blush', pick(['…반칙. 이거 완전 반칙이에요.', '이대로 등대까지 걸어갈 수 있을 것 같아요.', '결혼하면 매일 이렇게 해 줘요.']));
        if (!r.daily.hug) { r.daily.hug = true; addAff(2); }
        break;
      case 'pat': d.emo('💗'); await say('det', 'blush', pick(['제가 해야 하는 거 아니에요? …뭐, 좋네요.', '형사 머리 쓰다듬는 사람은 당신이 처음이에요.', '…한 번 더 해 줘요.'])); break;
      case 'lean': P.lean = true; burst(d, 'heart', 4); await say('det', 'smile', pick(['…편해요? 저도 편해요.', '어깨 빌려주는 거, 평생 무료예요.', '이대로 잠들어도 돼요. 깨워 줄게요.'])); setTimeout(() => { P.lean = false; }, 12000); if (!r.flags.lean) { r.flags.lean = true; await addAlbum('어깨에 기대어', 'lean'); } break;
      case 'lap': burst(d, 'heart', 6); await say('narr', '', '형사님 무릎을 베고 누웠다. 바람 소리가 들린다.'); await say('det', 'blush', '…머리카락에 꽃잎 붙었어요. 가만있어요. 이렇게 보는 거 좋다.'); if (!r.flags.lap) { r.flags.lap = true; await addAlbum('무릎베개', 'lap'); addAff(3, { event: true }); } break;
      case 'piggy':
        if (P.carried) { stopPiggy(); await say('det', 'tease', '벌써 내려요? 저 아직 힘 남았는데.'); }
        else { await say('det', 'laugh', '업어 달라고요? 형사 등은 튼튼합니다. 자, 올라와요.'); startPiggy(); if (!r.flags.piggy) { r.flags.piggy = true; await addAlbum('형사님 등에 업혀서', 'piggy'); } }
        break;
      case 'cook': closeDialog(); d.talking = false; G.busy--; await cookTogether(); G.busy++; return;
      case 'invite': closeDialog(); d.talking = false; G.busy--; await doDate('sataek'); G.busy++; return;
      case 'confess': await playerConfess(); break;
      case 'propose': await playerPropose(); break;
      case 'wedding': closeDialog(); d.talking = false; G.busy--; weddingDateMenu(); G.busy++; return;
    }
    closeDialog(); d.talking = false;
  });
}
async function dailyTalk() {
  const r = S.rel, st = Math.min(8, r.stage);
  if (r.daily.fight) { await fightTalk(); return; }
  if (r.daily.talk >= 2) {
    if (r.daily.talk === 2) await say('det', 'laugh', '오늘 말 많이 하네요? 좋아요, 저 수다 좋아해요.');
    await say('det', 'smile', pick([...SMALLTALK[st], ...SEASON_IDLE[season()]]));
    r.daily.talk++; return;
  }
  const pool = TALKS[st] || [], idx = r.talkIdx[st] || 0;
  if (idx < pool.length && r.daily.talk === 0) {
    const tp = pool[idx].job ? JOB_TALK[S.job] : pool[idx];
    await topic(tp);
    r.talkIdx[st] = idx + 1;
  } else { await say('det', 'smile', pick([...SMALLTALK[st], ...SEASON_IDLE[season()], ...(WEATHER_IDLE[S.weather] || [])])); addAff(1); }
  r.daily.talk++;
}
async function requestFollow() {
  const plan = detPlan(S.min), st = S.rel.stage;
  if (plan.k === 'home' && !S.rel.flags.married || plan.k === 'goHome' || S.min >= 21.7 * 60 && !S.rel.flags.married) { await say('det', 'smile', '오늘은 너무 늦었어요. 집까지 조심히 가요. 내일 같이 걸어요.'); return; }
  if (plan.duty && st < 2) { await say('det', 'normal', '아, 지금 근무 중이라서요. 퇴근하면… 오후 5시쯤이면 괜찮아요.'); return; }
  if (plan.duty) { await say('det', 'tease', '순찰 중인데… 같이 걸을래요? 순찰 보조 요원으로 임명합니다.'); await say('det', 'normal', '대신 한 시간 반 정도만이에요.'); startCompanion({ dutyUntil: S.min + 90 }); }
  else { await say('det', st >= 4 ? 'blush' : 'smile', st === 1 ? '좋죠. 해월도 처음이면 제가 마을 안내해 드릴게요. 앞장서요, 제가 따라갈게요.' : st >= 4 ? '기다렸어요. 어디든 가요.' : '좋아요. 어디 갈까요? 당신이 앞장서요.'); startCompanion(); }
  toast('👣 형사님이 함께 다녀요 — 왼쪽 위 아이콘으로 동행 메뉴를 열어요');
}
async function favor() {
  const r = S.rel;
  if (r.favor) {
    const F = FAVORS[r.favor.i];
    if ((S.inv[F.item] || 0) > 0) { S.inv[F.item]--; await say('det', 'smile', F.thanks); S.money += ITEMS[F.item].price + 500; floatText(G.player, '+' + fmtMoney(ITEMS[F.item].price + 500)); r.favor = null; r.daily.favor = true; addAff(4); updateHUD(); }
    else await say('det', 'normal', `${ITEMS[F.item].icon} ${ITEMS[F.item].name}, 기억하죠? 마을 슈퍼에 있어요. 천천히 해도 돼요.`);
    return;
  }
  if (r.daily.favor) { await say('det', 'tease', '오늘은 부탁할 거 없어요. 당신 얼굴 본 걸로 충분해요.'); return; }
  const i = Math.floor(Math.random() * FAVORS.length);
  await say('det', 'normal', FAVORS[i].ask);
  const c = await choose(['맡겨 주세요', '다음에요']);
  if (c === 0) { r.favor = { i, day: S.day }; await say('det', 'smile', '고마워요. 역시 믿을 사람은 당신뿐.'); toast(`📝 부탁: ${ITEMS[FAVORS[i].item].name} 전해 주기`); }
  else await say('det', 'smile', '네, 괜찮아요. 바쁜데 미안해요.');
}
function giftMenu() {
  const d = G.det; d.talking = true;
  const items = Object.entries(S.inv).filter(([k, n]) => n > 0 && ITEMS[k] && k !== 'ring' && k !== 'snack').map(([k, n]) => {
    const it = ITEMS[k], lock = it.minStage && S.rel.stage < it.minStage;
    return { icon: it.icon, label: it.name, note: lock ? '아직 이른 선물' : `${n}개${LIKES.includes(k) ? ' · 좋아함' : ''}`, disabled: lock, why: '조금 더 가까워진 뒤에 주면 좋을 것 같아요', onClick: () => runEvent(() => giveGift(k)) };
  });
  if (!items.length) { toast('줄 수 있는 물건이 없어요. 마을 슈퍼에 가 보세요'); d.talking = false; return; }
  openSheet({ title: '선물하기', sub: '<div class="relneed">형사님 취향: 따뜻한 캔커피 · 도시락 · 직접 딴 해산물 · 전복죽<br>하루 한 번. 같은 선물을 연달아 주면 감동이 줄어요.</div>', items, cols: 3, onClose: () => { if (!G.busy) d.talking = false; } });
}
async function giveGift(k) {
  const d = G.det, r = S.rel, it = ITEMS[k];
  d.talking = true;
  if (r.daily.gift) { await say('det', 'smile', '오늘은 벌써 받았는데요. 그건 내일 줘요, 기다릴게요.'); closeDialog(); d.talking = false; return; }
  S.inv[k]--; r.daily.gift = true; r.gifts++; r.giftLog.unshift({ k, day: S.day }); r.giftLog = r.giftLog.slice(0, 30);
  if (r.favor && FAVORS[r.favor.i].item === k) { await say('det', 'surprise', '어, 이거 제가 부탁한 거!'); r.favor = null; r.daily.favor = true; addAff(3); }
  const repeat = r.lastGift[k] && S.day - r.lastGift[k] <= 3;
  r.lastGift[k] = S.day;
  const c = calendar(S.day);
  let bonus = 0;
  if (k === 'chocolate' && c.month === 2 && c.dom === 4) bonus = 6;
  if (k === 'hotpack' && season() === 'winter') bonus = 2;
  await say('det', it.react[1], repeat ? '또 이거예요? 하하, 제가 좋아하는 거 확실히 아네요.' : it.react[0]);
  addAff(Math.max(1, Math.round((it.gift + bonus) * (repeat ? 0.4 : 1))));
  if (!r.flags.firstGift) { r.flags.firstGift = true; await addAlbum('첫 선물', 'gift'); }
  closeDialog(); d.talking = false;
}

/* ---------------- 이벤트 실행 ---------------- */
async function runEvent(fn) {
  G.busy++; G.player.stop(); G.pending = null;
  try { await fn(); } catch (e) { console.error(e); }
  finally {
    closeDialog(); G.busy = Math.max(0, G.busy - 1);
    if (G.det.state === 'script') G.det.state = S.comp ? 'comp' : 'sched';
    G.det.talking = false; G.det.scripted = false; G.camFocus = null;
    save(); updateHUD();
    if (G.stageUpPending && !G.busy) showStageUp();
  }
}
function scriptDet() { if (G.det.state !== 'comp') G.det.state = 'script'; G.det.scripted = true; G.det.stop(); }
