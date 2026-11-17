/* =====================================================================
   v1.23 — 형사님이 먼저 「같이 하자 · 같이 가자」: 작업 거는 제안 늘리기
   · 사진 · 네컷 얘기는 확 줄이고(일주일에 한 번꼴), 그 자리를 같이 할 거리로 채움
   · 수락하면 실제로 그곳에 가서 그 행동까지 이어짐 (텐트 · 벤치 · 무인도 · 정자 · 그네 · 낚시 · 노래방 …)
   ===================================================================== */
const dlf = (polite, casual) => `[[${polite}||${casual}]]`;
const outdoorIsland = () => G.player.map === 'island' && !M.interior;
const notRain = () => !['rain', 'storm', 'snow'].includes(S.weather);

/* ---------------- 실제 행동 ---------------- */
async function flirtSitNearby() {
  const k = nearestSeat(); if (!k) { toast('근처에 앉을 곳이 없어요'); return null; }
  const bk = MAPS[G.player.map].benches[k];
  if (bk.leisure) await leisureSitTogether(k); else await sitTogether(k);
  return G.player.seat && G.det.seat ? k : null;
}
/* 벤치에 나란히 앉아서: 허리 감싸기 · 다리 쓸어내리기 · 어깨 닿기 */
async function flirtBench(kind) {
  const k = await flirtSitNearby(); if (!k) return;
  const id = kind === 'shoulder' ? 'shoulder' : 'hug';
  G._coupleOverride = { [id]: kind === 'waist' ? [dlf('…추울까 봐서요. 진짜 그 이유예요.', '…추울까 봐서. 진짜 그 이유야.')] : kind === 'leg' ? [dlf('가만있어 봐요. 무릎에 모래 묻었어요.', '가만있어 봐. 무릎에 모래 묻었어.')] : [dlf('…자리가 좀 좁네요. 이대로 있어도 돼요?', '…자리가 좀 좁네. 이대로 있어도 돼?')] };
  try { await coupleAct(k, id); } finally { G._coupleOverride = null; }
  await runEvent(async () => {
    const d = G.det;
    if (kind === 'waist') {
      await say('narr', '', '형사님 팔이 슬그머니 내 허리를 감쌌다. 모른 척 바다만 보는데, 귀 끝이 빨갛다.');
      const c = await choose(['(어깨에 머리를 기댄다)', '(팔을 살짝 꼬집는다)', '(모른 척 바다만 본다)']);
      if (c === 0) { G.player.lean = true; burst(d, 'heart', 5); await say('det', 'blush', dlf('…이러면 저 오늘 집에 못 가요.', '…이러면 나 오늘 집에 못 가.')); addAff(3); }
      else if (c === 1) { G.player.emo('💢', 1.2); await say('det', 'laugh', dlf('아야! …그래도 안 뺄 거예요.', '아야! …그래도 안 뺄 거야.')); addAff(2); }
      else { await say('det', 'tease', dlf('모른 척하는 거 다 보여요. 입꼬리 올라갔어요.', '모른 척하는 거 다 보여. 입꼬리 올라갔어.')); addAff(2); }
    } else if (kind === 'leg') {
      await say('narr', '', '모래를 털어 주는 척, 형사님 손이 무릎에서 다리를 따라 슬쩍 쓸어내렸다.');
      const c = await choose(['(손등을 찰싹) 어디 만져요!', '(가만히 있는다)', '(그 손을 꼭 잡아 버린다)']);
      if (c === 0) { d.emo('💦', 1.6); await say('det', 'laugh', dlf('모래요! 진짜 모래였어요. …반은요.', '모래! 진짜 모래였어. …반은.')); addAff(2); }
      else if (c === 1) { burst(d, 'heart', 4); await say('det', 'blush', dlf('…가만히 있으면 제가 더 떨리는데요.', '…가만히 있으면 내가 더 떨리는데.')); addAff(3); }
      else { burst(d, 'heart', 5); await say('det', 'blush', dlf('…잡혔네요. 놓지 마요.', '…잡혔다. 놓지 마.')); S.rel.daily.hand = true; addAff(3); }
    } else {
      await say('narr', '', '어깨가 살짝 닿았다. 형사님이 피하지 않는다. 나도 피하지 않았다.');
      const c = await choose(['(조금 더 붙어 앉는다)', '(괜히 하늘을 본다)']);
      if (c === 0) { burst(d, 'heart', 3); await say('det', 'blush', dlf('…방금 일부러 그런 거죠? 저도 그럴게요.', '…방금 일부러 그런 거지? 나도 그럴래.')); addAff(3); }
      else { await say('det', 'smile', dlf('하늘에 뭐 있어요? …저 보는 것보다 재밌어요?', '하늘에 뭐 있어? …나 보는 것보다 재밌어?')); addAff(2); }
    }
    advanceTime(15);
    memRecent('flirt', kind === 'shoulder' ? '벤치에서 어깨가 닿았다' : '벤치에서 형사님이 슬쩍 다가왔다');
  });
}
/* 캠핑장 텐트에 들어가서 끌어안고 있기 */
async function flirtTent() {
  if (G.player.map !== 'island') { toast('섬으로 나가서 가요'); return; }
  await runEvent(async () => { if (!S.comp) startCompanion(); await say('narr', '', '⛺ 캠핑존 텐트로 같이 갔다.'); });
  await enterTent('A');
  const d = G.det; d.map = G.player.map; [d.x, d.y] = nearestWalkable(G.player.x + 1, G.player.y, M); d.visible = true;
  await sleep(300);
  if (M.benches.tentSeat) await leisureSitTogether('tentSeat');
  M.dark = true; for (const o of M.objects) if (o.k === 'tentLamp') o.light = false;
  G._coupleOverride = { hug: [dlf('랜턴 끄니까 아무것도 안 보이네요. …이리 와요. 춥잖아요.', '랜턴 끄니까 아무것도 안 보이네. …이리 와. 춥잖아.')] };
  try { if (G.player.seat) await coupleAct('tentSeat', 'hug'); } finally { G._coupleOverride = null; }
  await runEvent(async () => {
    await say('narr', '', '좁은 텐트 안, 형사님이 나를 꼭 끌어안았다. 텐트 천 너머로 풀벌레 소리. 심장 소리가 그대로 전해진다.');
    const c = await choose(['(가만히 안겨 있는다)', '(돌아서서 마주 안는다)', '(장난스럽게) 춥다더니 핑계죠?']);
    if (c === 0) await say('det', 'blush', dlf('…조금만 더 이러고 있어요. 딱 오 분만. 아니, 십 분.', '…조금만 더 이러고 있자. 딱 오 분만. 아니, 십 분.'));
    else if (c === 1) { burst(G.det, 'heart', 6); await say('det', 'blush', dlf('…이러면 반칙이에요. 저 진짜 못 놔요.', '…이러면 반칙이야. 나 진짜 못 놔.')); }
    else await say('det', 'laugh', dlf('들켰다. 하나도 안 추워요. 그냥 안고 싶었어요.', '들켰다. 하나도 안 추워. 그냥 안고 싶었어.'));
    addAff(c === 1 ? 4 : 3); advanceTime(30);
    if (!S.mem.perm.tentHug) { memPerm('tentHug', { name: '텐트 안에서' }); await addAlbum('텐트 안에서 꼭', 'date'); }
  });
}
/* 무인도 같이 가기 */
async function flirtIslet() {
  if (G.player.map !== 'island') { toast('섬으로 나가서 가요'); return; }
  if (!S.comp) startCompanion();
  await rideBoat();
  if (G.player.map === 'islet') setTimeout(() => doDate('islet'), 60);
}
/* 놀이터 그네 같이 */
async function flirtSwing() {
  if (G.player.map !== 'island' || typeof playTogether !== 'function') return;
  const bk = MAPS.island.benches.swing; if (!bk) return;
  if (!S.comp) startCompanion();
  await fade(true); const P = G.player, d = G.det; [P.x, P.y] = [bk.stand[0][0] + 0.5, bk.stand[0][1] + 0.5]; d.map = 'island'; [d.x, d.y] = [bk.stand[1][0] + 0.5, bk.stand[1][1] + 0.5]; G.camSnap = true; await fade(false);
  M = MAPS.island; await playTogether('swing');
}
/* 지금 이 자리에서 뒤에서 안기 */
async function flirtBackHug() {
  await runEvent(async () => {
    const P = G.player, d = G.det; scriptDet(); [d.x, d.y] = nearestWalkable(P.x - 0.35, P.y - 0.35, M); d.lookAt(P); P.face = 'f';
    burst(d, 'heart', 6); burst(P, 'heart', 3);
    await say('narr', '', '바다를 보고 있는데, 등 뒤로 형사님이 다가와 팔을 둘렀다. 턱이 살짝 어깨에 얹힌다.');
    await say('det', 'blush', pick([dlf('…노을보다 이게 더 좋아요.', '…노을보다 이게 더 좋다.'), dlf('조용히 해요. 지금 충전 중이에요.', '조용히 해. 지금 충전 중이야.'), dlf('사람들 봐도 상관없어요. 오늘은.', '사람들 봐도 상관없어. 오늘은.')]));
    const c = await choose(['(팔 위에 손을 겹친다)', '(돌아본다)']);
    if (c === 0) await say('det', 'smile', dlf('…따뜻하다. 당신 손.', '…따뜻하다. 네 손.'));
    else { d.lookAt(P); await say('det', 'blush', dlf('…그렇게 가까이서 보면 제가 곤란한데요.', '…그렇게 가까이서 보면 내가 곤란한데.')); }
    addAff(3); advanceTime(10);
  });
}
const FLIRT_ACT = {
  benchWaist: () => flirtBench('waist'), benchLeg: () => flirtBench('leg'), benchShoulder: () => flirtBench('shoulder'),
  tent: flirtTent, islet: flirtIslet, swing2: flirtSwing, backhug: flirtBackHug,
  forest: () => doDate('forest'), stars: () => doDate('observatory'), sunset: () => doDate('lighthouse'), beach: () => doDate('beach'),
  karaoke: () => doDate('karaoke'), sashimi: () => doDate('sashimi'), fish: () => fishTogether(), pier: () => doDate('pier'),
};
const _compAction123 = compAction;
compAction = async function (act) { if (FLIRT_ACT[act]) return FLIRT_ACT[act](); return _compAction123(act); };

/* ---------------- 같이 걷는 중 선택지 (단계별) ---------------- */
const FC = (q, yes, yesR, no, noR, act, aff = 3) => ({ q, c: [[yes, yesR, aff, act], [no, noR, 1]] });
COMP_CHOICES[3].push(
  FC(dlf('저기 무인도 보여요? 배 빌려 놨는데… 같이 갈래요? 둘이서만요.', '저기 무인도 보여? 배 빌려 놨는데… 같이 갈래? 둘이서만.'), '가요!', dlf('좋아요. 노는 제가 저을게요. 멀미하면 저한테 기대요.', '좋아. 노는 내가 저을게. 멀미하면 나한테 기대.'), '다음에요', dlf('그럼 날 좋은 날 꼭이요. 예약해 둘게요.', '그럼 날 좋은 날 꼭. 예약해 둘게.'), 'islet'),
  FC(dlf('부두 끝에서 낚시 한 판 할래요? 지는 사람이 저녁 사기.', '부두 끝에서 낚시 한 판 할래? 지는 사람이 저녁 사기.'), '좋아요', dlf('봐주는 거 없어요. 대신 미끼는 제가 끼워 줄게요.', '봐주는 거 없어. 대신 미끼는 내가 끼워 줄게.'), '다음에요', dlf('겁먹었어요? 하하, 농담이에요.', '겁먹었어? 하하, 농담이야.'), 'fish'),
  FC(dlf('마을회관 노래방 가 봤어요? 듀엣 한 곡만 해요. 제가 화음 넣을게요.', '마을회관 노래방 가 봤어? 듀엣 한 곡만 하자. 내가 화음 넣을게.'), '좋아요', dlf('선곡은 당신이 해요. 저는 어떤 노래든 맞출 자신 있어요.', '선곡은 네가 해. 난 어떤 노래든 맞출 자신 있어.'), '노래는 좀…', dlf('그럼 저 혼자 부를 테니까 박수만 쳐 줘요.', '그럼 나 혼자 부를 테니까 박수만 쳐 줘.'), 'karaoke'),
);
COMP_CHOICES[4].push(
  FC(dlf('숲길 정자 가 볼래요? 거기 사람이 없어서… 조용히 얘기하기 좋아요.', '숲길 정자 가 볼래? 거기 사람이 없어서… 조용히 얘기하기 좋아.'), '가요', dlf('…좋아요. 사실 둘이 있고 싶어서 한 말이에요.', '…좋아. 사실 둘이 있고 싶어서 한 말이야.'), '여기도 좋아요', dlf('그래요. 당신 옆이면 어디든 괜찮아요.', '그래. 네 옆이면 어디든 괜찮아.'), 'forest'),
  FC(dlf('잠깐 저기 앉아요. …좀 붙어 앉아도 되죠? 벤치가 좁아서요.', '잠깐 저기 앉자. …좀 붙어 앉아도 되지? 벤치가 좁아서.'), '그래요', dlf('벤치가 좁은 게 이렇게 고마울 줄이야.', '벤치가 좁은 게 이렇게 고마울 줄이야.'), '넓은데요?', dlf('…들켰네요. 그래도 붙어 앉을래요.', '…들켰다. 그래도 붙어 앉을래.'), 'benchShoulder'),
  FC(dlf('놀이터 그네 같이 탈래요? 누가 더 높이 가나 내기해요.', '놀이터 그네 같이 탈래? 누가 더 높이 가나 내기하자.'), '좋아요!', dlf('지면 소원 하나 들어주기예요.', '지면 소원 하나 들어주기야.'), '어린애도 아니고', dlf('어른이 타면 더 재밌어요. 진짜로요.', '어른이 타면 더 재밌어. 진짜로.'), 'swing2'),
  FC(dlf('오늘 밤 별 보러 갈래요? 전망대에서 당신이랑 보고 싶어요.', '오늘 밤 별 보러 갈래? 전망대에서 너랑 보고 싶어.'), '가요', dlf('담요 챙길게요. 밤바람 차니까 붙어 앉아야 해요.', '담요 챙길게. 밤바람 차니까 붙어 앉아야 해.'), '다음에요', dlf('별은 매일 뜨니까요. 기다릴게요.', '별은 매일 뜨니까. 기다릴게.'), 'stars'),
);
COMP_CHOICES[5].push(
  FC(dlf('저녁에 캠핑장 텐트 가 볼래요? 랜턴 끄면 별이 텐트 위로 쏟아져요.', '저녁에 캠핑장 텐트 가 볼래? 랜턴 끄면 별이 텐트 위로 쏟아져.'), '가 볼래요', dlf('…춥다고 하면 제가 꼭 안아 줄게요. 그게 목적이에요.', '…춥다고 하면 내가 꼭 안아 줄게. 그게 목적이야.'), '다음에', dlf('알았어요. 텐트는 늘 거기 있어요. 저도요.', '알았어. 텐트는 늘 거기 있어. 나도.'), 'tent', 4),
  FC(dlf('잠깐 앉았다 가요. …추우면 말해요. 제가 바람막이 할게요.', '잠깐 앉았다 가자. …추우면 말해. 내가 바람막이 할게.'), '앉자', dlf('이리 와요. 더 가까이.', '이리 와. 더 가까이.'), '안 추워', dlf('그래도 앉아요. 제가 추워서요.', '그래도 앉자. 내가 추워서.'), 'benchWaist', 3),
  FC(dlf('바닷가 벤치 가서 바다 보고 갈래요? 모래 털어 줄게요.', '바닷가 벤치 가서 바다 보고 갈래? 모래 털어 줄게.'), '응', dlf('…그거 핑계인 거 알죠? 그래도 갈래요?', '…그거 핑계인 거 알지? 그래도 갈래?'), '모래는 내가 털게', dlf('하하, 철벽이네요. 그럼 그냥 바다만 봐요.', '하하, 철벽이네. 그럼 그냥 바다만 보자.'), 'benchLeg', 3),
  FC(dlf('잠깐만요. 여기 서 봐요. …뒤에서 안아도 돼요?', '잠깐만. 여기 서 봐. …뒤에서 안아도 돼?'), '(고개를 끄덕인다)', dlf('…고마워요.', '…고마워.'), '사람들 봐요', dlf('그럼 사람 없는 데 가서요. 약속.', '그럼 사람 없는 데 가서. 약속.'), 'backhug', 3),
  FC(dlf('노을 보러 등대 가요. 오늘 노을은 둘이 봐야 하는 색이에요.', '노을 보러 등대 가자. 오늘 노을은 둘이 봐야 하는 색이야.'), '가요', dlf('손 줘요. 길 미끄러우니까.', '손 줘. 길 미끄러우니까.'), '다음에', dlf('노을은 내일도 있으니까요. 내일 꼭이요.', '노을은 내일도 있으니까. 내일 꼭.'), 'sunset', 3),
);
for (const st of [6, 7, 8]) COMP_CHOICES[st].push(
  FC(dlf('오늘 밤 캠핑장 텐트에서 둘이 있을래요? 아무것도 안 하고 꼭 붙어서.', '오늘 밤 캠핑장 텐트에서 둘이 있을래? 아무것도 안 하고 꼭 붙어서.'), '좋아', dlf('담요 하나만 챙길게요. 하나면 충분해요.', '담요 하나만 챙길게. 하나면 충분해.'), '다음에', dlf('알았어요. 대신 오늘은 손 놓지 마요.', '알았어. 대신 오늘은 손 놓지 마.'), 'tent', 4),
  FC(dlf('무인도 가서 둘이 노을 볼래요? 섬에 우리 둘뿐이에요.', '무인도 가서 둘이 노을 볼래? 섬에 우리 둘뿐이야.'), '가자', dlf('도시락은 제가 쌀게요. 당신은 저만 챙겨요.', '도시락은 내가 쌀게. 너는 나만 챙겨.'), '오늘은 쉬자', dlf('그래요. 그럼 여기서 이렇게 있어요.', '그래. 그럼 여기서 이렇게 있자.'), 'islet', 3),
  FC(dlf('잠깐 앉아요. 오늘은 그냥 당신 허리 감고 있고 싶어요.', '잠깐 앉자. 오늘은 그냥 너 허리 감고 있고 싶어.'), '(웃으며 앉는다)', dlf('…이게 제일 좋은 휴식이에요.', '…이게 제일 좋은 휴식이야.'), '여기 길거리야', dlf('알아요. 그래서 참는 중이에요.', '알아. 그래서 참는 중이야.'), 'benchWaist', 3),
  FC(dlf('횟집 가서 저녁 먹을래요? 오늘은 제가 데이트 신청하는 거예요.', '횟집 가서 저녁 먹을래? 오늘은 내가 데이트 신청하는 거야.'), '좋아', dlf('창가 자리로 할게요. 당신 얼굴 잘 보이게.', '창가 자리로 할게. 너 얼굴 잘 보이게.'), '다음에', dlf('그럼 내일. 꼭이요.', '그럼 내일. 꼭.'), 'sashimi', 3),
);

/* ---------------- 형사님이 먼저 찾아와서 (깜짝 제안) ---------------- */
const FS = (id, st, cd, ok, ask, yes, act, no = '다음에요') => ({ id, st, cd, ok, run: async () => {
  await say('det', 'blush', pick(ask));
  const k = await choose([yes, no]);
  if (k === 0) { addAff(2); closeDialog(); setTimeout(() => { if (FLIRT_ACT[act]) FLIRT_ACT[act](); }, 120); }
  else await say('det', 'smile', dlf('알았어요. 다음엔 꼭 같이 가요.', '알았어. 다음엔 꼭 같이 가자.'));
} });
SURPRISES.push(
  FS('fIslet', 3, 6, () => outdoorIsland() && S.min >= 9 * 60 && S.min < 15.5 * 60 && notRain(), [dlf('저기, 무인도 같이 갈래요? 배 하루 빌려 놨어요. …둘이 가려고요.', '저기, 무인도 같이 갈래? 배 하루 빌려 놨어. …둘이 가려고.'), dlf('오늘 바다 잔잔하대요. 무인도 가서 우리 둘만 있다 와요.', '오늘 바다 잔잔하대. 무인도 가서 우리 둘만 있다 오자.')], '가요!', 'islet'),
  FS('fForest', 4, 5, () => outdoorIsland() && S.min >= 10 * 60 && S.min < 18 * 60 && notRain(), [dlf('숲길 정자 가요. 거긴 아무도 안 와서… 당신이랑 조용히 있고 싶어요.', '숲길 정자 가자. 거긴 아무도 안 와서… 너랑 조용히 있고 싶어.')], '가요', 'forest'),
  FS('fBench', 4, 3, () => outdoorIsland() && !!nearestSeat(), [dlf('저기 잠깐 앉아요. 붙어 앉아도 되죠? …안 된다고 해도 앉을 거지만.', '저기 잠깐 앉자. 붙어 앉아도 되지? …안 된다고 해도 앉을 거지만.')], '앉아요', 'benchShoulder'),
  FS('fTent', 5, 4, () => outdoorIsland() && S.min >= 18 * 60 && S.min < 23 * 60 && notRain(), [dlf('캠핑장 텐트 가 볼래요? 랜턴 끄고 별 소리 들어요. …안고 있어도 되고요.', '캠핑장 텐트 가 볼래? 랜턴 끄고 별 소리 듣자. …안고 있어도 되고.'), dlf('오늘 밤 좀 쌀쌀하다. 텐트 들어가서 붙어 있을래요?', '오늘 밤 좀 쌀쌀하다. 텐트 들어가서 붙어 있을래?')], '가자', 'tent'),
  FS('fWaist', 5, 3, () => outdoorIsland() && !!nearestSeat(), [dlf('다리 아프죠? 앉아요. …이 팔은 신경 쓰지 말고요.', '다리 아프지? 앉자. …이 팔은 신경 쓰지 말고.')], '(웃으며 앉는다)', 'benchWaist'),
  FS('fLeg', 5, 4, () => outdoorIsland() && !!nearestSeat() && ['beach', 'promenade', 'coast', 'picnic'].includes(curPlace()), [dlf('바다 보고 가요. 모래 묻은 거 제가 털어 줄게요. …진짜 모래만요.', '바다 보고 가자. 모래 묻은 거 내가 털어 줄게. …진짜 모래만.')], '응', 'benchLeg'),
  FS('fBackhug', 5, 4, () => outdoorIsland() && S.min >= 16.5 * 60 && S.min < 20 * 60, [dlf('잠깐 여기 서 봐요. 노을이 정말 예뻐요. …뒤에서 봐도 돼요?', '잠깐 여기 서 봐. 노을 진짜 예쁘다. …뒤에서 봐도 돼?')], '(고개를 끄덕인다)', 'backhug'),
  FS('fSwing', 4, 6, () => outdoorIsland() && S.min >= 9 * 60 && S.min < 18 * 60 && notRain(), [dlf('놀이터 그네 같이 타요. 지는 사람이 소원 들어주기!', '놀이터 그네 같이 타자. 지는 사람이 소원 들어주기!')], '좋아요!', 'swing2'),
  FS('fStars', 4, 5, () => outdoorIsland() && S.min >= 19.5 * 60 && S.min < 23 * 60 && S.weather === 'sunny', [dlf('전망대 가요. 오늘 별 진짜 많대요. 담요 하나로 같이 덮어요.', '전망대 가자. 오늘 별 진짜 많대. 담요 하나로 같이 덮자.')], '가요', 'stars'),
  FS('fKaraoke', 3, 6, () => S.min >= 14 * 60 && S.min < 21 * 60, [dlf('노래방 가요. 듀엣곡 하나 연습해 놨어요. 당신 파트도 있어요.', '노래방 가자. 듀엣곡 하나 연습해 놨어. 네 파트도 있어.')], '가요', 'karaoke'),
  FS('fFish', 3, 5, () => outdoorIsland() && S.min >= 6 * 60 && S.min < 18 * 60 && notRain(), [dlf('부두에서 낚시 대결해요. 지는 사람이 내일 커피 사기.', '부두에서 낚시 대결하자. 지는 사람이 내일 커피 사기.')], '좋아요', 'fish'),
  FS('fSashimi', 6, 5, () => S.min >= 17.5 * 60 && S.min < 20.5 * 60, [dlf('오늘 저녁 횟집 가요. 제가 데이트 신청하는 거예요.', '오늘 저녁 횟집 가자. 내가 데이트 신청하는 거야.')], '좋아', 'sashimi'),
);

/* ---------------- 사진 · 네컷 얘기 줄이기 ---------------- */
for (const s of SURPRISES) { if (s.id === 'photoAsk') s.cd = Math.max(s.cd, 18); if (s.id === 'detPhoto') s.cd = Math.max(s.cd, 20); }
const isPhotoChoice = (ch) => ch.c.some(c => c[3] === 'photo' || c[3] === 'booth') || /사진|네컷|부스/.test(ch.q);
// 사진 선택지는 일주일에 한 번까지만 (나머지 날엔 목록에서 빼 둠)
const _compChoiceTick123 = compChoiceTick;
compChoiceTick = function () {
  const hidden = [];
  if (S && S.day - (S.photoTalkDay || -99) < 7) for (const st of Object.keys(COMP_CHOICES)) for (const ch of COMP_CHOICES[st]) if (isPhotoChoice(ch) && !ch._off) { ch._off = true; hidden.push([st, ch]); }
  const saved = hidden.map(([st, ch]) => { const L = COMP_CHOICES[st], i = L.indexOf(ch); L.splice(i, 1); return [st, ch, i]; });
  const log0 = Object.assign({}, S.choiceLog || {});
  try { return _compChoiceTick123.apply(this, arguments); }
  finally {
    // 방금 고른 선택지 찾기 (오늘 새로 기록된 칸)
    let chosen = null; for (const [key, v] of Object.entries(S.choiceLog || {})) if (v === S.day && log0[key] !== S.day) { const [st, i] = key.split(':'); chosen = (COMP_CHOICES[st] || [])[+i] || null; }
    for (const [st, ch, i] of saved.reverse()) { COMP_CHOICES[st].splice(i, 0, ch); ch._off = false; }
    if (chosen && isPhotoChoice(chosen)) S.photoTalkDay = S.day;
  }
};
// 걷다가 하는 혼잣말에서 사진 얘기 비중 줄이기
const _compLine123 = compLine;
compLine = function () { for (let i = 0; i < 3; i++) { const t = _compLine123(); if (!/사진|네컷|부스|찰칵/.test(t) || Math.random() < 0.2) return t; } return _compLine123(); };
