-- ========================================
-- DIAGNOSE DASHBOARD ISSUES
-- ========================================
-- Migration 069: Diagnostic queries for student_progress and streak system
-- Date: 2026-02-16
-- Purpose: Check if required tables/RPCs exist and identify issues

-- ========================================
-- 1. CHECK IF TABLES EXIST
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. CHECKING TABLES';
    RAISE NOTICE '========================================';

    -- Check student_progress table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'student_progress'
    ) THEN
        RAISE NOTICE '✅ student_progress table EXISTS';

        -- Check columns
        RAISE NOTICE '   Columns:';
        FOR col_record IN
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'student_progress'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '   - %', col_record.column_name;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ student_progress table MISSING!';
    END IF;

    -- Check users table has streak columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'streak_days'
    ) THEN
        RAISE NOTICE '✅ users.streak_days column EXISTS';
    ELSE
        RAISE NOTICE '❌ users.streak_days column MISSING!';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'last_activity_date'
    ) THEN
        RAISE NOTICE '✅ users.last_activity_date column EXISTS';
    ELSE
        RAISE NOTICE '❌ users.last_activity_date column MISSING!';
    END IF;
END $$;

-- ========================================
-- 2. CHECK IF RPC FUNCTIONS EXIST
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '2. CHECKING RPC FUNCTIONS';
    RAISE NOTICE '========================================';

    -- Check update_user_streak
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'update_user_streak'
    ) THEN
        RAISE NOTICE '✅ update_user_streak() RPC EXISTS';
    ELSE
        RAISE NOTICE '❌ update_user_streak() RPC MISSING!';
    END IF;

    -- Check get_user_streak
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'get_user_streak'
    ) THEN
        RAISE NOTICE '✅ get_user_streak() RPC EXISTS';
    ELSE
        RAISE NOTICE '❌ get_user_streak() RPC MISSING!';
    END IF;
END $$;

-- ========================================
-- 3. CHECK RLS POLICIES
-- ========================================

DO $$
DECLARE
    v_rls_enabled BOOLEAN;
    v_policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '3. CHECKING RLS POLICIES';
    RAISE NOTICE '========================================';

    -- Check if RLS is enabled on student_progress
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = 'student_progress' AND relnamespace = 'public'::regnamespace;

    IF v_rls_enabled THEN
        RAISE NOTICE '✅ RLS is ENABLED on student_progress';

        -- Count policies
        SELECT COUNT(*) INTO v_policy_count
        FROM pg_policies
        WHERE tablename = 'student_progress';

        RAISE NOTICE '   Found % RLS policies', v_policy_count;

        -- List policies
        IF v_policy_count > 0 THEN
            RAISE NOTICE '   Policies:';
            FOR policy_record IN
                SELECT policyname, cmd, qual
                FROM pg_policies
                WHERE tablename = 'student_progress'
            LOOP
                RAISE NOTICE '   - % (command: %)', policy_record.policyname, policy_record.cmd;
            END LOOP;
        ELSE
            RAISE NOTICE '⚠️  NO POLICIES FOUND - queries will fail!';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  RLS is DISABLED on student_progress';
    END IF;
END $$;

-- ========================================
-- 4. SAMPLE DATA CHECK
-- ========================================

DO $$
DECLARE
    v_student_progress_count INTEGER;
    v_users_with_streak INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '4. CHECKING DATA';
    RAISE NOTICE '========================================';

    -- Count student_progress rows
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_progress') THEN
        SELECT COUNT(*) INTO v_student_progress_count FROM public.student_progress;
        RAISE NOTICE 'student_progress rows: %', v_student_progress_count;
    END IF;

    -- Count users with streaks
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'streak_days'
    ) THEN
        SELECT COUNT(*) INTO v_users_with_streak
        FROM public.users
        WHERE streak_days > 0;
        RAISE NOTICE 'Users with active streaks: %', v_users_with_streak;
    END IF;
END $$;

-- ========================================
-- 5. RECOMMENDATIONS
-- ========================================

DO $$
DECLARE
    v_issues INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '5. RECOMMENDATIONS';
    RAISE NOTICE '========================================';

    -- Check each potential issue
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_progress') THEN
        RAISE NOTICE '❌ Run migration 047_setup_student_progress_for_phrases.sql';
        v_issues := v_issues + 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_streak') THEN
        RAISE NOTICE '❌ Run migration 058_add_streak_tracking.sql';
        v_issues := v_issues + 1;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'student_progress'
          AND c.relrowsecurity = true
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_progress') THEN
            RAISE NOTICE '❌ ADD RLS policies for student_progress table';
            RAISE NOTICE '   Queries will fail without policies!';
            v_issues := v_issues + 1;
        END IF;
    END IF;

    IF v_issues = 0 THEN
        RAISE NOTICE '✅ All checks passed!';
        RAISE NOTICE '';
        RAISE NOTICE 'If dashboard still fails:';
        RAISE NOTICE '1. Check browser console for exact error';
        RAISE NOTICE '2. Verify user ID is correct (check auth-context)';
        RAISE NOTICE '3. Check RLS policies allow access for custom auth';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Found % issues - see recommendations above', v_issues;
    END IF;
END $$;
