# App Store Upload - Fehlerbehebung

## Problem 1: Unsupported SDK/Xcode Version

**Fehler:** "Unsupported SDK or Xcode version"

**Lösung:**
1. Prüfe deine Xcode-Version:
   ```bash
   xcodebuild -version
   ```

2. Stelle sicher, dass du eine **stabile Version** (keine Beta) verwendest:
   - Öffne Xcode → About Xcode, um die Version zu sehen
   - Besuche https://developer.apple.com/news/releases für unterstützte Versionen
   - Falls du eine Beta-Version verwendest, installiere die neueste stabile Version

3. Nach der Installation einer neuen Xcode-Version:
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

4. **Wichtig:** Baue deine App neu mit der stabilen Xcode-Version:
   - Lösche den Build-Ordner: `rm -rf ios/build`
   - Führe `pod install` im `ios/` Verzeichnis aus
   - Erstelle ein neues Archive in Xcode

## Problem 2: Fehlende dSYM-Dateien

**Fehler:** "The archive did not include a dSYM for React.framework / ReactNativeDependencies.framework / hermes.framework"

**Lösung (bereits implementiert):**
Die Build-Einstellungen wurden aktualisiert, um dSYM-Dateien zu generieren:
- `DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym"` wurde für Release-Builds hinzugefügt
- `STRIP_INSTALLED_PRODUCT = NO` wurde gesetzt, um Symbole zu behalten

**Zusätzliche Schritte:**

1. **Pods neu installieren:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Build-Ordner löschen:**
   ```bash
   rm -rf ios/build
   ```

3. **Neues Archive erstellen:**
   - Öffne `ios/Hazeless.xcworkspace` in Xcode (nicht .xcodeproj!)
   - Wähle "Any iOS Device" als Ziel
   - Product → Archive
   - Stelle sicher, dass "Include bitcode" deaktiviert ist (bereits gesetzt: `ENABLE_BITCODE = NO`)

4. **dSYM-Dateien prüfen:**
   Nach dem Archive kannst du prüfen, ob dSYM-Dateien vorhanden sind:
   - Im Organizer (Window → Organizer) → Archives
   - Rechtsklick auf dein Archive → "Show in Finder"
   - Im Finder: Rechtsklick auf die .xcarchive → "Show Package Contents"
   - Prüfe, ob im `dSYMs` Ordner die Dateien vorhanden sind

## Alternative: EAS Build verwenden (Empfohlen für Expo)

Falls du weiterhin Probleme hast, erwäge die Verwendung von EAS Build:

1. **EAS CLI installieren:**
   ```bash
   npm install -g eas-cli
   ```

2. **EAS konfigurieren:**
   ```bash
   eas build:configure
   ```

3. **Build erstellen:**
   ```bash
   eas build --platform ios
   ```

EAS Build kümmert sich automatisch um dSYM-Dateien und verwendet die richtige Xcode-Version.

## Checkliste vor dem Upload

- [ ] Xcode-Version ist stabil (keine Beta)
- [ ] `pod install` wurde ausgeführt
- [ ] Build-Ordner wurde gelöscht
- [ ] Neues Archive wurde erstellt
- [ ] dSYM-Dateien sind im Archive vorhanden
- [ ] Bundle Identifier ist korrekt (nicht `-dev` für Production!)
- [ ] Code Signing ist korrekt konfiguriert

## Wichtiger Hinweis

Dein aktueller Bundle Identifier ist `com.brosemedia.Hazeless-dev`. Für die App Store-Version solltest du einen Production-Bundle Identifier verwenden (ohne `-dev`). Passe dies in `app.json` und den Xcode Build Settings an.

