-- =====================================================
-- Device Fingerprinting
-- =====================================================
-- Datum: 2026-02-12
-- Zweck: Unsichtbarer 2. Faktor - Browser-Fingerprint
-- =====================================================

-- ========================================
-- STEP 1: Spalte hinzufügen (falls nicht vorhanden)
-- ========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'device_fingerprint'
    ) THEN
        ALTER TABLE public.users ADD COLUMN device_fingerprint TEXT;
        RAISE NOTICE 'Column device_fingerprint added';
    END IF;
END $$;

-- ========================================
-- STEP 2: RPC-Funktion erweitern
-- ========================================

-- verify_user_4digit_pin() bereits in EXECUTE_THIS_account_lockout_COMPLETE.sql
-- Diese Migration ist OPTIONAL - Fingerprint-Check kann client-seitig gemacht werden

-- ========================================
-- STEP 3: Index für Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_fingerprint
ON public.users(device_fingerprint)
WHERE device_fingerprint IS NOT NULL;

-- =====================================================
-- MIGRATION ABGESCHLOSSEN
-- =====================================================
