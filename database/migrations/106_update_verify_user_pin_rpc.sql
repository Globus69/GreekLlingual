-- Migration 106: Update verify_user_pin to return popup versioning columns
-- Date: 2026-02-23

-- Since we are changing the return type (adding columns), we must drop the function first
DROP FUNCTION IF EXISTS verify_user_pin(text, text);

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
    user_acknowledged_manual_version TEXT,
    user_acknowledged_swipe_tutorial_version TEXT,
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
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid credentials'::TEXT;
        RETURN;
    END IF;

    -- ========================================
    -- CHECK 1: Account Lockout
    -- ========================================
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
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
            v_user.acknowledged_manual_version,
            v_user.acknowledged_swipe_tutorial_version,
            NULL::TEXT;  -- Kein Fehler
    ELSE
        -- Fehlgeschlagener Login
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid credentials'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions again after drop/create
GRANT EXECUTE ON FUNCTION verify_user_pin(text, text) TO anon, authenticated;
