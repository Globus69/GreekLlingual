/**
 * FSRS-6 Scheduler - Core Algorithm Implementation
 * 
 * This class implements the Free Spaced Repetition Scheduler algorithm (Version 6).
 * It calculates optimal review intervals based on card difficulty, stability, and user ratings.
 * 
 * Usage:
 * ```typescript
 * const scheduler = new FSRSScheduler();
 * const newCard = scheduler.createNewCard('card-123');
 * const updatedCard = scheduler.rate(newCard, 3, new Date()); // Rating: Good
 * const interval = scheduler.calculateInterval(updatedCard.stability);
 * ```
 * 
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki
 */

import type { Card, Rating, State, SchedulingInfo, FSRSParameters } from './fsrs-types';
import {
    FSRS_PARAMETERS,
    DESIRED_RETENTION,
    MAXIMUM_INTERVAL,
    MINIMUM_INTERVAL,
    MIN_DIFFICULTY,
    MAX_DIFFICULTY,
    MIN_STABILITY,
    FUZZ_FACTOR
} from './fsrs-constants';

export class FSRSScheduler {
    private w: number[];
    private desiredRetention: number;
    private maximumInterval: number;

    /**
     * Creates a new FSRS scheduler instance
     * @param params Optional custom parameters (defaults to FSRS_PARAMETERS)
     */
    constructor(params?: Partial<FSRSParameters>) {
        this.w = params?.w || FSRS_PARAMETERS;
        this.desiredRetention = params?.desiredRetention || DESIRED_RETENTION;
        this.maximumInterval = params?.maximumInterval || MAXIMUM_INTERVAL;

        // Validate parameters
        if (this.w.length !== 21) {
            throw new Error('FSRS parameters must contain exactly 21 values');
        }
        if (this.desiredRetention < 0.7 || this.desiredRetention > 0.99) {
            throw new Error('Desired retention must be between 0.7 and 0.99');
        }
    }

    /**
     * Creates a new card with initial FSRS values
     * @param id Unique card identifier
     * @returns New card with default FSRS parameters
     */
    createNewCard(id: string): Card {
        return {
            id,
            difficulty: this.w[4], // Initial difficulty (≈ 6.4)
            stability: this.w[0],   // Initial stability for new cards (≈ 0.212 days)
            due: new Date(),        // Due immediately
            reps: 0,
            lapses: 0,
            state: 'new',
            lastReview: null
        };
    }

    /**
     * Rates a card and calculates next review parameters
     * @param card The card being reviewed
     * @param rating User's rating (1-4)
     * @param now Current timestamp
     * @returns Updated card with new scheduling parameters
     */
    rate(card: Card, rating: Rating, now: Date): Card {
        // Calculate new difficulty and stability
        const { difficulty, stability } = this.nextDS(card, rating);

        // Calculate interval in days
        const interval = this.calculateInterval(stability);

        // Calculate due date
        const due = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

        // Update state
        const state = this.nextState(card.state, rating);

        // Increment counters
        const reps = card.reps + 1;
        const lapses = rating === 1 ? card.lapses + 1 : card.lapses;

        return {
            ...card,
            difficulty,
            stability,
            due,
            reps,
            lapses,
            state,
            lastReview: now
        };
    }

    /**
     * Calculates the next difficulty and stability for a card
     * @param card Current card state
     * @param rating User's rating
     * @returns New difficulty and stability values
     */
    private nextDS(card: Card, rating: Rating): { difficulty: number; stability: number } {
        let difficulty: number;
        let stability: number;

        if (card.state === 'new') {
            // Initial values for new cards based on rating
            difficulty = this.w[4] + (rating - 3) * this.w[6];
            stability = this.w[rating - 1]; // w[0-3] are initial stabilities
        } else {
            // Calculate next difficulty
            difficulty = this.nextDifficulty(card.difficulty, rating);

            // Calculate retrievability
            const retrievability = this.calculateRetrievability(card, new Date());

            // Calculate next stability
            stability = this.nextStability(card, retrievability, rating);
        }

        // Clamp values to valid ranges
        difficulty = Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, difficulty));
        stability = Math.max(MIN_STABILITY, stability);

        return { difficulty, stability };
    }

    /**
     * Calculates the next difficulty value
     * @param currentDifficulty Current difficulty
     * @param rating User's rating
     * @returns New difficulty value
     */
    private nextDifficulty(currentDifficulty: number, rating: Rating): number {
        const deltaD = rating - 3; // Can be -2, -1, 0, or +1
        return currentDifficulty - this.w[6] * deltaD;
    }

    /**
     * Calculates the next stability value using FSRS formula
     * @param card Current card state
     * @param retrievability Current retrievability (0-1)
     * @param rating User's rating
     * @returns New stability value
     */
    private nextStability(card: Card, retrievability: number, rating: Rating): number {
        const hardPenalty = rating === 2 ? this.w[15] : 1;
        const easyBonus = rating === 4 ? this.w[16] : 1;

        // FSRS-6 stability formula
        // S' = S * (1 + e^(w[8]) * (11 - D) * S^(-w[9]) * (e^((1 - R) * w[10]) - 1) * hardPenalty * easyBonus)
        const stabilityFactor = Math.exp(this.w[8]) *
            (11 - card.difficulty) *
            Math.pow(card.stability, -this.w[9]) *
            (Math.exp((1 - retrievability) * this.w[10]) - 1) *
            hardPenalty *
            easyBonus;

        return card.stability * (1 + stabilityFactor);
    }

    /**
     * Calculates current retrievability of a card
     * @param card Card to calculate retrievability for
     * @param now Current timestamp
     * @returns Retrievability value (0-1)
     */
    private calculateRetrievability(card: Card, now: Date): number {
        if (!card.lastReview) {
            return 0;
        }

        const elapsedDays = (now.getTime() - card.lastReview.getTime()) / (24 * 60 * 60 * 1000);

        // Retrievability formula: R = (1 + elapsed / (9 * stability))^(-1)
        return Math.pow(1 + elapsedDays / (9 * card.stability), -1);
    }

    /**
     * Calculates the optimal interval in days for a given stability
     * @param stability Current stability value
     * @returns Interval in days (with fuzz applied)
     */
    calculateInterval(stability: number): number {
        // Calculate base interval: I = S * (ln(desired_retention) / ln(0.9))
        let interval = stability * (Math.log(this.desiredRetention) / Math.log(0.9));

        // Clamp to valid range
        interval = Math.max(MINIMUM_INTERVAL, Math.min(this.maximumInterval, interval));

        // Add fuzz (±5% randomness)
        interval = this.addFuzz(interval);

        // Round to 2 decimal places
        return Math.round(interval * 100) / 100;
    }

    /**
     * Adds random fuzz to interval to prevent cards from clustering
     * @param interval Base interval
     * @returns Fuzzed interval
     */
    private addFuzz(interval: number): number {
        // Random value between -1 and 1
        const random = Math.random() * 2 - 1;

        // Apply fuzz: interval * (1 ± FUZZ_FACTOR)
        const fuzz = 1 + random * FUZZ_FACTOR;

        return interval * fuzz;
    }

    /**
     * Determines the next state based on current state and rating
     * @param currentState Current card state
     * @param rating User's rating
     * @returns New card state
     */
    private nextState(currentState: State, rating: Rating): State {
        if (rating === 1) {
            return 'relearning';
        }

        if (currentState === 'new') {
            return 'learning';
        }

        return 'review';
    }

    /**
     * Gets scheduling information for all possible ratings
     * Useful for showing "next review in X days" for each button
     * @param card Current card
     * @param now Current timestamp
     * @returns Scheduling info for each rating (1-4)
     */
    getSchedulingInfo(card: Card, now: Date): Record<Rating, SchedulingInfo> {
        const info: Partial<Record<Rating, SchedulingInfo>> = {};

        for (const rating of [1, 2, 3, 4] as Rating[]) {
            const updatedCard = this.rate(card, rating, now);
            const interval = this.calculateInterval(updatedCard.stability);
            const retrievability = this.calculateRetrievability(updatedCard, updatedCard.due);

            info[rating] = {
                card: updatedCard,
                interval,
                retrievability
            };
        }

        return info as Record<Rating, SchedulingInfo>;
    }
}
