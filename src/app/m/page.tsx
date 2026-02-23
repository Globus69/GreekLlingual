"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { useStatsData } from '@/hooks/use-stats-data';
import { TrainWeakWordsSheet } from '@/components/mobile/TrainWeakWordsSheet';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import VocabularyDialog from '@/components/learning/vocabulary-dialog';
import DailyPhrasesDialog from '@/components/learning/daily-phrases-dialog';
import DueCardsDialog from '@/components/learning/due-cards-dialog';
import WeakWordsDialog from '@/components/learning/weak-words-dialog';
import GrammarDialog from '@/components/learning/grammar-dialog';
import '@/styles/liquid-glass.css';

export default function MobileDashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showWeakWordsSheet, setShowWeakWordsSheet] = useState(false);
  const [showDueCardsSheet, setShowDueCardsSheet] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showWeakWordsDialog, setShowWeakWordsDialog] = useState(false);
  const [showDailyPhrasesDialog, setShowDailyPhrasesDialog] = useState(false);
  const [showGrammarDialog, setShowGrammarDialog] = useState(false);
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
  const { stats, loading: statsLoading, refetch } = useStatsData(user?.id);

  // Zentrale Refresh-Funktion für das Dashboard
  const handleRefresh = async () => {
    console.log('🔄 Refreshing dashboard stats...');
    await refetch();
  };

  useEffect(() => {
    // Refresh stats when window gets focus (user returns to tab)
    const handleFocus = () => handleRefresh();
    window.addEventListener('focus', handleFocus);

    if (!authLoading) {
      const storedUser = localStorage.getItem('greeklingua_user');
      // Lade User aus localStorage, falls AuthContext keinen hat
      if (!authUser && storedUser && !localUser) {
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

    return () => window.removeEventListener('focus', handleFocus);
  }, [authUser, authLoading, router, localUser]);

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
          padding: '6px 16px',
          paddingTop: 'calc(6px + env(safe-area-inset-top))'
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
      <div style={{ maxWidth: '448px', margin: '0 auto', padding: '24px 24px 36px' }}>
        {/* Welcome - COMPACT VERSION */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '33px', fontWeight: 'bold', color: 'white', marginBottom: '0' }}>
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
              minHeight: '84px',
              padding: '15px 21px',
              borderRadius: '21px',
              backgroundColor: 'rgba(255, 204, 0, 0.2)',
              border: '1px solid rgba(255, 204, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              marginBottom: '18px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {/* DEBUG: Button ID */}
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: 'rgba(255, 204, 0, 0.3)',
              color: '#FFCC00',
              fontSize: '9px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '4px',
              lineHeight: '1'
            }}>
              #A1
            </span>
            <span style={{ fontSize: '42px' }}>🔓</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '23px', color: '#FFCC00' }}>Admin Panel</div>
              <div style={{ fontSize: '17px', color: 'rgba(255, 204, 0, 0.7)' }}>Manage users</div>
            </div>
            <span style={{ fontSize: '18px', color: '#FFCC00', opacity: 0.5 }}>→</span>
          </button>
        )}

        {/* 1-Column Layout - 6 Modules (Extras moved to Bottom Nav) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {/* Main Learning Tiles */}
          <ModuleTile
            icon="📅"
            title="Due Cards Today"
            subtitle={`${stats.dueCount} waiting`}
            color="blue"
            onClick={() => setShowDueCardsSheet(true)}
          />
          <ModuleTile
            icon="📖"
            title="Review Vocab"
            subtitle={stats.reviewCount > 0 ? `${stats.reviewCount} to review` : "All caught up!"}
            color={stats.reviewCount > 0 ? 'light-orange' : 'weak-green'}
            onClick={() => setShowReviewDialog(true)}
          />
          <ModuleTile
            icon="💪"
            title="Weak Words"
            subtitle={stats.weakCount > 0 ? `${stats.weakCount} difficult words` : "No weak words!"}
            color={stats.weakCount > 0 ? 'light-red' : 'weak-green'}
            onClick={() => setShowWeakWordsDialog(true)}
          />
          <ModuleTile
            icon="💬"
            title="Daily Phrases"
            subtitle="Useful phrases"
            color="purple"
            disabled={true}
            onClick={() => { }}
          />
          {/* Grammar - DISABLED (grau, kein Action) */}
          <ModuleTile
            icon="📐"
            title="Grammar"
            subtitle="Practice rules"
            color="orange"
            disabled={true}
            onClick={() => { }}
          />

          {/* Brain Gym - NEW (Memory Training) */}
          <ModuleTile
            icon="🧠"
            title="Brain Gym"
            subtitle="Memory Training"
            color="orange"
            onClick={() => router.push('/m/brain-gym')}
          />

          {/* Cloze Test - NEW */}
          <ModuleTile
            icon="📝"
            title="Cloze Test"
            subtitle="Fill in the blanks"
            color="blue"
            disabled={true}
            onClick={() => { }}
          />

          {/* Spiele - DISABLED (grau, kein Action) */}
          <ModuleTile
            icon="🎮"
            title="Spiele"
            subtitle="Games & Practice"
            color="purple"
            disabled={true}
            onClick={() => { }}
          />
        </div>

      </div>

      {/* Bottom Navigation Component */}
      <MobileBottomNav />

      {/* Bottom Sheets */}
      <TrainWeakWordsSheet
        isOpen={showWeakWordsSheet}
        onClose={() => setShowWeakWordsSheet(false)}
      />

      {/* Review Vocabulary Dialog (FSRS-6) */}
      {showReviewDialog && user?.id && (
        <VocabularyDialog
          isOpen={showReviewDialog}
          onClose={() => {
            setShowReviewDialog(false);
            handleRefresh();
          }}
          mode="all"
        />
      )}

      {/* Train Weak Words Dialog */}
      {showWeakWordsDialog && (
        <WeakWordsDialog
          isOpen={showWeakWordsDialog}
          onClose={() => {
            setShowWeakWordsDialog(false);
            handleRefresh();
          }}
        />
      )}

      {/* Daily Phrases Dialog */}
      {showDailyPhrasesDialog && (
        <DailyPhrasesDialog
          isOpen={showDailyPhrasesDialog}
          onClose={() => {
            setShowDailyPhrasesDialog(false);
            handleRefresh();
          }}
        />
      )}

      {/* Due Cards Dialog */}
      {showDueCardsSheet && (
        <DueCardsDialog
          isOpen={showDueCardsSheet}
          onClose={() => {
            setShowDueCardsSheet(false);
            handleRefresh();
          }}
          onOpenReview={() => setShowReviewDialog(true)}
          onOpenWeakWords={() => setShowWeakWordsDialog(true)}
        />
      )}

      {/* Grammar Dialog */}
      {showGrammarDialog && (
        <GrammarDialog
          isOpen={showGrammarDialog}
          onClose={() => setShowGrammarDialog(false)}
        />
      )}
    </div>
  );
}

interface ModuleTileProps {
  debugId?: string;
  icon: string;
  title: string;
  subtitle: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'weak-green' | 'light-orange' | 'light-red';
  disabled?: boolean;
  onClick: () => void;
}

function ModuleTile({ debugId, icon, title, subtitle, color, disabled, onClick }: ModuleTileProps) {
  const colors = {
    blue: { bg: 'rgba(0, 122, 255, 0.25)', border: 'rgba(0, 122, 255, 0.5)', text: '#007AFF' },
    green: { bg: 'rgba(46, 214, 26, 0.25)', border: 'rgba(46, 214, 26, 0.5)', text: '#2ED61A' },
    orange: { bg: 'rgba(255, 159, 10, 0.25)', border: 'rgba(255, 159, 10, 0.5)', text: '#FF9F0A' },
    purple: { bg: 'rgba(191, 90, 242, 0.25)', border: 'rgba(191, 90, 242, 0.5)', text: '#BF5AF2' },
    'weak-green': { bg: 'rgba(46, 214, 26, 0.15)', border: 'rgba(46, 214, 26, 0.3)', text: 'rgba(46, 214, 26, 0.8)' },
    'light-orange': { bg: 'rgba(255, 159, 10, 0.3)', border: 'rgba(255, 159, 10, 0.6)', text: '#FF9F0A' },
    'light-red': { bg: 'rgba(255, 69, 58, 0.3)', border: 'rgba(255, 69, 58, 0.6)', text: '#FF453A' },
  };

  // If disabled, override with gray colors
  const c = disabled
    ? { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)', text: '#666666' }
    : colors[color];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: '72px',
        padding: '12px 15px',
        borderRadius: '18px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        position: 'relative'
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
      {/* DEBUG: Button ID */}
      {debugId && (
        <span style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          color: c.text,
          fontSize: '9px',
          fontWeight: 'bold',
          padding: '2px 5px',
          borderRadius: '4px',
          lineHeight: '1'
        }}>
          #{debugId}
        </span>
      )}
      <span style={{ fontSize: '36px' }}>{icon}</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold', fontSize: '20px', color: 'white', lineHeight: '1.2' }}>{title}</div>
        <div style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>{subtitle}</div>
      </div>
      {!disabled && (
        <span style={{ fontSize: '24px', color: c.text, opacity: 0.7 }}>→</span>
      )}
    </button>
  );
}
