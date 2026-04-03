import { NextResponse } from 'next/server';
import { createSession, getRecentSessions } from '@/lib/session';

export async function POST(request) {
  try {
    const { pin, sessionId } = await request.json();
    if (!pin || pin !== process.env.ACCESS_PIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const record = await createSession(sessionId);
    return NextResponse.json(record);
  } catch (error) {
    console.error('Session create error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');
    if (!pin || pin !== process.env.DASHBOARD_PIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessions = await getRecentSessions(50);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
