'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/db/supabase';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cloze Text Sentence Interface
 */
interface ClozeTextSentence {
  id: string;
  greek: string;
  english: string;
  blanks: BlankItem[];
}

/**
 * Blank Item (Lücke)
 */
interface BlankItem {
  position: number; // Index in the sentence
  correctAnswer: string; // User's language (English)
  options: string[]; // 3 options (1 correct + 2 distractors)
  isCorrect: boolean | null; // null = not answered yet
}

/**
 * Practice Item from Database
 */
interface PracticeItem {
  id: string;
  english: string;
  greek: string;
}

export default function MobileClozeTextPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Game State
  const [sentences, setSentences] = useState<ClozeTextSentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Bottom Sheet State
  const [selectedBlankIndex, setSelectedBlankIndex] = useState<number | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

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

      // Create 5 cloze sentences
      const items = data.slice(0, 5) as PracticeItem[];
      const clozeData = items.map((item, idx) => createClozeTextSentence(item, idx));
      setSentences(clozeData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading game data:', err);
      setLoading(false);
    }
  };

  /**
   * Create a cloze text sentence from a practice item
   */
  const createClozeTextSentence = (item: PracticeItem, index: number): ClozeTextSentence => {
    // Simple cloze: Replace the English word with a blank in a Greek sentence
    // For demo: "Εγώ [____] στο σχολείο." (I go to school)
    // The blank is the verb "go"

    // For now, we'll use the Greek sentence as-is and create 1 blank
    const words = item.english.split(' ');
    const blankPosition = Math.floor(words.length / 2); // Middle word as blank

    // Get correct answer
    const correctAnswer = words[blankPosition];

    // Generate 2 distractors (for demo, we'll use simple variations)
    const distractors = generateDistractors(correctAnswer);

    // Create options (1 correct + 2 distractors)
    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

    const blank: BlankItem = {
      position: blankPosition,
      correctAnswer,
      options,
      isCorrect: null,
    };

    // Construct Greek sentence with blank placeholder
    const greekWords = item.greek.split(' ');
    const greekSentence = greekWords.map((word, idx) => {
      if (idx === blankPosition) {
        return '[____]';
      }
      return word;
    }).join(' ');

    return {
      id: item.id,
      greek: greekSentence,
      english: item.english,
      blanks: [blank],
    };
  };

  /**
   * Generate 2 distractors for the correct answer
   */
  const generateDistractors = (correct: string): string[] => {
    // Simple distractor generation (for demo purposes)
    const distractors = [
      `${correct}s`,
      `${correct}ed`,
    ];
    return distractors.slice(0, 2);
  };

  /**
   * Handle blank tap
   */
  const handleBlankTap = (blankIndex: number) => {
    if (gameComplete) return;

    const currentSentence = sentences[currentIndex];
    const blank = currentSentence.blanks[blankIndex];

    // Ignore if already answered correctly
    if (blank.isCorrect === true) return;

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Open bottom sheet
    setSelectedBlankIndex(blankIndex);
    setShowBottomSheet(true);
  };

  /**
   * Handle option selection in bottom sheet
   */
  const handleOptionSelect = (option: string) => {
    if (selectedBlankIndex === null) return;

    const currentSentence = sentences[currentIndex];
    const blank = currentSentence.blanks[selectedBlankIndex];

    const isCorrect = option === blank.correctAnswer;

    // Update blank state
    const updatedSentences = [...sentences];
    updatedSentences[currentIndex].blanks[selectedBlankIndex].isCorrect = isCorrect;
    setSentences(updatedSentences);

    if (isCorrect) {
      // Correct answer
      setScore(score + 20);

      // Haptic feedback (success pattern)
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }

      // Play audio (if not muted)
      if (!isMuted) {
        playSuccessSound();
      }
    } else {
      // Wrong answer
      setMistakes(mistakes + 1);

      // Haptic feedback (error)
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }

    // Close bottom sheet
    setShowBottomSheet(false);
    setSelectedBlankIndex(null);
  };

  /**
   * Play success sound
   */
  const playSuccessSound = () => {
    // Simple audio feedback (Web Audio API)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;

    oscillator.start();
    setTimeout(() => oscillator.stop(), 100);
  };

  /**
   * Move to next sentence
   */
  const handleNextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Game complete
      setGameComplete(true);
    }
  };

  /**
   * Restart game
   */
  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setMistakes(0);
    setGameComplete(false);
    loadGameData();
  };

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    setIsMuted(!isMuted);
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
   * Check if current sentence is complete (all blanks answered)
   */
  const isCurrentSentenceComplete = (): boolean => {
    if (sentences.length === 0 || currentIndex >= sentences.length) return false;
    const currentSentence = sentences[currentIndex];
    return currentSentence.blanks.every(blank => blank.isCorrect !== null);
  };

  /**
   * Render blank button in sentence
   */
  const renderBlankInSentence = (sentence: ClozeTextSentence) => {
    const words = sentence.greek.split(' ');

    return (
      <div
        style={{
          fontSize: '22px',
          fontWeight: '500',
          color: 'white',
          lineHeight: '1.6',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        {words.map((word, idx) => {
          const blankIndex = sentence.blanks.findIndex(blank => {
            // Check if this position is a blank
            return word === '[____]';
          });

          if (word === '[____]') {
            const blank = sentence.blanks[blankIndex];
            const isAnswered = blank.isCorrect !== null;
            const isCorrect = blank.isCorrect === true;

            return (
              <motion.button
                key={idx}
                onClick={() => handleBlankTap(blankIndex)}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                disabled={isCorrect}
                animate={{
                  scale: isAnswered ? (isCorrect ? 1 : [1, 1.05, 0.95, 1]) : 1,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '120px',
                  minHeight: '88px',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: isAnswered
                    ? isCorrect
                      ? '2px solid #34C759'
                      : '2px solid #FF3B30'
                    : '2px dashed rgba(255, 255, 255, 0.5)',
                  backgroundColor: isAnswered
                    ? isCorrect
                      ? 'rgba(52, 199, 89, 0.2)'
                      : 'rgba(255, 59, 48, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: isCorrect ? 'default' : 'pointer',
                  margin: '0 8px',
                  touchAction: 'manipulation',
                }}
              >
                {isAnswered ? blank.correctAnswer : '____'}
              </motion.button>
            );
          }

          return (
            <span key={idx} style={{ marginRight: '8px' }}>
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  /**
   * Bottom Sheet Variants
   */
  const bottomSheetVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
    },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
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
            padding: '11px',
            paddingTop: 'calc(11px + env(safe-area-inset-top))',
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

          {/* Timer & Score */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '16px', color: 'white', fontWeight: '600' }}>
              ⏱️ {getElapsedTime()}
            </div>
            <div style={{ fontSize: '16px', color: '#FFD700', fontWeight: '600' }}>
              Score: {score}
            </div>
          </div>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Progress Bar */}
        {!gameComplete && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#8E8E93' }}>
                Progress: {currentIndex + 1} / {sentences.length}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${((currentIndex + 1) / sentences.length) * 100}%`,
                  height: '100%',
                  backgroundColor: '#007AFF',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Game Content */}
        <div style={{ padding: '16px' }}>
          {sentences.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
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
                No practice items found for Cloze Text.
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
                    Score
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFD700' }}>
                    {score}
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
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: mistakes === 0 ? '#34C759' : '#FF3B30',
                    }}
                  >
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
                  Try Again
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
            // Current Sentence
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '24px',
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {renderBlankInSentence(sentences[currentIndex])}

              {/* Next Button */}
              {isCurrentSentenceComplete() && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleNextSentence}
                  style={{
                    width: '100%',
                    padding: '16px',
                    marginTop: '32px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '56px',
                  }}
                >
                  {currentIndex < sentences.length - 1 ? 'Next Sentence →' : 'Finish'}
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {showBottomSheet && selectedBlankIndex !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => {
                setShowBottomSheet(false);
                setSelectedBlankIndex(null);
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999,
              }}
            />

            {/* Bottom Sheet */}
            <motion.div
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(28, 28, 30, 0.98)',
                backdropFilter: 'blur(20px)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px',
                paddingBottom: '40px',
                zIndex: 1000,
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '2px',
                  margin: '0 auto 24px',
                }}
              />

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                Choose the correct word:
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {sentences[currentIndex]?.blanks[selectedBlankIndex]?.options.map(
                  (option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      onTouchStart={(e) => {
                        e.currentTarget.style.transform = 'scale(0.97)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      style={{
                        width: '100%',
                        minHeight: '88px',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        touchAction: 'manipulation',
                      }}
                    >
                      {option}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
}
