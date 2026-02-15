/**
 * FSRS-6 Type Definitions
 * Free Spaced Repetition Scheduler - Version 6
 * 
 * Used by: daily-phrases, vocabulary modules
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki
 */

/**
 * Rating given by user after reviewing a card
 * 1 = Again (failed, need to review soon)
 * 2 = Hard (difficult, but passed)
 * 3 = Good (normal difficulty)
 * 4 = Easy (very easy)
 */
export type Rating = 1 | 2 | 3 | 4;

/**
 * Current state of a card in the learning process
 * - new: Never reviewed before
 * - learning: Currently being learned (first few reviews)
 * - review: In regular review cycle
 * - relearning: Failed a review, needs relearning
 */
export type State = 'new' | 'learning' | 'review' | 'relearning';

/**
 * Represents a flashcard with FSRS scheduling data
 */
export interface Card {
    /** Unique identifier */
    id: string;

    /** Difficulty (1-10, higher = more difficult) */
    difficulty: number;

    /** Stability in days (how long until retrievability drops to desired retention) */
    stability: number;

    /** When the card is due for review (timestamp) */
    due: Date;

    /** Number of times reviewed */
    reps: number;

    /** Number of times failed (rating = 1) */
    lapses: number;

    /** Current learning state */
    state: State;

    /** Last review timestamp (null if never reviewed) */
    lastReview: Date | null;
}

/**
 * Information about the next scheduled review
 */
export interface SchedulingInfo {
    /** Updated card after rating */
    card: Card;

    /** Interval in days until next review */
    interval: number;

    /** Predicted retrievability at due date (0-1) */
    retrievability: number;
}

/**
 * Log entry for a single review
 */
export interface ReviewLog {
    /** Card ID that was reviewed */
    cardId: string;

    /** Rating given (1-4) */
    rating: Rating;

    /** When the review happened */
    reviewTime: Date;

    /** Difficulty before review */
    oldDifficulty: number;

    /** Difficulty after review */
    newDifficulty: number;

    /** Stability before review */
    oldStability: number;

    /** Stability after review */
    newStability: number;

    /** Interval in days */
    intervalDays: number;
}

/**
 * FSRS algorithm parameters (21 values)
 * These can be customized per user or kept at defaults
 */
export interface FSRSParameters {
    /** Array of 21 parameter values (w[0] to w[20]) */
    w: number[];

    /** Desired retention rate (0-1, typically 0.90 = 90%) */
    desiredRetention: number;

    /** Maximum interval in days (default: 36500 = 100 years) */
    maximumInterval: number;
}
