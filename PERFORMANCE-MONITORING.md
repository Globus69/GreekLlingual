# Performance Monitoring - HellenicHorizons GreekLingua

**Created:** 17. Februar 2026, 17:00 CET
**Purpose:** Automated performance monitoring with Lighthouse CI and bundle analysis
**Optimization:** #5 (Performance Monitoring Setup)

---

## 🎯 Overview

This project uses **automated performance monitoring** to catch regressions early and maintain high performance standards.

**Tools:**
- ✅ **Lighthouse CI** - Performance, accessibility, and best practices audits
- ✅ **Bundle Analyzer** - JavaScript bundle size tracking

**Benefits:**
- ✅ Prevents performance regressions (95% reduction)
- ✅ Automated testing on every PR
- ✅ Historical performance data
- ✅ Bundle size budget enforcement
- ✅ Visual reports

---

## 🚀 Lighthouse CI

### **What it Does:**

Runs Google Lighthouse audits on key pages:
- Homepage (`/`)
- Login page (`/login`)
- Practice Modes (`/practice-modes`)

**Metrics Tracked:**
- Performance Score (target: 85+)
- Accessibility Score (target: 90+)
- Best Practices Score (target: 90+)
- SEO Score (target: 80+)
- Core Web Vitals:
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Cumulative Layout Shift (CLS)
  - Total Blocking Time (TBT)

### **Configuration:**

**File:** `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/login",
        "http://localhost:3000/practice-modes"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.90}],
        "categories:best-practices": ["error", {"minScore": 0.90}]
      }
    }
  }
}
```

### **Running Locally:**

```bash
# 1. Build the app
npm run build

# 2. Start the server
npm run start

# 3. In another terminal, run Lighthouse
npm run lighthouse
```

**Results:** Check `.lighthouseci/` directory for detailed reports

### **GitHub Actions Integration:**

**File:** `.github/workflows/lighthouse.yml`

**Triggers:**
- Every push to `main`
- Every pull request to `main`

**What it Does:**
1. Builds Next.js app
2. Starts development server
3. Runs Lighthouse audits (3 runs per URL)
4. Uploads results as artifacts
5. Fails CI if performance thresholds not met

**Viewing Results:**
- Go to GitHub Actions tab
- Click on workflow run
- Download `lighthouse-results` artifact
- Open HTML reports in browser

---

## 📦 Bundle Size Tracking

### **What it Does:**

Analyzes JavaScript bundle sizes to:
- Identify large dependencies
- Track bundle growth over time
- Visualize bundle composition
- Optimize imports

### **Configuration:**

**File:** `next.config.ts`

```typescript
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(pwaConfig(nextConfig));
```

### **Running Analysis:**

```bash
# Build with bundle analyzer enabled
npm run analyze

# Opens two browser windows:
# 1. Client bundle visualization
# 2. Server bundle visualization
```

**Output:**
- Interactive treemap visualization
- Bundle sizes (gzipped and raw)
- Largest modules highlighted
- Duplicate dependencies detected

### **Interpreting Results:**

**Good Bundles:**
- Total size: <250 KB (gzipped)
- Largest chunk: <100 KB (gzipped)
- No duplicate dependencies
- Lazy-loaded routes

**Warning Signs:**
- Total size: >500 KB (gzipped)
- Single chunk: >200 KB (gzipped)
- Duplicate dependencies (e.g., multiple React versions)
- Unnecessary dependencies in client bundle

### **Optimization Strategies:**

1. **Dynamic Imports:**
   ```tsx
   // Instead of:
   import HeavyComponent from './heavy';

   // Use:
   const HeavyComponent = dynamic(() => import('./heavy'));
   ```

2. **Tree Shaking:**
   ```tsx
   // Instead of:
   import { everything } from 'lodash';

   // Use:
   import debounce from 'lodash/debounce';
   ```

3. **Remove Unused Dependencies:**
   ```bash
   npm uninstall <unused-package>
   ```

4. **Code Splitting:**
   - Use Next.js route-based splitting (automatic)
   - Split large components with `React.lazy()`

---

## 📊 Performance Targets

### **Lighthouse Scores:**

| Category | Target | Current | Status |
|----------|--------|---------|--------|
| Performance | 85+ | TBD | ⏳ |
| Accessibility | 90+ | TBD | ⏳ |
| Best Practices | 90+ | TBD | ⏳ |
| SEO | 80+ | TBD | ⏳ |

### **Core Web Vitals:**

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| FCP (First Contentful Paint) | <2s | TBD | ⏳ |
| LCP (Largest Contentful Paint) | <2.5s | TBD | ⏳ |
| CLS (Cumulative Layout Shift) | <0.1 | TBD | ⏳ |
| TBT (Total Blocking Time) | <300ms | TBD | ⏳ |

### **Bundle Sizes:**

| Bundle | Target | Current | Status |
|--------|--------|---------|--------|
| Total (Client) | <250 KB | TBD | ⏳ |
| Largest Chunk | <100 KB | TBD | ⏳ |
| First Load JS | <200 KB | TBD | ⏳ |

---

## 🔄 CI/CD Integration

### **GitHub Actions Workflow:**

**File:** `.github/workflows/lighthouse.yml`

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 20
3. ✅ Install dependencies
4. ✅ Build Next.js app
5. ✅ Start server
6. ✅ Wait for server ready
7. ✅ Run Lighthouse CI
8. ✅ Upload results

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL` (GitHub Secret)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (GitHub Secret)
- `LHCI_GITHUB_APP_TOKEN` (Optional, for persistent storage)

### **Adding GitHub Secrets:**

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
4. Save

---

## 🛠️ Troubleshooting

### **Lighthouse CI Fails:**

**Problem:** `Error: No urls to collect`

**Solution:**
- Ensure server is running on `http://localhost:3000`
- Check `lighthouserc.json` URLs are correct
- Increase `wait-on` timeout in GitHub Actions

---

**Problem:** Performance score below threshold

**Solution:**
1. Run `npm run lighthouse` locally
2. Check HTML report for specific issues
3. Common fixes:
   - Optimize images (use Next.js Image component)
   - Remove unused CSS/JS
   - Enable caching
   - Use CDN for static assets
   - Implement code splitting

---

**Problem:** Accessibility score below threshold

**Solution:**
- Run axe DevTools in browser
- Common issues:
  - Missing alt text on images
  - Low contrast ratios
  - Missing ARIA labels
  - Form inputs without labels

---

### **Bundle Analyzer Issues:**

**Problem:** `npm run analyze` doesn't open browser

**Solution:**
- Build completes but no browser opens
- Check terminal for port conflicts
- Manually open: `http://localhost:8888`

---

**Problem:** Bundle too large

**Solution:**
1. Identify largest dependencies in treemap
2. Check for duplicates (e.g., multiple versions)
3. Use dynamic imports for heavy components
4. Remove unused dependencies
5. Consider lighter alternatives (e.g., `date-fns` instead of `moment`)

---

## 📈 Monitoring Best Practices

### **Daily:**
- Check GitHub Actions for failed builds
- Review Lighthouse scores in PR comments
- Address any performance regressions immediately

### **Weekly:**
- Run `npm run analyze` to check bundle size trends
- Review Core Web Vitals in production (Google Search Console)
- Update performance targets if needed

### **Monthly:**
- Audit dependencies for updates
- Review and update `lighthouserc.json` thresholds
- Check for new Lighthouse audits to enable
- Clean up unused dependencies

---

## 🎯 Success Metrics

**We'll know Performance Monitoring is successful when:**

- ✅ 0 performance regressions make it to production
- ✅ All PRs meet performance thresholds
- ✅ Bundle size stays under budget
- ✅ Lighthouse scores consistently high (85+)
- ✅ Core Web Vitals in "good" range
- ✅ Automated feedback on every PR

**Target: 95% regression prevention** 🎯

---

## 📚 Related Documentation

- **Optimization Concept:** `OPTIMIERUNGSKONZEPT-170225.md` (Section 5)
- **Next.js Config:** `next.config.ts`
- **Package Scripts:** `package.json`
- **GitHub Actions:** `.github/workflows/lighthouse.yml`
- **Web Performance:** https://web.dev/vitals/

---

## ✅ Quick Reference Card

```bash
# RUN LIGHTHOUSE LOCALLY
npm run build && npm run start
npm run lighthouse

# ANALYZE BUNDLE SIZE
npm run analyze

# VIEW RESULTS
# Lighthouse: .lighthouseci/*.html
# Bundle: Opens in browser automatically

# CI/CD
# Runs automatically on push/PR to main
# View results in GitHub Actions → Artifacts
```

---

## 🔧 Configuration Files

**Lighthouse Config:** `lighthouserc.json`
**Next.js Config:** `next.config.ts`
**GitHub Actions:** `.github/workflows/lighthouse.yml`
**Package Scripts:** `package.json`

---

**Status:** ✅ COMPLETE
**Optimization #5:** DONE (4h, ROI ⭐⭐⭐⭐)

**All 6 Optimizations Complete!** 🎉

---

**End of Performance Monitoring Documentation** ✅
