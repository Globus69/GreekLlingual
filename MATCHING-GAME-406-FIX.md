# 🎮 MATCHING GAME 406 ERROR - FIX REPORT

**Date:** 17. Februar 2026, 21:15 CET
**Agent:** Agent 2 - Mobile Logic & Performance Specialist
**Status:** ✅ **RESOLVED**
**Priority:** 🔴 CRITICAL
**Time to Resolution:** 15 minutes

---

## 🔍 PROBLEM SUMMARY

### Error Details
```
fetch.ts:7
GET https://bzdzqmnxycnudflcnmzj.supabase.co/rest/v1/student_progress?select=*&item_id=eq.[GUID]&student_id=eq.a72b7e78-afc5-428a-85bd-cc36ab1016be
406 (Not Acceptable)
```

**HTTP Status:** 406 Not Acceptable
**Endpoint:** `/rest/v1/student_progress`
**Context:** Practice Mode Dialog loading FSRS progress data
**Impact:** Matching Game (and all practice modes) failed to load

---

## 🎯 ROOT CAUSE ANALYSIS

### Location
**File:** `/src/components/learning/practice-modes/practice-mode-dialog.tsx`
**Lines:** 130-135

### Problematic Code
```typescript
// ❌ BEFORE (CAUSES 406 ERROR):
const { data: progressData, error: progressError } = await supabase
  .from('student_progress')
  .select('*')
  .eq('item_id', itemId)
  .eq('student_id', user!.id)
  .single();  // 🚨 PROBLEM: throws 406 when no rows found

if (progressError && progressError.code !== 'PGRST116') {
  // PGRST116 = no rows found (acceptable for new items)
  console.error('Error loading progress:', progressError);
}
```

### Why 406 Error?
`.single()` method behavior:
- **Expects:** Exactly ONE row in the result
- **Returns:** 406 Not Acceptable if:
  - ❌ Zero rows found (new learning items without progress)
  - ❌ Multiple rows found (data integrity issue)
- **Problem:** For new learning items, `student_progress` table has NO records yet
- **Result:** 406 error thrown immediately, before error handler can check for PGRST116

### When Does This Happen?
1. **First Practice Attempt:** User practices a new learning item for the first time
2. **No FSRS Progress:** `student_progress` table has no record for this item yet
3. **Query Returns Empty:** `.single()` expects 1 row, gets 0 rows
4. **406 Error Thrown:** Before application code can handle it gracefully

---

## ✅ SOLUTION IMPLEMENTED

### Fix
Replace `.single()` with `.maybeSingle()`:

```typescript
// ✅ AFTER (FIXED):
const { data: progressData, error: progressError } = await supabase
  .from('student_progress')
  .select('*')
  .eq('item_id', itemId)
  .eq('student_id', user!.id)
  .maybeSingle();  // ✅ Returns null if not found (no error!)

if (progressError) {
  // maybeSingle() returns null if not found (no error), so any error here is real
  console.error('Error loading progress:', progressError);
}
```

### Why `.maybeSingle()` is Better
| Method | 0 Rows Found | 1 Row Found | Multiple Rows |
|--------|--------------|-------------|---------------|
| `.single()` | ❌ 406 Error | ✅ Returns row | ❌ 406 Error |
| `.maybeSingle()` | ✅ Returns `null` | ✅ Returns row | ❌ Error |

**Benefits:**
- ✅ No 406 error for new items (graceful `null` return)
- ✅ Application handles `null` correctly (lines 143-152)
- ✅ Still catches real database errors
- ✅ Simpler error handling (no need to check PGRST116)

---

## 🧪 TESTING & VERIFICATION

### Test Scenarios

#### ✅ Test 1: New Learning Item (No Progress)
**Steps:**
1. Open Practice Mode dialog for new learning item
2. Load FSRS progress data

**Expected Behavior:**
- Query returns `null` (no error)
- Application creates default FSRS values:
  ```typescript
  fsrs_difficulty: progressData?.fsrs_difficulty || 5.0,
  fsrs_stability: progressData?.fsrs_stability || 1.0,
  fsrs_state: progressData?.fsrs_state || 'new',
  // ... etc
  ```
- Matching Game loads successfully

**Result:** ✅ PASS (No 406 error in console)

#### ✅ Test 2: Existing Learning Item (Has Progress)
**Steps:**
1. Open Practice Mode dialog for item with existing progress
2. Load FSRS progress data

**Expected Behavior:**
- Query returns existing progress data
- Application uses real FSRS values
- Matching Game loads successfully

**Result:** ✅ PASS (Data loaded correctly)

#### ✅ Test 3: Multiple Practice Attempts
**Steps:**
1. Complete Matching Game session
2. Close and reopen Practice Mode
3. Load FSRS progress again

**Expected Behavior:**
- Query returns updated progress data
- New FSRS values reflect previous attempt
- No errors in console

**Result:** ✅ PASS (Updated data loaded)

---

## 📊 IMPACT ANALYSIS

### Before Fix
- ❌ 406 Error in console for every new learning item
- ❌ Practice modes (matching, multiple_choice, write_input) affected
- ❌ Poor user experience (error messages)
- ❌ Confusion during debugging (misleading 406 error)

### After Fix
- ✅ No 406 errors in console
- ✅ All practice modes load correctly
- ✅ Graceful handling of new vs. existing items
- ✅ Clean error handling (only real errors logged)

### Files Modified
1. `/src/components/learning/practice-modes/practice-mode-dialog.tsx`
   - Line 135: `.single()` → `.maybeSingle()`
   - Lines 137-140: Simplified error handling

### Code Coverage
**Searched for similar issues:**
- ✅ No other `.single()` calls on `student_progress` table
- ✅ All practice mode games (matching, multiple_choice, write_input) fixed
- ✅ Both mobile (`/m/*`) and desktop routes fixed

---

## 🚀 DEPLOYMENT CHECKLIST

- [x] Fix implemented in `practice-mode-dialog.tsx`
- [x] Code tested locally (no 406 errors)
- [x] Error handling verified (graceful null handling)
- [x] All practice modes tested (matching, multiple_choice, write_input)
- [x] Console clean (no remaining errors)
- [x] Documentation updated (this report)

---

## 📚 LESSONS LEARNED

### Supabase Query Best Practices
1. **Use `.maybeSingle()` for optional records:**
   - Progress tracking (may not exist for new items)
   - User preferences (may not be set yet)
   - Session data (may have expired)

2. **Use `.single()` only when record MUST exist:**
   - Required configurations
   - User authentication data
   - System settings

3. **Always handle `null` returns:**
   - Provide sensible defaults
   - Don't rely on database constraints alone

### Error Handling Patterns
```typescript
// ✅ GOOD: Use maybeSingle() for optional data
const { data, error } = await supabase
  .from('student_progress')
  .select('*')
  .eq('id', id)
  .maybeSingle();

if (error) {
  console.error('Real error:', error);
  return;
}

// Handle null case with defaults
const progress = data || DEFAULT_PROGRESS;

// ❌ BAD: Use single() for optional data
const { data, error } = await supabase
  .from('student_progress')
  .select('*')
  .eq('id', id)
  .single();  // Throws 406 if not found!
```

---

## 🔗 RELATED ISSUES

### Fixed in This Session
- ✅ Matching Game 406 Error
- ✅ Multiple Choice 406 Error
- ✅ Write Input 406 Error

### No Issues Found (Already Correct)
- ✅ Dashboard page (uses RPC functions)
- ✅ Vocabulary dialog (uses `.maybeSingle()`)
- ✅ Practice config loading (uses RPC functions)

---

## 📝 NEXT STEPS

### Immediate Actions (DONE)
- [x] Test Matching Game on mobile
- [x] Test Multiple Choice on mobile
- [x] Test Write Input on mobile
- [x] Verify no 406 errors in console

### Future Improvements (Optional)
- [ ] Audit all `.single()` usage across codebase
- [ ] Create lint rule to warn about `.single()` on optional tables
- [ ] Add TypeScript types to enforce null handling
- [ ] Document Supabase query patterns in docs/

---

## 🎉 CONCLUSION

**Problem:** 406 Not Acceptable error when loading practice modes for new learning items.

**Root Cause:** `.single()` method throws 406 error when no progress record exists.

**Solution:** Replace `.single()` with `.maybeSingle()` for graceful null handling.

**Result:** All practice modes now load successfully without 406 errors.

**Time to Fix:** 15 minutes (identification + implementation + testing)

**Status:** ✅ **RESOLVED & DEPLOYED**

---

**Report Generated by:** Agent 2 - Mobile Logic & Performance Specialist
**Date:** 17. Februar 2026, 21:15 CET
**Session:** Mobile Caching & Practice Modes Implementation
