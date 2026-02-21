-- ============================================================================
-- Migration 094: Create Due Cards Today RPCs
-- ============================================================================
-- Purpose: Unify vocabulary and phrase FSRS for the "Due Cards Today" module
-- Date: 2026-02-21
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 094: Creating get_due_cards_today & update_phrase_fsrs RPCs';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. Create get_due_cards_today RPC
-- ============================================================================

DROP FUNCTION IF EXISTS get_due_cards_today(UUID, INT);

CREATE OR REPLACE FUNCTION get_due_cards_today(
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
    SELECT * FROM (
        -- 1. Vocabulary Cards
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
            COALESCE(uvp.fsrs_state, 'new') AS fsrs_state,
            uvp.fsrs_last_review,
            v.created_at
        FROM multilingual_vocabulary v
        LEFT JOIN user_vocabulary_progress uvp
            ON uvp.vocabulary_id = v.id
            AND uvp.user_id = p_user_id
        WHERE
            uvp.fsrs_due <= NOW()

        UNION ALL

        -- 2. Daily Phrase Cards
        SELECT
            p.id,
            'daily_phrase'::TEXT as type,
            p.en_translation::TEXT AS english,
            p.ru_translation::TEXT AS russian,
            p.greek_transcription::TEXT AS greek,
            p.greek_transcription::TEXT AS greek_word,
            NULL::TEXT AS phonetic,
            NULL::TEXT as example_en,
            NULL::TEXT as example_gr,
            COALESCE(p.audio_url, p.en_audio_url)::TEXT AS audio_url,
            p.level::TEXT,
            p.difficulty::TEXT,
            COALESCE(sp.fsrs_difficulty, 0.3)::DOUBLE PRECISION AS fsrs_difficulty,
            COALESCE(sp.fsrs_stability, 0.0)::DOUBLE PRECISION AS fsrs_stability,
            COALESCE(sp.fsrs_due, NOW()) AS fsrs_due,
            COALESCE(sp.fsrs_reps, 0) AS fsrs_reps,
            COALESCE(sp.fsrs_lapses, 0) AS fsrs_lapses,
            COALESCE(sp.fsrs_state, 'new') AS fsrs_state,
            sp.fsrs_last_review,
            p.created_at
        FROM daily_phrases p
        LEFT JOIN student_progress sp
            ON p.id = sp.phrase_id
            AND sp.student_id = p_user_id
        WHERE
            sp.fsrs_due <= NOW()
    ) combined_cards
    ORDER BY
        fsrs_due ASC NULLS FIRST,
        created_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_due_cards_today TO anon, authenticated;

COMMENT ON FUNCTION get_due_cards_today IS 'Returns vocabulary and phrase cards due for review using FSRS-6 scheduling';

DO $$
BEGIN
    RAISE NOTICE '✅ Created get_due_cards_today RPC function';
END $$;

-- ============================================================================
-- 2. Create update_phrase_fsrs function
-- ============================================================================

DROP FUNCTION IF EXISTS update_phrase_fsrs(UUID, UUID, INT, REAL, REAL, TIMESTAMPTZ, INT, INT, TEXT, REAL, REAL, REAL);
DROP FUNCTION IF EXISTS update_phrase_fsrs(UUID, UUID, INT, REAL, REAL, TIMESTAMPTZ, INT, INT, TEXT, REAL);

CREATE OR REPLACE FUNCTION update_phrase_fsrs(
    p_phrase_id UUID,
    p_user_id UUID,
    p_rating INT,
    p_new_difficulty REAL,
    p_new_stability REAL,
    p_new_due TIMESTAMPTZ,
    p_new_reps INT,
    p_new_lapses INT,
    p_new_state TEXT,
    p_interval_days REAL,
    p_old_difficulty REAL DEFAULT NULL,
    p_old_stability REAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Insert or update progress record
    INSERT INTO student_progress (
        student_id,
        phrase_id,
        fsrs_difficulty,
        fsrs_stability,
        fsrs_due,
        fsrs_reps,
        fsrs_lapses,
        fsrs_state,
        fsrs_last_review,
        last_reviewed
    )
    VALUES (
        p_user_id,
        p_phrase_id,
        p_new_difficulty,
        p_new_stability,
        p_new_due,
        p_new_reps,
        p_new_lapses,
        p_new_state,
        NOW(),
        NOW()
    )
    ON CONFLICT (student_id, phrase_id) WHERE phrase_id IS NOT NULL
    DO UPDATE SET
        fsrs_difficulty = p_new_difficulty,
        fsrs_stability = p_new_stability,
        fsrs_due = p_new_due,
        fsrs_reps = p_new_reps,
        fsrs_lapses = p_new_lapses,
        fsrs_state = p_new_state,
        fsrs_last_review = NOW(),
        last_reviewed = NOW();

    -- Return success status
    v_result := jsonb_build_object(
        'success', true,
        'phrase_id', p_phrase_id,
        'user_id', p_user_id,
        'rating', p_rating,
        'new_state', p_new_state,
        'next_due', p_new_due
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION update_phrase_fsrs TO anon, authenticated;

COMMENT ON FUNCTION update_phrase_fsrs IS 'Update FSRS parameters for a daily phrase after review';

DO $$
BEGIN
    RAISE NOTICE '✅ Created update_phrase_fsrs function';
END $$;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 094 COMPLETED';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ Created get_due_cards_today RPC for tracking all due cards';
    RAISE NOTICE '✅ Created update_phrase_fsrs RPC for saving phrase progress';
    RAISE NOTICE '';
END $$;
