-- ============================================================================
-- Practice Modes Migration Verification Script
-- ============================================================================
-- Run this after applying 067_add_practice_modes.sql to verify success
-- Execute in Supabase SQL Editor or via psql
-- ============================================================================

\echo '========================================='
\echo 'Practice Modes Migration Verification'
\echo '========================================='
\echo ''

-- ============================================================================
-- 1. Check practice_modes_config column on learning_items
-- ============================================================================
\echo '1. Checking practice_modes_config column...'
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'learning_items'
          AND column_name = 'practice_modes_config'
          AND data_type = 'jsonb'
    ) INTO v_exists;

    IF v_exists THEN
        RAISE NOTICE '✅ Column practice_modes_config exists (JSONB)';
    ELSE
        RAISE WARNING '❌ Column practice_modes_config NOT FOUND';
    END IF;
END $$;

-- ============================================================================
-- 2. Check practice_attempts table
-- ============================================================================
\echo '2. Checking practice_attempts table...'
DO $$
DECLARE
    v_exists BOOLEAN;
    v_column_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'practice_attempts'
    ) INTO v_exists;

    IF v_exists THEN
        SELECT COUNT(*)
        INTO v_column_count
        FROM information_schema.columns
        WHERE table_name = 'practice_attempts';

        RAISE NOTICE '✅ Table practice_attempts exists with % columns', v_column_count;
    ELSE
        RAISE WARNING '❌ Table practice_attempts NOT FOUND';
    END IF;
END $$;

-- ============================================================================
-- 3. Check RPC functions
-- ============================================================================
\echo '3. Checking RPC functions...'
DO $$
DECLARE
    v_function_name TEXT;
    v_count INTEGER := 0;
BEGIN
    FOR v_function_name IN
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_name IN (
            'get_practice_config',
            'record_practice_attempt',
            'get_practice_stats',
            'admin_update_practice_config'
        )
        ORDER BY routine_name
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '✅ Function found: %', v_function_name;
    END LOOP;

    IF v_count = 4 THEN
        RAISE NOTICE '✅ All 4 RPC functions created successfully';
    ELSE
        RAISE WARNING '⚠️  Only % of 4 RPC functions found', v_count;
    END IF;
END $$;

-- ============================================================================
-- 4. Check indexes
-- ============================================================================
\echo '4. Checking indexes...'
DO $$
DECLARE
    v_index_name TEXT;
    v_count INTEGER := 0;
BEGIN
    FOR v_index_name IN
        SELECT indexname
        FROM pg_indexes
        WHERE tablename IN ('learning_items', 'practice_attempts')
          AND indexname LIKE '%practice%'
        ORDER BY indexname
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '✅ Index found: %', v_index_name;
    END LOOP;

    IF v_count >= 3 THEN
        RAISE NOTICE '✅ Practice-related indexes created';
    ELSE
        RAISE WARNING '⚠️  Only % practice indexes found (expected 3)', v_count;
    END IF;
END $$;

-- ============================================================================
-- 5. Check RLS policies on practice_attempts
-- ============================================================================
\echo '5. Checking RLS policies...'
DO $$
DECLARE
    v_policy_name TEXT;
    v_count INTEGER := 0;
BEGIN
    FOR v_policy_name IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'practice_attempts'
        ORDER BY policyname
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE '✅ Policy found: %', v_policy_name;
    END LOOP;

    IF v_count >= 4 THEN
        RAISE NOTICE '✅ RLS policies created (% policies)', v_count;
    ELSE
        RAISE WARNING '⚠️  Only % RLS policies found (expected 4)', v_count;
    END IF;
END $$;

-- ============================================================================
-- 6. Test sample data structure
-- ============================================================================
\echo '6. Testing practice_modes_config default value...'
DO $$
DECLARE
    v_sample_id UUID;
    v_config JSONB;
BEGIN
    -- Try to get a sample learning item
    SELECT id, practice_modes_config
    INTO v_sample_id, v_config
    FROM learning_items
    LIMIT 1;

    IF v_sample_id IS NOT NULL THEN
        RAISE NOTICE '✅ Sample item ID: %', v_sample_id;
        RAISE NOTICE '   Config structure: %', v_config;

        -- Check if config has expected keys
        IF v_config ? 'enabled' AND v_config ? 'available_modes' THEN
            RAISE NOTICE '✅ Config has correct structure';
        ELSE
            RAISE WARNING '⚠️  Config missing expected keys';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  No learning items found (empty table)';
    END IF;
END $$;

-- ============================================================================
-- Summary
-- ============================================================================
\echo ''
\echo '========================================='
\echo 'Verification Summary'
\echo '========================================='

SELECT
    CASE
        WHEN (
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'learning_items' AND column_name = 'practice_modes_config'
        ) = 1
        AND (
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'practice_attempts'
        ) = 1
        AND (
            SELECT COUNT(*) FROM information_schema.routines
            WHERE routine_name IN ('get_practice_config', 'record_practice_attempt', 'get_practice_stats', 'admin_update_practice_config')
        ) = 4
        AND (
            SELECT COUNT(*) FROM pg_policies
            WHERE tablename = 'practice_attempts'
        ) >= 4
        THEN '✅ MIGRATION SUCCESSFUL - All components installed'
        ELSE '⚠️  MIGRATION INCOMPLETE - Check errors above'
    END AS verification_result;

\echo ''
\echo 'Detailed object counts:'

-- Count all created objects
SELECT
    'learning_items.practice_modes_config' AS object_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'learning_items' AND column_name = 'practice_modes_config'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status
UNION ALL
SELECT
    'practice_attempts table',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_attempts'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
    'get_practice_config()',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_practice_config'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
    'record_practice_attempt()',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'record_practice_attempt'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
    'get_practice_stats()',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_practice_stats'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
    'admin_update_practice_config()',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines WHERE routine_name = 'admin_update_practice_config'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
    'RLS Policies',
    CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'practice_attempts') >= 4
    THEN '✅ ' || (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'practice_attempts') || ' policies'
    ELSE '⚠️  Only ' || (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'practice_attempts') || ' policies' END
UNION ALL
SELECT
    'Indexes',
    CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('learning_items', 'practice_attempts') AND indexname LIKE '%practice%') >= 3
    THEN '✅ ' || (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE tablename IN ('learning_items', 'practice_attempts') AND indexname LIKE '%practice%') || ' indexes'
    ELSE '⚠️  Only ' || (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE tablename IN ('learning_items', 'practice_attempts') AND indexname LIKE '%practice%') || ' indexes' END;

\echo ''
\echo '========================================='
\echo 'Next Steps:'
\echo '1. Configure practice modes in admin panel'
\echo '2. Test practice mode unlock logic'
\echo '3. Play practice games as student'
\echo '4. Monitor practice_attempts table'
\echo '========================================='
