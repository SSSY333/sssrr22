/* =====================================================================
   관계 단계가 왜 안 오르는지 알려 주기
   · 호감도만이 아니라 「첫 산책」 · 「나란히 앉기」 같은 이벤트와 날짜 조건도 필요해요
   · 형사님 메뉴 위 요약에 「아직 남은 조건」과 하는 방법을 보여 주고,
     호감도가 다 찼는데 다른 조건이 남았으면 하루 한 번 알려 줘요
   · 함께 걸은 거리는 「함께 다니기」를 끝내도 이어서 쌓여요
   ===================================================================== */
const STAGE_HOW = {
  firstWalk: '「함께 다니기」로 형사님과 한참 걷다가 부두 · 해변 · 등대 · 해안 산책로에서 잠깐 멈춰 서요',
  firstSit: '형사님과 함께 다니다가 벤치에서 「함께 앉기」를 해요',
  lovers: '썸 단계에서 호감도를 채운 뒤, 저녁에 형사님과 바닷가 · 등대 · 부두에 함께 가요',
  nickname: '연인이 되고 사흘 뒤, 오후에 형사님 곁에 있으면 애칭 이벤트가 와요',
  engaged: '깊은 연인이 된 뒤 시간이 지나면 형사님이 등대로 불러요',
  married: '약혼 후 결혼 날짜를 정해요',
  met: '형사님을 만나 말을 걸어요',
};
Object.assign(FLAG_LABELS, { firstWalk: '첫 산책 이벤트 (함께 다니다 바닷가 · 등대에서 멈추기)', firstSit: '나란히 앉기 이벤트 (함께 다니다 벤치에 앉기)' });
/* 다음 단계까지 남은 조건 [설명, 하는 방법] */
function stageMissing() {
  const r = S.rel, next = STAGES[r.stage]; if (!next || !next.need) return [];
  const nd = next.need, out = [];
  if (nd.aff && r.aff < nd.aff) out.push([`호감도 ${r.aff}/${nd.aff}`, '대화 · 선물 · 함께 다니기로 쌓여요']);
  if (nd.days && daysKnown() < nd.days) out.push([`알고 지낸 날 ${daysKnown()}/${nd.days}일`, '날이 지나면 채워져요']);
  if (nd.together && r.together < nd.together) out.push([`함께 보낸 시간 ${Math.floor(r.together)}/${nd.together}분`, '함께 다니거나 나란히 앉아 있으면 쌓여요']);
  if (nd.loverDays && loverDays() < nd.loverDays) out.push([`사귄 지 ${loverDays()}/${nd.loverDays}일`, '날이 지나면 채워져요']);
  for (const f of nd.flags || []) if (!r.flags[f]) out.push([(FLAG_LABELS[f] || f).replace(/ \(.*\)$/, ''), STAGE_HOW[f] || '']);
  return out;
}
const _relSummaryHTMLHelp = relSummaryHTML;
relSummaryHTML = function () {
  const html = _relSummaryHTMLHelp(), miss = stageMissing(), next = STAGES[S.rel.stage];
  if (!next || !miss.length) return html;
  const tip = miss.map(([t, how]) => `○ ${t}${how ? ` — ${how}` : ''}`).join('<br>');
  return html + `<div class="relneed stageMiss">「${next.name}」까지 남은 것<br>${tip}</div>`;
};
/* 호감도는 찼는데 다른 조건이 남았을 때 하루 한 번 알려 주기 */
const _checkEventsHelp = checkEvents;
checkEvents = function () {
  _checkEventsHelp();
  if (!S || !S.rel.flags.met || G.busy) return;
  // 함께 걸은 거리 이어서 쌓기
  if (G.walkedTogether > (S.rel.walkAcc || 0)) S.rel.walkAcc = G.walkedTogether;
  const r = S.rel, next = STAGES[r.stage]; if (!next || !next.need || !next.need.aff || r.aff < next.need.aff) return;
  if (r.daily.stageHint) return;
  const miss = stageMissing(); if (!miss.length) return;
  r.daily.stageHint = true;
  const [t, how] = miss[0];
  setTimeout(() => toast(`💗 호감도는 충분해요! 「${next.name}」까지 남은 것: ${t}${how ? ' — ' + how : ''}`), 600);
};
const _startCompanionHelp = startCompanion;
startCompanion = function (opts) { const r = _startCompanionHelp(opts); if (S && S.rel.walkAcc && !S.rel.flags.firstWalk) G.walkedTogether = S.rel.walkAcc; return r; };
