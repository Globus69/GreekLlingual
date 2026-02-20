# Vocabulary CSV Format Reference

**Created:** 2026-02-18
**Purpose:** Standard CSV format for ALL admin systems
**Status:** ✅ MANDATORY STANDARD

---

## 📋 Column Order (MUST BE EXACT)

**18 columns in this EXACT order:**

```
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
```

---

## 📊 Column Definitions

| # | Column Name | Data Type | Required | Description | Example |
|---|-------------|-----------|----------|-------------|---------|
| 1 | `nr` | INTEGER | Optional | Sequential number for ordering | 1, 2, 3... |
| 2 | `greek_transcription` | TEXT | **REQUIRED** | Greek text in Latin script | Γεια σου |
| 3 | `greek_phonetic` | TEXT | Optional | Phonetic pronunciation | yá su |
| 4 | `en_translation` | TEXT | Optional | English translation | Hello |
| 5 | `en_importance_reason` | TEXT | Optional | Why word is important (EN) | Essential greeting used daily |
| 6 | `en_audio_url` | TEXT | Optional | English audio file URL or path | /audio/en/hello.mp3 |
| 7 | `de_translation` | TEXT | Optional | German translation | Hallo |
| 8 | `de_importance_reason` | TEXT | Optional | Why word is important (DE) | Grundlegende Begrüßung |
| 9 | `de_audio_url` | TEXT | Optional | German audio file URL or path | /audio/de/hallo.mp3 |
| 10 | `es_translation` | TEXT | Optional | Spanish translation | Hola |
| 11 | `es_importance_reason` | TEXT | Optional | Why word is important (ES) | Saludo básico usado diariamente |
| 12 | `es_audio_url` | TEXT | Optional | Spanish audio file URL or path | /audio/es/hola.mp3 |
| 13 | `ru_translation` | TEXT | Optional | Russian translation | Привет |
| 14 | `ru_importance_reason` | TEXT | Optional | Why word is important (RU) | Основное приветствие |
| 15 | `ru_audio_url` | TEXT | Optional | Russian audio file URL or path | /audio/ru/privet.mp3 |
| 16 | `level` | TEXT | **REQUIRED** | CEFR level (A1, A2, B1, B2, C1, C2) | A1 |
| 17 | `difficulty` | TEXT | **REQUIRED** | Difficulty (easy, medium, hard) | easy |
| 18 | `frequency` | INTEGER | **REQUIRED** | Importance rating (1-5) | 5 |

---

## ✅ Required Fields

Only 4 fields are REQUIRED:
1. `greek_transcription` - Greek text (cannot be empty)
2. `level` - Must be one of: A1, A2, B1, B2, C1, C2
3. `difficulty` - Must be one of: easy, medium, hard
4. `frequency` - Must be integer between 1 and 5

All other fields are OPTIONAL but recommended for multilingual support.

---

## 🌍 Language Fields Pattern

Each language has 3 fields in this order:
1. `{lang}_translation` - The translated text
2. `{lang}_importance_reason` - Why this word/phrase is important
3. `{lang}_audio_url` - Audio file URL or path

**Language codes:**
- `en` - English (FIRST)
- `de` - German (SECOND)
- `es` - Spanish (THIRD)
- `ru` - Russian (FOURTH)

**⚠️ IMPORTANT:** English comes FIRST, NOT Russian!

---

## 📝 Example Row (Complete)

```csv
1,Γεια σου,yá su,Hello,Essential greeting used daily in informal settings,,Hallo,Grundlegende Begrüßung für informelle Situationen,,Hola,Saludo básico usado diariamente en contextos informales,,Привет,Основное приветствие для неформальных ситуаций,,A1,easy,5
```

**Breakdown:**
- Nr: 1
- Greek: Γεια σου (yá su)
- EN: Hello (Essential greeting...)
- DE: Hallo (Grundlegende Begrüßung...)
- ES: Hola (Saludo básico...)
- RU: Привет (Основное приветствие...)
- Level: A1
- Difficulty: easy
- Frequency: 5 stars

---

## 📝 Example Row (Minimal)

```csv
,Γεια σου,yá su,Hello,,,,,,,,,,,,,A1,easy,5
```

**Breakdown:**
- Nr: (empty - will auto-generate)
- Greek: Γεια σου (yá su)
- EN: Hello
- All other translations: empty
- Level: A1
- Difficulty: easy
- Frequency: 5

**Note:** Commas are required even for empty fields!

---

## ⚠️ Common Mistakes

### ❌ WRONG - Russian First

```csv
nr,greek_transcription,greek_phonetic,ru_translation,ru_importance_reason,ru_audio_url,en_translation,...
```

**This is WRONG!** English must come first.

### ✅ CORRECT - English First

```csv
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,...
```

---

### ❌ WRONG - Missing Commas

```csv
1,Γεια σου,yá su,Hello,A1,easy,5
```

**This is WRONG!** Missing columns for translations and reasons.

### ✅ CORRECT - All Commas Present

```csv
1,Γεια σου,yá su,Hello,,,,,,,,,,,,,A1,easy,5
```

---

### ❌ WRONG - Invalid Level

```csv
1,Γεια σου,yá su,Hello,,,,,,,,,,,,,Beginner,easy,5
```

**This is WRONG!** Level must be: A1, A2, B1, B2, C1, or C2

### ✅ CORRECT - Valid Level

```csv
1,Γεια σου,yá su,Hello,,,,,,,,,,,,,A1,easy,5
```

---

### ❌ WRONG - Invalid Frequency

```csv
1,Γεια σου,yá su,Hello,,,,,,,,,,,,,A1,easy,10
```

**This is WRONG!** Frequency must be between 1 and 5

### ✅ CORRECT - Valid Frequency

```csv
1,Γεια σου,yá su,Hello,,,,,,,,,,,,,A1,easy,5
```

---

## 🔢 Frequency Scale

| Value | Meaning | Usage |
|-------|---------|-------|
| 5 ⭐⭐⭐⭐⭐ | Very Common | Used daily, essential words |
| 4 ⭐⭐⭐⭐ | Common | Used frequently, important words |
| 3 ⭐⭐⭐ | Moderate | Used regularly, useful words |
| 2 ⭐⭐ | Uncommon | Used occasionally, supplementary words |
| 1 ⭐ | Rare | Used rarely, specialized words |

---

## 📏 Character Limits

| Field | Max Length | Notes |
|-------|------------|-------|
| `greek_transcription` | 200 chars | For vocab; 500 for phrases |
| `greek_phonetic` | 200 chars | |
| `*_translation` | 500 chars | |
| `*_importance_reason` | 1000 chars | |
| `*_audio_url` | 255 chars | |

---

## 🔐 Special Characters

### Allowed:
- Greek characters: Γεια σου, Καλημέρα
- Latin characters: yá su, ka-li-MÉ-ra
- Accents: é, á, ó, í, ú
- Punctuation: , . ! ? - ( )
- Spaces

### Requires Escaping (in CSV):
- Commas inside text: Use quotes → `"Hello, friend"`
- Quotes inside text: Double them → `"He said ""Hello"""`
- Line breaks: Use `\n` or avoid

---

## 📚 File Naming Convention

### Templates (in `public/templates/`):
- `Import-Vokabeln-{Level}-Vollständig.csv` - Complete vocab with all languages
- `Import-Vokabeln-{Level}-Beispiel.csv` - Example vocab with some entries
- `Import-Phrases-{Level}-Sample.csv` - Sample phrases
- `Import-Content-{Level}-Sample.csv` - Sample content

### User Uploads:
- Any name accepted
- Recommended: `{type}_{level}_{date}.csv`
- Example: `vocab_A1_2026-02-18.csv`

---

## 🎯 Usage

### For Vocabulary System:
- Table: `multilingual_vocabulary`
- Template: `Import-Vokabeln-A1-Vollständig.csv`
- Import endpoint: `/api/admin/vocab/import`

### For Phrases System:
- Table: `daily_phrases`
- Template: `Import-Phrases-A2-Sample.csv`
- Import endpoint: `/api/admin/daily-phrases/import`

### For Content System:
- Table: `multilingual_vocabulary` (uses same table as vocab)
- Template: `Import-Content-A1-Sample.csv`
- Import endpoint: `/api/admin/content/import`

**Note:** All 3 systems use IDENTICAL CSV format!

---

## ✅ Validation Rules

### On Import:
1. Check column count = 18
2. Check column order matches exactly
3. Validate `greek_transcription` not empty
4. Validate `level` in [A1, A2, B1, B2, C1, C2]
5. Validate `difficulty` in [easy, medium, hard]
6. Validate `frequency` in [1, 2, 3, 4, 5]
7. Check for duplicates: same `greek_transcription` + `level`

### On Duplicate:
- **Append mode:** Skip row, continue
- **Overwrite mode:** Replace existing entry

---

## 🛠️ Tools

### Create CSV:
- Excel/LibreOffice Calc - Export as CSV (UTF-8)
- Google Sheets - Download as CSV
- Text editor - Manual creation

### Validate CSV:
- Import preview in admin interface
- Check for errors before committing

### Export CSV:
- Use export button in admin interface
- Downloads current table as CSV
- Same format for re-import

---

## 📋 Quick Reference

**Minimal Valid Row:**
```csv
,Γεια σου,yá su,Hello,,,,,,,,,,,,,A1,easy,5
```

**Complete Valid Row:**
```csv
1,Γεια σου,yá su,Hello,Essential greeting used daily,,Hallo,Grundlegende Begrüßung,,Hola,Saludo básico usado,,Привет,Основное приветствие,,A1,easy,5
```

**Header Row (Copy-Paste Ready):**
```csv
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
```

---

## ⚠️ CRITICAL RULES

1. **NEVER change column order** - System expects exact order
2. **ALWAYS include all 18 columns** - Even if empty
3. **ALWAYS start with EN language** - Not RU!
4. **NEVER skip commas** - Empty fields need commas
5. **ALWAYS use UTF-8 encoding** - For Greek characters

**This format is MANDATORY for ALL admin systems.**

**Deviations will cause import failures.**
