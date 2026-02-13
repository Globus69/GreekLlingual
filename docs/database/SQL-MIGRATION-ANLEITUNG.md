# SQL-Migrations-Anleitung – Phase 7 (PIN-Management)

## Übersicht
Diese Anleitung beschreibt, welche SQL-Dateien in welcher Reihenfolge im **Supabase SQL Editor** ausgeführt werden müssen.

---

## ⚠️ WICHTIG: Ausführungs-Reihenfolge

### 1️⃣ Duplikat-Prüfung (erforderlich)
- Datei: `supabase/add_pin_duplicate_check.sql`
- UNIQUE Constraint + RPC-Funktionen

### 2️⃣ User-Entsperrung (erforderlich)
- Datei: `supabase/add_user_unlock_functions.sql`
- RPC: unlock_user, unban_user_ips, unban_all_ips

### 3️⃣ Admin-Telefonnummer (erforderlich)
- Datei: `supabase/add_admin_contact_phone.sql`
- Neue Spalte contact_phone + RPC get_admin_contact

### 4️⃣ Benachrichtigungssystem (optional)
- Datei: `supabase/prepare_notification_system.sql`
- Status: ⚠️ Vorbereitet, aber NICHT aktiviert
- Telegram/WhatsApp-Entscheidung steht noch aus

---

## Tests

```sql
-- Test 1: PIN-Check
SELECT is_pin_taken('3741', NULL);

-- Test 2: PIN-Generierung
SELECT generate_safe_pin(NULL);

-- Test 3: Admin-Kontakt
SELECT * FROM get_admin_contact();
```

Stand: 2026-02-12
