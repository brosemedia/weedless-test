# DSGVO & USA-Datenschutz Compliance Analyse

## 📋 Zusammenfassung

**Status:** ⚠️ **Teilweise konform, aber kritische Verbesserungen erforderlich**

Die App hat eine gute Grundlage für Datenschutz-Compliance, aber es fehlen wichtige Funktionen für vollständige DSGVO- und USA-Konformität (CCPA/State Laws).

---

## ✅ Was bereits gut ist

### 1. **Row Level Security (RLS)**
- ✅ RLS ist auf allen Tabellen aktiviert (`profiles`, `app_profiles`, `day_logs`, `pauses`)
- ✅ Jeder Benutzer kann nur seine eigenen Daten sehen/ändern
- ✅ Policies sind korrekt implementiert mit `auth.uid() = user_id`

### 2. **Opt-in Consent System**
- ✅ `consent_server_storage` ist standardmäßig `false` (Opt-in)
- ✅ Separate Consent für Marketing (`marketing_opt_in`)
- ✅ Consent kann in den Einstellungen bearbeitet werden
- ✅ Klare Beschreibung der Datenverarbeitung im Consent-Screen

### 3. **Datenlokalisation**
- ✅ Dokumentation erwähnt "Servern in der EU" (Supabase)
- ✅ Foreign Keys mit `ON DELETE CASCADE` für automatische Löschung bei Account-Löschung

### 4. **Datenexport**
- ✅ Export-Funktion vorhanden (`ExportData.tsx`)
- ⚠️ Exportiert aber nur lokale Daten, nicht Cloud-Daten

### 5. **Verschlüsselung**
- ✅ Supabase verschlüsselt Daten automatisch (in Transit und at Rest)
- ✅ HTTPS für alle Verbindungen

---

## ❌ Kritische Probleme

### 1. **Keine automatische Datenlöschung bei Consent-Widerruf**
**Problem:** Wenn ein Benutzer `consent_server_storage` auf `false` setzt, werden die bereits gespeicherten Cloud-Daten **NICHT automatisch gelöscht**.

**DSGVO-Verstoß:** Art. 7 Abs. 3 DSGVO - Recht auf Widerruf der Einwilligung
**CCPA-Verstoß:** Recht auf Löschung

**Lösung erforderlich:**
```typescript
// In updateProfileConsents() sollte bei consent_server_storage = false
// automatisch alle Cloud-Daten gelöscht werden:
// - app_profiles
// - day_logs  
// - pauses
```

### 2. **Keine vollständige Account-Löschung**
**Problem:** Es gibt keine Funktion, um alle Benutzerdaten zu löschen (Recht auf Vergessenwerden).

**DSGVO-Verstoß:** Art. 17 DSGVO - Recht auf Löschung
**CCPA-Verstoß:** Recht auf Löschung

**Lösung erforderlich:**
- Funktion zum Löschen aller Benutzerdaten
- Löschung in allen Tabellen: `profiles`, `app_profiles`, `day_logs`, `pauses`
- Löschung des Auth-Accounts

### 3. **Export exportiert nur lokale Daten**
**Problem:** Die Export-Funktion exportiert nur lokale Daten, nicht die Cloud-Daten.

**DSGVO-Verstoß:** Art. 15 DSGVO - Recht auf Datenübertragbarkeit
**CCPA-Verstoß:** Recht auf Datenzugriff

**Lösung erforderlich:**
- Export sollte auch Cloud-Daten einschließen, wenn Consent gegeben ist
- Vollständiger Export aller gespeicherten Daten

### 4. **Keine Datenschutzerklärung**
**Problem:** Keine Datenschutzerklärung-Datei oder Link gefunden.

**DSGVO-Verstoß:** Art. 13/14 DSGVO - Informationspflichten
**CCPA-Verstoß:** Privacy Policy erforderlich

**Lösung erforderlich:**
- Datenschutzerklärung erstellen
- In der App verlinken (z.B. in Settings)
- Alle verarbeiteten Daten auflisten
- Zweck der Datenverarbeitung erklären
- Rechte der Benutzer erklären

### 5. **Keine Logging/Audit-Trail für Consent-Änderungen**
**Problem:** Es wird nicht protokolliert, wann und wie Consents geändert wurden.

**Empfehlung:** Für Compliance-Audits sollte dokumentiert werden:
- Wann wurde Consent gegeben?
- Wann wurde Consent widerrufen?
- IP-Adresse/Timestamp der Änderung

### 6. **Supabase-Region nicht verifiziert**
**Problem:** Die Supabase-URL ist hardcoded, aber es ist nicht klar, ob die Region tatsächlich EU ist.

**Lösung erforderlich:**
- In Supabase Dashboard prüfen: Settings → General → Region
- Sicherstellen, dass Region "EU" ist
- In Dokumentation festhalten

---

## ⚠️ Weitere Verbesserungen

### 1. **Datenminimierung**
- ✅ Nur notwendige Daten werden gespeichert
- ✅ Sensitive Daten (Konsum, Stimmung) werden nur mit Consent gespeichert

### 2. **Zweckbindung**
- ✅ Daten werden nur für den angegebenen Zweck (Cloud-Sync) verwendet
- ⚠️ Marketing-Consent ist getrennt (gut!)

### 3. **Speicherdauer**
- ⚠️ Keine automatische Löschung alter Daten
- **Empfehlung:** Retention Policy definieren (z.B. Daten nach 2 Jahren Inaktivität löschen)

### 4. **Datenweitergabe**
- ✅ Keine Datenweitergabe an Dritte (außer Supabase als Processor)
- ⚠️ Supabase DPA (Data Processing Agreement) sollte geprüft werden

### 5. **Technische Maßnahmen**
- ✅ Verschlüsselung (Supabase)
- ✅ RLS für Zugriffskontrolle
- ✅ Authentifizierung erforderlich

---

## 🔧 Empfohlene Implementierungen

### 1. **Automatische Datenlöschung bei Consent-Widerruf**

```typescript
// In src/api/profile.ts - updateProfileConsents()
export async function updateProfileConsents(params: {
  consent_server_storage?: boolean;
  marketing_opt_in?: boolean;
  notifications_enabled?: boolean;
}): Promise<SupabaseProfile | null> {
  // ... existing code ...
  
  // Wenn consent_server_storage auf false gesetzt wird, lösche alle Cloud-Daten
  if (params.consent_server_storage === false) {
    await deleteAllUserCloudData(user.id);
  }
  
  // ... rest of function ...
}

async function deleteAllUserCloudData(userId: string): Promise<void> {
  // Löschen in umgekehrter Reihenfolge (wegen Foreign Keys)
  await supabase.from('day_logs').delete().eq('user_id', userId);
  await supabase.from('pauses').delete().eq('user_id', userId);
  await supabase.from('app_profiles').delete().eq('user_id', userId);
}
```

### 2. **Account-Löschung**

```typescript
// Neue Funktion: src/api/profile.ts
export async function deleteAccount(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // 1. Alle Cloud-Daten löschen
  await deleteAllUserCloudData(user.id);
  
  // 2. Profil löschen
  await supabase.from('profiles').delete().eq('user_id', user.id);
  
  // 3. Auth-Account löschen
  await supabase.auth.admin.deleteUser(user.id); // Benötigt Service Role Key
  
  return true;
}
```

### 3. **Vollständiger Datenexport**

```typescript
// In src/screens/settings/pages/ExportData.tsx
export async function exportAllData(): Promise<string> {
  const localData = useStore.getState();
  
  // Wenn Consent gegeben, auch Cloud-Daten laden
  const profile = await fetchCurrentProfile();
  if (profile?.consent_server_storage) {
    const cloudData = await loadAllSyncData();
    return JSON.stringify({ local: localData, cloud: cloudData }, null, 2);
  }
  
  return JSON.stringify(localData, null, 2);
}
```

### 4. **Consent-Logging**

```sql
-- Neue Tabelle für Consent-Historie
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'server_storage' oder 'marketing'
  consent_value BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent logs"
  ON public.consent_logs
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 📝 Checkliste für vollständige Compliance

### DSGVO (EU)
- [x] Opt-in Consent System
- [x] RLS für Datenzugriff
- [x] Verschlüsselung
- [ ] **Automatische Löschung bei Consent-Widerruf** ❌
- [ ] **Vollständiger Datenexport** ⚠️
- [ ] **Account-Löschung** ❌
- [ ] **Datenschutzerklärung** ❌
- [ ] **Datenverarbeitungsvertrag mit Supabase** ⚠️ (prüfen)
- [ ] **Verzeichnis der Verarbeitungstätigkeiten** ❌

### CCPA / US State Laws
- [x] Opt-in für Marketing
- [ ] **Recht auf Löschung** ❌
- [ ] **Recht auf Datenzugriff** ⚠️ (teilweise)
- [ ] **Privacy Policy** ❌
- [ ] **"Do Not Sell" Option** ✅ (nicht relevant, da keine Datenverkauf)

---

## 🎯 Prioritäten

### 🔴 Hoch (kritisch für Compliance)
1. **Automatische Datenlöschung bei Consent-Widerruf**
2. **Account-Löschung implementieren**
3. **Datenschutzerklärung erstellen und verlinken**
4. **Vollständiger Datenexport (inkl. Cloud-Daten)**

### 🟡 Mittel (empfohlen)
5. Consent-Logging/Audit-Trail
6. Supabase-Region verifizieren
7. DPA mit Supabase prüfen

### 🟢 Niedrig (nice-to-have)
8. Retention Policy für alte Daten
9. Automatische Löschung nach Inaktivität

---

## 📚 Weitere Ressourcen

- [DSGVO Text](https://gdpr-info.eu/)
- [Supabase Security & Compliance](https://supabase.com/docs/guides/platform/security)
- [CCPA Compliance Guide](https://oag.ca.gov/privacy/ccpa)

---

**Erstellt:** 2025-01-20
**Nächste Überprüfung:** Nach Implementierung der kritischen Punkte

