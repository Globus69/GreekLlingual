-- ============================================================
-- Cleanup: Alle Versionen von verify_user_4digit_pin löschen
-- ============================================================
-- Führe diese SQL ZUERST aus, bevor du andere SQL-Dateien ausführst
-- ============================================================

-- Lösche ALLE möglichen Überladungen der Funktion
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, INET, TEXT);

-- Prüfe ob die Funktion gelöscht wurde
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'verify_user_4digit_pin'
    ) THEN
        RAISE NOTICE 'WARNUNG: verify_user_4digit_pin existiert noch!';
    ELSE
        RAISE NOTICE 'SUCCESS: verify_user_4digit_pin wurde gelöscht';
    END IF;
END $$;

-- ============================================================
-- ✅ Cleanup abgeschlossen
-- ============================================================
-- Jetzt kannst du die anderen SQL-Dateien ausführen:
-- 1. extend_users_for_4digit_pin.sql (erstellt Testnutzer)
-- 2. create_honeypot_pins_fixed.sql (erstellt Honeypot-System)
-- ============================================================
