// 방금까지 한 일 기록 (AI 대화가 지금 위치 · 방금 한 행동을 이어서 말할 수 있게)
'use strict';
PX.Recent = (() => {
  const St = PX.St;
  const list0 = () => { const S = St.S; if (!Array.isArray(S.actLog)) S.actLog = []; return S.actLog; }; // S.recent 는 대사 중복 방지용(객체)이라 따로
  function note(t) {
    if (!St.S || !t) return;
    const r = list0(), now = St.absMin(), map = PX.Game && PX.Game.mapId;
    if (r[0] && r[0].t === t && now - r[0].at < 5) return; // 같은 일 연달아 X
    r.unshift({ t, at: now, map });
    r.length = Math.min(r.length, 14);
  }
  // 최근 몇 시간 안에 한 일 (오래된 것 → 최근)
  function lines(hours = 4) {
    const now = St.absMin();
    return list0().filter(x => now - x.at <= hours * 60).slice(0, 8).reverse().map(x => {
      const ago = now - x.at, when = ago < 3 ? '방금' : ago < 60 ? `${ago}분 전` : `${Math.round(ago / 60)}시간 전`;
      const place = x.map && PX.MAPS[x.map] ? ` @${PX.MAPS[x.map].name}` : '';
      return `- ${when}: ${x.t}${place}`;
    });
  }
  // 장소 설명 (AI가 그 공간답게 말하도록)
  const DESC = {
    jeep_in: '부대 지프 안. 좁다. 대위는 운전석, 플레이어는 조수석(또는 둘이 뒷좌석). 대위는 덩치가 커서 무릎이 핸들에 닿고 천장에 머리를 자주 부딪힌다. 창밖은 드라이브 장소.',
    storage: '부대 지하 창고 C-7. 좁고 어둡고 먼지 냄새. 선반과 상자 사이. 부대원 몰래 숨어 있는 중이라 소리를 낮춰야 한다. 밖에서 훈련 구령이 들린다.',
    inn_bathroom: '은밀숙소 객실 욕실. 김이 서리고 바닥이 미끄럽다. 욕조와 샤워 부스.',
    onsen: '제4 광물온천. 공용 탕이라 다른 손님이 있을 수 있다. 가족탕은 둘만 쓰는 작은 탕.',
    q_captain: '대위의 막사(자기 방). 대위가 가장 편한 곳. 좁은 침대, 군용 담요, 냉각기, 작업대의 광물.',
    q_player: '플레이어의 막사(숙소).', apt_player: '플레이어의 집(돔시티 주거구역).',
  };
  function place() {
    const g = PX.Game, id = g && g.mapId, md = PX.MAPS[id] || {}, S = St.S;
    let d = DESC[id] || (md.innRoom ? '은밀숙소 객실. 둘만 있는 방.' : md.home ? '플레이어 숙소.' : '');
    if (id === 'jeep_in' && S.car) { const dm = PX.MAPS[S.car.dest]; if (dm) d += ` 지금 차를 세운 곳: ${dm.name}.`; const s = g.player.seat, bk = g.mapId === 'jeep_in' && s && s.obj && s.obj.fid === 'carback'; d += bk ? ' 지금 둘은 뒷좌석에 붙어 앉아 있다.' : ' 지금 둘은 앞좌석에 나란히 앉아 있다.'; }
    if (g && g.player && g.player.seat && id !== 'jeep_in') { const o = g.player.seat.obj; d += o && o.f ? ` 플레이어는 ${o.f.name}에 ${o.use === 'bed' || (o.f && o.f.use === 'bed') ? '누워' : '앉아'} 있다.` : ''; }
    if (S.player.bath) d += ' 둘 다 목욕 가운 차림.';
    return d;
  }
  return { note, lines, place };
})();
