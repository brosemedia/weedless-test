-- ============================================
-- FIX FÜR FEHLER 42501 (permission denied)
-- Dieses Skript behebt speziell den Berechtigungsfehler
-- ============================================

-- 1. Stellen Sie sicher, dass die Funktion dem postgres User gehört
-- (Das ist wichtig für SECURITY DEFINER)
-- Hinweis: ALTER FUNCTION IF EXISTS wird nicht unterstützt, daher prüfen wir zuerst
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
  END IF;
END $$;

-- 2. Erstellen Sie die Funktion neu mit korrekten Berechtigungen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Diese Funktion läuft mit den Rechten von postgres (dank SECURITY DEFINER)
  -- Das bedeutet, RLS wird umgangen und die Funktion kann Profile erstellen
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
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Stellen Sie sicher, dass die Funktion die richtigen Berechtigungen hat
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 4. Erstellen Sie den Trigger neu
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Prüfen Sie, ob alles korrekt ist
SELECT 
  'Funktion Owner' as check_type,
  CASE 
    WHEN proowner = (SELECT oid FROM pg_roles WHERE rolname = 'postgres') 
    THEN '✅ OK (postgres)'
    ELSE '⚠️ Falscher Owner'
  END as status
FROM pg_proc
WHERE proname = 'handle_new_user';

SELECT 
  'Trigger' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK'
    ELSE '❌ FEHLT'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- ============================================
-- FERTIG!
-- ============================================
-- Die Funktion sollte jetzt mit den richtigen Berechtigungen laufen.
-- Testen Sie die Registrierung erneut.

