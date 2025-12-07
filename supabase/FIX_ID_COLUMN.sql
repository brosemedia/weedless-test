-- ============================================
-- FIX: id Spalte reparieren
-- Behebt den Fehler "null value in column id"
-- ============================================

-- 1. Prüfen Sie die aktuelle Definition der id Spalte
SELECT 
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'id';

-- 2. Stellen Sie sicher, dass id einen DEFAULT hat
-- Falls die Spalte existiert aber keinen DEFAULT hat, fügen wir ihn hinzu
DO $$
BEGIN
  -- Prüfe, ob DEFAULT fehlt
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'id'
      AND column_default IS NULL
  ) THEN
    -- Setze DEFAULT für id
    ALTER TABLE public.profiles
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    
    RAISE NOTICE 'DEFAULT für id Spalte wurde hinzugefügt';
  ELSE
    RAISE NOTICE 'id Spalte hat bereits einen DEFAULT';
  END IF;
END $$;

-- 3. Stellen Sie sicher, dass id NOT NULL ist
ALTER TABLE public.profiles
ALTER COLUMN id SET NOT NULL;

-- 4. Prüfen Sie erneut
SELECT 
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'id';

-- ============================================
-- FERTIG!
-- ============================================
-- Die id Spalte sollte jetzt einen DEFAULT haben.
-- Testen Sie die Registrierung erneut.

