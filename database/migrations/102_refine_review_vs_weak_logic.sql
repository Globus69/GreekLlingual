-- ============================================================================
-- Migration 102: Refine Review vs Weak Logic
-- ============================================================================
-- Purpose: 
-- 1. Review Vocab: Cards with last rating = Hard (2).
-- 2. Weak Words: Cards with last rating = Again (1) OR Lapses >= 2.
-- 3. Mastery: Once a card is rated Good (3) or Easy (4), it leaves BOTH lists.
-- ============================================================================

-- 1. Update get_review_vocabulary_cards
CREATE OR REPLACE FUNCTION get_review_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    english TEXT,
    russian TEXT,
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
        v.greek_transcription::TEXT AS greek,
        v.greek_transcription::TEXT AS greek_word,
        v.greek_phonetic::TEXT AS phonetic,
        NULL::TEXT as example_en,
        NULL::TEXT as example_gr,
        COALESCE(v.audio_url, v.en_audio_url)::TEXT AS audio_url,
        v.level::TEXT,
        v.difficulty::TEXT,
        uvp.fsrs_difficulty::REAL,
        uvp.fsrs_stability::REAL,
        uvp.fsrs_last_review,
        uvp.fsrs_due,
        uvp.fsrs_reps,
        uvp.fsrs_lapses,
        uvp.fsrs_state,
        v.created_at
    FROM multilingual_vocabulary v
    JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    JOIN latest_reviews lr
        ON lr.card_id = v.id
    WHERE 
        lr.rating = 2 -- Specifically HARD cards
    ORDER BY
        uvp.fsrs_last_review DESC
    LIMIT p_limit;
END;
$$;

-- 2. Update get_review_vocabulary_count
CREATE OR REPLACE FUNCTION get_review_vocabulary_count(p_user_id UUID)
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
    FROM latest_reviews
    WHERE rating = 2; -- Specifically HARD cards

    RETURN v_count;
END;
$$;

-- 3. Update get_weak_vocabulary_cards
CREATE OR REPLACE FUNCTION get_weak_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    english TEXT,
    russian TEXT,
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
        v.greek_transcription::TEXT AS greek,
        v.greek_transcription::TEXT AS greek_word,
        v.greek_phonetic::TEXT AS phonetic,
        NULL::TEXT as example_en,
        NULL::TEXT as example_gr,
        COALESCE(v.audio_url, v.en_audio_url)::TEXT AS audio_url,
        v.level::TEXT,
        v.difficulty::TEXT,
        uvp.fsrs_difficulty::REAL,
        uvp.fsrs_stability::REAL,
        uvp.fsrs_last_review,
        uvp.fsrs_due,
        uvp.fsrs_reps,
        uvp.fsrs_lapses,
        uvp.fsrs_state,
        v.created_at
    FROM multilingual_vocabulary v
    JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    JOIN latest_reviews lr
        ON lr.card_id = v.id
    WHERE 
        (lr.rating = 1 OR uvp.fsrs_lapses >= 2) -- FAILED or PERSISTENTLY WEAK
        AND lr.rating < 3 -- Exclude if last action was Good/Easy
    ORDER BY
        uvp.fsrs_lapses DESC,
        uvp.fsrs_last_review DESC
    LIMIT p_limit;
END;
$$;

-- 4. Update get_weak_vocabulary_count
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
    JOIN latest_reviews lr ON lr.card_id = uvp.vocabulary_id
    WHERE uvp.user_id = p_user_id
        AND (lr.rating = 1 OR uvp.fsrs_lapses >= 2)
        AND lr.rating < 3;

    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_review_vocabulary_cards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_review_vocabulary_count TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_count TO anon, authenticated;
