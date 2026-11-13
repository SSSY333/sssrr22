// 직업별 업무 미니게임 4종 (터치 · 마우스 공용). run(type) → Promise<점수 0~1>
'use strict';
PX.Mini = (() => {
  const U = PX.U, el = U.el;
  let root, cv, g, info, timerEl, scoreEl, raf = 0;
  const SZ = 120; // 내부 해상도
  function setup(title, help) {
    root = document.getElementById('mini');
    root.innerHTML = '';
    root.classList.remove('hidden');
    timerEl = el('b', { class: 'mt' }); scoreEl = el('b', { class: 'ms' });
    cv = el('canvas', { class: 'mcv', width: SZ, height: SZ });
    g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    info = el('p', { class: 'mhelp' }, help);
    const tools = el('div', { class: 'mtools' });
    root.append(el('div', { class: 'mhead' }, el('b', null, title), timerEl, scoreEl), cv, tools, info);
    return tools;
  }
  function finish(score, msg, btn = '근무 마치기', title) {
    cancelAnimationFrame(raf);
    return new Promise(res => {
      const box = el('div', { class: 'mres' }, el('b', null, title || (score >= 0.8 ? '완벽해요!' : score >= 0.5 ? '잘했어요' : '수고했어요')), el('p', null, msg), el('button', { class: 'big' }, btn));
      box.querySelector('button').onclick = () => { root.classList.add('hidden'); root.innerHTML = ''; res(score); };
      root.append(box);
    });
  }
  // 포인터 → 내부 좌표
  function pt(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * SZ, (e.clientY - r.top) / r.height * SZ]; }
  function loop(fn) { let last = performance.now(); const step = (t) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; if (fn(dt) !== false) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); }
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  // ---------- 1. 군의관: 상처 치료 ----------
  function treat(patientName) {
    return new Promise(resolve => {
      const tools = setup('🩺 상처 치료', `${patientName}의 팔에 상처가 있어요. 도구를 고른 뒤 상처를 누르세요. 순서: 소독 → 연고 → 붕대`);
      const TOOLS = [['disinfect', '🧴 소독', '#7fd3ef'], ['ointment', '💊 연고', '#ffd166'], ['bandage', '🩹 붕대', '#f4efe4']];
      let tool = 'disinfect';
      TOOLS.forEach(([k, t]) => { const b = el('button', { class: 'tool' + (k === tool ? ' on' : '') }, t); b.onclick = () => { tool = k; [...tools.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); }; tools.append(b); });
      const r = U.rng(Date.now());
      const wounds = []; for (let i = 0; i < 5; i++) wounds.push({ x: 20 + i * 18 + r() * 6, y: 50 + Math.sin(i * 1.7) * 12 + r() * 6, step: 0, flash: 0 });
      let time = 40, miss = 0, done = 0;
      cv.onpointerdown = e => {
        const [x, y] = pt(e);
        const w = wounds.find(w => Math.hypot(w.x - x, w.y - y) < 9);
        if (!w || w.step >= 3) return;
        const need = ['disinfect', 'ointment', 'bandage'][w.step];
        if (tool === need) { w.step++; w.flash = 0.3; if (w.step === 3) done++; PX.Audio && PX.Audio.blip(1.4); }
        else { miss++; w.flash = -0.4; PX.Audio && PX.Audio.blip(0.5); }
      };
      loop(dt => {
        time -= dt;
        R(0, 0, SZ, SZ, '#dfeceb'); R(0, 96, SZ, 24, '#c9d8d6');
        R(6, 32, 108, 46, '#e9b48c'); R(6, 32, 108, 4, '#f3c9a6'); R(6, 74, 108, 4, '#c8946c'); // 팔
        R(0, 30, 10, 50, '#3d4a33');
        for (const w of wounds) {
          const c = w.step === 0 ? '#c43d4b' : w.step === 1 ? '#e07a7a' : w.step === 2 ? '#f0b080' : '#f4efe4';
          if (w.step === 3) { R(w.x - 7, w.y - 4, 14, 8, '#f4efe4'); R(w.x - 7, w.y - 1, 14, 1, '#d9d2c4'); }
          else { R(w.x - 5, w.y - 1, 10, 3, c); R(w.x - 3, w.y - 2, 6, 5, c); if (w.step >= 2) R(w.x - 4, w.y - 1, 8, 1, '#fff3c0'); }
          if (w.flash > 0) { w.flash -= dt; R(w.x - 8, w.y - 8, 2, 2, '#7fffd4'); R(w.x + 6, w.y - 7, 2, 2, '#7fffd4'); }
          if (w.flash < 0) { w.flash += dt; R(w.x - 6, w.y - 9, 12, 2, '#ff4d4d'); }
        }
        timerEl.textContent = '⏱ ' + Math.ceil(Math.max(0, time)); scoreEl.textContent = `치료 ${done}/5 · 실수 ${miss}`;
        if (done === 5 || time <= 0) {
          cv.onpointerdown = null;
          const score = U.clamp(done / 5 - miss * 0.05 + (done === 5 ? time / 80 : 0), 0, 1);
          finish(score, `상처 ${done}곳 치료 · 실수 ${miss}번`).then(resolve);
          return false;
        }
      });
    });
  }

  // ---------- 2. 수색 소위: 드론 정찰 ----------
  function drone() {
    return new Promise(resolve => {
      setup('🛰️ 드론 정찰', '화면을 눌러 드론을 움직이세요. 드론 근처의 안개가 걷혀요. 흔적(🟨)을 찾아 누르면 기록돼요. 붉은 반응(적대 생명체) 근처는 피하세요.');
      const r = U.rng(Date.now());
      const fog = new Uint8Array(30 * 30).fill(1);
      const traces = []; for (let i = 0; i < 4; i++) traces.push({ x: 10 + r() * 100, y: 10 + r() * 100, found: false, seen: false });
      const foes = []; for (let i = 0; i < 2; i++) foes.push({ x: 20 + r() * 80, y: 20 + r() * 80, a: r() * 6 });
      const d = { x: 60, y: 60, tx: 60, ty: 60, hp: 3, hurt: 0 };
      let time = 40, found = 0;
      const rocks = []; for (let i = 0; i < 18; i++) rocks.push([r() * 116, r() * 116, 2 + r() * 4]);
      cv.onpointerdown = e => {
        const [x, y] = pt(e);
        const t = traces.find(t => t.seen && !t.found && Math.hypot(t.x - x, t.y - y) < 7);
        if (t) { t.found = true; found++; PX.Audio && PX.Audio.blip(1.5); return; }
        d.tx = x; d.ty = y;
      };
      cv.onpointermove = e => { if (e.buttons) { const [x, y] = pt(e); d.tx = x; d.ty = y; } };
      loop(dt => {
        time -= dt;
        const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy);
        if (dist > 1) { d.x += dx / dist * Math.min(dist, 45 * dt); d.y += dy / dist * Math.min(dist, 45 * dt); }
        for (let y = 0; y < 30; y++) for (let x = 0; x < 30; x++) if (Math.hypot(x * 4 + 2 - d.x, y * 4 + 2 - d.y) < 16) fog[y * 30 + x] = 0;
        R(0, 0, SZ, SZ, '#c4613f');
        for (const [x, y, s] of rocks) { R(x, y, s, s * 0.7, '#9a4a35'); R(x, y, s, 1, '#d98d6c'); }
        for (const t of traces) { const vis = !fog[Math.floor(t.y / 4) * 30 + Math.floor(t.x / 4)]; if (vis) t.seen = true; if (t.seen) { if (t.found) { R(t.x - 3, t.y - 3, 6, 6, '#7fb86a'); R(t.x - 1, t.y - 1, 2, 2, '#ffffff'); } else { R(t.x - 3, t.y - 3, 6, 6, '#ffd166'); R(t.x - 2, t.y + 1, 1, 1, '#8a5a2a'); R(t.x + 1, t.y - 1, 1, 1, '#8a5a2a'); } } }
        for (const f of foes) { f.a += dt; const fx = f.x + Math.cos(f.a) * 8, fy = f.y + Math.sin(f.a * 1.3) * 8; R(fx - 3, fy - 3, 6, 6, 'rgba(255,60,60,0.7)'); R(fx - 1, fy - 1, 2, 2, '#ffffff'); if (Math.hypot(fx - d.x, fy - d.y) < 8 && d.hurt <= 0) { d.hp--; d.hurt = 1.2; PX.Audio && PX.Audio.blip(0.4); } }
        d.hurt -= dt;
        for (let y = 0; y < 30; y++) for (let x = 0; x < 30; x++) if (fog[y * 30 + x]) R(x * 4, y * 4, 4, 4, 'rgba(40,30,50,0.92)');
        const blink = d.hurt > 0 && Math.floor(d.hurt * 10) % 2;
        if (!blink) { R(d.x - 4, d.y - 1, 8, 2, '#3a3f45'); R(d.x - 1, d.y - 4, 2, 8, '#3a3f45'); R(d.x - 2, d.y - 2, 4, 4, '#8d98a3'); R(d.x - 1, d.y - 1, 2, 2, '#ff9b42'); }
        timerEl.textContent = '⏱ ' + Math.ceil(Math.max(0, time)); scoreEl.textContent = `흔적 ${found}/4 · 드론 ${'■'.repeat(Math.max(0, d.hp))}`;
        if (found === 4 || time <= 0 || d.hp <= 0) {
          api.lastFound = found >= 3 ? ['lizard', 'trace'] : found >= 1 ? ['lizard'] : [];
          cv.onpointerdown = cv.onpointermove = null;
          const score = U.clamp(found / 4 * (d.hp > 0 ? 1 : 0.7) + (found === 4 ? time / 120 : 0), 0, 1);
          finish(score, `흔적 ${found}개 기록${d.hp <= 0 ? ' · 드론이 손상돼 조기 복귀' : ''}. 보고서 작성 완료.`).then(resolve);
          return false;
        }
      });
    });
  }

  // ---------- 3. 정비 중위: 회로 연결 (회전 퍼즐) ----------
  function circuit() {
    return new Promise(resolve => {
      setup('🔧 드론 회로 연결', '타일을 눌러 회전시키세요. 왼쪽 위 전원(⚡)에서 오른쪽 아래 드론 코어(◆)까지 회로를 이어요.');
      const N = 5, C = 24;
      // 연결 비트: 1=위 2=오른쪽 4=아래 8=왼쪽
      const rot = b => ((b << 1) | (b >> 3)) & 15;
      const r = U.rng(Date.now());
      let path;
      for (let tries = 0; tries < 200; tries++) { // 무작위 경로 (DFS)
        const seen = new Set(['0,0']); const st = [[0, 0]];
        const dfs = () => { const [x, y] = st[st.length - 1]; if (x === N - 1 && y === N - 1) return true; const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]].sort(() => r() - 0.5); for (const [dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N || seen.has(nx + ',' + ny)) continue; seen.add(nx + ',' + ny); st.push([nx, ny]); if (dfs()) return true; st.pop(); } return false; };
        if (dfs() && st.length >= 9) { path = st; break; }
      }
      const tiles = [];
      for (let i = 0; i < N * N; i++) tiles.push({ b: [5, 3][Math.floor(r() * 2)] }); // 직선/모서리
      const bitTo = (a, b) => (b[0] > a[0] ? 2 : b[0] < a[0] ? 8 : b[1] > a[1] ? 4 : 1);
      for (let i = 0; i < path.length; i++) {
        let bits = 0;
        if (i > 0) bits |= bitTo(path[i], path[i - 1]); else bits |= 8;
        if (i < path.length - 1) bits |= bitTo(path[i], path[i + 1]); else bits |= 2;
        tiles[path[i][1] * N + path[i][0]].b = bits;
      }
      for (const t of tiles) { const k = Math.floor(r() * 4); for (let j = 0; j < k; j++) t.b = rot(t.b); }
      let time = 50, moves = 0, solved = false;
      const ox = (SZ - N * C) / 2, oy = (SZ - N * C) / 2;
      const powered = () => { // 전원에서 흐르는 칸
        const on = new Set(); const st = [[0, 0]];
        if (!(tiles[0].b & 8)) return on;
        on.add('0,0');
        while (st.length) { const [x, y] = st.pop(); const b = tiles[y * N + x].b; for (const [bit, dx, dy, opp] of [[1, 0, -1, 4], [2, 1, 0, 8], [4, 0, 1, 1], [8, -1, 0, 2]]) { if (!(b & bit)) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; if (!(tiles[ny * N + nx].b & opp) || on.has(nx + ',' + ny)) continue; on.add(nx + ',' + ny); st.push([nx, ny]); } }
        return on;
      };
      cv.onpointerdown = e => { const [x, y] = pt(e); const tx = Math.floor((x - ox) / C), ty = Math.floor((y - oy) / C); if (tx < 0 || ty < 0 || tx >= N || ty >= N || solved) return; tiles[ty * N + tx].b = rot(tiles[ty * N + tx].b); moves++; PX.Audio && PX.Audio.blip(1.1); };
      loop(dt => {
        time -= dt;
        const on = powered();
        solved = on.has((N - 1) + ',' + (N - 1)) && (tiles[N * N - 1].b & 2);
        R(0, 0, SZ, SZ, '#2a3240');
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const t = tiles[y * N + x], px = ox + x * C, py = oy + y * C, lit = on.has(x + ',' + y);
          R(px + 1, py + 1, C - 2, C - 2, '#3a4552');
          const c = lit ? '#7fffd4' : '#8d98a3', m = C / 2;
          R(px + m - 2, py + m - 2, 4, 4, c);
          if (t.b & 1) R(px + m - 2, py, 4, m, c); if (t.b & 4) R(px + m - 2, py + m, 4, m, c);
          if (t.b & 8) R(px, py + m - 2, m, 4, c); if (t.b & 2) R(px + m, py + m - 2, m, 4, c);
        }
        R(ox - 6, oy + C / 2 - 4, 6, 8, '#ffd166'); R(ox - 4, oy + C / 2 - 2, 2, 4, '#3a3f45');
        R(ox + N * C, oy + (N - 0.5) * C - 4, 7, 8, solved ? '#7fffd4' : '#ff9b42');
        timerEl.textContent = '⏱ ' + Math.ceil(Math.max(0, time)); scoreEl.textContent = `회전 ${moves}`;
        if (solved || time <= 0) {
          cv.onpointerdown = null;
          const score = solved ? U.clamp(0.6 + time / 60, 0, 1) : U.clamp(on.size / (N * N) * 0.8, 0, 0.5);
          setTimeout(() => finish(score, solved ? `드론 코어에 전원이 들어왔다! (${moves}번 회전)` : '시간 안에 다 잇지 못했다. 오지훈 상사가 마무리해 줬다.').then(resolve), solved ? 500 : 0);
          return false;
        }
      });
    });
  }

  // ---------- 4. 생태연구원: 검역 분류 ----------
  function sort() {
    return new Promise(resolve => {
      const tools = setup('🔬 검역 표본 분류', '표본의 특징을 보고 알맞은 곳을 누르세요.  ☠ 독성 표시 → 격리 · 빛남 → 보존 · 뿌리·열매 → 재배');
      const KINDS = [
        { n: '유리꽃', cx: 'glassflower', bin: 'keep', draw: () => { R(56, 40, 8, 30, '#3fa86b'); for (let i = 0; i < 5; i++) R(48 + i * 4, 30 + (i % 2) * 4, 6, 10, 'rgba(200,240,255,0.8)'); R(58, 36, 4, 4, '#ffffff'); }, tag: '빛남' },
        { n: '발광초', cx: 'glowgrass', bin: 'keep', draw: () => { R(58, 40, 4, 30, '#3fa86b'); R(52, 30, 16, 12, '#9ff5d0'); R(55, 32, 4, 4, '#ffffff'); }, tag: '빛남' },
        { n: '붉은 포자버섯', cx: 'redspore', bin: 'quar', draw: () => { R(56, 50, 8, 20, '#e8e3c8'); R(46, 38, 28, 14, '#c43d4b'); R(50, 40, 3, 3, '#fff'); R(62, 42, 3, 3, '#fff'); R(76, 30, 10, 10, '#222'); R(78, 32, 6, 6, '#ffd166'); }, tag: '☠ 독성' },
        { n: '가시 촉수 덩굴', cx: 'tentvine', bin: 'quar', draw: () => { for (let i = 0; i < 4; i++) R(44 + i * 8, 30 + (i % 2) * 6, 4, 36, '#6a3f8a'); R(40, 30, 40, 3, '#9b5fd0'); R(76, 30, 10, 10, '#222'); R(78, 32, 6, 6, '#ffd166'); }, tag: '☠ 독성' },
        { n: '향열매', cx: 'fruit', bin: 'farm', draw: () => { R(58, 30, 4, 10, '#6a4a3a'); R(48, 38, 24, 22, '#ff8b5e'); R(52, 42, 6, 6, '#ffd0a0'); }, tag: '열매' },
        { n: '페르녹스 뿌리채소', cx: 'root', bin: 'farm', draw: () => { R(52, 28, 4, 12, '#5bb07a'); R(62, 26, 4, 14, '#5bb07a'); R(50, 40, 20, 24, '#b06a8a'); R(56, 64, 8, 6, '#b06a8a'); }, tag: '뿌리' },
        { n: '은빛 이끼', cx: 'silvermoss', bin: 'keep', draw: () => { for (let i = 0; i < 6; i++) R(42 + i * 6, 52 - (i % 3) * 3, 6, 14, '#c9ccd6'); R(46, 50, 30, 2, '#ffffff'); }, tag: '빛남' },
        { n: '산성 점액 꽃', cx: 'acidflower', bin: 'quar', draw: () => { R(58, 44, 4, 26, '#3fa86b'); R(48, 32, 24, 14, '#a8d040'); R(54, 46, 3, 6, '#c8ff6a'); R(76, 30, 10, 10, '#222'); R(78, 32, 6, 6, '#ffd166'); }, tag: '☠ 독성' },
      ];
      const r = U.rng(Date.now());
      const queue = []; for (let i = 0; i < 12; i++) queue.push(KINDS[Math.floor(r() * KINDS.length)]);
      let idx = 0, ok = 0, bad = 0, time = 40, flash = 0, flashC = '';
      const found = new Set(); api.lastFound = found;
      const BINS = [['keep', '🟦 보존'], ['quar', '🟥 격리'], ['farm', '🟩 재배']];
      BINS.forEach(([k, t]) => { const b = el('button', { class: 'tool big' }, t); b.onclick = () => { if (idx >= queue.length) return; if (queue[idx].bin === k) { ok++; flashC = '#7fffd4'; PX.Audio && PX.Audio.blip(1.4); } else { bad++; flashC = '#ff4d4d'; PX.Audio && PX.Audio.blip(0.5); } flash = 0.25; idx++; }; tools.append(b); });
      loop(dt => {
        time -= dt;
        R(0, 0, SZ, SZ, '#e6f2ee'); R(30, 20, 60, 70, '#ffffff'); R(30, 20, 60, 2, '#cfe0da'); R(30, 88, 60, 2, '#cfe0da');
        R(34, 76, 52, 8, '#9fd8e8');
        if (idx < queue.length) { queue[idx].draw(); }
        if (flash > 0) { flash -= dt; R(0, 0, SZ, 3, flashC); R(0, SZ - 3, SZ, 3, flashC); }
        g.fillStyle = '#2f3a45'; g.font = '9px sans-serif'; g.textAlign = 'center';
        if (idx < queue.length) { g.fillText(queue[idx].n, 60, 104); g.fillStyle = queue[idx].tag.includes('☠') ? '#c43d4b' : '#3a7a6a'; g.fillText('특징: ' + queue[idx].tag, 60, 115); }
        timerEl.textContent = '⏱ ' + Math.ceil(Math.max(0, time)); scoreEl.textContent = `${idx}/12 · 정답 ${ok}`;
        if (idx >= queue.length || time <= 0) {
          const score = U.clamp(ok / 12 - bad * 0.03, 0, 1);
          finish(score, `표본 ${idx}개 분류 · 정답 ${ok}개. 생태도감에 기록했다.`).then(resolve);
          return false;
        }
      });
    });
  }

  // ---------- 오락실: 인형 뽑기 ----------
  function clawGame() {
    return new Promise(resolve => {
      const tools = setup('🐰 인형 뽑기', '집게가 좌우로 움직여요. 인형 위에 왔을 때 「내리기」를 누르세요!');
      const r = U.rng(Date.now());
      const toys = [{ x: 22, c: '#ffffff', bunny: true }, { x: 50, c: '#ffd166' }, { x: 78, c: '#ffb3c8' }, { x: 100, c: '#9fd8ff' }].map(t => Object.assign(t, { x: t.x + r() * 6 - 3 }));
      let cx = 10, dir = 1, cy = 16, state = 'move', grab = null, t = 0;
      const drop = el('button', { class: 'tool big' }, '⬇️ 내리기');
      drop.onclick = () => { if (state === 'move') state = 'down'; };
      tools.append(drop);
      loop(dt => {
        t += dt;
        if (state === 'move') { cx += dir * 40 * dt; if (cx > 110 || cx < 10) dir *= -1; }
        else if (state === 'down') { cy += 60 * dt; if (cy >= 74) { state = 'up'; const hit = toys.find(o => Math.abs(o.x - cx) < 7); if (hit && r() < (Math.abs(hit.x - cx) < 3.5 ? 0.92 : 0.6)) grab = hit; } }
        else if (state === 'up') { cy -= 50 * dt; if (cy <= 16) { state = 'over'; } }
        if (grab && state === 'up') { grab.x = cx; grab.y = cy + 8; }
        R(0, 0, SZ, SZ, '#2a1f4f'); R(4, 4, SZ - 8, SZ - 8, '#cfe8f2'); R(4, 84, SZ - 8, 32, '#ff6bd5'); R(8, 88, 22, 24, '#2a1f4f');
        for (const o of toys) { const y = o.y || 80; if (o === grab && state === 'over') continue; R(o.x - 6, y - 10, 12, 10, o.c); R(o.x - 5, y - 16, 3, 7, o.c); R(o.x + 2, y - 16, 3, 7, o.c); R(o.x - 3, y - 7, 1, 1, '#2a1e2a'); R(o.x + 2, y - 7, 1, 1, '#2a1e2a'); if (o.bunny) R(o.x - 2, y - 3, 4, 2, '#ff8fb0'); }
        R(cx - 1, 4, 2, cy - 4, '#9aa3ad'); R(cx - 6, cy, 12, 3, '#5a6370'); R(cx - 6, cy + 3, 2, 5, '#5a6370'); R(cx + 4, cy + 3, 2, 5, '#5a6370');
        timerEl.textContent = state === 'move' ? '조준 중' : '…'; scoreEl.textContent = '₢5';
        if (state === 'over') {
          const win = !!grab;
          setTimeout(() => finish(win ? 1 : 0, win ? '인형을 뽑았다!' : '집게가 미끄러졌다…', '확인', win ? '🎉 성공!' : '아깝다!').then(() => resolve(win)), 300);
          return false;
        }
      });
    });
  }

  // ================= 범용 미니게임 (활동 · 부대 행사용) =================
  // 타이밍: 움직이는 표시가 초록 구간에 왔을 때 누르기. rounds번 반복
  function timing(o) {
    return new Promise(resolve => {
      const tools = setup(o.title, o.help);
      let round = 0, hits = 0, x = 0, dir = 1, zone = null, sp = o.speed || 70, wait = 0, msg = '';
      const newZone = () => { const w = (o.zoneW || 22) - round * 2; zone = [10 + Math.random() * (100 - w - 10), 0]; zone[1] = zone[0] + w; };
      newZone();
      const btn = el('button', { class: 'tool big' }, o.btn || '지금!');
      btn.onclick = () => { if (wait > 0) return; const ok = x >= zone[0] && x <= zone[1]; if (ok) hits++; msg = ok ? '좋아요!' : '아깝다!'; PX.Audio && PX.Audio.blip(ok ? 1.5 : 0.5); round++; wait = 0.5; newZone(); sp *= 1.12; };
      tools.append(btn);
      loop(dt => {
        if (wait > 0) wait -= dt; else { x += dir * sp * dt; if (x > 110) { x = 110; dir = -1; } if (x < 10) { x = 10; dir = 1; } }
        R(0, 0, SZ, SZ, o.bg || '#2a3240'); if (o.draw) o.draw(R, round, hits);
        R(8, 92, 104, 10, '#120c20'); R(zone[0], 92, zone[1] - zone[0], 10, '#7fb86a'); R(x - 1, 88, 3, 18, '#ffd166');
        g.fillStyle = '#fff7ef'; g.font = '10px sans-serif'; g.textAlign = 'center'; g.fillText(msg, 60, 82);
        timerEl.textContent = `${Math.min(round + 1, o.rounds)}/${o.rounds}`; scoreEl.textContent = `성공 ${hits}`;
        if (round >= o.rounds) { const sc = hits / o.rounds; setTimeout(() => finish(sc, o.result ? o.result(hits, sc) : `${o.rounds}번 중 ${hits}번 성공`, '확인').then(resolve), 300); return false; }
      });
    });
  }
  // 연타 경주: 버튼을 빠르게 눌러 상대보다 먼저 막대를 채우기 (팔씨름 · 줄다리기)
  function tapRace(o) {
    return new Promise(resolve => {
      const tools = setup(o.title, o.help);
      let me = 50, time = o.time || 10, done = false;
      const foe = o.foe || 6; // 초당 상대 힘
      const btn = el('button', { class: 'tool big' }, o.btn || '힘껏!');
      const push = (e) => { e.preventDefault(); if (done) return; me += 3.2; PX.Audio && PX.Audio.blip(1 + Math.random() * 0.3); };
      btn.addEventListener('pointerdown', push); tools.append(btn);
      loop(dt => {
        time -= dt; me -= foe * dt; me = Math.max(0, Math.min(100, me));
        R(0, 0, SZ, SZ, o.bg || '#3a2f50'); if (o.draw) o.draw(R, me);
        R(10, 96, 100, 10, '#120c20'); R(10, 96, me, 10, '#ff7aa2'); R(59, 92, 2, 18, '#ffffff');
        g.fillStyle = '#fff7ef'; g.font = '10px sans-serif'; g.textAlign = 'center'; g.fillText(o.left || '나', 22, 90); g.fillText(o.right || '상대', 98, 90);
        timerEl.textContent = '⏱ ' + Math.ceil(Math.max(0, time)); scoreEl.textContent = me > 50 ? '우세!' : '밀린다!';
        if (me >= 100 || me <= 0 || time <= 0) { done = true; const win = me >= 50; setTimeout(() => finish(win ? 1 : 0.3, o.result ? o.result(win) : (win ? '이겼다!' : '졌다…'), '확인', win ? '🏆 승리!' : '아쉽다!').then(() => resolve(win)), 300); return false; }
      });
    });
  }
  // 표적: 나타나는 표적을 빨리 누르기 (사격 · 물총전 · 반응 속도)
  function targets(o) {
    return new Promise(resolve => {
      setup(o.title, o.help);
      let time = o.time || 20, hit = 0, miss = 0, spawn = 0;
      const ts = [];
      cv.onpointerdown = e => { const [x, y] = pt(e); const t = ts.find(t => Math.hypot(t.x - x, t.y - y) < t.r + 3); if (t) { hit++; ts.splice(ts.indexOf(t), 1); PX.Audio && PX.Audio.blip(1.5); } else { miss++; } };
      loop(dt => {
        time -= dt; spawn -= dt;
        if (spawn <= 0 && ts.length < 4) { spawn = 0.45 + Math.random() * 0.5; ts.push({ x: 14 + Math.random() * 92, y: 14 + Math.random() * 80, r: 6 + Math.random() * 3, life: 1.6 }); }
        R(0, 0, SZ, SZ, o.bg || '#3a4a3a'); if (o.draw) o.draw(R);
        for (let i = ts.length - 1; i >= 0; i--) { const t = ts[i]; t.life -= dt; if (t.life <= 0) { ts.splice(i, 1); continue; } R(t.x - t.r, t.y - t.r, t.r * 2, t.r * 2, o.color || '#d0563b'); R(t.x - t.r / 2, t.y - t.r / 2, t.r, t.r, '#f4efe4'); R(t.x - 1, t.y - 1, 2, 2, o.color || '#d0563b'); }
        timerEl.textContent = '⏱ ' + Math.ceil(Math.max(0, time)); scoreEl.textContent = `명중 ${hit}`;
        if (time <= 0) { cv.onpointerdown = null; const sc = U.clamp(hit / (o.goal || 18) - miss * 0.02, 0, 1); finish(sc, o.result ? o.result(hit, sc) : `명중 ${hit}발`, '확인').then(() => resolve(sc)); return false; }
      });
    });
  }
  // 퀴즈: 로어북 · 부대 상식 (선택지 버튼)
  function quiz(o) {
    return new Promise(resolve => {
      const tools = setup(o.title, o.help);
      let i = 0, ok = 0;
      const qbox = el('p', { class: 'mhelp', style: 'color:#fff7ef;font-size:16px' });
      cv.style.display = 'none'; root.insertBefore(qbox, tools);
      const show = () => {
        tools.innerHTML = '';
        if (i >= o.qs.length) { cv.style.display = ''; finish(ok / o.qs.length, `${o.qs.length}문제 중 ${ok}개 정답`, '확인').then(() => resolve(ok / o.qs.length)); return; }
        const q = o.qs[i]; qbox.textContent = `Q${i + 1}. ${q.q}`; timerEl.textContent = `${i + 1}/${o.qs.length}`; scoreEl.textContent = `정답 ${ok}`;
        q.a.forEach((a, k) => { const b = el('button', { class: 'tool' }, a); b.onclick = () => { if (k === q.c) { ok++; PX.Audio && PX.Audio.blip(1.5); } else PX.Audio && PX.Audio.blip(0.5); i++; show(); }; tools.append(b); });
      };
      show();
    });
  }

  const api = {};
  function run(type, ctx = {}) {
    api.lastFound = [];
    PX.Game.inMini = true; PX.Game.modal++;
    const p = type === 'treat' ? treat(ctx.patient || '부상병') : type === 'drone' ? drone() : type === 'circuit' ? circuit() : sort();
    return p.then(s => { PX.Game.inMini = false; PX.Game.modal--; return s; });
  }
  api.run = run;
  api.abort = () => { cancelAnimationFrame(raf); raf = 0; if (cv) cv.onpointerdown = null; };
  const wrap = f => (o) => { PX.Game.inMini = true; PX.Game.modal++; return f(o).then(r => { PX.Game.inMini = false; PX.Game.modal--; return r; }); };
  api.timing = wrap(timing); api.tapRace = wrap(tapRace); api.targets = wrap(targets); api.quiz = wrap(quiz);
  api.claw = () => { PX.Game.inMini = true; PX.Game.modal++; return clawGame().then(w => { PX.Game.inMini = false; PX.Game.modal--; return w; }); };
  return api;
})();
