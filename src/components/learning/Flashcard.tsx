"use client";

import React, { useState } from 'react';

interface FlashcardProps {
    term: string;
    translation: string;
    exampleTerm?: string;
    exampleTranslation?: string;
    onScore: (quality: number) => void;
    onAudio?: () => void; // Optional audio callback
}

export default function Flashcard({
    term,
    translation,
    exampleTerm,
    exampleTranslation,
    onScore,
    onAudio
}: FlashcardProps) {
    const [flipped, setFlipped] = useState(false);

    const handleFlip = () => setFlipped(!flipped);

    const handleScoreClick = (e: React.MouseEvent, quality: number) => {
        e.stopPropagation();
        onScore(quality);
        setFlipped(false); // Reset for next card
    };

    return (
        <div className="card-area">
            <div className="card-wrapper">
                <div className={`card ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
                    {/* Front Face (English usually in original) */}
                    <div className="card-face card-front">
                        <span className="lang-label">ENGLISH</span>
                        <div className="main-word">{term}</div>
                        {exampleTerm && <div className="example-sentence">{exampleTerm}</div>}
                        <div className="flip-hint">Click to flip</div>
                    </div>

                    {/* Back Face (Greek) */}
                    <div className="card-face card-back">
                        <span className="lang-label">ΕΛΛΗΝΙΚΑ</span>
                        <div className="main-word">{translation}</div>
                        {exampleTranslation && <div className="example-sentence">{exampleTranslation}</div>}

                        {/* Audio Button on Back */}
                        {onAudio && (
                            <button 
                                className="audio-btn-back" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAudio();
                                }}
                                title="Griechische Aussprache anhören"
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'rgba(0, 122, 255, 0.15)',
                                    border: '1px solid rgba(0, 122, 255, 0.3)',
                                    color: '#007AFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            </button>
                        )}

                        {/* Performance Buttons - Only on back */}
                        <div className="performance-buttons">
                            <button className="score-btn hard" onClick={(e) => handleScoreClick(e, 2)}>Hard</button>
                            <button className="score-btn good" onClick={(e) => handleScoreClick(e, 4)}>Good</button>
                            <button className="score-btn easy" onClick={(e) => handleScoreClick(e, 5)}>Easy</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="controls-bar" style={{ marginTop: '40px' }}>
                <p style={{ color: '#8E8E93', fontSize: '14px' }}>
                    Tap the card to reveal translation, then rate your performance.
                </p>
            </div>
        </div>
    );
}
