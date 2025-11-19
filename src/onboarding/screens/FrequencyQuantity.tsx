import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { NumberField } from '../components/NumberField';
import { UnitToggle } from '../components/UnitToggle';
import { strings } from '../i18n/de';
import { useOnboardingStore } from '../store';
import { useOnboardingStep } from '../hooks';
import { colors, spacing, typography } from '../theme';
import { onboardingSchemas, DEFAULT_GRAMS_PER_JOINT } from '../utils/validators';
import { unitLabels } from '../utils/format';
import type { Unit } from '../types';

export const FrequencyQuantityScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack, mode } = useOnboardingStep('FrequencyQuantity');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);

  const forms = profile.consumption.forms;
  const displayedForms = mode === 'quick' ? forms.slice(0, 1) : forms;

  const frequency = profile.consumption.frequency;

  const updateFrequency = (patch: Partial<typeof frequency>) => {
    mergeProfile({
      consumption: {
        ...profile.consumption,
        frequency: {
          ...frequency,
          ...patch,
        },
      },
    });
  };

  const handleUnitChange = (value: Unit) => {
    updateFrequency({ unit: value });
  };

  const valid = onboardingSchemas.frequency.safeParse({
    forms,
    frequency,
  }).success;

  return (
    <StepScreen
      title={strings.frequency.title}
      subtitle={strings.frequency.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <Text style={styles.label}>{strings.frequency.unitLabel}</Text>
        <UnitToggle
          value={frequency.unit}
          onChange={handleUnitChange}
          options={[
            { value: 'day', label: 'Tag' },
            { value: 'week', label: 'Woche' },
            { value: 'month', label: 'Monat' },
          ]}
        />
        {displayedForms.length === 0 ? (
          <Text style={styles.helper}>{strings.common.quickModeHint}</Text>
        ) : null}
        {displayedForms.includes('joint') ? (
          <View style={styles.section}>
            <NumberField
              label={strings.frequency.jointsPerUnit}
              value={frequency.jointsPerUnit ?? null}
              onChange={(value) => updateFrequency({ jointsPerUnit: value ?? undefined })}
              unitSuffix={unitLabels[frequency.unit]}
              helper={strings.frequency.helperJoints}
              unknownValue={DEFAULT_GRAMS_PER_JOINT}
            />
            <NumberField
              label={strings.frequency.gramsPerJoint}
              value={frequency.gramsPerJoint ?? DEFAULT_GRAMS_PER_JOINT}
              onChange={(value) => updateFrequency({ gramsPerJoint: value })}
              unitSuffix="g"
              helper={strings.frequency.helperJoints}
              unknownValue={DEFAULT_GRAMS_PER_JOINT}
            />
          </View>
        ) : null}
        {displayedForms.includes('vape-dry') || displayedForms.includes('vape-liquid') ? (
          <NumberField
            label={strings.frequency.sessionsPerUnit}
            value={frequency.sessionsPerUnit ?? null}
            onChange={(value) => updateFrequency({ sessionsPerUnit: value ?? undefined })}
            unitSuffix={unitLabels[frequency.unit]}
          />
        ) : null}
        {displayedForms.includes('bong') || displayedForms.includes('dab') ? (
          <NumberField
            label={strings.frequency.hitsPerUnit}
            value={frequency.hitsPerUnit ?? null}
            onChange={(value) => updateFrequency({ hitsPerUnit: value ?? undefined })}
            unitSuffix={unitLabels[frequency.unit]}
          />
        ) : null}
        {displayedForms.includes('edible') || displayedForms.includes('capsule') ? (
          <>
            <NumberField
              label={strings.frequency.portionsPerUnit}
              value={frequency.portionsPerUnit ?? null}
              onChange={(value) => updateFrequency({ portionsPerUnit: value ?? undefined })}
              unitSuffix={unitLabels[frequency.unit]}
            />
            <NumberField
              label={strings.frequency.mgPerPortion}
              value={frequency.mgPerPortion ?? null}
              onChange={(value) => updateFrequency({ mgPerPortion: value })}
              unitSuffix="mg"
              helper={strings.frequency.helperEdibles}
            />
          </>
        ) : null}
      </Card>
    </StepScreen>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing.sm,
  },
  helper: {
    ...typography.subheading,
    color: colors.muted,
  },
});
