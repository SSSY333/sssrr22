// UI: 타이틀 · 캐릭터 생성 · HUD · 개인 단말 · 상점 · 토스트 · 시트
'use strict';
PX.UI = (() => {
  const U = PX.U, Cal = PX.Cal, St = PX.St, el = U.el;
  const $ = id => document.getElementById(id);

  // ---------- 토스트 ----------
  function toast(text, ms = 2600) {
    const t = el('div', { class: 'toast' }, text);
    const box = $('toasts'); while (box.children.length >= 3) box.firstChild.remove();
    box.append(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 400);
  }
  // ---------- 시트 (모달) ----------
  let sheetStack = 0;
  function sheet(title, build, opt = {}) {
    const wrap = el('div', { class: 'sheet-wrap' });
    const card = el('div', { class: 'sheet' + (opt.wide ? ' wide' : '') });
    const head = el('div', { class: 'sheet-head' }, el('b', null, title));
    const x = el('button', { class: 'x', 'aria-label': '닫기' }, '✕');
    head.append(x);
    const body = el('div', { class: 'sheet-body' });
    card.append(head, body); wrap.append(card); $('sheets').append(wrap);
    sheetStack++; PX.Game.modal++;
    const close = () => { if (!wrap.isConnected) return; wrap.remove(); sheetStack--; PX.Game.modal--; opt.onClose && opt.onClose(); };
    x.onclick = close;
    wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
    build(body, close);
    return close;
  }
  // 페이지 안 확인 창 (아티팩트에서는 브라우저 confirm()이 막혀 있다)
  function ask(title, text, yes = '확인', no = '취소') {
    return new Promise(res => {
      let done = false;
      sheet(title, (b, close) => {
        b.append(el('p', null, text));
        const y = el('button', { class: 'menu-btn' }, el('span', null, yes)); y.onclick = () => { done = true; close(); res(true); };
        const n = el('button', { class: 'menu-btn ghost' }, el('span', null, no)); n.onclick = () => { done = true; close(); res(false); };
        b.append(y, n);
      }, { onClose: () => { if (!done) res(false); } });
    });
  }
  function menu(title, items) { // items: [{t, fn, sub, off}]
    return new Promise(res => {
      let picked = false;
      const close = sheet(title, (b, close) => {
        for (const it of items) {
          const btn = el('button', { class: 'menu-btn' + (it.off ? ' off' : '') }, el('span', null, it.t), it.sub ? el('small', null, it.sub) : null);
          btn.onclick = () => { if (it.off) { toast(it.offMsg || '지금은 할 수 없어요'); return; } picked = true; close(); res(it); it.fn && it.fn(); };
          b.append(btn);
        }
      }, { onClose: () => { if (!picked) res(null); } });
    });
  }

  // ---------- HUD ----------
  function hud() {
    const S = St.S, G = PX.Game;
    const t = S.time;
    $('hDate').textContent = Cal.fmtDate(t);
    $('hTime').textContent = Cal.fmtTime(t.min);
    const w = St.weather();
    $('hWx').textContent = (PX.MAPS[G.mapId].dome ? '🔆' : Cal.WEATHER[w].icon) + ' ' + Cal.SEASON_KO[St.season()];
    $('hMoney').textContent = '₢ ' + S.money.toLocaleString();
    $('hEnergy').style.width = S.energy + '%';
    $('hEnergy').parentElement.classList.toggle('low', S.energy < 30);
    $('hLoc').textContent = PX.MAPS[G.mapId].name;
    const r = S.rel.cap;
    const near = G.cap.map === G.mapId;
    $('capChip').innerHTML = `<b>${S.capName}</b>${near ? ' · 가까이 있음' : ''} <span class="heart">♥ ${St.stageName(r.stage)}</span>`;
  }
  function badge() { const n = St.S.messages.filter(m => m.reply == null).length; $('termBadge').textContent = n || ''; $('termBadge').style.display = n ? '' : 'none'; }

  // ---------- 타이틀 ----------
  function title() {
    const T = $('title'); T.classList.remove('hidden');
    const box = $('titleBtns'); box.innerHTML = '';
    const last = St.lastSlot();
    const lp = last && St.peek(last);
    if (lp && !lp.broken) box.append(el('button', { class: 'big', onclick: () => PX.Game.loadSlot(last) }, '이어하기', el('small', null, `${lp.name} · ${lp.date}`)));
    box.append(el('button', { class: 'big', onclick: () => pickSlot('new') }, '새로 시작'));
    box.append(el('button', { class: 'big ghost', onclick: () => pickSlot('load') }, '불러오기'));
    drawTitleArt();
  }
  function pickSlot(kind) {
    sheet(kind === 'new' ? '새 게임 — 저장 칸 고르기' : '불러오기', (b, close) => {
      for (const n of [1, 2]) {
        const p = St.peek(n);
        const info = p ? (p.broken ? '손상된 저장' : `${p.name} (${p.job}) · ${p.date} · ${p.cap}와(과) ${p.stage}`) : '비어 있음';
        const btn = el('button', { class: 'menu-btn' }, el('span', null, `저장 칸 ${n}`), el('small', null, info));
        btn.onclick = async () => {
          if (kind === 'load') { if (!p || p.broken) { toast('불러올 저장이 없어요'); return; } close(); PX.Game.loadSlot(n); return; }
          if (p && !(await ask('새로 시작', `저장 칸 ${n}번의 기록(${p.name})을 지우고 새로 시작할까요?`, '지우고 새로 시작'))) return;
          close(); create(n);
        };
        b.append(btn);
      }
    });
  }
  function drawTitleArt() {
    const c = $('titleArt'), g = c.getContext('2d');
    c.width = 180; c.height = 320; g.imageSmoothingEnabled = false;
    const r = U.rng('title');
    const grd = g.createLinearGradient(0, 0, 0, 320); grd.addColorStop(0, '#120c24'); grd.addColorStop(0.6, '#3a1f4a'); grd.addColorStop(1, '#a8483a');
    g.fillStyle = grd; g.fillRect(0, 0, 180, 320);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.2 ? '#ffd9f0' : '#ffffff'; g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(r() * 180 | 0, r() * 220 | 0, 1, 1); }
    g.globalAlpha = 1;
    // 붉은 행성
    for (let y = -40; y <= 40; y++) for (let x = -40; x <= 40; x++) { const d = Math.hypot(x, y); if (d > 40) continue; const lit = (x * -0.6 + y * -0.5) / 40; g.fillStyle = d > 37 ? '#ff9a7a' : lit > 0.25 ? '#e0704f' : lit > -0.2 ? '#c4523a' : '#8a3328'; if ((x * 7 + y * 13) % 11 === 0 && d < 34) g.fillStyle = '#b04a35'; g.fillRect(130 + x, 70 + y, 1, 1); }
    g.fillStyle = '#e8c0ff'; g.fillRect(40, 40, 3, 3);
    // 돔과 지평선
    g.fillStyle = '#5a2a30'; g.fillRect(0, 250, 180, 70);
    g.fillStyle = '#7a3a36'; for (let x = 0; x < 180; x++) g.fillRect(x, 246 + Math.round(Math.sin(x / 13) * 3), 1, 6);
    for (let y = 0; y <= 34; y++) { const w = Math.round(Math.sqrt(34 * 34 - y * y) * 1.6); g.fillStyle = 'rgba(160,220,255,0.18)'; g.fillRect(40 - w + 50, 250 - y, w * 2, 1); }
    g.fillStyle = '#ffe2a0'; for (let i = 0; i < 14; i++) g.fillRect(56 + (r() * 70 | 0), 236 + (r() * 12 | 0), 1, 2);
    // 두 사람 실루엣
    const cap = PX.NPC_BY_ID.cap.look;
    const f1 = PX.S.get(cap, 'hold', 0, 'B', 'normal'), f2 = PX.S.get({ skin: PX.S.SKINS[0], hair: 'pony', hairColor: '#2a2433', eye: '#6b3d22', top: '#e6e2ea', bottom: '#8a8794', sleeve: 'long', hood: 1 }, 'holdL', 0, 'B', 'normal');
    g.drawImage(f1.c, 66, 222); g.drawImage(f2.c, 96, 234);
  }

  // ---------- 캐릭터 생성 ----------
  function create(slot) {
    $('title').classList.add('hidden');
    const C = $('create'); C.classList.remove('hidden');
    const f = { name: '', gender: '여성', skin: 0, hair: 'pony', hairColor: '흑발', eye: '갈색', outfit: 'hoodie', job: 'medic', capName: '서무진', mode: 'normal', start: { y: 2027, m: 1, d: 1 } };
    const body = $('createBody'); body.innerHTML = '';
    const row = (label, ...kids) => el('div', { class: 'row' }, el('label', null, label), el('div', { class: 'ctl' }, ...kids));
    const swatches = (list, key, colorOf) => { const w = el('div', { class: 'sw' }); list.forEach((v, i) => { const b = el('button', { class: 'swb', style: `background:${colorOf(v, i)}`, title: typeof v === 'string' ? v : '' }); b.onclick = () => { f[key] = typeof v === 'string' ? v : i; [...w.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); preview(); }; if ((typeof v === 'string' ? v : i) === f[key]) b.classList.add('on'); w.append(b); }); return w; };
    const chips = (list, key) => { const w = el('div', { class: 'chips' }); for (const [v, t] of list) { const b = el('button', { class: 'chip' + (f[key] === v ? ' on' : '') }, t); b.onclick = () => { f[key] = v; [...w.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); preview(); }; w.append(b); } return w; };
    const nameIn = el('input', { type: 'text', maxlength: '8', placeholder: '예: 한지우', autocomplete: 'off' });
    nameIn.oninput = () => { f.name = nameIn.value.trim(); preview(); };
    const capIn = el('input', { type: 'text', maxlength: '8', value: f.capName, autocomplete: 'off' });
    capIn.oninput = () => { f.capName = capIn.value.trim() || '서무진'; preview(); };
    const yIn = el('input', { type: 'number', min: '2026', max: '2099', value: '2027', class: 'num' }), mIn = el('input', { type: 'number', min: '1', max: '12', value: '1', class: 'num' }), dIn = el('input', { type: 'number', min: '1', max: '31', value: '1', class: 'num' });
    const dateOk = () => { const y = +yIn.value, m = +mIn.value, d = +dIn.value; return y >= 2026 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= Cal.daysInMonth(y, m); };
    const dateNote = el('small', { class: 'note' });
    const onDate = () => { if (dateOk()) { f.start = { y: +yIn.value, m: +mIn.value, d: +dIn.value }; dateNote.textContent = Cal.fmtDate(f.start) + (Cal.isLeap(f.start.y) ? ' · 윤년(366일)' : ' · 평년(365일)'); } else dateNote.textContent = '올바른 날짜가 아니에요'; preview(); };
    [yIn, mIn, dIn].forEach(i => (i.oninput = onDate));
    const jobBox = el('div', { class: 'jobs' });
    for (const k in PX.JOBS) {
      const j = PX.JOBS[k];
      const b = el('button', { class: 'job' + (f.job === k ? ' on' : '') }, el('b', null, j.ko), el('small', null, j.desc));
      b.onclick = () => { f.job = k; [...jobBox.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); preview(); };
      jobBox.append(b);
    }
    body.append(
      row('이름', nameIn),
      row('성별', chips([['여성', '여성'], ['남성', '남성'], ['선택 안 함', '선택 안 함']], 'gender')),
      row('피부색', swatches(PX.S.SKINS, 'skin', v => v)),
      row('머리 모양', chips(Object.entries(PX.S.HAIRS), 'hair')),
      row('머리 색', swatches(Object.keys(PX.S.HAIRC), 'hairColor', v => PX.S.HAIRC[v])),
      row('눈 색', swatches(Object.keys(PX.S.EYEC), 'eye', v => PX.S.EYEC[v])),
      row('기본 복장', chips(Object.entries(PX.S.OUTFITS).map(([k, o]) => [k, o.ko]), 'outfit')),
      el('div', { class: 'row col' }, el('label', null, '직업'), jobBox),
      row('대위 이름', capIn),
      row('관계 진행', chips([['normal', '보통'], ['fast', '빠르게 (호감 2배)'], ['lovers', '이미 연인으로 시작']], 'mode')),
      row('시작 날짜', el('div', { class: 'date' }, yIn, '년', mIn, '월', dIn, '일'), dateNote),
    );
    const pv = $('createPreview');
    function preview() {
      const g = pv.getContext('2d'); pv.width = 96; pv.height = 64; g.imageSmoothingEnabled = false;
      g.fillStyle = '#2a2238'; g.fillRect(0, 0, 96, 64);
      g.fillStyle = '#3a3050'; g.fillRect(0, 50, 96, 14);
      const pa = PX.S.playerApp(f, 'spring');
      const a = PX.S.get(pa, 'idle', 0, 'F', 'smile'), b = PX.S.get(PX.NPC_BY_ID.cap.look, 'idle', 0, 'F', 'smirk');
      g.drawImage(a.c, 52, 64 - a.c.height - 2); g.drawImage(b.c, 6, 64 - b.c.height - 1);
      $('createGo').disabled = !(f.name && dateOk());
      $('createName').textContent = (f.name || '이름') + ' · ' + PX.JOBS[f.job].ko;
    }
    onDate();
    $('createGo').onclick = () => { if (!f.name || !dateOk()) return; C.classList.add('hidden'); PX.Game.startNew(Object.assign({}, f, { slot })); };
    $('createBack').onclick = () => { C.classList.add('hidden'); title(); };
    setTimeout(() => nameIn.focus(), 100);
  }

  // ---------- 개인 단말 ----------
  const TABS = [['map', '🗺️ 지도'], ['cal', '📅 일정표'], ['duty', '🗓️ 근무표'], ['rel', '💞 관계도'], ['msg', '📱 메시지'], ['contacts', '👥 연락처'], ['inv', '🎒 소지품'], ['quest', '📋 부탁'], ['codex', '📗 생태도감'], ['album', '📷 사진첩'], ['lore', '📚 로어북'], ['set', '⚙️ 설정·저장']];
  let termTab = 'cal';
  function terminal(tab) {
    if (tab) termTab = tab;
    sheet('개인 단말', (b, close) => {
      const tabs = el('div', { class: 'tabs' }), pane = el('div', { class: 'pane' });
      const show = (k) => { termTab = k; [...tabs.children].forEach(c => c.classList.toggle('on', c.dataset.k === k)); pane.innerHTML = ''; PANES[k](pane, close); };
      for (const [k, t] of TABS) { const btn = el('button', { 'data-k': k }, t); if (k === 'msg') btn.append(el('i', { class: 'dot', id: 'msgDot' })); btn.onclick = () => show(k); tabs.append(btn); }
      b.append(tabs, pane); show(termTab);
    }, { wide: true });
  }
  let calView = null;
  const PANES = {
    map(p) {
      const G = PX.Game, S = St.S;
      const outId = PX.MAPS[G.mapId].kind === 'out' ? G.mapId : PX.MAPS[G.mapId].parent;
      const m = PX.W.maps[outId];
      const k = m.w > 50 ? 6 : 8;
      const c = el('canvas', { class: 'minimap' }); const g = c.getContext('2d');
      c.width = m.w * k; c.height = m.h * k;
      const col = { sand: '#c4613f', grass: '#4fa35a', concrete: '#a7a3a8', plaza: '#c9c1b6', asphalt: '#4a4652', roadline: '#4a4652', dirt: '#9a5a3a', hangar: '#6d7480', domegrass: '#64c27a', cafe: '#e8d2b0', water: '#4fb3d9', deepwater: '#2a6f9a', glassfloor: '#9fd8e8', silversand: '#c9ccd6', whitesand: '#efe6d2', ice: '#bfe6f2', snowfield: '#e8f0f6', void: '#0d0a1c', crystal: '#4a3a6a', redrock: '#8a4430', boardwalk: '#a0743f', mosaic: '#d6c9e8', neonfloor: '#2a1f3f', rail: '#5a4a6a', metal: '#7f8a96' };
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { g.fillStyle = col[m.tiles[y * m.w + x]] || '#888'; g.fillRect(x * k, y * k, k, k); }
      const ICON = { shop: '🛒', stall: '🛍️', meal: '🍱', shuttle: '🧭', fish: '🎣', view: '🔭', campfire: '🔥', harvest: '🌱', hang: '💪', shoot: '🎯', course: '🏃', event: '🎪', kiosk: 'ℹ️', grill: '🥓', claw: '🐰', onsen: '♨️', rail: '🚃', salvage: '🔍', sandcastle: '🏰', tent: '⛺' };
      const marks = [];
      for (const o of m.objs) {
        if (o.kind === 'bld') { g.fillStyle = o.b.closed ? '#6a6070' : o.b.stripe; g.fillRect(o.x * k, o.y * k, o.fw * k, o.fd * k); g.strokeStyle = '#120c20'; g.lineWidth = 2; g.strokeRect(o.x * k, o.y * k, o.fw * k, o.fd * k); marks.push([o.x + o.fw / 2, o.y + o.fd / 2, o.b.name.replace(/ \(.*\)$/, ''), true]); }
        else if (o.kind === 'furn' && !o.hidden && ICON[o.use]) marks.push([o.x + o.fw / 2, o.y + o.fd / 2, ICON[o.use], false]);
        else if (o.kind === 'furn' && o.blocks && !o.desert) { g.fillStyle = 'rgba(30,20,40,0.35)'; g.fillRect(o.x * k, o.y * k, o.fw * k, o.fd * k); }
      }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const [x, y, t, isB] of marks) {
        if (isB) { g.font = `${Math.max(11, k * 1.7)}px Jua, sans-serif`; const w = g.measureText(t).width + 8; g.fillStyle = 'rgba(27,20,48,0.85)'; g.fillRect(x * k - w / 2, y * k - k, w, k * 2); g.fillStyle = '#fff7ef'; g.fillText(t, x * k, y * k); }
        else { g.font = `${k * 2}px sans-serif`; g.fillText(t, x * k, y * k); }
      }
      const pIn = G.mapId === outId ? G.player : null;
      const dot = (x, y, c2) => { g.fillStyle = '#120c20'; g.beginPath(); g.arc(x * k, y * k, k * 0.9, 0, 7); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(x * k, y * k, k * 0.6, 0, 7); g.fill(); };
      if (pIn) dot(pIn.x, pIn.y, '#ffffff'); else { const d = m.doors.find(d => d.to === G.mapId); if (d) dot(d.x + 0.5, d.y + 0.5, '#ffffff'); }
      const REG = [['606부대', ['base']], ['돔시티', ['dome', 'plaza', 'corridor', 'bridge', 'rubyway']], ['돔시티 관광구역', ['lake', 'farm', 'glasshouse', 'glowpath', 'bluegarden', 'hill', 'beach', 'silverdesert', 'camp']], ['우주 · 다른 행성', ['port', 'station', 'planet3', 'planet4', 'planet6']], ['외곽 (출입 제한)', ['outskirts']]];
      const reg = el('div', { class: 'maplist' });
      for (const [name, ids] of REG) reg.append(el('div', { class: 'li' }, el('b', null, name), el('small', null, ' ' + ids.map(i => PX.MAPS[i].name + (i === outId ? ' ← 지금' : '')).join(' · '))));
      p.append(el('p', { class: 'muted' }, `${m.name} · 흰 점: 나 · 아이콘: 할 수 있는 것`), el('div', { class: 'mapwrap' }, c),
        el('h4', null, '페르녹스 지역'), reg,
        el('p', { class: 'muted' }, '이동: 각 지역의 🧭 이동 안내 단말(부대 정문 옆 · 돔시티 셔틀 정류장 · 중앙광장 남쪽 · 우주항구 터미널)에서 골라요.'));
    },
    cal(p) {
      const S = St.S;
      if (!calView) calView = { y: S.time.y, m: S.time.m };
      const head = el('div', { class: 'calhead' });
      const prev = el('button', null, '◀'), next = el('button', null, '▶');
      const tt = el('b', null, `${calView.y}년 ${calView.m}월 ${Cal.isLeap(calView.y) ? '(윤년)' : ''}`);
      prev.onclick = () => { calView.m--; if (calView.m < 1) { calView.m = 12; calView.y--; } p.innerHTML = ''; PANES.cal(p); };
      next.onclick = () => { calView.m++; if (calView.m > 12) { calView.m = 1; calView.y++; } p.innerHTML = ''; PANES.cal(p); };
      head.append(prev, tt, next);
      const grid = el('div', { class: 'calgrid' });
      for (const w of Cal.WD) grid.append(el('div', { class: 'wd' }, w));
      const first = Cal.weekday(calView.y, calView.m, 1);
      for (let i = 0; i < first; i++) grid.append(el('div', { class: 'cd empty' }));
      const detail = el('div', { class: 'caldetail' });
      const showDay = d => {
        const date = { y: calView.y, m: calView.m, d };
        const ev = Cal.eventsOn(date);
        detail.innerHTML = '';
        detail.append(el('b', null, Cal.fmtDate(date) + ' · ' + Cal.SEASON_KO[Cal.season(date.m)] + ' · 날씨 예보 ' + Cal.WEATHER[Cal.weatherOf(date)].ko));
        if (!ev.length) detail.append(el('p', { class: 'muted' }, '등록된 행사가 없어요.'));
        for (const e of ev) detail.append(el('div', { class: 'ev' }, el('b', null, `${e.id} ${e.originalTitle}`), el('small', null, `${e.location}${e.startTime ? ' · ' + e.startTime + '~' + e.endTime : ''}`), el('p', null, e.description), e.captainReaction ? el('p', { class: 'cap' }, '대위: ' + e.captainReaction) : null));
      };
      for (let d = 1; d <= Cal.daysInMonth(calView.y, calView.m); d++) {
        const date = { y: calView.y, m: calView.m, d };
        const ev = Cal.eventsOn(date);
        const today = date.y === S.time.y && date.m === S.time.m && d === S.time.d;
        const wd = Cal.weekday(date.y, date.m, d);
        const cell = el('button', { class: 'cd' + (today ? ' today' : '') + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '') }, String(d));
        if (ev.length) cell.append(el('i', { class: 'evdot' + (ev.some(e => e.eventType === 'base') ? ' base' : '') }));
        cell.onclick = () => { [...grid.querySelectorAll('.cd')].forEach(c => c.classList.remove('sel')); cell.classList.add('sel'); showDay(d); };
        grid.append(cell);
      }
      p.append(head, grid, detail);
      showDay(calView.y === S.time.y && calView.m === S.time.m ? S.time.d : 1);
    },
    duty(p) {
      const S = St.S, j = PX.JOBS[S.player.job];
      const today = St.isWeekend() ? '주말 (비번)' : '평일 근무일';
      const done = (S.workLog[S.day] || 0);
      p.append(el('h4', null, `내 근무표 · ${j.ko}`), el('p', null, `오늘: ${today}`),
        el('table', { class: 'tbl' }, el('tr', null, el('th', null, '시간'), el('th', null, '내용')),
          el('tr', null, el('td', null, '09:00~12:00'), el('td', null, `오전 근무 (${PX.MAPS[j.work].name})`)),
          el('tr', null, el('td', null, '12:00~13:00'), el('td', null, '점심 (식당동)')),
          el('tr', null, el('td', null, '13:00~17:00'), el('td', null, '오후 근무')),
          el('tr', null, el('td', null, '주말'), el('td', null, '비번 · 자유 외출'))),
        el('p', { class: 'muted' }, `오늘 근무 ${done}/2회 완료. 근무지의 업무 자리를 눌러 근무하면 급여 ₢${j.pay}을 받아요.`));
      p.append(el('p', { class: 'muted' }, '대위의 일정은 단말에 나오지 않아요. 부대원들에게 물어보면 알려 줄지도 몰라요.'));
    },
    rel(p) {
      const S = St.S, r = S.rel.cap;
      const pct = r.stage >= 7 ? 100 : Math.round(Math.min(1, (r.aff - St.THRESH[r.stage]) / Math.max(1, St.THRESH[r.stage + 1] - St.THRESH[r.stage])) * 100);
      p.append(el('div', { class: 'relcard' },
        el('b', null, `${S.capName} 대위`), el('small', null, '606부대 수색팀 팀장 · 35세 · 193cm'),
        el('div', { class: 'stages' }, ...St.STAGES.map((s, i) => el('span', { class: i === r.stage ? 'on' : i < r.stage ? 'past' : '' }, s))),
        el('div', { class: 'bar' }, el('i', { style: `width:${pct}%` })),
        el('small', null, `호감도 ${r.aff} / 1000 · 처음 만난 지 ${S.day - r.metDay}일${r.loverSince != null ? ` · 연인 ${S.day - r.loverSince + 1}일째` : ''}`),
        el('small', null, r.stage === 3 ? '조금만 더 가까워지면 대위가 무언가 말하려 할지도…' : r.stage >= 4 ? '약혼 · 결혼은 Beta 0.6에서 열립니다.' : '대화, 선물, 동행, 스킨십으로 가까워져요. 거절해도 불이익은 없어요.')));
      const list = el('div', { class: 'npclist' });
      for (const n of PX.NPCS) { if (n.id === 'cap') continue; const rr = S.rel.npc[n.id]; list.append(el('div', { class: 'li' }, el('b', null, n.name), el('small', null, n.job), el('div', { class: 'bar sm' }, el('i', { style: `width:${rr.f}%` })))); }
      p.append(el('h4', null, '부대원 · 주민'), list);
    },
    msg(p) {
      const S = St.S;
      if (!S.messages.length) p.append(el('p', { class: 'muted' }, `${S.capName}에게 온 메시지가 없어요. 떨어져 있으면 가끔 연락이 와요.`));
      for (const m of S.messages) {
        const box = el('div', { class: 'msg' }, el('small', null, `${Cal.fmtDate(Cal.addDays({ y: 1, m: 1, d: 1 }, m.day))} ${Cal.fmtTime(m.min)}`), el('div', { class: 'bub cap' }, m.t));
        if (m.reply === 'free') { box.append(el('div', { class: 'bub me' }, m.mine), el('div', { class: 'bub cap' }, m.ans)); }
        else if (m.reply != null) { box.append(el('div', { class: 'bub me' }, m.r[m.reply][0]), el('div', { class: 'bub cap' }, m.r[m.reply][2])); }
        else {
          const ch = el('div', { class: 'msgch' });
          m.r.forEach((rr, i) => { const b = el('button', null, rr[0]); b.onclick = () => { m.reply = i; St.addAff(rr[1]); badge(); p.innerHTML = ''; PANES.msg(p); }; ch.append(b); });
          if (PX.AI.available()) { // 직접 답장 쓰기 → 대위가 AI로 답장
            const free = el('button', { class: 'free' }, '✍️ 직접 쓰기');
            free.onclick = () => {
              const row = el('div', { class: 'msgfree' }), inp = el('input', { type: 'text', maxlength: '120', placeholder: '답장을 입력하세요' }), go = el('button', null, '보내기');
              row.append(inp, go); ch.replaceWith(row); inp.focus();
              const sendIt = async () => {
                const v = inp.value.trim(); if (!v) return;
                go.disabled = true; go.textContent = '…';
                try { const ans = await PX.AI.replyMsg(m, v); m.reply = 'free'; m.mine = v; m.ans = ans; badge(); p.innerHTML = ''; PANES.msg(p); }
                catch (e) { go.disabled = false; go.textContent = '보내기'; toast('📡 답장을 보내지 못했어요. 다시 시도해 주세요.'); }
              };
              go.onclick = sendIt; inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) sendIt(); };
            };
            ch.append(free);
          }
          box.append(ch);
        }
        p.append(box);
      }
      badge();
    },
    contacts(p) {
      const S = St.S;
      for (const n of PX.NPCS) {
        const name = n.id === 'cap' ? S.capName : n.name;
        const where = n.id === 'cap' ? (PX.Game.cap.map === PX.Game.mapId ? '가까이 있음' : '알 수 없음') : (() => { const npc = PX.Game.npcs.find(x => x.id === n.id); return npc && npc.map ? PX.MAPS[npc.map].name : '지도 밖 (개인 공간)'; })();
        p.append(el('details', { class: 'contact' }, el('summary', null, el('b', null, name), el('small', null, ` ${n.job} · 지금: ${where}`)),
          el('p', null, `${n.age}세 · ${n.personality}`), el('p', { class: 'muted' }, `근무지: ${n.work} · 거주: ${n.home} · 좋아하는 음식: ${n.likesFood} · 좋아하는 선물: ${n.likesGift}`)));
      }
    },
    inv(p) {
      const S = St.S;
      const ids = Object.keys(S.inv).filter(k => S.inv[k] > 0);
      if (!ids.length) p.append(el('p', { class: 'muted' }, '가진 물건이 없어요. PX나 카페에서 살 수 있어요.'));
      for (const id of ids) {
        const it = PX.ITEMS[id];
        const row = el('div', { class: 'item' }, el('span', { class: 'ic' }, it.icon), el('div', null, el('b', null, `${it.name} ×${S.inv[id]}`), el('small', null, it.desc)));
        if (it.cat === 'food') { const b = el('button', null, '먹기'); b.onclick = () => { St.addItem(id, -1); S.energy = Math.min(100, S.energy + (it.energy || 5)); toast(`${it.icon} ${it.name} — 기력 +${it.energy || 5}`); p.innerHTML = ''; PANES.inv(p); }; row.append(b); }
        if (it.cat === 'furn') row.append(el('small', { class: 'tag' }, '숙소 꾸미기에서 배치'));
        p.append(row);
      }
      p.append(el('p', { class: 'muted' }, `소지금 ₢${S.money} · 기력 ${Math.round(S.energy)}/100`));
    },
    quest(p) {
      const S = St.S;
      const qs = (S.quests || []);
      if (!qs.length) p.append(el('p', { class: 'muted' }, '오늘 들어온 부탁이 없어요.'));
      for (const q of qs) {
        const n = PX.NPC_BY_ID[q.npc], it = PX.ITEMS[q.item];
        const npc = PX.Game.npcs.find(x => x.id === q.npc);
        const where = npc && npc.map ? PX.MAPS[npc.map].name : '지금은 자리에 없음';
        p.append(el('div', { class: 'ev' + (q.done ? ' done' : '') }, el('b', null, `${q.done ? '✅' : '📌'} ${n.name}: ${it.icon} ${it.name} 구해 주기`), el('small', null, `사례 ₢${q.reward} · ${q.hint} · ${n.name} 위치: ${where}${St.has(q.item) && !q.done ? ' · 가지고 있음!' : ''}`), el('p', null, q.done ? '전달 완료' : `남은 기한 ${Math.max(1, 3 - (S.day - q.day))}일 · 물건을 들고 ${n.name}에게 말을 거세요.`)));
      }
      p.append(el('p', { class: 'muted' }, `지금까지 들어준 부탁 ${S.stats.quests || 0}건. 매일 아침 새 부탁이 와요.`));
    },
    codex(p) {
      const S = St.S, c = S.codex || {};
      const n = PX.CODEX.filter(e => c[e.id]).length;
      p.append(el('p', { class: 'muted' }, `등록 ${n} / ${PX.CODEX.length} · 연구원은 검역 분류, 수색 소위는 드론 정찰로 많이 채울 수 있어요. 화단·배양조를 살펴보기도 해 보세요.`));
      for (const e of PX.CODEX) {
        const got = c[e.id] != null;
        p.append(el('div', { class: 'ev' }, el('b', null, got ? `${e.n}` : '??? '), el('small', null, got ? e.t : `힌트: ${e.how}`), got ? el('p', null, e.d) : null));
      }
    },
    album(p) {
      const S = St.S;
      if (!S.album.length) p.append(el('p', { class: 'muted' }, '아직 추억이 없어요. 대위와의 첫 순간들이 자동으로 기록돼요. 📷 버튼으로 직접 찍을 수도 있어요.'));
      const grid = el('div', { class: 'album' });
      for (const a of S.album.slice().reverse()) grid.append(el('div', { class: 'ph' }, a.img ? el('img', { src: a.img, alt: a.title }) : el('div', { class: 'noimg' }, '📷'), el('b', null, a.title), el('small', null, a.date), el('p', null, a.text)));
      p.append(grid);
    },
    lore(p) {
      const q = el('input', { type: 'search', placeholder: '검색 (예: 축제, 4월, 대위)', class: 'search' });
      const list = el('div');
      const typeKo = { world: '세계관', festival: '축제', tour: '관광', place: '장소', travel: '여행', base: '부대 행사', special: '특수 일상', food: '음식·생활', adult: '루비웨이(성인)' };
      const render = () => {
        list.innerHTML = '';
        const k = q.value.trim();
        for (const e of PX.LORE) {
          const hay = e.id + e.originalTitle + e.description + e.keywords.join() + e.location + (e.months.join('월 ') + '월') + typeKo[e.eventType] + e.captainReaction;
          if (k && !hay.includes(k)) continue;
          list.append(el('details', { class: 'contact' }, el('summary', null, el('b', null, `${e.id} ${e.originalTitle}`), el('small', null, ` ${typeKo[e.eventType]} · ${e.location}`)),
            el('p', null, e.description), el('p', { class: 'muted' }, `시기: ${e.months.length === 12 ? '연중' : e.months.join('·') + '월'}${e.peakMonths ? ' (성수기 ' + e.peakMonths.join('·') + '월)' : ''}${e.startTime ? ' · ' + e.startTime + '~' + e.endTime : ''} · 조건: ${e.accessCondition}`),
            e.captainReaction ? el('p', { class: 'cap' }, '대위: ' + e.captainReaction) : null,
            el('p', { class: 'muted' }, e.implemented === 'map' ? '✅ 게임 안에 구현됨' : '🗓️ 일정·정보 등록됨 (장소 맵은 이후 버전)')));
        }
      };
      q.oninput = render; p.append(q, list); render();
    },
    set(p, close) {
      const S = St.S;
      const sp = el('div', { class: 'chips' });
      for (const k of ['slow', 'normal', 'fast']) { const b = el('button', { class: 'chip' + (S.settings.speed === k ? ' on' : '') }, Cal.SPEED_KO[k]); b.onclick = () => { S.settings.speed = k; [...sp.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); }; sp.append(b); }
      const snd = el('button', { class: 'chip' + (S.settings.sound ? ' on' : '') }, S.settings.sound ? '🔊 효과음 켬' : '🔇 효과음 끔');
      snd.onclick = () => { S.settings.sound = !S.settings.sound; snd.textContent = S.settings.sound ? '🔊 효과음 켬' : '🔇 효과음 끔'; snd.classList.toggle('on', S.settings.sound); };
      p.append(el('h4', null, '시간 흐름'), sp, el('h4', null, '소리'), snd, el('h4', null, '저장'));
      for (const n of [1, 2]) {
        const pk = St.peek(n);
        const b = el('button', { class: 'menu-btn' }, el('span', null, `저장 칸 ${n}에 저장${S.slot === n ? ' (사용 중)' : ''}`), el('small', null, pk ? `${pk.name} · ${pk.date}` : '비어 있음'));
        b.onclick = async () => { if (pk && S.slot !== n && !(await ask('저장', `저장 칸 ${n}번(${pk.name})을 덮어쓸까요?`, '덮어쓰기'))) return; const ok = St.save(n, false); toast(ok ? `💾 저장 칸 ${n}에 저장했어요` : '저장하지 못했어요 (저장 공간 부족)'); p.innerHTML = ''; PANES.set(p, close); };
        p.append(b);
      }
      p.append(el('p', { class: 'muted' }, `자동 저장: 지금 쓰는 저장 칸 ${S.slot}에 장소 이동·잠·5분마다 자동으로 저장돼요. (저장 버전 v${St.SAVE_VERSION})`));
      p.append(el('button', { class: 'menu-btn ghost', onclick: () => { St.save(S.slot); close(); PX.Game.toTitle(); } }, el('span', null, '저장하고 타이틀로')));
    },
  };

  // ---------- 상점 ----------
  function shop(id) {
    const sh = PX.SHOPS[id], S = St.S;
    sheet(sh.name, (b) => {
      const info = el('p', { class: 'muted' });
      const upd = () => { info.textContent = `소지금 ₢${S.money}`; };
      upd(); b.append(info);
      for (const iid of sh.items) {
        const it = PX.ITEMS[iid];
        const row = el('div', { class: 'item' }, el('span', { class: 'ic' }, it.icon), el('div', null, el('b', null, it.name), el('small', null, it.desc)));
        const buy = el('button', null, `₢${it.price}`);
        buy.onclick = () => { if (!St.spend(it.price)) { toast('돈이 모자라요'); return; } St.addItem(iid); toast(`${it.icon} ${it.name} 구매`); upd(); PX.Audio && PX.Audio.coin(); };
        row.append(buy); b.append(row);
      }
    });
  }
  // 선물 고르기
  function pickGift() {
    return new Promise(res => {
      const S = St.S; let done = false;
      sheet('선물하기', (b, close) => {
        const ids = Object.keys(S.inv).filter(k => S.inv[k] > 0 && ['gift', 'food'].includes(PX.ITEMS[k].cat) && !PX.ITEMS[k].noGift);
        if (!ids.length) b.append(el('p', { class: 'muted' }, '줄 만한 물건이 없어요. PX에서 사 오세요.'));
        for (const id of ids) { const it = PX.ITEMS[id]; const btn = el('button', { class: 'menu-btn' }, el('span', null, `${it.icon} ${it.name} ×${S.inv[id]}`), el('small', null, it.desc)); btn.onclick = () => { done = true; close(); res(id); }; b.append(btn); }
      }, { onClose: () => { if (!done) res(null); } });
    });
  }

  return { ask, toast, sheet, menu, hud, badge, title, create, terminal, shop, pickGift, PANES };
})();
