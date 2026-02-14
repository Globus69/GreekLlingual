"use client";

import React from 'react';
import { useTranslation } from '@/lib/use-translation';

export default function PerformanceHub() {
    const { t } = useTranslation();

    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
    const data = [
        { dayKey: 'mon', count: 45 },
        { dayKey: 'tue', count: 80 },
        { dayKey: 'wed', count: 65 },
        { dayKey: 'thu', count: 120 },
        { dayKey: 'fri', count: 95 },
        { dayKey: 'sat', count: 50 },
        { dayKey: 'sun', count: 110 },
    ];

    const maxCount = Math.max(...data.map(d => d.count));

    return (
        <div className="tile debug-flex" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '24px' }}>
                <div>
                    <div style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase' }}>{t('perf.title')}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>{t('perf.subtitle')}</div>
                </div>
                <div className="streak" style={{ height: 'fit-content' }}>
                    <span>📈</span> {t('perf.this_week')}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', width: '100%', paddingBottom: '20px' }}>
                {data.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div
                            style={{
                                width: '100%',
                                height: `${(d.count / maxCount) * 100}%`,
                                background: d.dayKey === 'sun' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                transition: 'height 1s ease-out',
                                boxShadow: d.dayKey === 'sun' ? '0 0 20px var(--accent-glow)' : 'none',
                                animation: 'fadeInUp 0.8s ease-out'
                            }}
                        />
                        <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700 }}>{t(`perf.day.${d.dayKey}`)}</span>
                    </div>
                ))}
            </div>

            <div style={{ width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: '#8E8E93' }}>
                    {t('perf.total_active')} <b style={{ color: '#fff' }}>187</b>
                </div>
                <div style={{ fontSize: '12px', color: '#34C759', fontWeight: 600 }}>
                    {t('perf.target')}
                </div>
            </div>
        </div>
    );
}
