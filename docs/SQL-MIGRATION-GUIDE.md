# SQL Migration Guide - Security Features

**Datum:** 2026-02-12
**Status:** 3 Migrationen ausstehend

---

## 🚀 Anleitung: SQL-Migrationen in Supabase ausführen

### **Wo:**
1. Öffne https://supabase.com/dashboard
2. Wähle dein Projekt: **HellenicHorizons GreekLingua**
3. Gehe zu: **SQL Editor** (linke Sidebar)

### **Wie:**
1. Klicke auf **"New Query"**
2. Kopiere den SQL-Code aus der Datei
3. Klicke auf **"Run"** (oder Strg+Enter)
4. Warte auf Erfolgsmeldung: ✅ "Success. No rows returned"

---

## 📋 Migrations-Checklist

### ✅ **Migration 1: Device Fingerprinting**
**Datei:** `supabase/add_device_fingerprint.sql`

**Was macht es:**
- Fügt `device_fingerprint TEXT` Spalte zur `users` Tabelle hinzu
- Erstellt Index für Performance
- Ermöglicht Browser-Fingerprint-Tracking

**SQL-Code:**
```sql
-- Kopiere den kompletten Inhalt von add_device_fingerprint.sql
```

**Nach Ausführung:**
- ✅ Column `device_fingerprint` existiert
- ✅ Index `idx_users_fingerprint` erstellt
- ✅ Login-PIN speichert Fingerprint automatisch

---

### ✅ **Migration 2: Admin MFA/TOTP**
**Datei:** `supabase/add_admin_mfa.sql`

**Was macht es:**
- Fügt 3 Spalten hinzu: `mfa_secret`, `mfa_recovery_codes`, `mfa_enabled`
- Erstellt 4 RPC-Funktionen:
  - `save_admin_mfa_secret()` - Speichert TOTP Secret
  - `get_admin_mfa_secret()` - Holt Secret für Verifizierung
  - `use_admin_recovery_code()` - Nutzt Recovery Code (einmalig)
  - `disable_admin_mfa()` - Deaktiviert MFA

**SQL-Code:**
```sql
-- Kopiere den kompletten Inhalt von add_admin_mfa.sql
```

**Nach Ausführung:**
- ✅ 3 neue Spalten in `users` Tabelle
- ✅ 4 RPC-Funktionen verfügbar
- ✅ MFASetup.tsx kann genutzt werden

---

### ✅ **Migration 3: Admin Audit-Log**
**Datei:** `supabase/create_audit_log.sql`

**Was macht es:**
- Erstellt `admin_login_log` Tabelle
- Erstellt 4 RPC-Funktionen:
  - `log_admin_login()` - Erstellt Log-Eintrag
  - `get_recent_admin_logins()` - Holt letzte 50 Logs
  - `get_admin_login_stats()` - Statistiken (30 Tage)
  - `cleanup_old_admin_logs()` - Löscht Logs > 90 Tage

**SQL-Code:**
```sql
-- Kopiere den kompletten Inhalt von create_audit_log.sql
```

**Nach Ausführung:**
- ✅ Tabelle `admin_login_log` existiert
- ✅ 4 RPC-Funktionen verfügbar
- ✅ AdminLoginLog.tsx zeigt Daten an
- ✅ Jeder Admin-Login wird geloggt

---

## ✅ Schnell-Ausführung (Alle auf einmal)

**Option:** Alle 3 Migrationen in einer Query ausführen

1. Öffne **SQL Editor** in Supabase
2. Klicke auf **"New Query"**
3. Kopiere folgenden Befehl:

```sql
-- =====================================================
-- MIGRATION 1: Device Fingerprinting
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'device_fingerprint'
    ) THEN
        ALTER TABLE public.users ADD COLUMN device_fingerprint TEXT;
        RAISE NOTICE 'Column device_fingerprint added';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_fingerprint
ON public.users(device_fingerprint)
WHERE device_fingerprint IS NOT NULL;

-- =====================================================
-- MIGRATION 2: Admin MFA/TOTP
-- (Hier kompletten Inhalt von add_admin_mfa.sql einfügen)
-- =====================================================

-- =====================================================
-- MIGRATION 3: Admin Audit-Log
-- (Hier kompletten Inhalt von create_audit_log.sql einfügen)
-- =====================================================
```

4. Klicke **"Run"**
5. Warte auf ✅ Erfolgsmeldung

---

## 🧪 Verifizierung nach Migration

### **1. Prüfe Tabellen:**
```sql
-- Prüfe device_fingerprint Spalte
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'device_fingerprint';

-- Prüfe MFA Spalten
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('mfa_secret', 'mfa_recovery_codes', 'mfa_enabled');

-- Prüfe admin_login_log Tabelle
SELECT * FROM admin_login_log LIMIT 1;
```

### **2. Prüfe RPC-Funktionen:**
```sql
-- Liste alle RPC-Funktionen
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%admin%'
ORDER BY routine_name;
```

**Erwartete Funktionen:**
- `get_admin_login_stats`
- `get_admin_mfa_secret`
- `get_recent_admin_logins`
- `log_admin_login`
- `save_admin_mfa_secret`
- `use_admin_recovery_code`
- `disable_admin_mfa`
- `cleanup_old_admin_logs`

---

## ❗ Troubleshooting

### **Problem:** "relation already exists"
**Lösung:** Migration wurde bereits ausgeführt - überspringe sie

### **Problem:** "permission denied"
**Lösung:** Du brauchst Admin-Rechte in Supabase

### **Problem:** "syntax error at or near..."
**Lösung:** Prüfe ob kompletter SQL-Code kopiert wurde (inkl. $$-Delimiter)

---

## ✅ Nach erfolgreicher Migration

1. **Teste Device Fingerprinting:**
   - Gehe zu `/login-pin`
   - Logge dich ein
   - Prüfe in Supabase: `SELECT device_fingerprint FROM users WHERE name = 'DeinName';`
   - Sollte einen Hash-String zeigen

2. **Teste Audit-Log:**
   - Gehe zu `/admin`
   - Scrolle zu "🔐 Admin Login History"
   - Sollte 3 Statistik-Karten zeigen
   - Klicke "Show Login History" - sollte Einträge zeigen

3. **MFA Setup (optional):**
   - Integration in Login-Flow noch ausstehend
   - Komponenten sind ready (MFASetup.tsx, MFAVerify.tsx)

---

**Nächster Schritt:** Nach erfolgreicher Migration → MFA-Integration in Admin-Login-Flow
