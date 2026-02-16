-- ========================================
-- SIMPLE DIAGNOSTIC - Dashboard Issues
-- ========================================

-- 1. Check if student_progress table exists
SELECT
    'student_progress' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'student_progress'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. Check if streak columns exist
SELECT
    'users.streak_days' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'streak_days'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
    'users.last_activity_date',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_activity_date'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 3. Check if RPCs exist
SELECT
    'update_user_streak()' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_user_streak'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
    'get_user_streak()',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_user_streak'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- 4. Check RLS status on student_progress
SELECT
    'student_progress RLS enabled' as check_name,
    CASE WHEN relrowsecurity THEN '✅ ENABLED' ELSE '⚠️ DISABLED' END as status
FROM pg_class
WHERE relname = 'student_progress' AND relnamespace = 'public'::regnamespace;

-- 5. Count RLS policies
SELECT
    'student_progress RLS policies' as check_name,
    COUNT(*)::text || ' policies' as status
FROM pg_policies
WHERE tablename = 'student_progress';

-- 6. List all columns in student_progress
SELECT
    'student_progress columns' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'student_progress'
GROUP BY info;

-- 7. Count data
SELECT 'Data check' as info,
       (SELECT COUNT(*) FROM student_progress) as student_progress_rows,
       (SELECT COUNT(*) FROM users WHERE streak_days > 0) as users_with_streaks;
