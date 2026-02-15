# Session Timer Visual Integration Example

This document shows how to optionally add visual session timer display to learning dialogs.

## Current Status

✅ **Backend:** Session tracking is fully functional (Migration 059)
✅ **Hook:** `useSessionTime` hook is ready to use
✅ **Component:** `SessionTimerDisplay` component is available
✅ **Integration:** Basic tracking already works in all dialogs

## Optional Enhancement: Visual Timer Display

If you want to show a live timer in the dialog UI, here's how:

### Step 1: Import Required Items

```typescript
import { useSessionTime } from '@/hooks/use-session-time';
import SessionTimerDisplay from '@/components/learning/session-timer-display';
```

### Step 2: Replace Inline Session Tracking

**Before (current implementation):**

```typescript
const [sessionId, setSessionId] = useState<string | null>(null);

// In loadDueCards():
const { data: sessionData } = await supabase.rpc('start_learning_session', {
  p_student_id: user.id,
  p_session_type: 'vocabulary'
});
setSessionId(sessionData);

// In handleRating() or handleCancel():
await supabase.rpc('end_learning_session', {
  p_session_id: sessionId,
  p_cards_reviewed: total,
  p_cards_correct: correct
});
```

**After (with hook):**

```typescript
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
  autoStart: true,   // Starts when component mounts
  autoEnd: true,      // Ends when component unmounts
});

// In loadDueCards():
// Session auto-starts, but you can manually start if needed:
if (!isActive) {
  await startSession();
}

// In handleRating():
const newReviewed = total + 1;
const newCorrect = correct + (rating >= 3 ? 1 : 0);
updateStats(newReviewed, newCorrect);

// Session auto-ends on unmount, but you can manually end:
await endSession();
```

### Step 3: Add Timer to Dialog Header

Add the timer display component to your dialog header:

```tsx
{/* Dialog Header */}
<div className="dialog-header">
  <div className="header-left">
    <h2>📚 Vocabulary Practice</h2>
  </div>

  {/* Session Timer (NEW) */}
  <SessionTimerDisplay
    duration={duration}
    isActive={isActive}
  />

  <div className="header-right">
    <button onClick={handleCancel}>✕</button>
  </div>
</div>
```

### Step 4: Update Stats Display (Optional)

You can also show session stats in the summary screen:

```tsx
{showSummary && (
  <div className="summary-screen">
    <h2>🎉 Session Complete!</h2>

    {/* Session Stats */}
    <div className="session-stats">
      <div className="stat-item">
        <span className="stat-icon">⏱️</span>
        <span className="stat-label">Session Time</span>
        <span className="stat-value">
          {formatSessionDuration(duration)}
        </span>
      </div>

      <div className="stat-item">
        <span className="stat-icon">📚</span>
        <span className="stat-label">Cards Reviewed</span>
        <span className="stat-value">{stats.cardsReviewed}</span>
      </div>

      <div className="stat-item">
        <span className="stat-icon">✅</span>
        <span className="stat-label">Accuracy</span>
        <span className="stat-value">{stats.accuracy.toFixed(1)}%</span>
      </div>
    </div>

    {/* Existing summary content */}
  </div>
)}
```

---

## Complete Example: Vocabulary Dialog with Timer

See below for a complete example of integrating the session timer:

```typescript
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSessionTime, formatSessionDuration } from '@/hooks/use-session-time';
import SessionTimerDisplay from '@/components/learning/session-timer-display';

export default function VocabularyDialogFSRS({ isOpen, onClose }) {
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);

  // Session Time Tracking Hook
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
    autoStart: false,  // Manual start after cards load
    autoEnd: true,     // Auto-end on unmount
  });

  // Load cards and start session
  const loadDueCards = async () => {
    // ... load cards from database ...

    // Start session after cards load
    if (user?.id && vocabulary.length > 0) {
      await startSession();
    }
  };

  // Handle rating with stats update
  const handleRating = async (rating: number) => {
    // ... existing rating logic ...

    // Update session stats
    const newTotal = total + 1;
    const newCorrect = correct + (rating >= 3 ? 1 : 0);
    setTotal(newTotal);
    setCorrect(newCorrect);
    updateStats(newTotal, newCorrect);

    // Check if session complete
    if (currentIndex >= vocabulary.length - 1) {
      await endSession();
    }
  };

  // Cancel with session cleanup
  const handleCancel = async () => {
    if (isActive) {
      await endSession();
    }
    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        {/* Header with Timer */}
        <div className="dialog-header">
          <h2>📚 Vocabulary Practice</h2>

          {/* Session Timer */}
          <SessionTimerDisplay
            duration={duration}
            isActive={isActive}
          />

          <button onClick={handleCancel}>✕</button>
        </div>

        {/* Dialog Body */}
        {/* ... flashcard, buttons, etc ... */}

        {/* Summary with Session Stats */}
        {showSummary && (
          <div className="summary-screen">
            <h2>🎉 Session Complete!</h2>

            <div className="session-summary">
              <p>⏱️ Time: {formatSessionDuration(duration)}</p>
              <p>📚 Cards: {stats.cardsReviewed}</p>
              <p>✅ Accuracy: {stats.accuracy.toFixed(1)}%</p>
            </div>

            <button onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Benefits of Using the Hook

### 1. **Cleaner Code**
- Encapsulates all session logic in one place
- No manual RPC calls scattered throughout component
- Easier to maintain and debug

### 2. **Real-time Duration**
- Live counter updates every second
- No need to calculate duration manually
- Accurate duration tracking

### 3. **Better Stats Tracking**
- Built-in accuracy calculation
- Consistent stats format across dialogs
- Easy to display in summary screen

### 4. **Error Handling**
- Graceful fallback if tracking fails
- Won't break user experience
- Console warnings for debugging

### 5. **Auto-Cleanup**
- Sessions automatically end on unmount
- No orphaned sessions in database
- Prevents memory leaks

---

## When to Use Visual Timer

**Show Timer If:**
- ✅ Users want to track study time
- ✅ Gamification/motivation needed
- ✅ Time-based challenges
- ✅ Study time goals

**Skip Timer If:**
- ❌ Minimal/distraction-free UI preferred
- ❌ Timer might cause stress
- ❌ Focus on content, not time

**Note:** Session tracking works whether timer is visible or not!

---

## Migration Checklist

If refactoring to use the hook:

- [ ] Import `useSessionTime` and `SessionTimerDisplay`
- [ ] Replace `sessionId` state with hook's `sessionId`
- [ ] Remove manual `start_learning_session` RPC calls
- [ ] Remove manual `end_learning_session` RPC calls
- [ ] Add `updateStats()` calls after each rating
- [ ] Add `<SessionTimerDisplay>` to header (optional)
- [ ] Test session start/end in console logs
- [ ] Verify stats in database after sessions

---

## Testing

After integration:

1. Open learning dialog → Check console for "✅ Session started"
2. Review some cards → Stats should update
3. Complete session → Check console for "✅ Session completed: X minutes"
4. Query database:
   ```sql
   SELECT * FROM get_recent_sessions('your-user-id', 5);
   ```
5. Verify duration and stats are correct

---

**Note:** Current implementation already works without visual timer. This integration is **optional** for enhanced UX.

**Last Updated:** 2026-02-15
