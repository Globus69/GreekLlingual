-- Diagnostic queries for practice modes configuration

-- 1. Check if learning_items table has any data
SELECT 'Total learning items' AS check_name, COUNT(*)::TEXT AS result
FROM learning_items;

-- 2. Check if practice_modes_config column has any non-null values
SELECT 'Items with practice_modes_config' AS check_name, COUNT(*)::TEXT AS result
FROM learning_items
WHERE practice_modes_config IS NOT NULL;

-- 3. Show first 5 items with their practice config
SELECT
    id,
    english,
    greek,
    practice_modes_config
FROM learning_items
LIMIT 5;

-- 4. Check if any items have practice modes enabled
SELECT
    'Items with enabled=true' AS check_name,
    COUNT(*)::TEXT AS result
FROM learning_items
WHERE practice_modes_config->>'enabled' = 'true';

-- 5. Show the raw JSONB structure of practice_modes_config
SELECT
    english,
    jsonb_pretty(practice_modes_config) AS config_pretty
FROM learning_items
WHERE practice_modes_config IS NOT NULL
LIMIT 3;

-- 6. Check if admin_update_practice_config function works
-- (This shows the function exists and what parameters it expects)
SELECT
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_name = 'admin_update_practice_config';
