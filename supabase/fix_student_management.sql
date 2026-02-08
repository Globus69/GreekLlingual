-- ============================================================
-- Fix: Student-Management – Constraints, RLS, PIN-Hashing
-- ============================================================
-- Behebt:
--   1. CHECK-Constraint level: B2 fehlte
--   2. CHECK-Constraint difficulty: 'medium' → 'middle'
--   3. RLS: Anon kann nicht schreiben → RPC-Funktionen mit SECURITY DEFINER
--   4. Email NOT NULL → nullable machen
--   5. PIN-Hash: Automatisch bei Create/Update setzen
-- ============================================================

-- ── 1. pgcrypto sicherstellen ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 2. CHECK-Constraints fixen ─────────────────────────────────────
-- Level: B2 hinzufuegen
DO $$
BEGIN
    -- Alte Constraint entfernen (Name kann variieren)
    BEGIN
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_level_check;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    -- Auch alternative Namen versuchen
    BEGIN
        EXECUTE (
            SELECT 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(conname)
            FROM pg_constraint
            WHERE conrelid = 'public.users'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%level%'
            LIMIT 1
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    -- Neue Constraint mit B2
    ALTER TABLE public.users ADD CONSTRAINT users_level_check
        CHECK (level IN ('A1', 'A2', 'B1', 'B2'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Level constraint: %', SQLERRM;
END $$;

-- Difficulty: 'medium' → 'middle' aendern
DO $$
BEGIN
    -- Bestehende Daten von 'medium' auf 'middle' migrieren
    UPDATE public.users SET difficulty = 'middle' WHERE difficulty = 'medium';
    -- Alte Constraint entfernen
    BEGIN
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_difficulty_check;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        EXECUTE (
            SELECT 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(conname)
            FROM pg_constraint
            WHERE conrelid = 'public.users'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%difficulty%'
            LIMIT 1
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    -- Neue Constraint mit 'middle'
    ALTER TABLE public.users ADD CONSTRAINT users_difficulty_check
        CHECK (difficulty IN ('easy', 'middle', 'hard'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Difficulty constraint: %', SQLERRM;
END $$;

-- ── 3. Email nullable machen ───────────────────────────────────────
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- ── 4. RPC: Schueler erstellen (mit PIN-Hashing) ──────────────────
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
    v_index TEXT;
    v_hash TEXT;
BEGIN
    v_index := p_level || '-' || p_difficulty;
    v_hash := CASE
        WHEN p_pin IS NOT NULL AND p_pin != ''
        THEN crypt(p_pin, gen_salt('bf'))
        ELSE NULL
    END;

    INSERT INTO public.users (name, email, whatsapp, pin, pin_hash, role, level, difficulty, performance_index)
    VALUES (
        p_name,
        NULLIF(TRIM(p_email), ''),
        NULLIF(TRIM(p_whatsapp), ''),
        COALESCE(p_pin, '000000'),
        v_hash,
        'student',
        p_level,
        p_difficulty,
        v_index
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('success', true, 'id', v_id::text);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_student TO anon;
GRANT EXECUTE ON FUNCTION create_student TO authenticated;

-- ── 5. RPC: Schueler aktualisieren ────────────────────────────────
CREATE OR REPLACE FUNCTION update_student(
    p_id UUID,
    p_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_level TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_index TEXT;
BEGIN
    v_index := COALESCE(p_level, 'A1') || '-' || COALESCE(p_difficulty, 'easy');

    UPDATE public.users SET
        name = COALESCE(NULLIF(TRIM(p_name), ''), name),
        email = CASE WHEN p_email IS NOT NULL THEN NULLIF(TRIM(p_email), '') ELSE email END,
        whatsapp = CASE WHEN p_whatsapp IS NOT NULL THEN NULLIF(TRIM(p_whatsapp), '') ELSE whatsapp END,
        pin = CASE WHEN p_pin IS NOT NULL AND p_pin != '' THEN p_pin ELSE pin END,
        pin_hash = CASE WHEN p_pin IS NOT NULL AND p_pin != '' THEN crypt(p_pin, gen_salt('bf')) ELSE pin_hash END,
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        performance_index = v_index,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id;

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

-- ── 6. RPC: Schueler loeschen ─────────────────────────────────────
CREATE OR REPLACE FUNCTION delete_student(p_id UUID) RETURNS JSON AS $$
BEGIN
    DELETE FROM public.users WHERE id = p_id AND role = 'student';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Student not found');
    END IF;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_student TO anon;
GRANT EXECUTE ON FUNCTION delete_student TO authenticated;

-- ── 7. RPC: Schueler auflisten ────────────────────────────────────
CREATE OR REPLACE FUNCTION list_students()
RETURNS JSON AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(s))
         FROM (
            SELECT id, name, email, whatsapp, role, level, difficulty, performance_index
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

-- ── 8. Performance-Index Default fixer ─────────────────────────────
-- Aktualisiere bestehende Eintraege wo performance_index falsch ist
UPDATE public.users
SET performance_index = level || '-' || difficulty
WHERE performance_index IS NULL
   OR performance_index != (level || '-' || difficulty);
