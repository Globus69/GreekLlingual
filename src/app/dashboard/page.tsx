"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import ActionGrid from '@/components/dashboard/ActionGrid';
import ModuleGrid from '@/components/dashboard/ModuleGrid';
import '@/styles/liquid-glass.css';
import VocabularyDialog from '@/components/learning/VocabularyDialog';
import GrammarDialog from '@/components/learning/GrammarDialog';
import ComprehensionDialog from '@/components/learning/ComprehensionDialog';
import ListeningDialog from '@/components/learning/ListeningDialog';
import { supabase } from '@/db/supabase';
import Link from 'next/link';

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
    const [isVocabDialogOpen, setIsVocabDialogOpen] = useState(false);
    const [vocabDialogMode, setVocabDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isGrammarDialogOpen, setIsGrammarDialogOpen] = useState(false);
    const [grammarDialogMode, setGrammarDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isComprehensionDialogOpen, setIsComprehensionDialogOpen] = useState(false);
    const [comprehensionDialogMode, setComprehensionDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [isListeningDialogOpen, setIsListeningDialogOpen] = useState(false);
    const [listeningDialogMode, setListeningDialogMode] = useState<'weak' | 'review' | 'due'>('review');
    const [masteryProgress, setMasteryProgress] = useState(38);
    const [stats, setStats] = useState({ streak: 5, words: 47, weak: 'Verbs' });

    useEffect(() => {
        if (!authLoading) {
            // For development: Allow access even without user to avoid infinite redirect loop
            // In production, this should check for user and redirect to login
            if (user) {
                fetchStats();
            }
            const timer = setTimeout(() => {
                setLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [user, authLoading, router]);

    const fetchStats = async () => {
        try {
            if (!user?.id) return;
            
            const { data: progressData } = await supabase
                .from('student_progress')
                .select('correct_count, attempts')
                .eq('student_id', user.id);

            if (progressData && progressData.length > 0) {
                const totalCorrect = progressData.reduce((sum: number, p: any) => sum + (p.correct_count || 0), 0);
                const totalItems = 120; // Assume target is 120 words
                const calculatedProgress = Math.min(100, Math.round((totalCorrect / totalItems) * 100));
                setMasteryProgress(calculatedProgress || 38);
                setStats(prev => ({ ...prev, words: totalCorrect }));
            }
        } catch (err) {
            console.error("Stats fetching error:", err);
        }
    };

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
            <main className="dashboard-content">
                <div className="hero-section" style={{ height: 'auto', flex: '0 0 auto' }}>
                    <StatsCard />
                    {/* Hero Right Side (Welcome / quick info) can go here if needed, 
                        or we can keep it cleaner as per new design focus on footer */}
                    <div className="action-area" style={{ alignItems: 'flex-start', paddingLeft: '20px' }}>
                        <h2 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#fff' }}>Welcome back, SWS! 🏛️</h2>
                        <p style={{ fontSize: '15px', color: '#8E8E93', maxWidth: '500px', lineHeight: '1.5' }}>
                            Ready to continue your journey? You have <b>12 new vocabulary cards</b> waiting for review today.
                        </p>
                    </div>
                </div>

                <div className="dashboard-footer-area">
                    {/* LEFT: MASTERY BOX (PIMPED) */}
                    <div className="mastery-box">
                        <div className="mastery-title-v3">Learning Mastery</div>
                        <div className="mastery-total-time">Total time spent learning: 14.5 hours</div>

                        <div className="mastery-stats-row">
                            <div className="mastery-bar-container">
                                <span className="mastery-bar-icon">📖</span>
                                <div className="mastery-bar-wrapper">
                                    <div className="mastery-bar-fill" style={{ width: '62%', background: 'linear-gradient(90deg, #007AFF 0%, #00C6FF 100%)' }}></div>
                                </div>
                                <span className="mastery-bar-label">62 %</span>
                            </div>
                            <div className="mastery-bar-container">
                                <span className="mastery-bar-icon">👁️</span>
                                <div className="mastery-bar-wrapper">
                                    <div className="mastery-bar-fill" style={{ width: '28%', background: 'linear-gradient(90deg, #007AFF 0%, #00C6FF 100%)' }}></div>
                                </div>
                                <span className="mastery-bar-label">28 %</span>
                            </div>
                            <div className="mastery-bar-container">
                                <span className="mastery-bar-icon">👂</span>
                                <div className="mastery-bar-wrapper">
                                    <div className="mastery-bar-fill" style={{ width: '10%', background: 'linear-gradient(90deg, #007AFF 0%, #00C6FF 100%)' }}></div>
                                </div>
                                <span className="mastery-bar-label">10 %</span>
                            </div>
                        </div>

                        <div className="rating-tiles-grid">
                            <div className="rating-tile">
                                <span className="rating-tile-val" style={{ color: '#007AFF' }}>78%</span>
                                <span className="rating-tile-lbl">Last Test</span>
                            </div>
                            <div className="rating-tile">
                                <span className="rating-tile-val" style={{ color: '#007AFF' }}>85%</span>
                                <span className="rating-tile-lbl">Actual Test</span>
                            </div>
                            <div className="rating-tile">
                                <span className="rating-tile-val" style={{ color: '#007AFF' }}>92%</span>
                                <span className="rating-tile-lbl">Last Exam</span>
                            </div>
                        </div>

                        <div className="vocab-progress-section">
                            <div className="vocab-status-text">
                                <b>187 / 600</b> Vocabulary confidently – 413 require attention
                            </div>
                            <div className="vocab-bar-dual">
                                <div className="vocab-bar-learned" style={{ width: '31%' }}></div>
                                <div className="vocab-bar-repeat" style={{ width: '69%' }}></div>
                            </div>
                        </div>

                        <div className="mastery-suggestion">
                            Suggestion for today: 12 new vocabulary cards + 1 short text about Cyprus.
                        </div>
                    </div>

                    {/* RIGHT: 4x4 QUICK ACTIONS GRID */}
                    <div className="quick-actions-grid">
                        <ActionTile icon="✨" label="Magic Round" />
                        <ActionTile icon="⚡" label="20 min Quick Lesson" />
                        <ActionTile 
                            icon="💬" 
                            label="Daily Phrases" 
                            onClick={() => {
                                window.location.href = '/daily-phrases/daily-phrases.html';
                            }}
                        />
                        <ActionTile icon="📚" label="Short Stories" />

                        <ActionTile 
                            icon="⚠️" 
                            label="Train Weak Words" 
                            onClick={() => {
                                setVocabDialogMode('weak');
                                setIsVocabDialogOpen(true);
                            }}
                        />

                        <ActionTile 
                            icon="🔄" 
                            label="Review Vocabulary" 
                            onClick={() => {
                                setVocabDialogMode('review');
                                setIsVocabDialogOpen(true);
                            }}
                        />

                        <ActionTile 
                            icon="📅" 
                            label="Due Cards Today" 
                            onClick={() => {
                                setVocabDialogMode('due');
                                setIsVocabDialogOpen(true);
                            }}
                        />

                        <ActionTile 
                            icon="📐" 
                            label="Grammar Quick Hits" 
                            onClick={() => {
                                setGrammarDialogMode('review');
                                setIsGrammarDialogOpen(true);
                            }}
                        />

                        <ActionTile 
                            icon="👂" 
                            label="Listening Practice" 
                            onClick={() => {
                                setListeningDialogMode('review');
                                setIsListeningDialogOpen(true);
                            }}
                        />
                        <ActionTile icon="🗣️" label="Pronunciation Trainer" />
                        <ActionTile 
                            icon="🧠" 
                            label="Comprehension" 
                            onClick={() => {
                                setComprehensionDialogMode('review');
                                setIsComprehensionDialogOpen(true);
                            }}
                        />
                        <ActionTile icon="🎧" label="Audio Immersion" />

                        <ActionTile icon="📝" label="Test" />
                        <ActionTile icon="🏛️" label="Cyprus Exam Sim" />
                        <ActionTile icon="📕" label="Book Recommendations" />
                        <ActionTile icon="📊" label="Progress History" />
                    </div>
                </div>
            </main>

            {/* Vocabulary Dialog */}
            <VocabularyDialog
                isOpen={isVocabDialogOpen}
                onClose={() => setIsVocabDialogOpen(false)}
                mode={vocabDialogMode}
            />

            {/* Grammar Dialog */}
            <GrammarDialog
                isOpen={isGrammarDialogOpen}
                onClose={() => setIsGrammarDialogOpen(false)}
                mode={grammarDialogMode}
            />

            {/* Comprehension Dialog */}
            <ComprehensionDialog
                isOpen={isComprehensionDialogOpen}
                onClose={() => setIsComprehensionDialogOpen(false)}
                mode={comprehensionDialogMode}
            />

            {/* Listening Dialog */}
            <ListeningDialog
                isOpen={isListeningDialogOpen}
                onClose={() => setIsListeningDialogOpen(false)}
                mode={listeningDialogMode}
            />
        </div>
    );
}
