'use client';

import React, { useEffect, useState } from 'react';
import { fetchVocabStats } from '@/lib/api/vocab';
import type { VocabStats as VocabStatsType } from '@/types/vocabulary';

export default function VocabStats() {
    const [stats, setStats] = useState<VocabStatsType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await fetchVocabStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
            }}>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            height: '100px',
                        }}
                    >
                        <div style={{
                            width: '60%',
                            height: '12px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            marginBottom: '12px',
                        }} />
                        <div style={{
                            width: '40%',
                            height: '24px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                        }} />
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div>
            {/* Overview Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
            }}>
                <StatCard
                    icon="📚"
                    value={stats.total}
                    label="Total Entries"
                    color="#007AFF"
                />
                <StatCard
                    icon="📊"
                    value={stats.avg_frequency != null ? stats.avg_frequency.toFixed(1) : '0.0'}
                    label="Avg Frequency"
                    color="#5856D6"
                    suffix="★"
                />
                <StatCard
                    icon="🔊"
                    value={stats.total > 0 ? `${Math.round((stats.with_audio.en / stats.total) * 100)}%` : '0%'}
                    label="EN Audio Coverage"
                    color="#34C759"
                />
                <StatCard
                    icon="🎯"
                    value={(stats.by_difficulty?.easy ?? 0) + (stats.by_difficulty?.medium ?? 0) + (stats.by_difficulty?.hard ?? 0)}
                    label="Ready to Practice"
                    color="#FF9500"
                />
            </div>

            {/* Level Distribution */}
            <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '24px',
            }}>
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '16px',
                    color: '#fff',
                }}>
                    Entries by Level
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '12px',
                }}>
                    <LevelBar level="A1" count={stats.by_level?.A1 ?? 0} color="#34C759" />
                    <LevelBar level="A2" count={stats.by_level?.A2 ?? 0} color="#30D158" />
                    <LevelBar level="B1" count={stats.by_level?.B1 ?? 0} color="#64D2FF" />
                    <LevelBar level="B2" count={stats.by_level?.B2 ?? 0} color="#0A84FF" />
                    <LevelBar level="C1" count={stats.by_level?.C1 ?? 0} color="#BF5AF2" />
                    <LevelBar level="C2" count={stats.by_level?.C2 ?? 0} color="#AF52DE" />
                </div>
            </div>

            {/* Difficulty Distribution */}
            <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '16px',
                    color: '#fff',
                }}>
                    Entries by Difficulty
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                }}>
                    <DifficultyBar label="Easy" count={stats.by_difficulty?.easy ?? 0} color="#34C759" />
                    <DifficultyBar label="Medium" count={stats.by_difficulty?.medium ?? 0} color="#FFD60A" />
                    <DifficultyBar label="Hard" count={stats.by_difficulty?.hard ?? 0} color="#FF3B30" />
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, value, label, color, suffix }: {
    icon: string;
    value: string | number;
    label: string;
    color: string;
    suffix?: string;
}) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
        }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color }}>
                {value}{suffix || ''}
            </div>
            <div style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px' }}>
                {label}
            </div>
        </div>
    );
}

function LevelBar({ level, count, color }: { level: string; count: number; color: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{
                height: '80px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                marginBottom: '8px',
            }}>
                <div style={{
                    width: '100%',
                    height: `${Math.min(count / 2, 100)}%`,
                    minHeight: count > 0 ? '20px' : '0',
                    background: color,
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                }}>
                    {count}
                </div>
            </div>
            <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color,
            }}>
                {level}
            </div>
        </div>
    );
}

function DifficultyBar({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#8E8E93',
            }}>
                <span>{label}</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{count}</span>
            </div>
            <div style={{
                height: '8px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    width: `${Math.max((count / 100) * 100, 0)}%`,
                    background: color,
                    transition: 'width 0.3s ease',
                }} />
            </div>
        </div>
    );
}
