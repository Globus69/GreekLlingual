-- ============================================================
-- Migration: Fehlende Dashboard-Uebersetzungen einfuegen
-- Aufgabe 25 – Alle hardcodierten UI-Texte der Main Page
-- Idempotent via ON CONFLICT DO UPDATE
-- ============================================================

-- 1. DashboardHeader – Flaggen-Tooltip
INSERT INTO ui_translations (key, lang, value, context) VALUES
    ('header.switch_to_ru', 'en', 'Switch to Russian', 'dashboard'),
    ('header.switch_to_ru', 'ru', 'Переключить на русский', 'dashboard'),
    ('header.switch_to_en', 'en', 'Switch to English', 'dashboard'),
    ('header.switch_to_en', 'ru', 'Переключить на английский', 'dashboard')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- 2. ActionGrid – Toast-Nachrichten
INSERT INTO ui_translations (key, lang, value, context) VALUES
    ('action_grid.toast_magic_round', 'en', 'Opening Your Lesson...', 'action_grid'),
    ('action_grid.toast_magic_round', 'ru', 'Открытие урока...', 'action_grid'),
    ('action_grid.toast_comprehension', 'en', 'Starting Comprehension...', 'action_grid'),
    ('action_grid.toast_comprehension', 'ru', 'Запуск упражнения на понимание...', 'action_grid'),
    ('action_grid.toast_exam', 'en', 'Starting Exam Test...', 'action_grid'),
    ('action_grid.toast_exam', 'ru', 'Запуск экзамена...', 'action_grid'),
    ('action_grid.toast_quick_lesson', 'en', 'Quick Lesson Started', 'action_grid'),
    ('action_grid.toast_quick_lesson', 'ru', 'Быстрый урок начат', 'action_grid'),
    ('action_grid.toast_game', 'en', 'Starting Game...', 'action_grid'),
    ('action_grid.toast_game', 'ru', 'Запуск игры...', 'action_grid'),
    ('action_grid.toast_test', 'en', 'Running Test...', 'action_grid'),
    ('action_grid.toast_test', 'ru', 'Запуск теста...', 'action_grid'),
    ('action_grid.toast_lesson', 'en', 'Lesson Started', 'action_grid'),
    ('action_grid.toast_lesson', 'ru', 'Урок начат', 'action_grid'),
    ('action_grid.toast_review', 'en', 'Review Vocabulary', 'action_grid'),
    ('action_grid.toast_review', 'ru', 'Повторение словаря', 'action_grid')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- 3. ModuleGrid – Alert-Text
INSERT INTO ui_translations (key, lang, value, context) VALUES
    ('modules.opening', 'en', 'Opening module: ', 'modules'),
    ('modules.opening', 'ru', 'Открытие модуля: ', 'modules')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- 4. StatsCard – Stunden-Suffix
INSERT INTO ui_translations (key, lang, value, context) VALUES
    ('stats.hours_suffix', 'en', 'h', 'stats'),
    ('stats.hours_suffix', 'ru', 'ч', 'stats')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

DO $$ BEGIN RAISE NOTICE 'Fehlende Dashboard-Uebersetzungen eingefuegt (12 Keys x 2 Sprachen = 24 Eintraege)'; END $$;
