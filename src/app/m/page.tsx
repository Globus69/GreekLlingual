"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { useStatsData } from '@/hooks/use-stats-data';
import { TrainWeakWordsSheet } from '@/components/mobile/TrainWeakWordsSheet';
import { DueCardsSheet } from '@/components/mobile/DueCardsSheet';
import VocabularyDialogFSRS from '@/components/learning/VocabularyDialogFSRS';
import VocabularyDialog from '@/components/learning/VocabularyDialog';
import '@/styles/liquid-glass.css';

export default function MobileDashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showWeakWordsSheet, setShowWeakWordsSheet] = useState(false);
  const [showDueCardsSheet, setShowDueCardsSheet] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showWeakWordsDialog, setShowWeakWordsDialog] = useState(false);
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
      {/* Stats Header - COMPACT VERSION */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 16px'
        }}
        onClick={() => setShowDetailedStats(!showDetailedStats)}
      >
        <div style={{
          maxWidth: '448px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          {/* Compact one-line stats */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#E5E5E7',
            fontWeight: '500'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '18px' }}>🔥</span>
              <span style={{ fontWeight: 'bold', color: 'white' }}>{stats.streak}</span>
            </span>
            <span style={{ color: '#8E8E93' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '18px' }}>📚</span>
              <span style={{ fontWeight: 'bold', color: '#007AFF' }}>{stats.dueCount}</span>
            </span>
            <span style={{ color: '#8E8E93' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '18px' }}>⭐</span>
              <span style={{ fontWeight: 'bold', color: '#FFD60A' }}>{stats.level}</span>
            </span>
            {stats.totalWords > 0 && (
              <>
                <span style={{ color: '#8E8E93' }}>·</span>
                <span style={{ color: '#34C759', fontWeight: '600' }}>
                  {Math.round((stats.totalWords / (stats.totalWords + stats.dueCount)) * 100)}%
                </span>
              </>
            )}
          </div>
          <div style={{ color: '#8E8E93', fontSize: '14px' }}>
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
      <div style={{ maxWidth: '448px', margin: '0 auto', padding: '16px 16px 24px' }}>
        {/* Welcome - COMPACT VERSION */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '0' }}>
            Welcome, {(() => {
              const name = user?.name;
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
              minHeight: '56px',
              padding: '10px 14px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 204, 0, 0.2)',
              border: '1px solid rgba(255, 204, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '28px' }}>🔓</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#FFCC00' }}>Admin Panel</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 204, 0, 0.7)' }}>User entsperren</div>
            </div>
            <span style={{ fontSize: '18px', color: '#FFCC00', opacity: 0.5 }}>→</span>
          </button>
        )}

        {/* 2×6 Grid Layout - 12 Modules */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {/* Row 1 */}
          <ModuleTile
            icon="👩‍🏫"
            title="Magic Round"
            subtitle="Your lesson"
            color="purple"
            onClick={() => alert('Magic Round - Coming soon!')}
          />
          <ModuleTile
            icon="📅"
            title="Due Cards"
            subtitle={`${stats.dueCount} waiting`}
            color="blue"
            onClick={() => setShowDueCardsSheet(true)}
          />

          {/* Row 2 */}
          <ModuleTile
            icon="📖"
            title="Review Vocab"
            subtitle="Practice words"
            color="green"
            onClick={() => setShowReviewDialog(true)}
          />
          <ModuleTile
            icon="💪"
            title="Weak Words"
            subtitle="Train difficult"
            color="orange"
            onClick={() => setShowWeakWordsDialog(true)}
          />

          {/* Row 3 */}
          <ModuleTile
            icon="💬"
            title="Daily Phrases"
            subtitle="Useful phrases"
            color="purple"
            onClick={() => alert('Daily Phrases - Coming soon!')}
          />
          <ModuleTile
            icon="⚡"
            title="Quick Lesson"
            subtitle="20 min session"
            color="blue"
            onClick={() => alert('Quick Lesson - Coming soon!')}
          />

          {/* Row 4 */}
          <ModuleTile
            icon="📚"
            title="Short Stories"
            subtitle="Read & learn"
            color="green"
            onClick={() => alert('Short Stories - Coming soon!')}
          />
          <ModuleTile
            icon="📐"
            title="Grammar"
            subtitle="Practice rules"
            color="orange"
            onClick={() => alert('Grammar - Coming soon!')}
          />

          {/* Row 5 */}
          <ModuleTile
            icon="👂"
            title="Listening"
            subtitle="Audio practice"
            color="blue"
            onClick={() => alert('Listening - Coming soon!')}
          />
          <ModuleTile
            icon="🗣️"
            title="Pronunciation"
            subtitle="Speak Greek"
            color="purple"
            onClick={() => alert('Pronunciation - Coming soon!')}
          />

          {/* Row 6 */}
          <ModuleTile
            icon="📝"
            title="Test"
            subtitle="Check progress"
            color="orange"
            onClick={() => alert('Test - Coming soon!')}
          />
          <ModuleTile
            icon="📊"
            title="Progress"
            subtitle="View history"
            color="green"
            onClick={() => alert('Progress - Coming soon!')}
          />
        </div>

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

      {/* Review Vocabulary Dialog (FSRS-6) */}
      {showReviewDialog && user?.id && (
        <VocabularyDialogFSRS
          isOpen={showReviewDialog}
          onClose={() => setShowReviewDialog(false)}
          mode="all"
        />
      )}

      {/* Train Weak Words Dialog */}
      {showWeakWordsDialog && (
        <VocabularyDialog
          isOpen={showWeakWordsDialog}
          onClose={() => setShowWeakWordsDialog(false)}
          mode="weak"
        />
      )}
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
        minHeight: '48px',
        padding: '8px 10px',
        borderRadius: '12px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'white', lineHeight: '1.2' }}>{title}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '1px' }}>{subtitle}</div>
      </div>
      {!disabled && (
        <span style={{ fontSize: '16px', color: c.text, opacity: 0.7 }}>→</span>
      )}
    </button>
  );
}
