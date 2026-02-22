-- ============================================================================
-- Migration 097: Fix Practice Attempts Foreign Key Constraint
-- ============================================================================
-- Purpose: The practice_attempts table incorrectly referenced auth.users,
-- while the application uses public.users for PIN-based authentication.
-- This migration re-points the constraint to public.users(id).
-- ============================================================================

-- Remove existing constraints pointing to auth.users
ALTER TABLE practice_attempts DROP CONSTRAINT IF EXISTS fk_practice_user;
ALTER TABLE practice_attempts DROP CONSTRAINT IF EXISTS practice_attempts_user_id_fkey;

-- Add correct constraint pointing to public.users
ALTER TABLE practice_attempts 
ADD CONSTRAINT practice_attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT practice_attempts_user_id_fkey ON practice_attempts IS 
'Correctly references the application users table (public.users) for PIN-based auth';

-- Verify current constraints (for log)
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'practice_attempts'::regclass;
