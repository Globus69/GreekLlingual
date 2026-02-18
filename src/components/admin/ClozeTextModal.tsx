'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import type { ClozeTextEntry, CreateClozeTextPayload } from '@/types/cloze-text';
import { createClozeTextEntry, updateClozeTextEntry, checkDuplicate } from '@/lib/api/cloze-text';
import { toast } from 'sonner';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

interface ClozeTextModalProps {
    mode: 'create' | 'edit';
    entry?: ClozeTextEntry;
    onClose: () => void;
    onSave: () => void;
}

export default function ClozeTextModal({ mode, entry, onClose, onSave }: ClozeTextModalProps) {
    const [saving, setSaving] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>(['en']);

    // Form state
    const [formData, setFormData] = useState<CreateClozeTextPayload>({
        nr: entry?.nr,
        greek_transcription: entry?.greek_transcription || '',
        greek_phonetic: entry?.greek_phonetic || '',
        cloze_answer: entry?.cloze_answer || '',
        cloze_hints: entry?.cloze_hints || '',

        en_translation: entry?.en_translation || '',
        en_importance_reason: entry?.en_importance_reason || '',
        en_audio_url: entry?.en_audio_url || '',

        de_translation: entry?.de_translation || '',
        de_importance_reason: entry?.de_importance_reason || '',
        de_audio_url: entry?.de_audio_url || '',

        es_translation: entry?.es_translation || '',
        es_importance_reason: entry?.es_importance_reason || '',
        es_audio_url: entry?.es_audio_url || '',

        ru_translation: entry?.ru_translation || '',
        ru_importance_reason: entry?.ru_importance_reason || '',
        ru_audio_url: entry?.ru_audio_url || '',

        level: entry?.level || 'A1',
        difficulty: entry?.difficulty || 'easy',
        frequency: entry?.frequency || 3,
        category: entry?.category || '',
    });

    // Check for duplicates when greek or level changes
    useEffect(() => {
        if (formData.greek_transcription && formData.level) {
            checkForDuplicate();
        }
    }, [formData.greek_transcription, formData.level]);

    const checkForDuplicate = async () => {
        try {
            const isDuplicate = await checkDuplicate(
                formData.greek_transcription,
                formData.level,
                entry?.id
            );
            setDuplicateWarning(isDuplicate);
        } catch (error) {
            console.error('Duplicate check error:', error);
        }
    };

    const toggleSection = (section: string) => {
        if (expandedSections.includes(section)) {
            setExpandedSections(expandedSections.filter(s => s !== section));
        } else {
            setExpandedSections([...expandedSections, section]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!formData.greek_transcription || formData.greek_transcription.trim() === '') {
            toast.error('Greek transcription is required');
            return;
        }

        if (!formData.cloze_answer || formData.cloze_answer.trim() === '') {
            toast.error('Cloze answer is required');
            return;
        }

        if (!formData.level) {
            toast.error('Level is required');
            return;
        }

        if (!formData.difficulty) {
            toast.error('Difficulty is required');
            return;
        }

        try {
            setSaving(true);

            if (mode === 'create') {
                await createClozeTextEntry(formData);
            } else if (entry) {
                await updateClozeTextEntry(entry.id, formData);
            }

            onSave();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={headerStyle}>
                    <h2 style={titleStyle}>
                        {mode === 'create' ? 'Create Cloze Text' : 'Edit Cloze Text'}
                    </h2>
                    <button onClick={onClose} style={closeButtonStyle}>
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={formStyle}>
                    {/* Core Fields Section */}
                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>Core Information</h3>

                        {/* Nr (optional) */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Nr <span style={optionalStyle}>(optional)</span>
                            </label>
                            <input
                                type="number"
                                value={formData.nr || ''}
                                onChange={(e) => setFormData({ ...formData, nr: e.target.value ? parseInt(e.target.value) : undefined })}
                                style={inputStyle}
                                placeholder="Entry number"
                            />
                        </div>

                        {/* Greek Transcription with blanks */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Greek Text (with ___ for blanks) <span style={requiredStyle}>*</span>
                            </label>
                            <textarea
                                value={formData.greek_transcription}
                                onChange={(e) => setFormData({ ...formData, greek_transcription: e.target.value })}
                                style={textareaStyle}
                                placeholder="Καλημέρα, το όνομά μου ___ Γιάννης"
                                rows={3}
                                required
                            />
                            <div style={hintTextStyle}>
                                Use ___ (three underscores) to mark the blank(s)
                            </div>
                            {duplicateWarning && (
                                <div style={warningStyle}>
                                    ⚠️ Similar cloze text already exists for this level
                                </div>
                            )}
                        </div>

                        {/* Cloze Answer */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Correct Answer <span style={requiredStyle}>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.cloze_answer}
                                onChange={(e) => setFormData({ ...formData, cloze_answer: e.target.value })}
                                style={inputStyle}
                                placeholder="είναι"
                                required
                            />
                            <div style={hintTextStyle}>
                                The correct word(s) to fill in the blank
                            </div>
                        </div>

                        {/* Cloze Hints */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Hints <span style={optionalStyle}>(optional)</span>
                            </label>
                            <textarea
                                value={formData.cloze_hints}
                                onChange={(e) => setFormData({ ...formData, cloze_hints: e.target.value })}
                                style={textareaStyle}
                                placeholder='verb "to be" in 3rd person singular'
                                rows={2}
                            />
                        </div>

                        {/* Greek Phonetic */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Greek Phonetic <span style={optionalStyle}>(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.greek_phonetic}
                                onChange={(e) => setFormData({ ...formData, greek_phonetic: e.target.value })}
                                style={inputStyle}
                                placeholder="kalimera, to onoma mu ___ Yiannis"
                            />
                        </div>

                        {/* Category */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Category <span style={optionalStyle}>(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                style={inputStyle}
                                placeholder="grammar, vocabulary, etc."
                            />
                        </div>

                        {/* Level */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Level <span style={requiredStyle}>*</span>
                            </label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                                style={selectStyle}
                                required
                            >
                                {LEVEL_ORDER.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Difficulty <span style={requiredStyle}>*</span>
                            </label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                style={selectStyle}
                                required
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        {/* Frequency */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Frequency (1-5) <span style={requiredStyle}>*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) as any })}
                                style={inputStyle}
                                required
                            />
                            <div style={frequencyHintStyle}>
                                {'★'.repeat(formData.frequency) + '☆'.repeat(5 - formData.frequency)}
                            </div>
                        </div>
                    </div>

                    {/* Language Sections */}
                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>Translations</h3>

                        {/* English Section */}
                        <LanguageSection
                            language="English"
                            langCode="en"
                            expanded={expandedSections.includes('en')}
                            onToggle={() => toggleSection('en')}
                            translation={formData.en_translation}
                            importanceReason={formData.en_importance_reason}
                            audioUrl={formData.en_audio_url}
                            onTranslationChange={(val) => setFormData({ ...formData, en_translation: val })}
                            onReasonChange={(val) => setFormData({ ...formData, en_importance_reason: val })}
                            onAudioChange={(val) => setFormData({ ...formData, en_audio_url: val })}
                        />

                        {/* German Section */}
                        <LanguageSection
                            language="German"
                            langCode="de"
                            expanded={expandedSections.includes('de')}
                            onToggle={() => toggleSection('de')}
                            translation={formData.de_translation}
                            importanceReason={formData.de_importance_reason}
                            audioUrl={formData.de_audio_url}
                            onTranslationChange={(val) => setFormData({ ...formData, de_translation: val })}
                            onReasonChange={(val) => setFormData({ ...formData, de_importance_reason: val })}
                            onAudioChange={(val) => setFormData({ ...formData, de_audio_url: val })}
                        />

                        {/* Spanish Section */}
                        <LanguageSection
                            language="Spanish"
                            langCode="es"
                            expanded={expandedSections.includes('es')}
                            onToggle={() => toggleSection('es')}
                            translation={formData.es_translation}
                            importanceReason={formData.es_importance_reason}
                            audioUrl={formData.es_audio_url}
                            onTranslationChange={(val) => setFormData({ ...formData, es_translation: val })}
                            onReasonChange={(val) => setFormData({ ...formData, es_importance_reason: val })}
                            onAudioChange={(val) => setFormData({ ...formData, es_audio_url: val })}
                        />

                        {/* Russian Section */}
                        <LanguageSection
                            language="Russian"
                            langCode="ru"
                            expanded={expandedSections.includes('ru')}
                            onToggle={() => toggleSection('ru')}
                            translation={formData.ru_translation}
                            importanceReason={formData.ru_importance_reason}
                            audioUrl={formData.ru_audio_url}
                            onTranslationChange={(val) => setFormData({ ...formData, ru_translation: val })}
                            onReasonChange={(val) => setFormData({ ...formData, ru_importance_reason: val })}
                            onAudioChange={(val) => setFormData({ ...formData, ru_audio_url: val })}
                        />
                    </div>

                    {/* Footer */}
                    <div style={footerStyle}>
                        <button type="button" onClick={onClose} style={cancelButtonStyle}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} style={saveButtonStyle}>
                            {saving ? 'Saving...' : 'Save Cloze Text'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Language Section Component
function LanguageSection({
    language,
    langCode,
    expanded,
    onToggle,
    translation,
    importanceReason,
    audioUrl,
    onTranslationChange,
    onReasonChange,
    onAudioChange,
}: {
    language: string;
    langCode: string;
    expanded: boolean;
    onToggle: () => void;
    translation?: string;
    importanceReason?: string;
    audioUrl?: string;
    onTranslationChange: (val: string) => void;
    onReasonChange: (val: string) => void;
    onAudioChange: (val: string) => void;
}) {
    return (
        <div style={accordionStyle}>
            <button type="button" onClick={onToggle} style={accordionHeaderStyle}>
                <span style={accordionTitleStyle}>
                    {language} {translation && '✓'}
                </span>
                <span style={accordionIconStyle}>{expanded ? '▼' : '▶'}</span>
            </button>
            {expanded && (
                <div style={accordionContentStyle}>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Translation</label>
                        <textarea
                            value={translation}
                            onChange={(e) => onTranslationChange(e.target.value)}
                            style={textareaStyle}
                            placeholder={`${language} translation`}
                            rows={2}
                        />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Importance Reason</label>
                        <textarea
                            value={importanceReason}
                            onChange={(e) => onReasonChange(e.target.value)}
                            style={textareaStyle}
                            placeholder="Why is this cloze text important?"
                            rows={2}
                        />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Audio URL 🔗</label>
                        <input
                            type="url"
                            value={audioUrl}
                            onChange={(e) => onAudioChange(e.target.value)}
                            style={inputStyle}
                            placeholder="https://..."
                        />
                    </div>
                </div>
            )}
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
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};

const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const titleStyle: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
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
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
};

const sectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
};

const sectionTitleStyle: CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '8px',
};

const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
};

const labelStyle: CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#D1D1D6',
};

const requiredStyle: CSSProperties = {
    color: '#FF3B30',
};

const optionalStyle: CSSProperties = {
    color: '#8E8E93',
    fontWeight: 400,
};

const inputStyle: CSSProperties = {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '14px',
};

const selectStyle: CSSProperties = {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '14px',
};

const textareaStyle: CSSProperties = {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
};

const hintTextStyle: CSSProperties = {
    fontSize: '11px',
    color: '#8E8E93',
    fontStyle: 'italic',
};

const frequencyHintStyle: CSSProperties = {
    fontSize: '16px',
    color: '#FFD60A',
};

const warningStyle: CSSProperties = {
    fontSize: '12px',
    color: '#FFD60A',
    padding: '8px',
    background: 'rgba(255, 214, 10, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 214, 10, 0.3)',
};

const accordionStyle: CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
};

const accordionHeaderStyle: CSSProperties = {
    width: '100%',
    padding: '16px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
};

const accordionTitleStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
};

const accordionIconStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
};

const accordionContentStyle: CSSProperties = {
    padding: '0 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const footerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
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
    background: 'rgba(138, 43, 226, 0.15)',
    border: '1px solid rgba(138, 43, 226, 0.3)',
    borderRadius: '12px',
    padding: '12px 24px',
    color: '#8A2BE2',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};
