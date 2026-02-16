-- ============================================================================
-- SIMPLE DASHBOARD DIAGNOSTIC - All Results in One Table
-- ============================================================================
-- Date: 2026-02-16
-- Purpose: Check all dashboard components in a single query
-- ============================================================================

SELECT
    ROW_NUMBER() OVER () as nr,
    check_name,
    status,
    description
FROM (
    -- 1. Check student_progress table
    SELECT
        1 as sort_order,
        '1️⃣ student_progress table' as check_name,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'student_progress'
            ) THEN '✅ EXISTS'
            ELSE '❌ MISSING'
        END as status,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'student_progress'
            ) THEN 'Table found - Dashboard can query user progress'
            ELSE '🔴 CRITICAL: Run migration 047_setup_student_progress_for_phrases.sql'
        END as description

    UNION ALL

    -- 2. Check streak_days column
    SELECT
        2 as sort_order,
        '2️⃣ users.streak_days' as check_name,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'streak_days'
            ) THEN '✅ EXISTS'
            ELSE '❌ MISSING'
        END as status,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'streak_days'
            ) THEN 'Column found - Streak tracking enabled'
            ELSE '🔴 CRITICAL: Run migration 058_add_streak_tracking.sql'
        END as description

    UNION ALL

    -- 3. Check last_activity_date column
    SELECT
        3 as sort_order,
        '3️⃣ users.last_activity_date' as check_name,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'last_activity_date'
            ) THEN '✅ EXISTS'
            ELSE '❌ MISSING'
        END as status,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'last_activity_date'
            ) THEN 'Column found - Activity tracking enabled'
            ELSE '🔴 CRITICAL: Run migration 058_add_streak_tracking.sql'
        END as description

    UNION ALL

    -- 4. Check longest_streak column
    SELECT
        4 as sort_order,
        '4️⃣ users.longest_streak' as check_name,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'longest_streak'
            ) THEN '✅ EXISTS'
            ELSE '❌ MISSING'
        END as status,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'longest_streak'
            ) THEN 'Column found - Longest streak tracking enabled'
            ELSE '🔴 CRITICAL: Run migration 058_add_streak_tracking.sql'
        END as description

    UNION ALL

    -- 5. Check update_user_streak RPC
    SELECT
        5 as sort_order,
        '5️⃣ update_user_streak() RPC' as check_name,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM pg_proc
                WHERE proname = 'update_user_streak'
            ) THEN '✅ EXISTS'
            ELSE '❌ MISSING'
        END as status,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM pg_proc
                WHERE proname = 'update_user_streak'
            ) THEN 'RPC function found - Streak updates work'
            ELSE '🔴 CRITICAL: Run migration 058_add_streak_tracking.sql'
        END as description

    UNION ALL

    -- 6. Check get_user_streak RPC
    SELECT
        6 as sort_order,
        '6️⃣ get_user_streak() RPC' as check_name,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM pg_proc
                WHERE proname = 'get_user_streak'
            ) THEN '✅ EXISTS'
            ELSE '❌ MISSING'
        END as status,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM pg_proc
                WHERE proname = 'get_user_streak'
            ) THEN 'RPC function found - Streak queries work'
            ELSE '🔴 CRITICAL: Run migration 058_add_streak_tracking.sql'
        END as description

    UNION ALL

    -- 7. Overall Health Summary
    SELECT
        7 as sort_order,
        '🎯 OVERALL HEALTH' as check_name,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'student_progress'
            )
            AND EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name IN ('streak_days', 'last_activity_date', 'longest_streak')
                HAVING COUNT(*) = 3
            )
            AND EXISTS (
                SELECT 1 FROM pg_proc
                WHERE proname IN ('update_user_streak', 'get_user_streak')
                HAVING COUNT(*) = 2
            )
            THEN '✅ ALL HEALTHY'
            ELSE '❌ MISSING COMPONENTS'
        END as status,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'student_progress'
            )
            AND EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name IN ('streak_days', 'last_activity_date', 'longest_streak')
                HAVING COUNT(*) = 3
            )
            AND EXISTS (
                SELECT 1 FROM pg_proc
                WHERE proname IN ('update_user_streak', 'get_user_streak')
                HAVING COUNT(*) = 2
            )
            THEN '🎉 Dashboard should work! Refresh browser and test.'
            ELSE '⚠️ See ❌ MISSING items above - Apply those migrations'
        END as description
) sub
ORDER BY sort_order;
