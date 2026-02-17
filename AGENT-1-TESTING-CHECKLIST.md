# 🧪 Practice Modes Testing Checklist (für USER)

**Agent:** Agent 1 (Testing Specialist)
**Branch:** agent-1-testing
**Datum:** 17. Februar 2026

---

## 📝 ANLEITUNG

Bitte führe die folgenden Tests durch und notiere die Ergebnisse.
Nach jedem Test: ✅ bei Erfolg, ❌ bei Fehler, 🟡 bei teilweise funktionierend.

---

## TEST 1: Practice Modes Page

### 1.1 Page öffnen
```
URL: http://localhost:3000/practice-modes
```

- [ ] **Page lädt ohne Fehler?**
- [ ] **Header sichtbar:** "🎮 Practice Modes"
- [ ] **"Back to Dashboard" Link funktioniert?**
- [ ] **Info-Card sichtbar:** "How Practice Modes Work"
- [ ] **Practice Modes Section sichtbar?**
- [ ] **User Info angezeigt?** (Name, Level)

**Console-Errors (F12 → Console):**
```
[Notiere hier alle Errors/Warnings]
```

---

## TEST 2: Matching Game 🎮

### 2.1 Dialog öffnen
- [ ] **Item mit "Matching" Button gefunden?** (threshold=0, unlocked)
- [ ] **Button klicken → Dialog öffnet?**
- [ ] **6 Karten-Paare angezeigt?** (Greek + English)

### 2.2 Spiel durchführen
- [ ] **Karten klicken funktioniert?**
- [ ] **Shake-Animation bei Fehler?**
- [ ] **Matched pairs verschwinden/disabled?**
- [ ] **Score wird live aktualisiert?**
- [ ] **Timer läuft?** (falls aktiviert)

### 2.3 Result Summary
- [ ] **Result Summary erscheint nach allen Matches?**
- [ ] **Score angezeigt?** (0-100)
- [ ] **Zeit angezeigt?** (MM:SS)
- [ ] **FSRS Rating Chip?** (1-4, mit Farbe + Emoji)
- [ ] **Mistakes count korrekt?**
- [ ] **"Try Again" Button funktioniert?**
- [ ] **"Close" Button schließt Dialog?**

**Notizen:**
```
Score: ___
Zeit: ___
FSRS Rating: ___
Mistakes: ___
Besonderheiten: ___
```

---

## TEST 3: Multiple Choice Quiz 🎯

### 3.1 Dialog öffnen
- [ ] **Item mit "Quiz" Button gefunden?**
- [ ] **Button klicken → Dialog öffnet?**
- [ ] **4 Optionen angezeigt?**

### 3.2 Quiz durchführen
- [ ] **Nur 1 korrekte Antwort?**
- [ ] **Timer countdown funktioniert?**
- [ ] **Klick auf Option → Instant Feedback?** (grün/rot)
- [ ] **Auto-advance nach Feedback?**
- [ ] **Fragen-Counter angezeigt?** (z.B. "3/5")

### 3.3 Result Summary
- [ ] **Result Summary am Ende?**
- [ ] **Score korrekt?**
- [ ] **FSRS Rating angezeigt?**

**Notizen:**
```
Score: ___
Zeit: ___
FSRS Rating: ___
Besonderheiten: ___
```

---

## TEST 4: Write Input Practice ✍️

### 4.1 Dialog öffnen
- [ ] **Item mit "Write" Button gefunden?**
- [ ] **Button klicken → Dialog öffnet?**
- [ ] **Text-Input-Feld angezeigt?**

### 4.2 Input testen
- [ ] **Input-Feld fokussiert?**
- [ ] **Greek text eingeben möglich?**
- [ ] **Exact match → Success ✅?**
- [ ] **Close match → "Very close!" ⚠️?** (lenient mode)
- [ ] **Wrong answer → Try again ❌?**
- [ ] **Max attempts tracking?** (z.B. "2/3")

### 4.3 Result Summary
- [ ] **Result Summary am Ende?**
- [ ] **Correct answer angezeigt?** (falls max attempts erreicht)

**Notizen:**
```
Score: ___
Zeit: ___
FSRS Rating: ___
Attempts: ___
Besonderheiten: ___
```

---

## TEST 5: Database Verification 🗄️

### 5.1 practice_attempts Table

**In Supabase SQL Editor ausführen:**
```sql
SELECT
  id,
  user_id,
  item_id,
  mode_type,
  score,
  time_taken,
  fsrs_rating,
  created_at
FROM practice_attempts
ORDER BY created_at DESC
LIMIT 10;
```

- [ ] **Neue Einträge für gespielte Games vorhanden?**
- [ ] **`mode_type` korrekt?** (matching, multiple_choice, write_input)
- [ ] **`score` zwischen 0-100?**
- [ ] **`time_taken` in Sekunden?**
- [ ] **`fsrs_rating` zwischen 1-4?**
- [ ] **`user_id` und `item_id` korrekt?**

**Anzahl gefundener Einträge:** ___

**Screenshots/Ergebnisse:**
```
[Paste SQL results here]
```

---

### 5.2 FSRS Integration Check

**In Supabase SQL Editor:**
```sql
SELECT
  item_id,
  student_id,
  fsrs_reps,
  fsrs_stability,
  fsrs_difficulty,
  fsrs_due,
  updated_at
FROM student_progress
WHERE student_id = '<YOUR_USER_ID>'
ORDER BY updated_at DESC
LIMIT 10;
```

- [ ] **`fsrs_reps` inkrementiert?**
- [ ] **`fsrs_stability` aktualisiert?**
- [ ] **`fsrs_due` Datum gesetzt?**

**Screenshots/Ergebnisse:**
```
[Paste SQL results here]
```

---

## 🐛 BUGS GEFUNDEN

### Bug #1:
- **Schwere:** KRITISCH / HOCH / MITTEL / NIEDRIG
- **Komponente:** [z.B. matching-game.tsx]
- **Beschreibung:** [Details]
- **Reproduce:**
  1. [Schritt 1]
  2. [Schritt 2]
- **Console Error:**
  ```
  [Error-Log]
  ```

### Bug #2:
[Weitere Bugs hier...]

---

## ✅ ZUSAMMENFASSUNG

**Tests durchgeführt:** ___ / 15
**Tests bestanden:** ___ / 15
**Tests fehlgeschlagen:** ___ / 15

**Kritische Bugs:** ___
**Hohe Bugs:** ___
**Mittlere Bugs:** ___

**Gesamt-Status:** ✅ PASS / ⚠️ PARTIAL PASS / ❌ FAIL

**Notizen:**
```
[Deine zusätzlichen Beobachtungen]
```

---

## 📬 NÄCHSTE SCHRITTE

1. **Diese Checklist ausfüllen**
2. **Screenshots von Bugs machen** (falls vorhanden)
3. **Agent 1 informieren:** "Tests abgeschlossen, siehe AGENT-1-TESTING-CHECKLIST.md"
4. **Agent 1 erstellt Test-Report**

---

**Viel Erfolg beim Testing! 🧪**
