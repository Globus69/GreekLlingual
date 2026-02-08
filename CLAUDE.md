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
