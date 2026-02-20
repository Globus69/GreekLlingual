-- =====================================================
-- Brain Gym RPC Functions
-- =====================================================
-- Created: 2026-02-19
-- Purpose: Provide consistent data sources for Brain Gym Memory Game
-- Integration: FSRS-6 Scheduling System

-- =====================================================
-- FUNCTION 1: get_all_vocabulary_cards
-- Purpose: Returns ALL vocabulary cards for review practice
-- Use Case: Brain Gym "Review Vocabulary" dropdown option
-- =====================================================

CREATE OR REPLACE FUNCTION get_all_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    english TEXT,
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
        li.greek,
        li.phonetic,
        -- FSRS-6 fields with defaults for new cards
        COALESCE(sp.fsrs_difficulty, 6.4133) AS fsrs_difficulty,
        COALESCE(sp.fsrs_stability, 0.212) AS fsrs_stability,
        sp.fsrs_last_review,
        COALESCE(sp.fsrs_due, NOW()) AS fsrs_due,
        COALESCE(sp.fsrs_reps, 0) AS fsrs_reps,
        COALESCE(sp.fsrs_lapses, 0) AS fsrs_lapses,
        COALESCE(sp.fsrs_state, 'new') AS fsrs_state,
        -- Legacy fields for compatibility
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
    ORDER BY RANDOM()  -- Random order for variety
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- FUNCTION 2: get_weak_vocabulary_cards
-- Purpose: Returns vocabulary cards that are difficult for the user
-- Use Case: Brain Gym "Weak Words" dropdown option
-- =====================================================

CREATE OR REPLACE FUNCTION get_weak_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    english TEXT,
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
    INNER JOIN public.student_progress sp  -- INNER: Only cards with progress
        ON sp.item_id = li.id
        AND sp.student_id = p_user_id
    WHERE
        li.type = 'vocabulary'
        AND (
            sp.fsrs_difficulty > 7.0        -- High difficulty (scale 0-10)
            OR sp.fsrs_lapses >= 3          -- Multiple mistakes
            OR sp.fsrs_state = 'relearning' -- Currently relearning
        )
    ORDER BY
        sp.fsrs_difficulty DESC,  -- Hardest first
        sp.fsrs_lapses DESC,      -- Most mistakes first
        sp.fsrs_last_review DESC NULLS LAST
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_all_vocabulary_cards(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards(UUID, INT) TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION get_all_vocabulary_cards IS
'Returns all vocabulary cards for a user with FSRS-6 data. Used by Brain Gym for Review Vocabulary mode.';

COMMENT ON FUNCTION get_weak_vocabulary_cards IS
'Returns difficult vocabulary cards (high difficulty, many lapses, or relearning state). Used by Brain Gym for Weak Words mode.';
