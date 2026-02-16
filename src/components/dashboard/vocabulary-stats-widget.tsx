"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface VocabularyStats {
    due_today: number;
    total_reviews: number;
    retention_rate: number;
    avg_difficulty: number;
    cards_by_state: {
        new: number;
        learning: number;
        review: number;
        relearning: number;
    };
    daily_reviews: Array<{
        date: string;
        reviews: number;
        correct: number;
        incorrect: number;
    }>;
    period_days: number;
}

interface VocabularyStatsWidgetProps {
    onOpenDialog?: () => void;
}

export default function VocabularyStatsWidget({ onOpenDialog }: VocabularyStatsWidgetProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState<VocabularyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            loadStats();
        }
    }, [user?.id]);

    const loadStats = async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('get_vocabulary_stats', {
                p_user_id: user.id,
                p_days: 7
            });

            if (rpcError) {
                console.error('❌ Stats RPC error:', rpcError);
                setError('Failed to load stats');
                return;
            }

            if (data) {
                setStats(data as VocabularyStats);
                console.log('✅ Vocabulary stats loaded:', data);
            }
        } catch (err) {
            console.error('❌ Stats load error:', err);
            setError('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    // Format chart data
    const chartData = stats?.daily_reviews?.map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reviews: day.reviews,
        correct: day.correct
    })) || [];

    // Calculate total cards
    const totalCards = stats ?
        stats.cards_by_state.new +
        stats.cards_by_state.learning +
        stats.cards_by_state.review +
        stats.cards_by_state.relearning
        : 0;

    if (loading) {
        return (
            <div className="stats-widget vocabulary-stats loading">
                <div className="widget-header">
                    <h3>📚 Vocabulary</h3>
                </div>
                <div className="loading-spinner">⏳</div>
                <style jsx>{`
                    .loading-spinner {
                        text-align: center;
                        font-size: 32px;
                        padding: 40px;
                    }
                `}</style>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="stats-widget vocabulary-stats error">
                <div className="widget-header">
                    <h3>📚 Vocabulary</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '40px 20px' }}>
                    {error || 'No data available'}
                </p>
            </div>
        );
    }

    return (
        <div
            className="stats-widget vocabulary-stats"
            onClick={onOpenDialog}
            style={{ cursor: onOpenDialog ? 'pointer' : 'default' }}
        >
            <div className="widget-header">
                <h3>📚 Vocabulary</h3>
                {onOpenDialog && <span className="click-hint">Click to practice →</span>}
            </div>

            {/* Due Cards Today */}
            <div className="due-cards-section">
                <div className="due-count">{stats.due_today}</div>
                <div className="due-label">Cards Due Today</div>
            </div>

            {/* Retention Rate */}
            <div className="retention-section">
                <div className="retention-header">
                    <span className="retention-label">Retention Rate (7 days)</span>
                    <span className="retention-value">{stats.retention_rate}%</span>
                </div>
                <div className="retention-bar">
                    <div
                        className="retention-fill"
                        style={{
                            width: `${Math.min(stats.retention_rate, 100)}%`,
                            background: stats.retention_rate >= 80
                                ? 'linear-gradient(90deg, #51CF66, #339AF0)'
                                : stats.retention_rate >= 60
                                    ? 'linear-gradient(90deg, #FFA94D, #FFD93D)'
                                    : 'linear-gradient(90deg, #FF6B6B, #FFA94D)'
                        }}
                    />
                </div>
            </div>

            {/* Mini Chart - Reviews Last 7 Days */}
            <div className="chart-section">
                <div className="chart-label">Reviews (Last 7 Days)</div>
                <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                            stroke="rgba(255,255,255,0.1)"
                        />
                        <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                            stroke="rgba(255,255,255,0.1)"
                            width={25}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(20,20,24,0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="reviews"
                            stroke="#667eea"
                            strokeWidth={2}
                            dot={{ fill: '#667eea', r: 3 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="correct"
                            stroke="#51CF66"
                            strokeWidth={2}
                            dot={{ fill: '#51CF66', r: 3 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Cards by State */}
            <div className="state-section">
                <div className="state-chips">
                    <div className="state-chip new">
                        <span className="state-count">{stats.cards_by_state.new}</span>
                        <span className="state-label">New</span>
                    </div>
                    <div className="state-chip learning">
                        <span className="state-count">{stats.cards_by_state.learning}</span>
                        <span className="state-label">Learning</span>
                    </div>
                    <div className="state-chip review">
                        <span className="state-count">{stats.cards_by_state.review}</span>
                        <span className="state-label">Review</span>
                    </div>
                    {stats.cards_by_state.relearning > 0 && (
                        <div className="state-chip relearning">
                            <span className="state-count">{stats.cards_by_state.relearning}</span>
                            <span className="state-label">Relearning</span>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .stats-widget {
                    background: rgba(28, 28, 32, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 24px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .stats-widget:hover {
                    background: rgba(28, 28, 32, 0.75);
                    border-color: rgba(102, 126, 234, 0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
                }

                .widget-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .widget-header h3 {
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                    margin: 0;
                }

                .click-hint {
                    font-size: 12px;
                    color: rgba(102, 126, 234, 0.7);
                    font-weight: 500;
                }

                .due-cards-section {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .due-count {
                    font-size: 48px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 4px;
                }

                .due-label {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 500;
                }

                .retention-section {
                    margin-bottom: 20px;
                }

                .retention-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .retention-label {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 500;
                }

                .retention-value {
                    font-size: 16px;
                    color: #fff;
                    font-weight: 700;
                }

                .retention-bar {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .retention-fill {
                    height: 100%;
                    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 4px;
                }

                .chart-section {
                    margin-bottom: 20px;
                }

                .chart-label {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 500;
                    margin-bottom: 8px;
                }

                .state-section {
                    margin-top: 16px;
                }

                .state-chips {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .state-chip {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .state-chip.new {
                    background: rgba(102, 126, 234, 0.15);
                    color: #667eea;
                }

                .state-chip.learning {
                    background: rgba(255, 169, 77, 0.15);
                    color: #FFA94D;
                }

                .state-chip.review {
                    background: rgba(81, 207, 102, 0.15);
                    color: #51CF66;
                }

                .state-chip.relearning {
                    background: rgba(255, 107, 107, 0.15);
                    color: #FF6B6B;
                }

                .state-count {
                    font-size: 14px;
                    font-weight: 700;
                }

                .state-label {
                    opacity: 0.8;
                }
            `}</style>
        </div>
    );
}
