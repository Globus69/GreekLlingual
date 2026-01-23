"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/AuthContext';
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

interface ComprehensionWithProgress extends LearningItem {
    student_progress?: StudentProgress[];
}

interface ComprehensionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'weak' | 'review' | 'due';
}

// Fallback comprehension data if Supabase is not available
const FALLBACK_COMPREHENSION: ComprehensionWithProgress[] = [
    { id: 1, type: 'comprehension', english: 'What is your name?', greek: 'Πώς σε λένε;', example_en: 'What is your name?', example_gr: 'Πώς σε λένε; Με λένε Μαρία.', audio_url: null, created_at: new Date().toISOString(), student_progress: [{ id: 1, student_id: 'demo', item_id: 1, interval_days: 1, ease_factor: 2.0, attempts: 0, correct_count: 0, last_attempt: null, next_review: null }] },
    { id: 2, type: 'comprehension', english: 'How are you?', greek: 'Πώς είσαι;', example_en: 'How are you?', example_gr: 'Πώς είσαι; Είμαι καλά, ευχαριστώ.', audio_url: null, created_at: new Date().toISOString(), student_progress: [{ id: 2, student_id: 'demo', item_id: 2, interval_days: 1, ease_factor: 2.1, attempts: 0, correct_count: 0, last_attempt: null, next_review: null }] },
    { id: 3, type: 'comprehension', english: 'Where are you from?', greek: 'Από πού είσαι;', example_en: 'Where are you from?', example_gr: 'Από πού είσαι; Είμαι από την Ελλάδα.', audio_url: null, created_at: new Date().toISOString(), student_progress: [{ id: 3, student_id: 'demo', item_id: 3, interval_days: 1, ease_factor: 2.2, attempts: 0, correct_count: 0, last_attempt: null, next_review: null }] },
    { id: 4, type: 'comprehension', english: 'I understand', greek: 'Καταλαβαίνω', example_en: 'I understand', example_gr: 'Καταλαβαίνω τι λες.', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 5, type: 'comprehension', english: 'I don\'t understand', greek: 'Δεν καταλαβαίνω', example_en: 'I don\'t understand', example_gr: 'Δεν καταλαβαίνω τι λες.', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 6, type: 'comprehension', english: 'Can you repeat?', greek: 'Μπορείς να επαναλάβεις;', example_en: 'Can you repeat?', example_gr: 'Μπορείς να επαναλάβεις, παρακαλώ;', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 7, type: 'comprehension', english: 'What does this mean?', greek: 'Τι σημαίνει αυτό;', example_en: 'What does this mean?', example_gr: 'Τι σημαίνει αυτή η λέξη;', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 8, type: 'comprehension', english: 'Can you speak slower?', greek: 'Μπορείς να μιλήσεις πιο αργά;', example_en: 'Can you speak slower?', example_gr: 'Μπορείς να μιλήσεις πιο αργά, παρακαλώ;', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 9, type: 'comprehension', english: 'I need help', greek: 'Χρειάζομαι βοήθεια', example_en: 'I need help', example_gr: 'Χρειάζομαι βοήθεια με αυτό.', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 10, type: 'comprehension', english: 'That\'s correct', greek: 'Αυτό είναι σωστό', example_en: 'That\'s correct', example_gr: 'Αυτό είναι σωστό, μπράβο!', audio_url: null, created_at: new Date().toISOString(), student_progress: [] }
];

export default function ComprehensionDialog({ isOpen, onClose, mode = 'review' }: ComprehensionDialogProps) {
    const { user } = useAuth();
    const [comprehension, setComprehension] = useState<ComprehensionWithProgress[]>([]);
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
            fetchComprehension();
            setShowSummary(false);
            setFlipped(false);
        }
    }, [isOpen, mode, user?.id]);

    const playAudio = () => {
        if (comprehension.length === 0 || currentIndex >= comprehension.length) return;
        
        const currentItem = comprehension[currentIndex];
        if (!currentItem) return;
        
        const text = currentItem.greek;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'el-GR';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            
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

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e: KeyboardEvent) => {
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
                case 'Esc':
                    e.preventDefault();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, flipped, currentIndex, comprehension.length]);

    const fetchComprehension = async () => {
        setLoading(true);
        console.log(`🔄 Fetching comprehension for mode: ${mode}, student: ${STUDENT_ID || 'demo'}`);
        
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 10000)
            );

            const queryPromise = supabase
                .from('learning_items')
                .select(`
                    *,
                    student_progress!left(*)
                `)
                .eq('type', 'comprehension')
                .order('created_at', { ascending: false })
                .limit(100);

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

            if (error) {
                console.error("❌ Error fetching comprehension:", error);
                
                if (error.code === '42P01' || error.message?.includes('does not exist') || 
                    error.message?.includes('Invalid API key') || error.message?.includes('401')) {
                    console.error("⚠️ Supabase error. Using fallback comprehension data.");
                    const filtered = filterComprehensionByMode(FALLBACK_COMPREHENSION, mode);
                    setComprehension(filtered);
                    setLoading(false);
                    return;
                }
                
                console.warn("⚠️ Error accessing Supabase. Using fallback comprehension data.");
                const filtered = filterComprehensionByMode(FALLBACK_COMPREHENSION, mode);
                setComprehension(filtered);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                const processedData = data.map((item: any) => ({
                    ...item,
                    student_progress: STUDENT_ID 
                        ? (item.student_progress?.filter(
                            (p: any) => p?.student_id === STUDENT_ID
                        ) || [])
                        : []
                })) as ComprehensionWithProgress[];
                
                const filtered = filterComprehensionByMode(processedData, mode);
                console.log(`✅ Loaded ${filtered.length} comprehension cards for mode: ${mode} (from ${data.length} total items)`);
                setComprehension(filtered);
            } else {
                console.log("⚠️ No comprehension items found in database");
                console.log("💡 Using fallback comprehension data");
                const filtered = filterComprehensionByMode(FALLBACK_COMPREHENSION, mode);
                setComprehension(filtered);
            }
        } catch (err: any) {
            console.error("❌ Fetch error:", err);
            if (err.message === 'Database query timeout') {
                console.error("⏱️ Database query timed out after 10 seconds");
            }
            console.log("💡 Using fallback comprehension data due to error");
            const filtered = filterComprehensionByMode(FALLBACK_COMPREHENSION, mode);
            setComprehension(filtered);
        } finally {
            setLoading(false);
            console.log(`✅ Loading complete for mode: ${mode}`);
        }
    };

    const filterComprehensionByMode = (items: ComprehensionWithProgress[], filterMode: string): ComprehensionWithProgress[] => {
        const today = new Date().toISOString().split('T')[0];
        
        switch (filterMode) {
            case 'weak':
                const weakCards = items
                    .filter(item => {
                        const progress = item.student_progress?.[0];
                        const ease = progress?.ease_factor ?? 2.5;
                        return ease < 2.3;
                    })
                    .sort((a, b) => {
                        const easeA = a.student_progress?.[0]?.ease_factor ?? 2.5;
                        const easeB = b.student_progress?.[0]?.ease_factor ?? 2.5;
                        return easeA - easeB;
                    });
                
                if (weakCards.length === 0 && items.length > 0) {
                    console.log('⚠️ No weak cards found, showing all cards for weak mode');
                    return items.sort((a, b) => {
                        const easeA = a.student_progress?.[0]?.ease_factor ?? 2.5;
                        const easeB = b.student_progress?.[0]?.ease_factor ?? 2.5;
                        return easeA - easeB;
                    });
                }
                
                return weakCards;
            
            case 'due':
                const todayDate = new Date(today);
                return items
                    .filter(item => {
                        const progress = item.student_progress?.[0];
                        if (!progress?.next_review) return true;
                        const reviewDate = new Date(progress.next_review);
                        return reviewDate <= todayDate;
                    })
                    .sort((a, b) => {
                        const dateA = a.student_progress?.[0]?.next_review;
                        const dateB = b.student_progress?.[0]?.next_review;
                        if (!dateA && !dateB) return 0;
                        if (!dateA) return -1;
                        if (!dateB) return 1;
                        return new Date(dateA).getTime() - new Date(dateB).getTime();
                    });
            
            case 'review':
            default:
                return items.sort((a, b) => {
                    const progressA = a.student_progress?.[0];
                    const progressB = b.student_progress?.[0];
                    const easeA = progressA?.ease_factor ?? 2.5;
                    const easeB = progressB?.ease_factor ?? 2.5;
                    const dateA = progressA?.next_review || '';
                    const dateB = progressB?.next_review || '';
                    
                    if (easeA < 2.3 && easeB >= 2.3) return -1;
                    if (easeA >= 2.3 && easeB < 2.3) return 1;
                    
                    if (dateA && dateA <= today && (!dateB || dateB > today)) return -1;
                    if (dateB && dateB <= today && (!dateA || dateA > today)) return 1;
                    
                    return easeA - easeB;
                });
        }
    };

    const handleScore = async (quality: number) => {
        const item = comprehension[currentIndex];
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

        if (quality === 1) {
            setRatings(prev => ({ ...prev, hard: prev.hard + 1 }));
            newInterval = 1;
            newEase = Math.max(1.3, progress.ease_factor - 0.15);
        } else if (quality === 2.5) {
            setRatings(prev => ({ ...prev, good: prev.good + 1 }));
            newInterval = Math.max(1, Math.round(progress.interval_days * 2.5));
            newEase = Math.min(3.0, progress.ease_factor + 0.05);
        } else if (quality === 3) {
            setRatings(prev => ({ ...prev, easy: prev.easy + 1 }));
            newInterval = Math.max(1, Math.round(progress.interval_days * 3));
            newEase = Math.min(3.0, progress.ease_factor + 0.1);
        }

        setTotal(prev => prev + 1);
        if (quality > 1) setCorrect(prev => prev + 1);

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        try {
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
            } else {
                console.log(`✅ Progress saved: ${item.english} → ease: ${progress.ease_factor.toFixed(2)} → ${newEase.toFixed(2)}, interval: ${newInterval}d`);
                
                const updatedComprehension = [...comprehension];
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
                updatedComprehension[currentIndex] = {
                    ...item,
                    student_progress: [updatedProgress]
                };
                setComprehension(updatedComprehension);
            }
        } catch (err) {
            console.error("❌ Failed to update SRT data:", err);
        }

        setFlipped(false);
        if (currentIndex < comprehension.length - 1) {
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
            }, 300);
        } else {
            setTimeout(() => setShowSummary(true), 300);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setFlipped(false);
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < comprehension.length - 1) {
            setFlipped(false);
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleRestart = async () => {
        console.log('🔄 Restarting comprehension session...');
        setCurrentIndex(0);
        setFlipped(false);
        setRatings({ hard: 0, good: 0, easy: 0 });
        setCorrect(0);
        setTotal(0);
        setShowSummary(false);
        await fetchComprehension();
    };

    const handleClose = (withToast = false) => {
        if (withToast) {
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                closeDialog();
            }, 2000);
        } else {
            closeDialog();
        }
    };

    const closeDialog = () => {
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
            return null;
        }
        return null;
    }

    if (loading) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact">
                    <div style={{ textAlign: 'center', padding: '60px', color: '#fff' }}>
                        <h2>🧠 Loading...</h2>
                        <p style={{ color: '#8E8E93', marginTop: '12px', fontSize: '14px' }}>
                            Fetching comprehension from database...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (comprehension.length === 0 && !user?.id) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ Login Required</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        Please log in to access comprehension learning features.
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        Abbrechen
                    </button>
                </div>
            </div>
        );
    }

    if (!loading && comprehension.length === 0) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>🧠 No Comprehension Found</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '20px' }}>
                        No comprehension items available for this mode.
                    </p>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '30px' }}>
                        💡 <strong>Tip:</strong> Run <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>supabase/insert_test_comprehension.sql</code> in your Supabase SQL editor to add test comprehension.
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        Abbrechen
                    </button>
                </div>
            </div>
        );
    }

    const currentItem = comprehension[currentIndex];
    if (!currentItem) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ Error</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        Unable to load comprehension card.
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        Abbrechen
                    </button>
                </div>
            </div>
        );
    }

    const progressPercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    if (showSummary) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" style={{ 
                    textAlign: 'center', 
                    padding: 'calc(var(--spacing-3xl) * 0.525)',
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid var(--border-glass)',
                    boxShadow: 'var(--shadow-float)'
                }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: 'calc(var(--spacing-lg) * 0.75)' }}>🎉</div>
                    <h2 style={{ 
                        fontSize: '1.875rem', 
                        fontWeight: 700,
                        marginBottom: 'calc(var(--spacing-sm) * 0.75)',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.5px'
                    }}>Session beendet!</h2>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        marginBottom: 'calc(var(--spacing-xl) * 0.75)',
                        fontSize: '1rem',
                        letterSpacing: '-0.1px'
                    }}>
                        {correct} richtig / {total - correct} falsch ({progressPercent} %)
                    </p>

                    <div className="summary-stats" style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: 'calc(var(--spacing-xl) * 0.75)', 
                        marginBottom: 'calc(var(--spacing-xl) * 0.75)' 
                    }}>
                        <div className="stat-circle">
                            <span style={{ 
                                fontSize: '1.875rem', 
                                color: '#34c759', 
                                fontWeight: 700,
                                letterSpacing: '-0.5px'
                            }}>{correct}</span>
                            <span style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                marginTop: 'calc(var(--spacing-xs) * 0.75)'
                            }}>Richtig</span>
                        </div>
                        <div style={{
                            width: '1px',
                            height: '36px',
                            background: 'var(--border-medium)'
                        }}></div>
                        <div className="stat-circle">
                            <span style={{ 
                                fontSize: '1.875rem', 
                                color: '#ef4444', 
                                fontWeight: 700,
                                letterSpacing: '-0.5px'
                            }}>{total - correct}</span>
                            <span style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                marginTop: 'calc(var(--spacing-xs) * 0.75)'
                            }}>Falsch</span>
                        </div>
                    </div>

                    <button 
                        className="btn-primary" 
                        onClick={() => handleClose(true)} 
                        style={{ 
                            width: '100%', 
                            padding: '12px 24px', 
                            borderRadius: 'var(--radius-md)', 
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            background: 'rgba(99, 102, 241, 0.15)',
                            backdropFilter: 'blur(20px) saturate(150%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            color: '#6366f1',
                            cursor: 'pointer',
                            transition: 'all 0.3s var(--transition-smooth)',
                            boxShadow: 'var(--shadow-inner)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            letterSpacing: '-0.1px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-inner), var(--glow-hard)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-inner)';
                        }}
                    >
                        Zurück zum Dashboard
                    </button>

                    {showToast && (
                        <div className="save-toast" style={{
                            position: 'absolute',
                            bottom: 'calc(var(--spacing-lg) * 0.7)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(44, 44, 46, 0.9)',
                            backdropFilter: 'blur(20px)',
                            padding: 'calc(var(--spacing-md) * 0.7) calc(var(--spacing-lg) * 0.7)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            boxShadow: 'var(--shadow-frosted)',
                            border: '1px solid var(--border-soft)'
                        }}>
                            ✅ Fortschritt gespeichert – super gemacht!
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const getModeConfig = () => {
        switch (mode) {
            case 'weak':
                return { title: '💪 Train Weak Comprehension', subtitle: 'Lass uns diese stärken' };
            case 'due':
                return { title: '📚 Due Comprehension Today', subtitle: 'Deine täglichen Wiederholungen' };
            case 'review':
            default:
                return { title: '🧠 Comprehension', subtitle: 'Dein Verständnis trainieren' };
        }
    };

    const modeConfig = getModeConfig();

    return (
        <div className="vocabulary-dialog-overlay">
            <div className="vocabulary-dialog daily-phrases-layout" onClick={(e) => e.stopPropagation()}>
                <div className="mode-header">
                    <div className="mode-header-frame">
                        <h1>{modeConfig.title}</h1>
                        <p>{modeConfig.subtitle}</p>
                    </div>
                </div>

                <div className="progress-wrapper">
                    <div className="progress-info">
                        <div className="progress-text">
                            <span>{currentIndex + 1}</span> / <span>{comprehension.length}</span>
                        </div>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>

                <div className="main-card-area">
                    <div 
                        className={`phrase-card ${flipped ? 'flipped' : ''}`}
                        onClick={() => setFlipped(!flipped)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-content">
                            <div className={`english-translation-container ${!flipped ? 'active' : ''}`}>
                                <div className="field-label">ENGLISH</div>
                                <p className="english-translation">{currentItem.english}</p>
                                {currentItem.example_en && (
                                    <p style={{ 
                                        fontSize: '1rem', 
                                        color: 'var(--text-secondary)', 
                                        marginTop: 'calc(var(--spacing-sm) * 0.7)',
                                        fontStyle: 'italic'
                                    }}>{currentItem.example_en}</p>
                                )}
                            </div>

                            <div className={`greek-phrase-container ${flipped ? 'active' : ''}`}>
                                <div className="field-label">ΕΛΛΗΝΙΚΑ</div>
                                <h2 className="greek-phrase">{currentItem.greek}</h2>
                                {currentItem.example_gr && (
                                    <p style={{ 
                                        fontSize: '1rem', 
                                        color: 'var(--text-secondary)', 
                                        marginTop: 'calc(var(--spacing-sm) * 0.7)',
                                        fontStyle: 'italic'
                                    }}>{currentItem.example_gr}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="button-bar">
                        {flipped ? (
                            <div className="rating-group">
                                <button 
                                    className="rating-btn rating-hard" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScore(1);
                                    }}
                                >
                                    Hard
                                </button>
                                <button 
                                    className="rating-btn rating-good" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScore(2.5);
                                    }}
                                >
                                    Good
                                </button>
                                <button 
                                    className="rating-btn rating-easy" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScore(3);
                                    }}
                                >
                                    Easy
                                </button>
                            </div>
                        ) : (
                            <div style={{ flex: 1 }}></div>
                        )}

                        <div className="action-group">
                            {flipped && (
                                <button 
                                    id="audioBtn" 
                                    className="action-btn audio-btn" 
                                    title="Griechische Aussprache anhören"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio();
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    </svg>
                                    Audio
                                </button>
                            )}
                            <div className="action-buttons-vertical">
                                <button 
                                    className="action-btn restart-btn vertical-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRestart();
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10"></polyline>
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                    </svg>
                                    Wiederholen
                                </button>
                                <button 
                                    className="action-btn cancel-btn vertical-btn" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClose(false);
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    </div>
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
