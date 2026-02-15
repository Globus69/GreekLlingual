# Migration 064 – Grammar RPC Functions Application Guide
**Created:** 15. Februar 2026
**Purpose:** Enable real DB integration for Grammar module (replace mock data)

## ✅ Was macht diese Migration?

Diese Migration erstellt zwei neue RPC-Funktionen für das Grammar-Modul:

1. **`get_due_grammar_cards`** – Lädt fällige Grammar-Cards für einen User
2. **`update_grammar_card_progress`** – Aktualisiert FSRS-Daten **korrekt** in `student_progress` (pro User)

**Wichtig:** Diese Migration **fixe** das Design-Problem, dass FSRS-Daten in `learning_items` gespeichert wurden (was dazu führte, dass User sich gegenseitig überschrieben haben).

## 🚀 Anwendung

### Schritt 1: Migration in Supabase ausführen

1. Gehe zu **Supabase Dashboard** → **SQL Editor**
2. Öffne `database/migrations/064_create_grammar_rpc_functions.sql`
3. Kopiere den gesamten SQL-Code
4. Füge ihn in den SQL Editor ein
5. Klicke auf **Run**

**Erwartete Ausgabe:**
```
✅ Grammar RPC functions created successfully
   - get_due_grammar_cards: Fetch grammar cards due for review
   - update_grammar_card_progress: Update card progress per user (student_progress)

📝 Note: This fixes the design issue where FSRS data was stored in learning_items
   Now FSRS data is correctly stored per-user in student_progress table

🔧 Usage:
   SELECT * FROM get_due_grammar_cards('<user_id>'::uuid, 20);
   SELECT update_grammar_card_progress(...);
```

### Schritt 2: Frontend-Änderungen deployen

Die Frontend-Änderungen in `grammar-dialog-fsrs.tsx` sind bereits committed. Nach dem Deploy wird das Grammar-Modul:
- ✅ RPC `get_due_grammar_cards` aufrufen
- ✅ RPC `update_grammar_card_progress` aufrufen
- ✅ Bei Fehler auf Mock-Daten zurückfallen

### Schritt 3: Test-Daten laden (optional)

Falls noch nicht geschehen, lade Grammar-Test-Daten:

```sql
-- Execute this in Supabase SQL Editor
\i database/test-data/040_insert_test_grammar.sql
```

Das fügt 60+ Grammar-Rules (Verben, Artikel, Fälle, Pronomen, etc.) in die DB ein.

## 🧪 Testing

### Test 1: RPC-Funktion aufrufen

```sql
-- Replace <user_id> with actual user UUID
SELECT * FROM get_due_grammar_cards('<user_id>'::uuid, 5);
```

**Erwartetes Ergebnis:**
- Liste von 5 (oder weniger) Grammar-Cards
- Jede Card hat FSRS-Felder (difficulty, stability, due, state, etc.)
- Cards sind nach Due-Date sortiert (älteste zuerst)

### Test 2: Frontend testen

1. Öffne **Desktop Dashboard** (`/dashboard`)
2. Klicke auf **"8. Grammar Hits"** Button
3. **Erwartung:**
   - Loading-Spinner erscheint
   - Grammar-Cards laden (von DB oder Mock-Fallback)
   - Kein Fehler in Console

4. Übe eine Grammar-Card (Rate mit 1-4)
5. **Console-Logs prüfen:**
   ```
   📡 Calling RPC: get_due_grammar_cards for user <uuid>
   ✅ Loaded 5 grammar cards from DB
   ⭐ Rating: 3 (Good)
   📊 FSRS Update: ...
   ✅ Card updated in DB: [...]
   ```

### Test 3: Student Progress prüfen

Nach dem Review prüfe, ob FSRS-Daten in `student_progress` gespeichert wurden:

```sql
SELECT
    sp.student_id,
    li.english,
    sp.fsrs_difficulty,
    sp.fsrs_stability,
    sp.fsrs_due,
    sp.fsrs_state,
    sp.fsrs_reps,
    sp.fsrs_lapses
FROM student_progress sp
JOIN learning_items li ON li.id = sp.item_id
WHERE sp.student_id = '<user_id>'::uuid
  AND li.type = 'grammar'
ORDER BY sp.updated_at DESC
LIMIT 5;
```

**Erwartetes Ergebnis:**
- FSRS-Felder sind gefüllt (nicht NULL)
- `fsrs_due` ist in der Zukunft (z.B. in 7-14 Tagen)
- `fsrs_reps` ist mindestens 1
- `fsrs_state` ist 'learning' oder 'review'

## ⚠️ Bekannte Probleme & Workarounds

### Problem 1: RPC-Funktion existiert nicht

**Symptom:** Frontend zeigt "Using offline grammar data" Warning

**Lösung:**
1. Prüfe, ob Migration erfolgreich war:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
     AND routine_name = 'get_due_grammar_cards';
   ```
2. Falls leer: Migration nochmal ausführen

### Problem 2: Keine Grammar-Cards in DB

**Symptom:** `get_due_grammar_cards` gibt leere Liste zurück

**Lösung:**
1. Prüfe, ob Test-Daten existieren:
   ```sql
   SELECT COUNT(*) FROM learning_items WHERE type = 'grammar';
   ```
2. Falls 0: `040_insert_test_grammar.sql` ausführen

### Problem 3: Permission Denied

**Symptom:** RPC-Call schlägt mit "permission denied" fehl

**Lösung:**
```sql
-- Grant permissions (should be in migration, but just in case)
GRANT EXECUTE ON FUNCTION get_due_grammar_cards TO anon;
GRANT EXECUTE ON FUNCTION get_due_grammar_cards TO authenticated;
GRANT EXECUTE ON FUNCTION update_grammar_card_progress TO anon;
GRANT EXECUTE ON FUNCTION update_grammar_card_progress TO authenticated;
```

## 📊 Monitoring

Nach dem Deployment überwache:

1. **Console-Logs:**
   - `✅ Loaded X grammar cards from DB` → RPC funktioniert
   - `⚠️ Falling back to mock data` → RPC-Fehler (prüfen!)

2. **Error Rate:**
   - Weniger als 5% "Fallback to mock data" ist akzeptabel
   - Mehr als 20% → Backend-Problem untersuchen

3. **Performance:**
   - RPC-Call sollte < 500ms dauern
   - Bei > 1000ms: Indexes prüfen

## 🔄 Rollback

Falls Probleme auftreten, Rollback:

```sql
-- Remove RPC functions
DROP FUNCTION IF EXISTS get_due_grammar_cards(UUID, INT);
DROP FUNCTION IF EXISTS update_grammar_card_progress(UUID, UUID, INT, REAL, REAL, TIMESTAMPTZ, INT, INT, TEXT, REAL, REAL, REAL);
```

Frontend fällt automatisch auf Mock-Daten zurück.

## ✅ Success Criteria

Migration ist erfolgreich, wenn:

- [x] RPC-Funktionen existieren (SQL Query zeigt beide)
- [x] Frontend lädt Grammar-Cards von DB (Console: "Loaded X grammar cards from DB")
- [x] Reviews aktualisieren `student_progress` (SQL Query zeigt FSRS-Daten)
- [x] Keine Errors in Console (außer bei echten DB-Problemen)
- [x] Fallback auf Mock-Daten funktioniert bei DB-Fehler

## 📝 Nächste Schritte

Nach erfolgreicher Migration:

1. **Content erweitern:** Mehr Grammar-Rules in DB laden (aktuell 60+, Ziel: 200+)
2. **Admin-Interface:** UI zum Erstellen/Bearbeiten von Grammar-Rules
3. **Analytics:** Grammar-Fortschritt pro Kategorie tracken
4. **Mobile Testing:** Prüfe, ob mobile Version auch mit RPC funktioniert

## 📚 Referenzen

- **Migration File:** `database/migrations/064_create_grammar_rpc_functions.sql`
- **Frontend Changes:** `src/components/learning/grammar-dialog-fsrs.tsx`
- **Documentation:** `modules/grammar/grammar-database-schema.md`
- **Test Data:** `database/test-data/040_insert_test_grammar.sql`
