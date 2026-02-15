-- Migration 060: Create Progress Statistics RPC Functions
-- Date: 2026-02-15
-- Purpose: Advanced progress tracking and analytics for user statistics

-- ============================================================================
-- Function 1: Get Progress Overview
-- ============================================================================
-- Returns comprehensive progress statistics for a user over a specified period
CREATE OR REPLACE FUNCTION get_progress_overview(
    p_user_id UUID,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    -- Review Statistics
    total_reviews BIGINT,
    total_correct BIGINT,
    avg_accuracy NUMERIC,

    -- Learning Progress
    cards_learned BIGINT,        -- Cards with at least 1 correct answer
    cards_mastered BIGINT,        -- Cards with high stability (>30 days)
    new_cards_added BIGINT,       -- New cards reviewed in period

    -- Time Statistics
    total_study_minutes NUMERIC,
    avg_session_minutes NUMERIC,
    total_sessions BIGINT,

    -- Improvement Metrics
    improvement_rate NUMERIC,     -- % change in accuracy over period
    consistency_score NUMERIC     -- How many days active / total days
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_half_period_start TIMESTAMPTZ;
    v_first_half_accuracy NUMERIC;
    v_second_half_accuracy NUMERIC;
    v_days_active BIGINT;
BEGIN
    -- Calculate period boundaries
    v_period_start := NOW() - (p_days || ' days')::INTERVAL;
    v_half_period_start := NOW() - ((p_days / 2) || ' days')::INTERVAL;

    RETURN QUERY
    WITH session_stats AS (
        SELECT
            COUNT(*) as session_count,
            COALESCE(SUM(duration_seconds) / 60.0, 0) as total_minutes,
            COALESCE(AVG(duration_seconds) / 60.0, 0) as avg_minutes
        FROM public.learning_sessions
        WHERE student_id = p_user_id
            AND started_at >= v_period_start
            AND completed = true
    ),
    review_stats AS (
        SELECT
            COUNT(*) as review_count,
            COUNT(*) FILTER (WHERE rating >= 3) as correct_count
        FROM public.fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_period_start
    ),
    card_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE fsrs_reps > 0) as learned_count,
            COUNT(*) FILTER (WHERE fsrs_stability >= 30) as mastered_count,
            COUNT(*) FILTER (WHERE created_at >= v_period_start AND fsrs_reps > 0) as new_cards_count
        FROM public.learning_items
        WHERE id IN (
            SELECT DISTINCT card_id
            FROM public.fsrs_review_logs
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
        FROM public.fsrs_review_logs
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
        FROM public.fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_half_period_start
    ),
    active_days AS (
        SELECT COUNT(DISTINCT DATE(started_at)) as days_count
        FROM public.learning_sessions
        WHERE student_id = p_user_id
            AND started_at >= v_period_start
    )
    SELECT
        -- Review Statistics
        COALESCE(rs.review_count, 0)::BIGINT,
        COALESCE(rs.correct_count, 0)::BIGINT,
        CASE
            WHEN COALESCE(rs.review_count, 0) > 0
            THEN ROUND((rs.correct_count::NUMERIC / rs.review_count) * 100, 2)
            ELSE 0
        END,

        -- Learning Progress
        COALESCE(cs.learned_count, 0)::BIGINT,
        COALESCE(cs.mastered_count, 0)::BIGINT,
        COALESCE(cs.new_cards_count, 0)::BIGINT,

        -- Time Statistics
        ROUND(COALESCE(ss.total_minutes, 0), 2),
        ROUND(COALESCE(ss.avg_minutes, 0), 2),
        COALESCE(ss.session_count, 0)::BIGINT,

        -- Improvement Metrics
        CASE
            WHEN COALESCE(fha.accuracy, 0) > 0
            THEN ROUND(((sha.accuracy - fha.accuracy) / fha.accuracy) * 100, 2)
            ELSE 0
        END,
        CASE
            WHEN p_days > 0
            THEN ROUND((COALESCE(ad.days_count, 0)::NUMERIC / p_days) * 100, 2)
            ELSE 0
        END
    FROM session_stats ss
    CROSS JOIN review_stats rs
    CROSS JOIN card_stats cs
    CROSS JOIN first_half_accuracy fha
    CROSS JOIN second_half_accuracy sha
    CROSS JOIN active_days ad;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_progress_overview TO anon;
GRANT EXECUTE ON FUNCTION get_progress_overview TO authenticated;

COMMENT ON FUNCTION get_progress_overview IS 'Returns comprehensive progress statistics for analytics dashboard';

-- ============================================================================
-- Function 2: Get Learning Trends
-- ============================================================================
-- Returns daily learning trends for chart visualization
CREATE OR REPLACE FUNCTION get_learning_trends(
    p_user_id UUID,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    reviews_count BIGINT,
    correct_count BIGINT,
    accuracy_percentage NUMERIC,
    study_minutes NUMERIC,
    new_cards INT,
    avg_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
BEGIN
    v_period_start := NOW() - (p_days || ' days')::INTERVAL;

    RETURN QUERY
    WITH date_series AS (
        -- Generate date series for all days in period
        SELECT generate_series(
            DATE(v_period_start),
            DATE(NOW()),
            '1 day'::INTERVAL
        )::DATE as day
    ),
    daily_reviews AS (
        SELECT
            DATE(review_time) as review_date,
            COUNT(*) as reviews,
            COUNT(*) FILTER (WHERE rating >= 3) as correct,
            AVG(rating) as avg_rating
        FROM public.fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_period_start
        GROUP BY DATE(review_time)
    ),
    daily_sessions AS (
        SELECT
            DATE(started_at) as session_date,
            SUM(duration_seconds) / 60.0 as minutes
        FROM public.learning_sessions
        WHERE student_id = p_user_id
            AND started_at >= v_period_start
            AND completed = true
        GROUP BY DATE(started_at)
    ),
    daily_new_cards AS (
        SELECT
            DATE(frl.review_time) as card_date,
            COUNT(DISTINCT frl.card_id) as new_count
        FROM public.fsrs_review_logs frl
        WHERE frl.user_id = p_user_id
            AND frl.review_time >= v_period_start
            AND frl.rating = 1  -- First review (Again) often indicates new card
        GROUP BY DATE(frl.review_time)
    )
    SELECT
        ds.day,
        COALESCE(dr.reviews, 0)::BIGINT,
        COALESCE(dr.correct, 0)::BIGINT,
        CASE
            WHEN COALESCE(dr.reviews, 0) > 0
            THEN ROUND((dr.correct::NUMERIC / dr.reviews) * 100, 2)
            ELSE 0
        END,
        ROUND(COALESCE(dsess.minutes, 0), 2),
        COALESCE(dnc.new_count, 0)::INT,
        ROUND(COALESCE(dr.avg_rating, 0), 2)
    FROM date_series ds
    LEFT JOIN daily_reviews dr ON ds.day = dr.review_date
    LEFT JOIN daily_sessions dsess ON ds.day = dsess.session_date
    LEFT JOIN daily_new_cards dnc ON ds.day = dnc.card_date
    ORDER BY ds.day ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_learning_trends TO anon;
GRANT EXECUTE ON FUNCTION get_learning_trends TO authenticated;

COMMENT ON FUNCTION get_learning_trends IS 'Returns daily learning statistics for trend charts and analytics';

-- ============================================================================
-- Function 3: Get Weekly Activity Heatmap
-- ============================================================================
-- Returns weekly activity data for heatmap visualization
CREATE OR REPLACE FUNCTION get_weekly_activity(
    p_user_id UUID,
    p_weeks INT DEFAULT 12
)
RETURNS TABLE (
    week_start DATE,
    week_number INT,
    day_of_week INT,              -- 0=Sunday, 6=Saturday
    day_name TEXT,
    activity_score INT,           -- 0-100 based on reviews
    reviews_count INT,
    study_minutes NUMERIC,
    is_today BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_max_daily_reviews INT;
BEGIN
    v_period_start := NOW() - (p_weeks * 7 || ' days')::INTERVAL;

    -- Find max reviews in a single day for scaling
    SELECT COALESCE(MAX(daily_count), 1) INTO v_max_daily_reviews
    FROM (
        SELECT COUNT(*) as daily_count
        FROM public.fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_period_start
        GROUP BY DATE(review_time)
    ) sub;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            DATE(v_period_start),
            DATE(NOW()),
            '1 day'::INTERVAL
        )::DATE as day
    ),
    daily_activity AS (
        SELECT
            DATE(review_time) as activity_date,
            COUNT(*) as reviews,
            0 as minutes  -- Placeholder for future session time integration
        FROM public.fsrs_review_logs
        WHERE user_id = p_user_id
            AND review_time >= v_period_start
        GROUP BY DATE(review_time)
    )
    SELECT
        DATE_TRUNC('week', ds.day)::DATE as week_start,
        EXTRACT(WEEK FROM ds.day)::INT as week_num,
        EXTRACT(DOW FROM ds.day)::INT as dow,
        TO_CHAR(ds.day, 'Dy') as day_name,
        -- Activity score: 0-100 based on reviews relative to max
        CASE
            WHEN COALESCE(da.reviews, 0) = 0 THEN 0
            WHEN v_max_daily_reviews = 0 THEN 0
            ELSE LEAST(ROUND((da.reviews::NUMERIC / v_max_daily_reviews) * 100), 100)::INT
        END,
        COALESCE(da.reviews, 0)::INT,
        ROUND(COALESCE(da.minutes, 0), 2),
        (ds.day = CURRENT_DATE)
    FROM date_series ds
    LEFT JOIN daily_activity da ON ds.day = da.activity_date
    ORDER BY ds.day ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_weekly_activity TO anon;
GRANT EXECUTE ON FUNCTION get_weekly_activity TO authenticated;

COMMENT ON FUNCTION get_weekly_activity IS 'Returns weekly activity data for heatmap visualization';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Test get_progress_overview
-- SELECT * FROM get_progress_overview('<user-id>'::UUID, 30);

-- Test get_learning_trends
-- SELECT * FROM get_learning_trends('<user-id>'::UUID, 7);

-- Test get_weekly_activity
-- SELECT * FROM get_weekly_activity('<user-id>'::UUID, 4);

-- ============================================================================
-- Migration Complete
-- ============================================================================
COMMENT ON SCHEMA public IS 'Migration 060: Progress Statistics RPC Functions - COMPLETE';
