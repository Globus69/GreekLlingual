-- ============================================================================
-- Migration 089: Fix get_due_cards_fsrs Return Type
-- ============================================================================
-- Purpose: Fix "structure of query does not match function result type" error
-- Date: 2026-02-18
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 089: Fixing get_due_cards_fsrs return type';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- Drop existing function
DROP FUNCTION IF EXISTS get_due_cards_fsrs(UUID, TEXT, INT);

-- Recreate with correct types
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
        v.en_translation AS english,
        v.ru_translation AS russian,
        v.greek_transcription AS greek,
        v.greek_transcription AS greek_word,
        v.greek_phonetic AS phonetic,
        NULL::TEXT as example_en,
        NULL::TEXT as example_gr,
        COALESCE(v.audio_url, v.en_audio_url) AS audio_url,
        v.level,
        v.difficulty,
        COALESCE(uvp.fsrs_difficulty, 0.3)::DOUBLE PRECISION AS fsrs_difficulty,
        COALESCE(uvp.fsrs_stability, 0.0)::DOUBLE PRECISION AS fsrs_stability,
        COALESCE(uvp.fsrs_due, NOW()) AS fsrs_due,
        COALESCE(uvp.fsrs_reps, 0) AS fsrs_reps,
        COALESCE(uvp.fsrs_lapses, 0) AS fsrs_lapses,
        COALESCE(uvp.fsrs_state, 'new') AS fsrs_state,
        uvp.fsrs_last_review,
        v.created_at
    FROM multilingual_vocabulary v
    LEFT JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    WHERE
        (p_level IS NULL OR v.level = p_level)
        AND (uvp.fsrs_due IS NULL OR uvp.fsrs_due <= NOW())
    ORDER BY
        uvp.fsrs_due ASC NULLS FIRST,
        v.created_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_due_cards_fsrs TO anon, authenticated;

COMMENT ON FUNCTION get_due_cards_fsrs IS 'Returns vocabulary cards due for review using FSRS-6 scheduling with user-specific progress';

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed get_due_cards_fsrs function';
    RAISE NOTICE '';
END $$;
