/**
 * FSRS-6 Constants and Default Parameters
 * 
 * These are community-optimized default values from the FSRS-6 research paper.
 * Can be customized per user in the future.
 * 
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

/**
 * Default FSRS-6 parameters (21 values)
 * Optimized through machine learning on large dataset
 * 
 * w[0]: Initial stability for "Again" rating
 * w[1]: Initial stability for "Hard" rating
 * w[2]: Initial stability for "Good" rating
 * w[3]: Initial stability for "Easy" rating
 * w[4]: Initial difficulty
 * w[5-20]: Various factors for stability and difficulty calculations
 */
export const FSRS_PARAMETERS: number[] = [
    0.212,   // w[0]  - Initial stability for Again
    1.2931,  // w[1]  - Initial stability for Hard
    2.3065,  // w[2]  - Initial stability for Good
    8.2956,  // w[3]  - Initial stability for Easy
    6.4133,  // w[4]  - Initial difficulty
    0.8334,  // w[5]  - Difficulty decay factor
    3.0194,  // w[6]  - Difficulty change per rating
    0.001,   // w[7]  - Minimum stability
    1.8722,  // w[8]  - Stability growth factor
    0.1666,  // w[9]  - Stability decay exponent
    0.796,   // w[10] - Retrievability impact
    1.4835,  // w[11] - Stability multiplier
    0.0614,  // w[12] - Additional factor
    0.2629,  // w[13] - Additional factor
    1.6483,  // w[14] - Additional factor
    0.6014,  // w[15] - Hard penalty
    1.8729,  // w[16] - Easy bonus
    0.5425,  // w[17] - Additional factor
    0.0912,  // w[18] - Additional factor
    0.0658,  // w[19] - Additional factor
    0.1542   // w[20] - Additional factor
];

/**
 * Desired retention rate (90%)
 * This means we want users to remember 90% of cards when they're due
 */
export const DESIRED_RETENTION = 0.90;

/**
 * Maximum interval in days (100 years)
 * Prevents intervals from becoming unreasonably long
 */
export const MAXIMUM_INTERVAL = 36500;

/**
 * Minimum interval in days (0.1 days = 2.4 hours)
 * Prevents intervals from being too short
 */
export const MINIMUM_INTERVAL = 0.1;

/**
 * Fuzz factor for interval randomization (±5%)
 * Adds slight randomness to prevent cards from always being due at the same time
 */
export const FUZZ_FACTOR = 0.05;

/**
 * Minimum difficulty value
 */
export const MIN_DIFFICULTY = 1.0;

/**
 * Maximum difficulty value
 */
export const MAX_DIFFICULTY = 10.0;

/**
 * Minimum stability value (in days)
 */
export const MIN_STABILITY = 0.1;

/**
 * Rating labels for UI
 */
export const RATING_LABELS = {
    1: 'Again',
    2: 'Hard',
    3: 'Good',
    4: 'Easy'
} as const;

/**
 * Rating colors for UI (matching existing design)
 */
export const RATING_COLORS = {
    1: '#FF6B6B', // Red - Again
    2: '#FFA94D', // Orange - Hard
    3: '#51CF66', // Green - Good
    4: '#339AF0'  // Blue - Easy
} as const;
