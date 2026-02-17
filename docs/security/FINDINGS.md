# 🔍 MODULE AUDIT FINDINGS
**Date:** 2026-02-15
**Status:** Analysis Complete - Fixing in Progress

---

## ✅ CLARIFICATION: "Week Words" = "Weak Words"!
The user likely meant **"Weak Words"** (schwache Wörter), not "Week Words".
File exists: `weak-words-dialog.tsx` ✅

---

## 📊 MODULE STATUS MATRIX

| Module | Mobile (HTML) | Desktop (React) | Status | Notes |
|--------|--------------|-----------------|--------|-------|
| **Daily Phrases** | ✅ modules/daily-phrases/ | ✅ daily-phrases-dialog-fsrs.tsx | 🟢 INTEGRATED | Recently done (commit d2329d2) |
| **Review Vocab** | ❌ None | ✅ VocabularyDialogFSRS.tsx | 🟡 DESKTOP ONLY | No mobile equivalent |
| **Grammar** | ❌ None | ✅ grammar-dialog-fsrs.tsx | 🟡 DESKTOP ONLY | No mobile equivalent |
| **Due Cards** | ⚠️ Docs only | ✅ due-cards-dialog.tsx | 🟢 DESKTOP ONLY | Mobile has docs but no implementation |
| **Weak Words** | ❌ None | ✅ weak-words-dialog.tsx | 🟡 DESKTOP ONLY | No mobile equivalent |
| **Comprehension** | ❌ None | ✅ ComprehensionDialog.tsx | 🟡 DESKTOP ONLY | No mobile equivalent |
| **Listening** | ❌ None | ✅ ListeningDialog.tsx | 🟡 DESKTOP ONLY | No mobile equivalent |
| **Lesson** | ❌ None | ✅ LessonDialog.tsx | 🟡 DESKTOP ONLY | No mobile equivalent |
| **Short Stories** | ✅ modules/short-stories/ | ❌ None | 🔴 MOBILE ONLY | Not integrated to desktop |

---

## 🚨 CRITICAL ISSUES

### 1. Naming Convention Violations (CLAUDE.md Rule: kebab-case)

**❌ PascalCase (Violations):**
- `ComprehensionDialog.tsx` → should be `comprehension-dialog.tsx`
- `ListeningDialog.tsx` → should be `listening-dialog.tsx`
- `LessonDialog.tsx` → should be `lesson-dialog.tsx`
- `VocabularyDialogFSRS.tsx` → should be `vocabulary-dialog-fsrs.tsx`
- `VocabularyDialog.tsx` → should be `vocabulary-dialog.tsx`
- `GrammarDialog.tsx` → should be `grammar-dialog.tsx`
- `FlashcardFSRS.tsx` → should be `flashcard-fsrs.tsx`
- `Flashcard.tsx` → should be `flashcard.tsx`

**✅ Correct (kebab-case):**
- `daily-phrases-dialog-fsrs.tsx` ✓
- `grammar-dialog-fsrs.tsx` ✓
- `due-cards-dialog.tsx` ✓
- `weak-words-dialog.tsx` ✓
- `session-timer-display.tsx` ✓

### 2. Unused/Deprecated Files

**Likely OLD VERSIONS (not imported in dashboard):**
- `VocabularyDialog.tsx` → Old version, replaced by VocabularyDialogFSRS
- `GrammarDialog.tsx` → Old version, replaced by grammar-dialog-fsrs
- `daily-phrases-dialog.tsx` (362 lines) → Old version, replaced by daily-phrases-dialog-fsrs (1159 lines)
- `Flashcard.tsx` → Old version, FlashcardFSRS is used

**Action:** TODO - Confirm with user before deletion

### 3. Algorithm Inconsistency

**ai-guidelines.md states:** "angepasstes SM-2"
**Current Implementation:**
- Mobile daily-phrases: SM-2
- Desktop daily-phrases: FSRS-6
- Desktop vocabulary: FSRS-6

**Question:** Is FSRS-6 the new approved standard, or should we revert to SM-2?

### 4. Daily Phrases "3 per day" Rule Not Enforced

**ai-guidelines.md states:** "Daily Phrases: genau 3 pro Tag (Morgen, Mittag, Abend)"
**Current implementation:** Shows all available phrases, shuffled randomly

**Violation:** Not limiting to 3 phrases per day
**TODO:** Implement time-based 3-phrase rotation or clarify if rule changed

### 5. Missing Short Stories Integration

**Mobile:** ✅ modules/short-stories/
**Desktop:** ❌ No React component
**Status:** Button on dashboard links to HTML version (`/short-stories/short-stories.html`)

**TODO:** Port Short Stories to React (like Daily Phrases)

---

## 📋 FIXES TO APPLY

### Immediate (Safe to fix)

1. **Rename files to kebab-case** (Breaking change - needs careful import updates)
2. **Add comprehensive module comparison documentation**
3. **Update dashboard imports after renaming**

### Needs User Decision

1. **Delete old/unused files?**
   - VocabularyDialog.tsx
   - GrammarDialog.tsx
   - daily-phrases-dialog.tsx
   - Flashcard.tsx

2. **FSRS-6 vs SM-2?** Which is the approved algorithm?

3. **Daily Phrases 3-per-day limit?** Enforce or remove from guidelines?

4. **Short Stories integration priority?** Should this be ported to React?

5. **Mobile versions needed?** Should Grammar/Comprehension/Listening have mobile HTML versions?

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Naming Convention Fix (Now)
- [ ] Rename all PascalCase files to kebab-case
- [ ] Update all imports in dashboard and other files
- [ ] Test that all dialogs still work

### Phase 2: Clean Up (After user confirmation)
- [ ] Delete confirmed unused files
- [ ] Archive old versions (git history preserves them)

### Phase 3: Algorithm Alignment (After decision)
- [ ] Align all modules to approved algorithm (SM-2 or FSRS-6)
- [ ] Update documentation

### Phase 4: Feature Parity (After priorities)
- [ ] Port Short Stories to React
- [ ] Consider mobile versions for desktop-only modules

---

**Status:** Ready to proceed with Phase 1 (Naming Convention Fix)
**Blocked on:** User decisions for Phases 2-4
