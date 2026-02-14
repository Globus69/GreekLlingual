-- ============================================================
-- QUICK FIX: Löscht ALLE benutzerdefinierten Funktionen
-- ============================================================
-- Führe diese SQL aus, wenn du immer noch Fehler bekommst
-- wie "cannot change return type of existing function"
-- ============================================================
-- RISIKO: Niedrig (nur Funktionen, keine Daten)
-- AUFWAND: 10 Sekunden
-- ============================================================

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Finde und lösche ALLE benutzerdefinierten Funktionen in public Schema
    FOR func_record IN
        SELECT
            n.nspname as schema,
            p.proname as func_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'  -- Nur Functions, keine Procedures
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
                      func_record.schema,
                      func_record.func_name,
                      func_record.args);
        RAISE NOTICE 'Gelöscht: %.%(%)',
                     func_record.schema,
                     func_record.func_name,
                     func_record.args;
    END LOOP;

    RAISE NOTICE '✅ SUCCESS: Alle Funktionen gelöscht';
    RAISE NOTICE '✅ NÄCHSTER SCHRITT: Führe MASTER_MIGRATION_ALL_IN_ONE.sql aus';
END $$;

-- ============================================================
-- ✅ QUICK FIX ABGESCHLOSSEN
-- ============================================================
