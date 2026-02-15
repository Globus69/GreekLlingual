// components/dashboard/streak-milestone-toast.tsx
'use client';

import { CSSProperties, useEffect, useState } from 'react';
import '@/styles/streak-animations.css';

interface StreakMilestoneToastProps {
    streak: number;
    isNewRecord: boolean;
    message: string;
    onClose: () => void;
}

export function StreakMilestoneToast({
    streak,
    isNewRecord,
    message,
    onClose,
}: StreakMilestoneToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!visible) return null;

    // Get milestone config
    const getMilestoneConfig = (s: number) => {
        if (s >= 100) return { icon: '💎', color: '#9B59B6', title: '100 DAYS!' };
        if (s >= 50) return { icon: '🚀', color: '#E74C3C', title: '50 DAYS!' };
        if (s >= 30) return { icon: '👑', color: '#F1C40F', title: '30 DAYS!' };
        if (s >= 14) return { icon: '🏆', color: '#3498DB', title: '2 WEEKS!' };
        if (s >= 7) return { icon: '🌟', color: '#2ECC71', title: '1 WEEK!' };
        if (s >= 3) return { icon: '🎯', color: '#FF6B00', title: '3 DAYS!' };
        return { icon: '🔥', color: '#FF6B00', title: 'STREAK!' };
    };

    const config = getMilestoneConfig(streak);

    return (
        <div style={{
            ...toastContainerStyle,
            animation: visible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in',
        }}>
            <div style={toastStyle}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                    {config.icon}
                </div>
                <div style={{ ...titleStyle, color: config.color }}>
                    {config.title}
                </div>
                <div style={messageStyle}>
                    {message}
                </div>
                {isNewRecord && (
                    <div style={recordBadgeStyle}>
                        🏆 NEW RECORD!
                    </div>
                )}
                <div style={streakBadgeStyle}>
                    {streak} Day{streak !== 1 ? 's' : ''}
                </div>
                <button onClick={() => setVisible(false)} style={closeButtonStyle}>
                    ✕
                </button>
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const toastContainerStyle: CSSProperties = {
    position: 'fixed',
    top: '80px',
    right: '20px',
    zIndex: 10000,
};

const toastStyle: CSSProperties = {
    background: 'rgba(22, 22, 26, 0.98)',
    backdropFilter: 'blur(40px)',
    borderRadius: '20px',
    padding: '24px',
    border: '2px solid rgba(255, 107, 0, 0.3)',
    boxShadow: '0 20px 60px rgba(255, 107, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
    minWidth: '280px',
    textAlign: 'center',
    position: 'relative',
};

const titleStyle: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px',
    textShadow: '0 2px 10px rgba(255, 107, 0, 0.5)',
};

const messageStyle: CSSProperties = {
    fontSize: '13px',
    color: '#fff',
    marginBottom: '12px',
    lineHeight: 1.4,
};

const recordBadgeStyle: CSSProperties = {
    display: 'inline-block',
    padding: '6px 12px',
    background: 'rgba(255, 204, 0, 0.2)',
    border: '1px solid rgba(255, 204, 0, 0.4)',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#FFCC00',
    marginBottom: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
};

const streakBadgeStyle: CSSProperties = {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'rgba(255, 107, 0, 0.2)',
    border: '1px solid rgba(255, 107, 0, 0.4)',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#FF6B00',
};

const closeButtonStyle: CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#8E8E93',
    fontSize: '12px',
};
