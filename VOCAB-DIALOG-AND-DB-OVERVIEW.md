# VOCAB-DIALOG-AND-DB-OVERVIEW.md

**Erstellt:** 2026-02-19
**Zweck:** Ist-Zustands-Dokumentation (keine Vorschläge!)
**Kontext:** Vokabelmodul "Due Cards today" – Mobile App (`/m/vocabulary`)

---

## 1. Aktueller Ist-Zustand des Dialogs "Due Cards today"

**Route:** `/m/vocabulary`
**Datei:** `src/app/m/vocabulary/page.tsx`

### 1.1 UI-Elemente (was IST vorhanden)

#### Header (Sticky, oben fixiert)
- **Back-Button** (← Back) → navigiert zu `/m`
- **Titel** "📚 Vocabulary" (zentriert, weiß, 20px)
- **Cache-Indikator** (nur sichtbar wenn aus Cache geladen)
- **Refresh-Button** (🔄, blauer Kreis-Button, rechts)

#### Progress-Leiste (unter Header)
- **Card-Counter:** "Card X / Y" (aktueller Index / Gesamtzahl)
- **Session-Stats:**
  - ❌ X (Again-Count, rot)
  - 🟠 X (Hard-Count, orange)
  - ✅ X (Good-Count, grün)
  - 🎯 X (Easy-Count, blau)
  - (Nur sichtbar wenn > 0)

#### Flip-Card (Haupt-Interface, 360px Mindesthöhe)

**Vorderseite (FRONT - vor dem Tippen):**
- **Label:** "English" oder "Russian" (11px, uppercase, grau, oben)
- **Wort:** Großer Text (36px, weiß, fett, zentriert)
  - Zeigt `english` ODER `russian` (abhängig von User-Locale)
- **Hinweis:** "Tap to reveal answer" (12px, sehr helles Grau, unten)
- **Cursor:** pointer (zeigt Klickbarkeit)

**Rückseite (BACK - nach dem Tippen):**
- **Label:** "Greek" (11px, uppercase, grau, oben)
- **Griechisches Wort:** Sehr großer Text (40px, weiß, fett, zentriert)
  - Zeigt `greek_word` oder `greek`
- **Phonetik:** `/phonetic/` (16px, italic, grau, unter Wort)
  - Nur sichtbar wenn `phonetic` vorhanden
- **Beispielsatz:** "example_gr" (14px, italic, weiß mit Transparenz, zentriert)
  - Nur sichtbar wenn `example_gr` vorhanden
- **Cursor:** default (nicht mehr klickbar)

#### TTS-Controls (unter der Card, 3 Buttons horizontal)
1. **Play-Button:**
   - Text: "🔊 Play" / "🔊 Playing..." (während Wiedergabe)
   - Grauer Hintergrund, weiße Border
   - Disabled während Wiedergabe (opacity 0.5)

2. **Speed-Button:**
   - Emoji: 🐢 (Slow, 0.6x) / ▶️ (Normal, 0.9x) / 🐇 (Fast, 1.2x)
   - Zyklisch: Slow → Normal → Fast → Slow
   - Wert in localStorage: `tts-speed`

3. **Auto-Play-Toggle:**
   - Text: "🔊 Auto" (ON) / "🔇 Auto" (OFF)
   - Blauer Hintergrund wenn ON, grau wenn OFF
   - Wert in localStorage: `tts-autoplay`

#### Rating-Buttons (2x2 Grid, NUR sichtbar wenn Card FLIPPED)
- **Again ❌:** Rot (`#FF6B6B`), großer Emoji (28px), Label "Again", 70px Höhe
- **Hard 🟠:** Orange (`#FFA94D`), großer Emoji, Label "Hard"
- **Good ✅:** Grün (`#51CF66`), großer Emoji, Label "Good"
- **Easy 🎯:** Blau (`#339AF0`), großer Emoji, Label "Easy"
- Alle: Touch-Feedback (scale 0.95 beim Antippen)

#### Session-Summary (wenn alle Cards fertig ODER Liste leer)
- **Emoji:** 🎉 (64px, groß)
- **Titel:** "Session Complete!" (24px)
- **Statistik-Grid (2x2):**
  - Again: Rote Box mit Count
  - Hard: Orange Box mit Count
  - Good: Grüne Box mit Count
  - Easy: Blaue Box mit Count
- **Buttons:**
  - "Practice More" (weiß, Outline) → restart
  - "Close" (blau) → navigiert zu `/m`

#### Bottom-Navigation
- Komponente: `MobileBottomNav` (Standard Mobile-Footer)

#### Offline-Banner
- Komponente: `OfflineBanner` (zeigt "Offline"-Hinweis wenn keine Verbindung)

---

### 1.2 Welche Daten werden aktuell angezeigt?

**Von `VocabularyItem` Interface (Zeilen 17-38):**

| Feld | Angezeigt | Wo | Wert |
|------|-----------|-----|------|
| `id` | ❌ | - | UUID |
| `type` | ❌ | - | "vocabulary" |
| `english` | ✅ | Card Front | EN-Übersetzung |
| `russian` | ✅ | Card Front (wenn locale=ru) | RU-Übersetzung |
| `greek` | ✅ | Card Back | Griechischer Text (Fallback) |
| `greek_word` | ✅ | Card Back | Griechischer Text (Primary) |
| `phonetic` | ✅ | Card Back | z.B. `/ya su/` |
| `example_en` | ❌ | - | Nicht genutzt (nur `example_gr`) |
| `example_gr` | ✅ | Card Back | Griechischer Beispielsatz |
| `audio_url` | ❌ | - | Nicht für Audio genutzt (TTS stattdessen) |
| `level` | ❌ | - | A1-C2 (wird gefiltert, aber nicht angezeigt) |
| `difficulty` | ❌ | - | easy/medium/hard (wird gefiltert, aber nicht angezeigt) |
| **FSRS-Felder:** | | | |
| `fsrs_difficulty` | ❌ | - | FSRS Parameter (berechnet) |
| `fsrs_stability` | ❌ | - | FSRS Parameter (berechnet) |
| `fsrs_last_review` | ❌ | - | Letzter Review-Timestamp |
| `fsrs_due` | ❌ | - | Fälligkeits-Timestamp |
| `fsrs_reps` | ❌ | - | Anzahl Wiederholungen |
| `fsrs_lapses` | ❌ | - | Anzahl Fehler |
| `fsrs_state` | ❌ | - | 'new'/'learning'/'review'/'relearning' |

**Hinweis:** FSRS-Felder werden NUR für Logik genutzt, NICHT angezeigt.

---

### 1.3 Welche Interaktionen gibt es bereits?

1. **Card-Flip:**
   - **Trigger:** `onClick` auf Card (nur wenn `!isFlipped`)
   - **Aktion:** `setIsFlipped(true)`
   - **Effekt:** Card dreht sich (Front → Back), Rating-Buttons erscheinen
   - **Auto-Play:** Wenn `autoPlay === true`, startet TTS nach 300ms

2. **Rating (FSRS-Bewertung):**
   - **Trigger:** Click auf Rating-Button (1-4)
   - **Aktion:** `handleRating(rating)`
   - **Logik:**
     - Konvertiert DB-Item zu FSRS-Card
     - Berechnet neue FSRS-Parameter mit `FSRSScheduler.rate(card, rating, date)`
     - Berechnet Intervall mit `FSRSScheduler.calculateInterval(stability)`
     - Ruft RPC `update_vocabulary_progress(...)` auf
     - Updated Session-Stats (again/hard/good/easy Counter +1)
     - Entfernt Card aus Queue (zeigt nächste Card ODER Summary)
     - Refreshed Cache nach 1 Sekunde
     - Setzt `isFlipped = false` für nächste Card

3. **TTS Play:**
   - **Trigger:** Click auf Play-Button
   - **Aktion:** `playAudio()`
   - **Logik:**
     - Spricht `greek_word || greek` mit `speakGreek(text, { rate: speechRate })`
     - Zeigt "Playing..." während Wiedergabe
     - Disabled Button während Wiedergabe

4. **Speed-Zyklus:**
   - **Trigger:** Click auf Speed-Button
   - **Aktion:** `cycleSpeed()`
   - **Logik:**
     - 0.6x → 0.9x → 1.2x → 0.6x (zyklisch)
     - Speichert in `localStorage.tts-speed`

5. **Auto-Play Toggle:**
   - **Trigger:** Click auf Auto-Button
   - **Aktion:** `toggleAutoPlay()`
   - **Logik:**
     - Schaltet `autoPlay` um (true ⇄ false)
     - Speichert in `localStorage.tts-autoplay`

6. **Refresh:**
   - **Trigger:** Click auf Refresh-Button (🔄, Header)
   - **Aktion:** `refresh()` (Cache invalidieren + neu laden)

7. **Restart (nach Session):**
   - **Trigger:** Click auf "Practice More" (Summary-Screen)
   - **Aktion:** `handleRestart()`
   - **Logik:**
     - Reset Index auf 0
     - Reset Stats auf {0,0,0,0}
     - `setShowSummary(false)`
     - `setIsFlipped(false)`
     - `refresh()` (lädt neue Due-Cards)

8. **Close:**
   - **Trigger:** Click auf "Close" (Summary) oder "← Back" (Header)
   - **Aktion:** `router.push('/m')`

---

### 1.4 Welche Logik ist schon implementiert?

#### Datenquelle (Card Loading)
- **RPC:** `get_due_vocabulary_cards(p_user_id, p_limit=20)`
- **Cache:** `useMobileCache` Hook
  - Store: `'vocabulary_cards'`
  - Key: `vocabulary-due-${STUDENT_ID}`
  - TTL: 30 Minuten (`CACHE_TTL.VOCABULARY_CARDS`)
  - Offline-fähig (IndexedDB)
- **Prefetch:** Next Batch wird nach 5 Sekunden im Hintergrund geladen

#### Kartenauswahl (welche Karten werden geladen?)
- **Kriterien (SQL WHERE in RPC):**
  - `type = 'vocabulary'` (nur Vokabeln)
  - `fsrs_due IS NULL OR fsrs_due <= NOW()` (nur fällige Cards)
  - Optional: `level = user.level` (wenn User Level gesetzt)
- **Sortierung (SQL ORDER BY):**
  1. `fsrs_due ASC NULLS FIRST` (neue Cards zuerst, dann älteste fällige)
  2. `created_at DESC` (neueste zuerst als Fallback)
- **Limit:** 20 Cards (Mobile: Kleine Batches!)

#### FSRS-Scheduling (wie oft pro Tag?)
- **Algorithmus:** FSRS-6 (Free Spaced Repetition Scheduler)
- **Klasse:** `FSRSScheduler` (`/lib/fsrs/fsrs-scheduler.ts`)
- **Rating-System:**
  - **1 = Again:** Vergessen → Lapse +1, State → relearning, kurzes Intervall
  - **2 = Hard:** Schwierig → State bleibt, mittleres Intervall
  - **3 = Good:** Gut → State → review, normales Intervall
  - **4 = Easy:** Leicht → State → review, langes Intervall
- **Intervall-Berechnung:**
  - `calculateInterval(stability)` → Tage bis nächstes Review
  - `fsrs_due = NOW() + interval_days`
- **Keine feste Anzahl pro Tag:** Cards werden NUR durch Due-Date gefiltert

#### Progress-Tracking
- **Update via RPC:** `update_vocabulary_progress(...)`
- **Parameter (13):**
  - `p_card_id`, `p_user_id`, `p_rating`
  - `p_new_difficulty`, `p_new_stability`, `p_new_due`
  - `p_new_reps`, `p_new_lapses`, `p_new_state`
  - `p_interval_days`, `p_old_difficulty`, `p_old_stability`
- **Speicherort:** `user_vocabulary_progress` Tabelle (UPSERT)

#### Session-Management
- **Session-Stats:** Lokales State (nicht persistent)
  - `again`, `hard`, `good`, `easy` Counter
  - Reset bei Restart
- **Card-Queue:** Dynamisch (wird nicht client-seitig modifiziert)
  - Nach Rating: Card aus Queue entfernt (nur visuell)
  - Tatsächliche Queue kommt vom Server (via Cache refresh)

---

## 2. Aktuelle Datenbankstruktur für Vokabeln (Ist-Zustand)

### 2.1 Tabelle: `multilingual_vocabulary`

**Zweck:** Content-Tabelle (Vokabel-Definitionen, mehrsprachig)
**Migration:** `supabase/migrations/079_create_vocabulary.sql`

#### Spalten (21 Spalten)

| # | Spalte | Typ | Constraints | Beschreibung |
|---|--------|-----|-------------|--------------|
| 1 | `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Eindeutige ID |
| 2 | `nr` | INTEGER | - | Optionale Nummer (für Sortierung) |
| **Griechischer Content** |
| 3 | `greek_transcription` | TEXT | NOT NULL | Griechischer Text (Pflicht) |
| 4 | `greek_phonetic` | TEXT | - | Phonetische Aussprache |
| **Englische Übersetzung** |
| 5 | `en_translation` | TEXT | - | Englische Übersetzung |
| 6 | `en_importance_reason` | TEXT | - | Warum wichtig (EN) |
| 7 | `en_audio_url` | TEXT | - | Audio-Datei URL (EN) |
| **Deutsche Übersetzung** |
| 8 | `de_translation` | TEXT | - | Deutsche Übersetzung |
| 9 | `de_importance_reason` | TEXT | - | Warum wichtig (DE) |
| 10 | `de_audio_url` | TEXT | - | Audio-Datei URL (DE) |
| **Spanische Übersetzung** |
| 11 | `es_translation` | TEXT | - | Spanische Übersetzung |
| 12 | `es_importance_reason` | TEXT | - | Warum wichtig (ES) |
| 13 | `es_audio_url` | TEXT | - | Audio-Datei URL (ES) |
| **Russische Übersetzung** |
| 14 | `ru_translation` | TEXT | - | Russische Übersetzung |
| 15 | `ru_importance_reason` | TEXT | - | Warum wichtig (RU) |
| 16 | `ru_audio_url` | TEXT | - | Audio-Datei URL (RU) |
| **Lern-Metadaten** |
| 17 | `level` | TEXT | NOT NULL, CHECK (A1-C6) | CEFR-Level |
| 18 | `difficulty` | TEXT | NOT NULL, CHECK (easy/medium/hard) | Schwierigkeitsgrad |
| 19 | `frequency` | INTEGER | NOT NULL, DEFAULT 3, CHECK (1-5) | Häufigkeit (1-5 Sterne) |
| **System-Felder** |
| 20 | `created_at` | TIMESTAMPTZ | DEFAULT now() | Erstellungs-Timestamp |
| 21 | `updated_at` | TIMESTAMPTZ | DEFAULT now() | Letztes Update |
| 22 | `created_by` | UUID | REFERENCES users(id) | Admin der erstellt hat |

#### Constraints

| Constraint | Definition |
|-----------|------------|
| Unique | `UNIQUE (greek_transcription, level)` → Keine Duplikate pro Level |
| Level Check | Must be: `'A1', 'A2', 'B1', 'B2', 'C1', 'C2'` |
| Difficulty Check | Must be: `'easy', 'medium', 'hard'` |
| Frequency Check | Must be: `>= 1 AND <= 5` |

#### Indexes (9 Indexes)

| Index | Spalten | Typ | Zweck |
|-------|---------|-----|-------|
| `idx_vocab_level` | `level` | B-Tree | Filter nach Level |
| `idx_vocab_difficulty` | `difficulty` | B-Tree | Filter nach Schwierigkeit |
| `idx_vocab_frequency` | `frequency` | B-Tree | Filter nach Häufigkeit |
| `idx_vocab_created_at` | `created_at DESC` | B-Tree | Sortierung (neueste zuerst) |
| `idx_vocab_greek_text` | `to_tsvector('simple', greek_transcription)` | GIN | Volltext-Suche (Griechisch) |
| `idx_vocab_en_text` | `to_tsvector('english', en_translation)` | GIN | Volltext-Suche (EN) |
| `idx_vocab_de_text` | `to_tsvector('german', de_translation)` | GIN | Volltext-Suche (DE) |
| `idx_vocab_es_text` | `to_tsvector('spanish', es_translation)` | GIN | Volltext-Suche (ES) |
| `idx_vocab_ru_text` | `to_tsvector('russian', ru_translation)` | GIN | Volltext-Suche (RU) |

#### Trigger

- **Funktion:** `update_vocab_timestamp()`
- **Trigger:** `trg_update_vocab_timestamp` (BEFORE UPDATE)
- **Aktion:** Setzt `updated_at = now()` bei jedem Update

---

### 2.2 Tabelle: `user_vocabulary_progress`

**Zweck:** User-spezifische Progress-Daten (FSRS-Scheduling, Anki-ähnlich)
**Migration:** `database/migrations/088_create_user_vocabulary_progress.sql`

#### Spalten (13 Spalten)

| # | Spalte | Typ | Constraints | Beschreibung |
|---|--------|-----|-------------|--------------|
| 1 | `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Eindeutige Progress-ID |
| 2 | `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | User-Referenz |
| 3 | `vocabulary_id` | UUID | NOT NULL, FK → multilingual_vocabulary(id) ON DELETE CASCADE | Vokabel-Referenz |
| **FSRS-6 Scheduling-Parameter** |
| 4 | `fsrs_difficulty` | REAL | NOT NULL, DEFAULT 0.3 | FSRS Difficulty (0-10) |
| 5 | `fsrs_stability` | REAL | NOT NULL, DEFAULT 0.0 | FSRS Stability (Tage) |
| 6 | `fsrs_due` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Nächstes Review-Datum |
| 7 | `fsrs_reps` | INT | NOT NULL, DEFAULT 0 | Anzahl erfolgreicher Reviews |
| 8 | `fsrs_lapses` | INT | NOT NULL, DEFAULT 0 | Anzahl Vergessen (Again) |
| 9 | `fsrs_state` | TEXT | NOT NULL, DEFAULT 'new', CHECK | Lern-Status |
| 10 | `fsrs_last_review` | TIMESTAMPTZ | - | Letzter Review-Timestamp |
| **Metadaten** |
| 11 | `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Erste Initialisierung |
| 12 | `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Letztes Update |

#### Constraints

| Constraint | Definition |
|-----------|------------|
| Unique | `UNIQUE (user_id, vocabulary_id)` → Ein Progress-Record pro User+Vokabel |
| State Check | Must be: `'new', 'learning', 'review', 'relearning'` |
| Cascade | Delete ON DELETE CASCADE (wenn User/Vokabel gelöscht) |

#### Indexes (5 Indexes)

| Index | Spalten | Zweck |
|-------|---------|-------|
| `idx_user_vocab_progress_user_id` | `user_id` | Alle Progress eines Users |
| `idx_user_vocab_progress_vocabulary_id` | `vocabulary_id` | Wer lernt diese Vokabel? |
| `idx_user_vocab_progress_due` | `fsrs_due` | Fällige Cards finden |
| `idx_user_vocab_progress_state` | `fsrs_state` | Filter nach Status |
| `idx_user_vocab_progress_user_due` | `(user_id, fsrs_due)` | Composite: User-spezifische Due-Query |

#### Trigger

- **Funktion:** `update_user_vocab_progress_updated_at()`
- **Trigger:** `update_user_vocab_progress_timestamp` (BEFORE UPDATE)
- **Aktion:** Setzt `updated_at = NOW()` bei jedem Update

---

### 2.3 RPC-Funktionen (aktuell genutzt)

#### Admin-Funktionen (nur für Admin-Interface)

| # | Funktion | Parameter | Return | Zweck |
|---|----------|-----------|--------|-------|
| 1 | `get_vocabulary_filtered(...)` | search, level, difficulty, freq_min, freq_max, limit, offset | SETOF multilingual_vocabulary | Filter + Pagination |
| 2 | `get_vocabulary_stats()` | - | JSON | Dashboard-Statistiken |
| 3 | `bulk_update_vocabulary(...)` | ids[], level, difficulty, frequency | INTEGER (Anzahl) | Bulk-Update |
| 4 | `bulk_delete_vocabulary(...)` | ids[] | INTEGER (Anzahl) | Bulk-Delete |
| 5 | `check_vocabulary_duplicate(...)` | greek_transcription, level, exclude_id | BOOLEAN | Duplikat-Check |

**Hinweis:** Diese werden NICHT im Mobile-Dialog genutzt (nur Admin-Desktop).

#### Student-Funktionen (für Mobile-Dialog)

| # | Funktion | Parameter | Return | Zweck |
|---|----------|-----------|--------|-------|
| 1 | `get_due_vocabulary_cards(...)` | `p_user_id`, `p_limit` | TABLE (19 Spalten) | Fällige Cards mit FSRS-Daten |
| 2 | `update_vocabulary_progress(...)` | 13 Parameter (siehe unten) | JSON | Update nach Review |
| 3 | `init_user_vocabulary_progress(...)` | `p_user_id`, `p_level` | INTEGER (Anzahl) | Initialisiert Progress für neue Cards |

#### Details: `get_due_vocabulary_cards`

**Datei:** `supabase/migrations/072_vocabulary_fsrs_rpc.sql`

**Query-Logik:**
```sql
SELECT
    li.id, li.type, li.english, li.russian, li.greek, ...
    COALESCE(sp.fsrs_difficulty, 6.4133) AS fsrs_difficulty,
    COALESCE(sp.fsrs_stability, 0.212) AS fsrs_stability,
    ...
FROM learning_items li
LEFT JOIN student_progress sp ON sp.item_id = li.id AND sp.student_id = p_user_id
WHERE
    li.type = 'vocabulary'
    AND (sp.fsrs_due IS NULL OR sp.fsrs_due <= NOW())
    AND (li.level IS NULL OR li.level = (SELECT level FROM users WHERE id = p_user_id))
ORDER BY
    sp.fsrs_due ASC NULLS FIRST,
    sp.fsrs_difficulty DESC,
    li.created_at ASC
LIMIT p_limit;
```

**Return Columns (19):**
- `id`, `type`, `english`, `russian`, `greek`, `greek_word`, `phonetic`
- `example_en`, `example_gr`, `audio_url`, `level`, `difficulty`
- `fsrs_difficulty`, `fsrs_stability`, `fsrs_last_review`, `fsrs_due`
- `fsrs_reps`, `fsrs_lapses`, `fsrs_state`, `created_at`

**Default-Werte (wenn kein Progress existiert):**
- `fsrs_difficulty`: 6.4133 (FSRS initial)
- `fsrs_stability`: 0.212 (FSRS initial)
- `fsrs_due`: NOW() (sofort fällig)
- `fsrs_reps`: 0
- `fsrs_lapses`: 0
- `fsrs_state`: 'new'

#### Details: `update_vocabulary_progress`

**Datei:** `supabase/migrations/072_vocabulary_fsrs_rpc.sql`

**Parameter (13):**
1. `p_card_id` (UUID) - Vokabel-ID
2. `p_user_id` (UUID) - User-ID
3. `p_rating` (INT) - Bewertung 1-4
4. `p_new_difficulty` (REAL) - Neuer FSRS-Difficulty
5. `p_new_stability` (REAL) - Neuer FSRS-Stability
6. `p_new_due` (TIMESTAMPTZ) - Nächster Review-Timestamp
7. `p_new_reps` (INT) - Neue Wiederholungs-Anzahl
8. `p_new_lapses` (INT) - Neue Fehler-Anzahl
9. `p_new_state` (TEXT) - Neuer Status
10. `p_interval_days` (REAL) - Tage bis nächstes Review
11. `p_old_difficulty` (REAL) - Alter Difficulty (für Log)
12. `p_old_stability` (REAL) - Alter Stability (für Log)

**Logik:**
1. Validierung: Rating 1-4, State in ['new','learning','review','relearning']
2. UPSERT in `student_progress` (ON CONFLICT → UPDATE)
3. INSERT in `fsrs_review_logs` (Audit-Trail)
4. Return JSON: `{ success: true, card_id, progress_id, new_due, interval_days, message }`

**Fehlerbehandlung:**
- Bei Fehler: Return JSON: `{ success: false, error: SQLERRM, message: '...' }`

#### Details: `init_user_vocabulary_progress`

**Datei:** `database/migrations/088_create_user_vocabulary_progress.sql`

**Zweck:** Erstellt Progress-Records für alle Vokabeln eines Users (einmalig)

**Query-Logik:**
```sql
INSERT INTO user_vocabulary_progress (user_id, vocabulary_id, fsrs_due)
SELECT p_user_id, v.id, NOW()
FROM multilingual_vocabulary v
LEFT JOIN user_vocabulary_progress uvp ON uvp.vocabulary_id = v.id AND uvp.user_id = p_user_id
WHERE uvp.id IS NULL
    AND (p_level IS NULL OR v.level = p_level);
```

**Return:** Integer (Anzahl neu erstellter Records)

---

### 2.4 Row-Level Security (RLS)

#### Tabelle: `multilingual_vocabulary`

**Status:** RLS ENABLED

| Policy | Operation | User | Condition |
|--------|-----------|------|-----------|
| "Admin full access to vocabulary" | ALL | authenticated | `role = 'admin'` (EXISTS in users) |
| "Students can read vocabulary" | SELECT | authenticated | `true` (alle dürfen lesen) |
| "Anon can read vocabulary" | SELECT | anon | `true` (auch ohne Login) |

**Bedeutung:**
- Admins: Volle CRUD-Rechte
- Students: Nur Lesen
- Anonymous: Nur Lesen (öffentlicher Zugriff)

#### Tabelle: `user_vocabulary_progress`

**Status:** RLS ENABLED

| Policy | Operation | User | Condition |
|--------|-----------|------|-----------|
| "Users can view own vocabulary progress" | SELECT | authenticated | `auth.uid() = user_id` |
| "Users can insert own vocabulary progress" | INSERT | authenticated | `auth.uid() = user_id` |
| "Users can update own vocabulary progress" | UPDATE | authenticated | `auth.uid() = user_id` |

**Bedeutung:**
- User können NUR eigene Progress-Daten sehen/ändern
- Keine Cross-User-Sichtbarkeit
- Kein Admin-Zugriff (Security Definer in RPCs umgeht RLS)

---

### 2.5 Fehlende Informationen / Gaps

**Hinweis:** Dies ist eine REINE Ist-Analyse. Fehlende Daten werden dokumentiert, aber KEINE Vorschläge gemacht.

#### Nicht dokumentiert / nicht gefunden:

1. **Audio-Nutzung:** `en_audio_url`, `de_audio_url`, etc. existieren in DB, werden aber NICHT im Mobile-Dialog genutzt (TTS wird stattdessen verwendet).

2. **Level-Filtering:** Der Code filtert Cards nach `user.level`, aber es ist unklar:
   - Wo wird `users.level` gesetzt?
   - Gibt es ein User-Onboarding für Level-Auswahl?

3. **`learning_items` Tabelle:** Die RPC `get_due_vocabulary_cards` referenziert `learning_items`, aber die Migration 079 erstellt `multilingual_vocabulary`. Mögliche Erklärung:
   - Es gibt zwei parallele Systeme (alt + neu)?
   - Oder `learning_items` ist ein View/Alias?
   - Oder Migration 091 (`create_vocabulary_dialog_aliases`) erstellt Alias?

4. **`student_progress` Tabelle:** RPC nutzt `student_progress`, aber Migration 088 erstellt `user_vocabulary_progress`. Gleiche Situation wie #3.

5. **`fsrs_review_logs` Tabelle:** Wird in `update_vocabulary_progress` beschrieben, aber keine Migration gefunden.

6. **Beispielsätze:** `example_en` existiert in DB, wird aber nie angezeigt (nur `example_gr`).

7. **Importance Reason:** Felder `en_importance_reason`, etc. existieren, werden aber nicht im Mobile-Dialog gezeigt (nur im Admin-Interface?).

8. **Frequency-Stars:** `frequency` (1-5) existiert in DB, wird aber nicht im Dialog angezeigt.

---

## 3. Zusammenfassung (Nur Ist-Zustand)

### Was FUNKTIONIERT aktuell:

✅ Mobile-Dialog für Vokabel-Review (`/m/vocabulary`)
✅ Card-Flip Interface (EN/RU → GR mit Phonetik)
✅ FSRS-6 Scheduling (4 Bewertungen: Again, Hard, Good, Easy)
✅ TTS-Audio (Griechisch, variable Geschwindigkeit)
✅ Session-Tracking (Stats: Again/Hard/Good/Easy Counter)
✅ Offline-Cache (30 min TTL, IndexedDB)
✅ DB-Struktur: `multilingual_vocabulary` (Content) + `user_vocabulary_progress` (FSRS)
✅ RPC-Funktionen für Due-Cards + Progress-Update
✅ RLS: User können nur eigene Progress-Daten sehen

### Was NICHT dokumentiert / unklar ist:

❓ Relationship zwischen `learning_items` / `multilingual_vocabulary`
❓ Relationship zwischen `student_progress` / `user_vocabulary_progress`
❓ `fsrs_review_logs` Tabelle (referenziert, aber keine Migration)
❓ User-Level Assignment (wo wird `users.level` gesetzt?)
❓ Audio-URLs in DB werden nicht genutzt (TTS stattdessen)
❓ Importance-Reasons / Frequency-Stars nicht im Mobile-UI

---

**Ende der Ist-Zustands-Dokumentation**
**Keine Vorschläge. Keine Zukunftsplanungen. Nur Fakten.**
