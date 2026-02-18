# Backend Issues Found - Agent 9

**Date:** February 18, 2026
**Agent:** Agent 9 (UI Frontend Specialist)
**Issue Type:** Backend API Bug

---

## ⚠️ CRITICAL ISSUE: Wrong Table Name in API Routes

### Problem
The API route `/src/app/api/admin/vocab/[id]/route.ts` (created by Agent 8) uses the wrong table name in Supabase queries.

**Current (WRONG):**
```typescript
// Line 116-120
const { data, error } = await supabase
    .from('vocabulary_content')  // ❌ WRONG TABLE NAME
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();

// Line 220-223
const { error } = await supabase
    .from('vocabulary_content')  // ❌ WRONG TABLE NAME
    .delete()
    .eq('id', id);
```

**Should be:**
```typescript
// Line 116-120
const { data, error } = await supabase
    .from('multilingual_vocabulary')  // ✅ CORRECT TABLE NAME
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();

// Line 220-223
const { error } = await supabase
    .from('multilingual_vocabulary')  // ✅ CORRECT TABLE NAME
    .delete()
    .eq('id', id);
```

### Impact
- ❌ PATCH requests to update entries will fail (404 table not found)
- ❌ DELETE requests to delete entries will fail (404 table not found)
- ✅ GET requests work fine (use RPC functions)
- ✅ POST requests work fine (use RPC functions)
- ✅ CSV import works fine (uses Supabase client directly)

### Affected Files
1. `/src/app/api/admin/vocab/[id]/route.ts` - Lines 116-120 and 220-223

### Affected UI Components
This bug will cause errors when users try to:
1. **Edit an entry** - VocabModal (edit mode) will fail on save
2. **Delete an entry** - VocabTable delete button will fail

### Fix Required
Replace `'vocabulary_content'` with `'multilingual_vocabulary'` in both locations.

---

## 🔧 RECOMMENDED FIX

### File: `/src/app/api/admin/vocab/[id]/route.ts`

**Change 1 (Line 116):**
```diff
-    .from('vocabulary_content')
+    .from('multilingual_vocabulary')
```

**Change 2 (Line 220):**
```diff
-    .from('vocabulary_content')
+    .from('multilingual_vocabulary')
```

---

## 🧪 Testing After Fix

After applying the fix, test:
1. ✅ Edit an existing vocabulary entry
2. ✅ Delete a vocabulary entry
3. ✅ Verify database reflects changes

---

## 📋 Other API Routes to Check

These routes may have similar issues (not verified):
- `/src/app/api/admin/vocab/route.ts` (GET/POST)
- `/src/app/api/admin/vocab/bulk/route.ts` (Bulk operations)
- `/src/app/api/admin/vocab/import/route.ts` (CSV import)
- `/src/app/api/admin/vocab/export/route.ts` (CSV export)

**Note:** The client-side API layer (`/src/lib/api/vocab.ts`) uses correct table names via direct Supabase client calls, so **only the authenticated API routes** need to be checked.

---

## ✅ Verification Steps

1. Search codebase for `'vocabulary_content'`
2. Replace all occurrences with `'multilingual_vocabulary'`
3. Run TypeScript compiler
4. Test PATCH and DELETE endpoints
5. Verify UI works end-to-end

---

## 📞 Handoff to Backend Team

**Priority:** HIGH (blocks Edit/Delete functionality)
**Estimated Fix Time:** 2 minutes
**Risk Level:** LOW (simple find/replace)

---

**Agent 9 Note:** This is a backend bug from Agent 8's work. My UI components are correct and will work once the backend bug is fixed.
