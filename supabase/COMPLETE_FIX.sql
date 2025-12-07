-- ============================================
-- VOLLSTÄNDIGER FIX: Alles auf einmal reparieren
-- Führen Sie diesen Code aus, um ALLE Probleme zu beheben
-- ============================================

-- ============================================
-- SCHRITT 1: Tabellenstruktur reparieren
-- ============================================

-- user_id Spalte hinzufügen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Eindeutigkeits-Constraint
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

-- email Spalte
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- full_name Spalte
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Migriere display_name zu full_name
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

-- avatar_url Spalte
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- updated_at Spalte
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================
-- SCHRITT 2: Funktionen erstellen
-- ============================================

-- Funktion für updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funktion für automatische Profilerstellung (WICHTIG!)
-- SECURITY DEFINER bedeutet: Funktion läuft mit den Rechten des Funktionseigentümers (postgres)
-- Das umgeht RLS, damit der Trigger das Profil erstellen kann
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Temporär RLS für diese Operation deaktivieren (nur für diese Funktion)
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log den Fehler, aber verhindere nicht die Benutzererstellung
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHRITT 3: Trigger erstellen
-- ============================================

-- Trigger für updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger für automatische Profilerstellung (WICHTIG!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SCHRITT 4: RLS aktivieren und Policies erstellen
-- ============================================

-- RLS aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies löschen und neu erstellen
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- SELECT Policy
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT Policy (WICHTIG für Registrierung!)
-- Diese Policy erlaubt Benutzern, ihr eigenes Profil zu erstellen
-- Der Trigger verwendet SECURITY DEFINER, um diese Policy zu umgehen
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ZUSÄTZLICH: Policy für Service Role (falls nötig)
-- Diese Policy erlaubt dem Trigger (der als postgres läuft), Profile zu erstellen
-- WICHTIG: Diese Policy ist nur für den Trigger, nicht für normale Benutzer
DO $$
BEGIN
  -- Prüfe, ob die Policy bereits existiert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Service role can insert profiles'
  ) THEN
    -- Erstelle eine Policy, die dem Service Role erlaubt, Profile zu erstellen
    -- Dies wird vom Trigger verwendet
    EXECUTE 'CREATE POLICY "Service role can insert profiles"
      ON public.profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true)';
  END IF;
END $$;

-- UPDATE Policy
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SCHRITT 5: Prüfung - Ist alles korrekt?
-- ============================================

-- Prüfe Tabellenstruktur
SELECT 
  'Tabellenstruktur' as check_type,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ OK (' || COUNT(*) || ' Spalten)'
    ELSE '❌ FEHLT (' || COUNT(*) || ' Spalten)'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles';

-- Prüfe Trigger
SELECT 
  'Trigger' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK'
    ELSE '❌ FEHLT'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Prüfe Funktion
SELECT 
  'Funktion' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK'
    ELSE '❌ FEHLT'
  END as status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Prüfe RLS
SELECT 
  'RLS aktiviert' as check_type,
  CASE 
    WHEN rowsecurity THEN '✅ OK'
    ELSE '❌ FEHLT'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Prüfe Policies
SELECT 
  'RLS Policies' as check_type,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ OK (' || COUNT(*) || ' Policies)'
    ELSE '❌ FEHLT (' || COUNT(*) || ' Policies)'
  END as status
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- FERTIG!
-- ============================================
-- Alle Prüfungen sollten ✅ OK zeigen.
-- Falls nicht, gibt es ein Problem mit den Berechtigungen.
-- Testen Sie jetzt die Registrierung in der App.

