import React from 'react';
import { StepScreen } from '../components/StepScreen';
import { Card } from '../components/Card';
import { NumberField } from '../components/NumberField';
import { useOnboardingStore } from '../store';
import { useStrings } from '../i18n/useStrings';
import { onboardingSchemas } from '../utils/validators';
import { useOnboardingStep } from '../hooks';

export const PotencyOptionalScreen: React.FC = () => {
  const { stepNumber, totalSteps, goNext, goBack } = useOnboardingStep('PotencyOptional');
  const profile = useOnboardingStore((state) => state.profile);
  const mergeProfile = useOnboardingStore((state) => state.mergeProfile);
  const strings = useStrings();

  const updatePotency = (value: number | null) => {
    mergeProfile({
      consumption: {
        ...profile.consumption,
        frequency: {
          ...profile.consumption.frequency,
          potencyTHC: value ?? null,
        },
      },
    });
  };

  const valid = onboardingSchemas.potency.safeParse({
    potencyTHC: profile.consumption.frequency.potencyTHC,
  }).success;

  return (
    <StepScreen
      title={strings.potency.title}
      subtitle={strings.potency.subtitle}
      step={stepNumber}
      total={totalSteps}
      onNext={goNext}
      onBack={goBack}
      nextDisabled={!valid}
    >
      <Card>
        <NumberField
          label={strings.potency.label}
          value={profile.consumption.frequency.potencyTHC ?? null}
          onChange={updatePotency}
          unitSuffix="%"
        />
      </Card>
    </StepScreen>
  );
};
