"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { supabase } from '@/db/supabase';
import '@/styles/liquid-glass.css';

// TypeScript Interfaces
interface DailyPhrase {
    id: string;
    phrase_greek: string;
    phrase_english: string;
    phrase_russian?: string;
    category: 'greeting' | 'shopping' | 'restaurant' | 'travel' | 'general';
    difficulty: 'easy' | 'medium' | 'hard';
    audio_url?: string;
}

interface DailyPhrasesDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DailyPhrasesDialog({ isOpen, onClose }: DailyPhrasesDialogProps) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [phrases, setPhrases] = useState<DailyPhrase[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState<{ hard: number; good: number; easy: number }>({
        hard: 0,
        good: 0,
        easy: 0,
    });

    // Load phrases on mount
    useEffect(() => {
        if (isOpen) {
            loadDailyPhrases();
        }
    }, [isOpen]);

    const loadDailyPhrases = async () => {
        setLoading(true);
        try {
            // TODO: Replace with RPC call when backend is ready
            // For now, use mock data
            const mockPhrases: DailyPhrase[] = [
                {
                    id: '1',
                    phrase_greek: 'Καλημέρα',
                    phrase_english: 'Good morning',
                    phrase_russian: 'Доброе утро',
                    category: 'greeting',
                    difficulty: 'easy',
                },
                {
                    id: '2',
                    phrase_greek: 'Ευχαριστώ πολύ',
                    phrase_english: 'Thank you very much',
                    phrase_russian: 'Большое спасибо',
                    category: 'general',
                    difficulty: 'easy',
                },
                {
                    id: '3',
                    phrase_greek: 'Πόσο κοστίζει αυτό;',
                    phrase_english: 'How much does this cost?',
                    phrase_russian: 'Сколько это стоит?',
                    category: 'shopping',
                    difficulty: 'medium',
                },
            ];

            setPhrases(mockPhrases);
        } catch (error) {
            console.error('Error loading daily phrases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRating = (rating: 'hard' | 'good' | 'easy') => {
        // Update ratings count
        setRatings((prev) => ({
            ...prev,
            [rating]: prev[rating] + 1,
        }));

        // TODO: Save to backend when ready
        // await supabase.rpc('save_phrase_rating', {
        //     p_user_id: user?.id,
        //     p_phrase_id: currentPhrase.id,
        //     p_rating: rating
        // });

        // Move to next phrase
        if (currentIndex < phrases.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            // Session complete - show summary or close
            onClose();
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setRatings({ hard: 0, good: 0, easy: 0 });
    };

    const playAudio = async () => {
        const currentPhrase = phrases[currentIndex];
        if (!currentPhrase) return;

        // Use Web Speech API for TTS
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentPhrase.phrase_greek);
            utterance.lang = 'el-GR'; // Greek
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    if (!isOpen) return null;

    const currentPhrase = phrases[currentIndex];
    const progress = phrases.length > 0 ? ((currentIndex + 1) / phrases.length) * 100 : 0;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: 'rgba(28, 28, 32, 0.95)',
                    backdropFilter: 'blur(40px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
                    padding: '32px',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
                        💬 Daily Phrases
                    </h2>
                    <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0 }}>
                        Practice daily phrases in Greek
                    </p>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#8E8E93' }}>
                            {currentIndex + 1} / {phrases.length}
                        </span>
                        <span style={{ fontSize: '14px', color: '#8E8E93' }}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div
                        style={{
                            width: '100%',
                            height: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #007AFF, #00C7FF)',
                                transition: 'width 0.3s ease',
                            }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#8E8E93' }}>
                        Loading phrases...
                    </div>
                ) : currentPhrase ? (
                    <>
                        {/* Phrase Card */}
                        <div
                            style={{
                                background: 'rgba(44, 44, 46, 0.8)',
                                borderRadius: '16px',
                                padding: '32px',
                                marginBottom: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            {/* Greek Phrase */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    ΕΛΛΗΝΙΚΑ
                                </div>
                                <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                                    {currentPhrase.phrase_greek}
                                </h3>
                            </div>

                            {/* English Translation */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    ENGLISH
                                </div>
                                <p style={{ fontSize: '18px', color: '#E5E5E7', margin: 0 }}>
                                    {currentPhrase.phrase_english}
                                </p>
                            </div>
                        </div>

                        {/* Button Bar */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {/* Rating Buttons */}
                            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                <button
                                    onClick={() => handleRating('hard')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Hard
                                </button>
                                <button
                                    onClick={() => handleRating('good')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 204, 0, 0.15)',
                                        border: '1px solid rgba(255, 204, 0, 0.3)',
                                        color: '#ffcc00',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Good
                                </button>
                                <button
                                    onClick={() => handleRating('easy')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'rgba(52, 199, 89, 0.15)',
                                        border: '1px solid rgba(52, 199, 89, 0.3)',
                                        color: '#34c759',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Easy
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={playAudio}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(0, 122, 255, 0.15)',
                                        border: '1px solid rgba(0, 122, 255, 0.3)',
                                        color: '#007AFF',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                    title="Play audio"
                                >
                                    🔊
                                </button>
                                <button
                                    onClick={handleRestart}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 159, 10, 0.15)',
                                        border: '1px solid rgba(255, 159, 10, 0.3)',
                                        color: '#FF9F0A',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    title="Restart"
                                >
                                    ↻
                                </button>
                                <button
                                    onClick={onClose}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 59, 48, 0.15)',
                                        border: '1px solid rgba(255, 59, 48, 0.3)',
                                        color: '#FF3B30',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    title="Cancel"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#8E8E93' }}>
                        No phrases available
                    </div>
                )}
            </div>
        </div>
    );
}
