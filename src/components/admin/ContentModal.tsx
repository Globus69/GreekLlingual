// components/admin/ContentModal.tsx – Student Management Style

'use client';

import { useEffect, CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Content, ContentFormData } from '@/types/content';

const contentSchema = z.object({
    type: z.enum(['vocabulary', 'phrase', 'grammar'], {
        required_error: 'Type is required',
    }),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
        required_error: 'Level is required',
    }),
    difficulty: z.enum(['easy', 'medium', 'hard'], {
        required_error: 'Difficulty is required',
    }),
    english: z.string().min(1, 'English text is required'),
    greek: z.string().min(1, 'Greek text is required'),
    phonetic: z.string().trim().optional().or(z.literal('')),
    audio_url: z
        .string()
        .trim()
        .url('Must be a valid URL')
        .optional()
        .or(z.literal('')),
    example_en: z.string().trim().optional().or(z.literal('')),
    example_gr: z.string().trim().optional().or(z.literal('')),
});

interface ContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ContentFormData) => Promise<void>;
    item?: Content | null;
    isCreating?: boolean;
}

export function ContentModal({
    isOpen,
    onClose,
    onSave,
    item,
    isCreating = false,
}: ContentModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<ContentFormData>({
        resolver: zodResolver(contentSchema),
        defaultValues: {
            type: 'vocabulary',
            level: 'A1',
            difficulty: 'easy',
            english: '',
            greek: '',
            phonetic: '',
            audio_url: '',
            example_en: '',
            example_gr: '',
        },
    });

    const selectedType = watch('type');
    const selectedLevel = watch('level');
    const selectedDifficulty = watch('difficulty');

    useEffect(() => {
        if (item && !isCreating) {
            reset({
                type: item.type,
                level: item.level,
                difficulty: item.difficulty,
                english: item.english,
                greek: item.greek,
                phonetic: item.phonetic || '',
                audio_url: item.audio_url || '',
                example_en: item.example_en || '',
                example_gr: item.example_gr || '',
            });
        } else {
            reset({
                type: 'vocabulary',
                level: 'A1',
                difficulty: 'easy',
                english: '',
                greek: '',
                phonetic: '',
                audio_url: '',
                example_en: '',
                example_gr: '',
            });
        }
    }, [item, isCreating, reset]);

    const onSubmit = async (data: ContentFormData) => {
        try {
            await onSave(data);
            reset();
            onClose();
        } catch (error) {
            console.error('Error saving content:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            style={backdropStyle}
            onClick={onClose}
        >
            <div
                style={modalStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>
                            {isCreating ? '✨' : '✏️'}
                        </span>
                        <h2 style={titleStyle}>
                            {isCreating ? 'Create New Content' : 'Edit Content'}
                        </h2>
                    </div>
                    <button onClick={onClose} style={btnClose} type="button">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div style={bodyStyle}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Two Column Grid */}
                        <div style={gridStyle}>
                            {/* Left Column - Required Fields */}
                            <div style={columnStyle}>
                                {/* Type */}
                                <label style={labelStyle}>
                                    <span>Type <span style={{ color: '#FF3B30' }}>*</span></span>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setValue('type', e.target.value as any)}
                                        style={selectStyle}
                                    >
                                        <option value="vocabulary">Vocabulary</option>
                                        <option value="phrase">Phrase</option>
                                        <option value="grammar">Grammar</option>
                                    </select>
                                    {errors.type && <span style={errorStyle}>{errors.type.message}</span>}
                                </label>

                                {/* Level */}
                                <label style={labelStyle}>
                                    <span>Level <span style={{ color: '#FF3B30' }}>*</span></span>
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => setValue('level', e.target.value as any)}
                                        style={selectStyle}
                                    >
                                        <option value="A1">A1</option>
                                        <option value="A2">A2</option>
                                        <option value="B1">B1</option>
                                        <option value="B2">B2</option>
                                        <option value="C1">C1</option>
                                        <option value="C2">C2</option>
                                    </select>
                                    {errors.level && <span style={errorStyle}>{errors.level.message}</span>}
                                </label>

                                {/* Difficulty */}
                                <label style={labelStyle}>
                                    <span>Difficulty <span style={{ color: '#FF3B30' }}>*</span></span>
                                    <select
                                        value={selectedDifficulty}
                                        onChange={(e) => setValue('difficulty', e.target.value as any)}
                                        style={selectStyle}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                    {errors.difficulty && <span style={errorStyle}>{errors.difficulty.message}</span>}
                                </label>

                                {/* English */}
                                <label style={labelStyle}>
                                    <span>English <span style={{ color: '#FF3B30' }}>*</span></span>
                                    <textarea
                                        {...register('english')}
                                        placeholder="Enter English text"
                                        style={textareaStyle}
                                        rows={4}
                                    />
                                    {errors.english && <span style={errorStyle}>{errors.english.message}</span>}
                                </label>

                                {/* Greek */}
                                <label style={labelStyle}>
                                    <span>Greek <span style={{ color: '#FF3B30' }}>*</span></span>
                                    <textarea
                                        {...register('greek')}
                                        placeholder="Εισάγετε ελληνικό κείμενο"
                                        style={textareaStyle}
                                        rows={4}
                                    />
                                    {errors.greek && <span style={errorStyle}>{errors.greek.message}</span>}
                                </label>
                            </div>

                            {/* Right Column - Optional Fields */}
                            <div style={columnStyle}>
                                {/* Optional Fields Header */}
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#636366', marginBottom: '12px' }}>
                                    Optional Fields
                                </div>

                                {/* Phonetic */}
                                <label style={labelStyle}>
                                    <span>Phonetic</span>
                                    <input
                                        {...register('phonetic')}
                                        type="text"
                                        placeholder="e.g., YAH-soo"
                                        style={inputStyle}
                                    />
                                </label>

                                {/* Audio URL */}
                                <label style={labelStyle}>
                                    <span>Audio URL</span>
                                    <input
                                        {...register('audio_url')}
                                        type="url"
                                        placeholder="https://example.com/audio.mp3"
                                        style={inputStyle}
                                    />
                                    {errors.audio_url && <span style={errorStyle}>{errors.audio_url.message}</span>}
                                </label>

                                {/* Example English */}
                                <label style={labelStyle}>
                                    <span>Example (English)</span>
                                    <textarea
                                        {...register('example_en')}
                                        placeholder="Example sentence in English"
                                        style={textareaSmallStyle}
                                        rows={2}
                                    />
                                </label>

                                {/* Example Greek */}
                                <label style={labelStyle}>
                                    <span>Example (Greek)</span>
                                    <textarea
                                        {...register('example_gr')}
                                        placeholder="Παράδειγμα πρότασης στα ελληνικά"
                                        style={textareaSmallStyle}
                                        rows={2}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div style={footerStyle}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={btnSecondary}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={btnPrimary}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? '⏳ Saving...' : isCreating ? 'Save' : 'Update'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const backdropStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
};

const modalStyle: CSSProperties = {
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    background: 'rgba(22, 22, 26, 0.98)',
    backdropFilter: 'blur(60px)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
};

const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
};

const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#fff',
};

const bodyStyle: CSSProperties = {
    padding: '18px',
    overflowY: 'auto',
    flex: 1,
};

const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '16px',
};

const columnStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const labelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#8E8E93',
};

const inputStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '8px 10px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
};

const selectStyle: CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
};

const textareaStyle: CSSProperties = {
    ...inputStyle,
    resize: 'vertical' as any,
    fontFamily: 'inherit',
};

const textareaSmallStyle: CSSProperties = {
    ...textareaStyle,
};

const dividerStyle: CSSProperties = {
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    margin: '8px 0',
};

const footerStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
};

const btnPrimary: CSSProperties = {
    background: 'rgba(0, 122, 255, 0.12)',
    border: '1px solid rgba(0, 122, 255, 0.25)',
    borderRadius: '8px',
    padding: '7px 18px',
    color: '#007AFF',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '100px',
};

const btnSecondary: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '7px 18px',
    color: '#8E8E93',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
};

const btnClose: CSSProperties = {
    background: 'rgba(255, 59, 48, 0.1)',
    border: '1px solid rgba(255, 59, 48, 0.2)',
    borderRadius: '8px',
    padding: '5px 9px',
    color: '#FF3B30',
    fontSize: '13px',
    cursor: 'pointer',
    lineHeight: 1,
};

const errorStyle: CSSProperties = {
    fontSize: '11px',
    color: '#FF3B30',
    marginTop: '2px',
};
