# Daily Phrases API Documentation

**Base URL:** `/api/admin/daily-phrases`
**Authentication:** Required (Admin only)
**Security:** Session token + CSRF protection

---

## 📋 Table of Contents

1. [List Phrases](#list-phrases)
2. [Create Phrase](#create-phrase)
3. [Get Phrase by ID](#get-phrase-by-id)
4. [Update Phrase](#update-phrase)
5. [Delete Phrase](#delete-phrase)
6. [Bulk Update](#bulk-update)
7. [Bulk Delete](#bulk-delete)
8. [Import CSV](#import-csv)
9. [Export CSV](#export-csv)
10. [Get Statistics](#get-statistics)

---

## 1. List Phrases

**Endpoint:** `GET /api/admin/daily-phrases`

**Description:** Get a filtered and paginated list of phrases.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search in Greek, EN, DE, ES, RU translations |
| `level` | string | No | Filter by CEFR level (A1,A2,B1,B2,C1,C2) |
| `difficulty` | string | No | Filter by difficulty (easy,medium,hard) |
| `frequency` | number | No | Filter by frequency rating (1-5) |
| `page` | number | No | Page number (default: 0) |
| `limit` | number | No | Items per page (default: 20, max: 100) |
| `sort` | string | No | Sort field (frequency, created_at, updated_at, greek_transcription) |
| `order` | string | No | Sort order (asc, desc) |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "nr": 1,
      "greek_transcription": "καλησπέρα",
      "greek_phonetic": "kalispera",
      "en_translation": "good evening",
      "en_importance_reason": "evening greeting",
      "en_audio_url": null,
      "de_translation": "guten Abend",
      "de_importance_reason": "abendliche Begrüßung",
      "de_audio_url": null,
      "es_translation": "buenas noches",
      "es_importance_reason": "saludo nocturno",
      "es_audio_url": null,
      "ru_translation": "добрый вечер",
      "ru_importance_reason": "вечернее приветствие",
      "ru_audio_url": null,
      "level": "A2",
      "difficulty": "easy",
      "frequency": 5,
      "created_at": "2026-02-18T12:00:00Z",
      "updated_at": "2026-02-18T12:00:00Z",
      "created_by": "admin-uuid"
    }
  ],
  "total": 10,
  "page": 0,
  "limit": 20,
  "hasMore": false
}
```

### Example Request

```bash
curl -X GET "http://localhost:3000/api/admin/daily-phrases?search=καλη&level=A2&page=0&limit=20" \
  -H "Cookie: session_token=YOUR_TOKEN"
```

---

## 2. Create Phrase

**Endpoint:** `POST /api/admin/daily-phrases`

**Description:** Create a new phrase entry.

### Request Body

```json
{
  "nr": 1,
  "greek_transcription": "καλησπέρα",
  "greek_phonetic": "kalispera",
  "en_translation": "good evening",
  "en_importance_reason": "evening greeting",
  "en_audio_url": null,
  "de_translation": "guten Abend",
  "de_importance_reason": "abendliche Begrüßung",
  "de_audio_url": null,
  "es_translation": "buenas noches",
  "es_importance_reason": "saludo nocturno",
  "es_audio_url": null,
  "ru_translation": "добрый вечер",
  "ru_importance_reason": "вечернее приветствие",
  "ru_audio_url": null,
  "level": "A2",
  "difficulty": "easy",
  "frequency": 5
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "nr": 1,
    "greek_transcription": "καλησπέρα",
    ...
  }
}
```

### Example Request

```bash
curl -X POST "http://localhost:3000/api/admin/daily-phrases" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "greek_transcription": "καλησπέρα",
    "greek_phonetic": "kalispera",
    "en_translation": "good evening",
    "level": "A2",
    "difficulty": "easy",
    "frequency": 5
  }'
```

---

## 3. Get Phrase by ID

**Endpoint:** `GET /api/admin/daily-phrases/[id]`

**Description:** Get a single phrase by ID.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nr": 1,
    "greek_transcription": "καλησπέρα",
    ...
  }
}
```

### Example Request

```bash
curl -X GET "http://localhost:3000/api/admin/daily-phrases/uuid" \
  -H "Cookie: session_token=YOUR_TOKEN"
```

---

## 4. Update Phrase

**Endpoint:** `PATCH /api/admin/daily-phrases/[id]`

**Description:** Update an existing phrase. Only provide fields you want to update.

### Request Body

```json
{
  "en_translation": "good evening (updated)",
  "frequency": 4
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "en_translation": "good evening (updated)",
    "frequency": 4,
    "updated_at": "2026-02-18T13:00:00Z",
    ...
  }
}
```

### Example Request

```bash
curl -X PATCH "http://localhost:3000/api/admin/daily-phrases/uuid" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "en_translation": "good evening (updated)",
    "frequency": 4
  }'
```

---

## 5. Delete Phrase

**Endpoint:** `DELETE /api/admin/daily-phrases/[id]`

**Description:** Delete a phrase by ID.

### Response

```json
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

### Example Request

```bash
curl -X DELETE "http://localhost:3000/api/admin/daily-phrases/uuid" \
  -H "Cookie: session_token=YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN"
```

---

## 6. Bulk Update

**Endpoint:** `POST /api/admin/daily-phrases/bulk-update`

**Description:** Update multiple phrases at once.

### Request Body

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "level": "B1",
    "difficulty": "medium"
  }
}
```

### Response

```json
{
  "success": true,
  "updated": 3,
  "message": "Successfully updated 3 entries"
}
```

### Example Request

```bash
curl -X POST "http://localhost:3000/api/admin/daily-phrases/bulk-update" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "ids": ["uuid1", "uuid2"],
    "updates": {
      "level": "B1"
    }
  }'
```

---

## 7. Bulk Delete

**Endpoint:** `POST /api/admin/daily-phrases/bulk-delete`

**Description:** Delete multiple phrases at once.

### Request Body

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

### Response

```json
{
  "success": true,
  "deleted": 3,
  "message": "Successfully deleted 3 entries"
}
```

### Example Request

```bash
curl -X POST "http://localhost:3000/api/admin/daily-phrases/bulk-delete" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "ids": ["uuid1", "uuid2", "uuid3"]
  }'
```

---

## 8. Import CSV

**Endpoint:** `POST /api/admin/daily-phrases/import`

**Description:** Import phrases from CSV (pre-parsed JSON).

### Request Body

```json
{
  "entries": [
    {
      "nr": 1,
      "greek_transcription": "καλησπέρα",
      "greek_phonetic": "kalispera",
      "en_translation": "good evening",
      "level": "A2",
      "difficulty": "easy",
      "frequency": 5
    }
  ],
  "mode": "append"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entries` | array | Yes | Array of phrase objects |
| `mode` | string | Yes | "append" (skip duplicates) or "overwrite" (clear table first) |

### Response

```json
{
  "success": true,
  "imported": 10,
  "skipped": 2,
  "errors": [
    "Row 5: Greek transcription is required"
  ],
  "message": "Imported 10 phrases, skipped 2"
}
```

### Example Request

```bash
curl -X POST "http://localhost:3000/api/admin/daily-phrases/import" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "entries": [...],
    "mode": "append"
  }'
```

---

## 9. Export CSV

**Endpoint:** `GET /api/admin/daily-phrases/export`

**Description:** Export phrases to CSV file.

### Query Parameters

Same as [List Phrases](#list-phrases) (filters applied before export).

### Response

**Content-Type:** `text/csv; charset=utf-8`
**Content-Disposition:** `attachment; filename="phrases_export_2026-02-18.csv"`

CSV file with columns:
```
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
```

### Example Request

```bash
curl -X GET "http://localhost:3000/api/admin/daily-phrases/export?level=A2" \
  -H "Cookie: session_token=YOUR_TOKEN" \
  -o phrases_export.csv
```

---

## 10. Get Statistics

**Endpoint:** Via RPC function `get_phrases_stats()`

**Description:** Get aggregated statistics (called via Supabase client).

### Client Usage

```typescript
import { supabase } from '@/lib/supabase/client';

const { data, error } = await supabase.rpc('get_phrases_stats');
```

### Response

```json
{
  "total": 50,
  "by_level": {
    "A1": 10,
    "A2": 15,
    "B1": 12,
    "B2": 8,
    "C1": 3,
    "C2": 2
  },
  "by_difficulty": {
    "easy": 25,
    "medium": 20,
    "hard": 5
  },
  "avg_frequency": 3.8,
  "with_audio": {
    "en": 30,
    "de": 25,
    "es": 20,
    "ru": 15
  }
}
```

---

## 🔐 Authentication & Security

### Session Token

All endpoints require a valid session token stored in httpOnly cookie:

```
Cookie: session_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### CSRF Token

State-changing operations (POST, PATCH, DELETE) require CSRF token:

```
X-CSRF-Token: your-csrf-token-here
```

### Admin Role

All endpoints check for admin role:

```typescript
const { data: user } = await supabase
  .from('users')
  .select('role')
  .eq('id', session.userId)
  .single();

if (user?.role !== 'admin') {
  return 403 Unauthorized
}
```

---

## 📝 Validation Rules

### Required Fields

- `greek_transcription` (TEXT, max 500 chars)
- `level` (ENUM: A1, A2, B1, B2, C1, C2)
- `difficulty` (ENUM: easy, medium, hard)
- `frequency` (INTEGER: 1-5)

### Optional Fields

- All translation fields (en_, de_, es_, ru_)
- All importance_reason fields
- All audio_url fields
- `nr` (sequential number)
- `greek_phonetic`
- `category` (legacy)
- `deck_id` (legacy)

---

## ⚠️ Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Not authenticated"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Unauthorized - Admin access required"
}
```

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Greek transcription is required",
    "Valid level is required (A1-C2)"
  ]
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Entry not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

---

## 🧪 Testing with cURL

### Complete Example Workflow

```bash
# 1. Get list of phrases
curl -X GET "http://localhost:3000/api/admin/daily-phrases" \
  -H "Cookie: session_token=$TOKEN"

# 2. Create new phrase
curl -X POST "http://localhost:3000/api/admin/daily-phrases" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=$TOKEN" \
  -H "X-CSRF-Token: $CSRF" \
  -d '{
    "greek_transcription": "γεια σου",
    "en_translation": "hello",
    "level": "A1",
    "difficulty": "easy",
    "frequency": 5
  }'

# 3. Update phrase
curl -X PATCH "http://localhost:3000/api/admin/daily-phrases/$ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=$TOKEN" \
  -H "X-CSRF-Token: $CSRF" \
  -d '{"frequency": 4}'

# 4. Export to CSV
curl -X GET "http://localhost:3000/api/admin/daily-phrases/export" \
  -H "Cookie: session_token=$TOKEN" \
  -o phrases.csv

# 5. Delete phrase
curl -X DELETE "http://localhost:3000/api/admin/daily-phrases/$ID" \
  -H "Cookie: session_token=$TOKEN" \
  -H "X-CSRF-Token: $CSRF"
```

---

## 📚 Related Documentation

- [Main Implementation Guide](./DAILY-PHRASES-IMPLEMENTATION.md)
- [Database Schema](./PHRASES-TABLE-STATUS.md)
- [TypeScript Types](../src/types/phrases.ts)
- [API Client Library](../src/lib/api/phrases.ts)

---

**Last Updated:** 2026-02-18
**Version:** 1.0.0
**Status:** Production Ready (pending migration)
