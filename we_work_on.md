# GreekLingua Development Protocol & Todo List

## Current Status
- Dashboard layout is functional in Next.js.
- Supabase integration is initialized.
- Unified "Liquid Glass" design system is established.

## Project Protocol (21.01.2026)
- **Objective**: Implement the functional "Vokabeln" (Vocabulary) module.
- **Goal**: Transition from static tiles to a dynamic, Supabase-backed flashcard system with Spaced Repetition (SRS).
- **Design Directive**: Maintain macOS Dark Mode aesthetics, high white space, and specific CSS class usage for consistency.

## TODO List

### 1. Database Alignment
- [ ] Verify/Create `learning_items` and `student_progress` tables in Supabase (as requested).
- [ ] Populate `learning_items` with sample vocabulary data.

### 2. Vokabeln Module Implementation
- [x] Create/Update `vocabulary-view` component/logic.
- [x] Implement dynamic data fetching from `learning_items` (LIMIT 20, ordered by `next_review`).
- [x] Build interactive Flashcard logic (English -> Greek).
- [x] Implement Flip Animation (`.flipped` class).
- [x] Add Rating Buttons (Schwer, Gut, Sehr gut).

### 3. SRS Logic (Spaced Repetition System)
- [x] Implement "Schwer" -> Interval reset (1 day).
- [x] Implement "Gut" -> Interval × 2.5.
- [x] Implement "Sehr gut" -> Interval × 3.
- [x] Implement `upsert` logic for `student_progress` tracking.

### 4. UI & Navigation
- [ ] Implement `.back-btn` logic to return to Dashboard.
- [ ] Add progress indicator ("X/Y fällig").
- [ ] Ensure seamless transition between `.view` elements.

### 5. Final Polishing
- [ ] Verify macOS Dark Mode styling.
- [ ] Conduct functional testing with live Supabase data.
- [ ] Document JavaScript/React logic for user review.
