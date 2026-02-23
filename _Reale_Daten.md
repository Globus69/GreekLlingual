# Analyse der Datenquellen (Real-Daten vs. Mock-Daten)

Diese Analyse untersucht, ob die Kernmodule des HellenicHorizons Dashboards mit echten Datenbank-Daten (Supabase) arbeiten oder auf Platzhalter (Mock-Daten) zurückgreifen.

## Zusammenfassung der Ergebnisse

| Modul | Status | Datenquelle |
| :--- | :--- | :--- |
| **1. Daily Cards Today** | ✅ Real-Daten | Supabase RPC `get_due_cards_today` |
| **2. Review Vocab** | ✅ Real-Daten | Supabase RPC `get_due_vocabulary_cards` |
| **3. Weak Words** | ✅ Real-Daten | Supabase Tabelle `multilingual_vocabulary` |
| **4. Daily Phrases** | ✅ Real-Daten | Supabase Tabelle `daily_phrases` |
| **5. Brain Gym** | ✅ Real-Daten | Supabase RPCs `get_due_vocabulary_cards`, `get_all_vocabulary_cards`, `get_weak_vocabulary_cards` (inkl. Client-Caching) |
| **6. Stats (/m/stats)** | ✅ Real-Daten | Supabase RPCs `get_progress_overview`, `get_learning_trends`, `get_weekly_activity`, `get_user_streak` |

---

## Detaillierte Analyse pro Modul

### 1. Daily Cards Today
- **Arbeitet mit Realdaten?** Ja.
- **Details:** Das Modul nutzt `DueCardsDialog.tsx`. Beim Öffnen wird die RPC-Funktion `get_due_cards_today` aufgerufen, die spezifisch für den eingeloggten Benutzer (`p_user_id`) alle heute fälligen Karten nach dem FSRS-6 Algorithmus aus der Datenbank abruft.
- **Datei:** `src/components/learning/due-cards-dialog.tsx`

### 2. Review Vocab
- **Arbeitet mit Realdaten?** Ja.
- **Details:** Das Modul nutzt `VocabularyDialog.tsx`. Es ruft über die RPC-Funktion `get_due_vocabulary_cards` bis zu 20 fällige Vokabelkarten ab. Die Fortschritte (Ratings) werden über `update_vocabulary_progress` zurück in die Datenbank geschrieben.
- **Datei:** `src/components/learning/vocabulary-dialog.tsx`

### 3. Weak Words
- **Arbeitet mit Realdaten?** Ja.
- **Details:** Das Modul nutzt `WeakWordsDialog.tsx`. Es fragt die Tabelle `multilingual_vocabulary` ab und filtert nach dem User-Level (z.B. 'A1'). Die Sortierung erfolgt nach `difficulty` (höchste zuerst), um gezielt schwierige Wörter zu trainieren.
- **Datei:** `src/components/learning/weak-words-dialog.tsx`

### 4. Daily Phrases
- **Arbeitet mit Realdaten?** Ja.
- **Details:** Das Modul nutzt `DailyPhrasesDialog.tsx`. Es lädt alle verfügbaren Sätze aus der Tabelle `daily_phrases`. Ein stabiler Hash-Algorithmus (basierend auf dem aktuellen Datum und dem Zeitfenster - Morgen/Mittag/Abend) wählt dann einen konsistenten Satz für diesen Zeitraum aus.
- **Datei:** `src/components/learning/daily-phrases-dialog.tsx`

### 5. Brain Gym
- **Arbeitet mit Realdaten?** Ja.
- **Details:** Das Modul nutzt `MobileBrainGymPage`. Es erlaubt dem User, die Quelle zu wählen (Fällige Karten, Gesamte Vocabs oder Schwache Wörter). Es nutzt dafür die entsprechenden RPCs (`get_due_vocabulary_cards`, `get_all_vocabulary_cards`, `get_weak_vocabulary_cards`). Ergebnisse werden über `record_practice_attempt` gespeichert.
- **Zusatz:** Es wird ein `useMobileCache` (IndexedDB) verwendet, um die Daten für eine Stunde offline-verfügbar zu halten, basierend auf den von Supabase geladenen Daten.
- **Datei:** `src/app/m/brain-gym/page.tsx`

### 6. Stats (/m/stats)
- **Arbeitet mit Realdaten?** Ja.
- **Details:** Die Statistik-Seite und der Header verwenden den zentralen Hook `useStatsData`. Dieser bündelt mehrere Datenbankabfragen:
    - Einfache `SELECT`-Queries auf `student_progress` (Due Count, Total Words) und `users` (Level).
    - Komplexe Aggregationen via RPC: `get_progress_overview` (30 Tage), `get_learning_trends` (7 Tage), `get_weekly_activity` (4 Wochen) und `get_user_streak`.
- **Dateien:** `src/app/m/stats/page.tsx`, `src/hooks/use-stats-data.ts`

---
*Anmerkung: Alle untersuchten Module sind vollständig in das Supabase-Backend integriert und nutzen keine statischen Mock-Arrays für die Anzeige von Lerninhalten.*
