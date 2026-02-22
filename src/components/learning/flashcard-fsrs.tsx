"use client";

import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useTranslation } from '@/lib/use-translation';
import type { Rating } from '@/lib/fsrs/fsrs-types';

interface FlashcardFSRSProps {
    front: string; // English/Russian
    back: string; // Greek word
    phonetic?: string; // IPA pronunciation
    example?: string; // Greek example sentence
    flipped: boolean;
    onFlip: () => void;
    onRating: (rating: Rating) => void;
    showRatingButtons?: boolean; // Show buttons only when flipped
    onBackClick?: () => void; // Click on card back to play audio
    useFSRS?: boolean; // If false, show simple "Wrong/Correct" buttons instead of 4-button FSRS
    itemType?: 'vocabulary' | 'daily_phrase'; // Differentiate visually
}

const RATING_BUTTONS_FSRS = [
    { rating: 1 as Rating, label: 'Again', color: '#FF6B6B', emoji: '❌', key: '1' },
    { rating: 2 as Rating, label: 'Hard', color: '#FFA94D', emoji: '🟠', key: '2' },
    { rating: 3 as Rating, label: 'Good', color: '#51CF66', emoji: '✅', key: '3' },
    { rating: 4 as Rating, label: 'Easy', color: '#339AF0', emoji: '🎯', key: '4' },
];

const RATING_BUTTONS_SIMPLE = [
    { rating: 1 as Rating, label: 'Wrong', color: '#FF6B6B', emoji: '❌', key: '1' },
    { rating: 3 as Rating, label: 'Correct', color: '#51CF66', emoji: '✅', key: '3' },
];

export default function FlashcardFSRS({
    front,
    back,
    phonetic,
    example,
    flipped,
    onFlip,
    onRating,
    showRatingButtons = true,
    onBackClick,
    useFSRS = false,
    itemType
}: FlashcardFSRSProps) {
    const { t } = useTranslation();
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

    // Choose button set based on mode
    const ratingButtons = useFSRS ? RATING_BUTTONS_FSRS : RATING_BUTTONS_SIMPLE;

    const handleRatingClick = (e: React.MouseEvent, rating: Rating) => {
        e.stopPropagation();
        onRating(rating);
    };

    // Swipe gesture handlers (only active when flipped)
    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (flipped) {
                setSwipeDirection('left');
                setTimeout(() => {
                    onRating(1); // Wrong/Again
                    setSwipeDirection(null);
                }, 150);
            }
        },
        onSwipedRight: () => {
            if (flipped) {
                setSwipeDirection('right');
                setTimeout(() => {
                    onRating(useFSRS ? 4 : 3); // Easy (FSRS) or Correct (Simple)
                    setSwipeDirection(null);
                }, 150);
            }
        },
        onSwipedUp: () => {
            if (flipped && useFSRS) {
                setSwipeDirection('up');
                setTimeout(() => {
                    onRating(3); // Good (FSRS only)
                    setSwipeDirection(null);
                }, 150);
            }
        },
        onSwipedDown: () => {
            if (flipped && useFSRS) {
                setSwipeDirection('down');
                setTimeout(() => {
                    onRating(2); // Hard (FSRS only)
                    setSwipeDirection(null);
                }, 150);
            }
        },
        trackMouse: false, // Disable mouse tracking to prevent conflicts with click
        trackTouch: true,
        delta: 50, // Minimum swipe distance in pixels
        preventScrollOnSwipe: true,
    });

    // Get swipe feedback data
    const getSwipeFeedback = () => {
        switch (swipeDirection) {
            case 'left':
                return { color: '#FF6B6B', emoji: '❌', label: 'Again' };
            case 'right':
                return { color: '#339AF0', emoji: '🎯', label: 'Easy' };
            case 'up':
                return { color: '#51CF66', emoji: '✅', label: 'Good' };
            case 'down':
                return { color: '#FFA94D', emoji: '🟠', label: 'Hard' };
            default:
                return null;
        }
    };

    const swipeFeedback = getSwipeFeedback();

    return (
        <div className="flashcard-container">
            <div
                {...(flipped ? handlers : {})}
                className={`flashcard ${flipped ? 'flipped' : ''} ${swipeDirection ? 'swiping' : ''} ${flipped && onBackClick ? 'clickable-back' : ''}`}
                onClick={!flipped ? onFlip : onBackClick}
            >
                {/* Front Face */}
                <div className="flashcard-face flashcard-front">
                    {itemType === 'daily_phrase' ? (
                        <div className="type-badge phrase-badge">💬 Daily Phrase</div>
                    ) : itemType === 'vocabulary' ? (
                        <div className="type-badge vocab-badge">📚 Vocabulary</div>
                    ) : null}
                    <span className="lang-label">{t('flashcard.label_source')}</span>
                    <div className="main-word">{front}</div>
                    <div className="flip-hint">{t('flashcard.tap_hint')}</div>
                </div>

                {/* Back Face */}
                <div className="flashcard-face flashcard-back">
                    <div className="greek-word">{back}</div>
                    {phonetic && (
                        <div className="phonetic">/{phonetic}/</div>
                    )}
                    {example && (
                        <div className="example-sentence">{example}</div>
                    )}
                    {flipped && (
                        <div className="swipe-hint">
                            {useFSRS ? '← Again | ↓ Hard | ↑ Good | Easy →' : '← Wrong | Correct →'}
                        </div>
                    )}
                </div>

                {/* Swipe Feedback Overlay */}
                {swipeFeedback && (
                    <div
                        className="swipe-overlay"
                        style={{
                            '--overlay-color': swipeFeedback.color
                        } as React.CSSProperties}
                    >
                        <div className="swipe-feedback">
                            <span className="swipe-emoji">{swipeFeedback.emoji}</span>
                            <span className="swipe-label">{swipeFeedback.label}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Rating Buttons (FSRS or Simple Mode) */}
            {flipped && showRatingButtons && (
                <div className={`rating-buttons ${useFSRS ? 'fsrs-mode' : 'simple-mode'}`}>
                    {ratingButtons.map((btn) => (
                        <button
                            key={btn.rating}
                            onClick={(e) => handleRatingClick(e, btn.rating)}
                            className="rating-btn"
                            style={{
                                '--btn-color': btn.color
                            } as React.CSSProperties}
                            title={`${btn.label} (Press ${btn.key})`}
                        >
                            <span className="rating-emoji">{btn.emoji}</span>
                            <span className="rating-label">{btn.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <style jsx>{`
                .flashcard-container {
                    width: 100%;
                    max-width: 500px;
                    margin: 0 auto;
                    perspective: 1000px;
                }

                .flashcard {
                    position: relative;
                    width: 100%;
                    height: 400px;
                    transform-style: preserve-3d;
                    transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
                    cursor: pointer;
                    border-radius: 24px;
                }

                .flashcard.flipped {
                    transform: rotateY(180deg);
                }

                .flashcard.clickable-back {
                    cursor: pointer;
                }

                .flashcard.clickable-back:hover .flashcard-back {
                    background: rgba(28, 28, 32, 1);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(0, 122, 255, 0.3);
                }

                .flashcard-face {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    border-radius: 24px;
                    background: rgba(28, 28, 32, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                    box-sizing: border-box;
                    overflow: hidden;
                }

                .flashcard-back {
                    transform: rotateY(180deg);
                }

                .lang-label {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: rgba(255, 255, 255, 0.4);
                }

                .type-badge {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 4px 10px;
                    border-radius: 12px;
                    backdrop-filter: blur(4px);
                }

                .phrase-badge {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10B981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }

                .vocab-badge {
                    background: rgba(59, 130, 246, 0.2);
                    color: #3B82F6;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .main-word {
                    font-size: 36px;
                    font-weight: 700;
                    color: #fff;
                    text-align: center;
                    margin-bottom: 16px;
                }

                .greek-word {
                    font-size: 40px;
                    font-weight: 700;
                    color: #fff;
                    text-align: center;
                    margin-bottom: 12px;
                }

                .phonetic {
                    font-size: 18px;
                    color: #A8A8AD;
                    font-style: italic;
                    margin-bottom: 24px;
                }

                .example-sentence {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                    line-height: 1.6;
                }

                .flip-hint {
                    position: absolute;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.3);
                    font-weight: 500;
                    white-space: nowrap;
                    max-width: 90%;
                    text-align: center;
                }

                .swipe-hint {
                    position: absolute;
                    bottom: 16px;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-align: center;
                    width: 100%;
                    padding: 0 20px;
                }

                /* Swipe Overlay */
                .swipe-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: color-mix(in srgb, var(--overlay-color) 25%, rgba(0, 0, 0, 0.7));
                    backdrop-filter: blur(8px);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: swipeFadeIn 0.15s ease-out;
                    z-index: 10;
                    pointer-events: none;
                }

                .swipe-feedback {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    animation: swipeScale 0.15s ease-out;
                }

                .swipe-emoji {
                    font-size: 64px;
                    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
                }

                .swipe-label {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fff;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                }

                @keyframes swipeFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes swipeScale {
                    from {
                        transform: scale(0.8);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .flashcard.swiping {
                    cursor: grabbing;
                }

                /* Rating Buttons */
                .rating-buttons {
                    display: grid;
                    gap: 12px;
                    margin-top: 24px;
                    width: 100%;
                    max-width: 500px;
                }

                .rating-buttons.fsrs-mode {
                    grid-template-columns: repeat(4, 1fr);
                }

                .rating-buttons.simple-mode {
                    grid-template-columns: repeat(2, 1fr);
                }

                .rating-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 16px 8px;
                    border: none;
                    border-radius: 16px;
                    background: color-mix(in srgb, var(--btn-color) 15%, rgba(28, 28, 32, 0.8));
                    border: 2px solid color-mix(in srgb, var(--btn-color) 30%, transparent);
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    backdrop-filter: blur(10px);
                    min-height: 80px;
                    position: relative;
                    overflow: hidden;
                }

                .rating-btn:hover {
                    transform: translateY(-4px);
                    background: color-mix(in srgb, var(--btn-color) 25%, rgba(28, 28, 32, 0.9));
                    border-color: color-mix(in srgb, var(--btn-color) 50%, transparent);
                    box-shadow: 0 8px 24px color-mix(in srgb, var(--btn-color) 30%, transparent);
                }

                .rating-btn:active {
                    transform: translateY(-2px) scale(0.98);
                }

                .rating-emoji {
                    font-size: 28px;
                    margin-bottom: 6px;
                }

                .rating-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #fff;
                    margin-bottom: 4px;
                }

                .rating-key {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    font-size: 10px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.4);
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                /* Mobile Responsive */
                @media (max-width: 600px) {
                    .flashcard {
                        height: 380px;
                    }

                    .main-word, .greek-word {
                        font-size: 28px;
                    }

                    .phonetic {
                        font-size: 16px;
                    }

                    .flashcard-face {
                        padding: 24px;
                    }

                    .flip-hint {
                        bottom: 10px;
                        font-size: 11px;
                        padding: 0 10px;
                    }

                    .swipe-hint {
                        font-size: 10px;
                        bottom: 10px;
                    }

                    .swipe-emoji {
                        font-size: 48px;
                    }

                    .swipe-label {
                        font-size: 18px;
                    }

                    .rating-buttons.fsrs-mode, .rating-buttons.simple-mode {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                    }

                    .rating-btn {
                        min-height: 70px;
                        padding: 12px 6px;
                    }

                    .rating-emoji {
                        font-size: 24px;
                    }

                    .rating-label {
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
}
