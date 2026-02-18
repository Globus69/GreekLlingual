# Migration 080 & 081 - Fehleranalyse

## 🔴 KRITISCHE FEHLER GEFUNDEN

### Migration 080: `080_create_daily_phrases_multilingual.sql`

#### Fehler 1: GRANT EXECUTE ohne vollständige Funktionssignatur
**Location:** Zeilen 265-269

**Problem:**
```sql
GRANT EXECUTE ON FUNCTION get_phrases_filtered TO authenticated, anon;
GRANT EXECUTE ON FUNCTION bulk_update_phrases TO authenticated;
```

PostgreSQL benötigt die **vollständige Funktionssignatur** bei GRANT statements, einschließlich aller Parameter-Typen.

**Fehler:**
- `get_phrases_filtered` hat 7 Parameter aber GRANT hat keine
- `get_phrases_stats` hat 0 Parameter (OK)
- `bulk_update_phrases` hat 4 Parameter aber GRANT hat keine
- `bulk_delete_phrases` hat 1 Parameter aber GRANT hat keinen
- `check_phrases_duplicate` hat 3 Parameter aber GRANT hat keine

**Korrektur:**
```sql
GRANT EXECUTE ON FUNCTION get_phrases_filtered(TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_phrases_stats() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION bulk_update_phrases(UUID[], TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_delete_phrases(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_phrases_duplicate(TEXT, TEXT, UUID) TO authenticated;
```

---

#### Fehler 2: DROP TABLE CASCADE ohne Warnung
**Location:** Zeile 11

**Problem:**
```sql
DROP TABLE IF EXISTS phrases CASCADE;
```

- **Migration 077** hat bereits eine `phrases` Tabelle mit DATEN erstellt
- Diese Migration LÖSCHT alle Daten ohne Backup!
- **CASCADE** löscht auch alle abhängigen Objekte (RPC functions aus 077)

**Impact:** **DATENVERLUST-RISIKO**

**Korrektur:**
1. Backup erstellen BEVOR gedropt wird
2. Daten migrieren zur neuen Struktur
3. ODER: ALTER TABLE statt DROP+CREATE

**Fix:**
```sql
-- BACKUP FIRST!
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phrases') THEN
        EXECUTE format('CREATE TABLE _phrases_backup_%s AS SELECT * FROM phrases',
                      to_char(now(), 'YYYYMMDD_HH24MISS'));
        RAISE NOTICE '✅ Backup created: _phrases_backup_*';
    END IF;
END $$;

-- Then drop
DROP TABLE IF EXISTS phrases CASCADE;
```

---

#### Fehler 3: Konflikt mit Migration 077 Functions
**Location:** RPC Functions (Zeilen 134-259)

**Problem:**
- Migration 077 hat bereits Functions erstellt:
  - `admin_create_daily_phrase()`
  - `admin_update_daily_phrase()`
  - `admin_delete_daily_phrase()`
  - `check_daily_phrase_limit()`
  - `get_upcoming_phrases()`

- Migration 080 erstellt NEUE Functions mit ähnlichen Namen:
  - `get_phrases_filtered()`
  - `get_phrases_stats()`
  - `bulk_update_phrases()`
  - `bulk_delete_phrases()`
  - `check_phrases_duplicate()`

**Conflict:**
- Beide Migrations haben unterschiedliche Function-Sets
- Migration 077 Functions werden durch CASCADE gelöscht
- Alte API calls brechen

**Korrektur:**
1. Alte Functions aus 077 explizit droppen
2. ODER: Functions mit CREATE OR REPLACE überschreiben

---

### Migration 081: `081_drop_content_use_vocab.sql`

#### Fehler 1: VIEW permissions ohne Tabellenpermissions
**Location:** Zeilen 77-78

**Problem:**
```sql
GRANT SELECT ON content TO authenticated, anon;
GRANT SELECT ON learning_items TO authenticated, anon;
```

**Issue:**
- VIEW `content` referenziert `multilingual_vocabulary` Tabelle
- User braucht auch SELECT permission auf `multilingual_vocabulary`
- Wenn User kein Permission auf base table hat, schlägt VIEW SELECT fehl

**Korrektur:**
```sql
-- Grant permissions on views
GRANT SELECT ON content TO authenticated, anon;
GRANT SELECT ON learning_items TO authenticated, anon;

-- MUST ALSO grant on underlying table
GRANT SELECT ON multilingual_vocabulary TO authenticated, anon;
```

---

#### Fehler 2: VIEW content ist read-only aber code erwartet INSERT/UPDATE
**Location:** Zeilen 51-66

**Problem:**
```sql
CREATE OR REPLACE VIEW content AS SELECT ... FROM multilingual_vocabulary;
```

**Issue:**
- VIEW ist **read-only**
- Bestehende API routes für `/admin/content` erwarten INSERT/UPDATE/DELETE
- Alle Write-Operations werden fehlschlagen

**Impact:**
- `/admin/content` CRUD komplett broken
- Nur Read funktioniert

**Korrektur:**
1. VIEW mit INSTEAD OF TRIGGERS machen (kompliziert)
2. ODER: API routes umschreiben zu use `multilingual_vocabulary` direkt
3. ODER: Content table NICHT droppen, stattdessen migrieren

**Empfehlung:** Option 2 (API routes umschreiben)

---

## 📋 ZUSAMMENFASSUNG

### Migration 080 - 3 Fehler:
1. ❌ **GRANT EXECUTE** ohne vollständige Signaturen (5 Functions betroffen)
2. ❌ **DROP TABLE CASCADE** ohne Backup (Datenverlust-Risiko)
3. ⚠️ **Function Conflicts** mit Migration 077

### Migration 081 - 2 Fehler:
1. ⚠️ **Missing GRANT** auf underlying table
2. ❌ **Read-only VIEW** aber Write-Operations erwartet

---

## 🔧 FIX STRATEGY

### Option A: Neue Migrations erstellen (082, 083)
- Migration 082: Fix Migration 080 (GRANT statements, backup)
- Migration 083: Fix Migration 081 (permissions, API compatibility)

### Option B: Migrations 080/081 korrigieren BEFORE deployment
- Dateien direkt editieren (noch nicht deployed)
- Git commit amenden
- Re-deploy corrected versions

**Empfehlung:** **Option B** (wenn noch nicht deployed!)

---

## ✅ CORRECTED VERSIONS NEEDED

Soll ich die korrigierten Versionen erstellen?

1. `080_create_daily_phrases_multilingual.sql` (FIXED)
2. `081_drop_content_use_vocab.sql` (FIXED)
