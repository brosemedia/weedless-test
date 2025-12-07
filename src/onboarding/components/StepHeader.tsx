import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, typography } from '../../../src/design/tokens';

interface Props {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
}

export const StepHeader: React.FC<Props> = ({ title, subtitle, step, total }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.container}>
      <Text style={[styles.counter, { color: colors.textMuted }]}>
        {step} / {total}
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.l,
  },
  counter: {
    ...typography.variants.label,
    marginBottom: spacing.xs,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.variants.h1,
    marginBottom: spacing.xs,
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    ...typography.variants.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
