# 🔗 Supabase Setup Guide - Greek Lingua Dashboard

**Datum**: 22.01.2026
**Version**: 2.0 mit Flashcard Integration

---

## 📋 Überblick

Diese Anleitung erklärt, wie du Supabase mit deinem Greek Lingua Dashboard verbindest:

1. **Multi-Role System** (Admin, Teacher, Student)
2. **Flashcard Progress Tracking** (SRS-Algorithmus)
3. **Dynamic Button Counts** im Dashboard
4. **Row Level Security** (RLS)

---

## 🚀 Quick Start (5 Minuten)

### 1. Supabase-Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Klicke "New Project"
3. Wähle:
   - **Name**: `GreekLingua`
   - **Database Password**: Sicheres Passwort (speichern!)
   - **Region**: Nächstgelegene Region
4. Warte ~2 Minuten auf Projekt-Setup

### 2. Schema deployen

1. Öffne Supabase Dashboard → **SQL Editor**
2. Klicke **"New Query"**
3. Kopiere den **kompletten Inhalt** von `supabase-schema.sql`
4. Füge ihn ein und klicke **"Run"**
5. ✅ Verifizierung: Du solltest sehen:
   ```
   profiles
   student_profiles
   content_sets
   deck_assignments
   flashcard_progress
   ```

### 3. API Keys holen

1. Supabase Dashboard → **Settings** → **API**
2. Kopiere:
   - **Project URL** (z.B. `https://abcdefgh.supabase.co`)
   - **anon public** Key

### 4. Dashboard konfigurieren

**Datei**: `web/index.html` (Zeile 540-541)

```javascript
// ERSETZE DIESE ZEILEN:
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// MIT DEINEN KEYS:
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Datei**: `flashcards-script.js` (Zeile 4-5)

```javascript
// ERSETZE DIESE ZEILEN:
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// MIT DEINEN KEYS:
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 5. Teste die Integration

```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard
npx http-server -p 8080
open http://localhost:8080/web/index.html
```

**Browser Console öffnen (F12):**

Erwartete Logs:
```javascript
✅ Supabase initialized
👤 Current user: user@example.com (oder 'Not logged in')
📊 Card counts from Supabase: { weak: 0, due: 0, total: 0 }
🔄 Flashcard buttons updated: { weak: 0, review: 0, due: 0, total: 0 }
```

---

## 📊 Datenbank-Tabellen

### 1. `profiles`
**Zweck**: Basis-Profile für alle User (Admin, Teacher, Student)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | User ID (von auth.users) |
| role | TEXT | 'admin', 'teacher', 'student' |
| display_name | TEXT | Anzeigename |
| access_expires_at | TIMESTAMPTZ | Ablaufdatum (NULL = unbegrenzt) |
| created_at | TIMESTAMPTZ | Erstellungsdatum |
| updated_at | TIMESTAMPTZ | Letzte Aktualisierung |

### 2. `student_profiles`
**Zweck**: Schüler-spezifische Daten (Level, Statistiken)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | References profiles(id) |
| current_level | TEXT | A1, A2, B1, B2, C1, C2 |
| total_cards_reviewed | INTEGER | Gesamt reviewte Karten |
| total_study_time_minutes | INTEGER | Lernzeit in Minuten |
| streak_days | INTEGER | Tagesstreak |
| last_active_at | TIMESTAMPTZ | Letzte Aktivität |

### 3. `content_sets`
**Zweck**: Lern-Inhalte / Decks (von Admins/Teachers erstellt)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Deck ID |
| name | TEXT | Deck-Name |
| description | TEXT | Beschreibung |
| level | TEXT | A1, A2, B1, B2, C1, C2 |
| is_active | BOOLEAN | Aktiviert/Deaktiviert |
| created_by | UUID | Ersteller (Admin/Teacher) |

### 4. `deck_assignments`
**Zweck**: Zuweisung von Decks zu Schülern (zeitlich begrenzt)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Assignment ID |
| student_id | UUID | Schüler ID |
| deck_id | UUID | Deck ID |
| assigned_at | TIMESTAMPTZ | Zuweisungsdatum |
| expires_at | TIMESTAMPTZ | Ablaufdatum (NULL = unbegrenzt) |
| assigned_by | UUID | Zuweiser (Admin/Teacher) |

### 5. `flashcard_progress` ⭐ **NEU**
**Zweck**: Individueller Flashcard-Fortschritt (SRS-Daten)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Progress ID |
| user_id | UUID | User ID |
| word | TEXT | Englisches Wort (unique key) |
| english_word | TEXT | Englisches Wort |
| greek_word | TEXT | Griechisches Wort |
| context_en | TEXT | Englischer Kontext |
| context_gr | TEXT | Griechischer Kontext |
| ease | NUMERIC(3,2) | Ease Factor (1.3 - 3.0) |
| interval | INTEGER | Tage bis nächster Review |
| due_date | DATE | Fälligkeitsdatum |
| last_reviewed | TIMESTAMPTZ | Letzte Review |
| total_reviews | INTEGER | Anzahl Reviews |

**Unique Constraint**: `(user_id, word)` → Ein User kann jedes Wort nur einmal haben

---

## 🔐 Row Level Security (RLS)

### Profiles
- ✅ **User**: Nur eigenes Profil sehen/bearbeiten
- ✅ **Admin**: Alle Profile sehen/bearbeiten/löschen

### Student Profiles
- ✅ **Student**: Nur eigenes Profil sehen/bearbeiten
- ✅ **Admin/Teacher**: Alle Profile sehen
- ✅ **Admin**: Alle Profile erstellen/bearbeiten

### Content Sets
- ✅ **Alle User**: Content Sets sehen
- ✅ **Admin/Teacher**: Content Sets erstellen/bearbeiten
- ✅ **Admin**: Content Sets löschen

### Deck Assignments
- ✅ **Student**: Nur eigene Zuweisungen sehen
- ✅ **Admin/Teacher**: Alle Zuweisungen sehen/erstellen/bearbeiten
- ✅ **Admin**: Zuweisungen löschen

### Flashcard Progress ⭐
- ✅ **User**: Nur eigenen Fortschritt sehen/erstellen/bearbeiten/löschen
- ✅ **Admin/Teacher**: Allen Fortschritt sehen (Read-Only)

---

## 🎯 Workflow: User Registration → Flashcards

### 1. Neuer User registriert sich

**Automatisch via Trigger** (`handle_new_user()`):
```sql
-- Trigger erstellt automatisch:
INSERT INTO profiles (id, role, display_name)
VALUES (NEW.id, 'student', email);

INSERT INTO student_profiles (id)
VALUES (NEW.id);
```

### 2. User loggt sich ein

**Dashboard lädt** (`web/index.html`):
```javascript
const { data: { user } } = await supabase.auth.getUser();
currentUser = user;
```

### 3. Button Counts werden geladen

**Supabase Query**:
```javascript
// Weak cards (ease < 2.3)
const { count } = await supabase
    .from('flashcard_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .lt('ease', 2.3);
```

### 4. User klickt "Train Weak Words"

**Navigation**:
```javascript
window.location.href = '../flashcards.html?mode=weak';
```

### 5. Flashcards laden

**Supabase Query**:
```javascript
const { data } = await supabase
    .from('flashcard_progress')
    .select('*')
    .eq('user_id', currentUser.id)
    .lt('ease', 2.3)
    .order('ease', { ascending: true });
```

### 6. User bewertet Karte

**SRS Update + Supabase Save**:
```javascript
// SM-2 Algorithm
newEase = 2.1; // Berechnet basierend auf Rating
newInterval = 4; // Tage
newDueDate = '2026-01-26';

// Save to Supabase
await supabase
    .from('flashcard_progress')
    .upsert({
        user_id: user.id,
        word: 'Thank you',
        ease: 2.1,
        interval: 4,
        due_date: '2026-01-26',
        last_reviewed: new Date().toISOString()
    }, { onConflict: 'user_id,word' });
```

---

## 🧪 Testing

### 1. Test Flashcard Progress Insertion

**Supabase SQL Editor**:
```sql
-- Manuell einen Fortschritt eintragen (ersetze USER_ID)
INSERT INTO flashcard_progress (
    user_id,
    word,
    english_word,
    greek_word,
    context_en,
    context_gr,
    ease,
    interval,
    due_date
) VALUES (
    'YOUR_USER_ID', -- aus auth.users
    'Hello',
    'Hello',
    'Γεια σου',
    'A common greeting',
    'Μια κοινή χαιρετισμός',
    2.5,
    1,
    CURRENT_DATE
);
```

### 2. Test Button Counts

**Browser Console**:
```javascript
// Check counts
const counts = await getCardCounts();
console.log(counts);
// Expected: { weak: 0, review: 1, due: 1, total: 1 }
```

### 3. Test Flashcard Review

1. Öffne `flashcards.html?mode=review`
2. Bewerte Karte mit "Good"
3. **Browser Console** sollte zeigen:
   ```javascript
   💾 Progress saved to Supabase
   📊 SRS Update: { ... }
   ```
4. **Supabase Dashboard** → Table Editor → `flashcard_progress`
5. Prüfe ob `ease`, `interval`, `due_date` aktualisiert wurden

---

## 🔧 Troubleshooting

### Problem: "Supabase not configured"
**Lösung:**
```javascript
// In web/index.html und flashcards-script.js:
// Ersetze SUPABASE_URL und SUPABASE_ANON_KEY mit echten Werten
```

### Problem: "RLS policy violation"
**Lösung:**
```sql
-- Prüfe ob User authentifiziert ist:
SELECT auth.uid(); -- Sollte UUID zurückgeben

-- Prüfe RLS Policies:
SELECT * FROM pg_policies WHERE tablename = 'flashcard_progress';
```

### Problem: "User not logged in"
**Lösung:**
1. Supabase Dashboard → **Authentication** → **Users**
2. Erstelle Test-User (Email + Password)
3. In App einloggen:
   ```javascript
   await supabase.auth.signInWithPassword({
       email: 'test@example.com',
       password: 'password123'
   });
   ```

### Problem: Button Counts zeigen 0
**Lösung:**
1. Prüfe ob User eingeloggt: `console.log(currentUser)`
2. Prüfe ob Daten existieren:
   ```sql
   SELECT * FROM flashcard_progress WHERE user_id = 'YOUR_USER_ID';
   ```
3. Füge Test-Daten hinzu (siehe Test #1)

---

## 📚 Migration: LocalStorage → Supabase

Wenn du bereits LocalStorage-Daten hast:

```javascript
// In Browser Console ausführen:
async function migrateToSupabase() {
    const progressData = JSON.parse(localStorage.getItem('flashcard_progress') || '{}');
    const user = (await supabase.auth.getUser()).data.user;

    for (const [word, progress] of Object.entries(progressData)) {
        await supabase.from('flashcard_progress').upsert({
            user_id: user.id,
            word: word,
            english_word: word,
            greek_word: '', // TODO: Add from shared-data.js
            ease: progress.ease,
            interval: progress.interval,
            due_date: progress.dueDate,
            last_reviewed: progress.lastReviewed
        }, { onConflict: 'user_id,word' });
    }

    console.log('✅ Migration complete!');
}

await migrateToSupabase();
```

---

## 🎯 Nächste Schritte

### 1. Admin Panel erstellen
- User-Verwaltung
- Content Sets erstellen
- Deck Assignments verwalten

### 2. Authentication UI
- Login/Logout Buttons
- Registrierung
- Password Reset

### 3. Analytics Dashboard
- Lernfortschritt visualisieren
- Streak-Tracking
- Schwache Wörter identifizieren

### 4. Bulk Import
- CSV-Upload für Flashcards
- Automatische Deck-Erstellung

---

## 🔗 Referenzen

- **Supabase Docs**: https://supabase.com/docs
- **SM-2 Algorithm**: https://en.wikipedia.org/wiki/SuperMemo
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security

---

**Status**: ✅ **PRODUCTION READY**
**Letzte Aktualisierung**: 22.01.2026
