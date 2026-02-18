-- ============================================================================
-- Migration 088: Create user_vocabulary_progress Table & Fix FSRS RPC
-- ============================================================================
-- Purpose: Create proper user-specific vocabulary progress tracking with FSRS
-- Date: 2026-02-18
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 088: Creating user_vocabulary_progress & fixing FSRS RPC';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. Create user_vocabulary_progress table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES multilingual_vocabulary(id) ON DELETE CASCADE,

    -- FSRS-6 scheduling parameters
    fsrs_difficulty REAL NOT NULL DEFAULT 0.3,
    fsrs_stability REAL NOT NULL DEFAULT 0.0,
    fsrs_due TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fsrs_reps INT NOT NULL DEFAULT 0,
    fsrs_lapses INT NOT NULL DEFAULT 0,
    fsrs_state TEXT NOT NULL DEFAULT 'new' CHECK (fsrs_state IN ('new', 'learning', 'review', 'relearning')),
    fsrs_last_review TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one progress record per user per vocabulary item
    UNIQUE(user_id, vocabulary_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_user_id ON user_vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_vocabulary_id ON user_vocabulary_progress(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_due ON user_vocabulary_progress(fsrs_due);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_state ON user_vocabulary_progress(fsrs_state);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_user_due ON user_vocabulary_progress(user_id, fsrs_due);

-- Enable RLS
ALTER TABLE user_vocabulary_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own progress
CREATE POLICY "Users can view own vocabulary progress"
    ON user_vocabulary_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary progress"
    ON user_vocabulary_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary progress"
    ON user_vocabulary_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_vocab_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_vocab_progress_timestamp
    BEFORE UPDATE ON user_vocabulary_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_vocab_progress_updated_at();

DO $$
BEGIN
    RAISE NOTICE '✅ Created user_vocabulary_progress table with indexes and RLS';
END $$;

-- ============================================================================
-- 2. Fix get_due_cards_fsrs to use user_vocabulary_progress
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
        COALESCE(v.audio_url, v.en_audio_url) AS audio_url,
        v.level,
        v.difficulty,
        COALESCE(uvp.fsrs_difficulty, 0.3)::DOUBLE PRECISION AS fsrs_difficulty,
        COALESCE(uvp.fsrs_stability, 0.0)::DOUBLE PRECISION AS fsrs_stability,
        COALESCE(uvp.fsrs_due, NOW()) AS fsrs_due,
        COALESCE(uvp.fsrs_reps, 0) AS fsrs_reps,
        COALESCE(uvp.fsrs_lapses, 0) AS fsrs_lapses,
        COALESCE(uvp.fsrs_state, 'new') AS fsrs_state,
        uvp.fsrs_last_review,
        v.created_at
    FROM multilingual_vocabulary v
    LEFT JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    WHERE
        (p_level IS NULL OR v.level = p_level)
        AND (uvp.fsrs_due IS NULL OR uvp.fsrs_due <= NOW())
    ORDER BY
        uvp.fsrs_due ASC NULLS FIRST,
        v.created_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_due_cards_fsrs TO anon, authenticated;

COMMENT ON FUNCTION get_due_cards_fsrs IS 'Returns vocabulary cards due for review using FSRS-6 scheduling with user-specific progress';

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed get_due_cards_fsrs to use user_vocabulary_progress table';
END $$;

-- ============================================================================
-- 3. Create function to initialize user vocabulary progress
-- ============================================================================

CREATE OR REPLACE FUNCTION init_user_vocabulary_progress(
    p_user_id UUID,
    p_level TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inserted_count INT;
BEGIN
    -- Insert progress records for vocabulary items that don't have progress yet
    INSERT INTO user_vocabulary_progress (user_id, vocabulary_id, fsrs_due)
    SELECT
        p_user_id,
        v.id,
        NOW() -- Make cards immediately available
    FROM multilingual_vocabulary v
    LEFT JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    WHERE uvp.id IS NULL
        AND (p_level IS NULL OR v.level = p_level);

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    RETURN v_inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION init_user_vocabulary_progress TO anon, authenticated;

COMMENT ON FUNCTION init_user_vocabulary_progress IS 'Initialize vocabulary progress for a user (creates progress records for new vocabulary items)';

DO $$
BEGIN
    RAISE NOTICE '✅ Created init_user_vocabulary_progress function';
END $$;

-- ============================================================================
-- 4. Create update_card_fsrs function (drop existing first)
-- ============================================================================

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
    -- Insert or update progress record
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

    -- Return success status
    v_result := jsonb_build_object(
        'success', true,
        'card_id', p_card_id,
        'user_id', p_user_id,
        'rating', p_rating,
        'new_state', p_new_state,
        'next_due', p_new_due
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION update_card_fsrs TO anon, authenticated;

COMMENT ON FUNCTION update_card_fsrs IS 'Update FSRS parameters for a vocabulary card after review';

DO $$
BEGIN
    RAISE NOTICE '✅ Created update_card_fsrs function';
END $$;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 088 COMPLETED';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ Created user_vocabulary_progress table';
    RAISE NOTICE '✅ Fixed get_due_cards_fsrs to use JOIN with progress table';
    RAISE NOTICE '✅ Created init_user_vocabulary_progress function';
    RAISE NOTICE '✅ Created update_card_fsrs function';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Next steps:';
    RAISE NOTICE '   1. Call init_user_vocabulary_progress for existing users';
    RAISE NOTICE '   2. Test due cards functionality in mobile app';
    RAISE NOTICE '';
END $$;
