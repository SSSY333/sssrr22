// 상황 대사 고르기: 지금 장소·시간·날씨·관계·자세·동행·접촉·기력·계절에 "가장 구체적으로" 맞는 대사를 고른다
// 데이터: PX.SITU = [{ l:[대사…], m:[맵], t:[시작시, 끝시], s:[최소, 최대 단계], we:1|0, w:[날씨], seat:'sit'|'bed'|'stand',
//                     f:1(동행 중), ct:[접촉], en:'low', se:[계절], af:'field'|'op', home:'p'|'c', job, id }]
// 한 번 나온 묶음은 같은 조건의 다른 묶음을 다 볼 때까지 다시 안 나온다 (저장 기록)
'use strict';
PX.Situ = (() => {
  const U = PX.U, St = PX.St;
  const G = () => PX.Game;
  const KEYS = ['m', 't', 'we', 'w', 'seat', 'f', 'ct', 'en', 'se', 'af', 'home', 'job', 'ev'];
  let indexed = false;
  function index() { if (indexed) return; (PX.SITU || []).forEach((b, i) => { if (b.id == null) b.id = 'u' + i; }); indexed = true; }

  function now() {
    const S = St.S, g = G(), md = PX.MAPS[g.mapId] || {}, cap = g.cap, M = PX.Mind;
    const seat = g.player.seat ? (g.player.seat.obj && (g.player.seat.obj.use || (g.player.seat.obj.f && g.player.seat.obj.f.use)) === 'bed' ? 'bed' : 'sit') : 'stand';
    const o = S.cap.op;
    return {
      map: g.mapId, parent: md.kind === 'out' ? g.mapId : md.parent, h: S.time.min / 60, st: S.rel.cap.stage, we: St.isWeekend() ? 1 : 0,
      w: md.dome || md.kind === 'in' ? 'indoor' : St.weather(), seat, f: PX.Cap.mode === 'follow' ? 1 : 0, ct: M ? M.contact() : 'NONE',
      en: S.energy < 35 ? 'low' : 'ok', se: St.season(), job: S.player.job,
      af: PX.CapAct && PX.CapAct.postField && PX.CapAct.postField() ? 'field' : (o && o.phase === 'done' && St.absMin() - o.end < 720 ? 'op' : null),
      home: g.mapId === PX.JOBS[S.player.job].home ? 'p' : g.mapId === 'q_captain' ? 'c' : null,
    };
  }
  const inT = (t, h) => t[0] <= t[1] ? h >= t[0] && h < t[1] : h >= t[0] || h < t[1];
  function match(b, c) {
    if (b.s && (c.st < b.s[0] || c.st > b.s[1])) return false;
    if (b.m && !b.m.includes(c.map) && !b.m.includes(c.parent)) return false;
    if (b.t && !inT(b.t, c.h)) return false;
    if (b.we != null && b.we !== c.we) return false;
    if (b.w && !b.w.includes(c.w)) return false;
    if (b.seat && b.seat !== c.seat) return false;
    if (b.f != null && b.f !== c.f) return false;
    if (b.ct && !b.ct.includes(c.ct)) return false;
    if (b.en && b.en !== c.en) return false;
    if (b.se && !b.se.includes(c.se)) return false;
    if (b.af && b.af !== c.af) return false;
    if (b.home && b.home !== c.home) return false;
    if (b.job && b.job !== c.job) return false;
    if (b.ev) { const S = St.S, lb = PX.LORE_BY_ID && PX.LORE_BY_ID[b.ev]; if (!lb || !PX.Cal.openAt(lb, S.time, S.time.min)) return false; } // 행사 중일 때만
    return true;
  }
  // 구체성: 조건이 많을수록, 장소가 정확할수록 높다
  const spec = (b, c) => KEYS.reduce((n, k) => n + (b[k] != null ? 1 : 0), 0) + (b.ev ? 2 : 0) + (b.m && b.m.includes(c.map) ? 1 : 0) + (b.s && b.s[0] >= 4 ? 0.5 : 0) + (b.s && b.s[1] - b.s[0] <= 1 ? 1 : 0); // 관계 단계가 좁게 정해진 대사도 구체적
  const text = (b) => b.l.filter(x => typeof x === 'string').join(' ');

  // 지금 맞는 것 중 가장 구체적인 단계에서, 안 본 것부터
  function pick(minSpec = 2, strict) {
    index();
    const S = St.S, c = now(), seen = S.recent;
    const ok = (PX.SITU || []).filter(b => match(b, c) && PX.Dlg.ctxOk(text(b)) && (!PX.Mind || PX.Mind.textOk(text(b))));
    if (!ok.length) return null;
    const scored = ok.map(b => ({ b, sc: spec(b, c) })).filter(x => x.sc >= minSpec);
    if (!scored.length) return null;
    const newLines = scored.filter(x => !PX.Dlg.bundleSeen(x.b)); // 대위 대사가 아직 안 나온 것만
    if (newLines.length) scored.splice(0, scored.length, ...newLines); else if (strict) return null;
    const fresh = scored.filter(x => seen['situ' + x.b.id] == null);
    let pool;
    if (fresh.length) { const top = Math.max(...fresh.map(x => x.sc)); pool = fresh.filter(x => x.sc >= top - 0.5); }
    else { const top = Math.max(...scored.map(x => x.sc)); pool = scored.filter(x => x.sc >= top - 0.5).sort((a, b) => (seen['situ' + a.b.id] || 0) - (seen['situ' + b.b.id] || 0)).slice(0, Math.max(1, Math.ceil(scored.length / 4))); }
    const x = U.pick(pool);
    seen['situ' + x.b.id] = St.absMin();
    if (PX.Mind) { PX.Mind.notePhrases(text(x.b)); }
    return { l: x.b.l, spec: x.sc, situ: true, tease: !!x.b.tz };
  }
  // 지금 상황에 안 본 구체적인 대사가 있나 (capTalk 이 우선할지 판단)
  function hasFresh(minSpec = 2) {
    index();
    const S = St.S, c = now();
    return (PX.SITU || []).some(b => match(b, c) && spec(b, c) >= minSpec && S.recent['situ' + b.id] == null && !PX.Dlg.bundleSeen(b) && PX.Dlg.ctxOk(text(b)));
  }
  return { pick, hasFresh, now, match, spec };
})();
