-- Migration 072: Create Vocabulary-specific RPC Functions
-- Date: 2026-02-16
-- Purpose: Database functions for Vocabulary module FSRS scheduling
-- Related: Phase 1 - Vocabulary FSRS Integration

-- ============================================================================
-- Function: Get Due Vocabulary Cards for FSRS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_due_vocabulary_cards(
    p_user_id UUID,
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
        li.id,
        li.type,
        li.english,
        li.russian,
        li.greek,
        li.greek AS greek_word,  -- Alias for compatibility
        li.phonetic,
        li.example_en,
        li.example_gr,
        li.audio_url,
        li.level,
        li.difficulty,
        COALESCE(sp.fsrs_difficulty, 6.4133) AS fsrs_difficulty,  -- Default FSRS initial difficulty
        COALESCE(sp.fsrs_stability, 0.212) AS fsrs_stability,      -- Default FSRS initial stability
        sp.fsrs_last_review,
        COALESCE(sp.fsrs_due, NOW()) AS fsrs_due,                  -- New cards due immediately
        COALESCE(sp.fsrs_reps, 0) AS fsrs_reps,
        COALESCE(sp.fsrs_lapses, 0) AS fsrs_lapses,
        COALESCE(sp.fsrs_state, 'new') AS fsrs_state,              -- Default state: new
        li.created_at
    FROM public.learning_items li
    LEFT JOIN public.student_progress sp
        ON sp.item_id = li.id
        AND sp.student_id = p_user_id
    WHERE
        -- Filter by type (vocabulary only)
        li.type = 'vocabulary'
        -- Only cards that are due (or never reviewed)
        AND (sp.fsrs_due IS NULL OR sp.fsrs_due <= NOW())
        -- Filter by user level if level is set on item
        AND (li.level IS NULL OR li.level = (
            SELECT level FROM public.users WHERE id = p_user_id
        ))
    ORDER BY
        -- Prioritize: never reviewed → oldest due → hardest → newest created
        sp.fsrs_due ASC NULLS FIRST,
        sp.fsrs_difficulty DESC,  -- Harder cards first
        li.created_at ASC         -- Older cards first
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_due_vocabulary_cards TO anon;
GRANT EXECUTE ON FUNCTION get_due_vocabulary_cards TO authenticated;

COMMENT ON FUNCTION get_due_vocabulary_cards IS 'Returns vocabulary cards that are due for review using FSRS-6 scheduling';

-- ============================================================================
-- Function: Update Vocabulary Card Progress (student_progress based)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_vocabulary_progress(
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
    v_progress_id INT;
BEGIN
    -- Validate rating
    IF p_rating NOT IN (1, 2, 3, 4) THEN
        RAISE EXCEPTION 'Invalid rating: %. Must be 1, 2, 3, or 4', p_rating;
    END IF;

    -- Validate state
    IF p_new_state NOT IN ('new', 'learning', 'review', 'relearning') THEN
        RAISE EXCEPTION 'Invalid state: %. Must be new, learning, review, or relearning', p_new_state;
    END IF;

    -- UPSERT student_progress (correct approach: per-user data)
    INSERT INTO public.student_progress (
        student_id,
        item_id,
        fsrs_difficulty,
        fsrs_stability,
        fsrs_due,
        fsrs_reps,
        fsrs_lapses,
        fsrs_state,
        fsrs_last_review,
        updated_at
    ) VALUES (
        p_user_id,
        p_card_id,
        p_new_difficulty,
        p_new_stability,
        p_new_due,
        p_new_reps,
        p_new_lapses,
        p_new_state,
        NOW(),
        NOW()
    )
    ON CONFLICT (student_id, item_id)
    DO UPDATE SET
        fsrs_difficulty = EXCLUDED.fsrs_difficulty,
        fsrs_stability = EXCLUDED.fsrs_stability,
        fsrs_due = EXCLUDED.fsrs_due,
        fsrs_reps = EXCLUDED.fsrs_reps,
        fsrs_lapses = EXCLUDED.fsrs_lapses,
        fsrs_state = EXCLUDED.fsrs_state,
        fsrs_last_review = EXCLUDED.fsrs_last_review,
        updated_at = NOW()
    RETURNING id INTO v_progress_id;

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
        'progress_id', v_progress_id,
        'new_due', p_new_due,
        'interval_days', p_interval_days,
        'message', 'Vocabulary card updated successfully'
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        v_result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to update vocabulary card'
        );
        RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_vocabulary_progress TO anon;
GRANT EXECUTE ON FUNCTION update_vocabulary_progress TO authenticated;

COMMENT ON FUNCTION update_vocabulary_progress IS 'Updates vocabulary card FSRS parameters in student_progress and logs the review';

-- ============================================================================
-- Verification Query (Run in Supabase SQL Editor to test)
-- ============================================================================
-- Test get_due_vocabulary_cards:
-- SELECT * FROM get_due_vocabulary_cards('YOUR-USER-ID-HERE'::UUID, 10);

-- Test update_vocabulary_progress (after a review):
-- SELECT update_vocabulary_progress(
--     'CARD-ID'::UUID,
--     'USER-ID'::UUID,
--     3,              -- rating (Good)
--     7.2,            -- new_difficulty
--     5.5,            -- new_stability
--     NOW() + INTERVAL '5 days',  -- new_due
--     1,              -- new_reps
--     0,              -- new_lapses
--     'learning',     -- new_state
--     5.0,            -- interval_days
--     6.4133,         -- old_difficulty
--     0.212           -- old_stability
-- );

-- ============================================================================
-- End of Migration 072
-- ============================================================================
