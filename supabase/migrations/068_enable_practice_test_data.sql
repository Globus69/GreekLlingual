-- Enable Practice Modes for Test Data
-- Migration: 068
-- Description: Enable practice modes for "Hello" item as test data

-- Update "Hello" item to enable practice modes
UPDATE learning_items
SET practice_modes_config = jsonb_build_object(
  'enabled', true,
  'available_modes', ARRAY['matching']::text[],
  'activation_threshold', 0,
  'difficulty_settings', jsonb_build_object(
    'matching', jsonb_build_object(
      'num_pairs', 6,
      'time_limit', 60,
      'mistakes_allowed', 10
    ),
    'multiple_choice', jsonb_build_object(
      'num_options', 4,
      'time_limit', 30,
      'num_questions', 5
    ),
    'write_input', jsonb_build_object(
      'max_attempts', 3,
      'tolerance', 0.8,
      'time_limit', 45
    )
  )
),
updated_at = NOW()
WHERE english = 'Hello'
  AND type = 'vocabulary';

-- Verify the update
SELECT id, english, greek, practice_modes_config
FROM learning_items
WHERE practice_modes_config->>'enabled' = 'true';
