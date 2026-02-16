───────────────────────────────────────────────────────────────
## WICHTIGER CHECKPOINT – Stand 16. Februar 2026 – vor Kontext-Reset

Diese Datei ist die Single Source of Truth für die Fortsetzung der Arbeiten.

Aktueller Kontext wird bald sehr knapp → neuer Tab / neue Session wird gestartet.

Bitte bei jedem Neustart / neuer Session als allererstes diese Datei lesen und
dann exakt ab dem nächsten offenen Punkt weiterarbeiten.

Letzte erfolgreich bearbeitete Punkte (Stand: 2026-02-16 17:00):
• ✅ Punkt 1 & 2: .env.local Sicherheit + Hardcoded Admin-Credentials entfernt
• ✅ Punkt 5: Rate-Limiter auf fail-closed umgestellt
• ✅ Punkt 7: Hardcoded Supabase-URL entfernt
• ✅ Punkt 8: Input-Sanitization & SQL-Injection-Prävention mit Zod
• ✅ Punkt 4: Server-seitige Autorisierung + Bulk-Delete RPC (Migration 066 deployed!)
• ✅ Punkt 17: Spanisch vollständig ins Projekt integriert
• ✅ Punkt 18: Griechisch aus mobiler Login-Screen-Auswahl entfernt
• ✅ Punkt 19: Hardcoded Credentials in Scripts entfernt

**Fortschritt: 47% (9 von 19 Punkten)** 🎉

Nächste geplante Schritte (priorisiert nach Aufwand):
1. 🔒 Punkt 6: IP-Whitelisting server-seitig (1-3h, HOCH) ← NÄCHSTER SCHRITT
2. 🔒 Punkt 3: localStorage → httpOnly Cookies (3-8h, HOCH)
3. 🔒 Punkt 9: CSRF-Protection (3-8h, MITTEL)
4. 🔒 Punkt 10: TypeScript Strict Mode (3-8h, MITTEL)
5. 🐌 Performance-Optimierungen (Punkte 11-13)
6. 🧹 Code-Qualität (Punkte 14-16)

Anweisung für neue Sessions:
"Sag mir bitte zuerst: 'Ich habe die TODO-Datei gelesen.'
 Danach fahre exakt mit dem nächsten offenen Punkt fort."

───────────────────────────────────────────────────────────────

# TODO - Audit & Optimierungen
**Projekt:** Hellenic Horizons – GreekLingua Dashboard
**Datum:** 16. Februar 2026
**Status:** Code-Audit durchgeführt, Umsetzung in Arbeit

---

## 🔴 Offene Sicherheits-Themen – PRIORITÄT HOCH

### 1. ✅ ~~.env.local aus Repository entfernen~~ **ERLEDIGT**
- **Status:** ✅ Geprüft – Datei ist NICHT in Git getrackt, .gitignore korrekt
- **Dateien:** `.gitignore` (Zeile 34, 54)
- **Ergebnis:** Keine Aktion nötig, Konfiguration ist sicher

### 2. ✅ ~~Hardcoded Admin-Credentials entfernen~~ **ERLEDIGT**
- **Status:** ✅ Commit `4f2d809` – Fallback-Admin entfernt
- **Dateien:** `src/context/auth-context.tsx:186-202`
- **Schwere:** KRITISCH (CVSS 9.8) → Behoben
- **Commit:** `2026-02-16 12:56` – fix(security): Remove hardcoded admin credentials

### 3. localStorage durch httpOnly Cookies ersetzen
- **Dateien:** `src/context/auth-context.tsx`, `src/app/login-pin/page.tsx`, alle Session-Zugriffe
- **Problem:** Session-Token in localStorage → XSS-anfällig. Angreifer können mit einem Script komplette Session übernehmen.
- **Schwere:** HOCH (CVSS 7.5) – XSS führt zu vollständiger Account-Übernahme
- **Lösung:**
  - API-Route für Session-Management erstellen (`/api/auth/session`)
  - httpOnly Cookies verwenden
  - CSRF-Protection implementieren (siehe Punkt 9)
  - SameSite=Strict Cookie-Attribut setzen
- **Aufwand:** Mittel (3–8 h)

### 4. ✅ ~~Server-seitige Autorisierung für kritische Operationen~~ **ERLEDIGT**
- **Status:** ✅ Implementiert & Migration ausgeführt – Alle kritischen Operationen mit Admin-Check gesichert
- **Dateien:**
  - `database/migrations/066_add_bulk_delete_rpc_with_auth.sql` → Bulk-Delete RPC (NEU) ✅ DEPLOYED
  - `src/lib/supabase/content.ts` → bulkDeleteContent verwendet jetzt RPC
  - `src/app/login-pin/page.tsx` → Client-seitige Honeypot-Checks entfernt
  - `docs/AUTHORIZATION.md` → Vollständige Dokumentation (NEU)
- **Schwere:** HOCH (CVSS 8.1) → Behoben
- **Migration:** ✅ 2026-02-16 - Migration 066 in Supabase ausgeführt
- **Implementierte Sicherheitsmaßnahmen:**
  - **Bulk Delete:** `admin_bulk_delete_content` RPC mit Admin-Check (max 100 items)
  - **Honeypot-Checks:** Server-seitig in `verify_user_4digit_pin` (nicht umgehbar)
  - **RLS-Policies:** Content-Tabelle nur via RPC-Funktionen modifizierbar
  - **Admin-Validierung:** `is_admin_user()` Funktion für alle kritischen Operationen
  - **SECURITY DEFINER:** Alle RPC-Funktionen mit erhöhten Rechten
- **Bestehende RPC-Funktionen (bereits vorhanden):**
  - `admin_create_content` ✅
  - `admin_update_content` ✅
  - `admin_delete_content` ✅
  - `admin_bulk_import_content` ✅
  - `verify_user_4digit_pin` (mit Honeypot-Checks) ✅
- **Honeypot-System:**
  - 15 verbotene PINs (0000, 1111-9999, 1234, etc.)
  - Automatischer 24h IP-Ban bei Honeypot-Versuch
  - Logging in `honeypot_log` Tabelle
  - `ban_ip()` und `is_ip_banned()` RPC-Funktionen
- **Commit:** `2026-02-16` – feat(security): Add server-side authorization and bulk delete RPC

### 5. ✅ ~~Rate-Limiter fail-closed statt fail-open~~ **ERLEDIGT**
- **Status:** ✅ Commit `TBD` – Rate-Limiter auf fail-closed umgestellt
- **Dateien:** `src/lib/rate-limit.ts:64, 88`
- **Schwere:** HOCH (CVSS 7.3) → Behoben
- **Änderungen:**
  - `checkRateLimit()`: Gibt jetzt `success: false` bei Redis-Fehler zurück
  - `checkRateLimitAdmin()`: Neue Funktion für Admin-Login mit fail-closed
  - Verhindert Brute-Force-Angriffe bei Redis-Ausfall
- **Hinweis:** Integration in Login-Flow erfolgt mit Punkt 4 (API-Routes)
- **Commit:** `2026-02-16` – fix(security): Rate-limiter fail-closed to prevent brute-force

### 6. IP-Whitelisting server-seitig implementieren
- **Dateien:** `src/app/login/page.tsx`, `.env.example:21`
- **Problem:** `NEXT_PUBLIC_ADMIN_ALLOWED_IPS` ist client-seitig lesbar → kann umgangen werden
- **Schwere:** HOCH (CVSS 6.5) – IP-Whitelist nutzlos
- **Lösung:**
  - Umgebungsvariable ohne `NEXT_PUBLIC_` Prefix verwenden
  - IP-Check in API-Route/Middleware (server-seitig)
  - Next.js Middleware für Admin-Routes
- **Aufwand:** Gering (1–3 h)

### 7. ✅ ~~Hardcoded Supabase-URL entfernen~~ **ERLEDIGT**
- **Status:** ✅ Implementiert – URL aus Umgebungsvariable geladen
- **Dateien:** `src/app/api/honeypot-alert/route.ts:43-50`
- **Schwere:** MITTEL (CVSS 5.0) → Behoben
- **Änderungen:**
  - Hardcoded URL ersetzt durch `process.env.NEXT_PUBLIC_SUPABASE_URL`
  - Validierung hinzugefügt: Error 500 wenn Variable nicht gesetzt
  - URL dynamisch konstruiert: `${supabaseUrl}/functions/v1/send-telegram`
- **Hinweis:** Weitere hardcoded URLs in Scripts gefunden (siehe Punkt 19)
- **Commit:** `2026-02-16` – fix(config): Replace hardcoded Supabase URL with env variable

---

## 🟡 Offene Sicherheits-Themen – PRIORITÄT MITTEL

### 8. ✅ ~~Input-Sanitization & SQL-Injection-Prävention~~ **ERLEDIGT**
- **Status:** ✅ Implementiert – Zod-Validierung für alle User-Inputs
- **Dateien:**
  - `src/lib/validation/schemas.ts` → Zentrale Validation-Schemas (NEU)
  - `src/lib/validation/README.md` → Dokumentation (NEU)
  - `src/lib/supabase/content.ts` → Alle Funktionen validiert
  - `src/app/api/honeypot-alert/route.ts` → PIN-Validierung
- **Schwere:** MITTEL → Behoben
- **Implementierte Validierungen:**
  - `searchSchema` → Max 100 Zeichen, nur sichere Zeichen (Latin, Greek, Punktuation)
  - `contentInsertSchema` / `contentUpdateSchema` → Vollständige Content-Validierung
  - `uuidSchema` → ID-Validierung für alle DB-Operationen
  - `bulkDeleteSchema` → Validierung für Bulk-Operationen
  - `pinSchema` → 4-stellige PIN-Validierung
  - `filterParamsSchema` → Filter-Parameter für Queries
- **Security Features:**
  - Regex-Whitelisting (keine SQL-Injection-Zeichen)
  - Max-Length-Constraints
  - Type-Safety mit TypeScript + Zod
  - Zentralisierte Error-Handling mit `safeParse()`
- **Commit:** `2026-02-16` – feat(security): Add Zod input validation for SQL injection prevention

### 9. CSRF-Protection für State-Changing Operations
- **Dateien:** Alle POST/PUT/DELETE API-Routes
- **Problem:** Keine CSRF-Tokens → Cross-Site Request Forgery möglich
- **Lösung:**
  - CSRF-Token-Middleware implementieren
  - Token in Cookie speichern + in Header prüfen
  - Für Next.js: `next-csrf` oder custom Middleware
- **Aufwand:** Mittel (3–8 h)

### 10. TypeScript Strict Mode aktivieren
- **Dateien:** `tsconfig.json`
- **Problem:** Keine `strict: true` → Type-Safety-Probleme (z.B. `process.env` ohne null-checks)
- **Lösung:**
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```
- **Aufwand:** Mittel (3–8 h) – Bestehenden Code anpassen

---

## 🐌 Performance-Optimierungen

### 11. Database Performance Audit
- **Dateien:** `database/migrations/*.sql`, `src/lib/supabase/content.ts`
- **Problem:**
  - SELECT * statt spezifische Felder (Zeile 16: `select('*', { count: 'exact' })`)
  - Fehlende Indizes (muss in DB geprüft werden)
  - N+1 Queries möglich bei verschachtelten Abfragen
- **Lösung:**
  - SELECT nur benötigte Felder: `select('id, type, english, greek, level, difficulty')`
  - Index-Analyse: `EXPLAIN ANALYZE` auf häufige Queries
  - Composite Index auf `(level, difficulty, type)` für schnelles Filtern
- **Aufwand:** Mittel (3–8 h)

### 12. Connection-Pooling & Timeout-Konfiguration
- **Dateien:** `src/lib/supabase/client.ts`, `src/db/supabase.ts`
- **Problem:** Supabase-Client hat keine explizite Pool-Size oder Timeout-Konfiguration
- **Lösung:**
  ```typescript
  export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'public' },
    auth: { persistSession: false },
    global: {
      headers: { 'x-application-name': 'greeklingua' },
      fetch: (url, options) => {
        return fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
      }
    }
  });
  ```
- **Aufwand:** Gering (1–3 h)

### 13. Canvas-Animation Performance-Optimierung
- **Dateien:** `src/app/login-pin/page.tsx:38-116`, `src/app/login/page.tsx`
- **Problem:** 60 Particles + Verbindungslinien könnten auf Low-End-Geräten laggen
- **Lösung:**
  - RequestAnimationFrame Throttling (max 30 FPS auf Mobile)
  - Particle-Reduktion bei Low-FPS-Detection
  - `will-change: transform` CSS-Property für Canvas
  - Beispiel:
    ```typescript
    let lastFrameTime = 0;
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (currentTime - lastFrameTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;
      // ... render logic
    };
    ```
- **Aufwand:** Gering (1–3 h)

---

## 🧹 Code-Qualität & Konsistenz

### 14. Konsistentes Error-Handling
- **Dateien:** Alle API-Routes, `src/context/auth-context.tsx`
- **Problem:** Gemischte Error-Handling-Patterns (toast, console.error, silent fails)
- **Lösung:**
  - Zentralisierte Error-Handler-Utility erstellen
  - Einheitliches Error-Logging (z.B. Sentry, LogRocket)
  - Error-Boundary-Komponenten für React
  - Beispiel:
    ```typescript
    // src/lib/error-handler.ts
    export function handleError(error: unknown, context: string) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${context}]`, errorMessage);
      // Optional: Sentry.captureException(error);
      toast.error(`Error in ${context}: ${errorMessage}`);
    }
    ```
- **Aufwand:** Mittel (3–8 h)

### 15. Code-Konsistenz: Sprache vereinheitlichen
- **Dateien:** Gesamtes Projekt
- **Problem:** Gemischte Sprachen (DE/EN) in Code, Kommentaren, UI-Strings
- **Lösung:**
  - Einheitlich auf Englisch umstellen (Code, Kommentare, Variablennamen)
  - Deutsche Kommentare übersetzen
  - UI-Strings in Übersetzungsdateien (bereits größtenteils erledigt)
- **Aufwand:** Hoch (> 8 h) – Projekt-weite Refaktorisierung

### 16. Zentralisierung von Magic Strings/Constants
- **Dateien:** Gesamtes Projekt
- **Problem:** Hardcoded Strings (`'A1'`, `'easy'`, `'admin'`) statt Constants
- **Lösung:**
  ```typescript
  // src/lib/constants.ts
  export const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
  export const DIFFICULTIES = ['easy', 'middle', 'hard'] as const;
  export const USER_ROLES = ['admin', 'student'] as const;

  export type Level = typeof LEVELS[number];
  export type Difficulty = typeof DIFFICULTIES[number];
  export type UserRole = typeof USER_ROLES[number];
  ```
- **Aufwand:** Mittel (3–8 h)

---

## 📝 Neue Änderungen – noch nicht umgesetzt

### 17. ✅ ~~Spanisch (es) als fünfte UI-Sprache hinzufügen~~ **ERLEDIGT**
- **Status:** ✅ Commit `831ca30` – Spanisch vollständig integriert
- **Umgesetzte Aufgaben:**
  - [x] Locale-Typ erweitert: `Locale = 'en' | 'ru' | 'el' | 'de' | 'es'`
  - [x] FALLBACK_ES erstellt (~130 Übersetzungen)
  - [x] Login-Seite: 5-Sprachen-Auswahl implementiert
  - [x] Hintergrund-Gradients für Spanisch (warm rot-orange)
  - [x] Canvas-Partikel: Hue für Spanisch definiert (base: 0, spread: 20)
  - [x] Line-Color für Spanisch: rgb(220, 60, 40)
- **Dateien:**
  - `src/context/language-context.tsx` (Zeile 6, 26, 37)
  - `src/app/login-pin/page.tsx` (Zeilen 60-61, 76, 414-415, 454)
- **Commit:** `2026-02-16` – feat(i18n): Complete Spanish integration

### 18. ✅ ~~Griechisch aus Mobile Login-Screen entfernen (nur UI)~~ **ERLEDIGT**
- **Status:** ✅ Implementiert – Griechisch nicht mehr in mobiler Sprachauswahl sichtbar
- **Wichtig:** Technische Unterstützung bleibt vollständig erhalten (el.json, Locale-Handling, DB)
- **Umgesetzte Aufgaben:**
  - [x] `src/app/login-pin/page.tsx`: Griechisch-Button entfernt
  - [x] Sprach-Array angepasst: `['en', 'ru', 'de', 'es']` (ohne 'el')
  - [x] Griechisch-Definitionen bleiben in Records (für Desktop/Admin)
- **Dateien:**
  - `src/app/login-pin/page.tsx` (Zeile 454)
- **Ergebnis:** Mobile Login zeigt nur noch EN, RU, DE, ES

### 19. ✅ ~~Hardcoded Credentials in Scripts entfernen~~ **ERLEDIGT**
- **Status:** ✅ Implementiert – Scripts verwenden jetzt Umgebungsvariablen
- **Dateien:**
  - `scripts/create-test-pin-users.js` → umgestellt auf `.env.local`
  - `scripts/README.md` → Dokumentation erstellt
- **Schwere:** HOCH (CVSS 7.0) → Behoben
- **Änderungen:**
  - Script lädt jetzt Umgebungsvariablen via `dotenv`
  - Validierung hinzugefügt: Exit wenn Variablen fehlen
  - README mit Security-Guidelines erstellt
- **Wichtig:**
  - ⚠️ Alter API-Key ist in Git-History vorhanden!
  - Empfehlung: API-Key in Supabase rotieren (falls noch nicht geschehen)
  - Client-side Scripts (`modules/*`, `public/*`) sind OK - ANON_KEY ist öffentlich
- **Commit:** `2026-02-16` – fix(security): Remove hardcoded credentials from Node.js scripts

---

## 📊 Zusammenfassung

**Gesamt:** 19 Punkte
**✅ Erledigt:** 9 (Punkte 1, 2, 4, 5, 7, 8, 17, 18, 19)
**🔴 Hoch-Priorität (Sicherheit):** 2 offen (Punkte 3, 6)
**🟡 Mittel-Priorität (Sicherheit):** 2 offen (Punkte 9, 10)
**🐌 Performance:** 3 offen (Punkte 11, 12, 13)
**🧹 Code-Qualität:** 3 offen (Punkte 14, 15, 16)

**Fortschritt:** 47% abgeschlossen (9 von 19)

---

## 🎯 Empfohlene Vorgehensweise

### Phase 1: Quick Wins ✅ ERLEDIGT
1. ✅ **Punkt 7** – Hardcoded Supabase-URL entfernen
2. ✅ **Punkt 19** – Hardcoded Credentials in Scripts entfernen

### Phase 2: Mittlere Sicherheits-Updates ✅ ERLEDIGT
3. ✅ **Punkt 8** – Input-Sanitization mit Zod

### Phase 3: Kritische Sicherheits-Refactorings (4-19h verbleibend) 👈 AKTUELL
4. ✅ **Punkt 4** – Server-seitige Autorisierung + RLS Policies
5. **Punkt 6** – IP-Whitelisting server-seitig (1-3h) - NÄCHSTER SCHRITT
6. **Punkt 3** – localStorage → httpOnly Cookies (3-8h)
7. **Punkt 9** – CSRF-Protection (3-8h)

### Phase 4: Optimierungen (später)
- Performance-Optimierungen (Punkte 11-13)
- Code-Qualität & Refactorings (Punkte 10, 14-16)

---

**Letzte Aktualisierung:** 2026-02-16 17:00 UTC+2

---

## 📌 CHECKPOINT – Session beendet

**Abgeschlossen in dieser Session:**
- ✅ Phase 1: Quick Wins (Punkt 7, 19)
- ✅ Phase 2: Input-Sanitization (Punkt 8)
- ✅ Phase 3: Server-seitige Autorisierung (Punkt 4)
  - Migration 066 erstellt & deployed
  - bulkDeleteContent gesichert
  - Honeypot-Checks server-seitig
  - Dokumentation in docs/AUTHORIZATION.md

**Nächste Session startet mit:**
- 🎯 Punkt 6: IP-Whitelisting server-seitig (1-3h)

**Wichtige Dateien für Fortsetzung:**
- `TODO-Audit-Und-Optimierungen-2026-02-16.md` (diese Datei)
- `docs/AUTHORIZATION.md` (neue Sicherheits-Dokumentation)
- `src/lib/validation/schemas.ts` (Zod-Validierung)
- `database/migrations/066_add_bulk_delete_rpc_with_auth.sql` (deployed)
