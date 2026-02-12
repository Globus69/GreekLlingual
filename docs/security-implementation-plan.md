# Sicherheits-Implementierung: Aufwands-Analyse & Plan

## 📊 Aufwandsschätzung

| Todo | Beschreibung | Aufwand | Komplexität | Dateien |
|------|--------------|---------|-------------|---------|
| **1** | Desktop/Mobile Radio-Button | 🟢 15 Min. | Einfach | `login-pin/page.tsx`, SQL |
| **2** | Rate Limiting (Redis/Upstash) | 🟡 45 Min. | Mittel | `middleware.ts`, `package.json` |
| **3** | Account Lockout | 🟡 30 Min. | Mittel | SQL, `verify_user_4digit_pin()` |
| **4** | Progressive Delays | 🟢 20 Min. | Einfach | `login-pin/page.tsx`, `login/page.tsx` |
| **5** | Device Fingerprinting | 🟡 40 Min. | Mittel | `package.json`, `login-pin/page.tsx` |
| **6** | Honeypot-PINs | 🟢 25 Min. | Einfach | SQL, `verify_user_4digit_pin()` |
| **7** | Admin MFA/TOTP | 🔴 90 Min. | Hoch | SQL, `login/page.tsx`, neue Komponente |
| **8** | IP-Whitelisting (Admin) | 🟢 20 Min. | Einfach | `.env`, `login/page.tsx` |
| **9** | Admin Rate Limiting (streng) | 🟢 15 Min. | Einfach | `middleware.ts` |
| **10** | Session-Timeout (15 Min.) | 🟢 10 Min. | Einfach | `AuthContext.tsx` |
| **11** | Audit-Log | 🟡 35 Min. | Mittel | SQL, RPC-Funktionen |
| **12** | Testing & Bugfixes | 🟡 30 Min. | Mittel | Alle |
| **13** | Dokumentation Update | 🟢 15 Min. | Einfach | `.md` Dateien |

**Gesamt:** ~6-7 Stunden (verteilt auf mehrere Sessions)

---

## 🎯 Todo-Liste (13 Schritte)

### ✅ **Bereits erledigt:**
- [x] HTTPS erzwungen
- [x] PIN-Hashing (bcrypt)
- [x] RPC-Funktion `verify_user_4digit_pin()`
- [x] Admin CAPTCHA
- [x] Session-Timeout (24h)
- [x] Sicherheitsdokumentation erstellt

---

### 🔴 **Todo 1: Desktop/Mobile Radio-Button** (15 Min.)
**Ziel:** Nutzer wählt beim Login Device-Typ

**Dateien:**
- `src/app/login-pin/page.tsx`
- `supabase/add_device_type_tracking.sql`

**Was passiert:**
1. Radio-Button über PIN-Eingabe: ○ Desktop  ○ Mobile
2. State: `const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('mobile')`
3. Bei Login: Device-Typ in `users` Tabelle speichern
4. SQL: `last_login_device TEXT` Spalte hinzufügen

**Komplexität:** 🟢 Einfach

---

### 🔴 **Todo 2: Rate Limiting** (45 Min.)
**Ziel:** Max. 10 Versuche/Min. pro IP

**Dateien:**
- `package.json` (+ `@upstash/ratelimit`)
- `src/middleware.ts` (neu)
- `.env.local` (Upstash Redis Credentials)

**Was passiert:**
1. Upstash Redis Account anlegen (kostenlos)
2. Middleware erstellt: `/api/login` → Rate Limit Check
3. Bei Überschreitung: `{ error: 'Too many attempts. Try again in 1 minute.' }`

**Komplexität:** 🟡 Mittel (externe Service-Integration)

---

### 🔴 **Todo 3: Account Lockout** (30 Min.)
**Ziel:** 5 Fehlversuche → 15 Min. Sperre

**Dateien:**
- `supabase/add_lockout_fields.sql`
- `supabase/update_verify_user_4digit_pin.sql`

**Was passiert:**
1. SQL: `failed_attempts INT DEFAULT 0`, `locked_until TIMESTAMP`
2. RPC-Funktion prüft VOR Hash-Vergleich: `IF locked_until > NOW() THEN RETURN error`
3. Bei Fehler: `failed_attempts++`, bei 5: `locked_until = NOW() + 15 minutes`
4. Bei Erfolg: `failed_attempts = 0`

**Komplexität:** 🟡 Mittel (SQL-Logik)

---

### 🔴 **Todo 4: Progressive Delays** (20 Min.)
**Ziel:** Verzögerung nach jedem Fehler

**Dateien:**
- `src/app/login-pin/page.tsx`
- `src/app/login/page.tsx`

**Was passiert:**
1. State: `const [attemptCount, setAttemptCount] = useState(0)`
2. Bei Fehler: `attemptCount++`
3. Vor Submit: `await sleep(delays[attemptCount])`
4. Delays: `[0, 1000, 2000, 5000, 10000]` ms

**Komplexität:** 🟢 Einfach (Frontend-only)

---

### 🔴 **Todo 5: Device Fingerprinting** (40 Min.)
**Ziel:** Browser-Fingerprint als unsichtbarer Faktor

**Dateien:**
- `package.json` (+ `@fingerprintjs/fingerprintjs`)
- `src/lib/useDeviceFingerprint.ts` (neu)
- `src/app/login-pin/page.tsx`
- `supabase/add_device_fingerprint.sql`

**Was passiert:**
1. FingerprintJS installieren
2. Bei Login: Fingerprint generieren
3. Vergleich mit gespeichertem: `IF stored !== current THEN email_verification_required`
4. SQL: `device_fingerprint TEXT` Spalte

**Komplexität:** 🟡 Mittel (Library-Integration + Email-Flow)

---

### 🔴 **Todo 6: Honeypot-PINs** (25 Min.)
**Ziel:** Verbotene PINs lösen Alarm aus

**Dateien:**
- `supabase/create_honeypot_pins.sql`
- `supabase/update_verify_user_4digit_pin.sql`

**Was passiert:**
1. SQL: `honeypot_pins` Tabelle mit 0000, 1111, 1234, 9999
2. RPC prüft VOR Validierung: `IF pin IN honeypot_pins THEN ban_ip()`
3. Ban-Logik: `banned_ips` Tabelle + Check in Middleware

**Komplexität:** 🟢 Einfach (SQL-only)

---

### 🔴 **Todo 7: Admin MFA/TOTP** (90 Min.)
**Ziel:** 2FA nach erfolgreichem Admin-Login

**Dateien:**
- `package.json` (+ `otpauth` oder `speakeasy`)
- `src/components/admin/MFASetup.tsx` (neu)
- `src/components/admin/MFAVerify.tsx` (neu)
- `src/app/login/page.tsx`
- `supabase/add_admin_mfa.sql`

**Was passiert:**
1. Admin-Setup: QR-Code generieren → User scannt mit Authenticator-App
2. Secret wird verschlüsselt in DB gespeichert
3. Bei Login: Nach PIN+CAPTCHA → "Gib 6-stelligen Code ein"
4. TOTP-Validierung (30-Sekunden-Fenster)
5. 10 Recovery-Codes generieren (für Notfall)

**Komplexität:** 🔴 Hoch (neue UI + Crypto)

---

### 🔴 **Todo 8: IP-Whitelisting (Admin)** (20 Min.)
**Ziel:** Admin-Login nur von bestimmten IPs

**Dateien:**
- `.env.local`
- `src/app/login/page.tsx`

**Was passiert:**
1. `.env.local`: `ADMIN_ALLOWED_IPS="192.168.1.100,88.77.66.55"`
2. Bei Admin-Login: `if (!allowedIPs.includes(req.ip)) return error`
3. Fallback: Temporäre IP via Admin-Panel hinzufügen

**Komplexität:** 🟢 Einfach (Config-only)

---

### 🔴 **Todo 9: Admin Rate Limiting (streng)** (15 Min.)
**Ziel:** 3 Versuche/5 Min. für Admin

**Dateien:**
- `src/middleware.ts`

**Was passiert:**
1. Middleware erkennt Admin-Login via Route `/login`
2. Separater Zähler für Admin: `admin:ip:attempts`
3. Limit: 3 statt 10, Timeout: 5 Min. statt 1 Min.

**Komplexität:** 🟢 Einfach (erweitert Todo 2)

---

### 🔴 **Todo 10: Session-Timeout (15 Min.)** (10 Min.)
**Ziel:** Admin-Session nach 15 Min. ablaufen lassen

**Dateien:**
- `src/context/AuthContext.tsx`

**Was passiert:**
1. Check bei Login: `if (user.role === 'admin') sessionTimeout = 15 * 60 * 1000`
2. Bestehende Logik erweitern (bereits 24h-Timeout vorhanden)

**Komplexität:** 🟢 Einfach (kleine Anpassung)

---

### 🔴 **Todo 11: Audit-Log** (35 Min.)
**Ziel:** Alle Admin-Login-Versuche loggen

**Dateien:**
- `supabase/create_audit_log.sql`
- `src/app/login/page.tsx`
- `src/app/admin/page.tsx` (Dashboard-Widget)

**Was passiert:**
1. SQL: `admin_login_log` Tabelle (timestamp, ip, success, error)
2. Bei jedem Admin-Login: RPC `log_admin_login(ip, success, error)`
3. Admin-Dashboard: Widget mit letzten 50 Versuchen

**Komplexität:** 🟡 Mittel (SQL + UI)

---

### 🔴 **Todo 12: Testing & Bugfixes** (30 Min.)
**Ziel:** Alle Features durchspielen

**Was passiert:**
1. PIN-Login testen: Erfolg + Fehler
2. Rate Limiting testen: 11. Versuch geblockt
3. Lockout testen: Nach 5 Fehlern gesperrt
4. Admin MFA testen: QR-Code + Verify
5. Device Fingerprint: Neues Gerät → Email

**Komplexität:** 🟡 Mittel (Integration)

---

### 🔴 **Todo 13: Dokumentation Update** (15 Min.)
**Ziel:** Alle Changes in `.md` Dateien

**Dateien:**
- `docs/login-pin-security.md`
- `CLAUDE.md`

**Was passiert:**
1. Implementation Checklist aktualisieren (alle ✅)
2. Neue Features dokumentieren
3. Testing-Ergebnisse einfügen

**Komplexität:** 🟢 Einfach

---

## 📅 Zeitplan (1-Stunden-Intervalle)

```
Session 1 (jetzt):     Todo 1 - Desktop/Mobile Radio-Button
--- 1 Stunde Pause ---
Session 2:             Todo 2 - Rate Limiting
--- 1 Stunde Pause ---
Session 3:             Todo 3 - Account Lockout
--- 1 Stunde Pause ---
Session 4:             Todo 4 + 6 - Progressive Delays + Honeypot
--- 1 Stunde Pause ---
Session 5:             Todo 5 - Device Fingerprinting
--- 1 Stunde Pause ---
Session 6:             Todo 8 + 9 + 10 - Admin Whitelisting/Limits/Timeout
--- 1 Stunde Pause ---
Session 7:             Todo 7 - Admin MFA (lang!)
--- 1 Stunde Pause ---
Session 8:             Todo 11 - Audit-Log
--- 1 Stunde Pause ---
Session 9:             Todo 12 + 13 - Testing + Doku
```

**Gesamt:** 9 Sessions über mehrere Tage

---

## 🎯 Prioritäten

**CRITICAL (sofort):**
1. Rate Limiting
2. Account Lockout
3. Progressive Delays

**HIGH (wichtig):**
4. Honeypot-PINs
5. Admin MFA
6. Audit-Log

**MEDIUM (nützlich):**
7. Device Fingerprinting
8. IP-Whitelisting
9. Session-Timeout

**LOW (nice-to-have):**
10. Desktop/Mobile Radio-Button

---

## ❗ Abhängigkeiten

- **Todo 2 (Rate Limiting)** muss VOR Todo 3 (Lockout) – teilt Infrastruktur
- **Todo 5 (Fingerprinting)** braucht Email-System (schon vorhanden?)
- **Todo 7 (MFA)** ist unabhängig, aber zeitaufwändig
- **Todo 12 (Testing)** erst am Ende

---

**Frage:** Soll ich mit **Todo 1 (Desktop/Mobile Radio-Button)** beginnen?
