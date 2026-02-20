# VOCAB-THREE-MODULES-PLAN.md

**Erstellt:** 2026-02-19
**Zweck:** Technischer Plan für drei Vokabel-Module (Due Cards, Review Vocab, Weak Words)
**Basis:** VOCAB-DIALOG-AND-DB-OVERVIEW.md (bestehende FSRS-6 Implementierung)
**Strategie:** Mobile-First, Touch-optimiert, separate Routes

---

## 📋 Überblick

Das Vokabel-System besteht aus **drei zusammenhängenden Modulen**, die dieselbe UI/Logik verwenden, aber **unterschiedliche Karten-Sets** laden:

| Modul | Route | Filter-Kriterium | Zweck |
|-------|-------|------------------|-------|
| **Due Cards** | `/m/vocabulary` | `fsrs_due <= NOW()` | Hauptmodul: Alle fälligen Karten |
| **Review Vocab** | `/m/vocabulary/review` | Letzte Bewertung war 1 (Again) oder 2 (Hard) | Wiederholung schwieriger Karten |
| **Weak Words** | `/m/vocabulary/weak` | `fsrs_lapses >= 2` | Fokus auf hartnäckige Problemwörter |

### Gemeinsame Eigenschaften

✅ **Identische UI:** Flip-Card, TTS-Controls, 4 Rating-Buttons (Again/Hard/Good/Easy)
✅ **Identische Logik:** FSRS-6 Scheduler, Session-Stats, Cache, Offline-Support
✅ **Gemeinsame Datenbank:** `multilingual_vocabulary` + `user_vocabulary_progress`
✅ **Alle Bewertungen wirken auf FSRS:** Egal in welchem Modul bewertet wird, die FSRS-Parameter werden global aktualisiert

### Unterschiede

❌ **Verschiedene Karten-Sets:** Jedes Modul lädt andere Vokabeln
❌ **Verschiedene RPCs:** Separate Fetch-Funktionen mit unterschiedlichen Filtern
❌ **Verschiedene Routes:** Eigene URLs für Navigation und Deep-Linking

---

## 🎯 Modul 1: Due Cards (Hauptmodul)

**Status:** ✅ **BEREITS IMPLEMENTIERT**
**Route:** `/m/vocabulary`
**Datei:** `src/app/m/vocabulary/page.tsx`

### Funktionalität (Ist-Zustand)

- **Filter:** Alle Vokabeln mit `fsrs_due IS NULL OR fsrs_due <= NOW()`
- **Sortierung:**
  1. `fsrs_due ASC NULLS FIRST` (neue Karten zuerst)
  2. `created_at DESC` (neueste zuerst als Fallback)
- **Limit:** 20 Karten pro Session (Mobile-optimiert)
- **RPC:** `get_due_vocabulary_cards(p_user_id, p_limit)`

### Keine Änderungen erforderlich

Dieses Modul bleibt **unverändert** und dient als **Referenz-Implementierung** für die anderen Module.

---

## 🔄 Modul 2: Review Vocab (Neu)

**Status:** 🆕 **NEU ZU IMPLEMENTIEREN**
**Route:** `/m/vocabulary/review`
**Zweck:** Wiederholung von Karten, die zuletzt mit "Again" (1) oder "Hard" (2) bewertet wurden

### Funktionalität

#### Filter-Kriterium
**Letzte Bewertung aus `fsrs_review_logs` war 1 oder 2**

```sql
-- Subquery für letzte Bewertung pro Karte
WITH latest_reviews AS (
    SELECT DISTINCT ON (card_id)
        card_id,
        rating,
        review_time
    FROM fsrs_review_logs
    WHERE user_id = p_user_id
    ORDER BY card_id, review_time DESC
)
SELECT v.*, uvp.*, lr.rating AS last_rating
FROM multilingual_vocabulary v
JOIN user_vocabulary_progress uvp ON uvp.vocabulary_id = v.id AND uvp.user_id = p_user_id
JOIN latest_reviews lr ON lr.card_id = v.id
WHERE lr.rating IN (1, 2) -- Again oder Hard
ORDER BY lr.review_time DESC -- Neueste zuerst
LIMIT p_limit;
```

#### UI-Unterschiede zum Hauptmodul

**Header:**
- Titel: "🔄 Review Vocab" (statt "📚 Vocabulary")
- Subtitle: "Practice Again + Hard cards"

**Empty State:**
- Emoji: 🎉 (statt ⏳)
- Text: "No cards to review! All cards are Good or Easy."
- Button: "Back to Due Cards" → `/m/vocabulary`

**Sonst:** Identisch (Flip-Card, TTS, Rating-Buttons, Session-Summary)

### Technische Integration

#### Neue RPC-Funktion

**Name:** `get_review_vocabulary_cards(p_user_id UUID, p_limit INT)`

**Parameter:**
| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| `p_user_id` | UUID | - | User-ID (required) |
| `p_limit` | INT | 20 | Max. Anzahl Karten |

**Return:** TABLE (19 Spalten, identisch zu `get_due_vocabulary_cards`)

**SQL-Logik:**
```sql
CREATE OR REPLACE FUNCTION get_review_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    english TEXT,
    russian TEXT,
    greek TEXT,
    greek_word TEXT,
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH latest_reviews AS (
        SELECT DISTINCT ON (card_id)
            card_id,
            rating,
            review_time
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
        ORDER BY card_id, review_time DESC
    )
    SELECT
        v.id,
        'vocabulary'::TEXT as type,
        v.en_translation AS english,
        v.ru_translation AS russian,
        v.greek_transcription AS greek,
        v.greek_transcription AS greek_word,
        v.greek_phonetic AS phonetic,
        NULL::TEXT as example_en,
        NULL::TEXT as example_gr,
        COALESCE(v.en_audio_url) AS audio_url,
        v.level,
        v.difficulty,
        uvp.fsrs_difficulty::REAL,
        uvp.fsrs_stability::REAL,
        uvp.fsrs_last_review,
        uvp.fsrs_due,
        uvp.fsrs_reps,
        uvp.fsrs_lapses,
        uvp.fsrs_state,
        v.created_at
    FROM multilingual_vocabulary v
    JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    JOIN latest_reviews lr
        ON lr.card_id = v.id
    WHERE lr.rating IN (1, 2) -- Again oder Hard
    ORDER BY lr.review_time DESC -- Neueste schwierige Karten zuerst
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_review_vocabulary_cards TO anon, authenticated;
COMMENT ON FUNCTION get_review_vocabulary_cards IS 'Returns vocabulary cards with last rating = Again (1) or Hard (2)';
```

#### Neue Route

**Datei:** `src/app/m/vocabulary/review/page.tsx`

**Code-Struktur:** Copy von `src/app/m/vocabulary/page.tsx` mit folgenden Änderungen:

```tsx
// Zeile 73: Änderung der RPC
const { data, error: rpcError } = await supabase.rpc('get_review_vocabulary_cards', {
    p_user_id: STUDENT_ID,
    p_limit: 20
});

// Zeile 96: Änderung des Cache-Keys
const {
    data: cards,
    loading,
    cached,
    refresh,
} = useMobileCache<VocabularyItem[]>({
    storeName: 'vocabulary_cards',
    key: `vocabulary-review-${STUDENT_ID}`, // ← GEÄNDERT
    fetcher: fetchReviewCards, // ← GEÄNDERT
    ttl: CACHE_TTL.VOCABULARY_CARDS,
    enabled: !!STUDENT_ID,
});

// Zeile 339: Änderung des Titels
<h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>
    🔄 Review Vocab
</h1>

// Zeile 397: Änderung des Empty State
<div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
<h3 style={{ fontSize: '24px', marginBottom: '24px' }}>No cards to review!</h3>
<p style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '24px' }}>
    All cards are Good or Easy. Keep practicing!
</p>
<button
    onClick={() => router.push('/m/vocabulary')}
    style={{
        padding: '14px 28px',
        borderRadius: '12px',
        border: 'none',
        background: 'rgba(0, 122, 255, 0.3)',
        color: '#007AFF',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
    }}
>
    Back to Due Cards
</button>
```

#### Migration File

**Datei:** `supabase/migrations/XXX_vocabulary_review_rpc.sql`

```sql
-- Migration: Create RPC for Review Vocab Module
-- Date: 2026-02-19
-- Purpose: Fetch vocabulary cards with last rating = Again (1) or Hard (2)

DO $$
BEGIN
    RAISE NOTICE '🚀 Creating get_review_vocabulary_cards RPC...';
END $$;

-- [SQL von oben hier einfügen]

DO $$
BEGIN
    RAISE NOTICE '✅ get_review_vocabulary_cards created successfully';
END $$;
```

---

## ⚠️ Modul 3: Weak Words (Neu)

**Status:** 🆕 **NEU ZU IMPLEMENTIEREN**
**Route:** `/m/vocabulary/weak`
**Zweck:** Fokus auf hartnäckige Problemwörter (mindestens 2x "Again")

### Funktionalität

#### Filter-Kriterium
**`fsrs_lapses >= 2`** (mindestens zweimal mit "Again" bewertet)

```sql
SELECT v.*, uvp.*
FROM multilingual_vocabulary v
JOIN user_vocabulary_progress uvp
    ON uvp.vocabulary_id = v.id
    AND uvp.user_id = p_user_id
WHERE uvp.fsrs_lapses >= 2
ORDER BY uvp.fsrs_lapses DESC, uvp.fsrs_last_review DESC
LIMIT p_limit;
```

#### UI-Unterschiede zum Hauptmodul

**Header:**
- Titel: "⚠️ Weak Words" (statt "📚 Vocabulary")
- Subtitle: "Focus on difficult words (≥2 lapses)"

**Empty State:**
- Emoji: 💪 (statt ⏳)
- Text: "No weak words! You're doing great!"
- Button: "Back to Due Cards" → `/m/vocabulary`

**Sonst:** Identisch (Flip-Card, TTS, Rating-Buttons, Session-Summary)

### Technische Integration

#### Neue RPC-Funktion

**Name:** `get_weak_vocabulary_cards(p_user_id UUID, p_limit INT)`

**Parameter:**
| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| `p_user_id` | UUID | - | User-ID (required) |
| `p_limit` | INT | 20 | Max. Anzahl Karten |

**Return:** TABLE (19 Spalten, identisch zu `get_due_vocabulary_cards`)

**SQL-Logik:**
```sql
CREATE OR REPLACE FUNCTION get_weak_vocabulary_cards(
    p_user_id UUID,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    english TEXT,
    russian TEXT,
    greek TEXT,
    greek_word TEXT,
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        'vocabulary'::TEXT as type,
        v.en_translation AS english,
        v.ru_translation AS russian,
        v.greek_transcription AS greek,
        v.greek_transcription AS greek_word,
        v.greek_phonetic AS phonetic,
        NULL::TEXT as example_en,
        NULL::TEXT as example_gr,
        COALESCE(v.en_audio_url) AS audio_url,
        v.level,
        v.difficulty,
        uvp.fsrs_difficulty::REAL,
        uvp.fsrs_stability::REAL,
        uvp.fsrs_last_review,
        uvp.fsrs_due,
        uvp.fsrs_reps,
        uvp.fsrs_lapses,
        uvp.fsrs_state,
        v.created_at
    FROM multilingual_vocabulary v
    JOIN user_vocabulary_progress uvp
        ON uvp.vocabulary_id = v.id
        AND uvp.user_id = p_user_id
    WHERE uvp.fsrs_lapses >= 2 -- Mindestens 2x "Again"
    ORDER BY
        uvp.fsrs_lapses DESC, -- Schwierigste zuerst
        uvp.fsrs_last_review DESC -- Neueste zuerst
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards TO anon, authenticated;
COMMENT ON FUNCTION get_weak_vocabulary_cards IS 'Returns vocabulary cards with fsrs_lapses >= 2 (weak words)';
```

#### Neue Route

**Datei:** `src/app/m/vocabulary/weak/page.tsx`

**Code-Struktur:** Copy von `src/app/m/vocabulary/page.tsx` mit folgenden Änderungen:

```tsx
// Zeile 73: Änderung der RPC
const { data, error: rpcError } = await supabase.rpc('get_weak_vocabulary_cards', {
    p_user_id: STUDENT_ID,
    p_limit: 20
});

// Zeile 96: Änderung des Cache-Keys
const {
    data: cards,
    loading,
    cached,
    refresh,
} = useMobileCache<VocabularyItem[]>({
    storeName: 'vocabulary_cards',
    key: `vocabulary-weak-${STUDENT_ID}`, // ← GEÄNDERT
    fetcher: fetchWeakCards, // ← GEÄNDERT
    ttl: CACHE_TTL.VOCABULARY_CARDS,
    enabled: !!STUDENT_ID,
});

// Zeile 339: Änderung des Titels
<h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>
    ⚠️ Weak Words
</h1>

// Zeile 397: Änderung des Empty State
<div style={{ fontSize: '64px', marginBottom: '16px' }}>💪</div>
<h3 style={{ fontSize: '24px', marginBottom: '24px' }}>No weak words!</h3>
<p style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '24px' }}>
    You're doing great! All words are mastered.
</p>
<button
    onClick={() => router.push('/m/vocabulary')}
    style={{
        padding: '14px 28px',
        borderRadius: '12px',
        border: 'none',
        background: 'rgba(0, 122, 255, 0.3)',
        color: '#007AFF',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
    }}
>
    Back to Due Cards
</button>
```

#### Migration File

**Datei:** `supabase/migrations/XXX_vocabulary_weak_rpc.sql`

```sql
-- Migration: Create RPC for Weak Words Module
-- Date: 2026-02-19
-- Purpose: Fetch vocabulary cards with fsrs_lapses >= 2

DO $$
BEGIN
    RAISE NOTICE '🚀 Creating get_weak_vocabulary_cards RPC...';
END $$;

-- [SQL von oben hier einfügen]

DO $$
BEGIN
    RAISE NOTICE '✅ get_weak_vocabulary_cards created successfully';
END $$;
```

---

## 🔗 Gemeinsame Logik-Schicht

### FSRS-Update (bleibt unverändert)

**Alle drei Module** verwenden dieselbe `update_vocabulary_progress` RPC:

```tsx
// Keine Änderungen nötig - funktioniert für alle Module
const { error: rpcError } = await supabase.rpc('update_vocabulary_progress', {
    p_card_id: currentItem.id,
    p_user_id: STUDENT_ID,
    p_rating: rating,
    p_new_difficulty: updatedCard.difficulty,
    p_new_stability: updatedCard.stability,
    p_new_due: updatedCard.due.toISOString(),
    p_new_reps: updatedCard.reps,
    p_new_lapses: updatedCard.lapses,
    p_new_state: updatedCard.state,
    p_interval_days: interval,
    p_old_difficulty: currentCard.difficulty,
    p_old_stability: currentCard.stability
});
```

**Effekt:** Egal in welchem Modul bewertet wird:
- ✅ `user_vocabulary_progress` wird aktualisiert (global)
- ✅ `fsrs_review_logs` erhält neuen Eintrag
- ✅ Card wird aus aktuellem Modul entfernt (visuell)
- ✅ Card erscheint ggf. in anderem Modul (nach Cache-Refresh)

**Beispiel:**
1. User übt "Weak Words" (fsrs_lapses=3)
2. Bewertet Karte mit "Good" (Rating 3)
3. `fsrs_lapses` bleibt 3, aber `fsrs_state` → 'review', `fsrs_due` → +X Tage
4. Karte verschwindet aus "Weak Words" (fsrs_due in Zukunft)
5. Karte erscheint später wieder in "Due Cards" (wenn fsrs_due erreicht)

---

## 🧭 Navigation & User Flow

### Dashboard Integration

**Datei:** `src/app/m/page.tsx` (Mobile Dashboard)

**Neue Karten hinzufügen:**

```tsx
// Nach der "📚 Vocabulary" Karte

{/* Review Vocab Card */}
<div
    onClick={() => router.push('/m/vocabulary/review')}
    style={{
        background: 'rgba(255, 169, 77, 0.1)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid rgba(255, 169, 77, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }}
>
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔄</div>
    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
        Review Vocab
    </h3>
    <p style={{ fontSize: '13px', color: '#8E8E93' }}>
        Practice Again + Hard cards
    </p>
    <div style={{ fontSize: '14px', color: '#FFA94D', marginTop: '12px', fontWeight: 600 }}>
        {reviewCount > 0 ? `${reviewCount} cards` : 'No cards'}
    </div>
</div>

{/* Weak Words Card */}
<div
    onClick={() => router.push('/m/vocabulary/weak')}
    style={{
        background: 'rgba(255, 59, 48, 0.1)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid rgba(255, 59, 48, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }}
>
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
        Weak Words
    </h3>
    <p style={{ fontSize: '13px', color: '#8E8E93' }}>
        Focus on difficult words (≥2 lapses)
    </p>
    <div style={{ fontSize: '14px', color: '#FF3B30', marginTop: '12px', fontWeight: 600 }}>
        {weakCount > 0 ? `${weakCount} cards` : 'No weak words!'}
    </div>
</div>
```

### Counts laden (Dashboard)

**Neue RPCs für Statistik:**

```sql
-- Count für Review Vocab
CREATE OR REPLACE FUNCTION get_review_vocabulary_count(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
BEGIN
    WITH latest_reviews AS (
        SELECT DISTINCT ON (card_id) card_id, rating
        FROM fsrs_review_logs
        WHERE user_id = p_user_id
        ORDER BY card_id, review_time DESC
    )
    SELECT COUNT(*) INTO v_count
    FROM latest_reviews
    WHERE rating IN (1, 2);

    RETURN v_count;
END;
$$;

-- Count für Weak Words
CREATE OR REPLACE FUNCTION get_weak_vocabulary_count(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM user_vocabulary_progress
    WHERE user_id = p_user_id
        AND fsrs_lapses >= 2;

    RETURN v_count;
END;
$$;
```

**Dashboard Code:**

```tsx
const [reviewCount, setReviewCount] = useState(0);
const [weakCount, setWeakCount] = useState(0);

useEffect(() => {
    if (!STUDENT_ID) return;

    // Load counts
    supabase.rpc('get_review_vocabulary_count', { p_user_id: STUDENT_ID })
        .then(({ data }) => setReviewCount(data || 0));

    supabase.rpc('get_weak_vocabulary_count', { p_user_id: STUDENT_ID })
        .then(({ data }) => setWeakCount(data || 0));
}, [STUDENT_ID]);
```

---

## 📱 Mobile-First Considerations

### Touch-Optimierung

**Alle drei Module:**
- ✅ 44px Mindest-Tap-Targets (bereits implementiert: Rating-Buttons 70px)
- ✅ Touch-Feedback (scale 0.95 bei onTouchStart)
- ✅ Swipe-Gesten (optional: links/rechts für Navigation zwischen Modulen)

### Gestures (optional für v2)

**Swipe-Navigation zwischen Modulen:**
```tsx
// In page.tsx (alle drei Module)
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
    onSwipedLeft: () => {
        // /m/vocabulary → /m/vocabulary/review
        // /m/vocabulary/review → /m/vocabulary/weak
    },
    onSwipedRight: () => {
        // /m/vocabulary/weak → /m/vocabulary/review
        // /m/vocabulary/review → /m/vocabulary
    },
    trackMouse: false // Nur Touch
});

<div {...handlers} style={{ /* Card */ }}>
```

### Bottom-Navigation Update (optional)

**Datei:** `src/components/mobile/MobileBottomNav.tsx`

**Sub-Navigation für Vocabulary:**
```tsx
// Wenn auf /m/vocabulary/*
{pathname.startsWith('/m/vocabulary') && (
    <div style={{
        position: 'fixed',
        bottom: '70px', // Über Bottom-Nav
        left: 0,
        right: 0,
        background: 'rgba(28, 28, 30, 0.95)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px'
    }}>
        <button onClick={() => router.push('/m/vocabulary')}>
            📚 Due
        </button>
        <button onClick={() => router.push('/m/vocabulary/review')}>
            🔄 Review
        </button>
        <button onClick={() => router.push('/m/vocabulary/weak')}>
            ⚠️ Weak
        </button>
    </div>
)}
```

### Performance

**Cache-Strategie:**
- Jedes Modul hat eigenen Cache-Key (`vocabulary-due-*`, `vocabulary-review-*`, `vocabulary-weak-*`)
- TTL: 30 Minuten (bereits implementiert)
- Refresh nach Rating: Nur aktuelles Modul (nicht alle drei)

**Prefetch:**
```tsx
// Optional: Prefetch andere Module im Hintergrund
usePrefetch(
    'vocabulary_cards',
    `vocabulary-review-${STUDENT_ID}`,
    async () => {
        const { data } = await supabase.rpc('get_review_vocabulary_cards', {
            p_user_id: STUDENT_ID,
            p_limit: 20,
        });
        return data || [];
    },
    { ttl: CACHE_TTL.VOCABULARY_CARDS, delay: 10000 }
);
```

---

## 🛠️ Implementation Plan

### Phase 1: Database (30 min)

**Dateien zu erstellen:**

1. `supabase/migrations/XXX_vocabulary_review_weak_rpcs.sql`

**Inhalt:**
```sql
-- Create RPCs for Review Vocab and Weak Words modules
-- Date: 2026-02-19

-- RPC 1: get_review_vocabulary_cards
-- [SQL von oben]

-- RPC 2: get_weak_vocabulary_cards
-- [SQL von oben]

-- RPC 3: get_review_vocabulary_count (für Dashboard)
-- [SQL von oben]

-- RPC 4: get_weak_vocabulary_count (für Dashboard)
-- [SQL von oben]
```

**Deployment:**
```bash
# In Supabase SQL Editor ausführen
```

**Verification:**
```sql
-- Test Review Vocab RPC
SELECT * FROM get_review_vocabulary_cards('YOUR-USER-ID'::UUID, 5);

-- Test Weak Words RPC
SELECT * FROM get_weak_vocabulary_cards('YOUR-USER-ID'::UUID, 5);

-- Test Counts
SELECT get_review_vocabulary_count('YOUR-USER-ID'::UUID);
SELECT get_weak_vocabulary_count('YOUR-USER-ID'::UUID);
```

---

### Phase 2: Routes (45 min)

**2.1 Review Vocab Route**

```bash
mkdir -p src/app/m/vocabulary/review
cp src/app/m/vocabulary/page.tsx src/app/m/vocabulary/review/page.tsx
```

**Änderungen in `review/page.tsx`:**
- [ ] Zeile 73: RPC → `get_review_vocabulary_cards`
- [ ] Zeile 96: Cache-Key → `vocabulary-review-${STUDENT_ID}`
- [ ] Zeile 339: Titel → "🔄 Review Vocab"
- [ ] Zeile 397: Empty State → "No cards to review!" + Button zu `/m/vocabulary`

**2.2 Weak Words Route**

```bash
mkdir -p src/app/m/vocabulary/weak
cp src/app/m/vocabulary/page.tsx src/app/m/vocabulary/weak/page.tsx
```

**Änderungen in `weak/page.tsx`:**
- [ ] Zeile 73: RPC → `get_weak_vocabulary_cards`
- [ ] Zeile 96: Cache-Key → `vocabulary-weak-${STUDENT_ID}`
- [ ] Zeile 339: Titel → "⚠️ Weak Words"
- [ ] Zeile 397: Empty State → "No weak words!" + Button zu `/m/vocabulary`

---

### Phase 3: Dashboard Integration (30 min)

**Datei:** `src/app/m/page.tsx`

**Änderungen:**
1. **State hinzufügen:**
```tsx
const [reviewCount, setReviewCount] = useState(0);
const [weakCount, setWeakCount] = useState(0);
```

2. **Counts laden:**
```tsx
useEffect(() => {
    if (!STUDENT_ID) return;

    supabase.rpc('get_review_vocabulary_count', { p_user_id: STUDENT_ID })
        .then(({ data }) => setReviewCount(data || 0));

    supabase.rpc('get_weak_vocabulary_count', { p_user_id: STUDENT_ID })
        .then(({ data }) => setWeakCount(data || 0));
}, [STUDENT_ID]);
```

3. **Karten hinzufügen:**
   - [ ] Review Vocab Card (Orange, 🔄)
   - [ ] Weak Words Card (Rot, ⚠️)

---

### Phase 4: Testing (1 hour)

**Manual Testing Checklist:**

#### Due Cards (`/m/vocabulary`)
- [ ] Lädt fällige Karten korrekt
- [ ] Bewertungen wirken auf FSRS
- [ ] Card verschwindet nach Bewertung
- [ ] Session-Summary zeigt korrekte Stats
- [ ] Cache funktioniert (offline-fähig)

#### Review Vocab (`/m/vocabulary/review`)
- [ ] Lädt nur Karten mit letzter Bewertung 1 oder 2
- [ ] Empty State zeigt sich wenn keine Karten
- [ ] Bewertungen wirken auf FSRS
- [ ] Card verschwindet nach "Good" oder "Easy"
- [ ] Button "Back to Due Cards" funktioniert

#### Weak Words (`/m/vocabulary/weak`)
- [ ] Lädt nur Karten mit fsrs_lapses >= 2
- [ ] Empty State zeigt sich wenn keine weak words
- [ ] Bewertungen wirken auf FSRS
- [ ] Card verschwindet nach mehreren "Good"-Bewertungen
- [ ] Button "Back to Due Cards" funktioniert

#### Dashboard
- [ ] Review Count zeigt korrekte Anzahl
- [ ] Weak Count zeigt korrekte Anzahl
- [ ] Counts aktualisieren sich nach Session
- [ ] Navigation zu allen drei Modulen funktioniert

#### Cross-Module Integration
- [ ] Bewertung in "Due Cards" beeinflusst "Review Vocab" Count
- [ ] Bewertung "Again" in "Due Cards" → erscheint in "Review Vocab"
- [ ] Bewertung "Again" 2x → erscheint in "Weak Words"
- [ ] Bewertung "Good" in "Weak Words" → verschwindet aus Liste

---

### Phase 5: Documentation (15 min)

**Dateien zu aktualisieren:**

1. `VOCAB-DIALOG-AND-DB-OVERVIEW.md`
   - [ ] Section "Routes" hinzufügen
   - [ ] RPCs dokumentieren (4 neue Funktionen)

2. `MASTER-SESSION-STATUS.md`
   - [ ] Phase 5 hinzufügen: "Three Modules Implementation"

3. `_Agent02_*.md` (neue Session-Log-Datei)
   - [ ] Alle Änderungen dokumentieren

---

## 📊 Zusammenfassung

### Was wird erstellt?

| Typ | Anzahl | Dateien |
|-----|--------|---------|
| **DB Migrations** | 1 | `XXX_vocabulary_review_weak_rpcs.sql` |
| **RPC Functions** | 4 | `get_review_vocabulary_cards`, `get_weak_vocabulary_cards`, `get_review_count`, `get_weak_count` |
| **Routes (Pages)** | 2 | `/m/vocabulary/review/page.tsx`, `/m/vocabulary/weak/page.tsx` |
| **Dashboard Updates** | 1 | `/m/page.tsx` (2 neue Karten) |

### Was bleibt unverändert?

✅ `update_vocabulary_progress` RPC (funktioniert für alle Module)
✅ FSRS-Scheduler (`/lib/fsrs/fsrs-scheduler.ts`)
✅ Cache-Hooks (`/hooks/use-mobile-cache.ts`)
✅ TTS-Logik (`/lib/tts/greek-tts.ts`)
✅ Mobile-Bottom-Nav
✅ Offline-Banner

### Geschätzter Aufwand

| Phase | Aufwand | Beschreibung |
|-------|---------|--------------|
| Phase 1: Database | 30 min | Migrations schreiben + deployen |
| Phase 2: Routes | 45 min | 2 neue Pages (Copy + Modify) |
| Phase 3: Dashboard | 30 min | Counts + Navigation |
| Phase 4: Testing | 60 min | Manuelles Testing aller Flows |
| Phase 5: Documentation | 15 min | Update .md-Dateien |
| **TOTAL** | **3 Stunden** | Voll funktionsfähige 3-Modul-Architektur |

---

## 🚀 Quick Start (für Implementation)

### Schritt 1: Migration deployen
```sql
-- Kopiere SQL von diesem Dokument → Supabase SQL Editor
-- Ausführen → Verify mit SELECT
```

### Schritt 2: Routes erstellen
```bash
# Terminal
cp src/app/m/vocabulary/page.tsx src/app/m/vocabulary/review/page.tsx
cp src/app/m/vocabulary/page.tsx src/app/m/vocabulary/weak/page.tsx

# Dann: Änderungen laut Phase 2 durchführen
```

### Schritt 3: Dashboard updaten
```tsx
// src/app/m/page.tsx
// State + Counts + Karten hinzufügen (siehe Phase 3)
```

### Schritt 4: Testing
```bash
npm run dev
# Browser: http://localhost:3000/m
# Teste alle drei Module manuell
```

---

**Ende von VOCAB-THREE-MODULES-PLAN.md**
**Ready for Implementation! 🎯**
