# CSV TEMPLATES ANALYSIS & VALIDATION REPORT

**Datum:** 18. Februar 2026
**Agent:** CSV Import/Export Spezialist (Agent 13)
**Status:** COMPLETE

---

## 1. ZUSAMMENFASSUNG

### Template-Dateien (Stand: 18. Februar 2026):

**Aktive Templates:**
1. `/public/templates/Vorlage-Vokabeln-Vollständig.csv` ✅ **Vollständiges Schema**
2. `/public/templates/Vorlage-Vokabeln-Schnell.csv` ✅ **Minimal-Schema**
3. `/public/templates/Import-Vokabeln-A1-Vollständig.csv` ✅ **50 A1 Vokabeln**
4. `/public/templates/Import-Vokabeln-A1-Beispiel.csv` ✅ **10 A1 Beispiele**
5. `/public/templates/Import-Vokabeln-A2-Vollständig.csv` ✅ **50 A2 Vokabeln**
6. `/public/templates/Import-Vokabeln-A2-Beispiel.csv` ✅ **10 A2 Beispiele**
7. `/public/templates/Import-Vokabeln-B1-Vollständig.csv` ✅ **25 B1 Vokabeln**

**Veraltete Templates (DEPRECATED):**
- `DEPRECATED-vocab-import-template-v2.csv` - Duplikat
- `DEPRECATED-vocabulary-template.csv` - Altes Schema

### Kritische Probleme:
- **Header-Namen stimmen NICHT mit DB-Schema überein**
- **"middle" statt "medium" für difficulty**
- **Inkonsistente Spalten-Reihenfolge**
- **Fehlende Spalten in vocabulary-template.csv**

---

## 2. DATABASE SCHEMA ANALYSE

### Table: `multilingual_vocabulary`

**Pflichtfelder:**
```sql
greek_transcription TEXT NOT NULL
level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'))
difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard'))
frequency INTEGER NOT NULL DEFAULT 3 CHECK (frequency >= 1 AND frequency <= 5)
```

**Optionale Felder:**
```sql
nr INTEGER
greek_phonetic TEXT

-- English
en_translation TEXT
en_importance_reason TEXT
en_audio_url TEXT

-- German
de_translation TEXT
de_importance_reason TEXT
de_audio_url TEXT

-- Spanish
es_translation TEXT
es_importance_reason TEXT
es_audio_url TEXT

-- Russian
ru_translation TEXT
ru_importance_reason TEXT
ru_audio_url TEXT
```

**System-Felder (automatisch):**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
created_by UUID REFERENCES public.users(id)
```

---

## 3. API IMPORT LOGIC ANALYSE

### Datei: `/src/app/api/admin/vocab/import/route.ts`

**CSV Parsing:**
- Verwendet `Papa.parse()` mit `header: true`
- Erwartet CSV-Header die EXAKT den DB-Spalten entsprechen

**Validierung (aus `/src/lib/supabase/vocab.ts`):**

```typescript
// REQUIRED
greek_transcription: string (nicht leer)
level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
difficulty: 'easy' | 'medium' | 'hard'  // ⚠️ NICHT "middle"!

// OPTIONAL
frequency: 1 | 2 | 3 | 4 | 5 (number)
nr: number
greek_phonetic: string

// Translations (alle optional)
en_translation, en_importance_reason, en_audio_url
de_translation, de_importance_reason, de_audio_url
es_translation, es_importance_reason, es_audio_url
ru_translation, ru_importance_reason, ru_audio_url
```

**Sanitize-Funktion:**
- Trimmt Whitespace
- Konvertiert leere Strings zu undefined
- Konvertiert frequency/nr zu Number

**Duplicate Check (Append Mode):**
- Prüft auf: `greek_transcription + level` Kombination
- ⚠️ **ABER:** Nutzt falsche Tabelle `vocabulary_content` statt `multilingual_vocabulary`!

---

## 4. BESTEHENDE TEMPLATES - DETAILANALYSE

### ❌ **Template A: `vocabulary-template.csv`**

**Header:**
```
type,english,greek,phonetic,example_en,example_gr,level,difficulty,audio_url
```

**Probleme:**
1. ❌ Spalte `type` existiert NICHT in DB
2. ❌ `english` sollte `en_translation` sein
3. ❌ `greek` sollte `greek_transcription` sein
4. ❌ `phonetic` sollte `greek_phonetic` sein
5. ❌ `example_en`, `example_gr` existieren NICHT in DB
6. ❌ `audio_url` ist mehrdeutig (welche Sprache?)
7. ❌ Fehlt: frequency, alle anderen Sprachen (DE, ES, RU)
8. ❌ Fehlt: importance_reason für jede Sprache

**Verdict:** KOMPLETT FALSCH - Muss neu erstellt werden

---

### ⚠️ **Template B: `vocab-a1-sample.csv`**

**Header (User-Format):**
```
Nr.,Griechisch (Transkription),Lautschrift (Griechisch),
Russische Übersetzung,Wichtigkeit (Begründung) in Russisch,Audio in russisch,
Englische Übersetzung,Wichtigkeit (Begründung)in Englisch,Audio in englisch,
Spanische Übersetzung,Wichtigkeit (Begründung)in Spanisch,Audio in Spanisch,
Deutsche Übersetzung,Wichtigkeit (Begründung)in Deutsch,Audio in deutsch,
Level A1,difficulty (easy/middle/hard),Häufigkeit im täglichen Gebrauch (1,2,3,4,5)
```

**Probleme:**
1. ❌ Header sind **Deutsche Beschreibungen**, NICHT DB-Spalten-Namen
2. ❌ `Level A1` sollte nur `level` sein (Wert = "A1")
3. ❌ `difficulty (easy/middle/hard)` sollte `difficulty` sein
4. ⚠️ `middle` muss zu `medium` gemappt werden
5. ❌ API erwartet englische Spalten-Namen wie `en_translation`, NICHT "Englische Übersetzung"

**Daten-Qualität:**
- ✅ Enthält 10 Einträge mit allen 4 Sprachen
- ✅ Realistische Griechische Wörter
- ⚠️ Manche haben "middle" statt "medium"
- ⚠️ Level-Spalte enthält immer "A1" (korrekt für A1-Template)

**Verdict:** INHALT GUT, ABER HEADER KOMPLETT FALSCH

---

### ⚠️ **Template C: `vocab-a2-sample.csv`**

**Gleiche Probleme wie Template B:**
- ❌ Deutsche Header statt DB-Spalten
- ❌ "middle" statt "medium"
- ✅ Daten-Qualität gut (10 A2-Level Einträge)

**Verdict:** INHALT GUT, ABER HEADER KOMPLETT FALSCH

---

## 5. HEADER-MAPPING-TABELLE

### User-Format → DB-Schema Mapping:

| User-Header (Deutsch) | DB-Spalte (erforderlich) | Typ | Pflicht |
|---|---|---|---|
| Nr. | `nr` | integer | Nein |
| Griechisch (Transkription) | `greek_transcription` | text | **JA** |
| Lautschrift (Griechisch) | `greek_phonetic` | text | Nein |
| Russische Übersetzung | `ru_translation` | text | Nein |
| Wichtigkeit (Begründung) in Russisch | `ru_importance_reason` | text | Nein |
| Audio in russisch | `ru_audio_url` | text | Nein |
| Englische Übersetzung | `en_translation` | text | Nein |
| Wichtigkeit (Begründung) in Englisch | `en_importance_reason` | text | Nein |
| Audio in englisch | `en_audio_url` | text | Nein |
| Spanische Übersetzung | `es_translation` | text | Nein |
| Wichtigkeit (Begründung) in Spanisch | `es_importance_reason` | text | Nein |
| Audio in Spanisch | `es_audio_url` | text | Nein |
| Deutsche Übersetzung | `de_translation` | text | Nein |
| Wichtigkeit (Begründung) in Deutsch | `de_importance_reason` | text | Nein |
| Audio in deutsch | `de_audio_url` | text | Nein |
| Level A1 | `level` | text | **JA** |
| difficulty (easy/middle/hard) | `difficulty` | text | **JA** |
| Häufigkeit im täglichen Gebrauch (1,2,3,4,5) | `frequency` | integer | **JA** (default: 3) |

---

## 6. VALIDATION RULES

### Pflichtfelder:
```
✅ greek_transcription: nicht leer
✅ level: A1 | A2 | B1 | B2 | C1 | C2
✅ difficulty: easy | medium | hard (NICHT middle!)
✅ frequency: 1 | 2 | 3 | 4 | 5
```

### Optionale Felder:
```
✓ nr: positive integer
✓ greek_phonetic: string (IPA/phonetisch)
✓ *_translation: string (mindestens 1 Sprache empfohlen)
✓ *_importance_reason: string
✓ *_audio_url: string (URL oder leer)
```

### Constraints:
```
🔒 UNIQUE (greek_transcription, level) - keine Duplikate
🔒 frequency: 1-5 (DB Check Constraint)
🔒 level: nur A1-C2 (DB Check Constraint)
🔒 difficulty: nur easy/medium/hard (DB Check Constraint)
```

---

## 7. HÄUFIGE FEHLER

### Import-Fehler die auftreten werden:

1. **"Column 'Griechisch (Transkription)' doesn't exist"**
   - Ursache: Deutsche Header statt DB-Spalten
   - Lösung: Header zu `greek_transcription` ändern

2. **"difficulty must be one of: easy, medium, hard"**
   - Ursache: CSV enthält "middle"
   - Lösung: "middle" → "medium" ersetzen

3. **"greek_transcription is required"**
   - Ursache: Leere Zeile oder fehlender Wert
   - Lösung: Alle Zeilen müssen Greek Text haben

4. **"Duplicate entry for greek_transcription + level"**
   - Ursache: Wort existiert schon für dieses Level
   - Lösung: Append-Mode überspringt automatisch, oder Overwrite-Mode nutzen

5. **"frequency must be between 1 and 5"**
   - Ursache: Ungültiger Wert (0, 6, leer)
   - Lösung: Nur Zahlen 1-5 verwenden

---

## 8. CSV ENCODING & DIALEKT

### Empfohlene Einstellungen:

```
Character Encoding: UTF-8 with BOM
Delimiter: , (Komma)
Quote Character: " (doppelte Anführungszeichen)
Escape Character: "" (doppelte Quotes) oder \
Line Terminator: \r\n (Windows) oder \n (Unix)
Header Row: Required (Zeile 1)
```

### Excel-Kompatibilität:
- UTF-8 BOM ist notwendig damit Excel griechische Zeichen korrekt anzeigt
- Komma-Delimiter funktioniert in deutschen Excel-Versionen
- Alternative: Semikolon (;) für deutsche Excel-Versionen

---

## 9. EMPFEHLUNGEN

### Sofort-Maßnahmen:

1. ✅ **Neue Templates mit korrekten Headern erstellen**
   - DB-Spalten-Namen verwenden
   - UTF-8 BOM für Excel
   - Beispiel-Daten mit korrektem "medium" (nicht "middle")

2. ⚠️ **Bug in `vocab.ts` fixen:**
   - Zeile 122: `vocabulary_content` → `multilingual_vocabulary`
   - Duplicate-Check funktioniert sonst nicht!

3. ✅ **Import-Guide erstellen**
   - Schritt-für-Schritt Anleitung
   - Häufige Fehler dokumentieren
   - Screenshots hinzufügen

4. ✅ **Validation Script (Optional)**
   - Node.js Script zum Pre-Validation von CSV-Dateien
   - Gibt Fehler aus bevor Upload

### Langfristige Verbesserungen:

1. **CSV Header Mapping im Backend**
   - Akzeptiere beide Formate (User-Format + DB-Format)
   - Automatisches Mapping von deutschen Headern

2. **"middle" → "medium" Auto-Conversion**
   - Im sanitizeEntry() hinzufügen
   - User-freundlicher

3. **Frontend CSV Validator**
   - Live-Validation vor dem Upload
   - Zeigt Fehler sofort an

---

## 10. FAZIT

### Status nach Umbenennung (18. Februar 2026):

| Neuer Name | Alter Name | Status |
|---|---|---|
| `Vorlage-Vokabeln-Vollständig.csv` | `vocab-import-template.csv` | ✅ Umbenannt |
| `Vorlage-Vokabeln-Schnell.csv` | `vocab-quick-import.csv` | ✅ Umbenannt |
| `Import-Vokabeln-A1-Vollständig.csv` | `vocab-a1-complete.csv` | ✅ Umbenannt |
| `Import-Vokabeln-A1-Beispiel.csv` | `vocab-a1-sample.csv` | ✅ Umbenannt |
| `Import-Vokabeln-A2-Vollständig.csv` | `vocab-a2-complete.csv` | ✅ Umbenannt |
| `Import-Vokabeln-A2-Beispiel.csv` | `vocab-a2-sample.csv` | ✅ Umbenannt |
| `Import-Vokabeln-B1-Vollständig.csv` | `vocab-b1-sample.csv` | ✅ Umbenannt |
| `DEPRECATED-vocab-import-template-v2.csv` | `vocab-import-template-v2.csv` | ⚠️ Als veraltet markiert |
| `DEPRECATED-vocabulary-template.csv` | `vocabulary-template.csv` | ⚠️ Als veraltet markiert |

### Naming Convention:

```
[Funktion]-[Type]-[Level]-[Zusatz].csv

Funktion: Import, Vorlage, Beispiel
Type: Vokabeln, Phrasen, Grammatik
Level: A1, A2, B1, B2, C1, C2 (optional)
Zusatz: Vollständig, Schnell, Beispiel (optional)
```

**Alle Template-Namen jetzt auf DEUTSCH** (user-facing)

---

**Status:** Umbenennung abgeschlossen. Siehe `/public/templates/README.md` für vollständige Dokumentation.
