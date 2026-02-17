/**
 * Memory Split Game - Desktop Version
 *
 * Two-grid memory game with split layout:
 * - TOP Grid: User language (DE/EN/ES/RU)
 * - BOTTOM Grid: Greek (Νεοελληνικά)
 *
 * Features:
 * - Mode Toggle: Split (always visible) vs Flip (card flip animation)
 * - Pair Selection: 6, 8, or 12 pairs
 * - Dynamic Grid: Adjusts to pair count (3×2, 4×2, 4×3)
 * - Solution Button: Show matching card (-10 points penalty)
 * - Audio: Greek pronunciation on match/reveal
 *
 * Desktop-optimized: Large grids, hover effects, keyboard support
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { useLanguage } from '@/context/language-context';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, RotateCcw, Trophy, Clock, Target, Lightbulb, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

interface LearningItem {
    id: string;
    type: string;
    english: string;
    greek: string;
    german?: string;
    russian?: string;
    spanish?: string;
    audio_url?: string;
    level?: string;
}

interface Card {
    id: string;
    content: string;
    language: 'greek' | 'user';
    pairId: string;
    isFlipped: boolean;
    isMatched: boolean;
    audioUrl?: string;
}

type GameMode = 'split' | 'flip';
type PairCount = 6 | 8 | 12;

export default function MemorySplitPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const { locale } = useLanguage();

    // Game settings
    const [gameMode, setGameMode] = useState<GameMode>('split');
    const [pairCount, setPairCount] = useState<PairCount>(6);

    // Game state
    const [items, setItems] = useState<LearningItem[]>([]);
    const [topCards, setTopCards] = useState<Card[]>([]); // User language
    const [bottomCards, setBottomCards] = useState<Card[]>([]); // Greek
    const [selectedTop, setSelectedTop] = useState<string | null>(null);
    const [selectedBottom, setSelectedBottom] = useState<string | null>(null);
    const [matched, setMatched] = useState<string[]>([]);
    const [mistakes, setMistakes] = useState(0);
    const [score, setScore] = useState(100);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Audio
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Load learning items on mount or when pair count changes
    useEffect(() => {
        if (user) {
            loadItems();
        }
    }, [user, pairCount]);

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
        if (matched.length === pairCount * 2 && matched.length > 0 && !gameOver) {
            setGameOver(true);
        }
    }, [matched, pairCount]);

    /**
     * Load learning items for the memory game
     */
    const loadItems = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch random vocabulary items
            const { data, error: fetchError } = await supabase
                .from('learning_items')
                .select('*')
                .eq('type', 'vocabulary')
                .limit(pairCount * 2); // Get more items to have variety

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            if (!data || data.length === 0) {
                throw new Error('No practice items available. Please enable some items first.');
            }

            // Use available items (pad with duplicates if needed)
            let itemsToUse: LearningItem[] = [];
            if (data.length >= pairCount) {
                itemsToUse = data.slice(0, pairCount);
            } else {
                // If we don't have enough items, duplicate some
                itemsToUse = [...data];
                while (itemsToUse.length < pairCount) {
                    itemsToUse.push(data[itemsToUse.length % data.length]);
                }
            }

            setItems(itemsToUse);

            // Initialize cards
            initializeCards(itemsToUse);

            // Start timer
            setStartTime(Date.now());
        } catch (err: any) {
            console.error('[MemorySplit] Load error:', err);
            setError(err.message || 'Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Initialize card grids from items
     */
    const initializeCards = (itemsData: LearningItem[]) => {
        // Get user language content
        const getUserContent = (item: LearningItem): string => {
            switch (locale) {
                case 'de': return item.german || item.english;
                case 'ru': return item.russian || item.english;
                case 'es': return item.spanish || item.english;
                default: return item.english;
            }
        };

        // Create TOP cards (user language)
        const newTopCards: Card[] = itemsData.map((item) => ({
            id: `${item.id}-user`,
            content: getUserContent(item),
            language: 'user',
            pairId: item.id,
            isFlipped: gameMode === 'split', // Always visible in split mode
            isMatched: false,
        }));

        // Create BOTTOM cards (Greek)
        const newBottomCards: Card[] = itemsData.map((item) => ({
            id: `${item.id}-greek`,
            content: item.greek,
            language: 'greek',
            pairId: item.id,
            isFlipped: gameMode === 'split', // Always visible in split mode
            isMatched: false,
            audioUrl: item.audio_url,
        }));

        // Shuffle both grids independently
        const shuffledTop = newTopCards.sort(() => Math.random() - 0.5);
        const shuffledBottom = newBottomCards.sort(() => Math.random() - 0.5);

        setTopCards(shuffledTop);
        setBottomCards(shuffledBottom);
    };

    /**
     * Get grid columns based on pair count
     */
    const getGridColumns = (): number => {
        switch (pairCount) {
            case 6: return 3; // 3×2 grid
            case 8: return 4; // 4×2 grid
            case 12: return 4; // 4×3 grid
            default: return 4;
        }
    };

    /**
     * Play audio for Greek card
     */
    const playAudio = (audioUrl?: string) => {
        if (!audioUrl || isMuted) return;

        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play().catch(err => console.log('[Audio] Playback failed:', err));
        } catch (err) {
            console.log('[Audio] Error:', err);
        }
    };

    /**
     * Handle card click
     */
    const handleCardClick = (cardId: string, grid: 'top' | 'bottom') => {
        // Ignore if game over
        if (gameOver) return;

        const cards = grid === 'top' ? topCards : bottomCards;
        const card = cards.find(c => c.id === cardId);
        if (!card || card.isMatched) return;

        // In flip mode, flip the card first
        if (gameMode === 'flip' && !card.isFlipped) {
            if (grid === 'top') {
                setTopCards(prev => prev.map(c =>
                    c.id === cardId ? { ...c, isFlipped: true } : c
                ));
            } else {
                setBottomCards(prev => prev.map(c =>
                    c.id === cardId ? { ...c, isFlipped: true } : c
                ));
                // Play audio when Greek card is flipped
                playAudio(card.audioUrl);
            }
        }

        // Set selection
        if (grid === 'top') {
            setSelectedTop(cardId);
        } else {
            setSelectedBottom(cardId);
            // Play audio when Greek card is selected (split mode)
            if (gameMode === 'split') {
                playAudio(card.audioUrl);
            }
        }
    };

    /**
     * Check if selected pair matches
     */
    useEffect(() => {
        if (!selectedTop || !selectedBottom) return;

        const topCard = topCards.find(c => c.id === selectedTop);
        const bottomCard = bottomCards.find(c => c.id === selectedBottom);

        if (!topCard || !bottomCard) return;

        // Check match
        setTimeout(() => {
            if (topCard.pairId === bottomCard.pairId) {
                // MATCH!
                setMatched(prev => [...prev, selectedTop, selectedBottom]);
                setTopCards(prev => prev.map(c =>
                    c.id === selectedTop ? { ...c, isMatched: true } : c
                ));
                setBottomCards(prev => prev.map(c =>
                    c.id === selectedBottom ? { ...c, isMatched: true } : c
                ));

                // Play audio on match
                playAudio(bottomCard.audioUrl);
            } else {
                // NO MATCH
                setMistakes(prev => prev + 1);
                setScore(prev => Math.max(0, prev - 10));

                // In flip mode, flip cards back
                if (gameMode === 'flip') {
                    setTopCards(prev => prev.map(c =>
                        c.id === selectedTop ? { ...c, isFlipped: false } : c
                    ));
                    setBottomCards(prev => prev.map(c =>
                        c.id === selectedBottom ? { ...c, isFlipped: false } : c
                    ));
                }
            }

            // Clear selections
            setSelectedTop(null);
            setSelectedBottom(null);
        }, 600);
    }, [selectedTop, selectedBottom]);

    /**
     * Show solution for selected card
     */
    const showSolution = () => {
        if (!selectedTop && !selectedBottom) return;
        if (gameOver) return;

        // Apply penalty
        setScore(prev => Math.max(0, prev - 10));

        // Find the selected card's pair
        if (selectedTop) {
            const topCard = topCards.find(c => c.id === selectedTop);
            if (!topCard || topCard.isMatched) return;

            const bottomCard = bottomCards.find(c => c.pairId === topCard.pairId);
            if (!bottomCard) return;

            // Flip bottom card if in flip mode
            if (gameMode === 'flip' && !bottomCard.isFlipped) {
                setBottomCards(prev => prev.map(c =>
                    c.id === bottomCard.id ? { ...c, isFlipped: true } : c
                ));
            }

            // Mark as matched
            setMatched(prev => [...prev, topCard.id, bottomCard.id]);
            setTopCards(prev => prev.map(c =>
                c.id === topCard.id ? { ...c, isMatched: true } : c
            ));
            setBottomCards(prev => prev.map(c =>
                c.id === bottomCard.id ? { ...c, isMatched: true } : c
            ));

            // Play audio
            playAudio(bottomCard.audioUrl);

            // Clear selection
            setSelectedTop(null);
        } else if (selectedBottom) {
            const bottomCard = bottomCards.find(c => c.id === selectedBottom);
            if (!bottomCard || bottomCard.isMatched) return;

            const topCard = topCards.find(c => c.pairId === bottomCard.pairId);
            if (!topCard) return;

            // Flip top card if in flip mode
            if (gameMode === 'flip' && !topCard.isFlipped) {
                setTopCards(prev => prev.map(c =>
                    c.id === topCard.id ? { ...c, isFlipped: true } : c
                ));
            }

            // Mark as matched
            setMatched(prev => [...prev, topCard.id, bottomCard.id]);
            setTopCards(prev => prev.map(c =>
                c.id === topCard.id ? { ...c, isMatched: true } : c
            ));
            setBottomCards(prev => prev.map(c =>
                c.id === bottomCard.id ? { ...c, isMatched: true } : c
            ));

            // Play audio
            playAudio(bottomCard.audioUrl);

            // Clear selection
            setSelectedBottom(null);
        }
    };

    /**
     * Reset game
     */
    const resetGame = () => {
        setSelectedTop(null);
        setSelectedBottom(null);
        setMatched([]);
        setMistakes(0);
        setScore(100);
        setElapsedTime(0);
        setGameOver(false);
        setStartTime(Date.now());

        if (items.length > 0) {
            initializeCards(items);
        }
    };

    /**
     * Change game mode
     */
    const handleModeChange = (mode: GameMode) => {
        setGameMode(mode);
        // Reset and reinitialize
        setSelectedTop(null);
        setSelectedBottom(null);
        setMatched([]);
        setMistakes(0);
        setScore(100);
        setElapsedTime(0);
        setGameOver(false);
        setStartTime(Date.now());

        if (items.length > 0) {
            initializeCards(items);
        }
    };

    /**
     * Change pair count
     */
    const handlePairCountChange = (count: PairCount) => {
        setPairCount(count);
        // loadItems will be triggered by useEffect
        setSelectedTop(null);
        setSelectedBottom(null);
        setMatched([]);
        setMistakes(0);
        setScore(100);
        setElapsedTime(0);
        setGameOver(false);
    };

    /**
     * Render card component
     */
    const renderCard = (card: Card, grid: 'top' | 'bottom') => {
        const isSelected = grid === 'top'
            ? selectedTop === card.id
            : selectedBottom === card.id;

        const showContent = gameMode === 'split' || card.isFlipped || card.isMatched;

        return (
            <button
                key={card.id}
                onClick={() => handleCardClick(card.id, grid)}
                disabled={card.isMatched || (grid === 'top' ? !!selectedTop : !!selectedBottom)}
                className={`
                    relative aspect-[4/3] rounded-xl transition-all duration-300 transform
                    ${!card.isMatched && 'hover:scale-105'}
                    ${isSelected && 'ring-4 ring-yellow-400 scale-105'}
                    disabled:hover:scale-100
                `}
                style={{
                    perspective: '1000px',
                }}
            >
                {/* Card Inner */}
                <div
                    className={`
                        relative w-full h-full transition-transform duration-500
                        ${gameMode === 'flip' && (card.isFlipped || card.isMatched) ? 'rotate-y-180' : ''}
                    `}
                    style={{
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* Front (Hidden in flip mode) */}
                    {gameMode === 'flip' && (
                        <div
                            className={`
                                absolute inset-0 flex items-center justify-center rounded-xl shadow-lg
                                ${card.isMatched
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                    : grid === 'top'
                                        ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600'
                                        : 'bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600'
                                }
                            `}
                            style={{
                                backfaceVisibility: 'hidden',
                            }}
                        >
                            <span className="text-4xl">
                                {card.isMatched ? '✓' : grid === 'top' ? '🌍' : '🇬🇷'}
                            </span>
                        </div>
                    )}

                    {/* Back (Revealed) or Split Mode Content */}
                    <div
                        className={`
                            absolute inset-0 flex items-center justify-center rounded-xl shadow-lg p-4
                            ${gameMode === 'flip' ? 'bg-white rotate-y-180' :
                                card.isMatched ? 'bg-green-100 border-2 border-green-400' :
                                isSelected ? 'bg-yellow-100 border-2 border-yellow-400' :
                                'bg-white border-2 border-gray-200'
                            }
                        `}
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: gameMode === 'flip' ? 'rotateY(180deg)' : 'none',
                        }}
                    >
                        {showContent && (
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-lg font-semibold text-gray-800 text-center leading-tight">
                                    {card.content}
                                </span>
                                {card.audioUrl && grid === 'bottom' && gameMode === 'split' && (
                                    <Volume2 className="h-4 w-4 text-purple-500" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </button>
        );
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
                    <h1 className="text-2xl font-bold text-white">Loading Memory Split...</h1>
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
                                <span className="text-3xl">🧩</span>
                                <span>Memory Split</span>
                            </h1>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Mute Toggle */}
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/90 transition-all"
                                title={isMuted ? "Unmute Audio" : "Mute Audio"}
                            >
                                {isMuted ? (
                                    <VolumeX className="h-5 w-5 text-red-400" />
                                ) : (
                                    <Volume2 className="h-5 w-5" />
                                )}
                            </button>

                            {/* Reset */}
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
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Settings Bar */}
                <div className="mb-6 flex items-center justify-center gap-8 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                    {/* Mode Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-white/70">Game Mode:</label>
                        <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="split"
                                    checked={gameMode === 'split'}
                                    onChange={(e) => handleModeChange(e.target.value as GameMode)}
                                    className="w-4 h-4"
                                />
                                <span className="text-white text-sm">Split (Always Visible)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="flip"
                                    checked={gameMode === 'flip'}
                                    onChange={(e) => handleModeChange(e.target.value as GameMode)}
                                    className="w-4 h-4"
                                />
                                <span className="text-white text-sm">Flip (Hidden Cards)</span>
                            </label>
                        </div>
                    </div>

                    {/* Pair Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-white/70">Pairs:</label>
                        <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value={6}
                                    checked={pairCount === 6}
                                    onChange={() => handlePairCountChange(6)}
                                    className="w-4 h-4"
                                />
                                <span className="text-white text-sm">6 (3×2)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value={8}
                                    checked={pairCount === 8}
                                    onChange={() => handlePairCountChange(8)}
                                    className="w-4 h-4"
                                />
                                <span className="text-white text-sm">8 (4×2)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value={12}
                                    checked={pairCount === 12}
                                    onChange={() => handlePairCountChange(12)}
                                    className="w-4 h-4"
                                />
                                <span className="text-white text-sm">12 (4×3)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="mb-6 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <span className="text-white font-medium">{formatTime(elapsedTime)}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <Target className="h-5 w-5 text-green-400" />
                        <span className="text-white font-medium">
                            {matched.length / 2} / {pairCount} Pairs
                        </span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        <span className="text-white font-medium">Score: {score}</span>
                    </div>
                </div>

                {/* TOP Grid (User Language) */}
                <div className="mb-4">
                    <div className="text-center mb-3">
                        <span className="text-sm font-medium text-white/70 bg-blue-500/20 px-4 py-1 rounded-full border border-blue-400/30">
                            {locale === 'de' ? 'Deutsch' : locale === 'ru' ? 'Русский' : locale === 'es' ? 'Español' : 'English'}
                        </span>
                    </div>
                    <div
                        className="grid gap-3"
                        style={{
                            gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
                        }}
                    >
                        {topCards.map((card) => renderCard(card, 'top'))}
                    </div>
                </div>

                {/* Solution Button */}
                <div className="my-6 flex justify-center">
                    <button
                        onClick={showSolution}
                        disabled={!selectedTop && !selectedBottom || gameOver}
                        className="flex items-center gap-2 px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 rounded-lg text-orange-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Lightbulb className="h-5 w-5" />
                        <span>Show Solution (-10 points)</span>
                    </button>
                </div>

                {/* BOTTOM Grid (Greek) */}
                <div className="mb-6">
                    <div className="text-center mb-3">
                        <span className="text-sm font-medium text-white/70 bg-purple-500/20 px-4 py-1 rounded-full border border-purple-400/30">
                            🇬🇷 Νεοελληνικά
                        </span>
                    </div>
                    <div
                        className="grid gap-3"
                        style={{
                            gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
                        }}
                    >
                        {bottomCards.map((card) => renderCard(card, 'bottom'))}
                    </div>
                </div>

                {/* Game Over Modal */}
                {gameOver && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🎉</div>
                                <h2 className="text-3xl font-bold text-white mb-4">
                                    Excellent!
                                </h2>
                                <p className="text-white/70 mb-6">
                                    You completed the memory split game!
                                </p>

                                {/* Stats */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                                        <span className="text-white/70">Time:</span>
                                        <span className="text-white font-semibold">{formatTime(elapsedTime)}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                                        <span className="text-white/70">Score:</span>
                                        <span className="text-white font-semibold">{score}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg">
                                        <span className="text-white/70">Mistakes:</span>
                                        <span className="text-white font-semibold">{mistakes}</span>
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
                            <span><strong>Split Mode:</strong> All cards visible - match pairs by clicking one from each grid</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span><strong>Flip Mode:</strong> Cards hidden - flip to reveal, then match pairs</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>Select a card from the TOP grid (your language) and one from BOTTOM grid (Greek)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>Use "Show Solution" button if stuck (-10 points penalty)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>Match all pairs with highest score and fastest time!</span>
                        </li>
                    </ul>
                </div>
            </main>

            {/* CSS for 3D Transform */}
            <style jsx>{`
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
            `}</style>
        </div>
    );
}
