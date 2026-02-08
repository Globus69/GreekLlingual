"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/useTranslation';
import { useLanguage } from '@/context/LanguageContext';
import StudentManagementDialog from '@/components/admin/StudentManagementDialog';

export default function AdminPage() {
    const { user, isAdmin, isAuthenticated, loading } = useAuth();
    const { t } = useTranslation();
    const { locale, setLocale } = useLanguage();
    const router = useRouter();
    const [studentDialogOpen, setStudentDialogOpen] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
                color: '#fff',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
                    <p style={{ fontSize: '16px', color: '#8E8E93' }}>{t('dashboard.loading')}</p>
                </div>
            </div>
        );
    }

    // Zugriff verweigert wenn kein Admin
    if (!isAdmin) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
                color: '#fff',
            }}>
                <div style={{
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '24px',
                    padding: '48px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    maxWidth: '420px',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>{t('admin.not_admin')}</h2>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '24px' }}>{t('admin.not_admin_msg')}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                            background: 'rgba(0, 122, 255, 0.15)',
                            border: '1px solid rgba(0, 122, 255, 0.3)',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            color: '#007AFF',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {t('admin.go_to_dashboard')}
                    </button>
                </div>
            </div>
        );
    }

    // Dezente Hintergrundfarbe je nach Sprache
    const bgGradient = locale === 'ru'
        ? 'linear-gradient(135deg, #0a0a1a 0%, #2a1028 50%, #0a0a1a 100%)'  // warmer Rotton
        : locale === 'el'
            ? 'linear-gradient(135deg, #0a0a1a 0%, #0d2847 50%, #0a0a1a 100%)'  // griechisches Blau
            : locale === 'de'
                ? 'linear-gradient(135deg, #0a0a1a 0%, #2a2010 50%, #0a0a1a 100%)'  // warmer Goldton
                : 'linear-gradient(135deg, #0a0a1a 0%, #0f1a3e 50%, #0a0a1a 100%)'; // kuehler Blauton
    const headerBg = locale === 'ru'
        ? 'rgba(60, 0, 20, 0.25)'   // dezenter Rot-Touch
        : locale === 'el'
            ? 'rgba(0, 30, 70, 0.25)'   // griechischer Blau-Touch
            : locale === 'de'
                ? 'rgba(50, 40, 0, 0.25)'   // dezenter Gold-Touch
                : 'rgba(0, 20, 60, 0.25)';  // dezenter Blau-Touch
    const headerBorder = locale === 'ru'
        ? '1px solid rgba(200, 50, 50, 0.08)'
        : locale === 'el'
            ? '1px solid rgba(13, 110, 253, 0.08)'
            : locale === 'de'
                ? '1px solid rgba(218, 165, 32, 0.08)'
                : '1px solid rgba(50, 100, 200, 0.08)';

    return (
        <div style={{
            minHeight: '100vh',
            background: bgGradient,
            color: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            transition: 'background 0.6s ease',
        }}>
            {/* Admin Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: headerBorder,
                background: headerBg,
                backdropFilter: 'blur(20px)',
                transition: 'background 0.4s ease, border-color 0.4s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>⚙️</span>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('admin.title')}</h1>
                        <p style={{ fontSize: '12px', color: '#8E8E93', margin: 0 }}>{t('admin.subtitle')}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Flaggen-Anzeige: Klick rotiert durch 3 Sprachen (EN → RU → EL → EN) */}
                    <button
                        onClick={() => {
                            const nextLocale = locale === 'en' ? 'ru' : locale === 'ru' ? 'el' : locale === 'el' ? 'de' : 'en';
                            setLocale(nextLocale);
                        }}
                        title={locale === 'en' ? t('header.switch_to_ru') : locale === 'ru' ? t('header.switch_to_el') : locale === 'el' ? t('header.switch_to_de') : t('header.switch_to_en')}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: locale === 'ru'
                                ? '1px solid rgba(200, 60, 60, 0.2)'
                                : locale === 'el'
                                    ? '1px solid rgba(13, 110, 253, 0.2)'
                                    : locale === 'de'
                                        ? '1px solid rgba(218, 165, 32, 0.2)'
                                        : '1px solid rgba(60, 120, 220, 0.2)',
                            borderRadius: '10px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.3s ease',
                            fontSize: '20px',
                            lineHeight: 1,
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>
                            {locale === 'en' ? '\uD83C\uDDEC\uD83C\uDDE7' : locale === 'ru' ? '\uD83C\uDDF7\uD83C\uDDFA' : locale === 'el' ? '\uD83C\uDDEC\uD83C\uDDF7' : '\uD83C\uDDE9\uD83C\uDDEA'}
                        </span>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: locale === 'ru' ? '#E05555' : locale === 'el' ? '#0D6EFD' : locale === 'de' ? '#DAA520' : '#5B9BFF',
                            textTransform: 'uppercase',
                            transition: 'color 0.3s ease',
                        }}>
                            {locale === 'en' ? 'EN' : locale === 'ru' ? 'RU' : locale === 'el' ? 'EL' : 'DE'}
                        </span>
                    </button>

                    {/* Zurueck zum Dashboard */}
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                            background: 'rgba(0, 122, 255, 0.12)',
                            border: '1px solid rgba(0, 122, 255, 0.25)',
                            borderRadius: '12px',
                            padding: '8px 14px',
                            color: '#007AFF',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 122, 255, 0.22)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 122, 255, 0.12)';
                        }}
                    >
                        <span style={{ fontSize: '15px' }}>←</span> {t('admin.back_to_dashboard')}
                    </button>
                </div>
            </header>

            {/* Admin Content */}
            <main style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Uebersichts-Karten */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                        <div style={{ fontSize: '28px', fontWeight: 700 }}>0</div>
                        <div style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px' }}>{t('admin.total_students')}</div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                        <div style={{ fontSize: '28px', fontWeight: 700 }}>0</div>
                        <div style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px' }}>{t('admin.active_today')}</div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
                        <div style={{ fontSize: '28px', fontWeight: 700 }}>–</div>
                        <div style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px' }}>{t('admin.avg_progress')}</div>
                    </div>
                </div>

                {/* Navigation-Karten */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px',
                }}>
                    <div style={{
                        background: 'rgba(88, 86, 214, 0.08)',
                        borderRadius: '20px',
                        padding: '32px',
                        border: '1px solid rgba(88, 86, 214, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                        onClick={() => setStudentDialogOpen(true)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(88, 86, 214, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(88, 86, 214, 0.08)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('admin.students')}</h3>
                        <p style={{ fontSize: '13px', color: '#8E8E93' }}>
                            {t('admin.students_desc')}
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(52, 199, 89, 0.08)',
                        borderRadius: '20px',
                        padding: '32px',
                        border: '1px solid rgba(52, 199, 89, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(52, 199, 89, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(52, 199, 89, 0.08)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('admin.content')}</h3>
                        <p style={{ fontSize: '13px', color: '#8E8E93' }}>
                            {t('admin.content_desc')}
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(255, 149, 0, 0.08)',
                        borderRadius: '20px',
                        padding: '32px',
                        border: '1px solid rgba(255, 149, 0, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 149, 0, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 149, 0, 0.08)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚙️</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('admin.settings')}</h3>
                        <p style={{ fontSize: '13px', color: '#8E8E93' }}>
                            {t('admin.settings_desc')}
                        </p>
                    </div>
                </div>

                {/* User-Info */}
                <div style={{
                    marginTop: '32px',
                    padding: '16px 20px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '12px',
                    color: '#636366',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                    <span>Logged in as: {user?.name || 'Admin'} ({user?.email})</span>
                    <span>Role: {user?.role || 'admin'}</span>
                </div>
            </main>

            {/* Schueler-Verwaltungs-Dialog */}
            <StudentManagementDialog
                open={studentDialogOpen}
                onClose={() => setStudentDialogOpen(false)}
            />
        </div>
    );
}
