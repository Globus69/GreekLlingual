"use client";

import React, { useState, useEffect } from 'react';
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

export default function LessonDialog({ isOpen, onClose }: LessonDialogProps) {
    const { user } = useAuth();
    const { t, locale } = useTranslation();
    const [sessions, setSessions] = useState<LessonSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [sessionTopic, setSessionTopic] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [vocabulary, setVocabulary] = useState<LessonVocabItem[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

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
                setSessions(data as LessonSession[]);
            }
        } catch (err) {
            console.warn('Could not load lesson sessions:', err);
        }
        setLoading(false);
    };

    const loadSessionDetail = async (sessionId: string) => {
        setDetailLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_lesson_detail', { p_session_id: sessionId });

            if (!error && data && data.success) {
                setSessionTopic(data.session.topic || '');
                setSessionDate(data.session.date || '');
                setVocabulary(data.vocabulary || []);
                setSelectedSession(sessionId);
            }
        } catch (err) {
            console.warn('Could not load session detail:', err);
        }
        setDetailLoading(false);
    };

    const handleClose = () => {
        setSelectedSession(null);
        setSessionTopic('');
        setSessionDate('');
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

    // Detail-Ansicht einer Sitzung
    if (selectedSession) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{
                    padding: '32px',
                    maxWidth: '600px',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '24px',
                    }}>
                        <button
                            onClick={() => {
                                setSelectedSession(null);
                                setVocabulary([]);
                            }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                padding: '8px 16px',
                                color: '#8E8E93',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            ← {t('lesson.back_to_list')}
                        </button>
                        <span style={{
                            color: '#8E8E93',
                            fontSize: '14px',
                            fontWeight: 500,
                        }}>
                            {sessionDate}
                        </span>
                    </div>

                    {/* Thema */}
                    <div style={{
                        background: 'rgba(0, 122, 255, 0.06)',
                        border: '1px solid rgba(0, 122, 255, 0.15)',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        marginBottom: '20px',
                    }}>
                        <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                            {t('lesson.topic')}
                        </div>
                        <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700 }}>
                            {sessionTopic || '—'}
                        </div>
                    </div>

                    {/* Vokabelliste */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        marginBottom: '24px',
                    }}>
                        {/* Tabellen-Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 1fr',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            background: 'rgba(0, 0, 0, 0.2)',
                        }}>
                            <span style={{ fontSize: '11px', color: '#6E6E73', fontWeight: 600, textTransform: 'uppercase' }}>#</span>
                            <span style={{ fontSize: '11px', color: '#6E6E73', fontWeight: 600, textTransform: 'uppercase' }}>
                                {t('lesson.source_language')}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6E6E73', fontWeight: 600, textTransform: 'uppercase' }}>
                                {t('lesson.greek')}
                            </span>
                        </div>

                        {/* Vokabel-Zeilen */}
                        {detailLoading ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#8E8E93' }}>
                                {t('lesson.loading')}
                            </div>
                        ) : vocabulary.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#8E8E93' }}>
                                {t('lesson.no_vocabulary')}
                            </div>
                        ) : (
                            vocabulary.map((item, index) => (
                                <div
                                    key={item.id || index}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '40px 1fr 1fr',
                                        padding: '12px 16px',
                                        borderBottom: index < vocabulary.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span style={{ fontSize: '13px', color: '#6E6E73', fontWeight: 500 }}>
                                        {index + 1}
                                    </span>
                                    <span style={{ fontSize: '15px', color: '#fff', fontWeight: 500 }}>
                                        {item.source_word}
                                    </span>
                                    <span style={{ fontSize: '15px', color: '#007AFF', fontWeight: 500 }}>
                                        {item.greek_word}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Vokabel-Zaehler */}
                    <div style={{
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#6E6E73',
                        marginBottom: '20px',
                    }}>
                        {vocabulary.length} {t('lesson.words_total')}
                    </div>

                    {/* Abbrechen-Button */}
                    <button
                        onClick={handleClose}
                        style={{
                            width: '100%',
                            background: 'rgba(255, 69, 58, 0.1)',
                            border: '1px solid rgba(255, 69, 58, 0.2)',
                            borderRadius: '14px',
                            padding: '14px',
                            color: '#FF453A',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 69, 58, 0.18)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)';
                        }}
                    >
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    // Sitzungs-Liste (Hauptansicht)
    return (
        <div className="vocabulary-dialog-overlay">
            <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{
                padding: '32px',
                maxWidth: '600px',
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '28px',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>👩‍🏫</div>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 800,
                        color: '#fff',
                        margin: '0 0 6px 0',
                    }}>
                        {t('lesson.title')}
                    </h2>
                    <p style={{
                        fontSize: '14px',
                        color: '#8E8E93',
                        margin: 0,
                    }}>
                        {t('lesson.subtitle')}
                    </p>
                </div>

                {/* Sitzungen-Liste */}
                {sessions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        marginBottom: '24px',
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                        <p style={{ color: '#8E8E93', fontSize: '15px', margin: 0 }}>
                            {t('lesson.no_sessions')}
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginBottom: '24px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                    }}>
                        {sessions.map((session) => (
                            <button
                                key={session.session_id}
                                onClick={() => loadSessionDetail(session.session_id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    width: '100%',
                                    padding: '14px 16px',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)';
                                    e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                                }}
                            >
                                {/* Datum */}
                                <div style={{
                                    background: 'rgba(0, 122, 255, 0.1)',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    minWidth: '70px',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '11px', color: '#007AFF', fontWeight: 700, textTransform: 'uppercase' }}>
                                        {new Date(session.session_date + 'T00:00:00').toLocaleDateString(
                                            locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : locale === 'el' ? 'el-GR' : 'en-US',
                                            { day: '2-digit', month: 'short' }
                                        )}
                                    </div>
                                </div>

                                {/* Thema + Vokabel-Anzahl */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '15px',
                                        color: '#fff',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {session.session_topic || '—'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                                        {session.vocab_count} {t('lesson.words')}
                                    </div>
                                </div>

                                {/* Pfeil */}
                                <span style={{ color: '#6E6E73', fontSize: '16px' }}>›</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Abbrechen-Button */}
                <button
                    onClick={handleClose}
                    style={{
                        width: '100%',
                        background: 'rgba(255, 69, 58, 0.1)',
                        border: '1px solid rgba(255, 69, 58, 0.2)',
                        borderRadius: '14px',
                        padding: '14px',
                        color: '#FF453A',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 69, 58, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)';
                    }}
                >
                    {t('btn.cancel')}
                </button>
            </div>
        </div>
    );
}
