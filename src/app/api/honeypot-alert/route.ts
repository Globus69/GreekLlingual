import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

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
          message: `🚨 <b>SECURITY ALERT</b>\n\nHoneypot-PIN detected!\n\nPIN: ${pin}\nTime: ${new Date().toISOString()}\n\n⚠️ Suspicious login attempt blocked.`,
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    return NextResponse.json({
      success: true,
      telegram: telegramData,
    });
  } catch (error) {
    console.error('Honeypot alert error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
