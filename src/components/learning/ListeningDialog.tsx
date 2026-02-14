"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { usePerformanceEvaluation } from '@/lib/use-performance-evaluation';
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
    level?: string;
    difficulty?: string;
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

interface ListeningWithProgress extends LearningItem {
    student_progress?: StudentProgress[];
    options?: string[]; // Array of 3 options
    correct_answer?: number; // Index of correct answer (0, 1, or 2)
}

interface ListeningDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'weak' | 'review' | 'due';
}

// Fallback listening data if Supabase is not available
const FALLBACK_LISTENING: ListeningWithProgress[] = [
    { 
        id: 1, 
        type: 'listening', 
        english: 'Listen and choose the correct answer', 
        russian: 'Слушайте и выберите правильный ответ',
        greek: 'Γεια σου', 
        example_en: 'Hello', 
        example_gr: 'Thank you', 
        audio_url: null, 
        created_at: new Date().toISOString(), 
        student_progress: [],
        options: ['Hello', 'Thank you', 'Goodbye'],
        correct_answer: 0
    },
    { 
        id: 2, 
        type: 'listening', 
        english: 'Listen and choose the correct answer', 
        russian: 'Слушайте и выберите правильный ответ',
        greek: 'Ευχαριστώ', 
        example_en: 'Hello', 
        example_gr: 'Thank you', 
        audio_url: null, 
        created_at: new Date().toISOString(), 
        student_progress: [],
        options: ['Hello', 'Thank you', 'Please'],
        correct_answer: 1
    }
];

export default function ListeningDialog({ isOpen, onClose, mode = 'review' }: ListeningDialogProps) {
    const { user } = useAuth();
    const { t, locale } = useTranslation();
    const { evaluate } = usePerformanceEvaluation();
    const [listening, setListening] = useState<ListeningWithProgress[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState({ hard: 0, good: 0, easy: 0 });
    const [correct, setCorrect] = useState(0);
    const [total, setTotal] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [perfMessage, setPerfMessage] = useState<string | null>(null);
    
    const STUDENT_ID = user?.id || '';

    useEffect(() => {
        if (isOpen) {
            fetchListening();
            setShowSummary(false);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    }, [isOpen, mode, user?.id]);

    useEffect(() => {
        // Reset when changing cards
        setSelectedAnswer(null);
        setShowResult(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [currentIndex]);

    const playAudio = () => {
        const currentItem = listening[currentIndex];
        if (!currentItem || !currentItem.audio_url) return;
        
        if (audioRef.current) {
            audioRef.current.src = currentItem.audio_url;
            audioRef.current.play().catch(err => {
                console.error('Error playing audio:', err);
            });
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case 'a':
                case 'A':
                    e.preventDefault();
                    playAudio();
                    break;
                case '1':
                    e.preventDefault();
                    if (!showResult && selectedAnswer === null) {
                        handleAnswerSelect(0);
                    }
                    break;
                case '2':
                    e.preventDefault();
                    if (!showResult && selectedAnswer === null) {
                        handleAnswerSelect(1);
                    }
                    break;
                case '3':
                    e.preventDefault();
                    if (!showResult && selectedAnswer === null) {
                        handleAnswerSelect(2);
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (showResult) {
                        handleNext();
                    }
                    break;
                case 'Escape':
                case 'Esc':
                    e.preventDefault();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, currentIndex, listening.length, selectedAnswer, showResult]);

    const fetchListening = async () => {
        setLoading(true);
        console.log(`🔄 Fetching listening for mode: ${mode}, student: ${STUDENT_ID || 'demo'}, level: ${user?.level || 'A1'}, difficulty: ${user?.difficulty || 'easy'}`);

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database query timeout')), 10000)
            );

            let data: any = null;
            let error: any = null;

            // Strategy 1: RPC mit Level+Difficulty Filterung (bevorzugt)
            if (STUDENT_ID && STUDENT_ID !== 'admin-local') {
                try {
                    const rpcResult = await Promise.race([
                        supabase.rpc('get_learning_items_for_student', {
                            p_student_id: STUDENT_ID,
                            p_type: 'listening',
                            p_limit: 100
                        }),
                        timeoutPromise
                    ]) as any;

                    if (!rpcResult.error && rpcResult.data && Array.isArray(rpcResult.data) && rpcResult.data.length > 0) {
                        // RPC liefert flache Daten – student_progress Felder direkt am Item
                        data = rpcResult.data.map((item: any) => ({
                            ...item,
                            student_progress: item.attempts != null ? [{
                                student_id: STUDENT_ID,
                                item_id: item.id,
                                correct_count: item.correct_count || 0,
                                attempts: item.attempts || 0,
                                ease_factor: item.ease_factor || 2.5,
                                interval_days: item.interval_days || 1,
                                next_review: item.next_review,
                                last_attempt: item.last_attempt
                            }] : []
                        }));
                        console.log(`✅ RPC: ${data.length} listening items fuer Level ${user?.level || '?'}-${user?.difficulty || '?'}`);
                    } else {
                        console.log('⚠️ RPC returned no data or error, falling back to direct query');
                    }
                } catch (rpcErr) {
                    console.log('⚠️ RPC not available, falling back to direct query');
                }
            }

            // Strategy 2: Fallback – direkte Query (alle Items, keine Level-Filterung)
            if (!data) {
                const queryPromise = supabase
                    .from('learning_items')
                    .select(`
                        *,
                        student_progress!left(*)
                    `)
                    .eq('type', 'listening')
                    .order('created_at', { ascending: false })
                    .limit(100);

                const result = await Promise.race([queryPromise, timeoutPromise]) as any;
                data = result.data;
                error = result.error;
            }

            if (error) {
                console.error("❌ Error fetching listening:", error);
                
                if (error.code === '42P01' || error.message?.includes('does not exist') || 
                    error.message?.includes('Invalid API key') || error.message?.includes('401')) {
                    console.error("⚠️ Supabase error. Using fallback listening data.");
                    const filtered = filterListeningByMode(FALLBACK_LISTENING, mode);
                    setListening(filtered);
                    setLoading(false);
                    return;
                }
                
                console.warn("⚠️ Error accessing Supabase. Using fallback listening data.");
                const filtered = filterListeningByMode(FALLBACK_LISTENING, mode);
                setListening(filtered);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                const processedData = data.map((item: any) => {
                    // Parse options from example_en (stored as JSON string)
                    let options: string[] = [];
                    let correctAnswer = 0;
                    
                    try {
                        if (item.example_en) {
                            const parsed = JSON.parse(item.example_en);
                            if (Array.isArray(parsed.options)) {
                                options = parsed.options;
                            }
                            if (typeof parsed.correct === 'number') {
                                correctAnswer = parsed.correct;
                            }
                        }
                    } catch (e) {
                        // Fallback: use example_en, example_gr, and greek as options
                        options = [
                            item.example_en || item.greek,
                            item.example_gr || item.english,
                            item.greek
                        ];
                        // Assume greek is the correct answer
                        correctAnswer = 2;
                    }
                    
                    return {
                        ...item,
                        student_progress: STUDENT_ID 
                            ? (item.student_progress?.filter(
                                (p: any) => p?.student_id === STUDENT_ID
                            ) || [])
                            : [],
                        options: options.length === 3 ? options : [
                            item.example_en || 'Option 1',
                            item.example_gr || 'Option 2',
                            item.greek || 'Option 3'
                        ],
                        correct_answer: correctAnswer
                    };
                }) as ListeningWithProgress[];
                
                const filtered = filterListeningByMode(processedData, mode);
                console.log(`✅ Loaded ${filtered.length} listening cards for mode: ${mode} (from ${data.length} total items)`);
                setListening(filtered);
            } else {
                console.log("⚠️ No listening items found in database");
                console.log("💡 Using fallback listening data");
                const filtered = filterListeningByMode(FALLBACK_LISTENING, mode);
                setListening(filtered);
            }
        } catch (err: any) {
            console.error("❌ Fetch error:", err);
            if (err.message === 'Database query timeout') {
                console.error("⏱️ Database query timed out after 10 seconds");
            }
            console.log("💡 Using fallback listening data due to error");
            const filtered = filterListeningByMode(FALLBACK_LISTENING, mode);
            setListening(filtered);
        } finally {
            setLoading(false);
            console.log(`✅ Loading complete for mode: ${mode}`);
        }
    };

    const filterListeningByMode = (items: ListeningWithProgress[], filterMode: string): ListeningWithProgress[] => {
        const today = new Date().toISOString().split('T')[0];
        
        switch (filterMode) {
            case 'weak':
                // Filter items where user got wrong answers
                const weakCards = items
                    .filter(item => {
                        const progress = item.student_progress?.[0];
                        if (!progress) return true; // New items are considered weak
                        const attempts = progress.attempts || 0;
                        const correct = progress.correct_count || 0;
                        return attempts > 0 && correct < attempts; // Has wrong answers
                    })
                    .sort((a, b) => {
                        const progressA = a.student_progress?.[0];
                        const progressB = b.student_progress?.[0];
                        const wrongA = (progressA?.attempts || 0) - (progressA?.correct_count || 0);
                        const wrongB = (progressB?.attempts || 0) - (progressB?.correct_count || 0);
                        return wrongB - wrongA; // Most wrong answers first
                    });
                
                if (weakCards.length === 0 && items.length > 0) {
                    return items;
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
                return items;
        }
    };

    const handleAnswerSelect = async (answerIndex: number) => {
        if (selectedAnswer !== null || showResult) return;
        
        const currentItem = listening[currentIndex];
        if (!currentItem) return;
        
        setSelectedAnswer(answerIndex);
        const correct = answerIndex === (currentItem.correct_answer ?? 0);
        setIsCorrect(correct);
        setShowResult(true);
        
        setTotal(prev => prev + 1);
        if (correct) {
            setCorrect(prev => prev + 1);
            setRatings(prev => ({ ...prev, easy: prev.easy + 1 }));
        } else {
            setRatings(prev => ({ ...prev, hard: prev.hard + 1 }));
        }

        // Save progress
        const existingProgress = currentItem.student_progress?.[0];
        const progress: StudentProgress = existingProgress || {
            id: 0,
            student_id: STUDENT_ID,
            item_id: currentItem.id,
            interval_days: 1.0,
            ease_factor: 2.5,
            attempts: 0,
            correct_count: 0,
            last_attempt: null,
            next_review: null
        };

        let newInterval = progress.interval_days;
        let newEase = progress.ease_factor;

        if (correct) {
            newInterval = Math.max(1, Math.round(progress.interval_days * 2.5));
            newEase = Math.min(3.0, progress.ease_factor + 0.05);
        } else {
            // Wrong answer - schedule for review soon
            newInterval = 1;
            newEase = Math.max(1.3, progress.ease_factor - 0.15);
        }

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        try {
            const { error } = await supabase
                .from('student_progress')
                .upsert({
                    item_id: currentItem.id,
                    student_id: STUDENT_ID,
                    attempts: progress.attempts + 1,
                    correct_count: correct ? progress.correct_count + 1 : progress.correct_count,
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
                console.log(`✅ Progress saved: ${currentItem.english} → ${correct ? 'correct' : 'wrong'}`);
                
                // Update local state
                const updatedListening = [...listening];
                const updatedProgress: StudentProgress = {
                    id: existingProgress?.id || 0,
                    student_id: STUDENT_ID,
                    item_id: currentItem.id,
                    attempts: progress.attempts + 1,
                    correct_count: correct ? progress.correct_count + 1 : progress.correct_count,
                    last_attempt: new Date().toISOString(),
                    next_review: nextReview.toISOString(),
                    interval_days: newInterval,
                    ease_factor: newEase
                };
                updatedListening[currentIndex] = {
                    ...currentItem,
                    student_progress: [updatedProgress]
                };
                setListening(updatedListening);
            }
        } catch (err) {
            console.error("❌ Failed to update progress:", err);
        }

        // Auto-advance after 2 seconds if correct, or wait for manual next
        if (correct && currentIndex < listening.length - 1) {
            setTimeout(() => {
                handleNext();
            }, 2000);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < listening.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setTimeout(async () => {
                setShowSummary(true);
                const result = await evaluate();
                if (result?.changed && result.message) {
                    setPerfMessage(result.message);
                }
            }, 500);
        }
    };

    const handleRestart = async () => {
        console.log('🔄 Restarting listening session...');
        setCurrentIndex(0);
        setRatings({ hard: 0, good: 0, easy: 0 });
        setCorrect(0);
        setTotal(0);
        setShowSummary(false);
        setSelectedAnswer(null);
        setShowResult(false);
        setPerfMessage(null);
        await fetchListening();
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
        setSelectedAnswer(null);
        setShowResult(false);
        setPerfMessage(null);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    if (loading) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact">
                    <div style={{ textAlign: 'center', padding: '60px', color: '#fff' }}>
                        <h2>👂 {t('vocab.loading')}</h2>
                        <p style={{ color: '#8E8E93', marginTop: '12px', fontSize: '14px' }}>
                            {t('listening.loading_subtitle')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (listening.length === 0 && !user?.id) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ {t('vocab.login_required')}</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        {t('listening.login_required_msg')}
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    if (!loading && listening.length === 0) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>👂 {t('listening.no_items')}</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '20px' }}>
                        {t('listening.no_items_msg')}
                    </p>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '30px' }}>
                        💡 <strong>Tip:</strong> {t('listening.no_items_tip')}
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    const currentItem = listening[currentIndex];
    if (!currentItem) {
        return (
            <div className="vocabulary-dialog-overlay">
                <div className="vocabulary-dialog compact" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ {t('vocab.error')}</h2>
                    <p style={{ color: '#8E8E93', marginBottom: '30px' }}>
                        {t('listening.error_msg')}
                    </p>
                    <button className="btn-primary" onClick={() => handleClose(false)} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px' }}>
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    const progressPercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const options = currentItem.options || ['Option 1', 'Option 2', 'Option 3'];
    const correctAnswerIndex = currentItem.correct_answer ?? 0;

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
                    }}>{t('shared.session_complete')}</h2>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        marginBottom: 'calc(var(--spacing-xl) * 0.75)',
                        fontSize: '1rem',
                        letterSpacing: '-0.1px'
                    }}>
                        {correct} {t('shared.correct').toLowerCase()} / {total - correct} {t('shared.wrong').toLowerCase()} ({progressPercent} %)
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
                            }}>{t('shared.correct')}</span>
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
                            }}>{t('shared.wrong')}</span>
                        </div>
                    </div>

                    {perfMessage && (
                        <div style={{
                            background: 'rgba(52, 199, 89, 0.1)',
                            border: '1px solid rgba(52, 199, 89, 0.25)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 16px',
                            marginBottom: '12px',
                            fontSize: '0.8rem',
                            color: '#34C759',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>🎯</span>
                            {perfMessage}
                        </div>
                    )}

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
                        {t('shared.back_to_dashboard')}
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
                            ✅ {t('shared.progress_saved')}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const getModeConfig = () => {
        switch (mode) {
            case 'weak':
                return { title: '💪 ' + t('listening.mode.weak_title'), subtitle: t('listening.mode.weak_subtitle') };
            case 'due':
                return { title: '📚 ' + t('listening.mode.due_title'), subtitle: t('listening.mode.due_subtitle') };
            case 'review':
            default:
                return { title: '👂 ' + t('listening.mode.review_title'), subtitle: t('listening.mode.review_subtitle') };
        }
    };

    const modeConfig = getModeConfig();

    return (
        <div className="vocabulary-dialog-overlay">
            <div className="vocabulary-dialog daily-phrases-layout" onClick={(e) => e.stopPropagation()}>
                <audio ref={audioRef} preload="auto" />
                
                <div className="mode-header">
                    <div className="mode-header-frame">
                        <h1>{modeConfig.title}</h1>
                        <p>{modeConfig.subtitle}</p>
                    </div>
                </div>

                <div className="progress-wrapper">
                    <div className="progress-info">
                        <div className="progress-text">
                            <span>{currentIndex + 1}</span> / <span>{listening.length}</span>
                        </div>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>

                <div className="main-card-area">
                    {/* Audio Player Card */}
                    <div className="phrase-card" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--spacing-lg) * 0.7)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'calc(var(--spacing-md) * 0.7)' }}>🎧</div>
                        <button 
                            className="action-btn audio-btn" 
                            onClick={playAudio}
                            style={{
                                padding: 'calc(16px * 1.33) 32px',
                                fontSize: '1rem',
                                fontWeight: 600
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                            {t('listening.play_audio')}
                        </button>
                        {!currentItem.audio_url && (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                                {t('listening.no_audio')}
                            </p>
                        )}
                    </div>

                    {/* Multiple Choice Options */}
                    <div className="button-bar" style={{ flexDirection: 'column', gap: 'calc(var(--spacing-md) * 0.7)' }}>
                        <div style={{ 
                            width: '100%', 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(3, 1fr)', 
                            gap: 'calc(var(--spacing-md) * 0.7)' 
                        }}>
                            {options.map((option, index) => {
                                const isSelected = selectedAnswer === index;
                                const isCorrectOption = index === correctAnswerIndex;
                                const showCorrect = showResult && isCorrectOption;
                                const showWrong = showResult && isSelected && !isCorrectOption;
                                
                                return (
                                    <button
                                        key={index}
                                        className={`rating-btn ${showCorrect ? 'rating-easy' : showWrong ? 'rating-hard' : ''}`}
                                        onClick={() => handleAnswerSelect(index)}
                                        disabled={showResult}
                                        style={{
                                            padding: 'calc(16px * 1.33) 20px',
                                            fontSize: '0.9375rem',
                                            fontWeight: 600,
                                            cursor: showResult ? 'default' : 'pointer',
                                            opacity: showResult && !isSelected && !isCorrectOption ? 0.5 : 1,
                                            background: showCorrect 
                                                ? 'var(--btn-easy)' 
                                                : showWrong 
                                                    ? 'var(--btn-hard)' 
                                                    : 'rgba(44, 44, 46, 0.6)',
                                            color: showCorrect 
                                                ? 'var(--btn-easy-text)' 
                                                : showWrong 
                                                    ? 'var(--btn-hard-text)' 
                                                    : 'var(--text-primary)',
                                            borderColor: showCorrect 
                                                ? 'rgba(52, 199, 89, 0.3)' 
                                                : showWrong 
                                                    ? 'rgba(239, 68, 68, 0.3)' 
                                                    : 'var(--border-soft)',
                                            transform: showResult && (showCorrect || showWrong) ? 'scale(1.05)' : 'scale(1)',
                                            transition: 'all 0.3s var(--transition-smooth)'
                                        }}
                                    >
                                        {showCorrect && '✓ '}
                                        {showWrong && '✗ '}
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {showResult && (
                            <div style={{
                                textAlign: 'center',
                                padding: 'calc(var(--spacing-md) * 0.7)',
                                borderRadius: 'var(--radius-md)',
                                background: isCorrect ? 'rgba(52, 199, 89, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isCorrect ? 'var(--btn-easy-text)' : 'var(--btn-hard-text)',
                                fontWeight: 600,
                                fontSize: '0.9375rem'
                            }}>
                                {isCorrect ? '✓ ' + t('listening.correct_answer') : '✗ ' + t('listening.wrong_answer', { answer: options[correctAnswerIndex] })}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="button-bar">
                        <div style={{ flex: 1 }}></div>
                        <div className="action-group">
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
                            {showResult && currentIndex < listening.length - 1 && (
                                <button 
                                    className="action-btn audio-btn"
                                    onClick={handleNext}
                                    style={{ marginLeft: 'calc(var(--spacing-sm) * 0.7)' }}
                                >
                                    {t('listening.next')} →
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {showToast && (
                    <div className="save-toast">
                        ✅ {t('shared.result_saved')}
                    </div>
                )}
            </div>
        </div>
    );
}
