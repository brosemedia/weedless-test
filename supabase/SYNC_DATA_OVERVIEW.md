# Multi-Device Sync - Datenübersicht

## Welche Daten werden synchronisiert?

Wenn der Nutzer `consent_server_storage = true` gesetzt hat, werden folgende Daten verschlüsselt auf Supabase-Servern in der EU gespeichert:

### 1. **App Profile** (`app_profiles` Tabelle)
**Zweck**: Konsum-Baseline und wichtige Timestamps für Multi-Device-Sync

- `price_per_gram` - Preis pro Gramm (€/g)
- `cost_per_joint` - Kosten pro Joint (€)
- `grams_per_day_baseline` - Baseline Gramm pro Tag
- `joints_per_day_baseline` - Baseline Joints pro Tag
- `avg_session_minutes` - Durchschnittliche Session-Minuten
- `start_timestamp` - **WICHTIG**: Start-Timestamp (ms) - "konsumfrei seit"
- `last_consumption_at` - **WICHTIG**: Letzter Konsum-Timestamp (ms)
- `locale` - Spracheinstellung
- `version` - Schema-Version

**Warum wichtig**: Diese Daten sind essentiell für die Berechnung von Statistiken, Pausen-Fortschritt und Meilensteinen auf allen Geräten.

### 2. **Day Logs** (`day_logs` Tabelle)
**Zweck**: Tägliche Tracking-Daten für jeden Tag

- `date` - Datum (YYYY-MM-DD)
- `consumed_grams` - Konsumierte Gramm
- `consumed_joints` - Konsumierte Joints
- `money_spent_eur` - Ausgegebenes Geld (€)
- `session_minutes` - Session-Minuten
- `checkin` (JSONB) - Check-in Daten:
  - `usedToday` - Heute konsumiert?
  - `amountGrams` - Gramm
  - `cravings0to10` - Verlangen (0-10)
  - `mood1to5` - Stimmung (1-5)
  - `sleepHours` - Schlafstunden
  - `notes` - Notizen
  - `recordedAt` - Aufzeichnungszeitpunkt
- `consumption_entries` (JSONB) - Array von Konsum-Einträgen
- `tests` (JSONB) - Test-Ergebnisse (Reaktionszeit, Memory, Stroop)
- `tasks_done` - Array von erledigten Task-IDs
- `xp_earned` - Verdiente XP
- `notes` - Allgemeine Notizen

**Warum wichtig**: Ermöglicht vollständige Historie und Statistiken auf allen Geräten.

### 3. **Pauses** (`pauses` Tabelle)
**Zweck**: Pausen-Verwaltung mit Status und Statistiken

- `id` - Eindeutige Pause-ID
- `start_date` / `end_date` - Datum (YYYY-MM-DD)
- `status` - Status: 'aktiv', 'abgeschlossen', 'abgebrochen'
- `start_timestamp` / `end_timestamp` - Echtzeit-Timestamps (ms)
- `completed_at` - Abschluss-Timestamp
- `stats` (JSONB) - Statistiken:
  - `savedMoney` - Gespartes Geld
  - `savedGrams` - Gesparte Gramm
  - `savedTimeHours` - Gesparte Stunden
- `xp_awarded_days` - Array von Datum-Keys, für die XP vergeben wurde

**Warum wichtig**: Pausen müssen auf allen Geräten synchronisiert werden, damit der Fortschritt korrekt angezeigt wird.

## Was wird NICHT synchronisiert?

- **Onboarding-Daten**: Werden nur lokal gespeichert (AsyncStorage)
- **UI-State**: Quick Actions Hidden Keys, Header Accessory Height, etc.
- **Temporäre Daten**: Celebration IDs, etc.

## Sync-Strategie

1. **Echtzeit-Sync**: Beim Erstellen/Ändern von Daten wird sofort synchronisiert (non-blocking)
2. **Beim App-Start**: Alle Daten werden beim Start geladen, wenn Consent gegeben ist
3. **Konfliktlösung**: `upsert` mit `onConflict` - letzte Änderung gewinnt (kann später verbessert werden)

## Datenschutz

- **Verschlüsselung**: Supabase verschlüsselt Daten automatisch
- **RLS**: Row Level Security stellt sicher, dass Nutzer nur ihre eigenen Daten sehen
- **Opt-in**: Daten werden NUR synchronisiert, wenn `consent_server_storage = true`
- **Löschung**: Bei Widerruf des Consents können alle Daten gelöscht werden

## Nächste Schritte

1. SQL-Migration ausführen: `supabase/migration-create-sync-tables.sql`
2. Sync-Funktionen testen
3. Optional: Konfliktlösung verbessern (z.B. Timestamp-basiert)

