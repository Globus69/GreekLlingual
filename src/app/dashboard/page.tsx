"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { supabase } from '@/db/supabase';
import { useTranslation } from '@/lib/use-translation';
import Link from 'next/link';
import { StreakDisplay } from '@/components/dashboard/streak-display';
import { StreakMilestoneToast } from '@/components/dashboard/streak-milestone-toast';
import { useStreak } from '@/hooks/use-streak';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import VocabularyStatsWidget from '@/components/dashboard/vocabulary-stats-widget';

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
    const [masteryProgress, setMasteryProgress] = useState(38);
    const [stats, setStats] = useState({ streak: 0, words: 47, weak: 'Verbs' });
    const { t } = useTranslation();

    // Retry limiting for fetchStats to prevent infinite loops (use ref to avoid re-renders)
    const statsRetryCount = useRef(0);
    const MAX_STATS_RETRIES = 3;

    // Streak tracking
    const { updateStreak, getMilestoneMessage } = useStreak();
    const [milestoneToast, setMilestoneToast] = useState<{
        streak: number;
        isNewRecord: boolean;
        message: string;
    } | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            if (!user?.id) return;

            // Check retry limit
            if (statsRetryCount.current >= MAX_STATS_RETRIES) {
                console.warn(`⚠️ Max retries (${MAX_STATS_RETRIES}) reached for fetchStats, using fallback values`);
                setMasteryProgress(38);
                setStats(prev => ({
                    ...prev,
                    streak: user?.streak_days || 0
                }));
                return;
            }

            const { data: progressData, error } = await supabase
                .from('student_progress')
                .select('correct_count, attempts')
                .eq('student_id', user.id);

            // Log error but don't block dashboard
            if (error) {
                // Increment retry counter
                statsRetryCount.current += 1;
                console.warn(`student_progress query failed (attempt ${statsRetryCount.current}/${MAX_STATS_RETRIES}):`, error.message);
                // Set default values
                setMasteryProgress(38);
                return;
            }

            // Success - reset retry counter
            statsRetryCount.current = 0;

            if (progressData && progressData.length > 0) {
                const totalCorrect = progressData.reduce((sum: number, p: any) => sum + (p.correct_count || 0), 0);
                const totalItems = 120; // Assume target is 120 words
                const calculatedProgress = Math.min(100, Math.round((totalCorrect / totalItems) * 100));
                setMasteryProgress(calculatedProgress || 38);
                setStats(prev => ({
                    ...prev,
                    words: totalCorrect,
                    streak: user?.streak_days || 0
                }));
            } else {
                // No data found, use defaults
                setMasteryProgress(38);
                setStats(prev => ({
                    ...prev,
                    streak: user?.streak_days || 0
                }));
            }
        } catch (err) {
            // Increment retry counter
            statsRetryCount.current += 1;
            console.error(`Stats fetching error (attempt ${statsRetryCount.current}/${MAX_STATS_RETRIES}):`, err);
            // Set defaults on error
            setMasteryProgress(38);
            setStats(prev => ({
                ...prev,
                streak: user?.streak_days || 0
            }));
        }
    }, [user?.id]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                // Not logged in – redirect to login page
                router.push('/login');
                return;
            }
            fetchStats();

            // TEMPORARILY DISABLED: Auto-update streak (blocking dashboard load)
            // const checkStreak = async () => {
            //     const result = await updateStreak();
            //     if (result) {
            //         const milestone = getMilestoneMessage(result.new_streak);
            //         if (milestone || result.is_new_record) {
            //             setMilestoneToast({
            //                 streak: result.new_streak,
            //                 isNewRecord: result.is_new_record,
            //                 message: milestone || result.message,
            //             });
            //         }
            //     }
            // };
            // checkStreak();

            const timer = setTimeout(() => {
                setLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [user, authLoading, router, updateStreak, getMilestoneMessage, fetchStats]);

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
                    {/* Hero Right Side (Welcome / quick info) can go here if needed,
                        or we can keep it cleaner as per new design focus on footer */}
                    <div className="action-area" style={{ alignItems: 'flex-start', paddingLeft: '20px' }}>
                        <h2 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#fff' }}>{t('dashboard.welcome', { name: user?.name || 'SWS' })} 🏛️</h2>
                        <p style={{ fontSize: '15px', color: '#8E8E93', maxWidth: '500px', lineHeight: '1.5' }}
                            dangerouslySetInnerHTML={{ __html: t('dashboard.welcome_subtitle', { count: '12' }) }} />

                        {/* TEMPORARILY DISABLED: Streak Display (focusing on Practice Modes only) */}
                        {/* <div style={{ marginTop: '20px', maxWidth: '350px' }}>
                            <StreakDisplay />
                        </div> */}
                    </div>
                </div>

                {/* TEMPORARILY DISABLED: Vocabulary Stats Widget (focusing on Practice Modes only) */}
                {/* <div className="stats-widgets-row" style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: '20px',
                    marginBottom: '32px',
                    padding: '0 20px'
                }}>
                    <VocabularyStatsWidget onOpenDialog={() => setIsVocabDialogOpen(true)} />
                </div> */}

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
                        {/* Row 1 - Reordered: 7, 2, 3, 6 */}
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

                        {/* Row 2 - Reordered: 4, 5, 1 */}
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

                        {/* Row 3 */}
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

                        {/* Row 4 */}
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
                    </div>
                </div>
            </main>

            {/* Vocabulary Dialog - NEW FSRS Version */}
            <VocabularyDialog
                isOpen={isVocabDialogOpen}
                onClose={() => setIsVocabDialogOpen(false)}
                mode={vocabDialogMode}
            />

            {/* Grammar Dialog - FSRS Version */}
            <GrammarDialog
                isOpen={isGrammarDialogOpen}
                onClose={() => setIsGrammarDialogOpen(false)}
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

            {/* Daily Phrases Dialog - FSRS Version */}
            <DailyPhrasesDialog
                isOpen={isDailyPhrasesDialogOpen}
                onClose={() => setIsDailyPhrasesDialogOpen(false)}
            />

            {/* Due Cards Dialog - Specialized Dialog from Mobile */}
            <DueCardsDialog
                isOpen={isDueCardsDialogOpen}
                onClose={() => setIsDueCardsDialogOpen(false)}
            />

            {/* Weak Words Dialog - Specialized Dialog from Mobile */}
            <WeakWordsDialog
                isOpen={isWeakWordsDialogOpen}
                onClose={() => setIsWeakWordsDialogOpen(false)}
            />
        </div>
    );
}
