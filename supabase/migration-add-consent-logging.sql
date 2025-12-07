-- ============================================
-- MIGRATION: Add consent logging table for GDPR compliance
-- Run this in Supabase SQL Editor
-- 
-- This table logs all consent changes for audit purposes.
-- Required for GDPR compliance (Art. 7 - Conditions for consent)
-- ============================================

-- ============================================
-- TABLE: consent_logs
-- Speichert Historie aller Consent-Änderungen
-- ============================================
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Consent-Typ: 'server_storage' oder 'marketing'
  consent_type TEXT NOT NULL CHECK (consent_type IN ('server_storage', 'marketing')),
  
  -- Consent-Wert (true = gegeben, false = widerrufen)
  consent_value BOOLEAN NOT NULL,
  
  -- Optional: IP-Adresse und User-Agent für Audit-Trail
  -- (Kann später hinzugefügt werden, wenn benötigt)
  ip_address TEXT,
  user_agent TEXT,
  
  -- Metadaten
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES für Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON public.consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_consent_type ON public.consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON public.consent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_consent ON public.consent_logs(user_id, consent_type, created_at);

-- ============================================
-- RLS (Row Level Security) aktivieren
-- ============================================
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: consent_logs
-- ============================================
DROP POLICY IF EXISTS "Users can view own consent logs" ON public.consent_logs;
CREATE POLICY "Users can view own consent logs"
  ON public.consent_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consent logs (for app usage)
DROP POLICY IF EXISTS "Users can insert own consent logs" ON public.consent_logs;
CREATE POLICY "Users can insert own consent logs"
  ON public.consent_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Users should NOT be able to update or delete consent logs
-- This ensures audit trail integrity

-- ============================================
-- FUNCTION: Get latest consent status for a user
-- ============================================
CREATE OR REPLACE FUNCTION public.get_latest_consent(
  p_user_id UUID,
  p_consent_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_latest_consent BOOLEAN;
BEGIN
  SELECT consent_value INTO v_latest_consent
  FROM public.consent_logs
  WHERE user_id = p_user_id
    AND consent_type = p_consent_type
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_latest_consent, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FERTIG!
-- ============================================
-- Diese Tabelle ermöglicht:
-- 1. Audit-Trail für alle Consent-Änderungen
-- 2. Nachweis der Einwilligung für Compliance-Audits
-- 3. Historie der Consent-Änderungen pro Benutzer
--
-- Wichtig für:
-- - DSGVO Art. 7 (Bedingungen für Einwilligung)
-- - Compliance-Audits
-- - Nachweis der Einwilligung bei Streitigkeiten

