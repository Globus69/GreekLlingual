#!/bin/bash
# Comprehensive system health check

PROJECT_DIR="/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard"
cd "$PROJECT_DIR" || exit 1

echo "🏥 Comprehensive System Health Check"
echo "======================================"
echo ""

# 1. Environment Check
echo "1️⃣  Environment Configuration"
echo "─────────────────────────────"
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "SUPABASE_URL" .env.local; then
        echo "✅ Supabase configured"
    fi
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ Anon key configured"
    fi
else
    echo "❌ .env.local missing"
fi
echo ""

# 2. Database Migrations
echo "2️⃣  Database Migrations"
echo "─────────────────────────"
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "📊 Total migrations: $MIGRATION_COUNT"
LATEST=$(ls -t supabase/migrations/*.sql 2>/dev/null | head -1 | xargs basename)
echo "📌 Latest migration: $LATEST"
echo ""

# 3. Application Structure
echo "3️⃣  Application Structure"
echo "─────────────────────────"
KEY_DIRS=(
    "src/app/admin/vocab"
    "src/app/api/admin/vocab"
    "src/app/m"
    "src/components"
    "public/templates"
)

for dir in "${KEY_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FILE_COUNT=$(find "$dir" -type f | wc -l)
        echo "✅ $dir ($FILE_COUNT files)"
    else
        echo "❌ $dir missing"
    fi
done
echo ""

# 4. Dependencies
echo "4️⃣  Dependencies"
echo "─────────────────"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    DEP_COUNT=$(grep -c "\"@" package.json || echo "0")
    echo "📦 ~$DEP_COUNT dependencies"
fi
if [ -d "node_modules" ]; then
    echo "✅ node_modules installed"
else
    echo "⚠️ node_modules not found - run npm install"
fi
echo ""

# 5. Build Artifacts
echo "5️⃣  Build Artifacts"
echo "──────────────────"
if [ -d ".next" ]; then
    echo "✅ .next directory exists"
    BUILD_SIZE=$(du -sh .next 2>/dev/null | awk '{print $1}')
    echo "📊 Build size: $BUILD_SIZE"
else
    echo "⚠️ No build artifacts - run npm run build"
fi
echo ""

# 6. TypeScript Configuration
echo "6️⃣  TypeScript Configuration"
echo "────────────────────────────"
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
fi
if [ -f "next.config.js" ]; then
    echo "✅ next.config.js exists"
fi
echo ""

# 7. Git Status
echo "7️⃣  Git Status"
echo "─────────────"
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "🌿 Current branch: $BRANCH"
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
echo "📝 Uncommitted changes: $UNCOMMITTED files"
echo ""

# 8. Documentation
echo "8️⃣  Documentation"
echo "────────────────"
DOCS=(
    "README.md"
    "START.md"
    "CLAUDE.md"
    "MOBILE-FIRST-STRATEGY.md"
    "TESTING-CHECKLIST.md"
    "MIGRATION-EXECUTION-GUIDE.md"
    "FINAL-TESTING-REPORT.md"
)

DOC_COUNT=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        ((DOC_COUNT++))
    fi
done
echo "✅ $DOC_COUNT/$((${#DOCS[@]})) key docs present"
echo ""

# 9. Testing Scripts
echo "9️⃣  Testing Scripts"
echo "──────────────────"
if [ -f "scripts/test-migrations.sh" ]; then
    echo "✅ test-migrations.sh"
fi
if [ -f "scripts/smoke-test.sh" ]; then
    echo "✅ smoke-test.sh"
fi
if [ -f "scripts/comprehensive-check.sh" ]; then
    echo "✅ comprehensive-check.sh"
fi
echo ""

# 10. Overall Health Score
echo "🎯 Overall Health Score"
echo "─────────────────────────"

SCORE=0
[ -f ".env.local" ] && ((SCORE+=10))
[ $MIGRATION_COUNT -gt 0 ] && ((SCORE+=10))
[ -d "src/app/admin/vocab" ] && ((SCORE+=10))
[ -d "node_modules" ] && ((SCORE+=10))
[ -f "package.json" ] && ((SCORE+=10))
[ -f "tsconfig.json" ] && ((SCORE+=10))
[ -f "TESTING-CHECKLIST.md" ] && ((SCORE+=10))
[ -f "scripts/test-migrations.sh" ] && ((SCORE+=10))
[ -f "scripts/smoke-test.sh" ] && ((SCORE+=10))
[ $DOC_COUNT -ge 5 ] && ((SCORE+=10))

echo "Score: $SCORE/100"
if [ $SCORE -ge 90 ]; then
    echo "Status: ✅ EXCELLENT"
elif [ $SCORE -ge 70 ]; then
    echo "Status: ✅ GOOD"
elif [ $SCORE -ge 50 ]; then
    echo "Status: ⚠️ FAIR"
else
    echo "Status: ❌ NEEDS ATTENTION"
fi

echo ""
echo "🎉 Health Check Complete"
echo ""
echo "Next steps:"
echo "  - Review FINAL-TESTING-REPORT.md"
echo "  - Execute TESTING-CHECKLIST.md"
echo "  - Run: npm run dev (to start development)"
echo "  - Run: npm run build (to test production build)"
