-- ============================================================
-- DIAGNOSE: PIN 3741 Login-Problem
-- ============================================================
-- Führe diese Abfragen aus um zu prüfen warum PIN 3741 nicht funktioniert
-- ============================================================

-- 1) Prüfe ob PIN 3741 existiert
SELECT
    id,
    name,
    email,
    pin_4digit,
    role,
    level,
    failed_attempts,
    locked_until,
    created_at
FROM users
WHERE pin_4digit = '3741';

-- Ergebnis sollte einen User zeigen
-- Wenn LEER → PIN existiert nicht!


-- 2) Prüfe ob PIN 3741 ein Honeypot ist
SELECT * FROM honeypot_pins WHERE pin = '3741';

-- Ergebnis sollte LEER sein
-- Wenn NICHT LEER → PIN ist Honeypot (wird blockiert)


-- 3) Prüfe ob IP gebannt ist (ersetze mit deiner IP)
-- Du findest deine IP hier: https://api.ipify.org
SELECT * FROM banned_ips WHERE ip_address = 'DEINE_IP_HIER';

-- Ergebnis sollte LEER sein
-- Wenn NICHT LEER → IP ist gebannt


-- 4) Teste RPC-Funktion direkt (MANUELLE AUSFÜHRUNG)
SELECT * FROM verify_user_4digit_pin(
    p_pin := '3741',
    p_ip_address := NULL,  -- NULL = IP-Check überspringen
    p_user_agent := 'Test'
);

-- Ergebnis sollte User-Daten zeigen mit error = NULL
-- Wenn error != NULL → Zeigt welcher Security-Check fehlschlägt


-- 5) Prüfe ob RPC-Funktion existiert
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'verify_user_4digit_pin';

-- Ergebnis sollte die Funktion zeigen
-- Wenn LEER → Funktion wurde nicht erstellt! Führe 001_verify_user_4digit_pin_complete.sql aus


-- ============================================================
-- LÖSUNG basierend auf Diagnose:
-- ============================================================

-- Fall 1: PIN existiert nicht
-- → Erstelle Test-User mit PIN 3741:
/*
INSERT INTO users (name, email, pin_4digit, role, level, difficulty)
VALUES ('Test Student', 'test@example.com', '3741', 'student', 'A1', 'easy');
*/

-- Fall 2: PIN ist Honeypot
-- → Entferne aus Honeypot-Liste:
/*
DELETE FROM honeypot_pins WHERE pin = '3741';
*/

-- Fall 3: IP gebannt
-- → Unban IP:
/*
DELETE FROM banned_ips WHERE ip_address = 'DEINE_IP';
*/

-- Fall 4: RPC-Funktion existiert nicht
-- → Führe aus: database/migrations/001_verify_user_4digit_pin_complete.sql

-- Fall 5: Account locked
-- → Unlock:
/*
UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE pin_4digit = '3741';
*/
