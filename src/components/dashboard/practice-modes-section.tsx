/**
 * Practice Modes Section Component
 *
 * Dashboard section for practice mode entry points
 * - Fetches learning items with practice enabled
 * - Checks unlock status per mode
 * - Displays practice mode cards with launch buttons
 * - Opens PracticeModeDialog on click
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/db/supabase';
import { getPracticeConfig } from '@/lib/supabase/content';
import { PracticeModeDialog } from '@/components/learning/practice-modes/practice-mode-dialog';
import type { PracticeMode } from '@/lib/validation/schemas';

interface PracticeItem {
    id: string;
    english: string;
    greek: string;
    level?: string;
    difficulty?: string;
    practice_modes_config: {
        enabled: boolean;
        available_modes: PracticeMode[];
        activation_threshold: number;
    };
}

interface UnlockStatus {
    [modeType: string]: {
        unlocked: boolean;
        user_reps: number;
        threshold: number;
    };
}

export function PracticeModesSection() {
    const { user } = useAuth();
    const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
    const [unlockStatuses, setUnlockStatuses] = useState<Record<string, UnlockStatus>>({});
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<PracticeItem | null>(null);
    const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    /**
     * Load learning items with practice modes enabled
     */
    const loadPracticeItems = useCallback(async () => {
        if (!user?.id) {
            return;
        }
        setLoading(true);

        try {
            console.log('🎮 [loadPracticeItems] Calling RPC: get_practice_enabled_items');

            // Use RPC endpoint to bypass PostgREST cache issues
            // Migration: 069_get_practice_enabled_items.sql
            const { data: items, error } = await supabase
                .rpc('get_practice_enabled_items');

            console.log('🎮 [loadPracticeItems] RPC response:', {
                itemCount: items?.length || 0,
                hasError: !!error
            });

            if (error) {
                console.error('Error loading practice items:', error);
                return;
            }

            // Filter items where practice is actually enabled
            const enabledItems = (items || []).filter(
                (item: any) => {
                    const hasConfig = !!item.practice_modes_config;
                    const isEnabled = item.practice_modes_config?.enabled === true;
                    const hasModes = (item.practice_modes_config?.available_modes?.length || 0) > 0;
                    return hasConfig && isEnabled && hasModes;
                }
            );

            console.log('🎮 [loadPracticeItems] Filtered enabled items:', enabledItems);
            setPracticeItems(enabledItems);

            // Load unlock statuses for each item
            await loadUnlockStatuses(enabledItems);
        } catch (err) {
            console.error('Error in loadPracticeItems:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    /**
     * Load unlock status for all items and modes
     */
    const loadUnlockStatuses = async (items: PracticeItem[]) => {
        if (!user?.id) return;

        const statuses: Record<string, UnlockStatus> = {};

        for (const item of items) {
            const itemStatuses: UnlockStatus = {};

            for (const mode of item.practice_modes_config.available_modes) {
                try {
                    const config = await getPracticeConfig(item.id, user.id, mode);

                    if (config) {
                        itemStatuses[mode] = {
                            unlocked: config.unlocked,
                            user_reps: config.user_reps,
                            threshold: config.threshold,
                        };
                    }
                } catch (err) {
                    console.error(`Error checking unlock for ${item.id}/${mode}:`, err);
                }
            }

            statuses[item.id] = itemStatuses;
        }

        setUnlockStatuses(statuses);
    };

    // Mount log (only once)
    useEffect(() => {
        console.log('🎮 [PracticeModesSection] Component MOUNTED');
    }, []);

    // Load practice items when user is available
    useEffect(() => {
        if (user?.id) {
            console.log('🎮 [useEffect] Loading practice items for user:', user.id);
            loadPracticeItems();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // Only depend on user?.id, not loadPracticeItems

    /**
     * Handle practice mode launch
     */
    const handleLaunchPractice = (item: PracticeItem, mode: PracticeMode) => {
        setSelectedItem(item);
        setSelectedMode(mode);
        setDialogOpen(true);
    };

    /**
     * Handle dialog close
     */
    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedItem(null);
        setSelectedMode(null);

        // Refresh unlock statuses after completion
        if (practiceItems.length > 0) {
            loadUnlockStatuses(practiceItems);
        }
    };

    /**
     * Get mode icon
     */
    const getModeIcon = (mode: PracticeMode): string => {
        switch (mode) {
            case 'matching':
                return '🎮';
            case 'multiple_choice':
                return '🎯';
            case 'write_input':
                return '✍️';
            default:
                return '📝';
        }
    };

    /**
     * Get mode label
     */
    const getModeLabel = (mode: PracticeMode): string => {
        switch (mode) {
            case 'matching':
                return 'Matching';
            case 'multiple_choice':
                return 'Quiz';
            case 'write_input':
                return 'Write';
            default:
                return mode;
        }
    };

    if (loading) {
        return (
            <div className="practice-modes-section p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-white">🎮 Practice Modes</h3>
                <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    <p className="text-sm text-white/70">Loading practice items...</p>
                </div>
            </div>
        );
    }

    if (practiceItems.length === 0) {
        return (
            <div className="practice-modes-section p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl space-y-4">
                <div className="text-center py-8">
                    <div className="text-6xl mb-4 opacity-50">📦</div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Practice Items Available</h3>
                    <p className="text-sm text-white/60 mb-4">
                        Complete flashcard reviews to unlock practice modes
                    </p>
                    <p className="text-xs text-white/40">
                        Practice modes unlock after reviewing vocabulary items
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="practice-modes-section space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">🎮 Practice Modes</h3>
                    <span className="text-xs text-muted-foreground">
                        {practiceItems.length} item{practiceItems.length > 1 ? 's' : ''} available
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {practiceItems.map((item) => {
                        const itemUnlockStatus = unlockStatuses[item.id] || {};

                        return (
                            <div
                                key={item.id}
                                className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl space-y-3 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-200"
                            >
                                {/* Item Info */}
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">{item.english}</p>
                                    <p className="text-xs text-muted-foreground font-sans">
                                        {item.greek}
                                    </p>
                                    {item.level && (
                                        <span className="inline-block text-xs px-2 py-0.5 bg-accent rounded">
                                            {item.level}
                                        </span>
                                    )}
                                </div>

                                {/* Practice Mode Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    {item.practice_modes_config.available_modes.map((mode) => {
                                        const status = itemUnlockStatus[mode];
                                        const isUnlocked = status?.unlocked || false;
                                        const remaining = status
                                            ? Math.max(0, status.threshold - status.user_reps)
                                            : 0;

                                        return (
                                            <Button
                                                key={mode}
                                                size="sm"
                                                variant={isUnlocked ? 'default' : 'outline'}
                                                onClick={() => handleLaunchPractice(item, mode)}
                                                disabled={!isUnlocked}
                                                className="gap-1 text-xs"
                                                title={
                                                    isUnlocked
                                                        ? `Play ${getModeLabel(mode)}`
                                                        : `Complete ${remaining} more review${
                                                              remaining > 1 ? 's' : ''
                                                          } to unlock`
                                                }
                                            >
                                                {isUnlocked ? (
                                                    <Unlock className="h-4 w-4" />
                                                ) : (
                                                    <Lock className="h-4 w-4" />
                                                )}
                                                <span>{getModeIcon(mode)}</span>
                                                <span>{getModeLabel(mode)}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Practice Mode Dialog */}
            {selectedItem && selectedMode && (
                <PracticeModeDialog
                    isOpen={dialogOpen}
                    onClose={handleDialogClose}
                    itemId={selectedItem.id}
                    modeType={selectedMode}
                />
            )}
        </>
    );
}
