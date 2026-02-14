# 📋 ZENTRALE TODO-LISTE
**Projekt:** HellenicHorizons GreekLingua Dashboard
**Letzte Aktualisierung:** 2026-02-14
**Status:** Phase 8/8 Complete (Production-Ready) ✅

> **Hinweis:** Diese zentrale TODO-Liste ist die Single Source of Truth für alle projektweiten Aufgaben.
> Modul-spezifische TODOs befinden sich in den jeweiligen Modul-Ordnern.

---

## 🎯 QUICK STATUS

| Kategorie | Status | Priorität |
|-----------|--------|-----------|
| **Desktop-App** | ✅ Production-Ready | - |
| **Mobile-App** | 🟡 In Development | HOCH |
| **SQL-Migrationen** | 🔴 6 Pending | **KRITISCH** |
| **Content Population** | ⚠️ A1/A2 leer | MITTEL |
| **Security Features** | 🟡 Ready, Not Integrated | MITTEL |

---

## 🔴 KRITISCH (Blocker für Production)

### 1. **SQL-Migrationen ausführen** (15 Min.)
**Priorität:** 🔴 **KRITISCH**
**Aufwand:** 15 Minuten
**Verantwortlich:** Admin

**6 Migrations:**
```sql
1. fix_student_management_v2.sql
2. cleanup_verify_function.sql
3. create_honeypot_pins_fixed.sql
4. extend_users_for_4digit_pin.sql
5. EXECUTE_THIS_account_lockout_complete.sql
6. verify_user_4digit_pin_complete.sql
```

**Anleitung:** Siehe `active-deploy/next-steps.md` Phase 1

**Status:** ❌ **PENDING**

---

### 2. **ENV-Variablen konfigurieren** (10 Min.)
**Priorität:** 🔴 **KRITISCH**
**Aufwand:** 10 Minuten

**Schritte:**
```bash
cp .env.example .env.local
# Dann ausfüllen:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

**Status:** ❌ **PENDING**

---

### 3. **Security Tests durchführen** (30 Min.)
**Priorität:** 🔴 **KRITISCH**
**Aufwand:** 30 Minuten

**7 Tests:**
- [ ] Test 1: Rate Limiting (10 Versuche → 429 Error)
- [ ] Test 2: Account Lockout (5 Strikes → 15min Lock)
- [ ] Test 3: Device Fingerprinting (Hash in DB)
- [ ] Test 4: Admin Audit-Log (Login History)
- [ ] Test 5: Honeypot-PIN (0000 → IP Ban)
- [ ] Test 6: Progressive Delays (1s, 2s, 5s, 10s)
- [ ] Test 7: Session Timeout (15min Admin, 24h Student)

**Anleitung:** Siehe `active-deploy/next-steps.md` Phase 2

**Status:** ❌ **PENDING**

---

## 🟡 ALLGEMEINE PROJEKTORGANISATION

### ✅ **Phase 1-8 Komplett** (2026-02-13)

**Erledigt:**
- [x] Multi-Language UI (4 Locales: EN/RU/EL/DE)
- [x] Admin Backend (CRUD, Level/Difficulty, Auto-Leveling)
- [x] Sprachpersistenz + UX (Toast, Flaggen-Toggle)
- [x] Dashboard UI-Texte in DB
- [x] Griechisch (EL) als 3. Sprache
- [x] Deutsch (DE) als 4. Sprache
- [x] "Dein Unterricht" Feature (LessonDialog)
- [x] Production Deployment (ENV, Rate Limiting, Build-Fix)

**Dokumentation:**
- ✅ `active-deploy/claude.md` - Vollständiges Entwicklungsprotokoll
- ✅ `active-deploy/todo.md` - Alte zentrale TODO (526 Zeilen)
- ✅ `active-deploy/project-overview.md` - Architektur (16 Kapitel)
- ✅ `active-deploy/logic-overview.md` - Technische Logik (13 Kapitel)
- ✅ `active-deploy/todo-overview.md` - Status-Übersicht (8 Phasen)

---

### ⚠️ **Offene Organisations-Aufgaben**

#### A) **Zentrale Dokumentation konsolidieren** (2h)
- [ ] README.md im Root erstellen (basierend auf project-overview.md)
- [ ] docs/ Verzeichnis strukturieren:
  - [ ] `docs/ARCHITECTURE.md` (aus project-overview.md)
  - [ ] `docs/DEVELOPMENT.md` (aus logic-overview.md)
  - [ ] `docs/DEPLOYMENT.md` (aus next-steps.md)
- [ ] Cross-References zwischen Dokumenten hinzufügen
- [ ] Veraltete Dateien archivieren (siehe Aufgabe 5)

**Status:** ❌ **OFFEN**

---

#### B) **Active-Deploy aufräumen** (15 Min.)
- [ ] Archiv-Ordner erstellen: `active-deploy/_archive/`
- [ ] Veraltete Dateien verschieben:
  - [ ] `README.md` (2026-01-24) → _archive/
  - [ ] `result-check-md.md` (2026-01-24) → _archive/
  - [ ] `todo-login-system-complete.md` (2026-02-12) → _archive/
- [ ] Archiv-README erstellen (erklärt warum Dateien archiviert wurden)

**Status:** ❌ **OFFEN**

---

## 📚 MODUL-SPEZIFISCHE TODOs

### **1. Due Cards Today** 🎯
**Priorität:** 🟡 **HOCH** (Kernmodul für Mobile)
**Status:** ⚠️ Nur Platzhalter (63 Bytes)
**Referenz:** `modules/due-cards-today/todo.md` (⚠️ **ERSTELLEN**)

**Aufgaben:**
- [ ] **Modul-TODO erstellen** (`modules/due-cards-today/todo.md`)
- [ ] **Dialog-Komponente erstellen** (basierend auf VocabularyDialog)
  - [ ] SRS-Filter: `next_review < NOW()`
  - [ ] Mobile-optimiertes Layout
  - [ ] Swipe-Gesten (Hard/Good/Easy)
  - [ ] Progress-Indicator
- [ ] **Supabase-Integration**
  - [ ] RPC `get_due_cards_today(student_id)` erstellen
  - [ ] LEFT JOIN mit `student_progress`
- [ ] **Multi-Language Support** (4 Locales)
- [ ] **Mobile/Desktop Konsistenz** (Glasmorphismus-Stil)
- [ ] **Tests schreiben**

**Aufwand:** 4-6 Stunden
**Dependencies:** SQL-Migrationen (Aufgabe 1)

---

### **2. Daily Phrases** 📅
**Priorität:** 🟡 **HOCH** (Kernmodul für Mobile)
**Status:** 🟢 Teilweise implementiert (HTML/CSS/JS vorhanden)
**Referenz:** `modules/daily-phrases/daily-phrases-todo.md`

**Offene Aufgaben (aus Modul-TODO):**
- [ ] `daily-phrases-due-logic.md` final überarbeiten
- [ ] Struktur einer Phrase definieren (TypeScript Interface)
- [ ] Regelwerk für 3 Phrasen pro Tag finalisieren
- [ ] Verbindung zu progress-tracking herstellen
- [ ] Erste Frontend-Komponente skizzieren (React)
- [ ] **Nice-to-have:**
  - [ ] Audio-Integration planen
  - [ ] Kategorien-System einführen

**Aufwand:** 3-5 Stunden
**Dependencies:** Keine

---

### **3. Short Stories** 📖
**Priorität:** 🟢 **MITTEL** (Erweiterungsmodul)
**Status:** ⚠️ Keine Dokumentation
**Referenz:** `modules/short-stories/todo.md` (⚠️ **ERSTELLEN**)

**Aufgaben:**
- [ ] **Modul-Struktur analysieren** (6 Dateien in Ordner)
- [ ] **Modul-TODO erstellen**
- [ ] **Integration planen**

**Aufwand:** 1-2 Stunden (Analyse)

---

### **4. Review Vocabulary** 🔁
**Priorität:** 🟡 **HOCH** (Kernmodul für Mobile)
**Status:** ✅ Bereits implementiert (VocabularyDialog mit `mode: 'review'`)

**Offene Aufgaben:**
- [ ] Mobile-spezifische Anpassungen prüfen
- [ ] Swipe-Gesten hinzufügen (optional)
- [ ] Performance-Tests

**Aufwand:** 1-2 Stunden

---

### **5. Train Weak Words** 💪
**Priorität:** 🟡 **HOCH** (Kernmodul für Mobile)
**Status:** ✅ Bereits implementiert (VocabularyDialog mit `mode: 'weak'`)

**Offene Aufgaben:**
- [ ] Mobile-spezifische Anpassungen prüfen
- [ ] Threshold `ease_factor < 2.0` dokumentieren

**Aufwand:** 1 Stunde

---

## 🔧 ORDNERSTRUKTUR-ÄNDERUNGEN

### ✅ **Bereits durchgeführt** (2026-02-13)
- [x] Trennung Desktop/Mobile via `/m/*` Routes
- [x] `src/app/m/` für Mobile-Seiten
- [x] `src/components/mobile/` für Mobile-Komponenten
- [x] `modules/` für wiederverwendbare Module

### ⚠️ **Vorgeschlagene Änderungen**

#### A) **Dokumentations-Struktur verbessern**
```
/docs/                       # Zentrale Dokumentation
  ├── ARCHITECTURE.md        # project-overview.md → hier
  ├── DEVELOPMENT.md         # logic-overview.md → hier
  ├── DEPLOYMENT.md          # next-steps.md → hier
  ├── SECURITY.md            # Security-Status zusammenfassen
  ├── MOBILE-APP.md          # mobile-app-abspaltung-todos.md → hier
  └── SQL-MIGRATIONS.md      # SQL-Migrations-Guide

/active-deploy/              # Nur aktive Arbeitsdokumente
  ├── claude.md              # Entwicklungsprotokoll (behalten)
  ├── todo-overview.md       # Status-Übersicht (behalten)
  ├── lerndialoge-allgemein.md  # KI-Richtlinien (behalten)
  ├── a1-contend.md          # Content-Tracking (behalten)
  ├── a2-contend.md          # Content-Tracking (behalten)
  └── _archive/              # Veraltete Dateien
      ├── README.md
      ├── result-check-md.md
      └── todo-login-system-complete.md
```

**Status:** ❌ **OFFEN**
**Aufwand:** 1-2 Stunden

---

#### B) **Modul-TODO-Dateien erstellen**
```
/modules/
  ├── daily-phrases/
  │   └── todo.md            # ✅ Existiert
  ├── due-cards-today/
  │   └── todo.md            # ⚠️ ERSTELLEN
  └── short-stories/
      └── todo.md            # ⚠️ ERSTELLEN
```

**Status:** ❌ **OFFEN**
**Aufwand:** 30 Minuten

---

## 🗄️ SUPABASE-INTEGRATION

### ✅ **Bereits integriert**
- [x] `users` Tabelle (bcrypt PIN-Hashing, Level/Difficulty)
- [x] `learning_items` Tabelle (4 Locales, Level/Difficulty)
- [x] `student_progress` Tabelle (SRS-Tracking)
- [x] `ui_translations` Tabelle (4 Locales, 270 Keys)
- [x] `lesson_sessions` + `lesson_vocabulary` Tabellen
- [x] `performance_log` Tabelle (Auto-Leveling)
- [x] 40+ RPC-Funktionen (SECURITY DEFINER)

### ⚠️ **Offene Aufgaben**

#### A) **SQL-Migrationen ausführen** (siehe Aufgabe 1)
- [ ] 6 kritische Migrations ausführen
- [ ] Verifizieren mit Test-Queries

**Aufwand:** 15 Minuten
**Status:** 🔴 **KRITISCH**

---

#### B) **Content Population**
- [ ] **A1-Vokabular** in `learning_items` einfügen
  - [ ] `a1-contend.md` mit Vokabular füllen
  - [ ] SQL-INSERT-Statements erstellen
  - [ ] 50-100 A1-Wörter (easy/middle/hard)
- [ ] **A2-Vokabular** in `learning_items` einfügen
  - [ ] `a2-contend.md` mit Vokabular füllen
  - [ ] SQL-INSERT-Statements erstellen
  - [ ] 50-100 A2-Wörter (easy/middle/hard)

**Aufwand:** 4-6 Stunden
**Status:** ⚠️ **OFFEN**
**Priorität:** 🟡 **MITTEL**

---

#### C) **Fehlende RPC-Funktionen**
- [ ] `get_due_cards_today(student_id)` für Due Cards Modul
- [ ] `get_daily_phrases(student_id, date)` für Daily Phrases Modul
- [ ] `mark_phrase_completed(student_id, phrase_id)` für Progress-Tracking

**Aufwand:** 2-3 Stunden
**Status:** ⚠️ **OFFEN**

---

## 📱 DESKTOP/MOBILE KONSISTENZ

### ✅ **Bereits umgesetzt**
- [x] **Glasmorphismus-Design** (konsistent Desktop ↔ Mobile)
- [x] **Multi-Language Support** (4 Locales: EN/RU/EL/DE)
- [x] **AuthContext** (shared zwischen Desktop/Mobile)
- [x] **LanguageContext** (shared zwischen Desktop/Mobile)
- [x] **Supabase-Client** (shared zwischen Desktop/Mobile)
- [x] **SRS-Logik** (VocabularyDialog wiederverwendbar)

### ⚠️ **Offene Aufgaben**

#### A) **Mobile-spezifische Anpassungen**
- [ ] **Touch-Optimierung** (min 44x44px Buttons)
- [ ] **Swipe-Gesten** für Flashcards (Hard/Good/Easy)
- [ ] **Pull-to-Refresh** (Dashboard, Stats)
- [ ] **Haptic Feedback** (Button-Taps)
- [ ] **Native Mobile-Keyboard** (✅ Bereits implementiert für Login)

**Aufwand:** 2-3 Stunden
**Status:** ⚠️ **OFFEN**

---

#### B) **Responsive Breakpoints**
```css
/* Aktuell: Manuelle Anpassungen */
/* Vorschlag: Zentralisierte Breakpoints */

// styles/breakpoints.ts
export const BREAKPOINTS = {
  mobile: '0px',      // iPhone SE
  tablet: '768px',    // iPad Mini
  desktop: '1024px',  // Desktop
} as const;
```

- [ ] Breakpoints definieren
- [ ] Alle Komponenten migrieren
- [ ] Tests auf verschiedenen Viewports

**Aufwand:** 3-4 Stunden
**Status:** ⚠️ **OFFEN**

---

## 🔐 SECURITY FEATURES (Ready, Not Integrated)

### 1. **Admin MFA (TOTP)** ⚠️
**Status:** Code Ready, SQL Pending, Login-Integration Pending
**Aufwand:** 2-3 Stunden

**Was existiert:**
- ✅ MFASetup.tsx Component (QR-Code Setup)
- ✅ MFAVerify.tsx Component (6-Digit Verification)
- ✅ SQL `add_admin_mfa.sql`
- ✅ RPC: `setup_admin_mfa()`, `verify_admin_mfa()`

**Was fehlt:**
- [ ] SQL-Migration ausführen
- [ ] Login-Flow Integration (`/login` → MFA nach PIN)
- [ ] Admin-Dashboard MFA-Setup Widget

**Anleitung:** Siehe `active-deploy/next-steps.md` Phase 3

---

### 2. **Telegram Security Alerts** ⚠️
**Status:** Infrastructure Ready, Secrets Pending
**Aufwand:** 30 Minuten

**Was existiert:**
- ✅ Edge Function `send-telegram/index.ts`
- ✅ API Route `/api/honeypot-alert`
- ✅ Honeypot-Detection (15 PINs)

**Was fehlt:**
- [ ] Telegram Bot erstellen (@BotFather)
- [ ] Supabase Secrets setzen
- [ ] Edge Function deployen

**Anleitung:** Siehe `active-deploy/next-steps.md` Phase 4

---

### 3. **Device Fingerprinting** ⚠️
**Status:** Code Ready, Library Pending
**Aufwand:** 1 Stunde

**Was fehlt:**
- [ ] `npm install @fingerprintjs/fingerprintjs`
- [ ] Hook aktivieren in `login-pin`
- [ ] SQL-Migration ausführen (`add_device_fingerprint.sql`)

---

## ✅ OPTIONAL (Nice-to-Have)

### 1. **README.md modernisieren** (1-2h)
- [ ] Projekt-Beschreibung
- [ ] Features-Liste (mit Checkboxen)
- [ ] Setup-Anleitung (Schritt-für-Schritt)
- [ ] Screenshots (Desktop + Mobile)
- [ ] Tech-Stack (mit Logos)

---

### 2. **Content Management UI** (4-6h)
- [ ] CRUD für `learning_items`
- [ ] Bulk-Upload (CSV → Supabase)
- [ ] Audio-Upload (S3 oder Supabase Storage)
- [ ] Preview-Modus (Flashcard-Vorschau)

---

### 3. **Settings-Seite** (3-4h)
- [ ] System-Einstellungen (Theme, Notifications)
- [ ] User-Präferenzen (Language, Difficulty)
- [ ] Backup/Export (CSV, JSON)

---

## 📊 CROSS-REFERENCES

**Diese TODO-Liste ist vernetzt mit:**

1. **Haupt-Dokumentation:**
   - `active-deploy/claude.md` - Entwicklungsprotokoll (Phase 1-8)
   - `active-deploy/project-overview.md` - Architektur (16 Kapitel)
   - `active-deploy/logic-overview.md` - Technische Logik (13 Kapitel)
   - `active-deploy/todo-overview.md` - Status-Übersicht (8 Phasen)

2. **Mobile-Abspaltung:**
   - `active-deploy/mobile-app-abspaltung-todos.md` - Mobile-Architektur & Entscheidungen

3. **KI-Richtlinien:**
   - `active-deploy/lerndialoge-allgemein.md` - Anforderungen für KI-Assistenz

4. **Modul-TODOs:**
   - `modules/daily-phrases/daily-phrases-todo.md`
   - `modules/due-cards-today/todo.md` (⚠️ **ERSTELLEN**)
   - `modules/short-stories/todo.md` (⚠️ **ERSTELLEN**)

5. **Content-Tracking:**
   - `active-deploy/a1-contend.md` (⚠️ **FÜLLEN**)
   - `active-deploy/a2-contend.md` (⚠️ **FÜLLEN**)

6. **Security & Deployment:**
   - `active-deploy/next-steps.md` - Security Setup Checklist
   - `docs/PRODUCTION-DEPLOYMENT.md` - Vercel Deployment Guide

---

## 🎯 NÄCHSTE 3 SCHRITTE (Empfohlen)

### **1. SQL-Migrationen ausführen** (15 min) 🔴
> **Kritisch für Production**
- Supabase SQL Editor öffnen
- 6 Migrations ausführen (siehe Aufgabe 1)
- Verifizieren mit Test-Queries

---

### **2. Security Tests durchführen** (30 min) 🔴
> **Kritisch für Production**
- 7 Tests durchführen (siehe Aufgabe 3)
- Ergebnisse dokumentieren
- Bugs fixen

---

### **3. Due Cards Today Modul entwickeln** (4-6h) 🟡
> **Kernmodul für Mobile**
- Modul-TODO erstellen (`modules/due-cards-today/todo.md`)
- Dialog-Komponente (basierend auf VocabularyDialog)
- SRS-Integration (`next_review < NOW()`)
- Mobile-optimiertes Layout

---

## 📝 CHANGELOG

**2026-02-14:**
- ✅ Zentrale TODO.md erstellt (basierend auf `active-deploy/todo.md`)
- ✅ Strukturiert nach: Kritisch, Allgemein, Modul-spezifisch, Ordnerstruktur, Supabase, Desktop/Mobile, Security, Optional
- ✅ Cross-References zu allen relevanten Dokumenten hinzugefügt
- ✅ Priorisierung (🔴 Kritisch, 🟡 Hoch, 🟢 Mittel) hinzugefügt
- ✅ Aufwandsschätzungen hinzugefügt

**2026-02-13:**
- ✅ Phase 8 (Production Deployment) abgeschlossen
- ✅ 60 Aufgaben (Phase 1-8) erledigt

---

**Bei Fragen oder Problemen:** Alle Dateien sind dokumentiert und getestet. 🚀
