# Cloud-Sync Verhalten

## Übersicht

Die App funktioniert **immer lokal**, unabhängig vom Cloud-Sync Status. Cloud-Sync ist eine **optionale** Funktion für Multi-Device-Sync und Backup.

## Verhalten bei Consent-Änderungen

### Cloud-Sync aktivieren (false → true)

Wenn ein Benutzer Cloud-Sync aktiviert:

1. **Lokale Daten werden hochgeladen**
   - Alle lokalen Day Logs
   - Alle lokalen Pausen
   - App-Profil
   - Wird automatisch in `updateProfileConsents()` durchgeführt

2. **Cloud-Daten werden geladen (falls vorhanden)**
   - Falls bereits Cloud-Daten existieren (z.B. von anderem Gerät)
   - Merge-Strategie: Lokale Daten haben Priorität, Cloud-Daten füllen Lücken

3. **Zwei-Wege-Sync wird aktiviert**
   - Alle zukünftigen Änderungen werden automatisch synchronisiert
   - Beim App-Start werden Cloud-Daten geladen

### Cloud-Sync deaktivieren (true → false)

Wenn ein Benutzer Cloud-Sync deaktiviert:

1. **Alle Cloud-Daten werden gelöscht**
   - Day Logs in Cloud
   - Pausen in Cloud
   - App-Profil in Cloud
   - Erfüllt DSGVO Art. 7 Abs. 3 (Recht auf Widerruf)

2. **App läuft weiterhin lokal**
   - Alle Daten bleiben lokal gespeichert (AsyncStorage)
   - App funktioniert normal weiter
   - Keine Datenverluste

3. **Zwei-Wege-Sync wird deaktiviert**
   - Keine weiteren Syncs zur Cloud
   - Keine Daten werden mehr hochgeladen

## Lokale Funktionalität

Die App funktioniert **vollständig lokal**, auch ohne Cloud-Sync:

- ✅ Alle Daten werden lokal in AsyncStorage gespeichert
- ✅ Alle Features funktionieren ohne Cloud-Sync
- ✅ Statistiken werden lokal berechnet
- ✅ Pausen werden lokal verwaltet
- ✅ Konsum-Tracking funktioniert lokal

**Cloud-Sync ist optional und nicht erforderlich für die App-Funktionalität.**

## Sync-Mechanismus

### Automatischer Sync

Daten werden automatisch synchronisiert, wenn:
- Cloud-Sync aktiviert ist (`consent_server_storage = true`)
- Daten geändert werden (Day Logs, Pausen, Profil)
- App gestartet wird (lädt Cloud-Daten)

### Sync-Strategie

**Beim Hochladen (Lokal → Cloud):**
- `upsert` wird verwendet (idempotent)
- Letzte Änderung gewinnt bei Konflikten
- Non-blocking (blockiert nicht die App)

**Beim Laden (Cloud → Lokal):**
- Lokale Daten haben Priorität
- Cloud-Daten füllen Lücken
- Merge-Strategie: Neueste Timestamps gewinnen

## Implementierungsdetails

### `updateProfileConsents()`

```typescript
// Wenn Consent aktiviert wird:
if (shouldUploadLocalData) {
  // 1. Lade lokale Daten aus Store
  // 2. Lade Cloud-Daten (falls vorhanden)
  // 3. Merge (lokale Daten haben Priorität)
  // 4. Upload alles zur Cloud
}

// Wenn Consent deaktiviert wird:
if (shouldDeleteCloudData) {
  // 1. Lösche alle Cloud-Daten
  // 2. App läuft weiterhin lokal
}
```

### Store-Integration

- `useApp` Store speichert alle Daten lokal (AsyncStorage)
- Sync-Funktionen prüfen Consent vor jedem Sync
- Wenn kein Consent: Kein Sync, aber App funktioniert normal

## Fehlerbehandlung

- Sync-Fehler werden geloggt, crashen aber nicht die App
- Wenn Upload fehlschlägt: App funktioniert weiterhin lokal
- Wenn Download fehlschlägt: App verwendet lokale Daten
- Benutzer kann später erneut versuchen zu synchronisieren

## Best Practices

1. **Immer lokal speichern**
   - Alle Daten werden zuerst lokal gespeichert
   - Cloud-Sync ist zusätzlich, nicht ersetzend

2. **Graceful Degradation**
   - App funktioniert auch ohne Internet
   - App funktioniert auch ohne Cloud-Sync
   - Sync ist optional und non-blocking

3. **Benutzer-Kontrolle**
   - Benutzer kann Cloud-Sync jederzeit aktivieren/deaktivieren
   - Keine Datenverluste bei Deaktivierung
   - Alle Daten bleiben lokal verfügbar

---

**Wichtig:** Die App ist so designed, dass sie **immer lokal funktioniert**. Cloud-Sync ist eine **Zusatzfunktion** für Multi-Device-Sync und Backup, aber **nicht erforderlich** für die Grundfunktionalität.

