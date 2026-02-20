# Brain Gym RPC Functions - Testing Checklist

**Created:** 2026-02-19
**Purpose:** Verify Brain Gym integration with new RPC functions

---

## Pre-Requisites

- [ ] Migration 073 deployed in Supabase
- [ ] Brain Gym page updated to use RPCs
- [ ] Dev server restarted

---

## Test Case 1: Due Cards

- [ ] Open Brain Gym page (`/m/brain-gym`)
- [ ] Select "📅 Due Cards" from dropdown
- [ ] Verify cards load (should show cards with `fsrs_due <= NOW()`)
- [ ] Verify no console errors
- [ ] Play game and verify functionality
- [ ] Verify card content displays correctly (Greek + English)

---

## Test Case 2: Review Vocabulary (NEW)

- [ ] Select "📖 Review Vocabulary" from dropdown
- [ ] Verify cards load (should show ALL vocabulary, random order)
- [ ] Verify different cards than Due Cards
- [ ] Verify no console errors
- [ ] Play game and verify functionality
- [ ] Verify random order (different cards on refresh)

---

## Test Case 3: Weak Words (NEW)

- [ ] Select "💪 Weak Words" from dropdown
- [ ] Verify cards load (should show difficult cards)
- [ ] If no weak cards exist: Create test data with high difficulty
- [ ] Verify no console errors
- [ ] Play game and verify functionality
- [ ] Verify cards have high difficulty/lapses (check console logs)

---

## Test Case 4: Cache Behavior

- [ ] Switch between data sources (Due → Review → Weak)
- [ ] Verify cache refreshes on source change
- [ ] Verify loading indicator shows during fetch
- [ ] Verify cached indicator shows after load
- [ ] Verify cache persists after page reload

---

## Test Case 5: Error Handling

- [ ] Disconnect internet (simulate network error)
- [ ] Try changing data source
- [ ] Verify graceful error handling
- [ ] Verify fallback to cached data
- [ ] Reconnect and verify recovery

---

## Test Case 6: Empty States

- [ ] Test user with no vocabulary items
  - [ ] Verify "No Items Available" message shows
- [ ] Test user with no due cards
  - [ ] Switch to Due Cards
  - [ ] Verify empty state or fallback behavior
- [ ] Test user with no weak words
  - [ ] Switch to Weak Words
  - [ ] Verify empty state message

---

## Test Case 7: FSRS Integration

- [ ] Open browser console
- [ ] Switch to each data source
- [ ] Verify RPC calls in Network tab:
  - [ ] `get_due_vocabulary_cards` for Due Cards
  - [ ] `get_all_vocabulary_cards` for Review Vocab
  - [ ] `get_weak_vocabulary_cards` for Weak Words
- [ ] Verify FSRS fields in response:
  - [ ] `fsrs_difficulty`
  - [ ] `fsrs_stability`
  - [ ] `fsrs_due`
  - [ ] `fsrs_reps`
  - [ ] `fsrs_lapses`
  - [ ] `fsrs_state`

---

## Expected Results

✅ All 3 data sources load cards successfully
✅ No console errors
✅ FSRS data integrated correctly
✅ Cache works as expected
✅ Empty states handled gracefully
✅ Network errors handled gracefully

---

## Testing Environment

- **Browser:** [Chrome/Safari/Firefox]
- **Device:** [iPhone/Android/Desktop]
- **User ID:** [Test user ID]
- **Date:** [Test date]

---

## Issues Found

| Issue | Data Source | Severity | Status |
|-------|-------------|----------|--------|
|       |             |          |        |

---

## Notes

- For "Weak Words" testing, you may need to create test data with:
  - `fsrs_difficulty > 7.0`
  - `fsrs_lapses >= 3`
  - `fsrs_state = 'relearning'`
- Use Supabase SQL Editor to create test data if needed
