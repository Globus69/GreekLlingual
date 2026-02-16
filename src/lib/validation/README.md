# Input Validation

This module provides Zod schemas for input validation and SQL injection prevention.

## Security

All user inputs **must** be validated using these schemas before being used in:
- Database queries
- API routes
- Content operations
- Any external data processing

## Usage

### Import schemas

```typescript
import {
    searchSchema,
    contentInsertSchema,
    safeParse
} from '@/lib/validation/schemas';
```

### Validate input

```typescript
const validationResult = safeParse(searchSchema, userInput);

if (!validationResult.success) {
    // Handle error
    console.error('Validation error:', validationResult.error);
    return;
}

// Use validated data
const safeInput = validationResult.data;
```

## Available Schemas

### Basic Types
- `searchSchema` - Search queries (max 100 chars, safe characters only)
- `uuidSchema` - UUID validation
- `pinSchema` - 4-digit PIN validation
- `contentTypeSchema` - Content type enum
- `levelSchema` - Level enum (A1-C2)
- `difficultySchema` - Difficulty enum (easy/medium/hard)

### Complex Types
- `filterParamsSchema` - Content filter parameters
- `contentInsertSchema` - Content creation
- `contentUpdateSchema` - Content updates
- `bulkDeleteSchema` - Bulk delete operations

## Security Notes

### SQL Injection Prevention

The search schema prevents SQL injection by:
1. Limiting string length (max 100 characters)
2. Allowing only safe characters (alphanumeric, Greek, common punctuation)
3. Stripping dangerous SQL patterns

**Example:**
```typescript
// ❌ Unsafe
query.or(`english.ilike.%${userInput}%`);

// ✅ Safe
const result = safeParse(searchSchema, userInput);
if (result.success) {
    query.or(`english.ilike.%${result.data}%`);
}
```

### Character Whitelisting

All text inputs use regex whitelisting:
- Latin characters: `a-zA-Z`
- Numbers: `0-9`
- Greek characters: `\u0370-\u03FF` (modern), `\u1F00-\u1FFF` (polytonic)
- Safe punctuation: `.,!?'"-()\/`
- Spaces

**No dangerous characters allowed:**
- Semicolons (`;`)
- SQL keywords
- Shell metacharacters
- HTML/JavaScript tags

## Adding New Schemas

When adding new schemas:

1. Define constants as `const` arrays
2. Use strict regex patterns
3. Add max length constraints
4. Transform/trim strings
5. Document the schema purpose

**Example:**
```typescript
export const MY_TYPES = ['type1', 'type2'] as const;

export const mySchema = z
    .string()
    .max(100, 'Too long')
    .regex(/^[a-zA-Z0-9\s]*$/, 'Invalid characters')
    .transform(str => str.trim());
```

## Testing

Validation schemas should be tested for:
- Valid inputs (happy path)
- Invalid characters (SQL injection attempts)
- Length limits
- Edge cases (empty strings, unicode, etc.)
