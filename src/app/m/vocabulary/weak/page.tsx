"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { supabase } from '@/db/supabase';
import { speakGreek } from '@/lib/tts/greek-tts';
import { FSRSScheduler } from '@/lib/fsrs/fsrs-scheduler';
import type { Card, Rating } from '@/lib/fsrs/fsrs-types';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { OfflineBanner, CacheIndicator } from '@/components/mobile/OfflineBanner';
import { useMobileCache, usePrefetch } from '@/hooks/use-mobile-cache';
import { CACHE_TTL } from '@/lib/cache/mobile-cache';

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

export default function MobileVocabularyWeakPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const { t, locale } = useTranslation();

    // Initialize FSRS scheduler (memoized to avoid re-creation)
    const scheduler = useMemo(() => new FSRSScheduler(), []);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        again: 0,  // Rating 1
        hard: 0,   // Rating 2
        good: 0,   // Rating 3
        easy: 0    // Rating 4
    });
    const [showSummary, setShowSummary] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speechRate, setSpeechRate] = useState<number>(0.9);

    const STUDENT_ID = user?.id || '';

    /**
     * Fetcher function for WEAK vocabulary cards
     */
    const fetchWeakCards = useCallback(async (): Promise<VocabularyItem[]> => {
        if (!STUDENT_ID) {
            console.error('No user ID found');
            return [];
        }

        // Call RPC function to get weak vocabulary cards (lapses >= 2)
        const { data, error: rpcError } = await supabase.rpc('get_weak_vocabulary_cards', {
            p_user_id: STUDENT_ID,
            p_limit: 20 // Mobile: Small batches!
        });

        if (rpcError) {
            console.error('❌ RPC error:', rpcError);
            throw rpcError;
        }

        console.log(`✅ Loaded ${data?.length || 0} weak vocabulary cards (lapses >= 2)`);
        return (data || []) as VocabularyItem[];
    }, [STUDENT_ID]);

    /**
     * Use cache for weak vocabulary cards
     */
    const {
        data: cards,
        loading,
        cached,
        refresh,
    } = useMobileCache<VocabularyItem[]>({
        storeName: 'vocabulary_cards',
        key: `vocabulary-weak-${STUDENT_ID}`,
        fetcher: fetchWeakCards,
        ttl: CACHE_TTL.VOCABULARY_CARDS, // 30 minutes
        enabled: !!STUDENT_ID,
        onCacheHit: (data) => {
            console.log('✅ [Vocabulary Weak] Using cached cards');
        },
        onCacheMiss: () => {
            console.log('❌ [Vocabulary Weak] Cache miss - fetching fresh cards');
        },
    });

    /**
     * Prefetch next batch of cards in background
     */
    usePrefetch(
        'vocabulary_cards',
        `vocabulary-weak-${STUDENT_ID}-next`,
        async () => {
            const { data } = await supabase.rpc('get_weak_vocabulary_cards', {
                p_user_id: STUDENT_ID,
                p_limit: 20,
            });
            return data || [];
        },
        {
            ttl: CACHE_TTL.VOCABULARY_CARDS,
            delay: 5000, // Prefetch after 5 seconds
        }
    );

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

    // Auth check
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login-pin');
        }
    }, [authLoading, isAuthenticated, router]);

    // TTS Audio
    const playAudio = async () => {
        if (!cards || cards.length === 0 || currentIndex >= cards.length) return;

        const currentItem = cards[currentIndex];
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
        if (isFlipped && autoPlay && cards && cards.length > 0) {
            const timer = setTimeout(() => {
                playAudio();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isFlipped, currentIndex, autoPlay, cards]);

    // Handle FSRS rating (1-4: Again, Hard, Good, Easy)
    const handleRating = async (rating: Rating) => {
        if (!cards || cards.length === 0 || currentIndex >= cards.length) return;

        const currentItem = cards[currentIndex];

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
            const { error: rpcError } = await supabase.rpc('update_vocabulary_progress', {
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
                return;
            }

            console.log(`✅ Card updated: Rating ${rating}, Next review in ${interval.toFixed(1)} days`);

            // Update session stats
            setSessionStats(prev => ({
                ...prev,
                again: prev.again + (rating === 1 ? 1 : 0),
                hard: prev.hard + (rating === 2 ? 1 : 0),
                good: prev.good + (rating === 3 ? 1 : 0),
                easy: prev.easy + (rating === 4 ? 1 : 0)
            }));

            // Remove card from queue
            if (cards.length === 1) {
                // Last card - show summary
                setShowSummary(true);
            } else {
                // Move to next card
                if (currentIndex >= cards.length - 1) {
                    setCurrentIndex(0);
                } else {
                    setCurrentIndex(currentIndex + 1);
                }
            }

            // Refresh cache to get updated card list
            setTimeout(() => refresh(), 1000);

        } catch (err) {
            console.error('❌ Rating error:', err);
        }

        setIsFlipped(false);
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
        setShowSummary(false);
        setIsFlipped(false);
        refresh(); // Refresh cache
    };

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
    };

    const toggleAutoPlay = () => {
        const newAutoPlay = !autoPlay;
        setAutoPlay(newAutoPlay);
        localStorage.setItem('tts-autoplay', String(newAutoPlay));
    };

    const currentItem = cards ? cards[currentIndex] : null;
    const speedInfo = getSpeedLabel(speechRate);

    return (
        <>
            <OfflineBanner />
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#0F0F11',
                paddingBottom: '80px'
            }}>
                {/* Header */}
                <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    backgroundColor: 'rgba(28, 28, 30, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '11px',
                    paddingTop: 'calc(11px + env(safe-area-inset-top))',
                }}>
                    <div style={{
                        maxWidth: '448px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <button
                            onClick={() => router.push('/m')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#007AFF',
                                fontSize: '16px',
                                cursor: 'pointer',
                                padding: '8px'
                            }}
                        >
                            ← Back
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: 'white',
                                margin: 0
                            }}>
                                ⚠️ Weak Words
                            </h1>
                            {cached && <CacheIndicator cached={cached} />}
                        </div>
                        <button
                            onClick={refresh}
                            style={{
                                background: 'rgba(0, 122, 255, 0.2)',
                                border: '1px solid rgba(0, 122, 255, 0.3)',
                                borderRadius: '8px',
                                padding: '8px',
                                color: '#007AFF',
                                fontSize: '16px',
                                cursor: 'pointer',
                                minWidth: '44px',
                                minHeight: '44px',
                            }}
                        >
                            🔄
                        </button>
                    </div>
                    {!loading && !showSummary && cards && cards.length > 0 && (
                        <div style={{
                            maxWidth: '448px',
                            margin: '12px auto 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            color: '#8E8E93'
                        }}>
                            <span style={{ color: 'white' }}>Card {currentIndex + 1} / {cards.length}</span>
                            {sessionStats.again > 0 && <span style={{ color: '#FF6B6B' }}>❌ {sessionStats.again}</span>}
                            {sessionStats.hard > 0 && <span style={{ color: '#FFA94D' }}>🟠 {sessionStats.hard}</span>}
                            {sessionStats.good > 0 && <span style={{ color: '#51CF66' }}>✅ {sessionStats.good}</span>}
                            {sessionStats.easy > 0 && <span style={{ color: '#339AF0' }}>🎯 {sessionStats.easy}</span>}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {loading ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '80px 20px',
                            color: 'white'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                            <p>Loading weak words...</p>
                        </div>
                    ) : showSummary || !cards || cards.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '80px 20px',
                            color: 'white'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💪</div>
                            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>No weak words!</h3>
                            <p style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '32px' }}>
                                You're doing great! All words are mastered.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '400px', margin: '0 auto 32px' }}>
                                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 107, 107, 0.3)' }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF6B6B' }}>{sessionStats.again}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Again ❌</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 169, 77, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 169, 77, 0.3)' }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFA94D' }}>{sessionStats.hard}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Hard 🟠</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(81, 207, 102, 0.1)', borderRadius: '12px', border: '1px solid rgba(81, 207, 102, 0.3)' }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#51CF66' }}>{sessionStats.good}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Good ✅</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(51, 154, 240, 0.1)', borderRadius: '12px', border: '1px solid rgba(51, 154, 240, 0.3)' }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#339AF0' }}>{sessionStats.easy}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Easy 🎯</div>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/m/vocabulary')}
                                style={{
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'rgba(0, 122, 255, 0.3)',
                                    color: '#007AFF',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Back to Due Cards
                            </button>
                        </div>
                    ) : currentItem ? (
                        <>
                            {/* Card Interface */}
                            <div style={{
                                maxWidth: '448px',
                                margin: '0 auto',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minHeight: 'calc(100vh - 300px)'
                            }}>
                                {/* Card */}
                                <div
                                    onClick={() => !isFlipped && setIsFlipped(true)}
                                    style={{
                                        width: '100%',
                                        minHeight: '360px',
                                        backgroundColor: 'rgba(28, 28, 32, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '20px',
                                        padding: '40px 24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: !isFlipped ? 'pointer' : 'default',
                                        transition: 'all 0.3s ease',
                                        marginBottom: '24px',
                                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                                    }}
                                >
                                    {/* Front: English/Russian Word */}
                                    {!isFlipped ? (
                                        <>
                                            <div style={{
                                                fontSize: '11px',
                                                color: 'rgba(255, 255, 255, 0.4)',
                                                marginBottom: '16px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                fontWeight: '600'
                                            }}>
                                                {locale === 'ru' && currentItem.russian ? 'Russian' : 'English'}
                                            </div>
                                            <div style={{
                                                fontSize: '36px',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                textAlign: 'center',
                                                marginBottom: '24px'
                                            }}>
                                                {locale === 'ru' && currentItem.russian ? currentItem.russian : currentItem.english}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: 'rgba(255, 255, 255, 0.3)',
                                                fontWeight: '500'
                                            }}>
                                                Tap to reveal answer
                                            </div>
                                        </>
                                    ) : (
                                        /* Back: Greek Word */
                                        <>
                                            <div style={{
                                                fontSize: '11px',
                                                color: 'rgba(255, 255, 255, 0.4)',
                                                marginBottom: '16px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                fontWeight: '600'
                                            }}>
                                                Greek
                                            </div>
                                            <div style={{
                                                fontSize: '40px',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                textAlign: 'center',
                                                marginBottom: '12px'
                                            }}>
                                                {currentItem.greek_word || currentItem.greek}
                                            </div>
                                            {currentItem.phonetic && (
                                                <div style={{
                                                    fontSize: '16px',
                                                    color: '#A8A8AD',
                                                    fontStyle: 'italic',
                                                    marginBottom: '20px'
                                                }}>
                                                    /{currentItem.phonetic}/
                                                </div>
                                            )}
                                            {currentItem.example_gr && (
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    textAlign: 'center',
                                                    fontStyle: 'italic',
                                                    lineHeight: '1.6'
                                                }}>
                                                    "{currentItem.example_gr}"
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* TTS Controls */}
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginBottom: '20px',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}>
                                    <button
                                        onClick={playAudio}
                                        disabled={isPlaying}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: isPlaying ? 'not-allowed' : 'pointer',
                                            opacity: isPlaying ? 0.5 : 1
                                        }}
                                    >
                                        {isPlaying ? '🔊 Playing...' : '🔊 Play'}
                                    </button>
                                    <button
                                        onClick={cycleSpeed}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                        title={`Speed: ${speedInfo.label}`}
                                    >
                                        {speedInfo.emoji}
                                    </button>
                                    <button
                                        onClick={toggleAutoPlay}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '10px',
                                            border: `1px solid ${autoPlay ? 'rgba(0, 122, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
                                            background: autoPlay ? 'rgba(0, 122, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                            color: autoPlay ? '#007AFF' : 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                        title={`Auto-play: ${autoPlay ? 'ON' : 'OFF'}`}
                                    >
                                        {autoPlay ? '🔊' : '🔇'} Auto
                                    </button>
                                </div>

                                {/* Rating Buttons (only when flipped) */}
                                {isFlipped && (
                                    <div style={{
                                        width: '100%',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '12px'
                                    }}>
                                        <RatingButton
                                            label="Again"
                                            emoji="❌"
                                            color="#FF6B6B"
                                            onClick={() => handleRating(1)}
                                        />
                                        <RatingButton
                                            label="Hard"
                                            emoji="🟠"
                                            color="#FFA94D"
                                            onClick={() => handleRating(2)}
                                        />
                                        <RatingButton
                                            label="Good"
                                            emoji="✅"
                                            color="#51CF66"
                                            onClick={() => handleRating(3)}
                                        />
                                        <RatingButton
                                            label="Easy"
                                            emoji="🎯"
                                            color="#339AF0"
                                            onClick={() => handleRating(4)}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Bottom Navigation */}
                <MobileBottomNav />
            </div>
        </>
    );
}

// Rating Button Component
interface RatingButtonProps {
    label: string;
    emoji: string;
    color: string;
    onClick: () => void;
}

function RatingButton({ label, emoji, color, onClick }: RatingButtonProps) {
    return (
        <button
            onClick={onClick}
            style={{
                minHeight: '70px', // Large touch target!
                backgroundColor: `${color}15`, // 15 = ~8% opacity
                border: `2px solid ${color}`,
                borderRadius: '16px',
                color: color,
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation' // Disable double-tap zoom
            }}
            onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            <span style={{ fontSize: '28px' }}>{emoji}</span>
            <span>{label}</span>
        </button>
    );
}
