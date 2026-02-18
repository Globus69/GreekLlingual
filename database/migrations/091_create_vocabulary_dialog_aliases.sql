-- ============================================================================
-- Migration 091: Create Alias Functions for vocabulary-dialog.tsx
-- ============================================================================
-- Purpose: Create get_due_vocabulary_cards and update_vocabulary_progress aliases
-- Date: 2026-02-18
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 091: Creating vocabulary-dialog alias functions';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. Create get_due_vocabulary_cards (alias for get_due_cards_fsrs)
-- ============================================================================

DROP FUNCTION IF EXISTS get_due_vocabulary_cards(UUID, INT);

CREATE OR REPLACE FUNCTION get_due_vocabulary_cards(
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
    -- Simply call get_due_cards_fsrs (passing NULL for level = all levels)
    RETURN QUERY
    SELECT * FROM get_due_cards_fsrs(p_user_id, NULL, p_limit);
END;
$$;

GRANT EXECUTE ON FUNCTION get_due_vocabulary_cards TO anon, authenticated;

COMMENT ON FUNCTION get_due_vocabulary_cards IS 'Alias for get_due_cards_fsrs (used by vocabulary-dialog.tsx)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created get_due_vocabulary_cards (alias)';
END $$;

-- ============================================================================
-- 2. Create update_vocabulary_progress (alias for update_card_fsrs)
-- ============================================================================

DROP FUNCTION IF EXISTS update_vocabulary_progress(UUID, UUID, INT, REAL, REAL, TIMESTAMPTZ, INT, INT, TEXT, REAL, REAL, REAL);
DROP FUNCTION IF EXISTS update_vocabulary_progress(UUID, UUID, INT, REAL, REAL, TIMESTAMPTZ, INT, INT, TEXT, REAL);

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
    p_old_difficulty REAL DEFAULT NULL,
    p_old_stability REAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simply call update_card_fsrs
    RETURN update_card_fsrs(
        p_card_id,
        p_user_id,
        p_rating,
        p_new_difficulty,
        p_new_stability,
        p_new_due,
        p_new_reps,
        p_new_lapses,
        p_new_state,
        p_interval_days,
        p_old_difficulty,
        p_old_stability
    );
END;
$$;

GRANT EXECUTE ON FUNCTION update_vocabulary_progress TO anon, authenticated;

COMMENT ON FUNCTION update_vocabulary_progress IS 'Alias for update_card_fsrs (used by vocabulary-dialog.tsx)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created update_vocabulary_progress (alias)';
END $$;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 091 COMPLETED';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ Created get_due_vocabulary_cards (alias for get_due_cards_fsrs)';
    RAISE NOTICE '✅ Created update_vocabulary_progress (alias for update_card_fsrs)';
    RAISE NOTICE '';
    RAISE NOTICE '💡 vocabulary-dialog.tsx should now work correctly';
    RAISE NOTICE '';
END $$;
