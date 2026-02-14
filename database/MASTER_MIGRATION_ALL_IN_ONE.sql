-- ============================================================
-- Fix v2: Student-Management – Konsolidierte Migration
-- ============================================================
-- ERSTELLT die users-Tabelle von Grund auf (falls nicht vorhanden)
-- und fuegt alle benoetigten Spalten, Constraints, RPC-Funktionen hinzu.
--
-- Diese Datei ist die EINZIGE die ausgefuehrt werden muss!
-- Sie ersetzt: schema.sql (users-Teil), create_users_table.sql,
--              fix_student_management.sql
--
-- Kann beliebig oft sicher ausgefuehrt werden (idempotent).
-- ============================================================

-- ── 1. Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Users-Tabelle erstellen (falls nicht vorhanden) ───────
-- Erstellt die Tabelle mit ALLEN benoetigten Spalten auf einmal.
-- Wenn die Tabelle bereits existiert, wird nichts geaendert.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,                          -- nullable: Schueler brauchen keine Email
    pin TEXT,                                   -- Legacy Klartext-PIN (nullable)
    name TEXT,                                  -- Login-Name
    pin_hash TEXT,                              -- bcrypt-gehashter PIN
    whatsapp TEXT,                              -- Optional: WhatsApp-Nummer
    role TEXT NOT NULL DEFAULT 'student',        -- admin oder student
    level TEXT DEFAULT 'A1',                    -- Sprachniveau: A1, A2, B1, B2
    difficulty TEXT DEFAULT 'easy',             -- Schwierigkeit: easy, middle, hard
    performance_index TEXT DEFAULT 'A1-easy',   -- Zusammengesetzter Key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. Fehlende Spalten hinzufuegen (fuer bestehende Tabellen) ──
-- Falls die Tabelle schon existiert aber Spalten fehlen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='name') THEN
        ALTER TABLE public.users ADD COLUMN name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='pin_hash') THEN
        ALTER TABLE public.users ADD COLUMN pin_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='whatsapp') THEN
        ALTER TABLE public.users ADD COLUMN whatsapp TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='level') THEN
        ALTER TABLE public.users ADD COLUMN level TEXT DEFAULT 'A1';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='difficulty') THEN
        ALTER TABLE public.users ADD COLUMN difficulty TEXT DEFAULT 'easy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='performance_index') THEN
        ALTER TABLE public.users ADD COLUMN performance_index TEXT DEFAULT 'A1-easy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='created_at') THEN
        ALTER TABLE public.users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ── 4. Email + Pin nullable machen (fuer bestehende Tabellen) ──
DO $$
BEGIN
    -- Email nullable machen (Schueler brauchen keine)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='users' AND column_name='email' AND is_nullable='NO'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
    END IF;

    -- Pin nullable machen (wird durch pin_hash ersetzt)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='users' AND column_name='pin' AND is_nullable='NO'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN pin DROP NOT NULL;
    END IF;
END $$;

-- ── 5. CHECK-Constraints korrigieren ─────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Alle CHECK-Constraints auf 'level' entfernen
    FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%level%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;

    -- Alle CHECK-Constraints auf 'difficulty' entfernen
    FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%difficulty%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;

    -- Alle CHECK-Constraints auf 'role' entfernen
    FOR r IN (
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%role%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Alte Daten migrieren: 'medium' → 'middle'
UPDATE public.users SET difficulty = 'middle' WHERE difficulty = 'medium';

-- Neue Constraints setzen (idempotent via DO-Block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'student'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_level_check' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_level_check CHECK (level IN ('A1', 'A2', 'B1', 'B2'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_difficulty_check' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_difficulty_check CHECK (difficulty IN ('easy', 'middle', 'hard'));
    END IF;
END $$;

-- ── 6. Indizes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users (name);
CREATE INDEX IF NOT EXISTS idx_users_performance ON public.users (performance_index);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- ── 7. Trigger: performance_index automatisch aktualisieren ──
CREATE OR REPLACE FUNCTION update_performance_index()
RETURNS TRIGGER AS $$
BEGIN
    NEW.performance_index := NEW.level || '-' || NEW.difficulty;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_performance_index ON public.users;
CREATE TRIGGER trg_update_performance_index
    BEFORE INSERT OR UPDATE OF level, difficulty ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_index();

-- ── 8. RLS-Policies ──────────────────────────────────────────
-- Alte Policies entfernen (alle bekannten Namen)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin full access" ON public.users;
DROP POLICY IF EXISTS "Students read own data" ON public.users;
DROP POLICY IF EXISTS "Anon can read users for login" ON public.users;

-- RLS aktivieren
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admin darf alles
CREATE POLICY "Admin full access" ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Studenten duerfen nur eigene Daten lesen
CREATE POLICY "Students read own data" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Anon darf fuer Login-Validierung lesen
CREATE POLICY "Anon can read users for login" ON public.users
    FOR SELECT
    TO anon
    USING (true);

-- ── 9. Kommentare ────────────────────────────────────────────
COMMENT ON COLUMN public.users.name IS 'Display name, used for login (Name + PIN)';
COMMENT ON COLUMN public.users.pin_hash IS 'bcrypt-hashed 6-digit PIN via pgcrypto. Never store plain text.';
COMMENT ON COLUMN public.users.whatsapp IS 'Optional WhatsApp number for notifications';
COMMENT ON COLUMN public.users.role IS 'User role: admin or student';
COMMENT ON COLUMN public.users.level IS 'Language proficiency level: A1, A2, B1, B2';
COMMENT ON COLUMN public.users.difficulty IS 'Content difficulty: easy, middle, hard';
COMMENT ON COLUMN public.users.performance_index IS 'Composite key: "{level}-{difficulty}" (e.g. "A1-easy", "B1-hard")';

-- ── 10. RPC: verify_user_pin (Login-Validierung) ────────────
CREATE OR REPLACE FUNCTION verify_user_pin(p_name TEXT, p_pin TEXT)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_role TEXT,
    user_level TEXT,
    user_difficulty TEXT,
    user_performance_index TEXT
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
        u.performance_index
    FROM public.users u
    WHERE LOWER(u.name) = LOWER(p_name)
      AND u.pin_hash IS NOT NULL
      AND u.pin_hash = crypt(p_pin, u.pin_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_user_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_pin TO authenticated;

-- ── 11. RPC: create_student ─────────────────────────────────
CREATE OR REPLACE FUNCTION create_student(
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_level TEXT DEFAULT 'A1',
    p_difficulty TEXT DEFAULT 'easy'
) RETURNS JSON AS $$
DECLARE
    v_id UUID;
    v_hash TEXT;
BEGIN
    -- PIN hashen (nur wenn genau 6 Ziffern)
    v_hash := CASE
        WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 6
        THEN crypt(p_pin, gen_salt('bf'))
        ELSE NULL
    END;

    INSERT INTO public.users (name, email, whatsapp, pin, pin_hash, role, level, difficulty)
    VALUES (
        TRIM(p_name),
        NULLIF(TRIM(p_email), ''),
        NULLIF(TRIM(p_whatsapp), ''),
        p_pin,
        v_hash,
        'student',
        COALESCE(p_level, 'A1'),
        COALESCE(p_difficulty, 'easy')
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('success', true, 'id', v_id::text);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_student TO anon;
GRANT EXECUTE ON FUNCTION create_student TO authenticated;

-- ── 12. RPC: update_student ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_student(
    p_id UUID,
    p_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_level TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
    UPDATE public.users SET
        name = COALESCE(NULLIF(TRIM(p_name), ''), name),
        email = CASE WHEN p_email IS NOT NULL THEN NULLIF(TRIM(p_email), '') ELSE email END,
        whatsapp = CASE WHEN p_whatsapp IS NOT NULL THEN NULLIF(TRIM(p_whatsapp), '') ELSE whatsapp END,
        pin = CASE WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 6 THEN p_pin ELSE pin END,
        pin_hash = CASE WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 6 THEN crypt(p_pin, gen_salt('bf')) ELSE pin_hash END,
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND role = 'student';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Student not found');
    END IF;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_student TO anon;
GRANT EXECUTE ON FUNCTION update_student TO authenticated;

-- ── 13. RPC: delete_student ─────────────────────────────────
CREATE OR REPLACE FUNCTION delete_student(p_id UUID) RETURNS JSON AS $$
BEGIN
    DELETE FROM public.users WHERE id = p_id AND role = 'student';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Student not found or is admin');
    END IF;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_student TO anon;
GRANT EXECUTE ON FUNCTION delete_student TO authenticated;

-- ── 14. RPC: list_students ──────────────────────────────────
CREATE OR REPLACE FUNCTION list_students()
RETURNS JSON AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(s))
         FROM (
            SELECT id, name, email, whatsapp, role, level, difficulty, performance_index, created_at
            FROM public.users
            WHERE role = 'student'
            ORDER BY name ASC
         ) s),
        '[]'::json
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION list_students TO anon;
GRANT EXECUTE ON FUNCTION list_students TO authenticated;

-- ── 15. Admin-User Seed (PIN: 123456, bcrypt-gehasht) ─────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin' AND name = 'Admin') THEN
        INSERT INTO public.users (id, email, name, pin, pin_hash, role, level, difficulty)
        VALUES (
            uuid_generate_v4(),
            'admin@greeklingua.local',
            'Admin',
            '123456',
            crypt('123456', gen_salt('bf')),
            'admin',
            'A1',
            'easy'
        );
        RAISE NOTICE '✅ Admin user created (Name: Admin, PIN: 123456)';
    ELSE
        -- Admin existiert → pin_hash aktualisieren
        UPDATE public.users
        SET pin_hash = crypt('123456', gen_salt('bf')),
            pin = '123456'
        WHERE role = 'admin' AND name = 'Admin';
        RAISE NOTICE '✅ Admin user updated (PIN: 123456)';
    END IF;
END $$;

-- ── 16. Bestehende Daten korrigieren ────────────────────────
-- performance_index fuer alle Eintraege korrekt setzen
UPDATE public.users
SET performance_index = level || '-' || difficulty
WHERE performance_index IS NULL
   OR performance_index != (level || '-' || difficulty);

-- pin_hash fuer Eintraege setzen die nur plain-text pin haben
UPDATE public.users
SET pin_hash = crypt(pin, gen_salt('bf'))
WHERE pin IS NOT NULL
  AND pin != ''
  AND pin_hash IS NULL;

-- ── FERTIG ──────────────────────────────────────────────────
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.users;
    RAISE NOTICE '══════════════════════════════════════';
    RAISE NOTICE '✅ Fix v2 erfolgreich abgeschlossen!';
    RAISE NOTICE '   Users-Tabelle: % Eintraege', v_count;
    RAISE NOTICE '   Funktionen: verify_user_pin, create_student, update_student, delete_student, list_students';
    RAISE NOTICE '   Constraints: role(admin/student), level(A1/A2/B1/B2), difficulty(easy/middle/hard)';
    RAISE NOTICE '══════════════════════════════════════';
END $$;
-- ============================================================
-- Cleanup: Alle Versionen von verify_user_4digit_pin löschen
-- ============================================================
-- Führe diese SQL ZUERST aus, bevor du andere SQL-Dateien ausführst
-- ============================================================

-- Lösche ALLE möglichen Überladungen der Funktion
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, INET, TEXT);

-- Prüfe ob die Funktion gelöscht wurde
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'verify_user_4digit_pin'
    ) THEN
        RAISE NOTICE 'WARNUNG: verify_user_4digit_pin existiert noch!';
    ELSE
        RAISE NOTICE 'SUCCESS: verify_user_4digit_pin wurde gelöscht';
    END IF;
END $$;

-- ============================================================
-- ✅ Cleanup abgeschlossen
-- ============================================================
-- Jetzt kannst du die anderen SQL-Dateien ausführen:
-- 1. extend_users_for_4digit_pin.sql (erstellt Testnutzer)
-- 2. create_honeypot_pins_fixed.sql (erstellt Honeypot-System)
-- ============================================================
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
-- ============================================================
-- Honeypot-PINs: Fallen für Brute-Force-Angreifer (FIXED)
-- ============================================================
-- Verbotene PINs (0000, 1111, 1234, 9999) lösen sofort Alarm aus
-- IP wird gebannt und Admin wird benachrichtigt
-- ============================================================

-- ── 1. Honeypot-PINs Tabelle ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.honeypot_pins (
    pin TEXT PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 2. Banned-IPs Tabelle ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banned_ips (
    ip_address INET PRIMARY KEY,
    reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. Honeypot-Log Tabelle (Alarm-Protokoll) ─────────────
CREATE TABLE IF NOT EXISTS public.honeypot_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL,
    pin_attempted TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 4. Indizes für schnelle Abfragen ───────────────────────
CREATE INDEX IF NOT EXISTS idx_banned_ips_until ON public.banned_ips(banned_until);
CREATE INDEX IF NOT EXISTS idx_honeypot_log_ip ON public.honeypot_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_honeypot_log_created ON public.honeypot_log(created_at DESC);

-- ── 5. RLS-Policies ────────────────────────────────────────
ALTER TABLE public.honeypot_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honeypot_log ENABLE ROW LEVEL SECURITY;

-- Admin: Voller Zugriff
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'honeypot_pins' AND policyname = 'admin_full_access') THEN
        CREATE POLICY admin_full_access ON public.honeypot_pins
        FOR ALL USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banned_ips' AND policyname = 'admin_full_access') THEN
        CREATE POLICY admin_full_access ON public.banned_ips
        FOR ALL USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'honeypot_log' AND policyname = 'admin_read_all') THEN
        CREATE POLICY admin_read_all ON public.honeypot_log
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
        );
    END IF;
END $$;

-- Anon: Nur Lesen von honeypot_pins und banned_ips (für RPC)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'honeypot_pins' AND policyname = 'anon_read_honeypots') THEN
        CREATE POLICY anon_read_honeypots ON public.honeypot_pins
        FOR SELECT TO anon USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banned_ips' AND policyname = 'anon_read_bans') THEN
        CREATE POLICY anon_read_bans ON public.banned_ips
        FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- ── 6. Honeypot-PINs einfügen ──────────────────────────────
INSERT INTO public.honeypot_pins (pin, description) VALUES
    ('0000', 'Most common weak PIN'),
    ('1111', 'Sequential weak PIN'),
    ('2222', 'Sequential weak PIN'),
    ('3333', 'Sequential weak PIN'),
    ('4444', 'Sequential weak PIN'),
    ('5555', 'Sequential weak PIN'),
    ('6666', 'Sequential weak PIN'),
    ('7777', 'Sequential weak PIN'),
    ('8888', 'Sequential weak PIN'),
    ('9999', 'Sequential weak PIN'),
    ('1234', 'Most predictable PIN'),
    ('4321', 'Reverse predictable PIN'),
    ('1122', 'Common pattern'),
    ('2211', 'Common pattern'),
    ('5678', 'Sequential pattern')
ON CONFLICT (pin) DO NOTHING;

-- ── 7. RPC-Funktion: IP bannen ────────────────────────────
CREATE OR REPLACE FUNCTION ban_ip(
    p_ip_address INET,
    p_reason TEXT DEFAULT 'Honeypot PIN attempted',
    p_duration_minutes INT DEFAULT 1440  -- 24 Stunden
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- IP in banned_ips einfügen (24h Ban)
    INSERT INTO public.banned_ips (ip_address, reason, banned_until)
    VALUES (
        p_ip_address,
        p_reason,
        NOW() + (p_duration_minutes || ' minutes')::INTERVAL
    )
    ON CONFLICT (ip_address) DO UPDATE
    SET banned_until = NOW() + (p_duration_minutes || ' minutes')::INTERVAL,
        reason = EXCLUDED.reason;

    RETURN json_build_object(
        'success', true,
        'ip', p_ip_address,
        'banned_until', NOW() + (p_duration_minutes || ' minutes')::INTERVAL
    );
END;
$$;

-- ── 8. RPC-Funktion: IP-Check (gebannt?) ──────────────────
CREATE OR REPLACE FUNCTION is_ip_banned(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.banned_ips
        WHERE ip_address = p_ip_address
          AND (banned_until IS NULL OR banned_until > NOW())
    );
END;
$$;

-- ── 9. ALTE Funktion löschen + NEUE erstellen ─────────────
-- WICHTIG: Alle Überladungen löschen
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, INET, TEXT);

-- Neue Funktion mit Honeypot-Checks
CREATE OR REPLACE FUNCTION verify_user_4digit_pin(
    p_pin TEXT,
    p_ip_address INET DEFAULT NULL,
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
    error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Check: IP gebannt?
    IF p_ip_address IS NOT NULL AND is_ip_banned(p_ip_address) THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- 2. Check: Honeypot-PIN?
    IF EXISTS (SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin) THEN
        -- Log Honeypot-Versuch
        INSERT INTO public.honeypot_log (ip_address, pin_attempted, user_agent)
        VALUES (p_ip_address, p_pin, p_user_agent);

        -- IP sofort bannen (24h)
        IF p_ip_address IS NOT NULL THEN
            PERFORM ban_ip(p_ip_address, 'Honeypot PIN attempted: ' || p_pin, 1440);
        END IF;

        -- Fehler zurückgeben (sieht aus wie "PIN nicht gefunden")
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid PIN'::TEXT;
        RETURN;
    END IF;

    -- 3. Normale PIN-Validierung
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
        NULL::TEXT
    FROM public.users u
    WHERE u.pin_4digit = p_pin
    LIMIT 1;
END;
$$;

-- ── 10. Zugriffsrechte für RPC-Funktionen ─────────────────
GRANT EXECUTE ON FUNCTION ban_ip TO anon;
GRANT EXECUTE ON FUNCTION ban_ip TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_banned TO anon;
GRANT EXECUTE ON FUNCTION is_ip_banned TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO authenticated;

-- ── 11. Cleanup-Funktion (abgelaufene Bans löschen) ───────
CREATE OR REPLACE FUNCTION cleanup_expired_bans()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.banned_ips
    WHERE banned_until IS NOT NULL AND banned_until < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_bans TO authenticated;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- Honeypot-System aktiv:
-- - 15 verbotene PINs (0000, 1111-9999, 1234, etc.)
-- - Honeypot-Versuch → sofort 24h IP-Ban
-- - honeypot_log protokolliert alle Versuche
-- - cleanup_expired_bans() für Maintenance
-- ============================================================
-- =====================================================
-- KOMBINIERTE MIGRATION: Account Lockout System (FIXED)
-- =====================================================
-- Datum: 2026-02-12
-- Zweck: Student + Admin Account Lockout (5 Fails = 15 Min)
-- FIX: Dropped bestehende Funktionen vor Neuanlage
-- =====================================================

-- ========================================
-- CLEANUP: Alte Funktionen entfernen
-- ========================================

-- Drop verify_user_pin falls vorhanden (verschiedene Signaturen)
DROP FUNCTION IF EXISTS verify_user_pin(text, text);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(text, text, text);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(text);

-- ========================================
-- TEIL 1: STUDENT ACCOUNT LOCKOUT
-- ========================================

-- RPC: verify_user_4digit_pin (MIT Account Lockout)
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
    error TEXT
) AS $$
DECLARE
    v_user RECORD;
    v_is_honeypot BOOLEAN;
    v_ban_reason TEXT;
BEGIN
    -- STEP 1: Check IP Ban
    IF EXISTS (
        SELECT 1 FROM public.banned_ips
        WHERE ip_address = p_ip_address
        AND banned_until > NOW()
    ) THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- STEP 2: Check Honeypot PIN
    SELECT EXISTS (
        SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin
    ) INTO v_is_honeypot;

    IF v_is_honeypot THEN
        v_ban_reason := 'Honeypot PIN: ' || p_pin;
        INSERT INTO public.honeypot_log (ip_address, pin_attempted, user_agent, ban_reason)
        VALUES (p_ip_address, p_pin, p_user_agent, v_ban_reason);
        INSERT INTO public.banned_ips (ip_address, reason, banned_until)
        VALUES (p_ip_address, v_ban_reason, NOW() + INTERVAL '24 hours')
        ON CONFLICT (ip_address) DO UPDATE
        SET banned_until = NOW() + INTERVAL '24 hours', reason = v_ban_reason;
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- STEP 3: Find User by PIN
    SELECT * INTO v_user FROM public.users WHERE pin_4digit = p_pin LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid PIN'::TEXT;
        RETURN;
    END IF;

    -- STEP 4: Check Account Lockout
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- STEP 5: Successful Login - Reset Counters
    UPDATE public.users
    SET
        failed_attempts = 0,
        locked_until = NULL,
        last_login_device = CASE
            WHEN p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%'
            THEN 'mobile' ELSE 'desktop'
        END
    WHERE id = v_user.id;

    RETURN QUERY SELECT
        v_user.id, v_user.name, v_user.email, v_user.role,
        v_user.level, v_user.difficulty, v_user.performance_index,
        v_user.preferred_locale, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_user_4digit_pin(TEXT, TEXT, TEXT) TO anon, authenticated;

-- RPC: record_failed_login_attempt
CREATE OR REPLACE FUNCTION record_failed_login_attempt(p_pin TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_new_attempts INT;
    v_locked_until TIMESTAMP;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE pin_4digit = p_pin LIMIT 1;
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'PIN not found');
    END IF;

    UPDATE public.users
    SET
        failed_attempts = failed_attempts + 1,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
    WHERE id = v_user_id
    RETURNING failed_attempts, locked_until INTO v_new_attempts, v_locked_until;

    IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
        RETURN json_build_object('success', true, 'locked', true, 'attempts', v_new_attempts,
            'locked_until', v_locked_until, 'message', 'Account locked for 15 minutes');
    ELSE
        RETURN json_build_object('success', true, 'locked', false, 'attempts', v_new_attempts,
            'remaining', 5 - v_new_attempts, 'message', format('%s attempts remaining', 5 - v_new_attempts));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_failed_login_attempt(TEXT) TO anon, authenticated;

-- RPC: check_account_lockout_status
CREATE OR REPLACE FUNCTION check_account_lockout_status(p_pin TEXT)
RETURNS JSON AS $$
DECLARE v_user RECORD;
BEGIN
    SELECT id, failed_attempts, locked_until INTO v_user FROM public.users WHERE pin_4digit = p_pin LIMIT 1;
    IF NOT FOUND THEN
        RETURN json_build_object('found', false);
    END IF;
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN json_build_object('found', true, 'locked', true, 'locked_until', v_user.locked_until,
            'attempts', v_user.failed_attempts, 'message', 'Account is locked');
    ELSE
        RETURN json_build_object('found', true, 'locked', false, 'attempts', v_user.failed_attempts,
            'remaining', 5 - v_user.failed_attempts, 'message', 'Account is active');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_account_lockout_status(TEXT) TO anon, authenticated;

-- ========================================
-- TEIL 2: ADMIN ACCOUNT LOCKOUT
-- ========================================

-- RPC: record_admin_failed_login_attempt
CREATE OR REPLACE FUNCTION record_admin_failed_login_attempt(p_name TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_new_attempts INT;
    v_locked_until TIMESTAMP;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE name = p_name AND role = 'admin' LIMIT 1;
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;

    UPDATE public.users
    SET
        failed_attempts = failed_attempts + 1,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
    WHERE id = v_user_id
    RETURNING failed_attempts, locked_until INTO v_new_attempts, v_locked_until;

    IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
        RETURN json_build_object('success', true, 'locked', true, 'attempts', v_new_attempts,
            'locked_until', v_locked_until, 'message', 'Admin account locked for 15 minutes');
    ELSE
        RETURN json_build_object('success', true, 'locked', false, 'attempts', v_new_attempts,
            'remaining', 5 - v_new_attempts, 'message', format('%s attempts remaining', 5 - v_new_attempts));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_admin_failed_login_attempt(TEXT) TO anon, authenticated;

-- RPC: check_admin_lockout_status
CREATE OR REPLACE FUNCTION check_admin_lockout_status(p_name TEXT)
RETURNS JSON AS $$
DECLARE v_user RECORD;
BEGIN
    SELECT id, failed_attempts, locked_until INTO v_user FROM public.users WHERE name = p_name AND role = 'admin' LIMIT 1;
    IF NOT FOUND THEN
        RETURN json_build_object('found', false);
    END IF;
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN json_build_object('found', true, 'locked', true, 'locked_until', v_user.locked_until,
            'attempts', v_user.failed_attempts, 'message', 'Admin account is locked');
    ELSE
        RETURN json_build_object('found', true, 'locked', false, 'attempts', v_user.failed_attempts,
            'remaining', 5 - v_user.failed_attempts, 'message', 'Admin account is active');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_admin_lockout_status(TEXT) TO anon, authenticated;

-- RPC: verify_user_pin (MIT Account Lockout) - NEU ERSTELLT
CREATE FUNCTION verify_user_pin(p_name TEXT, p_pin TEXT)
RETURNS TABLE (
    user_id UUID, user_name TEXT, user_email TEXT, user_role TEXT,
    user_level TEXT, user_difficulty TEXT, user_performance_index TEXT,
    user_preferred_locale TEXT, error TEXT
) AS $$
DECLARE
    v_user RECORD;
    v_pin_valid BOOLEAN := false;
BEGIN
    SELECT * INTO v_user FROM public.users WHERE name = p_name LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid credentials'::TEXT;
        RETURN;
    END IF;

    -- CHECK 1: Account Lockout
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- CHECK 2: PIN-Validierung (bcrypt)
    IF v_user.pin_hash IS NOT NULL THEN
        v_pin_valid := (v_user.pin_hash = crypt(p_pin, v_user.pin_hash));
    ELSIF v_user.pin IS NOT NULL THEN
        v_pin_valid := (v_user.pin = p_pin);
    ELSE
        v_pin_valid := false;
    END IF;

    IF v_pin_valid THEN
        UPDATE public.users SET failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;
        RETURN QUERY SELECT v_user.id, v_user.name, v_user.email, v_user.role,
            v_user.level, v_user.difficulty, v_user.performance_index,
            v_user.preferred_locale, NULL::TEXT;
    ELSE
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid credentials'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_user_pin(TEXT, TEXT) TO anon, authenticated;

-- ========================================
-- TEIL 3: PERFORMANCE INDIZES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_locked_until
ON public.users(locked_until) WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_failed_attempts
ON public.users(failed_attempts) WHERE failed_attempts > 0;

-- =====================================================
-- MIGRATION ABGESCHLOSSEN
-- =====================================================
-- Teste die Funktionen mit:
-- SELECT check_account_lockout_status('3741');
-- SELECT check_admin_lockout_status('Admin');
-- =====================================================
