"use client";

import React, { useState } from 'react';

export default function StudentPageMockComplex() {
    const [activeTab, setActiveTab] = useState('learn'); // learn, stats, decks
    const [flipped, setFlipped] = useState(false);

    return (
        <div style={{
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            fontFamily: 'var(--font-sans)',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, rgba(125,125,255,0.05) 0%, rgba(255,125,125,0.05) 100%)'
        }}>

            {/* Top Navigation Bar */}
            <nav className="glass" style={{
                padding: '16px 32px',
                borderRadius: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: '20px',
                zIndex: 100
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    HeleLearn
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['Learn', 'Stats', 'Decks'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                background: activeTab === tab.toLowerCase() ? 'var(--accent-gradient)' : 'transparent',
                                color: activeTab === tab.toLowerCase() ? 'white' : 'inherit',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                        <span style={{ fontSize: '1.2rem' }}>🔥</span> 14 Day Streak
                    </div>
                    <div className="glass" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee' }}></div>
                </div>
            </nav>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '24px', flex: 1 }}>

                {/* Main Content Area */}
                <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {activeTab === 'learn' && (
                        <>
                            {/* Complex Flashcard */}
                            <div style={{ perspective: '1200px', height: '450px' }}>
                                <div
                                    onClick={() => setFlipped(!flipped)}
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        transformStyle: 'preserve-3d',
                                        transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {/* Front Side */}
                                    <div className="glass" style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        backfaceVisibility: 'hidden',
                                        borderRadius: '32px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '40px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ background: 'rgba(52, 199, 89, 0.1)', color: '#34c759', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>NEW CARD</span>
                                            <span style={{ opacity: 0.5, fontSize: '13px' }}>Themen: Food & Drink</span>
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                                            {/* Video/Image Placeholder */}
                                            <div className="glass" style={{ width: '100%', maxWidth: '300px', height: '180px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#000' }}>
                                                <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Native Speaker Example</span>
                                                </div>
                                            </div>
                                            <h2 style={{ fontSize: '4rem', margin: 0 }}>Το ψωμί</h2>
                                            <p style={{ opacity: 0.5, fontStyle: 'italic' }}>[to pso-mí]</p>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                            <button className="glass" style={{ padding: '10px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
                                                Listen
                                            </button>
                                            <button className="glass" style={{ padding: '10px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                                                💡 Hint
                                            </button>
                                        </div>
                                    </div>

                                    {/* Back Side */}
                                    <div className="glass" style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        backfaceVisibility: 'hidden',
                                        borderRadius: '32px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '40px',
                                        transform: 'rotateX(180deg)',
                                        background: 'var(--accent-gradient)',
                                        color: 'white',
                                        border: 'none'
                                    }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                            <h2 style={{ fontSize: '4.5rem', margin: 0, fontWeight: 800 }}>Bread</h2>
                                            <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Usage: "Θέλω λίγο ψωμί, παρακαλώ."</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                            {['Again', 'Hard', 'Good', 'Easy'].map((level) => (
                                                <button key={level} style={{ padding: '12px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Inputs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Spelling Input</h3>
                                    <div style={{ position: 'relative' }}>
                                        <input type="text" placeholder="Type the translation..." style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.3)', fontSize: '1rem', outline: 'none' }} />
                                        <button style={{ position: 'absolute', right: '10px', top: '10px', bottom: '10px', padding: '0 16px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 600 }}>Check</button>
                                    </div>
                                </div>
                                <div className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,59,48,0.3)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Speak Now</h3>
                                    <p style={{ fontSize: '13px', opacity: 0.5 }}>Practice your pronunciation</p>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'stats' && (
                        <div className="glass" style={{ padding: '40px', borderRadius: '32px' }}>
                            <h2 style={{ marginBottom: '30px' }}>Your Learning Journey</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                                {[
                                    { label: 'Words Mastered', value: '428', color: '#34c759' },
                                    { label: 'Learning Depth', value: '82%', color: '#ff9500' },
                                    { label: 'Total Cards', value: '1,204', color: '#0071e3' }
                                ].map((stat) => (
                                    <div key={stat.label} className="glass" style={{ padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.6 }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Fake Graph */}
                            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 20px' }}>
                                {[40, 60, 45, 90, 65, 80, 100, 70, 85].map((h, i) => (
                                    <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--accent-gradient)', borderRadius: '8px 8px 0 0', opacity: 0.6 + (i * 0.05) }}></div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', opacity: 0.4, fontSize: '12px' }}>
                                <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                            </div>
                        </div>
                    )}
                </main>

                {/* Sidebar / Gamification */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Badges</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { icon: '🎯', label: 'Perfect Week' },
                                { icon: '📚', label: 'Bookworm' },
                                { icon: '🚀', label: 'Fast Learner' },
                                { icon: '👑', label: 'Polyglot' }
                            ].map((badge) => (
                                <div key={badge.label} className="glass" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '2rem' }}>{badge.icon}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{badge.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Current Decks</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { name: 'Common Phrases', count: 120, progress: 80 },
                                { name: 'Travel Greek', count: 45, progress: 30 },
                                { name: 'Business terms', count: 200, progress: 10 }
                            ].map((deck) => (
                                <div key={deck.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
                                        <span>{deck.name}</span>
                                        <span style={{ opacity: 0.5 }}>{deck.count} cards</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${deck.progress}%`, height: '100%', background: 'var(--accent-gradient)' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '24px', borderRadius: '24px', background: 'var(--accent-gradient)', color: 'white', border: 'none' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pro Plan</h3>
                        <p style={{ fontSize: '13px', opacity: 0.8, margin: '10px 0 20px 0' }}>Unlock AI Voice Analysis and unlimited decks.</p>
                        <button style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'white', color: 'var(--accent)', fontWeight: 700 }}>Upgrade Now</button>
                    </div>

                </aside>

            </div>
        </div>
    );
}
