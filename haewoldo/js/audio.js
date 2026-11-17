'use strict';
/* =========================================================
 *  잔잔한 배경음악 + 아주 작은 파도 소리 (Web Audio로 직접 연주)
 * ========================================================= */
const Sound = {
  ctx: null, on: { music: true, sfx: true }, started: false,
  mood: 'day', season: 'summer', coast: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.on.music ? 0.22 : 0; this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.on.sfx ? 0.35 : 0; this.sfxBus.connect(this.master);
    // 부드럽게 만드는 저역 필터 + 간단한 잔향
    this.tone = c.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 2600; this.tone.connect(this.musicBus);
    const dl = c.createDelay(); dl.delayTime.value = 0.32; const fb = c.createGain(); fb.gain.value = 0.28; const wet = c.createGain(); wet.gain.value = 0.25;
    this.tone.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(this.musicBus);
    // 파도: 갈색 소음 → 저역 필터 → 느린 숨결
    const len = c.sampleRate * 4, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    this.wave = c.createGain(); this.wave.gain.value = 0;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.085; const lfoG = this.lfoG = c.createGain(); lfoG.gain.value = 0;
    lfo.connect(lfoG); lfoG.connect(this.wave.gain); lfo.start();
    src.connect(lp); lp.connect(this.wave); this.wave.connect(this.master); src.start();
    this.beat = 0; this.next = c.currentTime + 0.2; this.bar = 0;
    setInterval(() => this.tick(), 60);
    this.started = true;
  },
  setOn(kind, v) {
    this.on[kind] = v;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (kind === 'music') this.musicBus.gain.setTargetAtTime(v ? 0.22 : 0, t, 0.3);
    if (kind === 'sfx') this.sfxBus.gain.setTargetAtTime(v ? 0.35 : 0, t, 0.1);
  },
  update(mood, season, coast) {
    this.mood = mood; this.season = season; this.coast = coast;
    if (!this.ctx) return;
    const base = this.on.sfx ? 0.008 + 0.022 * coast : 0;
    this.wave.gain.setTargetAtTime(base, this.ctx.currentTime, 1.5); this.lfoG.gain.setTargetAtTime(base * 0.55, this.ctx.currentTime, 1.5);
  },
  /* 화성 (도 단위 반음) */
  PROG: { day: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], evening: [[9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]], night: [[2, 5, 9], [10, 14, 17], [5, 9, 12], [0, 4, 7]] },
  tick() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const bpm = this.mood === 'night' ? 58 : this.mood === 'evening' ? 64 : 72, spb = 60 / bpm / 2; // 8분음표
    while (this.next < c.currentTime + 0.25) { this.play(this.next, spb); this.next += spb; this.beat++; }
  },
  play(t, spb) {
    const step = this.beat % 8, bar = Math.floor(this.beat / 8), prog = this.PROG[this.mood] || this.PROG.day;
    const chord = prog[bar % 4], root = 53; // F3 근처
    if (step === 0) {
      for (const n of chord) this.pad(t, root + n, spb * 8);
      this.note(t, root - 12 + chord[0], spb * 6, 'sine', 0.09, 0.02, 1.4);
    }
    // 선율: 마디마다 패턴을 기억했다가 A A B A 로 반복
    if (!this.motifs) this.motifs = {};
    const sec = bar % 4 === 2 ? 'B' : 'A', key = this.mood + sec;
    if (!this.motifs[key] || (bar % 16 === 0 && step === 0)) {
      const sparse = this.mood === 'night' ? 0.35 : 0.55;
      this.motifs[key] = Array.from({ length: 8 }, (_, i) => (i === 0 || Math.random() < sparse) ? Math.floor(Math.random() * 5) : -1);
    }
    const deg = this.motifs[key][step];
    if (deg >= 0) {
      const penta = [0, 2, 4, 7, 9];
      const n = root + 12 + penta[(deg + chord[0] % 5) % 5] + (deg > 3 ? 12 : 0);
      const s = this.season;
      if (s === 'summer') this.note(t, n, spb * 1.6, 'triangle', 0.07, 0.005, 0.5);           // 우쿨렐레 느낌
      else if (s === 'autumn') this.note(t, n, spb * 2.5, 'sine', 0.07, 0.06, 1.2, true);      // 플루트 느낌
      else if (s === 'winter') { this.note(t, n + 12, spb * 3, 'sine', 0.05, 0.003, 1.8); this.note(t, n + 24, spb * 2, 'sine', 0.015, 0.003, 1.2); } // 오르골
      else this.note(t, n, spb * 1.2, 'sine', 0.08, 0.003, 0.7, false, true);                  // 마림바 느낌
    }
  },
  pad(t, midi, dur) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.028, t + dur * 0.3); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(this.tone); o.start(t); o.stop(t + dur + 0.05);
  },
  note(t, midi, dur, type, vol, att, rel, vibrato, harm) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    if (vibrato) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5; lg.gain.value = 3; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + rel); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0008, t + dur + rel);
    o.connect(g); g.connect(this.tone); o.start(t); o.stop(t + dur + rel + 0.05);
    if (harm) { const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'sine'; o2.frequency.value = o.frequency.value * 4; g2.gain.setValueAtTime(vol * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.25); o2.connect(g2); g2.connect(this.tone); o2.start(t); o2.stop(t + 0.3); }
  },
  sfx(kind) {
    const c = this.ctx; if (!c || !this.on.sfx || c.state !== 'running') return;
    const t = c.currentTime;
    const blip = (f, d, type = 'sine', v = 0.25, at = 0) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t + at); g.gain.setValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(0.001, t + at + d); o.connect(g); g.connect(this.sfxBus); o.start(t + at); o.stop(t + at + d + 0.02); return o; };
    if (kind === 'tap') blip(880, 0.06, 'sine', 0.12);
    else if (kind === 'heart') { blip(1046, 0.25, 'sine', 0.18); blip(1318, 0.3, 'sine', 0.14, 0.08); }
    else if (kind === 'coin') { blip(988, 0.08, 'square', 0.06); blip(1318, 0.2, 'square', 0.06, 0.07); }
    else if (kind === 'meow') { const o = blip(700, 0.35, 'triangle', 0.12); o.frequency.exponentialRampToValueAtTime(420, t + 0.3); }
    else if (kind === 'woof') { const o = blip(260, 0.12, 'sawtooth', 0.08); o.frequency.exponentialRampToValueAtTime(160, t + 0.1); blip(240, 0.1, 'sawtooth', 0.06, 0.16); }
    else if (kind === 'splash') { const o = blip(300, 0.3, 'triangle', 0.1); o.frequency.exponentialRampToValueAtTime(90, t + 0.3); }
    else if (kind === 'kiss') { const o = blip(1500, 0.08, 'sine', 0.18); o.frequency.exponentialRampToValueAtTime(2400, t + 0.07); }
    else if (kind === 'firework') { const o = blip(120, 0.5, 'triangle', 0.12); o.frequency.exponentialRampToValueAtTime(60, t + 0.5); }
    else if (kind === 'bell') { blip(1568, 0.8, 'sine', 0.12); blip(2093, 0.6, 'sine', 0.06, 0.02); }
  },
};
