-- ============================================================================
-- Migration 082 ROLLBACK: Restore original content table
-- ============================================================================
-- Purpose: Undo multilingual migration and restore original bilingual content
--
-- ⚠️ WARNING: This will delete the multilingual_content table!
-- ⚠️ Use this only if migration failed or needs to be reverted
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '⚠️ ============================================================';
    RAISE NOTICE '⚠️ STARTING ROLLBACK OF MIGRATION 082';
    RAISE NOTICE '⚠️ ============================================================';
END $$;

-- ============================================================================
-- STEP 1: Drop new table
-- ============================================================================

DROP TABLE IF EXISTS multilingual_content CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ Dropped table: multilingual_content';
END $$;

-- ============================================================================
-- STEP 2: Drop functions
-- ============================================================================

DROP FUNCTION IF EXISTS check_multilingual_content_duplicate(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS get_multilingual_content_stats();

DO $$
BEGIN
    RAISE NOTICE '✅ Dropped functions';
END $$;

-- ============================================================================
-- STEP 3: Restore original table from backup
-- ============================================================================

DO $$
BEGIN
    -- Check if renamed table exists
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'content_old_deprecated_20260218'
    ) THEN
        -- Restore from renamed backup
        ALTER TABLE content_old_deprecated_20260218 RENAME TO content;
        RAISE NOTICE '✅ Restored table from: content_old_deprecated_20260218';

    ELSIF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'content_backup_20260218'
    ) THEN
        -- Restore from backup copy
        CREATE TABLE content AS SELECT * FROM content_backup_20260218;
        RAISE NOTICE '✅ Restored table from: content_backup_20260218';

    ELSE
        RAISE EXCEPTION '❌ ERROR: No backup found! Cannot rollback.';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Restore original permissions
-- ============================================================================

GRANT SELECT ON content TO authenticated;
GRANT ALL ON content TO service_role;

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE '✅ Restored permissions';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM content;

    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ ROLLBACK COMPLETE';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ Table "content" restored with % rows', v_count;
    RAISE NOTICE '✅ Table "multilingual_content" removed';
    RAISE NOTICE '✅ Original state restored';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '';
END $$;
