-- Migration 107: Update verify_user_4digit_pin to return popup versioning columns
-- This fixes the issue where mobie users (using 4-digit PIN) did not get their popup acknowledgment status

-- 1. Drop existing function to change return type
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, TEXT, TEXT);

-- 2. Recreate verify_user_4digit_pin with additional columns
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
    user_acknowledged_manual_version TEXT,
    user_acknowledged_swipe_tutorial_version TEXT,
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
    -- 1) IP-Ban-Check
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
                NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'IP banned'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- 2) Honeypot-Check
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='honeypot_pins') THEN
        IF EXISTS(SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin) THEN
            RETURN QUERY SELECT
                NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
                NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
                NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Honeypot detected'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- 3) User suchen
    SELECT * INTO v_user
    FROM public.users
    WHERE pin = p_pin
      AND role = 'student'
      AND LENGTH(TRIM(pin)) = 4
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'PIN not found'::TEXT;
        RETURN;
    END IF;

    -- 4) Account-Lock-Check
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::NUMERIC, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Account locked. Try again later.'::TEXT;
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
        v_user.acknowledged_manual_version,
        v_user.acknowledged_swipe_tutorial_version,
        NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_user_4digit_pin(TEXT, TEXT, TEXT) TO anon, authenticated;
