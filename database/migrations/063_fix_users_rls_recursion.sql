-- ============================================================
-- Fix RLS Infinite Recursion in users table
-- ============================================================
-- Problem: The "Admin full access" policy creates infinite recursion
-- because it queries the users table while evaluating access to the users table.
--
-- Solution: Use auth.jwt() to check role instead of querying users table
-- ============================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admin full access" ON public.users;

-- Create a new policy that doesn't cause recursion
-- This policy checks the JWT claim 'user_role' instead of querying the users table
CREATE POLICY "Admin full access" ON public.users
    FOR ALL
    USING (
        (auth.jwt() ->> 'user_role') = 'admin'
        OR
        -- Fallback: allow if user is accessing their own record
        auth.uid() = id
    );

-- Also update the "Students read own data" policy to be more explicit
DROP POLICY IF EXISTS "Students read own data" ON public.users;

CREATE POLICY "Students read own data" ON public.users
    FOR SELECT
    USING (
        auth.uid() = id
        OR
        (auth.jwt() ->> 'user_role') = 'admin'
    );

-- Grant SELECT to authenticated users (needed for stats queries)
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- ── FERTIG ──────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════';
    RAISE NOTICE '✅ RLS Policies fixed!';
    RAISE NOTICE '   Removed infinite recursion in Admin policy';
    RAISE NOTICE '   Users can now query their own level data';
    RAISE NOTICE '══════════════════════════════════════';
END $$;
