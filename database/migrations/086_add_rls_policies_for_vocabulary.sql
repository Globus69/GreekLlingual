-- ============================================================================
-- Migration 086: Add RLS Policies for Vocabulary and Phrases
-- ============================================================================
-- Purpose: Enable authenticated users to manage vocabulary and phrases
-- Date: 2026-02-18
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '🚀 MIGRATION 086: Adding RLS policies for vocabulary/phrases';
    RAISE NOTICE '🚀 ============================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. Drop existing policies if any
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read multilingual_vocabulary" ON multilingual_vocabulary;
DROP POLICY IF EXISTS "Authenticated users can insert multilingual_vocabulary" ON multilingual_vocabulary;
DROP POLICY IF EXISTS "Authenticated users can update multilingual_vocabulary" ON multilingual_vocabulary;
DROP POLICY IF EXISTS "Authenticated users can delete multilingual_vocabulary" ON multilingual_vocabulary;

DROP POLICY IF EXISTS "Authenticated users can read daily_phrases" ON daily_phrases;
DROP POLICY IF EXISTS "Authenticated users can insert daily_phrases" ON daily_phrases;
DROP POLICY IF EXISTS "Authenticated users can update daily_phrases" ON daily_phrases;
DROP POLICY IF EXISTS "Authenticated users can delete daily_phrases" ON daily_phrases;

-- ============================================================================
-- 2. Enable RLS on tables
-- ============================================================================

ALTER TABLE multilingual_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_phrases ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Create RLS Policies for multilingual_vocabulary
-- ============================================================================

-- Policy: All authenticated users can read
CREATE POLICY "Authenticated users can read multilingual_vocabulary"
    ON multilingual_vocabulary
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert multilingual_vocabulary"
    ON multilingual_vocabulary
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Authenticated users can update
CREATE POLICY "Authenticated users can update multilingual_vocabulary"
    ON multilingual_vocabulary
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Authenticated users can delete
CREATE POLICY "Authenticated users can delete multilingual_vocabulary"
    ON multilingual_vocabulary
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================================
-- 4. Create RLS Policies for daily_phrases
-- ============================================================================

-- Policy: All authenticated users can read
CREATE POLICY "Authenticated users can read daily_phrases"
    ON daily_phrases
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert daily_phrases"
    ON daily_phrases
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Authenticated users can update
CREATE POLICY "Authenticated users can update daily_phrases"
    ON daily_phrases
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Authenticated users can delete
CREATE POLICY "Authenticated users can delete daily_phrases"
    ON daily_phrases
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================================
-- 5. Grant permissions to authenticated role
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON multilingual_vocabulary TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_phrases TO authenticated;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ MIGRATION 086 COMPLETE';
    RAISE NOTICE '✅ RLS policies created for multilingual_vocabulary';
    RAISE NOTICE '✅ RLS policies created for daily_phrases';
    RAISE NOTICE '✅ Authenticated users can now CRUD both tables';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '';
END $$;
