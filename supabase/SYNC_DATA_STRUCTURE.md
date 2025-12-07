# Cloud-Sync Datenstruktur

## Übersicht

Wenn der Nutzer der Cloud-Speicherung zugestimmt hat (`consent_server_storage = true`), werden folgende Daten verschlüsselt auf Supabase-Servern in der EU gespeichert, um einen reibungslosen Multi-Device-Betrieb zu ermöglichen:

## Zu synchronisierende Daten

### 1. **App Profile** (`app_profiles` Tabelle)
**Zweck:** App-spezifische Einstellungen und Baseline-Daten

**Gespeicherte Daten:**
- `price_per_gram` - Preis pro Gramm (€/g)
- `cost_per_joint` - Kosten pro Joint (€/Joint)
- `grams_per_day_baseline` - Baseline Gramm pro Tag
- `joints_per_day_baseline` - Baseline Joints pro Tag
- `avg_session_minutes` - Durchschnittliche Session-Minuten
- `start_timestamp` - Start-Zeitstempel (ms) - "konsumfrei seit"
- `last_consumption_at` - Letzter Konsum-Zeitstempel (ms)
- `locale` - Spracheinstellung (z.B. "de-DE")
- `version` - Schema-Version

**Warum wichtig:** Diese Daten sind essentiell für Berechnungen (Statistiken, Pausen-Stats, etc.) und müssen auf allen Geräten identisch sein.

---

### 2. **Day Logs** (`day_logs` Tabelle)
**Zweck:** Tägliche Tracking-Daten für jeden Tag

**Gespeicherte Daten pro Tag:**
- `date` - Datum (YYYY-MM-DD)
- **Konsum-Daten:**
  - `consumed_grams` - Konsumierte Gramm
  - `consumed_joints` - Konsumierte Joints
  - `money_spent_eur` - Ausgegebene Euros
  - `session_minutes` - Session-Minuten
  - `consumption_entries` (JSONB) - Array einzelner Konsum-Einträge mit Details (Zeit, Methode, etc.)
  
- **Check-in Daten** (JSONB):
  - `usedToday` - Heute konsumiert? (boolean)
  - `amountGrams` - Gramm konsumiert
  - `cravings0to10` - Verlangen (0-10)
  - `mood1to5` - Stimmung (1-5)
  - `sleepHours` - Schlafstunden
  - `notes` - Notizen
  - `recordedAt` - Aufnahme-Zeitstempel
  
- **Test-Ergebnisse** (JSONB):
  - `reactionMs` - Reaktionszeit
  - `memoryScore` - Gedächtnis-Score
  - `stroopAccuracy` - Stroop-Genauigkeit
  - `stroopMeanRt` - Stroop mittlere Reaktionszeit
  - `stroopInterference` - Stroop-Interferenz
  - `stroopTimestamp` - Test-Zeitstempel
  
- **Tasks & XP:**
  - `tasks_done` - Array von erledigten Task-IDs
  - `xp_earned` - Verdiente XP
  
- `notes` - Allgemeine Notizen zum Tag

**Warum wichtig:** Dies sind die Kern-Tracking-Daten. Ohne diese können Statistiken, Verläufe und Fortschritte nicht korrekt angezeigt werden.

---

### 3. **Pauses** (`pauses` Tabelle)
**Zweck:** Pausen-Tracking (aktiv, abgeschlossen, abgebrochen)

**Gespeicherte Daten pro Pause:**
- `start_date` - Start-Datum (YYYY-MM-DD)
- `end_date` - End-Datum (YYYY-MM-DD)
- `status` - Status: 'aktiv', 'abgeschlossen', 'abgebrochen'
- `created_at` - Erstellungs-Zeitstempel (ms)
- `start_timestamp` - Echtzeit-Start (ms)
- `end_timestamp` - Geplantes Ende (ms)
- `completed_at` - Abschluss-Zeitstempel (ms)
- `completed_status` - Abschluss-Status
- `stats` (JSONB) - Statistiken:
  - `savedMoney` - Gespartes Geld
  - `savedGrams` - Gesparte Gramm
  - `savedTimeHours` - Gesparte Stunden
- `xp_awarded_days` - Array von Datum-Keys, für die XP vergeben wurde

**Warum wichtig:** Pausen müssen auf allen Geräten synchronisiert werden, damit der Status korrekt angezeigt wird und keine doppelten Pausen erstellt werden.

---

## Daten, die NICHT synchronisiert werden

### Lokal bleiben (aus Datenschutzgründen):
- Onboarding-Daten (werden nur lokal gespeichert)
- Temporäre UI-States
- Cache-Daten
- Geräte-spezifische Einstellungen

---

## Sync-Strategie

### Push (Lokal → Server):
- Beim Speichern von Daten wird automatisch zu Supabase synchronisiert (non-blocking)
- Bei App-Start: Vollständiger Sync aller lokalen Daten

### Pull (Server → Lokal):
- Bei App-Start: Laden aller Daten vom Server
- Merge-Strategie: Server-Daten haben Priorität bei Konflikten (neueste `updated_at` gewinnt)

### Konfliktlösung:
- Bei Konflikten: Server-Version hat Priorität (neueste `updated_at`)
- Lokale Änderungen werden nicht überschrieben, wenn sie neuer sind

---

## Performance-Optimierungen

- **Indizes:** Auf `user_id`, `date`, `status` für schnelle Abfragen
- **JSONB:** Für flexible Datenstrukturen (Check-ins, Tests, etc.)
- **Upsert:** Verhindert Duplikate (UNIQUE Constraints)
- **Batch-Sync:** Mehrere Einträge in einer Transaktion

---

## Datenschutz

- **Verschlüsselung:** Supabase verschlüsselt Daten automatisch
- **RLS:** Row Level Security stellt sicher, dass Nutzer nur eigene Daten sehen
- **Opt-in:** Nur bei expliziter Zustimmung (`consent_server_storage = true`)
- **Löschung:** Bei Widerruf können alle Daten gelöscht werden

