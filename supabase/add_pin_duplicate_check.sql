-- ============================================================
-- PIN-Duplikat-Prüfung: UNIQUE Constraint + RPC-Funktionen
-- ============================================================
-- Datum: 2026-02-12
-- Zweck: Verhindert doppelte 4-stellige PINs, Server-seitige Checks
-- ============================================================

-- ── 1. UNIQUE Constraint auf pin_4digit ───────────────────
-- Idempotent: Nur hinzufügen falls nicht vorhanden
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
    END IF;
END $$;

-- ── 2. RPC: Prüfe ob PIN bereits vergeben ─────────────────
CREATE OR REPLACE FUNCTION is_pin_taken(p_pin TEXT, p_exclude_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE pin_4digit = p_pin
          AND (p_exclude_user_id IS NULL OR id != p_exclude_user_id)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION is_pin_taken(TEXT, UUID) TO anon, authenticated;

-- ── 3. RPC: Generiere sichere PIN (keine Duplikate/Honeypots) ─
CREATE OR REPLACE FUNCTION generate_safe_pin(p_exclude_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pin TEXT;
    v_attempts INT := 0;
    v_max_attempts INT := 50;
BEGIN
    LOOP
        -- Generiere zufällige 4-stellige PIN
        v_pin := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

        -- Check 1: Honeypot-PIN?
        IF EXISTS (SELECT 1 FROM public.honeypot_pins WHERE pin = v_pin) THEN
            v_attempts := v_attempts + 1;
            IF v_attempts >= v_max_attempts THEN
                RAISE EXCEPTION 'Failed to generate safe PIN after % attempts', v_max_attempts;
            END IF;
            CONTINUE;
        END IF;

        -- Check 2: PIN bereits vergeben?
        IF is_pin_taken(v_pin, p_exclude_user_id) THEN
            v_attempts := v_attempts + 1;
            IF v_attempts >= v_max_attempts THEN
                RAISE EXCEPTION 'Failed to generate unique PIN after % attempts', v_max_attempts;
            END IF;
            CONTINUE;
        END IF;

        -- PIN ist sicher (kein Honeypot, kein Duplikat)
        RETURN v_pin;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_safe_pin(UUID) TO anon, authenticated;

-- ── 4. Aktualisiere create_student() RPC ──────────────────
-- WICHTIG: Diese Funktion muss bereits existieren (aus fix_student_management_v2.sql)
-- Falls nicht vorhanden, wird sie hier neu erstellt
DROP FUNCTION IF EXISTS create_student(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_student(
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_level TEXT DEFAULT 'A1',
    p_difficulty TEXT DEFAULT 'easy'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pin TEXT;
    v_index TEXT;
BEGIN
    -- PIN-Validierung und -Generierung
    IF p_pin IS NULL OR p_pin = '' THEN
        -- Generiere sichere PIN (kein Duplikat, kein Honeypot)
        v_pin := generate_safe_pin();
    ELSE
        -- Prüfe ob PIN sicher ist
        IF EXISTS (SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'PIN ungültig (Sicherheitsregel)'
            );
        END IF;

        IF is_pin_taken(p_pin) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'PIN bereits vergeben'
            );
        END IF;

        v_pin := p_pin;
    END IF;

    -- Index berechnen
    v_index := p_level || '-' || p_difficulty;

    -- User erstellen
    INSERT INTO public.users (
        name, email, whatsapp, pin_4digit, role,
        level, difficulty, performance_index
    ) VALUES (
        p_name, p_email, p_whatsapp, v_pin, 'student',
        p_level, p_difficulty, v_index
    );

    RETURN json_build_object(
        'success', true,
        'pin', v_pin,
        'message', 'Student created successfully'
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'PIN bereits vergeben (Duplikat)'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION create_student(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ── 5. Aktualisiere update_student() RPC ──────────────────
DROP FUNCTION IF EXISTS update_student(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION update_student(
    p_id UUID,
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_level TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current RECORD;
    v_new_pin TEXT := NULL;
    v_new_level TEXT;
    v_new_difficulty TEXT;
    v_index TEXT;
BEGIN
    -- Aktuellen User laden
    SELECT * INTO v_current FROM public.users WHERE id = p_id AND role = 'student';
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Student not found');
    END IF;

    -- PIN-Update (nur wenn neuer PIN angegeben)
    IF p_pin IS NOT NULL AND p_pin != '' THEN
        -- Prüfe ob PIN sicher ist
        IF EXISTS (SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'PIN ungültig (Sicherheitsregel)'
            );
        END IF;

        IF is_pin_taken(p_pin, p_id) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'PIN bereits vergeben'
            );
        END IF;

        v_new_pin := p_pin;
    END IF;

    -- Level/Difficulty (mit Fallback auf bestehende Werte)
    v_new_level := COALESCE(p_level, v_current.level);
    v_new_difficulty := COALESCE(p_difficulty, v_current.difficulty);
    v_index := v_new_level || '-' || v_new_difficulty;

    -- User aktualisieren
    UPDATE public.users
    SET
        name = p_name,
        email = p_email,
        whatsapp = p_whatsapp,
        pin_4digit = COALESCE(v_new_pin, pin_4digit),
        level = v_new_level,
        difficulty = v_new_difficulty,
        performance_index = v_index,
        updated_at = NOW()
    WHERE id = p_id;

    RETURN json_build_object(
        'success', true,
        'pin', v_new_pin,
        'message', 'Student updated successfully'
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'PIN bereits vergeben (Duplikat)'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION update_student(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- UNIQUE Constraint auf pin_4digit hinzugefügt
-- RPC-Funktionen:
-- - is_pin_taken(pin, exclude_user_id) → BOOLEAN
-- - generate_safe_pin(exclude_user_id) → TEXT
-- - create_student() aktualisiert (Duplikat + Honeypot Check)
-- - update_student() aktualisiert (Duplikat + Honeypot Check)
-- ============================================================
