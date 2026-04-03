import { NextResponse } from 'next/server';
import { updateSessionActivity } from '@/lib/session';

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_HOUR || '100');
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request) {
  try {
    const body = await request.json();
    const { pin, messages, system, sessionId, solved } = body;

    // 1. Validate PIN
    if (!pin || pin !== process.env.ACCESS_PIN) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    // 2. Rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
             || request.headers.get('x-real-ip')
             || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Take a breather.' }, { status: 429 });
    }

    // 3. Proxy to Anthropic
    const maxTokens = Math.min(body.max_tokens || 600, 1500);

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.MATH_COACH_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system,
        messages,
      }),
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      // Don't forward 401 from Anthropic — that status is reserved for PIN validation.
      const status = anthropicResponse.status === 401 ? 502 : anthropicResponse.status;
      return NextResponse.json(
        { error: data.error?.message || 'API error' },
        { status }
      );
    }

    // 4. Log session activity (non-blocking)
    if (sessionId) {
      updateSessionActivity(sessionId, !!solved).catch(() => {});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
