-- Migration 115: Fix Weak Words Discrepancy
-- Reintroduce the logic that includes BOTH `lr.rating = 1` AND `uvp.fsrs_lapses >= 2`
-- so that it correctly shows all 17 weak words instead of just 1.

DROP FUNCTION IF EXISTS get_weak_vocabulary_cards(UUID, INT);

CREATE OR REPLACE FUNCTION get_weak_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    english TEXT,
    russian TEXT,
    german TEXT,
    spanish TEXT,
    greek TEXT,
    greek_word TEXT,
    phonetic TEXT,
    example_en TEXT,
    example_gr TEXT,
    audio_url TEXT,
    level TEXT,
    difficulty TEXT,
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
    created_at TIMESTAMPTZ
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
        v.id,
        'vocabulary'::TEXT as type,
        v.en_translation::TEXT AS english,
        v.ru_translation::TEXT AS russian,
        v.de_translation::TEXT AS german,
        v.es_translation::TEXT AS spanish,
        v.greek_transcription::TEXT AS greek,
        v.greek_transcription::TEXT AS greek_word,
        v.greek_phonetic::TEXT AS phonetic,
        NULL::TEXT as example_en,
        NULL::TEXT as example_gr,
        COALESCE(v.audio_url, v.en_audio_url)::TEXT AS audio_url,
        v.level::TEXT,
        v.difficulty::TEXT,
        COALESCE(uvp.fsrs_difficulty, 0.3)::REAL AS fsrs_difficulty,
        COALESCE(uvp.fsrs_stability, 0.0)::REAL  AS fsrs_stability,
        uvp.fsrs_last_review,
        uvp.fsrs_due,
        COALESCE(uvp.fsrs_reps, 0)::INT          AS fsrs_reps,
        COALESCE(uvp.fsrs_lapses, 0)::INT        AS fsrs_lapses,
        COALESCE(uvp.fsrs_state, 'review')::TEXT AS fsrs_state,
        2.5::REAL                                AS ease_factor,
        1::INT                                   AS interval_days,
        uvp.fsrs_due                             AS next_review,
        v.created_at
    FROM multilingual_vocabulary v
    JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    LEFT JOIN latest_reviews lr
        ON lr.card_id = v.id
    WHERE 
        (lr.rating = 1 OR uvp.fsrs_lapses >= 2) -- FAILED or PERSISTENTLY WEAK
        AND (lr.rating IS NULL OR lr.rating < 3) -- Exclude if last action was Good/Easy
    ORDER BY
        uvp.fsrs_lapses DESC,
        uvp.fsrs_last_review DESC NULLS LAST
    LIMIT p_limit;
END;
$$;


-- 2. Ensure get_weak_vocabulary_count uses the exact SAME logic!
CREATE OR REPLACE FUNCTION get_weak_vocabulary_count(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    WITH latest_reviews AS (
        SELECT DISTINCT ON (card_id)
            card_id,
            rating
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
        ORDER BY card_id, review_time DESC
    )
    SELECT COUNT(*) INTO v_count
    FROM user_vocabulary_progress uvp
    LEFT JOIN latest_reviews lr ON lr.card_id = uvp.vocabulary_id
    WHERE uvp.user_id = p_user_id
        AND (lr.rating = 1 OR uvp.fsrs_lapses >= 2)
        AND (lr.rating IS NULL OR lr.rating < 3);

    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_count TO anon, authenticated;
