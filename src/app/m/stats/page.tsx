'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/use-translation';
import { useStatsData, formatStudyTime } from '@/hooks/use-stats-data';
import WeeklyActivityChart from '@/components/weekly-activity-chart';

export default function MobileStatsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const { stats, loading } = useStatsData(mounted ? user?.id : undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login-pin');
    }
  }, [mounted, isAuthenticated, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0F0F11',
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading statistics...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F0F11', padding: '16px', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px', paddingBottom: '24px' }}>
        <button
          onClick={() => router.push('/m')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: 'white',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0, marginBottom: '4px' }}>
            📊 {t('perf.title') || 'Performance Statistics'}
          </h1>
          <p style={{ fontSize: '14px', color: '#93C5FD', margin: 0 }}>
            {user?.name || 'Student'}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
      }}>
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
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px', marginTop: 0 }}>📈 Detailed Statistics</h2>

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
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px', marginTop: 0 }}>📊 Weekly Activity</h2>
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
  const colorMap: { [key: string]: string } = {
    'from-orange-500 to-red-500': 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    'from-blue-500 to-purple-500': 'linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)',
    'from-green-500 to-emerald-500': 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
    'from-yellow-500 to-orange-500': 'linear-gradient(135deg, #EAB308 0%, #F97316 100%)',
    'from-pink-500 to-rose-500': 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
    'from-cyan-500 to-blue-500': 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
  };

  return (
    <div
      style={{
        background: colorMap[color] || '#3B82F6',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ fontSize: '36px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '30px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{value}</div>
      {suffix && <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>{suffix}</div>}
      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', marginTop: '4px', fontWeight: '500' }}>{label}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <span style={{ color: '#93C5FD' }}>{label}</span>
      <span style={{ color: 'white', fontWeight: '600' }}>{value}</span>
    </div>
  );
}
