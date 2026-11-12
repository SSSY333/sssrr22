// SD 도트 캐릭터 생성기 — 외형 데이터로 프레임을 직접 찍어 캐시한다
// 자세: idle walk sit lie wave hug hold pat carry work eat workout bend surprise bump
'use strict';
PX.S = (() => {
  const G = PX.G, { shade } = PX.U;
  const SKINS = ['#fde3cf', '#f6cba6', '#e2a77c', '#b97a52', '#8a5438'];
  const HAIRC = { '흑발': '#2a2433', '갈색': '#6b4430', '밝은 갈색': '#a0703f', '금발': '#e3bf6c', '붉은색': '#b8543a', '분홍': '#e78ab0', '은발': '#c9ccd6', '푸른색': '#4a6fb8' };
  const EYEC = { '검정': '#2a2030', '갈색': '#6b3d22', '파랑': '#3b6fd0', '초록': '#3a9a5a', '회색': '#707a88', '호박색': '#c9862a', '보라': '#8a5ad0' };
  const HAIRS = { pony: '포니테일', messybun: '앞머리 올림머리', short: '짧은 머리', crew: '스포츠 머리', bob: '단발', long: '긴 머리', bun: '올림머리', curly: '곱슬', wolf: '울프컷' };
  // 신체 비율
  const BODY = {
    n: { fw: 32, fh: 48, ax: 16, ay: 45, hw: 16, hh: 15, tw: 10, th: 8, aw: 2, lh: 8, lw: 4, gap: 2 },
    big: { fw: 44, fh: 60, ax: 22, ay: 57, hw: 15, hh: 16, tw: 18, th: 13, aw: 4, lh: 11, lw: 6, gap: 2 },
  };

  function critter(app, fr) {
    const c = G.canvas(20, 16), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    if (app.critter === 'lizard') { R(4, 10, 11, 4, '#b8543a'); R(13, 9, 5, 4, '#c4613f'); R(16, 10, 1, 1, '#1d1420'); R(1, 11 + (fr % 2), 4, 2, '#a04a35'); R(6, 13 + (fr % 2), 2, 2, '#8a3b30'); R(11, 13 + ((fr + 1) % 2), 2, 2, '#8a3b30'); }
    else { const b = fr % 2; R(5, 3 + b, 10, 6, 'rgba(160,230,255,0.85)'); R(7, 2 + b, 6, 2, 'rgba(220,250,255,0.9)'); for (let i = 0; i < 4; i++) R(6 + i * 2, 9 + b, 1, 4 + ((i + fr) % 2), 'rgba(160,230,255,0.7)'); R(8, 5 + b, 1, 1, '#ffffff'); }
    G.outline(c, '#20172a');
    return { c, ax: 10, ay: 15, headY: 2, B: BODY.n };
  }
  function frame(app, pose = 'idle', fr = 0, view = 'F', face = 'normal') {
    if (app.critter) return critter(app, fr);
    const B = BODY[app.big ? 'big' : 'n'];
    const c = G.canvas(B.fw, B.fh), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { if (w > 0 && h > 0) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); } };
    const skin = app.skin, top = app.top, bot = app.bottom, shoe = app.shoe || '#3a3340';
    const hair = app.hairColor;
    const cx = B.ax;
    let footY = B.ay;
    const sit = pose === 'sit' || pose === 'eat';
    const walk = pose === 'walk' || pose === 'walkhold' || pose === 'walkholdL';
    const phase = walk ? [0, 1, 0, -1][fr % 4] : 0;
    const bob = walk ? (fr % 2) : (pose === 'idle' ? (fr % 2) : 0);
    // 다리
    const legTop = footY - B.lh - 3;
    const lx = cx - B.gap / 2 - B.lw, rx = cx + B.gap / 2;
    if (pose === 'lie') { /* 머리만 (침대) */ }
    else if (sit) {
      // 앉으면 몸이 내려가고 무릎이 앞으로
      R(lx, legTop + 4, B.lw, 4, bot); R(rx, legTop + 4, B.lw, 4, bot);
      if (view === 'F') { R(lx, legTop + 8, B.lw, 2, shoe); R(rx, legTop + 8, B.lw, 2, shoe); }
    } else {
      const lOff = -Math.max(0, phase), rOff = -Math.max(0, -phase);
      if (app.skirt) {
        R(lx + 1, legTop + 5 + lOff, B.lw - 1, B.lh - 2, skin); R(rx, legTop + 5 + rOff, B.lw - 1, B.lh - 2, skin);
        R(lx - 1, legTop, B.lw * 2 + B.gap + 2, 6, bot);
      } else {
        R(lx, legTop + lOff, B.lw, B.lh + 1, bot); R(rx, legTop + rOff, B.lw, B.lh + 1, bot);
        R(lx, legTop + lOff, B.lw, 1, shade(bot, -0.15));
      }
      R(lx - (view === 'F' ? 0 : 0), footY - 3 + lOff, B.lw, 3, shoe); R(rx, footY - 3 + rOff, B.lw, 3, shoe);
    }
    // 몸통
    const sitDrop = sit ? B.lh - 2 : 0;
    const tTop = legTop - B.th - bob + sitDrop + (pose === 'bend' ? 2 : 0);
    const tx = cx - B.tw / 2;
    if (pose !== 'lie') {
      const tank = app.sleeve === 'none';
      if (tank) {
        R(tx, tTop, B.tw, B.th, skin);
        R(tx + 2, tTop + 1, B.tw - 4, B.th - 1, top);
        R(tx + 1, tTop + 2, B.tw - 2, B.th - 2, top);
      } else R(tx, tTop, B.tw, B.th, top);
      if (app.coat) { R(tx, tTop, 2, B.th + 2, app.coat); R(tx + B.tw - 2, tTop, 2, B.th + 2, app.coat); }
      if (app.big) { // 굵은 가슴 근육 음영
        R(tx + 2, tTop + 5, B.tw / 2 - 3, 1, shade(top, -0.25)); R(cx + 1, tTop + 5, B.tw / 2 - 3, 1, shade(top, -0.25));
        R(cx, tTop + 2, 1, B.th - 4, shade(top, -0.18));
      }
      if (!sit && !app.skirt) R(tx, tTop + B.th - 2, B.tw, 2, shade(bot, -0.25)); // 벨트
      if (sit) { // 앉으면 허벅지와 신발이 몸 아래로 보인다
        const ky = tTop + B.th;
        R(lx, ky - 1, B.lw, 3, bot); R(rx, ky - 1, B.lw, 3, bot);
        if (view === 'F') { R(lx, ky + 2, B.lw, 2, shoe); R(rx, ky + 2, B.lw, 2, shoe); }
      }
      if (app.vest) { R(tx + 1, tTop + 1, 2, B.th - 3, app.vest); R(tx + B.tw - 3, tTop + 1, 2, B.th - 3, app.vest); }
      if (view === 'F' && !tank) R(cx - 1, tTop, 2, 2, shade(top, -0.3)); // 목깃
      if (app.badge && view === 'F') R(tx + B.tw - 4, tTop + 2, 2, 2, app.badge);
      if (app.jacket) { // 앞이 열린 위장 재킷
        const jw = Math.max(3, Math.round(B.tw / 4)), jd = shade(app.jacket, -0.25);
        if (view === 'F') { R(tx, tTop, jw, B.th, app.jacket); R(tx + B.tw - jw, tTop, jw, B.th, app.jacket); R(tx + 1, tTop + 2, 1, 2, jd); R(tx + B.tw - 2, tTop + 5, 1, 2, jd); R(tx + jw - 1, tTop, 1, B.th, jd); R(tx + B.tw - jw, tTop, 1, B.th, jd); }
        else { R(tx, tTop, B.tw, B.th, app.jacket); for (let k = 0; k < 6; k++) R(tx + 2 + (k * 5) % (B.tw - 3), tTop + 1 + (k * 3) % (B.th - 2), 2, 1, jd); }
      }
      if (app.tag && view === 'F') { const tc = '#cfd4da'; R(cx - 3, tTop, 1, 1, tc); R(cx - 2, tTop + 1, 1, 1, tc); R(cx - 1, tTop + 2, 1, 1, tc); R(cx + 2, tTop, 1, 1, tc); R(cx + 1, tTop + 1, 1, 1, tc); R(cx, tTop + 2, 1, 1, tc); R(cx - 1, tTop + 3, 2, 3, '#e6e9ee'); R(cx - 1, tTop + 5, 2, 1, '#9aa3ad'); }
      if (app.hood && view === 'F') { R(tx + 1, tTop, B.tw - 2, 2, shade(app.top, -0.12)); R(cx - 2, tTop + 2, 1, 3, '#ffffff'); R(cx + 1, tTop + 2, 1, 3, '#ffffff'); R(tx + 2, tTop + B.th - 4, B.tw - 4, 2, shade(app.top, -0.08)); }
      // 팔
      const aw = B.aw, ay0 = tTop + 1;
      const sleeveLen = app.jacket ? 5 : app.sleeve === 'none' ? 0 : app.sleeve === 'short' ? 3 : B.th - 2;
      const slv = app.jacket || app.top; // 소매는 재킷 색
      const arm = (x, y, len, dir) => { // dir: 0 아래, 1 앞(가운데로), 2 위, 3 옆
        if (dir === 0) { R(x, y, aw, len, skin); if (sleeveLen) R(x, y, aw, Math.min(len, sleeveLen), slv); R(x, y + len, aw, 2, skin); }
        else if (dir === 2) { R(x, y - len, aw, len + 1, skin); if (sleeveLen) R(x, y - Math.min(len, sleeveLen) + 1, aw, Math.min(len, sleeveLen), slv); }
        else if (dir === 3) { const sx = x < cx ? x - len : x; R(sx, y, len + aw, aw, skin); if (sleeveLen) R(x < cx ? x - 1 : x, y, aw + 1, aw, slv); }
      };
      const L = tx - aw, Rr = tx + B.tw, alen = B.th - 1;
      const swing = walk ? phase : 0;
      const armPose = pose === 'walkhold' ? 'hold' : pose === 'walkholdL' ? 'holdL' : pose;
      switch (armPose) {
        case 'wave': arm(L, ay0 + swing, alen, 0); arm(Rr, ay0, alen, 2); R(Rr - 1, ay0 - alen - 2 - (fr % 2), aw + 2, 2, skin); break;
        case 'hug': case 'carry': case 'work': {
          const o = pose === 'work' ? (fr % 2) : 0;
          R(L + 1, ay0 + 2 - o, aw + 2, aw + 1, sleeveLen ? slv : skin); R(Rr - 3, ay0 + 2 + o, aw + 2, aw + 1, sleeveLen ? slv : skin);
          R(tx + 1, ay0 + 4 - o, 3, 2, skin); R(tx + B.tw - 4, ay0 + 4 + o, 3, 2, skin);
          if (pose === 'carry') R(tx - 1, ay0 + 1, B.tw + 2, 5, '#c9a86a');
          break;
        }
        case 'hold': arm(L, ay0, alen, 0); arm(Rr, ay0 + 3, 4, 3); break;
        case 'holdL': arm(L, ay0 + 3, 4, 3); arm(Rr, ay0, alen, 0); break;
        case 'pat': arm(L, ay0, alen, 0); R(Rr, ay0 - 6, aw, 8, skin); if (sleeveLen) R(Rr, ay0, aw, 2, slv); R(Rr - 2, ay0 - 8, aw + 3, 3, skin); break;
        case 'eat': arm(L, ay0, alen - 2, 0); R(Rr - 1, ay0 - 1 - (fr % 2) * 2, aw + 1, 5, skin); break;
        case 'workout': if (fr % 2) { arm(L, ay0, alen, 2); arm(Rr, ay0, alen, 2); R(L - 2, ay0 - alen - 2, B.tw + aw * 2 + 4, 2, '#555'); } else { arm(L, ay0, alen - 3, 0); arm(Rr, ay0, alen - 3, 0); } break;
        case 'surprise': case 'bump': arm(L, ay0, 5, 2); arm(Rr, ay0, 5, 2); break;
        case 'hang': arm(L + 1, ay0, alen + 4, 2); arm(Rr - 1, ay0, alen + 4, 2); break;
        default: arm(L, ay0 + Math.max(0, swing), alen, 0); arm(Rr, ay0 + Math.max(0, -swing), alen, 0);
      }
    }
    // 머리
    const hw = B.hw, hh = B.hh;
    const hx = cx - Math.floor(hw / 2);
    const neckH = app.big ? 2 : 2;
    const hy = pose === 'lie' ? footY - hh - 6 : tTop - hh - neckH + 1 + (pose === 'bend' ? 2 : 0) + (pose === 'bump' ? 1 : 0);
    // 목
    if (pose !== 'lie') { const nw = app.big ? 6 : 4; R(cx - nw / 2, hy + hh - 2, nw, neckH + 2, shade(skin, -0.12)); }
    // 머리 뒤 머리카락 (긴 머리 등)
    if (view === 'F' && pose !== 'lie') { // 뒷머리는 몸 '뒤'에 그린다 (어깨를 덮지 않게)
      g.globalCompositeOperation = 'destination-over';
      backHair(R, app, hx, hy, hw, hh, hair, B);
      g.globalCompositeOperation = 'source-over';
    }
    if (app.big) { // 대위: 갸름한 턱선
      R(hx + 1, hy, hw - 2, hh - 2, skin); R(hx, hy + 1, hw, hh - 4, skin); R(hx + 2, hy + hh - 2, hw - 4, 1, skin); R(hx + 3, hy + hh - 1, hw - 6, 1, skin);
    } else { // 동글동글한 얼굴
      R(hx + 2, hy, hw - 4, hh, skin); R(hx + 1, hy + 1, hw - 2, hh - 2, skin); R(hx, hy + 3, hw, hh - 6, skin);
    }
    R(hx - 1, hy + 8, 1, 3, skin); R(hx + hw, hy + 8, 1, 3, skin); // 귀
    if (view === 'F') faceDraw(R, app, hx, hy, hw, hh, pose === 'lie' ? 'sleep' : face, fr);
    hairDraw(R, app, hx, hy, hw, hh, hair, view, B);
    if (app.hat) { R(hx - 1, hy - 1, hw + 2, 4, app.hat); R(view === 'F' ? hx + 2 : hx, hy + 2, hw - 2, 2, shade(app.hat, -0.2)); }
    if (app.mask && pose !== 'lie') maskDraw(R, app, hx, hy, hw, hh, view);
    G.outline(c, '#20172a');
    return { c, ax: B.ax, ay: B.ay, headY: hy, B };
  }

  function faceDraw(R, app, hx, hy, hw, hh, face, fr) {
    const ey = hy + (app.big ? 9 : 8), eL = hx + 4, eR = hx + hw - 6;
    const eye = app.eye, blushC = '#ff9aa8';
    const blink = face === 'normal' && fr % 23 === 22;
    if (face === 'smile' || face === 'sleep' || blink) {
      R(eL, ey + 1, 2, 1, eye); R(eR, ey + 1, 2, 1, eye);
      if (face === 'smile') { R(eL - 1, ey + 2, 1, 1, eye); R(eR + 2, ey + 2, 1, 1, eye); }
    } else if (face === 'surprise') {
      R(eL, ey - 1, 2, 3, eye); R(eR, ey - 1, 2, 3, eye); R(eL, ey - 1, 1, 1, '#fff'); R(eR, ey - 1, 1, 1, '#fff');
    } else if (face === 'angry') {
      R(eL, ey, 2, 2, eye); R(eR, ey, 2, 2, eye); R(eL - 1, ey - 2, 3, 1, eye); R(eR, ey - 2, 3, 1, eye);
    } else if (app.eyeStyle === 'sharp') { // 대위: 깔끔하고 또렷한 눈 (검은 픽셀 최소)
      const lid = shade(app.skin, -0.5);
      const tall = face === 'smirk' ? 1 : 2;
      R(eL - 1, ey - 1, 3, 1, lid); R(eR, ey - 1, 3, 1, lid);
      R(eL, ey, 2, tall, eye); R(eR, ey, 2, tall, eye);
      R(eL, ey, 1, 1, '#ffffff'); R(eR, ey, 1, 1, '#ffffff');
    } else if (app.eyeStyle === 'big') { // 동그랗고 큰 눈
      R(eL, ey - 2, 2, 1, '#2a1e2a'); R(eR, ey - 2, 2, 1, '#2a1e2a');
      R(eL, ey - 1, 2, 3, eye); R(eR, ey - 1, 2, 3, eye);
      R(eL, ey + 1, 2, 1, shade(eye, 0.35)); R(eR, ey + 1, 2, 1, shade(eye, 0.35));
      R(eL, ey - 1, 1, 1, '#ffffff'); R(eR, ey - 1, 1, 1, '#ffffff');
    } else {
      R(eL, ey - 1, 2, 3, eye); R(eR, ey - 1, 2, 3, eye); R(eL, ey - 1, 1, 1, '#ffffff'); R(eR, ey - 1, 1, 1, '#ffffff');
      if (face === 'smirk') { R(eL, ey - 1, 2, 1, shade(app.skin, -0.1)); }
      if (face === 'sad') { R(eL - 1, ey - 2, 2, 1, eye); R(eR + 1, ey - 2, 2, 1, eye); }
    }
    if (app.brows && app.eyeStyle === 'sharp') { const bc = shade(app.brows, 0.18); R(eL - 1, ey - 3, 3, 1, bc); R(eR, ey - 3, 3, 1, bc); R(hx + Math.floor(hw / 2), ey + 3, 1, 1, shade(app.skin, -0.18)); }
    else if (app.brows) { R(eL - 1, ey - 2, 3, 1, app.brows); R(eR, ey - 2, 3, 1, app.brows); }
    // 입
    const my = hy + hh - 3, mx = hx + Math.floor(hw / 2) - 1;
    const mc = app.big ? '#9a5048' : '#c0506a';
    if (face === 'surprise') R(mx, my - 1, 2, 2, mc);
    else if (face === 'smirk') { R(mx - 1, my, 3, 1, mc); R(mx + 2, my - 1, 1, 1, mc); if (app.big) R(mx, my + 1, 2, 1, shade(app.skin, -0.12)); }
    else if (face === 'smile') { R(mx - 1, my - 1, 1, 1, mc); R(mx, my, 2, 1, mc); R(mx + 2, my - 1, 1, 1, mc); }
    else if (face === 'sad') { R(mx, my, 2, 1, mc); R(mx - 1, my + 1, 1, 1, mc); R(mx + 2, my + 1, 1, 1, mc); }
    else if (face !== 'sleep') R(mx, my, 2, 1, mc);
    // 볼터치
    const bc = face === 'blush' ? '#ff7a8f' : blushC;
    if (!app.scar || face === 'blush') { R(eL - 1, ey + 3, 2, 1, bc); R(eR + 1, ey + 3, 2, 1, bc); }
    if (face === 'blush') { R(hx + 1, hy + 10, 3, 1, bc); R(hx + hw - 4, hy + 10, 3, 1, bc); R(hx + 2, hy + 12, 1, 1, bc); R(hx + hw - 3, hy + 12, 1, 1, bc); }
    // 대위 전용: 코를 가로지르는 흉터
    if (app.scar) {
      const sc = '#c8746a';
      for (let i = 0; i < 5; i++) R(hx + 5 + i, ey + 2 + Math.floor(i / 2), 1, 1, '#f0c3ae');
    }
  }

  // ---------- 축제 가면 (실버마스크) ----------
  // 눈가를 덮는 반가면 + 금테 + 이마 보석, 종류마다 깃털·날개·귀·햇살 같은 장식이 붙는다
  const MASKS = {
    plume: { name: '깃털 장식 금빛 가면', icon: '🪶', c: '#f3d27a', c2: '#c2185b', trim: '#fff3c4', gem: '#e0245e' },
    peacock: { name: '공작 깃 가면', icon: '🦚', c: '#1f8a8a', c2: '#2fd1b0', trim: '#ffd166', gem: '#3b5fd0' },
    butterfly: { name: '나비 가면', icon: '🦋', c: '#d6a2ff', c2: '#7fe3ff', trim: '#ffffff', gem: '#ff8fd0' },
    cat: { name: '검은 고양이 가면', icon: '🐈‍⬛', c: '#2a2433', c2: '#ff8fb8', trim: '#ffd166', gem: '#7fe3ff' },
    sun: { name: '태양 가면', icon: '☀️', c: '#ffb347', c2: '#ff6b4a', trim: '#fff0a8', gem: '#e0245e' },
    jester: { name: '어릿광대 가면', icon: '🃏', c: '#c2185b', c2: '#2f6bd0', trim: '#ffd166', gem: '#ffffff' },
    lace: { name: '검은 레이스 가면', icon: '🖤', c: '#1d1420', c2: '#8a7aa8', trim: '#d9c8ff', gem: '#c2185b' },
    moon: { name: '달과 별 가면', icon: '🌙', c: '#e8ebf2', c2: '#9fb8ff', trim: '#ffffff', gem: '#ffd166' },
    rose: { name: '루비 장미 가면', icon: '🌹', c: '#a3123f', c2: '#ff6b9b', trim: '#ffd1e6', gem: '#ffd166' },
    snow: { name: '서리꽃 가면', icon: '❄️', c: '#bfe6ff', c2: '#ffffff', trim: '#7fb6e6', gem: '#5b8fd0' },
  };
  function maskDraw(R, app, hx, hy, hw, hh, view) {
    const M = MASKS[app.mask] || MASKS.plume, st = MASKS[app.mask] ? app.mask : 'plume';
    const ey = hy + (app.big ? 9 : 8), eL = hx + 4, eR = hx + hw - 6, cx = hx + Math.floor(hw / 2);
    const x0 = hx + 1, x1 = hx + hw - 1; // 가면 좌우 끝
    const feather = (x, top, len, col, lean) => { R(x, top, 1, len, col); R(x + lean, top - 1, 1, Math.max(2, len - 3), shade(col, 0.25)); R(x + lean, top - 2, 1, 1, '#ffffff'); };
    if (view !== 'F') { // 옆·뒤: 머리 위로 솟은 장식만
      if (st === 'plume') { feather(hx + hw - 3, hy - 4, 7, M.c2, 1); feather(hx + hw - 5, hy - 3, 6, M.trim, 1); }
      if (st === 'peacock') { feather(hx + 2, hy - 4, 7, M.c2, -1); feather(hx + hw - 3, hy - 4, 7, M.c2, 1); }
      if (st === 'cat') { R(hx + 2, hy - 2, 3, 3, M.c); R(hx + hw - 5, hy - 2, 3, 3, M.c); }
      if (st === 'sun') for (let x = hx + 2; x < hx + hw - 2; x += 2) R(x, hy - 2 - ((x - hx) % 4 ? 0 : 1), 1, 3, M.trim);
      return;
    }
    // 바탕
    R(x0 + 1, ey - 3, x1 - x0 - 2, 1, M.trim);
    R(x0, ey - 2, x1 - x0, 4, M.c);
    R(x0 + 1, ey + 2, 5, 1, M.c); R(x1 - 6, ey + 2, 5, 1, M.c);
    R(x0 + 2, ey + 3, 3, 1, shade(M.c, -0.15)); R(x1 - 5, ey + 3, 3, 1, shade(M.c, -0.15));
    R(cx - 1, ey + 1, 2, 2, app.skin); // 코가 나오는 자리
    // 무늬
    if (st === 'jester') { for (let x = x0; x < x1; x += 2) for (let y = 0; y < 4; y += 2) R(x + (y ? 0 : 0), ey - 2 + y, 2, 2, ((x - x0) / 2 + y / 2) % 2 ? M.c2 : M.c); R(cx - 1, ey + 1, 2, 2, app.skin); }
    if (st === 'lace') { for (let x = x0 + 1; x < x1; x += 2) { R(x, ey - 2, 1, 1, M.c2); R(x, ey + 1, 1, 1, M.c2); } }
    if (st === 'moon') { R(x0, ey - 2, Math.floor((x1 - x0) / 2), 4, M.c2); R(x1 - 3, ey + 1, 1, 1, M.gem); R(x1 - 2, ey - 2, 1, 1, M.gem); }
    if (st === 'butterfly') { R(x0, ey - 2, 2, 4, M.c2); R(x1 - 2, ey - 2, 2, 4, M.c2); }
    if (st === 'snow') { R(x0 + 1, ey - 2, 1, 1, M.c2); R(x1 - 2, ey - 2, 1, 1, M.c2); R(x0 + 2, ey + 1, 1, 1, M.c2); R(x1 - 3, ey + 1, 1, 1, M.c2); }
    if (st === 'rose') { R(x0, ey - 2, 2, 2, M.c2); R(x1 - 2, ey - 2, 2, 2, M.c2); }
    // 눈구멍: 금테를 두르고 눈동자는 그대로 보이게
    for (const ex of [eL, eR]) { R(ex - 1, ey - 2, 4, 1, M.trim); R(ex - 1, ey + 1, 4, 1, shade(M.trim, -0.2)); R(ex - 1, ey - 1, 4, 2, shade(app.skin, -0.1)); R(ex, ey - 1, 2, 2, app.eye || '#2a2228'); R(ex, ey - 1, 1, 1, '#ffffff'); }
    // 이마 보석
    R(cx - 1, ey - 4, 2, 2, M.gem); R(cx - 1, ey - 4, 1, 1, '#ffffff');
    // 반짝임
    R(x0 + 1, ey, 1, 1, shade(M.c, 0.4)); R(x1 - 2, ey - 1, 1, 1, shade(M.c, 0.4));
    // 종류별 장식
    if (st === 'plume') { feather(x1 - 1, ey - 9, 7, M.c2, 1); feather(x1 - 3, ey - 11, 8, shade(M.c2, 0.2), 1); feather(x1 - 5, ey - 9, 6, M.trim, 1); R(x1 - 4, ey - 3, 4, 1, M.gem); }
    if (st === 'peacock') { for (const [x, l] of [[x0, -1], [x0 + 2, -1], [x1 - 1, 1], [x1 - 3, 1]]) { feather(x, ey - 10, 7, M.c2, l); R(x, ey - 10, 1, 2, '#3b5fd0'); R(x, ey - 9, 1, 1, M.trim); } }
    if (st === 'butterfly') { R(x0 - 3, ey - 4, 4, 3, M.c2); R(x0 - 2, ey - 5, 2, 1, M.c); R(x0 - 2, ey - 1, 3, 3, M.c); R(x1 - 1, ey - 4, 4, 3, M.c2); R(x1, ey - 5, 2, 1, M.c); R(x1 - 1, ey - 1, 3, 3, M.c); R(x0 - 2, ey - 3, 1, 1, '#ffffff'); R(x1 + 1, ey - 3, 1, 1, '#ffffff'); R(cx - 2, ey - 6, 1, 2, M.trim); R(cx + 1, ey - 6, 1, 2, M.trim); }
    if (st === 'cat') { R(x0 + 1, ey - 6, 4, 3, M.c); R(x0 + 2, ey - 7, 2, 1, M.c); R(x0 + 2, ey - 5, 2, 2, M.c2); R(x1 - 5, ey - 6, 4, 3, M.c); R(x1 - 4, ey - 7, 2, 1, M.c); R(x1 - 4, ey - 5, 2, 2, M.c2); R(x0 - 2, ey + 1, 2, 1, M.trim); R(x1, ey + 1, 2, 1, M.trim); R(x0 - 2, ey + 3, 2, 1, M.trim); R(x1, ey + 3, 2, 1, M.trim); }
    if (st === 'sun') { for (let x = x0, i = 0; x < x1; x += 2, i++) { const h = i % 2 ? 2 : 4; R(x, ey - 3 - h, 1, h, i % 2 ? M.c2 : M.trim); } R(x0 - 2, ey - 1, 2, 1, M.trim); R(x1, ey - 1, 2, 1, M.trim); R(x0 - 1, ey + 1, 1, 1, M.c2); R(x1, ey + 1, 1, 1, M.c2); }
    if (st === 'jester') { R(x0, ey - 6, 3, 3, M.c2); R(x0 - 1, ey - 8, 2, 2, M.c2); R(x0 - 2, ey - 9, 1, 1, M.trim); R(x1 - 3, ey - 6, 3, 3, M.c); R(x1 - 1, ey - 8, 2, 2, M.c); R(x1 + 1, ey - 9, 1, 1, M.trim); R(cx - 1, ey - 6, 2, 2, M.trim); }
    if (st === 'lace') { for (let i = 0; i < 4; i++) R(x1 - 1 + (i % 2), ey + 3 + i * 2, 1, 1, i % 2 ? M.trim : M.gem); R(x0, ey - 4, 2, 1, M.c2); R(x1 - 2, ey - 4, 2, 1, M.c2); R(x0 + 3, ey - 4, 1, 1, M.c2); R(x1 - 4, ey - 4, 1, 1, M.c2); }
    if (st === 'moon') { R(x0, ey - 6, 2, 3, M.c2); R(x0 + 1, ey - 7, 2, 1, M.c2); R(x0 + 2, ey - 5, 1, 1, M.c2); R(x1 - 2, ey - 6, 1, 3, M.gem); R(x1 - 3, ey - 5, 3, 1, M.gem); }
    if (st === 'rose') { R(x1 - 3, ey - 6, 4, 3, M.c2); R(x1 - 2, ey - 5, 2, 1, M.c); R(x1 - 4, ey - 4, 2, 1, '#3f8f5a'); R(x1, ey - 3, 2, 1, '#3f8f5a'); R(x0, ey - 5, 3, 2, M.c2); R(x0 + 1, ey - 5, 1, 1, M.c); }
    if (st === 'snow') { R(x1 - 2, ey - 7, 1, 5, M.trim); R(x1 - 4, ey - 5, 5, 1, M.trim); R(x1 - 3, ey - 6, 1, 1, M.c2); R(x1 - 1, ey - 4, 1, 1, M.c2); R(x1 - 3, ey - 4, 1, 1, M.c2); R(x1 - 1, ey - 6, 1, 1, M.c2); R(x0 + 1, ey - 5, 1, 2, M.trim); R(x0, ey - 4, 3, 1, M.trim); }
  }

  function backHair(R, app, hx, hy, hw, hh, col, B) {
    const d = shade(col, -0.15);
    if (app.hair === 'long') { R(hx - 1, hy + 4, hw + 2, hh + 7, d); }
    if (app.hair === 'bob') { R(hx - 1, hy + 4, hw + 2, hh - 2, d); }
    if (app.hair === 'wolf') { R(hx - 1, hy + 4, hw + 2, hh + 2, d); }
    if (app.hair === 'pony') { R(hx + hw - 1, hy + 4, 3, 8, d); }
  }
  function hairDraw(R, app, hx, hy, hw, hh, col, view, B) {
    const hl = shade(col, 0.25), dk = shade(col, -0.18);
    const st = app.hair;
    if (view === 'B') { // 뒷모습: 머리 전체
      const len = { messybun: hh - 2, short: hh - 3, crew: hh - 5, bob: hh, long: hh + 6, pony: hh - 3, bun: hh - 3, curly: hh - 2, wolf: hh + 2, slick: hh - 4 }[st] || hh - 3;
      if (app.big) { R(hx - 1, hy - 1, hw + 2, Math.min(len, hh) + 1, col); R(hx, hy - 2, hw, 2, col); }
      else { R(hx, hy, hw, Math.min(len, hh), col); R(hx + 2, hy - 1, hw - 4, 1, col); R(hx - 1, hy + 2, hw + 2, Math.min(len, hh) - 2, col); }
      if (len > hh) R(hx - 1, hy + hh, hw + 2, len - hh, col);
      R(hx + 3, hy, 3, 1, hl);
      if (st === 'pony') { R(hx + hw / 2 - 2, hy + hh - 4, 4, 9, dk); R(hx + hw / 2 - 2, hy + hh - 5, 4, 2, '#e05a7a'); }
      if (st === 'bun') { R(hx + hw / 2 - 3, hy - 5, 6, 5, col); }
      if (st === 'messybun') { R(hx + hw / 2 - 4, hy - 4, 8, 7, col); R(hx + hw / 2 - 2, hy - 3, 3, 1, hl); R(hx - 2, hy + hh - 3, 1, 3, dk); R(hx + hw + 1, hy + hh - 4, 1, 4, dk); }
      if (st === 'slick') { R(hx + 4, hy + 1, 6, 1, hl); }
      if (st === 'curly') for (let i = -1; i < hw + 1; i += 3) R(hx + i, hy + hh - 4, 2, 2, col);
      return;
    }
    // 앞모습
    if (app.big) { R(hx, hy - 2, hw, 3, col); R(hx - 1, hy, hw + 2, 3, col); } // 정수리
    else { R(hx + 2, hy - 1, hw - 4, 1, col); R(hx + 1, hy, hw - 2, 2, col); R(hx, hy + 1, hw, 2, col); }
    switch (st) {
      case 'crew': R(hx, hy - 1, hw, 2, col); R(hx - 1, hy + 1, 1, 3, col); R(hx + hw, hy + 1, 1, 3, col); break;
      case 'slick': // 대위: 뒤로 넘긴 머리 + 이마로 흘러내린 몇 가닥
        R(hx - 1, hy - 1, hw + 2, 3, col); R(hx - 1, hy + 2, 2, 5, col); R(hx + hw - 1, hy + 2, 2, 4, col); R(hx + 1, hy + 2, 2, 1, col);
        R(hx + 5, hy + 2, 1, 2, col);
        R(hx + 2, hy - 2, hw - 4, 1, col); R(hx + 3, hy - 1, 5, 1, hl); R(hx + 9, hy, 4, 1, hl); break;
      case 'messybun': // 앞머리 + 헝클어진 올림머리
        R(hx - 1, hy + 2, 2, hh - 4, col); R(hx + hw - 1, hy + 2, 2, hh - 4, col); R(hx + 1, hy + 2, hw - 2, 3, col);
        for (let i = 1; i < hw - 1; i += 2) R(hx + i, hy + 5, 1, 1, col);
        R(hx - 2, hy + 7, 1, 4, dk); R(hx + hw + 1, hy + 6, 1, 5, dk);
        R(hx + hw - 7, hy - 6, 7, 6, col); R(hx + hw - 8, hy - 4, 1, 3, col); R(hx + hw - 1, hy - 7, 1, 2, col); R(hx + hw - 6, hy - 5, 2, 1, hl); R(hx + hw - 3, hy - 7, 1, 1, col);
        R(hx + 3, hy - 1, 3, 1, hl); break;
      case 'short': R(hx - 1, hy + 2, 2, 5, col); R(hx + hw - 1, hy + 2, 2, 5, col); R(hx + 1, hy + 2, hw - 2, 2, col); R(hx + 4, hy + 4, 3, 1, col); R(hx + 3, hy - 1, 3, 1, hl); break;
      case 'bob': R(hx - 1, hy + 2, 2, hh - 2, col); R(hx + hw - 1, hy + 2, 2, hh - 2, col); R(hx + 1, hy + 2, hw - 2, 3, col); R(hx + 3, hy - 1, 3, 1, hl); break;
      case 'long': R(hx - 1, hy + 2, 2, hh + 6, col); R(hx + hw - 1, hy + 2, 2, hh + 6, col); R(hx + 1, hy + 2, hw - 2, 3, col); R(hx + 5, hy + 4, 2, 1, col); R(hx + 3, hy - 1, 3, 1, hl); break;
      case 'pony': R(hx, hy + 2, 2, 6, col); R(hx + hw - 2, hy + 2, 2, 6, col); R(hx + 1, hy + 2, hw - 2, 2, col); R(hx + 2, hy + 4, 4, 1, col); R(hx + hw - 4, hy + 4, 2, 1, col);
        R(hx + hw - 1, hy + 2, 2, 2, '#ff8fb0'); R(hx + hw, hy + 4, 2, 6, dk); R(hx + hw + 1, hy + 10, 1, 2, dk); R(hx + 3, hy - 1, 4, 1, hl); break;
      case 'bun': R(hx - 1, hy + 2, 2, 4, col); R(hx + hw - 1, hy + 2, 2, 4, col); R(hx + 1, hy + 2, hw - 2, 2, col); R(hx + hw / 2 - 3, hy - 6, 6, 5, col); R(hx + hw / 2 - 2, hy - 5, 2, 1, hl); break;
      case 'curly': for (let i = -1; i < hw + 1; i += 2) R(hx + i, hy - 3 + (i % 4 === 1 ? 1 : 0), 2, 2, col); R(hx - 2, hy + 2, 3, 6, col); R(hx + hw - 1, hy + 2, 3, 6, col); R(hx + 1, hy + 2, hw - 2, 2, col); R(hx + 2, hy + 4, 2, 1, col); R(hx + hw - 4, hy + 4, 2, 1, col); break;
      case 'wolf': R(hx - 1, hy + 2, 2, hh + 1, col); R(hx + hw - 1, hy + 2, 2, hh + 1, col); R(hx + 1, hy + 2, hw - 2, 3, col); R(hx + 2, hy + 5, 2, 1, col); R(hx + hw - 5, hy + 5, 2, 1, col); R(hx + 3, hy - 1, 3, 1, hl); break;
    }
  }

  // ---------- 캐시 ----------
  const cache = new Map();
  function key(app) { return app._k || (app._k = JSON.stringify(app)); }
  function get(app, pose, fr, view, face) {
    const k = key(app) + pose + fr + view + face;
    let f = cache.get(k);
    if (!f) { f = frame(app, pose, fr, view, face); cache.set(k, f); if (cache.size > 3000) cache.clear(); }
    return f;
  }
  function invalidate(app) { delete app._k; }

  // 플레이어 외형 → 그리기용
  function playerApp(p, season) {
    const o = OUTFITS[p.outfit] || OUTFITS.uniform;
    const job = PX.JOBS[p.job];
    const a = {
      skin: SKINS[p.skin] || SKINS[1], hair: p.hair, hairColor: HAIRC[p.hairColor] || '#2a2433', eye: EYEC[p.eye] || '#2a2030',
      top: o.top(job), bottom: o.bottom(job), shoe: o.shoe, sleeve: season === 'summer' && o.summerShort ? 'short' : o.sleeve,
      coat: o.coat ? o.coat(job) : null, skirt: !!o.skirt, badge: o.badge ? job.color : null,
      eyeStyle: p.gender === '남성' ? 'sharp' : 'big', brows: p.gender === '남성' ? (HAIRC[p.hairColor] || '#2a2433') : null, hood: !!o.hood,
      tag: job.military && p.outfit === 'uniform' ? 1 : 0,
    };
    return a;
  }
  const OUTFITS = {
    uniform: { ko: '근무복', top: j => j.top, bottom: j => j.bottom, shoe: '#2f2a24', sleeve: 'long', summerShort: true, coat: j => j.coat, badge: true },
    training: { ko: '트레이닝복', top: () => '#3b5fa8', bottom: () => '#2c3e66', shoe: '#e9eef2', sleeve: 'long', summerShort: true },
    hoodie: { ko: '오버핏 후드티', top: () => '#e6e2ea', bottom: () => '#8a8794', shoe: '#f4efe4', sleeve: 'long', hood: true },
    shirt: { ko: '셔츠 · 슬랙스', top: () => '#f4efe4', bottom: () => '#3a3f4a', shoe: '#5a3f2a', sleeve: 'long', summerShort: true },
    skirt: { ko: '니트 · 치마', top: () => '#f2d28a', bottom: () => '#6a5aa8', shoe: '#5a3f2a', sleeve: 'long', skirt: true },
  };

  return { frame, get, invalidate, playerApp, SKINS, HAIRC, EYEC, HAIRS, OUTFITS, BODY, MASKS };
})();
