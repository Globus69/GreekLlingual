# 🔐 TODO: Login-System - Komplette Übersicht

**Letzte Aktualisierung:** 2026-02-12
**Status:** In Entwicklung
**Zweck:** Zentrale Dokumentation aller Login-bezogenen Aufgaben, SQL-Migrationen und Sicherheitsmaßnahmen

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Aktuelle Architektur](#aktuelle-architektur)
3. [Phase 7: PIN-Management (7 Aufgaben)](#phase-7-pin-management)
4. [Sicherheits-Todos (13 Aufgaben)](#sicherheits-todos)
5. [SQL-Migrationen Checkliste](#sql-migrationen-checkliste)
6. [Test-Anleitung](#test-anleitung)
7. [Chronologie (CLAUDE.md Auszug)](#chronologie)

---

## Übersicht

### Zwei Login-Systeme

**1. Schüler-Login (`/login-pin`):**
- ✅ 4-stelliger PIN (0000-9999)
- ✅ On-Screen numerische Tastatur
- ✅ Modernes Glasmorphismus-Popup (Welcome/Error)
- ✅ Sprachauswahl: EN / RU / EL / DE
- ✅ Device-Type Radio-Button (Desktop/Mobile)
- ✅ Honeypot-PINs mit automatischem IP-Ban
- ⚠️ 5 Test-User: 3741, 8192, 5624, 7358, 9103

**2. Admin-Login (`/login`):**
- ✅ Username + 6-stelliger PIN
- ✅ CAPTCHA (Math-Aufgabe)
- ✅ IP-Whitelisting (`.env.local`)
- ✅ bcrypt PIN-Hashing
- ✅ Session-Timeout (24h)
- ⚠️ MFA/TOTP (Todo 7)

### Sicherheitsmaßnahmen (Implementiert)

| Maßnahme | Status | Priorität |
|----------|--------|-----------|
| HTTPS erzwungen | ✅ Aktiv | 🔴 Kritisch |
| PIN-Hashing (bcrypt) | ✅ Aktiv | 🔴 Kritisch |
| Honeypot-PINs (15 Trap-PINs) | ✅ Aktiv | 🟡 Hoch |
| IP-Ban-System (24h) | ✅ Aktiv | 🟡 Hoch |
| Admin CAPTCHA | ✅ Aktiv | 🟡 Hoch |
| IP-Whitelisting (Admin) | ✅ Aktiv | 🟡 Hoch |
| Session-Timeout (24h) | ✅ Aktiv | 🟢 Mittel |
| Welcome-Popup (2s) | ✅ Aktiv | 🔵 UX |

### Sicherheitsmaßnahmen (Offen)

| Maßnahme | Status | Priorität | Aufwand |
|----------|--------|-----------|---------|
| Rate Limiting | ⬜ Todo 2 | 🔴 Kritisch | 45 Min. |
| Account Lockout | ⬜ Todo 3 | 🔴 Kritisch | 30 Min. |
| Progressive Delays | ⬜ Todo 4 | 🟡 Hoch | 20 Min. |
| Admin MFA/TOTP | ⬜ Todo 7 | 🟡 Hoch | 90 Min. |
| Audit-Log | ⬜ Todo 11 | 🟢 Mittel | 35 Min. |
| Device Fingerprinting | ⬜ Todo 5 | 🔵 Optional | 40 Min. |

---

## Aktuelle Architektur

### Datenbank-Schema (`users` Tabelle)

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    name TEXT NOT NULL,                    -- Login-Name
    pin TEXT,                               -- Legacy (nicht mehr verwendet)
    pin_hash TEXT,                          -- bcrypt-Hash (6-stellig)
    pin_4digit TEXT,                        -- Klartext 4-stelliger PIN
    whatsapp TEXT,                          -- WhatsApp-Nummer
    role TEXT NOT NULL DEFAULT 'student',   -- 'admin' | 'student'
    level TEXT DEFAULT 'A1',                -- A1, A2, B1, B2
    difficulty TEXT DEFAULT 'easy',         -- easy, middle, hard
    performance_index TEXT DEFAULT 'A1-easy',
    preferred_locale TEXT DEFAULT 'en',     -- en, ru, el, de
    locked BOOLEAN DEFAULT false,           -- Account-Sperre (Todo 51)
    failed_attempts INT DEFAULT 0,          -- Fehlversuche (Todo 3)
    locked_until TIMESTAMP,                 -- Lockout-Zeitpunkt (Todo 3)
    last_login_device TEXT,                 -- desktop/mobile (Todo 1)
    device_fingerprint TEXT,                -- Browser-Fingerprint (Todo 5)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### RPC-Funktionen

**1. `verify_user_4digit_pin(pin, ip, user_agent)`**
- Validiert 4-stelligen PIN gegen Datenbank
- Prüft IP-Ban-Status (returns `error: 'IP banned'`)
- Prüft Honeypot-PINs → Bannung + Log
- Returns: user_id, name, email, role, level, difficulty, performance_index, preferred_locale, error

**2. `verify_user_pin(name, pin)`** (6-stellig, Admin)
- Validiert Name + bcrypt-gehashten PIN
- Returns: user_id, name, email, role, level, difficulty, performance_index, preferred_locale

**3. `create_student(...)` / `update_student(...)` / `delete_student(...)`**
- CRUD-Operationen für Schüler-Management
- SECURITY DEFINER (umgeht RLS)

**4. `ban_ip(ip, reason, duration)` / `is_ip_banned(ip)`**
- IP-Management für Honeypot-System

**5. `evaluate_student_performance(student_id, min_attempts)`**
- Automatische Leistungsstufen-Anpassung nach Lernsessions

### Honeypot-System

**Tabellen:**
- `honeypot_pins` – 15 verbotene PINs (0000, 1111-9999, 1234, 4321, 1122, 2211, 5678)
- `banned_ips` – Gebannte IPs mit Ablaufzeitpunkt (24h)
- `honeypot_log` – Protokoll aller Honeypot-Versuche

**Ablauf:**
1. User gibt PIN ein (z.B. 9999)
2. `verify_user_4digit_pin()` prüft gegen `honeypot_pins`
3. Match → `ban_ip()` für 24h + Log-Eintrag
4. Returns `error: 'Invalid PIN'` (sieht aus wie "PIN nicht gefunden")
5. ⚠️ **Todo 52:** WhatsApp/Telegram-Benachrichtigung an Admin

---

## Phase 7: PIN-Management

### 47. ⬜ Auto-PIN-Generierung bei User-Erstellung

**Ziel:** Beim Anlegen eines neuen Schülers automatisch eine zufällige 4-stellige PIN generieren

**Implementierung:**
```typescript
// Client-seitig: StudentManagementDialog.tsx
function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Auto-Fill beim Klick auf "Neuer Schüler"
const [pin, setPin] = useState(generateRandomPin());
```

**Validierung:**
- Siehe Aufgaben 48 + 49 (Duplikat + Honeypot-Check)

**Dateien:**
- `src/components/admin/StudentManagementDialog.tsx`

**Status:** ⬜ Offen
**Abhängigkeiten:** 48, 49

---

### 48. ⬜ Duplikat-Prüfung bei PIN-Vergabe

**Ziel:** Keine zwei User dürfen die gleiche PIN haben

**Implementierung:**

**Client-seitig (Pre-Check):**
```typescript
async function checkPinUnique(pin: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('pin_4digit', pin)
    .limit(1);

  return data?.length === 0;
}

async function generateSafePin(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const pin = generateRandomPin();
    if (await checkPinUnique(pin) && !HONEYPOT_PINS.includes(pin)) {
      return pin;
    }
    attempts++;
  }
  throw new Error('Could not generate unique PIN after 10 attempts');
}
```

**Server-seitig (DB-Constraint):**
```sql
-- In fix_student_management_v2.sql oder neue Migration
ALTER TABLE public.users
ADD CONSTRAINT unique_pin_4digit UNIQUE (pin_4digit);
```

**RPC-Funktion erweitern:**
```sql
CREATE OR REPLACE FUNCTION create_student(
    p_name TEXT,
    p_pin TEXT,
    ...
) RETURNS JSON AS $$
BEGIN
    -- Prüfe Duplikat
    IF EXISTS (SELECT 1 FROM public.users WHERE pin_4digit = p_pin) THEN
        RETURN json_build_object('success', false, 'error', 'PIN already exists');
    END IF;

    -- Insert...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Fehlermeldung:**
- Toast: "PIN bereits vergeben – neue PIN generiert"

**Dateien:**
- `src/components/admin/StudentManagementDialog.tsx`
- `supabase/add_unique_pin_constraint.sql` (neu)

**Status:** ⬜ Offen
**Abhängigkeiten:** 47

---

### 49. ⬜ Honeypot-PIN-Prüfung bei PIN-Vergabe

**Ziel:** Verhindern, dass Schüler PINs bekommen, die Honeypots sind

**Verbotene PINs (15):**
```typescript
const HONEYPOT_PINS = [
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '1122', '2211', '5678'
];
```

**Implementierung:**

**Client-seitig:**
```typescript
function isHoneypotPin(pin: string): boolean {
  return HONEYPOT_PINS.includes(pin);
}

// In generateSafePin() bereits integriert (siehe Aufgabe 48)
```

**Server-seitig:**
```sql
CREATE OR REPLACE FUNCTION create_student(...) RETURNS JSON AS $$
BEGIN
    -- Prüfe Honeypot
    IF EXISTS (SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin) THEN
        RETURN json_build_object('success', false, 'error', 'PIN is forbidden (security rule)');
    END IF;

    -- Prüfe Duplikat (siehe Aufgabe 48)
    -- Insert...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Fehlermeldung:**
- Toast: "PIN ungültig (Sicherheitsregel) – neue PIN generiert"

**Dateien:**
- `src/components/admin/StudentManagementDialog.tsx`
- `supabase/create_honeypot_pins_fixed.sql` (RPC-Update)

**Status:** ⬜ Offen
**Abhängigkeiten:** 47, 48

---

### 50. ⬜ Admin: PIN neu generieren für bestehende User

**Ziel:** Admin kann für bestehende Schüler neue PINs vergeben

**Implementierung:**

**UI (StudentManagementDialog):**
```typescript
// Im Edit-Modus, neben PIN-Feld
<button onClick={() => setPin(generateSafePin())}>
  🎲 Neue PIN
</button>

// Toast nach Generierung
showToast(`Neue PIN generiert: ${newPin}`);
```

**Validierung:**
- Gleiche Checks wie Aufgaben 48 + 49 (Duplikat + Honeypot)

**Speichern:**
- Admin kann vor Speichern prüfen/anpassen
- Beim Klick auf "Speichern": `update_student()` RPC mit neuer PIN

**Dateien:**
- `src/components/admin/StudentManagementDialog.tsx`

**Status:** ⬜ Offen
**Abhängigkeiten:** 48, 49

---

### 51. ⬜ Admin: User entsperren (IP-Ban + Account-Lock)

**Ziel:** Admin kann gebannte oder gesperrte User entsperren

**Option 1: IP-Entsperrung**

**SQL:**
```sql
-- RPC-Funktion
CREATE OR REPLACE FUNCTION unban_user_ips(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
    -- Finde alle IPs die mit diesem User verbunden sind
    DELETE FROM public.banned_ips
    WHERE ip_address IN (
        SELECT DISTINCT ip_address
        FROM public.honeypot_log
        WHERE user_id = p_user_id
    );

    RETURN json_build_object('success', true, 'message', 'All IPs unbanned');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**UI:**
```typescript
// Button in StudentManagementDialog (Edit-Modus)
{userIsBanned && (
  <button onClick={() => unbanUserIPs(userId)}>
    🔓 IP entsperren
  </button>
)}

// Zeigt gebannte IPs an (aus honeypot_log)
const bannedIPs = await supabase
  .from('honeypot_log')
  .select('ip_address')
  .eq('user_id', userId);
```

**Option 2: Account-Lock**

**SQL:**
```sql
-- Spalte bereits vorhanden in users Tabelle:
-- locked BOOLEAN DEFAULT false

-- Bei Honeypot-Versuch in verify_user_4digit_pin():
UPDATE public.users
SET locked = true, locked_until = NOW() + INTERVAL '24 hours'
WHERE id = (SELECT id FROM public.users WHERE pin_4digit = p_pin LIMIT 1);

-- Entsperren:
CREATE OR REPLACE FUNCTION unlock_user_account(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
    UPDATE public.users
    SET locked = false, locked_until = NULL, failed_attempts = 0
    WHERE id = p_user_id;

    RETURN json_build_object('success', true, 'message', 'Account unlocked');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**UI:**
```typescript
// Status-Badge in User-Liste
{user.locked && (
  <span className="badge badge-red">🔒 Gesperrt</span>
)}

// Button zum Entsperren
<button onClick={() => unlockUserAccount(userId)}>
  🔓 Account entsperren
</button>
```

**Dateien:**
- `src/components/admin/StudentManagementDialog.tsx`
- `supabase/add_user_unlock_rpc.sql` (neu)

**Status:** ⬜ Offen
**Abhängigkeiten:** Keine

---

### 52. ⬜ WhatsApp/Telegram-Benachrichtigung bei User-Sperrung

**Ziel:** Admin wird bei Sicherheitsvorfällen benachrichtigt

**Empfänger:** +35796120069 (Admin-Telefonnummer)

**Nachricht-Inhalt:**
```
🚨 Sicherheitsalarm – GreekLingua Dashboard

User: [Name]
PIN-Versuch: [PIN]
IP-Adresse: [IP]
Zeitpunkt: [Datum + Uhrzeit UTC]
Aktion: 24h IP-Ban + Account gesperrt

Zum Entsperren: https://app.example.com/admin
```

**Option A: Telegram Bot API (empfohlen)**

**Vorteile:**
- Kostenlos
- Keine Business-API nötig
- Einfache HTTP-API
- Instant Delivery

**Setup:**
1. Bot erstellen via [@BotFather](https://t.me/botfather)
2. Token erhalten: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
3. Chat-ID des Admins ermitteln (via `/start` + `getUpdates`)

**Implementierung (Edge Function):**
```typescript
// supabase/functions/send-telegram-alert/index.ts
export default async function handler(req: Request) {
  const { userId, pin, ipAddress } = await req.json();

  const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const CHAT_ID = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID');

  const message = `🚨 Sicherheitsalarm
User: ${userId}
PIN: ${pin}
IP: ${ipAddress}
Zeit: ${new Date().toISOString()}`;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: message })
  });

  return new Response('OK', { status: 200 });
}
```

**Trigger (in verify_user_4digit_pin RPC):**
```sql
-- Nach ban_ip() Aufruf:
PERFORM http_post(
    'https://your-project.supabase.co/functions/v1/send-telegram-alert',
    json_build_object('userId', user_id, 'pin', p_pin, 'ipAddress', p_ip_address)
);
```

**Option B: WhatsApp Business API**

**Anbieter:**
- Twilio (kostenpflichtig)
- Meta WhatsApp Cloud API (komplex)

**Nicht empfohlen wegen:**
- Höhere Kosten
- Komplexere Setup
- Business-Verifizierung nötig

**Reminder:**
- In 5 Stunden an Todo erinnern (Entscheidung Telegram vs. WhatsApp)

**Dateien:**
- `supabase/functions/send-telegram-alert/index.ts` (neu)
- `.env` (TELEGRAM_BOT_TOKEN, ADMIN_TELEGRAM_CHAT_ID)
- `supabase/create_honeypot_pins_fixed.sql` (RPC-Update mit http_post)

**Status:** ⬜ Offen (Technologie-Entscheidung ausstehend)
**Abhängigkeiten:** 53

---

### 53. ⬜ Admin-Telefonnummer in Datenbank speichern

**Ziel:** Admin-User erhält Telefonnummer-Feld für Benachrichtigungen

**SQL-Migration:**
```sql
-- Option 1: Neues Feld für alle User
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Option 2: Bestehendes whatsapp-Feld nutzen
-- Bereits vorhanden: whatsapp TEXT

-- Admin-User Update
UPDATE public.users
SET contact_phone = '+35796120069'  -- oder whatsapp = '+35796120069'
WHERE role = 'admin';

-- Format-Check-Constraint (optional)
ALTER TABLE public.users
ADD CONSTRAINT check_phone_format
CHECK (contact_phone IS NULL OR contact_phone ~ '^\+[0-9]{10,15}$');
```

**RPC-Funktion:**
```sql
CREATE OR REPLACE FUNCTION get_admin_contact()
RETURNS JSON AS $$
DECLARE
    admin_data RECORD;
BEGIN
    SELECT contact_phone, email, name INTO admin_data
    FROM public.users
    WHERE role = 'admin'
    LIMIT 1;

    RETURN json_build_object(
        'phone', admin_data.contact_phone,
        'email', admin_data.email,
        'name', admin_data.name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**UI (StudentManagementDialog):**
```typescript
// Telefonnummer-Feld anzeigen (für alle User)
<input
  type="tel"
  placeholder="+[Country][Number]"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  pattern="^\+[0-9]{10,15}$"
/>

// In User-Liste als Spalte
<td>{user.contact_phone || user.whatsapp || '—'}</td>
```

**Dateien:**
- `supabase/add_admin_contact_phone.sql` (neu)
- `src/components/admin/StudentManagementDialog.tsx`

**Status:** ⬜ Offen
**Abhängigkeiten:** Keine

---

### 54. ✅ ToDo.md aktualisiert mit Phase 7

**Status:** ✅ Erledigt (2026-02-12)

Alle 7 Aufgaben (47-53) wurden in `ToDo.md` dokumentiert.

---

## Sicherheits-Todos

### Aus `docs/security-implementation-plan.md`

### ✅ Todo 1: Desktop/Mobile Radio-Button (15 Min.)

**Status:** ✅ Erledigt (2026-02-12)

**Was wurde gemacht:**
- Radio-Button in `/login-pin` implementiert
- State: `deviceType: 'desktop' | 'mobile'`
- SQL: `last_login_device TEXT` Spalte (in `add_device_type_tracking.sql`)
- RPC: `update_user_device(user_id, device_type)` speichert Auswahl

**Dateien:**
- `src/app/login-pin/page.tsx`
- `supabase/add_device_type_tracking.sql`

---

### ⬜ Todo 2: Rate Limiting (45 Min.)

**Ziel:** Max. 10 Versuche/Min. pro IP

**Implementierung:**

**Option A: Upstash Redis (empfohlen)**
```typescript
// src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export const rateLimitLogin = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 req/min
  analytics: true
});

// Middleware: src/middleware.ts
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/login' || req.nextUrl.pathname === '/login-pin') {
    const ip = req.ip || 'unknown';
    const { success, limit, remaining, reset } = await rateLimitLogin.limit(ip);

    if (!success) {
      return new Response(JSON.stringify({
        error: 'Too many attempts. Try again in 1 minute.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return NextResponse.next();
}
```

**Option B: Vercel Edge Config (Alternative)**
- Nutzt Vercel KV Store
- Ähnliche API wie Upstash

**Setup:**
1. Upstash Account anlegen: https://upstash.com (kostenlos)
2. Redis-Datenbank erstellen
3. `.env.local`:
   ```
   UPSTASH_REDIS_URL=https://...
   UPSTASH_REDIS_TOKEN=...
   ```
4. Install: `npm install @upstash/ratelimit @upstash/redis`

**Dateien:**
- `src/middleware.ts` (neu)
- `src/lib/rateLimit.ts` (neu)
- `.env.local`
- `package.json` (+2 Dependencies)

**Komplexität:** 🟡 Mittel (externe Service-Integration)
**Status:** ⬜ Offen
**Priorität:** 🔴 KRITISCH

---

### ⬜ Todo 3: Account Lockout (30 Min.)

**Ziel:** 5 Fehlversuche → 15 Min. Sperre

**SQL-Migration:**
```sql
-- Spalten bereits vorhanden in users Tabelle:
-- failed_attempts INT DEFAULT 0
-- locked_until TIMESTAMP

-- In fix_student_management_v2.sql oder neue Migration hinzufügen

-- RPC-Funktion erweitern: verify_user_4digit_pin()
CREATE OR REPLACE FUNCTION verify_user_4digit_pin(...)
RETURNS TABLE (...) AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- Hole User-Daten
    SELECT * INTO v_user FROM public.users WHERE pin_4digit = p_pin LIMIT 1;

    -- 1. Check: Account gesperrt?
    IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Account locked. Try again later.'::TEXT;
        RETURN;
    END IF;

    -- 2. Check: Honeypot/IP-Ban (bestehende Logik)
    ...

    -- 3. PIN-Validierung
    IF v_user.pin_4digit = p_pin THEN
        -- Erfolg: Reset failed_attempts
        UPDATE public.users
        SET failed_attempts = 0, locked_until = NULL
        WHERE id = v_user.id;

        RETURN QUERY SELECT v_user.id, v_user.name, ...;
    ELSE
        -- Fehler: Increment failed_attempts
        UPDATE public.users
        SET
            failed_attempts = failed_attempts + 1,
            locked_until = CASE
                WHEN failed_attempts + 1 >= 5
                THEN NOW() + INTERVAL '15 minutes'
                ELSE locked_until
            END
        WHERE id = v_user.id;

        RETURN QUERY SELECT NULL::UUID, ..., 'Invalid PIN'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Dateien:**
- `supabase/add_account_lockout.sql` (neu)
- `supabase/create_honeypot_pins_fixed.sql` (RPC-Update)

**Komplexität:** 🟡 Mittel (SQL-Logik)
**Status:** ⬜ Offen
**Priorität:** 🔴 KRITISCH
**Abhängigkeiten:** Keine (Spalten existieren bereits)

---

### ⬜ Todo 4: Progressive Delays (20 Min.)

**Ziel:** Verzögerung nach jedem Fehler (1s, 2s, 5s, 10s)

**Implementierung:**
```typescript
// src/app/login-pin/page.tsx + src/app/login/page.tsx

const [attemptCount, setAttemptCount] = useState(0);

const delays = [0, 1000, 2000, 5000, 10000]; // ms

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleSubmit() {
  // Delay vor Submit
  const delay = delays[Math.min(attemptCount, delays.length - 1)];
  if (delay > 0) {
    setIsSubmitting(true);
    await sleep(delay);
  }

  // Login-Versuch...
  const success = await attemptLogin();

  if (!success) {
    setAttemptCount(prev => prev + 1);
  } else {
    setAttemptCount(0);
  }
}
```

**Berechnung:**
- 1. Versuch: 0s
- 2. Versuch: 1s
- 3. Versuch: 2s
- 4. Versuch: 5s
- 5+ Versuch: 10s

**Brute-Force Zeit:** 10.000 PINs × 10s = 27,7 Stunden (praktisch unmöglich mit Lockout nach 5 Versuchen)

**Dateien:**
- `src/app/login-pin/page.tsx`
- `src/app/login/page.tsx`

**Komplexität:** 🟢 Einfach (Frontend-only)
**Status:** ⬜ Offen
**Priorität:** 🟡 Hoch

---

### ⬜ Todo 5: Device Fingerprinting (40 Min.)

**Ziel:** Browser-Fingerprint als unsichtbarer 2. Faktor

**Implementierung:**
```typescript
// src/lib/useDeviceFingerprint.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export async function getDeviceFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}

// src/app/login-pin/page.tsx
const handleLogin = async () => {
  const fingerprint = await getDeviceFingerprint();

  // Login mit Fingerprint
  const { data, error } = await supabase.rpc('verify_user_4digit_pin', {
    p_pin: pin,
    p_ip_address: clientIp,
    p_user_agent: navigator.userAgent,
    p_fingerprint: fingerprint  // NEU
  });

  // Wenn Fingerprint nicht matched → Email-Verification erforderlich
  if (data?.fingerprint_mismatch) {
    // Zeige "Neues Gerät erkannt - Check deine Email"
    // Sende Verifizierungs-Email
  }
};
```

**SQL:**
```sql
-- Spalte bereits vorhanden: device_fingerprint TEXT

-- RPC erweitern:
CREATE OR REPLACE FUNCTION verify_user_4digit_pin(
    p_pin TEXT,
    p_ip_address INET,
    p_user_agent TEXT,
    p_fingerprint TEXT  -- NEU
)
...
BEGIN
    -- Nach erfolgreicher PIN-Validierung:
    IF v_user.device_fingerprint IS NULL THEN
        -- Erster Login: Fingerprint speichern
        UPDATE public.users SET device_fingerprint = p_fingerprint WHERE id = v_user.id;
    ELSIF v_user.device_fingerprint != p_fingerprint THEN
        -- Neues Gerät: Flag setzen
        RETURN QUERY SELECT ..., 'fingerprint_mismatch'::TEXT;
    END IF;
END;
$$;
```

**Email-System:**
- Benötigt Supabase Auth oder externe Email-API (SendGrid, Resend)
- Verification-Link mit Token

**Setup:**
1. Install: `npm install @fingerprintjs/fingerprintjs`
2. Email-Provider konfigurieren

**Dateien:**
- `src/lib/useDeviceFingerprint.ts` (neu)
- `src/app/login-pin/page.tsx`
- `supabase/create_honeypot_pins_fixed.sql` (RPC-Update)
- `package.json` (+1 Dependency)

**Komplexität:** 🟡 Mittel (Library + Email-Flow)
**Status:** ⬜ Offen
**Priorität:** 🔵 Optional

---

### ✅ Todo 6: Honeypot-PINs (25 Min.)

**Status:** ✅ Erledigt (2026-02-12)

**Was wurde gemacht:**
- 15 Honeypot-PINs in `honeypot_pins` Tabelle
- IP-Ban-System mit `banned_ips` Tabelle
- Logging in `honeypot_log` Tabelle
- Integration in `verify_user_4digit_pin()` RPC

**Dateien:**
- `supabase/create_honeypot_pins_fixed.sql`

---

### ⬜ Todo 7: Admin MFA/TOTP (90 Min.)

**Ziel:** 2FA nach erfolgreichem Admin-Login

**Implementierung:**

**1. QR-Code Setup (einmalig):**
```typescript
// src/components/admin/MFASetup.tsx
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

export function MFASetup({ user }: { user: User }) {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    // TOTP-Secret generieren
    const totp = new OTPAuth.TOTP({
      issuer: 'GreekLingua',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(generateSecret())
    });

    setSecret(totp.secret.base32);

    // QR-Code erstellen
    QRCode.toDataURL(totp.toString(), (err, url) => {
      setQrCode(url);
    });

    // Recovery-Codes generieren (10 Stück)
    const codes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setRecoveryCodes(codes);
  }, []);

  const handleSave = async () => {
    // Secret verschlüsselt in DB speichern
    await supabase.rpc('save_admin_mfa_secret', {
      p_user_id: user.id,
      p_secret: secret,
      p_recovery_codes: recoveryCodes
    });
  };

  return (
    <div>
      <h2>MFA Setup</h2>
      <img src={qrCode} alt="QR Code" />
      <p>Scanne diesen Code mit deiner Authenticator-App</p>
      <p>Secret (manuell): {secret}</p>

      <h3>Recovery-Codes (Backup)</h3>
      <ul>{recoveryCodes.map(code => <li key={code}>{code}</li>)}</ul>

      <button onClick={handleSave}>Speichern</button>
    </div>
  );
}
```

**2. MFA-Verifizierung beim Login:**
```typescript
// src/components/admin/MFAVerify.tsx
import * as OTPAuth from 'otpauth';

export function MFAVerify({ user, onSuccess }: Props) {
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    // Code mit Secret validieren
    const { data, error } = await supabase.rpc('verify_admin_totp', {
      p_user_id: user.id,
      p_code: code
    });

    if (data.valid) {
      onSuccess();
    } else {
      setError('Invalid code');
    }
  };

  return (
    <div>
      <h2>2-Factor Authentication</h2>
      <input
        type="text"
        placeholder="000000"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
}
```

**3. SQL (MFA-Secret speichern):**
```sql
-- Neue Spalten
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_recovery_codes TEXT[], -- Array von 10 Codes
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;

-- RPC: Secret speichern (verschlüsselt)
CREATE OR REPLACE FUNCTION save_admin_mfa_secret(
    p_user_id UUID,
    p_secret TEXT,
    p_recovery_codes TEXT[]
)
RETURNS JSON AS $$
BEGIN
    UPDATE public.users
    SET
        mfa_secret = pgp_sym_encrypt(p_secret, current_setting('app.jwt_secret')),
        mfa_recovery_codes = p_recovery_codes,
        mfa_enabled = true
    WHERE id = p_user_id AND role = 'admin';

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: TOTP-Code validieren
CREATE OR REPLACE FUNCTION verify_admin_totp(
    p_user_id UUID,
    p_code TEXT
)
RETURNS JSON AS $$
DECLARE
    v_secret TEXT;
    v_valid BOOLEAN;
BEGIN
    -- Secret entschlüsseln
    SELECT pgp_sym_decrypt(mfa_secret::bytea, current_setting('app.jwt_secret'))
    INTO v_secret
    FROM public.users
    WHERE id = p_user_id;

    -- TOTP validieren (via Extension oder externe Library)
    -- Hier vereinfacht:
    v_valid := (p_code = calculate_totp(v_secret, NOW()));

    RETURN json_build_object('valid', v_valid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**4. Login-Flow Anpassung:**
```typescript
// src/app/login/page.tsx
const handleLogin = async () => {
  // 1. PIN + CAPTCHA validieren
  const { data: user } = await login(username, pin);

  // 2. Wenn Admin + MFA aktiviert → MFA-Verifizierung
  if (user.role === 'admin' && user.mfa_enabled) {
    setShowMFADialog(true);
    return; // Warte auf MFA-Code
  }

  // 3. Normaler Login (ohne MFA)
  router.push('/dashboard');
};

const handleMFASuccess = () => {
  setShowMFADialog(false);
  router.push('/admin');
};
```

**Setup:**
1. Install: `npm install otpauth qrcode @types/qrcode`
2. Supabase: pgcrypto Extension aktivieren
3. JWT Secret in Supabase Settings definieren

**Dateien:**
- `src/components/admin/MFASetup.tsx` (neu)
- `src/components/admin/MFAVerify.tsx` (neu)
- `src/app/login/page.tsx`
- `supabase/add_admin_mfa.sql` (neu)
- `package.json` (+3 Dependencies)

**Komplexität:** 🔴 Hoch (neue UI + Crypto + TOTP)
**Status:** ⬜ Offen
**Priorität:** 🟡 Hoch
**Zeitaufwand:** ~90 Minuten

---

### ✅ Todo 8: IP-Whitelisting (Admin) (20 Min.)

**Status:** ✅ Erledigt (2026-02-12)

**Was wurde gemacht:**
- `.env.local`: `NEXT_PUBLIC_ADMIN_ALLOWED_IPS=""`
- IP-Check in `src/app/login/page.tsx` vor CAPTCHA
- Fetch von Client-IP via `api.ipify.org`
- Error: "Access denied - IP not whitelisted"

**Dateien:**
- `.env.local`
- `src/app/login/page.tsx`

---

### ⬜ Todo 9: Admin Rate Limiting (streng) (15 Min.)

**Ziel:** 3 Versuche/5 Min. für Admin (statt 10/Min. für Schüler)

**Implementierung:**
```typescript
// src/middleware.ts (erweitert Todo 2)

export async function middleware(req: NextRequest) {
  const isAdminLogin = req.nextUrl.pathname === '/login';
  const isPinLogin = req.nextUrl.pathname === '/login-pin';

  const ip = req.ip || 'unknown';

  if (isAdminLogin) {
    // Strenger: 3 Versuche / 5 Minuten
    const { success } = await rateLimitAdmin.limit(`admin:${ip}`);
    if (!success) {
      return new Response(JSON.stringify({
        error: 'Too many admin login attempts. Try again in 5 minutes.'
      }), { status: 429 });
    }
  } else if (isPinLogin) {
    // Normal: 10 Versuche / 1 Minute
    const { success } = await rateLimitLogin.limit(`pin:${ip}`);
    if (!success) {
      return new Response(JSON.stringify({
        error: 'Too many attempts. Try again in 1 minute.'
      }), { status: 429 });
    }
  }

  return NextResponse.next();
}

// src/lib/rateLimit.ts
export const rateLimitAdmin = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '5 m'),  // 3 req / 5 min
  analytics: true
});
```

**Dateien:**
- `src/middleware.ts`
- `src/lib/rateLimit.ts`

**Komplexität:** 🟢 Einfach (erweitert Todo 2)
**Status:** ⬜ Offen
**Priorität:** 🟢 Mittel
**Abhängigkeiten:** Todo 2

---

### ⬜ Todo 10: Session-Timeout (15 Min. für Admin) (10 Min.)

**Ziel:** Admin-Session läuft nach 15 Min. Inaktivität ab (statt 24h)

**Implementierung:**
```typescript
// src/context/AuthContext.tsx (erweitert)

const SESSION_TIMEOUT_ADMIN = 15 * 60 * 1000;   // 15 Minuten
const SESSION_TIMEOUT_STUDENT = 24 * 60 * 60 * 1000;  // 24 Stunden

useEffect(() => {
  if (!user) return;

  const timeout = user.role === 'admin'
    ? SESSION_TIMEOUT_ADMIN
    : SESSION_TIMEOUT_STUDENT;

  const sessionTimestamp = localStorage.getItem('greeklingua_session_timestamp');
  const elapsed = Date.now() - parseInt(sessionTimestamp || '0');

  if (elapsed > timeout) {
    logout();
  }

  // Check alle 60 Sekunden
  const interval = setInterval(() => {
    const elapsed = Date.now() - parseInt(localStorage.getItem('greeklingua_session_timestamp') || '0');
    if (elapsed > timeout) {
      logout();
    }
  }, 60000);

  return () => clearInterval(interval);
}, [user]);
```

**Dateien:**
- `src/context/AuthContext.tsx`

**Komplexität:** 🟢 Einfach (kleine Anpassung)
**Status:** ⬜ Offen
**Priorität:** 🟢 Mittel

---

### ⬜ Todo 11: Audit-Log (35 Min.)

**Ziel:** Alle Admin-Login-Versuche loggen

**SQL-Migration:**
```sql
-- Tabelle
CREATE TABLE IF NOT EXISTS public.admin_login_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_login_log_created ON public.admin_login_log(created_at DESC);
CREATE INDEX idx_admin_login_log_user ON public.admin_login_log(user_id);

-- RLS
ALTER TABLE public.admin_login_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_read_logs ON public.admin_login_log
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RPC
CREATE OR REPLACE FUNCTION log_admin_login(
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.admin_login_log (user_id, ip_address, user_agent, success, error_message)
    VALUES (p_user_id, p_ip_address, p_user_agent, p_success, p_error_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_admin_login TO anon;
GRANT EXECUTE ON FUNCTION log_admin_login TO authenticated;
```

**Login-Integration:**
```typescript
// src/app/login/page.tsx
const handleLogin = async () => {
  let userId = null;
  let success = false;
  let errorMessage = null;

  try {
    const result = await login(username, pin);
    success = !!result.user;
    userId = result.user?.id;

    if (!success) {
      errorMessage = result.error;
    }
  } catch (error) {
    errorMessage = error.message;
  } finally {
    // Log-Eintrag
    if (username === 'Admin' || /* check if admin attempt */) {
      const clientIp = await getClientIP();
      await supabase.rpc('log_admin_login', {
        p_user_id: userId,
        p_ip_address: clientIp,
        p_user_agent: navigator.userAgent,
        p_success: success,
        p_error_message: errorMessage
      });
    }
  }
};
```

**Admin-Dashboard Widget:**
```typescript
// src/app/admin/page.tsx
function AdminLoginLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('admin_login_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setLogs(data || []);
    }
    fetchLogs();
  }, []);

  return (
    <div className="log-widget">
      <h3>🔒 Admin Login Log (letzte 50)</h3>
      <table>
        <thead>
          <tr>
            <th>Zeit</th>
            <th>IP</th>
            <th>Status</th>
            <th>Fehler</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className={log.success ? 'success' : 'error'}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.ip_address}</td>
              <td>{log.success ? '✅ Erfolg' : '❌ Fehler'}</td>
              <td>{log.error_message || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Dateien:**
- `supabase/create_admin_audit_log.sql` (neu)
- `src/app/login/page.tsx`
- `src/app/admin/page.tsx`

**Komplexität:** 🟡 Mittel (SQL + UI)
**Status:** ⬜ Offen
**Priorität:** 🟢 Mittel
**Zeitaufwand:** ~35 Minuten

---

### ⬜ Todo 12: Testing & Bugfixes (30 Min.)

**Testplan:**

**1. PIN-Login (Schüler):**
- [ ] Erfolgreicher Login mit PIN 3741
- [ ] Welcome-Popup zeigt 2 Sekunden
- [ ] Redirect zu /dashboard funktioniert
- [ ] Fehler bei ungültigem PIN
- [ ] Error-Popup zeigt 2 Sekunden
- [ ] Honeypot-PIN 9999 → IP-Ban
- [ ] Gesperrte IP kann nicht mehr einloggen

**2. Rate Limiting:**
- [ ] 11. Versuch wird geblockt (429 Error)
- [ ] Nach 1 Minute wieder freigeschaltet
- [ ] Admin: 4. Versuch wird geblockt
- [ ] Nach 5 Minuten wieder freigeschaltet

**3. Account Lockout:**
- [ ] 5 Fehlversuche → Account gesperrt
- [ ] Error: "Account locked. Try again in 15 minutes."
- [ ] Nach 15 Minuten wieder freigeschaltet
- [ ] Erfolgreicher Login resettet Counter

**4. Progressive Delays:**
- [ ] 1. Versuch: sofort
- [ ] 2. Versuch: 1 Sekunde Delay
- [ ] 3. Versuch: 2 Sekunden Delay
- [ ] 4. Versuch: 5 Sekunden Delay
- [ ] 5. Versuch: 10 Sekunden Delay

**5. Admin-Features:**
- [ ] Admin MFA: QR-Code Setup
- [ ] Admin MFA: TOTP-Code validiert
- [ ] Admin MFA: Recovery-Code funktioniert
- [ ] IP-Whitelisting: Nur erlaubte IPs
- [ ] Session-Timeout: Nach 15 Min. Logout
- [ ] Audit-Log: Alle Versuche geloggt

**6. Device Fingerprinting:**
- [ ] Erster Login: Fingerprint gespeichert
- [ ] Bekanntes Gerät: Kein Extra-Schritt
- [ ] Neues Gerät: Email-Verification
- [ ] Verification-Link funktioniert

**Dateien:**
- `docs/test-results.md` (neu)

**Komplexität:** 🟡 Mittel (Integration)
**Status:** ⬜ Offen
**Priorität:** 🟡 Hoch

---

### ⬜ Todo 13: Dokumentation Update (15 Min.)

**Dateien aktualisieren:**
- [x] `docs/login-pin-security.md` (Implementation Checklist)
- [x] `CLAUDE.md` (Alle Changes dokumentieren)
- [ ] `docs/TODO-LOGIN-SYSTEM-COMPLETE.md` (dieses Dokument)
- [ ] `README.md` (Quick-Start erweitern)

**Komplexität:** 🟢 Einfach
**Status:** 🔄 In Arbeit (dieses Dokument)
**Priorität:** 🟢 Mittel

---

## SQL-Migrationen Checkliste

**Ausführungsreihenfolge in Supabase SQL Editor:**

### ✅ Bereits ausgeführt (vermutlich)

1. ✅ `supabase/create_ui_translations.sql` - UI-Übersetzungen
2. ✅ `supabase/alter_learning_items_add_russian.sql` - Russische Lerninhalte
3. ✅ `supabase/create_lesson_sessions.sql` - Unterrichts-Tabellen

### ⚠️ Kritisch - MUSS ausgeführt werden

4. ⬜ **`supabase/fix_student_management_v2.sql`**
   - **Wichtig:** Users-Tabelle + RPC-Funktionen
   - Erstellt: `pin_hash`, `pin_4digit`, `role`, `level`, `difficulty`, etc.
   - RPC: `verify_user_pin()`, `create_student()`, `update_student()`, `delete_student()`
   - **Status:** Wahrscheinlich fehlt (daher PIN-Login-Probleme)

5. ⬜ **`supabase/cleanup_verify_function.sql`**
   - Löscht alte Funktions-Überladungen
   - **Muss VOR Schritt 6 ausgeführt werden!**

6. ⬜ **`supabase/create_honeypot_pins_fixed.sql`**
   - Honeypot-System (15 Trap-PINs)
   - IP-Ban-Tabellen
   - RPC: `verify_user_4digit_pin()`, `ban_ip()`, `is_ip_banned()`
   - **Abhängigkeit:** Schritt 4 + 5 müssen vorher laufen

7. ⬜ **`supabase/extend_users_for_4digit_pin.sql`** (oder `fix_test_users_complete.sql`)
   - Erstellt `pin_4digit` Spalte (falls noch nicht vorhanden)
   - Erstellt 5 Test-User: 3741, 8192, 5624, 7358, 9103
   - **Status:** Wahrscheinlich fehlt (daher PIN 3741 nicht gefunden)

8. ⬜ **`supabase/add_preferred_locale.sql`**
   - Sprach-Persistenz (preferred_locale Spalte)
   - RPC: `update_user_locale()`

### 🟡 Wichtig - Sollte ausgeführt werden

9. ⬜ `supabase/create_performance_evaluation.sql`
   - Performance-Log + Evaluation
   - RPC: `evaluate_student_performance()`, `get_student_stats()`

10. ⬜ `supabase/add_level_difficulty_to_learning_items.sql`
    - Level/Difficulty für Learning-Items
    - RPC: `get_learning_items_for_student()`, `assign_item_level()`

11. ⬜ `supabase/insert_missing_dashboard_translations.sql`
    - Fehlende Dashboard-Übersetzungen (12 Keys × 2 Sprachen)

12. ⬜ `supabase/insert_greek_translations.sql`
    - Griechische UI-Übersetzungen (~130 Keys)

13. ⬜ `supabase/insert_german_translations.sql`
    - Deutsche UI-Übersetzungen (~130 Keys)

### 🔵 Optional - Neue Features

14. ⬜ `supabase/add_device_type_tracking.sql` (Todo 1)
    - `last_login_device` Spalte
    - RPC: `update_user_device()`

15. ⬜ `supabase/add_unique_pin_constraint.sql` (Todo 48)
    - UNIQUE Constraint auf `pin_4digit`

16. ⬜ `supabase/add_account_lockout.sql` (Todo 3)
    - Lockout-Logik in `verify_user_4digit_pin()` RPC

17. ⬜ `supabase/add_admin_mfa.sql` (Todo 7)
    - MFA-Spalten: `mfa_secret`, `mfa_recovery_codes`, `mfa_enabled`
    - RPC: `save_admin_mfa_secret()`, `verify_admin_totp()`

18. ⬜ `supabase/add_user_unlock_rpc.sql` (Todo 51)
    - RPC: `unban_user_ips()`, `unlock_user_account()`

19. ⬜ `supabase/add_admin_contact_phone.sql` (Todo 53)
    - `contact_phone` Spalte
    - RPC: `get_admin_contact()`

20. ⬜ `supabase/create_admin_audit_log.sql` (Todo 11)
    - `admin_login_log` Tabelle
    - RPC: `log_admin_login()`

### 🛠️ Diagnose & Wartung

21. ✅ `supabase/diagnose_pin_login.sql`
    - 6 Diagnose-Schritte für PIN-Login-Debugging
    - **Jederzeit ausführbar** (read-only)

22. ✅ `supabase/unban_all_ips.sql`
    - Emergency Unban (alle IP-Sperren löschen)
    - **Nur bei Bedarf** (nach Tests mit Honeypot-PINs)

23. ✅ `supabase/disable_honeypot_temporarily.sql`
    - Entfernt 9999 aus Honeypot-Liste (für Tests)
    - **Nur im DEV-Environment**

---

### Empfohlene Reihenfolge für Ersteinrichtung:

```bash
# 1. Basis (MUSS)
supabase/fix_student_management_v2.sql
supabase/cleanup_verify_function.sql
supabase/create_honeypot_pins_fixed.sql
supabase/fix_test_users_complete.sql

# 2. Diagnose (prüfen ob alles funktioniert)
supabase/diagnose_pin_login.sql

# 3. Sprachen
supabase/add_preferred_locale.sql
supabase/insert_missing_dashboard_translations.sql
supabase/insert_greek_translations.sql
supabase/insert_german_translations.sql

# 4. Leistungsstufen
supabase/create_performance_evaluation.sql
supabase/add_level_difficulty_to_learning_items.sql

# 5. Sicherheits-Features (nach Bedarf)
supabase/add_device_type_tracking.sql  # Todo 1
supabase/add_unique_pin_constraint.sql  # Todo 48
supabase/add_account_lockout.sql  # Todo 3
# ... weitere Security-Todos
```

---

## Test-Anleitung

### Voraussetzung: SQL-Migrationen ausgeführt

Führe zuerst Schritte 4-7 aus der [SQL-Migrationen Checkliste](#sql-migrationen-checkliste) aus.

### 1. Server starten

```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard
PORT=3001 npm run dev
```

### 2. Schüler-Login testen (`/login-pin`)

**URL:** `http://localhost:3001/login-pin`

**Test 1: Erfolgreicher Login**
- PIN: `3741` (Anna Meier)
- ✅ Welcome-Popup: "Willkommen, Anna Meier!"
- ✅ Badges: "Stufe: A1" + "easy"
- ✅ Nach 2 Sekunden → `/dashboard`

**Test 2: Ungültiger PIN**
- PIN: `1234` (nicht existierend, aber kein Honeypot)
- ❌ Error-Popup: "PIN nicht gefunden"
- ⏱️ Nach 2 Sekunden → Eingabe leer, erneut versuchen

**Test 3: Honeypot-PIN (⚠️ sperrt deine IP!)**
- PIN: `9999`
- ❌ Error-Popup: "PIN nicht gefunden"
- 🚫 IP wird für 24h gebannt
- 📝 Eintrag in `honeypot_log`
- **Entsperren:** `supabase/unban_all_ips.sql` ausführen

**Test 4: Sprachauswahl**
- Wechsel zwischen EN / RU / EL / DE
- ✅ Toast-Nachricht erscheint
- ✅ Hintergrund ändert Farbe (EN=blau, RU=rot, EL=cyan, DE=gold)

**Test 5: Device-Type**
- Wähle "Desktop" oder "Mobile" Radio-Button
- ✅ Auswahl wird in DB gespeichert (`last_login_device`)

### 3. Admin-Login testen (`/login`)

**URL:** `http://localhost:3001/login`

**Test 1: Admin-Login**
- Username: `Admin` (vorausgefüllt)
- PIN: `1234` (6-stellig)
- CAPTCHA: Löse Math-Aufgabe (z.B. "7 + 3 = 10")
- ✅ Login erfolgreich → `/admin`

**Test 2: CAPTCHA-Fehler**
- Falsche CAPTCHA-Antwort
- ❌ Error: "CAPTCHA incorrect"
- ✅ Neue CAPTCHA-Aufgabe generiert

**Test 3: IP-Whitelisting (falls konfiguriert)**
- `.env.local`: `NEXT_PUBLIC_ADMIN_ALLOWED_IPS="127.0.0.1"`
- Von anderer IP: ❌ "Access denied - IP not whitelisted"
- Von 127.0.0.1: ✅ Login möglich

### 4. Honeypot-System testen

**Vorbereitung:**
```sql
-- In Supabase SQL Editor
SELECT * FROM honeypot_pins;
-- Sollte 15 PINs zeigen
```

**Test:**
1. Login mit PIN `9999` (oder andere Honeypot-PIN)
2. Prüfe `banned_ips` Tabelle:
   ```sql
   SELECT * FROM banned_ips ORDER BY created_at DESC;
   ```
3. Prüfe `honeypot_log`:
   ```sql
   SELECT * FROM honeypot_log ORDER BY created_at DESC LIMIT 10;
   ```
4. Versuche erneut einzuloggen → ❌ "PIN nicht gefunden" (IP gebannt)

**Entsperren:**
```sql
-- In Supabase SQL Editor
DELETE FROM banned_ips;
```

### 5. Diagnose ausführen

```sql
-- In Supabase SQL Editor
-- Kopiere kompletten Inhalt von:
supabase/diagnose_pin_login.sql

-- Ergebnis sollte zeigen:
-- ✅ 5 Test-User vorhanden
-- ✅ RPC-Funktion existiert
-- ✅ Honeypot-Tabelle existiert
-- ✅ PIN 3741 funktioniert
```

### 6. Performance-Test (optional)

**Brute-Force-Simulation:**
```javascript
// Browser Console (F12)
for (let i = 0; i < 11; i++) {
  fetch('http://localhost:3001/login-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '0000' })
  }).then(res => console.log(`Attempt ${i+1}:`, res.status));
}

// Erwartung:
// Attempt 1-10: 200 oder 401
// Attempt 11: 429 (Rate Limit)
```

---

## Chronologie

### Login-System Entwicklung (aus CLAUDE.md)

**2026-02-08 – Aufgabe 9-11:** Admin-Login + Authentifizierung
- `AuthContext` mit `role` erweitert
- Admin-Button im DashboardHeader
- bcrypt PIN-Hashing
- Session-Timeout (24h)
- Login-Kette: Supabase RPC → Direkt-Query → Lokaler Fallback

**2026-02-08 – Aufgabe 18:** User-Zuordnung via 6-stelliger PIN
- PIN-Pad-Stil (6 einzelne Ziffernfelder)
- Auto-Focus, Backspace-Navigation, Paste-Support

**2026-02-12:** 4-stelliger PIN-Login
- Neue Route `/login-pin` erstellt
- On-Screen numerische Tastatur (0-9, ⌫, C)
- 4 große Ziffern-Boxen (64x72px)
- Welcome-Popup (Glasmorphismus-Design)
- Admin-Button (👤 Gold-Style) → navigiert zu `/login`
- Device-Type Radio-Button (Desktop/Mobile)

**2026-02-12:** Honeypot-PINs + IP-Ban-System
- 15 Honeypot-PINs (0000, 1111-9999, 1234, 4321, 1122, 2211, 5678)
- `banned_ips` Tabelle mit 24h Ablauf
- `honeypot_log` Protokollierung
- RPC: `verify_user_4digit_pin()` mit Honeypot-Check
- RPC: `ban_ip()`, `is_ip_banned()`

**2026-02-12:** Login-Flow optimiert
- `window.location.href` → `router.push()` (kein Full-Page-Reload)
- IP-Fetch Timeout (3s mit AbortController)
- Supabase RPC Timeout (10s mit Promise.race)
- Backdrop-Blur reduziert (8px → 4px für Performance)
- Welcome-Popup-Zeit erhöht (1s → 2s)

**2026-02-12:** Admin-Login modernisiert
- Username vorausgefüllt: "Admin"
- CAPTCHA hinzugefügt (Math-Aufgabe)
- IP-Whitelisting (`.env.local`)

**2026-02-12:** Phase 7 geplant
- 7 neue Aufgaben (47-53) für PIN-Management
- WhatsApp/Telegram-Benachrichtigungen
- Auto-PIN-Generierung mit Duplikat- und Honeypot-Check

---

## Prioritäten

### 🔴 KRITISCH (sofort)

1. **SQL-Migrationen ausführen** (Schritte 4-7)
   - Ohne diese funktioniert PIN-Login nicht!

2. **Todo 2: Rate Limiting** (45 Min.)
   - Verhindert Brute-Force-Angriffe

3. **Todo 3: Account Lockout** (30 Min.)
   - 5 Fehlversuche → 15 Min. Sperre

### 🟡 HOCH (wichtig)

4. **Todo 4: Progressive Delays** (20 Min.)
   - Macht Brute-Force ineffizient

5. **Phase 7: Aufgaben 47-50** (PIN-Management)
   - Auto-Generierung + Duplikat-Check + Honeypot-Check

6. **Todo 7: Admin MFA** (90 Min.)
   - 2FA für Admin-Zugang

### 🟢 MITTEL (nützlich)

7. **Todo 11: Audit-Log** (35 Min.)
   - Protokollierung aller Admin-Login-Versuche

8. **Todo 10: Session-Timeout 15 Min.** (10 Min.)
   - Kurze Sessions für Admin

9. **Phase 7: Aufgabe 51** (User entsperren)
   - Admin kann gesperrte User freischalten

### 🔵 OPTIONAL (nice-to-have)

10. **Todo 5: Device Fingerprinting** (40 Min.)
    - Unsichtbarer 2. Faktor

11. **Phase 7: Aufgaben 52-53** (WhatsApp/Telegram)
    - Benachrichtigungen bei Sicherheitsvorfällen

---

## Abhängigkeiten

```
SQL-Migrationen (4-7)
    ├── Todo 2 (Rate Limiting) ← Todo 9 (Admin Rate Limiting)
    ├── Todo 3 (Account Lockout)
    ├── Todo 4 (Progressive Delays)
    ├── Todo 5 (Device Fingerprinting)
    ├── Todo 7 (Admin MFA)
    ├── Todo 10 (Session-Timeout)
    ├── Todo 11 (Audit-Log)
    └── Phase 7
        ├── 47 (Auto-PIN) → 48 (Duplikat) + 49 (Honeypot)
        ├── 50 (PIN neu generieren) → 48 + 49
        ├── 51 (User entsperren)
        ├── 52 (WhatsApp/Telegram) → 53 (Admin-Tel.Nr.)
        └── 53 (Admin-Tel.Nr.)
```

---

## Nächste Schritte

1. **Sofort:**
   - [ ] SQL-Migrationen 4-7 in Supabase SQL Editor ausführen
   - [ ] Diagnose ausführen (`diagnose_pin_login.sql`)
   - [ ] PIN 3741 testen

2. **Heute:**
   - [ ] Todo 2: Rate Limiting implementieren (45 Min.)
   - [ ] Todo 3: Account Lockout implementieren (30 Min.)

3. **Diese Woche:**
   - [ ] Todo 4: Progressive Delays (20 Min.)
   - [ ] Phase 7: Aufgaben 47-50 (PIN-Management)

4. **Nächste Woche:**
   - [ ] Todo 7: Admin MFA (90 Min.)
   - [ ] Todo 11: Audit-Log (35 Min.)

5. **Optional (später):**
   - [ ] Todo 5: Device Fingerprinting (40 Min.)
   - [ ] Phase 7: Aufgaben 52-53 (Benachrichtigungen)

---

**Letzte Aktualisierung:** 2026-02-12 23:30
**Dokumentations-Version:** 1.0
**Verantwortlich:** Development Team

---

## Anhang: Wichtige Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Upstash Console:** https://console.upstash.com
- **FingerprintJS Docs:** https://dev.fingerprintjs.com
- **OTPAuth Library:** https://github.com/hectorm/otpauth
- **Telegram Bot API:** https://core.telegram.org/bots/api

---

## Kontakt

Bei Fragen oder Problemen:
- Admin-Telefon: +35796120069
- GitHub Issues: [Repository-Link]
- Dokumentation: `docs/` Ordner
