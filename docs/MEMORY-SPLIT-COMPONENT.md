# Memory Split Game Component

**Component:** `src/components/learning/practice-modes/memory-split-game.tsx`
**Created:** 17. Februar 2026
**Version:** 1.0.0

---

## Overview

Shared dual-grid memory game component with two game modes:

- **Split Mode:** Cards always visible, match by association (top ↔ bottom grid)
- **Flip Mode:** Cards hidden, classic memory game with 3D flip animation

---

## Features

### Core Features
- ✅ **Two Game Modes:** Split (always visible) + Flip (classic memory)
- ✅ **Flexible Pair Counts:** 6, 8, or 12 pairs
- ✅ **Dual-Grid Layout:** Separate top (user language) and bottom (Greek) grids
- ✅ **Independent Shuffle:** Each grid shuffled independently
- ✅ **Audio Playback:** Greek cards can play pronunciation audio
- ✅ **Solution Button:** Reveals matching card with -10 score penalty
- ✅ **Score Calculation:** Based on mistakes, time, and solution usage
- ✅ **Animations:** 3D flip (flip mode) + selection highlight (split mode)
- ✅ **Confetti Celebration:** On match and game completion

### Technical Features
- ✅ **TypeScript:** Fully typed with strict mode compatibility
- ✅ **Framer Motion:** Smooth animations and transitions
- ✅ **Responsive:** Works on Desktop and Mobile
- ✅ **Performance:** Optimized render cycle with useCallback
- ✅ **Accessibility:** ARIA attributes and keyboard navigation

---

## Props API

```typescript
interface MemorySplitProps {
  items: VocabularyPair[];        // Vocabulary pairs to use
  pairCount: 6 | 8 | 12;          // Number of pairs to show
  gameMode: 'split' | 'flip';     // Game mode
  userLanguage: 'en' | 'de' | 'es' | 'ru'; // User's language
  onComplete: (                   // Completion callback
    score: number,                // Final score (0-100)
    time: number,                 // Time in seconds
    mistakes: number              // Number of mistakes
  ) => void;
}

interface VocabularyPair {
  id: string;                     // Unique identifier
  userLanguage: string;           // Translated text (EN/DE/ES/RU)
  greek: string;                  // Greek text
  audioUrl?: string;              // Optional audio URL for Greek
}
```

---

## Usage Examples

### Desktop Implementation

```tsx
import { MemorySplitGame } from '@/components/learning/practice-modes/memory-split-game';

function DesktopPracticePage() {
  const vocabularyPairs: VocabularyPair[] = [
    {
      id: '1',
      userLanguage: 'Hello',
      greek: 'Γειά σου',
      audioUrl: '/audio/hello.mp3'
    },
    {
      id: '2',
      userLanguage: 'Thank you',
      greek: 'Ευχαριστώ',
      audioUrl: '/audio/thank-you.mp3'
    },
    // ... more pairs (need 12 for pairCount: 12)
  ];

  const handleComplete = (score: number, time: number, mistakes: number) => {
    console.log('Game completed:', { score, time, mistakes });
    // Save to database, show results dialog, etc.
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Memory Split Game</h1>

      {/* Split Mode - 12 pairs */}
      <MemorySplitGame
        items={vocabularyPairs}
        pairCount={12}
        gameMode="split"
        userLanguage="en"
        onComplete={handleComplete}
      />
    </div>
  );
}
```

### Mobile Implementation

```tsx
import { MemorySplitGame } from '@/components/learning/practice-modes/memory-split-game';

function MobilePracticePage() {
  const vocabularyPairs: VocabularyPair[] = [
    // ... vocabulary pairs (need 6 for mobile)
  ];

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Memory Game</h1>

      {/* Flip Mode - 6 pairs (smaller for mobile) */}
      <MemorySplitGame
        items={vocabularyPairs}
        pairCount={6}
        gameMode="flip"
        userLanguage="en"
        onComplete={(score, time, mistakes) => {
          alert(`Score: ${score} | Time: ${time}s | Mistakes: ${mistakes}`);
        }}
      />
    </div>
  );
}
```

### Integration with Practice Modes

```tsx
import { MemorySplitGame } from '@/components/learning/practice-modes/memory-split-game';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function PracticeModeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { userLanguage } = useLanguage(); // From context

  const handleComplete = async (score: number, time: number, mistakes: number) => {
    // Calculate FSRS rating
    const rating = score >= 85 ? 4 : score >= 65 ? 3 : score >= 50 ? 2 : 1;

    // Save to database
    await recordPracticeAttempt({
      itemId: 'vocabulary-item-123',
      mode: 'memory_split',
      score,
      timeSeconds: time,
      mistakes,
      fsrsRating: rating
    });

    // Close dialog
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-6xl">
        <MemorySplitGame
          items={vocabularyPairs}
          pairCount={8}
          gameMode="split"
          userLanguage={userLanguage as UserLanguage}
          onComplete={handleComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## Game Modes

### Split Mode (`gameMode: 'split'`)

**Behavior:**
- All cards are **always visible** (text shown)
- User clicks cards to select them
- Selected cards get **blue highlight** with scale animation
- Match validated when 2 cards selected (one from each grid)

**Best for:**
- Beginners
- Learning new vocabulary
- Recognition practice

**UI:**
```
Top Grid (English):    [Hello]  [Water]  [Thank you]
                          ↓        ↓         ↓
Bottom Grid (Greek):   [Νερό]  [Γειά σου]  [Ευχαριστώ]
```

### Flip Mode (`gameMode: 'flip'`)

**Behavior:**
- All cards are **hidden** (show 🎴 emoji)
- User clicks to **flip cards** (3D rotation animation)
- Flipped cards show text
- Match validated when 2 cards flipped

**Best for:**
- Advanced learners
- Memory training
- Recall practice

**UI:**
```
Top Grid (English):    [🎴]  [🎴]  [🎴]
                        ↓ click
                      [Hello]

Bottom Grid (Greek):   [🎴]  [🎴]  [🎴]
                        ↓ click
                      [Γειά σου]
```

---

## Grid Configurations

Grid layout automatically adjusts based on `pairCount`:

| Pair Count | Grid Layout | Total Cards | Best For |
|------------|-------------|-------------|----------|
| 6          | 3×2         | 12 cards    | Mobile, Quick practice |
| 8          | 4×2         | 16 cards    | Desktop, Medium difficulty |
| 12         | 4×3         | 24 cards    | Desktop, Challenge mode |

**CSS Grid:**
```tsx
const getGridConfig = (count: PairCount) => {
  switch(count) {
    case 6: return { cols: 3, rows: 2 }; // 3×2
    case 8: return { cols: 4, rows: 2 }; // 4×2
    case 12: return { cols: 4, rows: 3 }; // 4×3
  }
};
```

---

## Score Calculation

```typescript
const calculateScore = (): number => {
  const baseScore = 100;
  const mistakePenalty = mistakes * 5;        // -5 per mistake
  const solutionPenalty = solutionsUsed * 10; // -10 per solution
  const timePenalty = elapsedTime > 120
    ? (elapsedTime - 120)
    : 0;                                      // -1 per sec over 2min

  return Math.max(0, baseScore - mistakePenalty - solutionPenalty - timePenalty);
};
```

**Examples:**
- Perfect game (0 mistakes, 0 solutions, <2min): **100 points**
- 3 mistakes, 1 solution, 90 sec: **100 - 15 - 10 = 75 points**
- 5 mistakes, 2 solutions, 150 sec: **100 - 25 - 20 - 30 = 25 points**

---

## State Management

### Card State
```typescript
interface CardState {
  id: string;             // Unique card ID
  pairId: string;         // Matching pair ID
  text: string;           // Display text
  language: 'user' | 'greek';
  grid: 'top' | 'bottom';
  isFlipped: boolean;     // Only for flip mode
  isSelected: boolean;    // Only for split mode
  isMatched: boolean;     // Card successfully matched
  audioUrl?: string;      // Audio URL (Greek only)
}
```

### Game State
```typescript
interface GameState {
  matches: number;        // Pairs matched
  mistakes: number;       // Wrong matches
  score: number;          // Current score
  startTime: number;      // Game start timestamp
  solutionPenalty: number; // Total solution penalty
  solutionsUsed: number;  // Times solution button used
}
```

---

## Audio Handling

Greek cards can have audio pronunciation:

```typescript
// Play audio when card clicked (split mode) or matched
const playAudio = (url: string) => {
  // Stop previous audio
  if (currentAudioRef.current) {
    currentAudioRef.current.pause();
    currentAudioRef.current.currentTime = 0;
  }

  // Play new audio
  const audio = new Audio(url);
  currentAudioRef.current = audio;
  audio.play().catch(err => console.log('Audio failed:', err));
};
```

**When audio plays:**
- **Split Mode:** When Greek card is clicked
- **Flip Mode:** When match is validated (Greek card)
- **Solution:** When solution reveals Greek card

---

## Solution Button

Reveals matching card with penalty:

```typescript
const handleSolution = () => {
  const selectedCard = cards.find(c =>
    (gameMode === 'flip' ? c.isFlipped : c.isSelected) && !c.isMatched
  );

  if (!selectedCard) return; // No card selected

  // Find matching card in opposite grid
  const oppositeGrid = selectedCard.grid === 'top' ? 'bottom' : 'top';
  const matchingCard = cards.find(c =>
    c.grid === oppositeGrid && c.pairId === selectedCard.pairId
  );

  if (matchingCard) {
    handleCardClick(matchingCard.id); // Flip/select matching card

    // Apply penalty
    setGameState(prev => ({
      ...prev,
      score: Math.max(0, prev.score - 10),
      solutionsUsed: prev.solutionsUsed + 1
    }));
  }
};
```

**Penalty:** -10 points per use
**Disabled when:** No card selected or game over

---

## Animations

### 3D Flip Animation (Flip Mode)

Uses Framer Motion with CSS `transform-style: preserve-3d`:

```tsx
<motion.button
  animate={{ rotateY: isFlipped ? 180 : 0 }}
  transition={{ duration: 0.6, type: 'spring' }}
  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
>
  {/* Front Face (🎴) */}
  <div className="card-face card-front" style={{ backfaceVisibility: 'hidden' }}>
    🎴
  </div>

  {/* Back Face (Text) */}
  <div className="card-face card-back" style={{ transform: 'rotateY(180deg)' }}>
    {text}
  </div>
</motion.button>
```

### Selection Highlight (Split Mode)

Uses Framer Motion scale + border color animation:

```tsx
<motion.button
  animate={{
    scale: isSelected ? 1.05 : 1,
    borderColor: isSelected
      ? 'rgba(59, 130, 246, 1)'
      : 'rgba(255, 255, 255, 0.2)'
  }}
  transition={{ duration: 0.2 }}
  className={`
    ${isSelected
      ? 'shadow-lg shadow-blue-500/50'
      : 'hover:border-primary'
    }
  `}
>
  {text}
</motion.button>
```

### Match Celebration

Confetti animation on successful match:

```typescript
const triggerConfetti = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
  });
};
```

---

## Performance Optimization

### useCallback for Audio
```typescript
const playAudio = useCallback((url: string) => {
  // ... audio logic
}, []); // No dependencies, prevents re-creation
```

### Memoized Grid Config
```typescript
const gridConfig = useMemo(() => getGridConfig(pairCount), [pairCount]);
```

### Efficient State Updates
```typescript
// Batch state updates
setCards(prev => prev.map(c =>
  c.id === cardId ? { ...c, isFlipped: true } : c
));
```

---

## Testing

### Unit Tests

```typescript
// Test shuffle algorithm
test('shuffleCards creates unique shuffled grids', () => {
  const pairs = mockVocabularyPairs(12);
  const cards = shuffleCards(pairs, 12, 'split');

  expect(cards.length).toBe(24); // 12 pairs × 2
  expect(cards.filter(c => c.grid === 'top')).toHaveLength(12);
  expect(cards.filter(c => c.grid === 'bottom')).toHaveLength(12);
});

// Test match validation
test('checkMatch returns true for matching pairs', () => {
  const card1 = { pairId: 'pair-1', grid: 'top' };
  const card2 = { pairId: 'pair-1', grid: 'bottom' };

  expect(checkMatch(card1, card2)).toBe(true);
});

// Test score calculation
test('calculateScore applies penalties correctly', () => {
  const state = {
    mistakes: 3,
    solutionsUsed: 2,
    elapsedTime: 150 // 2.5 minutes
  };

  // 100 - (3*5) - (2*10) - (150-120) = 100 - 15 - 20 - 30 = 35
  expect(calculateScore(state)).toBe(35);
});
```

### Integration Tests

```typescript
// Test complete game flow
test('game completes after all pairs matched', async () => {
  const onComplete = jest.fn();

  render(
    <MemorySplitGame
      items={mockPairs}
      pairCount={6}
      gameMode="split"
      userLanguage="en"
      onComplete={onComplete}
    />
  );

  // Simulate matching all pairs
  // ... click cards, validate matches

  await waitFor(() => {
    expect(onComplete).toHaveBeenCalledWith(
      expect.any(Number), // score
      expect.any(Number), // time
      expect.any(Number)  // mistakes
    );
  });
});
```

---

## Styling Requirements

### Required CSS (globals.css)

```css
/* 3D Flip Animation */
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-front {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
}

.card-back {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(59, 130, 246, 0.1));
  transform: rotateY(180deg);
}
```

---

## Dependencies

```json
{
  "framer-motion": "^11.x",
  "lucide-react": "^0.x",
  "canvas-confetti": "^1.x"
}
```

Install if missing:
```bash
npm install framer-motion lucide-react canvas-confetti
```

---

## Accessibility

- ✅ **Keyboard Navigation:** Cards focusable with Tab key
- ✅ **ARIA Labels:** `aria-label` on interactive elements
- ✅ **Screen Reader:** Announces matches and game state
- ✅ **Focus Visible:** Clear focus indicators on cards
- ✅ **Color Contrast:** WCAG AA compliant (4.5:1 ratio)

---

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full support |
| Firefox | 88+     | ✅ Full support |
| Safari  | 14+     | ✅ Full support |
| Edge    | 90+     | ✅ Full support |
| iOS Safari | 14+ | ✅ Full support |
| Android Chrome | 90+ | ✅ Full support |

**Features used:**
- CSS 3D Transforms (widely supported)
- Web Audio API (fallback: silent mode)
- Framer Motion (React 18+)

---

## Troubleshooting

### Cards not flipping in Flip Mode

**Problem:** Cards show text immediately, no flip animation

**Solution:** Check CSS is loaded (`card-face` classes exist)

```bash
# Verify CSS imported in layout
cat src/app/layout.tsx | grep globals.css
```

### Audio not playing

**Problem:** Audio URL correct but no sound

**Solution:** Check browser autoplay policy

```typescript
// Workaround: User gesture required for first audio
const playAudio = (url: string) => {
  const audio = new Audio(url);
  audio.play().catch(err => {
    console.warn('Audio autoplay blocked:', err);
    // Fallback: Show visual indicator
  });
};
```

### Performance issues with 12 pairs

**Problem:** Lag when rendering 24 cards

**Solution:** Reduce animation complexity or pair count

```typescript
// Disable confetti on low-end devices
const shouldUseConfetti = () => {
  return !navigator.userAgent.match(/Android|iPhone|iPad/i);
};
```

---

## Future Enhancements

- [ ] **Difficulty Modes:** Easy (more time), Hard (less time)
- [ ] **Power-ups:** Reveal all cards for 3 seconds
- [ ] **Multiplayer:** Real-time head-to-head mode
- [ ] **Achievements:** Unlock badges for milestones
- [ ] **Leaderboard:** Track high scores
- [ ] **Custom Themes:** User-selectable card designs
- [ ] **Offline Mode:** Service Worker caching

---

## License

Internal component for **HellenicHorizons-GreekLingua-Dashboard**

---

**Last Updated:** 17. Februar 2026
**Maintained By:** Development Team
**Component Version:** 1.0.0
