/**
 * Memory Game Test Page
 *
 * Standalone test page for Memory Game component
 * - Mock data for testing
 * - Desktop + Mobile preview
 * - Toggle language direction
 */

'use client';

import { useState } from 'react';
import { MemoryGame } from '@/components/learning/practice-modes/memory-game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Smartphone, Monitor } from 'lucide-react';
import Link from 'next/link';

export default function TestMemoryPage() {
    const [showGreekFirst, setShowGreekFirst] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [key, setKey] = useState(0);

    // Mock memory cards (6 pairs = 12 cards)
    const mockCards = [
        // Pair 1
        { id: 'greek-1', content: 'Γεια σου', language: 'greek' as const, pairId: 'pair-1' },
        { id: 'user-1', content: 'Hello', language: 'user' as const, pairId: 'pair-1' },
        // Pair 2
        {
            id: 'greek-2',
            content: 'Ευχαριστώ',
            language: 'greek' as const,
            pairId: 'pair-2',
        },
        { id: 'user-2', content: 'Thank you', language: 'user' as const, pairId: 'pair-2' },
        // Pair 3
        { id: 'greek-3', content: 'Παρακαλώ', language: 'greek' as const, pairId: 'pair-3' },
        { id: 'user-3', content: 'Please', language: 'user' as const, pairId: 'pair-3' },
        // Pair 4
        { id: 'greek-4', content: 'Καλημέρα', language: 'greek' as const, pairId: 'pair-4' },
        { id: 'user-4', content: 'Good morning', language: 'user' as const, pairId: 'pair-4' },
        // Pair 5
        { id: 'greek-5', content: 'Συγγνώμη', language: 'greek' as const, pairId: 'pair-5' },
        { id: 'user-5', content: 'Sorry', language: 'user' as const, pairId: 'pair-5' },
        // Pair 6
        { id: 'greek-6', content: 'Αντίο', language: 'greek' as const, pairId: 'pair-6' },
        { id: 'user-6', content: 'Goodbye', language: 'user' as const, pairId: 'pair-6' },
    ];

    // Shuffle cards
    const shuffledCards = [...mockCards].sort(() => Math.random() - 0.5);

    const handleComplete = (stats: { attempts: number; matches: number; time: number }) => {
        console.log('Game completed!', stats);
        alert(
            `Game Complete!\n\nMatches: ${stats.matches}\nAttempts: ${stats.attempts}\nTime: ${stats.time}s`
        );
    };

    const resetGame = () => {
        setKey((prev) => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Back Button */}
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back</span>
                        </Link>

                        {/* Title */}
                        <div className="text-center flex-1">
                            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                                <span className="text-3xl">🧠</span>
                                <span>Memory Game Test</span>
                            </h1>
                            <p className="text-sm text-white/60 mt-1">
                                Testing Memory Game Component
                            </p>
                        </div>

                        {/* Placeholder */}
                        <div className="w-24"></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Controls */}
                <div className="mb-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Test Controls</h2>
                    <div className="flex flex-wrap gap-4">
                        {/* Language Toggle */}
                        <Button
                            onClick={() => setShowGreekFirst(!showGreekFirst)}
                            variant="outline"
                            className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                        >
                            {showGreekFirst ? '🇬🇷 Greek First' : '🇬🇧 English First'}
                        </Button>

                        {/* Mobile Toggle */}
                        <Button
                            onClick={() => setIsMobile(!isMobile)}
                            variant="outline"
                            className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                        >
                            {isMobile ? (
                                <>
                                    <Smartphone className="h-4 w-4" />
                                    Mobile View
                                </>
                            ) : (
                                <>
                                    <Monitor className="h-4 w-4" />
                                    Desktop View
                                </>
                            )}
                        </Button>

                        {/* Reset */}
                        <Button
                            onClick={resetGame}
                            variant="outline"
                            className="gap-2 bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                        >
                            Reset Game
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-sm text-white/70">
                            <strong>Features:</strong> Flip animation (Framer Motion) • Match
                            detection • Sound effects • Confetti • Animated removal • Stats
                            tracking
                        </p>
                    </div>
                </div>

                {/* Game Container */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <MemoryGame
                        key={key}
                        cards={shuffledCards}
                        showGreekFirst={showGreekFirst}
                        onComplete={handleComplete}
                        isMobile={isMobile}
                    />
                </div>

                {/* Instructions */}
                <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                    <h3 className="text-lg font-semibold text-white mb-3">How to Test</h3>
                    <ul className="text-sm text-white/70 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">1.</span>
                            <span>
                                Click cards to flip them over and reveal their content
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">2.</span>
                            <span>
                                Find matching pairs (Greek word + English translation)
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">3.</span>
                            <span>
                                When matched, cards will show confetti + sound effect
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">4.</span>
                            <span>Toggle language direction to change card visibility</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">5.</span>
                            <span>
                                Test mobile view to see responsive grid (3 columns)
                            </span>
                        </li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
