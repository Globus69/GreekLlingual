-- ============================================================
-- Migration: Deutsche Uebersetzungen (de) fuer ui_translations
-- + CHECK-Constraints auf 4 Sprachen erweitern
-- Idempotent – kann beliebig oft ausgefuehrt werden
-- ============================================================

-- 1. CHECK-Constraint auf ui_translations.lang erweitern
DO $$
BEGIN
    -- Alten Constraint entfernen (falls vorhanden)
    ALTER TABLE ui_translations DROP CONSTRAINT IF EXISTS ui_translations_lang_check;
    -- Neuen Constraint mit 4 Sprachen setzen
    ALTER TABLE ui_translations ADD CONSTRAINT ui_translations_lang_check
        CHECK (lang IN ('en', 'ru', 'el', 'de'));
    RAISE NOTICE 'CHECK-Constraint ui_translations.lang auf 4 Sprachen erweitert';
END $$;

-- 2. CHECK-Constraint auf users.preferred_locale erweitern
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_preferred_locale_check;
    ALTER TABLE users ADD CONSTRAINT users_preferred_locale_check
        CHECK (preferred_locale IN ('en', 'ru', 'el', 'de'));
    RAISE NOTICE 'CHECK-Constraint preferred_locale auf 4 Sprachen erweitert';
END $$;

-- 3. update_user_locale RPC auf 4 Sprachen erweitern
CREATE OR REPLACE FUNCTION update_user_locale(p_user_id UUID, p_locale TEXT)
RETURNS JSON AS $$
BEGIN
    IF p_locale NOT IN ('en', 'ru', 'el', 'de') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid locale. Must be en, ru, el or de.');
    END IF;
    UPDATE public.users SET preferred_locale = p_locale WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found.');
    END IF;
    RETURN json_build_object('success', true, 'locale', p_locale);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_locale TO anon;
GRANT EXECUTE ON FUNCTION update_user_locale TO authenticated;

-- 4. Deutsche Uebersetzungen einfuegen

-- === Login ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.title', 'de', 'GreekLingua', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.subtitle', 'de', 'Geben Sie Ihre Daten ein, um weiterzulernen', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.email_placeholder', 'de', 'Benutzername', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.pin_placeholder', 'de', '6-stellige PIN', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.submit', 'de', 'Anmelden', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.submitting', 'de', 'Anmeldung...', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.error', 'de', 'Ungültiger Benutzername oder PIN. Bitte versuchen Sie es erneut.', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.biometric', 'de', 'FaceID / TouchID verwenden', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('login.language_label', 'de', 'Sprache', 'login')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Dashboard ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('header.logout', 'de', 'Abmelden', 'dashboard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('dashboard.authenticating', 'de', 'Authentifizierung...', 'dashboard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('dashboard.loading', 'de', 'GreekLingua wird geladen...', 'dashboard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('dashboard.welcome', 'de', 'Willkommen zurück, {name}!', 'dashboard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('dashboard.welcome_subtitle', 'de', 'Bereit weiterzumachen? Du hast <b>{count} neue Vokabelkarten</b> zur Wiederholung heute.', 'dashboard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Stats ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('stats.current_level', 'de', 'Aktuelles Level', 'stats')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('stats.days', 'de', 'Tage', 'stats')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('stats.vocabs', 'de', 'Vokabeln', 'stats')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('stats.learned', 'de', 'Gelernt', 'stats')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('stats.today', 'de', 'Heute:', 'stats')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('stats.daily_goal_default', 'de', '12 neue Vokabeln & 1 kurzer Text.', 'stats')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('stats.hours_suffix', 'de', 'Std.', 'stats')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Mastery ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mastery.title', 'de', 'Lernfortschritt', 'mastery')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mastery.total_time', 'de', 'Gesamte Lernzeit: {hours} Stunden', 'mastery')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mastery.last_test', 'de', 'Letzter Test', 'mastery')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mastery.actual_test', 'de', 'Aktueller Test', 'mastery')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mastery.last_exam', 'de', 'Letzte Prüfung', 'mastery')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mastery.vocab_progress', 'de', '<b>{learned} / {total}</b> Vokabeln sicher – {remaining} brauchen Übung', 'mastery')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mastery.suggestion_default', 'de', '12 neue Vokabelkarten + 1 kurzer Text über Zypern.', 'mastery')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Actions ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.magic_round', 'de', 'Dein Unterricht', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.quick_lesson', 'de', '20 Min. Schnelllektion', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.daily_phrases', 'de', 'Tagesphrasen', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.short_stories', 'de', 'Kurzgeschichten', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.train_weak', 'de', 'Schwache Wörter üben', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.review_vocab', 'de', 'Vokabeln wiederholen', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.due_cards', 'de', 'Fällige Karten heute', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.grammar_hits', 'de', 'Grammatik-Schnellübungen', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.listening', 'de', 'Hörübungen', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.pronunciation', 'de', 'Aussprachetrainer', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.comprehension', 'de', 'Leseverständnis', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.audio_immersion', 'de', 'Audio-Immersion', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.test', 'de', 'Test', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.cyprus_exam', 'de', 'Zypern-Prüfungssimulation', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.book_recs', 'de', 'Buchempfehlungen', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action.progress_history', 'de', 'Fortschrittsverlauf', 'actions')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Buttons (shared) ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('btn.hard', 'de', 'Schwer', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('btn.good', 'de', 'Gut', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('btn.easy', 'de', 'Leicht', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('btn.audio', 'de', 'Audio', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('btn.restart', 'de', 'Neustart', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('btn.cancel', 'de', 'Abbrechen', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('btn.audio_tooltip', 'de', 'Griechische Aussprache anhören', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Flashcard ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('flashcard.label_source', 'de', 'DEUTSCH', 'flashcard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('flashcard.label_target', 'de', 'ΕΛΛΗΝΙΚΑ', 'flashcard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('flashcard.flip_hint', 'de', 'Zum Umdrehen klicken', 'flashcard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('flashcard.tap_hint', 'de', 'Tippen Sie auf die Karte, um die Übersetzung zu sehen, und bewerten Sie dann Ihre Leistung.', 'flashcard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Vocabulary Dialog ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.loading', 'de', 'Wird geladen...', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.loading_subtitle', 'de', 'Vokabeln werden aus der Datenbank geladen...', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.login_required', 'de', 'Anmeldung erforderlich', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.login_required_msg', 'de', 'Bitte melden Sie sich an, um auf die Vokabel-Lernfunktionen zuzugreifen.', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.no_items', 'de', 'Keine Vokabeln gefunden', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.no_items_msg', 'de', 'Für diesen Modus sind keine Vokabeln verfügbar.', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.error', 'de', 'Fehler', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.error_msg', 'de', 'Vokabelkarte konnte nicht geladen werden.', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.session_complete', 'de', 'Sitzung abgeschlossen!', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.correct', 'de', 'Richtig', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.wrong', 'de', 'Falsch', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.back_to_dashboard', 'de', 'Zurück zum Dashboard', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.progress_saved', 'de', 'Fortschritt gespeichert – gut gemacht!', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.result_saved', 'de', 'Ergebnis gespeichert – gut gemacht!', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.mode.weak_title', 'de', 'Schwache Wörter üben', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.mode.weak_subtitle', 'de', 'Lass uns diese stärken', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.mode.due_title', 'de', 'Fällige Karten heute', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.mode.due_subtitle', 'de', 'Deine täglichen Wiederholungen', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.mode.review_title', 'de', 'Vokabeln wiederholen', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('vocab.mode.review_subtitle', 'de', 'Wissen auffrischen', 'vocab_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Grammar Dialog ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.loading_subtitle', 'de', 'Grammatik wird aus der Datenbank geladen...', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.login_required_msg', 'de', 'Bitte melden Sie sich an, um auf die Grammatik-Lernfunktionen zuzugreifen.', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.no_items', 'de', 'Keine Grammatik gefunden', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.no_items_msg', 'de', 'Für diesen Modus sind keine Grammatik-Themen verfügbar.', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.no_items_tip', 'de', 'Führen Sie supabase/insert_test_grammar.sql im Supabase SQL Editor aus.', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.error_msg', 'de', 'Grammatikkarte konnte nicht geladen werden.', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.mode.weak_title', 'de', 'Schwache Grammatik üben', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.mode.weak_subtitle', 'de', 'Lass uns diese stärken', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.mode.due_title', 'de', 'Fällige Grammatik heute', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.mode.due_subtitle', 'de', 'Deine täglichen Wiederholungen', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.mode.review_title', 'de', 'Grammatik-Schnellübungen', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('grammar.mode.review_subtitle', 'de', 'Grammatik auffrischen', 'grammar_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Comprehension Dialog ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.loading_subtitle', 'de', 'Verständnisübungen werden geladen...', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.login_required_msg', 'de', 'Bitte melden Sie sich an, um auf die Verständnisübungen zuzugreifen.', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.no_items', 'de', 'Kein Leseverständnis gefunden', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.no_items_msg', 'de', 'Für diesen Modus sind keine Verständnisübungen verfügbar.', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.no_items_tip', 'de', 'Führen Sie supabase/insert_test_comprehension.sql im Supabase SQL Editor aus.', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.error_msg', 'de', 'Verständniskarte konnte nicht geladen werden.', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.mode.weak_title', 'de', 'Schwaches Verständnis üben', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.mode.weak_subtitle', 'de', 'Lass uns diese stärken', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.mode.due_title', 'de', 'Fälliges Verständnis heute', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.mode.due_subtitle', 'de', 'Deine täglichen Wiederholungen', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.mode.review_title', 'de', 'Leseverständnis', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('comprehension.mode.review_subtitle', 'de', 'Verständnis trainieren', 'comprehension_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Listening Dialog ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.loading_subtitle', 'de', 'Hörübungen werden geladen...', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.login_required_msg', 'de', 'Bitte melden Sie sich an, um auf die Hörübungen zuzugreifen.', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.no_items', 'de', 'Keine Hörübungen gefunden', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.no_items_msg', 'de', 'Für diesen Modus sind keine Hörübungen verfügbar.', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.no_items_tip', 'de', 'Führen Sie supabase/insert_test_listening.sql im Supabase SQL Editor aus.', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.error_msg', 'de', 'Hörübung konnte nicht geladen werden.', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.play_audio', 'de', 'Audio abspielen', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.no_audio', 'de', '(Demo: Keine Audiodatei verfügbar)', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.correct_answer', 'de', 'Richtig! Sehr gut!', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.wrong_answer', 'de', 'Falsch. Die richtige Antwort ist: „{answer}"', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.next', 'de', 'Weiter', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.mode.weak_title', 'de', 'Schwaches Hören üben', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.mode.weak_subtitle', 'de', 'Lass uns diese stärken', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.mode.due_title', 'de', 'Fällige Hörübungen heute', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.mode.due_subtitle', 'de', 'Deine täglichen Wiederholungen', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.mode.review_title', 'de', 'Hörübungen', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('listening.mode.review_subtitle', 'de', 'Zuhören und die richtige Antwort wählen', 'listening_dialog')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Shared ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('shared.correct', 'de', 'Richtig', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('shared.wrong', 'de', 'Falsch', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('shared.session_complete', 'de', 'Sitzung abgeschlossen!', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('shared.back_to_dashboard', 'de', 'Zurück zum Dashboard', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('shared.progress_saved', 'de', 'Fortschritt gespeichert – gut gemacht!', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('shared.result_saved', 'de', 'Ergebnis gespeichert – gut gemacht!', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mode.weak_subtitle', 'de', 'Lass uns diese stärken', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('mode.due_subtitle', 'de', 'Deine täglichen Wiederholungen', 'shared')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Performance ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.title', 'de', 'Lernfortschritt', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.subtitle', 'de', 'Leistungszentrum', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.this_week', 'de', '+12% diese Woche', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.total_active', 'de', 'Aktive Vokabeln gesamt:', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.target', 'de', 'Ziel: 250/Monat', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.day.mon', 'de', 'Mo', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.day.tue', 'de', 'Di', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.day.wed', 'de', 'Mi', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.day.thu', 'de', 'Do', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.day.fri', 'de', 'Fr', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.day.sat', 'de', 'Sa', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('perf.day.sun', 'de', 'So', 'performance')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Action Grid ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.magic_round', 'de', 'Dein Unterricht', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.comprehension', 'de', 'Leseverständnis', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.exam_test', 'de', 'Prüfungstest', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.quick_lesson', 'de', '20 Min. Schnelllektion', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.game', 'de', 'Spiel', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.test', 'de', 'Test', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.lesson_today', 'de', 'Lektion heute', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.review_vocab', 'de', 'Vokabeln wiederholen', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.print', 'de', 'Drucken', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.toast_magic_round', 'de', 'Unterricht wird geöffnet...', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.toast_comprehension', 'de', 'Leseverständnis wird gestartet...', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.toast_exam', 'de', 'Prüfungstest wird gestartet...', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.toast_quick_lesson', 'de', 'Schnelllektion gestartet', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.toast_game', 'de', 'Spiel wird gestartet...', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.toast_test', 'de', 'Test wird ausgeführt...', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.toast_lesson', 'de', 'Lektion gestartet', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('action_grid.toast_review', 'de', 'Vokabeln wiederholen', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Modules ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.vokabeln', 'de', 'Vokabeln', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.vokabeln_sub', 'de', '12 fällig', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.phrases', 'de', 'Phrasen', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.phrases_sub', 'de', 'Reise', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.quiz', 'de', 'Quiz', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.quiz_sub', 'de', 'Lesen', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.cyprus', 'de', 'Zypern', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.cyprus_sub', 'de', 'Prüfungsvorbereitung', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.video', 'de', 'Videounterricht', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.audio', 'de', 'Audio', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.library', 'de', 'Bibliothek', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.stories', 'de', 'Geschichten', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.stories_sub', 'de', 'Kurzgeschichten', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('modules.opening', 'de', 'Modul wird geöffnet: ', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Header / Meta ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('header.admin', 'de', 'Admin', 'meta')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('header.switch_to_ru', 'de', 'Auf Russisch wechseln', 'meta')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('header.switch_to_en', 'de', 'Auf Englisch wechseln', 'meta')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('header.switch_to_el', 'de', 'Auf Griechisch wechseln', 'meta')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('header.switch_to_de', 'de', 'Auf Deutsch wechseln', 'meta')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Admin ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.title', 'de', 'Admin-Bereich', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.subtitle', 'de', 'Inhalts- & Schülerverwaltung', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.back_to_dashboard', 'de', 'Zurück zum Dashboard', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.students', 'de', 'Schüler', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.content', 'de', 'Inhaltsverwaltung', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.settings', 'de', 'Einstellungen', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.total_students', 'de', 'Schüler gesamt', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.active_today', 'de', 'Heute aktiv', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.avg_progress', 'de', 'Durchschn. Fortschritt', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.not_admin', 'de', 'Zugriff verweigert', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.not_admin_msg', 'de', 'Sie müssen als Admin angemeldet sein, um auf diese Seite zuzugreifen.', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.go_to_dashboard', 'de', 'Zum Dashboard', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.students_desc', 'de', 'Schüler, Level und Leistungsverfolgung verwalten.', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.content_desc', 'de', 'Lernmaterialien, Vokabeln, Grammatik und Übungen verwalten.', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('admin.settings_desc', 'de', 'Anwendungseinstellungen und Konfiguration.', 'admin')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- === Students ===
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.title', 'de', 'Schülerverwaltung', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.subtitle', 'de', 'Schüler erstellen, bearbeiten und verwalten', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.add_new', 'de', 'Neuer Schüler', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.back_to_list', 'de', 'Zurück zur Liste', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.search_placeholder', 'de', 'Suche nach Name, E-Mail oder Telefon...', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.loading', 'de', 'Schüler werden geladen...', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.no_students', 'de', 'Keine Schüler gefunden. Klicken Sie auf „Neuer Schüler".', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.total', 'de', 'Gesamt', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.filtered', 'de', 'Gefiltert', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.form_add_title', 'de', 'Neuen Schüler hinzufügen', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.form_edit_title', 'de', 'Schüler bearbeiten', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.field_name', 'de', 'Name', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.field_email', 'de', 'E-Mail', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.field_whatsapp', 'de', 'WhatsApp', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.field_pin', 'de', 'PIN (6 Ziffern)', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.field_level', 'de', 'Level', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.field_difficulty', 'de', 'Schwierigkeit', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.placeholder_name', 'de', 'Vollständiger Name', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.placeholder_email', 'de', 'email@beispiel.de', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.placeholder_whatsapp', 'de', '+49 123 456789', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.pin_optional', 'de', 'leer lassen, um aktuellen beizubehalten', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.pin_digits', 'de', 'Ziffern', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.diff_easy', 'de', 'Leicht', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.diff_middle', 'de', 'Mittel', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.diff_hard', 'de', 'Schwer', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.index_key_label', 'de', 'Leistungsindex (automatisch)', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.btn_create', 'de', 'Schüler erstellen', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.btn_update', 'de', 'Änderungen speichern', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.saving', 'de', 'Wird gespeichert...', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.saved_success', 'de', 'Schüler erfolgreich erstellt!', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.updated_success', 'de', 'Schüler erfolgreich aktualisiert!', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.deleted_success', 'de', 'Schüler gelöscht.', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.error_name_required', 'de', 'Name ist erforderlich.', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.error_pin_6', 'de', 'PIN muss genau 6 Ziffern haben.', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.error_save', 'de', 'Fehler beim Speichern des Schülers', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.error_delete', 'de', 'Fehler beim Löschen des Schülers', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.show_stats', 'de', 'Fortschritt anzeigen', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.stats_not_available', 'de', 'Statistiken nicht verfügbar', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.stats_attempts', 'de', 'Versuche', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.stats_correct_rate', 'de', 'Erfolgsquote', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.stats_items_learned', 'de', 'Gelernt/Geübt', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.stats_last_active', 'de', 'Zuletzt aktiv', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO ui_translations (key, lang, value, context) VALUES ('students.generate_pin', 'de', 'Zufällige PIN generieren', 'students')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- Fertig! Deutsche Uebersetzungen eingefuegt.
-- ============================================================
