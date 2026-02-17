# 🧪 CACHE TESTING PLAN

**Date:** 17. Februar 2026
**Agent:** Agent 2
**Feature:** Mobile Cache (IndexedDB)
**Route:** `/m/practice-modes`

---

## 🎯 TEST OBJECTIVE

Verify that IndexedDB caching works correctly:
- ✅ 1st visit: Cache miss → Fetch data → Save to IndexedDB
- ✅ 2nd visit: Cache hit → Load from IndexedDB (no network request)
- ✅ 3rd visit (after TTL): Cache expired → Fetch fresh → Re-cache

---

## 📋 PRE-TEST SETUP

### 1. Clear IndexedDB
```
DevTools → Application → IndexedDB → greeklingua-mobile → Delete Database
```

### 2. Clear Browser Cache
```
Hard Reload: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

### 3. Open Console
```
DevTools → Console
Filter: "Cache" or "DEBUG"
```

---

## 🧪 TEST CASES

### TEST 1: First Visit (Cache Miss)

**Steps:**
1. Navigate to: `http://localhost:3000/m/practice-modes`
2. Wait for page load
3. Check Console logs

**Expected Console Output:**
```
🔑 [DEBUG] Cache Key Details: { storeName: 'practice_items', key: 'practice-items-{userId}', ... }
🔍 [useMobileCache] Checking cache: practice_items/practice-items-{userId}
🔍 [DEBUG] getCached result: { found: false, ... }
🔍 [Cache] Miss: practice_items/practice-items-{userId}
❌ [useMobileCache] Cache miss: practice_items/practice-items-{userId}
❌ [Practice] Cache miss - fetching fresh data
📡 [useMobileCache] Fetching: practice_items/practice-items-{userId}
🎮 [Mobile Practice] Fetching practice items
🎮 [Mobile Practice] Enabled items: X
🔍 [DEBUG] setCached: { storeName: 'practice_items', ttl: 3600000, expiresIn: '60 minutes', ... }
💾 [Cache] Saved: practice_items/practice-items-{userId} (TTL: 3600000ms)
💾 [useMobileCache] Cached fresh data: practice_items/practice-items-{userId}
```

**Expected IndexedDB:**
```
DevTools → Application → IndexedDB → greeklingua-mobile → practice_items
→ Should see entry: practice-items-{userId}
→ Data: [{ id, english, greek, ... }]
→ expiresAt: {timestamp} (now + 1 hour)
```

**Expected Network:**
```
DevTools → Network → Filter: RPC
→ Should see: get_practice_enabled_items (1 request)
```

**Result:** ❌ FAIL / ✅ PASS

---

### TEST 2: Second Visit (Cache Hit)

**Steps:**
1. Reload page: `Cmd+R` / `Ctrl+R`
2. Wait for page load
3. Check Console logs

**Expected Console Output:**
```
🔑 [DEBUG] Cache Key Details: { storeName: 'practice_items', key: 'practice-items-{userId}', ... }
🔍 [useMobileCache] Checking cache: practice_items/practice-items-{userId}
🔍 [DEBUG] getCached result: { found: true, isExpired: false, ... }
✅ [Cache] Hit: practice_items/practice-items-{userId}
✅ [useMobileCache] Cache hit: practice_items/practice-items-{userId}
✅ [Practice] Using cached data
```

**Expected Network:**
```
DevTools → Network → Filter: RPC
→ Should see: NO get_practice_enabled_items request! ✅
→ Only unlock status requests (getPracticeConfig)
```

**Expected UI:**
```
→ Cache indicator badge visible (blue chip: "Cached")
→ Page loads instantly (< 50ms)
→ Practice items displayed correctly
```

**Result:** ❌ FAIL / ✅ PASS

---

### TEST 3: Multiple Reloads (Stability Test)

**Steps:**
1. Reload page 5 times in a row
2. Check Console after each reload

**Expected:**
- ✅ All 5 reloads show "Cache hit"
- ✅ NO "Cache miss" logs
- ✅ NO duplicate RPC calls
- ✅ Cache key remains consistent: `practice-items-{same-userId}`

**Result:** ❌ FAIL / ✅ PASS

---

### TEST 4: Cache Expiry (TTL Test)

**Option A: Wait 1 hour**
1. Wait 60 minutes
2. Reload page
3. Expected: Cache miss → Fresh fetch → Re-cache

**Option B: Modify TTL (faster test)**
1. Edit `src/lib/cache/mobile-cache.ts`:
   ```typescript
   PRACTICE_ITEMS: 10 * 1000, // 10 seconds (TEST ONLY!)
   ```
2. Reload page → Cache hit
3. Wait 15 seconds
4. Reload page → Cache miss (expired)
5. **Remember to revert TTL back to 1 hour!**

**Expected Console (after expiry):**
```
🔍 [DEBUG] getCached result: { found: true, isExpired: true, ... }
⏰ [Cache] Expired: practice_items/practice-items-{userId}
❌ [useMobileCache] Cache miss: practice_items/practice-items-{userId}
📡 [useMobileCache] Fetching: practice_items/practice-items-{userId}
💾 [Cache] Saved: practice_items/practice-items-{userId} (TTL: 3600000ms)
```

**Result:** ❌ FAIL / ✅ PASS

---

### TEST 5: Refresh Button (Force Refresh)

**Steps:**
1. Load page (should be cache hit)
2. Click "🔄" refresh button in header
3. Check Console

**Expected:**
```
🔄 [useMobileCache] Force refresh: practice_items/practice-items-{userId}
📡 [useMobileCache] Fetching: practice_items/practice-items-{userId}
💾 [Cache] Saved: practice_items/practice-items-{userId} (TTL: 3600000ms)
```

**Expected Network:**
```
→ Should see: get_practice_enabled_items (fresh fetch)
```

**Result:** ❌ FAIL / ✅ PASS

---

### TEST 6: Offline Mode (Service Degradation)

**Steps:**
1. Load page (cache should be populated)
2. DevTools → Network → Throttling: "Offline"
3. Reload page

**Expected:**
```
✅ [Cache] Hit: practice_items/practice-items-{userId}
✅ [Practice] Using cached data
→ Page loads from cache (offline banner shows)
```

**Result:** ❌ FAIL / ✅ PASS

---

## 📊 SUCCESS CRITERIA

**All tests MUST pass:**
- ✅ TEST 1: Cache miss on first visit
- ✅ TEST 2: Cache hit on second visit
- ✅ TEST 3: Stable cache across reloads
- ✅ TEST 4: Cache expires after TTL
- ✅ TEST 5: Manual refresh bypasses cache
- ✅ TEST 6: Offline mode uses cache

**Performance:**
- ✅ Cache hit load time: < 50ms
- ✅ Cache miss load time: 300-500ms (network dependent)

**No Regressions:**
- ✅ No duplicate RPC calls
- ✅ No console errors
- ✅ UI renders correctly
- ✅ Unlock statuses load correctly

---

## 🐛 DEBUGGING

**If Cache Miss persists:**

1. **Check user?.id consistency:**
   ```javascript
   // In Console:
   console.log('User ID:', user?.id);
   // Should be same across reloads!
   ```

2. **Check IndexedDB entry:**
   ```
   DevTools → Application → IndexedDB → greeklingua-mobile → practice_items
   → Verify key matches: practice-items-{userId}
   ```

3. **Check expiresAt timestamp:**
   ```javascript
   // In Console:
   const item = await db.get('practice_items', 'practice-items-{userId}');
   console.log('Expires:', new Date(item.expiresAt));
   console.log('Now:', new Date());
   console.log('Expired?', item.expiresAt < Date.now());
   ```

4. **Check callback re-renders:**
   ```
   Look for multiple "🔑 [DEBUG] Cache Key Details" logs
   → Should only appear ONCE per page load!
   ```

---

## 📝 TEST REPORT TEMPLATE

```markdown
## Cache Test Results

**Date:** {date}
**Tester:** {name}
**Browser:** {browser + version}

| Test Case | Status | Notes |
|-----------|--------|-------|
| TEST 1: First Visit | ✅ / ❌ | |
| TEST 2: Second Visit | ✅ / ❌ | |
| TEST 3: Multiple Reloads | ✅ / ❌ | |
| TEST 4: Cache Expiry | ✅ / ❌ | |
| TEST 5: Refresh Button | ✅ / ❌ | |
| TEST 6: Offline Mode | ✅ / ❌ | |

**Overall Result:** ✅ PASS / ❌ FAIL

**Issues Found:**
- {issue 1}
- {issue 2}

**Performance:**
- Cache hit: {X}ms
- Cache miss: {Y}ms
```

---

**Ready to test!** 🚀
