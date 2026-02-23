import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Keep-alive: Pings DB to prevent Supabase Free-Tier from sleeping
// Call this endpoint every 4-5 days via cron / external scheduler
// e.g. cron-job.org → POST https://yourapp.vercel.app/api/keepalive

export async function GET() {
    const start = Date.now();

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ ok: false, error: 'Missing env vars' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Lightweight ping – just SELECT 1 row from users to wake up DB
        const { error } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .maybeSingle();

        const elapsed = Date.now() - start;

        if (error) {
            console.error('❌ [keepalive] DB ping failed:', error.message);

            // Notify via Telegram if DB is unreachable
            await sendTelegramAlert(supabaseUrl,
                `🔴 <b>DB OFFLINE</b>\n\nSupabase antwortet nicht!\n\nFehler: ${error.message}\nZeit: ${new Date().toISOString()}\n\n⚠️ Das Projekt könnte pausiert sein.`
            );

            return NextResponse.json({ ok: false, error: error.message, ms: elapsed }, { status: 503 });
        }

        console.log(`✅ [keepalive] DB ping OK in ${elapsed}ms`);
        return NextResponse.json({ ok: true, ms: elapsed, ts: new Date().toISOString() });

    } catch (err: any) {
        const elapsed = Date.now() - start;
        console.error('❌ [keepalive] Exception:', err?.message);
        return NextResponse.json({ ok: false, error: err?.message, ms: elapsed }, { status: 500 });
    }
}

async function sendTelegramAlert(supabaseUrl: string, message: string) {
    try {
        await fetch(`${supabaseUrl}/functions/v1/send-telegram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ message }),
        });
    } catch {
        // Ignore – if DB is down, Telegram might also fail
    }
}
