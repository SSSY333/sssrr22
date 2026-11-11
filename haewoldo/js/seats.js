/* =====================================================================
   앉을 수 있는 곳 넓히기
   · 해변 파라솔 밑 돗자리, 섬 꾸미기 벤치 · 의자 · 해먹 · 그네 의자 · 피크닉 테이블에 자리 자동 생성
   · 실내 러그 · 방석 · 쿠션 장식에도 앉기
   · 「돗자리 펴기」로 편 돗자리는 자리를 떠나면 알아서 걷어 감
   ===================================================================== */
const SEAT_KINDS = {
  parasol: { n: 2, name: '파라솔 돗자리', leisure: 'mat', ground: true, side: true },
  yd_benchWood: { n: 2, name: '나무 벤치' }, yd_campChairY: { n: 1, name: '캠핑 의자' }, yd_swingChair: { n: 2, name: '흔들 그네 의자' },
  yd_hammock: { n: 2, name: '해먹', leisure: 'mat', ground: true }, yd_picnicTable: { n: 2, name: '피크닉 테이블', front: true },
};
function seatKindOf(o) { return o.kind === 'yd' ? 'yd_' + o.k : o.kind; }
function autoSeats(m = MAPS.island) {
  if (!m) return;
  for (const k of Object.keys(m.benches)) if (m.benches[k].auto) delete m.benches[k];
  const W = m.W, taken = new Set(); for (const bk of Object.values(m.benches)) for (const s of [...bk.seats, ...bk.stand]) taken.add(s[0] + ',' + s[1]);
  const free = (x, y) => inMap(x, y, m) && !m.block[y * W + x] && tileAt(x, y, m) !== T.WATER && !taken.has(x + ',' + y);
  let i = 0;
  for (const o of m.objects) {
    const K = SEAT_KINDS[seatKindOf(o)]; if (!K) continue;
    const fw = o.fw || 1, fh = o.fh || 1, seats = [], stand = [];
    const cand = K.side ? [[o.x, o.y], [o.x + 1, o.y]] : (() => { const r = []; for (let yy = o.y; yy < o.y + fh; yy++) for (let xx = o.x; xx < o.x + fw; xx++) r.push([xx, yy]); return r; })();
    for (const [sx, sy] of cand) {
      if (seats.length >= K.n) break;
      if (taken.has(sx + ',' + sy)) continue;
      if (K.side && !(sx === o.x && sy === o.y) && !free(sx, sy)) continue;
      const st = [[sx, sy + 1], [sx + 1, sy], [sx - 1, sy], [sx, sy - 1]].find(([a, b]) => free(a, b) && !(a === o.x && b === o.y));
      if (!st) continue;
      seats.push([sx, sy]); stand.push(st); taken.add(sx + ',' + sy); taken.add(st[0] + ',' + st[1]);
    }
    if (!seats.length) continue;
    const key = 'auto' + (i++);
    m.benches[key] = { name: K.name, place: placeAt(o.x, o.y, m), seats, stand, face: seats.map(() => 0), pairs: seats.length > 1 ? [[0, 1]] : [], auto: true };
    if (K.leisure) m.benches[key].leisure = K.leisure;
    if (K.ground) m.benches[key].ground = true;
    if (K.side) m.benches[key].d = seats.map(s => s[0] + s[1] + 2.3);   // 파라솔보다 앞에 그려지게
    for (const [a, b] of stand) m.block[b * W + a] = 0;
  }
}
const _buildWorldSeats = buildWorld;
buildWorld = function () { _buildWorldSeats(); try { autoSeats(); } catch (e) { console.error(e); } };
const _yardApplySeats = yardApply;
yardApply = function () { _yardApplySeats(); try { autoSeats(); } catch (e) { console.error(e); } };

/* 실내: 러그 · 방석 · 쿠션 장식에도 앉기 */
for (const k of ['rug', 'rugL', 'cushion', 'rugOrange', 'rugStripe', 'rugWave', 'rugHeart', 'catBed']) if (FURN[k] && !FURN[k].act) FURN[k].act = 'sit';

/* 「돗자리 펴기」 돗자리: 자리를 떠나면(10칸 이상 · 다른 곳 · 다음 날) 걷어 감 */
function tempMatTick() {
  const m = MAPS.island, bk = m && m.benches.tempMat; if (!bk) return;
  const P = G.player, d = G.det, [x, y] = bk.seats[0];
  const sitting = (P.seat && P.seat.bench === 'tempMat') || (d.seat && d.seat.bench === 'tempMat');
  const far = P.map !== 'island' || Math.hypot(P.x - x - 1, P.y - y - 0.5) > 10;
  if (bk.day == null) bk.day = S.day;
  if (!sitting && (far || bk.day !== S.day) && !G.busy) {
    delete m.benches.tempMat; G.tempObjs = G.tempObjs.filter(o => !o.tempMat);
    for (const a of G.actors) if (a.seat && a.seat.bench === 'tempMat') a.standUp();
    for (const k of Object.keys(G.seatOcc || {})) if (k.includes(':tempMat:')) delete G.seatOcc[k];
    toast('🧺 펴 두었던 돗자리를 개어 가방에 넣었어요');
  }
}
let _tmT = 0;
const _loopSeats = loop;
loop = function (ts) { if (G.started && S && !G.dev) { _tmT += 1 / 60; if (_tmT > 1.5) { _tmT = 0; try { tempMatTick(); } catch (e) { } } } _loopSeats(ts); };
const _startGameSeats = startGame;
startGame = function (state, isNew) { _startGameSeats(state, isNew); try { autoSeats(); } catch (e) { } };
