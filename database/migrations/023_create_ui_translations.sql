-- ============================================================
-- UI Translations Table for HellenicHorizons GreekLingua
-- Supports: English (en) + Russian (ru)
-- Created: 2026-02-08
-- ============================================================

-- Drop table if exists (for re-running during development)
DROP TABLE IF EXISTS public.ui_translations;

-- Create the ui_translations table
CREATE TABLE public.ui_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL,
    lang TEXT NOT NULL CHECK (lang IN ('en', 'ru')),
    value TEXT NOT NULL,
    context TEXT,  -- optional: which component/page uses this key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(key, lang)
);

-- Create index for fast lookups by language
CREATE INDEX idx_ui_translations_lang ON public.ui_translations(lang);
CREATE INDEX idx_ui_translations_key ON public.ui_translations(key);

-- Enable RLS
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow read access for everyone (anon + authenticated)
CREATE POLICY "Allow public read access to ui_translations"
ON public.ui_translations
FOR SELECT
USING (true);

-- ============================================================
-- INSERT TRANSLATIONS: ENGLISH (en)
-- ============================================================

INSERT INTO public.ui_translations (key, lang, value, context) VALUES

-- === LOGIN PAGE ===
('login.title', 'en', 'GreekLingua', 'login'),
('login.subtitle', 'en', 'Enter your details to continue learning', 'login'),
('login.email_placeholder', 'en', 'Email', 'login'),
('login.pin_placeholder', 'en', '6-Digit PIN', 'login'),
('login.submit', 'en', 'Sign In', 'login'),
('login.submitting', 'en', 'Signing in...', 'login'),
('login.error', 'en', 'Invalid email or PIN. Please try again.', 'login'),
('login.biometric', 'en', 'Use FaceID / TouchID', 'login'),
('login.language_label', 'en', 'Language', 'login'),

-- === DASHBOARD - HEADER ===
('header.brand', 'en', 'GreekLingua', 'dashboard'),
('header.hub_suffix', 'en', '''s Hub', 'dashboard'),

-- === DASHBOARD - LOADING ===
('dashboard.authenticating', 'en', 'Authenticating...', 'dashboard'),
('dashboard.loading', 'en', 'Loading GreekLingua...', 'dashboard'),

-- === DASHBOARD - WELCOME ===
('dashboard.welcome', 'en', 'Welcome back, {name}!', 'dashboard'),
('dashboard.welcome_subtitle', 'en', 'Ready to continue your journey? You have <b>{count} new vocabulary cards</b> waiting for review today.', 'dashboard'),

-- === DASHBOARD - STATS CARD ===
('stats.current_level', 'en', 'Current Level', 'stats'),
('stats.days', 'en', 'Days', 'stats'),
('stats.vocabs', 'en', 'Vocabs', 'stats'),
('stats.learned', 'en', 'Learned', 'stats'),
('stats.today', 'en', 'Today:', 'stats'),
('stats.daily_goal_default', 'en', '12 new vocabs & 1 short text.', 'stats'),

-- === DASHBOARD - MASTERY BOX ===
('mastery.title', 'en', 'Learning Mastery', 'mastery'),
('mastery.total_time', 'en', 'Total time spent learning: {hours} hours', 'mastery'),
('mastery.last_test', 'en', 'Last Test', 'mastery'),
('mastery.actual_test', 'en', 'Actual Test', 'mastery'),
('mastery.last_exam', 'en', 'Last Exam', 'mastery'),
('mastery.vocab_progress', 'en', '<b>{learned} / {total}</b> Vocabulary confidently – {remaining} require attention', 'mastery'),
('mastery.suggestion', 'en', 'Suggestion for today: {suggestion}', 'mastery'),
('mastery.suggestion_default', 'en', '12 new vocabulary cards + 1 short text about Cyprus.', 'mastery'),

-- === DASHBOARD - ACTION TILES (4x4 Grid) ===
('action.magic_round', 'en', 'Your Lesson', 'actions'),
('action.quick_lesson', 'en', '20 min Quick Lesson', 'actions'),
('action.daily_phrases', 'en', 'Daily Phrases', 'actions'),
('action.short_stories', 'en', 'Short Stories', 'actions'),
('action.train_weak', 'en', 'Train Weak Words', 'actions'),
('action.review_vocab', 'en', 'Review Vocabulary', 'actions'),
('action.due_cards', 'en', 'Due Cards Today', 'actions'),
('action.grammar_hits', 'en', 'Grammar Quick Hits', 'actions'),
('action.listening', 'en', 'Listening Practice', 'actions'),
('action.pronunciation', 'en', 'Pronunciation Trainer', 'actions'),
('action.comprehension', 'en', 'Comprehension', 'actions'),
('action.audio_immersion', 'en', 'Audio Immersion', 'actions'),
('action.test', 'en', 'Test', 'actions'),
('action.cyprus_exam', 'en', 'Cyprus Exam Sim', 'actions'),
('action.book_recs', 'en', 'Book Recommendations', 'actions'),
('action.progress_history', 'en', 'Progress History', 'actions'),

-- === VOCABULARY DIALOG ===
('vocab.loading', 'en', 'Loading...', 'vocab_dialog'),
('vocab.loading_subtitle', 'en', 'Fetching vocabulary from database...', 'vocab_dialog'),
('vocab.login_required', 'en', 'Login Required', 'vocab_dialog'),
('vocab.login_required_msg', 'en', 'Please log in to access vocabulary learning features.', 'vocab_dialog'),
('vocab.no_items', 'en', 'No Vocabulary Found', 'vocab_dialog'),
('vocab.no_items_msg', 'en', 'No vocabulary items available for this mode.', 'vocab_dialog'),
('vocab.error', 'en', 'Error', 'vocab_dialog'),
('vocab.error_msg', 'en', 'Unable to load vocabulary card.', 'vocab_dialog'),
('vocab.session_complete', 'en', 'Session complete!', 'vocab_dialog'),
('vocab.correct', 'en', 'Correct', 'vocab_dialog'),
('vocab.wrong', 'en', 'Wrong', 'vocab_dialog'),
('vocab.back_to_dashboard', 'en', 'Back to Dashboard', 'vocab_dialog'),
('vocab.progress_saved', 'en', 'Progress saved – well done!', 'vocab_dialog'),
('vocab.result_saved', 'en', 'Result saved - well done!', 'vocab_dialog'),

-- === VOCABULARY DIALOG - MODE TITLES ===
('vocab.mode.weak_title', 'en', 'Train Weak Words', 'vocab_dialog'),
('vocab.mode.weak_subtitle', 'en', 'Let''s strengthen these', 'vocab_dialog'),
('vocab.mode.due_title', 'en', 'Due Cards Today', 'vocab_dialog'),
('vocab.mode.due_subtitle', 'en', 'Your daily reviews', 'vocab_dialog'),
('vocab.mode.review_title', 'en', 'Review Vocabulary', 'vocab_dialog'),
('vocab.mode.review_subtitle', 'en', 'Refresh your knowledge', 'vocab_dialog'),

-- === GRAMMAR DIALOG ===
('grammar.loading_subtitle', 'en', 'Fetching grammar from database...', 'grammar_dialog'),
('grammar.login_required_msg', 'en', 'Please log in to access grammar learning features.', 'grammar_dialog'),
('grammar.no_items', 'en', 'No Grammar Found', 'grammar_dialog'),
('grammar.no_items_msg', 'en', 'No grammar items available for this mode.', 'grammar_dialog'),
('grammar.error_msg', 'en', 'Unable to load grammar card.', 'grammar_dialog'),
('grammar.mode.weak_title', 'en', 'Train Weak Grammar', 'grammar_dialog'),
('grammar.mode.due_title', 'en', 'Due Grammar Today', 'grammar_dialog'),
('grammar.mode.review_title', 'en', 'Grammar Quick Hits', 'grammar_dialog'),
('grammar.mode.review_subtitle', 'en', 'Refresh your grammar', 'grammar_dialog'),

-- === COMPREHENSION DIALOG ===
('comprehension.loading_subtitle', 'en', 'Fetching comprehension from database...', 'comprehension_dialog'),
('comprehension.login_required_msg', 'en', 'Please log in to access comprehension learning features.', 'comprehension_dialog'),
('comprehension.no_items', 'en', 'No Comprehension Found', 'comprehension_dialog'),
('comprehension.no_items_msg', 'en', 'No comprehension items available for this mode.', 'comprehension_dialog'),
('comprehension.error_msg', 'en', 'Unable to load comprehension card.', 'comprehension_dialog'),
('comprehension.mode.weak_title', 'en', 'Train Weak Comprehension', 'comprehension_dialog'),
('comprehension.mode.due_title', 'en', 'Due Comprehension Today', 'comprehension_dialog'),
('comprehension.mode.review_title', 'en', 'Comprehension', 'comprehension_dialog'),
('comprehension.mode.review_subtitle', 'en', 'Train your understanding', 'comprehension_dialog'),

-- === LISTENING DIALOG ===
('listening.loading_subtitle', 'en', 'Fetching listening exercises from database...', 'listening_dialog'),
('listening.login_required_msg', 'en', 'Please log in to access listening practice features.', 'listening_dialog'),
('listening.no_items', 'en', 'No Listening Exercises Found', 'listening_dialog'),
('listening.no_items_msg', 'en', 'No listening exercises available for this mode.', 'listening_dialog'),
('listening.error_msg', 'en', 'Unable to load listening exercise.', 'listening_dialog'),
('listening.play_audio', 'en', 'Play Audio', 'listening_dialog'),
('listening.no_audio', 'en', '(Demo: No audio file available)', 'listening_dialog'),
('listening.correct_answer', 'en', 'Correct! Very good!', 'listening_dialog'),
('listening.wrong_answer', 'en', 'Wrong. The correct answer is: "{answer}"', 'listening_dialog'),
('listening.next', 'en', 'Next', 'listening_dialog'),
('listening.mode.weak_title', 'en', 'Train Weak Listening', 'listening_dialog'),
('listening.mode.due_title', 'en', 'Due Listening Today', 'listening_dialog'),
('listening.mode.review_title', 'en', 'Listening Practice', 'listening_dialog'),
('listening.mode.review_subtitle', 'en', 'Listen and choose the correct answer', 'listening_dialog'),

-- === SHARED DIALOG BUTTONS ===
('btn.hard', 'en', 'Hard', 'shared'),
('btn.good', 'en', 'Good', 'shared'),
('btn.easy', 'en', 'Easy', 'shared'),
('btn.audio', 'en', 'Audio', 'shared'),
('btn.restart', 'en', 'Restart', 'shared'),
('btn.cancel', 'en', 'Cancel', 'shared'),
('btn.audio_tooltip', 'en', 'Listen to Greek pronunciation', 'shared'),

-- === FLASHCARD COMPONENT ===
('flashcard.label_source', 'en', 'ENGLISH', 'flashcard'),
('flashcard.label_target', 'en', 'ΕΛΛΗΝΙΚΑ', 'flashcard'),
('flashcard.flip_hint', 'en', 'Click to flip', 'flashcard'),
('flashcard.tap_hint', 'en', 'Tap the card to reveal translation, then rate your performance.', 'flashcard'),

-- === SHARED - MODE SUBTITLES ===
('mode.weak_subtitle', 'en', 'Let''s strengthen these', 'shared'),
('mode.due_subtitle', 'en', 'Your daily reviews', 'shared'),

-- === PERFORMANCE HUB ===
('perf.title', 'en', 'Learning Mastery', 'performance'),
('perf.subtitle', 'en', 'Performance Hub', 'performance'),
('perf.this_week', 'en', '+12% this week', 'performance'),
('perf.total_active', 'en', 'Total active vocabs:', 'performance'),
('perf.target', 'en', 'Target: 250/month', 'performance'),

-- === MODULE GRID ===
('module.vokabeln', 'en', 'Vocabulary', 'modules'),
('module.phrases', 'en', 'Phrases', 'modules'),
('module.quiz', 'en', 'Quiz', 'modules'),
('module.cyprus', 'en', 'Cyprus', 'modules'),
('module.video', 'en', 'Video Class', 'modules'),
('module.audio', 'en', 'Audio', 'modules'),
('module.library', 'en', 'Library', 'modules'),
('module.stories', 'en', 'Stories', 'modules'),
('module.sub.due', 'en', '12 Due', 'modules'),
('module.sub.travel', 'en', 'Travel', 'modules'),
('module.sub.reading', 'en', 'Reading', 'modules'),
('module.sub.exam_prep', 'en', 'Exam Prep', 'modules'),
('module.sub.short_stories', 'en', 'Short Stories', 'modules'),

-- === ACTION GRID (Legacy 3x3) ===
('actiongrid.magic_round', 'en', 'Your Lesson', 'action_grid'),
('actiongrid.comprehension', 'en', 'Comprehension', 'action_grid'),
('actiongrid.exam_test', 'en', 'Exam Test', 'action_grid'),
('actiongrid.quick_lesson', 'en', '20 min Quick Lesson', 'action_grid'),
('actiongrid.game', 'en', 'Game', 'action_grid'),
('actiongrid.test', 'en', 'Test', 'action_grid'),
('actiongrid.lesson_today', 'en', 'Lesson Today', 'action_grid'),
('actiongrid.repeat_vocab', 'en', 'Repeat Vocabulary', 'action_grid'),
('actiongrid.print', 'en', 'Print', 'action_grid'),

-- === SUMMARY STATS (shared across all dialogs) ===
('summary.correct_label', 'en', '{correct} correct / {wrong} wrong ({percent} %)', 'summary'),

-- === METADATA ===
('meta.page_title', 'en', 'GreekLingua Dashboard', 'meta'),
('meta.page_description', 'en', 'Master Greek with Spaced Repetition', 'meta');


-- ============================================================
-- INSERT TRANSLATIONS: RUSSIAN (ru)
-- ============================================================

INSERT INTO public.ui_translations (key, lang, value, context) VALUES

-- === LOGIN PAGE ===
('login.title', 'ru', 'GreekLingua', 'login'),
('login.subtitle', 'ru', 'Введите данные для продолжения обучения', 'login'),
('login.email_placeholder', 'ru', 'Электронная почта', 'login'),
('login.pin_placeholder', 'ru', '6-значный PIN', 'login'),
('login.submit', 'ru', 'Войти', 'login'),
('login.submitting', 'ru', 'Вход...', 'login'),
('login.error', 'ru', 'Неверный email или PIN. Попробуйте ещё раз.', 'login'),
('login.biometric', 'ru', 'Использовать FaceID / TouchID', 'login'),
('login.language_label', 'ru', 'Язык', 'login'),

-- === DASHBOARD - HEADER ===
('header.brand', 'ru', 'GreekLingua', 'dashboard'),
('header.hub_suffix', 'ru', ' – Панель', 'dashboard'),

-- === DASHBOARD - LOADING ===
('dashboard.authenticating', 'ru', 'Авторизация...', 'dashboard'),
('dashboard.loading', 'ru', 'Загрузка GreekLingua...', 'dashboard'),

-- === DASHBOARD - WELCOME ===
('dashboard.welcome', 'ru', 'С возвращением, {name}!', 'dashboard'),
('dashboard.welcome_subtitle', 'ru', 'Готовы продолжить обучение? Сегодня вас ждут <b>{count} новых карточек</b> для повторения.', 'dashboard'),

-- === DASHBOARD - STATS CARD ===
('stats.current_level', 'ru', 'Текущий уровень', 'stats'),
('stats.days', 'ru', 'Дней', 'stats'),
('stats.vocabs', 'ru', 'Слова', 'stats'),
('stats.learned', 'ru', 'Изучено', 'stats'),
('stats.today', 'ru', 'Сегодня:', 'stats'),
('stats.daily_goal_default', 'ru', '12 новых слов и 1 короткий текст.', 'stats'),

-- === DASHBOARD - MASTERY BOX ===
('mastery.title', 'ru', 'Уровень владения', 'mastery'),
('mastery.total_time', 'ru', 'Общее время обучения: {hours} часов', 'mastery'),
('mastery.last_test', 'ru', 'Последний тест', 'mastery'),
('mastery.actual_test', 'ru', 'Текущий тест', 'mastery'),
('mastery.last_exam', 'ru', 'Последний экзамен', 'mastery'),
('mastery.vocab_progress', 'ru', '<b>{learned} / {total}</b> слов уверенно – {remaining} требуют внимания', 'mastery'),
('mastery.suggestion', 'ru', 'Предложение на сегодня: {suggestion}', 'mastery'),
('mastery.suggestion_default', 'ru', '12 новых карточек + 1 короткий текст о Кипре.', 'mastery'),

-- === DASHBOARD - ACTION TILES (4x4 Grid) ===
('action.magic_round', 'ru', 'Твой урок', 'actions'),
('action.quick_lesson', 'ru', 'Быстрый урок 20 мин', 'actions'),
('action.daily_phrases', 'ru', 'Фразы дня', 'actions'),
('action.short_stories', 'ru', 'Короткие рассказы', 'actions'),
('action.train_weak', 'ru', 'Тренировка слабых слов', 'actions'),
('action.review_vocab', 'ru', 'Повторение слов', 'actions'),
('action.due_cards', 'ru', 'Карточки на сегодня', 'actions'),
('action.grammar_hits', 'ru', 'Грамматика', 'actions'),
('action.listening', 'ru', 'Аудирование', 'actions'),
('action.pronunciation', 'ru', 'Тренажёр произношения', 'actions'),
('action.comprehension', 'ru', 'Понимание', 'actions'),
('action.audio_immersion', 'ru', 'Аудио-погружение', 'actions'),
('action.test', 'ru', 'Тест', 'actions'),
('action.cyprus_exam', 'ru', 'Симуляция экзамена Кипр', 'actions'),
('action.book_recs', 'ru', 'Рекомендации книг', 'actions'),
('action.progress_history', 'ru', 'История прогресса', 'actions'),

-- === VOCABULARY DIALOG ===
('vocab.loading', 'ru', 'Загрузка...', 'vocab_dialog'),
('vocab.loading_subtitle', 'ru', 'Загрузка словаря из базы данных...', 'vocab_dialog'),
('vocab.login_required', 'ru', 'Требуется авторизация', 'vocab_dialog'),
('vocab.login_required_msg', 'ru', 'Пожалуйста, войдите для доступа к функциям изучения слов.', 'vocab_dialog'),
('vocab.no_items', 'ru', 'Слова не найдены', 'vocab_dialog'),
('vocab.no_items_msg', 'ru', 'Нет доступных слов для этого режима.', 'vocab_dialog'),
('vocab.error', 'ru', 'Ошибка', 'vocab_dialog'),
('vocab.error_msg', 'ru', 'Не удалось загрузить карточку.', 'vocab_dialog'),
('vocab.session_complete', 'ru', 'Сессия завершена!', 'vocab_dialog'),
('vocab.correct', 'ru', 'Правильно', 'vocab_dialog'),
('vocab.wrong', 'ru', 'Неправильно', 'vocab_dialog'),
('vocab.back_to_dashboard', 'ru', 'Вернуться на панель', 'vocab_dialog'),
('vocab.progress_saved', 'ru', 'Прогресс сохранён – отлично!', 'vocab_dialog'),
('vocab.result_saved', 'ru', 'Результат сохранён – молодец!', 'vocab_dialog'),

-- === VOCABULARY DIALOG - MODE TITLES ===
('vocab.mode.weak_title', 'ru', 'Тренировка слабых слов', 'vocab_dialog'),
('vocab.mode.weak_subtitle', 'ru', 'Давайте их укрепим', 'vocab_dialog'),
('vocab.mode.due_title', 'ru', 'Карточки на сегодня', 'vocab_dialog'),
('vocab.mode.due_subtitle', 'ru', 'Ваши ежедневные повторения', 'vocab_dialog'),
('vocab.mode.review_title', 'ru', 'Повторение слов', 'vocab_dialog'),
('vocab.mode.review_subtitle', 'ru', 'Освежите свои знания', 'vocab_dialog'),

-- === GRAMMAR DIALOG ===
('grammar.loading_subtitle', 'ru', 'Загрузка грамматики из базы данных...', 'grammar_dialog'),
('grammar.login_required_msg', 'ru', 'Пожалуйста, войдите для доступа к грамматике.', 'grammar_dialog'),
('grammar.no_items', 'ru', 'Грамматика не найдена', 'grammar_dialog'),
('grammar.no_items_msg', 'ru', 'Нет доступных грамматических тем для этого режима.', 'grammar_dialog'),
('grammar.error_msg', 'ru', 'Не удалось загрузить грамматическую карточку.', 'grammar_dialog'),
('grammar.mode.weak_title', 'ru', 'Тренировка слабой грамматики', 'grammar_dialog'),
('grammar.mode.due_title', 'ru', 'Грамматика на сегодня', 'grammar_dialog'),
('grammar.mode.review_title', 'ru', 'Грамматика', 'grammar_dialog'),
('grammar.mode.review_subtitle', 'ru', 'Освежите грамматику', 'grammar_dialog'),

-- === COMPREHENSION DIALOG ===
('comprehension.loading_subtitle', 'ru', 'Загрузка упражнений на понимание...', 'comprehension_dialog'),
('comprehension.login_required_msg', 'ru', 'Пожалуйста, войдите для доступа к упражнениям на понимание.', 'comprehension_dialog'),
('comprehension.no_items', 'ru', 'Упражнения не найдены', 'comprehension_dialog'),
('comprehension.no_items_msg', 'ru', 'Нет доступных упражнений для этого режима.', 'comprehension_dialog'),
('comprehension.error_msg', 'ru', 'Не удалось загрузить карточку.', 'comprehension_dialog'),
('comprehension.mode.weak_title', 'ru', 'Тренировка слабого понимания', 'comprehension_dialog'),
('comprehension.mode.due_title', 'ru', 'Понимание на сегодня', 'comprehension_dialog'),
('comprehension.mode.review_title', 'ru', 'Понимание', 'comprehension_dialog'),
('comprehension.mode.review_subtitle', 'ru', 'Тренируйте понимание', 'comprehension_dialog'),

-- === LISTENING DIALOG ===
('listening.loading_subtitle', 'ru', 'Загрузка аудио-упражнений...', 'listening_dialog'),
('listening.login_required_msg', 'ru', 'Пожалуйста, войдите для доступа к аудированию.', 'listening_dialog'),
('listening.no_items', 'ru', 'Аудио-упражнения не найдены', 'listening_dialog'),
('listening.no_items_msg', 'ru', 'Нет доступных аудио-упражнений для этого режима.', 'listening_dialog'),
('listening.error_msg', 'ru', 'Не удалось загрузить аудио-упражнение.', 'listening_dialog'),
('listening.play_audio', 'ru', 'Воспроизвести аудио', 'listening_dialog'),
('listening.no_audio', 'ru', '(Демо: Аудиофайл недоступен)', 'listening_dialog'),
('listening.correct_answer', 'ru', 'Правильно! Отлично!', 'listening_dialog'),
('listening.wrong_answer', 'ru', 'Неправильно. Правильный ответ: «{answer}»', 'listening_dialog'),
('listening.next', 'ru', 'Далее', 'listening_dialog'),
('listening.mode.weak_title', 'ru', 'Тренировка слабого аудирования', 'listening_dialog'),
('listening.mode.due_title', 'ru', 'Аудирование на сегодня', 'listening_dialog'),
('listening.mode.review_title', 'ru', 'Аудирование', 'listening_dialog'),
('listening.mode.review_subtitle', 'ru', 'Слушайте и выберите правильный ответ', 'listening_dialog'),

-- === SHARED DIALOG BUTTONS ===
('btn.hard', 'ru', 'Сложно', 'shared'),
('btn.good', 'ru', 'Хорошо', 'shared'),
('btn.easy', 'ru', 'Легко', 'shared'),
('btn.audio', 'ru', 'Аудио', 'shared'),
('btn.restart', 'ru', 'Заново', 'shared'),
('btn.cancel', 'ru', 'Отмена', 'shared'),
('btn.audio_tooltip', 'ru', 'Послушать греческое произношение', 'shared'),

-- === FLASHCARD COMPONENT ===
('flashcard.label_source', 'ru', 'АНГЛИЙСКИЙ', 'flashcard'),
('flashcard.label_target', 'ru', 'ΕΛΛΗΝΙΚΑ', 'flashcard'),
('flashcard.flip_hint', 'ru', 'Нажмите, чтобы перевернуть', 'flashcard'),
('flashcard.tap_hint', 'ru', 'Нажмите на карточку, чтобы увидеть перевод, затем оцените себя.', 'flashcard'),

-- === SHARED - MODE SUBTITLES ===
('mode.weak_subtitle', 'ru', 'Давайте их укрепим', 'shared'),
('mode.due_subtitle', 'ru', 'Ваши ежедневные повторения', 'shared'),

-- === PERFORMANCE HUB ===
('perf.title', 'ru', 'Уровень владения', 'performance'),
('perf.subtitle', 'ru', 'Центр успеваемости', 'performance'),
('perf.this_week', 'ru', '+12% на этой неделе', 'performance'),
('perf.total_active', 'ru', 'Активных слов:', 'performance'),
('perf.target', 'ru', 'Цель: 250/месяц', 'performance'),

-- === MODULE GRID ===
('module.vokabeln', 'ru', 'Словарь', 'modules'),
('module.phrases', 'ru', 'Фразы', 'modules'),
('module.quiz', 'ru', 'Викторина', 'modules'),
('module.cyprus', 'ru', 'Кипр', 'modules'),
('module.video', 'ru', 'Видеокурс', 'modules'),
('module.audio', 'ru', 'Аудио', 'modules'),
('module.library', 'ru', 'Библиотека', 'modules'),
('module.stories', 'ru', 'Рассказы', 'modules'),
('module.sub.due', 'ru', '12 к повтору', 'modules'),
('module.sub.travel', 'ru', 'Путешествия', 'modules'),
('module.sub.reading', 'ru', 'Чтение', 'modules'),
('module.sub.exam_prep', 'ru', 'Подготовка к экзамену', 'modules'),
('module.sub.short_stories', 'ru', 'Короткие рассказы', 'modules'),

-- === ACTION GRID (Legacy 3x3) ===
('actiongrid.magic_round', 'ru', 'Твой урок', 'action_grid'),
('actiongrid.comprehension', 'ru', 'Понимание', 'action_grid'),
('actiongrid.exam_test', 'ru', 'Экзамен', 'action_grid'),
('actiongrid.quick_lesson', 'ru', 'Быстрый урок 20 мин', 'action_grid'),
('actiongrid.game', 'ru', 'Игра', 'action_grid'),
('actiongrid.test', 'ru', 'Тест', 'action_grid'),
('actiongrid.lesson_today', 'ru', 'Урок сегодня', 'action_grid'),
('actiongrid.repeat_vocab', 'ru', 'Повторить слова', 'action_grid'),
('actiongrid.print', 'ru', 'Печать', 'action_grid'),

-- === SUMMARY STATS (shared across all dialogs) ===
('summary.correct_label', 'ru', '{correct} правильно / {wrong} неправильно ({percent} %)', 'summary'),

-- === METADATA ===
('meta.page_title', 'ru', 'GreekLingua – Панель обучения', 'meta'),
('meta.page_description', 'ru', 'Изучайте греческий с интервальным повторением', 'meta');


-- ============================================================
-- Verify: Count translations per language
-- ============================================================
SELECT lang, COUNT(*) as total_keys FROM public.ui_translations GROUP BY lang;
