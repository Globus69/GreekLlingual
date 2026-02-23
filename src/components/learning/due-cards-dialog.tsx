"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';
import FlashcardFSRS from '@/components/learning/flashcard-fsrs';
import { useTranslation } from '@/lib/use-translation';
import { usePerformanceEvaluation } from '@/lib/use-performance-evaluation';
import { FSRSScheduler } from '@/lib/fsrs/fsrs-scheduler';
import type { Card, Rating } from '@/lib/fsrs/fsrs-types';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { speakGreek, isSpeaking, stopSpeaking } from '@/lib/tts/greek-tts';
import SwipeTutorialDialog from '@/components/ui/swipe-tutorial-dialog';
import { APP_VERSION } from '@/lib/appVersion';
import '@/styles/liquid-glass.css';

// Extended LearningItem with FSRS fields
interface FSRSLearningItem {
    id: string; // UUID from DB
    type: string;
    english: string;
    russian?: string;
    greek: string;
    greek_word?: string; // Alternative field name
    phonetic?: string; // IPA pronunciation
    example_en: string | null;
    example_gr: string | null;
    audio_url: string | null;
    level?: string;
    difficulty?: string;
    // FSRS-6 fields
    fsrs_difficulty: number;
    fsrs_stability: number;
    fsrs_last_review?: string;
    fsrs_due: string;
    fsrs_reps: number;
    fsrs_lapses: number;
    fsrs_state: 'new' | 'learning' | 'review' | 'relearning';
    created_at: string;
}

interface DueCardsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenReview?: () => void;
    onOpenWeakWords?: () => void;
}

export default function DueCardsDialog({ isOpen, onClose, onOpenReview, onOpenWeakWords }: DueCardsDialogProps) {
    const mode = 'due'; // Fixed mode: only show due cards
    const { user, loading: authLoading } = useAuth();
    const { t, locale } = useTranslation();
    const { evaluate } = usePerformanceEvaluation();
    const { toasts, showToast, removeToast, error, warning, success, info } = useToast();

    // FSRS Scheduler instance (memoized)
    const scheduler = useMemo(() => new FSRSScheduler(), []);

    const [vocabulary, setVocabulary] = useState<FSRSLearningItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [perfMessage, setPerfMessage] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [autoPlay, setAutoPlay] = useState(true); // Auto-play TTS on flip
    const [isPlaying, setIsPlaying] = useState(false); // TTS playing state
    const [speechRate, setSpeechRate] = useState<number>(0.9); // 0.6 = slow, 0.9 = normal, 1.2 = fast
    const [announceMessage, setAnnounceMessage] = useState<string>(''); // Screen reader announcements
    const [sessionId, setSessionId] = useState<string | null>(null); // Track current session
    const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);

    const STUDENT_ID = user?.id || '';

    // Load preferences from localStorage
    useEffect(() => {
        const savedAutoPlay = localStorage.getItem('tts-autoplay');
        if (savedAutoPlay !== null) {
            setAutoPlay(savedAutoPlay === 'true');
        }

        const savedRate = localStorage.getItem('tts-speed');
        if (savedRate !== null) {
            setSpeechRate(parseFloat(savedRate));
        }
    }, []);

    // Offline/Online detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            info('Connection restored');
        };

        const handleOffline = () => {
            setIsOnline(false);
            warning('You are offline. Changes may not be saved.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial state
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Show swipe tutorial if not seen before
    useEffect(() => {
        if (isOpen && !loading && !authLoading && vocabulary.length > 0 && !showSummary && user) {
            const seenVersion = (user as any).acknowledged_swipe_tutorial_version || '0.0.0';
            const isLatest = seenVersion === APP_VERSION;

            if (!isLatest) {
                const timer = setTimeout(() => {
                    setShowSwipeTutorial(true);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [isOpen, loading, authLoading, vocabulary.length, showSummary, user]);

    // Load due cards on open
    useEffect(() => {
        if (isOpen && STUDENT_ID) {
            loadDueCards();
            setShowSummary(false);
            setFlipped(false);
            setCurrentIndex(0);
            setRatings({ again: 0, hard: 0, good: 0, easy: 0 });
            setCorrect(0);
            setTotal(0);
            setLoadError(null);
        }
    }, [isOpen, mode, STUDENT_ID]);

    // TTS Audio
    const playAudio = async () => {
        if (vocabulary.length === 0 || currentIndex >= vocabulary.length) return;

        const currentVocab = vocabulary[currentIndex];
        if (!currentVocab) return;

        const text = currentVocab.greek_word || currentVocab.greek;
        if (!text) return;

        setIsPlaying(true);
        setAnnounceMessage(`Playing pronunciation: ${text}`);

        const result = await speakGreek(text, { rate: speechRate });

        if (!result.success) {
            warning(result.message || 'Failed to play audio');
            setAnnounceMessage('Audio playback failed');
        }

        // Reset playing state after a delay (speech duration estimate adjusted for rate)
        const baseDuration = text.length * 100; // 100ms per character
        const adjustedDuration = baseDuration / speechRate; // Slower rate = longer duration
        setTimeout(() => {
            setIsPlaying(false);
            setAnnounceMessage('Playback complete');
        }, adjustedDuration);
    };

    // Auto-play TTS when card flips (if enabled)
    useEffect(() => {
        if (flipped && autoPlay && vocabulary.length > 0) {
            // Small delay to let flip animation complete
            const timer = setTimeout(() => {
                playAudio();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [flipped, currentIndex, autoPlay, vocabulary.length]);

    // Speed control helper
    const getSpeedLabel = (rate: number): { label: string; emoji: string } => {
        if (rate <= 0.7) return { label: 'Slow', emoji: '🐢' };
        if (rate <= 1.0) return { label: 'Normal', emoji: '▶️' };
        return { label: 'Fast', emoji: '🐇' };
    };

    const cycleSpeed = () => {
        let newRate: number;
        if (speechRate <= 0.7) {
            newRate = 0.9; // Slow → Normal
        } else if (speechRate <= 1.0) {
            newRate = 1.2; // Normal → Fast
        } else {
            newRate = 0.6; // Fast → Slow
        }
        setSpeechRate(newRate);
        localStorage.setItem('tts-speed', String(newRate));
        const speedInfo = getSpeedLabel(newRate);
        const message = `Speed: ${speedInfo.emoji} ${speedInfo.label}`;
        setAnnounceMessage(message);
        info(message);
    };

    // Keyboard shortcuts (1=Again, 2=Hard, 3=Good, 4=Easy, Space=Flip)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case ' ':
                case 'Spacebar':
                    e.preventDefault();
                    setFlipped(!flipped);
                    break;
                case '1':
                    e.preventDefault();
                    if (flipped) handleRating(1); // Again
                    break;
                case '2':
                    e.preventDefault();
                    if (flipped) handleRating(2); // Hard
                    break;
                case '3':
                    e.preventDefault();
                    if (flipped) handleRating(3); // Good
                    break;
                case '4':
                    e.preventDefault();
                    if (flipped) handleRating(4); // Easy
                    break;
                case 'a':
                case 'A':
                    e.preventDefault();
                    playAudio();
                    break;
                case 'Escape':
                    e.preventDefault();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, flipped, currentIndex, vocabulary.length]);

    /**
     * Load due cards using FSRS RPC function
     */
    const loadDueCards = async () => {
        setLoading(true);
        setLoadError(null);
        console.log(`🔄 Loading FSRS cards (mode: ${mode}, user: ${STUDENT_ID}, level: ${user?.level})`);

        // Check online status
        if (!navigator.onLine) {
            setLoadError('No internet connection');
            error('Unable to load cards. Please check your internet connection.');
            setLoading(false);
            return;
        }

        try {
            const { data, error: rpcError } = await supabase.rpc('get_due_cards_today', {
                p_user_id: STUDENT_ID,
                p_limit: 100
            });

            if (rpcError) {
                console.error('❌ FSRS RPC error (get_due_cards_today):', {
                    message: rpcError.message,
                    details: rpcError.details,
                    hint: rpcError.hint,
                    code: rpcError.code,
                    fullError: rpcError
                });

                if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
                    console.warn('⚠️ RPC function get_due_cards_today does not exist.');
                }

                setLoadError(rpcError.message || 'Failed to load cards');
                error('Failed to load cards. Please try again.');
                setVocabulary([]);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                console.log(`✅ Loaded ${data.length} due cards`);
                setVocabulary(data as FSRSLearningItem[]);
                setLoadError(null);

                // Start session tracking
                if (user?.id) {
                    try {
                        const { data: sessionData, error: sessionError } = await supabase.rpc('start_learning_session', {
                            p_student_id: user.id,
                            p_session_type: 'vocabulary'
                        });

                        if (sessionError) {
                            console.warn('Session tracking failed:', sessionError);
                        } else if (sessionData) {
                            setSessionId(sessionData);
                            console.log(`📊 Session started: ${sessionData}`);
                        }
                    } catch (err) {
                        console.warn('Session start error:', err);
                    }
                }
            } else {
                console.log('⚠️ No due cards found');
                setVocabulary([]);
                setLoadError(null); // Not an error, just empty
            }
        } catch (err) {
            console.error('❌ Load error:', err);
            const errMessage = err instanceof Error ? err.message : 'Unknown error';
            setLoadError(errMessage);
            error('An error occurred while loading cards. Please try again.');
            setVocabulary([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load 15 new vocabs (items not yet studied)
     */
    const handleLoadNewVocabs = async () => {
        setLoading(true);
        setLoadError(null);
        console.log(`🔄 Loading 15 NEW vocabulary cards for user: ${STUDENT_ID}`);

        if (!navigator.onLine) {
            setLoadError('No internet connection');
            error('Unable to load cards. Please check your internet connection.');
            setLoading(false);
            return;
        }

        try {
            const { data, error: rpcError } = await supabase.rpc('get_new_vocabs', {
                p_user_id: STUDENT_ID,
                p_limit: 15
            });

            if (rpcError) {
                console.error('❌ RPC error (get_new_vocabs):', rpcError);
                setLoadError(rpcError.message || 'Failed to load new cards');
                error('Failed to load new cards. Please try again.');
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                console.log(`✅ Loaded ${data.length} new vocabulary cards`);
                setVocabulary(data as FSRSLearningItem[]);
                setCurrentIndex(0);
                setFlipped(false);
                setTotal(0);
                setCorrect(0);
                setRatings({ again: 0, hard: 0, good: 0, easy: 0 });
                setShowSummary(false);
            } else {
                info('No more new vocabulary available right now.');
            }
        } catch (err) {
            console.error('❌ Load error:', err);
            setLoadError('An error occurred while loading new cards.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle rating (FSRS-6 algorithm)
     * @param rating 1=Again, 2=Hard, 3=Good, 4=Easy
     */
    const handleRating = async (rating: Rating) => {
        if (!flipped) return; // Must flip card first

        const item = vocabulary[currentIndex];
        if (!item) return;

        console.log(`⭐ Rating: ${rating} (${['', 'Again', 'Hard', 'Good', 'Easy'][rating]})`);

        // Create FSRS Card from DB item
        const currentCard: Card = {
            id: item.id,
            difficulty: item.fsrs_difficulty,
            stability: item.fsrs_stability,
            due: new Date(item.fsrs_due),
            reps: item.fsrs_reps,
            lapses: item.fsrs_lapses,
            state: item.fsrs_state,
            lastReview: item.fsrs_last_review ? new Date(item.fsrs_last_review) : null,
        };

        // Calculate new FSRS parameters
        const now = new Date();
        const updatedCard = scheduler.rate(currentCard, rating, now);
        const intervalDays = scheduler.calculateInterval(updatedCard.stability);

        console.log(`📊 FSRS Update:
  Difficulty: ${currentCard.difficulty.toFixed(2)} → ${updatedCard.difficulty.toFixed(2)}
  Stability: ${currentCard.stability.toFixed(2)} → ${updatedCard.stability.toFixed(2)} days
  Interval: ${intervalDays.toFixed(1)} days
  State: ${currentCard.state} → ${updatedCard.state}
  Reps: ${updatedCard.reps}, Lapses: ${updatedCard.lapses}`);

        // Update stats
        setTotal(prev => prev + 1);
        if (rating >= 3) setCorrect(prev => prev + 1); // Good/Easy = correct

        // Update ratings counter
        if (rating === 1) setRatings(prev => ({ ...prev, again: prev.again + 1 }));
        else if (rating === 2) setRatings(prev => ({ ...prev, hard: prev.hard + 1 }));
        else if (rating === 3) setRatings(prev => ({ ...prev, good: prev.good + 1 }));
        else if (rating === 4) setRatings(prev => ({ ...prev, easy: prev.easy + 1 }));

        try {
            // Check online status before updating
            if (!navigator.onLine) {
                warning('Offline - changes will not be saved');
            } else {
                let rpcName = 'update_card_fsrs';
                let rpcParams: any = {
                    p_user_id: STUDENT_ID,
                    p_rating: rating,
                    p_new_difficulty: updatedCard.difficulty,
                    p_new_stability: updatedCard.stability,
                    p_new_due: updatedCard.due.toISOString(),
                    p_new_reps: updatedCard.reps,
                    p_new_lapses: updatedCard.lapses,
                    p_new_state: updatedCard.state,
                    p_interval_days: intervalDays,
                    p_old_difficulty: currentCard.difficulty,
                    p_old_stability: currentCard.stability,
                };

                if (item.type === 'vocabulary') {
                    rpcName = 'update_card_fsrs';
                    rpcParams.p_card_id = item.id;
                } else if (item.type === 'daily_phrase') {
                    rpcName = 'update_phrase_fsrs';
                    rpcParams.p_phrase_id = item.id;
                }

                // Call RPC to update card in database
                const { data: rpcData, error: rpcError } = await supabase.rpc(rpcName as any, rpcParams);

                if (rpcError) {
                    console.error(`❌ Update RPC error (${rpcName}):`, {
                        message: rpcError.message,
                        details: rpcError.details,
                        hint: rpcError.hint,
                        code: rpcError.code,
                        fullError: rpcError
                    });

                    if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
                        console.warn(`⚠️ RPC function ${rpcName} does not exist.`);
                    }

                    warning('Failed to save progress. Continuing anyway...');
                    // Continue anyway (optimistic update)
                } else {
                    console.log('✅ Card updated in DB:', rpcData);
                }
            }
        } catch (err) {
            console.error('❌ Update error:', err);
            warning('Failed to save progress. Please check your connection.');
        }

        // Move to next card
        if (currentIndex < vocabulary.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFlipped(false);
        } else {
            // Session complete
            setShowSummary(true);

            // End session tracking
            if (sessionId) {
                try {
                    const { data: sessionEndData, error: sessionEndError } = await supabase.rpc('end_learning_session', {
                        p_session_id: sessionId,
                        p_cards_reviewed: total,
                        p_cards_correct: correct
                    });

                    if (sessionEndError) {
                        console.warn('Session end failed:', sessionEndError);
                    } else if (sessionEndData && sessionEndData.length > 0) {
                        const result = sessionEndData[0];
                        console.log(`📊 Session completed: ${result.duration_minutes} minutes`);
                    }
                } catch (err) {
                    console.warn('Session end error:', err);
                }
            }

            // Update user streak
            if (user && user.id) {
                try {
                    const { data: streakData, error: streakError } = await supabase.rpc('update_user_streak', {
                        p_user_id: user.id
                    });

                    if (streakError) {
                        console.warn('Streak update failed:', streakError);
                    } else if (streakData && streakData.length > 0) {
                        const result = streakData[0];
                        console.log(`🔥 Streak updated: ${result.new_streak} days - ${result.message}`);
                        if (result.is_new_record) {
                            success(`${result.message} 🏆`);
                        }
                    }
                } catch (err) {
                    console.warn('Streak update error:', err);
                }
            }

            // Performance evaluation (existing system)
            if (user && user.id !== 'admin-local') {
                try {
                    await evaluate(50);
                } catch (err) {
                    console.warn('Performance evaluation failed:', err);
                }
            }
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setRatings({ again: 0, hard: 0, good: 0, easy: 0 });
        setCorrect(0);
        setTotal(0);
        setShowSummary(false);
        setFlipped(false);
        loadDueCards(); // Reload fresh cards
    };

    const handleCancel = async () => {
        // End session if one is active
        if (sessionId) {
            try {
                await supabase.rpc('end_learning_session', {
                    p_session_id: sessionId,
                    p_cards_reviewed: total,
                    p_cards_correct: correct
                });
                console.log('📊 Session ended (cancelled)');
            } catch (err) {
                console.warn('Session end error:', err);
            }
        }

        setCurrentIndex(0);
        setRatings({ again: 0, hard: 0, good: 0, easy: 0 });
        setCorrect(0);
        setTotal(0);
        setShowSummary(false);
        setFlipped(false);
        setSessionId(null);
        onClose();
    };

    if (!isOpen) return null;

    let dialogContent;

    // Loading state
    if (loading) {
        dialogContent = (
            <div className="dialog-content">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <h2>{t('vocab.loading')}</h2>
                    <p>{t('vocab.loading_subtitle')}</p>
                </div>
            </div>
        );
    }

    // No cards available (differentiate between error and empty)
    else if (vocabulary.length === 0) {
        dialogContent = (
            <div className="dialog-content">
                <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    {loadError ? (
                        <>
                            <h2>❌ Error Loading Cards</h2>
                            <p className="error-message">{loadError}</p>
                            <div className="empty-actions">
                                <button onClick={() => loadDueCards()} className="btn-primary">
                                    🔄 Retry
                                </button>
                                <button onClick={handleCancel} className="btn-secondary">
                                    {t('vocab.back_to_dashboard')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎉</div>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#fff',
                                marginBottom: '16px',
                                lineHeight: '1.2',
                                textAlign: 'center'
                            }}>
                                {t('vocab.all_learned_wink') || 'PRIMA, du hast die Vokabeln für heute gelernt 🎉'}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', textAlign: 'center' }}>
                                {t('vocab.caught_up') || 'Alles erledigt! Keine Karten zur Wiederholung ausstehend.'}
                            </p>

                            <div className="empty-actions">
                                {(onOpenReview || onOpenWeakWords || true) && (
                                    <>
                                        <button onClick={handleLoadNewVocabs} className="btn-primary">
                                            ✨ {t('vocab.new_vocabs') || 'Neue Karten'} (+15)
                                        </button>
                                        {onOpenReview && (
                                            <button onClick={() => { onClose(); onOpenReview(); }} className="btn-secondary">
                                                📖 {t('vocab.continue_review') || 'Review Vocab'}
                                            </button>
                                        )}
                                        {onOpenWeakWords && (
                                            <button onClick={() => { onClose(); onOpenWeakWords(); }} className="btn-secondary">
                                                💪 {t('vocab.train_weak_words') || 'Weak Words'}
                                            </button>
                                        )}
                                    </>
                                )}
                                <button onClick={handleCancel} className="btn-secondary">
                                    🏠 {t('vocab.back_to_dashboard') || 'Zum Dashboard'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Session complete summary
    else if (showSummary) {
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        dialogContent = (
            <div className="dialog-content" style={{ padding: '32px 24px', maxWidth: '400px' }}>
                <div className="summary-content">
                    <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>✅ {t('vocab.session_complete') || 'Sitzung abgeschlossen!'}</h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: '12px',
                        marginBottom: '20px',
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
                            borderRadius: '16px', padding: '16px 8px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '4px' }}>✅</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', lineHeight: 1.2 }}>{correct}/{total}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginTop: '4px', fontWeight: '500' }}>{t('vocab.correct') || 'Richtig'}</div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)',
                            borderRadius: '16px', padding: '16px 8px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '4px' }}>🎯</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', lineHeight: 1.2 }}>{accuracy}<span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)' }}>%</span></div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginTop: '4px', fontWeight: '500' }}>{t('vocab.accuracy') || 'Genauigkeit'}</div>
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        padding: '8px 20px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: '28px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <span style={{ color: '#93C5FD', fontSize: '15px' }}>❌ {t('btn.again') || 'Again'}</span>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>{ratings.again}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <span style={{ color: '#93C5FD', fontSize: '15px' }}>🟠 {t('btn.hard') || 'Hard'}</span>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>{ratings.hard}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <span style={{ color: '#93C5FD', fontSize: '15px' }}>✅ {t('btn.good') || 'Good'}</span>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>{ratings.good}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                            <span style={{ color: '#93C5FD', fontSize: '15px' }}>🎯 {t('btn.easy') || 'Easy'}</span>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>{ratings.easy}</span>
                        </div>
                    </div>

                    {perfMessage && (
                        <div className="perf-message" style={{ textAlign: 'center', marginBottom: '20px', color: '#10B981', fontWeight: '500' }}>
                            {perfMessage}
                        </div>
                    )}

                    <div className="summary-actions">
                        {(onOpenReview || onOpenWeakWords) && (
                            <>
                                {onOpenReview && (
                                    <button onClick={() => { onClose(); onOpenReview(); }} className="btn-secondary">
                                        📖 {t('vocab.continue_review') || 'Review Vocab'}
                                    </button>
                                )}
                                {onOpenWeakWords && (
                                    <button onClick={() => { onClose(); onOpenWeakWords(); }} className="btn-secondary">
                                        💪 {t('vocab.train_weak_words') || 'Weak Words'}
                                    </button>
                                )}
                            </>
                        )}
                        <button onClick={handleRestart} className="btn-secondary">
                            🔄 {t('btn.restart') || 'Neu starten'}
                        </button>
                        <button onClick={handleCancel} className="btn-primary">
                            🏠 {t('vocab.back_to_dashboard') || 'Zum Dashboard'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main vocabulary review interface
    else {
        const currentVocab = vocabulary[currentIndex];
        const progress = `${currentIndex + 1} / ${vocabulary.length}`;
        const progressPercentage = vocabulary.length > 0 ? ((currentIndex + 1) / vocabulary.length) * 100 : 0;
        const totalRatings = ratings.again + ratings.hard + ratings.good + ratings.easy;

        dialogContent = (
            <div className="dialog-content vocabulary-dialog">
                <div className="dialog-header">
                    <h2>🎯 Due Cards Today</h2>
                    {!loading && vocabulary.length > 0 && (
                        <div className="progress-info" style={{ marginTop: '16px' }}>
                            <span>{t('vocab.card_of', { current: currentIndex + 1, total: vocabulary.length })
                                .replace('{current}', String(currentIndex + 1))
                                .replace('{total}', String(vocabulary.length))
                                || `Karte ${currentIndex + 1} von ${vocabulary.length}`}</span>
                            {correct > 0 && <span style={{ marginLeft: '12px', color: '#4CAF50' }}>✅ {correct}</span>}
                            {(total - correct) > 0 && <span style={{ marginLeft: '12px', color: '#f44336' }}>❌ {total - correct}</span>}
                        </div>
                    )}
                </div>

                <div className="card-container">
                    <FlashcardFSRS
                        front={locale === 'ru' && currentVocab.russian ? currentVocab.russian : currentVocab.english}
                        back={currentVocab.greek_word || currentVocab.greek}
                        phonetic={currentVocab.phonetic}
                        example={currentVocab.example_gr || undefined}
                        onFlip={() => setFlipped(!flipped)}
                        flipped={flipped}
                        showRatingButtons={true}
                        onRating={handleRating}
                        onBackClick={playAudio}
                        useFSRS={true}
                        itemType={currentVocab.type as 'vocabulary' | 'daily_phrase'}
                    />
                </div>

                <div className="dialog-footer">
                    <button
                        onClick={playAudio}
                        disabled={isPlaying}
                        className={`btn-audio ${isPlaying ? 'playing' : ''}`}
                        title="Play audio (A)"
                    >
                        {isPlaying ? '🔊 Playing...' : '🔊 Play Audio'}
                    </button>
                    <button
                        onClick={cycleSpeed}
                        className="btn-speed"
                        title={`Speed: ${getSpeedLabel(speechRate).label}`}
                    >
                        {getSpeedLabel(speechRate).emoji}
                    </button>
                    <button
                        onClick={() => {
                            const newValue = !autoPlay;
                            setAutoPlay(newValue);
                            localStorage.setItem('tts-autoplay', String(newValue));
                            info(newValue ? 'Auto-play enabled' : 'Auto-play disabled');
                        }}
                        className={`btn-autoplay ${autoPlay ? 'active' : ''}`}
                        title={`Auto-play: ${autoPlay ? 'ON' : 'OFF'}`}
                    >
                        {autoPlay ? '🔊' : '🔇'} Auto
                    </button>
                    <button onClick={handleCancel} className="btn-cancel">× Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dialog-overlay">
            {dialogContent}

            <style jsx global>{`
                .dialog-overlay {
                    position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                }

                .dialog-content {
                    background: rgba(20, 20, 24, 0.95);
                border-radius: 24px;
                padding: 32px;
                max-width: 600px;
                width: 90vw;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
                }

                .dialog-header {
                    text - align: center;
                margin-bottom: 24px;
                }

                .dialog-header h2 {
                    font - size: 24px;
                font-weight: bold;
                color: #fff;
                margin: 0;
                }

                .dialog-footer {
                    display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 24px;
                }

                .empty-state {
                    text - align: center;
                padding: 40px 20px;
                }

                .empty-state h3 {
                    font - size: 24px;
                margin-bottom: 16px;
                color: #fff;
                }

                .empty-state p {
                    color: rgba(255, 255, 255, 0.7);
                margin-bottom: 12px;
                line-height: 1.5;
                }

                .empty-actions {
                    display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 24px;
                }

                .btn-primary {
                    padding: 12px 24px;
                border-radius: 12px;
                border: none;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
                background: rgba(0, 122, 255, 0.3);
                color: #007AFF;
                border: 1px solid rgba(0, 122, 255, 0.5);
                }

                .btn-primary:hover {
                    background: rgba(0, 122, 255, 0.4);
                transform: translateY(-1px);
                }

                .btn-audio, .btn-speed, .btn-autoplay, .btn-cancel {
                    padding: 10px 16px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                background: rgba(255, 255, 255, 0.05);
                color: #fff;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
                font-size: 14px;
                }

                .btn-audio:hover, .btn-speed:hover, .btn-autoplay:hover, .btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.1);
                transform: translateY(-1px);
                }

                .btn-audio:disabled {
                    opacity: 0.5;
                cursor: not-allowed;
                }

                .btn-autoplay.active {
                    background: rgba(0, 122, 255, 0.2);
                border-color: rgba(0, 122, 255, 0.4);
                color: #007AFF;
                }

                .icon-btn {
                    width: 40px;
                height: 40px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.05);
                color: #fff;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.2s;
                }

                .icon-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                transform: scale(1.05);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .btn-secondary:disabled {
                    opacity: 0.5;
                cursor: not-allowed;
                }

                /* Loading State */
                .loading-state {
                    text - align: center;
                padding: 60px 20px;
                }

                .spinner {
                    width: 48px;
                height: 48px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top-color: #007AFF;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 24px;
                }

                @keyframes spin {
                    to {transform: rotate(360deg); }
                }

                .progress-text {
                    color: #888;
                font-size: 14px;
                margin-top: 8px;
                }

                .empty-state h2 {
                    font - size: 24px;
                margin-bottom: 16px;
                color: #fff;
                }

                .empty-hint {
                    font - size: 14px;
                color: rgba(255, 255, 255, 0.5);
                margin-top: 8px;
                font-style: italic;
                }

                .error-message {
                    color: #FF453A !important;
                background: rgba(255, 69, 58, 0.1);
                padding: 12px 16px;
                border-radius: 8px;
                border: 1px solid rgba(255, 69, 58, 0.3);
                margin: 16px 0;
                font-family: monospace;
                font-size: 13px;
                }

                .summary-content {
                    text - align: center;
                }

                .summary-stats, .rating-breakdown {
                    margin: 24px 0;
                padding: 16px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                }

                .stat-item, .rating-item {
                    display: flex;
                justify-content: space-between;
                margin: 8px 0;
                }

                .summary-actions {
                    display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 24px;
                }
            `}</style>

            {/* Swipe Tutorial Popup */}
            <SwipeTutorialDialog
                isOpen={showSwipeTutorial}
                onClose={() => setShowSwipeTutorial(false)}
            />

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Screen Reader Announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    borderWidth: 0
                }}
            >
                {announceMessage}
            </div>
        </div>
    );
}
