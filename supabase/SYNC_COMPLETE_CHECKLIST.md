# Cloud-Sync Vollständigkeits-Checkliste

## ✅ Alle synchronisierten Daten (mit aktiviertem Cloud-Sync)

### 1. **Einkauf (Purchases)**
- ✅ Wird über `submitPurchase()` → `upsertDayLog()` → `syncDayLog()` synchronisiert
- ✅ Gespeichert in: `day_logs.money_spent_eur`
- ✅ Jeder Einkauf wird sofort synchronisiert

### 2. **Konsum (Consumption)**
- ✅ Wird über `submitConsumption()` → `upsertDayLog()` → `syncDayLog()` synchronisiert
- ✅ Gespeichert in: `day_logs.consumption_entries` (JSONB Array)
- ✅ Enthält: Gramm, Joints, Methode, Zeit, bezahlt von, Betrag
- ✅ Jeder Konsum-Eintrag wird sofort synchronisiert

### 3. **XP (Experience Points)**
- ✅ Wird über `xpEarned` in `day_logs` synchronisiert
- ✅ Synchronisiert bei:
  - `addXp()` - Direkte XP-Änderungen (z. B. Pausenbonus, Meilensteine)
  - `markTaskDone()` - Task-Completion mit XP
  - `upsertDayLog()` - Alle Day Log Updates
- ✅ Gespeichert in: `day_logs.xp_earned`

### 4. **Kalender (Day Logs)**
- ✅ Alle täglichen Daten werden in `day_logs` synchronisiert
- ✅ Gespeichert pro Tag (YYYY-MM-DD):
  - Konsum-Daten (Gramm, Joints, Geld, Minuten)
  - Check-in Daten (Stimmung, Verlangen, Schlaf, Notizen)
  - Test-Ergebnisse (Reaction, Stroop, Memory)
  - Tasks (erledigte Tasks)
  - XP (verdiente XP)
  - Notizen
- ✅ Jede Änderung wird sofort synchronisiert

### 5. **Statistiken**
- ✅ Werden aus synchronisierten Daten berechnet:
  - Aus `day_logs` (Konsum, Geld, XP)
  - Aus `pauses` (Pausen-Statistiken)
  - Aus `app_profiles` (Baseline, Timestamps)
- ✅ Keine separate Tabelle nötig - werden on-the-fly berechnet

### 6. **Test-Ergebnisse**
- ✅ **Reaction Test**: `upsertDayLog({ tests: { reactionMs } })` → synchronisiert
- ✅ **Stroop Test**: `upsertDayLog({ tests: { stroopAccuracy, stroopMeanRt, stroopInterference } })` → synchronisiert
- ✅ Gespeichert in: `day_logs.tests` (JSONB)

### 7. **Check-ins**
- ✅ Wird über `submitCheckin()` → `upsertDayLog()` → `syncDayLog()` synchronisiert
- ✅ Gespeichert in: `day_logs.checkin` (JSONB)
- ✅ Enthält: usedToday, amountGrams, cravings, mood, sleep, notes

### 8. **Pausen**
- ✅ Wird über `syncPause()` synchronisiert bei:
  - `startPause()` - Neue Pause
  - `endPause()` - Pause beendet
  - `syncPauseProgress()` - Automatisch abgeschlossen
  - Konsum während aktiver Pause (Pause wird abgebrochen)
- ✅ Gespeichert in: `pauses` Tabelle

### 9. **App Profile**
- ✅ Wird über `syncAppProfile()` synchronisiert bei:
  - `setProfile()` - Profil-Änderungen
  - `replaceProfile()` - Vollständiger Profil-Ersatz
  - Automatisch bei Konsum (aktualisiert `lastConsumptionAt`)
- ✅ Gespeichert in: `app_profiles` Tabelle

## 🔄 Sync-Mechanismus

Alle Sync-Funktionen:
- ✅ Prüfen automatisch, ob `consent_server_storage = true`
- ✅ Prüfen, ob Benutzer authentifiziert ist
- ✅ Sind non-blocking (blockieren nicht die App)
- ✅ Loggen Fehler, crashen aber nicht
- ✅ Verwenden `upsert` für idempotente Updates

## 📊 Datenstruktur in Supabase

### `day_logs` Tabelle
- `date` - Kalender-Datum (YYYY-MM-DD)
- `consumed_grams` - Konsumierte Gramm
- `consumed_joints` - Konsumierte Joints
- `money_spent_eur` - **Einkauf + Konsum-Ausgaben**
- `session_minutes` - Session-Minuten
- `consumption_entries` (JSONB) - **Alle Konsum-Einträge**
- `checkin` (JSONB) - Check-in Daten
- `tests` (JSONB) - **Test-Ergebnisse (Reaction, Stroop)**
- `tasks_done` (TEXT[]) - Erledigte Tasks
- `xp_earned` - **Verdiente XP**
- `notes` - Notizen

### `pauses` Tabelle
- Alle Pausen-Daten mit Statistiken

### `app_profiles` Tabelle
- Baseline-Werte, Timestamps, Einstellungen

## ✅ Fazit

**ALLE genannten Daten werden bereits vollständig synchronisiert:**
- ✅ Einkauf
- ✅ Konsum
- ✅ Statistiken (berechnet aus synchronisierten Daten)
- ✅ XP
- ✅ Kalender (alle Day Logs)

Keine weiteren Änderungen nötig!

