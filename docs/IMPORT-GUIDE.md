# 📦 Vocabulary & Phrases Import Guide

**Last Updated:** 2026-02-15
**Status:** ✅ Production Ready

---

## 🎯 Overview

The Import System allows admins to bulk import vocabulary, phrases, and grammar content into the `learning_items` table using CSV or JSON files.

---

## 🚀 Quick Start

### Step 1: Access Import Page
```
http://localhost:3000/admin/import
```

**Requirements:**
- Must be logged in as admin
- Role: `admin` in users table

### Step 2: Prepare Your Data

Download templates:
- **CSV Template:** `/public/templates/vocabulary-template.csv`
- **JSON Template:** `/public/templates/vocabulary-template.json`

### Step 3: Upload & Import
1. Choose format (CSV or JSON)
2. Select your file
3. Click "Preview Import"
4. Review items and validation
5. Click "Import X Items"
6. Done! ✅

---

## 📋 Data Format

### Required Fields

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `type` | string | vocabulary, phrase, grammar | Content type |
| `english` | string | Any text | English translation |
| `greek` | string | Any text | Greek text |
| `level` | string | A1, A2, B1, B2, C1, C2 | CEFR level |
| `difficulty` | string | easy, medium, hard | Difficulty rating |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `phonetic` | string | Pronunciation guide (e.g., "YAH-soo") |
| `example_en` | string | Example sentence in English |
| `example_gr` | string | Example sentence in Greek |
| `audio_url` | string | URL to audio file |

---

## 📄 CSV Format

### Structure
```csv
type,english,greek,phonetic,example_en,example_gr,level,difficulty,audio_url
vocabulary,Hello,Γεια σου,YAH-soo,Hello friend,Γεια σου φίλε,A1,easy,
```

### Example File
```csv
type,english,greek,phonetic,example_en,example_gr,level,difficulty,audio_url
vocabulary,Hello,Γεια σου,YAH-soo,Hello friend,Γεια σου φίλε,A1,easy,
vocabulary,Water,Νερό,neh-ROH,I want water,Θέλω νερό,A1,easy,
phrase,How are you?,Πώς είσαι;,pos EE-seh,How are you today?,Πώς είσαι σήμερα;,A1,medium,
```

### Rules
- ✅ First row MUST be headers
- ✅ Use comma (`,`) as delimiter
- ✅ Empty fields are allowed (will be `null` in DB)
- ✅ No need to escape Greek characters
- ⚠️ If text contains commas, wrap in quotes: `"Hello, friend"`

---

## 📄 JSON Format

### Structure
```json
[
  {
    "type": "vocabulary",
    "english": "Hello",
    "greek": "Γεια σου",
    "phonetic": "YAH-soo",
    "example_en": "Hello friend",
    "example_gr": "Γεια σου φίλε",
    "level": "A1",
    "difficulty": "easy",
    "audio_url": ""
  }
]
```

### Rules
- ✅ Must be valid JSON array
- ✅ Can be single object or array of objects
- ✅ Empty strings or `null` for optional fields
- ✅ Unicode (Greek characters) supported

---

## ✅ Validation Rules

### Automatic Checks

**1. Required Fields:**
- ❌ Error if `english` or `greek` is empty
- ❌ Error if `type`, `level`, or `difficulty` is invalid

**2. Type Validation:**
- ✅ Valid: `vocabulary`, `phrase`, `grammar`
- ❌ Invalid: anything else

**3. Level Validation:**
- ✅ Valid: `A1`, `A2`, `B1`, `B2`, `C1`, `C2`
- ❌ Invalid: `a1`, `B-1`, `beginner`, etc.

**4. Difficulty Validation:**
- ✅ Valid: `easy`, `medium`, `hard`
- ❌ Invalid: `normal`, `1`, `simple`, etc.

### Error Messages
```
Row 5: Missing required fields (english, greek)
Row 12: Invalid type (must be: vocabulary, phrase, grammar)
Row 18: Invalid level (must be: A1, A2, B1, B2, C1, C2)
```

---

## 🎯 Example Use Cases

### Use Case 1: Import A1 Vocabulary (50 words)

**File:** `a1-vocabulary.csv`
```csv
type,english,greek,phonetic,level,difficulty
vocabulary,Hello,Γεια σου,YAH-soo,A1,easy
vocabulary,Goodbye,Αντίο,an-DEE-o,A1,easy
vocabulary,Yes,Ναι,neh,A1,easy
... (47 more rows)
```

**Steps:**
1. Prepare CSV with 50 rows
2. Upload → Preview → Import
3. Result: 50 items added to `learning_items`

---

### Use Case 2: Import Daily Phrases (20 phrases)

**File:** `daily-phrases.json`
```json
[
  {
    "type": "phrase",
    "english": "Good morning",
    "greek": "Καλημέρα",
    "phonetic": "ka-lee-MEH-ra",
    "example_en": "Good morning everyone",
    "example_gr": "Καλημέρα σε όλους",
    "level": "A1",
    "difficulty": "easy"
  },
  ... (19 more objects)
]
```

**Steps:**
1. Create JSON array with 20 phrases
2. Upload → Preview → Import
3. Result: 20 phrases ready for Daily Phrases module

---

### Use Case 3: Import Grammar Rules (10 rules)

**File:** `grammar-rules.csv`
```csv
type,english,greek,example_en,example_gr,level,difficulty
grammar,Present tense (to be),Ενεστώτας (είμαι),I am a student,Είμαι φοιτητής,A1,medium
grammar,Articles (the),Άρθρα (ο η το),The book,Το βιβλίο,A1,easy
... (8 more rows)
```

---

## 🔄 Import Process Flow

```
1. Select Format (CSV/JSON)
   ↓
2. Choose File
   ↓
3. Click "Preview Import"
   ↓
4. System parses file
   ↓
5. Validation runs
   ↓
6. Preview shows:
   - Number of items
   - First 10 items (table view)
   - Validation errors (if any)
   ↓
7. If valid → "Import X Items" button enabled
   ↓
8. Click Import
   ↓
9. Progress bar shows (0% → 100%)
   ↓
10. Result Summary:
    - Success: X items
    - Errors: Y items
    - Error details (if any)
   ↓
11. Done! Items now in database ✅
```

---

## 🛠️ Advanced Features

### Duplicate Handling

**Current Behavior:**
- Import does NOT check for duplicates
- Same word can be imported multiple times
- Each import creates new DB row

**Future Enhancement:**
```typescript
// Check if item already exists
const { data: existing } = await supabase
  .from('learning_items')
  .select('id')
  .eq('english', item.english)
  .eq('greek', item.greek)
  .single();

if (existing) {
  // Skip or update
} else {
  // Insert new
}
```

---

### Batch Insert (Future)

**Current:** One-by-one insert (slower but safer)
**Future:** Batch insert for speed

```typescript
// Insert 100 items at once
const { error } = await supabase
  .from('learning_items')
  .insert(items); // array of 100 items
```

**Trade-off:**
- Faster (10x speed)
- All-or-nothing (one error = all fail)

---

### Audio URL Generation (Future)

**Idea:** Auto-generate TTS audio URLs

```typescript
// Generate Google TTS URL
const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=el&client=tw-ob&q=${encodeURIComponent(item.greek)}`;
```

---

## 🐛 Troubleshooting

### Error: "Parse error: Invalid CSV"
**Cause:** CSV formatting issue (extra commas, missing quotes)
**Fix:** Open in spreadsheet app → Export as CSV again

---

### Error: "Parse error: Invalid JSON format"
**Cause:** JSON syntax error (missing comma, bracket, etc.)
**Fix:** Use JSON validator (jsonlint.com) → Fix syntax

---

### Error: "Row X: Missing required fields"
**Cause:** `english` or `greek` field is empty
**Fix:** Fill in required fields in that row

---

### Error: "Row X: Invalid type"
**Cause:** Type is not one of: vocabulary, phrase, grammar
**Fix:** Change to valid type (case-sensitive!)

---

### Error: "Row X: Invalid level"
**Cause:** Level is not one of: A1, A2, B1, B2, C1, C2
**Fix:** Use uppercase (A1, not a1)

---

### Import succeeds but items not showing in app
**Cause:** Items need FSRS fields initialized
**Fix:** They'll appear after first review (or manually update `fsrs_due`)

---

## 📊 Database Schema

### `learning_items` Table
```sql
CREATE TABLE learning_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,  -- 'vocabulary', 'phrase', 'grammar'
    english TEXT NOT NULL,
    greek TEXT NOT NULL,
    phonetic TEXT,
    example_en TEXT,
    example_gr TEXT,
    level TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**After Import:**
- Items have `type`, `english`, `greek`, `level`, `difficulty`
- FSRS fields (`fsrs_difficulty`, `fsrs_stability`, etc.) added by migration 052
- Items ready for `get_due_cards_fsrs()` RPC

---

## 🔐 Security

### Admin-Only Access
```typescript
// Page checks user role
if (user?.role !== 'admin') {
    router.push('/login');
    return null;
}
```

### RLS Policies
- Students can SELECT (read) learning_items
- Only admins can INSERT (via import page)

---

## 📈 Performance

**Import Speed:**
- 10 items: ~1-2 seconds
- 100 items: ~10-15 seconds
- 1000 items: ~2-3 minutes

**Optimization:**
- Progress bar updates every item
- Non-blocking UI (can see progress)
- Errors don't stop import (continues to next item)

---

## 🎯 Future Enhancements

### Phase 2 (Planned)
- [ ] **Duplicate detection** - Skip or update existing items
- [ ] **Batch insert** - 10x faster imports
- [ ] **CSV export** - Download existing items
- [ ] **Edit mode** - Modify items before import
- [ ] **Category tags** - Add custom categories
- [ ] **Audio upload** - Upload MP3 files with items

### Phase 3 (Possible)
- [ ] **Google Sheets integration** - Direct import from Sheets
- [ ] **Auto-translation** - Fill missing fields with Google Translate
- [ ] **TTS generation** - Auto-generate audio URLs
- [ ] **Image upload** - Add images to vocabulary
- [ ] **Collaborative editing** - Multiple admins can import

---

## 📝 Quick Reference

**Access:** `/admin/import`
**Formats:** CSV (with headers) or JSON (array)
**Required:** type, english, greek, level, difficulty
**Optional:** phonetic, example_en, example_gr, audio_url

**Types:** vocabulary, phrase, grammar
**Levels:** A1, A2, B1, B2, C1, C2
**Difficulties:** easy, medium, hard

**Templates:**
- `/public/templates/vocabulary-template.csv`
- `/public/templates/vocabulary-template.json`

---

**Need Help?** Check console for detailed error messages or contact admin.

🚀 **Happy Importing!**
