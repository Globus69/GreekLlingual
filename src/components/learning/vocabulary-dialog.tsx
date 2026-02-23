"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';
import FlashcardFSRS from '@/components/learning/flashcard-fsrs';
import { useTranslation } from '@/lib/use-translation';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { speakGreek } from '@/lib/tts/greek-tts';
import { DialogPortalWrapper } from '@/components/ui/dialog-portal';
import { FSRSScheduler } from '@/lib/fsrs/fsrs-scheduler';
import type { Card, Rating } from '@/lib/fsrs/fsrs-types';
import '@/styles/liquid-glass.css';

// Vocabulary Item with FSRS fields
interface VocabularyItem {
    id: string;
    type: string;
    english: string;
    russian?: string;
    greek: string;
    greek_word?: string;
    phonetic?: string;
    example_en: string | null;
    example_gr: string | null;
    audio_url: string | null;
    level?: string;
    difficulty?: string;
    // FSRS fields
    fsrs_difficulty: number;
    fsrs_stability: number;
    fsrs_last_review: string | null;
    fsrs_due: string;
    fsrs_reps: number;
    fsrs_lapses: number;
    fsrs_state: 'new' | 'learning' | 'review' | 'relearning';
}

interface VocabularyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'new' | 'all' | 'due' | string;
}

export default function VocabularyDialog({ isOpen, onClose }: VocabularyDialogProps) {
    const { user } = useAuth();
    const { t, locale } = useTranslation();
    const { toasts, showToast, removeToast, error, warning, success, info } = useToast();

    // Initialize FSRS scheduler (memoized to avoid re-creation)
    const scheduler = useMemo(() => new FSRSScheduler(), []);

    const [queue, setQueue] = useState<VocabularyItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sessionStats, setSessionStats] = useState({
        again: 0,  // Rating 1
        hard: 0,   // Rating 2
        good: 0,   // Rating 3
        easy: 0    // Rating 4
    });
    const [showSummary, setShowSummary] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speechRate, setSpeechRate] = useState<number>(0.9);

    const STUDENT_ID = user?.id || '';

    // Load preferences
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

    // Load vocabulary items
    useEffect(() => {
        if (isOpen && STUDENT_ID) {
            loadVocabulary();
            setShowSummary(false);
            setFlipped(false);
            setCurrentIndex(0);
            setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
        }
    }, [isOpen, STUDENT_ID]);

    const loadVocabulary = async () => {
        setLoading(true);
        try {
            if (!STUDENT_ID) {
                error('No user ID found');
                setLoading(false);
                return;
            }

            // Call RPC function to get specifically "Review" vocabulary cards (Rating 2)
            const { data, error: rpcError } = await supabase.rpc('get_review_vocabulary_cards', {
                p_user_id: STUDENT_ID,
                p_limit: 50
            });

            if (rpcError) {
                console.error('❌ RPC error:', rpcError);
                error('Failed to load vocabulary');
                setQueue([]);
                return;
            }

            if (data && data.length > 0) {
                // No shuffle needed - RPC returns cards in optimal order
                // (new cards first, then by due date, difficulty, etc.)
                setQueue(data as VocabularyItem[]);
                console.log(`✅ Loaded ${data.length} due vocabulary cards (FSRS)`);
            } else {
                setQueue([]);
                info('No vocabulary cards due. Great job! 🎉');
            }
        } catch (err) {
            console.error('❌ Load error:', err);
            error('Failed to load vocabulary');
            setQueue([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
        setShowSummary(false);
        setFlipped(false);
        loadVocabulary();
    };

    // TTS Audio
    const playAudio = async () => {
        if (queue.length === 0 || currentIndex >= queue.length) return;

        const currentItem = queue[currentIndex];
        if (!currentItem) return;

        const text = currentItem.greek_word || currentItem.greek;
        if (!text) return;

        setIsPlaying(true);
        await speakGreek(text, { rate: speechRate });

        const baseDuration = text.length * 100;
        const adjustedDuration = baseDuration / speechRate;
        setTimeout(() => {
            setIsPlaying(false);
        }, adjustedDuration);
    };

    // Auto-play TTS when card flips
    useEffect(() => {
        if (flipped && autoPlay && queue.length > 0) {
            const timer = setTimeout(() => {
                playAudio();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [flipped, currentIndex, autoPlay, queue.length]);

    // Handle FSRS rating (1-4: Again, Hard, Good, Easy)
    const handleRating = async (rating: Rating) => {
        if (queue.length === 0 || currentIndex >= queue.length) return;

        const currentItem = queue[currentIndex];

        try {
            // Convert database item to FSRS Card
            const currentCard: Card = {
                id: currentItem.id,
                difficulty: currentItem.fsrs_difficulty,
                stability: currentItem.fsrs_stability,
                due: new Date(currentItem.fsrs_due),
                reps: currentItem.fsrs_reps,
                lapses: currentItem.fsrs_lapses,
                state: currentItem.fsrs_state,
                lastReview: currentItem.fsrs_last_review ? new Date(currentItem.fsrs_last_review) : null
            };

            // Calculate new FSRS parameters
            const updatedCard = scheduler.rate(currentCard, rating, new Date());
            const interval = scheduler.calculateInterval(updatedCard.stability);

            // Update database via RPC
            const { data: rpcResult, error: rpcError } = await supabase.rpc('update_vocabulary_progress', {
                p_card_id: currentItem.id,
                p_user_id: STUDENT_ID,
                p_rating: rating,
                p_new_difficulty: updatedCard.difficulty,
                p_new_stability: updatedCard.stability,
                p_new_due: updatedCard.due.toISOString(),
                p_new_reps: updatedCard.reps,
                p_new_lapses: updatedCard.lapses,
                p_new_state: updatedCard.state,
                p_interval_days: interval,
                p_old_difficulty: currentCard.difficulty,
                p_old_stability: currentCard.stability
            });

            if (rpcError) {
                console.error('❌ Update error:', rpcError);
                error('Failed to save progress');
                return;
            }

            console.log(`✅ Card updated: Rating ${rating}, Next review in ${interval.toFixed(1)} days`);

            // MASTERY LOOP LOGIC
            // If rating is "Good" (3) or "Easy" (4), remove it from the current session queue
            // Otherwise, move it to the end of the queue for another round
            if (rating >= 3) {
                // Update session stats ONLY when a card is successfully completed
                // We count both "Good" and "Easy" as "Good" to represent "Mastered"
                setSessionStats(prev => ({
                    ...prev,
                    good: prev.good + 1
                }));

                const newQueue = queue.filter((_, index) => index !== currentIndex);
                setQueue(newQueue);

                if (newQueue.length === 0) {
                    setShowSummary(true);
                    success(`Mastery complete! ${sessionStats.good + 1} cards mastered. 🎯`);
                } else if (currentIndex >= newQueue.length) {
                    setCurrentIndex(0);
                }
            } else {
                // Not "Good" yet? Move to back of the line
                const currentItem = queue[currentIndex];
                const otherItems = queue.filter((_, index) => index !== currentIndex);
                setQueue([...otherItems, currentItem]);

                // If we reach the end of the current order, the "refining" continues
                if (currentIndex >= otherItems.length) {
                    setCurrentIndex(0);
                }
            }

        } catch (err) {
            console.error('❌ Rating error:', err);
            error('Failed to process rating');
        }

        setFlipped(false);
    };

    // Keyboard shortcuts (1-4 for FSRS ratings)
    useEffect(() => {
        if (!isOpen || showSummary) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case ' ':
                case 'Spacebar':
                    e.preventDefault();
                    if (!flipped) {
                        setFlipped(true);
                    }
                    break;
                case '1':
                    if (flipped) {
                        e.preventDefault();
                        handleRating(1); // Again
                    }
                    break;
                case '2':
                    if (flipped) {
                        e.preventDefault();
                        handleRating(2); // Hard
                    }
                    break;
                case '3':
                    if (flipped) {
                        e.preventDefault();
                        handleRating(3); // Good
                    }
                    break;
                case '4':
                    if (flipped) {
                        e.preventDefault();
                        handleRating(4); // Easy
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, flipped, currentIndex, queue.length, showSummary]);

    // Speed control
    const getSpeedLabel = (rate: number): { label: string; emoji: string } => {
        if (rate <= 0.7) return { label: 'Slow', emoji: '🐢' };
        if (rate <= 1.0) return { label: 'Normal', emoji: '▶️' };
        return { label: 'Fast', emoji: '🐇' };
    };

    const cycleSpeed = () => {
        let newRate: number;
        if (speechRate <= 0.7) {
            newRate = 0.9;
        } else if (speechRate <= 1.0) {
            newRate = 1.2;
        } else {
            newRate = 0.6;
        }
        setSpeechRate(newRate);
        localStorage.setItem('tts-speed', String(newRate));
        const speedInfo = getSpeedLabel(newRate);
        info(`Speed: ${speedInfo.emoji} ${speedInfo.label}`);
    };

    const toggleAutoPlay = () => {
        const newAutoPlay = !autoPlay;
        setAutoPlay(newAutoPlay);
        localStorage.setItem('tts-autoplay', String(newAutoPlay));
        info(newAutoPlay ? '🔊 Auto-play enabled' : '🔇 Auto-play disabled');
    };

    if (!isOpen) return null;

    const currentItem = queue[currentIndex];
    const speedInfo = getSpeedLabel(speechRate);

    if (!isOpen) return null;

    return (
        <div className="dialog-overlay">
            <div className="dialog-content vocabulary-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2>📚 Vocabulary Practice</h2>
                    {!loading && !showSummary && queue.length > 0 && (
                        <div className="progress-info" style={{ marginTop: '16px' }}>
                            <span>Card {currentIndex + 1} of {queue.length}</span>
                            {sessionStats.again > 0 && <span style={{ marginLeft: '8px', color: '#FF6B6B' }}>❌ {sessionStats.again}</span>}
                            {sessionStats.hard > 0 && <span style={{ marginLeft: '8px', color: '#FFA94D' }}>🟠 {sessionStats.hard}</span>}
                            {sessionStats.good > 0 && <span style={{ marginLeft: '8px', color: '#51CF66' }}>✅ {sessionStats.good}</span>}
                            {sessionStats.easy > 0 && <span style={{ marginLeft: '8px', color: '#339AF0' }}>🎯 {sessionStats.easy}</span>}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                        <p>Loading vocabulary...</p>
                    </div>
                ) : showSummary || queue.length === 0 ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                        <h3>Session Complete!</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', margin: '24px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF6B6B' }}>{sessionStats.again}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Again ❌</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 169, 77, 0.1)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFA94D' }}>{sessionStats.hard}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Hard 🟠</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(81, 207, 102, 0.1)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#51CF66' }}>{sessionStats.good}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Good ✅</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(51, 154, 240, 0.1)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#339AF0' }}>{sessionStats.easy}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Easy 🎯</div>
                            </div>
                        </div>
                        <div className="empty-actions">
                            <button onClick={handleRestart} className="btn-secondary">Practice More</button>
                            <button onClick={onClose} className="btn-primary">Close</button>
                        </div>
                    </div>
                ) : currentItem ? (
                    <>
                        <div className="card-container">
                            <FlashcardFSRS
                                front={locale === 'ru' && currentItem.russian ? currentItem.russian : currentItem.english}
                                back={currentItem.greek_word || currentItem.greek}
                                phonetic={currentItem.phonetic}
                                example={currentItem.example_gr || undefined}
                                onFlip={() => setFlipped(!flipped)}
                                flipped={flipped}
                                showRatingButtons={true}
                                onRating={handleRating}
                                onBackClick={playAudio}
                                useFSRS={true}
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
                                onClick={toggleAutoPlay}
                                className={`btn-autoplay ${autoPlay ? 'active' : ''}`}
                                title={`Auto-play: ${autoPlay ? 'ON' : 'OFF'}`}
                            >
                                {autoPlay ? '🔊' : '🔇'} Auto
                            </button>
                            <button onClick={onClose} className="btn-cancel">× Close</button>
                        </div>
                    </>
                ) : null}
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />

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

                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                }

                .empty-state h2, .empty-state h3 {
                    font-size: 24px;
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
                }

                .btn-primary:hover {
                    background: rgba(0, 122, 255, 0.4);
                    transform: translateY(-1px);
                }

                .dialog-footer {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-top: 24px;
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
            `}</style>
        </div>
    );
}
