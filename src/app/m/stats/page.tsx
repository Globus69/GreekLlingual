'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/use-translation';
import { useStatsData, formatStudyTime } from '@/hooks/use-stats-data';
import WeeklyActivityChart from '@/components/weekly-activity-chart';

export default function MobileStatsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { stats, loading } = useStatsData(user?.id);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login-pin');
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 py-6">
        <button
          onClick={() => router.push('/m')}
          className="text-2xl text-white"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            📊 {t('perf.title') || 'Performance Statistics'}
          </h1>
          <p className="text-sm text-blue-200">
            {user?.name || 'Student'}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak */}
        <StatCard
          icon="🔥"
          label="Streak"
          value={stats.streak}
          suffix="days"
          color="from-orange-500 to-red-500"
        />

        {/* Total Words */}
        <StatCard
          icon="📚"
          label="Total Words"
          value={stats.totalWords}
          suffix="words"
          color="from-blue-500 to-purple-500"
        />

        {/* Learned */}
        <StatCard
          icon="✅"
          label="Learned"
          value={stats.progressOverview?.cards_learned || 0}
          suffix="words"
          color="from-green-500 to-emerald-500"
        />

        {/* Mastered */}
        <StatCard
          icon="⭐"
          label="Mastered"
          value={stats.progressOverview?.cards_mastered || 0}
          suffix="cards"
          color="from-yellow-500 to-orange-500"
        />

        {/* Due Today */}
        <StatCard
          icon="📅"
          label="Due Today"
          value={stats.dueCount}
          suffix="cards"
          color="from-pink-500 to-rose-500"
        />

        {/* Correct Rate */}
        <StatCard
          icon="🎯"
          label="Accuracy"
          value={Math.round(stats.correctRate || 0)}
          suffix="%"
          color="from-cyan-500 to-blue-500"
        />
      </div>

      {/* Detailed Stats */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">📈 Detailed Statistics</h2>

        <StatRow
          label="Total Reviews"
          value={stats.progressOverview?.total_reviews || 0}
        />
        <StatRow
          label="Total Sessions"
          value={stats.progressOverview?.total_sessions || 0}
        />
        <StatRow
          label="Study Time"
          value={formatStudyTime(stats.totalStudyTime || 0)}
        />
        <StatRow
          label="Avg Session"
          value={formatStudyTime(stats.avgSessionTime || 0)}
        />
        <StatRow
          label="Consistency"
          value={`${Math.round(stats.consistencyScore || 0)}%`}
        />
        <StatRow
          label="Improvement Rate"
          value={`${(stats.progressOverview?.improvement_rate || 0) > 0 ? '+' : ''}${Math.round(stats.progressOverview?.improvement_rate || 0)}%`}
        />
        <StatRow label="Level" value={stats.level} />
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">📊 Weekly Activity</h2>
        <WeeklyActivityChart data={stats.weeklyActivity || []} />
      </div>

      {/* Bottom Navigation */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 16px 12px',
        }}
      >
        <div style={{ maxWidth: '448px', margin: '0 auto', display: 'flex', justifyContent: 'space-around' }}>
          <button
            onClick={() => router.push('/m')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px' }}>🏠</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Home</span>
          </button>
          <button
            onClick={() => router.push('/m/stats')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#007AFF' }}>Stats</span>
          </button>
          <button
            onClick={() => router.push('/m/settings')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px' }}>⚙️</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Settings</span>
          </button>
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
