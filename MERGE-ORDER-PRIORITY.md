# Git Branch Merge Order Priority List

**Created:** 18. Februar 2026, 14:45 CET
**Agent:** Agent 1 (Git Branch Consolidation Specialist)
**Purpose:** Quick reference for sequential merge execution

---

## Recommended Merge Order (1-8)

### PRIORITY 1: agent-2-mobile-caching → main
**Status:** 🟢 READY (after resolving migrations 078/079)
**Reason:** Contains ALL mobile features from all mobile branches (super-branch)
**Commits:** 21
**Files:** 145
**Contains:**
- Daily Phrases Mobile UI
- IndexedDB caching + offline support
- Memory Games (Memory + Memory Split) with caching
- Practice Modes Mobile UI
- Vocabulary Mobile Card Learning
- E2E tests infrastructure
- Vocabulary Management System (Admin)
- CSV template German naming
- TypeScript & ESLint fixes

**Dependencies:** None (standalone)
**Conflicts Expected:** Medium (package.json, MASTER-SESSION-STATUS.md, migrations)
**Estimated Time:** 2-3 hours

**Prerequisites:**
- [ ] CRITICAL: Resolve untracked migrations 078/079 in working directory
- [ ] Create backup: `git branch main-backup-20260218 main`
- [ ] Test build on branch: `npm run build`

---

### PRIORITY 2: agent-2-admin-daily-phrases → main
**Status:** 🟡 BLOCKED (requires stash resolution + migration coordination)
**Reason:** Most comprehensive admin branch (includes all admin features)
**Commits:** 22
**Files:** 221
**Contains:**
- Daily Phrases Management System
- Quality Tools Dashboard (Phase 3)
- Audio upload & bulk edit functionality
- Migrations: 077, 078, 079, 20260218_add_audio_storage
- Production deployment strategy
- Migration cleanup documentation

**Dependencies:** Should merge AFTER agent-2-mobile-caching (built on top of mobile)
**Conflicts Expected:** High (many overlapping files with mobile-caching)
**Estimated Time:** 2-3 hours

**Prerequisites:**
- [ ] CRITICAL: Apply and commit stash on agent-2-admin-daily-phrases
- [ ] Verify migrations 078/079 not duplicated
- [ ] Test build on branch: `npm run build`

---

### PRIORITY 3-8: DELETE DUPLICATE BRANCHES

These branches are DUPLICATES and should be deleted, not merged:

#### 3. agent-1-mobile-practice - DELETE
**Status:** 🔴 DUPLICATE
**Reason:** All work contained in agent-2-mobile-caching
**Commits:** 3 (identical to commits in mobile-caching)
**Action:** Delete locally and remotely

#### 4. agent-2-mobile-vocabulary - DELETE
**Status:** 🔴 DUPLICATE
**Reason:** Identical to agent-1-mobile-practice, contained in mobile-caching
**Commits:** 3 (same as mobile-practice)
**Action:** Delete locally and remotely

#### 5. agent-3-mobile-testing - DELETE
**Status:** 🔴 DUPLICATE
**Reason:** E2E tests contained in agent-2-mobile-caching
**Commits:** 2 (contained in mobile-caching)
**Action:** Delete locally and remotely

#### 6. mobile-testing-combined - DELETE
**Status:** 🔴 DUPLICATE INTEGRATION BRANCH
**Reason:** Merge of agent-1-mobile-practice + agent-2-mobile-vocabulary + agent-3-mobile-testing
**Commits:** 10 (all contained in agent-2-mobile-caching)
**Action:** Delete locally and remotely

#### 7. agent-1-admin-audio-upload - DELETE
**Status:** 🔴 DUPLICATE
**Reason:** Audio upload work contained in agent-2-admin-daily-phrases
**Commits:** 17 (contained in admin-daily-phrases)
**Action:** Delete locally and remotely

#### 8. agent-3-admin-quality-tools - DELETE
**Status:** 🔴 DUPLICATE (IDENTICAL to agent-1-admin-audio-upload)
**Reason:** Exact duplicate of agent-1-admin-audio-upload
**Commits:** 17 (identical to audio-upload)
**Action:** Delete locally and remotely

---

## BONUS: agent-1-mobile-daily-phrases - INVESTIGATE

**Status:** ⚠️ UNKNOWN
**Reason:** Not analyzed in detail, appears in branch list
**Action Required:** Investigate before deciding to merge or delete

**Investigation Commands:**
```bash
git log main..agent-1-mobile-daily-phrases --oneline
git diff --name-only main...agent-1-mobile-daily-phrases
git diff --stat main...agent-1-mobile-daily-phrases
```

**Decision Criteria:**
- If contains unique work → Merge after agent-2-mobile-caching
- If duplicate of mobile-caching → Delete
- If contains commits not in mobile-caching → Evaluate individually

---

## Execution Commands

### Phase 1: Resolve Prerequisites

```bash
# 1.1 Resolve migrations 078/079 (CHOOSE ONE)

# Option A: Add to current branch
git add supabase/migrations/078_cleanup_vocabulary.sql
git add supabase/migrations/079_create_vocabulary.sql
git commit -m "feat(migrations): Add vocabulary cleanup and creation migrations (078/079)"

# Option B: Remove (they'll come from admin-daily-phrases)
rm supabase/migrations/078_cleanup_vocabulary.sql
rm supabase/migrations/079_create_vocabulary.sql

# 1.2 Resolve stash on agent-2-admin-daily-phrases
git checkout agent-2-admin-daily-phrases
git stash pop stash@{0}
# Review changes
git add .
git commit -m "feat(csv): Complete CSV template rename work"
# OR: git restore . (if discarding)

# 1.3 Return to starting branch
git checkout agent-2-mobile-caching
```

### Phase 2: Create Backups

```bash
git checkout main
git branch main-backup-20260218
git push origin main-backup-20260218
git checkout -b merge-test-20260218
```

### Phase 3: Test Merge (Priority 1)

```bash
git checkout merge-test-20260218
git merge --no-ff agent-2-mobile-caching -m "TEST: Merge agent-2-mobile-caching"
# Resolve conflicts
npm install
npm run build
npm run dev
# Test manually
```

### Phase 4: Test Merge (Priority 2)

```bash
git merge --no-ff agent-2-admin-daily-phrases -m "TEST: Merge agent-2-admin-daily-phrases"
# Resolve conflicts
npm install
npm run build
npm run dev
# Test manually
```

### Phase 5: Actual Merge (if test successful)

```bash
git checkout main

# Merge Priority 1
git merge --no-ff agent-2-mobile-caching -m "Merge agent-2-mobile-caching: Mobile features + caching + vocabulary admin

- Daily Phrases Mobile UI
- IndexedDB caching for offline support
- Memory Games (Memory + Memory Split) with caching
- Practice Modes Mobile UI
- Vocabulary Mobile Card Learning
- E2E tests infrastructure
- Vocabulary Management System (Admin)
- CSV template German naming
- TypeScript & ESLint fixes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

npm install
npm run build

# Merge Priority 2
git merge --no-ff agent-2-admin-daily-phrases -m "Merge agent-2-admin-daily-phrases: Admin management features

- Daily Phrases Management System
- Quality Tools Dashboard
- Audio upload & bulk edit
- Migrations: 077, 078, 079, 20260218
- Production deployment strategy
- Migration cleanup

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

npm install
npm run build

# Push
git push origin main
```

### Phase 6: Delete Duplicate Branches

```bash
# Delete locally
git branch -d agent-1-mobile-practice
git branch -d agent-2-mobile-vocabulary
git branch -d agent-3-mobile-testing
git branch -d mobile-testing-combined
git branch -d agent-1-admin-audio-upload
git branch -d agent-3-admin-quality-tools

# Delete remotely (if pushed)
git push origin --delete agent-1-mobile-practice
git push origin --delete agent-2-mobile-vocabulary
git push origin --delete agent-3-mobile-testing
git push origin --delete mobile-testing-combined
git push origin --delete agent-1-admin-audio-upload
git push origin --delete agent-3-admin-quality-tools
```

---

## Quick Decision Matrix

| Branch | Merge? | Delete? | Reason |
|--------|--------|---------|--------|
| agent-2-mobile-caching | ✅ YES (1st) | ❌ NO | Super-branch, all mobile features |
| agent-2-admin-daily-phrases | ✅ YES (2nd) | ❌ NO | All admin features |
| agent-1-mobile-practice | ❌ NO | ✅ YES | Duplicate (in mobile-caching) |
| agent-2-mobile-vocabulary | ❌ NO | ✅ YES | Duplicate (in mobile-caching) |
| agent-3-mobile-testing | ❌ NO | ✅ YES | Duplicate (in mobile-caching) |
| mobile-testing-combined | ❌ NO | ✅ YES | Integration branch (in mobile-caching) |
| agent-1-admin-audio-upload | ❌ NO | ✅ YES | Duplicate (in admin-daily-phrases) |
| agent-3-admin-quality-tools | ❌ NO | ✅ YES | Duplicate (identical to audio-upload) |
| agent-1-mobile-daily-phrases | ⚠️ INVESTIGATE | ⚠️ TBD | Unknown, requires analysis |

---

## Conflict Hotspots

### Files Requiring Manual Resolution

**CRITICAL:**
1. supabase/migrations/078_cleanup_vocabulary.sql (untracked in working dir)
2. supabase/migrations/079_create_vocabulary.sql (untracked in working dir)
3. Stash on agent-2-admin-daily-phrases (CSV rename work)

**HIGH:**
1. package.json (dependencies)
2. package-lock.json (regenerate)
3. MASTER-SESSION-STATUS.md (merge chronologically)
4. src/app/m/practice-modes/page.tsx (use mobile-caching)
5. src/app/m/vocabulary/page.tsx (use mobile-caching)
6. src/app/admin/content/page.tsx (use admin-daily-phrases)

**MEDIUM:**
1. src/app/globals.css (merge both)
2. src/components/mobile/MobileBottomNav.tsx (use mobile-caching)
3. Documentation files (merge chronologically)

---

## Success Checklist

**After Priority 1 Merge (agent-2-mobile-caching):**
- [ ] Build succeeds: `npm run build`
- [ ] Dev server runs: `npm run dev`
- [ ] Mobile dashboard loads: `/m`
- [ ] Mobile vocabulary loads: `/m/vocabulary`
- [ ] Mobile practice modes load: `/m/practice-modes`
- [ ] Memory games load: `/m/practice-modes/memory`
- [ ] No console errors

**After Priority 2 Merge (agent-2-admin-daily-phrases):**
- [ ] Build succeeds: `npm run build`
- [ ] Dev server runs: `npm run dev`
- [ ] Admin content loads: `/admin/content`
- [ ] Admin vocabulary loads: `/admin/vocab`
- [ ] Admin daily phrases loads: `/admin/daily-phrases`
- [ ] Audio upload works
- [ ] Quality tools accessible
- [ ] No console errors

**After Branch Cleanup:**
- [ ] All duplicate branches deleted locally
- [ ] All duplicate branches deleted remotely
- [ ] Git log is clean: `git log --oneline --graph -20`
- [ ] Only kept branches: main, agent-2-mobile-caching, agent-2-admin-daily-phrases
- [ ] MASTER-SESSION-STATUS.md updated
- [ ] CURRENT-WORK.md updated

---

## Timeline

**Conservative Estimate:**
- Prerequisites: 2-3 hours
- Test merge: 3-4 hours
- Actual merge: 1-2 hours
- Cleanup: 30 min
- **Total: 6.5-9.5 hours**

**Aggressive Estimate:**
- **Total: 3-4 hours**
- **Risk: HIGH (not recommended)**

**Recommendation:** Use conservative approach (6.5-9.5 hours).

---

## Emergency Rollback

**If merge fails on main:**

```bash
# Option A: Reset to backup (DANGEROUS, use only if no one else pulled)
git reset --hard main-backup-20260218
git push --force origin main

# Option B: Revert merge commits (SAFER)
git log --oneline -10  # Find merge commit hash
git revert -m 1 <merge-commit-hash>
git push origin main
```

---

**Status:** ✅ READY FOR EXECUTION
**Created By:** Agent 1
**Date:** 18. Februar 2026, 14:45 CET

**Related Documents:**
- GIT-MERGE-STRATEGY.md (comprehensive strategy)
- BRANCH-CONFLICT-REPORT.md (detailed conflict analysis)

---

**END OF MERGE-ORDER-PRIORITY.md**
