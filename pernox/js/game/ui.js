// UI: 타이틀 · 캐릭터 생성 · HUD · 개인 단말 · 상점 · 토스트 · 시트
'use strict';
PX.UI = (() => {
  const U = PX.U, Cal = PX.Cal, St = PX.St, el = U.el;
  const $ = id => document.getElementById(id);

  // ---------- 토스트 ----------
  function toast(text, ms = 2600) {
    text = U.fixNames(text);
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
    const M = PX.Mind, op = S.cap.op && S.cap.op.phase === 'away' && !S.cap.op.joint;
    const comp = PX.Cap.mode === 'follow' && near ? `<span class="ct">${M.ICON[M.contact()]} ${M.contact() === 'NONE' ? '동행 중' : M.NAME[M.contact()]}</span>` : '';
    const html = `<b>${S.capName}</b>${comp ? '' : ' · ' + (op ? '🛰️ ' : '') + PX.Cap.status()}${comp} <span class="heart">♥ ${St.stageName(r.stage)}</span>`;
    if ($('capChip')._h !== html) { $('capChip')._h = html; $('capChip').innerHTML = html; }
  }
  function badge() { const n = St.S.messages.filter(m => !m.out && (!m.seen || m.reply == null)).length; $('termBadge').textContent = n || ''; $('termBadge').style.display = n ? '' : 'none'; }

  // ---------- 타이틀 ----------
  function title() {
    const T = $('title'); T.classList.remove('hidden');
    const box = $('titleBtns'); box.innerHTML = '';
    const last = St.lastSlot();
    const lp = last && St.peek(last);
    if (lp && !lp.broken) box.append(el('button', { class: 'big', onclick: () => PX.Game.loadSlot(last) }, '이어하기', el('small', null, `${lp.name} · ${lp.date}`)));
    box.append(el('button', { class: 'big', onclick: () => pickSlot('new') }, '새로 시작'));
    box.append(el('button', { class: 'big ghost', onclick: () => pickSlot('load') }, '불러오기'));
    drawTitleArt(lp && !lp.broken && lp.player ? PX.S.playerApp(lp.player, 'winter') : null);
    // 메뉴 접기 · 펴기 (표지 그림을 다 보고 싶을 때)
    const card = $('tcard'), fold = $('tfold');
    const set = (f) => { card.classList.toggle('folded', f); fold.textContent = f ? '▴ 메뉴 펼치기' : '접기 ▾'; fold.setAttribute('aria-label', f ? '메뉴 펼치기' : '메뉴 접기'); };
    set(false); fold.onclick = () => set(!card.classList.contains('folded'));
  }
  function pickSlot(kind) {
    sheet(kind === 'new' ? '새 게임 — 저장 칸 고르기' : '불러오기', (b, close) => {
      for (const n of [1, 2, 3, 4, 5]) {
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
  // ---------- 표지: 은빛 사막 언덕 위, 붉은 고리 행성을 올려다보는 두 사람 (움직이는 별·유성·발광초) ----------
  let titleRaf = 0;
  function drawTitleArt(look) {
    const c = $('titleArt'), g = c.getContext('2d');
    const W = 240, H = 480; c.width = W; c.height = H; g.imageSmoothingEnabled = false;
    const r = U.rng('cover');
    const base = PX.G.canvas(W, H), b = base.getContext('2d'); b.imageSmoothingEnabled = false;
    const px = (x, y, w, h, col) => { b.fillStyle = col; b.fillRect(x | 0, y | 0, w | 0, h | 0); };
    // 하늘: 남색 → 보라 → 장밋빛 지평선 (띠로 끊어 도트 느낌)
    const sky = ['#0b0820', '#110b2c', '#180e38', '#211245', '#2c1650', '#3a1a58', '#4b1f5c', '#5f255e', '#77305e', '#913c5c', '#ab4c58', '#c46154', '#d87a52'];
    const hz = 262;
    for (let i = 0; i < sky.length; i++) px(0, Math.floor(i * hz / sky.length), W, Math.ceil(hz / sky.length) + 1, sky[i]);
    // 성운 (디더링 점)
    for (let i = 0; i < 1600; i++) { const x = r() * W, y = r() * 210, n = Math.sin(x / 31 + y / 47) + Math.cos(x / 19 - y / 29); if (n > 0.9 && r() < 0.55) px(x, y, 1, 1, n > 1.4 ? '#c77dd8' : '#7a4aa8'); }
    for (let i = 0; i < 500; i++) { const x = r() * W, y = 110 + r() * 130, n = Math.sin(x / 23 - y / 41) * Math.cos(y / 17); if (n > 0.55 && r() < 0.5) px(x, y, 1, 1, '#ff9fc0'); }
    // 고정 별
    for (let i = 0; i < 120; i++) { const y = r() * 225; px(r() * W, y, 1, 1, r() < 0.15 ? '#ffd9f0' : r() < 0.2 ? '#bfe3ff' : '#fff'); }
    // 붉은 고리 행성 (뒤 고리 → 행성 → 앞 고리)
    const cx = 150, cy = 108, R = 44;
    const ring = (front) => { for (let a = 0; a < Math.PI * 2; a += 0.004) { const rx = Math.cos(a) * 82, ry = Math.sin(a) * 15; const isFront = ry > 0; if (isFront !== front) continue; const x = cx + rx * 0.97 - ry * 0.5, y = cy + ry + rx * 0.18; if (!front && Math.hypot(x - cx, y - cy) < R) continue; px(x, y, 1, 1, Math.abs(Math.cos(a * 3)) > 0.2 ? '#f3c79a' : '#d79a7a'); px(x, y + 2, 1, 1, '#9a5a6a'); } };
    ring(false);
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d > R) continue; const lit = (x * -0.62 + y * -0.55) / R, band = Math.sin((y + x * 0.35) / 4.2); let col = lit > 0.35 ? '#f08a64' : lit > 0.05 ? '#d86a4c' : lit > -0.3 ? '#b14e3c' : '#7c3030'; if (band > 0.75 && lit > -0.3) col = lit > 0.2 ? '#f6a47a' : '#c45c44'; if (d > R - 2) col = lit > 0 ? '#ffb48c' : '#a04a44'; if (((x + y) & 1) && lit < -0.55) col = '#5e2430'; px(cx + x, cy + y, 1, 1, col); }
    ring(true);
    // 작은 달
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (Math.hypot(x, y) <= 6) px(46 + x, 70 + y, 1, 1, x + y < -3 ? '#e8e0ff' : '#a99ad0');
    // 먼 산맥 · 은사막 사구
    for (let x = 0; x < W; x++) { const h = 18 + Math.sin(x / 17) * 6 + Math.sin(x / 7.3) * 2; px(x, hz - h, 1, h + 2, '#5a2d55'); }
    for (let x = 0; x < W; x++) { const h = 8 + Math.sin(x / 29 + 1) * 5; px(x, hz - h + 6, 1, 40, '#7d4a72'); }
    for (let y = hz + 4; y < hz + 60; y++) { const t = (y - hz) / 60; px(0, y, W, 1, t < 0.3 ? '#9a6f9a' : t < 0.6 ? '#86608c' : '#6e4e7c'); }
    for (let i = 0; i < 260; i++) px(r() * W, hz + 6 + r() * 50, 1, 1, r() < 0.5 ? '#d9c8f0' : '#b9a3d8'); // 은빛 모래 반짝임
    // 돔시티 (왼쪽 멀리): 유리 돔 + 탑 + 창문 불빛 + 루비웨이 네온
    const dx0 = 18, dy0 = hz + 2;
    for (let x = 0; x < 64; x++) { const t = (x - 32) / 32, h = Math.sqrt(Math.max(0, 1 - t * t)) * 30; px(dx0 + x, dy0 - h, 1, h, 'rgba(150,210,255,0.16)'); px(dx0 + x, dy0 - h, 1, 1, 'rgba(200,235,255,0.55)'); }
    const towers = [[24, 18], [31, 26], [38, 14], [45, 22], [52, 16], [58, 11], [28, 9], [49, 9]];
    for (const [x, h] of towers) { px(dx0 + x - 2, dy0 - h, 5, h, '#2c1c3e'); for (let k = 0; k < h - 3; k += 3) if (r() < 0.6) px(dx0 + x - 1 + (r() * 3 | 0), dy0 - h + 2 + k, 1, 1, r() < 0.3 ? '#ff7ac8' : '#ffe2a0'); }
    px(dx0 + 31, dy0 - 32, 1, 6, '#ff7ac8');
    // 606부대 통신탑 (오른쪽 멀리)
    px(214, hz - 40, 2, 36, '#2a1830'); px(209, hz - 30, 12, 1, '#2a1830'); px(211, hz - 20, 8, 1, '#2a1830');
    // 앞 언덕 (두 사람이 서 있는 곳)
    for (let x = 0; x < W; x++) { const top = 322 - Math.round(Math.cos((x - 120) / 70) * 26) + Math.round(Math.sin(x / 9) * 1.5); px(x, top, 1, H - top, '#2a1638'); px(x, top, 1, 2, '#4a2a5a'); }
    for (let y = 360; y < H; y++) for (let x = 0; x < W; x++) if (((x * 7 + y * 13) % 11) === 0) px(x, y, 1, 1, '#21122e');
    // 발광초 (언덕 위 청록빛 풀)
    const glows = [];
    for (let i = 0; i < 46; i++) { const x = 8 + r() * (W - 16), top = 322 - Math.round(Math.cos((x - 120) / 70) * 26), y = top + 2 + r() * 40; const h = 2 + (r() * 4 | 0); px(x, y - h, 1, h, '#2f8f86'); glows.push([x | 0, (y - h) | 0, r() * 6.28]); }
    // 두 사람 (뒷모습 · 손잡고 행성을 올려다본다)
    const capLook = PX.NPC_BY_ID.cap.look;
    const me = look || { skin: PX.S.SKINS[0], hair: 'pony', hairColor: '#2a2433', eye: '#6b3d22', top: '#e6e2ea', bottom: '#8a8794', sleeve: 'long', hood: 1 };
    const f1 = PX.S.get(capLook, 'hold', 0, 'B', 'normal'), f2 = PX.S.get(me, 'holdL', 0, 'B', 'normal');
    const feet = 300, sx = 104;
    // 발밑 빛
    for (let y = -6; y <= 6; y++) for (let x = -30; x <= 30; x++) { const d = (x * x) / 900 + (y * y) / 36; if (d < 1 && ((x + y) & 1)) px(sx + 14 + x, feet + y, 1, 1, 'rgba(255,170,210,0.18)'); }
    b.drawImage(f1.c, sx - (f1.c.width >> 1) + 2, feet - f1.c.height); b.drawImage(f2.c, sx + 22 - (f2.c.width >> 1), feet - f2.c.height);
    // 매 프레임: 반짝이는 별 · 유성 · 숨 쉬는 발광초 · 떠오르는 빛가루
    const tw = Array.from({ length: 34 }, () => [r() * W | 0, r() * 230 | 0, r() * 6.28, 0.8 + r() * 1.8]);
    const motes = Array.from({ length: 18 }, () => [r() * W, 270 + r() * 200, 0.1 + r() * 0.25, r() * 6.28]);
    let shoot = null, nextShoot = 1.2, last = performance.now(), t = 0;
    cancelAnimationFrame(titleRaf);
    const frame = (now) => {
      if ($('title').classList.contains('hidden')) { titleRaf = 0; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      g.drawImage(base, 0, 0);
      for (const [x, y, ph, sp] of tw) { const a = 0.5 + 0.5 * Math.sin(t * sp + ph); g.globalAlpha = a; g.fillStyle = '#fff'; g.fillRect(x, y, 1, 1); if (a > 0.92) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
      g.globalAlpha = 1;
      nextShoot -= dt;
      if (!shoot && nextShoot <= 0) { shoot = { x: 30 + Math.random() * 150, y: 10 + Math.random() * 60, life: 0 }; nextShoot = 2.5 + Math.random() * 4; }
      if (shoot) { shoot.life += dt; const k = shoot.life * 120; for (let i = 0; i < 14; i++) { g.globalAlpha = Math.max(0, (1 - i / 14) * (1 - shoot.life / 0.9)); g.fillStyle = i < 2 ? '#fff' : '#ffd9f0'; g.fillRect((shoot.x + k - i * 2) | 0, (shoot.y + k * 0.45 - i) | 0, 1, 1); } g.globalAlpha = 1; if (shoot.life > 0.9) shoot = null; }
      for (const [x, y, ph] of glows) { g.globalAlpha = 0.45 + 0.45 * Math.sin(t * 1.6 + ph); g.fillStyle = '#7fffe8'; g.fillRect(x, y, 1, 1); g.globalAlpha *= 0.35; g.fillRect(x - 1, y - 1, 3, 3); }
      g.globalAlpha = 1;
      for (const m of motes) { m[1] -= m[2] * dt * 30; m[0] += Math.sin(t + m[3]) * 0.08; if (m[1] < 240) { m[1] = 470; m[0] = Math.random() * W; } g.globalAlpha = 0.35 + 0.3 * Math.sin(t * 2 + m[3]); g.fillStyle = '#ffc6e6'; g.fillRect(m[0] | 0, m[1] | 0, 1, 1); }
      g.globalAlpha = 1;
      titleRaf = requestAnimationFrame(frame);
    };
    titleRaf = requestAnimationFrame(frame);
  }


  // 생일 고르기 (월 · 일) · onChange({m,d})
  function bdayPick(v, onChange) {
    const mI = el('input', { type: 'number', min: '1', max: '12', value: v ? String(v.m) : '', placeholder: '월', class: 'num' });
    const dI = el('input', { type: 'number', min: '1', max: '31', value: v ? String(v.d) : '', placeholder: '일', class: 'num' });
    const ch = () => { const m = +mI.value, d = +dI.value; onChange(m >= 1 && m <= 12 && d >= 1 && d <= Cal.daysInMonth(2028, m) ? { m, d } : null); };
    mI.oninput = ch; dI.oninput = ch;
    return el('div', { class: 'date' }, mI, '월', dI, '일');
  }
  // ---------- 캐릭터 생성 ----------
  function create(slot) {
    $('title').classList.add('hidden');
    const C = $('create'); C.classList.remove('hidden');
    const f = { name: '', gender: '여성', skin: 0, hair: 'pony', hairColor: '흑발', eye: '갈색', outfit: 'hoodie', job: 'medic', capName: '서무진', mode: 'normal', start: { y: 2027, m: 1, d: 1 }, bday: null, capBday: { m: 8, d: 14 } };
    const body = $('createBody'); body.innerHTML = '';
    const row = (label, ...kids) => el('div', { class: 'row' }, el('label', null, label), el('div', { class: 'ctl' }, ...kids));
    const swatches = (list, key, colorOf) => { const w = el('div', { class: 'sw' }); list.forEach((v, i) => { const b = el('button', { class: 'swb', style: `background:${colorOf(v, i)}`, title: typeof v === 'string' ? v : '' }); b.onclick = () => { f[key] = typeof v === 'string' ? v : i; [...w.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); preview(); }; if ((typeof v === 'string' ? v : i) === f[key]) b.classList.add('on'); w.append(b); }); return w; };
    const chips = (list, key) => { const w = el('div', { class: 'chips' }); for (const [v, t] of list) { const b = el('button', { class: 'chip' + (f[key] === v ? ' on' : '') }, t); b.onclick = () => { f[key] = v; [...w.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); preview(); }; w.append(b); } return w; };
    const nameIn = el('input', { type: 'text', maxlength: '8', placeholder: '이름', autocomplete: 'off' });
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
      row('내 생일', bdayPick(null, v => { f.bday = v; })),
      row('대위 이름', capIn),
      row('대위 생일', bdayPick(f.capBday, v => { f.capBday = v || { m: 8, d: 14 }; })),
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
  const TABS = [['map', '🗺️ 지도'], ['cal', '📅 일정표'], ['duty', '🗓️ 근무표'], ['rel', '💞 관계도'], ['msg', '📱 메시지'], ['inv', '🎒 소지품'], ['quest', '📋 대위 부탁'], ['album', '📷 사진첩'], ['lore', '📚 로어북'], ['set', '⚙️ 설정·저장']];
  let termTab = 'cal';
  function terminal(tab) {
    if (tab) termTab = tab;
    sheet('개인 단말', (b, close) => {
      const tabs = el('div', { class: 'tabs' }), pane = el('div', { class: 'pane' });
      const show = (k) => {
        if (!PANES[k]) k = 'cal';
        termTab = k; [...tabs.children].forEach(c => c.classList.toggle('on', c.dataset.k === k)); pane.innerHTML = '';
        try { PANES[k](pane, close); } catch (e) { console.warn('단말 탭 오류', k, e); termTab = 'cal'; pane.innerHTML = ''; pane.append(el('p', { class: 'muted' }, '이 화면을 여는 중에 문제가 생겼어요. 다른 탭을 눌러 주세요.')); }
      };
      for (const [k, t] of TABS) { const btn = el('button', { 'data-k': k }, t); if (k === 'msg') btn.append(el('i', { class: 'dot', id: 'msgDot' })); btn.onclick = () => show(k); tabs.append(btn); }
      b.append(tabs, pane); show(termTab);
    }, { wide: true });
  }
  let calView = null;
  // 달력에 같이 보여 줄 것: 대위 일정 · 약속 · 휴가 · 부탁 · 장소 특별 운영 (로어북)
  function calItems(date) {
    const S = St.S, n = Cal.dayNumber(date.y, date.m, date.d), wd = Cal.weekday(date.y, date.m, date.d), out = [];
    const add = (mk, title, sub, cls) => out.push({ mk, title, sub: sub || '', cls: cls || '' });
    if (PX.Bday && PX.Bday.isMine(date)) add('🎂', '내 생일', '', 'me');
    if (PX.Bday && PX.Bday.isCap(date)) add('🎂', `${S.capName}의 생일`, '', 'cap');
    const o = S.cap.op;
    let opDay = false;
    if (o && o.phase !== 'done' && n >= o.startDay && n <= o.startDay + o.days) {
      opDay = true; const k = n - o.startDay + 1;
      add('🛰️', o.joint ? '장기작전 (함께 출동)' : `${S.capName} 장기작전`, n === o.startDay ? `06:00 출발 · ${o.days}일 일정` : n === o.startDay + o.days ? '복귀하는 날 · 오후 도착 예정' : `${k}일째 · ${o.comms && o.comms[k] === false ? '통신 불안정 예보' : '통신 가능'}`, 'cap');
    }
    for (const d of (S.dates || [])) if (d.day === n && d.state !== 'missed') add('💕', `데이트 약속 · ${d.name || ''}`, `${Cal.fmtTime(d.min)}${d.state === 'done' ? ' · 다녀옴' : ''}`, 'me');
    if (S.leave && n >= S.leave.from && n <= S.leave.to) add('🏖️', '내 휴가', '', 'me');
    if (S.capLeave && n >= S.capLeave.from && n <= S.capLeave.to) add('🏖️', `${S.capName} 휴가`, '', 'cap');
    const fv = PX.CapFavor && PX.CapFavor.pending();
    if (fv && Math.floor(fv.until / 1440) === n) add('📋', '대위 부탁 마감', '', 'cap');
    if (!opDay && !(S.capLeave && n >= S.capLeave.from && n <= S.capLeave.to)) {
      if (wd >= 1 && wd <= 5) add('', `${S.capName} 일과`, '08:00 브리핑 · 13:00~17:00 외곽 수색 · 17:00 복귀 검진 · 19:00부터 자유', 'routine');
      else add('', `${S.capName} 비번`, '주말 · 오전엔 막사에서 광물 깎기, 오후부터 자유', 'routine');
    }
    // 장소 특별 운영 (매주 · 정해진 날 · 계절): 로어북
    for (const e of PX.LORE) {
      if (!e.repeatRule || ['festival', 'base', 'special', 'adult', 'world'].includes(e.eventType)) continue;
      const t = e.repeatRule.type; if (t === 'always' || (t === 'daily' && !e.repeatRule.months)) continue;
      if (Cal.ruleMatches && !Cal.ruleMatches(e.repeatRule, date)) continue;
      if (t === 'daily') { if (date.d !== 1 && !(e.repeatRule.months[0] === date.m && date.d === 1)) continue; add('🌸', `이번 달 제철 · ${e.originalTitle}`, `${e.location}${e.description ? ' · ' + e.description.slice(0, 40) : ''}`, 'place'); continue; } // 계절 명소는 그달 1일에 한 번만
      add('✨', e.originalTitle, `${e.location}${e.startTime ? ' · ' + e.startTime + '~' + e.endTime : ''}${e.description ? ' · ' + e.description.slice(0, 40) : ''}`, 'place');
    }
    return out;
  }
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
        const its = calItems(date);
        for (const x of its.filter(x => x.cls !== 'place' && x.cls !== 'routine')) detail.append(el('div', { class: 'ev ' + x.cls }, el('b', null, `${x.mk} ${x.title}`), x.sub ? el('small', null, x.sub) : ''));
        if (!ev.length) detail.append(el('p', { class: 'muted' }, '부대·돔시티 행사는 없어요.'));
        for (const e of ev) detail.append(el('div', { class: 'ev' }, el('b', null, e.originalTitle), el('small', null, `${e.location}${e.startTime ? ' · ' + e.startTime + '~' + e.endTime : ''}`), el('p', null, e.description), e.captainReaction ? el('p', { class: 'cap' }, '대위: ' + e.captainReaction) : null));
        for (const x of its.filter(x => x.cls === 'place')) detail.append(el('div', { class: 'ev place' }, el('b', null, `${x.mk} ${x.title}`), el('small', null, x.sub)));
        for (const x of its.filter(x => x.cls === 'routine')) detail.append(el('p', { class: 'muted' }, `🪖 ${x.title}: ${x.sub}`));
      };
      for (let d = 1; d <= Cal.daysInMonth(calView.y, calView.m); d++) {
        const date = { y: calView.y, m: calView.m, d };
        const ev = Cal.eventsOn(date);
        const today = date.y === S.time.y && date.m === S.time.m && d === S.time.d;
        const wd = Cal.weekday(date.y, date.m, d);
        const cell = el('button', { class: 'cd' + (today ? ' today' : '') + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '') }, String(d));
        if (ev.length) cell.append(el('i', { class: 'evdot' + (ev.some(e => e.eventType === 'base') ? ' base' : '') }));
        { const its = calItems(date), mks = [...new Set(its.filter(x => x.mk && x.cls !== 'place').map(x => x.mk))].slice(0, 2).join(''); if (mks) cell.append(el('span', { class: 'bdmark' }, mks)); if (its.some(x => x.cls === 'place')) cell.append(el('i', { class: 'evdot place' })); }
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
      const R = PX.Rom, dts = (S.dates || []).filter(d => d.state === 'planned' || d.state === 'on');
      p.append(el('h4', null, '📅 약속'), ...(dts.length ? dts.map(d => el('p', null, `${R.dayKo(d.day)} ${Cal.fmtTime(d.min)} · ${d.name}${d.kind === 'proposal' ? ' (대위가 꼭 오래요)' : ''}`)) : [el('p', { class: 'muted' }, '잡힌 약속이 없어요. 대위에게 데이트 약속을 잡아 보세요.')]));
      if (S.wedding && S.wedding.state === 'planned') p.append(el('p', null, `💒 결혼식 ${R.dayKo(S.wedding.day)} 11:00 · 606부대 연병장`));
      const o = S.cap.op; if (o && o.phase === 'planned' && (o.told || o.joint)) p.append(el('p', null, o.joint ? `🛰️ 작전 명령: ${R.dayKo(o.startDay)} 06:00부터 ${o.days}일 · ${o.role}` : `🛰️ 대위 장기작전: ${R.dayKo(o.startDay)}부터 ${o.days}일`));
      const lv = el('button', { class: 'menu-btn' }, el('span', null, '🏖️ 휴가 신청'), el('small', null, S.leave && S.leave.to >= S.day ? `${R.dayKo(S.leave.from)}~${R.dayKo(S.leave.to)} 휴가` : '하루~사흘 · 30일에 6일까지'));
      lv.onclick = () => { R.applyLeave(); };
      p.append(el('h4', null, '휴가'), lv);
      p.append(el('p', { class: 'muted' }, `${S.capName} 대위 지금: ${PX.Cap.status()}`));
    },
    rel(p) {
      // 다음 단계로 가는 실제 조건 (호감만으로 안 오르는 단계는 날짜 · 이벤트까지)
      const nextStep = () => {
        const S = St.S, r = S.rel.cap, T = St.THRESH, need = (n) => Math.max(0, n - r.aff);
        const days = r.loverSince != null ? S.day - r.loverSince : 0, ok = (b) => b ? '✅' : '⬜';
        if (r.stage < 3) return need(T[r.stage + 1]) ? `▶ ${St.STAGES[r.stage + 1]}까지 호감 ${need(T[r.stage + 1])}` : `▶ 곧 ${St.STAGES[r.stage + 1]}`;
        if (r.stage === 3) return need(T[4]) ? `▶ 연인: 호감 ${T[4]} 이상이 되면 대위가 고백해요 (호감 ${need(T[4])} 더)` : '💌 연인: 조건 충족 · 대위와 함께 있으면 대위가 고백해요';
        if (r.stage === 4) return `▶ 깊어진 사랑: ${ok(r.aff >= T[5])} 호감 ${T[5]} 이상 · ${ok(days >= 14)} 연인 14일 (${days >= 14 ? '충족' : `${14 - days}일 남음`})`;
        if (r.stage === 5) return `▶ 약혼: ${ok(r.aff >= T[6])} 호감 ${T[6]} 이상 · ${ok(days >= 30)} 연인 30일 (${days >= 30 ? '충족' : `${30 - days}일 남음`}) → 대위가 특별한 저녁 약속을 잡아요. 반지를 선물해 먼저 청혼해도 돼요.`;
        if (r.stage === 6) { const e = S.day - (S.engagedDay || S.day); return `▶ 부부: ${ok(e >= 10)} 약혼 10일 (${e >= 10 ? '충족' : `${10 - e}일 남음`}) → 대위 메뉴 '결혼식 날짜 잡기' · 다음 토요일 11시 연병장`; }
        return '💒 부부예요.';
      };
      const S = St.S, r = S.rel.cap, d = S.done, M = PX.Mind;
      const pct = r.stage >= 7 ? 100 : Math.round(Math.min(1, (r.aff - St.THRESH[r.stage]) / Math.max(1, St.THRESH[r.stage + 1] - St.THRESH[r.stage])) * 100);
      const HINT = ['자주 말 걸고, 같이 밥 먹고, 부탁을 들어주면 가까워져요.', '동행하고 손을 잡아 보세요. 대위가 먼저 다가오기 시작해요.', '데이트 신청을 받아 주거나 먼저 해 보세요. 설렘이 쌓여요.', '조금만 더 가까워지면 대위가 무언가 말하려 할지도…', '연인이에요. 약속을 지키고, 깊은 부탁을 들어주며 더 깊어져요.', '서로가 일상이 됐어요. 대위가 미래 이야기를 꺼내기 시작해요.', '약혼했어요. 함께할 날들을 준비해요.', '부부예요. 이 행성이 멸망할 때까지.'];
      p.append(el('div', { class: 'relcard' },
        el('b', null, `${S.capName} 대위`), el('small', null, '606부대 수색팀 팀장 · 35세 · 193cm'),
        el('div', { class: 'stages' }, ...St.STAGES.map((s, i) => el('span', { class: i === r.stage ? 'on' : i < r.stage ? 'past' : '' }, s))),
        el('div', { class: 'bar' }, el('i', { style: `width:${pct}%` })),
        el('small', null, `호감도 ${r.aff} / 1000`),
        el('small', { class: 'nextstep' }, nextStep()),
        el('small', null, HINT[r.stage] || '')));
      // 지금
      const now = [PX.Cap.status()];
      if (M && PX.Cap.mode === 'follow') now.push(`${M.ICON[M.contact()]} ${M.contact() === 'NONE' ? '나란히 걷는 중' : M.NAME[M.contact()]}`);
      if (PX.Plan && PX.Plan.label()) now.push(`📌 약속: ${PX.Plan.label()}`);
      if (PX.CapFavor && PX.CapFavor.pending()) now.push('📋 부탁받은 일이 있어요');
      if (S.player.callCap) now.push(`내가 부르는 말: ${S.player.callCap}`);
      p.append(el('h4', null, '지금'), el('p', null, now.join(' · ')));
      // 함께한 기록
      const cnt = (pre) => Object.keys(d).filter(k => k.startsWith(pre)).length;
      const rec = [
        ['처음 만난 지', `${S.day - r.metDay}일`], r.loverSince != null ? ['연인이 된 지', `${S.day - r.loverSince + 1}일째`] : null,
        ['추억', `${S.album.length}개`], ['해 본 스킨십', `${cnt('skin_') + cnt('cdom_')}가지`],
        ['지킨 약속', `${cnt('planm_')}번`], ['들어준 부탁', `${S.stats.favors || 0}번`],
        ['같이 한 장소 활동', `${cnt('pam_')}가지`], ['받은 메시지', `${S.messages.length}통`],
      ].filter(Boolean);
      p.append(el('h4', null, '함께한 기록'), el('div', { class: 'npclist' }, ...rec.map(([k, v]) => el('div', { class: 'li' }, el('small', null, k), el('b', null, v)))));
      // 대위에 대해 알게 된 것 (가까워질수록 열린다)
      const bd = S.capBday ? `${S.capBday.m}월 ${S.capBday.d}일` : '?';
      const FACTS = [ // 로어북 · 대위 설정에서
        [0, '생일', bd], [0, '좋아하는 음식', '냉삼, 김치찌개, 차가운 건 전부'], [0, '입맛', '뭐든 잘 먹는다. 매운 건 특히'], [0, '싫어하는 것', '더위. 그리고 주삿바늘 (비밀)'],
        [1, '취미', '외계 광물 깎기. 막사 작업대에서'], [1, '버릇', '문틀에 머리를 박는다. 하루에 한 번은'], [1, '김치찌개 나오는 날', '식당에 제일 먼저 와 있다'],
        [2, '무서워하는 것', '거미. 다리 많은 건 다 싫대'], [2, '보급선 장터에선', '내가 고른 걸 먼저 계산해 버린다'], [2, '돔시티 소문', '확인된 정보와 헛소문을 딱 잘라 구분해 준다'],
        [3, '처음 좋아하게 된 곳', '은사막 전망대. 9~11월 새벽과 저녁'], [3, '첫눈에 반한 날', '처음 본 날부터. 본인 피셜'],
        [4, '인공노을 회랑에서', '노을빛에 물든 내 얼굴을 보고 말을 잃는다'], [4, '부대 특식일엔', '자기 몫 고기를 내 식판에 옮긴다'],
        [5, '서랍 속', d.favm_cm_secret ? '처음 만난 날부터 쓴, 보내지 못한 메시지들' : '침대 밑에 상자가 하나 있다'],
      ];
      p.append(el('h4', null, '대위에 대해 알게 된 것'), el('div', { class: 'npclist' }, ...FACTS.map(([s, k, v]) => el('div', { class: 'li fact' }, el('small', null, k), el('b', null, r.stage >= s ? v : '🔒 더 가까워지면')))));
      const mem = S.album.slice(-3).reverse();
      if (mem.length) p.append(el('h4', null, '최근 추억'), ...mem.map(m => el('p', { class: 'muted' }, `· ${m.title || m.t || ''}${m.text ? ' — ' + m.text : ''}`)));
    },
    msg(p) {
      // 메신저처럼: 오래된 메시지가 위, 새 메시지가 아래 · 입력은 맨 아래 · 대위가 보낸 메시지에 답하면 새 말풍선으로 이어진다
      const S = St.S, rerender = () => { p.innerHTML = ''; PANES.msg(p); };
      for (const m of S.messages) { if (!m.out) m.seen = 1; if (!m.out && m.reply == null && !(m.r && m.r.length)) m.reply = 'none'; }
      const capWithMe = PX.Op.together && PX.Op.together();
      const book = S.done.innBook && St.absMin() < S.done.innBook.until ? S.done.innBook : null;
      if (book) p.append(el('div', { class: 'chatpin' }, `🗝️ 은밀숙소 예약됨 · ${PX.MAPS[book.room].name} · ${book.day === S.day ? '오늘 밤' : '내일 밤'}`));
      const list = S.messages.map((m, i) => ({ m, i, k: m.day * 1440 + m.min })).sort((x, y) => x.k - y.k || y.i - x.i).map(x => x.m);
      const thread = el('div', { class: 'chat' });
      const ST = { sent: '전송됨', read: '읽음', answered: '읽음' };
      const row = (who, text, m, st, img) => el('div', { class: 'crow ' + who }, el('div', { class: 'cbody' }, el('div', { class: 'bub ' + who }, text), ...(img ? [el('img', { class: 'msgph', src: img, alt: '사진' })] : [])), el('small', { class: 'ctime' }, (st ? st + '\n' : '') + Cal.fmtTime(m.min)));
      let lastDay = null;
      for (const m of list) {
        if (m.day !== lastDay) { thread.append(el('div', { class: 'chatday' }, Cal.fmtDate(Cal.addDays({ y: 1, m: 1, d: 1 }, m.day)))); lastDay = m.day; }
        if (m.out) { thread.append(row('me', m.mine, m, ST[m.st] || '')); continue; }
        thread.append(row('cap', m.t, m, '', m.photo));
        if (!m.split) { // 예전 저장: 답장이 메시지에 붙어 있던 것도 이어지는 말풍선으로
          if (m.reply === 'free') thread.append(row('me', m.mine, m, '읽음'), row('cap', m.ans, m));
          else if (typeof m.reply === 'number') { const rr = (m.r || [])[m.reply]; if (rr) thread.append(row('me', PX.Dlg.capTone(rr[0]), m, '읽음'), row('cap', rr[2], m)); }
        }
      }
      if (!list.length) thread.append(el('p', { class: 'muted chatempty' }, `아직 ${S.capName}와(과) 주고받은 메시지가 없어요.`));
      p.append(thread);
      // ---------- 입력 (맨 아래 고정) ----------
      const comp = el('div', { class: 'chatcomp' });
      const push = (o) => { S.messages.unshift(Object.assign({ id: St.absMin() + Math.random(), day: S.day, min: S.time.min, seen: 1, split: 1 }, o)); S.messages = S.messages.slice(0, 80); };
      const pend = list.filter(m => !m.out && m.reply == null && m.r && m.r.length).pop(); // 아직 답 안 한 대위 메시지 (가장 최근)
      const reply = (i) => { const rr = pend.r[i]; pend.reply = i; pend.split = 1; St.addAff(rr[1]); push({ out: true, mine: PX.Dlg.capTone(rr[0]), st: 'answered' }); push({ t: rr[2], r: [], reply: 'none' }); badge(); rerender(); };
      if (capWithMe) comp.append(el('div', { class: 'chatnote' }, `💬 ${U.josa(S.capName, '이')} 옆에 있어요. 메시지 말고 직접 말해 보세요.`));
      else {
        const canText = PX.Op.canText && PX.Op.canText(), away = PX.Op.canMsg(), o = PX.Op.op();
        const k = PX.Cap.spotKind(), d = away ? Math.floor((St.absMin() - o.start) / 1440) + 1 : 0, off = away && o.comms[d] === false;
        comp.append(el('small', { class: 'chatnote' }, pend ? '↩️ 답장 고르기' : away ? (off ? '📡 오늘은 외곽 통신이 불안정해요. 통신이 잡히면 읽어요.' : '📡 작전 중이라 답장이 언제 올지 몰라요.') : k === 'sleep' ? '🌙 대위가 자는 시간이에요. 아침에 볼 거예요.' : k === 'duty' || k === 'field' ? '🪖 근무 중이라 답장이 조금 늦을 수 있어요.' : '☕ 쉬는 시간이라 금방 볼 거예요.'));
        const ch = el('div', { class: 'msgch' });
        if (pend) pend.r.forEach((rr, i) => { const b = el('button', null, PX.Dlg.capTone(rr[0])); b.onclick = () => reply(i); ch.append(b); });
        else if (canText) for (const t of PX.Op.quick()) { const b = el('button', null, t); b.onclick = () => { if (PX.Op.sendToCap(t)) rerender(); }; ch.append(b); }
        if (!pend && !book && S.rel.cap.stage >= 4 && !away) { const b = el('button', { class: 'free' }, '🗝️ 은밀숙소 예약하고 같이 가자고 하기'); b.onclick = async () => { await PX.Act.bookByPhone(); rerender(); }; ch.append(b); }
        comp.append(ch);
        if (canText || (pend && PX.AI.available())) {
          const fr = el('div', { class: 'msgfree' }), inp = el('input', { type: 'text', maxlength: '120', placeholder: pend ? '직접 답장 쓰기' : '메시지 보내기' }), sb = el('button', null, '보내기');
          const go = async () => {
            const v = inp.value.trim(); if (!v) return;
            if (pend && PX.AI.available()) { sb.disabled = true; sb.textContent = '…'; try { const ans = await PX.AI.replyMsg(pend, v); pend.reply = 'free'; pend.split = 1; push({ out: true, mine: v, st: 'answered' }); push({ t: ans, r: [], reply: 'none' }); badge(); rerender(); } catch (e) { sb.disabled = false; sb.textContent = '보내기'; toast('📡 답장을 보내지 못했어요. 다시 시도해 주세요.'); } return; }
            if (pend) { pend.reply = 'typed'; pend.split = 1; } // 직접 쓴 말로 답한 것으로
            if (PX.Op.sendToCap(v)) rerender();
          };
          sb.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) go(); };
          fr.append(inp, sb); comp.append(fr);
        }
      }
      if (S.messages.length) { // 대화 비우기 (입력창 맨 위 오른쪽)
        const clr = el('button', { class: 'chatclear' }, '🧹 대화 비우기');
        clr.onclick = async () => { if (!(await ask('대화 비우기', `${S.capName}와(과) 주고받은 메시지를 모두 지울까요?`, '모두 지우기'))) return; S.messages = []; S.outbox = []; if (S.cap.op) S.cap.op.outbox = []; St.save(); badge(); rerender(); };
        comp.prepend(clr);
      }
      p.append(comp);
      badge();
      requestAnimationFrame(() => { const sc = p.closest('.sheet-body') || p; sc.scrollTop = sc.scrollHeight; });
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
    quest(p) { PX.CapFavor.pane(p, el); },

    album(p) {
      const S = St.S;
      if (!S.album.length) p.append(el('p', { class: 'muted' }, '아직 추억이 없어요. 대위와의 첫 순간들이 자동으로 기록돼요. 📷 버튼으로 직접 찍을 수도 있어요.'));
      if ((S.capPhotos || []).length) { p.append(el("h4", null, `📱 ${U.josa(S.capName, "이")} 보낸 사진`)); const g2 = el('div', { class: 'album' }); for (const a of S.capPhotos) g2.append(el('div', { class: 'ph' }, el('img', { src: a.img, alt: a.t }), el('small', null, a.t))); p.append(g2, el('h4', null, '📷 추억')); }
      const grid = el('div', { class: 'album' });
      for (const a of S.album.slice().reverse()) grid.append(el('div', { class: 'ph' }, a.img ? el('img', { src: a.img, alt: a.title }) : el('div', { class: 'noimg' }, '📷'), el('b', null, a.title), el('small', null, a.date), el('p', null, a.text)));
      p.append(grid);
    },
    lore(p) {
      const q = el('input', { type: 'search', placeholder: '검색', class: 'search' });
      const list = el('div');
      const typeKo = { world: '세계관', festival: '축제', tour: '관광', place: '장소', travel: '여행', base: '부대 행사', special: '특수 일상', food: '음식·생활', adult: '루비웨이(성인)' };
      const render = () => {
        list.innerHTML = '';
        const k = q.value.trim();
        for (const e of PX.LORE) {
          const hay = e.id + e.originalTitle + e.description + e.keywords.join() + e.location + (e.months.join('월 ') + '월') + typeKo[e.eventType] + e.captainReaction;
          if (k && !hay.includes(k)) continue;
          list.append(el('details', { class: 'contact' }, el('summary', null, el('b', null, e.originalTitle), el('small', null, ` ${typeKo[e.eventType]} · ${e.location}`)),
            el('p', null, e.description), el('p', { class: 'muted' }, `시기: ${e.months.length === 12 ? '연중' : e.months.join('·') + '월'}${e.peakMonths ? ' (성수기 ' + e.peakMonths.join('·') + '월)' : ''}${e.startTime ? ' · ' + e.startTime + '~' + e.endTime : ''} · 조건: ${e.accessCondition}`),
            e.captainReaction ? el('p', { class: 'cap' }, '대위: ' + e.captainReaction) : null,
            el('p', { class: 'muted' }, e.implemented === 'map' ? '📍 직접 가 볼 수 있어요' : '🗓️ 일정·정보')));
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
      const qa = el('div', { class: 'chips' });
      for (const [k, t] of [['auto', '자동'], ['high', '고화질'], ['low', '절전']]) { const b = el('button', { class: 'chip' + ((S.settings.quality || 'auto') === k ? ' on' : '') }, t); b.onclick = () => { S.settings.quality = k; PX.Game.lowPerf = k === 'low'; [...qa.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); }; qa.append(b); }
      const bdNote = el('small', { class: 'note' }, S.player.bday ? '' : '내 생일을 정하면 그날 대위가 챙겨 줘요.');
      p.append(el('h4', null, '🎂 생일'), el('div', { class: 'row' }, el('label', null, '내 생일'), bdayPick(S.player.bday, v => { if (v) { S.player.bday = v; bdNote.textContent = `${v.m}월 ${v.d}일로 정했어요`; } })), el('div', { class: 'row' }, el('label', null, `${S.capName} 생일`), bdayPick(S.capBday, v => { if (v) { S.capBday = v; bdNote.textContent = `대위 생일: ${v.m}월 ${v.d}일`; } })), bdNote);
      p.append(el('h4', null, '시간 흐름'), sp, el('h4', null, '소리'), snd, el('h4', null, '화질 (폰이 버벅이면 절전)'), qa, el('small', null, PX.Game.lowPerf ? '지금 절전 모드로 돌아가는 중' : ''), el('h4', null, '저장'));
      for (const n of [1, 2, 3, 4, 5]) {
        const pk = St.peek(n);
        const b = el('button', { class: 'menu-btn' }, el('span', null, `저장 칸 ${n}에 저장${S.slot === n ? ' (사용 중)' : ''}`), el('small', null, pk ? `${pk.name} · ${pk.date}` : '비어 있음'));
        b.onclick = async () => { if (pk && S.slot !== n && !(await ask('저장', `저장 칸 ${n}번(${pk.name})을 덮어쓸까요?`, '덮어쓰기'))) return; const ok = St.save(n, false); toast(ok ? `💾 저장 칸 ${n}에 저장했어요` : '저장하지 못했어요 (저장 공간 부족)'); p.innerHTML = ''; PANES.set(p, close); };
        p.append(b);
      }
      p.append(el('p', { class: 'muted' }, `자동 저장: 지금 쓰는 저장 칸 ${S.slot}에 장소 이동·잠·5분마다 자동으로 저장돼요. (저장 버전 v${St.SAVE_VERSION})`));
      p.append(el('button', { class: 'menu-btn ghost', onclick: () => { St.save(S.slot); close(); PX.Game.toTitle(); } }, el('span', null, '저장하고 타이틀로')));
    },
  };

  // ---------- 미리 보기: 가구는 실제 가구 그림, 옷 · 머리는 내 캐릭터가 입은 모습 ----------
  function thumb(src, w, h, scale) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'thumb';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const s = scale || Math.max(1, Math.floor(Math.min((w - 4) / src.width, (h - 4) / src.height)));
    g.drawImage(src, Math.round((w - src.width * s) / 2), Math.round((h - src.height * s) / 2), src.width * s, src.height * s);
    return c;
  }
  function furnThumb(fid) { const spr = PX.O.furniture(fid, 0, St.season()); return thumb(spr.c, 84, 76); }
  function lookThumb(patch, pose) {
    const S = St.S, p = Object.assign({}, S.player, patch);
    const app = PX.S.playerApp(p, St.season());
    const fr = PX.S.frame(app, pose || 'idle', 0, 'F', 'smile');
    return thumb(fr.c, 72, 100);
  }
  function itemThumb(it) {
    if (it.furn) return furnThumb(it.furn);
    if (it.outfit) return lookThumb({ outfit: it.outfit, bath: false });
    return el('span', { class: 'ic' }, it.icon);
  }
  // ---------- 상점 ----------
  function shop(id) {
    const sh = PX.SHOPS[id], S = St.S;
    const big = ['interior', 'boutique'].includes(id) || sh.items.some(i => PX.ITEMS[i].furn || PX.ITEMS[i].outfit);
    sheet(sh.name, (b) => {
      const info = el('p', { class: 'muted' });
      const upd = () => { info.textContent = `소지금 ₢${S.money}` + (id === 'boutique' ? ' · 산 옷은 숙소 옷장에서 갈아입어요' : id === 'interior' ? ' · 산 가구는 숙소 꾸미기에서 놓아요' : ''); };
      upd(); b.append(info);
      const grid = big ? el('div', { class: 'shopgrid' }) : b;
      if (big) b.append(grid);
      for (const iid of sh.items) {
        const it = PX.ITEMS[iid];
        const owned = it.outfit && (S.closet || []).includes(it.outfit);
        const buy = el('button', null, owned ? '보유' : `₢${it.price}`);
        if (owned) buy.disabled = true;
        buy.onclick = () => {
          if (it.outfit && (S.closet || []).includes(it.outfit)) return;
          if (!St.spend(it.price)) { toast('돈이 모자라요'); return; }
          if (it.outfit) { S.closet = (S.closet || []).concat(it.outfit); buy.textContent = '보유'; buy.disabled = true; toast(`👗 ${it.name} 구매 · 옷장에 넣었어요`); }
          else { St.addItem(iid); toast(`${it.furn ? '🪑' : it.icon} ${it.name} 구매`); }
          upd(); PX.Audio && PX.Audio.coin();
        };
        if (big) { const f = it.furn && PX.FURN[it.furn]; grid.append(el('div', { class: 'card' }, itemThumb(it), el('b', null, it.name), el('small', null, it.furn ? `${f.w}×${f.d}` + (S.inv[iid] ? ` · 가진 것 ${S.inv[iid]}` : '') : it.outfit ? '옷' : it.desc), buy)); }
        else b.append(el('div', { class: 'item' }, itemThumb(it), el('div', null, el('b', null, it.name), el('small', null, it.desc)), buy));
      }
    });
  }
  // 그림 카드로 고르기 (옷장 · 미용실): items = [{ t, sub, k, img, on }]
  function pickCards(title, items, note) {
    return new Promise(res => {
      let done = false;
      sheet(title, (b, close) => {
        if (note) b.append(el('p', { class: 'muted' }, note));
        const grid = el('div', { class: 'shopgrid' }); b.append(grid);
        for (const it of items) {
          const card = el('button', { class: 'card pick' + (it.on ? ' on' : '') }, it.img, el('b', null, it.t), it.sub ? el('small', null, it.sub) : null);
          card.onclick = () => { done = true; close(); res(it); };
          grid.append(card);
        }
      }, { onClose: () => { if (!done) res(null); } });
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

  return { ask, toast, sheet, menu, hud, badge, title, create, terminal, shop, pickGift, pickCards, lookThumb, furnThumb, PANES };
})();
