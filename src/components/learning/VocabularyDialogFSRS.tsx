"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';
import FlashcardFSRS from '@/components/learning/FlashcardFSRS';
import { useTranslation } from '@/lib/use-translation';
import { usePerformanceEvaluation } from '@/lib/use-performance-evaluation';
import { FSRSScheduler } from '@/lib/fsrs/fsrs-scheduler';
import type { Card, Rating } from '@/lib/fsrs/fsrs-types';
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

    // FSRS Scheduler instance (memoized)
    const scheduler = useMemo(() => new FSRSScheduler(), []);

    const [vocabulary, setVocabulary] = useState<FSRSLearningItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [perfMessage, setPerfMessage] = useState<string | null>(null);

    const STUDENT_ID = user?.id || '';

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
        }
    }, [isOpen, mode, STUDENT_ID]);

    // TTS Audio
    const playAudio = () => {
        if (vocabulary.length === 0 || currentIndex >= vocabulary.length) return;

        const currentVocab = vocabulary[currentIndex];
        if (!currentVocab) return;

        const text = currentVocab.greek_word || currentVocab.greek;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'el-GR';
            utterance.rate = 0.9;
            utterance.pitch = 1;

            const voices = window.speechSynthesis.getVoices();
            const greekVoice = voices.find(v => v.lang.startsWith('el'));
            if (greekVoice) utterance.voice = greekVoice;

            window.speechSynthesis.speak(utterance);
        }
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
        console.log(`🔄 Loading FSRS cards (mode: ${mode}, user: ${STUDENT_ID}, level: ${user?.level})`);

        try {
            const { data, error } = await supabase.rpc('get_due_cards_fsrs', {
                p_user_id: STUDENT_ID,
                p_level: user?.level || 'A1',
                p_limit: 100
            });

            if (error) {
                console.error('❌ FSRS RPC error:', error);
                setVocabulary([]);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                console.log(`✅ Loaded ${data.length} due cards`);
                setVocabulary(data as FSRSLearningItem[]);
            } else {
                console.log('⚠️ No due cards found');
                setVocabulary([]);
            }
        } catch (err) {
            console.error('❌ Load error:', err);
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
            lastReview: item.fsrs_last_review ? new Date(item.fsrs_last_review) : undefined,
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
                // Continue anyway (optimistic update)
            } else {
                console.log('✅ Card updated in DB:', rpcData);
            }
        } catch (err) {
            console.error('❌ Update error:', err);
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

    // No cards available
    if (vocabulary.length === 0) {
        return (
            <div className="dialog-overlay">
                <div className="dialog-content">
                    <div className="empty-state">
                        <h2>🎉 {t('vocab.no_items')}</h2>
                        <p>{t('vocab.no_items_msg')}</p>
                        <button onClick={handleCancel} className="btn-primary">
                            {t('vocab.back_to_dashboard')}
                        </button>
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

    return (
        <div className="dialog-overlay">
            <div className="dialog-content vocabulary-dialog">
                <div className="dialog-header">
                    <h2>📚 Vocabulary Review (FSRS-6)</h2>
                    <p className="progress-text">{progress}</p>
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
                    <button onClick={playAudio} className="btn-audio">
                        🔊 {t('btn.audio')}
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

                .progress-text {
                    color: #888;
                    font-size: 14px;
                    margin-top: 8px;
                }

                .card-container {
                    margin: 24px 0;
                }

                .dialog-footer {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .btn-secondary, .btn-audio, .btn-cancel {
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

                .btn-audio {
                    background: rgba(52, 199, 89, 0.2);
                    color: #34C759;
                }

                .btn-cancel {
                    background: rgba(255, 69, 58, 0.2);
                    color: #FF453A;
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
            `}</style>
        </div>
    );
}
