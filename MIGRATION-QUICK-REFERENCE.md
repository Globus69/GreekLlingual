# MIGRATION QUICK REFERENCE

**Last Updated:** February 18, 2026  
**Branch:** agent-2-admin-daily-phrases

---

## PRODUCTION MIGRATIONS (13 files)

```
060 → Spanish translations
067 → Practice modes schema
068 → Practice test data
071 → Practice modes implementation
072 → Vocabulary FSRS RPC
073 → Vocabulary stats RPC
074 → Student progress RLS fix
075 → Custom auth RLS fix
076 → Anonymous role RLS fix
077 → Daily phrases scheduling
078 → Cleanup old vocabulary
079 → Create new vocabulary
20260218 → Audio storage
```

---

## ARCHIVED FILES

### Diagnostics (12 files)
- Location: `/archive/diagnostics/`
- Purpose: Development debugging
- Status: Not for production

### Old Migrations (2 files)
- Location: `/archive/old-migrations/`
- Files: 078_add_multilingual_vocab_support.sql, 078_create_multilingual_vocabulary.sql
- Replaced by: 078_cleanup_vocabulary.sql + 079_create_vocabulary.sql

---

## RUNNING MIGRATIONS

### Production Deployment
```bash
# 1. Set database URL
export DATABASE_URL="postgresql://user:pass@host:port/database"

# 2. Run script
./scripts/run-migrations.sh
```

### Manual Execution
```bash
# Run specific migration
psql $DATABASE_URL -f supabase/migrations/078_cleanup_vocabulary.sql
psql $DATABASE_URL -f supabase/migrations/079_create_vocabulary.sql
```

---

## VERIFICATION

### Check Migration Status
```bash
# List all tables
psql $DATABASE_URL -c "\dt"

# Check vocabulary schema
psql $DATABASE_URL -c "\dt vocabulary.*"

# Check RPC functions
psql $DATABASE_URL -c "\df vocabulary.*"
```

### Verify Data
```bash
# Count vocabulary items
psql $DATABASE_URL -c "SELECT COUNT(*) FROM vocabulary.vocabulary_items;"

# Check RLS policies
psql $DATABASE_URL -c "\dp vocabulary.vocabulary_items"
```

---

## ROLLBACK

### If Migration Fails
```bash
# 1. Restore from backup
psql $DATABASE_URL < backup_20260218.sql

# 2. Check status
psql $DATABASE_URL -c "\dt vocabulary.*"
```

### Selective Rollback
```bash
# Drop vocabulary schema
psql $DATABASE_URL -c "DROP SCHEMA IF EXISTS vocabulary CASCADE;"
```

---

## FILE LOCATIONS

```
/supabase/migrations/        Production migrations
/archive/diagnostics/        Diagnostic SQL files
/archive/old-migrations/     Superseded migrations
/scripts/run-migrations.sh   Migration execution script
```

---

## DOCUMENTATION

- **Full Report:** `MIGRATION-CLEANUP-REPORT.md`
- **Archive Info:** `archive/README.md`
- **This Reference:** `MIGRATION-QUICK-REFERENCE.md`

---

## CONTACTS

**Database Issues:** Agent 15 (Database Migration Specialist)  
**Vocabulary Schema:** Agent 6, Agent 7  
**Production Deployment:** Agent 16
