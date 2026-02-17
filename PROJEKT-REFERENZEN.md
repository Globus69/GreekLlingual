# 📚 PROJEKT-REFERENZEN – Zentrale Dokumentations-Übersicht

**Projekt:** HellenicHorizons GreekLingua Dashboard
**Zweck:** Zentrale Referenz für Claude Agents zur eigenständigen Entwicklung
**Aktualisiert:** 17. Februar 2026

---

## 🎯 Wie diese Datei nutzen

Diese Datei ist dein **Einstiegspunkt** als Agent. Sie verlinkt ALLE relevanten Dokumentationen, die du brauchst, um eigenständig und korrekt am Projekt zu entwickeln.

**Workflow:**
1. **PFLICHT:** Lies zuerst die "Essential Reading" Dateien
2. **KONTEXT:** Lies Projekt-Übersicht für technisches Verständnis
3. **AKTUELL:** Check aktuelle TODOs und Session-Status
4. **BEI BEDARF:** Nutze Implementation Guides, Troubleshooting, Logs

---

## 📖 ESSENTIAL READING (Pflichtlektüre)

**DIESE DATEIEN IMMER ZUERST LESEN!**

### 1. [`CLAUDE.md`](./CLAUDE.md) ⭐⭐⭐ KRITISCH
**Status:** Aktiv (letztes Update: 16.02.2026)
**Zweck:** Claude AI-Anweisungen – HARTE Regeln für die Entwicklung

**Inhalt:**
- Kritische Arbeitsreihenfolge (Stand: 16.02.2026)
- Zentrale Einstiegspunkte (START.md, ai-guidelines.md, naming-convention.md)
- Modul-Abgrenzung (daily-phrases vs vocabulary – NIE vermischen!)
- Workflow-Regeln für Claude
- Pflicht-Dateien: IMPROVMENT-16-02-25.md, TODO-Audit, TROUBLESHOOTING, etc.

**WICHTIG:**
- Halte alle Dateien aktuell
- Protokolliere TODOs und Status
- Berichte wenn Dateien nicht gefunden werden

---

### 2. [`START.md`](./start.md) ⭐⭐⭐
**Zweck:** Gesamt-Überblick, Modul-Links, Einstiegspunkt ins Projekt

**Inhalt:**
- Projekt-Struktur
- Modul-Übersicht
- Links zu wichtigen Ressourcen

---

### 3. [`docs/ai-guidelines.md`](./docs/ai-guidelines.md) ⭐⭐⭐
**Zweck:** HARTE Regeln – Parameter, Verbote, Stil, Konstanten

**Inhalt:**
- Wesentliche Parameter (Max Cards/Day: 20, FSRS-6 Algorithmus)
- Stil: Dimotiki (modernes Griechisch), KEINE Katharevousa
- No-Gos (keine generischen Platzhalter, kein Google Translate ohne Review)
- Sprachen: EN, RU, DE, ES, EL
- Daily Phrases: GENAU 3 pro Tag
- Keine Duplikate in 30-Tage-Fenster

---

### 4. [`docs/naming-convention.md`](./docs/naming-convention.md) ⭐⭐⭐
**Zweck:** Pflicht-Regeln für Datei- und Ordnernamen

**Inhalt:**
- Prefix-Regel: `daily-phrases-*`, `vocabulary-*`, `grammar-*`
- Format: kebab-case, lowercase
- Ordner-Regeln: Modul-spezifisch
- Beispiele und Anti-Patterns

---

## 🏗️ PROJEKT-ÜBERSICHT

### 5. [`PROJECT-OVERVIEW-2026-02.md`](./PROJECT-OVERVIEW-2026-02.md) ⭐⭐
**Status:** Aktuell (16.02.2026, Updated: 17.02.2026)
**Zweck:** Komplette technische Projekt-Übersicht

**Inhalt:**
- **Technologie-Stack:** Next.js 16.1.3, React 19, TypeScript, Tailwind v4, Supabase
- **Bereits implementiert:**
  - Grammar-Modul (FSRS-6, vollständig)
  - Vocabulary-Modul (46% fertig, Phasen 1-4)
  - Daily Phrases (in Entwicklung)
  - Practice Modes (in Finalisierung, separate Page `/practice-modes`)
- **Datenmodell:** users, learning_items, fsrs_review_logs, practice_attempts
- **RPC-Funktionen:** get_due_cards_fsrs, update_card_fsrs, get_practice_config, etc.
- **i18n:** Custom LanguageContext (EN, RU, DE, ES, EL)
- **Auth:** Custom 4-Digit PIN, localStorage (geplant: httpOnly Cookies)
- **Ordnerstruktur:** modules/, src/app/, src/components/, database/
- **Offene TODOs:** Security, Vocabulary Phases 5-8, Testing

**WICHTIG:** Lies diese Datei für technischen Kontext!

---

## ✅ AKTUELLE ARBEIT / TODOs

### 6. [`IMPROVMENT-16-02-25.md`](./IMPROVMENT-16-02-25.md) ⭐⭐⭐
**Status:** Aktiv (Stand: 17.02.2026)
**Zweck:** Practice Modes Implementation – Status Report

**Inhalt:**
- **ARCHITEKTUR-ÄNDERUNG (17.02.2026):** Practice Modes auf separate Page `/practice-modes` verschoben
- Dashboard bereinigt, nur noch Link (Button 13)
- Vorteile: Stabilität, isolierte Entwicklung, einfacheres Debugging
- **TODO-Liste:** Testing-Plan, Admin UI, FSRS Integration
- **Status-Analyse:** Was ist fertig, was fehlt noch
- **Next Steps:** End-to-End Testing auf neuer Page

**BEACHTE:** Erst mit TODO-Audit weitermachen, wenn IMPROVMENT komplett abgeschlossen!

---

### 7. [`TODO-Audit-Und-Optimierungen-2026-02-16.md`](./TODO-Audit-Und-Optimierungen-2026-02-16.md) ⭐⭐
**Status:** Aktiv (42% abgeschlossen)
**Zweck:** Security & Performance Audit – 19 Verbesserungspunkte

**Inhalt:**
- **Phase 1-2 (ERLEDIGT):** Hardcoded Credentials, Rate-Limiter, Input-Validation
- **Phase 3 (OFFEN):** httpOnly Cookies, CSRF-Protection, IP-Whitelisting
- **Phase 4:** Performance-Optimierungen, Code-Qualität
- Security-Score: 7.5/10 (Ziel: 9/10)

**WICHTIG:** NUR bearbeiten, wenn IMPROVMENT-16-02-25.md abgeschlossen!

---

### 8. [`SESSION-PRACTICE-MODES-2026-02-16.md`](./SESSION-PRACTICE-MODES-2026-02-16.md) ⭐⭐
**Status:** In Progress (Updated: 17.02.2026)
**Zweck:** Practice Modes Session-Log – Was wurde erreicht, was ist offen

**Inhalt:**
- **17.02.2026:** Architektur-Änderung (separate Page)
- **16.02.2026:** Dashboard Loading-Issue behoben, Sichtbarkeit bestätigt
- SQL Migrationen vorbereitet (071)
- Aktueller Code-Stand
- Nächste Schritte (Testing auf neuer Page)

---

## 📘 IMPLEMENTATION GUIDES

### 9. [`PRACTICE-MODES-IMPLEMENTATION.md`](./PRACTICE-MODES-IMPLEMENTATION.md) ⭐⭐
**Status:** Complete (Updated: 17.02.2026)
**Zweck:** Vollständige Dokumentation der Practice Modes Implementation

**Inhalt:**
- **Architecture Change:** Separate Page `/practice-modes`
- **Phase 1:** Database & Backend (Migrations, RPCs, RLS)
- **Phase 2:** Admin UI (Config Form, Content Modal)
- **Phase 3:** Frontend Components (Matching, Multiple Choice, Write Input)
- **Phase 4:** Page Implementation (neue standalone Page)
- **Phase 5:** i18n (EN, DE, ES translations)
- Key Features: Backend-konfigurierbar, FSRS-6 Integration, Progressive Difficulty
- Testing Checklist
- Troubleshooting Guide

---

### 10. [`PROGRESS_STATS_IMPLEMENTATION.md`](./PROGRESS_STATS_IMPLEMENTATION.md) ⭐
**Zweck:** Vocabulary Progress Stats Implementation Guide

**Inhalt:**
- Dashboard-Widget für Due Cards
- Retention-Berechnung
- Charts mit Recharts
- RPC-Funktionen

---

## 🚨 TROUBLESHOOTING

### 11. [`TROUBLESHOOTING-Practice-Modes.md`](./TROUBLESHOOTING-Practice-Modes.md) ⭐⭐
**Status:** Aktuell (Updated: 17.02.2026)
**Zweck:** Practice Modes Probleme & Lösungen

**Inhalt:**
- **Architektur-Update:** Neue Route `/practice-modes`
- DATA SYNC ISSUE: Supabase PostgREST Caching
- Lösungen: Cache bust, RPC-basierte Query, Timeout
- Workaround: ID-basierte Query statt Filter

---

### 12. [`DASHBOARD-BUGS-FIX-GUIDE.md`](./DASHBOARD-BUGS-FIX-GUIDE.md) ⭐
**Zweck:** Dashboard Bug-Fixes und Diagnose

**Inhalt:**
- Infinite Loop Fixes
- Practice Modes Caching Issues
- Console-Error Debugging

---

## 📝 DEVELOPMENT LOGS

### 13. [`DEV.LOG.md`](./DEV.LOG.md) ⭐⭐
**Status:** Aktuell (Updated: 17.02.2026)
**Zweck:** Chronologisches Log aller Entwicklungsschritte

**Inhalt:**
- **17.02.2026:** Practice Modes Architecture Refactoring
- **15.02.2026:** Daily Phrases Integration (Mobile → Desktop)
- Frühere Einträge: Grammar FSRS, Security Fixes, etc.

---

### 14. [`DEV-LOG.md`](./DEV-LOG.md) ⭐
**Zweck:** Alternative/ältere Version des Dev-Logs (16K vs 32K)

---

### 15. Session-Logs (diverse)
- `SESSION-2026-02-16-PHASE1.md`
- `SESSION-LOG-2026-02-16-Evening.md`
- `SESSION-HANDOFF-2026-02-16.md`
- `SESSION_TRACKING_SUMMARY.md`

**Zweck:** Detaillierte Session-Protokolle für spezifische Arbeitssitzungen

---

## 🔒 SECURITY & TESTING

### 16. [`SECURITY_TESTS.md`](./SECURITY_TESTS.md) ⭐
**Zweck:** Security Test-Protokolle

**Inhalt:**
- Automated Security Tests
- Penetration Testing Scenarios
- Vulnerability Assessments

---

### 17. [`SECURITY_TESTS_MANUAL.md`](./SECURITY_TESTS_MANUAL.md) ⭐
**Zweck:** Manuelle Security Tests

---

### 18. [`SECURITY_TESTS_RESULTS.md`](./SECURITY_TESTS_RESULTS.md) ⭐
**Zweck:** Test-Ergebnisse und Findings

---

## 📊 AUDIT & FINDINGS

### 19. [`AUDIT-REPORT.md`](./AUDIT-REPORT.md) ⭐
**Status:** 14.02.2026
**Zweck:** Code-Audit Report

**Inhalt:**
- 19 identifizierte Verbesserungspunkte
- Security-Score: 5.5/10 → 7.5/10
- Priorisierung: Kritisch, Hoch, Mittel, Niedrig

---

### 20. [`FINDINGS.md`](./FINDINGS.md) ⭐
**Zweck:** Detaillierte Audit-Findings

**Inhalt:**
- Code-Smell-Analyse
- Security-Vulnerabilities
- Performance-Issues

---

## 📂 MODUL-SPEZIFISCHE DOKUMENTATION

### Vocabulary Module
- `modules/vocabulary/README.md`
- `modules/vocabulary/vocabulary-todo.md`
- `modules/vocabulary/vocabulary-srs-parameters.md`

### Grammar Module
- `modules/grammar/README.md`
- `modules/grammar/grammar-todo.md`
- `modules/grammar/grammar-srs-parameters.md`
- `modules/grammar/grammar-due-logic.md`
- `modules/grammar/grammar-database-schema.md`
- `modules/grammar/grammar-dev-log.md`

### Daily Phrases Module
- `modules/daily-phrases/README.md`
- `modules/daily-phrases/daily-phrases-todo.md`
- `modules/daily-phrases/daily-phrases-dev-log.md`
- `modules/daily-phrases/daily-phrases-srs-parameters.md`

---

## 🗂️ SONSTIGE WICHTIGE DATEIEN

### 21. [`name-convention.md`](./name-convention.md) / [`docs/naming-convention.md`](./docs/naming-convention.md)
**Zweck:** Naming-Konventionen (evtl. Duplikat)

---

## 🎯 QUICK-REFERENCE: Arbeitsablauf für Agents

### **Szenario 1: Neue Feature-Entwicklung**
1. ✅ Lies `CLAUDE.md` (Arbeitsreihenfolge!)
2. ✅ Lies `IMPROVMENT-16-02-25.md` (aktueller Status)
3. ✅ Check `TODO-Audit-Und-Optimierungen-2026-02-16.md` (nur wenn IMPROVMENT fertig!)
4. ✅ Lies `PROJECT-OVERVIEW-2026-02.md` (technischer Kontext)
5. ✅ Prüfe `docs/ai-guidelines.md` + `docs/naming-convention.md` (Regeln!)
6. 🔧 Entwickle Feature
7. 📝 Update relevante Dateien (DEV.LOG.md, Session-Logs, TODOs)

### **Szenario 2: Bug-Fixing**
1. ✅ Lies `TROUBLESHOOTING-Practice-Modes.md` oder `DASHBOARD-BUGS-FIX-GUIDE.md`
2. ✅ Check `DEV.LOG.md` (bekannte Probleme?)
3. ✅ Lies `PROJECT-OVERVIEW-2026-02.md` (technischer Kontext)
4. 🔧 Fixe Bug
5. 📝 Update TROUBLESHOOTING + DEV.LOG.md

### **Szenario 3: Testing / QA**
1. ✅ Lies `IMPROVMENT-16-02-25.md` → TODO-Liste → Testing-Checkliste
2. ✅ Lies `PRACTICE-MODES-IMPLEMENTATION.md` → Testing Checklist
3. ✅ Check `SECURITY_TESTS.md` (Security-Aspekte)
4. 🧪 Führe Tests durch
5. 📝 Update Test-Ergebnisse in relevanten Dateien

---

## ⚠️ KRITISCHE REGELN

### **IMMER BEACHTEN:**
1. **Arbeitsreihenfolge:** Erst `IMPROVMENT-16-02-25.md` abschließen, DANN `TODO-Audit`!
2. **Module NICHT vermischen:** daily-phrases ≠ vocabulary ≠ grammar
3. **Naming-Convention:** Prefix + kebab-case + lowercase
4. **Dokumentation:** ALLE Änderungen in relevanten .md Dateien protokollieren
5. **Testing:** Erst testen, dann als "fertig" markieren

### **VERBOTEN:**
- ❌ Google Translate ohne manuelle Nachbearbeitung
- ❌ Generische Platzhalter-Sätze
- ❌ Politisch/sensible Themen
- ❌ Änderung der Ordnerstruktur ohne Freigabe
- ❌ Module vermischen (daily-phrases vs vocabulary)

---

## 📞 KONTAKT & HILFE

**GitHub Issues:** https://github.com/anthropics/claude-code/issues (für Claude Code Feedback)

**Bei Fragen:**
- Check `TROUBLESHOOTING-Practice-Modes.md`
- Check `DEV.LOG.md` (ähnliche Probleme?)
- Ask User via AskUserQuestion Tool

---

## 🔄 UPDATES

**Diese Datei aktualisieren wenn:**
- Neue .md Dateien erstellt werden
- Wichtige Dokumentation hinzukommt
- Struktur sich ändert

---

## 📂 OPTIMIERUNGEN & KOORDINATION

### 22. [`OPTIMIERUNGSKONZEPT-170225.md`](./OPTIMIERUNGSKONZEPT-170225.md) ⭐⭐
**Status:** Aktiv (17.02.2026)
**Zweck:** 6 Optimierungen mit ROI-Analyse

**Inhalt:**
- Quick Wins: Agent-Koordination, Linter-Config, Task Tracking
- Mittelfristig: Design Tokens, Documentation Consolidation
- Langfristig: Performance Monitoring
- Jede Optimierung mit Aufwand/Nutzen/Zeit/ROI

---

### 23. **Agent-Koordination System** ⭐⭐⭐ NEU!
**Status:** Implementiert (17.02.2026)
**Zweck:** Tägliche Koordination zwischen Master und Agents

#### Dateien:
- [`AGENT-COORDINATION-WORKFLOW.md`](./AGENT-COORDINATION-WORKFLOW.md) - Workflow-Guide
- [`DAILY-STANDUP-TEMPLATE.md`](./DAILY-STANDUP-TEMPLATE.md) - Wiederverwendbares Template
- [`DAILY-STANDUP-2026-02-17.md`](./DAILY-STANDUP-2026-02-17.md) - Heutiges Standup

#### Wie nutzen:
1. **Agents:** Daily Standup Ende des Tages erstellen/updaten
2. **Master:** Morgens reviewen, Blocker adressieren
3. **Format:** Template kopieren, eigenen Abschnitt ausfüllen
4. **Commit:** `standup(agent-X): Daily update [DATUM]`

#### Vorteile:
- ✅ Transparenz: Jeder weiß, woran andere arbeiten
- ✅ Frühe Blocker-Erkennung (<4h Response)
- ✅ Keine Doppelarbeit durch Dependencies-Tracking
- ✅ Bessere Koordination (+70%)
- ✅ ROI: ⭐⭐⭐⭐⭐ (Exzellent!)

---

**Letzte Aktualisierung:** 17. Februar 2026, 14:00 CET

---

**Ende der Projekt-Referenzen** ✅
