-- =====================================================
-- Admin Account Lockout System
-- =====================================================
-- Autor: Claude Sonnet 4.5
-- Datum: 2026-02-12
-- Zweck: Account Lockout für Admin-Login (6-stelliger PIN)
-- =====================================================

-- =====================================================
-- RPC: record_admin_failed_login_attempt (NEU)
-- =====================================================
-- Für Admin-Login mit Name + 6-stelligem PIN

CREATE OR REPLACE FUNCTION record_admin_failed_login_attempt(
    p_name TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_new_attempts INT;
    v_locked_until TIMESTAMP;
BEGIN
    -- Finde User-ID für diesen Namen
    SELECT id INTO v_user_id
    FROM public.users
    WHERE name = p_name
    AND role = 'admin'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        -- User nicht gefunden - nichts zu tun
        RETURN json_build_object('success', false, 'message', 'User not found');
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
            'message', 'Admin account locked for 15 minutes'
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
GRANT EXECUTE ON FUNCTION record_admin_failed_login_attempt(TEXT) TO anon, authenticated;

-- =====================================================
-- RPC: check_admin_lockout_status (NEU)
-- =====================================================

CREATE OR REPLACE FUNCTION check_admin_lockout_status(
    p_name TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user RECORD;
BEGIN
    SELECT id, failed_attempts, locked_until
    INTO v_user
    FROM public.users
    WHERE name = p_name
    AND role = 'admin'
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
            'message', 'Admin account is locked'
        );
    ELSE
        RETURN json_build_object(
            'found', true,
            'locked', false,
            'attempts', v_user.failed_attempts,
            'remaining', 5 - v_user.failed_attempts,
            'message', 'Admin account is active'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Execute Rechte
GRANT EXECUTE ON FUNCTION check_admin_lockout_status(TEXT) TO anon, authenticated;

-- =====================================================
-- RPC: verify_user_pin mit Account Lockout erweitern
-- =====================================================
-- Erweitert die bestehende verify_user_pin() um Lockout-Check

CREATE OR REPLACE FUNCTION verify_user_pin(
    p_name TEXT,
    p_pin TEXT
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
    v_pin_valid BOOLEAN := false;
BEGIN
    -- Hole User-Daten
    SELECT * INTO v_user
    FROM public.users
    WHERE name = p_name
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid credentials'::TEXT;
        RETURN;
    END IF;

    -- ========================================
    -- CHECK 1: Account Lockout
    -- ========================================
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- ========================================
    -- CHECK 2: PIN-Validierung (bcrypt)
    -- ========================================
    IF v_user.pin_hash IS NOT NULL THEN
        -- Bcrypt-Validierung
        v_pin_valid := (v_user.pin_hash = crypt(p_pin, v_user.pin_hash));
    ELSIF v_user.pin IS NOT NULL THEN
        -- Legacy: Klartext-PIN (fallback)
        v_pin_valid := (v_user.pin = p_pin);
    ELSE
        -- Kein PIN gesetzt
        v_pin_valid := false;
    END IF;

    -- ========================================
    -- Erfolgreicher Login
    -- ========================================
    IF v_pin_valid THEN
        -- Reset failed_attempts
        UPDATE public.users
        SET failed_attempts = 0, locked_until = NULL
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
    ELSE
        -- Fehlgeschlagener Login
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid credentials'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Execute Rechte
GRANT EXECUTE ON FUNCTION verify_user_pin(TEXT, TEXT) TO anon, authenticated;

-- =====================================================
-- Test-Queries
-- =====================================================

-- Test 1: Admin 4 Fehlversuche
-- SELECT record_admin_failed_login_attempt('Admin');
-- SELECT record_admin_failed_login_attempt('Admin');
-- SELECT record_admin_failed_login_attempt('Admin');
-- SELECT record_admin_failed_login_attempt('Admin');
-- Erwartung: {"locked": false, "remaining": 1}

-- Test 2: 5. Fehlversuch → Lock
-- SELECT record_admin_failed_login_attempt('Admin');
-- Erwartung: {"locked": true}

-- Test 3: Status prüfen
-- SELECT check_admin_lockout_status('Admin');

-- Test 4: Login während Lock
-- SELECT * FROM verify_user_pin('Admin', '1234');
-- Erwartung: error = 'Account locked. Try again later.'

-- =====================================================
-- Ende der Migration
-- =====================================================
