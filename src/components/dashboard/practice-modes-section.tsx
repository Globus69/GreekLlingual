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

import { useState, useEffect } from 'react';
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
    console.log('🔍 PracticeModesSection: Component rendering');

    const { user } = useAuth();
    const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
    const [unlockStatuses, setUnlockStatuses] = useState<Record<string, UnlockStatus>>({});
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<PracticeItem | null>(null);
    const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    console.log('🔍 PracticeModesSection: State -', {
        loading,
        itemCount: practiceItems.length,
        hasUser: !!user?.id
    });

    useEffect(() => {
        if (user?.id) {
            loadPracticeItems();
        }
    }, [user?.id]);

    /**
     * Load learning items with practice modes enabled
     */
    const loadPracticeItems = async () => {
        if (!user?.id) {
            console.log('🔍 PracticeModesSection: No user ID, skipping load');
            return;
        }

        console.log('🔍 PracticeModesSection: Loading practice items for user:', user.id);
        setLoading(true);

        try {
            // Fetch items with practice enabled
            const { data: items, error } = await supabase
                .from('learning_items')
                .select('id, english, greek, level, difficulty, practice_modes_config')
                .not('practice_modes_config', 'is', null)
                .limit(10); // Limit for MVP

            console.log('🔍 PracticeModesSection: Raw items from DB:', items);
            console.log('🔍 PracticeModesSection: Query error:', error);

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

                    console.log(`🔍 Item ${item.english}:`, {
                        hasConfig,
                        isEnabled,
                        hasModes,
                        config: item.practice_modes_config
                    });

                    return hasConfig && isEnabled && hasModes;
                }
            );

            console.log('🔍 PracticeModesSection: Enabled items after filter:', enabledItems.length, enabledItems);
            setPracticeItems(enabledItems);

            // Load unlock statuses for each item
            await loadUnlockStatuses(enabledItems);
        } catch (err) {
            console.error('Error in loadPracticeItems:', err);
        } finally {
            setLoading(false);
        }
    };

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
        console.log('🔍 PracticeModesSection: Rendering LOADING state');
        return (
            <div className="practice-modes-section">
                <h3 className="text-lg font-semibold mb-4">Practice Modes</h3>
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (practiceItems.length === 0) {
        console.log('🔍 PracticeModesSection: Rendering NULL (no items found)');
        return null; // Don't show section if no practice items
    }

    console.log('🔍 PracticeModesSection: Rendering PRACTICE CARDS:', practiceItems.length, 'items');

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
                                className="p-4 bg-card border border-border rounded-lg space-y-3 hover:border-primary/50 transition-colors"
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
                                                    <Unlock className="h-3 w-3" />
                                                ) : (
                                                    <Lock className="h-3 w-3" />
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
