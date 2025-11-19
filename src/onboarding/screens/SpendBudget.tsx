import React from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { NumberField } from '../components/NumberField';
import { UnitToggle } from '../components/UnitToggle';
import { useOnboardingStore } from '../store';
import { strings } from '../i18n/de';
import { useOnboardingStep } from '../hooks';
import { onboardingSchemas } from '../utils/validators';
import { colors, spacing, typography } from '../theme';

export const SpendBudgetScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('SpendBudget');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const spend = profile.spend ?? { unit: 'week', amount: null, goalNote: null };

  const updateSpend = (patch: Partial<typeof spend>) => {
    mergeProfile({ spend: { ...spend, ...patch } });
  };

  const valid = onboardingSchemas.spend.safeParse({
    amount: spend.amount,
    unit: spend.unit,
  }).success;

  return (
    <StepScreen
      title={strings.spend.title}
      subtitle={strings.spend.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <NumberField
          label={strings.spend.amountLabel}
          value={spend.amount ?? null}
          onChange={(value) => updateSpend({ amount: value })}
          unitSuffix={profile.currency}
        />
        <Text style={styles.label}>{strings.spend.unitLabel}</Text>
        <UnitToggle
          value={spend.unit}
          onChange={(unit) => updateSpend({ unit })}
          options={[
            { value: 'day', label: 'Tag' },
            { value: 'week', label: 'Woche' },
            { value: 'month', label: 'Monat' },
          ]}
        />
        <Text style={styles.label}>{strings.spend.goalNote}</Text>
        <TextInput
          value={spend.goalNote ?? ''}
          onChangeText={(text) => updateSpend({ goalNote: text })}
          placeholder={strings.common.optional}
          style={styles.input}
          multiline
        />
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
    ...typography.body,
  },
});
