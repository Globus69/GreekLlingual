-- ============================================================
-- Aufgabe 8: learning_items um russische Uebersetzung erweitern
-- ============================================================
-- Neue Spalte: russian TEXT (neben english)
-- Zweck: Frageseite der Lernkarten je nach UI-Sprache EN oder RU
-- Fallback: Wenn russian leer ist, wird english angezeigt
-- ============================================================

-- 1. Spalte hinzufuegen
ALTER TABLE learning_items ADD COLUMN IF NOT EXISTS russian TEXT;

-- 2. Kommentar zur Dokumentation
COMMENT ON COLUMN learning_items.russian IS 'Russian translation of the learning item (shown as question when UI is set to Russian). Falls back to english if NULL.';

-- 3. Beispiel-Daten: Russische Uebersetzungen fuer vorhandene Vokabeln einfuegen
-- (Nur ausfuehren wenn Daten vorhanden sind)

-- Vocabulary items
UPDATE learning_items SET russian = 'Привет' WHERE english = 'Hello' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'Спасибо' WHERE english = 'Thank you' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'Пожалуйста' WHERE english = 'Please' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'Да' WHERE english = 'Yes' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'Нет' WHERE english = 'No' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'Вода' WHERE english = 'Water' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'Кофе' WHERE english = 'Coffee' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'Друг' WHERE english = 'Friend' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'Доброе утро' WHERE english = 'Good morning' AND type = 'vocabulary';
UPDATE learning_items SET russian = 'До свидания' WHERE english = 'Goodbye' AND type = 'vocabulary';

-- Grammar items
UPDATE learning_items SET russian = 'Настоящее время – первое лицо' WHERE english = 'Present Tense - First Person' AND type = 'grammar';
UPDATE learning_items SET russian = 'Настоящее время – второе лицо' WHERE english = 'Present Tense - Second Person' AND type = 'grammar';
UPDATE learning_items SET russian = 'Настоящее время – третье лицо' WHERE english = 'Present Tense - Third Person' AND type = 'grammar';
UPDATE learning_items SET russian = 'Определённый артикль – мужской род' WHERE english = 'Definite Article - Masculine' AND type = 'grammar';
UPDATE learning_items SET russian = 'Определённый артикль – женский род' WHERE english = 'Definite Article - Feminine' AND type = 'grammar';
UPDATE learning_items SET russian = 'Определённый артикль – средний род' WHERE english = 'Definite Article - Neuter' AND type = 'grammar';
UPDATE learning_items SET russian = 'Множественное число – мужской род' WHERE english = 'Plural - Masculine' AND type = 'grammar';
UPDATE learning_items SET russian = 'Множественное число – женский род' WHERE english = 'Plural - Feminine' AND type = 'grammar';
UPDATE learning_items SET russian = 'Множественное число – средний род' WHERE english = 'Plural - Neuter' AND type = 'grammar';
UPDATE learning_items SET russian = 'Глагол "быть" – настоящее время' WHERE english = 'Verb "to be" - Present' AND type = 'grammar';

-- Comprehension items
UPDATE learning_items SET russian = 'Как тебя зовут?' WHERE english = 'What is your name?' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Как дела?' WHERE english = 'How are you?' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Откуда ты?' WHERE english = 'Where are you from?' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Я понимаю' WHERE english = 'I understand' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Я не понимаю' WHERE english = 'I don''t understand' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Можете повторить?' WHERE english = 'Can you repeat?' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Что это значит?' WHERE english = 'What does this mean?' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Можете говорить медленнее?' WHERE english = 'Can you speak slower?' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Мне нужна помощь' WHERE english = 'I need help' AND type = 'comprehension';
UPDATE learning_items SET russian = 'Это правильно' WHERE english = 'That''s correct' AND type = 'comprehension';

-- Listening items
UPDATE learning_items SET russian = 'Слушайте и выберите правильный ответ' WHERE english = 'Listen and choose the correct answer' AND type = 'listening';

-- ============================================================
-- Hinweis: Neue learning_items sollten immer auch russian befuellt werden.
-- Im Frontend wird bei locale='ru' zuerst russian angezeigt,
-- mit Fallback auf english wenn russian NULL ist.
-- ============================================================
