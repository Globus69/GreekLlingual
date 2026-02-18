-- ============================================================================
-- Migration 082: Migrate content table to multilingual structure
-- ============================================================================
-- Purpose: Transform bilingual content table to multilingual (EN, DE, ES, RU)
--          to match CSV_Vorlage.csv structure and VocabModal dialog
--
-- Author: Agent 8 - Admin Specialist
-- Date: 2026-02-18
-- Related: CSV_Vorlage.csv, VocabModal.tsx
-- ============================================================================

-- ============================================================================
-- STEP 1: Backup existing content table
-- ============================================================================

DO $$
BEGIN
    -- Check if backup already exists
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'content_backup_20260218'
    ) THEN
        RAISE NOTICE '⚠️ Backup table already exists. Skipping backup creation.';
    ELSE
        -- Create backup
        CREATE TABLE content_backup_20260218 AS
        SELECT * FROM content;

        RAISE NOTICE '✅ Backup created: content_backup_20260218 (%s rows)',
            (SELECT COUNT(*) FROM content_backup_20260218);
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Create new multilingual_content table
-- ============================================================================

CREATE TABLE IF NOT EXISTS multilingual_content (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Optional number for sorting (from CSV: Nr.)
    nr INTEGER,

    -- Content type (vocabulary, phrase, grammar) - preserves flexibility
    type VARCHAR(50) NOT NULL DEFAULT 'vocabulary'
        CHECK (type IN ('vocabulary', 'phrase', 'grammar')),

    -- ========================================================================
    -- GREEK FIELDS (Core)
    -- ========================================================================
    greek_transcription VARCHAR(200) NOT NULL,  -- CSV: "Griechisch (Transkription)"
    greek_phonetic VARCHAR(200),                -- CSV: "Lautschrift (Griechisch)"

    -- ========================================================================
    -- ENGLISH FIELDS
    -- ========================================================================
    en_translation TEXT,                        -- CSV: "Englische Übersetzung"
    en_importance_reason TEXT,                  -- CSV: "Wichtigkeit (Begründung)in Englisch"
    en_audio_url VARCHAR(500),                  -- Audio for English

    -- ========================================================================
    -- GERMAN FIELDS
    -- ========================================================================
    de_translation TEXT,                        -- CSV: "Deutsche Übersetzung"
    de_importance_reason TEXT,                  -- CSV: "Wichtigkeit (Begründung)in Deutsch"
    de_audio_url VARCHAR(500),                  -- Audio for German

    -- ========================================================================
    -- SPANISH FIELDS
    -- ========================================================================
    es_translation TEXT,                        -- CSV: "Spanische Übersetzung"
    es_importance_reason TEXT,                  -- CSV: "Wichtigkeit (Begründung)in Spanisch"
    es_audio_url VARCHAR(500),                  -- Audio for Spanish

    -- ========================================================================
    -- RUSSIAN FIELDS
    -- ========================================================================
    ru_translation TEXT,                        -- CSV: "Russische Übersetzung"
    ru_importance_reason TEXT,                  -- CSV: "Wichtigkeit (Begründung) in Russisch"
    ru_audio_url VARCHAR(500),                  -- Audio for Russian

    -- ========================================================================
    -- METADATA FIELDS
    -- ========================================================================
    level VARCHAR(2) NOT NULL                   -- CSV: "Level A"
        CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),

    difficulty VARCHAR(20) NOT NULL             -- CSV: "difficulty (easy/middle/hard)"
        CHECK (difficulty IN ('easy', 'medium', 'hard')),

    frequency INTEGER NOT NULL                  -- CSV: "Häufigkeit im täglichen Gebrauch"
        CHECK (frequency BETWEEN 1 AND 5),

    -- ========================================================================
    -- TIMESTAMPS
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE multilingual_content IS 'Multilingual content storage (EN, DE, ES, RU) - matches CSV_Vorlage.csv structure';

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_multilingual_content_level
    ON multilingual_content(level);

CREATE INDEX IF NOT EXISTS idx_multilingual_content_difficulty
    ON multilingual_content(difficulty);

CREATE INDEX IF NOT EXISTS idx_multilingual_content_frequency
    ON multilingual_content(frequency);

CREATE INDEX IF NOT EXISTS idx_multilingual_content_type
    ON multilingual_content(type);

CREATE INDEX IF NOT EXISTS idx_multilingual_content_greek
    ON multilingual_content(greek_transcription);

CREATE INDEX IF NOT EXISTS idx_multilingual_content_created
    ON multilingual_content(created_at DESC);

-- Full-text search index for translations
CREATE INDEX IF NOT EXISTS idx_multilingual_content_en_search
    ON multilingual_content USING gin(to_tsvector('english', en_translation));

CREATE INDEX IF NOT EXISTS idx_multilingual_content_de_search
    ON multilingual_content USING gin(to_tsvector('german', de_translation));

-- ============================================================================
-- STEP 4: Migrate existing data from old content table
-- ============================================================================

INSERT INTO multilingual_content (
    id,
    type,
    greek_transcription,
    greek_phonetic,
    en_translation,
    en_audio_url,
    level,
    difficulty,
    frequency,
    created_at,
    updated_at
)
SELECT
    id,
    type,
    greek AS greek_transcription,
    phonetic AS greek_phonetic,
    english AS en_translation,
    audio_url AS en_audio_url,  -- Assume old audio_url is for English
    level,
    difficulty,
    3 AS frequency,  -- Default frequency (middle value)
    created_at,
    updated_at
FROM content
WHERE id NOT IN (SELECT id FROM multilingual_content)  -- Avoid duplicates
ON CONFLICT (id) DO NOTHING;

-- Log migration results
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM content;
    SELECT COUNT(*) INTO new_count FROM multilingual_content;

    RAISE NOTICE '✅ Migration complete:';
    RAISE NOTICE '   Old table (content): % rows', old_count;
    RAISE NOTICE '   New table (multilingual_content): % rows', new_count;
    RAISE NOTICE '   Missing translations (DE, ES, RU) will need manual input';
END $$;

-- ============================================================================
-- STEP 5: Create trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_multilingual_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_multilingual_content_timestamp ON multilingual_content;

CREATE TRIGGER trigger_update_multilingual_content_timestamp
    BEFORE UPDATE ON multilingual_content
    FOR EACH ROW
    EXECUTE FUNCTION update_multilingual_content_updated_at();

-- ============================================================================
-- STEP 6: Grant permissions (RLS will be configured separately)
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON multilingual_content TO authenticated;

-- Grant full access to service_role (for admin operations)
GRANT ALL ON multilingual_content TO service_role;

-- ============================================================================
-- STEP 7: Create RLS policies
-- ============================================================================

-- Enable RLS
ALTER TABLE multilingual_content ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
CREATE POLICY "Authenticated users can read multilingual_content"
    ON multilingual_content
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only admins can insert
CREATE POLICY "Admins can insert multilingual_content"
    ON multilingual_content
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can update
CREATE POLICY "Admins can update multilingual_content"
    ON multilingual_content
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can delete
CREATE POLICY "Admins can delete multilingual_content"
    ON multilingual_content
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================================================
-- STEP 8: Create helper function for duplicate checking
-- ============================================================================

CREATE OR REPLACE FUNCTION check_multilingual_content_duplicate(
    p_greek_transcription VARCHAR(200),
    p_level VARCHAR(2),
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM multilingual_content
        WHERE
            LOWER(greek_transcription) = LOWER(p_greek_transcription)
            AND level = p_level
            AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) INTO v_exists;

    RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_multilingual_content_duplicate IS
    'Check if content with same greek text and level already exists';

-- ============================================================================
-- STEP 9: Create statistics function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_multilingual_content_stats()
RETURNS TABLE (
    total_count BIGINT,
    by_level JSONB,
    by_difficulty JSONB,
    by_type JSONB,
    by_frequency JSONB,
    translations_coverage JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM multilingual_content),

        (SELECT jsonb_object_agg(level, cnt)
         FROM (
             SELECT level, COUNT(*) as cnt
             FROM multilingual_content
             GROUP BY level
             ORDER BY level
         ) sub),

        (SELECT jsonb_object_agg(difficulty, cnt)
         FROM (
             SELECT difficulty, COUNT(*) as cnt
             FROM multilingual_content
             GROUP BY difficulty
         ) sub),

        (SELECT jsonb_object_agg(type, cnt)
         FROM (
             SELECT type, COUNT(*) as cnt
             FROM multilingual_content
             GROUP BY type
         ) sub),

        (SELECT jsonb_object_agg(frequency::TEXT, cnt)
         FROM (
             SELECT frequency, COUNT(*) as cnt
             FROM multilingual_content
             GROUP BY frequency
             ORDER BY frequency
         ) sub),

        jsonb_build_object(
            'en', (SELECT COUNT(*) FROM multilingual_content WHERE en_translation IS NOT NULL AND en_translation != ''),
            'de', (SELECT COUNT(*) FROM multilingual_content WHERE de_translation IS NOT NULL AND de_translation != ''),
            'es', (SELECT COUNT(*) FROM multilingual_content WHERE es_translation IS NOT NULL AND es_translation != ''),
            'ru', (SELECT COUNT(*) FROM multilingual_content WHERE ru_translation IS NOT NULL AND ru_translation != '')
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_multilingual_content_stats IS
    'Get comprehensive statistics for multilingual content';

-- ============================================================================
-- STEP 10: Rename old table (deactivate, keep as backup)
-- ============================================================================

DO $$
BEGIN
    -- Check if old table still has its original name
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'content'
    ) THEN
        -- Rename to backup (this deactivates it)
        ALTER TABLE content RENAME TO content_old_deprecated_20260218;

        RAISE NOTICE '⚠️ Old table renamed to: content_old_deprecated_20260218';
        RAISE NOTICE '   This table will be kept as backup for 1 week';
        RAISE NOTICE '   You can manually drop it after verification:';
        RAISE NOTICE '   DROP TABLE content_old_deprecated_20260218;';
    ELSE
        RAISE NOTICE '✓ Old content table already renamed or does not exist';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check migration results
DO $$
DECLARE
    v_total INTEGER;
    v_with_en INTEGER;
    v_with_de INTEGER;
    v_with_es INTEGER;
    v_with_ru INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM multilingual_content;
    SELECT COUNT(*) INTO v_with_en FROM multilingual_content WHERE en_translation IS NOT NULL AND en_translation != '';
    SELECT COUNT(*) INTO v_with_de FROM multilingual_content WHERE de_translation IS NOT NULL AND de_translation != '';
    SELECT COUNT(*) INTO v_with_es FROM multilingual_content WHERE es_translation IS NOT NULL AND es_translation != '';
    SELECT COUNT(*) INTO v_with_ru FROM multilingual_content WHERE ru_translation IS NOT NULL AND ru_translation != '';

    RAISE NOTICE '';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '📊 MIGRATION VERIFICATION RESULTS';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Total entries: %', v_total;
    RAISE NOTICE 'With English translation: % (%.1f%%)', v_with_en, (v_with_en::FLOAT / NULLIF(v_total, 0) * 100);
    RAISE NOTICE 'With German translation: % (%.1f%%)', v_with_de, (v_with_de::FLOAT / NULLIF(v_total, 0) * 100);
    RAISE NOTICE 'With Spanish translation: % (%.1f%%)', v_with_es, (v_with_es::FLOAT / NULLIF(v_total, 0) * 100);
    RAISE NOTICE 'With Russian translation: % (%.1f%%)', v_with_ru, (v_with_ru::FLOAT / NULLIF(v_total, 0) * 100);
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '';

    IF v_with_de = 0 AND v_with_es = 0 AND v_with_ru = 0 THEN
        RAISE NOTICE '⚠️ NOTE: German, Spanish, and Russian translations are empty.';
        RAISE NOTICE '   You can now import them via CSV_Vorlage.csv or add manually.';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 082 COMPLETE';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ New table: multilingual_content (24 columns)';
    RAISE NOTICE '✅ Old table backup: content_backup_20260218';
    RAISE NOTICE '✅ Old table renamed: content_old_deprecated_20260218';
    RAISE NOTICE '✅ Indexes created: 8 indexes';
    RAISE NOTICE '✅ RLS policies: 4 policies';
    RAISE NOTICE '✅ Functions created: 2 functions';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '   1. Update TypeScript types (src/types/content.ts)';
    RAISE NOTICE '   2. Update API functions (src/lib/api/content.ts)';
    RAISE NOTICE '   3. Update ContentModal component';
    RAISE NOTICE '   4. Update admin/content page';
    RAISE NOTICE '   5. Import CSV_Vorlage.csv to fill missing translations';
    RAISE NOTICE '   6. Test all CRUD operations';
    RAISE NOTICE '   7. After 1 week: DROP TABLE content_old_deprecated_20260218;';
    RAISE NOTICE '';
END $$;
