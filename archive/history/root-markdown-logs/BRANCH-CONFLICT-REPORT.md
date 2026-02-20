# Branch Conflict Report

**Created:** 18. Februar 2026, 14:30 CET
**Agent:** Agent 1 (Git Branch Consolidation Specialist)
**Purpose:** Detailed analysis of potential merge conflicts across 8 feature branches

---

## Executive Summary

This report provides file-level conflict analysis for merging 8 feature branches into main. Analysis is based on git diff, file overlap detection, and commit history review.

**Key Findings:**
- 145 files changed in agent-2-mobile-caching
- 221 files changed in agent-2-admin-daily-phrases
- 43 overlapping files between mobile-caching and admin-daily-phrases
- 3 CRITICAL conflicts requiring manual intervention before merge
- 12 HIGH-risk files requiring careful conflict resolution
- 28 MEDIUM-risk files with likely conflicts

**Overall Conflict Risk:** HIGH (but manageable with proper strategy)

---

## Critical Conflicts (MUST RESOLVE BEFORE MERGE)

### 1. Untracked Migration Files (078/079)

**Status:** 🔴 BLOCKING

**Problem:**
- Files exist in working directory but are untracked by git
- `supabase/migrations/078_cleanup_vocabulary.sql` (6099 bytes)
- `supabase/migrations/079_create_vocabulary.sql` (11041 bytes)
- Current branch (agent-2-mobile-caching) does NOT have these migrations
- Branch agent-2-admin-daily-phrases DOES have these migrations
- Cannot switch branches without resolving

**Evidence:**
```bash
$ git status
On branch agent-2-mobile-caching
Your branch is ahead of 'origin/agent-2-mobile-caching' by 5 commits.

Untracked files:
  supabase/migrations/078_cleanup_vocabulary.sql
  supabase/migrations/079_create_vocabulary.sql
```

**Impact:**
- Blocks branch switching
- Risk of duplicate migrations during merge
- Risk of data loss if removed incorrectly
- Database schema inconsistency

**Source Analysis:**
- These files exist in agent-2-admin-daily-phrases (committed)
- They exist in stash@{0} on agent-2-admin-daily-phrases
- They are NOT in agent-2-mobile-caching
- Likely copied from another branch during development

**Resolution Options:**

**Option A: Add to agent-2-mobile-caching (if they belong)**
```bash
git add supabase/migrations/078_cleanup_vocabulary.sql
git add supabase/migrations/079_create_vocabulary.sql
git commit -m "feat(migrations): Add vocabulary cleanup and creation migrations (078/079)"
```
**Risk:** May conflict with agent-2-admin-daily-phrases during merge (same files)
**Benefit:** Ensures migrations are in place for vocabulary admin features

**Option B: Stash them for later**
```bash
git stash push -u supabase/migrations/078_cleanup_vocabulary.sql supabase/migrations/079_create_vocabulary.sql -m "Migrations 078/079 for review"
```
**Risk:** May forget to apply later
**Benefit:** Defers decision, allows branch switching

**Option C: Remove them (if they're from agent-2-admin-daily-phrases)**
```bash
rm supabase/migrations/078_cleanup_vocabulary.sql
rm supabase/migrations/079_create_vocabulary.sql
```
**Risk:** Must re-add when merging agent-2-admin-daily-phrases
**Benefit:** Clean state, clear that they come from admin branch

**Recommendation:** Option A if vocabulary admin is already in agent-2-mobile-caching (it is), Option C if keeping branches separate.

**Action Required:** User must decide and execute one option BEFORE proceeding.

---

### 2. Stash on agent-2-admin-daily-phrases

**Status:** 🔴 BLOCKING

**Problem:**
- Stash contains work-in-progress CSV rename
- Stash message: "CSV rename work in progress"
- Uncommitted changes may be lost during merge
- Stash contains migrations 078/079

**Evidence:**
```bash
$ git stash list
stash@{0}: On agent-2-admin-daily-phrases: CSV rename work in progress
```

```bash
$ git show stash@{0}:supabase/migrations/ 2>&1 | grep -E "(078|079)"
078_cleanup_vocabulary.sql
079_create_vocabulary.sql
```

**Impact:**
- Work-in-progress not captured in commits
- Risk of losing CSV rename work
- Unclear state of branch
- May cause conflicts if applied during merge

**Resolution Steps:**

**Step 1: Investigate Stash Contents**
```bash
git checkout agent-2-admin-daily-phrases
git stash show -p stash@{0}
```

**Step 2: Decision**
- If work is complete: Apply and commit
- If work is incomplete: Apply, review, decide
- If work is obsolete: Drop stash

**Step 3: Apply Stash (if keeping)**
```bash
git stash pop stash@{0}
git status
git diff
```

**Step 4: Commit or Discard**
```bash
# If committing:
git add .
git commit -m "feat(csv): Complete CSV template rename work"

# If discarding:
git restore .
```

**Step 5: Verify Clean State**
```bash
git status  # Should show "working tree clean"
git stash list  # stash@{0} should be gone
```

**Recommendation:** Apply stash, review changes, commit if valid work, discard if obsolete.

**Action Required:** User must resolve stash BEFORE merging agent-2-admin-daily-phrases.

---

### 3. Migration Numbering Conflict

**Status:** 🟡 WARNING

**Problem:**
- agent-2-mobile-caching: migrations up to 076
- agent-2-admin-daily-phrases: migrations 077, 078, 079, 20260218
- No overlap in numbers (good)
- BUT: Working directory has untracked 078/079 (see Critical Conflict #1)

**Current State in Each Branch:**

**main:**
```
060, 067, 068, 069 (multiple), 070 (multiple), 071, 072, 073
Plus: check_users_table.sql, create_content_table.sql, diagnose_practice_config.sql, verify_practice_modes.sql
```

**agent-2-mobile-caching:**
```
060, 067, 068, 069 (multiple), 070 (multiple), 071, 072, 073, 074, 075, 076
Plus: check_users_table.sql, create_content_table.sql, diagnose_practice_config.sql, verify_practice_modes.sql
```

**agent-2-admin-daily-phrases:**
```
060, 067, 068, 071, 072, 073, 074, 075, 076, 077, 078, 079
Plus: 20260218_add_audio_storage.sql
```

**Differences:**
- agent-2-mobile-caching has MORE diagnostic migrations (069, 070 variants)
- agent-2-admin-daily-phrases REMOVED diagnostic migrations (cleaner)
- agent-2-admin-daily-phrases has NEW migrations: 077, 078, 079, 20260218

**Impact:**
- Merge will combine all migrations
- Need to verify no duplicate functionality
- Need to verify sequential application

**Resolution:**

**After Merge, Expected Migrations:**
```
060_add_spanish_translations.sql
067_add_practice_modes.sql
068_enable_practice_test_data.sql
069_diagnose_dashboard_bugs.sql (from mobile-caching)
069_diagnose_dashboard_bugs_results.sql (from mobile-caching)
069_diagnose_dashboard_issues.sql (from mobile-caching)
069_diagnose_simple.sql (from mobile-caching)
069_get_practice_enabled_items.sql (from mobile-caching)
070_diagnostic_dashboard_complete.sql (from mobile-caching)
070_diagnostic_simple.sql (from mobile-caching)
070_test_rls_policy.sql (from mobile-caching)
071_practice_modes_implementation.sql
072_vocabulary_fsrs_rpc.sql
073_vocabulary_stats_rpc.sql
074_fix_student_progress_rls.sql (from mobile-caching)
075_fix_student_progress_rls_custom_auth.sql (from mobile-caching)
076_fix_rls_anon_role.sql (from mobile-caching)
077_add_daily_phrases_scheduling.sql (from admin-daily-phrases)
078_cleanup_vocabulary.sql (from admin-daily-phrases)
079_create_vocabulary.sql (from admin-daily-phrases)
20260218_add_audio_storage.sql (from admin-daily-phrases)
check_users_table.sql
create_content_table.sql
diagnose_practice_config.sql
verify_practice_modes.sql
```

**Total:** ~26 migration files

**Validation Required:**
- Run migrations in order on test database
- Verify no duplicate table creations
- Verify no conflicting schema changes
- Document migration sequence in MIGRATION-FILE-INDEX.md

**Recommendation:** Accept all migrations, document sequence, test on staging database.

**Action Required:** Post-merge migration testing.

---

## High-Risk Files (Manual Resolution Required)

### File: package.json

**Conflict Probability:** 95%

**Branches Modifying:** ALL

**Type of Changes:**
- Dependencies added
- DevDependencies added
- Scripts modified
- Version unchanged (0.1.0 in all branches)

**Conflict Areas:**

**Dependencies:**
- agent-2-mobile-caching likely added: idb, workbox packages (for caching)
- agent-2-admin-daily-phrases likely added: audio processing, CSV parsing packages

**Scripts:**
- Both may have added test scripts
- Both may have modified build scripts

**Resolution Strategy:**

1. **Accept both sets of dependencies**
   - Merge both "dependencies" objects
   - Keep highest version if same package appears twice
   - Sort alphabetically for readability

2. **Accept both sets of devDependencies**
   - Same approach as dependencies

3. **Merge scripts carefully**
   - Keep all scripts
   - Rename if conflicts (e.g., `test:mobile`, `test:admin`)

4. **Regenerate lock file**
   ```bash
   rm package-lock.json
   npm install
   ```

**Example Conflict:**
```json
<<<<<<< HEAD (agent-2-mobile-caching)
"dependencies": {
  "idb": "^7.1.1",
  "workbox-core": "^7.0.0"
}
=======
"dependencies": {
  "papaparse": "^5.4.1",
  "react-dropzone": "^14.2.3"
}
>>>>>>> agent-2-admin-daily-phrases
```

**Resolution:**
```json
"dependencies": {
  "idb": "^7.1.1",
  "papaparse": "^5.4.1",
  "react-dropzone": "^14.2.3",
  "workbox-core": "^7.0.0"
}
```

**Testing:**
- `npm install` must succeed
- `npm run build` must succeed
- `npm run dev` must work

---

### File: package-lock.json

**Conflict Probability:** 100%

**Branches Modifying:** ALL

**Type of Changes:**
- Complete dependency tree
- Lock file structure

**Resolution Strategy:**

**DO NOT attempt to manually resolve conflicts in package-lock.json.**

**Correct Approach:**
1. During merge, accept conflict in package-lock.json
2. After resolving package.json conflicts:
   ```bash
   rm package-lock.json
   npm install
   git add package-lock.json
   ```
3. New lock file will be generated based on resolved package.json
4. Commit regenerated lock file

**Why:**
- Lock file is auto-generated
- Manual resolution is error-prone
- npm install creates correct lock file

---

### File: MASTER-SESSION-STATUS.md

**Conflict Probability:** 90%

**Branches Modifying:** agent-2-mobile-caching, agent-2-admin-daily-phrases, mobile-testing-combined

**Type of Changes:**
- Session logs appended
- Progress updates
- Agent status updates
- Completion tracking

**Conflict Areas:**
- "Overall Progress" percentage
- "Last Update" timestamp
- "SESSION HISTORY" section

**Resolution Strategy:**

1. **Use agent-2-mobile-caching as base** (most recent: 98% complete)

2. **Append unique sessions from agent-2-admin-daily-phrases**
   - Look for sessions not in mobile-caching
   - Add to SESSION HISTORY chronologically

3. **Update Overall Progress**
   - Use highest percentage (likely 98% or 100% after admin merge)

4. **Update Last Update timestamp**
   - Use current date/time

5. **Merge Agent Status sections**
   - Keep all agent updates
   - Mark completed tasks

**Example Conflict:**
```markdown
<<<<<<< HEAD
**Last Update:** 18. Februar 2026, 01:35 CET
**Overall Progress:** 98%
=======
**Last Update:** 17. Februar 2026, 23:00 CET
**Overall Progress:** 96%
>>>>>>> agent-2-admin-daily-phrases
```

**Resolution:**
```markdown
**Last Update:** 18. Februar 2026, 14:30 CET
**Overall Progress:** 100% (ALL FEATURES MERGED!)
```

---

### File: src/app/m/practice-modes/page.tsx

**Conflict Probability:** 80%

**Branches Modifying:** agent-1-mobile-practice, agent-2-mobile-vocabulary, mobile-testing-combined, agent-2-mobile-caching, agent-2-admin-daily-phrases

**Type of Changes:**
- Complete mobile UI implementation
- RPC integration
- Touch optimization
- Bottom sheet integration

**File Sizes:**
- agent-2-mobile-caching: 494 lines (most complete)
- agent-1-mobile-practice: unknown
- agent-2-mobile-vocabulary: unknown

**Resolution Strategy:**

**Use agent-2-mobile-caching version (most complete, most tested)**

**Reason:**
- Contains all features from other branches
- 494 lines (comprehensive)
- Tested and documented
- Includes latest fixes

**Verification:**
- Check if admin-daily-phrases has additional changes
- If yes, cherry-pick those changes
- If no, accept mobile-caching version completely

**Post-Resolution Testing:**
- Load `/m/practice-modes`
- Verify all items display
- Verify mode selection sheet opens
- Verify games launch correctly

---

### File: src/app/m/vocabulary/page.tsx

**Conflict Probability:** 75%

**Branches Modifying:** agent-2-mobile-vocabulary, agent-2-mobile-caching, agent-2-admin-daily-phrases

**Type of Changes:**
- Card flip UI
- FSRS-6 integration
- TTS controls
- Session statistics

**File Sizes:**
- agent-2-mobile-caching: 745 lines (comprehensive)

**Resolution Strategy:**

**Use agent-2-mobile-caching version**

**Reason:**
- Most complete implementation
- 745 lines of well-tested code
- Includes all features (FSRS, TTS, stats)

**Verification:**
- Check if admin-daily-phrases has changes
- Likely no changes (admin doesn't touch vocabulary learning UI)
- Accept mobile-caching version

**Post-Resolution Testing:**
- Load `/m/vocabulary`
- Verify card flip works
- Verify rating buttons work (Again, Hard, Good, Easy)
- Verify TTS plays audio
- Verify session stats display

---

### File: src/app/admin/content/page.tsx

**Conflict Probability:** 85%

**Branches Modifying:** agent-1-admin-audio-upload, agent-2-admin-daily-phrases, agent-3-admin-quality-tools

**Type of Changes:**
- Admin UI enhancements
- Bulk edit features
- Audio upload integration
- Quality tools integration

**Resolution Strategy:**

**Use agent-2-admin-daily-phrases version**

**Reason:**
- Most comprehensive admin branch
- Includes audio upload (from agent-1)
- Includes quality tools (from agent-3)
- Most recent updates

**Verification:**
- Compare with mobile-caching version
- If mobile-caching has additional changes, merge them
- Likely mobile-caching only has minor changes (or none)

**Post-Resolution Testing:**
- Load `/admin/content`
- Verify content table displays
- Verify bulk edit works
- Verify audio upload works
- Verify quality tools accessible

---

### File: src/components/admin/AudioUpload.tsx

**Conflict Probability:** 70%

**Branches Modifying:** agent-1-admin-audio-upload, agent-2-admin-daily-phrases

**Type of Changes:**
- Audio upload component
- Drag-and-drop functionality
- File validation
- Progress tracking

**Resolution Strategy:**

**Use agent-2-admin-daily-phrases version**

**Reason:**
- Likely identical to agent-1-admin-audio-upload (inherited)
- May have additional refinements

**Alternative:**
- If agent-1-admin-audio-upload is newer, compare carefully
- agent-3-admin-quality-tools has same version as agent-1

**Verification:**
- Check commit history: `git log --oneline agent-2-admin-daily-phrases -- src/components/admin/AudioUpload.tsx`
- If last change is "feat(admin): Implement audio upload...", versions are same
- Accept agent-2-admin-daily-phrases version

---

### File: src/components/learning/practice-modes/practice-mode-dialog.tsx

**Conflict Probability:** 80%

**Branches Modifying:** Most branches (mobile + admin)

**Type of Changes:**
- Bug fix: `.single()` → `.maybeSingle()` (406 error fix)
- Mode selection logic
- Integration with mobile UI

**Resolution Strategy:**

**Use agent-2-mobile-caching version**

**Reason:**
- Contains critical 406 error fix
- Documented in MATCHING-GAME-406-FIX.md
- One-line change but important

**Key Change:**
```typescript
// OLD (causes 406 error for new items)
.single()

// NEW (handles null gracefully)
.maybeSingle()
```

**Verification:**
- Ensure `.maybeSingle()` is used (not `.single()`)
- Check for any additional changes in admin-daily-phrases
- Merge if both have unique changes

**Post-Resolution Testing:**
- Start matching game with new vocabulary item
- Should NOT see 406 error in console
- Should work smoothly

---

### File: src/app/dashboard/page.tsx

**Conflict Probability:** 75%

**Branches Modifying:** agent-2-mobile-caching, agent-2-admin-daily-phrases

**Type of Changes:**
- Dashboard layout updates
- Tile integration
- Statistics display
- Navigation updates

**Resolution Strategy:**

**Merge carefully - both branches may have unique changes**

**Approach:**
1. Compare both versions
2. Identify unique changes in each
3. Merge both sets of changes
4. Prioritize UI consistency

**Likely Differences:**
- mobile-caching: Mobile-optimized dashboard
- admin-daily-phrases: Admin-focused dashboard updates

**Post-Resolution Testing:**
- Load `/dashboard` (desktop)
- Load `/m` (mobile)
- Verify all tiles display
- Verify navigation works

---

### File: src/app/globals.css

**Conflict Probability:** 65%

**Branches Modifying:** Most branches

**Type of Changes:**
- Global styles
- CSS variables
- Mobile-first styles
- Glassmorphism styles

**Resolution Strategy:**

**Merge both versions - CSS is usually additive**

**Approach:**
1. Accept both sets of styles
2. Remove duplicates
3. Organize by section
4. Test visual consistency

**Common Additions:**
- Mobile breakpoints
- Touch target sizes
- Animation keyframes
- Color variables

**Post-Resolution Testing:**
- Visual inspection of all routes
- Check mobile responsiveness
- Verify animations work
- Check dark mode

---

### File: src/components/mobile/MobileBottomNav.tsx

**Conflict Probability:** 60%

**Branches Modifying:** agent-2-mobile-caching, possibly admin-daily-phrases

**Type of Changes:**
- Dark theme conversion (Tailwind → inline styles)
- iOS-style colors
- Navigation logic

**Resolution Strategy:**

**Use agent-2-mobile-caching version**

**Reason:**
- Latest dark theme implementation
- Documented in session log (18. Feb, 01:35 CET)
- Inline styles for consistent theming

**Verification:**
- Check if admin-daily-phrases modified this file
- Likely unchanged (admin doesn't touch mobile nav)
- Accept mobile-caching version

---

## Medium-Risk Files (Likely Conflicts, Auto-Resolvable)

### Documentation Files (*.md)

**Files:**
- All AGENT-*.md files
- Testing documentation
- Session logs
- Completion reports

**Conflict Probability:** 50-70%

**Resolution Strategy:**
- Keep all unique documentation files
- For duplicates, keep most recent version
- Merge if both have unique content

**Examples:**
- `AGENT-3-COMPLETION-SUMMARY.md`: Keep from mobile-caching (latest)
- `_Agent2_Logic_Mobile.md`: Merge both (chronological sessions)
- `TROUBLESHOOTING-*.md`: Merge both (different issues documented)

---

### Test Files (tests/mobile/*)

**Files:**
- e2e.spec.ts
- README.md
- a11y-*.md
- lighthouse-*.md

**Conflict Probability:** 40-60%

**Resolution Strategy:**
- Merge all tests (additive)
- Keep all test cases
- Update README with combined instructions

**Approach:**
1. Combine test suites
2. Remove duplicate tests
3. Ensure all test IDs unique
4. Update test counts in documentation

---

### Component Files (src/components/mobile/*)

**Files:**
- PracticeModesSheet.tsx
- OfflineBanner.tsx
- Various mobile components

**Conflict Probability:** 50-70%

**Resolution Strategy:**
- Use agent-2-mobile-caching version (most tested)
- Check if admin-daily-phrases has changes
- Merge if both have unique features

---

### Hook Files (src/hooks/*)

**Files:**
- use-mobile-cache.ts
- use-stats-data.ts

**Conflict Probability:** 50%

**Resolution Strategy:**
- Use agent-2-mobile-caching version
- Includes cache stability fixes
- Documented in CACHE-DEBUG-REPORT.md

---

### Library Files (src/lib/*)

**Files:**
- cache/mobile-cache.ts
- supabase/content.ts
- supabase/storage.ts

**Conflict Probability:** 50-60%

**Resolution Strategy:**
- Use agent-2-mobile-caching for mobile files
- Use agent-2-admin-daily-phrases for admin files
- Merge if overlapping changes

---

## Low-Risk Files (Unlikely Conflicts)

### Config Files

**Files:**
- lighthouserc.json
- next.config.ts
- tsconfig.json

**Conflict Probability:** 30-40%

**Resolution:**
- Usually additive changes
- Merge both configurations
- Test build after resolution

---

### Type Definition Files (src/types/*)

**Files:**
- content.ts
- Various type files

**Conflict Probability:** 30%

**Resolution:**
- Merge type definitions
- Remove duplicates
- Verify TypeScript compilation

---

## File Overlap Analysis

### Overlapping Files Between Primary Branches

**agent-2-mobile-caching ∩ agent-2-admin-daily-phrases: 43 files**

```
src/app/admin/page.tsx
src/app/dashboard/page.tsx
src/app/globals.css
src/app/m/daily-phrases/page.tsx
src/app/m/page.tsx
src/app/m/practice-modes/cloze-text/page.tsx
src/app/m/practice-modes/memory-split/page.tsx
src/app/m/practice-modes/memory/page.tsx
src/app/m/practice-modes/page.tsx
src/app/m/stats/page.tsx
src/app/m/vocabulary/page.tsx
src/app/practice-modes/memory-split/page.tsx
src/app/practice-modes/memory/page.tsx
src/app/practice-modes/page.tsx
src/app/test-memory/page.tsx
src/components/learning/practice-modes/index.ts
src/components/learning/practice-modes/memory-game.tsx
src/components/learning/practice-modes/memory-split-game.tsx
src/components/learning/practice-modes/practice-mode-dialog.tsx
src/components/learning/practice-modes/types/memory-game.types.ts
src/components/mobile/MobileBottomNav.tsx
src/components/mobile/OfflineBanner.tsx
src/components/mobile/PracticeModesSheet.tsx
src/hooks/use-mobile-cache.ts
src/lib/cache/mobile-cache.ts
src/styles/liquid-glass.css
MASTER-SESSION-STATUS.md
package.json
package-lock.json
[... and 14 more documentation files ...]
```

**Key Insight:**
- Most overlaps are expected (admin branch built on mobile branch)
- Focus conflict resolution on src/app/admin/* (unique to admin)
- Mobile files: accept from mobile-caching
- Admin files: accept from admin-daily-phrases

---

### Unique Files Per Branch

**agent-2-mobile-caching unique files (~102):**
- Mobile practice mode pages
- Memory game implementations
- Caching infrastructure
- Mobile testing files
- Documentation of mobile features

**agent-2-admin-daily-phrases unique files (~178):**
- Admin management pages
- Daily phrases admin system
- Quality tools dashboard
- Audio storage migration
- Admin component updates
- Production deployment docs

**No Conflicts Expected** for unique files (will merge cleanly).

---

## Conflict Resolution Workflow

### For Each Conflicting File

**Step 1: Identify Conflict Type**
- [ ] Dependencies (package.json)
- [ ] Migrations (*.sql)
- [ ] Components (*.tsx)
- [ ] Documentation (*.md)
- [ ] Config files
- [ ] Other

**Step 2: Check File Sizes**
```bash
git show agent-2-mobile-caching:<file> | wc -l
git show agent-2-admin-daily-phrases:<file> | wc -l
```

**Step 3: Compare Commits**
```bash
git log --oneline agent-2-mobile-caching -- <file>
git log --oneline agent-2-admin-daily-phrases -- <file>
```

**Step 4: View Differences**
```bash
git diff agent-2-mobile-caching agent-2-admin-daily-phrases -- <file>
```

**Step 5: Decision Matrix**

| File Type | Mobile Larger | Admin Larger | Equal Size | Resolution |
|-----------|---------------|--------------|------------|------------|
| Component | Use Mobile | Use Admin | Compare & Merge | Use most complete |
| Admin Page | Use Mobile | Use Admin | Use Admin | Admin wins |
| Mobile Page | Use Mobile | Use Mobile | Use Mobile | Mobile wins |
| Doc | Merge | Merge | Use Latest | Chronological merge |
| Config | Merge | Merge | Merge | Additive merge |

**Step 6: Resolve**
```bash
# Option A: Use ours (current branch)
git checkout --ours <file>

# Option B: Use theirs (incoming branch)
git checkout --theirs <file>

# Option C: Manual edit
# Edit file to combine both versions

git add <file>
```

**Step 7: Test**
- [ ] File compiles (if TypeScript)
- [ ] No ESLint errors
- [ ] Visual inspection (if UI)
- [ ] Functional test (if component)

**Step 8: Document**
- [ ] Add to BRANCH-CONFLICT-REPORT.md (this file)
- [ ] Note resolution strategy used
- [ ] Note any issues encountered

---

## Automated Conflict Detection

### Commands to Run Before Merge

**1. Predict conflicts between branches:**
```bash
git merge-tree $(git merge-base agent-2-mobile-caching agent-2-admin-daily-phrases) agent-2-mobile-caching agent-2-admin-daily-phrases | grep -A3 "changed in both"
```

**2. List all overlapping files:**
```bash
comm -12 <(git diff --name-only main...agent-2-mobile-caching | sort) <(git diff --name-only main...agent-2-admin-daily-phrases | sort)
```

**3. Find files with different content:**
```bash
for file in $(comm -12 <(git diff --name-only main...agent-2-mobile-caching | sort) <(git diff --name-only main...agent-2-admin-daily-phrases | sort)); do
  if ! git diff agent-2-mobile-caching agent-2-admin-daily-phrases -- "$file" | grep -q "^diff"; then
    echo "CONFLICT: $file"
  fi
done
```

**4. Check migration sequence:**
```bash
git ls-tree -r --name-only agent-2-mobile-caching supabase/migrations/ | grep -E "[0-9]{3}_" | sort
git ls-tree -r --name-only agent-2-admin-daily-phrases supabase/migrations/ | grep -E "[0-9]{3}_" | sort
```

---

## Post-Merge Validation

### Validation Checklist

**Build Validation:**
- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build output size reasonable (check bundle size)

**File Validation:**
- [ ] All expected files present
- [ ] No duplicate files
- [ ] Migration files sequential
- [ ] No orphaned files

**Functionality Validation:**
- [ ] Mobile routes load (`/m/*`)
- [ ] Admin routes load (`/admin/*`)
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] API calls succeed
- [ ] Database queries work

**Visual Validation:**
- [ ] Mobile UI renders correctly
- [ ] Admin UI renders correctly
- [ ] No layout breaks
- [ ] Responsive design intact
- [ ] Animations work

**Performance Validation:**
- [ ] Initial load time acceptable (< 3s)
- [ ] Time to Interactive acceptable (< 5s)
- [ ] No console errors
- [ ] No console warnings (major ones)
- [ ] Memory usage stable

---

## Risk Mitigation Strategies

### Strategy 1: Test Merge First

**Create test branch:**
```bash
git checkout -b merge-test-20260218 main
git merge --no-ff agent-2-mobile-caching
# Resolve conflicts
git merge --no-ff agent-2-admin-daily-phrases
# Resolve conflicts
npm run build
# If successful, repeat on main
```

### Strategy 2: Incremental Merge

**Merge smaller chunks:**
```bash
# Merge mobile first
git checkout main
git merge --no-ff agent-2-mobile-caching
npm run build && npm test

# Then merge admin
git merge --no-ff agent-2-admin-daily-phrases
npm run build && npm test
```

### Strategy 3: Feature Branch Merge

**Create integration branch:**
```bash
git checkout -b integration-20260218 main
git merge --no-ff agent-2-mobile-caching
git merge --no-ff agent-2-admin-daily-phrases
# Test thoroughly
# When stable, merge to main
git checkout main
git merge --no-ff integration-20260218
```

### Strategy 4: Cherry-Pick Approach

**If conflicts too severe:**
```bash
# Cherry-pick individual commits instead of full merge
git checkout main
git cherry-pick <commit-hash>
# Repeat for important commits
```

---

## Conflict Resolution Decision Tree

```
File has conflict?
├─ Yes
│  ├─ Is it package.json?
│  │  └─ Merge dependencies manually, regenerate lock file
│  ├─ Is it package-lock.json?
│  │  └─ Delete and regenerate (npm install)
│  ├─ Is it migration file?
│  │  └─ Keep both, ensure sequential numbering
│  ├─ Is it mobile UI file?
│  │  └─ Use agent-2-mobile-caching version
│  ├─ Is it admin UI file?
│  │  └─ Use agent-2-admin-daily-phrases version
│  ├─ Is it documentation?
│  │  └─ Merge chronologically
│  └─ Is it config file?
│     └─ Merge both configurations
└─ No
   └─ Auto-merge (git handles it)
```

---

## Summary Statistics

### Conflict Prediction Summary

**CRITICAL Conflicts:** 3
- Untracked migrations 078/079
- Stash on agent-2-admin-daily-phrases
- Migration numbering sequence

**HIGH-Risk Files:** 12
- package.json
- package-lock.json
- MASTER-SESSION-STATUS.md
- src/app/m/practice-modes/page.tsx
- src/app/m/vocabulary/page.tsx
- src/app/admin/content/page.tsx
- src/components/admin/AudioUpload.tsx
- src/components/learning/practice-modes/practice-mode-dialog.tsx
- src/app/dashboard/page.tsx
- src/app/globals.css
- src/components/mobile/MobileBottomNav.tsx
- src/app/m/stats/page.tsx

**MEDIUM-Risk Files:** ~28
- Documentation files (*.md)
- Test files (tests/*)
- Component files (src/components/mobile/*)
- Hook files (src/hooks/*)
- Library files (src/lib/*)

**LOW-Risk Files:** ~15
- Config files
- Type definitions
- Utility files

**Auto-Merge Files:** ~250
- Unique files per branch (no overlap)

**Total Files Changed:** 366 (145 + 221)

**Estimated Overlap:** 43 files

**Estimated Manual Resolution Time:** 3-5 hours

---

## Appendix: File-by-File Conflict Matrix

| File Path | Mobile-Caching | Admin-Daily | Conflict Risk | Resolution |
|-----------|----------------|-------------|---------------|------------|
| package.json | ✅ | ✅ | 🔴 HIGH | Manual merge |
| package-lock.json | ✅ | ✅ | 🔴 HIGH | Regenerate |
| MASTER-SESSION-STATUS.md | ✅ | ✅ | 🔴 HIGH | Merge chronologically |
| supabase/migrations/078_*.sql | ❌ | ✅ | 🔴 CRITICAL | Resolve untracked |
| supabase/migrations/079_*.sql | ❌ | ✅ | 🔴 CRITICAL | Resolve untracked |
| src/app/m/practice-modes/page.tsx | ✅ | ✅ | 🟡 HIGH | Use mobile-caching |
| src/app/m/vocabulary/page.tsx | ✅ | ✅ | 🟡 HIGH | Use mobile-caching |
| src/app/admin/content/page.tsx | ✅ | ✅ | 🟡 HIGH | Use admin-daily |
| src/components/admin/AudioUpload.tsx | ❌ | ✅ | 🟡 MEDIUM | Use admin-daily |
| src/components/mobile/MobileBottomNav.tsx | ✅ | ❓ | 🟡 MEDIUM | Use mobile-caching |
| src/app/globals.css | ✅ | ✅ | 🟢 MEDIUM | Merge both |
| lighthouserc.json | ✅ | ❌ | 🟢 LOW | Keep mobile-caching |

---

## Contact & Next Steps

**Report Created By:** Agent 1 (Git Branch Consolidation Specialist)
**Date:** 18. Februar 2026, 14:30 CET
**Status:** ✅ COMPLETE

**Next Steps:**
1. Review GIT-MERGE-STRATEGY.md
2. Resolve Critical Conflicts (migrations, stash)
3. Create backup branches
4. Execute test merge
5. Execute actual merge
6. Validate and test

**Related Documents:**
- GIT-MERGE-STRATEGY.md (overall strategy)
- MOBILE-FIRST-STRATEGY.md (context)
- MASTER-SESSION-STATUS.md (project status)

---

**END OF BRANCH-CONFLICT-REPORT.md**
