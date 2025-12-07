# 🚀 Schnellstart - Registrierung reparieren

## ⚠️ Problem
Sie sehen die Fehlermeldung: "Datenbankfehler: Bitte stellen Sie sicher, dass die Datenbank-Tabellen korrekt eingerichtet sind."

## ✅ Lösung in 3 Schritten

### Schritt 1: Supabase Dashboard öffnen
1. Gehen Sie zu: https://supabase.com/dashboard/project/ajkqtxecaxkuzpavvsoq
2. Klicken Sie im linken Menü auf **"SQL Editor"** (SQL-Editor Icon)

### Schritt 2: Fix-Skript ausführen
1. Öffnen Sie die Datei `supabase/FIX_NOW.sql` in einem Texteditor
2. **Kopieren Sie den GESAMTEN Inhalt** (Strg+A, dann Strg+C)
3. Fügen Sie ihn in den SQL Editor ein (Strg+V)
4. Klicken Sie auf **"Run"** (oder drücken Sie Strg+Enter)

**Was passiert:**
- ✅ Fehlende Spalten werden hinzugefügt (`user_id`, `email`, `full_name`, etc.)
- ✅ Trigger wird erstellt (automatische Profilerstellung)
- ✅ RLS-Policies werden aktualisiert

### Schritt 3: App testen
1. **App neu starten** (vollständig schließen und wieder öffnen)
2. Versuchen Sie erneut, sich zu registrieren
3. ✅ Es sollte jetzt funktionieren!

## 🔍 Prüfen, ob es funktioniert hat

Nach Schritt 2 können Sie prüfen:

1. Gehen Sie zu **Table Editor** → `profiles`
2. Klicken Sie auf den Tab **"Definition"** (unten rechts)
3. ✅ Prüfen Sie, ob diese Spalten vorhanden sind:
   - `user_id` (uuid)
   - `email` (text)
   - `full_name` (text)
   - `avatar_url` (text)
   - `updated_at` (timestamptz)

**Falls alle Spalten vorhanden sind:** ✅ Fertig! Die Registrierung sollte jetzt funktionieren.

**Falls Spalten fehlen:** Führen Sie `FIX_NOW.sql` nochmal aus.

## 🆘 Immer noch Probleme?

1. **Prüfen Sie die Logs:**
   - Supabase Dashboard → **Logs** (im linken Menü)
   - Schauen Sie nach Fehlermeldungen

2. **Trigger erstellen (wenn er fehlt):**
   - SQL Editor → Öffnen Sie `supabase/CREATE_TRIGGER.sql`
   - Kopieren Sie den gesamten Inhalt
   - Führen Sie aus
   - ✅ Der Trigger wird erstellt und sollte danach funktionieren

3. **Kontaktieren Sie mich** mit:
   - Screenshot der `profiles` Tabelle (Definition-Tab)
   - Fehlermeldung aus den Logs

## 📝 Checkliste

- [ ] `FIX_NOW.sql` im SQL Editor ausgeführt
- [ ] Alle Spalten in `profiles` Tabelle vorhanden
- [ ] App neu gestartet
- [ ] Registrierung getestet
- [ ] Neues Profil erscheint in `profiles` Tabelle

