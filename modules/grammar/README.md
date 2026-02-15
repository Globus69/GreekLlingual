# Grammar Module – Hellenic Horizons GreekLingua Dashboard
**Letztes Update:** 15. Februar 2026

## Überblick

Das **Grammar-Modul** implementiert ein FSRS-6-basiertes Spaced-Repetition-System für griechische Grammatikregeln. Es bietet Flashcard-basiertes Lernen mit adaptiven Wiederholungsintervallen, TTS-Audio-Unterstützung und Session-Tracking.

## Features

### ✅ Implementiert

- **FSRS-6 Spaced Repetition**
  - Adaptive Schwierigkeitsanpassung (difficulty)
  - Stabilitätsberechnung (stability)
  - Vier Rating-Stufen: Again (1), Hard (2), Good (3), Easy (4)
  - Automatische Due-Date-Berechnung

- **Flashcard-Interface**
  - Vorderseite: Englische/Russische Beschreibung + Beispiel
  - Rückseite: Griechische Grammatikregel + Beispiel
  - Phonetische Transkription (IPA)
  - Flip-Animation mit Klick oder Leertaste

- **Text-to-Speech (TTS)**
  - Automatische Wiedergabe beim Umdrehen (optional)
  - Manuelle Wiedergabe-Steuerung
  - Geschwindigkeitsregelung (Slow/Normal/Fast)
  - Greek TTS mit `el-GR` Locale

- **Session Tracking**
  - Start/End-Tracking über RPC-Funktionen
  - Statistiken: Karten geübt, korrekt beantwortet
  - Session-Dauer in Minuten

- **Streak-System**
  - Automatische Streak-Aktualisierung nach Session
  - Milestone-Benachrichtigungen
  - Rekord-Tracking

- **UI/UX**
  - Progress Bar mit Prozentanzeige
  - Session Stats Mini (Again/Hard/Good/Easy Chips)
  - Keyboard Shortcuts (1-4 für Ratings, Space für Flip, A für Audio)
  - Offline-Detection mit Warnungen
  - Toast-Benachrichtigungen

### 🚧 In Arbeit

- **Backend-Integration**
  - Aktuell: Mock-Daten
  - Ziel: RPC-Call zu `get_due_grammar_cards` oder `get_learning_items_for_student`
  - Fehler-Fallback auf Mock-Daten

- **Datenbank-Schema**
  - Prüfung: Gibt es eine `grammar_items` Tabelle oder sind Grammar-Items Teil von `learning_items`?
  - FSRS-Felder in DB-Schema dokumentieren

### 📋 Geplant

- **Erweiterte Filterung**
  - Nach Level (A1, A2, B1, etc.)
  - Nach Schwierigkeit (easy, medium, hard)
  - Nach Thema (Verben, Artikel, Fälle, etc.)

- **Content-Management**
  - Admin-Interface für Grammar-Rules
  - Import/Export von Grammar-Daten
  - Bulk-Edit-Funktionen

- **Analytics**
  - Lernfortschritt pro Grammatik-Kategorie
  - Schwächste Bereiche identifizieren
  - Zeittracking pro Grammatik-Thema

## Technische Details

### Komponente
- **Datei:** `src/components/learning/grammar-dialog-fsrs.tsx`
- **Import:** `import GrammarDialogFSRS from '@/components/learning/grammar-dialog-fsrs'`

### Props
```typescript
interface GrammarDialogFSRSProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### Dependencies
- **FSRS Scheduler:** `@/lib/fsrs/fsrs-scheduler`
- **FSRS Types:** `@/lib/fsrs/fsrs-types`
- **Greek TTS:** `@/lib/tts/greek-tts`
- **Auth Context:** `@/context/auth-context`
- **Translation:** `@/lib/use-translation`
- **Toast System:** `@/components/ui/toast`

### Integration

#### Desktop Dashboard
```typescript
// src/app/dashboard/page.tsx
import GrammarDialogFSRS from '@/components/learning/grammar-dialog-fsrs';

<GrammarDialogFSRS
  isOpen={isGrammarDialogOpen}
  onClose={() => setIsGrammarDialogOpen(false)}
/>
```

#### Mobile Dashboard
```typescript
// src/app/m/page.tsx
import GrammarDialogFSRS from '@/components/learning/grammar-dialog-fsrs';

<GrammarDialogFSRS
  isOpen={showGrammarDialog}
  onClose={() => setShowGrammarDialog(false)}
/>
```

## Verwandte Dateien

- **SRS-Parameter:** `modules/grammar/grammar-srs-parameters.md`
- **Due-Logic:** `modules/grammar/grammar-due-logic.md`
- **TODO:** `modules/grammar/grammar-todo.md`
- **Dev-Log:** `modules/grammar/grammar-dev-log.md`
- **Database Schema:** `modules/grammar/grammar-database-schema.md` (geplant)

## Abgrenzung zu anderen Modulen

- **Daily Phrases:** Ganze Sätze und Alltagsausdrücke (3 pro Tag), eigene Due-Logik
- **Vocabulary:** Einzelwörter und kurze Wendungen, Anki-ähnliches System
- **Grammar:** Grammatikregeln, Konjugationen, Deklinationen, Artikel, Fälle

**Wichtig:** Keine Vermischung der Module! Jedes Modul hat seine eigene SRS-Logik und Datenverwaltung.

## Naming Convention

Alle Dateien im Grammar-Modul folgen der Projektkonvention:
- **Prefix:** `grammar-`
- **Format:** kebab-case, lowercase
- **Beispiele:** `grammar-todo.md`, `grammar-srs-parameters.md`, `grammar-dialog-fsrs.tsx`

## Support

Bei Fragen oder Problemen siehe:
- **Project Guidelines:** `docs/ai-guidelines.md`
- **Architecture:** `docs/architecture.md` (falls vorhanden)
- **Main Entry Point:** `START.md`
