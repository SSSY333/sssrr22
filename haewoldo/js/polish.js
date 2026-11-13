/* =====================================================================
   최종 점검 반영
   · 맵: 울타리 밑에 겹친 덤불 정리, 겨울 눈사람은 지나갈 수 없게
   · 주민 · 가게 주인 대사: 같은 말 연달아 X, 날씨 · 시간 · 계절에 맞는 말만,
     날씨 한마디를 여러 가지로, 가끔 한마디 더(자기 이야기), 가게 주인 대사 크게 늘림
   · 형사님 수다(단계별) 추가
   ===================================================================== */
/* ---------------- 맵 ---------------- */
const _buildWorldPolish = buildWorld;
buildWorld = function () {
  const r = _buildWorldPolish();
  for (const m of Object.values(MAPS)) {
    const fences = new Set(m.objects.filter(o => /fence/i.test(o.kind)).map(o => o.x + ',' + o.y));
    if (fences.size) m.objects = m.objects.filter(o => !(['bush', 'flowerbed', 'stone', 'pot'].includes(o.kind) && !o.aid && fences.has(o.x + ',' + o.y)));
  }
  return r;
};
const _walkablePolish = walkable;
walkable = function (x, y, m = M) {
  if (!_walkablePolish(x, y, m)) return false;
  if (S && m && m.id === 'island') { if (!m._seasonSolid) m._seasonSolid = m.objects.filter(o => o.season && o.kind === 'snowman'); for (const o of m._seasonSolid) if (o.x === x && o.y === y && o.season === season()) return false; }
  return true;
};

/* ---------------- 주민 대사: 상황 맞추기 · 되풀이 줄이기 ---------------- */
function vlFits(t) {
  if (!S || typeof t !== 'string') return true;
  const m = S.min, w = S.weather, se = season(), wet = w === 'rain' || w === 'storm';
  const has = (re) => re.test(t);
  if (has(/선크림|햇볕 세|햇살 좋|볕 좋|볕 쬐|날씨 최고|날 좋은 날|날이 좋으니|화보처럼|물이 진짜 맑/) && (wet || w === 'snow' || m >= 19 * 60 || m < 6.5 * 60)) return false;
  if (has(/비 와요|비 오니까|비가 오네|빗소리|우산 같이/) && !wet) return false;
  if (has(/눈이다|눈 오니까|눈 온다/) && w !== 'snow') return false;
  if (has(/좋은 아침|아침부터|새벽 물때|학교 가기 싫/) && m >= 11.5 * 60) return false;
  if (has(/점심/) && !(10.5 * 60 <= m && m < 15 * 60)) return false;
  if (has(/잘 자|밤이 깊|이 시간에/) && m < 19 * 60) return false;
  if (has(/봄엔|봄이라|벚꽃|유채/) && se !== 'spring') return false;
  if (has(/여름엔|매미|해수욕장 물|더워서|덥네/) && se !== 'summer') return false;
  if (has(/가을엔|단풍|억새/) && se !== 'autumn') return false;
  if (has(/겨울엔|눈사람|입김|춥네|추워서/) && se !== 'winter') return false;
  return true;
}
G._vlRecent = {};
function vlPick(vid, pool) {
  const rec = G._vlRecent[vid] = G._vlRecent[vid] || [];
  const fit = (pool || []).filter(t => typeof t === 'string' && vlFits(t));
  const fresh = fit.filter(t => !rec.includes(t));
  const src = fresh.length ? fresh : fit.length ? fit : pool || [];
  if (!src.length) return null;
  const t = pick(src); rec.push(t); if (rec.length > 10) rec.shift(); return t;
}
/* 날씨 · 시간 한마디를 여러 가지로 */
const V_WX_MORE = {
  halmeoni: { sunny: ['볕 좋을 때 고추 좀 말려야겠다.', '이런 날엔 마루에 앉아 있으면 졸음이 와.'], cloudy: ['허리가 뻐근한 걸 보니 비가 오려나.'], rain: ['비 오는 날엔 부침개지. 이따 한 장 부쳐 줄게.', '빗소리 들으면서 콩 고르는 게 낙이여.'], morning: ['일찍 다니네. 아침은 먹고 다녀야 혀.', '새벽에 밭에 다녀왔어. 이슬이 많이 내렸더라.'], evening: ['해 지면 금방 어두워져. 일찍 들어가.', '저녁 지을 시간이네. 된장찌개 끓여야지.'] },
  okja: { sunny: ['물빛 좋다. 이런 날은 전복이 잘 보여.', '바람 없는 날이 물질하기 제일 좋아.'], cloudy: ['구름 낀 날은 물속이 침침해서 오래 못 해.'], rain: ['비 오면 장비 말리느라 하루가 다 가.', '이런 날은 따뜻한 미역국이 최고지.'], morning: ['물때 맞춰 나가려면 새벽같이 일어나야 해.', '아침 바다는 차도 정신이 번쩍 들어.'], evening: ['오늘 딴 거 손질 다 했어. 허리 좀 펴야지.', '저녁엔 순덕이 언니랑 수다나 떨어야겠다.'] },
  kid: { sunny: ['오늘 운동장에서 달리기 일등 했어요!', '모래놀이 할 건데 같이 할래요?'], cloudy: ['구름이 강아지 모양이에요! 저기요, 저기!'], rain: ['비 오면 달팽이 나와요. 찾으러 갈 거예요!', '우비 입으면 하나도 안 젖어요!'], morning: ['아침에 계란 두 개 먹었어요!', '오늘 받아쓰기 시험 있어요. 떨려요.'], evening: ['저녁 먹으러 가야 돼요. 할머니가 부르세요.', '숙제 다 하고 나왔어요! 진짜예요!'] },
  kid2: { sunny: ['오늘은 축구 할 거예요. 골키퍼는 제가 해요!', '조개껍데기 주우러 갈 거예요.'], cloudy: ['오늘은 도서관에서 만화책 볼 거예요.'], rain: ['장화에 물 들어갔어요. 꾸륵꾸륵 소리 나요.', '비 오는 날은 학교 운동장이 호수가 돼요.'], morning: ['아침에 까치 봤어요. 좋은 일 생긴대요.', '급식 메뉴가 뭔지 궁금해요.'], evening: ['이제 집에 가야 해요. 내일 또 놀아요!', '오늘 일기에 쓸 게 많아요.'] },
  fisher: { sunny: ['바람이 얌전하네. 배 띄우기 좋은 날이야.', '그물 말리기 좋은 볕이야.'], cloudy: ['구름이 낮게 깔렸네. 오후엔 물결이 좀 일겠어.'], rain: ['비 오는 날은 그물이나 꿰매야지.', '이런 날은 고기도 깊이 들어가 버려.'], morning: ['새벽 배 타고 벌써 한 바퀴 돌고 왔지.', '아침 경매 끝났어. 오늘은 값이 괜찮더라고.'], evening: ['저녁엔 횟집에서 한잔해야지. 하루 마무리야.', '내일 물때 보고 그물 놓을 자리 정해야겠어.'] },
  chief: { sunny: ['날 좋을 때 마을 방송 스피커 좀 손봐야겠구먼.', '이런 날 회관 마당에서 윷놀이 한판 어떤가?'], cloudy: ['비 오기 전에 배수로 한번 둘러봐야겠어.'], rain: ['비 오는 날엔 회관에서 장기 두는 게 제일이지.', '이 비 그치면 마을 꽃길이 볼만할 게야.'], morning: ['아침 방송 들었나? 내 목소리 괜찮았지? 허허.', '아침마다 마을 한 바퀴 도는 게 내 일이야.'], evening: ['하루가 또 무사히 갔구먼. 고마운 일이야.', '저녁엔 회관 불 끄고 들어가야지.'] },
  postman: { sunny: ['오늘은 자전거 타기 딱 좋네요!', '이런 날은 섬 끝 집까지 가도 안 힘들어요.'], cloudy: ['비 오기 전에 배달 끝내야겠어요.'], rain: ['우비 입고 도는 것도 익숙해졌어요.', '소포는 비닐로 꽁꽁 싸 왔어요. 걱정 마세요.'], morning: ['첫 배로 우편물이 들어왔어요. 오늘 좀 많네요.', '아침 배달은 할머니 댁부터예요.'], evening: ['오늘 배달 끝! 내일 또 올게요.', '저녁 배로 나갈 편지 있으면 주세요.'] },
  tourist: { sunny: ['여기 바다 색이 사진이랑 똑같아요!', '오늘 섬 한 바퀴 다 돌 거예요.'], cloudy: ['흐린 바다도 분위기 있네요.'], rain: ['비 오는 섬도 운치 있네요. 카페에 있을래요.', '우산 쓰고 걷는 것도 여행이죠.'], morning: ['아침 산책 나왔어요. 공기가 달라요!', '민박 아침밥이 너무 맛있었어요.'], evening: ['저녁엔 뭐 먹을지 추천해 주실래요?', '하루가 너무 빨리 가요. 아쉬워요.'] },
  tourist2: { sunny: ['오늘은 자전거 빌려서 돌아볼까 해요.', '사진 백 장은 찍은 것 같아요.'], cloudy: ['구름 덕분에 덜 더워서 좋아요.'], rain: ['비 오니까 숙소에서 쉬는 것도 좋네요.', '빗소리 들으면서 책 읽으려고요.'], morning: ['일출 보고 왔어요. 일찍 일어난 보람이 있네요.', '아침 바다는 정말 조용하네요.'], evening: ['여기 사람들은 다 친절하시네요.', '돌아가면 이 섬 자랑 많이 할 거예요.'] },
  grandpa: { sunny: ['볕이 이래야 귤이 달아져.', '오늘은 풀 좀 뽑아야겠어.'], cloudy: ['흐린 날은 일하기엔 좋지. 덜 지쳐.'], rain: ['비 오는 날은 쉬라는 하늘 뜻이야.', '이 비에 귤나무가 물 좀 먹겠구먼.'], morning: ['새벽에 밭 한 바퀴 돌았어. 버릇이야.', '아침 이슬 맞은 귤잎이 제일 예뻐.'], evening: ['해 지면 일 접어야지. 욕심내면 탈 나.', '저녁엔 라디오 들으면서 쉬는 게 낙이야.'] },
  rancher: { sunny: ['말들 털에 윤이 나네. 볕이 좋아서 그래.', '오늘은 풀밭에 풀어 놔야겠어.'], cloudy: ['말들이 귀를 자꾸 세워. 날이 바뀌려나 봐.'], rain: ['비 오면 마구간 청소하는 날이야.', '말들은 비 맞는 거 생각보다 좋아해.'], morning: ['아침 여물 주고 오는 길이야.', '새벽에 망아지가 처음 뛰었어. 볼만했지.'], evening: ['말들 들여놓고 나면 하루 끝이야.', '저녁엔 건초 냄새가 제일 좋아.'] },
  farmer: { sunny: ['오늘 물 주는 날이야. 바쁘다 바빠.', '이런 볕이면 일주일 뒤에 딸 수 있겠어.'], cloudy: ['흐린 날에 모종 옮겨 심는 거야. 안 시들거든.'], rain: ['단비네. 물 줄 일 줄었다!', '비 오면 하우스 물길부터 봐야 해.'], morning: ['아침에 딴 채소가 제일 싱싱해.', '새벽부터 나와 있었어. 농사꾼 시계는 빨라.'], evening: ['오늘 수확한 거 내일 슈퍼에 들어가.', '해 지기 전에 연장 챙겨야지.'] },
  keeper: { sunny: ['수평선이 또렷하네. 멀리 화물선도 보여.', '등대 유리 닦기 좋은 날이야.'], cloudy: ['안개 끼면 불을 일찍 켜야 해.'], rain: ['비 오는 밤엔 등대 불이 더 반가운 법이지.', '이런 날 배 타는 사람들 생각이 나.'], morning: ['밤새 불 지키고 이제 눈 좀 붙이려던 참이야.', '아침 바다는 밤새 있었던 일을 다 지워 놓지.'], evening: ['곧 불 켤 시간이야. 사십 년째 같은 시간이지.', '해 지는 쪽을 봐. 오늘 색이 좋아.'] },
  lifeguard: { sunny: ['오늘 파도 잔잔해요. 그래도 준비운동은 꼭!', '물놀이는 깃발 안쪽에서만 하세요~'], cloudy: ['흐려도 자외선은 있어요. 모자 쓰세요.'], rain: ['오늘은 장비 점검하는 날이에요.', '비 그치면 다시 깃발 올릴게요.'], morning: ['아침 순찰 돌고 있어요. 이상 무!', '해변 쓰레기 줍는 중이에요. 같이 하실래요?'], evening: ['해 지면 입수 금지예요. 안전 제일!', '오늘도 사고 없이 끝났네요. 다행이에요.'] },
  manbok: { sunny: ['오늘 입질 온다. 내 손끝이 알아!', '이런 날 못 잡으면 낚시꾼 접어야지!'], cloudy: ['흐린 날이 고기는 더 잘 물어. 이건 비밀이야.'], rain: ['비 와도 낚시는 한다! 우비 입으면 되지!', '빗방울 떨어질 때 대물이 올라온다니까.'], morning: ['새벽부터 자리 맡아 놨지. 명당은 내 거야.', '아침 물때 놓치면 하루가 아까워.'], evening: ['해 질 녘이 진짜 시간이야. 이제부터라고!', '오늘 조황? 묻지 마. 내일 물어봐.'] },
};
/* 가끔 덧붙이는 자기 이야기 */
const V_STORY = {
  halmeoni: ['영감 살았을 땐 저 부두에서 같이 그물 손질했어. 그때가 엊그제 같네.', '우리 손주가 방학 때 온대. 벌써부터 반찬 걱정이야.', '이 섬에서 칠십 년 살았어도 바다는 매일 달라.', '젊을 땐 나도 물질 좀 했지. 옥자가 내 후배여.'],
  okja: ['처음 물질 배울 때 순덕 언니한테 엄청 혼났어. 지금은 고맙지.', '숨 참는 건 욕심 버리는 연습이야. 욕심내면 올라올 숨이 없어.', '막내가 요즘 제법이야. 금방 나를 따라잡겠어.', '바다에서 건진 것 중 제일 귀한 건 사람이야.'],
  kid: ['저는 커서 형사님 같은 형사 될 거예요! 아니면 우주비행사요.', '우리 반 짝꿍이 저 좋아한대요. 비밀이에요!', '할머니가 용돈 주셨어요. 슈퍼 가서 뭐 살지 고민이에요.', '고양이 노랑이가 제 무릎에 올라왔어요! 처음이에요!'],
  kid2: ['저 달리기 연습해요. 운동회 때 계주 나가요!', '바다에서 유리 조각 주웠는데 보석 같아요.', '선생님이 제 그림 칭찬해 주셨어요.', '형이 육지로 학교 갔어요. 방학 때 온대요.'],
  fisher: ['열여섯에 처음 배 탔어. 그날 멀미로 죽는 줄 알았지.', '만복이 형이랑은 낚시 얘기만 나오면 싸워. 그래도 형이야.', '바다가 주는 만큼만 가져오는 거야. 그게 규칙이지.', '우리 애가 배는 안 탄대. 서운해도 그게 맞는 거겠지.'],
  chief: ['내가 이장 된 지 십이 년이야. 처음엔 한 번만 한다 했는데 말이지.', '젊을 땐 육지에서 일했어. 돌아와 보니 여기가 제일이더구먼.', '마을 사람들 생일은 내가 다 외우고 있지. 수첩에.', '이 섬에 젊은 사람이 느는 게 내 소원이야.'],
  postman: ['제일 반가운 건 손편지예요. 요즘은 귀하거든요.', '섬에 온 지 삼 년 됐어요. 이젠 집집마다 강아지 이름도 알아요.', '할머니들이 자꾸 간식을 주셔서 살이 쪘어요.', '답장 기다리는 얼굴 보면 저도 같이 두근거려요.'],
  tourist: ['원래 이틀만 있으려고 했는데 일주일째예요.', '회사 그만두고 온 여행이에요. 여기 와서 숨이 쉬어져요.', '여기 살면 어떨까 진지하게 생각 중이에요.'],
  tourist2: ['친구가 추천해서 왔는데, 안 왔으면 후회할 뻔했어요.', '섬 고양이들 사진만 오십 장이에요.', '다음엔 부모님 모시고 올 거예요.'],
  grandpa: ['이 귤밭은 아버지가 심은 나무야. 나보다 나이가 많지.', '귤은 손이 아니라 발소리로 키우는 거야. 자주 와 봐야 해.', '할멈이 귤청 담그던 항아리가 아직 있어.', '올해 첫 귤은 늘 이웃들한테 먼저 돌려.'],
  rancher: ['말은 거짓말을 못 해. 그래서 사람보다 편할 때가 있어.', '조랑이는 내가 받은 망아지야. 그날 밤을 잊을 수가 없지.', '아버지도 여기서 말을 키웠어. 나는 이 냄새가 고향이야.'],
  farmer: ['작년엔 태풍에 하우스가 날아갔어. 올해는 단단히 묶었지.', '딸기 모종은 자식 같아. 하루만 안 봐도 걱정돼.', '농사는 기다리는 일이야. 조급하면 다 망쳐.'],
  keeper: ['사십 년 동안 불 꺼뜨린 날이 딱 하루 있었어. 그날 얘긴 나중에 해 주지.', '등대는 혼자 지키는 것 같아도, 바다 위 누군가랑 같이 있는 거야.', '젊을 땐 이 섬을 떠나고 싶었어. 지금은 떠날 이유가 없어.'],
  lifeguard: ['여름에만 오는 줄 아시는데, 저 이 섬에 사계절 다 있어요.', '수영은 여섯 살 때 여기 바다에서 배웠어요.', '사람 구한 날은 밤에 잠이 안 와요. 좋아서요.'],
  manbok: ['내 최고 기록은 팔십 센티 참돔이야. 사진? 그날따라 사진기가 없었지!', '낚시는 기다림이야. 인생도 그렇고. 캬, 명언이다.', '형사 양반한테 낚시 가르친 게 나야. 제자가 영 시원찮아.'],
};
const _villagerLinePolish = villagerLine;
villagerLine = function (vid) {
  const X = V_WX_MORE[vid], h = S.min / 60, r = Math.random();
  // 날씨 · 시간 한마디 (예전엔 한 줄뿐이라 같은 말을 자주 했음)
  if (X && r < 0.2) { const key = r < 0.11 ? S.weather : h < 10 ? 'morning' : h >= 17 ? 'evening' : S.weather; const base = (typeof V_WEATHER !== 'undefined' && V_WEATHER[vid] && V_WEATHER[vid][key]) || null; const t = vlPick(vid, [...(X[key] || []), ...(base ? [base] : [])]); if (t) return t; }
  for (let i = 0; i < 8; i++) {
    const t = _villagerLinePolish(vid), rec = G._vlRecent[vid] = G._vlRecent[vid] || [];
    const isWx = typeof V_WEATHER !== 'undefined' && V_WEATHER[vid] && Object.values(V_WEATHER[vid]).includes(t);
    if (isWx && i < 6 && Math.random() < 0.7) continue;          // 날씨 한 줄 쏠림 줄이기
    if (vlFits(t) && !rec.includes(t)) { rec.push(t); if (rec.length > 10) rec.shift(); return t; }
  }
  return vlPick(vid, [...((VILLAGERS[vid] && VILLAGERS[vid].lines && VILLAGERS[vid].lines.base) || []), ...(V_STORY[vid] || [])]) || _villagerLinePolish(vid);
};
/* 말 건 뒤 가끔 한마디 더 */
const _villagerTalkPolish = villagerTalk;
villagerTalk = async function (a) {
  const st = V_STORY[a.vid];
  if (st && !S.rel.daily['vs_' + a.vid] && Math.random() < 0.35) {
    S.rel.daily['vs_' + a.vid] = true;
    const _say = say; let done = false;
    say = function (who, e, t) { const p = _say(who, e, t); if (!done && who === a.id) { done = true; return p.then(() => { const x = vlPick(a.vid, st); return x ? _say(a.id, 'smile', x) : null; }); } return p; };
    try { return await _villagerTalkPolish(a); } finally { say = _say; }
  }
  return _villagerTalkPolish(a);
};

/* ---------------- 가게 주인 대사 늘리기 ---------------- */
const STAFF_MORE = {
  auntie: ['오늘 들어온 한치가 물이 좋아. 물회로 딱이야.', '혼자 왔어? 그럼 반찬 하나 더 줄게.', '우리 집 초장은 삼십 년 된 비법이야. 아무도 안 가르쳐 줘.', '저녁엔 자리 없어. 먹으려면 일찍 와.', '만복이는 외상값부터 갚으라고 전해 줘. 호호.', '생선은 손질이 반이야. 칼이 잘 들어야 맛이 살아.', '여름엔 물회, 겨울엔 지리. 철 따라 먹어야 탈이 없어.', '비 오는 날엔 매운탕 손님이 많아.', '젊은 사람이 잘 먹으니 보기 좋네. 많이 먹어.', '형사 양반은 늘 구석 자리에 앉아. 창밖이 보여서 좋대.', '오늘 장사 끝나면 나도 한 그릇 해야지.', '수조 구경해도 돼. 손만 넣지 말고.'],
  superman: ['배 들어온 날이라 과자가 새로 들어왔어.', '아이스크림은 냉동고 맨 아래가 제일 차가워.', '도시락 재료 찾으면 저쪽 선반이야.', '요즘 캔커피가 제일 잘 나가. 누구 때문인지 알지?', '외상은 안 돼. 이장님도 안 돼. 허허.', '필요한 거 없으면 주문해 줄게. 다음 배로 와.', '아침엔 두부가 따끈해. 일찍 오면 살 수 있어.', '애들이 뽑기 앞에서 한 시간씩 서 있어.', '비 오는 날엔 우산이랑 라면이 동나.', '가구 카탈로그도 구경하고 가. 새 거 들어왔어.', '가게 본 지 이십 년이야. 누가 뭘 사는지 다 알지.', '잔돈은 저금통에 넣어도 돼. 학교 도서관에 보태는 거야.'],
  tailor: ['이 색, 얼굴에 대 보세요. 봐요, 환해지죠?', '옷은 편한 게 제일이에요. 그다음이 예쁜 거고요.', '수선도 해요. 단 줄이기는 십 분이면 돼요.', '이번 배에 새 옷감이 들어왔어요. 만져 보세요.', '섬 바람엔 얇은 겉옷 하나 있어야 해요.', '커플 옷 찾으세요? 호호, 농담이에요. 저쪽에 있긴 해요.', '할머니들 몸빼도 제가 다 만들어요. 인기 최고예요.', '옷장 정리하다 안 입는 옷 있으면 가져오세요. 고쳐 드릴게요.', '모자 하나로 분위기가 확 달라져요.', '오늘은 구경만 하셔도 돼요. 천천히 보세요.', '신발은 발이 편해야 해요. 섬은 걷는 데가 많아서.'],
  stylist: ['앞머리만 살짝 다듬어도 인상이 달라져요.', '바닷바람에 머릿결 상하니까 트리트먼트 하고 가세요.', '오늘은 손님이 없어서 한가해요. 천천히 골라요.', '염색은 기분 전환에 최고예요.', '할머니들 파마하는 날은 가게가 수다방이 돼요.', '머리 묶는 법 알려 드릴까요? 바람 불어도 안 풀리게.', '아이들 머리는 제가 공짜로 잘라 줘요.', '어울리는 스타일은 얼굴형보다 표정이 정해요.', '지난번 스타일, 사람들이 뭐래요? 예쁘다 했죠?', '가위 든 지 십오 년이에요. 믿고 맡기세요.', '오늘 기분이 어때요? 기분 따라 골라 드릴게요.'],
  chief: ['회관 장기판은 아무나 써도 돼. 정리만 잘하고.', '이번 달 마을 회의는 넷째 주야. 떡 나온다.', '노래방 기계 새로 고쳤어. 한 곡 뽑고 가게나.', '게시판에 붙은 거 봤나? 이번 행사 볼만할 걸세.', '젊은 사람 의견이 필요해. 가끔 들러서 얘기 좀 해 줘.', '회관 보리차는 내가 직접 끓여. 한 잔 하게.'],
  okja: ['이 오리발은 삼십 년 썼어. 내 발이나 마찬가지야.', '수경은 쑥으로 닦아. 그래야 김이 안 서려.', '테왁 줄은 매일 봐야 해. 목숨줄이니까.', '창고 구경은 해도 되는데 젖은 데 밟지 마.', '오늘 딴 건 벌써 다 나갔어. 내일 와.'],
};
for (const [k, arr] of Object.entries(STAFF_MORE)) STAFF_LINES[k] = [...(STAFF_LINES[k] || []), ...arr];
const _staffTalkPolish = staffTalk;
staffTalk = async function (a) {
  const pool = STAFF_LINES[a.id];
  if (!pool) return _staffTalkPolish(a);
  const t = vlPick('staff_' + a.id, pool), saved = STAFF_LINES[a.id];
  STAFF_LINES[a.id] = [t || pool[0]];
  try { return await _staffTalkPolish(a); } finally { STAFF_LINES[a.id] = saved; }
};

/* ---------------- 형사님 수다 추가 (단계별 · 상황을 타지 않는 이야기) ---------------- */
const DET_SMALL_MORE = {
  1: ['이 섬은 길이 단순해요. 바다 쪽으로 가면 부두, 반대로 가면 귤밭이에요.', '파출소는 광장 바로 앞이에요. 문은 늘 열려 있어요.', '섬 고양이들은 사람을 안 무서워해요. 노란 녀석이 대장이에요.', '필요한 게 있으면 마을 슈퍼에 다 있어요. 없으면 주문해 주세요.', '이 섬 사건이라고 해 봐야 잃어버린 자전거 찾기예요.', '저는 여기 온 지 몇 년 됐어요. 처음엔 조용해서 놀랐죠.'],
  2: ['요즘은 순찰 돌 때 꽃 핀 데를 일부러 지나가요.', '어르신들이 자꾸 반찬을 주셔서 냉장고가 꽉 찼어요.', '낚시는 만복 아저씨한테 배웠는데, 아직 한참 멀었대요.', '수첩에 마을 사람들 생일을 적어 둬요. 형사 버릇이에요.', '섬에서 제일 좋아하는 곳은 등대 아래예요. 조용해서요.', '캔커피는 따뜻한 게 좋아요. 여름에도요.'],
  3: ['어릴 땐 바다가 없는 동네에 살았어요. 그래서 매일 봐도 안 질려요.', '형사가 된 건 누가 길을 잃었을 때 찾아 주고 싶어서였어요.', '요리는 계란 프라이까지만 자신 있어요. 그 이상은 묻지 마요.', '쉬는 날엔 빨래 널고 낚시 가요. 단순하죠.', '사택 창문으로 학교 운동장이 보여요. 애들 소리에 잠이 깨요.', '이장님이 저만 보면 장가 얘기를 하세요. 요즘은 좀 덜하시지만.'],
  4: ['요즘 수첩에 사건 말고 다른 걸 적어요. 뭔지는 안 알려 줘요.', '혼자 걷던 길인데, 요즘은 옆이 허전해요.', '좋아하는 음식 하나만 더 알려 줘요. 외워 두게.', '휴대폰을 자꾸 보게 돼요. 연락 올 데가 한 군데라.', '어머니가 전화로 요즘 목소리가 밝다고 하시더라고요.'],
  5: ['순찰 돌다가 예쁜 데 있으면 표시해 둬요. 나중에 같이 가려고.', '요즘은 퇴근 시간이 제일 기다려져요.', '사택에 칫솔 하나 더 놨어요. 그냥, 혹시 몰라서.', '어르신들이 우리 보고 웃으실 때마다 좀 쑥스러워요. 좋으면서.', '다음 쉬는 날은 아무 계획 없이 같이 있어요.'],
  6: ['같이 사는 얘기, 가끔 혼자 상상해요. 아침은 누가 차릴지 같은 거.', '어머니가 한번 내려오신대요. 당신 보고 싶다고.', '요즘은 무전 소리보다 당신 발소리를 더 잘 들어요.'],
  8: ['여보 덕분에 사택보다 집이 좋다는 걸 알았어요.', '퇴근길에 장 봐 올 거 있으면 말해요.', '주말엔 늦잠 자요. 아침은 제가 할게요.'],
};
for (const [k, arr] of Object.entries(DET_SMALL_MORE)) SMALLTALK[k] = [...(SMALLTALK[k] || []), ...arr];
/* 말 놓은 뒤에 쓰는 수다에도 같은 이야기를 반말로 */
if (typeof CASUAL_LINES !== 'undefined' && typeof toBanmal === 'function') for (const [k, arr] of Object.entries(DET_SMALL_MORE)) if (+k >= 3 && CASUAL_LINES[k]) CASUAL_LINES[k].push(...arr.map(t => toBanmal(t)));
/* ---------------- 주민이 바다 · 건물 위를 걷던 문제 ----------------
   집 안에서 걷던 경로를 가진 채 밖(섬)으로 옮겨지면 그 좌표를 섬에서 따라 걸었음 → 지도가 바뀌면 경로를 지움
   혹시 막힌 칸에 서 있으면(앉아 있을 때 제외) 가까운 길로 옮김 */
function actorUnstick(a) {
  if (!a || !a.visible || a.seat || a.pose === 'sit' || a.pose === 'fish' || a.carried || a.lie) return;
  const m = MAPS[a.map]; if (!m) return;
  if (a._mapSeen !== a.map) { a._mapSeen = a.map; if (a.path && a.path.length) { const [tx, ty] = a.path[a.path.length - 1]; if (!inMap(Math.floor(tx), Math.floor(ty), m) || !walkable(Math.floor(tx), Math.floor(ty), m)) a.path = []; } }
  const x = Math.floor(a.x), y = Math.floor(a.y);
  if (inMap(x, y, m) && walkable(x, y, m)) return;
  // 문 앞 · 의자 앞처럼 일부러 열어 둔 칸은 walkable 이라 여기 오지 않음 → 진짜 막힌 칸
  a._stuckT = (a._stuckT || 0) + 1; if (a._stuckT < 20) return;      // 지나가는 중이면 기다림
  a._stuckT = 0; a.path = [];
  const V = VILLAGERS[a.vid], home = V && V.spots && a.map === 'island' ? P_(V.spots[0]) : [a.x, a.y];
  const far = !inMap(x, y, m) || tileAt(x, y, m) === T.WATER;
  [a.x, a.y] = nearestWalkable(far ? home[0] : a.x, far ? home[1] : a.y, m);
}
const _villagerUpdatePolish = villagerUpdate;
villagerUpdate = function (a, dt) {
  const map0 = a.map;
  const r = _villagerUpdatePolish(a, dt);
  if (a.map !== map0) { a.path = []; a._mapSeen = a.map; }
  actorUnstick(a);
  if (a.visible) a._stuckT = (inMap(Math.floor(a.x), Math.floor(a.y), MAPS[a.map] || M) && walkable(Math.floor(a.x), Math.floor(a.y), MAPS[a.map] || M)) ? 0 : a._stuckT;
  return r;
};
