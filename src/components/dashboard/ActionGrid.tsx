"use client";

import React from 'react';

export default function ActionGrid() {
    const showToast = (msg: string) => {
        // Placeholder for real toast logic
        alert(msg);
    };

    return (
        <div className="actions-group">
            <div className="actions-inner-grid">
                <div className="grid-cell">
                    <button className="btn btn-primary glass" onClick={() => showToast('✨ Preparing Magic Round...')}>
                        <span>✨</span> Start Magic Round
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-primary glass" style={{ background: '#FF5722 !important' }} onClick={() => showToast('📖 Starting Comprehension...')}>
                        <span>📖</span> Comprehension
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-primary glass" style={{ background: '#FF9800 !important' }} onClick={() => showToast('📝 Starting Exam Test...')}>
                        <span>📝</span> Exam Test
                    </button>
                </div>

                <div className="grid-cell">
                    <button className="btn btn-secondary glass" onClick={() => showToast('⚡️ Quick Lesson Started')}>
                        <span>⚡️</span> 20 min Quick Lesson
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-primary glass" style={{ background: '#00BCD4 !important' }} onClick={() => showToast('🎮 Starting Game...')}>
                        <span>🎮</span> Game
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-secondary glass" onClick={() => showToast('🧪 Running Test...')}>
                        <span>🧪</span> Test
                    </button>
                </div>

                <div className="grid-cell">
                    <button className="btn btn-primary glass" style={{ background: '#34C759 !important' }} onClick={() => showToast('📅 Lesson Started')}>
                        <span>📅</span> Lesson Today
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-tertiary glass" onClick={() => showToast('🔁 Vokabeln wiederholen')}>
                        <span>🔁</span> Vokabeln wiederholen
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-secondary glass" onClick={() => window.print()}>
                        <span>🖨️</span> Print
                    </button>
                </div>
            </div>
        </div>
    );
}
