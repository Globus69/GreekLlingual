# Memory Game - Visual Guide

**Visual reference for understanding the Memory Game component**

---

## 🎮 Game Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Matches: 0/6  |  Attempts: 0  |  [Reset Button]    │
└─────────────────────────────────────────────────────────────┘

Instructions: Click cards to flip and find matching pairs

┌────────┬────────┬────────┬────────┬────────┬────────┐
│   ?    │   ?    │   ?    │   ?    │   ?    │   ?    │  ← Unflipped
│        │        │        │        │        │        │     (Purple gradient)
└────────┴────────┴────────┴────────┴────────┴────────┘
┌────────┬────────┬────────┬────────┬────────┬────────┐
│   ?    │   ?    │   ?    │   ?    │   ?    │   ?    │
│        │        │        │        │        │        │
└────────┴────────┴────────┴────────┴────────┴────────┘

Desktop: 4-6 columns | Mobile: 3 columns
```

---

## 🔄 Game States

### 1. Initial State (All Cards Hidden)

```
┌────────┐  ┌────────┐  ┌────────┐
│   ?    │  │   ?    │  │   ?    │
│        │  │        │  │        │
└────────┘  └────────┘  └────────┘
    🟣          🟣          🟣
  Purple      Purple      Purple
```

### 2. One Card Flipped

```
┌────────┐  ┌────────┐  ┌────────┐
│ Hello  │  │   ?    │  │   ?    │
│        │  │        │  │        │
└────────┘  └────────┘  └────────┘
    🔵          🟣          🟣
  Selected     Hidden      Hidden
```

### 3. Two Cards Flipped (Checking Match)

```
┌────────┐  ┌────────┐  ┌────────┐
│ Hello  │  │Γεια σου│  │   ?    │
│        │  │        │  │        │
└────────┘  └────────┘  └────────┘
    🔵          🔵          🟣
  Card 1      Card 2      Hidden
```

### 4. Match Found ✅

```
┌────────┐  ┌────────┐  ┌────────┐
│ Hello✓ │  │Γεια σου│  │   ?    │
│        │  │    ✓   │  │        │
└────────┘  └────────┘  └────────┘
    🟢          🟢          🟣
  Matched     Matched     Hidden

🎉 Confetti + 🔊 Sound!
```

### 5. Match Removed (After 0.3s)

```
                        ┌────────┐
                        │   ?    │
                        │        │
                        └────────┘
    💨          💨          🟣
  Faded       Faded       Hidden
```

### 6. Game Complete 🎉

```
All cards matched!

🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉
   Congratulations!
   Completed in 10 attempts!
🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉

Continuous confetti for 3 seconds!
```

---

## 🎨 Color Scheme

### Card States

| State | Background | Border | Text | Icon |
|-------|-----------|--------|------|------|
| Hidden | `gradient-to-br from-primary/80 to-primary/60` | `border-primary` | White "?" | None |
| Flipped | `bg-card` | `border-border` | Black/Greek | None |
| Selected | `bg-blue-500/20` | `border-blue-500` | Black/Greek | None |
| Matched | `bg-green-500/20` | `border-green-500` | Green | ✓ Check |

### Confetti Colors

```
Purple:  #667eea
Magenta: #764ba2
Pink:    #f093fb
Blue:    #4facfe
```

---

## 📐 Layout Dimensions

### Desktop Grid

```
┌──────────────────────────────────────────────┐
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  │  ← 6 columns
│  └───┘  └───┘  └───┘  └───┘  └───┘  └───┘  │
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  │
│  └───┘  └───┘  └───┘  └───┘  └───┘  └───┘  │
└──────────────────────────────────────────────┘

Grid: grid-cols-4 sm:grid-cols-5 md:grid-cols-6
Gap: 0.75rem (gap-3)
Card: aspect-[3/4] (portrait)
```

### Mobile Grid

```
┌────────────────────────┐
│  ┌───┐  ┌───┐  ┌───┐  │  ← 3 columns
│  └───┘  └───┘  └───┘  │
│  ┌───┐  ┌───┐  ┌───┐  │
│  └───┘  └───┘  └───┘  │
│  ┌───┐  ┌───┐  ┌───┐  │
│  └───┘  └───┘  └───┘  │
│  ┌───┐  ┌───┐  ┌───┐  │
│  └───┘  └───┘  └───┘  │
└────────────────────────┘

Grid: grid-cols-3
Gap: 0.75rem (gap-3)
Card: aspect-[3/4] (portrait)
```

---

## 🔄 Animation Sequence

### Card Flip (0.6s)

```
Frame 0ms:    ┌────┐
              │ ?  │  rotateY(0deg)
              └────┘

Frame 150ms:  ┌────┐
              │ /  │  rotateY(45deg)
              └────┘

Frame 300ms:  ┌────┐
              │ |  │  rotateY(90deg)
              └────┘

Frame 450ms:  ┌────┐
              │ \  │  rotateY(135deg)
              └────┘

Frame 600ms:  ┌────────┐
              │ Hello  │  rotateY(180deg)
              └────────┘
```

### Match Animation (0.5s)

```
1. Cards turn green     (instant)
2. Sound plays          (0.5s beep)
3. Confetti bursts      (50 particles)
4. Check icon appears   (scale 0 → 1)
5. Cards fade out       (0.3s)
6. Cards removed        (layout shift)
```

### Completion Celebration (3s)

```
0.0s: Game detects all matched
0.0s: celebrateCompletion() starts
0.0s: First confetti burst (random position)
0.25s: Second burst
0.5s: Third burst
... (every 250ms)
3.0s: Final burst
3.0s: Celebration ends
```

---

## 🎵 Sound Waveform

```
Volume
  │
1 │     ╭╮
  │    ╱  ╲
  │   ╱    ╲
  │  ╱      ╲
0 │─╯────────╲─────
  0ms    250ms   500ms
      Time

Frequency: 800Hz sine wave
Duration: 0.5s
Fade: Exponential ramp
```

---

## 🎯 User Interaction Flow

```
┌─────────────────────┐
│  User clicks Card A │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Card A flips over  │
│  (0.6s animation)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  User clicks Card B │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Card B flips over  │
│  (0.6s animation)   │
└──────────┬──────────┘
           │
           ▼
      ┌────┴────┐
      │  Match? │
      └────┬────┘
           │
     ┌─────┴─────┐
     │           │
    Yes          No
     │           │
     ▼           ▼
┌─────────┐  ┌──────────┐
│ Sound   │  │ Wait 1s  │
│ Confetti│  └────┬─────┘
│ Green   │       │
└────┬────┘       ▼
     │       ┌──────────┐
     ▼       │ Flip     │
┌─────────┐  │ Back     │
│ Remove  │  └──────────┘
│ Cards   │
└─────────┘
```

---

## 📱 Responsive Breakpoints

### Breakpoint Table

| Screen Size | Columns | Cards per Row | Total Visible |
|-------------|---------|---------------|---------------|
| Mobile (< 640px) | 3 | 3 | 12 cards = 4 rows |
| Tablet (640px+) | 4-5 | 4-5 | 12 cards = 2-3 rows |
| Desktop (768px+) | 6 | 6 | 12 cards = 2 rows |

### Visual Comparison

```
MOBILE (3 cols):          DESKTOP (6 cols):
┌───┬───┬───┐             ┌───┬───┬───┬───┬───┬───┐
│ A │ B │ C │             │ A │ B │ C │ D │ E │ F │
├───┼───┼───┤             ├───┼───┼───┼───┼───┼───┤
│ D │ E │ F │             │ G │ H │ I │ J │ K │ L │
├───┼───┼───┤             └───┴───┴───┴───┴───┴───┘
│ G │ H │ I │
├───┼───┼───┤             Wider, fewer rows
│ J │ K │ L │
└───┴───┴───┘

Narrower, more rows
```

---

## 🎪 Confetti Pattern

### Single Match

```
          🎉
       🎊    🎉
    🎉    🎊    🎉
  🎊    🎉    🎊    🎉
     🎉    🎊    🎉
        🎊    🎉
           🎉

Origin: y: 0.6 (60% down screen)
Spread: 60° cone
Particles: 50
Colors: 4 (purple, magenta, pink, blue)
```

### Game Completion

```
🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊
  🎊 🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊
🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊
  🎊 🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊
🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊
  🎊 🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊

Origin: Random x, Random y (0-20%)
Spread: 360° (full circle)
Particles: 50 (decreasing over time)
Duration: 3 seconds
Interval: 250ms
```

---

## 📊 Stats Display

```
┌─────────────────────────────────────────────┐
│ ✓ Matches: 3/6  │  ✗ Attempts: 8  │ Reset  │
└─────────────────────────────────────────────┘

✓ Green check icon - matches
✗ Orange X icon - attempts
🔄 Reset button - restart game
```

---

## 🎬 Complete Game Timeline

```
Time    Event                      Visual
────────────────────────────────────────────
0:00    Game starts               All cards hidden (?)
0:01    Click Card 1              Card flips (0.6s)
0:02    Click Card 2              Card flips (0.6s)
0:03    No match                  Cards flip back (1s delay)
0:04    Click Card 3              Card flips
0:05    Click Card 4              Card flips
0:06    MATCH! 🎉                 Green + Sound + Confetti
0:07    Cards fade out            Scale 0, opacity 0
0:08    Click Card 5              Card flips
0:09    Click Card 6              Card flips
0:10    MATCH! 🎉                 Green + Sound + Confetti
...
0:30    Last pair matched         BIG CELEBRATION
0:30    3s confetti show          Continuous bursts
0:33    Game complete             Final stats shown
```

---

## 💡 Visual Feedback Summary

| Event | Visual | Audio | Duration |
|-------|--------|-------|----------|
| Card click | Flip animation | None | 0.6s |
| Match found | Green highlight | Beep | 0.5s |
| Match found | Confetti burst | None | 2s |
| Match complete | Fade out | None | 0.3s |
| No match | Flip back | None | 1.0s |
| Game complete | Mega confetti | None | 3.0s |

---

**This visual guide helps understand the Memory Game without running it!**

For testing, visit: `http://localhost:3000/test-memory`
