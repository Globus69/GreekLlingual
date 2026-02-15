-- ============================================================
-- Device-Type Tracking für PIN-Login (FIXED VERSION)
-- ============================================================
-- Fügt Device-Typ-Tracking zur users-Tabelle hinzu
-- Nutzer wählt beim Login: Desktop oder Mobile
-- ============================================================

-- ── 1. Spalte für letzten Login-Device-Typ hinzufügen ──────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login_device TEXT DEFAULT 'mobile';

-- ── 2. CHECK-Constraint für erlaubte Werte ─────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_device_check'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_device_check
        CHECK (last_login_device IN ('desktop', 'mobile'));
    END IF;
END $$;

-- ── 3. Alle alten Versionen der Funktion löschen ───────────
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, INET) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT) CASCADE;

-- ── 4. RPC-Funktion NEU erstellen mit last_login_device ────
CREATE FUNCTION verify_user_4digit_pin(
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
    user_last_login_device TEXT,
    error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_is_honeypot BOOLEAN;
    v_ban_reason TEXT;
BEGIN
    -- STEP 1: Check IP Ban
    IF p_ip_address IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.banned_ips
        WHERE ip_address = p_ip_address
        AND banned_until > NOW()
    ) THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- STEP 2: Check Honeypot PIN
    SELECT EXISTS (
        SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin
    ) INTO v_is_honeypot;

    IF v_is_honeypot THEN
        v_ban_reason := 'Honeypot PIN: ' || p_pin;
        IF p_ip_address IS NOT NULL THEN
            INSERT INTO public.honeypot_log (ip_address, pin_attempted, user_agent, ban_reason)
            VALUES (p_ip_address, p_pin, p_user_agent, v_ban_reason);
            INSERT INTO public.banned_ips (ip_address, reason, banned_until)
            VALUES (p_ip_address, v_ban_reason, NOW() + INTERVAL '24 hours')
            ON CONFLICT (ip_address) DO UPDATE
            SET banned_until = NOW() + INTERVAL '24 hours', reason = v_ban_reason;
        END IF;
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- STEP 3: Find User by PIN
    SELECT * INTO v_user FROM public.users WHERE pin_4digit = p_pin LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid PIN'::TEXT;
        RETURN;
    END IF;

    -- STEP 4: Check Account Lockout
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- STEP 5: Successful Login - Reset Counters & Update Device
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
        v_user.preferred_locale, v_user.last_login_device, NULL::TEXT;
END;
$$;

-- ── 5. RPC-Funktion: Device-Typ updaten ────────────────────
CREATE OR REPLACE FUNCTION update_user_device(
    p_user_id UUID,
    p_device_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validierung
    IF p_device_type NOT IN ('desktop', 'mobile') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid device type');
    END IF;

    -- Update
    UPDATE public.users
    SET last_login_device = p_device_type
    WHERE id = p_user_id;

    RETURN json_build_object('success', true, 'device_type', p_device_type);
END;
$$;

-- ── 6. Zugriffsrechte für RPC-Funktionen ───────────────────
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_device TO anon;
GRANT EXECUTE ON FUNCTION update_user_device TO authenticated;

-- ── 7. Bestehende User auf 'mobile' setzen (Default) ──────
UPDATE public.users
SET last_login_device = 'mobile'
WHERE last_login_device IS NULL;

-- ============================================================
-- ✅ VERIFIKATION
-- ============================================================
-- Prüfe ob nur noch EINE Funktion existiert:
SELECT
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'verify_user_4digit_pin';

-- Erwartetes Ergebnis: 1 Zeile

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- Diese Version:
-- - Löscht ALLE alten Funktionen zuerst (DROP FUNCTION)
-- - Erstellt dann die neue Version mit last_login_device
-- - Fügt update_user_device() Funktion hinzu
-- ============================================================
