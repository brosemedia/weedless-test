-- ============================================
-- MIGRATION: Bestehende profiles-Tabelle reparieren
-- Fügt fehlende Spalten hinzu, um dem erwarteten Schema zu entsprechen
-- ============================================

-- user_id-Spalte hinzufügen, falls sie nicht existiert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    -- Spalte hinzufügen
    ALTER TABLE public.profiles 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Eindeutigkeits-Constraint hinzufügen (jeder Benutzer darf nur ein Profil haben)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'profiles_user_id_unique'
    ) THEN
      ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    END IF;
  END IF;
END $$;

-- email-Spalte hinzufügen, falls sie nicht existiert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN email TEXT;
  END IF;
END $$;

-- full_name-Spalte hinzufügen, falls sie nicht existiert
-- WICHTIG: Falls display_name existiert, wird es automatisch zu full_name kopiert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN full_name TEXT;
    
    -- Automatisch display_name zu full_name kopieren, falls display_name existiert
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'display_name'
    ) THEN
      UPDATE public.profiles 
      SET full_name = display_name 
      WHERE full_name IS NULL AND display_name IS NOT NULL;
    END IF;
  END IF;
END $$;

-- avatar_url-Spalte hinzufügen, falls sie nicht existiert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- updated_at-Spalte hinzufügen, falls sie nicht existiert
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- Sicherheitsrichtlinien (RLS Policies) erstellen/aktualisieren
-- ============================================

-- Alte Policies löschen (falls vorhanden)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Policy: Benutzer können ihr eigenes Profil ansehen
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Benutzer können ihr eigenes Profil erstellen
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können ihr eigenes Profil aktualisieren
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Row Level Security aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Trigger-Funktion für updated_at erstellen/aktualisieren
-- ============================================

-- Funktion, die updated_at automatisch aktualisiert
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen, der updated_at bei jeder Änderung aktualisiert
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- WICHTIG: Nach Ausführung dieser Migration müssen Sie:
-- ============================================
-- 
-- 1. Bestehende Profile mit auth.users verknüpfen:
--    Siehe MIGRATION_GUIDE.md für detaillierte Anweisungen
-- 
--    Beispiel (automatisch per E-Mail):
--    UPDATE public.profiles 
--    SET user_id = (
--      SELECT id FROM auth.users 
--      WHERE auth.users.email = profiles.email 
--      LIMIT 1
--    )
--    WHERE user_id IS NULL;
-- 
-- 2. Nachdem ALLE Profile verknüpft sind, user_id als Pflichtfeld setzen:
--    ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
-- 
-- ============================================
