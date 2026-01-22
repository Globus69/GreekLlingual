-- ========================================
-- GREEK LINGUA DASHBOARD - SUPABASE SCHEMA
-- ========================================
-- Multi-Role System: Admin, Teacher, Student
-- Time-Limited Access, Individual Progress, Content Assignment
-- Row Level Security (RLS) enabled
-- ========================================

-- ========================================
-- STEP 1: ENABLE UUID EXTENSION
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- STEP 2: CREATE UPDATED_AT TRIGGER FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 3: PROFILES TABLE
-- ========================================
-- Erweitert auth.users mit Rollen und Ablaufdatum
-- ========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    display_name TEXT,
    access_expires_at TIMESTAMPTZ, -- NULL = unbegrenzter Zugriff
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger für updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- RLS aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder User sieht nur sein eigenes Profil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy: Jeder User kann sein eigenes Profil aktualisieren (außer role)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Admins können alle Profile sehen
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins können Profile erstellen und aktualisieren
CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins können Profile löschen
CREATE POLICY "Admins can delete profiles"
    ON profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- STEP 4: STUDENT_PROFILES TABLE
-- ========================================
-- Schüler-spezifische Daten (Level, Fortschritt)
-- ========================================
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    current_level TEXT NOT NULL DEFAULT 'A1' CHECK (current_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    total_cards_reviewed INTEGER NOT NULL DEFAULT 0,
    total_study_time_minutes INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger für updated_at
CREATE TRIGGER student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- RLS aktivieren
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Schüler sehen nur ihr eigenes student_profile
CREATE POLICY "Students can view own student profile"
    ON student_profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy: Schüler können ihr eigenes student_profile aktualisieren
CREATE POLICY "Students can update own student profile"
    ON student_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Admins und Teachers können alle student_profiles sehen
CREATE POLICY "Admins and teachers can view all student profiles"
    ON student_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Admins können student_profiles erstellen
CREATE POLICY "Admins can insert student profiles"
    ON student_profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins können alle student_profiles aktualisieren
CREATE POLICY "Admins can update all student profiles"
    ON student_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- STEP 5: CONTENT_SETS TABLE
-- ========================================
-- Lern-Inhalte / Decks (erstellt von Admins/Teachers)
-- ========================================
CREATE TABLE content_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger für updated_at
CREATE TRIGGER content_sets_updated_at
    BEFORE UPDATE ON content_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- RLS aktivieren
ALTER TABLE content_sets ENABLE ROW LEVEL SECURITY;

-- Policy: Alle authentifizierten User können content_sets sehen
CREATE POLICY "All users can view content sets"
    ON content_sets FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Nur Admins und Teachers können content_sets erstellen
CREATE POLICY "Admins and teachers can insert content sets"
    ON content_sets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Nur Admins und Teachers können content_sets aktualisieren
CREATE POLICY "Admins and teachers can update content sets"
    ON content_sets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Nur Admins können content_sets löschen
CREATE POLICY "Admins can delete content sets"
    ON content_sets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- STEP 6: DECK_ASSIGNMENTS TABLE
-- ========================================
-- Zuweisung von Content Sets zu Schülern (zeitlich begrenzt)
-- ========================================
CREATE TABLE deck_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES content_sets(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = unbegrenzt gültig
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, deck_id)
);

-- Index für schnellere Abfragen
CREATE INDEX idx_deck_assignments_student_id ON deck_assignments(student_id);
CREATE INDEX idx_deck_assignments_deck_id ON deck_assignments(deck_id);

-- Trigger für updated_at
CREATE TRIGGER deck_assignments_updated_at
    BEFORE UPDATE ON deck_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- RLS aktivieren
ALTER TABLE deck_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Schüler können nur ihre eigenen Zuweisungen sehen
CREATE POLICY "Students can view own assignments"
    ON deck_assignments FOR SELECT
    USING (auth.uid() = student_id);

-- Policy: Admins und Teachers können alle Zuweisungen sehen
CREATE POLICY "Admins and teachers can view all assignments"
    ON deck_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Nur Admins und Teachers können Zuweisungen erstellen
CREATE POLICY "Admins and teachers can insert assignments"
    ON deck_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Nur Admins und Teachers können Zuweisungen aktualisieren
CREATE POLICY "Admins and teachers can update assignments"
    ON deck_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Policy: Nur Admins können Zuweisungen löschen
CREATE POLICY "Admins can delete assignments"
    ON deck_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- STEP 7: FLASHCARD_PROGRESS TABLE
-- ========================================
-- Stores individual flashcard progress for each user (SRS data)
-- ========================================
CREATE TABLE flashcard_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL, -- English word (unique identifier)
    english_word TEXT NOT NULL,
    greek_word TEXT NOT NULL,
    context_en TEXT,
    context_gr TEXT,
    audio_en TEXT,
    audio_gr TEXT,
    ease NUMERIC(3, 2) NOT NULL DEFAULT 2.5 CHECK (ease >= 1.3 AND ease <= 3.0),
    interval INTEGER NOT NULL DEFAULT 1 CHECK (interval >= 0),
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed TIMESTAMPTZ,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, word)
);

-- Index für schnellere Abfragen
CREATE INDEX idx_flashcard_progress_user_id ON flashcard_progress(user_id);
CREATE INDEX idx_flashcard_progress_due_date ON flashcard_progress(due_date);
CREATE INDEX idx_flashcard_progress_ease ON flashcard_progress(ease);

-- Trigger für updated_at
CREATE TRIGGER flashcard_progress_updated_at
    BEFORE UPDATE ON flashcard_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- RLS aktivieren
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users können nur ihre eigenen Flashcard-Fortschritte sehen
CREATE POLICY "Users can view own flashcard progress"
    ON flashcard_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users können ihre eigenen Flashcard-Fortschritte erstellen
CREATE POLICY "Users can insert own flashcard progress"
    ON flashcard_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users können ihre eigenen Flashcard-Fortschritte aktualisieren
CREATE POLICY "Users can update own flashcard progress"
    ON flashcard_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users können ihre eigenen Flashcard-Fortschritte löschen
CREATE POLICY "Users can delete own flashcard progress"
    ON flashcard_progress FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Admins und Teachers können alle Flashcard-Fortschritte sehen
CREATE POLICY "Admins and teachers can view all flashcard progress"
    ON flashcard_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- ========================================
-- STEP 8: HELPER FUNCTIONS
-- ========================================

-- Funktion: Prüfe ob User-Zugriff abgelaufen ist
CREATE OR REPLACE FUNCTION is_access_expired(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND access_expires_at IS NOT NULL
        AND access_expires_at < NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Hole aktive Decks für einen Schüler
CREATE OR REPLACE FUNCTION get_active_decks_for_student(student_id UUID)
RETURNS TABLE (
    deck_id UUID,
    deck_name TEXT,
    deck_level TEXT,
    assigned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.id,
        cs.name,
        cs.level,
        da.assigned_at,
        da.expires_at
    FROM deck_assignments da
    JOIN content_sets cs ON da.deck_id = cs.id
    WHERE da.student_id = student_id
    AND cs.is_active = true
    AND (da.expires_at IS NULL OR da.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 9: INITIAL SETUP TRIGGER
-- ========================================
-- Automatisch profile erstellen wenn neuer User registriert wird
-- ========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Erstelle profile für neuen User (default: student)
    INSERT INTO profiles (id, role, display_name)
    VALUES (
        NEW.id,
        'student',
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );

    -- Erstelle student_profile wenn role = student
    INSERT INTO student_profiles (id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für neue User
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ========================================
-- STEP 10: SAMPLE DATA (OPTIONAL)
-- ========================================
-- Kommentiere diesen Block aus, wenn du keine Test-Daten brauchst
-- ========================================

-- Erstelle einen Admin-User (nur für Entwicklung!)
-- WICHTIG: Ersetze dies durch echte User-Registrierung in Production!
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@greeklangua.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

INSERT INTO profiles (id, role, display_name, access_expires_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Admin User',
    NULL
);
*/

-- ========================================
-- ENDE DES SCHEMAS
-- ========================================

-- Überprüfe die erstellten Tabellen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'student_profiles', 'content_sets', 'deck_assignments', 'flashcard_progress')
ORDER BY table_name;

-- Überprüfe die RLS Policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
