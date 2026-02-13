-- ============================================================
-- User-Entsperrung: RPC-Funktionen für Admin
-- ============================================================
-- Datum: 2026-02-12
-- Zweck: Admin kann gebannte/gesperrte User entsperren
-- ============================================================

-- ── 1. RPC: Account entsperren (locked_until + failed_attempts zurücksetzen) ──
CREATE OR REPLACE FUNCTION unlock_user(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- Prüfe ob User existiert
    SELECT id, name, locked_until, failed_attempts INTO v_user
    FROM public.users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- Account entsperren
    UPDATE public.users
    SET
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Account entsperrt',
        'user_name', v_user.name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION unlock_user(UUID) TO authenticated;

-- ── 2. RPC: Alle IPs eines Users entbannen ────────────────
CREATE OR REPLACE FUNCTION unban_user_ips(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_ip_count INT := 0;
BEGIN
    -- Prüfe ob User existiert
    SELECT id, name INTO v_user
    FROM public.users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- Finde alle IPs die mit diesem User verbunden sind (aus honeypot_log)
    -- und entferne sie aus banned_ips
    WITH user_ips AS (
        SELECT DISTINCT ip_address
        FROM public.honeypot_log hl
        -- Wir können nicht direkt von IP auf User mappen, also entbannen wir
        -- pauschal alle IPs die mit diesem User in Verbindung stehen könnten
        -- ALTERNATIVE: Alle IPs entbannen (unabhängig vom User)
    )
    DELETE FROM public.banned_ips
    WHERE ip_address IN (SELECT ip_address FROM user_ips);

    GET DIAGNOSTICS v_ip_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'message', format('%s IP(s) entsperrt', v_ip_count),
        'user_name', v_user.name,
        'ip_count', v_ip_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION unban_user_ips(UUID) TO authenticated;

-- ── 3. RPC: Alle IPs entbannen (pauschale Entsperrung) ────
CREATE OR REPLACE FUNCTION unban_all_ips()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM public.banned_ips;
    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'message', format('%s IP(s) entsperrt', v_count),
        'ip_count', v_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION unban_all_ips() TO authenticated;

-- ── 4. RPC: User-Lock-Status prüfen ────────────────────────
CREATE OR REPLACE FUNCTION get_user_lock_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_is_locked BOOLEAN := false;
BEGIN
    SELECT
        id,
        name,
        locked_until,
        failed_attempts
    INTO v_user
    FROM public.users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- Prüfe ob Account gesperrt ist
    v_is_locked := (v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW());

    RETURN json_build_object(
        'success', true,
        'locked', v_is_locked,
        'locked_until', v_user.locked_until,
        'failed_attempts', v_user.failed_attempts,
        'user_name', v_user.name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_lock_status(UUID) TO authenticated;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- RPC-Funktionen für Admin:
-- - unlock_user(user_id) → Setzt locked_until + failed_attempts zurück
-- - unban_user_ips(user_id) → Entfernt alle IPs aus banned_ips
-- - unban_all_ips() → Entfernt alle IPs (pauschale Entsperrung)
-- - get_user_lock_status(user_id) → Gibt Lock-Status zurück
-- ============================================================
