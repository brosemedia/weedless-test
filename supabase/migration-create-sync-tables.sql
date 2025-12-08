-- ============================================
-- MIGRATION: Create tables for cloud sync of app data
-- Run this in Supabase SQL Editor AFTER migration-add-consents.sql
-- 
-- This creates tables for syncing app data across devices:
-- - app_profiles: App-specific profile settings (baseline, goals, etc.)
-- - day_logs: Daily tracking data (consumption, check-ins, tests, tasks, XP)
-- - pauses: Pause tracking (active, completed, cancelled)
-- ============================================

-- ============================================
-- TABLE: app_profiles
-- Speichert App-spezifische Profile-Daten (nicht zu verwechseln mit auth profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Baseline & Consumption Settings
  price_per_gram NUMERIC(10, 2),
  cost_per_joint NUMERIC(10, 2),
  grams_per_day_baseline NUMERIC(10, 2),
  joints_per_day_baseline NUMERIC(10, 2),
  avg_session_minutes INTEGER,
  
  -- Tracking Timestamps
  start_timestamp BIGINT NOT NULL, -- ms timestamp - "konsumfrei seit"
  last_consumption_at BIGINT, -- ms timestamp
  
  -- Locale & Version
  locale TEXT,
  version INTEGER NOT NULL DEFAULT 2,
  
  -- Metadaten
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT app_profiles_user_id_unique UNIQUE (user_id)
);

-- ============================================
-- TABLE: day_logs
-- Speichert tägliche Tracking-Daten (Konsum, Check-ins, Tests, Tasks, XP)
-- ============================================
CREATE TABLE IF NOT EXISTS public.day_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  
  -- Konsum-Daten
  consumed_grams NUMERIC(10, 2),
  consumed_joints INTEGER,
  money_spent_eur NUMERIC(10, 2),
  session_minutes INTEGER,
  
  -- Check-in Daten (als JSONB für Flexibilität)
  checkin JSONB, -- { usedToday, amountGrams, cravings0to10, mood1to5, sleepHours, notes, recordedAt }
  
  -- Konsum-Einträge (Array als JSONB)
  consumption_entries JSONB, -- Array von ConsumptionEntry
  
  -- Test-Ergebnisse (als JSONB)
  tests JSONB, -- { reactionMs, memoryScore, stroopAccuracy, stroopMeanRt, stroopInterference, stroopTimestamp }
  
  -- Tasks & XP
  tasks_done TEXT[], -- Array von task IDs
  xp_earned INTEGER DEFAULT 0,
  
  -- Notizen
  notes TEXT,
  
  -- Metadaten
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Eindeutiger Constraint: Ein Tag pro User
  CONSTRAINT day_logs_user_date_unique UNIQUE (user_id, date)
);

-- ============================================
-- TABLE: pauses
-- Speichert Pausen (aktiv, abgeschlossen, abgebrochen)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pause-Daten
  start_date TEXT NOT NULL, -- YYYY-MM-DD
  end_date TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT NOT NULL CHECK (status IN ('aktiv', 'abgeschlossen', 'abgebrochen')),
  
  -- Timestamps
  created_at BIGINT NOT NULL, -- ms timestamp
  start_timestamp BIGINT, -- ms timestamp
  end_timestamp BIGINT, -- ms timestamp
  completed_at BIGINT, -- ms timestamp
  completed_status TEXT CHECK (completed_status IN ('aktiv', 'abgeschlossen', 'abgebrochen')),
  
  -- Statistiken (als JSONB)
  stats JSONB, -- { savedMoney, savedGrams, savedTimeHours }
  
  -- XP-Tage (Array von Datum-Keys)
  xp_awarded_days TEXT[], -- Array von YYYY-MM-DD
  
  -- Metadaten
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES für Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_app_profiles_user_id ON public.app_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_day_logs_user_id ON public.day_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_day_logs_date ON public.day_logs(date);
CREATE INDEX IF NOT EXISTS idx_day_logs_user_date ON public.day_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_pauses_user_id ON public.pauses(user_id);
CREATE INDEX IF NOT EXISTS idx_pauses_status ON public.pauses(user_id, status) WHERE status = 'aktiv';
CREATE INDEX IF NOT EXISTS idx_pauses_dates ON public.pauses(start_date, end_date);

-- ============================================
-- RLS (Row Level Security) aktivieren
-- ============================================
ALTER TABLE public.app_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pauses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: app_profiles
-- ============================================
DROP POLICY IF EXISTS "Users can view own app profile" ON public.app_profiles;
CREATE POLICY "Users can view own app profile"
  ON public.app_profiles
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own app profile" ON public.app_profiles;
CREATE POLICY "Users can insert own app profile"
  ON public.app_profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own app profile" ON public.app_profiles;
CREATE POLICY "Users can update own app profile"
  ON public.app_profiles
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- RLS POLICIES: day_logs
-- ============================================
DROP POLICY IF EXISTS "Users can view own day logs" ON public.day_logs;
CREATE POLICY "Users can view own day logs"
  ON public.day_logs
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own day logs" ON public.day_logs;
CREATE POLICY "Users can insert own day logs"
  ON public.day_logs
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own day logs" ON public.day_logs;
CREATE POLICY "Users can update own day logs"
  ON public.day_logs
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own day logs" ON public.day_logs;
CREATE POLICY "Users can delete own day logs"
  ON public.day_logs
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- RLS POLICIES: pauses
-- ============================================
DROP POLICY IF EXISTS "Users can view own pauses" ON public.pauses;
CREATE POLICY "Users can view own pauses"
  ON public.pauses
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own pauses" ON public.pauses;
CREATE POLICY "Users can insert own pauses"
  ON public.pauses
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own pauses" ON public.pauses;
CREATE POLICY "Users can update own pauses"
  ON public.pauses
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own pauses" ON public.pauses;
CREATE POLICY "Users can delete own pauses"
  ON public.pauses
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- TRIGGER: updated_at automatisch aktualisieren
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für app_profiles
DROP TRIGGER IF EXISTS update_app_profiles_updated_at ON public.app_profiles;
CREATE TRIGGER update_app_profiles_updated_at
  BEFORE UPDATE ON public.app_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger für day_logs
DROP TRIGGER IF EXISTS update_day_logs_updated_at ON public.day_logs;
CREATE TRIGGER update_day_logs_updated_at
  BEFORE UPDATE ON public.day_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger für pauses
DROP TRIGGER IF EXISTS update_pauses_updated_at ON public.pauses;
CREATE TRIGGER update_pauses_updated_at
  BEFORE UPDATE ON public.pauses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FERTIG!
-- ============================================
-- Diese Tabellen speichern alle notwendigen Daten für Multi-Device-Sync:
-- 
-- 1. app_profiles: App-Einstellungen (Baseline, Goals, Timestamps)
-- 2. day_logs: Tägliche Tracking-Daten (Konsum, Check-ins, Tests, Tasks, XP)
-- 3. pauses: Pausen-Tracking (Status, Statistiken, XP-Tage)
--
-- Alle Tabellen haben:
-- - RLS aktiviert (nur eigene Daten sichtbar)
-- - Indizes für Performance
-- - Automatische updated_at Timestamps
-- - Foreign Keys zu auth.users für Datenintegrität
