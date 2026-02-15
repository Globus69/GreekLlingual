# 📋 ZENTRALE TODO-LISTE
**Projekt:** HellenicHorizons GreekLingua Dashboard
**Letzte Aktualisierung:** 2026-02-15 (Audio-Playback Feature)
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

#### C) **Sprachauswahl im PIN-Login-Dialog umsetzen** (1-2h) ✅ IMPLEMENTIERT
**Priorität:** 🟡 **MITTEL**
**Location:** `/app/login-pin/page.tsx`
**Status:** ✅ **IMPLEMENTIERT (2026-02-15)** - Testing ausstehend

**Problem (gelöst):**
- Sprachauswahl (🌐 EN/RU/EL/DE) wurde oben rechts integriert
- Dialog-Texte (Titel, Untertitel, Buttons) wechseln noch nicht mit Sprache
- Aktuell hardcoded auf Deutsch: "PIN-Login", "Geben Sie Ihren 4-stelligen PIN ein"

**Aufgaben:**
- [x] **i18n-Keys definieren** für Login-PIN Dialog:
  - [x] `login_pin.title` (z.B. "PIN Login", "PIN-Вход", "Σύνδεση PIN", "PIN-Anmeldung")
  - [x] `login_pin.subtitle` (z.B. "Enter your 4-digit PIN", "Введите 4-значный PIN", ...)
  - [x] `login_pin.admin_button` (z.B. "Admin", "Администратор", ...)
  - [x] `login_pin.user_button` (z.B. "User", "Пользователь", "Χρήστης", "Benutzer")
- [x] **Translation-Strings hinzugefügt:**
  - [x] FALLBACK_EN (use-translation.ts) - Offline fallback
  - [x] FALLBACK_EL (use-translation.ts) - Greek offline fallback
  - [x] FALLBACK_DE (use-translation.ts) - German offline fallback
  - [x] SQL Migration erstellt (`add_login_pin_translations.sql`) für alle 4 Sprachen
- [x] **useTranslation Hook anwenden** im login-pin Dialog (bereits importiert)
- [x] **Hardcoded Strings ersetzen** mit `t('login_pin.title')` etc.
- [ ] **Testen:** Alle 4 Sprachen durchklicken und Dialog-Text prüfen (→ TESTING TODO)

**Implementierung:**
```typescript
// Vorher:
<h1>PIN-Login</h1>
<p>Geben Sie Ihren 4-stelligen PIN ein</p>
<button>Admin</button>
<button>User</button>

// Nachher:
<h1>{t('login_pin.title')}</h1>
<p>{t('login_pin.subtitle')}</p>
<button>{t('login_pin.admin_button')}</button>
<button>{t('login_pin.user_button')}</button>
```

**Files Modified:**
- `src/lib/use-translation.ts` - Added 4 keys × 3 languages (EN/EL/DE)
- `src/app/login-pin/page.tsx` - Replaced 4 hardcoded strings
- `database/migrations/add_login_pin_translations.sql` - SQL for DB (EN/RU/EL/DE)
- Build: ✅ Successful

**Next Step:** SQL Migration ausführen + Comprehensive Testing (siehe TESTING TODO)

**Aufwand:** 1-2 Stunden
**Status:** ✅ **IMPLEMENTIERT** - ⏳ Testing ausstehend

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

### **2. Daily Phrases - Desktop + Mobile** 💬
**Priorität:** 🟡 **HOCH** (Kernmodul für beide Plattformen)
**Status:** ⚠️ Nur HTML-Prototyp vorhanden (`/daily-phrases/daily-phrases.html`)
**Referenz:** `modules/daily-phrases/daily-phrases-todo.md`

**Problem:**
- HTML-Prototyp existiert unter `/daily-phrases/daily-phrases.html`
- Keine React-Integration in Desktop Dashboard
- Keine Integration in Mobile Dashboard
- Kein Backend/DB-Anbindung

**Aufgaben:**

**Phase 1: React-Komponente erstellen (3-4h)**
- [ ] **DailyPhrasesDialog Component:**
  - [ ] `components/learning/DailyPhrasesDialog.tsx` erstellen
  - [ ] HTML-Prototyp zu React migrieren
  - [ ] TypeScript Interfaces definieren (Phrase, Category)
  - [ ] Glasmorphismus-Design (konsistent mit anderen Dialogen)
- [ ] **Phrase-Struktur:**
  ```typescript
  interface DailyPhrase {
    id: string;
    phrase_greek: string;
    phrase_english: string;
    category: 'greeting' | 'shopping' | 'restaurant' | 'travel';
    difficulty: 'easy' | 'medium' | 'hard';
    audio_url?: string;
  }
  ```

**Phase 2: Desktop Integration (1h)**
- [ ] Button in Desktop Dashboard hinzufügen
- [ ] Dialog State Management
- [ ] 3 Phrasen pro Tag laden

**Phase 3: Mobile Integration (1h)**
- [ ] Button "💬 Daily Phrases" funktional machen
- [ ] Mobile-optimiertes Layout
- [ ] Touch-Gesten

**Phase 4: Backend (2-3h)**
- [ ] Supabase `daily_phrases` Tabelle erstellen
- [ ] RPC `get_daily_phrases(user_id, date)` erstellen
- [ ] Progress-Tracking in `student_progress`

**Aufwand:** 7-9 Stunden (komplett)
**Dependencies:** HTML-Prototyp analysieren, DB-Schema definieren

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

### **4. Review Vocabulary (FSRS-6) - Mobile Integration** 🔁
**Priorität:** 🟢 **MITTEL** (Komponente existiert, nur Integration fehlt)
**Status:** ✅ **IMPLEMENTIERT** (Testing ausstehend)

**Problem:**
- VocabularyDialog mit FSRS-6 ist bereits implementiert (Desktop)
- Mobile Dashboard Button "📖 Review Vocab" zeigt nur `alert('Review - Coming soon!')`
- Integration in Mobile Dashboard fehlt

**Aufgaben:**
- [ ] **Mobile Integration:**
  - [ ] VocabularyDialogFSRS in `/m/page.tsx` importieren
  - [ ] State für Dialog (open/close) hinzufügen
  - [ ] Button onClick: Dialog öffnen statt Alert
  - [ ] Props übergeben: `mode: 'review'`, `userId`, etc.
- [ ] **Mobile-spezifische Anpassungen:**
  - [ ] Touch-optimierte Controls (min 44px)
  - [ ] Swipe-Gesten für Flashcards (optional)
  - [ ] Responsive Layout testen (iPhone SE bis Pro Max)
- [ ] **Performance-Tests:**
  - [ ] Ladezeit < 1s
  - [ ] Smooth Animationen (60fps)

**Aufwand:** 1-2 Stunden (nur Integration + Testing)
**Dependencies:** Keine (VocabularyDialogFSRS existiert bereits)

---

### **5. Train Weak Words - Mobile Integration** 💪
**Priorität:** 🟡 **HOCH** (Kernmodul für Mobile)
**Status:** ✅ **IMPLEMENTIERT** (Testing ausstehend)

**Implementiert:**
- [x] Mobile Integration (VocabularyDialog mit `mode: 'weak'`)
- [x] Button "💪 Weak Words" öffnet Dialog
- [x] Filtert Wörter mit ease_factor < 2.0

**Offene Aufgaben:**
- [ ] Testing auf verschiedenen Geräten
- [ ] Performance-Tests

**Aufwand:** 30min (bereits erledigt)

---

### **6. Grammar Quick Hits - Desktop + Mobile** 📐
**Priorität:** 🟡 **MITTEL** (Neues Modul)
**Status:** ❌ Nicht implementiert

**Problem:**
- Button "📐 Grammar" existiert im Mobile Dashboard
- Zeigt nur `alert('Grammar - Coming soon!')`
- Kein Desktop-Equivalent
- Keine Komponente vorhanden

**Aufgaben:**

**Phase 1: Komponente erstellen (4-5h)**
- [ ] **GrammarDialog Component:**
  - [ ] `components/learning/GrammarDialog.tsx` erstellen
  - [ ] Quiz-Format: Multiple Choice oder Fill-in-the-blank
  - [ ] Grammatik-Regeln anzeigen (z.B. Artikel, Fälle, Verben)
  - [ ] Feedback bei richtigen/falschen Antworten
  - [ ] Glasmorphismus-Design
- [ ] **Grammar-Struktur:**
  ```typescript
  interface GrammarRule {
    id: string;
    title: string; // "Definite Articles (ο, η, το)"
    explanation: string; // Rule explanation
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'articles' | 'cases' | 'verbs' | 'adjectives';
  }

  interface GrammarExercise {
    id: string;
    rule_id: string;
    question: string;
    options: string[];
    correct_answer: number;
    explanation?: string;
  }
  ```

**Phase 2: Desktop Integration (1h)**
- [ ] Action Tile in Desktop Dashboard hinzufügen
- [ ] "📐 Grammar Hits" Button
- [ ] Dialog State Management

**Phase 3: Mobile Integration (30min)**
- [ ] Button "📐 Grammar" funktional machen
- [ ] Mobile-optimiertes Layout
- [ ] Touch-optimiert

**Phase 4: Backend (2-3h)**
- [ ] Supabase `grammar_rules` Tabelle
- [ ] Supabase `grammar_exercises` Tabelle
- [ ] RPC `get_grammar_exercises(level, limit)`
- [ ] Progress-Tracking

**Aufwand:** 8-10 Stunden (komplett)
**Dependencies:** Keine

---

### **7. Audio-Playback bei Klick auf Kartenrückseite** 🔊 ✅ IMPLEMENTIERT
**Priorität:** 🟢 **MITTEL** (UX-Verbesserung)
**Scope:** Alle Vocabulary-Module (Desktop + Mobile)
**Status:** ✅ **IMPLEMENTIERT (2026-02-15)**

**Problem (gelöst):**
- Aktuell: Audio kann nur über Lautsprecher-Icon abgespielt werden
- Gewünscht: Klick auf Kartenrückseite spielt Audio ab

**Ziel:**
Intuitive Audio-Wiedergabe durch Klick auf die Karte selbst

**Aufgaben:**

**Phase 1: Click-Handler implementieren (1-2h)** ✅ ERLEDIGT
- [x] **VocabularyDialogFSRS Component:**
  - [x] onClick-Handler für Kartenrückseite hinzufügen (onBackClick prop)
  - [x] Nur auf Rückseite aktiv (nicht auf Vorderseite)
  - [x] Audio abspielen wenn verfügbar (playAudio function)
- [x] **Visual Feedback:**
  - [x] Cursor: pointer (zeigt Klickbarkeit) via CSS class
  - [x] Subtle Hover-Effekt (z.B. leichtes Highlight) via :hover
  - [ ] Optional: Ripple-Effekt bei Klick (nicht implementiert)

**Phase 2: Mobile Integration (30min-1h)** ✅ ERLEDIGT
- [x] **Touch-Optimierung:**
  - [x] Touch-Handler (onClick funktioniert auch für touch)
  - [x] Verhindere Doppel-Tap-Zoom (durch pointer-events)
  - [ ] Haptic Feedback (optional, nicht implementiert)
- [x] **VocabularyDialog (Weak Words):** Implementiert
- [ ] **TrainWeakWordsSheet:** Nicht notwendig (nutzt VocabularyDialog)
- [ ] **DueCardsSheet:** Nutzt VocabularyDialogFSRS (bereits implementiert)

**Phase 3: Audio-Logik (30min)** ✅ ERLEDIGT
- [x] **Audio-Handling:**
  - [x] Prüfe ob Audio-URL vorhanden (implizit via playAudio)
  - [x] Stoppe laufendes Audio vor neuem Abspielen (speakGreek TTS-API)
  - [x] Error-Handling (bereits in playAudio implementiert)
  - [x] Respektiere Lautsprecher-Icon-State (muted/unmuted)

**Code-Beispiel:**
```typescript
// In VocabularyDialogFSRS
const handleCardClick = () => {
  // Nur auf Rückseite (wenn Antwort sichtbar)
  if (showAnswer && currentItem.audio_url) {
    playAudio(currentItem.audio_url);
  }
};

// JSX
<div
  className="flashcard-back"
  onClick={handleCardClick}
  style={{
    cursor: showAnswer ? 'pointer' : 'default',
    transition: 'background 0.2s ease'
  }}
  onMouseEnter={(e) => {
    if (showAnswer) {
      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
    }
  }}
>
  {/* Card content */}
</div>
```

**Hinweis:**
- Click-Area sollte groß sein (gesamte Kartenrückseite)
- Buttons (1-4) dürfen nicht gestört werden
- Event-Propagation beachten (stopPropagation auf Buttons)

**Aufwand:** 2-3 Stunden (alle Module)
**Dependencies:** Audio-URLs in DB (bereits vorhanden)
**Status:** ✅ **IMPLEMENTIERT (2026-02-15)**

**Implementierung:**
- FlashcardFSRS.tsx: onBackClick prop hinzugefügt, onClick-Handler modifiziert
- VocabularyDialogFSRS.tsx: playAudio als onBackClick übergeben
- VocabularyDialog.tsx: onClick-Handler für flipped state modifiziert
- Hover-Effekt: Blauer Glow bei Hover über Kartenrückseite
- Build: ✅ Erfolgreich kompiliert

---

### **8. Konsistenz: Alle Learning-Module vereinheitlichen** 🎨
**Priorität:** 🟡 **HOCH** (UX-Konsistenz)
**Aufwand:** 6-8 Stunden (alle 3 Module)
**Status:** ✅ **ERLEDIGT** (2026-02-15)

**Problem:**
- Aktuell haben Learning-Module unterschiedliche Layouts und UX
- VocabularyDialogFSRS (Review Vocabulary) ist am modernsten und hat FSRS-6
- Andere Module (Weak Words, Due Cards, Daily Phrases) müssen angleichen werden
- Inkonsistente User Experience über verschiedene Lern-Modi hinweg

**Ziel:**
Alle Learning-Dialoge haben **identisches Layout und identische Funktionsweise**

**Template (Referenz):** VocabularyDialogFSRS (Review Vocabulary)
- ✅ FSRS-6 Algorithm (4 Ratings: Again/Hard/Good/Easy)
- ✅ Progress Bar oben (current/total, %)
- ✅ Flashcard in der Mitte (Flip-Animation)
- ✅ Rating Buttons unten (4-Button-Layout)
- ✅ Audio Button (🔊 TTS)
- ✅ Swipe-Gesten (Mobile: ←/→/↑/↓)
- ✅ Glasmorphismus-Design (backdrop-blur, rgba)
- ✅ Summary Screen nach Session
- ✅ Stats-Tracking (Hard/Good/Easy counts)

**Clone-Aufgaben:**

**1. Weak Words (VocabularyDialog.tsx) → VocabularyDialogFSRS Clone (2-3h)** ✅
- [x] **Layout Migration:**
  - [x] Progress Bar wie VocabularyDialogFSRS
  - [x] Flashcard-Struktur wie VocabularyDialogFSRS
  - [x] 4-Button-Layout (Currently: 3 Buttons Hard/Good/Easy)
  - [x] Button-Farben angleichen
- [x] **Feature-Parity:**
  - [x] FSRS-6 Integration (statt SM-2)
  - [x] Swipe-Gesten hinzufügen
  - [x] Summary Screen nach Session
  - [x] Stats-Tracking erweitern
- [x] **Filter beibehalten:** fsrs_difficulty > 6.5 für "Weak Words"

**2. Due Cards (noch nicht implementiert) → VocabularyDialogFSRS Clone (2-3h)** ✅
- [x] **Neue Komponente erstellen:** DueCardsDialog.tsx
- [x] **Basierend auf:** VocabularyDialogFSRS (kompletter Clone)
- [x] **Layout:** Identisch zu VocabularyDialogFSRS
- [x] **Features:** Alle Features von VocabularyDialogFSRS
- [x] **Filter:** mode='due' für "Due Cards"
- [x] **Backend:** RPC get_due_cards (mode parameter)

**3. Daily Phrases → VocabularyDialogFSRS Clone (2-3h)** ✅
- [x] **Layout Migration:**
  - [x] Progress Bar wie VocabularyDialogFSRS
  - [x] Flashcard-Struktur verwenden (statt 2-Panel-Layout)
  - [x] 4-Button-Layout (Currently: 3 Buttons Hard/Good/Easy)
  - [x] Swipe-Gesten hinzufügen
- [x] **Feature-Parity:**
  - [x] Summary Screen nach Session
  - [x] Stats-Tracking (Hard/Good/Easy counts)
- [x] **Unterschiede erlaubt:**
  - [x] Content: Phrases statt Vocabulary (Mock Data aktuell)
  - [x] FSRS-6 integriert (Backend-Integration pending Phase 4)

**Einheitliche Features (alle Module):**
- ✅ Identischer Progress-Bar-Style (1/10, 2/10, ... + %)
- ✅ Gleiche Button-Anordnung (4 Buttons horizontal)
- ✅ Gleiche Farben (Again: #FF6B6B, Hard: #FFA94D, Good: #51CF66, Easy: #339AF0)
- ✅ Gleiche Button-Größen und Abstände
- ✅ Gleiche Animations (Flip, Swipe, Transitions)
- ✅ Gleiche Swipe-Gesten (←Again, ↓Hard, ↑Good, →Easy)
- ✅ Glasmorphismus-Design (backdrop-blur, rgba backgrounds)
- ✅ Summary Screen nach Session (Stats-Übersicht)

**Vorteile:**
- Konsistente User Experience über alle Lern-Modi
- Wiederverwendung bewährter UX-Patterns
- Einfachere Wartung (ein Design-System)
- Höhere Code-Qualität durch Wiederverwendung

**Dependencies:**
- VocabularyDialogFSRS existiert bereits (✅)
- Weak Words (WeakWordsDialog) ✅ Refactored als FSRS Clone
- Daily Phrases (DailyPhrasesDialogFSRS) ✅ Refactored als FSRS Clone (Mock Data)
- Due Cards (DueCardsDialog) ✅ Neu erstellt als FSRS Clone

**Aufwand:** 6-8 Stunden (alle 3 Module)
**Status:** ✅ **ERLEDIGT** (2026-02-15)

**Ergebnis:**
- Alle 3 Learning-Module haben jetzt identisches Layout (Progress Bar, Flashcard, 4-Button Rating)
- FSRS-6 Integration in allen Modulen
- Konsistente Swipe-Gesten und Glasmorphismus-Design
- Daily Phrases verwendet aktuell Mock Data (Backend-Integration = Phase 4)

---

### **9. Grammar Module → VocabularyDialogFSRS Clone** 📐
**Priorität:** 🟡 **HOCH** (UX-Konsistenz)
**Aufwand:** 2-3 Stunden
**Status:** ❌ **OFFEN**

**Problem:**
- Das Grammar-Modul existiert noch nicht im Mobile Dashboard
- Sollte konsistent mit anderen Learning-Modulen sein
- Muss gleiche Layout- und Funktionsstruktur wie VocabularyDialogFSRS haben

**Ziel:**
Grammar-Modul als **kompletter Clone von VocabularyDialogFSRS** erstellen

**Template (Referenz):** VocabularyDialogFSRS (Review Vocabulary)
- ✅ FSRS-6 Algorithm (4 Ratings: Again/Hard/Good/Easy)
- ✅ Progress Bar oben (current/total, %)
- ✅ Flashcard in der Mitte (Flip-Animation)
- ✅ Rating Buttons unten (4-Button-Layout)
- ✅ Audio Button (🔊 TTS)
- ✅ Swipe-Gesten (Mobile: ←/→/↑/↓)
- ✅ Glasmorphismus-Design (backdrop-blur, rgba)
- ✅ Summary Screen nach Session
- ✅ Stats-Tracking (Again/Hard/Good/Easy counts)

**Aufgaben:**

**1. Neue Komponente erstellen: GrammarDialogFSRS.tsx**
- [ ] **Basierend auf:** VocabularyDialogFSRS (kompletter Clone)
- [ ] **Layout:** Identisch zu VocabularyDialogFSRS
- [ ] **Features:** Alle Features von VocabularyDialogFSRS
- [ ] **Content-Type:** Grammar Rules statt Vocabulary
- [ ] **Flashcard Format:**
  - Front: Grammar Rule (EN/RU je nach Locale)
  - Back: Greek Examples + Explanation
- [ ] **Mock Data:** 3-5 Grammar Rules für Testing
  - Beispiel 1: "Present Tense -ω verbs"
  - Beispiel 2: "Accusative Case"
  - Beispiel 3: "Past Tense"

**2. Mobile Dashboard Integration**
- [ ] Import: `import GrammarDialogFSRS from '@/components/learning/grammar-dialog-fsrs'`
- [ ] State: `const [showGrammarDialog, setShowGrammarDialog] = useState(false)`
- [ ] Button Handler: `onClick={() => setShowGrammarDialog(true)}`
- [ ] Dialog Render: Conditional rendering mit isOpen/onClose

**3. Einheitliche Features (wie alle Module)**
- [ ] Identischer Progress-Bar-Style
- [ ] Gleiche Button-Anordnung (4 Buttons horizontal)
- [ ] Gleiche Farben (Again: #FF6B6B, Hard: #FFA94D, Good: #51CF66, Easy: #339AF0)
- [ ] Gleiche Button-Größen und Abstände
- [ ] Gleiche Animations (Flip, Swipe, Transitions)
- [ ] Gleiche Swipe-Gesten (←Again, ↓Hard, ↑Good, →Easy)
- [ ] Glasmorphismus-Design (backdrop-blur, rgba backgrounds)
- [ ] Summary Screen nach Session

**Backend (Future - Phase 5):**
- [ ] Supabase Tabelle: `grammar_rules`
  - Columns: id, rule_name_en, rule_name_ru, explanation_en, explanation_ru, example_gr, level, difficulty
- [ ] RPC Function: `get_grammar_rules(p_student_id, p_level)`
- [ ] FSRS-6 Integration: `grammar_progress` Tabelle für User-spezifische Progress

**Unterschiede zu anderen Modulen:**
- **Content:** Grammar Rules statt Vocabulary/Phrases
- **Flashcard Back:** Kann länger sein (Explanation + Multiple Examples)
- **Level Filter:** Optional filter by CEFR Level (A1, A2, B1, B2)

**Vorteile:**
- Konsistente UX mit anderen Learning-Modulen
- Wiederverwendung bewährter FSRS-6 Integration
- Spaced Repetition auch für Grammar-Regeln
- Einheitliches Design und Verhalten

**Dependencies:**
- VocabularyDialogFSRS existiert (✅) - als Template verwenden
- FlashcardFSRS Component existiert (✅)
- Mobile Dashboard existiert (✅)

**Aufwand:** 2-3 Stunden
**Status:** ❌ **OFFEN**

**Nächste Schritte:**
1. GrammarDialogFSRS.tsx erstellen (Clone VocabularyDialogFSRS)
2. Mock Grammar Data hinzufügen (3-5 Rules)
3. In Mobile Dashboard integrieren
4. Testen (Flip, Rating, Audio, Summary)
5. Backend später in Phase 5

---

## 🧪 TESTING & QA

### **Testing: Mobile Learning Modules** 📱
**Priorität:** 🔴 **HOCH** (Vor Production Release)
**Status:** ❌ **OFFEN**

**Implementierte Module zum Testen:**
1. ✅ Review Vocabulary (FSRS-6) - Mobile
2. ✅ Train Weak Words - Mobile
3. ✅ 2×6 Grid Layout - Mobile Dashboard

**Test-Matrix:**

**1. Review Vocabulary (📖) - Funktionstests (30min)**
- [ ] **Button-Klick:** Öffnet VocabularyDialogFSRS
- [ ] **Mode 'all':** Zeigt alle gelernten Wörter
- [ ] **Flashcards:** Flip funktioniert (Vorderseite ↔ Rückseite)
- [ ] **Rating-Buttons:** 1-4 (Again/Hard/Good/Easy) funktionieren
- [ ] **FSRS-6:** Next-Review-Date wird berechnet
- [ ] **Audio:** Lautsprecher-Icon spielt Audio ab
- [ ] **Close:** Dialog schließt korrekt
- [ ] **Progress:** Fortschritt wird in DB gespeichert

**2. Train Weak Words (💪) - Funktionstests (30min)**
- [ ] **Button-Klick:** Öffnet VocabularyDialog
- [ ] **Mode 'weak':** Zeigt nur Wörter mit ease_factor < 2.0
- [ ] **Filter:** Nur schwache Wörter werden geladen
- [ ] **Training:** Rating verbessert ease_factor
- [ ] **Empty State:** "No weak words" wenn alle stark sind
- [ ] **Audio:** Funktioniert wie bei Review
- [ ] **Close:** Dialog schließt korrekt

**3. Grid Layout (2×6) - UI/UX Tests (30min)**
- [ ] **Viewport Fit:** Alle 12 Module sichtbar OHNE Scrollen
- [ ] **Touch Targets:** Buttons min 44x44px
- [ ] **Grid Gaps:** 8px spacing korrekt
- [ ] **Text Lesbarkeit:** Titles (13px) und Subtitles (10px) lesbar
- [ ] **Icons:** 24px Icons klar erkennbar
- [ ] **Hover/Active:** Visual Feedback bei Touch
- [ ] **Admin Panel:** Wird nur für Admin/Teacher angezeigt

**4. Cross-Device Testing (1h)**

**Test-Geräte:**
- [ ] **iPhone SE (375×667px)** - Kleinster Bildschirm
  - [ ] Grid passt ohne Scrollen
  - [ ] Dialogs sind vollständig sichtbar
  - [ ] Buttons sind tappable (44px)
- [ ] **iPhone 14/15 (390×844px)** - Standard
  - [ ] Grid zentriert, kein Scrollen
  - [ ] Dialogs funktionieren smooth
- [ ] **iPhone 14 Pro Max (430×932px)** - Größter iPhone
  - [ ] Layout nutzt verfügbaren Platz
  - [ ] Keine zu großen Abstände
- [ ] **Pixel 8 (412×873px)** - Android Standard
  - [ ] Chrome Browser: alles funktioniert
  - [ ] Grid Layout korrekt
- [ ] **iPad Mini (768×1024px)** - Tablet
  - [ ] Grid skaliert korrekt
  - [ ] Oder: Desktop-Version wird angezeigt?

**5. Performance Tests (30min)**
- [ ] **Ladezeit Dialog:** < 1s
- [ ] **Animation FPS:** 60fps (smooth)
- [ ] **Memory Leaks:** Dialogs schließen ohne Memory-Leak
- [ ] **Audio Loading:** Blockiert nicht die UI
- [ ] **DB-Queries:** < 500ms Response-Zeit

**6. Edge Cases & Error Handling (30min)**
- [ ] **Kein Internet:** Fallback-Daten werden geladen
- [ ] **Kein Audio:** Lautsprecher-Icon disabled oder versteckt
- [ ] **Leere Daten:** Empty State wird angezeigt
- [ ] **User logged out:** Redirect zu /login-pin
- [ ] **Slow Network:** Loading-Spinner wird angezeigt

**7. Browser-Kompatibilität (30min)**
- [ ] **Chrome Mobile:** Alle Features funktionieren
- [ ] **Safari iOS:** Webkit-spezifische Styles OK
- [ ] **Firefox Mobile:** Kein Layout-Bruch
- [ ] **Samsung Internet:** Android Default-Browser

**Aufwand:** 4-5 Stunden (komplettes Testing)
**Dependencies:** Alle Module implementiert (✅)
**Status:** ❌ **OFFEN**

**Blocker für Production:**
- 🔴 Minimum: Tests 1, 2, 3 (Funktionalität + UI)
- 🟡 Empfohlen: Tests 4, 5 (Cross-Device + Performance)
- 🟢 Optional: Tests 6, 7 (Edge Cases + Browser)

---

### **Testing: i18n PIN-Login Dialog** 🌐
**Priorität:** 🟡 **MITTEL** (Nach SQL Migration)
**Status:** ❌ **OFFEN** (SQL Migration muss zuerst ausgeführt werden)

**Voraussetzung:**
- [ ] SQL Migration ausführen: `database/migrations/add_login_pin_translations.sql`

**Test-Matrix:**

**1. Language Selector Functionality (15min)**
- [ ] **EN Button:** Klick wechselt zu Englisch
  - [ ] Title: "PIN Login"
  - [ ] Subtitle: "Enter your 4-digit PIN"
  - [ ] Admin Button: "Admin"
  - [ ] User Button: "User"
- [ ] **RU Button:** Klick wechselt zu Russisch
  - [ ] Title: "PIN-Вход"
  - [ ] Subtitle: "Введите 4-значный PIN"
  - [ ] Admin Button: "Администратор"
  - [ ] User Button: "Пользователь"
- [ ] **EL Button:** Klick wechselt zu Griechisch
  - [ ] Title: "Σύνδεση PIN"
  - [ ] Subtitle: "Εισάγετε τον 4ψήφιο PIN σας"
  - [ ] Admin Button: "Διαχειριστής"
  - [ ] User Button: "Χρήστης"
- [ ] **DE Button:** Klick wechselt zu Deutsch
  - [ ] Title: "PIN-Anmeldung"
  - [ ] Subtitle: "Geben Sie Ihre 4-stellige PIN ein"
  - [ ] Admin Button: "Administrator"
  - [ ] User Button: "Benutzer"

**2. Language Persistence (10min)**
- [ ] **Sprache wechseln → Seite neu laden:** Sprache bleibt erhalten
- [ ] **Sprache wechseln → Login → Dashboard:** Sprache bleibt erhalten
- [ ] **Admin-Login:** Language Selector übernimmt gewählte Sprache

**3. Fallback Behavior (10min)**
- [ ] **Offline-Modus:** Fallback-Translations aus use-translation.ts werden geladen
- [ ] **Fehlende DB-Keys:** Fallback zu EN wird verwendet
- [ ] **Netzwerk-Fehler:** UI bleibt funktional mit Fallback

**4. Mobile Testing (10min)**
- [ ] **iPhone SE (375px):** Texte passen, kein Overflow
- [ ] **iPhone 14 (390px):** Layout korrekt
- [ ] **Android (412px):** Alle Buttons funktionieren

**Aufwand:** 45 Minuten
**Dependencies:**
- ✅ Code implementiert
- ❌ SQL Migration ausgeführt
**Status:** ❌ **OFFEN**

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
