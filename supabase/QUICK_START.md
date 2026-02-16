# 🚀 Quick Start: Apply Practice Modes Migration

## TL;DR - Fastest Way

```bash
# 1. Copy SQL to clipboard (Mac)
cat supabase/migrations/067_add_practice_modes.sql | pbcopy

# 2. Open Supabase Dashboard
open https://app.supabase.com/project/bzdzqmnxycnudflcnmzj/sql

# 3. Paste in SQL Editor → Click Run ✅

# 4. Verify (copy this to clipboard)
cat supabase/migrations/verify_practice_modes_web.sql | pbcopy
# Then paste in SQL Editor → Click Run ✅
```

---

## Step-by-Step Instructions

### 1️⃣ Apply the Migration

**Option A: Web UI (Easiest)**

1. Open: https://app.supabase.com/project/bzdzqmnxycnudflcnmzj/sql
2. Click **+ New query**
3. Copy-paste content of: `supabase/migrations/067_add_practice_modes.sql`
4. Click **Run** (or Cmd+Enter)
5. Look for green "Success" message ✅

**Option B: CLI (If you prefer terminal)**

```bash
# Link project (first time only)
supabase link --project-ref bzdzqmnxycnudflcnmzj

# Apply migration
supabase db push
```

### 2️⃣ Verify Migration

1. In Supabase SQL Editor, run: `supabase/migrations/verify_practice_modes_web.sql`
2. Check output for ✅ green checkmarks
3. Should see: "MIGRATION SUCCESSFUL - All components installed"

**Note**: Use `verify_practice_modes_web.sql` (works in web UI), not `verify_practice_modes.sql` (psql only)

### 3️⃣ Test in Application

**Admin Test:**
1. Log in as admin
2. Go to admin panel → Content management
3. Edit any learning item
4. Scroll down → Expand "Practice Modes Configuration"
5. Enable practice modes
6. Select modes: Matching, Multiple Choice, Write Input
7. Set activation threshold: 2 reviews
8. Configure difficulty settings
9. Click **Save** ✅

**Student Test:**
1. Log in as student
2. Go to dashboard
3. Scroll to "Practice Modes" section
4. Should see items with practice enabled
5. If locked 🔒: Complete 2 FSRS reviews to unlock
6. If unlocked 🔓: Click a practice mode button
7. Play the game!

---

## 🔍 Quick Verification Queries

Run these in SQL Editor after migration:

```sql
-- Check column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'learning_items' AND column_name = 'practice_modes_config';
-- Expected: 1 row

-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'practice_attempts';
-- Expected: 1 row

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%practice%';
-- Expected: 4 rows (get_practice_config, record_practice_attempt, get_practice_stats, admin_update_practice_config)

-- View sample config
SELECT id, english, practice_modes_config
FROM learning_items LIMIT 3;
-- Expected: Shows items with default JSONB config
```

---

## 🆘 Troubleshooting

**"relation 'learning_items' does not exist"**
- You need to run core migrations first
- Check: `SELECT * FROM learning_items LIMIT 1;`

**"function already exists"**
- Migration was already applied
- Safe to ignore or use `CREATE OR REPLACE FUNCTION`

**"permission denied"**
- Make sure you're logged into Supabase dashboard
- Check you have admin/owner permissions on project

**Migration runs but no changes visible**
- Hard refresh browser (Cmd+Shift+R)
- Clear cache and reload application
- Check Supabase logs for errors

---

## 📁 File Locations

| File | Purpose |
|------|---------|
| `supabase/migrations/067_add_practice_modes.sql` | Migration to apply |
| `supabase/migrations/verify_practice_modes.sql` | Verification script |
| `supabase/migrations/README_PRACTICE_MODES.md` | Detailed guide |
| `database/migrations/067_add_practice_modes.sql` | Original migration (same content) |
| `PRACTICE-MODES-IMPLEMENTATION.md` | Full implementation docs |

---

## ✅ Success Checklist

- [ ] Migration applied successfully
- [ ] Verification script shows all ✅ green checkmarks
- [ ] Admin can configure practice modes
- [ ] Dashboard shows "Practice Modes" section
- [ ] Student can see practice mode cards
- [ ] Practice modes unlock after FSRS reviews
- [ ] Practice games work (matching, quiz, write input)
- [ ] FSRS updates after practice completion

---

## 🎯 What's Next?

1. **Enable practice modes** for 2-3 learning items (admin panel)
2. **Complete FSRS reviews** as student to unlock practice modes
3. **Play each practice game type** to test functionality
4. **Monitor database**: Check `practice_attempts` table for recorded sessions
5. **Verify FSRS integration**: Check `student_progress` updates after practice

---

## 📞 Need Help?

- See detailed docs: `supabase/migrations/README_PRACTICE_MODES.md`
- Implementation guide: `PRACTICE-MODES-IMPLEMENTATION.md`
- Check migration history in Supabase dashboard
- Review application logs in browser console

---

**Ready to go! 🚀**

The practice modes system is fully implemented in the codebase. You just need to apply the database migration and start using it!
