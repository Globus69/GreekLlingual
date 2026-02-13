-- ╔══════════════════════════════════════════════════════════════╗
-- ║  GreekLingua – Master Bootstrap SQL                        ║
-- ║  DIESE DATEI ZUERST IM SUPABASE SQL EDITOR AUSFUEHREN!    ║
-- ║  Erstellt ALLE Tabellen + RPC-Funktionen in der richtigen  ║
-- ║  Reihenfolge. Idempotent – kann beliebig oft laufen.       ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════
-- SCHRITT 1: Extensions
-- ═══════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- SCHRITT 2: USERS Tabelle (Basis fuer alles andere)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    pin TEXT,
    name TEXT,
    pin_hash TEXT,
    whatsapp TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    level TEXT DEFAULT 'A1',
    difficulty TEXT DEFAULT 'easy',
    performance_index TEXT DEFAULT 'A1-easy',
    preferred_locale TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fehlende Spalten fuer bestehende Tabellen nachfuegen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='name') THEN
        ALTER TABLE public.users ADD COLUMN name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='pin_hash') THEN
        ALTER TABLE public.users ADD COLUMN pin_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='whatsapp') THEN
        ALTER TABLE public.users ADD COLUMN whatsapp TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='level') THEN
        ALTER TABLE public.users ADD COLUMN level TEXT DEFAULT 'A1';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='difficulty') THEN
        ALTER TABLE public.users ADD COLUMN difficulty TEXT DEFAULT 'easy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='performance_index') THEN
        ALTER TABLE public.users ADD COLUMN performance_index TEXT DEFAULT 'A1-easy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='preferred_locale') THEN
        ALTER TABLE public.users ADD COLUMN preferred_locale TEXT DEFAULT 'en';
    END IF;
END $$;

-- Email + Pin nullable machen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='email' AND is_nullable='NO') THEN
        ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='pin' AND is_nullable='NO') THEN
        ALTER TABLE public.users ALTER COLUMN pin DROP NOT NULL;
    END IF;
END $$;

-- CHECK-Constraints korrigieren
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%level%') LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
    FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%difficulty%') LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
    FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%') LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
    FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%preferred_locale%') LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

UPDATE public.users SET difficulty = 'middle' WHERE difficulty = 'medium';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'student'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_level_check' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_level_check CHECK (level IN ('A1', 'A2', 'B1', 'B2'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_difficulty_check' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_difficulty_check CHECK (difficulty IN ('easy', 'middle', 'hard'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_preferred_locale_check' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_preferred_locale_check CHECK (preferred_locale IN ('en', 'ru', 'el', 'de'));
    END IF;
END $$;

-- Indizes
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users (name);
CREATE INDEX IF NOT EXISTS idx_users_performance ON public.users (performance_index);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- Trigger: performance_index automatisch
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

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin full access" ON public.users;
DROP POLICY IF EXISTS "Students read own data" ON public.users;
DROP POLICY IF EXISTS "Anon can read users for login" ON public.users;

CREATE POLICY "Admin full access" ON public.users FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "Students read own data" ON public.users FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "Anon can read users for login" ON public.users FOR SELECT TO anon
    USING (true);

-- Admin-User Seed (PIN: 123456)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin' AND name = 'Admin') THEN
        INSERT INTO public.users (id, email, name, pin, pin_hash, role, level, difficulty)
        VALUES (uuid_generate_v4(), 'admin@greeklingua.local', 'Admin', '123456',
                crypt('123456', gen_salt('bf')), 'admin', 'A1', 'easy');
        RAISE NOTICE '✅ Admin erstellt (Name: Admin, PIN: 123456)';
    ELSE
        UPDATE public.users SET pin_hash = crypt('123456', gen_salt('bf')), pin = '123456'
        WHERE role = 'admin' AND name = 'Admin';
        RAISE NOTICE '✅ Admin aktualisiert (PIN: 123456)';
    END IF;
END $$;

-- Bestehende Daten korrigieren
UPDATE public.users SET performance_index = level || '-' || difficulty
WHERE performance_index IS NULL OR performance_index != (level || '-' || difficulty);

UPDATE public.users SET pin_hash = crypt(pin, gen_salt('bf'))
WHERE pin IS NOT NULL AND pin != '' AND pin_hash IS NULL;

RAISE NOTICE '═══ SCHRITT 2 FERTIG: users Tabelle ═══';

-- ═══════════════════════════════════════════════════════════════
-- SCHRITT 3: Users RPC-Funktionen
-- ═══════════════════════════════════════════════════════════════

-- verify_user_pin (mit preferred_locale)
DROP FUNCTION IF EXISTS verify_user_pin(TEXT, TEXT);
CREATE OR REPLACE FUNCTION verify_user_pin(p_name TEXT, p_pin TEXT)
RETURNS TABLE(user_id UUID, user_name TEXT, user_email TEXT, user_role TEXT,
              user_level TEXT, user_difficulty TEXT, user_performance_index TEXT,
              user_preferred_locale TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.role, u.level, u.difficulty,
           u.performance_index, COALESCE(u.preferred_locale, 'en')
    FROM public.users u
    WHERE LOWER(u.name) = LOWER(p_name)
      AND u.pin_hash IS NOT NULL
      AND u.pin_hash = crypt(p_pin, u.pin_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION verify_user_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_pin TO authenticated;

-- create_student
CREATE OR REPLACE FUNCTION create_student(
    p_name TEXT, p_email TEXT DEFAULT NULL, p_whatsapp TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL, p_level TEXT DEFAULT 'A1', p_difficulty TEXT DEFAULT 'easy'
) RETURNS JSON AS $$
DECLARE v_id UUID; v_hash TEXT;
BEGIN
    v_hash := CASE WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 6
              THEN crypt(p_pin, gen_salt('bf')) ELSE NULL END;
    INSERT INTO public.users (name, email, whatsapp, pin, pin_hash, role, level, difficulty)
    VALUES (TRIM(p_name), NULLIF(TRIM(p_email), ''), NULLIF(TRIM(p_whatsapp), ''),
            p_pin, v_hash, 'student', COALESCE(p_level, 'A1'), COALESCE(p_difficulty, 'easy'))
    RETURNING id INTO v_id;
    RETURN json_build_object('success', true, 'id', v_id::text);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION create_student TO anon;
GRANT EXECUTE ON FUNCTION create_student TO authenticated;

-- update_student
CREATE OR REPLACE FUNCTION update_student(
    p_id UUID, p_name TEXT DEFAULT NULL, p_email TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL, p_pin TEXT DEFAULT NULL,
    p_level TEXT DEFAULT NULL, p_difficulty TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
    UPDATE public.users SET
        name = COALESCE(NULLIF(TRIM(p_name), ''), name),
        email = CASE WHEN p_email IS NOT NULL THEN NULLIF(TRIM(p_email), '') ELSE email END,
        whatsapp = CASE WHEN p_whatsapp IS NOT NULL THEN NULLIF(TRIM(p_whatsapp), '') ELSE whatsapp END,
        pin = CASE WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 6 THEN p_pin ELSE pin END,
        pin_hash = CASE WHEN p_pin IS NOT NULL AND LENGTH(TRIM(p_pin)) = 6 THEN crypt(p_pin, gen_salt('bf')) ELSE pin_hash END,
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND role = 'student';
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Student not found'); END IF;
    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION update_student TO anon;
GRANT EXECUTE ON FUNCTION update_student TO authenticated;

-- delete_student
CREATE OR REPLACE FUNCTION delete_student(p_id UUID) RETURNS JSON AS $$
BEGIN
    DELETE FROM public.users WHERE id = p_id AND role = 'student';
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Student not found'); END IF;
    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION delete_student TO anon;
GRANT EXECUTE ON FUNCTION delete_student TO authenticated;

-- list_students
CREATE OR REPLACE FUNCTION list_students() RETURNS JSON AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(s)) FROM (
            SELECT id, name, email, whatsapp, role, level, difficulty, performance_index, created_at
            FROM public.users WHERE role = 'student' ORDER BY name ASC
        ) s), '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION list_students TO anon;
GRANT EXECUTE ON FUNCTION list_students TO authenticated;

-- update_user_locale
CREATE OR REPLACE FUNCTION update_user_locale(p_user_id UUID, p_locale TEXT) RETURNS JSON AS $$
BEGIN
    IF p_locale NOT IN ('en', 'ru', 'el', 'de') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid locale');
    END IF;
    UPDATE public.users SET preferred_locale = p_locale WHERE id = p_user_id;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'User not found'); END IF;
    RETURN json_build_object('success', true, 'locale', p_locale);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION update_user_locale TO anon;
GRANT EXECUTE ON FUNCTION update_user_locale TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- SCHRITT 4: UI_TRANSLATIONS Tabelle
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ui_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'en',
    value TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(key, lang)
);

ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read translations" ON public.ui_translations;
CREATE POLICY "Public read translations" ON public.ui_translations FOR SELECT USING (true);

DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.ui_translations'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%lang%') LOOP
        EXECUTE 'ALTER TABLE public.ui_translations DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ui_translations_lang_check' AND conrelid = 'public.ui_translations'::regclass) THEN
        ALTER TABLE public.ui_translations ADD CONSTRAINT ui_translations_lang_check CHECK (lang IN ('en', 'ru', 'el', 'de'));
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- SCHRITT 5: PERFORMANCE_LOG Tabelle
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.performance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    old_level TEXT, new_level TEXT,
    old_difficulty TEXT, new_difficulty TEXT,
    old_index TEXT, new_index TEXT,
    correct_rate FLOAT,
    total_attempts INTEGER,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_log_student ON public.performance_log (student_id);
CREATE INDEX IF NOT EXISTS idx_performance_log_created ON public.performance_log (created_at DESC);

ALTER TABLE public.performance_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all performance_log" ON public.performance_log;
CREATE POLICY "Allow all performance_log" ON public.performance_log FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- SCHRITT 6: LESSON_SESSIONS + LESSON_VOCABULARY Tabellen
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.lesson_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    topic TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_lesson_sessions_student ON public.lesson_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_date ON public.lesson_sessions(date DESC);

CREATE TABLE IF NOT EXISTS public.lesson_vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.lesson_sessions(id) ON DELETE CASCADE,
    source_word TEXT NOT NULL DEFAULT '',
    greek_word TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary_session ON public.lesson_vocabulary(session_id);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_lesson_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_lesson_session_ts ON public.lesson_sessions;
CREATE TRIGGER trg_update_lesson_session_ts
    BEFORE UPDATE ON public.lesson_sessions FOR EACH ROW
    EXECUTE FUNCTION update_lesson_session_timestamp();

-- RLS fuer lesson-Tabellen
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all lesson_sessions" ON public.lesson_sessions;
CREATE POLICY "Allow all lesson_sessions" ON public.lesson_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all lesson_vocabulary" ON public.lesson_vocabulary;
CREATE POLICY "Allow all lesson_vocabulary" ON public.lesson_vocabulary FOR ALL USING (true) WITH CHECK (true);

-- Lesson RPC-Funktionen
CREATE OR REPLACE FUNCTION get_lesson_sessions(p_student_id UUID)
RETURNS TABLE(session_id UUID, session_date DATE, session_topic TEXT,
              vocab_count BIGINT, created_at TIMESTAMP WITH TIME ZONE,
              updated_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT ls.id, ls.date, ls.topic, COUNT(lv.id),
           ls.created_at, ls.updated_at
    FROM public.lesson_sessions ls
    LEFT JOIN public.lesson_vocabulary lv ON lv.session_id = ls.id
    WHERE ls.student_id = p_student_id
    GROUP BY ls.id, ls.date, ls.topic, ls.created_at, ls.updated_at
    ORDER BY ls.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_lesson_sessions TO anon;
GRANT EXECUTE ON FUNCTION get_lesson_sessions TO authenticated;

CREATE OR REPLACE FUNCTION get_lesson_detail(p_session_id UUID)
RETURNS JSON AS $$
DECLARE v_session RECORD; v_vocabs JSON;
BEGIN
    SELECT id, student_id, date, topic, created_at, updated_at INTO v_session
    FROM public.lesson_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Session not found'); END IF;
    SELECT json_agg(json_build_object('id', lv.id, 'source_word', lv.source_word,
           'greek_word', lv.greek_word, 'sort_order', lv.sort_order) ORDER BY lv.sort_order)
    INTO v_vocabs FROM public.lesson_vocabulary lv WHERE lv.session_id = p_session_id;
    RETURN json_build_object('success', true,
        'session', json_build_object('id', v_session.id, 'student_id', v_session.student_id,
            'date', v_session.date, 'topic', v_session.topic),
        'vocabulary', COALESCE(v_vocabs, '[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_lesson_detail TO anon;
GRANT EXECUTE ON FUNCTION get_lesson_detail TO authenticated;

CREATE OR REPLACE FUNCTION upsert_lesson_session(p_student_id UUID, p_date DATE, p_topic TEXT)
RETURNS JSON AS $$
DECLARE v_session_id UUID;
BEGIN
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (p_student_id, p_date, p_topic)
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic, updated_at = now()
    RETURNING id INTO v_session_id;
    RETURN json_build_object('success', true, 'session_id', v_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION upsert_lesson_session TO anon;
GRANT EXECUTE ON FUNCTION upsert_lesson_session TO authenticated;

CREATE OR REPLACE FUNCTION set_lesson_vocabulary(p_session_id UUID, p_vocabulary JSON)
RETURNS JSON AS $$
DECLARE v_item JSON; v_count INTEGER := 0;
BEGIN
    DELETE FROM public.lesson_vocabulary WHERE session_id = p_session_id;
    FOR v_item IN SELECT * FROM json_array_elements(p_vocabulary) LOOP
        INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order)
        VALUES (p_session_id, COALESCE(v_item->>'source_word', ''),
                COALESCE(v_item->>'greek_word', ''), COALESCE((v_item->>'sort_order')::INTEGER, v_count));
        v_count := v_count + 1;
    END LOOP;
    RETURN json_build_object('success', true, 'count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION set_lesson_vocabulary TO anon;
GRANT EXECUTE ON FUNCTION set_lesson_vocabulary TO authenticated;

CREATE OR REPLACE FUNCTION delete_lesson_session(p_session_id UUID) RETURNS JSON AS $$
BEGIN
    DELETE FROM public.lesson_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Session not found'); END IF;
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION delete_lesson_session TO anon;
GRANT EXECUTE ON FUNCTION delete_lesson_session TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- SCHRITT 7: Performance-Evaluation RPC
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION evaluate_student_performance(
    p_student_id UUID, p_min_attempts INTEGER DEFAULT 50
) RETURNS JSON AS $$
DECLARE
    v_total_attempts INTEGER; v_total_correct INTEGER; v_correct_rate FLOAT;
    v_current_level TEXT; v_current_difficulty TEXT;
    v_new_level TEXT; v_new_difficulty TEXT;
    v_changed BOOLEAN := false; v_reason TEXT; v_message TEXT;
BEGIN
    SELECT COALESCE(SUM(attempts), 0), COALESCE(SUM(correct_count), 0)
    INTO v_total_attempts, v_total_correct
    FROM public.student_progress WHERE student_id = p_student_id;

    IF v_total_attempts < p_min_attempts THEN
        RETURN json_build_object('evaluated', false, 'correct_rate',
            CASE WHEN v_total_attempts > 0 THEN ROUND((v_total_correct::float / v_total_attempts * 100)::numeric, 1) ELSE 0 END,
            'total_attempts', v_total_attempts, 'min_required', p_min_attempts, 'changed', false,
            'message', 'Not enough attempts (' || v_total_attempts || '/' || p_min_attempts || ')');
    END IF;

    v_correct_rate := ROUND((v_total_correct::float / v_total_attempts * 100)::numeric, 1);
    SELECT level, difficulty INTO v_current_level, v_current_difficulty
    FROM public.users WHERE id = p_student_id AND role = 'student';
    IF NOT FOUND THEN RETURN json_build_object('evaluated', false, 'changed', false, 'message', 'Student not found'); END IF;

    v_new_level := v_current_level; v_new_difficulty := v_current_difficulty;

    IF v_correct_rate > 80 THEN
        IF v_current_difficulty = 'easy' THEN v_new_difficulty := 'middle'; v_changed := true; v_reason := 'auto_upgrade'; v_message := 'Upgraded: easy → middle';
        ELSIF v_current_difficulty = 'middle' THEN v_new_difficulty := 'hard'; v_changed := true; v_reason := 'auto_upgrade'; v_message := 'Upgraded: middle → hard';
        ELSIF v_current_difficulty = 'hard' THEN
            IF v_current_level = 'A1' THEN v_new_level := 'A2'; v_new_difficulty := 'easy'; v_changed := true; v_reason := 'auto_level_up'; v_message := 'Level up: A1→A2';
            ELSIF v_current_level = 'A2' THEN v_new_level := 'B1'; v_new_difficulty := 'easy'; v_changed := true; v_reason := 'auto_level_up'; v_message := 'Level up: A2→B1';
            ELSIF v_current_level = 'B1' THEN v_new_level := 'B2'; v_new_difficulty := 'easy'; v_changed := true; v_reason := 'auto_level_up'; v_message := 'Level up: B1→B2';
            ELSE v_message := 'Maximum level reached (B2-hard)';
            END IF;
        END IF;
    ELSIF v_correct_rate < 40 THEN
        IF v_current_difficulty = 'hard' THEN v_new_difficulty := 'middle'; v_changed := true; v_reason := 'auto_downgrade'; v_message := 'Adjusted: hard → middle';
        ELSIF v_current_difficulty = 'middle' THEN v_new_difficulty := 'easy'; v_changed := true; v_reason := 'auto_downgrade'; v_message := 'Adjusted: middle → easy';
        ELSIF v_current_difficulty = 'easy' THEN
            IF v_current_level = 'B2' THEN v_new_level := 'B1'; v_new_difficulty := 'hard'; v_changed := true; v_reason := 'auto_level_down'; v_message := 'Level down: B2→B1';
            ELSIF v_current_level = 'B1' THEN v_new_level := 'A2'; v_new_difficulty := 'hard'; v_changed := true; v_reason := 'auto_level_down'; v_message := 'Level down: B1→A2';
            ELSIF v_current_level = 'A2' THEN v_new_level := 'A1'; v_new_difficulty := 'hard'; v_changed := true; v_reason := 'auto_level_down'; v_message := 'Level down: A2→A1';
            ELSE v_message := 'Minimum level (A1-easy)';
            END IF;
        END IF;
    ELSE v_message := 'On track (' || v_correct_rate || '%)';
    END IF;

    IF v_changed THEN
        UPDATE public.users SET level = v_new_level, difficulty = v_new_difficulty WHERE id = p_student_id;
        INSERT INTO public.performance_log (student_id, old_level, new_level, old_difficulty, new_difficulty,
            old_index, new_index, correct_rate, total_attempts, reason)
        VALUES (p_student_id, v_current_level, v_new_level, v_current_difficulty, v_new_difficulty,
            v_current_level || '-' || v_current_difficulty, v_new_level || '-' || v_new_difficulty,
            v_correct_rate, v_total_attempts, v_reason);
    END IF;

    RETURN json_build_object('evaluated', true, 'correct_rate', v_correct_rate, 'total_attempts', v_total_attempts,
        'changed', v_changed, 'old_level', v_current_level, 'new_level', v_new_level,
        'old_difficulty', v_current_difficulty, 'new_difficulty', v_new_difficulty,
        'message', v_message);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('evaluated', false, 'changed', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION evaluate_student_performance TO anon;
GRANT EXECUTE ON FUNCTION evaluate_student_performance TO authenticated;

-- get_student_stats
CREATE OR REPLACE FUNCTION get_student_stats(p_student_id UUID) RETURNS JSON AS $$
DECLARE v_total_attempts INTEGER; v_total_correct INTEGER; v_correct_rate FLOAT;
        v_items_learned INTEGER; v_items_total INTEGER; v_last_activity TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT COALESCE(SUM(attempts), 0), COALESCE(SUM(correct_count), 0),
           COUNT(*) FILTER (WHERE ease_factor >= 2.5 AND attempts >= 3), COUNT(*), MAX(last_attempt)
    INTO v_total_attempts, v_total_correct, v_items_learned, v_items_total, v_last_activity
    FROM public.student_progress WHERE student_id = p_student_id;
    v_correct_rate := CASE WHEN v_total_attempts > 0 THEN ROUND((v_total_correct::float / v_total_attempts * 100)::numeric, 1) ELSE 0 END;
    RETURN json_build_object('total_attempts', v_total_attempts, 'total_correct', v_total_correct,
        'correct_rate', v_correct_rate, 'items_learned', v_items_learned,
        'items_practiced', v_items_total, 'last_activity', v_last_activity);
EXCEPTION WHEN OTHERS THEN RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_student_stats TO anon;
GRANT EXECUTE ON FUNCTION get_student_stats TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- FERTIG!
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE v_users INTEGER; v_translations INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_users FROM public.users;
    SELECT COUNT(*) INTO v_translations FROM public.ui_translations;
    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ BOOTSTRAP KOMPLETT!                      ║';
    RAISE NOTICE '╠══════════════════════════════════════════════╣';
    RAISE NOTICE '║  Users:        % Eintraege', v_users;
    RAISE NOTICE '║  Translations: % Eintraege', v_translations;
    RAISE NOTICE '║                                              ║';
    RAISE NOTICE '║  Tabellen: users, ui_translations,           ║';
    RAISE NOTICE '║    performance_log, lesson_sessions,          ║';
    RAISE NOTICE '║    lesson_vocabulary                          ║';
    RAISE NOTICE '║                                              ║';
    RAISE NOTICE '║  RPC: verify_user_pin, create_student,       ║';
    RAISE NOTICE '║    update_student, delete_student,            ║';
    RAISE NOTICE '║    list_students, update_user_locale,         ║';
    RAISE NOTICE '║    get_lesson_sessions, get_lesson_detail,    ║';
    RAISE NOTICE '║    upsert_lesson_session, set_lesson_vocab,   ║';
    RAISE NOTICE '║    evaluate_student_performance,              ║';
    RAISE NOTICE '║    get_student_stats                          ║';
    RAISE NOTICE '║                                              ║';
    RAISE NOTICE '║  Admin: Name=Admin, PIN=123456               ║';
    RAISE NOTICE '╚══════════════════════════════════════════════╝';
END $$;
