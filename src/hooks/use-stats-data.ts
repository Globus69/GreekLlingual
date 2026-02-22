/**
 * useStatsData Hook
 *
 * Zentrale Hook für alle Statistik-Daten in der App.
 * Bietet eine erweiterbare Struktur für zukünftige Statistik-Anforderungen.
 *
 * TODO: Neue Datenfelder werden später hinzugefügt, wenn die Anforderungen klar sind.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/db/supabase';

// Progress Overview from RPC function
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

// Learning Trend data point
export interface LearningTrendPoint {
  date: string;
  reviews_count: number;
  correct_count: number;
  accuracy_percentage: number;
  study_minutes: number;
  new_cards: number;
  avg_rating: number;
}

// Weekly Activity data point
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

export interface StatsData {
  // Bestehende Felder
  streak: number;
  dueCount: number;
  level: string;
  totalWords: number;

  // Erweiterte Progress Statistics (Migration 060)
  progressOverview?: ProgressOverview;
  learningTrends?: LearningTrendPoint[];
  weeklyActivity?: WeeklyActivityPoint[];

  // Convenience fields (aus progressOverview extrahiert)
  correctRate?: number;
  totalStudyTime?: number;
  avgSessionTime?: number;
  consistencyScore?: number;

  [key: string]: any; // Flexibel für zukünftige Erweiterungen
}

interface UseStatsDataResult {
  stats: StatsData;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook zum Abrufen von Benutzerstatistiken
 *
 * @param userId - Die ID des Benutzers
 * @returns Statistikdaten, Ladezustand und Fehler
 *
 * @example
 * const { stats, loading, error, refetch } = useStatsData(user?.id);
 */
export function useStatsData(userId?: string): UseStatsDataResult {
  const [stats, setStats] = useState<StatsData>({
    streak: 0,
    dueCount: 0,
    level: 'A1',
    totalWords: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Protection against network flood:
    // 1. Don't fetch if already fetching
    // 2. Rate limit: Wait at least 1 second between fetches
    const now = Date.now();
    if (isFetchingRef.current) {
      console.warn('📡 [useStatsData] Fetch already in progress, skipping.');
      return;
    }

    if (now - lastFetchTimeRef.current < 1000) {
      console.log('📡 [useStatsData] Rate limit: Skipping frequent fetch.');
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      setLoading(true);
      setError(null);

      console.log(`📡 [useStatsData] Fetching stats for user: ${userId}`);

      // Parallele Anfragen für bessere Performance
      const [
        dueItemsResult,
        totalItemsResult,
        studentDataResult,
        progressOverviewResult,
        learningTrendsResult,
        weeklyActivityResult,
        userStreakResult,
      ] = await Promise.all([
        // Due Count: Vokabeln die heute fällig sind
        supabase
          .from('student_progress')
          .select('id')
          .eq('student_id', userId)
          .lte('next_review', new Date().toISOString())
          .limit(100),

        // Total Words (gelernt)
        supabase
          .from('student_progress')
          .select('id')
          .eq('student_id', userId)
          .gte('correct_count', 1),

        // Level (aus users Tabelle)
        supabase
          .from('users')
          .select('level')
          .eq('id', userId)
          .single(),

        // Progress Overview (Migration 060)
        supabase.rpc('get_progress_overview', {
          p_user_id: userId,
          p_days: 30,
        }),

        // Learning Trends (Migration 060)
        supabase.rpc('get_learning_trends', {
          p_user_id: userId,
          p_days: 7,
        }),

        // Weekly Activity (Migration 060)
        supabase.rpc('get_weekly_activity', {
          p_user_id: userId,
          p_weeks: 4,
        }),

        // User Streak (Migration 058)
        supabase.rpc('get_user_streak', {
          p_user_id: userId,
        }),
      ]);

      // Fehlerbehandlung
      if (dueItemsResult.error) {
        console.warn('Error fetching due items:', dueItemsResult.error);
      }
      if (totalItemsResult.error) {
        console.warn('Error fetching total items:', totalItemsResult.error);
      }
      if (studentDataResult.error && studentDataResult.error.code !== 'PGRST116') {
        console.warn('Error fetching student level:', studentDataResult.error);
      }
      if (progressOverviewResult.error) {
        console.warn('Error fetching progress overview:', progressOverviewResult.error);
      }
      if (learningTrendsResult.error) {
        console.warn('Error fetching learning trends:', learningTrendsResult.error);
      }
      if (weeklyActivityResult.error) {
        console.warn('Error fetching weekly activity:', weeklyActivityResult.error);
      }
      if (userStreakResult.error) {
        console.warn('Error fetching user streak:', userStreakResult.error);
      }

      // Progress Overview auswerten (nimmt ersten Eintrag, da RPC nur 1 Row zurückgibt)
      const progressOverview = progressOverviewResult.data?.[0];

      // Streak berechnen (aus DB statt Hardcoded)
      const streak = userStreakResult.data?.[0]?.current_streak || 0;

      // Statistiken setzen
      setStats({
        streak,
        dueCount: dueItemsResult.data?.length || 0,
        level: studentDataResult.data?.level || 'A1',
        totalWords: totalItemsResult.data?.length || 0,

        // Progress Statistics (Migration 060)
        progressOverview: progressOverview || undefined,
        learningTrends: learningTrendsResult.data || undefined,
        weeklyActivity: weeklyActivityResult.data || undefined,

        // Convenience fields
        correctRate: progressOverview?.avg_accuracy || 0,
        totalStudyTime: progressOverview?.total_study_minutes || 0,
        avgSessionTime: progressOverview?.avg_session_minutes || 0,
        consistencyScore: progressOverview?.consistency_score || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err as Error);
      // Setze Default-Werte auch bei Fehler
      setStats({
        streak: 0,
        dueCount: 0,
        level: 'A1',
        totalWords: 0,
        correctRate: 0,
        totalStudyTime: 0,
        avgSessionTime: 0,
        consistencyScore: 0,
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Helper-Funktionen für Statistik-Berechnungen
 */

/**
 * Formatiert Minuten in lesbare Zeit (z.B. "2h 30min")
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Berechnet Trend (Anstieg/Abfall) zwischen zwei Werten
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
