"use client";

import React from 'react';
import { useTranslation } from '@/lib/use-translation';

interface StatsCardProps {
    level?: string;
    streak?: number;
    vocabsCount?: number;
    learnedHours?: number;
}

export default function StatsCard({
    level = 'B1',
    streak = 5,
    vocabsCount = 187,
    learnedHours = 14.5,
}: StatsCardProps) {
    const { t } = useTranslation();

    return (
        <div className="stats-card debug-box">
            <div className="stats-top">
                <div>
                    <div className="level-label">{t('stats.current_level')}</div>
                    <div className="level-badge">{level}</div>
                </div>
                <div className="streak">
                    <span>🔥</span> {streak} {t('stats.days')}
                </div>
            </div>

            <div className="stats-mid">
                <div className="stat-item">
                    <div className="val">{vocabsCount}</div>
                    <div className="lbl">{t('stats.vocabs')}</div>
                </div>
                <div className="stat-item">
                    <div className="val">{learnedHours}{t('stats.hours_suffix')}</div>
                    <div className="lbl">{t('stats.learned')}</div>
                </div>
            </div>

            <div className="stats-footer">
                <i>{t('stats.today')}</i> {t('stats.daily_goal_default')}
            </div>
        </div>
    );
}
