-- =====================================================
-- Admin MFA/TOTP System
-- =====================================================
-- Datum: 2026-02-12
-- Zweck: 2FA für Admin-Login mit TOTP (Google Authenticator)
-- =====================================================

-- Aktiviere pgcrypto Extension (für Verschlüsselung)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- STEP 1: Spalten hinzufügen
-- ========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'mfa_secret'
    ) THEN
        ALTER TABLE public.users ADD COLUMN mfa_secret TEXT;
        RAISE NOTICE 'Column mfa_secret added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'mfa_recovery_codes'
    ) THEN
        ALTER TABLE public.users ADD COLUMN mfa_recovery_codes TEXT[];
        RAISE NOTICE 'Column mfa_recovery_codes added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'mfa_enabled'
    ) THEN
        ALTER TABLE public.users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Column mfa_enabled added';
    END IF;
END $$;

-- ========================================
-- STEP 2: RPC - MFA Secret speichern
-- ========================================

CREATE OR REPLACE FUNCTION save_admin_mfa_secret(
    p_user_id UUID,
    p_secret TEXT,
    p_recovery_codes TEXT[]
)
RETURNS JSON AS $$
BEGIN
    -- Nur für Admin-User
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND role = 'admin') THEN
        RETURN json_build_object('success', false, 'error', 'Not an admin user');
    END IF;

    -- Secret unverschlüsselt speichern (client-seitig bereits base32)
    UPDATE public.users
    SET
        mfa_secret = p_secret,
        mfa_recovery_codes = p_recovery_codes,
        mfa_enabled = true,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object('success', true, 'message', 'MFA enabled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION save_admin_mfa_secret(UUID, TEXT, TEXT[]) TO anon, authenticated;

-- ========================================
-- STEP 3: RPC - MFA Secret abrufen
-- ========================================

CREATE OR REPLACE FUNCTION get_admin_mfa_secret(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_user RECORD;
BEGIN
    SELECT mfa_secret, mfa_enabled, mfa_recovery_codes
    INTO v_user
    FROM public.users
    WHERE id = p_user_id AND role = 'admin'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('found', false);
    END IF;

    RETURN json_build_object(
        'found', true,
        'secret', v_user.mfa_secret,
        'enabled', v_user.mfa_enabled,
        'recovery_codes', v_user.mfa_recovery_codes
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_mfa_secret(UUID) TO anon, authenticated;

-- ========================================
-- STEP 4: RPC - Recovery Code verwenden
-- ========================================

CREATE OR REPLACE FUNCTION use_admin_recovery_code(
    p_user_id UUID,
    p_code TEXT
)
RETURNS JSON AS $$
DECLARE
    v_codes TEXT[];
    v_new_codes TEXT[];
BEGIN
    -- Hole aktuelle Recovery Codes
    SELECT mfa_recovery_codes INTO v_codes
    FROM public.users
    WHERE id = p_user_id AND role = 'admin' AND mfa_enabled = true
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'MFA not enabled');
    END IF;

    -- Prüfe ob Code existiert
    IF p_code = ANY(v_codes) THEN
        -- Entferne Code aus Array (nur einmalig verwendbar)
        SELECT array_agg(code)
        INTO v_new_codes
        FROM unnest(v_codes) AS code
        WHERE code != p_code;

        -- Update User
        UPDATE public.users
        SET mfa_recovery_codes = v_new_codes
        WHERE id = p_user_id;

        RETURN json_build_object(
            'success', true,
            'message', 'Recovery code accepted',
            'remaining', array_length(v_new_codes, 1)
        );
    ELSE
        RETURN json_build_object('success', false, 'error', 'Invalid recovery code');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION use_admin_recovery_code(UUID, TEXT) TO anon, authenticated;

-- ========================================
-- STEP 5: RPC - MFA deaktivieren
-- ========================================

CREATE OR REPLACE FUNCTION disable_admin_mfa(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
    UPDATE public.users
    SET
        mfa_enabled = false,
        mfa_secret = NULL,
        mfa_recovery_codes = NULL
    WHERE id = p_user_id AND role = 'admin';

    RETURN json_build_object('success', true, 'message', 'MFA disabled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION disable_admin_mfa(UUID) TO anon, authenticated;

-- =====================================================
-- MIGRATION ABGESCHLOSSEN
-- =====================================================
-- TOTP-Validierung erfolgt client-seitig (otpauth Library)
-- Secret wird unverschlüsselt gespeichert (base32-String)
-- Recovery-Codes sind einmalig verwendbar
-- =====================================================
