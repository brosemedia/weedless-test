import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { aggregate } from '../lib/stats';
import { ThemedView, ThemedText, SectionHeader, Card, ProgressBar } from '../design/theme';
import { spacing } from '../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';

export default function Stats() {
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);
  const [range, setRange] = useState<'7' | '30' | 'all'>('7');
  const insets = useSafeAreaInsets();
  useHeaderTransparency();

  const data = range === '7'
    ? aggregate(profile, diary, 7)
    : range === '30'
    ? aggregate(profile, diary, 30)
    : aggregate(profile, diary, 'all');

  const progress = profile.savingGoal
    ? Math.min(1, data.moneySaved / profile.savingGoal.targetAmount)
    : 0;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: spacing.xl as any,
          paddingTop: insets.top + HEADER_TOTAL_HEIGHT,
          paddingBottom: Math.max(spacing.l as any, insets.bottom),
          gap: spacing.m as any,
        }}
      >
        <SectionHeader title="Statistiken" subtitle="Sieh deinen Fortschritt" />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="7 Tage" onPress={() => setRange('7')} />
          <Button title="30 Tage" onPress={() => setRange('30')} />
          <Button title="Gesamt" onPress={() => setRange('all')} />
        </View>

        <Card>
          <ThemedText>{`Baseline: ${data.baselineTotal.toFixed(2)}${profile.baseline.unit}`}</ThemedText>
          <ThemedText>{`Konsumiert: ${data.actualTotal.toFixed(2)}${profile.baseline.unit}`}</ThemedText>
          <ThemedText>{`Vermieden: ${data.avoided.toFixed(2)}${profile.baseline.unit}`}</ThemedText>
          <ThemedText>{`Gespart: ${data.moneySaved.toFixed(2)}${profile.currency}`}</ThemedText>
        </Card>

        <Card>
          <ThemedText kind="label" muted>Sparziel</ThemedText>
          <ThemedText kind="h2" style={{ marginVertical: 6 }}>
            {profile.savingGoal
              ? `${profile.savingGoal.title} (${data.moneySaved.toFixed(0)} / ${profile.savingGoal.targetAmount.toFixed(0)} ${profile.currency})`
              : 'Kein Sparziel gesetzt'}
          </ThemedText>
          <ProgressBar value={progress} />
        </Card>
      </View>
    </ThemedView>
  );
}
