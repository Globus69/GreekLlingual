"use client";

import React, { useState } from 'react';

interface FlashcardProps {
    term: string;
    translation: string;
    exampleTerm?: string;
    exampleTranslation?: string;
    onScore: (quality: number) => void;
}

export default function Flashcard({
    term,
    translation,
    exampleTerm,
    exampleTranslation,
    onScore
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
