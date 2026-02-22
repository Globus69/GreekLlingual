// hooks/use-streak.ts - Streak Tracking Hook
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

    // Use refs for retry counts to avoid triggering re-renders
    const fetchRetryCount = useRef(0);
    const updateRetryCount = useRef(0);
    const MAX_RETRIES = 3;

    // Fetch current streak info
    const fetchStreakInfo = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        // Check retry limit
        if (fetchRetryCount.current >= MAX_RETRIES) {
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
                fetchRetryCount.current += 1;

                // Enhanced error logging (only log first attempt to avoid spam)
                if (fetchRetryCount.current === 1) {
                    console.warn(`⚠️ Streak RPC not available (attempt ${fetchRetryCount.current}/${MAX_RETRIES}). Using fallback.`);
                }

                // Check if RPC function doesn't exist or network error
                if (error.code === '42883' || error.message?.includes('does not exist') || error.message?.includes('Failed to fetch')) {
                    // Set fallback values and max out retry counter to prevent further attempts
                    fetchRetryCount.current = MAX_RETRIES;
                    setStreakInfo({
                        current_streak: 0,
                        longest_streak: 0,
                        last_activity: null,
                        streak_status: 'inactive'
                    });
                    setLoading(false);
                }
                return;
            }

            // Success - reset retry counter
            fetchRetryCount.current = 0;

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
            fetchRetryCount.current += 1;

            // Only log once to avoid console spam
            if (fetchRetryCount.current === 1) {
                console.warn(`⚠️ Streak fetch failed. Using fallback values.`);
            }

            // Max out retries on network errors
            fetchRetryCount.current = MAX_RETRIES;

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
    }, [user?.id]);

    // Update streak (call after learning activity)
    const updateStreak = useCallback(async (): Promise<StreakUpdate | null> => {
        if (!user?.id) return null;

        // Check retry limit
        if (updateRetryCount.current >= MAX_RETRIES) {
            return null;
        }

        setUpdating(true);
        try {
            const { data, error } = await supabase
                .rpc('update_user_streak', { p_user_id: user.id });

            if (error) {
                // Increment retry counter
                updateRetryCount.current += 1;

                // Only log first attempt
                if (updateRetryCount.current === 1) {
                    console.warn('⚠️ Streak update RPC not available. Skipping.');
                }

                // Check if RPC function doesn't exist or network error
                if (error.code === '42883' || error.message?.includes('does not exist') || error.message?.includes('Failed to fetch')) {
                    updateRetryCount.current = MAX_RETRIES; // Prevent further retries
                }
                return null;
            }

            // Success - reset retry counter
            updateRetryCount.current = 0;

            if (data && data.length > 0) {
                const result = data[0];

                // Refresh streak info
                await fetchStreakInfo();

                return result;
            }
            return null;
        } catch (error) {
            // Increment retry counter
            updateRetryCount.current += 1;

            // Only log once
            if (updateRetryCount.current === 1) {
                console.warn('⚠️ Streak update failed. Skipping.');
            }

            // Max out retries
            updateRetryCount.current = MAX_RETRIES;
            return null;
        } finally {
            setUpdating(false);
        }
    }, [user?.id, fetchStreakInfo]);

    // Check if streak needs attention today
    const needsAttention = streakInfo?.streak_status === 'at_risk' ||
        streakInfo?.streak_status === 'broken';

    // Get streak emoji based on length
    const getStreakEmoji = useCallback((streak: number): string => {
        if (streak === 0) return '💤';
        if (streak < 3) return '🔥';
        if (streak < 7) return '🔥🔥';
        if (streak < 14) return '🔥🔥🔥';
        if (streak < 30) return '🔥🔥🔥🔥';
        return '🔥🔥🔥🔥🔥';
    }, []);

    // Get milestone message
    const getMilestoneMessage = useCallback((streak: number): string | null => {
        const milestones: Record<number, string> = {
            3: '3-Tage-Streak! Du bist auf dem richtigen Weg! 🎯',
            7: '1 Woche Streak! Fantastisch! 🌟',
            14: '2 Wochen! Du bist ein Champion! 🏆',
            30: '30 Tage! Du bist eine Legende! 👑',
            50: '50 Tage! Unglaublich! 🚀',
            100: '100 TAGE! Du bist ein Meister! 💎',
        };
        return milestones[streak] || null;
    }, []);

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
