"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/useTranslation';

interface HeaderProps {
    studentName?: string;
}

export default function DashboardHeader({ studentName }: HeaderProps) {
    const [dateTime, setDateTime] = useState('');
    const { logout, isAdmin } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            setDateTime(`${day}.${month}.${year} ${hours}:${minutes}:${seconds}`);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header>
            <div className="brand">
                <span className="brand-icon">🏛️</span>
                GreekLingua {studentName && <span style={{ opacity: 0.6, fontSize: '0.8em', marginLeft: '8px' }}>• {studentName}</span>}
            </div>

            <div className="datetime-display" id="datetime">
                {dateTime}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="user-profile">
                    <div className="avatar">{studentName ? studentName.substring(0, 2).toUpperCase() : 'SW'}</div>
                    <span className="username">{studentName || 'SWS'}</span>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => router.push('/admin')}
                        style={{
                            background: 'rgba(88, 86, 214, 0.12)',
                            border: '1px solid rgba(88, 86, 214, 0.25)',
                            borderRadius: '12px',
                            padding: '8px 14px',
                            color: '#5856D6',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(88, 86, 214, 0.22)';
                            e.currentTarget.style.borderColor = 'rgba(88, 86, 214, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(88, 86, 214, 0.12)';
                            e.currentTarget.style.borderColor = 'rgba(88, 86, 214, 0.25)';
                        }}
                    >
                        <span style={{ fontSize: '15px' }}>⚙️</span> {t('header.admin')}
                    </button>
                )}
                <button
                    onClick={logout}
                    style={{
                        background: 'rgba(255, 59, 48, 0.12)',
                        border: '1px solid rgba(255, 59, 48, 0.25)',
                        borderRadius: '12px',
                        padding: '8px 14px',
                        color: '#FF3B30',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.22)';
                        e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.25)';
                    }}
                >
                    <span style={{ fontSize: '15px' }}>↪</span> {t('header.logout')}
                </button>
            </div>
        </header>
    );
}
