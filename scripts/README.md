# Scripts

Utility scripts for development, testing, and CSV validation.

## Setup

Most scripts require environment variables to be set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Available Scripts

### `create-test-pin-users.js`

Creates 5 test users with 4-digit PINs for development.

**Usage:**
```bash
node scripts/create-test-pin-users.js
```

**Test Users:**
- Anna Meier (PIN: 3741)
- Lukas Braun (PIN: 8192)
- Sofia Müller (PIN: 5624)
- Dimitris Papadopoulos (PIN: 7358)
- Elena Schmidt (PIN: 9103)

---

### `validate-csv.js`

**Purpose:** Validates vocabulary CSV files before import.

**Usage:**
```bash
node scripts/validate-csv.js <path-to-csv-file>
```

**Examples:**
```bash
# Validate A1 template
node scripts/validate-csv.js ./public/templates/vocab-a1-complete.csv

# Validate custom CSV
node scripts/validate-csv.js ~/Downloads/my-vocab.csv
```

**Features:**
- ✅ Checks required columns (greek_transcription, level, difficulty)
- ✅ Validates level (A1-C2)
- ✅ Validates difficulty (easy, medium, hard)
- ✅ Detects "middle" → should be "medium"
- ✅ Validates frequency (1-5)
- ✅ Checks audio URL format
- ✅ Warns if no translations provided
- ✅ Color-coded terminal output

**Exit Codes:**
- `0` - Validation passed (no errors)
- `1` - Validation failed (errors found) or file not found

**Output Example:**
```
CSV Validation Tool
File: ./public/templates/vocab-a1-complete.csv

Headers found (18):
  - nr
  - greek_transcription
  - level
  ...

Data rows: 50

═══════════════════════════════════════
VALIDATION SUMMARY
═══════════════════════════════════════
Total rows: 50
Total errors: 0
Total warnings: 0

✅ VALIDATION PASSED
CSV is ready for import!
```

**Dependencies:** None (uses only Node.js built-in modules)

**Documentation:** See `/CSV-IMPORT-GUIDE.md` for detailed CSV format documentation.

---

### `test-security.ts`

Tests security features including authentication, CSRF protection, and API endpoints.

**Usage:**
```bash
ts-node scripts/test-security.ts
```

---

### `insert-test-vocabulary.ts`

Inserts test vocabulary data into the database for development.

**Usage:**
```bash
ts-node scripts/insert-test-vocabulary.ts
```

---

## Future Scripts (Planned)

- `migrate-old-csv.js` - Auto-convert old CSV format to new format
- `generate-sample-data.js` - Generate test data for development
- `export-vocab.js` - Export vocabulary from database to CSV
- `check-duplicates.js` - Find duplicate entries in CSV files
- `validate-audio-urls.js` - Check if audio URLs are accessible

---

## Security

⚠️ **Never commit hardcoded credentials!**

All scripts must use environment variables via `dotenv`.

**Example:**
```javascript
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Environment variables not set');
    process.exit(1);
}
```

---

## Adding New Scripts

When adding new scripts:

1. Use `#!/usr/bin/env node` shebang for CLI scripts
2. Make executable: `chmod +x scripts/<script-name>.js`
3. Document usage in this README
4. Add error handling and helpful error messages
5. Use exit codes: 0 = success, 1+ = error
6. For database scripts: Use environment variables
7. For utility scripts: No dependencies if possible (or minimal)

---

**Last Updated:** 18. Februar 2026
