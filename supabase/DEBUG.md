# 🔍 Debugging - Registrierung funktioniert nicht

## Schritt-für-Schritt Prüfung

### 1. Führen Sie COMPLETE_FIX.sql aus

1. Öffnen Sie Supabase → **SQL Editor**
2. Öffnen Sie `supabase/COMPLETE_FIX.sql`
3. Kopieren Sie den **gesamten Inhalt**
4. Führen Sie aus
5. **Prüfen Sie die Ergebnisse am Ende** - alle sollten ✅ OK zeigen

### 2. Prüfen Sie die Tabellenstruktur

Führen Sie im SQL Editor aus:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Sollte zeigen:**
- ✅ `id` (uuid)
- ✅ `user_id` (uuid) - **WICHTIG!**
- ✅ `email` (text)
- ✅ `full_name` (text)
- ✅ `avatar_url` (text)
- ✅ `created_at` (timestamptz)
- ✅ `updated_at` (timestamptz)

### 3. Prüfen Sie den Trigger

```sql
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
```

**Sollte einen Eintrag zurückgeben!**

### 4. Prüfen Sie die RLS-Policies

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

**Sollte zeigen:**
- ✅ "Users can view own profile" (SELECT)
- ✅ "Users can insert own profile" (INSERT) - **WICHTIG!**
- ✅ "Users can update own profile" (UPDATE)

### 5. Testen Sie die Funktion manuell

```sql
-- Prüfen Sie, ob ein Test-Benutzer existiert
SELECT id, email FROM auth.users LIMIT 1;

-- Versuchen Sie, ein Profil manuell zu erstellen (ersetzen Sie die UUID)
-- Dies sollte funktionieren, wenn RLS korrekt ist
INSERT INTO public.profiles (user_id, email, full_name)
VALUES (
  'Ihre-User-ID-hier',
  'test@example.com',
  'Test User'
);
```

**Falls dieser INSERT fehlschlägt:** Das RLS-Problem blockiert die Registrierung.

### 6. Prüfen Sie die Logs

1. Supabase Dashboard → **Logs** (im linken Menü)
2. Filtern Sie nach "error" oder "profiles"
3. Schauen Sie nach Fehlermeldungen bei der Registrierung

### 7. Testen Sie die Registrierung

1. **App neu starten** (vollständig schließen)
2. Versuchen Sie, sich zu registrieren
3. **Gleichzeitig:** Schauen Sie in die Supabase Logs
4. Notieren Sie die genaue Fehlermeldung

## Häufige Probleme und Lösungen

### Problem: "permission denied for table profiles"
**Lösung:** RLS-Policy für INSERT fehlt oder ist falsch. Führen Sie `COMPLETE_FIX.sql` aus.

### Problem: "column user_id does not exist"
**Lösung:** Die Spalte fehlt. Führen Sie `COMPLETE_FIX.sql` aus.

### Problem: "trigger does not exist"
**Lösung:** Der Trigger fehlt. Führen Sie `COMPLETE_FIX.sql` aus.

### Problem: Trigger existiert, aber erstellt kein Profil
**Lösung:** 
1. Prüfen Sie die Funktion `handle_new_user`:
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```
2. Prüfen Sie die Logs für Fehler
3. Die App erstellt das Profil jetzt auch manuell als Fallback

## Was die App jetzt macht

Die App versucht jetzt:
1. Benutzer zu erstellen (via Supabase Auth)
2. 1 Sekunde zu warten (für Trigger)
3. Zu prüfen, ob Profil existiert
4. Falls nicht: Profil manuell zu erstellen
5. Falls das fehlschlägt: Detaillierte Fehlermeldung anzeigen

## Nächste Schritte

1. ✅ Führen Sie `COMPLETE_FIX.sql` aus
2. ✅ Prüfen Sie alle Schritte oben
3. ✅ Testen Sie die Registrierung
4. ✅ Schauen Sie in die Logs bei Fehlern
5. 📧 Teilen Sie mir die genaue Fehlermeldung mit, falls es weiterhin nicht funktioniert

