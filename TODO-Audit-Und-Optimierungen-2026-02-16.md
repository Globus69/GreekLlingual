───────────────────────────────────────────────────────────────
## WICHTIGER CHECKPOINT – Stand 16. Februar 2026 – vor Kontext-Reset

Diese Datei ist die Single Source of Truth für die Fortsetzung der Arbeiten.

Aktueller Kontext wird bald sehr knapp → neuer Tab / neue Session wird gestartet.

Bitte bei jedem Neustart / neuer Session als allererstes diese Datei lesen und
dann exakt ab dem nächsten offenen Punkt weiterarbeiten.

Letzte erfolgreich bearbeitete Punkte (Stand jetzt):
• TODO-Datei wird als zentrale To-do-Liste geführt
• Spanisch soll vollständig ins Projekt integriert werden
• Griechisch soll aus der Sprachauswahl im mobilen Login-Screen entfernt werden
  (technische Unterstützung für Griechisch bleibt erhalten)

Nächste geplante Schritte (bitte der Reihe nach abarbeiten):
1. Spanisch vollständig hinzufügen (Übersetzungsdateien, Language Selector erweitern, alle sichtbaren Texte übersetzen)
2. Im mobilen Login-Screen die sichtbare Auswahl von Griechisch entfernen
   (Dropdown / Buttons / Flags – nur UI, nicht die i18n-Logik)
3. Danach: Code prüfen (TypeScript-Typen, ESLint, Responsive-Verhalten)
4. Offene Audit- & Optimierungspunkte aus früheren Gesprächen weiter abarbeiten

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

### 4. Server-seitige Autorisierung für kritische Operationen
- **Dateien:**
  - `src/lib/supabase/content.ts:138-147` (bulkDeleteContent)
  - Alle RPC-Aufrufe ohne Auth-Check
  - `src/app/login-pin/page.tsx:148-184` (Client-seitige Honeypot-Checks)
- **Problem:**
  - `bulkDeleteContent` hat keinen Auth-Check → Jeder kann Bulk-Operationen durchführen
  - Client-seitige Honeypot-Checks können umgangen werden (Zeile 148-184)
- **Schwere:** HOCH (CVSS 8.1) – Unbefugte können Bulk-Operationen durchführen
- **Lösung:**
  - RLS-Policies in Supabase für alle kritischen Tabellen
  - Server-seitige Validierung in API-Routes
  - Honeypot-Checks in API-Route verlagern
- **Aufwand:** Mittel (3–8 h)

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

### 7. Hardcoded Supabase-URL entfernen
- **Dateien:** `src/app/api/honeypot-alert/route.ts:44`
- **Problem:** Supabase-URL ist hardcoded statt aus Umgebungsvariable
- **Schwere:** MITTEL (CVSS 5.0) – Betriebsrisiko, keine direkte Sicherheitslücke
- **Lösung:**
  ```typescript
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const telegramResponse = await fetch(`${supabaseUrl}/functions/v1/send-telegram`, { ... });
  ```
- **Aufwand:** Sehr gering (< 1 h)

---

## 🟡 Offene Sicherheits-Themen – PRIORITÄT MITTEL

### 8. Input-Sanitization & SQL-Injection-Prävention
- **Dateien:** `src/lib/supabase/content.ts:18-19`, alle Supabase-Queries
- **Problem:** `.ilike.%${params.search}%` könnte SQL-Injection ermöglichen (Supabase sanitized meist, aber unsicher)
- **Lösung:**
  - Zod-Schema für Input-Validierung
  - Parametrisierte Queries (Supabase macht das meist automatisch, aber explizit sicherstellen)
  - Beispiel:
    ```typescript
    const searchSchema = z.string().max(100).regex(/^[a-zA-Z0-9\s]*$/);
    const validatedSearch = searchSchema.parse(params.search);
    ```
- **Aufwand:** Gering (1–3 h)

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

### 17. Spanisch (es) als fünfte UI-Sprache hinzufügen
- **Status:** 🔄 In Arbeit (2026-02-16)
- **Aufgaben:**
  - [ ] Locale-Typ erweitern: `Locale = 'en' | 'ru' | 'el' | 'de' | 'es'`
  - [ ] FALLBACK_ES erstellen (~130 Übersetzungen)
  - [ ] SQL-Migration für spanische DB-Übersetzungen
  - [ ] Login-Seite: 5-Sprachen-Auswahl
  - [ ] Dashboard-Header: 5-Wege-Rotation
  - [ ] Admin-Seite: 5-Wege-Rotation
  - [ ] LanguageToast: Spanische Nachricht + Farben
  - [ ] Hintergrund-Gradients für Spanisch (warm rot-orange)
  - [ ] Canvas-Partikel: Hue für Spanisch definieren
- **Dateien:**
  - `src/context/LanguageContext.tsx`
  - `src/context/AuthContext.tsx`
  - `src/lib/useTranslation.ts`
  - `src/components/ui/LanguageToast.tsx`
  - `src/app/login-pin/page.tsx`
  - `src/components/dashboard/DashboardHeader.tsx`
  - `src/app/admin/page.tsx`
  - `supabase/insert_spanish_translations.sql` (neu)
- **Aufwand:** Mittel (3–5 h)

### 18. Griechisch aus Mobile Login-Screen entfernen (nur UI)
- **Status:** 🔄 In Arbeit (2026-02-16)
- **Wichtig:** Technische Unterstützung bleibt erhalten (el.json, Locale-Handling, DB)
- **Aufgaben:**
  - [ ] `src/app/login-pin/page.tsx`: Griechisch-Button entfernen
  - [ ] Sprach-Array anpassen: `['en', 'ru', 'de', 'es']` (ohne 'el')
  - [ ] Desktop/Admin: Griechisch bleibt auswählbar
- **Dateien:**
  - `src/app/login-pin/page.tsx` (nur Mobile Login)
- **Aufwand:** Sehr gering (< 30 min)

---

## 📊 Zusammenfassung

**Gesamt:** 18 Punkte
**Erledigt:** 3 ✅
**Hoch-Priorität (Sicherheit):** 4 offen
**Mittel-Priorität:** 3 offen
**Performance:** 3 offen
**Code-Qualität:** 3 offen
**Neue Features:** 2 abgeschlossen

**Nächste Schritte:**
1. ✅ Punkt 17 & 18 umsetzen (Spanisch + Griechisch-UI-Entfernung) – ERLEDIGT
2. ✅ Punkt 5 umsetzen (Rate-Limiter fail-closed) – ERLEDIGT
3. Punkt 7 umsetzen (Hardcoded Supabase-URL entfernen) – < 1 h
4. Punkt 3 umsetzen (localStorage → Cookies) – 3-8 h
5. Punkt 4 umsetzen (Server-seitige Auth) – 3-8 h
6. Punkt 6 umsetzen (IP-Whitelisting server-seitig) – 1-3 h

---

**Letzte Aktualisierung:** 2026-02-16 15:45 UTC+2
