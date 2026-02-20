-- ============================================================================
-- Migration 092: Vocabulary Review & Weak Words RPCs
-- ============================================================================
-- Purpose: Create RPC functions for Review Vocab and Weak Words modules
-- Date: 2026-02-19
-- Related: VOCAB-THREE-MODULES-PLAN.md
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 092: Creating Review Vocab & Weak Words RPCs';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- RPC 1: get_review_vocabulary_cards
-- ============================================================================
-- Returns vocabulary cards with last rating = Again (1) or Hard (2)
-- Uses fsrs_review_logs to find last rating per card
-- ============================================================================

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
            rating,
            review_time
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
        ORDER BY card_id, review_time DESC
    )
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
        COALESCE(v.en_audio_url) AS audio_url,
        v.level,
        v.difficulty,
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
    WHERE lr.rating IN (1, 2) -- Again or Hard
    ORDER BY lr.review_time DESC -- Newest difficult cards first
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_review_vocabulary_cards TO anon, authenticated;

COMMENT ON FUNCTION get_review_vocabulary_cards IS 'Returns vocabulary cards with last rating = Again (1) or Hard (2)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created get_review_vocabulary_cards RPC';
END $$;

-- ============================================================================
-- RPC 2: get_weak_vocabulary_cards
-- ============================================================================
-- Returns vocabulary cards with fsrs_lapses >= 2 (weak words)
-- Sorted by lapses (most difficult first)
-- ============================================================================

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
        COALESCE(v.en_audio_url) AS audio_url,
        v.level,
        v.difficulty,
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
    WHERE uvp.fsrs_lapses >= 2 -- At least 2x "Again"
    ORDER BY
        uvp.fsrs_lapses DESC, -- Most difficult first
        uvp.fsrs_last_review DESC -- Most recent first
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards TO anon, authenticated;

COMMENT ON FUNCTION get_weak_vocabulary_cards IS 'Returns vocabulary cards with fsrs_lapses >= 2 (weak words)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created get_weak_vocabulary_cards RPC';
END $$;

-- ============================================================================
-- RPC 3: get_review_vocabulary_count
-- ============================================================================
-- Returns count of cards with last rating = Again (1) or Hard (2)
-- Used for dashboard stats
-- ============================================================================

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
    WHERE rating IN (1, 2); -- Again or Hard

    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_review_vocabulary_count TO anon, authenticated;

COMMENT ON FUNCTION get_review_vocabulary_count IS 'Returns count of vocabulary cards with last rating = Again (1) or Hard (2)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created get_review_vocabulary_count RPC';
END $$;

-- ============================================================================
-- RPC 4: get_weak_vocabulary_count
-- ============================================================================
-- Returns count of cards with fsrs_lapses >= 2
-- Used for dashboard stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_weak_vocabulary_count(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM user_vocabulary_progress
    WHERE user_id = p_user_id
        AND fsrs_lapses >= 2;

    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_weak_vocabulary_count TO anon, authenticated;

COMMENT ON FUNCTION get_weak_vocabulary_count IS 'Returns count of vocabulary cards with fsrs_lapses >= 2 (weak words)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created get_weak_vocabulary_count RPC';
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 092 COMPLETED';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ Created 4 new RPCs:';
    RAISE NOTICE '✅   - get_review_vocabulary_cards (last rating 1/2)';
    RAISE NOTICE '✅   - get_weak_vocabulary_cards (lapses >= 2)';
    RAISE NOTICE '✅   - get_review_vocabulary_count (dashboard stat)';
    RAISE NOTICE '✅   - get_weak_vocabulary_count (dashboard stat)';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Test with:';
    RAISE NOTICE '   SELECT * FROM get_review_vocabulary_cards(''YOUR-USER-ID''::UUID, 5);';
    RAISE NOTICE '   SELECT * FROM get_weak_vocabulary_cards(''YOUR-USER-ID''::UUID, 5);';
    RAISE NOTICE '   SELECT get_review_vocabulary_count(''YOUR-USER-ID''::UUID);';
    RAISE NOTICE '   SELECT get_weak_vocabulary_count(''YOUR-USER-ID''::UUID);';
    RAISE NOTICE '';
END $$;
