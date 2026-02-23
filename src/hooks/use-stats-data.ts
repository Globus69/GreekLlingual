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
  reviewCount: number;
  weakCount: number;

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
    reviewCount: 0,
    weakCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const isFirstLoadRef = useRef(true);

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

      // Only set loading(true) for initial load to prevent UI flickering/remounting on background refreshes
      if (isFirstLoadRef.current) {
        setLoading(true);
      }

      setError(null);

      console.log(`📡 [useStatsData] Fetching stats for user: ${userId} (${isFirstLoadRef.current ? 'Initial' : 'Background Refresh'})`);

      // Parallele Anfragen für bessere Performance
      const results = await Promise.all([
        // Due Count: Phrasen die heute fällig sind
        supabase
          .from('student_progress')
          .select('id')
          .eq('student_id', userId)
          .lte('next_review', new Date().toISOString()),

        // Due Count: Vokabeln (Vocabulary)
        supabase
          .from('user_vocabulary_progress')
          .select('id')
          .eq('user_id', userId)
          .lte('fsrs_due', new Date().toISOString()),

        // Total Words (gelernt in student_progress)
        supabase
          .from('student_progress')
          .select('id')
          .eq('student_id', userId)
          .gt('fsrs_reps', 0),

        // Total Words (gelernt in vocabulary)
        supabase
          .from('user_vocabulary_progress')
          .select('id')
          .eq('user_id', userId)
          .gt('fsrs_reps', 0),

        // Level (aus users Tabelle)
        supabase
          .from('users')
          .select('level')
          .eq('id', userId)
          .single(),

        // Progress Overview (Migration 060, updated in 093)
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

        // Review Count (Migration 092)
        supabase.rpc('get_review_vocabulary_count', {
          p_user_id: userId,
        }),

        // Weak Count (Migration 092/101)
        supabase.rpc('get_weak_vocabulary_count', {
          p_user_id: userId,
        }),
      ] as any[]);

      const [
        duePhrasesResult,
        dueVocabResult,
        totalPhrasesResult,
        totalVocabResult,
        studentDataResult,
        progressOverviewResult,
        learningTrendsResult,
        weeklyActivityResult,
        userStreakResult,
        reviewCountResult,
        weakCountResult,
      ] = results as any[];

      // Progress Overview auswerten (nimmt ersten Eintrag, da RPC nur 1 Row zurückgibt)
      const progressOverview = progressOverviewResult.data?.[0];

      // Streak berechnen (aus DB statt Hardcoded)
      const streak = userStreakResult.data?.[0]?.current_streak || 0;

      // Statistiken setzen
      setStats({
        streak,
        dueCount: (duePhrasesResult.data?.length || 0) + (dueVocabResult.data?.length || 0),
        level: studentDataResult.data?.level || 'A1',
        totalWords: progressOverview?.cards_learned ||
          ((totalPhrasesResult.data?.length || 0) + (totalVocabResult.data?.length || 0)),
        reviewCount: reviewCountResult.data || 0,
        weakCount: weakCountResult.data || 0,

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
        reviewCount: 0,
        weakCount: 0,
        correctRate: 0,
        totalStudyTime: 0,
        avgSessionTime: 0,
        consistencyScore: 0,
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      isFirstLoadRef.current = false;
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
