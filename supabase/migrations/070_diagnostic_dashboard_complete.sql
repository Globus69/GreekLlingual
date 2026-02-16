-- ============================================================================
-- COMPLETE DASHBOARD DIAGNOSTIC - Web-Compatible for Supabase SQL Editor
-- ============================================================================
-- Date: 2026-02-16
-- Purpose: Comprehensive health check for Dashboard system
-- Usage: Copy-paste entire file into Supabase SQL Editor and execute
-- Returns: Multiple result sets showing status of all components
-- ============================================================================

-- ============================================================================
-- 1️⃣ STUDENT_PROGRESS TABLE CHECK
-- ============================================================================
SELECT
    '1️⃣ STUDENT_PROGRESS TABLE' as section,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'student_progress'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING → Run migration 047_setup_student_progress_for_phrases.sql'
    END as status,
    (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'student_progress'
    ) as column_count;

-- ============================================================================
-- 2️⃣ USERS STREAK COLUMNS CHECK
-- ============================================================================
SELECT
    '2️⃣ USERS STREAK COLUMNS' as section,
    column_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND information_schema.columns.column_name = check_columns.column_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING → Run migration 058_add_streak_tracking.sql'
    END as status
FROM (
    VALUES
        ('streak_days'),
        ('last_activity_date'),
        ('longest_streak')
) AS check_columns(column_name);

-- ============================================================================
-- 3️⃣ STREAK RPC FUNCTIONS CHECK
-- ============================================================================
SELECT
    '3️⃣ STREAK RPC FUNCTIONS' as section,
    function_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = check_functions.function_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING → Run migration 058_add_streak_tracking.sql'
    END as status
FROM (
    VALUES
        ('update_user_streak'),
        ('get_user_streak')
) AS check_functions(function_name);

-- ============================================================================
-- 4️⃣ RLS POLICIES CHECK
-- ============================================================================
SELECT
    '4️⃣ RLS POLICIES' as section,
    (
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'student_progress'
          AND relnamespace = 'public'::regnamespace
    ) as rls_enabled,
    (
        SELECT COUNT(*)
        FROM pg_policies
        WHERE tablename = 'student_progress'
    ) as policy_count;

-- Show policy details
SELECT
    '   Policy Details' as section,
    policyname as policy_name,
    cmd as command,
    CASE
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause
FROM pg_policies
WHERE tablename = 'student_progress'
ORDER BY policyname;

-- ============================================================================
-- 5️⃣ DATA VALIDATION
-- ============================================================================
-- Test if student_progress is queryable
SELECT
    '5️⃣ DATA VALIDATION' as section,
    'student_progress' as table_name,
    COUNT(*) as total_rows,
    '✅ Table is queryable' as status
FROM student_progress
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'student_progress'
)
UNION ALL
SELECT
    '5️⃣ DATA VALIDATION' as section,
    'users' as table_name,
    COUNT(*) as total_rows,
    '✅ Table is queryable' as status
FROM users
WHERE role = 'student';

-- ============================================================================
-- 6️⃣ PRACTICE MODES CHECK (BONUS)
-- ============================================================================
SELECT
    '6️⃣ PRACTICE MODES (BONUS)' as section,
    component,
    CASE
        WHEN component = 'practice_attempts' AND EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'practice_attempts'
        ) THEN '✅ EXISTS'
        WHEN component = 'practice_modes_config' AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'learning_items'
              AND column_name = 'practice_modes_config'
        ) THEN '✅ EXISTS'
        ELSE '⚠️ MISSING (non-critical)'
    END as status
FROM (
    VALUES
        ('practice_attempts'),
        ('practice_modes_config')
) AS check_components(component);

-- ============================================================================
-- 7️⃣ OVERALL HEALTH SUMMARY
-- ============================================================================
WITH health_check AS (
    SELECT
        EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'student_progress'
        ) as has_student_progress,
        EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name IN ('streak_days', 'last_activity_date', 'longest_streak')
            HAVING COUNT(*) = 3
        ) as has_all_streak_cols,
        EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname IN ('update_user_streak', 'get_user_streak')
            HAVING COUNT(*) = 2
        ) as has_all_streak_rpcs
)
SELECT
    '7️⃣ OVERALL HEALTH' as section,
    CASE
        WHEN has_student_progress AND has_all_streak_cols AND has_all_streak_rpcs
        THEN '✅ ALL COMPONENTS HEALTHY - Dashboard should work!'
        ELSE '❌ COMPONENTS MISSING - See details above'
    END as overall_status,
    has_student_progress as student_progress_ok,
    has_all_streak_cols as streak_columns_ok,
    has_all_streak_rpcs as streak_rpcs_ok
FROM health_check;

-- ============================================================================
-- 8️⃣ RECOMMENDED ACTIONS
-- ============================================================================
SELECT
    '8️⃣ RECOMMENDED ACTIONS' as section,
    priority,
    action
FROM (
    SELECT
        1 as priority,
        CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'student_progress'
            ) THEN '🔴 CRITICAL: Run migration 047_setup_student_progress_for_phrases.sql'
            ELSE '✅ student_progress table exists'
        END as action
    UNION ALL
    SELECT
        2 as priority,
        CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name IN ('streak_days', 'last_activity_date', 'longest_streak')
                HAVING COUNT(*) = 3
            ) THEN '🔴 CRITICAL: Run migration 058_add_streak_tracking.sql'
            ELSE '✅ Streak columns exist'
        END as action
    UNION ALL
    SELECT
        3 as priority,
        CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM pg_proc
                WHERE proname IN ('update_user_streak', 'get_user_streak')
                HAVING COUNT(*) = 2
            ) THEN '🔴 CRITICAL: Run migration 058_add_streak_tracking.sql (for RPCs)'
            ELSE '✅ Streak RPCs exist'
        END as action
    UNION ALL
    SELECT
        4 as priority,
        '✅ After applying migrations, refresh browser and clear console' as action
) sub
ORDER BY priority;

-- ============================================================================
-- 9️⃣ TEST USER QUERY (if you have a test user ID)
-- ============================================================================
-- Uncomment and replace USER_ID to test with real data:
/*
-- Replace 'YOUR-USER-ID-HERE' with actual user UUID
WITH test_user AS (
    SELECT 'YOUR-USER-ID-HERE'::uuid as user_id
)
SELECT
    '9️⃣ TEST USER QUERY' as section,
    'student_progress count' as metric,
    COUNT(*) as value
FROM student_progress, test_user
WHERE student_id = test_user.user_id
UNION ALL
SELECT
    '9️⃣ TEST USER QUERY' as section,
    'streak_days' as metric,
    COALESCE(streak_days, 0) as value
FROM users, test_user
WHERE id = test_user.user_id;
*/

-- ============================================================================
-- END OF DIAGNOSTIC
-- ============================================================================
SELECT
    '✅ DIAGNOSTIC COMPLETE' as section,
    'Review all result sets above' as message,
    NOW() as executed_at;
