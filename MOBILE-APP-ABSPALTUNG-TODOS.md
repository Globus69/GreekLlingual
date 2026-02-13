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

### 2026-02-13 ✅ Navigation Pattern für Mobile
- [x] **ENTSCHIEDEN:** Hybrid (Dashboard + Bottom Nav: Home, Stats, Settings)
- [x] Bottom Navigation implementiert (3 Tabs: 🏠 Home | 📊 Stats | ⚙️ Settings)
- [x] Mobile Layout erstellt (src/app/m/layout.tsx) ✅
- [x] MobileBottomNav Component (src/components/mobile/MobileBottomNav.tsx) ✅
- [x] Stats-Seite erstellt (src/app/m/stats/page.tsx) ✅
- [x] Settings-Seite erstellt (src/app/m/settings/page.tsx) ✅
- [x] **Rückfrage 6 beantwortet** → siehe ERLEDIGT-Sektion

### 2026-02-13 ✅ UX & Design Entscheidungen (ABGESCHLOSSEN)
- [x] **Rückfrage 7:** Glasmorphism-Design → **Option A (beibehalten)** ✅
  - Konsistenz mit Desktop
  - Modernes Aussehen
  - Migration zu Option C (Hybrid) bei Bedarf trivial (nur CSS)
- [x] **Rückfrage 8:** Language-Switcher Pattern → **Option E (Auto-Detect + Manual Override)** ✅
  - **Auto-Detection beim Login:** `users.preferred_locale` wird aus DB geladen
  - **Fallback:** Englisch (wenn NULL)
  - **Manual Override:** Language-Switcher in Settings bleibt (User kann überschreiben)
  - **Implementiert:** `syncLocaleFromUser()` in login-pin/page.tsx ✅
  - **Admin-Control:** Lehrer setzt Sprache pro Schüler im Backend
  - **Zero UI-Clutter:** Kein Language-Button im Dashboard nötig
- [x] **Rückfrage 9:** On-Screen-Keyboard Strategy → **Option B (Native Keyboard)** ✅
  - **Native Mobile-Keyboard** (type="tel", inputMode="numeric")
  - **Begründung:** Standard-UX, schnellste Eingabe, mehr Screen-Platz
  - **Implementierung:** Trivial (input-Attribute ändern)
  - **Accessibility:** System-Keyboard hat Screen-Reader Support
  - **Real-World-Pattern:** Banking-Apps, Authenticator-Apps nutzen das auch

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

### 2026-02-13 ✔ Rückfrage 6 beantwortet: Navigation Pattern
- [x] **Entscheidung:** Hybrid (Dashboard + Bottom Nav: Home, Stats, Settings)
- [x] **Begründung:**
  - Dashboard bleibt Einstiegspunkt (4 Modul-Karten wie jetzt)
  - Bottom Nav für Meta-Features (Stats, Settings)
  - Flexible Erweiterung (neue Module = neue Dashboard-Karte)
  - Beste Balance zwischen Direktzugriff und UI-Klarheit
- [x] **Bottom Navigation (3 Tabs):**
  - 🏠 Home → Dashboard mit 4 Modul-Karten
  - 📊 Stats → Detaillierte Statistiken (Streak, Progress, Weekly Chart)
  - ⚙️ Settings → Sprache, Account-Info, Logout
- [x] **Implementiert:**
  - ✅ MobileBottomNav Component (src/components/mobile/MobileBottomNav.tsx)
  - ✅ Mobile Layout mit Fixed Bottom Nav (src/app/m/layout.tsx)
  - ✅ Stats Page (src/app/m/stats/page.tsx) - Vollständig
  - ✅ Settings Page (src/app/m/settings/page.tsx) - Vollständig
  - ✅ Active Tab Indication (Blue highlight + indicator bar)
  - ✅ Touch-optimized (44x44px minimum touch targets)

### 2026-02-13 ✔ Rückfrage 7 beantwortet: Glasmorphism-Design
- [x] **Entscheidung:** Option A - Glasmorphism beibehalten (wie Desktop)
- [x] **Begründung:**
  - Konsistenz mit Desktop-Version
  - Modernes Aussehen (iOS/Android High-End Apps nutzen das auch)
  - Performance-Test auf älteren Geräten geplant
  - Migration zu Option C (Hybrid) bei Bedarf trivial (nur CSS-Änderung, 5-10 Min.)
- [x] **Aktueller Stand:** Bereits implementiert in Stats, Settings, Dashboard
- [x] **Fallback-Plan:** Bei Performance-Problemen → `backdrop-blur-md` entfernen

### 2026-02-13 ✔ Rückfrage 8 beantwortet: Language-Switcher Pattern
- [x] **Entscheidung:** Option E - Auto-Detect + Manual Override (User-Idee ⭐)
- [x] **Begründung:**
  - **Beste Lösung:** Lehrer setzt Sprache pro Schüler im Admin-Backend
  - **Zero UI-Clutter:** Kein Language-Button im Dashboard nötig
  - **Auto-Detection:** `users.preferred_locale` wird beim Login aus DB geladen
  - **Fallback:** Englisch (wenn `preferred_locale` NULL)
  - **Manual Override:** Language-Switcher in Settings bleibt (falls User ändern will)
  - **Standard-Pattern:** Netflix, Spotify, etc. machen das auch so
- [x] **Implementiert:**
  - ✅ RPC `verify_user_4digit_pin` gibt `user_preferred_locale` zurück
  - ✅ `syncLocaleFromUser()` in login-pin/page.tsx aufgerufen ✅
  - ✅ LanguageContext synchronisiert UI automatisch ✅
  - ✅ Language-Switcher in Settings bleibt (4 Flag-Buttons)
  - ✅ Änderungen werden in DB persistiert (RPC `update_user_locale`)
- [x] **User-Flow:**
  1. Schüler loggt ein → Sprache automatisch gesetzt
  2. Falls falsch → Settings → Language → manuell ändern
  3. Nächster Login → neue Sprache automatisch geladen

### 2026-02-13 ✔ Rückfrage 9 beantwortet: On-Screen-Keyboard Strategy
- [x] **Entscheidung:** Option B - Native Mobile-Keyboard (type="tel")
- [x] **Begründung:**
  - **Standard Mobile-UX:** Banking-Apps, Authenticator-Apps nutzen das auch
  - **Schnellste Eingabe:** Haptic Feedback, Auto-Suggest (iOS)
  - **Mehr Screen-Platz:** Keyboard überlagert nur wenn aktiv (nicht permanent)
  - **Accessibility:** System-Keyboard hat Screen-Reader, Voice-Input Support
  - **Einfachste Implementierung:** 5 Zeilen Code (input-Attribute)
- [x] **Implementierung (später):**
  - `<input type="tel" inputMode="numeric" pattern="[0-9]{4}" />`
  - Custom On-Screen-Keyboard auf Mobile deaktivieren
  - Focus-Management für Auto-Advance zwischen Digits
- [x] **Real-World-Pattern:** N26, Revolut, Google Authenticator, Duolingo

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
