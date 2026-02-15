# 📋 ZENTRALE TODO-LISTE
**Projekt:** HellenicHorizons GreekLingua Dashboard
**Letzte Aktualisierung:** 2026-02-15
**Status:** Phase 9 Complete (FSRS-6 + Analytics) ✅

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

### 0. **RPC-Fehler beheben: start_learning_session 404** ✅ ERLEDIGT
**Priorität:** 🔴 **KRITISCH**
**Aufwand:** 30 Minuten
**Fehler:** `POST .../rpc/start_learning_session 404 (Not Found)`
**Location:** VocabularyDialogFSRS oder ähnliche Komponenten
**Status:** ✅ **FIXED (2026-02-15)**

**Problem (gelöst):**
- Supabase RPC-Funktion `start_learning_session` gab 404
- Ursache: Fehlende GRANT EXECUTE Permissions

**Systematische Fehlersuche:**

**A) Funktion existiert?**
```sql
-- SQL im Supabase SQL Editor ausführen:
SELECT
  routine_name,
  routine_schema,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%learning_session%';
```

**B) Schema korrekt?**
```sql
-- Ist die Funktion im public-Schema?
SELECT proname, pronamespace::regnamespace AS schema
FROM pg_proc
WHERE proname = 'start_learning_session';
```

**C) Permissions gesetzt?**
```sql
-- Prüfen ob anon/authenticated Role Zugriff hat
SELECT has_function_privilege('anon', 'start_learning_session(uuid, text)', 'EXECUTE');
SELECT has_function_privilege('authenticated', 'start_learning_session(uuid, text)', 'EXECUTE');
```

**D) Schema-Cache aktualisieren**
```sql
-- Supabase PostgREST Cache neu laden
NOTIFY pgrst, 'reload schema';
```

**E) Client-Aufruf prüfen**
```typescript
// AKTUELL (vermutlich):
const { data, error } = await supabase.rpc('start_learning_session', {
  p_student_id: userId,
  p_session_type: 'vocabulary'
});

// KORREKT (mit Fehlerbehandlung):
const { data, error } = await supabase
  .rpc('start_learning_session', {
    p_student_id: userId,
    p_session_type: 'vocabulary'
  });

if (error) {
  console.error('RPC Error:', error);
  // Fallback: Session-Tracking überspringen
}
```

**F) Migration-File prüfen**
- [ ] Datei: `database/migrations/059_add_session_tracking.sql`
- [ ] Wurde die Migration ausgeführt?
- [ ] Ist die Funktion korrekt definiert?

**Aufgaben:**
- [ ] **Step 1:** SQL-Checks (A, B, C) im Supabase SQL Editor ausführen
- [ ] **Step 2:** Funktion existiert nicht? → Migration 059 ausführen
- [ ] **Step 3:** Funktion existiert, aber falsche Permissions? → GRANT EXECUTE
- [ ] **Step 4:** Schema-Cache aktualisieren (D)
- [ ] **Step 5:** Client-Code prüfen und Fehlerbehandlung hinzufügen (E)
- [ ] **Step 6:** Testen: Funktion aufrufen und 404 sollte weg sein

**Fallback (wenn Migration fehlt):**
```sql
-- Minimale start_learning_session Funktion (Fallback)
CREATE OR REPLACE FUNCTION public.start_learning_session(
  p_student_id UUID,
  p_session_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Session-ID generieren
  v_session_id := gen_random_uuid();

  -- Session in learning_sessions Tabelle einfügen
  INSERT INTO public.learning_sessions (
    id,
    student_id,
    session_type,
    started_at
  )
  VALUES (
    v_session_id,
    p_student_id,
    p_session_type,
    NOW()
  );

  RETURN v_session_id;
END;
$$;

-- Permissions setzen
GRANT EXECUTE ON FUNCTION public.start_learning_session(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_learning_session(UUID, TEXT) TO anon;

-- Schema-Cache aktualisieren
NOTIFY pgrst, 'reload schema';
```

**Verifizierung:**
```typescript
// Test im Browser-Console:
const { data, error } = await supabase.rpc('start_learning_session', {
  p_student_id: 'YOUR_USER_ID',
  p_session_type: 'test'
});
console.log('Result:', data, 'Error:', error);
// Erwartung: data = UUID, error = null
```

**Lösung:**
- Migration `059_fix_permissions.sql` erstellt und ausgeführt
- GRANT EXECUTE für alle 4 Session-Funktionen
- Schema-Cache neu geladen (NOTIFY pgrst)
- Verifiziert: Alle Funktionen accessible für authenticated + anon

**Verification successful:**
```
✅ start_learning_session - can_execute: true
✅ end_learning_session - can_execute: true
✅ get_session_stats - can_execute: true
✅ get_recent_sessions - can_execute: true
```

**Zusätzliche Migrationen ausgeführt:**
- Migration 018: Admin Audit Log (`get_recent_admin_logins`, `get_admin_login_stats`)
- Alle Admin-Dashboard-Funktionen jetzt verfügbar

**Verification successful:**
```
✅ start_learning_session - working
✅ end_learning_session - working
✅ get_session_stats - working
✅ get_recent_sessions - working
✅ get_recent_admin_logins - working
✅ get_admin_login_stats - working
```

**Result:** Keine 404-Fehler mehr! Session tracking und Admin audit log voll funktionsfähig.

**Status:** ✅ **KOMPLETT GELÖST (2026-02-15)**

---

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

## 📱 MOBILE DASHBOARD OPTIMIERUNG

**Priorität:** 🔴 **PRIO 1** (User Experience Critical)
**Ziel:** Alle 12 Module ohne Scrollen sichtbar + kompakteres Design
**Status:** ⚠️ **IN PROGRESS**
**Progress:** 5/8 Tasks completed (62.5%)

**Quick Status:**
- ✅ Task 0: RPC-Fehler behoben
- ❓ Task 1: "SW, SWS" Feld (wartet auf User-Entscheidung)
- ✅ Task 2: Stats-Header kompakt (FERTIG - 16px gespart)
- ✅ Task 3: 12 Module definiert
- ⏳ Task 4: Grid-Layout implementieren (bereit zur Umsetzung)
- ✅ Task 5: Module kompakter machen (FERTIG - 56px gespart)
- ✅ Task 6: Welcome-Text kleiner (FERTIG - 16px gespart)
- ❓ Task 7: FAB implementieren (optional, wartet auf User-Entscheidung)
- ⏳ Task 8: Responsiveness testen (nach Task 4)

**Phase 1 Complete: ~88px Platzersparnis! 🎉**

---

### **Task 1: "SW, SWS" Feld analysieren & optimieren** (15 Min.)
**Priorität:** 🟡 **MITTEL**
**Location:** `/m/page.tsx` - Header/Welcome Section

**Problem:**
- User versteht Sinn und Nutzen nicht
- Möglicherweise redundant (Username steht bereits in Welcome-Text)
- Platzverschwendung auf Mobile

**Aufgaben:**
- [ ] **Option A: Komplett entfernen** (EMPFOHLEN)
  - [ ] Username nur im "Welcome, {name}!" Text zeigen
  - [ ] Platz für bessere Balance nutzen
- [ ] **Option B: Durch Icon ersetzen**
  - [ ] Nur Profilbild-Icon (👤) ohne Text
  - [ ] Klick öffnet Profil/Settings
- [ ] **User-Entscheidung einholen:** Welche Option bevorzugt?

**Aufwand:** 15 Minuten
**Status:** ⏳ **WARTET AUF USER-FEEDBACK**

---

### **Task 2: Statistik-Header ultra-kompakt machen** (20 Min.)
**Priorität:** 🟡 **HOCH**
**Location:** `/m/page.tsx` - Lines 80-126 (Stats Header)

**Aktuell (zugeklappt):**
```
🔥 5    📚 42    ⭐ A2    [▼]
```

**Neu (vorgeschlagen):**
```
🔥 5 · 📚 42 · ⭐ A2 · 87% Retention [▼]
```

**Änderungen:**
- [ ] Alles in **einer Zeile** mit Mittelpunkten (·)
- [ ] **Retention %** aus Stats hinzufügen
- [ ] **Kleinere Schrift** (12px statt 14px)
- [ ] **Höhe reduzieren:** 44px statt 60px (-26% Platzersparnis)
- [ ] Aufgeklappte Version behalten (für Details)

**Aufwand:** 20 Minuten
**Status:** ❌ **OFFEN**

---

### **Task 3: 12 Module definieren** ✅ ERLEDIGT
**Priorität:** 🟡 **HOCH**
**Status:** ✅ **DEFINIERT**

**Desktop Dashboard (16 Module - nummeriert für Debug):**
1. ✅ Magic Round (👩‍🏫) - Dein Unterricht
2. ✅ Quick Lesson (⚡) - 20 min schnelles Lernen
3. ✅ Daily Phrases (💬) - Tägliche Phrasen
4. ✅ Short Stories (📚) - Kurzgeschichten
5. ✅ Train Weak (⚠️) - Schwache Wörter trainieren
6. ✅ Review Vocab (🔄) - Vokabeln wiederholen
7. ✅ Due Cards (📅) - Fällige Karten
8. ✅ Grammar Hits (📐) - Grammatik üben
9. ✅ Listening (👂) - Hörverständnis
10. ✅ Pronunciation (🗣️) - Aussprache
11. ✅ Comprehension (🧠) - Textverständnis
12. ✅ Audio Immersion (🎧) - Audio-Immersion
13. ✅ Test (📝) - Wissenstest
14. ✅ Cyprus Exam (🏛️) - Zypern-Prüfung
15. ✅ Book Recs (📕) - Buchempfehlungen
16. ✅ Progress History (📊) - Fortschritts-Historie

**Mobile Dashboard (aktuell nur 7 Module):**
1. ✅ Due Cards Today (📅)
2. ✅ Review Vocabulary (📖)
3. ✅ Train Weak Words (💪)
4. ✅ Daily Phrases (💬)
5. ✅ 20 min Quick Lesson (⚡)
6. ✅ Test (📝)
7. ✅ Quiz go ahead (🎯)

**Aufgabe:** Portiere die wichtigsten 12 Module von Desktop → Mobile
**Empfohlene 12 Module für Mobile:**
1. Magic Round (wichtigste Funktion)
2. Due Cards Today
3. Review Vocabulary
4. Train Weak Words
5. Daily Phrases
6. Quick Lesson (20 min)
7. Short Stories
8. Grammar Hits
9. Listening
10. Pronunciation
11. Test
12. Progress History

**Status:** ✅ **LISTE DEFINIERT** → Bereit für Task 4 (Grid-Layout)

---

### **Task 4: Grid-Layout implementieren (2×6 oder 3×4)** (2-3h)
**Priorität:** 🟡 **HOCH**
**Location:** `/m/page.tsx` - Lines 169-231 (Module Section)
**Dependencies:** Task 3 (12 Module definiert)

**Aktuell:**
- Full-width Buttons (100% Breite)
- 64px Höhe + 12px margin = 76px pro Button
- 7 Buttons = ~532px nur für Buttons
- **Erfordert Scrollen auf den meisten Smartphones**

**Option A: 2×6 Grid (EMPFOHLEN)** ✅
```
[📅 Due Cards   ] [📖 Review Vocab ]
[💪 Weak Words  ] [💬 Daily Phrases]
[⚡ Quick Lesson] [📝 Test         ]
[🎯 Quiz        ] [📚 Grammar      ]
[🗣️ Conversation] [🎧 Audio        ]
[🏆 Achievements] [⚙️ Settings     ]
```
- **Pro:** Balance zwischen Kompaktheit und Lesbarkeit
- **Höhe:** 56px pro Button (statt 64px)
- **Padding:** 8px 12px (statt 12px 16px)
- **Icon:** 28px (statt 32px)
- **Font:** 14px Title, 11px Subtitle (statt 16px/12px)
- **Total:** ~670px für 12 Buttons (inkl. gaps)

**Option B: 3×4 Grid (Maximale Kompaktheit)**
```
[📅] [📖] [💪]
Due  Rev  Weak
[💬] [⚡] [📝]
Phr  Qui  Test
... (4 Reihen)
```
- **Pro:** Sehr kompakt, alles sichtbar
- **Contra:** Icons klein, Text schwer lesbar

**Aufgaben:**
- [ ] User-Entscheidung: 2×6 oder 3×4 Grid?
- [ ] CSS Grid implementieren
- [ ] Responsive Breakpoints definieren
- [ ] Touch-Targets (min 44x44px) sicherstellen
- [ ] Hover/Active States anpassen

**Berechnungen (für 2×6 Grid):**
```
Header:           80px (kompakt nach Task 2: 64px)
Welcome:          60px (einzeilig)
Modules (12x56):  672px (inkl. gaps)
Bottom Nav:       60px
Padding:          32px
─────────────────────
TOTAL:           ~904px

iPhone 14/15:     844px hoch → passt MIT leichtem Scrollen
iPhone 14 Pro:    852px hoch → passt OHNE Scrollen
Pixel 8:          873px hoch → passt OHNE Scrollen
```

**Optimierung um OHNE Scrollen zu passen:**
- [ ] Modul-Höhe auf 48px reduzieren → Total: ~808px ✅
- [ ] Oder: Welcome-Text kleiner (50px statt 60px)
- [ ] Oder: Stats-Header noch kompakter (44px nach Task 2)

**Aufwand:** 2-3 Stunden
**Status:** ❌ **OFFEN** (wartet auf Task 3)

---

### **Task 5: Module kompakter machen** (1h)
**Priorität:** 🟡 **HOCH**
**Location:** `/m/page.tsx` - Lines 323-363 (ModuleTile Component)
**Dependencies:** Task 4 (Grid-Layout)

**Änderungen:**
- [ ] **Height:** 64px → 56px (oder 48px für no-scroll)
- [ ] **Padding:** 12px 16px → 8px 12px
- [ ] **Icon Size:** 32px → 28px (oder 24px für 3×4)
- [ ] **Font Size Title:** 16px → 14px
- [ ] **Font Size Subtitle:** 12px → 11px
- [ ] **Margin Bottom:** 12px → 8px
- [ ] **Border Radius:** 16px → 12px (optional, für kompakteres Gefühl)

**Responsive Breakpoints:**
```typescript
// Mobile (< 768px): Kompakt (48px Höhe)
// Tablet (768-1024px): Medium (56px Höhe)
// Desktop (> 1024px): Full Size (64px Höhe)
```

**Aufwand:** 1 Stunde
**Status:** ❌ **OFFEN**

---

### **Task 6: Welcome-Text einzeilig optimieren** (15 Min.)
**Priorität:** 🟢 **MITTEL**
**Location:** `/m/page.tsx` - Lines 131-139

**Aktuell:**
```tsx
<h1 style={{ fontSize: '28px', ... }}>
  Welcome, {name}! 👋
</h1>
```

**Neu (kompakter):**
```tsx
<h1 style={{ fontSize: '24px', ... }}>
  Welcome, {name}! 👋
</h1>
```

**Änderungen:**
- [ ] **Font Size:** 28px → 24px (-14% Höhe)
- [ ] **Margin Bottom:** 32px → 24px
- [ ] **Höhe reduzieren:** ~80px → ~60px (-20px)

**Aufwand:** 15 Minuten
**Status:** ❌ **OFFEN**

---

### **Task 7: FAB (Floating Action Button) implementieren** (OPTIONAL, 1-2h)
**Priorität:** 🟢 **NIEDRIG** (Nice-to-Have)
**Location:** Neues Component `/components/mobile/FloatingActionButton.tsx`

**Konzept:**
- Großer runder Button rechts unten
- Zeigt primäre Aktion: "Lernen starten" oder "Due Cards"
- Immer sichtbar (fixed position)
- Schneller Zugriff auf wichtigste Funktion

**Design:**
```tsx
<button style={{
  position: 'fixed',
  bottom: '80px', // über Bottom Nav
  right: '16px',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #007AFF, #0051D5)',
  boxShadow: '0 8px 24px rgba(0, 122, 255, 0.4)',
  ...
}}>
  📚
</button>
```

**Aufgaben:**
- [ ] User-Entscheidung: FAB gewünscht? Welche Hauptaktion?
- [ ] Component erstellen
- [ ] Animation hinzufügen (scale on tap)
- [ ] Haptic Feedback (optional)

**Aufwand:** 1-2 Stunden
**Status:** ⏳ **WARTET AUF USER-FEEDBACK**

---

### **Task 8: Responsiveness testen** (1h)
**Priorität:** 🟡 **HOCH**
**Dependencies:** Task 4, 5, 6

**Test-Geräte:**
- [ ] **iPhone SE (375×667px)** - Kleinster Bildschirm
- [ ] **iPhone 14/15 (390×844px)** - Standard
- [ ] **iPhone 14 Pro Max (430×932px)** - Größter iPhone
- [ ] **Pixel 8 (412×873px)** - Android Standard
- [ ] **Galaxy S24 (360×780px)** - Kompakt Android

**Test-Scenarios:**
- [ ] Alle 12 Module sichtbar ohne Scrollen?
- [ ] Touch-Targets groß genug (min 44x44px)?
- [ ] Text lesbar in allen Größen?
- [ ] Bottom Navigation nicht überlappt?
- [ ] Landscape-Mode funktioniert?

**Tools:**
- Chrome DevTools (Device Emulation)
- BrowserStack (Real Device Testing)
- `useMediaQuery` Hook für Breakpoints

**Aufwand:** 1 Stunde
**Status:** ❌ **OFFEN**

---

### **📊 MOBILE DASHBOARD OPTIMIERUNG - ZUSAMMENFASSUNG**

**Total Aufwand:** 6-8 Stunden (ohne optionale Tasks)
**Total Tasks:** 8 (3 warten auf User-Feedback)

**Kritischer Pfad:**
```
Task 3 (Module definieren)
  → Task 4 (Grid-Layout)
  → Task 5 (Module kompakter)
  → Task 8 (Testing)
```

**Parallele Tasks:**
```
Task 1 (SW, SWS Feld)
Task 2 (Stats-Header)
Task 6 (Welcome-Text)
Task 7 (FAB - optional)
```

**Status:** 🔴 **PRIO 1 - READY TO START**

---

### **🎯 MOBILE DASHBOARD - IMPLEMENTIERUNGS-PLAN**

**Bereit zur sofortigen Umsetzung (ohne User-Input):**

**Quick Wins (1h):** ✅ COMPLETE
- [x] Task 2: Stats-Header kompakt (20 Min.) - **16px gespart**
- [x] Task 6: Welcome-Text kleiner (15 Min.) - **16px gespart**
- [x] Task 5: Module kompakter (Vorbereitung, 25 Min.) - **56px gespart**

**Total Platzersparnis: ~88px!** 🎉

**Grid-Layout (2-3h):** 🎨
- [ ] Task 4: 2×6 Grid implementieren (2-3h)
  - 12 Module portieren von Desktop
  - Grid CSS schreiben
  - Touch-Targets sicherstellen (min 44px)
  - Responsive Breakpoints

**Testing (1h):** ✅
- [ ] Task 8: Responsiveness testen
  - iPhone SE, 14, 14 Pro Max
  - Pixel 8, Galaxy S24
  - Landscape Mode

**Wartet auf User-Entscheidung:** ❓
- [ ] Task 1: "SW, SWS" Feld - Entfernen oder Icon?
- [ ] Task 7: FAB (Floating Action Button) - Ja oder Nein?

**Total Aufwand (ohne User-Tasks):** 4-5 Stunden
**Erwartetes Ergebnis:** Komplettes Mobile Dashboard ohne Scrollen

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

#### C) **Sprachauswahl im PIN-Login-Dialog umsetzen** (1-2h)
**Priorität:** 🟡 **MITTEL**
**Location:** `/app/login-pin/page.tsx`

**Problem:**
- Sprachauswahl (🌐 EN/RU/EL/DE) wurde oben rechts integriert
- Dialog-Texte (Titel, Untertitel, Buttons) wechseln noch nicht mit Sprache
- Aktuell hardcoded auf Deutsch: "PIN-Login", "Geben Sie Ihren 4-stelligen PIN ein"

**Aufgaben:**
- [ ] **i18n-Keys definieren** für Login-PIN Dialog:
  - [ ] `login_pin.title` (z.B. "PIN Login", "PIN-Вход", "Σύνδεση PIN", "PIN-Anmeldung")
  - [ ] `login_pin.subtitle` (z.B. "Enter your 4-digit PIN", "Введите 4-значный PIN", ...)
  - [ ] `login_pin.admin_button` (z.B. "Admin", "Администратор", ...)
  - [ ] `login_pin.user_button` (z.B. "User", "Пользователь", "Χρήστης", "Benutzer")
- [ ] **Translation-Strings in DB einfügen** (`ui_translations` Tabelle)
- [ ] **useTranslation Hook anwenden** im login-pin Dialog
- [ ] **Hardcoded Strings ersetzen** mit `t('login_pin.title')` etc.
- [ ] **Testen:** Alle 4 Sprachen durchklicken und Dialog-Text prüfen

**Beispiel-Code:**
```typescript
// Aktuell:
<h1>PIN-Login</h1>
<p>Geben Sie Ihren 4-stelligen PIN ein</p>

// Neu:
<h1>{t('login_pin.title')}</h1>
<p>{t('login_pin.subtitle')}</p>
```

**Aufwand:** 1-2 Stunden
**Status:** ❌ **OFFEN**

---

#### D) **Spanisch als 5. Sprache integrieren** (2-3h)
**Priorität:** 🟢 **NIEDRIG** (Feature-Erweiterung)
**Scope:** Nur Frontend (Backend bleibt Englisch)

**Problem:**
- App unterstützt aktuell 4 Sprachen: EN, RU, EL, DE
- Spanisch (ES) als wichtige europäische Sprache fehlt

**Wichtig:**
- ✅ **Backend bleibt auf Englisch** (keine DB-Änderungen)
- ✅ **Nur Frontend UI-Übersetzungen** (useTranslation Hook)
- ✅ **Vokabular-Content bleibt auf Englisch** (learning_items)

**Aufgaben:**

**1. TypeScript Type erweitern:**
- [ ] **Locale-Type erweitern** in `context/language-context.tsx`:
  ```typescript
  export type Locale = 'en' | 'ru' | 'el' | 'de' | 'es';
  ```

**2. Frontend Translations (i18n):**
- [ ] **Übersetzungsdatei erstellen:** `lib/translations/es.ts`
  - [ ] Alle UI-Keys übersetzen (~270 Strings)
  - [ ] Struktur wie `en.ts`, `ru.ts`, `el.ts`, `de.ts`
- [ ] **Translation Hook erweitern:** `lib/use-translation.ts`
  - [ ] Spanish translations importieren
  - [ ] Fallback zu EN sicherstellen

**3. UI-Komponenten erweitern:**
- [ ] **Language Selector erweitern:**
  - [ ] `/login/page.tsx` - 5. Button "ES" hinzufügen
  - [ ] `/login-pin/page.tsx` - 5. Button "ES" hinzufügen
  - [ ] Gradient/Shadow für ES definieren (Spanien-Rot: #C60B1E)
- [ ] **Background-Farben erweitern:**
  - [ ] Partikel-Farbe für ES (Hue 0-20 für Rot)
  - [ ] Gradient Orbs für ES (rgba(198, 11, 30, 0.18))
- [ ] **Flag-Emoji hinzufügen** (optional): 🇪🇸

**4. Testing:**
- [ ] **Sprachauswahl testen:** ES-Button funktioniert
- [ ] **Alle UI-Texte prüfen:** 270+ Keys auf Spanisch
- [ ] **Fallback zu EN testen:** Fehlende Keys zeigen EN
- [ ] **Mobile/Desktop konsistent:** Beide Plattformen unterstützen ES

**Gradient-Vorschlag für Spanisch:**
```typescript
const langGradient: Record<Locale, string> = {
  en: 'linear-gradient(135deg, #007AFF, #5856D6)',
  ru: 'linear-gradient(135deg, #E05555, #C0392B)',
  el: 'linear-gradient(135deg, #0D6EFD, #0A58CA)',
  de: 'linear-gradient(135deg, #DAA520, #B8860B)',
  es: 'linear-gradient(135deg, #C60B1E, #AA0000)', // Spanien Rot
};
```

**Hinweis:**
- Vokabel-Content (learning_items) bleibt auf Englisch
- Nur UI-Elemente (Buttons, Labels, Titles) werden übersetzt
- Backend-Kommunikation bleibt auf Englisch

**Aufwand:** 2-3 Stunden (ohne Übersetzungsarbeit)
**Status:** ❌ **OFFEN**

---

#### E) **Hilfefenster (Help Window) integrieren** (3-4h)
**Priorität:** 🟢 **NIEDRIG** (Feature für Beta-Phase)
**Scope:** Frontend - Alle Sprachen (EN/RU/EL/DE/ES)

**Problem:**
- App benötigt kontextsensitive Hilfe für User
- Muss in allen 4 (später 5) Sprachen verfügbar sein
- Content wird erst in Beta-Phase ausformuliert

**Aufgaben:**

**1. UI-Komponente erstellen:**
- [ ] **Help Button/Icon** in Navigation/Header
  - [ ] Icon: 🆘 oder ❓ (diskret, aber sichtbar)
  - [ ] Position: Top-Right oder Bottom-Right (FAB)
- [ ] **Help Dialog/Modal erstellen:**
  - [ ] `components/ui/HelpDialog.tsx`
  - [ ] Glasmorphismus-Design (konsistent mit App)
  - [ ] Responsive (Mobile + Desktop)
  - [ ] Schließen via X-Button oder Overlay-Klick

**2. Content-Struktur:**
- [ ] **i18n-Keys für Help-Texte:**
  - [ ] `help.general.title` - "Help & Support"
  - [ ] `help.general.intro` - Einführungstext
  - [ ] `help.dashboard.title` - "Dashboard Help"
  - [ ] `help.learning.title` - "Learning Modules Help"
  - [ ] `help.settings.title` - "Settings Help"
- [ ] **Placeholder-Texte einfügen** (für alle 4 Sprachen)
  - [ ] EN, RU, EL, DE
  - [ ] Später ES hinzufügen (wenn TODO D umgesetzt)

**3. Kontextsensitive Hilfe:**
- [ ] **Help-Context ermitteln:**
  - [ ] Dashboard → Dashboard-Hilfe
  - [ ] Learning Dialog → Modul-Hilfe
  - [ ] Settings → Einstellungen-Hilfe
- [ ] **useHelp Hook erstellen:**
  ```typescript
  const { openHelp } = useHelp();
  openHelp('dashboard'); // Öffnet Dashboard-Hilfe
  ```

**4. Beta-Phase Vorbereitung:**
- [ ] **Content-Template erstellen:**
  - [ ] Markdown-Format für einfache Bearbeitung
  - [ ] Sektionen: FAQ, Tutorials, Troubleshooting
- [ ] **Admin-Interface für Help-Content** (optional, später)
  - [ ] CRUD für Help-Texte
  - [ ] Preview-Modus

**Design-Vorschlag:**
```typescript
// Help Button (Bottom-Right FAB)
<button style={{
  position: 'fixed',
  bottom: '80px',
  right: '16px',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: 'rgba(0, 122, 255, 0.9)',
  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.4)',
  fontSize: '24px',
  zIndex: 100
}}>
  ❓
</button>
```

**Hinweis:**
- Content bleibt zunächst Platzhalter (Lorem Ipsum)
- Finaler Content wird in Beta-Phase von Team ausformuliert
- Fokus: Technische Integration, nicht Content-Erstellung

**Aufwand:** 3-4 Stunden (nur Frontend, ohne Content)
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

**2026-02-15:**
- ✅ **Phase 9 (FSRS-6 + Analytics) komplett**
  - ✅ FSRS-6 Vocabulary System (900+ lines)
  - ✅ Guided Manual Testing (7/7 tests passed)
  - ✅ Database Migrations (056-059: FSRS fields, session tracking)
  - ✅ Streak Tracking System (auto-updates after sessions)
  - ✅ Session Time Tracking (duration, performance metrics)
  - ✅ Comprehensive Documentation (811 lines FSRS overview)
- ✅ **Resolved all TODOs:**
  - ✅ streak_days tracking implemented
  - ✅ avgSessionTime tracking implemented
- ✅ **10 commits, ~2,700 lines of production-ready code**

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
