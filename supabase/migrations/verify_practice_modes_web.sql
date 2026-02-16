-- ============================================================================
-- Practice Modes Migration Verification (Web UI Compatible)
-- ============================================================================
-- Run this in Supabase SQL Editor after applying 067_add_practice_modes.sql
-- ============================================================================

-- Check 1: practice_modes_config column exists
SELECT
    '✅ Column Check' AS test,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'learning_items'
            AND column_name = 'practice_modes_config'
            AND data_type = 'jsonb'
        ) THEN '✅ practice_modes_config column exists (JSONB)'
        ELSE '❌ practice_modes_config column MISSING'
    END AS result;

-- Check 2: practice_attempts table exists
SELECT
    '✅ Table Check' AS test,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'practice_attempts'
        ) THEN '✅ practice_attempts table exists with ' ||
            (SELECT COUNT(*)::TEXT FROM information_schema.columns WHERE table_name = 'practice_attempts') || ' columns'
        ELSE '❌ practice_attempts table MISSING'
    END AS result;

-- Check 3: RPC functions exist
SELECT
    '✅ Functions Check' AS test,
    'Found ' || COUNT(*)::TEXT || ' of 4 required functions' AS result
FROM information_schema.routines
WHERE routine_name IN (
    'get_practice_config',
    'record_practice_attempt',
    'get_practice_stats',
    'admin_update_practice_config'
);

-- Check 4: List all practice-related functions
SELECT
    '📋 Function Details' AS category,
    routine_name AS function_name,
    '✅ EXISTS' AS status
FROM information_schema.routines
WHERE routine_name IN (
    'get_practice_config',
    'record_practice_attempt',
    'get_practice_stats',
    'admin_update_practice_config'
)
ORDER BY routine_name;

-- Check 5: Indexes exist
SELECT
    '✅ Indexes Check' AS test,
    'Found ' || COUNT(*)::TEXT || ' practice-related indexes' AS result
FROM pg_indexes
WHERE tablename IN ('learning_items', 'practice_attempts')
AND indexname LIKE '%practice%';

-- Check 6: List indexes
SELECT
    '📋 Index Details' AS category,
    tablename AS table_name,
    indexname AS index_name,
    '✅ EXISTS' AS status
FROM pg_indexes
WHERE tablename IN ('learning_items', 'practice_attempts')
AND indexname LIKE '%practice%'
ORDER BY tablename, indexname;

-- Check 7: RLS policies exist
SELECT
    '✅ RLS Policies Check' AS test,
    'Found ' || COUNT(*)::TEXT || ' RLS policies on practice_attempts' AS result
FROM pg_policies
WHERE tablename = 'practice_attempts';

-- Check 8: List RLS policies
SELECT
    '📋 Policy Details' AS category,
    policyname AS policy_name,
    cmd AS command,
    '✅ EXISTS' AS status
FROM pg_policies
WHERE tablename = 'practice_attempts'
ORDER BY policyname;

-- Check 9: Sample config structure
SELECT
    '📋 Sample Config' AS category,
    id,
    english,
    practice_modes_config
FROM learning_items
LIMIT 3;

-- Check 10: Overall verification summary
SELECT
    '🎯 OVERALL STATUS' AS check_type,
    CASE
        WHEN (
            -- Column exists
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'learning_items' AND column_name = 'practice_modes_config'
        ) = 1
        AND (
            -- Table exists
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'practice_attempts'
        ) = 1
        AND (
            -- 4 functions exist
            SELECT COUNT(*) FROM information_schema.routines
            WHERE routine_name IN ('get_practice_config', 'record_practice_attempt', 'get_practice_stats', 'admin_update_practice_config')
        ) = 4
        AND (
            -- At least 4 RLS policies
            SELECT COUNT(*) FROM pg_policies
            WHERE tablename = 'practice_attempts'
        ) >= 4
        THEN '✅✅✅ MIGRATION SUCCESSFUL - All components installed correctly! ✅✅✅'
        ELSE '⚠️ MIGRATION INCOMPLETE - Check results above for missing components'
    END AS verification_result;

-- Check 11: Detailed component status
SELECT
    '📊 Component Status' AS category,
    component,
    status
FROM (
    SELECT 'practice_modes_config column' AS component,
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_items' AND column_name = 'practice_modes_config')
           THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status
    UNION ALL
    SELECT 'practice_attempts table',
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_attempts')
           THEN '✅ EXISTS' ELSE '❌ MISSING' END
    UNION ALL
    SELECT 'get_practice_config()',
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_practice_config')
           THEN '✅ EXISTS' ELSE '❌ MISSING' END
    UNION ALL
    SELECT 'record_practice_attempt()',
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'record_practice_attempt')
           THEN '✅ EXISTS' ELSE '❌ MISSING' END
    UNION ALL
    SELECT 'get_practice_stats()',
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_practice_stats')
           THEN '✅ EXISTS' ELSE '❌ MISSING' END
    UNION ALL
    SELECT 'admin_update_practice_config()',
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'admin_update_practice_config')
           THEN '✅ EXISTS' ELSE '❌ MISSING' END
    UNION ALL
    SELECT 'RLS Policies (' || (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'practice_attempts') || ')',
           CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'practice_attempts') >= 4
           THEN '✅ OK' ELSE '⚠️ INCOMPLETE' END
    UNION ALL
    SELECT 'Indexes (' || (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE tablename IN ('learning_items', 'practice_attempts') AND indexname LIKE '%practice%') || ')',
           CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('learning_items', 'practice_attempts') AND indexname LIKE '%practice%') >= 3
           THEN '✅ OK' ELSE '⚠️ INCOMPLETE' END
) AS components
ORDER BY component;

-- ============================================================================
-- If all checks show ✅, migration was successful!
-- Next steps:
-- 1. Go to admin panel → Configure practice modes for learning items
-- 2. Log in as student → Complete FSRS reviews to unlock practice modes
-- 3. Play practice games!
-- ============================================================================
