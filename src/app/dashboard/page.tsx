"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import ModuleGrid from '@/components/dashboard/ModuleGrid';
import '@/styles/liquid-glass.css';
import VocabularyDialog from '@/components/learning/vocabulary-dialog';
import GrammarDialog from '@/components/learning/grammar-dialog';
import ComprehensionDialog from '@/components/learning/comprehension-dialog';
import ListeningDialog from '@/components/learning/listening-dialog';
import LessonDialog from '@/components/learning/lesson-dialog';
import DailyPhrasesDialog from '@/components/learning/daily-phrases-dialog';
import DueCardsDialog from '@/components/learning/due-cards-dialog';
import WeakWordsDialog from '@/components/learning/weak-words-dialog';
// supabase client not needed directly; data is fetched via hooks
import { useTranslation } from '@/lib/use-translation';
import Link from 'next/link';
import { StreakDisplay } from '@/components/dashboard/streak-display';
import { StreakMilestoneToast } from '@/components/dashboard/streak-milestone-toast';
import { useStreak } from '@/hooks/use-streak';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import VocabularyStatsWidget from '@/components/dashboard/vocabulary-stats-widget';
import UserManualDialog from '@/components/ui/user-manual-dialog';

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
    const { isMobile, isTablet } = useDeviceDetection();
    const [isVocabDialogOpen, setIsVocabDialogOpen] = useState(false);
    const [vocabDialogMode, setVocabDialogMode] = useState<'due' | 'new' | 'all'>('due');
    const [isGrammarDialogOpen, setIsGrammarDialogOpen] = useState(false);
    const [grammarDialogMode, setGrammarDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isComprehensionDialogOpen, setIsComprehensionDialogOpen] = useState(false);
    const [comprehensionDialogMode, setComprehensionDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isListeningDialogOpen, setIsListeningDialogOpen] = useState(false);
    const [listeningDialogMode, setListeningDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [isDailyPhrasesDialogOpen, setIsDailyPhrasesDialogOpen] = useState(false);
    const [isDueCardsDialogOpen, setIsDueCardsDialogOpen] = useState(false);
    const [isWeakWordsDialogOpen, setIsWeakWordsDialogOpen] = useState(false);
    const { t } = useTranslation();

    // Streak tracking (for milestone toast system)
    const { getMilestoneMessage } = useStreak();
    const [milestoneToast, setMilestoneToast] = useState<{
        streak: number;
        isNewRecord: boolean;
        message: string;
    } | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            const timer = setTimeout(() => setLoading(false), 800);
            return () => clearTimeout(timer);
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="login-overlay">
                <h1 style={{ color: 'white', fontSize: '24px' }}>🏛️ {authLoading ? t('dashboard.authenticating') : t('dashboard.loading')}</h1>
            </div>
        );
    }

    return (
        <div id="app" className="dashboard-layout">
            <DashboardHeader studentName={user?.name} />

            {/* Milestone Toast */}
            {milestoneToast && (
                <StreakMilestoneToast
                    streak={milestoneToast.streak}
                    isNewRecord={milestoneToast.isNewRecord}
                    message={milestoneToast.message}
                    onClose={() => setMilestoneToast(null)}
                />
            )}

            <main className="dashboard-content">
                <div className="hero-section" style={{ height: 'auto', flex: '0 0 auto' }}>
                    <StatsCard />
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
                            icon="📅"
                            label={`7. ${t('action.due_cards')}`}
                            onClick={() => setIsDueCardsDialogOpen(true)}
                        />
                        <ActionTile
                            icon="⚡"
                            label={`2. ${t('action.quick_lesson')}`}
                            onClick={() => console.log('🔥 Button 2: Quick Lesson clicked')}
                        />
                        <ActionTile
                            icon="💬"
                            label={`3. ${t('action.daily_phrases')}`}
                            onClick={() => setIsDailyPhrasesDialogOpen(true)}
                        />
                        <ActionTile
                            icon="🔄"
                            label={`6. ${t('action.review_vocab')}`}
                            onClick={() => {
                                setVocabDialogMode('all');
                                setIsVocabDialogOpen(true);
                            }}
                        />

                        <ActionTile
                            icon="📚"
                            label={`4. ${t('action.short_stories')}`}
                            onClick={() => {
                                window.location.href = '/short-stories/short-stories.html';
                            }}
                        />

                        <ActionTile
                            icon="⚠️"
                            label={`5. ${t('action.train_weak')}`}
                            onClick={() => setIsWeakWordsDialogOpen(true)}
                        />

                        <ActionTile
                            icon="👩‍🏫"
                            label={`1. ${t('action.magic_round')}`}
                            onClick={() => setIsLessonDialogOpen(true)}
                        />


                        <ActionTile
                            icon="📐"
                            label={`8. ${t('action.grammar_hits')}`}
                            onClick={() => {
                                setGrammarDialogMode('review');
                                setIsGrammarDialogOpen(true);
                            }}
                        />

                        <ActionTile
                            icon="👂"
                            label={`9. ${t('action.listening')}`}
                            onClick={() => {
                                setListeningDialogMode('review');
                                setIsListeningDialogOpen(true);
                            }}
                        />
                        <ActionTile
                            icon="🗣️"
                            label={`10. ${t('action.pronunciation')}`}
                            onClick={() => console.log('🔥 Button 10: Pronunciation clicked')}
                        />
                        <ActionTile
                            icon="🧠"
                            label={`11. ${t('action.comprehension')}`}
                            onClick={() => {
                                setComprehensionDialogMode('review');
                                setIsComprehensionDialogOpen(true);
                            }}
                        />
                        <ActionTile
                            icon="🎧"
                            label={`12. ${t('action.audio_immersion')}`}
                            onClick={() => console.log('🔥 Button 12: Audio Immersion clicked')}
                        />

                        <ActionTile
                            icon="🎮"
                            label="13. Practice Modes"
                            onClick={() => router.push('/practice-modes')}
                        />
                        <ActionTile
                            icon="🏛️"
                            label={`14. ${t('action.cyprus_exam')}`}
                            onClick={() => console.log('🔥 Button 14: Cyprus Exam clicked')}
                        />
                        <ActionTile
                            icon="📕"
                            label={`15. ${t('action.book_recs')}`}
                            onClick={() => console.log('🔥 Button 15: Book Recommendations clicked')}
                        />
                        <ActionTile
                            icon="📊"
                            label="16. Statistics"
                            onClick={() => router.push('/stats')}
                        />

                        <ActionTile
                            icon="🎮"
                            label="17. Memory Game"
                            primary
                            onClick={() => router.push('/practice-modes/memory')}
                        />
                    </div>
                </div>
            </main>

            <VocabularyDialog
                isOpen={isVocabDialogOpen}
                onClose={() => setIsVocabDialogOpen(false)}
                mode={vocabDialogMode}
            />

            <GrammarDialog
                isOpen={isGrammarDialogOpen}
                onClose={() => setIsGrammarDialogOpen(false)}
            />

            <ComprehensionDialog
                isOpen={isComprehensionDialogOpen}
                onClose={() => setIsComprehensionDialogOpen(false)}
                mode={comprehensionDialogMode}
            />

            <ListeningDialog
                isOpen={isListeningDialogOpen}
                onClose={() => setIsListeningDialogOpen(false)}
                mode={listeningDialogMode}
            />

            <LessonDialog
                isOpen={isLessonDialogOpen}
                onClose={() => setIsLessonDialogOpen(false)}
            />

            <DailyPhrasesDialog
                isOpen={isDailyPhrasesDialogOpen}
                onClose={() => setIsDailyPhrasesDialogOpen(false)}
            />

            <DueCardsDialog
                isOpen={isDueCardsDialogOpen}
                onClose={() => setIsDueCardsDialogOpen(false)}
                onOpenReview={() => { setIsVocabDialogOpen(true); setVocabDialogMode('all'); }}
                onOpenWeakWords={() => setIsWeakWordsDialogOpen(true)}
            />

            <WeakWordsDialog
                isOpen={isWeakWordsDialogOpen}
                onClose={() => setIsWeakWordsDialogOpen(false)}
            />

            <UserManualDialog />
        </div>
    );
}
