-- ============================================
-- FIX: pauses.id Spalte von UUID zu TEXT ändern
-- ============================================
-- Die App generiert Pause-IDs als Strings (z.B. "pause_abc123"),
-- aber die Tabelle erwartet UUIDs. Diese Migration ändert die
-- Spalte zu TEXT, damit die App-IDs akzeptiert werden.

-- 1. Prüfe aktuelle Struktur
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pauses'
  AND column_name = 'id';

-- 2. Entferne PRIMARY KEY Constraint temporär
-- (PostgreSQL erlaubt keine direkte Typänderung bei PRIMARY KEY)
ALTER TABLE public.pauses DROP CONSTRAINT IF EXISTS pauses_pkey;

-- 3. Ändere den Datentyp der id Spalte zu TEXT
ALTER TABLE public.pauses 
ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 4. Setze id als NOT NULL (falls noch nicht gesetzt)
ALTER TABLE public.pauses 
ALTER COLUMN id SET NOT NULL;

-- 5. Füge PRIMARY KEY Constraint wieder hinzu
ALTER TABLE public.pauses 
ADD CONSTRAINT pauses_pkey PRIMARY KEY (id);

-- 6. Prüfe erneut
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pauses'
  AND column_name = 'id';

-- ============================================
-- FERTIG!
-- ============================================
-- Die id Spalte ist jetzt TEXT und kann String-IDs wie "pause_abc123" akzeptieren.
-- Pausen sollten jetzt korrekt synchronisiert werden.

