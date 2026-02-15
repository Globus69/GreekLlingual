/**
 * useSessionTime Hook
 *
 * Tracks learning session duration and automatically manages session lifecycle.
 * Integrates with backend session tracking (Migration 059).
 *
 * Features:
 * - Auto-start session on mount
 * - Auto-end session on unmount or manual completion
 * - Track cards reviewed and accuracy
 * - Calculate duration in real-time
 * - Persist session data to database
 *
 * @example
 * const { sessionId, duration, startSession, endSession, updateStats } = useSessionTime({
 *   userId: user.id,
 *   sessionType: 'vocabulary',
 *   autoStart: true
 * });
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/db/supabase';

export type SessionType = 'vocabulary' | 'grammar' | 'comprehension' | 'listening' | 'daily_phrases' | 'due_cards' | 'weak_words';

export interface SessionStats {
  cardsReviewed: number;
  cardsCorrect: number;
  accuracy: number;
}

export interface UseSessionTimeOptions {
  userId: string;
  sessionType: SessionType;
  autoStart?: boolean;
  autoEnd?: boolean;
}

export interface UseSessionTimeResult {
  sessionId: string | null;
  duration: number; // in seconds
  isActive: boolean;
  stats: SessionStats;
  startSession: () => Promise<string | null>;
  endSession: () => Promise<void>;
  updateStats: (reviewed: number, correct: number) => void;
  resetStats: () => void;
}

/**
 * Hook for tracking learning session time
 */
export function useSessionTime({
  userId,
  sessionType,
  autoStart = true,
  autoEnd = true,
}: UseSessionTimeOptions): UseSessionTimeResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [stats, setStats] = useState<SessionStats>({
    cardsReviewed: 0,
    cardsCorrect: 0,
    accuracy: 0,
  });

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef = useRef<boolean>(false);

  /**
   * Start a new learning session
   */
  const startSession = useCallback(async (): Promise<string | null> => {
    if (!userId || isActive) {
      return null;
    }

    try {
      // Call RPC function to create session in database
      const { data, error } = await supabase.rpc('start_learning_session', {
        p_student_id: userId,
        p_session_type: sessionType,
      });

      if (error) {
        console.error('Error starting session:', error);
        return null;
      }

      const newSessionId = data as string;
      setSessionId(newSessionId);
      setIsActive(true);
      startTimeRef.current = Date.now();
      hasEndedRef.current = false;

      // Start duration counter
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setDuration(elapsed);
        }
      }, 1000);

      console.log(`✅ Session started: ${newSessionId} (${sessionType})`);
      return newSessionId;
    } catch (err) {
      console.error('Failed to start session:', err);
      return null;
    }
  }, [userId, sessionType, isActive]);

  /**
   * End the current learning session
   */
  const endSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !isActive || hasEndedRef.current) {
      return;
    }

    // Mark as ended to prevent duplicate calls
    hasEndedRef.current = true;
    setIsActive(false);

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      // Call RPC function to end session
      const { data, error } = await supabase.rpc('end_learning_session', {
        p_session_id: sessionId,
        p_cards_reviewed: stats.cardsReviewed,
        p_cards_correct: stats.cardsCorrect,
      });

      if (error) {
        console.error('Error ending session:', error);
        return;
      }

      const result = data?.[0];
      console.log(
        `✅ Session ended: ${sessionId} (${result?.duration_minutes || duration / 60} min, ${stats.cardsReviewed} cards, ${stats.accuracy.toFixed(1)}% accuracy)`
      );

      // Reset state
      setSessionId(null);
      setDuration(0);
      startTimeRef.current = null;
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, [sessionId, isActive, stats, duration]);

  /**
   * Update session statistics
   */
  const updateStats = useCallback((reviewed: number, correct: number) => {
    setStats({
      cardsReviewed: reviewed,
      cardsCorrect: correct,
      accuracy: reviewed > 0 ? (correct / reviewed) * 100 : 0,
    });
  }, []);

  /**
   * Reset statistics to zero
   */
  const resetStats = useCallback(() => {
    setStats({
      cardsReviewed: 0,
      cardsCorrect: 0,
      accuracy: 0,
    });
  }, []);

  /**
   * Auto-start session on mount
   */
  useEffect(() => {
    if (autoStart && userId) {
      startSession();
    }

    // Cleanup: auto-end session on unmount
    return () => {
      if (autoEnd && isActive && sessionId && !hasEndedRef.current) {
        endSession();
      }
    };
  }, []);

  return {
    sessionId,
    duration,
    isActive,
    stats,
    startSession,
    endSession,
    updateStats,
    resetStats,
  };
}

/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "2m 30s", "1h 15m")
 */
export function formatSessionDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Get session statistics from database
 * @param userId - User ID
 * @param days - Number of days to look back (default: 30)
 * @returns Session statistics or null
 */
export async function getSessionStats(userId: string, days: number = 30) {
  try {
    const { data, error } = await supabase.rpc('get_session_stats', {
      p_student_id: userId,
      p_days: days,
    });

    if (error) {
      console.error('Error fetching session stats:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (err) {
    console.error('Failed to fetch session stats:', err);
    return null;
  }
}

/**
 * Get recent sessions from database
 * @param userId - User ID
 * @param limit - Maximum number of sessions to fetch (default: 10)
 * @returns Array of recent sessions or empty array
 */
export async function getRecentSessions(userId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase.rpc('get_recent_sessions', {
      p_student_id: userId,
      p_limit: limit,
    });

    if (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch recent sessions:', err);
    return [];
  }
}
