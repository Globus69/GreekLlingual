'use client';

import { useState, useEffect, useRef } from 'react';

interface LearningItem {
    id?: string;
    type: 'vocabulary' | 'phrase' | 'grammar';
    english: string;
    greek: string;
    phonetic?: string;
    example_en?: string;
    example_gr?: string;
    level: string;
    difficulty: string;
    audio_url?: string;
}

interface EditItemModalProps {
    isOpen: boolean;
    item: LearningItem | null;
    isCreating: boolean;
    onClose: () => void;
    onSave: (item: LearningItem) => Promise<void>;
}

export default function EditItemModal({ isOpen, item, isCreating, onClose, onSave }: EditItemModalProps) {
    const [formData, setFormData] = useState<LearningItem>({
        type: 'vocabulary',
        english: '',
        greek: '',
        phonetic: '',
        example_en: '',
        example_gr: '',
        level: 'A1',
        difficulty: 'easy',
        audio_url: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (item) {
                setFormData(item);
            } else {
                // Reset for new item
                setFormData({
                    type: 'vocabulary',
                    english: '',
                    greek: '',
                    phonetic: '',
                    example_en: '',
                    example_gr: '',
                    level: 'A1',
                    difficulty: 'easy',
                    audio_url: ''
                });
            }
            setErrors({});
            // Auto-focus first input
            setTimeout(() => firstInputRef.current?.focus(), 100);
        }
    }, [isOpen, item]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘+S or Ctrl+S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSubmit();
            }
            // ESC to close
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, formData]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.english.trim()) {
            newErrors.english = 'English is required';
        }
        if (!formData.greek.trim()) {
            newErrors.greek = 'Greek is required';
        }
        if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(formData.level)) {
            newErrors.level = 'Invalid level';
        }
        if (!['easy', 'medium', 'hard'].includes(formData.difficulty)) {
            newErrors.difficulty = 'Invalid difficulty';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
            setErrors({ submit: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="pointer-events-auto bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn"
                    style={{
                        animation: 'fadeIn 0.3s ease-out, slideUp 0.3s ease-out'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-8 py-6 border-b border-gray-200/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl filter drop-shadow-lg">
                                    {isCreating ? '✨' : '✏️'}
                                </span>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                                        {isCreating ? 'Create New Item' : 'Edit Item'}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        {isCreating ? 'Add a new learning item' : 'Update item details'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-gray-200/50 hover:bg-gray-300/50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                            >
                                <span className="text-gray-600 text-xl">×</span>
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
                        <div className="space-y-6">
                            {/* Type, Level, Difficulty - Row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800"
                                    >
                                        <option value="vocabulary">Vocabulary</option>
                                        <option value="phrase">Phrase</option>
                                        <option value="grammar">Grammar</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Level <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800 ${errors.level ? 'border-red-400' : 'border-gray-200'}`}
                                    >
                                        <option value="A1">A1</option>
                                        <option value="A2">A2</option>
                                        <option value="B1">B1</option>
                                        <option value="B2">B2</option>
                                        <option value="C1">C1</option>
                                        <option value="C2">C2</option>
                                    </select>
                                    {errors.level && <p className="text-xs text-red-500 mt-1">{errors.level}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Difficulty <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800 ${errors.difficulty ? 'border-red-400' : 'border-gray-200'}`}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                    {errors.difficulty && <p className="text-xs text-red-500 mt-1">{errors.difficulty}</p>}
                                </div>
                            </div>

                            {/* English */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    English <span className="text-red-500">*</span>
                                </label>
                                <input
                                    ref={firstInputRef}
                                    type="text"
                                    value={formData.english}
                                    onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800 ${errors.english ? 'border-red-400' : 'border-gray-200'}`}
                                    placeholder="Enter English word or phrase"
                                />
                                {errors.english && <p className="text-xs text-red-500 mt-1">{errors.english}</p>}
                            </div>

                            {/* Greek */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Greek <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.greek}
                                    onChange={(e) => setFormData({ ...formData, greek: e.target.value })}
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800 ${errors.greek ? 'border-red-400' : 'border-gray-200'}`}
                                    placeholder="Εισάγετε ελληνική λέξη ή φράση"
                                />
                                {errors.greek && <p className="text-xs text-red-500 mt-1">{errors.greek}</p>}
                            </div>

                            {/* Phonetic */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phonetic (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.phonetic || ''}
                                    onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800"
                                    placeholder="e.g., kalimera"
                                />
                            </div>

                            {/* Example English */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Example (English)
                                </label>
                                <textarea
                                    value={formData.example_en || ''}
                                    onChange={(e) => setFormData({ ...formData, example_en: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800 resize-none"
                                    rows={2}
                                    placeholder="Example sentence in English"
                                />
                            </div>

                            {/* Example Greek */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Example (Greek)
                                </label>
                                <textarea
                                    value={formData.example_gr || ''}
                                    onChange={(e) => setFormData({ ...formData, example_gr: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800 resize-none"
                                    rows={2}
                                    placeholder="Παράδειγμα πρότασης στα ελληνικά"
                                />
                            </div>

                            {/* Audio URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Audio URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.audio_url || ''}
                                    onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 font-medium text-gray-800"
                                    placeholder="https://example.com/audio.mp3"
                                />
                            </div>

                            {/* Submit Error */}
                            {errors.submit && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/50 px-8 py-5 border-t border-gray-200/50 flex items-center justify-between">
                        <div className="text-xs text-gray-500 font-medium">
                            💡 Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">⌘+S</kbd> to save, <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">ESC</kbd> to cancel
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>💾</span>
                                        <span>Save</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
}
