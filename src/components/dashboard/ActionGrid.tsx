"use client";

import React from 'react';
import { useTranslation } from '@/lib/use-translation';

export default function ActionGrid() {
    const { t } = useTranslation();

    const showToast = (msg: string) => {
        // Placeholder for real toast logic
        alert(msg);
    };

    return (
        <div className="actions-group debug-flex">
            <div className="actions-inner-grid debug-grid">
                <div className="grid-cell">
                    <button className="btn btn-primary glass" onClick={() => showToast('👩‍🏫 ' + t('action_grid.toast_magic_round'))}>
                        <span>👩‍🏫</span> {t('action_grid.magic_round')}
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-primary glass" style={{ background: '#FF5722 !important' }} onClick={() => showToast('📖 ' + t('action_grid.toast_comprehension'))}>
                        <span>📖</span> {t('action_grid.comprehension')}
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-primary glass" style={{ background: '#FF9800 !important' }} onClick={() => showToast('📝 ' + t('action_grid.toast_exam'))}>
                        <span>📝</span> {t('action_grid.exam_test')}
                    </button>
                </div>

                <div className="grid-cell">
                    <button className="btn btn-secondary glass" onClick={() => showToast('⚡️ ' + t('action_grid.toast_quick_lesson'))}>
                        <span>⚡️</span> {t('action_grid.quick_lesson')}
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-primary glass" style={{ background: '#00BCD4 !important' }} onClick={() => showToast('🎮 ' + t('action_grid.toast_game'))}>
                        <span>🎮</span> {t('action_grid.game')}
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-secondary glass" onClick={() => showToast('🧪 ' + t('action_grid.toast_test'))}>
                        <span>🧪</span> {t('action_grid.test')}
                    </button>
                </div>

                <div className="grid-cell">
                    <button className="btn btn-primary glass" style={{ background: '#34C759 !important' }} onClick={() => showToast('📅 ' + t('action_grid.toast_lesson'))}>
                        <span>📅</span> {t('action_grid.lesson_today')}
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-tertiary glass" onClick={() => showToast('🔁 ' + t('action_grid.toast_review'))}>
                        <span>🔁</span> {t('action_grid.review_vocab')}
                    </button>
                </div>
                <div className="grid-cell">
                    <button className="btn btn-secondary glass" onClick={() => window.print()}>
                        <span>🖨️</span> {t('action_grid.print')}
                    </button>
                </div>
            </div>
        </div>
    );
}
