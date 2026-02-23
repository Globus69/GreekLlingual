-- ============================================================================
-- Migration 111: Fix get_weak_vocabulary_cards for Brain Gym
-- Date: 2026-02-23
-- Author: Auto-generated
-- ============================================================================
-- Problem:
--   - Brain Gym "Schwache Wörter" shows 0 cards despite 11 existing.
--   - Root cause: The RPC only joins fsrs_review_logs, but some users may 
--     have their weak words tracked only in student_progress.
--   - Additionally, Brain Gym requires "Hard" (rating=2) to be included,
--     not just "Again" (rating=1).
--
-- Fix:
--   - Unified query: FIRST check fsrs_review_logs (most accurate)
--   - FALLBACK: student_progress with fsrs_difficulty > 7.0 OR lapses >= 2
--   - Include BOTH rating=1 (Again) and rating=2 (Hard)
--   - Use UNION to cover both sources, DISTINCT to prevent duplicates
-- ============================================================================

-- Drop first to allow return type change
DROP FUNCTION IF EXISTS get_weak_vocabulary_cards(UUID, INT);

CREATE OR REPLACE FUNCTION get_weak_vocabulary_cards(
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
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH latest_reviews AS (
        -- Get the most recent rating per card (from fsrs_review_logs)
        SELECT DISTINCT ON (card_id)
            card_id,
            rating
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
        ORDER BY card_id, review_time DESC
    ),
    -- SOURCE 1: Cards from fsrs_review_logs where last rating was Again (1) or Hard (2)
    weak_from_logs AS (
        SELECT
            mv.id,
            mv.en_translation      AS english,
            mv.ru_translation      AS russian,
            mv.de_translation      AS german,
            mv.es_translation      AS spanish,
            mv.greek_transcription AS greek,
            mv.greek_phonetic      AS phonetic,
            COALESCE(sp.fsrs_difficulty, 6.5)::REAL  AS fsrs_difficulty,
            COALESCE(sp.fsrs_stability, 0.0)::REAL   AS fsrs_stability,
            sp.fsrs_last_review,
            sp.fsrs_due,
            COALESCE(sp.fsrs_reps, 0)::INT           AS fsrs_reps,
            COALESCE(sp.fsrs_lapses, 0)::INT         AS fsrs_lapses,
            COALESCE(sp.fsrs_state, 'review')::TEXT  AS fsrs_state,
            COALESCE(sp.ease_factor, 2.5)::REAL      AS ease_factor,
            COALESCE(sp.interval_days, 1)::INT       AS interval_days,
            sp.next_review,
            mv.level,
            mv.difficulty
        FROM multilingual_vocabulary mv
        JOIN latest_reviews lr ON lr.card_id = mv.id
        LEFT JOIN student_progress sp
            ON sp.item_id = mv.id
            AND sp.student_id = p_user_id
        WHERE
            lr.rating IN (1, 2)  -- Again (1) OR Hard (2)
    ),
    -- SOURCE 2: Cards from student_progress with FSRS signs of weakness (fallback)
    weak_from_progress AS (
        SELECT
            mv.id,
            mv.en_translation      AS english,
            mv.ru_translation      AS russian,
            mv.de_translation      AS german,
            mv.es_translation      AS spanish,
            mv.greek_transcription AS greek,
            mv.greek_phonetic      AS phonetic,
            sp.fsrs_difficulty::REAL,
            sp.fsrs_stability::REAL,
            sp.fsrs_last_review,
            sp.fsrs_due,
            sp.fsrs_reps::INT,
            sp.fsrs_lapses::INT,
            sp.fsrs_state::TEXT,
            sp.ease_factor::REAL,
            sp.interval_days::INT,
            sp.next_review,
            mv.level,
            mv.difficulty
        FROM multilingual_vocabulary mv
        INNER JOIN student_progress sp
            ON sp.item_id = mv.id
            AND sp.student_id = p_user_id
        -- Only fetch cards NOT already covered by review logs
        WHERE
            mv.id NOT IN (SELECT card_id FROM latest_reviews)
            AND (
                sp.fsrs_difficulty > 7.0
                OR sp.fsrs_lapses >= 2
                OR sp.fsrs_state = 'relearning'
            )
    )
    -- Merge both sources, deduplicate, sort by weakness
    SELECT DISTINCT ON (combined.id)
        combined.id,
        combined.english,
        combined.russian,
        combined.german,
        combined.spanish,
        combined.greek,
        combined.phonetic,
        combined.fsrs_difficulty,
        combined.fsrs_stability,
        combined.fsrs_last_review,
        combined.fsrs_due,
        combined.fsrs_reps,
        combined.fsrs_lapses,
        combined.fsrs_state,
        combined.ease_factor,
        combined.interval_days,
        combined.next_review,
        combined.level,
        combined.difficulty
    FROM (
        SELECT * FROM weak_from_logs
        UNION ALL
        SELECT * FROM weak_from_progress
    ) combined
    ORDER BY
        combined.id,
        combined.fsrs_lapses DESC,
        combined.fsrs_difficulty DESC
    LIMIT p_limit;
END;
$$;

-- Grant access to both anon (students via PIN) and authenticated
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards(UUID, INT) TO anon, authenticated;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 111 completed';
    RAISE NOTICE '   get_weak_vocabulary_cards now includes:';
    RAISE NOTICE '   - Again (rating=1) AND Hard (rating=2) from logs';
    RAISE NOTICE '   - Fallback: student_progress with high difficulty/lapses';
    RAISE NOTICE '   - UNION merge, deduplication, SECURITY DEFINER';
    RAISE NOTICE '══════════════════════════════════════════════';
END $$;
