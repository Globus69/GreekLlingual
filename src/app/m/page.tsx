"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { useStatsData } from '@/hooks/use-stats-data';
import { TrainWeakWordsSheet } from '@/components/mobile/TrainWeakWordsSheet';
import { DueCardsSheet } from '@/components/mobile/DueCardsSheet';
import '@/styles/liquid-glass.css';

export default function MobileDashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showWeakWordsSheet, setShowWeakWordsSheet] = useState(false);
  const [showDueCardsSheet, setShowDueCardsSheet] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Fallback: Lade User aus localStorage, falls AuthContext keinen hat
  const [localUser, setLocalUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('greeklingua_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error('Error parsing initial user:', error);
        }
      }
    }
    return null;
  });

  const user = authUser || localUser;

  // Verwende den zentralen Stats Hook
  const { stats, loading: statsLoading } = useStatsData(user?.id);

  useEffect(() => {
    if (!authLoading) {
      const storedUser = localStorage.getItem('greeklingua_user');

      // Lade User aus localStorage, falls AuthContext keinen hat
      if (!authUser && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('🔍 Loading user from localStorage:', parsedUser);
          setLocalUser(parsedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }

      console.log('🔍 Debug User:', { authUser, localUser, storedUser: storedUser ? JSON.parse(storedUser) : null });

      if (!authUser && !storedUser) {
        router.push('/login-pin');
      }
    }
  }, [authUser, authLoading, router]);

  if (statsLoading || authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F0F11'
      }}>
        <div style={{ fontSize: '20px', color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F0F11', paddingBottom: '80px' }}>
      {/* Stats Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 16px'
        }}
        onClick={() => setShowDetailedStats(!showDetailedStats)}
      >
        <div style={{ maxWidth: '448px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '24px' }}>🔥</span>
              <span style={{ fontWeight: 'bold', color: 'white' }}>{stats.streak}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '24px' }}>📚</span>
              <span style={{ fontWeight: 'bold', color: '#007AFF' }}>{stats.dueCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '24px' }}>⭐</span>
              <span style={{ fontWeight: 'bold', color: '#FFD60A' }}>{stats.level}</span>
            </div>
          </div>
          <div style={{ color: '#8E8E93' }}>
            {showDetailedStats ? '▲' : '▼'}
          </div>
        </div>

        {showDetailedStats && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '14px', color: '#8E8E93' }}>
            <div style={{ maxWidth: '448px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Total Words Learned:</span>
                <span style={{ fontWeight: '600', color: 'white' }}>{stats.totalWords}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Current Level:</span>
                <span style={{ fontWeight: '600', color: 'white' }}>{stats.level}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '448px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Welcome */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
            Welcome, {(() => {
              const name = user?.name;
              console.log('🔍 User name:', name, 'Full user:', user);
              return name ? name.split(' ')[0] : 'Student';
            })()}! 👋
          </h1>
        </div>

        {/* Admin Panel */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <button
            onClick={() => router.push('/m/admin/unlock')}
            style={{
              width: '100%',
              minHeight: '64px',
              padding: '12px 16px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 204, 0, 0.2)',
              border: '1px solid rgba(255, 204, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '32px' }}>🔓</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#FFCC00' }}>Admin Panel</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 204, 0, 0.7)' }}>User entsperren</div>
            </div>
            <span style={{ fontSize: '20px', color: '#FFCC00', opacity: 0.5 }}>→</span>
          </button>
        )}

        {/* Module: Due Cards */}
        <ModuleTile
          icon="📅"
          title="Due Cards Today"
          subtitle={`${stats.dueCount} cards waiting`}
          color="blue"
          onClick={() => setShowDueCardsSheet(true)}
        />

        {/* Module: Review */}
        <ModuleTile
          icon="📖"
          title="Review Vocabulary"
          subtitle="practice_learned_words"
          color="green"
          onClick={() => alert('Review - Coming soon!')}
        />

        {/* Module: Weak Words */}
        <ModuleTile
          icon="💪"
          title="Train Weak Words"
          subtitle="focus_on_difficult"
          color="orange"
          onClick={() => setShowWeakWordsSheet(true)}
        />

        {/* Module: Daily Phrases */}
        <ModuleTile
          icon="💬"
          title="Daily Phrases"
          subtitle="learn_useful_phrases"
          color="purple"
          onClick={() => alert('Daily Phrases - Coming soon!')}
        />

        {/* Module: 20 min Quick Lesson */}
        <ModuleTile
          icon="⚡"
          title="20 min Quick Lesson"
          subtitle="Fast-paced learning session"
          color="blue"
          onClick={() => alert('Quick Lesson - Coming soon!')}
        />

        {/* Module: Test */}
        <ModuleTile
          icon="📝"
          title="Test"
          subtitle="Check your knowledge"
          color="orange"
          onClick={() => alert('Test - Coming soon!')}
        />

        {/* Module: Quiz go ahead */}
        <ModuleTile
          icon="🎯"
          title="Quiz go ahead"
          subtitle="Challenge yourself with quick quizzes"
          color="green"
          onClick={() => alert('Quiz - Coming soon!')}
        />

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
          padding: '8px 16px 12px'
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
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '24px' }}>🏠</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#007AFF' }}>Home</span>
          </button>
          <button
            onClick={() => alert('Stats - Coming soon!')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Stats</span>
          </button>
          <button
            onClick={() => alert('Settings - Coming soon!')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '24px' }}>⚙️</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Settings</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheets */}
      <TrainWeakWordsSheet
        isOpen={showWeakWordsSheet}
        onClose={() => setShowWeakWordsSheet(false)}
      />
      <DueCardsSheet
        isOpen={showDueCardsSheet}
        onClose={() => setShowDueCardsSheet(false)}
        dueCount={stats.dueCount}
      />
    </div>
  );
}

interface ModuleTileProps {
  icon: string;
  title: string;
  subtitle: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  disabled?: boolean;
  onClick: () => void;
}

function ModuleTile({ icon, title, subtitle, color, disabled, onClick }: ModuleTileProps) {
  const colors = {
    blue: { bg: 'rgba(0, 122, 255, 0.25)', border: 'rgba(0, 122, 255, 0.5)', text: '#007AFF' },
    green: { bg: 'rgba(52, 199, 89, 0.25)', border: 'rgba(52, 199, 89, 0.5)', text: '#34C759' },
    orange: { bg: 'rgba(255, 159, 10, 0.25)', border: 'rgba(255, 159, 10, 0.5)', text: '#FF9F0A' },
    purple: { bg: 'rgba(191, 90, 242, 0.25)', border: 'rgba(191, 90, 242, 0.5)', text: '#BF5AF2' },
  };

  const c = colors[color];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: '64px',
        padding: '12px 16px',
        borderRadius: '16px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '12px',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>{subtitle}</div>
      </div>
      {!disabled && (
        <span style={{ fontSize: '20px', color: c.text, opacity: 0.7 }}>→</span>
      )}
    </button>
  );
}
