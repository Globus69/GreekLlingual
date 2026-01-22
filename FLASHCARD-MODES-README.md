# Flashcard Modes - Dokumentation

## Übersicht

Das Dashboard bietet jetzt **drei verschiedene Modi** für das Flashcard-Training:

### 1. 💪 Train Weak Words (`?mode=weak`)
- **Zweck**: Trainiert schwierige Vokabeln
- **Filter**: Zeigt nur Karten mit `ease < 2.3`
- **Logik**: Je niedriger der Ease-Wert, desto schwieriger ist die Karte für den Benutzer

### 2. 🔄 Review Vocabulary (`?mode=review`)
- **Zweck**: Vollständige Wiederholung aller Vokabeln
- **Filter**: Zeigt **alle** Karten
- **Logik**: Keine Filterung, alle verfügbaren Flashcards

### 3. 📚 Due Cards Today (`?mode=due`)
- **Zweck**: Zeigt nur heute fällige Karten (Spaced Repetition)
- **Filter**: Zeigt nur Karten mit `dueDate <= heute`
- **Logik**: SRS-basiert (Spaced Repetition System)

---

## Dateistruktur

```
/
├── web/
│   └── index.html              # Dashboard mit 3 Buttons
├── shared-data.js              # Karten-Daten mit SRS-Metadaten
├── flashcards.html             # Flashcard-Komponente
├── flashcards-style.css        # Styling
└── flashcards-script.js        # Logik mit Modus-Unterstützung
```

---

## Verwendung im Dashboard

### Button-Integration (web/index.html)

```html
<!-- Train Weak Words -->
<button class="btn btn-tertiary" id="train-weak-btn" onclick="openFlashcardMode('weak')">
    <span>💪</span> Train Weak Words
</button>

<!-- Review Vocabulary -->
<button class="btn btn-secondary" id="review-vocab-btn" onclick="openFlashcardMode('review')">
    <span>🔄</span> Review Vocabulary
</button>

<!-- Due Cards Today -->
<button class="btn btn-primary" id="due-cards-btn" onclick="openFlashcardMode('due')">
    <span>📚</span> Due Cards Today
</button>
```

### JavaScript-Handler

```javascript
/**
 * Navigiert zur Flashcard-Seite mit Modus-Parameter
 */
function openFlashcardMode(mode) {
    window.location.href = `../flashcards.html?mode=${mode}`;
}

/**
 * Aktualisiert Button-Texte mit Anzahl der Karten
 */
function updateFlashcardButtons() {
    const counts = getCardCounts();

    // Train Weak Words (3)
    document.getElementById('train-weak-btn').innerHTML =
        `<span>💪</span> Train Weak Words (${counts.weak})`;

    // Review Vocabulary (6)
    document.getElementById('review-vocab-btn').innerHTML =
        `<span>🔄</span> Review Vocabulary (${counts.review})`;

    // Due Cards Today (4)
    document.getElementById('due-cards-btn').innerHTML =
        `<span>📚</span> Due Cards Today (${counts.due})`;
}
```

---

## Flashcard-Logik (flashcards-script.js)

### Modus-Erkennung

```javascript
function init() {
    // URL-Parameter auslesen
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'review';

    // Karten basierend auf Modus laden
    vocabulary = getCardsForMode(currentMode);

    // Rest der Initialisierung...
}
```

### Filter-Logik

```javascript
function getCardsForMode(mode) {
    const today = getTodayDateString();

    switch (mode) {
        case 'weak':
            // Schwierige Karten (ease < 2.3)
            return allFlashcards.filter(card => card.ease < 2.3);

        case 'due':
            // Heute fällige Karten
            return allFlashcards.filter(card => card.dueDate <= today);

        case 'review':
        default:
            // Alle Karten
            return allFlashcards;
    }
}
```

---

## Datenstruktur (shared-data.js)

### Karten-Schema

```javascript
{
    english: 'Hello',              // Englisches Wort
    greek: 'Γεια σου',             // Griechisches Wort
    contextEn: 'A common greeting', // Kontext (EN)
    contextGr: 'Μια κοινή χαιρετισμός', // Kontext (GR)
    audioFront: 'hello-en.mp3',    // Audio-Datei (EN)
    audioBack: 'hello-gr.mp3',     // Audio-Datei (GR)
    dueDate: '2026-01-22',         // Fälligkeitsdatum
    ease: 2.5,                     // Schwierigkeitsgrad (1.0 - 3.0)
    interval: 1                    // SRS-Intervall (Tage)
}
```

### Ease-Werte

- **< 2.3**: Schwierige Karte (Weak Word)
- **2.3 - 2.6**: Mittelschwer
- **> 2.6**: Einfache Karte

---

## Beispiel-Flow

### 1. Benutzer klickt "Train Weak Words (3)" im Dashboard

→ Navigiert zu `flashcards.html?mode=weak`

### 2. Flashcard-Seite initialisiert

```javascript
currentMode = 'weak'
vocabulary = [
    { english: 'Thank you', ease: 2.0 },
    { english: 'Please', ease: 2.1 },
    { english: 'Good morning', ease: 1.9 }
]
```

### 3. Benutzer reviewed die 3 schwierigen Karten

- Flip-Animation
- Audio abspielen
- Rating (Good / Very Good / Easy)

### 4. Nach letzter Karte

→ Completion Screen mit "Back to Dashboard"

---

## Features

✅ **Dynamische Button-Anzahlen** im Dashboard
✅ **URL-Parameter Modus-Steuerung** (`?mode=weak/review/due`)
✅ **Automatische Filterung** basierend auf Modus
✅ **"No Cards" Nachricht** wenn keine Karten verfügbar
✅ **Web Speech API** für Audio (TTS)
✅ **Keyboard Shortcuts** (Space, 1/2/3, ↑)
✅ **Smooth Animations** (Flip, Fade, Slide)
✅ **Responsive Design** (Desktop + Mobile)

---

## Nächste Schritte (Optional)

1. **Supabase-Integration**: Karten aus Datenbank laden
2. **SRS-Update**: Ease/Interval nach Rating neu berechnen
3. **LocalStorage**: Offline-Unterstützung
4. **Statistiken**: Tracking von Review-Sessions
5. **Achievements**: Gamification-Elemente

---

## Testing

### Test 1: Train Weak Words
```
URL: flashcards.html?mode=weak
Erwartung: Zeigt 3 Karten mit ease < 2.3
```

### Test 2: Review Vocabulary
```
URL: flashcards.html?mode=review
Erwartung: Zeigt alle 6 Karten
```

### Test 3: Due Cards Today
```
URL: flashcards.html?mode=due
Erwartung: Zeigt 5 Karten mit dueDate <= heute
```

### Test 4: Keine Karten verfügbar
```
Szenario: Alle weak words haben ease >= 2.3
Erwartung: "No cards to review!" Nachricht
```

---

**Erstellt**: 2026-01-22
**Version**: 1.0
**Status**: ✅ Production Ready
