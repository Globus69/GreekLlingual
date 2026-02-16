# 🔍 Dashboard Diagnostic Guide

**Datei:** `070_diagnostic_dashboard_complete.sql`
**Datum:** 16. Februar 2026
**Zweck:** Komplette Diagnose des Dashboard-Systems

---

## 📋 Was wird geprüft?

1. ✅ `student_progress` Tabelle (für Dashboard Stats)
2. ✅ `users` Streak-Spalten (streak_days, last_activity_date, longest_streak)
3. ✅ Streak RPC-Funktionen (update_user_streak, get_user_streak)
4. ✅ RLS-Policies auf student_progress
5. ✅ Daten-Validierung (Queries funktionieren?)
6. ✅ Practice Modes (Bonus-Check)
7. ✅ Gesamt-Health-Status
8. ✅ Empfohlene Aktionen

---

## 🚀 Anleitung

### Schritt 1: Supabase SQL Editor öffnen
1. Gehe zu https://supabase.com/dashboard
2. Wähle dein Projekt: `GreekLingua`
3. Klicke auf **SQL Editor** in der linken Sidebar

### Schritt 2: Script ausführen
1. Klicke auf **New Query**
2. Kopiere den **gesamten Inhalt** von `070_diagnostic_dashboard_complete.sql`
3. Füge ihn in den SQL Editor ein
4. Klicke auf **Run** (oder Cmd/Ctrl + Enter)

### Schritt 3: Ergebnisse analysieren
Das Script gibt **9 Result Sets** zurück:

#### Result Set 1: Student Progress Table
```
section                       | status        | column_count
------------------------------|---------------|-------------
1️⃣ STUDENT_PROGRESS TABLE   | ✅ EXISTS     | 25
```
- **✅ EXISTS** → Gut, Tabelle vorhanden
- **❌ MISSING** → Migration 047 muss ausgeführt werden

#### Result Set 2: Streak Columns
```
section                  | column_name         | status
------------------------|---------------------|----------
2️⃣ USERS STREAK COLUMNS | streak_days        | ✅ EXISTS
2️⃣ USERS STREAK COLUMNS | last_activity_date | ✅ EXISTS
2️⃣ USERS STREAK COLUMNS | longest_streak     | ✅ EXISTS
```
- Alle 3 müssen **✅ EXISTS** sein
- Bei **❌ MISSING** → Migration 058 ausführen

#### Result Set 3: Streak RPC Functions
```
section                  | function_name       | status
------------------------|---------------------|----------
3️⃣ STREAK RPC FUNCTIONS | update_user_streak | ✅ EXISTS
3️⃣ STREAK RPC FUNCTIONS | get_user_streak    | ✅ EXISTS
```
- Beide müssen **✅ EXISTS** sein
- Bei **❌ MISSING** → Migration 058 ausführen

#### Result Set 7: Overall Health (WICHTIGSTER CHECK!)
```
section           | overall_status                      | student_progress_ok | streak_columns_ok | streak_rpcs_ok
-----------------|-------------------------------------|---------------------|-------------------|---------------
7️⃣ OVERALL HEALTH | ✅ ALL COMPONENTS HEALTHY          | true                | true              | true
```
- **✅ ALL COMPONENTS HEALTHY** → Dashboard sollte funktionieren!
- **❌ COMPONENTS MISSING** → Siehe Result Set 8 für Aktionen

#### Result Set 8: Recommended Actions
```
section                | priority | action
----------------------|----------|----------------------------------------------
8️⃣ RECOMMENDED ACTIONS | 1        | ✅ student_progress table exists
8️⃣ RECOMMENDED ACTIONS | 2        | ✅ Streak columns exist
8️⃣ RECOMMENDED ACTIONS | 3        | ✅ Streak RPCs exist
8️⃣ RECOMMENDED ACTIONS | 4        | ✅ After applying migrations, refresh browser
```
- 🔴 **CRITICAL** → Sofort ausführen
- ✅ Grünes Häkchen → Alles OK

---

## 🔧 Fehlende Komponenten beheben

### Falls student_progress fehlt:
```sql
-- Migration 047 ausführen
-- Datei: database/migrations/047_setup_student_progress_for_phrases.sql
-- Kopiere und führe in Supabase SQL Editor aus
```

### Falls Streak-Spalten/RPCs fehlen:
```sql
-- Migration 058 ausführen
-- Datei: database/migrations/058_add_streak_tracking.sql
-- Kopiere und führe in Supabase SQL Editor aus
```

---

## ✅ Nach der Diagnose

### Wenn ALLES OK ist (alle ✅):
1. **Browser-Cache leeren** (Cmd+Shift+R / Ctrl+Shift+R)
2. **Dashboard neu laden**
3. **Console prüfen** (sollte sauber sein)
4. **Retry-Limits sind bereits implementiert** (siehe Code)

### Wenn Komponenten fehlen:
1. Fehlende Migrations in Supabase ausführen
2. Diagnostic nochmal laufen lassen → Verifizierung
3. Browser-Cache leeren
4. Dashboard testen

---

## 🐛 Bekannte Probleme

### Problem: ERR_FAILED trotz ✅ ALL COMPONENTS HEALTHY
**Mögliche Ursachen:**
1. **RLS-Policies blockieren User** → Prüfe Result Set 4 (RLS Policies)
2. **User-ID nicht korrekt** → Prüfe Auth-Context
3. **Network-Probleme** → Prüfe Browser DevTools Network Tab

**Lösung:**
- Teste Query manuell mit deiner User-ID:
  ```sql
  SELECT * FROM student_progress
  WHERE student_id = 'DEINE-USER-ID-HIER';
  ```

### Problem: RLS-Policies fehlen
**Symptom:** policy_count = 0

**Lösung:**
```sql
-- RLS aktivieren
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Policy für eigene Daten erstellen
CREATE POLICY "Users can view own progress"
ON student_progress FOR SELECT
USING (student_id = auth.uid());
```

---

## 📊 Erwartetes Ergebnis (wenn alles OK ist)

**Result Set 7 (Overall Health):**
```
overall_status: ✅ ALL COMPONENTS HEALTHY - Dashboard should work!
student_progress_ok: true
streak_columns_ok: true
streak_rpcs_ok: true
```

**Result Set 8 (Recommended Actions):**
```
Alle Zeilen mit ✅ (grünes Häkchen)
Keine 🔴 CRITICAL Meldungen
```

---

## 🎯 Nächste Schritte nach erfolgreicher Diagnose

1. ✅ Alle Komponenten vorhanden → **Dashboard sollte funktionieren**
2. ✅ Retry-Limits bereits implementiert → **Keine Infinite Loops mehr**
3. ✅ Error-Handling verbessert → **Fallback-Werte bei Fehlern**

**Dann:** Practice Modes Testing starten (laut CLAUDE.md Priorität)

---

**Letzte Aktualisierung:** 16. Februar 2026, 20:45 CET
**Status:** Bereit zur Ausführung
