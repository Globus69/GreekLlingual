-- ============================================================
-- Komplette Test-User Fix (Konsolidiert)
-- ============================================================
-- Stellt sicher dass:
-- 1. pin_4digit Spalte existiert
-- 2. Alle 5 Test-User existieren (3741, 8192, 5624, 7358, 9103)
-- 3. verify_user_4digit_pin RPC-Funktion korrekt funktioniert
-- ============================================================

-- ── 1. Prüfe und erstelle pin_4digit Spalte ────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'pin_4digit'
    ) THEN
        ALTER TABLE public.users ADD COLUMN pin_4digit TEXT;
        RAISE NOTICE 'Spalte pin_4digit hinzugefügt';
    ELSE
        RAISE NOTICE 'Spalte pin_4digit existiert bereits';
    END IF;
END $$;

-- ── 2. Erstelle oder aktualisiere Test-User ────────────────
-- User 1: Anna Meier (PIN 3741)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '3741') THEN
        INSERT INTO public.users (
            name, email, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Anna Meier', 'anna.meier@test.de', '3741', 'A1', 'easy', 'student',
            'anna_m', '-', 28.50, 'Euro', 'A1-easy'
        );
        RAISE NOTICE 'User Anna Meier (3741) erstellt';
    ELSE
        RAISE NOTICE 'User 3741 existiert bereits';
    END IF;
END $$;

-- User 2: Boris Schmidt (PIN 8192)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '8192') THEN
        INSERT INTO public.users (
            name, email, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Boris Schmidt', 'boris.schmidt@test.de', '8192', 'A1', 'easy', 'student',
            'boris_s', '-', 28.50, 'Euro', 'A1-easy'
        );
        RAISE NOTICE 'User Boris Schmidt (8192) erstellt';
    ELSE
        RAISE NOTICE 'User 8192 existiert bereits';
    END IF;
END $$;

-- User 3: Clara Weber (PIN 5624)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '5624') THEN
        INSERT INTO public.users (
            name, email, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Clara Weber', 'clara.weber@test.de', '5624', 'A1', 'easy', 'student',
            'clara_w', '-', 28.50, 'Euro', 'A1-easy'
        );
        RAISE NOTICE 'User Clara Weber (5624) erstellt';
    ELSE
        RAISE NOTICE 'User 5624 existiert bereits';
    END IF;
END $$;

-- User 4: David Müller (PIN 7358)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '7358') THEN
        INSERT INTO public.users (
            name, email, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'David Müller', 'david.mueller@test.de', '7358', 'A1', 'easy', 'student',
            'david_m', '-', 28.50, 'Euro', 'A1-easy'
        );
        RAISE NOTICE 'User David Müller (7358) erstellt';
    ELSE
        RAISE NOTICE 'User 7358 existiert bereits';
    END IF;
END $$;

-- User 5: Emma Fischer (PIN 9103)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = '9103') THEN
        INSERT INTO public.users (
            name, email, pin_4digit, level, difficulty, role,
            preply, outside_preply, fee_per_hour, currency, performance_index
        ) VALUES (
            'Emma Fischer', 'emma.fischer@test.de', '9103', 'A1', 'easy', 'student',
            'emma_f', '-', 28.50, 'Euro', 'A1-easy'
        );
        RAISE NOTICE 'User Emma Fischer (9103) erstellt';
    ELSE
        RAISE NOTICE 'User 9103 existiert bereits';
    END IF;
END $$;

-- ── 3. Prüfe ob RPC-Funktion existiert ─────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'verify_user_4digit_pin'
    ) THEN
        RAISE WARNING 'RPC-Funktion verify_user_4digit_pin existiert NICHT!';
        RAISE WARNING 'Bitte führe zuerst create_honeypot_pins_fixed.sql aus!';
    ELSE
        RAISE NOTICE 'RPC-Funktion verify_user_4digit_pin existiert';
    END IF;
END $$;

-- ── 4. Test-Abfrage: Alle Test-User anzeigen ───────────────
SELECT
    '✅ Test-User in Datenbank:' as status,
    COUNT(*) as anzahl
FROM public.users
WHERE pin_4digit IN ('3741', '8192', '5624', '7358', '9103');

SELECT
    name,
    pin_4digit,
    level,
    difficulty,
    role,
    performance_index
FROM public.users
WHERE pin_4digit IN ('3741', '8192', '5624', '7358', '9103')
ORDER BY pin_4digit;

-- ============================================================
-- ✅ Fertig!
-- ============================================================
-- Wenn du jetzt "5 Test-User" siehst, ist alles OK
-- Falls RPC-Warnung erscheint: Führe create_honeypot_pins_fixed.sql aus
-- ============================================================
