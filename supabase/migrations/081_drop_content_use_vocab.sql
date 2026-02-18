-- ═══════════════════════════════════════════════════════════════
-- DROP CONTENT TABLE - USE MULTILINGUAL_VOCABULARY INSTEAD
-- ═══════════════════════════════════════════════════════════════
-- The 'content' table has an incompatible schema (single language, wrong columns).
-- Instead of migrating, we:
-- 1. Backup existing data (if any)
-- 2. Drop the content table
-- 3. Use multilingual_vocabulary directly for vocabulary content
-- 4. Create optional views for backward compatibility
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- STEP 1: Backup existing data (if table exists and has data)
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'content'
    ) THEN
        -- Create backup table with timestamp
        EXECUTE format(
            'CREATE TABLE _content_backup_%s AS SELECT * FROM content',
            to_char(now(), 'YYYYMMDD_HH24MISS')
        );
        RAISE NOTICE '✅ Content table backed up to _content_backup_*';
    ELSE
        RAISE NOTICE 'ℹ️  Content table does not exist - skipping backup';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Drop content table (incompatible schema)
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS content CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Create views for backward compatibility (OPTIONAL)
-- ═══════════════════════════════════════════════════════════════
-- These views allow existing code to continue working while we migrate
-- to use multilingual_vocabulary directly.
-- ═══════════════════════════════════════════════════════════════

-- View: content (backward compatibility for old code)
-- Maps multilingual_vocabulary to old content structure
-- NOTE: This loses multilingual data! Only shows EN translation.
-- Use multilingual_vocabulary directly in new code.
CREATE OR REPLACE VIEW content AS
SELECT
    id,
    'vocabulary'::TEXT as type,
    en_translation as english,
    greek_transcription as greek,
    level,
    difficulty,
    greek_phonetic as phonetic,
    NULL::TEXT as example_en,
    NULL::TEXT as example_gr,
    en_audio_url as audio_url,
    NULL::JSONB as practice_modes_config,
    created_at,
    updated_at
FROM multilingual_vocabulary;

-- View: learning_items (alternative alias)
-- Some code may reference this name instead
CREATE OR REPLACE VIEW learning_items AS
SELECT * FROM multilingual_vocabulary;

-- ═══════════════════════════════════════════════════════════════
-- STEP 4: Grant permissions to views
-- ═══════════════════════════════════════════════════════════════

GRANT SELECT ON content TO authenticated, anon;
GRANT SELECT ON learning_items TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS (for documentation)
-- ═══════════════════════════════════════════════════════════════

COMMENT ON VIEW content IS 'DEPRECATED: Backward compatibility view mapping multilingual_vocabulary to old content structure. Use multilingual_vocabulary directly in new code.';
COMMENT ON VIEW learning_items IS 'Alias for multilingual_vocabulary. Provides full multilingual support.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ CONTENT TABLE CLEANUP COMPLETE            ║';
    RAISE NOTICE '╠════════════════════════════════════════════════╣';
    RAISE NOTICE '║  Action: Dropped incompatible content table    ║';
    RAISE NOTICE '║  Backup: Created in _content_backup_* table    ║';
    RAISE NOTICE '║  Views: Created for backward compatibility     ║';
    RAISE NOTICE '║                                                ║';
    RAISE NOTICE '║  ⚠️  IMPORTANT:                                ║';
    RAISE NOTICE '║  - Use multilingual_vocabulary directly        ║';
    RAISE NOTICE '║  - content view is DEPRECATED (EN only)        ║';
    RAISE NOTICE '║  - learning_items = multilingual_vocabulary    ║';
    RAISE NOTICE '╚════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Update API routes to use multilingual_vocabulary';
    RAISE NOTICE '2. Update TypeScript types to match vocab structure';
    RAISE NOTICE '3. Create CSV templates matching vocab format';
    RAISE NOTICE '4. Test import/export with new schema';
    RAISE NOTICE '';
END $$;
