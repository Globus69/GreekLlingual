-- Migration 054: Create FSRS RPC Functions
-- Date: 2026-02-15
-- Purpose: Database functions for FSRS scheduling

-- ============================================================================
-- Function 1: Get Due Cards for FSRS
-- ============================================================================
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
    example_en TEXT,
    example_gr TEXT,
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
    SELECT
        li.id,
        li.type,
        li.english AS front,
        li.greek AS greek_word,
        li.phonetic,
        li.example_en,
        li.example_gr,
        li.audio_url,
        li.level,
        li.difficulty,
        li.fsrs_difficulty,
        li.fsrs_stability,
        li.fsrs_due,
        li.fsrs_reps,
        li.fsrs_lapses,
        li.fsrs_state,
        li.fsrs_last_review
    FROM public.learning_items li
    WHERE
        -- Filter by type (vocabulary or daily-phrases)
        li.type IN ('vocabulary', 'daily-phrases')
        -- Filter by level if specified
        AND (p_level IS NULL OR li.level = p_level)
        -- Only cards that are due (or never reviewed)
        AND (li.fsrs_due IS NULL OR li.fsrs_due <= NOW())
    ORDER BY
        -- Prioritize: never reviewed → oldest due → newest
        li.fsrs_due ASC NULLS FIRST,
        li.created_at ASC
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_due_cards_fsrs TO anon;
GRANT EXECUTE ON FUNCTION get_due_cards_fsrs TO authenticated;

COMMENT ON FUNCTION get_due_cards_fsrs IS 'Returns cards that are due for review using FSRS-6 scheduling';

-- ============================================================================
-- Function 2: Update Card After FSRS Rating
-- ============================================================================
CREATE OR REPLACE FUNCTION update_card_fsrs(
    p_card_id UUID,
    p_user_id UUID,
    p_rating INT,
    p_new_difficulty REAL,
    p_new_stability REAL,
    p_new_due TIMESTAMPTZ,
    p_new_reps INT,
    p_new_lapses INT,
    p_new_state TEXT,
    p_interval_days REAL,
    p_old_difficulty REAL,
    p_old_stability REAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Validate rating
    IF p_rating NOT IN (1, 2, 3, 4) THEN
        RAISE EXCEPTION 'Invalid rating: %. Must be 1, 2, 3, or 4', p_rating;
    END IF;

    -- Validate state
    IF p_new_state NOT IN ('new', 'learning', 'review', 'relearning') THEN
        RAISE EXCEPTION 'Invalid state: %. Must be new, learning, review, or relearning', p_new_state;
    END IF;

    -- Update learning_items
    UPDATE public.learning_items
    SET
        fsrs_difficulty = p_new_difficulty,
        fsrs_stability = p_new_stability,
        fsrs_due = p_new_due,
        fsrs_reps = p_new_reps,
        fsrs_lapses = p_new_lapses,
        fsrs_state = p_new_state,
        fsrs_last_review = NOW(),
        updated_at = NOW()
    WHERE id = p_card_id;

    -- Check if update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found: %', p_card_id;
    END IF;

    -- Insert review log
    INSERT INTO public.fsrs_review_logs (
        user_id,
        card_id,
        rating,
        review_time,
        interval_days,
        old_difficulty,
        old_stability,
        new_difficulty,
        new_stability
    ) VALUES (
        p_user_id,
        p_card_id,
        p_rating,
        NOW(),
        p_interval_days,
        p_old_difficulty,
        p_old_stability,
        p_new_difficulty,
        p_new_stability
    );

    -- Return success response
    v_result := json_build_object(
        'success', true,
        'card_id', p_card_id,
        'new_due', p_new_due,
        'interval_days', p_interval_days,
        'message', 'Card updated successfully'
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        v_result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to update card'
        );
        RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_card_fsrs TO anon;
GRANT EXECUTE ON FUNCTION update_card_fsrs TO authenticated;

COMMENT ON FUNCTION update_card_fsrs IS 'Updates card FSRS parameters after review and logs the review';

-- ============================================================================
-- Function 3: Get Review Statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_fsrs_stats(
    p_user_id UUID,
    p_days INT DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_reviews INT;
    v_correct_reviews INT;
    v_retention_rate REAL;
    v_avg_interval REAL;
    v_result JSON;
BEGIN
    -- Count total reviews in period
    SELECT COUNT(*)
    INTO v_total_reviews
    FROM public.fsrs_review_logs
    WHERE user_id = p_user_id
      AND review_time >= NOW() - (p_days || ' days')::INTERVAL;

    -- Count correct reviews (rating >= 3)
    SELECT COUNT(*)
    INTO v_correct_reviews
    FROM public.fsrs_review_logs
    WHERE user_id = p_user_id
      AND review_time >= NOW() - (p_days || ' days')::INTERVAL
      AND rating >= 3;

    -- Calculate retention rate
    IF v_total_reviews > 0 THEN
        v_retention_rate := (v_correct_reviews::REAL / v_total_reviews::REAL) * 100;
    ELSE
        v_retention_rate := 0;
    END IF;

    -- Calculate average interval
    SELECT AVG(interval_days)
    INTO v_avg_interval
    FROM public.fsrs_review_logs
    WHERE user_id = p_user_id
      AND review_time >= NOW() - (p_days || ' days')::INTERVAL;

    -- Build result
    v_result := json_build_object(
        'total_reviews', v_total_reviews,
        'correct_reviews', v_correct_reviews,
        'retention_rate', ROUND(v_retention_rate::NUMERIC, 2),
        'avg_interval_days', ROUND(v_avg_interval::NUMERIC, 2),
        'period_days', p_days
    );

    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_fsrs_stats TO anon;
GRANT EXECUTE ON FUNCTION get_fsrs_stats TO authenticated;

COMMENT ON FUNCTION get_fsrs_stats IS 'Returns FSRS statistics for a user over a specified period';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ FSRS RPC functions created successfully';
    RAISE NOTICE '   - get_due_cards_fsrs: Fetch cards due for review';
    RAISE NOTICE '   - update_card_fsrs: Update card after rating';
    RAISE NOTICE '   - get_fsrs_stats: Get review statistics';
END $$;
