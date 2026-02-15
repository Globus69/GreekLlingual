# 🔧 Migration 059 - Permission Fix Guide

**Problem:** `start_learning_session` RPC returns 404 (Not Found)

**Root Cause:** Missing `GRANT EXECUTE` permissions in original migration

---

## 🎯 Quick Fix (5 Minutes)

### Option A: Execute Fix SQL (RECOMMENDED)

1. **Open Supabase Dashboard**
   - Go to: SQL Editor

2. **Execute Fix Migration**
   - Open file: `059_fix_permissions.sql`
   - Copy entire content
   - Paste in SQL Editor
   - Click "Run"

3. **Verify Output**
   - Should see: `✅ All 4 functions found`
   - Should see: `✅ Permissions granted successfully`

4. **Test in Browser**
   ```javascript
   // Open Browser Console (F12)
   const { data, error } = await supabase.rpc('start_learning_session', {
     p_student_id: 'your-user-id-here',
     p_session_type: 'vocabulary'
   });
   console.log('Result:', data, 'Error:', error);
   // Expected: data = UUID, error = null
   ```

---

### Option B: Manual GRANT (Quick)

```sql
-- Copy & paste this into Supabase SQL Editor:
GRANT EXECUTE ON FUNCTION public.start_learning_session(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.end_learning_session(UUID, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_session_stats(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_recent_sessions(UUID, INTEGER) TO authenticated, anon;
NOTIFY pgrst, 'reload schema';
```

---

## 🔍 Troubleshooting

### Issue: Functions don't exist

**Check:**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%learning_session%';
```

**If empty:** Run original migration first (`059_add_session_tracking.sql`)

---

### Issue: Permissions still failing

**Check current permissions:**
```sql
SELECT
  proname,
  has_function_privilege('authenticated', oid, 'EXECUTE') AS can_execute
FROM pg_proc
WHERE proname LIKE '%learning_session%';
```

**If false:** Re-run GRANT statements

---

### Issue: Still getting 404

**Reload schema cache:**
```sql
NOTIFY pgrst, 'reload schema';
```

**Wait 30 seconds, then test again**

---

## 📊 Verification Checklist

- [ ] All 4 functions exist in database
- [ ] `authenticated` role has EXECUTE permission
- [ ] `anon` role has EXECUTE permission
- [ ] Schema cache reloaded (`NOTIFY pgrst`)
- [ ] Browser test successful (no 404 error)
- [ ] VocabularyDialogFSRS loads without errors

---

## ✅ Success Criteria

**Before Fix:**
```
❌ POST .../rpc/start_learning_session 404 (Not Found)
```

**After Fix:**
```
✅ POST .../rpc/start_learning_session 200 OK
✅ Response: "session-uuid-here"
```

---

## 🚀 Next Steps

Once fixed:
1. Test vocabulary learning session
2. Verify session tracking in `learning_sessions` table
3. Check `get_session_stats()` returns data
4. Mark TODO Task 0 as complete ✅

---

**Last Updated:** 2026-02-15
**Related Migration:** 059_add_session_tracking.sql
**Related Component:** VocabularyDialogFSRS.tsx
