# Memory Game Component - Technical Documentation

**Created:** 2026-02-17
**Component:** `/src/components/learning/practice-modes/memory-game.tsx`
**Test Page:** `/src/app/test-memory/page.tsx`

---

## Overview

Fully functional Memory Game component with flip animations, sound effects, confetti celebrations, and comprehensive stats tracking. Built using Framer Motion for smooth animations and canvas-confetti for visual feedback.

---

## Features

### Core Functionality
- **Flip Animation:** Smooth 3D card flip using Framer Motion
- **Match Detection:** Automatic pair matching logic
- **Sound Effects:** Web Audio API beep on successful match
- **Confetti:** Canvas-confetti particles on match and game completion
- **Animated Removal:** Matched cards fade out gracefully
- **Stats Tracking:** Attempts, matches, and time tracking
- **Responsive:** Works on Desktop (4-6 columns) and Mobile (3 columns)
- **Language Toggle:** Support for Greek-first or English-first display

### Visual Feedback
- Cards rotate 180° on flip
- Green highlight on matched pairs
- Confetti burst on each match
- Big celebration on game completion
- Check icon on matched cards
- Smooth scale transitions

---

## Component API

### Props

```typescript
interface MemoryGameProps {
    cards: MemoryCard[];           // Array of cards to display
    showGreekFirst: boolean;       // Language direction toggle
    onComplete?: (stats: GameStats) => void;  // Completion callback
    isMobile?: boolean;            // Mobile layout flag
}

interface MemoryCard {
    id: string;                    // Unique card ID
    content: string;               // Card text (Greek or English)
    language: 'greek' | 'user';    // Card language type
    pairId: string;                // Pair identifier for matching
}

interface GameStats {
    attempts: number;              // Total flip attempts
    matches: number;               // Number of pairs matched
    time: number;                  // Time in seconds
}
```

### Example Usage

```typescript
import { MemoryGame } from '@/components/learning/practice-modes/memory-game';

const cards = [
    { id: 'greek-1', content: 'Γεια σου', language: 'greek', pairId: 'pair-1' },
    { id: 'user-1', content: 'Hello', language: 'user', pairId: 'pair-1' },
    // ... more pairs
];

function MyComponent() {
    const handleComplete = (stats) => {
        console.log(`Completed in ${stats.attempts} attempts!`);
    };

    return (
        <MemoryGame
            cards={cards}
            showGreekFirst={true}
            onComplete={handleComplete}
            isMobile={false}
        />
    );
}
```

---

## Architecture

### State Management

```typescript
const [flipped, setFlipped] = useState<string[]>([]);      // Currently flipped cards
const [matched, setMatched] = useState<string[]>([]);      // Matched card IDs
const [attempts, setAttempts] = useState(0);               // Total attempts
const [isChecking, setIsChecking] = useState(false);       // Prevent rapid clicks
const [gameComplete, setGameComplete] = useState(false);   // Game finished flag
```

### Game Flow

1. **Click Card** → Add to `flipped` array
2. **Two Cards Flipped** → Run `checkMatch()`
3. **Match Found** → Add to `matched`, play sound, trigger confetti
4. **No Match** → Reset `flipped` after 1s delay
5. **All Matched** → Game complete, big celebration

---

## Animations

### Card Flip (Framer Motion)

```typescript
<motion.button
    animate={{
        rotateY: isFlipped || isMatched ? 180 : 0,
    }}
    transition={{
        duration: 0.6,
        ease: 'easeInOut',
    }}
    style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
    }}
>
    {/* Front face */}
    <div style={{ backfaceVisibility: 'hidden' }}>
        ?
    </div>

    {/* Back face */}
    <div style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)'
    }}>
        {content}
    </div>
</motion.button>
```

### Card Removal

```typescript
<AnimatePresence mode="popLayout">
    {cards.map(card => (
        <motion.div
            exit={{
                scale: 0,
                opacity: 0,
                transition: { duration: 0.3 }
            }}
        >
            <Card {...card} />
        </motion.div>
    ))}
</AnimatePresence>
```

---

## Sound Effects

### Web Audio API

```typescript
const playMatchSound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
};
```

**Features:**
- No external audio files needed
- Simple sine wave beep
- 0.5s duration
- Volume fade-out

---

## Confetti

### Canvas Confetti Integration

```typescript
// Single match
const triggerConfetti = () => {
    confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
    });
};

// Game completion (continuous)
const celebrateCompletion = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            clearInterval(interval);
            return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
            particleCount,
            origin: { x: Math.random(), y: Math.random() - 0.2 }
        });
    }, 250);
};
```

---

## Styling

### Grid Layout

```typescript
<div className={`
    grid gap-3
    ${isMobile
        ? 'grid-cols-3'  // Mobile: 3 columns
        : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6'  // Desktop: 4-6 columns
    }
`}>
```

### Card Styling

- **Unflipped:** Purple gradient with "?" icon
- **Flipped:** White background with content
- **Matched:** Green background with check icon
- **Aspect Ratio:** 3:4 (portrait cards)
- **Border:** 2px solid with color based on state

---

## Testing

### Test Page

**URL:** `/test-memory`

**Features:**
- Mock data (6 pairs, 12 cards)
- Language toggle (Greek first / English first)
- Mobile/Desktop view toggle
- Reset game button
- Live stats display
- Instructions panel

### How to Test

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Start dev server
npm run dev

# 3. Navigate to test page
open http://localhost:3000/test-memory

# 4. Test features:
# - Click cards to flip
# - Match pairs
# - Listen for sound
# - Watch confetti
# - Toggle language direction
# - Test mobile view
# - Reset and replay
```

---

## Integration

### With Practice Modes

```typescript
// In practice-mode-dialog.tsx
import { MemoryGame } from '@/components/learning/practice-modes/memory-game';

// Prepare cards from vocabulary items
const prepareMemoryCards = (items: VocabItem[]) => {
    const cards: MemoryCard[] = [];

    items.forEach((item, index) => {
        const pairId = `pair-${index}`;

        cards.push({
            id: `greek-${index}`,
            content: item.greek,
            language: 'greek',
            pairId
        });

        cards.push({
            id: `user-${index}`,
            content: item.english,
            language: 'user',
            pairId
        });
    });

    // Shuffle cards
    return cards.sort(() => Math.random() - 0.5);
};

// In component
<MemoryGame
    cards={prepareMemoryCards(vocabularyItems)}
    showGreekFirst={config.show_greek_first}
    onComplete={handleGameComplete}
    isMobile={isMobileDevice}
/>
```

---

## Dependencies

### Required Packages

```json
{
    "framer-motion": "^11.x",      // Animation library
    "canvas-confetti": "^1.x",     // Confetti effects
    "@types/canvas-confetti": "^1.x"  // TypeScript types
}
```

### Installation

```bash
npm install framer-motion canvas-confetti
npm install --save-dev @types/canvas-confetti
```

---

## Performance

### Optimizations

- **useCallback:** Memoized sound/confetti functions
- **AnimatePresence:** Smooth entry/exit animations
- **Layout animations:** Automatic position transitions
- **Conditional rendering:** Only render visible cards

### Browser Compatibility

- **Framer Motion:** Modern browsers (ES6+)
- **Web Audio API:** All modern browsers
- **Canvas Confetti:** All browsers with Canvas support
- **Fallback:** Sound gracefully degrades if AudioContext unavailable

---

## Future Enhancements

### Potential Improvements

1. **Audio Files:** Replace Web Audio beeps with MP3/WAV files
2. **Difficulty Levels:** Adjust grid size (4, 6, 8 pairs)
3. **Timer:** Add countdown timer for challenge mode
4. **Hints:** Show one card briefly as hint
5. **Themes:** Different card designs/colors
6. **Accessibility:** Keyboard navigation, ARIA labels
7. **Persistence:** Save in-progress games
8. **Multiplayer:** Two-player competitive mode

---

## Known Issues

### Current Limitations

- **Mobile Sound:** May not work on iOS without user gesture
- **Performance:** Large grids (10+ pairs) may lag on older devices
- **No Keyboard:** Mouse/touch only (no keyboard support yet)

---

## Credits

**Built by:** Agent 3 (Game Logic & Animation Specialist)
**Date:** 2026-02-17
**Task:** Shared Memory Game Component
**Dependencies:** Framer Motion, Canvas Confetti

---

## Related Files

- `/src/components/learning/practice-modes/memory-game.tsx` - Main component
- `/src/app/test-memory/page.tsx` - Test page
- `/src/components/learning/practice-modes/matching-game.tsx` - Similar game
- `/src/components/learning/practice-modes/practice-mode-dialog.tsx` - Integration point

---

**Status:** ✅ COMPLETE
**Tests:** ✅ Test page created
**Documentation:** ✅ This file
**Integration:** ⏳ Ready for Agents 1 & 2
