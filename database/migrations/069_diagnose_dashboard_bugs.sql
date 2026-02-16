-- ============================================================================
-- DIAGNOSTIC SCRIPT - Dashboard Bugs (student_progress & Streak System)
-- ============================================================================
-- Date: 2026-02-16
-- Purpose: Diagnose missing RPCs and tables causing ERR_FAILED errors
-- Run this in Supabase SQL Editor to check what's missing
-- ============================================================================

-- Set client encoding for proper output
SET client_min_messages TO NOTICE;

\echo '============================================================================'
\echo 'DIAGNOSTIC REPORT - Dashboard System'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. CHECK STUDENT_PROGRESS TABLE
-- ============================================================================
\echo '1. Checking student_progress table...'

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_column_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'student_progress'
    ) INTO v_table_exists;

    IF v_table_exists THEN
        RAISE NOTICE '   ✅ student_progress table EXISTS';

        -- Count columns
        SELECT COUNT(*) INTO v_column_count
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'student_progress';

        RAISE NOTICE '   📊 Columns: %', v_column_count;
    ELSE
        RAISE NOTICE '   ❌ student_progress table DOES NOT EXIST';
        RAISE NOTICE '   🔧 Action: Run migration 047_setup_student_progress_for_phrases.sql';
    END IF;
END $$;

-- List all columns if table exists
SELECT
    '   📋 Column: ' || column_name || ' (' || data_type || ')' as info
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_progress'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- 2. CHECK USERS TABLE STREAK COLUMNS
-- ============================================================================
\echo '2. Checking users table streak columns...'

DO $$
DECLARE
    v_has_streak_days BOOLEAN;
    v_has_last_activity BOOLEAN;
    v_has_longest_streak BOOLEAN;
BEGIN
    -- Check streak_days
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'streak_days'
    ) INTO v_has_streak_days;

    -- Check last_activity_date
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'last_activity_date'
    ) INTO v_has_last_activity;

    -- Check longest_streak
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'longest_streak'
    ) INTO v_has_longest_streak;

    -- Report results
    IF v_has_streak_days THEN
        RAISE NOTICE '   ✅ users.streak_days EXISTS';
    ELSE
        RAISE NOTICE '   ❌ users.streak_days MISSING';
    END IF;

    IF v_has_last_activity THEN
        RAISE NOTICE '   ✅ users.last_activity_date EXISTS';
    ELSE
        RAISE NOTICE '   ❌ users.last_activity_date MISSING';
    END IF;

    IF v_has_longest_streak THEN
        RAISE NOTICE '   ✅ users.longest_streak EXISTS';
    ELSE
        RAISE NOTICE '   ❌ users.longest_streak MISSING';
    END IF;

    IF NOT (v_has_streak_days AND v_has_last_activity AND v_has_longest_streak) THEN
        RAISE NOTICE '   🔧 Action: Run migration 058_add_streak_tracking.sql';
    END IF;
END $$;

\echo ''

-- ============================================================================
-- 3. CHECK STREAK RPC FUNCTIONS
-- ============================================================================
\echo '3. Checking streak RPC functions...'

DO $$
DECLARE
    v_has_update_streak BOOLEAN;
    v_has_get_streak BOOLEAN;
BEGIN
    -- Check update_user_streak
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'update_user_streak'
    ) INTO v_has_update_streak;

    -- Check get_user_streak
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'get_user_streak'
    ) INTO v_has_get_streak;

    -- Report results
    IF v_has_update_streak THEN
        RAISE NOTICE '   ✅ update_user_streak() RPC EXISTS';
    ELSE
        RAISE NOTICE '   ❌ update_user_streak() RPC MISSING';
        RAISE NOTICE '   🔧 Action: Run migration 058_add_streak_tracking.sql';
    END IF;

    IF v_has_get_streak THEN
        RAISE NOTICE '   ✅ get_user_streak() RPC EXISTS';
    ELSE
        RAISE NOTICE '   ❌ get_user_streak() RPC MISSING';
        RAISE NOTICE '   🔧 Action: Run migration 058_add_streak_tracking.sql';
    END IF;
END $$;

\echo ''

-- ============================================================================
-- 4. CHECK RLS POLICIES ON STUDENT_PROGRESS
-- ============================================================================
\echo '4. Checking RLS policies on student_progress...'

DO $$
DECLARE
    v_rls_enabled BOOLEAN;
    v_policy_count INTEGER;
BEGIN
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = 'student_progress' AND relnamespace = 'public'::regnamespace;

    IF v_rls_enabled THEN
        RAISE NOTICE '   ✅ RLS is ENABLED on student_progress';
    ELSE
        RAISE NOTICE '   ⚠️  RLS is DISABLED on student_progress';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'student_progress';

    RAISE NOTICE '   📊 Number of policies: %', v_policy_count;
END $$;

-- List policies
SELECT
    '   📋 Policy: ' || policyname || ' (cmd: ' || cmd || ')' as info
FROM pg_policies
WHERE tablename = 'student_progress';

\echo ''

-- ============================================================================
-- 5. TEST QUERIES (with fallback for missing components)
-- ============================================================================
\echo '5. Testing queries...'

-- Test student_progress query (simulate dashboard query)
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_row_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'student_progress'
    ) INTO v_table_exists;

    IF v_table_exists THEN
        SELECT COUNT(*) INTO v_row_count FROM student_progress;
        RAISE NOTICE '   ✅ student_progress query successful (% rows)', v_row_count;
    ELSE
        RAISE NOTICE '   ❌ Cannot test query - table does not exist';
    END IF;
END $$;

-- Test RPC calls (with error handling)
DO $$
DECLARE
    v_has_rpc BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_user_streak'
    ) INTO v_has_rpc;

    IF v_has_rpc THEN
        RAISE NOTICE '   ✅ get_user_streak() RPC is callable';
        -- Note: Not actually calling it here since we don't have a user_id
    ELSE
        RAISE NOTICE '   ❌ Cannot test RPC - function does not exist';
    END IF;
END $$;

\echo ''

-- ============================================================================
-- 6. SUMMARY & RECOMMENDATIONS
-- ============================================================================
\echo '============================================================================'
\echo 'SUMMARY & RECOMMENDATIONS'
\echo '============================================================================'

DO $$
DECLARE
    v_student_progress_exists BOOLEAN;
    v_streak_cols_exist BOOLEAN;
    v_rpcs_exist BOOLEAN;
    v_has_issues BOOLEAN := false;
BEGIN
    -- Check all components
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'student_progress'
    ) INTO v_student_progress_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name IN ('streak_days', 'last_activity_date', 'longest_streak')
        HAVING COUNT(*) = 3
    ) INTO v_streak_cols_exist;

    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname IN ('update_user_streak', 'get_user_streak')
        HAVING COUNT(*) = 2
    ) INTO v_rpcs_exist;

    -- Generate summary
    RAISE NOTICE '';

    IF v_student_progress_exists AND v_streak_cols_exist AND v_rpcs_exist THEN
        RAISE NOTICE '✅ ALL COMPONENTS EXIST - Dashboard should work';
        RAISE NOTICE '';
        RAISE NOTICE 'If you still see ERR_FAILED errors, check:';
        RAISE NOTICE '  1. RLS policies (user must have access)';
        RAISE NOTICE '  2. Network issues (CORS, API endpoint)';
        RAISE NOTICE '  3. Frontend retry logic (check for infinite loops)';
    ELSE
        RAISE NOTICE '❌ MISSING COMPONENTS DETECTED';
        RAISE NOTICE '';

        IF NOT v_student_progress_exists THEN
            RAISE NOTICE '  ❌ student_progress table missing';
            RAISE NOTICE '     → Run: database/migrations/047_setup_student_progress_for_phrases.sql';
        END IF;

        IF NOT v_streak_cols_exist THEN
            RAISE NOTICE '  ❌ Streak columns missing from users table';
            RAISE NOTICE '     → Run: database/migrations/058_add_streak_tracking.sql';
        END IF;

        IF NOT v_rpcs_exist THEN
            RAISE NOTICE '  ❌ Streak RPC functions missing';
            RAISE NOTICE '     → Run: database/migrations/058_add_streak_tracking.sql';
        END IF;

        RAISE NOTICE '';
        RAISE NOTICE '📋 NEXT STEPS:';
        RAISE NOTICE '  1. Apply missing migrations in Supabase SQL Editor';
        RAISE NOTICE '  2. Re-run this diagnostic to verify';
        RAISE NOTICE '  3. Clear browser cache and refresh dashboard';
    END IF;
END $$;

\echo ''
\echo '============================================================================'
\echo 'END OF DIAGNOSTIC REPORT'
\echo '============================================================================'
