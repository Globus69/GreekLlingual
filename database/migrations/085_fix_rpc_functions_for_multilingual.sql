-- ============================================================================
-- Migration 085: Fix RPC Functions for Multilingual Schema
-- ============================================================================
-- Purpose: Update RPC functions to work with multilingual_vocabulary and daily_phrases
-- Date: 2026-02-18
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 085: Fixing RPC functions for multilingual schema';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. Create get_practice_enabled_items function
-- ============================================================================

DROP FUNCTION IF EXISTS get_practice_enabled_items();

CREATE OR REPLACE FUNCTION get_practice_enabled_items()
RETURNS TABLE (
    id UUID,
    type TEXT,
    greek_transcription TEXT,
    greek_phonetic TEXT,
    audio_url TEXT,
    en_translation TEXT,
    de_translation TEXT,
    es_translation TEXT,
    ru_translation TEXT,
    level TEXT,
    difficulty TEXT,
    frequency INTEGER,
    practice_modes_config JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    -- Get vocabulary items with practice modes enabled
    SELECT
        v.id,
        'vocabulary'::TEXT as type,
        v.greek_transcription,
        v.greek_phonetic,
        v.audio_url,
        v.en_translation,
        v.de_translation,
        v.es_translation,
        v.ru_translation,
        v.level,
        v.difficulty,
        v.frequency,
        v.practice_modes_config,
        v.created_at,
        v.updated_at
    FROM multilingual_vocabulary v
    WHERE v.practice_modes_config IS NOT NULL
        AND (v.practice_modes_config->>'enabled')::boolean = true

    UNION ALL

    -- Get phrase items with practice modes enabled
    SELECT
        p.id,
        'daily-phrases'::TEXT as type,
        p.greek_transcription,
        p.greek_phonetic,
        p.audio_url,
        p.en_translation,
        p.de_translation,
        p.es_translation,
        p.ru_translation,
        p.level,
        p.difficulty,
        p.frequency,
        p.practice_modes_config,
        p.created_at,
        p.updated_at
    FROM daily_phrases p
    WHERE p.practice_modes_config IS NOT NULL
        AND (p.practice_modes_config->>'enabled')::boolean = true

    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_practice_enabled_items TO anon, authenticated;

COMMENT ON FUNCTION get_practice_enabled_items IS 'Returns vocabulary and phrases with practice modes enabled';

-- ============================================================================
-- 2. Update get_due_cards_fsrs function
-- ============================================================================

DROP FUNCTION IF EXISTS get_due_cards_fsrs(UUID, TEXT, INT);

CREATE OR REPLACE FUNCTION get_due_cards_fsrs(
    p_user_id UUID,
    p_level TEXT DEFAULT NULL,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    front TEXT,
    greek_word TEXT,
    phonetic TEXT,
    audio_url TEXT,
    level TEXT,
    difficulty TEXT,
    fsrs_difficulty REAL,
    fsrs_stability REAL,
    fsrs_due TIMESTAMPTZ,
    fsrs_reps INT,
    fsrs_lapses INT,
    fsrs_state TEXT,
    fsrs_last_review TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    -- Get vocabulary cards
    SELECT
        v.id,
        'vocabulary'::TEXT as type,
        COALESCE(v.en_translation, v.de_translation, v.es_translation, v.ru_translation, '') AS front,
        v.greek_transcription AS greek_word,
        v.greek_phonetic AS phonetic,
        v.audio_url,
        v.level,
        v.difficulty,
        v.fsrs_difficulty,
        v.fsrs_stability,
        v.fsrs_due,
        v.fsrs_reps,
        v.fsrs_lapses,
        v.fsrs_state,
        v.fsrs_last_review
    FROM multilingual_vocabulary v
    WHERE
        (p_level IS NULL OR v.level = p_level)
        AND (v.fsrs_due IS NULL OR v.fsrs_due <= NOW())

    UNION ALL

    -- Get phrase cards
    SELECT
        p.id,
        'daily-phrases'::TEXT as type,
        COALESCE(p.en_translation, p.de_translation, p.es_translation, p.ru_translation, '') AS front,
        p.greek_transcription AS greek_word,
        p.greek_phonetic AS phonetic,
        p.audio_url,
        p.level,
        p.difficulty,
        p.fsrs_difficulty,
        p.fsrs_stability,
        p.fsrs_due,
        p.fsrs_reps,
        p.fsrs_lapses,
        p.fsrs_state,
        p.fsrs_last_review
    FROM daily_phrases p
    WHERE
        (p_level IS NULL OR p.level = p_level)
        AND (p.fsrs_due IS NULL OR p.fsrs_due <= NOW())

    ORDER BY
        fsrs_due ASC NULLS FIRST
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_due_cards_fsrs TO anon, authenticated;

COMMENT ON FUNCTION get_due_cards_fsrs IS 'Returns cards that are due for review using FSRS-6 scheduling (multilingual)';

-- ============================================================================
-- 3. Update get_progress_overview function
-- ============================================================================

DROP FUNCTION IF EXISTS get_progress_overview(UUID, INT);

CREATE OR REPLACE FUNCTION get_progress_overview(
    p_user_id UUID,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    total_reviews BIGINT,
    total_correct BIGINT,
    avg_accuracy NUMERIC,
    cards_learned BIGINT,
    cards_mastered BIGINT,
    new_cards_added BIGINT,
    total_study_minutes NUMERIC,
    avg_session_minutes NUMERIC,
    total_sessions BIGINT,
    improvement_rate NUMERIC,
    consistency_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_half_period_start TIMESTAMPTZ;
BEGIN
    v_period_start := NOW() - (p_days || ' days')::INTERVAL;
    v_half_period_start := NOW() - ((p_days / 2) || ' days')::INTERVAL;

    RETURN QUERY
    WITH session_stats AS (
        SELECT
            COUNT(*) as session_count,
            COALESCE(SUM(duration_seconds) / 60.0, 0) as total_minutes,
            COALESCE(AVG(duration_seconds) / 60.0, 0) as avg_minutes
        FROM learning_sessions
        WHERE student_id = p_user_id
            AND started_at >= v_period_start
            AND completed = true
    ),
    review_stats AS (
        SELECT
            COUNT(*) as review_count,
            COUNT(*) FILTER (WHERE rating >= 3) as correct_count
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_period_start
    ),
    card_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE fsrs_reps > 0) as learned_count,
            COUNT(*) FILTER (WHERE fsrs_stability >= 30) as mastered_count,
            COUNT(*) FILTER (WHERE created_at >= v_period_start AND fsrs_reps > 0) as new_cards_count
        FROM (
            SELECT id, fsrs_reps, fsrs_stability, created_at
            FROM multilingual_vocabulary
            UNION ALL
            SELECT id, fsrs_reps, fsrs_stability, created_at
            FROM daily_phrases
        ) all_cards
        WHERE id IN (
            SELECT DISTINCT card_id
            FROM fsrs_review_logs
            WHERE user_id = p_user_id
        )
    ),
    first_half_accuracy AS (
        SELECT
            CASE
                WHEN COUNT(*) > 0
                THEN (COUNT(*) FILTER (WHERE rating >= 3)::NUMERIC / COUNT(*)) * 100
                ELSE 0
            END as accuracy
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_period_start
            AND review_time < v_half_period_start
    ),
    second_half_accuracy AS (
        SELECT
            CASE
                WHEN COUNT(*) > 0
                THEN (COUNT(*) FILTER (WHERE rating >= 3)::NUMERIC / COUNT(*)) * 100
                ELSE 0
            END as accuracy
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_half_period_start
    ),
    active_days AS (
        SELECT COUNT(DISTINCT DATE(review_time)) as days_active
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_period_start
    )
    SELECT
        rs.review_count::BIGINT,
        rs.correct_count::BIGINT,
        CASE
            WHEN rs.review_count > 0
            THEN ROUND((rs.correct_count::NUMERIC / rs.review_count) * 100, 2)
            ELSE 0
        END,
        cs.learned_count::BIGINT,
        cs.mastered_count::BIGINT,
        cs.new_cards_count::BIGINT,
        ROUND(ss.total_minutes::NUMERIC, 2),
        ROUND(ss.avg_minutes::NUMERIC, 2),
        ss.session_count::BIGINT,
        ROUND((sha.accuracy - fha.accuracy)::NUMERIC, 2) as improvement_rate,
        CASE
            WHEN p_days > 0
            THEN ROUND((ad.days_active::NUMERIC / p_days) * 100, 2)
            ELSE 0
        END as consistency_score
    FROM session_stats ss
    CROSS JOIN review_stats rs
    CROSS JOIN card_stats cs
    CROSS JOIN first_half_accuracy fha
    CROSS JOIN second_half_accuracy sha
    CROSS JOIN active_days ad;
END;
$$;

GRANT EXECUTE ON FUNCTION get_progress_overview TO anon, authenticated;

COMMENT ON FUNCTION get_progress_overview IS 'Returns comprehensive progress statistics (multilingual schema)';

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 085 COMPLETE';
    RAISE NOTICE '✅ Created get_practice_enabled_items function';
    RAISE NOTICE '✅ Updated get_due_cards_fsrs function';
    RAISE NOTICE '✅ Updated get_progress_overview function';
    RAISE NOTICE '✅ All RPC functions now work with multilingual schema';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '';
END $$;
