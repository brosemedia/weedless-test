import React from 'react';
import { View } from 'react-native';
import { ThemedText, PrimaryButton } from '../design/theme';
import { spacing, radius } from '../design/tokens';
import { useTheme } from '../theme/useTheme';

type ReadingTipCardProps = {
  weakestMetric: 'craving' | 'withdrawal' | 'sleep';
  onPress: () => void;
};

function missionTitle(key: 'craving' | 'withdrawal' | 'sleep'): string {
  if (key === 'craving') return 'Suchtverlagerungen verstehen & bekämpfen';
  if (key === 'withdrawal') return 'THC-Abbau im Körper: Was passiert wann?';
  return 'Entzugssymptome leichter durchstehen';
}

function missionDescription(key: 'craving' | 'withdrawal' | 'sleep'): string {
  if (key === 'craving') return 'Deine größte Baustelle ist gerade das Verlangen – dieser Artikel hilft dir konkret dabei, Suchtverlagerungen zu erkennen und zu bewältigen.';
  if (key === 'withdrawal') return 'Deine größte Baustelle sind Entzugssymptome – dieser Artikel erklärt dir, was im Körper passiert und wie du damit umgehst.';
  return 'Deine größte Baustelle ist der Schlaf – dieser Artikel zeigt dir, wie du Entzugssymptome leichter durchstehst und besser schläfst.';
}

export function ReadingTipCard({ weakestMetric, onPress }: ReadingTipCardProps) {
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <View
      style={{
        backgroundColor: palette.navy,
        borderRadius: radius.l,
        padding: spacing.xl,
        gap: spacing.m as any,
      }}
    >
      <ThemedText kind="h2" style={{ color: 'white' }}>
        Lesetipp für heute
      </ThemedText>
      <ThemedText style={{ color: 'white', marginBottom: spacing.s as any }}>
        {missionDescription(weakestMetric)}
      </ThemedText>
      <PrimaryButton
        title={`Artikel zu "${missionTitle(weakestMetric)}" lesen`}
        onPress={onPress}
      />
    </View>
  );
}

