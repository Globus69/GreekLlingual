# Claude-Aktive Pfade – Stand 2026-01-23

## Dialoge

| Dialog / Modus          | Datei-Pfad (relativ zum Projekt-Root) | Öffnungs-URL (localhost:3000)                  | Bemerkung / Status |
|-------------------------|----------------------------------------|------------------------------------------------|--------------------|
| Train Weak Words        | `public/flashcards/flashcards.html`    | `http://localhost:3000/flashcards/flashcards.html?mode=weak` | ✅ Aktiv, filtert nach difficulty='hard' OR ease<2.3 |
| Review Vocabulary       | `public/flashcards/flashcards.html`    | `http://localhost:3000/flashcards/flashcards.html?mode=review` | ✅ Aktiv, zeigt alle Vokabeln |
| Due Cards Today         | `public/flashcards/flashcards.html`    | `http://localhost:3000/flashcards/flashcards.html?mode=due` | ✅ Aktiv, filtert nach due_date <= heute |
| Daily Phrases           | `public/daily-phrases/daily-phrases.html` | `http://localhost:3000/daily-phrases/daily-phrases.html` | ✅ Aktiv, Blur-Reveal Mechanismus |

## Datenbank-Tabellen (Supabase)

| Tabelle                 | Relevante Felder (wichtigste)          | Verknüpfung / Filter                           | Bemerkung / Status |
|-------------------------|----------------------------------------|------------------------------------------------|--------------------|
| vocabs                  | id, deck_id, english, greek, difficulty, created_at | deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e' | ✅ Haupttabelle für Vokabeln (10 Einträge erstellt) |
| daily_phrases           | id, deck_id, greek_phrase, english_translation, category, difficulty | deck_id = 'c8852ed2-ebb9-414c-ac90-4867c562561e' | ✅ Tabelle für tägliche Phrasen (13 Einträge: 10 aus CREATE_TABLE + 3 aus INSERT) |
| student_progress        | id, student_id, vocab_id, phrase_id, ease, interval, due_date, last_reviewed, correct_count, attempts | vocab_id (für Vokabeln) oder phrase_id (für Phrasen) | ✅ SRS-Fortschritt, UPSERT bei Bewertung, unterstützt beide Content-Typen |
| content_sets            | nicht vorhanden oder nicht verwendet   | -                                              | ❓ Status unklar, nicht in aktueller Implementierung |
| deck_assignments        | nicht vorhanden oder nicht verwendet   | -                                              | ❓ Status unklar, nicht in aktueller Implementierung |
| profiles                | nicht vorhanden oder nicht verwendet   | -                                              | ❓ Status unklar, Supabase Auth verwendet (user.id) |

## JavaScript-Dateien

| Datei                   | Pfad (relativ)                         | Hauptfunktionen                                | Status |
|-------------------------|----------------------------------------|------------------------------------------------|--------|
| Flashcards Script       | `public/flashcards/flashcards-script.js` | loadCardsFromSupabase(), flipCard(), handleRating(), savePhraseProgress() | ✅ Aktiv, 610 Zeilen |
| Daily Phrases Script    | `public/daily-phrases/daily-phrases-script.js` | loadPhrasesFromSupabase(), revealTranslation(), handleRating(), savePhraseProgress() | ✅ Aktiv, 488 Zeilen |

## CSS-Dateien

| Datei                   | Pfad (relativ)                         | Hauptfunktionen                                | Status |
|-------------------------|----------------------------------------|------------------------------------------------|--------|
| Flashcards Style        | `public/flashcards/flashcards-style.css` | 3D-Flip Animation, Glassmorphism, Button-Bar Layout | ✅ Aktiv, 16 KB |
| Daily Phrases Style     | `public/daily-phrases/daily-phrases-style.css` | Blur-Reveal Mechanismus, Glassmorphism | ✅ Aktiv, 12 KB |

## Dashboard

| Komponente              | Pfad (relativ)                         | Bemerkung                                      | Status |
|-------------------------|----------------------------------------|------------------------------------------------|--------|
| Dashboard Page          | `src/app/dashboard/page.tsx`           | Next.js Route, verwendet <a> Tags für Navigation zu statischen HTML-Dateien | ✅ Aktiv |
| Dashboard Header        | `src/components/dashboard/DashboardHeader.tsx` | Header-Komponente | ✅ Aktiv |
| Action Grid             | `src/components/dashboard/ActionGrid.tsx` | Grid mit Buttons für Flashcards und Daily Phrases | ✅ Aktiv |

## SQL-Dateien (für Supabase Setup)

| Datei                   | Pfad (relativ)                         | Zweck                                          | Status |
|-------------------------|----------------------------------------|------------------------------------------------|--------|
| Vocab INSERTs           | `public/flashcards/INSERT_VOCABS.sql`  | 10 realistische griechische Vokabeln           | ✅ Erstellt, bereit zum Ausführen |
| Daily Phrases CREATE    | `public/daily-phrases/SUPABASE_CREATE_TABLE.sql` | Tabellen-Schema + 10 Beispiel-Phrasen | ✅ Erstellt, bereit zum Ausführen |
| Daily Phrases INSERTs   | `public/daily-phrases/INSERT_DAILY_PHRASES.sql` | 3 zusätzliche Phrasen (übersetzt aus Deutsch) | ✅ Erstellt, bereit zum Ausführen |
| Database Verification   | `public/VERIFY_DATABASE.sql`           | Queries zur Überprüfung der Datenbank          | ✅ Erstellt |

## Wichtige Konstanten

| Konstante               | Wert                                   | Verwendung                                     |
|-------------------------|----------------------------------------|------------------------------------------------|
| DECK_ID                 | `c8852ed2-ebb9-414c-ac90-4867c562561e` | Haupt-Deck für alle Vokabeln und Phrasen       |
| SUPABASE_URL            | `https://bzdzqmnxycnudflcnmzj.supabase.co` | Supabase-Projekt-URL |
| SUPABASE_ANON_KEY       | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public Anon Key für Client-Zugriff |

## Nächste Schritte

1. ✅ SQL-Dateien in Supabase SQL Editor ausführen
2. ✅ Server neu starten: `npm run dev`
3. ✅ Dialoge im Browser testen
4. ✅ Fortschritt-Tracking überprüfen (student_progress Tabelle)

---

**Letzte Aktualisierung**: 2026-01-23 13:45
**Projekt-Root**: `/Users/SWS/DEVELOP/Antigravity/HellenicHorizons-GreekLingua-Dashboard`
