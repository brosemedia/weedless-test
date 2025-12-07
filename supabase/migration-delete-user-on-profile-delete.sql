-- ============================================
-- MIGRATION: Delete auth.users when profile is deleted
-- This ensures that when a user deletes their account, the auth.users entry is also deleted
-- ============================================

-- Function to delete auth.users when profile is deleted
-- This function requires SECURITY DEFINER to access auth.users
-- Note: This function must be owned by postgres or service_role to work properly
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Delete the auth.users entry when profile is deleted
  -- This requires SECURITY DEFINER to access auth schema
  DELETE FROM auth.users WHERE id = OLD.user_id;
  
  -- Return the deleted row
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the profile deletion
    RAISE WARNING 'Error deleting auth.users for user %: %', OLD.user_id, SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Ensure the function is owned by postgres (required for SECURITY DEFINER)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'delete_auth_user_on_profile_delete' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER FUNCTION public.delete_auth_user_on_profile_delete() OWNER TO postgres;
  END IF;
END $$;

-- Grant execute permission to authenticated users (they can trigger it via profile deletion)
GRANT EXECUTE ON FUNCTION public.delete_auth_user_on_profile_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_auth_user_on_profile_delete() TO service_role;

-- Trigger to delete auth.users when profile is deleted
DROP TRIGGER IF EXISTS on_profile_deleted_delete_auth_user ON public.profiles;
CREATE TRIGGER on_profile_deleted_delete_auth_user
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();

-- ============================================
-- FERTIG!
-- ============================================
-- Wenn ein Profil gelöscht wird, wird automatisch auch der auth.users Eintrag gelöscht.
-- Dies stellt sicher, dass Account-Löschungen vollständig sind.
-- 
-- WICHTIG: Diese Migration muss im Supabase SQL Editor ausgeführt werden.
-- Falls die Funktion nicht funktioniert (z.B. wegen Permissions), kann alternativ
-- eine Supabase Edge Function verwendet werden (siehe COMPLIANCE_IMPLEMENTATION.md).

