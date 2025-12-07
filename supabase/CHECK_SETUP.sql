-- ============================================
-- PRÜFUNG: Datenbank-Setup überprüfen
-- Führen Sie diese Abfragen im SQL Editor aus, um zu prüfen, ob alles korrekt eingerichtet ist
-- ============================================

-- 1. Prüfen, ob die profiles-Tabelle existiert
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Prüfen, ob der Trigger existiert
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 3. Prüfen, ob die Funktion handle_new_user existiert
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 4. Prüfen, ob RLS aktiviert ist
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 5. Prüfen, ob die RLS-Policies existieren
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 6. Test: Prüfen, ob ein Benutzer existiert (ersetzen Sie die E-Mail)
-- SELECT id, email, created_at FROM auth.users WHERE email = 'ihre@email.com';

-- 7. Test: Prüfen, ob ein Profil für einen Benutzer existiert (ersetzen Sie die user_id)
-- SELECT * FROM public.profiles WHERE user_id = 'user-uuid-hier';

