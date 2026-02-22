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
  const { stats, loading: statsLoading } = useStatsData(user?.id);

  useEffect(() => {
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
            <span style={{ fontSize: '28px' }}>🔓</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#FFCC00' }}>Admin Panel</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 204, 0, 0.7)' }}>Manage users</div>
            </div>
            <span style={{ fontSize: '18px', color: '#FFCC00', opacity: 0.5 }}>→</span>
          </button>
        )}

        {/* 1-Column Layout - 6 Modules (Extras moved to Bottom Nav) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '8px',
          marginBottom: '16px'
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
          <ModuleTile
            icon="💬"
            title="Daily Phrases"
            subtitle="Useful phrases"
            color="purple"
            onClick={() => setShowDailyPhrasesDialog(true)}
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
          onClose={() => setShowReviewDialog(false)}
          mode="all"
        />
      )}

      {/* Train Weak Words Dialog */}
      {showWeakWordsDialog && (
        <WeakWordsDialog
          isOpen={showWeakWordsDialog}
          onClose={() => setShowWeakWordsDialog(false)}
        />
      )}

      {/* Daily Phrases Dialog */}
      {showDailyPhrasesDialog && (
        <DailyPhrasesDialog
          isOpen={showDailyPhrasesDialog}
          onClose={() => setShowDailyPhrasesDialog(false)}
        />
      )}

      {/* Due Cards Dialog */}
      {showDueCardsSheet && (
        <DueCardsDialog
          isOpen={showDueCardsSheet}
          onClose={() => setShowDueCardsSheet(false)}
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
  color: 'blue' | 'green' | 'orange' | 'purple';
  disabled?: boolean;
  onClick: () => void;
}

function ModuleTile({ debugId, icon, title, subtitle, color, disabled, onClick }: ModuleTileProps) {
  const colors = {
    blue: { bg: 'rgba(0, 122, 255, 0.25)', border: 'rgba(0, 122, 255, 0.5)', text: '#007AFF' },
    green: { bg: 'rgba(52, 199, 89, 0.25)', border: 'rgba(52, 199, 89, 0.5)', text: '#34C759' },
    orange: { bg: 'rgba(255, 159, 10, 0.25)', border: 'rgba(255, 159, 10, 0.5)', text: '#FF9F0A' },
    purple: { bg: 'rgba(191, 90, 242, 0.25)', border: 'rgba(191, 90, 242, 0.5)', text: '#BF5AF2' },
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
