# ⚙️ AGENT 2: STATE-MANAGEMENT, LOGIC, API (MOBILE)

**Verantwortung:** State, Business Logic, API Integration (Mobile-optimiert)
**Status:** ✅ AKTIV
**Mobile-First:** ✅ VERBINDLICH

---

## 📋 VERANTWORTUNGSBEREICH

**Agent 2 ist zuständig für:**
- React State Management (useState, useEffect, Context)
- Business Logic (FSRS, SRS, Learning Algorithms)
- API Integration (Supabase queries, RPC functions)
- Mobile-optimierte Data Fetching (lazy loading, pagination, caching)
- Offline-First Logic (Service Workers, IndexedDB, Cache API)
- Performance (bundle size, code splitting, tree shaking)
- Data Transformation (API → UI format)
- Error Handling & Retry Logic

**NICHT zuständig für:**
- UI Components (→ Agent 1)
- Tests (→ Agent 3)

---

## ✅ FERTIGE LOGIC-MODULE

### **State Management:**

#### **1. Auth Context** (`context/auth-context.tsx`)
- **Status:** ✅ Production-ready
- **Features:**
  - User authentication (4-digit PIN)
  - Session management
  - Logout functionality
  - Admin role detection

#### **2. Language Context** (`context/language-context.tsx`)
- **Status:** ✅ Production-ready
- **Features:**
  - Multi-language support (EN, RU, DE, ES, EL)
  - Locale switching
  - Translation hooks

### **Business Logic:**

#### **3. FSRS Algorithm** (`lib/fsrs/`)
- **Status:** ✅ Production-ready (FSRS-6)
- **Features:**
  - Spaced Repetition calculation
  - Next review scheduling
  - Difficulty adjustment
  - Memory state tracking
- **Used by:** Vocabulary, Grammar modules

#### **4. SRS Parameters** (`lib/srs-parameters.ts`)
- **Status:** ✅ Production-ready
- **Features:**
  - Configurable SRS settings
  - Daily review limits
  - Retention targets

### **API Integration:**

#### **5. Supabase Client** (`db/supabase.ts`)
- **Status:** ✅ Production-ready
- **Features:**
  - Database connection
  - Query helpers
  - RPC function calls

#### **6. Stats Data Hook** (`hooks/use-stats-data.ts`)
- **Status:** ✅ Production-ready
- **Features:**
  - Fetch user statistics
  - Weekly activity data
  - Progress overview
  - Performance metrics
- **Used by:** Mobile Stats Page, Desktop Stats Page

#### **7. Streak Hook** (`hooks/use-streak.ts`)
- **Status:** ✅ Production-ready
- **Features:**
  - Daily streak tracking
  - Milestone detection
  - Auto-update on activity

---

## ⚠️ FEHLENDE MOBILE-OPTIMIERUNGEN

### **Priority: HIGH**

#### **1. Practice Modes Mobile Logic**
- **Current Status:** ⚠️ Desktop-optimiert, braucht Mobile-Anpassungen
- **Needed:**
  - Touch-optimierte State-Management für Matching Game
  - Mobile-freundliche Drag-and-Drop Logic
  - Offline-Mode für Practice Sessions
  - Auto-save Progress (bei App-Minimize)
  - Resume Session Logic
- **ETA:** 2-3h

#### **2. Vocabulary Mobile Data Layer**
- **Current Status:** ✅ FSRS vorhanden, aber UI-Logic fehlt
- **Needed:**
  - Mobile-optimierte Card Fetching (preload next 3)
  - Touch gesture state management (swipe left/right)
  - Offline card caching (IndexedDB)
  - Auto-sync when online
  - Mobile-specific pagination
- **ETA:** 2h

#### **3. Performance Optimization**
- **Current Status:** ⚠️ Nicht mobile-optimiert
- **Needed:**
  - Code splitting für Mobile Routes
  - Lazy loading für heavy components
  - Image optimization (WebP, lazy load)
  - Bundle size reduction (< 200KB initial)
  - Service Worker für offline support
- **ETA:** 3-4h

### **Priority: MEDIUM**

#### **4. Mobile Data Caching Strategy**
- **Needed:**
  - Cache API für API responses
  - IndexedDB für user data
  - Stale-while-revalidate pattern
  - Network-first vs Cache-first logic
- **ETA:** 2-3h

#### **5. Error Handling Mobile**
- **Needed:**
  - Mobile-friendly error messages
  - Retry logic with exponential backoff
  - Offline detection & fallback
  - Toast notifications statt Alerts
- **ETA:** 1-2h

---

## 🔧 MOBILE-OPTIMIERUNG GUIDELINES

### **Data Fetching:**
```typescript
// ✅ GOOD: Mobile-optimized
const { data, error } = await supabase
  .from('vocabulary')
  .select('*')
  .limit(10) // Paginate!
  .order('due_date', { ascending: true });

// ❌ BAD: Desktop-style (fetch all)
const { data } = await supabase.from('vocabulary').select('*');
```

### **State Management:**
```typescript
// ✅ GOOD: Optimized re-renders
const [currentCard, setCurrentCard] = useState(null);
const cardsRef = useRef([]); // Don't trigger re-renders

// ❌ BAD: Re-render for every card
const [allCards, setAllCards] = useState([]);
```

### **Offline Support:**
```typescript
// ✅ GOOD: Check online status
if (navigator.onLine) {
  await syncToServer();
} else {
  saveToIndexedDB();
}

// ❌ BAD: Assume always online
await supabase.from('...').insert(...);
```

### **Performance:**
```typescript
// ✅ GOOD: Code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ❌ BAD: Import everything
import HeavyComponent from './HeavyComponent';
```

---

## 📝 ÄNDERUNGS-LOG

### **17. Februar 2026, 22:30 CET - Vocabulary Mobile UI Implementation**
**Agent:** Agent 2
**Bereich:** Mobile Vocabulary Card Learning
**Branch:** agent-2-mobile-vocabulary
**Änderungen:**
- ✅ Erstellt: `/m/vocabulary/page.tsx` (745 lines)
- ✅ Features implementiert:
  - Card Flip Interface (Tap to reveal)
  - FSRS-6 Integration (FSRSScheduler, Rating 1-4)
  - Mobile-optimierte Data Fetching (20 cards per batch)
  - TTS Audio Controls (Play, Speed, Auto-play)
  - Session Statistics Tracking
  - Session Summary Screen
  - Touch-optimierte Rating Buttons (70px height)
  - Glassmorphism Design (iOS-style)
- ✅ RPC Functions verwendet:
  - `get_due_vocabulary_cards` (p_limit: 20)
  - `update_vocabulary_progress` (FSRS-6 parameters)
- ✅ Mobile-First Design:
  - Sticky Header mit Back Button
  - Progress Indicator (Card X / Y)
  - Large Touch Targets (70px buttons)
  - Bottom Navigation Integration
  - Dark Theme (#0F0F11 background)
- ✅ State Management:
  - useState für cards, currentIndex, isFlipped
  - useMemo für FSRS Scheduler (avoid re-creation)
  - localStorage für TTS preferences
  - Session stats tracking (again, hard, good, easy)
**Tests:** ⏳ Pending (E2E, FSRS verification)
**Status:** ✅ Implementation Complete
**Time:** ~2.5 hours

### **17. Februar 2026 - Mobile-First aktiviert**
**Agent:** Agent 2
**Bereich:** Strategy
**Änderungen:**
- ✅ Mobile-First-Strategie aktiviert
- ✅ Agent 2 Verantwortungsbereich definiert
- ✅ Fehlende Mobile-Optimierungen identifiziert
- ✅ Guidelines dokumentiert
**Status:** ✅ Complete

---

**Nächste Aufgaben:**
1. ⏳ Testing: Mobile E2E Tests für Vocabulary
2. ⏳ Performance: Code Splitting, Lazy Loading
3. ⏳ Offline: IndexedDB Caching für Cards
4. ⏳ Swipe Gestures (Optional Enhancement)

**Status:** Vocabulary Mobile UI ✅ Complete, Testing Pending 🚀
