/* =========================================================================
   보장원 도트 — 멀티플레이 연결
   · claude.ai 아티팩트: room 기능
   · 그 밖(GitHub Pages 등): 무료 공개 MQTT 중계소 2곳(HiveMQ · EMQX)에 동시에 보내고, 받은 쪽은 중복을 버려요
   ========================================================================= */
export const RELAY = {
  brokers: ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'],
  base: 'bojangwon-gwanghwamun/v2-pixel/lobby/',
  status: 'connecting', relay: false, clients: [],
};
export const NET = { peers: new Map(), sent: 0, firstFrom: [0, 0] };
export const netPeer = (id) => { if (!NET.peers.has(id)) NET.peers.set(id, { rtt: [], times: [] }); return NET.peers.get(id); };
const listeners = new Set();
export const onNetStatus = (f) => listeners.add(f);
const fire = () => listeners.forEach((f) => f(RELAY.status));

async function relayJoinRoom() {
  const mqtt = (await import('https://cdn.jsdelivr.net/npm/mqtt@5.16.0/dist/mqtt.esm.js')).default;
  const selfId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const topic = RELAY.base + selfId;
  const actions = {};
  const seen = new Map();
  let seq = 0;
  const room = { selfId, onPeerJoin: null, onPeerLeave: null };
  const clients = RELAY.clients = RELAY.brokers.map((url) => mqtt.connect(url, {
    clientId: 'bjp_' + selfId + '_' + Math.random().toString(36).slice(2, 6),
    keepalive: 30, reconnectPeriod: 3000, connectTimeout: 9000, clean: true,
    will: { topic, payload: JSON.stringify({ a: '_bye' }), qos: 0, retain: false },
  }));
  const publish = (a, d) => {
    const msg = JSON.stringify({ a, s: ++seq, d });
    if (msg.length > 6000) return;
    for (const c of clients) if (c.connected) c.publish(topic, msg, { qos: 0 });
    NET.sent++;
  };
  const updateStatus = () => { RELAY.status = clients.some((c) => c.connected) ? 'ok' : 'connecting'; fire(); };
  for (const c of clients) {
    c.on('connect', () => { c.subscribe(RELAY.base + '+', { qos: 0 }); publish('_hi'); updateStatus(); });
    c.on('close', updateStatus); c.on('offline', updateStatus); c.on('error', () => {});
    c.on('message', (tp, buf) => {
      const id = tp.slice(RELAY.base.length);
      if (!id || id === selfId || id.includes('/') || buf.length > 6000) return;
      let m; try { m = JSON.parse(new TextDecoder().decode(buf)); } catch (e) { return; }
      if (!m || typeof m.a !== 'string') return;
      if (m.a === '_bye') { if (seen.delete(id)) room.onPeerLeave?.(id); return; }
      const prev = seen.get(id);
      if (prev && typeof m.s === 'number' && m.s <= prev.s && m.a !== '_hi') return; // 다른 중계소에서 온 중복
      seen.set(id, { s: typeof m.s === 'number' ? m.s : (prev?.s || 0), t: Date.now() });
      if (!prev || m.a === '_hi') room.onPeerJoin?.(id);
      if (m.a === 'pres') netPeer(id).times.push(performance.now());
      NET.firstFrom[RELAY.clients.indexOf(c)]++;
      if (m.a[0] !== '_') actions[m.a]?.onMessage?.(m.d, { peerId: id });
    });
  }
  setInterval(() => {
    publish('_hb');
    const now = Date.now();
    for (const [id, v] of seen) if (now - v.t > 10000) { seen.delete(id); room.onPeerLeave?.(id); }
  }, 3000);
  room.makeAction = (name) => (actions[name] = { onMessage: null, send(data) { publish(name, data); } });
  room.leave = () => { publish('_bye'); for (const c of clients) c.end(true); };
  return room;
}

// room 모양: presence(patch) · onPeers(fn({peers, joined, left, updated})) · ping()
async function connectRelay() {
  const tr = await relayJoinRoom();
  RELAY.relay = true;
  const selfId = tr.selfId;
  const pres = tr.makeAction('pres');
  const peersMap = new Map();
  const subs = [];
  let mine = {};
  const mk = (id, presence, isMe) => ({ peer: id, isMe, viewer: true, presence });
  peersMap.set(selfId, mk(selfId, {}, true));
  const emit = (ch) => { const peers = [...peersMap.values()]; subs.forEach((f) => f({ peers, joined: ch.joined || [], left: ch.left || [], updated: ch.updated || [] })); };
  const ping = tr.makeAction('ping');
  ping.onMessage = (d, meta) => {
    const id = meta?.peerId;
    if (!id || !d || typeof d !== 'object') return;
    if (d.k === 'q' && typeof d.ts === 'number') ping.send({ k: 'r', to: d.from, ts: d.ts });
    else if (d.k === 'r' && d.to === selfId && typeof d.ts === 'number') {
      const rtt = performance.now() - d.ts;
      if (rtt >= 0 && rtt < 30000) { const P = netPeer(id); P.rtt.push(rtt); if (P.rtt.length > 10) P.rtt.shift(); }
    }
  };
  pres.onMessage = (data, meta) => {
    const id = meta?.peerId;
    if (!id || !data || typeof data !== 'object' || Array.isArray(data)) return;
    if (JSON.stringify(data).length > 4096) return;
    const isNew = !peersMap.has(id);
    const p = mk(id, data, false);
    peersMap.set(id, p);
    emit(isNew ? { joined: [p] } : { updated: [p] });
  };
  tr.onPeerJoin = () => { pres.send(mine); };
  tr.onPeerLeave = (id) => { const p = peersMap.get(id); if (p) { peersMap.delete(id); emit({ left: [p] }); } };
  addEventListener('pagehide', () => { try { tr.leave(); } catch (e) { /* 무시 */ } });
  return {
    selfId,
    presence(patch) {
      mine = { ...mine, ...patch };
      for (const k of Object.keys(mine)) if (mine[k] === null) delete mine[k];
      peersMap.set(selfId, mk(selfId, mine, true));
      pres.send(mine);
    },
    onPeers(f) { subs.push(f); setTimeout(() => emit({ joined: [...peersMap.values()] }), 0); },
    ping() { ping.send({ k: 'q', from: selfId, ts: performance.now() }); },
  };
}
// claude.ai 아티팩트의 room 기능을 같은 모양으로 감싸요
function wrapClaudeRoom(r) {
  const conv = (p) => ({ peer: p.peer, isMe: !!p.sameTab, viewer: p.kind === 'viewer', presence: p.presence || {} });
  return {
    selfId: null,
    presence(patch) { r.presence(patch); },
    onPeers(f) { r.onPeers((s) => f({ peers: s.peers.map(conv), joined: s.joined.map(conv), left: s.left.map(conv), updated: s.updated.map(conv) })); },
    ping() {},
  };
}
export async function connect() {
  try {
    if (window.claude?.use) {
      const r = await window.claude.use('room');
      if (r) { RELAY.status = 'ok'; fire(); return wrapClaudeRoom(r); }
    }
    if (location.protocol === 'file:') return null;
    return await connectRelay();
  } catch (e) {
    console.warn('멀티플레이 연결 실패 — 혼자 모드로 계속해요', e);
    return null;
  }
}
