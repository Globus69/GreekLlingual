"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import Flashcard from '@/components/learning/Flashcard';
import '@/styles/liquid-glass.css';

interface LearningItem {
    id: number;
    type: string;
    english: string;
    greek: string;
    example_en: string | null;
    example_gr: string | null;
    audio_url: string | null;
    created_at: string;
}

interface StudentProgress {
    id: number;
    student_id: string;
    item_id: number;
    interval_days: number;
    ease_factor: number;
    attempts: number;
    correct_count: number;
    last_attempt: string | null;
    next_review: string | null;
}

interface VocabWithProgress extends LearningItem {
    student_progress?: StudentProgress[];
}

interface VocabularyDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const STUDENT_ID = 'demo-student-id';

export default function VocabularyDialog({ isOpen, onClose }: VocabularyDialogProps) {
    const [vocabulary, setVocabulary] = useState<VocabWithProgress[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState({ hard: 0, good: 0, easy: 0 });
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchVocabulary();
            setShowSummary(false);
        }
    }, [isOpen]);

    const fetchVocabulary = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('learning_items')
                .select(`
                    *,
                    student_progress!left(*)
                `)
                .eq('type', 'vocabulary')
                .order('next_review', { foreignTable: 'student_progress', ascending: true, nullsFirst: true })
                .limit(20);

            if (error) {
                console.error("Error fetching vocabs:", error);
                setVocabulary(getDemoVocabs());
            } else if (data && data.length > 0) {
                setVocabulary(data as VocabWithProgress[]);
            } else {
                setVocabulary(getDemoVocabs()); // Fallback if empty
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setVocabulary(getDemoVocabs());
        } finally {
            setLoading(false);
        }
    };

    const getDemoVocabs = (): VocabWithProgress[] => [
        {
            id: 1,
            type: 'vocabulary',
            english: 'Hello',
            greek: 'Γεια σου',
            example_en: 'Hello friend',
            example_gr: 'Γεια σου φίλε',
            audio_url: null,
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            type: 'vocabulary',
            english: 'Thank you',
            greek: 'Ευχαριστώ',
            example_en: 'Thank you very much',
            example_gr: 'Ευχαριστώ πολύ',
            audio_url: null,
            created_at: new Date().toISOString()
        },
        {
            id: 3,
            type: 'vocabulary',
            english: 'Water',
            greek: 'Νερό',
            example_en: 'I want water',
            example_gr: 'Θέλω νερό',
            audio_url: null,
            created_at: new Date().toISOString()
        }
    ];

    const handleScore = async (quality: number) => {
        const item = vocabulary[currentIndex];
        const progress = item.student_progress?.[0] || {
            interval_days: 1.0,
            ease_factor: 2.5,
            attempts: 0,
            correct_count: 0
        };

        let newInterval = progress.interval_days;
        let newEase = progress.ease_factor;

        // Update ratings counter
        if (quality === 1) {
            setRatings(prev => ({ ...prev, hard: prev.hard + 1 }));
            newInterval = 1;
        } else if (quality === 2.5) {
            setRatings(prev => ({ ...prev, good: prev.good + 1 }));
            newInterval = Math.round(progress.interval_days * 2.5);
            if (quality > 2.5) newEase += 0.1;
        } else if (quality === 3) {
            setRatings(prev => ({ ...prev, easy: prev.easy + 1 }));
            newInterval = Math.round(progress.interval_days * 3);
            newEase += 0.1;
        }

        // Update correct/total
        setTotal(prev => prev + 1);
        if (quality > 1) setCorrect(prev => prev + 1);

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        try {
            const { error } = await supabase
                .from('student_progress')
                .upsert({
                    item_id: item.id,
                    student_id: STUDENT_ID,
                    attempts: progress.attempts + 1,
                    correct_count: quality > 1 ? progress.correct_count + 1 : progress.correct_count,
                    last_attempt: new Date().toISOString(),
                    next_review: nextReview.toISOString(),
                    interval_days: newInterval,
                    ease_factor: newEase
                });

            if (error) console.error("Update error:", error);
        } catch (err) {
            console.error("Failed to update SRT data:", err);
        }

        // Move to next card with animation
        if (currentIndex < vocabulary.length - 1) {
            setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
        } else {
            // Show summary instead of auto-close
            setTimeout(() => setShowSummary(true), 300);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < vocabulary.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleClose = (withToast = false) => {
        if (withToast) {
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                closeDialog();
            }, 2000); // Wait for toast
        } else {
            closeDialog();
        }
    };

    const closeDialog = () => {
        // Reset state
        setCurrentIndex(0);
        setRatings({ hard: 0, good: 0, easy: 0 });
        setCorrect(0);
        setTotal(0);
        setShowSummary(false);
        onClose();
    };

    if (!isOpen) {
        if (showToast) {
            // Keep component mounted briefly for toast if needed, 
            // but here we are managing it inside.
            // If isOpen becomes false from parent, we just return null.
            return null;
        }
        return null;
    }

    if (loading) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact">
                    <div style={{ textAlign: 'center', padding: '60px', color: '#fff' }}>
                        <h2>🏛️ Loading...</h2>
                    </div>
                </div>
            </div>
        );
    }

    const currentVocab = vocabulary[currentIndex];
    const progressPercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Summary Screen
    if (showSummary || vocabulary.length === 0) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>🎉 Session beendet!</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        {correct} richtig / {total - correct} falsch ({progressPercent} %)
                    </p>

                    <div className="summary-stats" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
                        <div className="stat-circle">
                            <span style={{ fontSize: '24px', color: '#34C759', fontWeight: 'bold' }}>{correct}</span>
                            <span style={{ fontSize: '12px', color: '#8E8E93' }}>Richtig</span>
                        </div>
                        <div className="stat-circle">
                            <span style={{ fontSize: '24px', color: '#FF453A', fontWeight: 'bold' }}>{total - correct}</span>
                            <span style={{ fontSize: '12px', color: '#8E8E93' }}>Falsch</span>
                        </div>
                    </div>

                    <button className="btn-primary" onClick={() => handleClose(true)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        Zurück zum Dashboard
                    </button>

                    {showToast && (
                        <div className="save-toast">
                            ✅ Fortschritt gespeichert – super gemacht!
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="vocabulary-dialog-overlay" onClick={() => handleClose(false)}>
            <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="dialog-close-btn" onClick={() => handleClose(false)}>×</button>

                {/* Header: Just Counter & Progress */}
                <div className="dialog-header compact-header">
                    <div className="header-left">
                        <span className="card-counter">Card {currentIndex + 1} / {vocabulary.length}</span>
                    </div>
                    <div className="header-right">
                        <div className="progress-bar-mini">
                            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#8E8E93', marginLeft: '8px', fontWeight: 600 }}>{progressPercent}%</span>
                    </div>
                </div>

                {/* Content Area with Arrows */}
                <div className="dialog-body-row">
                    <button
                        className="nav-arrow-btn prev"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                    >
                        ‹
                    </button>

                    <div className="flashcard-wrapper">
                        <Flashcard
                            term={currentVocab.english}
                            translation={currentVocab.greek}
                            exampleTerm={currentVocab.example_en || ''}
                            exampleTranslation={currentVocab.example_gr || ''}
                            onScore={handleScore}
                        />
                    </div>

                    <button
                        className="nav-arrow-btn next"
                        onClick={handleNext}
                        disabled={currentIndex === vocabulary.length - 1}
                    >
                        ›
                    </button>
                </div>

                {/* Footer: Just Rating Buttons */}
                <div className="dialog-footer compact-footer">
                    <button className="rating-btn rating-hard" onClick={() => handleScore(1)}>
                        Hard
                    </button>
                    <button className="rating-btn rating-good" onClick={() => handleScore(2.5)}>
                        Good
                    </button>
                    <button className="rating-btn rating-easy" onClick={() => handleScore(3)}>
                        Easy
                    </button>
                </div>

                {showToast && (
                    <div className="save-toast">
                        ✅ Result saved - well done!
                    </div>
                )}
            </div>
        </div>
    );
}
