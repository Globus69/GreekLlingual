-- Migration 053: Create FSRS Review Logs Table
-- Date: 2026-02-15
-- Purpose: Track all review history for analytics and algorithm optimization

-- Create fsrs_review_logs table
CREATE TABLE IF NOT EXISTS public.fsrs_review_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES public.learning_items(id) ON DELETE CASCADE,
    
    -- Review data
    rating INT NOT NULL CHECK (rating IN (1, 2, 3, 4)),
    review_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Interval in days (for analytics)
    interval_days REAL NOT NULL,
    
    -- FSRS parameters before review
    old_difficulty REAL NOT NULL,
    old_stability REAL NOT NULL,
    
    -- FSRS parameters after review
    new_difficulty REAL NOT NULL,
    new_stability REAL NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fsrs_reviews_user_card
    ON public.fsrs_review_logs (user_id, card_id);

CREATE INDEX IF NOT EXISTS idx_fsrs_reviews_card_time
    ON public.fsrs_review_logs (card_id, review_time DESC);

CREATE INDEX IF NOT EXISTS idx_fsrs_reviews_time
    ON public.fsrs_review_logs (review_time DESC);

CREATE INDEX IF NOT EXISTS idx_fsrs_reviews_user_time
    ON public.fsrs_review_logs (user_id, review_time DESC);

-- Enable RLS
ALTER TABLE public.fsrs_review_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own review logs"
    ON public.fsrs_review_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review logs"
    ON public.fsrs_review_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.fsrs_review_logs TO authenticated;
GRANT INSERT ON public.fsrs_review_logs TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ fsrs_review_logs table created successfully';
    RAISE NOTICE '   - Tracks all review history with FSRS parameters';
    RAISE NOTICE '   - 4 indexes for query performance';
    RAISE NOTICE '   - RLS enabled for data security';
END $$;
