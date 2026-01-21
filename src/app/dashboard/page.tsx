"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import ActionGrid from '@/components/dashboard/ActionGrid';
import ModuleGrid from '@/components/dashboard/ModuleGrid';
import '@/styles/liquid-glass.css';

interface ActionTileProps {
    icon: string;
    label: string;
    primary?: boolean;
    onClick?: () => void;
}

function ActionTile({ icon, label, primary, onClick }: ActionTileProps) {
    return (
        <div
            className="action-tile-clean"
            onClick={onClick}
            style={primary ? { borderColor: 'rgba(0, 122, 255, 0.4)', background: 'rgba(0, 122, 255, 0.03)' } : {}}
        >
            <div className="at-icon">{icon}</div>
            <div className="at-label">{label}</div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user) {
            // Simulate initial page load animation
            const timer = setTimeout(() => {
                setLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="login-overlay">
                <h1 style={{ color: 'white', fontSize: '24px' }}>🏛️ {authLoading ? 'Authenticating...' : 'Loading GreekLingua...'}</h1>
            </div>
        );
    }

    return (
        <div id="app" className="dashboard-layout">
            <DashboardHeader />
            <main className="dashboard-content debug-flex">
                <div className="hero-section debug-flex" style={{ height: 'auto', flex: '0 0 auto' }}>
                    <StatsCard />
                    {/* Hero Right Side (Welcome / quick info) can go here if needed, 
                        or we can keep it cleaner as per new design focus on footer */}
                    <div className="action-area debug-flex" style={{ alignItems: 'flex-start', paddingLeft: '20px' }}>
                        <h2 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#fff' }}>Welcome back, SWS! 🏛️</h2>
                        <p style={{ fontSize: '15px', color: '#8E8E93', maxWidth: '500px', lineHeight: '1.5' }}>
                            Ready to continue your journey? You have <b>12 new vocabulary cards</b> waiting for review today.
                        </p>
                    </div>
                </div>

                <div className="dashboard-footer-area debug-flex">
                    {/* LEFT: MASTERY BOX */}
                    <div className="mastery-box debug-flex">
                        <div className="mastery-header">
                            <div>
                                <div className="mastery-title">Learning Mastery</div>
                                <div style={{ color: '#8E8E93', marginTop: '4px', fontSize: '15px' }}>Performance Hub Overview</div>
                            </div>
                            <div className="progress-ring-container">
                                <div className="progress-ring-bg"></div>
                                <span className="progress-val">38%</span>
                            </div>
                        </div>

                        <div className="performance-mini-tiles debug-grid">
                            <div className="mini-tile">
                                <span className="m-val">🔥 5 Days</span>
                                <span className="m-lbl">Current Streak</span>
                            </div>
                            <div className="mini-tile">
                                <span className="m-val">📚 47</span>
                                <span className="m-lbl">Words this week</span>
                            </div>
                            <div className="mini-tile">
                                <span className="m-val">⚠️ Verbs</span>
                                <span className="m-lbl">Weak Point</span>
                            </div>
                        </div>

                        <div className="mastery-suggestion">
                            Suggestion for today: 12 new vocabulary cards + 1 short text about Cyprus.
                        </div>
                    </div>

                    {/* RIGHT: 3x3 QUICK ACTIONS GRID */}
                    <div className="quick-actions-grid debug-grid">
                        <ActionTile icon="✨" label="Magic Round" primary />
                        <ActionTile icon="⚡️" label="20 min Quick Lesson" />
                        <ActionTile icon="🔁" label="Review Vocabulary" onClick={() => router.push('/vokabeln')} />
                        <ActionTile icon="📅" label="Due Cards Today" />
                        <ActionTile icon="⚠️" label="Train Weak Words" />
                        <ActionTile icon="🏛️" label="Cyprus Exam Sim" />
                        <ActionTile icon="💬" label="Daily Phrases" />
                        <ActionTile icon="🎧" label="Audio Immersion" />
                        <ActionTile icon="📚" label="Read & Write" />
                    </div>
                </div>
            </main>
        </div>
    );
}
