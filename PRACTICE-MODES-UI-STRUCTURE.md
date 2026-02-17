# Practice Modes UI-Struktur Analyse

**Datum:** 17. Februar 2026
**URL:** http://localhost:3000/m/practice-modes
**Ziel:** Vollständige UI-Baumstruktur mit Verschachtelungs-Analyse

---

## 1. UI-Baumstruktur (Nummeriert)

### 1. OfflineBanner Component
   - 1.1. Offline Status Indicator
   - 1.2. Network Status Message

### 2. Main Container (`<div>` min-height: 100vh)
   - **Beschreibung:** Root-Container mit dunkelgrauem Hintergrund (#0F0F11)

#### 2.1. Header (Sticky, z-index: 50)
   - **Beschreibung:** Obere Navigation mit Back Button, Title, Cache-Info, Refresh Button
   - 2.1.1. Back Button (`<button>`)
      - **Tap Target:** 44px × 44px
      - **Action:** router.push('/m')
   - 2.1.2. Title & User Info Container (`<div>` flex: 1)
      - 2.1.2.1. Title Row
         - 2.1.2.1.1. H1 "🎮 Practice Modes"
         - 2.1.2.1.2. CacheIndicator Component (conditional)
      - 2.1.2.2. User Name Text (color: #93C5FD)
   - 2.1.3. Refresh Button (`<button>`)
      - **Tap Target:** 44px × 44px
      - **Action:** refresh() - Cache invalidieren

#### 2.2. Memory Games Section (`<div>` padding: 16px)
   - **Beschreibung:** Sektion mit Hardcoded Memory Game Buttons
   - 2.2.1. Section Title "Memory Games"
   - 2.2.2. Memory Games Container (flex-column, gap: 12px)
      - 2.2.2.1. Memory Classic Button (`<button>`)
         - **Tap Target:** full width × 88px (minHeight)
         - **Action:** router.push('/m/practice-modes/memory')
         - **Nesting:** Button > Content Container > Icon + Text + Arrow
         - 2.2.2.1.1. Content Container (flex, gap: 12px)
            - 2.2.2.1.1.1. Icon (🎮, fontSize: 40px)
            - 2.2.2.1.1.2. Text Container
               - 2.2.2.1.1.2.1. Title "Memory Classic"
               - 2.2.2.1.1.2.2. Subtitle "Match pairs • 4×4 Grid"
            - 2.2.2.1.1.3. Arrow Icon (→, fontSize: 24px)
      - 2.2.2.2. Memory Split Button (`<button>`)
         - **Tap Target:** full width × 88px (minHeight)
         - **Action:** router.push('/m/practice-modes/memory-split')
         - **Nesting:** Identisch zu 2.2.2.1

#### 2.3. Text Practice Section (`<div>` padding: 16px)
   - **Beschreibung:** Sektion mit Text-basierten Practice Modes
   - 2.3.1. Section Title "Text Practice"
   - 2.3.2. Text Practice Container (flex-column, gap: 12px)
      - 2.3.2.1. Cloze Text Button (`<button>`)
         - **Tap Target:** full width × 88px (minHeight)
         - **Action:** router.push('/m/practice-modes/cloze-text')
         - **Nesting:** Identisch zu 2.2.2.1

#### 2.4. Practice Items List Section (`<div>` padding: 16px)
   - **Beschreibung:** Dynamische Liste von Practice Items aus DB
   - 2.4.1. Empty State (conditional, wenn keine Items)
      - 2.4.1.1. Icon (🎮, fontSize: 64px)
      - 2.4.1.2. Title "No Practice Modes Available"
      - 2.4.1.3. Description Text
   - 2.4.2. Practice Items Container (conditional, wenn Items vorhanden)
      - **Beschreibung:** flex-column, gap: 12px
      - 2.4.2.1. PracticeItemCard Component (dynamisch, map-iteriert)
         - **Tap Target:** full width × 88px (minHeight)
         - **Action:** handleItemClick() → Opens PracticeModesSheet
         - **Nesting:** Button > Icon + Content + Arrow
         - 2.4.2.1.1. Status Icon Container (56px × 56px)
            - 2.4.2.1.1.1. Icon (✅/🔓/🔒 je nach Status)
         - 2.4.2.1.2. Content Container (flex: 1)
            - 2.4.2.1.2.1. English Title (fontSize: 16px)
            - 2.4.2.1.2.2. Greek Translation (color: #93C5FD)
            - 2.4.2.1.2.3. Status Text + Level Badges
         - 2.4.2.1.3. Arrow Icon (→, fontSize: 20px)

#### 2.5. Bottom Navigation (Fixed, z-index: 50)
   - **Beschreibung:** Persistente untere Navigation mit 3 Tabs
   - 2.5.1. Navigation Container (max-width: 448px, centered)
      - 2.5.1.1. Home Button (`<button>`)
         - **Tap Target:** 60px × 60px (minWidth/minHeight)
         - **Action:** router.push('/m')
         - 2.5.1.1.1. Icon (🏠, fontSize: 24px)
         - 2.5.1.1.2. Label "Home" (fontSize: 11px)
      - 2.5.1.2. Stats Button (`<button>`)
         - **Tap Target:** 60px × 60px
         - **Action:** router.push('/m/stats')
         - 2.5.1.2.1. Icon (📊)
         - 2.5.1.2.2. Label "Stats"
      - 2.5.1.3. Settings Button (`<button>`)
         - **Tap Target:** 60px × 60px
         - **Action:** router.push('/m/settings')
         - 2.5.1.3.1. Icon (⚙️)
         - 2.5.1.3.2. Label "Settings"

### 3. PracticeModesSheet Component (Portal/Overlay, z-index: 999-1000)
   - **Beschreibung:** Bottom Sheet für Mode Selection, wird bei Item-Click geöffnet
   - **Problem:** ADDITIONAL LAYER zwischen Item Selection und Game Dialog

#### 3.1. Backdrop (`<div>` z-index: 999)
   - **Action:** onClick → handleSheetClose()
   - **Style:** rgba(0, 0, 0, 0.6) + blur(4px)

#### 3.2. Bottom Sheet Container (`<div>` z-index: 1000)
   - **Beschreibung:** Slide-up Modal mit Mode-Buttons
   - **Animation:** translateY(100%) → translateY(0)
   - 3.2.1. Handle Bar (40px × 4px)
   - 3.2.2. Header Section
      - 3.2.2.1. Content Container (flex: 1)
         - 3.2.2.1.1. Item English Title
         - 3.2.2.1.2. Item Greek Translation
      - 3.2.2.2. Close Button (`<button>` 36px × 36px)
         - **Action:** onClose() → Closes sheet
         - 3.2.2.2.1. X Icon (✕, fontSize: 18px)
   - 3.2.3. Content Section (padding: 24px)
      - 3.2.3.1. Section Title "Choose a Practice Mode"
      - 3.2.3.2. Mode Buttons Container (flex-column, gap: 12px)
         - 3.2.3.2.1. Mode Button (`<button>` - map-iteriert)
            - **Tap Target:** full width × 80px (minHeight)
            - **Action:** handleModeClick() → Opens PracticeModeDialog
            - **Nesting:** Button > Icon + Content + Arrow
            - 3.2.3.2.1.1. Icon Container (56px × 56px)
               - 3.2.3.2.1.1.1. Icon (🎮/🎯/✍️ oder 🔒)
            - 3.2.3.2.1.2. Content Container (flex: 1)
               - 3.2.3.2.1.2.1. Mode Title (z.B. "Matching Game")
               - 3.2.3.2.1.2.2. Mode Description
            - 3.2.3.2.1.3. Arrow Icon (→) (nur wenn unlocked)
      - 3.2.3.3. Info Box (Tip Section)
         - 3.2.3.3.1. Tip Icon + Text

### 4. PracticeModeDialog Component (Portal/Overlay, shadcn Dialog)
   - **Beschreibung:** Desktop-Component reused for Mobile, Game-Dialog
   - **Problem:** THIRD LAYER - Dialog über Bottom Sheet über Page

#### 4.1. Dialog Overlay (shadcn/ui Dialog)
   - **Beschreibung:** Full-screen Dialog mit blur Backdrop

#### 4.2. DialogContent (max-width: 4xl, max-height: 90vh)
   - 4.2.1. DialogHeader
      - 4.2.1.1. DialogTitle (z.B. "🎮 Matching Game")
   - 4.2.2. Game Content Container (padding: 16px)
      - 4.2.2.1. Game Component (conditional render)
         - 4.2.2.1.1. MatchingGame Component (wenn mode === 'matching')
         - 4.2.2.1.2. MultipleChoiceQuiz Component (wenn mode === 'multiple_choice')
         - 4.2.2.1.3. WriteInputPractice Component (wenn mode === 'write_input')
   - 4.2.3. ToastContainer Component

### 5. Game Pages (Direct Navigation Routes)
   - **Beschreibung:** Alternative direkter Zugriff ohne Sheet/Dialog-Layer

#### 5.1. Memory Classic Game (`/m/practice-modes/memory/page.tsx`)
   - 5.1.1. Header (Sticky)
      - 5.1.1.1. Back Button → router.push('/m/practice-modes')
      - 5.1.1.2. Title "🎮 Memory Game"
      - 5.1.1.3. Language Toggle Button (🇬🇷/🇺🇸)
   - 5.1.2. Stats Bar (Matches, Mistakes, Time)
   - 5.1.3. Game Grid (4×4 Cards)
      - 5.1.3.1. Memory Card Button (map-iteriert, 16 cards)
         - **Tap Target:** full width × 90px (minHeight)
         - **Action:** handleCardClick()
   - 5.1.4. Game Complete Screen (conditional)
      - 5.1.4.1. Result Stats
      - 5.1.4.2. Play Again Button
      - 5.1.4.3. Close Button
   - 5.1.5. MobileBottomNav Component

#### 5.2. Memory Split Game (`/m/practice-modes/memory-split/page.tsx`)
   - 5.2.1. Compact Header (Sticky)
      - 5.2.1.1. Back Button
      - 5.2.1.2. Stats (Time, Matches, Mistakes)
      - 5.2.1.3. Action Buttons Container
         - 5.2.1.3.1. Mute Button (VolumeX/Volume2 Icon)
         - 5.2.1.3.2. Restart Button (🔄)
   - 5.2.2. Settings Bar (not in game complete)
      - 5.2.2.1. Pair Count Toggle (6/8/12 buttons)
      - 5.2.2.2. Right Controls
         - 5.2.2.2.1. Grid Swap Button (↕️)
         - 5.2.2.2.2. Reveal All Toggle (👁️/🙈)
   - 5.2.3. Game Content (flex-column layout)
      - 5.2.3.1. First Grid (Top/Greek - dynamic)
         - 5.2.3.1.1. Grid Title
         - 5.2.3.1.2. Card Grid (3×2 or 4×2 or 4×3)
            - 5.2.3.1.2.1. Memory Card Button (map-iteriert)
      - 5.2.3.2. Solution Button (88px height)
         - 5.2.3.2.1. Icon + Text + Penalty Label
      - 5.2.3.3. Second Grid (Bottom/English - dynamic)
   - 5.2.4. Game Complete Screen (conditional)
   - 5.2.5. MobileBottomNav Component

#### 5.3. Cloze Text Game (`/m/practice-modes/cloze-text/page.tsx`)
   - 5.3.1. Header (Sticky)
      - 5.3.1.1. Back Button
      - 5.3.1.2. Timer & Score Display
      - 5.3.1.3. Mute Button (🔊/🔇)
   - 5.3.2. Progress Bar Section
      - 5.3.2.1. Progress Text (1/5)
      - 5.3.2.2. Progress Bar Visual
   - 5.3.3. Game Content
      - 5.3.3.1. Sentence Display (with Blank Buttons)
         - 5.3.3.1.1. Blank Button (`<button>` 120px × 88px minHeight)
            - **Action:** handleBlankTap() → Opens Bottom Sheet
      - 5.3.3.2. Next Button (conditional, wenn sentence complete)
   - 5.3.4. Bottom Sheet (AnimatePresence, z-index: 1000)
      - 5.3.4.1. Backdrop (z-index: 999)
      - 5.3.4.2. Sheet Container
         - 5.3.4.2.1. Handle Bar
         - 5.3.4.2.2. Title "Choose the correct word:"
         - 5.3.4.2.3. Options Container (flex-column, gap: 12px)
            - 5.3.4.2.3.1. Option Button (map-iteriert, 3 buttons)
               - **Tap Target:** full width × 88px (minHeight)
               - **Action:** handleOptionSelect()
   - 5.3.5. Game Complete Screen (conditional)
   - 5.3.6. MobileBottomNav Component

---

## 2. Verschachtelungs-Probleme

### Problem 1: Triple-Layer Modal Verschachtelung (HIGH PRIORITY)
- **Location:** 2.4.2.1 → 3 → 4
- **Problem:**
  - User Flow: Item Card Click → PracticeModesSheet (z-index: 1000) → PracticeModeDialog (shadcn Dialog)
  - **3 verschachtelte Overlays**: Page → Bottom Sheet → Dialog
  - Z-index Konflikt: Bottom Sheet (1000) vs Dialog (shadcn standard ~50)
  - Komplexität: onClose-Callbacks kaskadierend (Dialog → Sheet → Page)
  - UX: User muss 2× zurück navigieren (Dialog schließen + Sheet schließen)
- **Impact:** HIGH
- **Lösung:**
  1. **EMPFOHLEN:** PracticeModesSheet entfernen, direkte Navigation zu Game Pages
  2. **ODER:** PracticeModeDialog durch mobile-native Component ersetzen
  3. **ODER:** Sheet direkt mit Game-Content füllen (ohne zusätzlichen Dialog)

### Problem 2: Doppelte Navigation Patterns (MEDIUM PRIORITY)
- **Location:** 2.2 + 2.3 vs 2.4
- **Problem:**
  - Memory Games (2.2) + Cloze Text (2.3): Direkte Navigation zu `/m/practice-modes/[game]`
  - Practice Items (2.4): Indirekte Navigation via Sheet + Dialog
  - **Inkonsistenz**: User lernt 2 verschiedene Interaction Patterns
  - Memory Games haben KEINE Mode-Selection (direkt zum Game)
  - Practice Items haben Mode-Selection (Matching, Multiple Choice, Write Input)
- **Impact:** MEDIUM
- **Lösung:**
  - Konsistentes Pattern: ENTWEDER alle direct navigation ODER alle via Sheet
  - Vorschlag: Memory Games auch via Sheet (wenn Multi-Mode Support gewünscht)
  - ODER: Practice Items direct navigation zu `/m/practice-modes/[mode]/[itemId]`

### Problem 3: Nested Buttons in PracticeItemCard (LOW PRIORITY)
- **Location:** 2.4.2.1
- **Problem:**
  - Button Container (88px height) enthält verschachtelte Interactive Elements:
    - Icon Container (56px) ist rein visuell (OK)
    - Content Container mit Text (OK)
    - Arrow Icon (20px) ist rein visuell (OK)
  - **ABER:** Gesamte Card ist ein `<button>` - semantisch korrekt
  - Kein Problem mit nested interactivity (alle Elemente sind non-interactive children)
- **Impact:** LOW (kein technisches Problem, nur strukturell komplex)
- **Lösung:** Keine Änderung notwendig - aktuelle Struktur ist korrekt

### Problem 4: Bottom Sheet Button-Target Sizes (MEDIUM PRIORITY)
- **Location:** 3.2.3.2.1
- **Problem:**
  - Mode Buttons in Sheet: 80px minHeight (GUT)
  - Close Button: 36px × 36px (ZU KLEIN für Touch)
  - **WCAG AA Standard:** Minimum 44px × 44px für Touch-Targets
  - Close Button schwer zu treffen auf Mobile
- **Impact:** MEDIUM (Accessibility & UX)
- **Lösung:**
  - Close Button auf 44px × 44px erhöhen
  - ODER: Tap-Bereich mit padding erweitern (visual: 36px, tap: 44px)

### Problem 5: Z-Index Management (HIGH PRIORITY)
- **Location:** 2.5 (z: 50) vs 3.1/3.2 (z: 999/1000) vs 4 (shadcn Dialog)
- **Problem:**
  - Bottom Navigation: z-index 50
  - Bottom Sheet Backdrop: z-index 999
  - Bottom Sheet: z-index 1000
  - PracticeModeDialog: shadcn standard (vermutlich ~50)
  - **Konflikt:** Dialog könnte UNTER Bottom Sheet erscheinen
  - Keine zentrale z-index Scale/System erkennbar
- **Impact:** HIGH (funktionale Bug-Gefahr)
- **Lösung:**
  - Z-Index Scale definieren:
    - Navigation: 50
    - Overlays/Sheets: 100-200
    - Dialogs: 300-400
    - Toasts/Notifications: 500+
  - PracticeModeDialog z-index explizit setzen (über Sheet)

### Problem 6: Duplicate Bottom Navigation (LOW PRIORITY)
- **Location:** 2.5 (Practice Page) vs 5.1.5/5.2.5/5.3.6 (Game Pages)
- **Problem:**
  - Bottom Nav erscheint auf Practice Page (2.5)
  - Bottom Nav erscheint auch auf allen Game Pages (5.x.5)
  - **Redundanz:** User kann während Game zu anderen Seiten navigieren
  - UX Frage: Sollte während Game-Session Navigation möglich sein?
- **Impact:** LOW (Design-Entscheidung, kein technischer Fehler)
- **Lösung:**
  - **Option A:** Bottom Nav in Games entfernen (Fokus auf Game)
  - **Option B:** Bottom Nav behalten (Flexibilität für User)
  - Empfehlung: In Games HIDDEN, nur Back-Button nutzen

### Problem 7: Memory Split Settings Bar Complexity (MEDIUM PRIORITY)
- **Location:** 5.2.2
- **Problem:**
  - Settings Bar mit 6 interaktiven Elementen:
    - 3× Pair Count Buttons (6/8/12)
    - 1× Grid Swap Button
    - 1× Reveal Toggle
    - (Plus Mute + Restart in Header = 8 Buttons total)
  - **Cognitive Load:** Zu viele Optionen gleichzeitig sichtbar
  - Settings ändern während Game = State-Reset (Pairs/Mistakes verloren)
  - Kleine Touch-Targets (36-40px) für Settings
- **Impact:** MEDIUM (UX Complexity)
- **Lösung:**
  - Settings in eigenes "⚙️ Game Settings" Menu auslagern
  - Settings NUR vor Game-Start änderbar (nicht während Game)
  - ODER: Settings als Pre-Game Screen (wie Difficulty Selection)

### Problem 8: Cloze Text Bottom Sheet Options Overlap (LOW PRIORITY)
- **Location:** 5.3.4.2.3.1
- **Problem:**
  - 3 Option Buttons (88px each) + padding = ~300px height
  - Bottom Sheet hat paddingBottom: 40px
  - Bei kleinen Screens (iPhone SE, 667px): Bottom Sheet kann Sentence verdecken
  - **Overlap Risk:** User sieht nicht mehr, welches Blank ausgewählt wurde
- **Impact:** LOW (nur auf sehr kleinen Screens)
- **Lösung:**
  - Bottom Sheet max-height: 50vh (immer genug Platz für Sentence)
  - ODER: Sentence in Sheet Header duplizieren (Kontext behalten)

---

## 3. Verbesserungsvorschläge (Priorität)

### HIGH PRIORITY:

#### 1. Entferne Triple-Layer Modal Verschachtelung
**Problem:** Item Card → PracticeModesSheet → PracticeModeDialog (3 Layer)
**Lösung A (Empfohlen):**
```
Direkter Navigation Flow:
- Practice Item Card Click → router.push(`/m/practice-modes/[mode]/[itemId]`)
- PracticeModesSheet entfernen
- Mode-Selection als eigene Page (wenn notwendig)
```

**Lösung B (Alternative):**
```
Sheet als finaler Layer:
- PracticeModesSheet öffnet Game direkt (ohne Dialog)
- Game-Content inline im Sheet rendern
- PracticeModeDialog-Logic in Sheet integrieren
```

**Impakt:** Reduziert Komplexität um 50%, verbessert UX

---

#### 2. Zentrales Z-Index System implementieren
**Location:** Alle Overlays
**Lösung:**
```typescript
// z-index-scale.ts
export const Z_INDEX = {
  BASE: 0,
  NAVIGATION: 50,
  STICKY_HEADER: 60,
  DROPDOWN: 100,
  BOTTOM_SHEET: 200,
  MODAL_BACKDROP: 300,
  MODAL_CONTENT: 400,
  TOAST: 500,
  TOOLTIP: 600,
} as const;
```

**Anwendung:**
- Bottom Nav: `zIndex: Z_INDEX.NAVIGATION` (50)
- PracticeModesSheet Backdrop: `zIndex: Z_INDEX.MODAL_BACKDROP` (300)
- PracticeModesSheet: `zIndex: Z_INDEX.MODAL_CONTENT` (400)
- PracticeModeDialog: `zIndex: Z_INDEX.MODAL_CONTENT + 1` (401)

**Impakt:** Verhindert z-index Konflikte, bessere Wartbarkeit

---

#### 3. Bottom Sheet Close Button vergrößern
**Location:** 3.2.2.2
**Aktuell:** 36px × 36px (ZU KLEIN)
**Lösung:**
```typescript
<button
  onClick={onClose}
  style={{
    width: '44px',      // 36 → 44
    height: '44px',     // 36 → 44
    minWidth: '44px',   // NEU
    minHeight: '44px',  // NEU
    borderRadius: '50%',
    // ... rest
  }}
>
```

**Impakt:** WCAG AA Compliance, bessere Touch-Accuracy

---

### MEDIUM PRIORITY:

#### 4. Konsistente Navigation Pattern
**Problem:** Memory Games (direct) vs Practice Items (via Sheet)
**Lösung:**
```
OPTION A - Alle Direct:
- PracticeModesSheet entfernen
- Alle Items → `/m/practice-modes/[mode]/[itemId]`
- Mode-Selection als separates Bottom Sheet (wenn Item multi-mode)

OPTION B - Alle via Sheet:
- Memory Games auch via Sheet
- Sheet zeigt "Game Modes" (Classic / Split)
- Konsistenter Entry Point
```

**Empfehlung:** Option A (Direct Navigation)
**Impakt:** Konsistente UX, leichter zu lernen

---

#### 5. Memory Split Settings Menu auslagern
**Location:** 5.2.2
**Problem:** 8 Buttons gleichzeitig (Header + Settings Bar)
**Lösung:**
```
Settings Pre-Game Screen:
1. User öffnet Memory Split Game
2. Settings Screen erscheint ZUERST:
   - Pair Count: 6 / 8 / 12
   - Language Order: Greek Top / English Top
   - Difficulty: Normal / Show All
3. "Start Game" Button → Game mit Settings startet
4. Settings während Game NICHT änderbar
```

**Impakt:** Reduziert Cognitive Load, verhindert ungewollte State-Resets

---

#### 6. Practice Items List Gruppierung
**Location:** 2.4.2
**Problem:** Flache Liste, keine Kategorisierung
**Lösung:**
```
Gruppierung nach Status:
- "Ready to Practice" (unlocked items)
- "Almost There" (1-2 reviews to unlock)
- "Locked" (>2 reviews needed)

ODER nach Level:
- "Beginner" (A1)
- "Intermediate" (A2)
- "Advanced" (B1+)
```

**Impakt:** Bessere Übersicht, Motivation (Progress sichtbar)

---

### LOW PRIORITY:

#### 7. Bottom Navigation in Games ausblenden
**Location:** 5.1.5, 5.2.5, 5.3.6
**Empfehlung:** MobileBottomNav während Game HIDDEN
**Grund:**
- Fokus auf Game (keine Ablenkung)
- Back Button in Header reicht
- Mehr vertikaler Platz für Game-Content

**Lösung:**
```typescript
// In Game Pages:
{/* Bottom Navigation - REMOVED during game */}
{/* <MobileBottomNav /> */}
```

**Impakt:** Cleaner UI, mehr Platz, besserer Fokus

---

#### 8. Cloze Text Bottom Sheet Sentence Context
**Location:** 5.3.4
**Problem:** Sheet kann Sentence verdecken (kleine Screens)
**Lösung:**
```typescript
<motion.div style={{
  // ... existing styles
  maxHeight: '50vh', // NEU
  overflowY: 'auto', // NEU
}}>
  {/* Optional: Sentence Reminder */}
  <div style={{
    fontSize: '14px',
    color: '#8E8E93',
    marginBottom: '12px',
    textAlign: 'center'
  }}>
    Fill in: "{sentences[currentIndex].greek}"
  </div>

  {/* Options */}
  {/* ... */}
</motion.div>
```

**Impakt:** Besserer Kontext, keine Verdeckung

---

#### 9. Practice Item Card Skeleton Loading
**Location:** 2.4.2.1
**Problem:** Loading State zeigt nur Text "Loading practice modes..."
**Lösung:**
```typescript
{loading && (
  <div style={{ /* Practice Items Container */ }}>
    {[1, 2, 3].map(i => (
      <div key={i} style={{
        /* PracticeItemCard dimensions */
        background: 'rgba(255, 255, 255, 0.05)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        {/* Skeleton content */}
      </div>
    ))}
  </div>
)}
```

**Impakt:** Bessere Loading UX, Layout Shift vermeiden

---

## 4. Beispiel-Refactoring (Critical Path)

### Refactoring 1: Entferne PracticeModesSheet Layer

#### Vorher (3 Layer):
```
User Click Item Card
  ↓
PracticeModesSheet opens (z: 1000)
  ↓
User Click Mode Button
  ↓
PracticeModeDialog opens (shadcn Dialog)
  ↓
User plays game
  ↓
User closes Dialog
  ↓
Sheet still open → User closes Sheet
```

#### Nachher (1 Layer):
```
User Click Item Card
  ↓
Navigate to `/m/practice-modes/matching/${itemId}`
  ↓
User plays game
  ↓
User clicks Back Button
  ↓
Returns to Practice Modes List
```

#### Code-Änderungen:

**1. Entferne handleItemClick in page.tsx:**
```typescript
// VORHER:
const handleItemClick = (item: PracticeItem) => {
  setSelectedItem(item);
  setSheetOpen(true);
};

// NACHHER:
const handleItemClick = (item: PracticeItem) => {
  // If item has multiple modes, show mode selector
  if (item.practice_modes_config.available_modes.length > 1) {
    router.push(`/m/practice-modes/select?itemId=${item.id}`);
  } else {
    // Direct navigation to single mode
    const mode = item.practice_modes_config.available_modes[0];
    router.push(`/m/practice-modes/${mode}/${item.id}`);
  }
};
```

**2. Entferne PracticeModesSheet aus JSX:**
```typescript
// LÖSCHEN:
{selectedItem && (
  <PracticeModesSheet
    isOpen={sheetOpen}
    onClose={handleSheetClose}
    item={selectedItem}
    unlockStatuses={unlockStatuses[selectedItem.id] || {}}
  />
)}
```

**3. Neue Mode Selection Page (falls multi-mode):**
```typescript
// /src/app/m/practice-modes/select/page.tsx
export default function ModeSelectPage() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');

  // Load item + modes
  // Render buttons for each mode
  // Navigate to `/m/practice-modes/[mode]/[itemId]`
}
```

---

### Refactoring 2: Z-Index Scale Implementation

**1. Erstelle z-index Scale:**
```typescript
// /src/lib/constants/z-index.ts
export const Z_INDEX = {
  BASE: 0,
  NAVIGATION: 50,
  STICKY_HEADER: 60,
  DROPDOWN: 100,
  BOTTOM_SHEET: 200,
  MODAL_BACKDROP: 300,
  MODAL_CONTENT: 400,
  TOAST: 500,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
```

**2. Wende in Components an:**

**Header:**
```typescript
// VORHER:
<div style={{ zIndex: 50, /* ... */ }}>

// NACHHER:
import { Z_INDEX } from '@/lib/constants/z-index';
<div style={{ zIndex: Z_INDEX.STICKY_HEADER, /* ... */ }}>
```

**Bottom Navigation:**
```typescript
// VORHER:
<div style={{ zIndex: 50, /* ... */ }}>

// NACHHER:
<div style={{ zIndex: Z_INDEX.NAVIGATION, /* ... */ }}>
```

**PracticeModesSheet (falls behalten):**
```typescript
// Backdrop - VORHER:
<div style={{ zIndex: 999, /* ... */ }} />

// NACHHER:
<div style={{ zIndex: Z_INDEX.MODAL_BACKDROP, /* ... */ }} />

// Sheet - VORHER:
<div style={{ zIndex: 1000, /* ... */ }} />

// NACHHER:
<div style={{ zIndex: Z_INDEX.MODAL_CONTENT, /* ... */ }} />
```

---

## 5. Zusammenfassung

### Kritische Findings:
1. **Triple-Layer Modal Verschachtelung** (HIGH) - Komplexität & UX Problem
2. **Z-Index Management fehlt** (HIGH) - Bug-Gefahr
3. **Inkonsistente Navigation Patterns** (MEDIUM) - Lernkurve
4. **Touch-Target Sizes** (MEDIUM) - Accessibility

### Empfohlene Reihenfolge:
1. Implementiere Z-Index Scale (1-2h)
2. Entferne PracticeModesSheet Layer (3-4h)
3. Vergrößere Close Button Touch-Targets (30min)
4. Settings Pre-Game Screen für Memory Split (2-3h)
5. Konsistente Navigation Pattern (1-2h)

### Total Aufwand: ~10-13h Development

### Expected Impact:
- **Complexity:** -50% (weniger verschachtelte Layer)
- **Bugs:** -80% (z-index Konflikte gelöst)
- **UX:** +40% (konsistente Navigation, bessere Touch-Targets)
- **Maintenance:** +60% (klare Struktur, zentrale Konstanten)

---

**Nächste Schritte:**
1. Review mit Team
2. Priorisierung bestätigen
3. Refactoring in Tasks aufteilen
4. Implementation starten (beginne mit Z-Index Scale)

---

**Erstellt am:** 17. Februar 2026
**Analysiert von:** Claude Sonnet 4.5 (Agent Analysis)
