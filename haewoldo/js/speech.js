'use strict';
/* =========================================================
 *  해월도 v6 — 관계 단계별 말투 (존댓말 → 반말)
 *  · 1~2단계 존댓말, 3단계 「말 놓기」 이벤트 뒤(또는 4단계 이상) 반말
 *  · 손으로 새로 쓴 반말 대사가 우선이고, 예전 존댓말 대사가 남아 있으면
 *    아래 변환기가 문장 끝 · 대명사를 반말로 바꿔 준다.
 * ========================================================= */
function casualOn() { if (!S) return false; const r = S.rel; return !!(r.flags.banmal || r.stage >= 4); }

const _H0 = 0xAC00;
const hIs = (ch) => { const c = ch && ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3; };
const hDec = (ch) => { const b = ch.charCodeAt(0) - _H0; return [Math.floor(b / 588), Math.floor((b % 588) / 28), b % 28]; };
const hCom = (L, V, Tt) => String.fromCharCode(_H0 + L * 588 + V * 28 + Tt);
const B_IRR = ['고맙', '반갑', '즐겁', '귀엽', '덥', '춥', '어렵', '쉽', '무섭', '가볍', '무겁', '부럽', '맵', '뜨겁', '차갑', '아름답', '새롭', '외롭', '가깝', '부드럽', '시끄럽', '아깝', '간지럽', '사랑스럽', '자랑스럽', '놀랍', '더럽', '두렵', '그립', '날카롭', '평화롭', '여유롭', '향기롭'];
/* 어간 + 아/어 (반말 해체) */
function conjA(stem) {
  if (!stem) return stem;
  const last = stem[stem.length - 1], pre = stem.slice(0, -1);
  if (!hIs(last)) return stem;
  if (last === '하') return pre + '해';
  if (B_IRR.some(b => stem.endsWith(b))) { const [L, V] = hDec(last); return pre + hCom(L, V, 0) + (V === 8 && stem.endsWith('돕') ? '와' : '워'); }
  const [L, V, Tt] = hDec(last);
  const prevV = pre && hIs(pre[pre.length - 1]) ? hDec(pre[pre.length - 1])[1] : -1;
  if (Tt) { if (last === '르' ) return stem; return stem + ((V === 0 || V === 8) ? '아' : '어'); }
  switch (V) {
    case 0: case 4: case 1: case 5: case 6: return stem;            // 가 서 내 세 켜
    case 8: return pre + hCom(L, 9, 0);                              // 오→와 보→봐
    case 13: return pre + hCom(L, 14, 0);                            // 주→줘
    case 18: return pre + hCom(L, (prevV === 0 || prevV === 8) ? 0 : 4, 0); // 쓰→써 바쁘→바빠
    case 20: return last === '이' ? stem + '야' : pre + hCom(L, 6, 0); // 마시→마셔
    case 11: return pre + hCom(L, 10, 0);                            // 되→돼
    default: return stem + '어';
  }
}
function addSS(w) { const last = w[w.length - 1]; if (!hIs(last)) return w; const [L, V, Tt] = hDec(last); return Tt ? w : w.slice(0, -1) + hCom(L, V, 20); }
const _END = '(?=[\\s.,!?…~"」\\)♪♥]|$)';
const BANMAL_RULES = [
  [/말씀드릴게요/g, '말할게'], [/말씀드리/g, '말하'], [/말씀드려/g, '말해'],
  // 고정 표현
  [/안녕하세요/g, '안녕'], [/감사합니다/g, '고마워'], [/고맙습니다/g, '고마워'], [/죄송합니다/g, '미안해'], [/죄송해요/g, '미안해'], [/미안합니다/g, '미안해'],
  [/축하드립니다/g, '축하해'], [/축하드려요/g, '축하해'], [/실례합니다/g, '실례할게'], [/잘 부탁드립니다/g, '잘 부탁해'], [/부탁드립니다/g, '부탁해'], [/부탁드려요/g, '부탁해'],
  [/여쭤/g, '물어'], [/드릴게요/g, '줄게'], [/드릴까요/g, '줄까'], [/드려요/g, '줘'], [/드렸어요/g, '줬어'], [/드리고/g, '주고'], [/드릴/g, '줄'], [/드립니다/g, '줄게'],
  [/계세요/g, '있어'], [/계셨어요/g, '있었어'], [/계시/g, '있으'], [/주무세요/g, '자'], [/드세요/g, '먹어'], [/드셨어요/g, '먹었어'], [/드시/g, '먹으'],
  [/그쵸/g, '그치'], [/아니요/g, '아니'], [/아니에요/g, '아니야'], [/맞아요/g, '맞아'],
  [/^네([,.!…])/g, '응$1'], [/^네$/g, '응'], [/ 네([,.!…])/g, ' 응$1'], [/^예([,.!…])/g, '응$1'],
  // 대명사
  [/저희/g, '우리'], [/제가/g, '내가'], [/저는/g, '나는'], [/저도/g, '나도'], [/저를/g, '나를'], [/저한테/g, '나한테'], [/저랑/g, '나랑'], [/저만/g, '나만'], [/저보다/g, '나보다'], [/저요([?!.…]|$)/g, '나$1'], [/저의/g, '나의'],
  [/(^|[\s…,.!?"「])저 (?!(별|수호|돌하르방|고양이|집|멀리|화분|녀석|쪽|사람|배|섬|등대|바다|하늘|끝|위|아래|앞|뒤|너머|꽃|나무|구름|길|언덕|풍차|아이|애|두|둘|산|불빛|노을|물|안내판|표지판|문|가게|건물|창고))/g, '$1나 '],
  [/드려/g, '줘'], [/드리/g, '주'], [/말씀/g, '말'],
  [/(^|[\s(「"])제 /g, '$1내 '], [/(^|[\s(「"])제 것/g, '$1내 것'], [/제 거/g, '내 거'],
  [/당신이랑/g, '너랑'], [/당신이/g, '네가'], [/당신은/g, '너는'], [/당신을/g, '너를'], [/당신한테/g, '너한테'], [/당신도/g, '너도'], [/당신만/g, '너만'], [/당신의/g, '너의'], [/당신 /g, '네 '], [/당신/g, '너'],
  // 하십시오체 · 해요체 → 해체
  [new RegExp('([가-힣]+?)(으)?십시오' + _END, 'g'), (m0, w, eu) => conjA(w)],
  [new RegExp('([가-힣])(으)?십니까' + _END, 'g'), (m0, w) => conjA(w) + ''],
  [new RegExp('([가-힣]+)습니까' + _END, 'g'), (m0, w) => conjA(w)],
  [new RegExp('([가-힣]*)([가-힣])니까\\?', 'g'), (m0, pre, ch) => { const [L, V, Tt] = hDec(ch); if (Tt !== 17) return m0; return pre + conjA(hCom(L, V, 0)) + '?'; }],
  [new RegExp('([가-힣]+)입니다' + _END, 'g'), (m0, w) => { const l = w[w.length - 1]; return w + (hIs(l) && hDec(l)[2] ? '이야' : '야'); }],
  [new RegExp('([가-힣]+)습니다' + _END, 'g'), (m0, w) => conjA(w)],
  [new RegExp('([가-힣]*)([가-힣])니다' + _END, 'g'), (m0, pre, ch) => { const [L, V, Tt] = hDec(ch); if (Tt !== 17) return m0; return conjA(pre + hCom(L, V, 0)); }],
  [new RegExp('([가-힣]*)([가-힣])시다' + _END, 'g'), (m0, pre, ch) => { const [L, V, Tt] = hDec(ch); if (Tt !== 17) return m0; return pre + hCom(L, V, 0) + '자'; }],
  // 존칭 '-시-' 제거
  [/([가-힣])(으)?셨/g, (m0, ch, eu) => (eu ? addSS(conjA(ch)) : addSS(conjA(ch)))],
  [/(하|가|오|보|주|되|쉬|타|사|자|만나|기다리|드리|모르|오르|고르|부르)시([는면고던러잖지네니죠])/g, '$1$2'],
  [/(앉|받|찾|웃|많|괜찮|좋|있|없|늦|읽|먹|입)으시([는면고던러잖지네니죠])/g, '$1$2'],
  [/(아|알)시([는면고던지네죠])/g, '알$2'],
  [new RegExp('([가-힣])(으)?세요' + _END, 'g'), (m0, ch, eu) => eu ? conjA(ch) : (ch === '하' ? '해' : conjA(ch))],
  [new RegExp('([가-힣])(으)?세요(\\?)', 'g'), (m0, ch, eu) => (ch === '하' ? '해' : conjA(ch)) + '?'],
  // 해요체 어미
  [new RegExp('거예요' + _END, 'g'), '거야'], [new RegExp('예요' + _END, 'g'), '야'], [new RegExp('이에요' + _END, 'g'), '이야'], [new RegExp('(거|게|뭐|어디|누구|저|이|그)에요' + _END, 'g'), '$1야'],
  [new RegExp('군요' + _END, 'g'), '구나'], [new RegExp('([가-힣])죠' + _END, 'g'), '$1지'], [new RegExp('지요' + _END, 'g'), '지'],
  [new RegExp('([가-힣])요' + _END, 'g'), '$1'],
  [/([가-힣])요,/g, '$1,'],
];
const BANMAL_FIX = { '하지': '하지', '갈래': '갈래' };
function toBanmal(t) {
  if (!t || typeof t !== 'string') return t;
  let s = t;
  for (const [re, to] of BANMAL_RULES) s = s.replace(re, to);
  return s;
}
/* 플레이어 → 형사님 말: 호칭도 바꾼다 */
function toBanmalMe(t) {
  let s = toBanmal(t);
  const h = himCall(); if (h !== '형사님') s = s.replace(/형사님/g, h);
  return s;
}
/* [[존댓말||반말]] 형식 지원 */
function speechPick(t) {
  if (typeof t !== 'string' || t.indexOf('[[') < 0) return t;
  const c = casualOn();
  return t.replace(/\[\[([^\]|]*)\|\|([^\]]*)\]\]/g, (m0, a, b) => c ? b : a);
}
