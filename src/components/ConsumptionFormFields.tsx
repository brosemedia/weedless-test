import React, { useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { radius, spacing } from '../design/tokens';
import type { PaidByUser } from '../types/profile';
import type { ConsumptionFormValues, ConsumptionQuantityUnit } from '../lib/consumption';
import { useTheme } from '../theme/useTheme';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { ThemeColors } from '../theme/themes';

type Props = {
  value: ConsumptionFormValues;
  onChange: (patch: Partial<ConsumptionFormValues>) => void;
  suggestedAmount?: number | null;
};

const METHOD_OPTIONS: { key: ConsumptionFormValues['method']; label: string }[] = [
  { key: 'joint', label: 'Joint' },
  { key: 'vape', label: 'Vape' },
  { key: 'bong', label: 'Bong' },
  { key: 'edible', label: 'Edible' },
  { key: 'other', label: 'Andere' },
];

const UNIT_OPTIONS: { key: ConsumptionQuantityUnit; label: string }[] = [
  { key: 'grams', label: 'Gramm' },
  { key: 'joints', label: 'Joints' },
];

const COST_OPTIONS: { key: PaidByUser; label: string; description?: string }[] = [
  { key: 'yes', label: 'Ja, ich habe bezahlt' },
  { key: 'no', label: 'Nein, nur mitgeraucht' },
  { key: 'unknown', label: 'Weiß ich nicht / egal' },
];

export default function ConsumptionFormFields({ value, onChange, suggestedAmount }: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const placeholderColor = theme.mode === 'dark' ? 'rgba(244,247,245,0.5)' : 'rgba(74,42,22,0.4)';
  const amountPlaceholder = useMemo(() => {
    if (typeof suggestedAmount === 'number' && suggestedAmount > 0) {
      return suggestedAmount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    return 'z. B. 10';
  }, [suggestedAmount]);

  const handlePaidChange = (next: PaidByUser) => {
    if (next === 'yes') {
      if (!value.amountSpent && typeof suggestedAmount === 'number' && suggestedAmount > 0) {
        onChange({ paidByUser: next, amountSpent: String(suggestedAmount) });
        return;
      }
    } else {
      onChange({ paidByUser: next, amountSpent: '' });
      return;
    }
    onChange({ paidByUser: next });
  };

  return (
    <View style={{ gap: spacing.l }}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Konsumdetails</Text>
        <View style={{ gap: spacing.s }}>
          <Text style={styles.fieldLabel}>Menge</Text>
          <View style={styles.quantityRow}>
            <TextInput
              value={value.quantity}
              onChangeText={(text) => onChange({ quantity: text })}
              keyboardType="decimal-pad"
              placeholder="z. B. 0,5"
              placeholderTextColor={placeholderColor}
              style={[styles.input, { flex: 1 }]}
            />
            <View style={styles.unitSwitcher}>
              {UNIT_OPTIONS.map((unit) => (
                <Pressable
                  key={unit.key}
                  onPress={() => onChange({ unit: unit.key })}
                  style={[
                    styles.unitButton,
                    value.unit === unit.key && styles.unitButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitButtonLabel,
                      value.unit === unit.key && styles.unitButtonLabelActive,
                    ]}
                  >
                    {unit.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <View style={{ marginTop: spacing.m }}>
          <Text style={styles.fieldLabel}>Art</Text>
          <View style={styles.methodGrid}>
            {METHOD_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => onChange({ method: option.key })}
                style={[
                  styles.methodChip,
                  value.method === option.key && styles.methodChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.methodLabel,
                    value.method === option.key && styles.methodLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ marginTop: spacing.m }}>
          <Text style={styles.fieldLabel}>Dauer (Minuten)</Text>
          <TextInput
            value={value.durationMinutes}
            onChangeText={(text) => onChange({ durationMinutes: text })}
            keyboardType="decimal-pad"
            placeholder="optional"
            placeholderTextColor={placeholderColor}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Kosten</Text>
        <Text style={styles.helper}>Hat dich dieser Konsum etwas gekostet?</Text>
        <View style={{ gap: spacing.s }}>
          {COST_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => handlePaidChange(option.key)}
              style={[
                styles.radioRow,
                value.paidByUser === option.key && styles.radioRowActive,
              ]}
            >
              <View style={[styles.radioOuter, value.paidByUser === option.key && styles.radioOuterActive]}>
                <View
                  style={[
                    styles.radioInner,
                    value.paidByUser === option.key && styles.radioInnerActive,
                  ]}
                />
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {value.paidByUser === 'yes' ? (
          <View style={{ marginTop: spacing.m }}>
            <Text style={styles.fieldLabel}>Betrag in €</Text>
            <TextInput
              value={value.amountSpent}
              onChangeText={(text) => onChange({ amountSpent: text })}
              keyboardType="decimal-pad"
              placeholder={amountPlaceholder}
              placeholderTextColor={placeholderColor}
              style={styles.input}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      backgroundColor: colors.cardBg,
      borderRadius: radius.xl,
      padding: spacing.l,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.s,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.navy,
      marginBottom: 6,
    },
    input: {
      borderRadius: radius.l,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
      backgroundColor: colors.surface,
      fontSize: 16,
      color: colors.text,
    },
    quantityRow: {
      flexDirection: 'column',
      gap: spacing.s,
    },
    unitSwitcher: {
      flexDirection: 'row',
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      padding: 2,
    },
    unitButton: {
      flex: 1,
      borderRadius: radius.pill,
      paddingVertical: spacing.s / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unitButtonActive: {
      backgroundColor: colors.surface,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    unitButtonLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
    },
    unitButtonLabelActive: {
      color: colors.text,
    },
    methodGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.s,
    },
    methodChip: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    methodChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },
    methodLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
    },
    methodLabelActive: {
      color: colors.text,
    },
    helper: {
      fontSize: 13,
      color: colors.textMuted,
    },
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
      paddingVertical: spacing.xs,
    },
    radioRowActive: {
      backgroundColor: colors.border,
      borderRadius: radius.l,
      paddingHorizontal: spacing.s,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterActive: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    radioInnerActive: {
      backgroundColor: colors.primary,
    },
    radioLabel: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
  });
