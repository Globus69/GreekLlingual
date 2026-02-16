# Projektübersicht – Hellenic Horizons: GreekLingua Dashboard

**Letztes Update:** 16. Februar 2026
**Projekttyp:** Web-basierte Griechisch-Lernplattform mit Spaced Repetition System (SRS)
**Zielgruppe:** Griechisch-Lernende (Levels A1-B2)

---

## 1. Allgemeine Technologie-Stack

### Frontend
- **Framework:** Next.js 16.1.3 (App Router)
- **React:** Version 19.2.3
- **TypeScript:** Version 5.x
- **Styling:** TailwindCSS v4.1.18 (neueste Version)
- **UI-Komponenten:**
  - Radix UI (Dialog, Dropdown, Select, Checkbox, Tooltip, Label, Slot)
  - Lucide React (Icons)
  - Sonner (Toast-Benachrichtigungen)
  - Custom Glassmorphismus-Komponenten

### Backend
- **Runtime:** Next.js API Routes (Server-seitig)
- **Datenbank:** Supabase PostgreSQL
- **ORM/Query:** Supabase JS Client (@supabase/supabase-js 2.91.0)
- **RPC-Funktionen:** PostgreSQL Stored Procedures (via Supabase RPC)

### Authentifizierung & Sicherheit
- **Auth-System:** Custom 4-Digit PIN (keine Email/Password)
  - Admin: Username + 6-stellige PIN + 2FA (TOTP)
  - Student: Name + 4-stellige PIN
- **Session-Management:** Aktuell localStorage (⚠️ geplant: httpOnly Cookies)
- **Session-Timeout:**
  - Admin: 15 Minuten
  - Student: 24 Stunden
- **Rate-Limiting:** Upstash Redis (@upstash/ratelimit 2.0.8)
  - PIN-Login: 5 Versuche / 15 Min
  - Admin-Login: 3 Versuche / 15 Min (fail-closed seit 16. Feb 2026)
- **Security Features:**
  - Device Fingerprinting (FingerprintJS 5.0.1)
  - Honeypot-Traps gegen Bots
  - Zod Input-Validation (SQL-Injection-Schutz, seit 16. Feb 2026)
  - Row-Level Security (RLS) in Supabase
  - Account-Lockout nach 5 Fehlversuchen
  - Telegram-Alerts bei verdächtigen Login-Versuchen

### State-Management
- **React Context API:**
  - `AuthContext` → User-Session, Login/Logout
  - `LanguageContext` → i18n Locale-Verwaltung
- **Lokaler State:** useState, useEffect, useMemo, useCallback

### Internationalisierung (i18n)
- **System:** Custom Context-basierte Lösung (kein i18next)
- **Unterstützte Sprachen:**
  - Englisch (en) – Default
  - Russisch (ru)
  - Griechisch (el) – nur Desktop/Backend (nicht auf Mobile-Login seit 16. Feb)
  - Deutsch (de)
  - Spanisch (es) – seit 16. Feb 2026
- **Fallback-System:** FALLBACK_EN, FALLBACK_RU, FALLBACK_DE, FALLBACK_ES
- **Persistenz:** localStorage + Supabase DB (users.preferred_locale)

### Sonstige Tools / Services
- **Formulare:** React Hook Form 7.71.1 + Hookform Resolvers
- **Validierung:** Zod 4.3.6 (Schema-Validierung)
- **Datum:** date-fns 4.1.0
- **CSV-Import:** papaparse 5.5.3
- **QR-Code:** qrcode 1.5.4 (für 2FA)
- **2FA:** otpauth 9.5.0 (TOTP)
- **Swipe-Gesten:** react-swipeable 7.0.2 (Flashcard-Navigation)
- **Deployment:** Vercel (siehe .vercel/-Ordner)

---

## 2. Bereits implementierte Lern- / Flashcard-Funktionalitäten

### 2.1 Grammar-Modul (FSRS-6 basiert)
**Status:** ✅ Vollständig implementiert
**Pfad:** `src/components/learning/grammar-dialog-fsrs.tsx`

**Features:**
- **Spaced Repetition:** FSRS-6-Algorithmus (Free Spaced Repetition Scheduler)
  - 21 optimierte Parameter
  - Adaptive Schwierigkeitsanpassung (difficulty 1-10)
  - Stabilitätsberechnung (stability)
  - Desired Retention: 90%
  - Maximum Interval: 36500 Tage (100 Jahre)
  - Fuzz Factor: ±5% (Zufallsstreuung)
- **4 Rating-Stufen:**
  - Again (1) – Rot – Karte erneut lernen
  - Hard (2) – Orange – Schwierig, aber verstanden
  - Good (3) – Grün – Gut erinnert
  - Easy (4) – Blau – Sehr einfach
- **Flashcard-Interface:**
  - Vorderseite: Englische/Russische Beschreibung + Beispiel
  - Rückseite: Griechische Grammatikregel + Beispiel
  - Phonetische Transkription (IPA)
  - Flip-Animation (Klick oder Leertaste)
- **Text-to-Speech (TTS):**
  - Automatische Wiedergabe beim Umdrehen (optional)
  - Manuelle Wiedergabe-Steuerung
  - Geschwindigkeitsregelung (Slow/Normal/Fast: 0.6x, 0.9x, 1.2x)
  - Greek TTS mit `el-GR` Locale (Web Speech API)
  - Auto-Play-Toggle mit localStorage-Persistenz
- **Keyboard Shortcuts:**
  - 1-4: Rating-Buttons
  - Space: Karte umdrehen
  - A: Audio abspielen
- **Swipe-Gesten (Mobile/Touch):**
  - Swipe Right: Easy (4)
  - Swipe Left: Again (1)
  - Swipe Up: Good (3)
  - Swipe Down: Hard (2)
  - Visual Feedback: Farbcodierte Overlays
- **Session Tracking:**
  - Start/End via RPC (`start_learning_session`, `end_learning_session`)
  - Statistiken: Karten geübt, korrekt beantwortet
  - Session-Dauer in Minuten
- **Streak-System:**
  - Automatische Aktualisierung nach Session
  - Milestone-Benachrichtigungen
  - Rekord-Tracking (longest_streak)
- **UI/UX:**
  - Progress Bar mit Prozentanzeige
  - Session Stats Mini (Again/Hard/Good/Easy Chips)
  - Offline-Detection mit Warnungen
  - Toast-Benachrichtigungen (Sonner)
  - Glassmorphismus-Design

### 2.2 Daily Phrases-Modul
**Status:** 🚧 In Entwicklung
**Pfad:** `modules/daily-phrases/`

**Features:**
- Täglich genau **3 Phrasen** (Morgen, Mittag, Abend)
- Ganze Sätze / Alltagsausdrücke (keine Einzelwörter)
- Eigene Due-Logik (unabhängig von Vocabulary)
- Content-Generierung und Dashboard-Integration
- **Abgrenzung:** Keine Vermischung mit Vocabulary oder Grammar

### 2.3 Vocabulary-Modul (FSRS-6, in Arbeit)
**Status:** 🟡 Phase 1-4 abgeschlossen (46% Gesamt)
**Pfad:** `modules/vocabulary/`, `src/components/learning/vocabulary-dialog-fsrs.tsx`

**Features (geplant/teilweise implementiert):**
- Klassische Vokabelkarten (Einzelwörter, kurze Wendungen)
- FSRS-6 Spaced Repetition (wie Grammar)
- 4 Rating-Buttons (Again/Hard/Good/Easy)
- Phonetische Transkription + TTS
- Swipe-Gesten
- Session Tracking
- Progress-Anzeige
- **Aktueller Stand (laut TODO):**
  - ✅ Phase 1: FSRS-6 Core Library (teilweise)
  - ✅ Phase 2: Supabase DB-Schema (vollständig)
  - ✅ Phase 3: VocabularyDialog (vollständig)
  - ✅ Phase 4: Lautschrift & TTS (vollständig)
  - 🔜 Phase 5: Analytics & Stats (geplant)
  - 🔜 Phase 6: Mobile PWA (geplant)
  - 🔜 Phase 7: Desktop Tauri (optional)
  - 🔜 Phase 8: Testing & Optimierung (kritisch)

### 2.4 Bewertungssystem (Spaced Repetition)
**FSRS-6 Algorithmus:**
- **State-Machine:** new → learning → review → relearning (bei Again)
- **Difficulty-Anpassung:** Δd = rating - 3 (kann -2, -1, 0, +1 sein)
- **Stability-Formel:**
  ```
  S' = S * (1 + e^w[8] * (11-D) * S^-w[9] * (e^((1-R)*w[10]) - 1) * hardPenalty * easyBonus)
  ```
- **Interval-Berechnung:**
  ```
  interval = stability * (ln(desiredRetention) / ln(0.9))
  ```
- **Review-Logs:** Vollständige Historie in `fsrs_review_logs`

### 2.5 Weitere Modi (in Dokumentation erwähnt, ggf. geplant)
- Matching-Spiele (Quizlet-ähnlich)
- Multiple Choice
- Schreib-Übungen
- Hör-Übungen
- Gravity-ähnliche Spiele (siehe TODO.md)

---

## 3. Datenmodell (wichtigste Schemata / Collections / Tables)

**Datenbank:** Supabase PostgreSQL mit Row-Level Security (RLS)
**Migration-Pfad:** `database/migrations/`
**Haupt-Bootstrap:** `database/migrations/001_00_bootstrap_all.sql`

### 3.1 `users` Tabelle
**Zweck:** Benutzerkonten, Profile, Sessions

**Schema:**
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    pin TEXT,
    name TEXT,
    pin_hash TEXT,                        -- bcrypt Hash
    whatsapp TEXT,
    role TEXT NOT NULL DEFAULT 'student', -- 'admin' | 'student'
    level TEXT DEFAULT 'A1',              -- 'A1' | 'A2' | 'B1' | 'B2'
    difficulty TEXT DEFAULT 'easy',       -- 'easy' | 'middle' | 'hard'
    performance_index TEXT DEFAULT 'A1-easy', -- Auto-generiert: level-difficulty
    preferred_locale TEXT DEFAULT 'en',   -- 'en' | 'ru' | 'el' | 'de' | 'es'
    streak_days INT DEFAULT 0,
    last_activity_date DATE,
    longest_streak INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Constraints:**
- `users_role_check`: role IN ('admin', 'student')
- `users_level_check`: level IN ('A1', 'A2', 'B1', 'B2')
- `users_difficulty_check`: difficulty IN ('easy', 'middle', 'hard')
- `users_preferred_locale_check`: preferred_locale IN ('en', 'ru', 'el', 'de') ⚠️ (fehlt 'es')

**RLS-Policies:**
- Admin: Full Access
- Students: Nur eigene Daten (SELECT wo auth.uid() = id)
- Anon: Read-Only für Login-Verifizierung

**Trigger:**
- `update_performance_index()`: Setzt performance_index = level || '-' || difficulty

### 3.2 `learning_items` Tabelle
**Zweck:** Lernkarten (Vocabulary, Grammar, Daily Phrases)

**Schema (auszugsweise):**
```sql
CREATE TABLE public.learning_items (
    id UUID PRIMARY KEY,
    type TEXT,                    -- 'vocabulary' | 'grammar' | 'phrase'
    english TEXT,                 -- Englische Übersetzung
    greek TEXT,                   -- Griechisches Wort/Satz
    greek_word TEXT,              -- Griechisches Wort (ggf. redundant)
    phonetic TEXT,                -- IPA-Lautschrift
    example_sentence TEXT,
    level TEXT,                   -- 'A1' | 'A2' | 'B1' | 'B2'
    difficulty TEXT,              -- 'easy' | 'middle' | 'hard'

    -- FSRS-6 Felder (seit Migration 033)
    fsrs_difficulty REAL DEFAULT 8.2956,
    fsrs_stability REAL DEFAULT 0.212,
    fsrs_last_review TIMESTAMPTZ,
    fsrs_due TIMESTAMPTZ DEFAULT NOW(),
    fsrs_reps INT DEFAULT 0,
    fsrs_lapses INT DEFAULT 0,
    fsrs_state TEXT DEFAULT 'new',  -- 'new' | 'learning' | 'review' | 'relearning'

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indizes:**
- `idx_fsrs_due` ON (fsrs_due)
- `idx_fsrs_state` ON (fsrs_state)
- `idx_learning_items_level_difficulty` ON (level, difficulty)

### 3.3 `fsrs_review_logs` Tabelle
**Zweck:** Lern-Historie für FSRS-Algorithmus

**Schema:**
```sql
CREATE TABLE public.fsrs_review_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES learning_items(id) ON DELETE CASCADE,
    rating INT CHECK (rating IN (1,2,3,4)),
    review_time TIMESTAMPTZ DEFAULT NOW(),
    interval_days REAL,
    old_difficulty REAL,
    new_difficulty REAL,
    old_stability REAL,
    new_stability REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indizes:**
- `idx_fsrs_reviews_user_card` ON (user_id, card_id)
- `idx_fsrs_reviews_time` ON (review_time)

### 3.4 `session_tracking` Tabelle (angenommen)
**Zweck:** Lern-Sessions tracken

**Felder (basierend auf README):**
- session_id, user_id, module (grammar/vocabulary/phrases)
- started_at, ended_at, duration_minutes
- cards_studied, correct_answers, wrong_answers
- streak_updated (boolean)

### 3.5 Weitere Tabellen (erwähnt, nicht detailliert)
- `admin_security` – 2FA/MFA-Daten
- `login_attempts` – Rate-Limiting-Tracking
- `device_fingerprints` – Device-Tracking
- `daily_phrases` – Spezifische Daily-Phrases-Daten
- `honeypot_alerts` – Sicherheits-Logs

### 3.6 RPC-Funktionen (Stored Procedures)
**Wichtigste Funktionen:**
- `verify_user_4digit_pin(p_name, p_pin)` → User-Login
- `verify_admin_credentials(p_username, p_pin)` → Admin-Login
- `get_due_cards_fsrs(p_user_id, p_level, p_limit)` → Fällige Flashcards
- `update_card_fsrs(...)` → Karten-Update nach Review
- `start_learning_session(...)` → Session starten
- `end_learning_session(...)` → Session beenden + Streak-Update
- `update_user_locale(p_user_id, p_locale)` → Sprache ändern
- `unlock_user(p_user_id)` → Account entsperren (Admin)

---

## 4. Aktueller Stand der Internationalisierung / Sprachen

### UI-Sprachen
**Vollständig unterstützt:**
- 🇬🇧 Englisch (en) – Default, primäre Entwicklungssprache
- 🇷🇺 Russisch (ru) – ~130 Übersetzungen
- 🇩🇪 Deutsch (de) – ~130 Übersetzungen
- 🇪🇸 Spanisch (es) – ~130 Übersetzungen (seit 16. Feb 2026)

**Technisch vorhanden, nicht auf Mobile-Login:**
- 🇬🇷 Griechisch (el) – UI-Unterstützung vollständig, aber aus Mobile-Sprachauswahl entfernt (16. Feb 2026)
  - **Grund:** Vereinfachung der Mobile-UX
  - **Technische Unterstützung bleibt:** el.json, Locale-Handling, DB-Spalte

### Sprachenwechsel
**Wo kann gewechselt werden:**
- Login-Screen (4 Sprachen-Buttons: EN, RU, DE, ES)
- Desktop-Dashboard (wahrscheinlich Language-Dropdown)
- Admin-Panel (wahrscheinlich)

**Persistenz:**
- localStorage: `greeklingua_locale`
- Supabase DB: `users.preferred_locale`
- Sync: Automatisch nach Login via `syncLocaleFromUser()`

### Implementierung
**Pfad:** `src/context/language-context.tsx`
**Hook:** `useLanguage()` → `{ locale, setLocale, syncLocaleFromUser }`

**Fallback-Konstanten:**
- `FALLBACK_EN` (Englisch)
- `FALLBACK_RU` (Russisch)
- `FALLBACK_DE` (Deutsch)
- `FALLBACK_ES` (Spanisch, seit 16. Feb 2026)
- Jeweils ~130 Key-Value-Paare

**Besonderheiten:**
- Keine i18next-Library, custom Context-basiert
- Canvas-Partikel-Effekte sind sprachspezifisch (Hue/Color-Coding):
  - EN: Blau (Hue 210)
  - RU: Rot (Hue 0)
  - DE: Gelb (Hue 50)
  - EL: Grün (Hue 150)
  - ES: Rot-Orange (Hue 0, spread 20)

---

## 5. Offene / geplante Erweiterungen (soweit bekannt)

### 5.1 Sicherheit (HOCH PRIORITÄT)
**Quelle:** `TODO-Audit-Und-Optimierungen-2026-02-16.md`

**Kritisch (noch offen):**
- ✅ ~~Punkt 1: .env.local aus Git entfernen~~ → ERLEDIGT (geprüft)
- ✅ ~~Punkt 2: Hardcoded Admin-Credentials entfernen~~ → ERLEDIGT (16. Feb)
- ✅ ~~Punkt 5: Rate-Limiter fail-closed~~ → ERLEDIGT (16. Feb)
- ✅ ~~Punkt 7: Hardcoded Supabase-URL entfernen~~ → ERLEDIGT (16. Feb)
- ✅ ~~Punkt 8: Input-Sanitization & SQL-Injection-Prävention~~ → ERLEDIGT (16. Feb, Zod)
- ✅ ~~Punkt 17: Spanisch hinzufügen~~ → ERLEDIGT (16. Feb)
- ✅ ~~Punkt 18: Griechisch aus Mobile entfernen~~ → ERLEDIGT (16. Feb)
- ✅ ~~Punkt 19: Hardcoded Credentials in Scripts~~ → ERLEDIGT (16. Feb)

**Noch offen (geplant):**
- **Punkt 3:** localStorage → httpOnly Cookies (3-8h)
  - Problem: XSS-anfällig
  - Lösung: API-Route + httpOnly Cookies + CSRF-Protection
- **Punkt 4:** Server-seitige Autorisierung für kritische Operationen (3-8h)
  - Problem: `bulkDeleteContent` ohne Auth-Check, Client-seitige Honeypot-Checks
  - Lösung: RLS-Policies, Server-seitige Validierung
- **Punkt 6:** IP-Whitelisting server-seitig (1-3h)
  - Problem: `NEXT_PUBLIC_ADMIN_ALLOWED_IPS` client-seitig lesbar
  - Lösung: Next.js Middleware, server-seitig
- **Punkt 9:** CSRF-Protection (3-8h)
  - Lösung: next-csrf oder custom Middleware
- **Punkt 10:** TypeScript Strict Mode (3-8h)
  - Problem: Keine `strict: true` in tsconfig.json

### 5.2 Performance-Optimierungen
- **Punkt 11:** Database Performance Audit
  - SELECT * → spezifische Felder
  - Indizes prüfen (EXPLAIN ANALYZE)
- **Punkt 12:** Connection-Pooling & Timeout-Konfiguration
  - Supabase-Client: Pool-Size, AbortSignal.timeout(10000)
- **Punkt 13:** Canvas-Animation Performance
  - RequestAnimationFrame Throttling (30 FPS auf Mobile)
  - Particle-Reduktion bei Low-FPS

### 5.3 Code-Qualität
- **Punkt 14:** Konsistentes Error-Handling
  - Zentralisierte Error-Handler-Utility
  - Einheitliches Logging (Sentry, LogRocket)
- **Punkt 15:** Code-Konsistenz: Sprache vereinheitlichen
  - Einheitlich auf Englisch (Code, Kommentare)
- **Punkt 16:** Zentralisierung von Magic Strings/Constants
  - Constants.ts für LEVELS, DIFFICULTIES, USER_ROLES

### 5.4 Vocabulary-Modul (siehe modules/daily-phrases/daily-phrases-todo.md)
- ✅ Phase 1-4: FSRS Core, DB-Schema, UI, TTS (abgeschlossen)
- 🔜 Phase 5: Analytics & Stats
  - Dashboard-Widget: Due Cards
  - Retention-Berechnung (RPC)
  - Charts (Recharts)
  - Streak-Counter
- 🔜 Phase 6: Mobile PWA
  - PWA-Manifest
  - Service Worker (next-pwa)
  - Touch-Optimierung
  - Install-Prompt
- 🔜 Phase 7: Desktop (Tauri, optional)
  - Native Desktop-App
  - Global Keyboard Shortcuts
  - Native Notifications
- 🔜 Phase 8: Testing & Optimierung (KRITISCH)
  - Unit Tests (100% Coverage für FSRS)
  - Integration Tests
  - E2E Tests (Cypress)
  - Performance-Optimierung (Lighthouse > 90)
  - Accessibility (aria-labels, VoiceOver)

### 5.5 Weitere Features (aus Dokumentation)
- Quizlet-ähnliche Spiele (Matching, Test, Gravity)
- Backend-Konfigurierbarkeit (Texte ändern, Spielsituationen)
- Bulk-Import von Vokabeln (CSV/JSON)
- Vokabel-Editor im Admin-Backend
- Offline-Sync (später, komplex)

---

## 6. Wichtige Dateipfade / Ordnerstruktur (kurz)

### Projekt-Root
```
/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/
├── CLAUDE.md               # Claude AI-Anweisungen (zuerst lesen!)
├── START.md                # Zentrale Einstiegsseite
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript-Konfiguration
├── next.config.ts          # Next.js-Konfiguration
├── tailwind.config.ts      # TailwindCSS v4
│
├── docs/                   # Dokumentation
│   ├── ai-guidelines.md    # KI-Richtlinien (HARTE Regeln)
│   ├── naming-convention.md # Naming-Konventionen (geplant)
│   └── architecture.md     # Projekt-Architektur (geplant)
│
├── modules/                # Feature-Module (modular)
│   ├── daily-phrases/
│   │   ├── README.md       # Modul-Übersicht
│   │   ├── daily-phrases-todo.md
│   │   └── daily-phrases-dev-log.md
│   ├── grammar/
│   │   ├── README.md       # Modul-Übersicht
│   │   ├── grammar-todo.md
│   │   ├── grammar-srs-parameters.md
│   │   ├── grammar-due-logic.md
│   │   └── grammar-database-schema.md
│   ├── vocabulary/         # (Dateien noch nicht vorhanden)
│   ├── short-stories/
│   └── due-cards-today/
│
├── database/               # Supabase Migrations
│   ├── MASTER_MIGRATION_ALL_IN_ONE.sql
│   ├── migrations/         # 70+ Migration-Dateien
│   │   ├── 001_00_bootstrap_all.sql
│   │   ├── 033_add_fsrs_fields.sql
│   │   └── ...
│   ├── functions/          # SQL-Funktionen
│   └── test-data/          # Testdaten
│
├── scripts/                # Node.js-Scripts
│   ├── create-test-pin-users.js
│   └── README.md           # Security-Guidelines
│
├── public/                 # Frontend-Assets
│   └── icon-*.png          # PWA-Icons (geplant)
│
└── src/                    # Haupt-Quellcode
```

### src/ (Frontend-Code)
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing Page
│   ├── layout.tsx          # Root Layout
│   ├── globals.css         # Globale Styles
│   ├── api/                # API Routes
│   │   └── honeypot-alert/route.ts
│   ├── login/              # Desktop Admin-Login
│   ├── login-pin/          # Mobile PIN-Login
│   ├── dashboard/          # Desktop Dashboard
│   ├── m/                  # Mobile Dashboard
│   ├── admin/              # Admin-Panel
│   ├── student/            # Student-Bereich
│   └── vokabeln/           # Vokabel-Übersicht
│
├── components/             # React-Komponenten
│   ├── learning/
│   │   ├── grammar-dialog-fsrs.tsx      # Grammar Flashcards
│   │   ├── vocabulary-dialog-fsrs.tsx   # Vocabulary Flashcards
│   │   └── flashcard-fsrs.tsx           # Basis-Flashcard
│   ├── dashboard/          # Dashboard-Widgets
│   └── ui/                 # Radix UI Wrappers
│
├── context/                # React Context
│   ├── auth-context.tsx    # Auth-State
│   └── language-context.tsx # i18n-State
│
├── lib/                    # Utilities & Libraries
│   ├── fsrs/               # FSRS-6 Spaced Repetition
│   │   ├── fsrs-scheduler.ts
│   │   ├── fsrs-types.ts
│   │   └── fsrs-constants.ts
│   ├── tts/                # Text-to-Speech
│   │   └── greek-tts.ts
│   ├── validation/         # Zod Schemas (seit 16. Feb)
│   │   ├── schemas.ts
│   │   └── README.md
│   ├── supabase/
│   │   └── content.ts      # DB-Query-Funktionen
│   ├── rate-limit.ts       # Upstash Redis Rate-Limiting
│   └── use-translation.ts  # i18n-Hook
│
├── db/
│   └── supabase.ts         # Supabase Client
│
├── hooks/                  # Custom React Hooks
│   └── useGreekTTS.ts      # TTS-Hook
│
├── styles/                 # CSS-Modules
│
└── types/                  # TypeScript-Typen
```

### Wo liegt das Backend?
- **Next.js API Routes:** `src/app/api/`
- **Supabase RPC:** `database/migrations/*.sql` (Stored Procedures)

### Wo Frontend(s)?
- **Desktop:** `src/app/dashboard/`, `src/app/admin/`
- **Mobile:** `src/app/m/`, `src/app/login-pin/`

### Wo i18n-Dateien?
- **Code:** `src/context/language-context.tsx`
- **Fallback-Konstanten:** Im gleichen File (FALLBACK_EN, FALLBACK_RU, etc.)
- **Keine separaten JSON-Dateien** (anders als bei i18next)

### Wo die SRS- / AI-Logik?
- **FSRS-6:** `src/lib/fsrs/`
- **Grammar-SRS:** `modules/grammar/grammar-srs-parameters.md`
- **RPC-Funktionen:** `database/migrations/035_create_fsrs_rpc_functions.sql`

---

## 7. Zusätzliche Bemerkungen

### Wichtige Projekt-Konventionen (aus CLAUDE.md)
- **Naming Convention:**
  - Prefix-Regel: `daily-phrases-*`, `vocabulary-*`, `grammar-*`
  - Format: kebab-case, lowercase
  - Ordner: Modul-spezifisch (`modules/daily-phrases/`)
- **Sprache & Stil:**
  - Modernes Griechisch (Dimotiki), freundlich, klar
  - Keine Katharevousa
- **Wichtige Konstanten:**
  - Max. neue Karten pro Tag: 20
  - Review-Intervall-Algorithmus: angepasstes SM-2 / FSRS-6
  - Daily Phrases: genau 3 pro Tag
  - Keine Duplikate in 30-Tage-Fenster
- **Verbote / No-Gos:**
  - Keine Google Translate ohne Nachbearbeitung
  - Keine generischen Platzhalter-Sätze
  - Keine politisch/sensiblen Themen
  - Keine Änderung der Ordnerstruktur ohne Freigabe

### Code-Audit-Ergebnisse (16. Feb 2026)
**Quelle:** `TODO-Audit-Und-Optimierungen-2026-02-16.md`

**Fortschritt:** 42% abgeschlossen (8 von 19 Punkten)

**Security-Score (geschätzt):**
- Vor Audit: ~5.5/10 (kritische Schwachstellen)
- Nach Audit-Phase 1-2: ~7.5/10 (Hauptprobleme behoben)
- Ziel nach Phase 3: 9/10 (Produktions-reif)

**Abgeschlossene Verbesserungen (16. Feb):**
- ✅ Hardcoded Admin-Credentials entfernt
- ✅ Rate-Limiter fail-closed (Brute-Force-Schutz)
- ✅ Hardcoded Supabase-URL aus API-Route entfernt
- ✅ Zod Input-Validation (SQL-Injection-Schutz)
- ✅ Hardcoded Credentials in Scripts entfernt
- ✅ Spanisch als 5. Sprache hinzugefügt
- ✅ Griechisch aus Mobile-Login entfernt (UX-Optimierung)

### Nächste Schritte (empfohlen)
**Phase 3: Kritische Sicherheits-Refactorings (siehe TODO.md)**
1. IP-Whitelisting server-seitig (1-3h)
2. localStorage → httpOnly Cookies (3-8h)
3. Server-seitige Autorisierung + RLS Policies (3-8h)
4. CSRF-Protection (3-8h)

**Phase 4: Vocabulary-Modul finalisieren (siehe modules/daily-phrases/daily-phrases-todo.md)**
5. Analytics & Stats (Phase 5)
6. Testing & Optimierung (Phase 8 – KRITISCH)

---

## 8. Changelog

### 16. Februar 2026
- ✅ Security-Fixes: Hardcoded Admin-Credentials, Rate-Limiter, Supabase-URL, Input-Validation
- ✅ Feature: Spanisch (es) als 5. UI-Sprache
- ✅ UX: Griechisch aus Mobile-Login entfernt (technisch verfügbar)
- ✅ Scripts: Hardcoded Credentials → Umgebungsvariablen
- 📝 Dokumentation: PROJECT-OVERVIEW-2026-02.md erstellt

### 15. Februar 2026
- ✅ Grammar-Modul: FSRS-6 Spaced Repetition vollständig implementiert
- ✅ Session Tracking & Streak-System
- ✅ TTS (Text-to-Speech) mit Speed-Kontrolle

### 14. Februar 2026
- ✅ Code-Audit durchgeführt (AUDIT-REPORT.md, FINDINGS.md)
- ✅ 19 Verbesserungspunkte identifiziert

### 13. Februar 2026 und früher
- ✅ Basis-Authentifizierung (4-Digit PIN)
- ✅ Admin-Panel mit 2FA
- ✅ Learning-Items-Datenbank
- ✅ Erste FSRS-Integration (Vocabulary-Modul Phase 1-4)

---

## 9. Kontakt & Ressourcen

**GitHub-Issues:** https://github.com/anthropics/claude-code/issues (für Claude Code Feedback)

**Wichtige Dateien zum Einstieg:**
1. `START.md` → Projekt-Übersicht
2. `CLAUDE.md` → Claude AI-Anweisungen
3. `docs/ai-guidelines.md` → HARTE Regeln
4. `TODO-Audit-Und-Optimierungen-2026-02-16.md` → Offene Tasks

**Entwicklungs-Logs:**
- `DEV-LOG.md` (16 KB) – Allgemeines Dev-Log
- `DEV.LOG.md` (32 KB) – Detailliertes Dev-Log
- `modules/grammar/grammar-dev-log.md`
- `modules/daily-phrases/daily-phrases-dev-log.md`

**Testing:**
- `SECURITY_TESTS.md` (13 KB)
- `SECURITY_TESTS_MANUAL.md` (7.7 KB)
- `SECURITY_TESTS_RESULTS.md` (7.7 KB)

**Session-Tracking:**
- `SESSION_TRACKING_SUMMARY.md` (6.8 KB)

---

**Ende der Projekt-Übersicht**
*Letzte Aktualisierung: 16. Februar 2026, 16:45 UTC+2*
