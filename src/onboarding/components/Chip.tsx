import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const Chip: React.FC<ChipProps> = ({ label, active, onPress, disabled, icon }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.base,
      active && styles.active,
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
    ]}
  >
    <View style={styles.content}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={active ? colors.primary : colors.text}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    ...typography.body,
    fontSize: 14,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
