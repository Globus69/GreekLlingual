"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';
import FlashcardFSRS from '@/components/learning/flashcard-fsrs';
import { useTranslation } from '@/lib/use-translation';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { speakGreek } from '@/lib/tts/greek-tts';
import { DialogPortalWrapper } from '@/components/ui/dialog-portal';
import '@/styles/liquid-glass.css';

// Simple LearningItem without FSRS fields
interface LearningItem {
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
}

interface VocabularyDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VocabularyDialog({ isOpen, onClose }: VocabularyDialogProps) {
    const { user } = useAuth();
    const { t, locale } = useTranslation();
    const { toasts, showToast, removeToast, error, warning, success, info } = useToast();

    const [queue, setQueue] = useState<LearningItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [correct, setCorrect] = useState(0);
    const [wrong, setWrong] = useState(0);
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
            setCorrect(0);
            setWrong(0);
        }
    }, [isOpen, STUDENT_ID]);

    const loadVocabulary = async () => {
        setLoading(true);
        try {
            const { data, error: dbError } = await supabase
                .from('learning_items')
                .select('*')
                .eq('type', 'vocabulary')
                .eq('level', user?.level || 'A1')
                .limit(20);

            if (dbError) {
                console.error('❌ DB error:', dbError);
                error('Failed to load vocabulary');
                setQueue([]);
                return;
            }

            if (data && data.length > 0) {
                // Shuffle items
                const shuffled = [...data].sort(() => Math.random() - 0.5);
                setQueue(shuffled);
                console.log(`✅ Loaded ${shuffled.length} vocabulary items`);
            } else {
                setQueue([]);
                info('No vocabulary items found');
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
        setCorrect(0);
        setWrong(0);
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

    // Handle answer: 1 = Wrong (push to end), 3 = Correct (remove from queue)
    const handleRating = (rating: 1 | 3) => {
        if (queue.length === 0 || currentIndex >= queue.length) return;

        const currentItem = queue[currentIndex];

        if (rating === 3) {
            // Correct: Remove from queue
            setCorrect(prev => prev + 1);
            const newQueue = queue.filter((_, index) => index !== currentIndex);
            setQueue(newQueue);

            if (newQueue.length === 0) {
                // Session complete
                setShowSummary(true);
                success(`Session complete! ${correct + 1} correct, ${wrong} to review`);
            } else {
                // Stay at same index (next card moves into this position)
                if (currentIndex >= newQueue.length) {
                    setCurrentIndex(newQueue.length - 1);
                }
            }
        } else {
            // Wrong: Move to end of queue
            setWrong(prev => prev + 1);
            const newQueue = [...queue];
            const [item] = newQueue.splice(currentIndex, 1);
            newQueue.push(item);
            setQueue(newQueue);

            // Stay at same index (next card moves into this position)
            if (currentIndex >= newQueue.length) {
                setCurrentIndex(0);
            }
        }

        setFlipped(false);
    };

    // Keyboard shortcuts
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
                        handleRating(1);
                    }
                    break;
                case '3':
                    if (flipped) {
                        e.preventDefault();
                        handleRating(3);
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

                    {/* Progress Bar */}
                    {!loading && !showSummary && queue.length > 0 && (
                        <div className="progress-section">
                            <div className="progress-info">
                                <span className="progress-count">Card {currentIndex + 1} of {queue.length}</span>
                                <span className="progress-count">{Math.round(((currentIndex) / queue.length) * 100)}%</span>
                            </div>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                                />
                            </div>
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
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '24px 0' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>{correct}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Correct</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f44336' }}>{wrong}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>To Review</div>
                            </div>
                        </div>
                        <div className="empty-actions">
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
                                useFSRS={false}
                            />
                        </div>

                        <div className="dialog-footer">
                            <button onClick={handleRestart} className="btn-secondary">
                                ↻ {t('btn.restart')}
                            </button>
                            <button
                                onClick={playAudio}
                                disabled={isPlaying}
                                className={`btn-audio ${isPlaying ? 'playing' : ''}`}
                                title="Play audio (A)"
                            >
                                {isPlaying ? '🔊' : '🔊'} {t('btn.audio')}
                            </button>
                            <button
                                onClick={toggleAutoPlay}
                                className={`btn-autoplay ${autoPlay ? 'active' : ''}`}
                                title={`Auto-play: ${autoPlay ? 'ON' : 'OFF'}`}
                            >
                                {autoPlay ? '🔊' : '🔇'} Auto
                            </button>
                            <button
                                onClick={cycleSpeed}
                                className="btn-speed"
                                title={`Speed: ${getSpeedLabel(speechRate).label}`}
                            >
                                {getSpeedLabel(speechRate).emoji}
                            </button>
                            <button onClick={onClose} className="btn-cancel">
                                × {t('btn.cancel')}
                            </button>
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
                    transform: translateY(-2px);
                }

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
                }

                .btn-audio:hover {
                    background: rgba(52, 199, 89, 0.3);
                }

                .btn-audio:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
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

                .btn-cancel {
                    background: rgba(255, 69, 58, 0.2);
                    color: #FF453A;
                }

                .btn-cancel:hover {
                    background: rgba(255, 69, 58, 0.3);
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
