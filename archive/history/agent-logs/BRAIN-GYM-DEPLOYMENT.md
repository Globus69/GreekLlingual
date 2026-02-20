# Brain Gym RPC Functions - Deployment Instructions

**Created:** 2026-02-19
**Purpose:** Step-by-step guide to deploy Brain Gym RPC functions

---

## Overview

This guide walks you through deploying the new RPC functions for Brain Gym.

**What's New:**
- ✅ `get_all_vocabulary_cards` - Returns all vocabulary for practice
- ✅ `get_weak_vocabulary_cards` - Returns difficult/weak vocabulary
- ✅ Updated Brain Gym to use RPCs for all data sources

---

## Step 1: Verify Migration File

Check that the migration file exists:

```bash
ls -la supabase/migrations/073_brain_gym_rpc_functions.sql
```

Expected output:
```
-rw-r--r--  1 user  staff  5234 Feb 19 [time] supabase/migrations/073_brain_gym_rpc_functions.sql
```

---

## Step 2: Deploy to Supabase

### Option A: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   ```bash
   cat supabase/migrations/073_brain_gym_rpc_functions.sql | pbcopy
   ```
   (This copies the file to your clipboard)

4. **Paste and Execute**
   - Paste the SQL into the editor
   - Click "Run" or press `Cmd+Enter`

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check for any error messages

---

### Option B: Via Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Navigate to project directory
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard

# Apply migration
supabase db push

# Or apply specific migration
supabase migration up 073_brain_gym_rpc_functions.sql
```

---

## Step 3: Verify Functions Created

Run this query in Supabase SQL Editor to verify:

```sql
SELECT
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name IN (
    'get_all_vocabulary_cards',
    'get_weak_vocabulary_cards'
)
ORDER BY routine_name;
```

**Expected Output:**
```
routine_name              | routine_type | data_type
--------------------------|--------------|----------
get_all_vocabulary_cards  | FUNCTION     | SETOF record
get_weak_vocabulary_cards | FUNCTION     | SETOF record
```

---

## Step 4: Test RPC Functions

### Test 1: Get All Vocabulary Cards

```sql
-- Replace YOUR-USER-ID with your actual user ID
SELECT * FROM get_all_vocabulary_cards(
    'YOUR-USER-ID'::UUID,
    5  -- limit to 5 cards for testing
);
```

**Expected:** Should return 5 vocabulary cards (or fewer if you have less than 5).

---

### Test 2: Get Weak Vocabulary Cards

```sql
-- Replace YOUR-USER-ID with your actual user ID
SELECT * FROM get_weak_vocabulary_cards(
    'YOUR-USER-ID'::UUID,
    5
);
```

**Expected:** Returns cards with:
- `fsrs_difficulty > 7.0`
- OR `fsrs_lapses >= 3`
- OR `fsrs_state = 'relearning'`

**Note:** May return 0 rows if you have no weak cards yet.

---

## Step 5: Create Test Data (Optional)

If you want to test "Weak Words" but have no weak cards, create test data:

```sql
-- Get your user ID
SELECT id, email FROM auth.users LIMIT 5;

-- Get a vocabulary card ID
SELECT id, english, greek FROM learning_items WHERE type = 'vocabulary' LIMIT 5;

-- Create weak card (high difficulty)
INSERT INTO student_progress (
    student_id,
    item_id,
    fsrs_difficulty,
    fsrs_stability,
    fsrs_due,
    fsrs_reps,
    fsrs_lapses,
    fsrs_state,
    fsrs_last_review,
    updated_at
) VALUES (
    'YOUR-USER-ID'::UUID,         -- Replace with your user ID
    'VOCABULARY-CARD-ID'::UUID,   -- Replace with a card ID
    8.5,                           -- High difficulty (> 7.0)
    2.0,                           -- Low stability
    NOW() - INTERVAL '1 day',      -- Due yesterday
    5,                             -- 5 reviews
    4,                             -- 4 lapses (>= 3)
    'relearning',                  -- Relearning state
    NOW() - INTERVAL '2 days',     -- Last review 2 days ago
    NOW()
)
ON CONFLICT (student_id, item_id) DO UPDATE SET
    fsrs_difficulty = EXCLUDED.fsrs_difficulty,
    fsrs_lapses = EXCLUDED.fsrs_lapses,
    fsrs_state = EXCLUDED.fsrs_state;
```

---

## Step 6: Test Brain Gym in Browser

1. **Start Dev Server** (if not running)
   ```bash
   npm run dev
   ```

2. **Open Brain Gym**
   - Navigate to: http://localhost:3000/m/brain-gym
   - Or click "Brain Gym" in mobile nav

3. **Test Each Data Source**
   - Select "📅 Due Cards" → Should load due cards
   - Select "📖 Review Vocabulary" → Should load all cards (random)
   - Select "💪 Weak Words" → Should load weak cards (or empty state)

4. **Check Browser Console**
   - Open DevTools (F12 or Cmd+Option+I)
   - Look for:
     ```
     ✅ RPC calls succeed
     ✅ No error messages
     ✅ Cards load successfully
     ```

---

## Step 7: Run Testing Checklist

See `BRAIN-GYM-RPC-TESTING.md` for complete testing checklist.

**Quick Tests:**
- [ ] Due Cards loads
- [ ] Review Vocab loads
- [ ] Weak Words loads (or shows empty state)
- [ ] Switching between sources works
- [ ] No console errors
- [ ] Game plays correctly

---

## Troubleshooting

### Error: "function get_all_vocabulary_cards does not exist"

**Solution:** Migration 073 not deployed. Go back to Step 2.

---

### Error: "permission denied for function"

**Solution:** Check GRANT statements executed:

```sql
-- Run in SQL Editor
GRANT EXECUTE ON FUNCTION get_all_vocabulary_cards(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards(UUID, INT) TO authenticated;
```

---

### Error: "No items available"

**Possible Causes:**
1. User has no vocabulary items
2. RLS policies blocking access
3. Filter criteria too strict (for Weak Words)

**Solution:**
```sql
-- Check if you have vocabulary items
SELECT COUNT(*)
FROM learning_items
WHERE type = 'vocabulary';

-- Check if you have any progress data
SELECT COUNT(*)
FROM student_progress sp
JOIN learning_items li ON li.id = sp.item_id
WHERE sp.student_id = 'YOUR-USER-ID'::UUID
AND li.type = 'vocabulary';
```

---

### Weak Words always empty

**Solution:** Create test data (see Step 5) or use Review Vocabulary instead.

---

## Rollback (If Needed)

If something goes wrong, you can remove the functions:

```sql
DROP FUNCTION IF EXISTS get_all_vocabulary_cards(UUID, INT);
DROP FUNCTION IF EXISTS get_weak_vocabulary_cards(UUID, INT);
```

Then revert Brain Gym to use direct table queries (see git history).

---

## Next Steps

After successful deployment:

1. ✅ Mark deployment complete in docs
2. ✅ Complete testing checklist
3. ✅ Monitor production for errors
4. ✅ Consider indexing improvements (see performance section below)

---

## Performance Optimization (Optional)

For better performance, add these indexes:

```sql
-- Index for Due Cards (fsrs_due)
CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_due
ON student_progress(student_id, fsrs_due)
WHERE fsrs_due IS NOT NULL;

-- Index for Weak Words (fsrs_difficulty)
CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_difficulty
ON student_progress(student_id, fsrs_difficulty)
WHERE fsrs_difficulty > 7.0;

-- Index for Weak Words (fsrs_lapses)
CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_lapses
ON student_progress(student_id, fsrs_lapses)
WHERE fsrs_lapses >= 3;

-- Index for state-based queries
CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_state
ON student_progress(student_id, fsrs_state)
WHERE fsrs_state IN ('relearning', 'learning');
```

---

## Support & Documentation

- **Full Documentation:** `docs/BRAIN-GYM-RPC-FUNCTIONS.md`
- **Testing Checklist:** `BRAIN-GYM-RPC-TESTING.md`
- **FSRS Integration:** `docs/FSRS-6-INTEGRATION.md`
- **Migration File:** `supabase/migrations/073_brain_gym_rpc_functions.sql`

---

## Deployment Checklist

- [ ] Migration file exists
- [ ] SQL executed in Supabase Dashboard
- [ ] Functions verified with SELECT query
- [ ] Test data created (if needed)
- [ ] RPC functions tested in SQL Editor
- [ ] Brain Gym tested in browser
- [ ] All 3 data sources work
- [ ] No console errors
- [ ] Testing checklist completed
- [ ] Documentation updated
- [ ] Performance indexes added (optional)

---

**Status:** Ready to deploy
**Estimated Time:** 15-30 minutes
