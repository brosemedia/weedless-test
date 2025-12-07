import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { HapticSlider } from '../components/HapticSlider';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const PausePlanScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('PausePlan');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  
  const pausePlan = profile.pausePlan || {
    startDate: formatDate(new Date()),
    durationDays: 30,
    reason: '',
    active: true,
  };

  const [startDate, setStartDate] = useState(pausePlan.startDate);
  const [durationDays, setDurationDays] = useState(pausePlan.durationDays);
  const [reason, setReason] = useState(pausePlan.reason || '');
  const [active, setActive] = useState(pausePlan.active);

  const handleDurationChange = (value: number) => {
    setDurationDays(value);
    mergeProfile({
      pausePlan: {
        startDate,
        durationDays: value,
        reason,
        active,
      },
    });
  };

  const handleActiveToggle = (value: boolean) => {
    setActive(value);
    mergeProfile({
      pausePlan: {
        startDate,
        durationDays,
        reason,
        active: value,
      },
    });
  };

  const handleReasonChange = (text: string) => {
    setReason(text);
    mergeProfile({
      pausePlan: {
        startDate,
        durationDays,
        reason: text,
        active,
      },
    });
  };

  return (
    <StepScreen
      title="Deine Pause mit Hazeless"
      subtitle="Wähle Start und Dauer deiner Pause. Du kannst das später jederzeit anpassen."
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
    >
      <Card>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Startdatum</Text>
          <TextInput
            value={startDate}
            onChangeText={(text) => {
              setStartDate(text);
              mergeProfile({
                pausePlan: {
                  startDate: text,
                  durationDays,
                  reason,
                  active,
                },
              });
            }}
            placeholder="YYYY-MM-DD"
            style={styles.dateInput}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dauer (Tage)</Text>
          <HapticSlider
            value={durationDays}
            onValueChange={handleDurationChange}
            minimumValue={1}
            maximumValue={90}
            step={1}
            formatValue={(v) => `${v} Tage`}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grund/Motivation (optional)</Text>
          <TextInput
            value={reason}
            onChangeText={handleReasonChange}
            placeholder="Warum möchtest du eine Pause machen?"
            multiline
            numberOfLines={3}
            style={styles.reasonInput}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Pause direkt aktivieren</Text>
          <Switch value={active} onValueChange={handleActiveToggle} />
        </View>
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.md,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    backgroundColor: colors.surface,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    backgroundColor: colors.surface,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  toggleLabel: {
    ...typography.body,
    fontWeight: '500',
  },
});

