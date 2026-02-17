# GitHub Actions Setup - Quick Guide

**Dauer:** 5 Minuten
**Ziel:** Performance Monitoring aktivieren

---

## 🚀 SCHRITT 1: Workflow hochladen (2 Min)

```bash
cd /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard

# File ist schon erstellt: .github/workflows/lighthouse.yml

# Commit & Push
git add .github/workflows/lighthouse.yml
git commit -m "ci: Add Lighthouse CI workflow for performance monitoring"
git push origin main
```

---

## 🔐 SCHRITT 2: GitHub Secrets hinzufügen (3 Min)

1. **Öffne GitHub:**
   - https://github.com/Globus69/GreekLlingual/settings/secrets/actions

2. **Klick "New repository secret"**

3. **Füge hinzu:**

   **Secret 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Deine Supabase URL (aus `.env.local`)

   **Secret 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Dein Supabase Anon Key (aus `.env.local`)

4. **Klick "Add secret"** für beide

---

## ✅ FERTIG!

Ab jetzt läuft Lighthouse CI bei jedem Push/PR automatisch! 🎉

**Test:**
```bash
git commit --allow-empty -m "test: Trigger Lighthouse CI"
git push origin main

# Dann auf GitHub:
# → Actions Tab → Sieh Lighthouse CI laufen
```

---

**Ende** ✅
