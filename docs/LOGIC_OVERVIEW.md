# LOGIC_OVERVIEW

**Status:** 2026-02-13
**Analysiert:** 25 Module, 11,644 LOC, 188 React Hooks
**Projekt:** HellenicHorizons GreekLingua Dashboard

---

## 1. AUTHENTICATION LOGIC

### AuthContext (3-Tier Login Strategy)
```typescript
Priority 1: supabase.rpc('verify_user_pin')  // bcrypt (most secure)
Priority 2: supabase.from('users').select()  // Direct query (legacy)
Priority 3: Local Admin Fallback              // Offline (Admin/123456)
```

**Session Timeout:**
- Admin: 15min (900,000ms)
- Student: 24h (86,400,000ms)
- Check: Every 60s for admin (interval)

**Account Lockout:**
- 5 failed → 15min locked
- `locked_until` timestamp in DB

---

### Admin Login (6-Digit PIN)
**Flow:**
1. CAPTCHA validation (math question)
2. IP whitelist check (if `ADMIN_ALLOWED_IPS` set)
3. PIN verification (bcrypt)
4. Progressive delays: [0ms, 1s, 2s, 5s, 10s]
5. Optional MFA (if enabled)

**API:**
- `supabase.rpc('verify_user_pin', {name, pin})`
- `supabase.rpc('log_admin_login', {username, ip, success, ...})`

---

### Student Login (4-Digit PIN)
**Flow:**
1. Client-side honeypot check (15 trap PINs)
2. If honeypot → Telegram alert via `/api/honeypot-alert`
3. RPC `verify_user_4digit_pin(pin, ip, user_agent)`
4. Account lockout check
5. Welcome popup → 1s delay → Login

**Honeypot PINs:**
```
0000, 1111-9999, 1234, 4321, 1122, 2211, 5678
```

**API:**
- `supabase.rpc('verify_user_4digit_pin')`
- `fetch('/api/honeypot-alert', {pin})`

---

## 2. LANGUAGE LOGIC

### LanguageContext (4 Locales)
```typescript
type Locale = 'en' | 'ru' | 'el' | 'de'
```

**Persistence:**
- `localStorage`: `greeklingua_locale`
- `DB`: `users.preferred_locale`

**Sync Logic:**
- Login → `syncLocaleFromUser(user.preferred_locale)`
- Locale change → `setLocale()` → localStorage + DB + Toast

---

### useTranslation (3-Tier Fallback)
```typescript
1. Cache hit → Return immediately
2. Supabase ui_translations table → Cache + return
3. FALLBACK_EN/EL/DE → Return hardcoded
```

**Cache Strategy:**
- Global per locale: `{en, ru, el, de}`
- Deduplication: `fetchPromises` prevents duplicate requests
- Race protection: `localeRef` + `cancelled` flag

**Template Substitution:**
```typescript
t('dashboard.welcome', {name: 'SWS'})
// → "Welcome back, SWS!"
```

---

## 3. LEARNING MODULE LOGIC

### VocabularyDialog (SRS Modes)
**3 Modes:**
- **weak**: `ease_factor < 2.0` (struggling cards)
- **due**: `next_review < NOW()` (scheduled reviews)
- **review**: All items (no filter)

**Data Strategy:**
```typescript
Priority 1: RPC get_learning_items_for_student()  // Filtered by level/difficulty
Priority 2: supabase.from('learning_items').select()  // Direct query
Priority 3: Hardcoded fallback (10 items)
```

**Level/Difficulty Matching:**
1. Exact match: `level = user.level AND difficulty = user.difficulty`
2. Same level: `level = user.level` (any difficulty)
3. All items (if none match)

**Rating Scale:**
- Hard: 1.0 → quality = 3
- Good: 2.5 → quality = 4
- Easy: 3.0 → quality = 5

---

### SM2 Algorithm (Spaced Repetition)
```typescript
If quality >= 3 (correct):
  repetition 0 → interval = 1 day
  repetition 1 → interval = 6 days
  repetition 2+ → interval = previous * ease_factor

If quality < 3 (incorrect):
  interval = 1 day
  repetition = 0

Ease Factor Formula:
  EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  Min EF = 1.3
```

**UI Mapping:**
| Button | Rating | Quality | Interval |
|--------|--------|---------|----------|
| Hard | 1.0 | 3 | Reset to 1d |
| Good | 2.5 | 4 | 1d → 6d → * EF |
| Easy | 3.0 | 5 | Aggressive growth |

---

### GrammarDialog, ComprehensionDialog, ListeningDialog
**Logic identisch zu VocabularyDialog mit:**
- Type filter: `type = 'grammar'/'comprehension'/'listening'`
- Listening: Audio playback + multiple choice
- Alle verwenden SM2 + Performance Evaluation

---

### LessonDialog (Teacher Sessions)
**Read-Only:**
- Liste: `supabase.rpc('get_lesson_sessions', {student_id})`
- Detail: `supabase.rpc('get_lesson_detail', {session_id})`

**Constraint:**
- 1 Session pro Student pro Tag: `UNIQUE(student_id, date)`

---

## 4. PERFORMANCE EVALUATION LOGIC

### Auto-Leveling Algorithm
```typescript
Minimum: 50 attempts required

If correct_rate > 80%:
  easy → middle → hard
  If hard: A1→A2→B1→B2, reset to easy

If correct_rate < 40%:
  hard → middle → easy
  If easy: B2→B1→A2→A1, reset to hard
```

**RPC Call:**
```typescript
supabase.rpc('evaluate_student_performance', {
  p_student_id,
  p_min_attempts: 50
})

Returns:
{
  evaluated: true,
  correct_rate: 85.5,
  total_attempts: 120,
  changed: true,
  old_level: "A1",
  new_level: "A2",
  old_difficulty: "hard",
  new_difficulty: "easy",
  message: "Great progress! Moving to A2-easy"
}
```

**Logging:**
- `performance_log` table speichert alle Änderungen
- UI: Grüne Box mit 🎯 zeigt Level-up

---

## 5. ADMIN BACKEND LOGIC

### StudentManagementDialog (CRUD)
**PIN Generation:**
```typescript
// 4-Digit (1000-9999)
do {
  pin = Math.floor(1000 + Math.random() * 9000)
  honeypot = HONEYPOT_PINS.has(pin)  // Client-check
  duplicate = await is_pin_taken(pin) // RPC-check
  attempts++
} while ((honeypot || duplicate) && attempts < 50)
```

**CRUD Operations:**
```typescript
Create: supabase.rpc('create_student', {...})  // bcrypt PIN-Hash
Read:   supabase.rpc('list_students')
Update: supabase.rpc('update_student', {...})  // Optional new PIN
Delete: supabase.rpc('delete_student', {id})   // Only role='student'
```

**CSV Export:**
```typescript
UTF-8 BOM: '\uFEFF' + CSV
Filename: students_YYYY-MM-DD.csv
Columns: Name, Email, WhatsApp, Level, Difficulty, Index-Key
```

---

### MFA Logic (TOTP)

**Setup:**
1. Generate TOTP secret (32 random chars)
2. QR Code: `otpauth://totp/GreekLingua:${username}?secret=${secret}&issuer=GreekLingua`
3. Generate 10 recovery codes
4. Verify 6-digit code → Save to DB

**Verify:**
```typescript
Validate TOTP with window=1 (±30s drift)
Fallback: Recovery codes (1-time use)
On success → onSuccess() → Redirect /dashboard
```

**Parameters:**
- Algorithm: SHA1
- Digits: 6
- Period: 30s
- Window: ±1 (accepts 30s before/after)

---

## 6. SECURITY LOGIC

### Rate Limiting (Middleware)
```typescript
// Student Login: 10 attempts/minute
rateLimitLogin.limit(clientIp)

// Admin Login: 3 attempts/5 minutes
rateLimitAdmin.limit(clientIp)

Algorithm: Upstash Redis Sliding Window
```

**IP Extraction Priority:**
1. `x-forwarded-for` (first IP)
2. `x-real-ip`
3. `'unknown'`

**Response:**
```typescript
HTTP 429 if exceeded
Headers:
  X-RateLimit-Limit: 10
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 60000
```

---

### Honeypot Detection
```typescript
// 15 Forbidden PINs
HONEYPOT_PINS = new Set([
  '0000', '1111', ..., '9999',  // Patterns
  '1234', '4321', '1122', '2211', '5678'
])

Flow:
1. Client-side check (login-pin/page.tsx)
2. If detected → fetch('/api/honeypot-alert', {pin})
3. API Route → Rate limit (10/min)
4. Telegram alert via Supabase Edge Function
5. Log to honeypot_log table
6. Show error popup (❌ Sicherheitswarnung)
```

**Telegram Message:**
```
🚨 SECURITY ALERT
Honeypot-PIN detected!
PIN: 0000
IP: 192.168.1.100
Time: 2026-02-13T10:30:00Z
⚠️ Suspicious login attempt blocked.
```

---

### Device Fingerprinting
```typescript
// FingerprintJS
Components:
  - Canvas fingerprinting
  - WebGL fingerprinting
  - Audio context
  - Screen resolution
  - Timezone
  - Fonts
  - Plugins

Fallback (if library fails):
  UserAgent + Screen + TZ + Lang → Hash (32-bit)
```

**Logic:**
```typescript
isFingerprintMatch(stored)
  → true: Known device, no alert
  → false: New device, warn admin
```

---

## 7. DASHBOARD LOGIC

### dashboard/page.tsx (Main View)
**Loading Sequence:**
1. Auth check → Redirect if not logged in
2. 800ms delay (smooth UX)
3. Load user stats from `student_progress`
4. Calculate mastery progress

**Mastery Calculation:**
```typescript
totalCorrect = SUM(student_progress.correct_count)
totalItems = 120  // Target
masteryProgress = MIN(100, (totalCorrect / totalItems) * 100)
```

**Stats:**
- Streak: `user.streak_days`
- Words: Total learned count
- Weak: Items with `ease_factor < 2.0`

---

### ActionGrid (9 Tiles)
**Buttons:**
1. 👩‍🏫 Your Lesson → `LessonDialog`
2. 📖 Comprehension → `ComprehensionDialog`
3. 📝 Exam Test → Toast (placeholder)
4. ⚡️ Quick Lesson → Toast
5. 🎮 Game → Toast
6. 🧪 Test → Toast
7. 📅 Lesson Today → Toast
8. 🔁 Review Vocab → `VocabularyDialog`
9. 🖨️ Print → `window.print()`

---

### PerformanceHub (Weekly Chart)
**Bar Chart Logic:**
```typescript
maxCount = MAX(data.count)
barHeight = (count / maxCount) * 100 + '%'

Current Day (Sunday):
  - Accent color
  - Glow effect
```

**Hardcoded Data:**
```typescript
{Mon: 45, Tue: 80, Wed: 65, Thu: 92, Fri: 58, Sat: 73, Sun: 110}
Total: 187
Target: "Meeting Weekly Goal" (green)
```

---

### Flashcard (Reusable Component)
**Flip Logic:**
```typescript
State: flipped (boolean)

Front:
  - Source language label
  - Term + example
  - Flip hint ("Click to flip")

Back:
  - Target (Greek)
  - Translation
  - Rating buttons (Hard/Good/Easy)
```

**Rating Flow:**
```typescript
onScore(quality) → Parent saves progress → Reset flip
```

---

## 8. DATABASE LOGIC (RPC Functions)

### verify_user_4digit_pin(p_pin, p_ip, p_user_agent)
```sql
1. Check banned_ips → Return error if banned
2. Check honeypot_pins → Return error + log
3. Lookup user by pin_4digit
4. Check locked_until → Return error if locked
5. Check account_lockout (5 fails = 15min)
6. On success → Reset failed_attempts
7. Return user data (id, name, level, difficulty, locale)
```

---

### evaluate_student_performance(p_student_id, p_min_attempts)
```sql
1. SELECT SUM(correct_count), SUM(attempts) FROM student_progress
2. Calculate correct_rate = correct / attempts * 100
3. If attempts < p_min_attempts → Return not_evaluated
4. Apply leveling rules:
   - >80% → Increase difficulty/level
   - <40% → Decrease difficulty/level
5. UPDATE users SET level, difficulty
6. INSERT INTO performance_log
7. Return JSON result
```

---

### get_learning_items_for_student(p_student_id, p_type, p_limit)
```sql
1. SELECT level, difficulty FROM users WHERE id = p_student_id
2. 3-Tier Query:
   Priority 1: level = user_level AND difficulty = user_difficulty
   Priority 2: level = user_level (any difficulty)
   Priority 3: All items (no filter)
3. LEFT JOIN student_progress FOR SRS data
4. LIMIT p_limit
5. Return items with progress
```

---

### create_student(...), update_student(...), delete_student(...)
```sql
create_student:
  1. Generate bcrypt hash: crypt(p_pin, gen_salt('bf'))
  2. INSERT INTO users (pin_hash, pin_4digit, level, difficulty, ...)
  3. Trigger auto-calculates performance_index
  4. Return new user_id

update_student:
  1. If p_new_pin provided → Regenerate bcrypt hash
  2. UPDATE users SET ...
  3. Trigger updates performance_index
  4. Return success

delete_student:
  1. DELETE FROM users WHERE id = p_id AND role = 'student'
  2. CASCADE deletes progress, lesson_sessions
```

---

## 9. KEY THRESHOLDS & CONSTANTS

| Konstante | Wert | Kontext |
|-----------|------|---------|
| Admin Session Timeout | 15 min | AuthContext |
| Student Session Timeout | 24 h | AuthContext |
| Account Lockout Threshold | 5 fails | verify_user_pin |
| Lockout Duration | 15 min | verify_user_pin |
| Student Rate Limit | 10/min | middleware.ts |
| Admin Rate Limit | 3/5min | middleware.ts |
| Honeypot Alert Rate Limit | 10/min | honeypot-alert/route.ts |
| Performance Min Attempts | 50 | usePerformanceEvaluation |
| Level-Up Threshold | >80% | evaluate_performance |
| Level-Down Threshold | <40% | evaluate_performance |
| SM2 Min Ease Factor | 1.3 | sm2.ts |
| SM2 Initial Interval | 1 day | sm2.ts |
| SM2 Second Interval | 6 days | sm2.ts |
| Honeypot PINs Count | 15 | login-pin/page.tsx |
| Admin PIN Length | 6 digits | login/page.tsx |
| Student PIN Length | 4 digits | login-pin/page.tsx |
| Translation Cache | 4 locales | useTranslation.ts |
| Translation Keys per Locale | ~130 | useTranslation.ts |

---

## 10. STATE MANAGEMENT PATTERNS

### Global State (Contexts)
```typescript
AuthContext:
  - user: User | null
  - isAuthenticated: boolean
  - isAdmin: boolean
  - login(), logout()

LanguageContext:
  - locale: 'en' | 'ru' | 'el' | 'de'
  - setLocale(lang)
  - syncLocaleFromUser(preferredLocale)
```

### Local State (Common Patterns)
```typescript
// Modal State
const [isDialogOpen, setIsDialogOpen] = useState(false)
const [dialogMode, setDialogMode] = useState<'weak' | 'due' | 'review'>('weak')

// Form State
const [form, setForm] = useState<FormData>({...})

// Loading State
const [loading, setLoading] = useState(true)

// Async Data
const [data, setData] = useState<T[]>([])
const [error, setError] = useState<string | null>(null)
```

### Side Effects (useEffect Patterns)
```typescript
// Auth Check + Redirect
useEffect(() => {
  if (!isAuthenticated) router.push('/login')
}, [isAuthenticated])

// Data Fetching
useEffect(() => {
  fetchData().then(setData)
}, [dependency])

// Session Timeout
useEffect(() => {
  const interval = setInterval(checkTimeout, 60000)
  return () => clearInterval(interval)
}, [])

// Locale Change
useEffect(() => {
  fetchTranslations(locale).then(setTranslations)
}, [locale])
```

---

## 11. API CALL PATTERNS

### Supabase RPC
```typescript
const { data, error } = await supabase.rpc('function_name', {
  p_param1: value1,
  p_param2: value2
})

if (error) {
  console.error('RPC error:', error)
  return fallback
}

return data
```

### Supabase Query
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('columns')
  .eq('field', value)
  .order('created_at', { ascending: false })
  .limit(10)
```

### Fetch API
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})

const data = await response.json()
```

---

## 12. ERROR HANDLING PATTERNS

### Try-Catch with Fallback
```typescript
try {
  const result = await supabase.rpc('verify_user_pin', {...})
  if (result.error) throw new Error(result.error)
  return result.data
} catch (error) {
  console.error('Login error:', error)
  return { success: false, error: 'Unknown error' }
}
```

### Fallback Chain
```typescript
// Priority 1: RPC
let data = await supabase.rpc('get_items')
if (!data || data.error) {
  // Priority 2: Direct Query
  data = await supabase.from('items').select()
}
if (!data || data.length === 0) {
  // Priority 3: Hardcoded Fallback
  data = FALLBACK_DATA
}
return data
```

---

## 13. VALIDATION LOGIC

### PIN Validation
```typescript
// Admin (6 digits)
const isValidAdminPin = /^\d{6}$/.test(pin)

// Student (4 digits)
const isValidStudentPin = /^\d{4}$/.test(pin)

// Honeypot Check
const isHoneypot = HONEYPOT_PINS.has(pin)
```

### CAPTCHA Validation
```typescript
const captchaCorrect = parseInt(userAnswer) === captcha.answer
```

### Form Validation
```typescript
// Student Form
const errors = {
  name: !form.name ? 'Name required' : null,
  pin: form.pin && !/^\d{4}$/.test(form.pin) ? 'PIN must be 4 digits' : null
}

const isValid = Object.values(errors).every(e => e === null)
```

---

## ZUSAMMENFASSUNG

**Analysierte Module:** 25
**Lines of Code:** 11,644
**React Hooks:** 188
**Supabase RPC:** 11 Functions
**Database Tables:** 11
**Security Layers:** 6

**Core Algorithmen:**
- SM2 Spaced Repetition
- Auto-Leveling (>80% / <40% Thresholds)
- 3-Tier Login Cascade
- 3-Tier Data Fallback
- Sliding Window Rate Limiting

**Daten-Flows:**
1. Login → Auth → Session → Dashboard
2. Locale Change → Translation Fetch → UI Update
3. Learning Session → SRS → Progress Save → Auto-Level
4. Honeypot Attempt → Alert → Ban → Log

---

**Letzte Aktualisierung:** 2026-02-13
