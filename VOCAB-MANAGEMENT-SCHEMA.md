# Vocabulary Management System – Database Schema & CSV Import Guide

**Agent 6: Database-Specialist**
**Datum:** 18. Februar 2026
**Migration:** `078_add_multilingual_vocab_support.sql`

---

## 📋 Übersicht

Das Vokabel-Management-System erweitert die bestehende `content` Tabelle um **mehrsprachige Übersetzungen** (Russisch, Spanisch, Deutsch) und ermöglicht den Import von Vokabeln via CSV.

### Ziel
- **Admin Dashboard:** Lehrer können Vokabeln in 4 Sprachen (EN, RU, ES, DE) hochladen
- **User Experience:** Schüler sehen Vokabeln in ihrer bevorzugten Sprache (`preferred_locale`)
- **CSV Import:** Bulk-Import via Template mit allen Metadaten

---

## 🗄️ Datenbank-Schema

### Bestehende `content` Tabelle (erweitert)

```sql
CREATE TABLE content (
    -- Existing columns
    id UUID PRIMARY KEY,
    type TEXT CHECK (type IN ('vocabulary', 'phrase', 'grammar')),
    english TEXT NOT NULL,              -- Englische Übersetzung
    greek TEXT NOT NULL,                -- Griechisches Wort/Phrase
    level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    phonetic TEXT,                      -- Phonetische Transkription (yá su)
    example_en TEXT,
    example_gr TEXT,
    audio_url TEXT,
    audio_file_path TEXT,               -- Supabase Storage path
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,

    -- NEW: Multilingual translations (Migration 078)
    translation_ru TEXT,                -- Russische Übersetzung
    importance_reason_ru TEXT,          -- Wichtigkeit-Begründung (RU)
    translation_es TEXT,                -- Spanische Übersetzung
    importance_reason_es TEXT,          -- Wichtigkeit-Begründung (ES)
    translation_de TEXT,                -- Deutsche Übersetzung
    importance_reason_de TEXT,          -- Wichtigkeit-Begründung (DE)

    -- NEW: Additional metadata
    frequency INTEGER CHECK (frequency >= 1 AND frequency <= 5), -- Häufigkeit
    phonetic_ipa TEXT,                  -- IPA Transkription (optional)
    sequence_nr INTEGER                 -- Import-Reihenfolge
);
```

### Spalten-Erklärung

| Spalte | Typ | Beschreibung | Pflichtfeld |
|--------|-----|--------------|-------------|
| `greek` | TEXT | Griechisches Wort (Ελληνικά) | ✅ Ja |
| `phonetic` | TEXT | Lautschrift (z.B. "yá su") | ⚠️ Empfohlen |
| `english` | TEXT | Englische Übersetzung | ✅ Ja |
| `translation_ru` | TEXT | Russische Übersetzung (Русский) | ❌ Optional |
| `translation_es` | TEXT | Spanische Übersetzung (Español) | ❌ Optional |
| `translation_de` | TEXT | Deutsche Übersetzung (Deutsch) | ❌ Optional |
| `importance_reason_*` | TEXT | Begründung der Wichtigkeit in jeweiliger Sprache | ❌ Optional |
| `level` | TEXT | CEFR-Level (A1, A2, B1, B2, C1, C2) | ✅ Ja |
| `difficulty` | TEXT | Schwierigkeit (easy, medium, hard) | ✅ Ja |
| `frequency` | INTEGER | Häufigkeit im Alltag (1=selten, 5=sehr häufig) | ⚠️ Empfohlen |
| `sequence_nr` | INTEGER | Nummer aus CSV für Sortierung | ❌ Optional |
| `audio_url` | TEXT | Externe Audio-URL | ❌ Optional |
| `audio_file_path` | TEXT | Supabase Storage Pfad | ❌ Optional |

---

## 📄 CSV Import Template

### Datei-Location
```
/public/templates/vocab-import-template.csv
```

### CSV-Struktur (18 Spalten)

```csv
Nr.,Griechisch (Transkription),Lautschrift (Griechisch),Russische Übersetzung,Wichtigkeit (Begründung) in Russisch,Audio in russisch,Englische Übersetzung,Wichtigkeit (Begründung)in Englisch,Audio in englisch,Spanische Übersetzung,Wichtigkeit (Begründung)in Spanisch,Audio in Spanisch,Deutsche Übersetzung,Wichtigkeit (Begründung)in Deutsch,Audio in deutsch,Level A1,difficulty (easy/middle/hard),Häufigkeit im täglichen Gebrauch (1,2,3,4,5)
```

### Spalten-Mapping

| CSV-Spalte | DB-Spalte | Beispiel |
|------------|-----------|----------|
| Nr. | `sequence_nr` | 1 |
| Griechisch (Transkription) | `greek` | Γεια σου |
| Lautschrift (Griechisch) | `phonetic` | yá su |
| Russische Übersetzung | `translation_ru` | Привет |
| Wichtigkeit (Begründung) in Russisch | `importance_reason_ru` | Основное приветствие... |
| Audio in russisch | `audio_file_path` (RU) | privet.mp3 |
| Englische Übersetzung | `english` | Hello |
| Wichtigkeit (Begründung)in Englisch | `importance_reason_en` | Essential greeting... |
| Audio in englisch | `audio_file_path` (EN) | hello.mp3 |
| Spanische Übersetzung | `translation_es` | Hola |
| Wichtigkeit (Begründung)in Spanisch | `importance_reason_es` | Saludo básico... |
| Audio in Spanisch | `audio_file_path` (ES) | hola.mp3 |
| Deutsche Übersetzung | `translation_de` | Hallo |
| Wichtigkeit (Begründung)in Deutsch | `importance_reason_de` | Grundlegende Begrüßung... |
| Audio in deutsch | `audio_file_path` (DE) | hallo.mp3 |
| Level A1 | `level` | A1 |
| difficulty | `difficulty` | easy |
| Häufigkeit | `frequency` | 5 |

### Beispiel-Zeile

```csv
1,Γεια σου,yá su,Привет,"Основное приветствие, используется ежедневно",privet.mp3,Hello,"Essential greeting, used daily",hello.mp3,Hola,"Saludo básico, usado diariamente",hola.mp3,Hallo,"Grundlegende Begrüßung, täglich verwendet",hallo.mp3,A1,easy,5
```

---

## 🔧 RPC-Funktionen (Supabase)

### 1. `admin_create_vocab()`
**Zweck:** Einzelne Vokabel erstellen (Admin-Only)

```sql
SELECT * FROM admin_create_vocab(
    p_user_id := '...', -- Admin User ID
    p_greek := 'Γεια σου',
    p_phonetic := 'yá su',
    p_translation_ru := 'Привет',
    p_importance_reason_ru := 'Основное приветствие...',
    p_translation_en := 'Hello',
    p_level := 'A1',
    p_difficulty := 'easy',
    p_frequency := 5
);
```

### 2. `get_vocab_for_user()`
**Zweck:** Vokabeln für User holen (in bevorzugter Sprache)

```sql
SELECT * FROM get_vocab_for_user(
    p_user_id := '...',     -- User ID
    p_level := 'A1',        -- Optional: Filter nach Level
    p_difficulty := 'easy', -- Optional: Filter nach Schwierigkeit
    p_limit := 50           -- Max. Anzahl
);
```

**Automatische Übersetzung:**
- Wenn User `preferred_locale = 'ru'` → `translation_ru` wird zurückgegeben
- Wenn User `preferred_locale = 'es'` → `translation_es` wird zurückgegeben
- Fallback: `english` wenn Übersetzung fehlt

### 3. `admin_bulk_import_vocab()`
**Zweck:** Bulk-Import aus CSV (via JSON)

```sql
SELECT * FROM admin_bulk_import_vocab(
    p_user_id := '...', -- Admin User ID
    p_vocab_data := '[
        {
            "sequence_nr": 1,
            "greek": "Γεια σου",
            "phonetic": "yá su",
            "translation_ru": "Привет",
            "english": "Hello",
            "level": "A1",
            "difficulty": "easy",
            "frequency": 5
        },
        ...
    ]'::JSONB
);
```

**Response:**
```json
{
    "success": true,
    "inserted_count": 100,
    "error_count": 2,
    "errors": [
        {
            "sequence_nr": 42,
            "greek": "...",
            "error": "CHECK constraint violated"
        }
    ]
}
```

---

## 📊 Indizes (Performance)

```sql
-- Full-text search für mehrsprachige Suche
CREATE INDEX idx_content_translation_ru ON content USING gin(to_tsvector('russian', translation_ru));
CREATE INDEX idx_content_translation_es ON content USING gin(to_tsvector('spanish', translation_es));
CREATE INDEX idx_content_translation_de ON content USING gin(to_tsvector('german', translation_de));

-- Frequency & Sequence für Sortierung
CREATE INDEX idx_content_frequency ON content(frequency);
CREATE INDEX idx_content_sequence ON content(sequence_nr);
```

---

## ✅ Validierungs-Regeln

### Pflichtfelder
- `greek` (Griechisches Wort)
- `english` (Englische Übersetzung als Fallback)
- `level` (A1, A2, B1, B2, C1, C2)
- `difficulty` (easy, medium, hard)

### CHECK-Constraints
```sql
level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
difficulty IN ('easy', 'medium', 'hard')
frequency >= 1 AND frequency <= 5
```

### Fallback-Logik
1. Wenn `translation_ru` leer → Zeige `english`
2. Wenn `importance_reason_ru` leer → Zeige `importance_reason_en`
3. Wenn `preferred_locale` nicht gesetzt → Default: `en`

---

## 🚀 Workflow: CSV Import

### Schritt 1: CSV vorbereiten
1. Template herunterladen: `/public/templates/vocab-import-template.csv`
2. Excel/Google Sheets öffnen
3. Vokabeln eintragen (mind. Greek + English + Level + Difficulty)
4. Als UTF-8 CSV exportieren

### Schritt 2: CSV → JSON konvertieren
(Frontend-Task: CSV Parser erstellt JSONB für RPC)

```typescript
// Pseudo-Code
const csvData = parseCSV(file);
const jsonData = csvData.map(row => ({
    sequence_nr: parseInt(row['Nr.']),
    greek: row['Griechisch (Transkription)'],
    phonetic: row['Lautschrift (Griechisch)'],
    translation_ru: row['Russische Übersetzung'],
    importance_reason_ru: row['Wichtigkeit (Begründung) in Russisch'],
    english: row['Englische Übersetzung'],
    level: row['Level A1'],
    difficulty: row['difficulty (easy/middle/hard)'],
    frequency: parseInt(row['Häufigkeit im täglichen Gebrauch (1,2,3,4,5)'])
}));
```

### Schritt 3: RPC aufrufen
```typescript
const { data, error } = await supabase.rpc('admin_bulk_import_vocab', {
    p_user_id: currentUser.id,
    p_vocab_data: jsonData
});
```

### Schritt 4: Fehlerbehandlung
```typescript
if (data.error_count > 0) {
    console.error('Import errors:', data.errors);
    // Zeige Fehler-Liste im UI
}
```

---

## 🔐 Row Level Security (RLS)

### Lesen (SELECT)
- **Authentifizierte User:** Können alle Vokabeln lesen
- **Anonym:** Kein Zugriff

### Schreiben (INSERT/UPDATE/DELETE)
- **Nur Admin:** `users.role = 'admin'`
- **Students:** Keine Schreibrechte

---

## 📝 Beispiel-Daten

### Insert via SQL
```sql
INSERT INTO content (
    type, greek, phonetic,
    translation_ru, english, translation_es, translation_de,
    level, difficulty, frequency
) VALUES (
    'vocabulary',
    'Γεια σου',
    'yá su',
    'Привет',
    'Hello',
    'Hola',
    'Hallo',
    'A1',
    'easy',
    5
);
```

### Query für Russisch-sprechenden User
```sql
SELECT
    greek,
    phonetic,
    COALESCE(translation_ru, english) AS translation
FROM content
WHERE type = 'vocabulary' AND level = 'A1'
ORDER BY frequency DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Problem: CSV Import schlägt fehl
**Lösung:**
1. Prüfe Encoding (UTF-8 mit BOM)
2. Prüfe Trennzeichen (`,` nicht `;`)
3. Validiere Level/Difficulty Werte

### Problem: Übersetzung fehlt im Frontend
**Lösung:**
1. Prüfe `users.preferred_locale` Spalte
2. Fallback auf `english` im Query nutzen
3. Logging: `get_vocab_for_user()` Output prüfen

### Problem: Audio nicht abspielbar
**Lösung:**
1. Prüfe Storage Bucket: `audio` existiert?
2. RLS Policy: Public read access?
3. Datei-Pfad korrekt? (z.B. `audio/hello.mp3`)

---

## 📚 Weitere Dokumentation

- **Migration File:** `/supabase/migrations/078_add_multilingual_vocab_support.sql`
- **CSV Template:** `/public/templates/vocab-import-template.csv`
- **Audio Storage:** `/supabase/migrations/20260218_add_audio_storage.sql`
- **Main Schema:** `/supabase/migrations/create_content_table.sql`

---

## ✅ Deliverables Checklist

- [x] CSV Template erstellt (`/public/templates/vocab-import-template.csv`)
- [x] Migration File erstellt (`078_add_multilingual_vocab_support.sql`)
- [x] RPC-Funktionen implementiert
  - [x] `admin_create_vocab()`
  - [x] `get_vocab_for_user()`
  - [x] `admin_bulk_import_vocab()`
- [x] Indizes für Performance erstellt
- [x] Dokumentation (`VOCAB-MANAGEMENT-SCHEMA.md`)
- [x] Beispiel-Daten im CSV Template

---

## 🎯 Nächste Schritte (für andere Agents)

1. **Frontend (Agent 1/2):**
   - CSV Upload UI erstellen
   - CSV Parser implementieren (CSV → JSONB)
   - Validierung im Frontend

2. **Backend (Agent 2):**
   - API Route für CSV Upload: `/api/admin/vocab/import`
   - Audio-Upload zu Supabase Storage

3. **Testing (Agent 3):**
   - E2E Test: CSV Upload → Import → Anzeige
   - Unit Tests für RPC-Funktionen
   - Performance Test mit 1000+ Vokabeln

---

**Agent 6 Status:** ✅ **FERTIG**
**Datum:** 18. Februar 2026, 11:15 CET
**Review by:** Admin
