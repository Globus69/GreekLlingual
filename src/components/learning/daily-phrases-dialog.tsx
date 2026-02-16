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
        <div className="dialog-overlay">
            <div className="dialog-content vocabulary-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2>💬 Daily Phrase</h2>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                        {getTimeSlotEmoji(currentTimeSlot)} {currentTimeSlot} • 1 phrase per time slot
                    </p>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                        <p>Loading daily phrase...</p>
                    </div>
                ) : answered ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{wasCorrect ? '🎉' : '📖'}</div>
                        <h3>{wasCorrect ? 'Well done!' : 'Keep practicing!'}</h3>
                        <p style={{ marginTop: '16px' }}>Come back in the next time slot for a new phrase</p>
                        <div className="empty-actions">
                            <button onClick={onClose} className="btn-primary">Close</button>
                        </div>
                    </div>
                ) : phrase ? (
                    <>
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
                ) : (
                    <div className="empty-state">
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                        <h3>No phrases available</h3>
                    </div>
                )}
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

                .dialog-header h2 {
                    font-size: 24px;
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
                    text-align: center;
                    padding: 40px 20px;
                }

                .empty-state h3 {
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
            `}</style>
        </div>
    );
}
