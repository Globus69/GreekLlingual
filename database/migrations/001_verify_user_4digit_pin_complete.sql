-- ============================================================
-- RPC-Funktion für 4-stelligen PIN-Login (KOMPLETT)
-- ============================================================
-- Diese Datei muss NACH extend_users_for_4digit_pin_fixed.sql
-- im Supabase SQL Editor ausgeführt werden!
-- ============================================================

-- ── 1. Honeypot-Tabelle erstellen (falls nicht vorhanden) ───
CREATE TABLE IF NOT EXISTS public.honeypot_pins (
    pin TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Honeypot-PINs einfügen (idempotent)
INSERT INTO public.honeypot_pins (pin) VALUES
    ('0000'), ('1111'), ('2222'), ('3333'), ('4444'),
    ('5555'), ('6666'), ('7777'), ('8888'), ('9999'),
    ('1234'), ('4321'), ('1122'), ('2211'), ('5678')
ON CONFLICT (pin) DO NOTHING;

-- ── 2. Banned-IPs Tabelle erstellen (falls nicht vorhanden) ─
CREATE TABLE IF NOT EXISTS public.banned_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    reason TEXT,
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = permanent
    created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_banned_ips_address ON public.banned_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_banned_ips_expires ON public.banned_ips(expires_at);

-- ── 3. Login-Attempts Tabelle erweitern ──────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='users' AND column_name='failed_attempts') THEN
        ALTER TABLE public.users ADD COLUMN failed_attempts INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='users' AND column_name='locked_until') THEN
        ALTER TABLE public.users ADD COLUMN locked_until TIMESTAMPTZ;
    END IF;
END $$;

-- ── 4. ERWEITERTE RPC-Funktion für 4-stelligen PIN-Login ────
CREATE OR REPLACE FUNCTION verify_user_4digit_pin(
    p_pin TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_role TEXT,
    user_level TEXT,
    user_difficulty TEXT,
    user_performance_index TEXT,
    user_preferred_locale TEXT,
    user_preply TEXT,
    user_outside_preply TEXT,
    user_fee_per_hour NUMERIC,
    user_currency TEXT,
    error TEXT  -- Fehler-Feld für Sicherheits-Checks
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_is_banned BOOLEAN;
    v_is_honeypot BOOLEAN;
BEGIN
    -- 1) IP-Ban-Check (optional, nur wenn IP übergeben wurde)
    IF p_ip_address IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.banned_ips
            WHERE ip_address = p_ip_address
              AND (expires_at IS NULL OR expires_at > NOW())
        ) INTO v_is_banned;

        IF v_is_banned THEN
            RETURN QUERY SELECT
                NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
                NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
                NULL::NUMERIC, NULL::TEXT, 'IP banned'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- 2) Honeypot-Check
    SELECT EXISTS(
        SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin
    ) INTO v_is_honeypot;

    IF v_is_honeypot THEN
        -- Log Honeypot-Versuch (optional)
        -- TODO: Hier könnte man einen Telegram-Alert triggern
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::NUMERIC, NULL::TEXT, 'Honeypot detected'::TEXT;
        RETURN;
    END IF;

    -- 3) User suchen
    SELECT * INTO v_user FROM public.users WHERE pin_4digit = p_pin LIMIT 1;

    IF NOT FOUND THEN
        -- PIN nicht gefunden
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::NUMERIC, NULL::TEXT, 'PIN not found'::TEXT;
        RETURN;
    END IF;

    -- 4) Account-Lock-Check
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::NUMERIC, NULL::TEXT, 'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- 5) Success - Failed-Attempts zurücksetzen
    UPDATE public.users
    SET failed_attempts = 0, locked_until = NULL
    WHERE id = v_user.id;

    -- 6) User-Daten zurückgeben
    RETURN QUERY SELECT
        v_user.id,
        v_user.name,
        v_user.email,
        v_user.role,
        v_user.level,
        v_user.difficulty,
        v_user.performance_index,
        v_user.preferred_locale,
        v_user.preply,
        v_user.outside_preply,
        v_user.fee_per_hour,
        v_user.currency,
        NULL::TEXT;  -- Kein Fehler
END;
$$;

-- ── 5. Hilfsfunktion: Failed-Attempt aufzeichnen ─────────────
CREATE OR REPLACE FUNCTION record_failed_login_attempt(p_pin TEXT)
RETURNS TABLE (
    locked BOOLEAN,
    attempts INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_attempts INT;
BEGIN
    -- User finden (auch wenn PIN falsch ist - für Account-Lockout)
    SELECT id, failed_attempts INTO v_user_id, v_attempts
    FROM public.users
    WHERE pin_4digit = p_pin
    LIMIT 1;

    IF FOUND THEN
        -- Attempts erhöhen
        v_attempts := COALESCE(v_attempts, 0) + 1;

        -- Bei 5 fehlgeschlagenen Versuchen: Account für 15 Minuten sperren
        IF v_attempts >= 5 THEN
            UPDATE public.users
            SET failed_attempts = v_attempts,
                locked_until = NOW() + INTERVAL '15 minutes'
            WHERE id = v_user_id;

            RETURN QUERY SELECT TRUE, v_attempts;
        ELSE
            UPDATE public.users
            SET failed_attempts = v_attempts
            WHERE id = v_user_id;

            RETURN QUERY SELECT FALSE, v_attempts;
        END IF;
    ELSE
        -- PIN existiert nicht - keine Aufzeichnung
        RETURN QUERY SELECT FALSE, 0;
    END IF;
END;
$$;

-- ── 6. Zugriffsrechte für RPC-Funktionen ──────────────────────
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO authenticated;
GRANT EXECUTE ON FUNCTION record_failed_login_attempt TO anon;
GRANT EXECUTE ON FUNCTION record_failed_login_attempt TO authenticated;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- WICHTIG: Diese Datei im Supabase SQL Editor ausführen!
--
-- Neu erstellt:
-- - Tabelle: honeypot_pins (15 Standard-PINs)
-- - Tabelle: banned_ips (für IP-Sperren)
-- - Spalten: users.failed_attempts, users.locked_until
-- - RPC: verify_user_4digit_pin(pin, ip_address, user_agent)
-- - RPC: record_failed_login_attempt(pin)
--
-- Die Funktion gibt jetzt ein 'error' Feld zurück mit:
-- - 'IP banned' → IP ist gesperrt
-- - 'Honeypot detected' → Sicherheits-PIN erkannt
-- - 'PIN not found' → Ungültiger PIN
-- - 'Account locked. Try again later.' → Account gesperrt
-- - NULL → Erfolgreicher Login
-- ============================================================
