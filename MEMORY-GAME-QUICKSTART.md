# Memory Game - Quick Start Guide

**For:** Testing & Development
**Date:** 17. Februar 2026

---

## 🚀 START THE GAME

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Navigate to Memory Game
```
1. Open browser: http://localhost:3000
2. Login with your PIN
3. Navigate to: /practice-modes
4. Click: "Memory Game" card
5. Or directly: http://localhost:3000/practice-modes/memory
```

---

## 🎮 HOW TO PLAY

### Basic Gameplay
1. **Click any card** → Card flips to reveal Greek word or translation
2. **Click another card** → Second card flips
3. **Match?**
   - ✅ YES → Both cards turn GREEN and stay flipped
   - ❌ NO → Both cards flip back after 1 second
4. **Repeat** until all 8 pairs are matched

### Language Toggle
- Click **"🇬🇷 Greek First"** button (top right)
- Toggles between:
  - **Greek First:** Match Greek words with translations
  - **Translation First:** Match translations with Greek words
- Game resets when toggling

### Reset Game
- Click **🔄 Reset Button** (top right)
- All cards shuffle and reset

---

## 📊 STATS TRACKING

### Live Stats (Top Bar)
- **⏱️ Time:** Game duration (MM:SS)
- **🎯 Pairs:** Matched pairs / Total pairs (e.g., 5/8)
- **🏆 Attempts:** Number of 2-card flips

### Completion Modal
When all pairs matched:
- **Time:** Total time taken
- **Attempts:** Total attempts
- **Accuracy:** Percentage (pairs / attempts × 100)
- **Buttons:**
  - **Play Again:** Reset and start new game
  - **Back:** Return to Practice Modes

---

## 🔧 TESTING SCENARIOS

### Scenario 1: Happy Path
```
1. Load page → 16 cards appear
2. Click 2 cards → Match
3. Repeat 8 times
4. Completion modal appears
5. Click "Play Again"
```

### Scenario 2: No Match
```
1. Click 2 cards that don't match
2. Wait 1 second
3. Both cards flip back
4. Stats: Attempts +1
```

### Scenario 3: Language Toggle
```
1. Start game
2. Match 2 pairs
3. Click language toggle
4. Game resets (stats = 0, cards shuffle)
```

### Scenario 4: Error Handling
```
1. Disable all practice_enabled items in Supabase
2. Reload page
3. Error message appears
4. Click "Try Again" → retries loading
```

---

## 🐛 DEBUGGING

### Check Browser Console
```javascript
// Should NOT see these errors:
❌ "Cannot read property 'id' of undefined"
❌ "learning_items is not defined"
❌ "Uncaught TypeError"

// Should see (on page load):
✅ "Compiled /practice-modes/memory"
```

### Check Network Tab
```
1. Open DevTools → Network
2. Filter: "learning_items"
3. Should see: GET request to Supabase
4. Status: 200 OK
5. Response: Array of 8 items
```

### Check Supabase Data
```sql
-- Verify practice-enabled items exist
SELECT COUNT(*)
FROM learning_items
WHERE module = 'vocabulary'
AND practice_enabled = true;

-- Should return: >= 8
```

---

## 📱 RESPONSIVE TESTING

### Desktop (>= 1024px)
- Grid: 4×4, max-width 800px
- Cards: ~120×150px
- Hover: scale(1.05)

### Tablet (768px - 1023px)
- Grid: 4×4, slightly smaller
- Cards: responsive width
- Touch-friendly (no hover)

### Mobile (< 768px)
- **NOT IMPLEMENTED YET**
- Will be Agent 2's task: `/m/practice-modes/memory`

---

## 🎨 VISUAL CHECKLIST

### Card States
- [ ] **Hidden:** Purple gradient + 🇬🇷 icon
- [ ] **Flipped:** White background + text
- [ ] **Matched:** Green gradient + ✓ checkmark
- [ ] **Animation:** Smooth 3D flip (500ms)

### Header
- [ ] **Back Button:** ← Practice Modes
- [ ] **Title:** 🧠 Memory Game
- [ ] **Toggle:** 🇬🇷 Greek First / 🌍 Translation First
- [ ] **Reset:** 🔄 button

### Stats Bar
- [ ] **Timer:** Updates every second
- [ ] **Pairs:** Updates on match
- [ ] **Attempts:** Updates on 2nd card click

---

## ⚡ PERFORMANCE CHECKS

### Load Time
- [ ] Initial render: < 1s
- [ ] Card flip animation: Smooth (60fps)
- [ ] No layout shift on load

### Memory Leaks
- [ ] Timer cleanup on unmount
- [ ] No infinite loops
- [ ] No memory warnings in console

---

## 🔗 USEFUL COMMANDS

### Development
```bash
# Start dev server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Build production
npm run build
```

### Supabase Queries (Debugging)
```sql
-- Count practice items
SELECT COUNT(*) FROM learning_items
WHERE module = 'vocabulary' AND practice_enabled = true;

-- View items
SELECT id, english, greek, level
FROM learning_items
WHERE module = 'vocabulary' AND practice_enabled = true
LIMIT 10;

-- Enable items
UPDATE learning_items
SET practice_enabled = true
WHERE module = 'vocabulary' AND level = 'A1';
```

---

## 📋 ACCEPTANCE CRITERIA

Before marking as "Done":

### Functionality
- [ ] Page loads without errors
- [ ] 16 cards appear in 4×4 grid
- [ ] Cards flip on click (3D animation)
- [ ] Match detection works (same pairId)
- [ ] No-match cards flip back after 1s
- [ ] Matched cards stay flipped
- [ ] Stats track correctly

### UI/UX
- [ ] Language toggle works
- [ ] Reset button works
- [ ] Completion modal appears
- [ ] Navigation works (back button)
- [ ] Responsive on Desktop + Tablet

### Edge Cases
- [ ] Error handling (no items)
- [ ] Click same card twice (ignored)
- [ ] Click 3rd card while checking (ignored)
- [ ] Timer stops on game completion

---

## 🆘 TROUBLESHOOTING

### Issue: "No practice items available"
**Solution:**
```sql
-- Enable some items
UPDATE learning_items
SET practice_enabled = true
WHERE module = 'vocabulary'
LIMIT 10;
```

### Issue: Cards don't flip
**Causes:**
1. CSS not loaded → Check globals.css imports
2. State not updating → Check React DevTools

**Fix:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: TypeScript errors
**Solution:**
- Pre-existing error in `practice-config-form.tsx`
- Does NOT affect Memory Game
- Ignore for now (Agent 2 will fix)

---

## 📞 SUPPORT

**Documentation:**
- [MEMORY-GAME-IMPLEMENTATION.md](./MEMORY-GAME-IMPLEMENTATION.md) - Full implementation details
- [PROJEKT-REFERENZEN.md](./PROJEKT-REFERENZEN.md) - Project references

**Code Locations:**
- Page: `/src/app/practice-modes/memory/page.tsx`
- Styles: `/src/app/globals.css` (lines 213-221)

---

**READY TO TEST!** 🚀

Follow the steps above to verify the Memory Game works as expected.
