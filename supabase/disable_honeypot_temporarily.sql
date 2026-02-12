-- ============================================================
-- Honeypot temporär deaktivieren (für Testing)
-- ============================================================
-- Entfernt 9999 aus der Honeypot-Liste (für Testzwecke)
-- WICHTIG: Nur im DEV-Environment verwenden!
-- ============================================================

-- ── 1. Zeige alle Honeypot-PINs (vor dem Löschen) ──────────
SELECT
    '🍯 Aktuell registrierte Honeypot-PINs:' as status,
    pin,
    description,
    created_at
FROM public.honeypot_pins
ORDER BY pin;

-- ── 2. Entferne 9999 aus Honeypots (für Testing) ───────────
DELETE FROM public.honeypot_pins
WHERE pin = '9999';

-- ── 3. Bestätigung ──────────────────────────────────────────
SELECT
    '✅ Status nach Änderung:' as status,
    CASE
        WHEN EXISTS (SELECT 1 FROM public.honeypot_pins WHERE pin = '9999')
        THEN '⚠️ 9999 ist noch ein Honeypot'
        ELSE '✅ 9999 ist KEIN Honeypot mehr (kann getestet werden)'
    END as honeypot_status;

-- ── 4. Verbleibende Honeypots ───────────────────────────────
SELECT
    '🍯 Verbleibende Honeypot-PINs (' || COUNT(*) || ' gesamt):' as status,
    STRING_AGG(pin, ', ' ORDER BY pin) as pins
FROM public.honeypot_pins;

-- ============================================================
-- ✅ Fertig!
-- ============================================================
-- PIN 9999 ist jetzt kein Honeypot mehr
-- Du kannst es zum Testen verwenden (sollte "PIN nicht gefunden" zeigen)
--
-- 🔄 Um 9999 wieder als Honeypot zu aktivieren:
-- INSERT INTO public.honeypot_pins (pin, description)
-- VALUES ('9999', 'Sequential weak PIN')
-- ON CONFLICT (pin) DO NOTHING;
-- ============================================================
