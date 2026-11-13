// api/room.js — Simple HTTPS room sync (replaces PeerJS completely)
const rooms = globalThis.__WYEIT_ROOMS || (globalThis.__WYEIT_ROOMS = new Map());

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Clean up rooms older than 2 hours
  const now = Date.now();
  for (const [k, v] of rooms) {
    if (now - v.updated > 7200000) rooms.delete(k);
  }

  const code = String((req.query.code || req.body?.code || '')).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) return res.status(400).json({ error: 'Invalid code' });

  if (req.method === 'GET') {
    const room = rooms.get(code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    return res.status(200).json(room);
  }

  if (req.method === 'POST') {
    const { action, side, state } = req.body || {};

    if (action === 'create') {
      const room = {
        code,
        players: { [side || 'indian']: true },
        state: state || { lvl: 0, ph: 'play', paused: false, hint: false, started: false },
        updated: now
      };
      rooms.set(code, room);
      return res.status(200).json(room);
    }

    const room = rooms.get(code);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (action === 'join') {
      room.players[side || 'filipino'] = true;
      room.updated = now;
      return res.status(200).json(room);
    }

    if (action === 'update' && state) {
      room.state = state;
      room.updated = now;
      return res.status(200).json(room);
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
