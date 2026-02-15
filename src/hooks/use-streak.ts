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

    // Fetch current streak info
    const fetchStreakInfo = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .rpc('get_user_streak', { p_user_id: user.id });

            if (error) throw error;

            if (data && data.length > 0) {
                setStreakInfo(data[0]);
            }
        } catch (error) {
            console.error('Error fetching streak:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Update streak (call after learning activity)
    const updateStreak = useCallback(async (): Promise<StreakUpdate | null> => {
        if (!user?.id) return null;

        setUpdating(true);
        try {
            const { data, error } = await supabase
                .rpc('update_user_streak', { p_user_id: user.id });

            if (error) throw error;

            if (data && data.length > 0) {
                const result = data[0];

                // Refresh streak info
                await fetchStreakInfo();

                return result;
            }
            return null;
        } catch (error) {
            console.error('Error updating streak:', error);
            return null;
        } finally {
            setUpdating(false);
        }
    }, [user?.id, fetchStreakInfo]);

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
