-- ============================================================================
-- Migration 098: Fix update_card_fsrs to include logging in fsrs_review_logs
-- ============================================================================
-- Purpose: Restore review logging that was lost in Migration 088
-- Date: 2026-02-23
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 098: Restoring review logging to update_card_fsrs';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- Drop function with all possible overloads to avoid conflicts
DROP FUNCTION IF EXISTS update_card_fsrs(UUID, UUID, INT, REAL, REAL, TIMESTAMPTZ, INT, INT, TEXT, REAL, REAL, REAL);
DROP FUNCTION IF EXISTS update_card_fsrs(UUID, UUID, INT, REAL, REAL, TIMESTAMPTZ, INT, INT, TEXT, REAL);

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
    -- 1. Insert or update progress record in user_vocabulary_progress
    INSERT INTO user_vocabulary_progress (
        user_id,
        vocabulary_id,
        fsrs_difficulty,
        fsrs_stability,
        fsrs_due,
        fsrs_reps,
        fsrs_lapses,
        fsrs_state,
        fsrs_last_review
    )
    VALUES (
        p_user_id,
        p_card_id,
        p_new_difficulty,
        p_new_stability,
        p_new_due,
        p_new_reps,
        p_new_lapses,
        p_new_state,
        NOW()
    )
    ON CONFLICT (user_id, vocabulary_id)
    DO UPDATE SET
        fsrs_difficulty = p_new_difficulty,
        fsrs_stability = p_new_stability,
        fsrs_due = p_new_due,
        fsrs_reps = p_new_reps,
        fsrs_lapses = p_new_lapses,
        fsrs_state = p_new_state,
        fsrs_last_review = NOW(),
        updated_at = NOW();

    -- 2. Insert review log into fsrs_review_logs
    -- This is critical for statistics calculation in get_progress_overview
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
        COALESCE(p_old_difficulty, 0.3), -- Use default if null
        COALESCE(p_old_stability, 0.0),   -- Use default if null
        p_new_difficulty,
        p_new_stability
    );

    -- 3. Return success status
    v_result := jsonb_build_object(
        'success', true,
        'card_id', p_card_id,
        'user_id', p_user_id,
        'rating', p_rating,
        'new_state', p_new_state,
        'next_due', p_new_due,
        'message', 'FSRS progress updated and review logged'
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION update_card_fsrs TO anon, authenticated;

COMMENT ON FUNCTION update_card_fsrs IS 'Update FSRS parameters for a vocabulary card AND log the review for statistics';

DO $$
BEGIN
    RAISE NOTICE '✅ Restored logging to update_card_fsrs';
    RAISE NOTICE '✅ MIGRATION 098 COMPLETE';
END $$;
