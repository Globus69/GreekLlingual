# 🚀 Quick Start - Greek Lingua Flashcard System

**Letzte Aktualisierung**: 22.01.2026

---

## ⚡️ 30-Sekunden Start

```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard
npx http-server -p 3000
```

Öffne im Browser: **http://localhost:3000/web/index.html**

---

## 🎯 Sofort Testen

### 1. Dashboard öffnen
- URL: `http://localhost:3000/web/index.html`
- Du siehst 3 neue Buttons im 3×3 Grid:
  - 💪 **Train Weak Words (3)**
  - 🔄 **Review Vocabulary (6)**
  - 📚 **Due Cards Today (5)**

### 2. Flashcards starten
**Klicke auf einen der Buttons:**

#### 💪 Train Weak Words
- Öffnet: `flashcards.html?mode=weak`
- Zeigt: 3 schwierige Karten (ease < 2.3)
- Sortiert: Härteste zuerst
- Test: "Thank you", "Please", "Good morning"

#### 🔄 Review Vocabulary
- Öffnet: `flashcards.html?mode=review`
- Zeigt: Alle 6 Karten
- Sortiert: Schwache → Fällige → Restliche
- Test: Alle Wörter in optimaler Reihenfolge

#### 📚 Due Cards Today
- Öffnet: `flashcards.html?mode=due`
- Zeigt: 5 fällige Karten (dueDate ≤ heute)
- Sortiert: Älteste zuerst
- Test: "Hello", "Thank you", "Please", "Water", "Good morning"

---

## 🎮 Flashcard Bedienung

### Mit der Maus:
1. **Karte anklicken** → Umdrehen
2. **🔊 Audio-Button** → Text-to-Speech abspielen
3. **Rating-Buttons wählen**:
   - 🔵 **Good** → Nächste Wiederholung in ~1-3 Tagen
   - 🔵 **Very Good** → Nächste Wiederholung in ~3-6 Tagen
   - 🟢 **Easy** → Nächste Wiederholung in ~6-14 Tagen

### Mit Tastatur:
- `Leertaste` → Karte umdrehen
- `1` → Good
- `2` → Very Good
- `3` → Easy
- `↑` → Audio abspielen

---

## 📊 Was passiert beim Rating?

**Beispiel: "Thank you" (Ease: 2.0, Interval: 2d)**

### Du klickst "Good":
```javascript
Ease: 2.0 → 2.1 (+0.1)
Interval: 2d → 4d
Due Date: 2026-01-20 → 2026-01-26
```

### Du klickst "Very Good":
```javascript
Ease: 2.0 → 2.2 (+0.2)
Interval: 2d → 5d
Due Date: 2026-01-20 → 2026-01-27
```

### Du klickst "Easy":
```javascript
Ease: 2.0 → 2.3 (+0.3)
Interval: 2d → 6d
Due Date: 2026-01-20 → 2026-01-28
```

**Resultat:** Schwache Karte wird einfacher, erscheint später wieder!

---

## 💾 Persistenz

### LocalStorage (Aktuell)
- Fortschritt wird automatisch gespeichert
- Bleibt nach Browser-Neustart erhalten
- Key: `flashcard_progress`
- Prüfen: `localStorage.getItem('flashcard_progress')`

### Supabase (Nächster Schritt)
1. Schema deployen: `supabase-schema.sql`
2. `.env.local` erstellen:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. In `flashcards-script.js`: `saveCardProgress()` auf Supabase umstellen

---

## 🔍 Debugging

### Browser Console öffnen (F12)

**Erwartete Logs:**
```javascript
📚 Mode: weak
🔢 Cards loaded: 3
🏛️ Greek Flashcards loaded
📚 3 cards ready for review
⌨️ Keyboard shortcuts:
  Space - Flip card
  1/2/3 - Rate (Good/Very Good/Easy)
  ↑ - Play audio
```

**Nach Rating:**
```javascript
Card rated: good
Card: Thank you → Ευχαριστώ
📊 SRS Update: {
  word: "Thank you",
  ease: "2.00 → 2.10",
  interval: "2d → 4d",
  dueDate: "2026-01-20 → 2026-01-26"
}
💾 Progress saved to localStorage
```

---

## 📁 Wichtige Dateien

| Datei | Zweck | Bearbeiten für... |
|-------|-------|-------------------|
| `shared-data.js` | Flashcard-Daten | Neue Vokabeln hinzufügen |
| `flashcards-script.js` | SRS-Logik, Modi-Filter | Algorithmus anpassen |
| `flashcards-style.css` | Design | Farben, Animationen ändern |
| `web/index.html` | Dashboard | Button-Texte, Layout |
| `supabase-schema.sql` | Datenbank | Tabellen erweitern |

---

## 🛠️ Häufige Anpassungen

### 1. Neue Vokabeln hinzufügen
**Datei:** `shared-data.js`

```javascript
{
    english: 'Friend',
    greek: 'Φίλος',
    contextEn: 'A close companion',
    contextGr: 'Ένας στενός σύντροφος',
    audioFront: 'friend-en.mp3',
    audioBack: 'friend-gr.mp3',
    dueDate: '2026-01-22',
    ease: 2.5,
    interval: 1
}
```

### 2. Ease-Schwellenwert ändern (Weak Words)
**Datei:** `flashcards-script.js`, Zeile 139

```javascript
// Standard: ease < 2.3
.filter(card => card.ease < 2.3)

// Ändern zu: ease < 2.5 (mehr schwache Karten)
.filter(card => card.ease < 2.5)
```

### 3. Button-Texte ändern
**Datei:** `web/index.html`, Zeile 701-713

```javascript
weakBtn.innerHTML = `<span>💪</span> Schwache Wörter (${counts.weak})`;
reviewBtn.innerHTML = `<span>🔄</span> Alle Wörter (${counts.review})`;
dueBtn.innerHTML = `<span>📚</span> Fällig (${counts.due})`;
```

### 4. Design-Farben anpassen
**Datei:** `flashcards-style.css`, Zeile 4-22

```css
/* Dark Theme */
--bg-dark: #0f172a;
--accent-blue: #3b82f6;

/* Light Theme */
--bg-dark: #f8fafc;
--accent-blue: #2563eb;
```

---

## 🎯 Testszenarien

### Szenario 1: Alle Modi durchspielen
1. Start: Dashboard → "💪 Train Weak Words"
2. Reviewe alle 3 Karten mit "Very Good"
3. Zurück zum Dashboard
4. Counters sollten aktualisiert sein: **(0)** statt **(3)**

### Szenario 2: LocalStorage testen
1. Reviewe ein paar Karten
2. Schließe den Browser
3. Öffne erneut `http://localhost:3000/web/index.html`
4. Fortschritt sollte erhalten sein

### Szenario 3: Keyboard Shortcuts
1. Öffne eine Flashcard
2. `Space` → Karte dreht sich
3. `1` → Nächste Karte (Good Rating)
4. Wiederhole bis Ende

---

## 🚨 Troubleshooting

### Problem: "No cards to review"
**Lösung:**
```javascript
// In shared-data.js: Setze dueDate auf heute
dueDate: '2026-01-22' // Heute
```

### Problem: Buttons zeigen (0)
**Lösung:**
```javascript
// Prüfe ob shared-data.js geladen ist
console.log(allFlashcards); // Sollte Array mit 6 Karten sein
```

### Problem: Audio funktioniert nicht
**Lösung:**
- Web Speech API benötigt HTTPS oder localhost
- Teste auf `http://localhost:3000` (nicht `file://`)

### Problem: Rating ändert nichts
**Lösung:**
- Öffne Browser Console (F12)
- Prüfe auf JavaScript-Fehler
- Verifiziere localStorage: `localStorage.getItem('flashcard_progress')`

---

## 📚 Weitere Dokumentation

- **INTEGRATION-README.md** → Vollständige Integration Guide
- **FLASHCARD-MODES-README.md** → Modi-System im Detail
- **PART2-IMPLEMENTATION.md** → SM-2 Algorithmus Technische Specs
- **TRANSFER-COMPLETE.md** → Übertragene Dateien & Status

---

**Happy Learning! 🏛️**
