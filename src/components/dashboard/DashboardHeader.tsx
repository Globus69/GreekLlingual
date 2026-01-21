"use client";

import React, { useState, useEffect } from 'react';

interface HeaderProps {
    studentName?: string;
}

export default function DashboardHeader({ studentName }: HeaderProps) {
    const [dateTime, setDateTime] = useState('');

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
        <header className="debug-flex">
            <div className="brand">
                <span className="brand-icon">🏛️</span>
                GreekLingua {studentName && <span style={{ opacity: 0.6, fontSize: '0.8em', marginLeft: '8px' }}>• {studentName}'s Hub</span>}
            </div>

            <div className="datetime-display" id="datetime">
                {dateTime}
            </div>

            <div className="user-profile">
                <div className="avatar">{studentName ? studentName.substring(0, 2).toUpperCase() : 'SW'}</div>
                <span className="username">{studentName || 'SWS'}</span>
            </div>
        </header>
    );
}
