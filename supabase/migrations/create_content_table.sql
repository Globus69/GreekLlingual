-- Create content table for vocabulary, phrases, and grammar
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('vocabulary', 'phrase', 'grammar')),
    english TEXT NOT NULL,
    greek TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    phonetic TEXT,
    example_en TEXT,
    example_gr TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_level ON content(level);
CREATE INDEX IF NOT EXISTS idx_content_difficulty ON content(difficulty);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_content_english_search ON content USING gin(to_tsvector('english', english));
CREATE INDEX IF NOT EXISTS idx_content_greek_search ON content USING gin(to_tsvector('simple', greek));

-- Enable Row Level Security
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create policies for content table
-- Allow all authenticated users to read content
CREATE POLICY "Allow authenticated users to read content"
    ON content
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow only admins to insert content
CREATE POLICY "Allow admins to insert content"
    ON content
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Allow only admins to update content
CREATE POLICY "Allow admins to update content"
    ON content
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Allow only admins to delete content
CREATE POLICY "Allow admins to delete content"
    ON content
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_updated_at_trigger
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();
