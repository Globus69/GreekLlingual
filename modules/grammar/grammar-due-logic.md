# Grammar Due-Cards Logic
**Letztes Update:** 15. Februar 2026

## Überblick

Diese Dokumentation beschreibt, wie das Grammar-Modul bestimmt, welche Grammar-Rules **heute fällig** (due) sind und in welcher Reihenfolge sie dem User präsentiert werden.

## Due-Definition

Eine Grammar-Rule ist **due** (fällig), wenn:
```
current_timestamp >= fsrs_due
```

**Beispiel:**
- Heute: `2026-02-15 14:30:00`
- Card Due: `2026-02-15 10:00:00`
- → Card ist **fällig** ✅

- Card Due: `2026-02-16 10:00:00`
- → Card ist **noch nicht fällig** ❌

## Abfrage-Logik

### RPC-Funktion (Ziel)
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
  fsrs_difficulty FLOAT,
  fsrs_stability FLOAT,
  fsrs_last_review TIMESTAMP,
  fsrs_due TIMESTAMP,
  fsrs_reps INT,
  fsrs_lapses INT,
  fsrs_state TEXT,
  created_at TIMESTAMP
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
    sp.fsrs_due ASC NULLS FIRST,  -- Neue Cards zuerst, dann älteste fällige
    sp.fsrs_difficulty DESC,       -- Schwierigere Cards zuerst
    li.created_at ASC              -- Bei Gleichstand: ältere Cards zuerst
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

### Sortier-Reihenfolge

1. **Neue Cards (fsrs_due IS NULL)**
   - Cards, die noch nie geübt wurden
   - Werden zuerst angezeigt (NULLS FIRST)

2. **Fällige Cards (fsrs_due <= NOW())**
   - Sortiert nach `fsrs_due` ASC (älteste zuerst)
   - Bei gleichem Due-Date: höhere Difficulty zuerst

3. **Alte Cards vor neuen Cards**
   - `created_at ASC` als finales Kriterium

### Beispiel-Reihenfolge:
```
1. Card A: due=NULL, difficulty=5.0, created=2026-01-01  → NEU
2. Card B: due=NULL, difficulty=7.0, created=2026-01-10  → NEU (jüngere Card)
3. Card C: due=2026-02-10, difficulty=8.0                → ÜBERFÄLLIG (5 Tage)
4. Card D: due=2026-02-14, difficulty=6.0                → ÜBERFÄLLIG (1 Tag)
5. Card E: due=2026-02-15, difficulty=5.0                → FÄLLIG HEUTE
```

## Filter-Optionen

### Level-Filter
Nur Grammar-Rules laden, die dem User-Level entsprechen:
```sql
WHERE li.level = (SELECT level FROM users WHERE id = p_user_id)
  OR li.level IS NULL  -- Universelle Cards ohne Level
```

**User-Levels:**
- `A1` – Anfänger
- `A2` – Elementar
- `B1` – Mittelstufe
- `B2` – Fortgeschritten
- `C1` – Kompetent
- `C2` – Fließend

### Difficulty-Filter
Nur Grammar-Rules laden, die der User-Difficulty entsprechen:
```sql
WHERE li.difficulty = (SELECT difficulty FROM users WHERE id = p_user_id)
  OR li.difficulty IS NULL
```

**User-Difficulties:**
- `easy` – Einfach
- `medium` – Mittel
- `hard` – Schwer

### State-Filter
Nur Cards in bestimmten States laden:
```sql
WHERE sp.fsrs_state IN ('new', 'learning', 'review')
  -- Exclude 'relearning' if needed
```

## Limit & Pagination

### Max Cards per Session
```typescript
const MAX_CARDS_PER_SESSION = 20; // ai-guidelines.md
```

**Warum 20?**
- Verhindert Überforderung
- Typische Session-Dauer: 10-15 Minuten (30-45 Sekunden pro Card)
- Bessere Retention als längere Sessions

### Lazy Loading (zukünftig)
```typescript
// Load in batches of 10
const BATCH_SIZE = 10;

async function loadNextBatch() {
  const { data } = await supabase.rpc('get_due_grammar_cards', {
    p_user_id: userId,
    p_limit: BATCH_SIZE,
    p_offset: currentOffset
  });
  currentOffset += BATCH_SIZE;
  return data;
}
```

## Spezialfälle

### 1. Keine fälligen Cards
**Fall:** User hat alle Cards bereits geübt, keine sind fällig.

**Lösung:**
- Zeige "All caught up! 🎉" Nachricht
- Biete "Review All Cards" Option an (ohne Due-Filter)
- Zeige Next-Due-Date an: "Next review in 2 days"

### 2. Nur neue Cards
**Fall:** User hat noch keine Cards geübt, alle sind neu.

**Lösung:**
- Zeige neue Cards (fsrs_due IS NULL)
- Begrenze auf MAX_NEW_CARDS_PER_DAY (20)
- Sortiere nach Difficulty ASC (einfache zuerst)

### 3. Mix aus neuen und fälligen Cards
**Fall:** User hat einige Cards bereits geübt, einige sind neu.

**Lösung:**
- Zeige fällige Cards zuerst (Retention wichtiger als neue Cards)
- Dann neue Cards bis MAX_CARDS_PER_SESSION erreicht ist

### 4. Überfällige Cards (Overdue)
**Fall:** User hat Days ohne Review, viele Cards sind überfällig.

**Lösung:**
- Zeige überfällige Cards zuerst (älteste Due-Date zuerst)
- Zeige "X cards overdue" Warnung
- Empfehle kürzere Sessions (10 statt 20 Cards)

## Frontend-Integration

### Aktueller Stand (Mock-Daten)
```typescript
// grammar-dialog-fsrs.tsx, Zeile 244-350
const mockGrammarRules: FSRSLearningItem[] = [
  { id: 'grammar-1', ... },
  { id: 'grammar-2', ... },
  // ...
];
```

### Ziel (RPC-Integration)
```typescript
const loadDueCards = async () => {
  setLoading(true);

  try {
    const { data, error } = await supabase.rpc('get_due_grammar_cards', {
      p_user_id: user.id,
      p_limit: 20
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      setLoadError('No cards due today');
      setVocabulary([]);
      return;
    }

    console.log(`✅ Loaded ${data.length} due grammar cards`);
    setVocabulary(data);
  } catch (err) {
    console.error('❌ Load error:', err);
    // Fallback to mock data
    setVocabulary(mockGrammarRules);
  } finally {
    setLoading(false);
  }
};
```

## Performance-Optimierung

### Indexe (Database)
```sql
-- Index für schnelle Due-Abfragen
CREATE INDEX idx_student_progress_due
ON student_progress(student_id, fsrs_due);

-- Index für Type-Filter
CREATE INDEX idx_learning_items_type
ON learning_items(type);

-- Composite Index für Level + Type
CREATE INDEX idx_learning_items_type_level
ON learning_items(type, level);
```

### Caching (Frontend)
```typescript
// Cache due cards for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 min

let cachedDueCards: FSRSLearningItem[] | null = null;
let cacheTimestamp: number | null = null;

const loadDueCardsWithCache = async () => {
  const now = Date.now();

  if (cachedDueCards && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
    console.log('📦 Using cached due cards');
    return cachedDueCards;
  }

  const cards = await loadDueCards();
  cachedDueCards = cards;
  cacheTimestamp = now;

  return cards;
};
```

## Abgrenzung zu Daily Phrases

**Grammar:**
- Lädt ALLE fälligen Grammar-Rules
- Keine "3 pro Tag" Begrenzung
- Sortierung nach Due-Date + Difficulty
- Kein "Morgen/Mittag/Abend" Konzept

**Daily Phrases:**
- Lädt genau 3 Phrasen pro Tag
- Strikte "1 Phrase alle 4 Stunden" Regel
- Sortierung nach Tageszeit
- Deduplizierung (keine Phrase zweimal in 30 Tagen)

**Wichtig:** Keine Vermischung der Logiken!

## Änderungshistorie

- **2026-02-15:** Initiale Dokumentation erstellt
