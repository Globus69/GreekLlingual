# Grammar SRS Parameters – FSRS-6 Algorithm
**Letztes Update:** 15. Februar 2026

## Überblick

Das Grammar-Modul verwendet den **FSRS-6 (Free Spaced Repetition Scheduler)** Algorithmus für adaptive Wiederholungsintervalle. FSRS ist moderner und präziser als das klassische SM-2 (SuperMemo-2) System.

## FSRS-6 Parameter

### 1. Difficulty (Schwierigkeit)
- **Typ:** `number` (float)
- **Range:** `1.0` – `10.0`
- **Initial:** `5.0` (mittlere Schwierigkeit)
- **Bedeutung:** Wie schwer ist diese Grammar-Rule für den User?
- **Anpassung:**
  - **Rating 1 (Again):** `+0.5` bis `+1.0` (wird schwieriger)
  - **Rating 2 (Hard):** `+0.2` bis `+0.5` (etwas schwieriger)
  - **Rating 3 (Good):** `-0.1` bis `+0.1` (bleibt stabil)
  - **Rating 4 (Easy):** `-0.3` bis `-0.5` (wird einfacher)

**Wichtig:** Difficulty ist NICHT dasselbe wie `ease_factor` im SM-2 System!

### 2. Stability (Stabilität)
- **Typ:** `number` (float, in Tagen)
- **Range:** `0.1` – `36500` (ca. 100 Jahre)
- **Initial:** `10.0` Tage
- **Bedeutung:** Wie lange bleibt diese Grammar-Rule im Gedächtnis?
- **Berechnung:** Basierend auf Difficulty, Rating und bisherigen Reviews
- **Beispiel:**
  - Rating 1 (Again): Stability → `0.5` Tage (nächster Review morgen)
  - Rating 2 (Hard): Stability → `3.0` Tage
  - Rating 3 (Good): Stability → `10.0` Tage
  - Rating 4 (Easy): Stability → `30.0` Tage

### 3. State (Status)
- **Typ:** `enum` ('new', 'learning', 'review', 'relearning')
- **Initial:** `'new'`
- **Bedeutung:** Aktueller Lernstatus der Grammar-Rule

#### State-Übergänge:
```
new → learning (nach erstem Review)
learning → review (nach erfolgreichem Review mit Rating ≥ 3)
review → relearning (bei Rating 1)
relearning → review (nach erfolgreichem Review mit Rating ≥ 3)
```

### 4. Due (Fälligkeitsdatum)
- **Typ:** `Date` (ISO 8601 timestamp)
- **Berechnung:** `now + interval_days`
- **Beispiel:** `2026-02-25T10:30:00.000Z`
- **Bedeutung:** Wann soll diese Grammar-Rule als nächstes geübt werden?

### 5. Reps (Wiederholungen)
- **Typ:** `integer`
- **Initial:** `0`
- **Bedeutung:** Wie oft wurde diese Grammar-Rule bereits geübt?
- **Increment:** `+1` bei jedem Review (unabhängig vom Rating)

### 6. Lapses (Fehlversuche)
- **Typ:** `integer`
- **Initial:** `0`
- **Bedeutung:** Wie oft wurde diese Grammar-Rule vergessen? (Rating 1)
- **Increment:** `+1` nur bei Rating 1 (Again)

### 7. Last Review (Letzter Review)
- **Typ:** `Date` (ISO 8601 timestamp) oder `null`
- **Initial:** `null`
- **Bedeutung:** Wann wurde diese Grammar-Rule zuletzt geübt?
- **Update:** Bei jedem Review auf aktuelle Zeit gesetzt

## Rating-System (User-Input)

### Rating 1: Again ❌
- **Bedeutung:** "Ich konnte mich nicht erinnern / Ich habe es vergessen"
- **Effekt:**
  - Difficulty ↑ (wird schwieriger markiert)
  - Stability → sehr kurz (0.5 – 1 Tag)
  - State → 'relearning' (falls bereits in 'review')
  - Lapses +1
  - Reps +1

### Rating 2: Hard 🟠
- **Bedeutung:** "Ich konnte mich erinnern, aber es war schwierig"
- **Effekt:**
  - Difficulty ↑ (leicht)
  - Stability → kurz (2 – 4 Tage)
  - State bleibt oder → 'learning'
  - Reps +1

### Rating 3: Good ✅
- **Bedeutung:** "Ich konnte mich gut erinnern"
- **Effekt:**
  - Difficulty → stabil oder leicht ↓
  - Stability → mittel (7 – 14 Tage)
  - State → 'review' (wenn vorher 'learning')
  - Reps +1

### Rating 4: Easy 🎯
- **Bedeutung:** "Ich konnte mich sehr leicht erinnern"
- **Effekt:**
  - Difficulty ↓ (wird einfacher markiert)
  - Stability → lang (20 – 60 Tage)
  - State → 'review'
  - Reps +1

## FSRS vs. SM-2 Vergleich

| Feature | FSRS-6 | SM-2 |
|---------|--------|------|
| **Parameter** | Difficulty, Stability | Ease Factor, Interval |
| **Ratings** | 4 (Again, Hard, Good, Easy) | 6 (0-5) |
| **Adaptivität** | Hoch (ML-basiert) | Mittel (Formel-basiert) |
| **Initial Interval** | 10 Tage | 1 Tag → 6 Tage |
| **Difficulty Range** | 1.0 – 10.0 | N/A |
| **Ease Factor Range** | N/A | 1.3 – 2.5+ |
| **State Tracking** | 4 States (new, learning, review, relearning) | 2 States (new, mature) |

## Implementierungs-Details

### FSRSScheduler Klasse
```typescript
import { FSRSScheduler } from '@/lib/fsrs/fsrs-scheduler';

const scheduler = new FSRSScheduler();

// Rate a card
const updatedCard = scheduler.rate(currentCard, rating, now);

// Calculate interval
const intervalDays = scheduler.calculateInterval(updatedCard.stability);
```

### Card Interface
```typescript
interface Card {
  id: string;
  difficulty: number;      // 1.0 – 10.0
  stability: number;       // in days
  due: Date;               // next review date
  reps: number;            // total reviews
  lapses: number;          // total lapses (Rating 1)
  state: 'new' | 'learning' | 'review' | 'relearning';
  lastReview: Date | null;
}
```

### RPC Update Call
```typescript
const { data, error } = await supabase.rpc('update_card_fsrs', {
  p_card_id: item.id,
  p_user_id: STUDENT_ID,
  p_rating: rating,
  p_new_difficulty: updatedCard.difficulty,
  p_new_stability: updatedCard.stability,
  p_new_due: updatedCard.due.toISOString(),
  p_new_reps: updatedCard.reps,
  p_new_lapses: updatedCard.lapses,
  p_new_state: updatedCard.state,
  p_interval_days: intervalDays,
  p_old_difficulty: currentCard.difficulty,
  p_old_stability: currentCard.stability,
});
```

## Konfiguration

### Konstanten (nicht verändern ohne Absprache!)
```typescript
// In ai-guidelines.md festgelegt:
const MAX_NEW_CARDS_PER_DAY = 20;
const INITIAL_DIFFICULTY = 5.0;
const INITIAL_STABILITY = 10.0;
const MIN_STABILITY = 0.5;  // 12 Stunden
const MAX_STABILITY = 36500; // 100 Jahre
```

## Quellen & Referenzen

- **FSRS Paper:** https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
- **FSRS vs SM-2:** https://github.com/open-spaced-repetition/fsrs4anki/wiki/Comparison-with-SM-2
- **Implementation:** `src/lib/fsrs/fsrs-scheduler.ts`

## Änderungshistorie

- **2026-02-15:** Initiale Dokumentation erstellt
