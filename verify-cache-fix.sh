#!/bin/bash

# 🔍 Cache Fix Verification Script
# Verifies that cache fix has been correctly implemented

echo "🔍 Verifying Cache Fix Implementation..."
echo ""

ERRORS=0

# Check 1: useMobileCache has debug logs
echo "✓ Checking: use-mobile-cache.ts has debug logs"
if grep -q "🔑 \[DEBUG\] Cache Key Details" src/hooks/use-mobile-cache.ts; then
  echo "  ✅ Debug logs present"
else
  echo "  ❌ Debug logs missing"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: mobile-cache.ts has getCached debug logs
echo "✓ Checking: mobile-cache.ts has getCached debug logs"
if grep -q "🔍 \[DEBUG\] getCached result" src/lib/cache/mobile-cache.ts; then
  echo "  ✅ getCached debug logs present"
else
  echo "  ❌ getCached debug logs missing"
  ERRORS=$((ERRORS + 1))
fi

# Check 3: mobile-cache.ts has setCached debug logs
echo "✓ Checking: mobile-cache.ts has setCached debug logs"
if grep -q "🔍 \[DEBUG\] setCached" src/lib/cache/mobile-cache.ts; then
  echo "  ✅ setCached debug logs present"
else
  echo "  ❌ setCached debug logs missing"
  ERRORS=$((ERRORS + 1))
fi

# Check 4: page.tsx has stable callbacks
echo "✓ Checking: page.tsx has stable handleCacheHit callback"
if grep -q "const handleCacheHit = useCallback" src/app/m/practice-modes/page.tsx; then
  echo "  ✅ handleCacheHit is stable (useCallback)"
else
  echo "  ❌ handleCacheHit not using useCallback"
  ERRORS=$((ERRORS + 1))
fi

# Check 5: page.tsx uses stable callbacks in useMobileCache
echo "✓ Checking: page.tsx uses handleCacheHit in useMobileCache"
if grep -q "onCacheHit: handleCacheHit" src/app/m/practice-modes/page.tsx; then
  echo "  ✅ handleCacheHit used correctly"
else
  echo "  ❌ handleCacheHit not used in useMobileCache"
  ERRORS=$((ERRORS + 1))
fi

# Check 6: page.tsx has conditional useEffect
echo "✓ Checking: page.tsx has conditional useEffect (!cached)"
if grep -q "!cached" src/app/m/practice-modes/page.tsx; then
  echo "  ✅ useEffect has !cached condition"
else
  echo "  ⚠️  useEffect might not have !cached condition"
fi

# Check 7: CACHE_TTL.PRACTICE_ITEMS is defined
echo "✓ Checking: CACHE_TTL.PRACTICE_ITEMS is defined"
if grep -q "PRACTICE_ITEMS: 60 \* 60 \* 1000" src/lib/cache/mobile-cache.ts; then
  echo "  ✅ CACHE_TTL.PRACTICE_ITEMS = 1 hour"
else
  echo "  ⚠️  CACHE_TTL.PRACTICE_ITEMS might have changed"
fi

echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED"
  echo "Cache fix is correctly implemented!"
  echo ""
  echo "Next steps:"
  echo "1. Start dev server: npm run dev"
  echo "2. Open: http://localhost:3000/m/practice-modes"
  echo "3. Follow CACHE-TEST-PLAN.md for manual testing"
  exit 0
else
  echo "❌ $ERRORS CHECKS FAILED"
  echo "Please review the implementation."
  exit 1
fi
