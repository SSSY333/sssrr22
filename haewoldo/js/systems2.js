'use strict';
/* =========================================================
 *  해월도 v6 — 수사 수첩 · 숨겨진 장소 · 보물지도
 * ========================================================= */
const CASES = {
  orange: { name: '사라진 귤 상자', icon: '🍊', place: '귤 농장', at: 'farm', cond: () => S.day >= 3 && S.rel.flags.met,
    intro: '농장 아주머니가 발을 동동 구르고 있다. "귤 상자 하나가 감쪽같이 사라졌어!"',
    clues: [['cart', '수레 자국', 'island', [31.5, 39.5], '땅에 수레 바퀴 자국이 길게 나 있다. 마을 쪽으로 이어진다.'], ['paper', '배송표', 'island', [41.5, 37.5], '「해월 횟집 앞 — 귤 1상자」라고 적힌 배송표가 떨어져 있다.'], ['orange1', '떨어진 귤', 'island', [36.5, 39.5], '길가에 귤 한 알. 상자에서 굴러떨어진 것 같다.']],
    talks: [['farmer', '아침에 상자를 농장 입구에 내놨는데, 잠깐 들어갔다 나오니 없더라고!'], ['postman', '아, 귤 상자요? 아침에 배송표 붙은 거 하나 실어 갔는데… 횟집 거 아니었어요?']],
    q: '귤 상자는 어디로 갔을까?', opts: ['까마귀가 물어 갔다', '배송 착오로 다른 곳에 갔다', '누군가 몰래 가져갔다'], ans: 1, truth: '배송 착오',
    solve: '우체부 아저씨가 배송표를 잘못 보고 횟집으로 실어 간 거였다! 귤 상자는 횟집 앞에 고이 놓여 있었다.' },
  light: { name: '등대의 수상한 불빛', icon: '🗼', place: '등대', at: 'lighthouse', cond: () => S.day >= 5 && S.rel.stage >= 2,
    intro: '밤마다 등대 쪽에서 깜빡이는 불빛을 봤다는 이야기가 들린다.',
    clues: [['flashlight', '손전등', 'island', 'lighthouseC1', '작은 손전등이 풀숲에 떨어져 있다. 배터리가 거의 닳았다.'], ['foot', '발자국', 'island', 'lighthouseC2', '등대 뒤편으로 이어진 운동화 발자국. 섬사람 신발은 아닌 것 같다.'], ['photoP', '사진', 'island', 'lighthouseC3', '벤치 위에 인화된 사진 한 장. 별과 등대가 길게 찍혀 있다.']],
    talks: [['keeper', '불빛? 내 등대 불은 일정해. 깜빡거리는 건 내 것이 아니여.'], ['tourist', '어젯밤 사진 찍는 분이 삼각대를 들고 등대 쪽으로 가던데요?']],
    q: '등대의 불빛은 무엇이었을까?', opts: ['밀수선의 신호', '관광객의 야간 촬영', '유령의 불빛'], ans: 1, truth: '관광객의 야간 촬영',
    solve: '별 궤적 사진을 찍으려던 관광객이 손전등으로 구도를 잡던 불빛이었다. 사과의 편지와 사진 한 장이 파출소로 왔다.' },
  cat: { name: '사라진 항구고양이', icon: '🐈', place: '부두', at: 'harbor', cond: () => S.day >= 7,
    intro: '부두의 노랑이가 이틀째 보이지 않는다고 박 씨 아저씨가 걱정한다.',
    clues: [['bowl', '사료 그릇', 'island', 'harborC1', '사료 그릇이 반쯤 비어 있다. 누군가 먹긴 먹었다.'], ['foot', '발자국', 'island', 'harborC2', '작은 고양이 발자국이 해녀창고 쪽으로 나 있다.'], ['paper', '목격담 메모', 'island', 'harborC3', '"밤에 창고 문틈으로 뭔가 쏙 들어갔음" — 누군가의 메모.']],
    talks: [['fisher', '노랑이가 밥은 먹는데 낮에 통 안 보여. 어디서 자는 건지 원.'], ['okja', '요즘 창고에서 뭔가 부스럭거려. 쥐인 줄 알았지.']],
    q: '노랑이는 어디에 있을까?', opts: ['다른 섬으로 떠났다', '해녀창고에서 쉬고 있다', '누가 데려갔다'], ans: 1, truth: '창고에서 쉬고 있던 것',
    solve: '해녀창고 구석, 따뜻한 그물 더미 위에서 노랑이가 새끼 고양이들과 함께 쉬고 있었다!' },
  islet: { name: '무인도의 오래된 상자', icon: '📦', place: '무인도', at: 'isletBox', cond: () => S.rel.stage >= 3 && S.flagsIslet,
    intro: '무인도 모래 속에 반쯤 묻힌 낡은 상자를 발견했다. 자물쇠가 잠겨 있다.',
    clues: [['key', '녹슨 열쇠', 'islet', [15.5, 11.5], '바위틈에 녹슨 열쇠가 끼어 있다.'], ['mapP', '지도 조각', 'islet', [9.5, 12.5], '물에 젖은 종이. 무인도 동쪽 끝에 X 표시가 있다.'], ['mark', '표식', 'islet', [14.5, 6.5], '나무에 새겨진 이니셜 「해·월」과 오래된 날짜.']],
    talks: [['keeper', '옛날에 무인도에서 소풍하던 아이들이 있었지. 보물 상자를 묻는다고 난리였어.'], ['grandpa', '「해·월」? 우리 동네 옛 학교 아이들이 쓰던 표시여.']],
    q: '상자는 누가 남긴 걸까?', opts: ['해적의 보물', '옛 주민이 남긴 기념품', '떠내려온 쓰레기'], ans: 1, truth: '옛 주민이 남긴 기념품',
    solve: '상자 안에는 옛 해월초 아이들의 사진과 편지, 그리고 비밀 해변 가는 길이 그려진 지도가 있었다.' },
  festival: { name: '축제 전날의 분실물', icon: '🎪', place: '마을회관', at: 'hallFront', cond: () => Object.values(S.fest).some(f => f.joined),
    intro: '축제 준비물 상자 하나가 사라졌다! 이장님이 회관에서 발을 동동 구른다.',
    clues: [['list', '준비 명단', 'in_hall', [6.5, 2.5], '준비 명단: 「현수막 상자 — 학교 창고로 이동」이라고 연필로 적혀 있다.'], ['paper', '보관 기록', 'in_hall', [1.5, 3.5], '보관 기록부: 어제 오후 아이들이 상자를 옮겼다는 서명.'], ['foot', '끌린 자국', 'island', 'hallC1', '회관 앞에서 학교 쪽으로 상자를 끈 자국이 있다.']],
    talks: [['chief', '분명히 회관 구석에 뒀는데 말이여! 누가 가져간 거여?'], ['kid', '어제 상자 옮겼어요! 학교로 가져가라고 써 있었어요!']],
    q: '준비물 상자는 어디로 갔을까?', opts: ['도둑맞았다', '다른 장소로 잘못 운반됐다', '바람에 날아갔다'], ans: 1, truth: '잘못 운반된 것',
    solve: '아이들이 명단을 보고 상자를 학교 창고로 옮겨 둔 것이었다. 상자는 무사히 회관으로 돌아왔다.' },
};
const CASE_ORDER = ['orange', 'light', 'cat', 'islet', 'festival'];
function caseClueXY(c) { const p = c[3]; if (Array.isArray(p)) return p; return P_(p); }
function caseState(id) { return S.cases[id]; }
function caseDiscover(id) {
  if (S.cases[id]) return;
  S.cases[id] = { step: 'report', clues: {}, talks: {}, day: S.day, wrong: 0 };
  qSet('case_' + id, { state: 'ACTIVE' });
  toast(`🔎 새 사건 — ${CASES[id].icon} ${CASES[id].name}`);
  setCaseObjects();
}
function caseCheckTriggers() {
  for (const id of CASE_ORDER) {
    if (S.cases[id]) continue;
    const C = CASES[id];
    if (id === 'light') continue;            // 등대 사건은 방문객 신고 또는 밤 등대에서
    if (id === 'islet') { if (S.rel.stage >= 3 && G.player.map === 'islet') caseDiscover(id); continue; }
    if (C.cond()) { caseDiscover(id); return; }
  }
  if (!S.cases.light && S.day >= 8 && S.rel.stage >= 2 && S.min >= 20 * 60 && curPlace() === 'lighthouse') caseDiscover('light');
}
for (const id of CASE_ORDER) QDEF['case_' + id] = { title: () => `${CASES[id].icon} ${CASES[id].name}`, kind: 'once', view: () => {
  const st = S.cases[id], C = CASES[id]; if (!st) return { hidden: true };
  const nClue = Object.keys(st.clues).length, nTalk = Object.keys(st.talks).length;
  if (st.step === 'report') return { desc: C.intro, goal: '형사님에게 사건 상담하기', target: { map: G.det.map, x: G.det.x, y: G.det.y }, place: '형사님 곁' };
  if (st.step === 'investigate') {
    const next = C.clues.find(c => !st.clues[c[0]]);
    if (next) { const [x, y] = caseClueXY(next); return { desc: '현장의 반짝이는 단서를 조사해요.', goal: `단서 찾기`, prog: [nClue, C.clues.length], target: { map: next[2], x, y }, place: C.place }; }
    const tk = C.talks.find(t => !st.talks[t[0]]);
    if (tk) { const a = G.actors.find(v => v.id === tk[0]); return { desc: '주민들에게 탐문해요.', goal: `${NPC_LOOKS[tk[0]].name}에게 물어보기`, prog: [nTalk, C.talks.length], target: a ? { map: a.map, x: a.x, y: a.y } : null }; }
  }
  return { desc: '단서가 모두 모였어요.', goal: '수사 수첩에서 추리하기 (메뉴 → 수첩)', state: 'READY_TO_COMPLETE' };
} };
function setCaseObjects() {
  G.tempObjs = G.tempObjs.filter(o => !o.clue);
  if (!S) return;
  for (const [id, st] of Object.entries(S.cases)) {
    if (st.step !== 'investigate') continue;
    for (const c of CASES[id].clues) { if (st.clues[c[0]]) continue; const [x, y] = caseClueXY(c); G.tempObjs.push({ kind: 'prop', v: c[0], x: Math.floor(x), y: Math.floor(y), map: c[2], solid: false, clue: { id, c } }); }
  }
}
async function caseConsult(id) {
  const st = S.cases[id], C = CASES[id], c = casualOn(), d = G.det;
  st.step = 'investigate';
  await say('me', 'normal', toBanmalIf(`형사님, ${C.place}에서 이상한 일이 있어요. ${C.intro.replace(/^.*?"/, '"')}`));
  await say('det', 'serious', c ? `${C.name}… 좋아, 같이 보자. 현장부터 가 보는 게 순서야.` : `${C.name}… 알겠습니다. 같이 보죠. 현장부터 가 보는 게 순서예요.`);
  await say('det', 'tease', c ? '수첩 챙겼지? 단서 찾으면 꼭 적어 둬. 탐문은 주민들한테 직접 물어보고.' : '수첩 챙기세요. 단서를 찾으면 적어 두고, 탐문은 주민분들께 직접 물어보면 돼요.');
  setCaseObjects(); qSet('case_' + id, { state: 'ACTIVE' }); memRecent('case', `${C.name} 수사를 시작했다`);
  if (!S.comp && !detPlan(S.min).duty) { await say('det', 'smile', c ? '마침 시간 있어. 같이 다니자.' : '마침 시간이 비네요. 같이 다니죠.'); startCompanion(); }
}
async function inspectClue(o) {
  const { id, c } = o.clue, st = S.cases[id];
  st.clues[c[0]] = S.day; G.tempObjs = G.tempObjs.filter(x => x !== o);
  Sound.sfx('coin'); burst(G.player, 'spark', 4);
  await say('narr', '', `🔍 단서 발견: ${c[1]}`); await say('narr', '', c[4]);
  if (S.comp && dist(G.det, G.player) < 4) await say('det', 'serious', casualOn() ? pick(['오, 그거 중요하겠는데. 적어 둬.', '좋아, 하나 더 찾았다.', '역시 눈썰미 좋네.']) : pick(['오, 그거 중요해 보이네요. 적어 두세요.', '좋아요, 하나 더 찾았네요.', '역시 눈썰미가 좋으시네요.']));
  updateQuestBtn(); save();
}
async function caseTalk(a) {
  for (const [id, st] of Object.entries(S.cases)) {
    if (st.step !== 'investigate') continue;
    const t = CASES[id].talks.find(x => x[0] === a.id && !st.talks[x[0]]);
    if (t) { await say(a.id, 'normal', t[1]); st.talks[t[0]] = S.day; toast(`📝 탐문 기록 — ${NPC_LOOKS[a.id].name}`); updateQuestBtn(); return true; }
  }
  return false;
}
function caseReady(id) { const st = S.cases[id], C = CASES[id]; return st && st.step === 'investigate' && C.clues.every(c => st.clues[c[0]]) && C.talks.every(t => st.talks[t[0]]); }
async function caseDeduce(id) {
  const st = S.cases[id], C = CASES[id], c = casualOn();
  await say('narr', '', `📒 ${C.name} — 단서: ${C.clues.map(x => x[1]).join(', ')} / 탐문: ${C.talks.map(x => NPC_LOOKS[x[0]].name).join(', ')}`);
  await say('narr', '', C.q);
  const k = await choose(C.opts);
  if (k !== C.ans) { st.wrong++; await say('narr', '', '…뭔가 앞뒤가 맞지 않는다. 단서를 다시 읽어 보자.'); if (G.det.visible && dist(G.det, G.player) < 6) await say('det', 'smile', c ? '음, 그건 좀 아닌 것 같아. 배송표랑 증언을 같이 놓고 봐.' : '음, 그건 조금 아닌 것 같아요. 단서들을 같이 놓고 보세요.'); return false; }
  st.step = 'solved'; st.solvedDay = S.day;
  await say('narr', '', '💡 ' + C.solve);
  S.stats.cases++; S.rep += 2;
  payOnce('case_' + id, () => { S.money += 5000; floatText(G.player, '+5,000원'); });
  if (S.stats.cases === 1) treasureFrag('case');
  qSet('case_' + id, { state: 'COMPLETED' });
  addRumor('case', { case: C.name, truth: C.truth }, { key: 'case' + id, days: 9 });
  memPerm('case_' + id, { name: C.name }); memRecent('case', `${C.name}을(를) 함께 해결했다`);
  S.rel.daily.caseSolved = id;
  if (id === 'cat') { const cat = G.pets.find(p => p.vid === 'cheese'); if (cat) cat.visible = true; }
  if (id === 'orange') unlockHidden('h_cellar', true);
  if (id === 'islet') unlockHidden('h_secret', true);
  if (id === 'light') unlockHidden('h_view', true);
  await addAlbum(C.name + ' 해결', 'case');
  if (S.comp && dist(G.det, G.player) < 4) await caseSolvedPhoto(id);
  return true;
}
/* 연계 이벤트 3 — 사건 해결 기념사진 */
async function caseSolvedPhoto(id) {
  const c = casualOn(), d = G.det;
  d.lookAt(G.player);
  await say('det', 'laugh', c ? '해결! 우리 콤비 꽤 괜찮은데? 기념으로 한 장 찍자.' : '해결이네요! 저희 꽤 좋은 콤비인데요? 기념으로 한 장 찍죠.');
  flashFx(); Sound.sfx('bell');
  await addAlbum(`${CASES[id].name} 기념사진`, 'case');
  if (!S.ward.p.detective) { giveOutfit('detective'); toast('🕵️ 탐정 콤비 의상이 옷장에 들어갔어요'); }
  if (payOnce('caseFurn', () => furnGive('souvenir'))) toast('🛋 특별 가구 「기념품 선반」 해금!');
}
function flashFx() { const f = $('#flash'); f.classList.add('on'); clearTimeout(G._flashT); G._flashT = setTimeout(() => f.classList.remove('on'), 110); }
function toBanmalIf(t) { return casualOn() ? toBanmalMe(t) : t; }

/* ---------------- 숨겨진 장소 ---------------- */
function unlockHidden(id, quiet) {
  if (S.hidden[id]) return false;
  S.hidden[id] = { day: S.day, visited: false };
  toast(`🗺 숨겨진 장소 발견 — ${HIDDEN_DEFS[id].icon} ${HIDDEN_DEFS[id].name}${quiet ? ' (지도에 등록)' : ''}`);
  qSet('hidden_' + id, { state: 'ACTIVE' });
  memRecent('explore', `${HIDDEN_DEFS[id].name}을(를) 발견했다`);
  return true;
}
for (const id of Object.keys(HIDDEN_DEFS)) QDEF['hidden_' + id] = { title: () => `${HIDDEN_DEFS[id].icon} ${HIDDEN_DEFS[id].name} 탐험`, view: () => {
  if (!S.hidden[id]) return { hidden: true };
  if (S.hidden[id].visited) return { hidden: true };
  const src = HIDDEN_DEFS[id].from, pt = (MAPS[src].portals || []).find(p => p.id === id);
  return { desc: '새로 찾은 길. 안쪽엔 무엇이 있을까?', goal: '안으로 들어가 둘러보기', target: pt ? { map: src, x: pt.x + 0.5, y: pt.y + 0.5 } : null, time: id === 'h_cave' ? '썰물 때만 들어갈 수 있어요 · ' + tideText() : '' };
} };
function hiddenCheck() {
  const P = G.player, pl = curPlace();
  if (!S.hidden.h_forest && pl === 'forest' && S.day >= 4 && ((S.min >= 16 * 60 && S.min < 19 * 60) || (S.comp && S.rel.stage >= 3))) {
    const pt = MAPS.island.portals.find(p => p.id === 'h_forest'); if (Math.hypot(P.x - pt.x, P.y - pt.y) < 9) { unlockHidden('h_forest'); toast('🌲 노을빛 사이로 숲 안쪽 오솔길이 보여요'); }
  }
  if (!S.hidden.h_cave && pl === 'rocks' && lowTide()) unlockHidden('h_cave');
  if (!S.hidden.h_view && pl === 'lighthouse' && S.min >= 20 * 60 && S.comp && S.rel.stage >= 3) unlockHidden('h_view');
}
function portalVisible(p) { if (!S || !S.hidden[p.id]) return false; if (p.id === 'h_cave') return lowTide(); return true; }
function setPortalObjects() {
  for (const mid of ['island', 'islet']) {
    const m = MAPS[mid]; m.objects = m.objects.filter(o => o.kind !== 'portal');
    for (const p of m.portals || []) m.objects.push({ kind: 'portal', v: p.id === 'h_cave' ? 'cave' : p.id === 'h_cellar' ? 'cellar' : 'path', x: p.x, y: p.y, solid: false, portal: p, hide: () => !portalVisible(p) });
  }
  for (const id of Object.keys(HIDDEN_DEFS)) { const m = MAPS[id]; if (!m) continue; m.objects = m.objects.filter(o => o.kind !== 'portal' && o.kind !== 'dig'); m.objects.push({ kind: 'portal', v: 'path', x: m.exitTile[0], y: m.exitTile[1], solid: false, back: true }); if (!S.paid['dig_' + id]) m.objects.push({ kind: 'dig', x: Math.floor(m.dig[0]), y: Math.floor(m.dig[1]), solid: false, dig: id }); }
}
async function enterHidden(p) {
  if (p.id === 'h_cave' && !lowTide()) { toast('🌊 물이 차 있어 들어갈 수 없어요. 썰물: ' + tideText()); return; }
  const m = MAPS[p.id];
  await goMap(p.id, m.spawn.in[0], m.spawn.in[1]);
  if (!S.hidden[p.id].visited) { S.hidden[p.id].visited = true; qSet('hidden_' + p.id, { state: 'COMPLETED' }); memPerm('hidden_' + p.id, { name: HIDDEN_DEFS[p.id].name }); }
  runEvent(async () => {
    await say('narr', '', { h_forest: '이끼 낀 오래된 정자. 바람 소리만 들리는, 섬에서 가장 조용한 곳이다.', h_cave: '썰물에만 열리는 동굴. 천장에서 물방울이 똑, 똑 떨어진다. 벽에 조개껍데기가 반짝인다.', h_secret: '무인도 반대편, 아무도 모르는 작은 해변. 모래가 유난히 하얗다.', h_view: '등대 뒤편 바위 위의 작은 전망대. 섬 전체와 밤바다가 한눈에 보인다.', h_cellar: '오래된 귤 저장고. 나무 상자에서 달큰한 귤 향이 아직 남아 있다.' }[p.id]);
    if (S.comp && dist(G.det, G.player) < 4) await say('det', 'smile', casualOn() ? pick(['여기 이런 데가 있었어? 섬에 십 년 넘게 있었는데 처음 와 봐.', '우리 둘만 아는 장소 하나 생겼네.', '다음에 또 오자. 여긴 데이트 장소로 딱이다.']) : pick(['여기 이런 곳이 있었네요? 저도 처음 와 봐요.', '섬에 이런 곳이 숨어 있었다니.', '나중에 또 와 봐야겠네요.']));
    await say('narr', '', '💡 어딘가에 흙이 볼록한 자리가 있다. 파 보자. (나갈 때는 아래쪽 길로)');
  });
}
async function leaveHidden() {
  const id = M.id, src = HIDDEN_DEFS[id].from, p = MAPS[src].portals.find(q => q.id === id);
  await goMap(src, p.x + 0.5, p.y + 0.5);
}
async function digAt(o) {
  const id = o.dig;
  if (!payOnce('dig_' + id, () => { })) return;
  M.objects = M.objects.filter(x => x !== o);
  const P = G.player; P.dig = true; await sleep(1100); P.dig = false; Sound.sfx('coin'); burst(P, 'spark', 6);
  const rewards = { h_forest: ['oldPhoto', '오래된 사진 한 장 — 정자 앞에서 웃는 옛 마을 사람들'], h_cave: ['pearl', '동굴 속 진주'], h_secret: ['shellDeco', '하얀 소라 장식'], h_view: ['frameLight', '등대 프레임'], h_cellar: ['orangeCrate', '옛 귤 상자'] }[id];
  const [k, desc] = rewards;
  if (k === 'pearl') S.inv.pearl = (S.inv.pearl || 0) + 1; else if (k === 'frameLight') { if (!S.frames.includes('lighthouse')) S.frames.push('lighthouse'); } else if (FURN[k]) furnGive(k); else if (k === 'oldPhoto') S.album.unshift({ id: 'old' + S.day, title: '오래된 사진', cat: 'travel', kind: 'travel', day: S.day, date: dateLabel(), time: fmtTime(S.min), place: HIDDEN_DEFS[id].name, img: oldPhotoImg(), desc });
  await say('narr', '', `✨ 발견! ${desc}`);
  if (!S.paid.hiddenFrag) { S.paid.hiddenFrag = S.day; treasureFrag('hidden'); }
}
function oldPhotoImg() { const c = mkCanvas(130, 98), g = c.getContext('2d'); g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, 130, 98); g.fillStyle = '#b9a07a'; g.fillRect(6, 6, 118, 70); g.fillStyle = '#8a7050'; for (let i = 0; i < 5; i++) { fillEllipse(g, 25 + i * 20, 48, 6, 7, '#7a6040'); g.fillRect(20 + i * 20, 54, 10, 18); } g.fillStyle = '#5a4630'; g.font = '9px serif'; g.fillText('해월 · 1987', 40, 90); try { return c.toDataURL('image/jpeg', 0.8); } catch (e) { return null; } }

/* ---------------- 보물지도 ---------------- */
const FRAG_SRC = { fish: '낚시', shell: '조개 채집', favor: '주민 부탁', case: '사건 해결', festival: '축제 보상', hidden: '숨겨진 장소 탐험' };
function treasureFrag(src) {
  if (S.treasure.frags[src]) return;
  S.treasure.frags[src] = S.day;
  const n = Object.keys(S.treasure.frags).length;
  toast(`🗺 보물지도 조각 획득! (${n}/6 · ${FRAG_SRC[src]})`);
  if (n === 1) qSet('treasure', { state: 'ACTIVE' });
  if (n >= 6) qSet('treasure', { state: 'READY_TO_COMPLETE' });
}
QDEF.treasure = { title: '🗺 해월도 보물지도', view: () => {
  const T2 = S.treasure, n = Object.keys(T2.frags).length;
  if (T2.dug) return { hidden: true };
  if (n < 6) return { desc: '낚시·조개·부탁·사건·축제·탐험에서 조각을 모아요.', goal: '지도 조각 모으기', prog: [n, 6] };
  if (!T2.restored) return { desc: '조각이 다 모였어요!', goal: '수첩 → 보물지도에서 지도 복원' };
  if (!T2.deduced) return { desc: '복원한 지도를 보고 위치를 추리해요.', goal: '수첩 → 보물지도에서 위치 추리' };
  const p = P_('digSpot'); return { desc: '풍차 언덕 아래, X 표시가 있는 곳!', goal: '그 자리에서 땅 파기', target: { map: 'island', x: p[0], y: p[1] }, place: '풍차 언덕' };
} };
function treasureMapImg(restored) {
  const W = 180, H = 120, c = mkCanvas(W, H), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#e9d9b0'; g.fillRect(0, 0, W, H);
  buildBigMap(); const b = BIGMAP.base; g.globalAlpha = 0.55; g.drawImage(b, 30, 10, b.width - 60, b.height - 24, 6, 6, W - 12, H - 12); g.globalAlpha = 1;
  g.fillStyle = 'rgba(122,82,54,0.35)'; g.fillRect(0, 0, W, H);
  if (restored) { const m = MAPS.island, s = BIGMAP.s, p = P_('digSpot'); const X = ((p[0] - p[1] + m.H) * s - 30) * (W - 12) / (b.width - 60) + 6, Y = ((p[0] + p[1]) * s / 2 + 4 - 10) * (H - 12) / (b.height - 24) + 6; g.strokeStyle = '#c0392b'; g.lineWidth = 3; g.beginPath(); g.moveTo(X - 5, Y - 5); g.lineTo(X + 5, Y + 5); g.moveTo(X + 5, Y - 5); g.lineTo(X - 5, Y + 5); g.stroke(); }
  const have = Object.keys(S.treasure.frags), keys = Object.keys(FRAG_SRC);
  keys.forEach((k, i) => { if (restored || have.includes(k)) return; const x = (i % 3) * (W / 3), y = Math.floor(i / 3) * (H / 2); g.fillStyle = '#4a3a30'; g.fillRect(x, y, W / 3, H / 2); g.fillStyle = '#6a5a48'; g.font = '14px sans-serif'; g.fillText('?', x + W / 6 - 4, y + H / 4 + 5); });
  g.strokeStyle = '#7a5236'; g.lineWidth = 1; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(i * W / 3, 0); g.lineTo(i * W / 3, H); g.stroke(); } g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  return c.toDataURL();
}
async function treasureDig() {
  const T2 = S.treasure; if (T2.dug) return;
  T2.dug = S.day; const P = G.player;
  P.dig = true; await sleep(1500); P.dig = false; Sound.sfx('bell'); burst(P, 'spark', 10);
  await say('narr', '', '쿵! 삽 끝에 단단한 것이 닿았다. …오래된 보물 상자다!');
  payOnce('treasureReward', () => { furnGive('chest'); furnGive('shipModel'); giveOutfit('sailor'); S.inv.pearl = (S.inv.pearl || 0) + 1; S.money += 10000; });
  await say('narr', '', '🎁 보물 상자 가구 · 옛 범선 모형 · 세일러 의상 · 진주 · 10,000원을 얻었다! 집에 장식해 보자.');
  S.album.unshift({ id: 'tr' + S.day, title: '해월도 보물', cat: 'travel', kind: 'travel', day: S.day, date: dateLabel(), time: fmtTime(S.min), place: '풍차 언덕', img: oldPhotoImg(), desc: '보물 상자 속 옛 사진' });
  qSet('treasure', { state: 'COMPLETED' }); memPerm('treasure', {});
  S.rel.flags.treasureDecorPending = true;
  if (S.comp && dist(G.det, P) < 4) { await say('det', 'surprise', casualOn() ? '진짜 나왔어?! 하하, 해월도에 보물이 있었다니. 우리 집에 두자.' : '진짜 나왔네요?! 해월도에 보물이 있었다니. 집에 장식하면 멋지겠어요.'); addAff(4, { event: true }); memRecent('treasure', '함께 보물을 찾았다'); }
}

/* ---------------- 수첩 화면 ---------------- */
function notebookMenu(tab = 'case') {
  const tabs = `<div class="ptabs"><button data-t="case" class="${tab === 'case' ? 'on' : ''}">🔎 수사 수첩</button><button data-t="explore" class="${tab === 'explore' ? 'on' : ''}">🧭 탐험 수첩</button><button data-t="treasure" class="${tab === 'treasure' ? 'on' : ''}">🗺 보물지도</button></div>`;
  let html = '';
  if (tab === 'case') {
    html = CASE_ORDER.map(id => {
      const C = CASES[id], st = S.cases[id];
      if (!st) return `<div class="nb lock"><b>🔒 ???</b><small>아직 일어나지 않은 사건</small></div>`;
      const clues = C.clues.map(c => `<li class="${st.clues[c[0]] ? 'ok' : ''}">${st.clues[c[0]] ? '✔ ' + c[1] + ' — ' + c[4] : '○ 단서 미발견'}</li>`).join('');
      const talks = C.talks.map(t => `<li class="${st.talks[t[0]] ? 'ok' : ''}">${st.talks[t[0]] ? `✔ ${NPC_LOOKS[t[0]].name}: "${t[1]}"` : '○ 탐문 필요'}</li>`).join('');
      return `<div class="nb ${st.step === 'solved' ? 'solved' : ''}"><b>${C.icon} ${C.name}</b><small>${C.place} · ${st.step === 'solved' ? '해결 — ' + C.truth : st.step === 'report' ? '형사님에게 상담 필요' : '수사 중'}</small><ul>${clues}${talks}</ul>${caseReady(id) ? `<button class="big nbdeduce" data-id="${id}">🧠 단서 조합해서 추리하기</button>` : ''}</div>`;
    }).join('');
  } else if (tab === 'explore') {
    html = Object.entries(HIDDEN_DEFS).map(([id, H]) => S.hidden[id] ? `<div class="nb solved"><b>${H.icon} ${H.name}</b><small>${dateLabel(S.hidden[id].day)} 발견 · ${S.hidden[id].visited ? '방문함' : '아직 안 들어가 봄'}${S.paid['dig_' + id] ? ' · 보물 찾음' : ''}</small></div>` : `<div class="nb lock"><b>🔒 숨겨진 장소</b><small>${{ h_forest: '노을 질 무렵 동백숲 깊은 곳…', h_cave: '썰물 때 갯바위 아래…', h_secret: '무인도의 오래된 상자가 열쇠?', h_view: '밤의 등대, 누군가와 함께…', h_cellar: '귤 농장의 사건을 해결하면…' }[id]}</small></div>`).join('');
  } else {
    const T2 = S.treasure, n = Object.keys(T2.frags).length;
    html = `<div class="tmap"><img src="${treasureMapImg(T2.restored)}"></div><ul class="req">${Object.entries(FRAG_SRC).map(([k, v]) => `<li class="${T2.frags[k] ? 'ok' : ''}">${T2.frags[k] ? '✔' : '○'} ${v}</li>`).join('')}</ul>
      ${n >= 6 && !T2.restored ? '<button class="big" id="tRestore">🧩 지도 복원하기</button>' : ''}${T2.restored && !T2.deduced ? '<button class="big" id="tDeduce">🧠 위치 추리하기</button>' : ''}${T2.deduced && !T2.dug ? '<p class="psub">X 표시 자리(풍차 언덕 아래)로 가서 땅을 파요!</p>' : ''}${T2.dug ? '<p class="psub">보물을 찾았어요! 🎉</p>' : ''}`;
  }
  openPanel('📒 수첩', tabs + html, (body) => {
    body.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => notebookMenu(b.dataset.t));
    body.querySelectorAll('.nbdeduce').forEach(b => b.onclick = () => { closePanel(); runEvent(() => caseDeduce(b.dataset.id)); });
    const r = body.querySelector('#tRestore'); if (r) r.onclick = () => { S.treasure.restored = S.day; Sound.sfx('bell'); toast('🧩 지도가 복원됐어요! X 표시가 보여요'); notebookMenu('treasure'); };
    const d = body.querySelector('#tDeduce'); if (d) d.onclick = () => { closePanel(); runEvent(async () => {
      await say('narr', '', '지도의 X 표시 옆에는 풍차 세 개가, 아래쪽엔 바다가 그려져 있다. 어디일까?');
      const k = await choose(['갯바위 낚시터', '풍차 언덕 아래', '동백숲 정자']);
      if (k === 1) { S.treasure.deduced = S.day; await say('narr', '', '맞다, 풍차 언덕 아래다! 가서 땅을 파 보자.'); updateQuestBtn(); }
      else await say('narr', '', '…거기엔 풍차가 없다. 다시 생각해 보자.');
    }); };
  });
}
