/**
 * Memory Split Game Component (Shared)
 *
 * Dual-grid memory game with two modes:
 * - 'split' mode: Cards always visible, match by association (top ↔ bottom grid)
 * - 'flip' mode: Cards hidden, classic memory with flip animation
 *
 * Features:
 * - Flexible pair counts: 6, 8, 12
 * - Shuffle algorithm for independent grids
 * - Audio playback for Greek cards
 * - Solution button (reveals matching card with penalty)
 * - Score calculation (mistakes, time, solution usage)
 * - 3D flip animation (flip mode) + highlight (split mode)
 * - Framer Motion animations
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, Lightbulb, RotateCcw, Check, X, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

// ============================================================================
// TYPES
// ============================================================================

export type GameMode = 'split' | 'flip';
export type UserLanguage = 'en' | 'de' | 'es' | 'ru';
export type PairCount = 6 | 8 | 12;

export interface VocabularyPair {
    id: string;
    userLanguage: string; // Translated text (EN/DE/ES/RU)
    greek: string;
    audioUrl?: string;
}

export interface MemorySplitProps {
    items: VocabularyPair[];
    pairCount: PairCount;
    gameMode: GameMode;
    userLanguage: UserLanguage;
    onComplete: (score: number, time: number, mistakes: number) => void;
}

interface CardState {
    id: string;
    pairId: string; // Matches top card with bottom card
    text: string;
    language: 'user' | 'greek';
    grid: 'top' | 'bottom';
    isFlipped: boolean; // Only relevant for 'flip' mode
    isSelected: boolean; // Only relevant for 'split' mode
    isMatched: boolean;
    audioUrl?: string;
}

interface GameState {
    matches: number;
    mistakes: number;
    score: number;
    startTime: number;
    solutionPenalty: number; // -10 per solution use
    solutionsUsed: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get grid configuration based on pair count
 */
function getGridConfig(count: PairCount): { cols: number; rows: number } {
    switch (count) {
        case 6:
            return { cols: 3, rows: 2 }; // 3×2
        case 8:
            return { cols: 4, rows: 2 }; // 4×2
        case 12:
            return { cols: 4, rows: 3 }; // 4×3
    }
}

/**
 * Shuffle cards for dual-grid layout
 */
function shuffleCards(
    pairs: VocabularyPair[],
    count: PairCount,
    mode: GameMode
): CardState[] {
    // Take random pairs
    const selectedPairs = shuffle(pairs).slice(0, count);

    // Shuffle top grid (user language)
    const topCards = shuffle(
        selectedPairs.map((p, i) => ({
            id: `top-${i}`,
            pairId: `pair-${i}`,
            text: p.userLanguage,
            language: 'user' as const,
            grid: 'top' as const,
            isFlipped: mode === 'split', // Split mode = always visible
            isSelected: false,
            isMatched: false,
        }))
    );

    // Shuffle bottom grid (greek)
    const bottomCards = shuffle(
        selectedPairs.map((p, i) => ({
            id: `bottom-${i}`,
            pairId: `pair-${i}`,
            text: p.greek,
            language: 'greek' as const,
            grid: 'bottom' as const,
            isFlipped: mode === 'split', // Split mode = always visible
            isSelected: false,
            isMatched: false,
            audioUrl: p.audioUrl,
        }))
    );

    return [...topCards, ...bottomCards];
}

/**
 * Check if two cards match
 */
function checkMatch(card1: CardState, card2: CardState): boolean {
    // Must be from different grids
    if (card1.grid === card2.grid) return false;

    // Must have same pairId
    return card1.pairId === card2.pairId;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MemorySplitGame({
    items,
    pairCount,
    gameMode,
    userLanguage,
    onComplete,
}: MemorySplitProps) {
    // State
    const [cards, setCards] = useState<CardState[]>([]);
    const [selectedCards, setSelectedCards] = useState<[string | null, string | null]>([
        null,
        null,
    ]);
    const [gameState, setGameState] = useState<GameState>({
        matches: 0,
        mistakes: 0,
        score: 100,
        startTime: Date.now(),
        solutionPenalty: 0,
        solutionsUsed: 0,
    });
    const [isChecking, setIsChecking] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Audio
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    useEffect(() => {
        if (items.length < pairCount) {
            console.error(
                `Not enough items: need ${pairCount}, got ${items.length}`
            );
            return;
        }

        const initialCards = shuffleCards(items, pairCount, gameMode);
        setCards(initialCards);
        setGameState((prev) => ({ ...prev, startTime: Date.now() }));
    }, [items, pairCount, gameMode]);

    // Timer
    useEffect(() => {
        if (gameOver) return;

        const timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - gameState.startTime) / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState.startTime, gameOver]);

    // Check game completion
    useEffect(() => {
        if (gameState.matches === pairCount && pairCount > 0) {
            handleGameComplete();
        }
    }, [gameState.matches, pairCount]);

    // ========================================================================
    // GAME LOGIC
    // ========================================================================

    /**
     * Handle card click
     */
    const handleCardClick = (cardId: string) => {
        if (isChecking || gameOver) return;

        const card = cards.find((c) => c.id === cardId);
        if (!card || card.isMatched) return;

        // In flip mode: ignore if already flipped
        if (gameMode === 'flip' && card.isFlipped) return;

        // Flip card (flip mode) or select card (split mode)
        const updatedCards = cards.map((c) =>
            c.id === cardId
                ? {
                      ...c,
                      isFlipped: gameMode === 'flip' ? true : c.isFlipped,
                      isSelected: gameMode === 'split' ? true : c.isSelected,
                  }
                : c
        );
        setCards(updatedCards);

        // Play audio if Greek card in split mode
        if (gameMode === 'split' && card.language === 'greek' && card.audioUrl) {
            playAudio(card.audioUrl);
        }

        // Update selected cards
        const newSelected: [string | null, string | null] = [
            selectedCards[0] === null ? cardId : selectedCards[0],
            selectedCards[0] !== null ? cardId : null,
        ];
        setSelectedCards(newSelected);

        // Check match if two cards selected
        if (newSelected[0] !== null && newSelected[1] !== null) {
            setTimeout(() => validateMatch(newSelected[0]!, newSelected[1]!), 600);
        }
    };

    /**
     * Validate match between two cards
     */
    const validateMatch = (card1Id: string, card2Id: string) => {
        setIsChecking(true);

        const card1 = cards.find((c) => c.id === card1Id);
        const card2 = cards.find((c) => c.id === card2Id);

        if (!card1 || !card2) {
            resetSelection();
            return;
        }

        const isMatch = checkMatch(card1, card2);

        if (isMatch) {
            // MATCH!
            const updatedCards = cards.map((c) =>
                c.id === card1Id || c.id === card2Id
                    ? { ...c, isMatched: true, isSelected: false }
                    : c
            );
            setCards(updatedCards);

            setGameState((prev) => ({
                ...prev,
                matches: prev.matches + 1,
            }));

            // Play Greek audio on match
            const greekCard = card1.language === 'greek' ? card1 : card2;
            if (greekCard.audioUrl) {
                playAudio(greekCard.audioUrl);
            }

            // Confetti
            triggerConfetti();

            setSelectedCards([null, null]);
            setIsChecking(false);
        } else {
            // NO MATCH
            setGameState((prev) => ({
                ...prev,
                mistakes: prev.mistakes + 1,
            }));

            // Flip back (flip mode) or deselect (split mode)
            setTimeout(() => {
                const updatedCards = cards.map((c) => ({
                    ...c,
                    isFlipped:
                        gameMode === 'flip' && (c.id === card1Id || c.id === card2Id)
                            ? false
                            : c.isFlipped,
                    isSelected:
                        gameMode === 'split' && (c.id === card1Id || c.id === card2Id)
                            ? false
                            : c.isSelected,
                }));
                setCards(updatedCards);
                resetSelection();
            }, 1000);
        }
    };

    /**
     * Reset selection state
     */
    const resetSelection = () => {
        setSelectedCards([null, null]);
        setIsChecking(false);
    };

    /**
     * Handle solution button
     */
    const handleSolution = () => {
        const selectedCard = cards.find(
            (c) =>
                (gameMode === 'flip' ? c.isFlipped : c.isSelected) && !c.isMatched
        );
        if (!selectedCard) return;

        // Find matching card in opposite grid
        const oppositeGrid = selectedCard.grid === 'top' ? 'bottom' : 'top';
        const matchingCard = cards.find(
            (c) => c.grid === oppositeGrid && c.pairId === selectedCard.pairId
        );

        if (matchingCard) {
            // Flip/select matching card
            handleCardClick(matchingCard.id);

            // Apply penalty
            setGameState((prev) => ({
                ...prev,
                score: Math.max(0, prev.score - 10),
                solutionPenalty: prev.solutionPenalty + 10,
                solutionsUsed: prev.solutionsUsed + 1,
            }));
        }
    };

    /**
     * Play audio
     */
    const playAudio = useCallback((url: string) => {
        // Stop previous audio
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
        }

        // Play new audio
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.play().catch((err) => console.log('Audio failed:', err));
    }, []);

    /**
     * Trigger confetti
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
     * Calculate final score
     */
    const calculateScore = (): number => {
        const baseScore = 100;
        const mistakePenalty = gameState.mistakes * 5; // -5 per mistake
        const solutionPenalty = gameState.solutionPenalty; // Already calculated
        const timePenalty = elapsedTime > 120 ? elapsedTime - 120 : 0; // -1 per sec over 2min

        return Math.max(0, baseScore - mistakePenalty - solutionPenalty - timePenalty);
    };

    /**
     * Handle game completion
     */
    const handleGameComplete = () => {
        if (gameOver) return;

        setGameOver(true);
        const finalScore = calculateScore();

        // Big celebration
        celebrateCompletion();

        // Call completion callback
        onComplete(finalScore, elapsedTime, gameState.mistakes);
    };

    /**
     * Celebration confetti
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
     * Reset game
     */
    const resetGame = () => {
        const newCards = shuffleCards(items, pairCount, gameMode);
        setCards(newCards);
        setSelectedCards([null, null]);
        setGameState({
            matches: 0,
            mistakes: 0,
            score: 100,
            startTime: Date.now(),
            solutionPenalty: 0,
            solutionsUsed: 0,
        });
        setIsChecking(false);
        setGameOver(false);
        setElapsedTime(0);
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    const gridConfig = getGridConfig(pairCount);
    const topCards = cards.filter((c) => c.grid === 'top');
    const bottomCards = cards.filter((c) => c.grid === 'bottom');

    const hasSolution = selectedCards.some((id) => id !== null);

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex items-center justify-between px-4 py-3 bg-accent/20 rounded-lg border border-border/30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                            Matches: {gameState.matches} / {pairCount}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">
                            Mistakes: {gameState.mistakes}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-mono font-medium">
                            {Math.floor(elapsedTime / 60)}:
                            {(elapsedTime % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSolution}
                        disabled={!hasSolution || gameOver}
                        className="gap-2"
                    >
                        <Lightbulb className="h-4 w-4" />
                        Solution (-10)
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetGame}
                        className="gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </Button>
                </div>
            </div>

            {/* Instructions */}
            <p className="text-center text-sm text-muted-foreground">
                {gameMode === 'split'
                    ? 'Match words from top and bottom grids'
                    : 'Flip cards to find matching pairs'}
            </p>

            {/* Top Grid */}
            <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {userLanguage.toUpperCase()}
                </h3>
                <div
                    className="grid gap-3"
                    style={{
                        gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                    }}
                >
                    {topCards.map((card) => (
                        <Card
                            key={card.id}
                            card={card}
                            gameMode={gameMode}
                            onClick={() => handleCardClick(card.id)}
                            disabled={isChecking || gameOver}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Greek (Ελληνικά)
                </h3>
                <div
                    className="grid gap-3"
                    style={{
                        gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                    }}
                >
                    {bottomCards.map((card) => (
                        <Card
                            key={card.id}
                            card={card}
                            gameMode={gameMode}
                            onClick={() => handleCardClick(card.id)}
                            disabled={isChecking || gameOver}
                        />
                    ))}
                </div>
            </div>

            {/* Game Complete Message */}
            {gameOver && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 px-6 bg-green-500/20 text-green-600 border border-green-500/30 rounded-lg"
                >
                    <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
                    <p className="text-sm">
                        Score: {calculateScore()} | Time: {Math.floor(elapsedTime / 60)}:
                        {(elapsedTime % 60).toString().padStart(2, '0')} | Mistakes:{' '}
                        {gameState.mistakes}
                    </p>
                </motion.div>
            )}
        </div>
    );
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

interface CardProps {
    card: CardState;
    gameMode: GameMode;
    onClick: () => void;
    disabled: boolean;
}

function Card({ card, gameMode, onClick, disabled }: CardProps) {
    // Flip Mode: 3D Flip Animation
    if (gameMode === 'flip') {
        return (
            <motion.button
                onClick={onClick}
                disabled={disabled || card.isMatched}
                className="relative aspect-[3/2] rounded-lg cursor-pointer"
                style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                }}
                animate={{
                    rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                }}
                transition={{
                    duration: 0.6,
                    type: 'spring',
                }}
            >
                {/* Card Front (Hidden) */}
                <div
                    className={`
                        card-face card-front
                        absolute inset-0 rounded-lg border-2 transition-colors
                        flex items-center justify-center
                        ${
                            card.isMatched
                                ? 'bg-green-500/20 border-green-500'
                                : 'bg-gradient-to-br from-primary/80 to-primary/60 border-primary'
                        }
                    `}
                >
                    <span className="text-4xl font-bold text-primary-foreground">
                        🎴
                    </span>
                </div>

                {/* Card Back (Content) */}
                <div
                    className={`
                        card-face card-back
                        absolute inset-0 rounded-lg border-2 p-3 transition-colors
                        flex items-center justify-center text-center
                        ${
                            card.isMatched
                                ? 'bg-green-500/20 border-green-500'
                                : 'bg-card border-border'
                        }
                    `}
                >
                    <span
                        className={`
                            text-sm font-medium break-words
                            ${card.language === 'greek' ? 'font-sans' : ''}
                            ${card.isMatched ? 'text-green-600' : ''}
                        `}
                    >
                        {card.text}
                    </span>

                    {card.isMatched && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1"
                        >
                            <Check className="h-4 w-4 text-green-500" />
                        </motion.div>
                    )}

                    {card.audioUrl && card.language === 'greek' && (
                        <div className="absolute bottom-1 right-1">
                            <Volume2 className="h-3 w-3 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </motion.button>
        );
    }

    // Split Mode: Selection Highlight
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled || card.isMatched}
            className={`
                relative aspect-[3/2] p-3 rounded-lg border-2 transition-all duration-300
                flex items-center justify-center text-center
                ${
                    card.isMatched
                        ? 'bg-green-500/20 border-green-500 cursor-default'
                        : card.isSelected
                        ? 'bg-blue-500/20 border-blue-500 scale-105 shadow-lg shadow-blue-500/50'
                        : 'bg-card border-border hover:border-primary hover:scale-105 active:scale-95'
                }
            `}
            animate={{
                scale: card.isSelected ? 1.05 : 1,
                borderColor: card.isMatched
                    ? 'rgba(34, 197, 94, 1)'
                    : card.isSelected
                    ? 'rgba(59, 130, 246, 1)'
                    : 'rgba(255, 255, 255, 0.2)',
            }}
            transition={{ duration: 0.2 }}
        >
            <span
                className={`
                    text-sm font-medium break-words
                    ${card.language === 'greek' ? 'font-sans' : ''}
                    ${card.isMatched ? 'text-green-600' : ''}
                `}
            >
                {card.text}
            </span>

            {card.isMatched && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1"
                >
                    <Check className="h-4 w-4 text-green-500" />
                </motion.div>
            )}

            {card.audioUrl && card.language === 'greek' && (
                <div className="absolute bottom-1 right-1">
                    <Volume2 className="h-3 w-3 text-muted-foreground" />
                </div>
            )}
        </motion.button>
    );
}
