# Vocabulary Management API Documentation

**Version:** 1.0
**Last Updated:** February 18, 2026
**Author:** Agent 7 - Backend API Routes & Import Logic

## Overview

Complete REST API for vocabulary management in GreekLingua Dashboard. Provides CSV import/export, CRUD operations, and bulk management capabilities.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Data Types](#data-types)
4. [CSV Format](#csv-format)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)

---

## Authentication

All endpoints require admin authentication via session token stored in httpOnly cookie.

**Required Headers:**
- Cookie: `session_token=<jwt_token>`
- X-CSRF-Token: `<csrf_token>` (for state-changing operations)

**Authorization Flow:**
1. Session token verified using JWT
2. User role checked (must be 'admin')
3. CSRF token verified for POST/PATCH/DELETE operations

---

## API Endpoints

### 1. List Vocabulary

**Endpoint:** `GET /api/admin/vocab`

**Description:** Retrieve vocabulary entries with filtering, pagination, and sorting.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search in greek_transcription and translations |
| `level` | string | No | - | Comma-separated CEFR levels (A1,A2,B1,B2,C1,C2) |
| `difficulty` | string | No | - | Comma-separated difficulties (easy,medium,hard) |
| `frequency` | number | No | - | Filter by frequency (1-5) |
| `page` | number | No | 0 | Page number (0-indexed) |
| `limit` | number | No | 20 | Items per page (max 100) |
| `sort` | string | No | created_at | Sort field (frequency, created_at, updated_at, greek_transcription) |
| `order` | string | No | desc | Sort order (asc, desc) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nr": 1,
      "greek_transcription": "Γεια σου",
      "greek_phonetic": "yia sou",
      "translation_en": "Hello",
      "translation_ru": "Привет",
      "translation_de": "Hallo",
      "translation_es": "Hola",
      "importance_reason_en": "Common greeting",
      "audio_url_en": "https://...",
      "level": "A1",
      "difficulty": "easy",
      "frequency": 5,
      "created_at": "2026-02-18T10:00:00Z",
      "updated_at": "2026-02-18T10:00:00Z",
      "created_by": "admin-uuid"
    }
  ],
  "total": 100,
  "page": 0,
  "limit": 20,
  "hasMore": true
}
```

**Status Codes:**
- 200: Success
- 401: Not authenticated / Session expired
- 403: Unauthorized (not admin)
- 500: Internal server error

---

### 2. Create Vocabulary Entry

**Endpoint:** `POST /api/admin/vocab`

**Description:** Create a new vocabulary entry.

**Request Body:**

```json
{
  "greek_transcription": "Γεια σου",
  "greek_phonetic": "yia sou",
  "translation_en": "Hello",
  "translation_ru": "Привет",
  "translation_de": "Hallo",
  "translation_es": "Hola",
  "importance_reason_en": "Common greeting",
  "audio_url_en": "https://...",
  "level": "A1",
  "difficulty": "easy",
  "frequency": 5
}
```

**Required Fields:**
- `greek_transcription` (string)
- `level` (A1, A2, B1, B2, C1, C2)
- `difficulty` (easy, medium, hard)

**Optional Fields:**
- `nr` (number)
- `greek_phonetic` (string)
- `translation_[locale]` (string) - locale: en, ru, de, es
- `importance_reason_[locale]` (string)
- `audio_url_[locale]` (string)
- `frequency` (number, 1-5)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "greek_transcription": "Γεια σου",
    ...
  }
}
```

**Status Codes:**
- 200: Success
- 400: Validation failed
- 401: Not authenticated
- 403: Unauthorized / Invalid CSRF token
- 409: Duplicate entry (same greek_transcription + level)
- 500: Internal server error

---

### 3. Update Vocabulary Entry

**Endpoint:** `PATCH /api/admin/vocab/:id`

**Description:** Update an existing vocabulary entry.

**URL Parameters:**
- `id` (string, required): UUID of entry to update

**Request Body:** (all fields optional)

```json
{
  "difficulty": "medium",
  "frequency": 4,
  "translation_en": "Hi there"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

**Status Codes:**
- 200: Success
- 400: Validation failed / Invalid ID
- 401: Not authenticated
- 403: Unauthorized / Invalid CSRF token
- 404: Entry not found
- 500: Internal server error

---

### 4. Delete Vocabulary Entry

**Endpoint:** `DELETE /api/admin/vocab/:id`

**Description:** Delete a vocabulary entry.

**URL Parameters:**
- `id` (string, required): UUID of entry to delete

**Response:**

```json
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid ID
- 401: Not authenticated
- 403: Unauthorized / Invalid CSRF token
- 500: Internal server error

---

### 5. Bulk Update

**Endpoint:** `POST /api/admin/vocab/bulk-update`

**Description:** Update multiple entries at once.

**Request Body:**

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "difficulty": "hard",
    "frequency": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "updated": 3,
  "message": "Successfully updated 3 entries"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request body
- 401: Not authenticated
- 403: Unauthorized / Invalid CSRF token
- 500: Internal server error

---

### 6. Bulk Delete

**Endpoint:** `POST /api/admin/vocab/bulk-delete`

**Description:** Delete multiple entries at once.

**Request Body:**

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**

```json
{
  "success": true,
  "deleted": 3,
  "message": "Successfully deleted 3 entries"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request body
- 401: Not authenticated
- 403: Unauthorized / Invalid CSRF token
- 500: Internal server error

---

### 7. Import from CSV

**Endpoint:** `POST /api/admin/vocab/import`

**Description:** Import vocabulary from CSV file.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (File, required): CSV file to import
- `mode` (string, required): Import mode ('append' or 'overwrite')

**Import Modes:**
- **append**: Add new entries, skip duplicates (checks greek_transcription + level)
- **overwrite**: Delete all existing entries, then import new ones

**Response:**

```json
{
  "success": true,
  "imported": 95,
  "skipped": 5,
  "errors": [
    "Row 10: level is required",
    "Row 23: difficulty must be one of: easy, medium, hard"
  ]
}
```

**Status Codes:**
- 200: Success (even with errors - check response)
- 400: CSV parsing failed / Invalid mode / No file
- 401: Not authenticated
- 403: Unauthorized / Invalid CSRF token
- 500: Internal server error

---

### 8. Export to CSV

**Endpoint:** `GET /api/admin/vocab/export`

**Description:** Export vocabulary to CSV file.

**Query Parameters:** (same as List endpoint for filtering)
- `search`, `level`, `difficulty`, `frequency`, `sort`, `order`

**Response:** CSV file download

**Headers:**
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="vocabulary_export_2026-02-18.csv"`

**Status Codes:**
- 200: Success (CSV file)
- 401: Not authenticated
- 403: Unauthorized
- 500: Internal server error

---

## Data Types

### VocabEntry

```typescript
interface VocabEntry {
  id: string;
  nr?: number;
  greek_transcription: string;
  greek_phonetic?: string;
  translation_ru?: string;
  importance_reason_ru?: string;
  audio_url_ru?: string;
  translation_en?: string;
  importance_reason_en?: string;
  audio_url_en?: string;
  translation_es?: string;
  importance_reason_es?: string;
  audio_url_es?: string;
  translation_de?: string;
  importance_reason_de?: string;
  audio_url_de?: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: number; // 1-5
  created_at: string;
  updated_at: string;
  created_by?: string;
}
```

---

## CSV Format

### Required Columns
- `greek_transcription`
- `level`
- `difficulty`

### Optional Columns
- `nr`
- `greek_phonetic`
- `translation_ru`, `importance_reason_ru`, `audio_url_ru`
- `translation_en`, `importance_reason_en`, `audio_url_en`
- `translation_es`, `importance_reason_es`, `audio_url_es`
- `translation_de`, `importance_reason_de`, `audio_url_de`
- `frequency`

### Example CSV

```csv
greek_transcription,greek_phonetic,translation_en,level,difficulty,frequency
Γεια σου,yia sou,Hello,A1,easy,5
Καλημέρα,kalimera,Good morning,A1,easy,5
Ευχαριστώ,efharisto,Thank you,A1,easy,5
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid input, validation failed
- **401 Unauthorized**: Not authenticated, session expired
- **403 Forbidden**: Invalid CSRF token, not admin
- **404 Not Found**: Entry not found
- **409 Conflict**: Duplicate entry
- **500 Internal Server Error**: Server error, database error

---

## Usage Examples

### JavaScript/TypeScript Fetch

#### List with Filters

```typescript
const response = await fetch('/api/admin/vocab?level=A1,A2&difficulty=easy&page=0&limit=20', {
  credentials: 'include', // Include session cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data); // Array of entries
```

#### Create Entry

```typescript
// Get CSRF token first
const csrfResponse = await fetch('/api/auth/csrf');
const { csrfToken } = await csrfResponse.json();

const response = await fetch('/api/admin/vocab', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    greek_transcription: 'Γεια σου',
    level: 'A1',
    difficulty: 'easy',
    translation_en: 'Hello'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Created:', data.data);
}
```

#### Import CSV

```typescript
// Get CSRF token
const csrfResponse = await fetch('/api/auth/csrf');
const { csrfToken } = await csrfResponse.json();

// Upload file
const formData = new FormData();
formData.append('file', csvFile);
formData.append('mode', 'append');

const response = await fetch('/api/admin/vocab/import', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': csrfToken
  },
  body: formData
});

const result = await response.json();
console.log(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}
```

#### Export CSV

```typescript
const response = await fetch('/api/admin/vocab/export?level=A1&sort=frequency&order=desc', {
  credentials: 'include'
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'vocabulary_export.csv';
a.click();
```

#### Bulk Update

```typescript
// Get CSRF token
const csrfResponse = await fetch('/api/auth/csrf');
const { csrfToken } = await csrfResponse.json();

const response = await fetch('/api/admin/vocab/bulk-update', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    ids: ['uuid1', 'uuid2', 'uuid3'],
    updates: {
      difficulty: 'hard',
      frequency: 4
    }
  })
});

const result = await response.json();
console.log(`Updated: ${result.updated}`);
```

---

## Database Schema

The API expects a `vocabulary_content` table with the following schema:

```sql
CREATE TABLE vocabulary_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nr INTEGER,
  greek_transcription TEXT NOT NULL,
  greek_phonetic TEXT,
  translation_ru TEXT,
  importance_reason_ru TEXT,
  audio_url_ru TEXT,
  translation_en TEXT,
  importance_reason_en TEXT,
  audio_url_en TEXT,
  translation_es TEXT,
  importance_reason_es TEXT,
  audio_url_es TEXT,
  translation_de TEXT,
  importance_reason_de TEXT,
  audio_url_de TEXT,
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  frequency INTEGER CHECK (frequency >= 1 AND frequency <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES students(id),
  UNIQUE(greek_transcription, level)
);

-- Indexes for performance
CREATE INDEX idx_vocab_level ON vocabulary_content(level);
CREATE INDEX idx_vocab_difficulty ON vocabulary_content(difficulty);
CREATE INDEX idx_vocab_frequency ON vocabulary_content(frequency);
CREATE INDEX idx_vocab_created_at ON vocabulary_content(created_at);
CREATE INDEX idx_vocab_greek ON vocabulary_content(greek_transcription);

-- Full-text search index (optional)
CREATE INDEX idx_vocab_search ON vocabulary_content
USING gin(to_tsvector('simple',
  coalesce(greek_transcription, '') || ' ' ||
  coalesce(translation_en, '') || ' ' ||
  coalesce(translation_ru, '') || ' ' ||
  coalesce(translation_de, '') || ' ' ||
  coalesce(translation_es, '')
));
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid admin session
2. **CSRF Protection**: State-changing operations (POST/PATCH/DELETE) require CSRF token
3. **Input Validation**: All inputs are validated and sanitized
4. **SQL Injection**: Using Supabase client with parameterized queries
5. **XSS Prevention**: Output is not rendered as HTML
6. **Rate Limiting**: Consider implementing rate limiting for import endpoint
7. **File Upload**: CSV files are parsed, not executed
8. **Authorization**: Admin role verified for all operations

---

## Testing

### Manual Testing Checklist

- [ ] List vocabulary with no filters
- [ ] List vocabulary with level filter
- [ ] List vocabulary with search query
- [ ] List vocabulary with pagination
- [ ] Create new vocabulary entry
- [ ] Create duplicate entry (should fail with 409)
- [ ] Update vocabulary entry
- [ ] Delete vocabulary entry
- [ ] Bulk update multiple entries
- [ ] Bulk delete multiple entries
- [ ] Import CSV in append mode
- [ ] Import CSV in overwrite mode
- [ ] Import CSV with validation errors
- [ ] Export vocabulary to CSV
- [ ] Test without authentication (should fail with 401)
- [ ] Test without CSRF token for POST (should fail with 403)
- [ ] Test with non-admin user (should fail with 403)

---

## Future Enhancements

1. **Versioning**: Track changes to vocabulary entries
2. **Soft Delete**: Mark entries as deleted instead of removing
3. **Import History**: Log all import operations
4. **Duplicate Detection**: Smart duplicate detection with fuzzy matching
5. **Validation Rules**: Custom validation rules per locale
6. **Audio Upload**: Direct audio file upload endpoint
7. **Batch Operations**: Async batch processing for large imports
8. **Export Formats**: Support JSON, Excel formats
9. **Search**: Full-text search with PostgreSQL FTS
10. **Analytics**: Track vocabulary usage statistics

---

## Support

For issues or questions:
- Check error messages and status codes
- Review validation requirements
- Verify authentication and CSRF tokens
- Check database schema and permissions
- Review server logs for detailed error information

---

**End of Documentation**
