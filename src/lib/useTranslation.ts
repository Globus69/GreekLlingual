"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/db/supabase';
import { useLanguage, Locale } from '@/context/LanguageContext';

// Global cache: translations per locale
const translationCache: Record<Locale, Record<string, string> | null> = {
    en: null,
    ru: null,
};

// Track in-flight fetches to prevent duplicate requests
const fetchPromises: Record<Locale, Promise<Record<string, string>> | null> = {
    en: null,
    ru: null,
};

// Fallback English translations (hardcoded subset for offline/error scenarios)
const FALLBACK_EN: Record<string, string> = {
    'header.logout': 'Logout',
    'login.title': 'GreekLingua',
    'login.subtitle': 'Enter your details to continue learning',
    'login.email_placeholder': 'Username',
    'login.pin_placeholder': '6-Digit PIN',
    'login.submit': 'Sign In',
    'login.submitting': 'Signing in...',
    'login.error': 'Invalid username or PIN. Please try again.',
    'login.biometric': 'Use FaceID / TouchID',
    'login.language_label': 'Language',
    'dashboard.authenticating': 'Authenticating...',
    'dashboard.loading': 'Loading GreekLingua...',
    'dashboard.welcome': 'Welcome back, {name}!',
    'dashboard.welcome_subtitle': 'Ready to continue your journey? You have <b>{count} new vocabulary cards</b> waiting for review today.',
    'stats.current_level': 'Current Level',
    'stats.days': 'Days',
    'stats.vocabs': 'Vocabs',
    'stats.learned': 'Learned',
    'stats.today': 'Today:',
    'stats.daily_goal_default': '12 new vocabs & 1 short text.',
    'mastery.title': 'Learning Mastery',
    'mastery.total_time': 'Total time spent learning: {hours} hours',
    'mastery.last_test': 'Last Test',
    'mastery.actual_test': 'Actual Test',
    'mastery.last_exam': 'Last Exam',
    'mastery.vocab_progress': '<b>{learned} / {total}</b> Vocabulary confidently – {remaining} require attention',
    'mastery.suggestion_default': '12 new vocabulary cards + 1 short text about Cyprus.',
    'action.magic_round': 'Magic Round',
    'action.quick_lesson': '20 min Quick Lesson',
    'action.daily_phrases': 'Daily Phrases',
    'action.short_stories': 'Short Stories',
    'action.train_weak': 'Train Weak Words',
    'action.review_vocab': 'Review Vocabulary',
    'action.due_cards': 'Due Cards Today',
    'action.grammar_hits': 'Grammar Quick Hits',
    'action.listening': 'Listening Practice',
    'action.pronunciation': 'Pronunciation Trainer',
    'action.comprehension': 'Comprehension',
    'action.audio_immersion': 'Audio Immersion',
    'action.test': 'Test',
    'action.cyprus_exam': 'Cyprus Exam Sim',
    'action.book_recs': 'Book Recommendations',
    'action.progress_history': 'Progress History',
    'btn.hard': 'Hard',
    'btn.good': 'Good',
    'btn.easy': 'Easy',
    'btn.audio': 'Audio',
    'btn.restart': 'Restart',
    'btn.cancel': 'Cancel',
    'btn.audio_tooltip': 'Listen to Greek pronunciation',
    'flashcard.label_source': 'ENGLISH',
    'flashcard.label_target': 'ΕΛΛΗΝΙΚΑ',
    'flashcard.flip_hint': 'Click to flip',
    'flashcard.tap_hint': 'Tap the card to reveal translation, then rate your performance.',
    'vocab.loading': 'Loading...',
    'vocab.loading_subtitle': 'Fetching vocabulary from database...',
    'vocab.login_required': 'Login Required',
    'vocab.login_required_msg': 'Please log in to access vocabulary learning features.',
    'vocab.no_items': 'No Vocabulary Found',
    'vocab.no_items_msg': 'No vocabulary items available for this mode.',
    'vocab.error': 'Error',
    'vocab.error_msg': 'Unable to load vocabulary card.',
    'vocab.session_complete': 'Session complete!',
    'vocab.correct': 'Correct',
    'vocab.wrong': 'Wrong',
    'vocab.back_to_dashboard': 'Back to Dashboard',
    'vocab.progress_saved': 'Progress saved – well done!',
    'vocab.result_saved': 'Result saved - well done!',
    'vocab.mode.weak_title': 'Train Weak Words',
    'vocab.mode.weak_subtitle': 'Let\'s strengthen these',
    'vocab.mode.due_title': 'Due Cards Today',
    'vocab.mode.due_subtitle': 'Your daily reviews',
    'vocab.mode.review_title': 'Review Vocabulary',
    'vocab.mode.review_subtitle': 'Refresh your knowledge',
    'grammar.loading_subtitle': 'Fetching grammar from database...',
    'grammar.no_items': 'No Grammar Found',
    'grammar.mode.weak_title': 'Train Weak Grammar',
    'grammar.mode.due_title': 'Due Grammar Today',
    'grammar.mode.review_title': 'Grammar Quick Hits',
    'grammar.mode.review_subtitle': 'Refresh your grammar',
    'comprehension.loading_subtitle': 'Fetching comprehension from database...',
    'comprehension.no_items': 'No Comprehension Found',
    'comprehension.mode.weak_title': 'Train Weak Comprehension',
    'comprehension.mode.due_title': 'Due Comprehension Today',
    'comprehension.mode.review_title': 'Comprehension',
    'comprehension.mode.review_subtitle': 'Train your understanding',
    'listening.loading_subtitle': 'Fetching listening exercises from database...',
    'listening.no_items': 'No Listening Exercises Found',
    'listening.play_audio': 'Play Audio',
    'listening.no_audio': '(Demo: No audio file available)',
    'listening.correct_answer': 'Correct! Very good!',
    'listening.wrong_answer': 'Wrong. The correct answer is: "{answer}"',
    'listening.next': 'Next',
    'listening.mode.weak_title': 'Train Weak Listening',
    'listening.mode.due_title': 'Due Listening Today',
    'listening.mode.review_title': 'Listening Practice',
    'listening.mode.review_subtitle': 'Listen and choose the correct answer',
    'perf.title': 'Learning Mastery',
    'perf.subtitle': 'Performance Hub',
    'perf.this_week': '+12% this week',
    'perf.total_active': 'Total active vocabs:',
    'perf.target': 'Target: 250/month',
    'mode.weak_subtitle': 'Let\'s strengthen these',
    'mode.due_subtitle': 'Your daily reviews',
    'grammar.login_required_msg': 'Please log in to access grammar learning features.',
    'grammar.no_items_msg': 'No grammar items available for this mode.',
    'grammar.no_items_tip': 'Run supabase/insert_test_grammar.sql in your Supabase SQL editor to add test grammar.',
    'grammar.error_msg': 'Unable to load grammar card.',
    'grammar.mode.weak_subtitle': 'Let\'s strengthen these',
    'grammar.mode.due_subtitle': 'Your daily reviews',
    'comprehension.login_required_msg': 'Please log in to access comprehension learning features.',
    'comprehension.no_items_msg': 'No comprehension items available for this mode.',
    'comprehension.no_items_tip': 'Run supabase/insert_test_comprehension.sql in your Supabase SQL editor to add test comprehension.',
    'comprehension.error_msg': 'Unable to load comprehension card.',
    'comprehension.mode.weak_subtitle': 'Let\'s strengthen these',
    'comprehension.mode.due_subtitle': 'Your daily reviews',
    'listening.login_required_msg': 'Please log in to access listening practice features.',
    'listening.no_items_msg': 'No listening exercises available for this mode.',
    'listening.no_items_tip': 'Run supabase/insert_test_listening.sql in your Supabase SQL editor to add test listening exercises.',
    'listening.error_msg': 'Unable to load listening exercise.',
    'listening.mode.weak_subtitle': 'Let\'s strengthen these',
    'listening.mode.due_subtitle': 'Your daily reviews',
    'shared.correct': 'Correct',
    'shared.wrong': 'Wrong',
    'shared.session_complete': 'Session complete!',
    'shared.back_to_dashboard': 'Back to Dashboard',
    'shared.progress_saved': 'Progress saved – well done!',
    'shared.result_saved': 'Result saved - well done!',
    'action_grid.magic_round': 'Start Magic Round',
    'action_grid.comprehension': 'Comprehension',
    'action_grid.exam_test': 'Exam Test',
    'action_grid.quick_lesson': '20 min Quick Lesson',
    'action_grid.game': 'Game',
    'action_grid.test': 'Test',
    'action_grid.lesson_today': 'Lesson Today',
    'action_grid.review_vocab': 'Review Vocabulary',
    'action_grid.print': 'Print',
    'modules.vokabeln': 'Vocabulary',
    'modules.vokabeln_sub': '12 Due',
    'modules.phrases': 'Phrases',
    'modules.phrases_sub': 'Travel',
    'modules.quiz': 'Quiz',
    'modules.quiz_sub': 'Reading',
    'modules.cyprus': 'Cyprus',
    'modules.cyprus_sub': 'Exam Prep',
    'modules.video': 'Video Class',
    'modules.audio': 'Audio',
    'modules.library': 'Library',
    'modules.stories': 'Stories',
    'modules.stories_sub': 'Short Stories',
    'perf.day.mon': 'Mon',
    'perf.day.tue': 'Tue',
    'perf.day.wed': 'Wed',
    'perf.day.thu': 'Thu',
    'perf.day.fri': 'Fri',
    'perf.day.sat': 'Sat',
    'perf.day.sun': 'Sun',
    'header.admin': 'Admin',
    'admin.title': 'Admin Panel',
    'admin.subtitle': 'Content & Student Management',
    'admin.back_to_dashboard': 'Back to Dashboard',
    'admin.students': 'Students',
    'admin.content': 'Content Management',
    'admin.settings': 'Settings',
    'admin.total_students': 'Total Students',
    'admin.active_today': 'Active Today',
    'admin.avg_progress': 'Avg. Progress',
    'admin.not_admin': 'Access Denied',
    'admin.not_admin_msg': 'You must be logged in as Admin to access this page.',
    'admin.go_to_dashboard': 'Go to Dashboard',
    'admin.students_desc': 'Manage students, levels, and performance tracking.',
    'admin.content_desc': 'Manage learning items, vocabulary, grammar, and exercises.',
    'admin.settings_desc': 'Application settings and configuration.',
    // Student Management Dialog
    'students.title': 'Student Management',
    'students.subtitle': 'Create, edit and manage students',
    'students.add_new': 'New Student',
    'students.back_to_list': 'Back to List',
    'students.search_placeholder': 'Search by name, email or phone...',
    'students.loading': 'Loading students...',
    'students.no_students': 'No students found. Click "New Student" to add one.',
    'students.total': 'Total',
    'students.filtered': 'Filtered',
    'students.form_add_title': 'Add New Student',
    'students.form_edit_title': 'Edit Student',
    'students.field_name': 'Name',
    'students.field_email': 'Email',
    'students.field_whatsapp': 'WhatsApp',
    'students.field_pin': 'PIN (6 digits)',
    'students.field_level': 'Level',
    'students.field_difficulty': 'Difficulty',
    'students.placeholder_name': 'Full name',
    'students.placeholder_email': 'email@example.com',
    'students.placeholder_whatsapp': '+49 123 456789',
    'students.pin_optional': 'leave empty to keep current',
    'students.pin_digits': 'digits',
    'students.diff_easy': 'Easy',
    'students.diff_middle': 'Middle',
    'students.diff_hard': 'Hard',
    'students.index_key_label': 'Performance Index (auto)',
    'students.btn_create': 'Create Student',
    'students.btn_update': 'Save Changes',
    'students.saving': 'Saving...',
    'students.saved_success': 'Student created successfully!',
    'students.updated_success': 'Student updated successfully!',
    'students.deleted_success': 'Student deleted.',
    'students.error_name_required': 'Name is required.',
    'students.error_pin_6': 'PIN must be exactly 6 digits.',
    'students.error_save': 'Error saving student',
    'students.error_delete': 'Error deleting student',
    'students.show_stats': 'Show progress',
    'students.stats_not_available': 'Stats not available',
    'students.stats_attempts': 'Attempts',
    'students.stats_correct_rate': 'Correct Rate',
    'students.stats_items_learned': 'Learned/Practiced',
    'students.stats_last_active': 'Last Active',
    'students.generate_pin': 'Generate random PIN',
};

async function fetchTranslations(locale: Locale): Promise<Record<string, string>> {
    // Return cache if available
    if (translationCache[locale]) {
        return translationCache[locale]!;
    }

    // Reuse in-flight fetch if one exists
    if (fetchPromises[locale]) {
        return fetchPromises[locale]!;
    }

    const promise = (async () => {
        try {
            const { data, error } = await supabase
                .from('ui_translations')
                .select('key, value')
                .eq('lang', locale);

            if (error) {
                // Supabase nicht erreichbar oder Tabelle existiert nicht – stille Warnung
                console.warn(`⚠️ Translations table not available for ${locale}, using built-in fallback.`);
                const fallback = { ...FALLBACK_EN };
                translationCache[locale] = fallback;
                return fallback;
            }

            if (data && data.length > 0) {
                const map: Record<string, string> = {};
                for (const row of data) {
                    map[row.key] = row.value;
                }
                translationCache[locale] = map;
                console.log(`✅ Loaded ${data.length} translations for locale: ${locale}`);
                return map;
            }

            // Keine Daten in der DB – Fallback verwenden und cachen
            console.warn(`⚠️ No translations found for locale: ${locale}, using built-in fallback.`);
            const fallback = { ...FALLBACK_EN };
            translationCache[locale] = fallback;
            return fallback;
        } catch (err) {
            // Netzwerk-/Verbindungsfehler – stille Warnung
            console.warn(`⚠️ Could not reach translations service for ${locale}, using built-in fallback.`);
            const fallback = { ...FALLBACK_EN };
            translationCache[locale] = fallback;
            return fallback;
        } finally {
            fetchPromises[locale] = null;
        }
    })();

    fetchPromises[locale] = promise;
    return promise;
}

/**
 * useTranslation Hook
 *
 * Returns a `t(key, params?)` function that resolves translation keys.
 * - Loads translations from Supabase `ui_translations` table
 * - Caches per locale (only fetches once per language switch)
 * - Falls back to English hardcoded values if Supabase is unavailable
 * - Supports template params: t('dashboard.welcome', { name: 'SWS' })
 */
export function useTranslation() {
    const { locale } = useLanguage();
    const [translations, setTranslations] = useState<Record<string, string>>(
        translationCache[locale] || FALLBACK_EN
    );
    const [loading, setLoading] = useState(!translationCache[locale]);
    const localeRef = useRef(locale);

    useEffect(() => {
        localeRef.current = locale;
        let cancelled = false;

        const load = async () => {
            if (translationCache[locale]) {
                setTranslations(translationCache[locale]!);
                setLoading(false);
                return;
            }

            setLoading(true);
            const result = await fetchTranslations(locale);

            // Only update if locale hasn't changed during fetch
            if (!cancelled && localeRef.current === locale) {
                setTranslations(result);
                setLoading(false);
            }
        };

        load();

        return () => { cancelled = true; };
    }, [locale]);

    /**
     * Translate a key, with optional parameter substitution.
     * Example: t('dashboard.welcome', { name: 'SWS' }) → "Welcome back, SWS!"
     * Falls back to English fallback, then to the key itself.
     */
    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let value = translations[key] || FALLBACK_EN[key] || key;

        if (params) {
            for (const [param, replacement] of Object.entries(params)) {
                value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), String(replacement));
            }
        }

        return value;
    }, [translations]);

    return { t, loading, locale };
}
