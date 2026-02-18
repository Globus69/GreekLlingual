'use client';

import React, { CSSProperties } from 'react';
import type { ClozeTextEntry } from '@/types/cloze-text';

// Helper constants
const LEVEL_COLORS = {
    A1: '#34C759',
    A2: '#30D158',
    B1: '#64D2FF',
    B2: '#0A84FF',
    C1: '#BF5AF2',
    C2: '#AF52DE',
};

const DIFFICULTY_COLORS = {
    easy: '#34C759',
    medium: '#FFD60A',
    hard: '#FF3B30',
};

const getFrequencyStars = (frequency: number): string => {
    return '★'.repeat(frequency) + '☆'.repeat(5 - frequency);
};

interface ClozeTextTableProps {
    entries: ClozeTextEntry[];
    loading?: boolean;
    selectedIds: string[];
    onSelectIds: (ids: string[]) => void;
    onEdit: (entry: ClozeTextEntry) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
}

export default function ClozeTextTable({
    entries,
    loading = false,
    selectedIds,
    onSelectIds,
    onEdit,
    onDelete,
}: ClozeTextTableProps) {
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectIds(entries.map(e => e.id));
        } else {
            onSelectIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            onSelectIds([...selectedIds, id]);
        } else {
            onSelectIds(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    if (loading) {
        return (
            <div style={loadingContainerStyle}>
                <div style={spinnerStyle}></div>
                <p style={loadingTextStyle}>Loading cloze texts...</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div style={emptyStateStyle}>
                <div style={emptyIconStyle}>📝</div>
                <h3 style={emptyTitleStyle}>No cloze texts found</h3>
                <p style={emptyTextStyle}>Create your first cloze text or adjust filters.</p>
            </div>
        );
    }

    const allSelected = entries.length > 0 && selectedIds.length === entries.length;

    return (
        <div style={tableContainerStyle}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                style={checkboxStyle}
                            />
                        </th>
                        <th style={thStyle}>Nr</th>
                        <th style={thStyle}>Greek (with blanks)</th>
                        <th style={thStyle}>Answer</th>
                        <th style={thStyle}>Hints</th>
                        <th style={thStyle}>EN</th>
                        <th style={thStyle}>DE</th>
                        <th style={thStyle}>Level</th>
                        <th style={thStyle}>Difficulty</th>
                        <th style={thStyle}>Frequency</th>
                        <th style={thStyle}>Category</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <tr key={entry.id} style={trStyle}>
                            {/* Checkbox */}
                            <td style={tdStyle}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(entry.id)}
                                    onChange={(e) => handleSelectOne(entry.id, e.target.checked)}
                                    style={checkboxStyle}
                                />
                            </td>

                            {/* Nr */}
                            <td style={tdStyle}>
                                <span style={nrStyle}>{entry.nr || '-'}</span>
                            </td>

                            {/* Greek with blanks */}
                            <td style={tdStyle}>
                                <span style={greekTextStyle}>{entry.greek_transcription}</span>
                            </td>

                            {/* Answer */}
                            <td style={tdStyle}>
                                <span style={answerStyle}>{entry.cloze_answer}</span>
                            </td>

                            {/* Hints */}
                            <td style={tdStyle}>
                                <span style={hintStyle}>{entry.cloze_hints || '-'}</span>
                            </td>

                            {/* EN Translation */}
                            <td style={tdStyle}>
                                <TranslationCell translation={entry.en_translation} />
                            </td>

                            {/* DE Translation */}
                            <td style={tdStyle}>
                                <TranslationCell translation={entry.de_translation} />
                            </td>

                            {/* Level */}
                            <td style={tdStyle}>
                                <span style={levelBadgeStyle(entry.level)}>
                                    {entry.level}
                                </span>
                            </td>

                            {/* Difficulty */}
                            <td style={tdStyle}>
                                <span style={difficultyBadgeStyle(entry.difficulty)}>
                                    {entry.difficulty}
                                </span>
                            </td>

                            {/* Frequency */}
                            <td style={tdStyle}>
                                <span style={frequencyStyle}>
                                    {getFrequencyStars(entry.frequency)}
                                </span>
                            </td>

                            {/* Category */}
                            <td style={tdStyle}>
                                <span style={categoryStyle}>{entry.category || '-'}</span>
                            </td>

                            {/* Actions */}
                            <td style={tdStyle}>
                                <div style={actionsContainerStyle}>
                                    <button
                                        onClick={() => onEdit(entry)}
                                        style={editButtonStyle}
                                        title="Edit cloze text"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => onDelete(entry.id)}
                                        style={deleteButtonStyle}
                                        title="Delete cloze text"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Helper Components
function TranslationCell({ translation }: { translation?: string }) {
    if (!translation) {
        return <span style={noTranslationStyle}>-</span>;
    }

    const displayText = translation.length > 40 ? translation.substring(0, 40) + '...' : translation;

    return (
        <span style={translationTextStyle} title={translation}>
            {displayText}
        </span>
    );
}

// Styles
const tableContainerStyle: CSSProperties = {
    overflowX: 'auto',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
};

const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1600px',
};

const thStyle: CSSProperties = {
    padding: '16px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: '#8E8E93',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.02)',
};

const trStyle: CSSProperties = {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    transition: 'background 0.2s',
};

const tdStyle: CSSProperties = {
    padding: '12px',
    fontSize: '13px',
    color: '#FFFFFF',
    verticalAlign: 'middle',
};

const checkboxStyle: CSSProperties = {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#8A2BE2',
};

const nrStyle: CSSProperties = {
    color: '#8E8E93',
    fontSize: '12px',
};

const greekTextStyle: CSSProperties = {
    fontWeight: 600,
    color: '#FFFFFF',
    fontSize: '14px',
};

const answerStyle: CSSProperties = {
    fontWeight: 700,
    color: '#34C759',
    fontSize: '13px',
    background: 'rgba(52, 199, 89, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
};

const hintStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
    fontStyle: 'italic',
};

const translationTextStyle: CSSProperties = {
    color: '#D1D1D6',
    fontSize: '13px',
    cursor: 'help',
};

const noTranslationStyle: CSSProperties = {
    color: '#636366',
    fontSize: '13px',
};

const categoryStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
};

const levelBadgeStyle = (level: string): CSSProperties => {
    return {
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        background: (LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || '#8E8E93') + '20',
        color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || '#8E8E93',
        border: `1px solid ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || '#8E8E93'}40`,
    };
};

const difficultyBadgeStyle = (difficulty: string): CSSProperties => {
    return {
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'capitalize',
        background: (DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || '#8E8E93') + '20',
        color: DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || '#8E8E93',
        border: `1px solid ${DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || '#8E8E93'}40`,
    };
};

const frequencyStyle: CSSProperties = {
    color: '#FFD60A',
    fontSize: '14px',
    fontWeight: 600,
};

const actionsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
};

const editButtonStyle: CSSProperties = {
    background: 'rgba(138, 43, 226, 0.12)',
    border: '1px solid rgba(138, 43, 226, 0.25)',
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
};

const deleteButtonStyle: CSSProperties = {
    background: 'rgba(255, 59, 48, 0.12)',
    border: '1px solid rgba(255, 59, 48, 0.25)',
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
};

const loadingContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
};

const spinnerStyle: CSSProperties = {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #8A2BE2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
};

const loadingTextStyle: CSSProperties = {
    fontSize: '14px',
    color: '#8E8E93',
};

const emptyStateStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
};

const emptyIconStyle: CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
};

const emptyTitleStyle: CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#FFFFFF',
    margin: '0 0 8px',
};

const emptyTextStyle: CSSProperties = {
    fontSize: '14px',
    color: '#8E8E93',
    margin: 0,
};
