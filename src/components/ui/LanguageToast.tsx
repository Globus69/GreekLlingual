"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage, Locale } from '@/context/LanguageContext';

const TOAST_MESSAGES: Record<Locale, string> = {
    en: 'Language changed to English.',
    ru: '\u042f\u0437\u044b\u043a \u0438\u0437\u043c\u0435\u043d\u0451\u043d \u043d\u0430 \u0420\u0443\u0441\u0441\u043a\u0438\u0439.',
};

const TOAST_FLAGS: Record<Locale, string> = {
    en: '\ud83c\uddec\ud83c\udde7',
    ru: '\ud83c\uddf7\ud83c\uddfa',
};

export default function LanguageToast() {
    const { locale } = useLanguage();
    const [visible, setVisible] = useState(false);
    const [displayLocale, setDisplayLocale] = useState<Locale>(locale);
    const [isFirstRender, setIsFirstRender] = useState(true);

    // Skip toast on initial mount (first render)
    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            return;
        }

        // Locale changed – show toast
        setDisplayLocale(locale);
        setVisible(true);

        const timer = setTimeout(() => {
            setVisible(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!visible) return null;

    return (
        <>
            <style jsx global>{`
                @keyframes toastSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }
                @keyframes toastSlideOut {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px) scale(0.9);
                    }
                }
            `}</style>
            <div
                style={{
                    position: 'fixed',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    background: displayLocale === 'ru'
                        ? 'rgba(60, 10, 30, 0.85)'
                        : 'rgba(10, 20, 60, 0.85)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    borderRadius: '16px',
                    border: displayLocale === 'ru'
                        ? '1px solid rgba(224, 85, 85, 0.3)'
                        : '1px solid rgba(0, 122, 255, 0.3)',
                    boxShadow: displayLocale === 'ru'
                        ? '0 8px 32px rgba(224, 85, 85, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
                        : '0 8px 32px rgba(0, 122, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                    animation: 'toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    pointerEvents: 'none',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
                <span style={{ fontSize: '20px' }}>
                    {TOAST_FLAGS[displayLocale]}
                </span>
                <span style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                }}>
                    {TOAST_MESSAGES[displayLocale]}
                </span>
            </div>
        </>
    );
}
