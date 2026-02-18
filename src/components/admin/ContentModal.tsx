'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { toast } from 'sonner';

// Types matching multilingual_content table
export type ContentType = 'vocabulary' | 'phrase' | 'grammar';
export type ContentLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ContentDifficulty = 'easy' | 'medium' | 'hard';
export type ContentFrequency = 1 | 2 | 3 | 4 | 5;

const LEVEL_ORDER: ContentLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export interface MultilingualContent {
    id?: string;
    nr?: number;
    type: ContentType;
    greek_transcription: string;
    greek_phonetic?: string;
    audio_url?: string;
    en_translation?: string;
    en_importance_reason?: string;
    de_translation?: string;
    de_importance_reason?: string;
    es_translation?: string;
    es_importance_reason?: string;
    ru_translation?: string;
    ru_importance_reason?: string;
    level: ContentLevel;
    difficulty: ContentDifficulty;
    frequency: ContentFrequency;
    created_at?: string;
    updated_at?: string;
}

export type CreateMultilingualContentPayload = Omit<MultilingualContent, 'id' | 'created_at' | 'updated_at'>;

interface ContentModalProps {
    isOpen: boolean;
    mode?: 'create' | 'edit';
    entry?: MultilingualContent;
    item?: MultilingualContent | null;
    isCreating?: boolean;
    onClose: () => void;
    onSave: (data?: CreateMultilingualContentPayload) => void | Promise<void>;
}

export function ContentModal({
    isOpen,
    mode: modeProp,
    entry: entryProp,
    item,
    isCreating,
    onClose,
    onSave
}: ContentModalProps) {
    // Support both interface styles
    const mode = modeProp || (isCreating ? 'create' : 'edit');
    const entry = entryProp || item || undefined;
    const [saving, setSaving] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>(['en']);

    // Form state
    const [formData, setFormData] = useState<CreateMultilingualContentPayload>({
        nr: entry?.nr,
        type: entry?.type || 'vocabulary',
        greek_transcription: entry?.greek_transcription || '',
        greek_phonetic: entry?.greek_phonetic || '',
        audio_url: entry?.audio_url || '',

        en_translation: entry?.en_translation || '',
        en_importance_reason: entry?.en_importance_reason || '',

        de_translation: entry?.de_translation || '',
        de_importance_reason: entry?.de_importance_reason || '',

        es_translation: entry?.es_translation || '',
        es_importance_reason: entry?.es_importance_reason || '',

        ru_translation: entry?.ru_translation || '',
        ru_importance_reason: entry?.ru_importance_reason || '',

        level: entry?.level || 'A1',
        difficulty: entry?.difficulty || 'easy',
        frequency: entry?.frequency || 3,
    });

    // Check for duplicates when greek or level changes
    useEffect(() => {
        if (formData.greek_transcription && formData.level) {
            checkForDuplicate();
        }
    }, [formData.greek_transcription, formData.level]);

    const checkForDuplicate = async () => {
        try {
            // TODO: Implement duplicate check API call for multilingual_content table
            // const isDuplicate = await checkDuplicate(
            //     formData.greek_transcription,
            //     formData.level,
            //     entry?.id
            // );
            // setDuplicateWarning(isDuplicate);
            setDuplicateWarning(false);
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

        // Validate required fields
        if (!formData.greek_transcription.trim()) {
            toast.error('Greek transcription is required');
            return;
        }

        if (formData.greek_transcription.length > 200) {
            toast.error('Greek transcription must be 200 characters or less');
            return;
        }

        try {
            setSaving(true);

            // Call parent's onSave callback with formData
            // Parent is responsible for API calls and success/error handling
            await onSave(formData);

            // Close modal on success
            onClose();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={headerStyle}>
                    <h2 style={titleStyle}>
                        {mode === 'create' ? 'Create Multilingual Content' : 'Edit Multilingual Content'}
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

                        {/* Type */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Type <span style={requiredStyle}>*</span>
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
                                style={selectStyle}
                                required
                            >
                                <option value="vocabulary">Vocabulary</option>
                                <option value="phrase">Phrase</option>
                                <option value="grammar">Grammar</option>
                            </select>
                        </div>

                        {/* Greek Transcription */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Greek Transcription <span style={requiredStyle}>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.greek_transcription}
                                onChange={(e) => setFormData({ ...formData, greek_transcription: e.target.value })}
                                style={inputStyle}
                                placeholder="Γεια σου"
                                maxLength={200}
                                required
                            />
                            <div style={charCountStyle}>
                                {formData.greek_transcription.length} / 200
                            </div>
                            {duplicateWarning && (
                                <div style={warningStyle}>
                                    ⚠️ Similar entry already exists for this level
                                </div>
                            )}
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
                                placeholder="ya su"
                            />
                        </div>

                        {/* Audio URL */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Audio URL 🔗 <span style={optionalStyle}>(optional)</span>
                            </label>
                            <input
                                type="url"
                                value={formData.audio_url}
                                onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                                style={inputStyle}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Level */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>
                                Level <span style={requiredStyle}>*</span>
                            </label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value as ContentLevel })}
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
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as ContentDifficulty })}
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
                                onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) as ContentFrequency })}
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
                            onTranslationChange={(val) => setFormData({ ...formData, en_translation: val })}
                            onReasonChange={(val) => setFormData({ ...formData, en_importance_reason: val })}
                        />

                        {/* German Section */}
                        <LanguageSection
                            language="German"
                            langCode="de"
                            expanded={expandedSections.includes('de')}
                            onToggle={() => toggleSection('de')}
                            translation={formData.de_translation}
                            importanceReason={formData.de_importance_reason}
                            onTranslationChange={(val) => setFormData({ ...formData, de_translation: val })}
                            onReasonChange={(val) => setFormData({ ...formData, de_importance_reason: val })}
                        />

                        {/* Spanish Section */}
                        <LanguageSection
                            language="Spanish"
                            langCode="es"
                            expanded={expandedSections.includes('es')}
                            onToggle={() => toggleSection('es')}
                            translation={formData.es_translation}
                            importanceReason={formData.es_importance_reason}
                            onTranslationChange={(val) => setFormData({ ...formData, es_translation: val })}
                            onReasonChange={(val) => setFormData({ ...formData, es_importance_reason: val })}
                        />

                        {/* Russian Section */}
                        <LanguageSection
                            language="Russian"
                            langCode="ru"
                            expanded={expandedSections.includes('ru')}
                            onToggle={() => toggleSection('ru')}
                            translation={formData.ru_translation}
                            importanceReason={formData.ru_importance_reason}
                            onTranslationChange={(val) => setFormData({ ...formData, ru_translation: val })}
                            onReasonChange={(val) => setFormData({ ...formData, ru_importance_reason: val })}
                        />
                    </div>

                    {/* Footer */}
                    <div style={footerStyle}>
                        <button type="button" onClick={onClose} style={cancelButtonStyle}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} style={saveButtonStyle}>
                            {saving ? 'Saving...' : 'Save Entry'}
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
    onTranslationChange,
    onReasonChange,
}: {
    language: string;
    langCode: string;
    expanded: boolean;
    onToggle: () => void;
    translation?: string;
    importanceReason?: string;
    onTranslationChange: (val: string) => void;
    onReasonChange: (val: string) => void;
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
                            placeholder="Why is this content important?"
                            rows={2}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Styles (matching VocabModal.tsx exactly)
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

const charCountStyle: CSSProperties = {
    fontSize: '11px',
    color: '#8E8E93',
    textAlign: 'right',
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
    background: 'rgba(0, 122, 255, 0.15)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
    borderRadius: '12px',
    padding: '12px 24px',
    color: '#007AFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};
