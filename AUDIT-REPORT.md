# Module Audit Report: Mobile vs Desktop
**Date:** 2026-02-15
**Task:** Compare mobile (HTML/JS) vs desktop (React/TSX) modules
**Reference:** CLAUDE.md, ai-guidelines.md

---

## 📋 Module Inventory

### Mobile Modules (HTML/JS)
Located in: `modules/`

1. **daily-phrases/** ✅
   - daily-phrases.html
   - daily-phrases-script.js
   - daily-phrases-style.css

2. **short-stories/** 📚
   - short-stories.html
   - (additional files to be checked)

3. **due-cards-today/** 📅
   - (files to be checked)

### Desktop Modules (React/TSX)
Located in: `src/components/learning/`

- VocabularyDialog.tsx
- VocabularyDialogFSRS.tsx
- GrammarDialog.tsx
- ComprehensionDialog.tsx
- ListeningDialog.tsx
- LessonDialog.tsx
- daily-phrases-dialog-fsrs.tsx ✅ (recently integrated)

---

## 🔍 Comparison Status

### 1. Daily Phrases
- **Mobile:** ✅ Exists (`modules/daily-phrases/`)
- **Desktop:** ✅ Exists (`daily-phrases-dialog-fsrs.tsx`)
- **Status:** Recently integrated (commit d2329d2)
- **Issues to check:**
  - [ ] Naming convention compliance
  - [ ] Feature parity
  - [ ] Algorithm consistency (SM-2 vs FSRS-6)

### 2. Review Vocab / Vocabulary
- **Mobile:** ❓ No dedicated module found in `modules/`
- **Desktop:** ✅ Multiple versions (VocabularyDialog, VocabularyDialogFSRS)
- **Issues:**
  - [ ] Desktop-only feature?
  - [ ] Should have mobile equivalent?

### 3. Grammar
- **Mobile:** ❌ Not found
- **Desktop:** ✅ GrammarDialog.tsx
- **Issues:**
  - [ ] Desktop-only feature
  - [ ] No mobile version

### 4. Due Cards Today
- **Mobile:** ⚠️ Directory exists (`modules/due-cards-today/`)
- **Desktop:** ✅ Integrated in VocabularyDialogFSRS (mode: 'due')
- **Issues to check:**
  - [ ] Mobile implementation details
  - [ ] Desktop integration completeness

### 5. Week Words
- **Mobile:** ❌ NOT FOUND
- **Desktop:** ❌ NOT FOUND
- **Status:** **DOES NOT EXIST** - possible user confusion?
- **Action:** TODO - Clarify with user what "Week Words" means

---

## 🚨 Critical Issues Found

### Issue #1: Missing naming-convention.md
- **Expected:** `docs/naming-convention.md`
- **Status:** File does not exist
- **Impact:** Cannot verify naming compliance
- **Action:** TODO - Request file or create based on CLAUDE.md

### Issue #2: Module naming inconsistency
- **Mobile:** Uses directory structure (`daily-phrases/`, `short-stories/`)
- **Desktop:** Uses component naming (`VocabularyDialogFSRS`, `GrammarDialog`)
- **Convention from CLAUDE.md:** Should use prefix (daily-phrases-*, vocabulary-*)
- **Current violations:**
  - `VocabularyDialog.tsx` → should be `vocabulary-dialog.tsx`?
  - `GrammarDialog.tsx` → should be `grammar-dialog.tsx`?
  - `LessonDialog.tsx` → should be `lesson-dialog.tsx`?

### Issue #3: Algorithm inconsistency
- **Mobile daily-phrases:** Uses SM-2
- **Desktop daily-phrases:** Uses FSRS-6
- **ai-guidelines.md says:** "angepasstes SM-2"
- **Question:** Is FSRS-6 approved or should we align to SM-2?

### Issue #4: "Daily Phrases: genau 3 pro Tag"
- **Guideline:** Exactly 3 phrases per day (Morning, Noon, Evening)
- **Current implementation:** Shows all available phrases, shuffled
- **Violation:** Not enforcing 3-per-day limit
- **Action:** TODO - Implement 3-per-day logic or clarify if changed

---

## 📝 Action Items

### Immediate (Can fix autonomously)
1. [ ] Check all React component file names for kebab-case compliance
2. [ ] Audit mobile modules for completeness
3. [ ] Document feature parity gaps
4. [ ] Check console logs for naming convention

### Needs Decision (User input required)
1. [ ] **TODO:** naming-convention.md missing - create or request?
2. [ ] **TODO:** FSRS-6 vs SM-2 - which algorithm is approved?
3. [ ] **TODO:** Daily Phrases 3-per-day limit - enforce or remove?
4. [ ] **TODO:** "Week Words" - what does this refer to?
5. [ ] **TODO:** Mobile Grammar/Comprehension/Listening - create or desktop-only?

### Next Steps
1. Continue with detailed file-by-file comparison
2. Fix naming convention violations (if clear)
3. Create comprehensive TODO list for user review

---

**Status:** IN PROGRESS
**Next:** Deep dive into each module for detailed comparison
