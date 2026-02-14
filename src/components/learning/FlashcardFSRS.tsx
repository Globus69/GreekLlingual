"use client";

import React from 'react';
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
}

const RATING_BUTTONS = [
    { rating: 1 as Rating, label: 'Again', color: '#FF6B6B', emoji: '❌', key: '1' },
    { rating: 2 as Rating, label: 'Hard', color: '#FFA94D', emoji: '🟠', key: '2' },
    { rating: 3 as Rating, label: 'Good', color: '#51CF66', emoji: '✅', key: '3' },
    { rating: 4 as Rating, label: 'Easy', color: '#339AF0', emoji: '🎯', key: '4' },
];

export default function FlashcardFSRS({
    front,
    back,
    phonetic,
    example,
    flipped,
    onFlip,
    onRating,
    showRatingButtons = true
}: FlashcardFSRSProps) {
    const { t } = useTranslation();

    const handleRatingClick = (e: React.MouseEvent, rating: Rating) => {
        e.stopPropagation();
        onRating(rating);
    };

    return (
        <div className="flashcard-container">
            <div
                className={`flashcard ${flipped ? 'flipped' : ''}`}
                onClick={onFlip}
            >
                {/* Front Face */}
                <div className="flashcard-face flashcard-front">
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
                </div>
            </div>

            {/* Rating Buttons (4-Button FSRS System) */}
            {flipped && showRatingButtons && (
                <div className="rating-buttons">
                    {RATING_BUTTONS.map((btn) => (
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
                            <span className="rating-key">{btn.key}</span>
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
                    bottom: 20px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.3);
                    font-weight: 500;
                }

                /* Rating Buttons */
                .rating-buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    margin-top: 24px;
                    width: 100%;
                    max-width: 500px;
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
                        height: 350px;
                    }

                    .main-word, .greek-word {
                        font-size: 28px;
                    }

                    .phonetic {
                        font-size: 16px;
                    }

                    .rating-buttons {
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
