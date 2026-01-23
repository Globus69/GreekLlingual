"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

// Fallback vocabulary data if Supabase is not available
const FALLBACK_VOCABULARY: VocabWithProgress[] = [
    { id: 1, type: 'vocabulary', english: 'Hello', greek: 'Γεια σου', example_en: 'Hello friend', example_gr: 'Γεια σου φίλε', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 2, type: 'vocabulary', english: 'Thank you', greek: 'Ευχαριστώ', example_en: 'Thank you very much', example_gr: 'Ευχαριστώ πολύ', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 3, type: 'vocabulary', english: 'Please', greek: 'Παρακαλώ', example_en: 'Please help me', example_gr: 'Παρακαλώ βοήθησέ με', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 4, type: 'vocabulary', english: 'Yes', greek: 'Ναι', example_en: 'Yes, I agree', example_gr: 'Ναι, συμφωνώ', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 5, type: 'vocabulary', english: 'No', greek: 'Όχι', example_en: 'No, thank you', example_gr: 'Όχι, ευχαριστώ', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 6, type: 'vocabulary', english: 'Water', greek: 'Νερό', example_en: 'I want water', example_gr: 'Θέλω νερό', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 7, type: 'vocabulary', english: 'Coffee', greek: 'Καφές', example_en: 'Drink coffee', example_gr: 'Πίνω καφέ', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 8, type: 'vocabulary', english: 'Friend', greek: 'Φίλος', example_en: 'Best friend', example_gr: 'Καλύτερος φίλος', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 9, type: 'vocabulary', english: 'Good morning', greek: 'Καλημέρα', example_en: 'Good morning!', example_gr: 'Καλημέρα!', audio_url: null, created_at: new Date().toISOString(), student_progress: [] },
    { id: 10, type: 'vocabulary', english: 'Goodbye', greek: 'Αντίο', example_en: 'Goodbye for now', example_gr: 'Αντίο προς το παρόν', audio_url: null, created_at: new Date().toISOString(), student_progress: [] }
];

export default function VokabelnPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [vocabulary, setVocabulary] = useState<VocabWithProgress[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);
    const [totalDue, setTotalDue] = useState(0);
    
    const STUDENT_ID = user?.id || '';

    useEffect(() => {
        // DEVELOPMENT MODE: Allow fetching vocabulary even without real user
        // The AuthContext will provide a demo user if no real user exists
        fetchVocabulary();
    }, [user?.id]);

    const fetchVocabulary = async () => {
        if (!STUDENT_ID) {
            console.error("❌ No student ID available");
            setVocabulary([]);
            setLoading(false);
            return;
        }

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
                console.error("❌ Error fetching vocabs:", error);
                console.error("Error details:", JSON.stringify(error, null, 2));
                
                // If table doesn't exist or API key invalid, use fallback
                if (error.code === '42P01' || error.message?.includes('does not exist') || 
                    error.message?.includes('Invalid API key') || error.message?.includes('401')) {
                    console.error("⚠️ Supabase error. Using fallback vocabulary data.");
                    console.log(`💡 Loaded ${FALLBACK_VOCABULARY.length} fallback vocabulary items`);
                    setVocabulary(FALLBACK_VOCABULARY);
                    setTotalDue(FALLBACK_VOCABULARY.length);
                } else {
                    // For other errors, try fallback
                    console.warn("⚠️ Error accessing Supabase. Using fallback vocabulary data.");
                    setVocabulary(FALLBACK_VOCABULARY);
                    setTotalDue(FALLBACK_VOCABULARY.length);
                }
            } else if (data && data.length > 0) {
                // Filter student_progress to only include entries for current student
                const processedData = data.map((item: any) => ({
                    ...item,
                    student_progress: item.student_progress?.filter(
                        (p: any) => p?.student_id === STUDENT_ID
                    ) || []
                })) as VocabWithProgress[];
                
                setVocabulary(processedData);
                setTotalDue(processedData.length);
            } else {
                console.log("⚠️ No vocabulary items found in database");
                console.log("💡 Using fallback vocabulary data");
                setVocabulary(FALLBACK_VOCABULARY);
                setTotalDue(FALLBACK_VOCABULARY.length);
            }
        } catch (err) {
            console.error("❌ Fetch error:", err);
            console.log("💡 Using fallback vocabulary data due to error");
            setVocabulary(FALLBACK_VOCABULARY);
            setTotalDue(FALLBACK_VOCABULARY.length);
        } finally {
            setLoading(false);
        }
    };

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

        if (quality === 1) {
            newInterval = 1;
        } else {
            newInterval = Math.round(progress.interval_days * quality);
            if (quality > 2.5) newEase += 0.1;
        }

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

        if (currentIndex < vocabulary.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setFinished(true);
        }
    };

    if (loading) {
        return (
            <div className="login-overlay">
                <h1 style={{ color: 'white' }}>🏛️ Loading Vocabulary...</h1>
            </div>
        );
    }

    if (finished || vocabulary.length === 0) {
        return (
            <div className="login-overlay" style={{ flexDirection: 'column', gap: '20px' }}>
                <h1 style={{ color: 'white' }}>🎉 Session Complete!</h1>
                <p style={{ color: '#8E8E93', fontSize: '16px' }}>
                    {vocabulary.length === 0
                        ? "No vocabulary items available. Please add some to the database."
                        : `You've reviewed ${vocabulary.length} cards today!`
                    }
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => router.push('/dashboard')}
                    style={{ padding: '14px 32px', fontSize: '16px' }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const currentVocab = vocabulary[currentIndex];

    return (
        <div id="app" className="dashboard-layout">
            <header className="app-header" style={{ padding: '20px 60px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    className="back-btn"
                    onClick={() => router.push('/dashboard')}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#007AFF', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}
                >
                    ← Dashboard
                </button>
                <div style={{ fontWeight: 600, fontSize: '18px', color: '#fff' }}>Vocabulary Flashcards</div>
                <div className="progress-container" style={{ background: '#1C1C1E', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#8E8E93' }}>
                    {currentIndex + 1} / {vocabulary.length} {totalDue > 0 && `(${totalDue} due)`}
                </div>
            </header>

            <main className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, overflow: 'hidden' }}>
                <Flashcard
                    term={currentVocab.english}
                    translation={currentVocab.greek}
                    exampleTerm={currentVocab.example_en || ''}
                    exampleTranslation={currentVocab.example_gr || ''}
                    onScore={handleScore}
                />
            </main>
        </div>
    );
}
