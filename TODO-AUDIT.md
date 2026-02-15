# 📝 TODO: Module Audit Follow-Up Actions
**Created:** 2026-02-15
**Task:** #19 - Audit & harmonize mobile vs desktop modules
**Status:** Analysis Complete - Awaiting Decisions

---

## 🚦 DECISIONS NEEDED (User Input Required)

### 🔴 CRITICAL - Must Decide Before Proceeding

#### 1. **Algorithm Standard: FSRS-6 vs SM-2?**
**Context:** ai-guidelines.md says "angepasstes SM-2", but desktop uses FSRS-6
**Current State:**
- Mobile daily-phrases: SM-2
- Desktop all modules: FSRS-6

**Question:** Which algorithm is the approved standard going forward?
- [ ] Option A: Keep FSRS-6 (modern, better performance) → Update guidelines
- [ ] Option B: Revert to SM-2 (follow current guidelines) → Rewrite desktop code
- [ ] Option C: Mixed approach (different per module)

**Impact:** Major code changes if switching from FSRS-6 to SM-2
**Recommendation:** Keep FSRS-6, update ai-guidelines.md

---

#### 2. **Daily Phrases: "3 per day" Rule**
**Context:** ai-guidelines.md says "genau 3 pro Tag (Morgen, Mittag, Abend)"
**Current State:** Shows all available phrases, shuffled

**Question:** Should we enforce the 3-per-day limit?
- [ ] Option A: Enforce strict 3-per-day with time-based rotation
- [ ] Option B: Remove rule from guidelines (current behavior is intended)
- [ ] Option C: Make it configurable per user

**Impact:** Requires time-slot logic (morning/noon/evening) if enforced
**Recommendation:** Clarify intent - was this rule abandoned?

---

#### 3. **Delete Old/Unused Files?**
**Context:** Found old versions no longer imported in dashboard

**Files identified as unused:**
1. `VocabularyDialog.tsx` (946 lines) - Replaced by VocabularyDialogFSRS
2. `GrammarDialog.tsx` (879 lines) - Replaced by grammar-dialog-fsrs
3. `daily-phrases-dialog.tsx` (362 lines) - Replaced by daily-phrases-dialog-fsrs
4. `Flashcard.tsx` (371 lines) - Replaced by FlashcardFSRS

**Question:** Safe to delete?
- [ ] Option A: Delete now (git preserves history)
- [ ] Option B: Keep for reference
- [ ] Option C: Move to `/archive` folder first

**Impact:** Cleaner codebase, less confusion
**Recommendation:** Move to `/archive` first, delete after 1 month

---

#### 4. **Naming Convention: Rename PascalCase files?**
**Context:** CLAUDE.md mandates kebab-case, but many files use PascalCase

**Files to rename (8 files, 78 usages):**
```
ComprehensionDialog.tsx → comprehension-dialog.tsx
ListeningDialog.tsx → listening-dialog.tsx
LessonDialog.tsx → lesson-dialog.tsx
VocabularyDialogFSRS.tsx → vocabulary-dialog-fsrs.tsx
VocabularyDialog.tsx → vocabulary-dialog.tsx [if keeping]
GrammarDialog.tsx → grammar-dialog.tsx [if keeping]
FlashcardFSRS.tsx → flashcard-fsrs.tsx
Flashcard.tsx → flashcard.tsx [if keeping]
```

**Question:** Proceed with mass rename?
- [ ] Option A: Rename all now (78 import statements to update)
- [ ] Option B: Rename gradually (one per commit)
- [ ] Option C: Keep current naming (update guidelines instead)

**Impact:** Breaking change, all imports must update, potential merge conflicts
**Recommendation:** Rename all at once in single commit

---

### 🟡 MEDIUM PRIORITY

#### 5. **Short Stories Integration**
**Context:** Mobile has short-stories module, desktop links to HTML

**Question:** Port Short Stories to React?
- [ ] Yes - Same approach as Daily Phrases (high priority)
- [ ] No - Keep HTML version (low priority)
- [ ] Later - Add to backlog

**Effort:** ~2-3 hours (similar to Daily Phrases integration)

---

#### 6. **Missing Mobile Versions**
**Context:** Desktop has modules without mobile equivalent

**Modules:**
- Grammar (desktop only)
- Comprehension (desktop only)
- Listening (desktop only)
- Weak Words (desktop only)
- Due Cards (desktop only)

**Question:** Create mobile HTML versions?
- [ ] Yes - Full parity needed
- [ ] No - Desktop-first approach is fine
- [ ] Selective - Only for high-priority modules

**Recommendation:** Desktop-first is fine (mobile web is responsive)

---

#### 7. **"Week Words" Clarification**
**Context:** User said "Week Words" but this doesn't exist

**Question:** Did you mean "Weak Words" (schwache Wörter)?
- [ ] Yes - Weak Words dialog (already exists)
- [ ] No - Different feature entirely
- [ ] Typo - Meant something else

**Status:** Assuming "Weak Words" - already exists as `weak-words-dialog.tsx`

---

### 🟢 LOW PRIORITY (Can defer)

#### 8. **Missing naming-convention.md**
**Context:** CLAUDE.md references it, but file doesn't exist

**Action:** Create comprehensive naming-convention.md based on CLAUDE.md + ai-guidelines.md
**Status:** TODO - Low priority, can infer from existing docs

---

#### 9. **Module Documentation**
**Context:** Some modules lack README/docs

**Action:** Create consistent documentation structure:
```
modules/[module-name]/
  ├── README.md (overview)
  ├── TODO.md (pending tasks)
  ├── [module-name]-logic.md (algorithm/rules)
```

**Status:** TODO - Good practice but not blocking

---

## ✅ COMPLETED (This Audit)

- [x] Inventory all mobile modules (HTML/JS)
- [x] Inventory all desktop modules (React/TSX)
- [x] Compare feature parity
- [x] Identify naming convention violations
- [x] Find duplicate/unused files
- [x] Document algorithm inconsistencies
- [x] Create comprehensive findings report (FINDINGS.md)
- [x] Create this TODO list

---

## 🎯 RECOMMENDED NEXT STEPS

### If User Approves All Recommendations:

1. **Update ai-guidelines.md** → Approve FSRS-6 as standard
2. **Remove or clarify** "3 per day" rule for Daily Phrases
3. **Create `/archive` folder** → Move old files
4. **Mass rename** all PascalCase files to kebab-case (single commit)
5. **Port Short Stories** to React (like Daily Phrases)
6. **Update documentation** to reflect current state

### Estimated Time:
- Renaming + imports: 1 hour
- Archive old files: 15 min
- Short Stories port: 2-3 hours
- Documentation updates: 30 min
**Total: ~4-5 hours**

---

## 📊 AUDIT SUMMARY STATS

- **Total Modules Checked:** 9
- **Mobile Modules Found:** 2 (daily-phrases, short-stories)
- **Desktop Modules Found:** 13
- **Naming Violations:** 8 files
- **Unused Files:** 4 files
- **Import Updates Needed:** 78 locations
- **Critical Decisions:** 4
- **Medium Priority:** 3
- **Low Priority:** 2

---

## 🔗 Related Files

- [FINDINGS.md](./FINDINGS.md) - Detailed analysis
- [AUDIT-REPORT.md](./AUDIT-REPORT.md) - Initial inventory
- [CLAUDE.md](./CLAUDE.md) - Project conventions
- [ai-guidelines.md](./docs/ai-guidelines.md) - Hard rules

---

**Status:** ⏸️ PAUSED - Awaiting User Decisions
**Next Action:** User to review and approve decisions 1-4
**Then:** Execute approved changes systematically
