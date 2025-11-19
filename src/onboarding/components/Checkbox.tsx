import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface Props {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

export const Checkbox: React.FC<Props> = ({ label, value, onChange }) => (
  <Pressable onPress={() => onChange(!value)} style={styles.container}>
    <View style={[styles.box, value && styles.boxChecked]}>
      {value ? <View style={styles.dot} /> : null}
    </View>
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

const SIZE = 24;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  box: {
    width: SIZE,
    height: SIZE,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxChecked: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  dot: {
    width: SIZE / 2,
    height: SIZE / 2,
    borderRadius: SIZE / 4,
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.body,
    flex: 1,
  },
});
