# DSGVO/CCPA Compliance - Implementierungsübersicht

## ✅ Implementierte Funktionen

### 1. Automatische Datenlöschung bei Consent-Widerruf ✅

**Datei:** `src/api/profile.ts`

- Wenn `consent_server_storage` auf `false` gesetzt wird, werden automatisch alle Cloud-Daten gelöscht:
  - `day_logs`
  - `pauses`
  - `app_profiles`
- Erfüllt DSGVO Art. 7 Abs. 3 (Recht auf Widerruf der Einwilligung)

**Funktion:** `deleteAllUserCloudData(userId: string)`

### 2. Account-Löschung ✅

**Dateien:**
- `src/api/profile.ts` - `deleteAccount()` Funktion
- `src/screens/settings/pages/DeleteAccount.tsx` - UI für Account-Löschung

**Features:**
- Löscht alle Cloud-Daten
- Löscht Profil
- Meldet Benutzer ab
- Doppelte Bestätigung zur Vermeidung versehentlicher Löschung
- Erfüllt DSGVO Art. 17 (Recht auf Löschung / "Right to be forgotten")

**Hinweis:** Die tatsächliche Löschung des `auth.users` Eintrags erfordert Admin-Rechte. Dies kann über:
- Supabase Edge Function mit Service Role Key
- Oder manuell im Supabase Dashboard erfolgen

### 3. Vollständiger Datenexport ✅

**Datei:** `src/screens/settings/pages/ExportData.tsx`

**Features:**
- Exportiert lokale Daten
- Exportiert Cloud-Daten (wenn Consent gegeben)
- JSON-Format über System Share Sheet
- Erfüllt DSGVO Art. 15 (Recht auf Auskunft) und Art. 20 (Recht auf Datenübertragbarkeit)

### 4. Consent-Logging ✅

**Datei:** `supabase/migration-add-consent-logging.sql`

**Features:**
- Tabelle `consent_logs` für Audit-Trail
- Protokolliert alle Consent-Änderungen
- RLS aktiviert (Benutzer sehen nur eigene Logs)
- Erfüllt DSGVO Art. 7 (Nachweis der Einwilligung)

**Migration ausführen:**
```sql
-- In Supabase SQL Editor ausführen:
-- supabase/migration-add-consent-logging.sql
```

## 📋 Nächste Schritte

### 1. SQL-Migration ausführen
```bash
# In Supabase Dashboard → SQL Editor:
# migration-add-consent-logging.sql ausführen
```

### 2. Account-Löschung verbessern (optional)

Für vollständige Account-Löschung (inkl. `auth.users`), eine Supabase Edge Function erstellen:

```typescript
// supabase/functions/delete-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId } = await req.json()
  
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Delete user (requires service role)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  
  return new Response(
    JSON.stringify({ success: !error, error }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

Dann in `deleteAccount()` die Edge Function aufrufen.

### 3. Datenschutzerklärung erstellen

Eine Datenschutzerklärung sollte erstellt und in der App verlinkt werden:

**Empfohlene Inhalte:**
- Welche Daten werden gespeichert?
- Zweck der Datenverarbeitung
- Rechtsgrundlage (Einwilligung)
- Rechte der Benutzer (Löschung, Export, etc.)
- Kontaktdaten des Verantwortlichen
- Dauer der Speicherung

**Verlinkung:** In Settings → Datenschutz & Einwilligungen

### 4. Supabase-Region verifizieren

In Supabase Dashboard prüfen:
- Settings → General → Region
- Sicherstellen, dass Region "EU" ist
- In Dokumentation festhalten

## 🔍 Testing Checkliste

- [ ] Consent-Widerruf testen (Cloud-Daten sollten gelöscht werden)
- [ ] Account-Löschung testen (alle Daten sollten gelöscht werden)
- [ ] Datenexport testen (sollte lokale + Cloud-Daten enthalten)
- [ ] Consent-Logging testen (Logs sollten erstellt werden)
- [ ] RLS testen (Benutzer sollten nur eigene Daten sehen)

## 📚 Rechtliche Hinweise

Diese Implementierung erfüllt die grundlegenden Anforderungen von:
- **DSGVO (EU):** Art. 7, 15, 17, 20
- **CCPA (Kalifornien):** Recht auf Löschung, Datenzugriff

**Wichtig:** 
- Diese Implementierung ist eine technische Lösung
- Rechtliche Beratung wird empfohlen
- Datenschutzerklärung muss noch erstellt werden
- Verzeichnis der Verarbeitungstätigkeiten sollte erstellt werden

## 🎯 Compliance-Status

| Anforderung | Status | Implementierung |
|------------|--------|-----------------|
| Opt-in Consent | ✅ | `consent_server_storage` default `false` |
| Automatische Löschung bei Widerruf | ✅ | `deleteAllUserCloudData()` |
| Account-Löschung | ✅ | `deleteAccount()` + UI |
| Datenexport | ✅ | Erweitert um Cloud-Daten |
| Consent-Logging | ✅ | `consent_logs` Tabelle |
| RLS | ✅ | Auf allen Tabellen aktiviert |
| Datenschutzerklärung | ❌ | Noch zu erstellen |
| DPA mit Supabase | ⚠️ | Prüfen ob vorhanden |

---

**Erstellt:** 2025-01-20
**Status:** Implementierung abgeschlossen, Migration ausstehend

