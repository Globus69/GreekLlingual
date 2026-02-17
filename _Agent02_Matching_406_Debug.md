# 🔍 AGENT 2: MATCHING GAME 406 ERROR DEBUG

**Date:** 17. Februar 2026, 21:00 CET
**Priority:** 🔴 CRITICAL
**Type:** Bug Investigation & Fix
**Estimated Time:** 30-60 minutes

---

## 🎯 PROBLEM

**Error:**
```
fetch.ts:7
GET https://bzdzqmnxycnudflcnmzj.supabase.co/rest/v1/student_progress?select=*&item_id=eq.GUID&student_id=eq.a72b7e78-afc5-428a-85bd-cc36ab1016be
406 (Not Acceptable)
```

**Location:** Matching Game
**HTTP Status:** 406 Not Acceptable
**Endpoint:** `/rest/v1/student_progress`
**Query Params:**
- `select=*`
- `item_id=eq.[GUID]`
- `student_id=eq.a72b7e78-afc5-428a-85bd-cc36ab1016be`

---

## 🔎 DEINE AUFGABE

### 1. **Error Lokalisieren** (10 Min)

**Finde die Datei:**
```bash
# Suche nach fetch.ts oder dem Matching Game Code
find src -name "fetch.ts" -o -name "*matching*"
```

**Prüfe:**
- Wo wird `student_progress` abgefragt?
- Welche Komponente macht den Request?
- Ist es Desktop oder Mobile Matching Game?

**Wahrscheinliche Locations:**
- `/src/app/m/practice-modes/matching/` (Mobile)
- `/src/components/learning/practice-modes/matching-game.tsx`
- `/src/lib/supabase/student-progress.ts`

---

### 2. **Root Cause Analyse** (20 Min)

**406 Not Acceptable bedeutet normalerweise:**

#### A) **Fehlende/Falsche Accept-Header**
```typescript
// Prüfe ob Accept-Header gesetzt wird
headers: {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}
```

#### B) **RLS Policy blockiert**
```sql
-- In Supabase SQL Editor prüfen:
SELECT * FROM student_progress
WHERE student_id = 'a72b7e78-afc5-428a-85bd-cc36ab1016be'
LIMIT 5;

-- Wenn leer oder Error → RLS Policy Problem!
```

#### C) **Tabelle existiert nicht**
```sql
-- Prüfe ob Tabelle existiert:
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'student_progress';

-- Falls nicht → Muss erstellt werden!
```

#### D) **Spalte existiert nicht**
```sql
-- Prüfe Spalten:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'student_progress';

-- item_id und student_id müssen existieren!
```

#### E) **Format-Mismatch (UUID vs String)**
```typescript
// Prüfe Datentyp:
// UUID muss als UUID gesendet werden, nicht als String!

// ❌ FALSCH:
.eq('student_id', 'a72b7e78-afc5-428a-85bd-cc36ab1016be')

// ✅ RICHTIG (falls UUID column):
.eq('student_id', 'a72b7e78-afc5-428a-85bd-cc36ab1016be')
// (sollte gleich sein, aber Supabase ist wählerisch!)
```

---

### 3. **Debugging Steps** (30 Min)

#### **Step 1: Browser Console Check**
```javascript
// Öffne DevTools → Console
// Führe direkt aus:
const { data, error } = await supabase
  .from('student_progress')
  .select('*')
  .eq('student_id', 'a72b7e78-afc5-428a-85bd-cc36ab1016be')
  .limit(5);

console.log('Data:', data);
console.log('Error:', error);

// Falls Error → error.message zeigt Root Cause!
```

#### **Step 2: Supabase Dashboard Check**
1. Gehe zu: https://supabase.com/dashboard
2. Wähle Projekt: `bzdzqmnxycnudflcnmzj`
3. Table Editor → `student_progress`
   - Existiert die Tabelle? ✅/❌
   - Gibt es Daten? ✅/❌
   - Spalten: `id`, `student_id`, `item_id`? ✅/❌

#### **Step 3: RLS Policy Check**
```sql
-- In Supabase SQL Editor:
SELECT *
FROM pg_policies
WHERE tablename = 'student_progress';

-- Prüfe ob Policy existiert für SELECT!
```

**Erwartete Policy:**
```sql
-- Should allow students to read their own progress:
CREATE POLICY "Students can view own progress"
ON student_progress
FOR SELECT
USING (student_id = auth.uid());
```

#### **Step 4: Network Tab Analysis**
1. DevTools → Network Tab
2. Reproduziere Error (Matching Game öffnen)
3. Finde Request zu `student_progress`
4. Check:
   - Request Headers (Accept, Authorization)
   - Response Headers
   - Response Body (zeigt oft Details!)

---

### 4. **Häufige Fixes**

#### **Fix A: Tabelle existiert nicht**
```sql
-- In Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES learning_items(id) ON DELETE CASCADE,
  correct_count INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy:
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
ON student_progress FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can update own progress"
ON student_progress FOR INSERT
WITH CHECK (student_id = auth.uid());
```

#### **Fix B: RLS Policy fehlt**
```sql
-- Aktiviere RLS:
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Füge Policy hinzu:
CREATE POLICY "Students can view own progress"
ON student_progress FOR SELECT
USING (student_id = auth.uid());
```

#### **Fix C: Falsche Query**
```typescript
// ❌ FALSCH (406 Error möglich):
const { data, error } = await supabase
  .from('student_progress')
  .select('*')
  .eq('item_id', itemId)
  .eq('student_id', userId);

// ✅ RICHTIG (mit single() oder maybeSingle()):
const { data, error } = await supabase
  .from('student_progress')
  .select('*')
  .eq('item_id', itemId)
  .eq('student_id', userId)
  .maybeSingle(); // Returns null if not found, not error!
```

#### **Fix D: Auth Token fehlt**
```typescript
// Prüfe ob User authenticated:
const { data: { user } } = await supabase.auth.getUser();
console.log('🔍 User:', user);

// Falls null → Login required!
if (!user) {
  router.push('/login-pin');
}
```

---

## 📊 EXPECTED OUTCOME

**Nach Fix:**
- ✅ GET Request zu `student_progress` returns 200 OK
- ✅ Matching Game lädt korrekt
- ✅ Keine 406 Errors in Console
- ✅ User Progress wird gespeichert/geladen

---

## 📝 DEBUGGING LOGS

**Füge Debug-Logs hinzu:**
```typescript
// In der Datei die student_progress abfragt:
console.log('🔍 [Debug] Fetching student_progress...');
console.log('🔍 [Debug] student_id:', userId);
console.log('🔍 [Debug] item_id:', itemId);

const { data, error } = await supabase
  .from('student_progress')
  .select('*')
  .eq('item_id', itemId)
  .eq('student_id', userId)
  .maybeSingle();

console.log('🔍 [Debug] Response:', { data, error });

if (error) {
  console.error('❌ [Error] student_progress query failed:', error);
  console.error('❌ [Error] Error code:', error.code);
  console.error('❌ [Error] Error message:', error.message);
  console.error('❌ [Error] Error details:', error.details);
}
```

---

## 🎯 SUCCESS CRITERIA

**Fix ist erfolgreich wenn:**
- ✅ Keine 406 Errors in Console
- ✅ Matching Game lädt ohne Fehler
- ✅ `student_progress` Query returns 200 OK
- ✅ User kann Matching Game spielen
- ✅ Progress wird korrekt gespeichert

---

## 📁 RELEVANTE DATEIEN

**Zu untersuchen:**
1. Matching Game Component (wo Error auftritt)
2. `src/lib/supabase/student-progress.ts` (falls existiert)
3. Supabase Table: `student_progress`
4. RLS Policies für `student_progress`

**Zu dokumentieren:**
- Erstelle: `MATCHING-GAME-406-FIX.md` (Root Cause + Fix)
- Update: `_Agent2_Logic_Mobile.md` (Changelog)
- Update: `TROUBLESHOOTING-Practice-Modes.md` (falls relevant)

---

## 🚨 WICHTIGE HINWEISE

1. **Mobile-First:** Fokus auf Mobile Matching Game (`/m/*`)
2. **Naming Convention:** kebab-case für Dateien
3. **Console Logs:** Temporär OK für Debugging
4. **Error Handling:** Graceful fallbacks implementieren
5. **RLS Policies:** NIEMALS deaktivieren, nur richtig konfigurieren!

---

## 📝 REPORTING

**Nach Completion:**

### MATCHING-GAME-406-FIX.md
```markdown
# Matching Game 406 Error Fix

## Problem
406 Not Acceptable bei student_progress Query.

## Root Cause
[DEINE ANALYSE]

## Fix
[WAS DU GEÄNDERT HAST]

## Testing
[VERIFICATION STEPS]

## Impact
- Matching Game funktioniert wieder
- User Progress wird korrekt gespeichert
```

---

## ⏱️ CHECKPOINTS

**Melde dich bei:**
- ✅ **Checkpoint 1 (15 Min):** Error lokalisiert → Root Cause identifiziert
- ✅ **Checkpoint 2 (35 Min):** Fix implementiert → Ready for Testing
- ✅ **Checkpoint 3 (55 Min):** Testing complete → Report erstellt

**Bei Blocker:**
- Frage sofort (nicht weiter raten)
- Nenne: Was funktioniert nicht? Was hast du versucht?
- Zeige: Error Message, Code Snippet, SQL Query Result

---

**Start NOW!** 🚀

**Agent 2, debug & fix this 406 error. Report back with solution.**
