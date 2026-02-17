# 🔍 AGENT 2: MOBILE CACHE DEBUGGING - FEHLERSUCHE

**Date:** 17. Februar 2026, 20:45 CET
**Priority:** HIGH ⚠️
**Type:** Bug Investigation & Fix
**Estimated Time:** 1-2 hours

---

## 🎯 PROBLEM

**Symptom:** Cache miss wird bei jedem Page Load geloggt:
```
❌ [Practice] Cache miss - fetching fresh data
```

**Location:** `/src/app/m/practice-modes/page.tsx:103`

**Expected Behavior:**
- 1. Besuch: Cache miss ❌ → Daten fetchen → In IndexedDB speichern
- 2. Besuch (innerhalb TTL): Cache hit ✅ → Daten aus IndexedDB laden

**Actual Behavior:**
- JEDER Besuch: Cache miss ❌ → Immer fresh fetch (Cache funktioniert nicht?)

---

## 🔎 DEINE AUFGABE

### 1. **Cache System Diagnose** (30 Min)

**Prüfe folgendes:**

#### A) IndexedDB wird korrekt initialisiert?
```typescript
// Öffne DevTools → Application → IndexedDB
// Prüfe: Existiert DB "greeklingua-mobile"?
// Prüfe: Existieren Stores "practice_items", "vocabulary_cards", "user_progress"?
```

#### B) Daten werden gespeichert?
```typescript
// Nach Page Load: Application → IndexedDB → greeklingua-mobile → practice_items
// Sollte Entry sehen: key = "practice-items-{userId}", data = [...items]
// Wenn KEINE Entries → Cache speichert nicht!
```

#### C) Cache-Key konsistent?
```typescript
// In: src/app/m/practice-modes/page.tsx:93
key: `practice-items-${user?.id}`

// Prüfe: Ist user?.id IMMER identisch zwischen Requests?
// Log: console.log('🔑 Cache Key:', `practice-items-${user?.id}`);
```

#### D) TTL korrekt?
```typescript
// In: src/app/m/practice-modes/page.tsx:95
ttl: CACHE_TTL.PRACTICE_ITEMS, // 1 hour

// Prüfe: Was ist CACHE_TTL.PRACTICE_ITEMS?
// Ist TTL > 0? (Wenn 0 → instant expiry!)
```

#### E) useMobileCache Hook Logic
```typescript
// In: src/hooks/use-mobile-cache.ts
// Prüfe:
// 1. Wird getCachedData() VOR fetch aufgerufen?
// 2. Gibt getCachedData() cached data zurück oder null?
// 3. Wird setCachedData() NACH fetch aufgerufen?
// 4. Expiry-Check korrekt? (Date.now() < expiresAt?)
```

---

### 2. **Root Cause identifizieren** (20 Min)

**Finde heraus WARUM Cache nicht funktioniert:**

Häufige Ursachen:
- ❌ IndexedDB nicht unterstützt (iOS Private Mode?)
- ❌ Cache-Key ändert sich bei jedem Request (user?.id undefined?)
- ❌ TTL = 0 oder negative Zahl
- ❌ getCachedData() gibt immer null zurück (Logic-Bug)
- ❌ setCachedData() speichert nicht (IndexedDB Error?)
- ❌ Expiry-Check falsch (Date.now() vs timestamp Mismatch)

**Debug-Logs hinzufügen:**
```typescript
// In src/lib/cache/mobile-cache.ts oder use-mobile-cache.ts
console.log('🔍 [Cache Debug] Key:', key);
console.log('🔍 [Cache Debug] Checking cache...');
console.log('🔍 [Cache Debug] Cached data:', cachedData);
console.log('🔍 [Cache Debug] Expired?', Date.now() > cachedData?.expiresAt);
console.log('🔍 [Cache Debug] Saving to cache:', data);
```

---

### 3. **Fix implementieren** (30 Min)

**Basierend auf Root Cause, fixe das Problem:**

#### Beispiel-Fixes:

**A) User ID fehlt (undefined) → Cache-Key inkonsistent**
```typescript
// FIX: Warte auf user?.id bevor Cache aktiviert wird
enabled: !!user?.id, // ✅ Bereits vorhanden

// ODER: Default Key wenn user.id fehlt
key: `practice-items-${user?.id || 'anonymous'}`
```

**B) TTL = 0 oder undefined**
```typescript
// FIX: Setze sinnvolle Default-TTL
ttl: CACHE_TTL.PRACTICE_ITEMS || 3600000, // 1h fallback
```

**C) IndexedDB save() fehlschlägt**
```typescript
// FIX: Error Handling hinzufügen
try {
  await tx.objectStore(storeName).put(cachedItem);
  await tx.done;
  console.log('✅ Saved to IndexedDB');
} catch (err) {
  console.error('❌ IndexedDB save failed:', err);
  // Optional: Fallback to localStorage
}
```

**D) getCachedData() Logic-Bug**
```typescript
// Prüfe: Wird korrekt checked ob expired?
if (!cachedItem || Date.now() > cachedItem.expiresAt) {
  console.log('❌ Cache expired or missing');
  return null;
}
console.log('✅ Cache hit!');
return cachedItem.data;
```

---

### 4. **Testing & Verifikation** (20 Min)

**Nach Fix:**

1. **Clear IndexedDB komplett:**
   - DevTools → Application → IndexedDB → greeklingua-mobile → Delete Database

2. **Reload Page (1. Besuch):**
   - Erwarte: ❌ Cache miss → Fresh fetch
   - Prüfe: IndexedDB → practice_items → Entry vorhanden?

3. **Reload Page (2. Besuch):**
   - Erwarte: ✅ Cache hit → Daten aus IndexedDB
   - Keine Network Request zu Supabase!

4. **Performance messen:**
   ```typescript
   // Mit Cache: < 50ms
   // Ohne Cache: 300-500ms
   ```

5. **Expiry testen:**
   - Warte TTL ab (1h) oder setze TTL auf 10 Sekunden für Test
   - Nach Expiry: Cache miss → Fresh fetch → Re-cache

---

## 📊 SUCCESS CRITERIA

**Fix ist erfolgreich wenn:**
- ✅ 1. Page Load: Cache miss → Daten in IndexedDB gespeichert
- ✅ 2. Page Load (innerhalb TTL): Cache hit ✅ → Keine Network Request
- ✅ 3. Page Load (nach TTL): Cache miss → Fresh fetch → Re-cache
- ✅ Console Logs zeigen ✅ statt ❌
- ✅ DevTools → Network: Kein RPC-Call bei Cache hit
- ✅ Load Time: < 50ms bei Cache hit

---

## 📁 RELEVANTE DATEIEN

**Zu untersuchen:**
1. `/src/app/m/practice-modes/page.tsx` (Cache usage, line 86-105)
2. `/src/hooks/use-mobile-cache.ts` (Hook logic)
3. `/src/lib/cache/mobile-cache.ts` (IndexedDB wrapper)
4. `/src/lib/cache/constants.ts` (TTL values - falls existiert)

**Zu dokumentieren:**
- Erstelle: `CACHE-DEBUG-REPORT.md` (Root Cause + Fix)
- Update: `_Agent2_Logic_Mobile.md` (Changelog)
- Update: `MASTER-SESSION-STATUS.md` (kurz)

---

## 🚨 WICHTIGE HINWEISE

1. **Mobile-First:** Fokus auf Mobile Cache (`/m/*` Routes)
2. **Naming Convention:** kebab-case für neue Dateien
3. **Keine Desktop-Änderungen:** Nur Mobile betrifft
4. **Console Logs:** Temporär OK für Debugging, später entfernen
5. **Error Handling:** Immer try/catch bei IndexedDB Operations

---

## 📝 REPORTING

**Nach Completion, erstelle:**

### CACHE-DEBUG-REPORT.md
```markdown
# Cache Debug Report

## Problem
Cache miss bei jedem Page Load.

## Root Cause
[DEINE ANALYSE HIER]

## Fix
[WAS DU GEÄNDERT HAST]

## Testing
[TEST RESULTS]

## Impact
- Load Time: 500ms → 20ms (Cache hit)
- Reduced Server Load: -95% RPC calls
```

---

## ⏱️ CHECKPOINTS

**Melde dich bei:**
- ✅ **Checkpoint 1 (30 Min):** Diagnose abgeschlossen → Root Cause identifiziert
- ✅ **Checkpoint 2 (60 Min):** Fix implementiert → Ready for Testing
- ✅ **Checkpoint 3 (90 Min):** Testing abgeschlossen → Report erstellt

**Bei Blocker:**
- Frage sofort (nicht weiter raten)
- Nenne: Was funktioniert nicht? Was hast du versucht?

---

**Start NOW!** 🚀

**Agent 2, du hast die Kontrolle. Debug, Fix, Test, Report.**
