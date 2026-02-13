-- ============================================================
-- Device-Type Tracking für PIN-Login
-- ============================================================
-- Fügt Device-Typ-Tracking zur users-Tabelle hinzu
-- Nutzer wählt beim Login: Desktop oder Mobile
-- ============================================================

-- ── 1. Spalte für letzten Login-Device-Typ hinzufügen ──────
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login_device TEXT DEFAULT 'mobile';

-- ── 2. CHECK-Constraint für erlaubte Werte ─────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_device_check'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_device_check
        CHECK (last_login_device IN ('desktop', 'mobile'));
    END IF;
END $$;

-- ── 3. RPC-Funktion erweitern: Device-Typ zurückgeben ──────
CREATE OR REPLACE FUNCTION verify_user_4digit_pin(p_pin TEXT)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_role TEXT,
    user_level TEXT,
    user_difficulty TEXT,
    user_performance_index TEXT,
    user_preferred_locale TEXT,
    user_last_login_device TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.level,
        u.difficulty,
        u.performance_index,
        u.preferred_locale,
        u.last_login_device
    FROM public.users u
    WHERE u.pin_4digit = p_pin
    LIMIT 1;
END;
$$;

-- ── 4. RPC-Funktion: Device-Typ updaten ────────────────────
CREATE OR REPLACE FUNCTION update_user_device(
    p_user_id UUID,
    p_device_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validierung
    IF p_device_type NOT IN ('desktop', 'mobile') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid device type');
    END IF;

    -- Update
    UPDATE public.users
    SET last_login_device = p_device_type
    WHERE id = p_user_id;

    RETURN json_build_object('success', true, 'device_type', p_device_type);
END;
$$;

-- ── 5. Zugriffsrechte für RPC-Funktionen ───────────────────
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_device TO anon;
GRANT EXECUTE ON FUNCTION update_user_device TO authenticated;

-- ── 6. Bestehende User auf 'mobile' setzen (Default) ──────
UPDATE public.users
SET last_login_device = 'mobile'
WHERE last_login_device IS NULL;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- Ausführen in Supabase SQL Editor:
-- - Spalte last_login_device hinzugefügt
-- - CHECK-Constraint (desktop/mobile)
-- - RPC-Funktion verify_user_4digit_pin() erweitert
-- - RPC-Funktion update_user_device() erstellt
-- ============================================================
