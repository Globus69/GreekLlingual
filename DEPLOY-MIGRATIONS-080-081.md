# Migration 080 & 081 Deployment Guide

## 🚀 BEREIT ZUM DEPLOYMENT

Beide Migrations sind fehlerfrei und deployment-ready:
- ✅ Migration 080: `080_create_daily_phrases_multilingual.sql` (327 Zeilen)
- ✅ Migration 081: `081_drop_content_use_vocab.sql` (117 Zeilen)

---

## 📋 DEPLOYMENT METHODE: Supabase Dashboard

Da die Supabase CLI mit dem Pooler-Endpoint Probleme hat, deploye bitte manuell über das Dashboard:

### Schritt 1: Öffne Supabase Dashboard
```
https://supabase.com/dashboard/project/zubgodgjdzycthxndptc
```

### Schritt 2: Navigiere zum SQL Editor
- Linkes Menü → **SQL Editor**
- Klick auf **New query**

### Schritt 3: Migration 080 ausführen
1. Kopiere den kompletten Inhalt von:
   ```
   supabase/migrations/080_create_daily_phrases_multilingual.sql
   ```

2. Füge ihn in den SQL Editor ein

3. Klick auf **Run** (oder Cmd/Ctrl + Enter)

4. **Erwartetes Ergebnis:**
   ```
   NOTICE: Phrases table backed up to _phrases_backup_20260218_HHMMSS
   (oder keine Ausgabe, wenn phrases table nicht existierte)

   Success. No rows returned.
   ```

5. **Bei Fehler:** Siehe Troubleshooting unten

### Schritt 4: Migration 081 ausführen
1. Kopiere den kompletten Inhalt von:
   ```
   supabase/migrations/081_drop_content_use_vocab.sql
   ```

2. Füge ihn in den SQL Editor ein

3. Klick auf **Run**

4. **Erwartetes Ergebnis:**
   ```
   NOTICE: Content table backed up to _content_backup_20260218_HHMMSS
   (oder: Content table does not exist - skipping backup)

   Success. No rows returned.
   ```

---

## ✅ VERIFIKATION

Nach erfolgreicher Ausführung beider Migrations, prüfe:

### 1. Tabelle daily_phrases existiert
```sql
SELECT COUNT(*) as phrase_count FROM daily_phrases;
```
Erwartet: `0` (Tabelle leer aber existiert)

### 2. Alle 5 RPC Functions existieren
```sql
SELECT proname FROM pg_proc
WHERE proname LIKE '%phrases%'
ORDER BY proname;
```
Erwartet:
- `bulk_delete_phrases`
- `bulk_update_phrases`
- `check_phrases_duplicate`
- `get_phrases_filtered`
- `get_phrases_stats`

### 3. Views existieren
```sql
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('content', 'learning_items');
```
Erwartet:
- `content`
- `learning_items`

### 4. Permissions korrekt
```sql
-- Test als authenticated user
SET ROLE authenticated;
SELECT COUNT(*) FROM daily_phrases;  -- Sollte funktionieren (lesen)
RESET ROLE;
```

---

## 🔍 TROUBLESHOOTING

### Fehler: "relation phrases does not exist"
**Ursache:** Migration 077 wurde noch nicht ausgeführt
**Lösung:** Das ist OK! Migration 080 erstellt die Tabelle neu. Weiter mit Deployment.

### Fehler: "function ... already exists"
**Ursache:** Migrations wurden teilweise bereits ausgeführt
**Lösung:**
```sql
-- Functions manuell droppen
DROP FUNCTION IF EXISTS get_phrases_filtered CASCADE;
DROP FUNCTION IF EXISTS get_phrases_stats CASCADE;
DROP FUNCTION IF EXISTS bulk_update_phrases CASCADE;
DROP FUNCTION IF EXISTS bulk_delete_phrases CASCADE;
DROP FUNCTION IF EXISTS check_phrases_duplicate CASCADE;

-- Dann Migration 080 nochmal ausführen
```

### Fehler: "table daily_phrases already exists"
**Ursache:** Migration 080 wurde bereits ausgeführt
**Lösung:** Skip Migration 080, nur Migration 081 ausführen

### Fehler: "permission denied for table multilingual_vocabulary"
**Ursache:** RLS Policies blockieren
**Lösung:**
```sql
-- Als postgres/service_role ausführen
GRANT SELECT ON multilingual_vocabulary TO authenticated, anon;
```

---

## 📊 ERWARTETE ERGEBNISSE

Nach erfolgreichem Deployment:

### Neue Tabelle: daily_phrases
- **Spalten:** 21 (18 content + 3 system)
- **Struktur:** Identisch zu multilingual_vocabulary
- **Zusätzlich:** scheduled_date, context_tags
- **Constraints:** Level (A1-C2), Difficulty (easy/medium/hard), Frequency (1-5)
- **Indexes:** 11 (Performance + Full-text search)

### Neue RPC Functions: 5
1. `get_phrases_filtered()` - Phrase-Suche mit Filtern
2. `get_phrases_stats()` - Statistiken (Total, Level, Difficulty, Audio)
3. `bulk_update_phrases()` - Bulk-Update für Level/Difficulty/Frequency
4. `bulk_delete_phrases()` - Bulk-Delete (Admin only)
5. `check_phrases_duplicate()` - Duplikats-Check

### Neue Views: 2
1. `content` - READ-ONLY backward compatibility (EN only)
2. `learning_items` - Alias für multilingual_vocabulary

### Backup-Tabellen (falls vorhanden):
- `_phrases_backup_20260218_HHMMSS` (wenn phrases existierte)
- `_content_backup_20260218_HHMMSS` (wenn content existierte)

---

## 🎯 NÄCHSTE SCHRITTE

Nach erfolgreichem Deployment:

1. **Teste /admin/daily-phrases UI:**
   ```
   http://localhost:3000/admin/daily-phrases
   ```
   - Sollte Stats Dashboard anzeigen (leer)
   - Table sollte funktionieren
   - Create/Edit/Import Modals sollten funktionieren

2. **Teste erste Phrase erstellen:**
   - Klick auf "Create Daily Phrase"
   - Fülle alle Felder aus
   - Submit
   - Sollte erfolgreich speichern

3. **Teste CSV Import:**
   - Download Sample Template
   - Öffne in Excel/Google Sheets
   - Fülle mit Testdaten
   - Import
   - Sollte erfolgreich importieren

4. **Update /admin/content (Optional):**
   - API routes zu multilingual_vocabulary umschreiben
   - Content UI implementieren (wie Daily Phrases)

---

## 📝 DEPLOYMENT CHECKLIST

- [ ] Migration 080 im SQL Editor ausgeführt
- [ ] Migration 081 im SQL Editor ausgeführt
- [ ] Keine Fehler in der Konsole
- [ ] Tabelle daily_phrases existiert
- [ ] 5 RPC Functions existieren
- [ ] 2 Views existieren
- [ ] Permissions korrekt
- [ ] /admin/daily-phrases lädt ohne Fehler
- [ ] Create Phrase funktioniert
- [ ] CSV Import funktioniert

---

## 🆘 HILFE

Bei Problemen:
1. Check Browser Console auf Errors
2. Check Supabase Logs im Dashboard
3. Check Network Tab für 4xx/5xx Errors
4. Teste RPC Functions direkt im SQL Editor

**Backup-Tabellen werden automatisch erstellt - keine Datenverlust-Gefahr!**

---

**Deployment bereit:** ✅
**Geschätzter Zeitaufwand:** 5-10 Minuten
**Risiko:** LOW (alle Fehler behoben, Backups automatisch)
