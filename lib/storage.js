// Client-side localStorage helpers for session persistence and study guides.

const SESSION_KEY = 'math-coach-session';
const GUIDES_KEY = 'math-coach-guides';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_GUIDES = 20;

// ── Session Persistence ──

export function saveSession(data) {
  try {
    const cleaned = {
      sessionId: data.sessionId,
      solved: data.solved,
      savedAt: Date.now(),
      messages: data.messages.map(m => {
        if (m.role === 'user' && m.image) {
          return { ...m, image: null, previewUrl: null, hadImage: true };
        }
        return m;
      }),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(cleaned));
  } catch {
    // localStorage full or unavailable
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > SESSION_EXPIRY_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

// ── Study Guide Library ──

export function saveGuide(guide) {
  try {
    const guides = loadGuides();
    guides.unshift({
      id: `guide_${Date.now()}`,
      createdAt: new Date().toISOString(),
      topic: guide.topic || 'Geometry',
      content: guide.content,
      sessionId: guide.sessionId,
    });
    if (guides.length > MAX_GUIDES) guides.length = MAX_GUIDES;
    localStorage.setItem(GUIDES_KEY, JSON.stringify(guides));
  } catch {
    // ignore
  }
}

export function loadGuides() {
  try {
    return JSON.parse(localStorage.getItem(GUIDES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteGuide(id) {
  try {
    const guides = loadGuides().filter(g => g.id !== id);
    localStorage.setItem(GUIDES_KEY, JSON.stringify(guides));
  } catch {
    // ignore
  }
}

export function clearGuides() {
  try {
    localStorage.removeItem(GUIDES_KEY);
  } catch {
    // ignore
  }
}
