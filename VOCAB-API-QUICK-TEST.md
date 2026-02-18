# Vocabulary API Quick Test Guide

**Quick reference for testing the vocabulary management API**

---

## Prerequisites

1. **Database Setup**: Create the `vocabulary_content` table in Supabase
2. **Admin Login**: Login as admin to get session token
3. **CSRF Token**: Get CSRF token from `/api/auth/csrf`

---

## Quick Test Script (Browser Console)

### 1. Get CSRF Token

```javascript
const getCsrf = async () => {
  const res = await fetch('/api/auth/csrf', { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
};

const csrf = await getCsrf();
console.log('CSRF Token:', csrf);
```

### 2. List Vocabulary

```javascript
// List all
const list = await fetch('/api/admin/vocab', {
  credentials: 'include'
}).then(r => r.json());

console.log('Total entries:', list.total);
console.log('First page:', list.data);

// With filters
const filtered = await fetch('/api/admin/vocab?level=A1&difficulty=easy&limit=5', {
  credentials: 'include'
}).then(r => r.json());

console.log('Filtered:', filtered);
```

### 3. Create Entry

```javascript
const created = await fetch('/api/admin/vocab', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf
  },
  body: JSON.stringify({
    greek_transcription: 'Γεια σου',
    greek_phonetic: 'yia sou',
    translation_en: 'Hello',
    translation_de: 'Hallo',
    translation_ru: 'Привет',
    level: 'A1',
    difficulty: 'easy',
    frequency: 5
  })
}).then(r => r.json());

console.log('Created:', created);
const entryId = created.data.id;
```

### 4. Update Entry

```javascript
const updated = await fetch(`/api/admin/vocab/${entryId}`, {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf
  },
  body: JSON.stringify({
    difficulty: 'medium',
    frequency: 4
  })
}).then(r => r.json());

console.log('Updated:', updated);
```

### 5. Bulk Update

```javascript
const bulkUpdated = await fetch('/api/admin/vocab/bulk-update', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf
  },
  body: JSON.stringify({
    ids: [entryId],
    updates: { frequency: 5 }
  })
}).then(r => r.json());

console.log('Bulk updated:', bulkUpdated);
```

### 6. Export CSV

```javascript
const exportCsv = async () => {
  const response = await fetch('/api/admin/vocab/export?level=A1', {
    credentials: 'include'
  });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vocabulary_export.csv';
  a.click();
  console.log('Export downloaded');
};

await exportCsv();
```

### 7. Import CSV

```javascript
const importCsv = async (csvText) => {
  const blob = new Blob([csvText], { type: 'text/csv' });
  const file = new File([blob], 'import.csv');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', 'append'); // or 'overwrite'

  const result = await fetch('/api/admin/vocab/import', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': csrf },
    body: formData
  }).then(r => r.json());

  console.log('Import result:', result);
  console.log(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
  if (result.errors.length > 0) {
    console.error('Errors:', result.errors);
  }
};

// Test with sample CSV
const sampleCsv = `greek_transcription,greek_phonetic,translation_en,translation_de,level,difficulty,frequency
Καλημέρα,kalimera,Good morning,Guten Morgen,A1,easy,5
Ευχαριστώ,efharisto,Thank you,Danke,A1,easy,5
Παρακαλώ,parakalo,Please,Bitte,A1,easy,5`;

await importCsv(sampleCsv);
```

### 8. Delete Entry

```javascript
const deleted = await fetch(`/api/admin/vocab/${entryId}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: { 'X-CSRF-Token': csrf }
}).then(r => r.json());

console.log('Deleted:', deleted);
```

### 9. Bulk Delete

```javascript
const bulkDeleted = await fetch('/api/admin/vocab/bulk-delete', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf
  },
  body: JSON.stringify({
    ids: [entryId]
  })
}).then(r => r.json());

console.log('Bulk deleted:', bulkDeleted);
```

---

## Complete Test Flow

```javascript
// Full test suite
(async () => {
  console.log('🧪 Starting Vocabulary API Test Suite...\n');

  // 0. Get CSRF Token
  console.log('1️⃣ Getting CSRF token...');
  const csrfRes = await fetch('/api/auth/csrf', { credentials: 'include' });
  const { csrfToken } = await csrfRes.json();
  console.log('✅ CSRF token obtained\n');

  // 1. List (empty)
  console.log('2️⃣ Listing vocabulary...');
  const list1 = await fetch('/api/admin/vocab', { credentials: 'include' }).then(r => r.json());
  console.log(`✅ Found ${list1.total} entries\n`);

  // 2. Create entry
  console.log('3️⃣ Creating test entry...');
  const createRes = await fetch('/api/admin/vocab', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      greek_transcription: 'Τεστ',
      translation_en: 'Test',
      level: 'A1',
      difficulty: 'easy',
      frequency: 1
    })
  }).then(r => r.json());

  if (!createRes.success) {
    console.error('❌ Create failed:', createRes.error);
    return;
  }

  const entryId = createRes.data.id;
  console.log(`✅ Created entry with ID: ${entryId}\n`);

  // 3. Update entry
  console.log('4️⃣ Updating entry...');
  const updateRes = await fetch(`/api/admin/vocab/${entryId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ frequency: 5 })
  }).then(r => r.json());

  if (updateRes.success) {
    console.log(`✅ Updated entry (frequency: ${updateRes.data.frequency})\n`);
  } else {
    console.error('❌ Update failed:', updateRes.error);
  }

  // 4. Search
  console.log('5️⃣ Searching for entry...');
  const searchRes = await fetch('/api/admin/vocab?search=Τεστ', {
    credentials: 'include'
  }).then(r => r.json());
  console.log(`✅ Search found ${searchRes.total} results\n`);

  // 5. Export
  console.log('6️⃣ Exporting to CSV...');
  const exportRes = await fetch('/api/admin/vocab/export', {
    credentials: 'include'
  });
  const csvText = await exportRes.text();
  console.log(`✅ Exported ${csvText.split('\n').length - 1} entries\n`);

  // 6. Import
  console.log('7️⃣ Importing from CSV...');
  const testCsv = `greek_transcription,translation_en,level,difficulty,frequency
Δοκιμή,Test Import,A2,medium,3`;

  const blob = new Blob([testCsv], { type: 'text/csv' });
  const file = new File([blob], 'test.csv');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', 'append');

  const importRes = await fetch('/api/admin/vocab/import', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': csrfToken },
    body: formData
  }).then(r => r.json());

  console.log(`✅ Imported: ${importRes.imported}, Skipped: ${importRes.skipped}\n`);

  // 7. List (after import)
  console.log('8️⃣ Listing after import...');
  const list2 = await fetch('/api/admin/vocab', { credentials: 'include' }).then(r => r.json());
  console.log(`✅ Now have ${list2.total} entries\n`);

  // 8. Bulk delete (cleanup)
  console.log('9️⃣ Cleaning up (bulk delete)...');
  const allIds = list2.data.map(e => e.id);
  const deleteRes = await fetch('/api/admin/vocab/bulk-delete', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ ids: allIds })
  }).then(r => r.json());

  console.log(`✅ Deleted ${deleteRes.deleted} entries\n`);

  console.log('🎉 All tests completed successfully!');
})();
```

---

## cURL Examples

### List

```bash
curl -X GET "http://localhost:3000/api/admin/vocab?level=A1&limit=10" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

### Create

```bash
curl -X POST "http://localhost:3000/api/admin/vocab" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "greek_transcription": "Γεια σου",
    "translation_en": "Hello",
    "level": "A1",
    "difficulty": "easy"
  }'
```

### Import CSV

```bash
curl -X POST "http://localhost:3000/api/admin/vocab/import" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -F "file=@vocabulary.csv" \
  -F "mode=append"
```

### Export CSV

```bash
curl -X GET "http://localhost:3000/api/admin/vocab/export?level=A1" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN" \
  -o vocabulary_export.csv
```

---

## Sample CSV Files

### Minimal CSV (Required fields only)

```csv
greek_transcription,level,difficulty
Γεια σου,A1,easy
Καλημέρα,A1,easy
Ευχαριστώ,A1,easy
```

### Full CSV (All fields)

```csv
greek_transcription,greek_phonetic,translation_en,translation_ru,translation_de,translation_es,importance_reason_en,audio_url_en,level,difficulty,frequency
Γεια σου,yia sou,Hello,Привет,Hallo,Hola,Common greeting,https://audio.example.com/hello.mp3,A1,easy,5
Καλημέρα,kalimera,Good morning,Доброе утро,Guten Morgen,Buenos días,Morning greeting,https://audio.example.com/morning.mp3,A1,easy,5
Ευχαριστώ,efharisto,Thank you,Спасибо,Danke,Gracias,Expression of gratitude,https://audio.example.com/thanks.mp3,A1,easy,5
```

### CSV with Errors (for testing validation)

```csv
greek_transcription,level,difficulty
Γεια σου,A1,easy
,,
Τεστ,invalid_level,easy
Another,A2,invalid_difficulty
Valid,B1,medium
```

Expected result: 2 imported (Γεια σου, Valid), 3 errors

---

## Status Code Reference

- **200**: Success
- **400**: Bad request (validation failed, invalid input)
- **401**: Not authenticated / Session expired
- **403**: Forbidden (not admin, invalid CSRF token)
- **404**: Entry not found
- **409**: Conflict (duplicate entry)
- **500**: Internal server error

---

## Common Issues & Solutions

### Issue: 401 Not authenticated
**Solution**: Login as admin first, ensure session cookie is included

### Issue: 403 Invalid CSRF token
**Solution**: Get CSRF token from `/api/auth/csrf` before POST/PATCH/DELETE

### Issue: 409 Duplicate entry
**Solution**: Entry with same greek_transcription + level already exists

### Issue: 400 Validation failed
**Solution**: Check that required fields are present and valid (greek_transcription, level, difficulty)

### Issue: 500 Internal server error
**Solution**: Check that `vocabulary_content` table exists in database

---

## Database Query (Supabase SQL Editor)

Check table exists:
```sql
SELECT * FROM vocabulary_content LIMIT 10;
```

Check entry count:
```sql
SELECT
  level,
  difficulty,
  COUNT(*) as count
FROM vocabulary_content
GROUP BY level, difficulty
ORDER BY level, difficulty;
```

Find duplicates:
```sql
SELECT
  greek_transcription,
  level,
  COUNT(*) as count
FROM vocabulary_content
GROUP BY greek_transcription, level
HAVING COUNT(*) > 1;
```

---

**Ready to test! 🚀**
