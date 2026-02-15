-- Migration 065: Fix Grammar RPC Function - Handle Missing Russian Column
-- Date: 2026-02-15
-- Purpose: Make get_due_grammar_cards resilient to missing russian column
-- Related: Migration 016 (adds russian column), Migration 064 (original RPC)
-- Issue: Error "column li.russian does not exist" (code 42703)

-- ============================================================================
-- Fix: Recreate get_due_grammar_cards with dynamic column checking
-- ============================================================================

CREATE OR REPLACE FUNCTION get_due_grammar_cards(
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
DECLARE
    v_has_russian_column BOOLEAN;
BEGIN
    -- Check if russian column exists in learning_items table
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'learning_items'
        AND column_name = 'russian'
    ) INTO v_has_russian_column;

    -- Return query with russian column if it exists, NULL otherwise
    IF v_has_russian_column THEN
        RETURN QUERY
        SELECT
            li.id,
            li.type,
            li.english,
            li.russian,  -- Column exists, select it
            li.greek,
            li.greek AS greek_word,
            li.phonetic,
            li.example_en,
            li.example_gr,
            li.audio_url,
            li.level,
            li.difficulty,
            COALESCE(sp.fsrs_difficulty, 6.4133) AS fsrs_difficulty,
            COALESCE(sp.fsrs_stability, 0.212) AS fsrs_stability,
            sp.fsrs_last_review,
            COALESCE(sp.fsrs_due, NOW()) AS fsrs_due,
            COALESCE(sp.fsrs_reps, 0) AS fsrs_reps,
            COALESCE(sp.fsrs_lapses, 0) AS fsrs_lapses,
            COALESCE(sp.fsrs_state, 'new') AS fsrs_state,
            li.created_at
        FROM public.learning_items li
        LEFT JOIN public.student_progress sp
            ON sp.item_id = li.id
            AND sp.student_id = p_user_id
        WHERE
            li.type = 'grammar'
            AND (sp.fsrs_due IS NULL OR sp.fsrs_due <= NOW())
            AND (li.level IS NULL OR li.level = (
                SELECT level FROM public.users WHERE id = p_user_id
            ))
        ORDER BY
            sp.fsrs_due ASC NULLS FIRST,
            sp.fsrs_difficulty DESC,
            li.created_at ASC
        LIMIT p_limit;
    ELSE
        -- Column doesn't exist, return NULL for russian
        RETURN QUERY
        SELECT
            li.id,
            li.type,
            li.english,
            NULL::TEXT AS russian,  -- Return NULL instead
            li.greek,
            li.greek AS greek_word,
            li.phonetic,
            li.example_en,
            li.example_gr,
            li.audio_url,
            li.level,
            li.difficulty,
            COALESCE(sp.fsrs_difficulty, 6.4133) AS fsrs_difficulty,
            COALESCE(sp.fsrs_stability, 0.212) AS fsrs_stability,
            sp.fsrs_last_review,
            COALESCE(sp.fsrs_due, NOW()) AS fsrs_due,
            COALESCE(sp.fsrs_reps, 0) AS fsrs_reps,
            COALESCE(sp.fsrs_lapses, 0) AS fsrs_lapses,
            COALESCE(sp.fsrs_state, 'new') AS fsrs_state,
            li.created_at
        FROM public.learning_items li
        LEFT JOIN public.student_progress sp
            ON sp.item_id = li.id
            AND sp.student_id = p_user_id
        WHERE
            li.type = 'grammar'
            AND (sp.fsrs_due IS NULL OR sp.fsrs_due <= NOW())
            AND (li.level IS NULL OR li.level = (
                SELECT level FROM public.users WHERE id = p_user_id
            ))
        ORDER BY
            sp.fsrs_due ASC NULLS FIRST,
            sp.fsrs_difficulty DESC,
            li.created_at ASC
        LIMIT p_limit;
    END IF;
END;
$$;

-- Grant permissions (same as before)
GRANT EXECUTE ON FUNCTION get_due_grammar_cards TO anon;
GRANT EXECUTE ON FUNCTION get_due_grammar_cards TO authenticated;

COMMENT ON FUNCTION get_due_grammar_cards IS 'Returns grammar cards due for review (handles missing russian column gracefully)';

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Grammar RPC function fixed successfully';
    RAISE NOTICE '   - get_due_grammar_cards now handles missing russian column';
    RAISE NOTICE '   - Returns NULL for russian if column does not exist';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Note: Run migration 016 to add the russian column:';
    RAISE NOTICE '   ALTER TABLE learning_items ADD COLUMN IF NOT EXISTS russian TEXT;';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 This migration makes the RPC function resilient to schema changes';
END $$;
