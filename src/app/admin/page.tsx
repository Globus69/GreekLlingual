"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/useTranslation';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminPage() {
    const { user, isAdmin, isAuthenticated, loading } = useAuth();
    const { t } = useTranslation();
    const { locale, setLocale } = useLanguage();
    const router = useRouter();

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

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
            color: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        }}>
            {/* Admin Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>⚙️</span>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('admin.title')}</h1>
                        <p style={{ fontSize: '12px', color: '#8E8E93', margin: 0 }}>{t('admin.subtitle')}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Sprachwahl EN/RU */}
                    <div style={{
                        display: 'flex',
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <button
                            onClick={() => setLocale('en')}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: locale === 'en' ? 'rgba(0, 122, 255, 0.3)' : 'transparent',
                                color: locale === 'en' ? '#007AFF' : '#8E8E93',
                                transition: 'all 0.2s',
                            }}
                        >
                            🇬🇧 EN
                        </button>
                        <button
                            onClick={() => setLocale('ru')}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: locale === 'ru' ? 'rgba(0, 122, 255, 0.3)' : 'transparent',
                                color: locale === 'ru' ? '#007AFF' : '#8E8E93',
                                transition: 'all 0.2s',
                            }}
                        >
                            🇷🇺 RU
                        </button>
                    </div>

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
                            Manage students, levels, and performance tracking.
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
                            Manage learning items, vocabulary, grammar, and exercises.
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
                            Application settings and configuration.
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
        </div>
    );
}
