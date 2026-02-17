/**
 * Memory Game Component
 *
 * Card flip memory game for Greek-English pairs
 * - Flip animation using Framer Motion
 * - Match detection with sound + confetti
 * - Animated card removal on match
 * - Stats tracking (attempts, matches, time)
 * - Responsive for Desktop + Mobile
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, RotateCcw } from 'lucide-react';

interface MemoryCard {
    id: string;
    content: string;
    language: 'greek' | 'user';
    pairId: string;
}

interface MemoryGameProps {
    cards: MemoryCard[];
    showGreekFirst: boolean;
    onComplete?: (stats: GameStats) => void;
    isMobile?: boolean;
}

interface GameStats {
    attempts: number;
    matches: number;
    time: number;
}

export function MemoryGame({
    cards,
    showGreekFirst,
    onComplete,
    isMobile = false,
}: MemoryGameProps) {
    const [flipped, setFlipped] = useState<string[]>([]);
    const [matched, setMatched] = useState<string[]>([]);
    const [attempts, setAttempts] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [startTime] = useState<number>(Date.now());
    const [gameComplete, setGameComplete] = useState(false);

    // Check if game is complete
    useEffect(() => {
        if (matched.length === cards.length && cards.length > 0) {
            handleGameComplete();
        }
    }, [matched, cards.length]);

    /**
     * Handle game completion
     */
    const handleGameComplete = () => {
        if (gameComplete) return;

        setGameComplete(true);
        const timeSeconds = Math.floor((Date.now() - startTime) / 1000);

        // Big celebration confetti
        celebrateCompletion();

        // Call onComplete callback
        if (onComplete) {
            onComplete({
                attempts,
                matches: matched.length / 2,
                time: timeSeconds,
            });
        }
    };

    /**
     * Celebration confetti for game completion
     */
    const celebrateCompletion = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 0,
            colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
        };

        const interval: NodeJS.Timeout = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: Math.random(), y: Math.random() - 0.2 },
            });
        }, 250);
    };

    /**
     * Play match sound using Web Audio API
     */
    const playMatchSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext ||
                (window as typeof window & { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.5
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Audio context not available:', error);
        }
    }, []);

    /**
     * Trigger confetti for match
     */
    const triggerConfetti = useCallback(() => {
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
        });
    }, []);

    /**
     * Handle card click
     */
    const handleCardClick = (cardId: string) => {
        // Ignore if checking, already flipped, or matched
        if (isChecking || flipped.includes(cardId) || matched.includes(cardId)) {
            return;
        }

        const newFlipped = [...flipped, cardId];
        setFlipped(newFlipped);

        // Check match if two cards flipped
        if (newFlipped.length === 2) {
            checkMatch(newFlipped);
        }
    };

    /**
     * Check if two cards match
     */
    const checkMatch = (flippedCards: string[]) => {
        setIsChecking(true);
        setAttempts((prev) => prev + 1);

        const [card1Id, card2Id] = flippedCards;
        const card1 = cards.find((c) => c.id === card1Id);
        const card2 = cards.find((c) => c.id === card2Id);

        if (!card1 || !card2) {
            setIsChecking(false);
            setFlipped([]);
            return;
        }

        // Check if same pair
        const isMatch = card1.pairId === card2.pairId;

        if (isMatch) {
            // MATCH! Add to matched cards
            setTimeout(() => {
                setMatched([...matched, card1Id, card2Id]);
                setFlipped([]);
                setIsChecking(false);

                // Play sound and confetti
                playMatchSound();
                triggerConfetti();
            }, 600);
        } else {
            // NO MATCH - flip back after delay
            setTimeout(() => {
                setFlipped([]);
                setIsChecking(false);
            }, 1000);
        }
    };

    /**
     * Reset game
     */
    const resetGame = () => {
        setFlipped([]);
        setMatched([]);
        setAttempts(0);
        setGameComplete(false);
    };

    /**
     * Get card display content based on language toggle
     */
    const getCardContent = (card: MemoryCard): string => {
        if (card.language === 'greek') {
            return showGreekFirst ? card.content : '?';
        } else {
            return showGreekFirst ? '?' : card.content;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex items-center justify-between px-4 py-3 bg-accent/20 rounded-lg border border-border/30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                            Matches: {matched.length / 2} / {cards.length / 2}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Attempts: {attempts}</span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetGame}
                    className="gap-2"
                    disabled={attempts === 0}
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                </Button>
            </div>

            {/* Instructions */}
            <p className="text-center text-sm text-muted-foreground">
                Click cards to flip and find matching pairs
            </p>

            {/* Cards Grid */}
            <div
                className={`
                    grid gap-3
                    ${
                        isMobile
                            ? 'grid-cols-3'
                            : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6'
                    }
                `}
            >
                <AnimatePresence mode="popLayout">
                    {cards.map((card) => {
                        const isFlipped = flipped.includes(card.id);
                        const isMatched = matched.includes(card.id);

                        return (
                            <Card
                                key={card.id}
                                card={card}
                                isFlipped={isFlipped}
                                isMatched={isMatched}
                                onClick={() => handleCardClick(card.id)}
                                disabled={isChecking || gameComplete}
                                content={getCardContent(card)}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Game Complete Message */}
            {gameComplete && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 px-6 bg-green-500/20 text-green-600 border border-green-500/30 rounded-lg"
                >
                    <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
                    <p className="text-sm">
                        You completed the game in {attempts} attempts!
                    </p>
                </motion.div>
            )}
        </div>
    );
}

/**
 * Individual Memory Card Component with Flip Animation
 */
interface CardProps {
    card: MemoryCard;
    isFlipped: boolean;
    isMatched: boolean;
    onClick: () => void;
    disabled: boolean;
    content: string;
}

function Card({ card, isFlipped, isMatched, onClick, disabled, content }: CardProps) {
    return (
        <motion.div
            layout
            exit={{
                scale: 0,
                opacity: 0,
                transition: { duration: 0.3 },
            }}
            className="aspect-[3/4]"
        >
            <motion.button
                onClick={onClick}
                disabled={disabled || isMatched}
                className="relative w-full h-full rounded-lg cursor-pointer"
                style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                }}
                animate={{
                    rotateY: isFlipped || isMatched ? 180 : 0,
                }}
                transition={{
                    duration: 0.6,
                    ease: 'easeInOut',
                }}
            >
                {/* Card Front (Hidden) */}
                <div
                    className={`
                        absolute inset-0 rounded-lg border-2 transition-colors
                        flex items-center justify-center
                        ${
                            isMatched
                                ? 'bg-green-500/20 border-green-500'
                                : 'bg-gradient-to-br from-primary/80 to-primary/60 border-primary'
                        }
                    `}
                    style={{
                        backfaceVisibility: 'hidden',
                    }}
                >
                    <span className="text-4xl font-bold text-primary-foreground">?</span>
                </div>

                {/* Card Back (Content) */}
                <div
                    className={`
                        absolute inset-0 rounded-lg border-2 p-2 transition-colors
                        flex items-center justify-center text-center
                        ${
                            isMatched
                                ? 'bg-green-500/20 border-green-500'
                                : 'bg-card border-border'
                        }
                    `}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <span
                        className={`
                            text-sm font-medium break-words
                            ${card.language === 'greek' ? 'font-sans' : ''}
                            ${isMatched ? 'text-green-600' : ''}
                        `}
                    >
                        {content}
                    </span>

                    {isMatched && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1"
                        >
                            <Check className="h-4 w-4 text-green-500" />
                        </motion.div>
                    )}
                </div>
            </motion.button>
        </motion.div>
    );
}
