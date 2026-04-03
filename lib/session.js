// Vercel KV session logging with graceful degradation.
// All functions return safe defaults if KV is unavailable (local dev, outage).

let kv = null;
let kvChecked = false;

async function getKV() {
  if (kvChecked) return kv;
  kvChecked = true;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  try {
    const mod = await import('@vercel/kv');
    kv = mod.kv;
    return kv;
  } catch {
    return null;
  }
}

export async function createSession(sessionId) {
  const now = new Date().toISOString();
  const record = {
    id: sessionId,
    startedAt: now,
    lastActivityAt: now,
    exchangeCount: 0,
    solvedCount: 0,
    durationMinutes: 0,
  };
  try {
    const store = await getKV();
    if (!store) return record;
    await store.set(`session:${sessionId}`, JSON.stringify(record));
    await store.zadd('sessions:index', { score: Date.now(), member: sessionId });
  } catch (e) {
    console.error('KV createSession error:', e);
  }
  return record;
}

export async function updateSessionActivity(sessionId, solved = false) {
  try {
    const store = await getKV();
    if (!store) return;
    const raw = await store.get(`session:${sessionId}`);
    if (!raw) return;
    const record = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const now = new Date();
    record.lastActivityAt = now.toISOString();
    record.exchangeCount += 1;
    if (solved) record.solvedCount += 1;
    record.durationMinutes = Math.round(
      (now.getTime() - new Date(record.startedAt).getTime()) / 60000
    );
    await store.set(`session:${sessionId}`, JSON.stringify(record));
  } catch (e) {
    console.error('KV updateSessionActivity error:', e);
  }
}

export async function getRecentSessions(count = 50) {
  try {
    const store = await getKV();
    if (!store) return [];
    const sessionIds = await store.zrange('sessions:index', 0, count - 1, { rev: true });
    if (!sessionIds || sessionIds.length === 0) return [];
    const sessions = await Promise.all(
      sessionIds.map(async (id) => {
        try {
          const raw = await store.get(`session:${id}`);
          if (!raw) return null;
          return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          return null;
        }
      })
    );
    return sessions.filter(Boolean);
  } catch (e) {
    console.error('KV getRecentSessions error:', e);
    return [];
  }
}
