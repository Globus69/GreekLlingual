# Brain Gym RPC Functions Documentation

**Created:** 2026-02-19
**Updated:** 2026-02-19
**Status:** Implemented, awaiting migration deployment

---

## Overview

Brain Gym uses 3 RPC functions to provide different vocabulary card sources for the Memory Game. All functions integrate with FSRS-6 scheduling system.

---

## RPC Functions

### 1. get_due_vocabulary_cards (existing)

**Purpose:** Returns cards that are due for review

**Parameters:**
- `p_user_id` (UUID) - User ID
- `p_limit` (INT, default: 100) - Maximum cards to return

**Filter Logic:**
- `fsrs_due <= NOW()` (cards due for review)
- OR `fsrs_due IS NULL` (new cards never reviewed)

**Sorting:**
- Due date (oldest first)
- Then by difficulty (hardest first)

**Use Case:** Brain Gym "📅 Due Cards" dropdown

**Migration:** Existing (migration 072)

---

### 2. get_all_vocabulary_cards (NEW)

**Purpose:** Returns all vocabulary cards for general practice

**Parameters:**
- `p_user_id` (UUID) - User ID
- `p_limit` (INT, default: 100) - Maximum cards to return

**Filter Logic:**
- All cards of type 'vocabulary'
- Includes cards with and without progress data

**Sorting:**
- Random order (for variety)

**Use Case:** Brain Gym "📖 Review Vocabulary" dropdown

**Migration:** 073 (NEW)

---

### 3. get_weak_vocabulary_cards (NEW)

**Purpose:** Returns difficult/weak vocabulary cards for targeted practice

**Parameters:**
- `p_user_id` (UUID) - User ID
- `p_limit` (INT, default: 100) - Maximum cards to return

**Filter Logic:**
- `fsrs_difficulty > 7.0` (high difficulty on 0-10 scale)
- OR `fsrs_lapses >= 3` (multiple mistakes)
- OR `fsrs_state = 'relearning'` (currently relearning)
- Only cards with progress data (INNER JOIN)

**Sorting:**
- Difficulty DESC (hardest first)
- Lapses DESC (most mistakes first)
- Last review DESC

**Use Case:** Brain Gym "💪 Weak Words" dropdown

**Migration:** 073 (NEW)

---

## FSRS-6 Integration

All RPC functions return the following FSRS-6 fields:

| Field | Type | Default (new cards) | Description |
|-------|------|---------------------|-------------|
| `fsrs_difficulty` | REAL | 6.4133 | Difficulty rating (0-10) |
| `fsrs_stability` | REAL | 0.212 | Memory stability in days |
| `fsrs_due` | TIMESTAMPTZ | NOW() | Next review timestamp |
| `fsrs_reps` | INT | 0 | Number of repetitions |
| `fsrs_lapses` | INT | 0 | Number of mistakes |
| `fsrs_state` | TEXT | 'new' | Card state (new/learning/review/relearning) |

**Legacy Fields (for compatibility):**
- `ease_factor` (default: 2.5)
- `interval_days` (default: 0)
- `next_review` (default: NOW())

For new cards without `student_progress` entry, default values are used via `COALESCE()`.

---

## Usage in Brain Gym

### TypeScript Example

```typescript
// Due Cards
const { data, error } = await supabase.rpc('get_due_vocabulary_cards', {
  p_user_id: user.id,
  p_limit: 8
});

// Review Vocabulary
const { data, error } = await supabase.rpc('get_all_vocabulary_cards', {
  p_user_id: user.id,
  p_limit: 8
});

// Weak Words
const { data, error } = await supabase.rpc('get_weak_vocabulary_cards', {
  p_user_id: user.id,
  p_limit: 8
});
```

### Response Mapping

RPC responses are mapped to `PracticeItem` interface:

```typescript
interface PracticeItem {
  id: string;
  english: string;
  greek: string;
  phonetic?: string;
}
```

Only the fields needed for the Memory Game are extracted. FSRS data is available in the response but not currently used in the game UI.

---

## Data Source Dropdown

Brain Gym provides a dropdown to switch between data sources:

```tsx
<select value={dataSource} onChange={(e) => setDataSource(e.target.value)}>
  <option value="due_cards">📅 Due Cards</option>
  <option value="review_vocab">📖 Review Vocabulary</option>
  <option value="weak_words">💪 Weak Words</option>
</select>
```

When the dropdown changes:
1. Cache is refreshed (new RPC call)
2. Game state resets (flips, matches, mistakes)
3. New cards are loaded and shuffled

---

## Migration Files

### Migration 073: Brain Gym RPC Functions

**Location:**
- `/database/migrations/073_brain_gym_rpc_functions.sql`
- `/supabase/migrations/073_brain_gym_rpc_functions.sql`

**Created:** 2026-02-19

**Dependencies:**
- Migration 072 (FSRS-6 schema)
- `learning_items` table
- `student_progress` table

**Deployment Status:** ⏳ Pending (User must deploy via Supabase Dashboard)

**How to Deploy:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/073_brain_gym_rpc_functions.sql`
4. Execute SQL
5. Verify functions created:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_type = 'FUNCTION'
   AND routine_name LIKE '%vocabulary_cards%';
   ```

---

## Testing

See `BRAIN-GYM-RPC-TESTING.md` for complete testing checklist.

**Key Test Cases:**
1. Due Cards load correctly
2. Review Vocabulary returns all cards (random order)
3. Weak Words filters difficult cards
4. Cache refreshes on data source change
5. Empty states handled gracefully
6. Network errors handled gracefully

---

## Performance Considerations

### Indexing

Ensure indexes exist for optimal performance:

```sql
-- Index on fsrs_due for Due Cards query
CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_due
ON student_progress(fsrs_due);

-- Index on fsrs_difficulty for Weak Words query
CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_difficulty
ON student_progress(fsrs_difficulty);

-- Index on fsrs_lapses for Weak Words query
CREATE INDEX IF NOT EXISTS idx_student_progress_fsrs_lapses
ON student_progress(fsrs_lapses);
```

### Query Limits

Default limit is 100 cards, but Brain Gym uses `p_limit: 8` for the Memory Game (8 cards = 16 tiles in 4x4 grid).

### Caching

Brain Gym uses `useMobileCache` hook with 1-hour TTL:
- Cache key: `practice-items-${user.id}`
- Cache store: `practice_items`
- TTL: 1 hour

Cache is invalidated when:
- Data source changes
- User manually refreshes
- TTL expires

---

## Future Enhancements

### Potential Improvements

1. **Smart Mixing:** Combine Due + Weak Words for optimal practice
2. **FSRS Feedback:** Display difficulty/stability in game UI
3. **Progress Tracking:** Track Brain Gym sessions in separate table
4. **Achievements:** Unlock badges for perfect games, speed records
5. **Difficulty Levels:** Adjust grid size based on user preference (4x4, 6x6, 8x8)

### Database Extensions

Consider adding:
- `brain_gym_sessions` table to track game history
- `brain_gym_stats` view for user analytics
- Additional RPC for "Mixed Mode" (Due + Weak combined)

---

## Troubleshooting

### Error: "function get_all_vocabulary_cards does not exist"

**Solution:** Deploy migration 073 to Supabase

### Error: "No items available"

**Possible causes:**
- User has no vocabulary items in `learning_items`
- No items meet filter criteria (e.g., no weak words)
- RLS policies blocking access

**Solution:** Check `learning_items` table and RLS policies

### Error: "Permission denied for function"

**Solution:** Verify GRANT statements executed:
```sql
GRANT EXECUTE ON FUNCTION get_all_vocabulary_cards(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weak_vocabulary_cards(UUID, INT) TO authenticated;
```

---

## References

- **FSRS-6 Docs:** `docs/FSRS-6-INTEGRATION.md`
- **Brain Gym Component:** `src/app/m/brain-gym/page.tsx`
- **Mobile Cache Hook:** `src/hooks/use-mobile-cache.ts`
- **Testing Checklist:** `BRAIN-GYM-RPC-TESTING.md`

---

## Changelog

### 2026-02-19
- ✅ Created migration 073 with 2 new RPC functions
- ✅ Updated Brain Gym to use RPCs
- ✅ Added `phonetic` field to `PracticeItem` interface
- ✅ Created testing checklist
- ✅ Created documentation
- ⏳ Migration pending deployment

---

**Status:** Ready for deployment and testing
