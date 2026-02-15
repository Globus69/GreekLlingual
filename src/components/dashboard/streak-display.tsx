// components/dashboard/streak-display.tsx
'use client';

import { CSSProperties } from 'react';
import { useStreak } from '@/hooks/use-streak';

export function StreakDisplay() {
    const { streakInfo, loading, needsAttention, getStreakEmoji } = useStreak();

    if (loading || !streakInfo) {
        return (
            <div style={containerStyle}>
                <div style={iconStyle}>🔥</div>
                <div style={labelStyle}>Loading...</div>
            </div>
        );
    }

    const { current_streak, longest_streak, streak_status } = streakInfo;

    return (
        <div style={containerStyle}>
            {/* Current Streak */}
            <div style={mainStreakStyle}>
                <div style={iconLargeStyle}>{getStreakEmoji(current_streak)}</div>
                <div>
                    <div style={streakNumberStyle}>{current_streak}</div>
                    <div style={labelStyle}>Day Streak</div>
                </div>
            </div>

            {/* Status Message */}
            {streak_status === 'at_risk' && (
                <div style={warningStyle}>
                    ⚠️ Don't break your streak! Learn today!
                </div>
            )}
            {streak_status === 'broken' && (
                <div style={brokenStyle}>
                    😢 Streak broken. Start fresh today!
                </div>
            )}
            {streak_status === 'active_today' && current_streak > 0 && (
                <div style={activeStyle}>
                    ✅ Streak active! Great job today!
                </div>
            )}

            {/* Longest Streak */}
            {longest_streak > 0 && (
                <div style={recordStyle}>
                    <span style={recordIconStyle}>🏆</span>
                    Record: {longest_streak} {longest_streak === 1 ? 'day' : 'days'}
                </div>
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
};

const mainStreakStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
};

const iconLargeStyle: CSSProperties = {
    fontSize: '48px',
    lineHeight: 1,
};

const iconStyle: CSSProperties = {
    fontSize: '32px',
    lineHeight: 1,
};

const streakNumberStyle: CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    color: '#FF6B00',
    lineHeight: 1,
    marginBottom: '4px',
};

const labelStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: 600,
};

const warningStyle: CSSProperties = {
    padding: '10px 12px',
    background: 'rgba(255, 149, 0, 0.15)',
    border: '1px solid rgba(255, 149, 0, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#FF9500',
    textAlign: 'center',
};

const brokenStyle: CSSProperties = {
    padding: '10px 12px',
    background: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid rgba(255, 59, 48, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#FF3B30',
    textAlign: 'center',
};

const activeStyle: CSSProperties = {
    padding: '10px 12px',
    background: 'rgba(52, 199, 89, 0.15)',
    border: '1px solid rgba(52, 199, 89, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#34C759',
    textAlign: 'center',
};

const recordStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(255, 204, 0, 0.1)',
    border: '1px solid rgba(255, 204, 0, 0.2)',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#FFCC00',
};

const recordIconStyle: CSSProperties = {
    fontSize: '14px',
};
