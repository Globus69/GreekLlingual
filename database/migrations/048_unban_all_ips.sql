-- ============================================================
-- IP-Sperre aufheben (Emergency Unban)
-- ============================================================
-- Hebt ALLE IP-Sperren auf (inkl. Honeypot-Bans)
-- Nützlich für Testing oder wenn eigene IP versehentlich gebannt
-- ============================================================

-- ── 1. Zeige alle gebannten IPs (vor dem Löschen) ──────────
SELECT
    '🚫 Aktuell gebannte IPs:' as status,
    ip_address,
    reason,
    banned_until,
    CASE
        WHEN banned_until > NOW() THEN '⚠️ Aktiv'
        WHEN banned_until IS NULL THEN '🔒 Permanent'
        ELSE '✅ Abgelaufen'
    END as ban_status,
    created_at
FROM public.banned_ips
ORDER BY created_at DESC;

-- ── 2. Lösche ALLE IP-Sperren ──────────────────────────────
DELETE FROM public.banned_ips;

-- ── 3. Zeige Honeypot-Log (letzte 20 Versuche) ─────────────
SELECT
    '📝 Letzte Honeypot-Versuche:' as status,
    ip_address,
    pin_attempted,
    user_agent,
    created_at
FROM public.honeypot_log
ORDER BY created_at DESC
LIMIT 20;

-- ── 4. Optional: Lösche Honeypot-Log (falls nötig) ─────────
-- WICHTIG: Nur auskommentieren wenn du das Log wirklich löschen willst!
-- DELETE FROM public.honeypot_log;

-- ============================================================
-- ✅ Fertig!
-- ============================================================
-- Alle IP-Sperren wurden entfernt
-- Du kannst jetzt wieder mit allen IPs auf die App zugreifen
--
-- ⚠️ HINWEIS:
-- Honeypot-PINs (0000, 1111-9999, 1234, etc.) bannen IPs weiterhin!
-- Falls du Honeypots deaktivieren willst:
-- DELETE FROM public.honeypot_pins WHERE pin = '9999';
-- ============================================================
