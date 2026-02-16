/**
 * Practice Result Summary Component
 *
 * Displays practice session results
 * - Score with progress bar
 * - Time taken (MM:SS format)
 * - FSRS Rating with color-coded chip
 * - Mistakes count
 * - Retry/Close buttons
 */

'use client';

import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Clock, Target, AlertCircle, RotateCcw, X } from 'lucide-react';
import type { Rating } from '@/lib/fsrs/fsrs-types';
import type { PracticeMode } from '@/lib/validation/schemas';

interface PracticeResultSummaryProps {
    result: {
        success: boolean;
        score: number;
        timeSeconds: number;
        mistakes: number;
        fsrsRating: Rating;
    };
    item: {
        english: string;
        greek: string;
    };
    modeType: PracticeMode;
    onRetry: () => void;
    onClose: () => void;
}

export function PracticeResultSummary({
    result,
    item,
    modeType,
    onRetry,
    onClose,
}: PracticeResultSummaryProps) {
    /**
     * Format time as MM:SS
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Get FSRS rating label and color
     */
    const getRatingInfo = (rating: Rating) => {
        switch (rating) {
            case 4:
                return {
                    label: 'Easy',
                    color: 'bg-green-500/20 text-green-600 border-green-500',
                    emoji: '😄',
                };
            case 3:
                return {
                    label: 'Good',
                    color: 'bg-blue-500/20 text-blue-600 border-blue-500',
                    emoji: '🙂',
                };
            case 2:
                return {
                    label: 'Hard',
                    color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500',
                    emoji: '😐',
                };
            case 1:
                return {
                    label: 'Again',
                    color: 'bg-red-500/20 text-red-600 border-red-500',
                    emoji: '😕',
                };
            default:
                return {
                    label: 'Unknown',
                    color: 'bg-gray-500/20 text-gray-600 border-gray-500',
                    emoji: '❓',
                };
        }
    };

    /**
     * Get score color based on percentage
     */
    const getScoreColor = (score: number): string => {
        if (score >= 85) return 'text-green-500';
        if (score >= 65) return 'text-blue-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    /**
     * Get mode title
     */
    const getModeTitle = (mode: PracticeMode): string => {
        switch (mode) {
            case 'matching':
                return 'Matching Game';
            case 'multiple_choice':
                return 'Multiple Choice';
            case 'write_input':
                return 'Write It Out';
            default:
                return 'Practice';
        }
    };

    const ratingInfo = getRatingInfo(result.fsrsRating);
    const scoreColor = getScoreColor(result.score);

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Practice Complete!
                    </div>
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-6">
                {/* Mode & Item Info */}
                <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">{getModeTitle(modeType)}</p>
                    <p className="text-lg font-medium">
                        {item.english} → <span className="font-sans">{item.greek}</span>
                    </p>
                </div>

                {/* Score */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Your Score</span>
                        <span className={`text-3xl font-bold ${scoreColor}`}>
                            {result.score}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 bg-accent/30 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-out ${
                                result.score >= 85
                                    ? 'bg-green-500'
                                    : result.score >= 65
                                    ? 'bg-blue-500'
                                    : result.score >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${result.score}%` }}
                        />
                    </div>

                    {/* Pass/Fail Message */}
                    {result.success ? (
                        <p className="text-center text-sm text-green-600 font-medium">
                            ✓ Passed! Great job!
                        </p>
                    ) : (
                        <p className="text-center text-sm text-red-600 font-medium">
                            ✗ Keep practicing! You'll get it next time.
                        </p>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Time Taken */}
                    <div className="text-center p-4 bg-accent/20 rounded-lg border border-border/30">
                        <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mb-1">Time Taken</p>
                        <p className="text-lg font-bold font-mono">
                            {formatTime(result.timeSeconds)}
                        </p>
                    </div>

                    {/* FSRS Rating */}
                    <div className="text-center p-4 bg-accent/20 rounded-lg border border-border/30">
                        <Target className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mb-1">FSRS Rating</p>
                        <div
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${ratingInfo.color}`}
                        >
                            <span>{ratingInfo.emoji}</span>
                            <span>{ratingInfo.label}</span>
                        </div>
                    </div>

                    {/* Mistakes */}
                    <div className="text-center p-4 bg-accent/20 rounded-lg border border-border/30">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mb-1">Mistakes</p>
                        <p className="text-lg font-bold">{result.mistakes}</p>
                    </div>
                </div>

                {/* FSRS Explanation */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-center text-muted-foreground">
                        Your FSRS rating affects when you'll see this item again in spaced
                        repetition
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onRetry}
                        className="flex-1 gap-2"
                        size="lg"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Try Again
                    </Button>
                    <Button onClick={onClose} className="flex-1 gap-2" size="lg">
                        <X className="h-4 w-4" />
                        Close
                    </Button>
                </div>
            </div>
        </>
    );
}
