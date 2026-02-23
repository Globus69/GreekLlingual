/**
 * useStatsData Hook — Optimized v2 (Migration 114)
 *
 * ⚡ Performance: Single RPC call to get_all_stats()
 *    BEFORE: 11 parallel DB calls (incl. 4 zombie + 1 duplicate streak call)
 *    AFTER:  1 consolidated RPC round-trip → all data in one response
 *
 * Provides a stable, extensible structure for all stats in the app.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/db/supabase';

// ── Interfaces ────────────────────────────────────────────────────────────────

/** Progress Overview returned by get_progress_overview RPC (unchanged) */
export interface ProgressOverview {
  total_reviews: number;
  total_correct: number;
  avg_accuracy: number;
  cards_learned: number;
  cards_mastered: number;
  new_cards_added: number;
  total_study_minutes: number;
  avg_session_minutes: number;
  total_sessions: number;
  improvement_rate: number;
  consistency_score: number;
}

/** Single data point from get_learning_trends RPC (unchanged) */
export interface LearningTrendPoint {
  date: string;
  reviews_count: number;
  correct_count: number;
  accuracy_percentage: number;
  study_minutes: number;
  new_cards: number;
  avg_rating: number;
}

/** Single data point from get_weekly_activity RPC (unchanged) */
export interface WeeklyActivityPoint {
  week_start: string;
  week_number: number;
  day_of_week: number;
  day_name: string;
  activity_score: number;
  reviews_count: number;
  study_minutes: number;
  is_today: boolean;
}

/** Central stats shape — same public API as before, now reliably populated */
export interface StatsData {
  streak: number;
  dueCount: number;
  level: string;
  totalWords: number;
  reviewCount: number;
  weakCount: number;
  masteryProgress: number;           // 0-100 %, computed server-side

  // Extended Progress Statistics (Migration 060, served via get_all_stats)
  progressOverview?: ProgressOverview;
  learningTrends?: LearningTrendPoint[];
  weeklyActivity?: WeeklyActivityPoint[];

  // Convenience aliases (extracted from progressOverview)
  correctRate?: number;
  totalStudyTime?: number;
  avgSessionTime?: number;
  consistencyScore?: number;

  [key: string]: any;
}

interface UseStatsDataResult {
  stats: StatsData;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ── Default / fallback stats object ──────────────────────────────────────────

const DEFAULT_STATS: StatsData = {
  streak: 0,
  dueCount: 0,
  level: 'A1',
  totalWords: 0,
  reviewCount: 0,
  weakCount: 0,
  masteryProgress: 38,
  correctRate: 0,
  totalStudyTime: 0,
  avgSessionTime: 0,
  consistencyScore: 0,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches all user statistics via a single `get_all_stats` RPC call.
 *
 * @param userId - UUID of the authenticated user
 * @returns stats, loading state, error, and a refetch function
 *
 * @example
 * const { stats, loading, error, refetch } = useStatsData(user?.id);
 */
export function useStatsData(userId?: string): UseStatsDataResult {
  const [stats, setStats] = useState<StatsData>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Guard refs — prevent concurrent fetches and network floods
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // ── Rate-limit guard ────────────────────────────────────────────────────
    const now = Date.now();
    if (isFetchingRef.current) {
      console.debug('📡 [useStatsData] Fetch already in progress, skipping.');
      return;
    }
    if (now - lastFetchTimeRef.current < 1000) {
      console.debug('📡 [useStatsData] Rate limit: skipping frequent fetch.');
      return;
    }

    // ── Start fetch ─────────────────────────────────────────────────────────
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    // Only show spinner on first load — background refreshes stay silent
    if (isFirstLoadRef.current) setLoading(true);
    setError(null);

    console.log(
      `📡 [useStatsData] get_all_stats for ${userId} ` +
      `(${isFirstLoadRef.current ? 'initial' : 'refresh'})`
    );

    try {
      // ⚡ Single consolidated RPC — replaces 11 parallel calls
      const { data: raw, error: rpcError } = await supabase.rpc('get_all_stats', {
        p_user_id: userId,
        p_days: 30,
        p_weeks: 4,
      });

      if (rpcError) throw rpcError;

      // `raw` is the JSONB object returned by Postgres
      const d = raw as {
        streak: number;
        level: string;
        due_count: number;
        total_words: number;
        total_correct: number;
        mastery_progress: number;
        weak_count: number;
        review_count: number;
        progress: ProgressOverview | null;
        trends: LearningTrendPoint[] | null;
        weekly: WeeklyActivityPoint[] | null;
      };

      setStats({
        // Core stats
        streak: d.streak ?? 0,
        level: d.level ?? 'A1',
        dueCount: d.due_count ?? 0,
        totalWords: d.progress?.cards_learned ?? d.total_words ?? 0,
        reviewCount: d.review_count ?? 0,
        weakCount: d.weak_count ?? 0,
        masteryProgress: d.mastery_progress ?? 38,

        // Rich stats (from existing sub-RPCs via get_all_stats)
        progressOverview: d.progress ?? undefined,
        learningTrends: d.trends ?? undefined,
        weeklyActivity: d.weekly ?? undefined,

        // Convenience aliases
        correctRate: d.progress?.avg_accuracy ?? 0,
        totalStudyTime: d.progress?.total_study_minutes ?? 0,
        avgSessionTime: d.progress?.avg_session_minutes ?? 0,
        consistencyScore: d.progress?.consistency_score ?? 0,
      });

    } catch (err) {
      console.error('❌ [useStatsData] Error fetching stats:', err);
      setError(err as Error);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      isFirstLoadRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// ── Utility helpers (unchanged public API) ────────────────────────────────────

/**
 * Formats minutes → human-readable string  e.g. "2h 30min"
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Calculates percentage trend between two values.
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
