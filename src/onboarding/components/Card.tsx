import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';

export const Card: React.FC<ViewProps> = ({ style, ...rest }) => (
  <View style={[styles.card, style]} {...rest} />
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
});
