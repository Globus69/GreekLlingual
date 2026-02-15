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

interface DailyPhrase {
    id: string;
    english: string;
    russian?: string;
    greek: string;
    phonetic?: string;
    example_en: string | null;
    example_gr: string | null;
    audio_url: string | null;
    level?: string;
    deck_id?: string;
    created_at?: string;
}

interface DailyPhrasesDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DailyPhrasesDialog({ isOpen, onClose }: DailyPhrasesDialogProps) {
    const { user } = useAuth();
    const { t, locale } = useTranslation();
    const { toasts, showToast, removeToast, error, warning, success, info } = useToast();

    const [phrase, setPhrase] = useState<DailyPhrase | null>(null);
    const [loading, setLoading] = useState(true);
    const [answered, setAnswered] = useState(false);
    const [wasCorrect, setWasCorrect] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speechRate, setSpeechRate] = useState<number>(0.9);
    const [currentTimeSlot, setCurrentTimeSlot] = useState<'morning' | 'noon' | 'evening'>('morning');

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

    /**
     * Get current time slot (Morning, Noon, Evening)
     */
    const getCurrentTimeSlot = (): 'morning' | 'noon' | 'evening' => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'noon';
        return 'evening'; // 18-6
    };

    /**
     * Get stable daily phrase index for current date and time slot
     * Uses date + time slot as seed for consistent phrase selection per slot
     */
    const getDailyPhraseIndex = (totalPhrases: number, timeSlot: 'morning' | 'noon' | 'evening'): number => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // Create seed from date + time slot
        const slotOffset = { morning: 0, noon: 1, evening: 2 }[timeSlot];
        const seed = dateString + slotOffset;

        // Simple hash function for stable "random" selection
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash) % totalPhrases;
    };

    // Load daily phrase (1 per time slot)
    useEffect(() => {
        if (isOpen) {
            loadDailyPhrase();
            setAnswered(false);
            setWasCorrect(false);
            setFlipped(false);
        }
    }, [isOpen]);

    const loadDailyPhrase = async () => {
        setLoading(true);
        try {
            const timeSlot = getCurrentTimeSlot();
            setCurrentTimeSlot(timeSlot);
            console.log(`⏰ Current time slot: ${timeSlot}`);

            // Load phrases from daily_phrases table
            // Note: daily_phrases table uses 'difficulty' not 'level'
            const { data, error: dbError } = await supabase
                .from('daily_phrases')
                .select('*');

            if (dbError) {
                console.error('❌ DB error:', dbError);
                error('Failed to load daily phrase');
                setPhrase(null);
                return;
            }

            if (data && data.length > 0) {
                // "3 per day" rule: Select 1 phrase for current time slot
                const phraseIndex = getDailyPhraseIndex(data.length, timeSlot);
                const selectedPhrase = data[phraseIndex];

                console.log(`✅ Selected 1 phrase for ${timeSlot} (index ${phraseIndex}/${data.length})`);
                console.log('   Phrase:', selectedPhrase?.greek);
                setPhrase(selectedPhrase);
                info(`📅 Daily phrase for ${timeSlot}`);
            } else {
                setPhrase(null);
                info('No daily phrases found');
            }
        } catch (err) {
            console.error('❌ Load error:', err);
            error('Failed to load daily phrase');
            setPhrase(null);
        } finally {
            setLoading(false);
        }
    };

    // TTS Audio
    const playAudio = async () => {
        if (!phrase) return;

        const text = phrase.greek;
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
        if (flipped && autoPlay && phrase) {
            const timer = setTimeout(() => {
                playAudio();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [flipped, autoPlay, phrase]);

    // Handle answer: Just mark as answered (no queue needed for 1 phrase)
    const handleRating = (rating: 1 | 3) => {
        if (!phrase || answered) return;

        setAnswered(true);
        setWasCorrect(rating === 3);

        if (rating === 3) {
            success('Correct! 🎉');
        } else {
            info('Study this phrase again later');
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen || answered) return;

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
    }, [isOpen, flipped, answered]);

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

    const getTimeSlotEmoji = (slot: string): string => {
        switch (slot) {
            case 'morning': return '🌅';
            case 'noon': return '☀️';
            case 'evening': return '🌙';
            default: return '📅';
        }
    };

    if (!isOpen) return null;

    const speedInfo = getSpeedLabel(speechRate);

    if (!isOpen) return null;

    return (
        <div className="vocabulary-dialog-overlay" onClick={onClose}>
            <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">💬 Daily Phrase</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {getTimeSlotEmoji(currentTimeSlot)} {currentTimeSlot} • 1 phrase per time slot
                            </p>
                        </div>
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
                            <p className="mt-4 text-white">Loading daily phrase...</p>
                        </div>
                    ) : answered ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">{wasCorrect ? '🎉' : '📖'}</div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                {wasCorrect ? 'Well done!' : 'Keep practicing!'}
                            </h3>
                            <p className="text-gray-400 mb-8">
                                Come back in the next time slot for a new phrase
                            </p>
                            <button onClick={onClose} className="btn-primary px-8 py-3 rounded-xl">
                                Close
                            </button>
                        </div>
                    ) : phrase ? (
                        <>
                            {/* Flashcard */}
                            <div className="card-container">
                                <FlashcardFSRS
                                    front={locale === 'ru' && phrase.russian ? phrase.russian : phrase.english}
                                    back={phrase.greek}
                                    phonetic={phrase.phonetic}
                                    example={phrase.example_gr || undefined}
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
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <h3 className="text-xl text-white">No phrases available</h3>
                        </div>
                    )}
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
