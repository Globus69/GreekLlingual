-- Migration 059 FIX: Add missing GRANT EXECUTE permissions
-- Date: 2026-02-15
-- Purpose: Fix 404 error for session tracking RPC functions
-- Issue: start_learning_session and other functions exist but are not accessible via PostgREST

-- ============================================================================
-- GRANT EXECUTE Permissions (Missing from original migration)
-- ============================================================================

-- Function: start_learning_session
GRANT EXECUTE ON FUNCTION public.start_learning_session(UUID, TEXT)
  TO authenticated, anon;

-- Function: end_learning_session
GRANT EXECUTE ON FUNCTION public.end_learning_session(UUID, INTEGER, INTEGER)
  TO authenticated, anon;

-- Function: get_session_stats
GRANT EXECUTE ON FUNCTION public.get_session_stats(UUID, INTEGER)
  TO authenticated, anon;

-- Function: get_recent_sessions
GRANT EXECUTE ON FUNCTION public.get_recent_sessions(UUID, INTEGER)
  TO authenticated, anon;

-- ============================================================================
-- Reload PostgREST Schema Cache (CRITICAL!)
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- 1. Check if all functions exist
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname IN (
    'start_learning_session',
    'end_learning_session',
    'get_session_stats',
    'get_recent_sessions'
  )
  AND pronamespace = 'public'::regnamespace;

  IF v_count = 4 THEN
    RAISE NOTICE '✅ All 4 functions found in database';
  ELSE
    RAISE WARNING '⚠️  Only % of 4 functions found. Run migration 059 first!', v_count;
  END IF;
END $$;

-- 2. Check if authenticated role has EXECUTE permission
DO $$
DECLARE
  v_start_session BOOLEAN;
  v_end_session BOOLEAN;
BEGIN
  -- Check start_learning_session
  SELECT has_function_privilege('authenticated', 'start_learning_session(uuid, text)', 'EXECUTE')
  INTO v_start_session;

  -- Check end_learning_session
  SELECT has_function_privilege('authenticated', 'end_learning_session(uuid, integer, integer)', 'EXECUTE')
  INTO v_end_session;

  IF v_start_session AND v_end_session THEN
    RAISE NOTICE '✅ Permissions granted successfully';
    RAISE NOTICE '   - authenticated role can execute start_learning_session';
    RAISE NOTICE '   - authenticated role can execute end_learning_session';
  ELSE
    RAISE WARNING '⚠️  Permission check failed:';
    RAISE WARNING '   - start_learning_session: %', v_start_session;
    RAISE WARNING '   - end_learning_session: %', v_end_session;
  END IF;
END $$;

-- 3. List all session tracking functions with permissions
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute
FROM pg_proc p
WHERE p.proname LIKE '%learning_session%'
  AND p.pronamespace = 'public'::regnamespace
ORDER BY p.proname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration 059 FIX completed successfully';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Check the verification output above';
  RAISE NOTICE '   2. Test in Browser Console:';
  RAISE NOTICE '      const { data, error } = await supabase.rpc(''start_learning_session'', {';
  RAISE NOTICE '        p_student_id: ''YOUR_USER_ID'',';
  RAISE NOTICE '        p_session_type: ''vocabulary''';
  RAISE NOTICE '      });';
  RAISE NOTICE '';
  RAISE NOTICE '   3. Expected Result: data = UUID, error = null';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 The 404 error should now be resolved!';
  RAISE NOTICE '';
END $$;
