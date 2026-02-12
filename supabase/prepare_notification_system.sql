-- ============================================================
-- Benachrichtigungssystem (Vorbereitung für Telegram/WhatsApp)
-- ============================================================
-- Datum: 2026-02-12
-- Status: ⚠️ TECHNOLOGIE-ENTSCHEIDUNG AUSSTEHEND
-- Zweck: Bei Honeypot-Versuch Admin benachrichtigen
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TECHNOLOGIE-OPTIONEN:
-- ────────────────────────────────────────────────────────────
-- Option A (BEVORZUGT): Telegram Bot API
--   - Einfacher zu implementieren
--   - Keine Business-API nötig
--   - Kostenlos
--   - Schritte:
--     1. Telegram Bot erstellen (@BotFather)
--     2. Bot-Token erhalten
--     3. Chat-ID des Admins ermitteln
--     4. HTTP POST an https://api.telegram.org/bot<TOKEN>/sendMessage
--
-- Option B: WhatsApp Business API
--   - Twilio WhatsApp API (kostenpflichtig)
--   - WhatsApp Cloud API (Meta, kostenlos aber komplex)
--   - Benötigt Business-Account + Verification
--   - Schritte:
--     1. WhatsApp Business Account erstellen
--     2. API-Zugang beantragen
--     3. Template-Nachricht erstellen
--     4. HTTP POST an API-Endpoint
-- ────────────────────────────────────────────────────────────

-- ── 1. Notification-Log Tabelle ───────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,  -- 'telegram' | 'whatsapp' | 'email'
    recipient TEXT NOT NULL,  -- Phone/Chat-ID/Email
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',  -- 'pending' | 'sent' | 'failed'
    response TEXT,  -- API Response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notification_log_status
ON public.notification_log(status, created_at DESC);

-- RLS-Policies
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_read_notifications ON public.notification_log;
CREATE POLICY admin_read_notifications ON public.notification_log
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- ── 2. RPC: Benachrichtigung senden (Placeholder) ─────────
-- Diese Funktion wird später durch Edge Function ersetzt
CREATE OR REPLACE FUNCTION send_security_alert(
    p_user_name TEXT,
    p_pin_attempted TEXT,
    p_ip_address TEXT,
    p_timestamp TIMESTAMP
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_phone TEXT;
    v_message TEXT;
    v_notification_id UUID;
BEGIN
    -- Admin-Kontakt abrufen
    SELECT contact_phone INTO v_admin_phone
    FROM public.users
    WHERE role = 'admin'
    LIMIT 1;

    IF v_admin_phone IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin contact phone not found'
        );
    END IF;

    -- Nachricht zusammenstellen
    v_message := format(
        E'🚨 Sicherheitsalarm – GreekLingua Dashboard\n\n' ||
        'User: %s\n' ||
        'PIN-Versuch: %s\n' ||
        'IP-Adresse: %s\n' ||
        'Zeitpunkt: %s\n' ||
        'Aktion: 24h IP-Ban + Account gesperrt',
        COALESCE(p_user_name, 'Unbekannt'),
        p_pin_attempted,
        p_ip_address,
        TO_CHAR(p_timestamp, 'YYYY-MM-DD HH24:MI:SS')
    );

    -- Log-Eintrag erstellen
    INSERT INTO public.notification_log (type, recipient, message, status)
    VALUES ('telegram', v_admin_phone, v_message, 'pending')
    RETURNING id INTO v_notification_id;

    -- ⚠️ HIER MUSS SPÄTER EDGE FUNCTION AUFGERUFEN WERDEN
    -- Beispiel Edge Function Call (via pg_net Extension oder HTTP):
    -- SELECT http_post(
    --     'https://YOUR_SUPABASE_URL/functions/v1/send-telegram',
    --     json_build_object('chat_id', v_admin_phone, 'text', v_message)::TEXT,
    --     'application/json'::TEXT
    -- );

    RETURN json_build_object(
        'success', true,
        'notification_id', v_notification_id,
        'message', 'Notification logged (⚠️ Edge Function not yet implemented)'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION send_security_alert(TEXT, TEXT, TEXT, TIMESTAMP) TO anon, authenticated;

-- ── 3. Integration in verify_user_4digit_pin() ────────────
-- HINWEIS: Diese Funktion muss manuell angepasst werden
-- Füge nach dem Ban-Call folgendes hinzu:
--
-- PERFORM send_security_alert(
--     v_user.name,
--     p_pin,
--     p_ip_address,
--     NOW()
-- );

-- ============================================================
-- ✅ Vorbereitung abgeschlossen
-- ============================================================
-- NÄCHSTE SCHRITTE:
-- ────────────────────────────────────────────────────────────
-- 1. TECHNOLOGIE WÄHLEN (Telegram bevorzugt)
--
-- 2. TELEGRAM BOT SETUP (falls Option A):
--    a) Bot erstellen: @BotFather in Telegram
--    b) Bot-Token kopieren
--    c) Admin-Chat-ID ermitteln:
--       - Bot starten (/start)
--       - https://api.telegram.org/bot<TOKEN>/getUpdates
--       - chat.id aus Response kopieren
--    d) Edge Function erstellen:
--       supabase/functions/send-telegram/index.ts
--    e) Bot-Token als Secret speichern:
--       supabase secrets set TELEGRAM_BOT_TOKEN=xxx
--
-- 3. EDGE FUNCTION ERSTELLEN (Beispiel):
-- ────────────────────────────────────────────────────────────
-- import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
--
-- serve(async (req) => {
--   const { chat_id, text } = await req.json()
--   const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
--
--   const response = await fetch(
--     `https://api.telegram.org/bot${token}/sendMessage`,
--     {
--       method: 'POST',
--       headers: { 'Content-Type': 'application/json' },
--       body: JSON.stringify({
--         chat_id,
--         text,
--         parse_mode: 'HTML'
--       })
--     }
--   )
--
--   return new Response(JSON.stringify({ success: true }), {
--     headers: { 'Content-Type': 'application/json' }
--   })
-- })
-- ────────────────────────────────────────────────────────────
--
-- 4. INTEGRATION TESTEN:
--    SELECT send_security_alert('Test User', '0000', '1.2.3.4', NOW());
--
-- ============================================================
