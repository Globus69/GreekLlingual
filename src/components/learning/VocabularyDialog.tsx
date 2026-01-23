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
    mode?: 'weak' | 'review' | 'due'; // Optional mode parameter
}

const STUDENT_ID = 'demo-student-id';

export default function VocabularyDialog({ isOpen, onClose, mode = 'review' }: VocabularyDialogProps) {
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
    }, [isOpen, mode]);

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
                .limit(50); // Fetch more to allow filtering

            if (error) {
                console.error("Error fetching vocabs:", error);
                setVocabulary(filterVocabsByMode(getDemoVocabs(), mode));
            } else if (data && data.length > 0) {
                const filtered = filterVocabsByMode(data as VocabWithProgress[], mode);
                setVocabulary(filtered);
            } else {
                setVocabulary(filterVocabsByMode(getDemoVocabs(), mode)); // Fallback if empty
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setVocabulary(filterVocabsByMode(getDemoVocabs(), mode));
        } finally {
            setLoading(false);
        }
    };

    const filterVocabsByMode = (vocabs: VocabWithProgress[], filterMode: string): VocabWithProgress[] => {
        const today = new Date().toISOString().split('T')[0];
        
        switch (filterMode) {
            case 'weak':
                // Filter: ease_factor < 2.3 (schwierige Karten)
                return vocabs
                    .filter(vocab => {
                        const progress = vocab.student_progress?.[0];
                        const ease = progress?.ease_factor ?? 2.5;
                        return ease < 2.3;
                    })
                    .sort((a, b) => {
                        const easeA = a.student_progress?.[0]?.ease_factor ?? 2.5;
                        const easeB = b.student_progress?.[0]?.ease_factor ?? 2.5;
                        return easeA - easeB; // Niedrigste zuerst (schwerste zuerst)
                    });
            
            case 'due':
                // Filter: next_review <= heute
                return vocabs
                    .filter(vocab => {
                        const progress = vocab.student_progress?.[0];
                        if (!progress?.next_review) return true; // No review date = due
                        const reviewDate = progress.next_review.split('T')[0];
                        return reviewDate <= today;
                    })
                    .sort((a, b) => {
                        const dateA = a.student_progress?.[0]?.next_review || '';
                        const dateB = b.student_progress?.[0]?.next_review || '';
                        return dateA.localeCompare(dateB); // Älteste zuerst
                    });
            
            case 'review':
            default:
                // Alle Karten, priorisiert: weak → due → rest
                return vocabs.sort((a, b) => {
                    const progressA = a.student_progress?.[0];
                    const progressB = b.student_progress?.[0];
                    const easeA = progressA?.ease_factor ?? 2.5;
                    const easeB = progressB?.ease_factor ?? 2.5;
                    const dateA = progressA?.next_review || '';
                    const dateB = progressB?.next_review || '';
                    
                    // Weak cards first
                    if (easeA < 2.3 && easeB >= 2.3) return -1;
                    if (easeA >= 2.3 && easeB < 2.3) return 1;
                    
                    // Due cards next
                    if (dateA && dateA <= today && (!dateB || dateB > today)) return -1;
                    if (dateB && dateB <= today && (!dateA || dateA > today)) return 1;
                    
                    // Sort by ease (harder first)
                    return easeA - easeB;
                });
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
            created_at: new Date().toISOString(),
            student_progress: [{
                id: 1,
                student_id: STUDENT_ID,
                item_id: 1,
                interval_days: 2,
                ease_factor: 2.5,
                attempts: 3,
                correct_count: 2,
                last_attempt: new Date().toISOString(),
                next_review: new Date().toISOString()
            }]
        },
        {
            id: 2,
            type: 'vocabulary',
            english: 'Thank you',
            greek: 'Ευχαριστώ',
            example_en: 'Thank you very much',
            example_gr: 'Ευχαριστώ πολύ',
            audio_url: null,
            created_at: new Date().toISOString(),
            student_progress: [{
                id: 2,
                student_id: STUDENT_ID,
                item_id: 2,
                interval_days: 1,
                ease_factor: 2.0, // Weak word (ease < 2.3)
                attempts: 2,
                correct_count: 1,
                last_attempt: new Date().toISOString(),
                next_review: new Date().toISOString()
            }]
        },
        {
            id: 3,
            type: 'vocabulary',
            english: 'Water',
            greek: 'Νερό',
            example_en: 'I want water',
            example_gr: 'Θέλω νερό',
            audio_url: null,
            created_at: new Date().toISOString(),
            student_progress: [{
                id: 3,
                student_id: STUDENT_ID,
                item_id: 3,
                interval_days: 1,
                ease_factor: 2.1, // Weak word (ease < 2.3)
                attempts: 1,
                correct_count: 0,
                last_attempt: new Date().toISOString(),
                next_review: new Date().toISOString()
            }]
        },
        {
            id: 4,
            type: 'vocabulary',
            english: 'Please',
            greek: 'Παρακαλώ',
            example_en: 'Please help me',
            example_gr: 'Παρακαλώ βοήθησέ με',
            audio_url: null,
            created_at: new Date().toISOString(),
            student_progress: [{
                id: 4,
                student_id: STUDENT_ID,
                item_id: 4,
                interval_days: 1,
                ease_factor: 1.9, // Very weak word
                attempts: 1,
                correct_count: 0,
                last_attempt: new Date().toISOString(),
                next_review: new Date().toISOString()
            }]
        },
        {
            id: 5,
            type: 'vocabulary',
            english: 'Good morning',
            greek: 'Καλημέρα',
            example_en: 'Good morning, how are you?',
            example_gr: 'Καλημέρα, πώς είσαι;',
            audio_url: null,
            created_at: new Date().toISOString(),
            student_progress: [{
                id: 5,
                student_id: STUDENT_ID,
                item_id: 5,
                interval_days: 5,
                ease_factor: 2.8, // Good word (ease >= 2.3)
                attempts: 5,
                correct_count: 4,
                last_attempt: new Date().toISOString(),
                next_review: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
            }]
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
