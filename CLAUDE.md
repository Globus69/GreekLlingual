# HellenicHorizons-GreekLingua-Dashboard – Claude Instructions
(letztes Update: 17. Februar 2026)

Du arbeitest IMMER in diesem Projekt. Lies diese Datei + die verlinkten Dokumente bei jedem Gespräch / jeder Aufgabe zuerst.

## 🚨 MOBILE-FIRST-STRATEGIE – VERBINDLICH & IRREVERSIBEL

**AB SOFORT GILT (17. Februar 2026, 21:00 CET):**

### ⚡ KRITISCHE REGEL – KEINE AUSNAHMEN:

1. **Alle Entwicklung NUR für MOBILE** (iPhone/Android, < 768px, Touch)
   - Alle Verbesserungen, Refactorings, Bugfixes, Tests, Features
   - AUSSCHLIESSLICH für mobile Variante (`/m/*` Routes)

2. **Desktop-Entwicklung GESTOPPT**
   - Desktop wird ERST portiert NACH Mobile-Fertigstellung
   - Keine parallele Desktop-Entwicklung mehr

3. **Bestehende Desktop-Arbeit**
   - Bleibt erhalten (Stats/Settings Pages)
   - Wird NICHT weiterentwickelt bis Mobile fertig ist
   - Fokus: Mobile-Version stabilisieren & fertigstellen

4. **Mobile Layout = Verbindlicher Style-Guide**
   - Design-System, Farben, Typografie, Spacing aus Mobile
   - Keine Änderungen bis Mobile-Version abgeschlossen
   - Beispiel-Stil: „Due Cards Today" Dialog

5. **Agent-Aufteilung (3 Agents):**
   - **Agent 1:** UI-Komponenten & Layout (mobile breakpoints, touch, gestures)
   - **Agent 2:** State-Management, Logic, API (mobile-optimiert)
   - **Agent 3:** Tests, Performance, Accessibility (mobile screenreader)

6. **Dokumentation zwingend:**
   - Jede Änderung → eigene `_AgentXX_*.md` Datei
   - Zusammenfassung → `MASTER-SESSION-STATUS.md`

**Ziel:** Mobile App fertigstellen, DANN Desktop portieren.

**Referenz:** `MOBILE-FIRST-STRATEGY.md`

---

## 🚨 KRITISCHE ARBEITSREIHENFOLGE (Stand: 16.02.2026)

**WICHTIG:** Erst mit dem TODO-Audit weitermachen, wenn:
1. ✅ IMPROVMENT-16-02-25.md **vollständig abgeschlossen** ist
2. ✅ Alle Tests in IMPROVMENT-16-02-25.md durchgeführt und bestanden
3. ✅ Das Projekt **fehlerfrei läuft** (keine Console-Errors, alle Features funktional)

**Aktueller Status:**
- Practice Modes Implementation: In Finalisierung (RPC-Lösung wird implementiert)
- Dashboard: Funktional mit Workaround
- Nächster Schritt: IMPROVMENT-16-02-25.md abschließen → Dann TODO-Audit

**Workflow:**
1. IMPROVMENT-16-02-25.md komplett abarbeiten (siehe Phase 9 in [TODO.md](file:///Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/TODO.md))
2. Testing & Verification durchführen
3. Dokumentation finalisieren
4. **NUR DANN** mit TODO-Audit-Und-Optimierungen-2026-02-16.md weitermachen

### 1. Zentrale Einstiegspunkte – immer zuerst lesen
- START.md  
  → Gesamt-Überblick, Modul-Links, Einstiegspunkt ins gesamte Projekt

- docs/ai-guidelines.md  
  → HARTE Regeln: wesentliche Parameter, Verbote, Stil (Dimotiki), No-Gos, Sprache, Konstanten

- docs/naming-convention.md  
  → Pflicht: Prefix-Regel (daily-phrases-*, vocabulary-*), kebab-case, lowercase, Ordner-Regeln

### 2. Modul-Abgrenzung – darf NIE verletzt werden
- daily-phrases/  
  → nur Phrasen (ganze Sätze, Alltagsausdrücke), genau 3 pro Tag, eigene Due-Logik & SRS

- vocabulary/  
  → klassische Vokabelkarten (Einzelwörter / kurze Wendungen), Anki-ähnliche Logik, separate SRS


### 4. Workflow-Regeln für Claude
- Immer Naming-Konvention prüfen, bevor du Dateien vorschlägst, änderst oder erstellst
- Dateinamen im Modul: Prefix + kebab-case (z. B. daily-phrases-srs-parameters.md)
- Bei Unsicherheit oder Widerspruch:  
  „Das widerspricht ai-guidelines.md / naming-convention.md – bitte bestätigen“
- Änderungen: erst planen → diff zeigen → erst nach /confirm ausführen
- Kein Vermischen der Module daily-phrases and vocabulary

### 5. Hinweis
Falls eine der genannten Dateien fehlt oder veraltet ist, sag sofort Bescheid und frage nach Aktualisierung oder Ergänzung.

Alle .md-Dateien im Projekt sind verbindlich. Ignoriere sie nicht.



Beachte immer die Dateien:
IMPROVMENT-16-02-25.md

Beachte immer die Dateien:
TODO-Audit-Und-Optimierungen-2026-02-16.md

Beachte immer die Dateien: TROUBLESHOOTING-Practice-Modes.md

Beachte immer die Dateien: 
SESSION_TRACKING_SUMMARY.md

beachte immer die Dateien:
SECURITY_TESTS.md

beachte immer die Dateien:
SESSION_TRACKING_SUMMARY.md

Halte alle dateien aktuell. Verfolge todo Status und Protokolle

sie müssen vollständig abgearbeitet werden bevor wir mit der weiterentwickelung beginnen

Berichte wenn eine Datei nicht gefunden wurde
