// 공용 유틸리티 — 전역 네임스페이스 PX
'use strict';
window.PX = window.PX || {};

PX.U = (() => {
  // 결정적 난수 (시드 고정): 날씨, 맵 장식 배치 등
  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = (typeof seed === 'string' ? hash(seed) : seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  const rand = Math.random;
  const pick = (arr, r = rand) => arr[Math.floor(r() * arr.length)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;

  // 색 보정
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  }
  function shade(hex, f) { // f>0 밝게, f<0 어둡게 (-1..1)
    const [r, g, b] = hexToRgb(hex);
    if (f >= 0) return rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
    return rgbToHex(r * (1 + f), g * (1 + f), b * (1 + f));
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
  }

  // 한국어 조사 처리
  function hasBatchim(word) {
    if (!word) return false;
    const ch = word.charCodeAt(word.length - 1);
    if (ch < 0xac00 || ch > 0xd7a3) return /[013678lmnr]$/i.test(word); // 숫자·영문 근사
    return (ch - 0xac00) % 28 !== 0;
  }
  function isRieul(word) {
    const ch = word.charCodeAt(word.length - 1);
    return ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 === 8;
  }
  function josa(word, type) {
    const b = hasBatchim(word);
    switch (type) {
      case '이': return word + (b ? '이' : '가');
      case '은': return word + (b ? '은' : '는');
      case '을': return word + (b ? '을' : '를');
      case '와': return word + (b ? '과' : '와');
      case '아': return word + (b ? '아' : '야');
      case '이랑': return word + (b ? '이랑' : '랑');
      case '으로': return word + (b && !isRieul(word) ? '으로' : '로');
      case '이야': return word + (b ? '이야' : '야');
      case '님': return word + '님';
      default: return word;
    }
  }
  // 성 빼고 이름만 (세 글자 한글 이름이면 뒤 두 글자) — 대위가 부를 때 사용
  function givenName(name) {
    if (/^[가-힣]{3}$/.test(name)) return name.slice(1);
    return name;
  }

  // 대사 치환: {p} {p아} {c} {c이} ... [[a|b|c]] 무작위
  function fmt(text, ctx) {
    let t = text.replace(/\[\[([^\]]+)\]\]/g, (_, body) => pick(body.split('|')));
    t = t.replace(/\{(pf|p|cg|c|rival)(이|은|을|와|아|이랑|으로|이야|님)?\}/g, (_, who, j) => {
      const w = who === 'p' ? givenName(ctx.p) : who === 'pf' ? ctx.p : who === 'cg' ? givenName(ctx.c) : who === 'c' ? ctx.c : (ctx.rival || '그 사람');
      return j ? josa(w, j) : w;
    });
    return t;
  }

  const pad2 = n => String(n).padStart(2, '0');
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  return { hash, rng, rand, pick, clamp, lerp, shade, mix, hexToRgb, rgbToHex, josa, hasBatchim, givenName, fmt, pad2, el, sleep, dist };
})();
