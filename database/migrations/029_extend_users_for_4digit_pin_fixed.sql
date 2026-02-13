-- ============================================================
-- Nutzer-Tabelle erweitern für 4-stelligen PIN-Login (FIXED)
-- ============================================================
-- Erweitert die bestehende users-Tabelle um alle Felder für
-- den neuen 4-stelligen PIN-Login-Screen.
-- ============================================================

-- ── 1. Neue Spalten hinzufügen (idempotent) ──────────────
DO $$
BEGIN
    -- 4-stelliger PIN (zusätzlich zum 6-stelligen)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='users' AND column_name='pin_4digit') THEN
        ALTER TABLE public.users ADD COLUMN pin_4digit TEXT;
    END IF;

    -- Preply Username
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='users' AND column_name='preply') THEN
        ALTER TABLE public.users ADD COLUMN preply TEXT;
    END IF;

    -- Outside Preply Username
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='users' AND column_name='outside_preply') THEN
        ALTER TABLE public.users ADD COLUMN outside_preply TEXT;
    END IF;

    -- Fee pro Stunde
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='users' AND column_name='fee_per_hour') THEN
        ALTER TABLE public.users ADD COLUMN fee_per_hour NUMERIC(10, 2);
    END IF;

    -- Währung
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='users' AND column_name='currency') THEN
        ALTER TABLE public.users ADD COLUMN currency TEXT DEFAULT 'Euro';
    END IF;
END $$;

-- ── 2. CHECK-Constraints hinzufügen ───────────────────────
-- Currency-Constraint (nur wenn nicht vorhanden)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_currency_check'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_currency_check
        CHECK (currency IN ('Euro', 'Dollar'));
    END IF;
END $$;

-- ── 3. Index für schnelle PIN-Suche ───────────────────────
CREATE INDEX IF NOT EXISTS idx_users_pin_4digit ON public.users(pin_4digit);

-- ── 4. RPC-Funktion für 4-stelligen PIN-Login ─────────────
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
    user_preply TEXT,
    user_outside_preply TEXT,
    user_fee_per_hour NUMERIC,
    user_currency TEXT
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
        u.preply,
        u.outside_preply,
        u.fee_per_hour,
        u.currency
    FROM public.users u
    WHERE u.pin_4digit = p_pin
    LIMIT 1;
END;
$$;

-- ── 5. Zugriffsrechte für RPC-Funktion ───────────────────
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO authenticated;

-- ── 6. Testnutzer einfügen (5 Stück) ──────────────────────
-- WICHTIG: Nur einfügen wenn PIN noch nicht existiert (idempotent)
DO $$
BEGIN
    -- Nutzer 1: Anna Meier (PIN: 3741)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '3741') THEN
        INSERT INTO public.users (
            name, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Anna Meier', '3741', 'A1', 'easy', 'student',
            'anna_m', '-', 28.50, 'Euro', 'A1-easy'
        );
    END IF;

    -- Nutzer 2: Lukas Braun (PIN: 8192)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '8192') THEN
        INSERT INTO public.users (
            name, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Lukas Braun', '8192', 'A1', 'easy', 'student',
            'lukas_b', 'braun_outside', 32.00, 'Euro', 'A1-easy'
        );
    END IF;

    -- Nutzer 3: Sofia Müller (PIN: 5624)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '5624') THEN
        INSERT INTO public.users (
            name, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Sofia Müller', '5624', 'A1', 'easy', 'student',
            'sofia_m', '-', 25.00, 'Dollar', 'A1-easy'
        );
    END IF;

    -- Nutzer 4: Dimitris Papadopoulos (PIN: 7358)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '7358') THEN
        INSERT INTO public.users (
            name, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Dimitris Papadopoulos', '7358', 'A1', 'easy', 'student',
            'dimitris_p', 'papadopoulos_ext', 30.00, 'Euro', 'A1-easy'
        );
    END IF;

    -- Nutzer 5: Elena Schmidt (PIN: 9103)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '9103') THEN
        INSERT INTO public.users (
            name, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Elena Schmidt', '9103', 'A1', 'easy', 'student',
            'elena_s', '-', 27.50, 'Dollar', 'A1-easy'
        );
    END IF;

    RAISE NOTICE '✅ Testnutzer-Check abgeschlossen';
END $$;

-- ── 7. Verifizierung: Zähle eingefügte Nutzer ─────────────
DO $$
DECLARE
    user_count INT;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users WHERE role = 'student';
    RAISE NOTICE '📊 Anzahl Student-Nutzer in DB: %', user_count;
END $$;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- Ausführen in Supabase SQL Editor:
-- 1. Neue Spalten: pin_4digit, preply, outside_preply, fee_per_hour, currency
-- 2. RPC-Funktion: verify_user_4digit_pin(pin)
-- 3. 5 Testnutzer mit A1-easy Level (idempotent)
-- ============================================================
