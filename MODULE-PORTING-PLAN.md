# MODULE PORTING PLAN: Mobile → Desktop

**Datum:** 17. Februar 2026, 19:00 CET
**Status:** Analyse Complete, Bereit für Approval
**Ziel:** Module von Mobile Version (fortgeschrittener) zu Desktop Version portieren

---

## 📊 ANALYSE: WAS EXISTIERT WO?

### ✅ **BEIDE VERSIONEN HABEN (Shared Components):**

**Learning Dialogs (bereits in beiden verwendet):**
- ✅ `VocabularyDialog` (FSRS-6) - src/components/learning/vocabulary-dialog.tsx
- ✅ `GrammarDialog` (FSRS-6) - src/components/learning/grammar-dialog.tsx
- ✅ `DailyPhrasesDialog` - src/components/learning/daily-phrases-dialog.tsx
- ✅ `DueCardsDialog` - src/components/learning/due-cards-dialog.tsx
- ✅ `WeakWordsDialog` - src/components/learning/weak-words-dialog.tsx

**Desktop-Only Dialogs:**
- ✅ `ComprehensionDialog` - src/components/learning/comprehension-dialog.tsx
- ✅ `ListeningDialog` - src/components/learning/listening-dialog.tsx
- ✅ `LessonDialog` - src/components/learning/lesson-dialog.tsx

**Practice Modes (Desktop hat dedicated page):**
- ✅ `/practice-modes` page - src/app/practice-modes/page.tsx
- ✅ Practice Modes Components:
  - matching-game.tsx
  - multiple-choice-quiz.tsx
  - write-input-practice.tsx
  - practice-result-summary.tsx
  - practice-mode-dialog.tsx

---

### 🟢 **NUR MOBILE HAT (Muss zu Desktop portiert werden):**

#### **1. Stats Page (HIGH PRIORITY)**
- **File:** `src/app/m/stats/page.tsx` (309 lines)
- **Features:**
  - Komplette Statistik-Seite mit 6 Stat Cards (Streak, Total Words, Learned, Mastered, Due Today, Accuracy)
  - Detailed Statistics Sektion
  - Weekly Activity Chart Integration
  - Mobile-optimized Layout
  - Bottom Navigation
- **Desktop Status:** ❌ Nur Widget (`VocabularyStatsWidget`), keine dedizierte Seite
- **Porting Priority:** ⭐⭐⭐⭐⭐

#### **2. Settings Page (HIGH PRIORITY)**
- **File:** `src/app/m/settings/page.tsx` (249 lines)
- **Features:**
  - User Account Info Display
  - Settings Options (Language, Notifications, Appearance, Learning Goals, Privacy)
  - Logout Functionality
  - Mobile-optimized Layout
  - Bottom Navigation
- **Desktop Status:** ❌ Keine Settings-Seite
- **Porting Priority:** ⭐⭐⭐⭐⭐

#### **3. Mobile Bottom Navigation (MEDIUM PRIORITY)**
- **File:** `src/components/mobile/MobileBottomNav.tsx` (54 lines)
- **Features:**
  - Fixed bottom navigation (Home, Stats, Settings)
  - Active state highlighting
  - Touch-optimized (60px min-width)
- **Desktop Status:** ❌ Desktop hat Top-Navigation (DashboardHeader)
- **Porting Priority:** ⭐⭐ (Nur für Desktop-Mobile-Hybrid nötig)

#### **4. Mobile Bottom Sheets (LOW PRIORITY)**
- **Files:**
  - `src/components/mobile/DueCardsSheet.tsx` (255 lines)
  - `src/components/mobile/TrainWeakWordsSheet.tsx` (226 lines)
- **Features:**
  - Touch-optimized Bottom Sheets
  - Backdrop + Slide-in Animation
  - Dark Design mit Glassmorphism
  - Handle Bar für Swipe-to-close
- **Desktop Status:** ✅ Desktop nutzt Dialogs (DueCardsDialog, WeakWordsDialog)
- **Porting Priority:** ⭐ (Desktop-Dialogs sind ausreichend)

#### **5. Mobile Dashboard Layout (INFORMATIONAL)**
- **File:** `src/app/m/page.tsx` (486 lines)
- **Features:**
  - 12 Module Tiles (2x6 Grid)
  - Compact Stats Header (collapsible)
  - Touch-optimized tiles (56px min-height)
  - Admin Panel Button
  - ModuleTile Component
- **Desktop Status:** ✅ Desktop hat 16 Action Tiles (4x4 Grid) + Mastery Box
- **Porting Priority:** ⭐ (Layouts unterschiedlich by design)

---

### 🔵 **NUR DESKTOP HAT (Info für Vollständigkeit):**

#### **1. Mastery Box**
- **Location:** `src/app/dashboard/page.tsx` (Lines 228-284)
- **Features:**
  - Total Study Time
  - 3 Progress Bars (📖 Reading, 👁️ Viewing, 👂 Listening)
  - Rating Tiles (Last Test, Actual Test, Last Exam)
  - Vocabulary Progress Section
  - Suggestion Text
- **Mobile Status:** ❌ Mobile hat compact stats header
- **Reason:** Desktop-specific layout design

#### **2. Practice Modes Page**
- **Location:** `src/app/practice-modes/page.tsx`
- **Features:** Standalone page für Practice Modes
- **Mobile Status:** ✅ Mobile öffnet Practice Modes als Dialog (könnte auch Link bekommen)

#### **3. Additional Dialogs**
- ComprehensionDialog, ListeningDialog, LessonDialog
- **Mobile Status:** ❌ Noch nicht implementiert (Coming Soon alerts)

---

## 🎯 PORTING STRATEGY

### **PHASE 1: Stats Page zu Desktop (HIGH PRIORITY)** ⭐⭐⭐⭐⭐

**Was:** Mobile Stats Page `/m/stats` → Desktop Stats Page `/stats`

**Warum jetzt:**
- Desktop hat nur Widget, keine dedizierte Stats-Seite
- Mobile Stats Page ist **production-ready** und getestet
- Nutzt bereits `useStatsData` Hook (shared)
- Nutzt `WeeklyActivityChart` (shared)

**Porting Plan:**

1. **Erstelle Desktop Stats Page:**
   ```
   src/app/stats/page.tsx (NEW)
   ```
   - Copy Mobile Stats Page als Basis
   - Adaptiere Layout für Desktop (breitere Bildschirme)
   - Ersetze Bottom Navigation mit Desktop Navigation (Back Button + DashboardHeader)
   - Behalte Grid-Layout (kann 3-4 columns statt 2)
   - Behalte alle Stat Cards, Detailed Stats, Weekly Activity Chart

2. **Integration in Desktop Dashboard:**
   - Füge Action Tile "📊 Statistics" zu Dashboard hinzu
   - Route: `/stats`

3. **Responsive Design:**
   - Mobile: 2-column grid
   - Tablet: 3-column grid
   - Desktop: 4-column grid

**Zeit:** 2-3 Stunden
**Dateien:** 1 neu, 1 modifiziert (dashboard/page.tsx)

---

### **PHASE 2: Settings Page zu Desktop (HIGH PRIORITY)** ⭐⭐⭐⭐⭐

**Was:** Mobile Settings Page `/m/settings` → Desktop Settings Page `/settings`

**Warum jetzt:**
- Desktop hat **keine** Settings-Seite
- User brauchen Logout, Language Switch, Preferences
- Mobile Version ist production-ready

**Porting Plan:**

1. **Erstelle Desktop Settings Page:**
   ```
   src/app/settings/page.tsx (NEW)
   ```
   - Copy Mobile Settings Page als Basis
   - Adaptiere Layout für Desktop (2-column statt 1-column)
   - Ersetze Bottom Navigation mit Desktop Navigation
   - Behalte User Info, Settings Options, Logout Button

2. **Integration in Desktop Dashboard:**
   - Füge Action Tile "⚙️ Settings" zu Dashboard hinzu
   - Route: `/settings`
   - Oder: Füge Settings Link zu DashboardHeader hinzu

3. **Responsive Design:**
   - Mobile: 1-column
   - Tablet/Desktop: 2-column grid für Settings

**Zeit:** 1-2 Stunden
**Dateien:** 1 neu, 1-2 modifiziert (dashboard/page.tsx, optional: DashboardHeader.tsx)

---

### **PHASE 3: Desktop Action Tiles zu Mobile Dashboard (OPTIONAL)** ⭐⭐

**Was:** Desktop hat 16 Tiles, Mobile nur 12. Missing Tiles portieren.

**Desktop Tiles die Mobile fehlen:**
1. **Button 13:** 🎮 Practice Modes (Desktop-Link zu `/practice-modes`)
2. **Button 14:** 🏛️ Cyprus Exam
3. **Button 15:** 📕 Book Recommendations
4. **Button 16:** 📊 Progress History

**Porting Plan:**

1. **Option A: Link zu Desktop Practice Modes Page:**
   - Mobile Tile "Practice Modes" soll zu `/practice-modes` linken (statt Dialog)

2. **Option B: Neue Mobile Tiles:**
   - Füge fehlende 4 Tiles zu Mobile Dashboard hinzu
   - Layout: 3x6 grid (18 tiles) oder keep 2x6 + scroll

**Zeit:** 1 Stunde
**Dateien:** 1 modifiziert (m/page.tsx)
**Priority:** OPTIONAL (Mobile ist funktional mit 12 Tiles)

---

### **PHASE 4: Cross-Platform Components (FUTURE)** ⭐

**Was:** Erstelle wiederverwendbare Components für beide Versionen

**Components zu abstrahieren:**

1. **StatCard Component:**
   - Shared zwischen Mobile Stats und Desktop Widgets
   - Props: icon, label, value, suffix, color

2. **SettingButton Component:**
   - Shared zwischen Mobile Settings und Desktop Settings
   - Props: icon, title, subtitle, onClick

3. **BottomNavigation Component:**
   - Conditional Rendering: nur auf Mobile
   - Desktop: zeigt DashboardHeader

**Zeit:** 2-3 Stunden
**Dateien:** 3 neue Components in `src/components/shared/`
**Priority:** LOW (Nice-to-have, kein Blocker)

---

## 📋 PORTING CHECKLIST

### **Sofort (Diese Woche):**

- [ ] **PHASE 1:** Stats Page zu Desktop portieren (2-3h)
  - [ ] Erstelle `src/app/stats/page.tsx`
  - [ ] Adaptiere Layout für Desktop
  - [ ] Füge Navigation zu Dashboard hinzu
  - [ ] Teste auf Desktop + Mobile

- [ ] **PHASE 2:** Settings Page zu Desktop portieren (1-2h)
  - [ ] Erstelle `src/app/settings/page.tsx`
  - [ ] Adaptiere Layout für Desktop
  - [ ] Füge Navigation zu Dashboard hinzu
  - [ ] Teste Logout Funktionalität

**Gesamt:** 3-5 Stunden für High-Priority Porting

---

### **Optional (Später):**

- [ ] **PHASE 3:** Desktop Tiles zu Mobile hinzufügen (1h)
- [ ] **PHASE 4:** Cross-Platform Components erstellen (2-3h)

---

## 🔄 VERGLEICH: MOBILE vs DESKTOP

| Feature | Mobile (/m/*) | Desktop (/) | Action |
|---------|---------------|-------------|--------|
| **Dashboard** | 2x6 Grid (12 tiles) | 4x4 Grid (16 tiles) | ✅ Both OK |
| **Stats Page** | ✅ `/m/stats` (Complete) | ❌ Only Widget | 🔥 PORT TO DESKTOP |
| **Settings Page** | ✅ `/m/settings` (Complete) | ❌ Missing | 🔥 PORT TO DESKTOP |
| **Practice Modes** | Dialog/Coming Soon | ✅ `/practice-modes` | ✅ Desktop has it |
| **Navigation** | Bottom Nav | Top Header | ✅ Both OK |
| **Dialogs** | 5 Dialogs (Vocab, Grammar, Daily, Due, Weak) | 8 Dialogs (+Comprehension, Listening, Lesson) | ✅ Desktop has more |
| **Bottom Sheets** | ✅ DueCardsSheet, TrainWeakWordsSheet | ❌ Uses Dialogs instead | ✅ Both OK |
| **Mastery Box** | ❌ Has compact stats header | ✅ Detailed mastery box | ✅ Both OK (different designs) |

---

## 🚀 RECOMMENDED WORKFLOW

### **TODAY/MORGEN (3-5h):**

1. ✅ **Start mit Phase 1: Stats Page** (2-3h)
   - Schnellster Win: Desktop bekommt vollständige Stats-Seite
   - Mobile Code ist bereits production-ready
   - Nur Layout-Anpassungen nötig

2. ✅ **Dann Phase 2: Settings Page** (1-2h)
   - Wichtig: User brauchen Logout + Preferences
   - Mobile Code ist fertig, nur adaptieren

**Nach Porting:**
3. ✅ Testing beider Pages auf Desktop (30 Min)
4. ✅ Commit: `feat(stats): Add dedicated Stats page from Mobile` (15 Min)
5. ✅ Commit: `feat(settings): Add dedicated Settings page from Mobile` (15 Min)

---

## ❓ ENTSCHEIDUNGEN NÖTIG

### **Frage 1: Stats Page Design für Desktop**
- **Option A:** Copy Mobile 2-column → Desktop 4-column Grid
- **Option B:** Behalte Mobile 2-column auch auf Desktop (simple)
- **Empfehlung:** Option A (nutzt Desktop-Platz besser)

### **Frage 2: Settings Page Navigation**
- **Option A:** Action Tile "⚙️ Settings" im Dashboard (wie Mobile)
- **Option B:** Settings Link im DashboardHeader (oben rechts)
- **Empfehlung:** Option B (Standard Desktop Pattern)

### **Frage 3: Practice Modes in Mobile**
- **Option A:** Link zu `/practice-modes` (Desktop Page)
- **Option B:** Eigene Mobile Practice Modes Page erstellen
- **Empfehlung:** Option A (Desktop Page ist responsive)

---

## 📊 PRIORITÄTS-MATRIX

| Phase | Effort | Impact | Priority | Status |
|-------|--------|--------|----------|--------|
| **Phase 1: Stats Page** | 2-3h | HIGH | ⭐⭐⭐⭐⭐ | ⏳ Ready |
| **Phase 2: Settings Page** | 1-2h | HIGH | ⭐⭐⭐⭐⭐ | ⏳ Ready |
| **Phase 3: Mobile Tiles** | 1h | LOW | ⭐⭐ | 💤 Optional |
| **Phase 4: Shared Components** | 2-3h | LOW | ⭐ | 💤 Future |

---

## ✅ NACH PORTING: WAS HABEN WIR DANN?

### **Desktop wird haben:**
- ✅ Vollständige Stats-Seite (wie Mobile, aber Desktop-optimized)
- ✅ Vollständige Settings-Seite (wie Mobile, aber Desktop-optimized)
- ✅ 16 Action Tiles im Dashboard
- ✅ Mastery Box mit detaillierten Stats
- ✅ Practice Modes Page
- ✅ 8 Learning Dialogs (Vocab, Grammar, Daily, Due, Weak, Comprehension, Listening, Lesson)

### **Mobile wird haben:**
- ✅ 12 Module Tiles (kompakt, touch-optimized)
- ✅ Stats Page (bereits da)
- ✅ Settings Page (bereits da)
- ✅ Bottom Navigation
- ✅ 5 Learning Dialogs (Vocab, Grammar, Daily, Due, Weak)
- ✅ Optional: Link zu Desktop Practice Modes

---

## 🎯 ERFOLGS-KRITERIEN

**Phase 1 + 2 erfolgreich wenn:**
1. ✅ Desktop hat `/stats` Route mit vollständiger Stats-Seite
2. ✅ Desktop hat `/settings` Route mit Settings-Seite + Logout
3. ✅ Beide Pages sind responsive (Mobile, Tablet, Desktop)
4. ✅ Navigation funktioniert (Dashboard → Stats/Settings → Back)
5. ✅ Keine Console Errors
6. ✅ useStatsData Hook funktioniert auf Desktop
7. ✅ Logout funktioniert auf Desktop Settings

---

## 💡 NÄCHSTE SCHRITTE

**APPROVAL NEEDED:**

1. **Bestätige Porting-Strategy:**
   - Phase 1 + 2 sofort umsetzen?
   - Phase 3 + 4 optional/später?

2. **Bestätige Design-Entscheidungen:**
   - Stats Page: 4-column Grid auf Desktop?
   - Settings: Link im Header oder Action Tile?

3. **Zeitplan:**
   - Heute/Morgen starten?
   - Oder erst nach anderen Tasks?

**Sage mir einfach:**
- **"Porting starten: Phase 1 + 2"** → Ich baue Stats + Settings für Desktop (3-5h)
- **"Erst X abschließen, dann Porting"** → Ich warte bis X fertig ist
- **"Nur Phase 1"** → Ich baue nur Stats Page (2-3h)
- **"Nur Phase 2"** → Ich baue nur Settings Page (1-2h)

---

**Ende des Porting-Plans** ✅

**Ready to start?** 🚀
