/**
 * FSRS Scheduler Unit Tests
 * 
 * Tests the core FSRS-6 algorithm implementation
 */

import { FSRSScheduler } from '../fsrs-scheduler';
import type { Card, Rating } from '../fsrs-types';
import { FSRS_PARAMETERS } from '../fsrs-constants';

describe('FSRSScheduler', () => {
    let scheduler: FSRSScheduler;

    beforeEach(() => {
        scheduler = new FSRSScheduler();
    });

    describe('createNewCard', () => {
        it('should create a new card with correct initial values', () => {
            const card = scheduler.createNewCard('test-card-1');

            expect(card.id).toBe('test-card-1');
            expect(card.difficulty).toBeCloseTo(FSRS_PARAMETERS[4], 2); // ≈ 6.4
            expect(card.stability).toBeCloseTo(FSRS_PARAMETERS[0], 2);  // ≈ 0.212
            expect(card.reps).toBe(0);
            expect(card.lapses).toBe(0);
            expect(card.state).toBe('new');
            expect(card.lastReview).toBeNull();
            expect(card.due).toBeInstanceOf(Date);
        });
    });

    describe('rate - New Card', () => {
        it('should handle Good rating (3) on new card', () => {
            const card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            const updated = scheduler.rate(card, 3, now);

            expect(updated.reps).toBe(1);
            expect(updated.lapses).toBe(0);
            expect(updated.state).toBe('learning');
            expect(updated.lastReview).toEqual(now);
            expect(updated.due.getTime()).toBeGreaterThan(now.getTime());
        });

        it('should handle Again rating (1) on new card', () => {
            const card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            const updated = scheduler.rate(card, 1, now);

            expect(updated.reps).toBe(1);
            expect(updated.lapses).toBe(1);
            expect(updated.state).toBe('relearning');
            expect(updated.difficulty).toBeGreaterThan(card.difficulty); // Difficulty increases
        });

        it('should handle Easy rating (4) on new card', () => {
            const card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            const updated = scheduler.rate(card, 4, now);

            expect(updated.reps).toBe(1);
            expect(updated.lapses).toBe(0);
            expect(updated.state).toBe('learning');
            expect(updated.difficulty).toBeLessThan(card.difficulty); // Difficulty decreases
        });
    });

    describe('rate - Multiple Reviews', () => {
        it('should increase interval after multiple Good ratings', () => {
            let card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            // Rate 5 times with "Good"
            for (let i = 0; i < 5; i++) {
                card = scheduler.rate(card, 3, now);
            }

            const interval = scheduler.calculateInterval(card.stability);

            expect(card.reps).toBe(5);
            expect(interval).toBeGreaterThan(30); // Should be > 30 days after 5 Good ratings
            expect(card.state).toBe('review');
        });

        it('should reset interval on Again rating', () => {
            let card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            // Build up interval
            card = scheduler.rate(card, 3, now);
            card = scheduler.rate(card, 3, now);
            const intervalBefore = scheduler.calculateInterval(card.stability);

            // Fail the card
            card = scheduler.rate(card, 1, now);
            const intervalAfter = scheduler.calculateInterval(card.stability);

            expect(card.lapses).toBe(1);
            expect(card.state).toBe('relearning');
            expect(intervalAfter).toBeLessThan(intervalBefore);
        });
    });

    describe('calculateInterval', () => {
        it('should return interval proportional to stability', () => {
            const interval1 = scheduler.calculateInterval(1.0);
            const interval2 = scheduler.calculateInterval(10.0);

            expect(interval2).toBeGreaterThan(interval1);
            expect(interval2 / interval1).toBeCloseTo(10, 0); // Roughly 10x
        });

        it('should respect maximum interval limit', () => {
            const veryHighStability = 100000;
            const interval = scheduler.calculateInterval(veryHighStability);

            expect(interval).toBeLessThanOrEqual(36500); // 100 years max
        });

        it('should respect minimum interval limit', () => {
            const veryLowStability = 0.01;
            const interval = scheduler.calculateInterval(veryLowStability);

            expect(interval).toBeGreaterThanOrEqual(0.1); // 2.4 hours min
        });
    });

    describe('Rating Comparison', () => {
        it('should give longer interval for Easy than Good', () => {
            const card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            const goodCard = scheduler.rate(card, 3, now);
            const easyCard = scheduler.rate(card, 4, now);

            const goodInterval = scheduler.calculateInterval(goodCard.stability);
            const easyInterval = scheduler.calculateInterval(easyCard.stability);

            expect(easyInterval).toBeGreaterThan(goodInterval);
        });

        it('should give shorter interval for Hard than Good', () => {
            const card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            const hardCard = scheduler.rate(card, 2, now);
            const goodCard = scheduler.rate(card, 3, now);

            const hardInterval = scheduler.calculateInterval(hardCard.stability);
            const goodInterval = scheduler.calculateInterval(goodCard.stability);

            expect(hardInterval).toBeLessThan(goodInterval);
        });
    });

    describe('State Transitions', () => {
        it('should transition: new → learning → review', () => {
            let card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            expect(card.state).toBe('new');

            card = scheduler.rate(card, 3, now);
            expect(card.state).toBe('learning');

            card = scheduler.rate(card, 3, now);
            expect(card.state).toBe('review');
        });

        it('should transition to relearning on Again rating', () => {
            let card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            // Build up to review state
            card = scheduler.rate(card, 3, now);
            card = scheduler.rate(card, 3, now);
            expect(card.state).toBe('review');

            // Fail the card
            card = scheduler.rate(card, 1, now);
            expect(card.state).toBe('relearning');
        });
    });

    describe('Difficulty Bounds', () => {
        it('should clamp difficulty to minimum (1.0)', () => {
            let card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            // Rate Easy many times to decrease difficulty
            for (let i = 0; i < 20; i++) {
                card = scheduler.rate(card, 4, now);
            }

            expect(card.difficulty).toBeGreaterThanOrEqual(1.0);
        });

        it('should clamp difficulty to maximum (10.0)', () => {
            let card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            // Rate Again many times to increase difficulty
            for (let i = 0; i < 20; i++) {
                card = scheduler.rate(card, 1, now);
            }

            expect(card.difficulty).toBeLessThanOrEqual(10.0);
        });
    });

    describe('Fuzz Factor', () => {
        it('should add randomness to intervals', () => {
            const intervals: number[] = [];

            // Calculate interval 100 times for same stability
            for (let i = 0; i < 100; i++) {
                const interval = scheduler.calculateInterval(10.0);
                intervals.push(interval);
            }

            // Check that we have variation
            const uniqueIntervals = new Set(intervals);
            expect(uniqueIntervals.size).toBeGreaterThan(50); // At least 50 different values

            // Check that variation is roughly ±5%
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const maxDeviation = Math.max(...intervals.map(i => Math.abs(i - avg) / avg));
            expect(maxDeviation).toBeLessThan(0.06); // Within 6% (allowing for randomness)
        });
    });

    describe('getSchedulingInfo', () => {
        it('should return info for all 4 ratings', () => {
            const card = scheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            const info = scheduler.getSchedulingInfo(card, now);

            expect(Object.keys(info)).toHaveLength(4);
            expect(info[1]).toBeDefined();
            expect(info[2]).toBeDefined();
            expect(info[3]).toBeDefined();
            expect(info[4]).toBeDefined();

            // Intervals should be ordered: Again < Hard < Good < Easy
            expect(info[1].interval).toBeLessThan(info[2].interval);
            expect(info[2].interval).toBeLessThan(info[3].interval);
            expect(info[3].interval).toBeLessThan(info[4].interval);
        });
    });

    describe('Custom Parameters', () => {
        it('should accept custom desired retention', () => {
            const customScheduler = new FSRSScheduler({ desiredRetention: 0.85 });
            const card = customScheduler.createNewCard('test-1');
            const now = new Date('2026-02-14T12:00:00Z');

            const updated = customScheduler.rate(card, 3, now);
            const interval = customScheduler.calculateInterval(updated.stability);

            // Lower retention = longer intervals
            const defaultInterval = scheduler.calculateInterval(updated.stability);
            expect(interval).toBeGreaterThan(defaultInterval);
        });

        it('should throw error for invalid parameter count', () => {
            expect(() => {
                new FSRSScheduler({ w: [1, 2, 3] }); // Only 3 parameters
            }).toThrow('FSRS parameters must contain exactly 21 values');
        });

        it('should throw error for invalid retention', () => {
            expect(() => {
                new FSRSScheduler({ desiredRetention: 0.5 }); // Too low
            }).toThrow('Desired retention must be between 0.7 and 0.99');
        });
    });
});
