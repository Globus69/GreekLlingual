-- ============================================================
-- PIN-Login Diagnose
-- ============================================================
-- Diese Abfragen helfen beim Debuggen von PIN-Login-Problemen
-- ============================================================

-- ── 1. Prüfe Test-User ─────────────────────────────────────
SELECT
    '1️⃣ Test-User Check' as diagnose_schritt,
    COUNT(*) as gefunden,
    CASE
        WHEN COUNT(*) = 0 THEN '❌ KEINE Test-User! Führe fix_test_users_complete.sql aus'
        WHEN COUNT(*) < 5 THEN '⚠️ Nur ' || COUNT(*) || '/5 Test-User vorhanden'
        ELSE '✅ Alle 5 Test-User vorhanden'
    END as status
FROM public.users
WHERE pin_4digit IN ('3741', '8192', '5624', '7358', '9103');

-- ── 2. Zeige alle Test-User Details ────────────────────────
SELECT
    '2️⃣ Test-User Details' as diagnose_schritt,
    name,
    pin_4digit,
    email,
    level,
    difficulty,
    role,
    performance_index,
    CASE WHEN pin_4digit IS NULL THEN '❌ Kein PIN' ELSE '✅ PIN vorhanden' END as pin_status
FROM public.users
WHERE pin_4digit IN ('3741', '8192', '5624', '7358', '9103')
   OR name ILIKE '%meier%'
   OR name ILIKE '%schmidt%'
ORDER BY pin_4digit;

-- ── 3. Prüfe RPC-Funktion ──────────────────────────────────
SELECT
    '3️⃣ RPC-Funktion Check' as diagnose_schritt,
    CASE
        WHEN COUNT(*) = 0 THEN '❌ verify_user_4digit_pin fehlt! Führe create_honeypot_pins_fixed.sql aus'
        ELSE '✅ RPC-Funktion existiert'
    END as status,
    STRING_AGG(pg_get_function_arguments(p.oid), ' | ') as parameter
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'verify_user_4digit_pin';

-- ── 4. Prüfe Honeypot-Tabelle ──────────────────────────────
SELECT
    '4️⃣ Honeypot-PINs Check' as diagnose_schritt,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'honeypot_pins')
        THEN '✅ Honeypot-Tabelle existiert'
        ELSE '❌ Honeypot-Tabelle fehlt! Führe create_honeypot_pins_fixed.sql aus'
    END as status;

SELECT
    '9999 ist Honeypot?' as frage,
    CASE
        WHEN EXISTS (SELECT 1 FROM public.honeypot_pins WHERE pin = '9999')
        THEN '✅ Ja, 9999 ist als Honeypot registriert'
        ELSE '❌ Nein, 9999 ist KEIN Honeypot (sollte aber einer sein)'
    END as antwort
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'honeypot_pins');

-- ── 5. Test RPC-Aufruf für PIN 3741 ────────────────────────
-- WICHTIG: Diese Abfrage funktioniert nur wenn verify_user_4digit_pin existiert
DO $$
DECLARE
    result RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'verify_user_4digit_pin'
    ) THEN
        RAISE NOTICE '5️⃣ Test RPC-Aufruf für PIN 3741...';

        -- Test-Aufruf
        SELECT * INTO result
        FROM verify_user_4digit_pin('3741', NULL, 'Test-Browser');

        IF result.user_id IS NOT NULL THEN
            RAISE NOTICE '✅ PIN 3741 funktioniert! User: %', result.user_name;
        ELSIF result.error IS NOT NULL THEN
            RAISE WARNING '❌ PIN 3741 gibt Fehler: %', result.error;
        ELSE
            RAISE WARNING '❌ PIN 3741 gibt keine Daten zurück';
        END IF;
    ELSE
        RAISE WARNING '⚠️ RPC-Funktion nicht verfügbar - überspringe Test';
    END IF;
END $$;

-- ── 6. Prüfe pin_4digit Spalte ─────────────────────────────
SELECT
    '6️⃣ Spalten-Check' as diagnose_schritt,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'pin_4digit'
        )
        THEN '✅ Spalte pin_4digit existiert'
        ELSE '❌ Spalte pin_4digit fehlt! Führe fix_test_users_complete.sql aus'
    END as status;

-- ============================================================
-- 📋 Zusammenfassung
-- ============================================================
-- Falls Fehler auftreten, führe in dieser Reihenfolge aus:
-- 1. fix_test_users_complete.sql (Erstellt pin_4digit + Test-User)
-- 2. cleanup_verify_function.sql (Löscht alte RPC-Funktionen)
-- 3. create_honeypot_pins_fixed.sql (Erstellt RPC + Honeypots)
-- 4. Führe diese Diagnose erneut aus
-- ============================================================
