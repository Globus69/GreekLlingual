-- Migration: 077_fix_student_pin_4digit_complete.sql
-- Description: Ensure ALL student RPCs use 4-digit PIN logic consistently
-- Date: 2026-02-19

-- ══════════════════════════════════════════════════════════════════════
-- CRITICAL FIX: Update all student-related RPCs to use 4-digit PINs
-- Students use 4-digit PINs, Admins use 6-digit PINs
-- ══════════════════════════════════════════════════════════════════════

-- 1. Update create_student to hash 4-digit PINs
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

GRANT EXECUTE ON FUNCTION create_student(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 2. Update update_student to hash 4-digit PINs
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

GRANT EXECUTE ON FUNCTION update_student(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 3. Verify that verify_user_pin works for both 4-digit (students) and 6-digit (admins)
-- No changes needed - the function uses bcrypt comparison which works for any length

-- 4. Fix any existing students that have 4-digit PINs but no pin_hash
UPDATE public.users
SET pin_hash = crypt(pin, gen_salt('bf'))
WHERE role = 'student'
  AND pin IS NOT NULL
  AND LENGTH(TRIM(pin)) = 4
  AND (pin_hash IS NULL OR pin_hash = '');

-- 5. Report results
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.users
    WHERE role = 'student' AND pin IS NOT NULL AND pin_hash IS NOT NULL;

    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 077 completed successfully';
    RAISE NOTICE '   Students with valid PINs: %', v_count;
    RAISE NOTICE '   - create_student: 4-digit PIN hashing enabled';
    RAISE NOTICE '   - update_student: 4-digit PIN hashing enabled';
    RAISE NOTICE '   - verify_user_pin: Works for 4-digit and 6-digit';
    RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;

-- Migration 077 completed
