import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from './Chip';
import { spacing } from '../theme';
import type { Unit } from '../types';

interface Option {
  label: string;
  value: Unit;
}

interface Props {
  value: Unit;
  onChange: (next: Unit) => void;
  options: Option[];
}

export const UnitToggle: React.FC<Props> = ({ value, onChange, options }) => (
  <View style={styles.container}>
    {options.map((option) => (
      <Chip
        key={option.value}
        label={option.label}
        active={value === option.value}
        onPress={() => onChange(option.value)}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
});
