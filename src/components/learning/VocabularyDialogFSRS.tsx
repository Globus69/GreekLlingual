"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';
import FlashcardFSRS from '@/components/learning/FlashcardFSRS';
import { useTranslation } from '@/lib/use-translation';
import { usePerformanceEvaluation } from '@/lib/use-performance-evaluation';
import { FSRSScheduler } from '@/lib/fsrs/fsrs-scheduler';
import type { Card, Rating } from '@/lib/fsrs/fsrs-types';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { speakGreek, isSpeaking, stopSpeaking } from '@/lib/tts/greek-tts';
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

interface VocabularyDialogFSRSProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'due' | 'new' | 'all'; // FSRS modes
}

export default function VocabularyDialogFSRS({ isOpen, onClose, mode = 'due' }: VocabularyDialogFSRSProps) {
    const { user } = useAuth();
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
            const { data, error: rpcError } = await supabase.rpc('get_due_cards_fsrs', {
                p_user_id: STUDENT_ID,
                p_level: user?.level || 'A1',
                p_limit: 100
            });

            if (rpcError) {
                console.error('❌ FSRS RPC error:', rpcError);
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
                // Call RPC to update card in database
                const { data: rpcData, error: rpcError } = await supabase.rpc('update_card_fsrs', {
                    p_card_id: item.id,
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
                });

                if (rpcError) {
                    console.error('❌ Update RPC error:', rpcError);
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

    const handleCancel = () => {
        setCurrentIndex(0);
        setRatings({ again: 0, hard: 0, good: 0, easy: 0 });
        setCorrect(0);
        setTotal(0);
        setShowSummary(false);
        setFlipped(false);
        onClose();
    };

    if (!isOpen) return null;

    // Loading state
    if (loading) {
        return (
            <div className="dialog-overlay">
                <div className="dialog-content">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <h2>{t('vocab.loading')}</h2>
                        <p>{t('vocab.loading_subtitle')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // No cards available (differentiate between error and empty)
    if (vocabulary.length === 0) {
        return (
            <div className="dialog-overlay">
                <div className="dialog-content">
                    <div className="empty-state">
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
                                <h2>🎉 {t('vocab.no_items')}</h2>
                                <p>{t('vocab.no_items_msg')}</p>
                                <p className="empty-hint">All caught up! No cards are due for review right now.</p>
                                <button onClick={handleCancel} className="btn-primary">
                                    {t('vocab.back_to_dashboard')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Session complete summary
    if (showSummary) {
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        return (
            <div className="dialog-overlay">
                <div className="dialog-content">
                    <div className="summary-content">
                        <h2>✅ {t('vocab.session_complete')}</h2>

                        <div className="summary-stats">
                            <div className="stat-item">
                                <span className="stat-label">{t('vocab.correct')}:</span>
                                <span className="stat-value">{correct}/{total}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Accuracy:</span>
                                <span className="stat-value">{accuracy}%</span>
                            </div>
                        </div>

                        <div className="rating-breakdown">
                            <div className="rating-item">
                                <span>❌ Again:</span>
                                <span>{ratings.again}</span>
                            </div>
                            <div className="rating-item">
                                <span>🟠 Hard:</span>
                                <span>{ratings.hard}</span>
                            </div>
                            <div className="rating-item">
                                <span>✅ Good:</span>
                                <span>{ratings.good}</span>
                            </div>
                            <div className="rating-item">
                                <span>🎯 Easy:</span>
                                <span>{ratings.easy}</span>
                            </div>
                        </div>

                        {perfMessage && (
                            <div className="perf-message">
                                {perfMessage}
                            </div>
                        )}

                        <div className="summary-actions">
                            <button onClick={handleRestart} className="btn-secondary">
                                {t('btn.restart')}
                            </button>
                            <button onClick={handleCancel} className="btn-primary">
                                {t('vocab.back_to_dashboard')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main vocabulary review interface
    const currentVocab = vocabulary[currentIndex];
    const progress = `${currentIndex + 1} / ${vocabulary.length}`;
    const progressPercentage = vocabulary.length > 0 ? ((currentIndex + 1) / vocabulary.length) * 100 : 0;
    const totalRatings = ratings.again + ratings.hard + ratings.good + ratings.easy;

    return (
        <div className="dialog-overlay">
            <div className="dialog-content vocabulary-dialog">
                <div className="dialog-header">
                    <h2>📚 Vocabulary Review (FSRS-6)</h2>

                    {/* Progress Bar */}
                    <div className="progress-section">
                        <div className="progress-info">
                            <span className="progress-count">{progress}</span>
                            <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Session Stats (if any ratings) */}
                    {totalRatings > 0 && (
                        <div className="session-stats-mini">
                            {ratings.again > 0 && <span className="stat-chip stat-again">❌ {ratings.again}</span>}
                            {ratings.hard > 0 && <span className="stat-chip stat-hard">🟠 {ratings.hard}</span>}
                            {ratings.good > 0 && <span className="stat-chip stat-good">✅ {ratings.good}</span>}
                            {ratings.easy > 0 && <span className="stat-chip stat-easy">🎯 {ratings.easy}</span>}
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
                    />
                </div>

                <div className="dialog-footer">
                    <button onClick={handleRestart} className="btn-secondary">
                        ↻ {t('btn.restart')}
                    </button>
                    <button
                        onClick={playAudio}
                        className={`btn-audio ${isPlaying ? 'playing' : ''}`}
                        aria-label={isPlaying ? 'Playing pronunciation' : 'Play pronunciation'}
                        aria-busy={isPlaying}
                        title="Play audio (A)"
                        disabled={isPlaying}
                    >
                        {isPlaying ? '🔊' : '🔊'} {t('btn.audio')}
                    </button>
                    <button
                        onClick={() => {
                            const newValue = !autoPlay;
                            setAutoPlay(newValue);
                            localStorage.setItem('tts-autoplay', String(newValue));
                            setAnnounceMessage(newValue ? 'Auto-play enabled' : 'Auto-play disabled');
                            info(newValue ? 'Auto-play enabled' : 'Auto-play disabled');
                        }}
                        className={`btn-autoplay ${autoPlay ? 'active' : ''}`}
                        aria-label="Toggle auto-play"
                        aria-pressed={autoPlay}
                        title={`Auto-play: ${autoPlay ? 'ON' : 'OFF'}`}
                    >
                        {autoPlay ? '🔊' : '🔇'} Auto
                    </button>
                    <button
                        onClick={cycleSpeed}
                        className="btn-speed"
                        aria-label={`Change speech speed. Current: ${getSpeedLabel(speechRate).label}`}
                        title={`Speed: ${getSpeedLabel(speechRate).label}`}
                    >
                        {getSpeedLabel(speechRate).emoji}
                    </button>
                    <button onClick={handleCancel} className="btn-cancel">
                        × {t('btn.cancel')}
                    </button>
                </div>
            </div>

            <style jsx>{`
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
                    text-align: center;
                    margin-bottom: 24px;
                }

                /* Empty State & Error State */
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                }

                .empty-state h2 {
                    font-size: 24px;
                    margin-bottom: 16px;
                    color: #fff;
                }

                .empty-state p {
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 12px;
                    line-height: 1.5;
                }

                .empty-hint {
                    font-size: 14px;
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
                }

                .btn-primary:hover {
                    background: rgba(0, 122, 255, 0.4);
                    transform: translateY(-2px);
                }

                /* Loading State */
                .loading-state {
                    text-align: center;
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
                    to { transform: rotate(360deg); }
                }

                .progress-text {
                    color: #888;
                    font-size: 14px;
                    margin-top: 8px;
                }

                /* Progress Section */
                .progress-section {
                    margin-top: 16px;
                    margin-bottom: 12px;
                }

                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .progress-count {
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                }

                .progress-percentage {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.5);
                }

                .progress-bar-container {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #007AFF 0%, #00C7BE 100%);
                    border-radius: 8px;
                    transition: width 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
                    box-shadow: 0 0 12px rgba(0, 199, 190, 0.4);
                }

                /* Session Stats Mini */
                .session-stats-mini {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 12px;
                }

                .stat-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                    border: 1px solid;
                    transition: transform 0.2s;
                }

                .stat-chip:hover {
                    transform: scale(1.05);
                }

                .stat-again {
                    background: color-mix(in srgb, #FF6B6B 15%, rgba(28, 28, 32, 0.8));
                    border-color: color-mix(in srgb, #FF6B6B 30%, transparent);
                    color: #FF6B6B;
                }

                .stat-hard {
                    background: color-mix(in srgb, #FFA94D 15%, rgba(28, 28, 32, 0.8));
                    border-color: color-mix(in srgb, #FFA94D 30%, transparent);
                    color: #FFA94D;
                }

                .stat-good {
                    background: color-mix(in srgb, #51CF66 15%, rgba(28, 28, 32, 0.8));
                    border-color: color-mix(in srgb, #51CF66 30%, transparent);
                    color: #51CF66;
                }

                .stat-easy {
                    background: color-mix(in srgb, #339AF0 15%, rgba(28, 28, 32, 0.8));
                    border-color: color-mix(in srgb, #339AF0 30%, transparent);
                    color: #339AF0;
                }

                .card-container {
                    margin: 24px 0;
                }

                .dialog-footer {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .btn-secondary, .btn-audio, .btn-autoplay, .btn-speed, .btn-cancel {
                    padding: 12px 24px;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-secondary {
                    background: rgba(0, 122, 255, 0.2);
                    color: #007AFF;
                }

                .btn-secondary:hover {
                    background: rgba(0, 122, 255, 0.3);
                }

                .btn-audio {
                    background: rgba(52, 199, 89, 0.2);
                    color: #34C759;
                    position: relative;
                }

                .btn-audio:hover {
                    background: rgba(52, 199, 89, 0.3);
                }

                .btn-audio.playing {
                    animation: pulse 1s ease-in-out infinite;
                }

                .btn-audio:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 0.9;
                    }
                }

                .btn-autoplay {
                    background: rgba(255, 159, 10, 0.15);
                    color: rgba(255, 159, 10, 0.7);
                    font-size: 13px;
                    padding: 12px 16px;
                }

                .btn-autoplay:hover {
                    background: rgba(255, 159, 10, 0.25);
                    color: rgba(255, 159, 10, 0.9);
                }

                .btn-autoplay.active {
                    background: rgba(255, 159, 10, 0.3);
                    color: #FF9F0A;
                    border: 1px solid rgba(255, 159, 10, 0.4);
                }

                .btn-speed {
                    background: rgba(94, 92, 230, 0.15);
                    color: rgba(94, 92, 230, 0.9);
                    font-size: 20px;
                    padding: 12px 16px;
                    min-width: 56px;
                }

                .btn-speed:hover {
                    background: rgba(94, 92, 230, 0.25);
                    transform: scale(1.1);
                }

                .btn-speed:active {
                    transform: scale(0.95);
                }

                .btn-cancel {
                    background: rgba(255, 69, 58, 0.2);
                    color: #FF453A;
                }

                .btn-cancel:hover {
                    background: rgba(255, 69, 58, 0.3);
                }

                .summary-content {
                    text-align: center;
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

                /* Mobile Responsive */
                @media (max-width: 600px) {
                    .dialog-content {
                        padding: 24px 16px;
                    }

                    .progress-info {
                        font-size: 13px;
                    }

                    .progress-count {
                        font-size: 13px;
                    }

                    .progress-percentage {
                        font-size: 11px;
                    }

                    .progress-bar-container {
                        height: 6px;
                    }

                    .session-stats-mini {
                        gap: 6px;
                        margin-top: 10px;
                    }

                    .stat-chip {
                        padding: 3px 10px;
                        font-size: 11px;
                    }

                    .dialog-footer {
                        flex-wrap: wrap;
                        gap: 8px;
                    }

                    .btn-secondary, .btn-audio, .btn-autoplay, .btn-speed, .btn-cancel {
                        padding: 10px 16px;
                        font-size: 13px;
                    }

                    .btn-speed {
                        font-size: 18px;
                        padding: 10px 12px;
                        min-width: 48px;
                    }
                }
            `}</style>

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Screen Reader Announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announceMessage}
            </div>

            <style jsx>{`
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border-width: 0;
                }
            `}</style>
        </div>
    );
}
