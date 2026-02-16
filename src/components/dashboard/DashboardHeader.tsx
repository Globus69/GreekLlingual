"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { useLanguage } from '@/context/language-context';
import { useDeviceDetection } from '@/hooks/use-device-detection';

interface HeaderProps {
    studentName?: string;
}

export default function DashboardHeader({ studentName }: HeaderProps) {
    const [dateTime, setDateTime] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const { logout, isAdmin } = useAuth();
    const { t } = useTranslation();
    const { locale, setLocale } = useLanguage();
    const router = useRouter();
    const { isMobile } = useDeviceDetection();

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            setDateTime(`${day}.${month}.${year} ${hours}:${minutes}:${seconds}`);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header>
            <div className="brand">
                <span className="brand-icon">🏛️</span>
                GreekLingua {!isMobile && studentName && <span style={{ opacity: 0.6, fontSize: '0.8em', marginLeft: '8px' }}>• {studentName}</span>}
            </div>

            {!isMobile && (
                <div className="datetime-display" id="datetime">
                    {dateTime}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', position: 'relative' }}>
                <div className="user-profile">
                    <div className="avatar">{studentName ? studentName.substring(0, 2).toUpperCase() : 'GU'}</div>
                    <span className="username">{studentName || 'Guest'}</span>
                </div>

                {/* Mobile menu toggle */}
                {isMobile && (
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            fontSize: '18px',
                            lineHeight: 1,
                        }}
                    >
                        {showMobileMenu ? '✕' : '☰'}
                    </button>
                )}

                {/* Desktop menu or mobile dropdown */}
                {(!isMobile || showMobileMenu) && (
                    <div style={isMobile ? mobileMenuStyle : { display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Flaggen-Anzeige: Klick rotiert durch Sprachen */}
                        <button
                    onClick={() => {
                        const nextLocale = locale === 'en' ? 'ru' : locale === 'ru' ? 'el' : locale === 'el' ? 'de' : locale === 'de' ? 'es' : 'en';
                        setLocale(nextLocale);
                    }}
                    title={locale === 'en' ? t('header.switch_to_ru') : locale === 'ru' ? t('header.switch_to_el') : locale === 'el' ? t('header.switch_to_de') : t('header.switch_to_en')}
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        fontSize: '20px',
                        lineHeight: 1,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <span style={{ fontSize: '22px' }}>
                        {locale === 'en' ? '\uD83C\uDDEC\uD83C\uDDE7' : locale === 'ru' ? '\uD83C\uDDF7\uD83C\uDDFA' : locale === 'el' ? '\uD83C\uDDEC\uD83C\uDDF7' : locale === 'de' ? '\uD83C\uDDE9\uD83C\uDDEA' : '\uD83C\uDDEA\uD83C\uDDF8'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase' }}>
                        {locale === 'en' ? 'EN' : locale === 'ru' ? 'RU' : locale === 'el' ? 'EL' : locale === 'de' ? 'DE' : 'ES'}
                    </span>
                </button>

                {isAdmin && (
                    <button
                        onClick={() => router.push('/admin')}
                        style={{
                            background: 'rgba(88, 86, 214, 0.12)',
                            border: '1px solid rgba(88, 86, 214, 0.25)',
                            borderRadius: '12px',
                            padding: '8px 14px',
                            color: '#5856D6',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(88, 86, 214, 0.22)';
                            e.currentTarget.style.borderColor = 'rgba(88, 86, 214, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(88, 86, 214, 0.12)';
                            e.currentTarget.style.borderColor = 'rgba(88, 86, 214, 0.25)';
                        }}
                    >
                        <span style={{ fontSize: '15px' }}>⚙️</span> {t('header.admin')}
                    </button>
                )}
                <button
                    onClick={logout}
                    style={{
                        background: 'rgba(255, 59, 48, 0.12)',
                        border: '1px solid rgba(255, 59, 48, 0.25)',
                        borderRadius: '12px',
                        padding: '8px 14px',
                        color: '#FF3B30',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.22)';
                        e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.25)';
                    }}
                >
                    <span style={{ fontSize: '15px' }}>↪</span> {t('header.logout')}
                </button>
                    </div>
                )}
            </div>
        </header>
    );
}

// Mobile menu dropdown style
const mobileMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    background: 'rgba(28, 28, 30, 0.98)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 1000,
    minWidth: '200px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};
