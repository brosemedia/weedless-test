# Migrations-Anleitung - Bestehende Tabellen reparieren

## 🎯 Das Problem

Ihre `profiles`-Tabelle existiert bereits, aber es fehlt die wichtige `user_id`-Spalte. Deshalb kommt der Fehler: **"column user_id does not exist"** (Spalte user_id existiert nicht).

**Einfach erklärt:** Die Tabelle wurde früher anders erstellt und passt nicht zu unserem neuen Schema.

## ✅ Lösung - Schritt für Schritt

### Option 1: Migration (Daten bleiben erhalten) - **EMPFOHLEN** ⭐

Diese Option behält Ihre vorhandenen Daten und fügt nur die fehlenden Spalten hinzu.

#### Schritt 1: Migrations-Skript ausführen

1. Öffnen Sie Ihr **Supabase Dashboard**
2. Gehen Sie zu **SQL Editor** (links im Menü)
3. Klicken Sie auf **"New query"** (Neue Abfrage)
4. Öffnen Sie die Datei `supabase/migration-fix-profiles.sql` in einem Texteditor
5. **Kopieren Sie den gesamten Inhalt** der Datei
6. **Fügen Sie ihn in den SQL Editor** ein
7. Klicken Sie auf **"Run"** (Ausführen) oder drücken Sie `Strg + Enter` (Windows) / `Cmd + Enter` (Mac)

**Was passiert jetzt?**
- ✅ Die fehlende `user_id`-Spalte wird hinzugefügt
- ✅ Weitere fehlende Spalten werden hinzugefügt (`email`, `full_name`, `avatar_url`, `updated_at`)
- ✅ Falls vorhanden, wird `display_name` zu `full_name` kopiert
- ✅ Die Sicherheitsrichtlinien (RLS Policies) werden erstellt

#### Schritt 2: Bestehende Profile mit Benutzern verknüpfen

**Wichtig:** Jetzt müssen Sie Ihre vorhandenen Profile mit echten Benutzern aus `auth.users` verbinden.

**Option A: Automatisch per E-Mail (wenn möglich)**

Führen Sie diese Abfrage im SQL Editor aus:

```sql
UPDATE public.profiles 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = profiles.email 
  LIMIT 1
)
WHERE user_id IS NULL;
```

**Was macht das?** Es sucht für jedes Profil den passenden Benutzer anhand der E-Mail-Adresse.

**Option B: Manuell verknüpfen (wenn E-Mail-Matching nicht funktioniert)**

1. Gehen Sie zu **Table Editor** → `auth.users` Tabelle
2. Notieren Sie sich die `id` (UUID) des Benutzers
3. Gehen Sie zu **Table Editor** → `profiles` Tabelle
4. Notieren Sie sich die `id` des Profils
5. Führen Sie diese Abfrage aus (ersetzen Sie die UUIDs):

```sql
UPDATE public.profiles 
SET user_id = 'HIER-DIE-USER-ID-EINFÜGEN' 
WHERE id = 'HIER-DIE-PROFIL-ID-EINFÜGEN';
```

**Beispiel:**
```sql
UPDATE public.profiles 
SET user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
WHERE id = 'b3024f34-f13f-40d0-b089-4fcb8...';
```

**Wiederholen Sie das für jedes Profil!**

#### Schritt 3: user_id als Pflichtfeld setzen (optional, aber empfohlen)

**Nur ausführen, wenn ALLE Profile verknüpft sind!**

```sql
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
```

**Was macht das?** Stellt sicher, dass jedes neue Profil immer eine `user_id` haben muss.

#### Schritt 4: Rest des Schemas ausführen

Jetzt führen Sie das Haupt-Schema aus, um die anderen Tabellen zu erstellen:

1. Öffnen Sie `supabase/schema.sql` in einem Texteditor
2. Kopieren Sie den gesamten Inhalt
3. Fügen Sie ihn in den SQL Editor ein
4. Klicken Sie auf **"Run"**

**Was wird erstellt?**
- ✅ `projects` Tabelle (Projekte)
- ✅ `todos` Tabelle (Aufgaben)
- ✅ `badges` Tabelle (Abzeichen)
- ✅ Alle Sicherheitsrichtlinien (RLS Policies)

### Option 2: Komplett neu starten (Löscht alle Daten!) ⚠️

**Nur verwenden, wenn Sie keine wichtigen Daten haben!**

1. Öffnen Sie `supabase/schema-reset.sql`
2. Kopieren Sie den Inhalt in den SQL Editor
3. Führen Sie aus (löscht alle Tabellen!)
4. Dann führen Sie `schema.sql` aus

## 📊 Aktuelle vs. Erwartete Tabellenstruktur

**Ihre aktuelle `profiles` Tabelle hat:**
- ✅ `id` (uuid)
- ✅ `created_at` (timestamptz)
- ✅ `display_name` (text)
- ✅ `locale` (text)
- ✅ `marketing_opt_in` (bool)
- ❌ `user_id` (uuid) - **FEHLT!**
- ❌ `email` (text) - **FEHLT!**
- ❌ `full_name` (text) - **FEHLT!**
- ❌ `avatar_url` (text) - **FEHLT!**
- ❌ `updated_at` (timestamptz) - **FEHLT!**

Das Migrations-Skript fügt alle fehlenden Spalten hinzu, ohne Ihre Daten zu löschen.

## ✅ Nach der Migration

Sobald die Migration abgeschlossen ist und alle Profile verknüpft sind:

1. ✅ Die App funktioniert normal
2. ✅ Neue Benutzerregistrierungen erstellen automatisch Profile mit `user_id` (via Trigger)
3. ✅ Die Sicherheitsrichtlinien (RLS) funktionieren korrekt
4. ✅ Jeder Benutzer sieht nur seine eigenen Daten

## 🆘 Hilfe bei Problemen

**Problem: "user_id is null"**
- Lösung: Sie haben Schritt 2 übersprungen. Führen Sie die Verknüpfung aus.

**Problem: "duplicate key value violates unique constraint"**
- Lösung: Ein Profil ist bereits mit einem Benutzer verknüpft. Überspringen Sie dieses Profil.

**Problem: "relation does not exist"**
- Lösung: Die Tabelle existiert nicht. Führen Sie zuerst `schema.sql` aus.

## 📝 Checkliste

- [ ] Migrations-Skript ausgeführt
- [ ] Alle Profile mit Benutzern verknüpft
- [ ] `user_id` als NOT NULL gesetzt (optional)
- [ ] Haupt-Schema (`schema.sql`) ausgeführt
- [ ] Test: Neuen Benutzer registrieren und prüfen, ob Profil erstellt wird
