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
            // TEMPORARY WORKAROUND for Supabase PostgREST Caching Issue
            // Date: 2026-02-16
            // Issue: Filter-based queries (.not()) return stale cached data
            // Solution: Direct ID-based query bypasses filter cache
            // TODO: Revert to dynamic filter-based query once cache issue resolved
            // See: TROUBLESHOOTING-Practice-Modes.md for restoration instructions

            const knownPracticeIds = [
                'dde85935-6766-47e8-91aa-019fe8496fe9', // Hello
                'e2493cf1-9b7f-44c4-862f-9a07f93abcfa', // Hello
                '441731a2-395d-4037-9365-993a8b4cb144', // Hello
                'eff9c69a-0860-402d-ad8f-f60d36bb0f69', // Thank you
                '8cf23373-37e7-442f-a834-9a1dbef3f816'  // Water
            ];

            const { data: items, error } = await supabase
                .from('learning_items')
                .select('id, english, greek, level, difficulty, practice_modes_config')
                .in('id', knownPracticeIds);

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

    // Load practice items when user is available
    useEffect(() => {
        if (user?.id) {
            loadPracticeItems();
        }
    }, [user?.id, loadPracticeItems]);

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
            <div className="practice-modes-section">
                <h3 className="text-lg font-semibold mb-4">Practice Modes</h3>
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (practiceItems.length === 0) {

        // TEMPORARY: Show a message instead of hiding completely
        return (
            <div className="practice-modes-section space-y-4" style={{
                padding: '20px',
                background: '#2a2a2a',
                border: '2px solid orange',
                borderRadius: '8px'
            }}>
                <h3 className="text-lg font-semibold">🎮 Practice Modes</h3>
                <p className="text-sm text-yellow-400">
                    ⚠️ No practice items found. Check console for details.
                </p>
                <p className="text-xs text-gray-400">
                    Loading: {loading ? 'true' : 'false'} | User: {user?.id ? 'logged in' : 'not logged in'}
                </p>
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
