import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { ThemedView, ThemedText } from '../../../design/theme';
import { spacing, colors } from '../../../design/tokens';

export default function Language() {
  const [lang, setLang] = useState<'de' | 'en'>('de');
  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ padding: spacing.l, gap: spacing.m }}>
        <ThemedText kind="h2">App-Sprache</ThemedText>
        {([
          { id: 'de', label: 'Deutsch' },
          { id: 'en', label: 'English' },
        ] as const).map((l) => (
          <Pressable key={l.id} onPress={() => setLang(l.id)} style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: colors.light.border,
            backgroundColor: lang === l.id ? colors.light.primaryMuted : 'white',
            borderRadius: 12,
          }}>
            <Text style={{ fontSize: 16 }}>{l.label}</Text>
          </Pressable>
        ))}
        <ThemedText muted>
          Sprachenumschaltung folgt – hier nur als Mock für das Layout.
        </ThemedText>
      </View>
    </ThemedView>
  );
}
