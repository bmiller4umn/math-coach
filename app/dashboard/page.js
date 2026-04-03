'use client';

import { useState, useEffect } from 'react';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Strict`;
}

export default function Dashboard() {
  const [pin, setPin] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getCookie('math-coach-dashboard-pin');
    if (saved) {
      setPin(saved);
      fetchSessions(saved);
    } else {
      setPin(false);
    }
  }, []);

  async function fetchSessions(dashPin) {
    setLoading(true);
    try {
      const res = await fetch(`/api/session?pin=${encodeURIComponent(dashPin)}`);
      if (res.status === 401) {
        document.cookie = 'math-coach-dashboard-pin=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        setPin(false);
        setPinError('Invalid dashboard code.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    }
    setLoading(false);
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    if (!pinInput.trim()) return;
    const trimmed = pinInput.trim();
    setLoading(true);
    try {
      const res = await fetch(`/api/session?pin=${encodeURIComponent(trimmed)}`);
      if (res.status === 401) {
        setPinError('Wrong code. Try again.');
        setLoading(false);
        return;
      }
      setCookie('math-coach-dashboard-pin', trimmed, 30);
      setPin(trimmed);
      setPinError('');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      setPinError("Can't connect. Try again.");
    }
    setLoading(false);
  }

  // Compute stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weekSessions = sessions.filter(s => new Date(s.startedAt) >= weekAgo);
  const monthSessions = sessions.filter(s => new Date(s.startedAt) >= monthAgo);
  const avgDuration = monthSessions.length > 0
    ? Math.round(monthSessions.reduce((a, s) => a + (s.durationMinutes || 0), 0) / monthSessions.length)
    : 0;
  const weekSolved = weekSessions.reduce((a, s) => a + (s.solvedCount || 0), 0);
  const monthSolved = monthSessions.reduce((a, s) => a + (s.solvedCount || 0), 0);

  // 14-day activity dots
  const activityDots = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const active = sessions.some(s => s.startedAt?.slice(0, 10) === dayStr);
    activityDots.push({ date: d, active, label: d.toLocaleDateString('en', { weekday: 'narrow' }) });
  }

  /* ── PIN: LOADING ── */
  if (pin === null) {
    return (
      <div style={S.page}>
        <p style={{ color: C.mu }}>Loading...</p>
        <style>{fontImport}</style>
      </div>
    );
  }

  /* ── PIN: ENTRY ── */
  if (pin === false) {
    return (
      <div style={S.page}>
        <div style={S.center}>
          <div style={S.mark}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <h1 style={S.title}>Parent Dashboard</h1>
          <p style={{ color: C.mu, fontSize: 15, marginBottom: 20 }}>Enter your dashboard code</p>
          <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <input
              type="number"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Dashboard code"
              style={S.pinInput}
              autoFocus
            />
            {pinError && <p style={{ color: "#ef4444", fontSize: 14, margin: 0 }}>{pinError}</p>}
            <button type="submit" style={S.btn}>Enter</button>
          </form>
        </div>
        <style>{fontImport}</style>
      </div>
    );
  }

  /* ── DASHBOARD ── */
  return (
    <div style={S.page}>
      <div style={S.container}>
        <h1 style={S.title}>Parent Dashboard</h1>

        {/* Summary stats */}
        <div style={S.statsRow}>
          <div style={S.stat}>
            <div style={S.statVal}>{weekSessions.length}</div>
            <div style={S.statLabel}>Sessions this week</div>
          </div>
          <div style={S.stat}>
            <div style={S.statVal}>{avgDuration}m</div>
            <div style={S.statLabel}>Avg duration</div>
          </div>
          <div style={S.stat}>
            <div style={S.statVal}>{weekSolved}</div>
            <div style={S.statLabel}>Solved this week</div>
          </div>
        </div>

        {/* 14-day activity */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: C.mu, fontSize: 13, marginBottom: 10 }}>Last 14 days</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {activityDots.map((d, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: d.active ? C.ac : "rgba(255,255,255,0.06)",
                  border: `1px solid ${d.active ? C.ac : C.bd}`,
                }} />
                <span style={{ fontSize: 10, color: C.mu }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Month summary */}
        <div style={{ color: C.mu, fontSize: 13, marginBottom: 12 }}>
          This month: {monthSessions.length} sessions, {monthSolved} problems solved
        </div>

        {/* Session log */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: C.mu, fontSize: 13, marginBottom: 10 }}>Session log</div>
          {loading && <p style={{ color: C.mu, fontSize: 14 }}>Loading...</p>}
          {!loading && sessions.length === 0 && (
            <p style={{ color: C.mu, fontSize: 14 }}>No sessions recorded yet.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sessions.map((s, i) => (
              <div key={i} style={S.logRow}>
                <span style={{ color: C.tx, fontSize: 14 }}>
                  {new Date(s.startedAt).toLocaleDateString()} {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ color: C.mu, fontSize: 13 }}>{s.durationMinutes || 0}m</span>
                  <span style={{ color: C.mu, fontSize: 13 }}>{s.exchangeCount || 0} msgs</span>
                  <span style={{ color: "#22c55e", fontSize: 13 }}>{s.solvedCount || 0} solved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{fontImport}</style>
    </div>
  );
}

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

const C = {
  bg: "#101216",
  sf: "rgba(255,255,255,0.05)",
  bd: "rgba(255,255,255,0.07)",
  tx: "rgba(255,255,255,0.87)",
  mu: "rgba(255,255,255,0.42)",
  ac: "#3b82f6",
  fn: "'IBM Plex Sans', sans-serif",
  mn: "'JetBrains Mono', monospace",
  r: 12,
};

const S = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    fontFamily: C.fn,
    display: "flex",
    justifyContent: "center",
    padding: 24,
  },
  center: {
    maxWidth: 400,
    textAlign: "center",
    marginTop: 80,
  },
  container: {
    maxWidth: 600,
    width: "100%",
    paddingTop: 24,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: C.ac,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: 600, color: C.tx, marginTop: 0, marginBottom: 20 },
  pinInput: {
    width: 200,
    padding: "13px 16px",
    borderRadius: C.r,
    border: `1px solid ${C.bd}`,
    background: C.sf,
    color: "#fff",
    fontSize: 18,
    fontFamily: C.mn,
    textAlign: "center",
    outline: "none",
    letterSpacing: 4,
  },
  btn: {
    padding: "13px 34px",
    borderRadius: C.r,
    border: "none",
    background: C.ac,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: C.fn,
  },
  statsRow: {
    display: "flex",
    gap: 12,
    marginBottom: 28,
  },
  stat: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    background: C.sf,
    border: `1px solid ${C.bd}`,
    textAlign: "center",
  },
  statVal: {
    fontSize: 24,
    fontWeight: 600,
    color: C.tx,
    fontFamily: C.mn,
  },
  statLabel: {
    fontSize: 12,
    color: C.mu,
    marginTop: 4,
  },
  logRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 8,
    background: C.sf,
    border: `1px solid ${C.bd}`,
  },
};
