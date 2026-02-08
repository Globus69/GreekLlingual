-- ============================================================
-- Migration: preferred_locale Spalte zu users hinzufuegen
-- Speichert die bevorzugte UI-Sprache pro User (en/ru)
-- Idempotent – kann beliebig oft ausgefuehrt werden
-- ============================================================

-- 1. Spalte hinzufuegen (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'preferred_locale'
    ) THEN
        ALTER TABLE public.users ADD COLUMN preferred_locale TEXT DEFAULT 'en';
        RAISE NOTICE 'Spalte preferred_locale hinzugefuegt';
    ELSE
        RAISE NOTICE 'Spalte preferred_locale existiert bereits';
    END IF;
END $$;

-- 2. CHECK-Constraint (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND constraint_name = 'users_preferred_locale_check'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_preferred_locale_check
            CHECK (preferred_locale IN ('en', 'ru', 'el', 'de'));
        RAISE NOTICE 'CHECK-Constraint fuer preferred_locale hinzugefuegt';
    END IF;
END $$;

-- 3. RPC: Sprache aktualisieren (fuer eingeloggte User)
CREATE OR REPLACE FUNCTION update_user_locale(p_user_id UUID, p_locale TEXT)
RETURNS JSON AS $$
BEGIN
    IF p_locale NOT IN ('en', 'ru', 'el', 'de') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid locale. Must be en, ru, el or de.');
    END IF;

    UPDATE public.users
    SET preferred_locale = p_locale
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found.');
    END IF;

    RETURN json_build_object('success', true, 'locale', p_locale);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_locale TO anon;
GRANT EXECUTE ON FUNCTION update_user_locale TO authenticated;

-- 4. verify_user_pin erweitern: preferred_locale zurueckgeben
-- Alte Version droppen (Rueckgabe-Signatur aendert sich)
DROP FUNCTION IF EXISTS verify_user_pin(TEXT, TEXT);

CREATE OR REPLACE FUNCTION verify_user_pin(p_name TEXT, p_pin TEXT)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_role TEXT,
    user_level TEXT,
    user_difficulty TEXT,
    user_performance_index TEXT,
    user_preferred_locale TEXT
) AS $$
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
        COALESCE(u.preferred_locale, 'en')
    FROM public.users u
    WHERE LOWER(u.name) = LOWER(p_name)
      AND u.pin_hash = crypt(p_pin, u.pin_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_user_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_pin TO authenticated;

DO $$ BEGIN RAISE NOTICE 'Migration preferred_locale abgeschlossen'; END $$;
