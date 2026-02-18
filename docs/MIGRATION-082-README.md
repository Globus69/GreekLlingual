# 🗄️ Migration 082: Content → Multilingual

**Datum:** 18. Februar 2026
**Zweck:** Bilingual → Multilingual (EN, DE, ES, RU)
**Status:** ✅ Bereit zur Ausführung

---

## 📋 ÜBERSICHT

### Was wird gemacht:

**ALT (bilingual):**
```
content table:
- english (Text)
- greek (Text)
- type, level, difficulty
- phonetic, audio_url, examples
```

**NEU (multilingual):**
```
multilingual_content table:
- greek_transcription + greek_phonetic
- en_translation + en_importance_reason + en_audio_url
- de_translation + de_importance_reason + de_audio_url
- es_translation + es_importance_reason + es_audio_url
- ru_translation + ru_importance_reason + ru_audio_url
- level, difficulty, frequency
- type (vocabulary, phrase, grammar)
```

---

## 🎯 ZIELE

1. ✅ CSV_Vorlage.csv passt perfekt zur Datenbank
2. ✅ VocabModal Dialog-Struktur wird identisch
3. ✅ 4 Sprachen unterstützt (EN, DE, ES, RU)
4. ✅ Bestehende Daten werden migriert (kein Datenverlust)
5. ✅ Rollback möglich bei Problemen

---

## 📂 ERSTELLTE DATEIEN

### 1. `082_migrate_content_to_multilingual.sql` (Hauptmigration)
**Größe:** ~450 Zeilen
**Funktionen:**
- ✅ Backup erstellen (content_backup_20260218)
- ✅ Neue Table erstellen (multilingual_content)
- ✅ 8 Indexes für Performance
- ✅ Daten migrieren (bilingual → multilingual)
- ✅ 2 Helper Functions (duplicate check, statistics)
- ✅ 4 RLS Policies (admin only)
- ✅ Alte Table umbenennen (content_old_deprecated_20260218)
- ✅ Trigger für updated_at

**Was passiert mit Daten:**
- English → en_translation ✅
- Greek → greek_transcription ✅
- Audio → en_audio_url ✅
- German → leer (muss später importiert werden)
- Spanish → leer (muss später importiert werden)
- Russian → leer (muss später importiert werden)

### 2. `082_rollback.sql` (Rollback bei Fehler)
**Größe:** ~80 Zeilen
**Funktionen:**
- ❌ Löscht multilingual_content table
- ❌ Löscht Functions
- ✅ Stellt alte content table wieder her
- ✅ Stellt Permissions wieder her

**Wann benutzen:**
- Migration fehlgeschlagen
- Probleme entdeckt
- Zurück zur alten Version

### 3. `082_verify.sql` (Verification)
**Größe:** ~250 Zeilen
**Funktionen:**
- ✅ Prüft ob Tables existieren
- ✅ Prüft Column-Struktur
- ✅ Prüft Indexes (8 expected)
- ✅ Prüft Data Migration (Anzahl Rows)
- ✅ Prüft Translation Coverage (EN, DE, ES, RU)
- ✅ Prüft Functions (2 expected)
- ✅ Prüft RLS Policies (4 expected)
- ✅ Zeigt Sample Data
- ✅ Zeigt Statistics

---

## ⚙️ ENTSCHEIDUNGEN GETROFFEN

### ✅ Audio URL: Pro Sprache (Option B)
- Wie VocabModal (identisch)
- Jede Sprache hat eigenes Audio
- Mehr Flexibilität

### ✅ Type-Feld: Behalten (Option A)
- Content bleibt flexibel
- Kann vocabulary, phrase, grammar sein
- Ein zusätzliches Feld

### ✅ Backup: 1 Woche behalten (Option B)
- Sicherheit für Rollback
- Alte Tables:
  - `content_backup_20260218` (Backup-Copy)
  - `content_old_deprecated_20260218` (Renamed original)
- Nach 1 Woche manuell löschen

---

## 🚀 AUSFÜHRUNGS-ANLEITUNG

### Option A: Via Supabase Dashboard

1. **Öffne:** https://supabase.com/dashboard
2. **Gehe zu:** SQL Editor
3. **Neue Query:**
   - Copy/Paste: `082_migrate_content_to_multilingual.sql`
   - **RUN** Button klicken
4. **Warten:** ~10-30 Sekunden (je nach Datenmenge)
5. **Check Output:** Sollte "✅ MIGRATION 082 COMPLETE" zeigen

### Option B: Via psql (Command Line)

```bash
# Navigate to project
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard

# Run migration
psql $DATABASE_URL -f database/migrations/082_migrate_content_to_multilingual.sql

# Verify
psql $DATABASE_URL -f database/migrations/082_verify.sql
```

### Option C: Via Node Script

```bash
# Create run script
node scripts/run-migration-082.js
```

---

## ✅ VERIFICATION CHECKLIST

Nach der Migration ausführen:

```bash
# Run verification
psql $DATABASE_URL -f database/migrations/082_verify.sql
```

**Erwartete Ausgabe:**
```
✅ TABLE CHECK: multilingual_content EXISTS
✅ COLUMN STRUCTURE: All expected columns present (22)
✅ INDEXES: Total indexes >= 8
✅ DATA MIGRATION: All data migrated (100%)
✅ TRANSLATION COVERAGE:
   English: 100%
   German: 0% (expected - must be imported)
   Spanish: 0% (expected - must be imported)
   Russian: 0% (expected - must be imported)
✅ FUNCTIONS: 2 functions exist
✅ ROW LEVEL SECURITY: RLS enabled, 4 policies
✅ VERIFICATION PASSED
```

---

## 🔄 ROLLBACK (Falls nötig)

### Wenn Migration fehlschlägt:

```bash
# Run rollback
psql $DATABASE_URL -f database/migrations/082_rollback.sql
```

**Was passiert:**
- ❌ multilingual_content table gelöscht
- ✅ content table wiederhergestellt
- ✅ Alte Struktur funktioniert wieder

### Gründe für Rollback:
- Migration schlägt fehl
- Daten fehlen
- Falsche Struktur
- Andere kritische Fehler

---

## 📊 ERWARTETE ERGEBNISSE

### Vorher:
```sql
SELECT COUNT(*) FROM content;
-- Result: z.B. 150 rows

SELECT * FROM content LIMIT 1;
-- Columns: id, type, level, difficulty, english, greek,
--          phonetic, audio_url, example_en, example_gr
```

### Nachher:
```sql
SELECT COUNT(*) FROM multilingual_content;
-- Result: 150 rows (gleiche Anzahl)

SELECT * FROM multilingual_content LIMIT 1;
-- Columns: id, nr, type, greek_transcription, greek_phonetic,
--          en_translation, en_importance_reason, en_audio_url,
--          de_translation, de_importance_reason, de_audio_url,
--          es_translation, es_importance_reason, es_audio_url,
--          ru_translation, ru_importance_reason, ru_audio_url,
--          level, difficulty, frequency
```

### Backups:
```sql
SELECT COUNT(*) FROM content_backup_20260218;
-- Result: 150 rows (Backup-Copy)

SELECT COUNT(*) FROM content_old_deprecated_20260218;
-- Result: 150 rows (Renamed original)
```

---

## ⏱️ ZEITPLAN

### Ausführung:
- Migration: 10-30 Sekunden
- Verification: 5 Sekunden
- **Total:** ~30-40 Sekunden

### Nach Migration:
1. **Sofort:** TypeScript types updaten (30 min)
2. **Sofort:** API functions updaten (2 hours)
3. **Sofort:** ContentModal updaten (2 hours)
4. **Später:** CSV_Vorlage.csv importieren (DE, ES, RU füllen)
5. **Nach 1 Woche:** Alte Tables löschen

---

## 🚨 WICHTIGE HINWEISE

### ⚠️ BREAKING CHANGES:
- ✅ Alte `content` table wird zu `content_old_deprecated_20260218`
- ✅ Neue `multilingual_content` table ist aktiv
- ✅ API muss angepasst werden (sonst funktioniert /admin/content nicht)
- ✅ TypeScript types müssen angepasst werden

### ✅ SICHERHEIT:
- Backup wird automatisch erstellt
- Rollback jederzeit möglich
- Keine Daten gehen verloren
- RLS policies sind aktiv

### 📝 TODO NACH MIGRATION:
1. TypeScript types updaten
2. API functions updaten
3. ContentModal component updaten
4. /admin/content page updaten
5. CSV_Vorlage.csv importieren
6. Testen: Create, Read, Update, Delete
7. Testen: Import/Export

---

## 🎯 NÄCHSTE SCHRITTE

### JETZT (vor dem Ausführen):
1. ✅ Dateien erstellt
2. ✅ Dokumentation gelesen
3. ⏸️ **WARTE AUF USER-FREIGABE**

### NACH FREIGABE:
1. Migration ausführen
2. Verification ausführen
3. Bei Erfolg: Code-Updates beginnen
4. Bei Fehler: Rollback + Debug

---

## ❓ FRAGEN?

**Bereit zum Ausführen?**
- ✅ Alle SQL-Files sind erstellt
- ✅ Rollback-Plan vorhanden
- ✅ Verification-Script bereit
- ✅ Backup-Strategie klar

**Soll ich die Migration JETZT ausführen?**
- Option 1: Ja, ausführen! (ich führe aus)
- Option 2: Zeig mir erst den SQL-Code
- Option 3: Ich mache es selbst (manuell)

Was möchtest du? 🚀
