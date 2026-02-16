-- Check users table structure to find admin field
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check sample user data
SELECT id, name, role
FROM users
LIMIT 3;
