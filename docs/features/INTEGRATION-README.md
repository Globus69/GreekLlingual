# 🏛️ Greek Flashcards - Integration Guide

## 📁 Verzeichnisstruktur

```
/pedantic-joliot/
├── web/
│   └── index.html              # Dashboard (Hauptseite)
│
├── flashcards.html             # Flashcard-Komponente (Premium UI)
├── flashcards-style.css        # Styling (Glassmorphism, Dark Mode)
├── flashcards-script.js        # Logik (SRS, Modi, LocalStorage)
│
├── shared-data.js              # Geteilte Karten-Daten
│
├── FLASHCARD-MODES-README.md   # Modi-Dokumentation
├── PART2-IMPLEMENTATION.md     # Technische Details
└── INTEGRATION-README.md       # Diese Datei
```

---

## 🚀 Quick Start

### 1. **Lokal testen**

```bash
# Server starten (z.B. mit Node)
cd /pedantic-joliot
npx http-server -p 3000

# Browser öffnen
open http://localhost:3000/web/index.html
```

### 2. **Dashboard öffnen**

```
http://localhost:3000/web/index.html
```

**Erwartung:**
- Drei Buttons sichtbar:
  - 💪 Train Weak Words (3)
  - 🔄 Review Vocabulary (6)
  - 📚 Due Cards Today (5)

### 3. **Flashcards testen**

**Option A: Via Dashboard-Button**
- Klick auf "Due Cards Today (5)"
- → Navigiert zu `flashcards.html?mode=due`

**Option B: Direkt in URL**
```
http://localhost:3000/flashcards.html?mode=weak
http://localhost:3000/flashcards.html?mode=review
http://localhost:3000/flashcards.html?mode=due
```

---

## 🎯 Features im Detail

### **1. Dashboard-Integration** (`web/index.html`)

```javascript
// Drei Modi-Buttons
<button id="train-weak-btn" onclick="openFlashcardMode('weak')">
<button id="review-vocab-btn" onclick="openFlashcardMode('review')">
<button id="due-cards-btn" onclick="openFlashcardMode('due')">

// Navigation
function openFlashcardMode(mode) {
    window.location.href = `../flashcards.html?mode=${mode}`;
}

// Dynamische Counts
function updateFlashcardButtons() {
    const counts = getCardCounts();
    // Updates: "Due Cards Today (5)"
}
```

### **2. Flashcard Modi** (`flashcards-script.js`)

```javascript
// URL-Parameter auslesen
const urlParams = new URLSearchParams(window.location.search);
currentMode = urlParams.get('mode') || 'review';

// Modi:
// - 'weak':   ease < 2.3 (schwierige Karten)
// - 'review': alle Karten, priorisiert
// - 'due':    dueDate <= heute (SRS-basiert)
```

### **3. SRS-Update** (SM-2 Algorithm)

```javascript
// Nach jeder Bewertung
function updateCardSRS(card, rating) {
    // Berechnet: ease, interval, dueDate
    // Speichert: localStorage
    // Logged: console.log
}
```

### **4. LocalStorage Persistence**

```javascript
// Speichern
localStorage.setItem('flashcard_progress', JSON.stringify({
    'Hello': { ease: 2.5, interval: 1, dueDate: '2026-01-23' }
}));

// Laden (automatisch beim Start)
loadCardProgress();
```

---

## 🧪 Testing-Szenarien

### **Test 1: Dashboard → Flashcards Navigation**

```
1. Öffne: http://localhost:3000/web/index.html
2. Klicke: "Train Weak Words (3)"
3. Erwartung:
   - URL: flashcards.html?mode=weak
   - Header: "💪 Train Weak Words"
   - Cards: 3 (Thank you, Please, Good morning)
```

### **Test 2: SRS-Update**

```
1. Öffne: flashcards.html?mode=due
2. Review erste Karte
3. Rate: "Very Good"
4. Console-Log prüfen:
   📊 SRS Update: {
       ease: '2.0 → 2.1',
       interval: '2d → 4d',
       dueDate: '2026-01-20 → 2026-01-26'
   }
   💾 Progress saved to localStorage
```

### **Test 3: LocalStorage Persistence**

```
1. Review mehrere Karten
2. Browser schließen
3. Browser neu öffnen
4. Flashcards erneut öffnen
5. Erwartung: Progress wiederhergestellt
```

### **Test 4: "No Cards" Fallback**

```
1. Alle weak words auf ease >= 2.3 setzen
2. Öffne: flashcards.html?mode=weak
3. Erwartung:
   - "🎉 No cards to review!"
   - "Back to Dashboard" Button
```

### **Test 5: Keyboard Shortcuts**

```
- Space:   Flip card
- 1/2/3:   Rate (Good/Very Good/Easy)
- ↑:       Play audio
```

---

## 🔧 Antigravity-Integration

### **Schritt 1: Dateien kopieren**

```bash
# In Antigravity-Projekt
mkdir -p public/flashcards
cp flashcards.html public/flashcards/
cp flashcards-style.css public/flashcards/
cp flashcards-script.js public/flashcards/
cp shared-data.js public/
```

### **Schritt 2: Pfade anpassen**

```javascript
// flashcards-script.js
// Back to Dashboard Button
backToDashboardBtn.addEventListener('click', () => {
    window.location.href = '/dashboard'; // Antigravity-Route
});

// shared-data.js einbinden
<script src="/shared-data.js"></script>
<script src="/flashcards/flashcards-script.js"></script>
```

### **Schritt 3: Dashboard-Button hinzufügen**

```html
<!-- In Antigravity Dashboard -->
<button onclick="window.location.href='/flashcards/flashcards.html?mode=due'">
    📚 Due Cards Today (5)
</button>
```

### **Schritt 4: API-Integration (später)**

```javascript
// shared-data.js → Supabase ersetzen
async function loadFlashcardsFromSupabase() {
    const { data, error } = await supabase
        .from('flashcards')
        .select('*');

    return data;
}

// saveCardProgress → Supabase
async function saveCardProgressToSupabase(card) {
    await supabase
        .from('flashcards')
        .update({ ease, interval, dueDate })
        .eq('id', card.id);
}
```

---

## 📊 Datenstruktur

### **Karten-Schema** (`shared-data.js`)

```javascript
{
    english: 'Hello',              // Englisches Wort
    greek: 'Γεια σου',             // Griechisches Wort
    contextEn: 'A common greeting', // Kontext (EN)
    contextGr: 'Μια κοινή χαιρετισμός', // Kontext (GR)
    audioFront: 'hello-en.mp3',    // Audio-Datei (EN)
    audioBack: 'hello-gr.mp3',     // Audio-Datei (GR)

    // SRS-Felder
    dueDate: '2026-01-22',         // Fälligkeitsdatum (YYYY-MM-DD)
    ease: 2.5,                     // Schwierigkeitsgrad (1.3 - 3.0)
    interval: 1,                   // Tage bis nächste Review

    // Optional (für Erweiterungen)
    id: 'uuid-xxx',                // Unique ID
    userId: 'user-123',            // User-ID
    reviewsCount: 0,               // Anzahl Reviews
    correctCount: 0,               // Anzahl korrekt
    lastReviewed: '2026-01-22T10:30:00Z' // Timestamp
}
```

### **LocalStorage-Schema**

```javascript
{
    "flashcard_progress": {
        "Hello": {
            "ease": 2.5,
            "interval": 1,
            "dueDate": "2026-01-23",
            "lastReviewed": "2026-01-22T10:30:00Z"
        },
        "Thank you": { ... }
    }
}
```

---

## 🎨 UI/UX Features

### **Glassmorphism Design**
```css
background: rgba(30, 41, 59, 0.6);
backdrop-filter: blur(16px) saturate(150%);
border: 1px solid rgba(148, 163, 184, 0.12);
```

### **Smooth Animations**
- Mode Header: `fadeInDown` (0.6s)
- Card Flip: `rotateY(180deg)` (0.8s)
- Card Transition: `fadeSlideOut/In` (0.5s)
- Progress Bar: `width` transition (0.6s)

### **Responsive Breakpoints**
```css
@media (max-width: 768px) { /* Tablet */ }
@media (max-width: 480px) { /* Mobile */ }
```

---

## 📈 Erweiterungen (Optional)

### **1. Statistik-Dashboard**

```javascript
// In completion screen
function showDetailedStats() {
    const stats = {
        totalReviews: cardsReviewed,
        averageEase: calculateAverageEase(),
        weakWords: vocabulary.filter(c => c.ease < 2.3).length,
        streak: calculateStreak()
    };
}
```

### **2. Review-History**

```javascript
// LocalStorage
const reviewHistory = {
    '2026-01-22': {
        cardsReviewed: 5,
        duration: 180, // seconds
        averageRating: 'very-good'
    }
};
```

### **3. Custom SRS-Settings**

```javascript
// User-Einstellungen
const srsSettings = {
    easeMin: 1.3,
    easeMax: 3.0,
    intervalMultiplier: 2.0,
    graduatingInterval: 6
};
```

### **4. Audio-Dateien**

```javascript
// Ersetze Web Speech API
function playAudio(audioFile) {
    const audio = new Audio(`/audio/${audioFile}`);
    audio.play();
}
```

---

## 🐛 Debugging

### **Console Logs aktiviert**

```javascript
// Bei Init
console.log(`📚 Mode: weak`);
console.log(`🔢 Cards loaded: 3`);

// Bei Rating
console.log(`📊 SRS Update: { ... }`);
console.log(`💾 Progress saved to localStorage`);

// Bei Load
console.log(`📂 Progress loaded from localStorage`);
```

### **LocalStorage inspizieren**

```javascript
// Browser DevTools → Application → Local Storage
localStorage.getItem('flashcard_progress');
```

### **Common Issues**

```
Issue: "allFlashcards is not defined"
Fix: Stelle sicher, dass shared-data.js VOR script.js geladen wird

Issue: "No cards to review" trotz due cards
Fix: Prüfe Datum in shared-data.js (dueDate muss <= heute sein)

Issue: Progress wird nicht gespeichert
Fix: Prüfe Browser-Console auf localStorage-Fehler
```

---

## 📝 Checkliste vor Deployment

- [ ] Alle Pfade relativ (keine absolute URLs)
- [ ] LocalStorage funktioniert
- [ ] Alle drei Modi getestet
- [ ] Responsive auf Mobile getestet
- [ ] Console-Logs in Production entfernen (optional)
- [ ] Audio-Dateien hochgeladen (wenn vorhanden)
- [ ] Supabase-Integration vorbereitet
- [ ] Analytics-Tracking hinzugefügt (optional)

---

## 🎓 Best Practices

### **Modularer Code**
```javascript
// Funktionen sind wiederverwendbar
getCardsForMode(mode);
updateCardSRS(card, rating);
saveCardProgress(card);
```

### **Error Handling**
```javascript
try {
    loadCardProgress();
} catch (e) {
    console.warn('Failed to load progress:', e);
}
```

### **Performance**
```javascript
// Smooth animations mit CSS
transition: transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);

// Debouncing bei Input
setTimeout(() => checkAnswer(), 300);
```

---

## 🌟 User Experience

### **Beruhigendes Design**
- Dunkler Hintergrund (Augen schonen)
- Sanfte Farben (keine grelle Signale)
- Smooth Animationen (kein Flackern)

### **Klare Navigation**
- Header zeigt aktuellen Modus
- Progress Bar zeigt Fortschritt
- "Back to Dashboard" immer sichtbar

### **Motivierendes Feedback**
- "🎉 Excellent Work!" nach Session
- Console-Logs für Lernfortschritt
- Dynamische Counts im Dashboard

---

## 📚 Weitere Dokumentation

- `FLASHCARD-MODES-README.md` - Modi-Details
- `PART2-IMPLEMENTATION.md` - Technische Specs
- `shared-data.js` - Daten-Schema (inline kommentiert)

---

## 🤝 Support

Bei Fragen oder Problemen:
1. Console-Logs prüfen
2. LocalStorage inspizieren
3. README.md erneut lesen
4. Code-Kommentare durchgehen

---

**Version:** 3.0 Final
**Status:** ✅ Production Ready
**Datum:** 2026-01-22
**Autor:** Claude (Sonnet 4.5)

---

*Viel Erfolg beim Griechisch-Lernen! 🏛️ Καλή τύχη!*
