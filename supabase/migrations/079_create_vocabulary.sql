-- ═══════════════════════════════════════════════════════════════
-- MULTILINGUAL VOCABULARY SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Creates a standalone vocabulary management system with:
-- - 4 languages (EN, DE, ES, RU)
-- - CEFR levels (A1-C2)
-- - Difficulty ratings (easy, medium, hard)
-- - Frequency ratings (1-5)
-- - Audio support (URL + file path)
-- - Admin-only access
-- ═══════════════════════════════════════════════════════════════
-- WICHTIG: Vorher 078_cleanup_vocabulary.sql ausführen!
-- ═══════════════════════════════════════════════════════════════

-- Create multilingual_vocabulary table
CREATE TABLE public.multilingual_vocabulary (
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

    -- Learning metadata
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    frequency INTEGER NOT NULL DEFAULT 3 CHECK (frequency >= 1 AND frequency <= 5),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.users(id),

    -- Unique constraint
    CONSTRAINT unique_greek_level UNIQUE (greek_transcription, level)
);

-- Create indexes for fast filtering and searching
CREATE INDEX idx_vocab_level ON public.multilingual_vocabulary(level);
CREATE INDEX idx_vocab_difficulty ON public.multilingual_vocabulary(difficulty);
CREATE INDEX idx_vocab_frequency ON public.multilingual_vocabulary(frequency);
CREATE INDEX idx_vocab_created_at ON public.multilingual_vocabulary(created_at DESC);

-- Full-text search indexes for translations
CREATE INDEX idx_vocab_greek_text ON public.multilingual_vocabulary USING gin(to_tsvector('simple', greek_transcription));
CREATE INDEX idx_vocab_en_text ON public.multilingual_vocabulary USING gin(to_tsvector('english', COALESCE(en_translation, '')));
CREATE INDEX idx_vocab_de_text ON public.multilingual_vocabulary USING gin(to_tsvector('german', COALESCE(de_translation, '')));
CREATE INDEX idx_vocab_es_text ON public.multilingual_vocabulary USING gin(to_tsvector('spanish', COALESCE(es_translation, '')));
CREATE INDEX idx_vocab_ru_text ON public.multilingual_vocabulary USING gin(to_tsvector('russian', COALESCE(ru_translation, '')));

-- Timestamp trigger function
CREATE FUNCTION update_vocab_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vocab_timestamp
    BEFORE UPDATE ON public.multilingual_vocabulary
    FOR EACH ROW
    EXECUTE FUNCTION update_vocab_timestamp();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.multilingual_vocabulary ENABLE ROW LEVEL SECURITY;

-- Admin full access (create, read, update, delete)
CREATE POLICY "Admin full access to vocabulary"
    ON public.multilingual_vocabulary
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Students can read all vocabulary (for learning)
CREATE POLICY "Students can read vocabulary"
    ON public.multilingual_vocabulary
    FOR SELECT
    USING (true);

-- Anonymous users can read vocabulary (public access)
CREATE POLICY "Anon can read vocabulary"
    ON public.multilingual_vocabulary
    FOR SELECT
    TO anon
    USING (true);

-- ═══════════════════════════════════════════════════════════════
-- RPC FUNCTIONS FOR ADMIN OPERATIONS
-- ═══════════════════════════════════════════════════════════════

-- RPC Function 1: Get vocabulary with filters
CREATE FUNCTION get_vocabulary_filtered(
    p_search TEXT DEFAULT NULL,
    p_level TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_frequency_min INTEGER DEFAULT NULL,
    p_frequency_max INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.multilingual_vocabulary AS $$
BEGIN
    RETURN QUERY
    SELECT v.* FROM public.multilingual_vocabulary v
    WHERE
        (p_search IS NULL OR
         v.greek_transcription ILIKE '%' || p_search || '%' OR
         v.en_translation ILIKE '%' || p_search || '%' OR
         v.de_translation ILIKE '%' || p_search || '%' OR
         v.es_translation ILIKE '%' || p_search || '%' OR
         v.ru_translation ILIKE '%' || p_search || '%')
    AND (p_level IS NULL OR v.level = p_level)
    AND (p_difficulty IS NULL OR v.difficulty = p_difficulty)
    AND (p_frequency_min IS NULL OR v.frequency >= p_frequency_min)
    AND (p_frequency_max IS NULL OR v.frequency <= p_frequency_max)
    ORDER BY v.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function 2: Get vocabulary statistics
CREATE FUNCTION get_vocabulary_stats()
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
    FROM public.multilingual_vocabulary;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function 3: Bulk update
CREATE FUNCTION bulk_update_vocabulary(
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

    UPDATE public.multilingual_vocabulary
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

-- RPC Function 4: Bulk delete
CREATE FUNCTION bulk_delete_vocabulary(p_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    DELETE FROM public.multilingual_vocabulary
    WHERE id = ANY(p_ids);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function 5: Check duplicate
CREATE FUNCTION check_vocabulary_duplicate(
    p_greek_transcription TEXT,
    p_level TEXT,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.multilingual_vocabulary
        WHERE greek_transcription = p_greek_transcription
        AND level = p_level
        AND (p_exclude_id IS NULL OR id != p_exclude_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_vocabulary_filtered TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_vocabulary_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION bulk_update_vocabulary TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_delete_vocabulary TO authenticated;
GRANT EXECUTE ON FUNCTION check_vocabulary_duplicate TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ MULTILINGUAL VOCABULARY SYSTEM CREATED    ║';
    RAISE NOTICE '╠════════════════════════════════════════════════╣';
    RAISE NOTICE '║  Table: multilingual_vocabulary                ║';
    RAISE NOTICE '║  Languages: EN, DE, ES, RU                     ║';
    RAISE NOTICE '║  Levels: A1, A2, B1, B2, C1, C2                ║';
    RAISE NOTICE '║  RPC Functions: 5 created                      ║';
    RAISE NOTICE '║  RLS: Enabled (Admin full, others read-only)   ║';
    RAISE NOTICE '╚════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
