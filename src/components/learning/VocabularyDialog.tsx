"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/AuthContext';
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

export default function VocabularyDialog({ isOpen, onClose, mode = 'review' }: VocabularyDialogProps) {
    const { user } = useAuth();
    const [vocabulary, setVocabulary] = useState<VocabWithProgress[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState({ hard: 0, good: 0, easy: 0 });
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [flipped, setFlipped] = useState(false);
    
    const STUDENT_ID = user?.id || '';

    useEffect(() => {
        if (isOpen) {
            // DEVELOPMENT MODE: Allow fetching vocabulary even with demo user
            // The AuthContext will provide a demo user if no real user exists
            fetchVocabulary();
            setShowSummary(false);
            setFlipped(false);
        }
    }, [isOpen, mode, user?.id]);

    const playAudio = () => {
        if (vocabulary.length === 0 || currentIndex >= vocabulary.length) return;
        
        const currentVocab = vocabulary[currentIndex];
        if (!currentVocab) return;
        
        const text = currentVocab.greek;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'el-GR';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            
            // Try to find Greek voice
            const voices = window.speechSynthesis.getVoices();
            const greekVoice = voices.find(v => v.lang.startsWith('el')) || voices.find(v => v.lang.includes('Greek'));
            if (greekVoice) {
                utterance.voice = greekVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported');
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't handle shortcuts if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case ' ':
                case 'Spacebar':
                    e.preventDefault();
                    setFlipped(!flipped);
                    break;
                case '1':
                    e.preventDefault();
                    handleScore(1);
                    break;
                case '2':
                    e.preventDefault();
                    handleScore(2.5);
                    break;
                case '3':
                    e.preventDefault();
                    handleScore(3);
                    break;
                case 'a':
                case 'A':
                    e.preventDefault();
                    playAudio();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleNext();
                    break;
                case 'Escape':
                    e.preventDefault();
                    handleClose(false);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, flipped, currentIndex, vocabulary.length]);

    const fetchVocabulary = async () => {
        setLoading(true);
        console.log(`🔄 Fetching vocabulary for mode: ${mode}, student: ${STUDENT_ID || 'demo'}`);
        
        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 10000)
            );

            // Fetch learning_items with student_progress (LEFT JOIN)
            // Even if no student_id, we can still load vocabulary items
            const queryPromise = supabase
                .from('learning_items')
                .select(`
                    *,
                    student_progress!left(*)
                `)
                .eq('type', 'vocabulary')
                .order('created_at', { ascending: false })
                .limit(100);

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

            if (error) {
                console.error("❌ Error fetching vocabs:", error);
                console.error("Error details:", JSON.stringify(error, null, 2));
                
                // If table doesn't exist, show helpful message
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.error("⚠️ learning_items table does not exist. Please run the setup SQL scripts.");
                }
                
                setVocabulary([]);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                // Filter student_progress to only include entries for current student (if student_id exists)
                const processedData = data.map((item: any) => ({
                    ...item,
                    student_progress: STUDENT_ID 
                        ? (item.student_progress?.filter(
                            (p: any) => p?.student_id === STUDENT_ID
                        ) || [])
                        : [] // No student_id = no progress data
                })) as VocabWithProgress[];
                
                const filtered = filterVocabsByMode(processedData, mode);
                console.log(`✅ Loaded ${filtered.length} cards for mode: ${mode} (from ${data.length} total items)`);
                setVocabulary(filtered);
            } else {
                console.log("⚠️ No vocabulary items found in database");
                console.log("💡 Tip: Run supabase/insert_test_vocabulary.sql to add test data");
                setVocabulary([]);
            }
        } catch (err: any) {
            console.error("❌ Fetch error:", err);
            if (err.message === 'Database query timeout') {
                console.error("⏱️ Database query timed out after 10 seconds");
            }
            setVocabulary([]);
        } finally {
            setLoading(false);
            console.log(`✅ Loading complete for mode: ${mode}`);
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
                // Filter: next_review <= heute (or no review date = due)
                const todayDate = new Date(today);
                return vocabs
                    .filter(vocab => {
                        const progress = vocab.student_progress?.[0];
                        if (!progress?.next_review) return true; // No review date = due
                        const reviewDate = new Date(progress.next_review);
                        return reviewDate <= todayDate;
                    })
                    .sort((a, b) => {
                        const dateA = a.student_progress?.[0]?.next_review;
                        const dateB = b.student_progress?.[0]?.next_review;
                        if (!dateA && !dateB) return 0;
                        if (!dateA) return -1; // No date = most urgent
                        if (!dateB) return 1;
                        return new Date(dateA).getTime() - new Date(dateB).getTime(); // Älteste zuerst
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


    const handleScore = async (quality: number) => {
        const item = vocabulary[currentIndex];
        const existingProgress = item.student_progress?.[0];
        const progress: StudentProgress = existingProgress || {
            id: 0,
            student_id: STUDENT_ID,
            item_id: item.id,
            interval_days: 1.0,
            ease_factor: 2.5,
            attempts: 0,
            correct_count: 0,
            last_attempt: null,
            next_review: null
        };

        let newInterval = progress.interval_days;
        let newEase = progress.ease_factor;

        // Update ratings counter and calculate new interval/ease
        if (quality === 1) {
            // Hard - reset interval, decrease ease slightly
            setRatings(prev => ({ ...prev, hard: prev.hard + 1 }));
            newInterval = 1;
            newEase = Math.max(1.3, progress.ease_factor - 0.15); // Minimum ease is 1.3
        } else if (quality === 2.5) {
            // Good - increase interval, slight ease increase
            setRatings(prev => ({ ...prev, good: prev.good + 1 }));
            newInterval = Math.max(1, Math.round(progress.interval_days * 2.5));
            newEase = Math.min(3.0, progress.ease_factor + 0.05); // Maximum ease is 3.0
        } else if (quality === 3) {
            // Easy - larger interval increase, more ease increase
            setRatings(prev => ({ ...prev, easy: prev.easy + 1 }));
            newInterval = Math.max(1, Math.round(progress.interval_days * 3));
            newEase = Math.min(3.0, progress.ease_factor + 0.1); // Maximum ease is 3.0
        }

        // Update correct/total
        setTotal(prev => prev + 1);
        if (quality > 1) setCorrect(prev => prev + 1);

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        try {
            // Upsert with onConflict to handle unique constraint (item_id, student_id)
            const { data: upsertData, error } = await supabase
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
                }, {
                    onConflict: 'item_id,student_id'
                });

            if (error) {
                console.error("❌ Update error:", error);
                console.error("Failed to save progress for item:", item.id);
            } else {
                console.log(`✅ Progress saved: ${item.english} → ease: ${progress.ease_factor.toFixed(2)} → ${newEase.toFixed(2)}, interval: ${newInterval}d`);
                
                // Update local state to reflect the change immediately
                const updatedVocabulary = [...vocabulary];
                const updatedProgress: StudentProgress = {
                    id: existingProgress?.id || 0,
                    student_id: STUDENT_ID,
                    item_id: item.id,
                    attempts: progress.attempts + 1,
                    correct_count: quality > 1 ? progress.correct_count + 1 : progress.correct_count,
                    last_attempt: new Date().toISOString(),
                    next_review: nextReview.toISOString(),
                    interval_days: newInterval,
                    ease_factor: newEase
                };
                updatedVocabulary[currentIndex] = {
                    ...item,
                    student_progress: [updatedProgress]
                };
                setVocabulary(updatedVocabulary);
            }
        } catch (err) {
            console.error("❌ Failed to update SRT data:", err);
        }

        // Move to next card with animation
        setFlipped(false); // Reset flip state
        if (currentIndex < vocabulary.length - 1) {
            setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
        } else {
            // Show summary instead of auto-close
            setTimeout(() => setShowSummary(true), 300);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setFlipped(false); // Reset flip when changing cards
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < vocabulary.length - 1) {
            setFlipped(false); // Reset flip when changing cards
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
        setFlipped(false);
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
                        <p style={{ color: '#8E8E93', marginTop: '12px', fontSize: '14px' }}>
                            Fetching vocabulary from database...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show empty state if no vocabulary and no user
    if (vocabulary.length === 0 && !user?.id) {
        return (
            <div className="vocabulary-dialog-overlay" onClick={() => handleClose(false)}>
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <button className="dialog-close-btn" onClick={() => handleClose(false)}>×</button>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ Login Required</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        Please log in to access vocabulary learning features.
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // Check if we have vocabulary to display (after loading is complete)
    if (!loading && vocabulary.length === 0) {
        // No vocabulary found (for any user, including demo)
        return (
            <div className="vocabulary-dialog-overlay" onClick={() => handleClose(false)}>
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <button className="dialog-close-btn" onClick={() => handleClose(false)}>×</button>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>📚 No Vocabulary Found</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '20px' }}>
                        No vocabulary items available for this mode.
                    </p>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '30px' }}>
                        💡 <strong>Tip:</strong> Run <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>supabase/insert_test_vocabulary.sql</code> in your Supabase SQL editor to add test vocabulary.
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const currentVocab = vocabulary[currentIndex];
    if (!currentVocab) {
        // Safety check - should not happen but prevents crashes
        return (
            <div className="vocabulary-dialog-overlay" onClick={() => handleClose(false)}>
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <button className="dialog-close-btn" onClick={() => handleClose(false)}>×</button>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ Error</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        Unable to load vocabulary card.
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const progressPercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Summary Screen
    if (showSummary) {
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
                            onAudio={playAudio}
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

                {/* Footer: Rating Buttons */}
                <div className="dialog-footer compact-footer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <button className="rating-btn rating-hard" onClick={() => handleScore(1)}>
                        Hard (1)
                    </button>
                    <button className="rating-btn rating-good" onClick={() => handleScore(2.5)}>
                        Good (2)
                    </button>
                    <button className="rating-btn rating-easy" onClick={() => handleScore(3)}>
                        Easy (3)
                    </button>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '12px', 
                    fontSize: '11px', 
                    color: '#8E8E93',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px'
                }}>
                    ⌨️ Shortcuts: Space=Flip • 1/2/3=Rate • A=Audio • ←/→=Navigate • Esc=Close
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
