'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/db/supabase';
import { useMobileCache } from '@/hooks/use-mobile-cache';
import { CACHE_TTL } from '@/lib/cache/mobile-cache';
import { useTranslation } from '@/lib/use-translation';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

/**
 * Matching Game Card Interface
 * All cards are visible - players select matching pairs
 */
interface MatchingCard {
  id: string;
  content: string;
  language: 'greek' | 'translation';
  pairId: string;
  isMatched: boolean;
  isSelected: boolean;
}

/**
 * Practice Item from Database
 */
interface PracticeItem {
  id: string;
  english: string;
  russian?: string;
  german?: string;
  spanish?: string;
  greek: string;
  phonetic?: string;
}

export default function MobileBrainGymPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { t, locale } = useTranslation();

  // Game State
  const [greekCards, setGreekCards] = useState<MatchingCard[]>([]);
  const [translationCards, setTranslationCards] = useState<MatchingCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataSource, setDataSource] = useState<'due_cards' | 'review_vocab' | 'weak_words'>('review_vocab');
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);

  /**
   * Auth check
   */
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login-pin');
    }
  }, [isAuthenticated, router]);

  /**
   * Fetcher function for practice items based on data source
   * 🔧 UPDATED: Uses RPC functions for consistent FSRS-6 integration
   */
  const fetchPracticeItems = useCallback(async (): Promise<PracticeItem[]> => {
    if (!user?.id) return [];

    try {
      let data, error;

      // 1. DUE CARDS - Uses existing RPC
      if (dataSource === 'due_cards') {
        const result = await supabase.rpc('get_due_vocabulary_cards', {
          p_user_id: user.id,
          p_limit: 5
        });
        data = result.data;
        error = result.error;
      }

      // 2. REVIEW VOCAB - Uses NEW RPC
      else if (dataSource === 'review_vocab') {
        const result = await supabase.rpc('get_all_vocabulary_cards', {
          p_user_id: user.id,
          p_limit: 5
        });
        data = result.data;
        error = result.error;
      }

      // 3. WEAK WORDS - Uses NEW RPC
      else if (dataSource === 'weak_words') {
        const result = await supabase.rpc('get_weak_vocabulary_cards', {
          p_user_id: user.id,
          p_limit: 5
        });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error(`Error fetching ${dataSource}:`, error);
        return [];
      }

      // Map RPC result to PracticeItem interface
      return (data || []).map((item: any) => ({
        id: item.id,
        english: item.english,
        russian: item.russian,
        german: item.german,
        spanish: item.spanish,
        greek: item.greek,
        phonetic: item.phonetic
      }));

    } catch (error) {
      console.error('Error in fetchPracticeItems:', error);
      return [];
    }
  }, [user?.id, dataSource]);

  /**
   * Create matching cards from practice items
   * Returns two separate arrays: Greek (left column) and Translation (right column)
   */
  const createMatchingCards = useCallback((items: PracticeItem[]) => {
    // Greek cards (left column) - keep original order
    const greek: MatchingCard[] = items.map((item) => ({
      id: `${item.id}-greek`,
      content: item.greek,
      language: 'greek' as const,
      pairId: item.id,
      isMatched: false,
      isSelected: false,
    }));

    // Translation cards (right column) - shuffle for challenge
    const translations: MatchingCard[] = items.map((item) => ({
      id: `${item.id}-translation`,
      content: getTranslationForLocale(item, locale),
      language: 'translation' as const,
      pairId: item.id,
      isMatched: false,
      isSelected: false,
    }));

    // Shuffle only translation cards
    const shuffledTranslations = translations.sort(() => Math.random() - 0.5);

    return { greek, translations: shuffledTranslations };
  }, [locale]);

  /**
   * Get translation based on user's locale
   */
  const getTranslationForLocale = (item: PracticeItem, locale: string): string => {
    // Return translation in user's language
    // Fallback to English if user's language is not available
    switch (locale) {
      case 'ru':
        return item.russian || item.english;
      case 'de':
        return item.german || item.english;
      case 'es':
        return item.spanish || item.english;
      case 'en':
        return item.english;
      case 'el':
      default:
        // Greek (el) falls back to English (user learns Greek, so translations are in their native language)
        return item.english;
    }
  };

  /**
   * 🔧 FIX: Stable callbacks to prevent re-render loops
   */
  const handleCacheHit = useCallback((data: PracticeItem[]) => {
    console.log('✅ [Brain Gym] Using cached data');
    const { greek, translations } = createMatchingCards(data);
    setGreekCards(greek);
    setTranslationCards(translations);
    setPracticeItems(data);
  }, [createMatchingCards]);

  const handleCacheMiss = useCallback(() => {
    console.log('❌ [Brain Gym] Cache miss - fetching fresh data');
  }, []);

  /**
   * Use cache for practice items
   * 🔧 FIX: Cache practice items for offline support
   */
  const {
    data: cachedPracticeItems,
    loading: cacheLoading,
    cached,
    refresh,
  } = useMobileCache<PracticeItem[]>({
    storeName: 'practice_items',
    key: `brain-gym-${dataSource}-${user?.id}`,
    fetcher: fetchPracticeItems,
    ttl: CACHE_TTL.PRACTICE_ITEMS, // 1 hour
    enabled: !!user?.id,
    onCacheHit: handleCacheHit,
    onCacheMiss: handleCacheMiss,
  });

  /**
   * Create cards when fresh data is fetched (cache miss)
   * 🔧 FIX: Only create cards for fresh data, not cached data
   */
  useEffect(() => {
    if (cachedPracticeItems && cachedPracticeItems.length > 0 && !cached) {
      // Only create cards for fresh data (cache miss)
      // For cached data, handleCacheHit already creates them
      const { greek, translations } = createMatchingCards(cachedPracticeItems);
      setGreekCards(greek);
      setTranslationCards(translations);
      setPracticeItems(cachedPracticeItems);
    }
  }, [cachedPracticeItems, cached, createMatchingCards]);

  /**
   * Reload data when data source changes
   * 🔧 NEW: Refresh cache when user changes dropdown
   */
  useEffect(() => {
    if (user?.id) {
      // Reset game state
      setSelectedCards([]);
      setMatchedPairIds([]);
      setMistakes(0);
      setGameComplete(false);
      setSaving(false);
      // NOTE: We don't need to call refresh() here manually.
      // Changing the dataSource changes the cache key, which
      // automatically triggers a reload in useMobileCache.
    }
  }, [dataSource, user?.id]);

  /**
   * Set loading state from cache hook
   */
  useEffect(() => {
    setLoading(cacheLoading);
  }, [cacheLoading]);

  /**
   * Handle card selection
   */
  const handleCardClick = (cardId: string, pairId: string) => {
    // Ignore if game complete or saving
    if (gameComplete || saving) return;

    // Ignore if already matched
    if (matchedPairIds.includes(pairId)) return;

    // Ignore if already selected
    if (selectedCards.includes(cardId)) {
      // Deselect
      setSelectedCards(selectedCards.filter(id => id !== cardId));
      return;
    }

    // Select card
    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    // Check match if 2 cards selected
    if (newSelected.length === 2) {
      setTimeout(() => checkMatch(newSelected), 600);
    }
  };

  /**
   * Check if selected cards match
   */
  const checkMatch = (selected: string[]) => {
    const [card1Id, card2Id] = selected;

    // Find cards in both arrays
    const card1 = [...greekCards, ...translationCards].find((c) => c.id === card1Id);
    const card2 = [...greekCards, ...translationCards].find((c) => c.id === card2Id);

    if (!card1 || !card2) {
      setSelectedCards([]);
      return;
    }

    // Check if same pair and different languages
    if (card1.pairId === card2.pairId && card1.language !== card2.language) {
      // Match! ✅
      setMatchedPairIds([...matchedPairIds, card1.pairId]);
      setSelectedCards([]);

      // Update card states
      setGreekCards(prev => prev.map(c =>
        c.pairId === card1.pairId ? { ...c, isMatched: true, isSelected: false } : c
      ));
      setTranslationCards(prev => prev.map(c =>
        c.pairId === card1.pairId ? { ...c, isMatched: true, isSelected: false } : c
      ));

      // Check if game complete
      if (matchedPairIds.length + 1 === greekCards.length) {
        setGameComplete(true);
        saveResults(card1.pairId);
      }
    } else {
      // No match ❌ - increment mistakes
      setMistakes(prev => prev + 1);
      // Reset after delay
      setTimeout(() => {
        setSelectedCards([]);
      }, 400);
    }
  };

  /**
   * 🆕 PHASE 2: Save results to database
   */
  const saveResults = async (lastPairId: string) => {
    if (!user?.id || saving) return;

    setSaving(true);

    try {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      const totalPairs = greekCards.length;
      const score = Math.max(0, 100 - (mistakes * 10));

      // Record attempt for each matched pair
      const allMatchedPairIds = [...matchedPairIds, lastPairId];

      for (const pairId of allMatchedPairIds) {
        const item = practiceItems.find(i => i.id === pairId);
        if (!item) continue;

        // Calculate FSRS rating based on mistakes for this pair
        // 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
        const pairMistakes = mistakes / totalPairs; // Average mistakes per pair
        let fsrsRating = 4; // Easy
        if (pairMistakes >= 2) fsrsRating = 1; // Again
        else if (pairMistakes >= 1) fsrsRating = 2; // Hard
        else if (pairMistakes >= 0.5) fsrsRating = 3; // Good

        const { error } = await supabase.rpc('record_practice_attempt', {
          p_user_id: user.id,
          p_item_id: pairId,
          p_mode_type: 'matching',
          p_success: true, // All matched pairs are successful
          p_score: score,
          p_time_seconds: elapsedTime,
          p_mistakes: mistakes,
          p_fsrs_rating: fsrsRating,
          p_metadata: {
            game_mode: 'brain_gym',
            data_source: dataSource,
            total_pairs: totalPairs,
            pairs_matched: allMatchedPairIds.length,
            locale: locale
          }
        });

        if (error) {
          console.error(`Error recording attempt for ${pairId}:`, error);
        }
      }

      console.log('✅ Brain Gym results saved successfully');
    } catch (error) {
      console.error('❌ Error saving Brain Gym results:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Restart game
   * 🔧 FIX: Reshuffle existing cards instead of refetching
   */
  const handleRestart = () => {
    setSelectedCards([]);
    setMatchedPairIds([]);
    setMistakes(0);
    setGameComplete(false);
    setSaving(false);

    // Reshuffle translation cards only
    if (practiceItems && practiceItems.length > 0) {
      const { greek, translations } = createMatchingCards(practiceItems);
      setGreekCards(greek);
      setTranslationCards(translations);
    }
  };

  /**
   * Calculate elapsed time
   */
  const getElapsedTime = (): string => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Render matching card (always visible)
   */
  const renderMatchingCard = (card: MatchingCard) => {
    const isSelected = selectedCards.includes(card.id);
    const isMatched = matchedPairIds.includes(card.pairId);

    return (
      <button
        key={card.id}
        onClick={() => handleCardClick(card.id, card.pairId)}
        onTouchStart={(e) => {
          if (!isMatched && !gameComplete) {
            e.currentTarget.style.transform = 'scale(0.95)';
          }
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        disabled={isMatched || gameComplete || saving}
        style={{
          width: '100%',
          minHeight: '80px',
          borderRadius: '10px',
          border: isSelected
            ? '3px solid #FFD60A'
            : isMatched
              ? '2px solid #34C759'
              : '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: isMatched
            ? 'rgba(52, 199, 89, 0.15)'
            : isSelected
              ? 'rgba(255, 214, 10, 0.2)'
              : 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          cursor: isMatched || gameComplete ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: isMatched ? 0.5 : 1,
          touchAction: 'manipulation',
          transform: isMatched ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: '500',
            color: 'white',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.3',
          }}
        >
          {card.content}
        </span>
      </button>
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
          <div style={{ color: 'white', fontSize: '18px' }}>{t('brain_gym.loading')}</div>
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
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px',
            paddingTop: 'calc(11px + env(safe-area-inset-top))',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backgroundColor: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Back Button - Navigate to Dashboard */}
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

          {/* Title */}
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              flex: 1,
              textAlign: 'center',
            }}
          >
            🧠 {t('brain_gym.title')}
          </h1>

          {/* Refresh Button - Load new cards */}
          <button
            onClick={() => {
              setSelectedCards([]);
              setMatchedPairIds([]);
              setMistakes(0);
              setGameComplete(false);
              setSaving(false);
              refresh();
            }}
            disabled={loading || gameComplete}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: loading || gameComplete ? '#8E8E93' : '#007AFF',
              cursor: loading || gameComplete ? 'not-allowed' : 'pointer',
              padding: 0,
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading || gameComplete ? 0.5 : 1,
              transition: 'transform 0.2s ease, opacity 0.2s ease',
            }}
            onTouchStart={(e) => {
              if (!loading && !gameComplete) {
                e.currentTarget.style.transform = 'rotate(180deg)';
              }
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            🔄
          </button>
        </div>

        {/* Data Source Dropdown */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ maxWidth: '448px', margin: '0 auto' }}>
            <label
              htmlFor="dataSource"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#FFD60A',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                textShadow: '0 0 12px rgba(255, 214, 10, 0.4)',
              }}
            >
              {t('brain_gym.card_source')}
            </label>
            <select
              id="dataSource"
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as 'due_cards' | 'review_vocab' | 'weak_words')}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: greekCards.length === 0
                  ? '2px solid rgba(255, 59, 48, 0.8)'
                  : '1px solid rgba(255, 214, 10, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(15px)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px',
                paddingRight: '40px',
                animation: greekCards.length === 0
                  ? 'blink-red 1s infinite'
                  : 'glow-yellow 4s infinite ease-in-out',
              }}
            >
              <option value="review_vocab" style={{ backgroundColor: '#1C1C1E', color: 'white' }}>
                📖 {t('brain_gym.review_vocab')}
              </option>
              <option value="weak_words" style={{ backgroundColor: '#1C1C1E', color: 'white' }}>
                💪 {t('brain_gym.weak_words')}
              </option>
              <option value="due_cards" style={{ backgroundColor: '#1C1C1E', color: 'white' }}>
                📅 {t('brain_gym.due_cards')}
              </option>
            </select>
          </div>
        </div>

        {/* Stats Bar */}
        {!gameComplete && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              {t('brain_gym.pairs')}: <span style={{ color: 'white', fontWeight: '600' }}>{matchedPairIds.length} / {greekCards.length}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              {t('brain_gym.mistakes')}: <span style={{ color: '#FF3B30', fontWeight: '600' }}>{mistakes}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              {t('brain_gym.time')}: <span style={{ color: 'white', fontWeight: '600' }}>{getElapsedTime()}</span>
            </div>
          </div>
        )}

        {/* Game Content */}
        <div style={{ padding: '16px' }}>
          {greekCards.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧠</div>
              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '12px',
                }}
              >
                {t('brain_gym.no_items_in_rubric')}
              </h3>
              <p style={{ fontSize: '30px', color: '#93C5FD', margin: '0 0 12px 0', fontWeight: '700' }}>
                {dataSource === 'due_cards' ? t('brain_gym.due_cards') : dataSource === 'review_vocab' ? t('brain_gym.review_vocab') : t('brain_gym.weak_words')}
              </p>
              <p style={{ fontSize: '28px', color: '#8E8E93', margin: 0, fontWeight: '600' }}>
                {t('brain_gym.select_another_source')}
              </p>
            </div>
          ) : gameComplete ? (
            // Game Complete Screen
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                backgroundColor: 'rgba(52, 199, 89, 0.1)',
                borderRadius: '16px',
                border: '1px solid rgba(52, 199, 89, 0.3)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '16px',
                }}
              >
                {t('brain_gym.complete')}
              </h3>

              {/* Score Display */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(255, 214, 10, 0.15)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 214, 10, 0.3)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', color: '#FFD60A', marginBottom: '4px', fontWeight: '600' }}>
                  {t('brain_gym.score')}
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FFD60A' }}>
                  {Math.max(0, 100 - (mistakes * 10))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '4px' }}>
                    {t('brain_gym.time')}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                    {getElapsedTime()}
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '4px' }}>
                    {t('brain_gym.mistakes')}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: mistakes === 0 ? '#34C759' : '#FF3B30' }}>
                    {mistakes}
                  </div>
                </div>
              </div>

              {saving && (
                <div style={{ marginBottom: '16px', color: '#8E8E93', fontSize: '14px' }}>
                  {t('brain_gym.saving')}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handleRestart}
                  disabled={saving}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    background: saving ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.3)',
                    color: '#007AFF',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    minHeight: '48px',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {t('brain_gym.play_again')}
                </button>
                <button
                  onClick={() => router.push('/m')}
                  disabled={saving}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    minHeight: '48px',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {t('brain_gym.close')}
                </button>
              </div>
            </div>
          ) : (
            // Matching Game: 2-Column Layout
            <div style={{ maxWidth: '448px', margin: '0 auto' }}>
              {/* Instructions */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 122, 255, 0.2)',
                }}
              >
                <p style={{ fontSize: '13px', color: '#007AFF', margin: 0, fontWeight: '500' }}>
                  {t('brain_gym.instructions')}
                </p>
              </div>

              {/* Column Headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#34C759' }}>
                  🇬🇷 {t('brain_gym.greek')}
                </div>
                <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#007AFF' }}>
                  {locale === 'en' && '🇺🇸'}
                  {locale === 'ru' && '🇷🇺'}
                  {locale === 'de' && '🇩🇪'}
                  {locale === 'es' && '🇪🇸'}
                  {locale === 'el' && '🇬🇷'}
                  {' '}{t('brain_gym.translation')}
                </div>
              </div>

              {/* Matching Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                {/* Greek Cards Column (Left) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {greekCards.map((card) => renderMatchingCard(card))}
                </div>

                {/* Translation Cards Column (Right) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {translationCards.map((card) => renderMatchingCard(card))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
      <style>{`
        @keyframes blink-red {
          0% { background-color: rgba(255, 255, 255, 0.1); }
          50% { background-color: rgba(255, 59, 48, 0.3); }
          100% { background-color: rgba(255, 255, 255, 0.1); }
        }
        @keyframes glow-yellow {
          0% { background-color: rgba(255, 255, 255, 0.05); border-color: rgba(255, 214, 10, 0.1); }
          50% { background-color: rgba(255, 214, 10, 0.15); border-color: rgba(255, 214, 10, 0.4); }
          100% { background-color: rgba(255, 255, 255, 0.05); border-color: rgba(255, 214, 10, 0.1); }
        }
      `}</style>
    </>
  );
}
