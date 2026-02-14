# 🚀 MASTER MIGRATION - AUSFÜHRUNGSANLEITUNG

**Erstellt:** 2026-02-14
**Zweck:** Alle 6 kritischen SQL-Migrationen in einer Datei
**Aufwand:** 5-10 Minuten

---

## 📋 WAS WIRD AUSGEFÜHRT?

Diese Master-Migration kombiniert **5 kritische Migrationen** in der richtigen Reihenfolge:

### **1. fix_student_management_v2.sql** (032)
- ✅ Erstellt `users` Tabelle mit allen Basis-Spalten
- ✅ Extensions: pgcrypto, uuid-ossp
- ✅ Spalten: id, email, pin, name, pin_hash, whatsapp, role, level, difficulty, performance_index
- ✅ Trigger: Automatische performance_index Berechnung
- ✅ RLS-Policies: Admin full access, Student read own
- ✅ RPC-Funktionen: verify_user_pin, create_student, update_student, delete_student, list_students

### **2. cleanup_verify_function.sql** (017)
- ✅ Löscht alte `verify_user_4digit_pin` Funktionen
- ✅ Bereitet saubere Basis für neue Funktion

### **3. extend_users_for_4digit_pin_fixed.sql** (029)
- ✅ Fügt `pin_4digit` Spalte hinzu
- ✅ Fügt `preply`, `outside_preply`, `fee_per_hour`, `currency` Spalten hinzu
- ✅ Erstellt 5 Test-Nutzer (A1-Beginner) mit 4-stelligen PINs
- ✅ CHECK-Constraints für currency

### **4. create_honeypot_pins_fixed.sql** (020)
- ✅ Erstellt `honeypot_pins` Tabelle (15 verbotene PINs)
- ✅ Erstellt `banned_ips` Tabelle
- ✅ Erstellt `honeypot_log` Tabelle (Alarm-Protokoll)
- ✅ RLS-Policies: Admin full access
- ✅ Indizes für schnelle Abfragen

### **5. EXECUTE_THIS_account_lockout_FIXED.sql** (002)
- ✅ Erstellt `verify_user_4digit_pin()` RPC-Funktion mit:
  - IP-Ban-Check
  - Honeypot-Detection
  - Account-Lockout (5 Strikes = 15 Min)
  - Automatic unlock nach Timeout
- ✅ Fügt `failed_attempts`, `locked_until` Spalten hinzu
- ✅ Erstellt `record_admin_failed_login_attempt()` RPC für Admin-Lockout

---

## ⚠️ WICHTIG VOR AUSFÜHRUNG

### **1. Backup erstellen**
```sql
-- Im Supabase Dashboard: Database → Backups → Create Backup
```

### **2. Keine aktiven User**
- Führe Migration außerhalb der Hauptnutzungszeit aus
- Informiere User über kurze Downtime (5-10 Minuten)

### **3. Richtige Reihenfolge**
- Diese Datei ist BEREITS in der richtigen Reihenfolge sortiert ✅
- NICHT einzelne Migrationen ausführen, sondern die komplette Datei

---

## 🚀 AUSFÜHRUNG (3 Schritte)

### **Schritt 1: Supabase Dashboard öffnen**
```
1. Gehe zu: https://supabase.com/dashboard
2. Wähle Projekt: HellenicHorizons GreekLingua
3. Linke Sidebar → "SQL Editor"
4. Klicke "New Query"
```

---

### **Schritt 2: SQL kopieren und einfügen**
```
1. Öffne lokale Datei:
   database/MASTER_MIGRATION_ALL_IN_ONE.sql

2. Kopiere GESAMTEN Inhalt (Cmd+A, Cmd+C)

3. Füge in Supabase SQL Editor ein (Cmd+V)

4. WICHTIG: Scrolle durch und prüfe ob alles vollständig ist
   - Sollte ~900+ Zeilen sein
   - Sollte mit "-- ============================================================" beginnen
   - Sollte mit "END $$;" enden
```

---

### **Schritt 3: Ausführen und Verifizieren**

#### **A) Ausführen:**
```
1. Klicke "Run" Button (unten rechts)
2. Warte 10-30 Sekunden
3. Erfolgsmeldung erscheint oben rechts
```

#### **B) Verifizieren:**
Führe diese Verifikations-Queries aus (in neuem Query):

```sql
-- ===== VERIFIKATION 1: Tabellen prüfen =====
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'honeypot_pins', 'banned_ips', 'honeypot_log')
ORDER BY table_name;

-- Erwartetes Ergebnis: 4 Zeilen
-- ✅ banned_ips
-- ✅ honeypot_log
-- ✅ honeypot_pins
-- ✅ users


-- ===== VERIFIKATION 2: users Spalten prüfen =====
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY column_name;

-- Erwartetes Ergebnis: Sollte enthalten:
-- ✅ pin_4digit
-- ✅ failed_attempts
-- ✅ locked_until
-- ✅ pin_hash
-- ✅ role
-- ✅ level
-- ✅ difficulty
-- ✅ performance_index


-- ===== VERIFIKATION 3: RPC-Funktionen prüfen =====
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'verify_user_pin',
    'verify_user_4digit_pin',
    'create_student',
    'update_student',
    'delete_student',
    'list_students',
    'record_admin_failed_login_attempt'
  )
ORDER BY routine_name;

-- Erwartetes Ergebnis: 7 Funktionen
-- ✅ create_student
-- ✅ delete_student
-- ✅ list_students
-- ✅ record_admin_failed_login_attempt
-- ✅ update_student
-- ✅ verify_user_4digit_pin
-- ✅ verify_user_pin


-- ===== VERIFIKATION 4: Test-Nutzer prüfen =====
SELECT name, pin_4digit, level, difficulty, role
FROM public.users
WHERE role = 'student'
ORDER BY name;

-- Erwartetes Ergebnis: 5 Test-Nutzer
-- ✅ Susi (3741, A1, easy)
-- ✅ Markus (8192, A1, easy)
-- ✅ Laura (5624, A1, easy)
-- ✅ Dimitris (7358, A1, easy)
-- ✅ Maria (9103, A1, easy)


-- ===== VERIFIKATION 5: Honeypot-PINs prüfen =====
SELECT COUNT(*) as honeypot_count
FROM public.honeypot_pins;

-- Erwartetes Ergebnis: 15
-- (0000, 1111-9999, 1234, 4321, 1122, 2211, 5678)


-- ===== VERIFIKATION 6: Admin-User prüfen =====
SELECT name, role, level, difficulty
FROM public.users
WHERE role = 'admin';

-- Erwartetes Ergebnis: 1 Admin-User
-- ✅ Admin (role=admin)
```

---

## ✅ ERFOLGS-KRITERIEN

Alle 6 Verifikations-Queries sollten die erwarteten Ergebnisse liefern:

| Verifikation | Erwartetes Ergebnis | Status |
|--------------|---------------------|--------|
| **1. Tabellen** | 4 Tabellen (users, honeypot_pins, banned_ips, honeypot_log) | [ ] |
| **2. Spalten** | pin_4digit, failed_attempts, locked_until vorhanden | [ ] |
| **3. RPC-Funktionen** | 7 Funktionen vorhanden | [ ] |
| **4. Test-Nutzer** | 5 Studenten (Susi, Markus, Laura, Dimitris, Maria) | [ ] |
| **5. Honeypot-PINs** | 15 PINs vorhanden | [ ] |
| **6. Admin-User** | 1 Admin vorhanden | [ ] |

---

## 🔧 TROUBLESHOOTING

### **Problem 1: "relation users already exists"**
**Lösung:** Das ist OK! Die Migration ist idempotent und überspringt existierende Tabellen.

---

### **Problem 2: "function verify_user_4digit_pin already exists"**
**Lösung:**
```sql
-- Führe cleanup zuerst aus:
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, INET, TEXT);
DROP FUNCTION IF EXISTS verify_user_4digit_pin(TEXT, TEXT, TEXT);

-- Dann führe Master-Migration erneut aus
```

---

### **Problem 3: "duplicate key value violates unique constraint"**
**Lösung:** Test-Nutzer existieren bereits. Das ist OK! Die Migration überspringt sie mit `ON CONFLICT DO NOTHING`.

---

### **Problem 4: "permission denied for schema public"**
**Lösung:**
1. Prüfe Supabase-Rolle: Du musst "Owner" oder "Admin" sein
2. Kontaktiere Supabase-Support falls Problem bleibt

---

### **Problem 5: "timeout after 30 seconds"**
**Lösung:**
- Migration ist zu groß für 30s Timeout
- Führe Migrationen einzeln aus (siehe unten)

---

## 📂 ALTERNATIVE: EINZELNE MIGRATIONEN

Falls Master-Migration zu groß ist, führe einzeln aus:

```bash
# Reihenfolge WICHTIG:
1. database/migrations/032_fix_student_management_v2.sql
2. database/migrations/017_cleanup_verify_function.sql
3. database/migrations/029_extend_users_for_4digit_pin_fixed.sql
4. database/migrations/020_create_honeypot_pins_fixed.sql
5. database/migrations/002_EXECUTE_THIS_account_lockout_FIXED.sql
```

**Warte nach jeder Migration bis "Success" erscheint!**

---

## 📊 NACH AUSFÜHRUNG

### **1. Funktionstest**
```
1. Gehe zu: http://localhost:3000/login-pin
2. Teste Login mit Test-User:
   - PIN: 3741 (Susi)
   - Erwartetes Ergebnis: Erfolgreicher Login
3. Teste Honeypot-PIN:
   - PIN: 0000
   - Erwartetes Ergebnis: Login fehlschlägt, IP wird gebannt
```

---

### **2. Git Commit**
```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard

git add database/MASTER_MIGRATION_ALL_IN_ONE.sql database/EXECUTE_THIS_MASTER_MIGRATION.md

git commit -m "feat: SQL Master-Migration erstellt (5 kritische Migrationen konsolidiert)

- Kombiniert 032, 017, 029, 020, 002 in einer Datei
- Enthält vollständige Anleitung mit 6 Verifikations-Queries
- Idempotent und sicher mehrfach ausführbar
- Aufwand: 5-10 Minuten

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push
```

---

### **3. Dokumentation aktualisieren**
```
- [ ] TODO.md → Aufgabe 1 (SQL-Migrationen) als ✅ markieren
- [ ] active-deploy/todo-overview.md → Status aktualisieren
```

---

## 📝 CHANGELOG

**2026-02-14:**
- ✅ Master-Migration erstellt (MASTER_MIGRATION_ALL_IN_ONE.sql)
- ✅ Ausführungsanleitung erstellt (EXECUTE_THIS_MASTER_MIGRATION.md)
- ✅ 6 Verifikations-Queries hinzugefügt
- ✅ Troubleshooting-Guide hinzugefügt

---

## 🎯 ZUSAMMENFASSUNG

**Was wird gemacht:**
1. ✅ Users-Tabelle mit allen Spalten erstellt
2. ✅ 4-stelliges PIN-System hinzugefügt
3. ✅ Honeypot-System (15 verbotene PINs) erstellt
4. ✅ Account-Lockout (5 Strikes = 15 Min) aktiviert
5. ✅ 5 Test-Nutzer + 1 Admin erstellt
6. ✅ 7 RPC-Funktionen für Auth + CRUD

**Aufwand:** 5-10 Minuten
**Risiko:** Niedrig (idempotent, kann mehrfach ausgeführt werden)
**Downtime:** Keine (außer kurze Latenz bei RPC-Calls)

---

**Viel Erfolg bei der Ausführung! 🚀**

Bei Problemen: Siehe Troubleshooting-Abschnitt oben
