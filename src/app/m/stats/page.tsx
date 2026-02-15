'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/use-translation';
import { supabase } from '@/db/supabase';

interface Stats {
  totalWords: number;
  learnedWords: number;
  weakWords: number;
  dueToday: number;
  streakDays: number;
  totalSessions: number;
  correctRate: number;
  avgSessionTime: number;
}

export default function MobileStatsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login-pin');
      return;
    }

    loadStats();
  }, [isAuthenticated, user]);

  const loadStats = async () => {
    try {
      if (!user) return;

      // Fetch student progress stats
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user.id);

      if (progressError) throw progressError;

      // Calculate stats
      const totalWords = progressData?.length || 0;
      const learnedWords = progressData?.filter((p: any) => p.correct_count > 0).length || 0;
      const weakWords = progressData?.filter((p: any) => p.ease_factor < 2.0).length || 0;
      const dueToday = progressData?.filter((p: any) => {
        const nextReview = new Date(p.next_review);
        const today = new Date();
        return nextReview <= today;
      }).length || 0;

      // Calculate correct rate
      const totalAttempts = progressData?.reduce((sum: number, p: any) => sum + (p.attempts || 0), 0) || 0;
      const totalCorrect = progressData?.reduce((sum: number, p: any) => sum + (p.correct_count || 0), 0) || 0;
      const correctRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

      setStats({
        totalWords,
        learnedWords,
        weakWords,
        dueToday,
        streakDays: 0, // TODO: Add streak_days to User type
        totalSessions: totalAttempts,
        correctRate,
        avgSessionTime: 0, // TODO: Implement session time tracking
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          📊 {t('perf.title') || 'Performance Statistics'}
        </h1>
        <p className="text-blue-200">
          {user?.name || 'Student'}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak */}
        <StatCard
          icon="🔥"
          label="Streak"
          value={stats?.streakDays || 0}
          suffix="days"
          color="from-orange-500 to-red-500"
        />

        {/* Total Words */}
        <StatCard
          icon="📚"
          label="Total Words"
          value={stats?.totalWords || 0}
          suffix="words"
          color="from-blue-500 to-purple-500"
        />

        {/* Learned */}
        <StatCard
          icon="✅"
          label="Learned"
          value={stats?.learnedWords || 0}
          suffix="words"
          color="from-green-500 to-emerald-500"
        />

        {/* Weak Words */}
        <StatCard
          icon="💪"
          label="Weak"
          value={stats?.weakWords || 0}
          suffix="words"
          color="from-yellow-500 to-orange-500"
        />

        {/* Due Today */}
        <StatCard
          icon="📅"
          label="Due Today"
          value={stats?.dueToday || 0}
          suffix="cards"
          color="from-pink-500 to-rose-500"
        />

        {/* Correct Rate */}
        <StatCard
          icon="🎯"
          label="Accuracy"
          value={stats?.correctRate || 0}
          suffix="%"
          color="from-cyan-500 to-blue-500"
        />
      </div>

      {/* Detailed Stats */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Detailed Statistics</h2>

        <StatRow label="Total Sessions" value={stats?.totalSessions || 0} />
        <StatRow label="Level" value={user?.level || 'A1'} />
        <StatRow label="Difficulty" value={user?.difficulty || 'easy'} />
        <StatRow
          label="Progress Index"
          value={user?.performance_index || 'A1-easy'}
        />
      </div>

      {/* Weekly Activity Chart (Placeholder) */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Weekly Activity</h2>
        <div className="text-center text-blue-200 py-8">
          📊 Chart coming soon...
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div
      className={`
        bg-gradient-to-br ${color}
        rounded-2xl p-4
        flex flex-col items-center justify-center
        min-h-[120px]
        shadow-lg
        transform transition-transform hover:scale-105
      `}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {suffix && <div className="text-sm text-white/80">{suffix}</div>}
      <div className="text-xs text-white/90 mt-1 font-medium">{label}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/10">
      <span className="text-blue-200">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
