-- ============================================================
-- Demo-Daten: 3 Unterrichtstage fuer Schuelerin "Susi"
-- Tabellen: lesson_sessions + lesson_vocabulary
-- Idempotent – kann beliebig oft ausgefuehrt werden
-- ============================================================

DO $$
DECLARE
    v_student_id UUID;
    v_session_id_1 UUID;
    v_session_id_2 UUID;
    v_session_id_3 UUID;
BEGIN
    -- Susi's User-ID ermitteln
    SELECT id INTO v_student_id
    FROM public.users
    WHERE LOWER(name) = 'susi'
    LIMIT 1;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Schuelerin "Susi" nicht gefunden! Bitte zuerst in der Schueler-Verwaltung anlegen.';
    END IF;

    RAISE NOTICE 'Susi gefunden: %', v_student_id;

    -- =====================================================
    -- TAG 1: 03.02.2025 – Begruessung & Vorstellung
    -- =====================================================
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_student_id, '2025-02-03', 'Begrüßung & Vorstellung')
    ON CONFLICT (student_id, date)
    DO UPDATE SET topic = EXCLUDED.topic, updated_at = now()
    RETURNING id INTO v_session_id_1;

    -- Alte Vokabeln dieser Sitzung loeschen (Idempotenz)
    DELETE FROM public.lesson_vocabulary WHERE session_id = v_session_id_1;

    -- Vokabeln Tag 1
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
    (v_session_id_1, 'Hallo', 'Γεια σου', 1),
    (v_session_id_1, 'Guten Morgen', 'Καλημέρα', 2),
    (v_session_id_1, 'Guten Abend', 'Καλησπέρα', 3),
    (v_session_id_1, 'Gute Nacht', 'Καληνύχτα', 4),
    (v_session_id_1, 'Wie heißt du?', 'Πώς σε λένε;', 5),
    (v_session_id_1, 'Ich heiße...', 'Με λένε...', 6),
    (v_session_id_1, 'Freut mich', 'Χαίρω πολύ', 7),
    (v_session_id_1, 'Wie geht es dir?', 'Τι κάνεις;', 8),
    (v_session_id_1, 'Mir geht es gut', 'Είμαι καλά', 9),
    (v_session_id_1, 'Danke', 'Ευχαριστώ', 10),
    (v_session_id_1, 'Bitte', 'Παρακαλώ', 11),
    (v_session_id_1, 'Tschüss', 'Αντίο', 12);

    RAISE NOTICE 'Tag 1 eingefuegt: 03.02.2025 – Begruessung & Vorstellung (12 Vokabeln)';

    -- =====================================================
    -- TAG 2: 05.02.2025 – Im Restaurant bestellen
    -- =====================================================
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_student_id, '2025-02-05', 'Im Restaurant bestellen')
    ON CONFLICT (student_id, date)
    DO UPDATE SET topic = EXCLUDED.topic, updated_at = now()
    RETURNING id INTO v_session_id_2;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_session_id_2;

    -- Vokabeln Tag 2
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
    (v_session_id_2, 'Wasser', 'Νερό', 1),
    (v_session_id_2, 'Brot', 'Ψωμί', 2),
    (v_session_id_2, 'Salat', 'Σαλάτα', 3),
    (v_session_id_2, 'Fisch', 'Ψάρι', 4),
    (v_session_id_2, 'Fleisch', 'Κρέας', 5),
    (v_session_id_2, 'Rechnung bitte', 'Τον λογαριασμό, παρακαλώ', 6),
    (v_session_id_2, 'Ich möchte...', 'Θα ήθελα...', 7),
    (v_session_id_2, 'Speisekarte', 'Μενού', 8),
    (v_session_id_2, 'Kaffee', 'Καφές', 9),
    (v_session_id_2, 'Wein', 'Κρασί', 10),
    (v_session_id_2, 'Es schmeckt gut', 'Είναι νόστιμο', 11),
    (v_session_id_2, 'Prost!', 'Στην υγειά μας!', 12),
    (v_session_id_2, 'Olivenöl', 'Ελαιόλαδο', 13),
    (v_session_id_2, 'Käse', 'Τυρί', 14),
    (v_session_id_2, 'Teller', 'Πιάτο', 15);

    RAISE NOTICE 'Tag 2 eingefuegt: 05.02.2025 – Im Restaurant bestellen (15 Vokabeln)';

    -- =====================================================
    -- TAG 3: 08.02.2025 – Farben, Zahlen & Einkaufen
    -- =====================================================
    INSERT INTO public.lesson_sessions (student_id, date, topic)
    VALUES (v_student_id, '2025-02-08', 'Farben, Zahlen & Einkaufen')
    ON CONFLICT (student_id, date)
    DO UPDATE SET topic = EXCLUDED.topic, updated_at = now()
    RETURNING id INTO v_session_id_3;

    DELETE FROM public.lesson_vocabulary WHERE session_id = v_session_id_3;

    -- Vokabeln Tag 3
    INSERT INTO public.lesson_vocabulary (session_id, source_word, greek_word, sort_order) VALUES
    (v_session_id_3, 'Eins', 'Ένα', 1),
    (v_session_id_3, 'Zwei', 'Δύο', 2),
    (v_session_id_3, 'Drei', 'Τρία', 3),
    (v_session_id_3, 'Vier', 'Τέσσερα', 4),
    (v_session_id_3, 'Fünf', 'Πέντε', 5),
    (v_session_id_3, 'Rot', 'Κόκκινο', 6),
    (v_session_id_3, 'Blau', 'Μπλε', 7),
    (v_session_id_3, 'Grün', 'Πράσινο', 8),
    (v_session_id_3, 'Weiß', 'Άσπρο', 9),
    (v_session_id_3, 'Schwarz', 'Μαύρο', 10),
    (v_session_id_3, 'Wie viel kostet das?', 'Πόσο κάνει;', 11),
    (v_session_id_3, 'Teuer', 'Ακριβό', 12),
    (v_session_id_3, 'Günstig', 'Φτηνό', 13),
    (v_session_id_3, 'Ich kaufe es', 'Θα το αγοράσω', 14),
    (v_session_id_3, 'Geschäft / Laden', 'Μαγαζί', 15),
    (v_session_id_3, 'Geld', 'Λεφτά', 16),
    (v_session_id_3, 'Gelb', 'Κίτρινο', 17),
    (v_session_id_3, 'Größe', 'Μέγεθος', 18);

    RAISE NOTICE 'Tag 3 eingefuegt: 08.02.2025 – Farben, Zahlen & Einkaufen (18 Vokabeln)';
    RAISE NOTICE '=== FERTIG: 3 Unterrichtstage mit insgesamt 45 Vokabeln fuer Susi eingefuegt ===';

END $$;
