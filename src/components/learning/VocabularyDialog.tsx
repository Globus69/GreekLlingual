"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/AuthContext';
import Flashcard from '@/components/learning/Flashcard';
import { useTranslation } from '@/lib/useTranslation';
import '@/styles/liquid-glass.css';

interface LearningItem {
    id: number;
    type: string;
    english: string;
    russian?: string;
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

// Fallback vocabulary data if Supabase is not available
// Some items have low ease_factor to work with "weak" mode filter
const FALLBACK_VOCABULARY: VocabWithProgress[] = [
    { id: 1, type: 'vocabulary', english: 'Hello', russian: 'Привет', greek: 'Γεια σου', example_en: 'Hello friend', example_gr: 'Γεια σου φίλε', audio_url: null, created_at: new Date().toISOString(), student_progress: [{ id: 1, student_id: 'demo', item_id: 1, interval_days: 1, ease_factor: 2.0, attempts: 0, correct_count: 0, last_attempt: null, next_review: null }] },
    { id: 2, type: 'vocabulary', english: 'Thank you', russian: 'Спасибо', greek: 'Ευχαριστώ', example_en: 'Thank you very much', example_gr: 'Ευχαριστώ πολύ', audio_url: null, created_at: new Date().toISOString(), student_progress: [{ id: 2, student_id: 'demo', item_id: 2, interval_days: 1, ease_factor: 2.1, attempts: 0, correct_count: 0, last_attempt: null, next_review: null }] },
    { id: 3, type: 'vocabulary', english: 'Please', russian: 'Пожалуйста', greek: 'Παρακαλώ', example_en: 'Please help me', example_gr: 'Παρακαλώ βοήθησέ με', audio_url: null, created_at: new Date().toISOString(), student_progress: [{ id: 3, student_id: 'demo', item_id: 3, interval_days: 1, ease_factor: 2.2, attempts: 0, correct_count: 0, last_attempt: null, next_review: null }] },
    { id: 4, type: 'vocabulary', english: 'Yes', russian: 'Да', greek: 'Ναι', example_en: 'Yes, I agree', example_gr: 'Ναι, συμφωνώ', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 5, type: 'vocabulary', english: 'No', russian: 'Нет', greek: 'Όχι', example_en: 'No, thank you', example_gr: 'Όχι, ευχαριστώ', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 6, type: 'vocabulary', english: 'Water', russian: 'Вода', greek: 'Νερό', example_en: 'I want water', example_gr: 'Θέλω νερό', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 7, type: 'vocabulary', english: 'Coffee', russian: 'Кофе', greek: 'Καφές', example_en: 'Drink coffee', example_gr: 'Πίνω καφέ', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 8, type: 'vocabulary', english: 'Friend', russian: 'Друг', greek: 'Φίλος', example_en: 'Best friend', example_gr: 'Καλύτερος φίλος', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 9, type: 'vocabulary', english: 'Good morning', russian: 'Доброе утро', greek: 'Καλημέρα', example_en: 'Good morning!', example_gr: 'Καλημέρα!', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 10, type: 'vocabulary', english: 'Goodbye', russian: 'До свидания', greek: 'Αντίο', example_en: 'Goodbye for now', example_gr: 'Αντίο προς το παρόν', audio_url: null, created_at: new Date().toISOString(), student_progress: [] }
];

export default function VocabularyDialog({ isOpen, onClose, mode = 'review' }: VocabularyDialogProps) {
    const { user } = useAuth();
    const { t, locale } = useTranslation();
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
                case 'Esc':
                    e.preventDefault();
                    // Dialog kann nur über Abbrechen-Button geschlossen werden
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
                
                // If table doesn't exist or API key invalid, use fallback
                if (error.code === '42P01' || error.message?.includes('does not exist') || 
                    error.message?.includes('Invalid API key') || error.message?.includes('401')) {
                    console.error("⚠️ Supabase error. Using fallback vocabulary data.");
                    console.log(`💡 Loaded ${FALLBACK_VOCABULARY.length} fallback vocabulary items`);
                    const filtered = filterVocabsByMode(FALLBACK_VOCABULARY, mode);
                    setVocabulary(filtered);
                    setLoading(false);
                    return;
                }
                
                // For other errors, try fallback
                console.warn("⚠️ Error accessing Supabase. Using fallback vocabulary data.");
                const filtered = filterVocabsByMode(FALLBACK_VOCABULARY, mode);
                setVocabulary(filtered);
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
                console.log("💡 Using fallback vocabulary data");
                const filtered = filterVocabsByMode(FALLBACK_VOCABULARY, mode);
                setVocabulary(filtered);
            }
        } catch (err: any) {
            console.error("❌ Fetch error:", err);
            if (err.message === 'Database query timeout') {
                console.error("⏱️ Database query timed out after 10 seconds");
            }
            console.log("💡 Using fallback vocabulary data due to error");
            const filtered = filterVocabsByMode(FALLBACK_VOCABULARY, mode);
            setVocabulary(filtered);
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
                // If no weak cards found, show all cards (for fallback data)
                const weakCards = vocabs
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
                
                // If no weak cards found, return all cards (especially for fallback data)
                if (weakCards.length === 0 && vocabs.length > 0) {
                    console.log('⚠️ No weak cards found, showing all cards for weak mode');
                    return vocabs.sort((a, b) => {
                        const easeA = a.student_progress?.[0]?.ease_factor ?? 2.5;
                        const easeB = b.student_progress?.[0]?.ease_factor ?? 2.5;
                        return easeA - easeB;
                    });
                }
                
                return weakCards;
            
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
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
            }, 300);
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

    const handleRestart = async () => {
        console.log('🔄 Restarting vocabulary session...');
        // Reset to first card
        setCurrentIndex(0);
        setFlipped(false);
        setRatings({ hard: 0, good: 0, easy: 0 });
        setCorrect(0);
        setTotal(0);
        setShowSummary(false);
        
        // Reload vocabulary
        await fetchVocabulary();
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
                        <h2>🏛️ {t('vocab.loading')}</h2>
                        <p style={{ color: '#8E8E93', marginTop: '12px', fontSize: '14px' }}>
                            {t('vocab.loading_subtitle')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show empty state if no vocabulary and no user
    if (vocabulary.length === 0 && !user?.id) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ {t('vocab.login_required')}</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        {t('vocab.login_required_msg')}
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    // Check if we have vocabulary to display (after loading is complete)
    if (!loading && vocabulary.length === 0) {
        // No vocabulary found (for any user, including demo)
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>📚 {t('vocab.no_items')}</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '20px' }}>
                        {t('vocab.no_items_msg')}
                    </p>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '30px' }}>
                        💡 <strong>Tip:</strong> Run <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>supabase/insert_test_vocabulary.sql</code> in your Supabase SQL editor to add test vocabulary.
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    const currentVocab = vocabulary[currentIndex];
    if (!currentVocab) {
        // Safety check - should not happen but prevents crashes
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ {t('vocab.error')}</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        {t('vocab.error_msg')}
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    const progressPercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Summary Screen - Daily Phrases Style
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
                    {/* Close button entfernt - nur Abbrechen-Button erlaubt */}
                    <div style={{ fontSize: '3.5rem', marginBottom: 'calc(var(--spacing-lg) * 0.75)' }}>🎉</div>
                    <h2 style={{ 
                        fontSize: '1.875rem', 
                        fontWeight: 700,
                        marginBottom: 'calc(var(--spacing-sm) * 0.75)',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.5px'
                    }}>{t('vocab.session_complete')}</h2>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        marginBottom: 'calc(var(--spacing-xl) * 0.75)',
                        fontSize: '1rem',
                        letterSpacing: '-0.1px'
                    }}>
                        {correct} {t('vocab.correct')} / {total - correct} {t('vocab.wrong')} ({progressPercent} %)
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
                            }}>{t('vocab.correct')}</span>
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
                            }}>{t('vocab.wrong')}</span>
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
                        {t('vocab.back_to_dashboard')}
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
                            ✅ {t('vocab.progress_saved')}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Get mode title and subtitle
    const getModeConfig = () => {
        switch (mode) {
            case 'weak':
                return { title: `💪 ${t('vocab.mode.weak_title')}`, subtitle: t('mode.weak_subtitle') };
            case 'due':
                return { title: `📚 ${t('vocab.mode.due_title')}`, subtitle: t('mode.due_subtitle') };
            case 'review':
            default:
                return { title: `🔄 ${t('vocab.mode.review_title')}`, subtitle: t('vocab.mode.review_subtitle') };
        }
    };

    const modeConfig = getModeConfig();

    return (
        <div className="vocabulary-dialog-overlay">
            <div className="vocabulary-dialog daily-phrases-layout" onClick={(e) => e.stopPropagation()}>
                {/* Close Button entfernt - Dialog kann nur über Abbrechen-Button geschlossen werden */}

                {/* Header: Mode Title & Subtitle - Daily Phrases Style */}
                <div className="mode-header">
                    <div className="mode-header-frame">
                        <h1>{modeConfig.title}</h1>
                        <p>{modeConfig.subtitle}</p>
                    </div>
                </div>

                {/* Progress Bar - Daily Phrases Style */}
                <div className="progress-wrapper">
                    <div className="progress-info">
                        <div className="progress-text">
                            <span>{currentIndex + 1}</span> / <span>{vocabulary.length}</span>
                        </div>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>

                {/* Main Card Area - Daily Phrases Style */}
                <div className="main-card-area">
                    {/* Phrase Card with Flip Functionality */}
                    <div 
                        className={`phrase-card ${flipped ? 'flipped' : ''}`}
                        onClick={() => setFlipped(!flipped)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-content">
                            {/* Front: English (always visible) */}
                            <div className={`english-translation-container ${!flipped ? 'active' : ''}`}>
                                <div className="field-label">{t('flashcard.label_source')}</div>
                                <p className="english-translation">{locale === 'ru' && currentVocab.russian ? currentVocab.russian : currentVocab.english}</p>
                                {currentVocab.example_en && (
                                    <p style={{ 
                                        fontSize: '1rem', 
                                        color: 'var(--text-secondary)', 
                                        marginTop: 'calc(var(--spacing-sm) * 0.7)',
                                        fontStyle: 'italic'
                                    }}>{currentVocab.example_en}</p>
                                )}
                            </div>

                            {/* Back: Greek (shown when flipped) */}
                            <div className={`greek-phrase-container ${flipped ? 'active' : ''}`}>
                                <div className="field-label">ΕΛΛΗΝΙΚΑ</div>
                                <h2 className="greek-phrase">{currentVocab.greek}</h2>
                                {currentVocab.example_gr && (
                                    <p style={{ 
                                        fontSize: '1rem', 
                                        color: 'var(--text-secondary)', 
                                        marginTop: 'calc(var(--spacing-sm) * 0.7)',
                                        fontStyle: 'italic'
                                    }}>{currentVocab.example_gr}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Button Bar - Daily Phrases Style */}
                    <div className="button-bar">
                        {/* Left: Rating Buttons (shown only when flipped) */}
                        {flipped ? (
                            <div className="rating-group">
                                <button 
                                    className="rating-btn rating-hard" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScore(1);
                                    }}
                                >
                                    {t('btn.hard')}
                                </button>
                                <button 
                                    className="rating-btn rating-good" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScore(2.5);
                                    }}
                                >
                                    {t('btn.good')}
                                </button>
                                <button 
                                    className="rating-btn rating-easy" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScore(3);
                                    }}
                                >
                                    {t('btn.easy')}
                                </button>
                            </div>
                        ) : (
                            <div style={{ flex: 1 }}></div>
                        )}

                        {/* Right: Action Buttons */}
                        <div className="action-group">
                            {flipped && (
                                <button 
                                    id="audioBtn" 
                                    className="action-btn audio-btn" 
                                    title={t('btn.audio_tooltip')}
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
                                    {t('btn.audio')}
                                </button>
                            )}
                            {/* Vertical Stack: Wiederholen and Abbrechen (always visible) */}
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
                                    {t('btn.restart')}
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
                                    {t('btn.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {showToast && (
                    <div className="save-toast">
                        ✅ {t('vocab.result_saved')}
                    </div>
                )}
            </div>
        </div>
    );
}
