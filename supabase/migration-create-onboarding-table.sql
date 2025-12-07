-- ============================================
-- MIGRATION: Create onboarding_profiles table
-- Speichert alle Onboarding-Daten der Hazeless-App
-- ============================================

-- ============================================
-- TABLE: onboarding_profiles
-- Speichert alle Onboarding-Daten pro User
-- ============================================
CREATE TABLE IF NOT EXISTS public.onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Grunddaten
  date_of_birth DATE,
  goal TEXT NOT NULL CHECK (goal IN ('pause', 'reduce', 'quit', 'track')),
  frequency_per_week INTEGER NOT NULL DEFAULT 0 CHECK (frequency_per_week >= 0 AND frequency_per_week <= 7),
  
  -- Währung & Ausgaben
  currency TEXT NOT NULL DEFAULT 'EUR',
  weekly_spend NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
  -- Konsumformen & Details
  consumption_methods TEXT[] NOT NULL DEFAULT '{}', -- Array von: 'joints', 'bongs', 'edibles', 'vapes', 'blunts', 'capsules', 'oils', 'pipes', 'dabs'
  consumption_details JSONB NOT NULL DEFAULT '{}', -- Record<ConsumptionMethod, ConsumptionDetails>
  
  -- THC
  thc_potency_percent INTEGER CHECK (thc_potency_percent >= 0 AND thc_potency_percent <= 100),
  
  -- Sonstiges Profil
  gender TEXT CHECK (gender IN ('male', 'female', 'diverse', 'none')),
  impact_level INTEGER CHECK (impact_level >= 0 AND impact_level <= 10),
  first_use_time_minutes INTEGER CHECK (first_use_time_minutes >= 0 AND first_use_time_minutes < 1440), -- 0-1439 (Minuten seit 00:00)
  app_plans TEXT[] NOT NULL DEFAULT '{}',
  unplanned_use_reasons TEXT[] NOT NULL DEFAULT '{}',
  
  -- Pausenplan (nur wenn goal = 'pause')
  pause_start_date DATE,
  pause_duration_days INTEGER CHECK (pause_duration_days >= 0),
  pause_active BOOLEAN DEFAULT FALSE,
  pause_reason TEXT,
  
  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT onboarding_profiles_user_id_unique UNIQUE (user_id)
);

-- ============================================
-- INDEXES für Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_user_id ON public.onboarding_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_goal ON public.onboarding_profiles(goal);

-- ============================================
-- RLS (Row Level Security) aktivieren
-- ============================================
ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: onboarding_profiles
-- ============================================
-- Users can view their own onboarding profile
DROP POLICY IF EXISTS "Users can view own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can view own onboarding profile"
  ON public.onboarding_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own onboarding profile
DROP POLICY IF EXISTS "Users can insert own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can insert own onboarding profile"
  ON public.onboarding_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding profile
DROP POLICY IF EXISTS "Users can update own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can update own onboarding profile"
  ON public.onboarding_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own onboarding profile
DROP POLICY IF EXISTS "Users can delete own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can delete own onboarding profile"
  ON public.onboarding_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: updated_at automatisch aktualisieren
-- ============================================
-- Die Funktion update_updated_at_column() sollte bereits existieren,
-- aber wir stellen sicher, dass sie vorhanden ist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für onboarding_profiles
DROP TRIGGER IF EXISTS update_onboarding_profiles_updated_at ON public.onboarding_profiles;
CREATE TRIGGER update_onboarding_profiles_updated_at
  BEFORE UPDATE ON public.onboarding_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FERTIG!
-- ============================================
-- Die Tabelle onboarding_profiles speichert alle Onboarding-Daten:
-- 
-- - Grunddaten: Geburtsdatum, Ziel, Frequenz
-- - Währung & Ausgaben: Währung, wöchentliche Ausgaben
-- - Konsumformen: Array von Methoden + JSONB mit Details
-- - THC: Potenz in Prozent
-- - Profil: Geschlecht, Impact-Level, erste Konsumzeit, App-Pläne, Gründe
-- - Pausenplan: Startdatum, Dauer, Status, Grund
-- 
-- Alle Daten sind durch RLS geschützt (nur eigene Daten sichtbar)
-- Automatische Timestamps für created_at und updated_at

