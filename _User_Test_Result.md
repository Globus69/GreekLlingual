# User Test Result (User 2098)

Diese Untersuchung bestätigt, welche Module die Ergebnisse in der Datenbank speichern und welche nur während der aktuellen Sitzung (lokal) wirken.

## 1. Test-Zusammenfassung (Due Cards Today)
- **Aktion:** User hat 4 Karten im Modul "Due Cards Today" bearbeitet.
- **Ergebnis:** Die Speicherung war **ERFOLGREICH**.
- **DB-Check:**
    - Tabelle `learning_sessions`: Ein Eintrag von heute (ca. 08:21 UTC) mit 4 bearbeiteten Karten wurde gefunden.
    - Tabelle `user_vocabulary_progress`: 4 Einträge wurden exakt zum Zeitpunkt der Bearbeitung aktualisiert.
    - **Status:** Funktioniert wie erwartet.

## 2. Speicher-Status pro Modul

| Modul | Speichert in DB? | Ziel-Tabelle | Bemerkung |
| :--- | :---: | :--- | :--- |
| **Due Cards Today** | ✅ Ja | `user_vocabulary_progress` / `student_progress` | Nutzt FSRS-6 Planungsdaten. |
| **Review Vocabs** | ✅ Ja | `user_vocabulary_progress` | Nutzt denselben Speichermechanismus wie Due Cards. |
| **Weak Words** | ❌ Nein | - | Nur lokale Sitzung (Practice-Mode). Die Karten werden bei Erfolg aus der aktuellen Schlange entfernt, aber kein DB-Update gesendet. |
| **Daily Phrases** | ❌ Nein | - | Aktuell nur zum Lernen ohne Fortschrittsspeicherung im dedizierten Dialog. (In "Due Cards Today" eingebettet werden sie jedoch gespeichert). |
| **Brain Gym** | ✅ Ja | `practice_attempts` | Speichert Score, Zeit und Fehler pro Spielrunde. |

## 3. Besonderheiten & Beobachtungen
- **FSRS Logs:** In der aktuellen Migration (088/094) wurde das Logging in `fsrs_review_logs` für Vokabeln teilweise zugunsten der Performance im Haupt-Insert-Statement (UPSERT) reduziert oder verschoben. Der Fortschritt selbst (`user_vocabulary_progress`) ist jedoch absolut konsistent und aktuell.
- **Session Tracking:** Das System erfasst jede Sitzung in `learning_sessions`, was für die Berechnung der täglichen Lernzeit ("Study Minutes") in der Statistik-Seite genutzt wird. Dies funktionierte beim Test mit 4 Karten einwandfrei.

---
**Fazit:** Der User 2098 ("Lukas Braun") erzeugt nun wieder reale Daten in der Datenbank. Die Kernmodule für das Langzeit-Lernen (FSRS) speichern korrekt.
