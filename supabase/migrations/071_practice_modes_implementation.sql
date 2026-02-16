-- ================================================
-- Practice Modes Implementation Migration
-- Created: 2026-02-16
-- Description: Adds practice_modes_config to learning_items,
--              creates practice_attempts table, and implements RPCs
-- ================================================

-- ================================================
-- 1. Add practice_modes_config column to learning_items
-- ================================================
ALTER TABLE learning_items
ADD COLUMN IF NOT EXISTS practice_modes_config JSONB DEFAULT '{
  "enabled": false,
  "available_modes": [],
  "activation_threshold": 3,
  "difficulty_settings": {
    "matching": {
      "num_pairs": 6,
      "time_limit": 60
    },
    "multiple_choice": {
      "num_options": 4,
      "time_limit": 30
    },
    "write_input": {
      "fuzzy_threshold": 0.8,
      "time_limit": 45
    }
  }
}'::jsonb;

-- Add index for faster queries on enabled practice modes
CREATE INDEX IF NOT EXISTS idx_learning_items_practice_enabled
ON learning_items ((practice_modes_config->>'enabled'))
WHERE (practice_modes_config->>'enabled')::boolean = true;

-- ================================================
-- 2. Create practice_attempts table
-- ================================================
CREATE TABLE IF NOT EXISTS practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
  mode_type TEXT NOT NULL CHECK (mode_type IN ('matching', 'multiple_choice', 'write_input')),
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  time_taken INTEGER NOT NULL CHECK (time_taken >= 0), -- in seconds
  fsrs_rating INTEGER CHECK (fsrs_rating >= 1 AND fsrs_rating <= 4), -- 1=Again, 2=Hard, 3=Good, 4=Easy
  metadata JSONB DEFAULT '{}'::jsonb, -- for storing additional data like mistakes, hints used, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT valid_time CHECK (time_taken >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_id ON practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_item_id ON practice_attempts(item_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_mode_type ON practice_attempts(mode_type);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_created_at ON practice_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_item ON practice_attempts(user_id, item_id);

-- ================================================
-- 3. RLS Policies for practice_attempts
-- ================================================

-- Enable RLS
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own practice attempts
CREATE POLICY "Users can view own practice attempts"
ON practice_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own practice attempts
CREATE POLICY "Users can insert own practice attempts"
ON practice_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all practice attempts
CREATE POLICY "Admins can view all practice attempts"
ON practice_attempts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins can update practice_modes_config in learning_items
CREATE POLICY "Admins can update practice config"
ON learning_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ================================================
-- 4. RPC: get_practice_config
-- Description: Fetches practice config for items user has access to
-- ================================================
CREATE OR REPLACE FUNCTION get_practice_config(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  item_id UUID,
  item_type TEXT,
  content JSONB,
  practice_config JSONB,
  user_progress INTEGER,
  is_unlocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Use provided user_id or fall back to auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    li.id AS item_id,
    li.item_type,
    li.content,
    li.practice_modes_config AS practice_config,
    COALESCE(up.review_count, 0) AS user_progress,
    CASE
      WHEN (li.practice_modes_config->>'enabled')::boolean = true
        AND COALESCE(up.review_count, 0) >= COALESCE((li.practice_modes_config->'activation_threshold')::integer, 3)
      THEN true
      ELSE false
    END AS is_unlocked
  FROM learning_items li
  LEFT JOIN user_progress up ON li.id = up.item_id AND up.user_id = v_user_id
  WHERE (li.practice_modes_config->>'enabled')::boolean = true
  ORDER BY li.created_at DESC;
END;
$$;

-- ================================================
-- 5. RPC: record_practice_attempt
-- Description: Records a practice attempt and optionally updates FSRS
-- ================================================
CREATE OR REPLACE FUNCTION record_practice_attempt(
  p_item_id UUID,
  p_mode_type TEXT,
  p_score DECIMAL,
  p_time_taken INTEGER,
  p_fsrs_rating INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_attempt_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Validate mode_type
  IF p_mode_type NOT IN ('matching', 'multiple_choice', 'write_input') THEN
    RAISE EXCEPTION 'Invalid mode_type: %', p_mode_type;
  END IF;

  -- Validate score
  IF p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'Score must be between 0 and 100';
  END IF;

  -- Validate FSRS rating if provided
  IF p_fsrs_rating IS NOT NULL AND (p_fsrs_rating < 1 OR p_fsrs_rating > 4) THEN
    RAISE EXCEPTION 'FSRS rating must be between 1 and 4';
  END IF;

  -- Insert practice attempt
  INSERT INTO practice_attempts (
    user_id,
    item_id,
    mode_type,
    score,
    time_taken,
    fsrs_rating,
    metadata,
    created_at
  ) VALUES (
    v_user_id,
    p_item_id,
    p_mode_type,
    p_score,
    p_time_taken,
    p_fsrs_rating,
    p_metadata,
    now()
  )
  RETURNING id INTO v_attempt_id;

  -- If FSRS rating provided, update user_progress
  IF p_fsrs_rating IS NOT NULL THEN
    -- This will be handled by the frontend calling the existing FSRS functions
    -- We just record it here for analytics
    NULL;
  END IF;

  RETURN v_attempt_id;
END;
$$;

-- ================================================
-- 6. RPC: get_practice_stats
-- Description: Gets practice statistics for a user
-- ================================================
CREATE OR REPLACE FUNCTION get_practice_stats(
  p_user_id UUID DEFAULT NULL,
  p_item_id UUID DEFAULT NULL,
  p_mode_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  attempt_id UUID,
  item_id UUID,
  mode_type TEXT,
  score DECIMAL,
  time_taken INTEGER,
  fsrs_rating INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  item_content JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Use provided user_id or fall back to auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if user is requesting their own stats or is admin
  IF v_user_id != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Can only view own stats unless admin';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    pa.id AS attempt_id,
    pa.item_id,
    pa.mode_type,
    pa.score,
    pa.time_taken,
    pa.fsrs_rating,
    pa.metadata,
    pa.created_at,
    li.content AS item_content
  FROM practice_attempts pa
  JOIN learning_items li ON pa.item_id = li.id
  WHERE pa.user_id = v_user_id
    AND (p_item_id IS NULL OR pa.item_id = p_item_id)
    AND (p_mode_type IS NULL OR pa.mode_type = p_mode_type)
  ORDER BY pa.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ================================================
-- 7. RPC: admin_update_practice_config
-- Description: Admin function to update practice config for an item
-- ================================================
CREATE OR REPLACE FUNCTION admin_update_practice_config(
  p_item_id UUID,
  p_config JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Validate config structure (basic validation)
  IF NOT (p_config ? 'enabled') THEN
    RAISE EXCEPTION 'Config must contain "enabled" field';
  END IF;

  -- Update practice_modes_config
  UPDATE learning_items
  SET
    practice_modes_config = p_config,
    updated_at = now()
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Learning item not found: %', p_item_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- ================================================
-- 8. Grant permissions
-- ================================================
GRANT EXECUTE ON FUNCTION get_practice_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_practice_attempt(UUID, TEXT, DECIMAL, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_practice_stats(UUID, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_practice_config(UUID, JSONB) TO authenticated;

-- ================================================
-- 9. Add helpful comments
-- ================================================
COMMENT ON TABLE practice_attempts IS 'Stores user attempts at practice modes (matching, multiple choice, write input)';
COMMENT ON COLUMN learning_items.practice_modes_config IS 'Configuration for practice modes including enabled status, available modes, and difficulty settings';
COMMENT ON FUNCTION get_practice_config IS 'Fetches practice mode configuration for items accessible to the user';
COMMENT ON FUNCTION record_practice_attempt IS 'Records a practice attempt with score, time, and optional FSRS rating';
COMMENT ON FUNCTION get_practice_stats IS 'Retrieves practice statistics for a user with optional filtering';
COMMENT ON FUNCTION admin_update_practice_config IS 'Admin-only function to update practice mode configuration for an item';

-- ================================================
-- Migration complete
-- ================================================
