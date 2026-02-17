# 🧪 TESTING GUIDE: Vocabulary Mobile UI

**Feature:** Vocabulary Mobile Card Learning Interface
**Route:** `/m/vocabulary`
**Agent:** Agent 2
**Date:** 17. Februar 2026
**Status:** Implementation Complete, Testing Required

---

## 📋 TESTING CHECKLIST

### **Critical Tests (Must Pass)**
- [ ] Auth redirect works
- [ ] Cards load via FSRS-6 RPC
- [ ] Card flip shows Greek word
- [ ] All 4 rating buttons work (1-4)
- [ ] FSRS database updates correctly
- [ ] Session stats track correctly
- [ ] Mobile viewport fits (375x812)
- [ ] Touch targets >= 70px
- [ ] TTS audio plays
- [ ] Bottom navigation works

### **Database Verification**
After rating a card, check Supabase:
```sql
-- Verify review log created
SELECT * FROM fsrs_review_logs
WHERE student_id = '<user_id>'
ORDER BY timestamp DESC LIMIT 1;

-- Verify card updated
SELECT fsrs_due, fsrs_stability, fsrs_reps
FROM learning_items WHERE id = '<card_id>';
```

### **Expected Console Logs**
- `✅ Loaded X due vocabulary cards (FSRS)`
- `✅ Card updated: Rating X, Next review in Y days`

### **Performance Targets**
- [ ] Page load < 2s
- [ ] Card flip animation smooth (60fps)
- [ ] No lag on rating button click
- [ ] TTS audio plays within 500ms

---

## 🐛 KNOWN ISSUES

*None reported yet. Add issues here after testing.*

---

## ✅ COMPLETION CRITERIA

**Production-Ready when:**
- All critical tests pass
- No console errors
- FSRS updates verified in database
- Mobile responsiveness confirmed
- Touch gestures work on real device

---

**Status:** 📝 Ready for Testing
**Next:** Run on local dev server
**Agent:** Agent 2
