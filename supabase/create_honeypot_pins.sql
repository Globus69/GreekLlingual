-- ============================================================
-- Honeypot-PINs: Fallen für Brute-Force-Angreifer
-- ============================================================
-- Verbotene PINs (0000, 1111, 1234, 9999) lösen sofort Alarm aus
-- IP wird gebannt und Admin wird benachrichtigt
-- ============================================================

-- ── 1. Honeypot-PINs Tabelle ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.honeypot_pins (
    pin TEXT PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 2. Banned-IPs Tabelle ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banned_ips (
    ip_address INET PRIMARY KEY,
    reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. Honeypot-Log Tabelle (Alarm-Protokoll) ─────────────
CREATE TABLE IF NOT EXISTS public.honeypot_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL,
    pin_attempted TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 4. Indizes für schnelle Abfragen ───────────────────────
CREATE INDEX IF NOT EXISTS idx_banned_ips_until ON public.banned_ips(banned_until);
CREATE INDEX IF NOT EXISTS idx_honeypot_log_ip ON public.honeypot_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_honeypot_log_created ON public.honeypot_log(created_at DESC);

-- ── 5. RLS-Policies ────────────────────────────────────────
ALTER TABLE public.honeypot_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honeypot_log ENABLE ROW LEVEL SECURITY;

-- Admin: Voller Zugriff
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'honeypot_pins' AND policyname = 'admin_full_access') THEN
        CREATE POLICY admin_full_access ON public.honeypot_pins
        FOR ALL USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banned_ips' AND policyname = 'admin_full_access') THEN
        CREATE POLICY admin_full_access ON public.banned_ips
        FOR ALL USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'honeypot_log' AND policyname = 'admin_read_all') THEN
        CREATE POLICY admin_read_all ON public.honeypot_log
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
        );
    END IF;
END $$;

-- Anon: Nur Lesen von honeypot_pins und banned_ips (für RPC)
CREATE POLICY IF NOT EXISTS anon_read_honeypots ON public.honeypot_pins
FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS anon_read_bans ON public.banned_ips
FOR SELECT TO anon USING (true);

-- ── 6. Honeypot-PINs einfügen ──────────────────────────────
INSERT INTO public.honeypot_pins (pin, description) VALUES
    ('0000', 'Most common weak PIN'),
    ('1111', 'Sequential weak PIN'),
    ('2222', 'Sequential weak PIN'),
    ('3333', 'Sequential weak PIN'),
    ('4444', 'Sequential weak PIN'),
    ('5555', 'Sequential weak PIN'),
    ('6666', 'Sequential weak PIN'),
    ('7777', 'Sequential weak PIN'),
    ('8888', 'Sequential weak PIN'),
    ('9999', 'Sequential weak PIN'),
    ('1234', 'Most predictable PIN'),
    ('4321', 'Reverse predictable PIN'),
    ('1122', 'Common pattern'),
    ('2211', 'Common pattern'),
    ('5678', 'Sequential pattern')
ON CONFLICT (pin) DO NOTHING;

-- ── 7. RPC-Funktion: IP bannen ────────────────────────────
CREATE OR REPLACE FUNCTION ban_ip(
    p_ip_address INET,
    p_reason TEXT DEFAULT 'Honeypot PIN attempted',
    p_duration_minutes INT DEFAULT 1440  -- 24 Stunden
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- IP in banned_ips einfügen (24h Ban)
    INSERT INTO public.banned_ips (ip_address, reason, banned_until)
    VALUES (
        p_ip_address,
        p_reason,
        NOW() + (p_duration_minutes || ' minutes')::INTERVAL
    )
    ON CONFLICT (ip_address) DO UPDATE
    SET banned_until = NOW() + (p_duration_minutes || ' minutes')::INTERVAL,
        reason = EXCLUDED.reason;

    RETURN json_build_object(
        'success', true,
        'ip', p_ip_address,
        'banned_until', NOW() + (p_duration_minutes || ' minutes')::INTERVAL
    );
END;
$$;

-- ── 8. RPC-Funktion: IP-Check (gebannt?) ──────────────────
CREATE OR REPLACE FUNCTION is_ip_banned(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.banned_ips
        WHERE ip_address = p_ip_address
          AND (banned_until IS NULL OR banned_until > NOW())
    );
END;
$$;

-- ── 9. RPC-Funktion: verify_user_4digit_pin (erweitert) ───
CREATE OR REPLACE FUNCTION verify_user_4digit_pin(
    p_pin TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_role TEXT,
    user_level TEXT,
    user_difficulty TEXT,
    user_performance_index TEXT,
    user_preferred_locale TEXT,
    user_last_login_device TEXT,
    error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Check: IP gebannt?
    IF p_ip_address IS NOT NULL AND is_ip_banned(p_ip_address) THEN
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'IP banned'::TEXT;
        RETURN;
    END IF;

    -- 2. Check: Honeypot-PIN?
    IF EXISTS (SELECT 1 FROM public.honeypot_pins WHERE pin = p_pin) THEN
        -- Log Honeypot-Versuch
        INSERT INTO public.honeypot_log (ip_address, pin_attempted, user_agent)
        VALUES (p_ip_address, p_pin, p_user_agent);

        -- IP sofort bannen (24h)
        IF p_ip_address IS NOT NULL THEN
            PERFORM ban_ip(p_ip_address, 'Honeypot PIN attempted: ' || p_pin, 1440);
        END IF;

        -- Fehler zurückgeben (sieht aus wie "PIN nicht gefunden")
        RETURN QUERY SELECT
            NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            'Invalid PIN'::TEXT;
        RETURN;
    END IF;

    -- 3. Normale PIN-Validierung
    RETURN QUERY
    SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.level,
        u.difficulty,
        u.performance_index,
        u.preferred_locale,
        u.last_login_device,
        NULL::TEXT
    FROM public.users u
    WHERE u.pin_4digit = p_pin
    LIMIT 1;
END;
$$;

-- ── 10. Zugriffsrechte für RPC-Funktionen ─────────────────
GRANT EXECUTE ON FUNCTION ban_ip TO anon;
GRANT EXECUTE ON FUNCTION ban_ip TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_banned TO anon;
GRANT EXECUTE ON FUNCTION is_ip_banned TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO anon;
GRANT EXECUTE ON FUNCTION verify_user_4digit_pin TO authenticated;

-- ── 11. Cleanup-Funktion (abgelaufene Bans löschen) ───────
CREATE OR REPLACE FUNCTION cleanup_expired_bans()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.banned_ips
    WHERE banned_until IS NOT NULL AND banned_until < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_bans TO authenticated;

-- ============================================================
-- ✅ Migration abgeschlossen
-- ============================================================
-- Honeypot-System aktiv:
-- - 15 verbotene PINs (0000, 1111-9999, 1234, etc.)
-- - Honeypot-Versuch → sofort 24h IP-Ban
-- - honeypot_log protokolliert alle Versuche
-- - cleanup_expired_bans() für Maintenance
-- ============================================================
