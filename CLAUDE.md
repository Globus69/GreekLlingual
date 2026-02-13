# CLAUDE.md – Entwicklungsprotokoll

## Projektübersicht
- **Projekt:** HellenicHorizons GreekLingua Dashboard
- **Stack:** Next.js 16 + React 19 + Supabase + TypeScript
- **Ziel:** Mehrsprachige UI (EN + RU + EL), Lernziel-Sprache immer Neugriechisch

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
- **Naechste Aufgabe:** Aufgabe 9 – Admin-Button im Dashboard-Header

---

### 2026-02-08 – Aufgabe 9: Admin-Button im Dashboard-Header
- **Aufgabe:** Admin-Button neben Logout, Admin-Seite mit Zugriffskontrolle
- **Was wurde gemacht:**
  - `AuthContext.tsx` erweitert:
    - `User` Interface um `role?: 'admin' | 'student'` ergaenzt
    - `isAdmin` Flag im Context (`user?.role === 'admin'`)
    - Lokaler Admin-Login setzt `role: 'admin'`
    - Supabase-Login liest `role` aus DB (`data.role || 'student'`)
  - `DashboardHeader.tsx` erweitert:
    - Admin-Button (lila, ⚙️ Icon) neben Logout-Button
    - Nur sichtbar wenn `isAdmin === true`
    - Navigiert zu `/admin`
    - Hover-Effekt (lila Glasmorphismus)
  - `src/app/admin/page.tsx` erstellt:
    - Geschuetzte Route: Redirect zu `/login` wenn nicht authentifiziert
    - Zugriffsverweigerung (🔒) wenn kein Admin
    - Admin-Header mit Titel, Sprachwahl EN/RU, "Zurueck zum Dashboard" Button
    - 3 Statistik-Karten (Total Students, Active Today, Avg. Progress)
    - 3 Navigations-Karten (Students, Content Management, Settings)
    - User-Info Footer (Name, Email, Rolle)
    - Komplett mehrsprachig via `t('admin.*')` Keys
  - `useTranslation.ts` (FALLBACK_EN): 14 neue Admin-Keys hinzugefuegt
  - Build erfolgreich getestet
- **Dateien:** `src/context/AuthContext.tsx`, `src/components/dashboard/DashboardHeader.tsx`, `src/app/admin/page.tsx`, `src/lib/useTranslation.ts`
- **Commit-Vorschlag:** `2026-02-08 21:00 | Aufgabe 9 – Admin-Button im Header + Admin-Seite mit Zugriffskontrolle`
- **Naechste Aufgabe:** Aufgabe 10 – User-Tabelle erstellen

---

### 2026-02-08 – Aufgabe 10: User-Tabelle erstellen
- **Aufgabe:** Bestehende users-Tabelle um alle benoetigten Felder erweitern
- **Was wurde gemacht:**
  - SQL-Migration `supabase/create_users_table.sql` erstellt:
    - `pgcrypto` Extension fuer bcrypt-Hashing aktiviert
    - 7 neue Spalten idempotent hinzugefuegt (DO $$ IF NOT EXISTS):
      - `name TEXT` – Login-Name
      - `pin_hash TEXT` – bcrypt-gehashter PIN (via `crypt()` + `gen_salt('bf')`)
      - `whatsapp TEXT` – optionale WhatsApp-Nummer
      - `role TEXT NOT NULL DEFAULT 'student'` – CHECK (admin/student)
      - `level TEXT DEFAULT 'A1'` – CHECK (A1/A2/B1)
      - `difficulty TEXT DEFAULT 'easy'` – CHECK (easy/medium/hard)
      - `performance_index TEXT DEFAULT 'A1-easy'` – zusammengesetzter Key
    - Indizes: `idx_users_name`, `idx_users_performance`
    - Trigger `trg_update_performance_index`: Automatische Aktualisierung von `performance_index` bei Aenderung von `level` oder `difficulty`
    - RLS-Policies:
      - "Admin full access" – Admin darf alles
      - "Students read own data" – Student nur eigene Daten
      - "Anon can read users for login" – Anon darf fuer Login lesen
    - Admin-User via Upsert: Name "Admin", PIN "1234" als bcrypt-Hash
    - Hilfsfunktion `verify_user_pin(p_name, p_pin)`:
      - Validiert Name + PIN gegen bcrypt-Hash
      - Gibt user_id, name, email, role, level, difficulty, performance_index zurueck
      - SECURITY DEFINER, Zugriffsrechte fuer anon + authenticated
  - Build erfolgreich getestet
- **Dateien:** `supabase/create_users_table.sql`
- **Commit-Vorschlag:** `2026-02-08 21:30 | Aufgabe 10 – User-Tabelle mit bcrypt PIN-Hashing, RLS, Trigger, verify_user_pin()`
- **Naechste Aufgabe:** Aufgabe 11 – Admin-Authentifizierung absichern

---

### 2026-02-08 – Aufgabe 11: Admin-Authentifizierung absichern
- **Aufgabe:** Login-Flow sicher gegen Supabase-DB absichern + Session-Timeout
- **Was wurde gemacht:**
  - Login-Kette mit 3 Stufen implementiert:
    1. **Supabase `verify_user_pin()`** – bcrypt-validierter Login ueber RPC-Funktion (sicherste Methode)
    2. **Supabase Direkt-Query** – Legacy-Fallback (name + pin Klartext)
    3. **Lokaler Admin-Fallback** – Funktioniert ohne Supabase (Admin/1234)
  - **Session-Timeout (24h):** Timestamp wird bei Login in localStorage gespeichert, beim Laden geprueft und bei Ablauf automatisch ausgeloggt
  - **User-Interface erweitert:** `level`, `difficulty`, `performance_index` Felder hinzugefuegt (Vorbereitung fuer Aufgaben 13-17)
  - Login-Parameter umbenannt: `email` → `username` (konsistent mit Name+PIN-Login)
  - Logout loescht auch Session-Timestamp
  - Build erfolgreich getestet
- **Dateien:** `src/context/AuthContext.tsx`
- **Commit-Vorschlag:** `2026-02-08 22:00 | Aufgabe 11 – Admin-Auth mit verify_user_pin, Session-Timeout, Login-Kette`
- **Naechste Aufgabe:** Aufgabe 12 – Schueler-Verwaltungs-Dialog

---

### 2026-02-08 – Aufgabe 12: Schueler-Verwaltungs-Dialog
- **Aufgabe:** CRUD-Dialog fuer Schueler-Verwaltung im Admin-Backend erstellen
- **Was wurde gemacht:**
  - **Neue Datei `src/components/admin/StudentManagementDialog.tsx`** erstellt:
    - Vollstaendiger Modal-Dialog mit 3 Modi: Liste / Hinzufuegen / Bearbeiten
    - **Schueler-Liste** mit Echtzeit-Suchfunktion (Name, Email, WhatsApp)
    - **Neuer Schueler**: Formular mit Name*, Email, WhatsApp, PIN (6-stellig, nur Ziffern)
    - **Bearbeiten**: Gleiche Felder, PIN optional (leer = beibehalten)
    - **Loeschen**: 2-Klick-Bestaetigung (Sicherheitsabfrage)
    - **Level-RadioButtons**: A1, A2, B1, B2 – visuell hervorgehoben (lila)
    - **Difficulty-RadioButtons**: Easy, Middle, Hard – visuell hervorgehoben (gruen)
    - **Index-Key** automatisch berechnet und angezeigt (z.B. "A2-middle", orange Highlight)
    - Validierung: Name Pflichtfeld, PIN exakt 6 Ziffern
    - Supabase CRUD: SELECT (role='student'), INSERT, UPDATE, DELETE
    - Tags pro Schueler: Level (lila), Difficulty (gruen), Index-Key (orange)
    - Fehler- und Erfolgsmeldungen
    - Glasmorphismus-Stil passend zum Admin-Design
  - **`src/app/admin/page.tsx`** aktualisiert:
    - Import von `StudentManagementDialog`
    - State `studentDialogOpen` hinzugefuegt
    - "Students"-Karte oeffnet Dialog per Klick
    - Beschreibungstexte lokalisiert (`admin.students_desc`, `admin.content_desc`, `admin.settings_desc`)
  - **`src/lib/useTranslation.ts`** (FALLBACK_EN): ~35 neue Keys hinzugefuegt:
    - `students.title`, `students.subtitle`, `students.add_new`, `students.back_to_list`
    - `students.search_placeholder`, `students.loading`, `students.no_students`
    - `students.form_add_title`, `students.form_edit_title`
    - `students.field_*` (name, email, whatsapp, pin, level, difficulty)
    - `students.diff_easy`, `students.diff_middle`, `students.diff_hard`
    - `students.index_key_label`, `students.btn_create`, `students.btn_update`
    - `students.saved_success`, `students.updated_success`, `students.deleted_success`
    - `students.error_*` Fehlermeldungen
    - `admin.students_desc`, `admin.content_desc`, `admin.settings_desc`
  - **ToDo.md** aktualisiert: Aufgaben 12-15 durch neue Definitionen ersetzt
  - Build erfolgreich getestet
- **Dateien:** `src/components/admin/StudentManagementDialog.tsx` (neu), `src/app/admin/page.tsx`, `src/lib/useTranslation.ts`, `ToDo.md`
- **Commit-Vorschlag:** `2026-02-08 22:30 | Aufgabe 12 – Schueler-Verwaltungs-Dialog mit CRUD, Level/Difficulty RadioButtons, Index-Key`
- **Naechste Aufgabe:** Aufgabe 13 – Sprachwechsel-Hintergrundfarbe im Backend

---

### 2026-02-08 – Bugfix: Student-Management Datenbankfehler
- **Aufgabe:** Datenbankfehler beim Speichern von Schuelern beheben
- **Was wurde gemacht:**
  - **5 Probleme identifiziert und behoben:**
    1. CHECK-Constraint `level`: `B2` fehlte in erlaubten Werten
    2. CHECK-Constraint `difficulty`: DB hatte `'medium'`, Code sendete `'middle'`
    3. RLS-Policies: Anon-User durfte nur SELECT, kein INSERT/UPDATE/DELETE
    4. `email` Spalte war NOT NULL, aber Formular erlaubt leeres Email
    5. `pin_hash` wurde nie gesetzt – Schueler konnten sich nicht einloggen
  - **SQL-Migration `supabase/fix_student_management.sql`** erstellt:
    - CHECK-Constraints gefixed (B2 hinzugefuegt, medium→middle)
    - Email nullable gemacht
    - 4 RPC-Funktionen mit SECURITY DEFINER (umgehen RLS):
      - `create_student()` – erstellt Schueler mit bcrypt PIN-Hash
      - `update_student()` – aktualisiert Schueler, optional neuer PIN-Hash
      - `delete_student()` – loescht Schueler (nur role='student')
      - `list_students()` – listet alle Schueler
    - GRANT EXECUTE fuer anon + authenticated
  - **`StudentManagementDialog.tsx`** aktualisiert:
    - Alle CRUD-Operationen nutzen jetzt RPC-Funktionen (primaer)
    - Fallback auf direkte Supabase-Queries falls RPC nicht verfuegbar
    - Fehlerbehandlung fuer RPC-Ergebnisse (`success`/`error` JSON)
  - **`create_users_table.sql`** aktualisiert:
    - Level-Constraint: `('A1', 'A2', 'B1', 'B2')`
    - Difficulty-Constraint: `('easy', 'middle', 'hard')`
  - Build erfolgreich getestet
- **Dateien:** `supabase/fix_student_management.sql` (neu), `src/components/admin/StudentManagementDialog.tsx`, `supabase/create_users_table.sql`
- **Hinweis:** SQL muss in Supabase SQL Editor ausgefuehrt werden!

---

### 2026-02-08 – Aufgabe 13: Sprachwechsel-Hintergrundfarbe im Backend
- **Aufgabe:** Dezente Hintergrundfarbaenderung bei Sprachwechsel EN/RU
- **Was wurde gemacht:**
  - **Hintergrund-Gradient** aendert sich je nach Locale:
    - EN: Kuehler Blauton (`#0f1a3e` Mitte)
    - RU: Warmer Rotton (`#2a1028` Mitte)
    - Sanfter Uebergang mit `transition: background 0.6s ease`
  - **Header-Hintergrund** passt sich an:
    - EN: `rgba(0, 20, 60, 0.25)` – dezenter Blau-Touch
    - RU: `rgba(60, 0, 20, 0.25)` – dezenter Rot-Touch
    - Header-Border ebenfalls farblich angepasst
  - **Sprachwahl-Buttons** farblich differenziert:
    - EN aktiv: Blau (`#5B9BFF`)
    - RU aktiv: Rot (`#E05555`)
    - Button-Rahmen passt sich aktiver Sprache an
  - Build erfolgreich getestet
- **Dateien:** `src/app/admin/page.tsx`
- **Commit-Vorschlag:** `2026-02-08 23:00 | Bugfix Student-DB + Aufgabe 13 – Sprachwechsel-Hintergrundfarbe im Admin-Backend`
- **Naechste Aufgabe:** Aufgabe 14 – Flaggen-Anzeige rechts oben

---

### 2026-02-08 – Bugfix v2: Student-Management SQL konsolidiert
- **Aufgabe:** Alle SQL-Fehler fuer Student-Management in einer konsolidierten Datei beheben
- **Was wurde gemacht:**
  - **Neue Datei `supabase/fix_student_management_v2.sql`** erstellt (ersetzt v1 + create_users_table.sql):
  - **Gefundene Probleme:**
    1. **KRITISCH: `public.users` Tabelle existierte nicht in Supabase!** schema.sql war nie ausgefuehrt worden → Gefixt: `CREATE TABLE IF NOT EXISTS` mit allen Spalten
    2. `uuid_generate_v4()` in create_users_table.sql ohne uuid-ossp Extension → Gefixt
    3. `update_student()` RPC: `v_index` falsch berechnet wenn p_level/p_difficulty NULL → Gefixt (nutzt jetzt COALESCE mit bestehenden DB-Werten via Trigger)
    4. `create_student()` RPC: Setzte `pin` Klartext mit Fallback `000000` → Gefixt (nur wenn 6 Ziffern)
    5. Email NOT NULL im schema.sql aber Schueler brauchen keine → Nullable gemacht
    6. Pin NOT NULL im schema.sql → Nullable gemacht (wird durch pin_hash ersetzt)
    7. Bestehende plain-text PINs werden zu bcrypt-Hashes migriert
    8. CHECK-Constraints waren nicht idempotent → Gefixt mit `IF NOT EXISTS` Pruefung
  - **Konsolidierte Datei enthaelt alles:**
    - Extensions (pgcrypto + uuid-ossp)
    - **CREATE TABLE IF NOT EXISTS** mit allen 12 Spalten (funktioniert auf leerer DB!)
    - Spalten-Erweiterung fuer bestehende Tabellen (idempotent)
    - Email + Pin nullable (idempotent via information_schema Pruefung)
    - CHECK-Constraints (dynamisches Entfernen + idempotentes Neusetzen)
    - Trigger fuer performance_index
    - RLS-Policies komplett
    - 5 RPC-Funktionen: verify_user_pin, create_student, update_student, delete_student, list_students
    - Admin-User Seed (idempotent)
    - Daten-Migration (performance_index + pin_hash)
    - **Komplett idempotent** – kann beliebig oft sicher ausgefuehrt werden
  - Build erfolgreich getestet
- **Dateien:** `supabase/fix_student_management_v2.sql` (aktualisiert)
- **Hinweis:** Diese Datei im Supabase SQL Editor ausfuehren! Ersetzt `schema.sql` (users-Teil), `create_users_table.sql` und `fix_student_management.sql`.

---

### 2026-02-08 – Aufgabe 14+15: Flaggen-Anzeige + Klick-Sprachwechsel
- **Aufgabe:** Flaggen-Anzeige rechts oben + Sprachwechsel per Klick
- **Was wurde gemacht:**
  - **DashboardHeader.tsx:**
    - `useLanguage` Hook importiert (locale + setLocale)
    - Flaggen-Button zwischen User-Profil und Admin-Button eingefuegt
    - Zeigt aktuelle Sprache als Emoji-Flagge: EN = 🇬🇧, RU = 🇷🇺
    - Kleines Label daneben (EN/RU, 11px, grau)
    - Klick togglet Sprache (EN ↔ RU) via `setLocale()`
    - Hover-Effekt: Hintergrund heller + leichtes Scale (1.05)
    - Tooltip zeigt Zielsprache
    - Glasmorphismus-Stil, dezent (~22px Flagge)
  - **Admin-Seite (admin/page.tsx):**
    - Alte EN/RU Text-Buttons durch Flaggen-Button ersetzt
    - Gleiche Toggle-Logik (Klick wechselt Sprache)
    - Flaggen-Rahmen passt sich Sprache an (EN=blau, RU=rot)
    - Label-Farbe passt sich an (EN=#5B9BFF, RU=#E05555)
    - Hintergrundfarbe der Seite wechselt weiterhin mit (Aufgabe 13)
  - Build erfolgreich getestet
- **Dateien:** `src/components/dashboard/DashboardHeader.tsx`, `src/app/admin/page.tsx`
- **Commit-Vorschlag:** `2026-02-08 23:30 | Aufgabe 14+15 – Flaggen-Anzeige mit Klick-Sprachwechsel in Dashboard + Admin`
- **Naechste Aufgabe:** Aufgabe 16 – Schueler-Leistungsstufe zuordnen

---

### 2026-02-08 – Aufgabe 16: Schueler-Leistungsstufe zuordnen
- **Aufgabe:** Automatische Leistungsstufen-Anpassung nach Lernsessions + Logging
- **Was wurde gemacht:**
  - **Neue SQL-Migration `supabase/create_performance_evaluation.sql`** erstellt:
    - `performance_log` Tabelle: student_id, old/new_level, old/new_difficulty, old/new_index, correct_rate, total_attempts, reason, created_at
    - Indizes auf student_id und created_at
    - RLS-Policies: Admin lesen, Anon lesen + schreiben (fuer RPC)
    - `evaluate_student_performance(p_student_id, p_min_attempts)` RPC-Funktion:
      - Berechnet Korrektquote aus `student_progress` Tabelle (SUM attempts/correct_count)
      - >80% ueber 50+ Karten → Difficulty erhoehen (easy→middle→hard)
      - Bei hard + >80% → Level erhoehen (A1→A2→B1→B2) und Difficulty zurueck auf easy
      - <40% ueber 50+ Karten → Difficulty senken (hard→middle→easy)
      - Bei easy + <40% → Level senken (B2→B1→A2→A1) und Difficulty zurueck auf hard
      - Aenderung wird in performance_log geloggt
      - Gibt JSON zurueck: evaluated, correct_rate, changed, old/new level/difficulty, message
    - `get_student_stats(p_student_id)` RPC-Funktion fuer Admin-Dashboard-Statistiken
    - SECURITY DEFINER + GRANT EXECUTE fuer anon + authenticated
  - **Neuer Hook `src/lib/usePerformanceEvaluation.ts`** erstellt:
    - `evaluate(minAttempts)` Funktion: Ruft RPC nach Lernsession auf
    - Nur fuer eingeloggte Studenten (nicht Admin, nicht lokaler Fallback)
    - Console-Logging fuer Debugging
    - Gibt `lastResult` zurueck fuer UI-Anzeige
  - **4 Lern-Dialoge integriert:**
    - `VocabularyDialog.tsx`: evaluate() nach Session-Summary, perfMessage-Anzeige (gruene Box mit 🎯)
    - `GrammarDialog.tsx`: Gleiche Integration wie Vocabulary
    - `ComprehensionDialog.tsx`: Gleiche Integration wie Vocabulary
    - `ListeningDialog.tsx`: Gleiche Integration (angepasst an handleAnswerSelect Logik)
    - Alle: perfMessage wird bei Restart/Close zurueckgesetzt
  - Build erfolgreich getestet
- **Dateien:** `supabase/create_performance_evaluation.sql` (neu), `src/lib/usePerformanceEvaluation.ts` (neu), `src/components/learning/VocabularyDialog.tsx`, `src/components/learning/GrammarDialog.tsx`, `src/components/learning/ComprehensionDialog.tsx`, `src/components/learning/ListeningDialog.tsx`
- **Hinweis:** `create_performance_evaluation.sql` muss im Supabase SQL Editor ausgefuehrt werden!
- **Commit-Vorschlag:** `2026-02-08 24:00 | Aufgabe 16 – Automatische Leistungsstufen-Anpassung mit performance_log + evaluate RPC`
- **Naechste Aufgabe:** Aufgabe 17 – Inhalte basierend auf Leistungsstufe filtern

---

### 2026-02-08 – Aufgabe 17: Inhalte basierend auf Leistungsstufe filtern
- **Aufgabe:** learning_items nach Schueler-Level/Difficulty filtern
- **Was wurde gemacht:**
  - **SQL-Migration `supabase/add_level_difficulty_to_learning_items.sql`** erstellt:
    - `level TEXT DEFAULT 'A1'` und `difficulty TEXT DEFAULT 'easy'` Spalten hinzugefuegt (idempotent)
    - CHECK-Constraints fuer erlaubte Werte (idempotent)
    - Index `idx_learning_items_level_difficulty` fuer schnelle Abfragen
    - Bestehende Items auf A1-easy Default gesetzt
    - `get_learning_items_for_student(p_student_id, p_type, p_limit)` RPC-Funktion:
      - Holt Level/Difficulty des Schuelers aus `users` Tabelle
      - 3-stufiger Fallback: 1) Exakter Match → 2) Gleiches Level alle Difficulties → 3) Alle Items
      - LEFT JOIN mit student_progress fuer SRS-Daten
    - `assign_item_level(p_item_id, p_level, p_difficulty)` RPC fuer Admin
  - **4 Lern-Dialoge angepasst:**
    - `VocabularyDialog.tsx`: RPC-Strategy 1 (get_learning_items_for_student) + Fallback direkte Query
    - `GrammarDialog.tsx`: Gleiche 2-Strategy-Logik
    - `ComprehensionDialog.tsx`: Gleiche 2-Strategy-Logik
    - `ListeningDialog.tsx`: Gleiche 2-Strategy-Logik (mit options-Parsing)
    - `LearningItem` Interface um `level?` und `difficulty?` erweitert (alle 4 Dialoge)
  - Build erfolgreich getestet
- **Dateien:** `supabase/add_level_difficulty_to_learning_items.sql` (aktualisiert), `src/components/learning/VocabularyDialog.tsx`, `src/components/learning/GrammarDialog.tsx`, `src/components/learning/ComprehensionDialog.tsx`, `src/components/learning/ListeningDialog.tsx`
- **Hinweis:** `add_level_difficulty_to_learning_items.sql` muss im Supabase SQL Editor ausgefuehrt werden!
- **Commit-Vorschlag:** `2026-02-09 00:30 | Aufgabe 17 – Content-Filterung nach Leistungsstufe mit RPC + Fallback`
- **Naechste Aufgabe:** Aufgabe 18 – User-Zuordnung via Name + 6-stelliger PIN

---

### 2026-02-09 – Aufgabe 18: User-Zuordnung via Name + 6-stelliger PIN
- **Aufgabe:** Login-Seite mit PIN-Pad-Stil (6 einzelne Ziffernfelder)
- **Was wurde gemacht:**
  - **Login-Seite `src/app/login/page.tsx`** umgebaut:
    - Altes Password-Feld (single input) durch 6 einzelne Ziffern-Boxes ersetzt
    - `pinDigits` State als Array von 6 Strings
    - `pinRefs` fuer ref-basiertes Focus-Management
    - `handlePinChange()`: Nur Ziffern, Auto-Focus auf naechstes Feld
    - `handlePinKeyDown()`: Backspace springt zurueck, Arrow-Keys Navigation
    - `handlePinPaste()`: Kompletten 6-stelligen PIN einfuegen
    - PIN-Felder visuell: 48x56px, Glasmorphismus, blauer Rand bei Focus/Ausgefuellt
    - `handleSubmit()`: Zusammensetzen der Digits, Validierung 6 Stellen
    - Bei Fehler: Alle Felder leeren, Focus auf erstes Feld
    - `showPassword` State entfernt (nicht mehr noetig)
  - AuthContext hatte Level + Difficulty bereits im User-Objekt (Aufgabe 11)
  - Build erfolgreich getestet
- **Dateien:** `src/app/login/page.tsx`
- **Commit-Vorschlag:** `2026-02-09 01:00 | Aufgabe 18 – PIN-Pad Login mit 6 einzelnen Ziffernfeldern`
- **Naechste Aufgabe:** Aufgabe 19 – Schueler-DB-Verwaltung erweitert

---

### 2026-02-09 – Aufgabe 19: Schueler-DB-Verwaltung im Admin-Backend
- **Aufgabe:** Erweiterte Schueler-Verwaltung mit Fortschritts-Uebersicht, PIN-Generator, CSV-Export
- **Was wurde gemacht:**
  - **`StudentManagementDialog.tsx`** erweitert:
    - **Fortschritts-Uebersicht** pro Schueler (klappbar):
      - 📊 Button in Schueler-Zeile zum Auf-/Zuklappen
      - Zeigt: Total Attempts, Correct Rate (farbcodiert: gruen >80%, orange 40-80%, rot <40%), Learned/Practiced Items, Last Active Date
      - Nutzt `get_student_stats()` RPC-Funktion (Aufgabe 16)
      - Toggle-Logik: Klick blendet Stats ein/aus
    - **PIN-Generator**:
      - 🎲 Button neben PIN-Eingabefeld
      - Generiert zufaelligen 6-stelligen PIN (`Math.floor(100000 + Math.random() * 900000)`)
      - PIN wird direkt in Formular uebernommen
    - **CSV-Export**:
      - 📥 CSV Button im Header (neben "Add New")
      - Exportiert alle Schueler: Name, Email, WhatsApp, Level, Difficulty, Index-Key
      - UTF-8 BOM (`\uFEFF`) fuer korrekte Umlaute in Excel
      - Dateiname: `students_YYYY-MM-DD.csv`
  - **`useTranslation.ts`** (FALLBACK_EN): 7 neue Keys hinzugefuegt:
    - `students.show_stats`, `students.stats_not_available`, `students.stats_attempts`
    - `students.stats_correct_rate`, `students.stats_items_learned`, `students.stats_last_active`
    - `students.generate_pin`
  - Build erfolgreich getestet
- **Dateien:** `src/components/admin/StudentManagementDialog.tsx`, `src/lib/useTranslation.ts`
- **Commit-Vorschlag:** `2026-02-09 01:30 | Aufgabe 19 – Erweiterte Schueler-Verwaltung mit Stats, PIN-Generator, CSV-Export`

---

### 2026-02-08 – Aufgabe 20: Sprache dauerhaft fuer Session beibehalten
- **Aufgabe:** Sprachauswahl im Login persistieren (localStorage + Supabase User-Profil)
- **Was wurde gemacht:**
  - SQL-Migration `supabase/add_preferred_locale.sql` erstellt:
    - `preferred_locale TEXT DEFAULT 'en'` Spalte zu `users` hinzugefuegt (idempotent)
    - CHECK-Constraint: nur `'en'` oder `'ru'` erlaubt
    - `update_user_locale(p_user_id, p_locale)` RPC-Funktion (SECURITY DEFINER)
    - `verify_user_pin()` erweitert: gibt jetzt `user_preferred_locale` zurueck
  - `AuthContext.tsx` erweitert:
    - `User` Interface um `preferred_locale?: 'en' | 'ru'` ergaenzt
    - Login-Strategy 1 (RPC): `preferred_locale` aus `user_preferred_locale` gelesen
    - Login-Strategy 2 (direkt): `preferred_locale` aus SELECT gelesen
  - `LanguageContext.tsx` erweitert:
    - `syncLocaleFromUser(preferredLocale)` Methode: Setzt Locale aus User-Profil nach Login
    - `setLocale()`: Speichert Sprachwechsel auch in Supabase (fire-and-forget via RPC)
    - Aktualisiert `greeklingua_user` in localStorage mit neuer Sprache
  - `login/page.tsx`: Nach erfolgreichem Login wird `syncLocaleFromUser()` aufgerufen
  - Build erfolgreich getestet
- **Dateien:** `supabase/add_preferred_locale.sql` (neu), `src/context/LanguageContext.tsx`, `src/context/AuthContext.tsx`, `src/app/login/page.tsx`
- **Hinweis:** `add_preferred_locale.sql` muss im Supabase SQL Editor ausgefuehrt werden!
- **Commit-Vorschlag:** `2026-02-08 23:45 | Aufgabe 20 – Sprachpersistenz in localStorage + Supabase User-Profil`
- **Naechste Aufgabe:** Aufgabe 21 – Sprachwechsel auf Frontend-Mainpage

---

### 2026-02-08 – Aufgabe 21+22: Sprachwechsel + sofortige UI-Aktualisierung (bereits implementiert)
- **Aufgabe:** Sprachwechsel auf Frontend-Mainpage + sofortige UI-Aktualisierung
- **Was wurde gemacht:**
  - **Bereits vorhanden** – keine Code-Aenderungen noetig:
    - Login-Seite: EN/RU Toggle-Buttons
    - DashboardHeader: Flaggen-Toggle (Dashboard + Student-Seite)
    - Admin-Seite: Flaggen-Toggle
    - `useTranslation` Hook: Reagiert reaktiv auf `locale` via `useLanguage()`, Cache pro Locale, Race-Condition-Schutz
    - Alle Komponenten nutzen `t('key')` – werden bei Sprachwechsel automatisch re-gerendert
- **Dateien:** Keine Aenderungen
- **Commit-Vorschlag:** Dokumentation in CLAUDE.md

---

### 2026-02-08 – Aufgabe 23: Toast bei Sprachwechsel anzeigen
- **Aufgabe:** Kurzes Toast/Pop-up bei jedem Sprachwechsel
- **Was wurde gemacht:**
  - **Neue Datei `src/components/ui/LanguageToast.tsx`** erstellt:
    - Toast-Nachrichten in aktiver Sprache:
      - EN: "Language changed to English." mit Flagge
      - RU: "Язык изменён на Русский." mit Flagge
    - Erscheint fuer 2.5 Sekunden, verschwindet automatisch
    - Position: oben mittig (fixed, z-index: 9999)
    - Kein Toast beim ersten Mount (nur bei tatsaechlichem Sprachwechsel)
    - Farblich passend zur Sprache (EN=blauer Hintergrund/Rand, RU=roter Hintergrund/Rand)
    - Glasmorphismus-Stil (backdrop-filter blur)
    - Animation: slideIn mit cubic-bezier bounce
  - **`src/app/layout.tsx`** aktualisiert:
    - `LanguageToast` importiert und innerhalb `LanguageProvider` eingebunden
    - Global sichtbar auf allen Seiten (Login, Dashboard, Admin)
  - Build erfolgreich getestet
- **Dateien:** `src/components/ui/LanguageToast.tsx` (neu), `src/app/layout.tsx`
- **Commit-Vorschlag:** `2026-02-08 23:55 | Aufgabe 20-23 – Sprachpersistenz, Sprachwechsel-Toast, UI-Aktualisierung`

---

### 2026-02-09 – Aufgabe 24-30: Dashboard UI-Texte vollstaendig in DB erfassen
- **Aufgabe:** Alle hardcodierten UI-Texte der Dashboard Main Page identifizieren, in DB einfuegen, durch t() ersetzen
- **Was wurde gemacht:**
  - **Aufgabe 24:** Inventar aller hardcodierten Strings in 4 Dashboard-Komponenten:
    - DashboardHeader: 2 Tooltip-Strings (Switch to Russian/English)
    - ActionGrid: 8 Toast-Messages (showToast-Aufrufe)
    - ModuleGrid: 1 Alert-Text ("Opening module: ")
    - StatsCard: 1 Stunden-Suffix ("h")
  - **Aufgabe 25:** SQL-Datei `supabase/insert_missing_dashboard_translations.sql` erstellt:
    - 12 Keys x 2 Sprachen = 24 Eintraege
    - Idempotent via ON CONFLICT DO UPDATE
    - Keys: header.switch_to_ru/en, action_grid.toast_*, modules.opening, stats.hours_suffix
  - **Aufgabe 26:** `DashboardHeader.tsx` – Flaggen-Tooltip hardcoded Strings durch `t('header.switch_to_ru')` / `t('header.switch_to_en')` ersetzt
  - **Aufgabe 27:** `ActionGrid.tsx` – 8 Toast-Messages durch `t('action_grid.toast_*')` ersetzt
  - **Aufgabe 28:** `ModuleGrid.tsx` – Alert-Text durch `t('modules.opening')` ersetzt
  - **Aufgabe 29:** `StatsCard.tsx` – Stunden-Suffix "h" durch `t('stats.hours_suffix')` ersetzt
  - **Aufgabe 30:** FALLBACK_EN in `useTranslation.ts` um 12 neue Keys ergaenzt, Build erfolgreich getestet
- **Dateien:** `supabase/insert_missing_dashboard_translations.sql` (neu), `src/components/dashboard/DashboardHeader.tsx`, `src/components/dashboard/ActionGrid.tsx`, `src/components/dashboard/ModuleGrid.tsx`, `src/components/dashboard/StatsCard.tsx`, `src/lib/useTranslation.ts`
- **Hinweis:** `insert_missing_dashboard_translations.sql` muss im Supabase SQL Editor ausgefuehrt werden!
- **Commit-Vorschlag:** `2026-02-09 02:00 | Aufgabe 24-30 – Dashboard UI-Texte vollstaendig in DB, hardcodierte Strings durch t() ersetzt`

---

### 2026-02-09 – Aufgabe 31-38: Phase 5 – Griechisch (el) als dritte UI-Sprache
- **Aufgabe:** Komplette Erweiterung der App von 2 auf 3 UI-Sprachen (EN + RU + EL)
- **Was wurde gemacht:**
  - **Aufgabe 31: Locale-Typ erweitert**
    - `Locale = 'en' | 'ru' | 'el'` in LanguageContext, AuthContext, useTranslation
    - `translationCache` und `fetchPromises` um `el` erweitert
    - LanguageToast um griechische Nachricht + Farben ergaenzt (TOAST_COLORS Record)
  - **Aufgabe 32: FALLBACK_EL erstellt**
    - ~130 griechische Fallback-Uebersetzungen in `useTranslation.ts`
    - `getFallback(locale)` Helper-Funktion fuer locale-abhaengige Fallbacks
    - Fallback-Kette: `translations[key] || localeFallback[key] || FALLBACK_EN[key] || key`
  - **Aufgabe 33+38: SQL griechische Uebersetzungen + CHECK-Constraints**
    - `supabase/insert_greek_translations.sql` erstellt
    - ~130 griechische Uebersetzungen mit `ON CONFLICT DO UPDATE`
    - CHECK-Constraints auf `ui_translations.lang` und `users.preferred_locale` erweitert
    - `update_user_locale()` RPC auf 3 Sprachen erweitert
  - **Aufgabe 34: Login-Seite 3-Sprachen-Auswahl**
    - EN/RU Toggle durch 3-Button-Auswahl ersetzt (EN / RU / EL)
    - Hintergrund-Gradient fuer Griechisch (cyan-blau, #0d2847)
    - Canvas-Partikel: Hue 190-220 (cyan-blau), Linienfarbe 13,110,253
    - Gradient Orbs fuer Griechisch angepasst
    - Divider dreisprachig: "or" / "или" / "ή"
  - **Aufgabe 35: DashboardHeader 3-Sprachen-Toggle**
    - 2-Wege-Toggle durch 3-Wege-Rotation ersetzt (EN→RU→EL→EN)
    - Flagge zeigt 🇬🇧 / 🇷🇺 / 🇬🇷, Label EN/RU/EL
    - Tooltip nutzt `header.switch_to_el` Key
  - **Aufgabe 36: Admin-Seite 3-Sprachen-Toggle**
    - Gleiche 3-Wege-Rotation wie DashboardHeader
    - Hintergrund-Gradient fuer EL definiert (griechisches Blau #0d2847)
    - Header-Background und Border fuer EL angepasst
    - Flaggen-Rahmenfarbe EL: #0D6EFD, Label-Farbe: #0D6EFD
  - **Aufgabe 37: LanguageToast** (bereits in Aufgabe 31 erledigt)
  - Build erfolgreich getestet ✅
- **Dateien:** `src/context/LanguageContext.tsx`, `src/context/AuthContext.tsx`, `src/lib/useTranslation.ts`, `src/components/ui/LanguageToast.tsx`, `src/app/login/page.tsx`, `src/components/dashboard/DashboardHeader.tsx`, `src/app/admin/page.tsx`, `supabase/insert_greek_translations.sql` (neu), `ToDo.md`
- **Hinweis:** `supabase/insert_greek_translations.sql` muss im Supabase SQL Editor ausgefuehrt werden!
- **Commit-Vorschlag:** `2026-02-09 03:00 | Aufgabe 31-38 – Griechisch (EL) als dritte UI-Sprache komplett implementiert`

---

### 2026-02-09 – Aufgabe 39-46: Phase 6 – Deutsch (de) als vierte UI-Sprache
- **Aufgabe:** Komplette Erweiterung der App von 3 auf 4 UI-Sprachen (EN + RU + EL + DE)
- **Was wurde gemacht:**
  - **Aufgabe 39: Locale-Typ erweitert**
    - `Locale = 'en' | 'ru' | 'el' | 'de'` in LanguageContext, AuthContext, useTranslation
    - `translationCache` und `fetchPromises` um `de` erweitert
    - `preferred_locale` Typ in AuthContext um `'de'` erweitert (inkl. alle Casts)
  - **Aufgabe 40: FALLBACK_DE erstellt**
    - ~130 deutsche Fallback-Uebersetzungen in `useTranslation.ts`
    - `getFallback(locale)` um `de` erweitert
    - `FALLBACKS` Record um `de: FALLBACK_DE` erweitert
    - `header.switch_to_de` in FALLBACK_EN und FALLBACK_EL ergaenzt
  - **Aufgabe 41+46: SQL deutsche Uebersetzungen + CHECK-Constraints**
    - `supabase/insert_german_translations.sql` erstellt
    - ~130 deutsche Uebersetzungen mit `ON CONFLICT DO UPDATE`
    - CHECK-Constraints auf `ui_translations.lang` und `users.preferred_locale` auf 4 Sprachen erweitert
    - `update_user_locale()` RPC auf 4 Sprachen erweitert
  - **Aufgabe 42: Login-Seite 4-Sprachen-Auswahl**
    - 3-Button-Auswahl durch 4-Button-Auswahl ersetzt (EN / RU / EL / DE)
    - Hintergrund-Gradient fuer Deutsch (warmer Goldton, #3d3010)
    - Canvas-Partikel: Hue 35-55 (gold/amber), Linienfarbe 218,165,32
    - Gradient Orbs fuer Deutsch angepasst (rgba(218, 165, 32))
    - Divider viersprachig: "or" / "или" / "ή" / "oder"
  - **Aufgabe 43: DashboardHeader 4-Sprachen-Toggle**
    - 3-Wege-Toggle durch 4-Wege-Rotation ersetzt (EN→RU→EL→DE→EN)
    - Flagge zeigt 🇬🇧 / 🇷🇺 / 🇬🇷 / 🇩🇪, Label EN/RU/EL/DE
    - Tooltip nutzt `header.switch_to_de` Key
  - **Aufgabe 44: Admin-Seite 4-Sprachen-Toggle**
    - Gleiche 4-Wege-Rotation wie DashboardHeader
    - Hintergrund-Gradient fuer DE definiert (warmer Goldton #2a2010)
    - Header-Background und Border fuer DE angepasst
    - Flaggen-Rahmenfarbe DE: rgba(218, 165, 32, 0.2), Label-Farbe: #DAA520
  - **Aufgabe 45: LanguageToast**
    - Toast fuer DE: "Sprache auf Deutsch geaendert." mit 🇩🇪
    - Farbschema: gold/amber (bg rgba(50, 40, 10), border rgba(218, 165, 32))
  - Build erfolgreich getestet ✅
- **Dateien:** `src/context/LanguageContext.tsx`, `src/context/AuthContext.tsx`, `src/lib/useTranslation.ts`, `src/components/ui/LanguageToast.tsx`, `src/app/login/page.tsx`, `src/components/dashboard/DashboardHeader.tsx`, `src/app/admin/page.tsx`, `supabase/insert_german_translations.sql` (neu), `ToDo.md`
- **Hinweis:** `supabase/insert_german_translations.sql` muss im Supabase SQL Editor ausgefuehrt werden!
- **Commit-Vorschlag:** `2026-02-09 04:00 | Aufgabe 39-46 – Deutsch (DE) als vierte UI-Sprache komplett implementiert`

---

### 2026-02-09 – Aufgabe 47: "Dein Unterricht" Button + LessonDialog + Datenbank
- **Aufgabe:** Button "Magische Runde" umbenennen, Unterrichts-Dialog erstellen, Datenbank fuer Lektionen
- **Was wurde gemacht:**
  - **Button umbenannt (alle 4 Sprachen):**
    - `action.magic_round`: EN "Your Lesson", RU via DB, EL "Το μάθημά σου", DE "Dein Unterricht"
    - `action_grid.magic_round` + `action_grid.toast_magic_round` ebenfalls aktualisiert
    - Icon geaendert: ✨ → 👩‍🏫 (Lehrerin)
    - Button war `disabled` → jetzt aktiv mit onClick
  - **SQL-Migration `supabase/create_lesson_sessions.sql`** erstellt:
    - `lesson_sessions` Tabelle: id, student_id (FK→users), date, topic, created_at, updated_at
    - `lesson_vocabulary` Tabelle: id, session_id (FK→lesson_sessions), source_word, greek_word, sort_order
    - UNIQUE(student_id, date) – ein Eintrag pro Schueler+Tag
    - Indizes fuer schnelle Abfragen
    - Trigger fuer automatische updated_at Aktualisierung
    - RLS-Policies: Admin voll, Student eigene, Anon via RPC
    - 5 RPC-Funktionen (SECURITY DEFINER):
      - `get_lesson_sessions(student_id)` – Liste aller Sitzungen
      - `get_lesson_detail(session_id)` – Einzelne Sitzung mit Vokabeln
      - `upsert_lesson_session(student_id, date, topic)` – Erstellen/Aktualisieren
      - `set_lesson_vocabulary(session_id, vocabulary_json)` – Vokabeln setzen
      - `delete_lesson_session(session_id)` – Loeschen
  - **`src/components/learning/LessonDialog.tsx`** erstellt:
    - Modal-Dialog im gleichen Layout wie VocabularyDialog
    - 2 Ansichten: Sitzungsliste → Detailansicht
    - Sitzungsliste: Datum (lokal formatiert), Thema, Vokabelanzahl
    - Detailansicht: Thema-Box, 2-spaltige Vokabeltabelle (#, Uebersetzung, Griechisch)
    - Nur Abbrechen-Button (kein X-Button)
    - Glasmorphismus-Stil wie alle anderen Dialoge
  - **Dashboard-Integration:**
    - `LessonDialog` importiert in `dashboard/page.tsx`
    - `isLessonDialogOpen` State hinzugefuegt
    - ActionTile onClick oeffnet Dialog
    - Dialog-Komponente am Ende gerendert
  - **Uebersetzungen (4 Sprachen):**
    - 12 neue `lesson.*` Keys in FALLBACK_EN, FALLBACK_EL, FALLBACK_DE
    - RU nutzt FALLBACK_EN (wird via Supabase DB uebersetzt)
  - Build erfolgreich getestet ✅
- **Dateien:** `supabase/create_lesson_sessions.sql` (neu), `src/components/learning/LessonDialog.tsx` (neu), `src/app/dashboard/page.tsx`, `src/components/dashboard/ActionGrid.tsx`, `src/lib/useTranslation.ts`
- **Hinweis:** `create_lesson_sessions.sql` muss im Supabase SQL Editor ausgefuehrt werden!
- **Commit-Vorschlag:** `2026-02-09 05:00 | Aufgabe 47 – "Dein Unterricht" Button + LessonDialog + lesson_sessions DB`

---

### 2026-02-12 – 4-stelliger PIN-Login + Modernes Glasmorphismus-Popup
- **Aufgabe:** Neuer Login-Screen mit 4-stelligem PIN, numerischer Tastatur, modernem Welcome-Popup
- **Was wurde gemacht:**
  - **Neue Route `/login-pin`:**
    - Neue Datei `src/app/login-pin/page.tsx` erstellt
    - On-Screen numerische Tastatur (0-9, Backspace ⌫, Clear C)
    - 4 grosse Ziffern-Boxen (64x72px) mit Live-Anzeige
    - Buttons: "Abbrechen" (zurueck zu `/login`) + "Anmelden"
    - Sprachabhängige Hintergrund-Animation (EN/RU/EL/DE)
    - Glasmorphismus-Design analog zur gesamten App
    - **Admin-Button** oben rechts (👤 Admin, Gold-Style) → navigiert zu `/login`
  - **Datenbank-Erweiterung:**
    - SQL-Migration `supabase/extend_users_for_4digit_pin.sql` erstellt
    - Neue Spalte `pin_4digit` in `users` Tabelle
    - RPC-Funktion `verify_user_4digit_pin(p_pin)` fuer sichere PIN-Validierung
    - 5 Testnutzer (A1-Beginner) mit PINs: 3741, 8192, 5624, 7358, 9103
    - **Admin-Info:** Keine separate Admin-Tabelle, Admins in `users` mit `role='admin'`
  - **Welcome-Popup (Glasmorphismus-Design):**
    - Modernes Modal-Popup statt nativen Alerts
    - Erfolgs-Popup (✅): Zeigt Name, Stufe (lila Badge), Level (gruen Badge)
    - Fehler-Popup (❌): Roter Hintergrund, "PIN nicht gefunden"
    - Backdrop: Blur-Effekt (backdrop-filter blur 8px)
    - Animationen: fadeIn + popIn mit cubic-bezier bounce
    - Auto-Close nach 1 Sekunde
  - **Login-Flow optimiert:**
    - Bei gültigem PIN: Welcome-Popup → 1 Sekunde → **Direkter Login** (window.location.href)
    - Bei ungültigem PIN: Fehler-Popup → 1 Sekunde → Eingabe leeren
    - Kein doppelter Dialog mehr, kein Force-Reload
  - **Admin-Login (`/login`) modernisiert:**
    - **Username vorausgefüllt:** "Admin"
    - **CAPTCHA hinzugefügt:** Einfache Math-Aufgabe (z.B. "7 + 3 = ?")
    - CAPTCHA-Validierung vor Login-Versuch
    - Auto-Regenerate bei Fehler oder falschem Login
    - **PIN-Login-Option entfernt** (war "4-Digit PIN Login" Button)
  - **Navigation:**
    - Standard-Route: `/login-pin` (für Schüler)
    - Admin-Route: `/login` (für Admin, nur über Button auf PIN-Login erreichbar)
  - **Dateien:**
    - `src/app/login-pin/page.tsx` (Admin-Button + direkter Login)
    - `src/app/login/page.tsx` (CAPTCHA + Admin-Vorausfüllung)
    - `supabase/extend_users_for_4digit_pin.sql`
    - `scripts/create-test-pin-users.js`
  - Build erfolgreich getestet ✅
- **Commits:**
  - `2026-02-12 15:45` – Neuer 4-Digit PIN-Login Dialog
  - `2026-02-12 16:15` – PIN-Login Popup optimiert + CLAUDE.md
  - `2026-02-12 17:00` – Login-Flow optimiert - PIN direkt + Admin-CAPTCHA
- **Hinweis:** SQL-Migration muss in Supabase SQL Editor ausgefuehrt werden!

---

### 2026-02-13 – Phase 8: Production Deployment - Login-Modul absichern
- **Aufgabe:** Login-Modul production-ready machen
- **Was wurde gemacht:**
  - **Aufgabe 55: ENV-Variablen abgesichert**
    - .env.example Template erstellt mit allen erforderlichen Variablen
    - Dokumentation welche ENV-Variablen zwingend erforderlich sind
  - **Aufgabe 56: API-Route gehärtet (honeypot-alert)**
    - Rate Limiting: 10 Requests pro Minute pro IP
    - PIN-Validierung: Nur gültige 4-stellige PINs akzeptiert
    - IP-Logging für Audit-Trail
    - Error-Handling (HTTP 429/400/500)
  - **Aufgabe 57: .gitignore geprüft**
    - Alle sensitiven Dateien (.env, .env.local, .env.production) ignoriert
    - Build-Artefakte (.next, node_modules) ignoriert
  - **Aufgabe 58: Production-Dokumentation erstellt**
    - `docs/PRODUCTION-DEPLOYMENT.md` erstellt
    - Deployment-Checkliste für Vercel
    - ENV-Setup Anleitung
    - Database Migrations Übersicht
    - Security Best Practices
    - Troubleshooting Guide
  - **Aufgabe 59: TypeScript Syntax-Fehler behoben**
    - 4x falsche Kommas vor `success` Field in `login-pin/page.tsx` behoben
    - tsconfig.json: `supabase/functions` aus Build ausgeschlossen
  - **Aufgabe 60: Production-Build erfolgreich**
    - `npm run build` erfolgreich ✅
    - Alle 12 Routen gebaut
    - TypeScript Compilation ohne Fehler
- **Dateien:**
  - `.env.example` (neu)
  - `docs/PRODUCTION-DEPLOYMENT.md` (neu)
  - `src/app/api/honeypot-alert/route.ts` (aktualisiert)
  - `src/app/login-pin/page.tsx` (Syntax-Fehler behoben)
  - `tsconfig.json` (Supabase Functions ausgeschlossen)
  - `ToDo.md` (Phase 8 hinzugefügt)
- **Commit-Vorschlag:** `2026-02-13 | Phase 8 – Login-Modul production-ready (ENV, Rate Limiting, Build-Fix)`

---

### Projekt-Status
- Phase 1 (Aufgaben 1-8): Mehrsprachige UI komplett ✅
- Phase 2 (Aufgaben 9-19): Admin-Backend + Schueler-Management komplett ✅
- Phase 3 (Aufgaben 20-23): Sprachpersistenz + UX komplett ✅
- Phase 4 (Aufgaben 24-30): Dashboard UI-Texte vollstaendig in DB ✅
- Phase 5 (Aufgaben 31-38): Griechisch (EL) als dritte UI-Sprache ✅
- Phase 6 (Aufgaben 39-46): Deutsch (DE) als vierte UI-Sprache ✅
- Phase 7 (Aufgabe 47): "Dein Unterricht" Feature ✅
- **Phase 8 (Aufgaben 55-60): Production Deployment – Login-Modul absichern ✅**
- SQL-Dateien die im Supabase SQL Editor ausgefuehrt werden muessen:
  1. `supabase/fix_student_management_v2.sql` (Users-Tabelle + RPC)
  2. `supabase/create_performance_evaluation.sql` (Performance-Log + Evaluation)
  3. `supabase/add_level_difficulty_to_learning_items.sql` (Level/Difficulty fuer Items)
  4. `supabase/add_preferred_locale.sql` (Sprach-Persistenz + update_user_locale RPC)
  5. `supabase/insert_missing_dashboard_translations.sql` (Fehlende Dashboard-Uebersetzungen)
  6. `supabase/insert_greek_translations.sql` (Griechische Uebersetzungen + CHECK-Constraints)
  7. `supabase/insert_german_translations.sql` (Deutsche Uebersetzungen + CHECK-Constraints)
  8. `supabase/create_lesson_sessions.sql` (Unterrichts-Tabellen + RPC-Funktionen)
