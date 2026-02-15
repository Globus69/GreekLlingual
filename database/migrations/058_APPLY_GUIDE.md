# 🔥 Migration 058: Streak Tracking - Apply Guide

## What This Does
Adds streak tracking system to gamify daily learning and boost engagement.

## ✅ What You Get
- 🔥 **Real streak counter** on dashboard (no more fake "5 days")
- 📊 **Longest streak** tracking for achievements
- 🎯 **Automatic updates** after each learning session
- ⚡ **Smart reset** if user misses a day

## 📋 Step-by-Step Instructions

### 1. Open Supabase SQL Editor
- Go to your Supabase project dashboard
- Click "SQL Editor" in the left sidebar
- Click "New query"

### 2. Copy & Paste Migration
- Open `058_add_streak_tracking.sql`
- Copy the entire contents
- Paste into SQL Editor

### 3. Execute Migration
- Click "Run" button (or press Cmd/Ctrl + Enter)
- Wait for execution (~1 second)

### 4. Verify Success
You should see these NOTICE messages:
```
✅ Streak tracking system created successfully
   - 3 columns added: streak_days, last_activity_date, longest_streak
   - 2 RPC functions created:
     • update_user_streak() - Call after learning activity
     • get_user_streak() - Fetch streak info for dashboard
```

---

## 🧪 Test It

### Test 1: Update a User's Streak
```sql
-- Replace with your user UUID
SELECT * FROM update_user_streak('your-user-uuid-here');
```

**Expected result:**
```
new_streak | is_new_record | message
-----------+---------------+-------------------------
         1 | true          | Streak started! 🔥 New record! 🏆
```

### Test 2: Check Streak Info
```sql
SELECT * FROM get_user_streak('your-user-uuid-here');
```

**Expected result:**
```
current_streak | longest_streak | last_activity | streak_status
---------------+----------------+---------------+---------------
             1 |              1 | 2026-02-15    | active_today
```

### Test 3: Simulate Multiple Days
```sql
-- Day 1
SELECT * FROM update_user_streak('user-uuid');  -- Streak: 1

-- Simulate day 2 (update last_activity to yesterday)
UPDATE users SET last_activity_date = CURRENT_DATE - 1 WHERE id = 'user-uuid';
SELECT * FROM update_user_streak('user-uuid');  -- Streak: 2 ✅

-- Simulate day 3
UPDATE users SET last_activity_date = CURRENT_DATE - 1 WHERE id = 'user-uuid';
SELECT * FROM update_user_streak('user-uuid');  -- Streak: 3 ✅
```

---

## 🎯 How It Works

### Streak Logic

**Case 1: First Activity**
- No previous activity → Start streak at 1
- Message: "Streak started! 🔥"

**Case 2: Same Day Activity**
- Already studied today → Streak unchanged
- Message: "Keep going today! 💪"

**Case 3: Next Day (Consecutive)**
- Last activity was yesterday → Increment streak
- Message: "Streak increased! 🔥"

**Case 4: Missed Days**
- Last activity was 2+ days ago → Reset to 1
- Message: "Streak reset. Start fresh! 🌟"

**New Record:**
- If current streak > longest streak → Update record
- Extra message: "New record! 🏆"

---

## 🖥️ Frontend Integration

The frontend automatically:
1. ✅ Displays real streak from `user.streak_days`
2. ✅ Updates streak after completing vocabulary session
3. ✅ Shows toast notification for new records
4. ✅ No hardcoded values anymore

---

## 📊 Database Schema After Migration

```sql
users table:
  -- New Columns (ADDED)
  streak_days          INTEGER DEFAULT 0 NOT NULL
  last_activity_date   DATE
  longest_streak       INTEGER DEFAULT 0 NOT NULL

RPC Functions:
  update_user_streak(p_user_id UUID)
    → Returns: new_streak, is_new_record, message

  get_user_streak(p_user_id UUID)
    → Returns: current_streak, longest_streak, last_activity, streak_status
```

---

## 💡 Usage Examples

### Automatic (Recommended)
The app automatically calls `update_user_streak()` when:
- User completes a vocabulary review session
- Updates happen in VocabularyDialogFSRS component

### Manual Testing
```sql
-- Manually update streak
SELECT * FROM update_user_streak('user-uuid');

-- Check current streak
SELECT streak_days, longest_streak, last_activity_date
FROM users
WHERE id = 'user-uuid';

-- Get detailed streak info
SELECT * FROM get_user_streak('user-uuid');
```

---

## ⚠️ Troubleshooting

**Error: "relation 'users' does not exist"**
- Make sure base schema migration (046 or 050) was run first

**Error: "column 'streak_days' already exists"**
- Migration is idempotent - safe to run multiple times
- Existing columns will be skipped

**Streak not updating in app**
- Hard refresh browser (Cmd+Shift+R)
- Check console for errors
- Verify migration ran successfully in Supabase

**Streak shows 0 on dashboard**
- User needs to complete at least one vocabulary session
- Check if `update_user_streak()` is being called
- Verify user object has streak_days field

---

## 🎮 Gamification Ideas (Future)

**Achievements:**
- 🔥 7-day streak: "Week Warrior"
- 🔥 30-day streak: "Monthly Master"
- 🔥 100-day streak: "Century Scholar"

**Rewards:**
- Unlock special Greek culture content
- Badge collection
- Leaderboard rankings

**Social:**
- Share streak milestones
- Challenge friends
- Study group streaks

---

**Ready?** Copy `058_add_streak_tracking.sql` to Supabase SQL Editor and run it! 🚀
