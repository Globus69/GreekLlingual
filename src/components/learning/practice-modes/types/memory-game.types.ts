/**
 * Memory Game Types
 *
 * Shared TypeScript types for Memory Game component
 * Used for integration with Desktop and Mobile practice modes
 */

/**
 * Individual memory card
 */
export interface MemoryCard {
    /** Unique card identifier */
    id: string;

    /** Display content (Greek word or English translation) */
    content: string;

    /** Language type for styling */
    language: 'greek' | 'user';

    /** Pair identifier - cards with same pairId match */
    pairId: string;
}

/**
 * Game statistics returned on completion
 */
export interface GameStats {
    /** Total number of card flip attempts */
    attempts: number;

    /** Number of pairs successfully matched */
    matches: number;

    /** Total time elapsed in seconds */
    time: number;
}

/**
 * Memory Game component props
 */
export interface MemoryGameProps {
    /** Array of cards to display (must be even number) */
    cards: MemoryCard[];

    /** Show Greek cards first (true) or English cards first (false) */
    showGreekFirst: boolean;

    /** Callback fired when game completes (all pairs matched) */
    onComplete?: (stats: GameStats) => void;

    /** Enable mobile layout (3 columns) vs desktop (4-6 columns) */
    isMobile?: boolean;
}

/**
 * Helper function to prepare memory cards from vocabulary items
 */
export interface VocabularyItem {
    id: string;
    greek: string;
    english: string;
}

/**
 * Prepare memory cards from vocabulary items
 *
 * @param items - Array of vocabulary items
 * @param shuffle - Whether to shuffle cards (default: true)
 * @returns Array of memory cards ready for game
 *
 * @example
 * ```typescript
 * const items = [
 *   { id: '1', greek: 'Γεια σου', english: 'Hello' },
 *   { id: '2', greek: 'Ευχαριστώ', english: 'Thank you' }
 * ];
 *
 * const cards = prepareMemoryCards(items);
 * // Returns 4 cards (2 pairs), shuffled
 * ```
 */
export function prepareMemoryCards(
    items: VocabularyItem[],
    shuffle: boolean = true
): MemoryCard[] {
    const cards: MemoryCard[] = [];

    items.forEach((item, index) => {
        const pairId = `pair-${item.id || index}`;

        // Add Greek card
        cards.push({
            id: `greek-${item.id || index}`,
            content: item.greek,
            language: 'greek',
            pairId,
        });

        // Add English card
        cards.push({
            id: `user-${item.id || index}`,
            content: item.english,
            language: 'user',
            pairId,
        });
    });

    // Shuffle if requested
    if (shuffle) {
        return cards.sort(() => Math.random() - 0.5);
    }

    return cards;
}

/**
 * Calculate score based on game stats
 *
 * @param stats - Game statistics
 * @param maxScore - Maximum possible score (default: 100)
 * @returns Score (0-100)
 *
 * Formula:
 * - Perfect score: All pairs matched on first try
 * - Penalty: Based on excess attempts
 *
 * @example
 * ```typescript
 * const stats = { attempts: 10, matches: 5, time: 30 };
 * const score = calculateMemoryScore(stats);
 * // Returns: 100 (if 10 attempts = exactly 2 per pair)
 * ```
 */
export function calculateMemoryScore(stats: GameStats, maxScore: number = 100): number {
    const { attempts, matches } = stats;

    // Minimum attempts = matches * 2 (perfect play)
    const minAttempts = matches * 2;

    // Extra attempts (mistakes)
    const extraAttempts = Math.max(0, attempts - minAttempts);

    // Penalty per mistake (up to 30% of score)
    const penaltyPerMistake = 30 / (matches * 2);
    const penalty = extraAttempts * penaltyPerMistake;

    return Math.max(0, Math.round(maxScore - penalty));
}
