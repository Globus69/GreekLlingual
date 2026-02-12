-- ============================================================
-- DIAGNOSE: Ungültige Telefonnummern finden und beheben
-- ============================================================
-- Datum: 2026-02-12
-- Zweck: Findet ALLE ungültigen Telefonnummern und setzt sie auf NULL
-- ============================================================

-- ── SCHRITT 1: Diagnostiziere das Problem ─────────────────

-- Zeige ALLE contact_phone Einträge (auch NULL)
SELECT
    id,
    name,
    role,
    contact_phone,
    CASE
        WHEN contact_phone IS NULL THEN '✅ NULL (OK)'
        WHEN contact_phone ~ '^\\+[1-9]\\d{1,14}$' THEN '✅ Gültig (E.164)'
        ELSE '❌ UNGÜLTIG'
    END as status
FROM public.users
ORDER BY
    CASE
        WHEN contact_phone IS NULL THEN 3
        WHEN contact_phone ~ '^\\+[1-9]\\d{1,14}$' THEN 2
        ELSE 1
    END,
    name;

-- ── SCHRITT 2: Zähle ungültige Einträge ───────────────────

DO $$
DECLARE
    invalid_count INT;
    total_count INT;
    null_count INT;
    valid_count INT;
BEGIN
    -- Alle Telefonnummern
    SELECT COUNT(*) INTO total_count
    FROM public.users
    WHERE contact_phone IS NOT NULL;

    -- NULL-Werte
    SELECT COUNT(*) INTO null_count
    FROM public.users
    WHERE contact_phone IS NULL;

    -- Gültige E.164
    SELECT COUNT(*) INTO valid_count
    FROM public.users
    WHERE contact_phone IS NOT NULL
      AND contact_phone ~ '^\\+[1-9]\\d{1,14}$';

    -- Ungültige
    SELECT COUNT(*) INTO invalid_count
    FROM public.users
    WHERE contact_phone IS NOT NULL
      AND contact_phone !~ '^\\+[1-9]\\d{1,14}$';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'TELEFONNUMMERN-STATISTIK:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Users mit Telefonnummer: %', total_count;
    RAISE NOTICE '  ✅ Gültige E.164-Nummern: %', valid_count;
    RAISE NOTICE '  ❌ UNGÜLTIGE Nummern: %', invalid_count;
    RAISE NOTICE '  ⚪ NULL (keine Nummer): %', null_count;
    RAISE NOTICE '========================================';

    IF invalid_count > 0 THEN
        RAISE NOTICE '⚠️ WARNUNG: % ungültige Telefonnummer(n) gefunden!', invalid_count;
    ELSE
        RAISE NOTICE '✅ Alle Telefonnummern sind gültig oder NULL';
    END IF;
END $$;

-- ── SCHRITT 3: Zeige ungültige Nummern im Detail ──────────

DO $$
DECLARE
    rec RECORD;
    found_invalid BOOLEAN := false;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'UNGÜLTIGE TELEFONNUMMERN (DETAIL):';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT id, name, role, contact_phone
        FROM public.users
        WHERE contact_phone IS NOT NULL
          AND contact_phone !~ '^\\+[1-9]\\d{1,14}$'
        ORDER BY name
    ) LOOP
        found_invalid := true;
        RAISE NOTICE 'User: "%" (%) | Rolle: % | Nummer: "%"',
            rec.name, rec.id, rec.role, rec.contact_phone;
    END LOOP;

    IF NOT found_invalid THEN
        RAISE NOTICE '(keine ungültigen Nummern gefunden)';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- ── SCHRITT 4: BEHEBE ALLE ungültigen Nummern ─────────────

DO $$
DECLARE
    fixed_count INT := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STARTE BEREINIGUNG...';
    RAISE NOTICE '========================================';

    -- Setze ALLE ungültigen Nummern auf NULL
    WITH updated AS (
        UPDATE public.users
        SET contact_phone = NULL
        WHERE contact_phone IS NOT NULL
          AND contact_phone !~ '^\\+[1-9]\\d{1,14}$'
        RETURNING id, name, contact_phone
    )
    SELECT COUNT(*) INTO fixed_count FROM updated;

    IF fixed_count > 0 THEN
        RAISE NOTICE '✅ % ungültige Telefonnummer(n) auf NULL gesetzt', fixed_count;
    ELSE
        RAISE NOTICE '✅ Keine Bereinigung nötig';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- ── SCHRITT 5: Verifizierung nach Bereinigung ─────────────

DO $$
DECLARE
    remaining_invalid INT;
BEGIN
    SELECT COUNT(*) INTO remaining_invalid
    FROM public.users
    WHERE contact_phone IS NOT NULL
      AND contact_phone !~ '^\\+[1-9]\\d{1,14}$';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFIZIERUNG:';
    RAISE NOTICE '========================================';

    IF remaining_invalid > 0 THEN
        RAISE EXCEPTION '❌ FEHLER: Es existieren noch % ungültige Telefonnummer(n)!', remaining_invalid;
    ELSE
        RAISE NOTICE '✅ ERFOLG: Alle Telefonnummern sind jetzt gültig oder NULL';
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- ── SCHRITT 6: Setze Admin-Telefonnummer ──────────────────

UPDATE public.users
SET contact_phone = '+35796120069'
WHERE role = 'admin' AND name = 'Admin';

-- ── SCHRITT 7: Finale Statistik ───────────────────────────

SELECT
    '✅ BEREINIGUNG ABGESCHLOSSEN' as status,
    COUNT(*) FILTER (WHERE contact_phone IS NOT NULL AND contact_phone ~ '^\\+[1-9]\\d{1,14}$') as gueltige_nummern,
    COUNT(*) FILTER (WHERE contact_phone IS NULL) as null_eintraege,
    COUNT(*) FILTER (WHERE contact_phone IS NOT NULL AND contact_phone !~ '^\\+[1-9]\\d{1,14}$') as ungueltige_nummern
FROM public.users;

-- ============================================================
-- ✅ Diagnose abgeschlossen
-- ============================================================
-- NÄCHSTER SCHRITT:
-- Wenn "ungueltige_nummern" = 0, dann führe aus:
-- → supabase/add_admin_contact_phone.sql (nur den Constraint-Teil)
--
-- ODER führe manuell aus:
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_contact_phone_check;
-- ALTER TABLE public.users ADD CONSTRAINT users_contact_phone_check
-- CHECK (contact_phone IS NULL OR contact_phone ~ '^\\+[1-9]\\d{1,14}$');
-- ============================================================
