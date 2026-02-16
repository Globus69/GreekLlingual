-- ============================================================================
-- Migration 067: Add Practice Modes System (FIXED)
-- ============================================================================
-- Purpose: Adds Quizlet-style practice modes with backend-configurable settings
-- FIXED: Uses role = 'admin' instead of is_admin column
-- ============================================================================

-- ============================================================================
-- 1. Add practice_modes_config JSONB column to learning_items
-- ============================================================================

ALTER TABLE learning_items
ADD COLUMN IF NOT EXISTS practice_modes_config JSONB DEFAULT '{
  "enabled": false,
  "available_modes": [],
  "activation_threshold": 3,
  "difficulty_settings": {
    "matching": {
      "num_pairs": 6,
      "time_limit_sec": null
    },
    "multiple_choice": {
      "num_options": 4,
      "time_limit_sec": 30,
      "show_hint": true
    },
    "write_input": {
      "tolerance": "lenient",
      "show_phonetic": true,
      "max_attempts": 3
    }
  }
}'::jsonb;

COMMENT ON COLUMN learning_items.practice_modes_config IS
'Backend-configurable practice mode settings (matching, multiple_choice, write_input)';

-- ============================================================================
-- 2. Create practice_attempts table for tracking user practice sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
  mode_type TEXT NOT NULL CHECK (mode_type IN ('matching', 'multiple_choice', 'write_input')),

  -- Session metrics
  success BOOLEAN NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  time_seconds INTEGER NOT NULL CHECK (time_seconds >= 0),
  mistakes INTEGER NOT NULL DEFAULT 0 CHECK (mistakes >= 0),

  -- FSRS integration
  fsrs_rating INTEGER CHECK (fsrs_rating IN (1, 2, 3, 4)),

  -- Optional metadata (e.g., specific errors, card pairs shown, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index for fast queries
  CONSTRAINT fk_practice_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_practice_item FOREIGN KEY (item_id) REFERENCES learning_items(id)
);

COMMENT ON TABLE practice_attempts IS
'Tracks individual practice mode attempts with scores and FSRS ratings';

-- ============================================================================
-- 3. Create indexes for performance
-- ============================================================================

-- Fast lookup: Is practice enabled for this item?
CREATE INDEX IF NOT EXISTS idx_practice_modes_enabled
ON learning_items((practice_modes_config->>'enabled'))
WHERE (practice_modes_config->>'enabled')::boolean = true;

-- Fast lookup: User's practice history
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_item
ON practice_attempts(user_id, item_id, created_at DESC);

-- Fast lookup: Practice stats by mode
CREATE INDEX IF NOT EXISTS idx_practice_attempts_mode
ON practice_attempts(mode_type, created_at DESC);

-- ============================================================================
-- 4. RPC Function: get_practice_config
-- ============================================================================
-- Purpose: Check if practice mode is unlocked for user and return config
-- Returns: unlocked status, config, user reps, threshold
-- ============================================================================

CREATE OR REPLACE FUNCTION get_practice_config(
  p_item_id UUID,
  p_user_id UUID,
  p_mode_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config JSONB;
  v_enabled BOOLEAN;
  v_available_modes JSONB;
  v_threshold INTEGER;
  v_user_reps INTEGER;
  v_unlocked BOOLEAN;
  v_result JSON;
BEGIN
  -- Get practice config from learning_items
  SELECT practice_modes_config
  INTO v_config
  FROM learning_items
  WHERE id = p_item_id;

  IF v_config IS NULL THEN
    RETURN json_build_object(
      'unlocked', false,
      'config', null,
      'user_reps', 0,
      'threshold', 0,
      'error', 'Item not found'
    );
  END IF;

  -- Extract config fields
  v_enabled := (v_config->>'enabled')::boolean;
  v_available_modes := v_config->'available_modes';
  v_threshold := (v_config->>'activation_threshold')::integer;

  -- Get user's FSRS reps for this item
  SELECT COALESCE(fsrs_reps, 0)
  INTO v_user_reps
  FROM student_progress
  WHERE item_id = p_item_id AND student_id = p_user_id;

  IF v_user_reps IS NULL THEN
    v_user_reps := 0;
  END IF;

  -- Check if unlocked: enabled AND mode available AND threshold met
  v_unlocked := v_enabled
    AND (v_available_modes ? p_mode_type)
    AND (v_user_reps >= v_threshold);

  -- Build result
  v_result := json_build_object(
    'unlocked', v_unlocked,
    'config', v_config,
    'user_reps', v_user_reps,
    'threshold', v_threshold,
    'enabled', v_enabled,
    'mode_available', (v_available_modes ? p_mode_type)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_practice_config IS
'Check if practice mode is unlocked for user based on FSRS reps threshold';

-- ============================================================================
-- 5. RPC Function: record_practice_attempt
-- ============================================================================
-- Purpose: Record a practice session attempt with score and FSRS rating
-- Returns: success boolean
-- ============================================================================

CREATE OR REPLACE FUNCTION record_practice_attempt(
  p_user_id UUID,
  p_item_id UUID,
  p_mode_type TEXT,
  p_success BOOLEAN,
  p_score INTEGER,
  p_time_seconds INTEGER,
  p_mistakes INTEGER,
  p_fsrs_rating INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs
  IF p_mode_type NOT IN ('matching', 'multiple_choice', 'write_input') THEN
    RAISE EXCEPTION 'Invalid mode_type: %', p_mode_type;
  END IF;

  IF p_fsrs_rating NOT IN (1, 2, 3, 4) THEN
    RAISE EXCEPTION 'Invalid fsrs_rating: % (must be 1-4)', p_fsrs_rating;
  END IF;

  IF p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'Invalid score: % (must be 0-100)', p_score;
  END IF;

  -- Insert practice attempt
  INSERT INTO practice_attempts (
    user_id,
    item_id,
    mode_type,
    success,
    score,
    time_seconds,
    mistakes,
    fsrs_rating,
    metadata
  ) VALUES (
    p_user_id,
    p_item_id,
    p_mode_type,
    p_success,
    p_score,
    p_time_seconds,
    p_mistakes,
    p_fsrs_rating,
    p_metadata
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to record practice attempt: %', SQLERRM;
    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION record_practice_attempt IS
'Record a practice mode attempt with score, time, mistakes, and FSRS rating';

-- ============================================================================
-- 6. RPC Function: get_practice_stats
-- ============================================================================
-- Purpose: Get aggregate practice statistics for a user/item
-- Returns: stats by mode (avg score, total attempts, best score, etc.)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_practice_stats(
  p_user_id UUID,
  p_item_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH stats AS (
    SELECT
      mode_type,
      COUNT(*) AS total_attempts,
      COUNT(*) FILTER (WHERE success = true) AS successful_attempts,
      ROUND(AVG(score), 1) AS avg_score,
      MAX(score) AS best_score,
      MIN(score) AS worst_score,
      ROUND(AVG(time_seconds), 1) AS avg_time_seconds,
      SUM(mistakes) AS total_mistakes,
      ROUND(AVG(fsrs_rating), 2) AS avg_fsrs_rating
    FROM practice_attempts
    WHERE user_id = p_user_id
      AND item_id = p_item_id
      AND created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY mode_type
  )
  SELECT json_agg(
    json_build_object(
      'mode_type', mode_type,
      'total_attempts', total_attempts,
      'successful_attempts', successful_attempts,
      'success_rate', ROUND((successful_attempts::numeric / NULLIF(total_attempts, 0)) * 100, 1),
      'avg_score', avg_score,
      'best_score', best_score,
      'worst_score', worst_score,
      'avg_time_seconds', avg_time_seconds,
      'total_mistakes', total_mistakes,
      'avg_fsrs_rating', avg_fsrs_rating
    )
  )
  INTO v_result
  FROM stats;

  IF v_result IS NULL THEN
    v_result := '[]'::json;
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_practice_stats IS
'Get aggregate practice statistics for user/item over specified days';

-- ============================================================================
-- 7. RPC Function: admin_update_practice_config (FIXED)
-- ============================================================================
-- Purpose: Admin-only function to update practice mode configuration
-- Returns: success boolean
-- FIXED: Uses role = 'admin' instead of is_admin column
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_update_practice_config(
  p_user_id UUID,
  p_item_id UUID,
  p_config JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Check if user is admin (FIXED: use role column)
  SELECT role INTO v_user_role
  FROM users
  WHERE id = p_user_id;

  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: User is not an admin (role: %)', v_user_role;
  END IF;

  -- Update practice_modes_config
  UPDATE learning_items
  SET practice_modes_config = p_config,
      updated_at = NOW()
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Learning item not found: %', p_item_id;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update practice config: %', SQLERRM;
    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION admin_update_practice_config IS
'Admin-only: Update practice mode configuration for a learning item';

-- ============================================================================
-- 8. Row Level Security (RLS) Policies (FIXED)
-- ============================================================================

-- Enable RLS on practice_attempts
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own practice attempts
CREATE POLICY practice_attempts_select_own
ON practice_attempts
FOR SELECT
USING (
  user_id = auth.uid()
);

-- Policy: Students can insert their own practice attempts
CREATE POLICY practice_attempts_insert_own
ON practice_attempts
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- Policy: Admins can view all practice attempts (FIXED: use role)
CREATE POLICY practice_attempts_select_admin
ON practice_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins can delete practice attempts (FIXED: use role)
CREATE POLICY practice_attempts_delete_admin
ON practice_attempts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================================================
-- 9. Grant permissions to authenticated users
-- ============================================================================

GRANT SELECT ON learning_items TO authenticated;
GRANT SELECT, INSERT ON practice_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION get_practice_config TO authenticated;
GRANT EXECUTE ON FUNCTION record_practice_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION get_practice_stats TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_practice_config TO authenticated;

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Test queries (commented out - uncomment to run manually):
-- SELECT practice_modes_config FROM learning_items LIMIT 1;
-- SELECT get_practice_config('<item_id>', '<user_id>', 'matching');
-- SELECT get_practice_stats('<user_id>', '<item_id>', 30);
