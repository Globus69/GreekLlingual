# Migration 085: Fix RPC Functions for Multilingual Schema

**Date:** 2026-02-18
**Critical:** YES - Blocks mobile practice modes and dashboard

## Problem

After migration 082/083 (multilingual content), several RPC functions still reference the old `learning_items` table schema:

1. **get_practice_enabled_items** - Function doesn't exist (needs creation)
2. **get_due_cards_fsrs** - References `li.english`, `li.type` (no longer exist)
3. **get_progress_overview** - References `fsrs_reps` on learning_items (wrong table)

### Affected Features

- ❌ Mobile practice modes (all) - Cannot load practice items
- ❌ Mobile dashboard - "Due Cards Today" dialog fails
- ❌ Progress stats - Cannot calculate user statistics
- ❌ FSRS spaced repetition - Cannot fetch due cards

## Solution

Migration 085 updates/creates these RPC functions to work with:
- `multilingual_vocabulary` table (instead of learning_items with type='vocabulary')
- `daily_phrases` table (instead of learning_items with type='daily-phrases')

## Deployment

### Option 1: Supabase Dashboard (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `085_fix_rpc_functions_for_multilingual.sql`
3. Paste and Run
4. Verify success messages in output

### Option 2: Supabase CLI

```bash
supabase db push --db-url $DATABASE_URL --file database/migrations/085_fix_rpc_functions_for_multilingual.sql
```

### Option 3: psql (if available)

```bash
source .env.local
psql "$DATABASE_URL" -f database/migrations/085_fix_rpc_functions_for_multilingual.sql
```

## Verification

After running migration, test:

1. **Mobile Practice Modes:**
   - Visit http://localhost:3000/m/practice-modes
   - Should load without "column li.english does not exist" error
   - Practice items should load

2. **Mobile Dashboard:**
   - Visit http://localhost:3000/m
   - Click "Due Cards Today"
   - Should open without "column li.type does not exist" error

3. **Progress Stats:**
   - Dashboard should show statistics
   - No "column fsrs_reps does not exist" errors

## Changes Summary

### Created:
- `get_practice_enabled_items()` - Returns vocab + phrases with practice modes enabled

### Updated:
- `get_due_cards_fsrs(p_user_id, p_level, p_limit)` - Now queries multilingual tables
- `get_progress_overview(p_user_id, p_days)` - Now works with multilingual schema

## Rollback

If issues occur, rollback by running migrations 054 and 060 to restore original functions:
```sql
-- Restore original get_due_cards_fsrs
\i database/migrations/054_create_fsrs_rpc_functions.sql

-- Restore original get_progress_overview
\i database/migrations/060_create_progress_stats_functions.sql
```

## Related Files

- Migration: `085_fix_rpc_functions_for_multilingual.sql`
- Original FSRS functions: `054_create_fsrs_rpc_functions.sql`
- Original stats functions: `060_create_progress_stats_functions.sql`
- Multilingual migration: `082_migrate_content_to_multilingual.sql`

## Status

- [x] Migration created
- [ ] Migration deployed to database
- [ ] Verified mobile practice modes work
- [ ] Verified mobile dashboard works
- [ ] Verified progress stats work
