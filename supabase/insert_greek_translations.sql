-- ============================================================
-- Migration: Griechisch (el) als dritte UI-Sprache
-- Erweitert CHECK-Constraints und fuegt griechische Uebersetzungen ein
-- Idempotent – kann beliebig oft ausgefuehrt werden
-- ============================================================

-- 1. CHECK-Constraint auf ui_translations.lang erweitern (en, ru, el)
DO $$
BEGIN
    -- Alten Constraint entfernen falls vorhanden
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'ui_translations'
          AND constraint_name = 'ui_translations_lang_check'
    ) THEN
        ALTER TABLE public.ui_translations DROP CONSTRAINT ui_translations_lang_check;
    END IF;
    -- Neuen Constraint setzen
    ALTER TABLE public.ui_translations ADD CONSTRAINT ui_translations_lang_check CHECK (lang IN ('en', 'ru', 'el'));
    RAISE NOTICE 'CHECK-Constraint ui_translations.lang auf (en, ru, el) erweitert';
END $$;

-- 2. CHECK-Constraint auf users.preferred_locale erweitern (en, ru, el)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'users'
          AND constraint_name = 'users_preferred_locale_check'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_preferred_locale_check;
    END IF;
    ALTER TABLE public.users ADD CONSTRAINT users_preferred_locale_check CHECK (preferred_locale IN ('en', 'ru', 'el'));
    RAISE NOTICE 'CHECK-Constraint users.preferred_locale auf (en, ru, el) erweitert';
END $$;

-- 3. update_user_locale RPC: el als gueltig akzeptieren
CREATE OR REPLACE FUNCTION update_user_locale(p_user_id UUID, p_locale TEXT)
RETURNS JSON AS $$
BEGIN
    IF p_locale NOT IN ('en', 'ru', 'el') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid locale. Must be en, ru or el.');
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

-- ============================================================
-- 4. INSERT GREEK TRANSLATIONS (el)
-- Idempotent via ON CONFLICT DO UPDATE
-- ============================================================

INSERT INTO ui_translations (key, lang, value, context) VALUES

-- === LOGIN PAGE ===
('login.title', 'el', 'GreekLingua', 'login'),
('login.subtitle', 'el', 'Εισάγετε τα στοιχεία σας για να συνεχίσετε τη μάθηση', 'login'),
('login.email_placeholder', 'el', 'Όνομα χρήστη', 'login'),
('login.pin_placeholder', 'el', '6ψήφιο PIN', 'login'),
('login.submit', 'el', 'Είσοδος', 'login'),
('login.submitting', 'el', 'Γίνεται είσοδος...', 'login'),
('login.error', 'el', 'Λάθος όνομα ή PIN. Δοκιμάστε ξανά.', 'login'),
('login.biometric', 'el', 'Χρήση FaceID / TouchID', 'login'),
('login.language_label', 'el', 'Γλώσσα', 'login'),

-- === DASHBOARD - HEADER ===
('header.brand', 'el', 'GreekLingua', 'dashboard'),
('header.hub_suffix', 'el', ' – Πίνακας', 'dashboard'),
('header.logout', 'el', 'Αποσύνδεση', 'dashboard'),
('header.admin', 'el', 'Διαχείριση', 'dashboard'),
('header.switch_to_ru', 'el', 'Αλλαγή σε ρωσικά', 'dashboard'),
('header.switch_to_en', 'el', 'Αλλαγή σε αγγλικά', 'dashboard'),
('header.switch_to_el', 'el', 'Αλλαγή σε ελληνικά', 'dashboard'),

-- === DASHBOARD - LOADING ===
('dashboard.authenticating', 'el', 'Έλεγχος ταυτότητας...', 'dashboard'),
('dashboard.loading', 'el', 'Φόρτωση GreekLingua...', 'dashboard'),

-- === DASHBOARD - WELCOME ===
('dashboard.welcome', 'el', 'Καλώς ήρθες πίσω, {name}!', 'dashboard'),
('dashboard.welcome_subtitle', 'el', 'Έτοιμος να συνεχίσεις; Έχεις <b>{count} νέες κάρτες λεξιλογίου</b> για επανάληψη σήμερα.', 'dashboard'),

-- === DASHBOARD - STATS CARD ===
('stats.current_level', 'el', 'Τρέχον επίπεδο', 'stats'),
('stats.days', 'el', 'Ημέρες', 'stats'),
('stats.vocabs', 'el', 'Λέξεις', 'stats'),
('stats.learned', 'el', 'Μαθημένα', 'stats'),
('stats.today', 'el', 'Σήμερα:', 'stats'),
('stats.daily_goal_default', 'el', '12 νέες λέξεις & 1 σύντομο κείμενο.', 'stats'),
('stats.hours_suffix', 'el', 'ώ', 'stats'),

-- === DASHBOARD - MASTERY BOX ===
('mastery.title', 'el', 'Επίπεδο μάθησης', 'mastery'),
('mastery.total_time', 'el', 'Συνολικός χρόνος μάθησης: {hours} ώρες', 'mastery'),
('mastery.last_test', 'el', 'Τελευταίο τεστ', 'mastery'),
('mastery.actual_test', 'el', 'Τρέχον τεστ', 'mastery'),
('mastery.last_exam', 'el', 'Τελευταία εξέταση', 'mastery'),
('mastery.vocab_progress', 'el', '<b>{learned} / {total}</b> Λεξιλόγιο με σιγουριά – {remaining} χρειάζονται προσοχή', 'mastery'),
('mastery.suggestion', 'el', 'Πρόταση για σήμερα: {suggestion}', 'mastery'),
('mastery.suggestion_default', 'el', '12 νέες κάρτες + 1 σύντομο κείμενο για την Κύπρο.', 'mastery'),

-- === DASHBOARD - ACTION TILES (4x4 Grid) ===
('action.magic_round', 'el', 'Μαγικός γύρος', 'actions'),
('action.quick_lesson', 'el', 'Γρήγορο μάθημα 20 λεπτά', 'actions'),
('action.daily_phrases', 'el', 'Φράσεις της ημέρας', 'actions'),
('action.short_stories', 'el', 'Σύντομες ιστορίες', 'actions'),
('action.train_weak', 'el', 'Εξάσκηση αδύναμων λέξεων', 'actions'),
('action.review_vocab', 'el', 'Επανάληψη λεξιλογίου', 'actions'),
('action.due_cards', 'el', 'Κάρτες σήμερα', 'actions'),
('action.grammar_hits', 'el', 'Γραμματική', 'actions'),
('action.listening', 'el', 'Ακουστική εξάσκηση', 'actions'),
('action.pronunciation', 'el', 'Εξάσκηση προφοράς', 'actions'),
('action.comprehension', 'el', 'Κατανόηση', 'actions'),
('action.audio_immersion', 'el', 'Ηχητική εμβύθιση', 'actions'),
('action.test', 'el', 'Τεστ', 'actions'),
('action.cyprus_exam', 'el', 'Προσομοίωση εξετάσεων Κύπρου', 'actions'),
('action.book_recs', 'el', 'Προτάσεις βιβλίων', 'actions'),
('action.progress_history', 'el', 'Ιστορικό προόδου', 'actions'),

-- === VOCABULARY DIALOG ===
('vocab.loading', 'el', 'Φόρτωση...', 'vocab_dialog'),
('vocab.loading_subtitle', 'el', 'Ανάκτηση λεξιλογίου από τη βάση δεδομένων...', 'vocab_dialog'),
('vocab.login_required', 'el', 'Απαιτείται σύνδεση', 'vocab_dialog'),
('vocab.login_required_msg', 'el', 'Συνδεθείτε για πρόσβαση στις λειτουργίες εκμάθησης λεξιλογίου.', 'vocab_dialog'),
('vocab.no_items', 'el', 'Δεν βρέθηκε λεξιλόγιο', 'vocab_dialog'),
('vocab.no_items_msg', 'el', 'Δεν υπάρχουν διαθέσιμες λέξεις για αυτήν τη λειτουργία.', 'vocab_dialog'),
('vocab.error', 'el', 'Σφάλμα', 'vocab_dialog'),
('vocab.error_msg', 'el', 'Αδυναμία φόρτωσης κάρτας.', 'vocab_dialog'),
('vocab.session_complete', 'el', 'Η συνεδρία ολοκληρώθηκε!', 'vocab_dialog'),
('vocab.correct', 'el', 'Σωστά', 'vocab_dialog'),
('vocab.wrong', 'el', 'Λάθος', 'vocab_dialog'),
('vocab.back_to_dashboard', 'el', 'Πίσω στον πίνακα', 'vocab_dialog'),
('vocab.progress_saved', 'el', 'Η πρόοδος αποθηκεύτηκε – μπράβο!', 'vocab_dialog'),
('vocab.result_saved', 'el', 'Το αποτέλεσμα αποθηκεύτηκε – μπράβο!', 'vocab_dialog'),

-- === VOCABULARY DIALOG - MODE TITLES ===
('vocab.mode.weak_title', 'el', 'Εξάσκηση αδύναμων λέξεων', 'vocab_dialog'),
('vocab.mode.weak_subtitle', 'el', 'Ας τις ενισχύσουμε', 'vocab_dialog'),
('vocab.mode.due_title', 'el', 'Κάρτες σήμερα', 'vocab_dialog'),
('vocab.mode.due_subtitle', 'el', 'Οι καθημερινές σου επαναλήψεις', 'vocab_dialog'),
('vocab.mode.review_title', 'el', 'Επανάληψη λεξιλογίου', 'vocab_dialog'),
('vocab.mode.review_subtitle', 'el', 'Ανανεώστε τις γνώσεις σας', 'vocab_dialog'),

-- === GRAMMAR DIALOG ===
('grammar.loading_subtitle', 'el', 'Ανάκτηση γραμματικής από τη βάση δεδομένων...', 'grammar_dialog'),
('grammar.login_required_msg', 'el', 'Συνδεθείτε για πρόσβαση στη γραμματική.', 'grammar_dialog'),
('grammar.no_items', 'el', 'Δεν βρέθηκε γραμματική', 'grammar_dialog'),
('grammar.no_items_msg', 'el', 'Δεν υπάρχουν διαθέσιμα θέματα γραμματικής.', 'grammar_dialog'),
('grammar.no_items_tip', 'el', 'Εκτελέστε το supabase/insert_test_grammar.sql στο Supabase SQL editor.', 'grammar_dialog'),
('grammar.error_msg', 'el', 'Αδυναμία φόρτωσης κάρτας γραμματικής.', 'grammar_dialog'),
('grammar.mode.weak_title', 'el', 'Εξάσκηση αδύναμης γραμματικής', 'grammar_dialog'),
('grammar.mode.weak_subtitle', 'el', 'Ας τις ενισχύσουμε', 'grammar_dialog'),
('grammar.mode.due_title', 'el', 'Γραμματική σήμερα', 'grammar_dialog'),
('grammar.mode.due_subtitle', 'el', 'Οι καθημερινές σου επαναλήψεις', 'grammar_dialog'),
('grammar.mode.review_title', 'el', 'Γραμματική', 'grammar_dialog'),
('grammar.mode.review_subtitle', 'el', 'Ανανεώστε τη γραμματική', 'grammar_dialog'),

-- === COMPREHENSION DIALOG ===
('comprehension.loading_subtitle', 'el', 'Ανάκτηση ασκήσεων κατανόησης...', 'comprehension_dialog'),
('comprehension.login_required_msg', 'el', 'Συνδεθείτε για πρόσβαση στις ασκήσεις κατανόησης.', 'comprehension_dialog'),
('comprehension.no_items', 'el', 'Δεν βρέθηκαν ασκήσεις', 'comprehension_dialog'),
('comprehension.no_items_msg', 'el', 'Δεν υπάρχουν διαθέσιμες ασκήσεις.', 'comprehension_dialog'),
('comprehension.no_items_tip', 'el', 'Εκτελέστε το supabase/insert_test_comprehension.sql στο Supabase SQL editor.', 'comprehension_dialog'),
('comprehension.error_msg', 'el', 'Αδυναμία φόρτωσης κάρτας κατανόησης.', 'comprehension_dialog'),
('comprehension.mode.weak_title', 'el', 'Εξάσκηση αδύναμης κατανόησης', 'comprehension_dialog'),
('comprehension.mode.weak_subtitle', 'el', 'Ας τις ενισχύσουμε', 'comprehension_dialog'),
('comprehension.mode.due_title', 'el', 'Κατανόηση σήμερα', 'comprehension_dialog'),
('comprehension.mode.due_subtitle', 'el', 'Οι καθημερινές σου επαναλήψεις', 'comprehension_dialog'),
('comprehension.mode.review_title', 'el', 'Κατανόηση', 'comprehension_dialog'),
('comprehension.mode.review_subtitle', 'el', 'Εξασκήστε την κατανόηση', 'comprehension_dialog'),

-- === LISTENING DIALOG ===
('listening.loading_subtitle', 'el', 'Ανάκτηση ακουστικών ασκήσεων...', 'listening_dialog'),
('listening.login_required_msg', 'el', 'Συνδεθείτε για πρόσβαση στις ακουστικές ασκήσεις.', 'listening_dialog'),
('listening.no_items', 'el', 'Δεν βρέθηκαν ακουστικές ασκήσεις', 'listening_dialog'),
('listening.no_items_msg', 'el', 'Δεν υπάρχουν διαθέσιμες ακουστικές ασκήσεις.', 'listening_dialog'),
('listening.no_items_tip', 'el', 'Εκτελέστε το supabase/insert_test_listening.sql στο Supabase SQL editor.', 'listening_dialog'),
('listening.error_msg', 'el', 'Αδυναμία φόρτωσης ακουστικής άσκησης.', 'listening_dialog'),
('listening.play_audio', 'el', 'Αναπαραγωγή ήχου', 'listening_dialog'),
('listening.no_audio', 'el', '(Δείγμα: Δεν υπάρχει αρχείο ήχου)', 'listening_dialog'),
('listening.correct_answer', 'el', 'Σωστά! Πολύ καλά!', 'listening_dialog'),
('listening.wrong_answer', 'el', 'Λάθος. Η σωστή απάντηση είναι: «{answer}»', 'listening_dialog'),
('listening.next', 'el', 'Επόμενο', 'listening_dialog'),
('listening.mode.weak_title', 'el', 'Εξάσκηση αδύναμης ακρόασης', 'listening_dialog'),
('listening.mode.weak_subtitle', 'el', 'Ας τις ενισχύσουμε', 'listening_dialog'),
('listening.mode.due_title', 'el', 'Ακρόαση σήμερα', 'listening_dialog'),
('listening.mode.due_subtitle', 'el', 'Οι καθημερινές σου επαναλήψεις', 'listening_dialog'),
('listening.mode.review_title', 'el', 'Ακουστική εξάσκηση', 'listening_dialog'),
('listening.mode.review_subtitle', 'el', 'Ακούστε και επιλέξτε τη σωστή απάντηση', 'listening_dialog'),

-- === SHARED DIALOG BUTTONS ===
('btn.hard', 'el', 'Δύσκολο', 'shared'),
('btn.good', 'el', 'Καλά', 'shared'),
('btn.easy', 'el', 'Εύκολο', 'shared'),
('btn.audio', 'el', 'Ήχος', 'shared'),
('btn.restart', 'el', 'Επανεκκίνηση', 'shared'),
('btn.cancel', 'el', 'Ακύρωση', 'shared'),
('btn.audio_tooltip', 'el', 'Ακούστε την ελληνική προφορά', 'shared'),

-- === FLASHCARD COMPONENT ===
('flashcard.label_source', 'el', 'ΕΛΛΗΝΙΚΑ', 'flashcard'),
('flashcard.label_target', 'el', 'ΕΛΛΗΝΙΚΑ', 'flashcard'),
('flashcard.flip_hint', 'el', 'Κάντε κλικ για αναστροφή', 'flashcard'),
('flashcard.tap_hint', 'el', 'Πατήστε την κάρτα για να δείτε τη μετάφραση, και μετά αξιολογήστε την επίδοσή σας.', 'flashcard'),

-- === SHARED - MODE SUBTITLES ===
('mode.weak_subtitle', 'el', 'Ας τις ενισχύσουμε', 'shared'),
('mode.due_subtitle', 'el', 'Οι καθημερινές σου επαναλήψεις', 'shared'),

-- === SHARED DIALOG ===
('shared.correct', 'el', 'Σωστά', 'shared'),
('shared.wrong', 'el', 'Λάθος', 'shared'),
('shared.session_complete', 'el', 'Η συνεδρία ολοκληρώθηκε!', 'shared'),
('shared.back_to_dashboard', 'el', 'Πίσω στον πίνακα', 'shared'),
('shared.progress_saved', 'el', 'Η πρόοδος αποθηκεύτηκε – μπράβο!', 'shared'),
('shared.result_saved', 'el', 'Το αποτέλεσμα αποθηκεύτηκε – μπράβο!', 'shared'),

-- === PERFORMANCE HUB ===
('perf.title', 'el', 'Επίπεδο μάθησης', 'performance'),
('perf.subtitle', 'el', 'Κέντρο επίδοσης', 'performance'),
('perf.this_week', 'el', '+12% αυτήν την εβδομάδα', 'performance'),
('perf.total_active', 'el', 'Συνολικές ενεργές λέξεις:', 'performance'),
('perf.target', 'el', 'Στόχος: 250/μήνα', 'performance'),
('perf.day.mon', 'el', 'Δευ', 'performance'),
('perf.day.tue', 'el', 'Τρι', 'performance'),
('perf.day.wed', 'el', 'Τετ', 'performance'),
('perf.day.thu', 'el', 'Πεμ', 'performance'),
('perf.day.fri', 'el', 'Παρ', 'performance'),
('perf.day.sat', 'el', 'Σαβ', 'performance'),
('perf.day.sun', 'el', 'Κυρ', 'performance'),

-- === MODULE GRID ===
('modules.vokabeln', 'el', 'Λεξιλόγιο', 'modules'),
('modules.vokabeln_sub', 'el', '12 προς επανάληψη', 'modules'),
('modules.phrases', 'el', 'Φράσεις', 'modules'),
('modules.phrases_sub', 'el', 'Ταξίδι', 'modules'),
('modules.quiz', 'el', 'Κουίζ', 'modules'),
('modules.quiz_sub', 'el', 'Ανάγνωση', 'modules'),
('modules.cyprus', 'el', 'Κύπρος', 'modules'),
('modules.cyprus_sub', 'el', 'Προετοιμασία εξετάσεων', 'modules'),
('modules.video', 'el', 'Βιντεομάθημα', 'modules'),
('modules.audio', 'el', 'Ήχος', 'modules'),
('modules.library', 'el', 'Βιβλιοθήκη', 'modules'),
('modules.stories', 'el', 'Ιστορίες', 'modules'),
('modules.stories_sub', 'el', 'Σύντομες ιστορίες', 'modules'),
('modules.opening', 'el', 'Άνοιγμα ενότητας: ', 'modules'),

-- === ACTION GRID ===
('action_grid.magic_round', 'el', 'Μαγικός γύρος', 'action_grid'),
('action_grid.comprehension', 'el', 'Κατανόηση', 'action_grid'),
('action_grid.exam_test', 'el', 'Εξετάσεις', 'action_grid'),
('action_grid.quick_lesson', 'el', 'Γρήγορο μάθημα 20 λεπτά', 'action_grid'),
('action_grid.game', 'el', 'Παιχνίδι', 'action_grid'),
('action_grid.test', 'el', 'Τεστ', 'action_grid'),
('action_grid.lesson_today', 'el', 'Μάθημα σήμερα', 'action_grid'),
('action_grid.review_vocab', 'el', 'Επανάληψη λεξιλογίου', 'action_grid'),
('action_grid.print', 'el', 'Εκτύπωση', 'action_grid'),
('action_grid.toast_magic_round', 'el', 'Προετοιμασία μαγικού γύρου...', 'action_grid'),
('action_grid.toast_comprehension', 'el', 'Έναρξη κατανόησης...', 'action_grid'),
('action_grid.toast_exam', 'el', 'Έναρξη εξετάσεων...', 'action_grid'),
('action_grid.toast_quick_lesson', 'el', 'Το γρήγορο μάθημα ξεκίνησε', 'action_grid'),
('action_grid.toast_game', 'el', 'Έναρξη παιχνιδιού...', 'action_grid'),
('action_grid.toast_test', 'el', 'Εκτέλεση τεστ...', 'action_grid'),
('action_grid.toast_lesson', 'el', 'Το μάθημα ξεκίνησε', 'action_grid'),
('action_grid.toast_review', 'el', 'Επανάληψη λεξιλογίου', 'action_grid'),

-- === ADMIN ===
('admin.title', 'el', 'Πίνακας διαχείρισης', 'admin'),
('admin.subtitle', 'el', 'Διαχείριση περιεχομένου & μαθητών', 'admin'),
('admin.back_to_dashboard', 'el', 'Πίσω στον πίνακα', 'admin'),
('admin.students', 'el', 'Μαθητές', 'admin'),
('admin.content', 'el', 'Διαχείριση περιεχομένου', 'admin'),
('admin.settings', 'el', 'Ρυθμίσεις', 'admin'),
('admin.total_students', 'el', 'Σύνολο μαθητών', 'admin'),
('admin.active_today', 'el', 'Ενεργοί σήμερα', 'admin'),
('admin.avg_progress', 'el', 'Μέση πρόοδος', 'admin'),
('admin.not_admin', 'el', 'Δεν επιτρέπεται η πρόσβαση', 'admin'),
('admin.not_admin_msg', 'el', 'Πρέπει να είστε συνδεδεμένος ως Διαχειριστής.', 'admin'),
('admin.go_to_dashboard', 'el', 'Πήγαινε στον πίνακα', 'admin'),
('admin.students_desc', 'el', 'Διαχείριση μαθητών, επιπέδων και επίδοσης.', 'admin'),
('admin.content_desc', 'el', 'Διαχείριση λεξιλογίου, γραμματικής και ασκήσεων.', 'admin'),
('admin.settings_desc', 'el', 'Ρυθμίσεις εφαρμογής.', 'admin'),

-- === STUDENT MANAGEMENT ===
('students.title', 'el', 'Διαχείριση μαθητών', 'students'),
('students.subtitle', 'el', 'Δημιουργία, επεξεργασία και διαχείριση μαθητών', 'students'),
('students.add_new', 'el', 'Νέος μαθητής', 'students'),
('students.back_to_list', 'el', 'Πίσω στη λίστα', 'students'),
('students.search_placeholder', 'el', 'Αναζήτηση με όνομα, email ή τηλέφωνο...', 'students'),
('students.loading', 'el', 'Φόρτωση μαθητών...', 'students'),
('students.no_students', 'el', 'Δεν βρέθηκαν μαθητές. Κάντε κλικ στο «Νέος μαθητής».', 'students'),
('students.total', 'el', 'Σύνολο', 'students'),
('students.filtered', 'el', 'Φιλτραρισμένα', 'students'),
('students.form_add_title', 'el', 'Προσθήκη νέου μαθητή', 'students'),
('students.form_edit_title', 'el', 'Επεξεργασία μαθητή', 'students'),
('students.field_name', 'el', 'Όνομα', 'students'),
('students.field_email', 'el', 'Email', 'students'),
('students.field_whatsapp', 'el', 'WhatsApp', 'students'),
('students.field_pin', 'el', 'PIN (6 ψηφία)', 'students'),
('students.field_level', 'el', 'Επίπεδο', 'students'),
('students.field_difficulty', 'el', 'Δυσκολία', 'students'),
('students.placeholder_name', 'el', 'Πλήρες όνομα', 'students'),
('students.placeholder_email', 'el', 'email@example.com', 'students'),
('students.placeholder_whatsapp', 'el', '+30 123 456789', 'students'),
('students.pin_optional', 'el', 'αφήστε κενό για διατήρηση', 'students'),
('students.pin_digits', 'el', 'ψηφία', 'students'),
('students.diff_easy', 'el', 'Εύκολο', 'students'),
('students.diff_middle', 'el', 'Μέτριο', 'students'),
('students.diff_hard', 'el', 'Δύσκολο', 'students'),
('students.index_key_label', 'el', 'Δείκτης επίδοσης (αυτόματο)', 'students'),
('students.btn_create', 'el', 'Δημιουργία μαθητή', 'students'),
('students.btn_update', 'el', 'Αποθήκευση αλλαγών', 'students'),
('students.saving', 'el', 'Αποθήκευση...', 'students'),
('students.saved_success', 'el', 'Ο μαθητής δημιουργήθηκε!', 'students'),
('students.updated_success', 'el', 'Ο μαθητής ενημερώθηκε!', 'students'),
('students.deleted_success', 'el', 'Ο μαθητής διαγράφηκε.', 'students'),
('students.error_name_required', 'el', 'Το όνομα είναι υποχρεωτικό.', 'students'),
('students.error_pin_6', 'el', 'Το PIN πρέπει να έχει ακριβώς 6 ψηφία.', 'students'),
('students.error_save', 'el', 'Σφάλμα αποθήκευσης μαθητή', 'students'),
('students.error_delete', 'el', 'Σφάλμα διαγραφής μαθητή', 'students'),
('students.show_stats', 'el', 'Εμφάνιση προόδου', 'students'),
('students.stats_not_available', 'el', 'Στατιστικά μη διαθέσιμα', 'students'),
('students.stats_attempts', 'el', 'Προσπάθειες', 'students'),
('students.stats_correct_rate', 'el', 'Ποσοστό επιτυχίας', 'students'),
('students.stats_items_learned', 'el', 'Μαθημένα/Εξασκημένα', 'students'),
('students.stats_last_active', 'el', 'Τελευταία ενεργός', 'students'),
('students.generate_pin', 'el', 'Δημιουργία τυχαίου PIN', 'students'),

-- === METADATA ===
('meta.page_title', 'el', 'GreekLingua – Πίνακας μάθησης', 'meta'),
('meta.page_description', 'el', 'Μάθετε ελληνικά με διαστήματα επανάληψης', 'meta'),

-- === SUMMARY ===
('summary.correct_label', 'el', '{correct} σωστά / {wrong} λάθος ({percent} %)', 'summary')

ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value, context = EXCLUDED.context;

-- ============================================================
-- Verify
-- ============================================================
SELECT lang, COUNT(*) as total_keys FROM public.ui_translations GROUP BY lang ORDER BY lang;

DO $$ BEGIN RAISE NOTICE 'Griechische Uebersetzungen erfolgreich eingefuegt!'; END $$;
