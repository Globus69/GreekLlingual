-- Migration 104: Add acknowledged_swipe_tutorial_version to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS acknowledged_swipe_tutorial_version TEXT DEFAULT '0.0.0';

-- Comment for documentation
COMMENT ON COLUMN users.acknowledged_swipe_tutorial_version IS 'Stores the version of the swipe-to-rate tutorial the user has already seen/acknowledged.';
