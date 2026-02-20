# Brain Gym RPC Functions - User TODO Checklist

**Created:** 2026-02-19
**Status:** ⏳ Awaiting User Actions
**Estimated Time:** 15-30 minutes

---

## Quick Start

1. Deploy migration 073 to Supabase
2. Test Brain Gym in browser
3. Complete testing checklist

---

## ✅ What's Already Done (Agent 2)

- ✅ Migration 073 created (2 new RPC functions)
- ✅ Brain Gym updated to use RPCs
- ✅ Complete documentation provided
- ✅ Testing checklist created
- ✅ Deployment guide created

---

## ⏳ Your Actions Required

### Step 1: Deploy Migration to Supabase (5 minutes)

**Choose ONE option:**

#### Option A: Via Supabase Dashboard (Recommended)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" → "New query"
4. Copy migration SQL:
   ```bash
   cat supabase/migrations/073_brain_gym_rpc_functions.sql | pbcopy
   ```
5. Paste into SQL Editor
6. Click "Run" or press `Cmd+Enter`
7. Verify success message: "Success. No rows returned"

#### Option B: Via Supabase CLI (Alternative)

```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard
supabase db push
```

**Verification:**

Run in SQL Editor to confirm functions exist:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('get_all_vocabulary_cards', 'get_weak_vocabulary_cards');
```

Expected: 2 rows returned

---

### Step 2: Test RPC Functions (5 minutes)

Run in Supabase SQL Editor:

```sql
-- Replace YOUR-USER-ID with your actual user ID
-- Get your user ID first:
SELECT id, email FROM auth.users LIMIT 5;

-- Test 1: Get All Vocabulary Cards
SELECT * FROM get_all_vocabulary_cards('YOUR-USER-ID'::UUID, 5);
-- Expected: Returns 5 vocabulary cards (or fewer)

-- Test 2: Get Weak Vocabulary Cards
SELECT * FROM get_weak_vocabulary_cards('YOUR-USER-ID'::UUID, 5);
-- Expected: Returns difficult cards (may be 0 if you have none)
```

---

### Step 3: Test Brain Gym in Browser (10 minutes)

1. **Start Dev Server** (if not running)
   ```bash
   npm run dev
   ```

2. **Open Brain Gym**
   - Navigate to: http://localhost:3000/m/brain-gym

3. **Test Each Data Source**
   - [ ] Select "📅 Due Cards" → Cards load
   - [ ] Select "📖 Review Vocabulary" → Different cards load
   - [ ] Select "💪 Weak Words" → Difficult cards load (or empty state)

4. **Check Console**
   - [ ] Open DevTools (F12 or Cmd+Option+I)
   - [ ] No error messages
   - [ ] RPC calls succeed

5. **Play a Game**
   - [ ] Cards flip on tap
   - [ ] Matching works
   - [ ] Game completes successfully

---

### Step 4: Complete Testing Checklist (Optional, 10 minutes)

See full checklist in: `BRAIN-GYM-RPC-TESTING.md`

**Quick Tests:**
- [ ] Due Cards loads
- [ ] Review Vocab loads
- [ ] Weak Words loads (or shows empty state)
- [ ] Switching between sources works
- [ ] Cache refreshes correctly
- [ ] No console errors

---

## 📚 Documentation Reference

| File | Purpose | Size |
|------|---------|------|
| `BRAIN-GYM-DEPLOYMENT.md` | Step-by-step deployment guide | 8.1 KB |
| `BRAIN-GYM-RPC-TESTING.md` | Testing checklist (7 cases) | 3.3 KB |
| `docs/BRAIN-GYM-RPC-FUNCTIONS.md` | Complete API documentation | 7.6 KB |
| `BRAIN-GYM-RPC-IMPLEMENTATION-SUMMARY.md` | Overview & technical details | 9.9 KB |

**Start here:** `BRAIN-GYM-DEPLOYMENT.md`

---

## 🚨 Troubleshooting

### Error: "function does not exist"

**Cause:** Migration 073 not deployed

**Solution:** Go back to Step 1

---

### Error: "No items available"

**Cause:** No vocabulary items in database OR RLS blocking access

**Solution:** Check vocabulary items exist:
```sql
SELECT COUNT(*) FROM learning_items WHERE type = 'vocabulary';
```

---

### Weak Words always empty

**Cause:** No difficult cards in your progress

**Solution:** This is normal! Use "Review Vocabulary" instead, or create test data (see `BRAIN-GYM-DEPLOYMENT.md` Step 5)

---

### Console errors in browser

**Cause:** Various (check error message)

**Solution:**
1. Clear browser cache
2. Restart dev server
3. Check Supabase connection
4. Review error message in console

---

## ✅ Success Criteria

You're done when:

- ✅ Migration 073 deployed without errors
- ✅ Functions verified in SQL Editor
- ✅ Brain Gym loads without errors
- ✅ All 3 data sources work
- ✅ No console errors

---

## 🎉 After Success

Once everything works:

1. **Optional:** Add performance indexes (see `BRAIN-GYM-DEPLOYMENT.md`)
2. **Optional:** Complete full testing checklist
3. **Consider:** Future enhancements (Smart Mixing, FSRS UI feedback)

---

## 📝 Report Issues

If you encounter problems:

1. Check troubleshooting section above
2. Review `BRAIN-GYM-DEPLOYMENT.md` for detailed help
3. Document issue in `BRAIN-GYM-RPC-TESTING.md` Issues table
4. Share error messages and console output

---

## 🔄 Rollback (If Needed)

If something goes wrong:

```sql
-- Remove new functions
DROP FUNCTION IF EXISTS get_all_vocabulary_cards(UUID, INT);
DROP FUNCTION IF EXISTS get_weak_vocabulary_cards(UUID, INT);
```

```bash
# Revert code changes
git checkout HEAD~1 src/app/m/brain-gym/page.tsx
```

---

## Time Estimates

| Task | Time |
|------|------|
| Deploy migration | 5 min |
| Test SQL | 5 min |
| Test browser | 10 min |
| Full checklist (optional) | 10 min |
| **Total** | **15-30 min** |

---

## Checklist Summary

### Required (15 minutes)
- [ ] Deploy migration 073
- [ ] Verify functions exist
- [ ] Test in SQL Editor
- [ ] Test in browser
- [ ] Verify no errors

### Optional (10 minutes)
- [ ] Complete full testing checklist
- [ ] Add performance indexes
- [ ] Create test data for Weak Words

---

**Next Document:** Start with `BRAIN-GYM-DEPLOYMENT.md`

**Status:** Ready for deployment
