# Migration 086 - RLS Policies for Vocabulary & Phrases

**Date:** 2026-02-18
**Type:** Security - Row Level Security Policies
**Risk Level:** 🟢 Low (adds permissions, doesn't remove)

## Problem

CSV Import failed with error:
```
❌ new row violates row-level security policy for table "multilingual_vocabulary"
```

The tables `multilingual_vocabulary` and `daily_phrases` had RLS enabled but no policies, blocking all INSERT/UPDATE/DELETE operations.

## Solution

This migration adds RLS policies to allow authenticated users to:
- ✅ Read all entries
- ✅ Insert new entries
- ✅ Update existing entries
- ✅ Delete entries

## Changes

### Tables Affected
- `multilingual_vocabulary`
- `daily_phrases`

### Policies Created
For each table:
1. `Authenticated users can read [table]` - SELECT
2. `Authenticated users can insert [table]` - INSERT
3. `Authenticated users can update [table]` - UPDATE
4. `Authenticated users can delete [table]` - DELETE

### Permissions Granted
- `GRANT SELECT, INSERT, UPDATE, DELETE` to `authenticated` role

## Deployment Options

### Option 1: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy content from `086_add_rls_policies_for_vocabulary.sql`
5. Click **Run**
6. Verify: Check for success messages in output

### Option 2: Local psql
```bash
psql $DATABASE_URL -f database/migrations/086_add_rls_policies_for_vocabulary.sql
```

## Verification

After deployment, test:

1. **CSV Import Test:**
   ```
   - Go to /admin/vocab
   - Click Import
   - Select Vokabeln_import.csv
   - Choose Overwrite mode
   - Should succeed with "89 entries imported"
   ```

2. **Database Query:**
   ```sql
   -- Check policies exist
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('multilingual_vocabulary', 'daily_phrases');

   -- Should return 8 policies (4 per table)
   ```

3. **Manual Insert Test:**
   ```sql
   INSERT INTO multilingual_vocabulary (
       greek_transcription, level, difficulty, frequency
   ) VALUES (
       'τεστ', 'A1', 'easy', 3
   );
   -- Should succeed without RLS error
   ```

## Rollback

If needed, remove policies:

```sql
DROP POLICY IF EXISTS "Authenticated users can read multilingual_vocabulary" ON multilingual_vocabulary;
DROP POLICY IF EXISTS "Authenticated users can insert multilingual_vocabulary" ON multilingual_vocabulary;
DROP POLICY IF EXISTS "Authenticated users can update multilingual_vocabulary" ON multilingual_vocabulary;
DROP POLICY IF EXISTS "Authenticated users can delete multilingual_vocabulary" ON multilingual_vocabulary;

DROP POLICY IF EXISTS "Authenticated users can read daily_phrases" ON daily_phrases;
DROP POLICY IF EXISTS "Authenticated users can insert daily_phrases" ON daily_phrases;
DROP POLICY IF EXISTS "Authenticated users can update daily_phrases" ON daily_phrases;
DROP POLICY IF EXISTS "Authenticated users can delete daily_phrases" ON daily_phrases;

REVOKE SELECT, INSERT, UPDATE, DELETE ON multilingual_vocabulary FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON daily_phrases FROM authenticated;
```

## Impact

### Features Fixed
- ✅ CSV Import (Vocabulary)
- ✅ CSV Import (Daily Phrases)
- ✅ Manual CRUD operations in Admin UI
- ✅ Bulk operations (update, delete)

### No Breaking Changes
- All existing SELECT operations continue to work
- No data is modified or deleted
- Only adds permissions, doesn't restrict anything

## Security Note

This migration allows **all authenticated users** to modify vocabulary and phrases. If you need **admin-only** access, replace policies with:

```sql
-- Example: Admin-only INSERT
CREATE POLICY "Admins can insert multilingual_vocabulary"
    ON multilingual_vocabulary
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );
```

For now, we assume authenticated = trusted users with admin access.
