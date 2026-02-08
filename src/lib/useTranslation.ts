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
    'login.email_placeholder': 'Email',
    'login.pin_placeholder': '6-Digit PIN',
    'login.submit': 'Sign In',
    'login.submitting': 'Signing in...',
    'login.error': 'Invalid email or PIN. Please try again.',
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
                console.error(`❌ Error fetching translations for ${locale}:`, error);
                // Fallback: return English hardcoded if locale is 'en', else empty
                if (locale === 'en') return { ...FALLBACK_EN };
                return {};
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

            // No data in DB – use fallback for English
            console.warn(`⚠️ No translations found for locale: ${locale}, using fallback`);
            if (locale === 'en') return { ...FALLBACK_EN };
            return {};
        } catch (err) {
            console.error(`❌ Translation fetch error for ${locale}:`, err);
            if (locale === 'en') return { ...FALLBACK_EN };
            return {};
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
        translationCache[locale] || (locale === 'en' ? FALLBACK_EN : {})
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
