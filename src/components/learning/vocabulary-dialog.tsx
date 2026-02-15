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
        <div className="vocabulary-dialog-overlay" onClick={onClose}>
            <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">📚 Vocabulary Practice</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={cycleSpeed}
                                className="icon-btn"
                                title={`TTS Speed: ${speedInfo.label}`}
                            >
                                {speedInfo.emoji}
                            </button>
                            <button
                                onClick={toggleAutoPlay}
                                className="icon-btn"
                                title={autoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
                            >
                                {autoPlay ? '🔊' : '🔇'}
                            </button>
                            <button onClick={onClose} className="icon-btn">✕</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin text-5xl">⏳</div>
                            <p className="mt-4 text-white">Loading vocabulary...</p>
                        </div>
                    ) : showSummary || queue.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-2xl font-bold text-white mb-6">Session Complete!</h3>
                            <div className="flex justify-center gap-6 mb-8">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-green-400">{correct}</div>
                                    <div className="text-sm text-gray-400">Correct</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-red-400">{wrong}</div>
                                    <div className="text-sm text-gray-400">To Review</div>
                                </div>
                            </div>
                            <button onClick={onClose} className="btn-primary px-8 py-3 rounded-xl">
                                Close
                            </button>
                        </div>
                    ) : currentItem ? (
                        <>
                            {/* Progress */}
                            <div className="flex justify-between items-center mb-6 text-sm">
                                <div className="text-gray-400">
                                    Card {currentIndex + 1} of {queue.length}
                                </div>
                                <div className="flex gap-3">
                                    {correct > 0 && <span className="text-green-400">✅ {correct}</span>}
                                    {wrong > 0 && <span className="text-red-400">❌ {wrong}</span>}
                                </div>
                            </div>

                            {/* Flashcard */}
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

                            {/* Manual audio button */}
                            {flipped && (
                                <div className="flex justify-center mt-4">
                                    <button
                                        onClick={playAudio}
                                        disabled={isPlaying}
                                        className="btn-secondary px-6 py-2 rounded-xl"
                                    >
                                        {isPlaying ? '🔊 Playing...' : '🔊 Play Audio'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : null}
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <style jsx>{`
                .liquid-glass-panel {
                    background: rgba(28, 28, 32, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(20px);
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
