# Practice Modes Migration Guide

## 📁 Migration File
`067_add_practice_modes.sql` - Adds Quizlet-style practice modes system

## 🚀 How to Apply This Migration

### Method 1: Supabase CLI (Recommended)

1. **Make sure Supabase CLI is installed**:
   ```bash
   which supabase
   # Should return: /opt/homebrew/bin/supabase
   ```

2. **Link to your remote Supabase project** (if not already linked):
   ```bash
   supabase link --project-ref bzdzqmnxycnudflcnmzj
   ```

   You'll be prompted for:
   - Database password (from your Supabase project settings)

3. **Apply the migration**:
   ```bash
   # Option A: Push this specific migration
   supabase db push

   # Option B: Apply all pending migrations
   supabase migration up
   ```

4. **Verify migration**:
   ```bash
   # Run the verification script
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.bzdzqmnxycnudflcnmzj.supabase.co:5432/postgres" -f verify_practice_modes.sql
   ```

---

### Method 2: Supabase Dashboard (Web UI)

1. **Open Supabase Dashboard**:
   - Go to: https://app.supabase.com/project/bzdzqmnxycnudflcnmzj
   - Navigate to **SQL Editor** in left sidebar

2. **Open the migration file**:
   ```bash
   # Copy the SQL to clipboard (Mac)
   cat supabase/migrations/067_add_practice_modes.sql | pbcopy

   # Or view it
   cat supabase/migrations/067_add_practice_modes.sql
   ```

3. **Execute in SQL Editor**:
   - Click **+ New query**
   - Paste the SQL content
   - Click **Run** (or Cmd+Enter)
   - Wait for success message ✅

4. **Verify migration**:
   - Use the verification queries below

---

### Method 3: Direct psql Connection

1. **Get your database URL from Supabase**:
   - Dashboard → Project Settings → Database
   - Copy the "Connection string" (URI format)

2. **Run migration**:
   ```bash
   # Replace [YOUR-PASSWORD] with actual password
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.bzdzqmnxycnudflcnmzj.supabase.co:5432/postgres" \
     -f supabase/migrations/067_add_practice_modes.sql
   ```

---

## ✅ Verification Queries

After applying the migration, run these in the SQL Editor to verify:

```sql
-- 1. Check if practice_modes_config column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'learning_items'
  AND column_name = 'practice_modes_config';
-- Expected: 1 row with jsonb type

-- 2. Check if practice_attempts table exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'practice_attempts'
ORDER BY ordinal_position;
-- Expected: ~12 rows (id, user_id, item_id, mode_type, success, score, etc.)

-- 3. Check if RPC functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'get_practice_config',
  'record_practice_attempt',
  'get_practice_stats',
  'admin_update_practice_config'
)
ORDER BY routine_name;
-- Expected: 4 rows

-- 4. Check if indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('learning_items', 'practice_attempts')
  AND indexname LIKE '%practice%';
-- Expected: 3 rows

-- 5. Test get_practice_config function (replace with real IDs)
SELECT get_practice_config(
  '<some-item-id>'::uuid,
  '<some-user-id>'::uuid,
  'matching'
);
-- Expected: JSON object with unlocked, config, user_reps, threshold

-- 6. Check RLS policies on practice_attempts
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'practice_attempts';
-- Expected: 4 rows (select_own, insert_own, select_admin, delete_admin)
```

---

## 🔧 Troubleshooting

### Error: "relation 'learning_items' does not exist"
**Solution**: You need to run the core migrations first. The `learning_items` table should already exist from migration `050_web_prototype_setup.sql` or `046_schema.sql`.

### Error: "function get_practice_config already exists"
**Solution**: Migration was already applied. Check with:
```sql
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_practice_config';
```

### Error: "column practice_modes_config already exists"
**Solution**: Migration was already applied. Verify with:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'learning_items' AND column_name = 'practice_modes_config';
```

### Error: "permission denied for schema public"
**Solution**: Make sure you're using the correct database user. The Supabase service role or postgres user should have full permissions.

### Error: "extension 'uuid-ossp' does not exist"
**Solution**: This extension should already be installed in Supabase. If not:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 📊 What This Migration Does

### Database Changes:
1. **Adds `practice_modes_config` JSONB column** to `learning_items`
   - Stores configuration for matching, multiple_choice, write_input modes
   - Includes enabled flag, available modes, activation threshold, difficulty settings

2. **Creates `practice_attempts` table**
   - Tracks all practice sessions: user_id, item_id, mode_type
   - Records: success, score (0-100), time_seconds, mistakes
   - Stores FSRS rating (1-4) for integration
   - Includes metadata JSONB for extensibility

3. **Adds 4 RPC Functions**:
   - `get_practice_config()` - Check if practice mode unlocked for user
   - `record_practice_attempt()` - Save practice session results
   - `get_practice_stats()` - Aggregate stats by mode/item/user
   - `admin_update_practice_config()` - Admin-only config updates

4. **Creates 3 Indexes**:
   - `idx_practice_modes_enabled` - Fast filtering of enabled items
   - `idx_practice_attempts_user_item` - User history lookup
   - `idx_practice_attempts_mode` - Stats by mode

5. **Adds RLS Policies**:
   - Students can view/insert own attempts
   - Admins can view/delete all attempts

---

## 🎯 Next Steps After Migration

1. **Test Admin Configuration**:
   - Go to admin panel
   - Edit a learning item
   - Expand "Practice Modes Configuration"
   - Enable modes and configure settings
   - Save and verify

2. **Test Student Practice**:
   - Log in as student
   - View dashboard → Practice Modes section
   - Check unlock status (locked if < threshold FSRS reps)
   - Complete FSRS reviews to unlock
   - Play practice games

3. **Monitor Database**:
   ```sql
   -- Check practice attempts
   SELECT user_id, item_id, mode_type, score, fsrs_rating, created_at
   FROM practice_attempts
   ORDER BY created_at DESC
   LIMIT 10;

   -- Check enabled practice items
   SELECT id, english, greek,
          practice_modes_config->>'enabled' as enabled,
          practice_modes_config->'available_modes' as modes
   FROM learning_items
   WHERE (practice_modes_config->>'enabled')::boolean = true;
   ```

---

## 📝 Migration File Location

- **Source**: `database/migrations/067_add_practice_modes.sql`
- **Supabase**: `supabase/migrations/067_add_practice_modes.sql` (this directory)

Both files are identical. The Supabase CLI will automatically detect and apply migrations from the `supabase/migrations/` directory.

---

For detailed implementation documentation, see: `PRACTICE-MODES-IMPLEMENTATION.md` in the project root.
