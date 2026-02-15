# Grammar Database Schema
**Letztes Update:** 15. Februar 2026

## Überblick

Grammar-Rules werden in der **`learning_items`** Tabelle mit `type='grammar'` gespeichert. FSRS-6 Tracking-Daten werden in **`student_progress`** gespeichert.

## Tabellen-Schema

### 1. `learning_items` (Content)

Speichert die eigentlichen Grammar-Rules (Content).

```sql
CREATE TABLE public.learning_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,                     -- 'grammar'
    english TEXT NOT NULL,                  -- Englische Beschreibung
    russian TEXT,                           -- Russische Beschreibung (optional)
    greek TEXT NOT NULL,                    -- Griechische Grammatikregel
    phonetic TEXT,                          -- IPA Transkription (optional)
    example_en TEXT,                        -- Englisches Beispiel
    example_gr TEXT,                        -- Griechisches Beispiel
    audio_url TEXT,                         -- Audio-File URL (optional)
    level TEXT,                             -- A1, A2, B1, B2, C1, C2
    difficulty TEXT,                        -- easy, medium, hard
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Type-Filterung
CREATE INDEX idx_learning_items_type ON learning_items(type);
CREATE INDEX idx_learning_items_type_level ON learning_items(type, level);
```

**Beispiel-Daten:**
```sql
INSERT INTO learning_items (type, english, greek, example_en, example_gr)
VALUES ('grammar', 'Present Tense - First Person', 'Εγώ κάνω', 'I do / I make', 'Εγώ κάνω την εργασία');
```

### 2. `student_progress` (FSRS Tracking)

Speichert FSRS-6 Scheduling-Daten pro User und Grammar-Rule.

```sql
CREATE TABLE public.student_progress (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id),
    item_id UUID NOT NULL REFERENCES learning_items(id),

    -- FSRS-6 Fields
    fsrs_difficulty REAL DEFAULT 6.4133,         -- 1.0 - 10.0 (Schwierigkeit)
    fsrs_stability REAL DEFAULT 0.212,           -- in days (Stabilität)
    fsrs_last_review TIMESTAMPTZ,                -- letzter Review
    fsrs_due TIMESTAMPTZ DEFAULT NOW(),          -- nächster Review
    fsrs_reps INT DEFAULT 0,                     -- Anzahl Reviews
    fsrs_lapses INT DEFAULT 0,                   -- Anzahl Fehlversuche (Rating 1)
    fsrs_state TEXT DEFAULT 'new',               -- 'new', 'learning', 'review', 'relearning'
    fsrs_elapsed_days INT DEFAULT 0,             -- Tage seit letztem Review
    fsrs_scheduled_days INT DEFAULT 0,           -- geplantes Intervall in Tagen

    -- Legacy SM-2 Fields (backward compatibility)
    interval_days REAL,
    ease_factor REAL,
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    next_review TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, item_id)
);

-- CHECK Constraints
ALTER TABLE student_progress
    ADD CONSTRAINT student_progress_fsrs_state_check
    CHECK (fsrs_state IN ('new', 'learning', 'review', 'relearning'));

ALTER TABLE student_progress
    ADD CONSTRAINT student_progress_fsrs_difficulty_check
    CHECK (fsrs_difficulty >= 1.0 AND fsrs_difficulty <= 10.0);

ALTER TABLE student_progress
    ADD CONSTRAINT student_progress_fsrs_stability_check
    CHECK (fsrs_stability >= 0.1);

-- Performance Indexes
CREATE INDEX idx_student_progress_fsrs_due
    ON student_progress (fsrs_due)
    WHERE fsrs_due IS NOT NULL;

CREATE INDEX idx_student_progress_fsrs_state
    ON student_progress (fsrs_state);

CREATE INDEX idx_student_progress_fsrs_due_state_student
    ON student_progress (student_id, fsrs_due, fsrs_state)
    WHERE fsrs_due IS NOT NULL;

CREATE INDEX idx_student_progress_student_item
    ON student_progress (student_id, item_id);
```

### 3. `fsrs_review_logs` (Review History)

Speichert Review-History für Analytics und Debugging.

```sql
CREATE TABLE public.fsrs_review_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    card_id UUID NOT NULL REFERENCES learning_items(id),
    rating INT NOT NULL,                    -- 1, 2, 3, 4
    review_time TIMESTAMPTZ DEFAULT NOW(),
    interval_days REAL NOT NULL,            -- geplantes Intervall nach Review
    old_difficulty REAL,                    -- Difficulty vor Review
    old_stability REAL,                     -- Stability vor Review
    new_difficulty REAL,                    -- Difficulty nach Review
    new_stability REAL,                     -- Stability nach Review
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes für Analytics
CREATE INDEX idx_fsrs_review_logs_user_time
    ON fsrs_review_logs (user_id, review_time DESC);

CREATE INDEX idx_fsrs_review_logs_card
    ON fsrs_review_logs (card_id, review_time DESC);
```

## RPC-Funktionen

### 1. `get_due_grammar_cards`

**Status:** ❌ **NICHT IMPLEMENTIERT** (siehe TODO)

**Ziel:** Lade fällige Grammar-Cards für einen User.

```sql
CREATE OR REPLACE FUNCTION get_due_grammar_cards(
  p_user_id UUID,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  english TEXT,
  russian TEXT,
  greek TEXT,
  phonetic TEXT,
  example_en TEXT,
  example_gr TEXT,
  audio_url TEXT,
  level TEXT,
  difficulty TEXT,
  fsrs_difficulty REAL,
  fsrs_stability REAL,
  fsrs_last_review TIMESTAMPTZ,
  fsrs_due TIMESTAMPTZ,
  fsrs_reps INT,
  fsrs_lapses INT,
  fsrs_state TEXT,
  created_at TIMESTAMPTZ
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    li.id,
    li.type,
    li.english,
    li.russian,
    li.greek,
    li.phonetic,
    li.example_en,
    li.example_gr,
    li.audio_url,
    li.level,
    li.difficulty,
    sp.fsrs_difficulty,
    sp.fsrs_stability,
    sp.fsrs_last_review,
    sp.fsrs_due,
    sp.fsrs_reps,
    sp.fsrs_lapses,
    sp.fsrs_state,
    li.created_at
  FROM learning_items li
  LEFT JOIN student_progress sp ON sp.item_id = li.id AND sp.student_id = p_user_id
  WHERE li.type = 'grammar'
    AND (sp.fsrs_due IS NULL OR sp.fsrs_due <= NOW())
    AND (li.level IS NULL OR li.level = (SELECT level FROM users WHERE id = p_user_id))
  ORDER BY
    sp.fsrs_due ASC NULLS FIRST,  -- Neue Cards zuerst
    sp.fsrs_difficulty DESC,       -- Schwierigere Cards zuerst
    li.created_at ASC              -- Ältere Cards zuerst
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Nutzung:**
```typescript
const { data, error } = await supabase.rpc('get_due_grammar_cards', {
  p_user_id: user.id,
  p_limit: 20
});
```

### 2. `update_card_fsrs`

**Status:** ✅ **IMPLEMENTIERT** (Migration 054)

**Zweck:** Aktualisiert FSRS-Parameter nach User-Rating.

```sql
CREATE OR REPLACE FUNCTION update_card_fsrs(
    p_card_id UUID,
    p_user_id UUID,
    p_rating INT,
    p_new_difficulty REAL,
    p_new_stability REAL,
    p_new_due TIMESTAMPTZ,
    p_new_reps INT,
    p_new_lapses INT,
    p_new_state TEXT,
    p_interval_days REAL,
    p_old_difficulty REAL,
    p_old_stability REAL
)
RETURNS JSON
```

**WICHTIG:** Diese Funktion aktualisiert `learning_items.fsrs_*` Felder direkt, **nicht** `student_progress`!

**Problem:** Das widerspricht dem Best-Practice, FSRS-Daten pro User zu speichern. Wenn mehrere User dieselbe Grammar-Rule üben, überschreiben sie gegenseitig ihre FSRS-Daten.

**Lösung (TODO):**
- Entweder: `update_card_fsrs` umschreiben, um `student_progress` zu aktualisieren
- Oder: FSRS-Felder aus `learning_items` entfernen und nur in `student_progress` speichern

**Nutzung:**
```typescript
const { data, error } = await supabase.rpc('update_card_fsrs', {
  p_card_id: item.id,
  p_user_id: user.id,
  p_rating: 3, // 1-4
  p_new_difficulty: 5.8,
  p_new_stability: 12.5,
  p_new_due: new Date('2026-02-28').toISOString(),
  p_new_reps: 1,
  p_new_lapses: 0,
  p_new_state: 'review',
  p_interval_days: 13,
  p_old_difficulty: 6.4,
  p_old_stability: 10.0,
});
```

### 3. `get_fsrs_stats`

**Status:** ✅ **IMPLEMENTIERT** (Migration 054)

**Zweck:** Lade FSRS-Statistiken für einen User (Retention Rate, Avg Interval, etc.).

```sql
CREATE OR REPLACE FUNCTION get_fsrs_stats(
    p_user_id UUID,
    p_days INT DEFAULT 30
)
RETURNS JSON
```

**Nutzung:**
```typescript
const { data, error } = await supabase.rpc('get_fsrs_stats', {
  p_user_id: user.id,
  p_days: 30
});

// Returns: { total_reviews, correct_reviews, retention_rate, avg_interval_days, period_days }
```

## Daten-Flow

### Neue Grammar-Rule erstellen
```sql
INSERT INTO learning_items (type, english, greek, example_en, example_gr, level, difficulty)
VALUES ('grammar', 'Verb "to be" - I am', 'Εγώ είμαι', 'I am', 'Εγώ είμαι εδώ', 'A1', 'easy');
```

### User übt Grammar-Rule (FSRS Update)

1. **Frontend:** User bewertet Card (Rating 1-4)
2. **Frontend:** FSRS-Scheduler berechnet neue Parameter
3. **Frontend → Backend:** RPC-Call `update_card_fsrs(...)`
4. **Backend:** Update `student_progress` (oder `learning_items`, aktuell fehlerhaft!)
5. **Backend:** Insert in `fsrs_review_logs`

### Fällige Cards laden

1. **Frontend → Backend:** RPC-Call `get_due_grammar_cards(user_id, 20)`
2. **Backend:** JOIN `learning_items` + `student_progress`
3. **Backend:** Filter: `fsrs_due <= NOW()` oder `fsrs_due IS NULL` (neue Cards)
4. **Backend:** Sort: Due-Date ASC, Difficulty DESC
5. **Backend → Frontend:** Return fällige Cards

## Migrations-Historie

| Migration | Datum | Beschreibung |
|-----------|-------|-------------|
| `052_add_fsrs_fields.sql` | 2026-02-14 | FSRS-Felder zu `learning_items` hinzufügen (⚠️ veraltet?) |
| `053_create_fsrs_review_logs.sql` | 2026-02-14 | Review-Log Tabelle erstellen |
| `054_create_fsrs_rpc_functions.sql` | 2026-02-15 | RPC-Funktionen (get_due_cards_fsrs, update_card_fsrs, get_fsrs_stats) |
| `056_add_fsrs_to_student_progress.sql` | 2026-02-15 | FSRS-Felder zu `student_progress` hinzufügen (✅ aktuell) |

## Wichtige Erkenntnisse

### ✅ Was funktioniert

- FSRS-6 Felder in `student_progress` existieren
- RPC-Funktionen existieren (update_card_fsrs, get_fsrs_stats)
- Review-Logging funktioniert
- Indexes für Performance vorhanden

### ⚠️ Bekannte Probleme

1. **FSRS-Felder in zwei Tabellen?**
   - Migration 052: FSRS-Felder in `learning_items`
   - Migration 056: FSRS-Felder in `student_progress`
   - **Problem:** Unclear which is source of truth!
   - **Lösung:** FSRS-Daten sollten NUR in `student_progress` sein (pro User)

2. **`update_card_fsrs` aktualisiert falsche Tabelle**
   - Aktuell: Aktualisiert `learning_items.fsrs_*` (Zeile 114-124 in Migration 054)
   - Sollte: Aktualisiert `student_progress.fsrs_*` (per UPSERT mit UNIQUE constraint)

3. **`get_due_cards_fsrs` filtert nur vocab/phrases**
   - Aktuell: `WHERE li.type IN ('vocabulary', 'daily-phrases')` (Zeile 59)
   - Problem: Grammar wird NICHT geladen!
   - **Lösung:** Eigene Funktion `get_due_grammar_cards` erstellen (siehe oben)

## Nächste Schritte

- [ ] Verifiziere: Existieren FSRS-Felder in `learning_items`? (Migration 052 prüfen)
- [ ] Erstelle `get_due_grammar_cards` RPC-Funktion
- [ ] Fixe `update_card_fsrs`, um `student_progress` zu aktualisieren (UPSERT)
- [ ] Teste FSRS-Flow Ende-zu-Ende
- [ ] Dokumentiere finales Schema in diesem Dokument

## Referenzen

- **Migrations:** `database/migrations/052-056_*.sql`
- **Test-Daten:** `database/test-data/040_insert_test_grammar.sql`
- **Frontend:** `src/components/learning/grammar-dialog-fsrs.tsx`
