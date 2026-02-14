# 🚨 QUICK FIX: PIN 3741 Login-Problem

## Problem
RPC Error beim Login mit PIN 3741:
```
RPC error: {}
```

## Ursache
Die Supabase RPC-Funktion `verify_user_4digit_pin` wurde wahrscheinlich noch nicht in Supabase ausgeführt.

---

## ✅ LÖSUNG (3 Schritte)

### **Schritt 1: Supabase SQL Editor öffnen**

1. Öffne https://supabase.com/dashboard
2. Wähle dein Projekt: **HellenicHorizons**
3. Gehe zu **SQL Editor** (linkes Menü)

---

### **Schritt 2: RPC-Funktion erstellen**

Kopiere den **kompletten Inhalt** dieser Datei:
```
database/migrations/001_verify_user_4digit_pin_complete.sql
```

Füge ihn in den SQL Editor ein und klicke **RUN**.

**Erwartete Ausgabe:**
```
Success. No rows returned.
```

---

### **Schritt 3: Test-User erstellen**

Kopiere diesen SQL-Code in den SQL Editor und führe ihn aus:

```sql
-- Test-User mit PIN 3741 erstellen (Anna Meier)
INSERT INTO users (
    name,
    email,
    pin_4digit,
    level,
    difficulty,
    role,
    preply,
    outside_preply,
    fee_per_hour,
    currency,
    performance_index
) VALUES (
    'Anna Meier',
    'anna.meier@test.de',
    '3741',
    'A1',
    'easy',
    'student',
    'anna_m',
    '-',
    28.50,
    'Euro',
    'A1-easy'
)
ON CONFLICT (email) DO UPDATE
SET pin_4digit = '3741';
```

**Erwartete Ausgabe:**
```
Success. 1 row affected.
```

---

### **Schritt 4: Testen**

Führe diesen Test-Query aus:

```sql
SELECT * FROM verify_user_4digit_pin(
    p_pin := '3741',
    p_ip_address := NULL,
    p_user_agent := 'Test'
);
```

**Erwartetes Ergebnis (Tabelle):**
```
user_id                              | user_name   | user_email           | user_role | user_level | error
-------------------------------------|-------------|----------------------|-----------|------------|-------
<eine UUID>                          | Anna Meier  | anna.meier@test.de   | student   | A1         | NULL
```

✅ Wenn `error = NULL` → **Login funktioniert!**
❌ Wenn leere Tabelle → RPC-Funktion wurde nicht korrekt erstellt

---

### **Schritt 5: Browser testen**

1. Öffne `http://localhost:3000/login-pin`
2. Gib PIN ein: **3741**
3. Login sollte funktionieren → Redirect zu `/m` (Mobile) oder `/dashboard` (Desktop)

---

## 🔍 ALTERNATIVE TEST-PINS

Falls 3741 nicht funktioniert, teste diese PINs:

| PIN  | Name           | Email                  |
|------|----------------|------------------------|
| 3741 | Anna Meier     | anna.meier@test.de     |
| 8192 | Boris Schmidt  | boris.schmidt@test.de  |
| 5624 | Clara Wagner   | clara.wagner@test.de   |
| 7358 | David Fischer  | david.fischer@test.de  |
| 9103 | Emma Bauer     | emma.bauer@test.de     |

Um alle Test-User zu erstellen, führe aus:
```
database/migrations/033_fix_test_users_complete.sql
```

---

## 🐛 DEBUGGING

Falls Login immer noch nicht funktioniert:

### 1. Browser Console prüfen

Öffne Chrome DevTools (F12) → **Network Tab**:
- Filter auf: `verify_user_4digit_pin`
- Klicke auf Request → **Response Tab**
- Kopiere die Response hier rein

### 2. Supabase Logs prüfen

Gehe zu Supabase Dashboard → **Logs** → **Postgres Logs**
- Filtere nach `verify_user_4digit_pin`
- Prüfe auf Fehler

### 3. Prüfe ob RPC-Funktion existiert

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'verify_user_4digit_pin';
```

**Erwartete Ausgabe:**
```
routine_name
-------------------------
verify_user_4digit_pin
```

Wenn leer → Funktion existiert nicht → Führe Schritt 2 erneut aus.

---

## 📧 SUPPORT

Wenn das Problem weiterhin besteht, sende mir:

1. Browser Console Output (vollständiger Error)
2. Supabase SQL Query Ergebnis (Schritt 4)
3. Network Tab Response (DevTools → Network → verify_user_4digit_pin)

---

**Viel Erfolg! 🚀**
