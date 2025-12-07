import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Card, ThemedText, ThemedView } from '../../../design/theme';
import { colors, radius, spacing } from '../../../design/tokens';
import { useStore } from '../../../store/useStore';
import type { Profile } from '../../../types';
import { DEFAULT_GRAMS_PER_JOINT, normalizeProfile } from '../../../store/profileUtils';
import { DateTimePickerModal } from '../../../components/DateTimePickerModal';

type SelectOption<T extends string> = { label: string; value: T };

const LOCALE_OPTIONS: SelectOption<string>[] = [
  { label: 'Deutsch (DE)', value: 'de-DE' },
  { label: 'Deutsch (CH)', value: 'de-CH' },
  { label: 'Englisch (US)', value: 'en-US' },
];

const CURRENCY_OPTIONS: SelectOption<string>[] = [
  { label: 'Euro (€)', value: 'EUR' },
  { label: 'CHF', value: 'CHF' },
  { label: 'USD', value: 'USD' },
];

const sliderConfig = {
  pricePerGram: { min: 5, max: 30, step: 0.5, unit: '€', decimals: 2, label: 'Preis pro Gramm' },
  gramsPerDayBaseline: { min: 0, max: 5, step: 0.1, unit: 'g', decimals: 2, label: 'Konsum pro Tag (g)' },
  jointsPerDayBaseline: { min: 0, max: 10, step: 0.5, unit: 'Joints', decimals: 1, label: 'Konsum pro Tag (Joints)' },
  gramsPerJoint: { min: 0.1, max: 1.5, step: 0.05, unit: 'g', decimals: 2, label: 'Gramm je Joint' },
  avgSessionMinutes: { min: 5, max: 60, step: 1, unit: 'Min.', decimals: 0, label: 'Ø-Minuten pro Session' },
} as const;

const formatNumber = (value: number, decimals = 1) =>
  Number.isFinite(value) ? value.toFixed(decimals) : '–';

const formatDateTime = (iso: string | undefined, locale: string) => {
  if (!iso) return 'Datum wählen';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Datum wählen';
  return new Intl.DateTimeFormat(locale || 'de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default function ProfileAndOnboarding() {
  const storeProfile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const skipProfileSyncRef = useRef(false);
  const [form, setForm] = useState<Profile | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  useEffect(() => {
    skipProfileSyncRef.current = true;
    setForm(storeProfile);
  }, [storeProfile]);

  useEffect(() => {
    if (!form) return;
    if (skipProfileSyncRef.current) {
      skipProfileSyncRef.current = false;
      return;
    }
    updateProfile(form);
  }, [form, updateProfile]);

  const applyFormChange = (mapper: (prev: Profile) => Profile) => {
    setForm((prev) => {
      if (!prev) return prev;
      return normalizeProfile(mapper({ ...prev }));
    });
  };

  const handleSelect = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    applyFormChange((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (key: keyof typeof sliderConfig, value: number) => {
    const rounded = Number(value.toFixed(sliderConfig[key].decimals));
    applyFormChange((prev) => {
      const next = { ...prev };
      if (key === 'pricePerGram') {
        next.pricePerGram = rounded;
      } else if (key === 'gramsPerDayBaseline') {
        next.gramsPerDayBaseline = rounded;
        if (next.gramsPerJoint > 0) {
          next.jointsPerDayBaseline = Number((rounded / next.gramsPerJoint).toFixed(2));
        }
        next.baseline = { ...next.baseline, unit: 'g' };
      } else if (key === 'jointsPerDayBaseline') {
        next.jointsPerDayBaseline = rounded;
        next.gramsPerDayBaseline = Number((rounded * (next.gramsPerJoint || DEFAULT_GRAMS_PER_JOINT)).toFixed(3));
        next.baseline = { ...next.baseline, unit: 'joint' };
      } else if (key === 'gramsPerJoint') {
        next.gramsPerJoint = rounded;
        const grams = next.gramsPerDayBaseline;
        if (rounded > 0) {
          next.jointsPerDayBaseline = Number((grams / rounded).toFixed(2));
        }
      } else if (key === 'avgSessionMinutes') {
        next.avgSessionMinutes = rounded;
      }
      return next;
    });
  };

  const handleDateChange = (date: Date) => {
    applyFormChange((prev) => ({
      ...prev,
      pauseStartISO: date.toISOString(),
      startedAt: date.toISOString(),
    }));
  };

  const openDatePicker = () => {
    if (!form) return;
    const currentDate = form.pauseStartISO ? new Date(form.pauseStartISO) : new Date();
    setPendingDate(currentDate);
    setPickerVisible(true);
  };

  const ready = useMemo(() => Boolean(form), [form]);

  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ThemedText kind="h1">Profil & Onboarding</ThemedText>
          <ThemedText muted>
            Passe hier die wichtigsten Daten aus dem Onboarding an. Änderungen werden automatisch gespeichert und fließen in KPIs & Erinnerungen ein.
          </ThemedText>
        </View>

        {!ready ? (
          <Card style={styles.card}>
            <View style={styles.loader}>
              <ActivityIndicator color={colors.light.primary} />
              <ThemedText muted style={{ marginTop: spacing.s }}>
                Profil wird geladen …
              </ThemedText>
            </View>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <SectionTitle title="Allgemein" />
              <SelectChips
                label="Sprache & Region"
                helper="Bestimmt Zahlen- und Datumsformate."
                options={LOCALE_OPTIONS}
                value={form!.locale}
                onSelect={(value) => handleSelect('locale', value)}
              />
              <SelectChips
                label="Währung"
                helper="Nutzt Hazeless für Einsparungen."
                options={CURRENCY_OPTIONS}
                value={form!.currency}
                onSelect={(value) => handleSelect('currency', value)}
              />
              <DateField
                label="Start deiner Pause"
                helper="Wir berechnen ab hier deine Einsparungen."
                valueLabel={formatDateTime(form!.pauseStartISO, form!.locale)}
                onPress={openDatePicker}
              />
            </Card>

            <Card style={styles.card}>
              <SectionTitle title="Baseline & Konsum" />
              {(Object.keys(sliderConfig) as Array<keyof typeof sliderConfig>).map((key) => {
                const config = sliderConfig[key];
                const unitLabel = key === 'pricePerGram' ? form!.currency : config.unit;
                return (
                  <SliderField
                    key={key}
                    label={config.label}
                    helper={`Feinjustierung mit dem Slider (${config.min}-${config.max} ${unitLabel}).`}
                    value={Number(form![key] ?? 0)}
                    displayValue={`${formatNumber(Number(form![key] ?? 0), config.decimals)} ${unitLabel}`}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    onChange={(val) => handleNumberChange(key, val)}
                  />
                );
              })}
            </Card>

          </>
        )}
      </ScrollView>
      <DateTimePickerModal
        visible={pickerVisible}
        date={pendingDate ?? new Date()}
        locale={form?.locale || 'de-DE'}
        onChange={(nextDate) => setPendingDate(nextDate)}
        onDismiss={() => setPickerVisible(false)}
        onConfirm={() => {
          if (pendingDate) {
            handleDateChange(pendingDate);
          }
          setPickerVisible(false);
        }}
      />
    </ThemedView>
  );
}

const SectionTitle = ({ title }: { title: string }) => (
  <View style={{ marginBottom: spacing.s }}>
    <ThemedText kind="h2">{title}</ThemedText>
  </View>
);

type SelectProps<T extends string> = {
  label: string;
  helper?: string;
  options: SelectOption<T>[];
  value: T;
  onSelect: (value: T) => void;
};

function SelectChips<T extends string>({ label, helper, options, value, onSelect }: SelectProps<T>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {helper ? (
        <ThemedText kind="caption" muted style={styles.helper}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

type DateFieldProps = {
  label: string;
  helper?: string;
  valueLabel: string;
  onPress: () => void;
};

function DateField({ label, helper, valueLabel, onPress }: DateFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.dateButton} onPress={onPress}>
        <Text style={styles.dateButtonText}>{valueLabel}</Text>
        <Text style={styles.dateButtonHint}>Kalender öffnen</Text>
      </Pressable>
      {helper ? (
        <ThemedText kind="caption" muted style={styles.helper}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

type SliderFieldProps = {
  label: string;
  helper?: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function SliderField({ label, helper, value, displayValue, min, max, step, onChange }: SliderFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.sliderHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onSlidingComplete={onChange}
        onValueChange={onChange}
        minimumTrackTintColor={colors.light.primary}
        maximumTrackTintColor="rgba(31,61,44,0.2)"
        thumbTintColor={colors.light.primary}
      />
      {helper ? (
        <ThemedText kind="caption" muted style={styles.helper}>
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.light.surface,
  },
  content: {
    padding: spacing.l,
    gap: spacing.l,
  },
  header: {
    gap: spacing.s,
  },
  card: {
    gap: spacing.m,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.l,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.text,
  },
  helper: {
    marginTop: 2,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s * 0.9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  chipActive: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
    shadowColor: 'rgba(31,61,44,0.2)',
    shadowRadius: 6,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
  },
  chipText: {
    fontSize: 14,
    color: colors.light.text,
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: colors.light.surface,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.light.text,
    fontWeight: '600',
  },
  dateButtonHint: {
    fontSize: 12,
    color: colors.light.textMuted,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.light.primary,
  },
});
