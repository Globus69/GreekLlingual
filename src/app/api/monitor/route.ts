import { NextRequest, NextResponse } from 'next/server';

// Monitor API: Called by frontend when critical errors occur
// Forwards to Telegram via Supabase Edge Function
//
// Usage from frontend:
//   import { reportError } from '@/lib/monitor';
//   reportError('DB timeout during login', { userId: '...', page: '/login-pin' });

const RATE_LIMIT = 5;           // Max 5 alerts per window
const RATE_WINDOW = 300000;     // 5 minutes
const alertTimestamps: number[] = [];

export async function POST(request: NextRequest) {
    try {
        // Rate Limiting – prevent spam
        const now = Date.now();
        const recent = alertTimestamps.filter(ts => now - ts < RATE_WINDOW);
        if (recent.length >= RATE_LIMIT) {
            return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
        }
        alertTimestamps.push(now);

        const body = await request.json();
        const { type, message, details, userId, page } = body;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
            return NextResponse.json({ ok: false }, { status: 500 });
        }

        // Build Telegram message
        const icons: Record<string, string> = {
            error: '🔴',
            warning: '🟡',
            info: 'ℹ️',
            security: '🚨',
        };
        const icon = icons[type] || '🔴';

        const telegramMessage = [
            `${icon} <b>APP MONITOR: ${(type || 'error').toUpperCase()}</b>`,
            '',
            `📝 <b>Nachricht:</b> ${message}`,
            page ? `📍 <b>Seite:</b> ${page}` : null,
            userId ? `👤 <b>User:</b> ${userId.substring(0, 8)}...` : null,
            details ? `🔍 <b>Details:</b> <code>${JSON.stringify(details).substring(0, 200)}</code>` : null,
            '',
            `⏰ ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
        ].filter(Boolean).join('\n');

        const res = await fetch(`${supabaseUrl}/functions/v1/send-telegram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ message: telegramMessage }),
        });

        if (!res.ok) {
            return NextResponse.json({ ok: false, error: `Telegram: ${res.status}` }, { status: 502 });
        }

        return NextResponse.json({ ok: true });

    } catch (err: any) {
        console.error('❌ [monitor] Error:', err?.message);
        return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
    }
}
