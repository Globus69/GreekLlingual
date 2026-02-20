# Agent 4 - Git Merge Execution Plan
**Created:** 18. Februar 2026, 14:15 CET
**Status:** READY TO EXECUTE (waiting for User Security Tests completion)
**Estimated Time:** 3-4h (Aggressive) | 6.5-9.5h (Conservative)

---

## PREREQUISITES (MUST BE DONE FIRST)

### ✅ Completed:
- ✅ Agent 1: Git Branch Analysis (COMPLETE)
- ✅ Agent 2: Database Migration Fix (COMPLETE)
- ✅ Migrations 077, 078, 079 restored and committed (af4b790)
- ✅ Consolidation Audit complete

### ⏳ In Progress:
- ⏳ User: Security Tests Manual (2-4h remaining)

### 🔴 CRITICAL - Must resolve BEFORE any merge:

#### 1. Stash on agent-2-admin-daily-phrases
**Problem:** Branch has stash containing CSV rename work + migrations 078/079
**Location:** `refs/stash` (63ac51e)

**Options:**
- **A. Apply Stash:** Integrate CSV rename work into branch
- **B. Discard Stash:** Drop stash, use current state only
- **C. Create Separate Branch:** Save stash work for later

**Recommendation:** Option B (Discard) - Migrations already restored in agent-2-mobile-caching

**Command:**
```bash
git checkout agent-2-admin-daily-phrases
git stash list  # Verify stash exists
git stash drop  # Discard stash (CSV rename already done)
git checkout agent-2-mobile-caching
```

#### 2. Create Backup Branch
**Critical Safety:** Create backup BEFORE any merge operations

**Command:**
```bash
git branch main-backup-20260218 main
git branch agent-2-mobile-caching-backup agent-2-mobile-caching
git branch agent-2-admin-daily-phrases-backup agent-2-admin-daily-phrases
```

---

## MERGE STRATEGY SUMMARY (from Agent 1)

### Branches to MERGE (2):
1. **agent-2-mobile-caching** → main (FIRST)
   - 21 commits, 145 files
   - Contains ALL mobile features
   - Contains Vocabulary Admin
   - Migrations: up to 079

2. **agent-2-admin-daily-phrases** → main (SECOND)
   - 22 commits, 221 files
   - Contains ALL admin features
   - Migrations: 077, 078, 079, 20260218
   - Built on mobile features

### Branches to DELETE (6):
- agent-1-mobile-practice (duplicate)
- agent-2-mobile-vocabulary (duplicate)
- agent-3-mobile-testing (duplicate)
- mobile-testing-combined (integration branch, superseded)
- agent-1-admin-audio-upload (duplicate)
- agent-3-admin-quality-tools (duplicate)

---

## EXECUTION STEPS

### PHASE 1: Pre-Merge Preparation (30 min)

#### Step 1.1: Resolve Stash
```bash
# Switch to admin branch
git checkout agent-2-admin-daily-phrases

# Check stash
git stash list

# Option B: Discard stash
git stash drop

# Return to current branch
git checkout agent-2-mobile-caching
```

**Verify:** `git stash list` should be empty

#### Step 1.2: Create Backup Branches
```bash
git branch main-backup-20260218 main
git branch agent-2-mobile-caching-backup agent-2-mobile-caching
git branch agent-2-admin-daily-phrases-backup agent-2-admin-daily-phrases

# Verify backups
git branch | grep backup
```

**Expected Output:**
```
agent-2-admin-daily-phrases-backup
agent-2-mobile-caching-backup
main-backup-20260218
```

#### Step 1.3: Update main from remote
```bash
git checkout main
git pull origin main

# Check commits behind
git log --oneline main..origin/main
```

**If main is behind:** Merge origin/main first

---

### PHASE 2: Test Merge (1-2h)

**Purpose:** Test merge in safe environment, identify conflicts BEFORE touching main

#### Step 2.1: Create Test Branch
```bash
git checkout main
git checkout -b test-merge-20260218
```

#### Step 2.2: Test Merge mobile-caching
```bash
# Merge agent-2-mobile-caching into test branch
git merge agent-2-mobile-caching --no-ff --no-commit

# Check for conflicts
git status

# If conflicts:
# - Document conflicted files
# - Resolve manually (see CONFLICT RESOLUTION below)
# - Stage resolved files: git add <file>

# Complete merge
git commit -m "test: Merge agent-2-mobile-caching"

# Build & Test
npm install
npm run build
npm run dev
```

**SUCCESS CRITERIA:**
- ✅ No merge conflicts OR all conflicts resolved
- ✅ `npm run build` succeeds
- ✅ Dev server starts without errors
- ✅ No console errors in browser

**If FAILS:** Document issues, rollback test branch, revise strategy

#### Step 2.3: Test Merge admin-daily-phrases
```bash
# Still on test-merge-20260218
git merge agent-2-admin-daily-phrases --no-ff --no-commit

# Check for conflicts
git status

# Resolve conflicts (if any)
# Focus on: migrations (numbering), documentation (merge chronologically)

# Complete merge
git commit -m "test: Merge agent-2-admin-daily-phrases"

# Build & Test AGAIN
npm install
npm run build
npm run dev
```

**SUCCESS CRITERIA:**
- ✅ No merge conflicts OR all conflicts resolved
- ✅ `npm run build` succeeds
- ✅ Dev server starts
- ✅ Admin pages load: /admin/vocab, /admin/daily-phrases
- ✅ Mobile pages load: /m/practice-modes, /m/vocabulary

**If FAILS:** Document issues, revise strategy

#### Step 2.4: Verify Test Merge
```bash
# Check migration sequence
ls -la supabase/migrations/*.sql | tail -10

# Expected: 060, 067, 071-079, 20260218 (sequential)

# Check package.json merged correctly
cat package.json | grep version

# Check for duplicate dependencies
npm list --depth=0 2>&1 | grep -i "extraneous\|invalid"

# Run comprehensive check
./scripts/comprehensive-check.sh
```

**SUCCESS CRITERIA:**
- ✅ Migrations sequential (no duplicates)
- ✅ package.json valid
- ✅ No duplicate dependencies
- ✅ System Health: 100/100

---

### PHASE 3: Actual Merge to main (1-2h)

**ONLY PROCEED IF PHASE 2 SUCCEEDED**

#### Step 3.1: Merge mobile-caching to main
```bash
# Switch to main
git checkout main

# Ensure clean state
git status
# Output should be: "nothing to commit, working tree clean"

# Merge agent-2-mobile-caching
git merge agent-2-mobile-caching --no-ff -m "$(cat <<'EOF'
feat(mobile): Merge complete mobile implementation

Merges agent-2-mobile-caching (21 commits, 145 files) containing:

Mobile UI (100% Complete):
- Dashboard, Stats, Settings pages
- Practice Modes Mobile (/m/practice-modes)
- Vocabulary Mobile (/m/vocabulary)
- Memory Game Mobile (/m/practice-modes/memory)
- Memory Split Mobile (/m/practice-modes/memory-split)
- Daily Phrases Mobile (/m/daily-phrases)
- Bottom Navigation
- Glassmorphism Design System

State & Logic:
- IndexedDB caching (offline support)
- FSRS-6 Algorithm
- useMobileCache hook
- Practice Modes logic
- Vocabulary data fetching

Admin Desktop:
- Vocabulary Management System (/admin/vocab)
- CRUD API with RLS policies
- CSV Import/Export
- Bulk operations
- 5 Supabase RPC functions

Testing:
- E2E Tests (Playwright, 22 tests)
- Smoke Tests
- Comprehensive System Check

Bug Fixes:
- TypeScript errors (115 → 0)
- Matching Game 406 error fix
- Cache infinite loop fix
- Stats Page mobile optimization

Migrations:
- 077: Daily Phrases Scheduling
- 078: Cleanup Vocabulary
- 079: Create Vocabulary

Merge Strategy: Agent 1 analysis + Agent 4 execution
Branch consolidated: agent-2-mobile-caching → main

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Verify merge
git log --oneline -1
```

**Verify Success:**
```bash
npm install
npm run build
npm run dev
# Open browser: http://localhost:3000
```

#### Step 3.2: Merge admin-daily-phrases to main
```bash
# Still on main
git merge agent-2-admin-daily-phrases --no-ff -m "$(cat <<'EOF'
feat(admin): Merge complete admin implementation

Merges agent-2-admin-daily-phrases (22 commits, 221 files) containing:

Admin Management Systems:
- Daily Phrases Management (/admin/daily-phrases)
  - Scheduling system (3-per-day limit)
  - Context tags, phonetic transcriptions
  - Audio upload & management
  - CSV Import/Export

- Quality Tools Dashboard (/admin/quality-tools)
  - Content validation
  - Duplicate detection
  - Audio quality check
  - Bulk operations

- Audio Management:
  - Upload component
  - Bulk edit functionality
  - TTS integration
  - Audio storage migration (20260218)

Database:
- Migration 077: Daily Phrases Scheduling
- Migration 078: Vocabulary Cleanup
- Migration 079: Vocabulary Schema
- Migration 20260218: Audio Storage

Features:
- RPC functions for admin operations
- Server-side authorization
- Input validation (Zod)
- RLS policies

Documentation:
- Deployment checklists
- Migration guides
- API documentation

Merge Strategy: Sequential merge after mobile features
Branch consolidated: agent-2-admin-daily-phrases → main

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Verify merge
git log --oneline -5
```

**Verify Success:**
```bash
npm install
npm run build
./scripts/comprehensive-check.sh

# Test Admin Pages
npm run dev
# Open: http://localhost:3000/admin/vocab
# Open: http://localhost:3000/admin/daily-phrases
```

---

### PHASE 4: Cleanup (30 min)

#### Step 4.1: Delete Duplicate Branches (Local)
```bash
# Delete local branches
git branch -d agent-1-mobile-practice
git branch -d agent-2-mobile-vocabulary
git branch -d agent-3-mobile-testing
git branch -d mobile-testing-combined
git branch -d agent-1-admin-audio-upload
git branch -d agent-3-admin-quality-tools

# If error "not fully merged", force delete:
git branch -D <branch-name>
```

#### Step 4.2: Delete Duplicate Branches (Remote)
```bash
# Delete remote branches
git push origin --delete agent-1-mobile-practice
git push origin --delete agent-2-mobile-vocabulary
git push origin --delete agent-3-mobile-testing
# (mobile-testing-combined not on remote)
# (agent-1-admin-audio-upload not on remote)
# (agent-3-admin-quality-tools not on remote)
```

#### Step 4.3: Delete Test Branch
```bash
git branch -D test-merge-20260218
```

#### Step 4.4: Update Merged Branches on Remote
```bash
# Push main
git push origin main

# Push merged branches (keep as reference)
git push origin agent-2-mobile-caching
git push origin agent-2-admin-daily-phrases
```

#### Step 4.5: Cleanup Documentation
```bash
# Archive old status files
mkdir -p archive/merge-strategy/
mv GIT-MERGE-STRATEGY.md archive/merge-strategy/
mv BRANCH-CONFLICT-REPORT.md archive/merge-strategy/
mv MERGE-ORDER-PRIORITY.md archive/merge-strategy/

# Commit cleanup
git add archive/
git commit -m "docs: Archive merge strategy documentation"
git push origin main
```

---

## CONFLICT RESOLUTION STRATEGIES

### Expected Conflicts (from Agent 1 Analysis)

#### 1. package.json / package-lock.json
**Conflict Type:** Dependency additions from both branches

**Resolution:**
```bash
# Accept both changes
git checkout --ours package.json
git checkout --theirs package-lock.json

# Regenerate lock file
npm install

# Stage
git add package.json package-lock.json
```

#### 2. MASTER-SESSION-STATUS.md
**Conflict Type:** Chronological updates from both branches

**Resolution:**
```bash
# Manual merge: Keep chronological order
# Open file, merge session entries by date
# Preserve both branch's updates

git add MASTER-SESSION-STATUS.md
```

#### 3. Migration Files
**Conflict Type:** Same migration number from different branches

**Resolution:**
```bash
# Check migration numbers
ls supabase/migrations/*.sql

# If duplicates (e.g., two 078 files):
# - Rename later migration: 078 → 080
# - Update migration content if it references previous number

git add supabase/migrations/
```

#### 4. Component Files (src/app/m/practice-modes/page.tsx)
**Conflict Type:** Both branches modified same component

**Resolution:**
```bash
# Use mobile-caching version (more complete)
git checkout agent-2-mobile-caching -- src/app/m/practice-modes/page.tsx

git add src/app/m/practice-modes/page.tsx
```

#### 5. Admin Content Files (src/app/admin/content/page.tsx)
**Conflict Type:** Admin changes vs mobile changes

**Resolution:**
```bash
# Use admin-daily-phrases version (more recent)
git checkout agent-2-admin-daily-phrases -- src/app/admin/content/page.tsx

git add src/app/admin/content/page.tsx
```

---

## ROLLBACK PROCEDURES

### If Merge Fails During Test (Phase 2)
```bash
# Abort merge
git merge --abort

# Delete test branch
git checkout main
git branch -D test-merge-20260218

# Analyze failure
# - Check conflict files
# - Update strategy
# - Retry with revised approach
```

### If Merge Fails on main (Phase 3)
```bash
# Abort merge immediately
git merge --abort

# Verify main is clean
git status

# If main is corrupted:
git reset --hard main-backup-20260218

# Restore from backup
git checkout main-backup-20260218
git branch -D main
git branch main
git checkout main
```

### If Build Fails After Merge
```bash
# Check what changed
git diff HEAD~1

# If unfixable: Rollback to backup
git reset --hard main-backup-20260218

# Push force (DANGEROUS - only if necessary)
git push origin main --force-with-lease
```

---

## SUCCESS CRITERIA

### All Merges Successful When:

**Git Status:**
- ✅ main branch contains all 43 commits (21 + 22)
- ✅ No unmerged paths
- ✅ Git history clean (no duplicate commits)

**Build:**
- ✅ `npm install` succeeds
- ✅ `npm run build` succeeds (< 15s)
- ✅ 0 TypeScript errors
- ✅ < 150 ESLint warnings

**Database:**
- ✅ Migrations sequential: 060, 067, 071-079, 20260218
- ✅ No duplicate migration numbers
- ✅ All RPC functions exist

**Application:**
- ✅ Dev server starts without errors
- ✅ Mobile pages load: /m, /m/practice-modes, /m/vocabulary
- ✅ Admin pages load: /admin/vocab, /admin/daily-phrases
- ✅ No console errors in browser
- ✅ System Health: 100/100 (comprehensive-check.sh)

**Cleanup:**
- ✅ 6 duplicate branches deleted
- ✅ Test branch deleted
- ✅ Backup branches exist
- ✅ Documentation archived

---

## TIMELINE ESTIMATE

### Conservative (Recommended): 6.5-9.5h
- Phase 1 (Prep): 30 min
- Phase 2 (Test): 3-4h (includes conflict resolution)
- Phase 3 (Merge): 2-3h
- Phase 4 (Cleanup): 30 min
- Buffer: 1-2h (for unexpected issues)

### Aggressive (Risky): 3-4h
- Phase 1: 15 min
- Phase 2: 1h
- Phase 3: 1-2h
- Phase 4: 15 min
- Buffer: 30 min

**Recommendation:** Conservative approach
- Thorough testing at each step
- Document all conflicts
- Verify build after each merge

---

## AGENT 4 READY STATUS

**Prerequisites:**
- ✅ Agent 1 Analysis: COMPLETE
- ✅ Agent 2 Migrations: COMPLETE
- ✅ Consolidation Audit: COMPLETE
- ⏳ User Security Tests: IN PROGRESS

**Blocking Items:**
- ⏳ Waiting for User Security Tests completion (2-4h)

**Ready to Execute:**
- ✅ Execution Plan: COMPLETE
- ✅ Conflict Strategies: DEFINED
- ✅ Rollback Procedures: DEFINED
- ✅ Success Criteria: DEFINED

**Start Condition:**
- User completes Security Tests
- User gives explicit "GO" command

**Agent 4 Status:** READY ⏳ (Waiting for User)

---

**Agent 4 - Git Merge Execution Specialist**
**Plan Created:** 18. Februar 2026, 14:15 CET
**Execution:** Awaiting User Approval

---
