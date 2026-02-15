"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import ModuleGrid from '@/components/dashboard/ModuleGrid';
import '@/styles/liquid-glass.css';
import VocabularyDialog from '@/components/learning/VocabularyDialog';
import VocabularyDialogFSRS from '@/components/learning/VocabularyDialogFSRS';
import GrammarDialog from '@/components/learning/GrammarDialog';
import ComprehensionDialog from '@/components/learning/ComprehensionDialog';
import ListeningDialog from '@/components/learning/ListeningDialog';
import LessonDialog from '@/components/learning/LessonDialog';
import { supabase } from '@/db/supabase';
import { useTranslation } from '@/lib/use-translation';
import Link from 'next/link';

interface ActionTileProps {
    icon: string;
    label: string;
    primary?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

function ActionTile({ icon, label, primary, disabled, onClick }: ActionTileProps) {
    return (
        <div
            className={`action-tile-clean${disabled ? ' action-tile-disabled' : ''}`}
            onClick={disabled ? undefined : onClick}
            style={primary && !disabled ? { borderColor: 'rgba(0, 122, 255, 0.4)', background: 'rgba(0, 122, 255, 0.03)' } : {}}
        >
            <div className="at-icon">{icon}</div>
            <div className="at-label">{label}</div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [isVocabDialogOpen, setIsVocabDialogOpen] = useState(false);
    const [vocabDialogMode, setVocabDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isGrammarDialogOpen, setIsGrammarDialogOpen] = useState(false);
    const [grammarDialogMode, setGrammarDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isComprehensionDialogOpen, setIsComprehensionDialogOpen] = useState(false);
    const [comprehensionDialogMode, setComprehensionDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isListeningDialogOpen, setIsListeningDialogOpen] = useState(false);
    const [listeningDialogMode, setListeningDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [masteryProgress, setMasteryProgress] = useState(38);
    const [stats, setStats] = useState({ streak: 5, words: 47, weak: 'Verbs' });
    const { t } = useTranslation();

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                // Not logged in – redirect to login page
                router.push('/login');
                return;
            }
            fetchStats();
            const timer = setTimeout(() => {
                setLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [user, authLoading, router]);

    const fetchStats = async () => {
        try {
            if (!user?.id) return;

            const { data: progressData, error } = await supabase
                .from('student_progress')
                .select('correct_count, attempts')
                .eq('student_id', user.id);

            // Log error but don't block dashboard
            if (error) {
                console.warn('student_progress query failed (non-blocking):', error.message);
                // Set default values
                setMasteryProgress(38);
                return;
            }

            if (progressData && progressData.length > 0) {
                const totalCorrect = progressData.reduce((sum: number, p: any) => sum + (p.correct_count || 0), 0);
                const totalItems = 120; // Assume target is 120 words
                const calculatedProgress = Math.min(100, Math.round((totalCorrect / totalItems) * 100));
                setMasteryProgress(calculatedProgress || 38);
                setStats(prev => ({ ...prev, words: totalCorrect }));
            } else {
                // No data found, use defaults
                setMasteryProgress(38);
            }
        } catch (err) {
            console.error("Stats fetching error:", err);
            // Set defaults on error
            setMasteryProgress(38);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="login-overlay">
                <h1 style={{ color: 'white', fontSize: '24px' }}>🏛️ {authLoading ? t('dashboard.authenticating') : t('dashboard.loading')}</h1>
            </div>
        );
    }

    return (
        <div id="app" className="dashboard-layout">
            <DashboardHeader />
            <main className="dashboard-content">
                <div className="hero-section" style={{ height: 'auto', flex: '0 0 auto' }}>
                    <StatsCard />
                    {/* Hero Right Side (Welcome / quick info) can go here if needed, 
                        or we can keep it cleaner as per new design focus on footer */}
                    <div className="action-area" style={{ alignItems: 'flex-start', paddingLeft: '20px' }}>
                        <h2 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#fff' }}>{t('dashboard.welcome', { name: user?.name || 'SWS' })} 🏛️</h2>
                        <p style={{ fontSize: '15px', color: '#8E8E93', maxWidth: '500px', lineHeight: '1.5' }}
                           dangerouslySetInnerHTML={{ __html: t('dashboard.welcome_subtitle', { count: '12' }) }} />
                    </div>
                </div>

                <div className="dashboard-footer-area">
                    {/* LEFT: MASTERY BOX (PIMPED) */}
                    <div className="mastery-box">
                        <div className="mastery-title-v3">{t('mastery.title')}</div>
                        <div className="mastery-total-time">{t('mastery.total_time', { hours: '14.5' })}</div>

                        <div className="mastery-stats-row">
                            <div className="mastery-bar-container">
                                <span className="mastery-bar-icon">📖</span>
                                <div className="mastery-bar-wrapper">
                                    <div className="mastery-bar-fill" style={{ width: '62%', background: 'linear-gradient(90deg, #007AFF 0%, #00C6FF 100%)' }}></div>
                                </div>
                                <span className="mastery-bar-label">62 %</span>
                            </div>
                            <div className="mastery-bar-container">
                                <span className="mastery-bar-icon">👁️</span>
                                <div className="mastery-bar-wrapper">
                                    <div className="mastery-bar-fill" style={{ width: '28%', background: 'linear-gradient(90deg, #007AFF 0%, #00C6FF 100%)' }}></div>
                                </div>
                                <span className="mastery-bar-label">28 %</span>
                            </div>
                            <div className="mastery-bar-container">
                                <span className="mastery-bar-icon">👂</span>
                                <div className="mastery-bar-wrapper">
                                    <div className="mastery-bar-fill" style={{ width: '10%', background: 'linear-gradient(90deg, #007AFF 0%, #00C6FF 100%)' }}></div>
                                </div>
                                <span className="mastery-bar-label">10 %</span>
                            </div>
                        </div>

                        <div className="rating-tiles-grid">
                            <div className="rating-tile">
                                <span className="rating-tile-val" style={{ color: '#007AFF' }}>78%</span>
                                <span className="rating-tile-lbl">{t('mastery.last_test')}</span>
                            </div>
                            <div className="rating-tile">
                                <span className="rating-tile-val" style={{ color: '#007AFF' }}>85%</span>
                                <span className="rating-tile-lbl">{t('mastery.actual_test')}</span>
                            </div>
                            <div className="rating-tile">
                                <span className="rating-tile-val" style={{ color: '#007AFF' }}>92%</span>
                                <span className="rating-tile-lbl">{t('mastery.last_exam')}</span>
                            </div>
                        </div>

                        <div className="vocab-progress-section">
                            <div className="vocab-status-text"
                                 dangerouslySetInnerHTML={{ __html: t('mastery.vocab_progress', { learned: '187', total: '600', remaining: '413' }) }} />
                            <div className="vocab-bar-dual">
                                <div className="vocab-bar-learned" style={{ width: '31%' }}></div>
                                <div className="vocab-bar-repeat" style={{ width: '69%' }}></div>
                            </div>
                        </div>

                        <div className="mastery-suggestion">
                            {t('mastery.suggestion_default')}
                        </div>
                    </div>

                    {/* RIGHT: 4x4 QUICK ACTIONS GRID */}
                    <div className="quick-actions-grid">
                        <ActionTile
                            icon="👩‍🏫"
                            label={t('action.magic_round')}
                            onClick={() => setIsLessonDialogOpen(true)}
                        />
                        <ActionTile icon="⚡" label={t('action.quick_lesson')} disabled />
                        <ActionTile 
                            icon="💬" 
                            label={t('action.daily_phrases')} 
                            onClick={() => {
                                window.location.href = '/daily-phrases/daily-phrases.html';
                            }}
                        />
                        <ActionTile
                            icon="📚"
                            label={t('action.short_stories')}
                            onClick={() => {
                                window.location.href = '/short-stories/short-stories.html';
                            }}
                        />

                        <ActionTile 
                            icon="⚠️" 
                            label={t('action.train_weak')} 
                            onClick={() => {
                                setVocabDialogMode('weak');
                                setIsVocabDialogOpen(true);
                            }}
                        />

                        <ActionTile 
                            icon="🔄" 
                            label={t('action.review_vocab')} 
                            onClick={() => {
                                setVocabDialogMode('review');
                                setIsVocabDialogOpen(true);
                            }}
                        />

                        <ActionTile 
                            icon="📅" 
                            label={t('action.due_cards')} 
                            onClick={() => {
                                setVocabDialogMode('due');
                                setIsVocabDialogOpen(true);
                            }}
                        />

                        <ActionTile 
                            icon="📐" 
                            label={t('action.grammar_hits')} 
                            onClick={() => {
                                setGrammarDialogMode('review');
                                setIsGrammarDialogOpen(true);
                            }}
                        />

                        <ActionTile 
                            icon="👂" 
                            label={t('action.listening')} 
                            disabled
                            onClick={() => {
                                setListeningDialogMode('review');
                                setIsListeningDialogOpen(true);
                            }}
                        />
                        <ActionTile icon="🗣️" label={t('action.pronunciation')} disabled />
                        <ActionTile 
                            icon="🧠" 
                            label={t('action.comprehension')} 
                            disabled
                            onClick={() => {
                                setComprehensionDialogMode('review');
                                setIsComprehensionDialogOpen(true);
                            }}
                        />
                        <ActionTile icon="🎧" label={t('action.audio_immersion')} disabled />

                        <ActionTile icon="📝" label={t('action.test')} disabled />
                        <ActionTile icon="🏛️" label={t('action.cyprus_exam')} disabled />
                        <ActionTile icon="📕" label={t('action.book_recs')} disabled />
                        <ActionTile icon="📊" label={t('action.progress_history')} disabled />
                    </div>
                </div>
            </main>

            {/* Vocabulary Dialog - NEW FSRS Version */}
            <VocabularyDialogFSRS
                isOpen={isVocabDialogOpen}
                onClose={() => setIsVocabDialogOpen(false)}
                mode={vocabDialogMode}
            />

            {/* Grammar Dialog */}
            <GrammarDialog
                isOpen={isGrammarDialogOpen}
                onClose={() => setIsGrammarDialogOpen(false)}
                mode={grammarDialogMode}
            />

            {/* Comprehension Dialog */}
            <ComprehensionDialog
                isOpen={isComprehensionDialogOpen}
                onClose={() => setIsComprehensionDialogOpen(false)}
                mode={comprehensionDialogMode}
            />

            {/* Listening Dialog */}
            <ListeningDialog
                isOpen={isListeningDialogOpen}
                onClose={() => setIsListeningDialogOpen(false)}
                mode={listeningDialogMode}
            />

            {/* Lesson Dialog (Dein Unterricht) */}
            <LessonDialog
                isOpen={isLessonDialogOpen}
                onClose={() => setIsLessonDialogOpen(false)}
            />
        </div>
    );
}
