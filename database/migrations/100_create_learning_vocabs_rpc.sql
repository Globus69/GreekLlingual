-- ============================================================================
-- Migration 100: Create get_learning_vocabulary_cards RPC
-- ============================================================================
-- Purpose: Support the "Mastery Loop" in Vocabulary Practice.
--          Fetches cards that are in learning/relearning states OR were 
--          reviewed today.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_learning_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 50
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
    fsrs_difficulty DOUBLE PRECISION,
    fsrs_stability DOUBLE PRECISION,
    fsrs_due TIMESTAMPTZ,
    fsrs_reps INT,
    fsrs_lapses INT,
    fsrs_state TEXT,
    fsrs_last_review TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (v.id)
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
        COALESCE(uvp.fsrs_difficulty, 0.3)::DOUBLE PRECISION AS fsrs_difficulty,
        COALESCE(uvp.fsrs_stability, 0.0)::DOUBLE PRECISION AS fsrs_stability,
        COALESCE(uvp.fsrs_due, NOW()) AS fsrs_due,
        COALESCE(uvp.fsrs_reps, 0) AS fsrs_reps,
        COALESCE(uvp.fsrs_lapses, 0) AS fsrs_lapses,
        COALESCE(uvp.fsrs_state, 'new')::TEXT AS fsrs_state,
        uvp.fsrs_last_review,
        v.created_at
    FROM multilingual_vocabulary v
    JOIN user_vocabulary_progress uvp 
        ON uvp.vocabulary_id = v.id 
        AND uvp.user_id = p_user_id
    LEFT JOIN fsrs_review_logs l
        ON l.card_id = v.id
        AND l.user_id = p_user_id
        AND l.review_time >= CURRENT_DATE
    WHERE
        -- 1. Cards processed today
        l.id IS NOT NULL
        -- 2. OR Cards in active learning states
        OR uvp.fsrs_state IN ('learning', 'relearning')
        -- 3. OR Cards that are actually due
        OR uvp.fsrs_due <= NOW()
    ORDER BY
        v.id,
        uvp.fsrs_due ASC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_learning_vocabulary_cards TO anon, authenticated;
