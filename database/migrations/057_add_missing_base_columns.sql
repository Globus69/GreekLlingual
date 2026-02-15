-- Migration 057: Add Missing Base Columns to student_progress
-- Date: 2026-02-15
-- Purpose: Add correct_count and attempts columns that were expected but missing

DO $$
BEGIN
    -- Add correct_count column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'correct_count'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN correct_count INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added correct_count column to student_progress';
    ELSE
        RAISE NOTICE 'correct_count column already exists';
    END IF;

    -- Add attempts column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'attempts'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN attempts INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added attempts column to student_progress';
    ELSE
        RAISE NOTICE 'attempts column already exists';
    END IF;

    -- Add ease_factor for backward compatibility (SM-2 algorithm)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'ease_factor'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN ease_factor REAL DEFAULT 2.5;
        RAISE NOTICE 'Added ease_factor column to student_progress';
    ELSE
        RAISE NOTICE 'ease_factor column already exists';
    END IF;

    -- Add next_review for backward compatibility
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'student_progress'
          AND column_name = 'next_review'
    ) THEN
        ALTER TABLE public.student_progress
            ADD COLUMN next_review TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added next_review column to student_progress';
    ELSE
        RAISE NOTICE 'next_review column already exists';
    END IF;

    -- Sync fsrs_reps with attempts for existing data
    UPDATE public.student_progress
    SET attempts = fsrs_reps
    WHERE fsrs_reps > 0 AND attempts = 0;

    RAISE NOTICE '✅ Base columns successfully added to student_progress';
    RAISE NOTICE '   - correct_count (for tracking correct answers)';
    RAISE NOTICE '   - attempts (for tracking total attempts)';
    RAISE NOTICE '   - ease_factor (SM-2 compatibility)';
    RAISE NOTICE '   - next_review (for compatibility)';
END $$;
