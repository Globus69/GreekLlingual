-- ========================================
-- SETUP STUDENT_PROGRESS FOR DAILY PHRASES
-- ========================================
-- This script ensures the student_progress table has the correct structure
-- to support both vocabulary (item_id) and daily phrases (phrase_id)
-- ========================================

-- Check if student_progress table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
    ) THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.student_progress (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            item_id UUID REFERENCES public.learning_items(id) ON DELETE CASCADE,
            student_id UUID NOT NULL,
            correct_count INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 0,
            last_attempt TIMESTAMP WITH TIME ZONE,
            next_review TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            interval_days FLOAT DEFAULT 1.0,
            ease_factor FLOAT DEFAULT 2.5
        );
        RAISE NOTICE 'Created student_progress table';
    ELSE
        RAISE NOTICE 'student_progress table already exists';
    END IF;
END $$;

-- First, ensure student_progress table exists (from web_prototype_setup.sql)
-- If it doesn't exist, create it
-- Table creation is now handled in the DO block above

-- Add unique constraint only if it doesn't exist and item_id column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
        AND column_name = 'item_id'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE public.student_progress
        DROP CONSTRAINT IF EXISTS student_progress_item_id_student_id_key;
        
        -- Create unique constraint
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'student_progress_item_id_student_id_key'
        ) THEN
            ALTER TABLE public.student_progress
            ADD CONSTRAINT student_progress_item_id_student_id_key
            UNIQUE(item_id, student_id);
        END IF;
        
        RAISE NOTICE 'Added unique constraint on item_id, student_id';
    END IF;
END $$;

-- Add item_id column if it doesn't exist (for vocabulary/learning_items)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
        AND column_name = 'item_id'
    ) THEN
        -- Check if learning_items table exists before adding foreign key
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'learning_items'
        ) THEN
            ALTER TABLE public.student_progress
            ADD COLUMN item_id UUID REFERENCES public.learning_items(id) ON DELETE CASCADE;
        ELSE
            ALTER TABLE public.student_progress
            ADD COLUMN item_id UUID;
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_student_progress_item ON public.student_progress(item_id);
        
        RAISE NOTICE 'Added item_id column to student_progress table';
    ELSE
        RAISE NOTICE 'item_id column already exists';
    END IF;
END $$;

-- Add phrase_id column if it doesn't exist (for daily_phrases)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
        AND column_name = 'phrase_id'
    ) THEN
        -- Check if daily_phrases table exists before adding foreign key
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'daily_phrases'
        ) THEN
            ALTER TABLE public.student_progress
            ADD COLUMN phrase_id UUID REFERENCES public.daily_phrases(id) ON DELETE CASCADE;
        ELSE
            ALTER TABLE public.student_progress
            ADD COLUMN phrase_id UUID;
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_student_progress_phrase ON public.student_progress(phrase_id);
        
        RAISE NOTICE 'Added phrase_id column to student_progress table';
    ELSE
        RAISE NOTICE 'phrase_id column already exists';
    END IF;
END $$;

-- Add interval column if it doesn't exist (some tables use interval_days, some use interval)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
        AND column_name = 'interval'
    ) THEN
        ALTER TABLE public.student_progress
        ADD COLUMN interval INTEGER DEFAULT 1;
        
        RAISE NOTICE 'Added interval column to student_progress table';
    ELSE
        RAISE NOTICE 'interval column already exists';
    END IF;
END $$;

-- Add due_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
        AND column_name = 'due_date'
    ) THEN
        ALTER TABLE public.student_progress
        ADD COLUMN due_date DATE DEFAULT CURRENT_DATE;
        
        RAISE NOTICE 'Added due_date column to student_progress table';
    ELSE
        RAISE NOTICE 'due_date column already exists';
    END IF;
END $$;

-- Add last_reviewed column if it doesn't exist (some tables use last_attempt, some use last_reviewed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
        AND column_name = 'last_reviewed'
    ) THEN
        ALTER TABLE public.student_progress
        ADD COLUMN last_reviewed TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added last_reviewed column to student_progress table';
    ELSE
        RAISE NOTICE 'last_reviewed column already exists';
    END IF;
END $$;

-- Drop old unique constraints that might cause issues
ALTER TABLE public.student_progress
DROP CONSTRAINT IF EXISTS student_progress_student_id_vocab_id_key;

ALTER TABLE public.student_progress
DROP CONSTRAINT IF EXISTS student_progress_student_id_phrase_id_key;

-- Drop old unique constraint on item_id, student_id if it exists
ALTER TABLE public.student_progress
DROP CONSTRAINT IF EXISTS student_progress_item_id_student_id_key;

-- Check if item_id column exists before creating index
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
        AND column_name = 'item_id'
    ) THEN
        -- Create partial unique index for item_id (vocabulary)
        DROP INDEX IF EXISTS student_progress_vocab_unique;
        CREATE UNIQUE INDEX IF NOT EXISTS student_progress_vocab_unique
        ON public.student_progress(student_id, item_id)
        WHERE item_id IS NOT NULL;
        
        RAISE NOTICE 'Created index for item_id';
    ELSE
        RAISE NOTICE 'item_id column does not exist, skipping index creation';
    END IF;
END $$;

-- Check if phrase_id column exists before creating index
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'student_progress'
        AND column_name = 'phrase_id'
    ) THEN
        -- Create partial unique index for phrase_id (daily phrases)
        DROP INDEX IF EXISTS student_progress_phrase_unique;
        CREATE UNIQUE INDEX IF NOT EXISTS student_progress_phrase_unique
        ON public.student_progress(student_id, phrase_id)
        WHERE phrase_id IS NOT NULL;
        
        RAISE NOTICE 'Created index for phrase_id';
    ELSE
        RAISE NOTICE 'phrase_id column does not exist, skipping index creation';
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policy for student_progress
DROP POLICY IF EXISTS "Allow all edit student_progress" ON public.student_progress;
CREATE POLICY "Allow all edit student_progress"
ON public.student_progress FOR ALL
USING (true)
WITH CHECK (true);

-- ========================================
-- Verification
-- ========================================
-- Run this to verify the table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'student_progress'
-- ORDER BY ordinal_position;
