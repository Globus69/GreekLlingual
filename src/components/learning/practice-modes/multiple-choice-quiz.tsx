/**
 * Multiple Choice Quiz Component
 *
 * Timed quiz with 4 options (1 correct + 3 distractors)
 * - Display English question → Greek answer
 * - Timer countdown
 * - Instant feedback (correct/wrong)
 * - Binary scoring (100% or 0%)
 * - Optional phonetic hint
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, HelpCircle } from 'lucide-react';

interface MultipleChoiceQuizProps {
    item: {
        id: string;
        english: string;
        greek: string;
        phonetic?: string;
    };
    config: {
        num_options: number;
        time_limit_sec: number;
        show_hint: boolean;
    };
    onComplete: (success: boolean, score: number, timeSeconds: number, mistakes: number) => void;
}

interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}

export function MultipleChoiceQuiz({ item, config, onComplete }: MultipleChoiceQuizProps) {
    const [options, setOptions] = useState<Option[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState<boolean>(false);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [startTime] = useState<number>(Date.now());
    const [timeRemaining, setTimeRemaining] = useState<number>(config.time_limit_sec);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [showHint, setShowHint] = useState<boolean>(false);

    // Initialize options
    useEffect(() => {
        initializeOptions();
    }, [item, config.num_options]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0 || gameOver) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, gameOver]);

    /**
     * Initialize quiz options
     * 1 correct + (num_options - 1) distractors
     */
    const initializeOptions = () => {
        const opts: Option[] = [];

        // Add correct answer
        opts.push({
            id: 'correct',
            text: item.greek,
            isCorrect: true,
        });

        // Generate distractors
        // For MVP, create mock distractors
        // In real implementation, fetch from same level/difficulty
        const distractors = generateDistractors(config.num_options - 1);
        opts.push(...distractors);

        // Shuffle options
        const shuffled = opts.sort(() => Math.random() - 0.5);
        setOptions(shuffled);
    };

    /**
     * Generate mock distractors
     * In real implementation, fetch similar words from database
     */
    const generateDistractors = (count: number): Option[] => {
        const mockDistractors = [
            'Γεια σου',
            'Ευχαριστώ',
            'Παρακαλώ',
            'Συγγνώμη',
            'Καλημέρα',
            'Καληνύχτα',
            'Αντίο',
            'Ναι',
            'Όχι',
        ];

        // Filter out the correct answer
        const filtered = mockDistractors.filter((d) => d !== item.greek);

        // Shuffle and take required count
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, count);

        return selected.map((text, idx) => ({
            id: `distractor-${idx}`,
            text,
            isCorrect: false,
        }));
    };

    /**
     * Handle option selection
     */
    const handleOptionSelect = (optionId: string) => {
        if (showFeedback || gameOver) return;

        const option = options.find((o) => o.id === optionId);
        if (!option) return;

        setSelectedOption(optionId);
        setIsCorrect(option.isCorrect);
        setShowFeedback(true);

        // Auto-complete after showing feedback
        setTimeout(() => {
            handleQuizComplete(option.isCorrect);
        }, 1500);
    };

    /**
     * Handle quiz completion
     */
    const handleQuizComplete = (correct: boolean) => {
        setGameOver(true);
        const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
        const score = correct ? 100 : 0;
        const mistakes = correct ? 0 : 1;

        onComplete(correct, score, timeSeconds, mistakes);
    };

    /**
     * Handle timeout
     */
    const handleTimeout = () => {
        if (gameOver) return;

        setGameOver(true);
        const timeSeconds = config.time_limit_sec;

        onComplete(false, 0, timeSeconds, 1);
    };

    /**
     * Format time as MM:SS
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Get option button style
     */
    const getOptionStyle = (option: Option): string => {
        const isSelected = selectedOption === option.id;

        if (!showFeedback) {
            return isSelected
                ? 'bg-blue-500/20 border-blue-500'
                : 'bg-card border-border hover:border-primary hover:scale-[1.02]';
        }

        // Show feedback
        if (option.isCorrect) {
            return 'bg-green-500/20 border-green-500';
        }

        if (isSelected && !option.isCorrect) {
            return 'bg-red-500/20 border-red-500';
        }

        return 'bg-card border-border opacity-60';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-accent/20 rounded-lg border border-border/30">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span
                        className={`text-sm font-mono font-medium ${
                            timeRemaining < 10 ? 'text-red-500 animate-pulse' : ''
                        }`}
                    >
                        {formatTime(timeRemaining)}
                    </span>
                </div>

                {config.show_hint && item.phonetic && (
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

            {/* Question */}
            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                    Select the correct Greek translation:
                </p>
                <h3 className="text-2xl font-bold">{item.english}</h3>

                {showHint && item.phonetic && (
                    <p className="text-sm text-muted-foreground italic">
                        Pronunciation: {item.phonetic}
                    </p>
                )}
            </div>

            {/* Options */}
            <div className="space-y-3">
                {options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const style = getOptionStyle(option);

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleOptionSelect(option.id)}
                            disabled={showFeedback || gameOver}
                            className={`
                                w-full p-4 rounded-lg border-2 transition-all duration-300
                                flex items-center justify-between
                                ${style}
                                ${showFeedback ? 'cursor-default' : 'active:scale-[0.98]'}
                            `}
                        >
                            <span className="text-lg font-medium font-sans">{option.text}</span>

                            {showFeedback && (
                                <div>
                                    {option.isCorrect ? (
                                        <Check className="h-5 w-5 text-green-500" />
                                    ) : (
                                        isSelected && <X className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Feedback Message */}
            {showFeedback && (
                <div
                    className={`
                        text-center py-3 px-4 rounded-lg font-medium
                        ${
                            isCorrect
                                ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                                : 'bg-red-500/20 text-red-600 border border-red-500/30'
                        }
                    `}
                >
                    {isCorrect ? (
                        <span className="flex items-center justify-center gap-2">
                            <Check className="h-5 w-5" />
                            Correct! Well done!
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <X className="h-5 w-5" />
                            Incorrect. The correct answer was: {item.greek}
                        </span>
                    )}
                </div>
            )}

            {/* Instructions */}
            <p className="text-center text-xs text-muted-foreground">
                {!showFeedback && 'Click an option to submit your answer'}
            </p>
        </div>
    );
}
