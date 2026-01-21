/**
 * SuperMemo-2 (SM2) Algorithm Implementation
 * 
 * @param quality 0-5 (0: total blackout, 5: perfect response)
 * @param repetitionCount Current number of repetitions
 * @param previousEaseFactor Current ease factor (default 2.5)
 * @param previousInterval Current interval in days
 * 
 * @returns { interval: number, repetitionCount: number, easeFactor: number }
 */
export function calculateSM2(
    quality: number,
    repetitionCount: number,
    previousEaseFactor: number,
    previousInterval: number
) {
    let nextInterval: number;
    let nextRepetitionCount: number;
    let nextEaseFactor: number;

    if (quality >= 3) {
        // Correct response
        if (repetitionCount === 0) {
            nextInterval = 1;
        } else if (repetitionCount === 1) {
            nextInterval = 6;
        } else {
            nextInterval = Math.round(previousInterval * previousEaseFactor);
        }
        nextRepetitionCount = repetitionCount + 1;
    } else {
        // Incorrect response
        nextInterval = 1;
        nextRepetitionCount = 0;
    }

    // Update Ease Factor
    // EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    nextEaseFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Ease Factor cannot be lower than 1.3
    if (nextEaseFactor < 1.3) {
        nextEaseFactor = 1.3;
    }

    return {
        interval: nextInterval,
        repetitionCount: nextRepetitionCount,
        easeFactor: nextEaseFactor
    };
}

/**
 * Convenience function to determine next due date
 */
export function getNextDueDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}
