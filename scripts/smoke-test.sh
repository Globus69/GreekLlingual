#!/bin/bash
# Basic smoke tests for vocabulary system

echo "🧪 Running Smoke Tests..."
echo ""

PROJECT_DIR="/Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard"

# Test 1: Check TypeScript compilation
echo "Test 1: TypeScript Compilation"
cd "$PROJECT_DIR" || exit 1
if npx tsc --noEmit --project tsconfig.json 2>&1 | grep -q "error TS"; then
    echo "❌ TypeScript errors found"
    npx tsc --noEmit --project tsconfig.json 2>&1 | grep "error TS" | head -5
else
    echo "✅ TypeScript compilation passed"
fi

# Test 2: Check ESLint
echo ""
echo "Test 2: ESLint Check"
if npx eslint src --ext .ts,.tsx --max-warnings 100 --quiet 2>&1; then
    echo "✅ ESLint check passed"
else
    echo "⚠️ ESLint warnings/errors found"
fi

# Test 3: Check routes exist
echo ""
echo "Test 3: Route Files"
ROUTES=(
    "src/app/admin/vocab/page.tsx"
    "src/app/api/admin/vocab/route.ts"
    "src/app/api/admin/vocab/import/route.ts"
    "src/app/m/page.tsx"
    "src/app/m/practice/page.tsx"
)

for route in "${ROUTES[@]}"; do
    if [ -f "$PROJECT_DIR/$route" ]; then
        echo "✅ $route"
    else
        echo "❌ $route missing"
    fi
done

# Test 4: CSV templates exist
echo ""
echo "Test 4: CSV Templates"
TEMPLATES=(
    "public/templates/Vorlage-Vokabeln-Vollständig.csv"
    "public/templates/Import-Vokabeln-A1-Vollständig.csv"
)

for template in "${TEMPLATES[@]}"; do
    if [ -f "$PROJECT_DIR/$template" ]; then
        SIZE=$(wc -c < "$PROJECT_DIR/$template")
        echo "✅ $template ($SIZE bytes)"
    else
        echo "❌ $template missing"
    fi
done

# Test 5: Check package.json scripts
echo ""
echo "Test 5: Package Scripts"
if grep -q "\"build\":" "$PROJECT_DIR/package.json"; then
    echo "✅ Build script defined"
else
    echo "❌ Build script missing"
fi

if grep -q "\"dev\":" "$PROJECT_DIR/package.json"; then
    echo "✅ Dev script defined"
else
    echo "❌ Dev script missing"
fi

# Test 6: Check environment variables
echo ""
echo "Test 6: Environment Configuration"
if [ -f "$PROJECT_DIR/.env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "SUPABASE_URL" "$PROJECT_DIR/.env.local"; then
        echo "✅ Supabase URL configured"
    else
        echo "⚠️ Supabase URL not found"
    fi
else
    echo "❌ .env.local missing"
fi

# Test 7: Database migrations exist
echo ""
echo "Test 7: Database Migrations"
MIGRATION_COUNT=$(ls -1 "$PROJECT_DIR/supabase/migrations/"*.sql 2>/dev/null | wc -l)
echo "✅ Found $MIGRATION_COUNT migration files"

echo ""
echo "🎉 Smoke Tests Complete"
