-- ============================================
-- MIGRATION: Add user_id column to existing tables
-- Use this if your tables already exist but are missing the user_id column
-- ============================================

-- Add user_id to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    -- Add user_id column (nullable first, we'll update it later)
    ALTER TABLE public.profiles 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- If there's existing data, you'll need to map it manually
    -- For now, we'll just add the column and make it required for new rows
    -- You may need to update existing rows manually to link them to auth.users
    
    -- Add unique constraint if not exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'profiles_user_id_unique'
    ) THEN
      ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    END IF;
    
    -- Make it NOT NULL after you've populated existing data
    -- ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Add user_id to projects table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.projects 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to todos table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'todos' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.todos 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to badges table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.badges 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Now create/update RLS policies (they will work now that user_id exists)
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Note: After running this migration, you'll need to:
-- 1. Update existing rows in profiles to set user_id to the correct auth.users.id
-- 2. Then make user_id NOT NULL if needed
-- 3. Run the rest of schema.sql to create policies for other tables

