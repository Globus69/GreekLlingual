# 📱 MOBILE-FIRST-STRATEGIE – VERBINDLICHE REGEL

**Aktiviert:** 17. Februar 2026, 21:00 CET
**Status:** ✅ AKTIV & IRREVERSIBEL
**Gültigkeit:** Bis Mobile-Version stabil & fertig ist

---

## 🚨 KRITISCHE REGEL – KEINE AUSNAHMEN

### **1. ENTWICKLUNG NUR FÜR MOBILE**

**Alle weiteren Arbeiten betreffen AUSSCHLIESSLICH die MOBILE Version:**
- ✅ iPhone/Android (< 768px, Touch-optimiert)
- ✅ Routes: `/m/*` (z.B. `/m/stats`, `/m/settings`, `/m/practice-modes`)
- ✅ Mobile-First Design System
- ✅ Touch Targets (min 44x44px)
- ✅ Gestures (swipe, tap, long-press)
- ✅ Bottom Navigation
- ✅ Bottom Sheets statt Dialogs

**Was bedeutet das:**
- Alle Verbesserungen → Mobile
- Alle Bugfixes → Mobile
- Alle Refactorings → Mobile
- Alle Tests → Mobile
- Alle neuen Features → Mobile
- Alle Performance-Optimierungen → Mobile

---

### **2. DESKTOP-ENTWICKLUNG GESTOPPT**

**Desktop wird ERST portiert NACH Mobile-Fertigstellung:**
- ❌ Keine neuen Desktop-Features
- ❌ Keine Desktop-Bugfixes (außer kritisch)
- ❌ Keine Desktop-Optimierungen
- ❌ Keine parallele Entwicklung

**Bestehende Desktop-Arbeit:**
- ✅ Bleibt erhalten (Stats Page, Settings Page)
- ✅ Wird NICHT gelöscht
- ⚠️ Wird NICHT weiterentwickelt
- ⏸️ Pausiert bis Mobile fertig ist

**Begründung:**
- Mobile-First = bessere UX auf allen Geräten
- Fokus vermeidet Code-Duplikation
- Stabilität durch schrittweises Vorgehen


---

### **4. MOBILE LAYOUT = VERBINDLICHER STYLE-GUIDE**

**Das Design-System der MOBILEN Version ist ab sofort Standard:**

**Verbindlich:**
- ✅ Farben: `#0F0F11` Background, `#007AFF` Primary, `#FF3B30` Danger
- ✅ Typografie: System Fonts, 11-32px Sizes
- ✅ Spacing: 4px Grid (4, 8, 12, 16, 20, 24, 32)
- ✅ Border Radius: 12px, 16px (rounded)
- ✅ Glassmorphism: `backdrop-filter: blur(10-20px)`
- ✅ Shadows: Subtle, iOS-style
- ✅ Animations: Smooth, 200-300ms transitions

**Beispiel-Dialoge (Stil-Referenz):**
- "Due Cards Today" (knapp, klar, mobil-lesbar)
- Bottom Sheets mit Handle Bar
- Swipe-to-close Gestures
- Touch-optimierte Buttons (min 44x44px)

**KEINE Änderungen am Design-System bis Mobile fertig ist!**

---

### **5. AGENT-AUFTEILUNG (3 AGENTS)**

**Klare Verantwortungsbereiche – keine Überschneidungen:**

#### **Agent 1: UI-Komponenten & Layout**
**Verantwortung:**
- Mobile UI Components (Buttons, Cards, Bottom Sheets, Navigation)
- Responsive Layouts (< 768px breakpoints)
- Touch Targets & Gestures (swipe, tap, long-press)
- Mobile-optimierte Grids (2-column max)
- Bottom Navigation Bar
- Mobile-specific animations

**Datei:** `_Agent1_UI_Mobile.md`

---

#### **Agent 2: State-Management, Logic, API**
**Verantwortung:**
- React State Management (useState, useEffect, Context)
- Business Logic (FSRS, SRS, Learning Algorithms)
- API Integration (Supabase queries)
- Mobile-optimierte Data Fetching (lazy loading, pagination)
- Offline-First Logic (Service Workers, Cache)
- Performance (reduce bundle size, code splitting)

**Datei:** `_Agent2_Logic_Mobile.md`

---

#### **Agent 3: Tests, Performance, Accessibility**
**Verantwortung:**
- Unit Tests (Jest, React Testing Library)
- Integration Tests (API, Database)
- E2E Tests (Playwright, mobile viewport)
- Performance Testing (Lighthouse Mobile, Core Web Vitals)
- Accessibility (mobile screenreader, reduced motion, contrast)
- Mobile-specific A11y (touch targets, focus management)

**Datei:** `_Agent3_Tests_Mobile.md`

---

**Regel:**
- Jeder Agent arbeitet **unabhängig** in seinem Bereich
- Keine Blockierung zwischen Agents
- Klare Schnittstellen (Props, Hooks, API)
- Regelmäßige Sync in `MASTER-SESSION-STATUS.md`

---

### **6. DOKUMENTATION – ZWINGEND**

**Jede Änderung wird dokumentiert:**

#### **Agent-spezifische Dateien:**
- `_Agent1_UI_Mobile.md` → UI-Änderungen
- `_Agent2_Logic_Mobile.md` → Logic-Änderungen
- `_Agent3_Tests_Mobile.md` → Test-Änderungen

**Format:**
```markdown
## [Datum] - [Feature/Bugfix]
**Agent:** Agent 1
**Bereich:** Mobile Bottom Sheet Component
**Änderungen:**
- Erstellt: DueCardsSheet.tsx (255 lines)
- Features: Swipe-to-close, backdrop, glassmorphism
- Tests: ✅ Touch gestures, ✅ Accessibility
**Status:** ✅ Complete
```

#### **Master-Datei:**
- `MASTER-SESSION-STATUS.md` → Zusammenfassung aller Agents

**Format:**
```markdown
## Session [Datum]
**Agent 1:** Bottom Sheets fertig (3 components)
**Agent 2:** FSRS Logic mobile-optimiert
**Agent 3:** E2E Tests für Mobile Practice Modes
**Overall Progress:** 75% → 82%
```

---

## 🎯 ZIEL

**Primäres Ziel:**
Mobile App fertigstellen, stabilisieren, testen, production-ready machen.

**Sekundäres Ziel (danach):**
Mobile → Desktop portieren (etablierte Patterns nutzen).

---

## ✅ AKTUELLE MOBILE-STATUS

**Was ist fertig:**
- ✅ Mobile Dashboard (`/m/page.tsx`) - 12 Tiles, Bottom Nav
- ✅ Mobile Stats Page (`/m/stats/page.tsx`) - Production-ready
- ✅ Mobile Settings Page (`/m/settings/page.tsx`) - Production-ready
- ✅ Mobile Bottom Navigation (Home, Stats, Settings)
- ✅ Mobile Bottom Sheets (DueCards, TrainWeakWords)

**Was fehlt:**
- ⚠️ Admin Panel Mobile UI (nur Desktop)
- ⚠️ Mobile E2E Tests
- ⚠️ Mobile Performance Optimization

**Erledigt (nach Status-Update 17.02.2026):**
- ✅ Practice Modes Mobile UI - FERTIG!
- ✅ Vocabulary Mobile UI - FERTIG!
- ✅ Grammar Mobile UI - FERTIG!
- ✅ Daily Phrases Mobile UI - FERTIG!

**Priorität (verbleibend):**
1. Mobile E2E Tests (HIGH)
2. Mobile Performance Optimization (HIGH)
3. Admin Panel Mobile (LOW)

---

## 📋 NÄCHSTE SCHRITTE

### **Sofort (diese Session):**
1. ✅ MOBILE-FIRST-STRATEGY.md erstellt
2. ✅ CLAUDE.md aktualisiert
3. ✅ Agent-Dateien erstellen (_Agent1_, _Agent2_, _Agent3_)
4. ✅ MASTER-SESSION-STATUS.md erstellen
5. ✅ CURRENT-WORK.md aktualisieren

### **Nächste Entwicklung:**
- Practice Modes Mobile UI implementieren
- Mobile-optimierte Vocabulary UI
- Mobile E2E Testing
- Performance-Optimierung (Lighthouse Mobile Score > 90)

---

## 🔒 REGEL IST IRREVERSIBEL

**Diese Strategie gilt bis:**
- ✅ Mobile-Version ist stabil
- ✅ Alle Mobile-Features sind fertig
- ✅ Alle Mobile-Tests bestehen
- ✅ Mobile Performance Score > 90
- ✅ Mobile Accessibility Score > 95

**NUR DANN** wird Desktop wieder entwickelt (durch Porting von Mobile).

---

**Status:** ✅ AKTIV seit 17. Februar 2026, 21:00 CET
**Bestätigt von:** Claude Sonnet 4.5
**Verbindlich für:** Alle Agents (1, 2, 3)

---

**Ende der Mobile-First-Strategie** 📱
