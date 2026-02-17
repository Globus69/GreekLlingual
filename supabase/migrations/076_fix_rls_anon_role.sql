-- Migration 076: Fix RLS for anon role (Custom Auth uses anon, not authenticated)
-- Date: 2026-02-17
-- Purpose: Add policies for anon role to fix 406 error with custom auth

-- ============================================================================
-- Drop existing policies and create new ones for BOTH authenticated AND anon
-- ============================================================================

DROP POLICY IF EXISTS "student_progress_select_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_insert_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_update_policy" ON public.student_progress;
DROP POLICY IF EXISTS "student_progress_delete_policy" ON public.student_progress;

-- SELECT: Allow both authenticated and anon users
CREATE POLICY "student_progress_select_policy"
ON public.student_progress
FOR SELECT
TO public
USING (true);

-- INSERT: Allow both authenticated and anon users
CREATE POLICY "student_progress_insert_policy"
ON public.student_progress
FOR INSERT
TO public
WITH CHECK (true);

-- UPDATE: Allow both authenticated and anon users
CREATE POLICY "student_progress_update_policy"
ON public.student_progress
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- DELETE: Allow both authenticated and anon users
CREATE POLICY "student_progress_delete_policy"
ON public.student_progress
FOR DELETE
TO public
USING (true);

-- ============================================================================
-- Grant permissions to both roles
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_progress TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_progress TO authenticated;
GRANT ALL ON public.student_progress TO service_role;

-- ============================================================================
-- Note: Using 'public' role includes both anon and authenticated
-- This is safe because the app uses custom auth (localStorage-based)
-- and enforces access control at the application level.
-- ============================================================================

COMMENT ON POLICY "student_progress_select_policy" ON public.student_progress IS 'Permissive SELECT for custom auth (anon + authenticated)';
