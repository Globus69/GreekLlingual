# Database Migrations

This folder contains all SQL migration files for the HellenicHorizons GreekLingua Dashboard.

## Migration Execution Order

Migrations are numbered sequentially (001-050). Execute them in **numeric order** in the Supabase SQL Editor.

## Critical Migrations (Must Execute)

These migrations are **essential** for the application to function:

### 1. Core Schema & Authentication
- `001_00_bootstrap_all.sql` - Complete bootstrap (includes all core tables)
- `001_verify_user_4digit_pin_complete.sql` - 4-digit PIN authentication
- `025_create_users_table.sql` - User table with bcrypt hashing
- `033_fix_student_management_v2.sql` - Student CRUD + RPC functions

### 2. Security Features
- `003_EXECUTE_THIS_account_lockout_complete.sql` - Account lockout (5 strikes)
- `008_add_admin_mfa.sql` - TOTP 2FA for admins
- `018_create_audit_log.sql` - Admin action logging
- `019_create_honeypot_pins.sql` - Honeypot PIN detection

### 3. Multi-Language Support
- `024_create_ui_translations.sql` - UI translation table
- `014_add_preferred_locale.sql` - User language preference
- `036_insert_greek_translations.sql` - Greek UI (EL)
- `035_insert_german_translations.sql` - German UI (DE)
- `037_insert_missing_dashboard_translations.sql` - Dashboard strings

### 4. Learning System
- `022_create_lesson_sessions.sql` - Teacher lessons + vocabulary
- `023_create_performance_evaluation.sql` - Auto-leveling + performance log
- `011_add_level_difficulty_to_learning_items.sql` - Content filtering
- `046_schema.sql` - Learning items + student progress (SRS)

### 5. Device & IP Tracking
- `009_add_device_fingerprint.sql` - FingerprintJS integration
- `010_add_device_type_tracking.sql` - Desktop vs mobile detection

## Optional Migrations

These improve functionality but are **not critical**:

- `006_add_admin_contact_phone.sql` - Admin phone number field
- `016_alter_learning_items_add_russian.sql` - Russian learning content
- `028_extend_users_for_4digit_pin.sql` - 4-digit PIN support (alternative)

## Test Data

Test data SQL files are in `../test-data/` folder. These are **optional** for development/testing:

- `038_insert_test_comprehension.sql`
- `039_insert_test_daily_phrases.sql`
- `040_insert_test_grammar.sql`
- `041_insert_test_lessons.sql`
- `042_insert_test_listening.sql`
- `043_insert_test_short_stories.sql`
- `044_insert_test_vocabulary.sql`

## Migration Strategy

### For New Database (Empty Supabase Project)
1. Execute `001_00_bootstrap_all.sql` (complete setup)
2. Execute `001_verify_user_4digit_pin_complete.sql` (PIN auth)
3. Execute `003_EXECUTE_THIS_account_lockout_complete.sql` (security)
4. Execute `014_add_preferred_locale.sql` (language persistence)
5. Execute `024_create_ui_translations.sql` (UI strings)
6. Execute `035-037_insert_*_translations.sql` (Greek + German + Dashboard)
7. Optional: Execute test data files from `../test-data/`

### For Existing Database (Incremental Updates)
- Execute migrations in numeric order, starting from the last executed migration
- Check `supabase` dashboard → SQL Editor → History to see which migrations were already run
- Skip migrations that modify existing data (e.g., `unban_all_ips.sql`)

## Verification

After executing migrations, verify with these queries:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RPC functions
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- Check translation count
SELECT lang, COUNT(*) FROM ui_translations GROUP BY lang;

-- Check test users (4-digit PIN)
SELECT name, pin_4digit, level, difficulty FROM users WHERE role = 'student';
```

## Notes

- All RPC functions use `SECURITY DEFINER` to bypass RLS
- PIN fields use `pgcrypto` extension for bcrypt hashing
- Translation table uses `UNIQUE(key, lang)` constraint
- Performance evaluation triggers auto-level adjustment (>80% = advance, <40% = demote)

## Troubleshooting

**Error: "relation 'users' already exists"**
- Skip `create_users_table.sql`, table already exists

**Error: "function verify_user_4digit_pin already exists"**
- Use `CREATE OR REPLACE FUNCTION` or skip migration

**Error: "duplicate key value violates unique constraint"**
- Translation keys already exist, safe to ignore (uses `ON CONFLICT DO UPDATE`)

---

For detailed deployment guide, see: `docs/deployment/PRODUCTION-DEPLOYMENT.md`
