/**
 * Practice Mode Dialog
 *
 * Main wrapper for practice mode sessions
 * - Loads practice config and learning item
 * - Manages session timing and state
 * - Renders appropriate game component based on mode type
 * - Converts scores to FSRS ratings
 * - Records attempts and updates FSRS progress
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { supabase } from '@/db/supabase';
import {
    getPracticeConfig,
    recordPracticeAttempt,
} from '@/lib/supabase/content';
import { FSRSScheduler } from '@/lib/fsrs/fsrs-scheduler';
import type { Card, Rating } from '@/lib/fsrs/fsrs-types';
import type { PracticeMode } from '@/lib/validation/schemas';
import { MatchingGame } from './matching-game';
import { MultipleChoiceQuiz } from './multiple-choice-quiz';
import { WriteInputPractice } from './write-input-practice';
import { PracticeResultSummary } from './practice-result-summary';

interface PracticeModeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    modeType: PracticeMode;
}

interface LearningItem {
    id: string;
    english: string;
    greek: string;
    phonetic?: string;
    level?: string;
    difficulty?: string;
    // FSRS fields
    fsrs_difficulty: number;
    fsrs_stability: number;
    fsrs_last_review?: string;
    fsrs_due: string;
    fsrs_reps: number;
    fsrs_lapses: number;
    fsrs_state: 'new' | 'learning' | 'review' | 'relearning';
}

interface SessionResult {
    success: boolean;
    score: number;
    timeSeconds: number;
    mistakes: number;
    fsrsRating: Rating;
}

export function PracticeModeDialog({
    isOpen,
    onClose,
    itemId,
    modeType,
}: PracticeModeDialogProps) {
    console.log('[PracticeModeDialog] Component render', { isOpen, itemId, modeType });

    // Track mount/unmount
    useEffect(() => {
        console.log('🟢 [PracticeModeDialog] MOUNTED');
        return () => {
            console.log('🔴 [PracticeModeDialog] UNMOUNTED');
        };
    }, []);

    const { user } = useAuth();
    const { success, error: showError, info } = useToast();
    const scheduler = useMemo(() => new FSRSScheduler(), []);

    const [config, setConfig] = useState<any>(null);
    const [item, setItem] = useState<LearningItem | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState<number>(0);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Track loading state with session key to prevent re-loading
    const [loadingSession, setLoadingSession] = useState<string | null>(null);
    const currentSessionKey = `${itemId}-${modeType}`;
    const isLoading = loadingSession === currentSessionKey && !item && !loadError;
    const hasLoaded = item !== null || loadError !== null;

    // Load config and item data when dialog opens
    useEffect(() => {
        if (!isOpen || !user?.id) {
            // Reset state when closing
            console.log('[PracticeModeDialog] Dialog closing, resetting state');
            setLoadingSession(null);
            setConfig(null);
            setItem(null);
            setSessionComplete(false);
            setSessionResult(null);
            setLoadError(null);
            return;
        }

        // Only load if we haven't loaded this session yet
        if (loadingSession !== currentSessionKey && !hasLoaded) {
            console.log('[PracticeModeDialog] Loading new session', currentSessionKey);
            setLoadingSession(currentSessionKey);
            loadPracticeData();
        } else {
            console.log('[PracticeModeDialog] Session already loaded or loading, skipping', { loadingSession, currentSessionKey, hasLoaded });
        }
    }, [isOpen, itemId, modeType, user?.id]);

    const loadPracticeData = async () => {
        console.log('[PracticeModeDialog] Loading started', { itemId, modeType, userId: user?.id });
        setLoadError(null);

        try {
            // Load practice config
            console.log('🔍 [Step 1] Calling getPracticeConfig...');
            const configData = await getPracticeConfig(itemId, user!.id, modeType);
            console.log('✅ [Step 1] Config loaded:', configData);

            if (!configData) {
                throw new Error('Failed to load practice configuration');
            }

            if (!configData.unlocked) {
                const remaining = configData.threshold - configData.user_reps;
                throw new Error(
                    `Practice mode locked. Complete ${remaining} more review${
                        remaining > 1 ? 's' : ''
                    } to unlock.`
                );
            }

            setConfig(configData);

            // Load learning item with FSRS data
            console.log('🔍 [Step 2] Loading learning item...');
            const { data: itemData, error: itemError } = await supabase
                .from('learning_items')
                .select('*')
                .eq('id', itemId)
                .single();
            console.log('✅ [Step 2] Item loaded:', { itemData, itemError });

            if (itemError || !itemData) {
                throw new Error('Failed to load learning item');
            }

            // Load FSRS progress
            console.log('🔍 [Step 3] Loading FSRS progress...');
            const { data: progressData, error: progressError } = await supabase
                .from('student_progress')
                .select('*')
                .eq('item_id', itemId)
                .eq('student_id', user!.id)
                .maybeSingle();
            console.log('✅ [Step 3] Progress loaded:', { progressData, progressError });

            if (progressError && progressError.code !== 'PGRST116') {
                // PGRST116 = no rows found (acceptable for new items)
                console.error('Error loading progress:', progressError);
            }

            // Merge item with FSRS data
            const mergedItem: LearningItem = {
                ...itemData,
                fsrs_difficulty: progressData?.fsrs_difficulty || 5.0,
                fsrs_stability: progressData?.fsrs_stability || 1.0,
                fsrs_last_review: progressData?.fsrs_last_review || undefined,
                fsrs_due: progressData?.fsrs_due || new Date().toISOString(),
                fsrs_reps: progressData?.fsrs_reps || 0,
                fsrs_lapses: progressData?.fsrs_lapses || 0,
                fsrs_state: progressData?.fsrs_state || 'new',
            };

            setItem(mergedItem);
            setSessionStartTime(Date.now());
            console.log('[PracticeModeDialog] Loading complete', { item: mergedItem });
        } catch (err: any) {
            console.error('[PracticeModeDialog] Load error:', err);
            setLoadError(err.message || 'Failed to load practice mode');
            showError(err.message || 'Failed to load practice mode');
        }
    };

    /**
     * Convert practice score to FSRS rating
     * Score → Rating mapping:
     * - 100% (fast) → 4 (Easy)
     * - 85-99% → 3 (Good)
     * - 65-84% → 2 (Hard)
     * - <65% → 1 (Again)
     */
    const convertScoreToRating = (
        score: number,
        timeSeconds: number,
        timeLimitSeconds: number | null,
        mistakes: number
    ): Rating => {
        // Perfect score + completed quickly = Easy
        if (
            score === 100 &&
            (timeLimitSeconds === null || timeSeconds < timeLimitSeconds * 0.7)
        ) {
            return 4;
        }

        // High score = Good
        if (score >= 85) return 3;

        // Medium score = Hard
        if (score >= 65) return 2;

        // Low score = Again
        return 1;
    };

    /**
     * Handle practice session completion
     * - Convert score to FSRS rating
     * - Record practice attempt
     * - Update FSRS progress
     */
    const handlePracticeComplete = async (
        success: boolean,
        score: number,
        timeSeconds: number,
        mistakes: number
    ) => {
        if (!item || !config || !user) {
            showError('Session data missing');
            return;
        }

        try {
            // Get time limit from config
            const difficultySettings = config.config.difficulty_settings[modeType];
            const timeLimit = difficultySettings?.time_limit_sec || null;

            // Convert score to FSRS rating
            const fsrsRating = convertScoreToRating(score, timeSeconds, timeLimit, mistakes);

            console.log(`📊 Practice Complete:
  Score: ${score}%
  Time: ${timeSeconds}s
  Mistakes: ${mistakes}
  FSRS Rating: ${fsrsRating} (${['', 'Again', 'Hard', 'Good', 'Easy'][fsrsRating]})`);

            // Record practice attempt
            const recorded = await recordPracticeAttempt(
                {
                    item_id: item.id,
                    mode_type: modeType,
                    success,
                    score,
                    time_seconds: timeSeconds,
                    mistakes,
                    fsrs_rating: fsrsRating,
                },
                user.id
            );

            if (!recorded) {
                throw new Error('Failed to record practice attempt');
            }

            // Update FSRS progress
            await updateFSRSProgress(fsrsRating);

            // Show result summary
            setSessionResult({
                success,
                score,
                timeSeconds,
                mistakes,
                fsrsRating,
            });
            setSessionComplete(true);

            info('Practice session completed!');
        } catch (err: any) {
            console.error('[PracticeModeDialog] Complete error:', err);
            showError('Failed to save practice results');
        }
    };

    /**
     * Update FSRS progress based on rating
     */
    const updateFSRSProgress = async (rating: Rating) => {
        if (!item || !user) return;

        try {
            // Create FSRS Card from current item
            const currentCard: Card = {
                id: item.id,
                difficulty: item.fsrs_difficulty,
                stability: item.fsrs_stability,
                due: new Date(item.fsrs_due),
                reps: item.fsrs_reps,
                lapses: item.fsrs_lapses,
                state: item.fsrs_state,
                lastReview: item.fsrs_last_review ? new Date(item.fsrs_last_review) : null,
            };

            // Calculate new FSRS parameters
            const now = new Date();
            const updatedCard = scheduler.rate(currentCard, rating, now);
            const intervalDays = scheduler.calculateInterval(updatedCard.stability);

            console.log(`📈 FSRS Update:
  Difficulty: ${currentCard.difficulty.toFixed(2)} → ${updatedCard.difficulty.toFixed(2)}
  Stability: ${currentCard.stability.toFixed(2)} → ${updatedCard.stability.toFixed(2)} days
  Interval: ${intervalDays.toFixed(1)} days
  State: ${currentCard.state} → ${updatedCard.state}`);

            // Call RPC to update FSRS progress
            const { error: rpcError } = await supabase.rpc('update_card_fsrs', {
                p_card_id: item.id,
                p_user_id: user.id,
                p_difficulty: updatedCard.difficulty,
                p_stability: updatedCard.stability,
                p_reps: updatedCard.reps,
                p_lapses: updatedCard.lapses,
                p_state: updatedCard.state,
                p_last_review: now.toISOString(),
                p_due: updatedCard.due.toISOString(),
                p_interval_days: intervalDays,
            });

            if (rpcError) {
                console.error('Failed to update FSRS:', rpcError);
                throw rpcError;
            }
        } catch (err) {
            console.error('[PracticeModeDialog] FSRS update error:', err);
            // Don't throw - allow session to complete even if FSRS update fails
        }
    };

    /**
     * Restart practice session
     */
    const handleRetry = () => {
        setSessionComplete(false);
        setSessionResult(null);
        setSessionStartTime(Date.now());
    };

    /**
     * Close dialog and reset state
     */
    const handleClose = () => {
        setSessionComplete(false);
        setSessionResult(null);
        setLoadError(null);
        onClose();
    };

    // Render loading state
    if (isLoading) {
        console.log('[PracticeModeDialog] Rendering loading state', { isLoading, hasLoaded, loadingSession });
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Loading Practice Mode</DialogTitle>
                        <DialogDescription className="sr-only">
                            Preparing your practice session
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-3 text-muted-foreground">Loading practice mode...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Render error state
    if (loadError) {
        console.log('[PracticeModeDialog] Rendering error state', loadError);
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <X className="h-5 w-5" />
                            Error
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            An error occurred while loading the practice mode
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <p className="text-center text-muted-foreground">{loadError}</p>
                    </div>
                    <div className="flex justify-center">
                        <Button onClick={handleClose}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Render result summary
    if (sessionComplete && sessionResult) {
        console.log('[PracticeModeDialog] Rendering result summary', sessionResult);
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Practice Results</DialogTitle>
                        <DialogDescription className="sr-only">
                            Your practice session results and score
                        </DialogDescription>
                    </DialogHeader>
                    <PracticeResultSummary
                        result={sessionResult}
                        item={item!}
                        modeType={modeType}
                        onRetry={handleRetry}
                        onClose={handleClose}
                    />
                </DialogContent>
            </Dialog>
        );
    }

    // Render practice game
    const modeTitle =
        modeType === 'matching'
            ? '🎮 Matching Game'
            : modeType === 'multiple_choice'
            ? '🎯 Multiple Choice'
            : '✍️ Write It Out';

    console.log('[PracticeModeDialog] Rendering practice game', { item, config, modeType, isOpen });
    console.log('[PracticeModeDialog] Dialog props', { open: isOpen, hasItem: !!item, hasConfig: !!config });
    console.log('[PracticeModeDialog] About to return Dialog JSX with open =', isOpen);

    const dialogJSX = (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{modeTitle}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Practice session for {item?.english}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {item && config && (
                        <>
                            {modeType === 'matching' && (
                                <MatchingGame
                                    item={item}
                                    config={config.config.difficulty_settings.matching}
                                    onComplete={handlePracticeComplete}
                                />
                            )}

                            {modeType === 'multiple_choice' && (
                                <MultipleChoiceQuiz
                                    item={item}
                                    config={config.config.difficulty_settings.multiple_choice}
                                    onComplete={handlePracticeComplete}
                                />
                            )}

                            {modeType === 'write_input' && (
                                <WriteInputPractice
                                    item={item}
                                    config={config.config.difficulty_settings.write_input}
                                    onComplete={handlePracticeComplete}
                                />
                            )}
                        </>
                    )}
                </div>

                <ToastContainer toasts={[]} onRemove={() => {}} />
            </DialogContent>
        </Dialog>
    );
}
