# 🚀 Migration 056: Apply Guide

## What This Does
Adds FSRS-6 fields to the `student_progress` table to enable real progress tracking.

## ✅ Prerequisites
- Migration 050 must be applied (creates student_progress table)
- You have access to Supabase SQL Editor

## 📋 Step-by-Step Instructions

### 1. Open Supabase SQL Editor
- Go to your Supabase project dashboard
- Click "SQL Editor" in the left sidebar
- Click "New query"

### 2. Copy & Paste Migration
- Open `056_add_fsrs_to_student_progress.sql`
- Copy the entire contents
- Paste into SQL Editor

### 3. Execute Migration
- Click "Run" button (or press Cmd/Ctrl + Enter)
- Wait for execution (~1-2 seconds)

### 4. Verify Success
You should see these NOTICE messages:
```
✅ FSRS-6 fields successfully added to student_progress table
   - 9 new columns: difficulty, stability, last_review, due, reps, lapses, state, elapsed_days, scheduled_days
   - 3 CHECK constraints for data integrity
   - 4 indexes for query performance
   - Existing SRS data migrated to FSRS format
```

### 5. Test It
Run this query to verify the new columns exist:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'student_progress'
  AND column_name LIKE 'fsrs_%'
ORDER BY column_name;
```

Expected result: 9 rows (all FSRS columns)

## 🎯 What Happens Next
- Dashboard stats will load from real data (no more 400 errors!)
- Vocabulary progress will persist correctly
- FSRS-6 algorithm will track learning efficiently

## 🔄 Backward Compatibility
Old SRS fields (`last_attempt`, `interval_days`, `ease_factor`) are preserved.
Existing data is automatically migrated to FSRS format.

## ⚠️ Troubleshooting
**Error: "relation 'student_progress' does not exist"**
- Run migration 050 first (creates the table)

**Error: "column already exists"**
- Migration is idempotent - safe to run multiple times
- Already applied columns will be skipped

## 📊 Database Schema After Migration

```sql
student_progress:
  -- Primary Keys & Relations
  id               UUID PRIMARY KEY
  item_id          UUID → learning_items(id)
  student_id       UUID (user ID)

  -- Legacy SRS Fields (kept for compatibility)
  correct_count    INTEGER
  attempts         INTEGER
  last_attempt     TIMESTAMPTZ
  next_review      TIMESTAMPTZ
  interval_days    FLOAT
  ease_factor      FLOAT

  -- FSRS-6 Fields (NEW!)
  fsrs_difficulty       REAL (1.0-10.0)
  fsrs_stability        REAL (≥0.1 days)
  fsrs_last_review      TIMESTAMPTZ
  fsrs_due              TIMESTAMPTZ
  fsrs_reps             INT
  fsrs_lapses           INT
  fsrs_state            TEXT (new|learning|review|relearning)
  fsrs_elapsed_days     INT
  fsrs_scheduled_days   INT
```

---

**Ready?** Copy `056_add_fsrs_to_student_progress.sql` to Supabase SQL Editor and run it! 🚀
