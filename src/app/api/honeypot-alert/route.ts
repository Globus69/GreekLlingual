import { NextRequest, NextResponse } from 'next/server';

// Rate Limiting: Max 10 Alerts pro Minute (verhindert Spam)
const alertTimestamps: number[] = [];
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000; // 1 Minute

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting Check
    const now = Date.now();
    const recentAlerts = alertTimestamps.filter(ts => now - ts < RATE_WINDOW);
    if (recentAlerts.length >= RATE_LIMIT) {
      console.warn('⚠️ Honeypot alert rate limit exceeded');
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    alertTimestamps.push(now);
    // Cleanup alte Timestamps
    while (alertTimestamps.length > 0 && now - alertTimestamps[0] > RATE_WINDOW) {
      alertTimestamps.shift();
    }

    const { pin } = await request.json();

    // Validierung
    if (!pin || typeof pin !== 'string' || pin.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN format' },
        { status: 400 }
      );
    }

    // Hole Client-IP für Logging
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Sende Telegram-Nachricht via Supabase Edge Function
    const telegramResponse = await fetch(
      'https://bzdzqmnxycnudflcnmzj.supabase.co/functions/v1/send-telegram',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: `🚨 <b>SECURITY ALERT</b>\n\nHoneypot-PIN detected!\n\nPIN: ${pin}\nIP: ${clientIP}\nTime: ${new Date().toISOString()}\n\n⚠️ Suspicious login attempt blocked.`,
        }),
      }
    );

    if (!telegramResponse.ok) {
      throw new Error(`Telegram API failed: ${telegramResponse.status}`);
    }

    const telegramData = await telegramResponse.json();

    console.log(`🍯 Honeypot alert sent for PIN ${pin} from IP ${clientIP}`);

    return NextResponse.json({
      success: true,
      telegram: telegramData,
    });
  } catch (error) {
    console.error('❌ Honeypot alert error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
