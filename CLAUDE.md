# CLAUDE.md – Entwicklungsprotokoll

## Projektübersicht
- **Projekt:** HellenicHorizons GreekLingua Dashboard
- **Stack:** Next.js 16 + React 19 + Supabase + TypeScript
- **Ziel:** Mehrsprachige UI (EN + RU), Lernziel-Sprache immer Neugriechisch

---

## Arbeitsprotokoll

### 2026-02-08 – Initialisierung
- **Aufgabe:** ToDo.md und CLAUDE.md erstellt
- **Status:** ToDo.md mit 8 Aufgaben angelegt
- **Commit-Vorschlag:** `2026-02-08 16:00 | Init – ToDo.md und CLAUDE.md fuer Mehrsprachigkeits-Projekt erstellt`

---

### 2026-02-08 – Aufgabe 1: Supabase-Tabelle `ui_translations`
- **Aufgabe:** SQL-Migrationsdatei `supabase/create_ui_translations.sql` erstellt
- **Was wurde gemacht:**
  - Tabelle `ui_translations` mit Spalten: `id`, `key`, `lang`, `value`, `context`, `created_at`
  - UNIQUE-Constraint auf `(key, lang)` fuer Upsert-Faehigkeit
  - RLS-Policy: Oeffentlicher Lesezugriff (anon + authenticated)
  - Alle hardcodierten UI-Texte aus 12+ Komponenten inventarisiert
  - ~120 Uebersetzungsschluessel in Englisch (en) eingefuegt
  - ~120 Uebersetzungsschluessel in Russisch (ru) eingefuegt
  - Kontexte: login, dashboard, stats, mastery, actions, vocab_dialog, grammar_dialog, comprehension_dialog, listening_dialog, shared, flashcard, performance, modules, action_grid, summary, meta
- **Dateien:** `supabase/create_ui_translations.sql`
- **Commit-Vorschlag:** `2026-02-08 16:30 | Aufgabe 1 – ui_translations Tabelle mit EN+RU Uebersetzungen erstellt`
- **Naechste Aufgabe:** Aufgabe 2 – LanguageContext + Provider erstellen

---

### 2026-02-08 – Aufgabe 2: LanguageContext + Provider
- **Aufgabe:** LanguageContext mit Locale-State und Provider erstellt
- **Was wurde gemacht:**
  - `src/context/LanguageContext.tsx` erstellt
  - Typ `Locale = 'en' | 'ru'` exportiert
  - State `locale` persistiert in localStorage (`greeklingua_locale`)
  - `setLocale(lang)` Methode zum Sprachwechsel
  - Hydration-Safety: Rendert erst nach Client-Mount (verhindert SSR-Mismatch)
  - `useLanguage()` Hook exportiert
  - `LanguageProvider` in `layout.tsx` eingebunden (umschliesst AuthProvider)
  - Build erfolgreich getestet
- **Dateien:** `src/context/LanguageContext.tsx`, `src/app/layout.tsx`
- **Commit-Vorschlag:** `2026-02-08 16:45 | Aufgabe 2 – LanguageContext mit Locale-Persistierung erstellt`
- **Naechste Aufgabe:** Aufgabe 3 – useTranslation Hook + Supabase-Anbindung

---

### 2026-02-08 – Aufgabe 3: useTranslation Hook
- **Aufgabe:** useTranslation Hook mit Supabase-Anbindung und Caching erstellt
- **Was wurde gemacht:**
  - `src/lib/useTranslation.ts` erstellt
  - Laedt Uebersetzungen aus `ui_translations` Tabelle per Supabase-Query
  - Globaler Cache pro Locale (nur 1x pro Sprachwechsel geladen)
  - Deduplizierung paralleler Fetch-Requests (fetchPromises)
  - Kompletter Englisch-Fallback (FALLBACK_EN) fuer Offline-Betrieb
  - `t(key, params?)` Funktion mit Template-Substitution: `t('dashboard.welcome', { name: 'SWS' })`
  - Race-Condition-Schutz bei schnellem Sprachwechsel (localeRef + cancelled flag)
  - Build erfolgreich getestet
- **Dateien:** `src/lib/useTranslation.ts`
- **Commit-Vorschlag:** `2026-02-08 17:00 | Aufgabe 3 – useTranslation Hook mit Supabase-Caching erstellt`
- **Naechste Aufgabe:** Aufgabe 4 – Login-Seite mehrsprachig + Sprachauswahl

---

### 2026-02-08 – Aufgabe 4: Login-Seite mehrsprachig + Sprachauswahl
- **Aufgabe:** Login-Seite mehrsprachig machen und Sprachauswahl einbauen
- **Was wurde gemacht:**
  - `useLanguage` und `useTranslation` Hooks in `src/app/login/page.tsx` importiert
  - EN/RU Toggle-Buttons oben rechts in der Login-Card (absolut positioniert, Glasmorphismus-Stil)
  - Aktive Sprache visuell hervorgehoben (blauer Hintergrund)
  - Alle 7 hardcodierten Strings durch `t('key')` ersetzt:
    - `login.title` → Titel (GreekLingua)
    - `login.subtitle` → Untertitel
    - `login.email_placeholder` → Email-Placeholder
    - `login.pin_placeholder` → PIN-Placeholder
    - `login.submit` / `login.submitting` → Button-Text
    - `login.error` → Fehlermeldung
    - `login.biometric` → Biometrischer Login-Text
  - Sprachwechsel speichert sofort in localStorage (via LanguageContext)
  - Build erfolgreich getestet
- **Dateien:** `src/app/login/page.tsx`
- **Commit-Vorschlag:** `2026-02-08 17:30 | Aufgabe 4 – Login-Seite mehrsprachig mit EN/RU Sprachauswahl`
- **Naechste Aufgabe:** Aufgabe 5 – Dashboard-Seite mehrsprachig

---

### 2026-02-08 – Aufgabe 5: Dashboard-Seite mehrsprachig
- **Aufgabe:** Alle Dashboard-Komponenten mehrsprachig machen
- **Was wurde gemacht:**
  - `DashboardHeader.tsx`: `useTranslation` importiert, Logout-Button uebersetzt (`header.logout`), `header.logout` Key zum Fallback hinzugefuegt
  - `StatsCard.tsx`: `useTranslation` importiert, 5 Labels uebersetzt: `stats.current_level`, `stats.days`, `stats.vocabs`, `stats.learned`, `stats.today`, `stats.daily_goal_default`
  - `dashboard/page.tsx`: `useTranslation` importiert, komplett uebersetzt:
    - Loading-Screens: `dashboard.authenticating`, `dashboard.loading`
    - Welcome-Bereich: `dashboard.welcome` mit `{name}` Param, `dashboard.welcome_subtitle` mit `{count}` Param (HTML via dangerouslySetInnerHTML)
    - Mastery-Box: `mastery.title`, `mastery.total_time`, `mastery.last_test`, `mastery.actual_test`, `mastery.last_exam`, `mastery.vocab_progress` (HTML), `mastery.suggestion_default`
    - 16 Action-Tiles: alle `action.*` Keys
  - Build erfolgreich getestet
- **Dateien:** `src/components/dashboard/DashboardHeader.tsx`, `src/components/dashboard/StatsCard.tsx`, `src/app/dashboard/page.tsx`, `src/lib/useTranslation.ts`
- **Commit-Vorschlag:** `2026-02-08 18:00 | Aufgabe 5 – Dashboard komplett mehrsprachig (Header, Stats, Mastery, 16 Action-Tiles)`
- **Naechste Aufgabe:** Aufgabe 6 – VocabularyDialog mehrsprachig

---

### 2026-02-08 – Aufgabe 6: VocabularyDialog + Flashcard mehrsprachig
- **Aufgabe:** VocabularyDialog und Flashcard-Komponente komplett mehrsprachig machen
- **Was wurde gemacht:**
  - `VocabularyDialog.tsx`: `useTranslation` importiert, ~20 Strings uebersetzt:
    - Loading: `vocab.loading`, `vocab.loading_subtitle`
    - Zustaende: `vocab.login_required`, `vocab.login_required_msg`, `vocab.no_items`, `vocab.no_items_msg`, `vocab.error`, `vocab.error_msg`
    - Summary: `vocab.session_complete`, `vocab.correct`, `vocab.wrong`, `vocab.back_to_dashboard`, `vocab.progress_saved`, `vocab.result_saved`
    - Mode-Konfiguration: `vocab.mode.weak_title`, `vocab.mode.due_title`, `vocab.mode.review_title`, `vocab.mode.review_subtitle`, `mode.weak_subtitle`, `mode.due_subtitle`
    - Karten-Label: `flashcard.label_source` (dynamisch ENGLISH/АНГЛИЙСКИЙ)
    - Buttons: `btn.hard`, `btn.good`, `btn.easy`, `btn.audio`, `btn.audio_tooltip`, `btn.restart`, `btn.cancel`
  - `Flashcard.tsx`: `useTranslation` importiert, ~10 Strings uebersetzt:
    - Labels: `flashcard.label_source`, `flashcard.flip_hint`, `flashcard.tap_hint`
    - Buttons: `btn.hard`, `btn.good`, `btn.easy`, `btn.audio`, `btn.audio_tooltip`, `btn.restart`, `btn.cancel`
  - Build erfolgreich getestet
- **Dateien:** `src/components/learning/VocabularyDialog.tsx`, `src/components/learning/Flashcard.tsx`
- **Commit-Vorschlag:** `2026-02-08 18:30 | Aufgabe 6 – VocabularyDialog + Flashcard komplett mehrsprachig`
- **Naechste Aufgabe:** Aufgabe 7 – Restliche Komponenten mehrsprachig

---

### 2026-02-08 – Aufgabe 7: Restliche Komponenten mehrsprachig
- **Aufgabe:** GrammarDialog, ComprehensionDialog, ListeningDialog, ActionGrid, ModuleGrid, PerformanceHub mehrsprachig machen
- **Was wurde gemacht:**
  - `GrammarDialog.tsx`: `useTranslation` importiert, alle Strings uebersetzt:
    - Loading: `vocab.loading`, `grammar.loading_subtitle`
    - Zustaende: `vocab.login_required`, `grammar.login_required_msg`, `grammar.no_items`, `grammar.no_items_msg`, `grammar.no_items_tip`, `vocab.error`, `grammar.error_msg`
    - Summary: `shared.session_complete`, `shared.correct`, `shared.wrong`, `shared.back_to_dashboard`, `shared.progress_saved`, `shared.result_saved`
    - Mode-Konfiguration: `grammar.mode.weak_title`, `grammar.mode.due_title`, `grammar.mode.review_title`, `grammar.mode.review_subtitle`, `grammar.mode.weak_subtitle`, `grammar.mode.due_subtitle`
    - Karten-Label: `flashcard.label_source`
    - Buttons: `btn.hard`, `btn.good`, `btn.easy`, `btn.audio`, `btn.audio_tooltip`, `btn.restart`, `btn.cancel`
  - `ComprehensionDialog.tsx`: `useTranslation` importiert, alle Strings uebersetzt (gleiche Struktur wie Grammar, mit `comprehension.*` Keys)
  - `ListeningDialog.tsx`: `useTranslation` importiert, alle Strings uebersetzt:
    - Listening-spezifisch: `listening.play_audio`, `listening.no_audio`, `listening.correct_answer`, `listening.wrong_answer`, `listening.next`
    - Mode-Konfiguration: `listening.mode.*`
  - `ActionGrid.tsx`: `useTranslation` importiert, 9 Button-Labels uebersetzt (`action_grid.*`)
  - `ModuleGrid.tsx`: `useTranslation` importiert, 8 Modul-Titel und Subtitel uebersetzt (`modules.*`)
  - `PerformanceHub.tsx`: `useTranslation` importiert, Labels uebersetzt (`perf.title`, `perf.subtitle`, `perf.this_week`, `perf.total_active`, `perf.target`, 7 Wochentage `perf.day.*`)
  - `useTranslation.ts` (FALLBACK_EN): ~50 neue Schluessel hinzugefuegt fuer alle Komponenten
  - Build erfolgreich getestet
- **Dateien:** `src/components/learning/GrammarDialog.tsx`, `src/components/learning/ComprehensionDialog.tsx`, `src/components/learning/ListeningDialog.tsx`, `src/components/dashboard/ActionGrid.tsx`, `src/components/dashboard/ModuleGrid.tsx`, `src/components/dashboard/PerformanceHub.tsx`, `src/lib/useTranslation.ts`
- **Commit-Vorschlag:** `2026-02-08 19:30 | Aufgabe 7 – Restliche Komponenten komplett mehrsprachig (Grammar, Comprehension, Listening, ActionGrid, ModuleGrid, PerformanceHub)`
- **Naechste Aufgabe:** Aufgabe 8 – learning_items Tabelle um Russisch erweitern

---

### 2026-02-08 – Aufgabe 8: learning_items Tabelle um Russisch erweitern
- **Aufgabe:** Russische Spalte zu learning_items hinzufuegen, Kartenansicht sprachabhaengig machen
- **Was wurde gemacht:**
  - SQL-Migration `supabase/alter_learning_items_add_russian.sql` erstellt:
    - `ALTER TABLE learning_items ADD COLUMN IF NOT EXISTS russian TEXT`
    - UPDATE-Statements fuer ~30 bestehende Items (Vocabulary, Grammar, Comprehension, Listening)
  - `LearningItem` Interface in allen 4 Dialogen um `russian?: string` erweitert
  - `locale` aus `useTranslation()` in allen 4 Dialogen destrukturiert
  - Anzeige-Logik in VocabularyDialog, GrammarDialog, ComprehensionDialog:
    - `locale === 'ru' && item.russian ? item.russian : item.english`
    - Fallback auf `english` wenn `russian` leer/null ist
  - Fallback-Daten in allen 4 Dialogen um `russian` Feld ergaenzt:
    - VocabularyDialog: 10 Vokabeln (Привет, Спасибо, Пожалуйста, ...)
    - GrammarDialog: 10 Grammatik-Items (Настоящее время, Определённый артикль, ...)
    - ComprehensionDialog: 10 Verstaendnis-Items (Как тебя зовут?, Как дела?, ...)
    - ListeningDialog: 2 Hoerverstaendnis-Items
  - Build erfolgreich getestet
- **Dateien:** `supabase/alter_learning_items_add_russian.sql`, `src/components/learning/VocabularyDialog.tsx`, `src/components/learning/GrammarDialog.tsx`, `src/components/learning/ComprehensionDialog.tsx`, `src/components/learning/ListeningDialog.tsx`
- **Commit-Vorschlag:** `2026-02-08 20:00 | Aufgabe 8 – learning_items um russian Spalte erweitert, Kartenansicht sprachabhaengig`
