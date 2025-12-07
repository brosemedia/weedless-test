import React from 'react';
import { Card, ThemedText, PrimaryButton } from '../design/theme';
import { spacing } from '../design/tokens';
import { useTheme } from '../theme/useTheme';

type DailyTrackCtaCardProps = {
  onPress: () => void;
};

export function DailyTrackCtaCard({ onPress }: DailyTrackCtaCardProps) {
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <Card
      style={{
        borderWidth: 2,
        borderColor: palette.primary,
        padding: spacing.xl as any,
        minHeight: 140,
        justifyContent: 'center',
        gap: spacing.m as any,
      }}
    >
      <ThemedText kind="label" style={{ color: palette.text }}>
        Daily Tracken
      </ThemedText>
      <ThemedText kind="h2" style={{ color: palette.text }}>
        Wie geht's dir heute?
      </ThemedText>
      <PrimaryButton title="Tracken starten" onPress={onPress} />
    </Card>
  );
}

