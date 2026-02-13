# MOBILE-APP-ABSPALTUNG-TODOS

**Letzte Aktualisierung:** 2026-02-13
**Projekt:** HellenicHorizons GreekLingua Dashboard - Mobile Web Variant

---

## 🎯 VISION & ARCHITEKTUR-PRINZIPIEN

**Ziel:** Abgespaltete, rein mobile Web-App (PWA-fähig), die nur 2–3 ausgewählte Hauptfunktionen der bestehenden Desktop-Web-Anwendung zeigt.

**Wichtigste Architektur-Regel:**
→ **KEINE Code-Duplikation** bei Business-Logik und Kernmodulen
→ Mobile App verlinkt/importiert bestehende Module, Stores, Services, API-Calls, i18n aus dem Hauptprojekt
→ Änderungen im Hauptprojekt (z.B. neue Sprache, Bugfix) wirken sich **automatisch 1:1** in Mobile-Version aus

**Startpunkt (Minimal Viable Mobile):**
- Bestehender Login-Screen mit PIN-Eingabe
- Button-Unterscheidung:
  - "Desktop-Version" → bleibt auf aktueller Seite
  - "Mobile App" → öffnet neue Route/Subdomain/separaten Build (tbd)

---

## ☐ OFFENE TO-DOs (Priorität absteigend)

### 2026-02-13 ✅ **KRITISCH:** Architektur-Entscheidung: Routing-Strategie implementiert
- [x] **ENTSCHIEDEN:** Route-basiert (`/m/*`) mit automatischer Device-Detection
- [x] User-Flow: Login → Device-Detection → Desktop: `/dashboard` | Mobile: `/m`
- [x] Redirect-Logik: Middleware prüft User-Agent nach Login
- [x] Middleware implementieren (src/middleware.ts erweitern) ✅
- [x] Route `/m/page.tsx` erstellen (Mobile Dashboard) ✅
- [x] Device-Detection Utility schreiben (lib/device-utils.ts) ✅
- [x] Login-Pin angepasst: Redirect zu `/redirect-after-login` ✅

### 2026-02-13 ✅ **KRITISCH:** Tech-Stack & Build-Setup klären
- [x] **ENTSCHIEDEN:** Option A - Single Project (alles in einem Projekt)
- [x] Build-Konfiguration: Keine Änderung nötig (Next.js 16 beibehalten)
- [x] Package.json Struktur: Bleibt unverändert (kein Monorepo)
- [x] **Rückfrage 2 + 3 beantwortet** → siehe ERLEDIGT-Sektion
- [x] Framework: Next.js 16 beibehalten ✅
- [x] Folder-Struktur: `/m/*` Routes + `/components/mobile` erstellt ✅

### 2026-02-13 ✅ **KRITISCH:** Initiale 2-3 Module für Mobile auswählen
- [x] Stakeholder-Entscheidung: 4 Kernmodule + Minimal-Statistik
- [x] Module dokumentiert: Due Cards, Review, Train Weak Words, Daily Phrases
- [x] **Rückfrage 4 beantwortet** → siehe ERLEDIGT-Sektion

### 2026-02-13 ☐ Login-Screen Button-Trennung implementieren
- [ ] Desktop-Version Button: Text anpassen, aktuelle Route beibehalten
- [ ] Mobile App Button: Neue Route/URL definieren + implementieren
- [ ] UI/UX: Visuelle Unterscheidung der Buttons (Icons, Farben)

### 2026-02-13 ✅ Security & Authentication für Mobile
- [x] **ENTSCHIEDEN:** Option C - Hybrid (Phase 1 wie Desktop, Phase 2 Biometric optional)
- [x] Session-Handling: 24h-Timeout mit Modal-Popup (wie Desktop)
- [x] Biometric Auth: **Phase 2** (später als optionales Feature)
- [x] Token Storage: localStorage (wie Desktop) ✅
- [x] Auto-Login: NEIN in Phase 1, später als optionale Biometric-Funktion
- [x] Auto-Logout: Modal-Popup "Session expired" (wie Desktop)
- [x] **Rückfrage 5 beantwortet** → siehe ERLEDIGT-Sektion

### 2026-02-13 ☐ Shared Components Inventory
- [ ] Liste erstellen: Welche Components sind 1:1 wiederverwendbar?
- [ ] Liste erstellen: Welche Components brauchen Mobile-Varianten?
- [ ] Naming Convention: `LoginPinDesktop.tsx` vs. `LoginPinMobile.tsx` vs. Shared `LoginPin.tsx`

### 2026-02-13 ☐ Navigation Pattern für Mobile
- [ ] Bottom Navigation vs. Hamburger Menu
- [ ] Zurück-Button Strategie (Browser-History vs. In-App)
- [ ] Deep-Linking: Wie funktioniert Direktzugriff auf Module?
- [ ] **Rückfrage 6 beantworten** (siehe unten)

### 2026-02-13 ☐ UX & Design Entscheidungen
- [ ] Glasmorphism-Design beibehalten oder vereinfachen?
- [ ] Language-Switcher Pattern (Dropdown vs. Swipe)
- [ ] On-Screen-Keyboard Strategy
- [ ] **Rückfragen 7, 8, 9 beantworten** (siehe unten)

### 2026-02-13 ☐ Data-Sync Strategie
- [ ] Offline-Modus: Welche Daten müssen gecacht werden?
- [ ] Sync-Logik: Wie werden Vocabulary-Progress, Performance-Stats synchronisiert?
- [ ] Conflict Resolution: Was passiert bei gleichzeitiger Desktop+Mobile Nutzung?
- [ ] **Rückfrage 10 beantworten** (siehe unten)

### 2026-02-13 ☐ Admin-Features auf Mobile
- [ ] Entscheiden: Admin-Backend auch auf Mobile verfügbar?
- [ ] Oder ist Mobile rein für Students gedacht?
- [ ] **Rückfrage 11 beantworten** (siehe unten)

---

## ⚡ IN ARBEIT

*(derzeit keine)*

---

## ✔ ERLEDIGT

### 2026-02-13 ✔ Projekt-Dokumentation erstellt
- [x] PROJECT_OVERVIEW.md analysiert (16 Kapitel)
- [x] TODO_OVERVIEW.md erstellt (8 Phasen dokumentiert)
- [x] LOGIC_OVERVIEW.md erstellt (13 Kapitel, 25 Module analysiert)
- [x] Bestehende Architektur dokumentiert (11,644 LOC, 188 React Hooks)

### 2026-02-13 ✔ Rückfrage 1 beantwortet: Routing-Strategie
- [x] **Entscheidung:** Route-basiert `/m/*` mit Device-Detection (Option 2)
- [x] **Begründung:** Schnellste Umsetzung, ein Deployment, maximale Code-Wiederverwendung
- [x] **Vorteil:** Automatischer Redirect, shared Session, einfaches Testing
- [x] **Technisch:** Next.js Middleware + User-Agent Detection

### 2026-02-13 ✔ Rückfrage 4 beantwortet: Initiale Module-Auswahl
- [x] **Entscheidung:** Custom-Kombination mit 4 Kernmodulen + Minimal-Statistik
- [x] **Module:**
  - a) **Due Cards today** (fällige Vokabeln anzeigen)
  - b) **Review Vocabulary** (Wiederholungs-Modus)
  - c) **Train weak words** (Schwache Wörter gezielt üben)
  - e) **Daily Phrases** (Tägliche Phrasen-Übung)
  - X) **Minimal Statistics** (oberer Screen-Rand: Streak, Due Count, Level) ✅ Implementiert
  - X1) **Detailed Statistics** (Tap-to-Expand, später implementieren) ✅ Grundgerüst fertig
- [x] **Bewusste Entscheidung:** Module sind noch nicht voll entwickelt → Step-by-Step Implementierung
- [x] **Status:** Daily Phrases muss neu entwickelt werden, andere Module basieren auf existierender VocabularyDialog-Logik

### 2026-02-13 ✔ Rückfrage 2+3 beantwortet: Tech-Stack & Framework
- [x] **Entscheidung:** Option A (Single Project) - alles in einem Next.js Projekt
- [x] **Begründung:** Zero Code-Duplikation, schnellste Umsetzung, ein Deployment
- [x] **Framework:** Next.js 16 beibehalten (keine Migration nötig)
- [x] **Build:** Keine Änderungen an package.json nötig
- [x] **Deployment:** Weiterhin ein Vercel-Projekt (Desktop + Mobile gleichzeitig)
- [x] **Vorteil:** Shared Contexts (AuthContext, LanguageContext), Shared Services (Supabase), Shared Types

### 2026-02-13 ✔ Rückfrage 5 beantwortet: Security & Authentication
- [x] **Entscheidung:** Option C - Hybrid (Phase 1: wie Desktop, Phase 2: Biometric optional)
- [x] **Phase 1 (JETZT):**
  - PIN-Login (4-Digit, wie Desktop)
  - 24h Session-Timeout (wie Desktop)
  - Token Storage: localStorage
  - Auto-Logout: Modal-Popup "Session expired"
  - Kein "Remember Me"
  - Keine Biometric Auth
- [x] **Phase 2 (später):**
  - Biometric Auth als **optionales Feature** (User aktiviert in Settings)
  - Face ID / Touch ID Support (WebAuthn API)
  - Fallback zu PIN bleibt verfügbar
  - Supabase Schema: `biometric_enabled`, `webauthn_credential_id`, `webauthn_public_key`
- [x] **Implementierung:** Keine Änderungen nötig für Phase 1 (Desktop-Logik funktioniert 1:1)
- [x] **Session-Persistenz:** localStorage (überdauert Tab-Closes auf Mobile)

---

## 📋 GEPLANTE TO-DOs (noch nicht priorisiert)

### Architektur & Setup
- [ ] Shared Module Strategy: Welche Module werden direkt importiert? (AuthContext, LanguageContext, useTranslation, etc.)
- [ ] API-Client Sharing: Supabase Client, RPC Functions, Rate Limiting
- [ ] State Management: Shared Contexts vs. Mobile-spezifische Stores
- [ ] TypeScript Config: Shared types, interfaces (User, LearningItem, etc.)

### Responsive & Mobile UX
- [ ] Mobile-First CSS Framework evaluieren (Tailwind optimieren vs. neue Library)
- [ ] Touch-Optimierung: Button-Größen (min 44x44px), Swipe-Gesten, Pull-to-Refresh
- [ ] Viewport-Strategie: Meta-Tags, Safe-Areas (iOS Notch)
- [ ] Offline-First Strategie: Service Worker, Cache-Strategie

### PWA Features
- [ ] Manifest.json erstellen (Icons 192x192 + 512x512, Theme-Colors, Display-Mode)
- [ ] Service Worker Strategie: Cache-First vs. Network-First
- [ ] Install-Prompt: Add to Homescreen Dialog (nach 2. Login?)
- [ ] Push-Notifications: Scope definieren (optional, z.B. Daily Streak Reminder)

### Build & Deployment
- [ ] Vercel/Netlify Config: Separate Deployment vs. Monorepo
- [ ] Environment Variables: Shared vs. Mobile-spezifisch
- [ ] CI/CD Pipeline: Build-Dependencies, Testing
- [ ] Domain-Setup: Subdomain vs. Path-based Routing

### Testing & Quality
- [ ] E2E Tests: Mobile-spezifische User-Flows (Cypress/Playwright)
- [ ] Responsive Testing: Viewport-Matrix (320px - 768px)
- [ ] Performance Budget: Bundle-Size (<200KB), LCP (<2.5s), FID (<100ms)
- [ ] Accessibility: Touch-Targets (min 44x44px), Screen-Reader, Contrast-Ratio

### Performance Optimierung
- [ ] Code-Splitting: Route-based Lazy Loading
- [ ] Image Optimization: WebP, Lazy-Loading, Responsive Images
- [ ] Bundle Analysis: webpack-bundle-analyzer, Lighthouse
- [ ] Critical CSS: Inline First-Paint CSS

---

## ❓ OFFENE FRAGEN (werden einzeln gestellt)

**Kritische Architektur-Entscheidungen:**
1. Routing-Strategie (Subdomain vs. Route vs. Device-Detection)
2. Monorepo vs. Separate Repository
3. Framework-Wahl (Next.js vs. leichteres Framework)
4. Initiale 2-3 Module-Auswahl
5. Biometric Auth (Face ID / Touch ID)
6. Navigation Pattern (Bottom Nav vs. Hamburger)
7. Design-Konsistenz (Glasmorphism beibehalten?)
8. Language-Switcher (Dropdown vs. Swipe)
9. On-Screen-Keyboard (Custom vs. Native)
10. Offline-Modus Scope
11. Admin-Features auf Mobile?

---

## 📊 METRIKEN & ERFOLGS-KRITERIEN

### Performance Targets (Mobile)
- **Bundle Size:** < 200KB (gzipped, first load)
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **Lighthouse Score:** > 90 (Performance, Accessibility, Best Practices, SEO)

### User Experience Targets
- **Touch Target Size:** Min 44x44px (Apple HIG, WCAG 2.1)
- **Viewport Support:** 320px - 768px (iPhone SE bis iPad Mini)
- **Offline Support:** Login + 1 Core Feature funktionsfähig offline
- **Install Rate:** > 20% nach 3. Login (PWA-Install)

### Code Quality Targets
- **Code Reuse:** > 80% Shared Code mit Desktop-Version
- **Type Coverage:** 100% TypeScript strict mode
- **Test Coverage:** > 70% (Unit + E2E)
- **Accessibility Score:** WCAG 2.1 Level AA compliant

---

## 🗓️ ZEITPLAN (Beispiel - nach Entscheidungen anpassbar)

### Sprint 1 (Woche 1-2): Foundation
- Architektur-Entscheidungen finalisieren
- Build-Setup + Shared Module Integration
- Login-Screen Mobile-Variante

### Sprint 2 (Woche 3-4): Core Features
- 2-3 ausgewählte Learning-Module implementieren
- Navigation + Routing
- PWA Basics (Manifest, Service Worker)

### Sprint 3 (Woche 5-6): Polish & Testing
- Offline-Modus
- Performance-Optimierung
- E2E Tests + Security Tests

### Sprint 4 (Woche 7-8): Deployment & Monitoring
- Production Deployment
- Analytics Integration
- User Feedback Loop

---

**Nächster Schritt:** Beantwortung der 11 kritischen Rückfragen (werden jetzt einzeln gestellt)
