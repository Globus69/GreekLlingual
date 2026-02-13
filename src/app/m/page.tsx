"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/useTranslation';
import { supabase } from '@/db/supabase';
import '@/styles/liquid-glass.css';

/**
 * Mobile Dashboard - Hauptseite der Mobile Web App
 *
 * Features:
 * - 4 Kernmodule: Due Cards, Review, Train Weak Words, Daily Phrases
 * - Minimal Statistics Header (Streak, Due Count, Level)
 * - Touch-optimierte Buttons (min 56px Höhe)
 * - Glassmorphism Design (reduziert für Mobile Performance)
 *
 * Architektur:
 * - Wiederverwendet AuthContext, LanguageContext, useTranslation
 * - Shared Supabase Client
 * - Shared Styles (liquid-glass.css)
 */

interface MobileStats {
  streak: number;
  dueCount: number;
  level: string;
  totalWords: number;
}

export default function MobileDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MobileStats>({
    streak: 0,
    dueCount: 0,
    level: 'A1',
    totalWords: 0,
  });
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Auth Guard: Redirect wenn nicht eingeloggt
  useEffect(() => {
    if (!authLoading) {
      // Check localStorage als Fallback (für Race-Condition)
      const storedUser = localStorage.getItem('greeklingua_user');

      if (!user && !storedUser) {
        router.push('/login-pin');
        return;
      }
      fetchMobileStats();
      setLoading(false);
    }
  }, [user, authLoading, router]);

  /**
   * Lädt minimale Statistiken für Mobile Header
   */
  const fetchMobileStats = async () => {
    try {
      if (!user?.id) return;

      // Streak berechnen (Placeholder - später aus DB)
      const streak = 5; // TODO: Aus student_progress berechnen

      // Due Count: Vokabeln die heute fällig sind
      const { data: dueItems } = await supabase
        .from('student_progress')
        .select('id')
        .eq('student_id', user.id)
        .lte('next_review', new Date().toISOString())
        .limit(100);

      // Total Words (gelernt)
      const { data: totalItems } = await supabase
        .from('student_progress')
        .select('id')
        .eq('student_id', user.id)
        .gte('correct_count', 1);

      // Level (aus student.level)
      const { data: studentData } = await supabase
        .from('students')
        .select('level')
        .eq('id', user.id)
        .single();

      setStats({
        streak,
        dueCount: dueItems?.length || 0,
        level: studentData?.level || 'A1',
        totalWords: totalItems?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching mobile stats:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* ========================================
          MOBILE STATS HEADER (Minimal)
          Tap zum Erweitern (X1 - später)
          ======================================== */}
      <div
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 py-3"
        onClick={() => setShowDetailedStats(!showDetailedStats)}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-4">
            {/* Streak */}
            <div className="flex items-center gap-1">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-gray-800">{stats.streak}</span>
            </div>

            {/* Due Count */}
            <div className="flex items-center gap-1">
              <span className="text-2xl">📚</span>
              <span className="font-bold text-blue-600">{stats.dueCount}</span>
            </div>

            {/* Level */}
            <div className="flex items-center gap-1">
              <span className="text-2xl">⭐</span>
              <span className="font-bold text-purple-600">{stats.level}</span>
            </div>
          </div>

          {/* Expand Icon */}
          <div className="text-gray-400">
            {showDetailedStats ? '▲' : '▼'}
          </div>
        </div>

        {/* X1: Detailed Stats (später implementieren) */}
        {showDetailedStats && (
          <div className="mt-3 pt-3 border-t border-gray-200/50 text-sm text-gray-600">
            <div className="max-w-md mx-auto space-y-1">
              <div className="flex justify-between">
                <span>Total Words Learned:</span>
                <span className="font-semibold">{stats.totalWords}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Level:</span>
                <span className="font-semibold">{stats.level}</span>
              </div>
              <div className="text-xs text-gray-400 mt-2 text-center">
                (More details coming soon)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================
          MAIN CONTENT: 4 Kernmodule
          ======================================== */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {t('welcome')}, {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-sm text-gray-600">
            {t('ready_to_learn') || 'Ready to learn Greek today?'}
          </p>
        </div>

        {/* Admin Panel Link (nur für Teacher/Admin) */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <div className="mb-4">
            <button
              onClick={() => router.push('/m/admin/unlock')}
              className="w-full min-h-[56px] px-4 py-3 rounded-xl border-2 border-yellow-200 bg-yellow-50 flex items-center gap-4 transition-all duration-200 active:scale-95 hover:shadow-md"
            >
              <div className="text-3xl flex-shrink-0">🔓</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-base text-yellow-700">
                  Admin Panel
                </div>
                <div className="text-xs text-yellow-600">
                  User entsperren
                </div>
              </div>
              <div className="text-xl text-yellow-600 opacity-50">→</div>
            </button>
          </div>
        )}

        {/* MODULE a) Due Cards today */}
        <ModuleTile
          icon="📅"
          title={t('due_cards_today') || 'Due Cards Today'}
          subtitle={`${stats.dueCount} ${t('cards_waiting') || 'cards waiting'}`}
          color="blue"
          disabled={stats.dueCount === 0}
          onClick={() => {
            // TODO: Navigate to Due Cards Dialog
            alert('Due Cards - Coming soon!');
          }}
        />

        {/* MODULE b) Review Vocabulary */}
        <ModuleTile
          icon="📖"
          title={t('review_vocabulary') || 'Review Vocabulary'}
          subtitle={t('practice_learned_words') || 'Practice learned words'}
          color="green"
          onClick={() => {
            // TODO: Navigate to Review Dialog
            alert('Review Vocabulary - Coming soon!');
          }}
        />

        {/* MODULE c) Train Weak Words */}
        <ModuleTile
          icon="💪"
          title={t('train_weak_words') || 'Train Weak Words'}
          subtitle={t('focus_on_difficult') || 'Focus on difficult words'}
          color="orange"
          onClick={() => {
            // TODO: Navigate to Weak Words Dialog
            alert('Train Weak Words - Coming soon!');
          }}
        />

        {/* MODULE e) Daily Phrases */}
        <ModuleTile
          icon="💬"
          title={t('daily_phrases') || 'Daily Phrases'}
          subtitle={t('learn_useful_phrases') || 'Learn useful phrases'}
          color="purple"
          onClick={() => {
            // TODO: Navigate to Daily Phrases Dialog (NEU entwickeln)
            alert('Daily Phrases - Coming soon!');
          }}
        />

        {/* Footer: Desktop Version Link */}
        <div className="pt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 underline"
          >
            {t('switch_to_desktop') || 'Switch to Desktop Version'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Module Tile Component
 * Touch-optimiert (56px Höhe)
 */
interface ModuleTileProps {
  icon: string;
  title: string;
  subtitle: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  disabled?: boolean;
  onClick: () => void;
}

function ModuleTile({ icon, title, subtitle, color, disabled, onClick }: ModuleTileProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        w-full min-h-[56px] px-4 py-3
        rounded-xl border-2
        flex items-center gap-4
        transition-all duration-200
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 hover:shadow-md'}
        ${colorClasses[color]}
      `}
    >
      {/* Icon */}
      <div className="text-3xl flex-shrink-0">
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 text-left">
        <div className="font-bold text-base">{title}</div>
        <div className="text-xs opacity-80">{subtitle}</div>
      </div>

      {/* Arrow */}
      {!disabled && (
        <div className="text-xl opacity-50">→</div>
      )}
    </button>
  );
}
