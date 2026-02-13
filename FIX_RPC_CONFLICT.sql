-- ============================================================
-- FIX: RPC Function Overloading Conflict
-- ============================================================
-- Problem: Zwei Versionen von verify_user_4digit_pin existieren
-- Eine mit inet, eine mit text Parameter
-- ============================================================

-- Schritt 1: Alle Versionen der Funktion löschen
DROP FUNCTION IF EXISTS verify_user_4digit_pin(text, inet, text);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(text, text, text);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(p_pin text, p_ip_address inet, p_user_agent text);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(p_pin text, p_ip_address text, p_user_agent text);

-- Schritt 2: Korrekte Version neu erstellen (mit TEXT Parameter)
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
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::NUMERIC, NULL::TEXT, 'Honeypot detected'::TEXT;
        RETURN;
    END IF;

    -- 3) User suchen
    SELECT * INTO v_user FROM public.users WHERE pin_4digit = p_pin LIMIT 1;

    IF NOT FOUND THEN
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
        NULL::TEXT;
END;
$$;

-- Schritt 3: Zugriffsrechte setzen
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO authenticated;

-- Schritt 4: Test
SELECT * FROM verify_user_4digit_pin(
    p_pin := '3741',
    p_ip_address := NULL,
    p_user_agent := 'Test'
);

-- Erwartetes Ergebnis: User-Daten mit error = NULL
