# Phrases vs Vocab: Difference Analysis

**Date:** 2026-02-18

---

## 🔍 CURRENT STATE: `/admin/daily-phrases`

### Page Structure
**File:** `src/app/admin/daily-phrases/page.tsx`

### ✅ GOOD NEWS

The daily-phrases page is MUCH closer to the vocab reference! It already:
- ✅ Uses the same dark gradient background
- ✅ Uses the same inline style approach
- ✅ Has PhrasesStats component (identical structure to VocabStats)
- ✅ Has the same header layout
- ✅ Has the same filter section layout
- ✅ Has pagination

### ⚠️ DIFFERENCES TO FIX

---

## 1. HEADER SECTION

### Current
```typescript
<button onClick={handleExport} style={secondaryButtonStyle}>
    Export CSV
</button>
```

### Expected (from Vocab)
```typescript
<button onClick={() => setShowCreateModal(true)} style={primaryButtonStyle}>
    + Create Entry
</button>
<button onClick={() => setShowImportModal(true)} style={secondaryButtonStyle}>
    Import CSV
</button>
<button onClick={handleExport} style={secondaryButtonStyle}>
    Export CSV
</button>
```

**Missing:**
- ❌ "Create Entry" button (primary blue button)
- ❌ "Import CSV" button
- ❌ "Bulk Edit" button (when items selected)

---

## 2. STATS COMPONENT

### Current: PhrasesStats.tsx
- ✅ PERFECT! Identical structure to VocabStats
- ✅ Same 4 cards
- ✅ Same level distribution
- ✅ Same difficulty distribution
- ✅ Same audio coverage

**Status:** ✅ NO CHANGES NEEDED

---

## 3. TABLE SECTION

### Current
- ❌ Uses simple HTML table (inline in page.tsx)
- ❌ Only 6 columns: Checkbox, Greek, English, Level, Difficulty, Actions
- ❌ Missing 7 columns: Nr, Phonetic, DE, ES, RU, Frequency, Audio indicators
- ❌ No VocabTable-style component
- ❌ No badges for level/difficulty
- ❌ No translation cells with truncation
- ❌ No audio icon matrix
- ❌ No edit button (only delete)
- ❌ Different table styling (simpler)

### Expected
- Full VocabTable component structure
- 13 columns with all translations
- Level/difficulty color badges
- Frequency stars
- Audio indicators for all 4 languages
- Edit + Delete buttons
- Proper loading/empty states
- Same dark glassmorphism styling

**Status:** ❌ NEEDS COMPLETE REWRITE

---

## 4. MODALS

### Currently Missing:
- ❌ No PhrasesModal (Create/Edit)
- ❌ No PhrasesImportModal
- ❌ No PhrasesBulkEditModal

**All 3 modals need to be created by cloning from Vocab equivalents.**

---

## 5. FUNCTIONALITY GAPS

| Feature | Vocab | Phrases | Status |
|---------|-------|---------|--------|
| Create Entry | ✅ | ❌ | Missing |
| Edit Entry | ✅ | ❌ | Missing |
| Delete Entry | ✅ | ✅ | ✅ Present |
| Bulk Select | ✅ | ✅ | ✅ Present |
| Bulk Edit | ✅ | ❌ | Missing |
| Bulk Delete | ✅ | ✅ | ✅ Present |
| CSV Import | ✅ | ❌ | Missing |
| CSV Export | ✅ | ✅ | ✅ Present |
| Search Filter | ✅ | ✅ | ✅ Present |
| Level Filter | ✅ | ✅ | ✅ Present |
| Difficulty Filter | ✅ | ✅ | ✅ Present |
| Frequency Filter | ✅ | ❌ | Missing |
| Pagination | ✅ | ✅ | ✅ Present |

---

## 🎯 REQUIRED CHANGES

### High Priority (Critical for UI Consistency)

1. **Create PhrasesTable Component**
   - Clone from VocabTable.tsx
   - Adapt to PhraseEntry type
   - Keep exact same styling
   - 13-column structure

2. **Create PhrasesModal Component**
   - Clone from VocabModal.tsx
   - Adapt to daily_phrases table fields
   - Keep collapsible language sections
   - Keep duplicate checking

3. **Create PhrasesImportModal Component**
   - Clone from VocabImportModal.tsx
   - Adapt to phrases CSV format
   - Keep preview functionality

4. **Create PhrasesBulkEditModal Component**
   - Clone from VocabBulkEditModal.tsx
   - Same 3 fields: Level, Difficulty, Frequency

5. **Update Main Page**
   - Add Create button
   - Add Import button
   - Add Bulk Edit button (conditional)
   - Wire up all modals
   - Replace simple table with PhrasesTable component

---

### Medium Priority (UI Polish)

6. **Table Styling**
   - Add level/difficulty badges with colors
   - Add frequency stars
   - Add audio icon matrix
   - Add edit button to actions
   - Add translation tooltips

7. **Modal States**
   - Add showCreateModal state
   - Add showImportModal state
   - Add showBulkEditModal state
   - Add editEntry state

---

### Low Priority (Nice to Have)

8. **Frequency Filter**
   - Add to filters section (currently missing)
   - Same dropdown as vocab page

---

## 📋 DETAILED COMPONENT REQUIREMENTS

### 1. PhrasesTable.tsx
```typescript
// MUST HAVE:
- Same file structure as VocabTable.tsx
- Props: entries, loading, selectedIds, onSelectIds, onEdit, onDelete, onRefresh
- 13 columns: ☑ Nr Greek Phonetic EN DE ES RU Level Diff Freq Audio Actions
- Level badges with LEVEL_COLORS
- Difficulty badges with DIFFICULTY_COLORS
- Frequency stars (★★★☆☆)
- Audio icons (🔊/🔇) × 4
- Edit button (blue) + Delete button (red)
- Loading state (spinner + text)
- Empty state (icon + message)
- Same exact styling as VocabTable
```

### 2. PhrasesModal.tsx
```typescript
// MUST HAVE:
- Same glassmorphism modal overlay
- Header with title + close button
- Core fields section:
  - nr (optional)
  - greek_transcription (required)
  - greek_phonetic (optional)
  - level (required, dropdown)
  - difficulty (required, dropdown)
  - frequency (required, 1-5)
- Language sections (collapsible accordions):
  - English (expanded by default)
  - German
  - Spanish
  - Russian
  - Each with: translation, importance_reason, audio_url
- Footer with Cancel + Save buttons
- Validation with toast messages
- Duplicate checking
- Character counter for greek_transcription
- Frequency star preview
```

### 3. PhrasesImportModal.tsx
```typescript
// MUST HAVE:
- Same modal structure
- Template download buttons (3 variants)
- File upload with drag & drop
- Mode selector (Append/Overwrite)
- CSV preview table (first 10 rows)
- Validation error display
- Import result display (imported/skipped counts)
- Same styling as VocabImportModal
```

### 4. PhrasesBulkEditModal.tsx
```typescript
// MUST HAVE:
- Smaller modal (500px max-width)
- Header with selected count
- Info box (blue)
- 3 select fields:
  - Level (with "Leave unchanged" option)
  - Difficulty (with "Leave unchanged" option)
  - Frequency (with star preview)
- Footer with Cancel + Update buttons
- Same styling as VocabBulkEditModal
```

---

## ⚠️ CRITICAL STYLING CHECKS

### Colors
- [ ] Background gradient matches vocab
- [ ] Button colors match (primary blue, secondary white, delete red)
- [ ] Card backgrounds match (rgba(255,255,255,0.04))
- [ ] Text colors match (#fff, #8E8E93, #636366)

### Typography
- [ ] Page title: 32px, 700
- [ ] Subtitle: 14px, #8E8E93
- [ ] Button text: 14px, 600
- [ ] Table headers: 11px, 600, uppercase

### Spacing
- [ ] Page padding: 24px
- [ ] Card padding: 20px (stats), 24px (sections)
- [ ] Button padding: 12px 20px
- [ ] Card gap: 16px
- [ ] Border radius: 12px (buttons), 16px (cards), 20px (modals)

---

## 🔧 CODE CHANGES SUMMARY

### New Files to Create:
1. `src/components/admin/PhrasesTable.tsx` (clone VocabTable)
2. `src/components/admin/PhrasesModal.tsx` (clone VocabModal)
3. `src/components/admin/PhrasesImportModal.tsx` (clone VocabImportModal)
4. `src/components/admin/PhrasesBulkEditModal.tsx` (clone VocabBulkEditModal)

### Files to Update:
1. `src/app/admin/daily-phrases/page.tsx`
   - Add Create button
   - Add Import button
   - Add modal states
   - Replace simple table with PhrasesTable component
   - Add modal components at bottom

### Files Already Good:
- `src/components/admin/PhrasesStats.tsx` ✅ (no changes)

---

## 📊 COMPLETION CHECKLIST

### Phase 1: Components
- [ ] Create PhrasesTable.tsx
- [ ] Create PhrasesModal.tsx
- [ ] Create PhrasesImportModal.tsx
- [ ] Create PhrasesBulkEditModal.tsx

### Phase 2: Page Integration
- [ ] Update page.tsx header buttons
- [ ] Add modal states
- [ ] Replace table implementation
- [ ] Wire up Create functionality
- [ ] Wire up Edit functionality
- [ ] Wire up Import functionality
- [ ] Wire up Bulk Edit functionality

### Phase 3: Testing
- [ ] Test Create phrase
- [ ] Test Edit phrase
- [ ] Test Delete phrase
- [ ] Test Bulk Edit
- [ ] Test Bulk Delete
- [ ] Test CSV Import
- [ ] Test CSV Export
- [ ] Test all filters
- [ ] Test pagination
- [ ] Visual comparison with vocab page

---

**SEVERITY: MODERATE - Missing Components + Table Redesign**
**ESTIMATED TIME: 1.5-2 hours**
