# 📊 Dialog Analyse - VocabModal (Master Template)

**Datum:** 18. Februar 2026, 03:15 CET
**Analysiert:** `/admin/vocab` Dialog (VocabModal.tsx)
**Ziel:** Master Template für `/admin/content` & `/admin/daily-phrases`

---

## 🎯 MASTER TEMPLATE: VocabModal.tsx

**Dateigröße:** 587 Zeilen
**Sprachen:** 4 (English, German, Spanish, Russian)
**Felder pro Sprache:** 3 (Translation, Importance Reason, Audio URL)

---

## 📋 DIALOG-STRUKTUR (Master Template)

### Section 1: Core Information

**Felder:**
1. **Nr** (optional)
   - Type: `number`
   - Optional
   - Placeholder: "Entry number"
   - Used for: Sortierung, CSV-Import

2. **Greek Transcription** (required)
   - Type: `text`
   - Required: ✅
   - Max Length: 200 characters
   - Character counter: "150 / 200"
   - Placeholder: "Γεια σου"
   - Duplicate warning: ⚠️ "Similar entry already exists for this level"
   - Validation: Real-time duplicate check

3. **Greek Phonetic** (optional)
   - Type: `text`
   - Optional
   - Placeholder: "ya su"
   - Used for: Aussprache-Hilfe

4. **Level** (required)
   - Type: `select`
   - Required: ✅
   - Options: A1, A2, B1, B2, C1, C2
   - Default: A1

5. **Difficulty** (required)
   - Type: `select`
   - Required: ✅
   - Options: Easy, Medium, Hard
   - Default: Easy

6. **Frequency (1-5)** (required)
   - Type: `number`
   - Required: ✅
   - Range: 1-5
   - Default: 3
   - Visual feedback: "★★★☆☆" (star rating)

---

### Section 2: Translations (Collapsible Accordion)

**4 Language Sections** (identisch aufgebaut):

#### English Section (expandedSections: ['en'])
- Default: ✅ Expanded
- Checkmark: ✓ wenn ausgefüllt

**Felder:**
1. **Translation**
   - Type: `textarea`
   - Rows: 2
   - Placeholder: "English translation"

2. **Importance Reason**
   - Type: `textarea`
   - Rows: 2
   - Placeholder: "Why is this word important?"

3. **Audio URL 🔗**
   - Type: `url`
   - Placeholder: "https://..."
   - Validation: URL format

#### German Section (langCode: 'de')
- Default: Collapsed
- Identische Struktur wie English

#### Spanish Section (langCode: 'es')
- Default: Collapsed
- Identische Struktur wie English

#### Russian Section (langCode: 'ru')
- Default: Collapsed
- Identische Struktur wie English

---

## 🎨 UI/UX FEATURES

### 1. Collapsible Accordion
```typescript
const [expandedSections, setExpandedSections] = useState<string[]>(['en']);
```

- ▶ Icon: Collapsed
- ▼ Icon: Expanded
- Toggle: Click header
- Visual indicator: ✓ wenn Feld ausgefüllt

### 2. Real-Time Validation
- Duplicate check: On greek_transcription + level change
- Warning banner: "⚠️ Similar entry already exists for this level"
- Character counter: "150 / 200"
- Frequency stars: "★★★☆☆"

### 3. Toast Notifications (Sonner)
```typescript
toast.error('Validation failed')
toast.success('Entry saved')
```

### 4. Save State
```typescript
const [saving, setSaving] = useState(false);
disabled={saving}
{saving ? 'Saving...' : 'Save Entry'}
```

---

## 🔧 TECHNISCHE DETAILS

### Form State Management
```typescript
interface CreateVocabPayload {
    nr?: number;
    greek_transcription: string;
    greek_phonetic?: string;

    en_translation?: string;
    en_importance_reason?: string;
    en_audio_url?: string;

    de_translation?: string;
    de_importance_reason?: string;
    de_audio_url?: string;

    es_translation?: string;
    es_importance_reason?: string;
    es_audio_url?: string;

    ru_translation?: string;
    ru_importance_reason?: string;
    ru_audio_url?: string;

    level: VocabLevel;
    difficulty: VocabDifficulty;
    frequency: VocabFrequency;
}
```

### Validation
```typescript
import { validateVocabEntry } from '@/types/vocabulary';

const validation = validateVocabEntry(formData);
if (!validation.valid) {
    toast.error(validation.errors[0]);
    return;
}
```

### API Calls
```typescript
import { createVocabEntry, updateVocabEntry, checkDuplicate } from '@/lib/api/vocab';

// Create mode
await createVocabEntry(formData);

// Edit mode
await updateVocabEntry(entry.id, formData);

// Duplicate check
const isDuplicate = await checkDuplicate(
    formData.greek_transcription,
    formData.level,
    entry?.id
);
```

---

## 🎨 STYLING SYSTEM

### Color Palette
- Background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
- Text: `#fff` (white)
- Labels: `#D1D1D6` (light gray)
- Optional: `#8E8E93` (medium gray)
- Required: `#FF3B30` (red)
- Warning: `#FFD60A` (yellow)
- Primary button: `rgba(0, 122, 255, 0.15)` + `#007AFF` text

### Border & Radius
- Modal radius: `20px`
- Input radius: `10px`
- Button radius: `12px`
- Border: `1px solid rgba(255,255,255,0.1)`

### Spacing
- Modal padding: `24px`
- Section gap: `24px`
- Field gap: `16px`
- Input padding: `12px`

---

## 📊 VERGLEICH: VocabModal vs ContentModal

| Feature | VocabModal (Master) | ContentModal (Alt) | Action |
|---------|---------------------|-------------------|--------|
| **Lines of Code** | 587 | 449 | Replace |
| **Languages** | 4 (EN, DE, ES, RU) | 0 (nur EN+GR) | ✅ Add 4 languages |
| **Fields per Lang** | 3 (Translation, Reason, Audio) | 1 (nur Translation) | ✅ Add 2 more fields |
| **Core Fields** | 6 (Nr, Greek, Phonetic, Level, Diff, Freq) | 5 (Type, Level, Diff, EN, GR) | ✅ Change structure |
| **Validation** | validateVocabEntry + duplicate check | Zod schema | ✅ Use vocab validation |
| **Notifications** | Sonner toasts | None | ✅ Add Sonner |
| **Accordion** | ✅ Collapsible sections | ❌ Flat layout | ✅ Add accordion |
| **Character Counter** | ✅ Yes | ❌ No | ✅ Add counter |
| **Frequency Stars** | ✅ Yes | ❌ No | ✅ Add stars |
| **Duplicate Warning** | ✅ Yes | ❌ No | ✅ Add warning |
| **Audio URL** | ✅ Per language | ✅ Single | ✅ Per language |
| **Form Library** | Plain React state | React Hook Form | ✅ Use plain state |

**Fazit:** ContentModal muss ~90% neu gebaut werden!

---

## 🗄️ DATENBANK-VERGLEICH

### VocabModal → `multilingual_vocabulary` table

**Spalten:**
```sql
id UUID PRIMARY KEY
nr INTEGER
greek_transcription VARCHAR(200) NOT NULL
greek_phonetic VARCHAR(200)

en_translation TEXT
en_importance_reason TEXT
en_audio_url VARCHAR(500)

de_translation TEXT
de_importance_reason TEXT
de_audio_url VARCHAR(500)

es_translation TEXT
es_importance_reason TEXT
es_audio_url VARCHAR(500)

ru_translation TEXT
ru_importance_reason TEXT
ru_audio_url VARCHAR(500)

level VARCHAR(2) NOT NULL
difficulty VARCHAR(20) NOT NULL
frequency INTEGER NOT NULL CHECK (frequency BETWEEN 1 AND 5)

created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Total:** 22 Spalten (ohne id, timestamps)

---

### ContentModal → `content` table (VERALTET!)

**Spalten:**
```sql
id UUID PRIMARY KEY
type VARCHAR(50)
level VARCHAR(2)
difficulty VARCHAR(20)
english TEXT
greek TEXT
phonetic VARCHAR(200)
audio_url VARCHAR(500)
example_en TEXT
example_gr TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Total:** 11 Spalten

---

### CSV_Vorlage.csv Mapping

**CSV → Datenbank:**
```
Nr                                    → nr
Griechisch (Transkription)            → greek_transcription
Lautschrift (Griechisch)              → greek_phonetic
Englische Übersetzung                 → en_translation
Wichtigkeit (Begründung)in Englisch   → en_importance_reason
Audio in Grichisch                    → en_audio_url (?)
Deutsche Übersetzung                  → de_translation
Wichtigkeit (Begründung)in Deutsch    → de_importance_reason
Spanische Übersetzung                 → es_translation
Wichtigkeit (Begründung)in Spanisch   → es_importance_reason
Russische Übersetzung                 → ru_translation
Wichtigkeit (Begründung) in Russisch  → ru_importance_reason
Level A                               → level
difficulty (easy/middle/hard)         → difficulty
Häufigkeit im täglichen Gebrauch      → frequency
```

⚠️ **Hinweis:** "Audio in Griechisch" → Unklar ob pro Sprache oder nur Greek audio

---

## ✅ EMPFOHLENE MIGRATION

### Phase 1: Datenbank Migration

**Neue Table:** `multilingual_content` (analog zu multilingual_vocabulary)

**SQL Migration:**
```sql
-- 1. Create new multilingual_content table
CREATE TABLE multilingual_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nr INTEGER,
    type VARCHAR(50) DEFAULT 'vocabulary',

    greek_transcription VARCHAR(200) NOT NULL,
    greek_phonetic VARCHAR(200),

    en_translation TEXT,
    en_importance_reason TEXT,
    en_audio_url VARCHAR(500),

    de_translation TEXT,
    de_importance_reason TEXT,
    de_audio_url VARCHAR(500),

    es_translation TEXT,
    es_importance_reason TEXT,
    es_audio_url VARCHAR(500),

    ru_translation TEXT,
    ru_importance_reason TEXT,
    ru_audio_url VARCHAR(500),

    level VARCHAR(2) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    frequency INTEGER NOT NULL CHECK (frequency BETWEEN 1 AND 5),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrate existing data from content → multilingual_content
INSERT INTO multilingual_content (
    id, type, greek_transcription, greek_phonetic,
    en_translation, level, difficulty, frequency
)
SELECT
    id,
    type,
    greek AS greek_transcription,
    phonetic AS greek_phonetic,
    english AS en_translation,
    level,
    difficulty,
    3 AS frequency  -- Default frequency
FROM content;

-- 3. Create indexes
CREATE INDEX idx_multilingual_content_level ON multilingual_content(level);
CREATE INDEX idx_multilingual_content_difficulty ON multilingual_content(difficulty);
CREATE INDEX idx_multilingual_content_frequency ON multilingual_content(frequency);

-- 4. Backup old table
ALTER TABLE content RENAME TO content_backup_20260218;

-- 5. Optional: Drop old table after verification
-- DROP TABLE content_backup_20260218;
```

---

### Phase 2: Component Migration

**Erstelle:** `src/components/admin/MultilingualContentModal.tsx`

**Basis:** VocabModal.tsx als Template (587 Zeilen)

**Änderungen:**
1. Rename: `VocabEntry` → `ContentEntry`
2. Rename: `VocabModal` → `MultilingualContentModal`
3. Rename: `CreateVocabPayload` → `CreateContentPayload`
4. Add: `type` field (vocabulary, phrase, grammar)
5. Import from: `@/lib/api/content` (statt vocab)

**Estimated time:** 1-2 hours

---

### Phase 3: API Functions

**Update:** `src/lib/api/content.ts`

**Neue Funktionen** (analog zu vocab.ts):
- `createContentEntry()`
- `updateContentEntry()`
- `checkDuplicate()`
- `validateContentEntry()`
- `fetchContentList()`
- `exportCSV()`
- `importCSV()`

**Estimated time:** 2-3 hours

---

### Phase 4: Type Definitions

**Update:** `src/types/content.ts`

**Neue Types:**
```typescript
export interface ContentEntry {
    id: string;
    nr?: number;
    type: 'vocabulary' | 'phrase' | 'grammar';

    greek_transcription: string;
    greek_phonetic?: string;

    en_translation?: string;
    en_importance_reason?: string;
    en_audio_url?: string;

    de_translation?: string;
    de_importance_reason?: string;
    de_audio_url?: string;

    es_translation?: string;
    es_importance_reason?: string;
    es_audio_url?: string;

    ru_translation?: string;
    ru_importance_reason?: string;
    ru_audio_url?: string;

    level: ContentLevel;
    difficulty: ContentDifficulty;
    frequency: ContentFrequency;

    created_at: string;
    updated_at: string;
}

export type ContentLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ContentDifficulty = 'easy' | 'medium' | 'hard';
export type ContentFrequency = 1 | 2 | 3 | 4 | 5;
```

**Estimated time:** 30 minutes

---

### Phase 5: Page Update

**Update:** `src/app/admin/content/page.tsx`

**Änderungen:**
- Import: `MultilingualContentModal` (statt ContentModal)
- State: ContentEntry statt alte Content
- API calls: Neue content.ts functions
- Props: Neue interface

**Estimated time:** 1 hour

---

## ⏱️ GESAMTAUFWAND

| Phase | Beschreibung | Zeit |
|-------|-------------|------|
| **Phase 1** | Datenbank Migration | 1-2h |
| **Phase 2** | Component erstellen | 1-2h |
| **Phase 3** | API Functions | 2-3h |
| **Phase 4** | Type Definitions | 30min |
| **Phase 5** | Page Update | 1h |
| **Testing** | Vollständiger Test | 2h |
| **TOTAL** | | **7.5-10.5h** |

---

## 🚨 RISIKO-BEWERTUNG

### Breaking Changes:
- ✅ Datenbank-Schema komplett anders
- ✅ Alte `content` table wird zu backup
- ✅ Bestehende Daten werden migriert (bilingual → multilingual)
- ✅ DE, ES, RU Spalten bleiben leer (müssen manuell gepflegt werden)

### Rollback-Plan:
```sql
-- If migration fails:
DROP TABLE multilingual_content;
ALTER TABLE content_backup_20260218 RENAME TO content;
```

### Data Loss Risk:
- ❌ Kein Datenverlust (alte Daten werden migriert)
- ⚠️ Neue Spalten (DE, ES, RU) sind initial leer
- ✅ Alte table wird als backup behalten

---

## ❓ OFFENE FRAGEN

### Frage 1: Audio URL pro Sprache?
**CSV hat:** "Audio in Griechisch"
**VocabModal hat:** Audio URL pro Sprache (en_audio_url, de_audio_url, etc.)

**Optionen:**
- A) Nur ein audio_url (griechisch)
- B) Audio pro Sprache (4 URLs)

**Empfehlung:** Option B (wie VocabModal)

---

### Frage 2: Type-Feld behalten?
**Content table hat:** `type` (vocabulary, phrase, grammar)
**Vocab table hat:** Kein type (ist implizit "vocabulary")

**Optionen:**
- A) Type behalten (content kann alles sein)
- B) Type entfernen (nur vocabulary)

**Empfehlung:** Option A (Type behalten für Flexibilität)

---

### Frage 3: Alte content table?
**Nach Migration:**

**Optionen:**
- A) Als backup behalten (content_backup_20260218)
- B) Sofort löschen
- C) Nach 1 Woche löschen

**Empfehlung:** Option C (1 Woche backup)

---

## 📝 NÄCHSTER SCHRITT

Ich habe den Dialog komplett analysiert. Jetzt brauche ich deine Entscheidungen zu:

1. ✅ Audio URL: Pro Sprache oder nur griechisch?
2. ✅ Type-Feld: Behalten oder entfernen?
3. ✅ Backup-Strategie: Wie lange alte table behalten?

**Dann kann ich den kompletten Migrations-Plan schreiben!**

Soll ich weitermachen? 🚀
