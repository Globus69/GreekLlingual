"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/AuthContext';
import Flashcard from '@/components/learning/Flashcard';
import { calculateSM2, getNextDueDate } from '@/lib/srt/sm2';
import '@/styles/liquid-glass.css';

interface Vocab {
    id: string;
    term: string;
    translation: string;
    example_sentence_term: string;
    example_sentence_translation: string;
    repetition_count: number;
    ease_factor: number;
    current_interval: number;
}

export default function VokabelnPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [vocabs, setVocabs] = useState<Vocab[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchDueVocabs();
        }
    }, [user, authLoading, router]);

    const fetchDueVocabs = async () => {
        setLoading(true);
        try {
            // First, try to fetch due vocabs
            const { data, error } = await supabase
                .from('vocabs')
                .select('*')
                .lte('due_date', new Date().toISOString())
                .limit(10);

            if (error) throw error;

            if (data && data.length > 0) {
                setVocabs(data);
            } else {
                // If no due vocabs, fetch some new ones (or random for now)
                const { data: newData, error: newError } = await supabase
                    .from('vocabs')
                    .select('*')
                    .limit(5);

                if (newError) throw newError;
                setVocabs(newData || []);
            }
        } catch (err) {
            console.error("Error fetching vocabs:", err);
            // Fallback for demo purposes if DB is empty
            setVocabs([
                {
                    id: '1',
                    term: 'Hello',
                    translation: 'Γεια σου',
                    example_sentence_term: 'Hello friend',
                    example_sentence_translation: 'Γεια σου φίλε',
                    repetition_count: 0,
                    ease_factor: 2.5,
                    current_interval: 0
                },
                {
                    id: '2',
                    term: 'Thank you',
                    translation: 'Ευχαριστώ',
                    example_sentence_term: 'Thank you very much',
                    example_sentence_translation: 'Ευχαριστώ πολύ',
                    repetition_count: 0,
                    ease_factor: 2.5,
                    current_interval: 0
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleScore = async (quality: number) => {
        const currentVocab = vocabs[currentIndex];

        // Calculate new SRT values
        const { interval, repetitionCount, easeFactor } = calculateSM2(
            quality,
            currentVocab.repetition_count,
            currentVocab.ease_factor,
            currentVocab.current_interval
        );

        const nextDueDate = getNextDueDate(interval);

        // Update Supabase
        try {
            const { error } = await supabase
                .from('vocabs')
                .update({
                    repetition_count: repetitionCount,
                    ease_factor: easeFactor,
                    current_interval: interval,
                    due_date: nextDueDate.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentVocab.id);

            if (error) console.error("Update error:", error);
        } catch (err) {
            console.error("Failed to update SRT data:", err);
        }

        // Move to next card
        if (currentIndex < vocabs.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setFinished(true);
        }
    };

    if (authLoading || loading) {
        return <div className="login-overlay"><h1 style={{ color: 'white' }}>🏛️ Preparing Lesson...</h1></div>;
    }

    if (finished || vocabs.length === 0) {
        return (
            <div className="login-overlay" style={{ flexDirection: 'column', gap: '20px' }}>
                <h1 style={{ color: 'white' }}>🎉 Lesson Complete!</h1>
                <p style={{ color: '#8E8E93' }}>You've finished all your scheduled reviews for now.</p>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
            </div>
        );
    }

    const currentVocab = vocabs[currentIndex];

    return (
        <div className="dashboard-layout">
            <header>
                <button className="back-btn" onClick={() => router.push('/dashboard')}>← Dashboard</button>
                <div style={{ fontWeight: 600 }}>Vocabulary Session</div>
                <div className="progress-container">
                    {currentIndex + 1} / {vocabs.length}
                </div>
            </header>

            <main className="dashboard-content">
                <Flashcard
                    term={currentVocab.term}
                    translation={currentVocab.translation}
                    exampleTerm={currentVocab.example_sentence_term}
                    exampleTranslation={currentVocab.example_sentence_translation}
                    onScore={handleScore}
                />
            </main>
        </div>
    );
}
