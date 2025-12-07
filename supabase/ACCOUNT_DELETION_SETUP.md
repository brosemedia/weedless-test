# Account-Löschung Setup

Diese Anleitung erklärt, wie die vollständige Account-Löschung (inkl. `auth.users`) eingerichtet wird.

## Problem

Wenn ein User seinen Account löscht, werden alle Daten gelöscht, aber der `auth.users` Eintrag bleibt bestehen. Das bedeutet, der User kann sich danach noch einloggen.

## Lösung

Es gibt zwei Möglichkeiten:

### Option 1: Database Trigger (Empfohlen)

Führe die SQL-Migration aus:

```sql
-- Führe supabase/migration-delete-user-on-profile-delete.sql im Supabase SQL Editor aus
```

Diese Migration erstellt:
- Eine Funktion `delete_auth_user_on_profile_delete()`, die den `auth.users` Eintrag löscht
- Einen Trigger, der diese Funktion automatisch aufruft, wenn ein Profil gelöscht wird

**Vorteile:**
- Funktioniert automatisch
- Keine zusätzliche Infrastruktur nötig
- DSGVO-konform

**Nachteile:**
- Erfordert, dass die Funktion die richtigen Permissions hat
- Falls Supabase den Zugriff auf `auth.users` nicht erlaubt, funktioniert es nicht

### Option 2: Supabase Edge Function (Fallback)

Falls Option 1 nicht funktioniert, erstelle eine Supabase Edge Function:

1. Erstelle eine neue Edge Function in Supabase:
   - Name: `delete-user`
   - Pfad: `supabase/functions/delete-user/index.ts`

2. Code für die Edge Function:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Some Supabase UIs block names like SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
    // Use fallbacks `URL` and `SERVICE_ROLE_KEY` if the standard names are not allowed.
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Delete the user (requires service role)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (error) {
      console.error('Error deleting user:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

3. Passe `src/api/profile.ts` an, um die Edge Function aufzurufen:

```typescript
// In deleteAccount(), nach dem Löschen des Profils:
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const { error: edgeError } = await supabase.functions.invoke('delete-user', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  
  if (edgeError) {
    console.error('Error calling delete-user function:', edgeError);
  }
}
```

## Testing

1. Erstelle einen Test-Account
2. Melde dich an
3. Gehe zu Einstellungen → Account löschen
4. Bestätige die Löschung
5. Versuche, dich mit dem gelöschten Account anzumelden
6. **Erwartetes Ergebnis:** Login sollte fehlschlagen (User existiert nicht mehr)

## Troubleshooting

### Problem: Trigger funktioniert nicht

**Symptom:** User kann sich nach Account-Löschung noch einloggen

**Lösung:**
1. Prüfe, ob die Funktion existiert:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'delete_auth_user_on_profile_delete';
   ```
2. Prüfe, ob der Trigger existiert:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_profile_deleted_delete_auth_user';
   ```
3. Prüfe die Permissions:
   ```sql
   SELECT proname, proowner, prosecdef FROM pg_proc WHERE proname = 'delete_auth_user_on_profile_delete';
   ```
   `prosecdef` sollte `true` sein (SECURITY DEFINER)

4. Falls die Funktion nicht funktioniert, verwende Option 2 (Edge Function)

### Problem: Edge Function funktioniert nicht

**Symptom:** Edge Function gibt Fehler zurück

**Lösung:**
1. Prüfe die Logs in Supabase Dashboard → Edge Functions → delete-user → Logs
2. Stelle sicher, dass `SUPABASE_SERVICE_ROLE_KEY` als Environment Variable gesetzt ist
3. Prüfe, ob die Function richtig deployed ist

## Wichtige Hinweise

- **DSGVO-Konformität:** Diese Implementierung erfüllt Art. 17 (Recht auf Löschung)
- **Irreversibel:** Account-Löschungen können nicht rückgängig gemacht werden
- **Backup:** Stelle sicher, dass wichtige Daten vorher exportiert werden können
