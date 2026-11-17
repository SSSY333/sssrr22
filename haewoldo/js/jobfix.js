/* =====================================================================
   내 직업과 겹치는 대사 고치기
   · 카페 사장님인데 「커피 마시러 카페 가요」 · 해녀(토박이)인데 「해월도는 처음이죠?」 같은 말을
     직업에 맞는 말로 바꿔 줌 (형사님 · 주민 대사, 말풍선 모두)
   · 존댓말로 바꾼 뒤, 말을 놓은 사이라면 원래대로 반말로 자동 변환됨
   ===================================================================== */
const JOB_FIX = {
  cafe: {
    rules: [
      [/귤 라떼 냄새 나요\. 한 잔 할래요\?/, '여기까지 귤 라떼 냄새가 나요. 오늘 장사 잘됐어요?'],
      [/[^.!?…]*(카페 (쉼터)?\s*(가요|가자|갈래요|갈래|가실래요|들렀다 가|가서|데이트)|귤 라떼 (한 잔|두 잔|마시|꼭 마셔|드셔|드셨)|커피 (한 잔 하|마시러|사 줄게|살게요|사 드릴|드시러)|아메리카노가 섬에서|카페에서 (점심|귤 라떼|만나))[^.!?…]*[.!?…]*/, () => pick(['오늘 손님 많았어요? 사장님도 좀 앉아서 쉬어요.', '가게 문 닫으면 바닷가 산책 갈래요? 커피는 오늘 사장님 말고 제가 캔으로 살게요.', '당신이 내려 준 커피가 섬에서 제일 맛있어요. 이건 진심이에요.', '오늘은 제가 사장님 커피 한 잔 내려 드릴까요? …맛은 보장 못 해요.', '라떼 아트 연습은 잘돼요? 다음엔 저한테도 하트 그려 줘요.'])],
      [/카페 사장님(이|은|도)? ?(친절|우리|그러|한테)/, (m) => m.replace(/카페 사장님(이|은|도)?/, '당신$1'), true],
      [/섬에 카페가 하나뿐인 건 비밀로/, '당신 카페가 섬의 자랑인 건 다 알아요', true],
    ],
    date: { name: '마감 후 둘만의 카페', lines: [['smile', '오늘은 제가 카운터 볼게요. 사장님은 손님 하세요.'], ['tease', '…커피 머신이 왜 이렇게 어렵죠. 사장님, 도와줘요.']], c: [['같이 내려요', '좋아요. 제 컵엔 하트 그려 줘요.'], ['제가 내려 줄게요', '사장님 커피라니. 오늘 운 좋다.']] },
    order: '내 가게 커피를 손님처럼 한 잔 마셨다. 오늘도 맛있다.',
  },
  haenyeo: {
    rules: [
      [/[^.!?…]*(해월도는 처음|섬에 (처음|새로) 오|섬이 처음|섬 생활은 (좀 )?익숙해|섬엔 언제까지 계실)[^.!?…]*[.!?…]*/, () => pick(['해월도 토박이시니까 저보다 섬 길을 더 잘 아시겠어요.', '오늘 물질은 어땠어요? 바다 차갑진 않았어요?', '어릴 때부터 이 바다 보면서 자랐죠? 부럽다.'])],
      [/해녀(분|할머니)들은? (벌써|오늘|요즘)[^.!?…]*[.!?…]*/, '오늘은 바다 나가요? 물때 좋던데요.'],
    ],
  },
  doctor: {
    rules: [
      [/[^.!?…]*보건지소(에|로)? ?(가 ?봐|가세요|가요|가 보세요|들러|오세요)[^.!?…]*[.!?…]*/, '아프면… 아, 당신이 의사 선생님이죠. 저 좀 봐 줘요. 하하.'],
      [/보건지소에 (새 )?선생님이 오셔서/, '당신이 와서', true],
    ],
  },
  teacher: {
    rules: [
      [/아이들이 새 선생님 얘기를/, '애들이 당신 얘기를', true],
    ],
  },
  traveler: {
    rules: [
      [/[^.!?…]*여행 (오셨어요|왔어요|오신 거)\?[^.!?…]*/, '여행 일지는 몇 장째예요? 저도 한 줄 들어가 있어요?'],
    ],
  },
};
function jobFixText(t) {
  if (!S || typeof t !== 'string') return t;
  const J = JOB_FIX[S.job]; if (!J) return t;
  for (const [re, rep, part] of J.rules) if (re.test(t)) { if (part) t = t.replace(re, rep); else return typeof rep === 'function' ? rep(t) : rep; }   // 겹치는 말이 있으면 그 줄 전체를 바꿈 (part: 단어만)
  return t;
}
const _sayJob = say;
say = function (who, expr, text) { if (who !== 'me' && who !== 'narr') text = jobFixText(text); return _sayJob(who, expr, text); };
const _actorSayJob = Actor.prototype.say;
Actor.prototype.say = function (text, t) { return _actorSayJob.call(this, this.pet ? text : jobFixText(text), t); };
/* 데이트 · 주문 */
const _startGameJob = startGame;
startGame = function (state, isNew) {
  _startGameJob(state, isNew);
  try {
    if (!DATES._cafe0) DATES._cafe0 = Object.assign({}, DATES.cafe);
    Object.assign(DATES.cafe, DATES._cafe0);
    if (S.job === 'cafe' && JOB_FIX.cafe.date) Object.assign(DATES.cafe, JOB_FIX.cafe.date);
  } catch (e) { }
};
Object.defineProperty(DATES, '_cafe0', { enumerable: false, writable: true, value: undefined });
