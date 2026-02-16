// hooks/use-streak.ts - Streak Tracking Hook
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';

interface StreakInfo {
    current_streak: number;
    longest_streak: number;
    last_activity: string | null;
    streak_status: 'active_today' | 'at_risk' | 'broken' | 'inactive';
}

interface StreakUpdate {
    new_streak: number;
    is_new_record: boolean;
    message: string;
}

export function useStreak() {
    const { user } = useAuth();
    const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Retry limiting to prevent infinite loops
    const [fetchRetryCount, setFetchRetryCount] = useState(0);
    const [updateRetryCount, setUpdateRetryCount] = useState(0);
    const MAX_RETRIES = 3;

    // Fetch current streak info
    const fetchStreakInfo = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        // Check retry limit
        if (fetchRetryCount >= MAX_RETRIES) {
            console.warn(`⚠️ Max retries (${MAX_RETRIES}) reached for fetchStreakInfo, using fallback`);
            setStreakInfo({
                current_streak: 0,
                longest_streak: 0,
                last_activity: null,
                streak_status: 'inactive'
            });
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .rpc('get_user_streak', { p_user_id: user.id });

            if (error) {
                // Increment retry counter
                setFetchRetryCount(prev => prev + 1);

                // Enhanced error logging
                console.error(`Error fetching streak (attempt ${fetchRetryCount + 1}/${MAX_RETRIES}):`, {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    fullError: error
                });

                // Check if RPC function doesn't exist
                if (error.code === '42883' || error.message?.includes('does not exist')) {
                    console.warn('⚠️ RPC function get_user_streak does not exist. Using fallback values.');
                    // Set fallback values and reset retry counter
                    setFetchRetryCount(MAX_RETRIES); // Prevent further retries
                    setStreakInfo({
                        current_streak: 0,
                        longest_streak: 0,
                        last_activity: null,
                        streak_status: 'inactive'
                    });
                }
                return;
            }

            // Success - reset retry counter
            setFetchRetryCount(0);

            if (data && data.length > 0) {
                setStreakInfo(data[0]);
            } else {
                // No data returned - set fallback
                setStreakInfo({
                    current_streak: 0,
                    longest_streak: 0,
                    last_activity: null,
                    streak_status: 'inactive'
                });
            }
        } catch (error) {
            // Increment retry counter
            setFetchRetryCount(prev => prev + 1);

            console.error(`Error fetching streak (caught, attempt ${fetchRetryCount + 1}/${MAX_RETRIES}):`, {
                error,
                type: typeof error,
                stringified: JSON.stringify(error, null, 2)
            });

            // Set fallback values on error
            setStreakInfo({
                current_streak: 0,
                longest_streak: 0,
                last_activity: null,
                streak_status: 'inactive'
            });
        } finally {
            setLoading(false);
        }
    }, [user?.id, fetchRetryCount]);

    // Update streak (call after learning activity)
    const updateStreak = useCallback(async (): Promise<StreakUpdate | null> => {
        if (!user?.id) return null;

        // Check retry limit
        if (updateRetryCount >= MAX_RETRIES) {
            console.warn(`⚠️ Max retries (${MAX_RETRIES}) reached for updateStreak, skipping`);
            return null;
        }

        setUpdating(true);
        try {
            const { data, error } = await supabase
                .rpc('update_user_streak', { p_user_id: user.id });

            if (error) {
                // Increment retry counter
                setUpdateRetryCount(prev => prev + 1);

                // Enhanced error logging
                console.error(`Error updating streak (attempt ${updateRetryCount + 1}/${MAX_RETRIES}):`, {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    fullError: error
                });

                // Check if RPC function doesn't exist
                if (error.code === '42883' || error.message?.includes('does not exist')) {
                    console.warn('⚠️ RPC function update_user_streak does not exist. Skipping streak update.');
                    setUpdateRetryCount(MAX_RETRIES); // Prevent further retries
                }
                return null;
            }

            // Success - reset retry counter
            setUpdateRetryCount(0);

            if (data && data.length > 0) {
                const result = data[0];

                // Refresh streak info
                await fetchStreakInfo();

                return result;
            }
            return null;
        } catch (error) {
            // Increment retry counter
            setUpdateRetryCount(prev => prev + 1);

            console.error(`Error updating streak (caught, attempt ${updateRetryCount + 1}/${MAX_RETRIES}):`, {
                error,
                type: typeof error,
                stringified: JSON.stringify(error, null, 2)
            });
            return null;
        } finally {
            setUpdating(false);
        }
    }, [user?.id, fetchStreakInfo, updateRetryCount]);

    // Check if streak needs attention today
    const needsAttention = streakInfo?.streak_status === 'at_risk' ||
                          streakInfo?.streak_status === 'broken';

    // Get streak emoji based on length
    const getStreakEmoji = (streak: number): string => {
        if (streak === 0) return '💤';
        if (streak < 3) return '🔥';
        if (streak < 7) return '🔥🔥';
        if (streak < 14) return '🔥🔥🔥';
        if (streak < 30) return '🔥🔥🔥🔥';
        return '🔥🔥🔥🔥🔥';
    };

    // Get milestone message
    const getMilestoneMessage = (streak: number): string | null => {
        const milestones: Record<number, string> = {
            3: '3-Tage-Streak! Du bist auf dem richtigen Weg! 🎯',
            7: '1 Woche Streak! Fantastisch! 🌟',
            14: '2 Wochen! Du bist ein Champion! 🏆',
            30: '30 Tage! Du bist eine Legende! 👑',
            50: '50 Tage! Unglaublich! 🚀',
            100: '100 TAGE! Du bist ein Meister! 💎',
        };
        return milestones[streak] || null;
    };

    useEffect(() => {
        fetchStreakInfo();
    }, [fetchStreakInfo]);

    return {
        streakInfo,
        loading,
        updating,
        updateStreak,
        needsAttention,
        getStreakEmoji,
        getMilestoneMessage,
        refresh: fetchStreakInfo,
    };
}
