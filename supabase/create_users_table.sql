-- ============================================================
-- Aufgabe 10: User-Tabelle erweitern / erstellen
-- ============================================================
-- Erweitert bestehende users-Tabelle um:
--   name, pin_hash, whatsapp, role, level, difficulty, performance_index
-- PIN wird als bcrypt-Hash gespeichert (pgcrypto)
-- Admin-User wird mit PIN "123456" angelegt
-- ============================================================

-- 1. pgcrypto Extension fuer Passwort-Hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Neue Spalten hinzufuegen (idempotent mit IF NOT EXISTS)
DO $$
BEGIN
    -- name (fuer Login via Name statt Email)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
        ALTER TABLE public.users ADD COLUMN name TEXT;
    END IF;

    -- pin_hash (bcrypt-gehashter PIN, ersetzt spaeter plain-text pin)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pin_hash') THEN
        ALTER TABLE public.users ADD COLUMN pin_hash TEXT;
    END IF;

    -- whatsapp (optionale WhatsApp-Nummer)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='whatsapp') THEN
        ALTER TABLE public.users ADD COLUMN whatsapp TEXT;
    END IF;

    -- role (admin oder student)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'
            CHECK (role IN ('admin', 'student'));
    END IF;

    -- level (Sprachniveau: A1, A2, B1, B2)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='level') THEN
        ALTER TABLE public.users ADD COLUMN level TEXT DEFAULT 'A1'
            CHECK (level IN ('A1', 'A2', 'B1', 'B2'));
    END IF;

    -- difficulty (Schwierigkeitsgrad: easy, middle, hard)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='difficulty') THEN
        ALTER TABLE public.users ADD COLUMN difficulty TEXT DEFAULT 'easy'
            CHECK (difficulty IN ('easy', 'middle', 'hard'));
    END IF;

    -- performance_index (zusammengesetzter Key: "{level}-{difficulty}")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='performance_index') THEN
        ALTER TABLE public.users ADD COLUMN performance_index TEXT DEFAULT 'A1-easy';
    END IF;
END $$;

-- 3. Kommentare zur Dokumentation
COMMENT ON COLUMN public.users.name IS 'Display name, used for login (Name + PIN)';
COMMENT ON COLUMN public.users.pin_hash IS 'bcrypt-hashed 6-digit PIN (via pgcrypto crypt). Never store plain text.';
COMMENT ON COLUMN public.users.whatsapp IS 'Optional WhatsApp number for notifications';
COMMENT ON COLUMN public.users.role IS 'User role: admin or student';
COMMENT ON COLUMN public.users.level IS 'Language proficiency level: A1, A2, B1, B2';
COMMENT ON COLUMN public.users.difficulty IS 'Content difficulty: easy, middle, hard';
COMMENT ON COLUMN public.users.performance_index IS 'Composite key: "{level}-{difficulty}" (e.g. "A1-easy", "B1-hard")';

-- 4. Index auf name fuer schnelle Login-Suche
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users (name);

-- 5. Index auf performance_index fuer Content-Filterung
CREATE INDEX IF NOT EXISTS idx_users_performance ON public.users (performance_index);

-- 6. Trigger: performance_index automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_performance_index()
RETURNS TRIGGER AS $$
BEGIN
    NEW.performance_index := NEW.level || '-' || NEW.difficulty;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_performance_index ON public.users;
CREATE TRIGGER trg_update_performance_index
    BEFORE INSERT OR UPDATE OF level, difficulty ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_index();

-- 7. RLS-Policies (erweitert)
-- Bestehende Policies entfernen (falls vorhanden)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin full access" ON public.users;
DROP POLICY IF EXISTS "Students read own data" ON public.users;
DROP POLICY IF EXISTS "Anon can read users for login" ON public.users;

-- Admin darf alles
CREATE POLICY "Admin full access" ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Studenten duerfen nur eigene Daten lesen
CREATE POLICY "Students read own data" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Anon darf fuer Login-Validierung name lesen
CREATE POLICY "Anon can read users for login" ON public.users
    FOR SELECT
    TO anon
    USING (true);

-- 8. Admin-User erstellen (PIN "123456" als bcrypt-Hash)
-- Upsert: Nur einfuegen wenn noch kein Admin existiert
INSERT INTO public.users (id, email, name, pin, pin_hash, role, level, difficulty)
VALUES (
    uuid_generate_v4(),
    'admin@greeklingua.local',
    'Admin',
    '123456',
    crypt('123456', gen_salt('bf')),
    'admin',
    'A1',
    'easy'
)
ON CONFLICT (email) DO UPDATE SET
    name = 'Admin',
    pin_hash = crypt('123456', gen_salt('bf')),
    role = 'admin';

-- 9. Hilfsfunktion: PIN validieren (fuer Server-seitige Auth)
CREATE OR REPLACE FUNCTION verify_user_pin(p_name TEXT, p_pin TEXT)
RETURNS TABLE(user_id UUID, user_name TEXT, user_email TEXT, user_role TEXT, user_level TEXT, user_difficulty TEXT, user_performance_index TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.level,
        u.difficulty,
        u.performance_index
    FROM public.users u
    WHERE LOWER(u.name) = LOWER(p_name)
      AND u.pin_hash = crypt(p_pin, u.pin_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Zugriffsrechte fuer die Validierungsfunktion
GRANT EXECUTE ON FUNCTION verify_user_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_pin TO authenticated;
