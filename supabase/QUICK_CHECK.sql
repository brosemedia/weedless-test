-- ============================================
-- SCHNELLPRÜFUNG: Ist alles korrekt eingerichtet?
-- Führen Sie diese Abfragen aus, um zu prüfen, ob die Registrierung funktionieren sollte
-- ============================================

-- 1. Prüfen: Existiert die profiles-Tabelle mit allen benötigten Spalten?
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Prüfen: Existiert der Trigger für automatische Profilerstellung?
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 3. Prüfen: Existiert die Funktion handle_new_user?
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 4. Prüfen: Ist RLS aktiviert?
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 5. Prüfen: Existieren alle benötigten RLS-Policies? (Sie haben bereits 3 gesehen)
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Benutzer können ihr Profil ansehen'
    WHEN cmd = 'INSERT' THEN '✅ Benutzer können ihr Profil erstellen'
    WHEN cmd = 'UPDATE' THEN '✅ Benutzer können ihr Profil aktualisieren'
    ELSE cmd::text
  END as beschreibung
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd;

-- ============================================
-- ERGEBNIS-INTERPRETATION:
-- ============================================
-- ✅ Wenn alle 5 Abfragen Ergebnisse zeigen, ist alles korrekt eingerichtet
-- ❌ Wenn Trigger oder Funktion fehlen, führen Sie schema.sql aus
-- ❌ Wenn Spalten fehlen, führen Sie migration-fix-profiles.sql aus

