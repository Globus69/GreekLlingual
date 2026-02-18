-- ============================================================================
-- Migration 087: Create cloze_texts table
-- ============================================================================
-- Purpose: Create dedicated table for cloze text exercises
--          (fill-in-the-blank exercises for language learning)
--
-- Author: Claude Sonnet 4.5
-- Date: 2026-02-18
-- ============================================================================

-- ============================================================================
-- STEP 1: Create cloze_texts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cloze_texts (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Optional number for sorting
    nr INTEGER,

    -- ========================================================================
    -- GREEK FIELDS (Core)
    -- ========================================================================
    greek_transcription TEXT NOT NULL,      -- Greek text with blanks (e.g., "Το ___ είναι ωραίο")
    greek_phonetic TEXT,                    -- Phonetic transcription

    -- ========================================================================
    -- CLOZE-SPECIFIC FIELDS
    -- ========================================================================
    cloze_answer TEXT NOT NULL,             -- Correct answer(s) for the blank(s)
    cloze_hints TEXT,                       -- Optional hints for learners

    -- ========================================================================
    -- ENGLISH FIELDS
    -- ========================================================================
    en_translation TEXT,                    -- Full English translation
    en_importance_reason TEXT,              -- Why this cloze is important (EN)
    en_audio_url VARCHAR(500),              -- Audio URL for English

    -- ========================================================================
    -- GERMAN FIELDS
    -- ========================================================================
    de_translation TEXT,                    -- Full German translation
    de_importance_reason TEXT,              -- Why this cloze is important (DE)
    de_audio_url VARCHAR(500),              -- Audio URL for German

    -- ========================================================================
    -- SPANISH FIELDS
    -- ========================================================================
    es_translation TEXT,                    -- Full Spanish translation
    es_importance_reason TEXT,              -- Why this cloze is important (ES)
    es_audio_url VARCHAR(500),              -- Audio URL for Spanish

    -- ========================================================================
    -- RUSSIAN FIELDS
    -- ========================================================================
    ru_translation TEXT,                    -- Full Russian translation
    ru_importance_reason TEXT,              -- Why this cloze is important (RU)
    ru_audio_url VARCHAR(500),              -- Audio URL for Russian

    -- ========================================================================
    -- METADATA FIELDS
    -- ========================================================================
    level VARCHAR(2) NOT NULL
        CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),

    difficulty VARCHAR(20) NOT NULL
        CHECK (difficulty IN ('easy', 'medium', 'hard')),

    frequency INTEGER NOT NULL
        CHECK (frequency BETWEEN 1 AND 5),

    category VARCHAR(100),                  -- Optional category (grammar, vocabulary, etc.)

    -- ========================================================================
    -- TIMESTAMPS
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cloze_texts_level ON cloze_texts(level);
CREATE INDEX IF NOT EXISTS idx_cloze_texts_difficulty ON cloze_texts(difficulty);
CREATE INDEX IF NOT EXISTS idx_cloze_texts_frequency ON cloze_texts(frequency);
CREATE INDEX IF NOT EXISTS idx_cloze_texts_category ON cloze_texts(category);
CREATE INDEX IF NOT EXISTS idx_cloze_texts_created_at ON cloze_texts(created_at DESC);

-- Full-text search index for Greek transcription
CREATE INDEX IF NOT EXISTS idx_cloze_texts_greek_search
    ON cloze_texts USING gin(to_tsvector('simple', greek_transcription));

-- ============================================================================
-- STEP 3: Create RPC function for statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cloze_texts_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'by_level', (
            SELECT json_object_agg(level, count)
            FROM (
                SELECT level, COUNT(*) as count
                FROM cloze_texts
                GROUP BY level
                ORDER BY level
            ) level_counts
        ),
        'by_difficulty', (
            SELECT json_object_agg(difficulty, count)
            FROM (
                SELECT difficulty, COUNT(*) as count
                FROM cloze_texts
                GROUP BY difficulty
                ORDER BY difficulty
            ) diff_counts
        ),
        'by_category', (
            SELECT json_object_agg(category, count)
            FROM (
                SELECT COALESCE(category, 'uncategorized') as category, COUNT(*) as count
                FROM cloze_texts
                GROUP BY category
                ORDER BY count DESC
                LIMIT 10
            ) cat_counts
        )
    ) INTO result
    FROM cloze_texts;

    RETURN result;
END;
$$;

-- ============================================================================
-- STEP 4: Create RPC function for bulk update
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_update_cloze_texts(
    p_ids UUID[],
    p_level VARCHAR(2) DEFAULT NULL,
    p_difficulty VARCHAR(20) DEFAULT NULL,
    p_frequency INTEGER DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE cloze_texts
    SET
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        frequency = COALESCE(p_frequency, frequency),
        category = COALESCE(p_category, category),
        updated_at = NOW()
    WHERE id = ANY(p_ids);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- ============================================================================
-- STEP 5: Create RPC function for bulk delete
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_delete_cloze_texts(
    p_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cloze_texts
    WHERE id = ANY(p_ids);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- STEP 6: Create RPC function for duplicate check
-- ============================================================================

CREATE OR REPLACE FUNCTION check_cloze_texts_duplicate(
    p_greek_transcription TEXT,
    p_level VARCHAR(2),
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    duplicate_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM cloze_texts
        WHERE greek_transcription = p_greek_transcription
        AND level = p_level
        AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) INTO duplicate_exists;

    RETURN duplicate_exists;
END;
$$;

-- ============================================================================
-- STEP 7: Create trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_cloze_texts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cloze_texts_updated_at ON cloze_texts;
CREATE TRIGGER trigger_cloze_texts_updated_at
    BEFORE UPDATE ON cloze_texts
    FOR EACH ROW
    EXECUTE FUNCTION update_cloze_texts_updated_at();

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON cloze_texts TO authenticated;

-- ============================================================================
-- STEP 9: Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE cloze_texts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all cloze texts
CREATE POLICY "Authenticated users can read cloze_texts"
    ON cloze_texts
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert cloze texts
CREATE POLICY "Authenticated users can insert cloze_texts"
    ON cloze_texts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update cloze texts
CREATE POLICY "Authenticated users can update cloze_texts"
    ON cloze_texts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete cloze texts
CREATE POLICY "Authenticated users can delete cloze_texts"
    ON cloze_texts
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================================
-- STEP 10: Insert sample data (optional)
-- ============================================================================

INSERT INTO cloze_texts (
    nr,
    greek_transcription,
    greek_phonetic,
    cloze_answer,
    cloze_hints,
    en_translation,
    de_translation,
    es_translation,
    ru_translation,
    level,
    difficulty,
    frequency,
    category
) VALUES (
    1,
    'Καλημέρα, το όνομά μου ___ Γιάννης',
    'kalimera, to onoma mu ___ Yiannis',
    'είναι',
    'verb "to be" in 3rd person singular',
    'Good morning, my name ___ John',
    'Guten Morgen, mein Name ___ John',
    'Buenos días, mi nombre ___ John',
    'Доброе утро, меня зовут ___ Джон',
    'A1',
    'easy',
    5,
    'grammar'
);

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 087 completed successfully';
    RAISE NOTICE '📊 Total cloze texts: %', (SELECT COUNT(*) FROM cloze_texts);
END $$;
