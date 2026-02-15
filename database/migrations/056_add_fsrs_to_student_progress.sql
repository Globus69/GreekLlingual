-- Migration 056: Add FSRS-6 Fields to student_progress
-- Date: 2026-02-15
-- Purpose: Upgrade student_progress table with FSRS-6 scheduling fields
-- Related: Testing session completed, VocabularyDialogFSRS ready for production

-- Add FSRS-6 columns to student_progress table
DO $$
BEGIN
    -- fsrs_difficulty (1.0 - 10.0, default from w[4] ≈ 6.4)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_difficulty'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_difficulty REAL DEFAULT 6.4133;
        RAISE NOTICE 'Added fsrs_difficulty column to student_progress';
    END IF;

    -- fsrs_stability (in days, default from w[0] ≈ 0.212)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_stability'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_stability REAL DEFAULT 0.212;
        RAISE NOTICE 'Added fsrs_stability column to student_progress';
    END IF;

    -- fsrs_last_review (timestamp of last review, replaces last_attempt)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_last_review'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_last_review TIMESTAMPTZ;
        RAISE NOTICE 'Added fsrs_last_review column to student_progress';
    END IF;

    -- fsrs_due (when card is due for review, replaces next_review for FSRS)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_due'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_due TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added fsrs_due column to student_progress';
    END IF;

    -- fsrs_reps (number of times reviewed)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_reps'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_reps INT DEFAULT 0;
        RAISE NOTICE 'Added fsrs_reps column to student_progress';
    END IF;

    -- fsrs_lapses (number of times failed/forgotten)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_lapses'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_lapses INT DEFAULT 0;
        RAISE NOTICE 'Added fsrs_lapses column to student_progress';
    END IF;

    -- fsrs_state (new, learning, review, relearning)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_state'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_state TEXT DEFAULT 'new';
        RAISE NOTICE 'Added fsrs_state column to student_progress';
    END IF;

    -- fsrs_elapsed_days (days since last review)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_elapsed_days'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_elapsed_days INT DEFAULT 0;
        RAISE NOTICE 'Added fsrs_elapsed_days column to student_progress';
    END IF;

    -- fsrs_scheduled_days (scheduled interval in days)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'fsrs_scheduled_days'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN fsrs_scheduled_days INT DEFAULT 0;
        RAISE NOTICE 'Added fsrs_scheduled_days column to student_progress';
    END IF;
END $$;

-- Add CHECK constraint for fsrs_state
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'student_progress_fsrs_state_check'
          AND conrelid = 'public.student_progress'::regclass
    ) THEN
        ALTER TABLE public.student_progress
            ADD CONSTRAINT student_progress_fsrs_state_check
            CHECK (fsrs_state IN ('new', 'learning', 'review', 'relearning'));
        RAISE NOTICE 'CHECK constraint student_progress_fsrs_state_check created';
    END IF;
END $$;

-- Add CHECK constraint for fsrs_difficulty (1.0 - 10.0)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'student_progress_fsrs_difficulty_check'
          AND conrelid = 'public.student_progress'::regclass
    ) THEN
        ALTER TABLE public.student_progress
            ADD CONSTRAINT student_progress_fsrs_difficulty_check
            CHECK (fsrs_difficulty >= 1.0 AND fsrs_difficulty <= 10.0);
        RAISE NOTICE 'CHECK constraint student_progress_fsrs_difficulty_check created';
    END IF;
END $$;

-- Add CHECK constraint for fsrs_stability (min 0.1 days)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'student_progress_fsrs_stability_check'
          AND conrelid = 'public.student_progress'::regclass
    ) THEN
        ALTER TABLE public.student_progress
            ADD CONSTRAINT student_progress_fsrs_stability_check
            CHECK (fsrs_stability >= 0.1);
        RAISE NOTICE 'CHECK constraint student_progress_fsrs_stability_check created';
    END IF;
END $$;

-- Create indexes for FSRS queries
CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_due
    ON public.student_progress (fsrs_due)
    WHERE fsrs_due IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_state
    ON public.student_progress (fsrs_state);

CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_due_state_student
    ON public.student_progress (student_id, fsrs_due, fsrs_state)
    WHERE fsrs_due IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_progress_student_item
    ON public.student_progress (student_id, item_id);

-- Migrate existing data from old SRS fields to FSRS fields (if columns exist)
DO $$
DECLARE
    has_last_attempt BOOLEAN;
    has_next_review BOOLEAN;
    has_attempts BOOLEAN;
    has_correct_count BOOLEAN;
BEGIN
    -- Check which old columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'student_progress' AND column_name = 'last_attempt'
    ) INTO has_last_attempt;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'student_progress' AND column_name = 'next_review'
    ) INTO has_next_review;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'student_progress' AND column_name = 'attempts'
    ) INTO has_attempts;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'student_progress' AND column_name = 'correct_count'
    ) INTO has_correct_count;

    -- Conditionally migrate data
    IF has_last_attempt THEN
        EXECUTE 'UPDATE public.student_progress SET fsrs_last_review = last_attempt WHERE last_attempt IS NOT NULL AND fsrs_last_review IS NULL';
        RAISE NOTICE 'Migrated last_attempt → fsrs_last_review';
    END IF;

    IF has_next_review THEN
        EXECUTE 'UPDATE public.student_progress SET fsrs_due = next_review WHERE next_review IS NOT NULL';
        RAISE NOTICE 'Migrated next_review → fsrs_due';
    END IF;

    IF has_attempts THEN
        EXECUTE 'UPDATE public.student_progress SET fsrs_reps = GREATEST(attempts, 0) WHERE attempts > 0';
        RAISE NOTICE 'Migrated attempts → fsrs_reps';
    END IF;

    IF has_attempts OR has_correct_count THEN
        EXECUTE 'UPDATE public.student_progress SET fsrs_state = ''review'' WHERE attempts > 0 OR correct_count > 0';
        RAISE NOTICE 'Set fsrs_state to review for items with history';
    END IF;

    IF NOT (has_last_attempt OR has_next_review OR has_attempts) THEN
        RAISE NOTICE 'No legacy SRS columns found - starting fresh with FSRS-6';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ FSRS-6 fields successfully added to student_progress table';
    RAISE NOTICE '   - 9 new columns: difficulty, stability, last_review, due, reps, lapses, state, elapsed_days, scheduled_days';
    RAISE NOTICE '   - 3 CHECK constraints for data integrity';
    RAISE NOTICE '   - 4 indexes for query performance';
    RAISE NOTICE '   - Existing SRS data migrated to FSRS format';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Note: Old fields (last_attempt, interval_days) kept for backward compatibility';
    RAISE NOTICE '   You can drop them after confirming FSRS works correctly';
END $$;
