-- ============================================================
-- PRE-CLEANUP: Führe diese SQL ZUERST aus!
-- ============================================================
-- Diese Datei löscht ALLE alten Funktionen und bereitet eine
-- saubere Basis für die Master-Migration.
-- ============================================================
-- DATUM: 2026-02-14
-- AUFWAND: 30 Sekunden
-- RISIKO: Niedrig (nur Funktionen, keine Daten)
-- ============================================================

-- ========================================
-- SCHRITT 1: Alle verify_user_pin Versionen löschen
-- ========================================

-- 6-stelliger PIN (Admin-Login)
DROP FUNCTION IF EXISTS verify_user_pin(text, text) CASCADE;
DROP FUNCTION IF EXISTS verify_user_pin(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS verify_user_pin(text, text, inet, text) CASCADE;

-- 4-stelliger PIN (Student-Login)
DROP FUNCTION IF EXISTS verify_user_4digit_pin(text) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(text, text) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS verify_user_4digit_pin(text, inet, text) CASCADE;

-- ========================================
-- SCHRITT 2: Alle Student-Management Funktionen löschen
-- ========================================

DROP FUNCTION IF EXISTS create_student(text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS create_student(text, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS update_student(uuid, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS update_student(uuid, text, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS delete_student(uuid) CASCADE;
DROP FUNCTION IF EXISTS list_students() CASCADE;

-- ========================================
-- SCHRITT 3: Admin-Login Funktionen löschen
-- ========================================

DROP FUNCTION IF EXISTS record_admin_failed_login_attempt(text) CASCADE;
DROP FUNCTION IF EXISTS record_admin_failed_login_attempt(text, inet) CASCADE;
DROP FUNCTION IF EXISTS record_admin_failed_login_attempt(text, inet, text) CASCADE;

-- ========================================
-- SCHRITT 4: Verifikation
-- ========================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Zähle verbleibende Funktionen
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
          'verify_user_pin',
          'verify_user_4digit_pin',
          'create_student',
          'update_student',
          'delete_student',
          'list_students',
          'record_admin_failed_login_attempt'
      );

    IF v_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: Alle alten Funktionen wurden gelöscht (%)', v_count;
        RAISE NOTICE '✅ NÄCHSTER SCHRITT: Führe MASTER_MIGRATION_ALL_IN_ONE.sql aus';
    ELSE
        RAISE NOTICE '⚠️ WARNUNG: % Funktionen existieren noch', v_count;
        RAISE NOTICE 'ℹ️ Liste der verbleibenden Funktionen:';

        -- Liste verbleibende Funktionen
        FOR v_count IN
            SELECT p.proname
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
              AND p.proname IN (
                  'verify_user_pin',
                  'verify_user_4digit_pin',
                  'create_student',
                  'update_student',
                  'delete_student',
                  'list_students',
                  'record_admin_failed_login_attempt'
              )
        LOOP
            RAISE NOTICE '  - %', v_count;
        END LOOP;
    END IF;
END $$;

-- ============================================================
-- ✅ PRE-CLEANUP ABGESCHLOSSEN
-- ============================================================
-- Wenn oben "SUCCESS" steht, kannst du jetzt fortfahren:
--
-- NÄCHSTER SCHRITT:
-- Öffne database/MASTER_MIGRATION_ALL_IN_ONE.sql
-- Kopiere den KOMPLETTEN Inhalt
-- Führe im Supabase SQL Editor aus
-- ============================================================
