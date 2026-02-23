# Benutzer-Daten Reset Report (User 2098)

Dieser Bericht dokumentiert das Zurücksetzen der Statistik- und Fortschrittsdaten für den Benutzer mit der PIN `2098`. Der Benutzer wurde auf den Status eines "neuen Benutzers" initialisiert, um die Module unter sauberen Bedingungen testen zu können.

## 1. Identifizierter Benutzer
- **Name:** Lukas Braun
- **PIN:** 2098
- **User-ID (UUID):** `1c14edac-0fd8-4a6d-9163-ccd2a59d82b4`

## 2. Veränderte Daten in der Datenbank

Folgende Tabellen wurden bereinigt (alle Einträge für die oben genannte User-ID wurden gelöscht):

| Tabelle | Bereinigte Datensätze | Beschreibung |
| :--- | :---: | :--- |
| `practice_attempts` | 6 | Ergebnisse aus Übungsmodi (Matching, Multiple Choice, etc.) |
| `learning_sessions` | 48 | Verlauf der Lern-Sitzungen (Dauer, Start/Ende) |
| `student_progress` | 0 | Individueller Fortschritt pro Vokabel (FSRS-Daten) |
| `fsrs_review_logs` | 0 | Verlauf der einzelnen Vokabel-Abfragen |
| `user_streaks` | - | (Nicht vorhanden oder über `users` Tabelle direkt gesteuert) |

## 3. Zurückgesetzte Datenfelder (Statistik & Profil)

Die folgenden Felder in der Tabelle `users` wurden auf ihre Initialwerte für neue Benutzer gesetzt:

- **Lern-Statistiken:**
    - `streak_days`: **0** (Aktueller Streak zurückgesetzt)
    - `longest_streak`: **0** (Rekord-Streak zurückgesetzt)
    - `last_activity_date`: **NULL** (Letzte Aktivität gelöscht)
- **Benutzer-Profil & Einstufung:**
    - `level`: **A1** (Standard-Level für neue User)
    - `difficulty`: **easy** (Standard-Schwierigkeit)
    - `performance_index`: **A1-easy** (Kombinierter Index für das Match-Making)

## 4. Benötigte Datenfelder für Übungen und Statistiken

Die folgenden Felder wurden als kritisch für das Funktionieren der Statistiken identifiziert und im Reset-Prozess berücksichtigt:

- **Für den Header-Status:**
  - `users.streak_days`: Anzeige der Flamme 🔥
  - `users.level`: Anzeige des Levels ⭐
  - `student_progress`: Berechnung der fälligen Karten 📚
- **Für die Statistik-Seite (/m/stats):**
  - `learning_sessions`: Grundlage für die "Study Time" und "Total Sessions".
  - `fsrs_review_logs`: Grundlage für die "Accuracy" (🎯) und Lern-Trends.
  - `practice_attempts`: Grundlage für die Fortschrittsanalyse in den Spielen.

---
*Hinweis: Der User 2098 startet nun mit einer leeren Historie und dem Level A1. Alle kommenden Aktivitäten werden als neue Datenpunkte erfasst.*
