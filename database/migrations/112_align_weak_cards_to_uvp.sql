-- ============================================================================
-- Migration 112: Align Brain Gym get_weak_vocabulary_cards to use
--                user_vocabulary_progress (same source as the weak count)
-- Date: 2026-02-23
-- ============================================================================
-- Root Cause Found:
--   - get_weak_vocabulary_count uses: user_vocabulary_progress (uvp.fsrs_lapses >= 2)
--   - get_weak_vocabulary_cards (Brain Gym) used: student_progress OR fsrs_review_logs
--   - Result: The counter shows 11, but the Brain Gym finds 0 cards.
--
-- Fix: Both functions must use the same table: user_vocabulary_progress
-- ============================================================================

DROP FUNCTION IF EXISTS get_weak_vocabulary_cards(UUID, INT);

CREATE FUNCTION get_weak_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 20
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
        SELECT DISTINCT ON (card_id)
            card_id,
            rating
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
        ORDER BY card_id, review_time DESC
    )
    SELECT
        mv.id,
        mv.en_translation      AS english,
        mv.ru_translation      AS russian,
        mv.de_translation      AS german,
        mv.es_translation      AS spanish,
        mv.greek_transcription AS greek,
        mv.greek_phonetic      AS phonetic,
        uvp.fsrs_difficulty::REAL,
        uvp.fsrs_stability::REAL,
        uvp.fsrs_last_review,
        uvp.fsrs_due,
        uvp.fsrs_reps::INT,
        uvp.fsrs_lapses::INT,
        uvp.fsrs_state::TEXT,
        COALESCE(uvp.ease_factor, 2.5)::REAL   AS ease_factor,
        COALESCE(uvp.interval_days, 1)::INT    AS interval_days,
        uvp.next_review,
        mv.level,
        mv.difficulty
    FROM multilingual_vocabulary mv
    JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = mv.id
        AND uvp.user_id = p_user_id
    LEFT JOIN latest_reviews lr
        ON lr.card_id = mv.id
    WHERE
        -- Same criteria as get_weak_vocabulary_count
        uvp.fsrs_lapses >= 2
        AND (lr.rating IS NULL OR lr.rating < 3)  -- Exclude if last rating was Good/Easy
    ORDER BY
        uvp.fsrs_lapses DESC,
        uvp.fsrs_difficulty DESC NULLS LAST,
        uvp.fsrs_last_review DESC NULLS LAST
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards(UUID, INT) TO anon, authenticated;

DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 112 completed';
    RAISE NOTICE '   get_weak_vocabulary_cards now uses user_vocabulary_progress';
    RAISE NOTICE '   Same source as get_weak_vocabulary_count (the counter)';
    RAISE NOTICE '   Brain Gym Schwache Wörter should now match the count';
    RAISE NOTICE '══════════════════════════════════════════════';
END $$;
