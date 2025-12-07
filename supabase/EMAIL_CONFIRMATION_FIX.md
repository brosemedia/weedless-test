# E-Mail-Bestätigung Problem beheben

## Problem
Die E-Mail-Bestätigung ist abgelaufen oder der Link ist ungültig.

## Lösung 1: E-Mail-Bestätigung in Supabase deaktivieren (für Entwicklung)

### Schritt 1: Supabase Dashboard öffnen
1. Gehen Sie zu: https://supabase.com/dashboard/project/ajkqtxecaxkuzpavvsoq
2. Klicken Sie im linken Menü auf **"Authentication"** (Authentifizierung)

### Schritt 2: E-Mail-Bestätigung deaktivieren
1. Klicken Sie auf **"Providers"** (Anbieter)
2. Scrollen Sie zu **"Email"**
3. Deaktivieren Sie **"Confirm email"** (E-Mail bestätigen)
4. Klicken Sie auf **"Save"** (Speichern)

**Jetzt können sich Benutzer registrieren, ohne die E-Mail bestätigen zu müssen!**

## Lösung 2: Neue Bestätigungs-E-Mail anfordern

Falls Sie die E-Mail-Bestätigung behalten möchten:

1. **In der App:**
   - Versuchen Sie, sich mit Ihrer E-Mail und Passwort anzumelden
   - Falls das nicht funktioniert, registrieren Sie sich erneut mit derselben E-Mail
   - Eine neue Bestätigungs-E-Mail wird gesendet

2. **Manuell in Supabase:**
   - Gehen Sie zu **Authentication** → **Users**
   - Finden Sie Ihren Benutzer
   - Klicken Sie auf die drei Punkte → **"Resend confirmation email"**

## Lösung 3: Benutzer manuell bestätigen (für Tests)

1. Gehen Sie zu **Authentication** → **Users**
2. Finden Sie Ihren Benutzer
3. Klicken Sie auf den Benutzer
4. Setzen Sie **"Email Confirmed"** auf **"Yes"**
5. Klicken Sie auf **"Save"**

**Jetzt können Sie sich anmelden!**

## Lösung 4: E-Mail-Bestätigung in der App umgehen

Die App wurde bereits so konfiguriert, dass sie auch ohne E-Mail-Bestätigung funktioniert. Nach der Registrierung können Sie sich direkt anmelden, auch wenn die E-Mail noch nicht bestätigt ist.

## Empfehlung für Entwicklung

**Für Entwicklung/Testing:** Deaktivieren Sie die E-Mail-Bestätigung (Lösung 1)
- Schneller
- Einfacher zu testen
- Keine E-Mails nötig

**Für Produktion:** Aktivieren Sie die E-Mail-Bestätigung wieder
- Sicherer
- Verhindert Spam-Registrierungen

## Prüfen, ob es funktioniert

1. Deaktivieren Sie E-Mail-Bestätigung in Supabase (Lösung 1)
2. Registrieren Sie einen neuen Benutzer in der App
3. ✅ Sie sollten sich direkt anmelden können, ohne E-Mail zu bestätigen

