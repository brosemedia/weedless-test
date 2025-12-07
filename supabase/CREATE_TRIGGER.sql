-- ============================================
-- TRIGGER ERSTELLEN: Automatische Profilerstellung
-- Führen Sie diesen Code aus, um den fehlenden Trigger zu erstellen
-- ============================================

-- 1. Prüfen, ob die Funktion existiert (optional - zeigt Info)
SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'handle_new_user' THEN '✅ Funktion existiert'
    ELSE '❌ Funktion fehlt'
  END as status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Funktion erstellen/aktualisieren (falls sie fehlt oder aktualisiert werden muss)
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

-- 3. Trigger erstellen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Prüfen, ob der Trigger jetzt existiert
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Trigger ist aktiviert'
    ELSE '⚠️ Trigger ist deaktiviert'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- ============================================
-- FERTIG!
-- ============================================
-- Der Trigger sollte jetzt existieren und aktiviert sein.
-- Testen Sie die Registrierung in der App erneut.

