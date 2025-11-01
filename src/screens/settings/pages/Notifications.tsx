import React, { useState } from 'react';
import { View, Switch } from 'react-native';
import { ThemedView, ThemedText } from '../../../design/theme';
import { spacing } from '../../../design/tokens';

export default function Notifications() {
  const [reminders, setReminders] = useState(true);
  const [tips, setTips] = useState(false);

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ padding: spacing.l, gap: spacing.l }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText>Erinnerungen</ThemedText>
          <Switch value={reminders} onValueChange={setReminders} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText>Tipps & Motivation</ThemedText>
          <Switch value={tips} onValueChange={setTips} />
        </View>
        <ThemedText muted>
          Hinweis: Diese Schalter sind aktuell lokal und dienen dem Layout.
        </ThemedText>
      </View>
    </ThemedView>
  );
}
