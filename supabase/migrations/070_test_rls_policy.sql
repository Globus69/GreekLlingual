-- ============================================================================
-- TEST RLS POLICY - Check if student_progress is accessible
-- ============================================================================

-- 1. Show the RLS policy definition
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'student_progress';

-- 2. Test if policy uses Custom Auth (checks for custom.user_id)
SELECT
    policyname,
    CASE
        WHEN qual::text LIKE '%custom%' OR qual::text LIKE '%current_setting%'
        THEN '✅ Uses Custom Auth'
        WHEN qual::text LIKE '%auth.uid()%'
        THEN '⚠️ Uses Supabase Auth (may not work with Custom Auth)'
        ELSE '❓ Unknown auth mechanism: ' || qual::text
    END as auth_type,
    qual::text as policy_definition
FROM pg_policies
WHERE tablename = 'student_progress';

-- 3. First check what columns exist in users table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Show all users (to verify user_id format)
-- Using only columns we know exist
SELECT
    id,
    role,
    streak_days,
    last_activity_date,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
