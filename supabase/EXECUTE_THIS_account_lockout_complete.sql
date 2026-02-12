-- =====================================================
-- KOMBINIERTE MIGRATION: Account Lockout System
-- =====================================================
-- Datum: 2026-02-12
-- Zweck: Student + Admin Account Lockout (5 Fails = 15 Min)
-- ANLEITUNG: Diese Datei komplett im Supabase SQL Editor ausführen
-- =====================================================

-- ========================================
-- TEIL 1: STUDENT ACCOUNT LOCKOUT
-- ========================================

-- RPC: verify_user_4digit_pin (MIT Account Lockout)
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

GRANT EXECUTE ON FUNCTION verify_user_4digit_pin(TEXT, TEXT, TEXT) TO anon, authenticated;

-- RPC: record_failed_login_attempt
CREATE OR REPLACE FUNCTION record_failed_login_attempt(p_pin TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_new_attempts INT;
    v_locked_until TIMESTAMP;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE pin_4digit = p_pin LIMIT 1;
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'PIN not found');
    END IF;

    UPDATE public.users
    SET
        failed_attempts = failed_attempts + 1,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
    WHERE id = v_user_id
    RETURNING failed_attempts, locked_until INTO v_new_attempts, v_locked_until;

    IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
        RETURN json_build_object('success', true, 'locked', true, 'attempts', v_new_attempts,
            'locked_until', v_locked_until, 'message', 'Account locked for 15 minutes');
    ELSE
        RETURN json_build_object('success', true, 'locked', false, 'attempts', v_new_attempts,
            'remaining', 5 - v_new_attempts, 'message', format('%s attempts remaining', 5 - v_new_attempts));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_failed_login_attempt(TEXT) TO anon, authenticated;

-- RPC: check_account_lockout_status
CREATE OR REPLACE FUNCTION check_account_lockout_status(p_pin TEXT)
RETURNS JSON AS $$
DECLARE v_user RECORD;
BEGIN
    SELECT id, failed_attempts, locked_until INTO v_user FROM public.users WHERE pin_4digit = p_pin LIMIT 1;
    IF NOT FOUND THEN
        RETURN json_build_object('found', false);
    END IF;
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN json_build_object('found', true, 'locked', true, 'locked_until', v_user.locked_until,
            'attempts', v_user.failed_attempts, 'message', 'Account is locked');
    ELSE
        RETURN json_build_object('found', true, 'locked', false, 'attempts', v_user.failed_attempts,
            'remaining', 5 - v_user.failed_attempts, 'message', 'Account is active');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_account_lockout_status(TEXT) TO anon, authenticated;

-- ========================================
-- TEIL 2: ADMIN ACCOUNT LOCKOUT
-- ========================================

-- RPC: record_admin_failed_login_attempt
CREATE OR REPLACE FUNCTION record_admin_failed_login_attempt(p_name TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_new_attempts INT;
    v_locked_until TIMESTAMP;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE name = p_name AND role = 'admin' LIMIT 1;
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;

    UPDATE public.users
    SET
        failed_attempts = failed_attempts + 1,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
    WHERE id = v_user_id
    RETURNING failed_attempts, locked_until INTO v_new_attempts, v_locked_until;

    IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
        RETURN json_build_object('success', true, 'locked', true, 'attempts', v_new_attempts,
            'locked_until', v_locked_until, 'message', 'Admin account locked for 15 minutes');
    ELSE
        RETURN json_build_object('success', true, 'locked', false, 'attempts', v_new_attempts,
            'remaining', 5 - v_new_attempts, 'message', format('%s attempts remaining', 5 - v_new_attempts));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_admin_failed_login_attempt(TEXT) TO anon, authenticated;

-- RPC: check_admin_lockout_status
CREATE OR REPLACE FUNCTION check_admin_lockout_status(p_name TEXT)
RETURNS JSON AS $$
DECLARE v_user RECORD;
BEGIN
    SELECT id, failed_attempts, locked_until INTO v_user FROM public.users WHERE name = p_name AND role = 'admin' LIMIT 1;
    IF NOT FOUND THEN
        RETURN json_build_object('found', false);
    END IF;
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN json_build_object('found', true, 'locked', true, 'locked_until', v_user.locked_until,
            'attempts', v_user.failed_attempts, 'message', 'Admin account is locked');
    ELSE
        RETURN json_build_object('found', true, 'locked', false, 'attempts', v_user.failed_attempts,
            'remaining', 5 - v_user.failed_attempts, 'message', 'Admin account is active');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_admin_lockout_status(TEXT) TO anon, authenticated;

-- RPC: verify_user_pin (MIT Account Lockout)
CREATE OR REPLACE FUNCTION verify_user_pin(p_name TEXT, p_pin TEXT)
RETURNS TABLE (
    user_id UUID, user_name TEXT, user_email TEXT, user_role TEXT,
    user_level TEXT, user_difficulty TEXT, user_performance_index TEXT,
    user_preferred_locale TEXT, error TEXT
) AS $$
DECLARE
    v_user RECORD;
    v_pin_valid BOOLEAN := false;
BEGIN
    SELECT * INTO v_user FROM public.users WHERE name = p_name LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid credentials'::TEXT;
        RETURN;
    END IF;

    -- CHECK 1: Account Lockout
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- CHECK 2: PIN-Validierung (bcrypt)
    IF v_user.pin_hash IS NOT NULL THEN
        v_pin_valid := (v_user.pin_hash = crypt(p_pin, v_user.pin_hash));
    ELSIF v_user.pin IS NOT NULL THEN
        v_pin_valid := (v_user.pin = p_pin);
    ELSE
        v_pin_valid := false;
    END IF;

    IF v_pin_valid THEN
        UPDATE public.users SET failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;
        RETURN QUERY SELECT v_user.id, v_user.name, v_user.email, v_user.role,
            v_user.level, v_user.difficulty, v_user.performance_index,
            v_user.preferred_locale, NULL::TEXT;
    ELSE
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid credentials'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_user_pin(TEXT, TEXT) TO anon, authenticated;

-- ========================================
-- TEIL 3: PERFORMANCE INDIZES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_locked_until
ON public.users(locked_until) WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_failed_attempts
ON public.users(failed_attempts) WHERE failed_attempts > 0;

-- =====================================================
-- MIGRATION ABGESCHLOSSEN
-- =====================================================
-- Teste die Funktionen mit:
-- SELECT check_account_lockout_status('3741');
-- SELECT check_admin_lockout_status('Admin');
-- =====================================================
