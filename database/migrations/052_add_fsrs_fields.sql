-- Migration 052: Add FSRS-6 Fields to learning_items
-- Date: 2026-02-15
-- Purpose: Extend learning_items table with FSRS-6 scheduling fields

-- Add FSRS-6 columns to learning_items table
DO $$
BEGIN
    -- fsrs_difficulty (1.0 - 10.0, default from w[4] ≈ 6.4)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'fsrs_difficulty'
    ) THEN
        ALTER TABLE public.learning_items
            ADD COLUMN fsrs_difficulty REAL DEFAULT 6.4133;
        RAISE NOTICE 'Added fsrs_difficulty column to learning_items';
    END IF;

    -- fsrs_stability (in days, default from w[0] ≈ 0.212)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'fsrs_stability'
    ) THEN
        ALTER TABLE public.learning_items
            ADD COLUMN fsrs_stability REAL DEFAULT 0.212;
        RAISE NOTICE 'Added fsrs_stability column to learning_items';
    END IF;

    -- fsrs_last_review (timestamp of last review)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'fsrs_last_review'
    ) THEN
        ALTER TABLE public.learning_items
            ADD COLUMN fsrs_last_review TIMESTAMPTZ;
        RAISE NOTICE 'Added fsrs_last_review column to learning_items';
    END IF;

    -- fsrs_due (when card is due for review)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'fsrs_due'
    ) THEN
        ALTER TABLE public.learning_items
            ADD COLUMN fsrs_due TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added fsrs_due column to learning_items';
    END IF;

    -- fsrs_reps (number of times reviewed)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'fsrs_reps'
    ) THEN
        ALTER TABLE public.learning_items
            ADD COLUMN fsrs_reps INT DEFAULT 0;
        RAISE NOTICE 'Added fsrs_reps column to learning_items';
    END IF;

    -- fsrs_lapses (number of times failed/forgotten)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'fsrs_lapses'
    ) THEN
        ALTER TABLE public.learning_items
            ADD COLUMN fsrs_lapses INT DEFAULT 0;
        RAISE NOTICE 'Added fsrs_lapses column to learning_items';
    END IF;

    -- fsrs_state (new, learning, review, relearning)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'fsrs_state'
    ) THEN
        ALTER TABLE public.learning_items
            ADD COLUMN fsrs_state TEXT DEFAULT 'new';
        RAISE NOTICE 'Added fsrs_state column to learning_items';
    END IF;

    -- phonetic (Greek pronunciation in IPA or simplified)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'learning_items'
          AND column_name = 'phonetic'
    ) THEN
        ALTER TABLE public.learning_items
            ADD COLUMN phonetic TEXT;
        RAISE NOTICE 'Added phonetic column to learning_items';
    END IF;
END $$;

-- Add CHECK constraint for fsrs_state
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'learning_items_fsrs_state_check'
          AND conrelid = 'public.learning_items'::regclass
    ) THEN
        ALTER TABLE public.learning_items
            ADD CONSTRAINT learning_items_fsrs_state_check
            CHECK (fsrs_state IN ('new', 'learning', 'review', 'relearning'));
        RAISE NOTICE 'CHECK constraint learning_items_fsrs_state_check created';
    END IF;
END $$;

-- Add CHECK constraint for fsrs_difficulty (1.0 - 10.0)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'learning_items_fsrs_difficulty_check'
          AND conrelid = 'public.learning_items'::regclass
    ) THEN
        ALTER TABLE public.learning_items
            ADD CONSTRAINT learning_items_fsrs_difficulty_check
            CHECK (fsrs_difficulty >= 1.0 AND fsrs_difficulty <= 10.0);
        RAISE NOTICE 'CHECK constraint learning_items_fsrs_difficulty_check created';
    END IF;
END $$;

-- Add CHECK constraint for fsrs_stability (min 0.1 days)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'learning_items_fsrs_stability_check'
          AND conrelid = 'public.learning_items'::regclass
    ) THEN
        ALTER TABLE public.learning_items
            ADD CONSTRAINT learning_items_fsrs_stability_check
            CHECK (fsrs_stability >= 0.1);
        RAISE NOTICE 'CHECK constraint learning_items_fsrs_stability_check created';
    END IF;
END $$;

-- Create indexes for FSRS queries
CREATE INDEX IF NOT EXISTS idx_learning_items_fsrs_due
    ON public.learning_items (fsrs_due)
    WHERE fsrs_due IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_learning_items_fsrs_state
    ON public.learning_items (fsrs_state);

CREATE INDEX IF NOT EXISTS idx_learning_items_fsrs_due_state
    ON public.learning_items (fsrs_due, fsrs_state)
    WHERE fsrs_due IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ FSRS-6 fields successfully added to learning_items table';
    RAISE NOTICE '   - 8 new columns: difficulty, stability, last_review, due, reps, lapses, state, phonetic';
    RAISE NOTICE '   - 3 CHECK constraints for data integrity';
    RAISE NOTICE '   - 3 indexes for query performance';
END $$;
