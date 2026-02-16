/**
 * Matching Game Component
 *
 * Click-based card matching game for Greek-English pairs
 * - Shuffle English/Greek cards
 * - Click first card → highlight
 * - Click second card → check match
 * - CSS animations for feedback (match/shake)
 * - Score calculation based on mistakes
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Clock } from 'lucide-react';

interface MatchingGameProps {
    item: {
        id: string;
        english: string;
        greek: string;
    };
    config: {
        num_pairs: number;
        time_limit_sec: number | null;
    };
    onComplete: (success: boolean, score: number, timeSeconds: number, mistakes: number) => void;
}

interface Card {
    id: string;
    text: string;
    language: 'en' | 'el';
    pairId: string;
    matched: boolean;
}

export function MatchingGame({ item, config, onComplete }: MatchingGameProps) {
    const [cards, setCards] = useState<Card[]>([]);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<number>(0);
    const [mistakes, setMistakes] = useState<number>(0);
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const [shakeCards, setShakeCards] = useState<string[]>([]);
    const [startTime] = useState<number>(Date.now());
    const [timeRemaining, setTimeRemaining] = useState<number | null>(
        config.time_limit_sec
    );
    const [gameOver, setGameOver] = useState<boolean>(false);

    // Initialize cards
    useEffect(() => {
        initializeCards();
    }, [item, config.num_pairs]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0 || gameOver) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, gameOver]);

    // Check if game complete
    useEffect(() => {
        if (matchedPairs === config.num_pairs && matchedPairs > 0) {
            handleGameComplete();
        }
    }, [matchedPairs, config.num_pairs]);

    /**
     * Initialize game cards
     * Create pairs and shuffle
     */
    const initializeCards = () => {
        const pairs: Card[] = [];

        // For MVP, create duplicate pairs from single item
        // In real implementation, fetch multiple items from same level
        for (let i = 0; i < config.num_pairs; i++) {
            const pairId = `pair-${i}`;

            // Add English card
            pairs.push({
                id: `en-${i}`,
                text: item.english + (i > 0 ? ` (${i + 1})` : ''), // Add number for duplicates
                language: 'en',
                pairId,
                matched: false,
            });

            // Add Greek card
            pairs.push({
                id: `el-${i}`,
                text: item.greek + (i > 0 ? ` (${i + 1})` : ''),
                language: 'el',
                pairId,
                matched: false,
            });
        }

        // Shuffle cards
        const shuffled = pairs.sort(() => Math.random() - 0.5);
        setCards(shuffled);
    };

    /**
     * Handle card click
     */
    const handleCardClick = (cardId: string) => {
        // Ignore if checking, game over, or card already matched/selected
        if (isChecking || gameOver) return;

        const card = cards.find((c) => c.id === cardId);
        if (!card || card.matched || selectedCards.includes(cardId)) return;

        // Select card
        const newSelected = [...selectedCards, cardId];
        setSelectedCards(newSelected);

        // Check if two cards selected
        if (newSelected.length === 2) {
            checkMatch(newSelected[0], newSelected[1]);
        }
    };

    /**
     * Check if two cards match
     */
    const checkMatch = (card1Id: string, card2Id: string) => {
        setIsChecking(true);

        const card1 = cards.find((c) => c.id === card1Id);
        const card2 = cards.find((c) => c.id === card2Id);

        if (!card1 || !card2) {
            setIsChecking(false);
            setSelectedCards([]);
            return;
        }

        // Check if same pair
        const isMatch = card1.pairId === card2.pairId;

        if (isMatch) {
            // Match! Update cards
            setTimeout(() => {
                setCards((prev) =>
                    prev.map((c) => {
                        if (c.id === card1Id || c.id === card2Id) {
                            return { ...c, matched: true };
                        }
                        return c;
                    })
                );
                setMatchedPairs((prev) => prev + 1);
                setSelectedCards([]);
                setIsChecking(false);
            }, 500);
        } else {
            // No match - shake cards
            setShakeCards([card1Id, card2Id]);
            setMistakes((prev) => prev + 1);

            setTimeout(() => {
                setShakeCards([]);
                setSelectedCards([]);
                setIsChecking(false);
            }, 800);
        }
    };

    /**
     * Calculate score based on mistakes
     * Max score: 100
     * Penalty: based on mistakes relative to total pairs
     */
    const calculateScore = (): number => {
        const totalPairs = config.num_pairs;
        const maxScore = 100;

        // Penalty: each mistake costs (30% / total possible mistakes)
        // Possible mistakes = total pairs * 2 (since you could mismatch every card once)
        const penaltyPerMistake = 30 / (totalPairs * 2);
        const penalty = mistakes * penaltyPerMistake;

        return Math.max(0, Math.round(maxScore - penalty));
    };

    /**
     * Handle game completion
     */
    const handleGameComplete = () => {
        setGameOver(true);
        const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
        const score = calculateScore();
        const success = score >= 65; // Pass threshold

        onComplete(success, score, timeSeconds, mistakes);
    };

    /**
     * Handle timeout
     */
    const handleTimeout = () => {
        setGameOver(true);
        const timeSeconds = config.time_limit_sec || 0;
        const score = Math.max(0, calculateScore() - 20); // Time penalty

        onComplete(false, score, timeSeconds, mistakes);
    };

    /**
     * Format time as MM:SS
     */
    const formatTime = (seconds: number | null): string => {
        if (seconds === null) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex items-center justify-between px-4 py-3 bg-accent/20 rounded-lg border border-border/30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                            Matched: {matchedPairs} / {config.num_pairs}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Mistakes: {mistakes}</span>
                    </div>
                </div>

                {config.time_limit_sec && (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span
                            className={`text-sm font-mono font-medium ${
                                timeRemaining !== null && timeRemaining < 10
                                    ? 'text-red-500 animate-pulse'
                                    : ''
                            }`}
                        >
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <p className="text-center text-sm text-muted-foreground">
                Click cards to match English words with their Greek translations
            </p>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {cards.map((card) => {
                    const isSelected = selectedCards.includes(card.id);
                    const isMatched = card.matched;
                    const shouldShake = shakeCards.includes(card.id);

                    return (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            disabled={isMatched || isChecking || gameOver}
                            className={`
                                relative aspect-[3/2] p-4 rounded-lg border-2 transition-all duration-300
                                flex items-center justify-center text-center
                                ${
                                    isMatched
                                        ? 'bg-green-500/20 border-green-500 cursor-default'
                                        : isSelected
                                        ? 'bg-blue-500/20 border-blue-500 scale-105'
                                        : 'bg-card border-border hover:border-primary hover:scale-105 active:scale-95'
                                }
                                ${shouldShake ? 'animate-shake' : ''}
                                ${isChecking ? 'pointer-events-none' : ''}
                            `}
                        >
                            <span
                                className={`
                                text-sm font-medium
                                ${card.language === 'el' ? 'font-sans' : ''}
                                ${isMatched ? 'text-green-600' : ''}
                            `}
                            >
                                {card.text}
                            </span>

                            {isMatched && (
                                <div className="absolute top-1 right-1">
                                    <Check className="h-4 w-4 text-green-500" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes shake {
                    0%,
                    100% {
                        transform: translateX(0);
                    }
                    10%,
                    30%,
                    50%,
                    70%,
                    90% {
                        transform: translateX(-5px);
                    }
                    20%,
                    40%,
                    60%,
                    80% {
                        transform: translateX(5px);
                    }
                }

                .animate-shake {
                    animation: shake 0.6s ease-in-out;
                }
            `}</style>
        </div>
    );
}
