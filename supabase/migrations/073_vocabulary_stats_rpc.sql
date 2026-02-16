-- Migration 073: Create Vocabulary Stats RPC Function
-- Date: 2026-02-16
-- Purpose: Analytics and statistics for Vocabulary module
-- Related: Phase 2 - Analytics & Stats Dashboard

-- ============================================================================
-- Function: Get Vocabulary Statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_vocabulary_stats(
    p_user_id UUID,
    p_days INT DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_due_today INT;
    v_total_reviews INT;
    v_total_correct INT;  -- Ratings 3-4
    v_total_incorrect INT; -- Ratings 1-2
    v_retention_rate REAL;
    v_avg_difficulty REAL;
    v_cards_new INT;
    v_cards_learning INT;
    v_cards_review INT;
    v_cards_relearning INT;
    v_daily_reviews JSON;
    v_result JSON;
BEGIN
    -- 1. Cards due today
    SELECT COUNT(*)
    INTO v_due_today
    FROM public.student_progress sp
    JOIN public.learning_items li ON li.id = sp.item_id
    WHERE sp.student_id = p_user_id
      AND li.type = 'vocabulary'
      AND sp.fsrs_due <= NOW();

    -- 2. Total reviews in last X days
    SELECT COUNT(*)
    INTO v_total_reviews
    FROM public.fsrs_review_logs
    WHERE user_id = p_user_id
      AND review_time >= NOW() - (p_days || ' days')::INTERVAL
      AND card_id IN (
          SELECT id FROM public.learning_items WHERE type = 'vocabulary'
      );

    -- 3. Correct vs Incorrect reviews (last X days)
    SELECT
        COUNT(*) FILTER (WHERE rating IN (3, 4)) AS correct,
        COUNT(*) FILTER (WHERE rating IN (1, 2)) AS incorrect
    INTO v_total_correct, v_total_incorrect
    FROM public.fsrs_review_logs
    WHERE user_id = p_user_id
      AND review_time >= NOW() - (p_days || ' days')::INTERVAL
      AND card_id IN (
          SELECT id FROM public.learning_items WHERE type = 'vocabulary'
      );

    -- 4. Calculate retention rate
    IF v_total_reviews > 0 THEN
        v_retention_rate := (v_total_correct::REAL / v_total_reviews::REAL) * 100;
    ELSE
        v_retention_rate := 0;
    END IF;

    -- 5. Average difficulty
    SELECT COALESCE(AVG(sp.fsrs_difficulty), 0)
    INTO v_avg_difficulty
    FROM public.student_progress sp
    JOIN public.learning_items li ON li.id = sp.item_id
    WHERE sp.student_id = p_user_id
      AND li.type = 'vocabulary'
      AND sp.fsrs_reps > 0; -- Only cards that have been reviewed

    -- 6. Cards by state
    SELECT
        COUNT(*) FILTER (WHERE COALESCE(sp.fsrs_state, 'new') = 'new'),
        COUNT(*) FILTER (WHERE sp.fsrs_state = 'learning'),
        COUNT(*) FILTER (WHERE sp.fsrs_state = 'review'),
        COUNT(*) FILTER (WHERE sp.fsrs_state = 'relearning')
    INTO v_cards_new, v_cards_learning, v_cards_review, v_cards_relearning
    FROM public.learning_items li
    LEFT JOIN public.student_progress sp
        ON sp.item_id = li.id
        AND sp.student_id = p_user_id
    WHERE li.type = 'vocabulary';

    -- 7. Daily reviews breakdown (last X days)
    SELECT json_agg(
        json_build_object(
            'date', day::DATE,
            'reviews', COALESCE(review_count, 0),
            'correct', COALESCE(correct_count, 0),
            'incorrect', COALESCE(incorrect_count, 0)
        ) ORDER BY day
    )
    INTO v_daily_reviews
    FROM (
        -- Generate date series
        SELECT generate_series(
            NOW()::DATE - (p_days - 1),
            NOW()::DATE,
            '1 day'::INTERVAL
        )::DATE AS day
    ) dates
    LEFT JOIN (
        -- Aggregate reviews per day
        SELECT
            review_time::DATE AS review_date,
            COUNT(*) AS review_count,
            COUNT(*) FILTER (WHERE rating IN (3, 4)) AS correct_count,
            COUNT(*) FILTER (WHERE rating IN (1, 2)) AS incorrect_count
        FROM public.fsrs_review_logs
        WHERE user_id = p_user_id
          AND review_time >= NOW() - (p_days || ' days')::INTERVAL
          AND card_id IN (
              SELECT id FROM public.learning_items WHERE type = 'vocabulary'
          )
        GROUP BY review_time::DATE
    ) reviews ON reviews.review_date = dates.day;

    -- 8. Build result JSON
    v_result := json_build_object(
        'due_today', v_due_today,
        'total_reviews', v_total_reviews,
        'retention_rate', ROUND(v_retention_rate::NUMERIC, 1),
        'avg_difficulty', ROUND(v_avg_difficulty::NUMERIC, 2),
        'cards_by_state', json_build_object(
            'new', v_cards_new,
            'learning', v_cards_learning,
            'review', v_cards_review,
            'relearning', v_cards_relearning
        ),
        'daily_reviews', COALESCE(v_daily_reviews, '[]'::JSON),
        'period_days', p_days
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN json_build_object(
            'error', SQLERRM,
            'message', 'Failed to get vocabulary stats'
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_vocabulary_stats TO anon;
GRANT EXECUTE ON FUNCTION get_vocabulary_stats TO authenticated;

COMMENT ON FUNCTION get_vocabulary_stats IS 'Returns comprehensive vocabulary learning statistics for a user';

-- ============================================================================
-- Verification Query (Run in Supabase SQL Editor to test)
-- ============================================================================
-- SELECT get_vocabulary_stats('YOUR-USER-ID-HERE'::UUID, 7);

-- Expected output:
-- {
--   "due_today": 5,
--   "total_reviews": 42,
--   "retention_rate": 85.7,
--   "avg_difficulty": 6.8,
--   "cards_by_state": {
--     "new": 15,
--     "learning": 8,
--     "review": 12,
--     "relearning": 3
--   },
--   "daily_reviews": [
--     {"date": "2026-02-10", "reviews": 5, "correct": 4, "incorrect": 1},
--     {"date": "2026-02-11", "reviews": 8, "correct": 7, "incorrect": 1},
--     ...
--   ],
--   "period_days": 7
-- }

-- ============================================================================
-- End of Migration 073
-- ============================================================================
