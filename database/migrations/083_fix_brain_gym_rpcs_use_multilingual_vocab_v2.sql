-- Migration: 083_fix_brain_gym_rpcs_use_multilingual_vocab_v2.sql
-- Description: Fix Brain Gym RPCs to use multilingual_vocabulary columns (DROP first)
-- Date: 2026-02-19

-- =====================================================
-- DROP existing functions first
-- =====================================================

DROP FUNCTION IF EXISTS get_all_vocabulary_cards(UUID, INT);
DROP FUNCTION IF EXISTS get_weak_vocabulary_cards(UUID, INT);
DROP FUNCTION IF EXISTS get_due_vocabulary_cards(UUID, INT);

-- =====================================================
-- 1. CREATE: get_all_vocabulary_cards
-- =====================================================

CREATE FUNCTION get_all_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    english TEXT,
    russian TEXT,
    german TEXT,
    spanish TEXT,
    greek TEXT,
    phonetic TEXT,
    fsrs_difficulty REAL,
    fsrs_stability REAL,
    fsrs_last_review TIMESTAMPTZ,
    fsrs_due TIMESTAMPTZ,
    fsrs_reps INT,
    fsrs_lapses INT,
    fsrs_state TEXT,
    ease_factor REAL,
    interval_days INT,
    next_review TIMESTAMPTZ,
    level TEXT,
    difficulty TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mv.id,
        mv.en_translation AS english,
        mv.ru_translation AS russian,
        mv.de_translation AS german,
        mv.es_translation AS spanish,
        mv.greek_transcription AS greek,
        mv.greek_phonetic AS phonetic,
        COALESCE(sp.fsrs_difficulty, 6.4133) AS fsrs_difficulty,
        COALESCE(sp.fsrs_stability, 0.212) AS fsrs_stability,
        sp.fsrs_last_review,
        COALESCE(sp.fsrs_due, NOW()) AS fsrs_due,
        COALESCE(sp.fsrs_reps, 0) AS fsrs_reps,
        COALESCE(sp.fsrs_lapses, 0) AS fsrs_lapses,
        COALESCE(sp.fsrs_state, 'new') AS fsrs_state,
        COALESCE(sp.ease_factor, 2.5) AS ease_factor,
        COALESCE(sp.interval_days, 0) AS interval_days,
        COALESCE(sp.next_review, NOW()) AS next_review,
        mv.level,
        mv.difficulty
    FROM public.multilingual_vocabulary mv
    LEFT JOIN public.student_progress sp
        ON sp.item_id = mv.id
        AND sp.student_id = p_user_id
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- 2. CREATE: get_weak_vocabulary_cards
-- =====================================================

CREATE FUNCTION get_weak_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    english TEXT,
    russian TEXT,
    german TEXT,
    spanish TEXT,
    greek TEXT,
    phonetic TEXT,
    fsrs_difficulty REAL,
    fsrs_stability REAL,
    fsrs_last_review TIMESTAMPTZ,
    fsrs_due TIMESTAMPTZ,
    fsrs_reps INT,
    fsrs_lapses INT,
    fsrs_state TEXT,
    ease_factor REAL,
    interval_days INT,
    next_review TIMESTAMPTZ,
    level TEXT,
    difficulty TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mv.id,
        mv.en_translation AS english,
        mv.ru_translation AS russian,
        mv.de_translation AS german,
        mv.es_translation AS spanish,
        mv.greek_transcription AS greek,
        mv.greek_phonetic AS phonetic,
        sp.fsrs_difficulty,
        sp.fsrs_stability,
        sp.fsrs_last_review,
        sp.fsrs_due,
        sp.fsrs_reps,
        sp.fsrs_lapses,
        sp.fsrs_state,
        sp.ease_factor,
        sp.interval_days,
        sp.next_review,
        mv.level,
        mv.difficulty
    FROM public.multilingual_vocabulary mv
    INNER JOIN public.student_progress sp
        ON sp.item_id = mv.id
        AND sp.student_id = p_user_id
    WHERE
        sp.fsrs_difficulty > 7.0
        OR sp.fsrs_lapses >= 3
        OR sp.fsrs_state = 'relearning'
    ORDER BY
        sp.fsrs_difficulty DESC,
        sp.fsrs_lapses DESC,
        sp.fsrs_last_review DESC NULLS LAST
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- 3. CREATE: get_due_vocabulary_cards
-- =====================================================

CREATE FUNCTION get_due_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    english TEXT,
    russian TEXT,
    german TEXT,
    spanish TEXT,
    greek TEXT,
    phonetic TEXT,
    fsrs_difficulty REAL,
    fsrs_stability REAL,
    fsrs_last_review TIMESTAMPTZ,
    fsrs_due TIMESTAMPTZ,
    fsrs_reps INT,
    fsrs_lapses INT,
    fsrs_state TEXT,
    ease_factor REAL,
    interval_days INT,
    next_review TIMESTAMPTZ,
    level TEXT,
    difficulty TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mv.id,
        mv.en_translation AS english,
        mv.ru_translation AS russian,
        mv.de_translation AS german,
        mv.es_translation AS spanish,
        mv.greek_transcription AS greek,
        mv.greek_phonetic AS phonetic,
        sp.fsrs_difficulty,
        sp.fsrs_stability,
        sp.fsrs_last_review,
        sp.fsrs_due,
        sp.fsrs_reps,
        sp.fsrs_lapses,
        sp.fsrs_state,
        sp.ease_factor,
        sp.interval_days,
        sp.next_review,
        mv.level,
        mv.difficulty
    FROM public.multilingual_vocabulary mv
    INNER JOIN public.student_progress sp
        ON sp.item_id = mv.id
        AND sp.student_id = p_user_id
    WHERE
        sp.fsrs_due <= NOW()
    ORDER BY sp.fsrs_due ASC, mv.created_at ASC
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_all_vocabulary_cards(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_vocabulary_cards(UUID, INT) TO authenticated;

-- Migration 083 completed
DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 083 completed successfully';
    RAISE NOTICE '   - Dropped old Brain Gym RPCs';
    RAISE NOTICE '   - Recreated with multilingual_vocabulary support';
    RAISE NOTICE '   - All 5 languages now supported: EN, RU, DE, ES, EL';
    RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;
