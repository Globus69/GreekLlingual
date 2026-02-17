# Practice Modes - Testing Session

**Date:** 17. Februar 2026, 18:00 CET
**Tester:** Master + User
**Task:** #6 - Practice Modes User Flow Testing
**Estimated Time:** 2-3 hours

---

## 🎯 TESTING GOALS

**Primary Goals:**
1. ✅ Verify end-to-end user flow works
2. ✅ Test all 3 game modes (Matching, Multiple Choice, Write Input)
3. ✅ Validate FSRS integration (ratings saved correctly)
4. ✅ Confirm database entries are created
5. ✅ Check unlock logic works (threshold-based)

**Secondary Goals:**
- UI/UX polish verification
- i18n translation check
- Performance check
- Error handling

---

## 🚀 PRE-TESTING SETUP

### **1. Start Development Server:**

```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard
npm run dev
```

**Expected:** Server runs on `http://localhost:3000`

### **2. Open Browser:**

- Chrome/Firefox (with DevTools open)
- Clear cache if needed
- Check Console for errors

### **3. Login:**

- Navigate to `http://localhost:3000/login`
- Login with your test user
- Verify you reach Dashboard

---

## 📋 TESTING CHECKLIST

### **TEST 1: Navigation & Page Load** ⏱️ 5 Min

#### **1.1 Dashboard Navigation:**

- [ ] Dashboard loads without errors
- [ ] Find "Button 13: 🎮 Practice Modes"
- [ ] Click button
- [ ] **Expected:** Redirects to `/practice-modes`
- [ ] **Verify:** URL = `http://localhost:3000/practice-modes`

#### **1.2 Practice Modes Page:**

- [ ] Page loads with gradient background
- [ ] Header visible: "🎮 Practice Modes"
- [ ] "Back to Dashboard" link visible and working
- [ ] User info displayed (name, level)
- [ ] Info card explaining practice modes visible
- [ ] PracticeModesSection component visible below

**Console Check:**
- [ ] No errors in console
- [ ] No net::ERR_FAILED
- [ ] No 401/403 errors

**Screenshot:** Take screenshot of Practice Modes page

---

### **TEST 2: Practice Items Display** ⏱️ 5 Min

#### **2.1 Items List:**

- [ ] Practice items displayed (should see 5+ items)
- [ ] Each item shows:
  - [ ] Greek text
  - [ ] English translation
  - [ ] Level badge
  - [ ] Available mode buttons (Matching, Multiple Choice, Write Input)
  - [ ] Lock/Unlock icons on buttons

#### **2.2 Unlock Status:**

- [ ] Find item with threshold=0 (e.g., "Hello" or "Water")
- [ ] **Verify:** All 3 mode buttons are UNLOCKED (no lock icon)
- [ ] Find item with threshold>0
- [ ] **Verify:** Buttons show lock icon if user_reps < threshold

**Console Check:**
- [ ] Check network tab: `/rest/v1/rpc/get_practice_config` call succeeds
- [ ] Response includes `unlocked: true/false` per mode

**Screenshot:** Take screenshot showing locked and unlocked buttons

---

### **TEST 3: Matching Game** ⏱️ 15 Min

#### **3.1 Game Start:**

- [ ] Click "Matching" button on unlocked item (e.g., "Hello")
- [ ] **Expected:** Dialog opens
- [ ] Dialog shows:
  - [ ] Title: "Matching Game"
  - [ ] Instructions
  - [ ] Timer (starts counting)
  - [ ] 12 cards total (6 pairs: 6 Greek + 6 English)
  - [ ] Cards are shuffled randomly
  - [ ] Score display (Matches: 0/6, Mistakes: 0)

**Screenshot:** Dialog opened, cards visible

#### **3.2 Gameplay:**

- [ ] Click first card → **Verify:** Card flips, text visible
- [ ] Click second card (not matching) → **Verify:**
  - [ ] Card flips
  - [ ] Short delay (~1s)
  - [ ] Both cards flip back
  - [ ] Mistakes count increases

- [ ] Click two matching cards → **Verify:**
  - [ ] Both cards flip
  - [ ] Cards stay flipped / become disabled
  - [ ] Match animation plays (optional)
  - [ ] Matches count increases (1/6 → 2/6)
  - [ ] Score updates

- [ ] Continue matching all pairs
- [ ] **Verify:** Game doesn't freeze
- [ ] **Verify:** Timer counts correctly (MM:SS format)

**Console Check:**
- [ ] No errors during gameplay
- [ ] No infinite loops
- [ ] No memory leaks (check Memory tab)

**Screenshot:** Game in progress (some cards matched)

#### **3.3 Game Completion:**

- [ ] Match all 6 pairs
- [ ] **Expected:** Result Summary appears:
  - [ ] "Game Complete!" message
  - [ ] Final score (0-100, based on time + mistakes)
  - [ ] Time taken (MM:SS)
  - [ ] Number of mistakes
  - [ ] FSRS Rating options (4 buttons):
    - [ ] 🔴 Again (1)
    - [ ] 🟡 Hard (2)
    - [ ] 🔵 Good (3)
    - [ ] 🟢 Easy (4)
  - [ ] "Try Again" button
  - [ ] "Close" button

**Screenshot:** Result summary screen

#### **3.4 FSRS Rating:**

- [ ] Click "Good" button (Rating: 3)
- [ ] **Expected:**
  - [ ] Loading indicator (brief)
  - [ ] Success message or dialog closes
  - [ ] Data saved to database

**Console Check:**
- [ ] Network tab: POST to `/rest/v1/rpc/record_practice_attempt`
- [ ] Request body includes:
  ```json
  {
    "p_item_id": "...",
    "p_mode_type": "matching",
    "p_score": 85,
    "p_time_taken": 45,
    "p_fsrs_rating": 3
  }
  ```
- [ ] Response: success

#### **3.5 Database Verification:**

- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Run query:
  ```sql
  SELECT * FROM practice_attempts
  WHERE mode_type = 'matching'
  ORDER BY created_at DESC
  LIMIT 1;
  ```
- [ ] **Verify:**
  - [ ] New row exists
  - [ ] user_id matches your user
  - [ ] item_id matches the item you practiced
  - [ ] mode_type = 'matching'
  - [ ] score is between 0-100
  - [ ] time_taken matches game time (±1 second)
  - [ ] fsrs_rating = 3 (what you clicked)
  - [ ] created_at is recent

**Screenshot:** Database query result

#### **3.6 Try Again:**

- [ ] Click "Try Again" button in result summary
- [ ] **Expected:**
  - [ ] Game resets
  - [ ] New shuffled cards
  - [ ] Timer resets to 00:00
  - [ ] Score resets to 0/6, Mistakes: 0
- [ ] **Verify:** Can play again successfully

---

### **TEST 4: Multiple Choice Game** ⏱️ 15 Min

#### **4.1 Game Start:**

- [ ] Close previous dialog (if open)
- [ ] Click "Multiple Choice" button on same or different item
- [ ] **Expected:** Dialog opens with:
  - [ ] Title: "Multiple Choice Quiz"
  - [ ] Instructions
  - [ ] Question counter (1/5)
  - [ ] Timer
  - [ ] Question text (Greek or English)
  - [ ] 4 answer options (A, B, C, D)
  - [ ] "Submit" button

**Screenshot:** Multiple Choice quiz started

#### **4.2 Gameplay:**

- [ ] Read question
- [ ] Select an answer (correct or wrong)
- [ ] Click "Submit"
- [ ] **Expected:**
  - [ ] Feedback shown (✅ Correct / ❌ Incorrect)
  - [ ] Correct answer highlighted if wrong
  - [ ] Score updated
  - [ ] After delay (~2s), next question loads

- [ ] Answer all 5 questions
- [ ] **Verify:**
  - [ ] Question counter increases (1/5 → 5/5)
  - [ ] Timer counts continuously
  - [ ] Can't submit without selecting an option
  - [ ] No errors in console

**Console Check:**
- [ ] No errors during quiz
- [ ] State updates correctly

**Screenshot:** Question 3/5 with feedback visible

#### **4.3 Game Completion:**

- [ ] Finish all 5 questions
- [ ] **Expected:** Result Summary with:
  - [ ] Score (0-100, based on correct answers + time)
  - [ ] Correct answers count (X/5)
  - [ ] Time taken
  - [ ] FSRS Rating buttons
  - [ ] "Try Again" / "Close"

#### **4.4 FSRS Rating & Database:**

- [ ] Select rating (e.g., "Easy" = 4)
- [ ] **Verify:** Network request to `record_practice_attempt`
- [ ] **Verify:** Database query shows new row with `mode_type = 'multiple_choice'`

**Screenshot:** Result summary + database verification

---

### **TEST 5: Write Input Game** ⏱️ 15 Min

#### **5.1 Game Start:**

- [ ] Click "Write Input" button
- [ ] **Expected:** Dialog opens with:
  - [ ] Title: "Write Input Practice"
  - [ ] Instructions
  - [ ] Question counter (1/5)
  - [ ] Timer
  - [ ] Question text (e.g., "Translate to Greek: Hello")
  - [ ] Text input field
  - [ ] "Submit" button
  - [ ] Attempts remaining (e.g., "2/3 attempts")

**Screenshot:** Write Input game started

#### **5.2 Gameplay:**

**Test Case 1: Correct Answer**
- [ ] Type correct answer (e.g., "Γεια σου")
- [ ] Click Submit
- [ ] **Expected:**
  - [ ] ✅ Feedback: "Correct!"
  - [ ] Score increases
  - [ ] Next question loads after delay

**Test Case 2: Wrong Answer**
- [ ] Type wrong answer
- [ ] Click Submit
- [ ] **Expected:**
  - [ ] ❌ Feedback: "Incorrect, try again"
  - [ ] Attempts decrease (2/3 → 1/3)
  - [ ] Input field clears or shows error
  - [ ] Can try again

**Test Case 3: Fuzzy Matching (Tolerance)**
- [ ] Type answer with minor typo (e.g., "Γεια σο" instead of "Γεια σου")
- [ ] **Verify:**
  - [ ] If within tolerance (0.8): Accepted as correct ✅
  - [ ] If outside tolerance: Marked as wrong ❌

**Test Case 4: Out of Attempts**
- [ ] Fail 3 times on one question
- [ ] **Expected:**
  - [ ] Shows correct answer
  - [ ] Moves to next question
  - [ ] Score doesn't increase

**Screenshot:** Feedback screen (correct/incorrect)

#### **5.3 Greek Input Testing:**

- [ ] Type Greek characters (Γεια σου, Καλημέρα, etc.)
- [ ] **Verify:** Input field accepts Greek characters
- [ ] **Verify:** Diacritics are handled correctly
- [ ] **Verify:** Normalization works (Γεια = γεια)

#### **5.4 Game Completion & Database:**

- [ ] Complete all questions
- [ ] Select FSRS rating
- [ ] **Verify:** Database entry with `mode_type = 'write_input'`

**Screenshot:** Final result + database

---

### **TEST 6: Unlock Logic (Threshold)** ⏱️ 10 Min

#### **6.1 Find Locked Item:**

- [ ] Find item with `activation_threshold > 0` (e.g., threshold=5)
- [ ] **Verify:** Buttons show 🔒 lock icon
- [ ] **Verify:** Clicking locked button shows:
  - [ ] Tooltip or message: "Unlock after X more reviews"
  - [ ] Button is disabled

**Screenshot:** Locked practice mode

#### **6.2 Check Database:**

- [ ] Query Supabase:
  ```sql
  SELECT item_id, practice_modes_config->>'activation_threshold' as threshold
  FROM learning_items
  WHERE practice_modes_config->>'enabled' = 'true';
  ```
- [ ] **Verify:** Thresholds are set correctly

#### **6.3 Simulate Unlock (Optional):**

- [ ] Manually update user_reps in database:
  ```sql
  -- Increase reps for testing
  UPDATE fsrs_review_logs
  SET ...
  -- (Or use FSRS learning flow)
  ```
- [ ] Refresh Practice Modes page
- [ ] **Verify:** Button becomes unlocked if reps >= threshold

---

### **TEST 7: UI/UX Polish** ⏱️ 10 Min

#### **7.1 Responsive Design:**

- [ ] Resize browser window (mobile, tablet, desktop)
- [ ] **Verify:** Layout adapts correctly
- [ ] **Verify:** Cards/buttons remain usable
- [ ] **Verify:** No overflow or broken layouts

#### **7.2 Animations:**

- [ ] Card flip animation smooth (Matching)
- [ ] Shake animation on wrong match (Matching)
- [ ] Fade in/out on question transitions (Multiple Choice, Write Input)
- [ ] No laggy or janky animations

#### **7.3 Loading States:**

- [ ] Check loading indicators when fetching data
- [ ] Check loading after submitting rating
- [ ] **Verify:** No infinite spinners
- [ ] **Verify:** User knows something is happening

#### **7.4 Error Handling:**

- [ ] Disconnect internet → Try to play
- [ ] **Expected:** Error message shown, not a crash
- [ ] Reconnect → Should recover gracefully

**Screenshot:** Error state (if testable)

---

### **TEST 8: i18n (Internationalization)** ⏱️ 10 Min

#### **8.1 Language Switching:**

- [ ] Change app language (if language selector exists)
- [ ] Options: EN, DE, ES
- [ ] **Verify:** Practice Modes UI updates:
  - [ ] Dialog titles
  - [ ] Instructions
  - [ ] Button labels
  - [ ] Feedback messages

#### **8.2 Translation Check:**

- [ ] Review translations in each language
- [ ] **Verify:** No "undefined" or missing keys
- [ ] **Verify:** Translations make sense (not just literal)
- [ ] **Verify:** Greek/English text is always correct (not translated)

**Screenshot:** Practice Modes in German or Spanish

---

### **TEST 9: Performance** ⏱️ 5 Min

#### **9.1 Load Time:**

- [ ] Clear cache
- [ ] Navigate to `/practice-modes`
- [ ] **Verify:** Page loads in <2 seconds
- [ ] **Verify:** No long white screens

#### **9.2 Game Performance:**

- [ ] Play game for 5 minutes continuously
- [ ] **Verify:** No slowdowns
- [ ] **Verify:** Timer accurate
- [ ] **Verify:** Memory usage stable (DevTools Memory tab)

#### **9.3 Network Requests:**

- [ ] Open Network tab
- [ ] Play one complete game
- [ ] **Count API calls:**
  - [ ] get_practice_config: 1-2 calls
  - [ ] record_practice_attempt: 1 call
- [ ] **Verify:** No excessive API calls
- [ ] **Verify:** No failed requests (red rows)

---

## 📝 TESTING REPORT TEMPLATE

### **Summary:**

- **Date:** [DATE]
- **Tester:** [NAME]
- **Duration:** [TIME]
- **Environment:** Chrome/Firefox, macOS/Windows, localhost:3000

### **Test Results:**

| Test | Status | Notes |
|------|--------|-------|
| Navigation & Page Load | ✅/❌ | [Notes] |
| Practice Items Display | ✅/❌ | [Notes] |
| Matching Game | ✅/❌ | [Notes] |
| Multiple Choice Game | ✅/❌ | [Notes] |
| Write Input Game | ✅/❌ | [Notes] |
| Unlock Logic | ✅/❌ | [Notes] |
| UI/UX Polish | ✅/❌ | [Notes] |
| i18n | ✅/❌ | [Notes] |
| Performance | ✅/❌ | [Notes] |

### **Bugs Found:**

1. **[BUG-001]** [Title]
   - **Severity:** Critical / High / Medium / Low
   - **Steps to Reproduce:**
   - **Expected:**
   - **Actual:**
   - **Screenshot:**

2. **[BUG-002]** ...

### **Improvements Suggested:**

1. [Improvement 1]
2. [Improvement 2]

### **Overall Assessment:**

- **Production Ready:** Yes / No / With Fixes
- **Confidence Level:** High / Medium / Low
- **Recommendation:** [Deploy / Fix Critical Bugs First / Needs More Work]

---

## 🚀 NEXT STEPS AFTER TESTING

### **If All Tests Pass (✅):**

1. ✅ Mark Task #6 as complete
2. ✅ Move to Task #7 (Admin UI Testing)
3. ✅ Update CURRENT-WORK.md
4. ✅ Prepare for production deployment

### **If Bugs Found (❌):**

1. 📝 Document all bugs in testing report
2. 🔧 Create bug-fix tasks in TaskCreate
3. 🏷️ Prioritize by severity
4. 🛠️ Fix critical/high severity bugs first
5. 🔄 Re-test after fixes

---

## 📞 SUPPORT

**If you encounter issues during testing:**

1. Check `TROUBLESHOOTING-Practice-Modes.md`
2. Check browser console for errors
3. Check Supabase logs
4. Ask Master (me!) for help

**I will:**
- Help debug issues
- Fix bugs immediately
- Create follow-up tasks
- Keep testing on track

---

**Ready to start?** Let me know when you begin! 🚀

**Estimated Time:** 2-3 hours for complete testing
**Break recommended:** After TEST 5 (take 10 min break)

---

**End of Testing Session Guide** ✅
