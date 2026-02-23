-- Migration 103: Add acknowledged_manual_version to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS acknowledged_manual_version TEXT DEFAULT '0.0.0';

-- Comment for documentation
COMMENT ON COLUMN users.acknowledged_manual_version IS 'Stores the version of the user manual the user has already seen/acknowledged.';
