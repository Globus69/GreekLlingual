# Dashboard Update: Vocabulary Modules Integration

**Date:** 2026-02-19
**File:** `src/app/m/page.tsx`
**Purpose:** Add counts and navigation for Review Vocab & Weak Words modules

---

## Changes Required

### 1. Add State for Counts (after line 27)

```tsx
const [showGrammarDialog, setShowGrammarDialog] = useState(false);
// ADD THESE TWO LINES:
const [reviewCount, setReviewCount] = useState(0);
const [weakCount, setWeakCount] = useState(0);
```

### 2. Load Counts from RPCs (after line 70, inside existing useEffect)

```tsx
useEffect(() => {
  if (!authLoading) {
    const storedUser = localStorage.getItem('greeklingua_user');

    // ... existing code ...

    // ADD THIS SECTION:
    // Load vocabulary module counts
    if (user?.id) {
      supabase.rpc('get_review_vocabulary_count', { p_user_id: user.id })
        .then(({ data }) => setReviewCount(data || 0));

      supabase.rpc('get_weak_vocabulary_count', { p_user_id: user.id })
        .then(({ data }) => setWeakCount(data || 0));
    }
  }
}, [authUser, authLoading, router, localUser, user?.id]); // ADD user?.id to dependencies
```

### 3. Update Review Vocab Tile (line 231-238)

**REPLACE:**
```tsx
<ModuleTile
  icon="📖"
  title="Review Vocab"
  subtitle="Practice words"
  color="green"
  onClick={() => setShowReviewDialog(true)}
/>
```

**WITH:**
```tsx
<ModuleTile
  icon="🔄"
  title="Review Vocab"
  subtitle={reviewCount > 0 ? `${reviewCount} cards` : 'No cards'}
  color="orange"
  onClick={() => router.push('/m/vocabulary/review')}
/>
```

### 4. Update Weak Words Tile (line 239-246)

**REPLACE:**
```tsx
<ModuleTile
  icon="💪"
  title="Weak Words"
  subtitle="Train difficult"
  color="orange"
  onClick={() => setShowWeakWordsDialog(true)}
/>
```

**WITH:**
```tsx
<ModuleTile
  icon="⚠️"
  title="Weak Words"
  subtitle={weakCount > 0 ? `${weakCount} cards` : 'No weak words!'}
  color="orange"
  onClick={() => router.push('/m/vocabulary/weak')}
/>
```

### 5. Optional: Add Vocabulary Tile (after line 230, BEFORE Review Vocab)

If you want a dedicated "Due Cards" tile (currently accessed via "Due Cards" at line 226-230):

```tsx
<ModuleTile
  icon="📚"
  title="Vocabulary"
  subtitle="Due cards"
  color="blue"
  onClick={() => router.push('/m/vocabulary')}
/>
```

---

## Complete Updated Section (Lines 225-280)

```tsx
        {/* 1-Column Layout - 6 Modules (Extras moved to Bottom Nav) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {/* Main Learning Tiles */}
          <ModuleTile
            icon="📅"
            title="Due Cards"
            subtitle={`${stats.dueCount} waiting`}
            color="blue"
            onClick={() => setShowDueCardsSheet(true)}
          />

          {/* NEW: Vocabulary Module (optional) */}
          <ModuleTile
            icon="📚"
            title="Vocabulary"
            subtitle="Practice due cards"
            color="blue"
            onClick={() => router.push('/m/vocabulary')}
          />

          {/* UPDATED: Review Vocab */}
          <ModuleTile
            icon="🔄"
            title="Review Vocab"
            subtitle={reviewCount > 0 ? `${reviewCount} cards` : 'No cards'}
            color="orange"
            onClick={() => router.push('/m/vocabulary/review')}
          />

          {/* UPDATED: Weak Words */}
          <ModuleTile
            icon="⚠️"
            title="Weak Words"
            subtitle={weakCount > 0 ? `${weakCount} cards` : 'No weak words!'}
            color="orange"
            onClick={() => router.push('/m/vocabulary/weak')}
          />

          <ModuleTile
            icon="💬"
            title="Daily Phrases"
            subtitle="Useful phrases"
            color="purple"
            onClick={() => setShowDailyPhrasesDialog(true)}
          />
          {/* Grammar - DISABLED (grau, kein Action) */}
          <ModuleTile
            icon="📐"
            title="Grammar"
            subtitle="Practice rules"
            color="orange"
            disabled={true}
            onClick={() => {}}
          />

          {/* Brain Gym - NEW (Memory Training) */}
          <ModuleTile
            icon="🧠"
            title="Brain Gym"
            subtitle="Memory Training"
            color="orange"
            onClick={() => router.push('/m/brain-gym')}
          />

          {/* Spiele - DISABLED (grau, kein Action) */}
          <ModuleTile
            icon="🎮"
            title="Spiele"
            subtitle="Games & Practice"
            color="purple"
            disabled={true}
            onClick={() => {}}
          />
        </div>
```

---

## Notes

1. **Remove Old Dialogs:** The old `VocabularyDialog` and `WeakWordsDialog` imports/usages (lines 10, 13, 22, 23, 295-309) can be removed if not used elsewhere.

2. **Counts Refresh:** Counts only refresh on page load/mount. For real-time updates after session, add `refresh()` calls in the new routes after `handleRating()`.

3. **Color Consistency:** Both Review & Weak use `color="orange"` to differentiate from main Vocabulary (blue).

4. **Empty State:** Subtitle shows "No cards" / "No weak words!" when count is 0.

---

## Summary of Changes

| Line Range | Action | Description |
|------------|--------|-------------|
| ~28 | ADD | State for `reviewCount`, `weakCount` |
| ~70 | ADD | RPC calls to load counts |
| 231-238 | MODIFY | Update Review Vocab tile (subtitle + navigation) |
| 239-246 | MODIFY | Update Weak Words tile (subtitle + navigation) |
| ~230 (optional) | ADD | New Vocabulary tile for `/m/vocabulary` |

---

**End of Dashboard Update Guide**
