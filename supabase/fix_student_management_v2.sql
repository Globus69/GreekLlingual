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

-- ── 15. Admin-User Seed (PIN: 1234, bcrypt-gehasht) ─────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin' AND name = 'Admin') THEN
        INSERT INTO public.users (id, email, name, pin, pin_hash, role, level, difficulty)
        VALUES (
            uuid_generate_v4(),
            'admin@greeklingua.local',
            'Admin',
            '1234',
            crypt('1234', gen_salt('bf')),
            'admin',
            'A1',
            'easy'
        );
        RAISE NOTICE '✅ Admin user created (Name: Admin, PIN: 1234)';
    ELSE
        -- Admin existiert → pin_hash aktualisieren falls leer
        UPDATE public.users
        SET pin_hash = crypt('1234', gen_salt('bf')),
            pin = '1234'
        WHERE role = 'admin' AND name = 'Admin' AND pin_hash IS NULL;
        RAISE NOTICE '✅ Admin user already exists';
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
