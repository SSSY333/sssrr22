// 방에서 대위와 같이 하기: 실제로 움직이며 한다 (부엌에 나란히 서서 요리 · 식탁에 마주 앉기 · 음악 틀고 춤 · 소파에서 영화 …)
// + 같이 나가기 · 대위가 방에서 혼자 둘러보거나 먼저 뭘 하자고 하기
'use strict';
PX.Home = (() => {
  const U = PX.U, St = PX.St, W = PX.W;
  const G = () => PX.Game;
  const ROOMS = ['q_player', 'apt_player', 'q_captain'];
  const st = () => St.S.rel.cap.stage, lov = () => st() >= 4;
  const capRoom = () => G().mapId === 'q_captain';
  const useOf = (o) => o.use || (o.f && o.f.use);
  const objs = () => W.maps[G().mapId].objs;
  const findUse = (u) => objs().find(o => useOf(o) === u);
  const center = (o) => ({ x: o.x + (o.fw || 1) / 2, y: o.y + (o.fd || 1) / 2 });

  // 지금 방에 같이 있나
  function here() {
    const g = G();
    return ROOMS.includes(g.mapId) && g.cap && g.cap.map === g.mapId && !g.cap.hidden && ['visit', 'stay', 'follow'].includes(PX.Cap.mode) && !g.sleeping;
  }

  // ---------- 움직임 ----------
  function tilesAround(o) {
    const m = W.maps[G().mapId], out = [], fw = o.fw || 1, fd = o.fd || 1;
    for (let x = o.x - 1; x <= o.x + fw; x++) for (let y = o.y - 1; y <= o.y + fd; y++) {
      const inX = x >= o.x && x < o.x + fw, inY = y >= o.y && y < o.y + fd;
      if (inX && inY) continue; if (!inX && !inY) continue; // 대각선 모서리는 빼고
      if (W.walkable(m, x, y)) out.push([x, y]);
    }
    return out;
  }
  function walk(a, x, y, ms = 5000) {
    return new Promise(res => {
      const m = W.maps[G().mapId]; let done = false;
      const fin = () => { if (done) return; done = true; res(); };
      if (Math.hypot(a.x - (x + 0.5), a.y - (y + 0.5)) < 0.3) { a.leaveSeat(); fin(); return; }
      if (!a.goTo(m, x, y, fin)) { a.leaveSeat(); a.x = x + 0.5; a.y = y + 0.5; fin(); return; }
      setTimeout(() => { if (!done) { a.stop && a.stop(); a.x = x + 0.5; a.y = y + 0.5; fin(); } }, ms);
    });
  }
  // 둘이 가구 앞에 나란히 서기
  async function standAt(o) {
    const g = G(), c = g.cap, p = g.player, t = tilesAround(o);
    if (!t.length) return false;
    t.sort((a, b) => U.dist(a[0], a[1], c.x, c.y) - U.dist(b[0], b[1], c.x, c.y));
    const ct = t[0], rest = t.slice(1).sort((a, b) => U.dist(a[0], a[1], ct[0], ct[1]) - U.dist(b[0], b[1], ct[0], ct[1]));
    const pt = rest[0] || ct;
    await Promise.all([walk(c, ct[0], ct[1]), pt === ct ? Promise.resolve() : walk(p, pt[0], pt[1])]);
    const cc = center(o); c.setDirTo(cc.x, cc.y); p.setDirTo(cc.x, cc.y);
    return true;
  }
  // 둘이 의자 두 개에 앉기 (식탁 · 소파)
  function seatsNear(o, r = 2.3) {
    const cc = center(o), list = [];
    for (const x of objs()) if (x.seats && useOf(x) !== 'bed') for (const s of x.seats) if (!s.by || s.by === G().player || s.by === G().cap) { const d = U.dist(s.x, s.y, cc.x, cc.y); if (x === o || d < r) list.push(s); }
    return list;
  }
  async function sitOn(a, s) {
    if (a.seat === s) return;
    const m = W.maps[G().mapId], acc = W.accessTile(m, s.obj);
    if (acc) await walk(a, acc.x, acc.y);
    if (!s.by || s.by === a) a.sitOn(s);
  }
  async function sitPair(o) {
    const g = G(), s = seatsNear(o);
    if (s.length < 2) return false;
    // 식탁은 마주 보게: 서로 가장 먼 두 자리 · 소파는 나란히
    let a = s[0], b = s[1];
    if (useOf(o) !== 'sit') { let best = -1; for (const x of s) for (const y of s) if (x !== y && U.dist(x.x, x.y, y.x, y.y) > best) { best = U.dist(x.x, x.y, y.x, y.y); a = x; b = y; } }
    if (U.dist(b.x, b.y, g.player.x, g.player.y) > U.dist(a.x, a.y, g.player.x, g.player.y)) [a, b] = [b, a];
    await Promise.all([sitOn(g.player, b), sitOn(g.cap, a)]);
    g.cap.setDirTo(g.player.x, g.player.y);
    return true;
  }
  const pose = (who, p, sec) => (who === 'c' ? G().cap : G().player).doPose(p, sec);

  // 장면: 걷는 동안에도 화면이 멈춘 것으로 보지 않게 (cutscene)
  let busy = false;
  async function scene(fn) {
    const g = G();
    if (busy || g.modal) return;
    busy = true; g.modal++; g.cutscene = true;
    if (PX.Mind && PX.Mind.contact() !== 'NONE' && PX.Mind.setContact) PX.Mind.setContact('NONE');
    try { await fn(); } catch (e) { console.error(e); }
    finally { g.cutscene = false; PX.Dlg.close(); g.modal--; busy = false; }
  }
  const talk = async (bundles) => { const g = G(); g.cutscene = false; await PX.Dlg.runLines(PX.Dlg.capPick(bundles), { reply: true }); PX.Dlg.close(); g.cutscene = true; };
  const two = (pre, love) => talk(lov() && love ? love : pre);
  function reward(id, aff, mem) {
    const S = St.S, k = 'ha_' + id + '_' + S.day;
    if (!S.done[k]) { S.done[k] = 1; St.addAff(aff); }
    if (mem && !S.done['ham_' + id]) { S.done['ham_' + id] = 1; G().memory(mem[0], mem[1], true); }
    G().cap.showEmote('heart', 1.4);
    if (PX.Mind) PX.Mind.noteMeet && PX.Mind.noteMeet();
  }
  const eatUp = (n) => { const S = St.S; S.hunger = Math.min(100, (S.hunger || 50) + n); S.energy = Math.min(100, S.energy + Math.round(n / 2)); };

  // ---------- 같이 하기 ----------
  const ACTS = [];
  const add = (o) => ACTS.push(o);

  add({ id: 'dance', t: '🎵 음악 틀고 같이 춤추기', sub: '신나는 곡 · 느린 곡', s: 1, run: () => scene(async () => {
    const i = await PX.Dlg.choose([{ t: '🎶 신나는 곡' }, { t: '🎻 느린 곡' }]);
    const slow = i === 1, song = PX.Audio.melody(slow ? 'slow' : 'up');
    PX.UI.toast(slow ? '🎻 느린 곡을 틀었다' : '🎶 신나는 곡을 틀었다', 1800);
    const steps = slow ? (st() >= 3 ? [{ k: 'hand', d: 3 }, { k: 'waist', d: 4 }, { k: 'hug', d: 5 }] : [{ k: 'hand', d: 4 }, { k: 'waist', d: 4 }])
      : (st() >= 3 ? [{ k: 'bounce', d: 3 }, { k: 'hand', d: 3 }, { k: 'spin', d: 2.5 }, { k: 'bounce', d: 3 }] : [{ k: 'bounce', d: 4 }, { k: 'hand', d: 3 }, { k: 'bounce', d: 3 }]);
    const L = slow
      ? (lov() ? [['N:느린 음악이 방을 채운다. 대위가 손을 내민다.', 'C*:…춤 못 추는 거 알지? 그래도.', 'N:허리에 큰 손이 닿는다. 둘이 천천히 흔들린다.', 'C~:이러고 있으니까 방이 좁은 게 좋다.'],
        ['N:대위가 이마를 내 정수리에 기댄다. 발은 거의 움직이지 않는다.', 'C*:이것도 춤이야. 우리끼리는.', 'P:{ob} 발 밟았어요.', 'C^:괜찮아. 계속 밟아도 돼.'],
        ['C:한 곡만 더. 아니, 이 곡 끝날 때까지 안 놓을 거야.', 'N:대위의 심장 소리가 음악보다 크게 들린다.', 'C~:…들려? 너 때문에 이래.']]
        : [['N:느린 음악. 대위가 어색하게 손을 내민다.', 'C;:…이렇게 하는 거 맞아? 손은 여기?', 'P:네, 맞아요. 천천히요.', 'C^:생각보다 괜찮네. 발만 안 밟으면.'],
          ['C:군대에서 배운 건 행진뿐이라.', 'N:대위가 박자를 세며 한 발씩 옮긴다. 하나, 둘. 하나, 둘.', 'C*:…웃지 말고. 너도 박자 세.']])
      : (lov() ? [['N:신나는 음악. 대위가 어깨를 들썩인다. 각 잡힌 들썩임이다.', 'C^:이게 내 최선이야. 놀리지 마.', 'P:{ob} 귀여워요.', 'C*:…한 번 더 말하면 들어서 돌린다.'],
        ['N:대위가 내 손을 잡고 빙글 돌린다. 방이 좁아서 소파에 무릎을 찧는다.', 'C;:…아. 괜찮아. 계속.', 'C^:다음엔 루비웨이 무대에서 하자. 거긴 넓어.'],
        ['C:이 노래 뭐야? 계속 귀에 남네.', 'N:둘이 아무렇게나 들썩인다. 박자도 안 맞는다.', 'C^:박자 안 맞는 게 우리 박자야.']]
        : [['N:신나는 음악. 대위가 팔짱을 끼고 서 있다가, 발끝으로 박자를 탄다.', 'C;:…나도 하라고? 알았어. 딱 한 소절만.', 'N:대위가 군가 박자로 들썩인다.', 'C^:…웃었지. 다 봤어.'],
          ['C:이런 거 수색팀 회식 때나 하는데.', 'P:대위님 회식 때 춤춰요?', 'C*:아니. 구경만 해. 오늘이 처음이야.']]);
    try { await PX.Dance.withLines(steps, PX.Dlg.capPick(L)); } finally { song.stop(); }
    St.advance(20); reward('dance', 3, ['방에서 춘 춤', '음악을 틀고 좁은 방에서 대위와 춤을 췄다. 대위는 박자를 끝까지 못 맞췄다.']);
  }) });

  add({ id: 'cook', t: '🍳 같이 요리하기', sub: '부엌에 나란히 · 다 하면 식탁에서', s: 1, when: () => !!findUse('kitchen'), run: () => scene(async () => {
    const k = findUse('kitchen'); await standAt(k);
    const i = await PX.Dlg.choose([{ t: '🍜 볶음면' }, { t: '🥘 찌개' }, { t: '🥞 팬케이크' }]);
    const dish = ['볶음면', '찌개', '팬케이크'][i];
    pose('c', 'work', 6); pose('p', 'work', 6);
    await two([
      ['C:재료 썰기는 내가. 칼은 자신 있어.', 'N:대위가 채소를 일정한 간격으로 썬다. 각이 살아 있다.', 'C*:간은 네가 봐. 나 맛 감각 없대, 다들.'],
      [`C:${dish}? 좋아. 내가 뭐 하면 돼?`, 'P:물 끓는지 봐 주세요.', 'N:대위가 냄비 앞에 서서 물을 노려본다.', 'C;:…아직 안 끓어. 보고 있으면 안 끓는다더니 진짜네.'],
      ['N:좁은 부엌. 대위가 몸을 웅크리고 선반을 피한다.', 'C:이 부엌은 나 같은 사람 생각 안 하고 만들었어.', 'P:{ob}가 큰 거예요.', 'C^:응. 그래서 높은 데 있는 건 내가 꺼내 줄게.']
    ], [
      ['N:좁은 부엌에서 자꾸 어깨가 부딪친다.', 'C*:좁아서 그래. 일부러 아니야.', 'P:세 번째예요.', 'C^:…네 번째는 일부러.'],
      ['N:대위가 뒤에서 팔을 둘러 같이 국자를 잡는다.', 'C*:이렇게 저어야 안 눌어. 수색팀 취사병한테 배웠어.', 'P:{ob} 이거 핑계죠?', 'C^:반은 핑계.'],
      [`N:${dish} 냄새가 방에 퍼진다. 대위가 한 입 맛보고 눈을 감는다.`, 'C:…맛있다. 네가 간 봐서 그래.', 'C*:매일 이렇게 해 먹자. 나 설거지 할게.']
    ]);
    pose('c', 'work', 4); St.advance(35);
    const tbl = objs().find(o => o.fid && /^table/.test(o.fid)) || findUse('sit');
    if (tbl && await sitPair(tbl)) {
      pose('c', 'eat', 8); pose('p', 'eat', 8);
      await two([[`N:식탁에 ${dish} 두 그릇. 대위가 먼저 내 그릇에 제일 큰 걸 덜어 준다.`, 'C:먼저 먹어. 만든 사람이 먼저야.', 'C^:…둘 다 만들었지. 그럼 같이.'],
        ['C:군대 밥이랑 비교도 안 된다.', 'N:대위가 그릇을 싹 비운다. 국물까지.', 'C*:잘 먹었습니다. 진짜로.']],
        [['N:마주 앉아 먹는다. 대위가 자꾸 내 얼굴을 본다.', 'C*:먹는 거 보는 게 좋아서. 신경 쓰지 말고 먹어.'],
          ['C:아, 해 봐.', 'N:대위가 숟가락을 내민다. 받아먹자 만족스럽게 웃는다.', 'C^:이게 제일 맛있는 한 입이다.']]);
      eatUp(30); St.advance(25);
    } else eatUp(20);
    reward('cook', 3, ['같이 만든 밥', `방 부엌에서 대위와 ${dish}을(를) 만들어 식탁에 마주 앉아 먹었다.`]);
  }) });

  add({ id: 'tea', t: '☕ 식탁에 마주 앉아 차 마시기', sub: '수다 떨기', s: 0, when: () => !!objs().find(o => o.fid && /^table/.test(o.fid)), run: () => scene(async () => {
    const tbl = objs().find(o => o.fid && /^table/.test(o.fid));
    if (!await sitPair(tbl)) { PX.UI.toast('식탁 의자가 부족해요'); return; }
    pose('c', 'eat', 4);
    await two([
      ['N:김이 오르는 컵 두 개. 대위가 컵을 두 손으로 감싼다. 컵이 장난감처럼 작아 보인다.', 'C:…뜨겁다. 나 뜨거운 거 약한 거 알지.', 'C^:근데 네가 타 준 거라 마신다.'],
      ['C:이렇게 마주 앉아 있으니까 면담하는 것 같다.', 'P:그럼 면담 시작할게요. 오늘 하루 어땠어요?', 'C*:…좋았어. 마지막 한 시간이 특히.'],
      ['N:식탁 위에 둘의 컵이 나란히 놓인다. 대위 컵이 조금 더 내 쪽에 있다.', 'C:여기 앉으니까 네 방 다 보인다. 아늑하네.']
    ], [
      ['N:식탁 아래서 대위의 발이 내 발을 톡 건드린다.', 'C*:…실수. 아니, 실수 아니야.'],
      ['C:차 다 마시면 뭐 할까. 아무것도 안 해도 좋고.', 'P:{ob} 정해요.', 'C^:그럼 한 잔 더. 너랑 더 앉아 있게.'],
      ['N:대위가 컵을 내려놓고 식탁 위로 손을 내민다. 손바닥이 위로.', 'C~:…그냥. 잡고 마시자.']
    ]);
    St.advance(20); reward('tea', 2);
  }) });

  add({ id: 'movie', t: '📺 소파에서 같이 영화 보기', sub: '장르 고르기', s: 1, when: () => !!findUse('tv') && !!objs().find(o => o.fid && /^sofa/.test(o.fid)), run: () => scene(async () => {
    const sofa = objs().find(o => o.fid && /^sofa/.test(o.fid));
    if (!await sitPair(sofa)) { PX.UI.toast('소파가 비어 있지 않아요'); return; }
    const tv = findUse('tv'); if (tv) { const c = center(tv); G().cap.setDirTo(c.x, c.y); G().player.setDirTo(c.x, c.y); }
    const i = await PX.Dlg.choose([{ t: '💥 액션' }, { t: '💗 로맨스' }, { t: '👻 공포' }]);
    const L = [
      [['N:화면 속 주인공이 총을 쏜다. 대위가 미간을 찌푸린다.', 'C:저렇게 쏘면 다 빗나가. 자세가 틀렸어.', 'P:영화잖아요.', 'C;:…알아. 근데 신경 쓰여.'], ['N:폭발 장면. 대위가 무심하게 팝콘을 먹는다.', 'C:저 정도면 소대 하나 날아가. 주인공은 멀쩡하네.', 'C^:영화는 이래서 좋아. 다 살아서.']],
      [['N:화면 속 두 사람이 빗속에서 고백한다. 대위가 조용해진다.', 'C:…나는 저렇게 말 잘 못하는데.', 'P:{ob}도 잘했어요.', 'C*:…그래? 다행이다.'], ['N:키스 장면에서 대위가 슬쩍 나를 본다.', 'C;:…왜. 나 영화 보고 있었어. 진짜로.']],
      [['N:불 꺼진 방. 화면에서 문이 삐걱 열린다. 내가 대위 팔을 꽉 잡는다.', 'C^:무서우면 눈 감아. 끝나면 말해 줄게.'], ['N:갑자기 소리가 터진다. 둘 다 움찔한다. …대위도.', 'C;:…못 본 걸로 해.', 'C*:괜찮아. 내가 옆에 있잖아.']]
    ][i];
    const Ll = [
      [['N:대위가 팔을 소파 등받이에 걸친다. 자연스럽게 어깨가 닿는다.', 'C:저 주인공보다 내가 더 잘 쏴.', 'C*:…지금 자랑하는 거 맞아.']],
      [['N:어느새 대위 어깨에 머리를 기대고 있다. 대위가 움직이지 않으려고 숨까지 조심한다.', 'C~:…우리 얘기 같다, 저거.'], ['C:저 사람들보다 우리가 더 잘 어울려.', 'P:{ob} 그거 진심이에요?', 'C^:응. 영화보다 너가 더 좋아.']],
      [['N:무서운 장면마다 대위 품으로 파고든다. 대위가 담요를 끌어와 둘을 덮는다.', 'C*:…이 영화 좋다. 다음에도 공포로 보자.']]
    ][i];
    if (lov() && PX.Mind && PX.Mind.setContact) PX.Mind.setContact('SIT_LEAN');
    await talk(lov() ? Ll.concat(L) : L);
    St.advance(90); reward('movie', 3, ['소파 영화', '소파에 나란히 앉아 대위와 영화를 봤다.']);
  }) });

  add({ id: 'cards', t: '🃏 식탁에서 카드 게임', sub: '진 사람이 벌칙', s: 0, when: () => !!objs().find(o => o.fid && /^table/.test(o.fid)), run: () => scene(async () => {
    const tbl = objs().find(o => o.fid && /^table/.test(o.fid));
    if (!await sitPair(tbl)) { PX.UI.toast('식탁 의자가 부족해요'); return; }
    await talk([['N:대위가 카드를 섞는다. 손이 커서 카드가 반쯤 숨는다.', 'C:한 판. 진 사람이 벌칙.', 'C*:세 장 중에 하나 골라. 제일 높은 거 뽑으면 이겨.']]);
    const i = await PX.Dlg.choose([{ t: '🂠 왼쪽 카드' }, { t: '🂠 가운데 카드' }, { t: '🂠 오른쪽 카드' }]);
    const win = Math.random() < 0.55 || i === (St.S.day % 3);
    await PX.Dlg.say('player', PX.Dlg.capTone(['이거요.', '가운데요.', '오른쪽이요.'][i]));
    if (win) await two([['N:뒤집은 카드는 에이스. 대위가 이마를 짚는다.', 'C;:…졌다. 벌칙 뭐야.', 'P:팔굽혀펴기 열 개요.', 'N:대위가 그 자리에서 열 개를 한다. 숨도 안 찬다.', 'C^:이게 벌칙이야? 하나 더 줘.']],
      [['N:에이스. 대위가 순순히 패배를 인정한다.', 'C:졌다. 벌칙 줘.', 'P:{ob}가 먼저 뽀뽀하기요.', 'N:대위가 볼에 쪽 하고 짧게 입을 맞춘다.', 'C*:…이건 벌칙이 아닌데. 또 질래.']]);
    else await two([['N:뒤집은 카드는 3. 대위가 킹을 내민다.', 'C^:내가 이겼다. 벌칙은… 내일 아침 같이 먹기.', 'C*:벌칙 맞아. 일찍 일어나야 하니까.']],
      [['N:3. 대위가 킹을 보여 주며 웃는다.', 'C*:벌칙. 오늘은 내가 하자는 거 다 하기.', 'P:뭐 할 건데요?', 'C^:그냥 내 옆에 있기. 쉽지?']]);
    St.advance(25); reward('cards', 2);
  }) });

  add({ id: 'tidy', t: '🧹 같이 방 정리하기', sub: '내 방', s: 1, when: () => !capRoom(), run: () => scene(async () => {
    const spots = ['wardrobe', 'terminal', 'fridge'].map(findUse).filter(Boolean);
    for (const o of spots.slice(0, 2)) { await standAt(o); pose('c', 'carry', 2); pose('p', 'work', 2); await new Promise(r => setTimeout(r, 900)); }
    await two([['C:군대식으로 개 줄까? 각 잡아서.', 'N:대위가 옷을 칼같이 개서 쌓는다. 옷장이 갑자기 훈련소 같다.', 'C^:어때. 사열 받아도 되겠지.'],
      ['N:대위가 선반 위 먼지를 손가락으로 훑는다.', 'C;:…청소 검열이면 너 영창이다.', 'P:그래서 같이 하자는 거잖아요.', 'C*:응. 같이 하면 금방이야.']],
      [['N:대위가 높은 선반 정리를 맡는다. 까치발도 안 든다.', 'C*:이런 거 할 때 나 쓸모 있지?', 'P:{ob}는 다 쓸모 있어요.', 'C^:…그 말 오래 기억할게.'],
        ['N:옷장 정리 중, 대위가 내 옷 하나를 들고 멈춘다.', 'C~:이거 입은 날 기억나. 처음 손잡은 날.']]);
    St.advance(30); reward('tidy', 2);
  }) });

  add({ id: 'gym', t: '🏋️ 같이 운동하기', sub: '대위 막사 운동 기구', s: 0, when: () => capRoom() && !!findUse('workout'), run: () => scene(async () => {
    const o = findUse('workout'); await standAt(o);
    pose('c', 'workout', 6);
    await two([['C:보조해 줄게. 무리하지 말고.', 'N:대위가 바벨 아래 손을 받쳐 준다. 손이 거의 닿을 듯 말 듯.', 'C^:좋아. 하나만 더. 할 수 있어.'],
      ['N:대위가 샌드백을 친다. 묵직한 소리가 막사를 울린다.', 'C:너도 쳐 봐. 손목 이렇게.', 'C*:…좋은데? 나 맞으면 아프겠다.']],
      [['C:플랭크 버티기. 진 사람 소원 들어주기.', 'N:대위가 옆에서 같이 버틴다. 자꾸 옆을 보며 웃는다.', 'C^:…졌다. 너 보느라. 소원 말해.'],
        ['N:대위가 팔굽혀펴기를 하며 등에 타 보라고 한다.', 'C*:올라와. 너 정도는 무게도 아니야.', 'N:등 위에서 오르락내리락. 대위가 숫자를 세다 웃음이 터진다.']]);
    St.S.energy = Math.max(0, St.S.energy - 8); St.advance(30); reward('gym', 2);
  }) });

  // ---------- 같이 나가기 ----------
  const OUT = [
    { to: 'mess', t: '🍚 식당에 밥 먹으러', say: '식당 가서 같이 밥 먹어요.', mil: true, open: [[6 * 60 + 30, 9 * 60], [11 * 60, 14 * 60], [17 * 60, 20 * 60]] },
    { to: 'base', t: '🌿 부대 한 바퀴 산책', say: '부대 한 바퀴 걸어요.', mil: true },
    { to: 'plaza', t: '🏙️ 돔시티 중앙광장 구경', say: '돔시티 광장 구경 가요.' },
    { to: 'noodle', t: '🍜 은하 국수당에서 한 그릇', say: '국수당 가서 국수 먹어요.' },
    { to: 'cafe', t: '☕ 카페 가기', say: '카페 가요. 시원한 거 마시고 싶어요.' },
    { to: 'lake', t: '🌊 호숫가 걷기', say: '호숫가 걸으러 가요.' },
  ];
  const outerOf = (id) => { const d = PX.MAPS[id]; return !d ? null : d.kind === 'out' ? id : outerOf(d.parent); };
  async function goOut(dest) {
    const g = G(), S = St.S;
    if (PX.Cap.onDuty()) { g.bubble(g.cap, '나 곧 근무야. 다음에 같이 나가자.', 2.6); return; }
    S.cap.hosting = false; S.cap.stay = false; S.cap.visitShort = 0; S.cap.homeLeft = 0;
    if (g.cap.seat) g.cap.leaveSeat(); if (g.player.seat) g.player.leaveSeat();
    PX.Cap.startFollow();
    if (PX.Mind) PX.Mind.noteMeet && PX.Mind.noteMeet();
    if (!dest) { g.bubble(g.cap, U.pickFresh('outWalk', ['좋아. 앞장서. 따라갈게.', '나가자. 바람 좀 쐬자.', '신발 신어. 나 문 앞에서 기다릴게.']), 2.6); return; }
    const near = outerOf(dest.to) === outerOf(g.mapId);
    await PX.Act.travel(dest.to, near ? (dest.to === 'base' ? 2 : 5) : 30);
  }
  async function outMenu(fromCap) {
    const g = G(), S = St.S, t = S.time.min, home = PX.MAPS[g.mapId];
    const mil = outerOf(g.mapId) === 'base';
    const late = t >= 22 * 60 || t < 6 * 60;
    const items = [{ t: '🚶 그냥 같이 나가기', sub: '대위가 따라 나와요 · 가고 싶은 곳으로 걸어가요', k: null }];
    for (const d of OUT) {
      if (!PX.MAPS[d.to] || d.to === g.mapId) continue;
      if (d.mil && !mil) continue;
      const closed = d.open && !d.open.some(([a, b]) => t >= a && t < b);
      items.push({ t: d.t, k: d, off: late || closed, offMsg: late ? '너무 늦은 시간이에요' : '지금은 식사 시간이 아니에요', sub: outerOf(d.to) === outerOf(g.mapId) ? '가까워요' : '셔틀 30분' });
    }
    const it = await PX.UI.menu(`🚪 ${S.capName}와(과) 같이 나가기`.replace('와(과)', U.hasBatchim(S.capName) ? '과' : '와'), items);
    if (!it) return;
    if (!fromCap) { g.modal++;
    try {
      await PX.Dlg.say('player', PX.Dlg.capTone(it.k ? it.k.say : U.pick(['같이 나가요.', '바람 쐬러 나갈래요?'])));
      await PX.Dlg.runLines(PX.Dlg.capPick([['C^:좋아. 너랑이면 어디든.'], ['C:나가자. 겉옷 챙겨.'], ['C*:그 말 기다렸어. 가자.']]));
    } finally { PX.Dlg.close(); g.modal--; } }
    await goOut(it.k);
  }

  // ---------- 메뉴 ----------
  function list() {
    if (!here()) return [];
    const S = St.S;
    return ACTS.filter(a => st() >= (a.s || 0) && (!a.when || a.when())).map(a => ({ t: a.t, sub: (a.sub || '') + (S.done['ha_' + a.id + '_' + S.day] ? ' · 오늘 함' : ''), run: a.run, id: a.id }));
  }
  async function menu() {
    if (!here() || G().modal) return;
    const items = list().map(a => ({ t: a.t, sub: a.sub, k: a }));
    const t = St.S.time.min;
    items.push({ t: '🚪 같이 나가기', sub: '식당 · 산책 · 돔시티 …', k: 'out', off: t >= 23 * 60 || t < 6 * 60, offMsg: '너무 늦은 시간이에요' });
    const it = await PX.UI.menu(capRoom() ? '🏠 막사에서 같이 하기' : '🏠 방에서 같이 하기', items);
    if (!it) return;
    if (it.k === 'out') return outMenu();
    G().cap.setDirTo(G().player.x, G().player.y);
    return it.k.run();
  }

  // ---------- 대위가 먼저: 방을 둘러보거나 뭘 하자고 한다 ----------
  const LOOK = {
    fridge: ['냉장고 열어 봐도 돼? …물이랑 향열매밖에 없네. 장 보러 가야겠다.', '냉장고에 내가 좋아하는 거 있다. 나 올 줄 알았어?', '시원하다. 이 앞에 계속 서 있고 싶다.'],
    terminal: ['단말 배경 화면 뭐야? …아, 나 보면 안 되는 거야?', '일 많이 밀렸어? 화면에 메일이 산더미다.'],
    album: ['이 사진 언제 찍었어? 너 웃는 거 좋다.', '사진 늘었네. 내 사진은 몇 장이야? 세어 봐야겠다.'],
    wardrobe: ['옷장 정리 잘 돼 있네. 내 군복보다 각이 살아 있어.', '이 옷 예쁘다. 다음에 입고 나와.'],
    kitchen: ['부엌 작다. 나 서면 꽉 차겠다.', '뭐 해 먹을까. 내가 할 수 있는 건 라면이랑 계란.'],
    cooler: ['냉각기 온도 좀 내려도 돼? …아, 너 춥지. 그냥 둘게.'],
    workout: ['이거 오늘 아직 못 들었다. 이따 들어야지.', '너도 해 볼래? 가벼운 걸로.'],
    tv: ['요즘 재밌는 거 뭐 해? 같이 볼래?'],
    inspect: ['이 광물 결 봐. 예쁘지. 다음에 하나 깎아 줄게.'],
  };
  const ASK = [
    { id: 'dance', l: [['C:조용하다. 음악 틀까?'], ['C*:…심심해. 음악 틀고 아무렇게나 춤추자.']] },
    { id: 'cook', l: [['C:배고프지 않아? 같이 뭐 만들어 먹자.'], ['C:부엌 써도 돼? 같이 하자. 나 칼질은 잘해.']], when: () => { const t = St.S.time.min; return (t >= 11 * 60 && t < 14 * 60) || (t >= 17 * 60 && t < 21 * 60); } },
    { id: 'movie', l: [['C:영화 한 편 볼래? 소파에서.'], ['C*:소파에 같이 앉아서 뭐 보자. 아무거나.']], when: () => St.S.time.min >= 15 * 60 },
    { id: 'tea', l: [['C:차 한 잔 할래? 식탁에 앉아서.']] },
    { id: 'cards', l: [['C:카드 있어? 한 판 하자. 진 사람이 벌칙.']] },
    { id: 'gym', l: [['C:운동 같이 할래? 가볍게.']] },
    { id: 'out', l: [['C:날씨 괜찮던데. 잠깐 나갈래?'], ['C:방에만 있으니까 좀 답답하다. 나가서 걷자.'], ['C*:나가서 맛있는 거 먹을래? 내가 살게.']], when: () => { const t = St.S.time.min; return t >= 9 * 60 && t < 20 * 60 + 30 && !PX.Cap.onDuty(); } },
  ];
  let nextAt = 0, wanderT = 0;
  function tick(dt) {
    const g = G(), S = St.S, now = St.absMin();
    if (!here() || g.modal || g.transition || busy || PX.Decor.active) { if (!here()) nextAt = 0; return; }
    if (PX.Cap.mode === 'stay' && (S.time.min >= 21 * 60 || S.time.min < 7 * 60)) return; // 자러 온 밤엔 조용히
    if (!nextAt) { nextAt = now + 25 + Math.floor(Math.random() * 15); return; }
    if (g.cap.wander) { wanderT -= dt; if (wanderT <= 0) backToPlayer(); return; }
    if (now < nextAt || g.player.moving || g.cap.path.length) return;
    nextAt = now + 25 + Math.floor(Math.random() * 25);
    const asks = ASK.filter(a => (a.id === 'out' || list().some(x => x.id === a.id)) && (!a.when || a.when()) && !S.done['ha_' + a.id + '_' + S.day]);
    if (asks.length && Math.random() < 0.5) return propose(U.pick(asks));
    wander();
  }
  function wander() {
    const g = G(), c = g.cap;
    const cand = objs().filter(o => LOOK[useOf(o)] && tilesAround(o).length && U.dist(center(o).x, center(o).y, c.x, c.y) > 1.5);
    if (!cand.length) return;
    const o = U.pick(cand), t = tilesAround(o)[0], m = W.maps[g.mapId];
    c.wander = true; wanderT = 9;
    if (c.seat) c.leaveSeat();
    if (!c.goTo(m, t[0], t[1], () => { const cc = center(o); c.setDirTo(cc.x, cc.y); c.doPose(useOf(o) === 'workout' ? 'workout' : 'bend', 2.5); setTimeout(() => { if (c.wander) g.bubble(c, U.fmt(U.pickFresh('hlook_' + useOf(o), LOOK[useOf(o)]), PX.Dlg.ctx()), 3); }, 600); })) { c.wander = false; }
  }
  function backToPlayer() {
    const g = G(), c = g.cap, p = g.player, m = W.maps[g.mapId];
    c.wander = false;
    if (p.seat) { // 내가 앉아 있으면 옆자리로
      const s = seatsNear(p.seat.obj, 2.4).filter(s => !s.by).sort((a, b) => U.dist(a.x, a.y, p.x, p.y) - U.dist(b.x, b.y, p.x, p.y))[0];
      if (s) { const acc = W.accessTile(m, s.obj); if (acc && c.goTo(m, acc.x, acc.y, () => { if (!s.by) c.sitOn(s); })) return; }
    }
    const t = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => [Math.floor(p.x) + dx, Math.floor(p.y) + dy]).find(([x, y]) => W.walkable(m, x, y));
    if (t) c.goTo(m, t[0], t[1], () => c.setDirTo(p.x, p.y));
  }
  async function propose(a) {
    const g = G(), c = g.cap;
    if (c.wander) c.wander = false;
    g.modal++;
    let yes = false;
    try {
      c.setDirTo(g.player.x, g.player.y);
      await PX.Dlg.runLines(PX.Dlg.capPick(a.l));
      const i = await PX.Dlg.choose([{ t: PX.Dlg.capTone(a.id === 'out' ? '좋아요, 같이 나가요.' : '좋아요.') }, { t: PX.Dlg.capTone('이따가 해요.') }]);
      yes = i === 0;
      await PX.Dlg.say('player', PX.Dlg.capTone(yes ? (a.id === 'out' ? '좋아요, 같이 나가요.' : '좋아요.') : '이따가 해요.'));
      if (!yes) await PX.Dlg.say('cap', U.pickFresh('homeNo', ['응. 그럼 그냥 이렇게 있자.', '알았어. 생각나면 말해.', '그래. 옆에 있는 것도 좋아.']), 'smile');
    } finally { PX.Dlg.close(); g.modal--; }
    if (!yes) return;
    if (a.id === 'out') return outMenu(true);
    const act = ACTS.find(x => x.id === a.id); if (act) await act.run();
  }

  return { here, list, menu, outMenu, goOut, tick, ACTS };
})();
