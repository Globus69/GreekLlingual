-- ============================================================
-- Duplikate PINs bereinigen VOR UNIQUE Constraint
-- ============================================================
-- Datum: 2026-02-12
-- Zweck: Bestehende Duplikate in pin_4digit bereinigen
-- Problem: PIN "9103" und evtl. andere existieren mehrfach
-- ============================================================

-- ── 1. Duplikate identifizieren und anzeigen ──────────────
DO $$
DECLARE
    duplicate_count INT;
    rec RECORD;
BEGIN
    -- Zähle Duplikate
    SELECT COUNT(*)
    INTO duplicate_count
    FROM (
        SELECT pin_4digit, COUNT(*) as cnt
        FROM public.users
        WHERE pin_4digit IS NOT NULL
        GROUP BY pin_4digit
        HAVING COUNT(*) > 1
    ) duplicates;

    RAISE NOTICE 'Gefundene doppelte PINs: %', duplicate_count;

    -- Liste alle Duplikate auf
    FOR rec IN (
        SELECT pin_4digit, COUNT(*) as cnt, string_agg(id::TEXT, ', ') as user_ids
        FROM public.users
        WHERE pin_4digit IS NOT NULL
        GROUP BY pin_4digit
        HAVING COUNT(*) > 1
        ORDER BY cnt DESC
    ) LOOP
        RAISE NOTICE 'PIN % existiert %x (User-IDs: %)', rec.pin_4digit, rec.cnt, rec.user_ids;
    END LOOP;
END $$;

-- ── 2. Hilfsfunktion: Sichere PIN generieren ──────────────
CREATE OR REPLACE FUNCTION generate_unique_pin_temp()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_pin TEXT;
    v_attempts INT := 0;
    v_max_attempts INT := 100;
    v_honeypot_pins TEXT[] := ARRAY[
        '0000', '1111', '2222', '3333', '4444', '5555',
        '6666', '7777', '8888', '9999', '1234', '4321',
        '1122', '2211', '5678'
    ];
BEGIN
    LOOP
        -- Generiere zufällige 4-stellige PIN
        v_pin := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

        -- Check 1: Honeypot-PIN?
        IF v_pin = ANY(v_honeypot_pins) THEN
            v_attempts := v_attempts + 1;
            IF v_attempts >= v_max_attempts THEN
                RAISE EXCEPTION 'Failed to generate safe PIN after % attempts', v_max_attempts;
            END IF;
            CONTINUE;
        END IF;

        -- Check 2: PIN bereits vergeben?
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = v_pin) THEN
            -- PIN ist frei
            RETURN v_pin;
        END IF;

        v_attempts := v_attempts + 1;
        IF v_attempts >= v_max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique PIN after % attempts', v_max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- ── 3. Duplikate automatisch bereinigen ───────────────────
DO $$
DECLARE
    rec RECORD;
    user_rec RECORD;
    new_pin TEXT;
    fixed_count INT := 0;
BEGIN
    RAISE NOTICE '=== Starte Duplikat-Bereinigung ===';

    -- Für jeden duplizierten PIN-Wert
    FOR rec IN (
        SELECT pin_4digit
        FROM public.users
        WHERE pin_4digit IS NOT NULL
        GROUP BY pin_4digit
        HAVING COUNT(*) > 1
    ) LOOP
        RAISE NOTICE 'Bearbeite PIN: %', rec.pin_4digit;

        -- Behalte EINEN User mit dieser PIN, ändere alle anderen
        -- (Strategie: Behalte den ältesten User)
        FOR user_rec IN (
            SELECT id, name, created_at
            FROM public.users
            WHERE pin_4digit = rec.pin_4digit
            ORDER BY created_at ASC
            OFFSET 1  -- Skip ersten (ältesten) User
        ) LOOP
            -- Generiere neue eindeutige PIN
            new_pin := generate_unique_pin_temp();

            -- Update User
            UPDATE public.users
            SET pin_4digit = new_pin
            WHERE id = user_rec.id;

            RAISE NOTICE '  → User "%" (%) erhält neue PIN: %',
                user_rec.name, user_rec.id, new_pin;

            fixed_count := fixed_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '=== Bereinigung abgeschlossen: % PINs geändert ===', fixed_count;
END $$;

-- ── 4. Verifizierung: Keine Duplikate mehr ────────────────
DO $$
DECLARE
    duplicate_count INT;
    duplicates RECORD;
BEGIN
    SELECT COUNT(*)
    INTO duplicate_count
    FROM (
        SELECT pin_4digit, COUNT(*) as cnt
        FROM public.users
        WHERE pin_4digit IS NOT NULL
        GROUP BY pin_4digit
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'FEHLER: Es existieren noch % doppelte PINs!', duplicate_count;
    ELSE
        RAISE NOTICE '✅ Keine Duplikate mehr vorhanden';
    END IF;
END $$;

-- ── 5. JETZT können wir den UNIQUE Constraint hinzufügen ──
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_pin_4digit_unique'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_pin_4digit_unique
        UNIQUE (pin_4digit);

        RAISE NOTICE '✅ UNIQUE Constraint erfolgreich hinzugefügt';
    ELSE
        RAISE NOTICE 'ℹ️ UNIQUE Constraint existiert bereits';
    END IF;
END $$;

-- ── 6. Temp-Funktion aufräumen ────────────────────────────
DROP FUNCTION IF EXISTS generate_unique_pin_temp();

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- WICHTIG: Diese Datei ERSETZT Schritt 1 von add_pin_duplicate_check.sql
--
-- NÄCHSTE SCHRITTE:
-- 1. Diese Datei ausführen (fix_duplicate_pins_before_constraint.sql)
-- 2. Dann den REST von add_pin_duplicate_check.sql ausführen:
--    - is_pin_taken() Funktion
--    - generate_safe_pin() Funktion
--    - create_student() aktualisieren
--    - update_student() aktualisieren
-- ============================================================
