-- ============================================================
-- Testdaten: Lektionen fuer "Dein Unterricht" Dialog
-- Erstellt 8 Unterrichtssitzungen mit Vokabeln fuer ALLE User
-- Idempotent – kann beliebig oft ausgefuehrt werden
-- ============================================================

DO $$
DECLARE
    v_user RECORD;
    v_user_id UUID;
    v_sid1 UUID; v_sid2 UUID; v_sid3 UUID; v_sid4 UUID;
    v_sid5 UUID; v_sid6 UUID; v_sid7 UUID; v_sid8 UUID;
    v_count INTEGER := 0;
BEGIN
    -- Fuer JEDEN User in der Tabelle Lektionen erstellen
    FOR v_user IN SELECT id, name FROM public.users ORDER BY name LOOP

    v_user_id := v_user.id;
    v_count := v_count + 1;
    RAISE NOTICE '── Erstelle Lektionen fuer: % (ID: %)', v_user.name, v_user_id;

    -- ── Lektion 1: Begruessung (01.02.2026) ──────────────────
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_user_id, '2026-02-01', 'Begrüßung & Vorstellung')
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic
    RETURNING id INTO v_sid1;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_sid1;
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
        (v_sid1, 'Guten Morgen', 'Καλημέρα', 1),
        (v_sid1, 'Guten Tag', 'Καλησπέρα', 2),
        (v_sid1, 'Gute Nacht', 'Καληνύχτα', 3),
        (v_sid1, 'Hallo', 'Γεια σου', 4),
        (v_sid1, 'Tschüss', 'Αντίο', 5),
        (v_sid1, 'Wie heißt du?', 'Πώς σε λένε;', 6),
        (v_sid1, 'Ich heiße...', 'Με λένε...', 7),
        (v_sid1, 'Freut mich', 'Χαίρω πολύ', 8),
        (v_sid1, 'Woher kommst du?', 'Από πού είσαι;', 9),
        (v_sid1, 'Ich komme aus Deutschland', 'Είμαι από τη Γερμανία', 10);

    -- ── Lektion 2: Im Restaurant (02.02.2026) ────────────────
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_user_id, '2026-02-02', 'Im Restaurant bestellen')
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic
    RETURNING id INTO v_sid2;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_sid2;
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
        (v_sid2, 'Wasser', 'Νερό', 1),
        (v_sid2, 'Brot', 'Ψωμί', 2),
        (v_sid2, 'Salat', 'Σαλάτα', 3),
        (v_sid2, 'Fisch', 'Ψάρι', 4),
        (v_sid2, 'Fleisch', 'Κρέας', 5),
        (v_sid2, 'Die Rechnung bitte', 'Τον λογαριασμό παρακαλώ', 6),
        (v_sid2, 'Danke', 'Ευχαριστώ', 7),
        (v_sid2, 'Bitte', 'Παρακαλώ', 8),
        (v_sid2, 'Kaffee', 'Καφές', 9),
        (v_sid2, 'Wein', 'Κρασί', 10),
        (v_sid2, 'Speisekarte', 'Μενού', 11),
        (v_sid2, 'Lecker!', 'Νόστιμο!', 12);

    -- ── Lektion 3: Zahlen 1-20 (03.02.2026) ──────────────────
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_user_id, '2026-02-03', 'Zahlen 1–20')
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic
    RETURNING id INTO v_sid3;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_sid3;
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
        (v_sid3, 'eins', 'ένα', 1),
        (v_sid3, 'zwei', 'δύο', 2),
        (v_sid3, 'drei', 'τρία', 3),
        (v_sid3, 'vier', 'τέσσερα', 4),
        (v_sid3, 'fünf', 'πέντε', 5),
        (v_sid3, 'sechs', 'έξι', 6),
        (v_sid3, 'sieben', 'εφτά', 7),
        (v_sid3, 'acht', 'οχτώ', 8),
        (v_sid3, 'neun', 'εννιά', 9),
        (v_sid3, 'zehn', 'δέκα', 10),
        (v_sid3, 'fünfzehn', 'δεκαπέντε', 11),
        (v_sid3, 'zwanzig', 'είκοσι', 12);

    -- ── Lektion 4: Farben (04.02.2026) ───────────────────────
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_user_id, '2026-02-04', 'Farben & Beschreibungen')
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic
    RETURNING id INTO v_sid4;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_sid4;
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
        (v_sid4, 'rot', 'κόκκινο', 1),
        (v_sid4, 'blau', 'μπλε', 2),
        (v_sid4, 'grün', 'πράσινο', 3),
        (v_sid4, 'gelb', 'κίτρινο', 4),
        (v_sid4, 'weiß', 'άσπρο / λευκό', 5),
        (v_sid4, 'schwarz', 'μαύρο', 6),
        (v_sid4, 'groß', 'μεγάλο', 7),
        (v_sid4, 'klein', 'μικρό', 8),
        (v_sid4, 'schön', 'ωραίο', 9),
        (v_sid4, 'hässlich', 'άσχημο', 10);

    -- ── Lektion 5: Familie (05.02.2026) ──────────────────────
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_user_id, '2026-02-05', 'Familie & Verwandtschaft')
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic
    RETURNING id INTO v_sid5;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_sid5;
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
        (v_sid5, 'Mutter', 'Μητέρα / Μαμά', 1),
        (v_sid5, 'Vater', 'Πατέρας / Μπαμπάς', 2),
        (v_sid5, 'Bruder', 'Αδερφός', 3),
        (v_sid5, 'Schwester', 'Αδερφή', 4),
        (v_sid5, 'Sohn', 'Γιος', 5),
        (v_sid5, 'Tochter', 'Κόρη', 6),
        (v_sid5, 'Großmutter', 'Γιαγιά', 7),
        (v_sid5, 'Großvater', 'Παππούς', 8),
        (v_sid5, 'Ehemann', 'Σύζυγος (m)', 9),
        (v_sid5, 'Ehefrau', 'Σύζυγος (f)', 10),
        (v_sid5, 'Kind', 'Παιδί', 11),
        (v_sid5, 'Familie', 'Οικογένεια', 12);

    -- ── Lektion 6: Einkaufen (06.02.2026) ────────────────────
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_user_id, '2026-02-06', 'Einkaufen & Markt')
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic
    RETURNING id INTO v_sid6;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_sid6;
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
        (v_sid6, 'Wie viel kostet das?', 'Πόσο κάνει;', 1),
        (v_sid6, 'teuer', 'ακριβό', 2),
        (v_sid6, 'billig', 'φτηνό', 3),
        (v_sid6, 'Geld', 'Λεφτά / Χρήματα', 4),
        (v_sid6, 'Geschäft', 'Μαγαζί', 5),
        (v_sid6, 'Obst', 'Φρούτα', 6),
        (v_sid6, 'Gemüse', 'Λαχανικά', 7),
        (v_sid6, 'Milch', 'Γάλα', 8),
        (v_sid6, 'Eier', 'Αυγά', 9),
        (v_sid6, 'Käse', 'Τυρί', 10);

    -- ── Lektion 7: Wochentage & Uhrzeit (07.02.2026) ─────────
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_user_id, '2026-02-07', 'Wochentage & Uhrzeit')
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic
    RETURNING id INTO v_sid7;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_sid7;
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
        (v_sid7, 'Montag', 'Δευτέρα', 1),
        (v_sid7, 'Dienstag', 'Τρίτη', 2),
        (v_sid7, 'Mittwoch', 'Τετάρτη', 3),
        (v_sid7, 'Donnerstag', 'Πέμπτη', 4),
        (v_sid7, 'Freitag', 'Παρασκευή', 5),
        (v_sid7, 'Samstag', 'Σάββατο', 6),
        (v_sid7, 'Sonntag', 'Κυριακή', 7),
        (v_sid7, 'Wie spät ist es?', 'Τι ώρα είναι;', 8),
        (v_sid7, 'Uhr', 'Ρολόι', 9),
        (v_sid7, 'heute', 'σήμερα', 10),
        (v_sid7, 'morgen', 'αύριο', 11),
        (v_sid7, 'gestern', 'χτες', 12);

    -- ── Lektion 8: Wegbeschreibung (08.02.2026 = HEUTE) ──────
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_user_id, '2026-02-08', 'Wegbeschreibung & Orientierung')
    ON CONFLICT (student_id, date) DO UPDATE SET topic = EXCLUDED.topic
    RETURNING id INTO v_sid8;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_sid8;
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
        (v_sid8, 'links', 'αριστερά', 1),
        (v_sid8, 'rechts', 'δεξιά', 2),
        (v_sid8, 'geradeaus', 'ευθεία', 3),
        (v_sid8, 'Straße', 'Δρόμος', 4),
        (v_sid8, 'Platz', 'Πλατεία', 5),
        (v_sid8, 'Wo ist...?', 'Πού είναι...;', 6),
        (v_sid8, 'nah', 'κοντά', 7),
        (v_sid8, 'weit', 'μακριά', 8),
        (v_sid8, 'Apotheke', 'Φαρμακείο', 9),
        (v_sid8, 'Krankenhaus', 'Νοσοκομείο', 10),
        (v_sid8, 'Flughafen', 'Αεροδρόμιο', 11),
        (v_sid8, 'Strand', 'Παραλία', 12);

    END LOOP; -- Ende der User-Schleife

    IF v_count = 0 THEN
        RAISE NOTICE '⚠️ Keine User gefunden! Bitte zuerst 00_bootstrap_all.sql ausfuehren.';
        RETURN;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════╗';
    RAISE NOTICE '║  Testlektionen erstellt!                      ║';
    RAISE NOTICE '║  Fuer % User(s), je 8 Lektionen             ', v_count;
    RAISE NOTICE '║                                                ║';
    RAISE NOTICE '║  01.02. Begrüßung & Vorstellung (10 Wörter)   ║';
    RAISE NOTICE '║  02.02. Im Restaurant bestellen (12 Wörter)   ║';
    RAISE NOTICE '║  03.02. Zahlen 1–20 (12 Wörter)               ║';
    RAISE NOTICE '║  04.02. Farben & Beschreibungen (10 Wörter)   ║';
    RAISE NOTICE '║  05.02. Familie & Verwandtschaft (12 Wörter)  ║';
    RAISE NOTICE '║  06.02. Einkaufen & Markt (10 Wörter)         ║';
    RAISE NOTICE '║  07.02. Wochentage & Uhrzeit (12 Wörter)      ║';
    RAISE NOTICE '║  08.02. Wegbeschreibung (12 Wörter) – HEUTE   ║';
    RAISE NOTICE '╚════════════════════════════════════════════════╝';

END $$;
