-- =====================================================
-- RPC Function: unlock_user
-- Beschreibung: Entsperrt einen User (setzt locked_until auf NULL)
-- Verwendung: Mobile Admin-Panel (Teacher entsperrt gesperrte Schüler)
-- =====================================================

-- Drop alte Version falls vorhanden (wegen Return-Type-Änderung)
DROP FUNCTION IF EXISTS unlock_user(UUID);

-- Neue Version mit erweiterten Return-Werten
CREATE OR REPLACE FUNCTION unlock_user(p_user_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    user_name TEXT
) AS $$
DECLARE
    v_user_name TEXT;
    v_locked_until TIMESTAMPTZ;
BEGIN
    -- Check if user exists
    SELECT name, locked_until INTO v_user_name, v_locked_until
    FROM users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'User nicht gefunden', NULL::TEXT;
        RETURN;
    END IF;

    -- Check if user is actually locked
    IF v_locked_until IS NULL OR v_locked_until < NOW() THEN
        RETURN QUERY SELECT FALSE, 'User ist nicht gesperrt', v_user_name;
        RETURN;
    END IF;

    -- Unlock user
    UPDATE users
    SET
        locked_until = NULL,
        failed_attempts = 0,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Return success
    RETURN QUERY SELECT TRUE, 'User erfolgreich entsperrt', v_user_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (Admin-Check erfolgt auf Client-Seite)
GRANT EXECUTE ON FUNCTION unlock_user(UUID) TO authenticated;

-- Comment
COMMENT ON FUNCTION unlock_user IS 'Entsperrt einen gesperrten User (nur für Admins auf Mobile)';
