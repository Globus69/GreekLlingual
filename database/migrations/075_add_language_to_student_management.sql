-- Migration: 075_add_language_to_student_management.sql
-- Description: Add preferred_locale parameter to student management RPCs
-- Date: 2026-02-19

-- Update CHECK constraint to include 'es' (Spanish)
DO $$
BEGIN
    -- Remove old constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND constraint_name = 'users_preferred_locale_check'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_preferred_locale_check;
    END IF;

    -- Add new constraint with 5 languages
    ALTER TABLE public.users
        ADD CONSTRAINT users_preferred_locale_check
        CHECK (preferred_locale IN ('en', 'ru', 'el', 'de', 'es'));

    RAISE NOTICE 'CHECK-Constraint für preferred_locale aktualisiert (5 Sprachen)';
END $$;

-- Update create_student RPC to include preferred_locale
CREATE OR REPLACE FUNCTION create_student(
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_level TEXT DEFAULT 'A1',
    p_difficulty TEXT DEFAULT 'easy',
    p_preferred_locale TEXT DEFAULT 'en'
) RETURNS JSON AS $$
DECLARE
    v_id UUID;
    v_hash TEXT;
BEGIN
    -- Validate locale
    IF p_preferred_locale NOT IN ('en', 'ru', 'el', 'de', 'es') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid locale. Must be en, ru, el, de, or es.');
    END IF;

    -- PIN hashen (nur wenn genau 4 Ziffern für Studenten)
    v_hash := CASE
        WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 4
        THEN crypt(p_pin, gen_salt('bf'))
        ELSE NULL
    END;

    INSERT INTO public.users (name, email, whatsapp, pin, pin_hash, role, level, difficulty, preferred_locale)
    VALUES (
        TRIM(p_name),
        NULLIF(TRIM(p_email), ''),
        NULLIF(TRIM(p_whatsapp), ''),
        p_pin,
        v_hash,
        'student',
        COALESCE(p_level, 'A1'),
        COALESCE(p_difficulty, 'easy'),
        COALESCE(p_preferred_locale, 'en')
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('success', true, 'id', v_id::text);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update update_student RPC to include preferred_locale
CREATE OR REPLACE FUNCTION update_student(
    p_id UUID,
    p_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_level TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_preferred_locale TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
    -- Validate locale if provided
    IF p_preferred_locale IS NOT NULL AND p_preferred_locale NOT IN ('en', 'ru', 'el', 'de', 'es') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid locale. Must be en, ru, el, de, or es.');
    END IF;

    UPDATE public.users SET
        name = COALESCE(NULLIF(TRIM(p_name), ''), name),
        email = CASE WHEN p_email IS NOT NULL THEN NULLIF(TRIM(p_email), '') ELSE email END,
        whatsapp = CASE WHEN p_whatsapp IS NOT NULL THEN NULLIF(TRIM(p_whatsapp), '') ELSE whatsapp END,
        pin = CASE WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 4 THEN p_pin ELSE pin END,
        pin_hash = CASE WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 4 THEN crypt(p_pin, gen_salt('bf')) ELSE pin_hash END,
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        preferred_locale = COALESCE(p_preferred_locale, preferred_locale),
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

-- Update list_students to include preferred_locale and pin
CREATE OR REPLACE FUNCTION list_students()
RETURNS JSON AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(s))
         FROM (
            SELECT
                id,
                name,
                email,
                whatsapp,
                pin,
                role,
                level,
                difficulty,
                performance_index,
                COALESCE(preferred_locale, 'en') as preferred_locale,
                created_at
            FROM public.users
            WHERE role = 'student'
            ORDER BY name ASC
         ) s),
        '[]'::json
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration 075 completed
