"use client";

import React from 'react';

export default function PerformanceHub() {
    const data = [
        { day: 'Mon', count: 45 },
        { day: 'Tue', count: 80 },
        { day: 'Wed', count: 65 },
        { day: 'Thu', count: 120 },
        { day: 'Fri', count: 95 },
        { day: 'Sat', count: 50 },
        { day: 'Sun', count: 110 },
    ];

    const maxCount = Math.max(...data.map(d => d.count));

    return (
        <div className="tile" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '24px' }}>
                <div>
                    <div style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase' }}>Learning Mastery</div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>Performance Hub</div>
                </div>
                <div className="streak" style={{ height: 'fit-content' }}>
                    <span>📈</span> +12% this week
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', width: '100%', paddingBottom: '20px' }}>
                {data.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div
                            style={{
                                width: '100%',
                                height: `${(d.count / maxCount) * 100}%`,
                                background: d.day === 'Sun' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                transition: 'height 1s ease-out',
                                boxShadow: d.day === 'Sun' ? '0 0 20px var(--accent-glow)' : 'none',
                                animation: 'fadeInUp 0.8s ease-out'
                            }}
                        />
                        <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700 }}>{d.day}</span>
                    </div>
                ))}
            </div>

            <div style={{ width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: '#8E8E93' }}>
                    Total active vocabs: <b style={{ color: '#fff' }}>187</b>
                </div>
                <div style={{ fontSize: '12px', color: '#34C759', fontWeight: 600 }}>
                    Target: 250/month
                </div>
            </div>
        </div>
    );
}
