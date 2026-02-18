'use client';

import React, { useState, CSSProperties } from 'react';
import type { PhraseLevel, PhraseDifficulty, PhraseFrequency, BulkUpdatePhrasePayload } from '@/types/phrases';
import { LEVEL_ORDER } from '@/types/phrases';
import { bulkUpdatePhrases } from '@/lib/api/phrases';
import { toast } from 'sonner';

interface PhrasesBulkEditModalProps {
    selectedIds: string[];
    onClose: () => void;
    onSave: () => void;
}

export default function PhrasesBulkEditModal({ selectedIds, onClose, onSave }: PhrasesBulkEditModalProps) {
    const [saving, setSaving] = useState(false);
    const [level, setLevel] = useState<PhraseLevel | ''>('');
    const [difficulty, setDifficulty] = useState<PhraseDifficulty | ''>('');
    const [frequency, setFrequency] = useState<PhraseFrequency | ''>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if at least one field is set
        if (!level && !difficulty && !frequency) {
            toast.error('Please select at least one field to update');
            return;
        }

        try {
            setSaving(true);

            const payload: BulkUpdatePhrasePayload = {
                ids: selectedIds,
                ...(level && { level }),
                ...(difficulty && { difficulty }),
                ...(frequency && { frequency }),
            };

            const updatedCount = await bulkUpdatePhrases(payload);

            toast.success(`Updated ${updatedCount} phrases`);
            onSave();
        } catch (error: any) {
            console.error('Bulk update error:', error);
            toast.error(error?.message || 'Bulk update failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={headerStyle}>
                    <div>
                        <h2 style={titleStyle}>Bulk Edit Phrases</h2>
                        <p style={subtitleStyle}>
                            Editing {selectedIds.length} {selectedIds.length === 1 ? 'phrase' : 'phrases'}
                        </p>
                    </div>
                    <button onClick={onClose} style={closeButtonStyle}>
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={infoBoxStyle}>
                        💡 Only fields you select will be updated. Leave fields empty to keep existing values.
                    </div>

                    {/* Level */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Level</label>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value as PhraseLevel)}
                            style={selectStyle}
                        >
                            <option value="">— Leave unchanged —</option>
                            {LEVEL_ORDER.map(lvl => (
                                <option key={lvl} value={lvl}>{lvl}</option>
                            ))}
                        </select>
                    </div>

                    {/* Difficulty */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Difficulty</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as PhraseDifficulty)}
                            style={selectStyle}
                        >
                            <option value="">— Leave unchanged —</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    {/* Frequency */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Frequency</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value ? parseInt(e.target.value) as PhraseFrequency : '')}
                            style={selectStyle}
                        >
                            <option value="">— Leave unchanged —</option>
                            <option value="1">1 ★☆☆☆☆</option>
                            <option value="2">2 ★★☆☆☆</option>
                            <option value="3">3 ★★★☆☆</option>
                            <option value="4">4 ★★★★☆</option>
                            <option value="5">5 ★★★★★</option>
                        </select>
                    </div>

                    {/* Footer */}
                    <div style={footerStyle}>
                        <button type="button" onClick={onClose} style={cancelButtonStyle}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} style={saveButtonStyle}>
                            {saving ? 'Saving...' : 'Update Phrases'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Styles
const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
};

const modalStyle: CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '20px',
    maxWidth: '500px',
    width: '100%',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};

const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const titleStyle: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 4px 0',
};

const subtitleStyle: CSSProperties = {
    fontSize: '14px',
    color: '#8E8E93',
    margin: 0,
};

const closeButtonStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#8E8E93',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    lineHeight: 1,
};

const formStyle: CSSProperties = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
};

const infoBoxStyle: CSSProperties = {
    padding: '12px 16px',
    background: 'rgba(0, 122, 255, 0.1)',
    border: '1px solid rgba(0, 122, 255, 0.25)',
    borderRadius: '10px',
    color: '#64D2FF',
    fontSize: '13px',
    lineHeight: 1.5,
};

const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

const labelStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#D1D1D6',
};

const selectStyle: CSSProperties = {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '14px',
};

const footerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '8px',
};

const cancelButtonStyle: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 24px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};

const saveButtonStyle: CSSProperties = {
    background: 'rgba(0, 122, 255, 0.15)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
    borderRadius: '12px',
    padding: '12px 24px',
    color: '#007AFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};
