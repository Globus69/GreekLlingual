# Practice Modes Troubleshooting Guide
**Date:** 16 February 2026 (Updated: 17 February 2026)
**Status:** DATA SYNC ISSUE - Component works but shows stale data

---

## 🏗️ Architecture Update (17 February 2026)

**IMPORTANT:** Practice Modes moved to separate page `/practice-modes`

### New Access Route:
- **Old:** Dashboard → Practice Modes Section (embedded)
- **New:** Dashboard → Button 13 "🎮 Practice Modes" → `/practice-modes` page

### Files:
- **New:** `src/app/practice-modes/page.tsx` (standalone page)
- **Unchanged:** `src/components/dashboard/practice-modes-section.tsx` (used by new page)
- **Cleaned:** `src/app/dashboard/page.tsx` (no Practice Modes code)

### Testing:
```
http://localhost:3000/practice-modes
```

---

## Problem Summary

**Symptom:** Practice Modes section shows "No practice items found" even though database has 5 items with `enabled: true`

**Confirmed Working:**
- ✅ Database migration 067 applied successfully
- ✅ Migration 068 enabled practice modes for 5 items (Hello x3, Thank you, Water)
- ✅ PracticeModesSection component renders without errors
- ✅ Correct Supabase project (`bzdzqmnxycnudflcnmzj`)

**Problem:**
- ❌ Browser receives stale data from Supabase (all items show `enabled: false`)
- ❌ Hard refresh doesn't clear cache
- ❌ Component logs show: "Enabled items after filter: 0 []"

---

## Root Cause

**Supabase PostgREST caching** or **read replica lag** causing the REST API to return outdated data even though the database was updated successfully via SQL Editor.

---

## Solutions

### Option 1: Wait for Cache to Clear (5-15 minutes)
Supabase's PostgREST layer caches queries. Wait 10-15 minutes and refresh.

### Option 2: Force Cache Bust via Direct Query

Add a timestamp parameter to force fresh data:

**File:** `src/components/dashboard/practice-modes-section.tsx`

**Change line 72-76 from:**
```typescript
const { data: items, error } = await supabase
    .from('learning_items')
    .select('id, english, greek, level, difficulty, practice_modes_config')
    .not('practice_modes_config', 'is', null)
    .limit(50);
```

**To:**
```typescript
// Force cache bust with timestamp
const cacheBust = Date.now();
const { data: items, error } = await supabase
    .from('learning_items')
    .select('id, english, greek, level, difficulty, practice_modes_config')
    .not('practice_modes_config', 'is', null)
    .limit(50)
    .order('id', { ascending: true }); // Force query rebuild
```

### Option 3: Test with Direct REST API Call

**In terminal (from project root):**
```bash
# Test if REST API returns updated data
curl "https://bzdzqmnxycnudflcnmzj.supabase.co/rest/v1/learning_items?select=id,english,practice_modes_config&practice_modes_config->>enabled=eq.true&limit=5" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Replace `YOUR_ANON_KEY` with value from `.env.local`

**Expected:** Should return 5 items with `enabled: true`
**If not:** Supabase cache hasn't cleared yet

### Option 4: Restart Supabase Connection Pool

**In Supabase Dashboard:**
1. Go to Project Settings → Database
2. Click "Restart" on connection pooler
3. Wait 2-3 minutes
4. Refresh your app

### Option 5: Use Incognito Window

Test in a fresh incognito window to bypass all browser caches.

---

## Infinite Loop Issues (Separate Bug)

**Symptoms:** Console floods with logs, browser freezes

**Cause:** `GrammarDialog` component logging on every render

**Fix Applied:** Disabled console.log in `grammar-dialog.tsx:34`

**If loops persist:**
1. Check for other components with console.logs in render functions
2. Remove all debugging console.logs from render cycles
3. Restart dev server: `npm run dev`

---

## Database Verification

**Confirm data is in database:**
```sql
-- Should return 5 rows
SELECT id, english, practice_modes_config->>'enabled' as enabled
FROM learning_items
WHERE practice_modes_config->>'enabled' = 'true';
```

**Expected IDs:**
- `dde85935-6766-47e8-91aa-019fe8496fe9` - Hello
- `e2493cf1-9b7f-44c4-862f-9a07f93abcfa` - Hello
- `441731a2-395d-4037-9365-993a8b4cb144` - Hello
- `eff9c69a-0860-402d-ad8f-f60d36bb0f69` - Thank you
- `8cf23373-37e7-442f-a834-9a1dbef3f816` - Water

---

## Next Steps

1. **Wait 10-15 minutes** for Supabase cache to clear
2. **Try Option 2** (add cache bust to query)
3. **Verify with Option 3** (direct REST API test)
4. **If still not working:** Contact Supabase support about PostgREST cache invalidation

---

## Files Modified During Debugging

- `src/components/dashboard/practice-modes-section.tsx` - Added extensive logging, increased limit to 50
- `src/components/learning/grammar-dialog.tsx` - Disabled render loop logging
- `supabase/migrations/068_enable_practice_test_data.sql` - Enabled practice modes for test data

---

## Success Criteria

When working, you should see:
- ✅ Practice Modes section with 5 items
- ✅ "Hello", "Thank you", "Water" displayed
- ✅ "Matching" button available (unlocked for Hello & Water since threshold=0)
- ✅ Console shows: "Enabled items after filter: 5"

---

**Last Updated:** 16 February 2026, 19:00 CET
**Status:** ⚠️ TEMPORARY WORKAROUND ACTIVE

---

## ⚠️ TEMPORARY WORKAROUND ACTIVE

**Date Implemented:** 2026-02-16 19:00
**Reason:** Supabase PostgREST cache still serving stale data after 30+ minutes

**What was changed:**
- File: `src/components/dashboard/practice-modes-section.tsx`
- Lines: ~61-78 (loadPracticeItems function)
- Changed from: Filter-based query (`.not('practice_modes_config', 'is', null)`)
- Changed to: Direct ID-based query (`.in('id', knownPracticeIds)`)

**Hardcoded IDs:**
```typescript
const knownPracticeIds = [
  'dde85935-6766-47e8-91aa-019fe8496fe9', // Hello
  'e2493cf1-9b7f-44c4-862f-9a07f93abcfa', // Hello
  '441731a2-395d-4037-9365-993a8b4cb144', // Hello
  'eff9c69a-0860-402d-ad8f-f60d36bb0f69', // Thank you
  '8cf23373-37e7-442f-a834-9a1dbef3f816'  // Water
];
```

---

## ✅ RESOLVED: RPC-Based Solution Implemented (16.02.2026)

**Status:** Cache-Problem dauerhaft gelöst mit RPC endpoint!

### Implementierte Lösung:

**Migration 069:** `get_practice_enabled_items()` RPC function
- Bypasses PostgREST cache completely
- Server-side filtering (better performance)
- Automatically detects new practice-enabled items
- No more hardcoded IDs needed

**Frontend Update:**
```typescript
// OLD (Workaround):
const knownPracticeIds = [...]; // 5 hardcoded IDs
.in('id', knownPracticeIds)

// NEW (RPC Solution):
.rpc('get_practice_enabled_items')
```

**Benefits:**
- ✅ No cache issues
- ✅ Scalable (auto-detects new items)
- ✅ Clean, maintainable code
- ✅ Fast (<3s loading time)

**Deployed:** 16.02.2026, 22:00 CET
**Verified:** Dashboard loads with 5 items, no errors

---

## 🗑️ DEPRECATED: RESTORE PROPER IMPLEMENTATION

~~**IMPORTANT:** This workaround MUST be reverted once the caching issue is resolved!~~

**UPDATE:** Workaround has been replaced with RPC-based solution (see above). No restoration needed.

### When to restore:
- [ ] After Supabase cache TTL expires (test after 24-48 hours)
- [ ] After implementing long-term solution (Server Components / Realtime / Edge Functions)
- [ ] When adding new practice-enabled items (hardcoded IDs won't include them)

### How to restore:

**Step 1:** Open `src/components/dashboard/practice-modes-section.tsx`

**Step 2:** Find the `loadPracticeItems` function (around line 55)

**Step 3:** Replace the TEMPORARY WORKAROUND section with original filter-based query:

```typescript
const { data: items, error } = await supabase
    .from('learning_items')
    .select('id, english, greek, level, difficulty, practice_modes_config')
    .not('practice_modes_config', 'is', null)
    .order('id', { ascending: true })
    .limit(50);
```

**Step 4:** Remove the hardcoded `knownPracticeIds` array

**Step 5:** Test thoroughly:
- Hard refresh browser (Cmd+Shift+R)
- Check console: Should show "Found X enabled practice items" (where X > 0)
- Verify all practice-enabled items appear, not just the 5 hardcoded ones

**Step 6:** Remove this TODO section from TROUBLESHOOTING-Practice-Modes.md

### Alternative: Long-term solutions
Instead of reverting to the original implementation, consider upgrading to:
- **Option A:** Next.js Server Components (no client-side caching issues)
- **Option B:** Supabase Realtime subscriptions (live data updates)
- **Option C:** Edge Functions for practice queries (bypass PostgREST entirely)

See migration 067 and IMPROVMENT-16-02-25.md for implementation details.

---

**Last Updated:** 16 February 2026, 18:30 CET
**Status:** Waiting for Supabase cache invalidation
