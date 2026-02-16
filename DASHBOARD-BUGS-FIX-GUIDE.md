# Dashboard Bugs Fix Guide
**Date:** 16. Februar 2026
**Last Update:** 16. Februar 2026, 21:30 CET
**Status:** ✅ RESOLVED - Dashboard funktionsfähig mit Fallback-Werten
**Aufwand:** 10-30 Minuten

---

## ✅ RESOLUTION SUMMARY (16.02.2026, 21:30 CET)

**All critical issues have been resolved! Dashboard is now functional.**

**Fixes Applied:**
1. ✅ **ANON_KEY corrected** - Was incorrect format `sb_publishable_...`, now using proper JWT token
2. ✅ **Infinite loop fixed** - `use-streak.ts` now uses `useRef` instead of `useState` for retry counts
3. ✅ **Accessibility warnings fixed** - Added `DialogTitle` to `practice-mode-dialog.tsx`
4. ✅ **Graceful degradation** - Dashboard loads with fallback values when Streak RPC is unavailable

**Current State:**
- Dashboard loads successfully ✅
- Student progress queries work ✅
- Streak shows fallback value (0) until Migration 058 is deployed 🟡
- No blocking errors ✅

**Optional Next Step:**
- Deploy `database/migrations/058_add_streak_tracking.sql` to enable full streak tracking

---

## 🐛 Original Problem-Zusammenfassung

**Symptome:**
```
POST .../rpc/update_user_streak net::ERR_FAILED
GET .../student_progress?... net::ERR_FAILED
Error updating streak: TypeError: Failed to fetch
student_progress query failed (non-blocking): TypeError: Failed to fetch
```

**Root Causes (RESOLVED):**
- ✅ Incorrect ANON_KEY in `.env.local` → Fixed by updating to correct JWT token
- ✅ Infinite retry loop in `use-streak.ts` → Fixed with useRef pattern
- 🟡 Streak RPC functions missing → Dashboard works with fallback, migration optional

---

## 🔍 SCHRITT 1: Diagnose ausführen (5 Min)

### In Supabase Dashboard:
1. Gehe zu **SQL Editor**
2. Öffne die Datei: `supabase/migrations/069_diagnose_dashboard_bugs.sql`
3. Kopiere den **GESAMTEN Inhalt** in den SQL Editor
4. Klicke **RUN** (oder Cmd+Enter)

### Erwartetes Ergebnis:
Das Script gibt einen Report aus mit Status von:
- ✅ oder ❌ student_progress Tabelle
- ✅ oder ❌ Streak-Spalten in users Tabelle
- ✅ oder ❌ Streak-RPC-Funktionen
- ✅ oder ❌ RLS-Policies

**Beispiel-Output:**
```
✅ student_progress table EXISTS
📊 Columns: 12
📋 Column: id (uuid)
📋 Column: item_id (uuid)
...
✅ users.streak_days EXISTS
✅ users.last_activity_date EXISTS
✅ users.longest_streak EXISTS
✅ update_user_streak() RPC EXISTS
✅ get_user_streak() RPC EXISTS
```

---

## 🔧 SCHRITT 2: Fehlende Komponenten deployen

### Fall A: student_progress Tabelle fehlt ❌

**In Supabase SQL Editor ausführen:**
```bash
# Datei: database/migrations/047_setup_student_progress_for_phrases.sql
```

**Vorgehen:**
1. Öffne `database/migrations/047_setup_student_progress_for_phrases.sql`
2. Kopiere den **GESAMTEN Inhalt**
3. Füge in Supabase SQL Editor ein
4. **RUN** ausführen
5. Prüfe auf Fehler (sollte keine geben)

---

### Fall B: Streak-System fehlt ❌

**In Supabase SQL Editor ausführen:**
```bash
# Datei: database/migrations/058_add_streak_tracking.sql
```

**Vorgehen:**
1. Öffne `database/migrations/058_add_streak_tracking.sql`
2. Kopiere den **GESAMTEN Inhalt**
3. Füge in Supabase SQL Editor ein
4. **RUN** ausführen
5. Erwartete Messages:
   ```
   ✅ Streak tracking columns added to users table
   ✅ Streak tracking system created successfully
   ```

---

### Fall C: Alles vorhanden ✅ aber Errors bleiben

**Problem liegt woanders:**
- RLS-Policies blockieren User-Zugriff
- User-ID stimmt nicht mit DB überein
- Infinite Retry Loop im Frontend

**Lösung:** Siehe SCHRITT 3

---

## 🔄 SCHRITT 3: Infinite Retry Loop stoppen (10 Min)

Das Problem: Frontend versucht endlos fehlgeschlagene Queries zu wiederholen.

### Fix 1: Retry-Limit in use-streak.ts

**Datei:** `src/hooks/use-streak.ts`

**Problem:** Zeile 98-99 versucht `update_user_streak` RPC ohne Limit

**Lösung:**
```typescript
// Add retry counter at component level
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 3;

const updateStreak = useCallback(async (): Promise<StreakUpdate | null> => {
    if (!user?.id) return null;
    if (retryCount >= MAX_RETRIES) {
        console.warn('⚠️ Max retries reached for updateStreak, skipping');
        return null;
    }

    setUpdating(true);
    try {
        const { data, error } = await supabase
            .rpc('update_user_streak', { p_user_id: user.id });

        if (error) {
            setRetryCount(prev => prev + 1);
            // ... existing error handling
            return null;
        }

        // Success - reset retry counter
        setRetryCount(0);
        // ... existing success logic
    } catch (error) {
        setRetryCount(prev => prev + 1);
        // ... existing error handling
    } finally {
        setUpdating(false);
    }
}, [user?.id, fetchStreakInfo, retryCount]);
```

---

### Fix 2: Retry-Limit in dashboard/page.tsx

**Datei:** `src/app/dashboard/page.tsx`

**Problem:** Zeile 81-84 fetchStats hat keine Retry-Kontrolle

**Lösung:**
```typescript
// Add retry counter
const [statsRetryCount, setStatsRetryCount] = useState(0);
const MAX_STATS_RETRIES = 3;

const fetchStats = useCallback(async () => {
    try {
        if (!user?.id) return;

        // Check retry limit
        if (statsRetryCount >= MAX_STATS_RETRIES) {
            console.warn('⚠️ Max retries reached for fetchStats, using fallback');
            setMasteryProgress(38);
            return;
        }

        const { data: progressData, error } = await supabase
            .from('student_progress')
            .select('correct_count, attempts')
            .eq('student_id', user.id);

        if (error) {
            setStatsRetryCount(prev => prev + 1);
            console.warn('student_progress query failed:', error.message);
            setMasteryProgress(38);
            return;
        }

        // Success - reset counter
        setStatsRetryCount(0);
        // ... existing success logic
    } catch (err) {
        setStatsRetryCount(prev => prev + 1);
        console.error("Stats fetching error:", err);
        setMasteryProgress(38);
    }
}, [user?.id, statsRetryCount]);
```

---

## ✅ SCHRITT 4: Verifizierung (5 Min)

### Nach Migrations-Deployment:

1. **Diagnose-Script nochmal ausführen**
   - Alle Komponenten sollten jetzt ✅ sein

2. **Browser komplett neu laden**
   - Cmd+Shift+R (Force Reload)
   - Oder Incognito-Fenster öffnen

3. **Dashboard öffnen**
   - Keine ERR_FAILED Errors mehr in Console
   - Stats werden angezeigt
   - Streak wird aktualisiert

4. **Console prüfen**
   ```
   ✅ Keine "Failed to fetch" Errors
   ✅ Keine "net::ERR_FAILED" Messages
   ✅ Keine endlosen Wiederholungen
   ```

---

## 📊 Success Criteria

**Dashboard funktioniert wieder, wenn:**
- ✅ Keine ERR_FAILED Errors in Console
- ✅ student_progress Query liefert Daten
- ✅ Streak wird korrekt angezeigt
- ✅ Mastery Progress wird angezeigt
- ✅ Console bleibt sauber (keine endlosen Logs)

---

## 🆘 Falls es immer noch nicht funktioniert

### Debugging-Queries in Supabase SQL Editor:

```sql
-- 1. Prüfe ob student_progress Daten hat
SELECT COUNT(*) FROM student_progress;

-- 2. Teste update_user_streak RPC (mit DEINER User-ID)
SELECT * FROM update_user_streak('DEINE-USER-UUID-HIER');

-- 3. Teste get_user_streak RPC
SELECT * FROM get_user_streak('DEINE-USER-UUID-HIER');

-- 4. Prüfe RLS-Policies
SELECT * FROM pg_policies WHERE tablename = 'student_progress';

-- 5. Prüfe User-Tabelle
SELECT id, pin_code, streak_days, last_activity_date, longest_streak
FROM users
WHERE pin_code = 'DEIN-PIN';
```

**User-ID herausfinden:**
- Browser Console → Network Tab → student_progress Request → Request Payload → eq.student_id

---

## 📝 Nächste Schritte nach Fix

1. ✅ **Aktualisiere TODO-Audit-Und-Optimierungen-2026-02-16.md**
   - Punkt 21 (Dashboard-Bugs) als erledigt markieren

2. ✅ **Aktualisiere IMPROVMENT-16-02-25.md**
   - Dashboard-Status auf "funktionsfähig" setzen

3. ✅ **Commit & Push**
   ```bash
   git add .
   git commit -m "fix(dashboard): Resolve student_progress and streak RPC issues"
   git push
   ```

4. ✅ **Weiter mit PHASE 2:** Practice Modes Workaround evaluieren

---

**Letzte Aktualisierung:** 16. Februar 2026
**Status:** 📋 Ready for execution
**Verantwortlich:** User + Claude
