'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/db/supabase';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

/**
 * Memory Game Card Interface
 */
interface MemoryCard {
  id: string;
  content: string;
  language: 'greek' | 'user';
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

/**
 * Practice Item from Database
 */
interface PracticeItem {
  id: string;
  english: string;
  greek: string;
}

export default function MobileMemoryGamePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Game State
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedCards, setMatchedCards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGreek, setShowGreek] = useState(true); // Toggle Greek/User Language
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);

  /**
   * Auth check
   */
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login-pin');
    }
  }, [isAuthenticated, router]);

  /**
   * Fetch practice items and initialize game
   */
  useEffect(() => {
    if (!user?.id) return;
    loadGameData();
  }, [user?.id]);

  /**
   * Load game data from Supabase
   */
  const loadGameData = async () => {
    try {
      setLoading(true);

      // Call RPC to get practice-enabled items
      const { data, error } = await supabase.rpc('get_practice_enabled_items');

      if (error) {
        console.error('Error fetching practice items:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No practice items found');
        setLoading(false);
        return;
      }

      // Create card pairs
      const items = data.slice(0, 8) as PracticeItem[];
      const cardPairs: MemoryCard[] = items.flatMap((item) => [
        {
          id: `${item.id}-greek`,
          content: item.greek,
          language: 'greek' as const,
          pairId: item.id,
          isFlipped: false,
          isMatched: false,
        },
        {
          id: `${item.id}-user`,
          content: item.english,
          language: 'user' as const,
          pairId: item.id,
          isFlipped: false,
          isMatched: false,
        },
      ]);

      // Shuffle cards
      const shuffled = cardPairs.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setLoading(false);
    } catch (err) {
      console.error('Error loading game data:', err);
      setLoading(false);
    }
  };

  /**
   * Handle card tap
   */
  const handleCardClick = (cardId: string) => {
    // Ignore if game complete
    if (gameComplete) return;

    // Ignore if already flipped or matched
    if (flippedCards.includes(cardId) || matchedCards.includes(cardId)) return;

    // Ignore if 2 cards already flipped (wait for reset)
    if (flippedCards.length === 2) return;

    // Flip card
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    // Check match if 2 cards flipped
    if (newFlipped.length === 2) {
      setTimeout(() => checkMatch(newFlipped), 500);
    }
  };

  /**
   * Check if flipped cards match
   */
  const checkMatch = (flipped: string[]) => {
    const [card1Id, card2Id] = flipped;
    const card1 = cards.find((c) => c.id === card1Id);
    const card2 = cards.find((c) => c.id === card2Id);

    if (!card1 || !card2) {
      setFlippedCards([]);
      return;
    }

    // Check if same pair
    if (card1.pairId === card2.pairId) {
      // Match!
      setMatchedCards([...matchedCards, card1Id, card2Id]);
      setFlippedCards([]);

      // Check if game complete
      if (matchedCards.length + 2 === cards.length) {
        setGameComplete(true);
      }
    } else {
      // No match - increment mistakes
      setMistakes(mistakes + 1);
      // Reset after delay
      setTimeout(() => {
        setFlippedCards([]);
      }, 300);
    }
  };

  /**
   * Restart game
   */
  const handleRestart = () => {
    setFlippedCards([]);
    setMatchedCards([]);
    setMistakes(0);
    setGameComplete(false);
    loadGameData();
  };

  /**
   * Toggle language display
   */
  const toggleLanguage = () => {
    setShowGreek(!showGreek);
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
   * Render card
   */
  const renderCard = (card: MemoryCard) => {
    const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
    const isMatched = matchedCards.includes(card.id);

    // Determine what to show:
    // - If not flipped: Show "?"
    // - If flipped: Show content based on toggle + card language
    let displayContent = '?';
    if (isFlipped) {
      if (showGreek && card.language === 'greek') {
        displayContent = card.content;
      } else if (!showGreek && card.language === 'user') {
        displayContent = card.content;
      } else {
        // Wrong side for current toggle - show content anyway (user needs to see what they flipped)
        displayContent = card.content;
      }
    }

    return (
      <button
        key={card.id}
        onClick={() => handleCardClick(card.id)}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        disabled={isMatched || gameComplete}
        style={{
          width: '100%',
          minHeight: '90px',
          borderRadius: '8px',
          border: isMatched ? '2px solid #34C759' : '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: isFlipped
            ? isMatched
              ? 'rgba(52, 199, 89, 0.2)'
              : 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 122, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          cursor: isMatched ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: isMatched ? 0.7 : 1,
          touchAction: 'manipulation',
        }}
      >
        <span
          style={{
            fontSize: isFlipped ? '16px' : '32px',
            fontWeight: isFlipped ? '500' : 'bold',
            color: 'white',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {displayContent}
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
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
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

          {/* Title */}
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
            }}
          >
            🎮 Memory Game
          </h1>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              background: 'rgba(0, 122, 255, 0.2)',
              border: '1px solid rgba(0, 122, 255, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#007AFF',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showGreek ? '🇬🇷' : '🇺🇸'}
          </button>
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
              Matches: <span style={{ color: 'white', fontWeight: '600' }}>{matchedCards.length / 2} / {cards.length / 2}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              Mistakes: <span style={{ color: '#FF3B30', fontWeight: '600' }}>{mistakes}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              Time: <span style={{ color: 'white', fontWeight: '600' }}>{getElapsedTime()}</span>
            </div>
          </div>
        )}

        {/* Game Content */}
        <div style={{ padding: '16px' }}>
          {cards.length === 0 ? (
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
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '8px',
                }}
              >
                No Items Available
              </h3>
              <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0 }}>
                No practice items found for Memory Game.
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
                Game Complete!
              </h3>
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
                    Time
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
                    Mistakes
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: mistakes === 0 ? '#34C759' : '#FF3B30' }}>
                    {mistakes}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handleRestart}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'rgba(0, 122, 255, 0.3)',
                    color: '#007AFF',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '48px',
                  }}
                >
                  Play Again
                </button>
                <button
                  onClick={() => router.push('/m/practice-modes')}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '48px',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // Game Grid
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                maxWidth: '448px',
                margin: '0 auto',
              }}
            >
              {cards.map((card) => renderCard(card))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
}
