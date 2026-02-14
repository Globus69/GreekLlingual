"use client";

import { useCallback, useRef } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';

/**
 * Performance-Evaluation Result from Supabase RPC
 */
interface EvaluationResult {
    evaluated: boolean;
    correct_rate: number;
    total_attempts: number;
    min_required?: number;
    changed: boolean;
    old_level?: string;
    new_level?: string;
    old_difficulty?: string;
    new_difficulty?: string;
    old_index?: string;
    new_index?: string;
    reason?: string;
    message: string;
    error?: string;
}

/**
 * usePerformanceEvaluation Hook
 *
 * Wird nach jeder Lernsession aufgerufen, um die Leistungsstufe
 * des Schuelers automatisch anzupassen.
 *
 * Regeln:
 *   - Korrektquote > 80% ueber 50+ Karten → Schwierigkeit erhoehen
 *   - Korrektquote < 40% ueber 50+ Karten → Schwierigkeit senken
 *   - Bei hard → naechstes Level (A1→A2→B1→B2)
 *   - Bei easy → vorheriges Level (B2→B1→A2→A1)
 *
 * Gibt evaluate() Funktion zurueck + letztes Ergebnis
 */
export function usePerformanceEvaluation() {
    const { user } = useAuth();
    const lastResultRef = useRef<EvaluationResult | null>(null);

    /**
     * Evaluate the student's performance and auto-adjust difficulty.
     * Should be called after each learning session completes.
     *
     * @param minAttempts - Minimum attempts required before evaluation (default: 50)
     * @returns EvaluationResult or null if evaluation was skipped
     */
    const evaluate = useCallback(async (minAttempts: number = 50): Promise<EvaluationResult | null> => {
        // Nur fuer eingeloggte Studenten evaluieren
        if (!user?.id || user.role === 'admin' || user.id === 'admin-local') {
            return null;
        }

        try {
            const { data, error } = await supabase.rpc('evaluate_student_performance', {
                p_student_id: user.id,
                p_min_attempts: minAttempts,
            });

            if (error) {
                console.warn('⚠️ Performance evaluation RPC not available:', error.message);
                return null;
            }

            const result = data as EvaluationResult;
            lastResultRef.current = result;

            if (result.evaluated) {
                if (result.changed) {
                    console.log(`🎯 Performance adjusted: ${result.old_index} → ${result.new_index} (${result.correct_rate}% correct over ${result.total_attempts} attempts)`);
                } else {
                    console.log(`📊 Performance evaluated: ${result.correct_rate}% correct over ${result.total_attempts} attempts – no change needed`);
                }
            } else {
                console.log(`📊 Not enough data for evaluation: ${result.total_attempts}/${result.min_required || minAttempts} attempts`);
            }

            return result;
        } catch (err) {
            console.warn('⚠️ Performance evaluation failed:', err);
            return null;
        }
    }, [user]);

    return { evaluate, lastResult: lastResultRef.current };
}
