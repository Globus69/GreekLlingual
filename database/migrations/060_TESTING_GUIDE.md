# Testing Guide: Migration 060 - Progress Statistics Functions

**Migration:** 060_create_progress_stats_functions.sql
**Date:** 2026-02-15
**Functions:** 3 new RPC functions for progress statistics

---

## 🎯 Functions Overview

### 1. `get_progress_overview(user_id, days)`
Returns comprehensive progress statistics for a user.

**Returns:**
- total_reviews, total_correct, avg_accuracy
- cards_learned, cards_mastered, new_cards_added
- total_study_minutes, avg_session_minutes, total_sessions
- improvement_rate, consistency_score

### 2. `get_learning_trends(user_id, days)`
Returns daily learning trends for chart visualization.

**Returns Array of:**
- date, reviews_count, correct_count, accuracy_percentage
- study_minutes, new_cards, avg_rating

### 3. `get_weekly_activity(user_id, weeks)`
Returns weekly activity data for heatmap visualization.

**Returns Array of:**
- week_start, week_number, day_of_week, day_name
- activity_score (0-100), reviews_count, study_minutes, is_today

---

## 🚀 Installation Steps

### Step 1: Execute Migration

**Option A: Supabase Dashboard (Recommended)**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy entire content of `060_create_progress_stats_functions.sql`
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Wait for success message

**Option B: Supabase CLI**
```bash
cd database/migrations
supabase db push --db-url "your-connection-string"
```

---

### Step 2: Verify Installation

Run verification queries in SQL Editor:

**Query 1: Check if functions exist**
```sql
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'get_progress_overview',
        'get_learning_trends',
        'get_weekly_activity'
    )
ORDER BY routine_name;
```

**Expected Result:** 3 functions listed

---

### Step 3: Test Functions

**Important:** Replace `<user-id>` with actual UUID from your `students` or `users` table.

**Get User ID:**
```sql
SELECT id, email, name FROM students LIMIT 5;
-- OR
SELECT id FROM auth.users LIMIT 5;
```

---

## 🧪 Test Cases

### Test 1: Progress Overview (Last 30 Days)

```sql
SELECT * FROM get_progress_overview(
    '<user-id>'::UUID,
    30
);
```

**Expected Output:**
| Column | Example Value | Description |
|--------|---------------|-------------|
| total_reviews | 150 | Total reviews in 30 days |
| total_correct | 120 | Correct answers (rating ≥3) |
| avg_accuracy | 80.00 | Percentage correct |
| cards_learned | 75 | Cards with ≥1 correct |
| cards_mastered | 25 | Cards with stability ≥30 |
| new_cards_added | 30 | New cards reviewed |
| total_study_minutes | 180.50 | Total minutes studied |
| avg_session_minutes | 12.50 | Average session length |
| total_sessions | 15 | Number of sessions |
| improvement_rate | 15.25 | % improvement |
| consistency_score | 66.67 | % of days active |

**Validation:**
- ✅ All numeric values should be ≥ 0
- ✅ avg_accuracy should be 0-100
- ✅ consistency_score should be 0-100
- ✅ If no data exists, all values should be 0

---

### Test 2: Learning Trends (Last 7 Days)

```sql
SELECT * FROM get_learning_trends(
    '<user-id>'::UUID,
    7
);
```

**Expected Output:** 8 rows (7 days + today)

| date | reviews_count | correct_count | accuracy_percentage | study_minutes | new_cards | avg_rating |
|------|---------------|---------------|---------------------|---------------|-----------|------------|
| 2026-02-08 | 20 | 16 | 80.00 | 15.50 | 5 | 3.20 |
| 2026-02-09 | 0 | 0 | 0.00 | 0.00 | 0 | 0.00 |
| 2026-02-10 | 25 | 22 | 88.00 | 18.75 | 3 | 3.50 |
| ... | ... | ... | ... | ... | ... | ... |

**Validation:**
- ✅ Should return rows for ALL days (including days with 0 activity)
- ✅ Dates should be consecutive
- ✅ accuracy_percentage = (correct_count / reviews_count) * 100
- ✅ avg_rating should be 1-4

**Chart Visualization:**
```
Reviews per Day:
20 ▓▓▓▓▓▓▓▓▓▓
 0
25 ▓▓▓▓▓▓▓▓▓▓▓▓
```

---

### Test 3: Weekly Activity Heatmap (Last 4 Weeks)

```sql
SELECT * FROM get_weekly_activity(
    '<user-id>'::UUID,
    4
);
```

**Expected Output:** ~28 rows (4 weeks × 7 days)

| week_start | week_number | day_of_week | day_name | activity_score | reviews_count | study_minutes | is_today |
|------------|-------------|-------------|----------|----------------|---------------|---------------|----------|
| 2026-01-19 | 3 | 0 | Sun | 0 | 0 | 0.00 | false |
| 2026-01-19 | 3 | 1 | Mon | 50 | 15 | 12.50 | false |
| 2026-01-19 | 3 | 2 | Tue | 100 | 30 | 25.00 | false |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Validation:**
- ✅ Should return exactly (weeks × 7) rows
- ✅ day_of_week: 0=Sunday, 6=Saturday
- ✅ activity_score: 0-100 (relative to max daily reviews)
- ✅ is_today = true for current date only

**Heatmap Visualization:**
```
       Mon  Tue  Wed  Thu  Fri  Sat  Sun
Week 1  50  100   75   80    0   60   30
Week 2  70   85   90   95  100   40   20
Week 3  60   75   80   70   65   55   45
Week 4  80   90   85   95  100    0    0
```

---

## 📊 Integration Testing

### Test 4: Frontend Integration Test

**TypeScript Test Query:**
```typescript
import { supabase } from '@/db/supabase';

// Test get_progress_overview
const { data, error } = await supabase.rpc('get_progress_overview', {
  p_user_id: user.id,
  p_days: 30
});

console.log('Progress Overview:', data);
// Expected: Array with 1 row containing all stats

// Test get_learning_trends
const { data: trends, error: trendsError } = await supabase.rpc('get_learning_trends', {
  p_user_id: user.id,
  p_days: 7
});

console.log('Learning Trends:', trends);
// Expected: Array with 8 rows (7 days + today)

// Test get_weekly_activity
const { data: activity, error: activityError } = await supabase.rpc('get_weekly_activity', {
  p_user_id: user.id,
  p_weeks: 4
});

console.log('Weekly Activity:', activity);
// Expected: Array with ~28 rows
```

---

## 🐛 Troubleshooting

### Error: "function does not exist"

**Cause:** Function not created or wrong schema

**Fix:**
```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_progress_overview';

-- If not found, re-run migration
```

---

### Error: "permission denied"

**Cause:** Missing GRANT EXECUTE permissions

**Fix:**
```sql
GRANT EXECUTE ON FUNCTION get_progress_overview TO anon;
GRANT EXECUTE ON FUNCTION get_progress_overview TO authenticated;

GRANT EXECUTE ON FUNCTION get_learning_trends TO anon;
GRANT EXECUTE ON FUNCTION get_learning_trends TO authenticated;

GRANT EXECUTE ON FUNCTION get_weekly_activity TO anon;
GRANT EXECUTE ON FUNCTION get_weekly_activity TO authenticated;
```

---

### Empty Results

**Cause:** No review data for user

**Fix:** Test with user who has review history
```sql
-- Find users with reviews
SELECT DISTINCT user_id, COUNT(*) as review_count
FROM fsrs_review_logs
GROUP BY user_id
ORDER BY review_count DESC
LIMIT 5;
```

---

### Incorrect Calculations

**Example:** accuracy_percentage is wrong

**Debug Query:**
```sql
-- Manual calculation to verify
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE rating >= 3) as correct,
    (COUNT(*) FILTER (WHERE rating >= 3)::NUMERIC / COUNT(*)) * 100 as accuracy
FROM fsrs_review_logs
WHERE user_id = '<user-id>'::UUID
    AND review_time >= NOW() - '30 days'::INTERVAL;
```

---

## ✅ Success Criteria

**All 3 functions should:**
- ✅ Execute without errors
- ✅ Return correct data structure
- ✅ Handle edge cases (no data = 0 values)
- ✅ Calculate percentages correctly (0-100)
- ✅ Scale activity_score relative to max (0-100)
- ✅ Include all days in date range (even 0 activity)

---

## 📝 Next Steps

After successful testing:

1. ✅ Mark migration as complete in TODO.md
2. ✅ Integrate functions into `use-stats-data.ts` hook
3. ✅ Create chart components for visualization
4. ✅ Update `m/stats/page.tsx` with real data

---

## 📚 References

- **Migration File:** `060_create_progress_stats_functions.sql`
- **Related Tables:** `learning_sessions`, `fsrs_review_logs`, `learning_items`
- **Frontend Hook:** `src/hooks/use-stats-data.ts`
- **Stats Page:** `src/app/m/stats/page.tsx`

---

**Testing Complete?** ✅ Proceed to Phase 2: Frontend Hook Integration
