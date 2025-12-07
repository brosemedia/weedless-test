-- ============================================
-- SOFORT-FIX: Fehlende Spalten zur profiles-Tabelle hinzufügen
-- Führen Sie diesen Code im SQL Editor aus, um das Problem zu beheben
-- ============================================

-- 1. user_id Spalte hinzufügen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Eindeutigkeits-Constraint für user_id hinzufügen (falls noch nicht vorhanden)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 3. email Spalte hinzufügen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. full_name Spalte hinzufügen (und display_name migrieren, falls vorhanden)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Migriere display_name zu full_name, falls display_name existiert
DO $$ 
BEGIN
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
END $$;

-- 5. avatar_url Spalte hinzufügen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 6. updated_at Spalte hinzufügen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 7. RLS-Policies aktualisieren (falls noch nicht vorhanden)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. RLS aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 9. Trigger-Funktion für updated_at erstellen
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger für updated_at erstellen
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Trigger für automatische Profilerstellung prüfen/erstellen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (user_id) DO NOTHING; -- Verhindert Fehler, falls Profil bereits existiert
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Trigger erstellen (falls noch nicht vorhanden)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FERTIG! 
-- ============================================
-- Nach Ausführung dieses Skripts sollten Sie:
-- 1. Die App neu starten
-- 2. Einen neuen Benutzer registrieren
-- 3. Prüfen, ob das Profil in der profiles-Tabelle erscheint


