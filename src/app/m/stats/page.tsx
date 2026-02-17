'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/use-translation';
import { useStatsData, formatStudyTime } from '@/hooks/use-stats-data';
import WeeklyActivityChart from '@/components/weekly-activity-chart';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

export default function MobileStatsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const { stats, loading } = useStatsData(mounted ? user?.id : undefined);
  const [focusedSection, setFocusedSection] = useState<'detailed' | 'weekly' | null>(null);

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F11',
      padding: '12px',
      paddingBottom: '80px',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '12px',
        paddingBottom: '16px',
        marginBottom: '8px'
      }}>
        <button
          onClick={() => router.push('/m')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: 'white',
            cursor: 'pointer',
            padding: 0,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: 'clamp(18px, 5vw, 24px)',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            📊 {t('perf.title') || 'Performance Statistics'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#93C5FD',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user?.name || 'Student'}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '8px',
        marginBottom: '12px',
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

      {/* Focused Section Backdrop */}
      {focusedSection && (
        <div
          onClick={() => setFocusedSection(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 60,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Side-by-Side Stats Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '8px',
        marginBottom: '12px',
      }}>
        {/* Detailed Stats */}
        <div
          onClick={() => setFocusedSection(focusedSection === 'detailed' ? null : 'detailed')}
          style={focusedSection === 'detailed' ? {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '380px',
            maxHeight: '80vh',
            zIndex: 70,
            backgroundColor: '#1C1C1E',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflowY: 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation'
          } : {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px 12px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '110px',
            touchAction: 'manipulation'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
            <h2 style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', color: 'white', margin: 0 }}>📈 Stats</h2>
            <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: '#93C5FD' }}>
              {focusedSection === 'detailed' ? 'Tap to close' : 'Tap to view'}
            </span>
          </div>

          {focusedSection === 'detailed' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out', marginTop: '16px', textAlign: 'left' }}>
              <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 'bold', color: 'white', marginBottom: '12px', marginTop: 0 }}>Detailed Stats</h2>
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
          )}
        </div>

        {/* Weekly Activity Chart */}
        <div
          onClick={() => setFocusedSection(focusedSection === 'weekly' ? null : 'weekly')}
          style={focusedSection === 'weekly' ? {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '380px',
            zIndex: 70,
            backgroundColor: '#1C1C1E',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation'
          } : {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px 12px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '110px',
            touchAction: 'manipulation'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
            <h2 style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', color: 'white', margin: 0 }}>📊 Activity</h2>
            <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: '#93C5FD' }}>
              {focusedSection === 'weekly' ? 'Tap to close' : 'Tap to view'}
            </span>
          </div>

          {focusedSection === 'weekly' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out', marginTop: '16px' }}>
              <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 'bold', color: 'white', marginBottom: '12px', marginTop: 0 }}>Weekly Activity</h2>
              <WeeklyActivityChart data={stats.weeklyActivity || []} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
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
        borderRadius: '12px',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '110px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease',
        touchAction: 'manipulation',
      }}
    >
      <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: '4px' }}>{icon}</div>
      <div style={{
        fontSize: 'clamp(22px, 5vw, 28px)',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '2px',
        lineHeight: 1.2
      }}>{value}</div>
      {suffix && <div style={{
        fontSize: 'clamp(11px, 2.5vw, 13px)',
        color: 'rgba(255, 255, 255, 0.8)',
        whiteSpace: 'nowrap'
      }}>{suffix}</div>}
      <div style={{
        fontSize: 'clamp(10px, 2.5vw, 12px)',
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: '2px',
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 1.2
      }}>{label}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      gap: '12px',
    }}>
      <span style={{
        color: '#93C5FD',
        fontSize: 'clamp(13px, 3.5vw, 14px)',
        flex: 1,
        minWidth: 0
      }}>{label}</span>
      <span style={{
        color: 'white',
        fontWeight: '600',
        fontSize: 'clamp(13px, 3.5vw, 15px)',
        whiteSpace: 'nowrap'
      }}>{value}</span>
    </div>
  );
}
