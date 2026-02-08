"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';

export type Locale = 'en' | 'ru' | 'el';

interface LanguageContextType {
    locale: Locale;
    setLocale: (lang: Locale) => void;
    syncLocaleFromUser: (preferredLocale?: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'greeklingua_locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');
    const [hydrated, setHydrated] = useState(false);

    // Load saved locale from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'en' || saved === 'ru' || saved === 'el') {
                setLocaleState(saved);
            }
        } catch {
            // localStorage not available (SSR)
        }
        setHydrated(true);
    }, []);

    // Sync locale from user profile (called after login)
    const syncLocaleFromUser = useCallback((preferredLocale?: string) => {
        if (preferredLocale === 'en' || preferredLocale === 'ru' || preferredLocale === 'el') {
            setLocaleState(preferredLocale);
            try {
                localStorage.setItem(STORAGE_KEY, preferredLocale);
            } catch {
                // localStorage not available
            }
        }
    }, []);

    const setLocale = useCallback((lang: Locale) => {
        setLocaleState(lang);
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch {
            // localStorage not available
        }

        // Persist to Supabase (fire-and-forget, non-blocking)
        try {
            const storedUser = localStorage.getItem('greeklingua_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.id && user.id !== 'admin-local') {
                    supabase.rpc('update_user_locale', {
                        p_user_id: user.id,
                        p_locale: lang,
                    }).then(({ error }) => {
                        if (error) {
                            console.warn('Could not save locale to DB:', error.message);
                        }
                    });
                    // Update stored user with new locale
                    user.preferred_locale = lang;
                    localStorage.setItem('greeklingua_user', JSON.stringify(user));
                }
            }
        } catch {
            // Ignore errors – localStorage/Supabase might not be available
        }
    }, []);

    // Prevent hydration mismatch: render children only after client-side hydration
    if (!hydrated) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ locale, setLocale, syncLocaleFromUser }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
