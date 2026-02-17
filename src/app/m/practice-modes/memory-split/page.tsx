'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/db/supabase';
import { useMobileCache } from '@/hooks/use-mobile-cache';
import { CACHE_TTL } from '@/lib/cache/mobile-cache';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

/**
 * Memory Split Card Interface
 */
interface MemorySplitCard {
  id: string;
  content: string;
  language: 'greek' | 'user';
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
  audioUrl?: string;
}

/**
 * Practice Item from Database
 */
interface PracticeItem {
  id: string;
  english: string;
  greek: string;
  audio_url?: string;
}

/**
 * Game Configuration
 */
const GAME_CONFIG = {
  PAIRS: 6,
  GRID_COLUMNS: 3,
  PENALTY_PER_SOLUTION: 10,
  MATCH_DELAY: 800,
  NO_MATCH_DELAY: 1200,
  AUDIO_DELAY: 500,
};

export default function MobileMemorySplitPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Game State
  const [topCards, setTopCards] = useState<MemorySplitCard[]>([]);
  const [bottomCards, setBottomCards] = useState<MemorySplitCard[]>([]);
  const [selectedTop, setSelectedTop] = useState<string | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [shakingCard, setShakingCard] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // ✅ FEATURES 2-5: Settings States
  const [pairCount, setPairCount] = useState<6 | 8 | 12>(6);
  const [greekOnTop, setGreekOnTop] = useState(false);
  const [revealAll, setRevealAll] = useState(false);

  /**
   * Auth check
   */
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login-pin');
    }
  }, [isAuthenticated, router]);

  /**
   * Timer
   */
  useEffect(() => {
    if (gameComplete) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, gameComplete]);

  /**
   * Fetcher function for practice items
   * 🔧 FIX: Use cache instead of direct Supabase call
   */
  const fetchPracticeItems = useCallback(async (): Promise<PracticeItem[]> => {
    if (!user?.id) return [];

    console.log('🎮 [Memory Split] Fetching practice items');

    const { data, error } = await supabase
      .from('learning_items')
      .select('*')
      .eq('type', 'vocabulary')
      .limit(24); // Fetch enough for max 12 pairs

    if (error) {
      console.error('Error fetching practice items:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('No practice items found');
      return [];
    }

    console.log('🎮 [Memory Split] Items loaded:', data.length);
    return data as PracticeItem[];
  }, [user?.id]);

  /**
   * Create card grids from practice items
   */
  const createCardGrids = useCallback((items: PracticeItem[], pairs: number) => {
    const selectedItems = items.slice(0, pairs);

    // Create TOP cards (User Language)
    const topCardsData: MemorySplitCard[] = selectedItems.map((item) => ({
      id: `${item.id}-user`,
      content: item.english,
      language: 'user' as const,
      pairId: item.id,
      isFlipped: false,
      isMatched: false,
    }));

    // Create BOTTOM cards (Greek)
    const bottomCardsData: MemorySplitCard[] = selectedItems.map((item) => ({
      id: `${item.id}-greek`,
      content: item.greek,
      language: 'greek' as const,
      pairId: item.id,
      isFlipped: false,
      isMatched: false,
      audioUrl: item.audio_url,
    }));

    // Shuffle both grids independently
    setTopCards(shuffleArray([...topCardsData]));
    setBottomCards(shuffleArray([...bottomCardsData]));
  }, []);

  /**
   * 🔧 FIX: Stable callbacks to prevent re-render loops
   */
  const handleCacheHit = useCallback((data: PracticeItem[]) => {
    console.log('✅ [Memory Split] Using cached data');
    createCardGrids(data, pairCount);
  }, [createCardGrids, pairCount]);

  const handleCacheMiss = useCallback(() => {
    console.log('❌ [Memory Split] Cache miss - fetching fresh data');
  }, []);

  /**
   * Use cache for practice items
   * 🔧 FIX: Cache practice items for offline support
   */
  const {
    data: practiceItems,
    loading: cacheLoading,
    cached,
    refresh,
  } = useMobileCache<PracticeItem[]>({
    storeName: 'practice_items',
    key: `practice-items-${user?.id}`,
    fetcher: fetchPracticeItems,
    ttl: CACHE_TTL.PRACTICE_ITEMS, // 1 hour
    enabled: !!user?.id,
    onCacheHit: handleCacheHit,
    onCacheMiss: handleCacheMiss,
  });

  /**
   * Create cards when fresh data is fetched or pairCount changes
   * 🔧 FIX: Handle both cache miss and pair count changes
   */
  useEffect(() => {
    if (practiceItems && practiceItems.length > 0) {
      if (!cached) {
        // Fresh data (cache miss) - create cards
        createCardGrids(practiceItems, pairCount);
      }
    }
  }, [practiceItems, cached, pairCount, createCardGrids]);

  /**
   * Update cards when pairCount changes (but data is cached)
   */
  useEffect(() => {
    if (practiceItems && practiceItems.length > 0 && cached) {
      // Cached data but pair count changed - recreate cards
      createCardGrids(practiceItems, pairCount);
    }
  }, [pairCount]); // Only trigger on pairCount change

  /**
   * Set loading state from cache hook
   */
  useEffect(() => {
    setLoading(cacheLoading);
  }, [cacheLoading]);

  /**
   * Shuffle array (Fisher-Yates)
   */
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  /**
   * Handle card tap
   */
  const handleCardTap = (cardId: string, grid: 'top' | 'bottom') => {
    // Ignore if checking or game complete
    if (isChecking || gameComplete) return;

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (grid === 'top') {
      if (selectedTop === cardId) {
        // Deselect
        setSelectedTop(null);
      } else {
        setSelectedTop(cardId);
      }
    } else {
      if (selectedBottom === cardId) {
        // Deselect
        setSelectedBottom(null);
      } else {
        setSelectedBottom(cardId);

        // ✅ FEATURE 1: Play audio immediately when Greek card flipped
        const card = bottomCards.find((c) => c.id === cardId);
        if (card?.audioUrl && !isMuted) {
          const audio = new Audio(card.audioUrl);
          audio.play().catch((err) => console.error('Audio play error:', err));
        }
      }
    }
  };

  /**
   * Check match when both cards selected
   */
  useEffect(() => {
    if (!selectedTop || !selectedBottom || isChecking) return;

    const checkMatch = async () => {
      setIsChecking(true);

      const topCard = topCards.find((c) => c.id === selectedTop);
      const bottomCard = bottomCards.find((c) => c.id === selectedBottom);

      if (!topCard || !bottomCard) {
        setIsChecking(false);
        return;
      }

      // Show both cards briefly
      await new Promise((resolve) => setTimeout(resolve, GAME_CONFIG.MATCH_DELAY));

      // Check if same pair
      if (topCard.pairId === bottomCard.pairId) {
        // MATCH!
        if (navigator.vibrate) {
          navigator.vibrate([50, 100, 50]); // Success pattern
        }

        // Play audio if available
        if (bottomCard.audioUrl) {
          playAudio(bottomCard.audioUrl);
        }

        // Mark as matched
        setMatchedPairs((prev) => new Set(prev).add(topCard.pairId));

        // Reset selection
        setSelectedTop(null);
        setSelectedBottom(null);

        // Check if game complete
        if (matchedPairs.size + 1 === pairCount) {
          setTimeout(() => {
            calculateScore();
            setGameComplete(true);
          }, 1000);
        }
      } else {
        // NO MATCH
        if (navigator.vibrate) {
          navigator.vibrate(200); // Error vibration
        }

        // Shake animation
        setShakingCard(selectedTop);
        setTimeout(() => setShakingCard(null), 500);

        setMistakes((prev) => prev + 1);

        // Reset after delay
        await new Promise((resolve) => setTimeout(resolve, GAME_CONFIG.NO_MATCH_DELAY));
        setSelectedTop(null);
        setSelectedBottom(null);
      }

      setIsChecking(false);
    };

    checkMatch();
  }, [selectedTop, selectedBottom]);

  /**
   * Play audio
   */
  const playAudio = (url: string) => {
    if (isMuted) return;
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(url);
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    }, GAME_CONFIG.AUDIO_DELAY);
  };

  /**
   * Calculate final score
   */
  const calculateScore = () => {
    const baseScore = 100;
    const mistakePenalty = Math.min(mistakes * 5, 50); // Max 50% penalty
    const timePenalty = Math.min(Math.floor(elapsedTime / 10), 20); // Max 20% penalty
    const finalScore = Math.max(baseScore - mistakePenalty - timePenalty, 0);
    setScore(finalScore);
  };

  /**
   * Solution Button Handler
   */
  const handleSolutionClick = () => {
    if (gameComplete || !selectedTop || isChecking) return;

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // Apply penalty
    setMistakes((prev) => prev + GAME_CONFIG.PENALTY_PER_SOLUTION / 5);

    // Find matching bottom card
    const topCard = topCards.find((c) => c.id === selectedTop);
    if (!topCard) return;

    const matchingBottomCard = bottomCards.find((c) => c.pairId === topCard.pairId);
    if (!matchingBottomCard) return;

    // Auto-select matching card
    setSelectedBottom(matchingBottomCard.id);
  };

  /**
   * Restart game
   * 🔧 FIX: Reshuffle existing cards instead of refetching
   */
  const handleRestart = () => {
    setSelectedTop(null);
    setSelectedBottom(null);
    setMatchedPairs(new Set());
    setMistakes(0);
    setGameComplete(false);
    setScore(0);
    setRevealAll(false);

    // Reshuffle cards with current pair count
    if (practiceItems && practiceItems.length > 0) {
      createCardGrids(practiceItems, pairCount);
    }
  };

  /**
   * Format time MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Render card
   */
  const renderCard = (card: MemorySplitCard, grid: 'top' | 'bottom') => {
    const isSelected =
      (grid === 'top' && selectedTop === card.id) ||
      (grid === 'bottom' && selectedBottom === card.id);
    const isMatched = matchedPairs.has(card.pairId);
    const isShaking = shakingCard === card.id;

    return (
      <motion.button
        key={card.id}
        whileTap={{ scale: 0.95 }}
        animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.3 }}
        onTap={() => !isMatched && handleCardTap(card.id, grid)}
        disabled={isMatched || gameComplete}
        style={{
          width: '100%',
          minHeight: '88px',
          borderRadius: '12px',
          border: isSelected
            ? '3px solid #007AFF'
            : isMatched
            ? '2px solid #34C759'
            : '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: isMatched
            ? 'rgba(52, 199, 89, 0.2)'
            : isSelected
            ? 'rgba(0, 122, 255, 0.3)'
            : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          cursor: isMatched ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: isMatched ? 0.6 : 1,
          touchAction: 'manipulation',
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: '600',
            color: 'white',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.3',
          }}
        >
          {/* ✅ FEATURE 4: Show content when revealed, selected, or matched */}
          {revealAll || isSelected || isMatched ? card.content : '?'}
        </span>
      </motion.button>
    );
  };

  if (loading) {
    return (
      <>
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0F0F11',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: 'white', fontSize: '18px' }}>Loading game...</div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0F0F11',
          paddingBottom: '80px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Compact Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backgroundColor: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => router.push('/m/practice-modes')}
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

          {/* Stats - Compact */}
          {!gameComplete && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '14px',
                color: 'white',
                fontWeight: '600',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '18px' }}>⏱️</span>
                <span>{formatTime(elapsedTime)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '18px' }}>⭐</span>
                <span style={{ color: '#FFD60A' }}>
                  {matchedPairs.size}/{pairCount}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '18px' }}>❌</span>
                <span style={{ color: '#FF3B30' }}>{mistakes}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              style={{
                background: isMuted ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: isMuted ? '1px solid rgba(255, 59, 48, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px',
                color: isMuted ? '#FF3B30' : 'white',
                cursor: 'pointer',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isMuted ? (
                <VolumeX size={20} />
              ) : (
                <Volume2 size={20} />
              )}
            </button>

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              style={{
                background: 'rgba(0, 122, 255, 0.2)',
                border: '1px solid rgba(0, 122, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#007AFF',
                fontSize: '16px',
                cursor: 'pointer',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              🔄
            </button>
          </div>
        </div>

        {/* ✅ FEATURES 2-5: Settings Bar */}
        {!gameComplete && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'rgba(28, 28, 30, 0.8)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Pair Count Toggle */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8E8E93', marginRight: '4px' }}>
                📐
              </span>
              {[6, 8, 12].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    setPairCount(count as 6 | 8 | 12);
                    setMatchedPairs(new Set());
                    setMistakes(0);
                    setSelectedTop(null);
                    setSelectedBottom(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border:
                      pairCount === count
                        ? '2px solid #007AFF'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                    background:
                      pairCount === count
                        ? 'rgba(0, 122, 255, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '36px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {count}
                </button>
              ))}
            </div>

            {/* Right Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Grid Swap Button */}
              <button
                onClick={() => setGreekOnTop(!greekOnTop)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: greekOnTop
                    ? '2px solid #FF9500'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  background: greekOnTop
                    ? 'rgba(255, 149, 0, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  minWidth: '40px',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                title="Swap grids"
              >
                ↕️
              </button>

              {/* Reveal All Toggle */}
              <button
                onClick={() => setRevealAll(!revealAll)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: revealAll
                    ? '2px solid #FF3B30'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  background: revealAll
                    ? 'rgba(255, 59, 48, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  minWidth: '40px',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                title={revealAll ? 'Hide all cards' : 'Reveal all cards'}
              >
                {revealAll ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}

        {gameComplete ? (
          // Result Screen
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                padding: '48px 24px',
                backgroundColor: 'rgba(52, 199, 89, 0.1)',
                borderRadius: '24px',
                border: '1px solid rgba(52, 199, 89, 0.3)',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
                Game Complete!
              </h2>

              {/* Score */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '8px' }}>
                  Score
                </div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#34C759' }}>
                  {score}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <div
                  style={{
                    flex: 1,
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '4px' }}>
                    Time
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                    {formatTime(elapsedTime)}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '4px' }}>
                    Mistakes
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: mistakes === 0 ? '#34C759' : '#FF3B30' }}>
                    {mistakes}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleRestart}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'rgba(0, 122, 255, 0.3)',
                    color: '#007AFF',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '56px',
                  }}
                >
                  Play Again
                </button>
                <button
                  onClick={() => router.push('/m/practice-modes')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '56px',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : topCards.length === 0 ? (
          // No Items
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎮</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                No Items Available
              </h3>
              <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0 }}>
                No practice items found for Memory Split Game.
              </p>
            </div>
          </div>
        ) : (
          // Game Content
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' }}>
            {/* ✅ FEATURE 2: Dynamic grid columns based on pairCount */}
            {/* ✅ FEATURE 3: Conditional grid swap based on greekOnTop */}

            {/* FIRST GRID */}
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: greekOnTop ? '#FFD60A' : '#93C5FD',
                  marginBottom: '8px',
                  textAlign: 'center',
                }}
              >
                {greekOnTop ? 'Ελληνικά (Greek)' : 'English'}
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${pairCount === 6 ? 3 : 4}, 1fr)`,
                  gap: '8px',
                }}
              >
                {greekOnTop
                  ? bottomCards.map((card) => renderCard(card, 'bottom'))
                  : topCards.map((card) => renderCard(card, 'top'))}
              </div>
            </div>

            {/* SOLUTION BUTTON */}
            <button
              onClick={handleSolutionClick}
              disabled={!selectedTop || gameComplete || isChecking}
              style={{
                width: '100%',
                minHeight: '88px',
                padding: '16px',
                borderRadius: '14px',
                border: '2px solid rgba(255, 149, 0, 0.4)',
                background: selectedTop
                  ? 'linear-gradient(135deg, rgba(255, 149, 0, 0.3) 0%, rgba(255, 69, 0, 0.3) 100%)'
                  : 'rgba(255, 149, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                cursor: selectedTop ? 'pointer' : 'not-allowed',
                opacity: selectedTop ? 1 : 0.5,
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '28px' }}>💡</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>
                  Show Solution
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  -10 Penalty
                </span>
              </div>
            </button>

            {/* SECOND GRID */}
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: greekOnTop ? '#93C5FD' : '#FFD60A',
                  marginBottom: '8px',
                  textAlign: 'center',
                }}
              >
                {greekOnTop ? 'English' : 'Ελληνικά (Greek)'}
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${pairCount === 6 ? 3 : 4}, 1fr)`,
                  gap: '8px',
                }}
              >
                {greekOnTop
                  ? topCards.map((card) => renderCard(card, 'top'))
                  : bottomCards.map((card) => renderCard(card, 'bottom'))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
}
