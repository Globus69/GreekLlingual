-- ============================================================
-- Admin-Telefonnummer: KOMPLETTE Migration (alles in einem)
-- ============================================================
-- Datum: 2026-02-12
-- Zweck: Spalte anlegen + Admin-Nummer setzen + Constraint hinzufügen
-- ============================================================

-- ── SCHRITT 1: Prüfe ob Spalte existiert ──────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='users'
          AND column_name='contact_phone'
    ) THEN
        RAISE NOTICE '✅ Spalte contact_phone existiert bereits';
    ELSE
        RAISE NOTICE '➕ Spalte contact_phone wird angelegt...';

        -- Spalte anlegen
        ALTER TABLE public.users
        ADD COLUMN contact_phone TEXT;

        RAISE NOTICE '✅ Spalte contact_phone erfolgreich angelegt';
    END IF;
END $$;

-- ── SCHRITT 2: Zeige aktuelle Telefonnummern ──────────────
DO $$
DECLARE
    rec RECORD;
    found_any BOOLEAN := false;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AKTUELLE TELEFONNUMMERN:';
    RAISE NOTICE '========================================';

    FOR rec IN (
        SELECT id, name, role, contact_phone
        FROM public.users
        WHERE contact_phone IS NOT NULL
        ORDER BY name
    ) LOOP
        found_any := true;
        RAISE NOTICE 'User: "%" (%) | Rolle: % | Nummer: "%"',
            rec.name, rec.id, rec.role, rec.contact_phone;
    END LOOP;

    IF NOT found_any THEN
        RAISE NOTICE '(keine Telefonnummern vorhanden)';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- ── SCHRITT 3: Bereinige ungültige Nummern ────────────────
DO $$
DECLARE
    invalid_count INT := 0;
    rec RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRÜFE AUF UNGÜLTIGE TELEFONNUMMERN...';
    RAISE NOTICE '========================================';

    -- Finde ungültige Nummern
    FOR rec IN (
        SELECT id, name, contact_phone
        FROM public.users
        WHERE contact_phone IS NOT NULL
          AND contact_phone !~ '^\\+[1-9]\\d{1,14}$'
    ) LOOP
        RAISE NOTICE 'Ungültig: User "%" hat "%"', rec.name, rec.contact_phone;
        invalid_count := invalid_count + 1;
    END LOOP;

    IF invalid_count > 0 THEN
        RAISE NOTICE 'Bereinige % ungültige Nummer(n)...', invalid_count;

        -- Setze alle ungültigen auf NULL
        UPDATE public.users
        SET contact_phone = NULL
        WHERE contact_phone IS NOT NULL
          AND contact_phone !~ '^\\+[1-9]\\d{1,14}$';

        RAISE NOTICE '✅ Bereinigung abgeschlossen';
    ELSE
        RAISE NOTICE '✅ Keine ungültigen Nummern gefunden';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- ── SCHRITT 4: Setze Admin-Telefonnummer ──────────────────
DO $$
DECLARE
    admin_exists BOOLEAN;
    current_phone TEXT;
BEGIN
    -- Prüfe ob Admin existiert
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE role = 'admin' AND name = 'Admin'
    ) INTO admin_exists;

    IF NOT admin_exists THEN
        RAISE NOTICE '⚠️ WARNUNG: Admin-User nicht gefunden (name="Admin", role="admin")';
        RAISE NOTICE 'Bitte Admin manuell anlegen oder Telefonnummer später setzen';
    ELSE
        -- Hole aktuelle Nummer
        SELECT contact_phone INTO current_phone
        FROM public.users
        WHERE role = 'admin' AND name = 'Admin';

        IF current_phone = '+35796120069' THEN
            RAISE NOTICE '✅ Admin hat bereits korrekte Telefonnummer: %', current_phone;
        ELSE
            -- Setze neue Nummer
            UPDATE public.users
            SET contact_phone = '+35796120069'
            WHERE role = 'admin' AND name = 'Admin';

            RAISE NOTICE '✅ Admin-Telefonnummer gesetzt: +35796120069';
            IF current_phone IS NOT NULL THEN
                RAISE NOTICE '   (vorher: %)', current_phone;
            END IF;
        END IF;
    END IF;
END $$;

-- ── SCHRITT 5: Füge CHECK Constraint hinzu ────────────────
DO $$
BEGIN
    -- Entferne altes Constraint falls vorhanden
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_contact_phone_check'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_contact_phone_check;
        RAISE NOTICE '🗑️ Altes Constraint entfernt';
    END IF;

    -- Füge neues Constraint hinzu
    ALTER TABLE public.users
    ADD CONSTRAINT users_contact_phone_check
    CHECK (
        contact_phone IS NULL
        OR contact_phone ~ '^\\+[1-9]\\d{1,14}$'
    );

    RAISE NOTICE '✅ CHECK Constraint erfolgreich hinzugefügt';
    RAISE NOTICE '   Format: E.164 (+[Ländercode][Nummer])';

EXCEPTION
    WHEN check_violation THEN
        RAISE EXCEPTION '❌ FEHLER: Es gibt noch ungültige Telefonnummern! Bitte Schritt 3 prüfen.';
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ FEHLER beim Hinzufügen des Constraints: %', SQLERRM;
END $$;

-- ── SCHRITT 6: Erstelle RPC-Funktion ──────────────────────
CREATE OR REPLACE FUNCTION get_admin_contact()
RETURNS TABLE (
    admin_id UUID,
    admin_name TEXT,
    admin_email TEXT,
    admin_phone TEXT,
    admin_whatsapp TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        id,
        name,
        email,
        contact_phone,
        whatsapp
    FROM public.users
    WHERE role = 'admin'
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_contact() TO anon, authenticated;

RAISE NOTICE '✅ RPC-Funktion get_admin_contact() erstellt';

-- ── SCHRITT 7: Erstelle Index (optional) ──────────────────
CREATE INDEX IF NOT EXISTS idx_users_contact_phone
ON public.users(contact_phone)
WHERE contact_phone IS NOT NULL;

RAISE NOTICE '✅ Index auf contact_phone erstellt';

-- ── SCHRITT 8: Finale Verifizierung ───────────────────────
DO $$
DECLARE
    total_phones INT;
    valid_phones INT;
    invalid_phones INT;
    admin_phone TEXT;
BEGIN
    -- Statistik
    SELECT COUNT(*) INTO total_phones
    FROM public.users WHERE contact_phone IS NOT NULL;

    SELECT COUNT(*) INTO valid_phones
    FROM public.users
    WHERE contact_phone IS NOT NULL
      AND contact_phone ~ '^\\+[1-9]\\d{1,14}$';

    SELECT COUNT(*) INTO invalid_phones
    FROM public.users
    WHERE contact_phone IS NOT NULL
      AND contact_phone !~ '^\\+[1-9]\\d{1,14}$';

    -- Admin-Nummer
    SELECT contact_phone INTO admin_phone
    FROM public.users
    WHERE role = 'admin' AND name = 'Admin';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINALE STATISTIK:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Telefonnummern gesamt: %', total_phones;
    RAISE NOTICE '  ✅ Gültige (E.164): %', valid_phones;
    RAISE NOTICE '  ❌ Ungültige: %', invalid_phones;
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Admin-Telefonnummer: %', COALESCE(admin_phone, '(nicht gesetzt)');
    RAISE NOTICE '========================================';

    IF invalid_phones > 0 THEN
        RAISE WARNING '⚠️ WARNUNG: Es gibt noch % ungültige Telefonnummer(n)!', invalid_phones;
    ELSE
        RAISE NOTICE '✅✅✅ MIGRATION ERFOLGREICH ABGESCHLOSSEN ✅✅✅';
    END IF;
END $$;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- Neue Spalte: contact_phone TEXT (nullable, E.164 Format)
-- Admin-Telefonnummer: +35796120069
-- RPC-Funktion: get_admin_contact()
-- CHECK Constraint: E.164 Format
-- Index: idx_users_contact_phone
--
-- E.164 Format-Beispiele:
-- ✅ +35796120069 (Zypern)
-- ✅ +491701234567 (Deutschland)
-- ✅ +79161234567 (Russland)
-- ✅ +302101234567 (Griechenland)
-- ❌ 35796120069 (fehlendes +)
-- ❌ +0049... (führende 0 nach +)
-- ============================================================
