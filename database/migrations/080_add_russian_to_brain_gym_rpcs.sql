-- Migration: 080_add_russian_to_brain_gym_rpcs.sql
-- Description: Add russian column to Brain Gym RPC functions
-- Date: 2026-02-19

-- =====================================================
-- UPDATE: get_all_vocabulary_cards - Add russian
-- =====================================================

CREATE OR REPLACE FUNCTION get_all_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    english TEXT,
    russian TEXT,
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
        li.id,
        li.english,
        li.russian,
        li.greek,
        li.phonetic,
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
        li.level,
        li.difficulty
    FROM public.learning_items li
    LEFT JOIN public.student_progress sp
        ON sp.item_id = li.id
        AND sp.student_id = p_user_id
    WHERE
        li.type = 'vocabulary'
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- UPDATE: get_weak_vocabulary_cards - Add russian
-- =====================================================

CREATE OR REPLACE FUNCTION get_weak_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    english TEXT,
    russian TEXT,
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
        li.id,
        li.english,
        li.russian,
        li.greek,
        li.phonetic,
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
        li.level,
        li.difficulty
    FROM public.learning_items li
    INNER JOIN public.student_progress sp
        ON sp.item_id = li.id
        AND sp.student_id = p_user_id
    WHERE
        li.type = 'vocabulary'
        AND (
            sp.fsrs_difficulty > 7.0
            OR sp.fsrs_lapses >= 3
            OR sp.fsrs_state = 'relearning'
        )
    ORDER BY
        sp.fsrs_difficulty DESC,
        sp.fsrs_lapses DESC,
        sp.fsrs_last_review DESC NULLS LAST
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- UPDATE: get_due_vocabulary_cards - Add russian
-- (Function from migration 072)
-- =====================================================

CREATE OR REPLACE FUNCTION get_due_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    english TEXT,
    russian TEXT,
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
        li.id,
        li.english,
        li.russian,
        li.greek,
        li.phonetic,
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
        li.level,
        li.difficulty
    FROM public.learning_items li
    INNER JOIN public.student_progress sp
        ON sp.item_id = li.id
        AND sp.student_id = p_user_id
    WHERE
        li.type = 'vocabulary'
        AND sp.fsrs_due <= NOW()
    ORDER BY sp.fsrs_due ASC, li.created_at ASC
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_all_vocabulary_cards(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_vocabulary_cards(UUID, INT) TO authenticated;

-- Migration 080 completed
DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 080 completed successfully';
    RAISE NOTICE '   - Added russian column to all Brain Gym RPCs';
    RAISE NOTICE '   - Supports multi-language translations';
    RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;
