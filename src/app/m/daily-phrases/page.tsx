'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/use-translation';
import { supabase } from '@/db/supabase';

// Types
interface DailyPhrase {
  id: string;
  greek: string;
  english: string;
  category: string;
  difficulty: string;
  progress?: {
    is_learned: boolean;
    due_date: string;
  };
}

export default function MobileDailyPhrasesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [phrases, setPhrases] = useState<DailyPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhrase, setExpandedPhrase] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login-pin');
    }
  }, [mounted, isAuthenticated, router]);

  // Fetch daily phrases
  useEffect(() => {
    const fetchPhrases = async () => {
      if (!user?.id) return;

      try {
        // Fetch 3 phrases for today (could be based on date/rotation logic)
        const { data, error } = await supabase
          .from('phrases')
          .select(`
            id,
            greek,
            english,
            category,
            difficulty
          `)
          .limit(3);

        if (error) {
          console.error('Error fetching phrases:', error);
          // Use mock data on error
          setPhrases(getMockPhrases());
        } else {
          setPhrases(data || getMockPhrases());
        }
      } catch (err) {
        console.error('Error:', err);
        setPhrases(getMockPhrases());
      } finally {
        setLoading(false);
      }
    };

    if (mounted && user?.id) {
      fetchPhrases();
    }
  }, [mounted, user?.id]);

  // Mark phrase as learned
  const handleMarkAsLearned = async (phraseId: string) => {
    if (!user?.id) return;

    try {
      // Insert or update phrase_progress
      const { error } = await supabase
        .from('phrase_progress')
        .upsert({
          student_id: user.id,
          phrase_id: phraseId,
          correct_count: 1,
          attempts: 1,
          last_reviewed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,phrase_id'
        });

      if (error) {
        console.error('Error marking as learned:', error);
        alert('Could not save progress');
      } else {
        // Update local state
        setPhrases(prev => prev.map(p =>
          p.id === phraseId
            ? { ...p, progress: { is_learned: true, due_date: new Date().toISOString() }}
            : p
        ));
        alert('✅ Marked as learned!');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error saving progress');
    }
  };

  // Text-to-Speech
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'el-GR'; // Greek
      utterance.rate = 0.8; // Slower for learning
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-Speech not supported in this browser');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0F0F11',
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading phrases...</div>
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
            minWidth: '44px',
            minHeight: '44px',
          }}
          aria-label="Back to home"
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0, marginBottom: '4px' }}>
            📅 Daily Phrases
          </h1>
          <p style={{ fontSize: '14px', color: '#93C5FD', margin: 0 }}>
            Today's Greek expressions
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
      }}>
        <p style={{ color: '#93C5FD', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
          💡 Learn 3 new Greek phrases every day. Tap the speaker icon to hear pronunciation. Mark phrases as learned to track your progress.
        </p>
      </div>

      {/* Phrase Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {phrases.map((phrase, index) => (
          <PhraseCard
            key={phrase.id}
            phrase={phrase}
            index={index}
            isExpanded={expandedPhrase === phrase.id}
            onToggleExpand={() => setExpandedPhrase(expandedPhrase === phrase.id ? null : phrase.id)}
            onSpeak={handleSpeak}
            onMarkAsLearned={handleMarkAsLearned}
          />
        ))}
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
              minHeight: '44px',
            }}
          >
            <span style={{ fontSize: '24px' }}>🏠</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Home</span>
          </button>
          <button
            onClick={() => router.push('/m/daily-phrases')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            <span style={{ fontSize: '24px' }}>📅</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#007AFF' }}>Phrases</span>
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
              minHeight: '44px',
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Phrase Card Component
function PhraseCard({
  phrase,
  index,
  isExpanded,
  onToggleExpand,
  onSpeak,
  onMarkAsLearned,
}: {
  phrase: DailyPhrase;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSpeak: (text: string) => void;
  onMarkAsLearned: (id: string) => void;
}) {
  const timeOfDay = ['🌅 Morning', '☀️ Afternoon', '🌙 Evening'][index] || '📚 Daily';

  // Difficulty colors
  const difficultyColor = {
    easy: '#22C55E',
    medium: '#EAB308',
    hard: '#EF4444',
  }[phrase.difficulty] || '#3B82F6';

  const isLearned = phrase.progress?.is_learned || false;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Card Header */}
      <div
        onClick={onToggleExpand}
        style={{
          padding: '20px',
          cursor: 'pointer',
          minHeight: '88px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Time Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#93C5FD', fontWeight: '600' }}>
            {timeOfDay}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '600',
                color: difficultyColor,
                backgroundColor: `${difficultyColor}20`,
                padding: '4px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}
            >
              {phrase.difficulty}
            </span>
            {isLearned && (
              <span style={{ fontSize: '18px' }}>✅</span>
            )}
          </div>
        </div>

        {/* English */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '16px', color: 'white', margin: 0, fontWeight: '500' }}>
              {phrase.english}
            </p>
          </div>
        </div>

        {/* Greek */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '18px', color: '#007AFF', margin: 0, fontWeight: '600' }}>
              {phrase.greek}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSpeak(phrase.greek);
            }}
            style={{
              background: 'rgba(0, 122, 255, 0.2)',
              border: '1px solid rgba(0, 122, 255, 0.4)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Play audio"
          >
            🔊
          </button>
        </div>

        {/* Expand Indicator */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8E8E93' }}>
            {isExpanded ? '▲ Tap to collapse' : '▼ Tap for details'}
          </span>
        </div>
      </div>

      {/* Expanded Content (Bottom Sheet) */}
      {isExpanded && (
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Category */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#93C5FD', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
              Category
            </p>
            <p style={{ fontSize: '14px', color: 'white', margin: 0, fontWeight: '500' }}>
              📂 {phrase.category}
            </p>
          </div>

          {/* Example Usage */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#93C5FD', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              Usage Example
            </p>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <p style={{ fontSize: '14px', color: 'white', margin: 0, lineHeight: '1.6' }}>
                Use this phrase in everyday conversations. Practice saying it out loud several times.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => onSpeak(phrase.greek)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 122, 255, 0.2)',
                border: '1px solid rgba(0, 122, 255, 0.4)',
                borderRadius: '12px',
                padding: '16px',
                color: '#007AFF',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              🔊 Play Again
            </button>
            <button
              onClick={() => onMarkAsLearned(phrase.id)}
              disabled={isLearned}
              style={{
                flex: 1,
                backgroundColor: isLearned ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                border: `1px solid ${isLearned ? 'rgba(34, 197, 94, 0.6)' : 'rgba(34, 197, 94, 0.4)'}`,
                borderRadius: '12px',
                padding: '16px',
                color: '#22C55E',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLearned ? 'not-allowed' : 'pointer',
                opacity: isLearned ? 0.6 : 1,
                minHeight: '44px',
              }}
            >
              {isLearned ? '✅ Learned' : '✓ Mark Learned'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data fallback
function getMockPhrases(): DailyPhrase[] {
  return [
    {
      id: 'mock-1',
      greek: 'Καλημέρα!',
      english: 'Good morning!',
      category: 'Greetings',
      difficulty: 'easy',
    },
    {
      id: 'mock-2',
      greek: 'Ευχαριστώ πολύ',
      english: 'Thank you very much',
      category: 'Courtesy',
      difficulty: 'easy',
    },
    {
      id: 'mock-3',
      greek: 'Πού είναι η τουαλέτα;',
      english: 'Where is the restroom?',
      category: 'Directions',
      difficulty: 'medium',
    },
  ];
}
