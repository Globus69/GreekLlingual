-- Migration 075: Fix student_progress RLS for Custom Auth
-- Date: 2026-02-17
-- Purpose: Fix 406 error by using permissive RLS for custom auth setup

-- ============================================================================
-- Enable RLS (if not already enabled)
-- ============================================================================
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Drop existing policies
-- ============================================================================
DROP POLICY IF EXISTS "student_progress_select_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_insert_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_update_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_delete_policy" ON public.student_progress;

-- ============================================================================
-- CREATE PERMISSIVE POLICIES FOR CUSTOM AUTH
-- ============================================================================
-- IMPORTANT: This project uses custom auth (localStorage), not Supabase Auth.
-- Therefore we can't use auth.uid(). Instead, we allow authenticated users
-- to access all student_progress rows, and rely on application-level checks.

-- SELECT: Authenticated users can view all progress (app-level filtering)
CREATE POLICY "student_progress_select_policy"
ON public.student_progress
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can insert progress records
CREATE POLICY "student_progress_insert_policy"
ON public.student_progress
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Authenticated users can update progress records
CREATE POLICY "student_progress_update_policy"
ON public.student_progress
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Authenticated users can delete progress records
CREATE POLICY "student_progress_delete_policy"
ON public.student_progress
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_progress TO authenticated;
GRANT ALL ON public.student_progress TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_progress TO anon;

-- ============================================================================
-- Security Note
-- ============================================================================
-- This setup allows authenticated users to access all student_progress rows.
-- Access control is enforced at the application level (via context/auth-context.tsx).
--
-- For production: Consider implementing RLS with custom JWT claims or
-- migrating to Supabase Auth for better security.

COMMENT ON POLICY "student_progress_select_policy" ON public.student_progress IS 'Permissive SELECT for custom auth - app enforces user filtering';
COMMENT ON POLICY "student_progress_insert_policy" ON public.student_progress IS 'Permissive INSERT for custom auth';
COMMENT ON POLICY "student_progress_update_policy" ON public.student_progress IS 'Permissive UPDATE for custom auth';
COMMENT ON POLICY "student_progress_delete_policy" ON public.student_progress IS 'Permissive DELETE for custom auth';
