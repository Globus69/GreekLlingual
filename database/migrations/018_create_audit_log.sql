-- ================================================================
-- Audit-Log für Admin-Login-Versuche
-- ================================================================
-- Erstellt: 2026-02-12
-- Zweck: Tracking aller Admin-Login-Versuche für Security-Monitoring
--
-- Features:
-- 1. admin_login_log Tabelle für alle Login-Events
-- 2. RPC log_admin_login() für einfaches Logging
-- 3. RPC get_recent_admin_logins() für Admin-Dashboard
-- 4. Auto-Cleanup alter Logs (> 90 Tage)
-- ================================================================

-- 1. Tabelle erstellen
CREATE TABLE IF NOT EXISTS admin_login_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    ip_address TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    device_type TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_admin_login_log_created_at
    ON admin_login_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_log_username
    ON admin_login_log(username);
CREATE INDEX IF NOT EXISTS idx_admin_login_log_success
    ON admin_login_log(success);

-- 3. RLS Policies
ALTER TABLE admin_login_log ENABLE ROW LEVEL SECURITY;

-- Admin kann alle Logs lesen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_login_log'
        AND policyname = 'Admin can read all login logs'
    ) THEN
        CREATE POLICY "Admin can read all login logs"
            ON admin_login_log
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                )
            );
    END IF;
END $$;

-- Anon kann Logs erstellen (für Login-Flow)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_login_log'
        AND policyname = 'Anon can insert login logs'
    ) THEN
        CREATE POLICY "Anon can insert login logs"
            ON admin_login_log
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 4. RPC-Funktion: Log erstellen
CREATE OR REPLACE FUNCTION log_admin_login(
    p_username TEXT,
    p_ip_address TEXT,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_login_log (
        username,
        ip_address,
        success,
        error_message,
        device_type,
        user_agent
    ) VALUES (
        p_username,
        p_ip_address,
        p_success,
        p_error_message,
        p_device_type,
        p_user_agent
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 5. RPC-Funktion: Letzte N Logs abrufen
CREATE OR REPLACE FUNCTION get_recent_admin_logins(
    p_limit INT DEFAULT 50
) RETURNS TABLE (
    id UUID,
    username TEXT,
    ip_address TEXT,
    success BOOLEAN,
    error_message TEXT,
    device_type TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.username,
        l.ip_address,
        l.success,
        l.error_message,
        l.device_type,
        l.user_agent,
        l.created_at
    FROM admin_login_log l
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 6. RPC-Funktion: Login-Statistiken
CREATE OR REPLACE FUNCTION get_admin_login_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_attempts', COUNT(*),
        'successful_logins', COUNT(*) FILTER (WHERE success = true),
        'failed_logins', COUNT(*) FILTER (WHERE success = false),
        'unique_ips', COUNT(DISTINCT ip_address),
        'last_24h_attempts', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'),
        'last_24h_failed', COUNT(*) FILTER (WHERE success = false AND created_at > NOW() - INTERVAL '24 hours')
    ) INTO v_stats
    FROM admin_login_log
    WHERE created_at > NOW() - INTERVAL '30 days';

    RETURN v_stats;
END;
$$;

-- 7. Auto-Cleanup: Logs älter als 90 Tage löschen
CREATE OR REPLACE FUNCTION cleanup_old_admin_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM admin_login_log
    WHERE created_at < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- 8. Zugriffsrechte setzen
GRANT EXECUTE ON FUNCTION log_admin_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recent_admin_logins TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_login_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_admin_logs TO authenticated;

-- ================================================================
-- FERTIG
-- ================================================================
-- Nutzung:
--
-- 1. Log erstellen (Frontend):
--    SELECT log_admin_login('Admin', '127.0.0.1', true, NULL, 'desktop', 'Mozilla...');
--
-- 2. Logs abrufen (Admin-Dashboard):
--    SELECT * FROM get_recent_admin_logins(50);
--
-- 3. Statistiken abrufen:
--    SELECT * FROM get_admin_login_stats();
--
-- 4. Alte Logs löschen (manuell oder Cronjob):
--    SELECT cleanup_old_admin_logs();
-- ================================================================
