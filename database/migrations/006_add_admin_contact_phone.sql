-- ============================================================
-- Admin-Telefonnummer für Benachrichtigungen
-- ============================================================
-- Datum: 2026-02-12
-- Zweck: Telefonnummer in Datenbank speichern für WhatsApp/Telegram
-- ============================================================

-- ── 1. Neue Spalte contact_phone hinzufügen ────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='users'
          AND column_name='contact_phone'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN contact_phone TEXT;
    END IF;
END $$;

-- ── 2. Bestehende ungültige Telefonnummern bereinigen ─────
-- Prüfe und korrigiere alle contact_phone Einträge
DO $$
DECLARE
    rec RECORD;
    invalid_count INT := 0;
BEGIN
    -- Finde alle ungültigen Telefonnummern
    FOR rec IN (
        SELECT id, name, contact_phone
        FROM public.users
        WHERE contact_phone IS NOT NULL
          AND contact_phone !~ '^\\+[1-9]\\d{1,14}$'
    ) LOOP
        RAISE NOTICE 'Ungültige Telefonnummer gefunden: User "%" hat "%"',
            rec.name, rec.contact_phone;

        -- Setze ungültige Nummern auf NULL
        UPDATE public.users
        SET contact_phone = NULL
        WHERE id = rec.id;

        invalid_count := invalid_count + 1;
    END LOOP;

    IF invalid_count > 0 THEN
        RAISE NOTICE '✅ % ungültige Telefonnummer(n) auf NULL gesetzt', invalid_count;
    ELSE
        RAISE NOTICE '✅ Keine ungültigen Telefonnummern gefunden';
    END IF;
END $$;

-- ── 3. Admin-User mit Telefonnummer aktualisieren ──────────
UPDATE public.users
SET contact_phone = '+35796120069'
WHERE role = 'admin' AND name = 'Admin';

-- ── 4. RPC: Admin-Kontakt abrufen ──────────────────────────
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

-- ── 5. CHECK-Constraint für Telefonnummer-Format ───────────
-- Format: +[Ländercode][Nummer] (z.B. +35796120069)
-- Regex: ^\\+[1-9]\\d{1,14}$ (E.164 Format)
DO $$
BEGIN
    -- Entferne altes Constraint falls vorhanden
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_contact_phone_check;

    -- Füge neues Constraint hinzu (nur NULL oder gültiges E.164 Format)
    ALTER TABLE public.users
    ADD CONSTRAINT users_contact_phone_check
    CHECK (
        contact_phone IS NULL
        OR contact_phone ~ '^\\+[1-9]\\d{1,14}$'
    );

    RAISE NOTICE '✅ CHECK Constraint erfolgreich hinzugefügt';
EXCEPTION
    WHEN check_violation THEN
        RAISE EXCEPTION 'FEHLER: Es existieren noch ungültige Telefonnummern. Bitte Schritt 2 prüfen!';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FEHLER beim Hinzufügen des Constraints: %', SQLERRM;
END $$;

-- ── 6. Index für schnelle Abfragen (optional) ──────────────
CREATE INDEX IF NOT EXISTS idx_users_contact_phone
ON public.users(contact_phone)
WHERE contact_phone IS NOT NULL;

-- ── 7. Verifizierung ───────────────────────────────────────
DO $$
DECLARE
    admin_phone TEXT;
BEGIN
    -- Prüfe ob Admin-Telefonnummer gesetzt wurde
    SELECT contact_phone INTO admin_phone
    FROM public.users
    WHERE role = 'admin' AND name = 'Admin';

    IF admin_phone IS NULL THEN
        RAISE WARNING 'Admin-Telefonnummer ist NULL - bitte manuell setzen!';
    ELSIF admin_phone = '+35796120069' THEN
        RAISE NOTICE '✅ Admin-Telefonnummer korrekt gesetzt: %', admin_phone;
    ELSE
        RAISE NOTICE 'ℹ️ Admin hat andere Telefonnummer: %', admin_phone;
    END IF;
END $$;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- Neue Spalte: contact_phone TEXT (nullable, E.164 Format)
-- Ungültige Telefonnummern wurden bereinigt
-- Admin-User: contact_phone = '+35796120069'
-- RPC-Funktion: get_admin_contact() → Gibt Admin-Kontaktdaten zurück
-- CHECK-Constraint: Telefonnummer muss E.164 Format haben (+35796120069)
--
-- E.164 Format-Beispiele:
-- ✅ +35796120069 (Zypern)
-- ✅ +491701234567 (Deutschland)
-- ✅ +79161234567 (Russland)
-- ✅ +302101234567 (Griechenland)
-- ❌ 35796120069 (fehlendes +)
-- ❌ +0049... (führende 0 nach +)
-- ❌ 0049... (kein +)
-- ============================================================
