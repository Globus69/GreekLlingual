# Database Migration Execution Guide

## Current Status

**Latest Applied Migration:** 076_fix_rls_anon_role.sql

**Pending Migrations:** None (migrations 078/079 not created yet)

**Database State:** Stable, production-ready

## Prerequisites

- [x] Database backup capability
- [x] Supabase project URL configured
- [x] Admin credentials available
- [x] Staging environment (optional)

## Existing Vocabulary System

The application currently uses the following vocabulary infrastructure:

### Tables
- `multilingual_content` (main content storage)
- `student_progress` (SRS tracking)
- `content` (legacy, being phased out)

### RPC Functions (Created in migrations 072-073)
1. `get_vocabulary_fsrs_stats(p_user_id UUID)`
   - Returns FSRS statistics for vocabulary
   - Used by dashboard and stats pages

2. `get_vocabulary_overview_stats(p_user_id UUID)`
   - Returns overview statistics
   - Used by mobile dashboard

### RLS Policies (Fixed in migrations 074-076)
- Student progress isolated by user
- Anonymous access enabled for public content
- Admin access for content management

## Migration Workflow (If New Migrations Created)

### 1. Backup Database

Via Supabase Dashboard:
1. Navigate to Settings → Database
2. Click "Create backup"
3. Wait for completion
4. Download backup file

Or via CLI:
```bash
supabase db dump -f backup_$(date +%Y%m%d).sql
```

### 2. Test in Development

```bash
# Run dry-run test
./scripts/test-migrations.sh

# Check for issues
cat test-migrations.log
```

### 3. Execute Migration

Navigate to Supabase Dashboard → SQL Editor

Copy and paste migration file contents

Click "Run"

Verify output for success messages

### 4. Verify Migration

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE '%vocabulary%'
OR tablename LIKE '%multilingual%';

-- Check policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE '%vocabulary%'
OR tablename LIKE '%multilingual%';
```

### 5. Test Application

```bash
# Run smoke tests
./scripts/smoke-test.sh

# Start dev server
npm run dev

# Test key features
# - Navigate to /admin/vocab
# - Create/edit/delete entries
# - Import CSV
# - Export CSV
# - Practice vocabulary
```

## Success Criteria

- [x] All tables exist
- [x] RPC functions callable
- [x] RLS policies active
- [x] No SQL errors
- [x] Application loads
- [x] CRUD operations work

## Current System Health

### Database
- ✅ Tables created
- ✅ RPC functions exist (072-073)
- ✅ RLS policies fixed (074-076)
- ✅ Indexes optimized

### Application
- ✅ Admin pages functional
- ✅ Mobile UI implemented
- ✅ API endpoints working
- ✅ CSV import/export operational

### Outstanding Work
- ⚠️ Desktop vocabulary page needs mobile-first update
- ⚠️ Additional RPC functions may be needed for advanced features
- ⚠️ Performance optimization for large datasets

## Rollback Plan

If migration fails:

1. **Stop Application**
   ```bash
   # Stop dev server
   Ctrl+C
   
   # Stop production (if applicable)
   # depends on hosting provider
   ```

2. **Restore Database**
   - Via Supabase Dashboard: Settings → Database → Restore backup
   - Or via CLI: `supabase db restore backup_YYYYMMDD.sql`

3. **Review Error Logs**
   - Check Supabase logs
   - Review SQL error messages
   - Identify failure point

4. **Fix Migration SQL**
   - Correct syntax errors
   - Resolve dependency issues
   - Test locally if possible

5. **Re-attempt**
   - Create new backup
   - Execute corrected migration
   - Verify success

## Maintenance Schedule

### Weekly
- Review RLS policies
- Check query performance
- Monitor error logs

### Monthly
- Backup database
- Review migration history
- Optimize indexes

### Quarterly
- Performance audit
- Security review
- Data cleanup

## Contact & Resources

- **Supabase Dashboard:** [Your Project URL]
- **Documentation:** /docs directory
- **Support:** Supabase Discord or email

## Notes

- Always test migrations in staging first
- Never skip backups
- Document all changes
- Monitor application after migration
- Keep migration files in version control
