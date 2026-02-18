# Git Branch Merge Strategy

**Created:** 18. Februar 2026, 14:00 CET
**Agent:** Agent 1 (Git Branch Consolidation Specialist)
**Current Branch:** agent-2-mobile-caching
**Target Branch:** main
**Total Branches to Merge:** 8

---

## Executive Summary

This document provides a comprehensive strategy for consolidating 8 feature branches into main. The strategy is based on thorough analysis of commit history, file changes, dependencies, and potential conflicts.

**Key Findings:**
- 6 branches contain overlapping mobile features (duplication detected)
- 2 admin branches build on top of mobile branches
- CRITICAL: Migration conflict detected (078/079 exist in working directory but not in current branch)
- Stash detected on agent-2-admin-daily-phrases containing CSV rename work
- mobile-testing-combined is a merge branch containing agent-1-mobile-practice + agent-2-mobile-vocabulary + agent-3-mobile-testing

**Recommended Approach:** Sequential merge with consolidation of duplicate branches first, followed by admin branches.

---

## Branch Overview

### Mobile Branches (6)

#### 1. agent-1-mobile-practice
- **Commits ahead of main:** 3
- **Files changed:** 9
- **Key changes:** Practice Modes Mobile UI implementation
- **Status:** Feature branch

#### 2. agent-2-mobile-vocabulary
- **Commits ahead of main:** 3
- **Files changed:** 9
- **Key changes:** Vocabulary Mobile UI + Practice Modes (duplicate)
- **Status:** Feature branch

#### 3. agent-3-mobile-testing
- **Commits ahead of main:** 2
- **Files changed:** 10
- **Key changes:** E2E tests, performance & accessibility audit
- **Status:** Testing branch

#### 4. mobile-testing-combined
- **Commits ahead of main:** 10
- **Files changed:** 18
- **Key changes:** Merge of agent-1-mobile-practice + agent-2-mobile-vocabulary + agent-3-mobile-testing
- **Status:** Integration branch (contains duplicates)

#### 5. agent-2-mobile-caching (CURRENT BRANCH)
- **Commits ahead of main:** 21
- **Files changed:** 145
- **Key changes:**
  - Contains ALL mobile features from other mobile branches
  - Daily Phrases Mobile UI
  - IndexedDB caching
  - Memory Games (Memory + Memory Split + Caching)
  - Practice Modes
  - Vocabulary
  - E2E tests
  - Vocabulary Management System (Admin)
  - CSV template rename
  - TypeScript fixes
- **Status:** Super-branch (most comprehensive)
- **CRITICAL ISSUE:** Untracked migrations 078/079 in working directory

#### 6. agent-1-mobile-daily-phrases
- **Status:** Not analyzed in detail (appears in branch list)
- **Relationship:** Unknown - needs investigation

### Admin Branches (3)

#### 7. agent-1-admin-audio-upload
- **Commits ahead of main:** 17
- **Files changed:** 114
- **Key changes:**
  - Audio upload & bulk edit functionality
  - Built on top of mobile-testing-combined (commits: bb27432 and earlier)
  - Contains all mobile features as base
- **Status:** Admin feature branch
- **Base:** mobile-testing-combined features

#### 8. agent-2-admin-daily-phrases
- **Commits ahead of main:** 22
- **Files changed:** 221
- **Key changes:**
  - Daily Phrases Management System
  - Quality Tools Dashboard
  - Audio upload
  - Built on top of mobile features
  - Migrations: 077, 078, 079
  - Migration 078: cleanup_vocabulary.sql
  - Migration 079: create_vocabulary.sql
  - New migration: 20260218_add_audio_storage.sql
- **Status:** Admin feature branch with STASH
- **Base:** mobile features + admin features
- **CRITICAL:** Stash contains CSV rename work in progress

#### 9. agent-3-admin-quality-tools
- **Commits ahead of main:** 17
- **Files changed:** 114
- **Key changes:**
  - Identical to agent-1-admin-audio-upload (same commit: 290644c)
  - Audio upload & bulk edit functionality
  - Built on mobile features
- **Status:** Duplicate of agent-1-admin-audio-upload

---

## Dependency Analysis

### Branch Dependency Graph

```
main (base)
  |
  +-- agent-1-mobile-practice (3 commits)
  +-- agent-2-mobile-vocabulary (3 commits, DUPLICATE of mobile-practice)
  +-- agent-3-mobile-testing (2 commits)
  |
  +-- mobile-testing-combined (merge of above 3)
  |
  +-- agent-2-mobile-caching (21 commits)
  |   |
  |   +-- Contains ALL mobile features
  |   +-- Contains Vocabulary Admin
  |   +-- PROBLEM: Untracked migrations 078/079
  |
  +-- agent-1-admin-audio-upload (17 commits)
  |   |
  |   +-- Based on mobile-testing-combined
  |
  +-- agent-3-admin-quality-tools (17 commits)
  |   |
  |   +-- DUPLICATE of agent-1-admin-audio-upload
  |
  +-- agent-2-admin-daily-phrases (22 commits)
      |
      +-- Based on admin-audio-upload + mobile features
      +-- Has migrations 077, 078, 079
      +-- PROBLEM: Stash with CSV rename work
```

### Key Insights

1. **agent-2-mobile-caching is the SUPER-BRANCH**
   - Contains all mobile work from all mobile branches
   - Most comprehensive (21 commits, 145 files)
   - Already has vocabulary admin system
   - Ready to be base for admin branches

2. **Duplicate Branches Detected:**
   - agent-1-mobile-practice ≈ agent-2-mobile-vocabulary (same 3 commits)
   - agent-1-admin-audio-upload = agent-3-admin-quality-tools (identical)
   - mobile-testing-combined is merge of 3 mobile branches

3. **Admin Branches Build on Mobile:**
   - agent-1-admin-audio-upload: mobile base + audio upload
   - agent-3-admin-quality-tools: duplicate of above
   - agent-2-admin-daily-phrases: most comprehensive admin (quality tools + daily phrases)

---

## Critical Issues

### Issue 1: Untracked Migrations 078/079 in Working Directory

**Problem:**
- Files exist: `supabase/migrations/078_cleanup_vocabulary.sql` (6099 bytes)
- Files exist: `supabase/migrations/079_create_vocabulary.sql` (11041 bytes)
- Git status: Untracked files
- Branch agent-2-mobile-caching does NOT have these migrations
- Branch agent-2-admin-daily-phrases DOES have these migrations
- Cannot switch to agent-2-admin-daily-phrases without moving these files

**Impact:**
- Blocks branch switching
- Risk of merge conflicts
- Risk of losing migration work

**Resolution Required:**
1. Determine origin of these files (from stash? from agent-2-admin-daily-phrases?)
2. Decide: Add to current branch OR stash OR remove
3. Document decision

### Issue 2: Stash on agent-2-admin-daily-phrases

**Problem:**
- Stash: "CSV rename work in progress" on agent-2-admin-daily-phrases
- Stash contains migrations 078 and 079
- Work-in-progress not committed

**Impact:**
- Uncommitted work may be lost during merge
- CSV rename work incomplete

**Resolution Required:**
1. Apply stash to branch
2. Commit work OR discard if obsolete
3. Clear stash before merge

### Issue 3: Duplicate Features

**Problem:**
- agent-1-mobile-practice has same commits as agent-2-mobile-vocabulary
- agent-1-admin-audio-upload identical to agent-3-admin-quality-tools
- mobile-testing-combined duplicates work from 3 branches

**Impact:**
- Merge conflicts likely
- Redundant commits in history
- Confusion in git log

**Resolution:**
- Use agent-2-mobile-caching as single source of truth for mobile
- Use agent-2-admin-daily-phrases for admin (includes all admin features)
- Discard/ignore duplicate branches

---

## Merge Order Strategy

### Recommended Merge Order (Sequential)

**Phase 1: Mobile Foundation**
1. **Merge agent-2-mobile-caching → main** (PRIORITY 1)
   - Reason: Contains ALL mobile features
   - Commits: 21
   - Files: 145
   - Conflicts: Likely in package.json, migrations
   - PREREQUISITE: Resolve migrations 078/079 issue

**Phase 2: Admin Features**
2. **Merge agent-2-admin-daily-phrases → main** (PRIORITY 2)
   - Reason: Most comprehensive admin branch
   - Commits: 22 (some overlap with mobile-caching)
   - Files: 221
   - Conflicts: Very likely (many overlapping files)
   - PREREQUISITE: Apply stash, resolve migrations
   - Contains: Daily Phrases Admin, Quality Tools, Audio Upload

**Phase 3: Cleanup**
3. **Delete duplicate branches**
   - agent-1-mobile-practice (contained in agent-2-mobile-caching)
   - agent-2-mobile-vocabulary (contained in agent-2-mobile-caching)
   - agent-3-mobile-testing (contained in agent-2-mobile-caching)
   - mobile-testing-combined (contained in agent-2-mobile-caching)
   - agent-1-admin-audio-upload (contained in agent-2-admin-daily-phrases)
   - agent-3-admin-quality-tools (duplicate of agent-1-admin-audio-upload)

**Phase 4: Investigation**
4. **Investigate agent-1-mobile-daily-phrases**
   - Not analyzed in detail
   - May contain unique work OR be duplicate
   - Decision after investigation

### Alternative Strategy (More Conservative)

If conflicts are too severe, use incremental approach:

**Phase 1: Mobile Testing Base**
1. Merge mobile-testing-combined → main
   - Reason: Clean merge of 3 tested branches
   - Lower risk

**Phase 2: Mobile Enhancements**
2. Cherry-pick unique commits from agent-2-mobile-caching
   - Caching features
   - Daily Phrases Mobile
   - Vocabulary Admin

**Phase 3: Admin**
3. Merge agent-2-admin-daily-phrases (rebased on updated main)

---

## Conflict Prediction

### High-Risk Files (Almost Certain Conflicts)

#### package.json
- **Branches modifying:** ALL
- **Type of changes:** Dependencies, scripts
- **Resolution:** Manual merge, prioritize agent-2-mobile-caching + agent-2-admin-daily-phrases

#### package-lock.json
- **Branches modifying:** ALL
- **Type of changes:** Dependency tree
- **Resolution:** Delete and regenerate with `npm install`

#### MASTER-SESSION-STATUS.md
- **Branches modifying:** ALL mobile branches
- **Type of changes:** Session logs, progress tracking
- **Resolution:** Keep most recent (agent-2-mobile-caching), append unique sections

#### supabase/migrations/
- **Critical:** agent-2-mobile-caching ends at 076
- **Critical:** agent-2-admin-daily-phrases has 077, 078, 079, 20260218
- **Critical:** Working directory has untracked 078, 079
- **Resolution:** MUST resolve before merge (see Issue 1)

### Medium-Risk Files (Likely Conflicts)

#### Mobile UI Files
- src/app/m/practice-modes/page.tsx
- src/app/m/vocabulary/page.tsx
- src/components/mobile/PracticeModesSheet.tsx
- **Branches:** agent-1-mobile-practice, agent-2-mobile-vocabulary, mobile-testing-combined, agent-2-mobile-caching
- **Resolution:** Use agent-2-mobile-caching version (most complete)

#### Practice Mode Components
- src/components/learning/practice-modes/memory-game.tsx
- src/components/learning/practice-modes/memory-split-game.tsx
- src/components/learning/practice-modes/practice-mode-dialog.tsx
- **Branches:** Most mobile + admin branches
- **Resolution:** Use agent-2-mobile-caching version

#### Dashboard & Stats
- src/app/dashboard/page.tsx
- src/app/m/stats/page.tsx
- **Branches:** agent-2-mobile-caching, agent-2-admin-daily-phrases
- **Resolution:** Merge changes from both (different features)

#### Admin Components
- src/app/admin/content/page.tsx
- src/components/admin/ContentTable.tsx
- src/components/admin/AudioUpload.tsx
- **Branches:** agent-1-admin-audio-upload, agent-2-admin-daily-phrases, agent-3-admin-quality-tools
- **Resolution:** Use agent-2-admin-daily-phrases (most complete)

### Low-Risk Files

#### Documentation Files
- *.md files (except MASTER-SESSION-STATUS.md)
- **Resolution:** Usually additive, keep all or most recent

#### Test Files
- tests/mobile/*.ts
- **Resolution:** Keep all tests, merge suites

---

## Pre-Merge Checklist

### Before Starting ANY Merge

- [ ] **CRITICAL: Resolve migrations 078/079 issue**
  - [ ] Backup current 078/079 files
  - [ ] Decide: commit to agent-2-mobile-caching OR remove OR stash
  - [ ] Document decision in BRANCH-CONFLICT-REPORT.md

- [ ] **Resolve stash on agent-2-admin-daily-phrases**
  - [ ] Checkout agent-2-admin-daily-phrases
  - [ ] Apply stash: `git stash pop stash@{0}`
  - [ ] Review CSV rename changes
  - [ ] Decide: commit OR discard
  - [ ] Clear stash

- [ ] **Backup main branch**
  - [ ] Create backup branch: `git branch main-backup-20260218 main`
  - [ ] Push to remote: `git push origin main-backup-20260218`

- [ ] **Create test branch for merge practice**
  - [ ] `git checkout -b merge-test-20260218 main`
  - [ ] Practice merge on test branch first
  - [ ] If successful, repeat on main

- [ ] **Verify build on each branch before merge**
  - [ ] agent-2-mobile-caching: `npm run build`
  - [ ] agent-2-admin-daily-phrases: `npm run build`
  - [ ] Document any build errors

- [ ] **Run tests on each branch**
  - [ ] `npm test`
  - [ ] Document test failures

---

## Step-by-Step Merge Instructions

### Phase 1: Resolve Pre-Merge Issues

#### Step 1.1: Handle Migrations 078/079

```bash
# Check current status
git status

# Option A: Add to current branch (if they belong here)
git add supabase/migrations/078_cleanup_vocabulary.sql
git add supabase/migrations/079_create_vocabulary.sql
git commit -m "feat(migrations): Add vocabulary cleanup and creation migrations"

# Option B: Stash them (if unsure)
git stash push -u supabase/migrations/078_cleanup_vocabulary.sql supabase/migrations/079_create_vocabulary.sql -m "Migrations 078/079 for later review"

# Option C: Remove them (if they're from another branch and shouldn't be here)
rm supabase/migrations/078_cleanup_vocabulary.sql
rm supabase/migrations/079_create_vocabulary.sql
```

**DECISION REQUIRED:** User must choose Option A, B, or C.

#### Step 1.2: Resolve Stash on agent-2-admin-daily-phrases

```bash
# Switch to branch (after resolving migrations above)
git checkout agent-2-admin-daily-phrases

# List stashes
git stash list

# Show stash contents
git stash show -p stash@{0}

# Apply stash
git stash pop stash@{0}

# Review changes
git status
git diff

# Decision: Commit or discard
# If commit:
git add .
git commit -m "feat(csv): Complete CSV template rename work"

# If discard:
git restore .

# Return to original branch
git checkout agent-2-mobile-caching
```

### Phase 2: Create Backup

```bash
# Ensure on main
git checkout main

# Create backup
git branch main-backup-20260218
git push origin main-backup-20260218

# Create test merge branch
git checkout -b merge-test-20260218
```

### Phase 3: Test Merge (on merge-test branch)

#### Step 3.1: Test Merge agent-2-mobile-caching

```bash
# Ensure on test branch
git checkout merge-test-20260218

# Merge
git merge --no-ff agent-2-mobile-caching -m "Merge agent-2-mobile-caching: Mobile features + caching + vocabulary admin"

# If conflicts occur:
git status
# Review conflicted files (see Conflict Resolution Guidelines below)

# After resolving conflicts:
git add .
git merge --continue

# Test build
npm install
npm run build

# If build fails, fix errors and commit:
git add .
git commit -m "fix: Resolve build errors after merge"

# Test application
npm run dev
# Manual testing required
```

#### Step 3.2: Test Merge agent-2-admin-daily-phrases

```bash
# Still on merge-test-20260218
git merge --no-ff agent-2-admin-daily-phrases -m "Merge agent-2-admin-daily-phrases: Admin features + daily phrases"

# If conflicts:
git status
# Resolve conflicts (prioritize admin-daily-phrases for admin features)

git add .
git merge --continue

# Test build
npm run build

# If build fails:
# Fix and commit

# Test application
npm run dev
```

### Phase 4: Actual Merge (if test successful)

If merge-test-20260218 builds and runs successfully:

```bash
# Switch to main
git checkout main

# Merge agent-2-mobile-caching
git merge --no-ff agent-2-mobile-caching -m "Merge agent-2-mobile-caching: Mobile features + caching + vocabulary admin

- Daily Phrases Mobile UI
- IndexedDB caching for offline support
- Memory Games (Memory + Memory Split)
- Practice Modes Mobile UI
- Vocabulary Mobile Card Learning
- E2E tests infrastructure
- Vocabulary Management System (Admin)
- CSV template German naming
- TypeScript & ESLint fixes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Verify
npm install
npm run build
npm test

# Commit any fixes
git add .
git commit -m "fix: Post-merge build fixes"

# Merge agent-2-admin-daily-phrases
git merge --no-ff agent-2-admin-daily-phrases -m "Merge agent-2-admin-daily-phrases: Admin management features

- Daily Phrases Management System
- Quality Tools Dashboard
- Audio upload & bulk edit
- Migrations: 077, 078, 079, 20260218
- Production deployment strategy
- Migration cleanup

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Resolve conflicts (expected)
# Follow conflict resolution guidelines

git add .
git merge --continue

# Verify
npm run build
npm test

# Push to remote
git push origin main
```

### Phase 5: Cleanup Branches

```bash
# Delete local duplicate branches
git branch -d agent-1-mobile-practice
git branch -d agent-2-mobile-vocabulary
git branch -d agent-3-mobile-testing
git branch -d mobile-testing-combined
git branch -d agent-1-admin-audio-upload
git branch -d agent-3-admin-quality-tools

# Delete remote branches (if pushed)
git push origin --delete agent-1-mobile-practice
git push origin --delete agent-2-mobile-vocabulary
git push origin --delete agent-3-mobile-testing
git push origin --delete mobile-testing-combined
git push origin --delete agent-1-admin-audio-upload
git push origin --delete agent-3-admin-quality-tools

# Keep for reference:
# - agent-2-mobile-caching (merged)
# - agent-2-admin-daily-phrases (merged)
# - agent-1-mobile-daily-phrases (investigate first)
```

---

## Conflict Resolution Guidelines

### General Strategy

1. **Understand the conflict:**
   - Read both versions carefully
   - Check git log for context: `git log --oneline <branch> -- <file>`

2. **Prioritize:**
   - For mobile features: Use agent-2-mobile-caching version (most tested)
   - For admin features: Use agent-2-admin-daily-phrases version
   - For shared files: Merge carefully, keep both if possible

3. **Common conflict types:**

#### Type 1: package.json Dependencies

```bash
# Accept both sets of dependencies
# Manually merge "dependencies" and "devDependencies" objects
# Then regenerate lock file:
npm install
```

#### Type 2: Migration Files

```bash
# Keep all migrations
# Renumber if necessary
# Ensure sequential order: 077, 078, 079, 080, etc.
# Do NOT skip numbers
```

#### Type 3: Component Files (Complete Rewrites)

```bash
# If one branch has complete rewrite and other has minor changes:
# - Accept complete rewrite
# - Cherry-pick important changes from other branch if needed
```

#### Type 4: Documentation Files

```bash
# Usually keep both
# Or use most recent
# For MASTER-SESSION-STATUS.md: merge chronologically
```

### Specific File Resolutions

#### package.json
- Merge all dependencies alphabetically
- Keep highest version if conflict
- Regenerate package-lock.json: `npm install`

#### supabase/migrations/
- Keep all migration files
- Ensure sequential numbering
- agent-2-mobile-caching: up to 076
- agent-2-admin-daily-phrases: 077, 078, 079, 20260218
- Final: 060, 067, 068, 069*, 070*, 071, 072, 073, 074, 075, 076, 077, 078, 079, 20260218

#### src/app/m/practice-modes/page.tsx
- Use agent-2-mobile-caching version (most complete: 494 lines)

#### src/app/m/vocabulary/page.tsx
- Use agent-2-mobile-caching version (most complete: 745 lines)

#### src/app/admin/content/page.tsx
- Use agent-2-admin-daily-phrases version (has admin features)

#### MASTER-SESSION-STATUS.md
- Use agent-2-mobile-caching as base
- Append unique sessions from agent-2-admin-daily-phrases
- Maintain chronological order

---

## Testing After Merge

### Build Test

```bash
npm install
npm run build
```

**Expected:** Clean build with no errors.

**If errors:**
- Fix TypeScript errors
- Fix ESLint errors
- Commit fixes: `git commit -m "fix: Post-merge build errors"`

### Lint Test

```bash
npm run lint
```

**Expected:** No linting errors.

### Migration Test

```bash
# Check migration count
ls supabase/migrations/*.sql | wc -l

# Expected: ~24 migrations (including 078, 079, 20260218)

# Verify sequential order
ls supabase/migrations/*.sql | grep -E "^supabase/migrations/[0-9]{3}_" | sort
```

**Expected:** Sequential numbering with no gaps.

### Application Test (Manual)

```bash
npm run dev
```

**Test checklist:**
- [ ] Mobile Dashboard loads (`/m`)
- [ ] Mobile Stats loads (`/m/stats`)
- [ ] Mobile Settings loads (`/m/settings`)
- [ ] Mobile Vocabulary loads (`/m/vocabulary`)
- [ ] Mobile Practice Modes loads (`/m/practice-modes`)
- [ ] Mobile Memory Game loads (`/m/practice-modes/memory`)
- [ ] Mobile Memory Split loads (`/m/practice-modes/memory-split`)
- [ ] Mobile Daily Phrases loads (`/m/daily-phrases`)
- [ ] Admin Content loads (`/admin/content`)
- [ ] Admin Vocabulary loads (`/admin/vocab`)
- [ ] Admin Daily Phrases loads (`/admin/daily-phrases`)
- [ ] Admin Quality Tools loads (`/admin/quality`)
- [ ] No console errors
- [ ] No 404 errors
- [ ] No API errors

### E2E Test (If Available)

```bash
npm run test:e2e
```

**Expected:** Tests pass or skipped (if not yet implemented).

---

## Rollback Procedures

### If Merge Fails on Test Branch

```bash
# Simply delete test branch and start over
git checkout main
git branch -D merge-test-20260218
git checkout -b merge-test-20260218-v2
# Try again with different approach
```

### If Merge Fails on Main Branch

#### Option A: Reset to Backup

```bash
# DANGEROUS: Only if no one else has pulled
git reset --hard main-backup-20260218
git push --force origin main
```

#### Option B: Revert Merge Commits

```bash
# Safer: Preserves history
git log --oneline -10
# Find merge commit hash (e.g., abc1234)

git revert -m 1 <merge-commit-hash>
git push origin main
```

#### Option C: Create Hotfix Branch

```bash
# If main is broken but pushed
git checkout -b hotfix-merge-issues
# Fix issues
git commit -m "fix: Resolve merge issues"
git checkout main
git merge hotfix-merge-issues
git push origin main
```

---

## Post-Merge Checklist

### Immediate

- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Application runs: `npm run dev`
- [ ] No console errors in browser
- [ ] Core features work (Dashboard, Vocabulary, Practice Modes)

### Within 24 Hours

- [ ] Full manual testing of all routes
- [ ] Database migrations applied to dev/staging
- [ ] E2E tests run (if available)
- [ ] Performance testing (Lighthouse)
- [ ] Accessibility testing

### Within 1 Week

- [ ] Delete merged branches locally
- [ ] Delete merged branches on remote
- [ ] Update MASTER-SESSION-STATUS.md
- [ ] Update CURRENT-WORK.md
- [ ] Tag release: `git tag v1.0.0-merged`
- [ ] Push tag: `git push origin v1.0.0-merged`

---

## Risk Assessment

### High Risk

1. **Migration conflicts (078/079)**
   - **Risk:** Data loss, database corruption
   - **Mitigation:** Resolve before merge, backup database
   - **Severity:** CRITICAL

2. **Package.json conflicts**
   - **Risk:** Dependency hell, broken builds
   - **Mitigation:** Careful manual merge, regenerate lock file
   - **Severity:** HIGH

3. **Overlapping component rewrites**
   - **Risk:** Loss of features, broken functionality
   - **Mitigation:** Use most complete version, test thoroughly
   - **Severity:** HIGH

### Medium Risk

1. **Documentation conflicts**
   - **Risk:** Lost session notes
   - **Mitigation:** Merge chronologically
   - **Severity:** MEDIUM

2. **Test file conflicts**
   - **Risk:** Lost test coverage
   - **Mitigation:** Keep all tests
   - **Severity:** MEDIUM

### Low Risk

1. **CSS/Style conflicts**
   - **Risk:** Visual inconsistencies
   - **Mitigation:** Manual review, use mobile-first styles
   - **Severity:** LOW

---

## Success Criteria

The merge is considered successful when:

1. ✅ All branches merged into main
2. ✅ `npm run build` succeeds with no errors
3. ✅ `npm test` passes (or skips if no tests)
4. ✅ Application runs without console errors
5. ✅ All routes accessible:
   - `/m` (Mobile Dashboard)
   - `/m/stats` (Mobile Stats)
   - `/m/settings` (Mobile Settings)
   - `/m/vocabulary` (Mobile Vocabulary)
   - `/m/practice-modes` (Mobile Practice Modes)
   - `/m/daily-phrases` (Mobile Daily Phrases)
   - `/admin/content` (Admin Content)
   - `/admin/vocab` (Admin Vocabulary)
   - `/admin/daily-phrases` (Admin Daily Phrases)
6. ✅ Database migrations sequential (no gaps)
7. ✅ No duplicate code between branches
8. ✅ Git history clean (no unnecessary merge commits)
9. ✅ Documentation updated (MASTER-SESSION-STATUS.md)
10. ✅ Backup branch created and pushed

---

## Timeline Estimate

### Conservative Estimate (Thorough Testing)

- **Phase 1 (Pre-Merge):** 2-3 hours
  - Resolve migrations: 30 min
  - Resolve stash: 30 min
  - Create backups: 15 min
  - Verify builds: 30 min
  - Create test branch: 15 min

- **Phase 2 (Test Merge):** 3-4 hours
  - Merge mobile-caching: 1-2 hours
  - Resolve conflicts: 1 hour
  - Test build: 30 min
  - Merge admin-daily-phrases: 1-2 hours
  - Resolve conflicts: 1 hour
  - Test build: 30 min

- **Phase 3 (Actual Merge):** 1-2 hours
  - Repeat merges on main: 1 hour
  - Final testing: 30 min
  - Push to remote: 10 min

- **Phase 4 (Cleanup):** 30 min
  - Delete branches: 15 min
  - Update docs: 15 min

**Total:** 6.5 - 9.5 hours

### Aggressive Estimate (Minimal Testing)

- **Total:** 3-4 hours
- **Risk:** HIGH (not recommended)

**Recommendation:** Use conservative approach. The time investment is worth avoiding a broken main branch.

---

## Appendix A: Branch Commit Details

### agent-2-mobile-caching (21 commits)

```
89898cf feat(admin): Add complete Vocabulary Management System with testing infrastructure
a8bc964 docs: Add Agent 19 completion summary
6668cd7 fix: resolve eslint errors and verify build process
29f5f50 fix: resolve all TypeScript compilation errors
11f04f9 feat(templates): Rename CSV templates to German naming convention
bb27432 docs: Update Agent2 + Master Status after Memory Games caching + Stats fix
c5bfbbd feat(mobile): Memory Games caching + Stats page mobile optimization
b684eb5 feat(mobile): Memory Split 5 features + Matching 406 fix + Analysis
ff16927 test(mobile): Execute E2E tests and document findings
8f04249 feat(mobile): Implement Daily Phrases Mobile UI
4ddfcfb feat(mobile): Add IndexedDB caching for offline support
4effa87 Merge branch 'agent-2-mobile-vocabulary' into mobile-testing-combined
3ebd388 Merge branch 'agent-1-mobile-practice' into mobile-testing-combined
76ecee2 docs(agent-3): Add completion summary and hand-off guide
f15c4ac test(mobile): Add E2E tests, performance & accessibility audit
d374a6e feat(mobile): Implement Practice Modes Mobile UI
abf2bda docs: Add testing checklist for Vocabulary Mobile UI
963824f feat(mobile): Implement Practice Modes Mobile UI
e94c7c5 docs: Add testing checklist for Vocabulary Mobile UI
72c6e4d feat(mobile): Implement Vocabulary Mobile Card Learning UI
4b3785d feat(mobile): Implement Vocabulary Mobile Card Learning UI
```

### agent-2-admin-daily-phrases (22 commits)

```
de15531 docs: Add Agent 16 executive summary and completion report
52d0651 docs: Add production deployment strategy and checklists
bba26eb chore: clean up migrations and move diagnostic files to archive
f40ff23 feat(admin): Implement Daily Phrases Management System
72623d6 feat(admin): Implement Quality Tools Dashboard (Phase 3)
290644c feat(admin): Implement audio upload & bulk edit functionality
[... plus 16 mobile commits from base ...]
```

---

## Appendix B: File Overlap Matrix

| File | mobile-caching | admin-daily-phrases | Conflict Risk |
|------|----------------|---------------------|---------------|
| package.json | ✅ | ✅ | HIGH |
| package-lock.json | ✅ | ✅ | HIGH |
| MASTER-SESSION-STATUS.md | ✅ | ✅ | HIGH |
| src/app/m/practice-modes/page.tsx | ✅ | ✅ | HIGH |
| src/app/m/vocabulary/page.tsx | ✅ | ✅ | MEDIUM |
| src/app/admin/content/page.tsx | ✅ | ✅ | MEDIUM |
| src/components/mobile/PracticeModesSheet.tsx | ✅ | ✅ | MEDIUM |
| src/app/dashboard/page.tsx | ✅ | ✅ | MEDIUM |
| supabase/migrations/* | up to 076 | 077-079 + 20260218 | CRITICAL |

---

## Contact & Support

**Created by:** Agent 1 (Git Branch Consolidation Specialist)
**Date:** 18. Februar 2026
**Status:** ✅ COMPLETE

**Related Documents:**
- BRANCH-CONFLICT-REPORT.md (detailed conflict analysis)
- MOBILE-FIRST-STRATEGY.md (development strategy)
- MASTER-SESSION-STATUS.md (project status)

**For Questions:**
- See BRANCH-CONFLICT-REPORT.md for specific file conflicts
- See commit logs for change context: `git log --oneline <branch>`
- Test on merge-test branch before committing to main

---

**END OF GIT-MERGE-STRATEGY.md**
