# 📊 Session Time Tracking System - Implementation Guide

**Migration:** 059_add_session_tracking.sql
**Date:** 2026-02-15
**Status:** ✅ Implemented (Backend + Frontend)

---

## 📋 Overview

The Session Time Tracking System automatically records learning session duration, cards reviewed, and accuracy for analytics and progress tracking.

### Key Features

- ✅ **Automatic Session Lifecycle:** Start on dialog open, end on completion/cancel
- ✅ **Real-time Duration Tracking:** Live session timer with second precision
- ✅ **Statistics Tracking:** Cards reviewed, cards correct, accuracy percentage
- ✅ **Multiple Session Types:** Vocabulary, Grammar, Daily Phrases, Due Cards, Weak Words
- ✅ **Analytics Integration:** Session data feeds into progress statistics
- ✅ **Robust Error Handling:** Graceful fallback if tracking fails

---

## 🗄️ Database Schema

### Table: `learning_sessions`

```sql
CREATE TABLE public.learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    session_type TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    cards_reviewed INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Session Types:**
- `vocabulary` - Vocabulary learning
- `grammar` - Grammar rules
- `daily_phrases` - Daily phrases
- `due_cards` - Due cards review
- `weak_words` - Weak words training
- `comprehension` - Reading comprehension
- `listening` - Listening exercises

---

## 🔧 Backend RPC Functions

### 1. `start_learning_session(p_student_id, p_session_type)`

**Purpose:** Create a new learning session

**Parameters:**
- `p_student_id` (UUID) - User ID
- `p_session_type` (TEXT) - Session type (vocabulary, grammar, etc.)

**Returns:** `UUID` - Session ID

**Example:**
```sql
SELECT start_learning_session('user-uuid-here', 'vocabulary');
-- Returns: 'session-uuid-here'
```

---

### 2. `end_learning_session(p_session_id, p_cards_reviewed, p_cards_correct)`

**Purpose:** End session and calculate duration

**Parameters:**
- `p_session_id` (UUID) - Session ID from start_learning_session
- `p_cards_reviewed` (INTEGER) - Total cards reviewed
- `p_cards_correct` (INTEGER) - Cards answered correctly

**Returns:** Table with:
- `session_id` (UUID)
- `duration_seconds` (INTEGER)
- `duration_minutes` (NUMERIC)

**Example:**
```sql
SELECT * FROM end_learning_session('session-uuid', 10, 8);
-- Returns: session_id, duration_seconds: 180, duration_minutes: 3.0
```

---

### 3. `get_session_stats(p_student_id, p_days)`

**Purpose:** Get aggregated session statistics

**Parameters:**
- `p_student_id` (UUID) - User ID
- `p_days` (INTEGER) - Days to look back (default: 30)

**Returns:** Table with:
- `total_sessions` (INTEGER)
- `total_time_minutes` (INTEGER)
- `avg_session_minutes` (NUMERIC)
- `total_cards_reviewed` (INTEGER)
- `total_cards_correct` (INTEGER)
- `accuracy_percentage` (NUMERIC)
- `longest_session_minutes` (INTEGER)
- `shortest_session_minutes` (INTEGER)

**Example:**
```sql
SELECT * FROM get_session_stats('user-uuid', 30);
-- Returns comprehensive session statistics
```

---

### 4. `get_recent_sessions(p_student_id, p_limit)`

**Purpose:** Get recent session history

**Parameters:**
- `p_student_id` (UUID) - User ID
- `p_limit` (INTEGER) - Max sessions to return (default: 10)

**Returns:** Table with session details ordered by started_at DESC

**Example:**
```sql
SELECT * FROM get_recent_sessions('user-uuid', 10);
```

---

## 💻 Frontend Implementation

### Hook: `useSessionTime`

**File:** `src/hooks/use-session-time.ts`

**Features:**
- Auto-start session on mount
- Auto-end session on unmount
- Real-time duration counter
- Statistics tracking
- Error handling

**Usage Example:**

```typescript
import { useSessionTime } from '@/hooks/use-session-time';

const MyLearningDialog = () => {
  const { user } = useAuth();

  const {
    sessionId,
    duration,
    isActive,
    stats,
    startSession,
    endSession,
    updateStats,
  } = useSessionTime({
    userId: user?.id || '',
    sessionType: 'vocabulary',
    autoStart: true,
    autoEnd: true,
  });

  // Update stats when rating a card
  const handleRating = (rating: number) => {
    const newReviewed = stats.cardsReviewed + 1;
    const newCorrect = stats.cardsCorrect + (rating >= 3 ? 1 : 0);
    updateStats(newReviewed, newCorrect);
  };

  return (
    <div>
      <SessionTimerDisplay duration={duration} isActive={isActive} />
      {/* Your dialog content */}
    </div>
  );
};
```

---

### Component: `SessionTimerDisplay`

**File:** `src/components/learning/session-timer-display.tsx`

**Purpose:** Visual display of current session duration

**Props:**
- `duration` (number) - Seconds elapsed
- `isActive` (boolean) - Whether session is active
- `className` (string, optional) - Additional CSS classes

**Example:**
```tsx
<SessionTimerDisplay
  duration={180}
  isActive={true}
/>
// Displays: ⏱️ 3m
```

---

## 🔄 Current Implementation Status

### ✅ Already Implemented (Basic)

All learning dialogs have basic session tracking:

1. **VocabularyDialogFSRS.tsx** (lines 273-289, 394-412, 456-469)
2. **DueCardsDialog.tsx** (similar pattern)
3. **WeakWordsDialog.tsx** (similar pattern)
4. **DailyPhrasesDialogFSRS.tsx** (similar pattern)
5. **GrammarDialogFSRS.tsx** (similar pattern)

**Implementation Pattern:**
```typescript
// Start session when cards load
const { data: sessionData } = await supabase.rpc('start_learning_session', {
  p_student_id: user.id,
  p_session_type: 'vocabulary'
});
setSessionId(sessionData);

// End session when completing or cancelling
await supabase.rpc('end_learning_session', {
  p_session_id: sessionId,
  p_cards_reviewed: total,
  p_cards_correct: correct
});
```

---

## 📊 Integration with Analytics

Session data is used in:

1. **Migration 060:** `get_progress_overview()` function
   - `total_study_minutes`
   - `avg_session_minutes`
   - `total_sessions`

2. **Stats Dashboard** (`/m/stats`)
   - Session statistics display
   - Time spent learning
   - Session frequency

3. **Weekly Activity Chart**
   - Study time per day
   - Activity heatmap

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### 1. Start Session
- [ ] Open a learning dialog
- [ ] Check browser console for: `📊 Session started: [session-id]`
- [ ] Verify session timer starts counting

#### 2. Complete Session
- [ ] Review all cards and complete session
- [ ] Check console for: `📊 Session completed: X minutes`
- [ ] Verify session stats are correct (cards reviewed, accuracy)

#### 3. Cancel Session
- [ ] Start a learning session
- [ ] Cancel/close dialog mid-session
- [ ] Check console for: `📊 Session ended (cancelled)`
- [ ] Verify partial session is recorded

#### 4. View Session Statistics
```sql
-- In Supabase SQL Editor
SELECT * FROM get_session_stats('your-user-id', 7);
```

Expected output:
- `total_sessions` > 0
- `total_time_minutes` > 0
- `avg_session_minutes` > 0
- `accuracy_percentage` between 0-100

#### 5. View Recent Sessions
```sql
SELECT * FROM get_recent_sessions('your-user-id', 5);
```

Expected: List of recent sessions with duration and stats

---

## 🐛 Troubleshooting

### Issue: Session not starting

**Symptoms:** No console log "Session started"

**Possible Causes:**
1. Migration 059 not executed in Supabase
2. User ID is null/undefined
3. RLS policies blocking access

**Solution:**
```sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%learning_session%';

-- Check if table exists
SELECT * FROM pg_tables WHERE tablename = 'learning_sessions';

-- Manually test RPC
SELECT start_learning_session('user-uuid', 'vocabulary');
```

---

### Issue: Session not ending

**Symptoms:** Duration shows 0 or null in database

**Possible Causes:**
1. `end_learning_session` not called
2. Session ID lost/reset
3. Network error during end call

**Solution:**
- Check browser console for errors
- Verify sessionId state is maintained
- Test RPC function directly

---

### Issue: Wrong statistics

**Symptoms:** Cards reviewed/correct mismatch

**Possible Causes:**
1. Stats not updated before ending session
2. Race condition in state updates

**Solution:**
- Ensure stats are updated before calling end_learning_session
- Use latest state values, not stale closures

---

## 📈 Future Enhancements

### Potential Improvements

1. **Real-time Session Timer UI** (Optional)
   - Visual timer in dialog header
   - Show elapsed time: "⏱️ 3m 45s"

2. **Session Pause/Resume** (Future)
   - Pause button for breaks
   - Exclude pause time from duration

3. **Session Milestones** (Future)
   - Achievements: "10 sessions completed"
   - Notifications: "You've studied 1 hour today!"

4. **Session Replay** (Future)
   - Review past sessions
   - See which cards were difficult

5. **Offline Session Sync** (Future)
   - Queue sessions while offline
   - Sync when connection restored

---

## 🎯 Performance Considerations

- **Minimal Overhead:** Session tracking adds ~50ms per start/end
- **Optimistic Updates:** UI continues if tracking fails
- **Background Operations:** Session end doesn't block UI
- **Index Performance:** Queries use indexed columns (student_id, started_at)

---

## 📝 Notes

- Session tracking is non-blocking (uses console.warn on errors)
- Failed session tracking does NOT prevent learning progress
- Session data persists even if page refreshes (as long as end is called)
- Sessions without `completed = true` are considered abandoned

---

**Last Updated:** 2026-02-15
**Version:** v1.0 (Backend + Frontend Complete)
