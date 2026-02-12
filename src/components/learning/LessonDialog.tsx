"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/useTranslation';
import '@/styles/liquid-glass.css';

interface LessonSession {
    session_id: string;
    session_date: string;
    session_topic: string;
    vocab_count: number;
    created_at: string;
    updated_at: string;
}

interface LessonVocabItem {
    id: string;
    source_word: string;
    greek_word: string;
    sort_order: number;
}

interface LessonDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

// Datum formatieren: "2025-02-02" → "02.02.2025"
function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    } catch {
        return dateStr;
    }
}

export default function LessonDialog({ isOpen, onClose }: LessonDialogProps) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [sessions, setSessions] = useState<LessonSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [sessionTopic, setSessionTopic] = useState('');
    const [vocabulary, setVocabulary] = useState<LessonVocabItem[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Responsive check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Lade Sitzungen beim Oeffnen
    useEffect(() => {
        if (isOpen && user?.id) {
            loadSessions();
        }
    }, [isOpen, user?.id]);

    const loadSessions = async () => {
        if (!user?.id || user.id === 'admin-local') {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_lesson_sessions', { p_student_id: user.id });

            if (!error && data) {
                const sessionList = data as LessonSession[];
                setSessions(sessionList);
                // Automatisch den neuesten Tag auswaehlen
                if (sessionList.length > 0) {
                    loadSessionDetail(sessionList[0].session_id);
                }
            }
        } catch (err) {
            console.warn('Could not load lesson sessions:', err);
        }
        setLoading(false);
    };

    const loadSessionDetail = useCallback(async (sessionId: string) => {
        setDetailLoading(true);
        setSelectedSessionId(sessionId);
        try {
            const { data, error } = await supabase
                .rpc('get_lesson_detail', { p_session_id: sessionId });

            if (!error && data && data.success) {
                setSessionTopic(data.session.topic || '');
                setVocabulary(data.vocabulary || []);
            }
        } catch (err) {
            console.warn('Could not load session detail:', err);
        }
        setDetailLoading(false);
    }, []);

    const handleClose = () => {
        setSelectedSessionId(null);
        setSessionTopic('');
        setVocabulary([]);
        setSessions([]);
        setLoading(true);
        onClose();
    };

    if (!isOpen) return null;

    // Loading
    if (loading) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" style={{ textAlign: 'center', padding: '60px' }}>
                    <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>
                        👩‍🏫 {t('lesson.loading')}
                    </h2>
                    <p style={{ color: '#8E8E93', fontSize: '14px' }}>
                        {t('lesson.loading_subtitle')}
                    </p>
                </div>
            </div>
        );
    }

    // Leerer Zustand (keine Sessions)
    if (sessions.length === 0) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" style={{
                    textAlign: 'center',
                    padding: '60px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 'auto',
                }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
                    <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                        {t('lesson.title')}
                    </h2>
                    <p style={{ color: '#8E8E93', fontSize: '15px', marginBottom: '32px' }}>
                        {t('lesson.no_sessions')}
                    </p>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'rgba(255, 69, 58, 0.1)',
                            border: '1px solid rgba(255, 69, 58, 0.2)',
                            borderRadius: '14px',
                            padding: '14px 48px',
                            color: '#FF453A',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 69, 58, 0.18)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'; }}
                    >
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    const selectedSession = sessions.find(s => s.session_id === selectedSessionId);

    // =====================================================
    // 3-Spalten-Layout (Desktop) / Einspaltig (Mobile)
    // =====================================================
    return (
        <div className="vocabulary-dialog-overlay">
            <div
                className="vocabulary-dialog compact"
                onClick={(e) => e.stopPropagation()}
                style={{
                    padding: 0,
                    maxWidth: isMobile ? '600px' : '1100px',
                    width: '100%',
                    minHeight: isMobile ? '100vh' : 'auto',
                    height: isMobile ? '100vh' : '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* ===== Header ===== */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 28px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '28px' }}>👩‍🏫</span>
                        <div>
                            <h2 style={{
                                fontSize: '20px',
                                fontWeight: 800,
                                color: '#fff',
                                margin: 0,
                                letterSpacing: '-0.3px',
                            }}>
                                {t('lesson.title')}
                            </h2>
                            <p style={{
                                fontSize: '12px',
                                color: '#6E6E73',
                                margin: '2px 0 0 0',
                            }}>
                                {t('lesson.subtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        style={{
                            background: 'rgba(255, 69, 58, 0.1)',
                            border: '1px solid rgba(255, 69, 58, 0.2)',
                            borderRadius: '10px',
                            padding: '8px 20px',
                            color: '#FF453A',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 69, 58, 0.18)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'; }}
                    >
                        {t('btn.cancel')}
                    </button>
                </div>

                {/* ===== 3-Spalten Body ===== */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    overflow: 'hidden',
                    minHeight: 0,
                }}>

                    {/* ===== LINKE SPALTE – Datumsliste ===== */}
                    <div style={{
                        width: isMobile ? '100%' : '200px',
                        minWidth: isMobile ? undefined : '200px',
                        maxWidth: isMobile ? undefined : '220px',
                        borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderBottom: isMobile ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        flexShrink: 0,
                        maxHeight: isMobile ? '160px' : undefined,
                    }}>
                        <div style={{
                            padding: '12px 8px',
                            display: 'flex',
                            flexDirection: isMobile ? 'row' : 'column',
                            gap: '2px',
                            flexWrap: isMobile ? 'wrap' : 'nowrap',
                        }}>
                            {sessions.map((session) => {
                                const isSelected = session.session_id === selectedSessionId;
                                return (
                                    <button
                                        key={session.session_id}
                                        onClick={() => loadSessionDetail(session.session_id)}
                                        style={{
                                            display: 'block',
                                            width: isMobile ? 'auto' : '100%',
                                            textAlign: 'left',
                                            padding: isMobile ? '8px 14px' : '10px 14px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            background: isSelected
                                                ? 'rgba(0, 122, 255, 0.12)'
                                                : 'transparent',
                                            borderLeft: !isMobile && isSelected
                                                ? '3px solid #007AFF'
                                                : !isMobile
                                                    ? '3px solid transparent'
                                                    : 'none',
                                            borderBottom: isMobile && isSelected
                                                ? '2px solid #007AFF'
                                                : isMobile
                                                    ? '2px solid transparent'
                                                    : 'none',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: isSelected ? 700 : 500,
                                            color: isSelected ? '#007AFF' : '#A1A1A6',
                                            fontVariantNumeric: 'tabular-nums',
                                            letterSpacing: '0.2px',
                                        }}>
                                            {formatDate(session.session_date)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ===== MITTLERE SPALTE – Thema ===== */}
                    <div style={{
                        flex: isMobile ? undefined : 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: selectedSession ? 'center' : 'center',
                        padding: isMobile ? '24px 20px' : '40px 32px',
                        borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderBottom: isMobile ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                        overflow: 'hidden',
                    }}>
                        {detailLoading ? (
                            <div style={{
                                color: '#6E6E73',
                                fontSize: '14px',
                                fontWeight: 500,
                            }}>
                                {t('lesson.loading')}
                            </div>
                        ) : selectedSession ? (
                            <div style={{
                                width: '100%',
                                textAlign: 'center',
                            }}>
                                {/* Label */}
                                <div style={{
                                    fontSize: '11px',
                                    color: '#6E6E73',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1.5px',
                                    marginBottom: '12px',
                                }}>
                                    {t('lesson.topic')}
                                </div>

                                {/* Thema gross */}
                                <h2 style={{
                                    fontSize: isMobile ? '22px' : '28px',
                                    fontWeight: 800,
                                    color: '#FFFFFF',
                                    margin: '0 0 20px 0',
                                    lineHeight: 1.3,
                                    letterSpacing: '-0.4px',
                                    wordBreak: 'break-word',
                                }}>
                                    {sessionTopic || '—'}
                                </h2>

                                {/* Datum + Vokabelanzahl */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '16px',
                                    fontSize: '13px',
                                    color: '#8E8E93',
                                }}>
                                    <span style={{
                                        background: 'rgba(0, 122, 255, 0.08)',
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        color: '#007AFF',
                                        fontWeight: 600,
                                        fontSize: '12px',
                                    }}>
                                        📅 {formatDate(selectedSession.session_date)}
                                    </span>
                                    <span style={{
                                        background: 'rgba(52, 199, 89, 0.08)',
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        color: '#34C759',
                                        fontWeight: 600,
                                        fontSize: '12px',
                                    }}>
                                        📝 {vocabulary.length} {t('lesson.words')}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                color: '#6E6E73',
                                fontSize: '15px',
                                fontWeight: 500,
                            }}>
                                {t('lesson.no_sessions')}
                            </div>
                        )}
                    </div>

                    {/* ===== RECHTE SPALTE – Vokabeln ===== */}
                    <div style={{
                        width: isMobile ? '100%' : '420px',
                        minWidth: isMobile ? undefined : '380px',
                        maxWidth: isMobile ? undefined : '450px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        flexShrink: 0,
                        flex: isMobile ? 1 : undefined,
                    }}>
                        {/* Vokabel-Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            padding: '12px 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            background: 'rgba(0, 0, 0, 0.15)',
                            flexShrink: 0,
                        }}>
                            <span style={{
                                fontSize: '11px',
                                color: '#6E6E73',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}>
                                {t('lesson.greek')}
                            </span>
                            <span style={{
                                fontSize: '11px',
                                color: '#6E6E73',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}>
                                {t('lesson.source_language')}
                            </span>
                        </div>

                        {/* Vokabel-Zeilen (scrollbar) */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            minHeight: 0,
                        }}>
                            {detailLoading ? (
                                <div style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#6E6E73',
                                    fontSize: '13px',
                                }}>
                                    {t('lesson.loading')}
                                </div>
                            ) : vocabulary.length === 0 ? (
                                <div style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#6E6E73',
                                    fontSize: '13px',
                                }}>
                                    {t('lesson.no_vocabulary')}
                                </div>
                            ) : (
                                vocabulary.map((item, index) => (
                                    <div
                                        key={item.id || index}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            padding: '11px 20px',
                                            borderBottom: index < vocabulary.length - 1
                                                ? '1px solid rgba(255, 255, 255, 0.03)'
                                                : 'none',
                                            transition: 'background 0.12s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 122, 255, 0.04)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        {/* Griechisch – links, fett */}
                                        <span style={{
                                            fontSize: '15px',
                                            color: '#007AFF',
                                            fontWeight: 700,
                                            fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                                            lineHeight: 1.4,
                                        }}>
                                            {item.greek_word}
                                        </span>
                                        {/* Uebersetzung – rechts */}
                                        <span style={{
                                            fontSize: '14px',
                                            color: '#D1D1D6',
                                            fontWeight: 500,
                                            lineHeight: 1.4,
                                        }}>
                                            {item.source_word}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Vokabel-Zaehler unten */}
                        {vocabulary.length > 0 && (
                            <div style={{
                                padding: '10px 20px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                                textAlign: 'center',
                                fontSize: '12px',
                                color: '#6E6E73',
                                fontWeight: 500,
                                flexShrink: 0,
                            }}>
                                {vocabulary.length} {t('lesson.words_total')}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
