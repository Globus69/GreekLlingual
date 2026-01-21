"use client";

import React from 'react';

interface StatsCardProps {
    level?: string;
    streak?: number;
    vocabsCount?: number;
    learnedHours?: number;
    dailyGoalText?: string;
}

export default function StatsCard({
    level = 'B1',
    streak = 5,
    vocabsCount = 187,
    learnedHours = 14.5,
    dailyGoalText = "12 new vocabs & 1 short text."
}: StatsCardProps) {
    return (
        <div className="stats-card debug-flex">
            <div className="stats-top">
                <div>
                    <div className="level-label">Current Level</div>
                    <div className="level-badge">{level}</div>
                </div>
                <div className="streak">
                    <span>🔥</span> {streak} Days
                </div>
            </div>

            <div className="stats-mid">
                <div className="stat-item">
                    <div className="val">{vocabsCount}</div>
                    <div className="lbl">Vocabs</div>
                </div>
                <div className="stat-item">
                    <div className="val">{learnedHours}h</div>
                    <div className="lbl">Learned</div>
                </div>
            </div>

            <div className="stats-footer">
                <i>Today:</i> {dailyGoalText}
            </div>
        </div>
    );
}
