"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'en' | 'ru';

interface LanguageContextType {
    locale: Locale;
    setLocale: (lang: Locale) => void;
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
            if (saved === 'en' || saved === 'ru') {
                setLocaleState(saved);
            }
        } catch {
            // localStorage not available (SSR)
        }
        setHydrated(true);
    }, []);

    const setLocale = (lang: Locale) => {
        setLocaleState(lang);
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch {
            // localStorage not available
        }
    };

    // Prevent hydration mismatch: render children only after client-side hydration
    if (!hydrated) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ locale, setLocale }}>
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
