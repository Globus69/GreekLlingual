-- ============================================================
-- TEST: Prüfe ob RPC-Funktion verify_user_4digit_pin funktioniert
-- ============================================================

-- Schritt 1: Prüfe ob Funktion existiert
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'verify_user_4digit_pin';

-- Erwartetes Ergebnis:
-- routine_name              | routine_type | data_type
-- --------------------------|--------------|----------
-- verify_user_4digit_pin    | FUNCTION     | USER-DEFINED

-- Falls LEER → Funktion existiert NICHT!
-- Lösung: Führe database/migrations/001_verify_user_4digit_pin_complete.sql aus


-- ============================================================
-- Schritt 2: Teste RPC-Funktion mit PIN 3741
-- ============================================================

SELECT * FROM verify_user_4digit_pin(
    p_pin := '3741',
    p_ip_address := NULL,
    p_user_agent := 'Test'
);

-- Erwartetes Ergebnis (Tabelle mit User-Daten):
-- user_id      | user_name  | user_email           | user_role | user_level | error
-- -------------|------------|----------------------|-----------|------------|-------
-- <uuid>       | Anna Meier | anna.meier@test.de   | student   | A1         | NULL

-- Falls FEHLER "function does not exist":
-- → Führe unten stehende CREATE FUNCTION aus

-- Falls error = 'Account locked':
-- → Führe unten stehende UNLOCK aus


-- ============================================================
-- FALLBACK: RPC-Funktion manuell erstellen (falls nicht vorhanden)
-- ============================================================

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
BEGIN
    -- Suche User mit PIN (vereinfachte Version ohne Security-Checks)
    SELECT
        id,
        name,
        email,
        role,
        level,
        difficulty,
        performance_index,
        preferred_locale,
        preply,
        outside_preply,
        fee_per_hour,
        currency,
        locked_until
    INTO v_user
    FROM users
    WHERE pin_4digit = p_pin;

    -- User nicht gefunden
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::NUMERIC, NULL::TEXT, 'PIN not found'::TEXT;
        RETURN;
    END IF;

    -- Account locked?
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::NUMERIC, NULL::TEXT, 'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- Login erfolgreich
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
        NULL::TEXT; -- error = NULL → success
END;
$$;


-- ============================================================
-- UNLOCK: Falls Account gesperrt ist
-- ============================================================

UPDATE users
SET failed_attempts = 0, locked_until = NULL
WHERE pin_4digit = '3741';


-- ============================================================
-- ZUSAMMENFASSUNG
-- ============================================================

-- 1. Führe SCHRITT 1 aus → Prüfe ob Funktion existiert
-- 2. Führe SCHRITT 2 aus → Teste ob Login funktioniert
-- 3. Falls Fehler → Führe FALLBACK aus (CREATE FUNCTION)
-- 4. Falls Account locked → Führe UNLOCK aus
-- 5. Teste erneut im Browser: http://localhost:3000/login-pin → PIN 3741
