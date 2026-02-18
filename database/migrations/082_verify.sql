-- ============================================================================
-- Migration 082 VERIFICATION: Check migration results
-- ============================================================================
-- Purpose: Verify that migration completed successfully
-- Usage: Run this after migration to check everything is correct
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ============================================================';
    RAISE NOTICE '🔍 VERIFYING MIGRATION 082';
    RAISE NOTICE '🔍 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CHECK 1: Tables exist
-- ============================================================================

DO $$
DECLARE
    v_new_exists BOOLEAN;
    v_backup_exists BOOLEAN;
    v_old_exists BOOLEAN;
BEGIN
    -- Check new table
    SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'multilingual_content'
    ) INTO v_new_exists;

    -- Check backup
    SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'content_backup_20260218'
    ) INTO v_backup_exists;

    -- Check old renamed table
    SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'content_old_deprecated_20260218'
    ) INTO v_old_exists;

    RAISE NOTICE '📋 TABLE CHECK:';
    RAISE NOTICE '   multilingual_content: %', CASE WHEN v_new_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '   content_backup_20260218: %', CASE WHEN v_backup_exists THEN '✅ EXISTS' ELSE '⚠️ NOT FOUND' END;
    RAISE NOTICE '   content_old_deprecated_20260218: %', CASE WHEN v_old_exists THEN '✅ EXISTS' ELSE '⚠️ NOT FOUND' END;
    RAISE NOTICE '';

    IF NOT v_new_exists THEN
        RAISE EXCEPTION '❌ MIGRATION FAILED: multilingual_content table not found!';
    END IF;
END $$;

-- ============================================================================
-- CHECK 2: Column structure
-- ============================================================================

DO $$
DECLARE
    v_columns TEXT[];
    v_expected_columns TEXT[] := ARRAY[
        'id', 'nr', 'type',
        'greek_transcription', 'greek_phonetic',
        'en_translation', 'en_importance_reason', 'en_audio_url',
        'de_translation', 'de_importance_reason', 'de_audio_url',
        'es_translation', 'es_importance_reason', 'es_audio_url',
        'ru_translation', 'ru_importance_reason', 'ru_audio_url',
        'level', 'difficulty', 'frequency',
        'created_at', 'updated_at'
    ];
    v_missing TEXT[];
BEGIN
    -- Get actual columns
    SELECT array_agg(column_name ORDER BY ordinal_position)
    INTO v_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'multilingual_content';

    -- Find missing columns
    SELECT array_agg(col)
    INTO v_missing
    FROM unnest(v_expected_columns) AS col
    WHERE col != ALL(v_columns);

    RAISE NOTICE '📋 COLUMN STRUCTURE:';
    RAISE NOTICE '   Total columns: %', array_length(v_columns, 1);
    RAISE NOTICE '   Expected: %', array_length(v_expected_columns, 1);

    IF v_missing IS NOT NULL THEN
        RAISE NOTICE '   ⚠️ Missing columns: %', v_missing;
    ELSE
        RAISE NOTICE '   ✅ All expected columns present';
    END IF;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CHECK 3: Indexes
-- ============================================================================

DO $$
DECLARE
    v_index_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'multilingual_content';

    RAISE NOTICE '📋 INDEXES:';
    RAISE NOTICE '   Total indexes: %', v_index_count;
    RAISE NOTICE '   Expected: >= 8';

    IF v_index_count >= 8 THEN
        RAISE NOTICE '   ✅ Indexes created';
    ELSE
        RAISE NOTICE '   ⚠️ Some indexes missing';
    END IF;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CHECK 4: Data migration
-- ============================================================================

DO $$
DECLARE
    v_old_count INTEGER := 0;
    v_new_count INTEGER;
    v_with_en INTEGER;
    v_with_de INTEGER;
    v_with_es INTEGER;
    v_with_ru INTEGER;
BEGIN
    -- Count old records (if backup exists)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_backup_20260218') THEN
        SELECT COUNT(*) INTO v_old_count FROM content_backup_20260218;
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_old_deprecated_20260218') THEN
        SELECT COUNT(*) INTO v_old_count FROM content_old_deprecated_20260218;
    END IF;

    -- Count new records
    SELECT COUNT(*) INTO v_new_count FROM multilingual_content;

    -- Count translations
    SELECT COUNT(*) INTO v_with_en FROM multilingual_content
        WHERE en_translation IS NOT NULL AND en_translation != '';
    SELECT COUNT(*) INTO v_with_de FROM multilingual_content
        WHERE de_translation IS NOT NULL AND de_translation != '';
    SELECT COUNT(*) INTO v_with_es FROM multilingual_content
        WHERE es_translation IS NOT NULL AND es_translation != '';
    SELECT COUNT(*) INTO v_with_ru FROM multilingual_content
        WHERE ru_translation IS NOT NULL AND ru_translation != '';

    RAISE NOTICE '📋 DATA MIGRATION:';
    RAISE NOTICE '   Old table rows: %', v_old_count;
    RAISE NOTICE '   New table rows: %', v_new_count;

    IF v_new_count >= v_old_count THEN
        RAISE NOTICE '   ✅ All data migrated (%.1f%%)', (v_new_count::FLOAT / NULLIF(v_old_count, 1) * 100);
    ELSE
        RAISE NOTICE '   ⚠️ Some data missing (%.1f%%)', (v_new_count::FLOAT / NULLIF(v_old_count, 1) * 100);
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '📋 TRANSLATION COVERAGE:';
    RAISE NOTICE '   English: % / % (%.1f%%)', v_with_en, v_new_count, (v_with_en::FLOAT / NULLIF(v_new_count, 0) * 100);
    RAISE NOTICE '   German: % / % (%.1f%%)', v_with_de, v_new_count, (v_with_de::FLOAT / NULLIF(v_new_count, 0) * 100);
    RAISE NOTICE '   Spanish: % / % (%.1f%%)', v_with_es, v_new_count, (v_with_es::FLOAT / NULLIF(v_new_count, 0) * 100);
    RAISE NOTICE '   Russian: % / % (%.1f%%)', v_with_ru, v_new_count, (v_with_ru::FLOAT / NULLIF(v_new_count, 0) * 100);
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CHECK 5: Functions
-- ============================================================================

DO $$
DECLARE
    v_func1_exists BOOLEAN;
    v_func2_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'check_multilingual_content_duplicate'
    ) INTO v_func1_exists;

    SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'get_multilingual_content_stats'
    ) INTO v_func2_exists;

    RAISE NOTICE '📋 FUNCTIONS:';
    RAISE NOTICE '   check_multilingual_content_duplicate: %',
        CASE WHEN v_func1_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '   get_multilingual_content_stats: %',
        CASE WHEN v_func2_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CHECK 6: RLS Policies
-- ============================================================================

DO $$
DECLARE
    v_policy_count INTEGER;
    v_rls_enabled BOOLEAN;
BEGIN
    -- Check if RLS is enabled
    SELECT relrowsecurity
    INTO v_rls_enabled
    FROM pg_class
    WHERE relname = 'multilingual_content';

    -- Count policies
    SELECT COUNT(*)
    INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'multilingual_content';

    RAISE NOTICE '📋 ROW LEVEL SECURITY:';
    RAISE NOTICE '   RLS Enabled: %', CASE WHEN v_rls_enabled THEN '✅ YES' ELSE '❌ NO' END;
    RAISE NOTICE '   Policies: %', v_policy_count;
    RAISE NOTICE '   Expected: >= 4';

    IF v_policy_count >= 4 THEN
        RAISE NOTICE '   ✅ Policies created';
    ELSE
        RAISE NOTICE '   ⚠️ Some policies missing';
    END IF;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CHECK 7: Sample data query
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📋 SAMPLE DATA (first 3 rows):';
END $$;

SELECT
    id,
    type,
    greek_transcription,
    LEFT(en_translation, 30) as en_trans,
    level,
    difficulty,
    frequency
FROM multilingual_content
ORDER BY created_at DESC
LIMIT 3;

-- ============================================================================
-- CHECK 8: Statistics
-- ============================================================================

SELECT * FROM get_multilingual_content_stats();

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
DECLARE
    v_all_good BOOLEAN := TRUE;
BEGIN
    -- Perform final checks
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'multilingual_content') THEN
        v_all_good := FALSE;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '============================================================';

    IF v_all_good THEN
        RAISE NOTICE '✅ VERIFICATION PASSED';
        RAISE NOTICE '✅ Migration 082 completed successfully';
        RAISE NOTICE '✅ All checks passed';
    ELSE
        RAISE NOTICE '⚠️ VERIFICATION ISSUES DETECTED';
        RAISE NOTICE '⚠️ Please review the output above';
        RAISE NOTICE '⚠️ You may need to run rollback and retry';
    END IF;

    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
END $$;
