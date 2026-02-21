# Due Cards Today

This module is responsible for the unified scheduled review ("Train Weak" / Due Cards) of all types of learning items (Vocabulary and Daily Phrases) using the FSRS algorithm.

## FSRS Implementation Architecture

The `DueCardsDialog.tsx` component handles the complex logic of displaying a mixed queue of vocabulary and daily phrase cards that are due for review.

### 1. Data Fetching
The cards are fetched using the `get_due_cards_today` RPC function (introduced in Migration 094). This function:
- Queries the `user_vocabulary_progress` table for vocabulary items due today.
- Queries the `student_progress` table for daily phrases due today.
- Returns a unified set of `FSRSLearningItem` objects sorted by `fsrs_due` date.

### 2. Visual Differentiation
Within the `FlashcardFSRS` component, cards are visually differentiated using a small badge in the top right corner indicating whether the card is a "📚 Vocabulary" item or a "💬 Daily Phrase". This helps provide context to the user since the items are mixed together.

### 3. FSRS Scheduling & Database Updates
When a user rates a card (1-4), the `FSRSScheduler` calculates the new difficulty, stability, and next due date. 

The update is then routed to the correct database table based on the `type` property of the card:
- **`type === 'vocabulary'`**: Calls the `update_card_fsrs` RPC (updating `user_vocabulary_progress`).
- **`type === 'daily_phrase'`**: Calls the `update_phrase_fsrs` RPC (updating `student_progress`).

This decoupled architecture allows the UI to handle any type of learning item as long as it conforms to the `FSRSLearningItem` interface and has a corresponding update RPC.
