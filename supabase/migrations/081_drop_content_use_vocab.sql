-- ═══════════════════════════════════════════════════════════════
-- DROP CONTENT TABLE - USE MULTILINGUAL_VOCABULARY INSTEAD
-- ═══════════════════════════════════════════════════════════════
-- The 'content' table has an incompatible schema (single language, wrong columns).
-- Instead of migrating, we:
-- 1. Backup existing data (if any)
-- 2. Drop the content table
-- 3. Use multilingual_vocabulary directly for vocabulary content
-- 4. Create optional views for backward compatibility (READ-ONLY)
--
-- ⚠️ IMPORTANT: Views are READ-ONLY. Update /admin/content API to use
--               multilingual_vocabulary directly for write operations.
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
        RAISE NOTICE 'Content table backed up to _content_backup_*';
    ELSE
        RAISE NOTICE 'Content table does not exist - skipping backup';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Drop content table (incompatible schema)
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS content CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Create views for backward compatibility (READ-ONLY)
-- ═══════════════════════════════════════════════════════════════
-- These views allow existing READ operations to continue working
-- while we migrate to use multilingual_vocabulary directly.
--
-- ⚠️ WRITE operations (INSERT/UPDATE/DELETE) will NOT work on views!
--    Update API routes to use multilingual_vocabulary table directly.
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
-- STEP 4: Grant permissions to views AND underlying table
-- ═══════════════════════════════════════════════════════════════
-- FIXED: Users need permission on BOTH the view and the base table

-- Grant on views (read-only)
GRANT SELECT ON content TO authenticated, anon;
GRANT SELECT ON learning_items TO authenticated, anon;

-- Grant on underlying table (required for views to work!)
GRANT SELECT ON multilingual_vocabulary TO authenticated, anon;

-- Note: Write operations must be done directly on multilingual_vocabulary
-- API routes should use the table, not the view

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS (for documentation)
-- ═══════════════════════════════════════════════════════════════

COMMENT ON VIEW content IS 'DEPRECATED: Backward compatibility READ-ONLY view mapping multilingual_vocabulary to old content structure. For write operations, use multilingual_vocabulary directly.';
COMMENT ON VIEW learning_items IS 'Alias for multilingual_vocabulary. Provides full multilingual support. Use this directly for all operations.';

-- Migration 081 Complete
-- Action: Dropped incompatible content table
-- Backup: Created in _content_backup_* table (if existed)
-- Views: Created for READ-ONLY backward compatibility
-- Permissions: Granted on views AND underlying multilingual_vocabulary table
--
-- IMPORTANT:
-- - Views are READ-ONLY (no INSERT/UPDATE/DELETE support)
-- - Use multilingual_vocabulary table directly for write operations
-- - learning_items view = full multilingual support
-- - content view = DEPRECATED (EN only, legacy compatibility)
--
-- NEXT STEPS FOR /admin/content:
-- 1. Update API routes to use multilingual_vocabulary table
-- 2. Update TypeScript types to match vocab structure
-- 3. Use shared vocab components (reuse from /admin/vocab)
-- 4. Remove old content-specific code
-- 5. Test CRUD operations with new schema
--
-- TIP: /admin/content can share ALL logic with /admin/vocab
--      since both now use the same multilingual_vocabulary table!
