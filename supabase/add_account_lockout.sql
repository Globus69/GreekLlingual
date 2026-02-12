-- =====================================================
-- Account Lockout System
-- =====================================================
-- Autor: Claude Sonnet 4.5
-- Datum: 2026-02-12
-- Zweck: 5 Fehlversuche → 15 Min. Sperre
-- =====================================================

-- Spalten failed_attempts und locked_until existieren bereits
-- (wurden in fix_student_management_v2.sql erstellt)
-- Diese Migration aktualisiert die verify_user_4digit_pin() RPC-Funktion

-- =====================================================
-- RPC: verify_user_4digit_pin (MIT Account Lockout)
-- =====================================================

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
    -- ========================================
    -- STEP 1: Check IP Ban
    -- ========================================
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

    -- ========================================
    -- STEP 2: Check Honeypot PIN
    -- ========================================
    SELECT EXISTS (
        SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin
    ) INTO v_is_honeypot;

    IF v_is_honeypot THEN
        -- Log Honeypot-Versuch
        v_ban_reason := 'Honeypot PIN: ' || p_pin;

        INSERT INTO public.honeypot_log (ip_address, pin_attempted, user_agent, ban_reason)
        VALUES (p_ip_address, p_pin, p_user_agent, v_ban_reason);

        -- Ban IP für 24 Stunden
        INSERT INTO public.banned_ips (ip_address, reason, banned_until)
        VALUES (p_ip_address, v_ban_reason, NOW() + INTERVAL '24 hours')
        ON CONFLICT (ip_address) DO UPDATE
        SET banned_until = NOW() + INTERVAL '24 hours',
            reason = v_ban_reason;

        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- ========================================
    -- STEP 3: Find User by PIN
    -- ========================================
    SELECT * INTO v_user
    FROM public.users
    WHERE pin_4digit = p_pin
    LIMIT 1;

    IF NOT FOUND THEN
        -- PIN nicht gefunden
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid PIN'::TEXT;
        RETURN;
    END IF;

    -- ========================================
    -- STEP 4: Check Account Lockout
    -- ========================================
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        -- Account gesperrt
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- ========================================
    -- STEP 5: Successful Login - Reset Counters
    -- ========================================
    UPDATE public.users
    SET
        failed_attempts = 0,
        locked_until = NULL,
        last_login_device = CASE
            WHEN p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%'
            THEN 'mobile'
            ELSE 'desktop'
        END
    WHERE id = v_user.id;

    -- Return User-Daten
    RETURN QUERY SELECT
        v_user.id,
        v_user.name,
        v_user.email,
        v_user.role,
        v_user.level,
        v_user.difficulty,
        v_user.performance_index,
        v_user.preferred_locale,
        NULL::TEXT;  -- Kein Fehler
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Execute Rechte
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin(TEXT, TEXT, TEXT) TO anon, authenticated;

-- =====================================================
-- RPC: record_failed_login_attempt (NEU)
-- =====================================================
-- Diese Funktion wird client-seitig nach fehlgeschlagenem Login aufgerufen

CREATE OR REPLACE FUNCTION record_failed_login_attempt(
    p_pin TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_new_attempts INT;
    v_locked_until TIMESTAMP;
BEGIN
    -- Finde User-ID für diesen PIN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE pin_4digit = p_pin
    LIMIT 1;

    IF v_user_id IS NULL THEN
        -- PIN nicht gefunden - nichts zu tun
        RETURN json_build_object('success', false, 'message', 'PIN not found');
    END IF;

    -- Increment failed_attempts
    UPDATE public.users
    SET
        failed_attempts = failed_attempts + 1,
        locked_until = CASE
            WHEN failed_attempts + 1 >= 5
            THEN NOW() + INTERVAL '15 minutes'
            ELSE locked_until
        END
    WHERE id = v_user_id
    RETURNING failed_attempts, locked_until
    INTO v_new_attempts, v_locked_until;

    -- Return Status
    IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
        RETURN json_build_object(
            'success', true,
            'locked', true,
            'attempts', v_new_attempts,
            'locked_until', v_locked_until,
            'message', 'Account locked for 15 minutes'
        );
    ELSE
        RETURN json_build_object(
            'success', true,
            'locked', false,
            'attempts', v_new_attempts,
            'remaining', 5 - v_new_attempts,
            'message', format('%s attempts remaining', 5 - v_new_attempts)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Execute Rechte
GRANT EXECUTE ON FUNCTION record_failed_login_attempt(TEXT) TO anon, authenticated;

-- =====================================================
-- RPC: check_account_lockout_status (NEU)
-- =====================================================
-- Prüft ob ein Account gesperrt ist (vor dem Login)

CREATE OR REPLACE FUNCTION check_account_lockout_status(
    p_pin TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user RECORD;
BEGIN
    SELECT id, failed_attempts, locked_until
    INTO v_user
    FROM public.users
    WHERE pin_4digit = p_pin
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('found', false);
    END IF;

    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN json_build_object(
            'found', true,
            'locked', true,
            'locked_until', v_user.locked_until,
            'attempts', v_user.failed_attempts,
            'message', 'Account is locked'
        );
    ELSE
        RETURN json_build_object(
            'found', true,
            'locked', false,
            'attempts', v_user.failed_attempts,
            'remaining', 5 - v_user.failed_attempts,
            'message', 'Account is active'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Execute Rechte
GRANT EXECUTE ON FUNCTION check_account_lockout_status(TEXT) TO anon, authenticated;

-- =====================================================
-- Index für Performance
-- =====================================================

-- Index auf locked_until für schnelle Lockout-Checks
CREATE INDEX IF NOT EXISTS idx_users_locked_until
ON public.users(locked_until)
WHERE locked_until IS NOT NULL;

-- Index auf failed_attempts
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts
ON public.users(failed_attempts)
WHERE failed_attempts > 0;

-- =====================================================
-- Aufräum-Job (Optional - manuell ausführen)
-- =====================================================
-- Setzt abgelaufene Locks zurück (sollte normalerweise automatisch passieren)

-- UPDATE public.users
-- SET locked_until = NULL, failed_attempts = 0
-- WHERE locked_until IS NOT NULL AND locked_until < NOW();

-- =====================================================
-- Test-Queries (zur Validierung)
-- =====================================================

-- Test 1: User mit 4 Fehlversuchen (noch nicht gesperrt)
-- SELECT record_failed_login_attempt('3741');
-- SELECT record_failed_login_attempt('3741');
-- SELECT record_failed_login_attempt('3741');
-- SELECT record_failed_login_attempt('3741');
-- Erwartung: {"locked": false, "remaining": 1}

-- Test 2: 5. Fehlversuch → Account Lock
-- SELECT record_failed_login_attempt('3741');
-- Erwartung: {"locked": true, "locked_until": "..."}

-- Test 3: Status prüfen
-- SELECT check_account_lockout_status('3741');
-- Erwartung: {"locked": true}

-- Test 4: Login während Lock
-- SELECT * FROM verify_user_4digit_pin('3741', '127.0.0.1', 'test');
-- Erwartung: error = 'Account locked. Try again later.'

-- =====================================================
-- Ende der Migration
-- =====================================================
