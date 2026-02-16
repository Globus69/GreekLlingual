-- ============================================================================
-- DIAGNOSTIC SCRIPT - Dashboard Bugs (Returns Table Results)
-- ============================================================================
-- Date: 2026-02-16
-- Purpose: Diagnose missing RPCs and tables - RETURNS ACTUAL ROWS
-- ============================================================================

-- Check 1: student_progress table exists
SELECT
    'student_progress_table' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'student_progress'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    'Critical: Dashboard cannot fetch user progress without this table' as description
UNION ALL

-- Check 2: users.streak_days column
SELECT
    'users.streak_days' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'streak_days'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    'Required for streak tracking' as description
UNION ALL

-- Check 3: users.last_activity_date column
SELECT
    'users.last_activity_date' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'last_activity_date'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    'Required for streak tracking' as description
UNION ALL

-- Check 4: users.longest_streak column
SELECT
    'users.longest_streak' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'longest_streak'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    'Required for streak achievements' as description
UNION ALL

-- Check 5: update_user_streak RPC
SELECT
    'update_user_streak_rpc' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = 'update_user_streak'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    'Critical: Called on every dashboard load' as description
UNION ALL

-- Check 6: get_user_streak RPC
SELECT
    'get_user_streak_rpc' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = 'get_user_streak'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    'Required for displaying streak info' as description
UNION ALL

-- Check 7: student_progress row count
SELECT
    'student_progress_rows' as check_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_progress')
        THEN '✅ ' || COALESCE((SELECT COUNT(*)::text FROM student_progress), '0') || ' rows'
        ELSE '❌ TABLE MISSING'
    END as status,
    'Number of progress records in database' as description
UNION ALL

-- Check 8: RLS on student_progress
SELECT
    'student_progress_rls' as check_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_progress')
        THEN
            CASE
                WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_progress' AND relnamespace = 'public'::regnamespace)
                THEN '✅ ENABLED'
                ELSE '⚠️ DISABLED'
            END
        ELSE '❌ TABLE MISSING'
    END as status,
    'Row Level Security status' as description
UNION ALL

-- Check 9: student_progress policies count
SELECT
    'student_progress_policies' as check_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_progress')
        THEN '✅ ' || (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'student_progress') || ' policies'
        ELSE '❌ TABLE MISSING'
    END as status,
    'Number of RLS policies configured' as description

ORDER BY check_name;
