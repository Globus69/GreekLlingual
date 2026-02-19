-- Migration: 079_fix_verify_user_4digit_pin_v2.sql
-- Description: Fix verify_user_4digit_pin - DROP first then recreate
-- Date: 2026-02-19

-- ══════════════════════════════════════════════════════════════════════
-- CRITICAL FIX: Drop and recreate verify_user_4digit_pin
-- Uses 'pin' column instead of non-existent 'pin_4digit'
-- ══════════════════════════════════════════════════════════════════════

-- 1. Drop existing functions
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS record_failed_login_attempt(TEXT);

-- 2. Recreate verify_user_4digit_pin with correct column names
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
    error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_is_banned BOOLEAN;
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

    -- 2) Honeypot-Check (if table exists)
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='honeypot_pins') THEN
        IF EXISTS(SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin) THEN
            RETURN QUERY SELECT
                NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
                NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
                NULL::NUMERIC, NULL::TEXT, 'Honeypot detected'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- 3) User suchen (FIXED: use 'pin' column instead of 'pin_4digit')
    -- Search for students with 4-digit PIN
    SELECT * INTO v_user
    FROM public.users
    WHERE pin = p_pin
      AND role = 'student'
      AND LENGTH(TRIM(pin)) = 4
    LIMIT 1;

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
        COALESCE(v_user.preferred_locale, 'en'),
        v_user.preply,
        v_user.outside_preply,
        v_user.fee_per_hour,
        v_user.currency,
        NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_user_4digit_pin(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 3. Recreate record_failed_login_attempt
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
    -- User finden (FIXED: use 'pin' column instead of 'pin_4digit')
    SELECT id, failed_attempts INTO v_user_id, v_attempts
    FROM public.users
    WHERE pin = p_pin
      AND role = 'student'
      AND LENGTH(TRIM(pin)) = 4
    LIMIT 1;

    IF FOUND THEN
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
        RETURN QUERY SELECT FALSE, 0;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION record_failed_login_attempt(TEXT) TO anon, authenticated;

-- Migration 079 completed
DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 079 completed successfully';
    RAISE NOTICE '   - Dropped old verify_user_4digit_pin';
    RAISE NOTICE '   - Recreated with correct pin column';
    RAISE NOTICE '   - 4-digit student PIN login should now work';
    RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;
