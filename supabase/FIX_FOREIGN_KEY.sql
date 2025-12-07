-- ============================================
-- FIX: Entfernt falschen Foreign Key Constraint auf profiles.id
-- Das Problem: profiles_id_fkey verweist fälschlich auf users Tabelle
-- Lösung: Constraint löschen und sicherstellen, dass id eine UUID ist
-- ============================================

-- 1. Prüfe, ob der falsche Constraint existiert
DO $$
BEGIN
  -- Entferne den falschen Foreign Key Constraint auf id (falls vorhanden)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    RAISE NOTICE 'Falscher Foreign Key Constraint profiles_id_fkey wurde entfernt';
  ELSE
    RAISE NOTICE 'Constraint profiles_id_fkey existiert nicht';
  END IF;
END $$;

-- 2. Stelle sicher, dass id eine UUID PRIMARY KEY mit DEFAULT ist
DO $$
BEGIN
  -- Prüfe, ob id Spalte existiert und ob sie einen DEFAULT hat
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'id'
  ) THEN
    -- Setze DEFAULT für id, falls nicht vorhanden
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'id'
        AND column_default IS NOT NULL
    ) THEN
      ALTER TABLE public.profiles
      ALTER COLUMN id SET DEFAULT uuid_generate_v4();
      RAISE NOTICE 'DEFAULT für id Spalte wurde gesetzt';
    ELSE
      RAISE NOTICE 'id Spalte hat bereits einen DEFAULT';
    END IF;
    
    -- Stelle sicher, dass id NOT NULL ist
    ALTER TABLE public.profiles
    ALTER COLUMN id SET NOT NULL;
    
    -- Stelle sicher, dass id PRIMARY KEY ist (falls nicht bereits)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'profiles_pkey'
    ) THEN
      ALTER TABLE public.profiles
      ADD PRIMARY KEY (id);
      RAISE NOTICE 'PRIMARY KEY Constraint für id wurde hinzugefügt';
    ELSE
      RAISE NOTICE 'PRIMARY KEY Constraint für id existiert bereits';
    END IF;
  ELSE
    -- Falls id Spalte nicht existiert, erstelle sie
    ALTER TABLE public.profiles
    ADD COLUMN id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
    RAISE NOTICE 'id Spalte wurde erstellt';
  END IF;
END $$;

-- 3. Stelle sicher, dass user_id korrekt auf auth.users(id) verweist
DO $$
BEGIN
  -- Prüfe, ob user_id Spalte existiert
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_id'
  ) THEN
    -- Prüfe, ob der korrekte Foreign Key Constraint existiert
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname LIKE 'profiles_user_id%' 
      AND contype = 'f'
    ) THEN
      -- Erstelle den korrekten Foreign Key Constraint
      ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
      RAISE NOTICE 'Korrekter Foreign Key Constraint profiles_user_id_fkey wurde erstellt';
    ELSE
      RAISE NOTICE 'Foreign Key Constraint für user_id existiert bereits';
    END IF;
  ELSE
    -- Falls user_id nicht existiert, erstelle sie
    ALTER TABLE public.profiles
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'user_id Spalte wurde erstellt';
  END IF;
END $$;

-- 4. Prüfe die aktuelle Struktur
SELECT 
  'id Spalte' as check_type,
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'id';

SELECT 
  'user_id Spalte' as check_type,
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'user_id';

-- 5. Zeige alle Constraints
SELECT 
  'Constraints' as check_type,
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY conname;

-- ============================================
-- FERTIG!
-- ============================================
-- Nach Ausführung sollte:
-- - profiles.id eine UUID PRIMARY KEY mit DEFAULT uuid_generate_v4() sein
-- - profiles.user_id auf auth.users(id) verweisen (profiles_user_id_fkey)
-- - Der falsche profiles_id_fkey Constraint sollte entfernt sein

