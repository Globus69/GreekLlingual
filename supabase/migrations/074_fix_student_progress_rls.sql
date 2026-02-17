-- Migration 074: Fix student_progress RLS Policy
-- Date: 2026-02-17
-- Purpose: Fix 406 Not Acceptable error by adding proper RLS policies

-- ============================================================================
-- Enable RLS (if not already enabled)
-- ============================================================================
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Drop existing policies (if any) to start fresh
-- ============================================================================
DROP POLICY IF EXISTS "student_progress_select_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_insert_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_update_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_delete_policy" ON public.student_progress;

-- ============================================================================
-- CREATE POLICIES
-- ============================================================================

-- SELECT: Users can view their own progress
CREATE POLICY "student_progress_select_policy"
ON public.student_progress
FOR SELECT
TO authenticated
USING (
    -- User can see their own progress
    student_id = auth.uid()
    OR
    -- Allow service role (for admin functions)
    auth.role() = 'service_role'
);

-- INSERT: Users can create their own progress records
CREATE POLICY "student_progress_insert_policy"
ON public.student_progress
FOR INSERT
TO authenticated
WITH CHECK (
    -- User can only insert their own progress
    student_id = auth.uid()
    OR
    -- Allow service role
    auth.role() = 'service_role'
);

-- UPDATE: Users can update their own progress
CREATE POLICY "student_progress_update_policy"
ON public.student_progress
FOR UPDATE
TO authenticated
USING (
    -- User can update their own progress
    student_id = auth.uid()
    OR
    -- Allow service role
    auth.role() = 'service_role'
)
WITH CHECK (
    -- User can only update their own progress
    student_id = auth.uid()
    OR
    -- Allow service role
    auth.role() = 'service_role'
);

-- DELETE: Users can delete their own progress (optional, usually not needed)
CREATE POLICY "student_progress_delete_policy"
ON public.student_progress
FOR DELETE
TO authenticated
USING (
    -- User can delete their own progress
    student_id = auth.uid()
    OR
    -- Allow service role
    auth.role() = 'service_role'
);

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON public.student_progress TO authenticated;
GRANT ALL ON public.student_progress TO service_role;

-- ============================================================================
-- Add policy for anon users (if needed for public access)
-- ============================================================================
-- Uncomment if you need anonymous users to access student_progress
-- CREATE POLICY "student_progress_select_anon"
-- ON public.student_progress
-- FOR SELECT
-- TO anon
-- USING (true);

COMMENT ON POLICY "student_progress_select_policy" ON public.student_progress IS 'Users can view their own learning progress';
COMMENT ON POLICY "student_progress_insert_policy" ON public.student_progress IS 'Users can create their own progress records';
COMMENT ON POLICY "student_progress_update_policy" ON public.student_progress IS 'Users can update their own progress';
COMMENT ON POLICY "student_progress_delete_policy" ON public.student_progress IS 'Users can delete their own progress records';

-- ============================================================================
-- Verification Query (run in Supabase SQL Editor to test)
-- ============================================================================
-- Check if policies are created:
-- SELECT * FROM pg_policies WHERE tablename = 'student_progress';

-- Test SELECT access (should work after migration):
-- SELECT * FROM student_progress WHERE student_id = auth.uid() LIMIT 5;
