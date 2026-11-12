// 현실 기준 그레고리력 · 24시간제 · 계절 · 날씨 · 로어북 행사 일정 계산
'use strict';
PX.Cal = (() => {
  const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = (y, m) => (m === 2 && isLeap(y) ? 29 : MDAYS[m - 1]);
  const daysInYear = y => (isLeap(y) ? 366 : 365);

  // 0001-01-01부터 지난 일수 (외부 Date 객체 없이 직접 계산)
  function dayNumber(y, m, d) {
    const py = y - 1;
    let n = py * 365 + Math.floor(py / 4) - Math.floor(py / 100) + Math.floor(py / 400);
    for (let i = 1; i < m; i++) n += daysInMonth(y, i);
    return n + d - 1;
  }
  // 요일: 0001-01-01은 월요일(1)
  const weekday = (y, m, d) => (dayNumber(y, m, d) + 1) % 7;

  function addDays(date, n) {
    let { y, m, d } = date;
    d += n;
    while (d > daysInMonth(y, m)) { d -= daysInMonth(y, m); m++; if (m > 12) { m = 1; y++; } }
    while (d < 1) { m--; if (m < 1) { m = 12; y--; } d += daysInMonth(y, m); }
    return { y, m, d };
  }

  function season(m) {
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }
  const SEASON_KO = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };

  // 날씨 — 날짜 시드로 결정 (같은 날은 항상 같은 날씨)
  const WEATHER = {
    clear: { ko: '맑음', icon: '☀️' }, cloudy: { ko: '흐림', icon: '☁️' }, rain: { ko: '산성비 아님 · 정화비', icon: '🌧️' },
    dust: { ko: '붉은 모래바람', icon: '🌪️' }, snow: { ko: '은빛 눈', icon: '❄️' }, glow: { ko: '발광포자 바람', icon: '✨' },
  };
  WEATHER.rain.ko = '비';
  function weatherOf(date) {
    const r = PX.U.rng('wx' + date.y + '-' + date.m + '-' + date.d)();
    const s = season(date.m);
    const table = {
      spring: [['clear', .45], ['cloudy', .2], ['rain', .15], ['glow', .15], ['dust', .05]],
      summer: [['clear', .5], ['cloudy', .1], ['rain', .15], ['dust', .25]],
      autumn: [['clear', .45], ['cloudy', .25], ['rain', .1], ['dust', .2]],
      winter: [['clear', .35], ['cloudy', .25], ['snow', .35], ['dust', .05]],
    }[s];
    let acc = 0;
    for (const [w, p] of table) { acc += p; if (r < acc) return w; }
    return 'clear';
  }

  // 시간 흐름: 현실 ms 당 게임 분
  const SPEEDS = { slow: 1 / 2000, normal: 1 / 1000, fast: 1 / 500 };
  const SPEED_KO = { slow: '느림 (2초 = 1분)', normal: '보통 (1초 = 1분)', fast: '빠름 (0.5초 = 1분)' };

  function fmtDate(t) { return `${t.y}.${PX.U.pad2(t.m)}.${PX.U.pad2(t.d)} (${WD[weekday(t.y, t.m, t.d)]})`; }
  function fmtTime(min) { const m = Math.floor(min); return PX.U.pad2(Math.floor(m / 60) % 24) + ':' + PX.U.pad2(m % 60); }
  function partOfDay(min) {
    const h = min / 60;
    if (h < 5) return 'night'; if (h < 11) return 'morning'; if (h < 14) return 'noon';
    if (h < 18) return 'afternoon'; if (h < 22) return 'evening'; return 'night';
  }

  // ---------- 로어북 반복 규칙 평가 ----------
  // n번째 특정 요일
  function nthWeekday(y, m, wd, n) {
    const first = weekday(y, m, 1);
    const d = 1 + ((wd - first + 7) % 7) + (n - 1) * 7;
    return d <= daysInMonth(y, m) ? d : null;
  }
  function lastWeekday(y, m, wd) {
    const last = daysInMonth(y, m);
    return last - ((weekday(y, m, last) - wd + 7) % 7);
  }
  // 규칙이 해당 날짜에 해당하는가 (반환: true / false)
  function ruleMatches(rule, date) {
    const { y, m, d } = date;
    const wd = weekday(y, m, d);
    if (rule.months && !rule.months.includes(m)) return false;
    switch (rule.type) {
      case 'always': return true;
      case 'daily': return true;
      case 'weekly': return rule.weekdays.includes(wd);
      case 'range': // 해당 월 안 날짜 범위
        return d >= rule.from && d <= (rule.to === 'last' ? daysInMonth(y, m) : rule.to);
      case 'nthWeekday': { // n번째 요일, len일 지속
        const start = nthWeekday(y, m, rule.weekday, rule.n);
        return start != null && d >= start && d < start + (rule.len || 1);
      }
      case 'lastWeekday': return d === lastWeekday(y, m, rule.weekday);
      case 'nthWeekend': { // n번째 토요일과 다음 일요일
        const sat = nthWeekday(y, m, 6, rule.n);
        return sat != null && (d === sat || d === sat + 1);
      }
      case 'weekOfMonth': // n번째 주 (1~7일 = 1주)
        return Math.ceil(d / 7) === rule.n;
      case 'dates':
        return rule.days.some(x => (x === 'last' ? daysInMonth(y, m) : x) === d);
      case 'weekendsInMonth': return wd === 0 || wd === 6;
      case 'any': return rule.rules.some(r => ruleMatches(r, date));
      case 'supplyWeekNights': // 보급선 도착 주간(둘째 주) 주말 밤
        return Math.ceil(d / 7) === 2 && (wd === 5 || wd === 6);
      default: return false;
    }
  }
  const EVENT_TYPES = ['festival', 'base', 'special'];
  // 오늘 열리는 로어북 항목 (장소형 'always'는 제외 옵션)
  function eventsOn(date, { includePlaces = false } = {}) {
    return PX.LORE.filter(e => {
      if (!e.repeatRule) return false;
      if (!includePlaces && !EVENT_TYPES.includes(e.eventType)) return false;
      return ruleMatches(e.repeatRule, date);
    });
  }
  // 특정 시각에 운영 중인가
  function openAt(e, date, min) {
    if (!ruleMatches(e.repeatRule, date)) return false;
    if (!e.startTime) return true;
    const s = toMin(e.startTime), en = toMin(e.endTime);
    return en > s ? (min >= s && min < en) : (min >= s || min < en);
  }
  const toMin = hm => { const [h, mm] = hm.split(':').map(Number); return h * 60 + mm; };

  return { isLeap, daysInMonth, daysInYear, dayNumber, weekday, addDays, season, SEASON_KO, WEATHER, weatherOf, SPEEDS, SPEED_KO, WD, fmtDate, fmtTime, partOfDay, ruleMatches, eventsOn, openAt, toMin, nthWeekday, lastWeekday };
})();
