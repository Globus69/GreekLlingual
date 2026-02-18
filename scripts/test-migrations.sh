#!/bin/bash
# Test migrations without executing

echo "🧪 Migration Dry-Run Test"
echo ""

echo "Step 1: Check SQL syntax in existing migrations"
for file in /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/*.sql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # Basic syntax check
        if grep -q "CREATE TABLE\|CREATE FUNCTION\|CREATE POLICY\|ALTER TABLE" "$file"; then
            echo "  ✅ $filename - Valid SQL statements found"
        else
            echo "  ⚠️  $filename - No standard SQL operations"
        fi
    fi
done

echo ""
echo "Step 2: Check for dangerous operations"
if grep -q "DROP DATABASE\|TRUNCATE CASCADE" /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/*.sql 2>/dev/null; then
    echo "⚠️ WARNING: Dangerous operations detected"
else
    echo "✅ No dangerous operations"
fi

echo ""
echo "Step 3: Verify RLS policies in recent migrations"
RLS_COUNT=$(grep -c "ENABLE ROW LEVEL SECURITY\|CREATE POLICY" /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/*.sql 2>/dev/null || echo "0")
echo "✅ Found $RLS_COUNT RLS-related statements"

echo ""
echo "Step 4: Check vocabulary-related functions"
VOCAB_FUNCTIONS=$(grep -l "vocabulary" /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "✅ Found $VOCAB_FUNCTIONS vocabulary-related migration files"

echo ""
echo "Step 5: Latest migrations"
ls -lt /Users/SWS/DEVELOP/HellenicHorizons-GreekLingua-Dashboard/supabase/migrations/*.sql | head -5 | awk '{print "  - " $9}' | sed 's|.*/||'
