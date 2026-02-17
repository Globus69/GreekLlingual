/**
 * Memory Game - Desktop Version
 *
 * Classic memory card matching game for vocabulary practice
 * - 4×4 Grid (16 cards = 8 pairs)
 * - Toggle between Greek-first and User-language-first
 * - Match pairs by clicking cards
 * - Track attempts, matches, and time
 *
 * Desktop-optimized: Large cards, hover effects, keyboard support
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { useLanguage } from '@/context/language-context';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, RotateCcw, Trophy, Clock, Target, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

interface LearningItem {
    id: string;
    english: string;
    greek: string;
    german?: string;
    russian?: string;
    spanish?: string;
    module: string;
    level?: string;
}

interface Card {
    id: string;
    content: string;
    language: 'greek' | 'user';
    pairId: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export default function MemoryGamePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const { locale } = useLanguage();

    // Game state
    const [items, setItems] = useState<LearningItem[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [flipped, setFlipped] = useState<string[]>([]);
    const [matched, setMatched] = useState<string[]>([]);
    const [attempts, setAttempts] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Settings
    const [greekFirst, setGreekFirst] = useState(true);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Load learning items on mount
    useEffect(() => {
        if (user) {
            loadItems();
        }
    }, [user]);

    // Timer
    useEffect(() => {
        if (!startTime || gameOver) return;

        const timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, gameOver]);

    // Check for game completion
    useEffect(() => {
        if (matched.length === 16 && matched.length > 0 && !gameOver) {
            setGameOver(true);
        }
    }, [matched]);

    /**
     * Load 8 random learning items for the memory game
     */
    const loadItems = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch 8 random vocabulary items
            const { data, error: fetchError } = await supabase
                .from('learning_items')
                .select('*')
                .eq('type', 'vocabulary')
                .limit(16); // Get more items for variety

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            if (!data || data.length === 0) {
                throw new Error('No practice items available. Please enable some items first.');
            }

            // If we got fewer than 8 items, use what we have (will result in smaller grid)
            const itemsToUse = data.slice(0, 8);
            setItems(itemsToUse);

            // Initialize cards
            initializeCards(itemsToUse);

            // Start timer
            setStartTime(Date.now());
        } catch (err: any) {
            console.error('[MemoryGame] Load error:', err);
            setError(err.message || 'Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Initialize card grid from items
     */
    const initializeCards = (itemsData: LearningItem[]) => {
        const newCards: Card[] = [];

        // Get user language content
        const getUserContent = (item: LearningItem): string => {
            switch (locale) {
                case 'de': return item.german || item.english;
                case 'ru': return item.russian || item.english;
                case 'es': return item.spanish || item.english;
                default: return item.english;
            }
        };

        // Create pairs
        itemsData.forEach((item) => {
            // Greek card
            newCards.push({
                id: `${item.id}-greek`,
                content: item.greek,
                language: 'greek',
                pairId: item.id,
                isFlipped: false,
                isMatched: false,
            });

            // User language card
            newCards.push({
                id: `${item.id}-user`,
                content: getUserContent(item),
                language: 'user',
                pairId: item.id,
                isFlipped: false,
                isMatched: false,
            });
        });

        // Shuffle cards
        const shuffled = newCards.sort(() => Math.random() - 0.5);
        setCards(shuffled);
    };

    /**
     * Handle card click
     */
    const handleCardClick = (cardId: string) => {
        // Ignore if game over
        if (gameOver) return;

        // Ignore if already checking two cards
        if (flipped.length === 2) return;

        // Ignore if card already flipped or matched
        const card = cards.find(c => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return;

        // Flip the card
        const newFlipped = [...flipped, cardId];
        setFlipped(newFlipped);

        // Update card state
        setCards(prev => prev.map(c =>
            c.id === cardId ? { ...c, isFlipped: true } : c
        ));

        // If two cards are flipped, check for match
        if (newFlipped.length === 2) {
            setAttempts(prev => prev + 1);

            setTimeout(() => {
                checkMatch(newFlipped);
            }, 800);
        }
    };

    /**
     * Check if two flipped cards match
     */
    const checkMatch = (flippedCards: string[]) => {
        const [card1Id, card2Id] = flippedCards;
        const card1 = cards.find(c => c.id === card1Id);
        const card2 = cards.find(c => c.id === card2Id);

        if (!card1 || !card2) {
            setFlipped([]);
            return;
        }

        // Check if cards are a match (same pairId)
        if (card1.pairId === card2.pairId) {
            // MATCH!
            setMatched(prev => [...prev, card1Id, card2Id]);
            setCards(prev => prev.map(c =>
                (c.id === card1Id || c.id === card2Id)
                    ? { ...c, isMatched: true }
                    : c
            ));
        } else {
            // NO MATCH - flip back
            setCards(prev => prev.map(c =>
                (c.id === card1Id || c.id === card2Id)
                    ? { ...c, isFlipped: false }
                    : c
            ));
        }

        // Reset flipped state
        setFlipped([]);
    };

    /**
     * Reset game
     */
    const resetGame = () => {
        setFlipped([]);
        setMatched([]);
        setAttempts(0);
        setElapsedTime(0);
        setGameOver(false);
        setStartTime(Date.now());

        if (items.length > 0) {
            initializeCards(items);
        }
    };

    /**
     * Toggle language mode and reinitialize cards
     */
    const toggleLanguageMode = () => {
        setGreekFirst(!greekFirst);
        // Reset game when toggling
        setFlipped([]);
        setMatched([]);
        setAttempts(0);
        setElapsedTime(0);
        setGameOver(false);
        setStartTime(Date.now());

        if (items.length > 0) {
            initializeCards(items);
        }
    };

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
                <div className="text-center">
                    <div className="text-4xl mb-4">🎮</div>
                    <h1 className="text-2xl font-bold text-white">Loading Memory Game...</h1>
                </div>
            </div>
        );
    }

    // Redirect if no user
    if (!user) {
        return null;
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
                <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <Link
                            href="/practice-modes"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Practice Modes</span>
                        </Link>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                        <p className="text-white/70">{error}</p>
                        <button
                            onClick={loadItems}
                            className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Back Button */}
                        <Link
                            href="/practice-modes"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Practice Modes</span>
                        </Link>

                        {/* Title */}
                        <div className="text-center flex-1">
                            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                                <span className="text-3xl">🧠</span>
                                <span>Memory Game</span>
                            </h1>
                        </div>

                        {/* Toggle & Reset */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleLanguageMode}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/90 text-sm font-medium transition-all"
                            >
                                {greekFirst ? '🇬🇷 Greek First' : '🌍 Translation First'}
                            </button>

                            <button
                                onClick={resetGame}
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/90 transition-all"
                                title="Reset Game"
                            >
                                <RotateCcw className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Bar */}
                <div className="mb-6 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <span className="text-white font-medium">{formatTime(elapsedTime)}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <Target className="h-5 w-5 text-green-400" />
                        <span className="text-white font-medium">
                            {matched.length / 2} / {cards.length / 2} Pairs
                        </span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        <span className="text-white font-medium">{attempts} Attempts</span>
                    </div>
                </div>

                {/* Game Grid */}
                <div
                    className="grid gap-4 mb-6"
                    style={{
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        maxWidth: '800px',
                        margin: '0 auto',
                    }}
                >
                    {cards.map((card) => (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            disabled={card.isMatched || card.isFlipped || flipped.length === 2}
                            className="relative aspect-[4/5] rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                            style={{
                                perspective: '1000px',
                            }}
                        >
                            {/* Card Inner */}
                            <div
                                className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                                    card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                                }`}
                                style={{
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                {/* Front (Hidden) */}
                                <div
                                    className={`absolute inset-0 flex items-center justify-center rounded-xl backface-hidden ${
                                        card.isMatched
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                            : 'bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600'
                                    } shadow-lg`}
                                    style={{
                                        backfaceVisibility: 'hidden',
                                    }}
                                >
                                    <span className="text-4xl">
                                        {card.isMatched ? '✓' : '🇬🇷'}
                                    </span>
                                </div>

                                {/* Back (Revealed) */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-white shadow-lg rotate-y-180 backface-hidden p-4"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                    }}
                                >
                                    <span className="text-lg font-semibold text-gray-800 text-center leading-tight">
                                        {card.content}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Game Over Modal */}
                {gameOver && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🎉</div>
                                <h2 className="text-3xl font-bold text-white mb-4">
                                    Congratulations!
                                </h2>
                                <p className="text-white/70 mb-6">
                                    You completed the memory game!
                                </p>

                                {/* Stats */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                                        <span className="text-white/70">Time:</span>
                                        <span className="text-white font-semibold">{formatTime(elapsedTime)}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                                        <span className="text-white/70">Attempts:</span>
                                        <span className="text-white font-semibold">{attempts}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                                        <span className="text-white/70">Accuracy:</span>
                                        <span className="text-white font-semibold">
                                            {attempts > 0 ? Math.round((matched.length / 2 / attempts) * 100) : 100}%
                                        </span>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={resetGame}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all shadow-lg"
                                    >
                                        Play Again
                                    </button>
                                    <Link
                                        href="/practice-modes"
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-semibold transition-all text-center"
                                    >
                                        Back
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span>💡</span>
                        How to Play
                    </h3>
                    <ul className="text-sm text-white/70 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>Click cards to reveal Greek words and their translations</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>Match pairs by finding the Greek word and its translation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>Toggle language mode to practice in different directions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>Complete all pairs as quickly as possible with fewer attempts</span>
                        </li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
