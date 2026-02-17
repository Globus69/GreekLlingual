/**
 * Practice Modes - Standalone Page
 *
 * Quizlet-style practice games for vocabulary and grammar
 * - Matching Game
 * - Multiple Choice Quiz
 * - Write Input Practice
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { PracticeModesSection } from '@/components/dashboard/practice-modes-section';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PracticeModesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
                <div className="text-center">
                    <div className="text-4xl mb-4">🎮</div>
                    <h1 className="text-2xl font-bold text-white">Loading Practice Modes...</h1>
                </div>
            </div>
        );
    }

    // Redirect if no user
    if (!user) {
        return null;
    }

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
                            <span className="font-medium">Back to Dashboard</span>
                        </Link>

                        {/* Title */}
                        <div className="text-center flex-1">
                            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                                <span className="text-3xl">🎮</span>
                                <span>Practice Modes</span>
                            </h1>
                            <p className="text-sm text-white/60 mt-1">
                                Master Greek with interactive games
                            </p>
                        </div>

                        {/* User Info */}
                        <div className="text-right">
                            <p className="text-sm font-medium text-white">{user.name}</p>
                            <p className="text-xs text-white/60">{user.level || 'A1'}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Info Card */}
                <div className="mb-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">💡</div>
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-2">
                                How Practice Modes Work
                            </h2>
                            <ul className="text-sm text-white/70 space-y-2">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    Practice modes unlock after completing flashcard reviews
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    Each game type helps reinforce different skills
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    Your performance updates your FSRS spaced repetition schedule
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Memory Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Memory Game (Classic) */}
                    <Link
                        href="/practice-modes/memory"
                        className="block p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-2 border-purple-400/30 rounded-2xl hover:border-purple-400/50 transition-all group"
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">🎮</div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                                        Memory Game
                                    </h3>
                                    <p className="text-sm text-white/70">
                                        Classic flip & match
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-purple-300">
                                <span className="text-sm font-medium">4×4 Grid • Single Grid</span>
                                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>

                    {/* Memory Split (NEW) */}
                    <Link
                        href="/practice-modes/memory-split"
                        className="block p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-2 border-blue-400/30 rounded-2xl hover:border-blue-400/50 transition-all group"
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">🧩</div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                                        Memory Split
                                    </h3>
                                    <p className="text-sm text-white/70">
                                        Two grids • Split/Flip mode
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-blue-300">
                                <span className="text-sm font-medium">6/8/12 Pairs • Desktop</span>
                                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Practice Modes Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <PracticeModesSection />
                </div>

                {/* Footer Help */}
                <div className="mt-8 text-center text-sm text-white/50">
                    <p>Practice modes help reinforce your learning with interactive games</p>
                </div>
            </main>
        </div>
    );
}
