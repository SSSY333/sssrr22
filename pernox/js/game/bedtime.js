// 침대에서 뒹굴거리기: 내 숙소 침대에 누워 시간 보내기 (혼자 · 대위와 같이)
'use strict';
PX.Bed = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const night = () => { const m = St.S.time.min; return m >= 19 * 60 || m < 5 * 60; };
  const capHere = () => { const g = G(); return g.cap && g.cap.map === g.mapId && !g.cap.hidden && ['visit', 'stay'].includes(PX.Cap.mode); };
  const lines = (ls) => PX.Dlg.runLines(ls, { reply: true });

  // 침대에 눕히고 데굴데굴 굴리는 작은 애니메이션
  function lieDown() {
    const g = G(), m = PX.W.maps[g.mapId], p = g.player;
    if (p.seat && p.seat.obj && (p.seat.obj.use === 'bed' || (p.seat.obj.f && p.seat.obj.f.use === 'bed'))) return true;
    const bed = m.objs.find(o => o.kind === 'furn' && (o.use === 'bed' || (o.f && o.f.use === 'bed')) && o.seats && o.seats.some(s => !s.by));
    const s = bed && bed.seats.find(x => !x.by); if (!s) return false;
    p.x = s.x; p.y = s.y; p.sitOn(s); return true;
  }
  // 대위도 같은 침대에: 큰 침대면 옆자리, 1인용이면 베개 위에 머리 둘이 나란히 (좁게)
  function capOnBed() {
    const g = G(), p = g.player, cap = g.cap, s = p.seat; if (!s || !cap) return false;
    const bed = s.obj, other = (bed.seats || []).find(x => x !== s && (!x.by || x.by === cap.id));
    cap.stop(); cap.leaveSeat && cap.leaveSeat();
    if (other) { cap.sitOn(other); }
    else { // 1인용: 침대 폭 방향으로 반씩 나눠 눕기
      const wide = (bed.fw || 1) <= (bed.fd || 1) ? 'x' : 'y', off = 0.24;
      const v = { x: s.x + (wide === 'x' ? off : 0), y: s.y + (wide === 'y' ? off : 0), z: s.z, dir: s.dir, obj: bed, virt: true };
      p.x = s.x - (wide === 'x' ? off : 0); p.y = s.y - (wide === 'y' ? off : 0);
      cap.seat = v; cap.x = v.x; cap.y = v.y; cap.z = v.z; cap.dir = v.dir; cap.pose = 'lie';
    }
    cap.busy = true;
    return true;
  }
  function roll(sec = 2.4, both) {
    const g = G(), list = [g.player].concat(both && g.cap ? [g.cap] : []), t0 = performance.now();
    return new Promise(res => { const f = (now) => { const t = (now - t0) / 1000; for (const [i, a] of list.entries()) { const bz = a.seat ? a.seat.z || 0 : 0; if (t > sec) { a.z = bz; continue; } a.dir = (Math.floor(t * 3) + i * 2) % 4; a.z = bz + Math.abs(Math.sin(t * 6 + i)) * 0.05; } if (t > sec) { res(); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); });
  }

  // 혼자 하는 것
  const SOLO = [
    { k: 'roll', t: '🌀 이불 속에서 데굴데굴', sub: '아무 생각 없이', mins: 20, en: 3, roll: true, ls: [
      ['N:이불을 돌돌 말고 침대 끝에서 끝까지 굴러 본다.', 'N:세 바퀴째에 벽에 쿵. 아무도 못 봤으니까 괜찮다.'],
      ['N:베개를 끌어안고 데굴데굴. 이불이 김밥처럼 말린다.', 'N:빠져나오는 데 오 분 걸렸다.'],
      ['N:이불 속에 쏙 들어가 동굴을 만든다. 따뜻하고 조용하다.', 'N:페르녹스의 모래바람도 여기까진 못 들어온다.']] },
    { k: 'ceiling', t: '☁️ 천장 보며 멍때리기', sub: '머리 비우기', mins: 25, en: 5, ls: [
      ['N:천장의 작은 얼룩이 오늘따라 고양이처럼 보인다.', 'N:생각이 하나둘 흘러가고, 숨이 느려진다.'],
      ['N:멀리서 부대 발전기가 낮게 웅웅거린다. 그 소리에 맞춰 숨을 쉰다.', 'N:십 분이 한 시간처럼, 한 시간이 십 분처럼.']] },
    { k: 'vlog', t: '📱 단말로 돔시티 영상 보기', sub: '관광 브이로그 · 행성 다큐', mins: 30, en: 2, ls: [
      ['N:"제6행성 오로라 관측 브이로그" 재생. 화면 가득 초록빛 커튼이 흔들린다.', 'N:…언젠가 저기 같이 가 보고 싶다.'],
      ['N:"돔시티 맛집 TOP 10". 3위가 냉삼집이다. 누군가 좋아하겠다.', 'N:댓글에 "군인 아저씨들 단골"이라고 적혀 있다. 웃음이 난다.'],
      ['N:행성 다큐멘터리. 흰모래 해변돔 밤바다에 발광 플랑크톤이 반짝인다.', 'N:눈을 감아도 파란 빛이 남는다.']] },
    { k: 'music', t: '🎧 이어폰 끼고 노래 듣기', sub: '지구 노래 · 페르녹스 라디오', mins: 25, en: 4, ls: [
      ['N:지구에서 유행했던 노래가 흘러나온다. 가사를 따라 흥얼거린다.', 'N:창밖 별빛이 박자에 맞춰 깜빡이는 것 같다.'],
      ['N:페르녹스 심야 라디오. DJ가 "오늘도 돔 밖의 모든 분들 무사하시길" 하고 인사한다.', 'N:괜히 마음이 따뜻해진다.']] },
    { k: 'window', t: '🌌 누워서 창밖 별 보기', sub: '밤에만', mins: 30, en: 4, when: night, ls: [
      ['N:창밖으로 작은 달이 은빛으로 떠 있다.', 'N:유성이 하나 긋고 지나간다. 소원을 빌 틈도 없이.'],
      ['N:돔 너머로 별이 쏟아질 듯 많다. 지구에선 본 적 없는 별자리들.', 'N:저 중 하나에 이름을 붙여 본다. 아무도 모르는 내 별.']] },
    { k: 'diary', t: '📓 엎드려서 일기 쓰기', sub: '오늘 있었던 일', mins: 20, en: 2, ls: [
      ['N:엎드려서 단말 메모장을 연다. "오늘의 페르녹스."', 'N:쓰다 보니 대위 얘기가 반이다. 지울까 하다가 그냥 둔다.'],
      ['N:오늘 먹은 것, 본 것, 웃은 것. 세 줄만 쓰려다 한 페이지가 됐다.']] },
  ];
  // 대위 생각 (썸부터)
  const MISS = { k: 'miss', t: '💭 베개 끌어안고 대위 생각', sub: '', mins: 20, en: 2, s: 2, ls: [
    ['N:베개를 끌어안고 눈을 감는다. 자꾸 그 커다란 손이 생각난다.', 'N:…베개가 너무 작다.'],
    ['N:오늘 대위가 했던 말을 다시 떠올린다. 그때 웃던 얼굴까지.', 'N:혼자 이불을 걷어찬다. 왜 이렇게 설레지.'],
    ['N:단말 사진첩을 넘기다 대위 사진에서 손가락이 멈춘다.', 'N:…보고 싶다. 방금 봤는데도.']] };
  // 대위와 같이 (방문 · 숙박 중, 연인부터)
  const TOGETHER = [
    { k: 't_cuddle', t: '🫂 같이 누워서 꼭 붙어 있기', mins: 30, s: 4, ls: [
      ['N:좁은 침대에 둘이 나란히 눕는다. 대위의 팔이 자연스럽게 베개가 된다.', 'C*:…침대가 작은 게 이럴 땐 좋네.', 'N:심장 소리를 들으며 한참을 아무 말 없이 있는다.'],
      ['N:대위 품에 파고들자 커다란 팔이 이불째 감싸 안는다.', 'C^:따뜻하다. 너 난로야?', 'P:{ob}가 더 따뜻해.', 'C~:…그럼 우리 둘이 난로네.']] },
    { k: 't_talk', t: '🌙 누워서 소곤소곤 수다', mins: 35, s: 4, ls: [
      ['N:불을 끄고 나란히 누워 천장을 본다.', 'C:오늘 제일 좋았던 거 하나만 말해 봐.', 'P:지금.', 'C*:…반칙이다. 나도 지금.'],
      ['C:어릴 때 별명 뭐였어?', 'P:비밀.', 'C^:그럼 나도 비밀. …전봇대.', 'P:{ob}가 먼저 말했다!', 'N:둘 다 웃음이 터져 이불 속에서 한참 들썩인다.']] },
    { k: 't_roll', t: '🌀 같이 이불 뒤집어쓰고 장난치기', mins: 20, s: 4, roll: true, ls: [
      ['N:이불을 뒤집어씌우자 대위가 이불 괴물이 되어 덮쳐 온다.', 'C^:잡았다.', 'N:간지럼 반격에 대위가 침대에서 떨어질 뻔한다.'],
      ['N:이불 속에서 서로 발로 툭툭 장난을 친다.', 'C*:…발 차갑다. 이리 줘.', 'N:대위가 내 발을 자기 다리 사이에 끼워 데워 준다.']] },
    { k: 't_watch', t: '📱 같이 누워서 영상 보기', mins: 40, s: 4, ls: [
      ['N:단말을 가운데 두고 나란히 엎드려 영화를 본다.', 'C;:…이거 무서운 거라며.', 'N:무서운 장면마다 대위가 내 어깨 뒤로 숨는다. 193센티미터가.'],
      ['N:"돔시티 데이트 코스 추천" 영상을 같이 본다.', 'C:여기, 여기, 여기. 다 가자.', 'P:언제?', 'C*:이번 주말부터 하나씩.']] },
  ];

  async function lounge() {
    const g = G(), S = St.S, withCap = capHere() && S.rel.cap.stage >= 4;
    const pool = [...SOLO.filter(a => !a.when || a.when()), ...(S.rel.cap.stage >= 2 && !withCap ? [MISS] : []), ...(withCap ? TOGETHER : [])];
    const it = await PX.UI.menu('🛌 침대에서 뒹굴거리기', pool.map(a => ({ t: a.t, sub: (a.sub ? a.sub + ' · ' : '') + `${a.mins}분`, k: a.k })));
    if (!it) return;
    const a = pool.find(x => x.k === it.k);
    if (!lieDown()) { PX.UI.toast('침대에 빈자리가 없어요'); return; }
    g.modal++;
    try {
      const two = a.k.startsWith('t_') && capHere();
      if (two) { capOnBed(); if (a.k === 't_cuddle' && PX.Mind) PX.Mind.setContact('CUDDLE'); G().cap.setDirTo(G().player.x, G().player.y); await U.sleep(250); }
      if (a.roll) await roll(2.4, two);
      if (two && a.k === 't_cuddle') { G().cap.showEmote('heart', 2); setTimeout(() => G().player.showEmote('heart', 1.6), 500); }
      await lines(U.pickFresh('bed_' + a.k, a.ls));
      St.advance(a.mins);
      S.energy = Math.min(100, (S.energy || 50) + (a.en || 0));
      if (a.k.startsWith('t_')) { St.addAff(2); if (!S.done.bedLoungeMem) { S.done.bedLoungeMem = 1; g.memory('침대 위에서', '좁은 침대에 나란히 누워 아무것도 안 하는 시간이 제일 좋았다.', true); } }
      if (a.k === 'diary' && !S.done.diaryMem) { S.done.diaryMem = 1; g.memory('일기', '오늘 일기의 반은 대위 얘기였다.', false); }
    } finally { PX.Dlg.close(); g.modal--; }
    PX.UI.toast(`🛌 ${a.mins}분 동안 뒹굴거렸다${a.en ? ` (기력 +${a.en})` : ''}`);
  }
  return { lounge, lieDown };
})();
