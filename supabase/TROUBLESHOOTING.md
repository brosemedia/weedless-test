# Fehlerbehebung - "Database error saving new user"

## 🔍 Problem diagnostizieren

### Schritt 1: Prüfen Sie, ob die Tabellen existieren

1. Öffnen Sie Supabase Dashboard → **Table Editor**
2. Prüfen Sie, ob die Tabelle `profiles` existiert
3. Prüfen Sie, ob die Spalte `user_id` vorhanden ist

**Falls die Tabelle fehlt oder die Struktur falsch ist:**
- Führen Sie `supabase/schema.sql` im SQL Editor aus
- Oder folgen Sie der Anleitung in `MIGRATION_GUIDE.md`

### Schritt 2: Prüfen Sie den Trigger

1. Öffnen Sie Supabase Dashboard → **SQL Editor**
2. Führen Sie `supabase/CHECK_SETUP.sql` aus
3. Prüfen Sie, ob der Trigger `on_auth_user_created` existiert

**Falls der Trigger fehlt:**
```sql
-- Trigger manuell erstellen
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Schritt 3: Prüfen Sie die RLS-Policies

1. Im SQL Editor ausführen:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
```

**Sollte zeigen:**
- "Users can view own profile" (SELECT)
- "Users can insert own profile" (INSERT)
- "Users can update own profile" (UPDATE)

## ✅ Lösung: Datenbank-Setup durchführen

### Option A: Komplett neu (empfohlen, wenn keine wichtigen Daten vorhanden)

1. **SQL Editor öffnen**
2. **Reset-Skript ausführen:**
   - Öffnen Sie `supabase/schema-reset.sql`
   - Kopieren Sie den Inhalt
   - Führen Sie aus (⚠️ löscht alle Daten!)

3. **Haupt-Schema ausführen:**
   - Öffnen Sie `supabase/schema.sql`
   - Kopieren Sie den Inhalt
   - Führen Sie aus

### Option B: Migration (wenn Tabellen bereits existieren)

1. **SQL Editor öffnen**
2. **Migration ausführen:**
   - Öffnen Sie `supabase/migration-fix-profiles.sql`
   - Kopieren Sie den Inhalt
   - Führen Sie aus

3. **Bestehende Profile verknüpfen:**
   - Siehe `MIGRATION_GUIDE.md` für Details

## 🔐 Wie kann ich mich einloggen?

### Falls Sie bereits einen Account haben:

1. **Öffnen Sie die App**
2. **Klicken Sie auf "Anmelden"**
3. **Geben Sie Ihre E-Mail und Passwort ein**

### Falls Sie keinen Account haben:

**Nachdem die Datenbank korrekt eingerichtet ist:**

1. **Öffnen Sie die App**
2. **Klicken Sie auf "Registrieren"**
3. **Füllen Sie das Formular aus:**
   - E-Mail (erforderlich)
   - Passwort (mindestens 6 Zeichen)
   - Vollständiger Name (optional)
4. **Klicken Sie auf "Registrieren"**

**Nach erfolgreicher Registrierung:**
- Sie werden automatisch angemeldet
- Ein Profil wird automatisch erstellt
- Sie werden zur Haupt-App weitergeleitet

## 🧪 Testen, ob alles funktioniert

### Test 1: Registrierung testen

1. Registrieren Sie einen neuen Benutzer
2. Gehen Sie zu Supabase → **Table Editor** → `profiles`
3. ✅ Prüfen Sie, ob ein neues Profil erstellt wurde

### Test 2: Login testen

1. Melden Sie sich mit den erstellten Credentials an
2. ✅ Sie sollten zur Haupt-App weitergeleitet werden

### Test 3: Profil prüfen

1. Nach dem Login sollte Ihr Profil geladen sein
2. Prüfen Sie in Supabase → **Table Editor** → `profiles`
3. ✅ Ihr Profil sollte dort erscheinen

## 🆘 Häufige Fehler

### Fehler: "column user_id does not exist"
**Lösung:** Führen Sie `migration-fix-profiles.sql` aus (siehe `MIGRATION_GUIDE.md`)

### Fehler: "permission denied for table profiles"
**Lösung:** RLS-Policies sind nicht korrekt eingerichtet. Führen Sie `schema.sql` aus.

### Fehler: "trigger does not exist"
**Lösung:** Der Trigger wurde nicht erstellt. Führen Sie `schema.sql` aus.

### Fehler: "relation profiles does not exist"
**Lösung:** Die Tabelle existiert nicht. Führen Sie `schema.sql` aus.

## 📝 Checkliste

- [ ] Tabellen existieren (`profiles`, `projects`, `todos`, `badges`)
- [ ] Trigger `on_auth_user_created` existiert
- [ ] Funktion `handle_new_user` existiert
- [ ] RLS ist aktiviert
- [ ] RLS-Policies existieren
- [ ] Test-Registrierung funktioniert
- [ ] Test-Login funktioniert

## 💡 Tipp

Falls nichts funktioniert, führen Sie diese Schritte in dieser Reihenfolge aus:

1. `schema-reset.sql` (⚠️ löscht Daten!)
2. `schema.sql`
3. Test-Registrierung
4. Prüfen Sie die Logs in Supabase Dashboard → **Logs**

