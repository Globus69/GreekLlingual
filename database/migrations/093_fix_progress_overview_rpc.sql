-- ============================================================================
-- Migration 093: Fix get_progress_overview RPC Function
-- ============================================================================
-- Purpose: Update get_progress_overview to read FSRS data from user_vocabulary_progress
--          instead of directly from multilingual_vocabulary.
-- Date: 2026-02-20
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 093: Fixing get_progress_overview RPC';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

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
            -- Vocab cards: get fsrs state from user_vocabulary_progress
            SELECT 
                v.id, 
                COALESCE(uvp.fsrs_reps, 0) as fsrs_reps, 
                COALESCE(uvp.fsrs_stability, 0.0) as fsrs_stability, 
                v.created_at
            FROM multilingual_vocabulary v
            JOIN user_vocabulary_progress uvp 
                ON v.id = uvp.vocabulary_id 
                AND uvp.user_id = p_user_id

            UNION ALL

            -- Phrase cards: fsrs state is stored in student_progress
            SELECT 
                p.id, 
                COALESCE(sp.fsrs_reps, 0) as fsrs_reps, 
                COALESCE(sp.fsrs_stability, 0.0) as fsrs_stability, 
                p.created_at
            FROM daily_phrases p
            LEFT JOIN student_progress sp 
                ON p.id = sp.phrase_id 
                AND sp.student_id = p_user_id
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

COMMENT ON FUNCTION get_progress_overview IS 'Returns comprehensive progress statistics (fixed for user_vocabulary_progress)';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 093 COMPLETE';
    RAISE NOTICE '✅ Updated get_progress_overview function to join user_vocabulary_progress';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '';
END $$;
