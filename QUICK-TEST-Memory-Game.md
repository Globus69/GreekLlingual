# 🎮 Quick Test Guide - Mobile Memory Game

**Feature:** Mobile Memory Game
**Route:** `/m/practice-modes/memory`
**Date:** 17. Februar 2026, 23:00 CET
**Status:** ✅ Ready for Testing

---

## 🚀 HOW TO TEST

### 1. Start Dev Server
```bash
bun run dev
```

### 2. Open Mobile Route
```
http://localhost:3000/m/practice-modes/memory
```

**OR:**

1. Go to: `http://localhost:3000/m/practice-modes`
2. Click on any Practice Item card
3. Select "Memory Game" from Bottom Sheet

---

## ✅ TESTING CHECKLIST

### A. Layout & Design
- [ ] **Header:**
  - [ ] Back button (←) visible (top-left)
  - [ ] Title "🎮 Memory Game" centered
  - [ ] Language toggle (🇬🇷 / 🇺🇸) visible (top-right)
  - [ ] Glassmorphism blur effect works

- [ ] **Stats Bar:**
  - [ ] Matches counter: "0 / 8"
  - [ ] Mistakes counter: "0" (red)
  - [ ] Timer: "0:00" (MM:SS format)

- [ ] **Game Grid:**
  - [ ] 4×4 Grid (16 cards total)
  - [ ] Cards size: ~70×90px (fits screen)
  - [ ] Gap: 8px between cards
  - [ ] No horizontal scrollbar

- [ ] **Bottom Navigation:**
  - [ ] Fixed at bottom
  - [ ] 3 tabs: Home, Stats, Settings
  - [ ] Glassmorphism blur effect works

### B. Functionality

#### Card Interactions
- [ ] **Tap first card:**
  - [ ] Card flips (shows content)
  - [ ] Background changes (blue → light)
  - [ ] Touch feedback (scale 0.95 on tap)

- [ ] **Tap second card:**
  - [ ] Card flips
  - [ ] Match Detection:
    - **If Match:**
      - [ ] Both cards stay flipped
      - [ ] Green border appears
      - [ ] Matches counter increases
      - [ ] Cards fade slightly (opacity 0.7)
    - **If No Match:**
      - [ ] Cards flip back after 300ms
      - [ ] Mistakes counter increases

- [ ] **Language Toggle:**
  - [ ] Click toggle (🇬🇷 → 🇺🇸)
  - [ ] Cards show correct language:
    - 🇬🇷 = Greek text visible
    - 🇺🇸 = English text visible

- [ ] **Timer:**
  - [ ] Starts at 0:00
  - [ ] Counts up every second
  - [ ] Format: M:SS (e.g., 1:23)

#### Game Complete
- [ ] **After all 8 pairs matched:**
  - [ ] Game Complete Screen appears
  - [ ] Emoji: 🎉 (64px)
  - [ ] Title: "Game Complete!"
  - [ ] Stats Cards:
    - [ ] Time: Shows elapsed time
    - [ ] Mistakes: Shows mistake count (color: green if 0, red if > 0)
  - [ ] Buttons:
    - [ ] "Play Again" → Restarts game
    - [ ] "Close" → Returns to Practice Modes

### C. Edge Cases

- [ ] **Rapid Taps:**
  - [ ] Cannot flip > 2 cards at once
  - [ ] Ignores taps while checking match

- [ ] **Back Button:**
  - [ ] Returns to `/m/practice-modes`
  - [ ] No errors in console

- [ ] **No Items:**
  - [ ] Shows "No Items Available" message
  - [ ] No crash

- [ ] **Refresh:**
  - [ ] Game restarts
  - [ ] New shuffle

### D. Mobile-Specific

- [ ] **Touch Targets:**
  - [ ] All buttons >= 44×44px
  - [ ] Cards >= 70×90px
  - [ ] Easy to tap on iPhone/Android

- [ ] **Performance:**
  - [ ] No lag when flipping cards
  - [ ] Smooth animations (300ms)
  - [ ] No layout shifts

- [ ] **Responsive:**
  - [ ] iPhone SE (375px): Grid fits, no scroll
  - [ ] iPhone 14 (390px): Grid fits
  - [ ] Android (360px+): Grid fits

---

## 🐛 KNOWN ISSUES (Expected)

### Issue 1: No Flip Animation
**Expected:** Cards flip instantly (opacity change)
**Reason:** 3D flip animation not yet implemented (Agent 3)
**Impact:** Less polished UX, but functional

### Issue 2: No Shake Animation
**Expected:** No visual feedback for wrong matches
**Reason:** Shake animation not yet implemented (Agent 3)
**Impact:** Harder to see mistakes

### Issue 3: Limited Items
**Expected:** Only first 8 items from database
**Reason:** Hardcoded limit in RPC call
**Impact:** Limited variety

---

## 📸 SCREENSHOTS (Manual Testing)

### Test on These Devices:
1. **iPhone SE (375px):** Smallest common iPhone
2. **iPhone 14 (390px):** Standard iPhone
3. **Android Pixel (412px):** Standard Android
4. **iPad Mini (768px):** Tablet (should still work)

### Screenshots to Take:
- [ ] Initial game screen (all cards face-down)
- [ ] 2 cards flipped (no match)
- [ ] 2 cards matched (green border)
- [ ] Game complete screen
- [ ] Stats bar with mistakes > 0

---

## ✅ ACCEPTANCE CRITERIA

**Pass if:**
- ✅ Grid displays 16 cards (4×4)
- ✅ Cards flip on tap
- ✅ Match detection works
- ✅ Mistakes counter increases on wrong match
- ✅ Timer runs (MM:SS)
- ✅ Game complete screen shows stats
- ✅ Restart works
- ✅ Bottom Nav works
- ✅ No console errors
- ✅ Touch targets >= 44px

**Fail if:**
- ❌ Grid doesn't display
- ❌ Cards don't flip
- ❌ Match detection broken
- ❌ Console errors on load
- ❌ Horizontal scrollbar appears
- ❌ Bottom Nav missing
- ❌ Touch targets < 44px

---

## 🔄 NEXT STEPS (After Testing)

**If tests pass:**
1. Agent 3: Add flip animation (CSS 3D transform)
2. Agent 3: Add shake animation (keyframes)
3. Agent 3: Write E2E tests (Playwright)
4. Agent 3: Lighthouse mobile audit

**If bugs found:**
1. Document in `BUG-REPORT-MOBILE.md`
2. Fix critical bugs immediately
3. Schedule medium/low bugs for later

---

**Tester:** [Your Name]
**Date:** _______
**Result:** [ ] PASS / [ ] FAIL

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

**END OF QUICK TEST GUIDE**
