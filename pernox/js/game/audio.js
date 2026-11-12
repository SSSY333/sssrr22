// 효과음 (WebAudio로 직접 합성, 파일 없음)
'use strict';
PX.Audio = (() => {
  let ac = null;
  const on = () => !PX.St.S || PX.St.S.settings.sound;
  function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function tone(freq, dur, type = 'square', vol = 0.04, slide = 0) {
    if (!on()) return; const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + dur + 0.02);
  }
  return {
    unlock: () => ctx(),
    blip: (p = 1) => tone(420 * p + Math.random() * 30, 0.05, 'square', 0.025),
    coin: () => { tone(880, 0.08, 'square', 0.03); setTimeout(() => tone(1320, 0.12, 'square', 0.03), 70); },
    door: () => tone(220, 0.15, 'triangle', 0.05, 0.6),
    heart: () => { tone(660, 0.1, 'sine', 0.05); setTimeout(() => tone(990, 0.16, 'sine', 0.05), 90); },
    thud: () => tone(120, 0.18, 'triangle', 0.08, 0.5),
    step: () => tone(90 + Math.random() * 20, 0.03, 'triangle', 0.015),
  };
})();
