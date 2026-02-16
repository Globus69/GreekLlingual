/**
 * Write Input Practice Component
 *
 * Text input with fuzzy matching for Greek answers
 * - Display English prompt
 * - Text input for Greek answer
 * - Levenshtein distance matching (strict/lenient)
 * - Attempt tracking with max attempts
 * - Score calculation based on attempts
 * - Optional phonetic hint
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, HelpCircle, AlertCircle } from 'lucide-react';
import { compareGreekAnswers } from '@/lib/utils/levenshtein';

interface WriteInputPracticeProps {
    item: {
        id: string;
        english: string;
        greek: string;
        phonetic?: string;
    };
    config: {
        tolerance: 'strict' | 'lenient';
        show_phonetic: boolean;
        max_attempts: number;
    };
    onComplete: (success: boolean, score: number, timeSeconds: number, mistakes: number) => void;
}

type FeedbackType = 'none' | 'correct' | 'close' | 'incorrect';

export function WriteInputPractice({ item, config, onComplete }: WriteInputPracticeProps) {
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [attempts, setAttempts] = useState<number>(0);
    const [feedback, setFeedback] = useState<FeedbackType>('none');
    const [showHint, setShowHint] = useState<boolean>(false);
    const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
    const [startTime] = useState<number>(Date.now());
    const [gameOver, setGameOver] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    /**
     * Handle answer submission
     */
    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (gameOver || userAnswer.trim() === '') return;

        const trimmedAnswer = userAnswer.trim();
        const correctAnswer = item.greek.trim();

        // Check answer with Levenshtein matching
        const comparison = compareGreekAnswers(
            trimmedAnswer,
            correctAnswer,
            config.tolerance === 'strict'
        );

        console.log('📝 Answer Check:', {
            user: trimmedAnswer,
            correct: correctAnswer,
            exact: comparison.exact,
            close: comparison.close,
            similarity: comparison.similarity,
            distance: comparison.distance,
        });

        // Increment attempts
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        // Exact match - success!
        if (comparison.exact) {
            setFeedback('correct');
            setTimeout(() => {
                handlePracticeComplete(true, newAttempts);
            }, 1500);
            return;
        }

        // Close match (lenient mode only)
        if (config.tolerance === 'lenient' && comparison.close) {
            setFeedback('close');
            // Allow to try again but give feedback
            setTimeout(() => {
                setFeedback('none');
            }, 2000);
            return;
        }

        // Incorrect
        setFeedback('incorrect');

        // Check if max attempts reached
        if (newAttempts >= config.max_attempts) {
            setShowCorrectAnswer(true);
            setTimeout(() => {
                handlePracticeComplete(false, newAttempts);
            }, 3000);
        } else {
            // Allow retry
            setTimeout(() => {
                setFeedback('none');
                setUserAnswer('');
                inputRef.current?.focus();
            }, 1500);
        }
    };

    /**
     * Calculate score based on attempts and correctness
     * Perfect on first try: 100
     * Second try: 80
     * Third try: 60
     * Failed: 0
     */
    const calculateScore = (attempts: number, correct: boolean): number => {
        if (!correct) return 0;

        const maxScore = 100;
        const maxAttempts = config.max_attempts;

        // Penalty increases with each attempt
        const penalty = ((attempts - 1) / maxAttempts) * 40;

        return Math.max(0, Math.round(maxScore - penalty));
    };

    /**
     * Handle practice completion
     */
    const handlePracticeComplete = (correct: boolean, finalAttempts: number) => {
        setGameOver(true);
        const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
        const score = calculateScore(finalAttempts, correct);
        const mistakes = finalAttempts - 1; // First attempt is not a mistake

        onComplete(correct, score, timeSeconds, mistakes);
    };

    /**
     * Get feedback message
     */
    const getFeedbackContent = () => {
        switch (feedback) {
            case 'correct':
                return {
                    message: 'Correct! Excellent!',
                    icon: <Check className="h-5 w-5" />,
                    className: 'bg-green-500/20 text-green-600 border-green-500/30',
                };
            case 'close':
                return {
                    message: 'Very close! Check your spelling.',
                    icon: <AlertCircle className="h-5 w-5" />,
                    className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
                };
            case 'incorrect':
                return {
                    message: `Incorrect. Try again! (Attempt ${attempts} / ${config.max_attempts})`,
                    icon: <X className="h-5 w-5" />,
                    className: 'bg-red-500/20 text-red-600 border-red-500/30',
                };
            default:
                return null;
        }
    };

    const feedbackContent = getFeedbackContent();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-accent/20 rounded-lg border border-border/30">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        Attempt: {attempts} / {config.max_attempts}
                    </span>
                </div>

                {config.show_phonetic && item.phonetic && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHint(!showHint)}
                        className="gap-2"
                    >
                        <HelpCircle className="h-4 w-4" />
                        {showHint ? 'Hide' : 'Show'} Hint
                    </Button>
                )}
            </div>

            {/* Instruction */}
            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Type the Greek translation:</p>
                <h3 className="text-2xl font-bold">{item.english}</h3>

                {showHint && item.phonetic && (
                    <p className="text-sm text-muted-foreground italic">
                        Pronunciation: {item.phonetic}
                    </p>
                )}

                {config.tolerance === 'lenient' && (
                    <p className="text-xs text-muted-foreground">
                        (Close matches will be accepted)
                    </p>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type Greek answer here..."
                        disabled={gameOver}
                        className="text-lg font-sans text-center py-6"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                        Press Enter to submit
                    </p>
                </div>

                <Button
                    type="submit"
                    disabled={gameOver || userAnswer.trim() === ''}
                    className="w-full"
                    size="lg"
                >
                    Submit Answer
                </Button>
            </form>

            {/* Feedback */}
            {feedbackContent && (
                <div
                    className={`
                        text-center py-3 px-4 rounded-lg font-medium border
                        ${feedbackContent.className}
                        animate-in fade-in slide-in-from-top-2 duration-300
                    `}
                >
                    <span className="flex items-center justify-center gap-2">
                        {feedbackContent.icon}
                        {feedbackContent.message}
                    </span>
                </div>
            )}

            {/* Show Correct Answer (after max attempts) */}
            {showCorrectAnswer && (
                <div className="text-center py-4 px-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-muted-foreground mb-2">The correct answer was:</p>
                    <p className="text-2xl font-bold font-sans text-blue-600">{item.greek}</p>
                    {item.phonetic && (
                        <p className="text-sm text-muted-foreground italic mt-1">
                            ({item.phonetic})
                        </p>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="space-y-1 text-center text-xs text-muted-foreground">
                <p>💡 Tip: Make sure you're using Greek keyboard or copy-paste</p>
                {config.tolerance === 'strict' && (
                    <p>⚠️ Strict mode: Accents and exact spelling required</p>
                )}
            </div>
        </div>
    );
}
