import { NextResponse } from 'next/server';

// Keep-alive: Pings DB to prevent Supabase Free-Tier from sleeping
// Call via cron-job.org every 4-5 days:
// GET https://yourapp.vercel.app/api/keepalive

export async function GET() {
    const start = Date.now();

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ ok: false, error: 'Missing env vars' }, { status: 500 });
        }

        // Direct REST call – no client instance needed on server side
        const res = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
            },
        });

        const elapsed = Date.now() - start;

        if (!res.ok) {
            const errText = await res.text();
            console.error('❌ [keepalive] DB ping failed:', errText);

            await sendTelegramAlert(supabaseUrl, supabaseKey,
                `🔴 <b>DB OFFLINE</b>\n\nSupabase antwortet nicht!\n\nStatus: ${res.status}\nZeit: ${new Date().toISOString()}\n\n⚠️ Das Projekt könnte pausiert sein.`
            );

            return NextResponse.json({ ok: false, status: res.status, ms: elapsed }, { status: 503 });
        }

        console.log(`✅ [keepalive] DB ping OK in ${elapsed}ms`);
        return NextResponse.json({ ok: true, ms: elapsed, ts: new Date().toISOString() });

    } catch (err: any) {
        const elapsed = Date.now() - start;
        console.error('❌ [keepalive] Exception:', err?.message);
        return NextResponse.json({ ok: false, error: err?.message, ms: elapsed }, { status: 500 });
    }
}

async function sendTelegramAlert(supabaseUrl: string, supabaseKey: string, message: string) {
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
