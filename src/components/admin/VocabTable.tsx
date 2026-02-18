'use client';

import React, { CSSProperties } from 'react';
import type { VocabEntry } from '@/types/vocabulary';
import { LEVEL_COLORS, DIFFICULTY_COLORS, getFrequencyStars, hasAudio } from '@/types/vocabulary';

interface VocabTableProps {
    entries: VocabEntry[];
    loading?: boolean;
    selectedIds: string[];
    onSelectIds: (ids: string[]) => void;
    onEdit: (entry: VocabEntry) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
}

export default function VocabTable({
    entries,
    loading = false,
    selectedIds,
    onSelectIds,
    onEdit,
    onDelete,
}: VocabTableProps) {
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
                <p style={loadingTextStyle}>Loading vocabulary...</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div style={emptyStateStyle}>
                <div style={emptyIconStyle}>📚</div>
                <h3 style={emptyTitleStyle}>No vocabulary entries found</h3>
                <p style={emptyTextStyle}>Create your first entry or adjust filters.</p>
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
                        <th style={thStyle}>Greek</th>
                        <th style={thStyle}>Phonetic</th>
                        <th style={thStyle}>EN</th>
                        <th style={thStyle}>DE</th>
                        <th style={thStyle}>ES</th>
                        <th style={thStyle}>RU</th>
                        <th style={thStyle}>Level</th>
                        <th style={thStyle}>Difficulty</th>
                        <th style={thStyle}>Frequency</th>
                        <th style={thStyle}>Audio</th>
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

                            {/* Greek */}
                            <td style={tdStyle}>
                                <span style={greekTextStyle}>{entry.greek_transcription}</span>
                            </td>

                            {/* Phonetic */}
                            <td style={tdStyle}>
                                <span style={phoneticStyle}>{entry.greek_phonetic || '-'}</span>
                            </td>

                            {/* EN Translation */}
                            <td style={tdStyle}>
                                <TranslationCell
                                    translation={entry.en_translation}
                                    reason={entry.en_importance_reason}
                                />
                            </td>

                            {/* DE Translation */}
                            <td style={tdStyle}>
                                <TranslationCell
                                    translation={entry.de_translation}
                                    reason={entry.de_importance_reason}
                                />
                            </td>

                            {/* ES Translation */}
                            <td style={tdStyle}>
                                <TranslationCell
                                    translation={entry.es_translation}
                                    reason={entry.es_importance_reason}
                                />
                            </td>

                            {/* RU Translation */}
                            <td style={tdStyle}>
                                <TranslationCell
                                    translation={entry.ru_translation}
                                    reason={entry.ru_importance_reason}
                                />
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

                            {/* Audio */}
                            <td style={tdStyle}>
                                <div style={audioIconsContainerStyle}>
                                    <AudioIcon hasAudio={hasAudio(entry, 'en')} lang="EN" />
                                    <AudioIcon hasAudio={hasAudio(entry, 'de')} lang="DE" />
                                    <AudioIcon hasAudio={hasAudio(entry, 'es')} lang="ES" />
                                    <AudioIcon hasAudio={hasAudio(entry, 'ru')} lang="RU" />
                                </div>
                            </td>

                            {/* Actions */}
                            <td style={tdStyle}>
                                <div style={actionsContainerStyle}>
                                    <button
                                        onClick={() => onEdit(entry)}
                                        style={editButtonStyle}
                                        title="Edit entry"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => onDelete(entry.id)}
                                        style={deleteButtonStyle}
                                        title="Delete entry"
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
function TranslationCell({ translation, reason }: { translation?: string; reason?: string }) {
    if (!translation) {
        return <span style={noTranslationStyle}>-</span>;
    }

    const displayText = translation.length > 30 ? translation.substring(0, 30) + '...' : translation;

    return (
        <span style={translationTextStyle} title={reason || translation}>
            {displayText}
        </span>
    );
}

function AudioIcon({ hasAudio, lang }: { hasAudio: boolean; lang: string }) {
    return (
        <span
            style={audioIconStyle(hasAudio)}
            title={`${lang}: ${hasAudio ? 'Audio available' : 'No audio'}`}
        >
            {hasAudio ? '🔊' : '🔇'}
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
    minWidth: '1400px',
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
    accentColor: '#007AFF',
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

const phoneticStyle: CSSProperties = {
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

const audioIconsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '4px',
    fontSize: '12px',
};

const audioIconStyle = (hasAudio: boolean): CSSProperties => {
    return {
        opacity: hasAudio ? 1 : 0.3,
        fontSize: '12px',
        cursor: 'help',
    };
};

const actionsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
};

const editButtonStyle: CSSProperties = {
    background: 'rgba(0, 122, 255, 0.12)',
    border: '1px solid rgba(0, 122, 255, 0.25)',
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
    borderTop: '3px solid #007AFF',
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
