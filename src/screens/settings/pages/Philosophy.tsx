import React from 'react';
import { View } from 'react-native';
import { ThemedView, ThemedText } from '../../../design/theme';
import { spacing } from '../../../design/tokens';

export default function Philosophy() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ padding: spacing.l, gap: spacing.m }}>
        <ThemedText kind="h2">Unsere Philosophie</ThemedText>
        <ThemedText>
          Hazeless unterstützt dich respektvoll und evidenzbasiert. Wir setzen auf
          realistische Ziele, positive Verstärkung und transparente Daten. Du
          bestimmst das Tempo – wir liefern Struktur und Motivation.
        </ThemedText>
      </View>
    </ThemedView>
  );
}
