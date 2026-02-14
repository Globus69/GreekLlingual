-- ============================================================
-- FIX: Doppelte verify_user_4digit_pin Funktionen entfernen
-- ============================================================
-- Problem: Migration hat Funktion 2x erstellt:
--   1. verify_user_4digit_pin(TEXT, INET, TEXT)  <- INET Typ
--   2. verify_user_4digit_pin(TEXT, TEXT, TEXT)  <- TEXT Typ
--
-- Client sendet TEXT, aber DB hat beide → Ambiguous function error
-- ============================================================

-- Schritt 1: Alle Varianten explizit löschen
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, INET) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT) CASCADE;

-- Schritt 2: Nur die TEXT-Version neu erstellen (wie im zweiten Teil der Migration)
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
    error TEXT
) AS $$
DECLARE
    v_user RECORD;
    v_is_honeypot BOOLEAN;
    v_ban_reason TEXT;
BEGIN
    -- STEP 1: Check IP Ban
    IF EXISTS (
        SELECT 1 FROM public.banned_ips
        WHERE ip_address = p_ip_address
        AND banned_until > NOW()
    ) THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- STEP 2: Check Honeypot PIN
    SELECT EXISTS (
        SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin
    ) INTO v_is_honeypot;

    IF v_is_honeypot THEN
        v_ban_reason := 'Honeypot PIN: ' || p_pin;
        INSERT INTO public.honeypot_log (ip_address, pin_attempted, user_agent, ban_reason)
        VALUES (p_ip_address, p_pin, p_user_agent, v_ban_reason);
        INSERT INTO public.banned_ips (ip_address, reason, banned_until)
        VALUES (p_ip_address, v_ban_reason, NOW() + INTERVAL '24 hours')
        ON CONFLICT (ip_address) DO UPDATE
        SET banned_until = NOW() + INTERVAL '24 hours', reason = v_ban_reason;
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- STEP 3: Find User by PIN
    SELECT * INTO v_user FROM public.users WHERE pin_4digit = p_pin LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid PIN'::TEXT;
        RETURN;
    END IF;

    -- STEP 4: Check Account Lockout
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- STEP 5: Successful Login - Reset Counters
    UPDATE public.users
    SET
        failed_attempts = 0,
        locked_until = NULL,
        last_login_device = CASE
            WHEN p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%'
            THEN 'mobile' ELSE 'desktop'
        END
    WHERE id = v_user.id;

    RETURN QUERY SELECT
        v_user.id, v_user.name, v_user.email, v_user.role,
        v_user.level, v_user.difficulty, v_user.performance_index,
        v_user.preferred_locale, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schritt 3: Zugriffsrechte neu setzen
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- ✅ VERIFIKATION
-- ============================================================
-- Prüfe ob nur noch EINE Funktion existiert:
SELECT
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'verify_user_4digit_pin';

-- Erwartetes Ergebnis:
-- 1 Zeile: verify_user_4digit_pin | p_pin text, p_ip_address text DEFAULT NULL, p_user_agent text DEFAULT NULL | TABLE(...)

-- ============================================================
-- ✅ FIX ABGESCHLOSSEN
-- ============================================================
