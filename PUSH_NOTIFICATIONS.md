# Push-Benachrichtigungen

Diese Anleitung erklärt, wie du Push-Benachrichtigungen in der Hazeless-App senden kannst.

## Setup

### 1. Datenbank-Migration ausführen

Führe die SQL-Migration in Supabase aus:

```sql
-- Führe supabase/migration-add-push-tokens.sql im Supabase SQL Editor aus
```

Diese Migration erstellt die `push_tokens` Tabelle, in der die Expo Push Tokens der Benutzer gespeichert werden.

### 2. Automatische Token-Registrierung

Die Push-Token-Registrierung erfolgt automatisch:
- Beim Login eines Benutzers
- Beim App-Start (wenn der Benutzer bereits angemeldet ist)

Die Token-Registrierung ist in `src/contexts/AuthContext.tsx` integriert.

## Push-Benachrichtigungen senden

### Client-seitig (aus der App heraus)

```typescript
import { sendPushNotification, sendPushNotificationToCurrentUser } from './src/lib/pushNotifications';

// Benachrichtigung an den aktuellen Benutzer senden
await sendPushNotificationToCurrentUser(
  'Titel der Benachrichtigung',
  'Text der Benachrichtigung',
  { customData: 'optional' } // Optionale Daten
);

// Benachrichtigung an mehrere Benutzer senden
await sendPushNotification(
  ['user-id-1', 'user-id-2'],
  'Titel',
  'Text',
  { customData: 'optional' }
);
```

### Server-seitig (empfohlen für Produktion)

Für Produktionsumgebungen solltest du Push-Benachrichtigungen über einen Server senden. Hier sind zwei Optionen:

#### Option 1: Supabase Edge Function

Erstelle eine Supabase Edge Function (`supabase/functions/send-push-notification/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { userIds, title, body, data } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Hole Push-Tokens aus der Datenbank
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .in('user_id', userIds);
    
    if (error) throw error;
    
    // Erstelle Nachrichten
    const messages = tokens.map(token => ({
      to: token.expo_push_token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }));
    
    // Sende über Expo Push Notification Service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    
    const result = await response.json();
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

#### Option 2: Node.js/Express Server

```typescript
import { createClient } from '@supabase/supabase-js';

async function sendPushNotification(userIds: string[], title: string, body: string, data?: any) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Hole Push-Tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .in('user_id', userIds);
  
  // Erstelle Nachrichten
  const messages = tokens.map(token => ({
    to: token.expo_push_token,
    sound: 'default',
    title,
    body,
    data: data ?? {},
  }));
  
  // Sende über Expo Push Notification Service
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  
  return await response.json();
}
```

## Verfügbare Funktionen

### `registerPushToken()`
Registriert den Push-Token für den aktuellen Benutzer. Wird automatisch beim Login aufgerufen.

### `unregisterPushToken()`
Entfernt den Push-Token. Wird automatisch beim Logout aufgerufen.

### `sendPushNotification(userIds, title, body, data?)`
Sendet eine Push-Benachrichtigung an mehrere Benutzer.

### `sendPushNotificationToCurrentUser(title, body, data?)`
Sendet eine Push-Benachrichtigung an den aktuell angemeldeten Benutzer.

### `initializePushNotifications()`
Initialisiert Push-Benachrichtigungen (Token-Registrierung + Event-Listener). Wird automatisch beim Login aufgerufen.

## Benachrichtigungen empfangen

Die App hört automatisch auf eingehende Benachrichtigungen. Du kannst in `src/lib/pushNotifications.ts` die Event-Listener anpassen, um auf Benachrichtigungen zu reagieren:

```typescript
// In initializePushNotifications()
Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;
  // Navigation oder andere Aktionen basierend auf den Daten
});
```

## Wichtige Hinweise

1. **Berechtigungen**: Die App fragt automatisch nach Benachrichtigungsberechtigungen beim ersten Versuch, den Token zu registrieren.

2. **Produktion**: Für Produktionsumgebungen solltest du Push-Benachrichtigungen über einen Server senden, nicht direkt aus der App.

3. **Expo Push Notification Service**: Die App verwendet den Expo Push Notification Service. Für native Builds (EAS Build) musst du möglicherweise zusätzliche Konfigurationen vornehmen.

4. **Token-Aktualisierung**: Expo Push Tokens können sich ändern. Die App aktualisiert den Token automatisch bei jedem Login.

## Beispiel: Benachrichtigung bei Meilenstein

```typescript
// In deinem Code, z.B. wenn ein Meilenstein erreicht wird
import { sendPushNotificationToCurrentUser } from './src/lib/pushNotifications';

// Nach 7 Tagen Pause
await sendPushNotificationToCurrentUser(
  '🎉 Meilenstein erreicht!',
  'Du hast 7 Tage geschafft - weiter so!',
  { type: 'milestone', days: 7 }
);
```

