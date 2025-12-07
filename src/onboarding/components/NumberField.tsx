import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';
import { useStrings } from '../i18n/useStrings';

interface Props {
  label: string;
  value: number | null | undefined;
  onChange: (next: number | null) => void;
  unitSuffix?: string;
  placeholder?: string;
  helper?: string;
  unknownValue?: number | null;
  quickValues?: number[];
  step?: number;
  min?: number;
  max?: number;
}

export const NumberField: React.FC<Props> = ({
  label,
  value,
  onChange,
  unitSuffix,
  placeholder,
  helper,
  unknownValue = null,
  quickValues,
  step = 1,
  min,
  max,
}) => {
  const strings = useStrings();
  const [text, setText] = useState(value != null ? String(value) : '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setText(value != null ? String(value) : '');
  }, [value]);

  const handleChange = (input: string) => {
    // Allow empty input, numbers, and single decimal point/comma
    const cleaned = input.replace(/[^0-9,.-]/g, '').replace(',', '.');
    // Only allow one decimal point
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    
    setText(sanitized);
    
    if (!sanitized.trim()) {
      onChange(null);
      return;
    }
    const parsed = Number(sanitized);
    if (!Number.isNaN(parsed)) {
      let finalValue = parsed;
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;
      onChange(finalValue);
    }
  };

  const handleIncrement = () => {
    const current = value ?? 0;
    const next = current + step;
    const finalValue = max !== undefined ? Math.min(next, max) : next;
    onChange(finalValue);
  };

  const handleDecrement = () => {
    const current = value ?? 0;
    const next = current - step;
    const finalValue = min !== undefined ? Math.max(next, min) : next;
    onChange(finalValue);
  };

  const handleQuickValue = (quickValue: number) => {
    onChange(quickValue);
  };

  const handleUnknown = () => {
    onChange(unknownValue ?? null);
  };

  const displayValue = value != null ? (value % 1 === 0 ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')) : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
        <Pressable
          onPress={handleDecrement}
          style={styles.stepperButton}
          disabled={value != null && min !== undefined && value <= min}
        >
          <Ionicons
            name="remove"
            size={20}
            color={value != null && min !== undefined && value <= min ? colors.muted : colors.primary}
          />
        </Pressable>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={isFocused ? text : displayValue}
            onChangeText={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType="decimal-pad"
            placeholder={placeholder || '0'}
            placeholderTextColor={colors.muted}
            selectTextOnFocus
          />
          {unitSuffix && !isFocused ? (
            <Text style={styles.unit}>{unitSuffix}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={handleIncrement}
          style={styles.stepperButton}
          disabled={value != null && max !== undefined && value >= max}
        >
          <Ionicons
            name="add"
            size={20}
            color={value != null && max !== undefined && value >= max ? colors.muted : colors.primary}
          />
        </Pressable>
      </View>
      {quickValues && quickValues.length > 0 ? (
        <View style={styles.quickValuesRow}>
          {quickValues.map((quickValue) => (
            <Pressable
              key={quickValue}
              style={[styles.quickValueButton, value === quickValue && styles.quickValueButtonActive]}
              onPress={() => handleQuickValue(quickValue)}
            >
              <Text
                style={[
                  styles.quickValueText,
                  value === quickValue && styles.quickValueTextActive,
                ]}
              >
                {quickValue}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.metaRow}>
        <TouchableOpacity onPress={handleUnknown}>
          <Text style={styles.unknown}>{strings.common.unknown}</Text>
        </TouchableOpacity>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    minHeight: 56,
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  stepperButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    color: colors.text,
  },
  unit: {
    ...typography.body,
    color: colors.muted,
    marginLeft: spacing.xs,
    fontSize: 16,
  },
  quickValuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  quickValueButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickValueButtonActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  quickValueText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
  },
  quickValueTextActive: {
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  unknown: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  helper: {
    ...typography.subheading,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
});
