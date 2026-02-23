-- ============================================================================
-- Migration 099: Tighten get_due_cards_fsrs
-- ============================================================================
-- Purpose: Only return cards that are actually due for review (exclude new cards).
--          This aligns the dialog content with the dashboard dueCount.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_due_cards_fsrs(
    p_user_id UUID,
    p_level TEXT DEFAULT NULL,
    p_limit INT DEFAULT 100
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
        COALESCE(uvp.fsrs_difficulty, 0.3)::DOUBLE PRECISION AS fsrs_difficulty,
        COALESCE(uvp.fsrs_stability, 0.0)::DOUBLE PRECISION AS fsrs_stability,
        COALESCE(uvp.fsrs_due, NOW()) AS fsrs_due,
        COALESCE(uvp.fsrs_reps, 0) AS fsrs_reps,
        COALESCE(uvp.fsrs_lapses, 0) AS fsrs_lapses,
        COALESCE(uvp.fsrs_state, 'new')::TEXT AS fsrs_state,
        uvp.fsrs_last_review,
        v.created_at
    FROM multilingual_vocabulary v
    -- Use INNER JOIN to ensure only cards with a progress record are returned
    -- OR keep LEFT JOIN but ensure fsrs_due is specifically <= NOW()
    JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    WHERE
        (p_level IS NULL OR v.level = p_level)
        AND uvp.fsrs_due <= NOW()
    ORDER BY
        uvp.fsrs_due ASC,
        v.created_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_due_cards_fsrs TO anon, authenticated;
