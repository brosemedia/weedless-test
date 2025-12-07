# Supabase Setup-Anleitung

## 🗄️ Datenbank einrichten

### Schritt 1: Supabase Dashboard öffnen
1. Öffnen Sie Ihr Supabase Dashboard: https://ajkqtxecaxkuzpavvsoq.supabase.co
2. Loggen Sie sich ein (falls nötig)

### Schritt 2: SQL Editor öffnen
1. Klicken Sie im linken Menü auf **"SQL Editor"** (SQL-Editor)
2. Klicken Sie auf **"New query"** (Neue Abfrage)

### Schritt 3: Schema ausführen

**WICHTIG:** Prüfen Sie zuerst, ob Ihre `profiles`-Tabelle bereits existiert!

- **Falls die Tabelle bereits existiert:** Folgen Sie der Anleitung in `MIGRATION_GUIDE.md`
- **Falls die Tabelle noch nicht existiert:** Führen Sie direkt `schema.sql` aus

**Schema ausführen:**
1. Öffnen Sie die Datei `supabase/schema.sql` in einem Texteditor
2. Kopieren Sie den **gesamten Inhalt**
3. Fügen Sie ihn in den SQL Editor ein
4. Klicken Sie auf **"Run"** (Ausführen) oder drücken Sie `Strg + Enter` (Windows) / `Cmd + Enter` (Mac)

### Schritt 4: Tabellen prüfen
Nach der Ausführung sollten folgende Tabellen erstellt sein:
- ✅ `profiles` (Benutzerprofile)
- ✅ `projects` (Projekte)
- ✅ `todos` (Aufgaben)
- ✅ `badges` (Abzeichen)

**Prüfen:** Gehen Sie zu **Table Editor** (Tabellen-Editor) im linken Menü und schauen Sie, ob die Tabellen dort erscheinen.

## 🔒 Row Level Security (RLS) - Sicherheitsrichtlinien

Alle Tabellen haben RLS aktiviert. Das bedeutet: **Jeder Benutzer sieht nur seine eigenen Daten!**

**Richtlinien im Detail:**
- **profiles**: Benutzer können nur ihr eigenes Profil ansehen, erstellen und bearbeiten
- **projects**: Benutzer können nur ihre eigenen Projekte ansehen, erstellen, bearbeiten und löschen
- **todos**: Benutzer können nur ihre eigenen Aufgaben ansehen, erstellen, bearbeiten und löschen
- **badges**: Benutzer können nur ihre eigenen Abzeichen ansehen, erstellen, bearbeiten und löschen

## 🤖 Automatische Profilerstellung

Wenn sich ein neuer Benutzer registriert, wird automatisch ein Profil erstellt (via Datenbank-Trigger `handle_new_user`).

**Das bedeutet:**
- ✅ Jeder Benutzer bekommt automatisch ein Profil
- ✅ Das Profil wird mit der E-Mail-Adresse des Benutzers erstellt
- ✅ Falls beim Registrieren ein Name angegeben wurde, wird dieser übernommen

## 🔑 Umgebungsvariablen

Der Supabase Client ist bereits in `src/lib/supabase.ts` konfiguriert mit:
- **URL**: `https://ajkqtxecaxkuzpavvsoq.supabase.co`
- **Anon Key**: Bereits im Code eingetragen

**Für Produktion:** Verschieben Sie den Anon Key in eine `.env`-Datei (optional, aber empfohlen).

## 🧪 Setup testen

### Test 1: Neuen Benutzer registrieren
1. Starten Sie die App
2. Registrieren Sie einen neuen Benutzer
3. Gehen Sie zu Supabase → **Table Editor** → `profiles`
4. ✅ Prüfen Sie, ob ein neues Profil erstellt wurde

### Test 2: RLS testen
1. Erstellen Sie zwei verschiedene Benutzerkonten
2. Mit Benutzer 1: Erstellen Sie ein Projekt oder eine Aufgabe
3. Mit Benutzer 2: Melden Sie sich an
4. ✅ Prüfen Sie: Benutzer 2 sollte die Daten von Benutzer 1 **nicht** sehen können

### Test 3: Daten erstellen
1. Erstellen Sie ein Projekt
2. Erstellen Sie eine Aufgabe
3. Erstellen Sie ein Abzeichen
4. ✅ Prüfen Sie, ob alles in den entsprechenden Tabellen erscheint

## 🆘 Fehlerbehebung

### Problem: Profil wird bei Registrierung nicht erstellt
**Lösung:**
1. Prüfen Sie, ob der Trigger `on_auth_user_created` existiert
2. Prüfen Sie, ob die Funktion `handle_new_user` funktioniert
3. Schauen Sie in die Supabase Logs nach Fehlern

**Prüfen:**
- SQL Editor → Führen Sie aus: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

### Problem: RLS blockiert Operationen
**Lösung:**
1. Stellen Sie sicher, dass der Benutzer angemeldet ist
2. Prüfen Sie, ob die RLS-Policies korrekt eingerichtet sind
3. Prüfen Sie, ob `user_id` mit `auth.uid()` übereinstimmt

**Prüfen:**
- SQL Editor → Führen Sie aus: `SELECT auth.uid();` (sollte die aktuelle Benutzer-ID zurückgeben)

### Problem: Passwort-Reset funktioniert nicht
**Lösung:**
1. Gehen Sie zu Supabase → **Authentication** → **URL Configuration**
2. Fügen Sie die Redirect-URL hinzu: `hazeless://reset-password`
3. Konfigurieren Sie den Deep Link Handler in Ihrer App (falls noch nicht geschehen)

### Problem: "column user_id does not exist"
**Lösung:** Ihre Tabelle existiert bereits mit einer anderen Struktur. Folgen Sie der Anleitung in `MIGRATION_GUIDE.md`.

## 📚 Weitere Ressourcen

- **Migrations-Anleitung:** `MIGRATION_GUIDE.md` (für bestehende Tabellen)
- **Reset-Skript:** `schema-reset.sql` (löscht alle Tabellen - Vorsicht!)
- **Haupt-Schema:** `schema.sql` (erstellt alle Tabellen neu)
