# Nächste Schritte laut CLAUDE.md Guidelines

Basierend auf der Analyse der wiederhergestellten Dokumente (Stand 20.02.2026) ergibt sich folgende strikt einzuhaltende Priorisierung für die Fortführung des Projekts:

## 1. Höchste Priorität: Abschluss von `IMPROVMENT-16-02-25.md`
Laut der „Kritischen Arbeitsreihenfolge" in `CLAUDE.md` darf kein neues Projekt begonnen werden, bevor dieses Dokument vollständig abgearbeitet ist.

### Offene Aufgaben (Testing-Phase):
Die Implementierung (Phasen 1-5) ist abgeschlossen, aber das **Testing steht bei 0%**.
- [ ] **E2E User Flow Testing**: Start der Practice Modes über Button 13 im Dashboard/Seite `/practice-modes`.
- [ ] **Game Mode Verifizierung**: Einzeltest von *Matching*, *Multiple Choice* und *Write Input*.
- [ ] **Admin UI Check**: Speichern und Bearbeiten der Practice-Konfiguration im Admin-Bereich.
- [ ] **Datenbank-Validierung**: Prüfung, ob `practice_attempts` korrekt in Supabase geloggt werden.
- [ ] **FSRS-Integration**: Sicherstellen, dass die FSRS-Ratings nach dem Practice korrekt verarbeitet werden.

## 2. Struktur-Vorgabe: Mobile-First
Alle oben genannten Tests und etwaige Fixes müssen zwingend unter der **Mobile-First-Doktrin** erfolgen:
- Fokus auf `/m/*` Routen.
- Einsatz der 3-Agenten-Struktur (UI, Logic, Testing).
- Jede Änderung muss in einem spezifischen `_AgentXX_*.md` Log dokumentiert werden.

## 3. Nächster großer Meilenstein: TODO-Audit
Erst nach dem **erfolgreichen** Abschluss und der Verifizierung von `IMPROVMENT-16-02-25.md` (keine Console-Errors, alle Success Criteria grün) darf mit der Datei begonnen werden:
- `TODO-Audit-Und-Optimierungen-2026-02-16.md`

## 4. Administrative Aufgaben
- [ ] **MASTER-SESSION-STATUS.md** aktualisieren, sobald das Testing beginnt.
- [ ] **CURRENT-WORK.md** befüllen, um den aktiven Task für neue Sessions sichtbar zu machen.

---
**Zusammenfassend:** Der nächste konkrete Handgriff ist das **Testing des Practice-Mode-User-Flows** gemäß Kapitel „SCHRITT 1" in [IMPROVMENT-16-02-25.md](file:///Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/IMPROVMENT-16-02-25.md). Alle offenen Punkte wurden nach [TODO.md](file:///Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/TODO.md) (Phase 9) verschoben.
