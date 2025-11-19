import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { ProgressBar } from './ProgressBar';

interface Props {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
}

export const StepHeader: React.FC<Props> = ({ title, subtitle, step, total }) => {
  const progress = total > 0 ? step / total : 0;
  return (
    <View style={styles.container}>
      <Text style={styles.counter}>{`${step} / ${total}`}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <ProgressBar progress={progress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  counter: {
    ...typography.subheading,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
});
