-- ============================================================================
-- Migration 092 HOTFIX: Review Vocab ohne fsrs_review_logs
-- ============================================================================
-- Problem: fsrs_review_logs Tabelle ist leer
-- Lösung: Review Vocab filtert auf fsrs_state = 'relearning' + fsrs_lapses = 1
-- Date: 2026-02-19
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ============================================================';
    RAISE NOTICE '🔧 HOTFIX: Review Vocab RPC (ohne fsrs_review_logs)';
    RAISE NOTICE '🔧 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- Drop alte Version
-- ============================================================================

DROP FUNCTION IF EXISTS get_review_vocabulary_cards(UUID, INT);

DO $$
BEGIN
    RAISE NOTICE '🗑️  Dropped old get_review_vocabulary_cards';
END $$;

-- ============================================================================
-- Neue Version: Filter auf user_vocabulary_progress statt fsrs_review_logs
-- ============================================================================

CREATE FUNCTION get_review_vocabulary_cards(
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
    -- Filter Logic:
    -- 1. Cards with fsrs_lapses = 1 (rated "Again" once, but not weak yet)
    -- 2. Cards with fsrs_state = 'relearning' (currently in relearning phase)
    -- 3. Exclude cards with lapses >= 2 (those go to Weak Words)

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
    WHERE (
        -- Cards with 1 lapse (Again once, not weak yet)
        uvp.fsrs_lapses = 1
        OR
        -- Cards in relearning state (after "Again" rating)
        uvp.fsrs_state = 'relearning'
    )
    AND uvp.fsrs_lapses < 2 -- Exclude weak words (they have own module)
    ORDER BY
        uvp.fsrs_last_review DESC NULLS LAST,
        uvp.fsrs_lapses DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_review_vocabulary_cards TO anon, authenticated;

COMMENT ON FUNCTION get_review_vocabulary_cards IS 'Returns vocabulary cards with lapses=1 or state=relearning (review needed, not weak yet)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created new get_review_vocabulary_cards RPC (hotfix)';
END $$;

-- ============================================================================
-- Update Count Function (use same logic)
-- ============================================================================

DROP FUNCTION IF EXISTS get_review_vocabulary_count(UUID);

CREATE FUNCTION get_review_vocabulary_count(p_user_id UUID)
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
        AND (fsrs_lapses = 1 OR fsrs_state = 'relearning')
        AND fsrs_lapses < 2;

    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_review_vocabulary_count TO anon, authenticated;

COMMENT ON FUNCTION get_review_vocabulary_count IS 'Returns count of vocabulary cards needing review (lapses=1 or relearning)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created new get_review_vocabulary_count RPC (hotfix)';
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ HOTFIX COMPLETED';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ Fixed get_review_vocabulary_cards (no fsrs_review_logs needed)';
    RAISE NOTICE '✅ Fixed get_review_vocabulary_count';
    RAISE NOTICE '';
    RAISE NOTICE '💡 New Logic:';
    RAISE NOTICE '   Review Vocab = cards with lapses=1 OR state=relearning';
    RAISE NOTICE '   Weak Words = cards with lapses>=2';
    RAISE NOTICE '   Due Cards = cards with fsrs_due <= NOW()';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Test with:';
    RAISE NOTICE '   SELECT * FROM get_review_vocabulary_cards(''YOUR-USER-ID''::UUID, 5);';
    RAISE NOTICE '   SELECT get_review_vocabulary_count(''YOUR-USER-ID''::UUID);';
    RAISE NOTICE '';
END $$;
