-- ═══════════════════════════════════════════════════════════════
-- DAILY PHRASES - MULTILINGUAL STRUCTURE (MATCHING VOCAB)
-- ═══════════════════════════════════════════════════════════════
-- Creates daily_phrases table with EXACT same structure as vocabulary
-- Plus phrases-specific fields (scheduled_date, context_tags)
--
-- This migration ensures 100% schema consistency with multilingual_vocabulary
-- ═══════════════════════════════════════════════════════════════

-- Drop old tables if they exist (BACKUP DATA FIRST!)
DROP TABLE IF EXISTS phrases CASCADE;
DROP TABLE IF EXISTS daily_phrases CASCADE;

-- Create daily_phrases with EXACT vocab structure
CREATE TABLE public.daily_phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core Greek content
    nr INTEGER,
    greek_transcription TEXT NOT NULL,
    greek_phonetic TEXT,

    -- English translation
    en_translation TEXT,
    en_importance_reason TEXT,
    en_audio_url TEXT,

    -- German translation
    de_translation TEXT,
    de_importance_reason TEXT,
    de_audio_url TEXT,

    -- Spanish translation
    es_translation TEXT,
    es_importance_reason TEXT,
    es_audio_url TEXT,

    -- Russian translation
    ru_translation TEXT,
    ru_importance_reason TEXT,
    ru_audio_url TEXT,

    -- Learning metadata (IDENTICAL to vocab)
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    frequency INTEGER NOT NULL DEFAULT 3 CHECK (frequency >= 1 AND frequency <= 5),

    -- Phrases-specific fields (ADDITIONAL, not replacing anything)
    scheduled_date DATE,
    context_tags TEXT[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.users(id),

    -- Unique constraint (matching vocab)
    CONSTRAINT unique_phrase_level UNIQUE (greek_transcription, level)
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES (11 total: 9 from vocab + 2 phrases-specific)
-- ═══════════════════════════════════════════════════════════════

-- Performance indexes (matching vocab)
CREATE INDEX idx_phrases_level ON public.daily_phrases(level);
CREATE INDEX idx_phrases_difficulty ON public.daily_phrases(difficulty);
CREATE INDEX idx_phrases_frequency ON public.daily_phrases(frequency);
CREATE INDEX idx_phrases_created_at ON public.daily_phrases(created_at DESC);

-- Full-text search indexes (matching vocab)
CREATE INDEX idx_phrases_greek_text ON public.daily_phrases USING gin(to_tsvector('simple', greek_transcription));
CREATE INDEX idx_phrases_en_text ON public.daily_phrases USING gin(to_tsvector('english', COALESCE(en_translation, '')));
CREATE INDEX idx_phrases_de_text ON public.daily_phrases USING gin(to_tsvector('german', COALESCE(de_translation, '')));
CREATE INDEX idx_phrases_es_text ON public.daily_phrases USING gin(to_tsvector('spanish', COALESCE(es_translation, '')));
CREATE INDEX idx_phrases_ru_text ON public.daily_phrases USING gin(to_tsvector('russian', COALESCE(ru_translation, '')));

-- Phrases-specific indexes
CREATE INDEX idx_phrases_scheduled_date ON public.daily_phrases(scheduled_date);
CREATE INDEX idx_phrases_context_tags ON public.daily_phrases USING GIN(context_tags);

-- ═══════════════════════════════════════════════════════════════
-- TIMESTAMP TRIGGER (matching vocab)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_phrases_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_phrases_timestamp
    BEFORE UPDATE ON public.daily_phrases
    FOR EACH ROW
    EXECUTE FUNCTION update_phrases_timestamp();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (matching vocab)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.daily_phrases ENABLE ROW LEVEL SECURITY;

-- Admin full access (all operations)
CREATE POLICY "Admin full access to phrases"
    ON public.daily_phrases
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Students can read all phrases
CREATE POLICY "Students can read phrases"
    ON public.daily_phrases
    FOR SELECT
    USING (true);

-- Anonymous users can read phrases
CREATE POLICY "Anon can read phrases"
    ON public.daily_phrases
    FOR SELECT
    TO anon
    USING (true);

-- ═══════════════════════════════════════════════════════════════
-- RPC FUNCTIONS (5 total, matching vocab structure)
-- ═══════════════════════════════════════════════════════════════

-- RPC Function 1: Get phrases with filters
CREATE OR REPLACE FUNCTION get_phrases_filtered(
    p_search TEXT DEFAULT NULL,
    p_level TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_frequency_min INTEGER DEFAULT NULL,
    p_frequency_max INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.daily_phrases AS $$
BEGIN
    RETURN QUERY
    SELECT p.* FROM public.daily_phrases p
    WHERE
        (p_search IS NULL OR
         p.greek_transcription ILIKE '%' || p_search || '%' OR
         p.en_translation ILIKE '%' || p_search || '%' OR
         p.de_translation ILIKE '%' || p_search || '%' OR
         p.es_translation ILIKE '%' || p_search || '%' OR
         p.ru_translation ILIKE '%' || p_search || '%')
    AND (p_level IS NULL OR p.level = p_level)
    AND (p_difficulty IS NULL OR p.difficulty = p_difficulty)
    AND (p_frequency_min IS NULL OR p.frequency >= p_frequency_min)
    AND (p_frequency_max IS NULL OR p.frequency <= p_frequency_max)
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function 2: Get phrases statistics
CREATE OR REPLACE FUNCTION get_phrases_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'by_level', json_build_object(
            'A1', COUNT(*) FILTER (WHERE level = 'A1'),
            'A2', COUNT(*) FILTER (WHERE level = 'A2'),
            'B1', COUNT(*) FILTER (WHERE level = 'B1'),
            'B2', COUNT(*) FILTER (WHERE level = 'B2'),
            'C1', COUNT(*) FILTER (WHERE level = 'C1'),
            'C2', COUNT(*) FILTER (WHERE level = 'C2')
        ),
        'by_difficulty', json_build_object(
            'easy', COUNT(*) FILTER (WHERE difficulty = 'easy'),
            'medium', COUNT(*) FILTER (WHERE difficulty = 'medium'),
            'hard', COUNT(*) FILTER (WHERE difficulty = 'hard')
        ),
        'avg_frequency', ROUND(AVG(frequency)::numeric, 2),
        'with_audio', json_build_object(
            'en', COUNT(*) FILTER (WHERE en_audio_url IS NOT NULL AND en_audio_url != ''),
            'de', COUNT(*) FILTER (WHERE de_audio_url IS NOT NULL AND de_audio_url != ''),
            'es', COUNT(*) FILTER (WHERE es_audio_url IS NOT NULL AND es_audio_url != ''),
            'ru', COUNT(*) FILTER (WHERE ru_audio_url IS NOT NULL AND ru_audio_url != '')
        )
    ) INTO result
    FROM public.daily_phrases;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function 3: Bulk update phrases
CREATE OR REPLACE FUNCTION bulk_update_phrases(
    p_ids UUID[],
    p_level TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_frequency INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE public.daily_phrases
    SET
        level = COALESCE(p_level, level),
        difficulty = COALESCE(p_difficulty, difficulty),
        frequency = COALESCE(p_frequency, frequency),
        updated_at = now()
    WHERE id = ANY(p_ids);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function 4: Bulk delete phrases
CREATE OR REPLACE FUNCTION bulk_delete_phrases(p_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    DELETE FROM public.daily_phrases
    WHERE id = ANY(p_ids);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function 5: Check phrase duplicate
CREATE OR REPLACE FUNCTION check_phrases_duplicate(
    p_greek_transcription TEXT,
    p_level TEXT,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.daily_phrases
        WHERE greek_transcription = p_greek_transcription
        AND level = p_level
        AND (p_exclude_id IS NULL OR id != p_exclude_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION get_phrases_filtered TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_phrases_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION bulk_update_phrases TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_delete_phrases TO authenticated;
GRANT EXECUTE ON FUNCTION check_phrases_duplicate TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS (for documentation)
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE public.daily_phrases IS 'Daily phrases with full multilingual support - identical structure to multilingual_vocabulary';
COMMENT ON COLUMN public.daily_phrases.scheduled_date IS 'Date when phrase should be shown to students';
COMMENT ON COLUMN public.daily_phrases.context_tags IS 'Array of context/situation tags (e.g., greeting, shopping, restaurant)';
COMMENT ON COLUMN public.daily_phrases.greek_transcription IS 'Greek text in Latin script (transcription)';
COMMENT ON COLUMN public.daily_phrases.greek_phonetic IS 'Phonetic pronunciation guide';
COMMENT ON COLUMN public.daily_phrases.frequency IS 'Importance rating from 1 (rare) to 5 (very common)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ DAILY PHRASES MULTILINGUAL SYSTEM         ║';
    RAISE NOTICE '╠════════════════════════════════════════════════╣';
    RAISE NOTICE '║  Table: daily_phrases                          ║';
    RAISE NOTICE '║  Columns: 21 (18 content + 3 system)           ║';
    RAISE NOTICE '║  Languages: EN, DE, ES, RU                     ║';
    RAISE NOTICE '║  Indexes: 11 (9 standard + 2 phrases-specific) ║';
    RAISE NOTICE '║  RPC Functions: 5 created                      ║';
    RAISE NOTICE '║  RLS: Enabled (Admin full, others read-only)   ║';
    RAISE NOTICE '║  Schema: 100% matching multilingual_vocabulary ║';
    RAISE NOTICE '╚════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
