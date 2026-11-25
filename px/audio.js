/* =========================================================================
   보장원 도트 — 8비트 배경음악 (구역마다 다른 곡) · 효과음
   모두 실시간 합성 (음원 파일 없음)
   ========================================================================= */
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SCALES = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10] };
// 곡: 으뜸음 · 음계 · 빠르기 · 화음 진행(음계 도수) · 드럼 · 리드 소리
const SONGS = {
  office: { root: 60, scale: 'maj', bpm: 108, prog: [0, 5, 3, 4], drums: 1, lead: 'square', vol: 0.9 },
  lounge: { root: 65, scale: 'maj', bpm: 96, prog: [0, 2, 3, 4], drums: 1, lead: 'square', vol: 0.85, swing: 0.12 },
  nap: { root: 57, scale: 'min', bpm: 64, prog: [0, 5, 2, 6], drums: 0, lead: 'triangle', vol: 0.75 },
  vent: { root: 62, scale: 'min', bpm: 84, prog: [0, 5, 2, 6], drums: 0.5, lead: 'triangle', vol: 0.85 },
  street: { root: 67, scale: 'maj', bpm: 116, prog: [0, 4, 5, 3], drums: 1, lead: 'square', vol: 0.85 },
  food: { root: 62, scale: 'maj', bpm: 124, prog: [0, 3, 4, 0], drums: 1, lead: 'square', vol: 0.85, swing: 0.1 },
};
const h = (a, b) => { let x = (a * 374761393 + b * 668265263) | 0; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

export const audio = {
  ctx: null, on: true, zone: 'street', next: 'street', step: 0, t: 0, timer: null,
  start() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(ctx.destination);
    this.mus = ctx.createGain(); this.mus.gain.value = this.on ? 0.17 : 0; this.mus.connect(this.master);
    this.fx = ctx.createGain(); this.fx.gain.value = 0.55; this.fx.connect(this.master);
    // 사각파 (듀티 25%) — 옛날 게임기 소리
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    this.pulse = ctx.createPeriodicWave(re, im);
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.t = ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 40);
  },
  toggle(v) { this.on = v; if (this.mus) this.mus.gain.setTargetAtTime(v ? 0.17 : 0, this.ctx.currentTime, 0.2); },
  setZone(z) { if (SONGS[z]) this.next = z; },
  tick() {
    const ctx = this.ctx; if (!ctx || ctx.state !== 'running') return;
    while (this.t < ctx.currentTime + 0.25) {
      if (this.step % 64 === 0 && this.next !== this.zone) this.zone = this.next; // 4마디마다 곡 바꾸기
      const S = SONGS[this.zone];
      const sp = 60 / S.bpm / 4;
      if (this.on) this.playStep(S, this.step, this.t + (S.swing && this.step % 2 ? sp * S.swing : 0));
      this.t += sp; this.step++;
    }
  },
  note(type, f, t, dur, vol, out = this.mus) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    if (type === 'pulse') o.setPeriodicWave(this.pulse); else o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
    return o;
  },
  hit(t, dur, freq, vol, type = 'highpass', out = this.mus) {
    const ctx = this.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5, dur + 0.05);
  },
  playStep(S, step, t) {
    const sc = SCALES[S.scale], bar = Math.floor(step / 16) % S.prog.length, st = step % 16;
    const deg = S.prog[bar];
    const pitch = (d, oct = 0) => S.root + sc[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
    const beat = 60 / S.bpm;
    // 베이스
    if (st % 4 === 0) this.note('triangle', mtof(pitch(deg, -2)), t, beat * 0.9, 0.5 * S.vol);
    if (S.drums && st % 8 === 6) this.note('triangle', mtof(pitch(deg + 4, -2)), t, beat * 0.4, 0.35 * S.vol);
    // 화음 펼치기
    if (st % 2 === 0) { const arp = [0, 2, 4, 2][(st / 2) % 4]; this.note('pulse', mtof(pitch(deg + arp, 0)), t, beat * 0.35, 0.1 * S.vol); }
    // 멜로디 (4마디 주기로 같은 가락)
    const seed = Math.floor(step / 64) % 2;
    if (h(st + bar * 16, seed) < (S.drums ? 0.42 : 0.3) && st % 2 === 0) {
      const m = [0, 2, 4, 5, 4, 2, 7, 4][Math.floor(h(st, bar + seed * 9) * 8)];
      this.note(S.lead === 'square' ? 'square' : 'triangle', mtof(pitch(deg + m, 1)), t, beat * (h(st, 3) < 0.3 ? 0.9 : 0.45), (S.lead === 'square' ? 0.07 : 0.16) * S.vol);
    }
    // 드럼
    if (S.drums) {
      if (st % 8 === 0) { const o = this.note('sine', 120, t, 0.18, 0.7 * S.drums * S.vol); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); }
      if (st % 8 === 4) this.hit(t, 0.12, 1800, 0.22 * S.drums * S.vol, 'bandpass');
      if (st % 2 === 1) this.hit(t, 0.03, 7000, 0.08 * S.drums * S.vol);
    }
  },
  /* ---------- 효과음 ---------- */
  sfx(name, vol = 1, ...a) {
    if (!this.ctx || vol <= 0.02) return;
    const g = this.ctx.createGain(); g.gain.value = vol; g.connect(this.fx);
    const t = this.ctx.currentTime + 0.01;
    (SFX[name] || SFX.pop)(this, g, t, ...a);
  },
};
const SFX = {
  pop(A, out, t, p = 1) { const o = A.note('sine', 520 * p, t, 0.12, 0.6, out); o.frequency.exponentialRampToValueAtTime(900 * p, t + 0.06); },
  bubble(A, out, t) { for (let i = 0; i < 2; i++) { const o = A.note('sine', 600 + i * 300, t + i * 0.07, 0.1, 0.4, out); o.frequency.exponentialRampToValueAtTime(1100 + i * 300, t + i * 0.07 + 0.06); } },
  poke(A, out, t) { // 삐용~
    const o = A.note('square', 600, t, 0.42, 0.18, out);
    o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(1500, t + 0.14); o.frequency.exponentialRampToValueAtTime(800, t + 0.38);
  },
  paper(A, out, t) { A.hit(t, 0.18, 2600, 0.5, 'bandpass', out); A.hit(t + 0.12, 0.12, 3400, 0.35, 'bandpass', out); },
  brew(A, out, t) { for (let i = 0; i < 10; i++) A.hit(t + i * 0.08, 0.06, 900 + (i % 3) * 300, 0.3, 'bandpass', out); A.note('square', 1320, t + 1.0, 0.25, 0.12, out); A.note('square', 1760, t + 1.12, 0.3, 0.1, out); },
  crunch(A, out, t) { for (let b = 0; b < 3; b++) A.hit(t + b * 0.3, 0.09, 1500, 0.55, 'bandpass', out); },
  sip(A, out, t) { for (let i = 0; i < 4; i++) { const o = A.note('sine', 260 + i * 30, t + i * 0.08, 0.08, 0.35, out); o.frequency.exponentialRampToValueAtTime(420 + i * 30, t + i * 0.08 + 0.06); } },
  print(A, out, t, r) {
    A.note('square', 1500, t, 0.07, 0.12, out);
    if (r === 'ok') { for (let i = 0; i < 10; i++) A.note('square', 110 + (i % 2) * 20, t + 0.15 + i * 0.12, 0.1, 0.1, out); A.note('square', 1200, t + 1.5, 0.08, 0.12, out); A.note('square', 1600, t + 1.62, 0.12, 0.12, out); }
    else if (r === 'jam') { for (let i = 0; i < 4; i++) A.note('square', 110, t + 0.15 + i * 0.12, 0.1, 0.1, out); A.note('sawtooth', 80, t + 0.7, 0.4, 0.15, out); for (let i = 0; i < 6; i++) A.note('square', i % 2 ? 1150 : 1750, t + 1.1 + i * 0.22, 0.15, 0.12, out); }
    else { for (let i = 0; i < 24; i++) A.note('square', 110 + i * 4, t + 0.15 + i * 0.1, 0.09, 0.11, out); for (let i = 0; i < 8; i++) { const o = A.note('sine', 600, t + 0.4 + i * 0.3, 0.1, 0.25, out); o.frequency.exponentialRampToValueAtTime(1400, t + 0.46 + i * 0.3); } }
  },
  shred(A, out, t) { for (let i = 0; i < 16; i++) A.note('sawtooth', 70 + (i % 2) * 8, t + i * 0.1, 0.1, 0.18, out); A.hit(t, 1.6, 900, 0.18, 'lowpass', out); },
  whoosh(A, out, t) {
    const s = A.ctx.createBufferSource(), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    s.buffer = A.noise; f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3000, t + 0.5); f.frequency.exponentialRampToValueAtTime(500, t + 1.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.6, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, 0, 1.4);
  },
  hug(A, out, t) { [784, 988, 1175].forEach((f, i) => A.note('triangle', f, t + i * 0.09, 0.3, 0.3, out)); },
  ding(A, out, t) { A.note('square', 1320, t, 0.2, 0.12, out); A.note('square', 1760, t + 0.1, 0.3, 0.1, out); },
  ball(A, out, t) { A.note('square', 900, t, 0.04, 0.14, out); },
};
