// 약속: 대위가 "A 하자" 제안 → 내가 수락하면 그 약속을 기억하고 A 를 하러 간다.
// 가는 길에 스킨십·대화(B)가 끼어도 약속은 사라지지 않고, B 가 끝나면 다시 A 로 돌아온다.
// 도착하면 그 장소의 "여기서 같이 하기" 행동(A)을 실제로 한다.
'use strict';
PX.Plan = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const night = () => { const m = St.S.time.min; return m >= 19 * 60 || m < 4 * 60; };
  const openSky = (id) => { const md = PX.MAPS[id]; return md && md.kind === 'out' && !md.dome; };
  const mapName = (id) => (PX.MAPS[id] && PX.MAPS[id].name) || '';

  // 약속 종류 · 질문/대답 문장으로 알아본다 (위에서부터)
  // acts: 도착하면 할 "여기서 같이 하기" 행동 · go: 가야 할 곳(안내용) · here(): 지금 여기서도 할 수 있나
  const KINDS = [
    { id: 'stars', re: /별 보|별 보면서|별 보는|하늘이 빛|별비|투영실/, label: '별 보기', acts: ['bs_stars', 'st_find', 'sl_find', 'p6_warm'], go: 'base',
      here: () => night() && openSky(G().mapId) && !['rain', 'dust'].includes(St.weather()),
      far: '밖으로 나가자. 별은 하늘 뚫린 데서 봐야지.',
      sc: [['N:둘이 나란히 서서 고개를 든다. 돔 밖 하늘에 별이 촘촘하다.', 'C:저기. 저 밝은 거 세 개 이어지는 거. 지구에선 안 보이는 별자리야.', 'C*:이름은 아직 없대. 우리가 붙이자.'],
        ['N:대위가 재킷을 벗어 바닥에 깔고 앉는다. 옆자리를 손바닥으로 툭툭 친다.', 'N:어깨를 맞대고 앉아 한참 하늘만 본다.', 'C^:별 보러 가자고 한 거, 사실 핑계였어. 이러고 있고 싶어서.']] },
    { id: 'movie', re: /영화/, label: '영화 보기', acts: ['lg_movie'], go: 'lounge',
      sc: [['N:소파 끝자리에 나란히 앉는다. 화면이 켜진다.', 'C:지구 옛날 영화래. 바다가 나와.', 'N:영화 중간쯤, 대위의 어깨가 슬쩍 기울어 온다.']] },
    { id: 'samgyup', re: /냉삼/, label: '냉삼 먹기', acts: ['sg_grill', 'sg_ssam'], go: 'samgyup',
      sc: [['N:불판이 달궈진다. 대위가 집게를 쥐고 진지한 얼굴이 된다.', 'C:가장 잘 익은 건 네 거. 규칙이야.']] },
    { id: 'cafe', re: /카페|브런치|마실래|창가 자리/, label: '카페 가기', acts: ['cf_swap', 'cf_people'], go: 'cafe',
      sc: [['N:창가 자리에 마주 앉는다. 얼음이 가득한 컵이 땀을 흘린다.', 'C^:이런 거 데이트 같다. 아니, 데이트야.']] },
    { id: 'px', re: /PX|아이스크림|간식|사 줄게|뭐 살 거/, label: 'PX 가기', acts: ['px_shop'], go: 'px',
      sc: [['N:바구니를 든 대위가 진열대 앞에서 오래 고민한다.', 'C:네가 좋아하는 거 다 담아. 오늘은 내가 산다.']] },
    { id: 'gym', re: /운동|체력 단련|세트|보조해/, label: '같이 운동하기', acts: ['gm_stretch', 'gm_arm', 'gm_plank'], go: 'gym',
      sc: [['N:대위가 매트를 깔고 손을 내민다.', 'C:스트레칭부터. 내가 잡아 줄게. 아프면 말해.']] },
    { id: 'flower', re: /꽃/, label: '꽃 고르기', acts: ['fl_pick'], go: 'flower',
      sc: [['N:유리돔 안에 꽃 냄새가 가득하다. 대위가 꽃 사이를 진지하게 살핀다.', 'C*:…네가 고른 걸로 할게. 내 눈엔 다 너보다 덜 예뻐서.']] },
    { id: 'arcade', re: /인형 뽑기|펀치|오락실|리듬/, label: '오락실 가기', acts: ['ac_punch', 'ac_rhythm'], go: 'arcade',
      sc: [['N:오락실 불빛이 번쩍인다. 대위가 소매를 걷는다.', 'C^:보고 있어. 최고 기록 갈아 치울 거야.']] },
    { id: 'onsen', re: /온천/, label: '온천 가기', acts: ['os_endure'], go: 'onsen',
      sc: [['N:김이 오르는 탕 앞. 대위가 수건을 어깨에 걸친다.', 'C;:난 덥지만… 네가 좋아하니까.']] },
    { id: 'fountain', re: /분수대|사진 찍을래/, label: '분수대 구경', acts: ['pz_coin'], go: 'plaza',
      sc: [['N:분수대 물줄기가 불빛을 받아 반짝인다.', 'C:동전 던지면 소원 이뤄진대. 하나씩 던지자.']] },
    { id: 'sunset', re: /노을|해 질 때까지/, label: '노을 보기', acts: ['hl_sunset', 'sd_view'],
      here: () => openSky(G().mapId) && St.S.time.min >= 16 * 60 && St.S.time.min < 20 * 60,
      sc: [['N:하늘이 주황에서 보라로 천천히 물든다. 대위가 옆에 서서 말없이 본다.', 'C:…예쁘다.', 'N:대위의 시선이 노을이 아니라 내 옆얼굴에 가 있다.']] },
    { id: 'lake', re: /호수|물 보자/, label: '호숫가 산책', acts: ['lk_feet', 'lk_skip'], go: 'lake',
      sc: [['N:잔잔한 물 위로 하늘이 비친다.', 'C^:아무 말 안 해도 되는 데라서 좋아.']] },
    { id: 'camp', re: /모닥불|마시멜로/, label: '모닥불 앞에 앉기', acts: ['cp_marsh'], go: 'camp',
      sc: [['N:모닥불이 타닥거린다. 대위가 마시멜로를 꼬치에 끼운다.', 'C:탄 거 좋아해, 안 탄 거 좋아해? …둘 다 구워 줄게.']] },
    { id: 'sea', re: /바다|파도|모래성/, label: '바다 보기', acts: ['p3_sea', 'bc_castle'], go: 'planet3',
      sc: [['N:파도 소리가 들린다. 대위가 그 자리에 멈춰 선다.', 'C!:…진짜 바다다.', 'N:대위가 손을 꽉 잡는다.']] },
    { id: 'skylounge', re: /창가 가 보자|라운지/, label: '라운지 가기', acts: ['sl_find', 'sl_toast'], go: 'skylounge',
      sc: [['N:큰 창 너머로 페르녹스가 한눈에 보인다.', 'C:저기 작은 불빛. 우리 부대야.']] },
    { id: 'meal', re: /밥|식당|메뉴|반찬|저녁 같이|저녁 먹|먹을래|먹자|같이 먹/, label: '같이 밥 먹기', acts: ['ms_swap', 'sg_grill', 'pz_food'], go: 'mess',
      sc: [['N:식판을 들고 마주 앉는다. 대위가 자기 반찬을 내 쪽으로 슬쩍 민다.', 'C:이거 너 좋아하잖아. 먹어.'],
        ['N:대위가 줄을 대신 서 주고 수저까지 놓아 준다.', 'C^:오늘은 내가 다 할게. 너는 먹기만 해.']] },
    { id: 'walk', re: /산책|걸을래|걷자|걸어|한 바퀴|길 끝까지|발자국|걷기/, label: '같이 산책하기', acts: ['dm_walk', 'rw_walk'], walk: true,
      sc: [['N:발소리가 나란히 맞춰진다. 대위가 걸음을 내 보폭에 맞춰 줄인다.', 'C:이렇게 걷는 거, 생각보다 좋다.', 'C*:목적지 없이 걷는 거 처음이야. 너랑이라서.'],
        ['N:한참을 말없이 걷는다. 가끔 손등이 스친다.', 'C^:…오늘 산책 코스, 내가 외워 둘게. 다음에도 이 길로.']] },
  ];
  const BYID = {}; KINDS.forEach(k => { BYID[k.id] = k; });

  const cur = () => { const p = St.S.cap.plan; return p && BYID[p.id] ? p : null; };
  const kindOf = (p) => BYID[p.id];
  const clear = () => { St.S.cap.plan = null; };
  const mins = () => St.absMin();

  // 수락한 제안 → 약속으로 (거절·나중에·혼자 있을래 등은 약속 아님)
  function offer(o) {
    if (!o || ['alone', 'rest', 'later', 'escort', 'talk'].includes(o.k) || o.mood === 'neg') return null;
    const txt = (o.q || '') + ' ' + (o.a || '');
    let k = KINDS.find(x => x.re.test(txt));
    if (!k && o.k === 'meal') k = BYID.meal;
    if (!k && o.k === 'walk') k = BYID.walk;
    if (!k) return null;
    St.S.cap.plan = { id: k.id, made: mins(), until: mins() + 180, walkT: 0, nagT: 0 };
    const where = k.go && G().mapId !== k.go && !hereOk(k) ? ` · ${mapName(k.go)}(으)로` : '';
    PX.UI.toast(`📌 약속: ${k.label}${where}`, 3000);
    return k;
  }
  // 지금 여기에서 그 약속을 할 수 있는 행동
  function actHere(k) {
    const S = St.S, list = (PX.Place && PX.Place.A[G().mapId]) || [];
    return list.find(a => k.acts.includes(a.id) && S.rel.cap.stage >= (a.s || 0) && (!a.when || a.when())) || null;
  }
  function hereOk(k) {
    if (k.walk) return false; // 산책은 같이 걷다 보면
    if (actHere(k)) return true;
    if (k.here) return k.here();
    return k.go && G().mapId === k.go;
  }

  let arriveT = 0, busy = false, resumeAt = 0;
  const NAG = ['{L} 하기로 했잖아. 가자.', '잊은 거 아니지? {L}.', '{L} 하러 가는 중이야. 딴 데 새지 마.', '자, {L}. 약속했지?', '이쪽이야. {W}'];
  const BACK = ['자, 이제 {L} 하러 가자.', '…좋았다. 근데 {L} 하기로 한 거 안 잊었어.', '이제 진짜 {L}. 가자.', '여기서 더 하면 {L} 못 해. 가자.', '{L} 하러 가던 길이었지. 가자.'];
  function line(pool, k) {
    const to = k.go && G().mapId !== k.go ? `${mapName(k.go)} 쪽.` : (k.far || '');
    return U.pickFresh('plan_' + pool.length, pool).replace('{L}', k.label).replace('{W}', to || '거의 다 왔어.');
  }
  const capNear = (r = 3.2) => { const g = G(); return g.cap && g.cap.map === g.mapId && !g.cap.hidden && U.dist(g.cap.x, g.cap.y, g.player.x, g.player.y) < r; };

  function tick(dt) {
    const p = cur(); if (!p) return;
    const g = G(), k = kindOf(p), mode = PX.Cap.mode;
    if (mins() > p.until) { if (capNear(8)) g.bubble(g.cap, `${U.josa(k.label, '은')} 다음에 꼭 하자. 약속.`, 2.6); clear(); return; }
    if (!['follow', 'visit', 'stay', 'waitOut', 'paused'].includes(mode)) { clear(); return; } // 대위가 일과로 갔다
    if (busy || g.modal || g.transition || !g.cap) return;
    // 스킨십·대화가 끝나면: 다시 약속으로
    if (resumeAt && performance.now() > resumeAt) { resumeAt = 0; if (!hereOk(k) && capNear(5)) { g.bubble(g.cap, U.fmt(line(BACK, k), PX.Dlg.ctx()), 2.8); p.nagT = 0; } }
    if (k.walk) { // 산책: 같이 바깥을 한참 걸으면
      if (g.player.moving && capNear(4) && openSky(g.mapId)) p.walkT = (p.walkT || 0) + dt;
      if (p.walkT > 25 && !g.player.moving) { run(p, k, actHere(k)); return; }
    } else if (hereOk(k) && capNear()) {
      arriveT += dt; if (arriveT > 1.4) { arriveT = 0; run(p, k, actHere(k)); return; }
    } else arriveT = 0;
    // 한참 딴 데 있으면 대위가 다시 말을 꺼낸다
    p.nagT = (p.nagT || 0) + dt;
    if (p.nagT > 55 && !k.walk && capNear(5) && !g.bubbles.some(b => b.actor === g.cap)) { p.nagT = 0; g.bubble(g.cap, U.fmt(line(NAG, k), PX.Dlg.ctx()), 3); }
  }
  async function run(p, k, act) {
    const g = G(); busy = true; clear();
    try {
      if (act) await act.run();
      else { g.modal++; try { await PX.Dlg.runLines(U.pickFresh('plansc_' + k.id, k.sc), { reply: true }); } finally { PX.Dlg.close(); g.modal--; } }
      St.addAff(2);
      const S = St.S; if (!S.done['planm_' + k.id]) { S.done['planm_' + k.id] = 1; g.memory('약속', `대위와 약속한 ${k.label}, 진짜로 했다.`, false); }
    } catch (e) { console.error(e); }
    busy = false;
  }
  // 스킨십·대화(B)가 끝났을 때 불러 준다 → 잠시 뒤 약속(A)으로 돌아온다
  function resume() { if (cur()) resumeAt = performance.now() + 2200; }
  function label() { const p = cur(); return p ? kindOf(p).label : null; }
  return { offer, tick, resume, label, cur, clear, KINDS };
})();
