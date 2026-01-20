"use client";

import React, { useState } from 'react';

export default function StudentMockup() {
    const [flipped, setFlipped] = useState(false);

    return (
        <div style={{
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '30px',
            minHeight: '100vh',
            background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,113,227,0.05) 100%)'
        }}>
            {/* Header Info */}
            <div className="glass" style={{
                padding: '12px 24px',
                borderRadius: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.9rem',
                fontWeight: 600
            }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34c759' }}></div>
                Learning: Modern Greek
                <span style={{ opacity: 0.4 }}>•</span>
                Student: Alex
            </div>

            {/* Flashcard Container */}
            <div style={{
                perspective: '1000px',
                width: '100%',
                maxWidth: '500px',
                height: '350px'
            }}>
                <div
                    onClick={() => setFlipped(!flipped)}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        cursor: 'pointer'
                    }}
                >
                    {/* Front */}
                    <div className="glass" style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        borderRadius: '28px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '40px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '20px' }}>Term</div>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: 700, margin: 0 }}>Καλημέρα</h2>
                        <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                            <button style={{
                                background: 'rgba(0,0,0,0.05)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Back */}
                    <div className="glass" style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        borderRadius: '28px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '40px',
                        textAlign: 'center',
                        transform: 'rotateY(180deg)',
                        background: 'var(--accent-gradient)',
                        color: 'white',
                        border: 'none'
                    }}>
                        <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: '20px' }}>Translation</div>
                        <h2 style={{ fontSize: '3rem', fontWeight: 700, margin: 0 }}>Good Morning</h2>
                    </div>
                </div>
            </div>

            {/* Multiple Choice Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', maxWidth: '500px' }}>
                {['Good Evening', 'Good Morning', 'Hello', 'Goodbye'].map((option, i) => (
                    <button key={i} className="glass" style={{
                        padding: '20px',
                        borderRadius: '20px',
                        border: i === 1 ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: i === 1 ? 'rgba(0,113,227,0.1)' : 'var(--glass-bg)'
                    }}>
                        {option}
                    </button>
                ))}
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', maxWidth: '500px', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden', marginTop: '20px' }}>
                <div style={{ width: '45%', height: '100%', background: 'var(--accent-gradient)' }}></div>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.5, fontWeight: 500 }}>Cards remaining: 12 / 20</div>
        </div>
    );
}
