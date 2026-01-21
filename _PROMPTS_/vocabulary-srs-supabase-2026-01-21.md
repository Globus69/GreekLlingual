# Vokabeln-Modul: Supabase + SRS Implementation

**Datum**: 21. Januar 2026  
**Status**: ✅ Implementiert (Legacy Web Prototype)  
**Dateien**: `web/script.js`, `web/index.html`, `web/style.css`

## Anforderungen

Implementiere das Vokabeln-Modul vollständig mit Supabase + SRS (Spaced Repetition System).

### Funktionale Anforderungen

1. **Dynamisches Laden von Vokabeln**
   - Quelle: Supabase `learning_items` Tabelle
   - Filter: `type = 'vocabulary'`
   - Sortierung: `ORDER BY next_review ASC`
   - Limit: 20 Karten pro Session

2. **Flashcard-Darstellung**
   - Vorderseite: Englisches Wort + Beispielsatz
   - Rückseite: Griechisches Wort + Beispielsatz
   - 3D-Flip-Animation (CSS `rotateY`)

3. **SRS-Bewertungssystem**
   - **Schwer**: Interval = 1 Tag (Reset)
   - **Gut**: Interval × 2.5
   - **Sehr gut**: Interval × 3
   - Start-Interval für neue Karten: 1 Tag

4. **Progress Tracking**
   - Anzeige: "X von Y heute fällig"
   - Upsert in `student_progress` Tabelle
   - Felder: `correct_count`, `attempts`, `last_attempt`, `next_review`

5. **Navigation**
   - Zurück-Button zum Dashboard
   - Nahtlose View-Transitions

## Implementierung

### 1. Supabase-Anbindung

```javascript
// Globale Supabase-Client-Initialisierung
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 2. Vokabeln laden

```javascript
async function loadVocabulary() {
    const { data, error } = await window.supabase
        .from('learning_items')
        .select('*')
        .eq('type', 'vocabulary')
        .order('next_review', { ascending: true })
        .limit(20);
    
    if (error) {
        console.error('Error loading vocabulary:', error);
        return [];
    }
    
    return data;
}
```

### 3. SRS-Logik

```javascript
function calculateNextReview(currentInterval, rating) {
    let newInterval;
    
    switch(rating) {
        case 1: // Schwer
            newInterval = 1;
            break;
        case 2.5: // Gut
            newInterval = currentInterval * 2.5;
            break;
        case 3: // Sehr gut
            newInterval = currentInterval * 3;
            break;
        default:
            newInterval = 1;
    }
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.round(newInterval));
    
    return {
        interval: newInterval,
        next_review: nextReview.toISOString()
    };
}
```

### 4. Progress Update

```javascript
async function updateProgress(itemId, rating) {
    const currentProgress = await getProgress(itemId);
    const currentInterval = currentProgress?.interval || 1;
    
    const { interval, next_review } = calculateNextReview(currentInterval, rating);
    
    const { error } = await window.supabase
        .from('student_progress')
        .upsert({
            student_id: 1, // Hardcoded für Demo
            item_id: itemId,
            correct_count: (currentProgress?.correct_count || 0) + (rating > 1 ? 1 : 0),
            attempts: (currentProgress?.attempts || 0) + 1,
            last_attempt: new Date().toISOString(),
            next_review: next_review,
            interval: interval
        });
    
    if (error) {
        console.error('Error updating progress:', error);
    }
}
```

### 5. UI-Integration

**HTML-Struktur** (`web/index.html`):
```html
<div id="vokabeln-view" class="view">
    <div class="module-header debug-flex">
        <button class="back-btn" onclick="openDashboard()">← Dashboard</button>
        <div class="progress-container" id="vocab-progress">Lade Daten...</div>
        <div style="font-weight:600">Vocabulary Flashcards</div>
    </div>
    <div class="module-content debug-flex">
        <div class="card-area debug-flex">
            <div class="card-wrapper">
                <div class="card" id="flashcard" onclick="flipCard()">
                    <div class="card-face card-front">
                        <span class="lang-label">ENGLISH</span>
                        <div class="main-word" id="word-front">...</div>
                        <div class="example-sentence" id="example-front">...</div>
                        <div class="flip-hint">Click to flip</div>
                    </div>
                    <div class="card-face card-back">
                        <span class="lang-label">ΕΛΛΗΝΙΚΑ</span>
                        <div class="main-word" id="word-back">...</div>
                        <div class="example-sentence" id="example-back">...</div>
                    </div>
                </div>

                <div class="rating-bar debug-flex">
                    <button class="control-btn outline" onclick="rateVocab(1)">🔴 Schwer</button>
                    <button class="control-btn primary" onclick="rateVocab(2.5)">🟡 Gut</button>
                    <button class="control-btn primary" style="background:#34C759;" onclick="rateVocab(3)">🟢 Sehr gut</button>
                </div>
            </div>
        </div>
    </div>
</div>
```

**CSS-Ergänzungen** (`web/style.css`):
```css
.progress-container {
    padding: 10px 24px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-sub);
}

.rating-bar {
    display: none;
    gap: 16px;
    margin-top: 20px;
    animation: fadeIn 0.3s ease;
}

.card.flipped ~ .rating-bar {
    display: flex;
}
```

## Datenbank-Schema

### `learning_items` Tabelle
```sql
CREATE TABLE learning_items (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    english TEXT NOT NULL,
    greek TEXT NOT NULL,
    example_en TEXT,
    example_gr TEXT,
    audio_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### `student_progress` Tabelle
```sql
CREATE TABLE student_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    correct_count INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP,
    next_review TIMESTAMP,
    interval NUMERIC DEFAULT 1,
    UNIQUE(student_id, item_id)
);
```

## Verifikation

1. **Funktionalität testen**:
   - Öffne `http://localhost:3000/` (Legacy Prototype)
   - Klicke auf "Vokabeln" Tile
   - Prüfe, ob Karten geladen werden
   - Teste Flip-Animation
   - Bewerte Karten und prüfe Progress-Update

2. **Supabase-Konfiguration**:
   - Ersetze Platzhalter in `web/script.js` mit echten Credentials
   - Führe `supabase/web_prototype_setup.sql` aus

## Status & Nächste Schritte

✅ **Implementiert**:
- Dynamisches Laden von Vokabeln
- Flip-Card-Animation
- SRS-Bewertungssystem
- Progress Tracking
- UI-Integration

🔄 **Offen**:
- Migration zu Next.js (`src/app/vokabeln/page.tsx`)
- Audio-Integration
- Erweiterte SRS-Algorithmen (FSRS)
- Offline-Modus
- Statistik-Dashboard

## Referenzen

- Implementierung: `web/script.js` (Zeilen 1-244)
- UI: `web/index.html` (Zeilen 445-482)
- Styles: `web/style.css` (Zeilen 849-920)
- Datenbank: `supabase/web_prototype_setup.sql`
