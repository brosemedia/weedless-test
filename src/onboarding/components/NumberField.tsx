import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { strings } from '../i18n/de';

interface Props {
  label: string;
  value: number | null | undefined;
  onChange: (next: number | null) => void;
  unitSuffix?: string;
  placeholder?: string;
  helper?: string;
  unknownValue?: number | null;
}

export const NumberField: React.FC<Props> = ({
  label,
  value,
  onChange,
  unitSuffix,
  placeholder,
  helper,
  unknownValue = null,
}) => {
  const [text, setText] = useState(value != null ? String(value) : '');

  useEffect(() => {
    setText(value != null ? String(value) : '');
  }, [value]);

  const handleChange = (input: string) => {
    setText(input);
    if (!input.trim()) {
      onChange(null);
      return;
    }
    const parsed = Number(input.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleUnknown = () => {
    onChange(unknownValue ?? null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder={placeholder}
        />
        {unitSuffix ? <Text style={styles.unit}>{unitSuffix}</Text> : null}
      </View>
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
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  unit: {
    ...typography.body,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  unknown: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  helper: {
    ...typography.subheading,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
});
