"use client";

import React, { useState } from 'react';

interface FlashcardProps {
    term: string;
    translation: string;
    exampleTerm?: string;
    exampleTranslation?: string;
    onScore: (quality: number) => void;
    onAudio?: () => void; // Optional audio callback
    showButtonsOnBack?: boolean; // Show buttons only on back side
    onRestart?: () => void; // Restart callback
    onCancel?: () => void; // Cancel callback
}

export default function Flashcard({
    term,
    translation,
    exampleTerm,
    exampleTranslation,
    onScore,
    onAudio,
    showButtonsOnBack = true,
    onRestart,
    onCancel
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
                        
                        {/* Action Buttons on Front - Wiederholen & Abbrechen */}
                        {(onRestart || onCancel) && (
                            <div style={{
                                position: 'absolute',
                                bottom: '24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '100%',
                                padding: '0 24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'calc(8px * 0.7)',
                                alignItems: 'center'
                            }}>
                                {onRestart && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRestart();
                                        }}
                                        style={{
                                            width: '100%',
                                            maxWidth: '200px',
                                            padding: '10px 16px',
                                            borderRadius: '14px',
                                            background: 'rgba(44, 44, 46, 0.6)',
                                            backdropFilter: 'blur(20px) saturate(150%)',
                                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            color: '#f97316',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            letterSpacing: '-0.1px',
                                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(44, 44, 46, 0.8)';
                                            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(249, 115, 22, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(44, 44, 46, 0.6)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="23 4 23 10 17 10"></polyline>
                                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                        </svg>
                                        Wiederholen
                                    </button>
                                )}
                                {onCancel && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCancel();
                                        }}
                                        style={{
                                            width: '100%',
                                            maxWidth: '200px',
                                            padding: '10px 16px',
                                            borderRadius: '14px',
                                            background: 'rgba(44, 44, 46, 0.6)',
                                            backdropFilter: 'blur(20px) saturate(150%)',
                                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            color: '#ef4444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            letterSpacing: '-0.1px',
                                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(44, 44, 46, 0.8)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(239, 68, 68, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(44, 44, 46, 0.6)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        Abbrechen
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Back Face (Greek) */}
                    <div className="card-face card-back">
                        <span className="lang-label">ΕΛΛΗΝΙΚΑ</span>
                        <div className="main-word">{translation}</div>
                        {exampleTranslation && <div className="example-sentence">{exampleTranslation}</div>}

                        {/* Buttons Container - Only shown when flipped */}
                        {showButtonsOnBack && (
                            <div style={{
                                position: 'absolute',
                                bottom: '24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '100%',
                                padding: '0 24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                alignItems: 'center'
                            }}>
                                {/* Audio Button */}
                                {onAudio && (
                                    <button 
                                        className="audio-btn-back" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAudio();
                                        }}
                                        title="Griechische Aussprache anhören"
                                        style={{
                                            width: '100%',
                                            maxWidth: '200px',
                                            padding: 'calc(10px * 1.33) 16px',
                                            borderRadius: '14px',
                                            background: 'rgba(44, 44, 46, 0.6)',
                                            backdropFilter: 'blur(20px) saturate(150%)',
                                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            color: '#6366f1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            letterSpacing: '-0.1px',
                                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(44, 44, 46, 0.8)';
                                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(99, 102, 241, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(44, 44, 46, 0.6)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                        </svg>
                                        Audio
                                    </button>
                                )}

                                {/* Rating Buttons - Daily Phrases Style */}
                                <div style={{
                                    display: 'flex',
                                    gap: 'calc(16px * 0.7)',
                                    width: '100%',
                                    maxWidth: '400px',
                                    justifyContent: 'center'
                                }}>
                                    <button 
                                        className="rating-btn-back rating-hard-back" 
                                        onClick={(e) => handleScoreClick(e, 1)}
                                        style={{
                                            padding: 'calc(12px * 1.33) 24px',
                                            borderRadius: '14px',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            minWidth: '90px',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                            letterSpacing: '-0.2px',
                                            position: 'relative',
                                            backdropFilter: 'blur(20px) saturate(150%)',
                                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                            overflow: 'hidden',
                                            background: 'rgba(239, 68, 68, 0.15)',
                                            color: '#ef4444'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.15)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                    >
                                        Hard
                                    </button>
                                    <button 
                                        className="rating-btn-back rating-good-back" 
                                        onClick={(e) => handleScoreClick(e, 2.5)}
                                        style={{
                                            padding: 'calc(12px * 1.33) 24px',
                                            borderRadius: '14px',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            minWidth: '90px',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                            letterSpacing: '-0.2px',
                                            position: 'relative',
                                            backdropFilter: 'blur(20px) saturate(150%)',
                                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                            overflow: 'hidden',
                                            background: 'rgba(255, 204, 0, 0.15)',
                                            color: '#ffcc00'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 204, 0, 0.25)';
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 204, 0, 0.3), 0 0 40px rgba(255, 204, 0, 0.15)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 204, 0, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 204, 0, 0.15)';
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                    >
                                        Good
                                    </button>
                                    <button 
                                        className="rating-btn-back rating-easy-back" 
                                        onClick={(e) => handleScoreClick(e, 3)}
                                        style={{
                                            padding: 'calc(12px * 1.33) 24px',
                                            borderRadius: '14px',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            minWidth: '90px',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                            letterSpacing: '-0.2px',
                                            position: 'relative',
                                            backdropFilter: 'blur(20px) saturate(150%)',
                                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                            overflow: 'hidden',
                                            background: 'rgba(52, 199, 89, 0.15)',
                                            color: '#34c759'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(52, 199, 89, 0.25)';
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(52, 199, 89, 0.3), 0 0 40px rgba(52, 199, 89, 0.15)';
                                            e.currentTarget.style.borderColor = 'rgba(52, 199, 89, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(52, 199, 89, 0.15)';
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                    >
                                        Easy
                                    </button>
                                </div>
                            </div>
                        )}
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
