# Scripts

Utility scripts for development and testing.

## Setup

All scripts require environment variables to be set in `.env.local`:

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
