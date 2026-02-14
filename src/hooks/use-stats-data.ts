/**
 * useStatsData Hook
 *
 * Zentrale Hook für alle Statistik-Daten in der App.
 * Bietet eine erweiterbare Struktur für zukünftige Statistik-Anforderungen.
 *
 * TODO: Neue Datenfelder werden später hinzugefügt, wenn die Anforderungen klar sind.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

export interface StatsData {
  // Bestehende Felder
  streak: number;
  dueCount: number;
  level: string;
  totalWords: number;

  // Erweiterbare Felder für zukünftige Anforderungen
  // TODO: Hier werden neue Felder hinzugefügt, z.B.:
  // weeklyProgress?: number;
  // monthlyGoal?: number;
  // correctRate?: number;
  // totalStudyTime?: number;

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

  const fetchStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Streak berechnen (TODO: Aus DB berechnen statt Hardcoded)
      const streak = 5;

      // Due Count: Vokabeln die heute fällig sind
      const { data: dueItems, error: dueError } = await supabase
        .from('student_progress')
        .select('id')
        .eq('student_id', userId)
        .lte('next_review', new Date().toISOString())
        .limit(100);

      if (dueError) {
        console.warn('Error fetching due items:', dueError);
      }

      // Total Words (gelernt)
      const { data: totalItems, error: totalError } = await supabase
        .from('student_progress')
        .select('id')
        .eq('student_id', userId)
        .gte('correct_count', 1);

      if (totalError) {
        console.warn('Error fetching total items:', totalError);
      }

      // Level (aus students Tabelle)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('level')
        .eq('id', userId)
        .single();

      // Ignoriere Fehler wenn Student nicht existiert (nutze Default)
      if (studentError && studentError.code !== 'PGRST116') {
        console.warn('Error fetching student level:', studentError);
      }

      // Statistiken setzen
      setStats({
        streak,
        dueCount: dueItems?.length || 0,
        level: studentData?.level || 'A1',
        totalWords: totalItems?.length || 0,

        // TODO: Hier weitere Felder hinzufügen, z.B.:
        // weeklyProgress: calculateWeeklyProgress(data),
        // monthlyGoal: studentData?.monthly_goal,
        // correctRate: calculateCorrectRate(data),
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
      });
    } finally {
      setLoading(false);
    }
  };

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
 * Helper-Funktionen für zukünftige Statistik-Berechnungen
 * TODO: Implementieren wenn Anforderungen klar sind
 */

// export function calculateWeeklyProgress(data: any): number {
//   // TODO: Implementierung
//   return 0;
// }

// export function calculateCorrectRate(data: any): number {
//   // TODO: Implementierung
//   return 0;
// }
