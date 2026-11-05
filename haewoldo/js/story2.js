'use strict';
/* =========================================================
 *  해월도 마을생활 v2 — 이벤트 · 활동 · 화면 · 루프
 * ========================================================= */

/* ---------------- 첫 만남 · 관계 이벤트 ---------------- */
async function firstMeeting() {
  const d = G.det, P = G.player; scriptDet();
  d.lookAt(P); P.lookAt(d); d.emo('❗');
  const job = S.job;
  const besideDet = (a) => { if (!a) return; const n = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([x, y]) => [Math.floor(d.x) + x, Math.floor(d.y) + y]).find(([x, y]) => walkable(x, y, MAPS.island) && !(x === Math.floor(P.x) && y === Math.floor(P.y))); if (n) { a.map = 'island'; a.x = n[0] + 0.5; a.y = n[1] + 0.5; a.visible = true; a.stop(); a.talking = true; a.lookAt(P); } };
  if (job === 'doctor') {
    const cat = G.pets.find(v => v.vid === 'cheese'); besideDet(cat); if (cat) cat.pose = 'sit';
    await say('narr', '', '진료 준비를 하는데, 누군가 문을 조심스럽게 두드렸다.');
    await say('det', 'normal', '저기… 아직 진료 안 하죠? 안 하면 그냥 갈게요. 진짜로.');
    await say('narr', '', '남색 제복 소매가 찢어져 있고 손등엔 긁힌 자국. 발치에는 노란 고양이가 태연하게 앉아 있다.');
    await say('det', 'tease', '귤밭 돌담 틈에 이 녀석이 끼어 있어서요. 구해 주다가… 제가 졌어요. 고양이한테.');
    Sound.sfx('meow'); await say('narr', '', '🐱 노랑이가 "냥" 하고 하품을 했다. 전혀 미안해 보이지 않는다.');
    await topic({ t: [], c: [['고양이부터 볼게요', 3, '…역시 의사 선생님이다. 저는 진료 순위에서 밀렸네요. 하하.', 'laugh'], ['손 이리 주세요', 4, '아, 이 정도는 괜찮은데… 네. 내밀게요. 살살 해 주세요.', 'blush'], ['형사님이 고양이한테 졌어요?', 2, '공식 기록에는 "무승부"로 해 주세요. 부탁이에요.', 'tease']] });
    await say('narr', '', '소독약을 바르자 형사님이 움찔했다. 노랑이는 그 틈에 진료실 의자를 차지했다.');
    await say('det', 'smile', '선생님 첫 환자가 저라니, 영광이네요. 진료비는 귤 한 박스로 될까요?');
    if (cat) { cat.talking = false; cat.follow = 6; }
  } else if (job === 'teacher') {
    const kid = G.villagers.find(v => v.vid === 'kid'); besideDet(kid);
    await say('narr', '', '첫 출근 날. 교실 문을 열자 아이들이 울상이다.');
    await say('kid', 'sad', '선생님! 교실 소라게 「똘이」가 사라졌어요! 아침에 집이 비어 있었어요!');
    await say('narr', '', '그때 복도 끝에서 남색 제복의 남자가 아주 진지한 얼굴로 걸어왔다.');
    await say('det', 'serious', '신고 받고 왔습니다. 실종자… 아니, 실종 게의 인상착의 부탁드립니다.');
    await say('kid', 'surprise', '껍데기가 분홍색이고요! 집게가 짝짝이예요!');
    await say('det', 'serious', '분홍 껍데기, 짝짝이 집게. 결정적인 단서네요. 수첩에 적었습니다.');
    await topic({ t: [], c: [['같이 찾아요, 형사님', 3, '좋아요. 합동 수사본부를 꾸리죠. 선생님이 본부장, 저는 수사반장.', 'smile'], ['(진지한 척 경례한다)', 4, '…큭. 아, 웃으면 안 되는데. 충성. 협조 감사합니다.', 'laugh'], ['소라게도 수사해요?', 2, '해월도에선 소라게도 주민이에요. 주민등록은 없지만.', 'tease']] });
    await say('narr', '', '30분 뒤, 똘이는 형사님 모자 속에서 발견됐다. 아이들이 환호성을 질렀다.');
    await say('det', 'blush', '…대체 언제 들어간 거지. 이건 비밀로 해 주세요, 선생님. 형사 체면이 있어서.');
    if (kid) kid.talking = false;
  } else if (job === 'traveler') {
    await say('narr', '', '배에서 내리자마자 포구에 서 있는 「해월도 파출소 순찰 구역」 안내판이 너무 귀여워서 사진을 찍고 있었다.');
    await say('narr', '', '그런데 등 뒤에서 "흠, 흠" 헛기침 소리가 났다.');
    await say('det', 'serious', '실례합니다. 파출소 안내판을 왜 그렇게 열심히 찍으시는지… 여쭤봐도 될까요?');
    await say('det', 'laugh', '…농담이에요. 표정 봐. 하하, 그 안내판 예쁘죠? 제가 직접 그렸어요.');
    await topic({ t: [], c: [['안내판이 너무 귀여워서요', 3, '그쵸? 제 작품이에요. 여행 후기에 별 다섯 개 부탁드려요.', 'laugh'], ['깜짝 놀랐잖아요!', 2, '미안해요. 새 얼굴이 오면 괜히 장난치고 싶어서. 형사 직업병이에요.', 'smile'], ['그럼 형사님도 찍을게요', 4, '…저요? 아, 잠깐만. 머리 좀 정리하고. …됐어요. 찍어요.', 'blush']] });
    await say('det', 'smile', '숙소 찾아요? 짐 줘요, 들어 드릴게. 해월도 첫 손님은 파출소가 모시는 게 전통이에요.');
    await say('det', 'tease', '방금 생긴 전통이지만요.');
  } else if (job === 'cafe') {
    await say('narr', '', '개업 첫날 아침. 커피 머신이 "푸슉—" 소리를 내더니 멈춰 버렸다.');
    await say('narr', '', '딸랑. 하필 그때 첫 손님이 들어왔다. 남색 제복의 남자다.');
    await say('det', 'normal', '문 연 거죠? 아메리카노 하나… 어, 기계가 왜 그래요?');
    await say('det', 'serious', '잠깐만요. 형사의 감이 말해 주고 있어요. 이런 건 보통…');
    await say('narr', '', '형사님이 머신 옆면을 "톡" 두드렸다. 푸슈욱— 머신이 다시 돌아가기 시작했다.');
    await say('det', 'tease', '거봐요. 해월도 기계들은 다 제 말 들어요. 사람은 잘 안 듣지만.');
    await topic({ t: [], c: [['첫 잔은 공짜예요', 4, '수리비로 받을게요. …이러면 매일 와서 고쳐야겠네.', 'blush'], ['우연이죠?', 2, '우연도 실력이에요. 형사는 운도 수사력이라서.', 'laugh'], ['다음에도 부탁해요', 3, '출장 수리 기사 겸 단골 1호. 접수했습니다.', 'smile']] });
    S.money += 4500; floatText(P, '+4,500원');
  } else {
    await say('narr', '', '첫 물질. 바닷속에서 한참 숨을 참다가 수면 위로 "호오이—" 숨비소리를 내며 올라왔다.');
    await say('narr', '', '그런데 부두 끝에서 누군가 제복 재킷을 벗어 던지고 뛰어들 자세를 하고 있다.');
    await say('det', 'surprise', '괜찮아요?! 3분 넘게 안 올라와서… 지금 막 들어가려던 참이었어요!');
    await say('narr', '', '…형사님은 이미 신발 한 짝을 바다에 빠뜨린 상태였다.');
    await topic({ t: [], c: [['해녀는 원래 오래 참아요', 3, '…아. 그렇죠. 알고 있었어요. 알고는 있었는데 심장이 먼저 뛰어서.', 'blush'], ['신발… 빠졌어요', 2, '……못 본 척해 줄래요? 형사 인생 최대의 굴욕이에요.', 'sad'], ['걱정해 줘서 고마워요', 4, '고맙긴요. 바다는 당신 일터지만, 해안은 제 담당이니까요.', 'smile']] });
    await say('narr', '', '망사리에서 소라 하나를 꺼내 건네자, 형사님이 젖은 신발 한 짝을 들고 멋쩍게 웃었다.');
  }
  await say('det', 'normal', S.detName ? `인사가 늦었네요. 해월도 파출소 형사 ${S.detName}입니다. 다들 그냥 "형사님"이라고 불러요.` : '인사가 늦었네요. 해월도 파출소 형사예요. 다들 그냥 "형사님"이라고 불러요.');
  const nm = await choose([`저는 ${S.name}이에요`, '잘 부탁드려요, 형사님']);
  await say('det', 'tease', nm === 0 ? `${S.name} 씨. 좋은 이름이다. 수첩에 적어 둘게요. 중요 인물로.` : '저야말로요. 앞으로 자주 보겠네요. 이 섬, 좁거든요.');
  S.rel.flags.met = true; S.rel.metDay = S.day; S.rel.daily.met = true; addAff(5, { event: true });
  await addAlbum('첫 만남', 'meet');
  await say('narr', '', '💡 형사님을 눌러 대화하고, 「함께 다니기」로 같이 마을을 걸어 보세요. 위의 🗺 지도를 누르면 그곳으로 걸어가요.');
}
async function detApproach() {
  const d = G.det, P = G.player; scriptDet();
  d.walkTo(P.x, P.y); if (d.path.length) d.path.pop();
  d.say('어, {me}!', 2);
  await waitUntil(() => !d.path.length, 8);
  d.lookAt(P); P.lookAt(d);
  const st = S.rel.stage; S.rel.daily.met = true;
  await say('det', st >= 4 ? 'blush' : 'smile', st >= 8 ? '여보! 여기 있었네. 찾았잖아요.' : st >= 5 ? '찾았다. 보고 싶어서 일부러 이쪽으로 왔어요.' : st >= 4 ? '저기서부터 보였어요. 그래서… 왔어요.' : '멀리서 보여서 왔어요. 오늘 어땠어요?');
  addAff(1);
  if (st >= 4 && S.day % 2 === 0) { const k = season() === 'winter' ? 'hotpack' : pick(['tangerine', 'coffee']); await say('det', 'tease', `이거, 지나가다 생각나서요. ${ITEMS[k].icon}`); S.inv[k] = (S.inv[k] || 0) + 1; toast(`${ITEMS[k].icon} 형사님에게 ${ITEMS[k].name}을(를) 받았다`); }
  if (st >= 3 && !S.comp && detPlan(S.min).k !== 'goHome') {
    await say('det', st >= 5 ? 'smile' : 'normal', st >= 5 ? '오늘 저녁, 같이 있을래요?' : '시간 있으면 좀 걸을래요?');
    const c = await choose(['좋아요', '오늘은 바빠요']);
    if (c === 0) { await say('det', 'smile', '좋다. 앞장서요.'); startCompanion(); } else await say('det', 'smile', '아쉽다. 그럼 내일요.');
  }
}
async function firstWalkEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P); P.lookAt(d);
  await say('det', 'smile', '…같이 걸으니까 길이 짧네요.');
  await say('det', 'tease', '아니, 해월도가 원래 작긴 한데. 오늘은 유난히.');
  await topic({ t: [], c: [['저도 그렇게 느꼈어요', 5, '그쵸? 저만 그런 거 아니죠?', 'blush'], ['형사님 걸음이 빨라서요', 2, '아, 미안해요. 천천히 맞출게요. 당신 보폭으로.', 'laugh'], ['한 바퀴 더 돌까요?', 4, '좋아요. 순찰 핑계 대고 두 바퀴도 가능.', 'smile']] });
  await say('det', 'normal', '앞으로도 자주 걸어요. 이건 공식 제안이에요.');
  S.rel.flags.firstWalk = true; await addAlbum('첫 산책', 'walk'); checkStage();
}
async function pierWaitEvent() {
  scriptDet(); const d = G.det, P = G.player; d.pose = 'stand'; d.lookAt(P); P.lookAt(d);
  await say('det', 'surprise', '왔어요? 기다렸… 아니, 낚시하고 있었어요. 낚시.');
  await say('det', 'tease', '오늘 한 마리도 못 잡은 건, 당신 기다리느라 집중을 못 해서예요.');
  await topic({ t: [], c: [['기다린 거 맞죠?', 4, '…네. 기다렸어요. 됐어요?', 'blush'], ['물고기 탓 아니고요?', 2, '물고기들도 당신 기다렸나 봐요.', 'laugh']] });
  S.rel.flags.pierWait = true; await addAlbum('부두에서 기다려 준 사람', 'pier'); d.task = null;
}
async function nightEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P); P.lookAt(d);
  await say('det', 'surprise', '어? 이 시간에 혼자 다니면 위험해요.');
  await say('det', 'smile', '…라고 형사로서 말하고, 개인적으로는 만나서 반가워요.');
  const i = await topic({ t: [], c: [['데려다 줄래요?', 4, '당연하죠. 야간 순찰 코스 변경. 당신 집 경유.', 'smile'], ['형사님 보러 나왔어요', 5, '…그런 말은 밤에 하면 더 반칙이에요.', 'blush'], ['산책 중이었어요', 2, '그럼 같이 해요. 밤바다 소리 좋거든요.', 'normal']] });
  S.rel.flags.night = true; await addAlbum('야간 순찰 중 우연히', 'night');
  if (i === 0) { const h = MAPS.island.buildings.find(b => b.id === 'home').doorTile; startCompanion(); closeDialog(); walkPlayer(h[0] + 0.5, h[1] + 0.5); }
}
async function rainEvent() {
  scriptDet(); const d = G.det; d.lookAt(G.player);
  await say('narr', '', S.weather === 'snow' ? '눈송이가 굵어졌다. 형사님이 자기 목도리를 풀어 내 목에 감아 주었다.' : '빗방울이 굵어졌다. 형사님이 우산을 펼쳐 내 쪽으로 기울였다.');
  await say('det', 'normal', S.weather === 'snow' ? '감기 걸려요. 이거 하고 있어요.' : '어깨 젖어요. 이쪽으로 더 와요.');
  await topic({ t: [], c: [['형사님이 젖잖아요', 4, '괜찮아요. 형사는 방수예요.', 'laugh'], ['(조금 더 가까이 간다)', 5, '…아, 네. 좋아요. 이 정도.', 'blush']] });
  S.rel.flags.rain = true; await addAlbum(S.weather === 'snow' ? '목도리 하나, 두 사람' : '우산 하나, 두 사람', 'rain');
}
async function nameEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P);
  await say('det', 'blush', '저기… 이제 "형사님" 말고, 이름으로 불러 줄래요?');
  if (!S.detName) {
    await say('det', 'tease', '제 이름, 아직 말 안 했었나? 맞혀 봐요. …농담이고, 불러 주고 싶은 대로 적어 줘요.');
    const n = await askText('형사님 이름 (예: 도윤)', '', 6);
    S.detName = n || '도윤';
  }
  await say('det', 'smile', `${S.detName}. 이제 그렇게 불러요. 저도 {me}라고 부를게요.`);
  const c = await choose([`${S.detName} 씨`, '…아직 쑥스러워요']);
  await say('det', c === 0 ? 'blush' : 'laugh', c === 0 ? '……와. 생각보다 훨씬 좋네요, 이거.' : '천천히 해요. 기다릴게요. 근데 한 번은 들어 보고 싶다.');
  S.rel.flags.named = true; addAff(4, { event: true });
}
async function confessionEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P); P.lookAt(d);
  await say('det', 'serious', '잠깐만요. 할 말이 있어요.');
  await say('det', 'normal', '처음엔 그냥, 새로 온 사람이니까 챙겨야지 했거든요.');
  await say('det', 'blush', '근데 언제부턴가 제 순찰 코스가 전부 당신 쪽으로 바뀌어 있더라고요.');
  await say('det', 'serious', '좋아해요. 장난 아니고, 진심으로.');
  await say('det', 'normal', '대답은 천천히 해도 돼요. 어떤 대답이든 괜찮아요.');
  const c = await choose(['저도 좋아해요', '조금만 더 생각해 볼게요', '지금처럼 지내고 싶어요']);
  if (c === 0) await becomeLovers(false);
  else if (c === 1) { S.rel.confessDay = S.day; await say('det', 'smile', '네. 기다리는 거 잘해요. 낚시꾼이잖아요.'); }
  else { S.rel.flags.declined = true; await say('det', 'sad', '…그래요. 말해 줘서 고마워요.'); await say('det', 'smile', '지금처럼, 좋은 사이로 있어요. 이것도 저는 좋아요.'); }
}
async function playerConfess() {
  if (S.rel.aff < 400) { await say('me', 'blush', '(마음을 전하려다… 조금 더 가까워진 뒤에 말하기로 했다.)'); await say('det', 'tease', '왜요? 할 말 있는 얼굴인데. …천천히 해요. 저 어디 안 가요.'); return; }
  await say('me', 'blush', `${himCall()}, 저… 좋아해요.`);
  await say('det', 'surprise', '……네?');
  await say('det', 'blush', S.rel.flags.declined ? '다시 기회 주는 거예요? …고마워요. 저도요. 계속 좋아하고 있었어요.' : '아, 잠깐만. 그거 제가 먼저 하려고 했는데.');
  await becomeLovers(true);
}
async function becomeLovers(byPlayer) {
  const d = G.det;
  burst(d, 'heart', 10); burst(G.player, 'heart', 6); Sound.sfx('bell');
  await say('det', 'blush', byPlayer ? '저도 좋아해요. 훨씬 전부터.' : '…진짜죠? 취소 안 돼요.');
  await say('det', 'laugh', '아, 큰일 났다. 저 지금 너무 좋아서 순찰 못 하겠어요.');
  S.rel.flags.lovers = true; S.rel.flags.declined = false; S.rel.loverDay = S.day;
  addAff(10, { event: true });
  await addAlbum('우리, 오늘부터', 'confess');
  for (const a of Object.values(G.rivals)) a.bubble = null;
  checkStage();
}
async function nicknameEvent() {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P); P.lookAt(d);
  await say('det', 'tease', '우리 사귄 지 좀 됐는데… 애칭 정할래요?');
  await say('det', 'blush', '"형사님"도 "이름"도 좋지만, 우리끼리만 부르는 거. 갖고 싶어요.');
  await say('det', 'smile', '먼저 저를 뭐라고 부를래요?');
  const opts = ['자기', '곰돌이', `${S.detName || '형사'}ㅇㅣ`.replace('ㅇㅣ', '이'), '직접 정할래요'];
  let c = await choose(opts), nick = opts[c];
  if (c === 3) nick = (await askText('형사님 애칭', '', 6)) || '자기';
  S.names.detNick = nick;
  await say('det', 'blush', `${nick}… 와, 귀가 다 빨개지네. 좋아요. 이제 그거예요.`);
  await say('det', 'smile', '그럼 저는 당신을 뭐라고 부를까요? 듣고 싶은 거 있어요?');
  const o2 = ['자기야', `우리 ${S.name}`, '귤 공주 / 귤 왕자', '직접 정할래요'];
  c = await choose(o2); let me = o2[c];
  if (c === 2) me = '우리 귤';
  if (c === 3) me = (await askText('나를 부를 애칭', '', 6)) || '자기';
  S.names.meNick = me;
  await say('det', 'laugh', `${me}. ${me}. …연습 중이에요. 익숙해질 때까지 계속 부를 거예요.`);
  S.rel.flags.nickname = true; addAff(6, { event: true });
  await addAlbum('우리만의 애칭', 'nick'); checkStage();
}
async function anniversaryEvent(n) {
  scriptDet(); const d = G.det, P = G.player; d.lookAt(P);
  await say('det', 'smile', `오늘 우리 ${n}일이에요. 알고 있었어요?`);
  await say('det', 'blush', n >= 100 ? '백 일 동안 매일 좋았어요. 하루도 빠짐없이.' : '벌써 이만큼 됐네요. 시간이 너무 빨라요.');
  if (n >= 100) { S.inv.flower = (S.inv.flower || 0) + 1; toast('💐 수국 꽃다발을 받았다'); }
  const c = await choose(['앞으로도 잘 부탁해요', '선물은요? (장난)']);
  await say('det', c === 0 ? 'smile' : 'laugh', c === 0 ? '제가 더요. 평생.' : '…선물은 저예요. 하하. 아니, 진짜 준비했어요. 저녁에 등대로 가요.');
  S.rel.flags['anni' + n] = true; addAff(6, { event: true });
  await addAlbum(`${n}일 기념일`, 'anni');
}
async function fightTalk() {
  const r = S.rel;
  await say('det', 'sad', '……');
  await say('det', 'normal', '어제 같이 노을 보기로 한 거… 잊었죠? 한참 기다렸어요.');
  const c = await choose(['미안해요, 정말로', '…저도 바빴어요', '(아무 말 없이 손을 잡는다)']);
  if (c === 1) { await say('det', 'sad', '…그렇죠. 알아요. 저도 미안해요, 서운한 티 내서.'); await say('det', 'smile', '우리 화해해요. 오늘 저녁엔 꼭 같이 노을 봐요.'); }
  else if (c === 0) { await say('det', 'smile', '…사과 받아 줄게요. 사실 화 안 났어요. 보고 싶었던 거예요.'); }
  else { await say('det', 'blush', '…이러면 화를 낼 수가 없잖아요. 반칙이에요.'); }
  r.daily.fight = false; r.flags.fightDone = true; addAff(c === 1 ? 2 : 5, { event: true });
  await addAlbum('첫 다툼과 화해', 'fight');
}
async function sickEvent() {
  const d = G.det, r = S.rel;
  scriptDet(); d.lookAt(G.player); r.daily.nursed = true;
  await say('det', 'sad', '콜록… 어, 어떻게 알고 왔어요? 옮으면 안 되는데…');
  const hasP = (S.inv.porridge || 0) > 0;
  const c = await choose([hasP ? '전복죽 끓여 왔어요 🥣' : '이마 짚어 볼게요', '약 먹었어요?', '오늘은 제가 옆에 있을게요']);
  if (c === 0 && hasP) { S.inv.porridge--; await say('det', 'blush', '…전복죽. 이거 먹으면 진짜 다 나을 것 같아요. 고마워요.'); addAff(8, { event: true }); }
  else if (c === 0) { await say('det', 'blush', '손 차갑다… 좋아요. 이대로 있어 줘요.'); addAff(5, { event: true }); }
  else if (c === 1) { await say('det', 'smile', '네, 먹었어요. 당신 목소리 들으니까 벌써 반은 나았어요.'); addAff(4, { event: true }); }
  else { await say('det', 'blush', '…그럼 잠들 때까지만요. 손 잡고.'); addAff(6, { event: true }); }
  r.flags.nursed = true;
  await addAlbum('간호하던 날', 'sick');
}
async function proposalEvent() {
  const d = G.det, P = G.player; scriptDet(); d.lookAt(P); P.lookAt(d);
  G.camFocus = { x: (d.x + P.x) / 2, y: (d.y + P.y) / 2 };
  await say('det', 'smile', '와 줬네요. …노을, 예쁘죠.');
  await say('det', 'normal', `우리 처음 만난 날 기억해요? ${dateLabel(S.rel.metDay)}. 저는 그날 수첩에 당신 이름을 적었어요.`);
  await say('det', 'blush', '그 뒤로 일 년 동안, 제 수첩은 전부 당신 얘기예요.');
  await say('narr', '', '형사님이 한쪽 무릎을 꿇고, 주머니에서 작은 상자를 꺼냈다.');
  burst(d, 'heart', 10); Sound.sfx('bell');
  await say('det', 'serious', `{me}. 저랑 결혼해 줄래요? 해월도에서, 평생.`);
  const c = await choose(['네, 좋아요 💍', '조금만 더 기다려 줄래요?', '아직은 지금이 좋아요']);
  if (c === 0) {
    await say('det', 'blush', '……진짜요? 하, 손 떨려서 반지를 못 끼우겠어요.');
    await kissAnim('💍♥');
    S.rel.flags.engaged = true; S.rel.daily.proposal = false; addAff(20, { event: true });
    await addAlbum('등대 아래 프로포즈', 'propose');
    await say('det', 'smile', '결혼식은 언제 할까요? 당신이 정해 줘요. 저는 언제든 좋아요.');
    closeDialog(); checkStage();
    await pickWeddingDate();
  } else if (c === 1) { S.rel.proposeDay = S.day; S.rel.daily.proposal = false; await say('det', 'smile', '네. 반지는 제가 잘 가지고 있을게요. 준비되면 말해 줘요.'); }
  else { S.rel.flags.proposeLater = true; S.rel.daily.proposal = false; await say('det', 'smile', '…알겠어요. 지금도 충분히 행복하니까. 마음 바뀌면 당신이 말해 줘요.'); }
}
async function playerPropose() {
  const r = S.rel;
  if ((S.inv.ring || 0) < 1) { await say('me', 'normal', '(반지가 없다. 마을 슈퍼에서 은반지를 살 수 있다.)'); return; }
  if (S.day - r.metDay < 120 || r.aff < 900) { await say('me', 'blush', '(반지를 꺼내려다… 아직은 이른 것 같아 다시 넣었다. 만난 지 1년, 그리고 더 깊은 마음이 필요해.)'); await say('det', 'tease', '왜요? 주머니에 뭐 있어요? …수사해 볼까.'); return; }
  S.inv.ring--;
  await say('me', 'blush', `${himCall()}, 저랑… 결혼해 줄래요?`);
  await say('det', 'surprise', '……');
  await say('det', 'blush', '이건 제가 하려고 했는데. 매번 당신이 먼저네요. …네. 네. 당연히요.');
  await kissAnim('💍♥');
  r.flags.engaged = true; addAff(20, { event: true });
  await addAlbum('우리의 약속', 'propose');
  closeDialog(); checkStage();
  await pickWeddingDate();
}
function seasonStartDay(after) {
  for (let d = after + 1; d < after + 200; d++) { const c = calendar(d), p = calendar(d - 1); if (c.season !== p.season) return d; }
  return after + 30;
}
function pickWeddingDate() {
  return new Promise((res) => {
    const opt = (days, label) => { const day = S.day + days; return { icon: '💒', label, note: `${dateLabel(day)} (${SEASON_KO[calendar(day).season]})`, onClick: () => { setWedding(day); res(); } }; };
    const ns = seasonStartDay(S.day);
    openSheet({ title: '결혼식 날짜 정하기', sub: '<div class="relneed">원하는 날을 골라요. 나중에 형사님 메뉴에서 바꿀 수 있어요.</div>', cols: 2, onClose: () => res(), items: [
      opt(5, '5일 뒤'), opt(10, '10일 뒤'), opt(20, '20일 뒤'),
      { icon: SEASON_ICON[calendar(ns).season], label: `다음 계절 첫날`, note: `${dateLabel(ns)} (${SEASON_KO[calendar(ns).season]})`, onClick: () => { setWedding(ns); res(); } },
      { icon: '📅', label: '직접 고르기', wide: true, keep: true, onClick: () => { closeSheet(); monthPicker(res); } },
    ] });
  });
}
function monthPicker(done) {
  const items = [];
  for (let k = 0; k < 12; k++) {
    const first = S.day + 1 + k * DAYS_PER_MONTH - ((S.day) % DAYS_PER_MONTH) + (k === 0 ? 0 : 0);
    const c = calendar(Math.max(S.day + 1, first));
    items.push({ icon: SEASON_ICON[c.season], label: `${c.year > calendar(S.day).year ? '내년 ' : ''}${c.month}월`, keep: true, onClick: () => { closeSheet(); dayPicker(Math.max(S.day + 1, first), done); } });
  }
  openSheet({ title: '몇 월에 할까요?', cols: 3, items, onClose: done });
}
function dayPicker(fromDay, done) {
  const c0 = calendar(fromDay), start = fromDay - (c0.dom - 1);
  const items = [];
  for (let dd = 1; dd <= DAYS_PER_MONTH; dd++) {
    const day = start + dd - 1;
    const ev = EVENTS.find(e => e.m === c0.month && e.d === dd);
    items.push({ icon: ev ? ev.icon : '💒', label: `${c0.month}월 ${dd}일`, note: ev ? ev.name : '', disabled: day <= S.day, why: '오늘 이후의 날짜를 골라요', onClick: () => { setWedding(day); done(); } });
  }
  openSheet({ title: `${c0.month}월 며칠?`, cols: 3, items, onClose: done });
}
function setWedding(day) { S.wedding = day; toast(`💒 결혼식: ${dateLabel(day)} — 그날 해수욕장 쪽에서 형사님이 기다려요`); save(); }
function weddingDateMenu() {
  runEvent(async () => {
    G.det.talking = true;
    await say('det', 'smile', S.wedding ? `우리 결혼식은 ${dateLabel(S.wedding)}이에요. 바꾸고 싶어요?` : '결혼식 날짜, 정해 볼까요?');
    const c = await choose(['날짜 다시 정하기', '그대로 좋아요']);
    closeDialog();
    if (c === 0) { G.busy--; await pickWeddingDate(); G.busy++; }
  });
}
async function weddingEvent() {
  const d = G.det, P = G.player, r = S.rel;
  scriptDet();
  await say('det', 'blush', '왔어요? …오늘 진짜 예쁘다. 아니, 매일 예뻤는데 오늘은 반칙이에요.');
  await fade(true);
  r.daily.weddingDone = true; d.outfit = 'suit'; P.outfit = 'wedding';
  P.map = 'island'; M = MAPS.island;
  const [bx, by] = P_('beach'); P.x = bx - 1; P.y = by; d.x = bx + 1; d.y = by; d.map = 'island'; d.visible = true; P.face = d.face = 'f';
  G.tempObjs = [{ kind: 'furn', k: 'wedding', x: Math.floor(bx), y: Math.floor(by) - 1, solid: false }, ...[[-4, -2], [4, -2], [-4, -4], [4, -4]].map(([x, y]) => ({ kind: 'lantern', x: Math.floor(bx) + x, y: Math.floor(by) + y, solid: false }))];
  const guests = [...G.villagers, ...Object.values(G.rivals), ...G.pets];
  guests.forEach((a, i) => { a.map = 'island'; a.visible = true; a.stop(); a.x = bx - 5 + (i % 10) * 1.1; a.y = by - 3 - Math.floor(i / 10) * 1.2 - (i % 2) * 0.3; a.face = 'f'; a.left = a.x > bx; a.talking = true; });
  G.camFocus = { x: bx, y: by - 1.2 }; G.camSnap = true;
  await sleep(300); await fade(false);
  for (let i = 0; i < 6; i++) spawnFx('confetti');
  await say('chief', 'smile', '에헴. 오늘 해월도에 경사가 났습니다. 다들 조용!');
  await say('chief', 'smile', `${S.detName || '형사'} 군, 그리고 ${S.name} 님. 바다처럼 넓고, 귤처럼 달게 살겠습니까?`);
  await say('det', 'serious', '네. 평생 지키겠습니다. 이 섬도, 이 사람도.');
  const c = await choose(['네, 평생 함께할게요', '네! (눈물이 핑 돈다)']);
  await say('chief', 'laugh', '그럼 이제 신랑 신부, 입을 맞추시오! 허허.');
  await kissAnim('♥ 쪽 ♥', 'bell');
  for (let i = 0; i < 12; i++) spawnFx('confetti');
  for (const a of guests) burst(a, 'heart', 2);
  await say('halmeoni', 'laugh', '아이고 우리 형사 양반 장가가네! 잘 살어~');
  await say('narr', '', '부케를 높이 던졌다! …노랑이가 부케를 물고 도망갔다.');
  await say('det', 'blush', c === 1 ? '울지 마요. 저까지 울잖아요. …사랑해요, 여보.' : '사랑해요, 여보. 오늘부터 우리 집이에요.');
  r.flags.married = true; r.marriedDay = S.day; addAff(30, { event: true });
  await addAlbum('해월도 결혼식', 'wedding');
  for (const a of guests) a.talking = false;
  G.tempObjs = [];
  checkStage();
  if (!S.comp) startCompanion();
}
async function pickupEvent() {
  const d = G.det; scriptDet(); d.lookAt(G.player); S.rel.daily.pickup = true;
  await say('det', 'smile', '마중 나왔어요? …하루 피로가 다 날아가네요. 같이 집에 가요, 여보.');
  addAff(2); startCompanion();
}
async function morningMarried() {
  await say('det', 'smile', pick(['잘 잤어요, 여보? 아침 차려 놨어요.', '좋은 아침. 오늘도 사랑해요.', '여보, 일어났어요? 오늘 날씨 좋대요.']));
  if (S.day % 2 === 0) { S.inv.lunchbox = (S.inv.lunchbox || 0) + 1; await say('det', 'tease', '도시락 싸 놨어요. 점심 거르면 안 돼요.'); toast('🍱 수제 도시락을 받았다'); }
  closeDialog();
}

/* ---------------- 계절 행사 ---------------- */
async function seasonEvent(ev) {
  const r = S.rel, d = G.det, P = G.player;
  r.daily.eventsSeen[ev.id] = true;
  S.eventsDone[ev.id + '_' + calendar(S.day).year] = true;
  const withDet = r.flags.met && d.visible && d.map === P.map && dist(d, P) < 6;
  if (withDet) { scriptDet(); d.walkTo(P.x, P.y); if (d.path.length) d.path.pop(); await waitUntil(() => !d.path.length, 6); d.lookAt(P); P.lookAt(d); }
  G.camFocus = { x: (P_(ev.at)[0] + P.x) / 2, y: (P_(ev.at)[1] + P.y) / 2 };
  await say('narr', '', `${ev.icon} ${ev.name}`);
  if (withDet) {
    await talk(ev.lines[tierOf(r.stage)]);
    const c = await choose(ev.choice.map(x => x[0]));
    await say('det', 'smile', ev.choice[c][2]);
    addAff(ev.choice[c][1], { event: true });
  } else await say('narr', '', pick(['마을 사람들이 모두 모여 웃고 있다.', '섬 전체가 들뜬 분위기다.', '이런 날엔 누군가와 함께 있고 싶어진다.']));
  if (ev.reward) { S.inv[ev.reward] = (S.inv[ev.reward] || 0) + 1; toast(`${ITEMS[ev.reward].icon} ${ITEMS[ev.reward].name}을(를) 받았다`); }
  await addAlbum(ev.name, 'season');
}

/* ---------------- 함께 앉기 · 낚시 · 사진 · 데이트 ---------------- */
function nearestBench(from) {
  let best = null, bd = 1e9;
  for (const [k, bk] of Object.entries(MAPS[from.map].benches)) { const s = bk.stand[0], dd = Math.hypot(s[0] + 0.5 - from.x, s[1] + 0.5 - from.y); if (dd < bd) { bd = dd; best = k; } }
  return [best, bd];
}
async function walkBothTo(pp, dp) {
  const P = G.player, d = G.det; d.scripted = true;
  P.walkTo(pp[0], pp[1]); d.walkTo(dp[0], dp[1]);
  await waitUntil(() => !P.path.length && !d.path.length, 25);
  if (Math.hypot(P.x - pp[0], P.y - pp[1]) > 0.5) { P.x = pp[0]; P.y = pp[1]; }
  if (Math.hypot(d.x - dp[0], d.y - dp[1]) > 0.5) { d.x = dp[0]; d.y = dp[1]; }
}
async function sitTogether(benchKey) {
  await runEvent(async () => {
    const P = G.player, d = G.det;
    const [k] = benchKey ? [benchKey] : nearestBench(P);
    if (!k) { toast('여기엔 앉을 벤치가 없어요'); return; }
    const bk = M.benches[k];
    scriptDet();
    if (Math.hypot(P.x - bk.stand[0][0] - 0.5, P.y - bk.stand[0][1] - 0.5) > 1.2) toast(`🪑 ${bk.name}(으)로 같이 가요`);
    await walkBothTo([bk.stand[0][0] + 0.5, bk.stand[0][1] + 0.5], [bk.stand[1][0] + 0.5, bk.stand[1][1] + 0.5]);
    P.sitAt(k, 0); d.sitAt(k, 1);
    await sleep(500);
    const tier = S.rel.stage >= 5 ? 2 : S.rel.stage >= 3 ? 1 : 0;
    await talk((SIT_TALK[bk.place] || SIT_TALK.cafe)[tier]);
    if (!S.rel.flags.firstSit) {
      await say('det', 'normal', '이렇게 나란히 앉으니까 이상하게 말이 잘 안 나오네요.');
      await say('det', 'tease', '형사는 원래 마주 앉는 게 익숙해서요. 취조실에서.');
      await topic({ t: [], c: [['취조당하는 기분이에요?', 3, '아니요. 오히려 제가 자백할 것 같아서 문제예요.', 'laugh'], ['옆에 앉는 게 좋아요', 5, '…저도요. 같은 걸 보잖아요.', 'blush'], ['조용한 것도 좋네요', 3, '네. 이런 시간, 좋다.', 'smile']] });
      S.rel.flags.firstSit = true; await addAlbum('나란히 앉은 시간', 'sit');
    } else if (!S.rel.daily.sit[k]) addAff(2);
    S.rel.daily.sit[k] = true;
    advanceTime(20);
    if (confessReady()) { closeDialog(); await confessionEvent(); }
    closeDialog();
    toast(S.rel.stage >= 5 ? '벤치에서 「어깨 기대기」를 할 수 있어요 · 화면을 누르면 일어나요' : '화면을 누르면 일어나요');
  });
}
function standUpPlayer() {
  const P = G.player, d = G.det; if (!P.seat) return;
  const bench = P.seat.bench; P.standUp(); P.lean = false;
  if (S.comp && d.seat && d.seat.bench === bench) { d.standUp(); G.compSettled = false; }
}
function benchAction(k) {
  const P = G.player, d = G.det;
  if (S.comp && S.rel.stage >= 2) { sitTogether(k); return; }
  const bk = M.benches[k], occupied = d.seat && d.seat.bench === k && d.map === M.id;
  P.sitAt(k, occupied && d.seat.idx === 0 ? 1 : 0);
  if (occupied && S.rel.flags.met && !S.rel.daily.sit[k]) {
    runEvent(async () => {
      d.talking = true;
      await say('det', 'surprise', '어? 옆자리 앉은 거예요?');
      await say('det', 'smile', S.rel.stage >= 2 ? '점심시간이라 다행이다. 같이 쉬어요.' : '하하, 여기 자리 좋죠. 점심 먹는 중이었어요.');
      S.rel.daily.sit[k] = true; S.rel.daily.met = true;
      if (!S.rel.flags.firstSit && S.rel.stage >= 2) { S.rel.flags.firstSit = true; addAff(4, { event: true }); await addAlbum('나란히 앉은 시간', 'sit'); } else addAff(1);
      d.talking = false;
    });
  } else toast(`🪑 ${bk.name}에 앉았다 — 화면을 누르면 일어나요`);
}
function fishSpot() {
  const P = G.player, pl = curPlace();
  if (P.map === 'island' && pl === 'fishing') return 'pier';
  if (P.map === 'island' && tileAt(Math.floor(P.x), Math.floor(P.y)) === T.ROCK && nextToWater(P.x, P.y)) return 'rocks';
  if (P.map === 'islet' && tileAt(Math.floor(P.x), Math.floor(P.y)) === T.WOOD && P.x < 4) return 'islet';
  return null;
}
function rollFish(spot) {
  const tb = FISH_SPOTS[spot].table, pool = [...tb.all, ...(tb[season()] || []), ...(tb[season()] || [])];
  if (Math.random() < 0.06) return { id: null, item: Math.random() < 0.5 ? 'boot' : 'seaweed' };
  let id = pick(pool); if (FISH[id].rare && Math.random() < 0.6) id = tb.all[0];
  const f = FISH[id]; return { id, size: Math.round(rand(f.min, f.max)), item: 'f_' + id };
}
async function fishTogether() {
  await runEvent(async () => {
    const P = G.player, d = G.det; scriptDet();
    toast('🎣 부두 끝 낚시터로 가요');
    if (P.map !== 'island') { await goMap('island', ...P_('boatSpot')); }
    await walkBothTo(P_('pierEnd'), P_('pierEnd2'));
    P.pose = 'fish'; d.pose = 'fish'; P.face = d.face = 'f'; P.left = d.left = false;
    await say('det', 'tease', '지는 사람이 내일 커피 사기. 콜?');
    closeDialog();
    const res = await fishMinigame('pier');
    const his = Math.random() < 0.6 ? rollFish('pier') : null;
    const mine = res && res.size || 0, hisS = his && his.size || 0;
    await say('det', his ? 'smile' : 'sad', his && his.id ? `저는 ${FISH[his.id].name} ${hisS}cm. ` + (mine > hisS ? '…졌다. 커피는 제가 살게요.' : mine ? '이겼다! 내일 커피 기대할게요.' : '하하, 다음엔 미끼 제가 끼워 줄게요.') : '저는 꽝… 오늘은 물고기들이 당신 편이네.');
    if (S.rel.daily.fish < 1) { S.rel.daily.fish++; addAff(2); }
    if (!S.rel.flags.fishDuel) { S.rel.flags.fishDuel = true; await addAlbum('낚시 대결', 'fish'); }
    P.pose = 'stand'; d.pose = 'stand';
  });
}
async function soloFish(spot) {
  await runEvent(async () => {
    const P = G.player; P.pose = 'fish'; P.face = 'f'; P.left = spot === 'rocks' || spot === 'islet';
    await fishMinigame(spot);
    P.pose = 'stand';
  });
}
function fishMinigame(spot) {
  return new Promise(async (res) => {
    G.fishing = { bite: false, res, done: false, spot };
    setAction({ label: '기다리는 중…', icon: '🎣' }, true);
    await sleep(rand(1800, 4200));
    if (!G.fishing) return;
    G.fishing.bite = true; G.player.emo('❗', 1.3); Sound.sfx('splash');
    setAction({ label: '지금! 챔질!', icon: '❗', hot: true }, true);
    G.fishing.timer = setTimeout(() => endFish(false), 1500);
  });
}
function fishTap() { if (G.fishing && G.fishing.bite) endFish(true); }
async function endFish(ok) {
  const f = G.fishing; if (!f || f.done) return; f.done = true; clearTimeout(f.timer); G.fishing = null;
  setAction(null, true);
  let r = null;
  if (ok) {
    r = rollFish(f.spot); S.inv[r.item] = (S.inv[r.item] || 0) + 1; burst(G.player, 'spark', 5); Sound.sfx('coin');
    if (r.id) { const prev = S.dex[r.id] || 0; if (r.size > prev) S.dex[r.id] = r.size; await say('narr', '', `🐟 ${FISH[r.id].name} ${r.size}cm${prev ? (r.size > prev ? ' — 신기록!' : '') : ' — 도감에 새로 등록!'}`); }
    else await say('narr', '', `…${ITEMS[r.item].icon} ${ITEMS[r.item].name}이(가) 걸려 올라왔다.`);
  } else await say('narr', '', '…아, 놓쳐 버렸다.');
  f.res(r);
}
async function takePhoto() {
  const d = G.det, P = G.player;
  scriptDet(); d.lookAt(P); d.face = 'f'; P.face = 'f';
  await say('det', 'smile', S.rel.stage >= 5 ? '더 가까이 와요. 화면에 안 들어와요. …핑계예요.' : '사진이요? 좋아요. 하나, 둘…');
  closeDialog();
  const fl = $('#flash'); fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 160);
  d.emo('✌'); P.emo('✌'); Sound.sfx('tap');
  await sleep(200);
  await addAlbum('함께 찍은 사진', 'photo');
  toast('📷 추억 앨범에 저장했어요');
}
function dateMenu() {
  const items = Object.entries(DATES).map(([k, D]) => {
    const lock = D.minStage && S.rel.stage < D.minStage;
    return { icon: D.icon, label: D.name, locked: lock, why: '「깊어진 연인」 단계에서 열려요', note: lock ? `${D.minStage}단계` : D.time && S.min < D.time ? `${fmtTime(D.time)}부터` : '', onClick: () => doDate(k) };
  });
  openSheet({ title: '데이트 장소', sub: '<div class="relneed">하루 한 번 데이트에 특별한 추억과 호감도가 남아요.</div>', items, cols: 2 });
}
async function doDate(k) {
  await runEvent(async () => {
    const D = DATES[k], P = G.player, d = G.det;
    if (S.min >= 23 * 60) { await say('det', 'smile', '오늘은 너무 늦었어요. 내일 꼭 가요. 약속.'); return; }
    if (D.time && S.min < D.time) { await say('det', 'tease', `${D.name}은(는) ${fmtTime(D.time)}쯤이 제일 좋아요. 그때까지 같이 있어요.`); S.min = D.time; }
    if (!S.comp) startCompanion();
    scriptDet();
    const DP = typeof D.pos === 'string' ? P_(D.pos) : D.pos;
    if (P.map !== D.map) { await goMap(D.map, DP[0], DP[1]); }
    await fade(true);
    if (P.seat) P.standUp(); if (d.seat) d.standUp();
    P.stop(); d.stop(); d.map = P.map;
    [P.x, P.y] = nearestWalkable(DP[0], DP[1]);
    const n = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([a, b]) => [Math.floor(P.x) + a, Math.floor(P.y) + b]).find(([x, y]) => walkable(x, y)) || [Math.floor(P.x), Math.floor(P.y)];
    d.x = n[0] + 0.5; d.y = n[1] + 0.5;
    if (D.bench && M.benches[D.bench]) { P.sitAt(D.bench, 0); d.sitAt(D.bench, 1); } else { d.lookAt(P); P.lookAt(d); }
    if (D.fish) { P.pose = d.pose = 'fish'; P.face = d.face = 'f'; P.left = d.left = false; }
    G.camSnap = true;
    await sleep(250); await fade(false);
    await talk(D.lines);
    const c = await choose(D.c.map(x => x[0]));
    await say('det', 'smile', D.c[c][1]);
    burst(d, 'heart', 6);
    S.rel.dates++; S.rel.dateLog.unshift({ k, day: S.day }); S.rel.dateLog = S.rel.dateLog.slice(0, 30);
    if (!S.rel.daily.date) { S.rel.daily.date = true; addAff(7, { event: true }); await addAlbum(D.name, 'date'); }
    if (!S.rel.flags.firstDate) { S.rel.flags.firstDate = true; await say('det', 'blush', '첫 데이트였네요, 오늘. 기억해 둘게요. 평생.'); }
    advanceTime(90);
    closeDialog();
    if (D.fish) { P.pose = 'stand'; d.pose = 'stand'; }
  });
}
async function cookTogether() {
  await runEvent(async () => {
    const d = G.det; scriptDet(); d.lookAt(G.player);
    await say('det', 'smile', '오늘 메뉴는 뭐예요, 셰프님? 저는 보조 요원.');
    const c = await choose(['보말 칼국수', '전복죽', '귤 샐러드']);
    await say('narr', '', ['칼국수 면을 같이 밀었다. 밀가루가 형사님 코에 묻었다.', '전복을 손질하고 죽을 저었다. 고소한 냄새가 집 안에 퍼진다.', '귤을 까서 샐러드를 만들었다. 반은 만들면서 먹었다.'][c]);
    await say('det', 'laugh', ['코에 뭐 묻었다고요? …당신 볼에도 묻었는데요.', '맛있다. 이 맛 평생 기억할 거예요.', '샐러드 반은 우리 배 속에 있네요.'][c]);
    if (c === 1) S.inv.porridge = (S.inv.porridge || 0) + 1;
    if (!S.rel.daily.cook) { S.rel.daily.cook = true; addAff(4); }
    if (!S.rel.flags.cook) { S.rel.flags.cook = true; await addAlbum('같이 만든 저녁', 'cook'); }
    advanceTime(60);
  });
}
function startPiggy() { const P = G.player, d = G.det; P.carried = true; d.carrying = true; P.stop(); d.stop(); burst(d, 'heart', 4); toast('🎒 업혀서 이동 중 — 가고 싶은 곳을 누르세요 · 행동 버튼으로 내려요'); }
function stopPiggy() { const P = G.player, d = G.det; P.carried = false; d.carrying = false; const n = nearestWalkable(d.x + 1, d.y); [P.x, P.y] = n; G.compSettled = false; }

/* ---------------- 추억 앨범 ---------------- */
async function addAlbum(title, kind) {
  const P = G.player, d = G.det;
  const both = d.visible && d.map === P.map;
  const midX = both ? (P.x + d.x) / 2 : P.x, midY = both ? (P.y + d.y) / 2 : P.y;
  const prevFocus = G.camFocus;
  G.camFocus = { x: midX, y: midY }; G.camSnap = true;
  render(0.016);
  const [sx, sy] = iso(midX, midY);
  const Wd = Math.round(130 * R.K), Hd = Math.round(98 * R.K);
  const c = mkCanvas(130, 98), cg = c.getContext('2d'); cg.imageSmoothingEnabled = false;
  cg.drawImage(R.view, SX(sx) - Wd / 2, SY(sy - 24) - Hd / 2, Wd, Hd, 0, 0, 130, 98);
  G.camFocus = prevFocus;
  let img = null; try { img = c.toDataURL('image/jpeg', 0.82); } catch (e) { }
  const pl = curPlace();
  S.album.unshift({ title, kind, day: S.day, date: dateLabel(), time: fmtTime(S.min), place: placeName(pl) || '해월도', stage: S.rel.stage, img });
  const photos = S.album.filter(a => a.kind === 'photo');
  if (S.album.length > 48 && photos.length) S.album.splice(S.album.lastIndexOf(photos[photos.length - 1]), 1);
  S.album = S.album.slice(0, 60);
  if (kind !== 'photo') toast(`📔 추억 앨범: 「${title}」`);
  save();
}

/* ---------------- 이벤트 트리거 ---------------- */
function confessReady() {
  const r = S.rel;
  return r.stage === 4 && r.aff >= 400 && daysKnown() >= 15 && !r.flags.lovers && !r.flags.declined && S.day - r.confessDay >= 3 && S.min >= 17 * 60;
}
function checkEvents() {
  if (G.busy || paused() || G.working || G.fishing || G.decor) return;
  const d = G.det, P = G.player, r = S.rel, pl = curPlace(), dd = dist(d, P);
  const ev = activeEvent();
  if (ev && ev.map === P.map && !r.daily.eventsSeen[ev.id] && Math.hypot(P.x - P_(ev.at)[0], P.y - P_(ev.at)[1]) < 3.2) { runEvent(() => seasonEvent(ev)); return; }
  if (!d.visible || d.map !== P.map) return;
  if (!r.flags.met && dd < 2.2) { runEvent(firstMeeting); return; }
  if (!r.flags.met) return;
  const nearP = (k, rr) => P.map === 'island' && Math.hypot(P.x - P_(k)[0], P.y - P_(k)[1]) < rr;
  if (!r.flags.engaged && r.daily.proposal && S.min >= 17.5 * 60 && S.min < 21.5 * 60 && dd < 2.5 && (d.task === 'waitLighthouse' || (S.comp && nearP('lighthouse', 3.5)))) { runEvent(proposalEvent); return; }
  if (!r.flags.married && S.wedding === S.day && S.min >= 9 * 60 && S.min < 18 * 60 && dd < 3 && (d.task === 'wedding' || (S.comp && nearP('beach', 4)))) { runEvent(weddingEvent); return; }
  if (d.task === 'pickup' && dd < 2.2 && !r.daily.pickup) { runEvent(pickupEvent); return; }
  if (S.comp) {
    if (r.stage >= 2 && !r.flags.firstWalk && G.walkedTogether >= 30 && ['pier', 'beach', 'coast', 'lighthouse', 'fishing', 'observatory', 'rocks'].includes(pl) && !P.moving) { runEvent(firstWalkEvent); return; }
    if (r.stage >= 3 && (S.weather === 'rain' || S.weather === 'snow') && !r.flags.rain && G.rainWalk >= 12) { runEvent(rainEvent); return; }
    if (r.stage >= 4 && !r.flags.named && !P.moving && dd < 2.2) { runEvent(nameEvent); return; }
    if (confessReady() && ['lighthouse', 'pier', 'observatory', 'fishing', 'beach', 'coast', 'pavilion'].includes(pl) && !P.moving && dd < 2) { runEvent(confessionEvent); return; }
    if (r.stage >= 5 && !r.flags.nickname && loverDays() >= 3 && S.min >= 16 * 60 && !P.moving && dd < 2.2) { runEvent(nicknameEvent); return; }
    for (const n of [50, 100]) if (r.flags.lovers && loverDays() >= n && !r.flags['anni' + n] && !P.moving && dd < 2.2) { runEvent(() => anniversaryEvent(n)); return; }
    if (r.stage === 1 && !P.moving && pl && GUIDE[pl] && !r.guide[pl] && dd < 3) { r.guide[pl] = true; d.lookAt(P); d.say(GUIDE[pl], 5); addAff(1, { quiet: true }); return; }
  } else {
    if (r.stage >= 3 && !r.flags.pierWait && d.task === 'fishing' && d.pose === 'fish' && dd < 2.5) { runEvent(pierWaitEvent); return; }
    if (r.stage >= 2 && !r.flags.night && S.min >= 21 * 60 && dd < 3 && !r.flags.married) { runEvent(nightEvent); return; }
  }
  if (G.forceEndComp) {
    G.forceEndComp = false;
    if (S.comp && !r.flags.married) runEvent(async () => { await say('det', 'smile', '벌써 열 시네요. 오늘은 여기까지. 집에 들어가는 거 보고 갈게요.'); closeDialog(); endCompanion(true); });
  }
}

/* ---------------- 시간 · 하루 ---------------- */
function advanceTime(mins) {
  const before = S.min; S.min += mins;
  if (S.comp) {
    S.rel.together += mins; G.togetherAcc += mins;
    if (G.togetherAcc >= 20) { G.togetherAcc -= 20; if (S.rel.daily.togetherAff < 6) { S.rel.daily.togetherAff++; addAff(1, { quiet: true }); } }
  }
  if (before < 22 * 60 && S.min >= 22 * 60 && S.comp) G.forceEndComp = true;
  if (S.min >= 24 * 60) G.dayOver = true;
}
function rollWeather() {
  const c = calendar(S.day), se = c.season, ev = todayEvents().find(e => e.weather);
  if (ev) return ev.weather;
  const r = Math.random();
  if (se === 'winter') return r < 0.25 ? 'snow' : r < 0.45 ? 'cloudy' : 'sunny';
  if (se === 'summer') return r < 0.2 ? 'rain' : r < 0.38 ? 'cloudy' : 'sunny';
  if (se === 'autumn') return r < 0.12 ? 'rain' : r < 0.35 ? 'cloudy' : 'sunny';
  return r < 0.16 ? 'rain' : r < 0.36 ? 'cloudy' : 'sunny';
}
function planDay() {
  const r = S.rel, d = r.daily;
  if (r.flags.met && r.stage >= 2 && r.stage <= 4 && !r.flags.lovers && Math.random() < 0.45) {
    const jobs = Object.keys(G.rivals); if (jobs.length) { const st = rand(17.5 * 60, 18.6 * 60); d.rival = { job: pick(jobs), start: st, end: st + 45, done: false }; }
  }
  if (r.flags.lovers && loverDays() >= 12 && !r.flags.fightDone && Math.random() < 0.18) d.fight = true;
  if (r.flags.lovers && loverDays() >= 6 && !r.flags.nursed && (S.weather === 'rain' || S.weather === 'snow') && Math.random() < 0.35) d.sick = true;
  if (r.stage === 6 && !r.flags.engaged && !r.flags.proposeLater && r.aff >= 900 && S.day - r.metDay >= 120 && S.day - r.proposeDay >= 5) d.proposal = true;
  // 축제 장식
  G.tempObjs = [];
  for (const ev of todayEvents()) if (ev.map === 'island' && !['typhoon', 'firstsnow'].includes(ev.id)) {
    for (const [dx, dy, kind] of [[-2, -2, 'stall'], [2, -2, 'stall'], [-3, 1, 'lantern'], [3, 1, 'lantern']]) {
      const x = Math.floor(P_(ev.at)[0] + dx), y = Math.floor(P_(ev.at)[1] + dy);
      if (walkable(x, y, MAPS.island)) G.tempObjs.push({ kind, x, y, solid: false });
    }
  }
}
function dayStartMessages() {
  const c = calendar(S.day);
  toast(`${SEASON_ICON[c.season]} ${c.month}월 ${c.dom}일 · ${({ sunny: '맑음', cloudy: '흐림', rain: '비', snow: '눈', storm: '태풍' })[S.weather]}`);
  const prev = calendar(S.day - 1);
  if (S.day > 1 && prev.season !== c.season) setTimeout(() => toast(`${SEASON_ICON[c.season]} ${SEASON_KO[c.season]}이 왔어요! 섬의 풍경과 사람들 옷차림이 바뀌었어요`), 900);
  for (const ev of todayEvents()) setTimeout(() => toast(`${ev.icon} ${ev.intro} (${fmtTime(ev.from)}~)`), 1800);
  if (S.rel.daily.sick) setTimeout(() => toast('🤒 형사님이 감기에 걸렸대요. 경찰 사택에 가 볼까요?'), 2600);
  if (S.rel.daily.proposal) setTimeout(() => toast('💌 형사님의 쪽지: "오늘 저녁 등대에서 기다릴게요."'), 2600);
  if (S.wedding === S.day && !S.rel.flags.married) setTimeout(() => toast('💒 오늘은 결혼식 날! 9시~18시 사이에 해수욕장으로 가요 (🚌 해수욕장 정류장)'), 2600);
}
async function endDay(forced) {
  G.busy++;
  if (forced) { await say('narr', '', S.comp ? '밤이 깊었다… 형사님이 집 앞까지 데려다주었다.' : '밤이 깊었다… 졸음이 쏟아진다.'); closeDialog(); }
  if (S.comp) endCompanion(true);
  if (G.player.carried) stopPiggy();
  await fade(true);
  const r = S.rel;
  if (r.flags.met) {
    if (!r.daily.met) { r.missDays++; if (r.missDays >= 3) { const floor = (STAGES[r.stage - 1].need && STAGES[r.stage - 1].need.aff) || 0; r.aff = Math.max(floor, r.aff - 2); } }
    else r.missDays = 0;
  }
  S.day++; S.min = 7 * 60; G.dayOver = false;
  S.weather = rollWeather();
  r.daily = newDaily(); S.spots = {};
  if (r.favor && S.day - r.favor.day > 2) r.favor = null;
  const P = G.player, home = 0;
  P.standUp(); P.stop(); P.pose = 'stand'; P.outfit = 'base';
  M = MAPS.in_home; P.map = 'in_home'; [P.x, P.y] = [3.5, 4.5];
  setFurniture(MAPS.in_home, homeFurnList());
  const d = G.det;
  d.state = 'sched'; d.task = null; d.pose = 'stand'; d.seat = null; d.outfit = 'casual';
  if (r.flags.married) { d.map = 'in_home'; d.x = 4.5; d.y = 4.5; d.visible = true; }
  else { d.map = 'island'; d.visible = false; d.x = 14.5; d.y = 14.5; }
  void home;
  planDay();
  G.camSnap = true; drawMinimapBase();
  save();
  await sleep(300); await fade(false);
  G.busy--;
  dayStartMessages();
  if (r.flags.married) runEvent(morningMarried);
}

/* ---------------- 건물 · 직업 · 활동 ---------------- */
function nearDoor(id, rr = 1.4) { const b = MAPS.island.buildings.find(x => x.id === id); return G.player.map === 'island' && Math.hypot(G.player.x - b.doorTile[0] - 0.5, G.player.y - b.doorTile[1] - 0.5) <= rr; }
function canWork() {
  const J = JOBS[S.job];
  if (S.job === 'traveler') { const pl = curPlace(); return pl && TRAVEL_SPOTS.includes(pl) && !S.spots[pl]; }
  return nearDoor(J.place) || G.player.map === 'in_' + J.place;
}
function openBuilding(b) {
  if (ENTERABLE.includes(b.id)) {
    if (b.id === 'sataek' && S.rel.stage < 6 && !(G.det.task === 'sick')) { runEvent(async () => { await say('narr', '', S.rel.flags.met ? '형사님이 사는 경찰 사택이다. 함부로 들어갈 순 없다. (깊어진 연인이 되면 초대받을 수 있어요)' : '경찰 사택이다. 문이 잠겨 있다.'); }); return; }
    const m = MAPS['in_' + b.id]; goMap(m.id, m.spawn.door[0], m.spawn.door[1]); return;
  }
  if (b.id === 'lighthouse') { runEvent(async () => { await say('narr', '', S.min >= 17 * 60 && S.min < 19.5 * 60 ? '노을이 바다를 주황빛으로 물들이고 있다.' : '하얀 등대. 저녁에 오면 노을이 예쁘다고 한다.'); }); }
}
function leaveInterior() {
  const id = M.owner, b = MAPS.island.buildings.find(x => x.id === id);
  if (G.decor) closeDecor();
  goMap('island', b.doorTile[0] + 0.5, b.doorTile[1] + 0.5);
}
function doWork() {
  const J = JOBS[S.job];
  const end = S.job === 'cafe' || S.job === 'traveler' ? 20 * 60 : 18.5 * 60;
  if (S.min < 7.5 * 60 || S.min >= end) { toast(`${J.act}은(는) ${fmtTime(end)} 전까지만 할 수 있어요`); return; }
  if (S.weather === 'storm' && S.job === 'haenyeo') { toast('태풍이라 오늘은 물질을 쉬어요'); return; }
  const P = G.player; P.stop(); if (P.seat) P.standUp();
  G.working = { t: 0, dur: 2.2, mins: 60 };
  setAction({ label: J.act + ' 중…', icon: J.icon }, true);
}
function workUpdate(dt) {
  const w = G.working; if (!w) return;
  const step = Math.min(dt, w.dur - w.t); w.t += step;
  advanceTime(w.mins * step / w.dur);
  if (Math.random() < dt * 6) burst(G.player, 'spark', 1);
  if (w.t >= w.dur) {
    G.working = null; setAction(null, true);
    const J = JOBS[S.job];
    const pay = Math.round(rand(J.pay[0], J.pay[1]) * (1 + (S.jobLv - 1) * 0.12) / 100) * 100;
    S.money += pay; S.works++; S.jobExp++; Sound.sfx('coin');
    floatText(G.player, '+' + fmtMoney(pay), '#ffe37a');
    toast(`${J.icon} ${pick(J.work)}`);
    if (S.job === 'traveler') S.spots[curPlace()] = true;
    if (J.loot && Math.random() < 0.45) { const it = pick(['abalone', 'conch', 'urchin', 'seaweed']); S.inv[it] = (S.inv[it] || 0) + 1; toast(`${ITEMS[it].icon} ${ITEMS[it].name}을(를) 얻었다`); }
    if (S.jobExp >= S.jobLv * 4) { S.jobExp = 0; S.jobLv++; toast(`⭐ 직업 레벨 업! ${J.name} Lv.${S.jobLv}`); burst(G.player, 'spark', 10); }
    updateHUD();
    const d = G.det;
    if (S.rel.flags.met && S.rel.stage >= 2 && !S.comp && d.visible && d.map === 'island' && !S.rel.daily.visit && Math.random() < 0.35 && detPlan(S.min).k !== 'goHome' && G.player.map === 'island') {
      S.rel.daily.visit = true;
      runEvent(async () => {
        scriptDet(); const n = findPath(d.x, d.y, G.player.x, G.player.y, { map: MAPS.island });
        if (n && n.length > 1 && n.length < 45) { n.pop(); d.path = n; d.speedMul = 1.6; await waitUntil(() => !d.path.length, 10); } else { [d.x, d.y] = nearestWalkable(G.player.x + 1, G.player.y, MAPS.island); }
        d.speedMul = 1; d.lookAt(G.player); G.player.lookAt(d);
        const L = { doctor: '순찰 왔다가 들렀어요. 선생님 일하는 거 보니까 든든하네요.', teacher: '수업하는 목소리 들려서요. 잘 가르치네요.', traveler: '기록하는 거 구경했어요. 저도 한 줄 들어가면 좋겠다.', cafe: '아메리카노 하나요. 그리고… 일하는 모습 보러 왔어요.', haenyeo: '물질 끝났어요? 부두에서 계속 지켜봤어요. 안전 확인차. …반은.' };
        await say('det', S.rel.stage >= 4 ? 'blush' : 'smile', L[S.job]);
        S.rel.daily.met = true; addAff(1);
      });
    }
    save();
  }
}
function lowTide() { const a = 9 + (S.day * 0.7) % 3; const h = S.min / 60; return (h >= a && h < a + 2.5) || (h >= a + 6 && h < a + 8.5); }
function tideText() { const a = 9 + (S.day * 0.7) % 3; return `${fmtTime(a * 60)}~${fmtTime((a + 2.5) * 60)}, ${fmtTime((a + 6) * 60)}~${fmtTime((a + 8.5) * 60)}`; }
function gatherShell() {
  const P = G.player, islet = P.map === 'islet';
  if (!islet && !lowTide()) { toast(`🌊 물이 차 있어요. 썰물 시간: ${tideText()}`); return; }
  if (S.rel.daily.shells >= (islet ? 10 : 6)) { toast('오늘은 충분히 주웠어요. 내일 또 와요'); return; }
  runEvent(async () => {
    P.dig = true; P.face = 'f'; await sleep(1300); P.dig = false;
    S.rel.daily.shells++;
    const it = Math.random() < 0.25 ? null : pick(SHELL_TABLE[islet ? 'islet' : 'beach']);
    if (!it) { await say('narr', '', '…모래만 한 줌. 다시 찾아보자.'); return; }
    S.inv[it] = (S.inv[it] || 0) + 1; burst(P, 'spark', 4); Sound.sfx('coin');
    await say('narr', '', `${ITEMS[it].icon} ${ITEMS[it].name}을(를) 주웠다!${ITEMS[it].furn ? ' (집 꾸미기 소품으로도 쓸 수 있어요)' : ''}`);
    if (ITEMS[it].furn) S.furnInv[ITEMS[it].furn] = (S.furnInv[ITEMS[it].furn] || 0) + 1;
    if (S.comp && dist(G.det, P) < 3 && Math.random() < 0.5) { await say('det', 'smile', pick(['오, 잘 찾는다. 저는 아까부터 조약돌만 나와요.', '그거 저 주면 안 돼요? 책상에 둘래요.', '물 들어오기 전에 조금만 더 찾아요.'])); }
  });
}
function orangeAction(o) {
  const se = season(), c = calendar(S.day);
  runEvent(async () => {
    if (se === 'winter' || c.month === 11) {
      if (S.rel.daily.oranges >= 5) { await say('narr', '', '오늘은 충분히 땄다. 할아버지 몫도 남겨 두자.'); return; }
      const n = 1 + (Math.random() < 0.4 ? 1 : 0); S.rel.daily.oranges += n; S.inv.tangerine = (S.inv.tangerine || 0) + n; burst(G.player, 'spark', 3);
      await say('narr', '', `🍊 귤을 ${n}개 땄다. 반짝반짝 주황빛.`);
      const k = await choose(['그 자리에서 까먹는다', '아껴 둔다']);
      if (k === 0) {
        S.inv.tangerine--;
        await say('narr', '', pick(['새콤달콤! 손끝이 노랗게 물들었다.', '한 알 입에 넣으니 겨울 햇살 맛이 난다.', '…앗, 귤즙이 튀었다. 그래도 맛있다.']));
        if (S.comp && dist(G.det, G.player) < 3) { await say('det', 'laugh', S.rel.stage >= 5 ? '아~ 해 봐요. …하나만 줘요, 저도.' : '하나만 줘요. 형사도 귤은 못 참아요.'); addAff(2); }
      }
    } else if (se === 'spring') await say('narr', '', '하얀 귤꽃이 피었다. 향기가 섬 전체에 퍼진다.');
    else if (se === 'summer') await say('narr', '', '초록 풋귤이 조롱조롱. 겨울이 되면 주황색으로 익는다.');
    else await say('narr', '', '귤이 노랗게 물들어 가고 있다. 조금만 더 기다리자.');
  });
}
async function interiorAction(act) {
  const P = G.player, d = G.det, withDet = S.comp && d.map === P.map && dist(d, P) < 4, r = S.rel;
  const work = JOBS[S.job].place && 'in_' + JOBS[S.job].place === M.id;
  switch (act) {
    case 'work': if (work) doWork(); else runEvent(async () => { await say('narr', '', M.id === 'in_school' ? '칠판에 "바다 생물 그리기"라고 적혀 있다.' : '진료 책상 위에 혈압계와 사탕 통이 있다.'); }); return;
    case 'order': if (S.job === 'cafe') { doWork(); return; } runEvent(async () => {
      if (S.money < 3000) { await say('narr', '', '돈이 부족하다.'); return; }
      S.money -= 3000; await say('narr', '', `☕ ${season() === 'winter' ? '따뜻한 귤 차' : '귤 라떼'}를 주문했다. 3,000원`);
      if (withDet) { await say('det', 'smile', '여기 귤 라떼 진짜 맛있죠. 한 입만요.'); if (!r.daily.cafe) { r.daily.cafe = true; addAff(2); } }
    }); return;
    case 'eat': runEvent(async () => {
      if (S.money < 9000) { await say('narr', '', '물회 한 그릇 9,000원. 돈이 부족하다.'); return; }
      S.money -= 9000; await say('narr', '', season() === 'summer' ? '🍲 시원한 한치 물회! 더위가 싹 가신다.' : season() === 'winter' ? '🍲 뜨끈한 방어회와 지리탕.' : '🍲 이모님 특제 물회. 새콤달콤하다.');
      if (withDet) { await say('det', 'laugh', '이모님이 우리 보고 웃으세요. 또 소문나겠다.'); if (!r.daily.eat) { r.daily.eat = true; addAff(2); } if (!r.flags.sashimiDate) { r.flags.sashimiDate = true; await addAlbum('횟집에서 저녁', 'eat'); } }
    }); return;
    case 'tank': case 'tankHome': runEvent(async () => { await say('narr', '', pick(['수조 속 물고기가 뻐끔뻐끔.', '참돔 한 마리가 위엄 있게 헤엄친다.', '작은 물고기들이 반짝이며 돈다.'])); }); return;
    case 'karaoke': runEvent(async () => {
      await say('narr', '', '🎤 마이크를 잡았다. 반주가 흘러나온다.'); Sound.sfx('bell'); burst(P, 'note', 6);
      const score = Math.round(rand(70, 100)); await say('narr', '', `점수: ${score}점! ${score >= 95 ? '🎉 완벽해!' : score >= 85 ? '박수 짝짝!' : '그래도 즐거웠다.'}`);
      if (withDet) { await say('det', 'laugh', pick(['다음은 제 차례. 18번 나갑니다.', '듀엣 해요. 마이크 하나 더!', '…노래 잘하네요. 반했어요. 원래 반했지만.'])); if (!r.daily.karaoke) { r.daily.karaoke = true; addAff(2); } if (!r.flags.karaoke) { r.flags.karaoke = true; await addAlbum('노래방 듀엣', 'karaoke'); } }
    }); return;
    case 'events': runEvent(async () => {
      const up = []; for (let k = 0; k < 40 && up.length < 4; k++) { const c = calendar(S.day + k); for (const e of EVENTS) if (e.m === c.month && e.d === c.dom) up.push(`${e.icon} ${c.month}월 ${c.dom}일 ${e.name}`); }
      await say('narr', '', '📋 마을회관 행사 게시판'); await say('narr', '', up.length ? up.join('\n') : '당분간 행사가 없다.');
    }); return;
    case 'piano': runEvent(async () => { for (let i = 0; i < 4; i++) { Sound.sfx('heart'); burst(P, 'note', 1); await sleep(220); } await say('narr', '', '띵띵띵~ 서툴지만 즐거운 소리.'); }); return;
    case 'snack': runEvent(async () => { await say('chief', 'smile', '잔치 국수 남았는데 한 그릇 해. 공짜여.'); await say('narr', '', '🍜 따끈한 국수를 먹었다.'); }); return;
    case 'desk': runEvent(async () => { await say('narr', '', '형사님 책상. 서류 더미 위에 캔커피가 세 개 쌓여 있다.'); if (r.stage >= 4) await say('narr', '', '…수첩 한쪽에 내 이름이 적혀 있는 것 같다.'); }); return;
    case 'board': runEvent(async () => { await say('narr', '', `📋 파출소 게시판 — 형사님 일과: 07시 출근 · 08시반 순찰 · 12시 카페 점심 · 15시 부두·갯바위 순찰 · 17시 퇴근 산책 · 19시반 부두 낚시 · 22시 귀가`); await say('narr', '', `지금: ${TASK_LABEL[G.det.task] || '순찰 중'}`); }); return;
    case 'lost': lostBox(); return;
    case 'shop': shopMenu(); return;
    case 'furnShop': furnShopMenu(); return;
    case 'gear': runEvent(async () => { await say('narr', '', '오리발, 수경, 테왁… 해녀 장비가 가지런히 걸려 있다.'); if (S.job === 'haenyeo') { await say('narr', '', '장비를 꼼꼼히 손질했다. 내일 물질이 조금 더 잘될 것 같다.'); S.jobExp++; } }); return;
    case 'prep': runEvent(async () => {
      if ((S.inv.abalone || 0) < 1) { await say('narr', '', '손질할 전복이 없다. (전복 1개 → 전복죽 1그릇)'); return; }
      S.inv.abalone--; S.inv.porridge = (S.inv.porridge || 0) + 1; await say('narr', '', '전복을 손질해 전복죽을 끓였다. 🥣 아플 때 주면 좋을 것 같다.');
    }); return;
    case 'sleep': if (S.min >= 18 * 60) homeSleep(); else runEvent(async () => { await say('narr', '', '아직 이른 시간이다. (저녁 6시부터 잘 수 있어요)'); const c = await choose(['한숨 자기 (1시간)', '그만두기']); if (c === 0) advanceTime(60); }); return;
    case 'cook': if (S.comp && r.stage >= 5) cookTogether(); else runEvent(async () => { if (S.money < 2000) { await say('narr', '', '재료비가 부족하다.'); return; } S.money -= 2000; S.inv.lunchbox = (S.inv.lunchbox || 0) + 1; await say('narr', '', '🍱 도시락을 만들었다. 누군가에게 주면 좋겠다.'); }); return;
    case 'tv': runEvent(async () => { await say('narr', '', pick(['📺 일기예보: 내일 해월도는 ' + ({ summer: '무더위', autumn: '선선한 바람', winter: '찬 바람', spring: '따뜻한 봄볕' })[season()] + '.', '📺 드라마에서 형사가 고백하는 장면이 나온다. …괜히 웃음이 난다.'])); }); return;
    case 'sofa': runEvent(async () => { await say('narr', '', '소파에 폭 기대었다. 몸이 노곤노곤하다.'); advanceTime(30); }); return;
    case 'clothes': clothesMenu(); return;
    case 'salon': salonMenu(); return;
    case 'detBed': if (G.det.task === 'sick') runEvent(sickEvent); else runEvent(async () => { await say('narr', '', '형사님 침대. 이불이 반듯하게 개어져 있다.'); }); return;
  }
}
function homeSleep() { endDay(false); }
function lostBox() {
  runEvent(async () => {
    const r = S.rel, L = r.daily.lost;
    if (L && L.found && !L.returned) { await say('narr', '', `${L.item}은(는) ${NPC_LOOKS[L.owner].name}께 직접 돌려드리자.`); return; }
    if (L && !L.found) { await say('narr', '', `📦 분실물 신고: ${NPC_LOOKS[L.owner].name}의 ${L.item}. ${L.hint} 근처에서 잃어버렸대요. (반짝이는 곳을 찾아보세요)`); return; }
    if (L && L.returned) { await say('narr', '', '오늘 분실물은 모두 주인을 찾았다.'); return; }
    const owners = ['halmeoni', 'kid', 'kid2', 'fisher', 'okja', 'grandpa'], items = ['머리끈', '돋보기', '낚시찌', '손수건', '열쇠고리', '털장갑'];
    const spots = [['해수욕장', [21.5, 35.5]], ['귤밭 입구', [15.5, 25.5]], ['부두', [39.5, 21.5]], ['숲길', [34.5, 25.5]], ['언덕 전망대', [10.5, 13.5]], ['등대', [33.5, 34.5]]];
    const [hint, at] = pick(spots), i = Math.floor(Math.random() * owners.length);
    const [x, y] = nearestWalkable(at[0] + rand(-2, 2), at[1] + rand(-2, 2), MAPS.island);
    r.daily.lost = { owner: owners[i], item: items[i], hint, x, y, found: false };
    await say('narr', '', `📦 분실물 상자에 쪽지가 있다: "${NPC_LOOKS[owners[i]].name}의 ${items[i]}을(를) ${hint} 근처에서 잃어버렸어요."`);
    toast('🔍 반짝이는 곳을 찾아 분실물을 주워요');
  });
}

/* ---------------- 상황별 행동 버튼 ---------------- */
function computeAction() {
  const P = G.player, d = G.det;
  if (G.working || G.fishing) return G.ctxAction;
  if (P.carried) return { label: '내리기', icon: '🧍', fn: () => { stopPiggy(); } };
  if (P.seat) return { label: '일어나기', icon: '🧍', fn: standUpPlayer };
  if (d.visible && d.map === P.map && dist(d, P) < 1.9) return { label: S.rel.flags.met ? detLabel().slice(0, 7) : '말 걸기', icon: '💬', fn: () => interactWith(d), hot: !S.rel.flags.met };
  if (canWork() && !M.interior) return { label: JOBS[S.job].act, icon: JOBS[S.job].icon, fn: doWork, hot: true };
  for (const a of G.actors) if (a !== P && a !== d && a.visible && a.map === P.map && dist(a, P) < 1.6) return { label: a.pet ? '쓰다듬기' : '말 걸기', icon: a.pet ? (a.pet.kind === 'cat' ? '🐱' : '🐶') : '💬', fn: () => interactWith(a) };
  if (M.interior) {
    if (Math.floor(P.x) === M.exit[0] && Math.floor(P.y) === M.exit[1]) return { label: '나가기', icon: '🚪', fn: leaveInterior };
    for (const o of M.objects) if (o.kind === 'furn' && o.act && Math.hypot(P.x - o.x - 0.5, P.y - o.y - 0.5) < 1.6) {
      const L = { clothes: '옷 고르기', salon: '머리 하기', work: JOBS[S.job].act, order: S.job === 'cafe' ? '카페 영업' : '주문하기', eat: '물회 먹기', tank: '수조 구경', karaoke: '노래하기', events: '행사 게시판', piano: '피아노', snack: '국수 먹기', desk: '책상 보기', board: '게시판', lost: '분실물 상자', shop: '장보기', furnShop: '가구 사기', gear: '장비 보기', prep: '해산물 손질', sleep: '잠자기', cook: '요리하기', tv: 'TV 보기', sofa: '쉬기', tankHome: '수족관', detBed: '살펴보기' }[o.act] || '살펴보기';
      const I = { clothes: '👗', salon: '💇', work: JOBS[S.job].icon, order: '☕', eat: '🍲', tank: '🐟', karaoke: '🎤', events: '📋', piano: '🎹', snack: '🍜', desk: '🗂', board: '📋', lost: '📦', shop: '🛒', furnShop: '🛋', gear: '🤿', prep: '🔪', sleep: '🛏', cook: '🍳', tv: '📺', sofa: '🛋', tankHome: '🐠', detBed: '🛏' }[o.act] || '👀';
      return { label: L, icon: I, fn: () => interiorAction(o.act), hot: o.act === 'work' };
    }
    return { label: '나가기', icon: '🚪', fn: leaveInterior };
  }
  const L = S.rel.daily.lost;
  if (L && !L.found && P.map === 'island' && Math.hypot(P.x - L.x, P.y - L.y) < 1.3) return { label: '줍기', icon: '✨', hot: true, fn: () => { L.found = true; G.tempObjs = G.tempObjs.filter(o => !o.lostItem); toast(`✨ ${L.item}을(를) 찾았다! ${NPC_LOOKS[L.owner].name}께 돌려드려요`); Sound.sfx('coin'); } };
  const fs = fishSpot(); if (fs) return { label: S.comp && S.rel.stage >= 3 && fs === 'pier' ? '같이 낚시' : '낚시하기', icon: '🎣', fn: () => (S.comp && S.rel.stage >= 3 && fs === 'pier' ? fishTogether() : soloFish(fs)) };
  if (M.boatSpot && Math.hypot(P.x - M.boatSpot[0], P.y - M.boatSpot[1]) < 1.4) return { label: P.map === 'island' ? '무인도 가기' : '해월도로', icon: '🚤', hot: true, fn: rideBoat };
  const stop = M.id === 'island' && M.objects.find(o => o.kind === 'busstop' && Math.hypot(P.x - o.x - 0.5, P.y - o.y - 0.5) < 1.8);
  if (stop) return { label: '마을버스', icon: '🚌', fn: () => busMenu(stop.stop) };
  for (const [k, bk] of Object.entries(M.benches)) for (const s of bk.stand) if (Math.hypot(P.x - s[0] - 0.5, P.y - s[1] - 0.5) < 0.9) return { label: S.comp && S.rel.stage >= 2 ? '함께 앉기' : '앉기', icon: '🪑', fn: () => benchAction(k) };
  const orange = M.objects.find(o => o.kind === 'orange' && Math.hypot(P.x - o.x - 0.5, P.y - o.y - 0.5) < 1.5);
  if (orange) return { label: season() === 'winter' || calendar(S.day).month === 11 ? '귤 따기' : '귤나무', icon: '🍊', fn: () => orangeAction(orange) };
  const pl = curPlace();
  if (pl === 'observatory' && S.min >= 19.5 * 60) return { label: '별 보기', icon: '⭐', fn: stargaze };
  if (tileAt(Math.floor(P.x), Math.floor(P.y)) === T.SAND && nextToWater(P.x, P.y)) return { label: '조개 줍기', icon: '🐚', fn: gatherShell };
  for (const b of M.buildings) if (Math.hypot(P.x - b.doorTile[0] - 0.5, P.y - b.doorTile[1] - 0.5) < 1.1) {
    const lab = ENTERABLE.includes(b.id) ? (b.id === 'home' ? '집에 들어가기' : '들어가기') : b.name;
    return { label: lab, icon: '🚪', fn: () => openBuilding(b) };
  }
  return null;
}
function stargaze() {
  runEvent(async () => {
    await say('narr', '', pick(['⭐ 쏟아질 듯한 별. 은하수가 섬 위로 흐른다.', '⭐ 별똥별 하나가 바다로 떨어졌다.', '⭐ 국자 모양 별자리를 찾았다.']));
    if (S.comp && dist(G.det, G.player) < 3) { await say('det', S.rel.stage >= 5 ? 'blush' : 'smile', S.rel.stage >= 5 ? '저 별 두 개, 우리 같다. 딱 붙어 있잖아요.' : '여기서 보는 별이 섬에서 제일이에요.'); if (!S.rel.daily.stars) { S.rel.daily.stars = true; addAff(2); } }
  });
}
function busMenu(from) {
  const items = Object.keys(BUS_NAMES).filter(k => k !== from).map(k => ({ icon: '🚌', label: BUS_NAMES[k], note: '1,000원 · 15분', onClick: () => rideBus(k) }));
  openSheet({ title: `🚌 마을버스 — ${BUS_NAMES[from]} 정류장`, sub: '<div class="relneed">섬 곳곳을 빠르게 이어 주는 마을버스예요. 함께 다니는 중이면 형사님도 같이 타요.</div>', items, cols: 2 });
}
async function rideBus(k) {
  if (S.money < 1000) { toast('차비가 부족해요'); return; }
  if (S.min >= 22 * 60) { toast('막차가 끊겼어요'); return; }
  S.money -= 1000; G.busy++;
  await fade(true);
  $('#boatScene').classList.remove('hidden'); $('#boatScene .boat').textContent = '🚌'; $('#boatScene p').textContent = `덜컹덜컹… ${BUS_NAMES[k]}(으)로 가는 중`;
  await sleep(1100);
  $('#boatScene').classList.add('hidden'); $('#boatScene .boat').textContent = '🚤'; $('#boatScene p').textContent = '통통통… 바다를 건너는 중';
  const P = G.player, [x, y] = MAPS.island.stops[k];
  if (P.seat) P.standUp(); P.stop(); P.x = x; P.y = y;
  if (S.comp) { const d = G.det; d.stop(); [d.x, d.y] = nearestWalkable(x + 1, y, MAPS.island); G.hist = []; G.compSettled = false; }
  advanceTime(15); G.camSnap = true; G.lastPlace = null;
  G.busy--; await fade(false); updateHUD();
  toast(`🚌 ${BUS_NAMES[k]} 도착`);
}
async function rideBoat() {
  const P = G.player;
  if (S.weather === 'storm') { toast('🌀 태풍이라 배가 뜨지 않아요'); return; }
  if (S.min >= 21 * 60 && P.map === 'island') { toast('밤에는 배가 다니지 않아요'); return; }
  G.busy++;
  await fade(true);
  $('#boatScene').classList.remove('hidden'); Sound.sfx('splash');
  await sleep(1400);
  $('#boatScene').classList.add('hidden');
  G.busy--;
  advanceTime(20);
  if (P.map === 'island') { await goMap('islet', MAPS.islet.spawn.dock[0], MAPS.islet.spawn.dock[1], { noFade: true }); toast('🏝️ 작은 무인도에 도착! 조개 줍기와 대물 낚시를 할 수 있어요'); }
  else await goMap('island', ...P_('boatSpot'), { noFade: true });
  await fade(false);
}
function setAction(a, lock) {
  if (lock) G.ctxLock = !!a;
  G.ctxAction = a;
  const btn = $('#actBtn');
  if (!a) { btn.classList.add('hidden'); return; }
  btn.classList.remove('hidden'); btn.classList.toggle('hot', !!a.hot);
  btn.innerHTML = `<span>${a.icon}</span><b>${a.label}</b>`;
}

/* ---------------- 가게 ---------------- */
function applyStyle(st) {
  S.style = st;
  const P = G.player; P.look = Object.assign(playerLookV2(S.job, S.hair, st), { cacheId: 'player-' + S.job + styleKey(st) });
  G._compFace = null; save();
}
function styleReaction() {
  runEvent(async () => {
    await say('me', 'smile', '(거울 앞에서 한 바퀴 돌아봤다. 마음에 든다!)');
    const d = G.det;
    if (S.rel.flags.met && d.visible && d.map === G.player.map && dist(d, G.player) < 5) {
      d.lookAt(G.player);
      const st = S.rel.stage;
      await say('det', st >= 4 ? 'blush' : 'surprise', st >= 8 ? '여보, 오늘 왜 이렇게 예뻐요? 나가지 마요. …농담이에요, 같이 나가요.' : st >= 5 ? '……와. 잠깐만요, 심장 좀 진정시키고요. 너무 잘 어울려요.' : st >= 3 ? '어, 새로 바꿨어요? 잘 어울려요. 진짜로.' : '오, 분위기 바뀌었네요. 잘 어울려요.');
      if (!S.rel.daily.style) { S.rel.daily.style = true; addAff(1); }
    }
  });
}
function clothesMenu() {
  const items = Object.entries(CLOTHES).map(([k, C]) => ({ icon: C.icon, label: C.name, note: k === 'job' ? '무료 · 원래 옷' : (S.style.clothes === k ? '입는 중 · ' : '') + fmtMoney(C.price), onClick: () => {
    if (k === 'job') { applyStyle(Object.assign({}, S.style, { clothes: 'job', cc: null })); toast('💼 직업복으로 갈아입었어요'); styleReaction(); return; }
    colorMenu('색을 골라요 — ' + C.name, CLOTH_COLORS, (col, name) => {
      if (S.money < C.price) { toast('돈이 부족해요'); return; }
      S.money -= C.price; Sound.sfx('coin'); applyStyle(Object.assign({}, S.style, { clothes: k, cc: col })); updateHUD();
      toast(`👗 ${name} ${C.name}(으)로 갈아입었어요`); styleReaction();
    });
  } }));
  openSheet({ title: '👗 해월 옷가게', sub: `<div class="relneed">보유 ${fmtMoney(S.money)} · 옷을 고르면 색을 정할 수 있어요</div>`, items, cols: 3 });
}
function colorMenu(title, colors, done) {
  const items = colors.map(([name, col]) => ({ icon: `<i class="swatch" style="background:${col}"></i>`, label: name, onClick: () => done(col, name) }));
  openSheet({ title, items, cols: 4 });
}
function salonMenu() {
  const items = Object.entries(HAIR_STYLES).map(([k, name]) => ({ icon: '💇', label: name, note: (S.style.hair === k ? '지금 머리 · ' : '') + fmtMoney(STYLE_PRICE.hair), onClick: () => {
    if (S.money < STYLE_PRICE.hair) { toast('돈이 부족해요'); return; }
    S.money -= STYLE_PRICE.hair; Sound.sfx('coin'); applyStyle(Object.assign({}, S.style, { hair: k })); updateHUD(); toast(`💇 ${name}(으)로 바꿨어요`); styleReaction();
  } }));
  items.push({ icon: '🎨', label: '머리 색 바꾸기', note: fmtMoney(STYLE_PRICE.color), wide: true, onClick: () => colorMenu('머리 색 고르기', HAIR_COLORS, (col, name) => {
    if (S.money < STYLE_PRICE.color) { toast('돈이 부족해요'); return; }
    S.money -= STYLE_PRICE.color; Sound.sfx('coin'); applyStyle(Object.assign({}, S.style, { hairC: col })); updateHUD(); toast(`🎨 ${name}(으)로 염색했어요`); styleReaction();
  }) });
  openSheet({ title: '💇 미용실 해바라기', sub: `<div class="relneed">보유 ${fmtMoney(S.money)} · 머리 모양 ${fmtMoney(STYLE_PRICE.hair)} · 염색 ${fmtMoney(STYLE_PRICE.color)}</div>`, items, cols: 3 });
}
function shopMenu() {
  const se = season();
  const items = SHOP.filter(k => !SHOP_SEASON[k] || SHOP_SEASON[k] === se).map(k => { const it = ITEMS[k]; return { icon: it.icon, label: it.name, note: fmtMoney(it.price), keep: true, onClick: () => { if (S.money < it.price) { toast('돈이 부족해요'); return; } S.money -= it.price; S.inv[k] = (S.inv[k] || 0) + 1; Sound.sfx('coin'); toast(`${it.icon} ${it.name} 구입 (보유 ${S.inv[k]})`); updateHUD(); save(); } }; });
  items.push({ icon: '💰', label: '팔기', note: '해산물 · 물고기', wide: true, onClick: sellMenu });
  items.push({ icon: '🛋', label: '가구 코너', wide: true, onClick: furnShopMenu });
  openSheet({ title: '마을 슈퍼', sub: `<div class="relneed">보유 ${fmtMoney(S.money)} · 계절 한정: ${se === 'summer' ? '수박' : se === 'winter' ? '핫팩' : '없음'}</div>`, items, cols: 3 });
}
function sellMenu() {
  const items = Object.entries(S.inv).filter(([k, n]) => n > 0 && ITEMS[k] && ITEMS[k].sell > 0 && !SHOP.includes(k)).map(([k, n]) => ({ icon: ITEMS[k].icon, label: ITEMS[k].name, note: `${fmtMoney(ITEMS[k].sell)} · ${n}개`, keep: true, onClick: () => { if (!(S.inv[k] > 0)) return; S.inv[k]--; S.money += ITEMS[k].sell; Sound.sfx('coin'); toast(`${ITEMS[k].name}을(를) 팔았다 +${fmtMoney(ITEMS[k].sell)}`); updateHUD(); save(); } }));
  openSheet({ title: '팔기', sub: `<div class="relneed">보유 ${fmtMoney(S.money)}</div>`, items: items.length ? items : [{ icon: '🫙', label: '팔 물건이 없어요', disabled: true, wide: true }], cols: 3 });
}
function furnShopMenu() {
  const items = FURN_SHOP.map(k => ({ icon: '🛋', label: FURN[k].name, note: fmtMoney(FURN[k].price) + (S.furnInv[k] ? ` · 보관 ${S.furnInv[k]}` : ''), keep: true, onClick: () => { if (S.money < FURN[k].price) { toast('돈이 부족해요'); return; } S.money -= FURN[k].price; S.furnInv[k] = (S.furnInv[k] || 0) + 1; Sound.sfx('coin'); toast(`🛋 ${FURN[k].name} 구입 — 집에서 「꾸미기」로 놓을 수 있어요`); updateHUD(); save(); } }));
  openSheet({ title: '가구 코너', sub: `<div class="relneed">보유 ${fmtMoney(S.money)} · 산 가구는 내 집 「꾸미기」에서 배치해요</div>`, items, cols: 3 });
}

/* ---------------- 집 꾸미기 ---------------- */
function openDecor() {
  if (M.id !== 'in_home' || G.busy) return;
  G.decor = { sel: null, placing: null, moving: false };
  $('#decorBar').classList.remove('hidden'); $('#decorBtn').classList.add('hidden');
  updateDecorBar();
}
function closeDecor() {
  G.decor = null; $('#decorBar').classList.add('hidden'); updateDecorUI();
  setFurniture(MAPS.in_home, homeFurnList()); save();
}
function updateDecorBar() {
  const d = G.decor; if (!d) return;
  const sel = d.sel != null && S.home[d.sel];
  $('#decorInfo').textContent = d.placing ? `「${FURN[d.placing].name}」 놓을 곳을 누르세요` : d.moving ? '옮길 곳을 누르세요' : sel ? `선택: ${FURN[sel[0]].name}` : '가구를 누르면 선택돼요';
  $('#dMove').disabled = !sel; $('#dRotate').disabled = !sel; $('#dStore').disabled = !sel;
}
function decorTap(x, y) {
  const d = G.decor, m = MAPS.in_home;
  if (!inMap(x, y, m)) return;
  const at = S.home.findIndex(f => f[1] === x && f[2] === y);
  const free = at < 0 && !(x === m.exit[0] && y === m.exit[1]) && !(Math.floor(G.player.x) === x && Math.floor(G.player.y) === y);
  if (d.placing) {
    if (!free) { toast('여기엔 놓을 수 없어요'); return; }
    S.home.push([d.placing, x, y, 0]); S.furnInv[d.placing]--; if (S.furnInv[d.placing] <= 0) delete S.furnInv[d.placing];
    d.placing = null; d.sel = S.home.length - 1; Sound.sfx('tap');
  } else if (d.moving && d.sel != null) {
    if (!free) { toast('여기엔 놓을 수 없어요'); return; }
    S.home[d.sel][1] = x; S.home[d.sel][2] = y; d.moving = false; Sound.sfx('tap');
  } else d.sel = at >= 0 ? at : null;
  d.hover = [x, y];
  setFurniture(m, homeFurnList()); updateDecorBar(); save();
}
function decorStorage() {
  const items = Object.entries(S.furnInv).filter(([, n]) => n > 0).map(([k, n]) => ({ icon: '🛋', label: FURN[k].name, note: `${n}개`, onClick: () => { G.decor.placing = k; G.decor.sel = null; updateDecorBar(); } }));
  openSheet({ title: '가구 보관함', sub: '<div class="relneed">고른 뒤 방바닥을 눌러 놓아요. 가구는 슈퍼 가구 코너에서 살 수 있어요.</div>', items: items.length ? items : [{ icon: '📦', label: '보관함이 비어 있어요', disabled: true, wide: true }], cols: 3 });
}
function updateDecorUI() { $('#decorBtn').classList.toggle('hidden', !(G.started && M.id === 'in_home' && !G.decor)); }

/* ---------------- HUD ---------------- */
function updateHUD() {
  if (!S) return;
  const c = calendar(S.day);
  $('#hDay').textContent = `${SEASON_ICON[c.season]} ${c.month}/${c.dom}`;
  $('#hTime').textContent = fmtTime(S.min);
  const night = S.min >= 19.6 * 60 || S.min < 6 * 60;
  $('#hWeather').textContent = ({ sunny: night ? '🌙' : '☀️', cloudy: '☁️', rain: '🌧️', snow: '🌨️', storm: '🌀' })[S.weather];
  $('#hMoney').textContent = fmtMoney(S.money);
  $('#hSpeed').textContent = '⏩' + S.speed + 'x';
  const r = S.rel, next = STAGES[r.stage];
  $('#relStage').textContent = stageName();
  $('#relBar').style.width = (next && next.need && next.need.aff ? Math.min(100, r.aff / next.need.aff * 100) : 100) + '%';
  $('#compIcon').classList.toggle('hidden', !S.comp);
  $('#compName').textContent = detLabel();
  $('#compState').textContent = G.player && G.player.carried ? '업혀 가는 중' : S.hold ? '손잡고 걷는 중' : S.arm ? '팔짱 끼고 걷는 중' : '동행 중';
  if (S.comp && G._compFace !== G.det.outfit + r.stage + season()) {
    G._compFace = G.det.outfit + r.stage + season(); const cf = $('#compFace').getContext('2d'); cf.clearRect(0, 0, 32, 32);
    cf.drawImage(drawPortrait(LOOKS.det, wearOf(G.det), r.stage >= 4 ? 'blush' : 'smile'), 0, 0);
  }
  const pl = curPlace(); $('#hPlace').textContent = placeName(pl) || M.name;
  updateDecorUI();
}
function compMenu() {
  if (!S.comp || G.busy) return;
  const st = S.rel.stage;
  const L = (s) => st < s ? { locked: true, note: `${s}단계 ${STAGES[s - 1].name}`, why: `「${STAGES[s - 1].name}」 단계에서 열려요` } : {};
  openSheet({ title: '동행 중 · ' + detLabel(), sub: relSummaryHTML(), cols: 2, items: [
    { icon: '💬', label: '대화하기', onClick: () => doInteraction('talk') },
    { icon: '🌿', label: '함께 활동하기', onClick: activityMenu },
    Object.assign({ icon: '💗', label: '데이트하기', onClick: dateMenu }, L(5)),
    Object.assign({ icon: '📷', label: '사진 찍기', onClick: () => doInteraction('photo') }, L(3)),
    { icon: '💞', label: '스킨십', onClick: affectionMenu },
    { icon: '👋', label: '동행 종료', onClick: () => doInteraction('follow') },
  ] });
}
function affectionMenu() {
  const st = S.rel.stage, P = G.player, d = G.det, sitting = P.seat && d.seat && P.seat.bench === d.seat.bench;
  const L = (s) => st < s ? { locked: true, note: `${s}단계`, why: `「${STAGES[s - 1].name}」 단계에서 열려요` } : {};
  const SIT = (o) => sitting ? o : Object.assign(o, { disabled: true, note: '나란히 앉아서', why: '벤치에 함께 앉았을 때 할 수 있어요' });
  openSheet({ title: '스킨십', cols: 3, items: [
    Object.assign({ icon: '💞', label: S.arm ? '팔짱 풀기' : '팔짱 끼기', onClick: () => doInteraction('arm') }, L(4)),
    Object.assign({ icon: '🤝', label: S.hold ? '손 놓기' : '손잡기', onClick: () => doInteraction('hand') }, L(5)),
    Object.assign({ icon: '😚', label: '볼 뽀뽀', onClick: () => doInteraction('cheek') }, L(5)),
    Object.assign({ icon: '🫂', label: '안아주기', onClick: () => doInteraction('hug') }, L(5)),
    Object.assign({ icon: '✋', label: '머리 쓰다듬기', onClick: () => doInteraction('pat') }, L(5)),
    Object.assign(SIT({ icon: '😌', label: '어깨 기대기', onClick: () => doInteraction('lean') }), L(5)),
    Object.assign({ icon: '💋', label: '뽀뽀하기', onClick: () => doInteraction('kiss') }, L(6)),
    Object.assign({ icon: '🎒', label: P.carried ? '내려 줘요' : '업어 달라기', onClick: () => doInteraction('piggy') }, L(6)),
    Object.assign(SIT({ icon: '💤', label: '무릎베개', onClick: () => doInteraction('lap') }), L(6)),
    Object.assign({ icon: '💑', label: '백허그', onClick: () => doInteraction('backhug') }, L(7)),
  ] });
}
function activityMenu() {
  const st = S.rel.stage;
  const L = (s) => st < s ? { locked: true, note: `${s}단계`, why: `「${STAGES[s - 1].name}」 단계에서 열려요` } : {};
  const go = (k, msg) => () => { if (G.player.map !== 'island') { toast('밖으로 나가서 가요'); return; } const [x, y] = P_(k); walkPlayer(x, y); if (msg) toast(msg + (Math.hypot(G.player.x - x, G.player.y - y) > 40 ? ' (멀면 🚌 마을버스가 빨라요)' : '')); };
  openSheet({ title: '함께 활동하기', cols: 3, items: [
    Object.assign({ icon: '🪑', label: '함께 앉기', note: '가까운 벤치', onClick: () => sitTogether() }, L(2)),
    Object.assign({ icon: '🎣', label: '같이 낚시', note: '부두 끝', onClick: () => fishTogether() }, L(3)),
    Object.assign({ icon: '🍳', label: '같이 요리', note: '집 주방', disabled: M.id !== 'in_home', why: '집 안에서 할 수 있어요', onClick: () => cookTogether() }, L(5)),
    { icon: '🐚', label: '해변 산책', onClick: go('beach', '🐚 해수욕장으로 걸어가요') },
    { icon: '🗼', label: '등대 구경', onClick: go('lighthouse', '🗼 등대로 걸어가요') },
    { icon: '☕', label: '카페 가기', onClick: go('cafeDoor', '☕ 카페 쉼터로 걸어가요') },
    { icon: '⚓', label: '포구 가기', onClick: go('harbor', '⚓ 동쪽 포구로 걸어가요') },
    { icon: '🌲', label: '동백숲', onClick: go('pavilion', '🌲 동백숲 정자로 걸어가요') },
    { icon: '🐴', label: '목장', onClick: go('ranchIn', '🐴 조랑말 목장으로 걸어가요') },
    { icon: '🌬️', label: '풍차 언덕', onClick: go('windmill', '🌬️ 풍차 언덕으로 걸어가요') },
    { icon: '⭐', label: '오름 전망대', onClick: go('observatory', '⭐ 오름 전망대로 걸어가요') },
    { icon: '🪨', label: '갯바위', onClick: go('rocks', '🪨 갯바위 낚시터로 걸어가요') },
    { icon: '🍊', label: '귤 농장', onClick: go('farm', '🍊 귤 농장 마을로 걸어가요') },
    { icon: '🚤', label: '무인도', onClick: go('boatSpot', '🚤 포구에서 배를 타요') },
  ] });
}

/* ---------------- 관계 화면 ---------------- */
function openRel(tab = 'profile') {
  G.screen = true; $('#rel').classList.remove('hidden');
  const r = S.rel;
  const face = $('#relFace').getContext('2d'); face.clearRect(0, 0, 32, 32);
  face.drawImage(drawPortrait(LOOKS.det, wearOf(G.det), r.stage >= 4 ? 'blush' : r.stage >= 2 ? 'smile' : 'normal'), 0, 0);
  $('#relName').textContent = S.detName ? `${S.detName} 형사님` : '파출소 형사님';
  $('#relTitle').textContent = `${r.stage}단계 · ${stageName()} · 부르는 이름: ${himCall()}`;
  const next = STAGES[r.stage];
  let reqHTML = '';
  if (next && next.need) {
    const nd = next.need, rows = [];
    if (nd.aff) rows.push([`호감도 ${r.aff} / ${nd.aff}`, r.aff >= nd.aff]);
    if (nd.days) rows.push([`알고 지낸 날 ${daysKnown()} / ${nd.days}일`, daysKnown() >= nd.days]);
    if (nd.together) rows.push([`함께 보낸 시간 ${Math.floor(r.together)} / ${nd.together}분`, r.together >= nd.together]);
    if (nd.loverDays) rows.push([`사귄 지 ${loverDays()} / ${nd.loverDays}일`, loverDays() >= nd.loverDays]);
    for (const f of nd.flags || []) {
      let extra = '';
      if (f === 'lovers') extra = r.flags.declined ? ' — 「마음 전하기」로 다시' : ' — 호감도 400 · 만난 지 15일 · 저녁 바닷가 동행';
      if (f === 'engaged') extra = ` — 만난 지 ${daysKnown()}/120일 · 호감도 ${r.aff}/900`;
      if (f === 'married') extra = S.wedding ? ` — ${dateLabel(S.wedding)} 예정` : ' — 날짜를 정해요';
      rows.push([FLAG_LABELS[f] + extra, !!r.flags[f]]);
    }
    reqHTML = `<h4>다음 단계: ${next.name}</h4><ul class="req">${rows.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${t}</li>`).join('')}</ul>`;
  } else reqHTML = `<h4>해월도의 부부</h4><p class="muted">${dateLabel(r.marriedDay || S.day)}에 결혼했어요. 매일 아침 인사와 퇴근 마중이 기다려요.</p>`;
  const plan = detPlan(S.min);
  $('#tab-profile').innerHTML = `
    <div class="stages">${STAGES.map(s => `<div class="stg ${s.n <= r.stage ? 'on' : ''} ${s.n === r.stage ? 'cur' : ''}"><b>${s.n}</b><span>${s.name}</span></div>`).join('')}</div>
    <div class="bar big"><i style="width:${next && next.need && next.need.aff ? Math.min(100, r.aff / next.need.aff * 100) : 100}%"></i></div>
    ${reqHTML}
    <div class="stats">
      <div><b>${r.aff}</b><span>호감도</span></div>
      <div><b>${Math.floor(r.together / 60)}시간</b><span>함께 보낸 시간</span></div>
      <div><b>${r.gifts}</b><span>받은 선물</span></div>
      <div><b>${r.dates}</b><span>데이트</span></div>
    </div>
    <p class="muted small">오늘 쌓은 호감도 ${r.daily.affGain}/${DAILY_AFF_CAP} · 특별 이벤트는 따로 쌓여요 · 사흘 넘게 못 만나면 조금씩 줄어요</p>
    <h4>프로필</h4>
    <dl class="prof">
      <dt>이름</dt><dd>${S.detName || '(아직 몰라요)'}${S.names.detNick ? ` · 애칭 「${S.names.detNick}」` : ''}</dd>
      <dt>나를 부르는 말</dt><dd>${meCall()}</dd>
      <dt>소속</dt><dd>해월도 파출소 형사</dd>
      <dt>성격</dt><dd>여유롭고 능글맞지만 다정함. 웃으면 눈매가 부드럽게 휜다</dd>
      <dt>좋아하는 것</dt><dd>따뜻한 캔커피 · 부두 낚시 · 노을 · ${r.stage >= 4 ? '<b>당신</b>' : '???'}</dd>
      <dt>지금</dt><dd>${S.comp ? '당신과 함께 있는 중' : TASK_LABEL[plan.k]}</dd>
    </dl>`;
  $('#tab-acts').innerHTML = `<p class="muted">관계 단계가 오르면 할 수 있는 행동이 늘어나요.</p><div class="acts">${INTERACTIONS.map(it => `<div class="act ${r.stage >= it.stage ? '' : 'lock'}"><span>${r.stage >= it.stage ? it.icon : '🔒'}</span><b>${it.label}</b><small>${it.stage}단계 ${STAGES[it.stage - 1].name}</small></div>`).join('')}</div>
    <h4>데이트 장소 ${Object.keys(DATES).length}곳</h4><p class="muted">${Object.values(DATES).map(D => D.icon + ' ' + D.name).join(' · ')}</p>`;
  $('#tab-album').innerHTML = S.album.length ? `<div class="album">${S.album.map((a, i) => `<figure data-i="${i}">${a.img ? `<img src="${a.img}" alt="">` : '<div class="noimg">📔</div>'}<figcaption><b>${a.title}</b><small>${a.date || a.day + '일째'} ${a.time} · ${a.place}</small></figcaption></figure>`).join('')}</div>` : '<p class="muted center">아직 추억이 없어요. 형사님과 함께 시간을 보내 보세요.</p>';
  $('#tab-album').querySelectorAll('figure').forEach(f => f.onclick = () => { const a = S.album[+f.dataset.i]; if (!a.img) return; $('#zoomImg').src = a.img; $('#zoomCap').textContent = `${a.title} — ${a.date || ''} ${a.time}, ${a.place}`; $('#zoom').classList.remove('hidden'); });
  setTab(tab);
}
function setTab(tab) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + tab));
}
function closeRel() { $('#rel').classList.add('hidden'); G.screen = false; }
function showStageUp() {
  G.stageUpPending = false;
  const st = STAGES[S.rel.stage - 1];
  $('#suName').textContent = `${st.n}단계 · ${st.name}`;
  $('#suUnlock').textContent = st.unlock;
  $('#stageUp').classList.remove('hidden'); G.screen = true;
  burst(G.det, 'heart', 10); Sound.sfx('bell');
}
function mainMenu() {
  openSheet({ title: '메뉴', cols: 2, sub: `<div class="relneed">${S.name} · ${JOBS[S.job].name} Lv.${S.jobLv} · 경험 ${S.jobExp}/${S.jobLv * 4}<br>${calendar(S.day).year}년째 · 자동 저장 ${S.savedAt ? new Date(S.savedAt).toLocaleTimeString('ko-KR') : ''}</div>`, items: [
    { icon: '🎒', label: '소지품', onClick: invMenu },
    { icon: '🐟', label: '물고기 도감', onClick: dexMenu },
    { icon: '💗', label: '형사님 관계', onClick: () => openRel('profile') },
    { icon: '✏️', label: '형사님 이름 바꾸기', onClick: renameDet },
    { icon: S.settings.music ? '🎵' : '🔇', label: S.settings.music ? '배경음악 끄기' : '배경음악 켜기', onClick: () => { S.settings.music = !S.settings.music; Sound.init(); Sound.setOn('music', S.settings.music); save(); } },
    { icon: S.settings.sfx ? '🔊' : '🔈', label: S.settings.sfx ? '효과음 · 파도 끄기' : '효과음 · 파도 켜기', onClick: () => { S.settings.sfx = !S.settings.sfx; Sound.init(); Sound.setOn('sfx', S.settings.sfx); save(); } },
    { icon: '❓', label: '도움말', onClick: () => { G.screen = true; $('#help').classList.remove('hidden'); } },
    { icon: '💾', label: '지금 저장', onClick: () => { toast(save() ? '저장했어요' : '저장 공간이 부족해요'); } },
    { icon: '🔄', label: '처음부터', wide: true, onClick: () => openSheet({ title: '처음부터 다시 할까요?', sub: '<div class="relneed">저장된 관계 · 추억 앨범 · 소지품이 모두 지워져요. 되돌릴 수 없어요.</div>', cols: 2, items: [
      { icon: '🗑', label: '지우고 처음부터', onClick: () => { G.started = false; try { localStorage.removeItem(SAVE_KEY); } catch (e) { } location.reload(); } },
      { icon: '↩', label: '계속 플레이', onClick: () => { } },
    ] }) },
  ] });
}
function renameDet() {
  runEvent(async () => {
    await say('narr', '', `형사님 이름을 정해요. 지금: ${S.detName || '(비어 있음 — "형사님")'}`);
    const n = await askText('예: 도윤 (비우면 "형사님")', S.detName, 6);
    S.detName = n; G._compFace = null;
    await say('narr', '', n ? `이제 형사님 이름은 「${n}」이에요.` : '이름을 비웠어요. 다시 "형사님"이라고 불러요.');
  });
}
function invMenu() {
  const items = Object.entries(S.inv).filter(([k, n]) => n > 0 && ITEMS[k]).map(([k, n]) => ({ icon: ITEMS[k].icon, label: ITEMS[k].name, note: `${n}개${k === 'tangerine' ? ' · 누르면 먹기' : ''}`, keep: k === 'tangerine', onClick: k === 'tangerine' ? () => { S.inv.tangerine--; toast('🍊 귤을 까먹었다. 새콤달콤!'); closeSheet(); invMenu(); } : null }));
  const furn = Object.entries(S.furnInv).filter(([, n]) => n > 0).map(([k, n]) => `${FURN[k].name} ×${n}`).join(', ');
  openSheet({ title: '소지품', sub: `<div class="relneed">${S.rel.favor ? `📝 부탁: ${ITEMS[FAVORS[S.rel.favor.i].item].name} 전해 주기<br>` : ''}${furn ? '🛋 보관 가구: ' + furn : ''}</div>`, items: items.length ? items : [{ icon: '🎒', label: '비어 있어요', disabled: true, wide: true }], cols: 3 });
}
function dexMenu() {
  const items = Object.entries(FISH).map(([k, f]) => ({ icon: S.dex[k] ? ITEMS['f_' + k].icon : '❔', label: S.dex[k] ? f.name : '???', note: S.dex[k] ? `최고 ${S.dex[k]}cm` : Object.entries(FISH_SPOTS).filter(([, sp]) => Object.values(sp.table).flat().includes(k)).map(([, sp]) => sp.name).join('·'), disabled: !S.dex[k] }));
  openSheet({ title: `물고기 도감 ${Object.keys(S.dex).length}/${Object.keys(FISH).length}`, sub: '<div class="relneed">부두 · 갯바위 · 무인도마다, 계절마다 잡히는 물고기가 달라요.</div>', items, cols: 3 });
}

/* ---------------- 메인 루프 ---------------- */
let _last = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - _last) / 1000 || 0.016); _last = ts;
  G.t += dt;
  G.waterT += dt; if (G.waterT > 0.6) { G.waterT = 0; G.waterFrame = (G.waterFrame + 1) % 3; }
  if (G.started) {
    if (!paused()) {
      const mult = G.busy ? 1 : S.speed;
      if (!G.working) advanceTime(dt * MIN_PER_SEC * mult);
      workUpdate(dt);
      const P = G.player, ox = P.x, oy = P.y;
      if (P.carried) { const d = G.det; P.map = d.map; P.x = d.x; P.y = d.y + 0.01; P.face = d.face; P.left = d.left; P.moving = false; }
      else if (!G.busy && !G.working && !G.fishing && !G.decor && !keyMove(dt)) P.update(dt); else if (G.busy) P.update(dt);
      const moved = Math.hypot(P.x - ox, P.y - oy);
      if (moved > 0) {
        const h0 = G.hist[0]; if (!h0 || Math.hypot(h0[0] - P.x, h0[1] - P.y) > 0.2) { G.hist.unshift([P.x, P.y]); if (G.hist.length > 60) G.hist.pop(); }
        if (S.comp && dist(P, G.det) < 3) { G.walkedTogether += moved; if (S.weather === 'rain' || S.weather === 'snow') G.rainWalk += moved; }
      }
      detUpdate(dt); G.det.update(dt);
      for (const v of G.villagers) { villagerUpdate(v, dt); v.update(dt); }
      for (const a of Object.values(G.rivals)) { rivalUpdate(a, dt); a.update(dt); }
      for (const a of G.pets) { petUpdate(a, dt); a.update(dt); }
      for (const a of G.staff) { staffUpdate(a); a.update(dt); }
      if (S.rel.daily.rival && !S.rel.daily.rival.done && S.min >= S.rel.daily.rival.end) endRivalWalk();
      pendingUpdate(dt);
      for (let i = G.waiters.length - 1; i >= 0; i--) { const w = G.waiters[i]; w.t -= dt; if (w.cond() || w.t <= 0) { G.waiters.splice(i, 1); w.res(); } }
      checkEvents();
      if (G.dayOver && !G.busy) endDay(true);
      else if (G.stageUpPending && !G.busy) showStageUp();
      const pl = curPlace(); if (pl !== G.lastPlace) { G.lastPlace = pl; if (pl) { const el = $('#placeTag'); el.textContent = '📍 ' + placeName(pl); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); } }
      G.saveT += dt; if (G.saveT > 15) { G.saveT = 0; save(); }
      // 축제 효과 · 분실물 반짝이
      const ev = activeEvent();
      if (ev && ev.fx && M.id === ev.map && Math.hypot(P.x - P_(ev.at)[0], P.y - P_(ev.at)[1]) < 14) {
        const rate = { fireworks: 0.9, confetti: 3, petals: 4, meteors: 0.8, snowlights: 3, fireflies: 0 }[ev.fx];
        if (Math.random() < dt * rate) spawnFx(ev.fx);
        if (ev.fx === 'fireflies' && G.fx.filter(f => f.kind === 'firefly').length < 30) G.fx.push({ kind: 'firefly', wx: P_(ev.at)[0] + rand(-4, 4), wy: P_(ev.at)[1] + rand(-4, 4), ph: Math.random() * 6, t: 20 });
      }
      if (S.weather === 'snow' && season() === 'winter' && Math.random() < dt * 0.5 && todayEvents().some(e => e.id === 'christmas') && S.min > 18 * 60) spawnFx('snowlights');
      const L = S.rel.daily.lost; if (L && !L.found && P.map === 'island' && Math.random() < dt * 3) G.parts.push({ kind: 'spark', x: L.x, y: L.y, map: 'island', ox: rand(-5, 5), h: rand(4, 14), vh: 8, t: 0.8 });
      // 소리
      if (Math.floor(G.t * 2) !== Math.floor((G.t - dt) * 2)) {
        let coast = 0; if (!M.interior) { for (let r = 1; r <= 5 && !coast; r++) for (const [a, b] of [[r, 0], [-r, 0], [0, r], [0, -r]]) if (tileAt(Math.floor(P.x) + a, Math.floor(P.y) + b) === T.WATER) { coast = 1 - (r - 1) / 5; break; } }
        Sound.update(daylight(S.min).mood, season(), M.interior ? 0 : coast);
        drawMinimap();
      }
    }
    G.ctxT -= dt;
    if (G.ctxT <= 0 && !G.ctxLock) { G.ctxT = 0.2; const a = (!paused() && !G.busy && !G.decor) ? computeAction() : null; const cur = G.ctxAction; if (!a !== !cur || (a && cur && (a.label !== cur.label))) setAction(a); else if (a) G.ctxAction.fn = a.fn; }
    if (Math.floor(G.t * 4) !== Math.floor((G.t - dt) * 4)) updateHUD();
  }
  for (let i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t -= dt; if (G.floats[i].t <= 0) G.floats.splice(i, 1); }
  for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.t -= dt; p.h += p.vh * dt; p.ox += Math.sin(G.t * 5 + i) * dt * 6; if (p.t <= 0) G.parts.splice(i, 1); }
  if (G.tapMark) G.tapMark.t -= dt * 1.5;
  render(dt);
  requestAnimationFrame(loop);
}

/* ---------------- 시작 ---------------- */
function mkActor(id, lookDef, outfit, map, cacheId) { const a = new Actor(id, Object.assign({}, lookDef, { cacheId: cacheId || id }), outfit, map); return a; }
function spawnActors() {
  S.style = S.style || defaultStyle(S.job, S.hair);
  const P = G.player = mkActor('player', playerLookV2(S.job, S.hair, S.style), 'base', S.map || 'island', 'player-' + S.job + styleKey(S.style));
  P.speed = 2.9; P.x = S.p.x; P.y = S.p.y;
  if (!MAPS[P.map]) P.map = 'island';
  M = MAPS[P.map];
  if (!walkable(Math.floor(P.x), Math.floor(P.y), M)) { [P.x, P.y] = nearestWalkable(P.x, P.y, M); }
  const d = G.det = mkActor('det', LOOKS.det, 'work', S.d.map || 'island', 'det');
  d.speed = 2.15; d.state = 'sched'; d.x = S.d.x; d.y = S.d.y; d.visible = S.d.vis !== false;
  if (!MAPS[d.map] || !walkable(Math.floor(d.x), Math.floor(d.y), MAPS[d.map])) { d.map = 'island'; [d.x, d.y] = P_('station'); }
  G.villagers = Object.entries(VILLAGERS).map(([k, V]) => { const a = mkActor(k, NPC_LOOKS[k], 'base', 'island'); a.vid = k; a.isVillager = true; a.speed = V.speed || 1; [a.x, a.y] = nearestWalkable(...P_(V.spots[0]), MAPS.island); return a; });
  G.staff = [];
  for (const [mapId, list] of Object.entries(STAFF)) for (const [nid, x, y, hours] of list) { const a = mkActor(nid, NPC_LOOKS[nid], 'base', mapId, nid + '-staff'); a.x = x; a.y = y; a.isStaff = true; a.hours = hours; G.staff.push(a); }
  G.rivals = {};
  for (const [job, rv] of Object.entries(RIVALS)) {
    if (job === S.job) continue;
    const a = mkActor(rv.id, Object.assign({ name: rv.name }, rv.look), 'base', rv.home || 'island'); a.isRival = true; a.rv = rv; a.job = job; a.speed = { doctor: 1.1, teacher: 1.0, traveler: 1.25, cafe: 0.95, haenyeo: 1.2 }[job];
    if (rv.home) [a.x, a.y] = rv.at; else [a.x, a.y] = P_('beach');
    G.rivals[job] = a;
  }
  G.pets = Object.entries(PETS).map(([k, V]) => { const a = new Actor(k, { name: ANIMAL_LOOKS[k].name, outfits: {} }, 'base', 'island'); a.vid = k; a.pet = ANIMAL_LOOKS[k]; a.speed = V.speed || 1; a.follow = 0; [a.x, a.y] = nearestWalkable(...P_(V.spots[0]), MAPS.island); return a; });
  G.actors = [P, d, ...G.villagers, ...G.staff, ...Object.values(G.rivals), ...G.pets];
  if (S.comp) { startCompanion(); [d.x, d.y] = nearestWalkable(P.x + 1, P.y, M); d.map = P.map; }
  G.camSnap = true;
}
function defaultStyle(job, hairKey) { const h = PLAYER_HAIRS[hairKey] || PLAYER_HAIRS.ponytail; return { hair: h.hair, hairC: h.hairC, clothes: 'job', cc: null }; }
function styleKey(st) { return [st.hair, st.hairC, st.clothes, st.cc].join('-'); }
function playerLookV2(job, hairKey, style) {
  const st = style || defaultStyle(job, hairKey);
  const l = playerLook(job, hairKey);
  l.hair = st.hair; l.hairC = st.hairC; l.hairH = shade(st.hairC, 1.35);
  if (st.clothes !== 'job' && CLOTHES[st.clothes]) l.outfits.base = CLOTHES[st.clothes].make(st.cc || '#f19ab5');
  l.fem = st.hair !== 'short' || !!(CLOTHES[st.clothes] && CLOTHES[st.clothes].fem);
  l.outfits.wedding = { coat: '#ffffff', coatS: '#e6e8f0', shirt: '#ffffff', pants: l.fem ? '#f7d4b5' : '#ffffff', skirt: l.fem ? '#ffffff' : null, long: true, shoes: '#ffffff', closed: true, collar: '#ffffff', veil: l.fem, corsage: '#f7b9c9', bow: l.fem ? null : '#f7b9c9' };
  return l;
}
function setupLooks() {
  Object.assign(LOOKS.det.outfits, DET_OUTFITS);
  LOOKS.det.outfits.suit = { coat: '#23252e', coatS: '#17181f', shirt: '#ffffff', pants: '#23252e', shoes: '#17181f', bow: '#2b2b33', corsage: '#f7b9c9' };
}
function startGame(state, isNew) {
  S = state; S.rel.daily = Object.assign(newDaily(), S.rel.daily || {});
  S.settings = Object.assign({ music: true, sfx: true, mini: true, zoom: 1 }, S.settings || {}); G.zoom = S.settings.zoom;
  G.title = false; G.camFocus = null;
  spawnActors();
  if (!S.rel.daily.planned) { planDay(); S.rel.daily.planned = true; }
  G.started = true;
  $('#title').classList.add('hidden'); $('#newgame').classList.add('hidden'); $('#hud').classList.remove('hidden');
  Sound.init(); Sound.setOn('music', S.settings.music); Sound.setOn('sfx', S.settings.sfx);
  drawMinimapBase(); updateHUD(); save();
  if (isNew) {
    setTimeout(() => toast('☀️ 7월 1일, 여름. 해월도에 온 걸 환영해요!'), 400);
    setTimeout(() => toast('화면이나 위의 🗺 지도를 누르면 그곳으로 걸어가요'), 2600);
    setTimeout(() => toast('🚓 저 멀리서 누군가 다가오는 것 같아요…'), 5200);
  } else { toast(`이어하기 — ${dateLabel()} ${fmtTime(S.min)} · ${stageName()}`); dayStartMessages(); }
}
function buildNewGameUI() {
  const jobs = $('#jobList'); jobs.innerHTML = '';
  let job = 'doctor', hair = 'ponytail';
  const prev = () => {
    const look = Object.assign(playerLookV2(job, hair), { cacheId: 'prev-' + job + hair });
    const c = $('#pvChibi'), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    g.drawImage(chibi(look, 'base', 'f', 0, 'stand', false), 0, 0);
    const p = $('#pvFace').getContext('2d'); p.clearRect(0, 0, 32, 32); p.drawImage(drawPortrait(look, 'base', 'smile'), 0, 0);
    $('#jobDesc').textContent = JOBS[job].desc;
  };
  for (const [k, J] of Object.entries(JOBS)) {
    const b = document.createElement('button'); b.className = 'job' + (k === job ? ' on' : ''); b.innerHTML = `<span>${J.icon}</span><b>${J.name}</b>`;
    b.onclick = () => { job = k; jobs.querySelectorAll('.job').forEach(x => x.classList.remove('on')); b.classList.add('on'); prev(); };
    jobs.appendChild(b);
  }
  const hairs = $('#hairList'); hairs.innerHTML = '';
  for (const [k, H] of Object.entries(PLAYER_HAIRS)) {
    const b = document.createElement('button'); b.className = 'hair' + (k === hair ? ' on' : ''); b.textContent = H.label;
    b.onclick = () => { hair = k; hairs.querySelectorAll('.hair').forEach(x => x.classList.remove('on')); b.classList.add('on'); prev(); };
    hairs.appendChild(b);
  }
  prev();
  $('#startBtn').onclick = () => {
    Sound.init();
    const name = ($('#nameIn').value || '').trim().slice(0, 8) || '해월';
    const dn = ($('#detIn').value || '').trim().slice(0, 6);
    try { localStorage.setItem(SAVE_KEY + '-name', name); } catch (e) { }
    buildWorld();
    startGame(newState(name, job, hair, dn), true);
  };
  try { $('#nameIn').value = localStorage.getItem(SAVE_KEY + '-name') || ''; } catch (e) { }
}
function bindUI() {
  const view = R.view; let down = null;
  // 두 손가락으로 확대 · 축소
  const ptrs = new Map(); let pinch = null;
  const setZoom = (z) => { G.zoom = Math.max(0.6, Math.min(2.2, z)); if (S) S.settings.zoom = G.zoom; };
  view.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: G.zoom || 1 }; down = null; G.pinching = true; }
    else if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY };
  });
  view.addEventListener('pointermove', (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d); return; }
    if (G.decor) { const r = view.getBoundingClientRect(); const w = screenToWorld(e.clientX - r.left, e.clientY - r.top); G.decor.hover = [Math.floor(w.tx), Math.floor(w.ty)]; }
  });
  const endPtr = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2 && pinch) { pinch = null; G.pinching = false; save(); } };
  view.addEventListener('pointercancel', (e) => { endPtr(e); down = null; });
  view.addEventListener('pointerup', (e) => {
    const wasPinch = !!pinch || ptrs.size > 1; endPtr(e);
    if (!down || wasPinch) { if (!ptrs.size) down = null; return; }
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (moved > 14) return;
    const r = view.getBoundingClientRect(); onTap(e.clientX - r.left, e.clientY - r.top);
  });
  view.addEventListener('wheel', (e) => { e.preventDefault(); setZoom((G.zoom || 1) * (e.deltaY < 0 ? 1.1 : 0.9)); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; G.keys[k] = true;
    if ((k === ' ' || k === 'e' || k === 'Enter') && G.started) {
      if (G.dialog && _dlgResolve && !$('#dlg').classList.contains('choosing')) { _dlgResolve(); e.preventDefault(); return; }
      if (G.fishing) { fishTap(); return; }
      if (!paused() && G.ctxAction && G.ctxAction.fn) { G.ctxAction.fn(); e.preventDefault(); }
    }
    if (k === 'Escape') { if (G.sheet) closeSheet(); else if (G.screen && !$('#rel').classList.contains('hidden')) closeRel(); }
  });
  window.addEventListener('keyup', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; G.keys[k] = false; });
  window.addEventListener('blur', () => { G.keys = {}; });
  $('#dlg').addEventListener('click', () => { if (_dlgResolve && !$('#dlg').classList.contains('choosing')) _dlgResolve(); });
  $('#actBtn').addEventListener('click', () => { Sound.init(); if (G.fishing) { fishTap(); return; } if (!paused() && !G.busy && G.ctxAction && G.ctxAction.fn) G.ctxAction.fn(); });
  $('#sheetClose').onclick = closeSheet;
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
  $('#relBtn').onclick = () => { if (!G.busy && !paused()) openRel('profile'); };
  $('#relClose').onclick = closeRel;
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  $('#compIcon').onclick = compMenu;
  $('#hSpeed').onclick = () => { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; updateHUD(); };
  $('#menuBtn').onclick = () => { if (!G.busy && !paused()) mainMenu(); };
  $('#suOk').onclick = () => { $('#stageUp').classList.add('hidden'); G.screen = false; };
  $('#zoom').onclick = () => $('#zoom').classList.add('hidden');
  $('#helpOk').onclick = () => { $('#help').classList.add('hidden'); G.screen = false; };
  $('#btnNew').onclick = () => { Sound.init(); $('#title').classList.add('hidden'); $('#newgame').classList.remove('hidden'); buildNewGameUI(); };
  $('#btnBack').onclick = () => { $('#newgame').classList.add('hidden'); $('#title').classList.remove('hidden'); };
  $('#btnCont').onclick = () => { Sound.init(); const s = loadSave(); if (s) { buildWorld(); startGame(s, false); } };
  $('#mapBtn').onclick = () => { if (!paused() && !G.busy) openBigMap(); };
  { // 지도: 두 손가락 확대, 한 손가락 끌기, 탭하면 이동
    const wrap = $('.map-wrap'), mp = new Map(); let mpinch = null, mdown = null, raf = 0;
    wrap.addEventListener('pointerdown', (e) => { mp.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (mp.size === 2) { const [a, b] = [...mp.values()]; mpinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: BIGMAP.zoom || 1, sl: wrap.scrollLeft, st: wrap.scrollTop }; mdown = null; } else mdown = { x: e.clientX, y: e.clientY, sl: wrap.scrollLeft, st: wrap.scrollTop, e }; });
    wrap.addEventListener('pointermove', (e) => {
      if (!mp.has(e.pointerId)) return; mp.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mpinch && mp.size === 2) { const [a, b] = [...mp.values()]; const z = Math.max(1, Math.min(4, mpinch.z * Math.hypot(a.x - b.x, a.y - b.y) / mpinch.d)); if (Math.abs(z - BIGMAP.zoom) > 0.02) { const k = z / BIGMAP.zoom; BIGMAP.zoom = z; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const cx = wrap.scrollLeft + wrap.clientWidth / 2, cy = wrap.scrollTop + wrap.clientHeight / 2; drawBigMap(); wrap.scrollLeft = cx * k - wrap.clientWidth / 2; wrap.scrollTop = cy * k - wrap.clientHeight / 2; }); } }
      else if (mdown && e.pointerType === 'mouse' && e.buttons) { wrap.scrollLeft = mdown.sl - (e.clientX - mdown.x); wrap.scrollTop = mdown.st - (e.clientY - mdown.y); }
    });
    const up = (e) => { const was = !!mpinch; mp.delete(e.pointerId); if (mp.size < 2) mpinch = null; if (mdown && !was && Math.hypot(e.clientX - mdown.x, e.clientY - mdown.y) < 10 && e.target.id === 'bigMap') bigMapTap(e); if (!mp.size) mdown = null; };
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', (e) => { mp.delete(e.pointerId); mpinch = null; mdown = null; });
    wrap.addEventListener('wheel', (e) => { e.preventDefault(); BIGMAP.zoom = Math.max(1, Math.min(4, BIGMAP.zoom * (e.deltaY < 0 ? 1.15 : 0.87))); drawBigMap(); }, { passive: false });
  }
  $('#mapClose').onclick = closeBigMap;
  $('#mapZoom').onclick = toggleBigMapZoom;
  $('#decorBtn').onclick = openDecor;
  $('#dDone').onclick = closeDecor;
  $('#dStore').onclick = () => { const d = G.decor; if (d.sel == null) return; const [k] = S.home[d.sel]; S.home.splice(d.sel, 1); S.furnInv[k] = (S.furnInv[k] || 0) + 1; d.sel = null; setFurniture(MAPS.in_home, homeFurnList()); updateDecorBar(); save(); };
  $('#dRotate').onclick = () => { const d = G.decor; if (d.sel == null) return; S.home[d.sel][3] = S.home[d.sel][3] ? 0 : 1; setFurniture(MAPS.in_home, homeFurnList()); save(); };
  $('#dMove').onclick = () => { const d = G.decor; if (d.sel == null) return; d.moving = true; updateDecorBar(); };
  $('#dBag').onclick = decorStorage;
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  window.addEventListener('resize', resize);
}
function boot() {
  R.view = $('#view'); R.v = R.view.getContext('2d');
  setupLooks();
  buildWorld();
  R.shadow = mkCanvas(14, 6); fillEllipse(R.shadow.getContext('2d'), 7, 3, 6, 2, 'rgba(30,40,30,0.28)');
  R.glow = mkCanvas(48, 32);
  { const g = R.glow.getContext('2d'); const gr = g.createRadialGradient(24, 16, 1, 24, 16, 22); gr.addColorStop(0, 'rgba(255,214,130,0.75)'); gr.addColorStop(1, 'rgba(255,214,130,0)'); g.setTransform(1, 0, 0, 0.66, 0, 5.4); g.fillStyle = gr; g.fillRect(0, 0, 48, 48); }
  resize(); bindUI();
  const s = loadSave();
  $('#btnCont').classList.toggle('hidden', !s);
  if (s) $('#contInfo').textContent = `${s.name} · ${JOBS[s.job].name} · ${dateLabel(s.day)} · ${STAGES[s.rel.stage - 1].name}`;
  // 타이틀 배경: 고정된 마을 그림 (움직이지 않아 끊김 없음)
  S = null; M = MAPS.island;
  G.player = new Actor('p', playerLook('traveler', 'ponytail'), 'base'); G.player.x = 66.5; G.player.y = 62.5; G.player.visible = false;
  G.actors = [];
  G.camFocus = { x: 67.5, y: 60.5 }; G.camSnap = true;
  requestAnimationFrame(loop);
}
window.addEventListener('DOMContentLoaded', boot);
window.HW = { G, get S() { return S; }, addAff, startCompanion, endCompanion, save, checkStage, render, endDay, goMap };
