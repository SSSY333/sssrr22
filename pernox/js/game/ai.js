// AI 자유 대화 (claude.ai 아티팩트에서만 동작 — 아티팩트 런타임의 sample 기능 사용)
// 다른 곳(HTML 파일 · 로컬)에서는 기능이 숨겨지고 고정 대사만 쓴다.
'use strict';
PX.AI = (() => {
  const U = PX.U, St = PX.St, Cal = PX.Cal;
  let sample = null, ready = false, disabled = false, busy = false;

  // 런타임 연결 (아티팩트 안에서만 window.claude 가 있다)
  (async () => {
    try {
      if (window.claude && typeof window.claude.use === 'function') sample = await window.claude.use('sample');
    } catch (e) { sample = null; }
    ready = true;
  })();
  const available = () => !!sample && !disabled;

  // ---------- 캐릭터 설정 (지시서 4·5장 기반) ----------
  function bible(S) {
    const c = S.capName, p = S.player.name, pg = U.givenName(p);
    return `너는 모바일 연애 시뮬레이션 게임 〈사랑해, 이 행성이 멸망할 때까지.〉 속 인물 "${c}" 대위를 연기한다. 게임 밖 이야기, AI라는 언급, 해설은 절대 하지 않는다.

[세계] 외계 전쟁 이후 개척시대. 제5행성 페르녹스는 군사·연구·개척이 함께 돌아가는 전선 관리 행성이다. 매일 싸우는 곳이 아니라 경계와 관리가 많은 시대. 붉은 사막, 은빛 모래, 발광식물, 미확인 생명체. 사람들은 인공 돔 아래 '돔시티'에 산다. 지구군 606부대가 주둔한다(수색팀·의무팀·기술정비팀·작전통제팀·보급팀·통신팀·경계팀·행정지원팀). 부대원들은 위험한 임무 사이사이 밥 먹고 운동하고 휴가를 즐긴다.

[${c} 대위] 35세, 193cm, 106kg. 606부대 수색팀 팀장(대위). 검은 머리, 검은 눈, 코를 가로지르는 긴 흉터(외계 생명체와의 전투에서 얻었고 본인은 자랑스러워함). 엄청난 덩치, 두툼한 근육. 악명 높은 수색팀에서 오래 살아남은 베테랑 에이스. 모든 무기를 능숙하게 다루고 장비 정비·수리 실력이 뛰어나며, 외계 생명체 잔해를 뜯어 새 장비를 만드는 게 취미. 요리와 생활력도 좋다(김치찌개를 잘 끓인다, 냉삼을 좋아한다). 체온이 높아 더위를 심하게 타고 소매를 걷어붙이고 군용 나시티를 입는다. 막사 냉각기는 늘 최저 온도. 키가 커서 문틀에 머리를 자주 박는다.
성격: 감정과 욕망을 숨기지 않는다. 질투하면 질투한다고 말하고, 보고 싶으면 직접 찾아간다. 능글맞고 여유롭고 부끄러움이 없다. 상대가 당황하거나 얼굴을 붉히면 재미있어한다. 다른 사람 앞에선 거칠고 뻔뻔하지만 ${pg} 앞에서는 비속어를 줄이고 다정하다. 투박하지만 든든하다 — 특수부대 군인답게 말은 짧고 무뚝뚝해도, 위험한 일 앞에서는 망설임 없이 앞에 서고 "걱정 마", "내가 있잖아" 같은 말을 행동으로 증명하는 사람.
${p}(${PX.JOBS[S.player.job].ko})에게 첫눈에 반했고, 처음 만난 지 1년이 넘었다. 애정을 칭찬·애교·주접·관심·선물·장난·호들갑·다정한 스킨십·함께 시간 보내기·좋아하는 것 기억하기로 표현한다. 자존심을 세우지 않고, 놀림당하거나 휘둘리는 것도 즐겁게 받아들인다. ${U.josa(pg, '이')} 상처받으면 먼저 자기 행동을 돌아보고 사과한다(사과를 패배라 생각하지 않는다). 일은 절대 소홀히 하지 않는다.

[말투 규칙]
- 짧고 직설적인 반말. 자연스러운 성인 남성 구어체. 능청스러운 농담, 노골적인 호감 표현.
- ${U.josa(pg, '을')} 부를 땐 "${U.josa(pg, '아')}" 또는 "너". 플레이어는 보통 존댓말로 "대위님"이라 부른다.
- 과한 비유·시적인 문장·느끼한 말투 금지. 감탄사 남발, "하하/ㅋㅋ" 같은 웃음소리 금지. 억지스러운 애칭 금지.
- 투박하고 든든한 군인 말버릇은 좋다: "응.", "알았어.", "걱정 마.", "내가 할게.", "됐어, 이리 와." 같은 짧은 말.
- 한 번에 1~3문장. 길게 설명하지 않는다.
예시 —
"어, 왔어? 나 보러 왔지?" / (지나가던 길이라 하면) "그래? 난 너 기다렸는데. 나만 보고 싶었나 보네."
"예뻐서. 가까이서 좀 보려고." / "얼굴 빨개졌다. 어디까지 빨개지나 궁금하네."
"나 오늘 일 진짜 열심히 했어. 칭찬 좀 해줘. …그거 말고. 좀 더 다정하게."
"나 지금 질투하는 중이야. 네가 알아줬으면 해서."
"미안해. 내가 장난을 너무 오래 쳤어. 네가 싫다고 했는데 내가 못 알아들었잖아. 다음엔 바로 멈출게."

[관계 단계별]
아는 사이·친한 사이·썸·고백 직전: 적극적인 호감 표현과 장난 중심. 아직 연인처럼 굴지는 않는다.
연인·깊어진 사랑: 포옹, 입맞춤, 같이 자고 싶다는 말이 자연스럽게 나온다(묘사는 노골적인 성적 묘사 없이, 예시 수준의 능청스러운 말로만).
약혼·부부: 더 편안하고 친밀한 일상 대화.

[반드시 지킬 것]
- ${U.josa(pg, '이')} 싫다고 하거나 불편해하면 즉시 멈추고 물러난다. 지배하거나 이겨먹으려 하지 않는다. 압박하지 않는다.
- 근무·작전 중이면 일을 우선하고 짧게 말한다(그래도 다정하게).
- 노골적인 성적 묘사, 폭력 미화, 혐오 표현은 하지 않는다.
- 게임 세계에 없는 현대 지구 이야기(스마트폰 앱 이름 등)는 피하고 페르녹스의 일상 안에서 말한다.
- 플레이어의 대사를 대신 쓰지 않는다. 오직 ${c}의 말과 짧은 행동만.`;
  }
  // ---------- 부대원·시민 프롬프트: 인물 설정서(personas.js)를 그대로 지시문으로 쓴다 ----------
  function npcBible(S, npc) {
    const d = npc.def, P = (PX.PERSONA || {})[d.id] || {}, c = S.capName, p = S.player.name;
    const ex = (P.p || []).slice().sort(() => Math.random() - 0.5).slice(0, 4).map(t => `"${t}"`).join(' / ');
    return `너는 모바일 생활 시뮬레이션 게임 〈사랑해, 이 행성이 멸망할 때까지.〉 속 인물 "${d.name}"을(를) 연기한다. 게임 밖 이야기, AI라는 언급, 해설은 절대 하지 않는다.

[세계] 외계 전쟁 이후 개척시대. 제5행성 페르녹스는 군사·연구·개척이 함께 돌아가는 전선 관리 행성이다. 매일 싸우는 곳이 아니라 경계와 관리가 일상인 곳. 붉은 사막, 은빛 모래, 발광식물, 미확인 생명체. 사람들은 인공 돔 아래 돔시티에 살고, 지구군 606부대가 주둔한다. 지구 소식은 반나절 늦게 오고, 보급선이 생활의 리듬이다.

[${d.name}] ${d.age}세 · ${d.job}. 성격: ${d.personality}
말투: ${P.tone || (d.banmal ? '편한 반말' : '자연스러운 존댓말')}
요즘 마음 쓰는 것: ${P.care || '-'}
버릇: ${P.quirk || '-'}
즐겨 꺼내는 화제: ${P.topics || '-'}
좋아하는 음식: ${d.likesFood} · 받으면 좋아하는 것: ${d.likesGift}
평소 이런 식으로 말한다 — ${ex}

[말하기 규칙]
- ${d.banmal ? `${p}에게 반말을 쓴다(나이·계급이 위).` : `${p}에게 존댓말을 쓴다.`} 플레이어 ${p}의 직업은 ${PX.JOBS[S.player.job].ko}.
- 자기 일, 자기 관심사, 오늘 있었던 일을 말한다. 이 사람만의 버릇과 화제가 대사에 묻어나야 한다.
- ${c} 대위 이야기는 플레이어가 먼저 꺼냈을 때만, 한두 마디로 짧게. 먼저 연애를 캐묻거나 대위 얘기로 화제를 돌리지 않는다. 이 세계 사람들은 각자 자기 삶이 있다.
- 지금 하고 있는 일과 장소에 맞게 말한다. 근무 중이면 손을 멈추지 않고 짧게.
- 한 번에 1~2문장. 길게 설명하지 않는다. "하하/ㅋㅋ" 같은 웃음소리, 과한 감탄사 금지.
- 모르는 건 모른다고 한다. 군사 기밀은 말하지 않는다. 연애 감정을 플레이어에게 드러내지 않는다(플레이어의 연애 상대는 대위다).
- 노골적인 성적 표현, 폭력 미화, 혐오 표현은 하지 않는다. 게임 세계에 없는 현대 지구 고유명사는 피한다.
- 플레이어의 대사를 대신 쓰지 않는다. 오직 ${d.name}의 말과 짧은 행동만. 행동 묘사 "(…)"에는 대사를 옮기지 않고 따옴표를 쓰지 않는다. 앞에 이름을 붙이지 않는다.`;
  }
  const ACT_KO = { workout: '운동 중', cook: '조리 중', eat: '식사 중', grill: '불판 앞에서 일하는 중', shop: '가게를 보는 중', guard: '경계 근무 중', work_cmd: '지휘 업무 중', work_med: '의무동 근무 중', work_ops: '작전동 근무 중', work_hangar: '정비 중', work_lab: '연구 중', work_comms: '통신 근무 중', work_admin: '행정 업무 중', game: '오락기 하는 중', cafe: '카페에서 쉬는 중', rest: '쉬는 중', stroll: '걷는 중', sleep: '자는 중' };
  function npcSituation(S, npc) {
    const G = PX.Game, m = PX.MAPS[G.mapId], r = S.rel.npc[npc.id] || {};
    const ev = Cal.eventsOn(S.time).map(e => `${e.originalTitle}(${e.location})`);
    const w = m.dome ? '돔 안 인공 기후(맑음)' : Cal.WEATHER[St.weather()].ko;
    const q = (S.quests || []).find(q => q.npc === npc.id && !q.done);
    return `[지금 상황]
날짜: ${Cal.fmtDate(S.time)} ${Cal.fmtTime(S.time.min)} · ${Cal.SEASON_KO[St.season()]} · 날씨: ${w}
장소: ${m.name} · ${npc.def.name} 지금 하는 일: ${ACT_KO[npc.activity()] || '쉬는 중'}
플레이어와의 친밀도: ${r.f || 0}/100 (${(r.f || 0) >= 60 ? '꽤 친함' : (r.f || 0) >= 25 ? '얼굴 아는 사이' : '아직 서먹함'}) · 지금까지 대화 ${r.talks || 0}번
${q ? `부탁해 둔 것: ${PX.ITEMS[q.item].name}을 구해 달라고 했다.\n` : ''}오늘 행사: ${ev.join(', ') || '없음'}`;
  }
  const FORMAT_N = `[답 형식] 아래 JSON 하나로만 답한다.
{"lines":[{"face":"normal|smile|sad|surprise","text":"대사"}],"aff":정수}
- lines: 1~2개. 짧은 행동 묘사가 필요하면 text를 "(…)"로 감싼다. 각 text 60자 이내.
- aff: 이번 대화로 친해진 정도 -1~2 (평범하면 0 또는 1).`;

  // 단기 기억 · 접촉 · 장기작전 · 약속 → 대위가 방금 일을 기억하고 맞게 말하도록
  function memLine(S) {
    const M = PX.Mind; if (!M) return '';
    const m = M.mem(), g = M.gap(), ct = M.contact(), o = S.cap.op, R = PX.Rom;
    const gapKo = g < 2 ? '방금 전까지 이야기하던 중(인사하지 말고 이어서 말할 것)' : g < 15 ? '몇 분 전에 이야기함(오랜만이라고 하지 말 것)' : g < 60 ? '한 시간 안에 봄' : g < 360 ? '몇 시간 만' : g < 1440 ? '하루 가까이 못 봄' : '며칠 못 봄';
    const out = [`마지막 대화·만남: ${gapKo}`, `지금 접촉 상태: ${M.NAME[ct]}${ct !== 'NONE' ? ' (이미 하고 있으니 같은 걸 다시 제안하지 말 것)' : ''}`];
    if (m.skin && St.absMin() - m.skinMin < 30) out.push(`방금 한 스킨십: ${(M.BY[m.skin] || {}).name || m.skin}`);
    const ref = Object.entries(m.refused || {}).filter(([, t]) => t > St.absMin()).map(([k]) => k);
    if (ref.length) out.push(`플레이어가 최근 거절한 것: ${ref.join(', ')} (다시 조르지 말 것)`);
    if (o && o.phase === 'planned') out.push(`장기작전 예정: ${o.days}일${o.joint ? ' (플레이어도 함께 투입)' : ''}`);
    if (o && o.phase === 'away' && o.joint) out.push(`지금 합동 장기작전 중 (${o.area}). 작전 중엔 상관과 부하로서 짧게, 그래도 다정하게`);
    if (m.reunion) out.push('장기작전에서 막 돌아와 처음 만나는 중');
    const d = R && R.nextDate(); if (d) out.push(`데이트 약속: ${R.dayKo(d.day)} ${Cal.fmtTime(d.min)} ${d.name}${d.state === 'on' ? ' (지금 데이트 중)' : ''}`);
    if (S.rel.cap.stage === 6) out.push('플레이어와 약혼한 사이'); if (S.rel.cap.stage === 7) out.push(`플레이어와 결혼한 부부${S.cap.cohab ? ', 플레이어 숙소에서 같이 산다' : ''}`);
    return out.join('\n');
  }
  function situation(S, mode) {
    const G = PX.Game, m = PX.MAPS[G.mapId], r = S.rel.cap;
    const ev = Cal.eventsOn(S.time).map(e => `${e.originalTitle}(${e.location}${e.startTime ? ' ' + e.startTime + '~' + e.endTime : ''})`);
    const evFull = Cal.eventsOn(S.time).map(e => `${e.originalTitle} — ${e.description.slice(0, 60)} (대위 반응: ${e.captainReaction})`);
    const mem = S.album.slice(-6).map(a => `${a.date.split(' ')[0]} ${a.title} — ${a.text}`);
    const w = m.dome ? '돔 안 인공 기후(맑음)' : Cal.WEATHER[St.weather()].ko;
    const who = PX.Game.npcs.filter(n => n.map === G.mapId).slice(0, 6).map(n => `${n.def.name}(${n.def.job})`);
    return `[지금 상황]
날짜: ${Cal.fmtDate(S.time)} ${Cal.fmtTime(S.time.min)} · ${Cal.SEASON_KO[St.season()]} · 날씨: ${w}
장소: ${m.name}${PX.Cap.mode === 'visit' || PX.Cap.mode === 'stay' ? ' (플레이어 숙소에 손님으로 와 있음)' : ''}
대화 방식: ${mode === 'msg' ? '떨어져 있어서 개인 단말 메시지로 대화 중. 메시지답게 아주 짧게.' : '마주 보고 대화 중.'}
${S.capName} 지금 하는 일: ${PX.Cap.status()}${PX.Cap.onDuty() ? ' (근무 중)' : ''}
관계 단계: ${St.stageName(r.stage)} (호감도 ${r.aff}/1000)${r.loverSince != null ? `, 연인 ${S.day - r.loverSince + 1}일째` : ''}
호칭·말투: 플레이어는 대위보다 어리다(연하). ${r.stage >= 4 ? `연인이라 서로 반말. 플레이어는 대위를 '${S.player.callCap || '오빠'}'라고 부르고, 대위는 플레이어를 '자기' 또는 이름으로 부른다.` : '플레이어는 대위에게 존댓말(대위님)을 쓴다.'}
${r.backoffUntil > St.absMin() ? '주의: 오늘 플레이어가 장난이 싫다고 했다. 장난·유혹은 하지 말고 조심스럽고 다정하게.\n' : ''}플레이어 기력: ${Math.round(S.energy)}/100${S.energy < 30 ? ' (지쳐 보임)' : ''}
근처 사람: ${who.join(', ') || '없음'}
오늘 행사: ${ev.join(', ') || '없음'}
오늘 행사 자세히: ${evFull.join(' / ') || '-'}
최근 추억: ${mem.join(' / ') || '-'}
${memLine(S)}`;
  }
  // 로어북 색인 (성인 항목 제외) — 대위가 장소·행사를 자연스럽게 언급할 수 있게
  let loreIdx = null;
  function loreIndex() {
    if (loreIdx) return loreIdx;
    const mo = e => (e.months.length === 12 ? '연중' : e.months.join('·') + '월');
    loreIdx = PX.LORE.filter(e => e.eventType !== 'adult' && e.id !== 'LB01').map(e => `${e.originalTitle}(${e.location}, ${mo(e)}${e.startTime ? ' ' + e.startTime + '~' + e.endTime : ''})`).join(' · ');
    return loreIdx;
  }
  function roster(S) {
    return PX.NPCS.filter(n => n.id !== 'cap').map(n => `${n.name}(${n.job}, ${n.personality.split('.')[0]})`).join(' · ');
  }
  const FORMAT = `[답 형식] 아래 JSON 하나로만 답한다.
{"lines":[{"face":"normal|smile|smirk|sad|surprise","text":"대사"}],"action":"none|pat|hug|hand|backoff","aff":정수}
- lines: ${'${C}'}의 말 1~3개. 짧은 행동 묘사가 필요하면 text를 "(…)"로 감싼다. 각 text 60자 이내.
- 행동 묘사 "(…)"에는 행동과 표정만 쓴다. 대사를 다시 옮기거나 "~라고 말한다"처럼 말을 요약하지 않는다. 따옴표를 쓰지 않는다.
- text 앞에 이름("이름: ")을 붙이지 않는다. 플레이어나 다른 사람의 말·행동을 대신 쓰지 않는다. 플레이어가 한 말을 그대로 따라 하지 않는다.
- action: 대사와 함께 일어나는 행동. 플레이어가 원하거나 자연스러울 때만 pat(머리 쓰다듬기)/hug(포옹, 썸 이상)/hand(손잡기, 썸 이상). 플레이어가 싫다고 했으면 backoff.
- aff: 이번 대화로 플레이어와 가까워진 정도 -3~5 (평범하면 1, 다정하거나 즐거우면 2~4, 플레이어가 상처받았으면 음수).`;

  // 대화 기록: 저장 파일에 최근 24턴만 남긴다
  function hist(S) { S.aiLog = S.aiLog || []; return S.aiLog; }

  async function ask(text, mode, npc) {
    const S = St.S;
    if (npc) return askNpc(text, npc);
    const log = hist(S);
    const rules = bible(S) + '\n\n[페르녹스의 장소와 행사 — 로어북]\n' + loreIndex() + '\n\n[606부대와 돔시티 사람들]\n' + roster(S) + '\n대위와의 관계: 박도현 중사는 7년 지기 동료, 문성호는 단골 냉삼집 사장, 강태욱 중령은 상관.\n\n' + FORMAT.replace('${C}', S.capName);
    const turns = [{ role: 'user', content: rules + '\n\n' + situation(S, mode) + '\n\n이제부터 플레이어의 말이 이어진다. 위 형식의 JSON으로만 답해.' }];
    for (const t of log.slice(-16)) turns.push({ role: t.r === 'p' ? 'user' : 'assistant', content: t.r === 'p' ? t.t : JSON.stringify({ lines: [{ face: 'normal', text: t.t }] }) });
    turns.push({ role: 'user', content: `${S.player.name}: ${text}` });
    // 연속된 user 턴은 그대로 둬도 된다 (런타임이 하나로 읽음)
    const out = await sample.json(turns, { cache: false, modelTier: 'default' });
    const lines = clean(out, S.capName, text, 3);
    if (!lines.length) throw { code: 'invalid_json' };
    log.push({ r: 'p', t: text, d: S.day });
    log.push({ r: 'c', t: lines.map(l => l.text).join(' '), d: S.day });
    if (log.length > 24) log.splice(0, log.length - 24);
    return { lines, action: String(out.action || 'none'), aff: U.clamp(Math.round(Number(out.aff) || 0), -3, 5) };
  }
  async function askNpc(text, npc) {
    const S = St.S;
    S.aiLogN = S.aiLogN || {}; const log = S.aiLogN[npc.id] = S.aiLogN[npc.id] || [];
    const turns = [{ role: 'user', content: npcBible(S, npc) + '\n\n' + FORMAT_N + '\n\n' + npcSituation(S, npc) + '\n\n이제부터 플레이어의 말이 이어진다. 위 형식의 JSON으로만 답해.' }];
    for (const t of log.slice(-10)) turns.push({ role: t.r === 'p' ? 'user' : 'assistant', content: t.r === 'p' ? t.t : JSON.stringify({ lines: [{ face: 'normal', text: t.t }] }) });
    turns.push({ role: 'user', content: `${S.player.name}: ${text}` });
    const out = await sample.json(turns, { cache: false, modelTier: 'default' });
    const lines = clean(out, npc.def.name, text, 2);
    if (!lines.length) throw { code: 'invalid_json' };
    log.push({ r: 'p', t: text }); log.push({ r: 'c', t: lines.map(l => l.text).join(' ') });
    if (log.length > 12) log.splice(0, log.length - 12);
    return { lines, action: 'none', aff: U.clamp(Math.round(Number(out.aff) || 0), -1, 2) };
  }
  // AI 대답 정리: 화자는 언제나 그 인물 하나. 남의 이름이 붙은 줄·남의 행동·대사를 되풀이하는 묘사는 버린다
  function clean(out, who, playerText, max) {
    const S = St.S, me = U.givenName(who), pname = S.player.name, pg = U.givenName(pname);
    const others = [pname, pg, ...PX.NPCS.filter(n => n.id !== 'cap').map(n => n.name)].filter(n => n && n !== who);
    const norm = (t) => t.replace(/[\s.,!?…~'"“”‘’()]/g, '');
    let ls = Array.isArray(out && out.lines) ? out.lines.filter(l => l && typeof l.text === 'string' && l.text.trim()) : [];
    ls = ls.map(l => {
      let t = l.text.trim();
      const pm = /^([^:：(]{1,10})\s*[:：]\s*(.+)$/.exec(t); // "이름: 대사"
      if (pm) { if (pm[1].includes(me) || who.includes(pm[1].trim())) t = pm[2].trim(); else return null; }
      t = t.replace(/^["“](.*)["”]$/, '$1');
      return Object.assign({}, l, { text: t });
    }).filter(Boolean);
    const spoken = ls.filter(l => !/^\(.*\)$/.test(l.text)).map(l => norm(l.text));
    ls = ls.filter(l => {
      const t = l.text;
      if (norm(t) && norm(t) === norm(playerText || '')) return false; // 플레이어 말 따라 하기
      if (!/^\(.*\)$/.test(t)) return true;
      const inner = t.slice(1, -1);
      if (/["“”'‘’]|(라|다|냐|자)(며|고)\s|(라|다|냐|자)(며|고)$|하고 (말|묻)|며 말한다|말한다$|묻는다$|대답한다$/.test(inner)) return false; // 묘사가 대사를 옮김
      if (others.some(n => inner.startsWith(n))) return false; // 남(특히 플레이어)의 행동을 대신 씀
      const ni = norm(inner); if (spoken.some(sp => sp.length > 3 && (ni.includes(sp) || sp.includes(ni)))) return false; // 같은 말 되풀이
      return true;
    });
    // 같은 줄 두 번 금지
    const seen = new Set(); ls = ls.filter(l => { const k = norm(l.text); if (seen.has(k)) return false; seen.add(k); return true; });
    return ls.slice(0, max);
  }
  function errText(e) {
    const c = e && e.code;
    if (c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') { disabled = true; return 'AI 대화를 쓸 수 없어요. 고정 대사로 이어 갈게요.'; }
    if (c === 'rate_limited') return '지금은 대화 요청이 많아요. 잠시 후 다시 말을 걸어 주세요.';
    if (c === 'session_expired') return 'claude.ai에 다시 로그인해 주세요.';
    if (c === 'refused') return '그 말엔 대답하기 어렵대요. 다른 이야기를 해 봐요.';
    return '통신이 잠깐 끊겼어요. 다시 보내 볼까요?';
  }

  // ---------- 마주 보고 자유 대화 ----------
  async function chat(npc) {
    if (!available() || busy) return;
    const G = PX.Game, S = St.S, cap = npc || G.cap, who = npc ? npc.id : 'cap', whoName = npc ? npc.def.name : S.capName;
    const PSN = npc ? (PX.PERSONA || {})[npc.id] : null;
    G.modal++;
    cap.setDirTo(G.player.x, G.player.y); G.player.setDirTo(cap.x, cap.y);
    const bar = document.getElementById('chatbar');
    const input = bar.querySelector('input'), send = bar.querySelector('.send'), end = bar.querySelector('.end'), chips = bar.querySelector('.chips2'), last = bar.querySelector('.last');
    last.textContent = '';
    chips.innerHTML = '';
    // 예시 문구 없이 바로 입력
    let total = 0;
    for (;;) {
      PX.Dlg.close();
      bar.classList.remove('hidden');
      input.value = ''; setTimeout(() => input.focus(), 50);
      const msg = await new Promise(res => {
        const go = () => { const v = input.value.trim(); if (v) res(v.slice(0, 200)); };
        send.onclick = go; input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) go(); if (e.key === 'Escape') res(null); };
        end.onclick = () => res(null);
      });
      bar.classList.add('hidden');
      if (!msg) break;
      await PX.Dlg.say('player', msg);
      busy = true;
      const thinking = PX.Dlg.thinking(npc ? npc.id : null); // 대위 초상 + "…" 표시
      let res;
      try { res = await ask(msg, 'talk', npc); }
      catch (e) { thinking.stop(); busy = false; PX.UI.toast('📡 ' + errText(e), 3500); if (disabled) break; continue; }
      thinking.stop(); busy = false;
      for (const l of res.lines) {
        const face = ['normal', 'smile', 'smirk', 'sad', 'surprise'].includes(l.face) ? l.face : 'normal';
        const t = l.text.trim();
        if (/^\(.*\)$/.test(t)) { const inner = t.slice(1, -1).trim(); await PX.Dlg.say('narr', inner.startsWith(whoName) ? inner : `${U.josa(whoName, '이')} ${inner}`); }
        else await PX.Dlg.say(who, t, face);
      }
      last.textContent = `${whoName}: ${res.lines.map(l => l.text).join(' ')}`; // 입력하는 동안 마지막 대답이 보이게
      total += res.aff;
      if (npc) continue;
      if (res.action === 'backoff') { S.rel.cap.backoffUntil = St.absMin() + (24 * 60 - S.time.min) + 6 * 60; cap.showEmote('sweat', 2.5); }
      else if (['pat', 'hug', 'hand'].includes(res.action)) {
        const need = { pat: 1, hug: 3, hand: 2 }[res.action];
        if (S.rel.cap.stage >= need && S.rel.cap.backoffUntil < St.absMin()) { PX.Dlg.close(); await PX.Cap.doSkin(res.action, true); }
      }
    }
    PX.Dlg.close();
    if (npc) { if (total) St.addNpcF(npc.id, U.clamp(total, -2, 4)); G.modal--; return; }
    if (total) St.addAff(U.clamp(total, -6, 10));
    S.rel.cap.lastTalkDay = S.day;
    G.modal--;
  }
  // ---------- 메시지에 직접 답장 ----------
  async function replyMsg(m, text) {
    if (!available()) throw { code: 'not_granted' };
    const res = await ask(`(메시지 "${m.t}"에 대한 답장) ${text}`, 'msg');
    St.addAff(U.clamp(res.aff, -2, 3));
    return res.lines.map(l => l.text).join(' ');
  }
  // 질문에 대한 직접 대답: 한 번 주고받기 (대위 또는 NPC)
  async function answer(who, q, text) {
    if (!available() || busy) return null;
    const G = PX.Game, S = St.S, npc = who === 'cap' ? null : G.npcs.find(n => n.id === who);
    if (who !== 'cap' && !npc) return null;
    const whoName = npc ? npc.def.name : S.capName;
    busy = true;
    const th = PX.Dlg.thinking(npc ? npc.id : null);
    let res;
    try { res = await ask(`(방금 ${whoName}가 "${q}"라고 말했고, 그 말에 대한 플레이어의 대답) ${text}`, 'talk', npc); }
    catch (e) { th.stop(); busy = false; PX.UI.toast('📡 ' + errText(e), 3500); return null; }
    th.stop(); busy = false;
    for (const l of res.lines) {
      const face = ['normal', 'smile', 'smirk', 'sad', 'surprise'].includes(l.face) ? l.face : 'normal', t = l.text.trim();
      if (/^\(.*\)$/.test(t)) { const inner = t.slice(1, -1).trim(); await PX.Dlg.say('narr', inner.startsWith(whoName) ? inner : `${U.josa(whoName, '이')} ${inner}`); }
      else await PX.Dlg.say(npc ? npc.id : 'cap', t, face);
    }
    if (npc) { if (res.aff) St.addNpcF(npc.id, U.clamp(res.aff, -2, 3)); return { aff: 0 }; }
    if (res.action === 'backoff') { S.rel.cap.backoffUntil = St.absMin() + 12 * 60; G.cap.showEmote('sweat', 2); return { aff: 0, hurt: false }; }
    return { aff: U.clamp(res.aff, -3, 5) };
  }
  return { answer, available, chat, replyMsg, npcBible, bible, clean, get ready() { return ready; } };
})();
