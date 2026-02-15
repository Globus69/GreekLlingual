# 📚 Vocabulary Content

This directory contains vocabulary and phrase content for the GreekLingua learning platform.

## Files

### A1 Level (Beginner)
**File:** `a1-vocabulary.csv`
- **Words:** 75 essential vocabulary items
- **Topics:** Greetings, Food & Drink, Numbers, Colors, Family, Body Parts, Time
- **Difficulty:** Easy (90%), Medium (10%)

**Categories:**
- Greetings & Polite Expressions (10 words)
- Food & Drink (20 words)
- Numbers 1-10 (10 words)
- Colors (6 words)
- Family & People (11 words)
- Body Parts (7 words)
- Time Expressions (11 words)

### A2 Level (Elementary)
**File:** `a2-vocabulary.csv`
- **Words:** 75 vocabulary items
- **Topics:** Work, Education, Home, Transport, Places, Adjectives, Weather
- **Difficulty:** Easy (70%), Medium (30%)

**Categories:**
- Work & Education (14 words)
- Home & Furniture (11 words)
- Transport & Travel (9 words)
- Places & Geography (8 words)
- Weather (7 words)
- Adjectives & Descriptions (18 words)
- Money & Services (8 words)

## Import Instructions

### Option 1: Via Admin Interface (Recommended)

1. **Login as Admin**
   - Go to `/login` or `/login-pin`
   - Login with admin credentials

2. **Open Import Page**
   - Navigate to `/admin/import`

3. **Upload CSV**
   - Click "Choose File"
   - Select `a1-vocabulary.csv` or `a2-vocabulary.csv`
   - Click "Preview"

4. **Review Preview**
   - Check that all fields are correct
   - Verify phonetics and translations
   - Check for validation errors

5. **Import**
   - Click "Import to Database"
   - Wait for progress bar to complete
   - Review success/error report

6. **Repeat for A2**
   - Upload `a2-vocabulary.csv`
   - Follow same steps

### Option 2: Via SQL (Advanced)

If direct SQL import is needed, use the admin interface's export feature or manually create INSERT statements.

## CSV Format

```csv
type,english,greek,phonetic,example_en,example_gr,level,difficulty,audio_url
vocabulary,Hello,Γεια σου,YAH-soo,Hello friend,Γεια σου φίλε,A1,easy,
```

**Fields:**
- `type`: vocabulary | phrase | grammar
- `english`: English translation (required)
- `greek`: Greek word/phrase (required)
- `phonetic`: IPA-style pronunciation
- `example_en`: English example sentence
- `example_gr`: Greek example sentence
- `level`: A1, A2, B1, B2, C1, C2 (required)
- `difficulty`: easy, medium, hard (required)
- `audio_url`: URL to audio file (optional)

## Validation Rules

The import system validates:
- ✅ Required fields: english, greek, type, level, difficulty
- ✅ Valid types: vocabulary, phrase, grammar
- ✅ Valid levels: A1-C2
- ✅ Valid difficulties: easy, medium, hard
- ❌ Duplicate entries (same english+greek)

## FSRS-6 Integration

Upon import, each vocabulary item gets initialized with FSRS-6 fields:
- `fsrs_difficulty`: 5.0 (default)
- `fsrs_stability`: 10.0 (default)
- `fsrs_state`: 'new'
- `fsrs_reps`: 0
- `fsrs_lapses`: 0
- `fsrs_due`: current timestamp

These values will be updated as users learn the vocabulary through spaced repetition.

## Statistics

- **Total A1 Vocabulary:** 75 words
- **Total A2 Vocabulary:** 75 words
- **Combined Total:** 150 words
- **Coverage:** Essential Greek for basic communication (A1-A2 CEFR levels)

## Future Content

Planned additions:
- B1/B2 Vocabulary (intermediate)
- C1/C2 Vocabulary (advanced)
- Daily Phrases collection
- Grammar Rules collection
- Thematic vocabulary (Business, Travel, Medical, etc.)

## Contributing

To add new vocabulary:
1. Follow the CSV format above
2. Use accurate phonetic transcription
3. Provide clear example sentences
4. Categorize by CEFR level
5. Test via import preview first

## References

- **CEFR Levels:** [Common European Framework of Reference for Languages](https://www.coe.int/en/web/common-european-framework-reference-languages)
- **Greek Phonetics:** IPA-style simplified transcription
- **Content Source:** Curated from common Greek language learning materials

---

**Last Updated:** 2026-02-15
**Content Version:** 1.0
**Maintainer:** GreekLingua Team
