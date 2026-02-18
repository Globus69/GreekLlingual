-- ═══════════════════════════════════════════════════════════════
-- SUPER CLEANUP: Find and drop ALL versions of vocabulary functions
-- ═══════════════════════════════════════════════════════════════
-- WICHTIG: Dieses Script ZUERST ausführen, dann 079_create_vocabulary.sql
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all functions matching 'get_vocabulary_stats' (any signature)
    FOR func_record IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_vocabulary_stats'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            func_record.schema_name,
            func_record.function_name,
            func_record.args
        );
        RAISE NOTICE 'Dropped function: %.%(%)',
            func_record.schema_name,
            func_record.function_name,
            func_record.args;
    END LOOP;

    -- Drop all functions matching 'get_vocabulary_filtered'
    FOR func_record IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_vocabulary_filtered'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            func_record.schema_name,
            func_record.function_name,
            func_record.args
        );
        RAISE NOTICE 'Dropped function: %.%(%)',
            func_record.schema_name,
            func_record.function_name,
            func_record.args;
    END LOOP;

    -- Drop all functions matching 'bulk_update_vocabulary'
    FOR func_record IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'bulk_update_vocabulary'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            func_record.schema_name,
            func_record.function_name,
            func_record.args
        );
        RAISE NOTICE 'Dropped function: %.%(%)',
            func_record.schema_name,
            func_record.function_name,
            func_record.args;
    END LOOP;

    -- Drop all functions matching 'bulk_delete_vocabulary'
    FOR func_record IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'bulk_delete_vocabulary'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            func_record.schema_name,
            func_record.function_name,
            func_record.args
        );
        RAISE NOTICE 'Dropped function: %.%(%)',
            func_record.schema_name,
            func_record.function_name,
            func_record.args;
    END LOOP;

    -- Drop all functions matching 'check_vocabulary_duplicate'
    FOR func_record IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'check_vocabulary_duplicate'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            func_record.schema_name,
            func_record.function_name,
            func_record.args
        );
        RAISE NOTICE 'Dropped function: %.%(%)',
            func_record.schema_name,
            func_record.function_name,
            func_record.args;
    END LOOP;

    -- Drop all functions matching 'update_vocab_timestamp'
    FOR func_record IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'update_vocab_timestamp'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            func_record.schema_name,
            func_record.function_name,
            func_record.args
        );
        RAISE NOTICE 'Dropped function: %.%(%)',
            func_record.schema_name,
            func_record.function_name,
            func_record.args;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ All vocabulary functions dropped';
END $$;

-- Now drop the table
DROP TABLE IF EXISTS public.multilingual_vocabulary CASCADE;

-- Success
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ SUPER CLEANUP COMPLETED                   ║';
    RAISE NOTICE '║  All vocabulary objects have been removed      ║';
    RAISE NOTICE '╚════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
