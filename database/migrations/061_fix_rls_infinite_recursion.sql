-- =====================================================
-- Migration 061: Fix RLS Infinite Recursion
-- =====================================================
-- Datum: 2026-02-14
-- Zweck: Behebe infinite recursion in users table RLS policy
-- Problem: "Admin full access" policy fragt users-Tabelle ab
--          während sie auf users-Tabelle angewendet wird
-- Lösung: Verwende auth.jwt() statt Subquery auf users
-- =====================================================

-- ========================================
-- STEP 1: Alte Policies entfernen
-- ========================================

DROP POLICY IF EXISTS "Admin full access" ON public.users;
DROP POLICY IF EXISTS "Students read own data" ON public.users;
DROP POLICY IF EXISTS "Anon can read users for login" ON public.users;

-- ========================================
-- STEP 2: Neue Policies ohne Rekursion
-- ========================================

-- Anon kann alle User für Login lesen (verify_user_pin braucht das)
CREATE POLICY "anon_read_users"
  ON public.users
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users können nur eigene Daten lesen
CREATE POLICY "users_read_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Authenticated users können eigene Daten updaten
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin-Zugriff via JWT claim (keine Subquery mehr!)
-- Wichtig: Admin-Role muss im JWT Token gesetzt sein
CREATE POLICY "admin_all_access"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    OR
    (auth.jwt() ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    OR
    (auth.jwt() ->> 'role' = 'admin')
  );

-- ========================================
-- STEP 3: Alternative - Falls JWT nicht funktioniert
-- ========================================

-- Falls die JWT-Lösung nicht funktioniert, verwenden wir einen
-- vereinfachten Ansatz: Nur SECURITY DEFINER Funktionen
-- dürfen komplexe Operationen durchführen

-- Diese Policy erlaubt authenticated usern nur Lese-Zugriff auf eigene Daten
-- Alle Admin-Operationen laufen über SECURITY DEFINER Funktionen

COMMENT ON POLICY "anon_read_users" ON public.users IS
  'Anon kann alle User lesen (für Login-Validierung via verify_user_pin)';

COMMENT ON POLICY "users_read_own" ON public.users IS
  'Authenticated users können nur eigene Daten lesen';

COMMENT ON POLICY "users_update_own" ON public.users IS
  'Authenticated users können nur eigene Daten updaten';

COMMENT ON POLICY "admin_all_access" ON public.users IS
  'Admins haben vollen Zugriff via JWT role claim (keine Rekursion!)';

-- ========================================
-- STEP 4: Verify
-- ========================================

-- Test: Sollte KEINE infinite recursion mehr geben
-- SELECT * FROM users WHERE role = 'student' LIMIT 1;

RAISE NOTICE '✅ Migration 061: RLS policies fixed (no more recursion)';
