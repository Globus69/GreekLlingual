# 📚 FSRS-6 Vocabulary Learning System – Todo-Liste

**Projekt:** GreekLingua Dashboard – FSRS-basiertes Vokabel-Lernen
**Algorithmus:** FSRS-6 (Free Spaced Repetition Scheduler)
**Ziel:** Ersetzt SM-2, 4 Ratings (Again/Hard/Good/Easy), Cross-Platform
**Erstellt:** 2026-02-14
**Letztes Update:** 2026-02-15
**Status:** 🟡 In Entwicklung (Phase 1)

---

## 📊 Gesamtfortschritt

- [ ] **Phase 1:** FSRS-6 Core Library (0/15 Tasks) 🔴 **IN ARBEIT**
- [x] **Phase 2:** Supabase DB-Schema (12/12 Tasks) ✅ **ABGESCHLOSSEN**
  - ✅ 052: FSRS-Felder zu learning_items hinzugefügt
  - ✅ 053: fsrs_review_logs Tabelle erstellt
  - ✅ 054: RPC-Funktionen (get_due_cards_fsrs, update_card_fsrs, get_fsrs_stats)
  - ✅ 055: Verification Guide (5/6 Tests erfolgreich)
- [ ] **Phase 3:** VocabularyDialog erweitern (14/18 Tasks) 🟡 **IN ARBEIT**
  - ✅ 3.1: FSRS Integration (7/7 Tasks)
  - ✅ 3.4: Swipe-Gesten (7/7 Tasks)
  - ⏳ 3.5: Progress-Anzeige (0/4 Tasks)
  - ⏳ 3.6: Error-Handling (0/? Tasks)
- [ ] **Phase 4:** Lautschrift & TTS (0/8 Tasks)
- [ ] **Phase 5:** Analytics & Stats (0/10 Tasks)
- [ ] **Phase 6:** Mobile PWA (0/9 Tasks)
- [ ] **Phase 7:** Desktop Tauri (0/8 Tasks)
- [ ] **Phase 8:** Testing & Optimierung (0/12 Tasks)

**Gesamt:** 26/92 Tasks abgeschlossen (28%)

---

## 🎯 Phase 1: FSRS-6 Core Library (3-5 Tage)

**Priorität:** 🔴 KRITISCH
**Abhängigkeiten:** Keine
**Ziel:** Funktionierende FSRS-Klasse mit 21 Parametern, Unit-Tests

### 1.1 Setup & Typen (2h)

- [ ] **1.1.1** Ordner erstellen: `src/lib/fsrs/`
- [ ] **1.1.2** Datei: `fsrs-types.ts` erstellen
  - [ ] Type `Rating = 1 | 2 | 3 | 4`
  - [ ] Type `State = 'new' | 'learning' | 'review' | 'relearning'`
  - [ ] Interface `Card` (id, difficulty, stability, due, reps, lapses, state, lastReview)
  - [ ] Interface `SchedulingInfo` (card, interval, retrievability)
  - [ ] Interface `ReviewLog` (cardId, rating, reviewTime, oldD, newD, oldS, newS)
- [ ] **1.1.3** Datei: `fsrs-constants.ts` erstellen
  - [ ] Export: `FSRS_PARAMETERS` (Array mit 21 Werten)
  - [ ] Export: `DESIRED_RETENTION = 0.90`
  - [ ] Export: `MAXIMUM_INTERVAL = 36500` (100 Jahre in Tagen)
  - [ ] Export: `FUZZ_FACTOR = 0.05` (±5% Zufallsstreuung)

### 1.2 FSRS-Scheduler Klasse (6h)

- [ ] **1.2.1** Datei: `fsrs-scheduler.ts` erstellen
- [ ] **1.2.2** Klasse `FSRSScheduler` mit Constructor
  - [ ] Private property: `w` (FSRS_PARAMETERS)
  - [ ] Private property: `desiredRetention` (0.90)
  - [ ] Constructor: Optional custom parameters
- [ ] **1.2.3** Methode: `createNewCard(): Card`
  - [ ] difficulty = w[4] (≈ 8.3)
  - [ ] stability = w[0] (≈ 0.212 days)
  - [ ] due = now
  - [ ] reps = 0, lapses = 0, state = 'new'
- [ ] **1.2.4** Methode: `rate(card: Card, rating: Rating, now: Date): Card`
  - [ ] Call `nextDS()` für neue difficulty/stability
  - [ ] Call `calculateInterval()` für interval
  - [ ] Calculate due = now + interval (in ms)
  - [ ] Increment reps
  - [ ] If rating=1: increment lapses
  - [ ] Update state via `nextState()`
  - [ ] Set lastReview = now
- [ ] **1.2.5** Private Methode: `nextDS(card, rating): {difficulty, stability}`
  - [ ] If state='new': Initial values (w[0-5])
  - [ ] Else: Call `nextDifficulty()` + `nextStability()`
  - [ ] Clamp difficulty: 1-10
  - [ ] Clamp stability: min 0.1
- [ ] **1.2.6** Private Methode: `nextDifficulty(d, rating): number`
  - [ ] deltaD = rating - 3 (kann -2, -1, 0, +1 sein)
  - [ ] return d - w[6] * deltaD
- [ ] **1.2.7** Private Methode: `nextStability(card, r, rating): number`
  - [ ] hardPenalty = rating=2 ? w[15] : 1
  - [ ] easyBonus = rating=4 ? w[16] : 1
  - [ ] FSRS-Formel: S' = S * (1 + e^w[8] * (11-D) * S^-w[9] * (e^((1-R)*w[10]) - 1) * hardPenalty * easyBonus)
- [ ] **1.2.8** Private Methode: `calculateRetrievability(card, now): number`
  - [ ] If !lastReview: return 0
  - [ ] elapsedDays = (now - lastReview) / (24*60*60*1000)
  - [ ] return (1 + elapsedDays / (9 * stability))^-1
- [ ] **1.2.9** Methode: `calculateInterval(stability): number`
  - [ ] interval = stability * (ln(desiredRetention) / ln(0.9))
  - [ ] Clamp max: MAXIMUM_INTERVAL
  - [ ] Add fuzz: ±5%
  - [ ] Round to 2 decimals
- [ ] **1.2.10** Private Methode: `addFuzz(interval): number`
  - [ ] fuzz = 1 + (random * 2 - 1) * FUZZ_FACTOR
  - [ ] return interval * fuzz (rounded)
- [ ] **1.2.11** Private Methode: `nextState(state, rating): State`
  - [ ] If rating=1: return 'relearning'
  - [ ] If state='new': return 'learning'
  - [ ] Else: return 'review'

### 1.3 Unit Tests (4h)

- [ ] **1.3.1** Ordner: `src/lib/fsrs/__tests__/` erstellen
- [ ] **1.3.2** Datei: `fsrs-scheduler.test.ts` erstellen
- [ ] **1.3.3** Test: "createNewCard() returns valid new card"
  - [ ] difficulty ≈ 8.3
  - [ ] stability ≈ 0.212
  - [ ] reps = 0, lapses = 0, state = 'new'
- [ ] **1.3.4** Test: "New card + Good rating → Interval ≈ 1 day"
  - [ ] Create new card
  - [ ] Rate with 3 (Good)
  - [ ] Interval between 0.8 - 1.5 days
- [ ] **1.3.5** Test: "5x Good → Interval > 30 days"
  - [ ] Loop: rate(card, 3) 5 times
  - [ ] Final interval > 30 days
- [ ] **1.3.6** Test: "Again rating → Lapses +1, Difficulty increases"
  - [ ] Rate with 1 (Again)
  - [ ] lapses = 1
  - [ ] difficulty > initial difficulty
- [ ] **1.3.7** Test: "Easy rating → Stability increases more than Good"
  - [ ] Rate card with 3 (Good) → save interval1
  - [ ] Rate identical card with 4 (Easy) → save interval2
  - [ ] interval2 > interval1
- [ ] **1.3.8** Test: "Hard rating → Stability increases less than Good"
  - [ ] Rate card with 3 (Good) → save interval1
  - [ ] Rate identical card with 2 (Hard) → save interval2
  - [ ] interval2 < interval1
- [ ] **1.3.9** Test: "Fuzz factor → Interval varies ±5%"
  - [ ] Calculate interval 100 times for same card
  - [ ] Check variance ≈ 5%
- [ ] **1.3.10** Test: "State transitions: new → learning → review"
  - [ ] New card + Good → state = 'learning'
  - [ ] Learning card + Good → state = 'review'
- [ ] **1.3.11** Test: "State transition: review + Again → relearning"
  - [ ] Review card + rating=1 → state = 'relearning'
- [ ] **1.3.12** Run all tests: `npm test fsrs-scheduler`

---

## 🗄️ Phase 2: Supabase DB-Schema (1-2 Tage)

**Priorität:** 🔴 KRITISCH
**Abhängigkeiten:** Phase 1 abgeschlossen
**Ziel:** DB-Tabellen + RPC-Funktionen für FSRS

### 2.1 Learning Items erweitern (1h)

- [ ] **2.1.1** Datei: `database/migrations/033_add_fsrs_fields.sql` erstellen
- [ ] **2.1.2** SQL: Add column `fsrs_difficulty REAL DEFAULT 8.2956`
- [ ] **2.1.3** SQL: Add column `fsrs_stability REAL DEFAULT 0.212`
- [ ] **2.1.4** SQL: Add column `fsrs_last_review TIMESTAMPTZ`
- [ ] **2.1.5** SQL: Add column `fsrs_due TIMESTAMPTZ DEFAULT NOW()`
- [ ] **2.1.6** SQL: Add column `fsrs_reps INT DEFAULT 0`
- [ ] **2.1.7** SQL: Add column `fsrs_lapses INT DEFAULT 0`
- [ ] **2.1.8** SQL: Add column `fsrs_state TEXT DEFAULT 'new'` + CHECK constraint
- [ ] **2.1.9** SQL: Add column `greek_word TEXT` (falls nicht vorhanden)
- [ ] **2.1.10** SQL: Add column `phonetic TEXT` (Lautschrift)
- [ ] **2.1.11** SQL: CREATE INDEX `idx_fsrs_due` ON learning_items(fsrs_due)
- [ ] **2.1.12** SQL: CREATE INDEX `idx_fsrs_state` ON learning_items(fsrs_state)

### 2.2 Review Logs Tabelle (1h)

- [ ] **2.2.1** Datei: `database/migrations/034_create_fsrs_review_logs.sql` erstellen
- [ ] **2.2.2** SQL: CREATE TABLE `fsrs_review_logs`
  - [ ] id UUID PRIMARY KEY
  - [ ] user_id UUID REFERENCES users(id) ON DELETE CASCADE
  - [ ] card_id UUID REFERENCES learning_items(id) ON DELETE CASCADE
  - [ ] rating INT CHECK (rating IN (1,2,3,4))
  - [ ] review_time TIMESTAMPTZ DEFAULT NOW()
  - [ ] interval_days REAL
  - [ ] old_difficulty REAL
  - [ ] new_difficulty REAL
  - [ ] old_stability REAL
  - [ ] new_stability REAL
  - [ ] created_at TIMESTAMPTZ DEFAULT NOW()
- [ ] **2.2.3** SQL: CREATE INDEX `idx_fsrs_reviews_user_card` ON fsrs_review_logs(user_id, card_id)
- [ ] **2.2.4** SQL: CREATE INDEX `idx_fsrs_reviews_time` ON fsrs_review_logs(review_time)
- [ ] **2.2.5** SQL: GRANT SELECT ON fsrs_review_logs TO authenticated

### 2.3 RPC: Get Due Cards (2h)

- [ ] **2.3.1** Datei: `database/migrations/035_create_fsrs_rpc_functions.sql` erstellen
- [ ] **2.3.2** SQL: CREATE FUNCTION `get_due_cards_fsrs(p_user_id, p_level, p_limit)`
  - [ ] RETURNS TABLE (id, front, greek_word, phonetic, level, difficulty, stability, due, reps, lapses, state)
  - [ ] WHERE: li.level = p_level
  - [ ] WHERE: li.type = 'vocabulary'
  - [ ] WHERE: li.fsrs_due <= NOW() OR li.fsrs_due IS NULL
  - [ ] ORDER BY: li.fsrs_due ASC NULLS FIRST
  - [ ] LIMIT: p_limit
- [ ] **2.3.3** SQL: SECURITY DEFINER + SET search_path = public
- [ ] **2.3.4** SQL: GRANT EXECUTE TO anon, authenticated

### 2.4 RPC: Update Card (2h)

- [ ] **2.4.1** SQL: CREATE FUNCTION `update_card_fsrs(p_card_id, p_user_id, p_rating, ...)`
  - [ ] Parameters: p_new_difficulty, p_new_stability, p_new_due, p_new_reps, p_new_lapses, p_new_state, p_interval_days, p_old_difficulty, p_old_stability
  - [ ] UPDATE learning_items SET fsrs_* = p_new_*
  - [ ] INSERT INTO fsrs_review_logs (...)
  - [ ] RETURN JSON: {success: true, card_id}
- [ ] **2.4.2** SQL: Error handling (IF NOT FOUND)
- [ ] **2.4.3** SQL: SECURITY DEFINER
- [ ] **2.4.4** SQL: GRANT EXECUTE TO anon, authenticated

### 2.5 Migration ausführen (30min)

- [ ] **2.5.1** Öffne Supabase SQL Editor
- [ ] **2.5.2** Führe `033_add_fsrs_fields.sql` aus
- [ ] **2.5.3** Führe `034_create_fsrs_review_logs.sql` aus
- [ ] **2.5.4** Führe `035_create_fsrs_rpc_functions.sql` aus
- [ ] **2.5.5** Verifiziere: SELECT * FROM information_schema.columns WHERE table_name='learning_items'
- [ ] **2.5.6** Verifiziere: SELECT * FROM information_schema.tables WHERE table_name='fsrs_review_logs'
- [ ] **2.5.7** Verifiziere: SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE 'fsrs%'

---

## 🎨 Phase 3: VocabularyDialog erweitern (2-3 Tage)

**Priorität:** 🟡 HOCH
**Abhängigkeiten:** Phase 1 + Phase 2
**Ziel:** 4 Rating-Buttons, FSRS-Integration, Swipe-Gesten

### 3.1 FSRS Integration (3h) ✅

- [x] **3.1.1** Import: `import { FSRSScheduler } from '@/lib/fsrs/fsrs-scheduler'`
- [x] **3.1.2** Import: `import type { Card, Rating } from '@/lib/fsrs/fsrs-types'`
- [x] **3.1.3** State: `const scheduler = useMemo(() => new FSRSScheduler(), [])`
- [x] **3.1.4** Funktion: `loadDueCards()` anpassen
  - [x] RPC-Call: `supabase.rpc('get_due_cards_fsrs', {p_user_id, p_level, p_limit: 100})`
  - [x] Map results zu items State
  - [x] Set totalDue = items.length
- [x] **3.1.5** Funktion: `handleRating(rating: Rating)` erstellen
  - [x] Create `currentCard: Card` from items[currentIndex]
  - [x] Call `scheduler.rate(currentCard, rating, new Date())`
  - [x] Calculate `intervalDays = scheduler.calculateInterval(updatedCard.stability)`
  - [x] RPC-Call: `supabase.rpc('update_card_fsrs', {...})`
  - [x] Error handling
  - [x] Increment currentIndex
  - [x] Update stats (correct/wrong counter)
- [x] **3.1.6** useEffect: Load due cards on mount
- [x] **3.1.7** Loading-State während RPC-Call

### 3.2 UI: 4 Rating-Buttons (2h)

- [ ] **3.2.1** Datei: `src/components/learning/Flashcard.tsx` öffnen
- [ ] **3.2.2** Konstante: `RATING_BUTTONS` Array definieren
  - [ ] {rating: 1, label: 'Again', color: '#FF6B6B', key: '1'}
  - [ ] {rating: 2, label: 'Hard', color: '#FFA94D', key: '2'}
  - [ ] {rating: 3, label: 'Good', color: '#51CF66', key: '3'}
  - [ ] {rating: 4, label: 'Easy', color: '#339AF0', key: '4'}
- [ ] **3.2.3** JSX: Mapping über RATING_BUTTONS
  - [ ] Button mit onClick={handleRating(btn.rating)}
  - [ ] Background-color: btn.color
  - [ ] Label: btn.label
  - [ ] Nur sichtbar wenn Karte geflippt (isFlipped=true)
- [ ] **3.2.4** CSS: Button-Styles (Glasmorphismus)
  - [ ] min-height: 44px (Touch Target)
  - [ ] border-radius: 12px
  - [ ] backdrop-filter: blur(10px)
  - [ ] Hover-Effekt: transform scale(1.05)
- [ ] **3.2.5** Responsive: Mobile = vertikal gestapelt, Desktop = horizontal

### 3.3 Keyboard Shortcuts (1h)

- [ ] **3.3.1** useEffect: Keyboard listener
- [ ] **3.3.2** Key '1' → handleRating(1)
- [ ] **3.3.3** Key '2' → handleRating(2)
- [ ] **3.3.4** Key '3' → handleRating(3)
- [ ] **3.3.5** Key '4' → handleRating(4)
- [ ] **3.3.6** Key 'Space' → flip card
- [ ] **3.3.7** Cleanup: removeEventListener on unmount

### 3.4 Swipe-Gesten (2h) ✅

- [x] **3.4.1** Install: `npm install react-swipeable`
- [x] **3.4.2** Import: `import { useSwipeable } from 'react-swipeable'`
- [x] **3.4.3** Hook: `const handlers = useSwipeable({...})`
  - [x] onSwipedRight: handleRating(4) // Easy
  - [x] onSwipedLeft: handleRating(1) // Again
  - [x] onSwipedUp: handleRating(3) // Good
  - [x] onSwipedDown: handleRating(2) // Hard
  - [x] trackTouch: true (Touch-Support, trackMouse disabled)
- [x] **3.4.4** JSX: `<div {...handlers}>` um Flashcard
- [x] **3.4.5** Visual Feedback: Swipe-Indikator während Geste
  - [x] State: `swipeDirection: 'left' | 'right' | 'up' | 'down' | null`
  - [x] CSS: Color-coded overlay mit emoji + label
  - [x] Animation: fade-in + scale effect (150ms)

### 3.5 Progress-Anzeige (1h)

- [ ] **3.5.1** State: `correctCount`, `wrongCount`
- [ ] **3.5.2** Increment bei Rating: 1=wrong, 3/4=correct, 2=neutral
- [ ] **3.5.3** Header: "1 / 100" → "{currentIndex + 1} / {totalDue}"
- [ ] **3.5.4** Progress Bar: `width: ${(currentIndex / totalDue) * 100}%`
- [ ] **3.5.5** Session Complete: If currentIndex >= totalDue
  - [ ] Summary-Screen: "✅ {correctCount} correct, ❌ {wrongCount} wrong"
  - [ ] Button: "Back to Dashboard"

### 3.6 Error Handling (1h)

- [ ] **3.6.1** RPC Error: Toast-Notification "Failed to load cards"
- [ ] **3.6.2** Update Error: Retry-Button oder Skip
- [ ] **3.6.3** Empty State: "No cards due today 🎉"
- [ ] **3.6.4** Network Error: "Check your connection"

---

## 🔊 Phase 4: Lautschrift & TTS (2 Tage)

**Priorität:** 🟢 MITTEL
**Abhängigkeiten:** Phase 3
**Ziel:** Griechisch + Lautschrift anzeigen, TTS-Audio

### 4.1 Lautschrift anzeigen (1h)

- [ ] **4.1.1** Flashcard.tsx: Rückseite erweitern
- [ ] **4.1.2** JSX: `<div className="greek-word">{item.greek_word}</div>`
- [ ] **4.1.3** JSX: `<div className="phonetic">/{item.phonetic}/</div>`
- [ ] **4.1.4** CSS: greek-word = 32px, bold, color: white
- [ ] **4.1.5** CSS: phonetic = 18px, color: #A8A8AD, margin-top: 8px

### 4.2 TTS Library erstellen (2h)

- [ ] **4.2.1** Datei: `src/lib/tts/greek-tts.ts` erstellen
- [ ] **4.2.2** Check: `if (!window.speechSynthesis) return false`
- [ ] **4.2.3** Funktion: `speakGreek(text: string, rate?: number)`
  - [ ] Create: `new SpeechSynthesisUtterance(text)`
  - [ ] Set: `utterance.lang = 'el-GR'`
  - [ ] Set: `utterance.rate = rate || 0.8` (langsamer)
  - [ ] Call: `window.speechSynthesis.speak(utterance)`
- [ ] **4.2.4** Funktion: `stopSpeaking()`
  - [ ] Call: `window.speechSynthesis.cancel()`
- [ ] **4.2.5** Export beide Funktionen

### 4.3 Auto-Play beim Flip (1h)

- [ ] **4.3.1** Flashcard.tsx: Import `speakGreek`
- [ ] **4.3.2** State: `autoPlayEnabled` (default: true)
- [ ] **4.3.3** useEffect: If `isFlipped && autoPlayEnabled && item.greek_word`
  - [ ] Call: `speakGreek(item.greek_word)`
- [ ] **4.3.4** Settings-Toggle: Auto-Play ein/aus

### 4.4 Audio-Button (1h)

- [ ] **4.4.1** JSX: Button mit 🔊 Icon
- [ ] **4.4.2** onClick: `speakGreek(item.greek_word)`
- [ ] **4.4.3** Position: Oben rechts auf Karten-Rückseite
- [ ] **4.4.4** Visual Feedback: Animation während TTS spielt
- [ ] **4.4.5** Accessibility: aria-label="Play pronunciation"

### 4.5 Slow/Normal Speed Toggle (1h)

- [ ] **4.5.1** State: `speechRate` (0.6 = slow, 0.8 = normal, 1.0 = fast)
- [ ] **4.5.2** Button: 🐢 Slow / 🐇 Fast
- [ ] **4.5.3** Pass `rate` to `speakGreek()`
- [ ] **4.5.4** Persist in localStorage

---

## 📊 Phase 5: Analytics & Stats (1-2 Tage)

**Priorität:** 🟢 MITTEL
**Abhängigkeiten:** Phase 3
**Ziel:** Dashboard-Widget, Retention-Stats, Charts

### 5.1 Dashboard Widget: Due Cards (2h)

- [ ] **5.1.1** Datei: `src/components/dashboard/DueCardsWidget.tsx` erstellen
- [ ] **5.1.2** State: `dueCount`, `loading`
- [ ] **5.1.3** useEffect: Load due count
  - [ ] RPC: `get_due_cards_fsrs(user.id, user.level, 1000)`
  - [ ] Set: `dueCount = data.length`
- [ ] **5.1.4** JSX: Card mit Icon 📚
- [ ] **5.1.5** JSX: `{dueCount}` groß anzeigen
- [ ] **5.1.6** Button: "Start Review" → navigate('/vocabulary')
- [ ] **5.1.7** Dashboard: Import + Rendern neben StatsCard

### 5.2 RPC: Calculate Retention (1h)

- [ ] **5.2.1** Datei: `database/migrations/036_create_fsrs_analytics.sql`
- [ ] **5.2.2** SQL: CREATE FUNCTION `calculate_retention(p_user_id, p_days)`
  - [ ] COUNT reviews WHERE rating >= 3 (correct)
  - [ ] COUNT total reviews
  - [ ] RETURN: (correct / total) * 100
- [ ] **5.2.3** SQL: GRANT EXECUTE
- [ ] **5.2.4** Ausführen in Supabase

### 5.3 Retention-Widget (2h)

- [ ] **5.3.1** Datei: `src/components/dashboard/RetentionWidget.tsx`
- [ ] **5.3.2** RPC-Call: `calculate_retention(user.id, 30)`
- [ ] **5.3.3** JSX: Prozentsatz anzeigen (z.B. "87%")
- [ ] **5.3.4** Color: Grün >80%, Orange 60-80%, Rot <60%
- [ ] **5.3.5** Tooltip: "Last 30 days"
- [ ] **5.3.6** Dashboard: Rendern

### 5.4 Charts (3h)

- [ ] **5.4.1** Install: `npm install recharts`
- [ ] **5.4.2** Datei: `src/components/dashboard/ReviewChart.tsx`
- [ ] **5.4.3** RPC: Reviews pro Tag (letzte 30 Tage)
- [ ] **5.4.4** Chart: LineChart mit Datum (X) + Review-Count (Y)
- [ ] **5.4.5** Color: Blau, Glasmorphismus-Style
- [ ] **5.4.6** Dashboard: Rendern

### 5.5 Streak-Counter (1h)

- [ ] **5.5.1** RPC: Consecutive days with >0 reviews
- [ ] **5.5.2** Widget: "🔥 7 Day Streak"
- [ ] **5.5.3** Dashboard: Rendern

---

## 📱 Phase 6: Mobile PWA (2-3 Tage)

**Priorität:** 🟡 HOCH
**Abhängigkeiten:** Phase 3
**Ziel:** Installierbare PWA, Offline-fähig, Touch-optimiert

### 6.1 PWA Manifest (1h)

- [ ] **6.1.1** Datei: `public/manifest.json` erstellen
- [ ] **6.1.2** JSON: name, short_name, description
- [ ] **6.1.3** JSON: start_url = "/"
- [ ] **6.1.4** JSON: display = "standalone"
- [ ] **6.1.5** JSON: background_color, theme_color
- [ ] **6.1.6** JSON: icons (192x192, 512x512)
- [ ] **6.1.7** Link in `layout.tsx`: `<link rel="manifest" href="/manifest.json">`

### 6.2 Icons generieren (1h)

- [ ] **6.2.1** Design: App-Icon (512x512 PNG)
- [ ] **6.2.2** Tool: https://realfavicongenerator.net
- [ ] **6.2.3** Generate: 192x192, 512x512, maskable
- [ ] **6.2.4** Save: `public/icon-*.png`
- [ ] **6.2.5** Update: manifest.json icons array

### 6.3 Service Worker (2h)

- [ ] **6.3.1** Install: `npm install next-pwa`
- [ ] **6.3.2** Datei: `next.config.js` erweitern
  - [ ] `const withPWA = require('next-pwa')({...})`
  - [ ] dest: 'public'
  - [ ] disable: dev mode
- [ ] **6.3.3** Build: `npm run build`
- [ ] **6.3.4** Verifizieren: `public/sw.js` existiert

### 6.4 Touch-Optimierung (2h)

- [ ] **6.4.1** CSS: `touch-action: pan-y` auf Flashcard
- [ ] **6.4.2** CSS: `user-select: none` auf Buttons
- [ ] **6.4.3** CSS: min-height 44px auf allen Buttons (Apple Guideline)
- [ ] **6.4.4** CSS: Tap-Highlight entfernen: `-webkit-tap-highlight-color: transparent`
- [ ] **6.4.5** Test: iPhone Safari + Android Chrome

### 6.5 Install-Prompt (1h)

- [ ] **6.5.1** Komponente: `InstallPWABanner.tsx`
- [ ] **6.5.2** Event: `window.addEventListener('beforeinstallprompt')`
- [ ] **6.5.3** Button: "Install App"
- [ ] **6.5.4** Call: `deferredPrompt.prompt()`
- [ ] **6.5.5** Hide nach Installation

---

## 🖥️ Phase 7: Desktop (Tauri) (3-4 Tage)

**Priorität:** 🔵 NIEDRIG (Optional)
**Abhängigkeiten:** Phase 3
**Ziel:** Native Desktop-App, Keyboard Shortcuts

### 7.1 Tauri Setup (2h)

- [ ] **7.1.1** Install: `npm install -D @tauri-apps/cli`
- [ ] **7.1.2** Init: `npx tauri init`
- [ ] **7.1.3** Config: `src-tauri/tauri.conf.json`
  - [ ] App name, identifier
  - [ ] Window: width 1200, height 800
  - [ ] allowlist: all permissions
- [ ] **7.1.4** Build: `npm run tauri build`

### 7.2 Global Shortcuts (2h)

- [ ] **7.2.1** Datei: `src-tauri/src/main.rs` erweitern
- [ ] **7.2.2** Import: `tauri::GlobalShortcutManager`
- [ ] **7.2.3** Register: `Ctrl+N` → New cards
- [ ] **7.2.4** Register: `Ctrl+R` → Review due cards
- [ ] **7.2.5** Register: `Ctrl+S` → Stats
- [ ] **7.2.6** Emit events zu Frontend

### 7.3 Menu Bar (1h)

- [ ] **7.3.1** Rust: Custom menu items
- [ ] **7.3.2** File → Preferences
- [ ] **7.3.3** View → Due Cards, Stats
- [ ] **7.3.4** Help → About, Keyboard Shortcuts

### 7.4 Native Notifications (1h)

- [ ] **7.4.1** Permission: Notification API
- [ ] **7.4.2** Rust: Daily reminder (10:00 AM)
- [ ] **7.4.3** Text: "You have {count} cards due today"
- [ ] **7.4.4** Click: Open app

---

## 🧪 Phase 8: Testing & Optimierung (2-3 Tage)

**Priorität:** 🔴 KRITISCH
**Abhängigkeiten:** Alle vorherigen
**Ziel:** 100% Test-Coverage für FSRS, E2E-Tests, Performance

### 8.1 FSRS Unit Tests erweitern (2h)

- [ ] **8.1.1** Test: Edge case: difficulty = 1 (minimum)
- [ ] **8.1.2** Test: Edge case: difficulty = 10 (maximum)
- [ ] **8.1.3** Test: Edge case: stability = 0.1 (minimum)
- [ ] **8.1.4** Test: Edge case: interval = 36500 days (maximum)
- [ ] **8.1.5** Test: Fuzz distribution (1000 iterations)
- [ ] **8.1.6** Coverage: `npm run test:coverage` → 100%

### 8.2 Integration Tests (3h)

- [ ] **8.2.1** Test: Load due cards RPC
- [ ] **8.2.2** Test: Update card RPC
- [ ] **8.2.3** Test: Review log inserted correctly
- [ ] **8.2.4** Test: Difficulty/Stability updated in DB
- [ ] **8.2.5** Test: Due date calculated correctly

### 8.3 E2E Tests (Cypress) (4h)

- [ ] **8.3.1** Install: `npm install -D cypress`
- [ ] **8.3.2** Test: Login → Open VocabularyDialog
- [ ] **8.3.3** Test: Flip card → Click "Good" → Next card
- [ ] **8.3.4** Test: Complete session → Summary screen
- [ ] **8.3.5** Test: Keyboard shortcut "3" = Good
- [ ] **8.3.6** Test: Swipe right = Good

### 8.4 Performance Optimierung (2h)

- [ ] **8.4.1** Lighthouse: Score > 90
- [ ] **8.4.2** useMemo: FSRSScheduler instance
- [ ] **8.4.3** useCallback: handleRating, loadDueCards
- [ ] **8.4.4** React.memo: Flashcard component
- [ ] **8.4.5** Lazy loading: Charts, Analytics

### 8.5 Accessibility (1h)

- [ ] **8.5.1** aria-labels auf allen Buttons
- [ ] **8.5.2** Keyboard-Navigation: Tab-Order
- [ ] **8.5.3** Focus-Indicators sichtbar
- [ ] **8.5.4** Screen-Reader-Test (VoiceOver)

### 8.6 Error Monitoring (1h)

- [ ] **8.6.1** Install: Sentry (optional)
- [ ] **8.6.2** Catch: FSRS calculation errors
- [ ] **8.6.3** Catch: RPC errors
- [ ] **8.6.4** Logging: Console + Remote

---

## 📝 Notizen & Entscheidungen

### FSRS-Parameter
- Defaults: Community-optimierte Werte aus FSRS-6 Paper
- Custom: Später per Admin-Panel anpassbar?

### Ratings
- 1 = Again (rot)
- 2 = Hard (orange)
- 3 = Good (grün)
- 4 = Easy (blau)

### Desired Retention
- Standard: 90%
- Später: Per User anpassbar (80-95%)

### Interval-Limits
- Minimum: 0.1 Tage (2.4h)
- Maximum: 36500 Tage (100 Jahre)

### TTS
- Web Speech API (kostenlos, offline-fähig)
- Fallback: Google TTS API (bessere Qualität, kostet)

---

## 🐛 Known Issues / TODOs

- [ ] FSRS-Parameter per User anpassen (Phase 9?)
- [ ] Bulk-Import von Vokabeln (CSV/JSON)
- [ ] Vokabel-Editor im Admin-Backend
- [ ] Griechisch-Tastatur-Support (virtuelle Tastatur?)
- [ ] Offline-Sync (später, komplex)

---

## 🐛 Tests - siehe test.md
- [ ] Tests - siehe test.md

**Letztes Update:** 2026-02-15 (Phase 2 abgeschlossen, Phase 1 gestartet)
**Nächster Review:** Nach Phase 1 abgeschlossen
