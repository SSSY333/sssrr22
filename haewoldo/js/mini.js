/* =====================================================================
   미니게임 5가지 — 메뉴를 늘리지 않고, 그 장소의 행동 버튼에서 바로
   · 🎤 노래방 리듬 (마을회관 노래방 무대)   · 🍊 귤 받기 (귤나무 · 귤밭)
   · ☕ 라떼 아트 (카페 안)                    · 🪨 물수제비 (해변 · 산책로)
   · 🎣 낚시: 입질이 오면 줄 당기기 (줄 버티기)
   한 판 30초 안팎, 누르기 · 꾹 누르기 · 끌기 한 가지 조작
   ===================================================================== */
function mgState() { if (!S.mg) S.mg = { best: {}, plays: {} }; return S.mg; }
function mgDaily(k) { const d = S.rel.daily; d.mg = d.mg || {}; return d.mg[k] || 0; }
function mgDailyAdd(k) { const d = S.rel.daily; d.mg = d.mg || {}; d.mg[k] = (d.mg[k] || 0) + 1; }
function mgBest(k, v) { const st = mgState(); st.plays[k] = (st.plays[k] || 0) + 1; const prev = st.best[k] || 0; if (v > prev) st.best[k] = v; return v > prev && prev > 0; }
/* 짧은 소리 (효과음 설정을 따름) */
function mgTone(midi, dur = 0.16, type = 'triangle', vol = 0.12) {
  try { const c = Sound.ctx; if (!c || !Sound.on.sfx || c.state !== 'running') return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05); } catch (e) { }
}

/* ---------------- 공통 틀: 규칙 화면 → 3 · 2 · 1 → 놀이 → 결과 ---------------- */
const MG_W = 320, MG_H = 400;
function mgRun(def) {
  return new Promise((resolve) => {
    G.mgOn = true;
    const wrap = document.createElement('div'); wrap.id = 'mg';
    wrap.innerHTML = `<div class="mgCard"><div class="mgHead"><b>${def.icon} ${def.title}</b><span id="mgHud"></span><button class="mgX" aria-label="그만하기">✕</button></div><div class="mgStage"><canvas id="mgC"></canvas><div class="mgOver" id="mgOver"></div></div><div class="mgHint" id="mgHint">${def.hint || ''}</div></div>`;
    document.body.appendChild(wrap);
    const cv = wrap.querySelector('#mgC'), dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = MG_W * dpr; cv.height = MG_H * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const over = wrap.querySelector('#mgOver'), hud = wrap.querySelector('#mgHud');
    const st = { t: 0, time: def.time || 30, phase: 'rules', opt: null, score: 0, fx: [], hold: false, px: MG_W / 2, py: MG_H / 2, hud: (s) => { hud.textContent = s; } };
    let raf = 0, last = 0, done = false; G.mgSt = st;
    const finish = (res) => {
      if (done) return; done = true; cancelAnimationFrame(raf); G.mgOn = false;
      wrap.remove(); resolve(res);
    };
    const showResult = () => {
      st.phase = 'result'; const r = def.result(st);
      over.innerHTML = `<div class="mgBox"><div class="mgBig">${r.big}</div><div class="mgTxt">${r.text}</div><button class="mgBtn ok">확인</button></div>`; over.classList.remove('hidden');
      over.querySelector('button').onclick = () => { Sound.sfx('tap'); finish(r); };
    };
    st.end = () => { if (st.phase === 'play') { st.phase = 'ending'; setTimeout(showResult, 450); } };
    // 규칙 화면
    const opts = def.options ? `<div class="mgOpts">${def.options.map((o, i) => `<button class="mgBtn${i === 0 ? ' on' : ''}" data-i="${i}">${o.label}</button>`).join('')}</div>` : '';
    over.innerHTML = `<div class="mgBox"><div class="mgBig">${def.icon}</div><div class="mgTxt">${def.rules.map(r => `· ${r}`).join('<br>')}</div>${opts}<button class="mgBtn ok mgGo">시작!</button></div>`;
    let optI = 0;
    over.querySelectorAll('.mgOpts button').forEach(b => b.onclick = () => { Sound.sfx('tap'); optI = +b.dataset.i; over.querySelectorAll('.mgOpts button').forEach(x => x.classList.toggle('on', x === b)); });
    over.querySelector('.mgGo').onclick = () => {
      Sound.init && Sound.init(); Sound.sfx('tap'); st.opt = def.options ? def.options[optI].value : null;
      over.classList.add('hidden'); st.phase = 'count'; st.count = 3; def.init(st);
    };
    wrap.querySelector('.mgX').onclick = () => { Sound.sfx('tap'); if (st.phase === 'play' || st.phase === 'count') { st.quit = true; st.phase = 'play'; st.end(); } else finish(null); };
    // 입력
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * MG_W, (e.clientY - r.top) / r.height * MG_H]; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); [st.px, st.py] = pos(e); st.hold = true; if (st.phase === 'play' && def.down) def.down(st, st.px, st.py); });
    cv.addEventListener('pointermove', (e) => { [st.px, st.py] = pos(e); if (st.phase === 'play' && def.move) def.move(st, st.px, st.py); });
    const up = (e) => { st.hold = false; if (st.phase === 'play' && def.up) def.up(st, st.px, st.py); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', (e) => { if (st.hold) up(e); });
    // 고리
    const loop = (now) => {
      raf = requestAnimationFrame(loop); const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
      if (st.phase === 'count') { st.count -= dt; if (st.count <= 0) { st.phase = 'play'; mgTone(84, 0.2); } else if (Math.ceil(st.count) !== Math.ceil(st.count + dt)) mgTone(72, 0.12); }
      if (st.phase === 'play') { st.t += dt; def.update(st, dt); if (def.time !== 0 && st.t >= st.time) st.end(); }
      else if (st.phase === 'ending' && def.update && def.keepUpdating) def.update(st, dt);
      g.clearRect(0, 0, MG_W, MG_H);
      if (st.phase !== 'rules') def.draw(g, st);
      else if (def.drawIdle) def.drawIdle(g, st); else mgBg(g, '#bfe6f5', '#eaf7fb');
      for (const f of st.fx) { f.t -= dt; f.y -= 28 * dt; g.globalAlpha = Math.max(0, Math.min(1, f.t * 2)); mgText(g, f.s, f.x, f.y, f.size || 15, f.c || '#fff', 'center', true); g.globalAlpha = 1; }
      st.fx = st.fx.filter(f => f.t > 0);
      if (def.time && st.phase === 'play') { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(10, 8, MG_W - 20, 6); g.fillStyle = st.time - st.t < 5 ? '#ff6f61' : '#ffd34d'; g.fillRect(10, 8, (MG_W - 20) * Math.max(0, 1 - st.t / st.time), 6); }
      if (st.phase === 'count') { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, MG_W, MG_H); mgText(g, String(Math.ceil(st.count)), MG_W / 2, MG_H / 2, 64, '#fff', 'center', true); }
    };
    raf = requestAnimationFrame(loop);
  });
}
function mgPop(st, s, x, y, c, size) { st.fx.push({ s, x, y, c, size, t: 0.9 }); }
function mgText(g, s, x, y, size, col, align = 'left', outline) {
  g.font = `${size}px Jua, 'Noto Sans KR', sans-serif`; g.textAlign = align; g.textBaseline = 'middle';
  if (outline) { g.lineWidth = 4; g.strokeStyle = 'rgba(58,42,38,0.85)'; g.strokeText(s, x, y); }
  g.fillStyle = col; g.fillText(s, x, y);
}
function mgRR(g, x, y, w, h, r, fill) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fillStyle = fill; g.fill(); }
function mgBg(g, top, bot) { const gr = g.createLinearGradient(0, 0, 0, MG_H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, MG_W, MG_H); }
function mgCircle(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); }
const mgDetHere = (r = 5) => typeof detNearby === 'function' ? detNearby(r) : (S.comp && dist(G.det, G.player) < r);

/* =====================================================================
   🎤 노래방 리듬 — 세 줄로 떨어지는 음표를 선에 맞춰 눌러요
   ===================================================================== */
const MG_SONGS = [
  { label: '🌊 바다가 보이는 언덕 (느림)', value: { name: '바다가 보이는 언덕', bpm: 84, eighth: 0.05, len: 26, scale: [60, 62, 64, 67, 69] } },
  { label: '🎸 해월도 블루스 (보통)', value: { name: '해월도 블루스', bpm: 104, eighth: 0.14, len: 27, scale: [62, 65, 67, 69, 72] } },
  { label: '💗 등대지기의 사랑 (빠름)', value: { name: '등대지기의 사랑', bpm: 124, eighth: 0.22, len: 28, scale: [64, 67, 69, 71, 74] } },
];
const KR_LANES = [70, 160, 250], KR_HIT = 330, KR_SPEED = 230;
function mgKaraoke(duet) {
  return mgRun({
    icon: '🎤', title: '노래방', hint: '음표가 노란 선에 닿을 때 그 줄을 눌러요',
    rules: ['음표가 노란 선에 닿는 순간 그 줄을 눌러요', '딱 맞으면 「완벽」, 조금 빗나가면 「좋아」', duet ? `${josa(himCall(), '이', '가')} 화음을 넣어 줘요. 연속으로 맞히면 하트가 쌓여요` : '연속으로 맞히면 점수가 더 올라가요'], options: MG_SONGS,
    init(st) {
      const s = st.opt, beat = 60 / s.bpm; st.song = s; st.time = s.len; st.notes = []; st.combo = 0; st.maxCombo = 0; st.hits = 0; st.perfect = 0; st.pts = 0; st.flash = [0, 0, 0]; st.duet = duet; st.hearts = 0;
      let lastL = -1, same = 0;
      for (let t = 2.2; t < s.len - 1.2; t += beat) {
        if (Math.random() < 0.78) { let l = Math.floor(Math.random() * 3); if (l === lastL && ++same >= 2) l = (l + 1 + Math.floor(Math.random() * 2)) % 3; if (l !== lastL) same = 0; lastL = l; st.notes.push({ t, l, hit: false, miss: false }); }
        if (Math.random() < s.eighth) st.notes.push({ t: t + beat / 2, l: Math.floor(Math.random() * 3), hit: false, miss: false });
      }
      st.notes.sort((a, b) => a.t - b.t); st.total = st.notes.length;
    },
    update(st) {
      for (const n of st.notes) if (!n.hit && !n.miss && st.t - n.t > 0.2) { n.miss = true; st.combo = 0; mgPop(st, '놓침', KR_LANES[n.l], KR_HIT - 30, '#ffb3b3', 14); }
      st.flash = st.flash.map(f => Math.max(0, f - 0.06));
      st.hud(`${Math.round(st.pts / Math.max(1, st.total))}점 · ${st.combo}연속`);
      if (st.t > st.song.len - 0.6 && st.notes.every(n => n.hit || n.miss)) st.end();
    },
    down(st, x) {
      const l = x < 115 ? 0 : x < 205 ? 1 : 2; st.flash[l] = 1;
      const n = st.notes.find(n => !n.hit && !n.miss && n.l === l && Math.abs(st.t - n.t) < 0.19);
      if (!n) return;
      const d = Math.abs(st.t - n.t); n.hit = true; st.hits++; st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
      const pf = d < 0.075; if (pf) st.perfect++;
      st.pts += (pf ? 100 : 65) + Math.min(20, st.combo);
      mgTone(st.song.scale[(l * 2 + st.hits) % 5] + (pf ? 12 : 0), 0.18);
      if (st.duet) mgTone(st.song.scale[(l * 2 + st.hits + 2) % 5], 0.18, 'sine', 0.06);
      mgPop(st, pf ? '완벽!' : '좋아', KR_LANES[l], KR_HIT - 34, pf ? '#fff36b' : '#bdf5c8', pf ? 17 : 14);
      if (st.duet && st.combo > 0 && st.combo % 8 === 0) { st.hearts++; mgPop(st, '💗', 290, 70, '#fff', 22); }
    },
    draw(g, st) {
      mgBg(g, '#2b2350', '#5e3f86');
      for (let i = 0; i < 18; i++) { const x = (i * 53 + st.t * 30) % MG_W, y = (i * 37) % 200; g.fillStyle = `rgba(255,255,255,${0.15 + 0.15 * Math.sin(st.t * 3 + i)})`; g.fillRect(x, y, 2, 2); }
      for (let l = 0; l < 3; l++) { const x = KR_LANES[l]; g.fillStyle = `rgba(255,255,255,${0.07 + st.flash[l] * 0.25})`; g.fillRect(x - 38, 20, 76, MG_H - 40); }
      g.fillStyle = '#ffd34d'; g.fillRect(24, KR_HIT - 2, MG_W - 48, 4);
      for (let l = 0; l < 3; l++) mgCircle(g, KR_LANES[l], KR_HIT, 22 + st.flash[l] * 4, `rgba(255,211,77,${0.25 + st.flash[l] * 0.5})`);
      const col = ['#ff8fb1', '#7fd0ff', '#b8f07a'];
      for (const n of st.notes) {
        if (n.hit) continue; const y = KR_HIT - (n.t - st.t) * KR_SPEED; if (y < -20 || y > MG_H + 20) continue;
        g.globalAlpha = n.miss ? 0.3 : 1; mgCircle(g, KR_LANES[n.l], y, 17, '#3a2a26'); mgCircle(g, KR_LANES[n.l], y, 14, col[n.l]); mgText(g, '♪', KR_LANES[n.l], y + 1, 18, '#3a2a26', 'center'); g.globalAlpha = 1;
      }
      mgText(g, `♬ ${st.song.name}`, 14, 30, 13, '#ffe7f2');
      if (st.combo >= 5) mgText(g, `${st.combo} 콤보!`, MG_W / 2, 64, 20, '#fff36b', 'center', true);
      if (st.duet) { mgText(g, `🎙 ${himCall()} 화음 ${'💗'.repeat(Math.min(5, st.hearts))}`, MG_W - 14, 30, 12, '#ffe7f2', 'right'); }
      mgText(g, '◀ 누르는 곳 ▶', MG_W / 2, KR_HIT + 44, 12, 'rgba(255,255,255,0.6)', 'center');
    },
    result(st) {
      const acc = st.total ? Math.round(st.hits / st.total * 100) : 0, score = Math.min(100, Math.round(st.pts / Math.max(1, st.total)));
      st.final = st.quit ? 0 : score;
      return { score: st.final, perfect: st.perfect, maxCombo: st.maxCombo, hearts: st.hearts, song: st.song.name, quit: !!st.quit, big: st.quit ? '🎤' : `${st.final}점`, text: st.quit ? '노래를 중간에 멈췄어요' : `맞힌 음표 ${st.hits}/${st.total} (${acc}%) · 완벽 ${st.perfect} · 최대 ${st.maxCombo}연속${st.final >= 95 ? '<br>🎉 완벽한 무대!' : st.final >= 80 ? '<br>박수 짝짝짝!' : '<br>그래도 즐거웠다!'}` };
    },
  });
}

/* =====================================================================
   🍊 귤 받기 — 바구니를 끌어서 떨어지는 귤을 받아요
   ===================================================================== */
function mgOrange(withDet) {
  return mgRun({
    icon: '🍊', title: '귤 받기', hint: '화면을 누른 채 좌우로 끌면 바구니가 따라와요', time: 30,
    rules: ['나무에서 떨어지는 귤을 바구니로 받아요', '✨ 황금 귤은 3개 몫! 🐛 벌레 먹은 잎은 1개가 줄어요', withDet ? `${josa(himCall(), '이', '가')} 나무를 흔들어 줘요 — 가끔 귤이 우수수!` : '시간이 갈수록 빨리 떨어져요'],
    init(st) { st.bx = MG_W / 2; st.items = []; st.spawn = 0.4; st.caught = 0; st.gold = 0; st.bugs = 0; st.shake = 0; st.withDet = withDet; st.rush = 0; },
    update(st, dt) {
      if (st.hold) st.bx += (Math.max(36, Math.min(MG_W - 36, st.px)) - st.bx) * Math.min(1, dt * 14);
      st.spawn -= dt; const sp = 1 + st.t / 30 * 0.9;
      if (st.withDet && st.rush <= 0 && Math.random() < dt * 0.12) { st.rush = 1.6; st.shake = 0.6; mgPop(st, '흔들흔들~', MG_W / 2, 92, '#fff36b', 16); }
      if (st.rush > 0) st.rush -= dt;
      if (st.spawn <= 0) {
        st.spawn = (st.rush > 0 ? 0.16 : 0.62 - st.t * 0.008) * (0.7 + Math.random() * 0.6);
        const r = Math.random(), kind = r < 0.07 ? 'gold' : r < 0.2 ? 'bug' : 'orange';
        st.items.push({ kind, x: 30 + Math.random() * (MG_W - 60), y: 70, vy: (60 + Math.random() * 50) * sp, rot: Math.random() * 6 });
      }
      st.shake = Math.max(0, st.shake - dt);
      for (const it of st.items) {
        it.vy += 170 * dt * sp; it.y += it.vy * dt; it.rot += dt * 3;
        if (!it.gone && it.y > 336 && it.y < 362 && Math.abs(it.x - st.bx) < 38) {
          it.gone = true;
          if (it.kind === 'bug') { st.caught = Math.max(0, st.caught - 1); st.bugs++; mgPop(st, '-1 🐛', it.x, 320, '#ffb3b3'); mgTone(48, 0.2, 'square', 0.05); }
          else { const n = it.kind === 'gold' ? 3 : 1; st.caught += n; if (n === 3) st.gold++; mgPop(st, n === 3 ? '+3 ✨' : '+1', it.x, 320, n === 3 ? '#fff36b' : '#fff'); mgTone(n === 3 ? 84 : 72 + (st.caught % 5) * 2, 0.12); }
        }
      }
      st.items = st.items.filter(it => !it.gone && it.y < MG_H + 30);
      st.hud(`귤 ${st.caught}개`);
    },
    draw(g, st) {
      mgBg(g, '#a8dcf0', '#e8f6e0');
      const sx = st.shake > 0 ? Math.sin(st.t * 60) * 3 : 0;
      g.fillStyle = '#7a5236'; g.fillRect(150 + sx, 40, 20, 60);
      for (const [x, y, r] of [[60, 52, 46], [160, 40, 58], [262, 52, 46], [110, 70, 40], [214, 70, 40]]) mgCircle(g, x + sx, y, r, '#4f9a4a');
      for (const [x, y] of [[40, 60], [90, 36], [140, 60], [190, 28], [236, 66], [282, 40], [120, 88], [205, 92]]) mgCircle(g, x + sx, y, 6, '#f39a2b');
      g.fillStyle = '#9fd07a'; g.fillRect(0, 370, MG_W, 30);
      for (const it of st.items) {
        if (it.kind === 'bug') { g.save(); g.translate(it.x, it.y); g.rotate(it.rot); g.fillStyle = '#8a9a4a'; g.beginPath(); g.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2); g.fill(); g.restore(); mgText(g, '🐛', it.x, it.y, 13, '#fff', 'center'); }
        else { mgCircle(g, it.x, it.y, 12, '#3a2a26'); mgCircle(g, it.x, it.y, 10, it.kind === 'gold' ? '#ffd34d' : '#f39a2b'); g.fillStyle = '#4f9e4a'; g.fillRect(it.x - 1, it.y - 13, 3, 4); if (it.kind === 'gold') mgText(g, '✨', it.x + 10, it.y - 10, 11, '#fff', 'center'); }
      }
      // 바구니
      const bx = st.bx; mgRR(g, bx - 38, 340, 76, 28, 8, '#3a2a26'); mgRR(g, bx - 35, 342, 70, 24, 7, '#c99a64');
      g.fillStyle = '#a87a4a'; for (let i = -28; i <= 28; i += 10) g.fillRect(bx + i, 344, 3, 20);
      if (st.caught) for (let i = 0; i < Math.min(5, st.caught); i++) mgCircle(g, bx - 20 + i * 10, 340, 6, '#f39a2b');
      mgText(g, `🍊 ${st.caught}`, 14, 30, 18, '#fff', 'left', true);
      if (st.withDet) mgText(g, `🌳 ${himCall()}`, MG_W - 14, 30, 13, '#fff', 'right', true);
    },
    result(st) {
      const c = st.quit ? 0 : st.caught;
      return { caught: c, gold: st.gold, quit: !!st.quit, big: `🍊 × ${c}`, text: st.quit ? '중간에 그만뒀어요' : `받은 귤 ${c}개${st.gold ? ` (황금 귤 ${st.gold}번!)` : ''}${st.bugs ? ` · 벌레 잎 ${st.bugs}번` : ''}${c >= 30 ? '<br>🎉 귤 박사!' : c >= 18 ? '<br>바구니가 묵직하다!' : ''}` };
    },
  });
}

/* =====================================================================
   ☕ 라떼 아트 — 꾹 눌러 우유를 붓고, 알맞을 때 떼고, 가운데서 그림 완성
   ===================================================================== */
const LATTE_ART = [['하트', '💗'], ['나뭇잎', '🌿'], ['곰돌이', '🐻'], ['백조', '🦢'], ['튤립', '🌷']];
function mgLatte(isJob) {
  return mgRun({
    icon: '☕', title: isJob ? '라떼 아트 (영업 중)' : '라떼 아트 체험', hint: '꾹 눌러 붓기 → 초록 칸에서 떼기 → 주전자가 가운데 올 때 누르기', time: 0,
    rules: ['화면을 꾹 누르면 우유가 부어져요. 초록 칸에 왔을 때 손을 떼요', '넘치면 다시! 그다음 흔들리는 주전자가 가운데 올 때 눌러 그림을 그려요', isJob ? '손님 세 분의 주문을 받아요. 잘 만들수록 팁이 늘어요' : '세 잔을 만들어 봐요'],
    init(st) { st.cup = 0; st.cups = []; st.newCup = () => { st.fill = 0; st.step = 'pour'; st.band = [0.72 + Math.random() * 0.08, 0]; st.band[1] = st.band[0] + 0.1; st.art = LATTE_ART[Math.floor(Math.random() * LATTE_ART.length)]; st.swing = Math.random() * 6; st.cupT = 0; st.pourS = 0; st.artS = 0; }; st.newCup(); st.wait = 0; },
    update(st, dt) {
      st.cupT += dt; if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) { if (st.step === 'spill') { st.step = 'pour'; st.fill = 0; } else if (st.cup >= 3) st.end(); else st.newCup(); } return; }
      if (st.step === 'pour' && st.hold) { st.fill += dt * (0.34 + 0.12 * Math.sin(st.cupT * 5)); if (st.fill > 1.02) { st.step = 'spill'; st.pourS = 0; mgPop(st, '앗, 넘쳤다!', MG_W / 2, 150, '#ffb3b3', 18); mgTone(45, 0.3, 'square', 0.05); st.wait = 0.9; } }
      if (st.step === 'art') st.swing += dt * (2.6 + st.cup * 0.7);
      st.hud(`${st.cup + 1 > 3 ? 3 : st.cup + 1}/3잔 · ${st.cups.reduce((a, c) => a + c, 0)}점`);
    },
    down(st) { if (st.wait > 0) return; if (st.step === 'art') { const off = Math.abs(Math.sin(st.swing)) * 60; st.artS = off < 7 ? 50 : off < 18 ? 35 : off < 32 ? 18 : 6; mgPop(st, off < 7 ? `완벽한 ${st.art[0]}!` : off < 18 ? `예쁜 ${st.art[0]}` : off < 32 ? `${st.art[0]}…같은 것` : '음… 추상화?', MG_W / 2, 120, off < 18 ? '#fff36b' : '#fff', 17); mgTone(off < 18 ? 79 : 67, 0.2); st.step = 'done'; st.cups.push(st.pourS + st.artS); st.cup++; st.wait = 1.3; } },
    up(st) {
      if (st.step !== 'pour' || st.fill < 0.05 || st.wait > 0) return;
      const [a, b] = st.band, f = st.fill;
      st.pourS = f >= a && f <= b ? 50 : Math.abs(f - (f < a ? a : b)) < 0.07 ? 30 : 10;
      mgPop(st, st.pourS === 50 ? '딱 좋아요!' : st.pourS === 30 ? '조금 아쉬워요' : f < a ? '너무 적어요' : '너무 많아요', MG_W / 2, 150, st.pourS === 50 ? '#bdf5c8' : '#fff', 16);
      st.step = 'art';
    },
    draw(g, st) {
      mgBg(g, '#f6e3c8', '#e2c29a');
      g.fillStyle = '#c99a64'; g.fillRect(0, 300, MG_W, 100); g.fillStyle = '#b5844f'; g.fillRect(0, 300, MG_W, 6);
      // 잔(옆에서) + 우유 높이
      const cx = MG_W / 2, cupTop = 170, cupH = 120;
      mgRR(g, cx - 66, cupTop - 4, 132, cupH + 8, 14, '#3a2a26'); mgRR(g, cx - 62, cupTop, 124, cupH, 12, '#fffaf2');
      const h = Math.min(1, st.fill || 0) * (cupH - 8);
      mgRR(g, cx - 58, cupTop + cupH - 4 - h, 116, Math.max(0, h), 9, st.fill > 0.5 ? '#c9915a' : '#8a5a3a');
      g.fillStyle = '#3a2a26'; g.fillRect(cx + 62, cupTop + 30, 18, 6); g.fillRect(cx + 74, cupTop + 30, 6, 46); g.fillRect(cx + 62, cupTop + 70, 18, 6);
      // 목표 칸
      if (st.step === 'pour' || st.step === 'spill') { const y0 = cupTop + cupH - 4 - st.band[1] * (cupH - 8), y1 = cupTop + cupH - 4 - st.band[0] * (cupH - 8); g.fillStyle = 'rgba(90,200,120,0.35)'; g.fillRect(cx - 90, y0, 180, y1 - y0); g.fillStyle = '#3f9a5a'; g.fillRect(cx - 96, y0, 6, y1 - y0); g.fillRect(cx + 90, y0, 6, y1 - y0); }
      // 주전자
      const px = st.step === 'art' ? cx + Math.sin(st.swing) * 60 : cx + 30;
      g.save(); g.translate(px, 120); g.rotate(st.hold && st.step === 'pour' ? -0.5 : st.step === 'art' ? -0.3 : 0);
      mgRR(g, -22, -26, 44, 44, 8, '#3a2a26'); mgRR(g, -19, -23, 38, 38, 6, '#d7dde6'); g.fillStyle = '#3a2a26'; g.fillRect(-34, -18, 14, 6); g.restore();
      if (st.hold && st.step === 'pour') { g.fillStyle = '#fffaf2'; g.fillRect(cx + 2, 110, 6, cupTop + cupH - h - 110); }
      if (st.step === 'art') { g.strokeStyle = 'rgba(58,42,38,0.5)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(cx, 90); g.lineTo(cx, 160); g.stroke(); g.setLineDash([]); mgText(g, `${st.art[1]} ${st.art[0]} 그리기 — 가운데서 눌러요!`, cx, 76, 14, '#5b4450', 'center'); }
      else if (st.step === 'pour') mgText(g, `주문: ${st.art[0]} 라떼 ${st.art[1]} — 꾹 눌러 부어요`, cx, 76, 14, '#5b4450', 'center');
      if (st.step === 'done') { mgCircle(g, cx, 340, 44, '#3a2a26'); mgCircle(g, cx, 340, 40, '#fffaf2'); mgCircle(g, cx, 340, 32, '#c9915a'); mgText(g, st.art[1], cx, 340, st.artS >= 35 ? 34 : 22, '#fff', 'center'); }
      for (let i = 0; i < 3; i++) mgText(g, i < st.cups.length ? '☕' : '○', 20 + i * 24, 30, 16, '#5b4450', 'center');
    },
    result(st) {
      const tot = st.cups.reduce((a, c) => a + c, 0), avg = st.cups.length ? Math.round(tot / st.cups.length) : 0;
      return { score: st.quit ? 0 : avg, cups: st.cups.length, quit: !!st.quit, big: st.quit ? '☕' : `${avg}점`, text: st.quit ? '중간에 그만뒀어요' : `${st.cups.map((c, i) => `${i + 1}잔 ${c}점`).join(' · ')}${avg >= 90 ? '<br>🎉 바리스타 대회 나가도 되겠어요!' : avg >= 65 ? '<br>손님이 사진을 찍어 갔다!' : '<br>맛은 좋다… 아마도.'}` };
    },
  });
}

/* =====================================================================
   🪨 물수제비 — 각도 · 힘을 맞춰 던져요 (세 번 던지기)
   ===================================================================== */
function mgSkip(vsDet) {
  return mgRun({
    icon: '🪨', title: '물수제비', hint: '움직이는 바늘을 눌러 각도 → 힘을 정해요', time: 0, keepUpdating: true,
    rules: ['첫 번째 누르기: 각도 (초록 칸이 좋아요)', '두 번째 누르기: 힘 (가득 찰수록 멀리)', vsDet ? `세 번 던져서 ${josa(himCall(), '과', '와')} 가장 많이 튄 횟수로 내기!` : '세 번 던져서 가장 많이 튄 횟수가 기록이에요'],
    init(st) { st.th = 0; st.res = []; st.step = 'angle'; st.ang = 0; st.pow = 0; st.k = 0; st.stone = null; st.vsDet = vsDet; },
    update(st, dt) {
      st.k += dt;
      if (st.step === 'angle') st.ang = 45 * (0.5 - 0.5 * Math.cos(st.k * 2.4));
      if (st.step === 'power') st.pow = 0.5 - 0.5 * Math.cos(st.k * 3.1);
      if (st.step === 'fly' && st.stone) {
        const s = st.stone; s.t += dt;
        if (s.i < s.hops.length && s.t >= s.hops[s.i].t) { const h = s.hops[s.i]; s.rip.push({ x: h.x, y: h.y, r: 2 }); mgTone(76 + s.i * 2, 0.08, 'sine', 0.08); s.i++; }
        for (const r of s.rip) r.r += dt * 26;
        if (s.t > s.endT) { st.res.push(s.n); mgPop(st, s.n ? `${s.n}번 통통!` : '퐁당…', MG_W / 2, 120, s.n >= 8 ? '#fff36b' : '#fff', 20); if (!s.n) Sound.sfx('splash'); st.step = 'wait'; st.wt = 1.1; }
      }
      if (st.step === 'wait') { st.wt -= dt; if (st.wt <= 0) { st.th++; st.stone = null; if (st.th >= 3) { st.step = 'over'; st.end(); } else { st.step = 'angle'; st.k = 0; } } }
      st.hud(`${Math.min(3, st.th + 1)}/3번째 · 최고 ${Math.max(0, ...st.res)}번`);
    },
    down(st) {
      if (st.step === 'angle') { st.step = 'power'; st.k = 0; mgTone(67, 0.08); return; }
      if (st.step === 'power') {
        mgTone(72, 0.08);
        const a = st.ang, p = st.pow, good = Math.max(0, 1 - Math.abs(a - 17) / 20);
        let n = a > 36 ? 0 : Math.round(good * (2 + p * 11) + (Math.random() - 0.5) * 1.6); n = Math.max(0, Math.min(14, n));
        if (a < 4) n = Math.min(n, 2);
        const hops = []; let x = 70, gap = 26 + p * 30, t = 0.35;
        for (let i = 0; i < n; i++) { x += gap; gap *= 0.86; t += 0.22 * Math.pow(0.9, i); hops.push({ x: Math.min(MG_W - 10, x), y: 250 - i * 6, t }); }
        st.stone = { n, hops, i: 0, t: 0, rip: [], endT: t + 0.6 }; st.step = 'fly';
      }
    },
    draw(g, st) {
      mgBg(g, '#ffd9b0', '#9fd7ef'); g.fillStyle = '#5fb0dc'; g.fillRect(0, 180, MG_W, 170); g.fillStyle = '#7fc4e8'; for (let i = 0; i < 8; i++) g.fillRect((i * 47 + st.k * 15) % MG_W, 200 + i * 18, 26, 2);
      g.fillStyle = '#f1dcae'; g.fillRect(0, 330, MG_W, 70); mgCircle(g, 260, 120, 26, '#ffefb0');
      // 돌 날아가기
      if (st.stone) { const s = st.stone; for (const r of s.rip) { g.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.9 - r.r / 40)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2); g.stroke(); }
        const prev = s.i ? s.hops[s.i - 1] : { x: 60, y: 300, t: 0 }, nx = s.i < s.hops.length ? s.hops[s.i] : { x: prev.x + 24, y: prev.y + 6, t: s.endT - 0.3 }, k = Math.max(0, Math.min(1, (s.t - prev.t) / Math.max(0.05, nx.t - prev.t)));
        if (s.t < s.endT - 0.25) mgCircle(g, prev.x + (nx.x - prev.x) * k, prev.y + (nx.y - prev.y) * k - Math.sin(k * Math.PI) * 18, 5, '#7a7e88'); }
      // 각도 · 힘 표시
      if (st.step === 'angle' || st.step === 'power') {
        const ox = 60, oy = 300; g.fillStyle = 'rgba(90,200,120,0.45)'; g.beginPath(); g.moveTo(ox, oy); g.arc(ox, oy, 70, -(25 * Math.PI / 180), -(10 * Math.PI / 180)); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(58,42,38,0.4)'; g.lineWidth = 2; g.beginPath(); g.arc(ox, oy, 70, -Math.PI / 4, 0); g.stroke();
        const ar = st.ang * Math.PI / 180; g.strokeStyle = '#3a2a26'; g.lineWidth = 4; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(ar) * 74, oy - Math.sin(ar) * 74); g.stroke();
        mgText(g, `${Math.round(st.ang)}°`, ox + 82, oy - 36, 14, '#3a2a26');
        if (st.step === 'power') { mgRR(g, 170, 290, 130, 20, 8, '#3a2a26'); mgRR(g, 173, 293, 124 * st.pow, 14, 6, st.pow > 0.8 ? '#ff7a6a' : '#ffd34d'); mgText(g, '힘', 160, 300, 14, '#3a2a26', 'right'); }
        mgText(g, st.step === 'angle' ? '① 각도를 정해요 — 눌러요!' : '② 힘을 정해요 — 눌러요!', MG_W / 2, 50, 16, '#3a2a26', 'center');
        mgCircle(g, ox, oy, 6, '#7a7e88');
      }
      mgText(g, st.res.map(n => `🪨${n}`).join('  '), 14, 30, 14, '#3a2a26');
    },
    result(st) {
      const best = Math.max(0, ...st.res), det = st.vsDet ? Math.max(1, Math.min(12, Math.round(3 + Math.random() * 6 + (S.rel.stage >= 5 ? -1 : 0)))) : 0;
      const win = st.vsDet ? best > det ? 'win' : best === det ? 'draw' : 'lose' : null;
      return { best, det, win, quit: !!st.quit, big: `최고 ${best}번`, text: st.quit ? '중간에 그만뒀어요' : `${st.res.map((n, i) => `${i + 1}번째 ${n}번`).join(' · ')}${st.vsDet ? `<br>${himCall()}: ${det}번 → ${win === 'win' ? '🎉 내가 이겼다!' : win === 'draw' ? '무승부!' : '아깝게 졌다…'}` : best >= 10 ? '<br>🎉 물수제비 달인!' : ''}` };
    },
  });
}

/* =====================================================================
   🎣 낚시 줄 버티기 — 꾹 누르면 초록 칸이 올라가요. 물고기를 칸 안에!
   ===================================================================== */
function mgFish(diff, fishName) {
  return mgRun({
    icon: '🎣', title: '입질이다!', hint: '꾹 누르면 초록 칸이 올라가고, 떼면 내려가요', time: 25,
    rules: ['꾹 누르면 초록 칸이 위로, 떼면 아래로 내려가요', '물고기 🐟가 초록 칸 안에 있으면 오른쪽 막대가 차요', '막대를 끝까지 채우면 낚았다! 비면 놓쳐요'],
    init(st) { st.zy = 220; st.zv = 0; st.zh = Math.round(92 - diff * 16); st.fy = 200; st.ft = 200; st.fv = 0; st.prog = 0.3; st.diff = diff; st.fishT = 0; st.ok = null; },
    update(st, dt) {
      const top = 50, bot = 370;
      st.zv += (st.hold ? -560 : 440) * dt; st.zv *= Math.pow(0.1, dt); st.zy += st.zv * dt;
      if (st.zy < top) { st.zy = top; st.zv = Math.max(0, st.zv) * 0.2; } if (st.zy + st.zh > bot) { st.zy = bot - st.zh; st.zv = Math.min(0, st.zv) * -0.25; }
      st.fishT -= dt; if (st.fishT <= 0) { st.fishT = (0.5 + Math.random() * 1.1) / (0.6 + st.diff * 0.4) * 1.2; st.ft = top + 12 + Math.random() * (bot - top - 24); }
      st.fv += (st.ft - st.fy) * dt * (1.6 + st.diff * 1.2); st.fv *= Math.pow(0.05, dt); st.fy += st.fv * dt;
      st.fy = Math.max(top + 10, Math.min(bot - 10, st.fy));
      const inZone = st.fy > st.zy && st.fy < st.zy + st.zh; st.inZone = inZone;
      st.prog += (inZone ? 0.34 : -0.15 - st.diff * 0.03) * dt;
      if (st.prog >= 1) { st.prog = 1; st.ok = true; mgTone(84, 0.3); st.end(); }
      if (st.prog <= 0) { st.prog = 0; st.ok = false; Sound.sfx('splash'); st.end(); }
      st.hud(inZone ? '좋아요, 버텨요!' : '물고기를 칸 안으로!');
    },
    draw(g, st) {
      mgBg(g, '#7fc4e8', '#2f6fa8'); for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect((i * 61 + st.t * 20) % MG_W, 40 + i * 34, 20, 2); }
      mgRR(g, 120, 46, 64, 328, 12, '#3a2a26'); mgRR(g, 124, 50, 56, 320, 10, '#1f4f78');
      mgRR(g, 126, st.zy, 52, st.zh, 8, st.inZone ? 'rgba(130,240,150,0.85)' : 'rgba(130,220,150,0.55)');
      mgText(g, '🐟', 152, st.fy, 24, '#fff', 'center');
      mgRR(g, 206, 46, 26, 328, 10, '#3a2a26'); mgRR(g, 210, 50 + 320 * (1 - st.prog), 18, 320 * st.prog, 7, st.prog > 0.7 ? '#7be08e' : st.prog > 0.3 ? '#ffd34d' : '#ff7a6a');
      mgText(g, '🎣', 76, 90, 34, '#fff', 'center'); g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.moveTo(88, 76); g.lineTo(150, st.fy); g.stroke();
      mgText(g, st.diff >= 1.9 ? '대물이다!' : st.diff >= 1.4 ? '묵직해요' : '', 70, 140, 14, '#fff36b', 'center', true);
    },
    result(st) { const ok = !st.quit && st.ok === true; return { ok, quit: !!st.quit, big: ok ? '🐟 낚았다!' : '💦 놓쳤다', text: ok ? '줄을 끝까지 버텼어요!' : st.quit ? '줄을 놓았어요' : '물고기가 도망갔어요…' }; },
  });
}

/* =====================================================================
   게임 속에 연결
   ===================================================================== */
/* 🎤 노래방 무대 */
const _interiorActionMG = interiorAction;
interiorAction = function (act) {
  if (act !== 'karaoke') return _interiorActionMG(act);
  runEvent(async () => {
    const P = G.player, r = S.rel, withDet = mgDetHere(5);
    await say('narr', '', '🎤 마이크를 잡았다. 반주가 흘러나온다.'); closeDialog();
    const res = await mgKaraoke(withDet); if (!res || res.quit) { await say('narr', '', '…다음에 다시 불러야지.'); return; }
    burst(P, 'note', 6); Sound.sfx('bell');
    const rec = mgBest('karaoke', res.score);
    await say('narr', '', `「${res.song}」 ${res.score}점!${rec ? ' — 🏆 내 최고 기록!' : ''}`);
    if (res.score >= 90 && !mgDaily('karaokePrize')) { mgDailyAdd('karaokePrize'); S.inv.snack = (S.inv.snack || 0) + 1; await say('chief', 'laugh', '허허, 가수 났네 가수 났어! 이거 상품이야, 강정 하나 받아!'); }
    if (withDet) {
      const lines = res.score >= 90 ? ['…와. 진짜 잘 부르네요. 반했어요. 원래 반했지만.', '화음 넣다가 제가 박자 놓칠 뻔했어요. 너무 잘해서요.'] : res.score >= 70 ? ['듀엣 해요. 다음 곡은 제가 고를게요.', '박자 딱딱 맞던데요? 같이 부르니까 좋다.'] : ['괜찮아요, 노래방은 즐거우면 100점이에요.', '제가 더 못 불렀어요. 그러니까 비긴 걸로 해요.'];
      await say('det', res.score >= 70 ? 'laugh' : 'smile', pick(lines));
      if (!r.daily.karaoke) { r.daily.karaoke = true; addAff(res.score >= 80 ? 3 : 2); }
      if (!r.flags.karaoke) { r.flags.karaoke = true; await addAlbum('노래방 듀엣', 'karaoke'); }
    }
    advanceTime(20);
  });
};

/* 🍊 귤 받기: 수확철엔 귤나무에서, 그 밖엔 귤밭 「하우스 귤 따기 체험」 */
function orangeGameReward(res, cap, label) {
  if (!res || res.quit) return 0;
  const n = Math.max(res.caught > 0 ? 1 : 0, Math.min(cap, Math.round(res.caught / 5)));
  S.inv.tangerine = (S.inv.tangerine || 0) + n; mgBest('orange', res.caught);
  return n;
}
const _orangeActionMG = orangeAction;
orangeAction = function (o) {
  const se = season(), c = calendar(S.day);
  if (!(se === 'winter' || c.month === 11) || S.rel.daily.oranges >= 5) return _orangeActionMG(o);
  runEvent(async () => {
    const withDet = mgDetHere(5);
    await say('narr', '', withDet ? `🍊 귤이 주렁주렁. ${josa(himCall(), '이', '가')} 나무를 흔들어 준대요. 바구니를 들고…` : '🍊 귤이 주렁주렁. 바구니를 들고 나무 아래에 섰다.'); closeDialog();
    const res = await mgOrange(withDet), n = orangeGameReward(res, 5 - S.rel.daily.oranges);
    if (!n) { await say('narr', '', '…오늘은 그냥 구경만 하자.'); return; }
    S.rel.daily.oranges += n; burst(G.player, 'spark', 4);
    await say('narr', '', `🍊 귤을 ${res.caught}개 받아서 좋은 걸로 ${n}개를 챙겼다.`);
    if (withDet) { await say('det', 'laugh', res.caught >= 18 ? '바구니 잡는 솜씨가 형사급인데요? 범인도 그렇게 잡으면 되겠다.' : '하나 까 줄게요. 아~ 해요.'); if (!S.rel.daily.orangeGame) { S.rel.daily.orangeGame = true; addAff(2); } }
    advanceTime(20);
  });
};
function orangeOffSeason() {
  runEvent(async () => {
    if (mgDaily('orangeHouse') >= 2) { await say('narr', '', '하우스 귤 체험은 하루 두 번까지래요. 내일 또 와요!'); return; }
    const withDet = mgDetHere(5);
    await say('narr', '', '🍊 귤 농가 할아버지: "하우스 귤 따기 체험 해 볼텨? 바구니만 잘 들면 돼!"'); closeDialog();
    const res = await mgOrange(withDet); mgDailyAdd('orangeHouse');
    const n = orangeGameReward(res, 3);
    if (!n) { await say('narr', '', '…다음에 다시 해 보자.'); return; }
    await say('narr', '', `🍊 하우스 귤 ${n}개를 얻었다! (받은 귤 ${res.caught}개)`);
    if (withDet && !S.rel.daily.orangeGame) { S.rel.daily.orangeGame = true; addAff(2); await say('det', 'smile', '귤 받는 거 보니까 운동회 생각나요. 같이 하니까 재밌다.'); }
    advanceTime(20);
  });
}

/* ☕ 라떼 아트 (카페 안) */
function latteGame() {
  runEvent(async () => {
    const isJob = S.job === 'cafe', withDet = mgDetHere(5);
    if (!isJob && mgDaily('latte') >= 2) { await say('narr', '', '오늘 라떼 아트 체험은 끝났대요. 내일 또 와요!'); return; }
    if (isJob && mgDaily('latte') >= 3) { await say('narr', '', '오늘은 우유가 다 떨어졌다. 내일 다시 손님을 받자.'); return; }
    await say('narr', '', isJob ? '☕ 주문이 들어왔다. 에스프레소를 내리고 우유를 데운다.' : '☕ 카페 사장님: "라떼 아트 해 볼래요? 우유 붓는 게 반이에요."'); closeDialog();
    const res = await mgLatte(isJob); if (!res || res.quit || !res.cups) { await say('narr', '', '…다음에 다시 해 보자.'); return; }
    mgDailyAdd('latte'); const rec = mgBest('latte', res.score);
    if (isJob) { const tip = Math.round(res.score * 45 / 100) * 100; S.money += tip; S.jobExp = (S.jobExp || 0) + 1; Sound.sfx('coin'); await say('narr', '', `손님들이 라떼 사진을 찍어 갔다. 팁 ${fmtMoney(tip)}!${rec ? ' — 🏆 최고 점수!' : ''}`); }
    else await say('narr', '', `내가 만든 라떼 세 잔, 평균 ${res.score}점!${rec ? ' — 🏆 최고 점수!' : ''}`);
    if (withDet) {
      await say('det', res.score >= 70 ? 'blush' : 'laugh', res.score >= 70 ? pick(['이거 제 거예요? 아까워서 못 마시겠다.', '하트 맞죠? …저한테 주는 하트로 알게요.']) : pick(['맛은 최고예요. 모양은… 추상화로 할게요.', '이건 곰이에요, 강아지예요? 아무튼 귀여워요.']));
      if (!S.rel.daily.latte) { S.rel.daily.latte = true; addAff(2); }
      if (!S.rel.flags.latteArt) { S.rel.flags.latteArt = true; await addAlbum('라떼 아트 선물', 'cafe'); }
    }
    advanceTime(20);
  });
}

/* 🪨 물수제비 (해변 · 산책로 · 해안) */
function skipGame() {
  runEvent(async () => {
    const vs = mgDetHere(6) && S.rel.stage >= 2;
    await say('narr', '', vs ? `🪨 납작한 돌을 골랐다. ${josa(himCall(), '이', '가')} 소매를 걷는다. "내기할까요?"` : '🪨 납작하고 동그란 돌을 하나 골랐다.'); closeDialog();
    const res = await mgSkip(vs); if (!res || res.quit) { await say('narr', '', '…돌은 주머니에 넣어 두자.'); return; }
    const rec = mgBest('skip', res.best);
    await say('narr', '', `🪨 최고 ${res.best}번 튀었다!${rec ? ' — 🏆 내 최고 기록!' : ''}`);
    if (vs) {
      const L = { win: ['…졌어요. 소원 하나 들어줄게요. 뭐든요.', '이 섬에서 저 이긴 사람 처음이에요. 인정.'], draw: ['비겼다. 한 판 더? 아니다, 이대로가 좋아요.', '똑같네요. 우리 꽤 잘 맞는다.'], lose: ['제가 이겼네요. 벌칙은… 내일 같이 산책하기.', '돌 고르는 법 알려 줄게요. 손 이리 줘 봐요.'] }[res.win];
      await say('det', res.win === 'lose' ? 'tease' : 'laugh', pick(L));
      if (!S.rel.daily.skip) { S.rel.daily.skip = true; addAff(res.win === 'win' ? 3 : 2); }
      if (!S.rel.flags.skipDuel) { S.rel.flags.skipDuel = true; await addAlbum('물수제비 내기', 'walk'); }
    } else if (res.best >= 8) await say('narr', '', '지나가던 아이들이 "우와!" 하고 박수를 쳤다.');
    advanceTime(10);
  });
}
PLACE_ACTS.beach.unshift({ icon: '🪨', label: '물수제비', ui: true, run: skipGame });
PLACE_ACTS.cafe.unshift({ icon: '☕', get label() { return S && S.job === 'cafe' ? '라떼 아트' : '라떼 아트 체험'; }, ui: true, cond: () => M.id === 'in_cafe', run: latteGame });
PLACE_ACTS.orchard.unshift({ icon: '🍊', label: '귤 받기 체험', ui: true, cond: () => { const c = calendar(S.day); return !(season() === 'winter' || c.month === 11); }, run: orangeOffSeason });

/* 🎣 낚시: 입질 → 줄 버티기 (물고기 크기 · 희귀도에 따라 어려워짐). 보상 · 도감 · 퀘스트는 그대로 */
let _mgFishPre = null;
const _rollFishMG = rollFish;
rollFish = function (spot) { if (_mgFishPre) { const r = _mgFishPre; _mgFishPre = null; return r; } return _rollFishMG(spot); };
fishMinigame = function (spot) {
  return new Promise(async (res) => {
    G.fishing = { bite: false, res, done: false, spot };
    setAction({ label: '기다리는 중…', icon: '🎣' }, true);
    await sleep(rand(1600, 3800));
    if (!G.fishing) return;
    G.fishing.bite = true; G.player.emo('❗', 1.3); Sound.sfx('splash');
    setAction({ label: '입질이다!', icon: '❗', hot: true }, true);
    await sleep(450);
    const f = G.fishing; if (!f || f.done) return;
    const r = _rollFishMG(spot), F = r.id && FISH[r.id];
    const diff = !F ? 0.8 : F.rare ? 2.2 : 1 + Math.max(0, Math.min(1, (r.size - F.min) / Math.max(1, F.max - F.min))) * 0.8;
    const g = await mgFish(diff, F ? F.name : '');
    if (!G.fishing || G.fishing !== f) return;
    _mgFishPre = g && g.ok ? r : null;
    await endFish(!!(g && g.ok));
    _mgFishPre = null;
  });
};
/* 미니게임 중엔 화면 누르기 · 시간 멈춤 */
const _onTapMG = onTap;
onTap = function (px, py) { if (G.mgOn) return; return _onTapMG(px, py); };
