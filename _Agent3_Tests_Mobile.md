# 🧪 AGENT 3: TESTS, PERFORMANCE, ACCESSIBILITY (MOBILE)

**Verantwortung:** Testing, Performance, A11y (Mobile-fokussiert)
**Status:** ✅ AKTIV
**Mobile-First:** ✅ VERBINDLICH

---

## 📋 VERANTWORTUNGSBEREICH

**Agent 3 ist zuständig für:**
- Unit Tests (Jest, React Testing Library)
- Integration Tests (API, Database, Components)
- E2E Tests (Playwright, mobile viewport)
- Performance Testing (Lighthouse Mobile, Core Web Vitals)
- Accessibility Testing (mobile screenreader, touch, contrast)
- Mobile-specific A11y (touch targets, focus management, gesture alternatives)
- Test Coverage (> 80% target)
- Performance Monitoring (Bundle size, Load time, FCP, LCP)

**NICHT zuständig für:**
- UI Implementation (→ Agent 1)
- Business Logic (→ Agent 2)

---

## ✅ BESTEHENDE TESTS

### **Current Test Status:**
- ⚠️ **Unit Tests:** Minimal (< 20% coverage)
- ⚠️ **Integration Tests:** Fehlen komplett
- ❌ **E2E Tests:** Nicht vorhanden
- ⚠️ **Performance Tests:** Lighthouse CI eingerichtet, aber nicht mobile-optimiert
- ❌ **A11y Tests:** Nicht vorhanden

**Fazit:** Testing-Infrastruktur vorhanden, aber Mobile-Tests fehlen komplett.

---

## ⚠️ FEHLENDE MOBILE-TESTS

### **Priority: HIGH**

#### **1. Practice Modes Mobile E2E Tests**
- **Needed:**
  - E2E Test für Matching Game (mobile viewport)
  - E2E Test für Multiple Choice (touch interactions)
  - E2E Test für Write Input (keyboard, IME)
  - Test auf verschiedenen Bildschirmgrößen (iPhone, Android)
  - Touch gesture testing (swipe, tap, long-press)
  - Offline-Mode testing
- **Tools:** Playwright (mobile emulation)
- **ETA:** 3-4h

#### **2. Vocabulary Mobile Tests**
- **Needed:**
  - Unit Tests für FSRS logic (mobile-specific edge cases)
  - Integration Tests für Card Fetching (pagination)
  - E2E Tests für Card Review Flow (swipe gestures)
  - Test offline caching (IndexedDB)
  - Test auto-sync when online
- **ETA:** 2-3h

#### **3. Mobile Performance Testing**
- **Needed:**
  - Lighthouse Mobile Score (target: > 90)
  - Core Web Vitals (FCP < 1.8s, LCP < 2.5s, CLS < 0.1)
  - Bundle Size Testing (target: < 200KB initial)
  - Image optimization verification
  - Service Worker testing
- **Tools:** Lighthouse CI, WebPageTest (mobile)
- **ETA:** 2h

#### **4. Mobile Accessibility Testing**
- **Needed:**
  - Touch target size testing (min 44x44px)
  - Screen reader testing (VoiceOver iOS, TalkBack Android)
  - Keyboard navigation (mobile keyboards)
  - Color contrast testing (WCAG AA mobile)
  - Focus management (touch vs keyboard)
  - Reduced motion support
- **Tools:** axe-core, Lighthouse A11y, manual testing
- **ETA:** 3h

### **Priority: MEDIUM**

#### **5. Integration Tests (Mobile-specific)**
- **Needed:**
  - API integration tests (mobile network conditions)
  - Database integration tests (offline sync)
  - Component integration tests (Bottom Sheets, Navigation)
- **ETA:** 2-3h

#### **6. Visual Regression Testing**
- **Needed:**
  - Screenshot tests für mobile viewport
  - Detect UI changes (Percy, Chromatic)
  - Test verschiedene Geräte (iPhone 12, 14, Android)
- **ETA:** 2h

---

## 🧪 MOBILE TEST-STRATEGIE

### **1. Unit Tests (Jest + RTL):**
```typescript
// ✅ GOOD: Mobile-specific test
test('touch target is at least 44x44px', () => {
  const button = screen.getByRole('button');
  expect(button).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
});

// ✅ GOOD: Test mobile breakpoints
test('shows 2-column grid on mobile', () => {
  window.innerWidth = 375; // iPhone width
  render(<MobileGrid />);
  const grid = screen.getByTestId('grid');
  expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(2, 1fr)' });
});
```

### **2. E2E Tests (Playwright):**
```typescript
// ✅ GOOD: Mobile viewport
test.use({
  viewport: { width: 375, height: 667 }, // iPhone SE
  isMobile: true,
  hasTouch: true
});

test('swipe gesture works on mobile', async ({ page }) => {
  await page.goto('/m/vocabulary');
  const card = page.locator('[data-testid="vocab-card"]');
  await card.swipe({ direction: 'left' });
  await expect(page.locator('[data-testid="next-card"]')).toBeVisible();
});
```

### **3. Performance Tests (Lighthouse):**
```javascript
// ✅ GOOD: Mobile performance
const config = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    screenEmulation: { mobile: true },
    throttling: {
      rttMs: 150,
      throughputKbps: 1.6 * 1024,
      cpuSlowdownMultiplier: 4
    }
  }
};
```

### **4. A11y Tests (axe-core):**
```typescript
// ✅ GOOD: Touch target testing
test('all interactive elements have min 44x44px', async () => {
  const results = await axe.run({
    rules: { 'touch-target-size': { enabled: true } }
  });
  expect(results.violations).toHaveLength(0);
});
```

---

## 📊 MOBILE PERFORMANCE TARGETS

### **Lighthouse Mobile Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### **Core Web Vitals:**
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **FID** (First Input Delay): < 100ms
- **TTI** (Time to Interactive): < 3.8s

### **Bundle Size:**
- Initial Bundle: < 200KB (gzipped)
- Total Bundle: < 500KB
- Images: WebP, lazy loaded
- Fonts: System fonts (no external fonts)

### **Network:**
- Works on 3G (slow network)
- Offline support via Service Worker
- Auto-sync when online

---

## ♿ MOBILE ACCESSIBILITY CHECKLIST

### **Touch Targets:**
- [ ] All buttons ≥ 44x44px
- [ ] All links ≥ 44x44px
- [ ] Spacing between targets ≥ 8px

### **Screen Readers:**
- [ ] VoiceOver (iOS) tested
- [ ] TalkBack (Android) tested
- [ ] All images have alt text
- [ ] ARIA labels for icons

### **Keyboard Navigation:**
- [ ] Tab order is logical
- [ ] Focus visible on all elements
- [ ] Mobile keyboards supported (IME)

### **Visual:**
- [ ] Contrast ratio ≥ 4.5:1 (text)
- [ ] Contrast ratio ≥ 3:1 (UI components)
- [ ] Text size ≥ 14px (readable on mobile)

### **Motion:**
- [ ] Respect `prefers-reduced-motion`
- [ ] No auto-playing animations
- [ ] Smooth scroll optional

---

## 📝 ÄNDERUNGS-LOG

### **17. Februar 2026 - Mobile-First aktiviert**
**Agent:** Agent 3
**Bereich:** Strategy
**Änderungen:**
- ✅ Mobile-First-Strategie aktiviert
- ✅ Agent 3 Verantwortungsbereich definiert
- ✅ Fehlende Mobile-Tests identifiziert
- ✅ Test-Strategie & Targets dokumentiert
**Status:** ✅ Complete

---

**Nächste Aufgaben:**
1. Practice Modes Mobile E2E Tests implementieren
2. Mobile Performance Testing (Lighthouse)
3. Mobile Accessibility Audit & Fixes

**Status:** Bereit für Testing 🧪
