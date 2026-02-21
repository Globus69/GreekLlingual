'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/use-translation';
import { useStatsData, formatStudyTime } from '@/hooks/use-stats-data';
import WeeklyActivityChart from '@/components/weekly-activity-chart';
import DetailedStatsRadar from '@/components/detailed-stats-radar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function StatsPage() {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0F0F11' }}>
      {/* Dashboard Header */}
      <DashboardHeader />

      <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '20px',
              color: 'white',
              cursor: 'pointer',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: 0, marginBottom: '6px' }}>
              📊 {t('perf.title') || 'Performance Statistics'}
            </h1>
            <p style={{ fontSize: '16px', color: '#93C5FD', margin: 0 }}>
              {user?.name || 'Student'} · Your learning progress and achievements
            </p>
          </div>
        </div>

        {/* Main Stats Grid - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
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

        {/* Two-Column Layout for Desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}>
          {/* Detailed Stats */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '28px',
          }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '20px', marginTop: 0 }}>
              📈 Detailed Statistics
            </h2>

            {/* Radar Chart Component */}
            <DetailedStatsRadar stats={stats} />
            <div style={{ marginTop: '24px' }} />

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
            padding: '28px',
          }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '20px', marginTop: 0 }}>
              📊 Weekly Activity
            </h2>
            <WeeklyActivityChart data={stats.weeklyActivity || []} />
          </div>
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
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '140px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>{value}</div>
      {suffix && <div style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '4px' }}>{suffix}</div>}
      <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' }}>{label}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <span style={{ color: '#93C5FD', fontSize: '15px' }}>{label}</span>
      <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{value}</span>
    </div>
  );
}
